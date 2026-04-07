
const PLAYER_COLORS = ["#5ad6a7", "#6aa7ff", "#ff8f70", "#d47cff", "#f5c56b", "#ff6fb5"];
const CELL = 42;

const BASE_OPERATORS = [
  { role: "Vanguard", family: "Metallic", suit: "Breach", weapon: "Coil Carbine", footprint: { w: 2, h: 2 } },
  { role: "Signal Hacker", family: "Gem", suit: "Relay", weapon: "Laser Intercept", footprint: { w: 2, h: 1 } },
  { role: "Marksman", family: "Chromatic", suit: "Vector", weapon: "Coil Marksman", footprint: { w: 2, h: 1 } },
  { role: "Engineer / Tech", family: "Metallic", suit: "Containment", weapon: "Slug Utility", footprint: { w: 2, h: 1 } },
  { role: "Vanguard", family: "Chromatic", suit: "Breach", weapon: "Plasma Cutter", footprint: { w: 2, h: 2 } },
  { role: "Marksman", family: "Gem", suit: "Vector", weapon: "Coil Longshot", footprint: { w: 2, h: 1 } },
];

function setFromCoords(list){ return new Set(list.map(([x,y])=>`${x},${y}`)); }
function key(x,y){ return `${x},${y}`; }
function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

function rectCells(x,y,w,h){ const arr=[]; for(let yy=y; yy<y+h; yy++) for(let xx=x; xx<x+w; xx++) arr.push([xx,yy]); return arr; }

function makeRoom(key, title, subtitle, cols, rows, floors, types, starts, tutorial, nextKey){
  return { key, title, subtitle, cols, rows, floors:setFromCoords(floors), types, starts, tutorial, nextKey };
}

