import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Clock3, Eye, Lock, Radio, Target, Users, Wind, Wrench } from "lucide-react";

type RoomId = "dock" | "entry" | "spine" | "pocket" | "gap" | "core" | "extract" | "fatal";
type Lane = "front" | "cover" | "back";
type Role = "Vanguard" | "Signal Hacker" | "Marksman" | "Engineer / Tech";

type PlayerClient = {
  id: string;
  callsign: string;
  role: Role;
  family: string;
  suit: string;
  weapon: string;
  room: RoomId;
  lane: Lane;
  hp: number;
  oxygen: number;
  power: number;
  heat: number;
  stress: number;
  tethered: boolean;
  braced: boolean;
};

type ActionDef = {
  id: string;
  label: string;
  why: string;
  requirement?: (player: PlayerClient) => boolean;
  requirementText?: string;
  apply: (player: PlayerClient) => Partial<PlayerClient> & { advanceRoom?: boolean; setRoom?: RoomId; sealDelta?: number; pressureDelta?: number; progressDelta?: number; log?: string };
};

type RoomMeta = {
  id: RoomId;
  title: string;
  short: string;
  lesson: string;
  type: "briefing" | "movement" | "route" | "side-route" | "traversal" | "combat" | "escape" | "fatal";
};

const ROOM_ORDER: RoomId[] = ["dock", "entry", "spine", "pocket", "gap", "core", "extract", "fatal"];

const ROOM_META: Record<RoomId, RoomMeta> = {
  dock: {
    id: "dock",
    title: "Dock Collar",
    short: "Final clean briefing before the seal breaks.",
    lesson: "This is the last safe room. Once the seal breaks, the level starts pushing back.",
    type: "briefing",
  },
  entry: {
    id: "entry",
    title: "Entry Lock",
    short: "Clock starts. Movement order matters.",
    lesson: "The mission has begun. Small decisions now affect how ugly the level becomes.",
    type: "movement",
  },
  spine: {
    id: "spine",
    title: "Sensor Spine",
    short: "Timing, sightlines, signal pressure.",
    lesson: "Do not overprepare. The room tightens every round you hesitate.",
    type: "route",
  },
  pocket: {
    id: "pocket",
    title: "Maintenance Pocket",
    short: "Safer, slower, narrower route.",
    lesson: "Safer routes still cost time. Time is also a resource.",
    type: "side-route",
  },
  gap: {
    id: "gap",
    title: "Crosswind Gap",
    short: "Vacuum traversal and tether discipline.",
    lesson: "Wings are control surfaces here, not free flight. Tethers stop stupid deaths.",
    type: "traversal",
  },
  core: {
    id: "core",
    title: "Signal Core Room",
    short: "Contained tactical pressure room.",
    lesson: "Combat solves part of the mission, not the whole mission.",
    type: "combat",
  },
  extract: {
    id: "extract",
    title: "Extraction Run",
    short: "The route out is worse than the route in.",
    lesson: "Winning the room means nothing if you lose the way out.",
    type: "escape",
  },
  fatal: {
    id: "fatal",
    title: "Outer Service Arm",
    short: "Final bad-decision lesson.",
    lesson: "A squad can survive the room and still die in vacuum by getting arrogant on extraction.",
    type: "fatal",
  },
};

const STARTING_PLAYERS: PlayerClient[] = [
  { id: "p1", callsign: "Operator 1", role: "Vanguard", family: "Metallic", suit: "Breach", weapon: "Coil Carbine", room: "dock", lane: "front", hp: 18, oxygen: 100, power: 4, heat: 0, stress: 0, tethered: false, braced: false },
  { id: "p2", callsign: "Operator 2", role: "Signal Hacker", family: "Gem", suit: "Relay", weapon: "Laser Intercept", room: "dock", lane: "cover", hp: 12, oxygen: 100, power: 5, heat: 0, stress: 0, tethered: false, braced: false },
  { id: "p3", callsign: "Operator 3", role: "Marksman", family: "Chromatic", suit: "Vector", weapon: "Coil Marksman", room: "dock", lane: "back", hp: 13, oxygen: 100, power: 4, heat: 0, stress: 0, tethered: false, braced: false },
  { id: "p4", callsign: "Operator 4", role: "Engineer / Tech", family: "Metallic", suit: "Containment", weapon: "Slug Utility", room: "dock", lane: "cover", hp: 14, oxygen: 100, power: 5, heat: 0, stress: 0, tethered: false, braced: false },
];

