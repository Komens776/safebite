import { AllergenKey, AllergenConfig, FoodDetails, AlternativeMeal } from '../types';

export const ALLERGENS: AllergenConfig[] = [
  {
    key: 'nuts',
    label: 'Peanuts & Tree Nuts',
    emoji: '🥜',
    description: 'Groundnuts, peanut butter, oil, cashew, almond, shea butter.',
    commonGhanaianSources: ['Groundnut Soup', 'Nkatie Cake', 'Peanut Butter Paste', 'Groundnut Stew', 'Suya Spices (Kebab spice often has groundnuts)']
  },
  {
    key: 'eggs',
    label: 'Eggs',
    emoji: '🥚',
    description: 'Boiled, fried, scrambled eggs or products containing eggs as binders.',
    commonGhanaianSources: ['Waakye Egg', 'Gari Foto (sometimes contains egg), Salad with salad cream, Egg bread, Sponge cakes']
  },
  {
    key: 'dairy',
    label: 'Dairy (Milk & Butter)',
    emoji: '🥛',
    description: 'Cow milk, butter, cheese, whey, yogurt, milk powders.',
    commonGhanaianSources: ['Milo / Chocolate drinks', 'FanMilk products (FanYogo, FanChoco)', 'Wagashi (local cheese)', 'Bofrot (puff-puff made with milk on occasion)', 'Milk bread']
  },
  {
    key: 'fish',
    label: 'Fish',
    emoji: '🐟',
    description: 'Smoked, dried, salted, or grilled fish (Tilapia, Tuna, Salmon, Koobi (salted fish), Momone (fermented fish)).',
    commonGhanaianSources: ['Smoked Fish in soups', 'Momone flavoring in stews', 'Koobi in Okra or Abomu stews', 'Shito black pepper sauce (contains smoked fish powder)']
  },
  {
    key: 'shellfish',
    label: 'Shellfish',
    emoji: '🍤',
    description: 'Shrimp, prawns, crab, lobsters, oysters, snails.',
    commonGhanaianSources: ['Dried Shrimp powder in Shito', 'Okra Soup with crab/shrimp', 'Street food kebabs (sometimes shellfish flavored)']
  },
  {
    key: 'soy',
    label: 'Soybeans',
    emoji: '🫛',
    description: 'Soy milk, soy flour, tofu, soy sauce, vegetable oil containing soy.',
    commonGhanaianSources: ['Soya Kebabs', 'Kebab seasoning (sometimes Maggi cubes with soy), local soy flour porridge']
  },
  {
    key: 'gluten',
    label: 'Gluten & Wheat',
    emoji: '🌾',
    description: 'Wheat, barley, rye, flour, bread, doughs, spaghetti, standard noodles.',
    commonGhanaianSources: ['Banku (traditionally corn/cassava but mixed sometimes)', 'Kenkey (maize based, but high cross-contamination)', 'Hausa Koko', 'Spaghetti (Talia) in Waakye', 'Indomie instant noodles', 'Bofrot (wheat flour)', 'Ghanaian Sugar Bread']
  },
  {
    key: 'sesame',
    label: 'Sesame',
    emoji: '🫓',
    description: 'Sesame seeds, sesame paste (tahini), sesame oil.',
    commonGhanaianSources: ['Sesame sweets (local "wangara" sesame snacks)', 'Imported oils/dressing']
  }
];

