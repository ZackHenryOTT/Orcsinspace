import { useEffect, useMemo, useState } from "react";

type RoomType = "briefing" | "movement" | "route" | "traversal" | "combat" | "escape" | "fatal";
type RoomId = "dock" | "entry" | "spine" | "gap" | "core" | "extract" | "fatal";
type Lane = "front" | "cover" | "back";
type Role = "Vanguard" | "Signal Hacker" | "Marksman" | "Engineer / Tech";

type PlayerClient = {
  id: string;
  callsign: string;
  role: Role;
  family: string;
  suit: string;
  weapon: string;
  lane: Lane;
  roomId: RoomId;
  zoneIndex: number;
  hp: number;
  oxygen: number;
  power: number;
  heat: number;
  stress: number;
  tethered: boolean;
  braced: boolean;
};

type RoomMeta = {
  id: RoomId;
  title: string;
  type: RoomType;
  short: string;
  lesson: string;
  objective: string;
  zones: string[];
};

type RoomState = {
  stability: number;
  exposure: number;
  support: number;
  sweepRead: boolean;
  objectiveSecured: boolean;
  problemHits: number;
  fatalMistake: boolean;
};

type ActionDef = {
  id: string;
  label: string;
  why: string;
  tone: "good" | "bad" | "neutral";
  enabled?: boolean;
  disabledText?: string;
  apply: () => void;
};

const ROOMS: RoomMeta[] = [
  { id: "dock", title: "Dock Collar", type: "briefing", short: "Final clean briefing before the seal breaks.", lesson: "This is the last safe room. Once the seal breaks, the level starts pushing back.", objective: "Get the squad stacked on the inner seal and start the run.", zones: ["Staging Rack", "Seal Console", "Threshold"] },
  { id: "entry", title: "Entry Lock", type: "movement", short: "Movement order matters as the clock starts biting.", lesson: "You do not need everybody doing everything. You need the right people doing the right things.", objective: "Move all operators through the lock without wasting the first clean window.", zones: ["Outer Lock", "Inner Lock", "Service Threshold"] },
  { id: "spine", title: "Sensor Spine", type: "route", short: "Timing, sightlines, and bad greed.", lesson: "Every extra setup action costs time. Time makes the room smarter.", objective: "Thread the sweep lane and get the whole squad to far cover.", zones: ["Near Cover", "Sweep Lane", "Center Span", "Far Cover"] },
  { id: "gap", title: "Crosswind Gap", type: "traversal", short: "Vacuum traversal and tether discipline.", lesson: "Wings are control surfaces here, not free flight. Tethers stop stupid deaths.", objective: "Cross the breach with enough stability to keep the squad intact.", zones: ["Near Anchor", "Broken Span", "Hazard Rail", "Far Brace"] },
  { id: "core", title: "Signal Core Room", type: "combat", short: "Contained tactical pressure room.", lesson: "Combat is there to let you extract the objective, not to flatter your ego.", objective: "Kill the room's control problem, secure the core, and fall back to the exit lane.", zones: ["Breach Door", "Kill Lane", "Core Pedestal", "Exit Door"] },
  { id: "extract", title: "Extraction Run", type: "escape", short: "The path back is uglier than the path in.", lesson: "Winning the room means nothing if you die getting out.", objective: "Move the whole squad to the service junction with the objective intact.", zones: ["Return Choke", "Sliding Shutters", "Open Run", "Service Junction"] },
  { id: "fatal", title: "Outer Service Arm", type: "fatal", short: "The final bad-decision lesson.", lesson: "One rushed extraction choice can kill a squad that 'won' every previous room.", objective: "Choose whether to stay disciplined or cut the corner and learn why that kills people.", zones: ["Outer Hatch", "Service Arm", "Broken Rail", "Void Edge"] },
];

const ROOM_BY_ID = Object.fromEntries(ROOMS.map((room) => [room.id, room])) as Record<RoomId, RoomMeta>;
const ROOM_INDEX = Object.fromEntries(ROOMS.map((room, index) => [room.id, index])) as Record<RoomId, number>;