function nextRoom(room: RoomId): RoomId {
  const idx = ROOM_ORDER.indexOf(room);
  return ROOM_ORDER[Math.min(idx + 1, ROOM_ORDER.length - 1)];
}

function clamp(value: number, low: number, high: number) {
  return Math.max(low, Math.min(high, value));
}

function actionLibrary(room: RoomId): ActionDef[] {
  const roomType = ROOM_META[room].type;
  if (roomType === "briefing") {
    return [{
      id: "break-seal",
      label: "Break Seal",
      why: "This starts the mission clock. You do it when the team is ready enough, not perfect.",
      apply: () => ({ advanceRoom: true, sealDelta: -1, progressDelta: 1, log: "The seal breaks. The room starts thinking about you now." }),
    }];
  }
  if (roomType === "movement") {
    return [
      {
        id: "advance-carefully",
        label: "Advance Carefully",
        why: "Good default when the room is still readable. You move without making the level worse on purpose.",
        apply: () => ({ advanceRoom: true, sealDelta: -1, progressDelta: 1, log: "The team moves into the station with discipline instead of panic." }),
      },
      {
        id: "read-entry",
        label: "Read the Entry",
        why: "Use this when information is worth more than raw speed.",
        apply: (player) => ({ power: clamp(player.power - 1, 0, 6), sealDelta: -1, pressureDelta: -1, log: "The entry pattern gets a little clearer, but the clock still burns." }),
      },
    ];
  }
  if (roomType === "route") {
    return [
      {
        id: "time-sweep",
        label: "Time the Sweep",
        why: "Spending a little time now can stop the room from making the crossing ugly later.",
        apply: () => ({ sealDelta: -1, pressureDelta: -1, log: "The squad reads the sweep rhythm instead of just charging it." }),
      },
      {
        id: "maintenance-pocket",
        label: "Use Maintenance Pocket",
        why: "Safer route, slower route. Good when the squad cannot afford a dirty crossing.",
        apply: () => ({ setRoom: "pocket", sealDelta: -1, log: "The squad peels off into the side pocket to buy a little control." }),
      },
      {
        id: "push-spine",
        label: "Push the Spine",
        why: "Fast line. Useful when the squad can handle a dirtier commit.",
        apply: () => ({ advanceRoom: true, sealDelta: -1, pressureDelta: 1, progressDelta: 1, log: "The squad pushes the main line and accepts a rougher room state." }),
      },
    ];
  }
  if (roomType === "side-route") {
    return [{
      id: "manual-cut",
      label: "Manual Access Cut",
      why: "The slower disciplined workaround. You buy stability with time.",
      apply: () => ({ advanceRoom: true, sealDelta: -1, progressDelta: 1, log: "The manual cut works, but it costs real time." }),
    }];
  }
  if (roomType === "traversal") {
    return [
      {
        id: "anchor-tether",
        label: "Anchor Tether",
        why: "Forced movement kills careless squads faster than damage does. Clip in before getting clever.",
        apply: (player) => ({ power: clamp(player.power - 1, 0, 6), tethered: true, sealDelta: -1, log: `${player.callsign} clips in before committing to the vacuum crossing.` }),
      },
      {
        id: "wing-brace",
        label: "Wing Brace",
        why: "Brace when the room is trying to spin, drag, or overcorrect you.",
        apply: (player) => ({ power: clamp(player.power - 1, 0, 6), braced: true, sealDelta: -1, log: `${player.callsign} braces wings for control, not speed.` }),
      },
      {
        id: "cross-gap",
        label: "Cross the Gap",
        why: "Moving is the point. Setup is only worth what it buys you.",
        requirement: (player) => player.tethered || player.braced,
        requirementText: "Crossing raw is reckless. Tether or brace first.",
        apply: (player) => ({ advanceRoom: true, oxygen: clamp(player.oxygen - 8, 0, 100), sealDelta: -1, progressDelta: 1, log: `${player.callsign} commits to the gap crossing.` }),
      },
    ];
  }
  if (roomType === "combat") {
    return [
      {
        id: "attack-problem",
        label: "Attack the Problem",
        why: "The goal is not total slaughter. Hit the thing making the room worse.",
        apply: (player) => ({ heat: clamp(player.heat + 1, 0, 10), sealDelta: -1, pressureDelta: -1, progressDelta: 1, log: `${player.callsign} attacks the thing actually shaping the room.` }),
      },
      {
        id: "use-role",
        label: "Use Role Ability",
        why: "Role abilities are often more efficient than generic damage when the room is solving you with systems and timing.",
        apply: (player) => ({ power: clamp(player.power - 1, 0, 6), sealDelta: -1, pressureDelta: -1, progressDelta: 1, log: `${player.callsign} uses their role to make the room less ugly.` }),
      },
      {
        id: "secure-objective",
        label: "Secure Objective",
        why: "Combat is not the mission. The objective is the mission.",
        apply: () => ({ advanceRoom: true, sealDelta: -1, progressDelta: 2, log: "The signal core is secured. Now the only smart thing left is getting out." }),
      },
    ];
  }
  if (roomType === "escape") {
    return [
      {
        id: "extract-disciplined",
        label: "Extract Disciplined",
        why: "This is the real win condition. Get out alive with the objective.",
        apply: (player) => ({ advanceRoom: true, oxygen: clamp(player.oxygen - 5, 0, 100), sealDelta: -1, progressDelta: 1, log: `${player.callsign} keeps extraction discipline instead of showing off.` }),
      },
      {
        id: "rush-exit",
        label: "Rush the Exit",
        why: "Tempting when the clock is ugly. Risky because speed makes mistakes likelier.",
        apply: (player) => ({ advanceRoom: true, oxygen: clamp(player.oxygen - 10, 0, 100), stress: player.stress + 1, sealDelta: -1, pressureDelta: 1, progressDelta: 1, log: `${player.callsign} rushes the extraction line and makes the whole run shakier.` }),
      },
    ];
  }
  return [
    {
      id: "cut-corner",
      label: "Cut the Corner",
      why: "This is the bad extraction instinct: the room feels solved, so discipline gets dropped first.",
      apply: () => ({ progressDelta: 0, pressureDelta: 2, log: "The lesson lands: surviving the room is not the same thing as surviving the mission." }),
    },
  ];
}

