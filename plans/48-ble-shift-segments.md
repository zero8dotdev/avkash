# Plan 48 — BLE attendance + shift segments

Status: **implementation plan**. Two interlocked features:

1. **BLE attendance** — employees mark attendance by standing near a provisioned nRF52 BLE beacon.
   The beacon broadcasts a rolling TOTP code (not a static UUID) so the signal cannot be replayed or
   spoofed. The server validates the code, checks the employee's registered device, and records the
   punch.

2. **Shift segments** — a shift can be split into an ordered list of location-time windows. An
   employee working HQ in the morning and the factory in the afternoon has one shift with two
   segments; their BLE punches at each beacon are validated against the correct segment.

Both features are self-contained enough to be built in sequence, but designed together because the BLE
punch validator is the thing that resolves which segment a punch belongs to.

Referenced by: [Plan 22](22-attendance-system.md), [Plan 24](24-shift-planning.md),
[Plan 42](42-device-context.md).

---

## 1. Concepts and invariants

**Beacon** — a physical nRF52 BLE device at one location. Holds a 32-byte secret (provisioned at
setup, never leaves the server after that). Broadcasts `[beacon_id, totp_code]` every 500ms.

**Rolling code (TOTP)** — `HMAC-SHA256(secret, floor(unix_time / 30))`, first 4 bytes taken as a
uint32. Changes every 30 seconds. The server accepts `window ± 1` (90s headroom) to absorb RTC
drift. Each code is marked used after first acceptance (replay protection).

**Mobile device registration** — only a pre-registered `(userId, deviceFingerprint)` pair can submit
a BLE punch for that user. Prevents phone-proxy abuse.

**Shift segment** — a row binding `(shiftId, locationId, startTime, endTime, orderIndex)`. A shift
with no segments behaves exactly as today (no regressions for existing assignments). A shift with
segments expects punches at each location within its time window.

**Punch attribution** — a BLE punch carries `beacon_id`. The server resolves:
`beacon → location → segment` (if the shift is segmented) and records `shiftSegmentId` on the punch.

---

## 2. Schema

### 2a. New enum values

`attendanceSourceEnum` gains `'BLE'`. Drizzle enum append — run `db:push` after.

```
attendance_source: 'WEB' | 'SLACK' | 'DEVICE' | 'REGULARIZATION' | 'BLE'
```

### 2b. `BleBeacon` (new table — `packages/db/src/schema/ble.ts`)

```typescript
export const bleBeacon = pgTable('BleBeacon', {
  id:           uuid('id').primaryKey().defaultRandom(),
  orgId:        uuid('orgId').notNull().references(() => organisation.orgId),
  locationId:   uuid('locationId').notNull().references(() => location.id),
  name:         varchar('name', { length: 255 }).notNull(),
  // 32-byte secret stored as hex-encoded SHA-256 hash.
  // Never returned in API responses. Provisioned once via GATT; server is sole owner after that.
  secretHash:   varchar('secretHash', { length: 64 }).notNull(),
  status:       bleBeaconStatusEnum('status').notNull().default('ACTIVE'),
  lastSeenAt:   timestamp('lastSeenAt', { precision: 6 }),        // set on each valid punch
  version:      integer('version').notNull().default(0),
  createdBy:    varchar('createdBy', { length: 255 }),
  createdAt:    timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  updatedBy:    varchar('updatedBy', { length: 255 }),
  updatedAt:    timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
}, t => [
  index('idx_blebeacon_org').on(t.orgId),
  index('idx_blebeacon_location').on(t.locationId),
]);
```

New enum: `ble_beacon_status: 'PROVISIONING' | 'ACTIVE' | 'INACTIVE'`

`PROVISIONING` — secret not yet written (beacon not yet set up). A punch against a PROVISIONING
beacon is rejected. `ACTIVE` — normal operation. `INACTIVE` — administratively disabled.

### 2c. `BleDeviceRegistration` (new table — same file)

