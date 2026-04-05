import {
  AlertTriangle,
  Cpu,
  Droplets,
  HeartPulse,
  Lock,
  ScanLine,
  Siren,
  Snowflake,
  Target,
  type LucideIcon,
} from "lucide-react";

export type Position = "front" | "cover" | "back";
export type GearSlot = "weapon" | "mod" | "kit";
export type Outcome = "success" | "partial" | "failure";



export type ResourceCost = { salvage?: number; intel?: number; cores?: number };

export type WeaponFamilyDoctrine = {
  id: string;
  name: string;
  pitch: string;
  why: string;
  strengths: string[];
  tradeoffs: string[];
  safestIn: string[];
  riskyIn: string[];
  starterCost: ResourceCost;
  examples: string[];
};

export type SuitChassisDoctrine = {
  id: string;
  name: string;
  role: string;
  pitch: string;
  stats: { armor: number; seal: number; mobility: number; thermal: number; arc: number; chem: number; signal: number; wing: number; power: number; signature: number };
  why: string;
  starterCost: ResourceCost;
};

export type SuitModuleDoctrine = {
  id: string;
  name: string;
  slot: string;
  pitch: string;
  why: string;
  cost: ResourceCost;
};

export type GearItem = {
  id: string;
  slot: GearSlot;
  name: string;
  desc: string;
  tags: string[];
};

export type CrewMember = {
  id: string;
  name: string;
  role: string;
  family: string;
  subtype: string;
  breathType: string;
  breathShape: string;
  baseLoadout: string;
  familyText: string;
  skill: string;
  maxHp: number;
  hp: number;
  stress: number;
  oxygen: number;
  position: Position;
  injured: boolean;
  scars: number;
  gear: Record<GearSlot, GearItem | null>;
  doctrineWeaponId: string;
  suitChassisId: string;
  moduleDoctrineId: string;
};

export type ShipState = {
  name: string;
  hull: number;
  sensors: number;
  tethers: number;
  medbay: number;
  reactor: number;
  salvage: number;
  intel: number;
  cores: number;
  completedMissions: string[];
  routeIntel: { redglassVector: string | null; quarantineVector: string | null };
  campaignHistory: { title: string; result: string; alert: number; pressure: number }[];
  inventory: GearItem[];
  resolvedInterludes: string[];
  pendingInterludeId: string | null;
  temporaryOps: { nextMissionAlertMod: number; nextMissionPressureMod: number; freeFullRecovery: number };
  missionOutcomes: Partial<Record<string, Outcome>>;
};

export type RouteAdvantage = {
  requiredRoles?: string[];
  requiredFamilies?: string[];
  minTethers?: number;
  minSensors?: number;
  minHull?: number;
  note: string;
  onMatch?: { alertDelta?: number; pressureDelta?: number; reward?: { salvage?: number; intel?: number; cores?: number } };
  onMiss?: { alertDelta?: number; pressureDelta?: number; reward?: { salvage?: number; intel?: number; cores?: number } };
};

export type RouteOption = {
  id: string;
  title: string;
  flavor: string;
  alertDelta: number;
  pressureDelta: number;
  reward: { salvage?: number; intel?: number; cores?: number };
  routeIntel?: string;
  log: string;
  skillHooks?: string[];
  routeNeed?: string;
  advantage?: RouteAdvantage;
};

export type ResolvedRouteOption = {
  matched: boolean;
  alertDelta: number;
  pressureDelta: number;
  reward: { salvage: number; intel: number; cores: number };
  preview: string;
  detail: string | null;
};

export type EncounterTemplate = {
  id: string;
  name: string;
  hp: number;
  attack: number;
  desc: string;
  icon: LucideIcon;
};

export type MissionDefinition = {
  id: string;
  title: string;
  short: string;
  type: string;
  difficulty: string;
  doctrine: string;
  summary: string;
  objective: string;
  optional: string[];
  playerGuidance: string[];
  missionClockStart: number;
  pressureLabel: string;
  pressureStart: number;
  routeMap: { dock: RouteOption[]; relay: RouteOption[]; core: RouteOption[] };
  encountersByAlert: EncounterTemplate[];
  hiddenTruths: Record<string, string>;
  rewardsOnSuccess: { salvage: number; intel: number; cores: number };
  weirdness: string;
};

export type EnemyUnit = {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  role: string;
  priority: number;
  targetBias: Position;
  intentText: string;
  tags: string[];
};

export type InterludeChoice = {
  id: string;
  label: string;
  desc: string;
  apply: {
    salvage?: number;
    intel?: number;
    crewStress?: number;
    allStressDelta?: number;
    injuredStress?: number;
    nextMissionAlertMod?: number;
    nextMissionPressureMod?: number;
    freeFullRecovery?: number;
  };
  log: string;
};

export type InterludeEvent = {
  id: string;
  title: string;
  text: string;
  choices: InterludeChoice[];
};

export type MissionRuntimeState = {
  screen: "hub" | "briefing" | "dock" | "relay" | "core" | "encounter" | "aftermath" | "ship";
  beat: string;
  missionId: string | null;
  mission: MissionDefinition | null;
  hiddenTruths: Record<string, string>;
  alert: number;
  pressure: number;
  sealClock: number | null;
  clockExpired: boolean;
  anomalySeen: boolean;
  encounterTemplate: EncounterTemplate | null;
  outcome: Outcome | null;
  failureReason: string | null;
  resolutionRewards: { salvage: number; intel: number; cores: number };
};

export type OnboardingState = {
  completed: boolean;
  step: "start" | "builder" | "training" | "command";
};

export type AppState = {
  crew: CrewMember[];
  ship: ShipState;
  selectedCrew: string;
  logs: string[];
  dmMode: boolean;
  chosenUpgrade: string | null;
  missionState: MissionRuntimeState;
  onboarding: OnboardingState;
};

export type DoctrineUnlocks = {
  stage: number;
  label: string;
  summary: string;
  weapons: string[];
  suits: string[];
  modules: string[];
};


export const SAVE_KEY = "dead-zone-ops-save-v1";

export const DEFAULT_LOGS = [
  "Ashwake waits cold in the dark.",
  "Choose a mission. The dead zone remembers everything you take from it. Early sites teach security logic. Broken Choir is the first real proof that the dead zone can stack multiple challenges into one coordinated problem.",
];

export const DEFAULT_MISSION_STATE: MissionRuntimeState = {
  screen: "hub",
  beat: "hub",
  missionId: null,
  mission: null,
  hiddenTruths: {},
  alert: 0,
  pressure: 0,
  sealClock: null,
  clockExpired: false,
  anomalySeen: false,
  encounterTemplate: null,
  outcome: null,
  failureReason: null,
  resolutionRewards: { salvage: 0, intel: 0, cores: 0 },
};

export const STARTING_CREW: CrewMember[] = [
  { id: "slot-1", name: "Operator 1", role: "Unassigned", family: "Unassigned", subtype: "Unassigned", breathType: "None", breathShape: "—", baseLoadout: "No assignment", familyText: "Choose a dragon family.", skill: "Assign role", maxHp: 12, hp: 12, stress: 0, oxygen: 100, position: "cover", injured: false, scars: 0, gear: { weapon: null, mod: null, kit: null }, doctrineWeaponId: "coil", suitChassisId: "vector", moduleDoctrineId: "mag_tether" },
  { id: "slot-2", name: "Operator 2", role: "Unassigned", family: "Unassigned", subtype: "Unassigned", breathType: "None", breathShape: "—", baseLoadout: "No assignment", familyText: "Choose a dragon family.", skill: "Assign role", maxHp: 12, hp: 12, stress: 0, oxygen: 100, position: "cover", injured: false, scars: 0, gear: { weapon: null, mod: null, kit: null }, doctrineWeaponId: "coil", suitChassisId: "vector", moduleDoctrineId: "mag_tether" },
  { id: "slot-3", name: "Operator 3", role: "Unassigned", family: "Unassigned", subtype: "Unassigned", breathType: "None", breathShape: "—", baseLoadout: "No assignment", familyText: "Choose a dragon family.", skill: "Assign role", maxHp: 12, hp: 12, stress: 0, oxygen: 100, position: "cover", injured: false, scars: 0, gear: { weapon: null, mod: null, kit: null }, doctrineWeaponId: "coil", suitChassisId: "vector", moduleDoctrineId: "mag_tether" },
  { id: "slot-4", name: "Operator 4", role: "Unassigned", family: "Unassigned", subtype: "Unassigned", breathType: "None", breathShape: "—", baseLoadout: "No assignment", familyText: "Choose a dragon family.", skill: "Assign role", maxHp: 12, hp: 12, stress: 0, oxygen: 100, position: "cover", injured: false, scars: 0, gear: { weapon: null, mod: null, kit: null }, doctrineWeaponId: "coil", suitChassisId: "vector", moduleDoctrineId: "mag_tether" },
];

export const STARTING_SHIP: ShipState = {
  name: "Ashwake",
  hull: 1,
  sensors: 1,
  tethers: 1,
  medbay: 1,
  reactor: 1,
  salvage: 0,
  intel: 0,
  cores: 0,
  completedMissions: [],
  routeIntel: { redglassVector: null, quarantineVector: null },
  campaignHistory: [],
  inventory: [],
  resolvedInterludes: [],
  pendingInterludeId: null,
  temporaryOps: { nextMissionAlertMod: 0, nextMissionPressureMod: 0, freeFullRecovery: 0 },
  missionOutcomes: {},
};

