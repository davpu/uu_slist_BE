# uu-slist-be

Shopping list backend — BBSY Homework #3.

This repository is the basic implementation of the endpoints identified in
the previous homework. It focuses on:

- Input data validation (`dtoIn`) via JSON Schema (Ajv).
- Authentication (Bearer JWT) and authorization against **application profiles**.
- A uniform response envelope that always echoes the received `dtoIn` and
  returns error information via `errorMap`.

> No persistence or business logic is implemented at this stage — controllers
> return a stub `data` payload alongside the echoed `dtoIn`.

The submission document (profiles + endpoint `dtoIn` / `dtoOut`) is kept
beside this repository (not in it) at `../uu_slist_BE_HW3.md`.

## Tech stack

- **TypeScript 5** with `strict` + `noUncheckedIndexedAccess` + NodeNext ESM.
- Node.js (≥ 18) + Express 4.
- [Ajv 8](https://ajv.js.org/) (+ ajv-formats) for schema validation.
- [`json-schema-to-ts`](https://github.com/ThomasAribart/json-schema-to-ts)
  so DTO types are **derived from the same schemas Ajv validates against**
  — single source of truth.
- `jsonwebtoken` for JWT auth.
- `tsx` for dev (watch mode); `tsc` for type-check / build.

## Run

```bash
npm install
cp .env.example .env        # edit as needed

npm run dev                  # tsx watch src/server.ts
# or, production-ish
npm run build && npm start   # tsc → node dist/server.js

npm run typecheck            # tsc --noEmit
```

The server boots on `http://localhost:${PORT}` (default `3000`).

## Project structure

```
src/
├── server.ts                 # boot
├── app.ts                    # express app factory, route mounting, error handlers
├── config.ts                 # env + Profiles enum
├── types/
│   └── express.ts            # Request augmentation (req.user, req.dtoIn) + AuthUser type
├── middleware/
│   ├── validate.ts           # Ajv-based body validation
│   ├── authenticate.ts       # Bearer JWT → req.user
│   ├── authorize.ts          # profile-based authorization
│   └── errorHandler.ts       # maps ApiError → { dtoIn, errorMap } response
├── utils/
│   ├── errors.ts             # ApiError class + error-code enum
│   ├── respond.ts            # ok<Data>() — typed success envelope
│   └── typedHandler.ts       # authedHandler<DtoIn> / publicHandler<DtoIn> wrappers
├── schemas/                  # JSON schemas + `FromSchema` derived DTO types
│   ├── user.ts
│   └── shoppingList.ts
├── routes/
│   ├── user.ts
│   └── shoppingList.ts
└── controllers/
    ├── user.ts
    └── shoppingList.ts
```

### Type safety highlights

- `FromSchema<typeof someSchema>` gives a DTO type derived directly from the
  JSON schema — changes to the schema propagate to the controllers.
- `authedHandler<DtoIn>((req, res) => { … })` provides non-null
  `req.user: AuthUser` and `req.dtoIn: DtoIn` inside the body, so controllers
  don't need casts.
- Global `Express.Request` augmentation exposes `user?: AuthUser` and
  `dtoIn?: unknown` everywhere for middleware code.
- `ApiError` carries a typed `code: ErrorCode` so response envelopes stay
  consistent.

## Response envelope

All endpoints return JSON in one of these two shapes:

Success:

```json
{ "dtoIn": { "...echo..." }, "data": { "...result..." } }
```

Failure:

```json
{
  "dtoIn": { "...echo..." },
  "errorMap": {
    "invalidInput": {
      "message": "Request body failed validation.",
      "details": { "validationErrors": [ /* ajv errors */ ] }
    }
  }
}
```

HTTP status: `200`/`201` on success, `400` for validation, `401` for
missing/invalid auth, `403` for authorization, `404` for unknown routes,
`500` for unexpected errors.

## Profiles

- **Public** — no auth (applies to `user/register` and `user/login`).
- **Users** — any authenticated user. Required for all `shoppingList/*`
  and `user/get`, `user/update`.
- **Authorities** — administrators. Accepted wherever `Users` is accepted.

The admin profile is assigned at login time when the email matches
`ADMIN_EMAIL` (default `admin@example.com`) — this is a stub until a data
layer is added in HW #4.

Instance-level authorization (list **Owner** / list **Member**) is a domain
concern and belongs to the controller + data layer; deferred until HW #4.