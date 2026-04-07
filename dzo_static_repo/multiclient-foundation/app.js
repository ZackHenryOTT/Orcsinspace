const ROOMS = [
  {
    id: "dock",
    title: "Dock Collar",
    type: "briefing",
    short: "Final clean briefing before the seal breaks.",
    lesson: "This is the last safe room. Once the seal breaks, the level starts pushing back.",
    objective: "Get the squad stacked on the inner seal and start the run.",
    zones: ["Staging Rack", "Seal Console", "Threshold"],
  },
  {
    id: "entry",
    title: "Entry Lock",
    type: "movement",
    short: "Movement order matters as the clock starts biting.",
    lesson: "You do not need everybody doing everything. You need the right people doing the right things.",
    objective: "Move all operators through the lock without wasting the first clean window.",
    zones: ["Outer Lock", "Inner Lock", "Service Threshold"],
  },
  {
    id: "spine",
    title: "Sensor Spine",
    type: "route",
    short: "Timing, sightlines, and bad greed.",
    lesson: "Every extra setup action costs time. Time makes the room smarter.",
    objective: "Thread the sweep lane and get the whole squad to far cover.",
    zones: ["Near Cover", "Sweep Lane", "Center Span", "Far Cover"],
  },
  {
    id: "gap",
    title: "Crosswind Gap",
    type: "traversal",
    short: "Vacuum traversal and tether discipline.",
    lesson: "Wings are control surfaces here, not free flight. Tethers stop stupid deaths.",
    objective: "Cross the breach with enough stability to keep the squad intact.",
    zones: ["Near Anchor", "Broken Span", "Hazard Rail", "Far Brace"],
  },
  {
    id: "core",
    title: "Signal Core Room",
    type: "combat",
    short: "Contained tactical pressure room.",
    lesson: "Combat is there to let you extract the objective, not to flatter your ego.",
    objective: "Kill the room's control problem, secure the core, and fall back to the exit lane.",
    zones: ["Breach Door", "Kill Lane", "Core Pedestal", "Exit Door"],
  },
  {
    id: "extract",
    title: "Extraction Run",
    type: "escape",
    short: "The path back is uglier than the path in.",
    lesson: "Winning the room means nothing if you die getting out.",
    objective: "Move the whole squad to the service junction with the objective intact.",
    zones: ["Return Choke", "Sliding Shutters", "Open Run", "Service Junction"],
  },
  {
    id: "fatal",
    title: "Outer Service Arm",
    type: "fatal",
    short: "The final bad-decision lesson.",
    lesson: "One rushed extraction choice can kill a squad that 'won' every previous room.",
    objective: "Choose whether to stay disciplined or cut the corner and learn why that kills people.",
    zones: ["Outer Hatch", "Service Arm", "Broken Rail", "Void Edge"],
  },
];

const ROOM_INDEX = Object.fromEntries(ROOMS.map((room, idx) => [room.id, idx]));
const ROOM_BY_ID = Object.fromEntries(ROOMS.map((room) => [room.id, room]));
const INITIAL_PLAYERS = [
  { id: "p1", callsign: "Operator 1", role: "Vanguard", family: "Metallic", suit: "Breach", weapon: "Coil Carbine", lane: "front" },
  { id: "p2", callsign: "Operator 2", role: "Signal Hacker", family: "Gem", suit: "Relay", weapon: "Laser Intercept", lane: "cover" },
  { id: "p3", callsign: "Operator 3", role: "Marksman", family: "Chromatic", suit: "Vector", weapon: "Coil Marksman", lane: "back" },
  { id: "p4", callsign: "Operator 4", role: "Engineer / Tech", family: "Metallic", suit: "Containment", weapon: "Slug Utility", lane: "cover" },
].map((player) => ({
  ...player,
  roomId: "dock",
  zoneIndex: 0,
  hp: roleBaseHp(player.role),
  oxygen: 100,
  power: roleBasePower(player.role),
  heat: 0,
  stress: 0,
  tethered: false,
  braced: false,
}));

const state = {
  selectedClient: "dm",
  players: structuredClone(INITIAL_PLAYERS),
  roomState: createRoomState(),
  currentRoomId: "dock",
  sealClock: 7,
  pressure: 0,
  round: 1,
  turnOrder: INITIAL_PLAYERS.map((player) => player.id),
  turnIndex: 0,
  turnTimeLeft: 14,
  missionEnded: false,
  lessonSeen: false,
  log: [
    "Training run loaded.",
    "This is the real architecture: each player sees only their own operator view, while the DM sees the whole room state.",
    "The level is now room-and-zone based. Players move through a place, not a list of abstract buttons.",
  ],
};

