
const CELL = 38;
const BOARD_GAP = 2;
const MAX_LOS = 8;
const SAVE_KEY = 'dzo_tutorial_v13';
const PLAYER_COLORS = ["#6ff0c9", "#75adff", "#ff9470", "#c89cff", "#f1cb6f", "#ff79bb"];

const BASE_OPERATORS = [
  { role: "Vanguard", family: "Metallic", suit: "Breach", weapon: "Coil Carbine" },
  { role: "Signal Hacker", family: "Gem", suit: "Relay", weapon: "Laser Intercept" },
  { role: "Marksman", family: "Chromatic", suit: "Vector", weapon: "Coil Longshot" },
  { role: "Engineer / Tech", family: "Metallic", suit: "Containment", weapon: "Slug Utility" },
  { role: "Vanguard", family: "Chromatic", suit: "Breach", weapon: "Plasma Cutter" },
  { role: "Marksman", family: "Gem", suit: "Relay", weapon: "Coil Carbine" },
].map((op, idx) => ({ ...op, footprint: { w: 2, h: 2 }, callsign: `Operator ${idx+1}` }));

function key(x, y) { return `${x},${y}`; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function setFromCoords(coords) { return new Set(coords.map(([x, y]) => key(x, y))); }
function rect(x1, y1, x2, y2) {
  const out = [];
  for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) out.push([x, y]);
  return out;
}
function parseRoom({ key: roomKey, title, subtitle, cols, rows, floor, features, starts, steps, nextKey }) {
  return { key: roomKey, title, subtitle, cols, rows, floors: setFromCoords(floor), features, starts, steps, nextKey };
}

