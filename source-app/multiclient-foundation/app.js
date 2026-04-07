const ROOMS = [
  {
    id: "dock",
    title: "Dock Collar",
    type: "briefing",
    short: "Final clean briefing before the seal breaks.",
    lesson: "This is the last safe room. Once the seal breaks, the station starts pushing back.",
    objective: "Stage the squad at the threshold, then break the seal from the console.",
    nodes: [
      { id: "rack", label: "Staging Rack", x: 10, y: 65, tags: ["cover", "start"] },
      { id: "console", label: "Seal Console", x: 46, y: 55, tags: ["control"] },
      { id: "threshold", label: "Threshold", x: 82, y: 45, tags: ["exit"] },
    ],
    edges: [["rack", "console"], ["console", "threshold"]],
  },
  {
    id: "entry",
    title: "Entry Lock",
    type: "movement",
    short: "The clock is live. Movement order matters.",
    lesson: "You do not need everybody doing everything. You need the right people moving at the right time.",
    objective: "Get the squad through the lock before the clean window closes.",
    nodes: [
      { id: "outer", label: "Outer Lock", x: 10, y: 55, tags: ["cover", "start"] },
      { id: "inner", label: "Inner Lock", x: 46, y: 55, tags: ["control"] },
      { id: "service", label: "Service Threshold", x: 82, y: 55, tags: ["exit"] },
    ],
    edges: [["outer", "inner"], ["inner", "service"]],
  },
  {
    id: "spine",
    title: "Sensor Spine",
    type: "route",
    short: "Timing, sightlines, and greed.",
    lesson: "Every extra setup action costs time. Time makes the room smarter.",
    objective: "Thread the sweep lane and get everybody to far cover.",
    nodes: [
      { id: "near", label: "Near Cover", x: 10, y: 65, tags: ["cover", "start", "control"] },
      { id: "sweep", label: "Sweep Lane", x: 34, y: 48, tags: ["exposed"] },
      { id: "center", label: "Center Span", x: 55, y: 35, tags: ["exposed"] },
      { id: "pocket", label: "Maintenance Pocket", x: 50, y: 82, tags: ["cover", "pocket"] },
      { id: "far", label: "Far Cover", x: 82, y: 48, tags: ["cover", "exit"] },
    ],
    edges: [["near", "sweep"], ["sweep", "center"], ["center", "far"], ["near", "pocket"], ["pocket", "center"]],
  },
  {
    id: "gap",
    title: "Crosswind Gap",
    type: "traversal",
    short: "Vacuum traversal and tether discipline.",
    lesson: "Wings are control surfaces here, not free flight. Tethers stop stupid deaths.",
    objective: "Cross the breach with the squad intact.",
    nodes: [
      { id: "anchor", label: "Near Anchor", x: 10, y: 70, tags: ["cover", "anchor", "start"] },
      { id: "span", label: "Broken Span", x: 34, y: 55, tags: ["exposed"] },
      { id: "rail", label: "Hazard Rail", x: 57, y: 40, tags: ["exposed", "brace"] },
      { id: "lip", label: "Side Lip", x: 50, y: 82, tags: ["cover", "anchor"] },
      { id: "brace", label: "Far Brace", x: 84, y: 52, tags: ["cover", "exit", "anchor"] },
    ],
    edges: [["anchor", "span"], ["span", "rail"], ["rail", "brace"], ["anchor", "lip"], ["lip", "rail"]],
  },
  {
    id: "core",
    title: "Signal Core Room",
    type: "combat",
    short: "Contained tactical pressure room.",
    lesson: "Combat is there to let you extract the objective, not to flatter your ego.",
    objective: "Break the room's control problem, secure the core, then fall back to the exit door.",
    nodes: [
      { id: "breach", label: "Breach Door", x: 10, y: 56, tags: ["cover", "start"] },
      { id: "kill", label: "Kill Lane", x: 34, y: 40, tags: ["exposed", "problem"] },
      { id: "pedestal", label: "Core Pedestal", x: 56, y: 52, tags: ["objective", "cover"] },
      { id: "side", label: "Side Cover", x: 39, y: 78, tags: ["cover"] },
      { id: "exitdoor", label: "Exit Door", x: 84, y: 52, tags: ["exit", "cover"] },
    ],
    edges: [["breach", "kill"], ["kill", "pedestal"], ["pedestal", "exitdoor"], ["breach", "side"], ["side", "pedestal"]],
  },
  {
    id: "extract",
    title: "Extraction Run",
    type: "escape",
    short: "The path back is uglier than the path in.",
    lesson: "Winning the room means nothing if you die getting out.",
    objective: "Pull the whole squad to the service junction with the objective intact.",
    nodes: [
      { id: "choke", label: "Return Choke", x: 12, y: 55, tags: ["cover", "start"] },
      { id: "shutters", label: "Sliding Shutters", x: 36, y: 55, tags: ["control", "exposed"] },
      { id: "run", label: "Open Run", x: 58, y: 40, tags: ["exposed"] },
      { id: "junction", label: "Service Junction", x: 84, y: 55, tags: ["exit", "cover"] },
    ],
    edges: [["choke", "shutters"], ["shutters", "run"], ["run", "junction"]],
  },
  {
    id: "fatal",
    title: "Outer Service Arm",
    type: "fatal",
    short: "The final bad-decision lesson.",
    lesson: "One rushed extraction choice can kill a squad that 'won' every previous room.",
    objective: "Stand at the rail and choose discipline or greed.",
    nodes: [
      { id: "hatch", label: "Outer Hatch", x: 12, y: 56, tags: ["cover", "start"] },
      { id: "arm", label: "Service Arm", x: 38, y: 56, tags: ["exposed"] },
      { id: "rail", label: "Broken Rail", x: 62, y: 42, tags: ["exposed", "decision"] },
      { id: "safe", label: "Safe Clamp", x: 86, y: 56, tags: ["exit", "cover"] },
    ],
    edges: [["hatch", "arm"], ["arm", "rail"], ["rail", "safe"]],
  },
];