function roleBaseHp(role) {
  if (role === "Vanguard") return 18;
  if (role === "Signal Hacker") return 12;
  if (role === "Marksman") return 13;
  return 14;
}

function roleBasePower(role) {
  if (role === "Signal Hacker") return 5;
  if (role === "Engineer / Tech") return 5;
  return 4;
}

function createRoomState() {
  return Object.fromEntries(
    ROOMS.map((room) => [
      room.id,
      {
        stability: room.type === "briefing" ? 2 : 0,
        exposure: 0,
        support: 0,
        sweepRead: false,
        routePocket: false,
        objectiveSecured: false,
        problemHits: 0,
        rushed: false,
        fatalMistake: false,
      },
    ])
  );
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function activeRoom() {
  return ROOM_BY_ID[state.currentRoomId];
}

function currentRoomState() {
  return state.roomState[state.currentRoomId];
}

function activeTurnId() {
  return state.turnOrder[state.turnIndex] || state.players[0].id;
}

function activePlayer() {
  return state.players.find((player) => player.id === activeTurnId()) || state.players[0];
}

function selectedPlayer() {
  return state.players.find((player) => player.id === state.selectedClient) || state.players[0];
}

function pushLog(text) {
  state.log.unshift(text);
  state.log = state.log.slice(0, 18);
}

function roomPlayers(roomId = state.currentRoomId) {
  return state.players.filter((player) => player.roomId === roomId);
}

function roomComplete(roomId = state.currentRoomId) {
  const room = ROOM_BY_ID[roomId];
  const rs = state.roomState[roomId];
  const players = roomPlayers(roomId);
  const finalZone = room.zones.length - 1;
  if (room.type === "combat") {
    return rs.objectiveSecured && players.every((player) => player.zoneIndex >= finalZone);
  }
  if (room.type === "fatal") {
    return rs.fatalMistake || players.every((player) => player.zoneIndex >= finalZone);
  }
  return players.every((player) => player.zoneIndex >= finalZone);
}

function moveToNextRoom() {
  const currentIndex = ROOM_INDEX[state.currentRoomId];
  const nextIndex = Math.min(currentIndex + 1, ROOMS.length - 1);
  const nextRoom = ROOMS[nextIndex];
  const previous = ROOM_BY_ID[state.currentRoomId];
  if (nextRoom.id === previous.id) return;
  state.currentRoomId = nextRoom.id;
  state.players = state.players.map((player) => ({
    ...player,
    roomId: nextRoom.id,
    zoneIndex: 0,
    tethered: nextRoom.type === "traversal" ? player.tethered : false,
    braced: false,
  }));
  pushLog(`${previous.title} gives way to ${nextRoom.title}. The squad keeps moving because standing still is how the site wins.`);
}

function spendTurn(actionLabel, actorId, customLog) {
  const actor = state.players.find((player) => player.id === actorId);
  if (!actor) return;
  pushLog(customLog || `${actor.callsign} commits ${actionLabel}.`);

  if (roomComplete()) {
    if (activeRoom().type === "fatal" && currentRoomState().fatalMistake) {
      state.missionEnded = true;
      state.lessonSeen = true;
      pushLog("The lesson lands: surviving the room is not the same thing as surviving the mission. The squad dies because extraction discipline broke first.");
      render();
      return;
    }
    moveToNextRoom();
  }

  state.turnIndex = (state.turnIndex + 1) % state.turnOrder.length;
  state.turnTimeLeft = 14;

  if (state.turnIndex === 0) {
    state.round += 1;
    applySiteReaction();
  }

  render();
}

function applySiteReaction() {
  const room = activeRoom();
  const rs = currentRoomState();
  state.sealClock = clamp(state.sealClock - 1, 0, 10);
  state.pressure = clamp(state.pressure + 1, 0, 10);

  if (room.type !== "briefing") {
    rs.exposure = clamp(rs.exposure + 1, 0, 8);
  }
  if (room.type === "route" && !rs.sweepRead) {
    rs.exposure = clamp(rs.exposure + 1, 0, 8);
  }
  if (room.type === "traversal" && rs.stability <= 0) {
    rs.exposure = clamp(rs.exposure + 1, 0, 8);
  }
  if (room.type === "combat" && !rs.objectiveSecured) {
    rs.problemHits = clamp(rs.problemHits + 1, 0, 3);
    state.pressure = clamp(state.pressure + 1, 0, 10);
  }

  if (rs.support > 0) rs.support -= 1;

  pushLog(`Site reaction: ${room.title} tightens. Every extra round makes the room meaner.`);

  if (state.sealClock === 0 && !state.missionEnded) {
    state.pressure = clamp(state.pressure + 1, 0, 10);
    pushLog("Seal clock expired. The station stops tolerating your presence and starts trying to solve the squad outright.");
  }
}

function advanceZone(player, steps = 1) {
  const room = ROOM_BY_ID[player.roomId];
  return clamp(player.zoneIndex + steps, 0, room.zones.length - 1);
}

function actorActions(player) {
  const room = activeRoom();
  const rs = currentRoomState();
  const lastZone = room.zones.length - 1;

  const common = [
    {
      id: "steady",
      label: "Keep Formation",
      why: "Spend your turn helping the squad stay disciplined instead of piling on random extra actions.",
      tone: "good",
      apply() {
        rs.stability = clamp(rs.stability + 1, 0, 6);
        rs.exposure = clamp(rs.exposure - 1, 0, 8);
        spendTurn("Keep Formation", player.id, `${player.callsign} spends the turn keeping the squad disciplined and the room from getting free hits.`);
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
        apply() {
          player.zoneIndex = advanceZone(player, 1);
          spendTurn("Move", player.id, `${player.callsign} moves into position at the seal.`);
        },
      },
      {
        id: "break-seal",
        label: "Break Seal",
        why: "This starts the mission. Once the seal breaks, every round matters.",
        tone: "bad",
        enabled: player.zoneIndex >= 1,
        disabledText: "Get to the seal console first.",
        apply() {
          player.zoneIndex = lastZone;
          spendTurn("Break Seal", player.id, `${player.callsign} breaks the seal. The room stops being passive and starts reacting.`);
        },
      },
    ].concat(common);
  }

  if (room.type === "movement") {
    return [
      {
        id: "advance",
        label: "Advance One Zone",
        why: "You move because moving is the mission. Use this when the room is still readable.",
        tone: "neutral",
        apply() {
          player.zoneIndex = advanceZone(player, 1);
          player.oxygen = clamp(player.oxygen - 1, 0, 100);
          if (rs.exposure > 2) player.stress += 1;
          spendTurn("Advance", player.id, `${player.callsign} advances through the lock instead of wasting the clean window.`);
        },
      },
      {
        id: "scan",
        label: "Read the Entry",
        why: "Good when the next move matters more than raw speed. It should not be spammed forever because the clock still burns.",
        tone: "good",
        enabled: player.power > 0,
        disabledText: "Not enough power.",
        apply() {
          player.power = clamp(player.power - 1, 0, 6);
          rs.stability = clamp(rs.stability + 1, 0, 6);
          rs.exposure = clamp(rs.exposure - 1, 0, 8);
          spendTurn("Read the Entry", player.id, `${player.callsign} spends power to make the next move safer.`);
        },
      },
      {
        id: "cover",
        label: "Cover the Move",
        why: "Useful when another operator is about to move. It buys them a cleaner commit instead of piling up vanity setup.",
        tone: "good",
        apply() {
          rs.support = clamp(rs.support + 1, 0, 2);
          spendTurn("Cover the Move", player.id, `${player.callsign} sets a cleaner line for the next operator instead of doing everything themselves.`);
        },
      },
    ].concat(common);
  }

  if (room.type === "route") {
    return [
      {
        id: "advance-cover",
        label: "Move by Cover",
        why: "Default good play: move, but only as hard as the room currently allows.",
        tone: "neutral",
        apply() {
          const support = rs.support > 0 ? 1 : 0;
          player.zoneIndex = advanceZone(player, 1);
          player.oxygen = clamp(player.oxygen - 2, 0, 100);
          rs.exposure = clamp(rs.exposure + Math.max(0, 1 - support - (rs.sweepRead ? 1 : 0)), 0, 8);
          if (rs.support > 0) rs.support -= 1;
          spendTurn("Move by Cover", player.id, `${player.callsign} moves through the spine without pretending the room is free.`);
        },
      },
      {
        id: "read-sweep",
        label: "Read Sweep Timing",
        why: "This is the one prep action the room actually rewards. It should help the next move, not replace the need to move.",
        tone: "good",
        enabled: player.power > 0 && !rs.sweepRead,
        disabledText: rs.sweepRead ? "The sweep has already been read." : "Not enough power.",
        apply() {
          player.power = clamp(player.power - 1, 0, 6);
          rs.sweepRead = true;
          rs.stability = clamp(rs.stability + 1, 0, 6);
          rs.exposure = clamp(rs.exposure - 1, 0, 8);
          spendTurn("Read Sweep Timing", player.id, `${player.callsign} times the sweep and buys the squad one cleaner move.`);
        },
      },
      {
        id: "pocket-route",
        label: "Open Maintenance Pocket",
        why: "Safer route, slower route. Use it when the squad cannot afford a dirty crossing.",
        tone: "good",
        enabled: !rs.routePocket,
        disabledText: "The pocket route is already open.",
        apply() {
          rs.routePocket = true;
          rs.stability = clamp(rs.stability + 1, 0, 6);
          spendTurn("Open Maintenance Pocket", player.id, `${player.callsign} opens the side path. The squad buys control with time.`);
        },
      },
      {
        id: "cover-spine",
        label: "Cover the Sweep Lane",
        why: "Set support for the next move instead of having everyone greedily prep themselves.",
        tone: "good",
        apply() {
          rs.support = clamp(rs.support + 1, 0, 2);
          spendTurn("Cover the Sweep Lane", player.id, `${player.callsign} covers the lane so the next operator can move cleaner.`);
        },
      },
    ].concat(common);
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
        apply() {
          player.tethered = true;
          player.power = clamp(player.power - 1, 0, 6);
          rs.stability = clamp(rs.stability + 1, 0, 6);
          spendTurn("Anchor Tether", player.id, `${player.callsign} clips in before the crossing gets a chance to punish arrogance.`);
        },
      },
      {
        id: "brace",
        label: player.braced ? "Maintain Wing Brace" : "Wing Brace",
        why: "Wings help you brake and stabilize here. They do not make vacuum crossing free.",
        tone: "good",
        enabled: player.power > 0,
        disabledText: "Not enough power.",
        apply() {
          player.braced = true;
          player.power = clamp(player.power - 1, 0, 6);
          rs.exposure = clamp(rs.exposure - 1, 0, 8);
          spendTurn("Wing Brace", player.id, `${player.callsign} braces for control instead of pretending wings are flight.`);
        },
      },
      {
        id: "drift",
        label: "Drift One Segment",
        why: "You are here to cross. Setup only matters if it buys you a better commit.",
        tone: "neutral",
        apply() {
          const protectedCrossing = player.tethered || player.braced || rs.support > 0;
          player.zoneIndex = advanceZone(player, 1);
          player.oxygen = clamp(player.oxygen - 4, 0, 100);
          if (!protectedCrossing) {
            rs.exposure = clamp(rs.exposure + 2, 0, 8);
            player.stress += 1;
          } else {
            rs.exposure = clamp(rs.exposure + (rs.support > 0 ? 0 : 1), 0, 8);
          }
          if (rs.support > 0) rs.support -= 1;
          spendTurn("Drift One Segment", player.id, `${player.callsign} commits to the crossing. The room finally gets to answer back.`);
        },
      },
      {
        id: "support-cross",
        label: "Stabilize the Crossing",
        why: "This buys one cleaner move for whoever crosses next. Good teams support the crossing instead of all doing the same prep to themselves.",
        tone: "good",
        apply() {
          rs.support = clamp(rs.support + 1, 0, 2);
          rs.stability = clamp(rs.stability + 1, 0, 6);
          spendTurn("Stabilize the Crossing", player.id, `${player.callsign} keeps the crossing from turning into a panic puzzle.`);
        },
      },
    ].concat(common);
  }

  if (room.type === "combat") {
    return [
      {
        id: "push-lane",
        label: "Push One Zone",
        why: "You move toward the actual problem instead of standing in the doorway clicking every useful button.",
        tone: "neutral",
        apply() {
          player.zoneIndex = advanceZone(player, 1);
          player.oxygen = clamp(player.oxygen - 1, 0, 100);
          spendTurn("Push One Zone", player.id, `${player.callsign} pushes deeper into the room instead of trying to solve it from safety.`);
        },
      },
      {
        id: "solve-problem",
        label: player.role === "Signal Hacker" ? "Disrupt Control Logic" : player.role === "Engineer / Tech" ? "Collapse Route Control" : "Suppress the Problem" ,
        why: "Hit the thing making the room worse. This is better doctrine than trying to clean out every body in sight.",
        tone: "bad",
        enabled: player.power > 0 || player.role === "Marksman" || player.role === "Vanguard",
        disabledText: "No usable power left.",
        apply() {
          if (player.role === "Signal Hacker" || player.role === "Engineer / Tech") player.power = clamp(player.power - 1, 0, 6);
          rs.problemHits = clamp(rs.problemHits + 1, 0, 3);
          state.pressure = clamp(state.pressure - 1, 0, 10);
          spendTurn("Solve the Problem", player.id, `${player.callsign} attacks the thing shaping the room instead of farming meaningless kills.`);
        },
      },
      {
        id: "secure-core",
        label: "Secure Core",
        why: "Only do this once the room's control problem is handled and someone has actually reached the pedestal.",
        tone: "good",
        enabled: player.zoneIndex >= 2 && rs.problemHits >= 2,
        disabledText: player.zoneIndex < 2 ? "Get to the core pedestal first." : "The room's control problem is still live.",
        apply() {
          rs.objectiveSecured = true;
          player.zoneIndex = Math.max(player.zoneIndex, 2);
          spendTurn("Secure Core", player.id, `${player.callsign} secures the objective. Combat was only the middle of the mission.`);
        },
      },
      {
        id: "fall-back",
        label: "Fall Back to Exit",
        why: "Once the core is secure, leaving is smarter than posturing.",
        tone: "good",
        enabled: rs.objectiveSecured,
        disabledText: "The objective is not secured yet.",
        apply() {
          player.zoneIndex = advanceZone(player, 1);
          spendTurn("Fall Back to Exit", player.id, `${player.callsign} starts the pullback instead of overstaying in a room that already taught its lesson.`);
        },
      },
    ].concat(common);
  }

  if (room.type === "escape") {
    return [
      {
        id: "extract-disciplined",
        label: "Move the Objective One Zone",
        why: "This is the real win condition. Move the objective and the squad, not your ego.",
        tone: "good",
        apply() {
          player.zoneIndex = advanceZone(player, 1);
          player.oxygen = clamp(player.oxygen - 3, 0, 100);
          rs.stability = clamp(rs.stability + 1, 0, 6);
          spendTurn("Move the Objective", player.id, `${player.callsign} keeps the extraction disciplined instead of trying to look heroic.`);
        },
      },
      {
        id: "stabilize-route",
        label: "Stabilize Route",
        why: "Worth doing when the room is about to break the squad on the way out. Not worth spamming forever because the clock still burns.",
        tone: "good",
        enabled: player.power > 0,
        disabledText: "Not enough power.",
        apply() {
          player.power = clamp(player.power - 1, 0, 6);
          rs.exposure = clamp(rs.exposure - 1, 0, 8);
          rs.stability = clamp(rs.stability + 1, 0, 6);
          spendTurn("Stabilize Route", player.id, `${player.callsign} buys the squad one cleaner pullback through a room that wants blood.`);
        },
      },
      {
        id: "rush",
        label: "Rush One Extra Segment",
        why: "Tempting when the clock is ugly. Risky because speed creates mistakes and shreds discipline.",
        tone: "bad",
        apply() {
          player.zoneIndex = advanceZone(player, 2);
          player.oxygen = clamp(player.oxygen - 6, 0, 100);
          player.stress += 1;
          rs.rushed = true;
          rs.exposure = clamp(rs.exposure + 2, 0, 8);
          spendTurn("Rush One Extra Segment", player.id, `${player.callsign} buys speed with future consequences. The room notices greed.`);
        },
      },
    ].concat(common);
  }

  return [
    {
      id: "discipline",
      label: "Reclip and Collapse Wings",
      why: "This is the right call. The room appears solved, but vacuum still wins if discipline breaks.",
      tone: "good",
      apply() {
        player.tethered = true;
        player.braced = true;
        player.zoneIndex = advanceZone(player, 1);
        rs.stability = clamp(rs.stability + 1, 0, 6);
        spendTurn("Reclip and Collapse Wings", player.id, `${player.callsign} does the right thing and keeps the formation alive one more second.`);
      },
    },
    {
      id: "cut-corner",
      label: "Cut the Corner",
      why: "This is the tempting bad decision: the room feels won, the clock feels ugly, and discipline looks optional.",
      tone: "bad",
      enabled: player.zoneIndex >= 1,
      disabledText: "Move onto the service arm first.",
      apply() {
        rs.fatalMistake = true;
        player.zoneIndex = advanceZone(player, 2);
        state.pressure = clamp(state.pressure + 2, 0, 10);
        spendTurn("Cut the Corner", player.id, `${player.callsign} cuts the corner. The training run finally teaches why surviving combat was never the real objective.`);
      },
    },
    {
      id: "advance-arm",
      label: "Move One Segment",
      why: "Even here, the level is about moving through real space instead of clicking a solved outcome.",
      tone: "neutral",
      apply() {
        player.zoneIndex = advanceZone(player, 1);
        player.oxygen = clamp(player.oxygen - 3, 0, 100);
        spendTurn("Move One Segment", player.id, `${player.callsign} moves one segment farther down the service arm.`);
      },
    },
  ].concat(common);
}

