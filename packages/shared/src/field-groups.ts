// Field-level visibility contracts (types only).
// Granularity is field GROUPS (sensitivity classes: basic/contact/compensation/
// identity/medical), never individual fields. Enforcement happens at exactly two
// points — serialize (read projection) and validateBody (write gate, 403
// FORBIDDEN_FIELD) — never in domain code. Hidden fields are OMITTED on the wire
// (not null, not masked). Query params (sort/filter) are gated by the same map to
// close the inference side-channel.

/** 'write' implies 'read'. 'none' hides the group entirely. */
export type FieldGroupAccess = 'read' | 'write' | 'none';

/** A module's field-group declaration for one resource, carried in its manifest.
 *  Per-org `field_policy` rows override these defaults; resolution is
 *  org row → manifest default, cached per (orgId, resource). */
export interface ResourceFieldGroups {
  /** Resource key, matching the DTO it shapes — e.g. 'employee'. */
  resource: string;
  /** Group name → the DTO field names it contains. A field in no group is
   *  ungrouped ⇒ always visible (the 'basic' tier is still declared explicitly). */
  groups: Record<string, readonly string[]>;
  /** Default matrix: relation (FGA relation or Role name) → group → access. */
  defaults: Record<string, Record<string, FieldGroupAccess>>;
  /** Groups whose READS are audited (who/what/when) — e.g. ['identity', 'medical']. */
  auditedGroups?: readonly string[];
}

/** Resolved per-caller view used by serialize/validateBody: which groups the
 *  caller may read, and which they may write. Produced by the field-policy resolver. */
export interface FieldGroupGrant {
  resource: string;
  read: ReadonlySet<string>;
  write: ReadonlySet<string>;
}

// Canonical group names for core HR resources. Not a closed set — modules may
// declare their own — but reusing these keeps tenant admin UX coherent.
export const FIELD_GROUPS = {
  BASIC: 'basic',
  CONTACT: 'contact',
  EMPLOYMENT: 'employment',
  COMPENSATION: 'compensation',
  IDENTITY: 'identity',
  MEDICAL: 'medical',
} as const;

export type CoreFieldGroup = (typeof FIELD_GROUPS)[keyof typeof FIELD_GROUPS];