export const ROLE_BLUEPRINTS = {
  "Unassigned": {
    maxHp: 12,
    baseLoadout: "No assignment",
    skill: "Assign role",
    defaultPosition: "cover" as Position,
    why: "Fresh squads start as open slots. Pick a real role before you deploy.",
  },
  "Vanguard": {
    maxHp: 18,
    baseLoadout: "Shield Carbine",
    skill: "Hold the Line",
    defaultPosition: "front" as Position,
    why: "Someone has to survive the front, absorb panic, and stop the room from solving your whole squad through forced movement.",
  },
  "Signal Hacker": {
    maxHp: 12,
    baseLoadout: "Quiet Intercept",
    skill: "Read Signal",
    defaultPosition: "cover" as Position,
    why: "This campaign punishes teams that cannot read patterns, sensors, and escalation logic before the clock gets ugly.",
  },
  "Marksman": {
    maxHp: 13,
    baseLoadout: "Rail Hunter",
    skill: "Priority Shot",
    defaultPosition: "back" as Position,
    why: "You need a clean answer to kill-first challenges before they start compounding the fight.",
  },
  "Engineer / Tech": {
    maxHp: 14,
    baseLoadout: "Salvage Ghost",
    skill: "Override",
    defaultPosition: "cover" as Position,
    why: "A fixer keeps bad routes, busted seals, and security systems from eating your whole clock.",
  },
} as const;

export const FAMILY_BLUEPRINTS = {
  Unassigned: {
    familyText: "Choose a dragon family.",
    why: "Family choice is not fluff in this campaign. It determines what kind of answer this operator brings once the room wakes up.",
    subtypes: ["Unassigned"],
  },
  Metallic: {
    familyText: "Protect, cleanse, create exits.",
    why: "Metallic choices are for survival, stabilization, and controlled extractions when the room starts getting mean.",
    subtypes: ["Gold", "Silver", "Bronze", "Copper", "Brass"],
  },
  Chromatic: {
    familyText: "Break, burst, dominate space.",
    why: "Chromatics are decisive and dangerous. One or two is great. Overstacking them usually means you brought too much ego and not enough control.",
    subtypes: ["Red", "Blue", "Green", "Black", "White"],
  },
  Gem: {
    familyText: "Read, disrupt, jam, pattern-control.",
    why: "Gem picks are how you stop the map, the signal, and the ambush from getting the first move for free.",
    subtypes: ["Amethyst", "Crystal", "Emerald", "Sapphire", "Topaz"],
  },
} as const;

export const SUBTYPE_BLUEPRINTS: Record<string, { breathType: string; breathShape: string; why: string }> = {
  Unassigned: { breathType: "None", breathShape: "—", why: "Pick a subtype once the family is chosen. Until then this slot is not ready to deploy." },
  Gold: { breathType: "Fire", breathShape: "Cone", why: "Great anchor subtype. Strong when the squad needs a visible leader and a hard defensive answer." },
  Silver: { breathType: "Cold", breathShape: "Cone", why: "Safer, steadier defender. Good for clean extractions and buying the squad time." },
  Bronze: { breathType: "Lightning", breathShape: "Line", why: "Excellent anti-system pick. Good when the site itself is the real enemy." },
  Copper: { breathType: "Acid", breathShape: "Burst", why: "Smart sabotage choice. Good for tricky routes and ugly maintenance-spine solutions." },
  Brass: { breathType: "Fire", breathShape: "Line", why: "Useful social / utility metallic pick if you want flexibility over raw sturdiness." },
  Red: { breathType: "Fire", breathShape: "Cone", why: "Pure pressure. Great when you need something erased fast, risky if you stack too many brute picks." },
  Blue: { breathType: "Lightning", breathShape: "Line", why: "Disciplined killer. Strong priority-target answer without feeling as wild as red." },
  Green: { breathType: "Poison", breathShape: "Cone", why: "Control-through-fear style pick. More niche in this campaign than the cleaner anti-system choices." },
  Black: { breathType: "Acid", breathShape: "Line", why: "Industrial horror vibe. Good if you want a cruel ambush / denial profile." },
  White: { breathType: "Cold", breathShape: "Burst", why: "Feral survivor energy. Useful for panic-fight identity, less clean for technical missions." },
  Amethyst: { breathType: "Force", breathShape: "Line", why: "Probably the cleanest all-around gem pick. Helps the squad read, control, and not get surprised." },
  Crystal: { breathType: "Radiant", breathShape: "Cone", why: "Great anti-corruption / clarity flavor. Strong campaign-safe support identity." },
  Emerald: { breathType: "Psychic", breathShape: "Line", why: "Good for mind-game and detection vibes, especially if you want the signal-war angle." },
  Sapphire: { breathType: "Thunder", breathShape: "Line", why: "Formation-breaker. Good when you want disruption rather than brute force." },
  Topaz: { breathType: "Necrotic", breathShape: "Burst", why: "Riskier and stranger. Useful if you want a darker specialist lane, not a default safe pick." },
};



export const WEAPON_FAMILIES: WeaponFamilyDoctrine[] = [
  {
    id: "coil",
    name: "Coil / Gauss",
    pitch: "Disciplined magnetic weapons for smart operators.",
    why: "Pick these when preserving the room matters more than brute spectacle. They are the safer answer in oxygen-rich, fragile, or volatile spaces.",
    strengths: ["Low ignition risk", "Strong precision", "Vacuum-safe doctrine", "Good for objective-preserving fights"],
    tradeoffs: ["Less panic damage than plasma", "Feels cleaner than brutal", "Usually smaller mags or slower cycle"],
    safestIn: ["Vacuum", "Oxygen-rich facilities", "Fragile relay rooms"],
    riskyIn: ["Mass panic swarms where raw area damage matters"],
    starterCost: { salvage: 1, intel: 1 },
    examples: ["Coldshot Carbine", "Flechette Rail", "Mag-Caster Sidearm"],
  },
  {
    id: "laser",
    name: "Laser",
    pitch: "Precise energy tools for cutting problems exactly where they live.",
    why: "Pick lasers when accuracy, weak-point work, and anti-system pressure matter more than environment safety.",
    strengths: ["High accuracy", "Great versus sensors and exposed systems", "Low recoil", "Clean anti-drone pressure"],
    tradeoffs: ["Heat buildup", "Visible signature", "Riskier in oxygen-rich rooms"],
    safestIn: ["Vacuum", "Thin atmosphere", "Long firing lanes"],
    riskyIn: ["Reactive atmospheres", "Fuel-heavy spaces"],
    starterCost: { salvage: 1, intel: 2 },
    examples: ["Linecutter Rifle", "Relay Lance", "Burnglass Sidearm"],
  },
  {
    id: "plasma",
    name: "Plasma",
    pitch: "The ugly answer when you need a problem to stop existing.",
    why: "Bring plasma when you expect armor, hard denial, or last-ditch room-breaking power — but accept that it often makes the level worse.",
    strengths: ["High damage", "Armor melt", "Strong emergency pressure", "Terrifying close-range payoff"],
    tradeoffs: ["Extreme heat", "Environmental risk", "Can damage objectives and routes", "Expensive"],
    safestIn: ["Hard vacuum", "Already-ruined war zones"],
    riskyIn: ["Oxygen-rich labs", "Volatile sectors", "Objective-sensitive rooms"],
    starterCost: { salvage: 2, cores: 1 },
    examples: ["Plasma Cutter", "Sunspike Projector", "Plasma Sword"],
  },
  {
    id: "slug",
    name: "Slug / Chem",
    pitch: "Old war brutality that still works when everything else is broken.",
    why: "Use these when you need rugged reliability and stagger, and you can afford to be loud and ugly about it.",
    strengths: ["Reliable stopping power", "Cheap and common", "Good stagger", "Low tech dependence"],
    tradeoffs: ["Loud", "Flash risk", "Bad for stealth", "Poor choice in delicate environments"],
    safestIn: ["Dead vacuum hulls", "Open war corridors"],
    riskyIn: ["Stealth routes", "Oxygen-heavy spaces", "Facility-preservation missions"],
    starterCost: { salvage: 1 },
    examples: ["Warshot Carbine", "Breach Shotgun", "Ironspit Pistol"],
  },
  {
    id: "blade",
    name: "Blade Systems",
    pitch: "Close-quarters tools for disciplined operators and terrifying specialists.",
    why: "Blades exist because sometimes the smartest answer is to cut one problem cleanly without waking the room harder than necessary.",
    strengths: ["Low signature", "Strong in tight quarters", "Good for precise takedowns", "Useful when preserving the room matters"],
    tradeoffs: ["Dangerous range commitment", "Needs mobility and nerve", "Elite variants draw heavy power"],
    safestIn: ["Tight corridors", "Stealth breaches", "Low-visibility kills"],
    riskyIn: ["Open kill lanes", "Mass pressure without support"],
    starterCost: { salvage: 1, intel: 1 },
    examples: ["Mono Blade", "Arc Sabre", "Plasma Sword"],
  },
];