const ROOM_BY_ID = Object.fromEntries(ROOMS.map((room, idx) => [room.id, { ...room, idx }]));
const INITIAL_PLAYERS = [
  { id: "p1", callsign: "Operator 1", role: "Vanguard", family: "Metallic", suit: "Breach", weapon: "Coil Carbine", lane: "front" },
  { id: "p2", callsign: "Operator 2", role: "Signal Hacker", family: "Gem", suit: "Relay", weapon: "Laser Intercept", lane: "cover" },
  { id: "p3", callsign: "Operator 3", role: "Marksman", family: "Chromatic", suit: "Vector", weapon: "Coil Marksman", lane: "back" },
  { id: "p4", callsign: "Operator 4", role: "Engineer / Tech", family: "Metallic", suit: "Containment", weapon: "Slug Utility", lane: "cover" },
  { id: "p5", callsign: "Operator 5", role: "Vanguard", family: "Chromatic", suit: "Breach", weapon: "Arc Blade", lane: "front" },
  { id: "p6", callsign: "Operator 6", role: "Marksman", family: "Gem", suit: "Relay", weapon: "Laser Marksman", lane: "back" },
].map((player) => ({
  ...player,
  roomId: "dock",
  nodeId: "rack",
  hp: baseHp(player.role),
  oxygen: 100,
  power: basePower(player.role),
  heat: 0,
  stress: 0,
  tethered: false,
  braced: false,
}));

const state = {
  selectedClient: "dm",
  players: structuredClone(INITIAL_PLAYERS),
  currentRoomId: "dock",
  sealClock: 7,
  pressure: 0,
  round: 1,
  turnOrder: INITIAL_PLAYERS.map((p) => p.id),
  turnIndex: 0,
  turnTimeLeft: 14,
  missionEnded: false,
  lessonSeen: false,
  roomState: createRoomState(),
  log: [
    "Training run loaded.",
    "This is now a room board, not a fake tab shell.",
    "Players act from where they are standing. The DM sees the whole room state.",
  ],
};

