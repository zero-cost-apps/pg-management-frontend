# StaySync PG — P0 Backend API Spec

Source of truth for **must-ship** APIs. Field names match `src/types.ts` and the current UI actions in `AuthContext` / `PGContext`. Implement these before P1 (WhatsApp, CSV, PDF receipts). There is **no SaaS billing**: every owner is on one implicit default plan.

**Do not seed demo owner `owner@staysync.in` / password `admin123` in production.** Do not auto-login. Do not store passwords in plaintext.

---

## 1. Conventions

| Item | Rule |
|---|---|
| Base URL | `https://{host}/v1` |
| Protocol | HTTPS only. JSON UTF-8. Multipart for files. |
| Auth | `Authorization: Bearer {accessToken}` on every route except auth public + `/health` |
| Access token | JWT, 15 min, claims: `sub` (user id), `role` (`owner`), `sid` (session id) |
| Refresh token | Opaque, 30 days, rotate on use, store hashed server-side |
| IDs | Server-generated UUID v4 (frontend currently uses `bld-{ts}` — ignore that) |
| Dates | Calendar fields: `YYYY-MM-DD`. Timestamps: ISO-8601 UTC (`2026-09-20T05:24:00.000Z`) |
| Money | INR rupees as JSON number (e.g. `10500.5`). Round to 2 decimals. Never send paise. |
| Billing month | `YYYY-MM` (e.g. `"2026-09"`) |
| Phone | Persist 10-digit Indian mobile. Accept `+91`, spaces, dashes. Compare on digits only. |
| Email | Lowercase, trim. |
| Multi-tenancy | Every row except `users` is scoped by `ownerId`. Never return another owner’s data. `403` if ID exists but is not owned. `404` if missing. |
| Plan | Single default plan for all owners. No trials, tiers, checkout, or per-owner quotas. `subscription` is omitted from all payloads. |
| Pagination | List endpoints: `?page=1&pageSize=50` (max 100). Response `meta.pagination`. |
| Idempotency | `Idempotency-Key` header required on `POST /payments` and `POST /electricity`. Replay same body → same `201` payload. |

