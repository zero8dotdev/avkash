<script lang="ts">
  // Chapter 0 — Introduction / Orientation
  const personas = [
    { name: 'Priya Sharma',  role: 'ADMIN',   badgeClass: 'admin',   team: 'General',   email: 'priya@meridian-demo.example.com' },
    { name: 'Rohan Mehta',   role: 'MANAGER', badgeClass: 'manager', team: 'Assembly',  email: 'rohan@meridian-demo.example.com' },
    { name: 'Dev Iyer',      role: 'MANAGER', badgeClass: 'manager', team: 'Logistics', email: 'dev@meridian-demo.example.com' },
    { name: 'Sara Khan',     role: 'USER',    badgeClass: 'user',    team: 'Assembly',  email: 'sara@meridian-demo.example.com' },
    { name: 'Anita Pillai',  role: 'USER',    badgeClass: 'user',    team: 'General',   email: 'anita@meridian-demo.example.com' },
  ];
</script>

<div class="scene intro-scene">
  <div class="intro-header">
    <div class="org-logo-badge">M</div>
    <div>
      <h1 class="intro-org-name">Meridian Manufacturing Pvt. Ltd.</h1>
      <p class="intro-org-sub">Coimbatore Plant (Assembly) · Bengaluru HQ (Logistics) · Live seed data</p>
    </div>
  </div>

  <div class="intro-grid">
    <div class="intro-card">
      <div class="intro-card-label">Business Units</div>
      <div class="intro-card-value">Plants + Corporate</div>
      <div class="intro-card-detail">2 BUs, org id 6a5109da</div>
    </div>
    <div class="intro-card">
      <div class="intro-card-label">Departments</div>
      <div class="intro-card-value">Manufacturing · Finance</div>
      <div class="intro-card-detail">Assembly + Logistics under Mfg</div>
    </div>
    <div class="intro-card">
      <div class="intro-card-label">Demo Personas</div>
      <div class="intro-card-value">5 active users</div>
      <div class="intro-card-detail">Password: AvkashDemo@2026</div>
    </div>
  </div>

  <div class="persona-table">
    <div class="pt-header">
      <span>Name</span>
      <span>Role</span>
      <span>Team</span>
      <span>Email</span>
    </div>
    {#each personas as p (p.email)}
      <div class="pt-row">
        <span class="pt-name">{p.name}</span>
        <span class="badge {p.badgeClass}">{p.role}</span>
        <span class="pt-team">{p.team}</span>
        <span class="pt-email">{p.email}</span>
      </div>
    {/each}
  </div>

  <div class="intro-note">
    <span class="note-label">Org ID</span>
    <span class="note-val">6a5109da-bad7-4515-9b0c-7ecff8dc9448</span>
    <span class="note-sep">·</span>
    <span class="note-label">API</span>
    <span class="note-val">http://localhost:3001</span>
  </div>
</div>

<div class="narration">
  <h3>Welcome to Avkash v2</h3>
  <p>
    This player walks through <span class="highlight">9 chapters</span> — from org hierarchy to half-day leave.
    Each chapter shows a real product capability.
  </p>
  <p>
    The <span class="highlight">Meridian Manufacturing</span> org is fully seeded in the live API.
    Chapters <span class="highlight" style="color:var(--green)">LIVE</span> make real API calls;
    chapters <span class="highlight" style="color:var(--amber)">SCRIPTED</span> animate against
    static data (seed data pending for that feature).
  </p>
  <p>
    Use <strong>← →</strong> arrow keys or the prev/next buttons to advance.
    Click any chapter pill to jump directly.
  </p>
  <p style="color:var(--muted);font-size:12px;margin-top:auto;">
    Presenter tip: sign in as <strong>Priya Sharma</strong> (ADMIN) for full API visibility.
    Sara Khan (USER, Assembly) is the leave-demo persona.
  </p>
</div>

<style>
  .intro-scene {
    flex: 0 0 60%;
    padding: 40px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .intro-header {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .org-logo-badge {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    background: linear-gradient(135deg, #1c3b8a 0%, #3563d4 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 26px;
    color: #fff;
    flex-shrink: 0;
  }

  .intro-org-name {
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
    line-height: 1.2;
  }

  .intro-org-sub {
    color: var(--muted);
    font-size: 12px;
    margin-top: 3px;
  }

  .intro-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .intro-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 16px;
  }

  .intro-card-label {
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 4px;
  }

  .intro-card-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  .intro-card-detail {
    font-size: 11px;
    color: var(--muted);
    margin-top: 2px;
  }

  .persona-table {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .pt-header {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr 1fr 2fr;
    padding: 8px 14px;
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
  }

  .pt-row {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr 1fr 2fr;
    padding: 10px 14px;
    align-items: center;
    border-bottom: 1px solid var(--border);
    font-size: 12px;
  }

  .pt-row:last-child { border-bottom: none; }

  .pt-name  { font-weight: 500; color: var(--text); }
  .pt-team  { color: var(--muted); }
  .pt-email { color: var(--muted); font-family: var(--font-mono); font-size: 11px; }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    width: fit-content;
  }
  .badge.admin   { background: rgba(248,81,73,0.15);  color: var(--red); }
  .badge.manager { background: rgba(88,166,255,0.15); color: var(--blue); }
  .badge.user    { background: rgba(139,148,158,0.15);color: var(--muted); }

  .intro-note {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
    padding: 10px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  .note-label { color: var(--muted); font-size: 10px; }
  .note-val   { color: var(--text); }
  .note-sep   { color: var(--border); }

  .narration {
    flex: 0 0 40%;
    background: var(--surface);
    border-left: 1px solid var(--border);
    padding: 40px 32px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .narration h3 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--muted);
    margin-bottom: 4px;
  }
  .narration p { color: var(--text); line-height: 1.7; font-size: 14px; }
  .highlight   { color: var(--blue); font-weight: 500; }
</style>
