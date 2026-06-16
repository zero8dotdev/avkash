// @avkash/field-policy — field-group visibility seam
//
// Public surface:
//   - resolveFieldGroups: resolve caller's FieldGroupGrant for a resource
//   - invalidateFieldPolicy: evict cache after a write
//   - CRUD helpers for the field_policy table (admin routes mount on these)
//   - assertWritableFields: write-gate for routes
//   - assertQueryableFields / QueryParamAnnotation: query side-channel gate
//   - EMPLOYEE_FIELD_GROUPS: ResourceFieldGroups pilot declaration for 'employee'

export { resolveFieldGroups, invalidateFieldPolicy } from './resolver';
export { listFieldPolicies, upsertFieldPolicy, updateFieldPolicy, deleteFieldPolicy } from './crud';
export type { UpsertFieldPolicyInput, UpdateFieldPolicyInput } from './crud';
export { assertWritableFields } from './write-gate';
export { assertQueryableFields } from './query-gate';
export type { QueryParamAnnotation } from './query-gate';
export { EMPLOYEE_FIELD_GROUPS } from './employee-groups';
