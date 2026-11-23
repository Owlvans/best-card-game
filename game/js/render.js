// render.js — DOM rendering of table, hand, and screens
function houseSymbol(house) { return HOUSES[house] ? HOUSES[house].symbol : "?"; }
function renderCardElement(card, options) {
  const el = document.createElement("div");
  el.className = "card " + card.house + (card.keywords && card.keywords.includes("guard") ? " guard" : "");
  if (options && options.exhausted) el.className += " exhausted";
  if (options && options.selected) el.className += " selected";
  const stats = card.type === "creature" ? `<div class="stats">⚔ ${card.attack} &nbsp; ♥ ${card.currentHealth !== undefined ? card.currentHealth : card.health}</div>` : `<div class="stats">✦ Spell</div>`;
  el.innerHTML = `<span class="cost">${card.cost}</span><div class="house">${houseSymbol(card.house)} ${HOUSES[card.house].name}</div><div class="name">${card.name}</div><div class="text">${card.text || ""}</div>${stats}`;
  if (options && options.onClick) el.addEventListener("click", options.onClick);
  return el;
}
function renderBackCard() { const el = document.createElement("div"); el.className = "card back"; el.innerHTML = "EMBERFALL<br>✦"; return el; }
function renderGame(state, handlers) {
  document.getElementById("enemy-life").textContent = "♥ " + Math.max(0, state.enemy.hero.life);
  document.getElementById("player-life").textContent = "♥ " + Math.max(0, state.player.hero.life);
  document.getElementById("enemy-energy").textContent = "◆ " + state.enemy.energy + " / " + state.enemy.maxEnergy;
  document.getElementById("player-energy").textContent = "◆ " + state.player.energy + " / " + state.player.maxEnergy;
  document.getElementById("turn-label").textContent = state.active === "player" ? "Your Turn — Turn " + state.turn : "Opponent's Turn";
  document.getElementById("log").textContent = state.log;
  const eh = document.getElementById("enemy-hand"); eh.innerHTML = "";
  state.enemy.hand.forEach(() => eh.appendChild(renderBackCard()));
  const eb = document.getElementById("enemy-board"); eb.innerHTML = "";
  if (!state.enemy.board.length) eb.innerHTML = '<p style="color:#8a775a">Enemy board is empty</p>';
  state.enemy.board.forEach((c) => eb.appendChild(renderCardElement(c, { onClick: () => handlers.onEnemyCreature(c), exhausted: !c.ready })));
  const pb = document.getElementById("player-board"); pb.innerHTML = "";
  if (!state.player.board.length) pb.innerHTML = '<p style="color:#8a775a">Your board is empty — play a creature</p>';
  state.player.board.forEach((c) => pb.appendChild(renderCardElement(c, { onClick: () => handlers.onPlayerCreature(c), selected: state.selectedAttacker === c.uid, exhausted: !c.ready })));
  const ph = document.getElementById("player-hand"); ph.innerHTML = "";
  state.player.hand.forEach((c, i) => {
    const el = renderCardElement(c, { onClick: () => handlers.onHandCard(i) });
    el.title = "Press " + (i + 1) + " to play";
    ph.appendChild(el);
  });
  document.getElementById("enemy-hero").onclick = () => handlers.onEnemyHero();
  document.getElementById("player-hero").onclick = () => {};
}
function showScreen(name) {
  ["title", "game", "win", "loss"].forEach((n) => {
    const el = document.getElementById("screen-" + n);
    if (el) el.classList.toggle("hidden", n !== name);
  });
}
