import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { themeClasses, focusStyles, iconColors } from '../../utils/lightThemeHelper';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  dismissible?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  defaultPosition?: Notification['position'];
  defaultDuration?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  defaultPosition = 'top-right',
  defaultDuration = 5000,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>): string => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      id,
      duration: defaultDuration,
      persistent: false,
      dismissible: true,
      position: defaultPosition,
      ...notification,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Limit the number of notifications
      return updated.slice(0, maxNotifications);
    });

    // Auto-remove non-persistent notifications
    if (!newNotification.persistent && newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, [defaultDuration, defaultPosition, maxNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === id ? { ...notification, ...updates } : notification
    ));
  }, []);

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getPositionStyles = (position: Notification['position']) => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  // Group notifications by position
  const notificationGroups = notifications.reduce((groups, notification) => {
    const position = notification.position || defaultPosition;
    if (!groups[position]) {
      groups[position] = [];
    }
    groups[position].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    updateNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}

      {/* Notification Containers */}
      {Object.entries(notificationGroups).map(([position, positionNotifications]) => (
        <div
          key={position}
          className={`fixed z-[9999] space-y-2 ${getPositionStyles(position as Notification['position'])}`}
        >
          <AnimatePresence>
            {positionNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{
                  opacity: 0,
                  y: position.includes('top') ? -20 : 20,
                  x: position.includes('center') ? 0 : position.includes('right') ? 20 : -20,
                  scale: 0.9,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  x: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: position.includes('top') ? -20 : 20,
                  x: position.includes('center') ? 0 : position.includes('right') ? 20 : -20,
                  scale: 0.9,
                }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`
                  relative max-w-sm w-full rounded-lg border shadow-lg backdrop-blur-sm
                  ${getTypeStyles(notification.type)}
                  ${themeClasses.shadow.lg}
                `}
              >
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getTypeIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium ${themeClasses.text.primary}`}>
                        {notification.title}
                      </h4>
                      {notification.message && (
                        <p className={`mt-1 text-sm ${themeClasses.text.secondary}`}>
                          {notification.message}
                        </p>
                      )}

                      {notification.action && (
                        <div className="mt-3">
                          <button
                            onClick={notification.action.handler}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                          >
                            {notification.action.label}
                          </button>
                        </div>
                      )}
                    </div>

                    {notification.dismissible && (
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className={`p-1 rounded-lg ${themeClasses.interactive.subtle} transition-colors ${focusStyles.default}`}
                          aria-label="Dismiss notification"
                        >
                          <XMarkIcon className={`h-4 w-4 ${iconColors.default}`} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Progress bar for timed notifications */}
                  {!notification.persistent && notification.duration && notification.duration > 0 && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-1 bg-gray-300 rounded-b-lg overflow-hidden"
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: notification.duration / 1000, ease: 'linear' }}
                    >
                      <div className="h-full bg-current opacity-50" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ))}
    </NotificationContext.Provider>
  );
};

// Convenience hooks for different notification types
export const useNotifications = () => {
  const { addNotification } = useNotification();

  const success = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'success', title, message, ...options });
  }, [addNotification]);

  const error = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'error', title, message, ...options });
  }, [addNotification]);

  const warning = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'warning', title, message, ...options });
  }, [addNotification]);

  const info = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'info', title, message, ...options });
  }, [addNotification]);

  return { success, error, warning, info };
};

export default NotificationProvider;