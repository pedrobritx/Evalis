# Evalis

> **Status: paused on 9 November 2026.** Not in active development. Nothing has been removed, and work can resume from this point.

Evalis is an adaptive CEFR placement MVP for ESL programs.

It includes:
- adaptive per-skill testing (`reading`, `listening`, `usee`, `writing`)
- confidence-banded CEFR output (`+`, neutral, `-`)
- teacher-managed JSON item bank with import/export
- writing evaluation workflow (opt-in, non-blocking) with provider adapters
- quota tracking + audit logs for writing AI usage
- reporting dashboards with radar/confidence visuals

## Tech Stack

- Next.js App Router (TypeScript)
- Node.js runtime
- PostgreSQL + Prisma
- Recharts for report visualizations
- Vitest + Playwright test scaffolding

## Project Structure

- `src/modules/assessment`: adaptive engine, item selection, stop rules, session orchestration
- `src/modules/scoring`: CEFR mapping, confidence logic, overall-level weighting
- `src/modules/item-bank`: item schemas, ID generation, CRUD services
- `src/modules/writing`: rubric mapping, provider adapters, evaluation orchestration
- `src/modules/reporting`: report build logic and skill feedback text
- `src/modules/usage`: quota and audit services
- `src/app/api`: session/report/teacher/auth endpoints
- `src/app`: landing, test UI, results UI, teacher pages
- `src/db/prisma/schema.prisma`: core data model

## Environment Variables

Copy `.env.example` to `.env.local` and set values:

```bash
cp .env.example .env.local
```

## Local Setup

1. Install dependencies:
```bash
npm install
```

2. Generate Prisma client:
```bash
npm run prisma:generate
```

3. Push schema (or migrate) to your Postgres database:
```bash
npm run prisma:dbpush
```

4. Seed demo users/items:
```bash
npm run db:seed
```

5. Start app:
```bash
npm run dev
```

## Test Commands

- `npm run lint`
- `npm test`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e` (currently skeleton tests are skipped)

## API Surface (MVP)

- `POST /api/sessions`
- `GET /api/sessions/:id/next-item?skill=...`
- `POST /api/sessions/:id/submit-response`
- `POST /api/sessions/:id/finalize`
- `GET /api/reports/:sessionId`
- `GET|POST|PATCH|DELETE /api/teacher/items`
- `POST /api/teacher/items/import`
- `GET /api/teacher/items/export`
- `POST /api/teacher/writing/:submissionId/evaluate`
- `GET /api/teacher/usage`
- `GET|POST /api/teacher/ai-settings`
- `POST /api/auth/request-link`
- `GET /api/auth/verify`
- `GET /api/auth/me`

## Notes

- Writing evaluation is explicit opt-in and can remain pending.
- Reports remain available with provisional overall level when writing is pending.
- No copyrighted exam content is included; seeded prompts/items are original placeholders.