const ROOMS = {
  dock: makeRoom(
    'dock','Dock Collar','Commit the mission. This is the last safe space.', 16, 10,
    [
      ...rectCells(1,3,5,4), ...rectCells(6,4,4,2), ...rectCells(10,3,3,4), ...rectCells(13,4,2,2),
      ...rectCells(2,1,2,2), ...rectCells(2,7,2,2)
    ],
    {
      '2,2':'cover','2,7':'cover','10,4':'seal','13,4':'exit','14,4':'exit'
    },
    {
      0:{x:2,y:4},1:{x:2,y:5},2:{x:2,y:1},3:{x:2,y:7},4:{x:3,y:4},5:{x:3,y:5}
    },
    [
      { id:'dock_move', label:'Lesson 1A', title:'Move the lead operator to Seal Control', why:'This teaches the first rule: position decides what you can do. The button does nothing until a body reaches it.', wrong:'Clicking support options because they exist. The room only cares whether somebody actually gets to the control.', doNow:'Move Operator 1 toward the seal control pad.', targetType:'seal', actor:0 },
      { id:'dock_break', label:'Lesson 1B', title:'Break the seal from the control pad', why:'Now the room has committed. The timer matters because you physically changed the level state.', wrong:'Treating mission start like flavor text instead of a mechanical threshold.', doNow:'Use Break Seal.', action:'breakSeal', actor:0 },
      { id:'dock_exit', label:'Lesson 1C', title:'Stage at the airlock and advance', why:'Solved controls do not move the squad by themselves. Somebody still has to walk to the threshold.', wrong:'Thinking a solved panel means the whole room is solved.', doNow:'Move to the airlock and use Advance Team.', targetType:'exit', action:'advanceRoom', actor:0 }
    ],
    'entry'
  ),
  entry: makeRoom(
    'entry','Entry Lock','Read before you open. The room is not just a door.', 18, 11,
    [
      ...rectCells(1,4,5,3), ...rectCells(6,4,4,3), ...rectCells(10,3,4,5), ...rectCells(14,4,3,3),
      ...rectCells(6,1,3,2), ...rectCells(6,8,3,2)
    ],
    {
      '7,2':'panel','12,5':'hatch','15,5':'exit','16,5':'exit','7,8':'cover'
    },
    {0:{x:2,y:5},1:{x:6,y:2},2:{x:2,y:4},3:{x:2,y:6},4:{x:3,y:5},5:{x:3,y:4}},
    [
      { id:'entry_panel', label:'Lesson 2A', title:'Read the panel before you touch the hatch', why:'This room teaches that information can be the correct first action. Good operators solve the room’s real problem first.', wrong:'Running straight to the hatch because it is the obvious objective marker.', doNow:'Move Operator 2 to the panel and use Read Panel.', targetType:'panel', action:'readPanel', actor:1 },
      { id:'entry_hatch', label:'Lesson 2B', title:'Cycle the hatch once the read is clean', why:'The panel does not move the squad. The hatch still needs a body on it.', wrong:'Expecting support actions to complete room objectives automatically.', doNow:'Move Operator 1 to the hatch and use Cycle Hatch.', targetType:'hatch', action:'cycleHatch', actor:0 },
      { id:'entry_exit', label:'Lesson 2C', title:'Push to the next room', why:'The station only gives you progress when someone actually reaches the next threshold.', wrong:'Stopping after the smart action instead of finishing the room.', doNow:'Move to the exit and use Advance Team.', targetType:'exit', action:'advanceRoom', actor:0 }
    ],
    'spine'
  ),
  spine: makeRoom(
    'spine','Sensor Spine','You cannot do everything. Read enough, then move.', 22, 11,
    [
      ...rectCells(1,4,18,3), ...rectCells(5,1,3,2), ...rectCells(10,8,4,2), ...rectCells(15,2,3,2), ...rectCells(19,4,2,3)
    ],
    {
      '6,2':'panel','11,8':'cover','12,8':'cover','16,2':'cover','10,5':'hazard','11,5':'hazard','12,5':'hazard','19,5':'exit','20,5':'exit'
    },
    {0:{x:2,y:4},1:{x:5,y:2},2:{x:2,y:5},3:{x:2,y:6},4:{x:3,y:4},5:{x:3,y:5}},
    [
      { id:'spine_read', label:'Lesson 3A', title:'Read the sweep from cover', why:'This room teaches that “do everything” is impossible. Spend one action to cut risk, not six actions to feel safe.', wrong:'Trying to touch every support point before moving. The room gets worse while you stall.', doNow:'Use Operator 2 to read the sweep from the upper panel.', targetType:'panel', action:'readSweep', actor:1 },
      { id:'spine_cross', label:'Lesson 3B', title:'Cross the hot lane and keep moving', why:'You already know enough. Now the lesson is commitment.', wrong:'Looking for a perfect crossing after the room is already tightening.', doNow:'Move Operator 1 through the corridor to the far side exit.', targetType:'exit', actor:0, allowHazardMove:true },
      { id:'spine_exit', label:'Lesson 3C', title:'Advance before the room tightens again', why:'Tutorial or not, the station still punishes delay.', wrong:'Thinking the lesson ends when the action text disappears.', doNow:'Use Advance Team at the exit.', targetType:'exit', action:'advanceRoom', actor:0 }
    ],
    'gap'
  ),
  gap: makeRoom(
    'gap','Crosswind Gap','Vacuum is part of the level. Tethers and footprint matter.', 22, 12,
    [
      ...rectCells(1,4,5,4), ...rectCells(6,5,4,2), ...rectCells(10,5,4,2), ...rectCells(14,5,4,2), ...rectCells(18,4,3,4),
      ...rectCells(7,8,3,2), ...rectCells(15,2,3,2)
    ],
    {
      '4,5':'anchor','8,8':'cover','11,5':'hazard','12,5':'hazard','16,2':'cover','18,5':'cover','20,5':'exit'
    },
    {0:{x:1,y:5},1:{x:2,y:4},2:{x:2,y:6},3:{x:1,y:4},4:{x:1,y:6},5:{x:3,y:5}},
    [
      { id:'gap_tether', label:'Lesson 4A', title:'Anchor before you cross', why:'Forced movement kills sloppy teams faster than damage. The tether is not flavor; it changes whether the crossing is survivable.', wrong:'Charging the breach because it is “just movement.”', doNow:'Move Operator 1 to the anchor point and use Anchor Tether.', targetType:'anchor', action:'anchorTether', actor:0 },
      { id:'gap_cross', label:'Lesson 4B', title:'Cross with the body you actually have', why:'Big dragons need real width. Wings and footprint change what routes are legal.', wrong:'Pretending a dragon can move through any lane just because the box says move.', doNow:'Move Operator 1 across the bridge to the far brace side.', targetType:'cover', actor:0 },
      { id:'gap_exit', label:'Lesson 4C', title:'Stabilize at the far side and advance', why:'The crossing only counts when a body reaches and secures the far side.', wrong:'Treating the middle of the breach like mission progress.', doNow:'Move to the exit and use Advance Team.', targetType:'exit', action:'advanceRoom', actor:0 }
    ],
    'core'
  ),
  core: makeRoom(
    'core','Signal Core Room','Combat is inside terrain. The objective is the mission.', 18, 12,
    [
      ...rectCells(1,3,15,6), ...rectCells(5,1,3,2), ...rectCells(10,9,3,2), ...rectCells(15,4,2,3)
    ],
    {
      '6,2':'cover','7,5':'cover','10,5':'objective','11,9':'cover','15,5':'exit','16,5':'exit'
    },
    {0:{x:2,y:5},1:{x:5,y:2},2:{x:2,y:4},3:{x:2,y:6},4:{x:3,y:5},5:{x:3,y:4}},
    [
      { id:'core_obj', label:'Lesson 5A', title:'Secure the objective, not the room', why:'This room teaches the mission’s core truth: the objective matters more than total cleanup.', wrong:'Thinking you must erase every threat before you can touch the core.', doNow:'Move Operator 1 to the core pedestal and use Secure Objective.', targetType:'objective', action:'secureCore', actor:0 },
      { id:'core_exit', label:'Lesson 5B', title:'Leave with the objective', why:'The room is not the finish line. The way out is still part of the mission.', wrong:'Celebrating in the objective room like extraction is automatic.', doNow:'Move to the exit and use Advance Team.', targetType:'exit', action:'advanceRoom', actor:0 }
    ],
    'extract'
  ),
  extract: makeRoom(
    'extract','Outer Service Arm','The way out is the climax. Space punishes arrogance.', 22, 12,
    [
      ...rectCells(1,5,5,2), ...rectCells(6,5,4,2), ...rectCells(10,4,4,4), ...rectCells(14,5,4,2), ...rectCells(18,5,3,2),
      ...rectCells(9,2,2,2), ...rectCells(14,8,2,2)
    ],
    {
      '10,2':'cover','10,5':'hazard','15,8':'cover','20,5':'exit'
    },
    {0:{x:2,y:5},1:{x:1,y:5},2:{x:1,y:6},3:{x:3,y:5},4:{x:3,y:6},5:{x:2,y:6}},
    [
      { id:'extract_move', label:'Lesson 6A', title:'Do not sprint because the room feels solved', why:'This final lesson is about discipline. The board is safer if you reclip and move through the geometry instead of trying to be clever.', wrong:'Cutting corners because winning the room makes you feel invincible.', doNow:'Move Operator 1 through the service arm to the final airlock.', targetType:'exit', actor:0 },
      { id:'extract_finish', label:'Lesson 6B', title:'Finish the drill', why:'Combat was never the whole mission. Survival and extraction are the mission.', wrong:'Confusing the middle of the run for the end of the run.', doNow:'Use Finish Drill at the final airlock.', targetType:'exit', action:'finishTraining', actor:0 }
    ],
    null
  )
};

