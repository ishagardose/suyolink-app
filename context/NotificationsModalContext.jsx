import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import NotificationsModal from '../components/notifications/NotificationsModal';

const NotificationsModalContext = createContext(null);
export function NotificationsModalProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const { isLoggedIn } = useAuth();
  useEffect(() => {
    if (!isLoggedIn) setVisible(false);
  }, [isLoggedIn]);
  const close = () => setVisible(false);
  return (
    <NotificationsModalContext.Provider
      value={{ openNotifications: () => setVisible(true) }}
    >
      {children}
      {visible && isLoggedIn ? <NotificationsModal onClose={close} /> : null}
    </NotificationsModalContext.Provider>
  );
}
export const useNotificationsModal = () =>
  useContext(NotificationsModalContext);