export const SUIT_CHASSIS: SuitChassisDoctrine[] = [
  {
    id: "vector",
    name: "Vector Suit",
    role: "Scout / route solver",
    pitch: "Fast, quiet, and built for bad crossings.",
    stats: { armor: 2, seal: 3, mobility: 5, thermal: 2, arc: 2, chem: 2, signal: 3, wing: 4, power: 2, signature: 2 },
    why: "Choose this when the mission is about crossing danger cleanly and preserving the clock.",
    starterCost: { salvage: 2, intel: 1 },
  },
  {
    id: "breach",
    name: "Breach Suit",
    role: "Lane holder / panic survivor",
    pitch: "Heavy armor for operators who expect the room to hit back hard.",
    stats: { armor: 5, seal: 4, mobility: 2, thermal: 4, arc: 3, chem: 3, signal: 1, wing: 2, power: 3, signature: 4 },
    why: "Choose this when somebody has to absorb force and keep the squad from folding.",
    starterCost: { salvage: 3 },
  },
  {
    id: "containment",
    name: "Containment Suit",
    role: "Hazard / contamination specialist",
    pitch: "Built for corrosive, infected, and biotech-adjacent disaster zones.",
    stats: { armor: 3, seal: 5, mobility: 2, thermal: 3, arc: 2, chem: 5, signal: 2, wing: 2, power: 3, signature: 3 },
    why: "Choose this when surviving the environment is harder than surviving the fight.",
    starterCost: { salvage: 2, intel: 1 },
  },
  {
    id: "relay",
    name: "Relay Suit",
    role: "Signal / systems control",
    pitch: "A technical chassis for reading patterns and surviving hostile logic war.",
    stats: { armor: 2, seal: 3, mobility: 3, thermal: 2, arc: 4, chem: 2, signal: 5, wing: 3, power: 4, signature: 2 },
    why: "Choose this when the site itself is likely to be the smartest enemy in the room.",
    starterCost: { salvage: 1, intel: 2 },
  },
  {
    id: "sovereign",
    name: "Sovereign Suit",
    role: "Late expedition command chassis",
    pitch: "Prestige wargear for squads that are no longer merely scavenging.",
    stats: { armor: 4, seal: 4, mobility: 4, thermal: 4, arc: 4, chem: 4, signal: 4, wing: 4, power: 5, signature: 3 },
    why: "Choose this when the squad has earned the right to act like claimants instead of raiders.",
    starterCost: { salvage: 2, intel: 2, cores: 1 },
  },
];

export const SUIT_MODULES: SuitModuleDoctrine[] = [
  { id: "mag_tether", name: "Mag-Tether Launcher", slot: "Utility", pitch: "Anchor crossings and stop vacuum from deciding for you.", why: "Take this when forced movement is a bigger threat than direct damage.", cost: { salvage: 1 } },
  { id: "wing_lock", name: "Wing Lock Frame", slot: "Wing", pitch: "Protects and stabilizes wings during bad wash, debris, and decompression.", why: "Take this when you expect lots of vacuum traversal or harsh pressure shifts.", cost: { salvage: 1, intel: 1 } },
  { id: "burst_thrusters", name: "Burst Thruster Pack", slot: "Mobility", pitch: "Short correction burns for bad crossings and last-second lane saves.", why: "Take this when timing and repositioning are the real mission bottleneck.", cost: { salvage: 2 } },
  { id: "auto_seal", name: "Auto-Seal Foam", slot: "Seal", pitch: "Turns a small breach into a survivable mistake instead of a dead squad.", why: "Take this when seal discipline is more important than extra damage.", cost: { salvage: 1, intel: 1 } },
  { id: "purge_injectors", name: "Purge Injectors", slot: "Medical", pitch: "Emergency purge support for corrosion, contamination, and bad environmental exposure.", why: "Take this when the room is likely to poison, burn, or compromise the squad over time.", cost: { salvage: 1, cores: 1 } },
  { id: "signal_baffler", name: "Signal Baffler", slot: "Signal", pitch: "Reduces certainty and keeps hostile systems from getting free reads.", why: "Take this when the site’s awareness is the real clock killer.", cost: { intel: 2 } },
  { id: "heat_sink", name: "Heat Sink Spine", slot: "Power", pitch: "Lets hot weapons and hard systems run without cooking the operator or room quite as fast.", why: "Take this if you insist on lasers or plasma in places where they are a bad idea.", cost: { salvage: 1, intel: 1 } },
  { id: "grav_boots", name: "Grav / Mag Boots", slot: "Mobility", pitch: "Improves footing, hull-walk control, and anti-drift stability.", why: "Take this when the mission is about keeping your body where you intended it to be.", cost: { salvage: 1 } },
];



export const DEFAULT_WEAPON_BY_ROLE: Record<string, string> = {
  "Unassigned": "coil",
  "Vanguard": "slug",
  "Signal Hacker": "laser",
  "Marksman": "coil",
  "Engineer / Tech": "coil",
};

export const DEFAULT_SUIT_BY_ROLE: Record<string, string> = {
  "Unassigned": "vector",
  "Vanguard": "breach",
  "Signal Hacker": "relay",
  "Marksman": "vector",
  "Engineer / Tech": "containment",
};

export const DEFAULT_MODULE_BY_ROLE: Record<string, string> = {
  "Unassigned": "mag_tether",
  "Vanguard": "mag_tether",
  "Signal Hacker": "signal_baffler",
  "Marksman": "grav_boots",
  "Engineer / Tech": "auto_seal",
};

export function findWeaponFamily(id: string) { return WEAPON_FAMILIES.find((entry) => entry.id === id) || WEAPON_FAMILIES[0]; }
export function findSuitChassis(id: string) { return SUIT_CHASSIS.find((entry) => entry.id === id) || SUIT_CHASSIS[0]; }
export function findSuitModule(id: string) { return SUIT_MODULES.find((entry) => entry.id === id) || SUIT_MODULES[0]; }

export function getDoctrineUnlocks(ship: ShipState): DoctrineUnlocks {
  const completed = new Set(ship.completedMissions || []);
  const earlyRuns = ["redglass", "quarantine7"].filter((id) => completed.has(id)).length;

  if (completed.has("brokenchoir")) {
    return {
      stage: 3,
      label: "Expedition Elite",
      summary: "Command trusts the squad with volatile and prestige doctrine. The campaign now expects composed loadouts, not starter gear spam.",
      weapons: ["coil", "slug", "blade", "laser", "plasma"],
      suits: ["vector", "breach", "relay", "containment", "sovereign"],
      modules: ["mag_tether", "grav_boots", "auto_seal", "signal_baffler", "wing_lock", "purge_injectors", "heat_sink", "burst_thrusters"],
    };
  }

  if (earlyRuns >= 2) {
    return {
      stage: 2,
      label: "Specialist Kit",
      summary: "The squad has earned broader doctrine. Hazard control and more technical suits are now trusted in the field.",
      weapons: ["coil", "slug", "blade", "laser"],
      suits: ["vector", "breach", "relay", "containment"],
      modules: ["mag_tether", "grav_boots", "auto_seal", "signal_baffler", "wing_lock", "purge_injectors", "heat_sink", "burst_thrusters"],
    };
  }

  if (earlyRuns >= 1) {
    return {
      stage: 1,
      label: "Live Ops",
      summary: "The squad survived a live run. Technical signal kit unlocks, but command still keeps the dangerous toys locked up.",
      weapons: ["coil", "slug", "blade", "laser"],
      suits: ["vector", "breach", "relay"],
      modules: ["mag_tether", "grav_boots", "auto_seal", "signal_baffler", "wing_lock"],
    };
  }

  return {
    stage: 0,
    label: "Field Primer",
    summary: "Start simple. Early crews get basic field kit until they prove they can survive the dead zone without cooking themselves or the room.",
    weapons: ["coil", "slug", "blade"],
    suits: ["vector", "breach"],
    modules: ["mag_tether", "grav_boots", "auto_seal"],
  };
}

export function defaultDoctrineForRole(role: string) {
  return {
    doctrineWeaponId: DEFAULT_WEAPON_BY_ROLE[role] || DEFAULT_WEAPON_BY_ROLE["Unassigned"],
    suitChassisId: DEFAULT_SUIT_BY_ROLE[role] || DEFAULT_SUIT_BY_ROLE["Unassigned"],
    moduleDoctrineId: DEFAULT_MODULE_BY_ROLE[role] || DEFAULT_MODULE_BY_ROLE["Unassigned"],
  };
}

export function normalizeSubtypeForFamily(family: string, subtype?: string): string {
  const options = (FAMILY_BLUEPRINTS[family as keyof typeof FAMILY_BLUEPRINTS]?.subtypes || FAMILY_BLUEPRINTS.Metallic.subtypes) as readonly string[];
  return subtype && options.includes(subtype) ? subtype : options[0];
}

export function rebuildCrewMember(member: CrewMember, updates: Partial<Pick<CrewMember, "role" | "family" | "subtype" | "doctrineWeaponId" | "suitChassisId" | "moduleDoctrineId">>): CrewMember {
  const nextRole = (updates.role || member.role) as keyof typeof ROLE_BLUEPRINTS;
  const nextFamily = (updates.family || member.family) as keyof typeof FAMILY_BLUEPRINTS;
  const nextSubtype = normalizeSubtypeForFamily(nextFamily, updates.subtype || member.subtype);
  const roleData = ROLE_BLUEPRINTS[nextRole];
  const familyData = FAMILY_BLUEPRINTS[nextFamily];
  const subtypeData = SUBTYPE_BLUEPRINTS[nextSubtype];
  const hpRatio = member.maxHp > 0 ? member.hp / member.maxHp : 1;
  const nextMaxHp = roleData.maxHp;
  const defaults = defaultDoctrineForRole(nextRole);
  return {
    ...member,
    role: nextRole,
    family: nextFamily,
    subtype: nextSubtype,
    breathType: subtypeData.breathType,
    breathShape: subtypeData.breathShape,
    baseLoadout: roleData.baseLoadout,
    familyText: familyData.familyText,
    skill: roleData.skill,
    maxHp: nextMaxHp,
    hp: Math.max(1, Math.min(nextMaxHp, Math.round(nextMaxHp * hpRatio))),
    position: roleData.defaultPosition,
    doctrineWeaponId: updates.doctrineWeaponId || member.doctrineWeaponId || defaults.doctrineWeaponId,
    suitChassisId: updates.suitChassisId || member.suitChassisId || defaults.suitChassisId,
    moduleDoctrineId: updates.moduleDoctrineId || member.moduleDoctrineId || defaults.moduleDoctrineId,
  };
}