const state = {
  screen: 'start',
  playerCount: 4,
  selectedClient: 'dm',
  roomKey: 'dock',
  roomStep: 0,
  players: [],
  activePlayerIndex: 0,
  turn: { moveUsed: false, actionUsed: false },
  roomFlags: {},
  log: ['Tutorial board ready. This teaches the game through one operator on a real room board.'],
  finished: false,
};

function resetFlags(){
  state.roomFlags = {
    dock: { sealBroken:false },
    entry: { panelRead:false, hatchCycled:false },
    spine: { sweepRead:false },
    gap: { tetherAnchored:false },
    core: { objectiveSecured:false },
    extract: { finished:false },
  };
}

function createPlayers(count){
  return Array.from({length:count}, (_,i)=>({
    id:`p${i+1}`,
    callsign:`Operator ${i+1}`,
    color:PLAYER_COLORS[i],
    role:BASE_OPERATORS[i].role,
    family:BASE_OPERATORS[i].family,
    suit:BASE_OPERATORS[i].suit,
    weapon:BASE_OPERATORS[i].weapon,
    footprint: clone(BASE_OPERATORS[i].footprint),
    x:0,y:0,
    oxygen:100,
    power:4,
    hp: BASE_OPERATORS[i].role === 'Vanguard' ? 18 : 14,
  }));
}

function startTraining(){
  state.players = createPlayers(state.playerCount);
  state.selectedClient = 'dm';
  state.roomKey = 'dock';
  state.roomStep = 0;
  state.activePlayerIndex = 0;
  state.turn = { moveUsed:false, actionUsed:false };
  state.finished = false;
  resetFlags();
  placePlayersForRoom('dock');
  state.log = ['Training run started. Player views control only one operator. DM sees the whole board.'];
  state.screen = 'training';
  render();
}

function currentRoom(){ return ROOMS[state.roomKey]; }
function activePlayer(){ return state.players[state.activePlayerIndex]; }
function selectedPlayer(){
  if(state.selectedClient === 'dm') return null;
  return state.players.find(p=>p.id===state.selectedClient) || null;
}

function placePlayersForRoom(roomKey){
  const room = ROOMS[roomKey];
  state.players.forEach((p, idx)=>{
    const start = room.starts[idx] || room.starts[0];
    p.x = start.x; p.y = start.y;
  });
  if(roomKey === 'dock') state.activePlayerIndex = 0;
  if(roomKey === 'entry') state.activePlayerIndex = Math.min(1, state.players.length-1);
  if(roomKey === 'spine') state.activePlayerIndex = Math.min(1, state.players.length-1);
  if(roomKey === 'gap') state.activePlayerIndex = 0;
  if(roomKey === 'core') state.activePlayerIndex = 0;
  if(roomKey === 'extract') state.activePlayerIndex = 0;
  state.turn = { moveUsed:false, actionUsed:false };
}