Maps an employee's mobile device fingerprint to their user record. Only registered devices can submit
BLE punches.

```typescript
export const bleDeviceRegistration = pgTable('BleDeviceRegistration', {
  id:                uuid('id').primaryKey().defaultRandom(),
  orgId:             uuid('orgId').notNull().references(() => organisation.orgId),
  userId:            uuid('userId').notNull().references(() => user.id),
  // Stable device identifier from the mobile OS (Android ID / iOS identifierForVendor).
  deviceFingerprint: varchar('deviceFingerprint', { length: 255 }).notNull(),
  deviceName:        varchar('deviceName', { length: 255 }),      // "Ashutosh's iPhone 15"
  platform:          varchar('platform', { length: 16 }),         // 'ios' | 'android'
  isActive:          boolean('isActive').notNull().default(true),
  registeredAt:      timestamp('registeredAt', { precision: 6 }).notNull().defaultNow(),
  createdBy:         varchar('createdBy', { length: 255 }),
}, t => [
  uniqueIndex('uq_ble_device_org_fingerprint').on(t.orgId, t.deviceFingerprint),
  index('idx_ble_device_user').on(t.userId),
]);
```

One device fingerprint per org (one employee per device). A fingerprint can't be registered to two
users in the same org.

### 2d. `BleCodeUse` (new table — same file, replay protection)

```typescript
export const bleCodeUse = pgTable('BleCodeUse', {
  beaconId:  uuid('beaconId').notNull().references(() => bleBeacon.id),
  totpCode:  integer('totpCode').notNull(),
  windowNum: bigint('windowNum', { mode: 'bigint' }).notNull(),    // floor(unix_time / 30)
  usedAt:    timestamp('usedAt', { precision: 6 }).notNull().defaultNow(),
}, t => [
  // PK enforces uniqueness; concurrent inserts race to be first — second gets a conflict error.
  { primaryKey: primaryKey({ columns: [t.beaconId, t.windowNum, t.totpCode] }) },
]);
```

Cleanup: a background job (or cron via `jobs` package) deletes rows where
`usedAt < now() - interval '5 minutes'` (two full windows past expiry).

### 2e. `ShiftSegment` (new table — `packages/db/src/schema/shift.ts`)

```typescript
export const shiftSegment = pgTable('ShiftSegment', {
  id:             uuid('id').primaryKey().defaultRandom(),
  orgId:          uuid('orgId').notNull().references(() => organisation.orgId),
  shiftId:        uuid('shiftId').notNull().references(() => shift.id, { onDelete: 'cascade' }),
  locationId:     uuid('locationId').notNull().references(() => location.id),
  label:          varchar('label', { length: 255 }),               // e.g. "Morning – HQ"
  startTime:      time('startTime').notNull(),                     // local to locationId.timezone
  endTime:        time('endTime').notNull(),
  crossesMidnight: boolean('crossesMidnight').notNull().default(false),
  graceMinutes:   integer('graceMinutes').notNull().default(0),    // overrides shift.graceMinutes
  orderIndex:     integer('orderIndex').notNull(),                 // 0-based display / sort order
}, t => [
  index('idx_shiftseg_shift').on(t.shiftId),
  index('idx_shiftseg_location').on(t.locationId),
]);
```

Cascade delete: when a shift is deleted, its segments go with it.

### 2f. `AttendancePunch` additions

Two new nullable columns on the existing table:

```typescript
shiftSegmentId: uuid('shiftSegmentId').references(() => shiftSegment.id),
bleBeaconId:    uuid('bleBeaconId').references(() => bleBeacon.id),
```

`shiftSegmentId` — set when a punch is attributed to a specific segment (BLE or any future
location-aware source). `bleBeaconId` — set for all `source = 'BLE'` punches; null otherwise.

---

## 3. Beacon provisioning flow

Provisioning is a two-step process: create the beacon record, then write the secret to the physical
device via BLE GATT (performed by the admin app, not the server).

