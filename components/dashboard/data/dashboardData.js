export const DEFAULT_DOER = {
  name: 'Assigned doer',
  phone: '',
  rating: 'Rating unavailable',
  vehicle: 'Vehicle not provided',
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