function footprintCells(player, x=player.x, y=player.y){
  const out=[];
  for(let dy=0; dy<player.footprint.h; dy++){
    for(let dx=0; dx<player.footprint.w; dx++) out.push([x+dx, y+dy]);
  }
  return out;
}

function isFloor(room, x, y){ return room.floors.has(key(x,y)); }

function occupiedByOther(room, player, x, y){
  const mine = new Set(footprintCells(player, x, y).map(([cx,cy])=>key(cx,cy)));
  for(const other of state.players){
    if(other.id === player.id) continue;
    for(const [cx,cy] of footprintCells(other)){
      if(mine.has(key(cx,cy))) return true;
    }
  }
  return false;
}

function legalAnchor(room, player, x, y){
  for(const [cx,cy] of footprintCells(player, x, y)){
    if(cx < 0 || cy < 0 || cx >= room.cols || cy >= room.rows) return false;
    if(!isFloor(room, cx, cy)) return false;
  }
  if(occupiedByOther(room, player, x, y)) return false;
  return true;
}

function legalMoves(player){
  const room = currentRoom();
  const candidates = [[player.x+1, player.y], [player.x-1, player.y], [player.x, player.y+1], [player.x, player.y-1]];
  return candidates.filter(([x,y])=>legalAnchor(room, player, x, y));
}

function bresenham(x0,y0,x1,y1){
  const pts=[];
  let dx=Math.abs(x1-x0), sx=x0<x1?1:-1;
  let dy=-Math.abs(y1-y0), sy=y0<y1?1:-1;
  let err=dx+dy;
  while(true){ pts.push([x0,y0]); if(x0===x1 && y0===y1) break; const e2=2*err; if(e2>=dy){ err+=dy; x0+=sx;} if(e2<=dx){err+=dx; y0+=sy;} }
  return pts;
}

function canSee(actor, target){
  const room = currentRoom();
  const aCells = footprintCells(actor);
  const tCells = footprintCells(target);
  for(const [ax,ay] of aCells){
    for(const [tx,ty] of tCells){
      const dist = Math.abs(ax-tx)+Math.abs(ay-ty);
      if(dist > 10) continue;
      let blocked = false;
      for(const [lx,ly] of bresenham(ax, ay, tx, ty)){
        if((lx===ax && ly===ay) || (lx===tx && ly===ty)) continue;
        if(!isFloor(room, lx, ly)){ blocked = true; break; }
      }
      if(!blocked) return true;
    }
  }
  return false;
}

function roomFeatureAt(x,y){ return currentRoom().types[key(x,y)] || null; }
function footprintTouchesType(player, type){
  return footprintCells(player).some(([x,y]) => roomFeatureAt(x,y) === type);
}

function currentTutorial(){
  const room = currentRoom();
  return room.tutorial[state.roomStep];
}

function recommendedMoves(player){
  const tut = currentTutorial();
  if(!tut || tut.actor !== state.players.indexOf(player) || !tut.targetType) return [];
  const room = currentRoom();
  const targets = [...room.floors].map(s=>s.split(',').map(Number)).filter(([x,y])=> roomFeatureAt(x,y) === tut.targetType);
  if(!targets.length) return [];
  const moves = legalMoves(player);
  if(!moves.length) return [];
  let best = Infinity;
  let out=[];
  for(const [mx,my] of moves){
    const cells = footprintCells(player, mx, my);
    let score = Infinity;
    for(const [tx,ty] of targets){
      for(const [cx,cy] of cells){
        score = Math.min(score, Math.abs(cx-tx)+Math.abs(cy-ty));
      }
    }
    if(score < best){ best = score; out=[[mx,my]]; }
    else if(score === best) out.push([mx,my]);
  }
  return out;
}

