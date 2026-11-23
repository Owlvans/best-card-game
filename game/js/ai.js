// ai.js — opponent policy: readable, trades into Guard, goes face when lethal
function aiTakeTurn(state) {
  if (state.winner) return;
  aiPlayCards(state);
  aiAttackWithBoard(state);
  if (!state.winner) endTurn(state);
}
function aiPlayCards(state) {
  let played = true;
  while (played && !state.winner) {
    played = false;
    const sorted = state.enemy.hand.map((c, i) => ({ c, i })).sort((a, b) => b.c.cost - a.c.cost);
    for (const entry of sorted) {
      const card = entry.c;
      if (card.cost > state.enemy.energy) continue;
      if (card.type === "spell") { if (!aiShouldCastSpell(state, card)) continue; aiCastSpell(state, card); }
      else playCard(state, "enemy", state.enemy.hand.indexOf(card));
      played = true; break;
    }
  }
}
function aiShouldCastSpell(state, card) {
  const eff = card.effect || {};
  if (eff.kind === "heal") return state.enemy.hero.life <= 12;
  if (eff.kind === "draw") return state.enemy.hand.length <= 4;
  if (eff.kind === "damage") return true;
  return true;
}
function aiCastSpell(state, card) {
  const eff = card.effect || {};
  if (eff.kind === "damage") {
    const threats = state.player.board.slice().sort((a, b) => b.attack - a.attack);
    const lethal = state.player.hero.life <= eff.amount || threats.length === 0;
    state.pendingTarget = lethal ? "playerHero" : (threats[0] ? threats[0].uid : "playerHero");
    if (state.pendingTarget === "playerHero") state.pendingTarget = "playerHero";
    // deal directly for hero, via pending for creature
    const idx = state.enemy.hand.indexOf(card);
    state.enemy.energy -= card.cost; state.enemy.hand.splice(idx, 1);
    if (state.pendingTarget === "playerHero") { state.player.hero.life -= eff.amount; state.log = "Lady Vex cast " + card.name + " on your hero."; }
    else { dealDamageToTarget(state, "enemy", state.pendingTarget, eff.amount); state.log = "Lady Vex cast " + card.name + "."; }
    state.pendingTarget = null; checkWinner(state);
  } else playCard(state, "enemy", state.enemy.hand.indexOf(card));
}
function aiAttackWithBoard(state) {
  const attackers = state.enemy.board.filter((c) => c.ready && c.attack > 0);
  for (const attacker of attackers) {
    if (state.winner) break;
    const guards = state.player.board.filter((c) => c.keywords.includes("guard"));
    if (guards.length) attackTarget(state, "enemy", attacker.uid, guards[0].uid);
    else if (state.player.hero.life <= attacker.attack) attackTarget(state, "enemy", attacker.uid, "hero");
    else {
      const weak = state.player.board.filter((c) => c.currentHealth <= attacker.attack && c.attack >= 3);
      if (weak.length) attackTarget(state, "enemy", attacker.uid, weak[0].uid);
      else attackTarget(state, "enemy", attacker.uid, "hero");
    }
  }
}
