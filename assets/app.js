
const ROLE_OPTIONS = ["Vanguard", "Signal Hacker", "Marksman", "Engineer / Tech"];
const FAMILY_OPTIONS = ["Metallic", "Chromatic", "Gem"];
const PLAYER_COLORS = ["#5ad6a7", "#6aa7ff", "#ff8f70", "#d47cff", "#f5c56b", "#ff6fb5"];

const ROOM_SEQUENCE = [
  {
    key: "dock",
    title: "Dock Collar",
    lesson: "Break the seal and commit. This is the last safe space.",
    objectiveText: "Move to Seal Control and break the seal.",
    startNode: "dock_staging",
    exitNode: "dock_airlock",
    nodes: [
      { id: "dock_staging", x: 18, y: 60, name: "Staging Ring", type: "cover", tags: ["cover"], desc: "Final clean staging point before the mission begins." },
      { id: "dock_observe", x: 36, y: 28, name: "Observation Slit", type: "support", tags: [], desc: "Look into the dead station and steady your read." },
      { id: "dock_tether", x: 36, y: 78, name: "Tether Rack", type: "support", tags: ["cover"], desc: "Mag clamps and spare lines." },
      { id: "dock_seal", x: 62, y: 60, name: "Seal Control", type: "objective", tags: ["interactive"], desc: "The lock that turns briefing into mission." },
      { id: "dock_airlock", x: 84, y: 60, name: "Inner Airlock", type: "exit", tags: ["interactive"], desc: "Entry to the dead station." }
    ],
    edges: [["dock_staging","dock_observe"],["dock_staging","dock_tether"],["dock_staging","dock_seal"],["dock_seal","dock_airlock"]],
  },
  {
    key: "entry",
    title: "Entry Lock",
    lesson: "Movement order matters as soon as the clock starts.",
    objectiveText: "Cycle the inner hatch and stage the team at the spine door.",
    startNode: "entry_lock",
    exitNode: "spine_door",
    nodes: [
      { id: "entry_lock", x: 14, y: 60, name: "Entry Lock", type: "start", tags: ["cover"], desc: "Broken pressure chamber." },
      { id: "left_cover", x: 32, y: 38, name: "Left Cover", type: "cover", tags: ["cover"], desc: "A shielded recess." },
      { id: "right_panel", x: 32, y: 80, name: "Right Panel", type: "support", tags: ["interactive"], desc: "The hatch status display and override leads." },
      { id: "inner_hatch", x: 58, y: 60, name: "Inner Hatch", type: "objective", tags: ["interactive","exposed"], desc: "Cycle this to reach the spine." },
      { id: "spine_door", x: 84, y: 60, name: "Spine Door", type: "exit", tags: ["interactive"], desc: "Door into the sensor corridor." }
    ],
    edges: [["entry_lock","left_cover"],["entry_lock","right_panel"],["left_cover","inner_hatch"],["right_panel","inner_hatch"],["inner_hatch","spine_door"]],
  },
  {
    key: "spine",
    title: "Sensor Spine",
    lesson: "You do not get to do everything. Read the sweep or outrun it.",
    objectiveText: "Thread the corridor and get everyone to the gap door.",
    startNode: "spine_start",
    exitNode: "gap_door",
    nodes: [
      { id: "spine_start", x: 10, y: 60, name: "Spine Start", type: "cover", tags: ["cover"], desc: "Last sheltered segment before the sweep." },
      { id: "near_cover", x: 26, y: 36, name: "Near Cover", type: "cover", tags: ["cover","interactive"], desc: "Good place to read the sweep." },
      { id: "center_sweep", x: 44, y: 60, name: "Center Sweep", type: "hazard", tags: ["exposed","hazard"], desc: "Timing lane cut by the active sensor sweep." },
      { id: "upper_duct", x: 44, y: 22, name: "Upper Duct", type: "support", tags: ["interactive"], desc: "Narrow sightline to read the pattern." },
      { id: "pocket_turn", x: 44, y: 92, name: "Pocket Turn", type: "support", tags: ["interactive"], desc: "Slip route into maintenance." },
      { id: "far_cover", x: 66, y: 42, name: "Far Cover", type: "cover", tags: ["cover"], desc: "A hard wall before the next commit." },
      { id: "gap_door", x: 86, y: 60, name: "Gap Door", type: "exit", tags: ["interactive"], desc: "Access to the hull breach." }
    ],
    edges: [["spine_start","near_cover"],["spine_start","center_sweep"],["near_cover","center_sweep"],["near_cover","upper_duct"],["center_sweep","far_cover"],["pocket_turn","center_sweep"],["pocket_turn","far_cover"],["far_cover","gap_door"]],
  },
  {
    key: "gap",
    title: "Crosswind Gap",
    lesson: "Wings are control surfaces, not free flight. Tethers matter.",
    objectiveText: "Anchor, brace, and cross the breach without getting shredded by vacuum pull.",
    startNode: "near_anchor",
    exitNode: "core_door",
    nodes: [
      { id: "near_anchor", x: 12, y: 64, name: "Near Anchor", type: "support", tags: ["cover","interactive"], desc: "Best point to anchor a tether line." },
      { id: "near_cover_gap", x: 24, y: 36, name: "Near Cover", type: "cover", tags: ["cover"], desc: "Half-shielded plating near the breach." },
      { id: "broken_span", x: 44, y: 58, name: "Broken Span", type: "hazard", tags: ["exposed","hazard"], desc: "Open to vacuum and crosswind." },
      { id: "hazard_rail", x: 58, y: 30, name: "Hazard Rail", type: "hazard", tags: ["exposed","hazard"], desc: "Fast but lethal if you overcorrect." },
      { id: "side_lip", x: 56, y: 86, name: "Side Lip", type: "support", tags: ["interactive"], desc: "Good bracing point for controlled movement." },
      { id: "far_brace", x: 76, y: 58, name: "Far Brace Point", type: "support", tags: ["interactive","cover"], desc: "Where the crossing stabilizes." },
      { id: "core_door", x: 90, y: 58, name: "Core Door", type: "exit", tags: ["interactive"], desc: "Entry to the signal chamber." }
    ],
    edges: [["near_anchor","near_cover_gap"],["near_anchor","broken_span"],["near_cover_gap","broken_span"],["broken_span","hazard_rail"],["broken_span","side_lip"],["hazard_rail","far_brace"],["side_lip","far_brace"],["far_brace","core_door"]],
  },
  {
    key: "core",
    title: "Signal Core Room",
    lesson: "Combat is not the goal. Secure the objective and move.",
    objectiveText: "Break the room’s control problem and secure the core.",
    startNode: "core_entry",
    exitNode: "extract_lock",
    nodes: [
      { id: "core_entry", x: 14, y: 60, name: "Core Entry", type: "cover", tags: ["cover"], desc: "The room opens up here." },
      { id: "low_cover", x: 32, y: 36, name: "Low Cover", type: "cover", tags: ["cover"], desc: "Good angle on the pedestal." },
      { id: "side_console", x: 34, y: 84, name: "Side Console", type: "support", tags: ["interactive"], desc: "Control node that calms the room if jammed." },
      { id: "core_pedestal", x: 58, y: 58, name: "Core Pedestal", type: "objective", tags: ["interactive","exposed"], desc: "The objective. The mission is here." },
      { id: "rear_choke", x: 72, y: 32, name: "Rear Choke", type: "cover", tags: ["cover"], desc: "Tighter angle to protect the exit." },
      { id: "extract_lock", x: 88, y: 58, name: "Extraction Lock", type: "exit", tags: ["interactive"], desc: "Back into the extraction corridors." }
    ],
    edges: [["core_entry","low_cover"],["core_entry","side_console"],["low_cover","core_pedestal"],["side_console","core_pedestal"],["core_pedestal","rear_choke"],["core_pedestal","extract_lock"],["rear_choke","extract_lock"]],
  },
  {
    key: "extract",
    title: "Extraction Run",
    lesson: "The route out is worse than the route in.",
    objectiveText: "Get the squad to the service hatch without treating the room like it’s already over.",
    startNode: "extract_start",
    exitNode: "service_hatch",
    nodes: [
      { id: "extract_start", x: 12, y: 60, name: "Extraction Start", type: "cover", tags: ["cover"], desc: "The station is now reacting to the theft." },
      { id: "shutter_lane", x: 34, y: 38, name: "Shutter Lane", type: "hazard", tags: ["exposed"], desc: "Fast lane through moving shutters." },
      { id: "fast_line", x: 54, y: 26, name: "Fast Line", type: "hazard", tags: ["exposed","hazard"], desc: "Direct but nasty." },
      { id: "safe_line", x: 52, y: 84, name: "Safe Line", type: "cover", tags: ["cover"], desc: "Slower, steadier route." },
      { id: "regroup", x: 70, y: 60, name: "Regroup Point", type: "support", tags: ["interactive","cover"], desc: "Last place to get disciplined." },
      { id: "service_hatch", x: 88, y: 60, name: "Service Hatch", type: "exit", tags: ["interactive"], desc: "Exit to the outer arm." }
    ],
    edges: [["extract_start","shutter_lane"],["shutter_lane","fast_line"],["shutter_lane","safe_line"],["fast_line","regroup"],["safe_line","regroup"],["regroup","service_hatch"]],
  },
  {
    key: "fatal",
    title: "Outer Service Arm",
    lesson: "You can survive the room and still die in vacuum by getting arrogant on the way out.",
    objectiveText: "Cross the arm. The final lesson is about discipline, not firepower.",
    startNode: "arm_start",
    exitNode: "escape_hook",
    nodes: [
      { id: "arm_start", x: 12, y: 60, name: "Arm Start", type: "cover", tags: ["cover"], desc: "Still attached to the station body." },
      { id: "damaged_rail", x: 34, y: 60, name: "Damaged Rail", type: "support", tags: ["interactive"], desc: "Where you can reclip and collapse your profile." },
      { id: "outer_arm", x: 54, y: 42, name: "Outer Arm", type: "hazard", tags: ["exposed"], desc: "Open and unstable, but still survivable." },
      { id: "unstable_joint", x: 70, y: 26, name: "Unstable Joint", type: "hazard", tags: ["hazard","interactive"], desc: "Tempting shortcut. Bad doctrine." },
      { id: "escape_hook", x: 90, y: 58, name: "Escape Hook", type: "exit", tags: ["interactive"], desc: "Looks like the finish line." }
    ],
    edges: [["arm_start","damaged_rail"],["damaged_rail","outer_arm"],["outer_arm","unstable_joint"],["outer_arm","escape_hook"],["unstable_joint","escape_hook"]],
  }
];