function actionList(player){
  const room = currentRoom();
  const tut = currentTutorial();
  const actorIndex = state.players.indexOf(player);
  const actions = [];

  function add(id, name, why, enabled, kind='major'){
    actions.push({ id, name, why, enabled, kind, recommended: tut && tut.action === id && tut.actor === actorIndex });
  }

  if(room.key === 'dock' && footprintTouchesType(player, 'seal') && !state.roomFlags.dock.sealBroken){
    add('breakSeal', 'Break Seal', 'This starts the mission for real. Position plus action changes the room state.', true);
  }
  if(room.key === 'entry' && footprintTouchesType(player, 'panel') && !state.roomFlags.entry.panelRead){
    add('readPanel', 'Read Panel', 'Reading first makes the hatch step safer and cleaner.', true);
  }
  if(room.key === 'entry' && footprintTouchesType(player, 'hatch') && state.roomFlags.entry.panelRead && !state.roomFlags.entry.hatchCycled){
    add('cycleHatch', 'Cycle Hatch', 'Now that the panel read is clean, operating the hatch is the right next move.', true);
  }
  if(room.key === 'spine' && footprintTouchesType(player, 'panel') && !state.roomFlags.spine.sweepRead){
    add('readSweep', 'Read Sweep', 'Spend one action to understand the corridor instead of wasting the whole round on fear.', true);
  }
  if(room.key === 'gap' && footprintTouchesType(player, 'anchor') && !state.roomFlags.gap.tetherAnchored){
    add('anchorTether', 'Anchor Tether', 'The tether is what makes this crossing doctrine instead of a panic sprint.', true);
  }
  if(room.key === 'core' && footprintTouchesType(player, 'objective') && !state.roomFlags.core.objectiveSecured){
    add('secureCore', 'Secure Objective', 'The objective is the mission. Touch it and move the operation forward.', true);
  }
  if(room.key === 'extract' && footprintTouchesType(player, 'exit') && !state.roomFlags.extract.finished){
    add('finishTraining', 'Finish Drill', 'The tutorial ends only when the team survives the geometry and reaches the final airlock.', true);
  }
  if(footprintTouchesType(player, 'exit')){
    const allow = room.key === 'dock' ? state.roomFlags.dock.sealBroken
      : room.key === 'entry' ? state.roomFlags.entry.hatchCycled
      : room.key === 'spine' ? state.roomFlags.spine.sweepRead
      : room.key === 'gap' ? state.roomFlags.gap.tetherAnchored
      : room.key === 'core' ? state.roomFlags.core.objectiveSecured
      : false;
    if(room.nextKey && allow) add('advanceRoom', 'Advance Team', 'This commits the drill to the next room. The room only ends when someone reaches the threshold.', true);
  }

  return actions;
}

function performAction(id){
  const player = activePlayer();
  const room = currentRoom();
  const flags = state.roomFlags[room.key];
  if(id === 'breakSeal') flags.sealBroken = true;
  if(id === 'readPanel') flags.panelRead = true;
  if(id === 'cycleHatch') flags.hatchCycled = true;
  if(id === 'readSweep') flags.sweepRead = true;
  if(id === 'anchorTether') flags.tetherAnchored = true;
  if(id === 'secureCore') flags.objectiveSecured = true;
  if(id === 'finishTraining') { flags.finished = true; state.finished = true; }
  if(id === 'advanceRoom' && room.nextKey){
    state.log.unshift(`${player.callsign} pushed the team from ${room.title} into ${ROOMS[room.nextKey].title}.`);
    state.roomKey = room.nextKey;
    state.roomStep = 0;
    placePlayersForRoom(room.nextKey);
    render();
    return;
  }
  state.turn.actionUsed = true;
  state.log.unshift(`${player.callsign} used ${id}.`);
  advanceTutorialIfNeeded();
  render();
  autoEndTurn();
}

function advanceTutorialIfNeeded(){
  const tut = currentTutorial();
  if(!tut) return;
  const actor = state.players[tut.actor] || activePlayer();
  let done = false;
  if(tut.action){
    const room = currentRoom();
    if(tut.action === 'breakSeal' && state.roomFlags.dock.sealBroken) done = true;
    if(tut.action === 'readPanel' && state.roomFlags.entry.panelRead) done = true;
    if(tut.action === 'cycleHatch' && state.roomFlags.entry.hatchCycled) done = true;
    if(tut.action === 'readSweep' && state.roomFlags.spine.sweepRead) done = true;
    if(tut.action === 'anchorTether' && state.roomFlags.gap.tetherAnchored) done = true;
    if(tut.action === 'secureCore' && state.roomFlags.core.objectiveSecured) done = true;
    if(tut.action === 'finishTraining' && state.finished) done = true;
    if(tut.action === 'advanceRoom') return;
  } else if(tut.targetType){
    done = footprintTouchesType(actor, tut.targetType);
  }
  if(done){
    state.roomStep = Math.min(state.roomStep + 1, currentRoom().tutorial.length - 1);
    state.log.unshift(`Tutorial advanced: ${currentTutorial().title}`);
  }
}

function moveActivePlayer(toX, toY){
  const player = activePlayer();
  if(state.turn.moveUsed) return;
  if(state.selectedClient !== player.id) return;
  const legal = legalMoves(player).some(([x,y])=>x===toX && y===toY);
  if(!legal) return;
  player.x = toX; player.y = toY;
  state.turn.moveUsed = true;
  state.log.unshift(`${player.callsign} moved.`);
  advanceTutorialIfNeeded();
  render();
  autoEndTurn();
}

