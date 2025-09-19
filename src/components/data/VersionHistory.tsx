import React, { useState, useCallback, useEffect } from 'react';
import { useDataManager } from '../../hooks/useDataManager';
import { useTheme } from '../../hooks/useTheme';
import { DataVersion, SavedDataItem } from '../../types';

interface VersionHistoryProps {
  itemId: string;
  currentItem: SavedDataItem;
  onVersionRestore?: (version: DataVersion) => void;
  onClose: () => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  itemId,
  currentItem,
  onVersionRestore,
  onClose
}) => {
  const { addNotification, setLoading } = useTheme();
  const { hasPermission } = useDataManager();

  const [versions, setVersions] = useState<DataVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<DataVersion | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<[DataVersion | null, DataVersion | null]>([null, null]);

  // Mock version history data
  useEffect(() => {
    const mockVersions: DataVersion[] = [
      {
        id: 'v-1',
        itemId,
        version: 3,
        data: currentItem.data,
        changelog: 'Updated measurement precision and added validation',
        createdAt: new Date().toISOString(),
        createdBy: currentItem.metadata.createdBy,
        size: currentItem.metadata.size
      },
      {
        id: 'v-2',
        itemId,
        version: 2,
        data: { ...currentItem.data, distance: (currentItem.data.distance || 0) * 0.95 },
        changelog: 'Corrected coordinate precision for better accuracy',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        createdBy: currentItem.metadata.createdBy,
        size: currentItem.metadata.size - 100
      },
      {
        id: 'v-3',
        itemId,
        version: 1,
        data: { ...currentItem.data, distance: (currentItem.data.distance || 0) * 0.9 },
        changelog: 'Initial creation',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        createdBy: currentItem.metadata.createdBy,
        size: currentItem.metadata.size - 500
      }
    ];

    setVersions(mockVersions);
  }, [itemId, currentItem]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const handleVersionSelect = useCallback((version: DataVersion) => {
    if (compareMode) {
      setCompareVersions(prev => {
        if (!prev[0]) return [version, null];
        if (!prev[1]) return [prev[0], version];
        return [version, null]; // Reset if both are selected
      });
    } else {
      setSelectedVersion(selectedVersion?.id === version.id ? null : version);
    }
  }, [compareMode, selectedVersion]);

  const handleRestore = useCallback(async (version: DataVersion) => {
    if (!hasPermission(currentItem, 'edit')) {
      addNotification({
        type: 'error',
        message: 'You do not have permission to restore versions',
        duration: 5000
      });
      return;
    }

    setLoading('restoreVersion', true, 'Restoring version...');

    try {
      // Simulate version restore
      await new Promise(resolve => setTimeout(resolve, 1000));

      onVersionRestore?.(version);
      addNotification({
        type: 'success',
        message: `Restored to version ${version.version}`,
        duration: 3000
      });
      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to restore version',
        duration: 5000
      });
    } finally {
      setLoading('restoreVersion', false);
    }
  }, [currentItem, hasPermission, onVersionRestore, addNotification, setLoading, onClose]);

  const renderDataPreview = (data: any) => {
    return (
      <div className="data-preview">
        <pre className="data-content">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  const renderComparison = () => {
    const [version1, version2] = compareVersions;
    if (!version1 || !version2) return null;

    return (
      <div className="version-comparison">
        <div className="comparison-header">
          <h3>Comparing Versions</h3>
          <button
            onClick={() => {
              setCompareMode(false);
              setCompareVersions([null, null]);
            }}
            className="close-compare-btn"
          >
            ×
          </button>
        </div>

        <div className="comparison-content">
          <div className="version-side">
            <div className="version-info">
              <h4>Version {version1.version}</h4>
              <p>{formatDate(version1.createdAt)}</p>
              <p>{formatFileSize(version1.size)}</p>
            </div>
            {renderDataPreview(version1.data)}
          </div>

          <div className="comparison-divider">
            <div className="divider-line"></div>
            <span className="divider-icon">⚄</span>
          </div>

          <div className="version-side">
            <div className="version-info">
              <h4>Version {version2.version}</h4>
              <p>{formatDate(version2.createdAt)}</p>
              <p>{formatFileSize(version2.size)}</p>
            </div>
            {renderDataPreview(version2.data)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="version-history-overlay">
      <div className="version-history">
        <div className="version-header">
          <div className="header-info">
            <h2>Version History</h2>
            <p className="item-name">{currentItem.name}</p>
          </div>
          <div className="header-actions">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`compare-btn ${compareMode ? 'active' : ''}`}
            >
              {compareMode ? '⚄ Comparing' : '⚃ Compare'}
            </button>
            <button onClick={onClose} className="close-btn">×</button>
          </div>
        </div>

        <div className="version-content">
          {compareMode && compareVersions[0] && compareVersions[1] ? (
            renderComparison()
          ) : (
            <>
              <div className="version-list">
                <div className="list-header">
                  <h3>Versions ({versions.length})</h3>
                  {compareMode && (
                    <p className="compare-instruction">
                      Select two versions to compare
                      {compareVersions[0] && ` (${compareVersions.filter(Boolean).length}/2 selected)`}
                    </p>
                  )}
                </div>

                <div className="versions">
                  {versions.map((version, index) => {
                    const isSelected = selectedVersion?.id === version.id;
                    const isCompareSelected = compareVersions.some(v => v?.id === version.id);
                    const isCurrent = index === 0;

                    return (
                      <div
                        key={version.id}
                        className={`version-item ${isSelected ? 'selected' : ''} ${isCompareSelected ? 'compare-selected' : ''} ${isCurrent ? 'current' : ''}`}
                        onClick={() => handleVersionSelect(version)}
                      >
                        <div className="version-main">
                          <div className="version-badge">
                            <span className="version-number">v{version.version}</span>
                            {isCurrent && <span className="current-tag">Current</span>}
                          </div>

                          <div className="version-details">
                            <div className="version-meta">
                              <span className="version-date">{formatDate(version.createdAt)}</span>
                              <span className="version-author">by {version.createdBy}</span>
                              <span className="version-time">{getTimeSince(version.createdAt)}</span>
                            </div>

                            <div className="version-changelog">
                              {version.changelog}
                            </div>

                            <div className="version-stats">
                              <span className="version-size">{formatFileSize(version.size)}</span>
                              {index > 0 && (
                                <span className="size-diff">
                                  {version.size > versions[index - 1].size ? '+' : ''}
                                  {formatFileSize(version.size - versions[index - 1].size)}
                                </span>
                              )}
                            </div>
                          </div>

                          {!compareMode && (
                            <div className="version-actions">
                              {!isCurrent && hasPermission(currentItem, 'edit') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRestore(version);
                                  }}
                                  className="restore-btn"
                                  title="Restore this version"
                                >
                                  ↺ Restore
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVersion(isSelected ? null : version);
                                }}
                                className="preview-btn"
                                title="Preview this version"
                              >
                                👁️ Preview
                              </button>
                            </div>
                          )}

                          {compareMode && (
                            <div className="compare-checkbox">
                              <input
                                type="checkbox"
                                checked={isCompareSelected}
                                onChange={() => handleVersionSelect(version)}
                                disabled={!isCompareSelected && compareVersions.filter(Boolean).length >= 2}
                              />
                            </div>
                          )}
                        </div>

                        {isSelected && !compareMode && (
                          <div className="version-preview">
                            <h4>Data Preview</h4>
                            {renderDataPreview(version.data)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {!compareMode && (
          <div className="version-footer">
            <div className="footer-info">
              <span className="total-versions">{versions.length} versions total</span>
              {selectedVersion && (
                <span className="selected-info">
                  Version {selectedVersion.version} selected
                </span>
              )}
            </div>
            <button onClick={onClose} className="done-btn">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;