```
Admin (Avkash app)                          Avkash API
──────────────────                          ──────────
POST /beacons
  { name, locationId }
                                     → Insert BleBeacon, status='PROVISIONING', secretHash=''
                                     ← { id, status: 'PROVISIONING' }

[App connects to nRF52 over BLE GATT]
[ECDH key exchange — ephemeral keypair on beacon, public key in advertisement]
[Session key derived]

POST /beacons/:id/provision
  { ecdhPublicKey }                  → Generate 32-byte secret (crypto.randomBytes)
                                       secretHash = SHA256(secret) stored
                                       secret XOR-encrypted with session key derived
                                       from server ECDH + beacon's public key
                                     ← { encryptedSecret, currentUnixTime }

[App decrypts secret using session key]
[App writes to beacon GATT characteristics:]
  - beacon_id   (uuid bytes)
  - secret      (32 bytes, plaintext after client-side decrypt)
  - unix_time   (uint64, current UTC epoch seconds)

[Beacon stores to NVS flash, reboots, starts advertising]

PATCH /beacons/:id
  { status: 'ACTIVE' }               → beacon is now live
```

The secret is in cleartext only on the wire between the server and the admin app (HTTPS) and in the
app's memory during the GATT write. It is never stored in the app. After provisioning, the server
holds `secretHash` (for log/audit only — the actual TOTP uses the raw secret held in memory from the
`provision` response, but we need the raw secret at validation time, so store it encrypted, not
hashed).

**Correction on secretHash**: store the raw secret encrypted at rest (AES-256-GCM, key from env
`BLE_SECRET_KEY`), not hashed — TOTP validation needs the raw secret. The column name stays
`secretHash` but the value is an AES-GCM ciphertext (base64-encoded). Alternatively, use a KMS
envelope.

---

## 4. BLE punch validation (`POST /attendance/ble`)

```typescript
// packages/attendance/src/ble.ts

export async function ingestBlePunch(
  ctx: AuthContext,
  input: { beaconId: string; totpCode: number; deviceFingerprint: string; clientTs: number }
): Promise<AttendancePunch> {

  // 1. Registered device check
  const reg = await db.query.bleDeviceRegistration.findFirst({
    where: and(
      eq(bleDeviceRegistration.orgId, ctx.orgId),
      eq(bleDeviceRegistration.userId, ctx.userId),
      eq(bleDeviceRegistration.deviceFingerprint, input.deviceFingerprint),
      eq(bleDeviceRegistration.isActive, true),
    ),
  });
  if (!reg) throw new UnauthorizedError('BLE_DEVICE_NOT_REGISTERED');

  // 2. Beacon lookup
  const beacon = await db.query.bleBeacon.findFirst({
    where: and(eq(bleBeacon.id, input.beaconId), eq(bleBeacon.orgId, ctx.orgId)),
    with: { location: true },
  });
  if (!beacon) throw new NotFoundError('BEACON_NOT_FOUND');
  if (beacon.status !== 'ACTIVE') throw new ConflictError('BEACON_NOT_ACTIVE');

  // 3. TOTP validation — accept window-1, window, window+1
  const now = BigInt(Math.floor(Date.now() / 1000));
  const secret = decryptBeaconSecret(beacon.secretHash); // AES-GCM decrypt
  const valid = [-1n, 0n, 1n].some(offset => {
    const w = now / 30n + offset;
    return computeTOTP(secret, w) === input.totpCode;
  });
  if (!valid) throw new UnauthorizedError('INVALID_BLE_CODE');

  // 4. Replay protection — insert wins, conflict = already used
  const window = now / 30n;
  try {
    await db.insert(bleCodeUse).values({
      beaconId: input.beaconId,
      totpCode: input.totpCode,
      windowNum: window,
    });
  } catch (e) {
    if (isDuplicateKeyError(e)) throw new ConflictError('BLE_CODE_ALREADY_USED');
    throw e;
  }

  // 5. Segment resolution (if the employee's shift has segments)
  const shiftForToday = await getShiftForDate(ctx, ctx.userId, new Date());
  let segmentId: string | null = null;
  if (shiftForToday) {
    const segments = await getShiftSegments(shiftForToday.id);
    if (segments.length > 0) {
      const localTime = toLocalTime(new Date(), beacon.location.timezone);
      const segment = segments.find(s =>
        s.locationId === beacon.locationId && isWithinWindow(localTime, s)
      );
      // Outside all segment windows → flag but still record (don't silently drop punches)
      segmentId = segment?.id ?? null;
      // If no segment matched and the shift IS segmented, flag it
    }
  }

  // 6. Direction inference (same as existing recordPunch logic)
  const lastPunch = await getLastPunch(ctx, ctx.userId, today(beacon.location.timezone));
  const type = lastPunch?.type === 'IN' ? 'OUT' : 'IN';

  // 7. Record punch
  const [punch] = await db.insert(attendancePunch).values({
    orgId: ctx.orgId,
    userId: ctx.userId,
    ts: new Date(input.clientTs * 1000),
    type,
    source: 'BLE',
    locationId: beacon.locationId,
    bleBeaconId: beacon.id,
    shiftSegmentId: segmentId,
    flagged: segmentId === null && segments.length > 0,
    flagReason: segmentId === null && segments.length > 0 ? 'BLE_OUTSIDE_SEGMENT_WINDOW' : null,
  }).returning();

  // 8. Touch beacon lastSeenAt (fire-and-forget)
  void db.update(bleBeacon).set({ lastSeenAt: new Date() }).where(eq(bleBeacon.id, beacon.id));

  return punch;
}
```

