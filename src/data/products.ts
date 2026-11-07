export type Product = {
  id: string;
  name: string;
  flavor: string;
  badge: string;
  weight: string;
  image: string;
  description: string;
  /** Tailwind classes for the flavour colour theme */
  bg: string;
  ring: string;
  chip: string;
};

export const products: Product[] = [
  {
    id: "chips",
    name: "Classic Chips",
    flavor: "Original",
    badge: "Crispy & Tasty",
    weight: "5 oz (142g)",
    image: "/chips.jpeg",
    description:
      "Golden ridged potato chips made from real Canadian potatoes, lightly salted for that classic crunch you can't stop at one.",
    bg: "bg-chips",
    ring: "ring-chips",
    chip: "bg-ink text-chips",
  },
  {
    id: "nachos",
    name: "Nachos",
    flavor: "Hot & Spicy",
    badge: "Bold Flavor",
    weight: "5.5 oz (156g)",
    image: "/nachos.jpeg",
    description:
      "Crunchy corn tortilla triangles loaded with a fiery chili and jalapeño seasoning. Made for movie nights and dip lovers.",
    bg: "bg-nachos",
    ring: "ring-nachos",
    chip: "bg-white text-nachos",
  },
  {
    id: "puff",
    name: "Puff",
    flavor: "Cheese",
    badge: "Light & Airy",
    weight: "5 oz (142g)",
    image: "/puff.jpeg",
    description:
      "Light, airy corn puffs coated in rich, real cheese. A melt-in-your-mouth snack for kids and grown-ups alike.",
    bg: "bg-puff",
    ring: "ring-puff",
    chip: "bg-brand text-ink",
  },
  {
    id: "popcorn",
    name: "Popcorn",
    flavor: "Sea Salt",
    badge: "Air Popped",
    weight: "4.5 oz (128g)",
    image: "/popcorn.jpeg",
    description:
      "Fluffy air-popped popcorn finished with a pinch of sea salt. Simple, wholesome and endlessly snackable.",
    bg: "bg-popcorn",
    ring: "ring-popcorn",
    chip: "bg-white text-popcorn",
  },
];
