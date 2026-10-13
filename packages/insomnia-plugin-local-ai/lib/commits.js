// LOCAL BUILD: this file was modified relative to upstream Kong/insomnia (core@13.3.1) - see README.md
'use strict';
// AI commit-message generation from a git diff.

const { chat, extractJson } = require('./chat');

const SYSTEM_PROMPT = [
  'You are a git commit message generator. You receive a unified diff and recent commit messages.',
  'Group the changed files into logical commits (usually 1-3). Reply with ONLY a JSON array shaped:',
  '[{"message": "<conventional commit message, imperative mood, <=72 char subject, optional body after a blank line>", "files": ["<path>", ...]}]',
  'Every file from the diff must appear in exactly one commit. No prose, only the JSON array.',
].join(' ');

async function generateCommitsFromDiff(input, modelConfig) {
  const diff = typeof input === 'string' ? input : (input && input.diff) || '';
  const recent = typeof input === 'object' && input ? input.recent_commits || '' : '';
  if (!diff.trim()) {
    throw new Error('No diff provided for commit generation.');
  }
  // Keep prompts bounded; very large diffs get truncated (context limits of local models).
  const MAX_DIFF = 60000;
  const diffText = diff.length > MAX_DIFF ? diff.slice(0, MAX_DIFF) + '\n... [diff truncated]' : diff;

  const content = await chat(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Recent commits:\n${recent}\n\nDiff:\n${diffText}` },
    ],
    modelConfig,
    { timeoutMs: 180000 },
  );

  const parsed = extractJson(content);
  const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed && parsed.commits) ? parsed.commits : null;
  if (!list || list.length === 0) {
    throw new Error('LLM did not return any commits.');
  }
  return list
    .filter(c => c && c.message)
    .map(c => ({
      message: String(c.message),
      files: Array.isArray(c.files) ? c.files.map(String) : [],
    }));
}

module.exports = { generateCommitsFromDiff };
