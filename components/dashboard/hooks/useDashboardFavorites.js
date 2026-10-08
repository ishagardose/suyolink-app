import { useState, useMemo } from 'react';

export default function useDashboardFavorites({
  availableSuyosBase,
  triggerToast,
}) {
  const [favoriteSuyoIds, setFavoriteSuyoIds] = useState([]);

  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);

  const [openedFromFavorites, setOpenedFromFavorites] = useState(false);

  const favoriteSuyos = useMemo(() => {
    return availableSuyosBase.filter((suyo) =>
      favoriteSuyoIds.includes(suyo.id),
    );
  }, [favoriteSuyoIds, availableSuyosBase]);

  const toggleFavoriteSuyo = (suyo) => {
    if (!suyo) return;
    const isFav = favoriteSuyoIds.includes(suyo.id);
    if (isFav) {
      setFavoriteSuyoIds((prev) => prev.filter((id) => id !== suyo.id));
      triggerToast('suyo is removed from favourite', 'heart-dislike');
    } else {
      setFavoriteSuyoIds((prev) => [...prev, suyo.id]);
      triggerToast('suyo is successfully added to favourite', 'heart');
    }
  };

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
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleConfirmDeleteSelectedFavs = () => {
    if (selectedFavIdsToDelete.length === 0) return;
    const count = selectedFavIdsToDelete.length;
    setFavoriteSuyoIds((prev) =>
      prev.filter((id) => !selectedFavIdsToDelete.includes(id)),
    );
    setSelectedFavIdsToDelete([]);
    setIsFavDeleteMode(false);
    triggerToast(
      count === 1
        ? '1 suyo removed from favorites'
        : `${count} suyos removed from favorites`,
      'heart-dislike',
    );
  };
  return {
    favoriteSuyoIds,
    favoriteSuyos,
    handleCloseFavoritesModal,
    handleConfirmDeleteSelectedFavs,
    handleToggleFavDeleteMode,
    handleToggleSelectFavToDelete,
    isFavDeleteMode,
    isFavoritesModalOpen,
    openedFromFavorites,
    selectedFavIdsToDelete,
    setIsFavoritesModalOpen,
    setOpenedFromFavorites,
    setSelectedFavIdsToDelete,
    toggleFavoriteSuyo,
  };
}