const state = {
  screen: "setup",
  squadSize: 4,
  clientView: "dm",
  setupOperators: [],
  players: [],
  roomIndex: 0,
  roomStates: {},
  activePlayerId: null,
  turn: { moveUsed: false, majorUsed: false, minorUsed: false, secondsLeft: 18 },
  round: 1,
  sealClock: 18,
  pressure: 0,
  stability: 3,
  exposure: 0,
  objectiveSecured: false,
  log: [],
  debrief: null
};

function defaultOperator(i){
  const roleDefaults = ["Vanguard","Signal Hacker","Marksman","Engineer / Tech","Vanguard","Marksman"];
  const familyDefaults = ["Metallic","Gem","Chromatic","Metallic","Chromatic","Gem"];
  return { id:`p${i+1}`, callsign:`Operator ${i+1}`, role: roleDefaults[i], family: familyDefaults[i], color: PLAYER_COLORS[i] };
}

function initSetup(){
  state.setupOperators = Array.from({length:6}, (_,i)=>defaultOperator(i));
}
initSetup();

function freshRoomStates(){
  return Object.fromEntries(ROOM_SEQUENCE.map(room=>[room.key,{
    objectiveComplete:false,
    scan:false,
    pocketRoute:false,
    tetherAnchored:false,
    braced:false,
    consoleJammed:false,
    regrouped:false,
    disciplineCall:false,
  }]));
}