function endTurn(reason='ended turn'){ state.log.unshift(`${activePlayer().callsign} ${reason}.`); state.activePlayerIndex = (state.activePlayerIndex + 1) % state.players.length; state.turn = { moveUsed:false, actionUsed:false }; render(); autoEndTurn(); }

function autoEndTurn(){
  if(state.screen !== 'training' || state.finished) return;
  const player = activePlayer();
  const moves = legalMoves(player);
  const actions = actionList(player).filter(a=>a.enabled);
  if((state.turn.moveUsed || moves.length===0) && (state.turn.actionUsed || actions.length===0)){
    setTimeout(()=>endTurn('had no useful move left'), 150);
  }
}

function tileClass(room,x,y, recs, visibleFriends){
  const feature = roomFeatureAt(x,y);
  if(!isFloor(room,x,y)) return 'tile void';
  let cls = 'tile floor';
  if(feature === 'cover') cls += ' cover';
  if(feature === 'hazard') cls += ' hazard';
  if(feature === 'anchor') cls += ' anchor';
  if(feature === 'panel' || feature === 'hatch' || feature === 'seal') cls += ' panel';
  if(feature === 'objective') cls += ' objective';
  if(feature === 'exit') cls += ' exit';
  if(recs.some(([rx,ry]) => rx===x && ry===y)) cls += ' recommended';
  if(visibleFriends.has(key(x,y))) cls += ' visible-friend';
  return cls;
}

function renderBoard(clientPlayer, dm=false){
  const room = currentRoom();
  const root = document.createElement('div');
  root.className = 'board-wrap';
  const header = document.createElement('div');
  header.className = 'board-header';
  header.innerHTML = `<div><div class="roomname">${room.title}</div><div class="room-meta">${room.subtitle}</div></div>
    <div class="small">${dm ? 'DM view // full board' : 'Player view // one operator only'}</div>`;
  root.appendChild(header);

  const board = document.createElement('div');
  board.className = 'board';
  board.style.gridTemplateColumns = `repeat(${room.cols}, ${CELL-2}px)`;
  board.style.gridTemplateRows = `repeat(${room.rows}, ${CELL-2}px)`;

  const recMoves = (!dm && clientPlayer && clientPlayer.id === activePlayer().id && !state.turn.moveUsed) ? recommendedMoves(clientPlayer) : [];
  const visibleFriends = new Set();
  if(clientPlayer && !dm){
    state.players.forEach(p=>{ if(p.id!==clientPlayer.id && canSee(clientPlayer,p)) footprintCells(p).forEach(([x,y])=> visibleFriends.add(key(x,y))); });
  }

  for(let y=0; y<room.rows; y++){
    for(let x=0; x<room.cols; x++){
      const cell = document.createElement('div');
      cell.className = tileClass(room,x,y,recMoves, visibleFriends);
      const canMoveHere = clientPlayer && clientPlayer.id === activePlayer().id && !state.turn.moveUsed && legalMoves(clientPlayer).some(([mx,my])=>mx===x && my===y);
      if(canMoveHere){
        cell.style.cursor = 'pointer';
        cell.onclick = ()=>moveActivePlayer(x,y);
      }
      board.appendChild(cell);
    }
  }

  const visiblePlayers = dm ? state.players : state.players.filter(p=> p.id===clientPlayer.id || canSee(clientPlayer,p));
  visiblePlayers.forEach((p, idx)=>{
    const fp = document.createElement('div');
    const active = p.id === activePlayer().id;
    const self = clientPlayer && p.id === clientPlayer.id;
    fp.className = `footprint player ${self ? 'self' : (dm ? '' : 'friend')}`;
    fp.style.left = `${10 + p.x*(CELL-2)}px`;
    fp.style.top = `${10 + p.y*(CELL-2)}px`;
    fp.style.width = `${p.footprint.w*(CELL-2)-2}px`;
    fp.style.height = `${p.footprint.h*(CELL-2)-2}px`;
    fp.style.background = p.id===clientPlayer?.id ? `${p.color}` : `${p.color}99`;
    fp.style.opacity = active || self ? '0.95':'0.72';
    fp.innerHTML = `<span>${p.callsign}${active ? ' • TURN' : ''}</span>`;
    board.appendChild(fp);
  });

  root.appendChild(board);
  const legend = document.createElement('div');
  legend.className = 'legend';
  legend.innerHTML = '<span>Floor</span><span>Cover</span><span>Panel / Seal / Hatch</span><span>Anchor</span><span>Hazard</span><span>Exit</span>';
  root.appendChild(legend);
  return root;
}

