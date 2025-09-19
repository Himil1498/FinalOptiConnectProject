import React from 'react';
import { useTheme } from '../../hooks/useTheme';

const LoadingOverlay: React.FC = () => {
  const { uiState } = useTheme();

  const loadingEntries = Object.entries(uiState.loadingStates).filter(([_, state]) => state.isLoading);

  if (loadingEntries.length === 0) return null;

  return (
    <div className="loading-overlay">
      {loadingEntries.map(([key, state]) => (
        <div key={key} className="loading-item">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          {state.message && (
            <div className="loading-message">{state.message}</div>
          )}
          {state.progress !== undefined && (
            <div className="loading-progress">
              <div
                className="progress-bar"
                style={{ width: `${state.progress}%` }}
              ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default LoadingOverlay;