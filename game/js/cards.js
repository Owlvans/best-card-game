// cards.js — card pool and the three houses of Emberfall
const HOUSES = {
  ember: { name: "Ember", symbol: "▲", color: "#e5482e", shape: "triangle" },
  tide: { name: "Tide", symbol: "●", color: "#2e7fe5", shape: "circle" },
  thorn: { name: "Thorn", symbol: "◆", color: "#3aa845", shape: "diamond" },
};
function creatureCard(id, name, house, cost, attack, health, text, keywords) {
  return { id, name, house, cost, attack, health, type: "creature", text: text || "", keywords: keywords || [] };
}
function spellCard(id, name, house, cost, text, effect) {
  return { id, name, house, cost, type: "spell", text, effect, attack: 0, health: 0, keywords: [] };
}
const CARD_POOL = [
  creatureCard("c01", "Ember Imp", "ember", 1, 2, 1, "A spark with teeth."),
  creatureCard("c02", "Cinder Guard", "ember", 2, 2, 3, "Guard. Must be attacked first.", ["guard"]),
  creatureCard("c03", "Flame Rider", "ember", 3, 3, 2, "Rush. Attacks at once.", ["rush"]),
  creatureCard("c04", "Ash Giant", "ember", 5, 5, 5, "Too angry to fall quickly."),
  creatureCard("c05", "Tide Sprite", "tide", 1, 1, 2, "Slippery and cheerful."),
  creatureCard("c06", "Reef Warden", "tide", 2, 1, 4, "Guard. Must be attacked first.", ["guard"]),
  creatureCard("c07", "Wave Charger", "tide", 3, 3, 3, "Rush. Attacks at once.", ["rush"]),
  creatureCard("c08", "Deep Leviathan", "tide", 6, 6, 6, "The vale floods when it wakes."),
  creatureCard("c09", "Thorn Pup", "thorn", 1, 1, 1, "Small, spiky, loyal."),
  creatureCard("c10", "Briar Wall", "thorn", 2, 0, 5, "Guard. Must be attacked first.", ["guard"]),
  creatureCard("c11", "Vine Stalker", "thorn", 3, 4, 2, "Rush. Attacks at once.", ["rush"]),
  creatureCard("c12", "Elder Treant", "thorn", 5, 4, 7, "Roots remember every duel."),
  spellCard("s01", "Firebolt", "ember", 2, "Deal 3 damage to any target.", { kind: "damage", amount: 3 }),
  spellCard("s02", "Wildfire", "ember", 4, "Deal 4 damage to any target.", { kind: "damage", amount: 4 }),
  spellCard("s03", "Healing Tide", "tide", 2, "Heal your hero for 5.", { kind: "heal", amount: 5 }),
  spellCard("s04", "Ancient Wisdom", "thorn", 3, "Draw 2 cards.", { kind: "draw", amount: 2 }),
  spellCard("s05", "Thorn Volley", "thorn", 1, "Deal 2 damage to any target.", { kind: "damage", amount: 2 }),
  spellCard("s06", "Renewal", "tide", 3, "Heal your hero for 8.", { kind: "heal", amount: 8 }),
];
let cardInstanceCounter = 1;
function instantiateCard(template) {
  const copy = JSON.parse(JSON.stringify(template));
  copy.uid = "u" + cardInstanceCounter++;
  copy.currentHealth = copy.health;
  copy.ready = false;
  copy.summonedTurn = -1;
  return copy;
}
function buildDeck(seed) {
  const deck = [];
  CARD_POOL.forEach((t) => { deck.push(instantiateCard(t)); deck.push(instantiateCard(t)); });
  let s = seed || 12345;
  for (let i = deck.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    const tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
  }
  return deck;
}