function renderPlayerView(player){
  const wrap = document.createElement('div');
  wrap.className = 'layout';
  const tut = currentTutorial();
  const isActive = activePlayer().id === player.id;
  const visibleTeammates = state.players.filter(p=>p.id!==player.id && canSee(player,p));

  const left = document.createElement('div'); left.className='panel stack';
  left.innerHTML = `<h3>${player.callsign}</h3>
    <div class="stats">
      <div class="stat"><div class="label">Role</div><div class="value">${player.role}</div></div>
      <div class="stat"><div class="label">Family</div><div class="value">${player.family}</div></div>
      <div class="stat"><div class="label">Suit</div><div class="value">${player.suit}</div></div>
      <div class="stat"><div class="label">Weapon</div><div class="value">${player.weapon}</div></div>
      <div class="stat"><div class="label">Footprint</div><div class="value">${player.footprint.w}×${player.footprint.h}</div></div>
      <div class="stat"><div class="label">Turn</div><div class="value ${isActive?'good':'waiting'}">${isActive?'Your turn':'Waiting'}</div></div>
    </div>`;
  const lesson = document.createElement('div'); lesson.className='lesson';
  lesson.innerHTML = `<div class="kicker">${tut.label}</div><div style="font-size:20px;font-weight:800;margin-top:6px;">${tut.title}</div><div class="why" style="margin-top:8px;">${tut.why}</div><div class="wrong"><strong>Wrong instinct:</strong> ${tut.wrong}</div><div class="do"><strong>Do now:</strong> ${tut.doNow}</div>`;
  left.appendChild(lesson);
  const mates = document.createElement('div'); mates.className='panel'; mates.style.padding='0';
  mates.innerHTML = `<div style="padding:18px 18px 8px;"><h3>Teammates in line of sight</h3></div>`;
  const matesBody = document.createElement('div'); matesBody.className='stack'; matesBody.style.padding='0 18px 18px';
  if(!visibleTeammates.length) matesBody.innerHTML = '<div class="small">No teammates currently visible from this operator\'s perspective.</div>';
  visibleTeammates.forEach(tm=>{
    const d = document.createElement('div'); d.className='stat'; d.innerHTML = `<div class="label">Visible only</div><div class="value">${tm.callsign}</div><div class="small">You can see them. You cannot move them.</div>`; matesBody.appendChild(d);
  });
  left.appendChild(matesBody);

  const center = renderBoard(player, false);

  const right = document.createElement('div'); right.className='panel stack';
  right.innerHTML = `<h3>Movement and actions</h3><div class="small">Move one cell translation at a time. Your footprint must fully fit on floor cells. You only control your own operator.</div>`;
  const moves = legalMoves(player);
  const moveBox = document.createElement('div'); moveBox.className='panel'; moveBox.style.padding='12px';
  moveBox.innerHTML = `<div class="small">Legal moves</div>`;
  const moveList = document.createElement('div'); moveList.className='move-list';
  if(!isActive || state.turn.moveUsed){ moveList.innerHTML = `<div class="small">${isActive ? 'Movement already used this turn.' : 'Wait for your turn.'}</div>`; }
  else if(!moves.length){ moveList.innerHTML = '<div class="small">No legal movement from this footprint and room geometry.</div>'; }
  else{
    const rec = recommendedMoves(player).map(([x,y])=>key(x,y));
    moves.forEach(([x,y])=>{
      const btn = document.createElement('button'); btn.className='move-btn'; btn.disabled=!isActive || state.turn.moveUsed; btn.textContent = `Move to ${x},${y}${rec.includes(key(x,y)) ? ' • recommended' : ''}`; btn.onclick=()=>moveActivePlayer(x,y); moveList.appendChild(btn);
    });
  }
  moveBox.appendChild(moveList); right.appendChild(moveBox);

  const actionWrap = document.createElement('div'); actionWrap.className='actions';
  actionList(player).forEach(action=>{
    const card = document.createElement('div'); card.className='action-card';
    card.innerHTML = `<div class="name">${action.name}</div><div class="why">${action.why}</div><div class="tags"><span class="badge">${action.kind}</span>${action.recommended?'<span class="badge">tutorial step</span>':''}</div>`;
    const btn = document.createElement('button'); btn.className = action.recommended ? 'primary' : 'soft-btn'; btn.textContent = action.recommended ? 'Do this now' : 'Use action';
    btn.disabled = !isActive || state.turn.actionUsed || !action.enabled;
    btn.onclick = ()=>performAction(action.id);
    card.appendChild(btn); actionWrap.appendChild(card);
  });
  if(!actionWrap.children.length){ const none=document.createElement('div'); none.className='small'; none.textContent='No legal action from where you are standing.'; actionWrap.appendChild(none);}  
  right.appendChild(actionWrap);
  if(isActive){
    const end=document.createElement('button'); end.className='soft-btn'; end.textContent='End turn'; end.onclick=()=>endTurn('ended turn'); right.appendChild(end);
  }

  wrap.append(left, center, right);
  return wrap;
}

