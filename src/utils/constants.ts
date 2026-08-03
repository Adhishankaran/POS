import { Product, AppSettings } from '../types';

export const STORAGE_KEYS = {
  SETTINGS: '@pos_app_settings_adhi_v1',
  INVOICES: '@pos_app_invoices_adhi_v1',
  PRODUCTS: '@pos_app_products_adhi_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'Adhi stores',
  address: '45 Main Market Road, Commercial Complex, Pollachi',
  phone: '+91 98765 43210',
  gstEnabled: true,
  gstPercentage: 5,
  currencySymbol: '₹',
  footerMessage: 'Thank You! Visit Adhi stores Again.',
  autoPrint: true,
};

export const INITIAL_PRODUCTS: Product[] = [
  // --- BEVERAGES ---
  {
    id: 'prod_001',
    name: 'Filter Coffee',
    category: 'Beverages',
    price: 50.0,
    unit: 'cup',
    gstRate: 5,
  },
  {
    id: 'prod_002',
    name: 'Masala Tea',
    category: 'Beverages',
    price: 20.0,
    unit: 'cup',
    gstRate: 5,
  },
  {
    id: 'prod_003',
    name: 'Packaged Fruit Juice (1L)',
    category: 'Beverages',
    price: 110.0,
    unit: 'pack',
    gstRate: 12,
  },
  {
    id: 'prod_004',
    name: 'Sparkling Mineral Water (750ml)',
    category: 'Beverages',
    price: 75.0,
    unit: 'bottle',
    gstRate: 12,
  },
  {
    id: 'prod_005',
    name: 'Herbal Green Tea (100 bags)',
    category: 'Beverages',
    price: 320.0,
    unit: 'box',
    gstRate: 5,
  },
  {
    id: 'prod_006',
    name: 'Energy Drink Can (250ml)',
    category: 'Beverages',
    price: 125.0,
    unit: 'can',
    gstRate: 28,
  },
  {
    id: 'prod_007',
    name: 'Cold Coffee Bottled (250ml)',
    category: 'Beverages',
    price: 85.0,
    unit: 'bottle',
    gstRate: 12,
  },
  {
    id: 'prod_008',
    name: 'Tender Coconut Water (200ml)',
    category: 'Beverages',
    price: 45.0,
    unit: 'pack',
    gstRate: 5,
  },

  // --- GROCERIES ---
  {
    id: 'prod_009',
    name: 'Organic Brown Rice (1kg)',
    category: 'Groceries',
    price: 120.0,
    unit: 'pack',
    gstRate: 5,
  },
  {
    id: 'prod_010',
    name: 'Premium Basmati Rice (5kg)',
    category: 'Groceries',
    price: 480.0,
    unit: 'bag',
    gstRate: 5,
  },
  {
    id: 'prod_011',
    name: 'Refined Sunflower Oil (1L)',
    category: 'Groceries',
    price: 165.0,
    unit: 'pouch',
    gstRate: 5,
  },
  {
    id: 'prod_012',
    name: 'Whole Wheat Atta (5kg)',
    category: 'Groceries',
    price: 240.0,
    unit: 'bag',
    gstRate: 5,
  },
  {
    id: 'prod_013',
    name: 'Refined White Sugar (1kg)',
    category: 'Groceries',
    price: 45.0,
    unit: 'pack',
    gstRate: 5,
  },
  {
    id: 'prod_014',
    name: 'Toor Dal Premium (1kg)',
    category: 'Groceries',
    price: 155.0,
    unit: 'pack',
    gstRate: 5,
  },
  {
    id: 'prod_015',
    name: 'Moong Dal Split (1kg)',
    category: 'Groceries',
    price: 130.0,
    unit: 'pack',
    gstRate: 5,
  },
  {
    id: 'prod_016',
    name: 'Iodized Crystal Salt (1kg)',
    category: 'Groceries',
    price: 28.0,
    unit: 'pack',
    gstRate: 0,
  },
  {
    id: 'prod_017',
    name: 'Raw Organic Jaggery (1kg)',
    category: 'Groceries',
    price: 80.0,
    unit: 'pack',
    gstRate: 5,
  },

  // --- DAIRY ---
  {
    id: 'prod_018',
    name: 'Fresh Cow Milk (1L)',
    category: 'Dairy',
    price: 56.0,
    unit: 'packet',
    gstRate: 0,
  },
  {
    id: 'prod_019',
    name: 'Fresh Natural Curd (500g)',
    category: 'Dairy',
    price: 35.0,
    unit: 'pouch',
    gstRate: 0,
  },
  {
    id: 'prod_020',
    name: 'Unsalted Butter (200g)',
    category: 'Dairy',
    price: 115.0,
    unit: 'box',
    gstRate: 12,
  },
  {
    id: 'prod_021',
    name: 'Fresh Paneer Cottage Cheese (200g)',
    category: 'Dairy',
    price: 95.0,
    unit: 'pack',
    gstRate: 5,
  },
  {
    id: 'prod_022',
    name: 'Cheddar Cheese Slices (200g)',
    category: 'Dairy',
    price: 145.0,
    unit: 'pack',
    gstRate: 12,
  },
  {
    id: 'prod_023',
    name: 'Pure Cow Ghee (500ml)',
    category: 'Dairy',
    price: 360.0,
    unit: 'jar',
    gstRate: 12,
  },

  // --- SNACKS ---
  {
    id: 'prod_024',
    name: 'Dark Chocolate 70% (100g)',
    category: 'Snacks',
    price: 180.0,
    unit: 'bar',
    gstRate: 18,
  },
  {
    id: 'prod_025',
    name: 'Oatmeal Cookies (300g)',
    category: 'Snacks',
    price: 135.0,
    unit: 'pack',
    gstRate: 18,
  },
  {
    id: 'prod_026',
    name: 'Roasted Salted Almonds (250g)',
    category: 'Snacks',
    price: 290.0,
    unit: 'pouch',
    gstRate: 12,
  },
  {
    id: 'prod_027',
    name: 'Crispy Potato Chips (150g)',
    category: 'Snacks',
    price: 50.0,
    unit: 'pack',
    gstRate: 12,
  },
  {
    id: 'prod_028',
    name: 'Cashew Nuts Whole (250g)',
    category: 'Snacks',
    price: 340.0,
    unit: 'pouch',
    gstRate: 12,
  },
  {
    id: 'prod_029',
    name: 'South Indian Murukku Mixture (250g)',
    category: 'Snacks',
    price: 75.0,
    unit: 'pack',
    gstRate: 12,
  },

  // --- SPICES & CONDIMENTS ---
  {
    id: 'prod_030',
    name: 'Pure Turmeric Powder (200g)',
    category: 'Spices & Condiments',
    price: 65.0,
    unit: 'pack',
    gstRate: 5,
  },
  {
    id: 'prod_031',
    name: 'Red Chilli Powder (200g)',
    category: 'Spices & Condiments',
    price: 85.0,
    unit: 'pack',
    gstRate: 5,
  },
  {
    id: 'prod_032',
    name: 'Garam Masala Powder (100g)',
    category: 'Spices & Condiments',
    price: 60.0,
    unit: 'pack',
    gstRate: 5,
  },
  {
    id: 'prod_033',
    name: 'Tomato Ketchup (1kg)',
    category: 'Spices & Condiments',
    price: 130.0,
    unit: 'bottle',
    gstRate: 12,
  },
  {
    id: 'prod_034',
    name: 'Cumin Seeds (Jeera) (100g)',
    category: 'Spices & Condiments',
    price: 70.0,
    unit: 'pack',
    gstRate: 5,
  },

  // --- PERSONAL CARE ---
  {
    id: 'prod_035',
    name: 'Herbal Bath Soap (125g)',
    category: 'Personal Care',
    price: 45.0,
    unit: 'bar',
    gstRate: 18,
  },
  {
    id: 'prod_036',
    name: 'Anti-Dandruff Shampoo (180ml)',
    category: 'Personal Care',
    price: 195.0,
    unit: 'bottle',
    gstRate: 18,
  },
  {
    id: 'prod_037',
    name: 'Herbal Toothpaste (150g)',
    category: 'Personal Care',
    price: 98.0,
    unit: 'tube',
    gstRate: 18,
  },
  {
    id: 'prod_038',
    name: 'Moisturizing Body Lotion (200ml)',
    category: 'Personal Care',
    price: 240.0,
    unit: 'bottle',
    gstRate: 18,
  },

  // --- BAKERY ---
  {
    id: 'prod_039',
    name: 'Whole Wheat Sandwich Bread (400g)',
    category: 'Bakery',
    price: 45.0,
    unit: 'loaf',
    gstRate: 0,
  },
  {
    id: 'prod_040',
    name: 'Butter Croissant',
    category: 'Bakery',
    price: 60.0,
    unit: 'piece',
    gstRate: 18,
  },
  {
    id: 'prod_041',
    name: 'Crunchy Tea Rusk (300g)',
    category: 'Bakery',
    price: 55.0,
    unit: 'pack',
    gstRate: 18,
  },

  // --- FRUITS & VEGGIES ---
  {
    id: 'prod_042',
    name: 'Fresh Red Apples (1kg)',
    category: 'Fruits & Veggies',
    price: 180.0,
    unit: 'kg',
    gstRate: 0,
  },
  {
    id: 'prod_043',
    name: 'Bananas Robusta (1 dozen)',
    category: 'Fruits & Veggies',
    price: 60.0,
    unit: 'dozen',
    gstRate: 0,
  },
  {
    id: 'prod_044',
    name: 'Organic Country Tomatoes (1kg)',
    category: 'Fruits & Veggies',
    price: 40.0,
    unit: 'kg',
    gstRate: 0,
  },

  // --- HOUSEHOLD & SUPPLIES ---
  {
    id: 'prod_045',
    name: 'Dishwash Liquid Gel (500ml)',
    category: 'Household',
    price: 110.0,
    unit: 'bottle',
    gstRate: 18,
  },
  {
    id: 'prod_046',
    name: 'Laundry Detergent Powder (1kg)',
    category: 'Household',
    price: 160.0,
    unit: 'pack',
    gstRate: 18,
  },
  {
    id: 'prod_047',
    name: '9W Smart LED Bulb',
    category: 'Household',
    price: 199.0,
    unit: 'box',
    gstRate: 18,
  },
  {
    id: 'prod_048',
    name: 'Floor Cleaner Liquid Disinfectant (1L)',
    category: 'Household',
    price: 140.0,
    unit: 'bottle',
    gstRate: 18,
  },
];

export const PRODUCT_CATEGORIES = [
  'All',
  'Beverages',
  'Groceries',
  'Dairy',
  'Snacks',
  'Spices & Condiments',
  'Personal Care',
  'Bakery',
  'Fruits & Veggies',
  'Household',
  'Others',
];

export const GST_RATE_OPTIONS = [0, 5, 12, 18, 28];

export const formatCurrency = (amount: number, symbol: string = '₹'): string => {
  return `${symbol}${amount.toFixed(2)}`;
};

export const formatDateTime = (timestamp: number) => {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}:${seconds}`;

  return { date: dateStr, time: timeStr };
};

export const generateInvoiceNumber = (): string => {
  const now = new Date();
  const datePrefix = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${datePrefix}-${randomSuffix}`;
};
