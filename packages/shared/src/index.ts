// @avkash/shared — the foundation. Zero internal dependencies.
// Everything that crosses a package boundary lives here as a type or primitive.

export * from './enums';
export * from './errors';
export * from './db-errors';
export * from './validate';
export * from './serialize';
export * from './context';
// Platform contracts (Plans 49/51): module manifest, events, entitlements,
// relationship authz, field-level visibility. Types + constants only — the
// implementations live in @avkash/events, @avkash/authz, and the registry.
export * from './module';
export * from './events';
export * from './entitlements';
export * from './authz';
export * from './field-groups';
