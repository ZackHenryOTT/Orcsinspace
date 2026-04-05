# Dead-Zone Ops — GitHub + Netlify Launch Steps

## 1) Create the GitHub repo
Create a new empty GitHub repository.

## 2) Add these files to the repo
This folder is the source project.

## 3) Push to GitHub
```bash
git init
git add .
git commit -m "Initial Dead-Zone Ops app"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## 4) Import into Netlify
In Netlify:
- Add new project
- Import an existing project
- Choose GitHub
- Select this repository

Netlify should detect Vite automatically. If it does not, use:
- Build command: `npm run build`
- Publish directory: `dist`

## 5) Environment variables
You do not need Supabase variables yet for the current local-persistence build.
When you are ready for Supabase, add the values from `.env.example` into Netlify.

## 6) Local development
```bash
npm install
npm run dev
```

## 7) Production build test
```bash
npm run build
```

## 8) What is in this repo
- `src/` main React app
- `src/multiclient.tsx` per-player / DM foundation slice
- `src/persistence.ts` local save boundary
- `docs/` Supabase planning docs
- `supabase/migrations/` starter SQL schema
- `netlify.toml` Netlify build config

## 9) Current recommended next branch of work
- integrate the per-player / DM split into the main app flow
- build the mapped tutorial level into the real room progression
- move from local save only to optional Supabase auth + campaign save/load later