function startMission(){
  state.players = state.setupOperators.slice(0,state.squadSize).map(op=>({
    ...op,
    hp: op.role==="Vanguard" ? 18 : op.role==="Engineer / Tech" ? 15 : op.role==="Marksman" ? 13 : 12,
    oxygen:100,
    power: op.role==="Signal Hacker" || op.role==="Engineer / Tech" ? 5 : 4,
    stress:0,
    nodeId: ROOM_SEQUENCE[0].startNode,
    roomKey: ROOM_SEQUENCE[0].key,
    braced:false,
    tethered:false
  }));
  state.roomIndex = 0;
  state.roomStates = freshRoomStates();
  state.activePlayerId = state.players[0].id;
  state.clientView = state.players[0].id;
  state.turn = { moveUsed:false, majorUsed:false, minorUsed:false, secondsLeft:18 };
  state.round = 1;
  state.sealClock = 18;
  state.pressure = 0;
  state.stability = 3;
  state.exposure = 0;
  state.objectiveSecured = false;
  state.log = [
    "Training run started. This is a board-based drill: move through real rooms, solve the route, and survive the way out.",
    "Player view controls one operator only. Teammates are only visible when they are close enough to see."
  ];
  state.debrief = null;
  state.screen = "mission";
  render();
}

function currentRoom(){
  return ROOM_SEQUENCE[state.roomIndex];
}

function adjacency(room){
  const map = {};
  room.nodes.forEach(n=>map[n.id]=[]);
  room.edges.forEach(([a,b])=>{ map[a].push(b); map[b].push(a); });
  return map;
}

function nodeMap(room){
  return Object.fromEntries(room.nodes.map(n=>[n.id,n]));
}

function graphDistance(room, startId){
  const adj = adjacency(room);
  const dist = {};
  Object.keys(adj).forEach(k=>dist[k]=Infinity);
  dist[startId]=0;
  const q=[startId];
  while(q.length){
    const cur=q.shift();
    for(const nxt of adj[cur]){
      if(dist[nxt] > dist[cur] + 1){
        dist[nxt] = dist[cur] + 1;
        q.push(nxt);
      }
    }
  }
  return dist;
}

function getPlayer(id){ return state.players.find(p=>p.id===id); }
function isActivePlayer(id){ return state.activePlayerId===id; }

function log(msg){ state.log.unshift(msg); }

function visibleNodeIdsFor(player, room){
  const d = graphDistance(room, player.nodeId);
  return new Set(Object.keys(d).filter(id => d[id] <= 2));
}

function visibleTeammatesFor(player, room){
  const d = graphDistance(room, player.nodeId);
  return state.players.filter(p=>p.id!==player.id && p.roomKey===room.key && d[p.nodeId] <= 1);
}

function teammatesHiddenCountFor(player, room){
  const d = graphDistance(room, player.nodeId);
  return state.players.filter(p=>p.id!==player.id && p.roomKey===room.key && d[p.nodeId] > 1).length;
}

function allPlayersAt(nodeId){
  const key = currentRoom().key;
  return state.players.every(p=>p.roomKey!==key || p.nodeId===nodeId);
}

function movePlayerTo(playerId, nodeId){
  const room = currentRoom();
  const player = getPlayer(playerId);
  if(!player || !isActivePlayer(playerId) || state.turn.moveUsed || state.screen!=="mission") return;
  if(player.roomKey !== room.key) return;
  const adj = adjacency(room)[player.nodeId] || [];
  if(!adj.includes(nodeId)) return;
  player.nodeId = nodeId;
  state.turn.moveUsed = true;

  const node = nodeMap(room)[nodeId];
  if(room.key==="spine" && nodeId==="center_sweep" && !state.roomStates.spine.scan){
    player.oxygen = Math.max(0, player.oxygen - 12);
    state.exposure += 1;
    log(`${player.callsign} cuts through the sweep blind and loses oxygen to the exposed lane.`);
  }
  if(room.key==="gap" && (nodeId==="broken_span" || nodeId==="hazard_rail") && !state.roomStates.gap.tetherAnchored && !state.roomStates.gap.braced){
    player.oxygen = Math.max(0, player.oxygen - 15);
    player.stress += 1;
    state.exposure += 1;
    log(`${player.callsign} crosses raw at the breach. That is exactly the kind of vacuum mistake this training punishes.`);
  }
  if(room.key==="extract" && nodeId==="fast_line"){
    state.exposure += 1;
    log(`${player.callsign} takes the fast line. Faster is not the same thing as safer.`);
  }
  if(room.key==="fatal" && nodeId==="unstable_joint"){
    state.exposure += 1;
    log(`${player.callsign} steps onto the unstable joint. This is where bad extraction doctrine starts to feel tempting.`);
  }
  render();
}

