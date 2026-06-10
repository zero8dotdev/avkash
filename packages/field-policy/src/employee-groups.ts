import type { ResourceFieldGroups } from '@avkash/shared';
import { FIELD_GROUPS } from '@avkash/shared';

// Employee field-group declaration (Plan 51 Piece 3 — pilot resource).
//
// Field names come from:
//   - packages/db/src/schema/employee.ts (EmployeeProfile table)
//   - packages/db/src/schema/core.ts (User table, after userDto omissions)
//
// This const is the staging module for WS5+ to import. The route pilot will
// pass this to resolveFieldGroups() and then serialize() for enforcement.
//
// Defaults matrix follows the plan's table:
//   org member (USER/MANAGER)  → basic
//   manager chain (MANAGER)    → basic + contact + employment
//   hr_admin (ADMIN/OWNER)     → all groups (read + write for most)
//   subject (maps: USER self)  → basic + contact + employment + compensation (read own)
//   identity / medical         → hr_admin only, reads AUDITED
//
// NOTE: WS5 will refine `relation` keys to match FGA relations
// ('manager', 'subject', 'hr_admin'). For now we map to Role names so the
// resolver works with ctx.role directly.

export const EMPLOYEE_FIELD_GROUPS: ResourceFieldGroups = {
  resource: 'employee',

  groups: {
    // basic: public-facing profile fields — visible to any org member
    [FIELD_GROUPS.BASIC]: [
      'id',
      'userId',
      'name',
      'image',
      'email',
      'joinedOn',
      'teamId',
      'departmentId',
      'businessUnitId',
      'locationId',
      'language',
      'role',
      'employeeCode',
      'designation',
      'isFloating',
      'workweekPatternId',
      'workweek',
      'version',
    ],

    // contact: personal contact details — visible to manager chain + HR
    [FIELD_GROUPS.CONTACT]: [
      'personalEmail',
      'personalPhone',
      'address',
      'emergencyContact',
      'phoneNumber',
    ],

    // employment: HR/employment record — visible to manager chain + HR
    [FIELD_GROUPS.EMPLOYMENT]: [
      'employmentType',
      'employmentStatus',
      'levelId',
      'workLocation',
      'reportingManagerId',
      'probationEndsOn',
      'confirmedOn',
      'exitDate',
      'exitReason',
    ],

    // compensation: salary / bank details — hr_admin + subject (own read only)
    [FIELD_GROUPS.COMPENSATION]: [
      'salary',
      'bankAccount',
      'bankIfsc',
      'bankName',
    ],

    // identity: national IDs — hr_admin only, AUDITED
    [FIELD_GROUPS.IDENTITY]: [
      'pan',
      'aadhaar',
      'passport',
      'dateOfBirth',
      'gender',
      'maritalStatus',
      'nationality',
    ],

    // medical: health / disability — hr_admin only, AUDITED
    [FIELD_GROUPS.MEDICAL]: [
      'disability',
      'conditions',
      'bloodGroup',
    ],
  },

  // Default visibility matrix.
  // Relation keys currently map to Role names (ctx.role).
  // WS5 will extend with FGA-derived relations ('manager', 'subject').
  defaults: {
    // Any authenticated member sees basic info only.
    USER: {
      [FIELD_GROUPS.BASIC]: 'read',
      [FIELD_GROUPS.CONTACT]: 'none',
      [FIELD_GROUPS.EMPLOYMENT]: 'none',
      [FIELD_GROUPS.COMPENSATION]: 'none',
      [FIELD_GROUPS.IDENTITY]: 'none',
      [FIELD_GROUPS.MEDICAL]: 'none',
    },

    // Manager sees basic + contact + employment (read); cannot write compensation/identity/medical.
    MANAGER: {
      [FIELD_GROUPS.BASIC]: 'read',
      [FIELD_GROUPS.CONTACT]: 'read',
      [FIELD_GROUPS.EMPLOYMENT]: 'read',
      [FIELD_GROUPS.COMPENSATION]: 'none',
      [FIELD_GROUPS.IDENTITY]: 'none',
      [FIELD_GROUPS.MEDICAL]: 'none',
    },

    // HR admin (ADMIN/OWNER) sees and can write all groups.
    ADMIN: {
      [FIELD_GROUPS.BASIC]: 'write',
      [FIELD_GROUPS.CONTACT]: 'write',
      [FIELD_GROUPS.EMPLOYMENT]: 'write',
      [FIELD_GROUPS.COMPENSATION]: 'write',
      [FIELD_GROUPS.IDENTITY]: 'write',
      [FIELD_GROUPS.MEDICAL]: 'write',
    },

    OWNER: {
      [FIELD_GROUPS.BASIC]: 'write',
      [FIELD_GROUPS.CONTACT]: 'write',
      [FIELD_GROUPS.EMPLOYMENT]: 'write',
      [FIELD_GROUPS.COMPENSATION]: 'write',
      [FIELD_GROUPS.IDENTITY]: 'write',
      [FIELD_GROUPS.MEDICAL]: 'write',
    },

    // Subject (the employee themselves): reads own contact + employment + compensation.
    // Write access to personal/contact fields only. Identity/medical: hr_admin only.
    // WS5 will introduce a 'subject' FGA relation to replace this role-based fallback.
    subject: {
      [FIELD_GROUPS.BASIC]: 'write',
      [FIELD_GROUPS.CONTACT]: 'write',
      [FIELD_GROUPS.EMPLOYMENT]: 'read',
      [FIELD_GROUPS.COMPENSATION]: 'read',
      [FIELD_GROUPS.IDENTITY]: 'none',
      [FIELD_GROUPS.MEDICAL]: 'none',
    },
  },

  // Reads of these groups produce audit rows (who/what/when). Batched per request.
  auditedGroups: [FIELD_GROUPS.IDENTITY, FIELD_GROUPS.MEDICAL],
};
