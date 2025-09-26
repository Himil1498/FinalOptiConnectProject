import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import AppRouter from './AppRouter';
import { ThemeProvider } from './components/common/ThemeProvider';
import { PanelManagerProvider } from './components/common/PanelManager';
import { ModalProvider } from './components/common/ModalManager';
import { NotificationProvider } from './components/common/NotificationManager';
import { DataStoreProvider } from './contexts/DataStoreContext';
import KeyboardShortcuts from './components/common/KeyboardShortcuts';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';
import { handleResizeObserverError } from './utils/resizeObserverErrorHandler';
import './styles/globals.css';
import './styles/theme.css';
import './styles/mobile.css';
import './styles/data-manager.css';
import './styles/fullscreen.css';
import './styles/layout.css';

function App() {
  // Initialize ResizeObserver error handler on app start
  useEffect(() => {
    handleResizeObserverError();
  }, []);

  return (
    <GlobalErrorBoundary>
      <Provider store={store}>
        <DataStoreProvider>
          <ThemeProvider>
            <NotificationProvider>
              <ModalProvider>
                <PanelManagerProvider>
                  <KeyboardShortcuts />
                  <AppRouter />
                </PanelManagerProvider>
              </ModalProvider>
            </NotificationProvider>
          </ThemeProvider>
        </DataStoreProvider>
      </Provider>
    </GlobalErrorBoundary>
  );
}

export default App;
