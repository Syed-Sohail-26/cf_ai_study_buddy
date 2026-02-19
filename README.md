# cf_ai_study_buddy

An AI-powered Study Assistant built on Cloudflare Workers using Workers AI and Durable Objects for persistent conversational memory.

## 🚀 Overview

AI Study Buddy is a conversational study assistant that helps users review academic topics through interactive Q&A.

### Tech Stack
- Cloudflare Workers
- Workers AI (Llama 3.3 70B Instruct)
- Durable Objects (SQLite-backed storage)
- Static frontend (HTML/CSS/JS)

Each user is mapped to a unique Durable Object instance using a persistent `userId`, enabling isolated conversational memory.

---

## 🧠 Architecture

### LLM Layer
Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`  
Used for contextual Q&A with full conversation history injection.

### Workflow & Coordination
The main Worker:
- Parses requests
- Retrieves memory from Durable Object
- Calls Workers AI
- Stores conversation turns
- Returns structured JSON response

### Memory System
Each user is assigned a Durable Object instance:
```
const id = env.CHAT_MEMORY.idFromName(userId);
```

Conversation history is stored in SQLite-backed storage and retrieved before each AI call.

---

## 🛠 Run Locally

```bash
npm install
wrangler dev
```

Open:
http://127.0.0.1:8787

---

## 🌍 Deploy

Ensure Durable Object migration exists in `wrangler.jsonc`:

```json
"migrations": [
  {
    "tag": "v1",
    "new_sqlite_classes": ["ChatMemory"]
  }
]
```

Then deploy:

```bash
wrangler deploy
```

---

## 📌 Known Issues

1. Chat history persistence has occasional inconsistencies and requires further refinement.
2. Markdown responses are not rendered properly in the UI.
3. No streaming response support.
4. No rate limiting or authentication layer.
5. UI improvements needed for better message formatting and responsiveness.

---

## 🔮 Future Improvements

- Structured memory extraction
- Conversation summarization
- Markdown rendering
- Streaming AI responses
- Voice input integration
- Authentication & user accounts

---

## 📂 Structure

```
/public
/src
wrangler.jsonc
README.md
PROMPTS.md
```

---

## 🎯 Design Goals

- Demonstrate LLM integration on Workers AI
- Showcase Durable Object state management
- Implement per-user conversational memory
- Build a clean serverless architecture