function playerVisibleComm(viewer) {
  return state.players
    .filter((player) => player.id !== viewer.id)
    .map((player) => `${player.callsign}: ${ROOM_BY_ID[player.roomId].title} // ${ROOM_BY_ID[player.roomId].zones[player.zoneIndex]}`);
}

function toneClass(tone) {
  if (tone === "good") return "tone-good";
  if (tone === "bad") return "tone-bad";
  return "tone-neutral";
}

function laneClass(lane) {
  if (lane === "front") return "lane-front";
  if (lane === "cover") return "lane-cover";
  return "lane-back";
}

function roomCard(roomId) {
  const room = ROOM_BY_ID[roomId];
  const active = roomId === state.currentRoomId;
  const occupants = state.players.filter((player) => player.roomId === roomId);
  return `
    <div class="room-card ${active ? "room-card-active" : ""}">
      <div class="micro">${room.type}</div>
      <div class="room-card-title">${room.title}</div>
      <div class="room-card-copy">${room.short}</div>
      <div class="pill-row">${occupants.map((player) => `<span class="pill pill-dark">${player.callsign}</span>`).join("")}</div>
    </div>`;
}

function renderZoneTrack(player, room) {
  return `
    <div class="zone-track">
      ${room.zones
        .map((zone, idx) => {
          const here = idx === player.zoneIndex;
          return `<div class="zone-node ${here ? "zone-node-active" : ""}"><div class="zone-index">${idx + 1}</div><div class="zone-name">${zone}</div></div>`;
        })
        .join("")}
    </div>`;
}

