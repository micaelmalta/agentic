#!/usr/bin/env node
/**
 * Verify that assigned agents actually run (process spawned, logs streamed).
 * Usage: node scripts/test-agent-running.mjs [BASE_URL]
 * Default BASE_URL: http://localhost:3001
 */

const BASE = process.argv[2] || 'http://localhost:3001';

async function get(path) {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`${path} ${r.status}: ${await r.text()}`);
  return r.json();
}

async function post(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  if (!r.ok) throw new Error(`${path} ${r.status}: ${await r.text()}`);
  return r.json();
}

async function main() {
  console.log('Testing if agents are really running at', BASE);
  console.log('');

  // 1. List agents; use first or create one
  let agents = await get('/api/agents');
  let agentId = agents.length ? agents[0].id : null;

  if (!agentId) {
    console.log('No agents found. Spawning one...');
    const created = await post('/api/agents', {});
    agentId = created.id;
    console.log('Spawned', agentId);
  } else {
    console.log('Using existing agent:', agentId);
  }

  // 2. Assign issue (this auto-starts the agent if idle)
  console.log('Assigning RNA-383 and starting agent...');
  const assignRes = await post(`/api/agents/${agentId}/assign`, { issueKey: 'RNA-383' });
  if (assignRes.startFailed) {
    console.warn('Assign succeeded but start failed:', assignRes.startError);
  } else {
    console.log('Assign response:', JSON.stringify(assignRes));
  }

  // 3. Wait for process to spawn and produce some output
  await new Promise((r) => setTimeout(r, 3000));

  // 4. Get agent (with processAlive and pid)
  const agent = await get(`/api/agents/${agentId}`);
  console.log('');
  console.log('Agent state:');
  console.log('  id:', agent.id);
  console.log('  status:', agent.status);
  console.log('  processAlive:', agent.processAlive);
  console.log('  pid:', agent.pid);
  console.log('  issueKey:', agent.issueKey);

  // 5. Get logs
  const { logs } = await get(`/api/agents/${agentId}/logs`);
  console.log('');
  console.log('Log lines count:', logs.length);
  if (logs.length > 0) {
    console.log('Last 5 log lines:');
    logs.slice(-5).forEach((line, i) => console.log(`  ${i + 1}. ${line.substring(0, 120)}${line.length > 120 ? '...' : ''}`));
  }

  // 6. Verdict
  console.log('');
  const reallyRunning = agent.status === 'running' && agent.processAlive === true && agent.pid != null;
  if (reallyRunning) {
    console.log('PASS: Agent is really running (process alive, pid=', agent.pid, ')');
  } else if (agent.status === 'error') {
    console.log('FAIL: Agent is in error state. Check logs for spawn/CLI errors (e.g. CLAUDE_CLI_PATH, claude not found).');
    process.exitCode = 1;
  } else if (!agent.processAlive && agent.status === 'running') {
    console.log('WARN: status is "running" but processAlive is false (process may have exited).');
    process.exitCode = 1;
  } else {
    console.log('INFO: Agent not running (status=', agent.status, ', processAlive=', agent.processAlive, '). Assign + start may have failed or process exited.');
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
