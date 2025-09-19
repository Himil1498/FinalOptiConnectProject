import React, { useState, useCallback, useEffect } from 'react';
import { useDataManager } from '../../hooks/useDataManager';
import { useTheme } from '../../hooks/useTheme';
import { DataFilter, DataSort, SavedDataItem } from '../../types';

interface DataBrowserProps {
  onItemSelect?: (item: SavedDataItem) => void;
  onItemLoad?: (item: SavedDataItem) => void;
  multiSelect?: boolean;
  filterType?: SavedDataItem['type'][];
}

const DataBrowser: React.FC<DataBrowserProps> = ({
  onItemSelect,
  onItemLoad,
  multiSelect = false,
  filterType
}) => {
  const { uiState } = useTheme();
  const {
    items,
    folders,
    selectedItems,
    loading,
    searchData,
    deleteData,
    shareData,
    hasPermission
  } = useDataManager();

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DataFilter>({
    type: filterType || undefined
  });
  const [sort, setSort] = useState<DataSort>({
    field: 'updatedAt',
    direction: 'desc'
  });
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'table'>('list');
  const [searchResults, setSearchResults] = useState(items);
  const [localSelectedItems, setLocalSelectedItems] = useState<string[]>([]);

  // Perform search when query or filters change
  useEffect(() => {
    const performSearch = async () => {
      const result = await searchData({
        query: searchQuery,
        filters,
        sort,
        pagination: { page: 1, limit: 50 }
      });
      setSearchResults(result.items);
    };

    performSearch();
  }, [searchQuery, filters, sort, searchData]);

  const handleItemClick = useCallback((item: SavedDataItem) => {
    if (multiSelect) {
      setLocalSelectedItems(prev => {
        const isSelected = prev.includes(item.id);
        const newSelection = isSelected
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id];
        return newSelection;
      });
    } else {
      setLocalSelectedItems([item.id]);
    }
    onItemSelect?.(item);
  }, [multiSelect, onItemSelect]);

  const handleItemDoubleClick = useCallback((item: SavedDataItem) => {
    if (hasPermission(item, 'view')) {
      onItemLoad?.(item);
    }
  }, [hasPermission, onItemLoad]);

  const handleDelete = useCallback(async () => {
    if (localSelectedItems.length > 0) {
      await deleteData(localSelectedItems);
      setLocalSelectedItems([]);
    }
  }, [localSelectedItems, deleteData]);

  const getItemIcon = (type: SavedDataItem['type']) => {
    switch (type) {
      case 'distance': return '📏';
      case 'polygon': return '🔷';
      case 'elevation': return '🏔️';
      case 'infrastructure': return '🏗️';
      case 'custom': return '📄';
      default: return '📄';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="data-browser">
      {/* Header */}
      <div className="data-browser-header">
        <div className="data-browser-title">
          <h2>Data Browser</h2>
          <span className="item-count">{searchResults.length} items</span>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <input
            type="search"
            placeholder="Search data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* View Controls */}
        <div className="view-controls">
          <div className="view-mode-selector">
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              📋
            </button>
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="data-browser-filters">
        <div className="filter-group">
          <label>Type:</label>
          <select
            value={filters.type?.[0] || 'all'}
            onChange={(e) => {
              const value = e.target.value;
              setFilters(prev => ({
                ...prev,
                type: value === 'all' ? undefined : [value as SavedDataItem['type']]
              }));
            }}
          >
            <option value="all">All Types</option>
            <option value="distance">Distance</option>
            <option value="polygon">Polygon</option>
            <option value="elevation">Elevation</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort by:</label>
          <select
            value={sort.field}
            onChange={(e) => setSort(prev => ({ ...prev, field: e.target.value as DataSort['field'] }))}
          >
            <option value="updatedAt">Last Modified</option>
            <option value="createdAt">Created Date</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="type">Type</option>
          </select>
          <button
            className="sort-direction-btn"
            onClick={() => setSort(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
            title={`Sort ${sort.direction === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sort.direction === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {localSelectedItems.length > 0 && (
          <div className="bulk-actions">
            <span className="selected-count">{localSelectedItems.length} selected</span>
            <button
              className="bulk-action-btn delete"
              onClick={handleDelete}
              title="Delete Selected"
            >
              🗑️ Delete
            </button>
            <button
              className="bulk-action-btn share"
              title="Share Selected"
            >
              🔗 Share
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`data-browser-content ${viewMode}`}>
        {loading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>Loading...</span>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3>No data found</h3>
            <p>Try adjusting your search criteria or create new data.</p>
          </div>
        ) : viewMode === 'table' ? (
          <table className="data-table">
            <thead>
              <tr>
                {multiSelect && <th className="checkbox-col"></th>}
                <th>Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Modified</th>
                <th>Owner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((item) => (
                <tr
                  key={item.id}
                  className={`data-row ${localSelectedItems.includes(item.id) ? 'selected' : ''}`}
                  onClick={() => handleItemClick(item)}
                  onDoubleClick={() => handleItemDoubleClick(item)}
                >
                  {multiSelect && (
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={localSelectedItems.includes(item.id)}
                        onChange={() => handleItemClick(item)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  <td className="name-col">
                    <span className="item-icon">{getItemIcon(item.type)}</span>
                    <div className="item-info">
                      <div className="item-name">{item.name}</div>
                      {item.description && (
                        <div className="item-description">{item.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="type-col">
                    <span className="type-badge">{item.type}</span>
                  </td>
                  <td className="size-col">{formatFileSize(item.metadata.size)}</td>
                  <td className="date-col">{formatDate(item.metadata.updatedAt)}</td>
                  <td className="owner-col">{item.metadata.createdBy}</td>
                  <td className="actions-col">
                    <div className="action-buttons">
                      {hasPermission(item, 'view') && (
                        <button
                          className="action-btn view"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemDoubleClick(item);
                          }}
                          title="Load Data"
                        >
                          👁️
                        </button>
                      )}
                      {hasPermission(item, 'share') && (
                        <button
                          className="action-btn share"
                          title="Share"
                        >
                          🔗
                        </button>
                      )}
                      {hasPermission(item, 'delete') && (
                        <button
                          className="action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteData([item.id]);
                          }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={`data-items ${viewMode}`}>
            {searchResults.map((item) => (
              <div
                key={item.id}
                className={`data-item ${localSelectedItems.includes(item.id) ? 'selected' : ''}`}
                onClick={() => handleItemClick(item)}
                onDoubleClick={() => handleItemDoubleClick(item)}
              >
                {multiSelect && (
                  <input
                    type="checkbox"
                    className="item-checkbox"
                    checked={localSelectedItems.includes(item.id)}
                    onChange={() => handleItemClick(item)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}

                <div className="item-icon-large">{getItemIcon(item.type)}</div>

                <div className="item-details">
                  <h3 className="item-title">{item.name}</h3>
                  {item.description && (
                    <p className="item-desc">{item.description}</p>
                  )}

                  <div className="item-meta">
                    <span className="item-type">{item.type}</span>
                    <span className="item-size">{formatFileSize(item.metadata.size)}</span>
                    <span className="item-date">{formatDate(item.metadata.updatedAt)}</span>
                  </div>

                  {item.tags.length > 0 && (
                    <div className="item-tags">
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="tag-more">+{item.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {item.shareSettings.isShared && (
                    <div className="item-sharing">
                      <span className="share-indicator">🔗 Shared</span>
                    </div>
                  )}
                </div>

                <div className="item-actions">
                  {hasPermission(item, 'view') && (
                    <button
                      className="action-btn view"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemDoubleClick(item);
                      }}
                      title="Load Data"
                    >
                      👁️
                    </button>
                  )}
                  {hasPermission(item, 'share') && (
                    <button className="action-btn share" title="Share">🔗</button>
                  )}
                  {hasPermission(item, 'delete') && (
                    <button
                      className="action-btn delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteData([item.id]);
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataBrowser;