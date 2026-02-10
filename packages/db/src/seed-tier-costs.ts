import { db } from "./index";
import { tierCosts } from "./schema/credits";

const initialTierCosts = [
  {
    slug: "cheater",
    name: "Cheater (Easiest)",
    creditCost: 21,
    description:
      "Uses the most capable models with full context - easiest to win",
    scoreMultiplier: 0.7,
    displayOrder: 1,
    colorClass: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  {
    slug: "very_easy",
    name: "Very Easy",
    creditCost: 16,
    description: "Uses highly capable models - very easy to win",
    scoreMultiplier: 0.8,
    displayOrder: 2,
    colorClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    slug: "easy",
    name: "Easy",
    creditCost: 12,
    description: "Uses capable models with good context - easy to win",
    scoreMultiplier: 0.9,
    displayOrder: 3,
    colorClass: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  {
    slug: "normal",
    name: "Normal",
    creditCost: 7,
    description: "Balanced difficulty with standard models",
    scoreMultiplier: 1.0,
    displayOrder: 4,
    colorClass: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  {
    slug: "hard",
    name: "Hard",
    creditCost: 5,
    description: "Uses constrained models - challenging to win",
    scoreMultiplier: 1.3,
    displayOrder: 4,
    colorClass: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  {
    slug: "very_hard",
    name: "Very Hard",
    creditCost: 2,
    description: "Uses limited models - very challenging to win",
    scoreMultiplier: 1.75,
    displayOrder: 6,
    colorClass: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  {
    slug: "impossible",
    name: "Impossible (Hardest)",
    creditCost: 1,
    description: "Uses minimal models - extremely difficult to win",
    scoreMultiplier: 2.2,
    displayOrder: 7,
    colorClass: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
];

async function seedTierCosts() {
  console.log("Seeding tier costs...");

  for (const tierCost of initialTierCosts) {
    await db.insert(tierCosts).values(tierCost).onConflictDoNothing();
    console.log(`  Inserted: ${tierCost.slug}`);
  }

  console.log("Done!");
}

seedTierCosts().catch(console.error);
