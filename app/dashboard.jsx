import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  Switch,
  Modal,
  Image,
  PanResponder,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useSuyos } from '../context/SuyoContext';
import { useDeviceLocation } from '../context/LocationContext';
import { useTheme } from '../theme/ThemeContext';
import { formatOffer } from '../data/suyoRequests';
import { distanceKm } from '../lib/geo';
import { RefreshControl } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const getTodayFormatted = () => {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = String(now.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
};

const getTomorrowFormatted = () => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const d = String(tomorrow.getDate()).padStart(2, '0');
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const y = String(tomorrow.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
};

const parseDistanceKm = (val) => {
  if (val === 'Any' || val === null || val === undefined) return 'Any';
  if (typeof val === 'number') return val;
  const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) || num <= 0 ? 'Any' : num;
};

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'JD';
  const clean = name
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/^(atty\.|dr\.|engr\.|mr\.|ms\.|mrs\.)\s+/i, '')
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'JD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatDateTimeNow = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${dateStr} · ${timeStr}`;
};

const INITIAL_AVAILABLE_SUYOS = [
  {
    id: 'SYL-101',
    title: 'Drop off documents - Unit 402',
    category: 'Documents',
    location: 'Makati CBD',
    distance: 0.5,
    distanceText: '0.5 km away',
    reward: '₱300',
    rewardAmount: 300,
    tag: 'Urgent',
    postedTime: 'Just now',
    createdAt: Date.now() - 2 * 60 * 1000,
    due: 'Due today ASAP',
    dueDate: getTodayFormatted(),
    details: 'Drop off notarized lease agreements and corporate papers at the 4th floor reception.',
    notes: 'Please hand directly to Ms. Santos.',
    requesterName: 'Atty. Rafael Cruz',
    requesterPhone: '0917 842 1983',
    requesterRating: '4.9★',
    completedCount: '34 completed',
  },
  {
    id: 'SYL-102',
    title: 'Buy groceries - SM Tagum',
    category: 'Groceries',
    location: 'SM Tagum',
    distance: 0.8,
    distanceText: '0.8 km away',
    reward: '₱150',
    rewardAmount: 150,
    tag: 'Due today',
    postedTime: '12 mins ago',
    createdAt: Date.now() - 12 * 60 * 1000,
    due: 'Due today at 5:00 PM',
    dueDate: getTodayFormatted(),
    details: '2 cartons of milk, 1 loaf of wheat bread, and 1 pack of eggs from supermarket.',
    notes: 'Receipt will be reimbursed via GCash or cash upon delivery.',
    requesterName: 'Maria Clarissa',
    requesterInitials: 'MR',
    requesterPhone: '0928 341 5520',
    requesterRating: '4.9★',
    completedCount: '34 completed',
  },
  {
    id: 'SYL-103',
    title: 'Queue for bills payment',
    category: 'Queuing & Bills',
    location: 'Bayad Center Ayala',
    distance: 1.4,
    distanceText: '1.4 km away',
    reward: '₱100',
    rewardAmount: 100,
    tag: 'Normal',
    postedTime: '35 mins ago',
    createdAt: Date.now() - 35 * 60 * 1000,
    due: 'Due tomorrow at 11:00 AM',
    dueDate: getTomorrowFormatted(),
    details: 'Line up to pay Meralco electric bill. Cash is prepared in an envelope.',
    notes: 'Return validated slip to lobby desk.',
    requesterName: 'Kenneth Gomez',
    requesterPhone: '0919 720 9144',
    requesterRating: '4.8★',
    completedCount: '28 completed',
  },
  {
    id: 'SYL-104',
    title: 'Pick up birthday cake',
    category: 'Delivery',
    location: 'Goldilocks Poblacion',
    distance: 2.1,
    distanceText: '2.1 km away',
    reward: '₱220',
    rewardAmount: 220,
    tag: 'Due tomorrow',
    postedTime: '1 hour ago',
    createdAt: Date.now() - 60 * 60 * 1000,
    due: 'Due tomorrow at 2:00 PM',
    dueDate: getTomorrowFormatted(),
    details: 'Pre-ordered 8-inch chocolate mousse cake. Needs upright, careful handling.',
    notes: 'Order #GLD-8821 under name Juan Dela Cruz.',
    requesterName: 'Patricia Tan',
    requesterPhone: '0905 188 4390',
    requesterRating: '5.0★',
    completedCount: '41 completed',
  },
  {
    id: 'SYL-105',
    title: 'Prescription pickup at Mercury Drug',
    category: 'Delivery',
    location: 'Mercury Drug Legaspi',
    distance: 1.1,
    distanceText: '1.1 km away',
    reward: '₱180',
    rewardAmount: 180,
    tag: 'Urgent',
    postedTime: '2 hours ago',
    createdAt: Date.now() - 120 * 60 * 1000,
    due: 'Due today ASAP',
    dueDate: getTodayFormatted(),
    details: 'Pick up maintenance heart medication prescription for senior citizen.',
    notes: 'Prescription slip is with the pharmacist.',
    requesterName: 'Lola Remedios',
    requesterPhone: '0939 655 0122',
    requesterRating: '4.9★',
    completedCount: '19 completed',
  },
];

const DEFAULT_DOER = {
  id: 'DOER-101',
  name: 'Alex Morales',
  initials: 'AM',
  phone: '+63 917 842 1983',
  rating: '4.95★',
  reviewCount: '142 reviews',
  completedCount: '142 errands',
  vehicle: 'Honda Beat 125cc (Motorcycle)',
  vehiclePlate: 'ND-8821',
  badge: 'Top Rated Courier',
  onTimeRate: '99.2%',
  bio: 'Full-time motorcycle courier in Makati, BGC, and Tagum. Fast, reliable, and careful with parcels & documents.',
};

const INITIAL_POSTED_SUYOS = [
  {
    id: 'POST-001',
    title: 'Buy groceries - SM Tagum',
    category: 'Groceries',
    location: 'SM Tagum',
    distanceText: '0.8 km away',
    reward: '₱150',
    rewardAmount: 150,
    tag: 'Waiting for doer',
    status: 'Open - waiting for a doer',
    createdAt: Date.now() - 45 * 60 * 1000,
    formattedDate: 'Sep 28 · 11:20 AM',
    waitTime: 'Waiting for 45m',
    needsBoost: true,
    details: '2 cartons of milk, 1 loaf of wheat bread, and 1 pack of eggs from supermarket.',
    notes: 'Receipt will be reimbursed via GCash or cash upon delivery.',
    requesterName: 'Juan Dela Cruz (You)',
  },
  {
    id: 'POST-002',
    title: 'Package pickup and drop-off at LBC Glorietta',
    category: 'Delivery',
    location: 'LBC Express - Glorietta',
    distanceText: '1.6 km away',
    reward: '₱160',
    rewardAmount: 160,
    tag: 'Waiting for doer',
    status: 'Open - waiting for a doer',
    createdAt: Date.now() - 25 * 60 * 1000,
    formattedDate: 'Today · 5:15 PM',
    waitTime: 'Waiting for 25m',
    needsBoost: true,
    details: 'Drop off pre-packed box with return barcode sticker at LBC branch.',
    notes: 'Already prepaid, just drop off at counter 2.',
    requesterName: 'Juan Dela Cruz (You)',
  },
  {
    id: 'POST-003',
    title: 'Pick up documents',
    category: 'Documents',
    location: 'Makati CBD',
    distanceText: '1.2 km away',
    reward: '₱200',
    rewardAmount: 200,
    tag: 'Cancelled',
    status: 'Cancelled',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    formattedDate: 'Sep 22 · 3:40 PM',
    details: 'Pick up notarized contract copy from law office at 5th floor.',
    notes: 'Cancelled by requester due to rescheduled meeting.',
    requesterName: 'Juan Dela Cruz (You)',
  },
];

const INITIAL_ACCEPTED_SUYOS = [
  {
    id: 'ACC-001',
    title: 'Drop off documents - Unit 402',
    category: 'Documents',
    location: 'Makati CBD',
    distanceText: '0.5 km away',
    reward: '₱300',
    rewardAmount: 300,
    tag: 'In Progress',
    status: 'In Progress - On the way',
    createdAt: Date.now() - 35 * 60 * 1000,
    formattedDate: 'Today · 4:00 PM',
    details: 'Drop off notarized lease agreements and corporate papers at 4th floor reception.',
    notes: 'Please hand directly to Ms. Santos.',
    requesterName: 'Juan Dela Cruz (You)',
    doer: {
      id: 'DOER-101',
      name: 'Alex Morales',
      initials: 'AM',
      phone: '+63 917 842 1983',
      rating: '4.95★',
      reviewCount: '142 reviews',
      completedCount: '142 errands',
      vehicle: 'Honda Beat 125cc (Motorcycle)',
      vehiclePlate: 'ND-8821',
      badge: 'Top Rated Courier',
      onTimeRate: '99.2%',
      bio: 'Full-time motorcycle courier in Makati, BGC, and Tagum. Fast, reliable, and careful with parcels.',
    },
  },
  {
    id: 'ACC-002',
    title: 'Buy fresh groceries and bread at Landmark',
    category: 'Groceries',
    location: 'Landmark Supermarket',
    distanceText: '0.8 km away',
    reward: '₱200',
    rewardAmount: 200,
    tag: 'In Progress',
    status: 'In Progress - Shopping',
    createdAt: Date.now() - 90 * 60 * 1000,
    formattedDate: 'Today · 2:30 PM',
    details: '2 cartons oat milk, 1 loaf whole wheat bread, 1 tray fresh eggs.',
    notes: 'Please check expiration date before purchasing.',
    requesterName: 'Juan Dela Cruz (You)',
    doer: {
      id: 'DOER-102',
      name: 'Maria Clarissa',
      initials: 'MC',
      phone: '+63 928 341 5520',
      rating: '4.88★',
      reviewCount: '89 reviews',
      completedCount: '89 errands',
      vehicle: 'Bicycle Courier',
      vehiclePlate: 'BIKE-04',
      badge: 'Verified Suyo Courier',
      onTimeRate: '98.5%',
      bio: 'Eco-friendly bicycle courier servicing Greenbelt and Legazpi village.',
    },
  },
];

const INITIAL_COMPLETED_SUYOS = [
  {
    id: 'COMP-001',
    title: 'Print school project',
    category: 'Documents',
    location: 'Davao Printing Hub',
    distanceText: '1.5 km away',
    reward: '₱80',
    rewardAmount: 80,
    tag: 'Completed',
    status: 'Completed',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    formattedDate: 'Sep 20 · 3:15 PM',
    completedDate: 'Sep 20, 2026 at 3:15 PM',
    details: 'Full color printing and ring binding of 45-page thesis project.',
    notes: 'Completed ahead of schedule.',
    requesterName: 'Juan Dela Cruz (You)',
    doer: {
      id: 'DOER-103',
      name: 'Carlos Dalisay',
      initials: 'CD',
      phone: '+63 919 720 9144',
      rating: '4.9★',
      reviewCount: '210 reviews',
      completedCount: '210 errands',
      vehicle: 'Yamaha Mio (Motorcycle)',
      vehiclePlate: 'DC-9912',
      badge: 'Community Hero',
      onTimeRate: '99.5%',
      bio: 'Dependable community courier with over 200+ completed local errands.',
    },
  },
  {
    id: 'COMP-002',
    title: 'Pick up medical supplies from Mercury Drug',
    category: 'Delivery',
    location: 'Mercury Drug Legaspi',
    distanceText: '1.1 km away',
    reward: '₱180',
    rewardAmount: 180,
    tag: 'Completed',
    status: 'Completed',
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    formattedDate: 'Sep 23 · 11:40 AM',
    completedDate: 'Sep 23, 2026 at 11:40 AM',
    details: 'Pick up prescribed maintenance asthma medication and vitamins.',
    notes: 'Delivered directly to reception desk.',
    requesterName: 'Juan Dela Cruz (You)',
    doer: {
      id: 'DOER-101',
      name: 'Alex Morales',
      initials: 'AM',
      phone: '+63 917 842 1983',
      rating: '4.95★',
      reviewCount: '142 reviews',
      completedCount: '142 errands',
      vehicle: 'Honda Beat 125cc (Motorcycle)',
      vehiclePlate: 'ND-8821',
      badge: 'Top Rated Courier',
      onTimeRate: '99.2%',
      bio: 'Full-time motorcycle courier in Makati, BGC, and Tagum.',
    },
  },
  {
    id: 'COMP-003',
    title: 'Queue for Meralco electric bill payment',
    category: 'Queuing & Bills',
    location: 'Bayad Center Ayala',
    distanceText: '1.4 km away',
    reward: '₱150',
    rewardAmount: 150,
    tag: 'Completed',
    status: 'Completed',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    formattedDate: 'Sep 28 · 1:10 PM',
    completedDate: 'Sep 28, 2026 at 1:10 PM',
    details: 'Pay monthly electricity bill before 4 PM counter cut-off.',
    notes: 'Validated payment slip returned.',
    requesterName: 'Juan Dela Cruz (You)',
    doer: {
      id: 'DOER-104',
      name: 'Kenneth Gomez',
      initials: 'KG',
      phone: '+63 905 188 4390',
      rating: '5.0★',
      reviewCount: '64 reviews',
      completedCount: '64 errands',
      vehicle: 'Walking / Commute',
      vehiclePlate: 'COMMUTER',
      badge: 'Queuing Specialist',
      onTimeRate: '100%',
      bio: 'Specialist in government agency and utility bills queuing.',
    },
  },
];

const INITIAL_ARCHIVED_SUYOS = [
  {
    id: 'ARCH-001',
    title: 'Weekly SM Supermarket Grocery Run',
    category: 'Groceries',
    location: 'SM Tagum',
    distanceText: '0.8 km away',
    reward: '₱180',
    rewardAmount: 180,
    tag: 'Archived Template',
    status: 'Archived Template',
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    formattedDate: 'Saved · Sep 18, 9:15 AM',
    details: 'Standard weekly supply: 2 cartons milk, 1 loaf whole wheat bread, eggs, fruit.',
    notes: 'Reimbursement upon delivery receipt.',
    requesterName: 'Juan Dela Cruz (You)',
  },
  {
    id: 'ARCH-002',
    title: 'Monthly Electric Bill Bayad Center',
    category: 'Queuing & Bills',
    location: 'Bayad Center Ayala',
    distanceText: '1.4 km away',
    reward: '₱150',
    rewardAmount: 150,
    tag: 'Archived Template',
    status: 'Archived Template',
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    formattedDate: 'Saved · Sep 15, 1:20 PM',
    details: 'Pay monthly electricity bill with prepared cash envelope.',
    notes: 'Return receipt to lobby guard.',
    requesterName: 'Juan Dela Cruz (You)',
  },
  {
    id: 'ARCH-003',
    title: 'Emergency Maintenance Medicine Pickup',
    category: 'Delivery',
    location: 'Mercury Drug Legaspi',
    distanceText: '1.1 km away',
    reward: '₱160',
    rewardAmount: 160,
    tag: 'Archived Template',
    status: 'Archived Template',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    formattedDate: 'Saved · Aug 29, 10:45 AM',
    details: 'Maintenance prescription pickup from pharmacy counter.',
    notes: 'Senior citizen discount book is at pharmacy.',
    requesterName: 'Juan Dela Cruz (You)',
  },
];

const WALLET_EARNED_SUYOS = [
  {
    id: 'WAL-001',
    title: 'Drop off documents - Unit 402',
    category: 'Documents',
    icon: 'document-text',
    date: 'Today · 4:00 PM',
    requesterName: 'Atty. Rafael Cruz',
    location: 'Makati CBD, Tower 1',
    earnedAmount: 300,
    status: 'Received',
    paymentMethod: 'Direct Payment (Cash/P2P)',
    refNo: 'SYL-EARN-9842',
  },
  {
    id: 'WAL-002',
    title: 'Buy groceries - SM Tagum',
    category: 'Groceries',
    icon: 'cart',
    date: 'Sep 28 · 12:15 PM',
    requesterName: 'Maria Clarissa',
    location: 'SM Tagum Supermarket',
    earnedAmount: 150,
    status: 'Received',
    paymentMethod: 'Direct Payment (Cash/P2P)',
    refNo: 'SYL-EARN-9801',
  },
  {
    id: 'WAL-003',
    title: 'Prescription pickup at Mercury Drug',
    category: 'Medicine',
    icon: 'medkit',
    date: 'Sep 26 · 3:45 PM',
    requesterName: 'Lola Remedios',
    location: 'Mercury Drug Legaspi',
    earnedAmount: 180,
    status: 'Received',
    paymentMethod: 'Direct Payment (Cash/P2P)',
    refNo: 'SYL-EARN-9755',
  },
  {
    id: 'WAL-004',
    title: 'Queue for Meralco bills payment',
    category: 'Queuing & Bills',
    icon: 'time',
    date: 'Sep 18 · 11:30 AM',
    requesterName: 'Kenneth Gomez',
    location: 'Bayad Center Ayala',
    earnedAmount: 250,
    status: 'Received',
    paymentMethod: 'Direct Payment (Cash/P2P)',
    refNo: 'SYL-EARN-9510',
  },
  {
    id: 'WAL-005',
    title: 'Pick up medical supplies & vitamins',
    category: 'Delivery',
    icon: 'bag-check-outline',
    date: 'Sep 12 · 2:30 PM',
    requesterName: 'Mrs. Angela Santos',
    location: 'Generika Drugstore',
    earnedAmount: 180,
    status: 'Received',
    paymentMethod: 'Direct Payment (Cash/P2P)',
    refNo: 'SYL-EARN-9321',
  },
  {
    id: 'WAL-006',
    title: 'Print school project & binding',
    category: 'Documents',
    icon: 'print',
    date: 'Sep 05 · 4:15 PM',
    requesterName: 'Dave B. (Student)',
    location: 'Davao Printing Hub',
    earnedAmount: 120,
    status: 'Received',
    paymentMethod: 'Direct Payment (Cash/P2P)',
    refNo: 'SYL-EARN-9120',
  },
  {
    id: 'WAL-007',
    title: 'Express parcel delivery to Greenbelt',
    category: 'Delivery',
    icon: 'bicycle',
    date: 'Aug 29 · 10:00 AM',
    requesterName: 'Patricia Mendoza',
    location: 'Greenbelt 5 Concierge',
    earnedAmount: 100,
    status: 'Received',
    paymentMethod: 'Direct Payment (Cash/P2P)',
    refNo: 'SYL-EARN-8940',
  },
];

