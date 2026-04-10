# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Tiyeni Mobile App

**Artifact:** `artifacts/tiyeni` (Expo React Native)

A peer-to-peer transport and parcel delivery platform for Malawi. Users can send parcels, offer trips, chat, and coordinate deliveries.

### Architecture

- **State management**: React Context (AuthContext, AppDataContext) + AsyncStorage for persistence
- **Navigation**: Expo Router with tab navigation (5 tabs) and modal screens
- **UI**: Custom components with react-native-reanimated animations, Inter font

### Key Screens

- `app/(auth)/welcome.tsx` — Onboarding with slide carousel
- `app/(auth)/login.tsx` — Phone number login
- `app/(auth)/register.tsx` — Registration form
- `app/(auth)/otp.tsx` — OTP verification (demo code: 123456)
- `app/(tabs)/index.tsx` — Home feed (trips + parcels)
- `app/(tabs)/messages.tsx` — Conversations list
- `app/(tabs)/trips.tsx` — My trips/parcels activity
- `app/(tabs)/profile.tsx` — User profile + settings
- `app/(post)/index.tsx` — Post type selection modal
- `app/(post)/send-parcel.tsx` — 3-step parcel request flow
- `app/(post)/offer-trip.tsx` — Trip offering form
- `app/chat/[id].tsx` — Real-time chat interface

### Design

- **Primary color**: #2E7D32 (forest green)
- **Accent**: #F59E0B (gold/amber)
- **Font**: Inter (400/500/600/700)
- **Radius**: 16px

### Contexts

- `AuthContext` — User authentication and profile
- `AppDataContext` — Trips, parcels, conversations (AsyncStorage backed)
- `ToastContext` — App-wide toast notifications
