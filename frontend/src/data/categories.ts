export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  iconName: string;
}

export const BUSINESS_CATEGORIES: CategoryItem[] = [
  { id: 'Dairy', name: 'Dairy', description: 'Milk collection, chilling, A2 milk delivery & dairy products', iconName: 'Milk' },
  { id: 'Poultry', name: 'Poultry', description: 'Broiler chicken, country chicken & egg production', iconName: 'Egg' },
  { id: 'Agriculture', name: 'Agriculture', description: 'Organic farming, nursery & input supply store', iconName: 'Sprout' },
  { id: 'Food Processing', name: 'Food Processing', description: 'Flour mill, oil expeller, spice grinding & snacks', iconName: 'Utensils' },
  { id: 'Grocery/Retail', name: 'Grocery / Retail', description: 'Daily essential Kirana store with AePS banking', iconName: 'ShoppingBag' },
  { id: 'Textile', name: 'Textile & Garments', description: 'Readymade garments, saree store & loom products', iconName: 'Shirt' },
  { id: 'Tailoring', name: 'Tailoring & Boutique', description: 'Custom stitching, school uniform & alterations', iconName: 'Scissors' },
  { id: 'Handicrafts', name: 'Handicrafts & Art', description: 'Pottery, bamboo crafts, jute bags & artisan goods', iconName: 'Palette' },
  { id: 'Beauty & Personal Care', name: 'Beauty & Personal Care', description: 'Salon, herbal products & cosmetic shop', iconName: 'Sparkles' },
  { id: 'Mobile/Electronics', name: 'Mobile & Electronics', description: 'Phone sales, accessories, recharges & repair', iconName: 'Smartphone' },
  { id: 'Transportation', name: 'Transportation', description: 'Goods auto, mini pickup truck & passenger auto', iconName: 'Truck' },
  { id: 'Repair Services', name: 'Repair Services', description: 'Two-wheeler, tractor & electrical appliance repair', iconName: 'Wrench' },
  { id: 'Small Manufacturing', name: 'Small Manufacturing', description: 'Paper cup, fly ash brick, cement block & packaging', iconName: 'Factory' },
  { id: 'Digital Services', name: 'Digital & CSC Center', description: 'Photocopy, online government forms & computer service', iconName: 'Laptop' },
  { id: 'Education/Training', name: 'Education & Coaching', description: 'Tuition center, skill training & computer institute', iconName: 'GraduationCap' },
  { id: 'Other', name: 'Other Business', description: 'Specify custom rural business idea', iconName: 'PlusCircle' }
];

export interface CategoryPricingBenchmark {
  price: number;
  cost: number;
  volume: number;
  unit: string;
  range: string;
  margin: number;
}

export const getCategoryPricingBenchmark = (cat: string): CategoryPricingBenchmark => {
  switch (cat) {
    case 'Dairy':
      return { price: 52, cost: 40, volume: 1800, unit: 'Liter', range: '₹48  –  ₹60 / Liter', margin: 23 };
    case 'Grocery':
    case 'Retail':
      return { price: 120, cost: 95, volume: 2200, unit: 'Item', range: '18%  –  25% Markup', margin: 21 };
    case 'Textiles':
    case 'Textile':
      return { price: 450, cost: 320, volume: 350, unit: 'Piece', range: '₹350  –  ₹650 / Piece', margin: 29 };
    case 'Food':
    case 'Food Processing':
      return { price: 60, cost: 38, volume: 2200, unit: 'Plate', range: '₹40  –  ₹90 / Item', margin: 37 };
    case 'Poultry':
      return { price: 190, cost: 140, volume: 800, unit: 'Kg', range: '₹170  –  ₹230 / Kg', margin: 26 };
    case 'Small Manufacturing':
    case 'Manufacturing':
      return { price: 150, cost: 105, volume: 1200, unit: 'Unit', range: '₹120  –  ₹200 / Unit', margin: 30 };
    case 'Services':
    case 'Repair Services':
    case 'Digital Services':
      return { price: 350, cost: 120, volume: 250, unit: 'Service', range: '₹250  –  ₹550 / Service', margin: 66 };
    case 'Agriculture-related business':
    case 'Agriculture':
      return { price: 140, cost: 95, volume: 1100, unit: 'Unit', range: '₹110  –  ₹190 / Unit', margin: 32 };
    default:
      return { price: 100, cost: 70, volume: 1000, unit: 'Unit', range: '₹80  –  ₹150 / Unit', margin: 30 };
  }
};

