# 15 — API Error Handling & Validation Refactor

The error contract IS part of the API contract. This makes it consistent, correctly
layered, internationalized, and safe in production.

## Locked decisions

| #                           | Decision                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| Language header             | Standard **`Accept-Language`**                                                                         |
| Language source             | **Stored on the User** (preference) — overrides the header when present; header is the fallback        |
| System-error verbosity      | **`EXPOSE_ERRORS`** env flag, **defaulting from `NODE_ENV`** (`!== production` → exposed)              |
| i18n granularity            | **Top-level message localized**; raw field issues passed through in `details` (field-level i18n later) |
| Better Auth (`/api/auth/*`) | **Left as a documented exception** for v1 (its own `{message,code}` shape)                             |
| Validation                  | **Zod**, schemas co-located with domain input types                                                    |

## The linchpin: errors carry CODE + PARAMS, not messages

```ts
// domain throws a SEMANTIC code + params — no human string, no language:
throw new BusinessRuleError('INSUFFICIENT_BALANCE', { available, requested });
```

The human message is resolved at the **edge** from the request's language. This keeps the
domain transport- AND language-agnostic — the same way it returns data and lets the
transport format it.

## The four layers

| Layer          | Class(es)                                                                                   | HTTP            |
| -------------- | ------------------------------------------------------------------------------------------- | --------------- |
| Authentication | `UnauthenticatedError`                                                                      | 401             |
| Authorization  | `ForbiddenError`                                                                            | 403             |
| Business       | `ValidationError` 400 · `NotFoundError` 404 · `ConflictError` 409 · `BusinessRuleError` 422 | 4xx             |
| System         | `InternalError` / any non-`DomainError`                                                     | 500 (env-aware) |

`DomainError { code, status, message, params?, cause? }` — `status` lives on the error, so
`onError` just reads `err.status` (no code-switch).

## The single envelope

```jsonc
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "<localized for the request's language>",
    "details": { "available": 12, "requested": 25 },
    "requestId": "req_…",
  },
}
```

Emitted uniformly by `onError`, `requireAuth`, and `validate`.

## i18n

- New **`@avkash/i18n`** package: per-locale catalogs keyed by error code + `translate(locale, code, params)` (fallback: requested → `en` → raw code).
- Locale resolution middleware: **User.language → `Accept-Language` → default `en`** → `c.set('locale')`.
- Supported v1 locales: **en, hi**.

## Validation (Zod at the edge)

- Schemas co-located with domain inputs (`applyLeaveSchema`; `type ApplyLeaveInput = z.infer<…>`).
- `validate(schema, body)` → throws `ValidationError('VALIDATION_FAILED', { issues })` on failure → 400.
- Removes the `as SomeInput` casts; malformed input can't reach domain logic.

## System errors (env-aware)

- **Production:** `500 { code: INTERNAL, message: <generic localized>, requestId }`; real error (message+stack+cause) logged server-side under `requestId`, never sent.
- **Dev/staging (`EXPOSE_ERRORS`):** real message/stack/cause included in `details`.

## DB-error translation

PG `23505` (unique) → `ConflictError`; `23503` (FK) → `ValidationError`/`ConflictError`.

## Package impact

| Package                | Change                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `@avkash/shared`       | error taxonomy (code+status+params)                                                                                     |
| `@avkash/i18n` _(new)_ | catalogs (en, hi) + `translate()`                                                                                       |
| `@avkash/db`           | `User.language` column                                                                                                  |
| domain packages        | throw coded errors; export Zod input schemas                                                                            |
| `apps/api`             | `requestId` + `locale` middleware, `validate` helper, rewritten `onError`, `requireAuth` envelope, DB-error translation |

## Phases (each shippable; reviewable between)

1. **Foundation** — taxonomy (code+status+params, backward-compatible) + single envelope + `onError` (env-aware + `requestId`) + `requireAuth` envelope + `EXPOSE_ERRORS`. _No throw-site or i18n changes — pure infra._
2. **Reclassify + codes** — convert the ~24 mis-thrown `ForbiddenError`s to correct classes with **stable codes** (`INSUFFICIENT_BALANCE`, `LEAVE_OVERLAP`, `SEAT_CAP_REACHED`, …). _(The code names are a contract — reviewed before merge.)_
3. **i18n** — `@avkash/i18n` (en, then hi) + `User.language` + locale middleware + localize by code.
4. **Validation + DB** — Zod schemas per endpoint + `validate` helper + PG-error translation.
