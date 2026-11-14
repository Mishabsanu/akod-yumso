/** Per-flavour styling + specification sheet for the scroll experience. */
export type FlavourSpec = {
  word: string;
  icon: string;
  glow: string; // neon glow colour
  deep: string; // deep background tint
  tagline: string;
  pack: string; // transparent pack cut-out
  specs: { label: string; value: string }[];
  crunch: number; // 1-5
  /** Shelf price in CAD (placeholder - set your real prices) */
  price: number;
  spice: number; // 0-5
};

export const heroTheme: Record<string, FlavourSpec> = {
  chips: {
    word: "CRUNCH",
    icon: "🥔",
    glow: "#ffb800",
    deep: "#2a1800",
    tagline: "Golden, ridged & perfectly salted. The classic that started it all.",
    pack: "/packs/chips.png",
    price: 3.99,
    specs: [
      { label: "Type", value: "Ridged potato chips" },
      { label: "Flavour", value: "Original, lightly salted" },
      { label: "Net weight", value: "5 oz (142 g)" },
      { label: "Key ingredients", value: "Potatoes, vegetable oil, salt" },
      { label: "Pairs with", value: "Sandwiches, dips, movie night" },
      { label: "Made in", value: "Canada 🍁" },
    ],
    crunch: 5,
    spice: 0,
  },
  nachos: {
    word: "SPICY",
    icon: "🌶️",
    glow: "#ff2a1f",
    deep: "#2a0303",
    tagline: "Fiery chili & jalapeño on crunchy corn triangles. Handle with care.",
    pack: "/packs/nachos.png",
    price: 4.49,
    specs: [
      { label: "Type", value: "Corn tortilla chips" },
      { label: "Flavour", value: "Hot & spicy chili-jalapeño" },
      { label: "Net weight", value: "5.5 oz (156 g)" },
      { label: "Key ingredients", value: "Corn, vegetable oil, chili seasoning" },
      { label: "Pairs with", value: "Salsa, guacamole, cheese dip" },
      { label: "Made in", value: "Canada 🍁" },
    ],
    crunch: 4,
    spice: 5,
  },
  puff: {
    word: "CHEESY",
    icon: "🧀",
    glow: "#2fd35a",
    deep: "#03230d",
    tagline: "Light, airy corn puffs smothered in real cheese. Melts in your mouth.",
    pack: "/packs/puff.png",
    price: 3.99,
    specs: [
      { label: "Type", value: "Corn puffs" },
      { label: "Flavour", value: "Real cheese" },
      { label: "Net weight", value: "5 oz (142 g)" },
      { label: "Key ingredients", value: "Corn meal, vegetable oil, cheese seasoning" },
      { label: "Pairs with", value: "Lunchboxes, game day, road trips" },
      { label: "Made in", value: "Canada 🍁" },
    ],
    crunch: 2,
    spice: 0,
  },
  popcorn: {
    word: "POPPED",
    icon: "🍿",
    glow: "#2b8cff",
    deep: "#03142e",
    tagline: "Fluffy, air-popped & kissed with sea salt. Simple, wholesome, addictive.",
    pack: "/packs/popcorn.png",
    price: 3.49,
    specs: [
      { label: "Type", value: "Air-popped popcorn" },
      { label: "Flavour", value: "Sea salt" },
      { label: "Net weight", value: "4.5 oz (128 g)" },
      { label: "Key ingredients", value: "Popcorn kernels, sunflower oil, sea salt" },
      { label: "Pairs with", value: "Movie night, parties, desk snacking" },
      { label: "Made in", value: "Canada 🍁" },
    ],
    crunch: 3,
    spice: 0,
  },
};
