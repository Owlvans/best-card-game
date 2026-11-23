// main.js — boot, input handling, and screen switching
let gameState = null;
function refresh() {
  if (!gameState) return;
  renderGame(gameState, gameHandlers);
  if (gameState.winner === "player") { document.getElementById("win-stats").textContent = "Won on turn " + gameState.turn + " — your hero at " + Math.max(0, gameState.player.hero.life) + " life."; showScreen("win"); }
  else if (gameState.winner === "enemy") { document.getElementById("loss-stats").textContent = "Fell on turn " + gameState.turn + " — enemy hero at " + Math.max(0, gameState.enemy.hero.life) + " life."; showScreen("loss"); }
}
const gameHandlers = {
  onHandCard(index) {
    if (!gameState || gameState.active !== "player" || gameState.winner) return;
    const card = gameState.player.hand[index];
    if (card && card.type === "spell" && card.effect && card.effect.kind === "damage") {
      // simple rule: spells hit the enemy hero unless a big threat exists, then that creature
      const threats = gameState.enemy.board.slice().sort((a, b) => b.attack - a.attack);
      if (threats.length && threats[0].attack >= 3) gameState.pendingTarget = threats[0].uid;
      else gameState.pendingTarget = "enemyHero";
      // applySpell expects pendingTarget handling; hero case handled there as foe damage fallback is overridden below
      const played = playCard(gameState, "player", index);
      if (played && gameState.pendingTarget === "enemyHero") { /* damage already applied to hero by applySpell fallback */ }
      gameState.pendingTarget = null;
    } else playCard(gameState, "player", index);
    refresh();
  },
  onPlayerCreature(card) {
    if (!gameState || gameState.active !== "player") return;
    if (card.ready && card.attack > 0) { gameState.selectedAttacker = gameState.selectedAttacker === card.uid ? null : card.uid; gameState.log = card.name + " selected — click a target."; }
    refresh();
  },
  onEnemyCreature(card) {
    if (!gameState || !gameState.selectedAttacker) return;
    attackTarget(gameState, "player", gameState.selectedAttacker, card.uid);
    gameState.selectedAttacker = null; refresh();
  },
  onEnemyHero() {
    if (!gameState || !gameState.selectedAttacker) return;
    attackTarget(gameState, "player", gameState.selectedAttacker, "hero");
    gameState.selectedAttacker = null; refresh();
  },
};
function startNewGame() {
  gameState = createGameState(Date.now() % 100000);
  gameState.log = "Your turn. Play a card, then attack when ready.";
  startTurn(gameState, "player"); showScreen("game"); refresh();
}
function handleEndTurn() {
  if (!gameState || gameState.active !== "player" || gameState.winner) return;
  endTurn(gameState); refresh();
  setTimeout(() => { if (gameState && !gameState.winner) { aiTakeTurn(gameState); refresh(); } }, 350);
}
function bootGame() {
  const params = new URLSearchParams(location.search);
  const screen = params.get("screen") || "title";
  document.getElementById("btn-start").addEventListener("click", startNewGame);
  document.getElementById("btn-end").addEventListener("click", handleEndTurn);
  document.querySelectorAll(".btn-again").forEach((b) => b.addEventListener("click", startNewGame));
  document.addEventListener("keydown", (e) => {
    if (!gameState) { if (e.key === "Enter") startNewGame(); return; }
    if (e.key === "Enter") handleEndTurn();
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 5) gameHandlers.onHandCard(n - 1);
  });
  if (screen === "table") { gameState = seedDemoState(); showScreen("game"); refresh(); }
  else if (screen === "win") { gameState = seedDemoState(); gameState.winner = "player"; gameState.enemy.hero.life = 0; showScreen("game"); refresh(); }
  else if (screen === "loss") { gameState = seedDemoState(); gameState.winner = "enemy"; gameState.player.hero.life = 0; showScreen("game"); refresh(); }
  else showScreen("title");
}
document.addEventListener("DOMContentLoaded", bootGame);
