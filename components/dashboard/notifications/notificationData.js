const notificationKinds = {
  application: { title: 'New Application', category: 'doer', icon: 'bicycle' },
  application_decision: {
    title: 'Application Update',
    category: 'task',
    icon: 'checkmark-circle-outline',
  },
  status_update: {
    title: 'Task Update',
    category: 'task',
    icon: 'sync-outline',
  },
  completed: {
    title: 'Task Completed',
    category: 'task',
    icon: 'checkmark-done',
  },
};

export function toNotificationCard(notification, now = Date.now()) {
  const timestamp = Date.parse(notification.created_at);
  const minutes = Math.floor(Math.max(0, now - timestamp) / 60000);
  const time = !Number.isFinite(timestamp)
    ? ''
    : minutes < 1
      ? 'Just now'
      : minutes < 60
        ? `${minutes}m ago`
        : minutes < 1440
          ? `${Math.floor(minutes / 60)}h ago`
          : new Date(timestamp).toLocaleDateString();
  return {
    ...notification,
    ...(notificationKinds[notification.kind] || {
      title: 'Notification',
      category: 'task',
      icon: 'notifications-outline',
    }),
    time,
    unread: !notification.read_at,
    targetScreen: notification.request_id ? '/suyo' : null,
  };
}
