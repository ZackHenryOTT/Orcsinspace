import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Cpu, DoorOpen, Gauge, Link2, ScanLine, Target, Wind } from "lucide-react";
import {
  DEFAULT_MISSION_STATE,
  INTERLUDE_EVENTS,
  LOOT_TABLE,
  MISSION_CATALOG,
  ROUTE_INTEL_TEXT,
  SHIP_UPGRADES,
  STARTING_CREW,
  alertLabel,
  branchModsForMission,
  buildEncounterUnits,
  clamp,
  createDefaultAppState,
  deepClone,
  gearAttackBonus,
  findSuitChassis,
  findSuitModule,
  findWeaponFamily,
  getDoctrineUnlocks,
  normalizeCrewForDoctrineUnlocks,
  rebuildCrewMember,
  suggestedTrainingCrew,
  type AppState,
  type CrewMember,
  type EnemyUnit,
  type GearItem,
  type InterludeChoice,
  type InterludeEvent,
  type MissionDefinition,
  type Outcome,
  type Position,
  resolveRouteOption,
  subtypeIconName,
} from "./gameData";
import {
  AftermathPanel,
  CampaignMapPanel,
  InterludePanel,
  PlayerDesignerPanel,
  LoadoutPanel,
  MissionBriefing,
  RecoveryPanel,
  RouteBeat,
  ShipPanel,
  Sidebar,
  TopBar,
  TutorialStartPanel,
  TutorialBuilderPanel,
  TutorialCoachPanel,
  StepBanner,
  WhyChip,
  EquipmentDoctrinePanel,
} from "./components";
import { MulticlientFoundation } from "./multiclient";
import {
  clearPersistedAppState,
  downloadAppState,
  importAppStateFromFile,
  loadPersistedAppState,
  normalizeAppState,
  persistAppState,
} from "./persistence";

type EncounterEnvironment = {
  label: string;
  summary: string;
  wingRule: string;
  tetherRule: string;
  ventCharges: number;
  ventDamage: number;
};

type EnemyTurnResult = {
  crew: CrewMember[];
  units: EnemyUnit[];
  alert: number;
  pressure: number;
  tetheredIds: string[];
  bracedIds: string[];
  breachLane: Position | null;
  breachTurns: number;
  selectedUnitId: string;
  resolved: boolean;
};

function encounterEnvironmentForMission(missionId: string): EncounterEnvironment {
  switch (missionId) {
    case "redglass":
    case "training_redglass":
      return {
        label: "Hard Vacuum Hull Ring",
        summary: "Movement is commitment. Drift, silhouette, and decompression are part of the fight.",
        wingRule: "Wings do not fly here. They help you brake, brace, and ruin your stealth if you get careless.",
        tetherRule: "Untethered operators can be dragged, shifted, or punished by vacuum plays.",
        ventCharges: 2,
        ventDamage: 2,
      };
    case "quarantine7":
      return {
        label: "Cycling Pressure Envelope",
        summary: "This room keeps trying to decide whether it is a sterile lab or a dying station.",
        wingRule: "Wing-bracing matters when purge pressure changes hit mid-fight.",
        tetherRule: "Tethers stabilize bodies when doors cycle and beams sweep weirdly.",
        ventCharges: 1,
        ventDamage: 2,
      };
    default:
      return {
        label: "Ruptured Signal Cathedral",
        summary: "Broken Choir is all about cracked geometry, partial atmosphere, and selective decompression.",
        wingRule: "Wings help you catch yourself and keep formation from collapsing when the room breaks open.",
        tetherRule: "Tethers stop forced movement and keep the room from solving your squad for you.",
        ventCharges: 2,
        ventDamage: 3,
      };
  }
}

function moveTowardBias(position: Position, targetBias: Position): Position {
  if (targetBias === "cover") return "cover";
  if (targetBias === "front") return position === "back" ? "cover" : "front";
  return position === "front" ? "cover" : "back";
}

function moveAwayFromLane(position: Position, lane: Position): Position {
  if (lane === "cover") return position === "front" ? "front" : "back";
  if (lane === "front") return position === "front" ? "cover" : position;
  return position === "back" ? "cover" : position;
}

function livingSelectedUnitId(units: EnemyUnit[], preferredId: string): string {
  const living = units.filter((unit) => unit.hp > 0);
  if (living.some((unit) => unit.id === preferredId)) return preferredId;
  return living[0]?.id || preferredId;
}

function enemySigil(unit: EnemyUnit): string {
  if (unit.tags.includes("Priority Kill")) return "✦";
  if (unit.tags.includes("Signal")) return "◉";
  if (unit.tags.includes("Bile")) return "☣";
  if (unit.tags.includes("Drone")) return "◈";
  if (unit.tags.includes("Swarm")) return "⫷";
  if (unit.tags.includes("Command")) return "⌘";
  return "◆";
}

function resolveSealClockStep(currentClock: number | null, currentExpired: boolean, baseAlert: number, basePressure: number, label: string) {
  if (currentClock === null) {
    return { sealClock: null as number | null, clockExpired: currentExpired, alert: baseAlert, pressure: basePressure, log: null as string | null };
  }
  const nextClock = Math.max(0, currentClock - 1);
  if (!currentExpired && nextClock === 0) {
    return {
      sealClock: nextClock,
      clockExpired: true,
      alert: clamp(baseAlert + 1, 0, 4),
      pressure: clamp(basePressure + 2, 0, 10),
      log: `Seal clock expires during ${label}. The room wakes up and starts hitting back harder.`,
    };
  }
  if (currentExpired) {
    return {
      sealClock: nextClock,
      clockExpired: true,
      alert: clamp(baseAlert + 1, 0, 4),
      pressure: clamp(basePressure + 1, 0, 10),
      log: `Post-expiry escalation tightens the room during ${label}.`,
    };
  }
  return { sealClock: nextClock, clockExpired: false, alert: baseAlert, pressure: basePressure, log: null as string | null };
}

function enemyThreatLabel(unit: EnemyUnit): string {
  if (unit.tags.includes("Priority Kill")) return "Kill First";
  if (unit.tags.includes("Signal")) return "Escalates Pressure";
  if (unit.tags.includes("Bile")) return "Breaks Cover";
  if (unit.tags.includes("Route")) return "Forces Movement";
  if (unit.tags.includes("Swarm")) return "Mass Pressure";
  return unit.role;
}