function roomActionCards(player, room){
  const roomState = state.roomStates[room.key];
  const cards = [];

  const add = (id, title, desc, type, enabled, onRun) => cards.push({id,title,desc,type,enabled,onRun});

  if(!state.turn.minorUsed){
    add("checkin", "Minor: Check In", "Calm the operator and mark their lane. Small stability boost.", "minor", true, ()=>{
      state.turn.minorUsed = true;
      state.stability = Math.min(5, state.stability + 1);
      log(`${player.callsign} checks in and stabilizes their movement discipline.`);
      render();
    });
  }

  if(!state.turn.majorUsed){
    if(room.key==="dock" && player.nodeId==="dock_seal" && !roomState.objectiveComplete){
      add("breakseal","Major: Break Seal","Start the mission for real. Once this breaks, the station pushes back.","major",true,()=>{
        roomState.objectiveComplete = true;
        state.turn.majorUsed = true;
        state.sealClock = Math.max(0, state.sealClock - 1);
        log(`${player.callsign} breaks the seal. The training mission starts pushing back immediately.`);
        render();
      });
    }
    if(room.key==="entry" && player.nodeId==="right_panel" && !roomState.scan){
      add("scanlock","Major: Read Panel","Use signal sense or engineering discipline to understand the hatch before cycling it.","major",true,()=>{
        roomState.scan = true;
        state.turn.majorUsed = true;
        state.pressure = Math.max(0, state.pressure - 1);
        log(`${player.callsign} reads the inner hatch logic. The team now understands the entry lock better.`);
        render();
      });
    }
    if(room.key==="entry" && player.nodeId==="inner_hatch" && !roomState.objectiveComplete){
      add("cyclehatch","Major: Cycle Hatch","Open the hatch and commit the team deeper. Safer if you already read the panel.","major",true,()=>{
        roomState.objectiveComplete = true;
        state.turn.majorUsed = true;
        if(!roomState.scan){
          state.exposure += 1;
          log(`${player.callsign} cycles the hatch without a proper read. The team gets through, but less cleanly.`);
        } else {
          log(`${player.callsign} cycles the hatch with a clean read. Good doctrine.`);
        }
        render();
      });
    }
    if(room.key==="spine" && (player.nodeId==="near_cover" || player.nodeId==="upper_duct") && !roomState.scan){
      add("readsweep","Major: Read Sweep","Spend time to cut exposure later. This is often smarter than doing everything fast.","major",true,()=>{
        roomState.scan = true;
        state.turn.majorUsed = true;
        state.exposure = Math.max(0, state.exposure - 1);
        log(`${player.callsign} reads the sensor pattern. The corridor becomes more manageable.`);
        render();
      });
    }
    if(room.key==="spine" && player.nodeId==="pocket_turn" && !roomState.pocketRoute){
      add("pocketroute","Major: Slip Pocket Route","Take the slower maintenance route to buy control.","major",true,()=>{
        roomState.pocketRoute = true;
        state.turn.majorUsed = true;
        state.stability = Math.min(5, state.stability + 1);
        state.sealClock = Math.max(0, state.sealClock - 1);
        log(`${player.callsign} opens the maintenance pocket route. Safer, slower, still a tradeoff.`);
        render();
      });
    }
    if(room.key==="gap" && player.nodeId==="near_anchor" && !roomState.tetherAnchored){
      add("anchortether","Major: Anchor Tether","Forced movement kills careless squads faster than damage does. Anchor before you cross.","major",true,()=>{
        roomState.tetherAnchored = true;
        player.tethered = true;
        player.power = Math.max(0, player.power - 1);
        state.turn.majorUsed = true;
        state.stability = Math.min(5, state.stability + 1);
        log(`${player.callsign} anchors the tether line. Now the crossing has a backbone.`);
        render();
      });
    }
    if(room.key==="gap" && (player.nodeId==="side_lip" || player.nodeId==="far_brace") && !roomState.braced){
      add("bracewings","Major: Brace Hard","Collapse the profile and brace against vacuum pull before the room overcorrects you.","major",true,()=>{
        roomState.braced = true;
        player.braced = true;
        player.power = Math.max(0, player.power - 1);
        state.turn.majorUsed = true;
        state.exposure = Math.max(0, state.exposure - 1);
        log(`${player.callsign} braces at the breach. The crossing gets less stupid.`);
        render();
      });
    }
    if(room.key==="core" && player.nodeId==="side_console" && !roomState.consoleJammed){
      add("jamconsole","Major: Jam Route Node","Break the room’s control problem instead of treating combat like a killbox.","major",true,()=>{
        roomState.consoleJammed = true;
        state.turn.majorUsed = true;
        state.pressure = Math.max(0, state.pressure - 1);
        log(`${player.callsign} jams the side console. The room gets less mean.`);
        render();
      });
    }
    if(room.key==="core" && player.nodeId==="core_pedestal" && !roomState.objectiveComplete){
      add("securecore","Major: Secure Core","The objective is the mission. Combat is only there to make this hard.","major",true,()=>{
        roomState.objectiveComplete = true;
        state.objectiveSecured = true;
        state.turn.majorUsed = true;
        log(`${player.callsign} secures the core. Now the way out matters more than the fight.`);
        render();
      });
    }
    if(room.key==="extract" && player.nodeId==="regroup" && !roomState.regrouped){
      add("regroup","Major: Regroup","Spend one beat getting disciplined instead of pretending the mission is already over.","major",true,()=>{
        roomState.regrouped = true;
        state.turn.majorUsed = true;
        state.stability = Math.min(5, state.stability + 1);
        state.pressure = Math.max(0, state.pressure - 1);
        log(`${player.callsign} forces a regroup before the final run.`);
        render();
      });
    }
    if(room.key==="fatal" && player.nodeId==="damaged_rail" && !roomState.disciplineCall){
      add("reclip","Major: Reclip & Collapse Wings","This is the correct doctrine. Slow down, tighten profile, survive the vacuum.","major",true,()=>{
        roomState.disciplineCall = true;
        state.turn.majorUsed = true;
        player.tethered = true;
        player.braced = true;
        state.stability = Math.min(5, state.stability + 1);
        log(`${player.callsign} makes the correct call at the damaged rail. This is how disciplined squads think.`);
        render();
      });
    }
    if(room.key==="fatal" && player.nodeId==="unstable_joint"){
      add("cutcorner","Major: Cut the Corner","This is the tempting bad decision. It feels efficient because the room feels solved.","major",true,()=>{
        state.turn.majorUsed = true;
        finishTraining("The squad clears the room, then dies in vacuum after treating extraction like an afterthought. Winning combat was never the real objective.");
      });
    }
  }

  if(roomState.objectiveComplete && allPlayersAt(room.exitNode) && player.nodeId===room.exitNode){
    cards.push({
      id:"advance",
      title: room.key==="fatal" ? "Complete Training Debrief" : "Advance Team",
      desc: room.key==="fatal" ? "Leave the training board and record the lesson." : "Everyone is staged. Push the squad into the next room.",
      type:"advance",
      enabled:true,
      onRun:()=>{
        if(room.key==="fatal"){
          finishTraining("The training run ends with a hard lesson: you can survive the room and still die if you stop respecting vacuum and extraction discipline.");
        } else {
          advanceRoom();
        }
      }
    });
  }

  if(room.key==="fatal" && roomState.disciplineCall && player.nodeId==="escape_hook"){
    cards.push({
      id:"teachloss",
      title:"Major: Review the Fatal Telemetry",
      desc:"You made the correct call. The drill still shows the archived outcome when one operator cuts the corner after 'winning.'",
      type:"major",
      enabled:!state.turn.majorUsed,
      onRun:()=>{
        state.turn.majorUsed = true;
        finishTraining("You chose the disciplined path, then reviewed the fatal telemetry of a squad that did not. The lesson is the same: extraction is the mission.");
      }
    });
  }

  return cards;
}