const INITIAL_ACTIVITY_RECORDS = [
  {
    id: 'ACT-001',
    refNo: 'SYL-REC-9842',
    title: 'Drop off documents - Unit 402',
    category: 'Documents',
    icon: 'document-text',
    date: 'Today · 4:00 PM',
    timestamp: Date.now() - 30 * 60 * 1000,
    role: 'requester',
    status: 'In Progress',
    amount: 300,
    platformFee: 20,
    totalAmount: 320,
    paymentMethod: 'GCash',
    paymentRef: 'GC-9842109841',
    doer: {
      name: 'Alex Morales',
      rating: '4.95★',
      phone: '+63 917 842 1983',
      vehicle: 'Honda Beat 125cc (Motorcycle)',
    },
    location: 'Makati CBD',
    hasProof: false,
    notes: 'Urgent contract document hand-off. Courier currently en route.',
  },
  {
    id: 'ACT-002',
    refNo: 'SYL-REC-9801',
    title: 'Buy groceries - SM Tagum',
    category: 'Groceries',
    icon: 'cart',
    date: 'Sep 28, 2026 · 12:15 PM',
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    role: 'requester',
    status: 'Completed',
    amount: 150,
    platformFee: 15,
    totalAmount: 165,
    paymentMethod: 'GCash',
    paymentRef: 'GC-8812903412',
    doer: {
      name: 'Alex Morales',
      rating: '4.95★',
      phone: '+63 917 842 1983',
      vehicle: 'Honda Beat 125cc (Motorcycle)',
    },
    location: 'SM Tagum',
    hasProof: true,
    proofDetails: 'Official supermarket register receipt & packed grocery bags verified.',
    notes: '2 cartons milk, wheat bread, and eggs delivered fresh.',
  },
  {
    id: 'ACT-003',
    refNo: 'SYL-REC-9755',
    title: 'Prescription pickup at Mercury Drug',
    category: 'Medicine',
    icon: 'medkit',
    date: 'Sep 26, 2026 · 3:45 PM',
    timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
    role: 'doer',
    status: 'Completed',
    amount: 180,
    platformFee: 0,
    totalAmount: 180,
    paymentMethod: 'SuyoLink Wallet',
    paymentRef: 'SW-771920391',
    requesterName: 'Lola Remedios',
    requesterRating: '4.9★',
    location: 'Mercury Drug Legaspi',
    hasProof: true,
    proofDetails: 'Official pharmacy receipt & sealed prescription bag verified.',
    notes: 'Delivered maintenance cardiac medicine safely to senior citizen.',
  },
  {
    id: 'ACT-004',
    refNo: 'SYL-REC-9620',
    title: 'Print school project & binding',
    category: 'Documents',
    icon: 'print',
    date: 'Sep 20, 2026 · 3:15 PM',
    timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
    role: 'requester',
    status: 'Completed',
    amount: 80,
    platformFee: 10,
    totalAmount: 90,
    paymentMethod: 'Cash on Delivery',
    paymentRef: 'COD-66210984',
    doer: {
      name: 'Carlos Dalisay',
      rating: '4.9★',
      phone: '+63 919 720 9144',
      vehicle: 'Yamaha Mio',
    },
    location: 'Davao Printing Hub',
    hasProof: true,
    proofDetails: 'Photo of bound 45-page thesis document verified.',
    notes: 'Delivered ahead of deadline, cleanly bound with cover sleeve.',
  },
  {
    id: 'ACT-005',
    refNo: 'SYL-REC-9510',
    title: 'Queue for Meralco bills payment',
    category: 'Queuing & Bills',
    icon: 'time',
    date: 'Sep 18, 2026 · 11:30 AM',
    timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000,
    role: 'doer',
    status: 'Completed',
    amount: 250,
    platformFee: 0,
    totalAmount: 250,
    paymentMethod: 'SuyoLink Wallet',
    paymentRef: 'SW-651098231',
    requesterName: 'Kenneth Gomez',
    requesterRating: '4.8★',
    location: 'Bayad Center Ayala',
    hasProof: true,
    proofDetails: 'Machine-validated payment stamp slip photographed.',
    notes: 'Queued for 35 minutes, validated slip handed to client lobby desk.',
  },
  {
    id: 'ACT-006',
    refNo: 'SYL-REC-9402',
    title: 'Pick up notarized contract copy',
    category: 'Documents',
    icon: 'close-circle',
    date: 'Sep 15, 2026 · 2:10 PM',
    timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000,
    role: 'requester',
    status: 'Refunded',
    amount: 200,
    platformFee: 0,
    totalAmount: 200,
    paymentMethod: 'GCash (Refunded)',
    paymentRef: 'REF-55102948',
    location: 'Makati CBD',
    hasProof: false,
    notes: 'Cancelled due to lawyer rescheduling. 100% refund credited back to GCash.',
  },
];

const CATEGORY_OPTIONS = ['All', 'Delivery', 'Groceries', 'Documents', 'Queuing & Bills', 'Household'];
const URGENCY_OPTIONS = ['All', 'Normal', 'Urgent', 'Due today', 'Due tomorrow'];

