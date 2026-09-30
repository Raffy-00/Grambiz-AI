import { DemoScenario } from '../types';

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'demo-dairy',
    title: 'Demo 1: Dairy Farming & Milk Delivery',
    subtitle: '₹1 Lakh Margin | Micro Rural Village',
    category: 'Dairy',
    capital: 100000,
    location: {
      village: 'Valarpuram Village',
      gram_panchayat: 'Valarpuram GP',
      block: 'Sriperumbudur',
      district: 'Kanchipuram',
      state: 'Tamil Nadu',
      pincode: '602105'
    }
  },
  {
    id: 'demo-textile',
    title: 'Demo 2: Textile & Readymade Garments',
    subtitle: '₹2 Lakh Margin | Semi-Urban Hub',
    category: 'Textile',
    capital: 200000,
    location: {
      village: 'Chengalpattu Town',
      gram_panchayat: 'Chengalpattu Ward 4',
      block: 'Chengalpattu',
      district: 'Chengalpattu',
      state: 'Tamil Nadu',
      pincode: '603001'
    }
  },
  {
    id: 'demo-food',
    title: 'Demo 3: Food Processing & Spice Mill',
    subtitle: '₹5 Lakh Margin | Agricultural Belt',
    category: 'Food Processing',
    capital: 500000,
    location: {
      village: 'Pennagaram Village',
      gram_panchayat: 'Pennagaram GP',
      block: 'Pennagaram',
      district: 'Dharmapuri',
      state: 'Tamil Nadu',
      pincode: '636810'
    }
  },
  {
    id: 'demo-retail',
    title: 'Demo 4: Daily Needs Kirana Store',
    subtitle: '₹50,000 Margin | Village Center',
    category: 'Grocery/Retail',
    capital: 50000,
    location: {
      village: 'Gudiyattam Village',
      gram_panchayat: 'Gudiyattam GP',
      block: 'Gudiyattam',
      district: 'Vellore',
      state: 'Tamil Nadu',
      pincode: '632602'
    }
  }
];
