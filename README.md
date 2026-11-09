# Dr Roby Dialysis Board

**RobY_BoT_FactorY — Controlled Engineering Development**

**Founder & Product Owner:** MOHAMED.K_ROBY  
**Status:** Working prototype · Not authorized for clinical deployment

## Overview

An Arabic-first operational dashboard for a 12-station hemodialysis unit. The prototype supports station status, dialysis sessions, UF tracking, blood flow (Qb), vital signs, session timing, team authentication, and CSV export.

## The Two-Hour Milestone · 9 November 2026

The founder took a screenshot of an existing dialysis-unit interface and asked an AI development tool to build a comparable application. In approximately **under two hours**, the journey reached a working demonstration: a Linux x86-64 executable running through QEMU on an Infinix Android phone, an authenticated API on port 4000, SQLite-backed session records, and a live-time dashboard. The demo session named **Buff** became the symbol of this milestone.

### الحكاية بالعربي 🇪🇬

يوم ٩ نوفمبر ٢٠٢٦، بدأت الحكاية بصورة شاشة من وحدة الغسيل الكلوي الأصلية، وسؤال بسيط: «تعرف تعمل زي دي؟» وفي أقل من ساعتين تقريبًا، وصل حمو الروبي إلى نموذج شغال على موبايل Infinix، بملف تنفيذي x64 عبر QEMU، وسيرفر API محمي، وقاعدة بيانات SQLite، وجلسة تجريبية باسم Buff والوقت بيتحسب قدام عينه. دي شهادة ميلاد هندسية للمنتج، مش شهادة جاهزية للاستخدام الطبي.

## Technology

React 19 · TypeScript · Vite · Express 5 · SQLite · Tailwind CSS · Node.js

## Repository Layout

- `src/` — React frontend and session views
- `server/` — API, authentication, database, and session logic
- `scripts/` — executable packaging tools

## Development

```bash
npm install
npm run typecheck
npm run dev
```

Development mode runs the API on port 4000 and the Vite frontend on port 3000. For a production-style bundle, use `npm run build` and `npm start` in a supported environment.

Credentials are intentionally omitted from this README. Runtime databases, tokens, and patient records must not be committed. Replace any built-in demonstration credentials before deployment.

## Evidence & Limits

Observed during the initial intake:
- Linux x86-64 executable running via QEMU on Android
- Authenticated `GET /api/board` returning session data
- Dashboard displaying advancing session time
- TypeScript typecheck passing

The local Vite build failed because Android/Termux could not load a native Rollup module. Comprehensive regression testing, authorization-denial testing, network validation, reproducible executable provenance, and clinical safety verification have **not** been established.

**This repository does not authorize real-patient use, clinical deployment, public launch, or claims of production readiness.**

## Factory Governance

> MANUSCRIPT IS AUTHORITY.  
> CONTRACTS AUTHORIZE.  
> PROOF VALIDATES.  
> GIT PRESERVES.  
> MOHAMED.K_ROBY DECIDES.

© 2026 MOHAMED.K_ROBY · RobY_BoT_FactorY.