### Envelope

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_01HZX",
    "pagination": { "page": 1, "pageSize": 50, "total": 12, "totalPages": 1 }
  }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "phone must be a 10-digit Indian mobile number",
    "fields": { "phone": "invalid" }
  },
  "meta": { "requestId": "req_01HZX" }
}
```

| HTTP | `error.code` |
|---|---|
| 400 | `VALIDATION_ERROR` |
| 401 | `UNAUTHENTICATED` / `TOKEN_EXPIRED` |
| 403 | `FORBIDDEN` / `NOT_ONBOARDED` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` (duplicate email, occupied room, capacity) |
| 413 | `PAYLOAD_TOO_LARGE` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL` |

`password` / `passwordHash` / refresh token hash **never** appear in `data`.

### Shared enums (exact strings)

```
UserRole: owner
RoomStatus: vacant | occupied | maintenance
TenantStatus: active | notice_period | vacated
DepositStatus: paid | partial | pending | refunded
Gender: male | female | other
RelationshipType: Spouse | Brother | Sister | Friend | Colleague | Parent | Child | Relative | Roommate | Other
DocType: aadhaar | pan | passport | student_id | employment_letter | police_verification
DocVerificationStatus: verified | pending | rejected
PaymentMode: upi | cash | bank_transfer | cheque | card
PaymentStatus: paid | partial | pending
ElectricityRecord.status: logged | billed | collected
ElectricityBillingCycle: monthly | bi-monthly
BusinessType: mens_pg | womens_pg | coliving | hostel
```

### Default plan (implicit, not stored per user)

Every registered owner gets the same product. Do **not** persist `planTier`, `maxRooms`, `maxBuildings`, `renewalDate`, or `monthlyPrice`. Do **not** expose `/billing/*`. Do **not** return `subscription` on `user`.

Operational caps (abuse prevention only, not commercial quotas):

| Cap | Value |
|---|---|
| Buildings per owner | unlimited (validate `totalFloors` 1–50) |
| Rooms per owner | unlimited (validate unique `roomNumber` per building) |
| Onboarding rooms created | `totalFloors * roomsPerFloor` ≤ 500 |

### User object (always this shape in responses)

```json
{
  "id": "3f2a9c1e-4b11-4c8a-9d22-0e1f2a3b4c5d",
  "fullName": "Ankit Panchal",
  "email": "owner@example.com",
  "phone": "9876543210",
  "role": "owner",
  "businessName": "Sunshine Co-Living & PG",
  "avatarUrl": null,
  "isOnboarded": false,
  "createdAt": "2026-09-20T05:00:00.000Z",
  "gstNumber": null,
  "businessAddress": null,
  "bankDetails": {
    "accountNumber": null,
    "ifscCode": null,
    "accountHolderName": null,
    "bankName": null,
    "upiId": null
  }
}
```

For `GET /account`, mask bank: `accountNumber` last 4 only (`XXXXXXXX1928`). Full account only on `PATCH /account/bank` response immediately after save is **not** required — always mask.

---

## 2. Public / session

### `GET /health` — no auth

**Response 200**

```json
{
  "success": true,
  "data": { "status": "ok", "version": "1.0.0", "time": "2026-09-20T05:00:00.000Z" }
}
```

---

### `POST /auth/register` — public

**Request**

```json
{
  "fullName": "Ankit Panchal",
  "email": "ankit@example.com",
  "phone": "9876543210",
  "password": "secret12",
  "businessName": "Sunshine PG"
}
```

| Field | Required | Rules |
|---|---|---|
| fullName | yes | 2–80 chars |
| email | yes | unique |
| phone | yes | unique 10-digit IN |
| password | yes | min 6 (match current UI); recommend min 8 + complexity in prod |
| businessName | no | default `"{fullName}'s PG Accommodations"` |

**Response 201**

```json
{
  "success": true,
  "data": {
    "user": { },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "rt_...",
      "expiresIn": 900
    }
  }
}
```

`user.isOnboarded` = `false`. No `subscription` field.

**409** email or phone taken.

Rate limit: 5 / IP / 15 min.

---

### `POST /auth/login` — public

**Request**

```json
{
  "emailOrPhone": "ankit@example.com",
  "password": "secret12"
}
```

`emailOrPhone` matches email (case-insensitive) **or** phone digits.

**Response 200** — same as register (`user` + `tokens`).

**401** unknown identifier or wrong password — same message: `"Invalid email/phone or password."` (do not leak which).

Lock account 15 min after 10 failures.

---

### `POST /auth/refresh` — public (refresh token)

**Request**

```json
{ "refreshToken": "rt_..." }
```

**Response 200** — new `accessToken` + rotated `refreshToken`.

**401** reuse of revoked refresh → revoke entire session family.

---

### `POST /auth/logout` — auth

**Request**

```json
{ "refreshToken": "rt_..." }
```

**Response 200** `{ "success": true, "data": { "loggedOut": true } }`

---

### `GET /auth/me` — auth

**Response 200** `{ "success": true, "data": { "user": { } } }`

Used on app boot instead of auto-login.

---

### `POST /auth/forgot-password` — public

**Request**

```json
{ "emailOrPhone": "ankit@example.com" }
```

Always **200** with `{ "sent": true }` even if user missing.

If user exists: 6-digit OTP, 10 min TTL, hashed in DB. Send SMS if identifier is phone, email otherwise.

Rate limit: 3 / identifier / hour.

---

### `POST /auth/reset-password` — public

**Request**

```json
{
  "emailOrPhone": "ankit@example.com",
  "otp": "482913",
  "newPassword": "newsecret"
}
```

**Response 200** `{ "reset": true }` — invalidate all refresh tokens.

**400** invalid/expired OTP.

---

## 3. Account & onboarding

Gate: if `isOnboarded === false`, only these + auth/me/logout/onboarding are allowed. All other P0 resource routes return **403** `NOT_ONBOARDED`.

---

### `PATCH /account` — auth

**Request** (all optional, at least one)

```json
{
  "fullName": "Ankit Panchal",
  "phone": "9876543210",
  "businessName": "Sunshine Co-Living & PG",
  "gstNumber": "29ABCDE1234F1Z5",
  "businessAddress": "124, 1st Cross, Indiranagar, Bengaluru 560038"
}
```

Email is **not** changeable in P0 (UI field is disabled).

**Response 200** `{ "user": { } }`

**409** if new phone already used.

---

### `PATCH /account/bank` — auth

**Request**

```json
{
  "upiId": "sunshinepg@okhdfcbank",
  "bankName": "HDFC Bank, Indiranagar",
  "accountNumber": "918237461928",
  "ifscCode": "HDFC0001824",
  "accountHolderName": "Ankit Panchal (Sunshine PG)"
}
```

| Field | Required | Rules |
|---|---|---|
| upiId | yes | contains `@`, 3–80 chars |
| ifscCode | no | `^[A-Z]{4}0[A-Z0-9]{6}$` if present |
| accountNumber | no | 9–18 digits if present |

Encrypt `accountNumber` at rest.

**Response 200** `{ "user": { } }` with masked account.

---

### `POST /onboarding` — auth, `isOnboarded` must be false

**Atomic transaction.** Sets `isOnboarded=true`, writes building + N rooms + optional tenant. Rollback all if any step fails.

**Request** (maps `OnboardingData` + wizard extras)

```json
{
  "businessName": "Skyline Co-Living & PG",
  "businessType": "coliving",
  "city": "Bengaluru",
  "phone": "9876543210",
  "upiId": "skylinepg@oksbi",
  "buildingName": "Skyline Tower - Block A",
  "buildingCode": "STA",
  "address": "14, 5th Main, 7th Sector, HSR Layout",
  "billingDueDay": 5,
  "electricityRatePerUnit": 10,
  "totalFloors": 2,
  "roomsPerFloor": 3,
  "roomCapacity": 2,
  "defaultBaseRent": 8500,
  "amenities": [
    "High-Speed Wi-Fi",
    "Attached Washroom",
    "3-Times Homely Food",
    "24/7 RO Drinking Water",
    "CCTV Security",
    "Power Backup / Inverter"
  ],
  "intakeMode": "custom",
  "initialTenant": {
    "fullName": "Aditya Nair",
    "phone": "9876500111",
    "email": "aditya.nair@example.com",
    "monthlyRent": 8500,
    "securityDeposit": 17000
  }
}
```

| Field | Required | Rules |
|---|---|---|
| businessName | yes | |
| businessType | yes | enum |
| city | yes | |
| phone | yes | also updates user.phone |
| upiId | no | stored on user.bankDetails.upiId and building.upiId |
| buildingName | yes | |
| buildingCode | yes | 2–8 uppercase; unique per owner |
| address | yes | |
| billingDueDay | yes | 1–28 |
| electricityRatePerUnit | yes | > 0 |
| totalFloors | yes | 1–20 |
| roomsPerFloor | yes | 1–30 |
| roomCapacity | yes | 1–6 |
| defaultBaseRent | yes | > 0 |
| amenities | yes | array of strings, may be empty |
| intakeMode | yes | `empty` \| `custom` \| `sample` |
| initialTenant | if intakeMode ≠ empty | fullName + phone required |

Room generation (same as wizard):

- Floors `1..totalFloors`, rooms `1..roomsPerFloor`
- `roomNumber` = `{floor}0{idx}` e.g. floor 1 idx 1 → `"101"`
- `roomTypeId` = `"rt_double"` (create matching room type on building)
- `status` = `"vacant"` except first room if tenant created
- `meterNumber` = `MTR-{buildingCode}-{roomNumber}`
- `hasAttachedBathroom` = true
- `hasAirConditioner` = amenities includes `"Air Conditioner (AC)"`
- `hasBalcony` = `roomIdx % 2 === 0`
- `lastMeterReading` = `100 * floor + roomIdx * 10`
- `lastMeterReadingDate` = today IST date

If `intakeMode` is `sample`, use:

```json
{
  "fullName": "Aditya Nair",
  "phone": "9876500111",
  "email": "aditya.nair@example.com",
  "monthlyRent": "<defaultBaseRent>",
  "securityDeposit": "<defaultBaseRent * 2>"
}
```

Tenant gender: `female` if `businessType === "womens_pg"` else `male`. Place tenant in first generated room. Defaults for missing tenant fields:

```
occupation: "Software Engineer"
workOrCollegeName: "Tech Mahindra"
permanentAddress: "Plot 42, Sector 12, Indiranagar"
emergencyContactName: "Rajesh Nair"
emergencyContactRelation: "Father"
emergencyContactPhone: "9876599900"
depositStatus: "paid"
depositPaidAmount: securityDeposit
status: "active"
documents: []
```

Building defaults:

```
electricityBillingCycle: "monthly"
managerName: user.fullName
managerPhone: request.phone
roomTypes: [
  { "id": "<uuid>", "name": "Double Sharing", "capacity": <roomCapacity>, "baseRent": <defaultBaseRent> }
]
```

Also set `user.businessName`, `user.bankDetails.upiId`.

**Response 201**

```json
{
  "success": true,
  "data": {
    "user": { "isOnboarded": true },
    "building": { },
    "rooms": [ ],
    "tenant": null
  }
}
```

`tenant` is the created tenant object or `null` if `intakeMode=empty`.

**409** already onboarded. **400** if `totalFloors * roomsPerFloor > 500`.

---

## 4. Buildings

All require auth + onboarded. Filter `ownerId = sub`.

### Building resource

```json
{
  "id": "uuid",
  "ownerId": "uuid",
  "name": "Skyline Elite Residency",
  "code": "SER",
  "address": "Plot 42, 4th Main, Koramangala 4th Block",
  "city": "Bengaluru, Karnataka 560034",
  "totalFloors": 3,
  "electricityRatePerUnit": 11.5,
  "billingDueDay": 5,
  "electricityBillingCycle": "monthly",
  "managerName": "Vikram Malhotra",
  "managerPhone": "9876543210",
  "upiId": "skyline.pg@icici",
  "amenities": ["High Speed Wi-Fi (300 Mbps)", "Daily Housekeeping"],
  "roomTypes": [
    {
      "id": "uuid",
      "name": "Private Studio Room",
      "capacity": 1,
      "baseRent": 16500,
      "description": "Single resident room with attached bath"
    }
  ],
  "rulesNotes": "Gate closes at 11:30 PM.",
  "createdAt": "2026-09-20T05:00:00.000Z",
  "stats": {
    "totalRooms": 12,
    "occupiedRooms": 8,
    "vacantRooms": 3,
    "maintenanceRooms": 1
  }
}
```

`stats` only on list/get. Omit on create request.

---

### `GET /buildings`

Query: `page`, `pageSize`.

**Response 200** `{ "data": { "buildings": [ Building ] } }` + pagination.

---

### `GET /buildings/:id`

**Response 200** `{ "data": { "building": Building } }`

---

### `POST /buildings`

**Request**

```json
{
  "name": "Greenfield Luxury PG",
  "code": "GLP",
  "address": "14/B, 7th Sector, HSR Layout",
  "city": "Bengaluru, Karnataka 560102",
  "totalFloors": 3,
  "electricityRatePerUnit": 10,
  "billingDueDay": 5,
  "electricityBillingCycle": "monthly",
  "managerName": "Anita Sharma",
  "managerPhone": "9811122334",
  "upiId": "greenfield.living@okhdfcbank",
  "amenities": ["Wi-Fi", "Daily Meals", "Housekeeping", "CCTV Security"],
  "rulesNotes": "Visitors until 9 PM.",
  "roomTypes": [
    { "name": "Private Single", "capacity": 1, "baseRent": 15000 },
    { "name": "Double Sharing", "capacity": 2, "baseRent": 10000, "description": "Twin beds" }
  ]
}
```

| Field | Required | Default |
|---|---|---|
| name | yes | |
| code | no | first 3 letters of name, uppercase, unique per owner |
| address | yes | |
| city | yes | |
| totalFloors | yes | 1–50 |
| electricityRatePerUnit | yes | > 0 |
| billingDueDay | yes | 1–28 |
| electricityBillingCycle | no | `monthly` |
| managerName | no | `"Property Manager"` |
| managerPhone | no | |
| roomTypes | yes | min 1; server assigns `id` |
| amenities | no | `[]` |

**Response 201** `{ "data": { "building": Building } }`

**403 PLAN_LIMIT** if `count(buildings)+1 > subscription.maxBuildings`.

---

### `PATCH /buildings/:id`

**Request** — partial of POST body (including `roomTypes` replace-all if sent).

Do not allow changing `ownerId`.

**Response 200** `{ "data": { "building": Building } }`

---

### `DELETE /buildings/:id`

Rules:

1. If any room `status === occupied` **or** any tenant `status !== vacated` → **409** `{ "code": "BUILDING_HAS_OCCUPANTS" }`
2. Else cascade delete: rooms, vacated tenants, co-occupants, payments, electricity for that building.

**Response 200** `{ "data": { "deleted": true, "id": "uuid" } }`

---

## 5. Rooms

### Room resource

```json
{
  "id": "uuid",
  "buildingId": "uuid",
  "roomNumber": "101",
  "floor": 1,
  "roomTypeId": "uuid",
  "capacity": 2,
  "baseRent": 22000,
  "status": "occupied",
  "primaryTenantId": "uuid",
  "maintenanceReason": null,
  "hasAttachedBathroom": true,
  "hasAirConditioner": true,
  "hasBalcony": false,
  "meterNumber": "MTR-SER-101",
  "lastMeterReading": 1450,
  "lastMeterReadingDate": "2026-09-01",
  "occupantCount": 2
}
```

`occupantCount` = active primary tenants in room (usually 0–1) + co-occupants. Computed.

---

### `GET /rooms`

Query: `buildingId`, `status`, `floor`, `search` (roomNumber), `page`, `pageSize`.

**Response 200** `{ "data": { "rooms": [ Room ] } }`

---

### `GET /rooms/:id`

**Response 200** `{ "data": { "room": Room } }`

---

### `POST /rooms`

**Request**

```json
{
  "buildingId": "uuid",
  "roomNumber": "204",
  "floor": 2,
  "roomTypeId": "uuid",
  "capacity": 2,
  "baseRent": 20000,
  "hasAirConditioner": true,
  "hasAttachedBathroom": true,
  "hasBalcony": false,
  "meterNumber": "MTR-204"
}
```

Server sets: `status=vacant`, `primaryTenantId=null`, `lastMeterReading=1000`, `lastMeterReadingDate=today` (match RoomModal).

| Rules |
|---|
| `roomNumber` unique per building |
| `floor` 1..building.totalFloors |
| `roomTypeId` must belong to that building |
| `capacity` 1–8, `baseRent` > 0 |
| **403 PLAN_LIMIT** if owner room count ≥ `maxRooms` |

**Response 201** `{ "data": { "room": Room } }`

---

### `PATCH /rooms/:id`

**Request** — any of POST fields. Cannot set `status` here (use status endpoint). Cannot set `primaryTenantId` (use check-in/vacate).

**Response 200** `{ "data": { "room": Room } }`

---

### `DELETE /rooms/:id`

**409** `ROOM_NOT_VACANT` unless `status === vacant` and no active tenant.

**Response 200** `{ "data": { "deleted": true, "id": "uuid" } }`

---

### `PATCH /rooms/:id/status`

**Request**

```json
{
  "status": "maintenance",
  "reason": "Plumbing leak on attached bath"
}
```

| From → To | Rules |
|---|---|
| occupied → maintenance | **409** `ROOM_OCCUPIED` |
| occupied → vacant | **409** use `POST /tenants/:id/vacate` |
| vacant/maintenance → occupied | **409** use check-in |
| vacant → maintenance | `reason` required |
| maintenance → vacant | clear `maintenanceReason`, `primaryTenantId` |

**Response 200** `{ "data": { "room": Room } }`

---

## 6. Tenants (check-in / lease)

### Tenant resource

```json
{
  "id": "uuid",
  "buildingId": "uuid",
  "roomId": "uuid",
  "fullName": "Rahul Sharma",
  "phone": "9876500111",
  "email": "rahul@example.com",
  "avatarUrl": null,
  "gender": "male",
  "dateOfBirth": null,
  "occupation": "Software Professional",
  "workOrCollegeName": "Razorpay",
  "permanentAddress": "Bangalore, India",
  "emergencyContactName": "Family",
  "emergencyContactRelation": "Parent",
  "emergencyContactPhone": "9876500111",
  "checkInDate": "2026-09-20",
  "expectedCheckOutDate": null,
  "noticeGivenDate": null,
  "status": "active",
  "monthlyRent": 22000,
  "securityDeposit": 44000,
  "depositStatus": "paid",
  "depositPaidAmount": 44000,
  "notes": null,
  "documents": []
}
```

---

### `GET /tenants`

Query: `buildingId`, `roomId`, `status`, `search` (name/phone/email), `page`, `pageSize`.

**Response 200** `{ "data": { "tenants": [ Tenant ] } }`

---

### `GET /tenants/:id`

Include documents metadata (no file bytes). File access via document file URL.

**Response 200** `{ "data": { "tenant": Tenant } }`

---

### `POST /tenants` — check-in (atomic)

**Request** (RoomCheckInModal)

```json
{
  "buildingId": "uuid",
  "roomId": "uuid",
  "fullName": "Rahul Sharma",
  "phone": "9876500111",
  "email": "rahul@example.com",
  "gender": "male",
  "occupation": "Software Professional",
  "workOrCollegeName": "Razorpay, Koramangala",
  "permanentAddress": "HSR Layout, Bengaluru",
  "emergencyContactName": "Suresh Sharma",
  "emergencyContactRelation": "Father",
  "emergencyContactPhone": "9876599900",
  "checkInDate": "2026-09-20",
  "monthlyRent": 22000,
  "securityDeposit": 44000,
  "depositStatus": "paid",
  "idProofNumber": "1234-5678-9012",
  "coOccupants": [
    {
      "fullName": "Pooja Sharma",
      "relationship": "Spouse",
      "phone": "9876500112",
      "gender": "female",
      "aadharNumber": "2345-6789-0123"
    }
  ]
}
```

| Field | Required | Default |
|---|---|---|
| buildingId, roomId, fullName, phone | yes | |
| email | no | `""` |
| gender | no | `male` |
| occupation | no | `"Software Professional"` |
| workOrCollegeName | no | `""` |
| permanentAddress | no | `"Bangalore, India"` |
| emergencyContactName | no | `"Family"` |
| emergencyContactRelation | no | `"Parent"` |
| emergencyContactPhone | no | tenant phone |
| checkInDate | yes | |
| monthlyRent | yes | > 0 |
| securityDeposit | yes | ≥ 0 |
| depositStatus | yes | `paid` \| `partial` \| `pending` |
| idProofNumber | no | if set, create aadhaar document `status=pending` (do **not** auto-verify in prod) |
| coOccupants | no | |

Server sets:

```
depositPaidAmount = depositStatus === "paid" ? securityDeposit : 0
status = "active"
documents = [] or aadhaar stub without file
```

Side effects (single transaction):

1. Room must belong to `buildingId` and owner.
2. Room `status` must be `vacant` (not maintenance).
3. `1 + coOccupants.length <= room.capacity` else **409** `ROOM_CAPACITY_EXCEEDED`.
4. Set room `status=occupied`, `primaryTenantId=newTenant.id`.
5. Insert co-occupants with `tenantId`, `roomId`, `checkInDate`.

**Response 201**

```json
{
  "success": true,
  "data": {
    "tenant": { },
    "room": { },
    "coOccupants": [ ]
  }
}
```

**409** `ROOM_NOT_VACANT`.

---

### `PATCH /tenants/:id`

**Request** — subset of tenant profile/lease fields. Allowed:

`fullName`, `phone`, `email`, `gender`, `dateOfBirth`, `occupation`, `workOrCollegeName`, `permanentAddress`, `emergencyContactName`, `emergencyContactRelation`, `emergencyContactPhone`, `monthlyRent`, `securityDeposit`, `depositStatus`, `depositPaidAmount`, `notes`.

Not allowed: `status`, `roomId`, `buildingId`, `checkInDate` (use notice/vacate/check-in).

**Response 200** `{ "data": { "tenant": Tenant } }`

---

### `POST /tenants/:id/notice`

**Request**

```json
{ "expectedCheckOutDate": "2026-10-20" }
```

Tenant must be `active`. Sets `status=notice_period`, `noticeGivenDate=today`.

**Response 200** `{ "data": { "tenant": Tenant } }`

**409** if already vacated.

---

### `POST /tenants/:id/vacate`

**Request**

```json
{ "refundDeposit": true }
```

Transaction:

1. Tenant `status=vacated`, `expectedCheckOutDate=today` if unset.
2. If `refundDeposit`, `depositStatus=refunded`.
3. Delete or detach co-occupants for that room (delete in P0).
4. Room `status=vacant`, `primaryTenantId=null`.

**Response 200**

```json
{
  "data": {
    "tenant": { },
    "room": { }
  }
}
```

**409** already vacated.

---

## 7. Documents (KYC)

P0: store files in private object storage. Persist metadata on tenant. **Never** accept base64 in JSON.

### Document resource

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "type": "aadhaar",
  "title": "Aadhaar Identity Proof",
  "documentNumber": "XXXX-XXXX-9012",
  "fileName": "aadhaar_rahul.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 245001,
  "uploadDate": "2026-09-20",
  "status": "pending",
  "notes": null
}
```

Mask Aadhaar/PAN in list responses (last 4). Full number only to authenticated owner.

---

### `GET /tenants/:id/documents`

**Response 200** `{ "data": { "documents": [ Document ] } }`

---

### `POST /tenants/:id/documents` — `multipart/form-data`

| Part | Type | Required |
|---|---|---|
| file | File | yes, PDF/JPEG/PNG, max 10 MB |
| type | DocType | yes |
| title | string | yes |
| documentNumber | string | no |
| notes | string | no |

Server: `status=pending`, `uploadDate=today`.

**Response 201** `{ "data": { "document": Document } }`

---

### `GET /documents/:docId/file` — auth, owner of tenant

**Response 200**

```json
{
  "data": {
    "url": "https://cdn.example.com/kyc/...?X-Amz-Expires=300",
    "expiresIn": 300
  }
}
```

Redirect **302** is also acceptable. UI uses this for `AadharPdfViewerModal`.

---

## 8. Co-occupants

### CoOccupant resource

```json
{
  "id": "uuid",
  "roomId": "uuid",
  "tenantId": "uuid",
  "fullName": "Pooja Mehta",
  "relationship": "Spouse",
  "phone": "9876500222",
  "gender": "female",
  "age": 28,
  "occupation": "Designer",
  "checkInDate": "2026-09-20",
  "aadharNumber": "XXXX-XXXX-0123",
  "aadharDocName": "pooja_aadhaar.pdf",
  "aadharDocUrl": null,
  "hasAadhaarFile": true,
  "notes": null,
  "createdAt": "2026-09-20T05:00:00.000Z"
}
```

Do not return raw `aadharDocUrl` data URLs. `hasAadhaarFile` + `GET /co-occupants/:id/aadhaar` signed URL.

---

### `GET /co-occupants`

Query: `roomId` or `tenantId` (at least one), `page`, `pageSize`.

**Response 200** `{ "data": { "coOccupants": [ CoOccupant ] } }`

---

### `POST /co-occupants`

**Request** (JSON metadata; file via aadhaar endpoint)

```json
{
  "roomId": "uuid",
  "tenantId": "uuid",
  "fullName": "Pooja Mehta",
  "relationship": "Spouse",
  "phone": "9876500222",
  "gender": "female",
  "age": 28,
  "occupation": "Designer",
  "checkInDate": "2026-09-20",
  "aadharNumber": "234567890123",
  "notes": "Checked in with primary tenant"
}
```

| Required | `roomId`, `tenantId`, `fullName`, `phone`, `relationship`, `gender`, `checkInDate` |
| Tenant must be active/notice on that room. Room occupied. `occupantCount+1 <= capacity` else **409**. |

**Response 201** `{ "data": { "coOccupant": CoOccupant } }`

---

### `PATCH /co-occupants/:id`

Partial of POST body. Cannot move to another room in P0.

**Response 200** `{ "data": { "coOccupant": CoOccupant } }`

---

### `DELETE /co-occupants/:id`

**Response 200** `{ "data": { "deleted": true, "id": "uuid" } }`

---

### `POST /co-occupants/:id/aadhaar` — multipart

Part `file`: PDF/JPEG/PNG, max 10 MB.

**Response 200** `{ "data": { "coOccupant": CoOccupant } }`

### `GET /co-occupants/:id/aadhaar`

Same signed-URL pattern as tenant documents.

---

## 9. Rent payments

### Payment resource (`RentPayment`)

```json
{
  "id": "uuid",
  "receiptNumber": "RCP-202609-001",
  "tenantId": "uuid",
  "tenantName": "Rahul Sharma",
  "buildingId": "uuid",
  "buildingName": "Skyline Elite Residency",
  "roomId": "uuid",
  "roomNumber": "101",
  "billingMonth": "2026-09",
  "billingPeriodStart": "2026-09-01",
  "billingPeriodEnd": "2026-09-30",
  "rentAmount": 22000,
  "electricityAmount": 517.5,
  "electricityUnits": 45,
  "maintenanceCharges": 0,
  "otherCharges": 0,
  "discount": 0,
  "totalPayable": 22517.5,
  "amountPaid": 22517.5,
  "balanceDue": 0,
  "paymentDate": "2026-09-20",
  "paymentMode": "upi",
  "transactionReference": "UPI123456",
  "status": "paid",
  "receivedBy": "Vikram Malhotra",
  "notes": null,
  "createdAt": "2026-09-20T05:12:00.000Z"
}
```

**Server computes** (do not trust client totals):

```
totalPayable = max(0, rentAmount + electricityAmount + maintenanceCharges + otherCharges - discount)
balanceDue = max(0, totalPayable - amountPaid)
status = balanceDue === 0 && amountPaid > 0 ? "paid"
       : amountPaid > 0 ? "partial"
       : "pending"
```

Denormalized names (`tenantName`, `buildingName`, `roomNumber`) snapshotted at create time.

`receiptNumber` format: `RCP-{YYYYMM}-{seq}` where `seq` is per-owner per-month, zero-padded 3.

`billingPeriodStart` = first day of month. `billingPeriodEnd` = last calendar day (do not hardcode `-30`).

---

### `GET /payments`

Query: `buildingId`, `tenantId`, `billingMonth`, `status`, `page`, `pageSize`. Default sort `createdAt desc`.

**Response 200** `{ "data": { "payments": [ Payment ] } }`

---

### `GET /payments/:id`

**Response 200** `{ "data": { "payment": Payment } }`

---

### `POST /payments` — header `Idempotency-Key: uuid`

**Request** (RentCollectionModal; omit computed fields)

```json
{
  "tenantId": "uuid",
  "billingMonth": "2026-09",
  "rentAmount": 22000,
  "includeElectricity": true,
  "electricityAmount": 517.5,
  "electricityUnits": 45,
  "maintenanceCharges": 0,
  "otherCharges": 0,
  "discount": 0,
  "amountPaid": 22517.5,
  "paymentDate": "2026-09-20",
  "paymentMode": "upi",
  "transactionReference": "UPI123456",
  "receivedBy": "Vikram Malhotra",
  "notes": null
}
```

If `includeElectricity` is true and `electricityAmount` omitted, server fills from latest electricity record for that room+month where `billedTenantIds` contains tenant.

Server fills `buildingId`, `roomId`, names from tenant.

Tenant must not be `vacated`. Amounts ≥ 0. `discount ≤ rent+elec+maint+other`.

**Response 201** `{ "data": { "payment": Payment } }`

---

### `GET /tenants/:id/dues`

Query: `billingMonth` required (`YYYY-MM`).

**Response 200**

```json
{
  "data": {
    "tenantId": "uuid",
    "billingMonth": "2026-09",
    "monthlyRent": 22000,
    "electricityShare": 517.5,
    "electricityUnits": 45,
    "electricityRecordId": "uuid",
    "alreadyPaid": 0,
    "totalPayable": 22517.5,
    "balanceDue": 22517.5,
    "dueDate": "2026-09-05",
    "isOverdue": true,
    "daysOverdue": 15
  }
}
```

`dueDate` = `{billingMonth}-{billingDueDay padded}` using tenant’s building. `alreadyPaid` = sum of `amountPaid` for that tenant+month. Use **real calendar**, not hardcoded 2026-09 / day 18.

---

## 10. Electricity

### Electricity resource

```json
{
  "id": "uuid",
  "buildingId": "uuid",
  "roomId": "uuid",
  "roomNumber": "101",
  "month": "2026-09",
  "readingDate": "2026-09-18",
  "previousReading": 1400,
  "currentReading": 1450,
  "unitsConsumed": 50,
  "ratePerUnit": 11.5,
  "totalAmount": 575,
  "splitCount": 2,
  "amountPerTenant": 287.5,
  "status": "billed",
  "meterPhotoUrl": null,
  "hasMeterPhoto": false,
  "notes": null,
  "billedTenantIds": ["uuid-tenant"]
}
```

**Server computes:**

```
unitsConsumed = max(0, currentReading - previousReading)
totalAmount = round(unitsConsumed * ratePerUnit)   // rupees, 2 decimals OK
splitCount = max(1, count of tenants in room with status != vacated)
amountPerTenant = totalAmount / splitCount
billedTenantIds = those tenant ids (P0: primary tenants only, matching MeterReadingModal)
status = "billed"
```

Also update room `lastMeterReading`, `lastMeterReadingDate`.

P0: **one record per room per month**. **409** `READING_EXISTS` if duplicate.

Warn (not block) if `currentReading < previousReading` — client confirms; server accepts if `allowDecrease: true`.

---

### `GET /electricity`

Query: `buildingId`, `roomId`, `month`, `page`, `pageSize`.

**Response 200** `{ "data": { "records": [ ElectricityRecord ] } }`

---

### `POST /electricity` — `Idempotency-Key`

**Request** (JSON). Meter photo is P1; omit in P0 or accept later.

```json
{
  "roomId": "uuid",
  "month": "2026-09",
  "readingDate": "2026-09-18",
  "previousReading": 1400,
  "currentReading": 1450,
  "ratePerUnit": 11.5,
  "allowDecrease": false,
  "notes": null
}
```

If `previousReading` omitted, use `room.lastMeterReading` or `0`. If `ratePerUnit` omitted, use `building.electricityRatePerUnit`.

**400** if `currentReading < previousReading` and `allowDecrease !== true`.

**Response 201** `{ "data": { "record": ElectricityRecord, "room": Room } }`

---

## 11. Dashboard & overdue

Use request timezone `Asia/Kolkata`. `month` query default = current IST month.

---

### `GET /dashboard`

Query: `buildingId` optional (`all` if omitted), `month=YYYY-MM`.

**Response 200** — `DashboardStats` plus month context:

```json
{
  "data": {
    "month": "2026-09",
    "buildingId": null,
    "stats": {
      "totalBuildings": 2,
      "totalRooms": 24,
      "occupiedRooms": 18,
      "vacantRooms": 5,
      "maintenanceRooms": 1,
      "totalResidents": 27,
      "totalAllowedCapacity": 48,
      "occupancyRate": 75,
      "expectedRevenue": 412500,
      "collectedRevenue": 301200,
      "totalOverdueAmount": 45200,
      "overdueTenantsCount": 4,
      "electricityCollected": 8400
    }
  }
}
```

Definitions (match `PGContext`):

- Scope rooms/tenants/payments to owner, then to `buildingId` if set.
- `occupancyRate` = round(occupiedRooms / totalRooms * 100)
- `totalResidents` = active+notice tenants in scope + co-occupants in those rooms
- `expectedRevenue` = sum(active+notice `monthlyRent`) + sum(electricity `totalAmount` for rooms in scope that month)
- `collectedRevenue` = sum(payments.amountPaid) for `billingMonth`
- `electricityCollected` = sum(payments.electricityAmount) for `billingMonth`
- overdue fields from overdue algorithm below

---

### `GET /overdue`

Query: `buildingId`, `month` (default current).

**Algorithm** (replace hardcoded `currentMonthStr='2026-09'` and `currentDateDay=18`):

For each tenant in scope with `status !== vacated`:

```
dueDay = building.billingDueDay
dueDate = month + dueDay (clamp to last day of month)
if today < dueDate: skip
paid = sum(payments.amountPaid where tenantId and billingMonth)
elecShare = sum(electricity.amountPerTenant where roomId, month, billedTenantIds contains tenant)
expected = tenant.monthlyRent + elecShare
balance = max(0, expected - paid)
if balance <= 0: skip
overdueRent = max(0, monthlyRent - paid)
overdueElectricity = max(0, balance - overdueRent)
daysOverdue = today - dueDate in days
```

**Response 200**

```json
{
  "data": {
    "month": "2026-09",
    "asOf": "2026-09-20",
    "items": [
      {
        "tenantId": "uuid",
        "tenant": { },
        "building": { },
        "room": { },
        "billingMonth": "2026-09",
        "dueDate": "2026-09-05",
        "daysOverdue": 15,
        "overdueRent": 22000,
        "overdueElectricity": 517.5,
        "totalOverdue": 22517.5,
        "lastContactedDate": null,
        "notes": null
      }
    ]
  }
}
```

Sort `daysOverdue` desc. Nested `tenant`/`building`/`room` may be slim (id, name, phone, roomNumber) to keep payload small; full objects are OK if they match the UI `OverdueSummary`.

---

## 12. AuthZ matrix

| Route | Auth | Onboarded | Notes |
|---|---|---|---|
| `GET /health` | no | — | |
| `POST /auth/*` except logout | no | — | |
| `POST /auth/logout`, `GET /auth/me` | yes | no | |
| `PATCH /account*` | yes | no | |
| `POST /onboarding` | yes | must be false | |
| All other `/v1/*` | yes | yes | owner scope |

Role in P0 is only `owner`. No manager/staff APIs.

---

## 13. Suggested tables (PostgreSQL)

```
users
  id uuid pk
  full_name, email unique, phone unique
  password_hash, is_onboarded, role
  business_name, gst_number, business_address
  avatar_url, created_at

user_bank_details  (1:1 users, encrypted account_number)
user_subscriptions (1:1 users)

sessions (refresh_token_hash, expires_at, revoked_at)

password_otps (user_id, otp_hash, expires_at, consumed_at)

buildings (owner_id fk, code unique(owner_id, code), ...)
building_room_types (building_id, name, capacity, base_rent, description)

rooms (building_id, room_number unique(building_id, room_number), ...)

tenants (owner via building, room_id, status, ...)
tenant_documents (tenant_id, storage_key, ...)

co_occupants (tenant_id, room_id, storage_key nullable)

payments (owner_id, tenant_id, receipt_number unique(owner_id, receipt_number), idempotency_key unique)

electricity_records (room_id, month unique(room_id, month), idempotency_key unique)
electricity_billed_tenants (record_id, tenant_id)
```

Indexes: `buildings.owner_id`, `rooms.building_id`, `tenants.building_id`, `tenants.phone`, `payments(tenant_id, billing_month)`, `electricity(room_id, month)`.

---

## 14. P0 out of scope (do not build yet)

- Razorpay checkout / webhooks / cancel
- WhatsApp / SMS rent reminders (`lastContactedDate` field may exist, no send API)
- Receipt PDF generation (client print is enough)
- Meter photo upload
- CSV / JSON backup import-export
- Document verify/reject PATCH
- Delete/void payment
- Change password / avatar upload
- Seed sample portfolio data for new owners (`seedSampleData`)

---

## 15. Frontend mapping (replace IndexedDB)

| UI action | Endpoint |
|---|---|
| Register / Login / Logout / Forgot | `/auth/*` |
| Restore session | `GET /auth/me` |
| Onboarding wizard finish | `POST /onboarding` |
| Business settings save | `PATCH /account` + `PATCH /account/bank` |
| Building modal | `POST/PATCH/DELETE /buildings` |
| Room modal / status | `POST/PATCH/DELETE /rooms`, `PATCH /rooms/:id/status` |
| Check-in modal | `POST /tenants` |
| Tenant edit / notice / vacate | `PATCH /tenants`, `POST .../notice`, `POST .../vacate` |
| KYC upload / Aadhaar viewer | `POST /tenants/:id/documents`, `GET /documents/:id/file` |
| Co-occupant modal | `/co-occupants*` |
| Collect rent | `GET /tenants/:id/dues` then `POST /payments` |
| Meter reading | `POST /electricity` |
| Dashboard tab | `GET /dashboard` |
| Overdue tab | `GET /overdue` |
