# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Kafe Yönetim Uygulaması (café management system) — an npm workspaces monorepo with a NestJS backend and two Expo/React Native apps (customer-facing and staff-facing) sharing a common types package.

- `apps/backend` — NestJS API (TypeScript, Prisma/SQLite, JWT auth, Socket.IO gateway)
- `apps/customer-app` — Expo Router app for customers (ordering, loyalty, wallet)
- `apps/staff-app` — Expo Router app for staff (shifts, training, orders)
- `packages/shared-types` — shared TypeScript enums/DTOs (`@kafe/shared-types`), consumed by both backend and both apps

## Commands

Run from the repo root unless noted.

- Install: `npm install` (single install for the whole workspace)
- Build shared types (do this before running backend/apps after changing `packages/shared-types`): `npm run build:shared`
- Backend dev server: `npm run dev:backend` (NestJS watch mode, default port 3000, Swagger at `/api`)
- Customer app dev: `npm run dev:customer` (Expo web on default port)
- Staff app dev: `npm run dev:staff` (Expo web on port 8082)
- Prisma migrate (backend): `npm run db:migrate`
- Prisma Studio (backend): `npm run db:studio`

Backend-only commands (run with `--workspace=apps/backend` from root, or `cd apps/backend` first):
- `prisma generate` after any schema change, before TypeScript will typecheck correctly
- `nest build` — production build
- There are currently no `test` or `lint` npm scripts defined in any package — don't assume Jest/ESLint tooling exists until you check `apps/backend/package.json` again or the user adds it.

Mobile apps (Expo): `npm run android` / `ios` / `web` inside `apps/customer-app` or `apps/staff-app`; `expo lint` is available via the `lint` script.

## Architecture

### Backend (`apps/backend`)

NestJS app bootstrapped in `src/main.ts`, module graph wired in `src/app.module.ts`. Feature modules: `prisma`, `users`, `auth`, `products`, `orders`, `gateway`, `shifts`, `training`, `wallet`.

- **Database**: Prisma with SQLite (`apps/backend/prisma/schema.prisma`), file-based via `DATABASE_URL`. Models cover users (with `CustomerProfile`/`StaffProfile` split), products/categories, orders/order items, loyalty transactions, shifts + shift change requests, staff training modules/questions/progress, wallet + wallet transactions/topups, and iyzico-backed `Payment` records. Most enum-like fields (role, status, etc.) are stored as plain strings in SQLite but typed via enums in `@kafe/shared-types` — keep both in sync when adding new states.
- **Auth**: JWT-based (`@nestjs/passport` + `@nestjs/jwt`), access tokens short-lived (15m) with refresh tokens persisted in `RefreshToken` table (hashed, revocable). `JwtStrategy` in `src/auth/jwt.strategy.ts`.
- **Realtime**: `GatewayModule` is `@Global()` and exposes `EventsGateway` (Socket.IO) for order/status push updates to the customer and staff apps; it depends on `AuthModule` for authenticating socket connections.
- **Payments**: `iyzipay` SDK integration for online payments (`Payment`, `WalletTopup` models track iyzico conversation/payment IDs and raw responses).
- **Cross-cutting concerns**, wired globally in `main.ts` (not via Nest's module DI), so check there first when debugging request/response behavior:
  - `LoggingInterceptor` (`src/common/interceptors`) logs every request/response and redacts sensitive keys (password, token, secret, card number, cvv) before logging.
  - `ProductionExceptionFilter` (`src/common/filters`) hides stack traces and internal error messages when `NODE_ENV=production`, passes them through in dev.
  - Global `ThrottlerGuard` (100 req/min default) is registered as an `APP_GUARD` provider in `app.module.ts`, not in `main.ts`.
- CORS is locked to explicit origin lists in `main.ts` — production origins are hardcoded (`kalla.co`, `admin.kalla.co`); update that list (not a wildcard) when adding new frontend domains. Includes a manual handler for Chrome's Private Network Access preflight since apps talk to `localhost` backends during development.
- Swagger docs are auto-generated and served at `/api`.

### Shared types (`packages/shared-types`)

Plain TypeScript, compiled with `tsc` to `dist/`. Defines the `Role`, `LoyaltyTier`, `OrderStatus`, `OrderType`, `PaymentStatus`, `ShiftStatus`, `ShiftChangeRequestStatus`, `TrainingProgressStatus` enums and core DTOs (`UserDto`, `AuthResponse`). Both apps and the backend depend on this via `@kafe/shared-types` — after editing it, run `npm run build:shared` before other packages will pick up the change (no live workspace symlink rebuild is wired up).

### Mobile apps (`apps/customer-app`, `apps/staff-app`)

Both are Expo Router (`expo-router/entry`) React Native apps on Expo SDK 57 / React Native 0.86, sharing nearly identical dependency sets and talking to the same backend via REST + Socket.IO (`socket.io-client`). They differ in purpose (customer ordering/loyalty/wallet flows vs. staff shifts/training/order-handling flows) and staff-app runs its web dev server on port 8082 to avoid colliding with customer-app.

Both app folders currently only contain an `AGENTS.md` note (Expo SDK 57 changed significantly — check https://docs.expo.dev/versions/v57.0.0/ before writing Expo-specific code, since training data may reference older/removed APIs).