const ROOMS = {
  dock: parseRoom({
    key: 'dock', title: 'Dock Collar', subtitle: 'Last safe room. Learn that a body must physically reach the control pad.', cols: 20, rows: 12,
    floor: [...rect(1,2,14,8), ...rect(15,4,18,6), ...rect(5,1,8,2), ...rect(5,8,8,9)],
    features: { [key(9,4)]: 'seal', [key(10,4)]: 'seal', [key(9,5)]: 'seal', [key(10,5)]: 'seal', [key(16,4)]: 'exit', [key(17,4)]: 'exit', [key(16,5)]: 'exit', [key(17,5)]: 'exit', [key(5,2)]: 'cover', [key(6,2)]: 'cover', [key(5,8)]: 'cover', [key(6,8)]: 'cover' },
    starts: [{x:2,y:3},{x:4,y:3},{x:2,y:6},{x:4,y:6},{x:6,y:3},{x:6,y:6}],
    steps: [
      { id:'dock-seal-move', type:'move', actor:0, targetFeature:'seal', label:'Lesson 1A', title:'Walk a real body to the seal pad', why:'Nothing starts because a button exists. Somebody physically reaches the pad first.', wrong:'Treating the board like flavor text around a menu.', doNow:'Move Operator 1 until their body overlaps the seal pad.' },
      { id:'dock-seal-act', type:'action', actor:0, actionId:'breakSeal', feature:'seal', button:'Break Seal', title:'Start the mission from the pad', why:'Room state changes only when the operator is in the correct space and commits there.', wrong:'Thinking mission start is narration instead of a threshold.', doNow:'Use Break Seal from the pad.' },
      { id:'dock-exit-move', type:'move', actor:0, targetFeature:'exit', label:'Lesson 1B', title:'Move to the airlock threshold', why:'Solving one station element does not move the squad by magic. Bodies still cross space.', wrong:'Assuming panel success equals room success.', doNow:'Walk Operator 1 to the airlock threshold.' },
      { id:'dock-exit-act', type:'action', actor:0, actionId:'advanceRoom', feature:'exit', button:'Advance Team', title:'Push into the next room', why:'The board itself decides when the next room begins.', wrong:'Looking for a next-room tab.', doNow:'Advance the team through the opened threshold.' },
    ], nextKey:'entry'
  }),
  entry: parseRoom({
    key: 'entry', title: 'Entry Lock', subtitle: 'Read before you touch the hatch. Information is a real action.', cols: 22, rows: 12,
    floor: [...rect(1,4,18,7), ...rect(6,1,10,4), ...rect(14,7,20,10)],
    features: { [key(8,2)]: 'panel', [key(9,2)]: 'panel', [key(8,3)]: 'panel', [key(9,3)]: 'panel', [key(16,7)]: 'hatch', [key(17,7)]: 'hatch', [key(16,8)]: 'hatch', [key(17,8)]: 'hatch', [key(19,8)]: 'exit', [key(20,8)]: 'exit', [key(19,9)]: 'exit', [key(20,9)]: 'exit', [key(4,4)]: 'cover', [key(4,5)]: 'cover', [key(12,7)]: 'cover', [key(12,6)]: 'cover' },
    starts: [{x:2,y:5},{x:6,y:5},{x:2,y:8},{x:6,y:8},{x:10,y:5},{x:10,y:8}],
    steps: [
      { id:'entry-panel-move', type:'move', actor:1, targetFeature:'panel', label:'Lesson 2A', title:'Move the hacker to the scan panel', why:'Sometimes the correct first move is information, not velocity.', wrong:'Charging the hatch because it looks like progress.', doNow:'Move Operator 2 to the upper scan panel.' },
      { id:'entry-panel-act', type:'action', actor:1, actionId:'readPanel', feature:'panel', button:'Read Panel', title:'Read before you open', why:'Reading now prevents stupid commitment later.', wrong:'Touching the hatch blind.', doNow:'Use Read Panel.' },
      { id:'entry-hatch-move', type:'move', actor:0, targetFeature:'hatch', label:'Lesson 2B', title:'Bring the lead body to the hatch', why:'The operator at the hatch is the one who commits the team through it.', wrong:'Assuming the reader also opens everything from anywhere.', doNow:'Move Operator 1 to the hatch controls.' },
      { id:'entry-hatch-act', type:'action', actor:0, actionId:'cycleHatch', feature:'hatch', button:'Cycle Hatch', title:'Cycle once the read is clean', why:'Good teams chain roles together through space.', wrong:'Treating squad roles like flavor instead of sequence.', doNow:'Cycle the hatch and push the room forward.' },
      { id:'entry-exit-move', type:'move', actor:0, targetFeature:'exit', label:'Lesson 2C', title:'Cross the lock instead of staring at it', why:'The room is not solved until a body is through the geometry.', wrong:'Thinking opening the hatch ends the room.', doNow:'Move through the hatch and reach the next threshold.' },
      { id:'entry-exit-act', type:'action', actor:0, actionId:'advanceRoom', feature:'exit', button:'Advance Team', title:'Leave the lock behind', why:'Tutorial rooms teach through spaces. You still have to physically clear them.', wrong:'Waiting for the game to transition automatically.', doNow:'Advance into Sensor Spine.' },
    ], nextKey:'spine'
  }),
  spine: parseRoom({
    key: 'spine', title: 'Sensor Spine', subtitle: 'Long sightlines, sparse cover, and one console that matters.', cols: 24, rows: 12,
    floor: [...rect(1,4,20,7), ...rect(8,1,12,4), ...rect(13,7,16,10), ...rect(20,5,22,7)],
    features: { [key(10,2)]: 'panel', [key(11,2)]: 'panel', [key(10,3)]: 'panel', [key(11,3)]: 'panel', [key(5,4)]: 'cover', [key(5,5)]: 'cover', [key(15,8)]: 'cover', [key(15,9)]: 'cover', [key(18,5)]: 'hazard', [key(18,6)]: 'hazard', [key(19,5)]: 'hazard', [key(19,6)]: 'hazard', [key(21,5)]: 'exit', [key(22,5)]: 'exit', [key(21,6)]: 'exit', [key(22,6)]: 'exit' },
    starts: [{x:2,y:5},{x:4,y:5},{x:2,y:8},{x:4,y:8},{x:6,y:5},{x:6,y:8}],
    steps: [
      { id:'spine-panel-move', type:'move', actor:1, targetFeature:'panel', label:'Lesson 3A', title:'Reach the sweep console', why:'This corridor punishes hesitation, so the first question is where the information lives.', wrong:'Stacking everyone in the lane before anyone learns the room.', doNow:'Move Operator 2 to the sweep console.' },
      { id:'spine-panel-act', type:'action', actor:1, actionId:'readSweep', feature:'panel', button:'Read Sweep', title:'Solve the corridor before the corridor solves you', why:'You spend one action to avoid spending the whole squad on panic.', wrong:'Treating every room like pure movement speed.', doNow:'Use Read Sweep.' },
      { id:'spine-cover-move', type:'move', actor:2, targetFeature:'cover', label:'Lesson 3B', title:'Occupy the first protected lane', why:'Cover is a spatial answer, not a statistic on a sheet.', wrong:'Walking the marksman down the center because it is the shortest line.', doNow:'Move Operator 3 into the lower cover pocket.' },
      { id:'spine-exit-move', type:'move', actor:2, targetFeature:'exit', label:'Lesson 3C', title:'Cross only after you understand the lane', why:'Fast is good only after the room is legible.', wrong:'Trying to force perfect setup forever.', doNow:'Push Operator 3 to the far threshold.' },
      { id:'spine-exit-act', type:'action', actor:2, actionId:'advanceRoom', feature:'exit', button:'Advance Team', title:'Carry the squad through the spine', why:'The room is won by getting bodies through it, not by admiring your setup.', wrong:'Confusing preparation with completion.', doNow:'Advance into Crosswind Gap.' },
    ], nextKey:'gap'
  }),
  gap: parseRoom({
    key:'gap', title:'Crosswind Gap', subtitle:'This is the first true traversal room. Open space punishes arrogance.', cols:24, rows:14,
    floor:[...rect(1,4,7,9),...rect(8,6,12,7),...rect(13,4,20,9),...rect(20,5,22,8),...rect(5,2,6,4),...rect(15,9,16,11)],
    features:{ [key(6,6)]:'anchor',[key(6,7)]:'anchor', [key(9,6)]:'hazard',[key(10,6)]:'hazard',[key(11,6)]:'hazard',[key(9,7)]:'hazard',[key(10,7)]:'hazard',[key(11,7)]:'hazard', [key(15,5)]:'brace',[key(16,5)]:'brace',[key(15,6)]:'brace',[key(16,6)]:'brace', [key(21,6)]:'exit',[key(22,6)]:'exit',[key(21,7)]:'exit',[key(22,7)]:'exit' },
    starts:[{x:2,y:5},{x:2,y:8},{x:4,y:5},{x:4,y:8},{x:1,y:5},{x:1,y:8}],
    steps:[
      { id:'gap-anchor-move', type:'move', actor:0, targetFeature:'anchor', label:'Lesson 4A', title:'Move to the anchor point first', why:'Vacuum traversal starts with where you stand, not with heroic confidence.', wrong:'Stepping onto the broken span just because it is visually obvious.', doNow:'Move Operator 1 to the anchor point.' },
      { id:'gap-anchor-act', type:'action', actor:0, actionId:'anchorTether', feature:'anchor', button:'Anchor Tether', title:'Make the crossing doctrine instead of panic', why:'The tether is the difference between a crossing and a bad story.', wrong:'Treating support actions like optional flavor.', doNow:'Anchor the tether.' },
      { id:'gap-brace-move', type:'move', actor:0, targetFeature:'brace', label:'Lesson 4B', title:'Cross the exposed span to the far brace point', why:'Now the gap is a piece of geometry, not a menu choice. Cross it tile by tile.', wrong:'Expecting the room to auto-resolve because the tether exists.', doNow:'Move across the exposed span to the far brace point.' },
      { id:'gap-exit-move', type:'move', actor:0, targetFeature:'exit', label:'Lesson 4C', title:'Finish the crossing and reform at the threshold', why:'The room is only solved once a body clears the far side.', wrong:'Believing survival in the middle of the gap counts as success.', doNow:'Move to the far threshold.' },
      { id:'gap-exit-act', type:'action', actor:0, actionId:'advanceRoom', feature:'exit', button:'Advance Team', title:'Carry the room into the next one', why:'Real rooms stay solved only when the squad keeps moving.', wrong:'Stopping to admire the crossing.', doNow:'Advance into the Signal Core Room.' },
    ], nextKey:'core'
  }),
  core: parseRoom({
    key:'core', title:'Signal Core Room', subtitle:'Objective first. The room is not about standing in the middle and posing.', cols:22, rows:14,
    floor:[...rect(1,3,18,10),...rect(7,1,12,3),...rect(18,5,20,8),...rect(8,10,12,12)],
    features:{ [key(10,6)]:'objective',[key(11,6)]:'objective',[key(10,7)]:'objective',[key(11,7)]:'objective', [key(5,3)]:'cover',[key(5,4)]:'cover',[key(15,9)]:'cover',[key(15,10)]:'cover', [key(19,6)]:'exit',[key(20,6)]:'exit',[key(19,7)]:'exit',[key(20,7)]:'exit' },
    starts:[{x:2,y:5},{x:2,y:8},{x:5,y:5},{x:5,y:8},{x:1,y:5},{x:1,y:8}],
    steps:[
      { id:'core-objective-move', type:'move', actor:0, targetFeature:'objective', label:'Lesson 5A', title:'Go to the objective instead of the room center', why:'The mission is not to stand where the room looks dramatic. It is to touch the thing that matters.', wrong:'Treating the room like a fight arena first and an objective room second.', doNow:'Move Operator 1 to the core pedestal.' },
      { id:'core-objective-act', type:'action', actor:0, actionId:'secureCore', feature:'objective', button:'Secure Core', title:'The objective is the mission', why:'This is the lesson the whole tutorial has been building toward.', wrong:'Thinking combat is the win condition.', doNow:'Secure the core.' },
      { id:'core-exit-move', type:'move', actor:3, targetFeature:'exit', label:'Lesson 5B', title:'Set the extract lane, don’t just stare at the pedestal', why:'The way out matters while you are still inside.', wrong:'Assuming mission flow ends at the objective.', doNow:'Move Operator 4 to the extraction threshold.' },
      { id:'core-exit-act', type:'action', actor:3, actionId:'advanceRoom', feature:'exit', button:'Start Extraction', title:'Push the team into the run out', why:'A room is only finished when the squad can survive what comes after it.', wrong:'Lingering just because the main switch has been thrown.', doNow:'Start the extraction run.' },
    ], nextKey:'extract'
  }),
  extract: parseRoom({
    key:'extract', title:'Extraction Run', subtitle:'The room is solved only when bodies leave it alive.', cols:22, rows:14,
    floor:[...rect(1,4,18,8),...rect(18,5,20,8),...rect(9,8,12,10),...rect(4,2,7,4)],
    features:{ [key(19,6)]:'exit',[key(20,6)]:'exit',[key(19,7)]:'exit',[key(20,7)]:'exit', [key(6,3)]:'cover',[key(6,4)]:'cover', [key(14,4)]:'hazard',[key(14,5)]:'hazard',[key(15,4)]:'hazard',[key(15,5)]:'hazard' },
    starts:[{x:2,y:5},{x:4,y:5},{x:2,y:8},{x:4,y:8},{x:6,y:5},{x:6,y:8}],
    steps:[
      { id:'extract-exit-move', type:'move', actor:0, targetFeature:'exit', label:'Lesson 6A', title:'Run the way out like it still matters', why:'This is the final correction: extraction is the climax, not cleanup.', wrong:'Mentally ending the mission because the objective is secured.', doNow:'Move Operator 1 to the final threshold.' },
      { id:'extract-exit-act', type:'action', actor:0, actionId:'finishTraining', feature:'exit', button:'Complete Tutorial', title:'End the tutorial with the right lesson', why:'The mission ends when bodies clear the board with the objective, not when a room says nice things about you.', wrong:'Confusing local success with total success.', doNow:'Complete the tutorial.' },
    ], nextKey:null
  })
};

