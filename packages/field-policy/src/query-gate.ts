import { ForbiddenError } from '@avkash/shared';
import type { FieldGroupGrant } from '@avkash/shared';

/**
 * Annotation that ties a query parameter to the field group it draws from.
 * Routes declare which groups their sort/filter params use, then call
 * assertQueryableFields to enforce at the read boundary.
 *
 * Example:
 *   const annotated: QueryParamAnnotation[] = [
 *     { param: 'sort', value: 'salary',    group: 'compensation' },
 *     { param: 'sort', value: 'pan',       group: 'identity' },
 *     { param: 'salary_gt',               group: 'compensation' },
 *   ];
 */
export interface QueryParamAnnotation {
  /** Query parameter name, e.g. 'sort', 'filter', 'salary_gt'. */
  param: string;
  /**
   * If the param has a known set of sensitive values (e.g. sort=salary),
   * list them here. When omitted, ANY value of the param triggers the check.
   */
  value?: string;
  /** The field group this param draws from. */
  group: string;
}

/**
 * Query side-channel gate: rejects sort/filter/search params that draw on
 * field groups the caller cannot read. Pure function — no DB calls.
 *
 * Wire up AFTER validateQuery (params already validated). Opt-in per route.
 * WS5 will adopt this for the employee pilot routes.
 *
 * @param grant      Resolved FieldGroupGrant for the caller.
 * @param groups     group name → DTO field names (from ResourceFieldGroups.groups).
 * @param params     The parsed query params (flat string→string map).
 * @param annotated  Route-supplied list of sensitive params with group mappings.
 * @throws ForbiddenError('FORBIDDEN_FIELD') when restricted params are present.
 */
export function assertQueryableFields(
  grant: FieldGroupGrant,
  groups: Record<string, readonly string[]>,
  params: Record<string, string | undefined>,
  annotated: QueryParamAnnotation[]
): void {
  const forbidden: string[] = [];

  for (const annotation of annotated) {
    const paramValue = params[annotation.param];
    if (paramValue === undefined) continue; // param not present — nothing to check

    // If this annotation targets a specific value (e.g. sort=salary), only
    // enforce when the param's value matches. Otherwise the whole param is gated.
    const relevant =
      annotation.value === undefined || paramValue === annotation.value;
    if (!relevant) continue;

    if (!grant.read.has(annotation.group)) {
      const label = annotation.value
        ? `${annotation.param}=${annotation.value}`
        : annotation.param;
      forbidden.push(label);
    }
  }

  // Also gate raw field-name params (e.g. ?salary_gt=50000) by checking if the
  // param name itself matches any field in an unreadable group.
  const fieldToGroup = buildFieldGroupIndex(groups);
  for (const [paramName, paramValue] of Object.entries(params)) {
    if (paramValue === undefined) continue;
    const group = fieldToGroup.get(paramName);
    if (group && !grant.read.has(group)) {
      forbidden.push(paramName);
    }
  }

  if (forbidden.length > 0) {
    throw new ForbiddenError('FORBIDDEN_FIELD', { params: forbidden });
  }
}

/** Build a reverse index: field name → group name. Memoised per-call for speed. */
function buildFieldGroupIndex(groups: Record<string, readonly string[]>): Map<string, string> {
  const index = new Map<string, string>();
  for (const [groupName, fields] of Object.entries(groups)) {
    for (const field of fields) {
      index.set(field, groupName);
    }
  }
  return index;
}
