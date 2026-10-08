import { parseDistanceKm } from '../utils/dashboardHelpers';
import { useState, useMemo } from 'react';

export default function useDashboardFilters({ availableSuyosBase }) {
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('All');

  const [selectedDistance, setSelectedDistance] = useState('Any');

  const [selectedUrgency, setSelectedUrgency] = useState('All');

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const currentDistanceKm = parseDistanceKm(selectedDistance);

  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (currentDistanceKm !== 'Any' ? 1 : 0) +
    (selectedUrgency !== 'All' ? 1 : 0);

  const isFiltering = activeFiltersCount > 0 || searchQuery.trim().length > 0;

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
          item.category.toLowerCase().includes(q),
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    // Distance filter
    if (currentDistanceKm !== 'Any') {
      list = list.filter(
        (item) => item.distance != null && item.distance <= currentDistanceKm,
      );
    }

    // Urgency filter
    if (selectedUrgency !== 'All') {
      list = list.filter((item) => item.tag === selectedUrgency);
    }

    // Sort newest first
    list.sort((a, b) => b.createdAt - a.createdAt);

    return list;
  }, [
    availableSuyosBase,
    searchQuery,
    selectedCategory,
    selectedDistance,
    selectedUrgency,
  ]);

  const availableHeaderTitle = useMemo(() => {
    if (!isFiltering) {
      return 'Available Suyos';
    }
    if (searchQuery.trim()) {
      return `${filteredSuyos.length} result${filteredSuyos.length === 1 ? '' : 's'} for "${searchQuery.trim()}"`;
    }
    return `Filtered Suyos (${filteredSuyos.length})`;
  }, [isFiltering, searchQuery, filteredSuyos.length]);

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
  return {
    activeFiltersCount,
    availableHeaderTitle,
    clearAllFilters,
    currentDistanceKm,
    filteredSuyos,
    handleDecreaseDistance,
    handleIncreaseDistance,
    handleResetModalFilters,
    isFilterModalOpen,
    isFiltering,
    searchQuery,
    selectedCategory,
    selectedUrgency,
    setIsFilterModalOpen,
    setSearchQuery,
    setSelectedCategory,
    setSelectedUrgency,
  };
}