function advanceRoom(){
  if(state.roomIndex >= ROOM_SEQUENCE.length - 1){
    finishTraining("Training complete.");
    return;
  }
  state.roomIndex += 1;
  const room = currentRoom();
  state.players.forEach(p=>{
    p.roomKey = room.key;
    p.nodeId = room.startNode;
    p.braced = false;
    p.tethered = false;
  });
  state.turn = { moveUsed:false, majorUsed:false, minorUsed:false, secondsLeft:18 };
  state.activePlayerId = state.players[0].id;
  log(`The squad enters ${room.title}. ${room.lesson}`);
  render();
}

function finishTraining(summary){
  state.debrief = summary;
  state.screen = "debrief";
  render();
}

function endTurn(reason = "ended the turn"){
  const active = getPlayer(state.activePlayerId);
  log(`${active.callsign} ${reason}.`);
  const idx = state.players.findIndex(p=>p.id===state.activePlayerId);
  const nextIdx = (idx + 1) % state.players.length;
  state.activePlayerId = state.players[nextIdx].id;
  state.turn = { moveUsed:false, majorUsed:false, minorUsed:false, secondsLeft:18 };
  if(nextIdx === 0){
    siteReaction();
  }
  render();
}

function siteReaction(){
  const room = currentRoom();
  state.round += 1;
  state.sealClock = Math.max(0, state.sealClock - 1);
  state.pressure += 1;
  let notes = [`Round ${state.round}: the site tightens. Seal clock drops and pressure rises.`];

  if(room.key==="spine" && !state.roomStates.spine.scan){
    state.exposure += 1;
    notes.push("The sensor spine gets meaner because nobody committed to reading the sweep.");
  }
  if(room.key==="gap" && !state.roomStates.gap.tetherAnchored && !state.roomStates.gap.braced){
    state.exposure += 1;
    notes.push("The breach gets uglier because the team tried to cross without anchoring or bracing.");
  }
  if(room.key==="core" && !state.roomStates.core.consoleJammed){
    state.pressure += 1;
    notes.push("The core room keeps solving the squad because nobody broke the control problem.");
  }
  if(room.key==="extract" && !state.roomStates.extract.regrouped){
    state.exposure += 1;
    notes.push("Extraction gets sloppier because the squad never regrouped.");
  }
  if(room.key==="fatal" && state.pressure >= 3){
    notes.push("The outer service arm is now actively punishing hurry. Bad doctrine here is lethal.");
  }

  if(state.sealClock === 0){
    state.pressure += 1;
    state.exposure += 1;
    notes.push("Seal clock hits zero. The level is now openly turning against the squad.");
  }

  log(notes.join(" "));
}

function tick(){
  if(state.screen !== "mission") return;
  state.turn.secondsLeft -= 1;
  if(state.turn.secondsLeft <= 0){
    endTurn("forfeited the turn by hesitating");
  } else {
    render(false);
  }
}
setInterval(tick, 1000);

function render(force = true){
  const app = document.getElementById("app");
  if(state.screen === "setup"){
    app.innerHTML = renderSetup();
    bindSetup();
    return;
  }
  if(state.screen === "debrief"){
    app.innerHTML = renderDebrief();
    bindDebrief();
    return;
  }
  app.innerHTML = renderMission();
  bindMission();
}

