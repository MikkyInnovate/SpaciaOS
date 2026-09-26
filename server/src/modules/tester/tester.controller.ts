import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import { Public } from "../../common/auth/public.decorator";

@Controller("tester")
@Public()
export class TesterController {
  @Get()
  getTester(@Res() res: Response) {
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pacia OS - Live API Console & Authorization Tester</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f293d;
      --card-hover: #172033;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --primary-hover: #0284c7;
      --success: #10b981;
      --danger: #f43f5e;
      --warning: #f59e0b;
      --code-bg: #0b1120;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 30px 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      background: linear-gradient(135deg, #38bdf8 0%, #6366f1 100%);
      color: #fff;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 14px;
      letter-spacing: 0.5px;
    }
    h1 { font-size: 22px; font-weight: 700; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 25px;
    }
    @media (max-width: 900px) {
      .grid { grid-template-columns: 1fr; }
    }
    .panel {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }
    h2 {
      font-size: 15px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-muted);
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 6px;
      color: var(--text-muted);
    }
    textarea, input {
      width: 100%;
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      color: var(--text);
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      padding: 10px 12px;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s;
    }
    textarea:focus, input:focus { border-color: var(--primary); }
    .presets {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 12px 0 20px 0;
    }
    .preset-btn {
      background: #1e293b;
      border: 1px solid #334155;
      color: #e2e8f0;
      font-size: 12px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .preset-btn:hover {
      background: #334155;
      border-color: var(--primary);
      color: #fff;
    }
    .btn-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 15px;
    }
    .api-btn {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #131d2e;
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 12px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.15s;
      text-align: left;
    }
    .api-btn:hover {
      background: var(--card-hover);
      border-color: var(--primary);
      transform: translateX(2px);
    }
    .api-btn .method {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .method.get { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
    .method.post { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .api-btn .path {
      font-family: 'JetBrains Mono', monospace;
      color: #cbd5e1;
      margin-left: 8px;
    }
    .api-btn .desc {
      font-size: 12px;
      color: var(--text-muted);
    }
    .response-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .resp-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .resp-200 { background: rgba(16, 185, 129, 0.15); color: var(--success); }
    .resp-403 { background: rgba(244, 63, 94, 0.15); color: var(--danger); }
    .resp-401 { background: rgba(245, 158, 11, 0.15); color: var(--warning); }
    .resp-404 { background: rgba(148, 163, 184, 0.15); color: var(--text-muted); }
    pre {
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 15px;
      overflow-x: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #e2e8f0;
      min-height: 350px;
      max-height: 600px;
    }
    .copy-btn {
      background: #1e293b;
      border: 1px solid #334155;
      color: var(--text-muted);
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
    }
    .copy-btn:hover { color: #fff; border-color: var(--primary); }
    .helper-box {
      background: rgba(56, 189, 248, 0.05);
      border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: 8px;
      padding: 12px;
      margin-top: 15px;
      font-size: 12px;
      color: #93c5fd;
    }
    .helper-box code {
      background: rgba(0, 0, 0, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <span class="logo-badge">PACIA OS</span>
        <h1>Live API Console & Authorization Tester</h1>
      </div>
      <div class="status-badge">
        <span style="width: 8px; height: 8px; background: var(--success); border-radius: 50%; display: inline-block;"></span>
        Port 8000 &bull; Neon Connected
      </div>
    </header>

    <div class="grid">
      <!-- Left Column: Controls & Actions -->
      <div class="panel">
        <h2>1. Active Bearer Token</h2>
        <label for="token">Bearer Token (Supports Real Clerk JWT or Mock Presets):</label>
        <textarea id="token" rows="3" placeholder="Paste your Clerk JWT (eyJ...) or click a preset below..."></textarea>

        <div class="presets">
          <button class="preset-btn" onclick="setPreset('owner')">👑 Owner (boss_man)</button>
          <button class="preset-btn" onclick="setPreset('admin')">🛡️ Admin (admin_bob)</button>
          <button class="preset-btn" onclick="setPreset('agent')">💼 Sales Agent (agent_dave)</button>
          <button class="preset-btn" onclick="setPreset('stranger')">🚫 Stranger (No DB Record)</button>
          <button class="preset-btn" onclick="setPreset('no_org')">❓ No Org In Token</button>
          <button class="preset-btn" onclick="setPreset('unsupported')">⚡ Unknown Role</button>
          <button class="preset-btn" onclick="clearToken()">Clear</button>
        </div>

        <h2>2. Endpoint Actions</h2>
        <div class="btn-group">
          <button class="api-btn" onclick="callApi('GET', '/api/v1/health')">
            <div><span class="method get">GET</span><span class="path">/health</span></div>
            <span class="desc">Public health & Neon probe</span>
          </button>

          <button class="api-btn" onclick="callApi('POST', '/api/v1/auth/sync', { workspaceName: 'Dubai Palace Realty', tier: 'enterprise', firstName: 'Ahmed', lastName: 'Al-Maktoum' })">
            <div><span class="method post">POST</span><span class="path">/auth/sync</span></div>
            <span class="desc">Explicit Onboard/Provision</span>
          </button>

          <button class="api-btn" onclick="callApi('GET', '/api/v1/auth/me')">
            <div><span class="method get">GET</span><span class="path">/auth/me</span></div>
            <span class="desc">DB Membership & Pacia Role</span>
          </button>

          <button class="api-btn" onclick="callApi('GET', '/api/v1/workspaces/current')">
            <div><span class="method get">GET</span><span class="path">/workspaces/current</span></div>
            <span class="desc">Current Workspace Details</span>
          </button>

          <button class="api-btn" onclick="callApi('GET', '/api/v1/workspaces/system-events')">
            <div><span class="method get">GET</span><span class="path">/workspaces/system-events</span></div>
            <span class="desc">List Events (events:read)</span>
          </button>

          <button class="api-btn" onclick="callApi('POST', '/api/v1/workspaces/system-events', { eventName: 'live.test.event', aggregateType: 'test', aggregateId: 'agg_live', payload: { source: 'browser_tester' } })">
            <div><span class="method post">POST</span><span class="path">/workspaces/system-events</span></div>
            <span class="desc">Emit Tenant Operational Event</span>
          </button>
        </div>

        <div class="helper-box">
          💡 <strong>How to test with your real Clerk token from localhost:3000:</strong><br>
          1. In Chrome, open DevTools Console on your running app (F12).<br>
          2. Run: <code>await window.Clerk.session.getToken()</code><br>
          3. Paste that token into the box above and click <strong>/auth/me</strong>!
        </div>
      </div>

      <!-- Right Column: Live Output -->
      <div class="panel">
        <div class="response-header">
          <h2>Response Output</h2>
          <div>
            <span id="respStatus" class="resp-badge resp-200" style="display:none;">200 OK</span>
            <span id="respLatency" style="font-size: 12px; color: var(--text-muted); margin-left: 8px;"></span>
            <button class="copy-btn" onclick="copyResponse()">Copy JSON</button>
          </div>
        </div>
        <pre id="output">// Click any endpoint action on the left to inspect the live response.</pre>
      </div>
    </div>
  </div>

  <script>
    const presets = {
      owner: "mock_token_boss_man:org_dubai_palace:owner:dubai-palace",
      admin: "mock_token_admin_bob:org_dubai_palace:admin:dubai-palace",
      agent: "mock_token_agent_dave:org_dubai_palace:sales_agent:dubai-palace",
      stranger: "mock_token_stranger_user:org_dubai_palace:member:dubai-palace",
      no_org: "mock_token_lonely_user:none:none:none",
      unsupported: "mock_token_hacker:org_dubai_palace:infiltrator_role:dubai-palace"
    };

    function setPreset(name) {
      document.getElementById('token').value = presets[name];
    }
    function clearToken() {
      document.getElementById('token').value = "";
    }

    // Set default preset
    setPreset('owner');

    async function callApi(method, path, body = null) {
      const output = document.getElementById('output');
      const statusBadge = document.getElementById('respStatus');
      const latencyBadge = document.getElementById('respLatency');
      const token = document.getElementById('token').value.trim();

      output.textContent = "Sending request to " + path + "...";
      statusBadge.style.display = "none";
      latencyBadge.textContent = "";

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }

      const options = { method, headers };
      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const startTime = performance.now();
      try {
        const res = await fetch(path, options);
        const duration = Math.round(performance.now() - startTime);
        const json = await res.json();

        statusBadge.style.display = "inline-block";
        statusBadge.textContent = res.status + " " + (res.statusText || (res.status === 200 ? "OK" : res.status === 201 ? "CREATED" : "ERROR"));
        statusBadge.className = "resp-badge " + (res.status < 300 ? "resp-200" : res.status === 401 ? "resp-401" : res.status === 403 ? "resp-403" : "resp-404");
        latencyBadge.textContent = duration + " ms";

        output.textContent = JSON.stringify(json, null, 2);
      } catch (err) {
        statusBadge.style.display = "inline-block";
        statusBadge.textContent = "NETWORK ERROR";
        statusBadge.className = "resp-badge resp-403";
        output.textContent = JSON.stringify({ error: err.message }, null, 2);
      }
    }

    function copyResponse() {
      const text = document.getElementById('output').textContent;
      navigator.clipboard.writeText(text);
      alert('Copied response JSON to clipboard!');
    }
  </script>
</body>
</html>`);
  }
}
