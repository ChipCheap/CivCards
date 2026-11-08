// Every resource that cards and tokens can show: the name card files write, and the emoji that stands
// for it until the game has drawn icons of its own. Keyed by lower-case name.

export const RESOURCES = Object.freeze({
  production: { name: "Production", symbol: "⚙️" },
  food: { name: "Food", symbol: "🌾" },
  knowledge: { name: "Knowledge", symbol: "📖" },
  culture: { name: "Culture", symbol: "🏛️" },
  coin: { name: "Coin", symbol: "🪙" },
  attack: { name: "Attack", symbol: "⚔️" },
  military: { name: "Military", symbol: "⚔️" },
  cards: { name: "Cards", symbol: "🃏" },
  plant: { name: "Plant", symbol: "🌿" },
  rock: { name: "Rock", symbol: "🪨" },
  tool: { name: "Tool", symbol: "🔨" },
  grain: { name: "Grain", symbol: "🌱" },
  timber: { name: "Timber", symbol: "🪵" },
  wool: { name: "Wool", symbol: "🧶" },
  cloth: { name: "Cloth", symbol: "🧵" },
  iron: { name: "Iron", symbol: "⛓️" },
  powder: { name: "Powder", symbol: "💥" },
  horses: { name: "Horses", symbol: "🐎" },
  stone: { name: "Stone", symbol: "🪨" },
  coal: { name: "Coal", symbol: "⚫" },
  salt: { name: "Salt", symbol: "🧂" },
});

// What a token can show: anything a building could make or hold, not Attack, Military or Cards.
export const TOKEN_ICONS = Object.freeze(Object.keys(RESOURCES).filter(icon => !["attack", "military", "cards"].includes(icon)));

// The right panel's token bags, one per icon; a token's double-click picker offers every token icon.
export const TOKEN_BAG_ICONS = Object.freeze(["plant", "rock", "tool", "coin"]);

// A resource's emoji, or its first two letters when it has none yet, so a new name still reads.
export function resourceSymbol(resourceName) {
  return RESOURCES[resourceName.toLowerCase()]?.symbol ?? resourceName.slice(0, 2);
}

export function isKnownResource(resourceName) {
  return Object.hasOwn(RESOURCES, resourceName.toLowerCase());
}