// Ghanaian food ingredients dictionary with mapped allergens
export const INGREDIENT_RULES: Record<string, AllergenKey[]> = {
  // Peanuts
  'groundnut': ['nuts'],
  'peanut': ['nuts'],
  'peanuts': ['nuts'],
  'groundnuts': ['nuts'],
  'peanut butter': ['nuts'],
  'nkatie': ['nuts'],
  'nkatie cake': ['nuts'],
  'kebab powder': ['nuts'], // Suya kebab powder often contains peanut flour!
  
  // Eggs
  'egg': ['eggs'],
  'eggs': ['eggs'],
  'egg white': ['eggs'],
  'egg yolk': ['eggs'],
  'boiled egg': ['eggs'],
  'fried egg': ['eggs'],
  'mayonnaise': ['eggs'],
  'mayo': ['eggs'],
  'salad cream': ['eggs'],

  // Dairy
  'milk': ['dairy'],
  'butter': ['dairy'],
  'cheese': ['dairy'],
  'cream': ['dairy'],
  'yogurt': ['dairy'],
  'chocolim': ['dairy'],
  'milo': ['dairy'],
  'wagashi': ['dairy'],

  // Fish
  'fish': ['fish'],
  'tilapia': ['fish'],
  'salmon': ['fish'],
  'tuna': ['fish'],
  'mackerel': ['fish'],
  'herring': ['fish'],
  'smoked fish': ['fish'],
  'dried fish': ['fish'],
  'koobi': ['fish'],
  'momone': ['fish'],
  'keta school boys': ['fish'], // local dried anchovies
  'shito': ['fish', 'shellfish'], // Shito has both smoked fish AND dried shrimp!

  // Shellfish
  'shrimp': ['shellfish'],
  'prawn': ['shellfish'],
  'shrimps': ['shellfish'],
  'shrimp powder': ['shellfish'],
  'crab': ['shellfish'],
  'crabs': ['shellfish'],
  'lobster': ['shellfish'],
  'snail': ['shellfish'],
  'snails': ['shellfish'],

  // Gluten
  'wheat': ['gluten'],
  'flour': ['gluten'],
  'bread': ['gluten'],
  'spaghetti': ['gluten'],
  'talia': ['gluten'],
  'pasta': ['gluten'],
  'noodles': ['gluten'],
  'indomie': ['gluten'],
  'hausa koko': ['gluten'],
  'bofrot': ['gluten'],
  'puff': ['gluten'],
  'millet porridge': ['gluten'], // Mapped to gluten in android app due to cross-contact
  'banku': ['gluten'], // Maize/cassava, but traditionally mapped in Kotlin due to cross grain/binders
  'kenkey': ['gluten'],

  // Soy
  'soy': ['soy'],
  'soya': ['soy'],
  'tofu': ['soy'],
  'soybean': ['soy'],
  'soy sauce': ['soy'],

  // Sesame
  'sesame': ['sesame'],
  'tahini': ['sesame']
};

export const GHANAIAN_FOODS_DB: Record<string, FoodDetails> = {
  'banku': {
    name: 'Banku',
    ingredients: ['Fermented corn dough', 'fermented cassava dough', 'water', 'salt'],
    allergens: ['gluten'],
    description: 'A swallow dish made from cooked fermented corn and cassava dough, served with soup or grill.'
  },
  'fufu': {
    name: 'Fufu',
    ingredients: ['Boiled cassava', 'boiled plantain', 'water'],
    allergens: [],
    description: 'A smooth, heavy paste prepared by pounding boiled cassava and plantain. Gluten-free, safe!'
  },
  'jollof rice': {
    name: 'Jollof Rice',
    ingredients: ['Rice', 'vegetable oil', 'tomato paste', 'onions', 'garlic', 'ginger', 'spices'],
    allergens: [],
    description: 'A popular Ghanaian one-pot rice dish simmered in a savory tomato and onion stew.'
  },
  'waakye': {
    name: 'Waakye',
    ingredients: ['Rice', 'black-eyed beans', 'sorghum leaf sheaths (waakye leaves)', 'water', 'salt'],
    allergens: ['gluten'], // Due to spaghetti/talia usually added, and sometimes bread
    description: 'A hearty staple of rice and beans cooked with sun-dried sorghum stalks, typically eaten with sides.'
  },
  'hausa koko': {
    name: 'Hausa Koko',
    ingredients: ['Millet', 'ginger', 'cloves', 'chili pepper', 'water', 'sugar'],
    allergens: ['gluten'],
    description: 'A spicy Ghanaian millet porridge commonly eaten as a breakfast street food with koose (bean cakes).'
  },
  'gobe': {
    name: 'Gobe (Red Red)',
    ingredients: ['Black-eyed beans', 'palm oil', 'tomato paste', 'onions', 'fried ripe plantain', 'gari'],
    allergens: [],
    description: 'Soft-boiled beans in palm oil stew, topped with cassava grits (gari) and served with fried plantain.'
  },
  'groundnut soup': {
    name: 'Groundnut Soup',
    ingredients: ['Peanut paste', 'tomatoes', 'onions', 'garlic', 'ginger', 'chili', 'beef or chicken'],
    allergens: ['nuts'],
    description: 'A rich, creamy peanut-based soup seasoned with local spices and containing meats.'
  },
  'kelewele': {
    name: 'Kelewele',
    ingredients: ['Ripe plantain', 'ginger', 'cloves', 'chili pepper', 'salt', 'vegetable oil'],
    allergens: [],
    description: 'Spicy fried plantain cubes flavored with ginger, onions, and local Ghanaian spices.'
  },
  'kontomire stew': {
    name: 'Kontomire Stew (Palava Sauce)',
    ingredients: ['Taro leaves (kontomire)', 'palm oil', 'onions', 'tomatoes', 'fresh chili', 'egusi (melon seeds)', 'smoked herring fish'],
    allergens: ['fish'],
    description: 'A nutritious spinach-like stew cooked with melon seeds, palm oil, and smoked fish flakes.'
  },
  'light soup': {
    name: 'Light Soup',
    ingredients: ['Tomatoes', 'onions', 'garden eggs (aubergines)', 'chili', 'ginger', 'garlic', 'smoked fish or goat meat'],
    allergens: ['fish'], // Default smoked fish flavoring
    description: 'A spicy, light tomato-based soup cooked with local vegetables and meats or smoked fish.'
  }
};

