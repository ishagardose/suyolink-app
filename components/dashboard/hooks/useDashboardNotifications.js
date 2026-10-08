import { toNotificationCard } from '../notifications/notificationData';
import { useState, useRef, useMemo } from 'react';

export default function useDashboardNotifications({
  backendNotifications,
  deleteNotifications,
  markNotificationsRead,
  markRead,
  router,
  triggerToast,
}) {
  const notifications = useMemo(
    () => backendNotifications.map((item) => toNotificationCard(item)),
    [backendNotifications],
  );

  const [isNotificationsModalOpen, setIsNotificationsModalOpen] =
    useState(false);

  const [notificationFilter, setNotificationFilter] = useState('All');

  const [notificationBusy, setNotificationBusy] = useState(false);

  const notificationActionPending = useRef(false);

  const [notificationError, setNotificationError] = useState('');

  const unreadNotificationsCount = notifications.filter((n) => n.unread).length;

  const runNotificationAction = async (action, message, icon) => {
    if (notificationActionPending.current) return false;
    notificationActionPending.current = true;
    setNotificationBusy(true);
    setNotificationError('');
    try {
      await action();
      if (message) triggerToast(message, icon);
      return true;
    } catch (err) {
      setNotificationError(
        err.message || 'Could not update notifications. Please retry.',
      );
      return false;
    } finally {
      notificationActionPending.current = false;
      setNotificationBusy(false);
    }
  };

  const markNotificationRead = (id) =>
    runNotificationAction(
      () => markRead(id),
      'Notification marked as read',
      'checkmark-circle',
    );

  const markAllNotificationsRead = () =>
    runNotificationAction(
      () =>
        markNotificationsRead(
          notifications.filter((n) => n.unread).map((n) => n.id),
        ),
      'All notifications marked as read',
      'checkmark-done',
    );

  const clearAllNotifications = () =>
    runNotificationAction(
      () => deleteNotifications(notifications.map((n) => n.id)),
      'All notifications cleared',
      'trash-outline',
    );

  const removeNotification = (id) =>
    runNotificationAction(
      () => deleteNotifications([id]),
      'Notification removed',
      'trash-outline',
    );

  const handleTapNotification = async (notif) => {
    const success = await runNotificationAction(async () => {
      if (notif.unread) await markRead(notif.id);
    });
    if (!success) return;
    if (notif.request_id) {
      setIsNotificationsModalOpen(false);
      router.push({ pathname: '/suyo', params: { id: notif.request_id } });
    }
  };
  return {
    clearAllNotifications,
    handleTapNotification,
    isNotificationsModalOpen,
    markAllNotificationsRead,
    markNotificationRead,
    notificationBusy,
    notificationError,
    notificationFilter,
    notifications,
    removeNotification,
    setIsNotificationsModalOpen,
    setNotificationError,
    setNotificationFilter,
    unreadNotificationsCount,
  };
}