function renderDmZoneGrid(room) {
  return `
    <div class="zone-grid">
      ${room.zones
        .map((zone, idx) => {
          const occupants = roomPlayers().filter((player) => player.zoneIndex === idx);
          return `<div class="zone-column"><div class="zone-column-head">${zone}</div><div class="stack-small">${occupants
            .map(
              (player) => `<div class="telemetry-card"><div class="telemetry-head"><strong>${player.callsign}</strong><span class="pill ${laneClass(player.lane)}">${player.lane}</span></div><div class="micro-copy">${player.role} • ${player.weapon}</div></div>`
            )
            .join("")}</div></div>`;
        })
        .join("")}
    </div>`;
}

function renderPlayerView(player) {
  const room = activeRoom();
  const rs = currentRoomState();
  const isActive = player.id === activeTurnId();
  const actions = actorActions(player);
  return `
    <section class="panel player-panel">
      <div class="panel-head operator-head">
        <div>
          <div class="micro">Player View</div>
          <h2>${player.callsign}</h2>
          <div class="role-line">${player.role} • ${player.family}</div>
        </div>
        <div class="pill ${isActive ? "pill-good" : "pill-dark"}">${isActive ? `Your turn • ${state.turnTimeLeft}s` : "Waiting"}</div>
      </div>

      <div class="stat-grid">
        <div class="stat-card"><div class="micro">Room</div><div class="stat-value">${room.title}</div></div>
        <div class="stat-card ${player.hp <= 6 ? "danger" : ""}"><div class="micro">HP</div><div class="stat-value">${player.hp}</div></div>
        <div class="stat-card ${player.oxygen <= 40 ? "danger" : ""}"><div class="micro">O₂</div><div class="stat-value">${player.oxygen}</div></div>
        <div class="stat-card ${player.power <= 1 ? "danger" : ""}"><div class="micro">Power</div><div class="stat-value">${player.power}</div></div>
        <div class="stat-card ${state.sealClock <= 2 ? "danger" : ""}"><div class="micro">Seal</div><div class="stat-value">${state.sealClock}</div></div>
      </div>

      <div class="sub-panel">
        <div class="panel-label">What this room is teaching</div>
        <div class="panel-copy">${room.lesson}</div>
      </div>

      <div class="sub-panel">
        <div class="panel-label">Objective</div>
        <div class="panel-copy">${room.objective}</div>
      </div>

      <div class="sub-panel">
        <div class="panel-label">Your current position</div>
        ${renderZoneTrack(player, room)}
        <div class="pill-row">
          <span class="pill ${laneClass(player.lane)}">${player.lane}</span>
          ${player.tethered ? '<span class="pill pill-good">Tethered</span>' : ''}
          ${player.braced ? '<span class="pill pill-info">Braced</span>' : ''}
          <span class="pill pill-dark">${player.suit}</span>
          <span class="pill pill-dark">${player.weapon}</span>
        </div>
      </div>

      <div class="sub-panel">
        <div class="panel-label">Room state you can feel</div>
        <div class="state-meter-row">
          <span class="pill pill-dark">Stability ${rs.stability}</span>
          <span class="pill ${rs.exposure >= 4 ? "pill-bad" : "pill-dark"}">Exposure ${rs.exposure}</span>
          <span class="pill pill-dark">Support ${rs.support}</span>
        </div>
      </div>

      <div class="sub-panel">
        <div class="panel-label">Comms</div>
        <div class="stack-small">${playerVisibleComm(player).map((line) => `<div class="log-entry">${line}</div>`).join("")}</div>
      </div>

      <div class="stack-small">
        <div class="panel-label">Your actions</div>
        ${actions
          .map((action) => {
            const enabled = action.enabled === undefined ? true : action.enabled;
            return `
            <div class="action-card ${toneClass(action.tone)}">
              <div class="action-head">
                <div>
                  <div class="action-title">${action.label}</div>
                  <div class="action-why">${action.why}</div>
                  ${!enabled ? `<div class="warn">${action.disabledText || "Unavailable right now."}</div>` : ""}
                </div>
                <button class="button ${isActive && enabled && !state.missionEnded ? "button-primary" : "button-secondary"}" ${isActive && enabled && !state.missionEnded ? `data-action="${action.id}" data-player="${player.id}"` : "disabled"}>Commit</button>
              </div>
            </div>`;
          })
          .join("")}
      </div>
    </section>`;
}

