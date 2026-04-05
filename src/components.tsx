import React from "react";
import {
  Activity,
  AlertTriangle,
  Boxes,
  ChevronRight,
  Compass,
  Cpu,
  Cross,
  DoorOpen,
  Eye,
  FileText,
  Gauge,
  MoveRight,
  Package,
  Play,
  Radio,
  ScanLine,
  ShipWheel,
  Target,
  Users,
  Wrench,
} from "lucide-react";
import {
  CAMPAIGN_MAP,
  ROUTE_INTEL_TEXT,
  alertLabel,
  clamp,
  branchPreviewForMission,
  familyTone,
  FAMILY_BLUEPRINTS,
  missionResultLabel,
  outcomeTagClass,
  positionLabel,
  ROLE_BLUEPRINTS,
  slotLabel,
  SUBTYPE_BLUEPRINTS,
  SUIT_CHASSIS,
  SUIT_MODULES,
  WEAPON_FAMILIES,
  subtypeIconName,
  type CrewMember,
  type DoctrineUnlocks,
  type EnemyUnit,
  type GearItem,
  type InterludeChoice,
  type InterludeEvent,
  type MissionDefinition,
  type MissionRuntimeState,
  resolveRouteOption,
  type RouteOption,
  type ShipState,
} from "./gameData";

export function TopBar(props: {
  activeMission: boolean;
  alert: number;
  pressureLabel: string;
  pressure: number;
  sealClock: number | null;
  clockExpired: boolean;
  crewStanding: number;
  crewTotal: number;
  beat: string;
  shipName: string;
  hull: number;
  medbay: number;
  dmMode: boolean;
  progress: number;
  onToggleDm: () => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
}) {
  const Stat = ({ icon: Icon, label, value, tone = "" }: { icon: React.ComponentType<{ size?: number }>; label: string; value: string | number; tone?: string }) => (
    <div className="header-stat">
      <div className="header-stat-label"><Icon size={16} />{label}</div>
      <div className={`header-stat-value ${tone}`}>{value}</div>
    </div>
  );

  return (
    <div className="hero-card">
      <div className="hero-row">
        <div>
          <div className="eyebrow"><Cpu size={14} /> Dead-Zone Operations</div>
          <h1 className="hero-title">Command Deck // Expedition Build</h1>
          <p className="hero-copy">A playable command deck for a dragonborn extraction squad pushing into abandoned Orc space.</p>
        </div>
        <div className="button-cluster">
          <button className="button button-secondary" onClick={props.onExport}>Export Save</button>
          <button className="button button-secondary" onClick={props.onImport}>Import Save</button>
          <button className="button button-secondary" onClick={props.onReset}>Reset Save</button>
          <button className={`button ${props.dmMode ? "button-warning" : "button-secondary"}`} onClick={props.onToggleDm}>{props.dmMode ? "Hide DM Layer" : "Show DM Layer"}</button>
          <div className="pill">Progress {Math.round(props.progress)}%</div>
        </div>
      </div>
      <div className="stats-grid">
        <Stat icon={AlertTriangle} label="Alert" value={props.activeMission ? `${alertLabel(props.alert)} (${props.alert})` : "Standby"} tone={props.alert >= 3 ? "text-danger" : ""} />
        <Stat icon={Gauge} label={props.activeMission ? props.pressureLabel : "Pressure"} value={props.activeMission ? props.pressure : "—"} tone={props.pressure >= 7 ? "text-warn" : ""} />
        <Stat icon={ScanLine} label="Seal Clock" value={props.activeMission ? (props.sealClock ?? "—") : "Standby"} tone={props.clockExpired ? "text-danger" : (props.sealClock !== null && props.sealClock <= 2) ? "text-warn" : ""} />
        <Stat icon={Users} label="Squad" value={`${props.crewStanding}/${props.crewTotal} Standing`} />
        <Stat icon={Compass} label="Beat" value={props.beat.toUpperCase()} />
        <Stat icon={ShipWheel} label="Ship" value={`${props.shipName} • H${props.hull} M${props.medbay}`} tone="text-good" />
      </div>
    </div>
  );
}


export function WhyChip({ text, tone = "neutral", label = "Why?" }: { text: string; tone?: "neutral" | "good" | "warn"; label?: string }) {
  return (
    <details className={`why-chip why-chip-${tone}`}>
      <summary>{label}</summary>
      <div className="why-chip-body">{text}</div>
    </details>
  );
}


function costTag(cost: { salvage?: number; intel?: number; cores?: number }) {
  const parts = [];
  if (cost.salvage) parts.push(`Salvage ${cost.salvage}`);
  if (cost.intel) parts.push(`Intel ${cost.intel}`);
  if (cost.cores) parts.push(`Cores ${cost.cores}`);
  return parts.length ? parts.join(" • ") : "Field standard";
}

