// Local demo fixtures; replace with fetched data when the backend is ready.
export const QUICK_ACTIONS = [
  { id: '1', title: 'Post a Suyo', icon: 'hand-left-outline' },
  { id: '2', title: 'Run Errand', icon: 'bicycle-outline' },
];

export const AVAILABLE_SUYOS = [
  {
    id: 'SUYO-4821',
    title: 'Documents Delivery to Makati CBD',
    distance: '1.2 km away',
    reward: '₱145.00',
    type: 'Document Suyo',
    postedTime: '10 mins ago',
  },
  {
    id: 'SUYO-4819',
    title: 'Special Birthday Gift Drop to BGC',
    distance: '3.5 km away',
    reward: '₱220.00',
    type: 'Special Favor',
    postedTime: '25 mins ago',
  },
  {
    id: 'SUYO-4811',
    title: 'Organic Grocery Pickup from Market',
    distance: '2.0 km away',
    reward: '₱180.00',
    type: 'Market Errand',
    postedTime: '1 hour ago',
  },
];

export const DASHBOARD_STATS = { completed: 12, earned: '₱1,240', active: 2 };

export const ACTIVE_SUYO = {
  id: 'TRK-9842',
  trackingNumber: '#SYL-88219',
  status: 'In Transit', // 'In Transit' | 'On Process' | 'Delivered' | null
  eta: 'Doer is 5 mins away',
  detail: 'Errand: Drop off documents at Unit 402',
  progress: '78%',
};