**`computeTOTP`** (pure, testable — `packages/attendance/src/ble-totp.ts`):

```typescript
import { createHmac } from 'crypto';

export function computeTOTP(secret: Buffer, window: bigint): number {
  const counter = Buffer.allocUnsafe(8);
  counter.writeBigUInt64BE(window);
  const hmac = createHmac('sha256', secret).update(counter).digest();
  return hmac.readUInt32BE(0); // unsigned 32-bit, matches firmware
}
```

---

## 5. Segment resolution helpers (`packages/attendance/src/segments.ts`)

```typescript
// Is `localTime` within [segment.startTime - grace, segment.endTime + grace]?
export function isWithinWindow(
  localTime: { hours: number; minutes: number },
  segment: { startTime: string; endTime: string; graceMinutes: number; crossesMidnight: boolean }
): boolean { ... }

// Get ordered segments for a shift (cached per request)
export async function getShiftSegments(shiftId: string): Promise<ShiftSegment[]> { ... }

// Compute per-segment punch summary for resolveDay
export function resolveSegments(
  segments: ShiftSegment[],
  punches: AnnotatedPunch[],
  tz: string,
): SegmentSummary[] {
  // For each segment: find IN punch (type=IN, shiftSegmentId=segment.id),
  // find OUT punch, compute workedMinutes, mark PRESENT/ABSENT/PARTIAL
  ...
}
```

`resolveDay` gains an optional `segmentSummaries` field in its output when the shift has segments:

```typescript
type DayResolution = {
  status: AttendanceStatus;
  marks: AttendanceMark[];
  firstIn: Date | null;
  lastOut: Date | null;
  workedMinutes: number;
  overtimeMinutes: number;
  // New — only present when shift has segments
  segments?: SegmentSummary[];
};

type SegmentSummary = {
  segmentId: string;
  label: string | null;
  locationId: string;
  status: 'PRESENT' | 'ABSENT' | 'PARTIAL';
  firstIn: Date | null;
  lastOut: Date | null;
  workedMinutes: number;
};
```

A shift is PRESENT for the day if all segments are PRESENT. A shift is PARTIAL if some segments are
present. Individual segment ABSENT drives regularization candidates (the resolver flags missing
segments the same as a missed punch day).