function renderDmView() {
  const room = activeRoom();
  const rs = currentRoomState();
  const active = activePlayer();
  return `
    <section class="panel dm-panel">
      <div class="panel-head operator-head">
        <div>
          <div class="micro">DM View</div>
          <h2>${room.title}</h2>
          <div class="panel-copy">${room.short}</div>
        </div>
        <div class="pill pill-warning">Active Turn: ${active.callsign} • ${state.turnTimeLeft}s</div>
      </div>

      <div class="stat-grid">
        <div class="stat-card ${state.sealClock <= 2 ? "danger" : ""}"><div class="micro">Seal Clock</div><div class="stat-value">${state.sealClock}</div></div>
        <div class="stat-card"><div class="micro">Round</div><div class="stat-value">${state.round}</div></div>
        <div class="stat-card ${state.pressure >= 3 ? "danger" : ""}"><div class="micro">Pressure</div><div class="stat-value">${state.pressure}</div></div>
        <div class="stat-card"><div class="micro">Room Stability</div><div class="stat-value">${rs.stability}</div></div>
        <div class="stat-card ${rs.exposure >= 4 ? "danger" : ""}"><div class="micro">Exposure</div><div class="stat-value">${rs.exposure}</div></div>
      </div>

      <div class="sub-panel">
        <div class="panel-label">Room objective</div>
        <div class="panel-copy">${room.objective}</div>
      </div>

      <div class="sub-panel">
        <div class="panel-label">Live room geometry</div>
        ${renderDmZoneGrid(room)}
      </div>

      <div class="dm-grid">
        <div class="sub-panel">
          <div class="panel-label">Operator telemetry</div>
          <div class="stack-small">
            ${state.players
              .map(
                (player) => `
                <div class="telemetry-card">
                  <div class="telemetry-head"><strong>${player.callsign}</strong><span class="pill ${laneClass(player.lane)}">${player.lane}</span></div>
                  <div class="micro-copy">${player.role} • ${ROOM_BY_ID[player.roomId].zones[player.zoneIndex]}</div>
                  <div class="pill-row">
                    <span class="pill pill-dark">HP ${player.hp}</span>
                    <span class="pill pill-dark">O₂ ${player.oxygen}</span>
                    <span class="pill pill-dark">PWR ${player.power}</span>
                    <span class="pill pill-dark">Heat ${player.heat}</span>
                    ${player.tethered ? '<span class="pill pill-good">Tether</span>' : ''}
                    ${player.braced ? '<span class="pill pill-info">Brace</span>' : ''}
                  </div>
                </div>`
              )
              .join("")}
          </div>
        </div>

        <div class="sub-panel">
          <div class="panel-label">Event log</div>
          <div class="stack-small">${state.log.map((entry) => `<div class="log-entry">${entry}</div>`).join("")}</div>
        </div>
      </div>
    </section>`;
}