export function normalizeCrewForDoctrineUnlocks(crew: CrewMember[], unlocks: DoctrineUnlocks): CrewMember[] {
  const fallbackWeapon = (role: string) => unlocks.weapons.includes(DEFAULT_WEAPON_BY_ROLE[role] || "") ? (DEFAULT_WEAPON_BY_ROLE[role] || unlocks.weapons[0]) : unlocks.weapons[0];
  const fallbackSuit = (role: string) => unlocks.suits.includes(DEFAULT_SUIT_BY_ROLE[role] || "") ? (DEFAULT_SUIT_BY_ROLE[role] || unlocks.suits[0]) : unlocks.suits[0];
  const fallbackModule = (role: string) => unlocks.modules.includes(DEFAULT_MODULE_BY_ROLE[role] || "") ? (DEFAULT_MODULE_BY_ROLE[role] || unlocks.modules[0]) : unlocks.modules[0];

  return crew.map((member) => {
    const nextWeapon = unlocks.weapons.includes(member.doctrineWeaponId) ? member.doctrineWeaponId : fallbackWeapon(member.role);
    const nextSuit = unlocks.suits.includes(member.suitChassisId) ? member.suitChassisId : fallbackSuit(member.role);
    const nextModule = unlocks.modules.includes(member.moduleDoctrineId) ? member.moduleDoctrineId : fallbackModule(member.role);

    if (nextWeapon === member.doctrineWeaponId && nextSuit === member.suitChassisId && nextModule === member.moduleDoctrineId) return member;
    return rebuildCrewMember(member, { doctrineWeaponId: nextWeapon, suitChassisId: nextSuit, moduleDoctrineId: nextModule });
  });
}

export const ROUTE_INTEL_TEXT: Record<string, string> = {
  redglass_safe: "Safer but more legible relay corridor into deeper signal territory.",
  redglass_tight: "Quiet service-spine vector into deeper relay territory.",
  vault_sterile: "Controlled quarantine passage into deeper sealed infrastructure.",
  vault_emergency: "Fast emergency spine into deeper containment sectors.",
};

export const CAMPAIGN_MAP = [
  { id: "redglass", zone: "Frontier Edge", label: "Redglass Array", requires: [], unlockText: "Available at campaign start.", depth: 1 },
  { id: "quarantine7", zone: "Containment Line", label: "Quarantine Vault 7", requires: [], unlockText: "Available at campaign start.", depth: 1 },
  { id: "brokenchoir", zone: "Signal Graves", label: "Broken Choir Containment", requires: ["redglass", "quarantine7"], unlockText: "Requires both early runs plus route intel.", depth: 2 },
];

export const LOOT_TABLE: Record<string, GearItem[]> = {
  redglass: [
    { id: "sig_jammer", slot: "mod", name: "Signal Jammer", desc: "Extra pressure reduction once per encounter for the hacker.", tags: ["Tech", "Control"] },
    { id: "quiet_sights", slot: "weapon", name: "Quiet Sights", desc: "+1 attack damage.", tags: ["Weapon", "Precision"] },
  ],
  quarantine7: [
    { id: "purge_kit", slot: "kit", name: "Purge Kit", desc: "Quick recovery restores +1 extra HP.", tags: ["Med", "Utility"] },
    { id: "sterile_mesh", slot: "mod", name: "Sterile Mesh", desc: "Ignore the first injury penalty each encounter.", tags: ["Defense", "Containment"] },
  ],
  brokenchoir: [
    { id: "choir_breaker", slot: "weapon", name: "Choir Breaker", desc: "+2 damage versus signal/coordinator targets.", tags: ["Weapon", "Priority Kill"] },
    { id: "mag_anchor", slot: "kit", name: "Mag Anchor", desc: "Reduce one front-lane hit by 1.", tags: ["Anchor", "Mobility"] },
  ],
};

export const INTERLUDE_EVENTS: InterludeEvent[] = [
  {
    id: "distress_ping",
    title: "Distress Ping in the Dark",
    text: "Ashwake catches a fragmented emergency signal from a drifting shuttle just outside a sensor blind.",
    choices: [
      { id: "investigate", label: "Investigate Carefully", desc: "+1 intel, +1 salvage, lead operator gains 1 stress.", apply: { salvage: 1, intel: 1, crewStress: 1 }, log: "The squad boards the drifting shuttle and comes away with scraps and one more reason not to trust dead-zone distress calls." },
      { id: "ignore", label: "Ignore and Hold Discipline", desc: "Next mission starts with -1 alert.", apply: { nextMissionAlertMod: -1 }, log: "Ashwake lets the ping die in the dark. Discipline holds, even if nobody likes it." },
    ],
  },
  {
    id: "crew_friction",
    title: "Crew Friction",
    text: "The last run came home with more scar tissue than answers. Tempers flare in the recovery bay.",
    choices: [
      { id: "debrief", label: "Call a Hard Debrief", desc: "Reduce all crew stress by 1. Next mission starts with +1 pressure.", apply: { allStressDelta: -1, nextMissionPressureMod: 1 }, log: "A hard debrief burns time, but the squad goes back out clearer and meaner." },
      { id: "bury_it", label: "Bury It and Push On", desc: "+1 intel, one injured operator gains +1 stress.", apply: { intel: 1, injuredStress: 1 }, log: "The squad buries the argument under work. It keeps the machine moving, not healthy." },
    ],
  },
  {
    id: "black_market",
    title: "Grey-Market Contact",
    text: "A scavenger broker offers fast supplies in exchange for a slice of your route findings.",
    choices: [
      { id: "buy_supplies", label: "Buy Emergency Supplies", desc: "Spend 1 intel, gain 1 salvage, next full recovery is free once.", apply: { intel: -1, salvage: 1, freeFullRecovery: 1 }, log: "Ashwake cuts a bad deal for useful supplies. It will matter when the squad limps home." },
      { id: "refuse", label: "Refuse the Deal", desc: "Next mission starts with -1 pressure.", apply: { nextMissionPressureMod: -1 }, log: "The broker gets nothing. Ashwake keeps its route secrets tight and its next insertion cleaner." },
    ],
  },
];

const e = (id: string, name: string, hp: number, attack: number, desc: string, icon: LucideIcon): EncounterTemplate => ({ id, name, hp, attack, desc, icon });

