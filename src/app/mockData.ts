/** Minimal placeholder data to keep UI working without bloat. */

export const DEFAULT_GROCERY_ITEMS = [
  { id: "1", name: "Spinach", quantity: "1 bunch", category: "Vegetables", checked: false },
  { id: "2", name: "Chicken breast", quantity: "1.5 lbs", category: "Protein", checked: false },
  { id: "3", name: "Greek yogurt", quantity: "32 oz", category: "Dairy", checked: false },
];

export const DEFAULT_INVENTORY_ITEMS = [
  { id: "inv1", name: "Chicken breast", quantity: 2, unit: "lbs", category: "Protein", plannedQuantity: 2 },
  { id: "inv2", name: "Spinach", quantity: 1, unit: "bunch", category: "Vegetables", plannedQuantity: 1 },
];

export const DEFAULT_WEEKLY_MEAL_PLAN = [
  {
    day: "Monday",
    meals: [
      {
        id: "m1",
        name: "Greek Yogurt with Berries",
        time: "Breakfast",
        calories: 280,
        prepTime: "5 min",
        ingredients: ["Greek yogurt", "mixed berries", "honey", "granola"],
        instructions: ["Place yogurt in a bowl", "Top with berries and granola", "Serve"],
      },
    ],
  },
];

export const WEEKLY_GOALS = [
  { id: "1", title: "Meals tracked", progress: 5, total: 7 },
  { id: "2", title: "Water (glasses)", progress: 12, total: 14 },
];

export const UPCOMING_MILESTONES = [
  "Week 2: Increased energy",
  "Week 3: Taste buds adapting",
  "Week 4: First month milestone",
];
