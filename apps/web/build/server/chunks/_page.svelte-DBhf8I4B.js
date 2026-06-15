import { x as head, m as attr, n as escape_html } from './index-DX9vaW0y.js';
import './auth-client-53TeYoKo.js';
import './root-D7heMfFX.js';
import './state.svelte-DsCXTBTP.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let email = "";
    let password = "";
    let loading = false;
    head("1x05zx6", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Sign in — Avkash</title>`);
      });
    });
    $$renderer2.push(`<div class="login-page svelte-1x05zx6"><div class="login-card svelte-1x05zx6" style="animation: fadeInUp 0.4s ease forwards;"><div class="login-logo svelte-1x05zx6">avk<span class="svelte-1x05zx6">|</span>ash</div> <p class="login-subtitle svelte-1x05zx6">HR Platform · Sign in to continue</p> <form novalidate=""><div class="field svelte-1x05zx6"><label for="email" class="svelte-1x05zx6">Email</label> <input id="email" type="email"${attr("value", email)} placeholder="you@company.com" autocomplete="email" required="" class="svelte-1x05zx6"/></div> <div class="field svelte-1x05zx6"><label for="password" class="svelte-1x05zx6">Password</label> <input id="password" type="password"${attr("value", password)} placeholder="••••••••" autocomplete="current-password" required="" class="svelte-1x05zx6"/></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <button type="submit" class="submit-btn svelte-1x05zx6"${attr("disabled", loading, true)}>${escape_html("Sign in")}</button></form> <p class="hint svelte-1x05zx6">Demo: priya@meridian-demo.example.com / AvkashDemo@2026</p></div></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DBhf8I4B.js.map
