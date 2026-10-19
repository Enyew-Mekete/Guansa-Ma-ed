import { MenuCategory } from '../types';

export const INITIAL_MENU_CATEGORIES: MenuCategory[] = [
  { id: 'specials', name: 'Guansa Specials', nameAmharic: 'የጓንሳ ምርጥ', menuType: 'food' },
  { id: 'wats', name: 'Traditional Wats', nameAmharic: 'ወጦች', menuType: 'food' },
  { id: 'tibs', name: 'Sizzling Tibs', nameAmharic: 'ጥብሶች', menuType: 'food' },
  { id: 'vegetarian', name: 'Vegetarian Fasting', nameAmharic: 'የጾም በያይነቱ', menuType: 'food' },
  { id: 'desserts', name: 'Desserts', nameAmharic: 'ጣፋጮች', menuType: 'food' },
  { id: 'drinks', name: 'Buna & Beverages', nameAmharic: 'ቡናና መጠጦች', menuType: 'drink' },
];
