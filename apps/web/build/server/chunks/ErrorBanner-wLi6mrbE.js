import { n as escape_html, y as derived } from './index-DX9vaW0y.js';

/* empty css                                          */
function ErrorBanner($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { error, onDismiss } = $$props;
    let parsed = derived(() => typeof error === "string" ? { code: "ERROR", message: error } : error);
    if (parsed()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="error-banner svelte-vde8u4" role="alert"><div class="error-inner svelte-vde8u4"><div class="error-left svelte-vde8u4"><span class="error-code svelte-vde8u4">${escape_html(parsed().code)}</span> <span class="error-msg svelte-vde8u4">${escape_html(parsed().message)}</span> `);
      if (parsed().details && Object.keys(parsed().details).length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="error-details svelte-vde8u4">${escape_html(JSON.stringify(parsed().details))}</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> `);
      if (onDismiss) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button class="dismiss-btn svelte-vde8u4" aria-label="Dismiss error">✕</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { ErrorBanner as E };
//# sourceMappingURL=ErrorBanner-wLi6mrbE.js.map