function renderDmView(){
  const wrap = document.createElement('div'); wrap.className='layout';
  const left = document.createElement('div'); left.className='panel stack';
  left.innerHTML = `<h3>DM Control</h3><div class="stats"><div class="stat"><div class="label">Room</div><div class="value">${currentRoom().title}</div></div><div class="stat"><div class="label">Tutorial step</div><div class="value">${currentTutorial().label}</div></div><div class="stat"><div class="label">Active operator</div><div class="value">${activePlayer().callsign}</div></div><div class="stat"><div class="label">Players</div><div class="value">${state.players.length}</div></div></div>`;
  const strip = document.createElement('div'); strip.className='tutorial-strip';
  currentRoom().tutorial.forEach((step, idx)=>{ const s=document.createElement('div'); s.className=`step ${idx===state.roomStep?'active':''}`; s.textContent=step.label; strip.appendChild(s); });
  left.appendChild(strip);
  const tele = document.createElement('div'); tele.className='stack';
  state.players.forEach(p=>{ const d=document.createElement('div'); d.className='stat'; d.innerHTML=`<div class="label">${p.callsign}</div><div class="value">${p.role}</div><div class="small">${p.footprint.w}×${p.footprint.h} footprint • ${p.suit}</div>`; tele.appendChild(d);});
  left.appendChild(tele);
  const center = renderBoard(null, true);
  const right = document.createElement('div'); right.className='panel stack';
  right.innerHTML = `<h3>Room telemetry</h3><div class="small">DM sees the whole room. Player clients do not. This is where hidden state and full geometry live.</div>`;
  const log = document.createElement('div'); log.className='log'; state.log.forEach(entry=>{ const d=document.createElement('div'); d.className='log-entry'; d.textContent=entry; log.appendChild(d); }); right.appendChild(log);
  wrap.append(left, center, right);
  return wrap;
}

function render(){
  const app = document.getElementById('app');
  app.innerHTML = '';
  const screen = document.createElement('div'); screen.className='screen';
  if(state.screen === 'start'){
    screen.innerHTML = `<div class="header"><div class="kicker">Dead-Zone Ops // Tutorial</div><div class="title">One true room board, one player at a time.</div><div class="sub">This training mission teaches movement, room reading, commitment, and extraction through an actual board. Each player only controls their own operator. The DM gets the whole picture.</div></div>`;
    const card = document.createElement('div'); card.className='start-card';
    card.innerHTML = `<div class="kicker">Start training</div><div style="font-size:26px;font-weight:800;margin-top:8px;">Choose your table size</div><div class="sub" style="margin-top:8px;">Support 4, 5, or 6 player clients plus one DM client. The tutorial squad is auto-assigned so you can test the actual game board immediately.</div>`;
    const row = document.createElement('div'); row.className='choice-row';
    [4,5,6].forEach(n=>{ const b=document.createElement('button'); b.className=`chip ${state.playerCount===n?'active':''}`; b.textContent=`${n} players`; b.onclick=()=>{state.playerCount=n; render();}; row.appendChild(b); });
    const start = document.createElement('button'); start.className='primary'; start.style.marginTop='18px'; start.textContent='Begin Training Mission'; start.onclick=startTraining;
    card.appendChild(row); card.appendChild(start); screen.appendChild(card);
  } else {
    const top = document.createElement('div'); top.className='header';
    top.innerHTML = `<div class="kicker">Dead-Zone Ops // Tutorial board</div><div class="title">${currentRoom().title}</div><div class="sub">${currentRoom().subtitle} This is a tutorial, not Mission 1: each room introduces one lesson at a time through the board itself.</div>`;
    const tabs = document.createElement('div'); tabs.className='client-tabs';
    const dm = document.createElement('button'); dm.className=`tab ${state.selectedClient==='dm'?'active':''}`; dm.textContent='DM'; dm.onclick=()=>{state.selectedClient='dm'; render();}; tabs.appendChild(dm);
    state.players.forEach(p=>{ const b=document.createElement('button'); b.className=`tab ${state.selectedClient===p.id?'active':''}`; b.textContent=p.callsign; b.onclick=()=>{state.selectedClient=p.id; render();}; tabs.appendChild(b); });
    top.appendChild(tabs); screen.appendChild(top);
    if(state.finished){
      const done=document.createElement('div'); done.className='panel'; done.style.marginTop='18px'; done.innerHTML=`<h3>Tutorial complete</h3><div style="font-size:28px;font-weight:800;">You survived the geometry.</div><div class="sub">The lesson was never “click the right box.” It was move the right body through the right space for the right reason. That is the game.</div>`; screen.appendChild(done);
    }
    screen.appendChild(state.selectedClient === 'dm' ? renderDmView() : renderPlayerView(selectedPlayer()));
  }
  app.appendChild(screen);
}

render();
