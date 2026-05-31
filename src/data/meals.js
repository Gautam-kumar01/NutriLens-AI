export const mealsDB = [
  {
    name: "Chicken Quinoa Bowl",
    calories: 615, protein: 42, carbs: 58, fat: 19,
    fiber: 9, sugar: 7, sodium: 620, cholesterol: 95,
    grade: "A-", healthy: 88, confidence: 94, type: "global",
    ingredients: ["grilled chicken", "quinoa", "avocado", "tomato", "greens"],
    vitamins: { vitaminA: 18, vitaminC: 24, vitaminD: 6, vitaminB12: 45, iron: 22, calcium: 8, potassium: 18 },
    coach: "Great protein balance. Add leafy greens at dinner to raise micronutrients without pushing calories high."
  },
  {
    name: "Salmon Avocado Toast",
    calories: 540, protein: 36, carbs: 42, fat: 24,
    fiber: 8, sugar: 5, sodium: 690, cholesterol: 75,
    grade: "A", healthy: 90, confidence: 96, type: "global",
    ingredients: ["salmon", "sourdough", "avocado", "egg", "microgreens"],
    vitamins: { vitaminA: 12, vitaminC: 10, vitaminD: 85, vitaminB12: 120, iron: 18, calcium: 6, potassium: 22 },
    coach: "Omega fats and protein look strong. Keep the next snack light and fruit-forward."
  },
  {
    name: "Veggie Pasta Bowl",
    calories: 665, protein: 24, carbs: 92, fat: 21,
    fiber: 11, sugar: 12, sodium: 540, cholesterol: 15,
    grade: "B", healthy: 74, confidence: 89, type: "global",
    ingredients: ["penne", "zucchini", "bell pepper", "tomato sauce", "parmesan"],
    vitamins: { vitaminA: 30, vitaminC: 45, vitaminD: 2, vitaminB12: 8, iron: 16, calcium: 14, potassium: 20 },
    coach: "Fiber is excellent. Pair it with a protein-rich snack later to keep the day balanced."
  },
  {
    name: "Roti with Dal",
    calories: 320, protein: 14, carbs: 58, fat: 4,
    fiber: 12, sugar: 4, sodium: 480, cholesterol: 0,
    grade: "A-", healthy: 92, confidence: 98, type: "indian",
    ingredients: ["whole wheat roti", "yellow dal", "ghee", "spices", "onion"],
    vitamins: { vitaminA: 4, vitaminC: 6, vitaminD: 0, vitaminB12: 0, iron: 28, calcium: 6, potassium: 24 },
    coach: "Excellent fiber and steady carbs. Add paneer or eggs if your protein target is behind."
  },
  {
    name: "Paneer Butter Masala",
    calories: 450, protein: 18, carbs: 22, fat: 32,
    fiber: 5, sugar: 8, sodium: 780, cholesterol: 55,
    grade: "B", healthy: 72, confidence: 94, type: "indian",
    ingredients: ["paneer", "tomato gravy", "cream", "butter", "spices"],
    vitamins: { vitaminA: 22, vitaminC: 18, vitaminD: 8, vitaminB12: 12, iron: 10, calcium: 32, potassium: 14 },
    coach: "Rich in protein but calorie-dense due to fat. Balance your next meal with high fiber vegetables."
  },
  {
    name: "Masala Dosa",
    calories: 380, protein: 9, carbs: 64, fat: 10,
    fiber: 6, sugar: 3, sodium: 620, cholesterol: 0,
    grade: "B+", healthy: 81, confidence: 95, type: "indian",
    ingredients: ["rice batter", "potato filling", "oil", "sambar", "chutney"],
    vitamins: { vitaminA: 6, vitaminC: 14, vitaminD: 0, vitaminB12: 0, iron: 14, calcium: 4, potassium: 16 },
    coach: "Good energy source. Keep coconut chutney moderate to manage fat intake."
  },
  {
    name: "Idli with Sambar",
    calories: 240, protein: 8, carbs: 48, fat: 2,
    fiber: 5, sugar: 4, sodium: 550, cholesterol: 0,
    grade: "A", healthy: 88, confidence: 96, type: "indian",
    ingredients: ["steamed rice cake", "lentil stew", "vegetables", "tamarind"],
    vitamins: { vitaminA: 8, vitaminC: 12, vitaminD: 0, vitaminB12: 0, iron: 12, calcium: 4, potassium: 18 },
    coach: "Great light breakfast. Add a protein shake or eggs to boost morning protein."
  },
  {
    name: "Upma",
    calories: 290, protein: 6, carbs: 45, fat: 10,
    fiber: 4, sugar: 2, sodium: 400, cholesterol: 0,
    grade: "B+", healthy: 80, confidence: 92, type: "indian",
    ingredients: ["semolina", "oil", "mustard seeds", "vegetables", "cashews"],
    vitamins: { vitaminA: 4, vitaminC: 8, vitaminD: 0, vitaminB12: 0, iron: 10, calcium: 3, potassium: 12 },
    coach: "Comforting and light. Add some peanuts or cashews for healthy fats and protein."
  },
  {
    name: "Poha",
    calories: 260, protein: 5, carbs: 48, fat: 7,
    fiber: 3, sugar: 2, sodium: 380, cholesterol: 0,
    grade: "A-", healthy: 84, confidence: 94, type: "indian",
    ingredients: ["flattened rice", "peanuts", "onion", "turmeric", "curry leaves"],
    vitamins: { vitaminA: 2, vitaminC: 10, vitaminD: 0, vitaminB12: 0, iron: 20, calcium: 2, potassium: 10 },
    coach: "Light and digestible. Good pre-workout carb source."
  },
  {
    name: "Chicken Biryani",
    calories: 550, protein: 28, carbs: 62, fat: 22,
    fiber: 4, sugar: 3, sodium: 890, cholesterol: 85,
    grade: "B-", healthy: 70, confidence: 97, type: "indian",
    ingredients: ["basmati rice", "chicken", "spices", "ghee", "fried onions"],
    vitamins: { vitaminA: 8, vitaminC: 6, vitaminD: 4, vitaminB12: 30, iron: 16, calcium: 4, potassium: 14 },
    coach: "Protein is strong, but calories are dense. Pair with cucumber raita and skip extra carbs."
  },
  {
    name: "Samosa",
    calories: 260, protein: 4, carbs: 32, fat: 14,
    fiber: 3, sugar: 1, sodium: 320, cholesterol: 0,
    grade: "C", healthy: 45, confidence: 98, type: "indian",
    ingredients: ["refined flour", "potato", "peas", "oil", "spices"],
    vitamins: { vitaminA: 2, vitaminC: 8, vitaminD: 0, vitaminB12: 0, iron: 6, calcium: 2, potassium: 8 },
    coach: "Deep fried snack. Enjoy in moderation and track the fats carefully."
  },
  {
    name: "Chole Bhature",
    calories: 580, protein: 16, carbs: 72, fat: 26,
    fiber: 14, sugar: 5, sodium: 920, cholesterol: 0,
    grade: "C+", healthy: 60, confidence: 95, type: "indian",
    ingredients: ["chickpeas", "fried bread", "spices", "oil", "onion"],
    vitamins: { vitaminA: 4, vitaminC: 12, vitaminD: 0, vitaminB12: 0, iron: 30, calcium: 6, potassium: 22 },
    coach: "Great fiber from chole, but bhature is calorie-dense. Good for an occasional cheat meal."
  }
];

export const packagedFoods = [
  { name: "Protein Granola Bar", calories: 210, protein: 12, carbs: 24, fat: 7 },
  { name: "Greek Yogurt Cup",    calories: 145, protein: 16, carbs: 12, fat: 4 },
  { name: "Roasted Makhana Pack",calories: 180, protein: 6,  carbs: 22, fat: 8 },
];
