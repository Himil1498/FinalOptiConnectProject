import React from 'react';
import { useTheme } from '../../hooks/useTheme';

const ToastContainer: React.FC = () => {
  const { uiState, removeNotification } = useTheme();

  if (uiState.notifications.length === 0) return null;

  return (
    <div className="toast-container">
      {uiState.notifications.map((notification) => (
        <div
          key={notification.id}
          className={`toast toast-${notification.type} ${notification.position || 'top-right'}`}
        >
          <div className="toast-content">
            {notification.title && (
              <div className="toast-title">{notification.title}</div>
            )}
            <div className="toast-message">{notification.message}</div>
          </div>
          {notification.dismissible && (
            <button
              className="toast-close"
              onClick={() => removeNotification(notification.id)}
              aria-label="Close notification"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;