const INITIAL_PLAYERS: PlayerClient[] = [
  { id: "p1", callsign: "Operator 1", role: "Vanguard", family: "Metallic", suit: "Breach", weapon: "Coil Carbine", lane: "front", roomId: "dock", zoneIndex: 0, hp: 18, oxygen: 100, power: 4, heat: 0, stress: 0, tethered: false, braced: false },
  { id: "p2", callsign: "Operator 2", role: "Signal Hacker", family: "Gem", suit: "Relay", weapon: "Laser Intercept", lane: "cover", roomId: "dock", zoneIndex: 0, hp: 12, oxygen: 100, power: 5, heat: 0, stress: 0, tethered: false, braced: false },
  { id: "p3", callsign: "Operator 3", role: "Marksman", family: "Chromatic", suit: "Vector", weapon: "Coil Marksman", lane: "back", roomId: "dock", zoneIndex: 0, hp: 13, oxygen: 100, power: 4, heat: 0, stress: 0, tethered: false, braced: false },
  { id: "p4", callsign: "Operator 4", role: "Engineer / Tech", family: "Metallic", suit: "Containment", weapon: "Slug Utility", lane: "cover", roomId: "dock", zoneIndex: 0, hp: 14, oxygen: 100, power: 5, heat: 0, stress: 0, tethered: false, braced: false },
];

function createRoomState(): Record<RoomId, RoomState> {
  return Object.fromEntries(ROOMS.map((room) => [room.id, { stability: room.type === "briefing" ? 2 : 0, exposure: 0, support: 0, sweepRead: false, objectiveSecured: false, problemHits: 0, fatalMistake: false }])) as Record<RoomId, RoomState>;
}

function clamp(value: number, low: number, high: number) {
  return Math.max(low, Math.min(high, value));
}

function nextRoom(roomId: RoomId) {
  const nextIndex = Math.min(ROOM_INDEX[roomId] + 1, ROOMS.length - 1);
  return ROOMS[nextIndex].id;
}

function laneTone(lane: Lane) {
  if (lane === "front") return "lane-front";
  if (lane === "cover") return "lane-cover";
  return "lane-back";
}

function toneClass(tone: ActionDef["tone"]) {
  if (tone === "good") return "route-card tone-good";
  if (tone === "bad") return "route-card tone-bad";
  return "route-card";
}

function roomComplete(room: RoomMeta, players: PlayerClient[], roomState: RoomState) {
  const finalZone = room.zones.length - 1;
  if (room.type === "combat") return roomState.objectiveSecured && players.every((player) => player.zoneIndex >= finalZone);
  if (room.type === "fatal") return roomState.fatalMistake || players.every((player) => player.zoneIndex >= finalZone);
  return players.every((player) => player.zoneIndex >= finalZone);
}

