export const EMPTY = {
  title: '',
  details: '',
  category: '',
  offerAmount: '',
  deadlineDate: '',
  deadlineTime: '',
  urgency: 'Normal',
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

export const DEADLINE_STATUS_OPTIONS = [
  {
    key: 'Urgent',
    label: 'Urgent',
    sublabel: 'Rush (<3h)',
    icon: 'flame',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    textColor: '#991B1B',
    activeBg: '#DC2626',
    description:
      'Signals couriers that this task requires immediate urgent attention and fast acceptance.',
  },
  {
    key: 'Due today',
    label: 'Due Today',
    sublabel: 'Finish today',
    icon: 'today',
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    textColor: '#92400E',
    activeBg: '#D97706',
    description: 'Prioritized for fulfillment today before end of day.',
  },
  {
    key: 'Due tomorrow',
    label: 'Due Tomorrow',
    sublabel: 'Next day',
    icon: 'calendar',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    textColor: '#1E40AF',
    activeBg: '#2563EB',
    description: 'Scheduled for fulfillment by tomorrow or next day schedule.',
  },
  {
    key: 'Normal',
    label: 'Normal',
    sublabel: 'Standard schedule',
    icon: 'checkmark-circle',
    color: '#15803D',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    textColor: '#166534',
    activeBg: '#15803D',
    description:
      'Standard delivery and errand schedule with regular courier dispatch.',
  },
  {
    key: 'Flexible',
    label: 'Flexible',
    sublabel: 'Open window',
    icon: 'hourglass-outline',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    textColor: '#5B21B6',
    activeBg: '#7C3AED',
    description:
      'Flexible timing anytime within the chosen target date and time window.',
  },
];