export function EquipmentDoctrinePanel() {
  return (
    <div className="panel">
      <div className="eyebrow"><Wrench size={14} /> Equipment Doctrine v1</div>
      <h2 className="panel-title">Weapons, suits, and modules should solve the room — not just raise damage.</h2>
      <p className="panel-copy">This campaign rewards matching the tool to the environment. Smart operators ask what keeps the room from getting worse, what keeps the extract alive, and what lets the squad survive the clock.</p>
      <div className="three-col" style={{ marginTop: 16 }}>
        {WEAPON_FAMILIES.map((family) => (
          <div key={family.id} className="sub-panel">
            <div className="button-title">{family.name}</div>
            <div className="small-copy" style={{ marginTop: 8 }}>{family.pitch}</div>
            <WhyChip text={family.why} tone="good" label="When would I use this?" />
            <div className="tag-row" style={{ marginTop: 10 }}>
              <span className="tag tag-neutral">Starter cost: {costTag(family.starterCost)}</span>
            </div>
            <div className="small-label" style={{ marginTop: 12 }}>Good at</div>
            <ul className="small-copy bullet-list">{family.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
            <div className="small-label" style={{ marginTop: 10 }}>Tradeoffs</div>
            <ul className="small-copy bullet-list">{family.tradeoffs.map((item) => <li key={item}>{item}</li>)}</ul>
            <div className="small-label" style={{ marginTop: 10 }}>Safest in</div>
            <div className="tag-row" style={{ marginTop: 8 }}>{family.safestIn.map((item) => <span key={item} className="tag tag-neutral">{item}</span>)}</div>
            <div className="small-label" style={{ marginTop: 10 }}>Examples</div>
            <div className="tag-row" style={{ marginTop: 8 }}>{family.examples.map((item) => <span key={item} className="tag tag-blue">{item}</span>)}</div>
          </div>
        ))}
      </div>

      <div className="two-col" style={{ marginTop: 16 }}>
        <div className="sub-panel">
          <div className="button-title">Suit Chassis</div>
          <div className="stack" style={{ marginTop: 12 }}>
            {SUIT_CHASSIS.map((suit) => (
              <div key={suit.id} className="inventory-item">
                <div className="crew-head">
                  <div>
                    <div className="button-title">{suit.name}</div>
                    <div className="button-copy">{suit.role}</div>
                  </div>
                  <span className="tag tag-neutral">{costTag(suit.starterCost)}</span>
                </div>
                <div className="small-copy" style={{ marginTop: 8 }}>{suit.pitch}</div>
                <WhyChip text={suit.why} tone="good" label="Why choose this?" />
                <div className="tag-row" style={{ marginTop: 10 }}>
                  <span className="tag tag-neutral">Armor {suit.stats.armor}</span>
                  <span className="tag tag-neutral">Seal {suit.stats.seal}</span>
                  <span className="tag tag-neutral">Mobility {suit.stats.mobility}</span>
                  <span className="tag tag-neutral">Thermal {suit.stats.thermal}</span>
                  <span className="tag tag-neutral">Arc {suit.stats.arc}</span>
                  <span className="tag tag-neutral">Chem {suit.stats.chem}</span>
                  <span className="tag tag-neutral">Signal {suit.stats.signal}</span>
                  <span className="tag tag-neutral">Wing {suit.stats.wing}</span>
                  <span className="tag tag-neutral">Power {suit.stats.power}</span>
                  <span className="tag tag-neutral">Signature {suit.stats.signature}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="sub-panel">
          <div className="button-title">Modules</div>
          <div className="stack" style={{ marginTop: 12 }}>
            {SUIT_MODULES.map((module) => (
              <div key={module.id} className="inventory-item">
                <div className="crew-head">
                  <div>
                    <div className="button-title">{module.name}</div>
                    <div className="button-copy">{module.slot}</div>
                  </div>
                  <span className="tag tag-neutral">{costTag(module.cost)}</span>
                </div>
                <div className="small-copy" style={{ marginTop: 8 }}>{module.pitch}</div>
                <WhyChip text={module.why} tone="good" label="Why take this?" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


export function TutorialStartPanel({ onBegin, onSkip }: { onBegin: () => void; onSkip: () => void }) {
  return (
    <div className="panel tutorial-panel">
      <div className="eyebrow"><Play size={14} /> First Run //</div>
      <h2 className="panel-title">Begin Training Run</h2>
      <p className="panel-copy">This app should teach you the campaign one decision at a time. Build a squad, break the seal, and learn why the timer, vacuum, wings, and tethers matter before the full command deck opens up.</p>
      <div className="two-col">
        <div className="sub-panel">
          <div className="button-title">What this teaches</div>
          <ul className="small-copy bullet-list">
            <li>Why each role exists in this campaign</li>
            <li>Why wings are for control, not free flight</li>
            <li>Why tethers and vacuum discipline matter</li>
            <li>Why the seal clock is the real mission pressure</li>
            <li>Why extraction matters more than ego kills</li>
          </ul>
        </div>
        <div className="sub-panel">
          <div className="button-title">How this works</div>
          <div className="small-copy">The tutorial is guided. The app should keep pushing you to the next right decision instead of dumping every system on screen at once.</div>
        </div>
      </div>
      <div className="button-cluster">
        <button className="button button-primary" onClick={onBegin}>Build Training Squad <ChevronRight size={16} /></button>
        <button className="button button-secondary" onClick={onSkip}>Skip to Command Deck</button>
      </div>
    </div>
  );
}

export function TutorialBuilderPanel({ crew, onUpdateCrew, squadReady, onContinue, onAutoSuggest, doctrineUnlocks }: { crew: CrewMember[]; onUpdateCrew: (crewId: string, updates: Partial<Pick<CrewMember, "role" | "family" | "subtype" | "doctrineWeaponId" | "suitChassisId" | "moduleDoctrineId">>) => void; squadReady: boolean; onContinue: () => void; onAutoSuggest: () => void; doctrineUnlocks: DoctrineUnlocks }) {
  const assigned = crew.filter((member) => member.role !== "Unassigned" && member.family !== "Unassigned" && member.subtype !== "Unassigned").length;
  return (
    <div className="stack-large">
      <div className="panel tutorial-panel">
        <div className="eyebrow"><Users size={14} /> Training Funnel //</div>
        <h2 className="panel-title">Build the squad first</h2>
        <p className="panel-copy">Assume the player knows almost nothing. This builder exists to explain why each job matters before the mission starts. Build a four-operator training squad, then the app will push you into a guided Redglass breach drill.</p>
        <div className="two-col">
          <div className="sub-panel">
            <div className="button-title">Build order</div>
            <ol className="small-copy bullet-list">
              <li>Pick one operator who can hold lanes so the room cannot shove the whole squad around</li>
              <li>Pick one who can read or hack hostile logic so traps and timing are not blind guesses</li>
              <li>Pick one who can delete kill-first challenges before they compound</li>
              <li>Pick one who keeps bad plans from collapsing when the level gets ugly</li>
            </ol>
          </div>
          <div className="sub-panel">
            <div className="button-title">Training shortcut</div>
            <div className="small-copy">If you do not know what to pick yet, use the recommended squad. The point of training is to learn why the choices are good, not to freestyle a perfect build on attempt one.</div>
            <div className="button-cluster" style={{ marginTop: 10 }}>
              <button className="button button-primary" onClick={onAutoSuggest}>Use Recommended Training Squad</button>
            </div>
            <div className="small-label" style={{ marginTop: 14 }}>Progress</div>
            <div className="tag-row" style={{ marginTop: 10 }}>
              <span className={`tag ${squadReady ? "tag-complete" : "tag-warning"}`}>{assigned}/4 assigned</span>
              <span className="tag tag-neutral">Training run unlocks at 4/4</span>
            </div>
            <div className="small-copy text-muted" style={{ marginTop: 10 }}>The app will not throw you into the map until every slot is real.</div>
          </div>
        </div>
      </div>
      <PlayerDesignerPanel crew={crew} onUpdateCrew={onUpdateCrew} doctrineUnlocks={doctrineUnlocks} />
      <div className="panel tutorial-panel">
        <div className="button-cluster">
          <button className={`button ${squadReady ? "button-primary" : "button-secondary"}`} onClick={onContinue} disabled={!squadReady}>Continue to Training Briefing <ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}


export function StepBanner({ step, title, copy, danger = false }: { step: string; title: string; copy: string; danger?: boolean }) {
  return (
    <div className={`panel tutorial-step-banner ${danger ? "tutorial-step-banner-danger" : ""}`}>
      <div className="small-label">{step}</div>
      <div className="button-title" style={{ marginTop: 8 }}>{title}</div>
      <div className="small-copy" style={{ marginTop: 8 }}>{copy}</div>
    </div>
  );
}

export function TutorialCoachPanel({ title, body, bullets, nextStep, danger = false, whyItMatters, badOutcome, wrongInstinct }: { title: string; body: string; bullets: string[]; nextStep: string; danger?: boolean; whyItMatters?: string; badOutcome?: string; wrongInstinct?: string }) {
  return (
    <div className={`panel tutorial-panel tutorial-coach ${danger ? "tutorial-coach-danger" : ""}`}>
      <div className="eyebrow"><Radio size={14} /> Guided Advice //</div>
      <h2 className="panel-title">{title}</h2>
      <p className="panel-copy">{body}</p>
      <div className="three-col" style={{ marginTop: 12 }}>
        <div className="sub-panel">
          <div className="small-label">Why this matters</div>
          <div className="small-copy">{whyItMatters || body}</div>
        </div>
        <div className="sub-panel">
          <div className="small-label">What goes wrong if you ignore it</div>
          <div className="small-copy">{badOutcome || "The room gets a stronger vote, the clock gets worse, and the squad starts solving the wrong problem."}</div>
        </div>
        <div className="sub-panel">
          <div className="small-label">Common dumb instinct</div>
          <div className="small-copy">{wrongInstinct || "Picking the thing that sounds coolest instead of the thing that keeps the squad alive and moving."}</div>
        </div>
      </div>
      <div className="two-col" style={{ marginTop: 12 }}>
        <div className="sub-panel">
          <div className="small-label">What matters right now</div>
          <ul className="small-copy bullet-list">{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
        </div>
        <div className="sub-panel">
          <div className="small-label">Do this next</div>
          <div className="small-copy">{nextStep}</div>
        </div>
      </div>
    </div>
  );
}

export function CrewCard({ crew, selected, onSelect }: { crew: CrewMember; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className={`crew-card ${selected ? "crew-card-selected" : ""}`}>
      <div className="crew-head">
        <div>
          <div className="crew-title">{crew.name}</div>
          <div className="button-copy">{crew.role}</div>
        </div>
        <div className="tag-row">
          {crew.injured && <span className="tag tag-warning">Injured</span>}
          <span className={`tag ${familyTone(crew.family)}`}>{crew.family}</span>
        </div>
      </div>
      <div className="button-copy">{subtypeIconName(crew.breathType)} {crew.subtype} {crew.breathType} • {crew.breathShape}</div>
      <div className="button-copy">{crew.baseLoadout}</div>
      <div className="tag-row">
        {crew.gear.weapon && <span className="tag tag-neutral">W: {crew.gear.weapon.name}</span>}
        {crew.gear.mod && <span className="tag tag-neutral">M: {crew.gear.mod.name}</span>}
        {crew.gear.kit && <span className="tag tag-neutral">K: {crew.gear.kit.name}</span>}
      </div>
      <div className="meter-row">
        <span className="tag tag-neutral">HP {crew.hp}</span>
        <span className="tag tag-neutral">O₂ {crew.oxygen}</span>
        <span className="tag tag-neutral">Stress {crew.stress}</span>
        <span className="tag tag-neutral">{positionLabel(crew.position)}</span>
        <span className="tag tag-neutral">Scars {crew.scars}</span>
      </div>
    </button>
  );
}

export function MissionCard({ mission, onStart, unlocked, completed, unlockText, outcome, branchPreview }: { mission: MissionDefinition; onStart: (id: string) => void; unlocked: boolean; completed: boolean; unlockText: string; outcome: "success" | "partial" | "failure" | null; branchPreview?: string | null }) {
  return (
    <button className={`mission-card ${unlocked ? "" : "mission-card-locked"}`} onClick={() => unlocked && onStart(mission.id)}>
      <div className="mission-head">
        <div>
          <div className="small-label">{mission.type}</div>
          <div className="mission-title">{mission.title}</div>
        </div>
        <div className="tag-row">
          {completed && <div className="tag tag-complete">Completed</div>}
          {outcome && <div className={`tag ${outcomeTagClass(outcome)}`}>{missionResultLabel(outcome)}</div>}
          <div className="tag tag-neutral">{mission.difficulty}</div>
        </div>
      </div>
      <p className="small-copy">{mission.summary}</p>
      <div className="sub-panel small-copy">{unlocked ? mission.doctrine : unlockText}</div>
      {branchPreview && <div className="sub-panel small-copy">{branchPreview}</div>}
      <div className={`launch-row ${unlocked ? "text-good" : "text-muted"}`}>{unlocked ? "Launch mission" : "Locked route"} <ChevronRight size={14} /></div>
    </button>
  );
}

export function RouteChoice({ options, onChoose, pressureLabel, crew, ship }: { options: RouteOption[]; onChoose: (option: RouteOption) => void; pressureLabel: string; crew: CrewMember[]; ship: ShipState }) {
  return (
    <div className="two-col">
      {options.map((option) => {
        const resolved = resolveRouteOption(option, crew, ship);
        return (
          <button key={option.id} className="route-card" onClick={() => onChoose(option)}>
            <div className="route-head"><div className="button-title">{option.title}</div><ChevronRight size={18} className="text-muted" /></div>
            <div className="small-copy">{option.flavor}</div>
            {option.routeNeed && <div className="small-copy text-muted">Need: {option.routeNeed}</div>}
            {option.skillHooks && option.skillHooks.length > 0 && <div className="tag-row">{option.skillHooks.map((hook) => <span key={hook} className="tag tag-neutral">{hook}</span>)}</div>}
            <div className="sub-panel small-copy">{resolved.preview}</div>
            {resolved.detail && <div className={`small-copy ${resolved.matched ? "text-good" : "text-warn"}`}>{resolved.detail}</div>}
            <div className="tag-row">
              <span className="tag tag-neutral">Alert {resolved.alertDelta >= 0 ? `+${resolved.alertDelta}` : resolved.alertDelta}</span>
              <span className="tag tag-neutral">{pressureLabel} {resolved.pressureDelta >= 0 ? `+${resolved.pressureDelta}` : resolved.pressureDelta}</span>
              {(resolved.reward.salvage + resolved.reward.intel + resolved.reward.cores) > 0 && <span className="tag tag-neutral">Value S{resolved.reward.salvage}/I{resolved.reward.intel}/C{resolved.reward.cores}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function InterludePanel({ event, onResolve }: { event: InterludeEvent; onResolve: (event: InterludeEvent, choice: InterludeChoice) => void }) {
  return (
    <div className="panel">
      <div className="eyebrow"><Radio size={14} /> Campaign Interlude</div>
      <div className="sub-panel"><div className="small-label">{event.title}</div><div className="small-copy">{event.text}</div></div>
      <div className="two-col">
        {event.choices.map((choice) => <button key={choice.id} className="sub-button" onClick={() => onResolve(event, choice)}><div className="button-title">{choice.label}</div><div className="button-copy">{choice.desc}</div></button>)}
      </div>
    </div>
  );
}

export function RecoveryPanel({ crew, ship, onQuickRecovery, onFullRecovery }: { crew: CrewMember[]; ship: ShipState; onQuickRecovery: () => void; onFullRecovery: () => void }) {
  const injuredCount = crew.filter((member) => member.injured).length;
  const wornCount = crew.filter((member) => member.hp < member.maxHp || member.stress > 0).length;
  return (
    <div className="panel">
      <div className="eyebrow"><Cross size={14} /> Recovery Bay</div>
      <div className="two-col">
        <div className="sub-panel"><div className="small-label">Current Burden</div><div className="small-copy">{injuredCount} injured • {wornCount} worn down</div><div className="small-copy text-muted">Medbay rating: {ship.medbay}.</div></div>
        <div className="sub-panel"><div className="small-label">Recovery Rules</div><div className="small-copy text-muted">Quick recovery is free. Full recovery costs 1 salvage unless an interlude discounted it.</div></div>
      </div>
      <div className="two-col">
        <button className="sub-button" onClick={onQuickRecovery}><div className="button-title">Quick Recovery</div><div className="button-copy">Restore some HP and stress. Injuries remain.</div></button>
        <button className={`sub-button ${ship.salvage >= 1 || ship.temporaryOps.freeFullRecovery > 0 ? "sub-button-good" : "sub-button-disabled"}`} onClick={onFullRecovery}><div className="button-title">Full Recovery</div><div className="button-copy">Clear injuries, restore more HP, reduce more stress.</div></button>
      </div>
    </div>
  );
}

export function LoadoutPanel({ crew, ship, onEquip }: { crew: CrewMember[]; ship: ShipState; onEquip: (crewId: string, item: GearItem) => void }) {
  const equippedIds = new Set(crew.flatMap((member) => Object.values(member.gear).filter(Boolean).map((item) => item!.id)));
  const availableItems = ship.inventory.filter((item) => !equippedIds.has(item.id));
  return (
    <div className="panel">
      <div className="eyebrow"><Boxes size={14} /> Personal Loot / Loadouts</div>
      <div className="two-col">
        <div className="sub-panel">
          <div className="small-label">Inventory</div>
          <div className="stack">
            {ship.inventory.length === 0 ? <div className="text-muted">No recovered loot yet.</div> : ship.inventory.map((item) => <div key={item.id} className="inventory-item"><div className="button-title">{item.name}</div><div className="button-copy">{slotLabel(item.slot)} • {item.desc}</div></div>)}
          </div>
        </div>
        <div className="sub-panel">
          <div className="small-label">Equip to Squad</div>
          <div className="stack">
            {crew.map((member) => <div key={member.id} className="inventory-item"><div className="button-title">{member.name}</div><div className="tag-row"><span className="tag tag-neutral">Weapon: {member.gear.weapon?.name || "None"}</span><span className="tag tag-neutral">Mod: {member.gear.mod?.name || "None"}</span><span className="tag tag-neutral">Kit: {member.gear.kit?.name || "None"}</span></div><div className="tag-row">{availableItems.map((item) => <button key={`${member.id}-${item.id}`} className="mini-tag" onClick={() => onEquip(member.id, item)}>Equip {item.name}</button>)}</div></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlayerDesignerPanel({ crew, onUpdateCrew, doctrineUnlocks }: { crew: CrewMember[]; onUpdateCrew: (crewId: string, updates: Partial<Pick<CrewMember, "role" | "family" | "subtype" | "doctrineWeaponId" | "suitChassisId" | "moduleDoctrineId">>) => void; doctrineUnlocks: DoctrineUnlocks }) {
  const familyCounts = crew.reduce((acc, member) => ({ ...acc, [member.family]: (acc[member.family] || 0) + 1 }), {} as Record<string, number>);
  const roleCounts = crew.reduce((acc, member) => ({ ...acc, [member.role]: (acc[member.role] || 0) + 1 }), {} as Record<string, number>);
  const weaponCounts = crew.reduce((acc, member) => ({ ...acc, [member.doctrineWeaponId]: (acc[member.doctrineWeaponId] || 0) + 1 }), {} as Record<string, number>);
  const suitCounts = crew.reduce((acc, member) => ({ ...acc, [member.suitChassisId]: (acc[member.suitChassisId] || 0) + 1 }), {} as Record<string, number>);
  const moduleCounts = crew.reduce((acc, member) => ({ ...acc, [member.moduleDoctrineId]: (acc[member.moduleDoctrineId] || 0) + 1 }), {} as Record<string, number>);

  const unassignedCount = crew.filter((member) => member.role === "Unassigned" || member.family === "Unassigned" || member.subtype === "Unassigned").length;
  const uniqueAssignedRoles = Object.entries(roleCounts).filter(([role, count]) => role !== "Unassigned" && count > 0).length;
  const uniqueWeapons = Object.entries(weaponCounts).filter(([weaponId, count]) => weaponId !== "" && count > 0).length;
  const uniqueSuits = Object.entries(suitCounts).filter(([suitId, count]) => suitId !== "" && count > 0).length;

  const hasCrossingSuiting = Boolean((suitCounts.vector || 0) + (moduleCounts.mag_tether || 0) + (moduleCounts.grav_boots || 0) + (moduleCounts.burst_thrusters || 0));
  const hasSignalSuiting = Boolean((suitCounts.relay || 0) + (moduleCounts.signal_baffler || 0));
  const hasHazardSuiting = Boolean((suitCounts.containment || 0) + (moduleCounts.auto_seal || 0) + (moduleCounts.purge_injectors || 0));
  const hasHeavyAnswer = Boolean((weaponCounts.plasma || 0) + (weaponCounts.slug || 0) + (suitCounts.breach || 0));
  const hasHeatControl = Boolean((moduleCounts.heat_sink || 0) + (suitCounts.containment || 0) + (suitCounts.breach || 0));

  const checks = [
    { label: "Anchor / lane holder", pass: (roleCounts["Vanguard"] || 0) >= 1, why: "Someone has to survive the front and stop the room from moving the whole squad." },
    { label: "Signal reader / hacker", pass: (roleCounts["Signal Hacker"] || 0) >= 1, why: "Dead-zone missions punish teams that cannot read patterns, traps, or hostile logic." },
    { label: "Finisher / priority solver", pass: (roleCounts["Marksman"] || 0) >= 1, why: "The squad needs at least one operator who can solve a kill-first challenge fast." },
    { label: "Fixer / stabilizer", pass: (roleCounts["Engineer / Tech"] || 0) >= 1, why: "A squad without a fixer bleeds time, pressure, and mistakes." },
    { label: "Role spread", pass: uniqueAssignedRoles >= 3, why: "This campaign punishes squads that all try to solve the same problem the same way." },
    { label: "Crossing doctrine", pass: hasCrossingSuiting, why: "Vacuum crossings should get easier because somebody planned for them, not because the map went easy on you." },
    ...(doctrineUnlocks.stage >= 1 ? [{ label: "Signal doctrine", pass: hasSignalSuiting, why: "Once the site starts thinking harder, somebody needs to read and distort its logic war." }] : []),
    ...(doctrineUnlocks.stage >= 2 ? [{ label: "Hazard doctrine", pass: hasHazardSuiting, why: "Later rooms punish squads that still have no answer for leaks, contamination, and corrosive pressure." }] : []),
    ...(doctrineUnlocks.stage >= 2 ? [{ label: "Loadout spread", pass: uniqueWeapons >= 2 && uniqueSuits >= 2, why: "By now the expedition should be learning multiple answers, not repeating one field-kit recipe forever." }] : []),
    ...(doctrineUnlocks.stage >= 3 ? [{ label: "Heavy breach answer", pass: hasHeavyAnswer, why: "Late expeditions need at least one hard-answer loadout when finesse stops working." }] : []),
  ];

  const warnings: string[] = [];
  if ((roleCounts["Vanguard"] || 0) >= 3) warnings.push("Three or more Vanguards means the squad can hold a lane but may not actually solve the mission.");
  if ((roleCounts["Signal Hacker"] || 0) >= 2 && !(roleCounts["Vanguard"] || 0)) warnings.push("Two readers and no anchor means the squad may understand the problem perfectly while still dying to it.");
  if ((roleCounts["Marksman"] || 0) >= 2 && !(roleCounts["Engineer / Tech"] || 0)) warnings.push("Multiple finishers without a fixer tends to feel awesome until the map itself starts winning.");
  if (uniqueAssignedRoles <= 2 && unassignedCount === 0) warnings.push("This squad is too one-note. Family flavor does not replace missing jobs.");
  if (doctrineUnlocks.stage >= 2 && uniqueWeapons <= 1 && unassignedCount === 0) warnings.push("Weapon doctrine is too narrow. The campaign should start rewarding composed arsenals now.");
  if (doctrineUnlocks.stage >= 2 && uniqueSuits <= 1 && unassignedCount === 0) warnings.push("Suit doctrine is too narrow. The expedition should not still be wearing one answer for every room.");
  if (doctrineUnlocks.stage >= 3 && (weaponCounts.plasma || 0) >= 2 && !hasHeatControl) warnings.push("Multiple plasma picks without heat control means the squad may solve the room while setting the room on fire.");

  const score = checks.filter((check) => check.pass).length * 16 + (familyCounts.Metallic ? 4 : 0) + (familyCounts.Gem ? 4 : 0) + (familyCounts.Chromatic ? 4 : 0) - warnings.length * 10 - unassignedCount * 18;
  const verdict = unassignedCount > 0 ? "Not ready to deploy" : score >= 85 ? "Campaign-safe" : score >= 60 ? "Risky but workable" : "Likely ugly";

  const unlockedWeapons = WEAPON_FAMILIES.filter((entry) => doctrineUnlocks.weapons.includes(entry.id));
  const unlockedSuits = SUIT_CHASSIS.filter((entry) => doctrineUnlocks.suits.includes(entry.id));
  const unlockedModules = SUIT_MODULES.filter((entry) => doctrineUnlocks.modules.includes(entry.id));

  return (
    <div className="panel">
      <div className="eyebrow"><Users size={14} /> Guided Player Designer</div>
      <h2 className="panel-title">Build inside the campaign’s lanes</h2>
      <p className="panel-copy">This builder teaches jobs first and unlocks doctrine over time. Early crews get simpler field kit; broader and stranger tools unlock only after the expedition proves it can survive the basics.</p>
      <div className="two-col">
        <div className="sub-panel">
          <div className="small-label">Current doctrine unlock</div>
          <div className="tag-row" style={{ marginTop: 10 }}>
            <span className="tag tag-neutral">{doctrineUnlocks.label}</span>
            <span className="tag tag-neutral">Weapons {doctrineUnlocks.weapons.length}</span>
            <span className="tag tag-neutral">Suits {doctrineUnlocks.suits.length}</span>
            <span className="tag tag-neutral">Modules {doctrineUnlocks.modules.length}</span>
          </div>
          <div className="small-copy text-muted" style={{ marginTop: 10 }}>{doctrineUnlocks.summary}</div>
        </div>
        <div className="sub-panel">
          <div className="small-label">Why this matters</div>
          <ul className="small-copy bullet-list">
            <li>Early campaign should not let players blow up the station with doctrine they barely understand.</li>
            <li>As the expedition survives real runs, command trusts broader kit and expects more composed answers.</li>
            <li>Warnings should teach what matters now, not yell about tools the squad has not even unlocked yet.</li>
          </ul>
        </div>
      </div>
      <div className="two-col" style={{ marginTop: 12 }}>
        <div className="sub-panel">
          <div className="small-label">Squad fit verdict</div>
          <div className="tag-row" style={{ marginTop: 12 }}>
            <span className={`tag ${score >= 90 ? "tag-complete" : score >= 65 ? "tag-warning" : "tag-danger"}`}>{verdict}</span>
            <span className="tag tag-neutral">Score {Math.max(0, score)}/100</span>
            <span className="tag tag-neutral">Unique roles {uniqueAssignedRoles}</span>
            <span className="tag tag-neutral">Vanguards {roleCounts["Vanguard"] || 0}</span>
          </div>
          <div className="stack" style={{ marginTop: 12 }}>
            {checks.map((check) => <div key={check.label} className="inventory-item"><div className="button-title">{check.pass ? "✓" : "⚠"} {check.label}</div><div className={`button-copy ${check.pass ? "text-good" : "text-warn"}`}>{check.why}</div></div>)}
            {warnings.map((warning) => <div key={warning} className="inventory-item"><div className="button-title">⚠ Risk warning</div><div className="button-copy text-warn">{warning}</div></div>)}
            {unassignedCount > 0 && <div className="inventory-item"><div className="button-title">⚠ Unassigned operator slots</div><div className="button-copy text-warn">Finish assigning every slot before deployment. The app blocks mission launch if the squad is incomplete.</div></div>}
            {warnings.length === 0 && unassignedCount === 0 && <div className="inventory-item"><div className="button-title">✓ No major structural warning</div><div className="button-copy text-good">This squad has the baseline tools expected for the doctrine tier you have unlocked.</div></div>}
          </div>
        </div>
        <div className="sub-panel">
          <div className="small-label">What new players need to know</div>
          <ul className="small-copy bullet-list">
            <li><strong>Jobs come first.</strong> A fancy family or suit cannot replace a missing role.</li>
            <li><strong>Wings are control surfaces in vacuum.</strong> They help with bracing and bad movement, not free flight.</li>
            <li><strong>Early doctrine is intentionally narrow.</strong> You unlock stranger and riskier tools by surviving real sorties.</li>
            <li><strong>Later campaign should reward composed choices.</strong> Once the kit opens up, repeating one safe answer everywhere should start to hurt.</li>
          </ul>
        </div>
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        {crew.map((member) => {
          const familyOptions = FAMILY_BLUEPRINTS[member.family as keyof typeof FAMILY_BLUEPRINTS]?.subtypes || [];
          const roleData = ROLE_BLUEPRINTS[member.role as keyof typeof ROLE_BLUEPRINTS];
          const familyData = FAMILY_BLUEPRINTS[member.family as keyof typeof FAMILY_BLUEPRINTS];
          const subtypeData = SUBTYPE_BLUEPRINTS[member.subtype];
          return (
            <div key={member.id} className="inventory-item">
              <div className="crew-head">
                <div>
                  <div className="button-title">{member.name}</div>
                  <div className="button-copy">{member.role} • {member.family} • {member.subtype}</div>
                </div>
                <div className="tag-row">
                  <span className={`tag ${familyTone(member.family)}`}>{member.family}</span>
                  <span className="tag tag-neutral">{member.breathType} {member.breathShape}</span>
                </div>
              </div>
              <div className="three-col" style={{ marginTop: 12 }}>
                <label className="builder-field">
                  <span className="small-label">Role</span>
                  <select className="builder-select" value={member.role} onChange={(event) => onUpdateCrew(member.id, { role: event.target.value })}>
                    {Object.keys(ROLE_BLUEPRINTS).map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </label>
                <label className="builder-field">
                  <span className="small-label">Family</span>
                  <select className="builder-select" value={member.family} onChange={(event) => onUpdateCrew(member.id, { family: event.target.value })}>
                    {Object.keys(FAMILY_BLUEPRINTS).map((family) => <option key={family} value={family}>{family}</option>)}
                  </select>
                </label>
                <label className="builder-field">
                  <span className="small-label">Subtype</span>
                  <select className="builder-select" value={member.subtype} onChange={(event) => onUpdateCrew(member.id, { subtype: event.target.value })}>
                    {familyOptions.map((subtype) => <option key={subtype} value={subtype}>{subtype}</option>)}
                  </select>
                </label>
              </div>
              <div className="three-col" style={{ marginTop: 12 }}>
                <label className="builder-field">
                  <span className="small-label">Weapon doctrine</span>
                  <select className="builder-select" value={member.doctrineWeaponId} onChange={(event) => onUpdateCrew(member.id, { doctrineWeaponId: event.target.value })}>
                    {unlockedWeapons.map((weapon) => <option key={weapon.id} value={weapon.id}>{weapon.name}</option>)}
                  </select>
                </label>
                <label className="builder-field">
                  <span className="small-label">Suit chassis</span>
                  <select className="builder-select" value={member.suitChassisId} onChange={(event) => onUpdateCrew(member.id, { suitChassisId: event.target.value })}>
                    {unlockedSuits.map((suit) => <option key={suit.id} value={suit.id}>{suit.name}</option>)}
                  </select>
                </label>
                <label className="builder-field">
                  <span className="small-label">Core module</span>
                  <select className="builder-select" value={member.moduleDoctrineId} onChange={(event) => onUpdateCrew(member.id, { moduleDoctrineId: event.target.value })}>
                    {unlockedModules.map((module) => <option key={module.id} value={module.id}>{module.name}</option>)}
                  </select>
                </label>
              </div>
              <div className="two-col" style={{ marginTop: 12 }}>
                <div className="sub-panel">
                  <div className="small-label">Why this role exists</div>
                  <div className="button-copy text-muted">{roleData.why}</div>
                  <div className="button-copy text-muted" style={{ marginTop: 8 }}>Current doctrine pick: {WEAPON_FAMILIES.find((entry) => entry.id === member.doctrineWeaponId)?.name}. Current suit chassis: {SUIT_CHASSIS.find((entry) => entry.id === member.suitChassisId)?.name}.</div>
                  <WhyChip text={`${roleData.why} ${WEAPON_FAMILIES.find((entry) => entry.id === member.doctrineWeaponId)?.why || ""}`.trim()} tone="good" />
                </div>
                <div className="sub-panel">
                  <div className="small-label">Why this family / subtype fits</div>
                  <div className="button-copy text-muted">{familyData.why}</div>
                  <div className="button-copy text-muted" style={{ marginTop: 8 }}>{subtypeData?.why}</div>
                  <div className="button-copy text-muted" style={{ marginTop: 8 }}>Module logic: {SUIT_MODULES.find((entry) => entry.id === member.moduleDoctrineId)?.why}</div>
                  <WhyChip text={`${familyData.why} ${subtypeData?.why || ""} ${SUIT_MODULES.find((entry) => entry.id === member.moduleDoctrineId)?.why || ""}`.trim()} tone="good" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CampaignMapPanel(props: { routeIntel: { redglassVector: string | null; quarantineVector: string | null }; missionCatalog: Record<string, MissionDefinition>; missionUnlocked: (missionId: string) => boolean; completedMissionIds: Set<string>; hasBrokenChoirAccess: boolean; onStartMission: (missionId: string) => void; ship: ShipState }) {
  return (
    <>
      <div className="panel"><div className="eyebrow"><Play size={14} /> Campaign Map</div><h2 className="panel-title">Push deeper into abandoned Orc space</h2><p className="panel-copy">Early nodes teach dead-zone logic. Broken Choir only opens once the squad has both proof and usable route knowledge from how they solved the early sites.</p></div>
      <div className="panel">
        <div className="map-grid">
          {CAMPAIGN_MAP.map((node, index) => {
            const mission = props.missionCatalog[node.id];
            const unlocked = props.missionUnlocked(node.id);
            const completed = props.completedMissionIds.has(node.id);
            const extraText = node.id === "brokenchoir" ? props.hasBrokenChoirAccess ? `Access vectors confirmed: ${ROUTE_INTEL_TEXT[props.routeIntel.redglassVector!]} + ${ROUTE_INTEL_TEXT[props.routeIntel.quarantineVector!]}` : "Need one confirmed Redglass vector and one confirmed Vault 7 vector." : null;
            return (
              <div key={node.id} className="node-card">
                <div className="small-label">Depth {node.depth} • {node.zone}</div>
                <div className="node-title">{node.label}</div>
                <div className="tag-row"><span className={`tag ${completed ? "tag-complete" : unlocked ? "tag-neutral" : "tag-muted"}`}>{completed ? "Completed" : unlocked ? "Unlocked" : "Locked"}</span>{props.ship.missionOutcomes[node.id] && <span className={`tag ${outcomeTagClass(props.ship.missionOutcomes[node.id] || null)}`}>{missionResultLabel(props.ship.missionOutcomes[node.id] || null)}</span>}<span className="tag tag-neutral">{mission.type}</span></div>
                <div className="node-copy">{unlocked ? mission.short : node.unlockText}</div>
                {extraText && <div className="sub-panel small-copy">{extraText}</div>}
                {branchPreviewForMission(props.ship, node.id) && <div className="sub-panel small-copy">{branchPreviewForMission(props.ship, node.id)}</div>}
                {index < CAMPAIGN_MAP.length - 1 && <div className="lane-label"><MoveRight size={14} /> Deeper route</div>}
              </div>
            );
          })}
        </div>
        <div className="two-col">
          <div className="sub-panel"><div className="small-label">Current Route Intel</div><div className="stack small-copy"><div>{props.routeIntel.redglassVector ? ROUTE_INTEL_TEXT[props.routeIntel.redglassVector] : "No confirmed Redglass vector yet."}</div><div>{props.routeIntel.quarantineVector ? ROUTE_INTEL_TEXT[props.routeIntel.quarantineVector] : "No confirmed Vault 7 vector yet."}</div></div></div>
          <div className="sub-panel"><div className="small-label">DM Route Logic</div><div className="small-copy">Broken Choir should not unlock just because the squad checked boxes. They need usable deeper-path knowledge from what they learned on the early sites — and a squad healthy enough to survive what comes next.</div></div>
        </div>
      </div>
      <div className="three-col">{Object.values(props.missionCatalog).map((mission) => <MissionCard key={mission.id} mission={mission} onStart={props.onStartMission} unlocked={props.missionUnlocked(mission.id)} completed={props.completedMissionIds.has(mission.id)} unlockText={CAMPAIGN_MAP.find((node) => node.id === mission.id)?.unlockText || "Locked."} outcome={props.ship.missionOutcomes[mission.id] || null} branchPreview={branchPreviewForMission(props.ship, mission.id)} />)}</div>
    </>
  );
}

export function MissionBriefing({ mission, onStartMission, onAddPrep, tutorialGuide }: { mission: MissionDefinition; onStartMission: () => void; onAddPrep: () => void; tutorialGuide?: React.ReactNode }) {
  return (
    <div className="panel">
      <div className="eyebrow"><Play size={14} /> Mission Briefing</div>
      <h2 className="panel-title">{mission.title}</h2>
      <p className="panel-copy">{mission.summary}</p>
      {tutorialGuide}
      <div className="three-col">
        <div className="sub-panel"><div className="button-title"><Radio size={14} /> Objective</div><div className="small-copy">{mission.objective}</div></div>
        <div className="sub-panel"><div className="button-title"><Target size={14} /> Doctrine</div><div className="small-copy">{mission.doctrine}</div></div>
        <div className="sub-panel"><div className="button-title"><ScanLine size={14} /> Seal Clock</div><div className="small-copy">Mission clock: {mission.missionClockStart}. Once the squad breaks the seal and this clock expires, the level starts hitting back harder every beat.</div></div>
      </div>
      <div className="sub-panel"><div className="small-label">Guided briefing</div><ul className="small-copy bullet-list">{mission.playerGuidance.map((note) => <li key={note}>{note}</li>)}</ul></div>
      <div className="button-cluster"><button className="button button-primary" onClick={onStartMission}>Start Mission</button><button className="button button-secondary" onClick={onAddPrep}>Add Prep Note</button></div>
    </div>
  );
}

export function RouteBeat({ title, icon, copy, options, onChoose, pressureLabel, crew, ship, tutorialGuide }: { title: string; icon: React.ReactNode; copy: string; options: RouteOption[]; onChoose: (option: RouteOption, approach: { alertDelta: number; pressureDelta: number; reward: { salvage: number; intel: number; cores: number }; detailLog: string[] }) => void; pressureLabel: string; crew: CrewMember[]; ship: ShipState; tutorialGuide?: React.ReactNode }) {
  const resetApproachState = React.useCallback(() => ({
    performed: [] as string[],
    supportUsedIds: [] as string[],
    mods: { alertDelta: 0, pressureDelta: 0, reward: { salvage: 0, intel: 0, cores: 0 }, detailLog: [] as string[] },
    traversal: { progress: 0, stability: 0, exposure: 0, tethered: false, braced: false },
  }), []);

  const [selectedOptionId, setSelectedOptionId] = React.useState(options[0]?.id || "");
  const [selectedCrewId, setSelectedCrewId] = React.useState(crew[0]?.id || "");
  const [performed, setPerformed] = React.useState<string[]>([]);
  const [supportUsedIds, setSupportUsedIds] = React.useState<string[]>([]);
  const [mods, setMods] = React.useState({ alertDelta: 0, pressureDelta: 0, reward: { salvage: 0, intel: 0, cores: 0 }, detailLog: [] as string[] });
  const [traversal, setTraversal] = React.useState({ progress: 0, stability: 0, exposure: 0, tethered: false, braced: false });

  React.useEffect(() => {
    setSelectedOptionId(options[0]?.id || "");
    setSelectedCrewId(crew[0]?.id || "");
    const fresh = resetApproachState();
    setPerformed(fresh.performed);
    setSupportUsedIds(fresh.supportUsedIds);
    setMods(fresh.mods);
    setTraversal(fresh.traversal);
  }, [title, options, crew, resetApproachState]);

  const option = options.find((entry) => entry.id === selectedOptionId) || options[0];
  const operator = crew.find((member) => member.id === selectedCrewId) || crew[0];
  const supportCrew = crew.filter((member) => member.id !== selectedCrewId);
  const routeResolved = option ? resolveRouteOption(option, crew, ship) : null;
  const requiredSteps = 2;
  const stages = [
    { id: "seal", title: "Break Seal", copy: "Choose the angle of entry and keep the squad compact." },
    { id: "cross", title: "Cross Hazard", copy: "Drift, brace, read the timing, and do not flare your silhouette." },
    { id: "breach", title: "Breach Lane", copy: "Cut the route open without letting the room own your movement." },
    { id: "extract-side", title: "Secure Far Side", copy: "Only now is the obstacle actually solved." },
  ] as const;

  const exposureState = traversal.exposure <= 0 ? "Low" : traversal.exposure <= 2 ? "Manageable" : "Hot";
  const stabilityState = traversal.stability <= 0 ? "Shaky" : traversal.stability <= 2 ? "Controlled" : "Locked In";

  const applyApproachResult = React.useCallback((result: { alertDelta: number; pressureDelta: number; reward: { salvage: number; intel: number; cores: number }; stability: number; exposure: number; tethered?: boolean; braced?: boolean; log: string }, advance: number) => {
    setTraversal((prev) => ({
      progress: clamp(prev.progress + advance, 0, stages.length - 1),
      stability: clamp(prev.stability + (result.stability || 0), -2, 4),
      exposure: clamp(prev.exposure + (result.exposure || 0), -2, 5),
      tethered: prev.tethered || Boolean(result.tethered),
      braced: prev.braced || Boolean(result.braced),
    }));
    setMods((prev) => ({
      alertDelta: prev.alertDelta + result.alertDelta,
      pressureDelta: prev.pressureDelta + result.pressureDelta,
      reward: {
        salvage: prev.reward.salvage + (result.reward.salvage || 0),
        intel: prev.reward.intel + (result.reward.intel || 0),
        cores: prev.reward.cores + (result.reward.cores || 0),
      },
      detailLog: [...prev.detailLog, result.log],
    }));
  }, [stages.length]);

  const actions = [
    {
      id: "tether",
      label: "Anchor Tethers",
      desc: "Clip in before committing bodies to vacuum or broken footing.",
      advance: 0,
      run: () => {
        const matched = ship.tethers > 0 || operator.suitChassisId === "vector" || operator.moduleDoctrineId === "mag_tether" || operator.moduleDoctrineId === "grav_boots" || option?.skillHooks?.some((hook) => /tether|hull|drift|vacuum/i.test(hook));
        return {
          alertDelta: matched ? -1 : 0,
          pressureDelta: matched ? -1 : 1,
          reward: { salvage: 0, intel: 0, cores: 0 },
          stability: matched ? 2 : 1,
          exposure: matched ? -1 : 0,
          tethered: true,
          log: `${operator.name} clips the squad in before the crossing. ${matched ? "The line stays disciplined." : "It helps, but the route still hates this."}`,
        };
      },
    },
    {
      id: "read",
      label: "Read Sweep / Pattern",
      desc: "Time the crossing instead of guessing it.",
      advance: 1,
      run: () => {
        const matched = operator.role === "Signal Hacker" || operator.family === "Gem" || operator.suitChassisId === "relay" || operator.doctrineWeaponId === "laser" || operator.moduleDoctrineId === "signal_baffler" || ship.sensors > 1;
        return {
          alertDelta: matched ? -1 : 0,
          pressureDelta: matched ? 0 : 1,
          reward: { salvage: 0, intel: matched ? 1 : 0, cores: 0 },
          stability: matched ? 1 : 0,
          exposure: matched ? -1 : 0,
          log: `${operator.name} reads the sweep timing. ${matched ? "The dead zone loses a little of its surprise." : "The read is shaky, but still better than blind hope."}`,
        };
      },
    },
    {
      id: "brace",
      label: "Wing Brace / Collapse Profile",
      desc: "Use wings for braking, profile control, and not getting caught stupid.",
      advance: 1,
      run: () => {
        const matched = operator.family !== "Unassigned" && (operator.suitChassisId === "vector" || operator.moduleDoctrineId === "wing_lock" || operator.moduleDoctrineId === "grav_boots" || operator.suitChassisId === "breach");
        return {
          alertDelta: matched ? 0 : 1,
          pressureDelta: matched ? -1 : 0,
          reward: { salvage: 0, intel: 0, cores: 0 },
          stability: matched ? 1 : 0,
          exposure: matched ? -1 : 1,
          braced: true,
          log: `${operator.name} folds into a tighter crossing profile. ${matched ? "They move like someone who understands vacuum." : "It is clumsy, but still better than flaring out."}`,
        };
      },
    },
    {
      id: "override",
      label: "Manual Override / Cut Path",
      desc: "Hack, pry, or force a safer line through the obstacle.",
      advance: 1,
      run: () => {
        const matched = operator.role === "Engineer / Tech" || operator.role === "Signal Hacker" || operator.doctrineWeaponId === "coil" || operator.suitChassisId === "relay" || option?.skillHooks?.some((hook) => /override|manual|hack/i.test(hook));
        return {
          alertDelta: matched ? 0 : 1,
          pressureDelta: matched ? -1 : 0,
          reward: { salvage: matched ? 1 : 0, intel: 0, cores: 0 },
          stability: matched ? 1 : 0,
          exposure: matched ? 0 : 1,
          log: `${operator.name} cuts a route through the problem. ${matched ? "This is what they are here for." : "It works, but not cleanly."}`,
        };
      },
    },
    {
      id: "force",
      label: "Force It and Pray",
      desc: "Take the bad line fast and accept that the site gets a vote.",
      advance: 2,
      run: () => ({
        alertDelta: operator.doctrineWeaponId === "plasma" || operator.doctrineWeaponId === "slug" ? 1 : 0,
        pressureDelta: operator.doctrineWeaponId === "plasma" ? 2 : 1,
        reward: { salvage: operator.doctrineWeaponId === "plasma" ? 1 : 0, intel: 0, cores: 0 },
        stability: operator.suitChassisId === "breach" ? 0 : -1,
        exposure: operator.doctrineWeaponId === "plasma" ? 3 : 2,
        log: `${operator.name} punches through on nerve and momentum. It is fast. It is also how teams get chewed up later.`,
      }),
    },
  ];

  const supportActionForMember = (member: CrewMember) => {
    if (member.role === "Signal Hacker" || member.family === "Gem") {
      return {
        label: "Feed Timing",
        desc: "Call the rhythm and keep the lead from drifting blind.",
        advance: 1,
        run: () => ({
          alertDelta: -1,
          pressureDelta: 0,
          reward: { salvage: 0, intel: member.suitChassisId === "relay" || member.moduleDoctrineId === "signal_baffler" ? 2 : 1, cores: 0 },
          stability: 1,
          exposure: member.doctrineWeaponId === "laser" ? -2 : -1,
          log: `${member.name} feeds timing across comms and keeps ${operator.name} from crossing blind.`,
        }),
      };
    }
    if (member.role === "Engineer / Tech") {
      return {
        label: "Cut Support Route",
        desc: "Open a safer lane, clear snag points, and keep the geometry honest.",
        advance: 1,
        run: () => ({
          alertDelta: 0,
          pressureDelta: -1,
          reward: { salvage: member.doctrineWeaponId === "coil" ? 2 : 1, intel: 0, cores: 0 },
          stability: member.moduleDoctrineId === "auto_seal" ? 2 : 1,
          exposure: member.suitChassisId === "containment" ? -1 : 0,
          log: `${member.name} cuts a cleaner support route and keeps the crossing from becoming a body trap.`,
        }),
      };
    }
    if (member.role === "Vanguard" || member.family === "Metallic") {
      return {
        label: "Stabilize the Line",
        desc: "Hold the squad compact and stop panic movement from wrecking the crossing.",
        advance: 0,
        run: () => ({
          alertDelta: 0,
          pressureDelta: -1,
          reward: { salvage: 0, intel: 0, cores: 0 },
          stability: member.suitChassisId === "breach" ? 3 : 2,
          exposure: -1,
          tethered: true,
          log: `${member.name} stabilizes the line behind ${operator.name}, keeping the crossing disciplined instead of frantic.`,
        }),
      };
    }
    return {
      label: "Cover the Crossing",
      desc: "Keep the route from folding while the lead commits to the far side.",
      advance: 1,
      run: () => ({
        alertDelta: 0,
        pressureDelta: -1,
        reward: { salvage: 0, intel: 0, cores: 0 },
        stability: member.suitChassisId === "vector" ? 2 : 1,
        exposure: member.moduleDoctrineId === "grav_boots" ? -2 : -1,
        braced: member.family !== "Unassigned" || member.moduleDoctrineId === "wing_lock",
        log: `${member.name} covers the crossing and buys ${operator.name} a cleaner push to the far side.`,
      }),
    };
  };

  const performAction = (actionId: string) => {
    const action = actions.find((entry) => entry.id === actionId);
    if (!action || !option) return;
    const result = action.run();
    setPerformed((prev) => [...prev, actionId]);
    applyApproachResult(result, action.advance);
  };

  const performSupport = (member: CrewMember) => {
    if (supportUsedIds.includes(member.id)) return;
    const support = supportActionForMember(member);
    setSupportUsedIds((prev) => [...prev, member.id]);
    applyApproachResult(support.run(), support.advance);
  };

  const commitRoute = () => {
    if (!option) return;
    const traversalAlert = traversal.exposure >= 3 ? 1 : traversal.exposure <= -1 ? -1 : 0;
    const traversalPressure = (traversal.progress < stages.length - 1 ? 1 : 0) + (!traversal.tethered ? 1 : 0) + (traversal.stability <= 0 ? 1 : 0) - (traversal.stability >= 3 ? 1 : 0);
    const traversalIntel = traversal.stability >= 3 ? 1 : 0;
    const traversalLog = [
      `${operator.name} reaches ${stages[Math.min(traversal.progress, stages.length - 1)].title.toLowerCase()} on the obstacle track.`,
      `Crossing read: stability ${stabilityState.toLowerCase()} // exposure ${exposureState.toLowerCase()} // ${traversal.tethered ? "tethers clipped" : "untethered risk still live"}.`,
      supportUsedIds.length > 0 ? `Support committed: ${supportCrew.filter((member) => supportUsedIds.includes(member.id)).map((member) => member.name).join(", ")}.` : "No support operators committed to the crossing.",
    ];
    onChoose(option, {
      alertDelta: mods.alertDelta + traversalAlert,
      pressureDelta: mods.pressureDelta + traversalPressure,
      reward: {
        salvage: mods.reward.salvage,
        intel: mods.reward.intel + traversalIntel,
        cores: mods.reward.cores,
      },
      detailLog: [...mods.detailLog, ...traversalLog],
    });
  };

  const canCommit = (performed.length + supportUsedIds.length) >= requiredSteps && traversal.progress >= stages.length - 1;

  return (
    <div className="panel">
      <div className="eyebrow">{icon}{title}</div>
      <h2 className="panel-title">{title}</h2>
      <p className="panel-copy">{copy}</p>
      {tutorialGuide}
      <div className="two-col">
        <div className="stack">
          {options.map((entry) => {
            const resolved = resolveRouteOption(entry, crew, ship);
            return (
              <button key={entry.id} className={`route-card ${selectedOptionId === entry.id ? "crew-card-selected" : ""}`} onClick={() => {
                setSelectedOptionId(entry.id);
                const fresh = resetApproachState();
                setPerformed(fresh.performed);
                setSupportUsedIds(fresh.supportUsedIds);
                setMods(fresh.mods);
                setTraversal(fresh.traversal);
              }}>
                <div className="route-head"><div className="button-title">{entry.title}</div><ChevronRight size={18} className="text-muted" /></div>
                <div className="small-copy">{entry.flavor}</div>
                {entry.routeNeed && <div className="small-copy text-muted">Need: {entry.routeNeed}</div>}
                <div className="sub-panel small-copy">{resolved.preview}</div>
                <WhyChip text={resolved.detail || resolved.preview} tone={resolved.matched ? "good" : "warn"} />
              </button>
            );
          })}
        </div>
        <div className="stack">
          <div className="sub-panel route-obstacle-hero">
            <div className="small-label">Route obstacle // perform the crossing</div>
            <div className="button-title" style={{ marginTop: 8 }}>{option?.title}</div>
            <div className="small-copy text-muted" style={{ marginTop: 8 }}>Lead one operator through the obstacle, then commit support from the rest of the squad. You are not choosing an outcome; you are building a crossing the whole team can survive.</div>
            <label className="builder-field" style={{ marginTop: 12 }}>
              <span className="small-label">Lead operator</span>
              <select className="builder-select" value={selectedCrewId} onChange={(event) => {
                setSelectedCrewId(event.target.value);
                const fresh = resetApproachState();
                setPerformed(fresh.performed);
                setSupportUsedIds(fresh.supportUsedIds);
                setMods(fresh.mods);
                setTraversal(fresh.traversal);
              }}>
                {crew.map((member) => <option key={member.id} value={member.id}>{member.name} // {member.role}</option>)}
              </select>
            </label>
            <div className="tag-row" style={{ marginTop: 12 }}>
              <span className={`tag ${traversal.tethered ? "tag-good" : "tag-warning"}`}>{traversal.tethered ? "Tethered" : "Untethered"}</span>
              <span className={`tag ${traversal.braced ? "tag-blue" : "tag-neutral"}`}>{traversal.braced ? "Wing profile controlled" : "Wings still exposed"}</span>
              <span className="tag tag-neutral">{WEAPON_FAMILIES.find((entry) => entry.id === operator.doctrineWeaponId)?.name}</span>
              <span className="tag tag-neutral">{SUIT_CHASSIS.find((entry) => entry.id === operator.suitChassisId)?.name}</span>
              <span className="tag tag-neutral">Support committed {supportUsedIds.length}/{supportCrew.length}</span>
            </div>
          </div>

          <div className="three-col" style={{ marginTop: 12 }}>
            <div className="sub-panel">
              <div className="small-label">Why you would pick this route</div>
              <div className="small-copy">{routeResolved?.matched ? routeResolved.detail || routeResolved.preview : `Pick this if you want ${option?.flavor.toLowerCase()} and you are willing to accept a rougher crossing.`}</div>
            </div>
            <div className="sub-panel">
              <div className="small-label">What problem you are trying to avoid</div>
              <div className="small-copy">You are trying to avoid burning clock, exposing the squad, and starting the next room already off-balance.</div>
            </div>
            <div className="sub-panel">
              <div className="small-label">Why the lead matters</div>
              <div className="small-copy">{operator.name} is leading because their job and family change whether this crossing is disciplined, blind, or sloppy.</div>
            </div>
          </div>

          <div className="traversal-board">
            {stages.map((stage, index) => {
              const reached = index <= traversal.progress;
              const active = index === traversal.progress;
              return (
                <div key={stage.id} className={`traversal-step ${reached ? "traversal-step-reached" : ""} ${active ? "traversal-step-active" : ""}`}>
                  <div className="traversal-index">{index + 1}</div>
                  <div>
                    <div className="button-title">{stage.title}</div>
                    <div className="button-copy">{stage.copy}</div>
                  </div>
                  {active && <div className="traversal-token">{subtypeIconName(operator.breathType)} {operator.name}</div>}
                </div>
              );
            })}
          </div>

          <div className="three-col">
            <div className="sub-panel">
              <div className="small-label">Crossing stability</div>
              <div className="panel-title" style={{ fontSize: "1.2rem", marginTop: 8 }}>{stabilityState}</div>
              <div className="small-copy text-muted">Higher stability means the squad is solving the obstacle without starting the next room on its heels.</div>
            </div>
            <div className="sub-panel">
              <div className="small-label">Exposure</div>
              <div className="panel-title" style={{ fontSize: "1.2rem", marginTop: 8 }}>{exposureState}</div>
              <div className="small-copy text-muted">High exposure means the room gets a better look at the squad and the crossing gets louder or sloppier.</div>
            </div>
            <div className="sub-panel">
              <div className="small-label">Base route read</div>
              <div className="small-copy" style={{ marginTop: 8 }}>{routeResolved?.detail || routeResolved?.preview}</div>
            </div>
          </div>

          <div className="two-col route-action-grid">
            {actions.map((action) => (
              <button key={action.id} className={`sub-button ${performed.includes(action.id) ? "sub-button-disabled" : ""}`} disabled={performed.includes(action.id) || performed.length >= 3} onClick={() => performAction(action.id)}>
                <div className="route-action-head">
                  <div className="button-title">{action.label}</div>
                  <span className="mini-tag">Advance +{action.advance}</span>
                </div>
                <div className="button-copy">{action.desc}</div>
                <WhyChip text={action.id === "tether" ? "Forced movement kills careless squads faster than damage does." : action.id === "read" ? "Blind timing burns clock and gets people hurt." : action.id === "brace" ? "Wings are for control here, not flight." : action.id === "override" ? "A cleaner route is worth more than macho speed." : "Sometimes you take the bad line because the clock is worse."} tone={action.id === "force" ? "warn" : "good"} />
              </button>
            ))}
          </div>

          <div className="sub-panel">
            <div className="small-label">Squad support actions</div>
            <div className="route-support-grid" style={{ marginTop: 12 }}>
              {supportCrew.map((member) => {
                const support = supportActionForMember(member);
                const used = supportUsedIds.includes(member.id);
                return (
                  <button key={member.id} className={`sub-button ${used ? "sub-button-disabled" : "sub-button-good"}`} disabled={used} onClick={() => performSupport(member)}>
                    <div className="route-action-head">
                      <div className="button-title">{member.name}</div>
                      <span className="mini-tag">{member.role}</span>
                    </div>
                    <div className="button-copy" style={{ marginTop: 6 }}>{support.label}</div>
                    <div className="small-copy text-muted" style={{ marginTop: 6 }}>{support.desc}</div>
                    <WhyChip text={member.role === "Signal Hacker" || member.family === "Gem" ? "Somebody has to stop the lead from crossing blind." : member.role === "Engineer / Tech" ? "Somebody has to keep the route itself from betraying the squad." : member.role === "Vanguard" || member.family === "Metallic" ? "Somebody has to keep panic and bad movement from breaking formation." : "Extra eyes and pressure control make the crossing survivable."} tone="good" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sub-panel">
            <div className="small-label">Performed actions</div>
            {mods.detailLog.length === 0 ? <div className="small-copy text-muted">No approach actions performed yet.</div> : <ul className="small-copy bullet-list">{mods.detailLog.map((line) => <li key={line}>{line}</li>)}</ul>}
            <div className="tag-row" style={{ marginTop: 10 }}>
              <span className="tag tag-neutral">Approach Alert {mods.alertDelta >= 0 ? `+${mods.alertDelta}` : mods.alertDelta}</span>
              <span className="tag tag-neutral">Approach {pressureLabel} {mods.pressureDelta >= 0 ? `+${mods.pressureDelta}` : mods.pressureDelta}</span>
              {(mods.reward.salvage + mods.reward.intel + mods.reward.cores) > 0 && <span className="tag tag-neutral">Prep Value S{mods.reward.salvage}/I{mods.reward.intel}/C{mods.reward.cores}</span>}
            </div>
            <div className="button-cluster" style={{ marginTop: 12 }}>
              <button className={`button ${canCommit ? "button-primary" : "button-secondary"}`} disabled={!canCommit} onClick={commitRoute}>Cross the Obstacle</button>
            </div>
            {!canCommit && <div className="small-copy text-muted" style={{ marginTop: 10 }}>Get the lead to the far side and commit at least one more meaningful action from the squad before you call the crossing solved.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LaneBoard({ crew, units, selectedUnitId, setSelectedUnitId }: { crew: CrewMember[]; units: EnemyUnit[]; selectedUnitId: string; setSelectedUnitId: (id: string) => void }) {
  const groupedCrew = { front: crew.filter((member) => member.position === "front"), cover: crew.filter((member) => member.position === "cover"), back: crew.filter((member) => member.position === "back") };
  const groupedUnits = { front: units.filter((unit) => unit.targetBias === "front"), cover: units.filter((unit) => unit.targetBias === "cover"), back: units.filter((unit) => unit.targetBias === "back") };
  return (
    <div className="panel"><div className="eyebrow"><Target size={14} /> Tactical Lanes</div><div className="lane-board">{(["front", "cover", "back"] as const).map((lane) => <div key={lane} className="lane-card"><div className="small-label">{positionLabel(lane)}</div><div className="stack"><div className="micro-label">Squad</div>{groupedCrew[lane].length === 0 ? <div className="text-muted">No squad members here.</div> : groupedCrew[lane].map((member) => <div key={member.id} className="crew-chip"><div className="button-title">{member.name}</div><div className="button-copy">HP {member.hp}/{member.maxHp} • {member.injured ? "Injured" : "Stable"}</div></div>)}</div><div className="stack"><div className="micro-label">Hostile Pressure</div>{groupedUnits[lane].length === 0 ? <div className="text-muted">No hostile focus here.</div> : groupedUnits[lane].map((unit) => <button key={unit.id} className={`enemy-chip ${selectedUnitId === unit.id ? "enemy-chip-selected" : ""}`} onClick={() => setSelectedUnitId(unit.id)}><div className="button-title">{unit.name}</div><div className="button-copy">HP {unit.hp}/{unit.maxHp} • P{unit.priority} • {unit.intentText}</div></button>)}</div></div>)}</div></div>
  );
}

export function AftermathPanel({ mission, missionState, onNext, nextLabel = "Go to Ship / Upgrade Loop" }: { mission: MissionDefinition; missionState: MissionRuntimeState; onNext: () => void; nextLabel?: string }) {
  const tutorialFatality = mission.title.startsWith("Training Run //");
  const tutorialLessonSteps = [
    {
      id: "goal",
      kicker: "01 // What you actually won",
      title: "Combat was only the middle of the mission",
      body: "You did enough to take the core and open an extraction lane. That means the room was no longer the real boss. The job at that point was disciplined extraction.",
      actionLabel: "Show the correct call",
    },
    {
      id: "correct",
      kicker: "02 // The right call",
      title: "Reclip, collapse wings, move slow, leave alive",
      body: "The smart team would have treated the exit like a second encounter: re-anchor tethers, tuck wings, maintain spacing, and move the core out like survival mattered more than style.",
      actionLabel: "Show the bad decision",
    },
    {
      id: "mistake",
      kicker: "03 // The bad decision",
      title: "They tried to win the clock instead of the mission",
      body: "With adrenaline high and the seal clock closing, the squad chose speed over discipline. One operator cut a tether, opened their wings in the wrong wash, and tried to shave seconds instead of protecting the extract.",
      actionLabel: "Show the consequences",
    },
    {
      id: "consequence",
      kicker: "04 // Consequences",
      title: "Space punished the mistake faster than the room ever could",
      body: "The formation tears, one body spins wide, another clips the line late, and the whole team gets turned into debris and telemetry. They solved the fight. They failed the extract.",
      actionLabel: nextLabel,
    },
  ] as const;
  const [lessonIndex, setLessonIndex] = React.useState(0);
  const activeLesson = tutorialLessonSteps[lessonIndex];
  const advanceLesson = () => {
    if (!tutorialFatality) {
      onNext();
      return;
    }
    if (lessonIndex < tutorialLessonSteps.length - 1) {
      setLessonIndex((prev) => prev + 1);
      return;
    }
    onNext();
  };
  return (
    <div className="panel aftermath-panel">
      <div className="eyebrow"><FileText size={14} /> Aftermath</div>
      <h2 className="panel-title">{tutorialFatality ? "Training Debrief // Squad Lost" : missionResultLabel(missionState.outcome)}</h2>
      <p className="panel-copy">{tutorialFatality ? "The training run now walks you through the exact mistake that killed the squad, so the lesson is about cause and effect instead of cheap surprise." : missionState.failureReason || "The squad got out and the campaign moves."}</p>

      {tutorialFatality && (
        <div className="tutorial-fatality-scene">
          <div className="tutorial-fatality-hero">
            <div className="eyebrow"><AlertTriangle size={14} /> Fatal Lesson //</div>
            <div className="panel-title" style={{ marginTop: 10 }}>You survived the room. Space killed you anyway.</div>
            <div className="panel-copy" style={{ marginTop: 10 }}>
              This training death is not random. It is a short post-combat chain that teaches the real priority of the campaign: extract alive with the objective. Winning the fight is not the same thing as finishing the mission.
            </div>
          </div>
          <div className="tutorial-fatality-progress">
            {tutorialLessonSteps.map((step, index) => (
              <div key={step.id} className={`tutorial-progress-chip ${index === lessonIndex ? "tutorial-progress-chip-active" : index < lessonIndex ? "tutorial-progress-chip-complete" : ""}`}>
                {index + 1}
              </div>
            ))}
          </div>
          <div className="tutorial-fatality-lesson-wrap">
            <div className={`sub-panel tutorial-fatality-lesson ${activeLesson.id === "mistake" ? "tutorial-fatality-step-warning" : activeLesson.id === "consequence" ? "tutorial-fatality-step-danger" : ""}`}>
              <div className="small-label">{activeLesson.kicker}</div>
              <div className="button-title">{activeLesson.title}</div>
              <div className="small-copy">{activeLesson.body}</div>
            </div>
            <div className="two-col tutorial-decision-grid">
              <div className="sub-panel tutorial-decision-card tutorial-decision-card-good">
                <div className="small-label">Correct doctrine</div>
                <div className="button-title">Protect the extract</div>
                <ul className="small-copy bullet-list">
                  <li>Re-anchor tethers before crossing open vacuum.</li>
                  <li>Tuck wings and move like staying alive is the objective.</li>
                  <li>Leave with the core instead of trying to look fast or heroic.</li>
                </ul>
              </div>
              <div className="sub-panel tutorial-decision-card tutorial-decision-card-bad">
                <div className="small-label">The bad call they made</div>
                <div className="button-title">Shave seconds, break formation</div>
                <ul className="small-copy bullet-list">
                  <li>Cut a tether because the room looked solved.</li>
                  <li>Open wings in bad wash to brake or drift faster.</li>
                  <li>Treat the clock like the enemy instead of vacuum discipline.</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="tutorial-fatality-warning">
            <div className="small-label">Real lesson</div>
            <div className="small-copy">The campaign goal is not “win combat.” The goal is “extract alive with the objective before the dead zone and space punish your mistakes.” Combat is just one part of that.</div>
          </div>
        </div>
      )}

      <div className="three-col">
        <div className="sub-panel">
          <div className="button-title">Recovered</div>
          <ul className="small-copy bullet-list">
            <li>{missionState.resolutionRewards.salvage} salvage</li>
            <li>{missionState.resolutionRewards.intel} intel</li>
            <li>{missionState.resolutionRewards.cores} core value</li>
          </ul>
        </div>
        <div className="sub-panel">
          <div className="button-title">What Changed</div>
          <ul className="small-copy bullet-list">
            <li>{mission.weirdness}</li>
            <li>{tutorialFatality ? "The tutorial ends with a fatal extraction mistake even if you solved the room correctly." : missionState.outcome === "failure" ? "The node remains unresolved, but route intel and scars remain." : missionState.outcome === "partial" ? "The objective mattered, but the extraction was ugly." : "The squad left with a believable win."}</li>
            <li>The ship now carries the consequences into the next run.</li>
          </ul>
        </div>
        <div className="sub-panel">
          <div className="button-title">Campaign Movement</div>
          <ul className="small-copy bullet-list">
            <li>{tutorialFatality ? "Training run clears onboarding, but does not mark the real node complete." : missionState.outcome === "failure" ? "Mission not marked complete." : "Mission progress sticks."}</li>
            <li>Route knowledge remains where earned.</li>
            <li>{tutorialFatality ? "The real squad starts after this lesson. The training deaths do not poison the real campaign." : "The squad may now be carrying real injuries home."}</li>
          </ul>
        </div>
      </div>
      <div className="right-row"><button className="button button-primary" onClick={advanceLesson}>{tutorialFatality ? activeLesson.actionLabel : nextLabel}</button></div>
    </div>
  );
}

export function ShipPanel({ ship, chosenUpgrade, tryUpgrade, goHub, upgrades }: { ship: ShipState; chosenUpgrade: string | null; tryUpgrade: (upgrade: any) => void; goHub: () => void; upgrades: any[] }) {
  const Pill = ({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number }>; label: string; value: number | string }) => <div className="resource-pill"><div className="resource-label"><Icon size={14} /> {label}</div><div className="resource-value">{value}</div></div>;
  return (
    <div className="panel"><div className="eyebrow"><ShipWheel size={14} /> Ship / Meta Loop</div><h2 className="panel-title">{ship.name}</h2><p className="panel-copy">Every successful run turns the squad from desperate raiders into a force able to go deeper into abandoned Orc space.</p><div className="stats-grid"><Pill icon={ShipWheel} label="Hull" value={ship.hull} /><Pill icon={ScanLine} label="Sensors" value={ship.sensors} /><Pill icon={MoveRight} label="Tethers" value={ship.tethers} /><Pill icon={Cross} label="Medbay" value={ship.medbay} /><Pill icon={Cpu} label="Reactor" value={ship.reactor} /></div><div className="three-col">{upgrades.map((upgrade) => { const canBuy = ship.salvage >= (upgrade.cost.salvage || 0) && ship.intel >= (upgrade.cost.intel || 0) && ship.cores >= (upgrade.cost.cores || 0); return <button key={upgrade.id} className={`sub-button ${canBuy ? "" : "sub-button-disabled"}`} onClick={() => canBuy && tryUpgrade(upgrade)}><div className="mission-head"><div className="button-title">{upgrade.title}</div>{chosenUpgrade === upgrade.id && <div className="tag tag-complete">Purchased</div>}</div><div className="button-copy">{upgrade.desc}</div><div className="tag-row">{upgrade.cost.salvage ? <span className="tag tag-neutral">Salvage {upgrade.cost.salvage}</span> : null}{upgrade.cost.intel ? <span className="tag tag-neutral">Intel {upgrade.cost.intel}</span> : null}{upgrade.cost.cores ? <span className="tag tag-neutral">Cores {upgrade.cost.cores}</span> : null}</div></button>; })}</div><div className="right-row"><button className="button button-primary" onClick={goHub}>Return to Campaign Map</button></div></div>
  );
}

export function Sidebar({ crew, selectedCrew, onSelectCrew, logs, ship, dmMode, missionState, pushLog, setMissionState }: { crew: CrewMember[]; selectedCrew: CrewMember; onSelectCrew: (id: string) => void; logs: string[]; ship: ShipState; dmMode: boolean; missionState: MissionRuntimeState; pushLog: (text: string) => void; setMissionState: React.Dispatch<React.SetStateAction<MissionRuntimeState>> }) {
  return (
    <div className="stack-large"><div className="panel"><div className="eyebrow"><Users size={14} /> Squad</div><div className="stack">{crew.map((member) => <CrewCard key={member.id} crew={member} selected={member.id === selectedCrew.id} onSelect={() => onSelectCrew(member.id)} />)}</div><div className="sub-panel"><div className="button-title"><Activity size={14} /> Selected Operator</div><div className="small-copy">{selectedCrew.name} is a {selectedCrew.subtype} {selectedCrew.family} {selectedCrew.role.toLowerCase()} using {selectedCrew.baseLoadout}. {selectedCrew.familyText}</div></div></div><div className="panel"><div className="eyebrow"><FileText size={14} /> Mission Log</div><div className="log-list">{logs.map((log, index) => <div key={index} className="log-entry">{log}</div>)}</div></div><div className="panel"><div className="eyebrow"><ShipWheel size={14} /> Campaign State</div><div className="three-col"><div className="resource-pill"><div className="resource-label"><Package size={14} /> Salvage</div><div className="resource-value">{ship.salvage}</div></div><div className="resource-pill"><div className="resource-label"><FileText size={14} /> Intel</div><div className="resource-value">{ship.intel}</div></div><div className="resource-pill"><div className="resource-label"><Cpu size={14} /> Cores</div><div className="resource-value">{ship.cores}</div></div></div><div className="sub-panel"><div className="small-label">Route Intel</div><div className="stack small-copy"><div>{ship.routeIntel.redglassVector ? ROUTE_INTEL_TEXT[ship.routeIntel.redglassVector] : "No confirmed Redglass vector."}</div><div>{ship.routeIntel.quarantineVector ? ROUTE_INTEL_TEXT[ship.routeIntel.quarantineVector] : "No confirmed Vault 7 vector."}</div></div></div><div className="sub-panel"><div className="small-label">Crew Condition</div><div className="stack small-copy">{crew.map((member) => <div key={member.id}>{member.name}: {member.hp}/{member.maxHp} HP • Stress {member.stress} • {member.injured ? "Injured" : "Stable"} • Scars {member.scars}</div>)}</div></div><div className="sub-panel"><div className="small-label">Loot Inventory</div><div className="stack small-copy">{ship.inventory.length === 0 ? <div>No recovered loot yet.</div> : ship.inventory.map((item) => <div key={item.id}>{item.name} • {slotLabel(item.slot)} • {item.desc}</div>)}</div></div><div className="sub-panel"><div className="small-label">Temporary Ops Effects</div><div className="stack small-copy"><div>Next mission alert mod: {ship.temporaryOps.nextMissionAlertMod}</div><div>Next mission pressure mod: {ship.temporaryOps.nextMissionPressureMod}</div><div>Free full recoveries: {ship.temporaryOps.freeFullRecovery}</div></div></div><div className="sub-panel"><div className="small-label">Recent Runs</div>{ship.campaignHistory.length === 0 ? <div className="text-muted">No completed runs yet.</div> : <div className="stack">{ship.campaignHistory.slice(0,3).map((entry,index) => <div key={`${entry.title}-${index}`} className="inventory-item"><div className="button-title">{entry.title}</div><div className="button-copy">{entry.result} • Alert {entry.alert} • Pressure {entry.pressure}</div></div>)}</div>}</div></div>{dmMode && <DmDrawer activeScreen={missionState.screen} missionState={missionState} pushLog={pushLog} setMissionState={setMissionState} />}</div>
  );
}

export function DmDrawer({ activeScreen, missionState, pushLog, setMissionState }: { activeScreen: string; missionState: MissionRuntimeState; pushLog: (text: string) => void; setMissionState: React.Dispatch<React.SetStateAction<MissionRuntimeState>> }) {
  return <div className="panel"><div className="eyebrow"><Eye size={14} /> DM Control Layer</div><div className="sub-panel"><div className="small-label">Hidden Truth</div><div className="small-copy">{missionState.hiddenTruths?.[activeScreen] || "The dead zone reacts with coherence before it explains itself."}</div></div><div className="two-col"><button className="sub-button" onClick={() => setMissionState((prev) => ({ ...prev, alert: Math.min(4, prev.alert + 1) }))}>Raise Alert</button><button className="sub-button" onClick={() => setMissionState((prev) => ({ ...prev, alert: Math.max(0, prev.alert - 1) }))}>Reduce Alert</button><button className="sub-button" onClick={() => setMissionState((prev) => ({ ...prev, pressure: Math.min(10, prev.pressure + 1) }))}>Raise Pressure</button><button className="sub-button" onClick={() => setMissionState((prev) => ({ ...prev, pressure: Math.max(0, prev.pressure - 1) }))}>Reduce Pressure</button></div><button className="sub-button sub-button-danger" onClick={() => { setMissionState((prev) => ({ ...prev, alert: 4, anomalySeen: true, pressure: Math.min(10, prev.pressure + 2) })); pushLog("A sealed lower sector opens for a few seconds. The feed catches impossible movement behind fogged containment glass."); }}>Force Catastrophic Anomaly</button></div>;
}
