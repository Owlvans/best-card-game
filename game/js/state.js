// state.js — game state and rules: play, attack, damage, turns
function createHero(name) { return { name, life: 20, maxLife: 20 }; }
function createPlayerState(name, seed) {
  return { hero: createHero(name), deck: buildDeck(seed), hand: [], board: [], energy: 1, maxEnergy: 1, turnCount: 0 };
}
function createGameState(seed) {
  const state = {
    player: createPlayerState("You", seed || 12345),
    enemy: createPlayerState("Lady Vex", (seed || 12345) + 777),
    active: "player", turn: 1, winner: null, log: "The duel begins.", selectedAttacker: null, pendingSpell: null,
  };
  drawCards(state.player, 5); drawCards(state.enemy, 5);
  return state;
}
function drawCards(side, count) { for (let i = 0; i < count; i++) { if (side.deck.length && side.hand.length < 10) side.hand.push(side.deck.pop()); } }
function startTurn(state, who) {
  const side = state[who]; state.active = who; side.turnCount++;
  side.maxEnergy = Math.min(10, side.maxEnergy + (side.turnCount > 1 ? 1 : 0));
  if (side.turnCount === 1) side.maxEnergy = who === "player" && state.turn === 1 ? side.maxEnergy : side.maxEnergy;
  side.energy = side.maxEnergy;
  side.board.forEach((c) => { c.ready = true; });
  drawCards(side, side.turnCount === 1 && state.turn === 1 && who === "player" ? 0 : 1);
}
function canPlayCard(side, card) { return side.energy >= card.cost; }
function playCard(state, who, handIndex) {
  const side = state[who]; const card = side.hand[handIndex];
  if (!card || !canPlayCard(side, card)) return false;
  side.energy -= card.cost; side.hand.splice(handIndex, 1);
  if (card.type === "creature") {
    card.summonedTurn = state.turn; card.ready = card.keywords.includes("rush"); card.currentHealth = card.health;
    side.board.push(card); state.log = side.hero.name + " played " + card.name + ".";
  } else { applySpell(state, who, card); }
  checkWinner(state); return true;
}
function applySpell(state, who, card) {
  const side = state[who]; const foeKey = who === "player" ? "enemy" : "player"; const foe = state[foeKey];
  const eff = card.effect || {};
  if (eff.kind === "heal") { side.hero.life = Math.min(side.hero.maxLife, side.hero.life + eff.amount); state.log = side.hero.name + " healed " + eff.amount + "."; }
  else if (eff.kind === "draw") { drawCards(side, eff.amount); state.log = side.hero.name + " drew " + eff.amount + " cards."; }
  else if (eff.kind === "damage") {
    if (state.pendingTarget) { dealDamageToTarget(state, who, state.pendingTarget, eff.amount); state.pendingTarget = null; }
    else { foe.hero.life -= eff.amount; state.log = card.name + " hit the enemy hero for " + eff.amount + "."; }
  }
}
function dealDamageToTarget(state, attackerWho, target, amount) {
  if (target === "enemyHero") state.enemy.hero.life -= amount;
  else if (target === "playerHero") state.player.hero.life -= amount;
  else {
    const board = state.enemy.board.concat(state.player.board);
    const c = board.find((x) => x.uid === target);
    if (c) { c.currentHealth -= amount; removeDeadCreatures(state); }
  }
}
function removeDeadCreatures(state) {
  state.player.board = state.player.board.filter((c) => c.currentHealth > 0);
  state.enemy.board = state.enemy.board.filter((c) => c.currentHealth > 0);
}
function hasGuard(board) { return board.some((c) => c.keywords.includes("guard")); }
function canAttackTarget(state, attackerWho, targetUid) {
  const foeBoard = attackerWho === "player" ? state.enemy.board : state.player.board;
  if (targetUid === "hero") return !hasGuard(foeBoard);
  const t = foeBoard.find((c) => c.uid === targetUid);
  if (!t) return false;
  return !hasGuard(foeBoard) || t.keywords.includes("guard");
}
function attackTarget(state, attackerWho, attackerUid, targetUid) {
  const side = attackerWho === "player" ? state.player : state.enemy;
  const foeKey = attackerWho === "player" ? "enemy" : "player"; const foe = state[foeKey];
  const attacker = side.board.find((c) => c.uid === attackerUid);
  if (!attacker || !attacker.ready || !canAttackTarget(state, attackerWho, targetUid)) return false;
  attacker.ready = false;
  if (targetUid === "hero") { foe.hero.life -= attacker.attack; state.log = attacker.name + " hit the hero for " + attacker.attack + "."; }
  else {
    const defender = foe.board.find((c) => c.uid === targetUid);
    if (!defender) return false;
    defender.currentHealth -= attacker.attack; attacker.currentHealth -= defender.attack;
    state.log = attacker.name + " traded with " + defender.name + "."; removeDeadCreatures(state);
  }
  checkWinner(state); return true;
}
function checkWinner(state) {
  if (state.enemy.hero.life <= 0) state.winner = "player";
  else if (state.player.hero.life <= 0) state.winner = "enemy";
}
function endTurn(state) {
  state.selectedAttacker = null;
  if (state.active === "player") { state.turn++; startTurn(state, "enemy"); }
  else startTurn(state, "player");
}
function seedDemoState() {
  const s = createGameState(42);
  s.player.hero.life = 14; s.enemy.hero.life = 11;
  s.player.maxEnergy = 6; s.player.energy = 3; s.enemy.maxEnergy = 6; s.enemy.energy = 2;
  s.turn = 6;
  const mk = (idx, hp) => { const c = instantiateCard(CARD_POOL[idx]); c.currentHealth = hp || c.health; c.ready = true; return c; };
  s.player.board = [mk(1), mk(6), mk(10)];
  s.enemy.board = [mk(5), mk(3, 2)];
  s.player.hand = [instantiateCard(CARD_POOL[12]), instantiateCard(CARD_POOL[8]), instantiateCard(CARD_POOL[15]), instantiateCard(CARD_POOL[2])];
  s.enemy.hand = [instantiateCard(CARD_POOL[0]), instantiateCard(CARD_POOL[0]), instantiateCard(CARD_POOL[0])];
  s.log = "Your Flame Rider is ready. Lady Vex guards the vale.";
  return s;
}
