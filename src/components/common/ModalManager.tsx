import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { themeClasses, focusStyles, componentPatterns, iconColors } from '../../utils/lightThemeHelper';

export interface Modal {
  id: string;
  title: string;
  content: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  backdrop?: boolean;
  onClose?: () => void;
  className?: string;
  zIndex?: number;
}

interface ModalContextType {
  modals: Modal[];
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  updateModal: (id: string, updates: Partial<Modal>) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modals, setModals] = useState<Modal[]>([]);

  const openModal = useCallback((modal: Omit<Modal, 'id'>): string => {
    const id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newModal: Modal = {
      id,
      size: 'md',
      closable: true,
      backdrop: true,
      zIndex: 10000,
      ...modal,
    };

    // Close existing modals to prevent overlap unless specifically allowed
    setModals(prev => {
      // Only keep non-closable modals or if explicitly allowing multiple
      const filteredModals = modal.backdrop === false ? prev : [];
      return [...filteredModals, newModal];
    });
    return id;
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals(prev => {
      const modalToClose = prev.find(m => m.id === id);
      if (modalToClose?.onClose) {
        modalToClose.onClose();
      }
      return prev.filter(m => m.id !== id);
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(prev => {
      prev.forEach(modal => {
        if (modal.onClose) {
          modal.onClose();
        }
      });
      return [];
    });
  }, []);

  const updateModal = useCallback((id: string, updates: Partial<Modal>) => {
    setModals(prev => prev.map(modal =>
      modal.id === id ? { ...modal, ...updates } : modal
    ));
  }, []);

  const getSizeClasses = (size: Modal['size']): string => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'md':
        return 'max-w-lg';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case 'full':
        return 'max-w-[95vw] max-h-[95vh]';
      default:
        return 'max-w-lg';
    }
  };

  const contextValue: ModalContextType = {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    updateModal,
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}

      {/* Modal Overlay Container */}
      <AnimatePresence>
        {modals.map((modal, index) => (
          <motion.div
            key={modal.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 overflow-y-auto"
            style={{ zIndex: (modal.zIndex || 10000) + index }}
          >
            {/* Backdrop */}
            {modal.backdrop && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={() => modal.closable && closeModal(modal.id)}
              />
            )}

            {/* Modal Content */}
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                className={`
                  relative w-full ${getSizeClasses(modal.size)}
                  ${componentPatterns.modal}
                  ${modal.className || ''}
                `}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border.default}`}>
                  <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
                    {modal.title}
                  </h3>
                  {modal.closable && (
                    <button
                      onClick={() => closeModal(modal.id)}
                      className={`p-1 rounded-lg ${themeClasses.interactive.subtle} transition-colors ${focusStyles.default}`}
                      aria-label="Close modal"
                    >
                      <XMarkIcon className={`h-5 w-5 ${iconColors.default}`} />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  {modal.content}
                </div>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </ModalContext.Provider>
  );
};

// Convenience hooks for common modal types
export const useConfirmModal = () => {
  const { openModal, closeModal } = useModal();

  const confirm = useCallback((
    title: string,
    message: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const modalId = openModal({
        title,
        content: (
          <div className="space-y-4">
            <p className={themeClasses.text.primary}>{message}</p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  closeModal(modalId);
                  onCancel?.();
                  resolve(false);
                }}
                className={`px-4 py-2 rounded-lg ${themeClasses.interactive.buttonSecondary} ${themeClasses.text.primary} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  closeModal(modalId);
                  onConfirm?.();
                  resolve(true);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        ),
        size: 'sm',
        closable: true,
      });
    });
  }, [openModal, closeModal]);

  return { confirm };
};

export const useAlertModal = () => {
  const { openModal, closeModal } = useModal();

  const alert = useCallback((
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Promise<void> => {
    return new Promise((resolve) => {
      const getTypeStyles = () => {
        switch (type) {
          case 'success':
            return 'text-green-600';
          case 'warning':
            return 'text-yellow-600';
          case 'error':
            return 'text-red-600';
          default:
            return 'text-blue-600';
        }
      };

      const getTypeIcon = () => {
        switch (type) {
          case 'success':
            return '✅';
          case 'warning':
            return '⚠️';
          case 'error':
            return '❌';
          default:
            return 'ℹ️';
        }
      };

      const modalId = openModal({
        title: (
          <div className="flex items-center space-x-2">
            <span>{getTypeIcon()}</span>
            <span className={getTypeStyles()}>{title}</span>
          </div>
        ) as any,
        content: (
          <div className="space-y-4">
            <p className={themeClasses.text.primary}>{message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  closeModal(modalId);
                  resolve();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        ),
        size: 'sm',
        closable: true,
      });
    });
  }, [openModal, closeModal]);

  return { alert };
};

export default ModalProvider;