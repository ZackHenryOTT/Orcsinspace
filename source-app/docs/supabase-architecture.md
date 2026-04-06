# Dead-Zone Ops: Supabase Architecture Plan

This app stays local-first for now, but the codebase is being prepared to swap into a cloud-backed shared campaign model later.

## Product target
- 1 DM per campaign
- 4 to 6 squad members
- one current campaign state
- resumable missions and shared progression
- Netlify-hosted frontend with Supabase for auth, database, and realtime notifications

## Recommended rollout order
1. **Auth only**
   - email magic link or passwordless sign-in
   - user profile record
2. **Cloud saves for solo / DM-owned campaigns**
   - save current app state JSON to Supabase
   - restore from cloud on login
3. **Campaign membership and invitations**
   - DM creates campaign
   - DM invites leader/players
4. **Shared campaign state**
   - single canonical save revision for the campaign
   - optimistic UI with revision checks
5. **Realtime collaboration**
   - presence, lobby state, current mission visibility
   - eventually live turn-by-turn sync if needed

## Authority model
- **DM**: full campaign authority, can edit anything, resolve interludes, force state changes
- **Leader**: can help coordinate, but does not override DM authority
- **Player**: controls only their own seat decisions when multiplayer is live
- **Observer**: read-only access for spectators or playtest review

## State model recommendation
Use a **single canonical campaign save blob** for the current game state, plus normalized supporting tables for history and access control.

Why:
- fastest path from the current local app
- easiest migration from local JSON saves
- keeps the door open for later normalization of tactical turns / logs / assets

### Keep normalized tables for:
- campaigns
- members
- invites
- run history
- save revisions metadata

### Keep denormalized blob for:
- current tactical/campaign runtime state
- current squad HP/stress/loadouts
- mission runtime progress
- temporary ops modifiers
- log feed snapshot

## Tables
### campaigns
One row per campaign.
- id uuid pk
- name text
- created_by uuid references auth.users
- leader_member_id uuid nullable
- status text check active/archived
- current_mission_id text nullable
- created_at timestamptz
- updated_at timestamptz

### campaign_members
Campaign membership and roles.
- id uuid pk
- campaign_id uuid references campaigns
- user_id uuid references auth.users
- display_name text
- role text check dm/leader/player/observer
- joined_at timestamptz
- last_seen_at timestamptz nullable

### campaign_saves
Current and historical save revisions.
- id uuid pk
- campaign_id uuid references campaigns
- revision integer
- saved_by uuid references auth.users
- save_state jsonb
- created_at timestamptz

### campaign_runs
Resolved mission outcomes for analytics/history.
- id uuid pk
- campaign_id uuid references campaigns
- mission_id text
- result text check success/partial/failure
- alert integer
- pressure integer
- notes text nullable
- created_at timestamptz

### campaign_invites
Invitation tokens for future players.
- id uuid pk
- campaign_id uuid references campaigns
- invited_email text
- invited_role text check dm/leader/player/observer
- token text unique
- expires_at timestamptz
- accepted_at timestamptz nullable

## Realtime guidance
Do **not** start with full tactical realtime.
Start with:
- presence in lobby
- current campaign revision notifications
- current mission/turn status banners

Let clients re-fetch the latest save blob when revision changes.
That is much simpler and safer than syncing every single action immediately.

## Conflict strategy
Use **revision-based optimistic saves**:
- client fetches revision N
- client saves with expected revision N
- server writes revision N+1 only if still current
- if stale, reject and force re-sync

This is the cleanest path for a DM-led campaign app.

## Security / RLS
- users can only read campaigns they belong to
- only DM can update campaign metadata
- DM and leader can create run-history notes if desired
- only DM can create invites by default
- campaign_saves insert allowed only to DM initially

## Frontend integration points
Keep persistence behind a small adapter boundary:
- `loadPersistedAppState()`
- `persistAppState()`
- `downloadAppState()`
- `importAppStateFromFile()`

Later add:
- `loadCampaignFromCloud()`
- `saveCampaignToCloud()`
- `listUserCampaigns()`
- `createCampaign()`
- `joinCampaignByInvite()`

## Netlify environment variables
- `VITE_SYNC_MODE`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## First Supabase milestone to build
When the Supabase project exists, the first target should be:
1. auth
2. create campaign
3. save/load current campaign blob
4. list campaigns for current user

Do not try to ship live tactical multiplayer first.