export const MISSION_CATALOG: Record<string, MissionDefinition> = {
  redglass: {
    id: "redglass", title: "Silent Cut at Redglass Array", short: "Dead relay heist under observant security logic.", type: "Grab-and-go extraction", difficulty: "Early / Clean Ops", doctrine: "The site itself is the first enemy.", summary: "Recover a functioning signal core from a dead Orc relay array before the station decides what kind of intrusion the squad is.", objective: "Extract the Redglass signal core and leave with useful data.", optional: ["Copy traffic logs", "Recover one sensor cluster", "Avoid full-site hard alert"], playerGuidance: ["Bring one anchor or the hull ring will own your movement.", "A signal reader or engineer makes the relay choices much safer.", "Do not overbuild for damage: Redglass is about getting in and out before the site solves you."], missionClockStart: 6, pressureLabel: "Extraction Window", pressureStart: 7,
    routeMap: {
      dock: [
        { id: "airlock", title: "Half-Working Airlock", flavor: "Safer seals. More legible to the station.", alertDelta: 0, pressureDelta: -1, reward: { intel: 1 }, log: "The squad cycles through the half-dead airlock and declares a cleaner intrusion profile.", skillHooks: ["Metallic discipline", "Controlled entry"], routeNeed: "Safer if you want the station to misread you as boring.", advantage: { requiredFamilies: ["Metallic"], note: "Metallics keep the entry calm and clean instead of forcing it.", onMatch: { pressureDelta: -1, reward: { intel: 1 } }, onMiss: { alertDelta: 1 } } },
        { id: "hull", title: "Exterior Hull Bypass", flavor: "Riskier EVA line. Quieter ingress.", alertDelta: -1, pressureDelta: -1, reward: { salvage: 1 }, log: "The squad ghosts along the exterior skin and slips in through a maintenance seam.", skillHooks: ["Wing tuck discipline", "Tethers"], routeNeed: "Vacuum matters here. One sloppy wing flare makes you visible.", advantage: { requiredRoles: ["Engineer / Tech"], minTethers: 1, note: "An engineer plus live tethers turns this from reckless EVA into a planned drift.", onMatch: { alertDelta: -1 }, onMiss: { pressureDelta: 1 } } },
        { id: "cold_vent", title: "Cold-Vent Drift", flavor: "Bleed a service chamber and let the squad drift through on clipped lines.", alertDelta: -1, pressureDelta: 0, reward: { intel: 1 }, log: "The squad vents a dead chamber, tucks wings, and rides the drift into a blind maintenance seam.", skillHooks: ["Vacuum control", "Signal read"], routeNeed: "Best if someone can read timing while the squad is literally airborne in vacuum.", advantage: { requiredRoles: ["Signal Hacker"], minTethers: 1, note: "A signal reader can time the drift window before the array catches the vector change.", onMatch: { alertDelta: -1, reward: { intel: 1 } }, onMiss: { pressureDelta: 1, alertDelta: 1 } } },
      ],
      relay: [
        { id: "timed_cross", title: "Timed Sensor Crossing", flavor: "Read the sweep rhythm and move on its blind heartbeat.", alertDelta: 0, pressureDelta: 0, reward: { intel: 1 }, log: "Kestra times the crossing with the sweep pattern.", skillHooks: ["Signal pattern reading"], routeNeed: "Pure read-and-move discipline.", advantage: { requiredRoles: ["Signal Hacker"], minSensors: 1, note: "The hacker plus sensors makes this a real blind crossing instead of a prayer.", onMatch: { alertDelta: -1, reward: { intel: 1 } }, onMiss: { alertDelta: 1 } } },
        { id: "jam_pylon", title: "Jam a Sensor Pylon", flavor: "Faster and dirtier. You gain tempo, but the site compensates.", alertDelta: 1, pressureDelta: 1, reward: { salvage: 1 }, log: "The pylon stutters under interference. Other systems reroute around the disruption.", skillHooks: ["Tech sabotage"], routeNeed: "Good if you trust your engineer more than your stealth.", advantage: { requiredRoles: ["Engineer / Tech"], note: "A real tech turns this into sharp sabotage instead of noise for noise's sake.", onMatch: { pressureDelta: -1, reward: { salvage: 1 } }, onMiss: { alertDelta: 1 } } },
        { id: "truss_crawl", title: "Wing-Tucked Truss Crawl", flavor: "Move hand-over-hand across the relay truss with wings folded flat and no silhouette breaks.", alertDelta: -1, pressureDelta: -1, reward: { intel: 1 }, log: "The squad folds wings tight and crawls the relay truss one clipped segment at a time.", skillHooks: ["Vacuum discipline", "Wing control"], routeNeed: "This only works if the squad treats wings as liabilities, not heroic capes.", advantage: { requiredFamilies: ["Gem", "Metallic"], minTethers: 1, note: "Calm bodies and tether discipline keep the truss crawl invisible.", onMatch: { alertDelta: -1, pressureDelta: -1 }, onMiss: { pressureDelta: 1 } } },
      ],
      core: [
        { id: "safe_route", title: "Safe / Slow Core Approach", flavor: "More locks. Less exposure.", alertDelta: 0, pressureDelta: -1, reward: { cores: 1 }, routeIntel: "redglass_safe", log: "Bulkheads open in an orderly sequence. It feels less like automation and more like permission.", skillHooks: ["Patience", "Metallic control"], routeNeed: "The conservative answer if the squad wants survival first.", advantage: { requiredFamilies: ["Metallic"], note: "Metallic poise keeps this route from bleeding extra time and mistakes.", onMatch: { pressureDelta: -1, reward: { intel: 1 } }, onMiss: { pressureDelta: 1 } } },
        { id: "tight_route", title: "Risky / Quiet Service Spine", flavor: "Tight, silent, dangerous if anything snaps.", alertDelta: -1, pressureDelta: 0, reward: { salvage: 1, intel: 1 }, routeIntel: "redglass_tight", log: "Tassar threads the team through a service spine never meant for armored bodies.", skillHooks: ["Engineer lead", "Wings tucked"], routeNeed: "Bad wing discipline gets people stuck or dead here.", advantage: { requiredRoles: ["Engineer / Tech"], note: "A real engineer turns this from suicidal squeeze to ugly but workable ingress.", onMatch: { alertDelta: -1 }, onMiss: { pressureDelta: 1, alertDelta: 1 } } },
        { id: "antenna_leap", title: "Antenna Leap / Force Brake", flavor: "Cross an open antenna gap in vacuum, then brake hard before the core ring.", alertDelta: -1, pressureDelta: 1, reward: { cores: 1 }, routeIntel: "redglass_tight", log: "The squad commits to a vacuum leap, using clipped drift and violent braking to hit the core ring from a blind angle.", skillHooks: ["Gem control", "Chromatic nerve"], routeNeed: "This is a dragonborn move. Wings do not give lift here — only control and silhouette problems.", advantage: { requiredFamilies: ["Gem", "Chromatic"], minTethers: 1, note: "A psionic read or brutal nerve makes the leap worth it.", onMatch: { alertDelta: -1, reward: { cores: 1 } }, onMiss: { alertDelta: 1, pressureDelta: 1 } } },
      ],
    },
    encountersByAlert: [e("drone_screen","Patrol Drone Screen",16,3,"Local patrol logic that punishes lazy movement.",ScanLine),e("turret_lane","Turret Lane",20,4,"A hard firing lane tied to route denial.",Target),e("counter_intrusion","Counter-Intrusion Stack",24,5,"The station behaves like it wants a specific failure out of the squad.",Siren),e("catastrophic_response","Catastrophic Site Response",28,6,"Redglass is trying to break the squad before vacuum does.",AlertTriangle),e("catastrophic_plus","Catastrophic Anomaly Layer",32,7,"The site shows its teeth too early.",Cpu)],
    hiddenTruths: { briefing: "The first mission proves the dead zone reacts with coherence.", dock: "The array is classifying the intrusion pattern, not just detecting it.", relay: "It reprioritizes the squad based on what they value and how they move.", core: "Once the core is touched, Redglass cares more about escape control than asset defense.", encounter: "The site is trying to make the squad fail in a preferred pattern.", aftermath: "If they escape with data, the campaign moves." },
    rewardsOnSuccess: { salvage: 1, intel: 1, cores: 1 }, weirdness: "The station reprioritizes the squad's escape route over nearby valuable assets.",
  },
  quarantine7: {
    id: "quarantine7", title: "Quarantine Vault 7", short: "Sealed biotech vault under contamination pressure.", type: "Quarantine breach", difficulty: "Early / Technical Pressure", doctrine: "The facility is trying to preserve something, not just sterilize it.", summary: "Enter a sealed biomedical vault, recover an archive and one physical sample, and leave before the place decides the squad belongs inside containment.", objective: "Recover the biotech archive and a sealed sample canister.", optional: ["Keep contamination below threshold", "Bypass sterilization cycle", "Determine why the site is still powered"], playerGuidance: ["Take at least one protective or fixer build or attrition will stack fast.", "Gem or Signal-Hacker utility matters because the room lies through systems.", "This is a timing mission: if you play it like a fair fight, the vault wins."], missionClockStart: 6, pressureLabel: "Contamination", pressureStart: 2,
    routeMap: {
      dock: [
        { id: "clean_entry", title: "Clean Airlock Sequence", flavor: "Slow decon path. Lower contamination risk.", alertDelta: 0, pressureDelta: -1, reward: { intel: 1 }, log: "The squad submits to a partial decon cycle.", skillHooks: ["Metallic purge", "Protocol discipline"], routeNeed: "Best if someone treats quarantine rules as tools, not chains.", advantage: { requiredFamilies: ["Metallic"], note: "Metallic protection instincts turn the clean path into a real advantage.", onMatch: { pressureDelta: -1, reward: { intel: 1 } }, onMiss: { pressureDelta: 1 } } },
        { id: "maintenance_port", title: "Maintenance Port Bypass", flavor: "Fast and ugly. Better for stealth, worse for contamination control.", alertDelta: -1, pressureDelta: 1, reward: { salvage: 1 }, log: "The maintenance port opens under force and bad intentions.", skillHooks: ["Tech bypass"], routeNeed: "A sabotage answer that gets ugly fast if rushed.", advantage: { requiredRoles: ["Engineer / Tech"], note: "An engineer keeps the dirty route from turning into immediate containment hell.", onMatch: { alertDelta: -1 }, onMiss: { pressureDelta: 1 } } },
        { id: "vacuum_flush", title: "Vacuum Flush Entry", flavor: "Cycle an outer decon sleeve to vacuum and drift through the clean shell instead of the dirty hall.", alertDelta: -1, pressureDelta: 0, reward: { intel: 1 }, log: "The squad uses the dead vacuum shell of the decon sleeve to skip the obvious containment funnel.", skillHooks: ["Wing tuck", "Tethers", "Signal timing"], routeNeed: "This only works if the squad can move through vacuum without treating wings like free flight.", advantage: { requiredRoles: ["Signal Hacker"], minTethers: 1, note: "A signal read plus tether discipline makes the vacuum sleeve route brilliant instead of fatal.", onMatch: { pressureDelta: -1, reward: { intel: 1 } }, onMiss: { alertDelta: 1, pressureDelta: 1 } } },
      ],
      relay: [
        { id: "archive_lane", title: "Archive Wing First", flavor: "Secure the records before the sample.", alertDelta: 0, pressureDelta: 1, reward: { intel: 1 }, log: "The archive wing is too well preserved.", skillHooks: ["Pattern read", "Intel-first"], routeNeed: "Good if the squad wants answers more than tempo.", advantage: { requiredRoles: ["Signal Hacker"], minSensors: 1, note: "A real pattern reader gets paid here.", onMatch: { pressureDelta: -1, reward: { intel: 1 } }, onMiss: { pressureDelta: 1 } } },
        { id: "sample_lane", title: "Sample Wing First", flavor: "Grab the canister first.", alertDelta: 1, pressureDelta: 0, reward: { cores: 1 }, log: "The sample locks release with surgical precision.", skillHooks: ["Decisive push"], routeNeed: "More tempo, less certainty.", advantage: { requiredFamilies: ["Chromatic"], note: "Chromatic nerve makes the hard grab pay off before the room solves you.", onMatch: { reward: { cores: 1 } }, onMiss: { alertDelta: 1 } } },
        { id: "zero_g_sling", title: "Zero-G Sample Sling", flavor: "Cross the cleanroom overhead in dead air, clipped to the rail with wings folded tight.", alertDelta: -1, pressureDelta: -1, reward: { salvage: 1 }, log: "The squad crosses the chamber overhead in silence, treating vacuum and wing control as part of the route, not flavor text.", skillHooks: ["Vacuum movement", "Wing discipline"], routeNeed: "A real test of whether the squad respects zero-g movement.", advantage: { requiredRoles: ["Engineer / Tech", "Vanguard"], minTethers: 1, note: "A tough lead and a smart line handler make the overhead sling route feel almost professional.", onMatch: { alertDelta: -1, pressureDelta: -1 }, onMiss: { pressureDelta: 1, alertDelta: 1 } } },
      ],
      core: [
        { id: "sterile_path", title: "Sterile Passage", flavor: "Controlled beam corridor.", alertDelta: 0, pressureDelta: -1, reward: { intel: 1 }, routeIntel: "vault_sterile", log: "The squad moves through a corridor that still behaves like a medical instrument.", skillHooks: ["Protocol timing"], routeNeed: "Trust the machine enough to exploit it.", advantage: { requiredFamilies: ["Metallic", "Gem"], note: "Control-minded dragonborn exploit sterile timing better than brute operators.", onMatch: { pressureDelta: -1, reward: { intel: 1 } }, onMiss: { pressureDelta: 1 } } },
        { id: "emergency_spine", title: "Emergency Spine", flavor: "Fast emergency route. More shutters.", alertDelta: 1, pressureDelta: 1, reward: { salvage: 1, cores: 1 }, routeIntel: "vault_emergency", log: "The emergency spine gets the team to the heart quickly.", skillHooks: ["Break glass route"], routeNeed: "The get-it-done answer if you think you can outpace containment.", advantage: { requiredFamilies: ["Chromatic"], note: "Chromatic aggression makes the emergency spine a weapon instead of a panic button.", onMatch: { reward: { salvage: 1 } }, onMiss: { alertDelta: 1 } } },
        { id: "cold_skin_climb", title: "Cold-Skin Exterior Climb", flavor: "Climb the vault's frost shell from the outside and cut back in above containment shutters.", alertDelta: -1, pressureDelta: 0, reward: { intel: 1, salvage: 1 }, routeIntel: "vault_sterile", log: "The squad leaves the interior entirely, crawling the frozen skin of the vault with wings wrapped close and lines clipped hard.", skillHooks: ["Vacuum + cold", "Tether discipline"], routeNeed: "This route is for players who understand that space is not air and wings are not parachutes.", advantage: { requiredRoles: ["Engineer / Tech"], minTethers: 1, minHull: 1, note: "A competent exterior climb turns the vault's cold shell into the safest lie on the map.", onMatch: { alertDelta: -1, reward: { intel: 1 } }, onMiss: { pressureDelta: 1, alertDelta: 1 } } },
      ],
    },
    encountersByAlert: [e("med_drones","Failed Med-Drone Cluster",18,3,"The drones are trying to classify, pin, and contain.",HeartPulse),e("purge_beam_grid","Purge Beam Grid",22,4,"Sterilization logic turns the chamber into a weapon.",Snowflake),e("containment_stack","Containment Stack",26,5,"Doors, med-drones, and purge systems act together.",Lock),e("vault_punishment","Vault Punishment State",30,6,"The whole room behaves as if the squad belongs in containment forever.",AlertTriangle),e("catastrophic_containment","Catastrophic Containment Failure",34,7,"The team tears too hard at a vault preserving something alive.",Cpu)],
    hiddenTruths: { briefing: "Quarantine Vault 7 should feel like preservation masquerading as sterilization.", dock: "The facility categorizes the squad like specimens, not trespassers.", relay: "The archive and sample wings matter differently.", core: "The vault wants to keep its central truth in.", encounter: "What is fighting the squad is as much doctrine as machinery.", aftermath: "The team should leave with contamination fear and better med-tech." },
    rewardsOnSuccess: { salvage: 1, intel: 1, cores: 1 }, weirdness: "If the squad pushes too hard, they may glimpse movement behind sealed medical glass.",
  },
  brokenchoir: {
    id: "brokenchoir", title: "Broken Choir Containment", short: "Midgame compound-pressure mission built around a hostile signal chamber.", type: "Control-node disruption", difficulty: "Midgame / Compound Pressure", doctrine: "The site is most dangerous when signal pressure, forced movement, and fast challenges all solve the same problem together.", summary: "Shut down a corrupted signal amplifier in a dead communications cathedral before it turns the sector into one coordinated response pattern.", objective: "Break the signal core and survive the coordinated response.", optional: ["Recover one intact signal shard", "Prevent full wave escalation", "Map the deeper relay tree"], playerGuidance: ["Do not enter Broken Choir without a reliable answer for priority-kill challenges.", "You still need an anchor or the room will split your formation apart.", "This is where burst damage matters, but only if the squad can still move and read the field."], missionClockStart: 7, pressureLabel: "Wave Pressure", pressureStart: 4,
    routeMap: {
      dock: [
        { id: "choir_spine", title: "Choir Spine Entry", flavor: "Direct line into the signal chamber.", alertDelta: 1, pressureDelta: 0, reward: { cores: 1 }, log: "The squad enters through a central spine lined with dead speakers and warning glass.", skillHooks: ["Aggression", "Fast commit"], routeNeed: "The honest front-door violence option.", advantage: { requiredFamilies: ["Chromatic"], note: "Chromatic force turns the loud entry into momentum instead of panic.", onMatch: { pressureDelta: -1, reward: { cores: 1 } }, onMiss: { alertDelta: 1 } } },
        { id: "maintenance_belfry", title: "Maintenance Belfry", flavor: "Cleaner side entry with better positioning.", alertDelta: 0, pressureDelta: 1, reward: { intel: 1 }, log: "The team slips into a maintenance belfry and gains a better angle on the chamber.", skillHooks: ["Calm angle control"], routeNeed: "Good if you care about position more than tempo.", advantage: { requiredFamilies: ["Gem", "Metallic"], note: "Control-minded dragonborn get paid for patience here.", onMatch: { alertDelta: -1, reward: { intel: 1 } }, onMiss: { pressureDelta: 1 } } },
        { id: "speaker_shaft_glide", title: "Speaker-Shaft Glide", flavor: "Jump the dead speaker shafts in vacuum, braking off struts instead of floors.", alertDelta: -1, pressureDelta: 0, reward: { intel: 1 }, log: "The squad cuts through the dead speaker shafts, using tethered drift and wing control to arrive from a direction the chamber was not screening.", skillHooks: ["Wing discipline", "Vacuum pathing"], routeNeed: "If players are not thinking about silhouette, inertia, and braking, this is a trap.", advantage: { requiredRoles: ["Signal Hacker", "Engineer / Tech"], minTethers: 1, note: "A signal caller plus line discipline makes the shaft glide brutally efficient.", onMatch: { alertDelta: -1, pressureDelta: -1, reward: { intel: 1 } }, onMiss: { alertDelta: 1, pressureDelta: 1 } } },
      ],
      relay: [
        { id: "kill_siren_first", title: "Cut Toward the Coordinator", flavor: "Aggressively target the command problem.", alertDelta: 1, pressureDelta: -1, reward: { salvage: 1 }, log: "The squad commits to priority-target doctrine.", skillHooks: ["Priority kill", "Chromatic nerve"], routeNeed: "Correct if you trust yourself to break the room before it breaks you.", advantage: { requiredFamilies: ["Chromatic"], note: "Fast violence actually is the right answer sometimes.", onMatch: { reward: { salvage: 1 }, pressureDelta: -1 }, onMiss: { alertDelta: 1 } } },
        { id: "jam_network_first", title: "Jam the Relay Web", flavor: "Slow the signal lattice before the room’s escalation locks into coherence.", alertDelta: 0, pressureDelta: 0, reward: { intel: 1 }, log: "Kestra and Tassar break pieces of the relay web.", skillHooks: ["Signal control", "Tech sabotage"], routeNeed: "The smart answer if the squad wants the whole fight to be easier later.", advantage: { requiredRoles: ["Signal Hacker", "Engineer / Tech"], note: "The hacker-tech pairing finally gets to outthink the room together.", onMatch: { alertDelta: -1, pressureDelta: -1, reward: { intel: 1 } }, onMiss: { pressureDelta: 1 } } },
        { id: "decompression_cut", title: "Controlled Decompression Cut", flavor: "Blow one side nave to vacuum and let the signal choir lose formation for a few seconds.", alertDelta: -1, pressureDelta: -1, reward: { salvage: 1 }, log: "The squad uses decompression as a weapon, forcing the chamber to solve pressure, drift, and screaming geometry all at once.", skillHooks: ["Vacuum weaponization", "Hull/tether control"], routeNeed: "This is exactly the kind of choice that should only exist in your campaign, not generic fantasy combat.", advantage: { requiredRoles: ["Engineer / Tech"], minHull: 1, minTethers: 1, note: "A competent exterior-minded operator can turn vacuum itself into tempo.", onMatch: { alertDelta: -1, pressureDelta: -1, reward: { salvage: 1 } }, onMiss: { pressureDelta: 1, alertDelta: 1 } } },
      ],
      core: [
        { id: "hold_choke", title: "Hold the Choke", flavor: "Risk static defense against a room that punishes static defense.", alertDelta: 1, pressureDelta: 1, reward: { salvage: 1 }, log: "Vaelor plants the squad in a brutal hold point.", skillHooks: ["Vanguard anchor"], routeNeed: "The obvious answer — and maybe the wrong one if the room is smarter than you.", advantage: { requiredRoles: ["Vanguard"], note: "A real anchor can buy time that lesser teams never get.", onMatch: { pressureDelta: -1 }, onMiss: { pressureDelta: 1 } } },
        { id: "cut_side_lanes", title: "Cut the Side Lanes", flavor: "Trade stability for mobility.", alertDelta: 0, pressureDelta: 0, reward: { intel: 1, cores: 1 }, log: "The team starts killing the room's geometry instead of its bodies.", skillHooks: ["Gem control", "Map thinking"], routeNeed: "For players who understand that movement can be the true objective.", advantage: { requiredFamilies: ["Gem"], note: "Gem pattern-reading shines hardest when the fight is really about routes, not kills.", onMatch: { alertDelta: -1, reward: { intel: 1 } }, onMiss: { pressureDelta: 1 } } },
        { id: "siren_drop", title: "Wing-Snap Drop Behind the Control Node", flavor: "Use a tethered drop through open choir space and brake hard behind the coordinator node.", alertDelta: -1, pressureDelta: 1, reward: { cores: 1 }, log: "The squad commits to a brutal vacuum drop, using tucked wings for control and a violent tether brake behind the signal brain.", skillHooks: ["Vacuum drop", "Priority kill"], routeNeed: "This only works if the players respect inertia more than hero fantasy.", advantage: { requiredRoles: ["Marksman", "Vanguard"], minTethers: 1, note: "A killer plus an anchor turns the drop into a surgical strike instead of a wipe.", onMatch: { alertDelta: -1, reward: { cores: 1 } }, onMiss: { alertDelta: 1, pressureDelta: 1 } } },
      ],
    },
    encountersByAlert: [e("orc_push","Orc Infected Push",22,4,"Fast baseline infected pressure backed by too much route certainty.",AlertTriangle),e("siren_wave","Siren-Backed Wave",26,5,"An Elf Siren turns the room into a conductor's box.",Siren),e("corroder_stack","Corroder / Signal Stack",30,6,"Bile denial and signal discipline work together.",Droplets),e("choir_breakpoint","Choir Breakpoint",34,7,"System pressure, infected pressure, and signal doctrine behave like one machine.",Cpu),e("cathedral_panic","Cathedral Panic State",38,8,"The first real dead-zone war state.",AlertTriangle)],
    hiddenTruths: { briefing: "This is one of the first places where the dead zone should feel like layered tactical infrastructure.", dock: "The signal chamber is pulling site logic and hostile attention into the same response pattern.", relay: "The chamber's control problem is shaping the room's behavior and making old systems fight like they still belong to a living doctrine.", core: "Multiple challenge layers are not separate problems anymore.", encounter: "This is the campaign's compound-pressure doctrine made visible.", aftermath: "If the squad wins here, they should understand that the dead zone is actively curated." },
    rewardsOnSuccess: { salvage: 2, intel: 1, cores: 1 }, weirdness: "The signal architecture makes the dead zone feel less like a disaster and more like an instrument.",
  },
};