function rollInitiativeOrder(crew: CrewMember[]): string[] {
  const roleWeight: Record<string, number> = {
    Vanguard: 3,
    "Signal Hacker": 2,
    Marksman: 4,
    "Engineer / Tech": 2,
    Unassigned: 0,
  };
  const familyWeight: Record<string, number> = {
    Metallic: 1,
    Chromatic: 2,
    Gem: 2,
    Unassigned: 0,
  };
  return crew
    .filter((member) => member.hp > 0)
    .map((member) => ({
      id: member.id,
      score:
        (roleWeight[member.role] || 0) +
        (familyWeight[member.family] || 0) +
        Math.floor(Math.random() * 6) + 1 -
        Math.floor(member.stress / 2) -
        (member.injured ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.id);
}

function TacticalBoard({
  crew,
  setCrew,
  encounter,
  mission,
  ship,
  alert,
  pressure,
  setAlertPressure,
  pushLog,
  onResolveMission,
  sealClock,
  clockExpired,
  onSealState,
}: {
  crew: CrewMember[];
  setCrew: React.Dispatch<React.SetStateAction<CrewMember[]>>;
  encounter: MissionDefinition["encountersByAlert"][number];
  mission: MissionDefinition;
  ship: { tethers: number };
  alert: number;
  pressure: number;
  setAlertPressure: (alert: number, pressure: number) => void;
  pushLog: (text: string) => void;
  onResolveMission: (outcome: Outcome, reason: string) => void;
  sealClock: number | null;
  clockExpired: boolean;
  onSealState: (clock: number | null, expired: boolean) => void;
}) {
  const environment = useMemo(() => encounterEnvironmentForMission(mission.id), [mission.id]);
  const [units, setUnits] = useState<EnemyUnit[]>(() => buildEncounterUnits(encounter));
  const [selectedCrewId, setSelectedCrewId] = useState(crew[0]?.id || STARTING_CREW[0].id);
  const [selectedUnitId, setSelectedUnitId] = useState(() => buildEncounterUnits(encounter)[0]?.id || "");
  const [weaponCycle, setWeaponCycle] = useState(0);
  const [breathSpentIds, setBreathSpentIds] = useState<string[]>([]);
  const [usedJammer, setUsedJammer] = useState(false);
  const [usedAnchor, setUsedAnchor] = useState(false);
  const [ignoredInjuryIds, setIgnoredInjuryIds] = useState<string[]>([]);
  const [tetheredIds, setTetheredIds] = useState<string[]>([]);
  const [bracedIds, setBracedIds] = useState<string[]>([]);
  const [ventCharges, setVentCharges] = useState(environment.ventCharges);
  const [breachLane, setBreachLane] = useState<Position | null>(null);
  const [breachTurns, setBreachTurns] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [initiativeOrder, setInitiativeOrder] = useState<string[]>(() => rollInitiativeOrder(crew));
  const [turnIndex, setTurnIndex] = useState(0);
  const [turnClock, setTurnClock] = useState(12);

  const activeTurnCrewId = initiativeOrder.filter((id) => crew.some((member) => member.id === id && member.hp > 0))[turnIndex] || crew.find((member) => member.hp > 0)?.id || crew[0]?.id;
  const active = crew.find((member) => member.id === activeTurnCrewId) || crew.find((member) => member.hp > 0) || crew[0];
  const livingUnits = units.filter((unit) => unit.hp > 0);
  const targetUnit = livingUnits.find((unit) => unit.id === selectedUnitId) || livingUnits[0];
  const actingUnit = [...livingUnits].sort((a, b) => b.priority - a.priority)[0];
  const tutorialMode = mission.title.startsWith("Training Run //");
  const priorityTarget = livingUnits.find((unit) => unit.tags.includes("Priority Kill"));
  const needsTetherLesson = tutorialMode && tetheredIds.length === 0;
  const needsPriorityLesson = tutorialMode && !needsTetherLesson && Boolean(priorityTarget);
  const wrongPriorityTarget = needsPriorityLesson && targetUnit && !targetUnit.tags.includes("Priority Kill");
  const needsExtractLesson = tutorialMode && !needsTetherLesson && !needsPriorityLesson && (clockExpired || (sealClock !== null && sealClock <= 1) || pressure >= 8);
  const tutorialEncounterGuide = needsTetherLesson
    ? {
        step: "Step 5 // Don’t get blown into a wall",
        title: "Anchor someone before you do anything clever",
        body: "This fight starts with a vacuum lesson. Until somebody clips in, the room can shove bodies around and punish dumb positioning.",
        whyItMatters: "Players need to learn that survival tools come before damage tools in vacuum. A tether prevents the room from deciding movement for you.",
        badOutcome: "If they skip the tether, forced movement and bad drift turn one small mistake into a dead operator or broken formation.",
        wrongInstinct: "Opening with a cool attack instead of first securing the squad against vacuum and lane movement.",
        bullets: [
          "Use Anchor Tether first.",
          "Wings help brake and brace, but they do not replace being clipped in.",
          "Once someone is tethered, you can start solving the actual fight.",
        ],
        nextStep: "Select an operator and hit Anchor Tether.",
        danger: false,
      }
    : needsPriorityLesson
      ? {
          step: "Step 6 // Kill the real problem first",
          title: "This is the priority target lesson",
          body: "The room wants you shooting the wrong thing. The marked threat is the reason this fight gets uglier if you let it live.",
          bullets: [
            `Priority target: ${priorityTarget?.name || "Marked threat"}.`,
            "Do not waste your first real hit on filler pressure if a kill-first challenge is still active.",
            "If needed, reselect the target card before attacking.",
          ],
          nextStep: `Target ${priorityTarget?.name || "the marked threat"} and hit it with Attack, Role Ability, or Breath.`,
          danger: true,
        }
      : needsExtractLesson
        ? {
            step: "Step 7 // Stop pretending you have forever",
            title: "The seal clock is the real boss now",
            body: "You took too long or the room is already turning. This is where the campaign teaches extraction over ego.",
            whyItMatters: "Players need to learn that leaving ugly is still a win if staying means the room gets to finish solving them.",
            badOutcome: "If they stay to make the board look cleaner, the clock and pressure will bury them after the important work is already done.",
            wrongInstinct: "Trying to turn a successful run into a perfect run after the mission has already become hostile to that idea.",
            bullets: [
              "If you can finish the problem fast, do it now.",
              "If not, hit Emergency Extract and leave with something.",
              "Dead-zone wins are often ugly. Ugly is still better than dead.",
            ],
            nextStep: "Either end the threat immediately or Emergency Extract before the room owns the run.",
            danger: true,
          }
        : tutorialMode
          ? {
              step: "Step 8 // Control the room, then leave",
              title: "Now play the mission, not the tutorial prompt",
              body: "You’ve seen the important lessons. Keep the formation stable, solve the actual threat, and don’t get sentimental about staying too long.",
              whyItMatters: "The campaign rewards disciplined squads that solve the mission and leave, not squads that mistake survival horror for a clean-room puzzle.",
              badOutcome: "Once players start improvising for style instead of for survival, the dead zone gets exactly the mistakes it wants.",
              wrongInstinct: "Thinking the tutorial is over so normal caution no longer matters.",
              bullets: [
                "Keep pressure under control.",
                "Use role tools before panic damage if the room is getting away from you.",
                "Extraction matters more than a clean sweep.",
              ],
              nextStep: "Finish the response or extract once the room tips against you.",
              danger: false,
            }
          : null;

  useEffect(() => {
    if (activeTurnCrewId) setSelectedCrewId(activeTurnCrewId);
  }, [activeTurnCrewId]);

  const advanceTurn = (crewSnapshot: CrewMember[]) => {
    const livingOrder = initiativeOrder.filter((id) => crewSnapshot.some((member) => member.id === id && member.hp > 0));
    if (livingOrder.length === 0) return;
    if (turnIndex + 1 >= livingOrder.length) {
      const rerolled = rollInitiativeOrder(crewSnapshot);
      setInitiativeOrder(rerolled);
      setTurnIndex(0);
      setRoundNumber((prev) => prev + 1);
      setTurnClock(12);
      const nextId = rerolled[0];
      const nextMember = crewSnapshot.find((member) => member.id === nextId);
      if (nextMember) pushLog(`Round ${roundNumber + 1} initiative rolls. ${nextMember.name} is up.`);
      return;
    }
    setInitiativeOrder(livingOrder);
    setTurnIndex((prev) => prev + 1);
    setTurnClock(12);
  };

  useEffect(() => {
    if (!activeTurnCrewId) return;
    const timer = window.setInterval(() => {
      setTurnClock((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeTurnCrewId, turnIndex, roundNumber]);

  useEffect(() => {
    if (!activeTurnCrewId || turnClock > 0) return;
    pushLog(`${active.name} hesitates too long and forfeits the turn. The room keeps moving.`);
    const clockStep = resolveSealClockStep(sealClock, clockExpired, alert, pressure, `${active.name}'s forfeited turn`);
    if (clockStep.log) pushLog(clockStep.log);
    onSealState(clockStep.sealClock, clockStep.clockExpired);
    const enemyResult = performEnemyTurn(crew, units, clockStep.alert, clockStep.pressure, tetheredIds, bracedIds, breachLane, breachTurns);
    if (!enemyResult.resolved) {
      commitBoardState(enemyResult);
      advanceTurn(enemyResult.crew);
    }
    setTurnClock(12);
  }, [turnClock]);

  const groupedCrew = {
    front: crew.filter((member) => member.position === "front"),
    cover: crew.filter((member) => member.position === "cover"),
    back: crew.filter((member) => member.position === "back"),
  } as const;
  const groupedUnits = {
    front: livingUnits.filter((unit) => unit.targetBias === "front"),
    cover: livingUnits.filter((unit) => unit.targetBias === "cover"),
    back: livingUnits.filter((unit) => unit.targetBias === "back"),
  } as const;
  const threatUnits = [...livingUnits].sort((a, b) => b.priority - a.priority).slice(0, 3);
  const criticalLane = (["front", "cover", "back"] as Position[]).sort((a, b) => groupedUnits[b].reduce((sum, unit) => sum + unit.priority, 0) - groupedUnits[a].reduce((sum, unit) => sum + unit.priority, 0))[0];

  const commitBoardState = (next: EnemyTurnResult) => {
    setCrew(next.crew);
    setUnits(next.units);
    setAlertPressure(next.alert, next.pressure);
    setTetheredIds(next.tetheredIds);
    setBracedIds(next.bracedIds);
    setBreachLane(next.breachLane);
    setBreachTurns(next.breachTurns);
    setSelectedUnitId(next.selectedUnitId);
  };

  const resolveMissionNow = (outcome: Outcome, reason: string, snapshots?: Partial<EnemyTurnResult>) => {
    if (snapshots) {
      if (snapshots.crew) setCrew(snapshots.crew);
      if (snapshots.units) setUnits(snapshots.units);
      if (typeof snapshots.alert === "number" && typeof snapshots.pressure === "number") {
        setAlertPressure(snapshots.alert, snapshots.pressure);
      }
      if (snapshots.tetheredIds) setTetheredIds(snapshots.tetheredIds);
      if (snapshots.bracedIds) setBracedIds(snapshots.bracedIds);
      if (typeof snapshots.breachTurns === "number") setBreachTurns(snapshots.breachTurns);
      if (typeof snapshots.breachLane !== "undefined") setBreachLane(snapshots.breachLane || null);
      if (snapshots.selectedUnitId) setSelectedUnitId(snapshots.selectedUnitId);
    }
    onResolveMission(outcome, reason);
  };

  const performEnemyTurn = (
    crewSnapshot: CrewMember[],
    unitsSnapshot: EnemyUnit[],
    alertSnapshot: number,
    pressureSnapshot: number,
    tetheredSnapshot: string[],
    bracedSnapshot: string[],
    breachLaneSnapshot: Position | null,
    breachTurnsSnapshot: number,
  ): EnemyTurnResult => {
    let nextCrew = [...crewSnapshot];
    let nextUnits = [...unitsSnapshot];
    let nextAlert = alertSnapshot;
    let nextPressure = pressureSnapshot;
    let nextTetheredIds = [...tetheredSnapshot];
    let nextBracedIds = [...bracedSnapshot];
    let nextBreachLane = breachLaneSnapshot;
    let nextBreachTurns = breachTurnsSnapshot;

    if (nextBreachLane && nextBreachTurns > 0) {
      pushLog(`Vacuum tears through the ${nextBreachLane} lane. Untethered bodies and exposed machinery get punished.`);
      nextUnits = nextUnits
        .map((unit) => {
          if (unit.targetBias !== nextBreachLane) return unit;
          const severity = unit.tags.some((tag) => ["Drone", "System", "Signal", "Route", "Command"].includes(tag)) ? 2 : 1;
          return { ...unit, hp: Math.max(0, unit.hp - severity) };
        })
        .filter((unit) => unit.hp > 0);

      nextCrew = nextCrew.map((member) => {
        if (member.position !== nextBreachLane || tetheredSnapshot.includes(member.id)) return member;
        const braced = nextBracedIds.includes(member.id);
        if (braced) {
          nextBracedIds = nextBracedIds.filter((id) => id !== member.id);
          return member;
        }
        return { ...member, hp: Math.max(0, member.hp - 1), stress: member.stress + 1, position: moveAwayFromLane(member.position, nextBreachLane!) };
      });

      nextBreachTurns -= 1;
      if (nextBreachTurns <= 0) nextBreachLane = null;

      if (nextUnits.length === 0) {
        resolveMissionNow("success", "Hostile response broken by vacuum control.", {
          crew: nextCrew,
          units: nextUnits,
          alert: nextAlert,
          pressure: nextPressure,
          tetheredIds: nextTetheredIds,
          bracedIds: nextBracedIds,
          breachLane: nextBreachLane,
          breachTurns: nextBreachTurns,
          selectedUnitId: selectedUnitId,
        });
        return {
          crew: nextCrew,
          units: nextUnits,
          alert: nextAlert,
          pressure: nextPressure,
          tetheredIds: nextTetheredIds,
          bracedIds: nextBracedIds,
          breachLane: nextBreachLane,
          breachTurns: nextBreachTurns,
          selectedUnitId,
          resolved: true,
        };
      }
      if (nextCrew.every((member) => member.hp <= 0)) {
        resolveMissionNow("failure", "Squad wipe in decompression wash.", {
          crew: nextCrew,
          units: nextUnits,
          alert: nextAlert,
          pressure: nextPressure,
          tetheredIds: nextTetheredIds,
          bracedIds: nextBracedIds,
          breachLane: nextBreachLane,
          breachTurns: nextBreachTurns,
          selectedUnitId: livingSelectedUnitId(nextUnits, selectedUnitId),
        });
        return {
          crew: nextCrew,
          units: nextUnits,
          alert: nextAlert,
          pressure: nextPressure,
          tetheredIds: nextTetheredIds,
          bracedIds: nextBracedIds,
          breachLane: nextBreachLane,
          breachTurns: nextBreachTurns,
          selectedUnitId: livingSelectedUnitId(nextUnits, selectedUnitId),
          resolved: true,
        };
      }
    }

    const enemy = [...nextUnits].sort((a, b) => b.priority - a.priority)[0];
    if (!enemy) {
      resolveMissionNow("success", "Hostile response broken.");
      return { crew: nextCrew, units: nextUnits, alert: nextAlert, pressure: nextPressure, tetheredIds: nextTetheredIds, bracedIds: nextBracedIds, breachLane: nextBreachLane, breachTurns: nextBreachTurns, selectedUnitId: livingSelectedUnitId(nextUnits, selectedUnitId), resolved: true };
    }

    const standingCrew = nextCrew.filter((member) => member.hp > 0);
    if (standingCrew.length === 0) {
      resolveMissionNow("failure", "Squad wipe during extraction.");
      return { crew: nextCrew, units: nextUnits, alert: nextAlert, pressure: nextPressure, tetheredIds: nextTetheredIds, bracedIds: nextBracedIds, breachLane: nextBreachLane, breachTurns: nextBreachTurns, selectedUnitId: livingSelectedUnitId(nextUnits, selectedUnitId), resolved: true };
    }

    const rank: Record<Position, number> = { front: 0, cover: 1, back: 2 };
    const orderedCrew = [...standingCrew].sort((a, b) => (rank[a.position] + (enemy.targetBias === a.position ? -1 : 0)) - (rank[b.position] + (enemy.targetBias === b.position ? -1 : 0)));
    const target = orderedCrew[0];

    const tethered = nextTetheredIds.includes(target.id);
    const braced = nextBracedIds.includes(target.id);
    const sterileMeshIgnore = target.gear.mod?.id === "sterile_mesh" && target.injured && !ignoredInjuryIds.includes(target.id);
    if (sterileMeshIgnore) setIgnoredInjuryIds((prev) => [...prev, target.id]);

    const injuryPenalty = target.injured && !sterileMeshIgnore ? 1 : 0;
    const braceReduction = braced ? 2 : 0;
    const anchorReduction = target.gear.kit?.id === "mag_anchor" && target.position === "front" && !usedAnchor ? 1 : 0;
    const breachPenalty = nextBreachLane === target.position && !tethered && !braced ? 1 : 0;

    const damage = Math.max(1, enemy.attack + (nextAlert >= 3 ? 1 : 0) + injuryPenalty + breachPenalty - (target.position === "cover" ? 1 : 0) - braceReduction - anchorReduction);

    if (anchorReduction) setUsedAnchor(true);
    if (braced) nextBracedIds = nextBracedIds.filter((id) => id !== target.id);

    nextCrew = nextCrew.map((member) => {
      if (member.id !== target.id) return member;
      const forcedMove = !tethered && !braced && enemy.tags.some((tag) => ["Route", "Devastating", "Priority Kill"].includes(tag));
      return {
        ...member,
        hp: Math.max(0, member.hp - damage),
        stress: member.stress + 1 + (forcedMove ? 1 : 0),
        position: forcedMove ? moveTowardBias(member.position, enemy.targetBias) : member.position,
      };
    });

    nextAlert = clamp(nextAlert + (enemy.tags.some((tag) => ["Bile", "Route"].includes(tag)) ? 1 : 0), 0, 4);
    nextPressure = clamp(nextPressure + (enemy.tags.some((tag) => ["Signal", "Priority Kill", "Command"].includes(tag)) ? 1 : 0), 0, 10);

    pushLog(`${enemy.name} acts: ${enemy.intentText}. ${target.name} takes ${damage}${tethered ? " while clipped to a tether" : ""}${braced ? " but the wing-brace saves the lane" : ""}.`);

    if (nextCrew.every((member) => member.hp <= 0)) {
      resolveMissionNow("failure", "Squad wipe during extraction.", {
        crew: nextCrew,
        units: nextUnits,
        alert: nextAlert,
        pressure: nextPressure,
        tetheredIds: nextTetheredIds,
        bracedIds: nextBracedIds,
        breachLane: nextBreachLane,
        breachTurns: nextBreachTurns,
        selectedUnitId: livingSelectedUnitId(nextUnits, selectedUnitId),
      });
      return { crew: nextCrew, units: nextUnits, alert: nextAlert, pressure: nextPressure, tetheredIds: nextTetheredIds, bracedIds: nextBracedIds, breachLane: nextBreachLane, breachTurns: nextBreachTurns, selectedUnitId: livingSelectedUnitId(nextUnits, selectedUnitId), resolved: true };
    }
    if (nextPressure >= 10) {
      resolveMissionNow("partial", "Pressure ceiling reached. Ashwake orders immediate extraction.", {
        crew: nextCrew,
        units: nextUnits,
        alert: nextAlert,
        pressure: nextPressure,
        tetheredIds: nextTetheredIds,
        bracedIds: nextBracedIds,
        breachLane: nextBreachLane,
        breachTurns: nextBreachTurns,
        selectedUnitId: livingSelectedUnitId(nextUnits, selectedUnitId),
      });
      return { crew: nextCrew, units: nextUnits, alert: nextAlert, pressure: nextPressure, tetheredIds: nextTetheredIds, bracedIds: nextBracedIds, breachLane: nextBreachLane, breachTurns: nextBreachTurns, selectedUnitId: livingSelectedUnitId(nextUnits, selectedUnitId), resolved: true };
    }

    return {
      crew: nextCrew,
      units: nextUnits,
      alert: nextAlert,
      pressure: nextPressure,
      tetheredIds: nextTetheredIds,
      bracedIds: nextBracedIds,
      breachLane: nextBreachLane,
      breachTurns: nextBreachTurns,
      selectedUnitId: livingSelectedUnitId(nextUnits, selectedUnitId),
      resolved: false,
    };
  };

  const runBoardTransition = (
    nextCrew: CrewMember[],
    nextUnits: EnemyUnit[],
    nextAlert: number,
    nextPressure: number,
    timeLabel: string,
    nextTetheredIds: string[] = tetheredIds,
    nextBracedIds: string[] = bracedIds,
    nextBreachLane: Position | null = breachLane,
    nextBreachTurns: number = breachTurns,
  ) => {
    const clockStep = resolveSealClockStep(sealClock, clockExpired, nextAlert, nextPressure, timeLabel);
    if (clockStep.log) pushLog(clockStep.log);
    onSealState(clockStep.sealClock, clockStep.clockExpired);
    nextAlert = clockStep.alert;
    nextPressure = clockStep.pressure;
    if (nextUnits.filter((unit) => unit.hp > 0).length === 0) {
      resolveMissionNow("success", "Hostile response broken.", {
        crew: nextCrew,
        units: nextUnits,
        alert: nextAlert,
        pressure: nextPressure,
        tetheredIds: nextTetheredIds,
        bracedIds: nextBracedIds,
        breachLane: nextBreachLane,
        breachTurns: nextBreachTurns,
        selectedUnitId: livingSelectedUnitId(nextUnits, selectedUnitId),
      });
      return;
    }
    if (nextCrew.every((member) => member.hp <= 0)) {
      resolveMissionNow("failure", "Squad wipe during extraction.", {
        crew: nextCrew,
        units: nextUnits,
        alert: nextAlert,
        pressure: nextPressure,
        tetheredIds: nextTetheredIds,
        bracedIds: nextBracedIds,
        breachLane: nextBreachLane,
        breachTurns: nextBreachTurns,
        selectedUnitId: livingSelectedUnitId(nextUnits, selectedUnitId),
      });
      return;
    }

    const enemyResult = performEnemyTurn(nextCrew, nextUnits, nextAlert, nextPressure, nextTetheredIds, nextBracedIds, nextBreachLane, nextBreachTurns);
    if (!enemyResult.resolved) {
      commitBoardState(enemyResult);
      advanceTurn(enemyResult.crew);
    }
  };

  const tutorialBlock = (reason: string) => {
    pushLog(reason);
  };

  const guardActiveTurn = () => {
    if (selectedCrewId !== activeTurnCrewId) {
      pushLog(`${crew.find((member) => member.id === selectedCrewId)?.name || "That operator"} is waiting on initiative. ${active.name} is up.`);
      return false;
    }
    return true;
  };

  const anchorTether = () => {
    if (!guardActiveTurn()) return;
    if (tetheredIds.includes(active.id)) {
      pushLog(`${active.name} is already clipped in.`);
      return;
    }
    const nextTethers = [...tetheredIds, active.id].slice(-Math.max(1, ship.tethers));
    pushLog(`${active.name} anchors a tether before committing to the lane.`);
    runBoardTransition(crew, units, alert, pressure, "anchor tether", nextTethers, bracedIds, breachLane, breachTurns);
  };

  const useAttack = () => {
    if (!guardActiveTurn()) return;
    if (needsTetherLesson) {
      tutorialBlock("Tutorial lock: clip someone in with Anchor Tether before opening up.");
      return;
    }
    if (wrongPriorityTarget) {
      tutorialBlock(`Tutorial lock: ${priorityTarget?.name || "the marked threat"} is the lesson. Target it first.`);
      return;
    }
    if (weaponCycle >= 2) {
      pushLog(`${active.name}'s weapon cycle is spent. Reload, vent, or change the angle.`);
      return;
    }
    if (!targetUnit) return;
    const sterileMeshIgnore = active.gear.mod?.id === "sterile_mesh" && active.injured && !ignoredInjuryIds.includes(active.id);
    if (sterileMeshIgnore) setIgnoredInjuryIds((prev) => [...prev, active.id]);
    const injuryPenalty = active.injured && !sterileMeshIgnore ? 1 : 0;
    const weaponDoctrine = findWeaponFamily(active.doctrineWeaponId);
    const base = active.role === "Marksman" ? 6 : active.role === "Vanguard" ? 5 : 4;
    const doctrineDamage = active.doctrineWeaponId === "plasma" ? 2 : active.doctrineWeaponId === "slug" ? 1 : active.doctrineWeaponId === "blade" ? (active.position === "front" || active.position === "cover" ? 2 : -1) : active.doctrineWeaponId === "laser" ? 1 : 0;
    const amount = Math.max(2, base - injuryPenalty + doctrineDamage + gearAttackBonus(active, targetUnit));
    const nextUnits = units.map((unit) => unit.id === targetUnit.id ? { ...unit, hp: Math.max(0, unit.hp - amount) } : unit);
    const doctrineAlert = active.doctrineWeaponId === "coil" ? 0 : active.doctrineWeaponId === "laser" ? 1 : active.doctrineWeaponId === "plasma" ? 2 : active.doctrineWeaponId === "slug" ? 1 : 0;
    const doctrinePressure = active.doctrineWeaponId === "plasma" ? 1 : 0;
    const nextAlert = clamp(alert + doctrineAlert, 0, 4);
    setWeaponCycle((prev) => prev + 1);
    pushLog(`${active.name} attacks from ${active.position} with ${weaponDoctrine.name}. Target: ${targetUnit.name} for ${amount}.`);
    runBoardTransition(crew, nextUnits, nextAlert, clamp(pressure + doctrinePressure, 0, 10), "attack action");
  };

  const useRole = () => {
    if (!guardActiveTurn()) return;
    if (needsTetherLesson) {
      tutorialBlock("Tutorial lock: use Anchor Tether first so the room cannot solve your squad with vacuum.");
      return;
    }
    if (wrongPriorityTarget) {
      tutorialBlock(`Tutorial lock: ${priorityTarget?.name || "the marked threat"} is the priority kill. Solve that first.`);
      return;
    }
    if (active.role === "Signal Hacker") {
      const extraDrop = (active.gear.mod?.id === "sig_jammer" && !usedJammer ? 1 : 0) + (active.suitChassisId === "relay" ? 1 : 0) + (active.moduleDoctrineId === "signal_baffler" ? 1 : 0);
      if (extraDrop) setUsedJammer(true);
      pushLog(extraDrop ? `${active.name} uses ${active.skill} with Signal Jammer support and scrambles the room.` : `${active.name} uses ${active.skill} and scrambles the room.`);
      runBoardTransition(crew, units, clamp(alert - 1, 0, 4), clamp(pressure - 1 - extraDrop, 0, 10), "signal hack");
      return;
    }
    if (active.role === "Engineer / Tech") {
      pushLog(`${active.name} uses ${active.skill} and buys breathing room with ${findSuitModule(active.moduleDoctrineId).name}.`);
      runBoardTransition(crew, units, alert, clamp(pressure - 1 - (active.suitChassisId === "containment" ? 1 : 0), 0, 10), "engineering override");
      return;
    }
    if (active.role === "Vanguard") {
      const nextCrew = crew.map((member) => member.id === active.id ? { ...member, hp: Math.min(member.maxHp, member.hp + 2 + (active.suitChassisId === "breach" ? 1 : 0)) } : member);
      pushLog(`${active.name} uses ${active.skill} and hardens the front in ${findSuitChassis(active.suitChassisId).name}.`);
      runBoardTransition(nextCrew, units, alert, pressure, "reposition");
      return;
    }
    if (active.role === "Marksman") {
      if (!targetUnit) return;
      const amount = (active.injured ? 7 : 8) + gearAttackBonus(active, targetUnit) + (active.doctrineWeaponId === "coil" ? 1 : active.doctrineWeaponId === "laser" ? 1 : 0);
      const nextUnits = units.map((unit) => unit.id === targetUnit.id ? { ...unit, hp: Math.max(0, unit.hp - amount) } : unit);
      pushLog(`${active.name} uses ${active.skill}. Target: ${targetUnit.name} for ${amount}.`);
      runBoardTransition(crew, nextUnits, alert, pressure, "precision role action");
      return;
    }
    if (!targetUnit) return;
    const amount = (active.injured ? 4 : 5) + gearAttackBonus(active, targetUnit);
    const nextUnits = units.map((unit) => unit.id === targetUnit.id ? { ...unit, hp: Math.max(0, unit.hp - amount) } : unit);
    pushLog(`${active.name} shifts the terms of the fight. Target: ${targetUnit.name} for ${amount}.`);
    runBoardTransition(crew, nextUnits, alert, pressure, "precision role action");
  };

  const useBreath = () => {
    if (!guardActiveTurn()) return;
    if (needsTetherLesson) {
      tutorialBlock("Tutorial lock: tether first. Big dragon moments are for after basic survival discipline.");
      return;
    }
    if (wrongPriorityTarget) {
      tutorialBlock(`Tutorial lock: point that breath at ${priorityTarget?.name || "the marked threat"}, not the distraction.`);
      return;
    }
    if (breathSpentIds.includes(active.id)) {
      pushLog(`${active.name} has already spent their major breath window in this encounter.`);
      return;
    }
    if (!targetUnit) return;
    const base = active.breathType === "Fire" ? 9 : active.breathType === "Lightning" ? 8 : active.breathType === "Force" ? 8 : 7;
    const amount = Math.max(4, base - (active.injured ? 1 : 0));
    const nextUnits = units.map((unit) => unit.id === targetUnit.id ? { ...unit, hp: Math.max(0, unit.hp - amount) } : unit);
    setBreathSpentIds((prev) => [...prev, active.id]);
    pushLog(`${active.name} unleashes ${active.breathType.toLowerCase()} breath in a ${active.breathShape.toLowerCase()}. Target: ${targetUnit.name} for ${amount}.`);
    if (active.breathType === "Fire") pushLog("In oxygenated space, the fire lashes out harder than a sane operator would like. Power carries consequence here.");
    runBoardTransition(crew, nextUnits, clamp(alert + 2 - (active.moduleDoctrineId === "heat_sink" ? 1 : 0), 0, 4), clamp(pressure + (active.doctrineWeaponId === "plasma" ? 1 : 0), 0, 10), "dragon breath");
  };

  const reposition = (position: Position) => {
    if (!guardActiveTurn()) return;
    if (needsTetherLesson) {
      tutorialBlock("Tutorial lock: brace the squad with a tether before you start drifting around the lane board.");
      return;
    }
    const nextCrew = crew.map((member) => member.id === active.id ? { ...member, position } : member);
    pushLog(`${active.name} repositions to ${position}.`);
    runBoardTransition(nextCrew, units, alert, pressure, "reposition");
  };

  const resetCycle = () => {
    if (!guardActiveTurn()) return;
    if (needsTetherLesson) {
      tutorialBlock("Tutorial lock: tether first. Then worry about weapon discipline.");
      return;
    }
    setWeaponCycle(0);
    pushLog(`${active.name} resets the weapon profile and regains discipline.`);
    runBoardTransition(crew, units, alert, pressure, "weapon reset");
  };

  const toggleTether = () => {
    if (!guardActiveTurn()) return;
    const currentlyTethered = tetheredIds.includes(active.id);
    const nextTethers = currentlyTethered ? tetheredIds.filter((id) => id !== active.id) : [...tetheredIds, active.id].slice(-Math.max(1, ship.tethers + (active.moduleDoctrineId === "mag_tether" ? 1 : 0)));
    pushLog(currentlyTethered ? `${active.name} cuts loose from the tether and risks the room.` : `${active.name} anchors to the lane and commits to controlled movement.`);
    runBoardTransition(crew, units, alert, pressure, "tether action", nextTethers, bracedIds, breachLane, breachTurns);
  };

  const wingBrace = () => {
    if (!guardActiveTurn()) return;
    if (bracedIds.includes(active.id)) {
      pushLog(`${active.name} is already wing-braced and ready to catch the next bad movement.`);
      return;
    }
    const nextBraces = [...bracedIds, active.id];
    pushLog(`${active.name} tucks and braces wings for braking, collision control, and anti-drift stability.`);
    runBoardTransition(crew, units, alert, pressure, "wing brace", tetheredIds, nextBraces, breachLane, breachTurns);
  };

  const ventLane = () => {
    if (!guardActiveTurn()) return;
    if (ventCharges <= 0) {
      pushLog("No vent or decompression plays left in this encounter.");
      return;
    }
    const targetLane: Position = targetUnit?.targetBias || active.position;
    let nextBraces = [...bracedIds];
    const nextUnits = units
      .map((unit) => {
        if (unit.targetBias !== targetLane) return unit;
        const tagBonus = unit.tags.some((tag) => ["Drone", "System", "Signal", "Route", "Command"].includes(tag)) ? 1 : 0;
        const engineerBonus = active.role === "Engineer / Tech" ? 1 : 0;
        const gemBonus = active.family === "Gem" ? 1 : 0;
        return { ...unit, hp: Math.max(0, unit.hp - (environment.ventDamage + tagBonus + engineerBonus + gemBonus)) };
      })
      .filter((unit) => unit.hp > 0);

    const nextCrew = crew.map((member) => {
      if (member.position !== targetLane || tetheredIds.includes(member.id)) return member;
      const braced = nextBraces.includes(member.id);
      if (braced) {
        nextBraces = nextBraces.filter((id) => id !== member.id);
        return member;
      }
      return { ...member, hp: Math.max(0, member.hp - 1), stress: member.stress + 1, position: moveAwayFromLane(member.position, targetLane) };
    });

    setVentCharges((prev) => prev - 1);
    pushLog(`${active.name} turns the room into a weapon. ${targetLane.toUpperCase()} lane gets hit by a decompression sweep.`);
    runBoardTransition(nextCrew, nextUnits, clamp(alert + 1, 0, 4), pressure, "decompression play", tetheredIds, nextBraces, targetLane, 1);
  };

  const emergencyExtract = () => {
    if (!guardActiveTurn()) return;
    resolveMissionNow("partial", "The squad chooses emergency extraction before total collapse.", {
      crew,
      units,
      alert,
      pressure,
      tetheredIds,
      bracedIds,
      breachLane,
      breachTurns,
      selectedUnitId: livingSelectedUnitId(units, selectedUnitId),
    });
  };

  return (
    <div className="panel theater-panel">
      <div className="panel-head">
        <div>
          <div className="eyebrow"><AlertTriangle size={14} /> Encounter</div>
          <h2 className="panel-title">{encounter.name}</h2>
          <p className="panel-copy">{encounter.desc}</p>
          <div className="small-copy text-muted">{mission.title} • {mission.doctrine}</div>
        </div>
        <div className="status-stack">
          <div className="pill pill-danger">Hostiles {livingUnits.length}</div>
          <div className="pill">Intent: {actingUnit?.intentText || "Pressure squad"}</div>
        </div>
      </div>

      <div className="combat-hud-grid">
        <div className="environment-grid">
          <div className="environment-card environment-card-hero">
            <div className="micro-label"><Wind size={13} /> Environment</div>
            <div className="button-title">{environment.label}</div>
            <div className="small-copy">{environment.summary}</div>
          </div>
          <div className="environment-card">
            <div className="micro-label"><Link2 size={13} /> Tethers</div>
            <div className="button-title">{tetheredIds.length} operators clipped in</div>
            <div className="small-copy">{environment.tetherRule}</div>
          </div>
          <div className="environment-card">
            <div className="micro-label"><Gauge size={13} /> Vacuum Plays</div>
            <div className="button-title">{ventCharges} decompression moves left</div>
            <div className="small-copy">{environment.wingRule}</div>
          </div>
        </div>

        <div className="threat-strip-panel">
          <div className="panel-head threat-panel-head">
            <div>
              <div className="eyebrow"><Target size={14} /> Threat Advisory</div>
              <div className="small-copy">Critical lane: {criticalLane.toUpperCase()} • Current target logic: {actingUnit?.intentText || "Pressure squad"}</div>
            </div>
            <div className="tag-row">
              <span className="tag tag-danger">Alert {alertLabel(alert)}</span>
              <span className="tag tag-warning">Pressure {pressure}/{mission.pressureLabel === "Wave Pressure" ? 10 : 10}</span>
            </div>
          </div>
          <div className="threat-strip-grid">
            {threatUnits.map((unit) => (
              <button key={unit.id} onClick={() => setSelectedUnitId(unit.id)} className={`threat-card ${selectedUnitId === unit.id ? "threat-card-selected" : ""}`}>
                <div className="threat-sigil">{enemySigil(unit)}</div>
                <div>
                  <div className="button-title">{unit.name}</div>
                  <div className="button-copy">{enemyThreatLabel(unit)} • {unit.intentText}</div>
                </div>
                <div className="tag-row compact-tags">
                  <span className="tag tag-neutral">P{unit.priority}</span>
                  <span className="tag tag-neutral">HP {unit.hp}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="field-state-row">
            <div className="field-chip"><span className="field-chip-label">Breach</span>{breachLane ? `${breachLane.toUpperCase()} • ${breachTurns} turn` : "Stable hull"}</div>
            <div className="field-chip"><span className="field-chip-label">Tethers</span>{tetheredIds.length ? tetheredIds.length : "None"}</div>
            <div className="field-chip"><span className="field-chip-label">Wing-Brace</span>{bracedIds.length ? bracedIds.length : "None"}</div>
          </div>
        </div>
      </div>

      {breachLane && <div className="breach-banner">Open breach in {breachLane.toUpperCase()} lane. Untethered bodies there are in danger and loose system hardware is starting to shear.</div>}

      <div className="lane-board game-lanes">
        {(["front", "cover", "back"] as Position[]).map((lane) => (
          <div key={lane} className={`lane-card lane-card-${lane} ${breachLane === lane ? "lane-card-breach" : ""} ${criticalLane === lane ? "lane-card-critical" : ""}`}>
            <div className="lane-label">
              <div className="small-label">{lane.toUpperCase()} LANE</div>
              <div className="tag-row compact-tags">
                {criticalLane === lane && <span className="tag tag-warning">HOT</span>}
                {breachLane === lane && <span className="tag tag-danger">BREACH</span>}
              </div>
            </div>
            <div className="lane-subcopy">{lane === "front" ? "Impact, brute force, last-second holds." : lane === "cover" ? "Crossfire, sensors, and bile denial." : "Signals, control nodes, and collapse risk."}</div>
            <div className="stack">
              <div className="micro-label">Squad</div>
              {groupedCrew[lane].length === 0 ? <div className="text-muted">No squad members here.</div> : groupedCrew[lane].map((member) => (
                <div key={member.id} className={`crew-chip ${selectedCrewId === member.id ? "crew-chip-active" : ""}`}>
                  <div className="button-title">{subtypeIconName(member.breathType)} {member.name}</div>
                  <div className="button-copy">HP {member.hp}/{member.maxHp} • {member.injured ? "Injured" : "Stable"}</div>
                  <div className="tag-row compact-tags">
                    {tetheredIds.includes(member.id) && <span className="tag tag-blue">Tethered</span>}
                    {bracedIds.includes(member.id) && <span className="tag tag-purple">Wing-Braced</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="stack">
              <div className="micro-label">Hostile Pressure</div>
              {groupedUnits[lane].length === 0 ? <div className="text-muted">No hostile focus here.</div> : groupedUnits[lane].map((unit) => (
                <button key={unit.id} className={`enemy-chip ${selectedUnitId === unit.id ? "enemy-chip-selected" : ""}`} onClick={() => setSelectedUnitId(unit.id)}>
                  <div className="enemy-chip-head">
                    <span className="enemy-sigil">{enemySigil(unit)}</span>
                    <div className="button-title">{unit.name}</div>
                  </div>
                  <div className="button-copy">HP {unit.hp}/{unit.maxHp} • P{unit.priority} • {enemyThreatLabel(unit)}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="encounter-grid theater-grid">
        <div className="stack">
          {crew.map((member) => (
            <button key={member.id} onClick={() => member.id === activeTurnCrewId ? setSelectedCrewId(member.id) : pushLog(`${member.name} is waiting on initiative. ${active.name} is up.`)} className={`crew-list-card ${selectedCrewId === member.id ? "crew-list-card-selected" : ""}`}>
              <div className="crew-list-head">
                <div>
                  <div className="crew-title">{member.name}</div>
                  <div className="button-copy">{member.role}</div>
                </div>
                <div className="tag-row">
                  {member.injured && <span className="tag tag-warning">Injured</span>}
                  {tetheredIds.includes(member.id) && <span className="tag tag-blue">Tethered</span>}
                  {bracedIds.includes(member.id) && <span className="tag tag-purple">Wing-Braced</span>}
                </div>
              </div>
              <div className="meter-row">
                <span className="tag tag-neutral">HP {member.hp}</span>
                <span className="tag tag-neutral">Stress {member.stress}</span>
                <span className="tag tag-neutral">{member.position}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="panel theater-console">
          <div className="three-col enemy-grid">
            {units.map((unit) => (
              <button key={unit.id} onClick={() => unit.hp > 0 && setSelectedUnitId(unit.id)} className={`enemy-card ${selectedUnitId === unit.id ? "enemy-card-selected" : ""} ${unit.hp <= 0 ? "enemy-card-dead" : ""}`}>
                <div className="enemy-head">
                  <div>
                    <div className="enemy-card-title-row"><span className="enemy-sigil enemy-sigil-large">{enemySigil(unit)}</span><span className="button-title">{unit.name}</span></div>
                    <div className="button-copy">{unit.role}</div>
                  </div>
                  <span className="tag tag-neutral">P{unit.priority}</span>
                </div>
                <div className="button-copy">{unit.tags.join(" • ")}</div>
                <div className="tag-row"><span className="tag tag-neutral">HP {unit.hp}/{unit.maxHp}</span><span className="tag tag-warning">{enemyThreatLabel(unit)}</span></div>
              </button>
            ))}
          </div>

          <div className="operator-head battle-operator operator-banner">
            <div>
              <div className="micro-label">Active Operator</div>
              <h3 className="operator-name">{subtypeIconName(active.breathType)} {active.name}</h3>
              <div className="button-copy">{active.role} • {active.subtype} {active.breathType}</div>
              <div className="operator-target-copy">Current target: {targetUnit ? `${enemySigil(targetUnit)} ${targetUnit.name} — ${enemyThreatLabel(targetUnit)}` : "No valid target."}</div>
            </div>
            <div className="tag-row">
              <span className="tag tag-neutral">Weapon Cycle {weaponCycle}/2</span>
              <span className="tag tag-neutral">Breath {breathSpentIds.includes(active.id) ? "Spent" : "Ready"}</span>
              <span className="tag tag-neutral">Vent Charges {ventCharges}</span>
            </div>
          </div>

          <div className="action-grid action-grid-wide">
            <button className={`sub-button ${needsTetherLesson || wrongPriorityTarget ? "sub-button-disabled" : ""}`} onClick={useAttack} disabled={needsTetherLesson || wrongPriorityTarget}><div className="button-title">Attack</div><div className="button-copy">Reliable damage into the marked problem.</div><WhyChip text="Use this when you need the safest way to remove pressure without getting fancy." tone="good" /></button>
            <button className={`sub-button ${needsTetherLesson || wrongPriorityTarget ? "sub-button-disabled" : ""}`} onClick={useRole} disabled={needsTetherLesson || wrongPriorityTarget}><div className="button-title">Role Ability</div><div className="button-copy">{active.skill}</div><WhyChip text="Use this when the room is solving the squad through timing, control, or bad geometry instead of raw damage." tone="good" /></button>
            <button className={`sub-button sub-button-good ${needsTetherLesson || wrongPriorityTarget ? "sub-button-disabled" : ""}`} onClick={useBreath} disabled={needsTetherLesson || wrongPriorityTarget}><div className="button-title">Dragon Breath</div><div className="button-copy">Big swing. Big signature. Real dragonborn moment.</div><WhyChip text="Use this when ending the problem now matters more than staying quiet." tone="warn" /></button>
            <button className={`sub-button ${tetheredIds.includes(active.id) ? "sub-button-warning" : tutorialMode && needsTetherLesson ? "tutorial-primary-action" : ""}`} onClick={toggleTether}><div className="button-title">{tetheredIds.includes(active.id) ? "Cut Tether" : "Anchor Tether"}</div><div className="button-copy">Clip in before the room solves your lane for you.</div><WhyChip text={tetheredIds.includes(active.id) ? "Cut it only if the line is now hurting more than helping." : "Forced movement and decompression kill careless squads faster than damage does."} tone={tetheredIds.includes(active.id) ? "warn" : "good"} /></button>
            <button className={`sub-button ${bracedIds.includes(active.id) ? "sub-button-warning" : ""}`} onClick={wingBrace}><div className="button-title">Wing Brace</div><div className="button-copy">Use wings for braking, drag, and stability — not flight.</div><WhyChip text="Brace when the room wants to push or spin you. Wings here are control surfaces, not freedom." tone="good" /></button>
            <button className={`sub-button ${ventCharges <= 0 || needsTetherLesson ? "sub-button-disabled" : "sub-button-warning"}`} onClick={ventLane} disabled={ventCharges <= 0 || needsTetherLesson}><div className="button-title">Vent / Decompress Lane</div><div className="button-copy">Blow a lane open and punish untethered bodies.</div><WhyChip text="Use this when the environment can solve the problem more efficiently than direct damage." tone="warn" /></button>
            <button className={`sub-button ${needsTetherLesson ? "sub-button-disabled" : ""}`} onClick={() => reposition("front")} disabled={needsTetherLesson}><div className="button-title">Move Front</div><div className="button-copy">Take impact and hold the approach.</div></button>
            <button className={`sub-button ${needsTetherLesson ? "sub-button-disabled" : ""}`} onClick={() => reposition("cover")} disabled={needsTetherLesson}><div className="button-title">Move Cover</div><div className="button-copy">Play angles and deny clean shots.</div></button>
            <button className={`sub-button ${needsTetherLesson ? "sub-button-disabled" : ""}`} onClick={() => reposition("back")} disabled={needsTetherLesson}><div className="button-title">Move Back</div><div className="button-copy">Protect the operator, risk the formation.</div></button>
            <button className={`sub-button ${needsTetherLesson ? "sub-button-disabled" : ""}`} onClick={resetCycle} disabled={needsTetherLesson}><div className="button-title">Reload / Vent Discipline</div><div className="button-copy">Reset the weapon profile and steady the operator.</div></button>
            <button className={`sub-button sub-button-extract ${tutorialMode && !needsExtractLesson ? "sub-button-disabled" : tutorialMode && needsExtractLesson ? "tutorial-primary-action" : ""}`} onClick={emergencyExtract} disabled={tutorialMode && !needsExtractLesson}><div className="button-title">Emergency Extract</div><div className="button-copy">Leave with something before the room owns the run.</div><WhyChip text="Winning combat is not the mission. If the clock, pressure, or geometry are about to beat you, cash out and live." tone="warn" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initial = useMemo(() => loadPersistedAppState(), []);
  const [crew, setCrew] = useState(initial.crew);
  const [ship, setShip] = useState(initial.ship);
  const [selectedCrew, setSelectedCrew] = useState(initial.selectedCrew);
  const [logs, setLogs] = useState(initial.logs);
  const [dmMode, setDmMode] = useState(initial.dmMode);
  const [chosenUpgrade, setChosenUpgrade] = useState<string | null>(initial.chosenUpgrade);
  const [missionState, setMissionState] = useState(initial.missionState);
  const [onboarding, setOnboarding] = useState(initial.onboarding);

  useEffect(() => {
    const state: AppState = { crew, ship, selectedCrew, logs, dmMode, chosenUpgrade, missionState, onboarding };
    persistAppState(state);
  }, [crew, ship, selectedCrew, logs, dmMode, chosenUpgrade, missionState, onboarding]);

  const pushLog = (text: string) => setLogs((prev) => [text, ...prev]);

  const applyAppState = (next: AppState) => {
    setCrew(next.crew);
    setShip(next.ship);
    setSelectedCrew(next.selectedCrew);
    setLogs(next.logs);
    setDmMode(next.dmMode);
    setChosenUpgrade(next.chosenUpgrade);
    setMissionState(next.missionState);
    setOnboarding(next.onboarding);
  };

  const exportSave = () => {
    const payload: AppState = { crew, ship, selectedCrew, logs, dmMode, chosenUpgrade, missionState, onboarding };
    downloadAppState(payload);
    pushLog("Campaign save exported.");
  };

  const importSave = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    importAppStateFromFile(file)
      .then((state) => {
        applyAppState(normalizeAppState(state));
        pushLog("Campaign save imported.");
      })
      .catch(() => pushLog("Import failed: save file was not valid JSON."))
      .finally(() => {
        event.target.value = "";
      });
  };

  const resetSave = () => {
    applyAppState(createDefaultAppState());
    clearPersistedAppState();
    pushLog("Campaign save reset.");
  };

  const activeMission = missionState.mission;
  const completedMissionIds = new Set(ship.completedMissions);
  const hasBrokenChoirAccess = Boolean(ship.routeIntel.redglassVector && ship.routeIntel.quarantineVector);
  const squadReady = crew.every((member) => member.role !== "Unassigned" && member.family !== "Unassigned" && member.subtype !== "Unassigned");
  const availableInterlude = ship.pendingInterludeId ? INTERLUDE_EVENTS.find((event) => event.id === ship.pendingInterludeId) || null : null;
  const selectedMember = crew.find((member) => member.id === selectedCrew) || crew[0];
  const doctrineUnlocks = useMemo(() => getDoctrineUnlocks(ship), [ship]);

  useEffect(() => {
    setCrew((prev) => {
      const next = normalizeCrewForDoctrineUnlocks(prev, doctrineUnlocks);
      const changed = next.some((member, index) =>
        member.doctrineWeaponId !== prev[index]?.doctrineWeaponId ||
        member.suitChassisId !== prev[index]?.suitChassisId ||
        member.moduleDoctrineId !== prev[index]?.moduleDoctrineId
      );
      return changed ? next : prev;
    });
  }, [doctrineUnlocks]);
  const tutorialMission = useMemo(() => ({
    ...MISSION_CATALOG.redglass,
    id: "training_redglass",
    title: "Training Run // Redglass Breach Drill",
    short: "Guided first run that teaches the dead zone step by step.",
    summary: "This is a controlled Redglass doctrine drill. Build a squad, break the seal, secure the core, and get out before the room solves you.",
    objective: "Learn the breach flow, respect the seal clock, and extract with the core.",
    playerGuidance: [
      "Once the seal breaks, the clock starts. Do not drift or stall.",
      "Wings are for control and braking here, not free flight.",
      "Tethers stop the room and forced movement from solving your squad.",
      "If the timer expires, the site gets meaner every beat until you leave or die.",
    ],
    missionClockStart: 5,
  }), []);
  const onboardingActive = !onboarding.completed;
  const tutorialMissionActive = onboardingActive && onboarding.step === "training" && missionState.missionId === "training_redglass";
  const onboardingFocused = onboardingActive;

  const updateCrewBuild = (crewId: string, updates: Partial<Pick<CrewMember, "role" | "family" | "subtype" | "doctrineWeaponId" | "suitChassisId" | "moduleDoctrineId">>) => {
    setCrew((prev) => prev.map((member) => member.id === crewId ? rebuildCrewMember(member, updates) : member));
    const changed = Object.entries(updates).map(([key, value]) => `${key} → ${value}`).join(", ");
    const name = crew.find((member) => member.id === crewId)?.name || crewId;
    pushLog(`Builder update: ${name} adjusted (${changed}).`);
  };

  const tutorialBriefingGuide = tutorialMissionActive && activeMission ? (
    <TutorialCoachPanel
      title="Before the seal breaks"
      body="Assume the player knows nothing. This panel exists to explain what the mission is really asking: get in, secure the objective, and get back out before the room adapts."
      whyItMatters="Players need to understand that combat is only one piece of the mission. The real job is controlled extraction under time pressure."
      badOutcome="If they think the mission is about clearing every threat, they stall, the seal clock expires, and the level starts solving for their deaths."
      wrongInstinct="Treating the briefing like flavor text and assuming the room will patiently wait for them to finish every fight."
      bullets={[
        "Your real goal is extraction with the core, not a perfect body count.",
        "This squad should use signal control and route discipline before brute force.",
        "When the seal clock hits zero, alert and pressure start stacking every beat.",
      ]}
      nextStep="Start the mission, then choose a calm entry route. Do not waste time once the seal is open."
    />
  ) : null;

  const tutorialRouteGuide = (phase: "dock" | "relay" | "core") => {
    if (!tutorialMissionActive) return null;
    const guides = {
      dock: {
        title: "Choose your entry discipline",
        body: "New players need this spelled out: the entry choice is about what kind of mistake you are least likely to make with this squad.",
        whyItMatters: "The first route decides whether you start the mission calm and organized or already behind the clock.",
        badOutcome: "A flashy bad entry wastes time, exposes the squad, and turns later problems into emergencies.",
        wrongInstinct: "Picking the coolest sounding route instead of the route your current squad can actually execute cleanly.",
        bullets: [
          "Pick the route that fits your squad, not the one that merely sounds coolest.",
          "Vacuum means wings are control surfaces. Treat drifting like a commitment.",
          "A good entry buys time later. A flashy bad entry burns the clock before the mission really starts.",
        ],
        nextStep: "Choose the route whose projected result best matches your squad and ship tools.",
      },
      relay: {
        title: "Use environment logic, not just stats",
        body: "This beat teaches why smart teams beat strong teams. You are trying to solve the hallway before it turns into a fight.",
        whyItMatters: "If you use signal reads, tethers, and timing well here, the next room starts under control instead of under panic.",
        badOutcome: "If you brute-force every problem, the room keeps your clock, pressure, and formation all on the wrong side of manageable.",
        wrongInstinct: "Thinking 'we can probably just tank this' instead of using the environment and the squad's specialist tools.",
        bullets: [
          "Look for the option that uses your squad's specialist strengths.",
          "If a corridor might vent or pull, tethers and wing control stop stupid deaths.",
          "The timer is still the real boss. Route choices should protect tempo.",
        ],
        nextStep: "Take the route that keeps pressure manageable and preserves extraction chances.",
      },
      core: {
        title: "Plan the exit before touching the prize",
        body: "Players need this made explicit: touching the objective is not the end of the mission. It is the point where the level starts caring most about trapping you.",
        whyItMatters: "This choice is about whether the squad can still extract in one piece after the room wakes up harder.",
        badOutcome: "Greedy choices here often win the objective and lose the squad, because the response comes after the prize is touched.",
        wrongInstinct: "Thinking 'we already won once we reach the core' instead of planning the part where the room tries to kill you on the way out.",
        bullets: [
          "A safe core line can be better than a greedy one if your clock is thin.",
          "If your squad is already stressed, choose the route that preserves formation.",
          "You are about to trigger the hostile response. Assume the room gets worse, not kinder.",
        ],
        nextStep: "Choose the approach that leaves the squad able to survive the response and extract.",
      },
    } as const;
    const guide = guides[phase];
    const step = phase === "dock" ? "Step 2 // Pick the entry that matches the squad" : phase === "relay" ? "Step 3 // Use the environment before it uses you" : "Step 4 // Plan the exit before the prize";
    return (
      <>
        <StepBanner step={step} title={guide.title} copy={guide.body} danger={phase === "core"} />
        <TutorialCoachPanel title={guide.title} body={guide.body} whyItMatters={guide.whyItMatters} badOutcome={guide.badOutcome} wrongInstinct={guide.wrongInstinct} bullets={[...guide.bullets]} nextStep={guide.nextStep} danger={phase === "core"} />
      </>
    );
  };

  const progressSteps = ["hub", "briefing", "dock", "relay", "core", "encounter", "aftermath", "ship"];
  const progress = ((progressSteps.indexOf(missionState.screen) + 1) / progressSteps.length) * 100;

  const missionUnlocked = (missionId: string) =>
    missionId === "brokenchoir"
      ? completedMissionIds.has("redglass") && completedMissionIds.has("quarantine7") && hasBrokenChoirAccess
      : true;

  const launchMission = (missionId: string, mission: MissionDefinition, options?: { ignoreBranchMods?: boolean }) => {
    const branchMods = options?.ignoreBranchMods ? { alertMod: 0, pressureMod: 0, notes: [] as string[] } : branchModsForMission(ship, missionId);
    resetCrewForMission();
    setChosenUpgrade(null);
    setMissionState({
      screen: "briefing",
      beat: "briefing",
      missionId,
      mission,
      hiddenTruths: mission.hiddenTruths,
      alert: clamp(ship.temporaryOps.nextMissionAlertMod + branchMods.alertMod, 0, 4),
      pressure: clamp(mission.pressureStart + ship.temporaryOps.nextMissionPressureMod + branchMods.pressureMod, 0, 10),
      sealClock: mission.missionClockStart,
      clockExpired: false,
      anomalySeen: false,
      encounterTemplate: null,
      outcome: null,
      failureReason: null,
      resolutionRewards: { salvage: 0, intel: 0, cores: 0 },
    });
    setShip((prev) => ({ ...prev, temporaryOps: { ...prev.temporaryOps, nextMissionAlertMod: 0, nextMissionPressureMod: 0 } }));
    pushLog(`Mission selected: ${mission.title}. ${mission.doctrine}`);
    branchMods.notes.forEach((note) => pushLog(note));
  };

  const resetCrewForMission = () =>
    setCrew((prev) =>
      prev.map((member) => ({
        ...member,
        hp: Math.min(member.maxHp, Math.max(1, member.hp)),
        oxygen: 100,
        position: member.role === "Vanguard" ? "front" : member.role === "Marksman" ? "back" : "cover",
      })),
    );

  const applyRouteRewards = (reward: { salvage?: number; intel?: number; cores?: number }) =>
    setShip((prev) => ({
      ...prev,
      salvage: prev.salvage + (reward.salvage || 0),
      intel: prev.intel + (reward.intel || 0),
      cores: prev.cores + (reward.cores || 0),
    }));

  const grantMissionLoot = (missionId: string) => {
    const pool = LOOT_TABLE[missionId] || [];
    setShip((prev) => {
      const existing = new Set(prev.inventory.map((item) => item.id));
      const candidate = pool.find((item) => !existing.has(item.id));
      if (!candidate) return prev;
      pushLog(`Recovered personal loot: ${candidate.name}. ${candidate.desc}`);
      return { ...prev, inventory: [...prev.inventory, candidate] };
    });
  };

  const equipItem = (crewId: string, item: GearItem) => {
    const name = crew.find((member) => member.id === crewId)?.name || crewId;
    setCrew((prev) => prev.map((member) => member.id === crewId ? { ...member, gear: { ...member.gear, [item.slot]: item } } : member));
    pushLog(`${item.name} equipped to ${name}.`);
  };

  const resolveInterlude = (event: InterludeEvent, choice: InterludeChoice) => {
    setShip((prev) => ({
      ...prev,
      salvage: Math.max(0, prev.salvage + (choice.apply.salvage || 0)),
      intel: Math.max(0, prev.intel + (choice.apply.intel || 0)),
      resolvedInterludes: prev.resolvedInterludes.includes(event.id) ? prev.resolvedInterludes : [event.id, ...prev.resolvedInterludes],
      pendingInterludeId: null,
      temporaryOps: {
        nextMissionAlertMod: prev.temporaryOps.nextMissionAlertMod + (choice.apply.nextMissionAlertMod || 0),
        nextMissionPressureMod: prev.temporaryOps.nextMissionPressureMod + (choice.apply.nextMissionPressureMod || 0),
        freeFullRecovery: prev.temporaryOps.freeFullRecovery + (choice.apply.freeFullRecovery || 0),
      },
    }));
    if (choice.apply.allStressDelta) setCrew((prev) => prev.map((member) => ({ ...member, stress: Math.max(0, member.stress + choice.apply.allStressDelta!) })));
    if (choice.apply.crewStress) setCrew((prev) => prev.map((member, index) => index === 0 ? { ...member, stress: member.stress + choice.apply.crewStress! } : member));
    if (choice.apply.injuredStress) {
      setCrew((prev) => {
        const target = prev.find((member) => member.injured) || prev[0];
        return prev.map((member) => member.id === target.id ? { ...member, stress: member.stress + choice.apply.injuredStress! } : member);
      });
    }
    pushLog(choice.log);
  };

  const startMissionFromHub = (missionId: string) => {
    if (!squadReady) {
      pushLog("Squad not ready. Finish the Guided Player Designer before deploying.");
      return;
    }
    if (!missionUnlocked(missionId)) {
      pushLog(`Route to ${MISSION_CATALOG[missionId].title} is still locked. The squad needs more dead-zone proof before going deeper.`);
      return;
    }
    launchMission(missionId, MISSION_CATALOG[missionId]);
  };

  const autoSuggestTrainingSquad = () => {
    const suggested = suggestedTrainingCrew();
    setCrew(suggested);
    setSelectedCrew(suggested[0].id);
    pushLog("Recommended training squad loaded: one anchor, one signal reader, one priority killer, one fixer.");
  };

  const beginTrainingBuilder = () => {
    if (crew.every((member) => member.role === "Unassigned")) {
      const suggested = suggestedTrainingCrew();
      setCrew(suggested);
      setSelectedCrew(suggested[0].id);
      pushLog("Training funnel engaged. Recommended drill squad loaded so the lesson starts fast.");
    } else {
      pushLog("Training funnel engaged. Build the squad first.");
    }
    setOnboarding({ completed: false, step: "builder" });
  };

  const skipToCommandDeck = () => {
    setOnboarding({ completed: true, step: "command" });
    pushLog("Tutorial skipped. Full command deck unlocked.");
  };

  const startTutorialRun = () => {
    if (!squadReady) {
      pushLog("Training squad incomplete. Assign all four operators before deployment.");
      return;
    }
    setOnboarding({ completed: false, step: "training" });
    launchMission("training_redglass", tutorialMission, { ignoreBranchMods: true });
  };

  const startMission = () => {
    if (!activeMission) return;
    pushLog(`${activeMission.title} begins. The first decision is how the squad lets this site know them.`);
    setMissionState((prev) => ({ ...prev, screen: "dock", beat: "dock" }));
  };

  const chooseRoute = (option: any, approach: { alertDelta: number; pressureDelta: number; reward: { salvage: number; intel: number; cores: number }; detailLog: string[] }) => {
    if (!activeMission) return;
    const resolved = resolveRouteOption(option, crew, ship);
    const mergedReward = {
      salvage: resolved.reward.salvage + (approach?.reward?.salvage || 0),
      intel: resolved.reward.intel + (approach?.reward?.intel || 0),
      cores: resolved.reward.cores + (approach?.reward?.cores || 0),
    };
    applyRouteRewards(mergedReward);
    if (option.routeIntel) {
      setShip((prev) => ({
        ...prev,
        routeIntel: {
          ...prev.routeIntel,
          ...(activeMission.id === "redglass" ? { redglassVector: option.routeIntel as string } : {}),
          ...(activeMission.id === "quarantine7" ? { quarantineVector: option.routeIntel as string } : {}),
        },
      }));
      pushLog(`Route intel secured: ${ROUTE_INTEL_TEXT[option.routeIntel]}`);
    }

    const preClockAlert = clamp(missionState.alert + resolved.alertDelta + (approach?.alertDelta || 0), 0, 4);
    const preClockPressure = clamp(missionState.pressure + resolved.pressureDelta + (approach?.pressureDelta || 0), 0, 10);
    const clockStep = resolveSealClockStep(missionState.sealClock, missionState.clockExpired, preClockAlert, preClockPressure, `${activeMission.title} route choice`);
    if (clockStep.log) pushLog(clockStep.log);
    const nextAlert = clockStep.alert;
    const nextPressure = clockStep.pressure;
    if (approach?.detailLog?.length) approach.detailLog.forEach((line) => pushLog(line));
    if (resolved.detail) pushLog(resolved.detail);
    pushLog(option.log);

    if (missionState.screen === "dock") {
      setMissionState((prev) => ({ ...prev, alert: nextAlert, pressure: nextPressure, sealClock: clockStep.sealClock, clockExpired: clockStep.clockExpired, screen: "relay", beat: "relay" }));
      return;
    }
    if (missionState.screen === "relay") {
      setMissionState((prev) => ({ ...prev, alert: nextAlert, pressure: nextPressure, sealClock: clockStep.sealClock, clockExpired: clockStep.clockExpired, screen: "core", beat: "core" }));
      return;
    }
    if (missionState.screen === "core") {
      const encounterTemplate = activeMission.encountersByAlert[Math.min(nextAlert, activeMission.encountersByAlert.length - 1)];
      pushLog(activeMission.id === "redglass" ? "The signal core comes free. Redglass starts controlling the squad's escape geometry." : activeMission.id === "quarantine7" ? "The vault reclassifies the team the instant the archive is touched." : "The signal cathedral stops behaving like a room and starts behaving like a conductor's box for the sector.");
      setMissionState((prev) => ({ ...prev, alert: nextAlert, pressure: nextPressure, sealClock: clockStep.sealClock, clockExpired: clockStep.clockExpired, encounterTemplate, screen: "encounter", beat: "encounter" }));
    }
  };

  const applyPostMissionRecoveryState = () => {
    setCrew((prev) => prev.map((member) => {
      const severe = member.hp <= 0 || member.hp <= Math.ceil(member.maxHp / 3) || member.stress >= 3;
      return { ...member, injured: member.injured || severe, scars: member.scars + (severe ? 1 : 0), hp: Math.max(1, member.hp) };
    }));
  };

  const resolveMissionOutcome = (outcome: Outcome, reason: string) => {
    if (!activeMission) return;
    applyPostMissionRecoveryState();
    const base = activeMission.rewardsOnSuccess;
    const rewards = outcome === "success" ? { ...base } : outcome === "partial" ? { salvage: Math.max(1, Math.ceil(base.salvage / 2)), intel: Math.max(1, Math.ceil(base.intel / 2)), cores: Math.floor(base.cores / 2) } : { salvage: 0, intel: 1, cores: 0 };
    setShip((prev) => ({
      ...prev,
      salvage: prev.salvage + rewards.salvage,
      intel: prev.intel + rewards.intel,
      cores: prev.cores + rewards.cores,
      missionOutcomes: { ...prev.missionOutcomes, [activeMission.id]: outcome },
      completedMissions: outcome === "failure" || prev.completedMissions.includes(activeMission.id) ? prev.completedMissions : [activeMission.id, ...prev.completedMissions],
      campaignHistory: [{ title: activeMission.title, result: outcome === "success" ? "Clean enough success" : outcome === "partial" ? "Messy extraction" : "Mission failure", alert: missionState.alert, pressure: missionState.pressure }, ...prev.campaignHistory],
      pendingInterludeId: prev.pendingInterludeId || INTERLUDE_EVENTS.find((event) => !prev.resolvedInterludes.includes(event.id))?.id || null,
    }));
    if (outcome !== "failure") grantMissionLoot(activeMission.id);
    pushLog(outcome === "success" ? `${activeMission.title} ends in a survivable success. The squad gets out with enough value to matter.` : outcome === "partial" ? `${activeMission.title} ends in a messy extraction. The squad escapes with something, but not cleanly.` : `${activeMission.title} ends in failure. The squad keeps the scars and the lessons, but not the win.`);
    if (!onboarding.completed) setOnboarding({ completed: true, step: "command" });
    setMissionState((prev) => ({ ...prev, screen: "aftermath", beat: "aftermath", outcome, failureReason: reason, resolutionRewards: rewards }));
  };

  const tryUpgrade = (upgrade: any) => {
    setShip((prev) => {
      const enough = prev.salvage >= (upgrade.cost.salvage || 0) && prev.intel >= (upgrade.cost.intel || 0) && prev.cores >= (upgrade.cost.cores || 0);
      if (!enough) return prev;
      const spent = { ...prev, salvage: prev.salvage - (upgrade.cost.salvage || 0), intel: prev.intel - (upgrade.cost.intel || 0), cores: prev.cores - (upgrade.cost.cores || 0) };
      return upgrade.apply(spent);
    });
    setChosenUpgrade(upgrade.id);
    pushLog(`${ship.name} installs ${upgrade.title}. The squad is becoming a deeper-range machine.`);
  };

  const quickRecovery = () => {
    setCrew((prev) => prev.map((member) => ({ ...member, hp: Math.min(member.maxHp, member.hp + 2 + ship.medbay + (member.gear.kit?.id === "purge_kit" ? 1 : 0)), stress: Math.max(0, member.stress - 1) })));
    pushLog("Ashwake runs a quick recovery cycle. The squad stabilizes, but real injuries remain.");
  };

  const fullRecovery = () => {
    if (ship.temporaryOps.freeFullRecovery > 0) {
      setShip((prev) => ({ ...prev, temporaryOps: { ...prev.temporaryOps, freeFullRecovery: prev.temporaryOps.freeFullRecovery - 1 } }));
      setCrew((prev) => prev.map((member) => ({ ...member, hp: Math.min(member.maxHp, member.hp + 5 + ship.medbay), stress: Math.max(0, member.stress - 2), injured: false })));
      pushLog("Ashwake cashes in stored emergency supplies for a free full recovery cycle.");
      return;
    }
    if (ship.salvage < 1) {
      pushLog("Not enough salvage for full recovery. The squad will have to limp or heal the hard way.");
      return;
    }
    setShip((prev) => ({ ...prev, salvage: prev.salvage - 1 }));
    setCrew((prev) => prev.map((member) => ({ ...member, hp: Math.min(member.maxHp, member.hp + 5 + ship.medbay), stress: Math.max(0, member.stress - 2), injured: false })));
    pushLog("Ashwake commits a full recovery cycle. One salvage worth of supplies buys the squad back real readiness.");
  };

  const completeTutorialFatality = () => {
    const freshCrew = deepClone(STARTING_CREW);
    setCrew(freshCrew);
    setSelectedCrew(freshCrew[0].id);
    setMissionState(deepClone(DEFAULT_MISSION_STATE));
    setOnboarding({ completed: true, step: "command" });
    pushLog("Training squad lost to a final vacuum mistake. Command deck unlocked. Build a real squad and go do it for real.");
  };

  const returnToHub = () => {
    setMissionState(deepClone(DEFAULT_MISSION_STATE));
    pushLog("The squad returns to Ashwake. The dead zone is still there. Now they can choose how to go back in.");
  };

  const [clientMode, setClientMode] = useState<"command" | "multiclient">("command");

  return (
    <div className="app-shell">
      <TopBar
        activeMission={Boolean(activeMission)}
        alert={missionState.alert}
        pressureLabel={activeMission?.pressureLabel || "Pressure"}
        pressure={missionState.pressure}
        sealClock={missionState.sealClock}
        clockExpired={missionState.clockExpired}
        crewStanding={crew.filter((member) => member.hp > 0).length}
        crewTotal={crew.length}
        beat={missionState.beat}
        shipName={ship.name}
        hull={ship.hull}
        medbay={ship.medbay}
        dmMode={dmMode}
        progress={progress}
        onToggleDm={() => setDmMode((prev) => !prev)}
        onExport={exportSave}
        onImport={() => fileInputRef.current?.click()}
        onReset={resetSave}
      />
      <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={importSave} />
      <div className="button-cluster" style={{ marginTop: 16 }}>
        <button className={`button ${clientMode === "command" ? "button-primary" : "button-secondary"}`} onClick={() => setClientMode("command")}>Command Deck View</button>
        <button className={`button ${clientMode === "multiclient" ? "button-primary" : "button-secondary"}`} onClick={() => setClientMode("multiclient")}>Per-Player Test Harness</button>
      </div>
      {clientMode === "multiclient" ? (
        <div style={{ marginTop: 24 }}>
          <MulticlientFoundation />
        </div>
      ) : (
      <div className={`content-grid ${onboardingFocused ? "content-grid-focus" : ""}`}>
        <div className="stack-large">
          {missionState.screen === "hub" && (
            <>
              {onboardingActive && onboarding.step === "start" && <TutorialStartPanel onBegin={beginTrainingBuilder} onSkip={skipToCommandDeck} />}
              {onboardingActive && onboarding.step === "builder" && <TutorialBuilderPanel crew={crew} onUpdateCrew={updateCrewBuild} squadReady={squadReady} onContinue={startTutorialRun} onAutoSuggest={autoSuggestTrainingSquad} doctrineUnlocks={doctrineUnlocks} />}
              {!onboardingActive && availableInterlude && <InterludePanel event={availableInterlude} onResolve={resolveInterlude} />}
              {!onboardingActive && <PlayerDesignerPanel crew={crew} onUpdateCrew={updateCrewBuild} doctrineUnlocks={doctrineUnlocks} />}
              {!onboardingActive && <RecoveryPanel crew={crew} ship={ship} onQuickRecovery={quickRecovery} onFullRecovery={fullRecovery} />}
              {!onboardingActive && <LoadoutPanel crew={crew} ship={ship} onEquip={equipItem} />}
              {!onboardingActive && <EquipmentDoctrinePanel />}
              {!onboardingActive && <CampaignMapPanel routeIntel={ship.routeIntel} missionCatalog={MISSION_CATALOG} missionUnlocked={missionUnlocked} completedMissionIds={completedMissionIds} hasBrokenChoirAccess={hasBrokenChoirAccess} onStartMission={startMissionFromHub} ship={ship} />}
            </>
          )}
          {missionState.screen === "briefing" && activeMission && <MissionBriefing mission={activeMission} tutorialGuide={tutorialBriefingGuide} onStartMission={startMission} onAddPrep={() => pushLog(`Prep: The squad checks tethers, seals, comm discipline, and extraction priorities before entering ${activeMission.title}.`)} />}
          {missionState.screen === "dock" && activeMission && <RouteBeat title="Entry Profile" icon={<DoorOpen size={14} />} copy="Choose how the squad lets this site know them. These options now actually resolve based on who your squad is and how ready the ship is." options={activeMission.routeMap.dock} onChoose={chooseRoute} pressureLabel={activeMission.pressureLabel} crew={crew} ship={ship} tutorialGuide={tutorialRouteGuide("dock")} />}
          {missionState.screen === "relay" && activeMission && <RouteBeat title="Mid-Route Problem" icon={<ScanLine size={14} />} copy="Quiet intelligence, vacuum discipline, and route control should matter more than raw violence." options={activeMission.routeMap.relay} onChoose={chooseRoute} pressureLabel={activeMission.pressureLabel} crew={crew} ship={ship} tutorialGuide={tutorialRouteGuide("relay")} />}
          {missionState.screen === "core" && activeMission && <RouteBeat title="Core Approach" icon={<Cpu size={14} />} copy="Touching the objective changes what the site values. The final route also determines which deeper-path intel makes it home." options={activeMission.routeMap.core} onChoose={chooseRoute} pressureLabel={activeMission.pressureLabel} crew={crew} ship={ship} tutorialGuide={tutorialRouteGuide("core")} />}
          {missionState.screen === "encounter" && activeMission && missionState.encounterTemplate && <TacticalBoard crew={crew} setCrew={setCrew} encounter={missionState.encounterTemplate} mission={activeMission} ship={ship} alert={missionState.alert} pressure={missionState.pressure} sealClock={missionState.sealClock} clockExpired={missionState.clockExpired} setAlertPressure={(a, p) => setMissionState((prev) => ({ ...prev, alert: a, pressure: p }))} onSealState={(clock, expired) => setMissionState((prev) => ({ ...prev, sealClock: clock, clockExpired: expired }))} pushLog={pushLog} onResolveMission={resolveMissionOutcome} />}
          {missionState.screen === "aftermath" && activeMission && <AftermathPanel mission={activeMission} missionState={missionState} nextLabel={tutorialMissionActive ? "Accept Loss // Open Command Deck" : "Go to Ship / Upgrade Loop"} onNext={() => tutorialMissionActive ? completeTutorialFatality() : setMissionState((prev) => ({ ...prev, screen: "ship", beat: "ship" }))} />}
          {missionState.screen === "ship" && <ShipPanel ship={ship} chosenUpgrade={chosenUpgrade} tryUpgrade={tryUpgrade} goHub={returnToHub} upgrades={SHIP_UPGRADES} />}
        </div>
        {!onboardingFocused && <Sidebar crew={crew} selectedCrew={selectedMember} onSelectCrew={setSelectedCrew} logs={logs} ship={ship} dmMode={dmMode} missionState={missionState} pushLog={pushLog} setMissionState={setMissionState} />}
      </div>
      )}
    </div>
  );
}
