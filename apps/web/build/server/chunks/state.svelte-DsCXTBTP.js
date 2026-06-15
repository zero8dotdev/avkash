import { t as noop } from './index-DX9vaW0y.js';
import './root-D7heMfFX.js';

const is_legacy = noop.toString().includes("$$") || /function \w+\(\) \{\}/.test(noop.toString());
const placeholder_url = "a:";
if (is_legacy) {
  ({
    url: new URL(placeholder_url)
  });
}
//# sourceMappingURL=state.svelte-DsCXTBTP.js.map