function StatusChip({ label, value, danger = false }: { label: string; value: string | number; danger?: boolean }) {
  return (
    <div className={`header-stat ${danger ? "status-danger" : ""}`}>
      <div className="header-stat-label">{label}</div>
      <div className="header-stat-value">{value}</div>
    </div>
  );
}

function laneClass(lane: Lane) {
  return lane === "front" ? "tone-red" : lane === "cover" ? "tone-amber" : "tone-cyan";
}

function roleClass(role: Role) {
  return role === "Vanguard" ? "tone-red" : role === "Signal Hacker" ? "tone-violet" : role === "Marksman" ? "tone-cyan" : "tone-mint";
}

function LevelMap({ players, currentRoom }: { players: PlayerClient[]; currentRoom: RoomId }) {
  const occupied = useMemo(() => {
    const map = {} as Record<RoomId, PlayerClient[]>;
    ROOM_ORDER.forEach((room) => { map[room] = players.filter((player) => player.room === room); });
    return map;
  }, [players]);

  return (
    <div className="panel theater-panel">
      <div className="panel-head">
        <div className="small-label"><Target size={14} /> Tutorial Level Layout</div>
      </div>
      <div className="map-grid">
        {ROOM_ORDER.map((roomId) => (
          <div key={roomId} className={`map-room ${currentRoom === roomId ? "map-room-active" : ""}`}>
            <div className="micro-label">{ROOM_META[roomId].type}</div>
            <div className="map-room-title">{ROOM_META[roomId].title}</div>
            <div className="small-copy">{ROOM_META[roomId].short}</div>
            <div className="compact-tags">
              {occupied[roomId].map((player) => (
                <div key={player.id} className="pill pill-dark">{player.callsign}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerView({ player, currentRoom, onAct, activeTurnId, turnTimeLeft }: { player: PlayerClient; currentRoom: RoomId; onAct: (playerId: string, action: ActionDef) => void; activeTurnId: string; turnTimeLeft: number }) {
  const room = ROOM_META[currentRoom];
  const actions = actionLibrary(currentRoom);
  const isActive = activeTurnId === player.id;
  return (
    <div className="panel theater-panel">
      <div className="operator-head">
        <div>
          <div className="small-label">Player View</div>
          <h2 className="operator-name">{player.callsign}</h2>
          <div className={`small-copy ${roleClass(player.role)}`}>{player.role} • {player.family}</div>
        </div>
        <div className={`pill ${isActive ? "pill-good" : "pill-dark"}`}>{isActive ? `Your turn • ${turnTimeLeft}s` : "Waiting"}</div>
      </div>
      <div className="stats-grid">
        <StatusChip label="Room" value={room.title} />
        <StatusChip label="HP" value={player.hp} danger={player.hp <= 6} />
        <StatusChip label="Oxygen" value={player.oxygen} danger={player.oxygen <= 40} />
        <StatusChip label="Power" value={player.power} danger={player.power <= 1} />
        <StatusChip label="Lane" value={player.lane} />
      </div>
      <div className="sub-panel">
        <div className="small-label"><Eye size={14} /> What this room is teaching</div>
        <div className="panel-copy">{room.lesson}</div>
      </div>
      <div className="sub-panel">
        <div className="small-label"><Wrench size={14} /> Your kit</div>
        <div className="panel-copy">{player.suit} suit • {player.weapon}</div>
        <div className="compact-tags">
          <div className={`pill ${laneClass(player.lane)}`}>{player.lane}</div>
          {player.tethered && <div className="pill pill-good">Tethered</div>}
          {player.braced && <div className="pill pill-info">Braced</div>}
        </div>
      </div>
      <div className="stack">
        <div className="small-label"><ArrowRight size={14} /> Your actions</div>
        {actions.map((action) => {
          const allowed = action.requirement ? action.requirement(player) : true;
          return (
            <div key={action.id} className="route-card">
              <div className="route-head">
                <div>
                  <div className="route-title">{action.label}</div>
                  <div className="small-copy">{action.why}</div>
                  {!allowed && <div className="danger-note">{action.requirementText}</div>}
                </div>
                <button className={`button ${isActive && allowed ? "button-primary" : "button-secondary"}`} disabled={!isActive || !allowed} onClick={() => onAct(player.id, action)}>
                  Commit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DmView({ players, currentRoom, sealClock, progress, pressure, log, activeTurnId, turnTimeLeft }: { players: PlayerClient[]; currentRoom: RoomId; sealClock: number; progress: number; pressure: number; log: string[]; activeTurnId: string; turnTimeLeft: number }) {
  const room = ROOM_META[currentRoom];
  return (
    <div className="panel theater-panel">
      <div className="operator-head">
        <div>
          <div className="small-label">DM View</div>
          <h2 className="operator-name">{room.title}</h2>
          <div className="small-copy">{room.short}</div>
        </div>
        <div className="pill pill-warning">Active Turn: {players.find((player) => player.id === activeTurnId)?.callsign || "—"} • {turnTimeLeft}s</div>
      </div>
      <div className="stats-grid">
        <StatusChip label="Seal Clock" value={sealClock} danger={sealClock <= 2} />
        <StatusChip label="Progress" value={progress} />
        <StatusChip label="Pressure" value={pressure} danger={pressure >= 3} />
        <StatusChip label="Room Type" value={room.type} />
      </div>
      <div className="dm-grid">
        <div className="sub-panel">
          <div className="small-label"><Users size={14} /> Operator telemetry</div>
          <div className="stack">
            {players.map((player) => (
              <div key={player.id} className="crew-list-card">
                <div className="crew-list-head">
                  <div>
                    <div className="crew-name">{player.callsign}</div>
                    <div className="small-copy">{player.role} • {player.room}</div>
                  </div>
                  <div className={`pill ${laneClass(player.lane)}`}>{player.lane}</div>
                </div>
                <div className="meter-row">
                  <div className="pill pill-dark">HP {player.hp}</div>
                  <div className="pill pill-dark">O₂ {player.oxygen}</div>
                  <div className="pill pill-dark">PWR {player.power}</div>
                  <div className="pill pill-dark">Heat {player.heat}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="sub-panel">
          <div className="small-label"><Radio size={14} /> Event log</div>
          <div className="stack">
            {log.map((entry, idx) => (
              <div key={idx} className="log-entry">{entry}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TestHarness({ selectedClient, setSelectedClient, players, activeTurnId }: { selectedClient: string; setSelectedClient: (id: string) => void; players: PlayerClient[]; activeTurnId: string }) {
  return (
    <div className="panel theater-panel">
      <div className="panel-head">
        <div className="small-label"><Users size={14} /> Local Multi-Client Test Harness</div>
      </div>
      <div className="button-cluster">
        <button className={`button ${selectedClient === "dm" ? "button-warning" : "button-secondary"}`} onClick={() => setSelectedClient("dm")}>DM View</button>
        {players.map((player) => (
          <button key={player.id} className={`button ${selectedClient === player.id ? "button-primary" : "button-secondary"}`} onClick={() => setSelectedClient(player.id)}>
            {player.callsign}{activeTurnId === player.id ? " • active" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MulticlientFoundation() {
  const [players, setPlayers] = useState<PlayerClient[]>(STARTING_PLAYERS);
  const [currentRoom, setCurrentRoom] = useState<RoomId>("dock");
  const [selectedClient, setSelectedClient] = useState<string>("dm");
  const [sealClock, setSealClock] = useState(7);
  const [progress, setProgress] = useState(0);
  const [pressure, setPressure] = useState(0);
  const [turnOrder, setTurnOrder] = useState(STARTING_PLAYERS.map((player) => player.id));
  const [turnIndex, setTurnIndex] = useState(0);
  const [turnTimeLeft, setTurnTimeLeft] = useState(12);
  const [log, setLog] = useState<string[]>([
    "Training run loaded.",
    "This slice proves the real architecture: separate player screens, a DM view, and a mapped tutorial level.",
  ]);

  const activeTurnId = turnOrder[turnIndex] || STARTING_PLAYERS[0].id;

  useEffect(() => {
    const timer = window.setInterval(() => setTurnTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [activeTurnId]);

  useEffect(() => {
    if (turnTimeLeft > 0) return;
    const actor = players.find((player) => player.id === activeTurnId);
    setLog((prev) => [`${actor?.callsign || "An operator"} hesitates too long and loses the turn. The room keeps moving.`, ...prev]);
    setSealClock((prev) => clamp(prev - 1, 0, 10));
    setPressure((prev) => clamp(prev + 1, 0, 10));
    setTurnIndex((prev) => (prev + 1) % turnOrder.length);
    setTurnTimeLeft(12);
  }, [turnTimeLeft]);

  const applyAction = (playerId: string, action: ActionDef) => {
    if (playerId !== activeTurnId) return;
    const actor = players.find((player) => player.id === playerId);
    if (!actor) return;
    const result = action.apply(actor);
    setPlayers((prev) => prev.map((player) => {
      if (player.id !== playerId) return player;
      const nextRoomValue = result.setRoom ? result.setRoom : result.advanceRoom ? nextRoom(player.room) : player.room;
      return {
        ...player,
        room: nextRoomValue,
        hp: result.hp ?? player.hp,
        oxygen: result.oxygen ?? player.oxygen,
        power: result.power ?? player.power,
        heat: result.heat ?? player.heat,
        stress: result.stress ?? player.stress,
        tethered: result.tethered ?? player.tethered,
        braced: result.braced ?? player.braced,
      };
    }));
    if (result.advanceRoom) setCurrentRoom((prev) => nextRoom(prev));
    if (result.setRoom) setCurrentRoom(result.setRoom);
    if (typeof result.sealDelta === "number") setSealClock((prev) => clamp(prev + result.sealDelta, 0, 10));
    if (typeof result.pressureDelta === "number") setPressure((prev) => clamp(prev + result.pressureDelta, 0, 10));
    if (typeof result.progressDelta === "number") setProgress((prev) => clamp(prev + result.progressDelta, 0, 10));
    setLog((prev) => [result.log || `${actor.callsign} commits ${action.label}.`, ...prev]);
    const nextTurn = (turnIndex + 1) % turnOrder.length;
    setTurnIndex(nextTurn);
    setTurnTimeLeft(12);
    if (nextTurn === 0) {
      setSealClock((prev) => clamp(prev - 1, 0, 10));
      setPressure((prev) => clamp(prev + 1, 0, 10));
      setLog((prev) => ["Site reaction: the room tightens while the squad commits and hesitates.", ...prev]);
    }
  };

  const selectedPlayer = players.find((player) => player.id === selectedClient) || players[0];

  return (
    <div className="stack-large">
      <div className="hero-card theater-panel">
        <div className="hero-row">
          <div>
            <div className="eyebrow">Dead-Zone Ops // Multiclient Foundation</div>
            <h1 className="hero-title">Separate Player Screens + DM Control + Tutorial Map</h1>
            <div className="hero-copy">This proves the real product architecture: each player sees only their operator view, the DM sees the control layer, and local test mode can simulate 4–6 players plus DM on one machine.</div>
          </div>
          <div className="status-stack">
            <div className="pill pill-warning"><Clock3 size={14} /> Turn clock • {turnTimeLeft}s</div>
            <div className="pill pill-dark"><AlertTriangle size={14} /> Seal {sealClock}</div>
          </div>
        </div>
        <div className="meter-row">
          <StatusChip label="Active Room" value={ROOM_META[currentRoom].title} />
          <StatusChip label="Progress" value={progress} />
          <StatusChip label="Pressure" value={pressure} danger={pressure >= 3} />
          <StatusChip label="Active Turn" value={players.find((player) => player.id === activeTurnId)?.callsign || "—"} />
        </div>
      </div>
      <TestHarness selectedClient={selectedClient} setSelectedClient={setSelectedClient} players={players} activeTurnId={activeTurnId} />
      <LevelMap players={players} currentRoom={currentRoom} />
      {selectedClient === "dm" ? (
        <DmView players={players} currentRoom={currentRoom} sealClock={sealClock} progress={progress} pressure={pressure} log={log} activeTurnId={activeTurnId} turnTimeLeft={turnTimeLeft} />
      ) : (
        <PlayerView player={selectedPlayer} currentRoom={currentRoom} onAct={applyAction} activeTurnId={activeTurnId} turnTimeLeft={turnTimeLeft} />
      )}
      <div className="panel theater-panel">
        <div className="panel-head">
          <div className="small-label"><Lock size={14} /> What this proves</div>
        </div>
        <div className="map-grid map-grid-tight">
          <div className="sub-panel"><div className="small-label">Per-player UI</div><div className="small-copy">No shared squad dashboard as the real player experience.</div></div>
          <div className="sub-panel"><div className="small-label">Mapped level</div><div className="small-copy">Rooms now exist as spaces with tutorial grammar instead of floating action boxes.</div></div>
          <div className="sub-panel"><div className="small-label">Turn cycling</div><div className="small-copy">Only one operator acts at a time. The room keeps moving if people hesitate.</div></div>
          <div className="sub-panel"><div className="small-label">Spoiler-safe guidance</div><div className="small-copy">Players get challenge language, not hidden-enemy taxonomy.</div></div>
        </div>
      </div>
    </div>
  );
}
