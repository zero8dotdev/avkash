# Pluggable Data Flow

Avkash modules are not just route folders.

They plug into the product in two directions:

- Core sends facts out.
- Modules contribute capabilities back in.

That is the main idea behind the Avkash open-core architecture.

---

## The Short Version

- Core owns the system of record.
- Modules listen to domain events.
- Modules keep their own records.
- Modules add routes, jobs, permissions, fields, rules, and reports.
- Public and private modules use the same mechanism.
- Avkash Cloud composes more modules without forking the open core.

---

## Core To Module

Core emits facts when something important happens.

Examples:

- Employee joined
- Employee transferred
- Leave approved
- Leave cancelled
- Attendance regularised
- Shift changed
- Policy updated
- Org level changed

Modules subscribe to these facts.

Examples:

- Payroll listens to leave and attendance events.
- Compliance listens to shift, location, overtime, and policy events.
- Analytics listens to operational events and builds reports.
- Notifications listens to events and sends messages.
- Authz sync listens to domain changes and writes OpenFGA tuples.

Flow:

```text
Core domain fact
  -> domain event
  -> event bus
  -> module subscriber
  -> module-owned record, job, notification, report, or decision
```

---

## Module To Core

Modules also contribute capabilities back into the app.

Examples:

- Routes
- Background jobs
- Event subscribers
- Entitlement keys
- Field groups
- OpenFGA model fragments
- Policy checks
- i18n messages
- Schema owned by the module

Flow:

```text
Module manifest
  -> app factory
  -> routes, jobs, permissions, fields, events, and policies
  -> running Avkash app
```

This lets the public repo and the private cloud repo compose different products from the same core.

---

## Core Owns Facts

The core should own canonical HR facts:

- Who the employee is
- Which organisation they belong to
- Which team, department, level, and location they are in
- What shift applies
- What attendance was recorded
- What leave was approved
- What policy applies

Modules should not secretly rewrite these facts.

Modules can:

- React to facts
- Store module-owned derived records
- Add their own APIs
- Add jobs and subscribers
- Request changes through core commands
- Contribute rules at explicit extension points

---

## Modules Own Derivations

Commercial and optional modules often produce derived business meaning.

Examples:

- Payroll derives payable days, LOP, overtime pay, and allowances.
- Compliance derives statutory risk and rule violations.
- Analytics derives trends and dashboards.
- Performance derives review cycles and scores.
- Documents derives missing-document requirements.

These derivations should live in the module that owns them.

---

## Plugin Contract

A module should declare what it brings to the product.

Example shape:

```ts
export interface AvkashModule {
  key: string;
  name: string;
  entitlement?: string;

  routes?: RouteManifest[];
  jobs?: JobManifest[];
  events?: EventManifest;
  subscribers?: EventSubscriber[];
  permissions?: PermissionManifest;
  fieldGroups?: FieldGroupManifest;
  schema?: SchemaManifest;
  i18n?: MessageCatalog;
}
```

The exact interface can evolve. The principle should not:

- No hidden imports from private modules into core.
- No private table references inside public packages.
- No module bypassing core domain rules.
- No event guessing from database tables when a domain event should exist.

---

## Mental Model

```text
                  contributes routes, jobs, fields, authz, schema
             +--------------------------------------------------+
             |                                                  |
             v                                                  |
       +-------------+       emits facts       +-------------+  |
       | Core Domain | ----------------------> |  Event Bus  |  |
       | org/users   |                         +------+------+  |
       | leave/attn  |                                |         |
       +------+------+                                |         |
              ^                                       |         |
              |                                       v         |
              |                              +----------------+ |
              |                              | Module          | |
              |                              | subscribers     | |
              |                              +-------+--------+ |
              |                                      |          |
              |                                      v          |
              |                              +----------------+ |
              +----------------------------- | Module records  | |
                    commands / extension     | and decisions   | |
                    points only              +----------------+ |
```

---

## Why This Matters

This is what makes Avkash open-core without becoming a fork.

- The public core stays clean.
- Private modules stay private.
- Both use the same module contract.
- Self-hosters get a real HRMS baseline.
- Avkash Cloud adds payroll, compliance, UI, and managed operations as modules.
- New modules can become first-class product features without changing core ownership boundaries.

For a concrete worked example, see [LMS Module Guide](lms-module-guide.md).
