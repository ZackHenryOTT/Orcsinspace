# Supabase Integration Checklist

## When the project is created
- [ ] Create Supabase project
- [ ] Copy project URL
- [ ] Copy anon key
- [ ] Add values to `.env.local`
- [ ] Set matching variables in Netlify site settings

## Database setup
- [ ] Run initial migration in `supabase/migrations/0001_initial_schema.sql`
- [ ] Enable Row Level Security on all campaign tables
- [ ] Add policies for campaign membership reads
- [ ] Add DM-only write policies for campaigns/saves/invites

## Frontend setup
- [ ] Install `@supabase/supabase-js`
- [ ] Add `src/cloud/supabaseClient.ts`
- [ ] Add auth provider / session hook
- [ ] Add sync mode switch (local vs cloud)
- [ ] Add campaign picker screen

## App features
- [ ] Create campaign
- [ ] Save current campaign blob to cloud
- [ ] Load campaign blob from cloud
- [ ] Invite player flow
- [ ] List campaign members
- [ ] Revision conflict handling

## Nice-to-have after first cloud save milestone
- [ ] Presence / lobby online indicators
- [ ] Shared mission room
- [ ] Cloud activity log
- [ ] Per-player seat ownership rules