---

## 6. API routes

### Beacon management (`apps/api/src/routes/beacons.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/beacons` | MANAGER | Create beacon (status=PROVISIONING) |
| `GET` | `/beacons` | MANAGER | List org's beacons (with locationId filter) |
| `GET` | `/beacons/:id` | MANAGER | Single beacon |
| `POST` | `/beacons/:id/provision` | ADMIN | Generate secret, return encrypted payload for GATT write |
| `PATCH` | `/beacons/:id` | MANAGER | Update name/status (ETag / If-Match) |
| `DELETE` | `/beacons/:id` | ADMIN | Set status=INACTIVE |

### Device registration (`apps/api/src/routes/attendance.ts` — existing file)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/attendance/ble/register-device` | USER (self) | Register this device fingerprint |
| `DELETE` | `/attendance/ble/devices/:id` | USER (self) or MANAGER | Deregister |
| `GET` | `/attendance/ble/devices` | USER (self) | List own registered devices |
| `POST` | `/attendance/ble/punch` | USER (self) | Submit BLE punch |

### Shift segments (`apps/api/src/routes/shifts.ts` — existing file)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/shifts/:id/segments` | MANAGER | Create segment (validates no overlap with existing) |
| `GET` | `/shifts/:id/segments` | MANAGER | List segments ordered by `orderIndex` |
| `PATCH` | `/shifts/:id/segments/:segId` | MANAGER | Update time / location / label |
| `DELETE` | `/shifts/:id/segments/:segId` | MANAGER | Remove segment |
| `PUT` | `/shifts/:id/segments/reorder` | MANAGER | Batch reorder (body: `{ ids: string[] }`) |

---

## 7. Source policy (plan 31 integration)

`BLE` is a new attendance source. The existing `AttendanceSourcePolicy` table (per org, per
employment level) controls which sources are allowed. Add `BLE` to the allowed sources for levels
where it makes sense (FIELD, WORKER, EXECUTIVE). No schema change — `attendanceSourceEnum` now
includes `BLE` so existing policy rows can reference it.

The `ingestBlePunch` function checks source policy before recording the punch (same as
`ingestPunch` does for DEVICE/WEB).

---

## 8. Firmware reference (nRF52 / Zephyr)

Not code we ship, but the design the firmware must implement for the server validation to work:

- **Clock**: RTC1 driven by LFXO (32.768 kHz crystal). Time written at provisioning via GATT
  characteristic. Drift ≈ ±20 ppm → ±1.7s/day; server ±1 window tolerance (90s) covers weeks
  without re-sync.
- **TOTP**: `HMAC-SHA256(secret, big_endian_uint64(floor(unix_time / 30)))`, bytes 0–3 as uint32
  big-endian. Matches `computeTOTP` exactly.
- **Advertisement**: legacy BLE advertisement, AD type `0xFF` (Manufacturer Specific Data).
  Payload: `[company_id: 2B][beacon_id: 16B][totp_code: 4B]` — 22 bytes, fits legacy PDU.
- **Provisioning mode**: no secret in NVS → advertise as `AVKASH-PROV`, accept GATT writes on
  service UUID `A5AE-...`. After write: store to NVS, reboot, advertise normally.
- **ECDH session key**: beacon generates ephemeral Curve25519 keypair at boot. Public key in
  provisioning advertisement. Server sends encrypted secret: `XSalsa20Poly1305(sessionKey, secret)`.
  Mobile app decrypts (it knows both halves of ECDH) then writes plaintext secret to beacon.

---

## 9. What this does not solve

| Gap | Note |
|-----|------|
| Phone proxy (employee hands phone to colleague) | Social / HR problem; photo capture at punch time (future) is the deterrent |
| Rooted device faking BLE scan result | Device binding reduces but doesn't eliminate; future: SafetyNet / DeviceCheck attestation |
| Re-sync for long-deployed beacons | Provide a "re-sync time" GATT characteristic (same provisioning app, no secret re-exchange needed) |
| BLE signal bleed between adjacent locations | Server resolves by segment time window, not just location; bleed doesn't grant access to wrong segment |