function renderSetup(){
  const activeOps = state.setupOperators.slice(0,state.squadSize).map((op, i)=>`
    <div class="operator-card">
      <div class="role-tag">${op.callsign}</div>
      <h4>${op.callsign}</h4>
      <div class="field">
        <label class="label">Role</label>
        <select data-op="${i}" data-field="role">
          ${ROLE_OPTIONS.map(r=>`<option value="${r}" ${r===op.role?"selected":""}>${r}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label class="label">Family</label>
        <select data-op="${i}" data-field="family">
          ${FAMILY_OPTIONS.map(f=>`<option value="${f}" ${f===op.family?"selected":""}>${f}</option>`).join("")}
        </select>
      </div>
      <div class="muted" style="margin-top:10px;font-size:13px;">This client will later become a single-player operator view. During testing you can swap between all 4–6 players and the DM.</div>
    </div>
  `).join("");

  return `
    <div class="card topbar">
      <div>
        <div class="title">Dead-Zone Ops // Training Mission</div>
        <div class="subtitle">4 to 6 separate player clients plus 1 DM client. The training mission is board-based all the way through: real rooms, real nodes, real movement, and only one controllable operator per player view.</div>
      </div>
      <div class="badges">
        <div class="badge"><div class="k">Players</div><div class="v">${state.squadSize}</div></div>
        <div class="badge"><div class="k">Mission</div><div class="v">Training</div></div>
        <div class="badge"><div class="k">Board</div><div class="v">Active</div></div>
        <div class="badge"><div class="k">Clients</div><div class="v">DM + ${state.squadSize}</div></div>
      </div>
    </div>
    <div class="setup-grid" style="margin-top:16px;">
      <div class="card panel">
        <div class="h2">Build the squad</div>
        <div class="muted" style="margin-top:8px;line-height:1.6;">Choose 4, 5, or 6 operators. Once the mission starts, the board is always live. No more clicking through empty text boxes pretending to be gameplay.</div>
        <div class="field" style="max-width:180px;margin-top:16px;">
          <label class="label">Squad size</label>
          <select id="squad-size">
            <option value="4" ${state.squadSize===4?"selected":""}>4 players</option>
            <option value="5" ${state.squadSize===5?"selected":""}>5 players</option>
            <option value="6" ${state.squadSize===6?"selected":""}>6 players</option>
          </select>
        </div>
        <div class="setup-ops" style="margin-top:16px;">${activeOps}</div>
        <div class="footer-actions" style="margin-top:18px;">
          <button class="primary" id="launch-training">Launch board-based training mission</button>
          <button class="secondary" id="recommended-squad">Use recommended spread</button>
        </div>
      </div>
      <div class="card panel">
        <div class="h2">What this build is supposed to prove</div>
        <div class="objective" style="margin-top:14px;">
          <strong>No more shell work.</strong><br/>
          • The board stays on-screen through the whole training mission.<br/>
          • Every player view controls one operator only.<br/>
          • Teammates only appear if they are actually close enough to see.<br/>
          • The DM gets full board knowledge.<br/>
          • Movement is node-to-node, not fake room tabs.
        </div>
        <div class="objective" style="margin-top:14px;">
          <strong>Training route:</strong><br/>
          Dock Collar → Entry Lock → Sensor Spine → Crosswind Gap → Signal Core Room → Extraction Run → Outer Service Arm
        </div>
        <div class="objective" style="margin-top:14px;">
          <strong>Mission lesson:</strong><br/>
          Winning the room is not the mission. The mission is getting through the place alive.
        </div>
      </div>
    </div>
  `;
}

function bindSetup(){
  document.getElementById("squad-size").addEventListener("change", (e)=>{
    state.squadSize = parseInt(e.target.value, 10);
    render();
  });
  document.querySelectorAll("select[data-op]").forEach(el=>{
    el.addEventListener("change", (e)=>{
      const idx = parseInt(e.target.dataset.op,10);
      const field = e.target.dataset.field;
      state.setupOperators[idx][field] = e.target.value;
    });
  });
  document.getElementById("recommended-squad").addEventListener("click", ()=>{
    const roles = ["Vanguard","Signal Hacker","Marksman","Engineer / Tech","Vanguard","Marksman"];
    const fams = ["Metallic","Gem","Chromatic","Metallic","Chromatic","Gem"];
    state.setupOperators.forEach((op, i)=>{ op.role = roles[i]; op.family = fams[i]; });
    render();
  });
  document.getElementById("launch-training").addEventListener("click", startMission);
}

function renderMission(){
  const room = currentRoom();
  const isDm = state.clientView === "dm";
  const activePlayer = getPlayer(state.activePlayerId);
  const viewingPlayer = isDm ? null : getPlayer(state.clientView);
  const visibleNodes = isDm ? new Set(room.nodes.map(n=>n.id)) : visibleNodeIdsFor(viewingPlayer, room);
  const visibleTeammates = isDm ? state.players.filter(p=>p.roomKey===room.key && p.id!==viewingPlayer?.id) : visibleTeammatesFor(viewingPlayer, room);
  const hiddenTeammates = isDm ? 0 : teammatesHiddenCountFor(viewingPlayer, room);

  return `
    <div class="card topbar">
      <div>
        <div class="title">Dead-Zone Ops // ${room.title}</div>
        <div class="subtitle">${room.lesson}</div>
      </div>
      <div class="badges">
        <div class="badge"><div class="k">Active Turn</div><div class="v">${activePlayer.callsign}</div></div>
        <div class="badge"><div class="k">Seal Clock</div><div class="v">${state.sealClock}</div></div>
        <div class="badge"><div class="k">Pressure</div><div class="v">${state.pressure}</div></div>
        <div class="badge"><div class="k">Round</div><div class="v">${state.round}</div></div>
      </div>
    </div>

    <div class="card panel" style="margin-top:16px;">
      <div class="client-strip">
        <button class="client-btn dm ${state.clientView==='dm'?'active':''}" data-client="dm">DM Client</button>
        ${state.players.map(p=>`<button class="client-btn ${state.clientView===p.id?'active':''}" data-client="${p.id}">${p.callsign}</button>`).join("")}
      </div>
      <div class="muted" style="margin-top:10px;font-size:13px;">
        ${isDm
          ? "DM sees the full board, all operators, and the whole room state."
          : `${viewingPlayer.callsign} sees only their own controllable operator. Teammates appear only if line of sight is short enough.`}
      </div>
      <div class="mission-mini" style="margin-top:14px;">
        ${ROOM_SEQUENCE.map((r, i)=>`
          <div class="room-chip ${i===state.roomIndex?'active':''} ${i<state.roomIndex?'done':''}">
            <div class="n">Room ${i+1}</div>
            <div class="t">${r.title}</div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="screen">
      <div class="card panel sidebar">
        ${isDm ? renderDmSidebar(room) : renderPlayerSidebar(viewingPlayer, room, visibleTeammates, hiddenTeammates)}
      </div>

      <div class="card board-wrap">
        <div class="board-header">
          <div>
            <div class="board-title">${room.title}</div>
            <div class="board-sub">${room.objectiveText}</div>
          </div>
          <div class="legend">
            <span class="cover">Cover</span>
            <span class="exposed">Exposed</span>
            <span class="hazard">Hazard</span>
          </div>
        </div>
        ${renderBoard(room, isDm, viewingPlayer, visibleNodes)}
      </div>

      <div class="card panel actions">
        ${isDm ? renderDmActions(room) : renderPlayerActions(viewingPlayer, room)}
      </div>
    </div>
  `;
}

function renderDmSidebar(room){
  return `
    <h3>DM Client</h3>
    <div class="dm-board-hint">Full board, all players, hidden room logic. This side is allowed to know everything.</div>
    <div class="info-list" style="margin-top:12px;">
      <div class="stat"><div class="k">Objective</div><div class="v">${state.roomStates[room.key].objectiveComplete ? "Complete" : "Open"}</div></div>
      <div class="stat"><div class="k">Stability</div><div class="v">${state.stability}</div></div>
      <div class="stat"><div class="k">Exposure</div><div class="v">${state.exposure}</div></div>
      <div class="stat"><div class="k">Core Secured</div><div class="v">${state.objectiveSecured ? "Yes" : "No"}</div></div>
    </div>
    <h3 style="margin-top:16px;">Operators</h3>
    ${state.players.map(p=>`
      <div class="teammate">
        <strong style="color:${p.color}">${p.callsign}</strong>
        <small>${p.role} • ${p.family}</small>
        <small>Node: ${p.nodeId}</small>
        <small>O₂ ${p.oxygen} • Power ${p.power} • Stress ${p.stress}</small>
      </div>
    `).join("")}
  `;
}

function renderPlayerSidebar(player, room, visibleTeammates, hiddenTeammates){
  return `
    <h3>${player.callsign}</h3>
    <div class="turn-banner ${isActivePlayer(player.id) ? "" : "waiting"}">
      <div>${isActivePlayer(player.id) ? "Your turn" : "Waiting for your turn"}</div>
      <div>${state.turn.secondsLeft}s</div>
    </div>
    <div class="info-list" style="margin-top:12px;">
      <div class="stat"><div class="k">Role</div><div class="v">${player.role}</div></div>
      <div class="stat"><div class="k">Family</div><div class="v">${player.family}</div></div>
      <div class="stat"><div class="k">Oxygen</div><div class="v">${player.oxygen}</div></div>
      <div class="stat"><div class="k">Power</div><div class="v">${player.power}</div></div>
      <div class="stat"><div class="k">Stress</div><div class="v">${player.stress}</div></div>
      <div class="stat"><div class="k">Position</div><div class="v">${nodeMap(room)[player.nodeId].name}</div></div>
    </div>

    <h3 style="margin-top:16px;">Visible teammates</h3>
    ${visibleTeammates.length ? visibleTeammates.map(p=>`
      <div class="teammate">
        <strong style="color:${p.color}">${p.callsign}</strong>
        <small>${p.role}</small>
        <small>${nodeMap(room)[p.nodeId].name}</small>
        <small>Visible, not controllable</small>
      </div>
    `).join("") : `<div class="big-empty">No teammates currently in line of sight.</div>`}
    ${hiddenTeammates ? `<div class="muted" style="margin-top:8px;font-size:12px;">${hiddenTeammates} teammate(s) are out of sight.</div>` : ""}
  `;
}

function renderBoard(room, isDm, viewingPlayer, visibleNodes){
  const roomAdj = adjacency(room);
  const roomNodes = nodeMap(room);
  const activeId = state.activePlayerId;
  const currentMover = getPlayer(activeId);
  const reachable = (!isDm && viewingPlayer && isActivePlayer(viewingPlayer.id) && !state.turn.moveUsed && viewingPlayer.roomKey===room.key)
    ? new Set(roomAdj[viewingPlayer.nodeId] || [])
    : new Set();

  const edgeSvg = room.edges.map(([a,b])=>{
    const na = roomNodes[a], nb = roomNodes[b];
    const hidden = !isDm && (!visibleNodes.has(a) || !visibleNodes.has(b));
    return `<line class="edge ${hidden?'hidden':''}" x1="${na.x}%" y1="${na.y}%" x2="${nb.x}%" y2="${nb.y}%"></line>`;
  }).join("");

  const nodeHtml = room.nodes.map(node=>{
    const hidden = !isDm && !visibleNodes.has(node.id);
    const classes = ["node"];
    if(node.tags.includes("cover")) classes.push("cover");
    if(node.tags.includes("exposed")) classes.push("exposed");
    if(node.tags.includes("hazard")) classes.push("hazard");
    if(node.tags.includes("interactive")) classes.push("interactive");
    if(reachable.has(node.id)) classes.push("reachable");
    if(hidden) classes.push("hidden");

    const tokens = state.players.filter(p=>p.roomKey===room.key && p.nodeId===node.id).map(p=>{
      if(isDm){
        return `<span class="token" style="border-color:${p.color}; color:${p.color};">${p.callsign}</span>`;
      }
      if(p.id===viewingPlayer.id){
        return `<span class="token self" style="border-color:${p.color}; color:${p.color};">${p.callsign}</span>`;
      }
      const vis = visibleTeammatesFor(viewingPlayer, room).some(t=>t.id===p.id);
      if(vis){
        return `<span class="token visible" style="border-color:${p.color}; color:${p.color};">${p.callsign}</span>`;
      }
      return "";
    }).join("");

    return `
      <div class="${classes.join(" ")}" data-node="${node.id}" style="left:${node.x}%; top:${node.y}%;">
        <div class="node-type">${node.type}</div>
        <div class="node-name">${node.name}</div>
        <div class="node-desc">${node.desc}</div>
        <div class="tokens">${tokens}</div>
      </div>
    `;
  }).join("");

  return `
    <div class="board-shell">
      <div class="board-grid"></div>
      <svg class="edges" viewBox="0 0 100 100" preserveAspectRatio="none">${edgeSvg}</svg>
      ${nodeHtml}
    </div>
  `;
}

function renderDmActions(room){
  return `
    <h3>DM Actions</h3>
    <div class="objective">This build is focused on player-side movement and strict visibility separation. DM view is omniscient inspection, not the player control surface.</div>
    <div class="footer-actions" style="margin-top:14px;">
      <button class="secondary" id="dm-site-reaction">Force site reaction</button>
    </div>
    <h3 style="margin-top:16px;">Event log</h3>
    <div class="log">${state.log.slice(0, 12).map(item=>`<div class="log-item">${item}</div>`).join("")}</div>
  `;
}

function renderPlayerActions(player, room){
  const actions = roomActionCards(player, room);
  const active = isActivePlayer(player.id);
  const node = nodeMap(room)[player.nodeId];
  return `
    <h3>Your actions</h3>
    <div class="objective">
      <strong>Current node:</strong> ${node.name}<br/>
      <strong>Objective:</strong> ${room.objectiveText}<br/>
      <strong>Control rule:</strong> You can move and act only for ${player.callsign}. Visible teammates are information, not controls.
    </div>
    <div class="turn-banner ${active ? "" : "waiting"}" style="margin-top:12px;">
      <div>${active ? "You may move to an adjacent node or act from your current position." : "Another player is active."}</div>
      <div>${state.turn.secondsLeft}s</div>
    </div>
    <div class="actions-list" style="margin-top:12px;">
      ${actions.length ? actions.map(action=>`
        <div class="action-card">
          <div class="a-title">${action.title}</div>
          <div class="a-desc">${action.desc}</div>
          <div class="a-meta">${action.type.toUpperCase()} • ${action.enabled ? "available" : "locked"}</div>
          <div style="margin-top:10px;">
            <button class="${action.type==='advance' ? 'primary' : 'secondary'}" data-action="${action.id}" ${(!action.enabled || !active) ? "disabled" : ""}>Use action</button>
          </div>
        </div>
      `).join("") : `<div class="big-empty">No special action from this position. Move somewhere useful.</div>`}
    </div>
    <div class="footer-actions" style="margin-top:12px;">
      <button class="secondary" id="end-turn-btn" ${active ? "" : "disabled"}>End turn</button>
    </div>
    <h3 style="margin-top:16px;">Visible log</h3>
    <div class="log">${state.log.slice(0, 8).map(item=>`<div class="log-item">${item}</div>`).join("")}</div>
  `;
}

function bindMission(){
  document.querySelectorAll("[data-client]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      state.clientView = btn.dataset.client;
      render();
    });
  });

  const isDm = state.clientView === "dm";
  const player = isDm ? null : getPlayer(state.clientView);
  const room = currentRoom();

  if(isDm){
    document.getElementById("dm-site-reaction")?.addEventListener("click", ()=>{
      siteReaction();
      render();
    });
  } else if(player){
    const adj = adjacency(room)[player.nodeId] || [];
    document.querySelectorAll(".node.reachable").forEach(el=>{
      el.addEventListener("click", ()=>{
        movePlayerTo(player.id, el.dataset.node);
      });
    });
    roomActionCards(player, room).forEach(action=>{
      const btn = document.querySelector(`[data-action="${action.id}"]`);
      if(btn){
        btn.addEventListener("click", ()=> action.onRun());
      }
    });
    document.getElementById("end-turn-btn")?.addEventListener("click", ()=> endTurn("ended the turn"));
  }
}