function baseHp(role) {
  return role === "Vanguard" ? 18 : role === "Signal Hacker" ? 12 : role === "Marksman" ? 13 : 14;
}
function basePower(role) {
  return role === "Signal Hacker" || role === "Engineer / Tech" ? 5 : 4;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function activeRoom() { return ROOM_BY_ID[state.currentRoomId]; }
function roomState(id = state.currentRoomId) { return state.roomState[id]; }
function activeTurnId() { return state.turnOrder[state.turnIndex] || state.turnOrder[0]; }
function activePlayer() { return state.players.find((p) => p.id === activeTurnId()) || state.players[0]; }
function selectedPlayer() { return state.players.find((p) => p.id === state.selectedClient) || state.players[0]; }
function currentNode(player) { return activeRoom().nodes.find((n) => n.id === player.nodeId); }

function createRoomState() {
  return Object.fromEntries(ROOMS.map((room) => [room.id, {
    stability: room.type === "briefing" ? 2 : 1,
    exposure: 0,
    support: 0,
    sweepRead: false,
    objectiveSecured: false,
    problemHits: 0,
    sealBroken: false,
    fatalMistake: false,
  }]));
}

function resetState() {
  state.selectedClient = "dm";
  state.players = structuredClone(INITIAL_PLAYERS);
  state.currentRoomId = "dock";
  state.sealClock = 7;
  state.pressure = 0;
  state.round = 1;
  state.turnOrder = INITIAL_PLAYERS.map((p) => p.id);
  state.turnIndex = 0;
  state.turnTimeLeft = 14;
  state.missionEnded = false;
  state.lessonSeen = false;
  state.roomState = createRoomState();
  state.log = [
    "Training run reset.",
    "Move through actual room geometry. Do not click every shiny thing just because it exists.",
  ];
}

function pushLog(text) {
  state.log.unshift(text);
  state.log = state.log.slice(0, 20);
}

function roomPlayers(roomId = state.currentRoomId) {
  return state.players.filter((p) => p.roomId === roomId);
}

function nodeById(room, id) { return room.nodes.find((n) => n.id === id); }
function isAdjacent(room, a, b) {
  return room.edges.some(([x,y]) => (x === a && y === b) || (x === b && y === a));
}
function adjacentNodes(player) {
  const room = activeRoom();
  return room.nodes.filter((node) => isAdjacent(room, player.nodeId, node.id));
}

function graphDistance(room, start, end) {
  if (start === end) return 0;
  const seen = new Set([start]);
  const queue = [[start, 0]];
  while (queue.length) {
    const [cur, dist] = queue.shift();
    const neighbors = room.edges.flatMap(([a,b]) => a === cur ? [b] : b === cur ? [a] : []);
    for (const next of neighbors) {
      if (seen.has(next)) continue;
      if (next === end) return dist + 1;
      seen.add(next);
      queue.push([next, dist + 1]);
    }
  }
  return Infinity;
}

function hasLineOfSight(viewer, teammate, room = activeRoom()) {
  if (!viewer || !teammate || viewer.roomId !== teammate.roomId) return false;
  const distance = graphDistance(room, viewer.nodeId, teammate.nodeId);
  if (distance <= 1) return true;
  const viewerNode = nodeById(room, viewer.nodeId);
  const mateNode = nodeById(room, teammate.nodeId);
  const openViewer = viewerNode.tags.includes('exposed') || viewerNode.tags.includes('objective') || viewerNode.tags.includes('control');
  const openMate = mateNode.tags.includes('exposed') || mateNode.tags.includes('objective') || mateNode.tags.includes('control');
  return distance === 2 && openViewer && openMate;
}

function visibleTeammates(viewer) {
  const room = ROOM_BY_ID[viewer.roomId];
  return state.players.filter((p) => p.id !== viewer.id && hasLineOfSight(viewer, p, room));
}

function visibleNodesForPlayer(viewer, room = activeRoom()) {
  const set = new Set([viewer.nodeId]);
  room.nodes.forEach((node) => {
    if (graphDistance(room, viewer.nodeId, node.id) <= 1) set.add(node.id);
  });
  visibleTeammates(viewer).forEach((mate) => {
    set.add(mate.nodeId);
    room.nodes.forEach((node) => {
      if (graphDistance(room, mate.nodeId, node.id) <= 1) set.add(node.id);
    });
  });
  return set;
}

function roomComplete(roomId = state.currentRoomId) {
  const room = ROOM_BY_ID[roomId];
  const rs = roomState(roomId);
  const players = roomPlayers(roomId);
  if (room.type === "briefing") {
    return rs.sealBroken && players.every((p) => p.nodeId === "threshold");
  }
  if (room.type === "combat") {
    return rs.objectiveSecured && players.every((p) => p.nodeId === "exitdoor");
  }
  if (room.type === "fatal") {
    return rs.fatalMistake || players.every((p) => p.nodeId === "safe");
  }
  const exitNode = room.nodes.find((n) => n.tags.includes("exit"));
  return players.every((p) => p.nodeId === exitNode.id);
}

function moveToNextRoom() {
  const cur = activeRoom();
  const next = ROOMS[Math.min(cur.idx + 1, ROOMS.length - 1)];
  if (next.id === cur.id) return;
  state.currentRoomId = next.id;
  const startNode = next.nodes.find((n) => n.tags.includes("start")) || next.nodes[0];
  state.players = state.players.map((p) => ({ ...p, roomId: next.id, nodeId: startNode.id, tethered: next.type === "traversal" ? p.tethered : false, braced: false }));
  pushLog(`${cur.title} gives way to ${next.title}. The squad keeps moving because standing still is how the site wins.`);
}

function applyAction(playerId, action) {
  if (state.missionEnded || playerId !== activeTurnId()) return;
  const actor = state.players.find((p) => p.id === playerId);
  if (!actor) return;
  action.apply(actor);
  if (roomComplete()) {
    if (activeRoom().type === "fatal") {
      state.missionEnded = true;
      state.lessonSeen = true;
      pushLog("You survived the room. Space killed you anyway. The training ends on the cost of one bad extraction decision.");
      render();
      return;
    }
    moveToNextRoom();
  }
  advanceTurn();
  render();
}

function advanceTurn() {
  state.turnIndex = (state.turnIndex + 1) % state.turnOrder.length;
  state.turnTimeLeft = 14;
  if (state.turnIndex === 0) {
    state.round += 1;
    applySiteReaction();
  }
}

function applySiteReaction() {
  const room = activeRoom();
  const rs = roomState();
  state.sealClock = clamp(state.sealClock - 1, 0, 10);
  state.pressure = clamp(state.pressure + 1, 0, 10);
  let exposedHits = 0;
  roomPlayers().forEach((p) => {
    const node = nodeById(room, p.nodeId);
    if (node.tags.includes("exposed")) {
      p.oxygen = clamp(p.oxygen - 3, 0, 100);
      p.stress += 1;
      exposedHits += 1;
      if (room.type === "traversal" && !p.tethered && !p.braced) {
        rs.exposure = clamp(rs.exposure + 2, 0, 8);
      }
    }
  });
  if (room.type === "route" && !rs.sweepRead) rs.exposure = clamp(rs.exposure + 1, 0, 8);
  if (room.type === "combat" && !rs.objectiveSecured) rs.problemHits = clamp(rs.problemHits + 1, 0, 3);
  if (rs.support > 0) rs.support -= 1;
  if (exposedHits > 0) pushLog(`Site reaction: ${room.title} punishes exposed positions. Being in the wrong place now costs oxygen and stress.`);
  else pushLog(`Site reaction: ${room.title} tightens. Every extra round makes the room meaner.`);
}

function moveAction(player, node) {
  const room = activeRoom();
  return {
    id: `move-${node.id}`,
    label: `Move to ${node.label}`,
    why: node.tags.includes("exposed")
      ? `This advances the mission, but ${node.label} is exposed. Move there because the room demands it, not because every path should be safe.`
      : `This repositions you into ${node.label}. Real play is about where you stand, not which generic button sounded useful.`,
    tone: node.tags.includes("exposed") ? "bad" : "neutral",
    apply(actor) {
      actor.nodeId = node.id;
      actor.oxygen = clamp(actor.oxygen - (node.tags.includes("exposed") ? 4 : 2), 0, 100);
      if (node.tags.includes("exposed")) actor.stress += 1;
      pushLog(`${actor.callsign} moves to ${node.label}. Position matters now.`);
    },
  };
}

function actorActions(player) {
  const room = activeRoom();
  const rs = roomState();
  const node = nodeById(room, player.nodeId);
  const actions = adjacentNodes(player).map((n) => moveAction(player, n));

  const common = [
    {
      id: "steady",
      label: "Keep Formation",
      why: "Spend this turn reducing chaos instead of trying to use every useful thing. Not every turn should be flashy.",
      tone: "good",
      apply(actor) {
        rs.stability = clamp(rs.stability + 1, 0, 6);
        rs.exposure = clamp(rs.exposure - 1, 0, 8);
        pushLog(`${actor.callsign} keeps formation and buys the squad a cleaner next round.`);
      },
    },
  ];

  if (room.type === "briefing") {
    if (node.id === "console" && !rs.sealBroken) {
      actions.push({
        id: "break-seal",
        label: "Break Seal",
        why: "This starts the mission clock. You do this when the team is aligned enough, not when every possible prep box has been checked.",
        tone: "bad",
        apply(actor) {
          rs.sealBroken = true;
          pushLog(`${actor.callsign} breaks the seal. The station stops tolerating the squad.`);
        },
      });
    }
  }

  if (room.type === "movement") {
    if (node.id === "inner" && player.power > 0) {
      actions.push({
        id: "read-entry",
        label: "Read the Entry",
        why: "Use power to make the next move safer. Good prep is targeted, not infinite.",
        tone: "good",
        apply(actor) {
          actor.power -= 1;
          rs.stability = clamp(rs.stability + 1, 0, 6);
          rs.exposure = clamp(rs.exposure - 1, 0, 8);
          pushLog(`${actor.callsign} reads the entry geometry and buys the next operator a cleaner move.`);
        },
      });
    }
    actions.push({
      id: "cover-move",
      label: "Cover the Move",
      why: "Good squads support the next commit instead of all trying to do the same prep for themselves.",
      tone: "good",
      apply(actor) {
        rs.support = clamp(rs.support + 1, 0, 2);
        pushLog(`${actor.callsign} covers the next movement window.`);
      },
    });
  }

  if (room.type === "route") {
    if (node.tags.includes("control") && player.power > 0 && !rs.sweepRead) {
      actions.push({
        id: "read-sweep",
        label: "Read Sweep Timing",
        why: "This is the one prep action the room really rewards. It should help the next move, not replace moving entirely.",
        tone: "good",
        apply(actor) {
          actor.power -= 1;
          rs.sweepRead = true;
          rs.exposure = clamp(rs.exposure - 2, 0, 8);
          pushLog(`${actor.callsign} times the sweep and takes some teeth out of the lane.`);
        },
      });
    }
    if (node.tags.includes("pocket")) {
      actions.push({
        id: "use-pocket",
        label: "Open Pocket Route",
        why: "Safer route, slower route. This buys control with time instead of pretending safety is free.",
        tone: "good",
        apply(actor) {
          rs.stability = clamp(rs.stability + 1, 0, 6);
          rs.support = clamp(rs.support + 1, 0, 2);
          pushLog(`${actor.callsign} opens the maintenance pocket and buys the squad a slower, cleaner angle.`);
        },
      });
    }
  }

  if (room.type === "traversal") {
    if (node.tags.includes("anchor") && !player.tethered && player.power > 0) {
      actions.push({
        id: "anchor-tether",
        label: "Anchor Tether",
        why: "Forced movement kills careless squads faster than damage does. Clip in before the room gets a vote.",
        tone: "good",
        apply(actor) {
          actor.tethered = true;
          actor.power -= 1;
          rs.stability = clamp(rs.stability + 2, 0, 6);
          pushLog(`${actor.callsign} anchors a tether. The crossing gets less stupid.`);
        },
      });
    }
    if ((node.tags.includes("brace") || node.tags.includes("exposed")) && !player.braced && player.power > 0) {
      actions.push({
        id: "wing-brace",
        label: "Wing Brace",
        why: "Wings help you brake and stabilize here. They do not make vacuum crossing free.",
        tone: "good",
        apply(actor) {
          actor.braced = true;
          actor.power -= 1;
          rs.exposure = clamp(rs.exposure - 1, 0, 8);
          pushLog(`${actor.callsign} braces for control instead of treating wings like magic flight.`);
        },
      });
    }
    actions.push({
      id: "stabilize-crossing",
      label: "Stabilize Crossing",
      why: "Support the next move. Good teams do not all spam setup on themselves; they buy one another cleaner commits.",
      tone: "good",
      apply(actor) {
        rs.support = clamp(rs.support + 1, 0, 2);
        rs.stability = clamp(rs.stability + 1, 0, 6);
        pushLog(`${actor.callsign} stabilizes the crossing for whoever moves next.`);
      },
    });
  }

  if (room.type === "combat") {
    if (node.tags.includes("problem")) {
      actions.push({
        id: "solve-problem",
        label: player.role === "Signal Hacker" ? "Disrupt Control Logic" : player.role === "Engineer / Tech" ? "Collapse Route Control" : "Suppress the Problem",
        why: "Hit the thing making the room worse. This is better doctrine than farming meaningless kills.",
        tone: "bad",
        apply(actor) {
          if ((actor.role === "Signal Hacker" || actor.role === "Engineer / Tech") && actor.power > 0) actor.power -= 1;
          rs.problemHits = clamp(rs.problemHits + 1, 0, 3);
          state.pressure = clamp(state.pressure - 1, 0, 10);
          pushLog(`${actor.callsign} attacks the room's actual problem instead of posturing.`);
        },
      });
    }
    if (node.tags.includes("objective")) {
      actions.push({
        id: "secure-core",
        label: "Secure Core",
        why: "Only do this once the room's control problem is handled and somebody has actually reached the objective.",
        tone: rs.problemHits >= 2 ? "good" : "bad",
        enabled: rs.problemHits >= 2,
        disabledText: "The room's control problem is still active.",
        apply(actor) {
          rs.objectiveSecured = true;
          pushLog(`${actor.callsign} secures the core. Combat was only the middle of the mission.`);
        },
      });
    }
  }

  if (room.type === "escape") {
    if (node.id === "shutters" && player.power > 0) {
      actions.push({
        id: "stabilize-route",
        label: "Stabilize Route",
        why: "Worth doing when the path out is about to break the squad. Not worth spamming forever because the clock still burns.",
        tone: "good",
        apply(actor) {
          actor.power -= 1;
          rs.exposure = clamp(rs.exposure - 1, 0, 8);
          rs.stability = clamp(rs.stability + 1, 0, 6);
          pushLog(`${actor.callsign} buys the squad one cleaner extraction window.`);
        },
      });
    }
    actions.push({
      id: "rush",
      label: "Rush the Exit",
      why: "Tempting when the clock is ugly. Risky because speed creates mistakes and shreds discipline.",
      tone: "bad",
      apply(actor) {
        const next = adjacentNodes(actor)[0];
        if (next) actor.nodeId = next.id;
        actor.oxygen = clamp(actor.oxygen - 6, 0, 100);
        actor.stress += 1;
        rs.exposure = clamp(rs.exposure + 2, 0, 8);
        pushLog(`${actor.callsign} rushes. The room notices greed.`);
      },
    });
  }

  if (room.type === "fatal") {
    if (node.tags.includes("decision")) {
      actions.push({
        id: "reclip",
        label: "Reclip and Collapse Wings",
        why: "This is the right call. The room appears solved, but vacuum still wins if discipline breaks.",
        tone: "good",
        apply(actor) {
          actor.tethered = true;
          actor.braced = true;
          actor.nodeId = "safe";
          rs.stability = clamp(rs.stability + 1, 0, 6);
          pushLog(`${actor.callsign} makes the correct call and takes the safe clamp.`);
        },
      });
      actions.push({
        id: "cut-corner",
        label: "Cut the Corner",
        why: "This is the tempting bad decision: the room feels won, the clock feels ugly, and discipline looks optional.",
        tone: "bad",
        apply(actor) {
          rs.fatalMistake = true;
          actor.nodeId = "safe";
          state.pressure = clamp(state.pressure + 2, 0, 10);
          pushLog(`${actor.callsign} cuts the corner. This is where the tutorial teaches the real cost of greed.`);
        },
      });
    }
  }

  return common.concat(actions).reduce((acc, action) => {
    if (action.enabled === false) return acc.concat(action);
    return acc.concat(action);
  }, []).sort((a,b)=> (a.id.startsWith('move-')? -1:1) - (b.id.startsWith('move-')? -1:1));
}

function visibleComms(viewer) {
  return visibleTeammates(viewer).map((p) => `${p.callsign}: ${nodeById(ROOM_BY_ID[p.roomId], p.nodeId).label} // ${p.role}`);
}

function playerLocalObjective(player) {
  const room = activeRoom();
  const here = nodeById(room, player.nodeId);
  if (room.type === 'briefing') return here.id === 'console' ? 'Break the seal or move to the threshold once the squad is ready.' : 'Move toward the console or threshold.';
  if (room.type === 'movement') return here.id === 'inner' ? 'Open the inner lock or cover the next move.' : 'Advance through the lock without wasting turns.';
  if (room.type === 'route') return here.tags.includes('control') ? 'Read the sweep or push to the next cover pocket.' : 'Take ground toward far cover. Do not stall.';
  if (room.type === 'traversal') return here.tags.includes('anchor') ? 'Anchor or support the crossing from this side.' : here.tags.includes('brace') ? 'Brace and help others cross.' : 'Cross without getting dragged into vacuum.';
  if (room.type === 'combat') return here.tags.includes('problem') ? 'Solve the room problem from here.' : here.tags.includes('objective') ? 'Secure the core if the room problem is handled.' : 'Advance to the position your role actually needs.';
  if (room.type === 'escape') return 'Move to the junction or stabilize the route for the next operator.';
  return here.tags.includes('decision') ? 'Choose discipline or greed.' : 'Get to the safe clamp.';
}

function pillClass(type) {
  if (type === 'good') return 'pill pill-good';
  if (type === 'bad') return 'pill pill-bad';
  if (type === 'info') return 'pill pill-info';
  if (type === 'warn') return 'pill pill-warning';
  return 'pill pill-dark';
}
function laneClass(lane) { return lane === 'front' ? 'lane-front' : lane === 'cover' ? 'lane-cover' : 'lane-back'; }
function toneClass(tone) { return tone === 'good' ? 'tone-good' : tone === 'bad' ? 'tone-bad' : 'tone-neutral'; }

function renderMiniLevelMap() {
  return `<div class="mini-level-map">${ROOMS.map((room) => {
    const active = room.id === state.currentRoomId;
    const occupants = state.players.filter((p) => p.roomId === room.id);
    return `<div class="mini-room ${active ? 'mini-room-active' : ''}"><div class="micro">${room.type}</div><div class="mini-room-title">${room.title}</div><div class="mini-room-copy">${room.short}</div><div class="pill-row">${occupants.map((p)=>`<span class="pill pill-dark">${p.callsign}</span>`).join('')}</div></div>`;
  }).join('')}</div>`;
}

function edgeSvg(room) {
  return room.edges.map(([a,b]) => {
    const na = nodeById(room, a); const nb = nodeById(room, b);
    return `<line x1="${na.x}%" y1="${na.y}%" x2="${nb.x}%" y2="${nb.y}%" />`;
  }).join('');
}

function tokensAt(roomId, nodeId) {
  return state.players.filter((p) => p.roomId === roomId && p.nodeId === nodeId);
}

function renderBoard(room, perspective = 'dm', player = null) {
  const rs = roomState(room.id);
  const visibleNodes = perspective === 'player' && player ? visibleNodesForPlayer(player, room) : new Set(room.nodes.map((n) => n.id));
  return `
    <div class="board-wrap">
      <div class="board-header">
        <div>
          <div class="panel-label">${perspective === 'dm' ? 'Live room board' : 'Your local room board'}</div>
          <div class="panel-copy">${perspective === 'dm' ? room.objective : playerLocalObjective(player)}</div>
        </div>
        <div class="pill-row">
          <span class="${pillClass(state.sealClock <= 2 ? 'bad' : 'dark')}">Seal ${state.sealClock}</span>
          <span class="${pillClass(rs.exposure >= 4 ? 'bad' : 'dark')}">Exposure ${rs.exposure}</span>
          <span class="${pillClass('dark')}">Stability ${rs.stability}</span>
          <span class="${pillClass('dark')}">Support ${rs.support}</span>
        </div>
      </div>
      <div class="room-board">
        <svg class="board-lines" viewBox="0 0 100 100" preserveAspectRatio="none">${edgeSvg(room)}</svg>
        ${room.nodes.map((node) => {
          const hidden = perspective === 'player' && player && !visibleNodes.has(node.id);
          const tokens = (hidden ? [] : tokensAt(room.id, node.id)).filter((t) => perspective === 'dm' || t.id === player.id || hasLineOfSight(player, t, room));
          const you = player && player.nodeId === node.id;
          const adjacent = player ? isAdjacent(room, player.nodeId, node.id) : false;
          const classes = ['board-node'];
          if (node.tags.includes('exposed')) classes.push('node-exposed');
          if (node.tags.includes('cover')) classes.push('node-cover');
          if (node.tags.includes('objective') || node.tags.includes('control') || node.tags.includes('decision')) classes.push('node-special');
          if (you) classes.push('node-you');
          if (adjacent) classes.push('node-adjacent');
          if (hidden) classes.push('node-hidden');
          return `<div class="${classes.join(' ')}" style="left:${node.x}%; top:${node.y}%">
            <div class="node-title">${hidden ? 'Unknown' : node.label}</div>
            <div class="node-tags">${hidden ? 'out of sight' : node.tags.filter((t)=>!['start'].includes(t)).join(' • ')}</div>
            <div class="token-stack">${tokens.map((t)=>`<span class="token ${player && t.id===player.id ? 'token-you' : 'token-teammate'}">${t.callsign.replace('Operator ','O')}</span>`).join('')}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function renderPlayerView(player) {
  const room = activeRoom();
  const node = nodeById(room, player.nodeId);
  const isActive = player.id === activeTurnId();
  const actions = actorActions(player);
  const teammates = visibleTeammates(player);
  return `
    <section class="panel player-panel">
      <div class="panel-head operator-head">
        <div>
          <div class="micro">Player View</div>
          <h2>${player.callsign}</h2>
          <div class="role-line">${player.role} • ${player.family}</div>
        </div>
        <div class="${pillClass(isActive ? 'good' : 'dark')}">${isActive ? `Your turn • ${state.turnTimeLeft}s` : 'Waiting'}</div>
      </div>
      <div class="stat-grid">
        <div class="stat-card"><div class="micro">Room</div><div class="stat-value">${room.title}</div></div>
        <div class="stat-card ${player.hp <= 6 ? 'danger' : ''}"><div class="micro">HP</div><div class="stat-value">${player.hp}</div></div>
        <div class="stat-card ${player.oxygen <= 40 ? 'danger' : ''}"><div class="micro">O₂</div><div class="stat-value">${player.oxygen}</div></div>
        <div class="stat-card ${player.power <= 1 ? 'danger' : ''}"><div class="micro">Power</div><div class="stat-value">${player.power}</div></div>
        <div class="stat-card"><div class="micro">Position</div><div class="stat-value">${node.label}</div></div>
      </div>
      <div class="sub-panel"><div class="panel-label">What you need to solve right now</div><div class="panel-copy">${playerLocalObjective(player)}</div></div>
      ${renderBoard(room, 'player', player)}
      <div class="sub-panel"><div class="panel-label">Your kit</div><div class="pill-row"><span class="pill ${laneClass(player.lane)}">${player.lane}</span><span class="pill pill-dark">${player.suit}</span><span class="pill pill-dark">${player.weapon}</span>${player.tethered ? '<span class="pill pill-good">Tethered</span>' : ''}${player.braced ? '<span class="pill pill-info">Braced</span>' : ''}</div></div>
      <div class="sub-panel"><div class="panel-label">Teammates in line of sight</div>${teammates.length ? `<div class="stack-small">${teammates.map((mate)=>`<div class="log-entry"><strong>${mate.callsign}</strong> // ${nodeById(room, mate.nodeId).label} // visible but not controllable</div>`).join('')}</div>` : '<div class="panel-copy">No teammate is currently in your line of sight.</div>'}</div>
      <div class="stack-small"><div class="panel-label">Actions from where you stand</div>${actions.map((action)=>{
        const enabled = action.enabled !== false;
        return `<div class="action-card ${toneClass(action.tone)}"><div class="action-head"><div><div class="action-title">${action.label}</div><div class="action-why">${action.why}</div>${!enabled ? `<div class="warn">${action.disabledText || 'Unavailable right now.'}</div>` : ''}</div><button class="button ${isActive && enabled && !state.missionEnded ? 'button-primary' : 'button-secondary'}" ${isActive && enabled && !state.missionEnded ? `data-action="${action.id}" data-player="${player.id}"` : 'disabled'}>Commit</button></div></div>`;
      }).join('')}</div>
    </section>`;
}

function renderDmView() {
  const room = activeRoom();
  const rs = roomState();
  const active = activePlayer();
  return `
    <section class="panel dm-panel">
      <div class="panel-head operator-head">
        <div>
          <div class="micro">DM View</div>
          <h2>${room.title}</h2>
          <div class="panel-copy">${room.short}</div>
        </div>
        <div class="${pillClass('warn')}">Active Turn: ${active.callsign} • ${state.turnTimeLeft}s</div>
      </div>
      <div class="stat-grid">
        <div class="stat-card ${state.sealClock <= 2 ? 'danger' : ''}"><div class="micro">Seal Clock</div><div class="stat-value">${state.sealClock}</div></div>
        <div class="stat-card"><div class="micro">Round</div><div class="stat-value">${state.round}</div></div>
        <div class="stat-card ${state.pressure >= 3 ? 'danger' : ''}"><div class="micro">Pressure</div><div class="stat-value">${state.pressure}</div></div>
        <div class="stat-card"><div class="micro">Support</div><div class="stat-value">${rs.support}</div></div>
        <div class="stat-card ${rs.exposure >= 4 ? 'danger' : ''}"><div class="micro">Exposure</div><div class="stat-value">${rs.exposure}</div></div>
      </div>
      ${renderBoard(room, 'dm')}
      <div class="dm-grid">
        <div class="sub-panel">
          <div class="panel-label">Operator telemetry</div>
          <div class="stack-small">
            ${state.players.map((player)=>`<div class="telemetry-card"><div class="telemetry-head"><strong>${player.callsign}</strong><span class="pill ${laneClass(player.lane)}">${player.lane}</span></div><div class="micro-copy">${player.role} • ${ROOM_BY_ID[player.roomId].title} // ${nodeById(ROOM_BY_ID[player.roomId], player.nodeId).label}</div><div class="pill-row"><span class="pill pill-dark">HP ${player.hp}</span><span class="pill pill-dark">O₂ ${player.oxygen}</span><span class="pill pill-dark">PWR ${player.power}</span>${player.tethered ? '<span class="pill pill-good">Tether</span>' : ''}${player.braced ? '<span class="pill pill-info">Brace</span>' : ''}</div></div>`).join('')}
          </div>
        </div>
        <div class="sub-panel"><div class="panel-label">Event log</div><div class="stack-small">${state.log.map((entry)=>`<div class="log-entry">${entry}</div>`).join('')}</div></div>
      </div>
    </section>`;
}

function renderLessonOverlay() {
  if (!state.missionEnded) return '';
  return `<div class="overlay"><div class="overlay-card"><div class="micro">Tutorial Lesson</div><h2>You survived the room. Space killed you anyway.</h2><div class="panel-copy">The training run ends here on purpose. The squad dies because one final extraction decision treated vacuum like flavor instead of a lethal rule.</div><div class="stack-small"><div class="lesson-row"><strong>What you actually won:</strong> enough control to leave the core room alive.</div><div class="lesson-row"><strong>What you forgot:</strong> extraction is the mission, not just combat.</div><div class="lesson-row"><strong>Why it matters:</strong> this campaign punishes greed, hesitation, and fake confidence.</div></div><button class="button button-primary" data-reset="true">Reset Training Run</button></div></div>`;
}

function render() {
  const app = document.getElementById('app');
  const selected = state.selectedClient === 'dm' ? null : selectedPlayer();
  app.innerHTML = `
    <div class="app-shell">
      <div class="hero-card">
        <div class="hero-head">
          <div>
            <div class="eyebrow">Dead-Zone Ops // Real Room Prototype</div>
            <h1>Per-Player Room Board, DM Control, and Actual Movement Through Space</h1>
            <div class="hero-copy">This slice finally treats the tutorial like a place. Players move through nodes, commit from exposed or safe positions, and take actions from where they are standing. No more pretending tabs are the game.</div>
          </div>
          <div class="pill-row hero-pills"><span class="pill pill-warning">Turn ${state.turnTimeLeft}s</span><span class="pill pill-dark">Round ${state.round}</span><span class="${pillClass(state.sealClock <=2 ? 'bad' : 'dark')}">Seal ${state.sealClock}</span><span class="${pillClass(state.pressure >=3 ? 'bad' : 'dark')}">Pressure ${state.pressure}</span></div>
        </div>
      </div>
      <section class="panel harness-panel"><div class="panel-label">Local Multi-Client Test Harness</div><div class="button-row"><button class="button ${state.selectedClient==='dm' ? 'button-warning' : 'button-secondary'}" data-client="dm">DM View</button>${state.players.map((p)=>`<button class="button ${state.selectedClient===p.id ? 'button-primary' : 'button-secondary'}" data-client="${p.id}">${p.callsign}${activeTurnId()===p.id ? ' • active' : ''}</button>`).join('')}</div></section>
      ${state.selectedClient === 'dm' ? `<section class=\"panel map-panel\"><div class=\"panel-label\">Tutorial Level Grammar</div>${renderMiniLevelMap()}</section>${renderDmView()}` : renderPlayerView(selected)}
      ${renderLessonOverlay()}
    </div>`;

  app.querySelectorAll('[data-client]').forEach((button)=>button.addEventListener('click', ()=>{ state.selectedClient = button.getAttribute('data-client'); render(); }));
  app.querySelectorAll('[data-action]').forEach((button)=>button.addEventListener('click', ()=>{
    const pid = button.getAttribute('data-player');
    const player = state.players.find((p)=>p.id===pid);
    if (!player) return;
    const action = actorActions(player).find((a)=>a.id===button.getAttribute('data-action'));
    if (action) applyAction(pid, action);
  }));
  const reset = app.querySelector('[data-reset="true"]');
  if (reset) reset.addEventListener('click', ()=>{ resetState(); render(); });
}

setInterval(() => {
  if (state.missionEnded) return;
  state.turnTimeLeft = Math.max(0, state.turnTimeLeft - 1);
  if (state.turnTimeLeft === 0) {
    const actor = activePlayer();
    pushLog(`${actor.callsign} hesitates too long and loses the turn. The room keeps moving.`);
    advanceTurn();
  }
  render();
}, 1000);

render();