---

## 10. Build order

**Phase A — Schema + enum** (foundation, no behaviour change for existing features)
1. Add `BLE` to `attendanceSourceEnum` in `enums.ts`. `db:push`.
2. Add `ble_beacon_status` enum to `enums.ts`.
3. Create `packages/db/src/schema/ble.ts` with `BleBeacon`, `BleDeviceRegistration`, `BleCodeUse`.
4. Add `shiftSegmentId` + `bleBeaconId` to `AttendancePunch` in `attendance.ts`.
5. Add `ShiftSegment` to `shift.ts`. `db:push`.
6. Export all new tables from `packages/db/src/schema/index.ts`.

**Phase B — Shift segments domain + API**
7. `getShiftSegments`, `isWithinWindow`, `resolveSegments` in `packages/attendance/src/segments.ts`.
8. Unit tests for `isWithinWindow` (boundary cases, grace, crossesMidnight).
9. Extend `resolveDay` output with `segments?` field (no breaking change — existing callers ignore it).
10. Segment CRUD routes in `shifts.ts` — create with overlap validation, reorder endpoint.
11. Segment DTOs in `dto.ts`.

**Phase C — BLE beacon management API**
12. `computeTOTP` pure function + tests in `packages/attendance/src/ble-totp.ts`.
13. Beacon CRUD in `apps/api/src/routes/beacons.ts` (create, list, get, patch, delete).
14. `POST /beacons/:id/provision` — ECDH key exchange + secret generation + AES-GCM storage.
15. Beacon DTOs (never expose `secretHash`).
16. Wire `beacons` route into `app.ts`.

**Phase D — Mobile device registration + BLE punch**
17. `POST /attendance/ble/register-device` — idempotent (same fingerprint = update, not duplicate).
18. `DELETE` + `GET` device registration routes.
19. `ingestBlePunch` in `packages/attendance/src/ble.ts` (steps 1–8 from §4).
20. `POST /attendance/ble/punch` route — thin wrapper, calls `ingestBlePunch`.
21. Source policy check integration.
22. `BleCodeUse` cleanup job (cron in `packages/jobs` or a scheduled Postgres function).

**Phase E — Tests**
23. `computeTOTP` — known vectors from RFC 6238 (adapted for SHA-256 + 4-byte output).
24. `ingestBlePunch` — valid punch, invalid code, expired window, replay, unregistered device,
    inactive beacon, segment attribution, outside-segment-window flag.
25. `resolveDay` with segmented shift — all present, one absent, all absent.
26. `isWithinWindow` — on boundary, inside, outside, grace edge, crossesMidnight.

---

## 11. Open questions (decide before Phase D)

1. **Secret storage**: AES-256-GCM with a single env key (`BLE_SECRET_KEY`) is simplest. KMS
   envelope is safer (key rotation without re-provisioning). Pick before Phase C.
2. **One device per user per org, or multiple?** The unique index on `(orgId, deviceFingerprint)`
   prevents one device from being registered to two users. But can one user register two phones?
   Current design: yes (no constraint on `(orgId, userId)` — a user can have multiple active
   devices). Change if you want one-device-per-user.
3. **Segment punch model**: currently a BLE OUT punch also carries `shiftSegmentId` (same segment
   as the IN). Should OUT be segment-aware (employee explicitly "checking out" of a segment), or
   should segment attribution be IN-only and OUT be the global day close? Recommend: both IN and OUT
   carry the segment (mirrors the existing IN/OUT pairing model cleanly).
4. **Missed segment regularization**: when a segment has no IN punch and its window has passed,
   should the system auto-create a regularization request? Or surface it as a flag and let the
   employee/manager initiate? Recommend: flag only (auto-regularization is noisy and wrong for
   unexpected schedule changes).