const CATEGORY_CONFIG = {
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

const URGENCY_CONFIG = {
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

function SwipeableNotificationItem({
  item,
  onPress,
  onMarkRead,
  onRemove,
}) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dx) > 10 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -200));
        } else {
          translateX.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -70 || gestureState.vx < -0.45) {
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 180,
            useNativeDriver: USE_NATIVE_DRIVER,
          }).start(() => {
            onRemove(item.id);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            friction: 7,
            useNativeDriver: USE_NATIVE_DRIVER,
          }).start();
        }
      },
    })
  ).current;

  const handleManualDelete = () => {
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 180,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(() => {
      onRemove(item.id);
    });
  };

  return (
    <View style={styles.notifSwipeContainer}>
      <TouchableOpacity
        style={styles.notifDeleteActionBg}
        activeOpacity={0.8}
        onPress={handleManualDelete}
      >
        <Ionicons name="trash" size={20} color="#FFFFFF" />
        <Text style={styles.notifDeleteActionText}>Remove</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.notifCardItem,
          item.unread && styles.notifCardItemUnread,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.notifCardInnerTouch}
          activeOpacity={0.88}
          onPress={() => onPress(item)}
        >
          <View style={styles.notifCardLeftCol}>
            <View
              style={[
                styles.notifIconCircle,
                item.category === 'doer'
                  ? styles.notifIconDoer
                  : item.category === 'task'
                  ? styles.notifIconTask
                  : item.category === 'payment'
                  ? styles.notifIconPayment
                  : styles.notifIconNearby,
              ]}
            >
              <Ionicons
                name={item.icon || 'notifications'}
                size={15}
                color={
                  item.category === 'doer'
                    ? '#1E4D2B'
                    : item.category === 'task'
                    ? '#059669'
                    : item.category === 'payment'
                    ? '#D97706'
                    : '#0D9488'
                }
              />
            </View>
          </View>

          <View style={styles.notifCardContentCol}>
            <View style={styles.notifCardTitleRow}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  flex: 1,
                }}
              >
                <Text style={styles.notifCardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              <Text style={styles.notifCardTime}>{item.time}</Text>
            </View>

            <Text style={styles.notifCardBody} numberOfLines={2}>
              {item.body}
            </Text>

            <View style={styles.notifCardBottomActionRow}>
              {item.targetScreen ? (
                <Text style={styles.notifActionLinkText}>
                  Tap to view fulfillment →
                </Text>
              ) : (
                <Text style={styles.notifSwipeHintText}>
                  ⇦ Swipe left to remove
                </Text>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {item.unread && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      onMarkRead(item.id);
                    }}
                    style={styles.notifMarkSingleReadBtn}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    accessibilityLabel="Mark read"
                  >
                    <Ionicons name="checkmark" size={12} color="#1E4D2B" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleManualDelete();
                  }}
                  style={styles.notifTrashIconBtn}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityLabel="Remove notification"
                >
                  <Ionicons name="trash-outline" size={12} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);
  const [activeTab, setActiveTab] = useState('home');
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { requests, workflowError, error, refresh, isLoading } = useSuyos();
  const { position, hasSavedLocation, locate } = useDeviceLocation();

  // Sidebar & Modal animation state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // User account state (with safe default fallback)
  const [userProfile, setUserProfile] = useState({
    name: user?.name || user?.user_metadata?.full_name || 'Juan Dela Cruz',
    email: user?.email || 'juan.delacruz@suyolink.ph',
    phone: user?.phone || '+63 917 123 4567',
    address: 'Makati City, Metro Manila',
  });
  useEffect(() => {
    if (user) {
      setUserProfile((prev) => ({
        ...prev,
        name: user.name || user.user_metadata?.full_name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState({ ...userProfile });
  const [pushNotifications, setPushNotifications] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDistance, setSelectedDistance] = useState('Any');
  const [selectedUrgency, setSelectedUrgency] = useState('All');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // MySuyo Tab Navigation & Management state (Posted, Accepted, Completed, Archived)
  const [postedSuyos, setPostedSuyos] = useState(() => INITIAL_POSTED_SUYOS);
  const [acceptedSuyos, setAcceptedSuyos] = useState(() => INITIAL_ACCEPTED_SUYOS);
  const [completedSuyos, setCompletedSuyos] = useState(() => INITIAL_COMPLETED_SUYOS);
  const [archivedSuyos, setArchivedSuyos] = useState(() => INITIAL_ARCHIVED_SUYOS);
  const [mySuyoNavTab, setMySuyoNavTab] = useState('posted'); // 'posted' | 'accepted' | 'completed' | 'archived'
  const [isMySuyoEditMode, setIsMySuyoEditMode] = useState(false);
  const [selectedMySuyoIdsToDelete, setSelectedMySuyoIdsToDelete] = useState([]);
  const [selectedSuyoContext, setSelectedSuyoContext] = useState('available'); // 'available' | 'posted' | 'accepted' | 'completed' | 'archived'
  const [selectedDoerProfile, setSelectedDoerProfile] = useState(null);
  const [isEditingSuyoModalOpen, setIsEditingSuyoModalOpen] = useState(false);
  const [editingSuyoData, setEditingSuyoData] = useState({
    id: '',
    title: '',
    details: '',
    notes: '',
    rewardAmount: 150,
    context: 'posted',
  });

  // Selected Suyo Details Modal
  const [selectedSuyo, setSelectedSuyo] = useState(null);

  // Activity Tab state (Financial ledger, digital receipts, verified proof logs)
  const [activityRecords, setActivityRecords] = useState(() => INITIAL_ACTIVITY_RECORDS);
  const [activityFilter, setActivityFilter] = useState('All'); // 'All' | 'InProgress' | 'Spending' | 'Earnings' | 'Completed'
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Favorites / Saved Suyos state
  const [favoriteSuyoIds, setFavoriteSuyoIds] = useState(['SYL-102']);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [openedFromFavorites, setOpenedFromFavorites] = useState(false);

  // Overall available suyos in Dashboard: public suyos from different users + account owner's suyos
  const availableSuyosBase = useMemo(() => {
    const fromBackend = (requests || [])
      .filter((r) => r.status === 'open' && (!r.deadline || Date.parse(r.deadline) > Date.now()))
      .map((r) => {
        const dist = position && r.latitude && r.longitude ? distanceKm(position, r) : 0.8;
        const distNum = typeof dist === 'number' ? Number(dist.toFixed(1)) : 0.8;
        const offer = formatOffer(r.offerCentavos || 0);
        const isUrgent = r.deadline && Date.parse(r.deadline) < Date.now() + 24 * 3600 * 1000;
        return {
          id: r.id,
          title: r.title,
          category: r.category || 'General',
          location: r.location || 'Nearby',
          distance: distNum,
          distanceText: distNum + ' km away',
          reward: offer,
          rewardAmount: (r.offerCentavos || 0) / 100,
          tag: isUrgent ? 'Urgent' : 'Normal',
          postedTime: 'Active now',
          createdAt: Date.parse(r.createdAt || r.deadline || Date.now()),
          due: r.deadline ? 'Due ' + new Date(r.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Due today',
          dueDate: r.deadline ? new Date(r.deadline).toLocaleDateString() : getTodayFormatted(),
          details: r.details || 'No details provided.',
          notes: r.specialInstructions || '',
          requesterName: r.requesterName || 'Community Member',
          requesterPhone: r.requesterPhone || '+63 917 000 0000',
          requesterRating: '4.9★',
          completedCount: '15 completed',
          rawRequest: r,
        };
      });

    // Owner's active posted suyos
    const ownerPosted = (postedSuyos || [])
      .filter((p) => p.status !== 'Cancelled')
      .map((p) => ({
        ...p,
        isMine: true,
        distance: 0.8,
        distanceText: p.distanceText || '0.8 km away',
        postedTime: p.formattedDate || 'Active now',
        due: p.due || 'Due today',
        dueDate: p.dueDate || getTodayFormatted(),
      }));

    // Owner's in-progress accepted suyos
    const ownerAccepted = (acceptedSuyos || []).map((a) => ({
      ...a,
      isMine: true,
      distance: 0.5,
      distanceText: a.distanceText || '0.5 km away',
      postedTime: a.formattedDate || 'In Progress',
      due: a.due || 'In Progress',
      dueDate: a.dueDate || getTodayFormatted(),
    }));

    // Public available fallback suyos from different users
    const publicSuyos = INITIAL_AVAILABLE_SUYOS.map((s) => ({
      ...s,
      isMine: false,
    }));

    // Merge: Owner's posted & accepted first, then backend requests, then public fallback without duplicate IDs
    const merged = [...ownerPosted, ...ownerAccepted, ...fromBackend];
    const seenIds = new Set(merged.map((item) => item.id));
    const uniquePublic = publicSuyos.filter((item) => !seenIds.has(item.id));

    return [...merged, ...uniquePublic];
  }, [requests, position, postedSuyos, acceptedSuyos]);

  // List of suyos favorited by the user
  const favoriteSuyos = useMemo(() => {
    return availableSuyosBase.filter((suyo) =>
      favoriteSuyoIds.includes(suyo.id)
    );
  }, [favoriteSuyoIds, availableSuyosBase]);

  // Toast feedback state
  const [toastConfig, setToastConfig] = useState(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef(null);

  const triggerToast = (message, icon = 'heart') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastConfig({ message, icon });
    Animated.spring(toastAnim, {
      toValue: 1,
      tension: 75,
      friction: 8,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

    toastTimerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(() => {
        setToastConfig(null);
      });
    }, 2800);
  };

  const toggleFavoriteSuyo = (suyo) => {
    if (!suyo) return;
    const isFav = favoriteSuyoIds.includes(suyo.id);
    if (isFav) {
      setFavoriteSuyoIds((prev) => prev.filter((id) => id !== suyo.id));
      triggerToast('Suyo removed from favorites', 'heart-dislike');
    } else {
      setFavoriteSuyoIds((prev) => [...prev, suyo.id]);
      triggerToast('Suyo saved to favorites', 'heart');
    }
  };

  const handleCloseDetailModal = () => {
    setSelectedSuyo(null);
    setSelectedSuyoContext('available');
    if (openedFromFavorites) {
      setIsFavoritesModalOpen(true);
      setOpenedFromFavorites(false);
    }
  };

  // Open Suyo detail with dynamic context resolution (separating public available suyos vs owner's suyos)
  const handleOpenSuyoDetail = (suyo, explicitContext = null) => {
    if (!suyo) return;

    if (explicitContext) {
      setSelectedSuyoContext(explicitContext);
      setSelectedSuyo(suyo);
      return;
    }

    // Dynamic context resolution for Dashboard / Urgent / Favorites
    const isPosted =
      postedSuyos.some((p) => p.id === suyo.id) ||
      (suyo.requesterName && (suyo.requesterName.includes('(You)') || suyo.requesterName === userProfile?.name));

    const isAccepted =
      acceptedSuyos.some((a) => a.id === suyo.id) ||
      Boolean(suyo.doer && (suyo.requesterName?.includes('(You)') || suyo.isAcceptedByMe));

    const isCompleted = completedSuyos.some((c) => c.id === suyo.id);
    const isArchived = archivedSuyos.some((ar) => ar.id === suyo.id);

    if (isPosted) {
      const matched = postedSuyos.find((p) => p.id === suyo.id) || suyo;
      setSelectedSuyoContext('posted');
      setSelectedSuyo(matched);
    } else if (isAccepted) {
      const matched = acceptedSuyos.find((a) => a.id === suyo.id) || suyo;
      setSelectedSuyoContext('accepted');
      setSelectedSuyo(matched);
    } else if (isCompleted) {
      const matched = completedSuyos.find((c) => c.id === suyo.id) || suyo;
      setSelectedSuyoContext('completed');
      setSelectedSuyo(matched);
    } else if (isArchived) {
      const matched = archivedSuyos.find((ar) => ar.id === suyo.id) || suyo;
      setSelectedSuyoContext('archived');
      setSelectedSuyo(matched);
    } else {
      setSelectedSuyoContext('available');
      setSelectedSuyo(suyo);
    }
  };

  // Call Action (Doer or Requester)
  const handleCallDoer = (phone, name = null) => {
    const targetName =
      name ||
      selectedSuyo?.doer?.name ||
      selectedSuyo?.requesterName ||
      DEFAULT_DOER.name;
    const rawPhone =
      phone ||
      selectedSuyo?.doer?.phone ||
      selectedSuyo?.requesterPhone ||
      DEFAULT_DOER.phone;
    const cleanNumber = (rawPhone || '').replace(/[^0-9+]/g, '');
    const telUrl = `tel:${cleanNumber}`;

    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.open) {
          window.open(telUrl, '_self');
        } else {
          Linking.openURL(telUrl).catch(() => {});
        }
      } catch (e) {
        // Fallback for browsers blocking tel protocol
      }
      triggerToast(`Calling ${targetName} (${rawPhone})...`, 'call');
      return;
    }

    Linking.canOpenURL(telUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(telUrl);
        } else {
          Alert.alert('Call', `Calling ${targetName} at ${rawPhone}`);
        }
      })
      .catch(() => {
        Alert.alert('Call', `Calling ${targetName} at ${rawPhone}`);
      });
  };

  // Activity Computations & Actions
  const filteredActivityRecords = useMemo(() => {
    let list = [...activityRecords];

    if (activityFilter === 'InProgress') {
      list = list.filter((item) => item.status === 'In Progress');
    } else if (activityFilter === 'Spending') {
      list = list.filter((item) => item.role === 'requester');
    } else if (activityFilter === 'Earnings') {
      list = list.filter((item) => item.role === 'doer');
    } else if (activityFilter === 'Completed') {
      list = list.filter((item) => item.status === 'Completed');
    }

    if (activitySearchQuery.trim()) {
      const q = activitySearchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.refNo.toLowerCase().includes(q) ||
          (item.doer?.name && item.doer.name.toLowerCase().includes(q)) ||
          (item.requesterName && item.requesterName.toLowerCase().includes(q)) ||
          item.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activityRecords, activityFilter, activitySearchQuery]);

  const activityStats = useMemo(() => {
    const totalSpent = activityRecords
      .filter((r) => r.role === 'requester' && r.status === 'Completed')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    const totalEarned = activityRecords
      .filter((r) => r.role === 'doer' && r.status === 'Completed')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    const inProgressCount = activityRecords.filter((r) => r.status === 'In Progress').length;
    const completedCount = activityRecords.filter((r) => r.status === 'Completed').length;

    return {
      totalSpent: `₱${totalSpent.toLocaleString()}`,
      totalEarned: `₱${totalEarned.toLocaleString()}`,
      inProgressCount,
      completedCount,
      timeSaved: '18.5 hrs',
    };
  }, [activityRecords]);

  const handleExportStatement = () => {
    triggerToast('Monthly activity statement (PDF) downloaded', 'download-outline');
  };

  const handleRepeatActivitySuyo = (record) => {
    const newPostedSuyo = {
      id: `POST-${Date.now().toString().slice(-4)}`,
      title: record.title,
      category: record.category,
      location: record.location,
      distanceText: '0.8 km away',
      reward: `₱${record.amount}`,
      rewardAmount: record.amount,
      tag: 'Waiting for doer',
      status: 'Open - waiting for a doer',
      createdAt: Date.now(),
      formattedDate: 'Just now',
      waitTime: 'Just posted',
      needsBoost: false,
      details: record.notes || record.title,
      requesterName: `${userProfile?.name || 'Juan Dela Cruz'} (You)`,
    };
    setPostedSuyos((prev) => [newPostedSuyo, ...prev]);
    setActiveTab('mysuyo');
    setMySuyoNavTab('posted');
    triggerToast(`Re-posted "${record.title}". Notifying couriers...`, 'bicycle');
  };

  // Favorites Selection/Delete Mode state
  const [isFavDeleteMode, setIsFavDeleteMode] = useState(false);
  const [selectedFavIdsToDelete, setSelectedFavIdsToDelete] = useState([]);

  const handleCloseFavoritesModal = () => {
    setIsFavoritesModalOpen(false);
    setIsFavDeleteMode(false);
    setSelectedFavIdsToDelete([]);
  };

  const handleToggleFavDeleteMode = () => {
    setIsFavDeleteMode((prev) => !prev);
    setSelectedFavIdsToDelete([]);
  };

  const handleToggleSelectFavToDelete = (id) => {
    setSelectedFavIdsToDelete((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmDeleteSelectedFavs = () => {
    if (selectedFavIdsToDelete.length === 0) return;
    const count = selectedFavIdsToDelete.length;
    setFavoriteSuyoIds((prev) =>
      prev.filter((id) => !selectedFavIdsToDelete.includes(id))
    );
    setSelectedFavIdsToDelete([]);
    setIsFavDeleteMode(false);
    triggerToast(
      count === 1
        ? '1 suyo removed from favorites'
        : `${count} suyos removed from favorites`,
      'heart-dislike'
    );
  };

  // Sync any newly posted backend requests into postedSuyos
  useEffect(() => {
    if (requests && requests.length > 0) {
      const userBackendRequests = requests.filter(
        (r) =>
          r.scope === 'posted' ||
          r.requesterEmail === user?.email ||
          r.requesterName === userProfile?.name
      );
      if (userBackendRequests.length > 0) {
        setPostedSuyos((prev) => {
          const prevIds = new Set(prev.map((p) => p.id));
          const newItems = userBackendRequests
            .filter((r) => !prevIds.has(r.id))
            .map((r) => ({
              id: r.id,
              title: r.title,
              category: r.category || 'General',
              location: r.location || 'Nearby',
              distanceText: '0.8 km away',
              reward: formatOffer(r.offerCentavos || 0),
              rewardAmount: (r.offerCentavos || 0) / 100,
              tag: 'Waiting for doer',
              status: 'Open - waiting for a doer',
              createdAt: Date.parse(r.createdAt || Date.now()),
              formattedDate: 'Just now',
              waitTime: 'Just posted',
              needsBoost: false,
              details: r.details || 'No details provided.',
              requesterName: r.requesterName || userProfile?.name || 'You',
            }));
          if (newItems.length === 0) return prev;
          return [...newItems, ...prev];
        });
      }
    }
  }, [requests, user?.email, userProfile?.name]);

  const handleToggleMySuyoSelect = (id) => {
    setSelectedMySuyoIdsToDelete((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmDeleteMySuyo = () => {
    if (selectedMySuyoIdsToDelete.length === 0) return;
    const count = selectedMySuyoIdsToDelete.length;
    if (mySuyoNavTab === 'posted') {
      setPostedSuyos((prev) =>
        prev.filter((item) => !selectedMySuyoIdsToDelete.includes(item.id))
      );
    } else if (mySuyoNavTab === 'accepted') {
      setAcceptedSuyos((prev) =>
        prev.filter((item) => !selectedMySuyoIdsToDelete.includes(item.id))
      );
    } else if (mySuyoNavTab === 'completed') {
      setCompletedSuyos((prev) =>
        prev.filter((item) => !selectedMySuyoIdsToDelete.includes(item.id))
      );
    } else if (mySuyoNavTab === 'archived') {
      setArchivedSuyos((prev) =>
        prev.filter((item) => !selectedMySuyoIdsToDelete.includes(item.id))
      );
    }
    setSelectedMySuyoIdsToDelete([]);
    setIsMySuyoEditMode(false);
    triggerToast(
      count === 1
        ? '1 suyo removed from history'
        : `${count} suyos removed from history`,
      'trash'
    );
  };

  // Feature: Increase / Boost Reward (Supports resetting with +0)
  const handleBoostReward = (suyoId, addAmount) => {
    setPostedSuyos((prev) =>
      prev.map((s) => {
        if (s.id === suyoId) {
          const baseAmt = Number(s.baseRewardAmount ?? s.rewardAmount ?? 150);
          const newAmt = addAmount === 0 ? baseAmt : baseAmt + addAmount;
          return {
            ...s,
            baseRewardAmount: baseAmt,
            currentBoost: addAmount,
            rewardAmount: newAmt,
            reward: `₱${newAmt}`,
            needsBoost: false,
          };
        }
        return s;
      })
    );
    if (selectedSuyo && selectedSuyo.id === suyoId) {
      const baseAmt = Number(
        selectedSuyo.baseRewardAmount ?? selectedSuyo.rewardAmount ?? 150
      );
      const newAmt = addAmount === 0 ? baseAmt : baseAmt + addAmount;
      setSelectedSuyo((prev) => ({
        ...prev,
        baseRewardAmount: baseAmt,
        currentBoost: addAmount,
        rewardAmount: newAmt,
        reward: `₱${newAmt}`,
        needsBoost: false,
      }));
    }
    if (addAmount === 0) {
      triggerToast('Reward boost reset to original amount', 'refresh');
    } else {
      triggerToast(`Reward increased by +₱${addAmount}! Couriers notified.`, 'sparkles');
    }
  };

  // Feature: Cancel Suyo
  const handleCancelSuyo = (suyoId) => {
    setPostedSuyos((prev) =>
      prev.map((s) =>
        s.id === suyoId
          ? { ...s, status: 'Cancelled', tag: 'Cancelled', needsBoost: false }
          : s
      )
    );
    if (selectedSuyo && selectedSuyo.id === suyoId) {
      setSelectedSuyo((prev) => ({
        ...prev,
        status: 'Cancelled',
        tag: 'Cancelled',
        needsBoost: false,
      }));
    }
    triggerToast('Suyo marked as cancelled', 'close-circle');
  };

  // Feature: Open Edit Suyo
  const handleOpenEditSuyo = (suyo) => {
    setEditingSuyoData({
      id: suyo.id,
      title: suyo.title || '',
      details: suyo.details || '',
      notes: suyo.notes || '',
      rewardAmount: suyo.rewardAmount || 150,
      context: selectedSuyoContext,
    });
    setIsEditingSuyoModalOpen(true);
  };

  // Feature: Save Edited Suyo
  const handleSaveEditedSuyo = () => {
    if (!editingSuyoData.title.trim()) {
      triggerToast('Title cannot be empty', 'alert-circle');
      return;
    }
    const updatedReward = `₱${Number(editingSuyoData.rewardAmount) || 150}`;
    const updateInList = (list) =>
      list.map((item) =>
        item.id === editingSuyoData.id
          ? {
              ...item,
              title: editingSuyoData.title.trim(),
              details: editingSuyoData.details.trim(),
              notes: editingSuyoData.notes.trim(),
              rewardAmount: Number(editingSuyoData.rewardAmount) || 150,
              reward: updatedReward,
            }
          : item
      );

    if (editingSuyoData.context === 'posted') {
      setPostedSuyos(updateInList);
    } else if (editingSuyoData.context === 'archived') {
      setArchivedSuyos(updateInList);
    }

    if (selectedSuyo && selectedSuyo.id === editingSuyoData.id) {
      setSelectedSuyo((prev) => ({
        ...prev,
        title: editingSuyoData.title.trim(),
        details: editingSuyoData.details.trim(),
        notes: editingSuyoData.notes.trim(),
        rewardAmount: Number(editingSuyoData.rewardAmount) || 150,
        reward: updatedReward,
      }));
    }

    setIsEditingSuyoModalOpen(false);
    triggerToast('Suyo details updated successfully', 'checkmark-circle');
  };

  // Feature: Save completed suyo to Archive for future repeat requests
  const handleSaveToArchive = (suyo) => {
    const isAlreadyArchived = archivedSuyos.some((a) => a.title === suyo.title);
    if (!isAlreadyArchived) {
      const template = {
        ...suyo,
        id: `ARCH-${Date.now().toString().slice(-4)}`,
        status: 'Archived Template',
        tag: 'Archived Template',
        formattedDate: 'Saved template',
      };
      setArchivedSuyos((prev) => [template, ...prev]);
    }
    triggerToast('Saved to Archive for future repeat requests', 'bookmark');
  };

  // Feature: Repeat request from completed or archived
  const handleRepeatRequest = (suyo) => {
    const newPostedSuyo = {
      ...suyo,
      id: `POST-${Date.now().toString().slice(-4)}`,
      status: 'Open - waiting for a doer',
      tag: 'Waiting for doer',
      formattedDate: 'Just now',
      waitTime: 'Just posted',
      needsBoost: false,
      createdAt: Date.now(),
      doer: undefined,
    };
    setPostedSuyos((prev) => [newPostedSuyo, ...prev]);
    setSelectedSuyo(null);
    setMySuyoNavTab('posted');
    triggerToast('Suyo re-posted! Couriers are now being notified.', 'bicycle');
  };

  // Functional Notifications state
  const [notifications, setNotifications] = useState([
    {
      id: 'NOTIF-1',
      title: 'Doer Assigned',
      body: 'Alex M. accepted your suyo "Drop off documents - Unit 402". Estimated arrival in 5 mins.',
      time: '5m ago',
      category: 'doer',
      icon: 'bicycle',
      unread: true,
      targetScreen: '/requester-fulfill',
    },
    {
      id: 'NOTIF-2',
      title: 'Task Accepted',
      body: 'You are now fulfilling "Buy groceries - SM Tagum". Tap to view task directions.',
      time: '25m ago',
      category: 'task',
      icon: 'cart-outline',
      unread: true,
      targetScreen: '/fulfill',
      taskParams: {
        id: 'SYL-102',
        title: 'Buy groceries - SM Tagum',
        category: 'Groceries',
        location: 'SM Tagum',
        reward: '₱150',
        requesterName: 'Maria Clarissa',
      },
    },
    {
      id: 'NOTIF-3',
      title: 'Reward Credited',
      body: '₱300 has been credited to your account for completing errand #SYL-984.',
      time: '1h ago',
      category: 'payment',
      icon: 'cash-outline',
      unread: true,
      targetScreen: null,
    },
    {
      id: 'NOTIF-4',
      title: 'New Suyo Nearby',
      body: 'An urgent errand "Prescription pickup at Mercury Drug" was posted 1.1 km away.',
      time: '3h ago',
      category: 'nearby',
      icon: 'location-outline',
      unread: false,
      targetScreen: null,
    },
  ]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('All'); // 'All' | 'Unread'

  const unreadNotificationsCount = notifications.filter((n) => n.unread).length;

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    triggerToast('Notification marked as read', 'checkmark-circle');
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    triggerToast('All notifications marked as read', 'checkmark-done');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    triggerToast('All notifications cleared', 'trash-outline');
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    triggerToast('Notification removed', 'trash-outline');
  };

  const handleTapNotification = (notif) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
    );
    setIsNotificationsModalOpen(false);

    if (notif.targetScreen === '/requester-fulfill') {
      router.push('/requester-fulfill');
    } else if (notif.targetScreen === '/fulfill') {
      router.push({
        pathname: '/fulfill',
        params: notif.taskParams || {
          id: 'SYL-102',
          title: 'Buy groceries - SM Tagum',
          category: 'Groceries',
          location: 'SM Tagum',
          reward: '₱150',
          requesterName: 'Maria Clarissa',
        },
      });
    } else if (notif.category === 'payment') {
      triggerToast('₱300 reward credited to your SuyoLink Wallet', 'cash-outline');
    } else if (notif.category === 'nearby') {
      const urgentSuyo = filteredSuyos.find((s) => s.tag === 'Urgent') || filteredSuyos[0];
      if (urgentSuyo) {
        handleOpenSuyoDetail(urgentSuyo);
      } else {
        router.push('/map');
      }
    } else {
      triggerToast(notif.title, 'notifications');
    }
  };

  // Active Suyo floating banner state (matching original single active banner)
  const [activeSuyo, setActiveSuyo] = useState({
    id: 'TRK-9842',
    trackingNumber: '#SYL-88219',
    status: 'In Progress',
    eta: 'Doer is 5 mins away',
    detail: 'Errand: Drop off documents at Unit 402',
    progress: '75%',
  });
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  const hasActiveSuyo =
    activeSuyo &&
    (activeSuyo.status === 'In Progress' ||
      activeSuyo.status === 'In Transit' ||
      activeSuyo.status === 'On Process');

  const currentDistanceKm = parseDistanceKm(selectedDistance);

  // Count active filters
  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (currentDistanceKm !== 'Any' ? 1 : 0) +
    (selectedUrgency !== 'All' ? 1 : 0);

  const isFiltering = activeFiltersCount > 0 || searchQuery.trim().length > 0;

  // Filtered & Sorted Available Suyos
  const filteredSuyos = useMemo(() => {
    let list = [...availableSuyosBase];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.details.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    // Distance filter
    if (currentDistanceKm !== 'Any') {
      list = list.filter((item) => item.distance <= currentDistanceKm);
    }

    // Urgency filter
    if (selectedUrgency !== 'All') {
      list = list.filter((item) => item.tag === selectedUrgency);
    }

    // Sort newest first
    list.sort((a, b) => b.createdAt - a.createdAt);

    return list;
  }, [searchQuery, selectedCategory, selectedDistance, selectedUrgency]);

  // Dynamic header title
  const availableHeaderTitle = useMemo(() => {
    if (!isFiltering) {
      return 'Available Suyo';
    }
    if (searchQuery.trim()) {
      return `${filteredSuyos.length} result${filteredSuyos.length === 1 ? '' : 's'} for "${searchQuery.trim()}"`;
    }
    return `Filtered Suyos (${filteredSuyos.length})`;
  }, [isFiltering, searchQuery, filteredSuyos.length]);

  const openSidebar = () => {
    setIsSidebarOpen(true);
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 220,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start(() => {
      setIsSidebarOpen(false);
    });
  };

  const toggleSection = (sectionKey) => {
    setExpandedSection((prev) => (prev === sectionKey ? null : sectionKey));
  };

  const handleSaveProfile = () => {
    setUserProfile({ ...tempProfile });
    setIsEditModalOpen(false);
    triggerToast('Profile updated successfully', 'person');
  };

  const handleIncreaseDistance = () => {
    if (currentDistanceKm === 'Any') {
      setSelectedDistance('1 km');
    } else if (currentDistanceKm < 20) {
      setSelectedDistance(`${currentDistanceKm + 1} km`);
    }
  };

  const handleDecreaseDistance = () => {
    if (currentDistanceKm === 1) {
      setSelectedDistance('Any');
    } else if (typeof currentDistanceKm === 'number' && currentDistanceKm > 1) {
      setSelectedDistance(`${currentDistanceKm - 1} km`);
    }
  };

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedDistance('Any');
    setSelectedUrgency('All');
    setSearchQuery('');
  };

  const handleResetModalFilters = () => {
    setSelectedCategory('All');
    setSelectedDistance('Any');
    setSelectedUrgency('All');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeContainer}>
      <StatusBar style="light" />

      {/* 1. FIXED TOP BAR */}
      <View style={styles.fixedTopBar}>
        <TouchableOpacity
          onPress={openSidebar}
          style={styles.headerIconButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          {/* Heart / Favorites Icon */}
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => setIsFavoritesModalOpen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Saved Favorites"
          >
            <Ionicons name="heart-outline" size={22} color="#FFFFFF" />
            {favoriteSuyoIds.length > 0 && (
              <View style={styles.unreadBadgeDot} />
            )}
          </TouchableOpacity>

          {/* Notifications Icon (Functional) */}
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => setIsNotificationsModalOpen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={`Open notifications, ${unreadNotificationsCount} unread`}
          >
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            {unreadNotificationsCount > 0 && (
              <View style={styles.headerNotifBadge}>
                <Text style={styles.headerNotifBadgeText}>
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: (hasActiveSuyo ? 140 : 85) + bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'home' && (
          <>
            {/* === HERO SECTION WITH MATCHING SCOOTER COURIER STICKER === */}
        <View style={styles.headerHeroSection}>
          <View style={styles.heroTextBlock}>
            <View style={styles.locationPill}>
              <Ionicons name="location-sharp" size={11} color="#4ADE80" />
              <Text style={styles.locationPillText}>Makati CBD</Text>
            </View>
            <Text style={styles.welcomeSubText}>WELCOME BACK</Text>
            <Text style={styles.welcomeNameText} numberOfLines={1}>
              {userProfile?.name || 'Juan Dela Cruz'}
            </Text>
            <Text style={styles.welcomeTagline}>Need an errand done today?</Text>
          </View>

          <Image
            source={require('../assets/scooter_hero_isometric.jpg')}
            style={styles.heroImageSticker}
            resizeMode="contain"
          />
        </View>

        {/* White Content Body */}
        <View style={styles.whiteContentBody}>
          {/* Search Bar + Filter Icon Row */}
          <View style={styles.searchRow}>
            <View style={styles.searchBarContainer}>
              <Ionicons
                name="search-outline"
                size={20}
                color="#7A9384"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search suyos or errands..."
                placeholderTextColor="#688676"
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Search suyos or errands"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color="#8FA497" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Icon Button Beside Search Bar */}
            <TouchableOpacity
              style={[
                styles.filterIconButton,
                activeFiltersCount > 0 && styles.filterIconButtonActive,
              ]}
              activeOpacity={0.75}
              onPress={() => setIsFilterModalOpen(true)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="options-outline"
                size={22}
                color={activeFiltersCount > 0 ? '#FFFFFF' : '#1E4D2B'}
              />
              {activeFiltersCount > 0 && (
                <View style={styles.filterActiveBadgeDot}>
                  <Text style={styles.filterActiveBadgeText}>
                    {activeFiltersCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* === AVAILABLE SUYO HEADER === */}
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.sectionHeading} numberOfLines={1}>
                {availableHeaderTitle}
              </Text>
            </View>

            {isFiltering ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={clearAllFilters}
                style={styles.clearFiltersPill}
              >
                <Ionicons name="close-circle-outline" size={13} color="#64748B" />
                <Text style={styles.clearFiltersText}>Clear all</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsFilterModalOpen(true)}
                style={styles.nearestHeaderBadge}
              >
                <Ionicons name="location-outline" size={13} color="#1E4D2B" />
                <Text style={styles.nearestHeaderText}>Nearest</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* === AVAILABLE SUYO LIST === */}
          <View style={styles.tasksList}>
            {filteredSuyos.length > 0 ? (
              filteredSuyos.map((suyo) => (
                <TouchableOpacity
                  key={suyo.id}
                  style={styles.suyoCard}
                  activeOpacity={0.88}
                  onPress={() => handleOpenSuyoDetail(suyo)}
                >
                  <View style={styles.suyoCardTopRow}>
                    <Text style={styles.suyoCardTitle} numberOfLines={2}>
                      {suyo.title}
                    </Text>
                    <Text style={styles.suyoCardReward}>{suyo.reward}</Text>
                  </View>

                  <View style={styles.suyoCardBottomRow}>
                    <Text style={styles.suyoCardDistanceSub}>
                      {suyo.distanceText} • {suyo.postedTime}
                    </Text>

                    <View
                      style={[
                        styles.suyoTagPill,
                        suyo.tag === 'Urgent'
                          ? styles.suyoTagUrgent
                          : suyo.tag === 'Due today'
                          ? styles.suyoTagToday
                          : suyo.tag === 'Normal'
                          ? styles.suyoTagNormal
                          : styles.suyoTagTomorrow,
                      ]}
                    >
                      <Text
                        style={[
                          styles.suyoTagPillText,
                          suyo.tag === 'Urgent'
                            ? styles.suyoTagUrgentText
                            : suyo.tag === 'Due today'
                            ? styles.suyoTagTodayText
                            : suyo.tag === 'Normal'
                            ? styles.suyoTagNormalText
                            : styles.suyoTagTomorrowText,
                        ]}
                      >
                        {suyo.tag}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyStateBox}>
                <Ionicons name="search" size={32} color="#8FA497" />
                <Text style={styles.emptyStateTitle}>No suyos found</Text>
                <Text style={styles.emptyStateSub}>
                  Try clearing your search or adjusting your distance and
                  category filters.
                </Text>
                <TouchableOpacity
                  style={styles.emptyResetBtn}
                  onPress={clearAllFilters}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyResetBtnText}>Clear all filters</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
          </>
        )}

        {/* === MYSUYO HUB SCREEN === */}
        {activeTab === 'mysuyo' && (
          <View style={styles.mySuyoMainWrapper}>
            {/* MySuyo Hero Banner */}
            <View style={styles.mySuyoHeroSection}>
              <View style={styles.mySuyoHeroTextCol}>
                <Text style={styles.mySuyoHeroSuper}>MY SUYO HUB</Text>
                <Text style={styles.mySuyoHeroTitle}>Requested Errands</Text>
                <Text style={styles.mySuyoHeroSub}>
                  Manage, track, boost, and repeat your requested suyos
                </Text>
              </View>
              <View style={styles.mySuyoHeroBadge}>
                <Ionicons name="receipt-outline" size={24} color="#1E4D2B" />
              </View>
            </View>

            {/* Modern Text Navigation: Posted, Accepted, Completed, Archived (Zero chunky button pills) */}
            <View style={styles.mySuyoTextNavWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mySuyoTextNavRow}
              >
                {/* 1. Posted Tab */}
                <TouchableOpacity
                  style={styles.mySuyoTextNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setMySuyoNavTab('posted');
                    setIsMySuyoEditMode(false);
                    setSelectedMySuyoIdsToDelete([]);
                  }}
                >
                  <Text
                    style={[
                      styles.mySuyoTextNavTitle,
                      mySuyoNavTab === 'posted' && styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Posted
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      mySuyoNavTab === 'posted' && styles.mySuyoTextNavCountActive,
                    ]}
                  >
                    ({postedSuyos.length})
                  </Text>
                  {mySuyoNavTab === 'posted' && (
                    <View style={styles.mySuyoTextNavUnderline} />
                  )}
                </TouchableOpacity>

                {/* 2. Accepted Tab */}
                <TouchableOpacity
                  style={styles.mySuyoTextNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setMySuyoNavTab('accepted');
                    setIsMySuyoEditMode(false);
                    setSelectedMySuyoIdsToDelete([]);
                  }}
                >
                  <Text
                    style={[
                      styles.mySuyoTextNavTitle,
                      mySuyoNavTab === 'accepted' && styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Accepted
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      mySuyoNavTab === 'accepted' && styles.mySuyoTextNavCountActive,
                    ]}
                  >
                    ({acceptedSuyos.length})
                  </Text>
                  {mySuyoNavTab === 'accepted' && (
                    <View style={styles.mySuyoTextNavUnderline} />
                  )}
                </TouchableOpacity>

                {/* 3. Completed Tab */}
                <TouchableOpacity
                  style={styles.mySuyoTextNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setMySuyoNavTab('completed');
                    setIsMySuyoEditMode(false);
                    setSelectedMySuyoIdsToDelete([]);
                  }}
                >
                  <Text
                    style={[
                      styles.mySuyoTextNavTitle,
                      mySuyoNavTab === 'completed' && styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Completed
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      mySuyoNavTab === 'completed' && styles.mySuyoTextNavCountActive,
                    ]}
                  >
                    ({completedSuyos.length})
                  </Text>
                  {mySuyoNavTab === 'completed' && (
                    <View style={styles.mySuyoTextNavUnderline} />
                  )}
                </TouchableOpacity>

                {/* 4. Archived Tab */}
                <TouchableOpacity
                  style={styles.mySuyoTextNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setMySuyoNavTab('archived');
                    setIsMySuyoEditMode(false);
                    setSelectedMySuyoIdsToDelete([]);
                  }}
                >
                  <Text
                    style={[
                      styles.mySuyoTextNavTitle,
                      mySuyoNavTab === 'archived' && styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Archived
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      mySuyoNavTab === 'archived' && styles.mySuyoTextNavCountActive,
                    ]}
                  >
                    ({archivedSuyos.length})
                  </Text>
                  {mySuyoNavTab === 'archived' && (
                    <View style={styles.mySuyoTextNavUnderline} />
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Sub-bar with title, status note, and fading text 'Edit' */}
            <View style={styles.mySuyoSubBar}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.mySuyoSubBarTitle}>
                  {mySuyoNavTab === 'posted'
                    ? 'Posted Suyos'
                    : mySuyoNavTab === 'accepted'
                    ? 'Accepted Suyos'
                    : mySuyoNavTab === 'completed'
                    ? 'Completed Suyos'
                    : 'Archived Suyos'}
                </Text>
                <Text style={styles.mySuyoSubBarSubtitle}>
                  {mySuyoNavTab === 'posted'
                    ? 'Awaiting courier acceptance · Boost reward to speed up'
                    : mySuyoNavTab === 'accepted'
                    ? 'Couriers currently fulfilling these errands'
                    : mySuyoNavTab === 'completed'
                    ? 'Successfully fulfilled errands from past to present'
                    : 'Saved templates for quick 1-tap repeating'}
                </Text>
              </View>

              {((mySuyoNavTab === 'posted'
                ? postedSuyos
                : mySuyoNavTab === 'accepted'
                ? acceptedSuyos
                : mySuyoNavTab === 'completed'
                ? completedSuyos
                : archivedSuyos).length > 0) && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {isMySuyoEditMode && (
                    <TouchableOpacity
                      onPress={() => {
                        const currentList =
                          mySuyoNavTab === 'posted'
                            ? postedSuyos
                            : mySuyoNavTab === 'accepted'
                            ? acceptedSuyos
                            : mySuyoNavTab === 'completed'
                            ? completedSuyos
                            : archivedSuyos;
                        if (selectedMySuyoIdsToDelete.length === currentList.length) {
                          setSelectedMySuyoIdsToDelete([]);
                        } else {
                          setSelectedMySuyoIdsToDelete(currentList.map((item) => item.id));
                        }
                      }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.mySuyoSelectAllText}>
                        {selectedMySuyoIdsToDelete.length ===
                        (mySuyoNavTab === 'posted'
                          ? postedSuyos
                          : mySuyoNavTab === 'accepted'
                          ? acceptedSuyos
                          : mySuyoNavTab === 'completed'
                          ? completedSuyos
                          : archivedSuyos).length
                          ? 'Deselect all'
                          : 'Select all'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      setIsMySuyoEditMode((prev) => !prev);
                      setSelectedMySuyoIdsToDelete([]);
                    }}
                    activeOpacity={0.6}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.mySuyoFadingEditText}>
                      {isMySuyoEditMode ? 'Cancel' : 'Edit'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* List of Suyos (Rendered based on selected tab) */}
            <View style={styles.mySuyoCardsList}>
              {(() => {
                const currentList =
                  mySuyoNavTab === 'posted'
                    ? postedSuyos
                    : mySuyoNavTab === 'accepted'
                    ? acceptedSuyos
                    : mySuyoNavTab === 'completed'
                    ? completedSuyos
                    : archivedSuyos;

                if (currentList.length === 0) {
                  return (
                    <View style={styles.mySuyoEmptyBox}>
                      <Ionicons
                        name={
                          mySuyoNavTab === 'posted'
                            ? 'paper-plane-outline'
                            : mySuyoNavTab === 'accepted'
                            ? 'bicycle-outline'
                            : mySuyoNavTab === 'completed'
                            ? 'ribbon-outline'
                            : 'bookmark-outline'
                        }
                        size={40}
                        color="#A3B8AC"
                      />
                      <Text style={styles.mySuyoEmptyTitle}>
                        {mySuyoNavTab === 'posted'
                          ? 'No pending posted suyos'
                          : mySuyoNavTab === 'accepted'
                          ? 'No suyos in progress'
                          : mySuyoNavTab === 'completed'
                          ? 'No completed suyos yet'
                          : 'No archived templates'}
                      </Text>
                      <Text style={styles.mySuyoEmptySub}>
                        {mySuyoNavTab === 'posted'
                          ? "All your suyos have been accepted, or you haven't posted any. Tap Post below to request an errand!"
                          : mySuyoNavTab === 'accepted'
                          ? "When a courier accepts one of your posted suyos, it will appear here so you can view the doer profile and track live progress."
                          : mySuyoNavTab === 'completed'
                          ? "Finished errands will appear here with the courier who completed them."
                          : "Save completed or frequent errands to your archive so you can repeat them with a single tap!"}
                      </Text>
                    </View>
                  );
                }

                return currentList.map((suyo) => {
                  const isSelected = selectedMySuyoIdsToDelete.includes(suyo.id);
                  return (
                    <TouchableOpacity
                      key={suyo.id}
                      style={[
                        styles.mySuyoCardItem,
                        isMySuyoEditMode && isSelected && styles.mySuyoCardItemSelected,
                      ]}
                      activeOpacity={0.88}
                      onPress={() => {
                        if (isMySuyoEditMode) {
                          handleToggleMySuyoSelect(suyo.id);
                        } else {
                          handleOpenSuyoDetail(suyo, mySuyoNavTab);
                        }
                      }}
                    >
                      {/* Top Row: Title + Reward (Green Pxxx) */}
                      <View style={styles.mySuyoCardTopRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                          {isMySuyoEditMode && (
                            <View
                              style={[
                                styles.mySuyoSelectionCircle,
                                isSelected && styles.mySuyoSelectionCircleSelected,
                              ]}
                            >
                              {isSelected && (
                                <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                              )}
                            </View>
                          )}
                          <Text style={styles.mySuyoCardTitle} numberOfLines={1}>
                            {suyo.title}
                          </Text>
                        </View>
                        <Text style={styles.mySuyoCardRewardText}>{suyo.reward}</Text>
                      </View>

                      {/* Second Row: Status & Date (Image 2 style - clean colored text, no stretched highlight) */}
                      <View style={styles.mySuyoCardSubRow}>
                        <Text
                          style={[
                            styles.mySuyoCardStatusText,
                            suyo.status === 'Cancelled'
                              ? { color: '#DC2626' }
                              : suyo.status?.includes('Completed')
                              ? { color: '#15803D' }
                              : suyo.status?.includes('In Progress')
                              ? { color: '#0284C7' }
                              : suyo.status === 'Archived Template'
                              ? { color: '#64748B' }
                              : { color: '#0369A1' },
                          ]}
                        >
                          {suyo.status}
                        </Text>
                        <Text style={styles.mySuyoCardDateDot}>·</Text>
                        <Text style={styles.mySuyoCardDateText}>
                          {suyo.formattedDate || 'Recent'}
                        </Text>
                      </View>

                      {/* Tab-Specific Feature Rows */}

                      {/* In Posted: Boost Prompt if waiting long */}
                      {mySuyoNavTab === 'posted' && suyo.needsBoost && !isMySuyoEditMode && suyo.status !== 'Cancelled' && (
                        <View style={styles.mySuyoCardBoostRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 }}>
                            <Ionicons name="sparkles" size={13} color="#059669" />
                            <Text style={styles.mySuyoCardBoostPromptText}>
                              No doer yet? Boost reward
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity
                              style={styles.mySuyoCardQuickBoostBtn}
                              activeOpacity={0.75}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleBoostReward(suyo.id, 20);
                              }}
                            >
                              <Text style={styles.mySuyoCardQuickBoostText}>+₱20</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.mySuyoCardQuickBoostBtn, styles.mySuyoCardQuickBoostBtnGreen]}
                              activeOpacity={0.75}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleBoostReward(suyo.id, 50);
                              }}
                            >
                              <Text style={[styles.mySuyoCardQuickBoostText, { color: '#FFFFFF' }]}>+₱50</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {/* In Accepted: Courier Strip */}
                      {mySuyoNavTab === 'accepted' && suyo.doer && (
                        <View style={styles.mySuyoCourierStrip}>
                          <Text style={styles.mySuyoCourierStripText} numberOfLines={1}>
                            Courier: <Text style={{ fontWeight: '700', color: '#163523' }}>{suyo.doer.name}</Text> ({suyo.doer.rating})
                          </Text>
                        </View>
                      )}

                      {/* In Completed: Courier Who Fulfilled Strip */}
                      {mySuyoNavTab === 'completed' && suyo.doer && (
                        <View style={styles.mySuyoCourierStrip}>
                          <Text style={styles.mySuyoCourierStripText} numberOfLines={1}>
                            Fulfilled by <Text style={{ fontWeight: '700', color: '#163523' }}>{suyo.doer.name}</Text> ({suyo.doer.rating})
                          </Text>
                        </View>
                      )}



                      {/* Footer Row: Location Pin */}
                      <View style={styles.mySuyoCardFooter}>
                        <View style={styles.mySuyoCardLocationRow}>
                          <Ionicons name="location-sharp" size={13} color="#0D9488" />
                          <Text style={styles.mySuyoCardLocationText} numberOfLines={1}>
                            {suyo.location}
                          </Text>
                        </View>

                        <Text style={styles.mySuyoTapDetailHint}>Tap for options →</Text>
                      </View>
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>

            {/* Bottom Edit Action Bar when in Edit Mode */}
            {isMySuyoEditMode && (
              <View style={styles.mySuyoEditFloatingBar}>
                <TouchableOpacity
                  style={styles.mySuyoCancelEditBtn}
                  onPress={() => {
                    setIsMySuyoEditMode(false);
                    setSelectedMySuyoIdsToDelete([]);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.mySuyoCancelEditText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.mySuyoConfirmDeleteBtn,
                    selectedMySuyoIdsToDelete.length === 0 &&
                      styles.mySuyoConfirmDeleteBtnDisabled,
                  ]}
                  onPress={handleConfirmDeleteMySuyo}
                  disabled={selectedMySuyoIdsToDelete.length === 0}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="trash-outline"
                    size={14}
                    color={
                      selectedMySuyoIdsToDelete.length > 0 ? '#FFFFFF' : '#8CA395'
                    }
                  />
                  <Text
                    style={[
                      styles.mySuyoConfirmDeleteBtnText,
                      selectedMySuyoIdsToDelete.length === 0 &&
                        styles.mySuyoConfirmDeleteBtnTextDisabled,
                    ]}
                  >
                    {selectedMySuyoIdsToDelete.length > 0
                      ? `Remove Selected (${selectedMySuyoIdsToDelete.length})`
                      : 'Select items to remove'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* === WALLET SCREEN (ACCEPTED SUYO EARNINGS LIST) === */}
        {(activeTab === 'wallet' || activeTab === 'activity') && (
          <View style={styles.walletMainWrapper}>
            {/* 1. Wallet Balance Hero Header */}
            <View style={styles.walletHeroCard}>
              <View style={styles.walletHeroTopRow}>
                <View style={styles.walletBadgeRow}>
                  <View style={styles.walletIconCircle}>
                    <Ionicons name="wallet" size={17} color="#1E4D2B" />
                  </View>
                  <Text style={styles.walletHeroSuper}>SUYOLINK WALLET</Text>
                </View>
                <View style={styles.walletVerifiedPill}>
                  <Ionicons name="checkmark-circle" size={13} color="#059669" />
                  <Text style={styles.walletVerifiedPillText}>Verified User</Text>
                </View>
              </View>

              <Text style={styles.walletBalanceLabel}>Total Tracked Earnings</Text>
              <Text style={styles.walletBalanceAmount}>₱1,280.00</Text>

              <View style={styles.walletSummaryRow}>
                <View style={styles.walletSummaryItem}>
                  <Text style={styles.walletSummaryCount}>{WALLET_EARNED_SUYOS.length}</Text>
                  <Text style={styles.walletSummaryLabel}>Accepted Suyos</Text>
                </View>
                <View style={styles.walletSummaryDivider} />
                <View style={styles.walletSummaryItem}>
                  <Text style={styles.walletSummaryCount}>₱183</Text>
                  <Text style={styles.walletSummaryLabel}>Avg. per Suyo</Text>
                </View>
                <View style={styles.walletSummaryDivider} />
                <View style={styles.walletSummaryItem}>
                  <Text style={styles.walletSummaryCount}>Direct</Text>
                  <Text style={styles.walletSummaryLabel}>Cash / P2P</Text>
                </View>
              </View>

              {/* Informative Note: Direct Settlement Outside App */}
              <View style={styles.walletPaymentNoticeRow}>
                <Ionicons name="call" size={13} color="#059669" />
                <Text style={styles.walletPaymentNoticeText}>
                  Payments are received directly via call & conversation with requesters outside the app.
                </Text>
              </View>
            </View>

            {/* 2. Section Header: Just the Lists */}
            <View style={styles.walletSectionHeader}>
              <View>
                <Text style={styles.walletSectionTitle}>Accepted Suyo Earnings</Text>
                <Text style={styles.walletSectionSub}>
                  Tracked rewards earned from every accepted suyo request
                </Text>
              </View>
              <View style={styles.walletCountChip}>
                <Text style={styles.walletCountChipText}>
                  {WALLET_EARNED_SUYOS.length} earned
                </Text>
              </View>
            </View>

            {/* 3. The Clean List of Earned Accepted Suyo Requests */}
            <View style={styles.walletListWrapper}>
              {WALLET_EARNED_SUYOS.map((item) => (
                <View key={item.id} style={styles.walletItemCard}>
                  <View style={styles.walletItemLeft}>
                    <View
                      style={[
                        styles.walletCategoryIconCircle,
                        item.category === 'Groceries'
                          ? { backgroundColor: '#DCFCE7' }
                          : item.category === 'Medicine'
                          ? { backgroundColor: '#F3E8FF' }
                          : item.category === 'Documents'
                          ? { backgroundColor: '#E0F2FE' }
                          : item.category === 'Queuing & Bills'
                          ? { backgroundColor: '#FEF3C7' }
                          : { backgroundColor: '#EAF4EF' },
                      ]}
                    >
                      <Ionicons
                        name={item.icon || 'receipt'}
                        size={18}
                        color={
                          item.category === 'Groceries'
                            ? '#15803D'
                            : item.category === 'Medicine'
                            ? '#7E22CE'
                            : item.category === 'Documents'
                            ? '#0369A1'
                            : item.category === 'Queuing & Bills'
                            ? '#B45309'
                            : '#1E4D2B'
                        }
                      />
                    </View>

                    <View style={styles.walletItemInfoCol}>
                      <Text style={styles.walletItemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>

                      <View style={styles.walletItemMetaRow}>
                        <Ionicons name="person-circle-outline" size={13} color="#557261" />
                        <Text style={styles.walletItemRequesterText}>
                          From:{' '}
                          <Text style={{ fontWeight: '700', color: '#163523' }}>
                            {item.requesterName}
                          </Text>
                        </Text>
                      </View>

                      <View style={styles.walletItemDateRow}>
                        <Ionicons name="time-outline" size={12} color="#8CA395" />
                        <Text style={styles.walletItemDateText}>{item.date}</Text>
                        <Text style={styles.walletItemDot}>•</Text>
                        <Ionicons name="location-outline" size={12} color="#8CA395" />
                        <Text style={styles.walletItemLocationText} numberOfLines={1}>
                          {item.location}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.walletItemRight}>
                    <Text style={styles.walletEarnedAmountText}>
                      +₱{Number(item.earnedAmount).toFixed(2)}
                    </Text>
                    <View style={styles.walletStatusChip}>
                      <Ionicons name="checkmark-circle" size={10} color="#15803D" />
                      <Text style={styles.walletStatusChipText}>{item.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ========================================================== */}
      {/* 3. POPPING MODAL: FLOATING ACTIVE SUYO PROGRESS CARD        */}
      {/* (Floats directly above navigation bar, persists on scroll)  */}
      {/* ========================================================== */}
      {hasActiveSuyo && (
        <View
          style={[
            styles.floatingActiveModalWrapper,
            { bottom: 62 + bottomInset },
            Platform.OS === 'web' ? { pointerEvents: 'box-none' } : undefined,
          ]}
          pointerEvents={Platform.OS === 'web' ? undefined : 'box-none'}
        >
          <TouchableOpacity
            style={styles.floatingActiveModalTouchable}
            activeOpacity={0.92}
            onPress={() => router.push('/requester-fulfill')}
          >
            <LinearGradient
              colors={['#E5F4EC', '#F4FAF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.floatingActiveModalGradient}
            >
              <View style={styles.floatingModalTopRow}>
                <View style={styles.floatingActiveBadge}>
                  <View style={styles.pulsingGreenDot} />
                  <Text style={styles.floatingActiveBadgeText}>ACTIVE SUYO</Text>
                </View>
                <View style={styles.floatingTrackingTag}>
                  <Ionicons
                    name="map-outline"
                    size={11.5}
                    color="#1E4D2B"
                    style={{ marginRight: 3 }}
                  />
                  <Text style={styles.floatingTrackingText}>
                    {activeSuyo.trackingNumber}
                  </Text>
                </View>
              </View>

              <View style={styles.floatingModalBodyRow}>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <Text style={styles.floatingModalTitle} numberOfLines={1}>
                    {activeSuyo.eta}
                    <Text style={styles.floatingModalSub}>
                      {' '}
                      • {activeSuyo.detail}
                    </Text>
                  </Text>
                </View>
                <View style={styles.floatingModalChevronCircle}>
                  <Ionicons name="chevron-forward" size={13} color="#1E4D2B" />
                </View>
              </View>

              <View style={styles.floatingProgressTrack}>
                <View
                  style={[
                    styles.floatingProgressFill,
                    { width: activeSuyo.progress || '75%' },
                  ]}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* 4. BOTTOM NAVIGATION BAR (Home, MySuyo, Post, Activity, Account) */}
      <View
        style={[
          styles.bottomNavContainer,
          {
            height: 60 + bottomInset,
            paddingBottom: bottomInset,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => setActiveTab('home')}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'home' ? '#1E4D2B' : '#8FA497'}
          />
          <Text
            style={[
              styles.navItemText,
              activeTab === 'home' && styles.navItemTextActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => setActiveTab('mysuyo')}
        >
          <Ionicons
            name={activeTab === 'mysuyo' ? 'bicycle' : 'bicycle-outline'}
            size={22}
            color={activeTab === 'mysuyo' ? '#1E4D2B' : '#8FA497'}
          />
          <Text
            style={[
              styles.navItemText,
              activeTab === 'mysuyo' && styles.navItemTextActive,
            ]}
          >
            MySuyo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push('/post-suyo')}
        >
          <Ionicons
            name="add-circle"
            size={24}
            color="#1E4D2B"
          />
          <Text
            style={[
              styles.navItemText,
              { color: '#1E4D2B', fontWeight: '700' },
            ]}
          >
            Post
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => setActiveTab('wallet')}
        >
          <Ionicons
            name={activeTab === 'wallet' ? 'wallet' : 'wallet-outline'}
            size={22}
            color={activeTab === 'wallet' ? '#1E4D2B' : '#8FA497'}
          />
          <Text
            style={[
              styles.navItemText,
              activeTab === 'wallet' && styles.navItemTextActive,
            ]}
          >
            Wallet
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={openSidebar}
        >
          <Ionicons
            name={activeTab === 'account' ? 'person' : 'person-outline'}
            size={22}
            color={activeTab === 'account' ? '#1E4D2B' : '#8FA497'}
          />
          <Text
            style={[
              styles.navItemText,
              activeTab === 'account' && styles.navItemTextActive,
            ]}
          >
            Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* Floating Toast Notification on Dashboard */}
      {toastConfig && !selectedSuyo && !isFavoritesModalOpen && (
        <Animated.View
          style={[
            styles.dashboardToastBubble,
            {
              bottom: (hasActiveSuyo ? 145 : 85) + bottomInset,
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons
            name={
              toastConfig.icon === 'heart'
                ? 'heart'
                : toastConfig.icon === 'heart-dislike'
                ? 'heart-dislike'
                : 'information-circle'
            }
            size={16}
            color="#27854D"
          />
          <Text style={styles.dashboardToastText}>{toastConfig.message}</Text>
        </Animated.View>
      )}

      {/* ========================================================== */}
      {/* 5. FILTER MODAL                                            */}
      {/* ========================================================== */}
      <Modal
        visible={isFilterModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.filterModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="options-outline" size={20} color="#163523" />
                <Text style={styles.modalTitle}>Filter Suyos</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#163523" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Category Pills */}
              <Text style={styles.filterSectionLabel}>Category</Text>
              <View style={styles.filterPillsWrap}>
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const config = cat === 'All' ? CATEGORY_CONFIG.All : CATEGORY_CONFIG.default;

                  if (isSelected) {
                    return (
                      <TouchableOpacity
                        key={cat}
                        activeOpacity={0.75}
                        onPress={() => setSelectedCategory(cat)}
                      >
                        <LinearGradient
                          colors={config.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[
                            styles.filterPillGradient,
                            { borderColor: config.border },
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterPillText,
                              { color: config.text, fontWeight: '700' },
                            ]}
                          >
                            {cat}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={cat}
                      style={styles.filterPill}
                      activeOpacity={0.75}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text style={styles.filterPillText}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Urgency */}
              <Text style={styles.filterSectionLabel}>Urgency</Text>
              <View style={styles.filterPillsWrap}>
                {URGENCY_OPTIONS.map((urg) => {
                  const isSelected = selectedUrgency === urg;
                  const config = URGENCY_CONFIG[urg] || URGENCY_CONFIG.Normal;

                  if (isSelected) {
                    return (
                      <TouchableOpacity
                        key={urg}
                        activeOpacity={0.75}
                        onPress={() => setSelectedUrgency(urg)}
                      >
                        <LinearGradient
                          colors={config.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[
                            styles.filterPillGradient,
                            { borderColor: config.border },
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterPillText,
                              { color: config.text, fontWeight: '700' },
                            ]}
                          >
                            {urg}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={urg}
                      style={styles.filterPill}
                      activeOpacity={0.75}
                      onPress={() => setSelectedUrgency(urg)}
                    >
                      <Text style={styles.filterPillText}>{urg}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Distance Radius */}
              <Text style={styles.filterSectionLabel}>Distance Radius</Text>
              <View style={styles.distanceStepperContainer}>
                <TouchableOpacity
                  style={[
                    styles.distanceStepperArrowBtn,
                    currentDistanceKm === 'Any' && styles.distanceStepperArrowBtnDisabled,
                  ]}
                  activeOpacity={0.7}
                  onPress={handleDecreaseDistance}
                  disabled={currentDistanceKm === 'Any'}
                >
                  <Ionicons
                    name="chevron-back"
                    size={16}
                    color={currentDistanceKm === 'Any' ? '#B8CCC0' : '#1E4D2B'}
                  />
                </TouchableOpacity>

                <View style={styles.distanceStepperDisplay}>
                  <Text style={styles.distanceStepperValueText}>
                    {currentDistanceKm === 'Any' ? 'Any distance' : `${currentDistanceKm} km`}
                  </Text>
                  <Text style={styles.distanceStepperSubText}>
                    {currentDistanceKm === 'Any' ? 'All suyos' : `0 - ${currentDistanceKm} km`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.distanceStepperArrowBtn}
                  activeOpacity={0.7}
                  onPress={handleIncreaseDistance}
                >
                  <Ionicons name="chevron-forward" size={16} color="#1E4D2B" />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.filterModalButtonsRow}>
              <TouchableOpacity
                style={styles.filterResetButton}
                onPress={handleResetModalFilters}
                activeOpacity={0.7}
              >
                <Text style={styles.filterResetButtonText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterApplyButton}
                onPress={() => setIsFilterModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.filterApplyButtonText}>Apply filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* 6. SUYO DETAILS MODAL                                      */}
      {/* ========================================================== */}
      {/* ========================================================== */}
      {/* 6. SUYO DETAILS MODAL (CONTEXT-AWARE FOR REQUESTER & DOER) */}
      {/* ========================================================== */}
      {selectedSuyo && (
        <Modal
          visible={!!selectedSuyo}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseDetailModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.suyoDetailModalCard}>
              {/* Top Meta Bar: Time & Date on Left, Action/Close on Right */}
              <View style={styles.detailTopMetaRow}>
                <View style={styles.detailTopMetaLeft}>
                  <Ionicons name="time-outline" size={13} color="#658172" />
                  <Text style={styles.detailPostedTimeText}>
                    {selectedSuyoContext === 'posted'
                      ? `Posted: ${selectedSuyo.formattedDate || 'Sep 28 · 11:20 AM'}`
                      : selectedSuyoContext === 'accepted'
                      ? `Accepted: ${selectedSuyo.formattedDate || 'Today · 4:00 PM'}`
                      : selectedSuyoContext === 'completed'
                      ? `Completed: ${selectedSuyo.formattedDate || 'Sep 20 · 3:15 PM'}`
                      : selectedSuyoContext === 'archived'
                      ? `Archived: ${selectedSuyo.formattedDate || 'Sep 18 · 9:15 AM'}`
                      : `Posted: ${selectedSuyo.formattedDate || selectedSuyo.postedTime || '10m ago'}`}
                  </Text>
                </View>

                <View style={styles.detailTopMetaRight}>

                  {selectedSuyoContext === 'available' && (
                    <TouchableOpacity
                      style={styles.detailHeartBtn}
                      activeOpacity={0.7}
                      onPress={() => toggleFavoriteSuyo(selectedSuyo)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons
                        name={
                          favoriteSuyoIds.includes(selectedSuyo.id)
                            ? 'heart'
                            : 'heart-outline'
                        }
                        size={22}
                        color={
                          favoriteSuyoIds.includes(selectedSuyo.id)
                            ? '#DC2626'
                            : '#6B8576'
                        }
                      />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.detailCloseIconBtn}
                    activeOpacity={0.7}
                    onPress={handleCloseDetailModal}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={19} color="#6B8576" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Title & Status Row: Status placed at opposite side, in line with Title */}
              <View style={styles.detailTitleAndStatusRow}>
                <Text style={styles.detailCardTitleInRow}>
                  {selectedSuyo.title}
                </Text>

                <View
                  style={[
                    styles.detailStatusPillInline,
                    selectedSuyo.status === 'Cancelled'
                      ? { backgroundColor: '#FEE2E2' }
                      : selectedSuyoContext === 'completed' || selectedSuyo.status?.includes('Completed')
                      ? { backgroundColor: '#DCFCE7' }
                      : selectedSuyoContext === 'accepted' || selectedSuyo.status?.includes('In Progress')
                      ? { backgroundColor: '#E0F2FE' }
                      : selectedSuyoContext === 'archived'
                      ? { backgroundColor: '#F1F5F9' }
                      : { backgroundColor: '#E0F2FE' },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailStatusPillInlineText,
                      selectedSuyo.status === 'Cancelled'
                        ? { color: '#DC2626' }
                        : selectedSuyoContext === 'completed' || selectedSuyo.status?.includes('Completed')
                        ? { color: '#15803D' }
                        : selectedSuyoContext === 'accepted' || selectedSuyo.status?.includes('In Progress')
                        ? { color: '#0369A1' }
                        : selectedSuyoContext === 'archived'
                        ? { color: '#475569' }
                        : { color: '#0369A1' },
                    ]}
                  >
                    {selectedSuyo.status === 'Cancelled'
                      ? 'Cancelled'
                      : selectedSuyoContext === 'completed' || selectedSuyo.status?.includes('Completed')
                      ? 'Completed'
                      : selectedSuyoContext === 'accepted' || selectedSuyo.status?.includes('In Progress')
                      ? 'Accepted'
                      : selectedSuyoContext === 'archived'
                      ? 'Archived'
                      : 'Open'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              {/* In Accepted or Completed: Show Who Accepted/Fulfilled It */}
              {selectedSuyoContext === 'accepted' || selectedSuyoContext === 'completed' ? (
                <TouchableOpacity
                  style={styles.detailDoerHighlightCard}
                  activeOpacity={0.75}
                  onPress={() => {
                    const doer = selectedSuyo.doer || DEFAULT_DOER;
                    const doerName = doer.name || 'Carlos Dalisay';
                    const doerRating = (doer.rating || '4.9★').replace(/[★*]/g, '').trim();
                    const doerPhone = doer.phone || '+63 919 720 9144';
                    const doerDone = doer.done || '42';

                    setSelectedSuyo(null);
                    router.push({
                      pathname: '/profile',
                      params: {
                        name: doerName,
                        rating: doerRating,
                        done: doerDone,
                        phone: doerPhone,
                        vehicle: doer.vehicle || 'Motorcycle',
                        isOtherUser: 'true',
                      },
                    });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="View courier profile"
                >
                  <View style={styles.detailDoerAvatar}>
                    <Text style={styles.detailDoerAvatarInitials}>
                      {getInitials(selectedSuyo.doer?.name || DEFAULT_DOER.name)}
                    </Text>
                  </View>
                  <View style={styles.detailDoerTextCol}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text style={styles.detailDoerNameText}>
                        {selectedSuyo.doer?.name || DEFAULT_DOER.name}
                      </Text>
                      {selectedSuyoContext !== 'completed' && (
                        <Ionicons name="checkmark-circle" size={14} color="#059669" />
                      )}
                    </View>
                    <Text style={styles.detailDoerMetaText}>
                      {selectedSuyoContext === 'completed'
                        ? 'Fulfilled your Suyo'
                        : 'Accepted Courier'}{' '}
                      · {selectedSuyo.doer?.rating || DEFAULT_DOER.rating} ·{' '}
                      {selectedSuyo.doer?.vehicle || DEFAULT_DOER.vehicle}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleCallDoer(
                          selectedSuyo.doer?.phone || DEFAULT_DOER.phone,
                          selectedSuyo.doer?.name || DEFAULT_DOER.name
                        );
                      }}
                    >
                      <Text style={styles.detailDoerPhoneText}>
                        📞 {selectedSuyo.doer?.phone || DEFAULT_DOER.phone}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ) : (
                /* Requester Info Row */
                <View style={styles.detailRequestorRow}>
                  <TouchableOpacity
                    style={styles.detailRequestorLeft}
                    activeOpacity={0.75}
                    onPress={() => {
                      setSelectedSuyo(null);
                      if (selectedSuyoContext === 'posted') {
                        router.push('/profile');
                      } else {
                        const reqName = selectedSuyo.requesterName || 'Maria Clarissa';
                        const reqRating = (selectedSuyo.requesterRating || '4.9★').replace(/[★*]/g, '').trim();
                        const reqDone = (selectedSuyo.completedCount || '15 completed').replace(/[^0-9]/g, '') || '15';
                        const reqPhone = selectedSuyo.requesterPhone || '0928 341 5520';

                        router.push({
                          pathname: '/profile',
                          params: {
                            name: reqName,
                            rating: reqRating,
                            done: reqDone,
                            phone: reqPhone,
                            isOtherUser: 'true',
                          },
                        });
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="View profile"
                  >
                    <View style={styles.detailAvatarCircle}>
                      <Text style={styles.detailAvatarInitials}>
                        {selectedSuyo.requesterInitials ||
                          getInitials(
                            selectedSuyo.requesterName || userProfile?.name || 'Juan Dela Cruz'
                          )}
                      </Text>
                    </View>
                    <View style={styles.detailRequestorTextCol}>
                      <Text style={styles.detailRequestorName}>
                        {selectedSuyoContext === 'posted'
                          ? `${userProfile?.name || 'Juan Dela Cruz'} (You)`
                          : selectedSuyo.requesterName || 'Maria Clarissa'}
                      </Text>
                      <Text style={styles.detailRequestorMeta}>
                        Requestor · {selectedSuyo.requesterRating || '4.9★'}  -  {(selectedSuyo.completedCount || '15 completed').replace(/[()]/g, '')}
                      </Text>
                      <View style={styles.detailRequestorPhoneRow}>
                        <Ionicons name="call" size={11} color="#6D8777" />
                        <Text style={styles.detailRequestorPhoneText}>
                          {selectedSuyoContext === 'posted'
                            ? userProfile?.phone || '+63 917 123 4567'
                            : selectedSuyo.requesterPhone || '0928 341 5520'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Add functional call button ONLY for public/available modal (matching 1st image), NOT in MySuyo modals */}
                  {selectedSuyoContext !== 'posted' &&
                    selectedSuyoContext !== 'accepted' &&
                    selectedSuyoContext !== 'completed' &&
                    selectedSuyoContext !== 'archived' && (
                      <TouchableOpacity
                        style={styles.detailRequestorCallBtn}
                        activeOpacity={0.7}
                        onPress={() =>
                          handleCallDoer(
                            selectedSuyo.requesterPhone || '0917 842 1983',
                            selectedSuyo.requesterName || 'Atty. Rafael Cruz'
                          )
                        }
                        accessibilityRole="button"
                        accessibilityLabel="Call requester"
                      >
                        <Ionicons name="call" size={18} color="#1E4D2B" />
                      </TouchableOpacity>
                    )}
                </View>
              )}

              <View style={styles.detailDivider} />

              {/* Reward & Location Stats */}
              <View style={styles.detailStatsRow}>
                <View style={styles.detailStatCol}>
                  <Text style={styles.detailStatLabel}>REWARD</Text>
                  <Text style={styles.detailRewardAmount}>
                    {selectedSuyo.rewardAmount
                      ? `₱${Number(selectedSuyo.rewardAmount).toFixed(2)}`
                      : selectedSuyo.reward && selectedSuyo.reward.startsWith('₱')
                      ? `${selectedSuyo.reward}.00`
                      : '₱150.00'}
                  </Text>
                </View>

                <View style={styles.detailStatCol}>
                  <Text style={styles.detailStatLabel}>LOCATION</Text>
                  <View style={styles.detailLocationRow}>
                    <Ionicons name="location-sharp" size={17} color="#0D9488" />
                    <Text style={styles.detailLocationName} numberOfLines={1}>
                      {selectedSuyo.location || 'SM Tagum'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.detailTaskHeading}>Task Description</Text>
              <Text style={styles.detailTaskBody}>
                {selectedSuyo.details}
                {selectedSuyo.notes ? ` ${selectedSuyo.notes}` : ''}
              </Text>

              {/* FEATURE: Prompt to Increase Reward if Waiting Long in Posted Nav */}
              {selectedSuyoContext === 'posted' && selectedSuyo.status !== 'Cancelled' && (
                <View style={styles.detailBoostCard}>
                  <View style={styles.detailBoostHeader}>
                    <View style={styles.detailBoostIconBox}>
                      <Ionicons name="sparkles" size={15} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailBoostTitle}>No one accepting yet?</Text>
                      <Text style={styles.detailBoostSubtitle}>
                        Boost your reward to get accepted faster by nearby doers:
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailBoostButtonsRow}>
                    <TouchableOpacity
                      style={[
                        styles.detailBoostChip,
                        selectedSuyo.currentBoost === 0 && styles.detailBoostChipGreen,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => handleBoostReward(selectedSuyo.id, 0)}
                    >
                      <Text
                        style={[
                          styles.detailBoostChipText,
                          selectedSuyo.currentBoost === 0 && { color: '#FFFFFF' },
                        ]}
                      >
                        +₱0
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.detailBoostChip,
                        selectedSuyo.currentBoost === 20 && styles.detailBoostChipGreen,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => handleBoostReward(selectedSuyo.id, 20)}
                    >
                      <Text
                        style={[
                          styles.detailBoostChipText,
                          selectedSuyo.currentBoost === 20 && { color: '#FFFFFF' },
                        ]}
                      >
                        +₱20
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.detailBoostChip,
                        selectedSuyo.currentBoost === 50 && styles.detailBoostChipGreen,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => handleBoostReward(selectedSuyo.id, 50)}
                    >
                      <Text
                        style={[
                          styles.detailBoostChipText,
                          selectedSuyo.currentBoost === 50 && { color: '#FFFFFF' },
                        ]}
                      >
                        +₱50
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.detailBoostChip,
                        selectedSuyo.currentBoost === 100 && styles.detailBoostChipGreen,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => handleBoostReward(selectedSuyo.id, 100)}
                    >
                      <Text
                        style={[
                          styles.detailBoostChipText,
                          selectedSuyo.currentBoost === 100 && { color: '#FFFFFF' },
                        ]}
                      >
                        +₱100
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}



              {/* Dynamic Action Buttons Row (Context-Specific) */}
              <View style={styles.detailActionButtonsRow}>
                {/* POSTED NAV BUTTONS (Edit, Cancel, or Re-post) */}
                {selectedSuyoContext === 'posted' && (
                  selectedSuyo.status !== 'Cancelled' ? (
                    <>
                      <TouchableOpacity
                        style={styles.detailEditSuyoBtn}
                        onPress={() => handleOpenEditSuyo(selectedSuyo)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="pencil" size={15} color="#163523" />
                        <Text style={styles.detailEditSuyoBtnText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.detailCancelSuyoBtn}
                        onPress={() => handleCancelSuyo(selectedSuyo.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close-circle-outline" size={15} color="#DC2626" />
                        <Text style={styles.detailCancelSuyoBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.detailPrimaryActionBtn}
                      onPress={() => handleRepeatRequest(selectedSuyo)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh" size={16} color="#FFFFFF" />
                      <Text style={styles.detailPrimaryActionBtnText}>Re-post Suyo</Text>
                    </TouchableOpacity>
                  )
                )}

                {/* ACCEPTED NAV BUTTONS (Call Doer & Track Live) */}
                {selectedSuyoContext === 'accepted' && (
                  <>
                    <TouchableOpacity
                      style={styles.detailCallDoerBtn}
                      onPress={() => handleCallDoer(selectedSuyo.doer?.phone || DEFAULT_DOER.phone)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call" size={15} color="#163523" />
                      <Text style={styles.detailCallDoerBtnText}>Call Doer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailTrackCourierBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        handleCloseDetailModal();
                        router.push({
                          pathname: '/requester-fulfill',
                          params: {
                            id: selectedSuyo.id,
                            title: selectedSuyo.title,
                            doerName: selectedSuyo.doer?.name || DEFAULT_DOER.name,
                            doerPhone: selectedSuyo.doer?.phone || DEFAULT_DOER.phone,
                          },
                        });
                      }}
                    >
                      <Ionicons name="navigate" size={16} color="#FFFFFF" />
                      <Text style={styles.detailTrackCourierBtnText}>Track</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* COMPLETED NAV BUTTONS (Save to Archive, Repeat Suyo) */}
                {selectedSuyoContext === 'completed' && (
                  <>
                    <TouchableOpacity
                      style={styles.detailArchiveSuyoBtn}
                      onPress={() => handleSaveToArchive(selectedSuyo)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="bookmark-outline" size={15} color="#163523" />
                      <Text style={styles.detailArchiveSuyoBtnText}>Archive</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailRepeatSuyoBtn}
                      onPress={() => handleRepeatRequest(selectedSuyo)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh" size={15} color="#FFFFFF" />
                      <Text style={styles.detailRepeatSuyoBtnText}>Repeat Suyo</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* ARCHIVED NAV BUTTONS (Edit Template, Repeat Request) */}
                {selectedSuyoContext === 'archived' && (
                  <>
                    <TouchableOpacity
                      style={styles.detailEditSuyoBtn}
                      onPress={() => handleOpenEditSuyo(selectedSuyo)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="pencil" size={15} color="#163523" />
                      <Text style={styles.detailEditSuyoBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailRepeatSuyoBtn}
                      onPress={() => handleRepeatRequest(selectedSuyo)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="paper-plane" size={15} color="#FFFFFF" />
                      <Text style={styles.detailRepeatSuyoBtnText}>Post Suyo</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* AVAILABLE / EXPLORE FEED BUTTON (Keep Fulfill for Couriers) */}
                {selectedSuyoContext === 'available' && (
                  <TouchableOpacity
                    style={styles.detailFulfillBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      const taskToFulfill = selectedSuyo;
                      setSelectedSuyo(null);
                      setOpenedFromFavorites(false);
                      router.push({
                        pathname: '/fulfill',
                        params: {
                          id: taskToFulfill?.id || 'SYL-102',
                          title: taskToFulfill?.title || 'Quick Grocery Delivery (5 items)',
                          category: taskToFulfill?.category || 'Groceries',
                          location: taskToFulfill?.location || 'SM Tagum',
                          distanceText: taskToFulfill?.distanceText || '0.8 km away',
                          reward: taskToFulfill?.reward || '₱150',
                          requesterName: taskToFulfill?.requesterName || 'Maria Santos',
                          requesterLocation: taskToFulfill?.location || 'Quezon City',
                          requesterPhone: taskToFulfill?.requesterPhone || '09564781552',
                          details: taskToFulfill?.details || 'Grocery delivery items',
                        },
                      });
                    }}
                  >
                    <Ionicons name="bicycle" size={18} color="#FFFFFF" />
                    <Text style={styles.detailFulfillBtnText}>Fulfill Suyo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ========================================================== */}
      {/* 6B. DOER PROFILE MODAL (VIEW COURIER DETAILS)              */}
      {/* ========================================================== */}
      {selectedDoerProfile && (
        <Modal
          visible={!!selectedDoerProfile}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedDoerProfile(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.doerProfileModalCard}>
              {/* Header */}
              <View style={styles.doerProfileHeader}>
                <Text style={styles.doerProfileHeaderTitle}>Doer Profile</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedDoerProfile(null)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color="#163523" />
                </TouchableOpacity>
              </View>

              {/* Profile Hero */}
              <View style={styles.doerProfileHero}>
                <View style={styles.doerProfileAvatarCircle}>
                  <Text style={styles.doerProfileAvatarInitials}>
                    {getInitials(selectedDoerProfile.name)}
                  </Text>
                  <View style={styles.doerVerifiedBadge}>
                    <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.doerProfileName}>{selectedDoerProfile.name}</Text>
                <View style={styles.doerVerifiedTag}>
                  <Ionicons name="checkmark-circle" size={12} color="#059669" />
                  <Text style={styles.doerVerifiedTagText}>Verified Courier & Doer</Text>
                </View>
                <Text style={styles.doerProfileRating}>
                  ⭐ {selectedDoerProfile.rating || '4.9★'} · {selectedDoerProfile.completedCount || '128 suyos delivered'}
                </Text>
              </View>

              {/* Stats Grid */}
              <View style={styles.doerStatsGrid}>
                <View style={styles.doerStatItem}>
                  <Text style={styles.doerStatValue}>
                    {selectedDoerProfile.completedCount?.split(' ')[0] || '128'}
                  </Text>
                  <Text style={styles.doerStatLabel}>Completed</Text>
                </View>
                <View style={styles.doerStatItem}>
                  <Text style={styles.doerStatValue}>99.4%</Text>
                  <Text style={styles.doerStatLabel}>On-Time</Text>
                </View>
                <View style={styles.doerStatItem}>
                  <Text style={styles.doerStatValue}>100%</Text>
                  <Text style={styles.doerStatLabel}>Reliable</Text>
                </View>
              </View>

              {/* Details List */}
              <View style={styles.doerInfoList}>
                <View style={styles.doerInfoRow}>
                  <Ionicons name="bicycle" size={15} color="#1E4D2B" />
                  <Text style={styles.doerInfoLabel}>Transport:</Text>
                  <Text style={styles.doerInfoValue}>{selectedDoerProfile.vehicle || 'Motorcycle'}</Text>
                </View>
                <View style={styles.doerInfoRow}>
                  <Ionicons name="call" size={15} color="#1E4D2B" />
                  <Text style={styles.doerInfoLabel}>Contact:</Text>
                  <Text style={styles.doerInfoValue}>{selectedDoerProfile.phone || '+63 917 555 0192'}</Text>
                </View>
                <View style={styles.doerInfoRow}>
                  <Ionicons name="calendar-outline" size={15} color="#1E4D2B" />
                  <Text style={styles.doerInfoLabel}>Joined:</Text>
                  <Text style={styles.doerInfoValue}>{selectedDoerProfile.joinedDate || 'March 2023'}</Text>
                </View>
              </View>

              {/* Bio snippet */}
              <Text style={styles.doerBioText}>
                "{selectedDoerProfile.bio || 'Reliable and fast delivery courier in Tagum and Davao area. Careful with groceries and delicate items.'}"
              </Text>

              {/* Actions */}
              <View style={styles.doerProfileActionsRow}>
                <TouchableOpacity
                  style={styles.doerProfileCallBtn}
                  activeOpacity={0.8}
                  onPress={() => triggerToast(`Calling ${selectedDoerProfile.name}...`, 'call')}
                >
                  <Ionicons name="call" size={15} color="#FFFFFF" />
                  <Text style={styles.doerProfileCallBtnText}>Call Doer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.doerProfileMsgBtn}
                  activeOpacity={0.8}
                  onPress={() => triggerToast(`Opening chat with ${selectedDoerProfile.name}...`, 'chatbubble-ellipses')}
                >
                  <Ionicons name="chatbubble-ellipses" size={15} color="#1E4D2B" />
                  <Text style={styles.doerProfileMsgBtnText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ========================================================== */}
      {/* 6C. EDIT SUYO MODAL                                        */}
      {/* ========================================================== */}
      <Modal
        visible={isEditingSuyoModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditingSuyoModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.editSuyoModalCard}>
            <View style={styles.editSuyoHeader}>
              <Text style={styles.editSuyoHeaderTitle}>Edit Suyo Details</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsEditingSuyoModalOpen(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#163523" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <Text style={styles.editSuyoInputLabel}>Title</Text>
              <TextInput
                style={styles.editSuyoTextInput}
                value={editingSuyoData.title}
                onChangeText={(text) => setEditingSuyoData((prev) => ({ ...prev, title: text }))}
                placeholder="e.g. Buy groceries at SM Tagum"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.editSuyoInputLabel}>Reward Offer (₱)</Text>
              <View style={styles.editSuyoRewardRow}>
                <TextInput
                  style={[styles.editSuyoTextInput, { flex: 1, marginBottom: 0 }]}
                  value={String(editingSuyoData.rewardAmount)}
                  onChangeText={(text) =>
                    setEditingSuyoData((prev) => ({
                      ...prev,
                      rewardAmount: text.replace(/[^0-9]/g, ''),
                    }))
                  }
                  keyboardType="numeric"
                  placeholder="150"
                  placeholderTextColor="#94A3B8"
                />
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={styles.editSuyoQuickAddPill}
                    activeOpacity={0.75}
                    onPress={() =>
                      setEditingSuyoData((prev) => ({
                        ...prev,
                        rewardAmount: Number(prev.rewardAmount || 0) + 20,
                      }))
                    }
                  >
                    <Text style={styles.editSuyoQuickAddText}>+₱20</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editSuyoQuickAddPill}
                    activeOpacity={0.75}
                    onPress={() =>
                      setEditingSuyoData((prev) => ({
                        ...prev,
                        rewardAmount: Number(prev.rewardAmount || 0) + 50,
                      }))
                    }
                  >
                    <Text style={styles.editSuyoQuickAddText}>+₱50</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.editSuyoInputLabel}>Task Description</Text>
              <TextInput
                style={[styles.editSuyoTextInput, styles.editSuyoTextArea]}
                value={editingSuyoData.details}
                onChangeText={(text) => setEditingSuyoData((prev) => ({ ...prev, details: text }))}
                multiline={true}
                numberOfLines={3}
                placeholder="Detailed task description..."
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.editSuyoInputLabel}>Special Notes / Instructions (Optional)</Text>
              <TextInput
                style={[styles.editSuyoTextInput, styles.editSuyoTextArea]}
                value={editingSuyoData.notes}
                onChangeText={(text) => setEditingSuyoData((prev) => ({ ...prev, notes: text }))}
                multiline={true}
                numberOfLines={2}
                placeholder="e.g. Please ask for the receipt"
                placeholderTextColor="#94A3B8"
              />
            </ScrollView>

            <View style={styles.editSuyoActionsRow}>
              <TouchableOpacity
                style={styles.editSuyoCancelBtn}
                onPress={() => setIsEditingSuyoModalOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.editSuyoCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editSuyoSaveBtn}
                onPress={handleSaveEditedSuyo}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-sharp" size={16} color="#FFFFFF" />
                <Text style={styles.editSuyoSaveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* 7. FAVORITES SUYOS MODAL                                   */}
      {/* ========================================================== */}
      <Modal
        visible={isFavoritesModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseFavoritesModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.favoritesModalCard}>
            <View style={styles.favoritesModalHeader}>
              <View style={styles.favoritesTitleRow}>
                <Text style={styles.favoritesModalTitle}>
                  {isFavDeleteMode ? 'Select to Remove' : 'Saved Favorites'}
                </Text>
                {favoriteSuyos.length > 0 && (
                  <View
                    style={[
                      styles.favoritesCountPill,
                      isFavDeleteMode && { backgroundColor: '#FEE2E2' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.favoritesCountText,
                        isFavDeleteMode && { color: '#DC2626' },
                      ]}
                    >
                      {isFavDeleteMode
                        ? `${selectedFavIdsToDelete.length} selected`
                        : favoriteSuyos.length}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={handleCloseFavoritesModal}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#163523" />
              </TouchableOpacity>
            </View>

            {/* Sub-header row with fading text 'Edit' */}
            <View style={styles.favSubHeaderRow}>
              <Text style={styles.favoritesModalSub}>
                {isFavDeleteMode
                  ? 'Tap items to select what to remove:'
                  : "Suyos you've saved to review or fulfill later"}
              </Text>

              {favoriteSuyos.length > 0 && (
                <View style={styles.favSubHeaderActions}>
                  {isFavDeleteMode && favoriteSuyos.length > 1 && (
                    <TouchableOpacity
                      onPress={() => {
                        if (selectedFavIdsToDelete.length === favoriteSuyos.length) {
                          setSelectedFavIdsToDelete([]);
                        } else {
                          setSelectedFavIdsToDelete(favoriteSuyos.map((s) => s.id));
                        }
                      }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.favSelectAllText}>
                        {selectedFavIdsToDelete.length === favoriteSuyos.length
                          ? 'Deselect all'
                          : 'Select all'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={handleToggleFavDeleteMode}
                    activeOpacity={0.6}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.favFadingEditText}>
                      {isFavDeleteMode ? 'Cancel' : 'Edit'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {toastConfig && (
              <View style={styles.favModalToast}>
                <Ionicons
                  name={toastConfig.icon === 'heart-dislike' ? 'trash' : 'heart'}
                  size={12}
                  color="#DC2626"
                />
                <Text style={styles.favModalToastText}>{toastConfig.message}</Text>
              </View>
            )}

            {favoriteSuyos.length > 0 ? (
              <ScrollView
                style={styles.favoritesScrollList}
                contentContainerStyle={{ paddingBottom: 4 }}
                showsVerticalScrollIndicator={false}
              >
                {favoriteSuyos.map((suyo) => {
                  const isSelected = selectedFavIdsToDelete.includes(suyo.id);
                  return (
                    <TouchableOpacity
                      key={suyo.id}
                      style={[
                        styles.favCardItem,
                        isFavDeleteMode && isSelected && styles.favCardItemSelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (isFavDeleteMode) {
                          handleToggleSelectFavToDelete(suyo.id);
                        } else {
                          setOpenedFromFavorites(true);
                          setIsFavoritesModalOpen(false);
                          handleOpenSuyoDetail(suyo);
                        }
                      }}
                    >
                      <View style={styles.favCardTopRow}>
                        {isFavDeleteMode && (
                          <View
                            style={[
                              styles.favSelectionCircle,
                              isSelected && styles.favSelectionCircleSelected,
                            ]}
                          >
                            {isSelected && (
                              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                            )}
                          </View>
                        )}

                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.favCardTitle} numberOfLines={2}>
                            {suyo.title}
                          </Text>
                          <Text style={styles.favCardLocation}>
                            <Ionicons name="location-sharp" size={10.5} color="#0D9488" />{' '}
                            {suyo.location || 'Quezon City'} • {suyo.distanceText || '0.8 km away'}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                          <Text style={styles.favCardReward}>{suyo.reward}</Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.favCardBottomRow,
                          isFavDeleteMode && { paddingLeft: 25 },
                        ]}
                      >
                        <View style={styles.favCardRequestorRow}>
                          <View style={styles.favAvatarCircle}>
                            <Text style={styles.favAvatarInitials}>
                              {suyo.requesterInitials ||
                                getInitials(suyo.requesterName || 'Maria Clarissa')}
                            </Text>
                          </View>
                          <Text style={styles.favCardRequestorName}>
                            {suyo.requesterName || 'Maria Clarissa'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.favTagPill,
                            suyo.tag === 'Urgent'
                              ? styles.favTagUrgent
                              : suyo.tag === 'Due today'
                              ? styles.favTagToday
                              : suyo.tag === 'Normal'
                              ? styles.favTagNormal
                              : styles.favTagTomorrow,
                          ]}
                        >
                          <Text
                            style={[
                              styles.favTagPillText,
                              suyo.tag === 'Urgent'
                                ? styles.favTagUrgentText
                                : suyo.tag === 'Due today'
                                ? styles.favTagTodayText
                                : suyo.tag === 'Normal'
                                ? styles.favTagNormalText
                                : styles.favTagTomorrowText,
                            ]}
                          >
                            {suyo.tag}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.favEmptyBox}>
                <Ionicons name="bookmark-outline" size={36} color="#A3B8AC" />
                <Text style={styles.favEmptyTitle}>No saved suyos yet</Text>
                <Text style={styles.favEmptySub}>
                  Tap the heart icon on any suyo to save it here for later.
                </Text>
              </View>
            )}

            {isFavDeleteMode ? (
              <View style={styles.favDeleteActionsRow}>
                <TouchableOpacity
                  style={styles.favCancelBottomBtn}
                  onPress={handleToggleFavDeleteMode}
                  activeOpacity={0.7}
                >
                  <Text style={styles.favCancelBottomBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.favConfirmDeleteBtn,
                    selectedFavIdsToDelete.length === 0 &&
                      styles.favConfirmDeleteBtnDisabled,
                  ]}
                  onPress={handleConfirmDeleteSelectedFavs}
                  disabled={selectedFavIdsToDelete.length === 0}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="trash-outline"
                    size={13.5}
                    color={
                      selectedFavIdsToDelete.length > 0 ? '#FFFFFF' : '#8CA395'
                    }
                  />
                  <Text
                    style={[
                      styles.favConfirmDeleteBtnText,
                      selectedFavIdsToDelete.length === 0 &&
                        styles.favConfirmDeleteBtnTextDisabled,
                    ]}
                  >
                    {selectedFavIdsToDelete.length > 0
                      ? `Remove Selected (${selectedFavIdsToDelete.length})`
                      : 'Select to remove'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.favCloseBottomBtn}
                onPress={handleCloseFavoritesModal}
                activeOpacity={0.7}
              >
                <Text style={styles.favCloseBottomBtnText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* 7.5 FUNCTIONAL NOTIFICATIONS INBOX MODAL                   */}
      {/* ========================================================== */}
      <Modal
        visible={isNotificationsModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsNotificationsModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.notificationsModalCard}>
            {/* Header */}
            <View style={styles.notifModalHeader}>
              <View style={styles.notifTitleRow}>
                <Ionicons name="notifications" size={20} color="#1E4D2B" />
                <Text style={styles.notifModalTitle}>Notifications</Text>
                {unreadNotificationsCount > 0 && (
                  <View style={styles.notifCountPill}>
                    <Text style={styles.notifCountText}>
                      {unreadNotificationsCount} new
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setIsNotificationsModalOpen(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#163523" />
              </TouchableOpacity>
            </View>

            {/* Quick Actions & Filter Row */}
            <View style={styles.notifTopActionsRow}>
              <View style={styles.notifFilterPillsWrap}>
                <TouchableOpacity
                  style={[
                    styles.notifFilterPill,
                    notificationFilter === 'All' && styles.notifFilterPillActive,
                  ]}
                  onPress={() => setNotificationFilter('All')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.notifFilterPillText,
                      notificationFilter === 'All' && styles.notifFilterPillTextActive,
                    ]}
                  >
                    All ({notifications.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.notifFilterPill,
                    notificationFilter === 'Unread' && styles.notifFilterPillActive,
                  ]}
                  onPress={() => setNotificationFilter('Unread')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.notifFilterPillText,
                      notificationFilter === 'Unread' && styles.notifFilterPillTextActive,
                    ]}
                  >
                    Unread ({unreadNotificationsCount})
                  </Text>
                </TouchableOpacity>
              </View>

              {unreadNotificationsCount > 0 && (
                <TouchableOpacity
                  onPress={markAllNotificationsRead}
                  style={styles.notifMarkAllReadBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-done" size={14} color="#1E4D2B" />
                  <Text style={styles.notifMarkAllReadText}>Mark read</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Notifications List */}
            {notifications.filter((n) =>
              notificationFilter === 'Unread' ? n.unread : true
            ).length > 0 ? (
              <ScrollView
                style={styles.notifScrollList}
                contentContainerStyle={{ paddingBottom: 6 }}
                showsVerticalScrollIndicator={false}
              >
                {notifications
                  .filter((n) =>
                    notificationFilter === 'Unread' ? n.unread : true
                  )
                  .map((item) => (
                    <SwipeableNotificationItem
                      key={item.id}
                      item={item}
                      onPress={handleTapNotification}
                      onMarkRead={markNotificationRead}
                      onRemove={removeNotification}
                    />
                  ))}
              </ScrollView>
            ) : (
              <View style={styles.notifEmptyBox}>
                <Ionicons
                  name="notifications-off-outline"
                  size={46}
                  color="#A3B8AC"
                />
                <Text style={styles.notifEmptyTitle}>
                  {notificationFilter === 'Unread'
                    ? 'No unread notifications'
                    : 'No notifications'}
                </Text>
                <Text style={styles.notifEmptySub}>
                  {notificationFilter === 'Unread'
                    ? 'You are all caught up with your errand updates and rewards.'
                    : 'Important activity, doer arrivals, and reward credits will appear here.'}
                </Text>
              </View>
            )}

            {/* Bottom Actions */}
            <View style={styles.notifModalBottomRow}>
              {notifications.length > 0 && (
                <TouchableOpacity
                  style={styles.notifClearBtn}
                  onPress={clearAllNotifications}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={15} color="#64748B" />
                  <Text style={styles.notifClearBtnText}>Clear All</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.notifDoneBtn}
                onPress={() => setIsNotificationsModalOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.notifDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* 7. DIGITAL E-RECEIPT MODAL (Verified Proof & Cost Breakdown) */}
      {/* ========================================================== */}
      <Modal
        visible={Boolean(selectedReceipt)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.receiptModalCard}>
            {/* Header */}
            <View style={styles.receiptModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.receiptHeaderBadge}>
                  <Ionicons name="checkmark-done-circle" size={18} color="#15803D" />
                </View>
                <Text style={styles.receiptModalHeaderTitle}>Official E-Receipt</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedReceipt(null)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#163523" />
              </TouchableOpacity>
            </View>

            {selectedReceipt && (
              <ScrollView style={styles.receiptScrollContent} showsVerticalScrollIndicator={false}>
                {/* Ticket Body */}
                <View style={styles.receiptTicketBox}>
                  <Text style={styles.receiptBrandTitle}>SUYOLINK PHILIPPINES</Text>
                  <Text style={styles.receiptBrandTag}>Community Errand & Courier Platform</Text>
                  <Text style={styles.receiptRefDisplay}>{selectedReceipt.refNo}</Text>

                  <View style={styles.receiptDashedLine} />

                  {/* General Info */}
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Transaction Date:</Text>
                    <Text style={styles.receiptValue}>{selectedReceipt.date}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Status:</Text>
                    <Text style={[styles.receiptValue, { color: '#15803D', fontWeight: '700' }]}>
                      {selectedReceipt.status} · Verified
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Category:</Text>
                    <Text style={styles.receiptValue}>{selectedReceipt.category}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Errand / Task:</Text>
                    <Text style={[styles.receiptValue, { flex: 1, textAlign: 'right' }]}>
                      {selectedReceipt.title}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Location:</Text>
                    <Text style={styles.receiptValue}>{selectedReceipt.location}</Text>
                  </View>

                  <View style={styles.receiptDashedLine} />

                  {/* Personnel */}
                  {selectedReceipt.doer && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Assigned Courier:</Text>
                      <Text style={styles.receiptValue}>
                        {selectedReceipt.doer.name} ({selectedReceipt.doer.rating})
                      </Text>
                    </View>
                  )}
                  {selectedReceipt.requesterName && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Requester:</Text>
                      <Text style={styles.receiptValue}>{selectedReceipt.requesterName}</Text>
                    </View>
                  )}
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Payment Method:</Text>
                    <Text style={styles.receiptValue}>{selectedReceipt.paymentMethod}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Payment Ref #:</Text>
                    <Text style={styles.receiptValue}>{selectedReceipt.paymentRef}</Text>
                  </View>

                  <View style={styles.receiptDashedLine} />

                  {/* Financial Breakdown */}
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Base Errand Reward:</Text>
                    <Text style={styles.receiptValue}>₱{selectedReceipt.amount.toFixed(2)}</Text>
                  </View>
                  {selectedReceipt.platformFee > 0 && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Platform Convenience Fee:</Text>
                      <Text style={styles.receiptValue}>₱{selectedReceipt.platformFee.toFixed(2)}</Text>
                    </View>
                  )}

                  <View style={styles.receiptTotalRow}>
                    <Text style={styles.receiptTotalLabel}>Total Amount:</Text>
                    <Text style={styles.receiptTotalValue}>₱{selectedReceipt.totalAmount.toFixed(2)}</Text>
                  </View>

                  {/* Proof Badge */}
                  <View style={styles.receiptProofBox}>
                    <Ionicons name="shield-checkmark" size={17} color="#059669" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.receiptProofTitle}>Proof of Delivery Verified</Text>
                      <Text style={styles.receiptProofSub}>
                        {selectedReceipt.proofDetails ||
                          'Cryptographically stamped photo & GPS handover verified by SuyoLink.'}
                      </Text>
                    </View>
                  </View>

                  {/* Barcode Simulator */}
                  <View style={styles.receiptBarcodeBox}>
                    <View style={styles.receiptBarcodeBars} />
                    <Text style={styles.receiptBarcodeText}>* {selectedReceipt.refNo} *</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.receiptActionsRow}>
                  <TouchableOpacity
                    style={styles.receiptShareActionBtn}
                    onPress={() => {
                      triggerToast('E-Receipt downloaded & saved to device', 'download-outline');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="share-social-outline" size={15} color="#163523" />
                    <Text style={styles.receiptShareActionBtnText}>Save / Share Receipt</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.receiptCloseActionBtn}
                    onPress={() => setSelectedReceipt(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.receiptCloseActionBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* 8. SIDEBAR DRAWER                                          */}
      {/* ========================================================== */}
      {isSidebarOpen && (
        <Animated.View
          style={[styles.sidebarBackdrop, { opacity: backdropAnim }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeSidebar}
          />
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.sidebarDrawer,
          {
            width: SIDEBAR_WIDTH,
            transform: [{ translateX: sidebarAnim }],
          },
        ]}
      >
        <SafeAreaView edges={['top', 'bottom']} style={styles.sidebarSafeArea}>
          <View style={styles.sidebarHeader}>
            <View style={styles.sidebarBrandRow}>
              <View style={styles.sidebarLogoCircle}>
                <Ionicons name="paper-plane" size={16} color="#1E4D2B" />
              </View>
              <Text style={styles.sidebarBrandTitle}>SuyoLink</Text>
            </View>
            <TouchableOpacity
              onPress={closeSidebar}
              style={styles.sidebarCloseButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#163523" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.sidebarScroll}
            contentContainerStyle={styles.sidebarScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sidebarAccountSingleLine}>
              <View style={styles.verifiedAvatarWrapper}>
                <View style={styles.verifiedAvatarCircle}>
                  <Ionicons name="person" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.verifiedBadgeDot}>
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.sidebarAccountNameText} numberOfLines={1}>
                {userProfile?.name || 'Juan Dela Cruz'}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setTempProfile({ ...userProfile });
                  setIsEditModalOpen(true);
                }}
                style={styles.smallEditIconButton}
                activeOpacity={0.75}
              >
                <Ionicons name="pencil" size={14} color="#1E4D2B" />
              </TouchableOpacity>
            </View>

            <View style={styles.sidebarDivider} />
            <Text style={styles.sidebarSectionTitle}>Preferences</Text>

            <View style={styles.sidebarMenuItem}>
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuItemIconCircle,
                    { backgroundColor: '#EAF4EF' },
                  ]}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={18}
                    color="#1E4D2B"
                  />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text style={styles.menuItemTitle}>Push Notifications</Text>
                  <Text style={styles.menuItemSub}>Suyo and errand alerts</Text>
                </View>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={(val) => {
                  setPushNotifications(val);
                  triggerToast(
                    val
                      ? 'Push notifications enabled'
                      : 'Push notifications muted',
                    'notifications'
                  );
                }}
                trackColor={{ false: '#D4E2DA', true: '#1E4D2B' }}
                thumbColor={pushNotifications ? '#4ADE80' : '#FFFFFF'}
              />
            </View>

            {/* Notifications Center Item in Sidebar */}
            <TouchableOpacity
              style={styles.sidebarMenuItem}
              activeOpacity={0.75}
              onPress={() => {
                closeSidebar();
                setIsNotificationsModalOpen(true);
              }}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuItemIconCircle,
                    { backgroundColor: '#EAF4EF' },
                  ]}
                >
                  <Ionicons
                    name="mail-unread-outline"
                    size={18}
                    color="#1E4D2B"
                  />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text style={styles.menuItemTitle}>Notifications Inbox</Text>
                  <Text style={styles.menuItemSub}>
                    {unreadNotificationsCount > 0
                      ? `${unreadNotificationsCount} unread message${unreadNotificationsCount > 1 ? 's' : ''}`
                      : 'All caught up'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#7A9384" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sidebarMenuItem}
              activeOpacity={0.75}
              onPress={() => toggleSection('help')}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuItemIconCircle,
                    { backgroundColor: '#E8F2FC' },
                  ]}
                >
                  <Ionicons
                    name="help-buoy-outline"
                    size={18}
                    color="#1B609E"
                  />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text style={styles.menuItemTitle}>Help & Support</Text>
                  <Text style={styles.menuItemSub}>
                    FAQs, 24/7 Chat & Contact
                  </Text>
                </View>
              </View>
              <Ionicons
                name={
                  expandedSection === 'help' ? 'chevron-up' : 'chevron-down'
                }
                size={18}
                color="#7A9384"
              />
            </TouchableOpacity>

            {expandedSection === 'help' && (
              <View style={styles.expandedSubCard}>
                <TouchableOpacity
                  style={styles.helpSubRow}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="chatbubbles-outline"
                    size={16}
                    color="#1E4D2B"
                  />
                  <Text style={styles.helpSubText}>
                    Live Chat with Support (24/7)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.helpSubRow}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call-outline" size={16} color="#1E4D2B" />
                  <Text style={styles.helpSubText}>
                    Helpline: (02) 8888-SUYO
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.sidebarMenuItem}
              activeOpacity={0.75}
              onPress={() => toggleSection('about')}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuItemIconCircle,
                    { backgroundColor: '#F4ECE4' },
                  ]}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#9E581B"
                  />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text style={styles.menuItemTitle}>About SuyoLink</Text>
                  <Text style={styles.menuItemSub}>
                    v1.0.0 • Hyperlocal Errands
                  </Text>
                </View>
              </View>
              <Ionicons
                name={
                  expandedSection === 'about' ? 'chevron-up' : 'chevron-down'
                }
                size={18}
                color="#7A9384"
              />
            </TouchableOpacity>

            {expandedSection === 'about' && (
              <View style={styles.expandedSubCard}>
                <Text style={styles.aboutParagraph}>
                  SuyoLink connects you with reliable local doers to handle
                  favors, document errands, and express deliveries securely in
                  your community.
                </Text>
                <View style={styles.aboutMetaRow}>
                  <Text style={styles.aboutMetaLabel}>App Version:</Text>
                  <Text style={styles.aboutMetaValue}>1.0.0 (Build 2026.1)</Text>
                </View>
              </View>
            )}

            <View style={styles.logoutWrapper}>
              <TouchableOpacity
                style={styles.logoutButton}
                activeOpacity={0.8}
                onPress={async () => {
                  closeSidebar();
                  try { await logout(); } catch (_) {}
                  router.replace('/');
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
                <Text style={styles.logoutButtonText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>

      {/* ========================================================== */}
      {/* 9. EDIT PROFILE MODAL                                      */}
      {/* ========================================================== */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Account Profile</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#163523" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInputLabel}>Full Name</Text>
            <TextInput
              style={styles.modalInput}
              value={tempProfile.name}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, name: text })
              }
              placeholder="Full Name"
              placeholderTextColor="#8FA497"
            />

            <Text style={styles.modalInputLabel}>Email Address</Text>
            <TextInput
              style={styles.modalInput}
              value={tempProfile.email}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, email: text })
              }
              placeholder="Email"
              keyboardType="email-address"
              placeholderTextColor="#8FA497"
            />

            <Text style={styles.modalInputLabel}>Contact Number</Text>
            <TextInput
              style={styles.modalInput}
              value={tempProfile.phone}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, phone: text })
              }
              placeholder="Phone"
              keyboardType="phone-pad"
              placeholderTextColor="#8FA497"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsEditModalOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveProfile}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.modalSaveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#1C3A27',
  },

  /* Fixed Top Bar */
  fixedTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#1C3A27',
    zIndex: 100,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E05A47',
  },
  headerNotifBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#E05A47',
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1C3A27',
  },
  headerNotifBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 12,
  },

  /* Content Scroll */
  contentScroll: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    marginTop: -1,
  },
  contentContainer: {
    paddingBottom: 85,
  },

  /* Hero Section */
  headerHeroSection: {
    width: '100%',
    height: 185,
    backgroundColor: '#1C3A27',
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  heroTextBlock: {
    flex: 1.1,
    justifyContent: 'center',
    zIndex: 2,
    paddingRight: 8,
  },
  heroImageSticker: {
    width: '58%',
    height: '135%',
    position: 'absolute',
    right: -12,
    top: -15,
    zIndex: 1,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
    marginBottom: 8,
  },
  locationPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D4E8DC',
    letterSpacing: 0.2,
  },
  welcomeSubText: {
    fontSize: 11.5,
    color: '#A8D5B8',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  welcomeNameText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
    lineHeight: 26,
  },
  welcomeTagline: {
    fontSize: 12,
    color: '#D0EDD9',
    fontWeight: '500',
  },

  /* White Content Body */
  whiteContentBody: {
    backgroundColor: '#F8FAF9',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 3,
  },

  /* Search Bar + Filter */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    marginTop: 8,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#D8E5DF',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#163523',
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    paddingHorizontal: 0,
    minWidth: 0,
  },
  filterIconButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#D8E5DF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    elevation: 2,
  },
  filterIconButtonActive: {
    backgroundColor: '#1E4D2B',
    borderColor: '#1E4D2B',
  },
  filterActiveBadgeDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E05A47',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  filterActiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },

  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 14,
  },
  nearestHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF4EF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  nearestHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  clearFiltersPill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },

  /* Available Suyo List Cards */
  tasksList: {
    gap: 10,
  },
  suyoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#DFECE5',
    borderRadius: 16,
    padding: 14,
    elevation: 1.5,
  },
  suyoCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  suyoCardTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#163523',
    marginRight: 10,
    lineHeight: 19,
  },
  suyoCardReward: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E4D2B',
  },
  suyoCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suyoCardDistanceSub: {
    fontSize: 12,
    color: '#718C7D',
  },
  suyoTagPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  suyoTagPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  suyoTagUrgent: {
    backgroundColor: '#FEE2E2',
  },
  suyoTagUrgentText: {
    color: '#DC2626',
  },
  suyoTagToday: {
    backgroundColor: '#FEF3C7',
  },
  suyoTagTodayText: {
    color: '#D97706',
  },
  suyoTagNormal: {
    backgroundColor: '#E8F5EE',
  },
  suyoTagNormalText: {
    color: '#1E4D2B',
  },
  suyoTagTomorrow: {
    backgroundColor: '#E0F2FE',
  },
  suyoTagTomorrowText: {
    color: '#0369A1',
  },

  /* Empty State */
  emptyStateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#DFECE5',
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#163523',
  },
  emptyStateSub: {
    fontSize: 12,
    color: '#718C7D',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyResetBtn: {
    marginTop: 6,
    backgroundColor: '#1E4D2B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Floating Active Suyo Progress Card */
  floatingActiveModalWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 90,
  },
  floatingActiveModalTouchable: {
    borderRadius: 14,
    elevation: 5,
  },
  floatingActiveModalGradient: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    borderColor: '#CBE4D5',
  },
  floatingModalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  floatingActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 77, 43, 0.09)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 4,
  },
  pulsingGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#1E4D2B',
  },
  floatingActiveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E4D2B',
    letterSpacing: 0.4,
  },
  floatingTrackingTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingTrackingText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  floatingModalBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  floatingModalTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
  },
  floatingModalSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4F735F',
  },
  floatingModalChevronCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 77, 43, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingProgressTrack: {
    height: 3,
    backgroundColor: '#D7E8DC',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  floatingProgressFill: {
    height: '100%',
    backgroundColor: '#1E4D2B',
    borderRadius: 1.5,
  },

  /* Bottom Nav */
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E2ECE7',
    zIndex: 95,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    paddingVertical: 4,
  },
  navItemText: {
    fontSize: 10.5,
    color: '#8FA497',
    fontWeight: '600',
    marginTop: 3,
  },
  navItemTextActive: {
    color: '#1E4D2B',
    fontWeight: '700',
  },

  /* Sidebar */
  sidebarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    zIndex: 200,
  },
  sidebarDrawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 201,
    elevation: 16,
  },
  sidebarSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4F0',
  },
  sidebarBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sidebarLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#D7EBE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarBrandTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
  },
  sidebarCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarScrollContent: {
    padding: 18,
    paddingBottom: 36,
  },
  sidebarAccountSingleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F8F5',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2ECE6',
  },
  verifiedAvatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  verifiedAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadgeDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  sidebarAccountNameText: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '700',
    color: '#163523',
    marginRight: 8,
  },
  smallEditIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E1EFE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: '#EEF4F0',
    marginVertical: 18,
  },
  sidebarSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#718C7D',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7FAF8',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8F0EC',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuItemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTextCol: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#163523',
    marginBottom: 2,
  },
  menuItemSub: {
    fontSize: 11.5,
    color: '#718C7D',
  },
  expandedSubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    marginTop: -4,
    borderWidth: 1,
    borderColor: '#E2ECE6',
    gap: 10,
  },
  helpSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  helpSubText: {
    fontSize: 12.5,
    color: '#1E4D2B',
    fontWeight: '600',
  },
  aboutParagraph: {
    fontSize: 12,
    color: '#52695C',
    lineHeight: 18,
  },
  aboutMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  aboutMetaLabel: {
    fontSize: 11.5,
    color: '#718C7D',
  },
  aboutMetaValue: {
    fontSize: 11.5,
    color: '#163523',
    fontWeight: '600',
  },
  logoutWrapper: {
    marginTop: 18,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDECEC',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#F8C8C8',
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D32F2F',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#163523',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#52695C',
    marginBottom: 5,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#F6F9F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#163523',
    borderWidth: 1,
    borderColor: '#D8E6DF',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F0F5F2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52695C',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalSaveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Filter Modal */
  filterModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    elevation: 10,
  },
  filterSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#163523',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
  },
  filterPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    backgroundColor: '#F4F9F6',
    borderWidth: 1,
    borderColor: '#DFECE5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52695C',
  },
  filterPillGradient: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.2,
  },

  distanceStepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F9F6',
    borderWidth: 1,
    borderColor: '#DFECE5',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    height: 42,
    width: 250,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  distanceStepperArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4E5DC',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  distanceStepperArrowBtnDisabled: {
    backgroundColor: '#EEF5F1',
    borderColor: '#E2ECE6',
    elevation: 0,
  },
  distanceStepperDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  distanceStepperValueText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#163523',
    lineHeight: 17,
  },
  distanceStepperSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#658172',
    lineHeight: 13,
  },
  filterModalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF4F0',
  },
  filterResetButton: {
    flex: 1,
    backgroundColor: '#F0F5F2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterResetButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#52695C',
  },
  filterApplyButton: {
    flex: 1.5,
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterApplyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Suyo Detail Modal */
  suyoDetailModalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    elevation: 10,
  },
  detailTopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailTopMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  detailTopMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailPostedTimeText: {
    fontSize: 12,
    color: '#658172',
    fontWeight: '600',
  },
  detailTitleAndStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  detailCardTitleInRow: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#163523',
    lineHeight: 23,
    flex: 1,
  },
  detailStatusPillInline: {
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'center',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailStatusPillInlineText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  detailTopTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailTopTagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailUrgencyPill: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  detailPillUrgent: {
    backgroundColor: '#FEE2E2',
  },
  detailPillToday: {
    backgroundColor: '#FEF3C7',
  },
  detailPillNormal: {
    backgroundColor: '#E8F5EE',
  },
  detailPillTomorrow: {
    backgroundColor: '#E0F2FE',
  },
  detailUrgencyPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  detailPillTextUrgent: {
    color: '#DC2626',
  },
  detailPillTextToday: {
    color: '#D97706',
  },
  detailPillTextNormal: {
    color: '#1E4D2B',
  },
  detailPillTextTomorrow: {
    color: '#0369A1',
  },
  detailHeartBtn: {
    padding: 4,
  },
  detailCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#163523',
    lineHeight: 24,
    marginBottom: 12,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#EEF4F0',
    marginVertical: 12,
  },
  detailRequestorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailRequestorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  detailAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  detailAvatarInitials: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 18,
  },
  detailRequestorTextCol: {
    flex: 1,
  },
  detailRequestorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  detailRequestorMeta: {
    fontSize: 11.5,
    color: '#718C7D',
    marginBottom: 2,
  },
  detailRequestorPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailRequestorPhoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B6354',
  },
  detailRequestorCallBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF5EE',
    borderWidth: 1.5,
    borderColor: '#C2E0CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  detailStatsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailStatCol: {
    flex: 1,
  },
  detailStatLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7E9789',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailRewardAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#163523',
  },
  detailLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLocationName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#163523',
  },
  detailTaskHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    marginTop: 2,
  },
  detailTaskHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#163523',
  },
  detailClickableEditAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6E3D1',
  },
  detailClickableEditText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  detailTaskBody: {
    fontSize: 13,
    color: '#4B6354',
    lineHeight: 19,
    marginBottom: 14,
  },
  detailActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  detailCloseBtn: {
    flex: 1,
    backgroundColor: '#F0F5F2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  detailCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#52695C',
  },
  detailFulfillBtn: {
    flex: 2,
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detailFulfillBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailEditHeaderBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EBF4EE',
  },
  detailCloseIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  detailDoerHighlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3FAF5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CDE5D6',
    gap: 10,
    marginBottom: 4,
  },
  detailDoerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailDoerAvatarInitials: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailDoerTextCol: {
    flex: 1,
  },
  detailDoerNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#163523',
  },
  detailDoerMetaText: {
    fontSize: 11,
    color: '#607B6C',
    marginTop: 1,
  },
  detailDoerPhoneText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#425C4D',
    marginTop: 2,
  },
  detailViewDoerProfileBtn: {
    backgroundColor: '#1E4D2B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailViewDoerProfileBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailBoostCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  detailBoostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailBoostIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBoostTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  detailBoostSubtitle: {
    fontSize: 11,
    color: '#4B6354',
    lineHeight: 15,
  },
  detailBoostButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  detailBoostChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBoostChipGreen: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  detailBoostChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  detailArchivedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  detailArchivedNoticeText: {
    fontSize: 11.5,
    color: '#475569',
    flex: 1,
    lineHeight: 16,
  },
  detailEditSuyoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 5,
  },
  detailEditSuyoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#163523',
  },
  detailCancelSuyoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 5,
  },
  detailCancelSuyoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  detailRepostBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  detailRepostBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailCallDoerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#CDE5D7',
  },
  detailCallDoerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#163523',
  },
  detailTrackCourierBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  detailTrackCourierBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailArchiveSuyoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 5,
  },
  detailArchiveSuyoBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  detailPrimaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E4D2B',
    borderRadius: 14,
    paddingVertical: 13,
    gap: 8,
  },
  detailPrimaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailRepeatSuyoBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  detailRepeatSuyoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Doer Profile Modal */
  doerProfileModalCard: {
    width: '100%',
    maxWidth: 370,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    elevation: 10,
  },
  doerProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  doerProfileHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
  },
  doerProfileHero: {
    alignItems: 'center',
    marginBottom: 14,
  },
  doerProfileAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  doerProfileAvatarInitials: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  doerVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#059669',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doerProfileName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 3,
  },
  doerVerifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 5,
  },
  doerVerifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  doerProfileRating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#658172',
  },
  doerStatsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  doerStatValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163523',
  },
  doerStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  doerInfoList: {
    gap: 8,
    marginBottom: 12,
  },
  doerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doerInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    width: 75,
  },
  doerInfoValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#163523',
    flex: 1,
  },
  doerBioText: {
    fontSize: 11.5,
    color: '#52695C',
    fontStyle: 'italic',
    lineHeight: 16,
    backgroundColor: '#F3FAF5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  doerProfileActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  doerProfileCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 11,
    gap: 6,
  },
  doerProfileCallBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doerProfileMsgBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 12,
    paddingVertical: 11,
    gap: 6,
  },
  doerProfileMsgBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#163523',
  },

  /* Edit Suyo Modal */
  editSuyoModalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    elevation: 10,
  },
  editSuyoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  editSuyoHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#163523',
  },
  editSuyoInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 5,
    marginTop: 8,
  },
  editSuyoTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#163523',
    marginBottom: 4,
  },
  editSuyoRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editSuyoQuickAddPill: {
    backgroundColor: '#E8F5EE',
    borderWidth: 1,
    borderColor: '#A7D9B8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  editSuyoQuickAddText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E4D2B',
  },
  editSuyoTextArea: {
    minHeight: 65,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  editSuyoActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF4F0',
  },
  editSuyoCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editSuyoCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  editSuyoSaveBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  editSuyoSaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Favorites Modal */
  favoritesModalCard: {
    width: '100%',
    maxWidth: 370,
    height: '70%',
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    elevation: 10,
  },
  favoritesModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  favoritesHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favSubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  favSubHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  favFadingEditText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(22, 53, 35, 0.45)',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(22, 53, 35, 0.25)',
  },
  favSelectAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  favModalToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 7,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  favModalToastText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  favoritesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  favoritesModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.3,
  },
  favoritesCountPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  favoritesCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  favoritesModalSub: {
    fontSize: 11.5,
    color: '#658172',
    marginBottom: 10,
  },
  favoritesScrollList: {
    flex: 1,
    marginTop: 2,
    marginBottom: 6,
  },
  favCardItem: {
    backgroundColor: '#F9FBF9',
    borderRadius: 11,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2ECE6',
    marginBottom: 8,
  },
  favCardItemSelected: {
    borderColor: '#F87171',
    backgroundColor: '#FFF9F9',
  },
  favSelectionCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 1.5,
    borderColor: '#B0C7B9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  favSelectionCircleSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  favCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  favCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#163523',
    lineHeight: 16.5,
    marginBottom: 2.5,
  },
  favCardLocation: {
    fontSize: 10.5,
    color: '#62806E',
    fontWeight: '500',
  },
  favCardReward: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E4D2B',
  },
  favDeleteActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  favCancelBottomBtn: {
    flex: 1,
    backgroundColor: '#F0F5F2',
    borderRadius: 10,
    paddingVertical: 9.5,
    alignItems: 'center',
  },
  favCancelBottomBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#52695C',
  },
  favConfirmDeleteBtn: {
    flex: 2,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 9.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  favConfirmDeleteBtnDisabled: {
    backgroundColor: '#E5ECE8',
  },
  favConfirmDeleteBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  favConfirmDeleteBtnTextDisabled: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8CA395',
  },
  favCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#ECF4EF',
  },

  /* MySuyo Hub Screen Styles */
  mySuyoMainWrapper: {
    flex: 1,
    backgroundColor: '#FAFCFA',
  },
  mySuyoHeroSection: {
    backgroundColor: '#1E4D2B',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mySuyoHeroTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  mySuyoHeroSuper: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#86EFAC',
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  mySuyoHeroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  mySuyoHeroSub: {
    fontSize: 12,
    color: '#C2DEC9',
    lineHeight: 16,
  },
  mySuyoHeroBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Modern Text Navigation (Zero button boxes, pure modern typography) */
  mySuyoTextNavWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF4EF',
  },
  mySuyoTextNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  mySuyoTextNavItem: {
    paddingVertical: 8,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mySuyoTextNavTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7E9789',
    letterSpacing: -0.2,
  },
  mySuyoTextNavTitleActive: {
    fontWeight: '800',
    color: '#163523',
  },
  mySuyoTextNavCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8FA497',
  },
  mySuyoTextNavCountActive: {
    color: '#1E4D2B',
  },
  mySuyoTextNavUnderline: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#1E4D2B',
  },

  /* MySuyo Sub Bar with Fading Text Edit */
  mySuyoSubBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#FAFCFA',
  },
  mySuyoSubBarTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  mySuyoSubBarSubtitle: {
    fontSize: 11,
    color: '#658172',
  },
  mySuyoFadingEditText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(22, 53, 35, 0.45)',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(22, 53, 35, 0.25)',
  },
  mySuyoSelectAllText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },

  /* Cards List for MySuyo */
  mySuyoCardsList: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
    backgroundColor: '#FAFCFA',
  },
  mySuyoCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.2,
    borderColor: '#E2ECE6',
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  mySuyoCardItemSelected: {
    borderColor: '#F87171',
    backgroundColor: '#FFF9F9',
  },
  mySuyoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mySuyoSelectionCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#B0C7B9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  mySuyoSelectionCircleSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  mySuyoDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F5F2',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  mySuyoDateText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#52695C',
  },
  mySuyoCardSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  mySuyoCardStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mySuyoCardDateDot: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
  },
  mySuyoCardDateText: {
    fontSize: 11.5,
    color: '#658172',
    fontWeight: '600',
  },
  mySuyoStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  mySuyoStatusCompleted: {
    backgroundColor: '#E8F5EE',
  },
  mySuyoStatusCompletedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E4D2B',
  },
  mySuyoStatusInProgress: {
    backgroundColor: '#FEF3C7',
  },
  mySuyoStatusInProgressText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  mySuyoStatusOpen: {
    backgroundColor: '#E0F2FE',
  },
  mySuyoStatusOpenText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0369A1',
  },
  mySuyoCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#163523',
    lineHeight: 19,
    marginBottom: 4,
  },
  mySuyoCardDetails: {
    fontSize: 12,
    color: '#52695C',
    lineHeight: 16,
    marginBottom: 10,
  },
  mySuyoCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F5F2',
  },
  mySuyoCardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  mySuyoCardLocationText: {
    fontSize: 11,
    color: '#658172',
    fontWeight: '500',
  },
  mySuyoCardRewardText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#1E4D2B',
  },
  mySuyoEmptyBox: {
    paddingVertical: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  mySuyoEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
  },
  mySuyoEmptySub: {
    fontSize: 12,
    color: '#718C7D',
    textAlign: 'center',
    lineHeight: 17,
  },
  mySuyoEditFloatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  mySuyoCancelEditBtn: {
    flex: 1,
    backgroundColor: '#F0F5F2',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  mySuyoCancelEditText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#52695C',
  },
  mySuyoConfirmDeleteBtn: {
    flex: 2,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mySuyoConfirmDeleteBtnDisabled: {
    backgroundColor: '#E5ECE8',
  },
  mySuyoConfirmDeleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mySuyoConfirmDeleteBtnTextDisabled: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8CA395',
  },
  favCardRequestorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  favAvatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EBF4EE',
    borderWidth: 1,
    borderColor: '#B5D4C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favAvatarInitials: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#163523',
  },
  favCardRequestorName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#344E41',
  },
  favTagPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  favTagUrgent: {
    backgroundColor: '#FEE2E2',
  },
  favTagToday: {
    backgroundColor: '#FEF3C7',
  },
  favTagNormal: {
    backgroundColor: '#E8F5EE',
  },
  favTagTomorrow: {
    backgroundColor: '#E0F2FE',
  },
  favTagPillText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  favTagUrgentText: {
    color: '#DC2626',
  },
  favTagTodayText: {
    color: '#D97706',
  },
  favTagNormalText: {
    color: '#1E4D2B',
  },
  favTagTomorrowText: {
    color: '#0369A1',
  },
  favEmptyBox: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  favEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#163523',
  },
  favEmptySub: {
    fontSize: 11.5,
    color: '#718C7D',
    textAlign: 'center',
    lineHeight: 16,
  },
  favCloseBottomBtn: {
    backgroundColor: '#1E4D2B',
    borderRadius: 10,
    paddingVertical: 9.5,
    alignItems: 'center',
    marginTop: 8,
  },
  favCloseBottomBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  dashboardToastBubble: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(235, 247, 240, 0.94)',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 150,
    elevation: 8,
    borderWidth: 1.2,
    borderColor: 'rgba(39, 133, 77, 0.28)',
    maxWidth: '92%',
  },
  dashboardToastText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#163523',
  },

  /* Unread Badge Number Text */
  unreadBadgeNumberText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 11,
  },

  /* ========================================================== */
  /* FUNCTIONAL NOTIFICATIONS MODAL STYLES                      */
  /* ========================================================== */
  notificationsModalCard: {
    width: '100%',
    maxWidth: 395,
    height: '78%',
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  notifModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.3,
  },
  notifCountPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  notifCountText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  notifTopActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4F0',
  },
  notifFilterPillsWrap: {
    flexDirection: 'row',
    gap: 5,
  },
  notifFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F3F8F5',
    borderWidth: 1,
    borderColor: '#DFECE5',
  },
  notifFilterPillActive: {
    backgroundColor: '#1E4D2B',
    borderColor: '#1E4D2B',
  },
  notifFilterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#52695C',
  },
  notifFilterPillTextActive: {
    color: '#FFFFFF',
  },
  notifMarkAllReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    backgroundColor: '#EBF5EF',
  },
  notifMarkAllReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  notifScrollList: {
    flex: 1,
    marginBottom: 8,
  },
  notifSwipeContainer: {
    position: 'relative',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#DC2626',
  },
  notifDeleteActionBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 75,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    zIndex: 1,
  },
  notifDeleteActionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  notifCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8F0EC',
    zIndex: 2,
  },
  notifCardInnerTouch: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 11,
    gap: 9,
    width: '100%',
  },
  notifCardItemUnread: {
    backgroundColor: '#F4FAF6',
    borderColor: '#CCE6D7',
  },
  notifCardLeftCol: {
    paddingTop: 1,
  },
  notifIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconDoer: {
    backgroundColor: '#E6F4EC',
  },
  notifIconTask: {
    backgroundColor: '#ECFDF5',
  },
  notifIconPayment: {
    backgroundColor: '#FEF3C7',
  },
  notifIconNearby: {
    backgroundColor: '#E0F2FE',
  },
  notifCardContentCol: {
    flex: 1,
  },
  notifCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notifCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#163523',
  },
  notifUnreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E4D2B',
  },
  notifCardTime: {
    fontSize: 10,
    color: '#8CA094',
    fontWeight: '600',
  },
  notifCardBody: {
    fontSize: 11.5,
    color: '#476353',
    lineHeight: 16,
    marginBottom: 4,
  },
  notifCardBottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifActionLinkText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  notifSwipeHintText: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  notifTrashIconBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifMarkSingleReadBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EBF4EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifEmptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 8,
  },
  notifEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    marginTop: 4,
  },
  notifEmptySub: {
    fontSize: 12.5,
    color: '#718C7D',
    textAlign: 'center',
    lineHeight: 18,
  },
  notifModalBottomRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF4F0',
  },
  notifClearBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  notifClearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  notifDoneBtn: {
    flex: 1.5,
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDoneBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* === WALLET EARNINGS STYLES === */
  walletMainWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  walletHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2ECE5',
    elevation: 2,
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  walletHeroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EAF4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletHeroSuper: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E4D2B',
    letterSpacing: 0.8,
  },
  walletVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 4,
  },
  walletVerifiedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  walletBalanceLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#557261',
    marginBottom: 4,
  },
  walletBalanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#163523',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  walletSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF9',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EDF5F0',
  },
  walletSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  walletSummaryCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  walletSummaryLabel: {
    fontSize: 11,
    color: '#557261',
    fontWeight: '600',
  },
  walletSummaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#D7EBE0',
  },
  walletPaymentNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  walletPaymentNoticeText: {
    fontSize: 11.5,
    color: '#15803D',
    lineHeight: 16,
    flex: 1,
    fontWeight: '500',
  },
  walletSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  walletSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  walletSectionSub: {
    fontSize: 11.5,
    color: '#557261',
  },
  walletCountChip: {
    backgroundColor: '#EAF4EF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDE5D7',
  },
  walletCountChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  walletListWrapper: {
    gap: 10,
  },
  walletItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2ECE5',
    elevation: 1,
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  walletItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
    gap: 12,
  },
  walletCategoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletItemInfoCol: {
    flex: 1,
    gap: 3,
  },
  walletItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#163523',
  },
  walletItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walletItemRequesterText: {
    fontSize: 12,
    color: '#557261',
  },
  walletItemDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walletItemDateText: {
    fontSize: 11,
    color: '#8CA395',
  },
  walletItemDot: {
    fontSize: 10,
    color: '#CBD5E1',
    marginHorizontal: 2,
  },
  walletItemLocationText: {
    fontSize: 11,
    color: '#8CA395',
    flex: 1,
  },
  walletItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  walletEarnedAmountText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#15803D',
  },
  walletStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    gap: 3,
  },
  walletStatusChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
  },

  /* === ACTIVITY & TRANSACTIONS STYLES === */
  activityMainWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  activityHeroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2ECE5',
    elevation: 2,
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  activityHeroTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  activityHeroSuper: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  activityHeroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  activityHeroSub: {
    fontSize: 12.5,
    color: '#557261',
    lineHeight: 17,
  },
  activityStatementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 5,
    borderWidth: 1,
    borderColor: '#CDE5D7',
  },
  activityStatementBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  activityMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  activityMetricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2ECE5',
    elevation: 1,
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  activityMetricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activityMetricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  activityMetricLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2D4F38',
  },
  activityMetricSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  activityCategoryBreakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2ECE5',
  },
  activityCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#163523',
  },
  activityCategorySub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  activityTrustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  activityTrustPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  activityCategoryBar: {
    height: 10,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#F1F5F9',
  },
  activityCategorySegment: {
    height: '100%',
  },
  activityCategoryLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityCategoryLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activityCategoryLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityCategoryLegendText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '600',
  },
  activityFilterScrollWrapper: {
    marginBottom: 12,
  },
  activityFilterScroll: {
    gap: 8,
    paddingRight: 10,
  },
  activityFilterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activityFilterChipActive: {
    backgroundColor: '#1E4D2B',
  },
  activityFilterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#557261',
  },
  activityFilterChipTextActive: {
    color: '#FFFFFF',
  },
  activitySearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#D7EBE0',
    marginBottom: 16,
    gap: 8,
  },
  activitySearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#163523',
    padding: 0,
  },
  activityList: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2ECE5',
    elevation: 1,
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  activityCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityCategoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  activityCategoryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCategoryTextCol: {
    gap: 1,
  },
  activityCategoryName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#163523',
  },
  activityCardDate: {
    fontSize: 11,
    color: '#64748B',
  },
  activityStatusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  activityStatusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activityCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 8,
  },
  activityCardMetaCol: {
    gap: 4,
    marginBottom: 10,
  },
  activityCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activityCardMetaText: {
    fontSize: 12,
    color: '#557261',
  },
  activityFinancialStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDF5F0',
  },
  activityRefNo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  activityPaymentMethod: {
    fontSize: 11,
    color: '#163523',
    fontWeight: '600',
    marginTop: 2,
  },
  activityAmountText: {
    fontSize: 14,
    fontWeight: '800',
  },
  activityFeeNote: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  activityCardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  activityViewReceiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 10,
    paddingVertical: 9,
    gap: 5,
    borderWidth: 1,
    borderColor: '#CDE5D7',
  },
  activityViewReceiptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#163523',
  },
  activityTrackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 9,
    gap: 5,
  },
  activityTrackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activityRepeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 4,
  },
  activityRepeatBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  activityEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: '#E2ECE5',
  },
  activityEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#163523',
    marginTop: 10,
    marginBottom: 4,
  },
  activityEmptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
  },

  /* DIGITAL RECEIPT MODAL STYLES */
  receiptModalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
  },
  receiptModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2ECE5',
    backgroundColor: '#F8FAF9',
  },
  receiptHeaderBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptModalHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163523',
  },
  receiptScrollContent: {
    padding: 16,
  },
  receiptTicketBox: {
    backgroundColor: '#FAFCFA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D7EBE0',
    marginBottom: 16,
  },
  receiptBrandTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#163523',
    letterSpacing: 1,
    textAlign: 'center',
  },
  receiptBrandTag: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  receiptRefDisplay: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
  },
  receiptDashedLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  receiptLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 12.5,
    color: '#163523',
    fontWeight: '600',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  receiptTotalLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#163523',
  },
  receiptTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
  receiptProofBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 12,
  },
  receiptProofTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803D',
  },
  receiptProofSub: {
    fontSize: 10.5,
    color: '#557261',
    lineHeight: 14,
  },
  receiptBarcodeBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  receiptBarcodeBars: {
    width: '75%',
    height: 24,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    marginBottom: 4,
    opacity: 0.85,
  },
  receiptBarcodeText: {
    fontSize: 10.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#64748B',
    letterSpacing: 2,
  },
  receiptActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 8,
  },
  receiptShareActionBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#CDE5D7',
  },
  receiptShareActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#163523',
  },
  receiptCloseActionBtn: {
    flex: 1,
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptCloseActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
