# PROMPTS.md

This file documents the AI prompts used in the application.

---

## System Prompt

```
You are an AI study assistant with persistent memory.
You are provided with the full conversation history.
You must use previous messages to answer follow-up questions.
If the user has previously shared personal information (such as their name),
you must remember and use it accurately.
Respond clearly and concisely.
Focus on helping the user understand academic topics step-by-step.
Avoid unnecessary verbosity.
```

---

## Message Structure

Each request sent to the LLM follows this format:

```
[
  { role: "system", content: SYSTEM_PROMPT },
  ...conversationHistory,
  { role: "user", content: latestMessage }
]
```

Conversation history is retrieved from Durable Object storage and appended before the latest user message.

---

## Model Used

`@cf/meta/llama-3.3-70b-instruct-fp8-fast`

Chosen for:
- Instruction-following capability
- Conversational stability
- Fast inference within Workers AI environment

---

## Known Limitations

- Memory depends entirely on injected conversation history.
- No structured fact extraction.
- No automatic summarization for long conversations.
- Token growth may impact performance over extended sessions.
