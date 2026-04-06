const ROOM_ORDER = ["dock", "entry", "spine", "pocket", "gap", "core", "extract", "fatal"];
const ROOM_META = {
  dock: { title: "Dock Collar", short: "Final clean briefing before the seal breaks.", lesson: "This is the last safe room. Once the seal breaks, the level starts pushing back.", type: "briefing" },
  entry: { title: "Entry Lock", short: "Clock starts. Movement order matters.", lesson: "The mission has begun. Small decisions now affect how ugly the level becomes.", type: "movement" },
  spine: { title: "Sensor Spine", short: "Timing, sightlines, signal pressure.", lesson: "Do not overprepare. The room tightens every round you hesitate.", type: "route" },
  pocket: { title: "Maintenance Pocket", short: "Safer, slower, narrower route.", lesson: "Safer routes still cost time. Time is also a resource.", type: "side-route" },
  gap: { title: "Crosswind Gap", short: "Vacuum traversal and tether discipline.", lesson: "Wings are control surfaces here, not free flight. Tethers stop stupid deaths.", type: "traversal" },
  core: { title: "Signal Core Room", short: "Contained tactical pressure room.", lesson: "Combat solves part of the mission, not the whole mission.", type: "combat" },
  extract: { title: "Extraction Run", short: "The route out is worse than the route in.", lesson: "Winning the room means nothing if you lose the way out.", type: "escape" },
  fatal: { title: "Outer Service Arm", short: "Final bad-decision lesson.", lesson: "A squad can survive the room and still die in vacuum by getting arrogant on extraction.", type: "fatal" },
};
const STARTING_PLAYERS = [
  { id: "p1", callsign: "Operator 1", role: "Vanguard", family: "Metallic", suit: "Breach", weapon: "Coil Carbine", room: "dock", lane: "front", hp: 18, oxygen: 100, power: 4, heat: 0, stress: 0, tethered: false, braced: false },
  { id: "p2", callsign: "Operator 2", role: "Signal Hacker", family: "Gem", suit: "Relay", weapon: "Laser Intercept", room: "dock", lane: "cover", hp: 12, oxygen: 100, power: 5, heat: 0, stress: 0, tethered: false, braced: false },
  { id: "p3", callsign: "Operator 3", role: "Marksman", family: "Chromatic", suit: "Vector", weapon: "Coil Marksman", room: "dock", lane: "back", hp: 13, oxygen: 100, power: 4, heat: 0, stress: 0, tethered: false, braced: false },
  { id: "p4", callsign: "Operator 4", role: "Engineer / Tech", family: "Metallic", suit: "Containment", weapon: "Slug Utility", room: "dock", lane: "cover", hp: 14, oxygen: 100, power: 5, heat: 0, stress: 0, tethered: false, braced: false },
];
const state = {
  players: structuredClone(STARTING_PLAYERS),
  currentRoom: "dock",
  selectedClient: "dm",
  sealClock: 7,
  progress: 0,
  pressure: 0,
  turnOrder: STARTING_PLAYERS.map(p => p.id),
  turnIndex: 0,
  turnTimeLeft: 12,
  log: [
    "Training run loaded.",
    "This slice proves the correct architecture: separate player screens, a DM view, and a mapped tutorial level."
  ]
};
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
function nextRoom(room){ const idx = ROOM_ORDER.indexOf(room); return ROOM_ORDER[Math.min(idx+1, ROOM_ORDER.length-1)]; }
function laneClass(lane){ return lane === "front" ? "pill-red" : lane === "cover" ? "pill-amber" : "pill-cyan"; }
function actionsFor(room){
  const type = ROOM_META[room].type;
  if(type === "briefing") return [{ id:"break", label:"Break Seal", why:"This starts the mission clock. You do it when the team is ready enough, not perfect.", apply:()=>({advanceRoom:true, sealDelta:-1, progressDelta:1, log:"The seal breaks. The room starts thinking about you now."}) }];
  if(type === "movement") return [
    { id:"advance", label:"Advance Carefully", why:"Good default when the room is still readable.", apply:()=>({advanceRoom:true, sealDelta:-1, progressDelta:1, log:"The team moves into the station with discipline instead of panic."}) },
    { id:"read", label:"Read the Entry", why:"Use this when information is worth more than raw speed.", apply:(p)=>({power:clamp(p.power-1,0,6), sealDelta:-1, pressureDelta:-1, log:"The entry pattern gets a little clearer, but the clock still burns."}) },
  ];
  if(type === "route") return [
    { id:"time", label:"Time the Sweep", why:"Spending a little time now can stop the room from making the crossing ugly later.", apply:()=>({sealDelta:-1, pressureDelta:-1, log:"The squad reads the sweep rhythm instead of just charging it."}) },
    { id:"pocket", label:"Use Maintenance Pocket", why:"Safer route, slower route.", apply:()=>({setRoom:"pocket", sealDelta:-1, log:"The squad peels off into the side pocket to buy a little control."}) },
    { id:"push", label:"Push the Spine", why:"Fast line. Useful when the squad can handle a dirtier commit.", apply:()=>({advanceRoom:true, sealDelta:-1, pressureDelta:1, progressDelta:1, log:"The squad pushes the main line and accepts a rougher room state."}) },
  ];
  if(type === "side-route") return [{ id:"manual", label:"Manual Access Cut", why:"The slower disciplined workaround. You buy stability with time.", apply:()=>({advanceRoom:true, sealDelta:-1, progressDelta:1, log:"The manual cut works, but it costs real time."}) }];
  if(type === "traversal") return [
    { id:"tether", label:"Anchor Tether", why:"Forced movement kills careless squads faster than damage does.", apply:(p)=>({power:clamp(p.power-1,0,6), tethered:true, sealDelta:-1, log:`${p.callsign} clips in before committing to the vacuum crossing.`}) },
    { id:"brace", label:"Wing Brace", why:"Brace when the room is trying to spin, drag, or overcorrect you.", apply:(p)=>({power:clamp(p.power-1,0,6), braced:true, sealDelta:-1, log:`${p.callsign} braces wings for control, not speed.`}) },
    { id:"cross", label:"Cross the Gap", why:"Moving is the point. Setup is only worth what it buys you.", requirement:(p)=>p.tethered || p.braced, requirementText:"Crossing raw is reckless. Tether or brace first.", apply:(p)=>({advanceRoom:true, oxygen:clamp(p.oxygen-8,0,100), sealDelta:-1, progressDelta:1, log:`${p.callsign} commits to the gap crossing.`}) },
  ];
  if(type === "combat") return [
    { id:"attack", label:"Attack the Problem", why:"The goal is not total slaughter. Hit the thing making the room worse.", apply:(p)=>({heat:clamp(p.heat+1,0,10), sealDelta:-1, pressureDelta:-1, progressDelta:1, log:`${p.callsign} attacks the thing actually shaping the room.`}) },
    { id:"role", label:"Use Role Ability", why:"Role abilities are often more efficient than generic damage when the room is solving you with systems and timing.", apply:(p)=>({power:clamp(p.power-1,0,6), sealDelta:-1, pressureDelta:-1, progressDelta:1, log:`${p.callsign} uses their role to make the room less ugly.`}) },
    { id:"objective", label:"Secure Objective", why:"Combat is not the mission. The objective is the mission.", apply:()=>({advanceRoom:true, sealDelta:-1, progressDelta:2, log:"The signal core is secured. Now the only smart thing left is getting out."}) },
  ];
  if(type === "escape") return [
    { id:"disciplined", label:"Extract Disciplined", why:"This is the real win condition. Get out alive with the objective.", apply:(p)=>({advanceRoom:true, oxygen:clamp(p.oxygen-5,0,100), sealDelta:-1, progressDelta:1, log:`${p.callsign} keeps extraction discipline instead of showing off.`}) },
    { id:"rush", label:"Rush the Exit", why:"Tempting when the clock is ugly. Risky because speed makes mistakes likelier.", apply:(p)=>({advanceRoom:true, oxygen:clamp(p.oxygen-10,0,100), stress:p.stress+1, sealDelta:-1, pressureDelta:1, progressDelta:1, log:`${p.callsign} rushes the extraction line and makes the whole run shakier.`}) },
  ];
  return [{ id:"corner", label:"Cut the Corner", why:"This is the bad extraction instinct: the room feels solved, so discipline gets dropped first.", apply:()=>({pressureDelta:2, log:"The lesson lands: surviving the room is not the same thing as surviving the mission."}) }];
}
function pushLog(text){ state.log.unshift(text); }
function activeTurnId(){ return state.turnOrder[state.turnIndex] || STARTING_PLAYERS[0].id; }
function applyAction(playerId, action){
  if(playerId !== activeTurnId()) return;
  const idx = state.players.findIndex(p=>p.id===playerId);
  const actor = state.players[idx];
  const result = action.apply(actor);
  state.players[idx] = {
    ...actor,
    room: result.setRoom ? result.setRoom : result.advanceRoom ? nextRoom(actor.room) : actor.room,
    hp: result.hp ?? actor.hp,
    oxygen: result.oxygen ?? actor.oxygen,
    power: result.power ?? actor.power,
    heat: result.heat ?? actor.heat,
    stress: result.stress ?? actor.stress,
    tethered: result.tethered ?? actor.tethered,
    braced: result.braced ?? actor.braced,
  };
  if(result.advanceRoom) state.currentRoom = nextRoom(state.currentRoom);
  if(result.setRoom) state.currentRoom = result.setRoom;
  if(typeof result.sealDelta === 'number') state.sealClock = clamp(state.sealClock + result.sealDelta, 0, 10);
  if(typeof result.pressureDelta === 'number') state.pressure = clamp(state.pressure + result.pressureDelta, 0, 10);
  if(typeof result.progressDelta === 'number') state.progress = clamp(state.progress + result.progressDelta, 0, 10);
  pushLog(result.log || `${actor.callsign} commits ${action.label}.`);
  const nextTurn = (state.turnIndex + 1) % state.turnOrder.length;
  state.turnIndex = nextTurn;
  state.turnTimeLeft = 12;
  if(nextTurn === 0){
    state.sealClock = clamp(state.sealClock - 1, 0, 10);
    state.pressure = clamp(state.pressure + 1, 0, 10);
    pushLog("Site reaction: the room tightens while the squad commits and hesitates.");
  }
  render();
}
setInterval(()=>{
  state.turnTimeLeft = Math.max(0, state.turnTimeLeft - 1);
  if(state.turnTimeLeft === 0){
    const actor = state.players.find(p=>p.id===activeTurnId());
    pushLog(`${actor?.callsign || "An operator"} hesitates too long and loses the turn. The room keeps moving.`);
    state.sealClock = clamp(state.sealClock - 1, 0, 10);
    state.pressure = clamp(state.pressure + 1, 0, 10);
    state.turnIndex = (state.turnIndex + 1) % state.turnOrder.length;
    state.turnTimeLeft = 12;
  }
  render();
}, 1000);
function render(){
  const app = document.getElementById('app');
  const selectedPlayer = state.players.find(p=>p.id===state.selectedClient) || state.players[0];
  const room = ROOM_META[state.currentRoom];
  const active = state.players.find(p=>p.id===activeTurnId());
  app.innerHTML = `
  <div class="app">
    <div class="hero">
      <div class="row">
        <div>
          <div class="eyebrow">Dead-Zone Ops // Multiclient Foundation</div>
          <div class="title">Separate Player Screens + DM Control + Tutorial Map</div>
          <div class="copy">This is the real product direction: each player sees only their operator view, the DM sees the control layer, and local test mode can simulate the whole table on one machine.</div>
        </div>
        <div class="stack">
          <div class="pill btn-warning">Turn clock • ${state.turnTimeLeft}s</div>
          <div class="pill">Active Turn • ${active ? active.callsign : "—"}</div>
        </div>
      </div>
      <div class="stats">
        <div class="stat ${state.sealClock <= 2 ? 'danger' : ''}"><div class="stat-label">Seal Clock</div><div class="stat-value">${state.sealClock}</div></div>
        <div class="stat"><div class="stat-label">Progress</div><div class="stat-value">${state.progress}</div></div>
        <div class="stat ${state.pressure >= 3 ? 'danger' : ''}"><div class="stat-label">Pressure</div><div class="stat-value">${state.pressure}</div></div>
        <div class="stat"><div class="stat-label">Active Room</div><div class="stat-value">${room.title}</div></div>
      </div>
    </div>
    <div class="grid-main">
      <div class="stack">
        <div class="panel">
          <div class="head"><div class="label">Local Multi-Client Test Harness</div></div>
          <div class="buttonbar mode-tabs">
            <button class="btn ${state.selectedClient === 'dm' ? 'btn-warning' : 'btn-secondary'}" data-client="dm">DM View</button>
            ${state.players.map(p => `<button class="btn ${state.selectedClient === p.id ? 'btn-primary' : 'btn-secondary'}" data-client="${p.id}">${p.callsign}${activeTurnId() === p.id ? ' • active' : ''}</button>`).join('')}
          </div>
        </div>
        <div class="panel">
          <div class="head"><div class="label">Tutorial Level Layout</div></div>
          <div class="map-grid">
            ${ROOM_ORDER.map(roomId => {
              const meta = ROOM_META[roomId];
              const here = state.players.filter(p => p.room === roomId).map(p => `<div class="pill">${p.callsign}</div>`).join('');
              return `<div class="room ${state.currentRoom === roomId ? 'active' : ''}"><div class="label">${meta.type}</div><div class="room-title">${meta.title}</div><div class="small">${meta.short}</div><div class="tags">${here}</div></div>`;
            }).join('')}
          </div>
        </div>
        ${state.selectedClient === 'dm' ? renderDm(room, active) : renderPlayer(selectedPlayer, room, active)}
      </div>
      <div class="stack">
        <div class="panel">
          <div class="head"><div class="label">What this proves</div></div>
          <div class="map-grid">
            <div class="room"><div class="room-title">Per-player UI</div><div class="small">No shared squad dashboard as the real player experience.</div></div>
            <div class="room"><div class="room-title">Mapped level</div><div class="small">Rooms exist as spaces with tutorial grammar instead of floating action boxes.</div></div>
            <div class="room"><div class="room-title">Turn cycling</div><div class="small">Only one operator acts at a time. The room keeps moving if people hesitate.</div></div>
            <div class="room"><div class="room-title">Spoiler-safe guidance</div><div class="small">Players get challenge language, not hidden-enemy taxonomy.</div></div>
          </div>
        </div>
        <div class="panel">
          <div class="head"><div class="label">Event log</div></div>
          <div class="stack">${state.log.slice(0,8).map(entry => `<div class="log">${entry}</div>`).join('')}</div>
        </div>
      </div>
    </div>
    <a class="btn btn-ghost btn-secondary" href="../index.html">Back to Command Deck Build</a>
  </div>`;
  app.querySelectorAll('[data-client]').forEach(btn => btn.addEventListener('click', ()=>{ state.selectedClient = btn.getAttribute('data-client'); render(); }));
  app.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', ()=>{
    const actionId = btn.getAttribute('data-action');
    const actions = actionsFor(state.currentRoom);
    const action = actions.find(a => a.id === actionId);
    if(action) applyAction(selectedPlayer.id, action);
  }));
}
function renderPlayer(player, room, active){
  const actions = actionsFor(state.currentRoom);
  const isActive = active && active.id === player.id;
  return `<div class="panel">
    <div class="head"><div><div class="label">Player View</div><div class="room-title">${player.callsign}</div><div class="small ${player.role === 'Vanguard' ? 'pill-red' : player.role === 'Signal Hacker' ? 'pill-cyan' : player.role === 'Marksman' ? 'pill-cyan' : 'pill-good'}" style="display:inline-block;padding:0;border:none;background:none">${player.role} • ${player.family}</div></div><div class="pill ${isActive ? 'pill-good' : ''}">${isActive ? `Your turn • ${state.turnTimeLeft}s` : 'Waiting'}</div></div>
    <div class="stats">
      <div class="stat"><div class="stat-label">Room</div><div class="stat-value">${room.title}</div></div>
      <div class="stat ${player.hp <= 6 ? 'danger' : ''}"><div class="stat-label">HP</div><div class="stat-value">${player.hp}</div></div>
      <div class="stat ${player.oxygen <= 40 ? 'danger' : ''}"><div class="stat-label">Oxygen</div><div class="stat-value">${player.oxygen}</div></div>
      <div class="stat ${player.power <= 1 ? 'danger' : ''}"><div class="stat-label">Power</div><div class="stat-value">${player.power}</div></div>
    </div>
    <div class="panel"><div class="label">What this room is teaching</div><div class="copy">${room.lesson}</div></div>
    <div class="panel"><div class="label">Your kit</div><div class="copy">${player.suit} suit • ${player.weapon}</div><div class="tags"><div class="pill ${laneClass(player.lane)}">${player.lane}</div>${player.tethered ? '<div class="pill pill-good">Tethered</div>' : ''}${player.braced ? '<div class="pill pill-cyan">Braced</div>' : ''}</div></div>
    <div class="stack"><div class="label">Your actions</div>${actions.map(action => {
      const allowed = action.requirement ? action.requirement(player) : true;
      return `<div class="action"><div class="inline"><div><div class="action-title">${action.label}</div><div class="small">${action.why}</div>${!allowed ? `<div class="warn">${action.requirementText}</div>` : ''}</div><button class="btn ${isActive && allowed ? 'btn-primary' : 'btn-secondary'}" data-action="${action.id}" ${!isActive || !allowed ? 'disabled' : ''}>Commit</button></div></div>`;
    }).join('')}</div>
  </div>`;
}
function renderDm(room, active){
  return `<div class="panel">
    <div class="head"><div><div class="label">DM View</div><div class="room-title">${room.title}</div><div class="small">${room.short}</div></div><div class="pill btn-warning">Active Turn: ${active ? active.callsign : '—'} • ${state.turnTimeLeft}s</div></div>
    <div class="stats">
      <div class="stat ${state.sealClock <= 2 ? 'danger' : ''}"><div class="stat-label">Seal Clock</div><div class="stat-value">${state.sealClock}</div></div>
      <div class="stat"><div class="stat-label">Progress</div><div class="stat-value">${state.progress}</div></div>
      <div class="stat ${state.pressure >= 3 ? 'danger' : ''}"><div class="stat-label">Pressure</div><div class="stat-value">${state.pressure}</div></div>
      <div class="stat"><div class="stat-label">Room Type</div><div class="stat-value">${room.type}</div></div>
    </div>
    <div class="two-col">
      <div class="panel"><div class="label">Operator telemetry</div><div class="stack">${state.players.map(player => `<div class="telemetry-card"><div class="head"><div><div class="name">${player.callsign}</div><div class="small">${player.role} • ${player.room}</div></div><div class="pill ${laneClass(player.lane)}">${player.lane}</div></div><div class="telemetry"><div class="pill">HP ${player.hp}</div><div class="pill">O₂ ${player.oxygen}</div><div class="pill">PWR ${player.power}</div><div class="pill">Heat ${player.heat}</div></div></div>`).join('')}</div></div>
      <div class="panel"><div class="label">Room doctrine</div><div class="copy">${room.lesson}</div><div class="telemetry" style="margin-top:14px"><div class="pill">Turns cycle</div><div class="pill">Site reacts each round</div><div class="pill">Players see only their operator</div></div></div>
    </div>
  </div>`;
}
render();
