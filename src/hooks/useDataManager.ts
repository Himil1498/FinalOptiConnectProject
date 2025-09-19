import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useTheme } from './useTheme';
import {
  SavedDataItem,
  DataFilter,
  DataSort,
  DataSearchQuery,
  DataSearchResult,
  DataVersion,
  DataFolder,
  DataBulkOperation,
  DataPermissions,
  DataShareSettings,
  DataComment,
  DataAnalytics,
  DataExportOptions,
  DataImportOptions,
  DataSyncStatus
} from '../types';

interface DataManagerState {
  items: SavedDataItem[];
  folders: DataFolder[];
  versions: Record<string, DataVersion[]>;
  bulkOperations: DataBulkOperation[];
  comments: Record<string, DataComment[]>;
  analytics: Record<string, DataAnalytics>;
  syncStatus: DataSyncStatus;
  selectedItems: string[];
  currentFolder: string | null;
  loading: boolean;
  error: string | null;
}

export const useDataManager = () => {
  const { user } = useAuth();
  const { addNotification, setLoading } = useTheme();

  const [state, setState] = useState<DataManagerState>({
    items: [],
    folders: [],
    versions: {},
    bulkOperations: [],
    comments: {},
    analytics: {},
    syncStatus: {
      isOnline: true,
      pendingChanges: 0,
      conflictCount: 0,
      syncInProgress: false
    },
    selectedItems: [],
    currentFolder: null,
    loading: false,
    error: null
  });

  // Mock data for development
  const mockFolders: DataFolder[] = [
    {
      id: 'folder-1',
      name: 'Distance Measurements',
      description: 'All distance measurement data',
      path: ['Distance Measurements'],
      createdAt: new Date().toISOString(),
      createdBy: user?.id || 'admin',
      permissions: {
        owner: user?.id || 'admin',
        viewers: [],
        editors: [],
        canDelete: [],
        canShare: []
      },
      itemCount: 5,
      subfolderCount: 2
    },
    {
      id: 'folder-2',
      name: 'Polygon Areas',
      description: 'Polygon and area calculations',
      path: ['Polygon Areas'],
      createdAt: new Date().toISOString(),
      createdBy: user?.id || 'admin',
      permissions: {
        owner: user?.id || 'admin',
        viewers: [],
        editors: [],
        canDelete: [],
        canShare: []
      },
      itemCount: 8,
      subfolderCount: 0
    }
  ];

  const mockItems: SavedDataItem[] = [
    {
      id: 'item-1',
      name: 'Mumbai-Delhi Route Distance',
      description: 'Distance measurement between Mumbai and Delhi',
      type: 'distance',
      data: {
        points: [
          { lat: 19.0760, lng: 72.8777 },
          { lat: 28.7041, lng: 77.1025 }
        ],
        distance: 1411.2,
        unit: 'km'
      },
      metadata: {
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.id || 'admin',
        version: 1,
        size: 2048,
        coordinates: { lat: 23.8903, lng: 74.9900 }
      },
      permissions: {
        owner: user?.id || 'admin',
        viewers: ['user1', 'user2'],
        editors: ['user1'],
        canDelete: [user?.id || 'admin'],
        canShare: [user?.id || 'admin', 'user1']
      },
      tags: ['transport', 'main-routes', 'cities'],
      category: 'Infrastructure',
      isPublic: false,
      shareSettings: {
        isShared: true,
        shareType: 'organization',
        sharedWith: ['user1', 'user2'],
        allowDownload: true,
        allowEdit: false,
        allowComment: true
      }
    },
    {
      id: 'item-2',
      name: 'Maharashtra Coverage Area',
      description: 'Coverage polygon for Maharashtra state',
      type: 'polygon',
      data: {
        coordinates: [
          [
            [72.6369, 20.1204],
            [80.0884, 20.1204],
            [80.0884, 15.6024],
            [72.6369, 15.6024],
            [72.6369, 20.1204]
          ]
        ],
        area: 307713.0,
        unit: 'km²'
      },
      metadata: {
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        createdBy: user?.id || 'admin',
        version: 2,
        size: 4096,
        bounds: {
          north: 20.1204,
          south: 15.6024,
          east: 80.0884,
          west: 72.6369
        }
      },
      permissions: {
        owner: user?.id || 'admin',
        viewers: ['user1', 'user2', 'user3'],
        editors: ['user1', 'user2'],
        canDelete: [user?.id || 'admin'],
        canShare: [user?.id || 'admin']
      },
      tags: ['state', 'coverage', 'maharashtra'],
      category: 'Regions',
      isPublic: true,
      shareSettings: {
        isShared: true,
        shareType: 'public',
        sharedWith: [],
        allowDownload: true,
        allowEdit: false,
        allowComment: true
      }
    }
  ];

  // Initialize mock data
  useEffect(() => {
    setState(prev => ({
      ...prev,
      items: mockItems,
      folders: mockFolders
    }));
  }, [user?.id]);

  const saveData = useCallback(async (
    type: SavedDataItem['type'],
    name: string,
    data: any,
    options: {
      description?: string;
      tags?: string[];
      category?: string;
      folderId?: string;
      permissions?: Partial<DataPermissions>;
    } = {}
  ): Promise<string> => {
    setLoading('saveData', true, 'Saving data...');

    try {
      const newItem: SavedDataItem = {
        id: `item-${Date.now()}`,
        name,
        description: options.description,
        type,
        data,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: user?.id || 'anonymous',
          version: 1,
          size: JSON.stringify(data).length
        },
        permissions: {
          owner: user?.id || 'anonymous',
          viewers: options.permissions?.viewers || [],
          editors: options.permissions?.editors || [],
          canDelete: options.permissions?.canDelete || [user?.id || 'anonymous'],
          canShare: options.permissions?.canShare || [user?.id || 'anonymous']
        },
        tags: options.tags || [],
        category: options.category,
        isPublic: false,
        shareSettings: {
          isShared: false,
          shareType: 'specific_users',
          sharedWith: [],
          allowDownload: false,
          allowEdit: false,
          allowComment: false
        }
      };

      setState(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));

      addNotification({
        type: 'success',
        message: `${name} saved successfully`,
        duration: 3000
      });

      return newItem.id;
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to save data',
        duration: 5000
      });
      throw error;
    } finally {
      setLoading('saveData', false);
    }
  }, [user?.id, setLoading, addNotification]);

  const loadData = useCallback(async (itemId: string): Promise<SavedDataItem | null> => {
    setLoading('loadData', true, 'Loading data...');

    try {
      const item = state.items.find(item => item.id === itemId);

      if (!item) {
        throw new Error('Data not found');
      }

      // Check permissions
      if (!hasPermission(item, 'view')) {
        throw new Error('Permission denied');
      }

      // Update analytics
      updateAnalytics(itemId, 'view');

      return item;
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to load data',
        duration: 5000
      });
      return null;
    } finally {
      setLoading('loadData', false);
    }
  }, [state.items, addNotification, setLoading]);

  const searchData = useCallback(async (query: DataSearchQuery): Promise<DataSearchResult> => {
    setLoading('searchData', true, 'Searching...');

    try {
      let filteredItems = [...state.items];

      // Apply text search
      if (query.query) {
        const searchTerms = query.query.toLowerCase().split(' ');
        filteredItems = filteredItems.filter(item =>
          searchTerms.every(term =>
            item.name.toLowerCase().includes(term) ||
            item.description?.toLowerCase().includes(term) ||
            item.tags.some(tag => tag.toLowerCase().includes(term))
          )
        );
      }

      // Apply filters
      if (query.filters.type && query.filters.type.length > 0) {
        filteredItems = filteredItems.filter(item => query.filters.type!.includes(item.type));
      }

      if (query.filters.createdBy && query.filters.createdBy.length > 0) {
        filteredItems = filteredItems.filter(item =>
          query.filters.createdBy!.includes(item.metadata.createdBy)
        );
      }

      if (query.filters.tags && query.filters.tags.length > 0) {
        filteredItems = filteredItems.filter(item =>
          query.filters.tags!.some(tag => item.tags.includes(tag))
        );
      }

      if (query.filters.hasPermission) {
        filteredItems = filteredItems.filter(item =>
          hasPermission(item, query.filters.hasPermission!)
        );
      }

      // Apply sorting
      filteredItems.sort((a, b) => {
        const field = query.sort.field;
        const direction = query.sort.direction === 'asc' ? 1 : -1;

        let aValue: any, bValue: any;
        if (field === 'createdAt' || field === 'updatedAt') {
          aValue = new Date(a.metadata[field]).getTime();
          bValue = new Date(b.metadata[field]).getTime();
        } else if (field === 'size') {
          aValue = a.metadata.size;
          bValue = b.metadata.size;
        } else if (field === 'createdBy') {
          aValue = a.metadata.createdBy;
          bValue = b.metadata.createdBy;
        } else {
          aValue = a[field];
          bValue = b[field];
        }

        if (aValue < bValue) return -1 * direction;
        if (aValue > bValue) return 1 * direction;
        return 0;
      });

      // Apply pagination
      const startIndex = (query.pagination.page - 1) * query.pagination.limit;
      const endIndex = startIndex + query.pagination.limit;
      const paginatedItems = filteredItems.slice(startIndex, endIndex);

      // Calculate aggregations
      const aggregations = {
        byType: filteredItems.reduce((acc, item) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byCreator: filteredItems.reduce((acc, item) => {
          acc[item.metadata.createdBy] = (acc[item.metadata.createdBy] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byTag: filteredItems.reduce((acc, item) => {
          item.tags.forEach(tag => {
            acc[tag] = (acc[tag] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>),
        byCategory: filteredItems.reduce((acc, item) => {
          if (item.category) {
            acc[item.category] = (acc[item.category] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      };

      return {
        items: paginatedItems,
        totalCount: filteredItems.length,
        page: query.pagination.page,
        totalPages: Math.ceil(filteredItems.length / query.pagination.limit),
        hasMore: endIndex < filteredItems.length,
        aggregations
      };
    } finally {
      setLoading('searchData', false);
    }
  }, [state.items, setLoading]);

  const deleteData = useCallback(async (itemIds: string[]): Promise<void> => {
    setLoading('deleteData', true, `Deleting ${itemIds.length} item(s)...`);

    try {
      // Check permissions for all items
      const itemsToDelete = state.items.filter(item => itemIds.includes(item.id));
      const unauthorizedItems = itemsToDelete.filter(item => !hasPermission(item, 'delete'));

      if (unauthorizedItems.length > 0) {
        throw new Error(`Permission denied for ${unauthorizedItems.length} item(s)`);
      }

      setState(prev => ({
        ...prev,
        items: prev.items.filter(item => !itemIds.includes(item.id))
      }));

      addNotification({
        type: 'success',
        message: `${itemIds.length} item(s) deleted successfully`,
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete items',
        duration: 5000
      });
    } finally {
      setLoading('deleteData', false);
    }
  }, [state.items, addNotification, setLoading]);

  const shareData = useCallback(async (
    itemId: string,
    shareSettings: Partial<DataShareSettings>
  ): Promise<void> => {
    setLoading('shareData', true, 'Updating share settings...');

    try {
      const item = state.items.find(item => item.id === itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      if (!hasPermission(item, 'share')) {
        throw new Error('Permission denied');
      }

      setState(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId
            ? { ...item, shareSettings: { ...item.shareSettings, ...shareSettings } }
            : item
        )
      }));

      addNotification({
        type: 'success',
        message: 'Share settings updated',
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update share settings',
        duration: 5000
      });
    } finally {
      setLoading('shareData', false);
    }
  }, [state.items, addNotification, setLoading]);

  const hasPermission = useCallback((item: SavedDataItem, permission: 'view' | 'edit' | 'delete' | 'share'): boolean => {
    const userId = user?.id || 'anonymous';

    // Owner has all permissions
    if (item.permissions.owner === userId) {
      return true;
    }

    // Check specific permissions
    switch (permission) {
      case 'view':
        return item.isPublic ||
               item.permissions.viewers.includes(userId) ||
               item.permissions.editors.includes(userId);
      case 'edit':
        return item.permissions.editors.includes(userId);
      case 'delete':
        return item.permissions.canDelete.includes(userId);
      case 'share':
        return item.permissions.canShare.includes(userId);
      default:
        return false;
    }
  }, [user?.id]);

  const updateAnalytics = useCallback((itemId: string, action: 'view' | 'edit' | 'download' | 'share') => {
    setState(prev => ({
      ...prev,
      analytics: {
        ...prev.analytics,
        [itemId]: {
          ...prev.analytics[itemId],
          itemId,
          views: action === 'view' ? (prev.analytics[itemId]?.views || 0) + 1 : (prev.analytics[itemId]?.views || 0),
          downloads: action === 'download' ? (prev.analytics[itemId]?.downloads || 0) + 1 : (prev.analytics[itemId]?.downloads || 0),
          shares: action === 'share' ? (prev.analytics[itemId]?.shares || 0) + 1 : (prev.analytics[itemId]?.shares || 0),
          comments: prev.analytics[itemId]?.comments || 0,
          lastAccessed: new Date().toISOString(),
          accessHistory: [
            ...(prev.analytics[itemId]?.accessHistory || []),
            {
              userId: user?.id || 'anonymous',
              timestamp: new Date().toISOString(),
              action
            }
          ].slice(-100) // Keep last 100 entries
        }
      }
    }));
  }, [user?.id]);

  return {
    ...state,
    saveData,
    loadData,
    searchData,
    deleteData,
    shareData,
    hasPermission,
    updateAnalytics
  };
};