export const SHIP_UPGRADES = [
  { id: "hull", title: "Hull Plating", desc: "+1 hull.", cost: { salvage: 2 }, apply: (ship: ShipState) => ({ ...ship, hull: ship.hull + 1 }) },
  { id: "sensors", title: "Dead-Zone Sensor Suite", desc: "+1 sensors.", cost: { intel: 2 }, apply: (ship: ShipState) => ({ ...ship, sensors: ship.sensors + 1 }) },
  { id: "tethers", title: "Mag-Tether Array", desc: "+1 tethers.", cost: { salvage: 1, intel: 1 }, apply: (ship: ShipState) => ({ ...ship, tethers: ship.tethers + 1 }) },
  { id: "medbay", title: "Field Purge Medbay", desc: "+1 medbay.", cost: { salvage: 1, cores: 1 }, apply: (ship: ShipState) => ({ ...ship, medbay: ship.medbay + 1 }) },
  { id: "reactor", title: "Signal Core Reactor Tuning", desc: "+1 reactor.", cost: { cores: 2 }, apply: (ship: ShipState) => ({ ...ship, reactor: ship.reactor + 1 }) },
];

export function deepClone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
export function clamp(value: number, low: number, high: number): number { return Math.max(low, Math.min(high, value)); }
export function alertLabel(alert: number): string { if (alert <= 0) return "Quiet"; if (alert === 1) return "Suspicion"; if (alert === 2) return "Local Response"; if (alert === 3) return "Hard Response"; return "Catastrophic"; }
export function positionLabel(position: Position): string { return position === "front" ? "Front" : position === "cover" ? "Cover" : "Back"; }
export function slotLabel(slot: GearSlot): string { return slot === "weapon" ? "Weapon" : slot === "mod" ? "Mod" : "Kit"; }
export function familyTone(family: string): string { return family === "Metallic" ? "tag-blue" : family === "Chromatic" ? "tag-red" : "tag-purple"; }
export function subtypeIconName(type: string): string { return type === "Fire" ? "🔥" : type === "Lightning" ? "⚡" : type === "Acid" ? "🧪" : type === "Cold" ? "❄️" : type === "Force" ? "🌀" : "◆"; }
export function missionResultLabel(outcome: Outcome | null): string { return outcome === "success" ? "Clean Enough Success" : outcome === "partial" ? "Messy Extraction" : outcome === "failure" ? "Mission Failure" : "Unknown"; }

