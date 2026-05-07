# Mawaeidk Admin Panel — Claude instructions

## ⚡ READ FIRST

The single source of truth for this entire project (all 4 repos, server, branches, blockers, what's next) is in the **backend** repo:

```
~/mawadk-backend/docs/PROJECT_LOG.md
```

**ALWAYS read it before answering anything substantive.** Cold-start cheat sheet at the top.

---

## Repo identity

- **Path:** `~/mawadk`
- **Remote:** `https://github.com/AliMahmood99/Mawadk-admin-panel.git`
- **Stack:** Next.js 16.1.1 (App Router) + React 19 + Tailwind 4 + Zustand 5 + Axios + next-intl
- **Live:** `https://admin.mawadk.testcode.tech`
- **Two surfaces:** Admin Dashboard (`/[locale]/admin/...`) + Provider Panel (`/[locale]/provider/...`)
- **Backend:** `https://api.mawadk.testcode.tech/api/v1/` (production) / `staging-api...` (staging)

## Hard rules — don't break

1. **Two API clients, two prefixes.** `client.js` for admin endpoints (`/dashboard/...`), `providerClient.js` for provider endpoints (`/provider-panel/...`). Don't mix.

2. **Pagination shape differs between the two.** Admin uses `meta` key, Provider uses `pagination` key. Components handling both surfaces must read the right one.

3. **Mobile API secret `zAyuqt8Fb#&*t-rnL3q%$` goes on every request as `Accept-Secret-Key` header.** Both axios clients set this in their interceptors. Don't strip it.

4. **i18n via next-intl.** Routes under `[locale]/` (`ar` or `en`). Translations in `messages/{ar,en}.json`. New strings: add to BOTH files. Don't ship English-only.

5. **Tour copy is in Modern Standard Arabic** — a previous Egyptian-colloquial pass got rewritten. Keep new strings in MSA.

6. **Permission gates via `usePermissions()` hook.** Sidebar items + page actions all check this. Don't bypass — admins without the right permission shouldn't see the link or hit the endpoint.

## Local commands

```bash
npm install
npm run dev          # localhost:3000
npm run build
npm run lint
```

## Sidebar groups (admin)

`OVERVIEW`, `MANAGEMENT`, `FINANCIAL`, `SUPPORT`, `SYSTEM` — see `lib/constants.ts` for `SIDEBAR_GROUPS`.

## Provider panel branches by provider type

- **Doctor type providers** see: Dashboard, Appointments, Statistics, Profile, Team, Settings.
- **Clinic / Hospital providers** see same + a **Doctors** menu item inserted at index 1.

Branching happens in `src/components/layout/Sidebar.jsx:180-246`.

## Deployment

PM2 process on the Hostinger server: `mawadk-admin` (port 3010 internal, LSWS proxy on 443).

```bash
ssh root@72.62.156.59 "pm2 restart mawadk-admin"
```

Path on server: `/home/admin.mawadk.testcode.tech/app`.

## Update protocol

After any meaningful work:
1. Append today's session to `~/mawadk-backend/docs/PROJECT_LOG.md`.
2. Commit + push.

## Privacy convention

- Commits authored as `ali mahmood saad` / `Ali Mahmood`.
- **Never** add `Co-Authored-By: Claude` or any AI attribution.
