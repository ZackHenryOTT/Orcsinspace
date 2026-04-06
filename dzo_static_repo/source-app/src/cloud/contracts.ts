export type CampaignRole = "dm" | "leader" | "player" | "observer";
export type SyncMode = "local" | "cloud";

export type CampaignRecord = {
  id: string;
  name: string;
  created_by: string;
  leader_member_id: string | null;
  status: "active" | "archived";
  current_mission_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignMemberRecord = {
  id: string;
  campaign_id: string;
  user_id: string;
  display_name: string;
  role: CampaignRole;
  joined_at: string;
  last_seen_at: string | null;
};

export type CampaignSaveRecord = {
  id: string;
  campaign_id: string;
  revision: number;
  saved_by: string;
  save_state: unknown;
  created_at: string;
};

export type CampaignRunRecord = {
  id: string;
  campaign_id: string;
  mission_id: string;
  result: "success" | "partial" | "failure";
  alert: number;
  pressure: number;
  notes: string | null;
  created_at: string;
};

export type InviteRecord = {
  id: string;
  campaign_id: string;
  invited_email: string;
  invited_role: CampaignRole;
  token: string;
  expires_at: string;
  accepted_at: string | null;
};

export type CloudRuntimeEnvelope = {
  syncMode: SyncMode;
  campaignId: string | null;
  revision: number;
  lastSavedAt: string | null;
};
