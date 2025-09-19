import React, { useState, useCallback } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useDataManager } from '../../hooks/useDataManager';
import DataBrowser from './DataBrowser';
import PermissionManager from './PermissionManager';
import VersionHistory from './VersionHistory';
import { SavedDataItem, DataPermissions, DataShareSettings } from '../../types';

interface DataManagerProps {
  onClose: () => void;
  onItemLoad?: (item: SavedDataItem) => void;
}

const DataManager: React.FC<DataManagerProps> = ({ onClose, onItemLoad }) => {
  const { uiState, addNotification } = useTheme();
  const { saveData, shareData } = useDataManager();

  const [activeView, setActiveView] = useState<'browser' | 'permissions' | 'versions' | 'sharing'>('browser');
  const [selectedItem, setSelectedItem] = useState<SavedDataItem | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleItemSelect = useCallback((item: SavedDataItem) => {
    setSelectedItem(item);
  }, []);

  const handleItemLoad = useCallback((item: SavedDataItem) => {
    onItemLoad?.(item);
    addNotification({
      type: 'success',
      message: `Loaded ${item.name}`,
      duration: 3000
    });
    onClose();
  }, [onItemLoad, addNotification, onClose]);

  const handlePermissionsChange = useCallback(async (permissions: DataPermissions) => {
    if (!selectedItem) return;

    try {
      // Update permissions in the data manager
      // This would typically be handled by the data manager hook
      addNotification({
        type: 'success',
        message: 'Permissions updated successfully',
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to update permissions',
        duration: 5000
      });
    }
  }, [selectedItem, addNotification]);

  const handleShare = useCallback(async (shareSettings: DataShareSettings) => {
    if (!selectedItem) return;

    try {
      await shareData(selectedItem.id, shareSettings);
      setShowShareDialog(false);
    } catch (error) {
      console.error('Failed to update share settings:', error);
    }
  }, [selectedItem, shareData]);

  const renderQuickActions = () => {
    if (!selectedItem) return null;

    return (
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button
            onClick={() => handleItemLoad(selectedItem)}
            className="action-btn primary"
            title="Load this data"
          >
            📂 Load Data
          </button>
          <button
            onClick={() => setActiveView('permissions')}
            className="action-btn"
            title="Manage permissions"
          >
            🔒 Permissions
          </button>
          <button
            onClick={() => setActiveView('versions')}
            className="action-btn"
            title="View version history"
          >
            📜 History
          </button>
          <button
            onClick={() => setShowShareDialog(true)}
            className="action-btn"
            title="Share this data"
          >
            🔗 Share
          </button>
        </div>

        {selectedItem && (
          <div className="item-summary">
            <div className="summary-header">
              <h4>{selectedItem.name}</h4>
              <span className="item-type-badge">{selectedItem.type}</span>
            </div>
            {selectedItem.description && (
              <p className="item-description">{selectedItem.description}</p>
            )}
            <div className="item-metadata">
              <div className="meta-item">
                <span className="meta-label">Created:</span>
                <span className="meta-value">
                  {new Date(selectedItem.metadata.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Modified:</span>
                <span className="meta-value">
                  {new Date(selectedItem.metadata.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Version:</span>
                <span className="meta-value">v{selectedItem.metadata.version}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Size:</span>
                <span className="meta-value">
                  {selectedItem.metadata.size < 1024
                    ? `${selectedItem.metadata.size} B`
                    : `${(selectedItem.metadata.size / 1024).toFixed(1)} KB`}
                </span>
              </div>
            </div>
            {selectedItem.tags.length > 0 && (
              <div className="item-tags">
                {selectedItem.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderShareDialog = () => {
    if (!showShareDialog || !selectedItem) return null;

    return (
      <div className="share-dialog-overlay">
        <div className="share-dialog">
          <div className="share-header">
            <h3>Share "{selectedItem.name}"</h3>
            <button
              onClick={() => setShowShareDialog(false)}
              className="close-btn"
            >
              ×
            </button>
          </div>

          <div className="share-content">
            <div className="share-options">
              <label className="share-option">
                <input
                  type="radio"
                  name="shareType"
                  value="public"
                  defaultChecked={selectedItem.shareSettings.shareType === 'public'}
                />
                <div className="option-info">
                  <span className="option-title">🌐 Public</span>
                  <span className="option-desc">Anyone can view this data</span>
                </div>
              </label>

              <label className="share-option">
                <input
                  type="radio"
                  name="shareType"
                  value="organization"
                  defaultChecked={selectedItem.shareSettings.shareType === 'organization'}
                />
                <div className="option-info">
                  <span className="option-title">🏢 Organization</span>
                  <span className="option-desc">Only organization members can view</span>
                </div>
              </label>

              <label className="share-option">
                <input
                  type="radio"
                  name="shareType"
                  value="specific_users"
                  defaultChecked={selectedItem.shareSettings.shareType === 'specific_users'}
                />
                <div className="option-info">
                  <span className="option-title">👥 Specific Users</span>
                  <span className="option-desc">Only selected users can view</span>
                </div>
              </label>

              <label className="share-option">
                <input
                  type="radio"
                  name="shareType"
                  value="link"
                  defaultChecked={selectedItem.shareSettings.shareType === 'link'}
                />
                <div className="option-info">
                  <span className="option-title">🔗 Link</span>
                  <span className="option-desc">Anyone with the link can view</span>
                </div>
              </label>
            </div>

            <div className="share-permissions">
              <h4>Permissions</h4>
              <label className="permission-option">
                <input
                  type="checkbox"
                  defaultChecked={selectedItem.shareSettings.allowDownload}
                />
                Allow download
              </label>
              <label className="permission-option">
                <input
                  type="checkbox"
                  defaultChecked={selectedItem.shareSettings.allowEdit}
                />
                Allow editing
              </label>
              <label className="permission-option">
                <input
                  type="checkbox"
                  defaultChecked={selectedItem.shareSettings.allowComment}
                />
                Allow comments
              </label>
            </div>

            {selectedItem.shareSettings.shareUrl && (
              <div className="share-link">
                <label>Share Link:</label>
                <div className="link-input">
                  <input
                    type="text"
                    value={selectedItem.shareSettings.shareUrl}
                    readOnly
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedItem.shareSettings.shareUrl || '');
                      addNotification({
                        type: 'success',
                        message: 'Link copied to clipboard',
                        duration: 2000
                      });
                    }}
                    className="copy-btn"
                  >
                    📋
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="share-footer">
            <button
              onClick={() => setShowShareDialog(false)}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              onClick={() => handleShare({
                ...selectedItem.shareSettings,
                isShared: true
              })}
              className="share-btn"
            >
              Update Sharing
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="data-manager-overlay">
      <div className="data-manager">
        <div className="data-manager-header">
          <h2>Data Management</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="data-manager-content">
          <div className="main-content">
            {activeView === 'browser' && (
              <DataBrowser
                onItemSelect={handleItemSelect}
                onItemLoad={handleItemLoad}
                multiSelect={false}
              />
            )}
            {activeView === 'permissions' && selectedItem && (
              <PermissionManager
                itemId={selectedItem.id}
                currentPermissions={selectedItem.permissions}
                onPermissionsChange={handlePermissionsChange}
                onClose={() => setActiveView('browser')}
              />
            )}
            {activeView === 'versions' && selectedItem && (
              <VersionHistory
                itemId={selectedItem.id}
                currentItem={selectedItem}
                onClose={() => setActiveView('browser')}
              />
            )}
          </div>

          {activeView === 'browser' && (
            <div className="sidebar">
              {renderQuickActions()}
            </div>
          )}
        </div>

        {renderShareDialog()}
      </div>
    </div>
  );
};

export default DataManager;