/**
 * Normalise any custom allergen or misspelled allergen to standard categories
 */
export function normalizeAllergen(input: string): string {
  const normalized = input.trim().toLowerCase();
  
  if (/tree\s*nuts?|peanuts?|peanut|groundnuts?|groundnut|cashews?|almonds?|shuyal/i.test(normalized)) return 'nuts';
  if (/milk|butter|cheese|wagashi|dairy|cream|yogurt|lactose/i.test(normalized)) return 'dairy';
  if (/wheat|flour|gluten|bread|barley|rye|spaghetti|talia|pasta|noodles?/i.test(normalized)) return 'gluten';
  if (/shrimps?|prawns?|crabs?|lobster|oysters?|shellfish|snails?/i.test(normalized)) return 'shellfish';
  if (/salmon|tilapia|tuna|mackerel|herrings?|fish|momone|koobi/i.test(normalized)) return 'fish';
  if (/eggs?|boiled\s*egg|fried\s*egg/i.test(normalized)) return 'eggs';
  if (/soya?|soybeans?|tofu/i.test(normalized)) return 'soy';
  if (/sesame|tahini/i.test(normalized)) return 'sesame';

  return normalized; // keep custom name as is
}

/**
 * Run keyword tests on single / multiple ingredients or descriptions
 * to identify standard allergen keys that are violated
 */
export function getAllergensForIngredient(ingredientName: string): string[] {
  const norm = ingredientName.trim().toLowerCase();
  const found = new Set<string>();

  // Check direct matches
  for (const [key, allergens] of Object.entries(INGREDIENT_RULES)) {
    if (norm === key || norm.includes(key)) {
      allergens.forEach(a => found.add(a));
    }
  }

  // Also try self-normalization
  const matchedStd = normalizeAllergen(norm);
  if (ALLERGENS.some(a => a.key === matchedStd)) {
    found.add(matchedStd);
  }

  return Array.from(found);
}

/**
 * Get safe alternative recommendations in Ghana for a food containing certain allergens
 */
