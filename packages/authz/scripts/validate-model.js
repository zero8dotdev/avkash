#!/usr/bin/env node
// model:test — CI-runnable DSL validation script (Plan 51 WS2).
//
// Validates core.fga using @openfga/syntax-transformer (no live FGA required).
// Exits 0 on success, 1 on any validation error.
//
// Note: Full store-test execution (check/list_objects assertions against a live FGA)
// requires the @openfga/cli binary which is not yet published to npm. The store-test
// YAML (core.fga.yaml) is authored in standard format for when the binary is available.
// This script performs what is possible without a live server: DSL parse + transform.

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const { transformer, validator } = require('@openfga/syntax-transformer');

const modelPath = resolve(__dirname, '..', 'model', 'core.fga');

let dsl;
try {
  dsl = readFileSync(modelPath, 'utf-8');
} catch (err) {
  console.error(`[model:test] ERROR: cannot read ${modelPath}: ${err.message}`);
  process.exit(1);
}

console.log(`[model:test] Validating ${modelPath}`);

// Step 1: validateDSL — returns error array or undefined for clean.
const dslErrors = validator.validateDSL(dsl);
if (dslErrors && dslErrors.length > 0) {
  console.error('[model:test] validateDSL errors:');
  dslErrors.forEach((e) => console.error(' ', e));
  process.exit(1);
}
console.log('[model:test] validateDSL: PASS (no errors)');

// Step 2: transformDSLToJSON — parse + semantic transform; throws on invalid syntax.
let parsed;
try {
  const json = transformer.transformDSLToJSON(dsl);
  parsed = JSON.parse(json);
} catch (err) {
  console.error(`[model:test] transformDSLToJSON ERROR: ${err.message}`);
  process.exit(1);
}
console.log(`[model:test] transformDSLToJSON: PASS`);
console.log(`  schema_version : ${parsed.schema_version}`);
console.log(`  types          : ${parsed.type_definitions.map((t) => t.type).join(', ')}`);
console.log(`  conditions     : ${Object.keys(parsed.conditions ?? {}).join(', ') || '(none)'}`);

// Step 3: assert required types and relations are present.
const required = {
  user: [],
  org: ['member', 'hr_admin', 'owner'],
  business_unit: ['org', 'head', 'hrbp', 'hr_admin'],
  department: ['business_unit', 'head', 'hrbp'],
  team: ['org', 'department', 'manager', 'delegate', 'member', 'approver', 'hr_admin', 'hrbp'],
  employee: ['team', 'subject', 'approver', 'viewer'],
  leave_request: ['subject', 'approver'],
};

const errors = [];
const typeMap = Object.fromEntries(parsed.type_definitions.map((td) => [td.type, Object.keys(td.relations ?? {})]));

for (const [typeName, rels] of Object.entries(required)) {
  if (!typeMap[typeName]) {
    errors.push(`missing type: ${typeName}`);
    continue;
  }
  for (const rel of rels) {
    if (!typeMap[typeName].includes(rel)) {
      errors.push(`type ${typeName}: missing relation '${rel}'`);
    }
  }
}

if (!parsed.conditions?.active_window) {
  errors.push('missing condition: active_window');
}

if (errors.length > 0) {
  console.error('[model:test] structure assertion failures:');
  errors.forEach((e) => console.error(' ', e));
  process.exit(1);
}
console.log('[model:test] structure assertions: PASS');

console.log('[model:test] ALL CHECKS PASSED');
