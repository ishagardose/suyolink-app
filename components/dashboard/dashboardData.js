export const DEFAULT_DOER = {
  id: 'DOER-101',
  name: 'Alex Morales',
  initials: 'AM',
  phone: '+63 917 842 1983',
  rating: '4.95★',
  reviewCount: '142 reviews',
  completedCount: '142 suyos',
  vehicle: 'Honda Beat 125cc (Motorcycle)',
  vehiclePlate: 'ND-8821',
  badge: 'Top Rated Courier',
  onTimeRate: '99.2%',
  bio: 'Full-time motorcycle courier in Makati, BGC, and Tagum. Fast, reliable, and careful with parcels & documents.',
};

export const CATEGORY_OPTIONS = [
  'All',
  'Delivery',
  'Groceries',
  'Documents',
  'Queuing & Bills',
  'Household',
];

export const URGENCY_OPTIONS = [
  'All',
  'Normal',
  'Urgent',
  'Due today',
  'Due tomorrow',
];

export const CATEGORY_CONFIG = {
  All: {
    gradient: ['#1E4D2B', '#163523'],
    border: '#1E4D2B',
    text: '#FFFFFF',
  },
  default: {
    gradient: ['#EAF4EF', '#D7EBE0'],
    border: '#B8DCC8',
    text: '#1E4D2B',
  },
};

export const URGENCY_CONFIG = {
  All: {
    gradient: ['#1E4D2B', '#163523'],
    border: '#1E4D2B',
    text: '#FFFFFF',
  },
  Normal: {
    gradient: ['#F1F5F9', '#E2E8F0'],
    border: '#CBD5E1',
    text: '#475569',
  },
  Urgent: {
    gradient: ['#FEE2E2', '#FECACA'],
    border: '#FCA5A5',
    text: '#B91C1C',
  },
  'Due today': {
    gradient: ['#FFEDD5', '#FED7AA'],
    border: '#FDBA74',
    text: '#C2410C',
  },
  'Due tomorrow': {
    gradient: ['#FEFCE8', '#FEF9C3'],
    border: '#FDE047',
    text: '#854D0E',
  },
};
