import { MenuItem, Category } from './types';

export const TABLE_ID = "Table 12";

export const CATEGORIES: Category[] = [
  { 
    id: 'popular', 
    name: 'Popular',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'plates', 
    name: 'Kebab Plates',
    image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'wraps', 
    name: 'Wraps',
    image: 'https://images.unsplash.com/photo-1662116765994-1e304675661b?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'sides', 
    name: 'Appetizers',
    image: 'https://images.unsplash.com/photo-1577906096429-f7bad7d7bf82?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'desserts', 
    name: 'Desserts',
    image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'drinks', 
    name: 'Drinks',
    image: 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?auto=format&fit=crop&q=80&w=400'
  },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 1,
    categoryId: 'plates',
    name: 'Lamb Shish Plate',
    description: 'Tender, hand-cut cubes of marinated lamb grilled on skewers. Served with rice pilaf, shepherd salad, and warm pita.',
    price: 18.99,
    image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&q=80&w=1200',
    popular: true,
    isAvailable: true,
    options: [
      {
        id: 'base',
        name: 'Choose Base',
        type: 'single',
        required: true,
        choices: [
          { id: 'rice', name: 'Buttered Rice', price: 0 },
          { id: 'bulgur', name: 'Bulgur Wheat', price: 0 },
          { id: 'fries', name: 'Fries', price: 0 },
        ]
      },
      {
        id: 'sauce',
        name: 'Select Sauce',
        type: 'multi',
        required: false,
        max: 2,
        choices: [
          { id: 'garlic', name: 'Garlic Yogurt', price: 0 },
          { id: 'chili', name: 'Hot Chili', price: 0 },
          { id: 'tahini', name: 'Tahini', price: 0.50 },
        ]
      }
    ]
  },
  {
    id: 2,
    categoryId: 'plates',
    name: 'Chicken Adana',
    description: 'Minced chicken mixed with red bell peppers and spices, mounted on a wide skewer and grilled. A smoky, savory delight.',
    price: 16.50,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=1200',
    isAvailable: true,
    options: [
      {
        id: 'base',
        name: 'Choose Base',
        type: 'single',
        required: true,
        choices: [
          { id: 'rice', name: 'Buttered Rice', price: 0 },
          { id: 'fries', name: 'Fries', price: 0 },
        ]
      }
    ]
  },
  {
    id: 8,
    categoryId: 'plates',
    name: 'Mixed Grill Feast',
    description: 'The ultimate sampler: Lamb Shish, Chicken Shish, and Adana Kebab. Perfect for those who want a bit of everything.',
    price: 28.50,
    image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&q=80&w=1200',
    popular: true,
    isAvailable: true,
    options: [
      {
        id: 'base',
        name: 'Choose Base',
        type: 'single',
        required: true,
        choices: [
          { id: 'rice', name: 'Buttered Rice', price: 0 },
          { id: 'bulgur', name: 'Bulgur Wheat', price: 0 },
        ]
      }
    ]
  },
  {
    id: 3,
    categoryId: 'wraps',
    name: 'Falafel Wrap',
    description: 'Homemade crispy falafels with hummus, lettuce, tomatoes, and tahini sauce rolled in a soft lavash bread.',
    price: 11.99,
    image: 'https://images.unsplash.com/photo-1547058881-883302334807?auto=format&fit=crop&q=80&w=1200',
    popular: true,
    isAvailable: true,
    options: [
      {
        id: 'spicy',
        name: 'Spiciness',
        type: 'single',
        required: true,
        choices: [
          { id: 'mild', name: 'Mild', price: 0 },
          { id: 'medium', name: 'Medium', price: 0 },
          { id: 'hot', name: 'Extra Hot', price: 0 },
        ]
      }
    ]
  },
  {
    id: 4,
    categoryId: 'sides',
    name: 'Creamy Hummus',
    description: 'A smooth blend of chickpeas, tahini, lemon juice, and garlic. Finished with extra virgin olive oil and paprika.',
    price: 6.99,
    image: 'https://images.unsplash.com/photo-1630409351241-e90e7f5e47bf?auto=format&fit=crop&q=80&w=1200',
    isAvailable: true,
    options: []
  },
  {
    id: 9,
    categoryId: 'sides',
    name: 'Sigara Borek',
    description: 'Crispy phyllo dough rolls filled with a savory blend of feta cheese and parsley. A classic Turkish appetizer.',
    price: 7.50,
    image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=1200',
    popular: true,
    isAvailable: true,
    options: []
  },
  {
    id: 5,
    categoryId: 'sides',
    name: 'Halloumi Sticks',
    description: 'Golden-fried sticks of Cypriot halloumi cheese. Squeaky, salty, and incredibly satisfying.',
    price: 8.50,
    image: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&q=80&w=1200',
    isAvailable: false,
    options: []
  },
  {
    id: 11,
    categoryId: 'desserts',
    name: 'Pistachio Baklava',
    description: 'Rich, sweet pastry made of layers of filo filled with chopped pistachios and sweetened with syrup.',
    price: 6.50,
    image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&q=80&w=1200',
    popular: true,
    isAvailable: true,
    options: []
  },
  {
    id: 10,
    categoryId: 'drinks',
    name: 'Turkish Coffee',
    description: 'Finely ground coffee brewed in a traditional cake (cezve). Served with a side of Turkish Delight.',
    price: 3.50,
    image: 'https://images.unsplash.com/photo-1579998119246-8e503ae6717a?auto=format&fit=crop&q=80&w=1200',
    popular: true,
    isAvailable: true,
    options: [
       {
        id: 'sugar',
        name: 'Sugar Level',
        type: 'single',
        required: true,
        choices: [
          { id: 'no', name: 'No Sugar', price: 0 },
          { id: 'little', name: 'Little Sugar', price: 0 },
          { id: 'medium', name: 'Medium Sugar', price: 0 },
          { id: 'sweet', name: 'Sweet', price: 0 },
        ]
      }
    ]
  },
  {
    id: 12,
    categoryId: 'drinks',
    name: 'Chilled Ayran',
    description: 'Traditional Turkish yogurt drink mixed with salt. Refreshing and perfect with spicy kebabs.',
    price: 3.00,
    image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=1200',
    isAvailable: true,
    options: []
  }
];