export function MulticlientFoundation() {
  const [selectedClient, setSelectedClient] = useState<string>("dm");
  const [players, setPlayers] = useState<PlayerClient[]>(INITIAL_PLAYERS);
  const [roomState, setRoomState] = useState<Record<RoomId, RoomState>>(createRoomState());
  const [currentRoomId, setCurrentRoomId] = useState<RoomId>("dock");
  const [sealClock, setSealClock] = useState(7);
  const [pressure, setPressure] = useState(0);
  const [round, setRound] = useState(1);
  const [turnOrder] = useState(INITIAL_PLAYERS.map((player) => player.id));
  const [turnIndex, setTurnIndex] = useState(0);
  const [turnTimeLeft, setTurnTimeLeft] = useState(14);
  const [missionEnded, setMissionEnded] = useState(false);
  const [log, setLog] = useState<string[]>([
    "Training run loaded.",
    "This is the real architecture: each player sees only their own operator view, while the DM sees the whole room state.",
    "The level is room-and-zone based. Players move through a place, not a list of abstract buttons.",
  ]);

  const room = ROOM_BY_ID[currentRoomId];
  const currentRs = roomState[currentRoomId];
  const activeTurnId = turnOrder[turnIndex] || INITIAL_PLAYERS[0].id;
  const activePlayer = players.find((player) => player.id === activeTurnId) || players[0];
  const visiblePlayer = players.find((player) => player.id === selectedClient) || players[0];
  const roomPlayers = useMemo(() => players.filter((player) => player.roomId === currentRoomId), [players, currentRoomId]);

  const pushLog = (text: string) => setLog((prev) => [text, ...prev].slice(0, 18));

  const resetRun = () => {
    setSelectedClient("dm");
    setPlayers(INITIAL_PLAYERS.map((player) => ({ ...player })));
    setRoomState(createRoomState());
    setCurrentRoomId("dock");
    setSealClock(7);
    setPressure(0);
    setRound(1);
    setTurnIndex(0);
    setTurnTimeLeft(14);
    setMissionEnded(false);
    setLog([
      "Training run reset.",
      "The level is room-and-zone based. Players move through a place, not a list of abstract buttons.",
    ]);
  };

  const finishTurn = (label: string, actorId: string, customLog?: string) => {
    const actor = players.find((player) => player.id === actorId);
    if (!actor) return;
    pushLog(customLog || `${actor.callsign} commits ${label}.`);

    const maybeUpdatedRoomPlayers = players.filter((player) => player.roomId === currentRoomId);
    if (roomComplete(room, maybeUpdatedRoomPlayers, roomState[currentRoomId])) {
      if (room.type === "fatal" && roomState[currentRoomId].fatalMistake) {
        setMissionEnded(true);
        pushLog("The lesson lands: surviving the room is not the same thing as surviving the mission. The squad dies because extraction discipline broke first.");
        return;
      }
      const next = nextRoom(currentRoomId);
      if (next !== currentRoomId) {
        setCurrentRoomId(next);
        setPlayers((prev) => prev.map((player) => ({ ...player, roomId: next, zoneIndex: 0, tethered: false, braced: false })));
        pushLog(`${room.title} gives way to ${ROOM_BY_ID[next].title}. The squad keeps moving because standing still is how the site wins.`);
      }
    }

    const nextIndex = (turnIndex + 1) % turnOrder.length;
    setTurnIndex(nextIndex);
    setTurnTimeLeft(14);

    if (nextIndex === 0) {
      setRound((prev) => prev + 1);
      setSealClock((prev) => clamp(prev - 1, 0, 10));
      setPressure((prev) => clamp(prev + 1, 0, 10));
      setRoomState((prev) => {
        const copy = { ...prev };
        const rs = { ...copy[currentRoomId] };
        if (room.type !== "briefing") rs.exposure = clamp(rs.exposure + 1, 0, 8);
        if (room.type === "route" && !rs.sweepRead) rs.exposure = clamp(rs.exposure + 1, 0, 8);
        if (room.type === "traversal" && rs.stability <= 0) rs.exposure = clamp(rs.exposure + 1, 0, 8);
        if (room.type === "combat" && !rs.objectiveSecured) rs.problemHits = clamp(rs.problemHits + 1, 0, 3);
        rs.support = Math.max(0, rs.support - 1);
        copy[currentRoomId] = rs;
        return copy;
      });
      pushLog("Site reaction: the room tightens. Every extra round makes the level meaner.");
    }
  };

  useEffect(() => {
    if (missionEnded) return;
    const timer = window.setInterval(() => setTurnTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [missionEnded, activeTurnId]);

  useEffect(() => {
    if (missionEnded || turnTimeLeft > 0) return;
    pushLog(`${activePlayer.callsign} hesitates too long and loses the turn. The room keeps moving.`);
    const nextIndex = (turnIndex + 1) % turnOrder.length;
    setTurnIndex(nextIndex);
    setTurnTimeLeft(14);
    if (nextIndex === 0) {
      setRound((prev) => prev + 1);
      setSealClock((prev) => clamp(prev - 1, 0, 10));
      setPressure((prev) => clamp(prev + 1, 0, 10));
    }
  }, [turnTimeLeft, missionEnded, turnIndex, activePlayer.callsign]);

  const moveOneZone = (playerId: string, oxygenCost: number, logText: string) => {
    setPlayers((prev) => prev.map((player) => player.id === playerId ? { ...player, zoneIndex: clamp(player.zoneIndex + 1, 0, room.zones.length - 1), oxygen: clamp(player.oxygen - oxygenCost, 0, 100) } : player));
    finishTurn("Move", playerId, logText);
  };

  const currentActions = (player: PlayerClient): ActionDef[] => {
    const rs = roomState[currentRoomId];
    const common: ActionDef[] = [
      {
        id: "steady",
        label: "Keep Formation",
        why: "Spend your turn helping the squad stay disciplined instead of piling on random extra actions.",
        tone: "good",
        apply: () => {
          setRoomState((prev) => ({ ...prev, [currentRoomId]: { ...prev[currentRoomId], stability: clamp(prev[currentRoomId].stability + 1, 0, 6), exposure: clamp(prev[currentRoomId].exposure - 1, 0, 8) } }));
          finishTurn("Keep Formation", player.id, `${player.callsign} spends the turn keeping the squad disciplined and the room from getting free hits.`);
        },
      },
    ];

    if (room.type === "briefing") {
      return [
        {
          id: "move-seal",
          label: player.zoneIndex < 1 ? "Move to Seal Console" : "Move to Threshold",
          why: "First get into position. The mission should start because the squad is aligned enough, not because everybody clicked every helpful thing.",
          tone: "neutral",
          apply: () => moveOneZone(player.id, 0, `${player.callsign} moves into position at the seal.`),
        },
        {
          id: "break-seal",
          label: "Break Seal",
          why: "This starts the mission. Once the seal breaks, every round matters.",
          tone: "bad",
          enabled: player.zoneIndex >= 1,
          disabledText: "Get to the seal console first.",
          apply: () => {
            setPlayers((prev) => prev.map((entry) => entry.id === player.id ? { ...entry, zoneIndex: room.zones.length - 1 } : entry));
            finishTurn("Break Seal", player.id, `${player.callsign} breaks the seal. The room stops being passive and starts reacting.`);
          },
        },
        ...common,
      ];
    }

    if (room.type === "movement") {
      return [
        {
          id: "advance",
          label: "Advance One Zone",
          why: "You move because moving is the mission. Use this when the room is still readable.",
          tone: "neutral",
          apply: () => moveOneZone(player.id, 1, `${player.callsign} advances through the lock instead of wasting the first clean window.`),
        },
        {
          id: "scan",
          label: "Read the Entry",
          why: "Good when the next move matters more than raw speed. It should not be spammed forever because the clock still burns.",
          tone: "good",
          enabled: player.power > 0,
          disabledText: "Not enough power.",
          apply: () => {
            setPlayers((prev) => prev.map((entry) => entry.id === player.id ? { ...entry, power: clamp(entry.power - 1, 0, 6) } : entry));
            setRoomState((prev) => ({ ...prev, [currentRoomId]: { ...prev[currentRoomId], stability: clamp(prev[currentRoomId].stability + 1, 0, 6), exposure: clamp(prev[currentRoomId].exposure - 1, 0, 8) } }));
            finishTurn("Read the Entry", player.id, `${player.callsign} spends power to make the next move safer.`);
          },
        },
        {
          id: "cover",
          label: "Cover the Move",
          why: "Useful when another operator is about to move. It buys them a cleaner commit instead of piling up vanity setup.",
          tone: "good",
          apply: () => {
            setRoomState((prev) => ({ ...prev, [currentRoomId]: { ...prev[currentRoomId], support: clamp(prev[currentRoomId].support + 1, 0, 2) } }));
            finishTurn("Cover the Move", player.id, `${player.callsign} sets a cleaner line for the next operator instead of doing everything themselves.`);
          },
        },
        ...common,
      ];
    }

    if (room.type === "route") {
      return [
        {
          id: "advance-cover",
          label: "Move by Cover",
          why: "Default good play: move, but only as hard as the room currently allows.",
          tone: "neutral",
          apply: () => {
            setPlayers((prev) => prev.map((entry) => entry.id === player.id ? { ...entry, zoneIndex: clamp(entry.zoneIndex + 1, 0, room.zones.length - 1), oxygen: clamp(entry.oxygen - 2, 0, 100) } : entry));
            setRoomState((prev) => ({ ...prev, [currentRoomId]: { ...prev[currentRoomId], exposure: clamp(prev[currentRoomId].exposure + Math.max(0, 1 - prev[currentRoomId].support - (prev[currentRoomId].sweepRead ? 1 : 0)), 0, 8), support: Math.max(0, prev[currentRoomId].support - 1) } }));
            finishTurn("Move by Cover", player.id, `${player.callsign} moves through the spine without pretending the room is free.`);
          },
        },
        {
          id: "read-sweep",
          label: "Read Sweep Timing",
          why: "This is the one prep action the room actually rewards. It should help the next move, not replace the need to move.",
          tone: "good",
          enabled: player.power > 0 && !rs.sweepRead,
          disabledText: rs.sweepRead ? "The sweep has already been read." : "Not enough power.",
          apply: () => {
            setPlayers((prev) => prev.map((entry) => entry.id === player.id ? { ...entry, power: clamp(entry.power - 1, 0, 6) } : entry));
            setRoomState((prev) => ({ ...prev, [currentRoomId]: { ...prev[currentRoomId], sweepRead: true, stability: clamp(prev[currentRoomId].stability + 1, 0, 6), exposure: clamp(prev[currentRoomId].exposure - 1, 0, 8) } }));
            finishTurn("Read Sweep Timing", player.id, `${player.callsign} times the sweep and buys the squad one cleaner move.`);
          },
        },
        {
          id: "cover-spine",
          label: "Cover the Sweep Lane",
          why: "Set support for the next move instead of having everyone greedily prep themselves.",
          tone: "good",
          apply: () => {
            setRoomState((prev) => ({ ...prev, [currentRoomId]: { ...prev[currentRoomId], support: clamp(prev[currentRoomId].support + 1, 0, 2) } }));
            finishTurn("Cover the Sweep Lane", player.id, `${player.callsign} covers the lane so the next operator can move cleaner.`);
          },
        },
        ...common,
      ];
    }

    if (room.type === "traversal") {
      return [
        {
          id: "tether",
          label: player.tethered ? "Check Tether" : "Anchor Tether",
          why: "Forced movement kills careless squads faster than damage does. This is here to stop dumb deaths, not to look cool.",
          tone: "good",
          enabled: player.power > 0,
          disabledText: "Not enough power.",
          apply: () => {
            setPlayers((prev) => prev.map((entry) => entry.id === player.id ? { ...entry, tethered: true, power: clamp(entry.power - 1, 0, 6) } : entry));
            setRoomState((prev) => ({ ...prev, [currentRoomId]: { ...prev[currentRoomId], stability: clamp(prev[currentRoomId].stability + 1, 0, 6) } }));
            finishTurn("Anchor Tether", player.id, `${player.callsign} clips in before the crossing gets a chance to punish arrogance.`);
          },
        },
        {
          id: "brace",
          label: player.braced ? "Maintain Wing Brace" : "Wing Brace",
          why: "Wings help you brake and stabilize here. They do not make vacuum crossing free.",
          tone: "good",
          enabled: player.power > 0,
          disabledText: "Not enough power.",
          apply: () => {
            setPlayers((prev) => prev.map((entry) => entry.id === player.id ? { ...entry, braced: true, power: clamp(entry.power - 1, 0, 6) } : entry));
            setRoomState((prev) => ({ ...prev, [currentRoomId]: { ...prev[currentRoomId], exposure: clamp(prev[currentRoomId].exposure - 1, 0, 8) } }));
            finishTurn("Wing Brace", player.id, `${player.callsign} braces for control instead of pretending wings are flight.`);
          },
        },
        {
          id: "drift",
          label: "Drift One Segment",
          why: "You are here to cross. Setup only matters if it buys you a better commit.",
          tone: "neutral",
          apply: () => {
            const protectedCrossing = player.tethered || player.braced || rs.support > 0;
            setPlayers((prev) => prev.map((entry) => entry.id === player.id ? { ...entry, zoneIndex: clamp(entry.zoneIndex + 1, 0, room.zones.length - 1), oxygen: clamp(entry.oxygen - 4, 0, 100), stress: entry.stress + (protectedCrossing ? 0 : 1) } : entry));
            setRoomState((prev) => ({ ...prev, [currentRoomId]: { ...prev[currentRoomId], exposure: clamp(prev[currentRoomId].exposure + (protectedCrossing ? 1 : 2), 0, 8), support: Math.max(0, prev[currentRoomId].support - 1) } }));
            finishTurn("Drift One Segment", player.id, `${player.callsign} commits to the crossing. The room finally gets to answer back.`);
          },
        },
        ...common,
      ];
    }

    if (room.type === "combat") {
      return [
        {
          id: "push-lane",
          label: "Push One Zone",
          why: "You move toward the actual problem instead of standing in the doorway clicking every useful button.",
          tone: "neutral",
          apply: () => moveOneZone(player.id, 1, `${player.callsign} pushes deeper into the room instead of trying to solve it from safety.`),
        },
        {
          id: "solve-problem",
          label: player.role === "Signal Hacker" ? "Disrupt Control Logic" : player.role === "Engineer / Tech" ? "Collapse Route Control" : "Suppress the Problem",
          why: "Hit the thing making the room worse. Better doctrine than trying to clean out every body in sight.",
          tone: "bad",
          enabled: player.power > 0 || player.role === "Marksman" || player.role === "Vanguard",
          disabledText: "No usable power left.",
          apply: () => {
            if (player.role === "Signal Hacker" || player.role === "Engineer / Tech") setPlayers((prev) => prev.map((entry) => entry.id === player.id ? { ...entry, power: clamp(entry.power - 1, 0, 6) } : entry));
            setRoomState((prev) => ({ ...prev, [currentRoomId]: { ...prev[currentRoomId], problemHits: clamp(prev[currentRoomId].problemHits + 1, 0, 3) } }));
            setPressure((prev) => clamp(prev - 1, 0, 10));
            finishTurn("Solve the Problem", player.id, `${player.callsign} attacks the thing shaping the room instead of farming meaningless kills.`);
          },
        },
        {
          id: "secure-core",
          label: "Secure Core",
          why: "Only do this once the room's control problem is handled and someone has actually reached the pedestal.",
          tone: "good",
          enabled: player.zoneIndex >= 2 && rs.problemHits >= 2,
          disabledText: player.zoneIndex < 2 ? "Get to the core pedestal first." : "The room's control problem is still live.",
          apply: () => {
            setRoomState((prev) => ({ ...prev, [currentRoomId]: { ...prev[currentRoomId], objectiveSecured: true } }));
            finishTurn("Secure Core", player.id, `${player.callsign} secures the objective. Combat was only the middle of the mission.`);
          },
        },
        {
          id: "fall-back",
          label: "Fall Back to Exit",
          why: "Once the core is secure, leaving is smarter than posturing.",
          tone: "good",
          enabled: rs.objectiveSecured,
          disabledText: "The objective is not secured yet.",
          apply: () => moveOneZone(player.id, 1, `${player.callsign} starts the pullback instead of overstaying in a room that already taught its lesson.`),
        },
        ...common,
      ];
    }

    if (room.type === "escape") {
      return [
        {
          id: "move-objective",
          label: "Move the Objective One Zone",
          why: "This is the real win condition. Move the objective and the squad, not your ego.",
          tone: "good",
          apply: () => {
            setPlayers((prev) => prev.map((entry) => entry.id === player.id ? { ...entry, zoneIndex: clamp(entry.zoneIndex + 1, 0, room.zones.length - 1), oxygen: clamp(entry.oxygen - 3, 0, 100) } : entry));
            setRoomState((prev) => ({ ...prev, [currentRoomId]: { ...prev[currentRoomId], stability: clamp(prev[currentRoomId].stability + 1, 0, 6) } }));
            finishTurn("Move the Objective", player.id, `${player.callsign} keeps extraction disciplined instead of trying to look heroic.`);
          },
        },
        {
          id: "rush",
          label: "Rush One Extra Segment",
          why: "Tempting when the clock is ugly. Risky because speed creates mistakes and shreds discipline.",
          tone: "bad",
          apply: () => {
            setPlayers((prev) => prev.map((entry) => entry.id === player.id ? { ...entry, zoneIndex: clamp(entry.zoneIndex + 2, 0, room.zones.length - 1), oxygen: clamp(entry.oxygen - 6, 0, 100), stress: entry.stress + 1 } : entry));
            setRoomState((prev) => ({ ...prev, [currentRoomId]: { ...prev[currentRoomId], exposure: clamp(prev[currentRoomId].exposure + 2, 0, 8) } }));
            finishTurn("Rush One Extra Segment", player.id, `${player.callsign} buys speed with future consequences. The room notices greed.`);
          },
        },
        ...common,
      ];
    }

    return [
      {
        id: "discipline",
        label: "Reclip and Collapse Wings",
        why: "This is the right call. The room appears solved, but vacuum still wins if discipline breaks.",
        tone: "good",
        apply: () => moveOneZone(player.id, 3, `${player.callsign} does the right thing and keeps the formation alive one more second.`),
      },
      {
        id: "cut-corner",
        label: "Cut the Corner",
        why: "This is the tempting bad decision: the room feels won, the clock feels ugly, and discipline looks optional.",
        tone: "bad",
        enabled: player.zoneIndex >= 1,
        disabledText: "Move onto the service arm first.",
        apply: () => {
          setRoomState((prev) => ({ ...prev, [currentRoomId]: { ...prev[currentRoomId], fatalMistake: true } }));
          finishTurn("Cut the Corner", player.id, `${player.callsign} cuts the corner. The training run finally teaches why surviving combat was never the real objective.`);
        },
      },
      ...common,
    ];
  };

  return (
    <div className="stack-large">
      <div className="hero-card theater-panel">
        <div className="hero-row">
          <div>
            <div className="eyebrow">Dead-Zone Ops // Multiclient Room Prototype</div>
            <h1 className="hero-title">Per-Player UI, DM Control, and a Real Tutorial Map</h1>
            <div className="hero-copy">This slice stays on one lane: separate device views, room-based tutorial spaces, turn cycling, and actual movement through zones instead of a shared squad dashboard clicking solved outcomes.</div>
          </div>
          <div className="status-stack">
            <div className="pill pill-warning">Turn clock • {turnTimeLeft}s</div>
            <div className="pill pill-dark">Round {round}</div>
            <div className={`pill ${sealClock <= 2 ? "pill-bad" : "pill-dark"}`}>Seal {sealClock}</div>
            <div className={`pill ${pressure >= 3 ? "pill-bad" : "pill-dark"}`}>Pressure {pressure}</div>
          </div>
        </div>
      </div>

      <div className="panel theater-panel">
        <div className="small-label">Local Multi-Client Test Harness</div>
        <div className="button-cluster">
          <button className={`button ${selectedClient === "dm" ? "button-warning" : "button-secondary"}`} onClick={() => setSelectedClient("dm")}>DM View</button>
          {players.map((player) => <button key={player.id} className={`button ${selectedClient === player.id ? "button-primary" : "button-secondary"}`} onClick={() => setSelectedClient(player.id)}>{player.callsign}{activeTurnId === player.id ? " • active" : ""}</button>)}
        </div>
      </div>

      <div className="panel theater-panel">
        <div className="small-label">Tutorial Level Layout</div>
        <div className="map-grid">
          {ROOMS.map((entry) => <div key={entry.id} className={`map-room ${entry.id === currentRoomId ? "map-room-active" : ""}`}><div className="micro-label">{entry.type}</div><div className="map-room-title">{entry.title}</div><div className="small-copy">{entry.short}</div><div className="compact-tags">{players.filter((player) => player.roomId === entry.id).map((player) => <div key={player.id} className="pill pill-dark">{player.callsign}</div>)}</div></div>)}
        </div>
      </div>

      {selectedClient === "dm" ? (
        <div className="panel theater-panel">
          <div className="operator-head"><div><div className="small-label">DM View</div><h2 className="operator-name">{room.title}</h2><div className="small-copy">{room.short}</div></div><div className="pill pill-warning">Active Turn: {activePlayer.callsign} • {turnTimeLeft}s</div></div>
          <div className="stats-grid">
            <StatusChip label="Seal Clock" value={sealClock} danger={sealClock <= 2} />
            <StatusChip label="Round" value={round} />
            <StatusChip label="Pressure" value={pressure} danger={pressure >= 3} />
            <StatusChip label="Stability" value={currentRs.stability} />
            <StatusChip label="Exposure" value={currentRs.exposure} danger={currentRs.exposure >= 4} />
          </div>
          <div className="sub-panel"><div className="small-label">Room objective</div><div className="panel-copy">{room.objective}</div></div>
          <div className="sub-panel"><div className="small-label">Live room geometry</div><div className="map-grid">{room.zones.map((zone, idx) => <div key={zone} className="map-room"><div className="map-room-title">{zone}</div><div className="compact-tags">{roomPlayers.filter((player) => player.zoneIndex === idx).map((player) => <div key={player.id} className={`pill ${laneTone(player.lane)}`}>{player.callsign}</div>)}</div></div>)}</div></div>
          <div className="dm-grid">
            <div className="sub-panel"><div className="small-label">Operator telemetry</div><div className="stack">{players.map((player) => <div key={player.id} className="crew-list-card"><div className="crew-list-head"><div><div className="crew-name">{player.callsign}</div><div className="small-copy">{player.role} • {room.zones[Math.min(player.zoneIndex, room.zones.length - 1)]}</div></div><div className={`pill ${laneTone(player.lane)}`}>{player.lane}</div></div><div className="meter-row"><div className="pill pill-dark">HP {player.hp}</div><div className="pill pill-dark">O₂ {player.oxygen}</div><div className="pill pill-dark">PWR {player.power}</div><div className="pill pill-dark">Heat {player.heat}</div></div></div>)}</div></div>
            <div className="sub-panel"><div className="small-label">Event log</div><div className="stack">{log.map((entry, idx) => <div key={idx} className="log-entry">{entry}</div>)}</div></div>
          </div>
        </div>
      ) : (
        <div className="panel theater-panel">
          <div className="operator-head"><div><div className="small-label">Player View</div><h2 className="operator-name">{visiblePlayer.callsign}</h2><div className={`small-copy ${laneTone(visiblePlayer.lane)}`}>{visiblePlayer.role} • {visiblePlayer.family}</div></div><div className={`pill ${visiblePlayer.id === activeTurnId && !missionEnded ? "pill-good" : "pill-dark"}`}>{visiblePlayer.id === activeTurnId && !missionEnded ? `Your turn • ${turnTimeLeft}s` : "Waiting"}</div></div>
          <div className="stats-grid">
            <StatusChip label="Room" value={room.title} />
            <StatusChip label="HP" value={visiblePlayer.hp} danger={visiblePlayer.hp <= 6} />
            <StatusChip label="Oxygen" value={visiblePlayer.oxygen} danger={visiblePlayer.oxygen <= 40} />
            <StatusChip label="Power" value={visiblePlayer.power} danger={visiblePlayer.power <= 1} />
            <StatusChip label="Seal" value={sealClock} danger={sealClock <= 2} />
          </div>
          <div className="sub-panel"><div className="small-label">What this room is teaching</div><div className="panel-copy">{room.lesson}</div></div>
          <div className="sub-panel"><div className="small-label">Objective</div><div className="panel-copy">{room.objective}</div></div>
          <div className="sub-panel"><div className="small-label">Your current position</div><div className="map-grid">{room.zones.map((zone, idx) => <div key={zone} className={`map-room ${idx === visiblePlayer.zoneIndex ? "map-room-active" : ""}`}><div className="map-room-title">{zone}</div></div>)}</div><div className="compact-tags"><div className={`pill ${laneTone(visiblePlayer.lane)}`}>{visiblePlayer.lane}</div>{visiblePlayer.tethered && <div className="pill pill-good">Tethered</div>}{visiblePlayer.braced && <div className="pill pill-info">Braced</div>}<div className="pill pill-dark">{visiblePlayer.suit}</div><div className="pill pill-dark">{visiblePlayer.weapon}</div></div></div>
          <div className="sub-panel"><div className="small-label">Room state you can feel</div><div className="meter-row"><div className="pill pill-dark">Stability {currentRs.stability}</div><div className={`pill ${currentRs.exposure >= 4 ? "pill-bad" : "pill-dark"}`}>Exposure {currentRs.exposure}</div><div className="pill pill-dark">Support {currentRs.support}</div></div></div>
          <div className="sub-panel"><div className="small-label">Comms</div><div className="stack">{players.filter((player) => player.id !== visiblePlayer.id).map((player) => <div key={player.id} className="log-entry">{player.callsign}: {ROOM_BY_ID[player.roomId].title} // {ROOM_BY_ID[player.roomId].zones[player.zoneIndex]}</div>)}</div></div>
          <div className="stack-large"><div className="small-label">Your actions</div>{currentActions(visiblePlayer).map((action) => <div key={action.id} className={toneClass(action.tone)}><div className="route-head"><div><div className="route-title">{action.label}</div><div className="small-copy">{action.why}</div>{action.enabled === false && <div className="danger-note">{action.disabledText || "Unavailable right now."}</div>}</div><button className={`button ${visiblePlayer.id === activeTurnId && action.enabled !== false && !missionEnded ? "button-primary" : "button-secondary"}`} disabled={visiblePlayer.id !== activeTurnId || action.enabled === false || missionEnded} onClick={action.apply}>Commit</button></div></div>)}</div>
        </div>
      )}

      {missionEnded && <div className="panel theater-panel" style={{ borderColor: "rgba(248,113,113,.5)" }}><div className="small-label">Tutorial Lesson</div><h2 className="operator-name">You survived the room. Space killed you anyway.</h2><div className="panel-copy">The squad dies because one final extraction decision treated vacuum like flavor instead of a lethal rule. This campaign is about getting out alive, not just winning the fight in front of you.</div><div className="button-cluster" style={{ marginTop: 16 }}><button className="button button-primary" onClick={resetRun}>Reset Training Run</button></div></div>}
    </div>
  );
}

function StatusChip({ label, value, danger = false }: { label: string; value: string | number; danger?: boolean }) {
  return <div className={`header-stat ${danger ? "status-danger" : ""}`}><div className="header-stat-label">{label}</div><div className="header-stat-value">{value}</div></div>;
}
