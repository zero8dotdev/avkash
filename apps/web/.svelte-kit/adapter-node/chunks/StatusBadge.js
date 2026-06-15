import { a as attr_class, d as stringify, c as escape_html, f as derived } from "./index.js";
function StatusBadge($$renderer, $$props) {
  let { status, size = "md" } = $$props;
  const colorMap = {
    APPROVED: "green",
    PENDING: "amber",
    REJECTED: "red",
    CANCELLED: "muted",
    DELETED: "red",
    ACTIVE: "green",
    INACTIVE: "muted"
  };
  const labelMap = {
    APPROVED: "Approved",
    PENDING: "Pending",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
    DELETED: "Deleted",
    ACTIVE: "Active",
    INACTIVE: "Inactive"
  };
  let color = derived(() => colorMap[status] ?? "muted");
  let label = derived(() => labelMap[status] ?? status);
  $$renderer.push(`<span${attr_class(`badge ${stringify(color())}`, "svelte-12nqn7t", { "sm": size === "sm" })}>${escape_html(label())}</span>`);
}
export {
  StatusBadge as S
};