export function branchModsForMission(ship: ShipState, missionId: string): { alertMod: number; pressureMod: number; notes: string[] } {
  let alertMod = 0;
  let pressureMod = 0;
  const notes: string[] = [];

  if (missionId === "redglass" && ship.missionOutcomes.redglass === "failure") {
    alertMod += 1;
    notes.push("Redglass remembers the failed intrusion profile. Retry starts at +1 alert.");
  }
  if (missionId === "quarantine7" && ship.missionOutcomes.quarantine7 === "failure") {
    pressureMod += 1;
    notes.push("Vault 7 containment doctrine tightened after the last failed breach. Retry starts at +1 pressure.");
  }
  if (missionId === "brokenchoir") {
    if (ship.missionOutcomes.redglass === "partial") {
      alertMod += 1;
      notes.push("Messy Redglass extraction left a readable dead-zone signature. Broken Choir starts at +1 alert.");
    }
    if (ship.missionOutcomes.quarantine7 === "partial") {
      pressureMod += 1;
      notes.push("Quarantine 7 ended dirty. Broken Choir starts at +1 pressure.");
    }
  }

  return { alertMod, pressureMod, notes };
}

export function branchPreviewForMission(ship: ShipState, missionId: string): string | null {
  const mods = branchModsForMission(ship, missionId);
  if (!mods.notes.length) return null;
  return mods.notes.join(" ");
}

export function outcomeTagClass(outcome: Outcome | null): string {
  return outcome === "success" ? "tag-complete" : outcome === "partial" ? "tag-warning" : outcome === "failure" ? "tag-danger" : "tag-neutral";
}
export function createDefaultAppState(): AppState { return { crew: deepClone(STARTING_CREW), ship: deepClone(STARTING_SHIP), selectedCrew: STARTING_CREW[0].id, logs: [...DEFAULT_LOGS], dmMode: false, chosenUpgrade: null, missionState: deepClone(DEFAULT_MISSION_STATE), onboarding: { completed: false, step: "start" } }; }

export function suggestedTrainingCrew(): CrewMember[] {
  let crew = deepClone(STARTING_CREW);
  const plan: Array<[string, { role: string; family: string; subtype: string }]> = [
    ["slot-1", { role: "Vanguard", family: "Metallic", subtype: "Gold" }],
    ["slot-2", { role: "Signal Hacker", family: "Gem", subtype: "Amethyst" }],
    ["slot-3", { role: "Marksman", family: "Chromatic", subtype: "Blue" }],
    ["slot-4", { role: "Engineer / Tech", family: "Metallic", subtype: "Copper" }],
  ];
  for (const [crewId, updates] of plan) {
    crew = crew.map((member) => (member.id === crewId ? rebuildCrewMember(member, updates) : member));
  }
  return crew;
}


function hasAnyRole(crew: CrewMember[], roles?: string[]): boolean {
  if (!roles || roles.length === 0) return true;
  return crew.some((member) => roles.includes(member.role));
}

function hasAnyFamily(crew: CrewMember[], families?: string[]): boolean {
  if (!families || families.length === 0) return true;
  return crew.some((member) => families.includes(member.family));
}

