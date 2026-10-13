// LOCAL BUILD: this file was modified relative to upstream Kong/insomnia (core@13.3.1) - see README.md
'use strict';
// OpenAI-compatible chat-completion client shared by all local AI features.

const https = require('node:https');
const http = require('node:http');
const { URL } = require('node:url');

/**
 * Resolve the chat-completions endpoint + auth from an Insomnia ModelConfig.
 * Supported backends: 'url' (config.url is the base, e.g. https://host/v1),
 * 'openai' (config.baseURL or api.openai.com). Other backends raise a clear error.
 */
function resolveEndpoint(modelConfig) {
  if (!modelConfig) {
    throw new Error('No LLM model configured. Enable one in Settings > AI.');
  }
  const { backend } = modelConfig;
  let base;
  if (backend === 'url') {
    base = modelConfig.url || modelConfig.baseURL;
    if (!base) {
      throw new Error("AI backend 'url' has no URL configured.");
    }
  } else if (backend === 'openai') {
    base = modelConfig.baseURL || 'https://api.openai.com/v1';
  } else {
    throw new Error(
      `AI backend '${backend}' is not supported by the local AI plugin. Use the 'url' backend with an OpenAI-compatible endpoint.`,
    );
  }
  if (!/\/chat\/completions$/.test(base)) {
    base = base.replace(/\/+$/, '') + '/chat/completions';
  }
  return { endpoint: new URL(base), apiKey: modelConfig.apiKey };
}

function httpJson(method, url, headers, bodyObj, timeoutMs) {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http;
    const payload = bodyObj === undefined ? null : Buffer.from(JSON.stringify(bodyObj), 'utf8');
    const req = lib.request(
      url,
      {
        method,
        headers: {
          ...headers,
          ...(payload
            ? { 'Content-Type': 'application/json', 'Content-Length': String(payload.length) }
            : {}),
        },
        timeout: timeoutMs || 120000,
      },
      res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          if ((res.statusCode || 0) >= 400) {
            reject(new Error(`LLM HTTP ${res.statusCode}: ${text.slice(0, 500)}`));
            return;
          }
          try {
            resolve(JSON.parse(text));
          } catch (e) {
            reject(new Error(`LLM returned invalid JSON: ${text.slice(0, 300)}`));
          }
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('LLM request timed out')));
    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

/**
 * Single-shot chat completion. Returns the assistant text.
 */
async function chat(messages, modelConfig, opts) {
  const { endpoint, apiKey } = resolveEndpoint(modelConfig);
  const headers = { Accept: 'application/json' };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  const body = {
    model: modelConfig.model,
    messages,
  };
  if (modelConfig.sendMaxTokens !== false && modelConfig.maxTokens) {
    body.max_tokens = modelConfig.maxTokens;
  }
  if (modelConfig.sendTemperature !== false && modelConfig.temperature != null) {
    body.temperature = modelConfig.temperature;
  }
  if (modelConfig.sendTopP !== false && modelConfig.topP != null) {
    body.top_p = modelConfig.topP;
  }
  if (opts && opts.responseFormatJson) {
    body.response_format = { type: 'json_object' };
  }
  const json = await httpJson('POST', endpoint, headers, body, opts && opts.timeoutMs);
  const choice = json && json.choices && json.choices[0];
  const content = choice && choice.message && choice.message.content;
  if (!content) {
    throw new Error('LLM returned no content.');
  }
  return content;
}

/**
 * Extract a JSON value from an LLM reply: raw JSON, ```json fences, or the
 * outermost {...}/[...] span.
 */
function extractJson(text) {
  const trimmed = String(text).trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch (e) {
    // fall through to span extraction
  }
  for (const open of ['[', '{']) {
    const close = open === '[' ? ']' : '}';
    const start = candidate.indexOf(open);
    const end = candidate.lastIndexOf(close);
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch (e) {
        /* try next */
      }
    }
  }
  throw new Error('LLM reply did not contain valid JSON.');
}

module.exports = { chat, extractJson, resolveEndpoint, httpJson };