function createEmptyState() {
  return {
    screen: 'start',
    playerCount: 4,
    selectedClient: 'dm',
    players: [],
    roomKey: 'dock',
    roomStep: 0,
    activePlayerIndex: 0,
    turn: { movesLeft: 2, actionUsed: false },
    roomFlags: {},
    finished: false,
    log: ['Tutorial ready. The board teaches the lesson.'],
  };
}
const state = createEmptyState();

function saveState() {
  const payload = clone(state);
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}
function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
    return true;
  } catch { return false; }
}
function clearSave() { localStorage.removeItem(SAVE_KEY); }

function currentRoom() { return ROOMS[state.roomKey]; }
function currentStep() { return currentRoom().steps[state.roomStep]; }
function activePlayer() { return state.players[state.activePlayerIndex]; }
function selectedPlayer() { return state.selectedClient === 'dm' ? null : state.players.find(p => p.id === state.selectedClient) || null; }

function createPlayers(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i+1}`,
    callsign: `Operator ${i+1}`,
    color: PLAYER_COLORS[i],
    role: BASE_OPERATORS[i].role,
    family: BASE_OPERATORS[i].family,
    suit: BASE_OPERATORS[i].suit,
    weapon: BASE_OPERATORS[i].weapon,
    footprint: clone(BASE_OPERATORS[i].footprint),
    oxygen: 100,
    power: 4,
    hp: BASE_OPERATORS[i].role === 'Vanguard' ? 18 : 14,
    x: 0, y: 0,
  }));
}

function resetFlags() {
  state.roomFlags = {
    dock: { sealBroken: false },
    entry: { panelRead: false, hatchCycled: false },
    spine: { sweepRead: false },
    gap: { tetherAnchored: false },
    core: { objectiveSecured: false },
    extract: { finished: false },
  };
}
function footprintCells(player, x = player.x, y = player.y) {
  const cells = [];
  for (let dy = 0; dy < player.footprint.h; dy++) for (let dx = 0; dx < player.footprint.w; dx++) cells.push([x + dx, y + dy]);
  return cells;
}
function isFloor(room, x, y) { return room.floors.has(key(x, y)); }
function roomFeatureAt(room, x, y) { return room.features[key(x, y)] || null; }
function occupiedByOther(room, player, x, y) {
  const mine = new Set(footprintCells(player, x, y).map(([cx, cy]) => key(cx, cy)));
  for (const other of state.players) {
    if (other.id === player.id) continue;
    for (const [cx, cy] of footprintCells(other)) if (mine.has(key(cx, cy))) return true;
  }
  return false;
}
function legalAnchor(room, player, x, y) {
  for (const [cx, cy] of footprintCells(player, x, y)) {
    if (cx < 0 || cy < 0 || cx >= room.cols || cy >= room.rows) return false;
    if (!isFloor(room, cx, cy)) return false;
  }
  return !occupiedByOther(room, player, x, y);
}
function legalMoves(player) {
  const room = currentRoom();
  const candidates = [[player.x + 1, player.y], [player.x - 1, player.y], [player.x, player.y + 1], [player.x, player.y - 1]];
  return candidates.filter(([x, y]) => legalAnchor(room, player, x, y));
}
function bresenham(x0, y0, x1, y1) {
  const points = [];
  let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    points.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
  return points;
}
function cellVisibleToPlayer(player, x, y) {
  for (const [sx, sy] of footprintCells(player)) {
    const dist = Math.abs(sx - x) + Math.abs(sy - y);
    if (dist > MAX_LOS) continue;
    let blocked = false;
    for (const [lx, ly] of bresenham(sx, sy, x, y)) {
      if ((lx === sx && ly === sy) || (lx === x && ly === y)) continue;
      if (!isFloor(currentRoom(), lx, ly)) { blocked = true; break; }
    }
    if (!blocked) return true;
  }
  return false;
}
function canSee(actor, target) {
  return footprintCells(target).some(([x, y]) => cellVisibleToPlayer(actor, x, y));
}
function footprintTouchesFeature(player, feature) {
  return footprintCells(player).some(([x, y]) => roomFeatureAt(currentRoom(), x, y) === feature);
}
function recommendedMoves(player) {
  const step = currentStep();
  if (!step || step.actor !== state.players.indexOf(player) || step.type !== 'move') return [];
  const room = currentRoom();
  const targets = Object.entries(room.features).filter(([, value]) => value === step.targetFeature).map(([coord]) => coord.split(',').map(Number));
  const moves = legalMoves(player);
  if (!targets.length || !moves.length) return [];
  let best = Infinity;
  const out = [];
  for (const [mx, my] of moves) {
    const cells = footprintCells(player, mx, my);
    let score = Infinity;
    for (const [tx, ty] of targets) {
      for (const [cx, cy] of cells) score = Math.min(score, Math.abs(cx - tx) + Math.abs(cy - ty));
    }
    if (score < best) { best = score; out.length = 0; out.push([mx, my]); }
    else if (score === best) out.push([mx, my]);
  }
  return out;
}
function stepActionAvailable(player) {
  const step = currentStep();
  if (!step || step.actor !== state.players.indexOf(player) || step.type !== 'action' || state.turn.actionUsed) return null;
  const onFeature = footprintTouchesFeature(player, step.feature);
  return { enabled: onFeature, button: step.button, actionId: step.actionId, why: step.why, feature: step.feature };
}
function placePlayersForRoom(roomKey) {
  const room = ROOMS[roomKey];
  state.players.forEach((player, idx) => {
    const start = room.starts[idx] || room.starts[room.starts.length - 1];
    player.x = start.x; player.y = start.y;
  });
  resetTurn();
}
function resetTurn() { state.turn = { movesLeft: 2, actionUsed: false }; }
function roomCompletionFlag(stepId) {
  switch (stepId) {
    case 'dock-seal-act': return state.roomFlags.dock.sealBroken;
    case 'entry-panel-act': return state.roomFlags.entry.panelRead;
    case 'entry-hatch-act': return state.roomFlags.entry.hatchCycled;
    case 'spine-panel-act': return state.roomFlags.spine.sweepRead;
    case 'gap-anchor-act': return state.roomFlags.gap.tetherAnchored;
    case 'core-objective-act': return state.roomFlags.core.objectiveSecured;
    case 'extract-exit-act': return state.finished;
    default: return false;
  }
}
function nextPlayerIndex() { return (state.activePlayerIndex + 1) % state.players.length; }
function ensureValidActivePlayer() {
  if (!state.players.length) return;
  state.activePlayerIndex = clamp(state.activePlayerIndex, 0, state.players.length - 1);
}
function advanceStep() {
  const room = currentRoom();
  if (state.roomStep < room.steps.length - 1) {
    state.roomStep += 1;
    resetTurn();
    const step = currentStep();
    state.log.unshift(`${step.label}: ${step.title}`);
    saveState(); render(); return;
  }
  if (room.nextKey) {
    state.roomKey = room.nextKey;
    state.roomStep = 0;
    placePlayersForRoom(room.nextKey);
    state.log.unshift(`Room advanced: ${ROOMS[room.nextKey].title}`);
    saveState(); render(); return;
  }
  state.finished = true;
  saveState(); render();
}
function checkStepCompletion() {
  const step = currentStep();
  if (!step) return;
  const actor = state.players[clamp(step.actor, 0, state.players.length - 1)];
  let done = false;
  if (step.type === 'move') done = footprintTouchesFeature(actor, step.targetFeature);
  if (step.type === 'action') done = roomCompletionFlag(step.id);
  if (done) advanceStep();
}
function endTurn(reason='Turn passes.') {
  state.log.unshift(reason);
  state.activePlayerIndex = nextPlayerIndex();
  resetTurn();
  saveState(); render();
}
function autoEndTurn() {
  const player = activePlayer();
  const moves = legalMoves(player);
  const action = stepActionAvailable(player);
  const noMoves = state.turn.movesLeft <= 0 || moves.length === 0;
  const noAction = !action || !action.enabled || state.turn.actionUsed;
  if (noMoves && noAction) {
    endTurn(`${player.callsign} has nothing useful left from this position. Turn passes automatically.`);
  } else {
    saveState(); render();
  }
}
function performAction(actionId) {
  const player = activePlayer();
  const room = currentRoom();
  if (state.selectedClient !== player.id) return;
  if (state.turn.actionUsed) return;
  if (actionId === 'breakSeal') state.roomFlags.dock.sealBroken = true;
  if (actionId === 'readPanel') state.roomFlags.entry.panelRead = true;
  if (actionId === 'cycleHatch') state.roomFlags.entry.hatchCycled = true;
  if (actionId === 'readSweep') state.roomFlags.spine.sweepRead = true;
  if (actionId === 'anchorTether') state.roomFlags.gap.tetherAnchored = true;
  if (actionId === 'secureCore') state.roomFlags.core.objectiveSecured = true;
  state.turn.actionUsed = true;
  if (actionId === 'advanceRoom') state.log.unshift(`${player.callsign} carried the team out of ${room.title}.`);
  else if (actionId === 'finishTraining') { state.finished = true; state.log.unshift(`${player.callsign} cleared the final threshold. Tutorial complete.`); }
  else state.log.unshift(`${player.callsign} used ${actionId}.`);
  checkStepCompletion();
  autoEndTurn();
}
function moveActivePlayer(x, y) {
  const player = activePlayer();
  if (state.selectedClient !== player.id) return;
  if (state.turn.movesLeft <= 0) return;
  const legal = legalMoves(player).some(([mx, my]) => mx === x && my === y);
  if (!legal) return;
  player.x = x; player.y = y; state.turn.movesLeft -= 1;
  state.log.unshift(`${player.callsign} advanced through ${currentRoom().title}.`);
  checkStepCompletion();
  autoEndTurn();
}
function startTraining() {
  state.players = createPlayers(state.playerCount);
  state.selectedClient = 'dm'; state.roomKey = 'dock'; state.roomStep = 0; state.finished = false; state.activePlayerIndex = 0;
  resetFlags(); placePlayersForRoom('dock');
  state.log = ['Training started. The board is the lesson.']; state.screen = 'training';
  saveState(); render();
}
function hardReset() {
  const next = createEmptyState();
  Object.assign(state, next);
  clearSave();
  render();
}
function tileClass(room, x, y, playerView, recommendedSet) {
  if (!isFloor(room, x, y)) return 'tile wall';
  const feature = roomFeatureAt(room, x, y);
  let cls = 'tile floor';
  if (feature === 'cover') cls += ' cover';
  if (['seal','panel','hatch','objective','exit','anchor','brace'].includes(feature)) cls += ' interact';
  if (feature === 'hazard') cls += ' hazard';
  if (recommendedSet.has(key(x, y))) cls += ' recommended';
  if (playerView && !cellVisibleToPlayer(playerView, x, y) && !footprintCells(playerView).some(([cx, cy]) => cx === x && cy === y)) cls += ' fog';
  return cls;
}
function featureLabel(feature) {
  return { seal:'Seal', panel:'Read', hatch:'Hatch', objective:'Core', exit:'Exit', anchor:'Anchor', brace:'Brace', cover:'Cover', hazard:'Expose' }[feature] || feature;
}
function renderBoard(clientPlayer, dm=false) {
  const room = currentRoom();
  const wrap = document.createElement('div'); wrap.className = 'board-wrap';
  const header = document.createElement('div'); header.className = 'board-header';
  header.innerHTML = `<div><div class="roomname">${room.title}</div><div class="room-meta">${room.subtitle}</div></div><div class="small">${dm ? 'DM sees full room telemetry' : 'Player sees one controllable operator and LOS-limited teammate awareness'}</div>`;
  wrap.appendChild(header);
  const board = document.createElement('div'); board.className = 'board';
  board.style.gridTemplateColumns = `repeat(${room.cols}, ${CELL}px)`; board.style.gridTemplateRows = `repeat(${room.rows}, ${CELL}px)`;
  const recommended = new Set();
  if (!dm && clientPlayer && clientPlayer.id === activePlayer().id && state.turn.movesLeft > 0) {
    for (const [rx, ry] of recommendedMoves(clientPlayer)) footprintCells(clientPlayer, rx, ry).forEach(([cx, cy]) => recommended.add(key(cx, cy)));
  }
  for (let y = 0; y < room.rows; y++) {
    for (let x = 0; x < room.cols; x++) {
      const tile = document.createElement('button');
      tile.className = tileClass(room, x, y, dm ? null : clientPlayer, recommended);
      tile.style.gridColumn = `${x + 1}`; tile.style.gridRow = `${y + 1}`;
      const feature = roomFeatureAt(room, x, y);
      if (feature) { const marker = document.createElement('span'); marker.className = 'marker'; marker.textContent = featureLabel(feature); tile.appendChild(marker); }
      tile.disabled = true;
      if (!dm && clientPlayer && clientPlayer.id === activePlayer().id && state.turn.movesLeft > 0) {
        const legal = legalMoves(clientPlayer).some(([mx, my]) => mx === x && my === y);
        if (legal) { tile.disabled = false; tile.onclick = () => moveActivePlayer(x, y); }
      }
      board.appendChild(tile);
    }
  }
  state.players.forEach((player) => {
    const visible = dm || (clientPlayer && (player.id === clientPlayer.id || canSee(clientPlayer, player)));
    if (!visible) return;
    const token = document.createElement('div');
    const active = player.id === activePlayer().id;
    const friendly = clientPlayer && player.id !== clientPlayer.id;
    token.className = `token ${active ? 'active' : ''} ${friendly ? 'friendly' : ''}`;
    token.style.left = `${player.x * CELL + 1}px`; token.style.top = `${player.y * CELL + 1}px`;
    token.style.width = `${player.footprint.w * CELL - BOARD_GAP}px`; token.style.height = `${player.footprint.h * CELL - BOARD_GAP}px`;
    token.style.setProperty('--token-color', player.color);
    token.innerHTML = `<div class="tok-name">${player.callsign.replace('Operator ', 'Op ')}</div><div class="tok-role">${player.role.split(' ')[0]}</div>`;
    board.appendChild(token);
  });
  wrap.appendChild(board);
  const legend = document.createElement('div'); legend.className = 'legend';
  legend.innerHTML = `<div><span class="swatch cover"></span> cover</div><div><span class="swatch interact"></span> interaction</div><div><span class="swatch hazard"></span> exposed / hazard</div><div><span class="swatch recommended"></span> recommended next space</div>`;
  wrap.appendChild(legend);
  return wrap;
}
function renderStepStrip() {
  const strip = document.createElement('div'); strip.className = 'step-strip';
  currentRoom().steps.forEach((step, idx) => { const el = document.createElement('div'); el.className = `step ${idx === state.roomStep ? 'active' : idx < state.roomStep ? 'done' : ''}`; el.textContent = step.label; strip.appendChild(el); });
  return strip;
}
function renderPlayerView(player) {
  const wrap = document.createElement('div'); wrap.className = 'layout';
  const step = currentStep(); const isActive = player.id === activePlayer().id;
  const visibleTeammates = state.players.filter((p) => p.id !== player.id && canSee(player, p));
  const left = document.createElement('div'); left.className = 'panel stack';
  left.innerHTML = `<h3>${player.callsign}</h3>
    <div class="stats">
      <div class="stat"><div class="label">Role</div><div class="value">${player.role}</div></div>
      <div class="stat"><div class="label">Suit</div><div class="value">${player.suit}</div></div>
      <div class="stat"><div class="label">Weapon</div><div class="value">${player.weapon}</div></div>
      <div class="stat"><div class="label">Body footprint</div><div class="value">${player.footprint.w}×${player.footprint.h}</div></div>
      <div class="stat"><div class="label">Turn</div><div class="value ${isActive ? 'good' : 'waiting'}">${isActive ? 'Your turn' : `Waiting on ${activePlayer().callsign}`}</div></div>
      <div class="stat"><div class="label">Moves left</div><div class="value">${isActive ? state.turn.movesLeft : '—'}</div></div>
    </div>`;
  const lesson = document.createElement('div'); lesson.className = 'lesson';
  const isLessonActor = step.actor === state.players.indexOf(player);
  lesson.innerHTML = `<div class="lesson-label">${step.label}</div><div class="lesson-title">${step.title}</div><div class="why">${step.why}</div><div class="wrong"><strong>Wrong instinct:</strong> ${step.wrong}</div><div class="do"><strong>Do now:</strong> ${isLessonActor ? step.doNow : `Support the team or hold. ${BASE_OPERATORS[step.actor].callsign || `Operator ${step.actor+1}`} owns this lesson step.`}</div>`;
  left.appendChild(lesson);
  const mates = document.createElement('div'); mates.className = 'panel'; mates.innerHTML = '<h3>Visible teammates</h3>';
  const matesBody = document.createElement('div'); matesBody.className = 'stack';
  if (!visibleTeammates.length) { const info = document.createElement('div'); info.className = 'small'; info.textContent = 'No teammates currently in line of sight.'; matesBody.appendChild(info); }
  else {
    visibleTeammates.forEach((tm) => {
      const card = document.createElement('div'); card.className = 'stat';
      card.innerHTML = `<div class="label">Visible only</div><div class="value">${tm.callsign}</div><div class="small">You can see them. You cannot move them.</div>`;
      matesBody.appendChild(card);
    });
  }
  mates.appendChild(matesBody); left.appendChild(mates);
  const center = renderBoard(player, false);
  const right = document.createElement('div'); right.className = 'panel stack';
  right.innerHTML = `<h3>From this position</h3><div class="small">Move one tile translation at a time. Your 2×2 dragon body must fit entirely on floor cells.</div>`;
  const movesBox = document.createElement('div'); movesBox.className = 'panel panel-soft';
  const moves = isActive ? legalMoves(player) : [];
  movesBox.innerHTML = `<div class="small">Legal moves from here</div><div class="big">${isActive ? moves.length : 0}</div><div class="small">Use highlighted tiles to move. You can only move your own body.</div>`;
  right.appendChild(movesBox);
  const action = stepActionAvailable(player);
  const actionBox = document.createElement('div'); actionBox.className = 'panel panel-soft';
  if (!isActive) {
    actionBox.innerHTML = `<div class="small">Waiting</div><div class="big">Observe</div><div class="small">Only the active operator can act.</div>`;
  } else if (action) {
    actionBox.innerHTML = `<div class="small">Current room action</div><div class="big">${action.button}</div><div class="small">${action.enabled ? action.why : `Move onto the ${featureLabel(action.feature).toLowerCase()} first.`}</div>`;
    const btn = document.createElement('button'); btn.className = 'primary'; btn.textContent = action.button; btn.disabled = !action.enabled; btn.onclick = () => performAction(action.actionId); actionBox.appendChild(btn);
  } else {
    actionBox.innerHTML = `<div class="small">No room action from here</div><div class="big">Reposition or end turn</div><div class="small">The current lesson still expects movement or another operator.</div>`;
  }
  right.appendChild(actionBox);
  if (isActive) {
    const endTurnBox = document.createElement('div'); endTurnBox.className = 'panel panel-soft';
    endTurnBox.innerHTML = `<div class="small">Testing / pacing</div><div class="big">End Turn</div><div class="small">Skip the rest of your turn if you are done moving or cannot help this lesson step.</div>`;
    const endBtn = document.createElement('button'); endBtn.className = 'primary ghost'; endBtn.textContent = 'End Turn'; endBtn.onclick = () => endTurn(`${player.callsign} yields the turn.`); endTurnBox.appendChild(endBtn);
    right.appendChild(endTurnBox);
  }
  right.appendChild(renderStepStrip());
  wrap.append(left, center, right); return wrap;
}
function renderDmView() {
  const wrap = document.createElement('div'); wrap.className = 'layout';
  const left = document.createElement('div'); left.className = 'panel stack';
  left.innerHTML = `<h3>DM Control</h3><div class="stats"><div class="stat"><div class="label">Room</div><div class="value">${currentRoom().title}</div></div><div class="stat"><div class="label">Players</div><div class="value">${state.players.length}</div></div><div class="stat"><div class="label">Active operator</div><div class="value">${activePlayer().callsign}</div></div><div class="stat"><div class="label">Tutorial step</div><div class="value">${currentStep().label}</div></div></div>`;
  left.appendChild(renderStepStrip());
  const tele = document.createElement('div'); tele.className = 'stack';
  state.players.forEach((p) => { const s = document.createElement('div'); s.className = 'stat'; s.innerHTML = `<div class="label">${p.callsign}</div><div class="value">${p.role}</div><div class="small">${p.footprint.w}×${p.footprint.h} dragon body • ${p.suit}</div>`; tele.appendChild(s); });
  left.appendChild(tele);
  const center = renderBoard(null, true);
  const right = document.createElement('div'); right.className = 'panel stack';
  right.innerHTML = '<h3>Room telemetry</h3><div class="small">DM sees the whole room, every operator, and the actual geometry teaching the lesson.</div>';
  const controls = document.createElement('div'); controls.className = 'panel panel-soft';
  controls.innerHTML = `<div class="small">Quick controls</div><div class="big">Tutorial Save</div><div class="small">Reset if you want to replay from Dock Collar.</div>`;
  const resetBtn = document.createElement('button'); resetBtn.className = 'primary danger'; resetBtn.textContent = 'Reset Save'; resetBtn.onclick = hardReset; controls.appendChild(resetBtn); right.appendChild(controls);
  const log = document.createElement('div'); log.className = 'log'; state.log.forEach((entry) => { const row = document.createElement('div'); row.className = 'log-entry'; row.textContent = entry; log.appendChild(row); }); right.appendChild(log);
  wrap.append(left, center, right); return wrap;
}
function renderStart() {
  const screen = document.createElement('div'); screen.className = 'screen';
  const header = document.createElement('div'); header.className = 'header';
  header.innerHTML = `<div class="kicker">Dead-Zone Ops // Tutorial</div><div class="title">One player, one dragon body, one board.</div><div class="sub">This is a tutorial, not Mission 1. It introduces movement, reading, crossing, objective discipline, and extraction through the map itself.</div>`;
  screen.appendChild(header);
  const card = document.createElement('div'); card.className = 'start-card';
  card.innerHTML = `<div class="kicker">Table size</div><div class="title-sm">Choose 4, 5, or 6 player clients</div><div class="sub" style="margin-top:8px;">The tutorial assigns the squad automatically so you can test the actual board immediately.</div>`;
  const row = document.createElement('div'); row.className = 'choice-row';
  [4,5,6].forEach((n) => { const b = document.createElement('button'); b.className = `chip ${state.playerCount === n ? 'active' : ''}`; b.textContent = `${n} players`; b.onclick = () => { state.playerCount = n; saveState(); render(); }; row.appendChild(b); });
  const start = document.createElement('button'); start.className = 'primary'; start.style.marginTop = '18px'; start.textContent = 'Begin Training Mission'; start.onclick = startTraining;
  card.append(row, start);
  if (localStorage.getItem(SAVE_KEY)) {
    const continueBtn = document.createElement('button'); continueBtn.className = 'primary ghost'; continueBtn.style.marginTop = '12px'; continueBtn.textContent = 'Continue Saved Tutorial'; continueBtn.onclick = () => { if (loadState()) { ensureValidActivePlayer(); render(); } };
    const resetBtn = document.createElement('button'); resetBtn.className = 'primary danger'; resetBtn.style.marginTop = '12px'; resetBtn.textContent = 'Reset Save'; resetBtn.onclick = hardReset;
    card.append(continueBtn, resetBtn);
  }
  screen.appendChild(card); return screen;
}
function renderTraining() {
  const screen = document.createElement('div'); screen.className = 'screen';
  const top = document.createElement('div'); top.className = 'header';
  top.innerHTML = `<div class="kicker">Dead-Zone Ops // Tutorial board</div><div class="title">${currentRoom().title}</div><div class="sub">${currentRoom().subtitle} The lesson should make sense by looking at the board, not by reading a wall of text.</div>`;
  const tabs = document.createElement('div'); tabs.className = 'client-tabs';
  const dmTab = document.createElement('button'); dmTab.className = `tab ${state.selectedClient === 'dm' ? 'active' : ''}`; dmTab.textContent = 'DM'; dmTab.onclick = () => { state.selectedClient = 'dm'; saveState(); render(); }; tabs.appendChild(dmTab);
  state.players.forEach((p) => { const b = document.createElement('button'); b.className = `tab ${state.selectedClient === p.id ? 'active' : ''}`; b.textContent = p.callsign; b.onclick = () => { state.selectedClient = p.id; saveState(); render(); }; tabs.appendChild(b); });
  const resetBtn = document.createElement('button'); resetBtn.className = 'tab danger'; resetBtn.textContent = 'Reset Save'; resetBtn.onclick = hardReset; tabs.appendChild(resetBtn);
  top.appendChild(tabs); screen.appendChild(top);
  if (state.finished) {
    const done = document.createElement('div'); done.className = 'panel'; done.style.marginTop = '18px';
    done.innerHTML = `<h3>Tutorial complete</h3><div class="finish-title">You survived the geometry.</div><div class="sub">The lesson was never “click the right box.” It was move the right body through the right space for the right reason.</div>`;
    const resetBtn2 = document.createElement('button'); resetBtn2.className = 'primary danger'; resetBtn2.textContent = 'Reset Save'; resetBtn2.onclick = hardReset; done.appendChild(resetBtn2);
    screen.appendChild(done);
  } else {
    screen.appendChild(state.selectedClient === 'dm' ? renderDmView() : renderPlayerView(selectedPlayer()));
  }
  return screen;
}
function render() {
  const app = document.getElementById('app'); app.innerHTML = '';
  app.appendChild(state.screen === 'start' ? renderStart() : renderTraining());
}
if (!loadState()) {
  saveState();
}
render();