function renderLessonOverlay() {
  if (!state.missionEnded) return "";
  return `
    <div class="overlay">
      <div class="overlay-card">
        <div class="micro">Tutorial Lesson</div>
        <h2>You survived the room. Space killed you anyway.</h2>
        <div class="panel-copy">The training run ends here on purpose. The squad dies because one final extraction decision treated vacuum like flavor instead of a lethal rule.</div>
        <div class="stack-small">
          <div class="lesson-row"><strong>What you actually won:</strong> enough control to leave the core room alive.</div>
          <div class="lesson-row"><strong>What you forgot:</strong> extraction is the mission, not just combat.</div>
          <div class="lesson-row"><strong>Why it matters:</strong> this campaign punishes greed, hesitation, and fake confidence.</div>
        </div>
        <button class="button button-primary" data-reset="true">Reset Training Run</button>
      </div>
    </div>`;
}

function render() {
  const app = document.getElementById("app");
  const room = activeRoom();
  const selected = state.selectedClient === "dm" ? null : selectedPlayer();
  app.innerHTML = `
    <div class="app-shell">
      <div class="hero-card">
        <div class="hero-head">
          <div>
            <div class="eyebrow">Dead-Zone Ops // Multiclient Room Prototype</div>
            <h1>Per-Player UI, DM Control, and a Real Tutorial Map</h1>
            <div class="hero-copy">This slice stays on one lane: separate device views, room-based tutorial spaces, turn cycling, and actual movement through zones instead of a shared squad dashboard clicking solved outcomes.</div>
          </div>
          <div class="pill-row hero-pills">
            <span class="pill pill-warning">Turn ${state.turnTimeLeft}s</span>
            <span class="pill pill-dark">Round ${state.round}</span>
            <span class="pill ${state.sealClock <= 2 ? "pill-bad" : "pill-dark"}">Seal ${state.sealClock}</span>
            <span class="pill ${state.pressure >= 3 ? "pill-bad" : "pill-dark"}">Pressure ${state.pressure}</span>
          </div>
        </div>
      </div>

      <section class="panel harness-panel">
        <div class="panel-label">Local Multi-Client Test Harness</div>
        <div class="button-row">
          <button class="button ${state.selectedClient === "dm" ? "button-warning" : "button-secondary"}" data-client="dm">DM View</button>
          ${state.players
            .map(
              (player) => `<button class="button ${state.selectedClient === player.id ? "button-primary" : "button-secondary"}" data-client="${player.id}">${player.callsign}${activeTurnId() === player.id ? " • active" : ""}</button>`
            )
            .join("")}
        </div>
      </section>

      <section class="panel map-panel">
        <div class="panel-label">Tutorial Level Layout</div>
        <div class="room-grid">${ROOMS.map((room) => roomCard(room.id)).join("")}</div>
      </section>

      ${state.selectedClient === "dm" ? renderDmView() : renderPlayerView(selected)}
      ${renderLessonOverlay()}
    </div>`;

  app.querySelectorAll("[data-client]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedClient = button.getAttribute("data-client");
      render();
    });
  });

  app.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.missionEnded) return;
      const playerId = button.getAttribute("data-player");
      const player = state.players.find((entry) => entry.id === playerId);
      if (!player) return;
      const action = actorActions(player).find((entry) => entry.id === button.getAttribute("data-action"));
      if (action) action.apply();
    });
  });

  const reset = app.querySelector("[data-reset='true']");
  if (reset) {
    reset.addEventListener("click", () => {
      Object.assign(state, {
        selectedClient: "dm",
        players: structuredClone(INITIAL_PLAYERS),
        roomState: createRoomState(),
        currentRoomId: "dock",
        sealClock: 7,
        pressure: 0,
        round: 1,
        turnOrder: INITIAL_PLAYERS.map((player) => player.id),
        turnIndex: 0,
        turnTimeLeft: 14,
        missionEnded: false,
        lessonSeen: false,
        log: [
          "Training run reset.",
          "The level is room-and-zone based. Players move through a place, not a list of abstract buttons.",
        ],
      });
      render();
    });
  }
}

setInterval(() => {
  if (state.missionEnded) return;
  state.turnTimeLeft = Math.max(0, state.turnTimeLeft - 1);
  if (state.turnTimeLeft === 0) {
    const actor = activePlayer();
    pushLog(`${actor.callsign} hesitates too long and loses the turn. The room keeps moving.`);
    state.turnIndex = (state.turnIndex + 1) % state.turnOrder.length;
    state.turnTimeLeft = 14;
    if (state.turnIndex === 0) {
      state.round += 1;
      applySiteReaction();
    }
  }
  render();
}, 1000);

render();