export function getSafeAlternatives(foodName: string, activeAllergies: string[]): AlternativeMeal[] {
  const normFood = foodName.toLowerCase();
  
  if (normFood.includes('groundnut soup') || normFood.includes('nuts')) {
    return [
      {
        name: 'Light Soup with Goat Meat / Chicken',
        ingredients: ['Tomatoes', 'onions', 'garden eggs', 'ginger', 'beef/chicken/goat'],
        allergens: activeAllergies.includes('fish') ? ['fish'] : [],
        whySafe: 'It contains absolutely no groundnuts or melon seeds. Very safe option when requested without fish.'
      },
      {
        name: 'Palm Nut Soup (Abenkwan)',
        ingredients: ['Palm pulp juice', 'tomatoes', 'onions', 'spices', 'meat'],
        allergens: [],
        whySafe: 'Creamy and rich like groundnut soup, but made entirely from palm fruits without a trace of nuts.'
      }
    ];
  }

  if (normFood.includes('banku') || normFood.includes('kenkey') || activeAllergies.includes('gluten')) {
    return [
      {
        name: 'Fufu with Light Soup',
        ingredients: ['Pounded Cassava & Plantain', 'light soup'],
        allergens: activeAllergies.includes('fish') ? ['fish'] : [],
        whySafe: 'Traditional fufu is 100% naturally gluten-free cassava and plantain, totally separating you from wheat binders.'
      },
      {
        name: 'Boiled Yam / Plantain with Garden Egg Stew',
        ingredients: ['Yam', 'plantain', 'stew leaves', 'egg (can omit)', 'palm oil'],
        allergens: activeAllergies.includes('eggs') ? ['eggs'] : [],
        whySafe: 'Substantial roots and plantains cooked clean without wheat contact. Omit eggs for egg allergy.'
      }
    ];
  }

  if (normFood.includes('kontomire') || normFood.includes('stew') || activeAllergies.includes('fish')) {
    return [
      {
        name: 'Egusi / Kontomire Stew (Fish-Free & Momone-Free)',
        ingredients: ['Taro leaves', 'melon seeds', 'palm oil', 'beef / tripe (wele)'],
        allergens: [],
        whySafe: 'Custom-ordered with only beef, goat, or wele, avoiding all smoked herrings or fermented fish flavorings.'
      },
      {
        name: 'Red Red (Gobe) Bean Stew',
        ingredients: ['Black eyed beans', 'palm oil', 'onions', 'fried plantain'],
        allergens: [],
        whySafe: 'Bean stew is fried in plain palm oil with onions, completely separated from fish soups and herrings.'
      }
    ];
  }

  // Default fallback alternatives
  return [
    {
      name: 'Plain Jollof Rice (Meat-Only)',
      ingredients: ['Rice', 'tomatoes', 'onions', 'chicken or beef'],
      allergens: [],
      whySafe: 'Cooked with basic herbs and served with baked chicken/beef instead of fish or egg accompaniments.'
    },
    {
      name: 'Pounded Fufu or Boiled Yam',
      ingredients: ['Organic tubers', 'clean stew'],
      allergens: [],
      whySafe: 'Pure tubers boiled or pounded with fresh ingredients and zero additives.'
    }
  ];
}

/**
 * Get tip advice for allergens
 */
export function getAllergenInfoTip(allergen: string): string {
  switch (allergen.toLowerCase()) {
    case 'nuts':
      return '🥜 Tip: In Ghana, always ask food vendors if groundnut/peanut paste or peanut oil was used in soups/sauces. Cross-contact in street foods is high.';
    case 'fish':
      return '🐟 Tip: Smoked fish, koobi, or momone are standard flavorings in almost all Ghanaian stews/soups. Specifically request customized meat-only dishes.';
    case 'shellfish':
      return '🍤 Tip: Dried shrimp powder (Shito powder) is standard in okra soups, shito sauces, and garri toppings. Beware of invisible powders!';
    case 'eggs':
      return '🥚 Tip: Eggs are served routinely with waakye or gari foto. Always tell street vendors "No egg" when scooping your food.';
    case 'gluten':
      return '🌾 Tip: Instant noodles, bofrot, and bread contain significant gluten. Opt for local grains like brown rice, boiled yam, cassava fufu, or plain plantain.';
    default:
      return '⚠️ Tip: When dining out in Ghana, always double-check with the head chef or food vendor about hidden oil and soup base ingredients.';
  }
}
