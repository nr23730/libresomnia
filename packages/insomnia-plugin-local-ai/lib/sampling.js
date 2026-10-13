// LOCAL BUILD: this file was modified relative to upstream Kong/insomnia (core@13.3.1) - see README.md
'use strict';
// MCP sampling response generation (multi-turn chat through the configured LLM).

const { chat } = require('./chat');

// The core calls this two ways:
//  - generateMcpSamplingResponse(messages, systemPrompt, modelConfig)  (worker .mjs)
//  - generateMcpSamplingResponse({ systemPrompt, messages, modelConfig }) (type signature)
async function generateMcpSamplingResponse(messagesOrParams, systemPromptMaybe, modelConfigMaybe) {
  let messages;
  let systemPrompt;
  let modelConfig;
  if (Array.isArray(messagesOrParams)) {
    messages = messagesOrParams;
    systemPrompt = systemPromptMaybe;
    modelConfig = modelConfigMaybe;
  } else {
    ({ messages, systemPrompt, modelConfig } = messagesOrParams || {});
  }
  if (!messages || messages.length === 0) {
    throw new Error('No messages provided for MCP sampling.');
  }

  const chatMessages = [];
  if (systemPrompt) {
    chatMessages.push({ role: 'system', content: String(systemPrompt) });
  }
  for (const m of messages) {
    chatMessages.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    });
  }

  const content = await chat(chatMessages, modelConfig, { timeoutMs: 180000 });
  return { content, modelConfig };
}

module.exports = { generateMcpSamplingResponse };
