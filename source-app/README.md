# Dead-Zone Ops App Foundation

This is the current Netlify-first React + TypeScript build for the Dead-Zone Ops project.

## Included right now
- campaign map with route-intel gating
- mission briefing / route-choice flow
- lane-based tactical board
- success / partial / failure outcomes
- interludes, recovery, loadouts, and ship upgrades
- local save persistence
- export / import / reset save controls
- Supabase-ready planning files and migration scaffolding

## Run locally
```bash
npm install
npm run dev
```

## Build for Netlify
```bash
npm run build
```

Use:
- Build command: `npm run build`
- Publish directory: `dist`

## Supabase prep included
- `.env.example`
- `docs/supabase-architecture.md`
- `docs/supabase-integration-checklist.md`
- `supabase/migrations/0001_initial_schema.sql`
- `src/persistence.ts` local persistence boundary
- `src/cloud/contracts.ts` shared campaign/cloud data contracts

## Suggested next cloud milestone
1. create Supabase project
2. add env vars locally + in Netlify
3. install `@supabase/supabase-js`
4. add auth + campaign list/create flows
5. swap current local-save persistence boundary to optional cloud save/load


## GitHub + Netlify quick launch
This repo now includes:
- `.gitignore`
- `netlify.toml`
- `LAUNCH_GITHUB_NETLIFY.md`

For repo-backed Netlify deploys, import the GitHub repository into Netlify. Netlify's standard Vite settings for this project are:
- Build command: `npm run build`
- Publish directory: `dist`
