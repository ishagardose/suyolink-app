export const EMPTY = {
  title: '',
  details: '',
  category: '',
  offerAmount: '',
  deadlineDate: '',
  deadlineTime: '',
  location: '',
  publicLocation: '',
  exactAddress: '',
  contactPhone: '',
  phone: '',
  coordinates: null,
  notes: '',
  attachments: [],
};

export const CATEGORY_ICONS = {
  Delivery: 'bicycle-outline',
  Groceries: 'cart-outline',
  Documents: 'document-attach-outline',
  'Queuing & Bills': 'receipt-outline',
  Household: 'home-outline',
  Other: 'cube-outline',
};

export const QUICK_PRESETS = [
  {
    key: 'custom',
    label: 'Custom / Create',
    isCreate: true,
  },
  {
    key: 'groceries',
    label: 'Groceries',
    title: 'Buy groceries at supermarket',
    category: 'Groceries',
    offerAmount: '150.00',
    details:
      'Pick up eggs, fresh bread, and 2 cartons of milk from local supermarket.',
  },
  {
    key: 'documents',
    label: 'Documents',
    title: 'Drop off documents - Unit 402',
    category: 'Documents',
    offerAmount: '300.00',
    details:
      'Deliver notarized agreements and legal documents to Unit 402 reception desk.',
  },
  {
    key: 'bills',
    label: 'Bills Payment',
    title: 'Queue for bills payment',
    category: 'Queuing & Bills',
    offerAmount: '120.00',
    details:
      'Line up at Bayad Center to pay monthly utility bill. Cash and bill slip are prepared.',
  },
  {
    key: 'pickup_deliver',
    label: 'Pickup & Deliver',
    title: 'Pickup & Deliver items',
    category: 'Delivery',
    offerAmount: '180.00',
    details:
      'Collect pre-ordered package from branch and safely deliver to destination address.',
  },
];

export const REWARD_PRESETS = ['100.00', '150.00', '200.00', '300.00'];

export const PLACEHOLDER_COLOR = '#688676';

// Helper to get formatted default today & time +3 hours
export const getInitialDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getInitialTime = () => {
  const now = new Date(Date.now() + 3 * 3600000);
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
};