export function resolveRouteOption(option: RouteOption, crew: CrewMember[], ship: ShipState): ResolvedRouteOption {
  const baseReward = { salvage: option.reward.salvage || 0, intel: option.reward.intel || 0, cores: option.reward.cores || 0 };
  const noteParts: string[] = [];
  let equipmentAlert = 0;
  let equipmentPressure = 0;
  let equipmentReward = { salvage: 0, intel: 0, cores: 0 };

  const needsVacuumDiscipline = /vacuum|drift|wing|tether|brake|hull/i.test(`${option.routeNeed || ""} ${option.title} ${option.flavor}`);
  const needsSignalControl = /signal|sweep|pattern|relay|sensor|timing/i.test(`${option.routeNeed || ""} ${option.title} ${option.flavor}`);
  const needsHazardControl = /containment|sterile|chem|corrosion|purge|bio/i.test(`${option.routeNeed || ""} ${option.title} ${option.flavor}`);
  const needsViolence = /force|priority|aggression|front-door|kill|brutal/i.test(`${option.routeNeed || ""} ${option.title} ${option.flavor}`);

  if (needsVacuumDiscipline && crew.some((member) => member.suitChassisId === "vector" || member.moduleDoctrineId === "mag_tether" || member.moduleDoctrineId === "wing_lock" || member.moduleDoctrineId === "grav_boots")) {
    equipmentPressure -= 1;
    noteParts.push("Equipment edge: vector / tether doctrine makes the crossing cleaner.");
  }
  if (needsSignalControl && crew.some((member) => member.suitChassisId === "relay" || member.moduleDoctrineId === "signal_baffler" || member.doctrineWeaponId === "laser")) {
    equipmentAlert -= 1;
    equipmentReward.intel += 1;
    noteParts.push("Equipment edge: relay / laser kit helps the squad read and jam the room.");
  }
  if (needsHazardControl && crew.some((member) => member.suitChassisId === "containment" || member.moduleDoctrineId === "auto_seal" || member.moduleDoctrineId === "purge_injectors")) {
    equipmentPressure -= 1;
    noteParts.push("Equipment edge: containment doctrine keeps the room from turning the environment into the main problem.");
  }
  if (needsViolence && crew.some((member) => member.doctrineWeaponId === "plasma" || member.doctrineWeaponId === "slug" || member.suitChassisId === "breach")) {
    equipmentReward.salvage += 1;
    noteParts.push("Equipment edge: breach / heavy weapon doctrine can force tempo when the route demands nerve.");
  }

  if (!option.advantage) {
    const alertDelta = option.alertDelta + equipmentAlert;
    const pressureDelta = option.pressureDelta + equipmentPressure;
    const reward = {
      salvage: baseReward.salvage + equipmentReward.salvage,
      intel: baseReward.intel + equipmentReward.intel,
      cores: baseReward.cores + equipmentReward.cores,
    };
    return {
      matched: noteParts.length > 0,
      alertDelta,
      pressureDelta,
      reward,
      preview: `Projected with current squad: Alert ${alertDelta >= 0 ? `+${alertDelta}` : alertDelta}, Pressure ${pressureDelta >= 0 ? `+${pressureDelta}` : pressureDelta}`,
      detail: noteParts.length ? noteParts.join(" ") : null,
    };
  }

  const matched = hasAnyRole(crew, option.advantage.requiredRoles)
    && hasAnyFamily(crew, option.advantage.requiredFamilies)
    && ship.tethers >= (option.advantage.minTethers || 0)
    && ship.sensors >= (option.advantage.minSensors || 0)
    && ship.hull >= (option.advantage.minHull || 0);

  const delta = matched ? option.advantage.onMatch : option.advantage.onMiss;
  const alertDelta = option.alertDelta + (delta?.alertDelta || 0) + equipmentAlert;
  const pressureDelta = option.pressureDelta + (delta?.pressureDelta || 0) + equipmentPressure;
  const reward = {
    salvage: baseReward.salvage + (delta?.reward?.salvage || 0) + equipmentReward.salvage,
    intel: baseReward.intel + (delta?.reward?.intel || 0) + equipmentReward.intel,
    cores: baseReward.cores + (delta?.reward?.cores || 0) + equipmentReward.cores,
  };

  const detail = [matched ? `Squad edge: ${option.advantage.note}` : `Bad fit right now: ${option.advantage.note}`, ...noteParts].join(" ").trim();

  return {
    matched: matched || noteParts.length > 0,
    alertDelta,
    pressureDelta,
    reward,
    preview: `Projected with current squad: Alert ${alertDelta >= 0 ? `+${alertDelta}` : alertDelta}, Pressure ${pressureDelta >= 0 ? `+${pressureDelta}` : pressureDelta}`,
    detail,
  };
}

export function buildEncounterUnits(encounter: EncounterTemplate): EnemyUnit[] {
  switch (encounter.id) {
    case "drone_screen": return [{ id: "screen_drone", name: "Screen Drone", hp: 8, maxHp: 8, attack: 2, role: "Suppressor", priority: 2, targetBias: "front", intentText: "Suppress front", tags: ["Drone", "Screen"] }, { id: "shutter_logic", name: "Shutter Logic", hp: 6, maxHp: 6, attack: 1, role: "Route Control", priority: 1, targetBias: "cover", intentText: "Reposition shutters", tags: ["System", "Route"] }];
    case "turret_lane": return [{ id: "lane_turret", name: "Lane Turret", hp: 10, maxHp: 10, attack: 4, role: "Kill Lane", priority: 3, targetBias: "front", intentText: "Sweep front", tags: ["Turret", "Loud"] }, { id: "tracking_laser", name: "Tracking Laser", hp: 8, maxHp: 8, attack: 2, role: "Bracket Cover", priority: 2, targetBias: "cover", intentText: "Bracket cover", tags: ["System", "Precision"] }];
    case "counter_intrusion": return [{ id: "counter_stack", name: "Counter-Intrusion Core", hp: 12, maxHp: 12, attack: 4, role: "Coordinator", priority: 3, targetBias: "cover", intentText: "Crossfire cover", tags: ["System", "Coordinator"] }, { id: "exit_lock", name: "Exit Lock", hp: 8, maxHp: 8, attack: 2, role: "Route Denial", priority: 2, targetBias: "back", intentText: "Seal exit", tags: ["Route", "Lock"] }];
    case "med_drones": return [{ id: "med_drone_alpha", name: "Med-Drone Alpha", hp: 8, maxHp: 8, attack: 2, role: "Tagger", priority: 2, targetBias: "cover", intentText: "Tag contamination", tags: ["Drone", "Containment"] }, { id: "med_drone_beta", name: "Med-Drone Beta", hp: 8, maxHp: 8, attack: 2, role: "Holder", priority: 1, targetBias: "front", intentText: "Hold front", tags: ["Drone", "Containment"] }, { id: "side_door_logic", name: "Side-Door Logic", hp: 6, maxHp: 6, attack: 1, role: "Seal Side Doors", priority: 1, targetBias: "back", intentText: "Seal side doors", tags: ["System", "Route"] }];
    case "purge_beam_grid": return [{ id: "purge_grid", name: "Purge Beam Grid", hp: 10, maxHp: 10, attack: 4, role: "Sterilizer", priority: 3, targetBias: "front", intentText: "Sweep corridor", tags: ["Beam", "Hazard"] }, { id: "containment_eye", name: "Containment Eye", hp: 8, maxHp: 8, attack: 2, role: "Bracket Cover", priority: 2, targetBias: "cover", intentText: "Bracket cover", tags: ["Sensor", "Pressure"] }];
    case "containment_stack": return [{ id: "stack_core", name: "Containment Core", hp: 12, maxHp: 12, attack: 4, role: "Doctrine Node", priority: 3, targetBias: "cover", intentText: "Escalate purge", tags: ["System", "Coordinator"] }, { id: "sample_lock", name: "Sample Lock", hp: 8, maxHp: 8, attack: 2, role: "Seal Sample Lane", priority: 2, targetBias: "back", intentText: "Seal sample lane", tags: ["Route", "Containment"] }];
    case "orc_push": return [{ id: "orc_wave", name: "Orc Infected Wave", hp: 12, maxHp: 12, attack: 4, role: "Frontline Rush", priority: 2, targetBias: "front", intentText: "Rush front", tags: ["Infected", "Baseline"] }, { id: "lane_pressure", name: "Lane Pressure", hp: 10, maxHp: 10, attack: 2, role: "Collapse Lane", priority: 1, targetBias: "cover", intentText: "Collapse lane", tags: ["Route", "Pressure"] }];
    case "siren_wave": return [{ id: "elf_siren", name: "Elf Siren", hp: 8, maxHp: 8, attack: 2, role: "Coordinator", priority: 4, targetBias: "back", intentText: "Call reinforcements", tags: ["Special", "Priority Kill", "Signal", "Coordinator"] }, { id: "orc_pack", name: "Orc Pack", hp: 12, maxHp: 12, attack: 4, role: "Flood the Choke", priority: 2, targetBias: "front", intentText: "Flood the choke", tags: ["Infected", "Swarm"] }];
    case "corroder_stack": return [{ id: "orc_corroder", name: "Orc Corroder", hp: 10, maxHp: 10, attack: 4, role: "Area Denial", priority: 3, targetBias: "cover", intentText: "Burn cover", tags: ["Special", "Bile"] }, { id: "signal_stack", name: "Signal Stack", hp: 10, maxHp: 10, attack: 2, role: "Escalator", priority: 2, targetBias: "back", intentText: "Escalate wave pressure", tags: ["System", "Signal"] }, { id: "orc_wave_support", name: "Orc Push", hp: 10, maxHp: 10, attack: 3, role: "Seal Corridor", priority: 1, targetBias: "front", intentText: "Seal corridor", tags: ["Infected", "Pressure"] }];
    case "choir_breakpoint": return [{ id: "breakpoint_core", name: "Choir Core", hp: 12, maxHp: 12, attack: 4, role: "Command Logic", priority: 3, targetBias: "back", intentText: "Lock escape", tags: ["System", "Command"] }, { id: "goblin_leasher", name: "Goblin Leasher", hp: 8, maxHp: 8, attack: 4, role: "Separation Threat", priority: 4, targetBias: "back", intentText: "Drive separation", tags: ["Special", "Devastating", "Priority Kill"] }, { id: "orc_mass", name: "Orc Mass", hp: 12, maxHp: 12, attack: 4, role: "Convergence Push", priority: 2, targetBias: "front", intentText: "Push final convergence", tags: ["Infected", "Swarm"] }];
    case "cathedral_panic": return [{ id: "panic_siren", name: "Siren Echo", hp: 10, maxHp: 10, attack: 3, role: "Wave Bloom", priority: 4, targetBias: "back", intentText: "Wave bloom", tags: ["Special", "Signal", "Priority Kill"] }, { id: "panic_corroder", name: "Corroder Bloom", hp: 10, maxHp: 10, attack: 4, role: "Choke Failure", priority: 3, targetBias: "cover", intentText: "Choke failure", tags: ["Special", "Bile"] }, { id: "panic_mass", name: "Command Mass", hp: 14, maxHp: 14, attack: 4, role: "Collapse Push", priority: 2, targetBias: "front", intentText: "Command collapse", tags: ["Infected", "War State"] }];
    default: return [{ id: `${encounter.id}_core`, name: encounter.name, hp: encounter.hp, maxHp: encounter.hp, attack: encounter.attack, role: "Hostile Logic", priority: 1, targetBias: "front", intentText: "Pressure squad", tags: ["General"] }];
  }
}

export function gearAttackBonus(member: CrewMember, unit?: EnemyUnit): number {
  let bonus = 0;
  if (member.gear.weapon?.id === "quiet_sights") bonus += 1;
  if (member.gear.weapon?.id === "choir_breaker" && unit && unit.tags.some((tag) => ["Signal", "Coordinator", "Priority Kill", "Command"].includes(tag))) bonus += 2;
  return bonus;
}
