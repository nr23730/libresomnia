// LOCAL BUILD: this file was modified relative to upstream Kong/insomnia (core@13.3.1) - see README.md
'use strict';
// Local AI plugin for Libresomnia (replacement for the proprietary @kong/insomnia-plugin-ai).
// Talks to any OpenAI-compatible /chat/completions endpoint. No telemetry, no cloud accounts.

const { chat, extractJson } = require('./lib/chat');

module.exports = {
  chat,
  extractJson,
  ...require('./lib/mock-routes'),
  ...require('./lib/commits'),
  ...require('./lib/sampling'),
};
