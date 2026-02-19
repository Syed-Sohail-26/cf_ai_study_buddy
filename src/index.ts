export interface Env {
  AI: any;
  CHAT_MEMORY: DurableObjectNamespace;
}

// Durable Object for conversation memory
export class ChatMemory {
  state: DurableObjectState;
  messages: Array<{role: string, content: string}> = [];

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/history') {
      // Get conversation history
      this.messages = (await this.state.storage.get('messages')) || [];
      return new Response(JSON.stringify(this.messages), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
	if (url.pathname === '/add' && request.method === 'POST') {
	const body = await request.json() as { role: string; content: string };
	const { role, content } = body;

	this.messages = (await this.state.storage.get('messages')) || [];
	this.messages.push({ role, content });
	await this.state.storage.put('messages', this.messages);

	return new Response(JSON.stringify({ success: true }), {
		headers: { 'Content-Type': 'application/json' }
	});
	}

	if (url.pathname === '/clear' && request.method === 'POST') {
	await this.state.storage.delete('messages');
	this.messages = [];

	return new Response(JSON.stringify({ success: true }), {
		headers: { 'Content-Type': 'application/json' }
	});
	}

    
    return new Response('Not found', { status: 404 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Chat endpoint
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      try {
		const body = await request.json() as { message: string; userId?: string };
		const { message, userId } = body;        
        // Get Durable Object instance for this user
        const id = env.CHAT_MEMORY.idFromName(userId || 'default');
        const stub = env.CHAT_MEMORY.get(id);
        
		// Get conversation history
		const historyResponse = await stub.fetch('http://fake/history');
		let history: Array<{role: string, content: string}> = [];

		if (historyResponse.ok) {
		history = await historyResponse.json();
		}

		// Build messages array for LLM
		const messages = [
		{ role: 'system', content: `
			You are an AI study assistant with persistent memory.
			You are provided with the full conversation history.
			You must use previous messages to answer follow-up questions.
			If the user has previously shared personal information like their name,
			you must remember and use it accurately.
			Respond clearly and concisely.
`		}
		,
		...history,
		{ role: 'user', content: message }
		];
        
        // Call Workers AI with Llama 3.3
        const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages: messages
        });
        
		let aiResponse =
		response?.response ||
		response?.result?.response;


        console.log("HISTORY SENT TO AI:", history);
		if (!aiResponse) {
 		 aiResponse = "I couldn't generate a response.";
		}

        // Store user message and AI response in history
		await stub.fetch('http://fake/add', {
		method: 'POST',
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ role: 'user', content: message })
		});

        
        await stub.fetch('http://fake/add', {
          method: 'POST',
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ role: 'assistant', content: aiResponse })
		});
        
        return new Response(JSON.stringify({ response: aiResponse }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Clear history endpoint
    if (url.pathname === '/api/clear' && request.method === 'POST') {
      const body = await request.json() as { userId?: string };
	  const { userId } = body;
      const id = env.CHAT_MEMORY.idFromName(userId || 'default');
      const stub = env.CHAT_MEMORY.get(id);
      await stub.fetch('http://fake/clear', { method: 'POST' });
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // For all other requests, return 404
    return new Response('Not found', { status: 404 });
  }
};