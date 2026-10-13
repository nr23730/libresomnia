// LOCAL BUILD: this file was modified relative to upstream Kong/insomnia (core@13.3.1) - see README.md
'use strict';
// AI mock-route generation: parse an OpenAPI spec, ask the configured local LLM
// for one realistic example response per operation.

const { chat, extractJson } = require('./chat');

const SYSTEM_PROMPT = [
  'You are an API mock server generator. You receive a list of HTTP operations from an OpenAPI spec.',
  'Reply with ONLY a JSON array, one element per operation, each shaped exactly:',
  '{"path": <path as given>, "method": <method as given, uppercase>, "statusCode": <number>, "headers": [{"name": "Content-Type", "value": "application/json"}], "mimeType": "application/json", "body": <string with the example response body, JSON-encoded as a string>}',
  'Use the documented status codes where present (else 200), and generate realistic example data for the response schema. No prose, only the JSON array.',
].join(' ');

function parseSpec(text) {
  const trimmed = String(text).trim();
  let doc;
  try {
    doc = JSON.parse(trimmed);
  } catch (e) {
    const yaml = require('js-yaml');
    doc = yaml.load(trimmed);
  }
  if (!doc || typeof doc !== 'object' || !doc.paths) {
    throw new Error('Input is not a valid OpenAPI document (no paths found).');
  }
  return doc;
}

// Minimal $ref resolver (component schemas only) for example generation hints.
function deref(node, root, depth) {
  depth = depth || 0;
  if (!node || typeof node !== 'object' || depth > 6) {
    return node;
  }
  if (typeof node.$ref === 'string' && node.$ref.startsWith('#/')) {
    const parts = node.$ref.slice(2).split('/');
    let target = root;
    for (const p of parts) {
      target = target && target[p.replace(/~1/g, '/').replace(/~0/g, '~')];
    }
    return deref(target, root, depth + 1);
  }
  if (Array.isArray(node)) {
    return node.map(n => deref(n, root, depth + 1));
  }
  const out = {};
  for (const k of Object.keys(node)) {
    out[k] = deref(node[k], root, depth + 1);
  }
  return out;
}

function schemaHint(schema, root) {
  if (!schema) {
    return 'object';
  }
  const s = deref(schema, root);
  try {
    return JSON.stringify(s).slice(0, 800);
  } catch (e) {
    return 'object';
  }
}

function collectOperations(doc) {
  const ops = [];
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
  for (const [path, pathItemRaw] of Object.entries(doc.paths || {})) {
    const pathItem = deref(pathItemRaw, doc);
    if (!pathItem) continue;
    for (const method of methods) {
      const op = pathItem[method];
      if (!op) continue;
      const responses = {};
      for (const [code, respRaw] of Object.entries(op.responses || {})) {
        const resp = deref(respRaw, doc);
        const content = resp && resp.content ? deref(resp.content, doc) : undefined;
        const jsonMedia = content && (content['application/json'] || Object.values(content)[0]);
        responses[code] = jsonMedia && jsonMedia.schema ? schemaHint(jsonMedia.schema, doc) : 'none';
      }
      ops.push({
        path,
        method: method.toUpperCase(),
        description: op.summary || op.description || '',
        responses,
      });
    }
  }
  if (ops.length === 0) {
    throw new Error('OpenAPI document contains no operations.');
  }
  return ops;
}

async function generateRoutesForOps(ops, modelConfig, options) {
  const useDynamic = options && options.useDynamicMockResponses;
  const userPrompt = JSON.stringify(
    {
      operations: ops,
      dynamicResponses: !!useDynamic,
      note: useDynamic
        ? 'Where sensible, put small template expressions like {{faker.internet.email}} or {{request.query.id}} into body values.'
        : 'Generate static realistic example values.',
    },
    null,
    0,
  );

  const content = await chat(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    modelConfig,
    { responseFormatJson: false, timeoutMs: 180000 },
  );

  const parsed = extractJson(content);
  const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed && parsed.routes) ? parsed.routes : null;
  if (!list) {
    throw new Error('LLM did not return a JSON array of routes.');
  }

  const byKey = new Map();
  for (const op of ops) {
    byKey.set(`${op.method} ${op.path}`, op);
  }

  const routes = [];
  for (const item of list) {
    if (!item || !item.path || !item.method) continue;
    const method = String(item.method).toUpperCase();
    const key = `${method} ${item.path}`;
    if (!byKey.has(key)) continue;
    let body = item.body;
    if (body != null && typeof body !== 'string') {
      body = JSON.stringify(body, null, 2);
    }
    routes.push({
      path: item.path,
      method,
      statusCode: Number(item.statusCode) || 200,
      headers:
        Array.isArray(item.headers) && item.headers.length
          ? item.headers.filter(h => h && h.name).map(h => ({ name: String(h.name), value: String(h.value ?? '') }))
          : [{ name: 'Content-Type', value: 'application/json' }],
      mimeType: item.mimeType || 'application/json',
      body: body != null ? body : '{}',
    });
  }
  if (routes.length === 0) {
    throw new Error('LLM routes did not match any operation in the spec.');
  }
  return routes;
}

async function generateMockRouteDataFromOpenAPISpec(openApiSpec, modelConfig, options) {
  const doc = parseSpec(openApiSpec);
  const ops = collectOperations(doc);
  return generateRoutesForOps(ops, modelConfig, options);
}

async function generateMockRouteDataFromText(specText, modelConfig, options) {
  return generateMockRouteDataFromOpenAPISpec(specText, modelConfig, options);
}

async function generateMockRouteDataFromUrl(specUrl, modelConfig, options) {
  const { URL } = require('node:url');
  const lib = specUrl.startsWith('https:') ? require('node:https') : require('node:http');
  const text = await new Promise((resolve, reject) => {
    const req = lib.get(specUrl, { timeout: 30000 }, res => {
      if ((res.statusCode || 0) >= 400) {
        reject(new Error(`Fetching spec failed with HTTP ${res.statusCode}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('timeout', () => req.destroy(new Error('Fetching spec timed out')));
    req.on('error', reject);
  });
  return generateMockRouteDataFromOpenAPISpec(text, modelConfig, options);
}

module.exports = {
  generateMockRouteDataFromOpenAPISpec,
  generateMockRouteDataFromText,
  generateMockRouteDataFromUrl,
};
