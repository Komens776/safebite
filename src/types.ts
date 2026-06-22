export type AllergenKey = 'nuts' | 'eggs' | 'dairy' | 'fish' | 'shellfish' | 'soy' | 'gluten' | 'sesame';

export interface AllergenConfig {
  key: AllergenKey;
  label: string;
  emoji: string;
  description: string;
  commonGhanaianSources: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  allergies: string[]; // standard and custom
  createdAt: string;
  updatedAt: string;
}

export interface ScanItem {
  id: string;
  userId: string;
  foodDetected: string;
  itemsOnPlate: string; // comma-separated or list
  allergensFound: string[];
  isSafe: boolean;
  timestamp: number;
}

export interface FoodDetails {
  name: string;
  ingredients: string[];
  allergens: string[];
  description?: string;
}

export interface AlternativeMeal {
  name: string;
  ingredients: string[];
  allergens: string[];
  whySafe: string;
}