function renderDebrief(){
  return `
    <div class="card topbar">
      <div>
        <div class="title">Training Debrief</div>
        <div class="subtitle">You went through a real sequence of rooms on a board, not just tabs. The lesson still matters: the room is not the mission. The way out is.</div>
      </div>
      <div class="badges">
        <div class="badge"><div class="k">Rounds</div><div class="v">${state.round}</div></div>
        <div class="badge"><div class="k">Seal Clock</div><div class="v">${state.sealClock}</div></div>
        <div class="badge"><div class="k">Pressure</div><div class="v">${state.pressure}</div></div>
        <div class="badge"><div class="k">Operators</div><div class="v">${state.players.length}</div></div>
      </div>
    </div>
    <div class="row" style="margin-top:16px;align-items:stretch;">
      <div class="card panel" style="flex:1;">
        <div class="h2">What the training was proving</div>
        <div class="objective" style="margin-top:14px;">${state.debrief}</div>
        <div class="objective" style="margin-top:14px;">
          <strong>Architecture locked:</strong><br/>
          • up to 6 separate player clients<br/>
          • 1 DM client<br/>
          • player controls one operator only<br/>
          • teammates visible only by line of sight<br/>
          • board-based room movement through the whole mission
        </div>
        <div class="footer-actions" style="margin-top:16px;">
          <button class="primary" id="restart-training">Run training again</button>
        </div>
      </div>
      <div class="card panel" style="width:360px;">
        <h3>Event log</h3>
        <div class="log">${state.log.slice(0, 16).map(item=>`<div class="log-item">${item}</div>`).join("")}</div>
      </div>
    </div>
  `;
}

function bindDebrief(){
  document.getElementById("restart-training").addEventListener("click", ()=>{
    state.screen = "setup";
    render();
  });
}

render();
