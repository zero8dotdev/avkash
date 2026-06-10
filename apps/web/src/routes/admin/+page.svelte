<script lang="ts">
  import type { PageData } from './$types';
  // Admin stub page; data not yet consumed
  let { data: _data }: { data: PageData } = $props();
</script>
<svelte:head><title>Admin — Avkash</title></svelte:head>
<div style="max-width:700px;margin:0 auto;animation:fadeInUp 0.3s ease forwards">
  <h1 style="font-size:22px;font-weight:600;margin-bottom:8px">Admin</h1>
  <p style="color:var(--muted);font-size:13px">Admin panel coming in W2. Org settings, leave type management, holiday calendar imports.</p>
</div>
