import React, { useState, useCallback, useMemo } from "react";
import {
  useDataStore,
  SavedDataItem,
  DistanceMeasurement,
  ElevationAnalysis,
  PolygonMeasurement,
  InfrastructureData
} from "../../contexts/DataStoreContext";
import { useTempDataState } from "../../hooks/useTempDataState";
import StandardDialog, { ConfirmDialog } from "../common/StandardDialog";
import EnhancedExportManager from "./EnhancedExportManager";
import ImprovedExportManager from "./ImprovedExportManager";
import TempDataViewer from "./TempDataViewer";
import DataMapVisualization from "./DataMapVisualization";
import DataImportManager from "./DataImportManager";

interface EnhancedDataManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onItemLoad?: (item: SavedDataItem) => void;
  onShowOnMap?: (data: any[]) => void;
}

const EnhancedDataManager: React.FC<EnhancedDataManagerProps> = ({
  isOpen,
  onClose,
  onItemLoad,
  onShowOnMap
}) => {
  const {
    allData,
    getDataByType,
    deleteData,
    updateData,
    searchData,
    getDataStats,
    exportData,
    importData,
    generateDataName
  } = useDataStore();

  const { saveTempData } = useTempDataState();

  // UI State
  const [activeTab, setActiveTab] = useState<
    "all" | "distance" | "elevation" | "polygon" | "infrastructure"
  >("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "type" | "size">(
    "date"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Dialog states
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showEnhancedExport, setShowEnhancedExport] = useState(false);
  const [showImprovedExport, setShowImprovedExport] = useState(false);
  const [showTempDataViewer, setShowTempDataViewer] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentItem, setCurrentItem] = useState<SavedDataItem | null>(null);

  // Import tracking state
  const [importedData, setImportedData] = useState<SavedDataItem[]>([]);
  const [showImportedData, setShowImportedData] = useState(true);
  const [showManualData, setShowManualData] = useState(true);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "",
    tags: [] as string[]
  });

  // Get filtered and sorted data
  const filteredData = useMemo(() => {
    let data = searchQuery ? searchData(searchQuery) : allData;

    if (activeTab !== "all") {
      data = data.filter((item) => item.type === activeTab);
    }

    // Filter by data source (imported vs manual)
    data = data.filter((item) => {
      const isImported = item.tags.includes('imported') || item.metadata.source === 'imported';
      const isManual = !isImported;

      if (!showImportedData && isImported) return false;
      if (!showManualData && isManual) return false;

      return true;
    });

    // Sort data
    data.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "date":
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "size":
          comparison = a.metadata.size - b.metadata.size;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return data;
  }, [allData, activeTab, searchQuery, sortBy, sortOrder, searchData, showImportedData, showManualData]);

  const stats = getDataStats();

  // Event handlers
  const handleItemSelect = useCallback((id: string, selected: boolean) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === filteredData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredData.map((item) => item.id)));
    }
  }, [selectedItems.size, filteredData]);

  const handleView = useCallback((item: SavedDataItem) => {
    setCurrentItem(item);
    setShowViewDialog(true);
  }, []);

  const handleEdit = useCallback((item: SavedDataItem) => {
    setCurrentItem(item);
    setEditForm({
      name: item.name,
      description: item.description || "",
      category: item.category,
      tags: [...item.tags]
    });
    setShowEditDialog(true);
  }, []);

  const handleDelete = useCallback((item: SavedDataItem) => {
    setCurrentItem(item);
    setShowDeleteConfirm(true);
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.size === 0) return;

    try {
      for (const itemId of Array.from(selectedItems)) {
        await deleteData(itemId);
      }
      setSelectedItems(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error("Failed to delete items:", error);
    }
  }, [selectedItems, deleteData]);

  const handleMapView = useCallback(() => {
    setShowMapView(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (currentItem) {
      try {
        await deleteData(currentItem.id);
        setShowDeleteConfirm(false);
        setCurrentItem(null);
      } catch (error) {
        console.error("Failed to delete item:", error);
      }
    }
  }, [currentItem, deleteData]);

  // Map visualization handler
  const handleShowOnMap = useCallback(
    (data: any[]) => {
      if (onShowOnMap) {
        onShowOnMap(data);
      }
    },
    [onShowOnMap]
  );

  // Temporary data save handler
  const handleSaveToTempState = useCallback(
    (data: any[], name: string) => {
      saveTempData(data, name, "export", "Enhanced Data Manager");
      alert(`Saved "${name}" to temporary state!`);
    },
    [saveTempData]
  );

  const handleSaveEdit = useCallback(async () => {
    if (currentItem) {
      try {
        await updateData(currentItem.id, {
          name: editForm.name,
          description: editForm.description,
          category: editForm.category,
          tags: editForm.tags
        });
        setShowEditDialog(false);
        setCurrentItem(null);
      } catch (error) {
        console.error("Failed to update item:", error);
      }
    }
  }, [currentItem, editForm, updateData]);

  const handleExport = useCallback(
    async (format: "json" | "csv" | "kml") => {
      try {
        const idsToExport =
          selectedItems.size > 0
            ? Array.from(selectedItems)
            : filteredData.map((item) => item.id);
        const blob = await exportData(idsToExport, format);

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `opticonnect-data-export.${format}`;
        a.click();
        URL.revokeObjectURL(url);

        setShowExportDialog(false);
      } catch (error) {
        console.error("Failed to export data:", error);
      }
    },
    [selectedItems, filteredData, exportData]
  );

  const handleImport = useCallback(
    async (file: File) => {
      try {
        await importData(file);

        // Track imported data for display
        const newImportedData = allData.filter(item =>
          item.tags.includes('imported') || item.metadata.source === 'imported'
        );
        setImportedData(newImportedData);

        // Show imported data on map if callback is provided
        if (onShowOnMap && newImportedData.length > 0) {
          const mapData = newImportedData.map(item => {
            if (item.type === 'infrastructure') {
              const infraData = item as InfrastructureData;
              return infraData.data.locations;
            }
            return null;
          }).filter(Boolean).flat();

          if (mapData.length > 0) {
            onShowOnMap(mapData);
          }
        }

        setShowImportDialog(false);
      } catch (error) {
        console.error("Failed to import data:", error);
      }
    },
    [importData, allData, onShowOnMap]
  );

  const handleLoad = useCallback(
    (item: SavedDataItem) => {
      onItemLoad?.(item);
      onClose();
    },
    [onItemLoad, onClose]
  );

  // Render functions
  const renderItemCard = useCallback(
    (item: SavedDataItem) => {
      const isSelected = selectedItems.has(item.id);
      const typeEmoji = {
        distance: "📏",
        elevation: "⛰️",
        polygon: "🔺",
        infrastructure: "🏗️",
        kml: "🗺️"
      };

      // Source-based styling and badges
      const getSourceInfo = (item: SavedDataItem) => {
        // Determine source from multiple indicators
        const infraData =
          item.type === "infrastructure" || item.type === "kml"
            ? (item as InfrastructureData)
            : null;

        // Check explicit source field first (for infrastructure/kml data)
        const explicitSource = infraData?.source;

        // Check tags for imported data indicators
        const isImported =
          item.tags.includes("imported") ||
          item.tags.includes("csv") ||
          item.tags.includes("excel") ||
          explicitSource === "imported";

        // Check for KML data indicators
        const isKML =
          item.type === "kml" ||
          item.tags.includes("kml") ||
          explicitSource === "kml";

        // Check for manual data indicators
        const isManual =
          item.tags.includes("manual") ||
          explicitSource === "manual" ||
          (!isImported && !isKML);

        if (isKML) {
          return {
            label: "KML Data",
            color: "bg-red-100 text-red-700 border-red-200",
            emoji: "🗺️"
          };
        } else if (isImported) {
          return {
            label: "Imported",
            color: "bg-blue-100 text-blue-700 border-blue-200",
            emoji: "📥"
          };
        } else {
          return {
            label: "Manual",
            color: "bg-green-100 text-green-700 border-green-200",
            emoji: "✏️"
          };
        }
      };

      const sourceInfo = getSourceInfo(item);

      return (
        <div
          key={item.id}
          className={`bg-white rounded-lg border-2 transition-all hover:shadow-lg ${
            isSelected
              ? "border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100"
              : "border-gray-200"
          }`}
        >
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-2xl">{typeEmoji[item.type]}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {item.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border ${sourceInfo.color}`}
                    >
                      {sourceInfo.emoji} {sourceInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {item.type} • {item.category}
                  </p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleView(item)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="View details"
                >
                  👁️
                </button>
                <button
                  onClick={() => handleEdit(item)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleLoad(item)}
                  className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                  title="Load data"
                >
                  📂
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            {item.description && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {item.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{item.updatedAt.toLocaleDateString()}</span>
              <span>
                {item.metadata.size < 1024
                  ? `${item.metadata.size}B`
                  : `${(item.metadata.size / 1024).toFixed(1)}KB`}
              </span>
            </div>

            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{item.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      );
    },
    [
      selectedItems,
      handleItemSelect,
      handleView,
      handleEdit,
      handleLoad,
      handleDelete
    ]
  );

  const renderDataDetails = useCallback((item: SavedDataItem) => {
    switch (item.type) {
      case "distance": {
        const distData = item as DistanceMeasurement;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Distance</h4>
                <p className="text-lg font-bold text-blue-600">
                  {distData.data.totalDistance.toFixed(2)} {distData.data.unit}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Points</h4>
                <p className="text-lg font-bold text-green-600">
                  {distData.data.points.length}
                </p>
              </div>
            </div>
            {distData.notes && (
              <div>
                <h4 className="font-medium text-gray-900">Notes</h4>
                <p className="text-sm text-gray-600">{distData.notes}</p>
              </div>
            )}
          </div>
        );
      }
      case "elevation": {
        const elevData = item as ElevationAnalysis;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Max Elevation</h4>
                <p className="text-lg font-bold text-green-600">
                  {elevData.data.maxElevation.toFixed(0)}m
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Elevation Gain</h4>
                <p className="text-lg font-bold text-blue-600">
                  {elevData.data.elevationGain.toFixed(0)}m
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Distance</h4>
                <p className="text-lg font-bold text-purple-600">
                  {elevData.data.totalDistance.toFixed(2)} {elevData.data.unit}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Avg Grade</h4>
                <p className="text-lg font-bold text-orange-600">
                  {elevData.data.averageGrade.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        );
      }
      case "polygon": {
        const polyData = item as PolygonMeasurement;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Area</h4>
                <p className="text-lg font-bold text-green-600">
                  {polyData.data.area.toFixed(2)}{" "}
                  {polyData.data.unit === "metric" ? "km²" : "mi²"}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Perimeter</h4>
                <p className="text-lg font-bold text-blue-600">
                  {polyData.data.perimeter.toFixed(2)}{" "}
                  {polyData.data.unit === "metric" ? "km" : "mi"}
                </p>
              </div>
            </div>
          </div>
        );
      }
      case "infrastructure":
      case "kml": {
        const infraData = item as InfrastructureData;
        const sourceInfo =
          infraData.source === "manual"
            ? { label: "Manual Entry", color: "green" }
            : infraData.source === "imported"
            ? { label: "Imported Data", color: "blue" }
            : infraData.source === "kml"
            ? { label: "KML Data", color: "red" }
            : { label: "Unknown Source", color: "gray" };

        // Calculate POP and Sub POP counts
        const popCount = infraData.data.locations?.filter(loc => loc.type === 'pop').length || 0;
        const subPopCount = infraData.data.locations?.filter(loc => loc.type === 'subPop').length || 0;
        const otherCount = infraData.data.totalCount - popCount - subPopCount;

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">📍 POP Locations</h4>
                <p className="text-lg font-bold text-red-600">
                  {popCount}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">🏢 Sub POP</h4>
                <p className="text-lg font-bold text-green-600">
                  {subPopCount}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">📊 Other/Manual</h4>
                <p className="text-lg font-bold text-purple-600">
                  {otherCount}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Total Locations</h4>
                <p className="text-lg font-bold text-blue-600">
                  {infraData.data.totalCount}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Categories</h4>
                <p className="text-lg font-bold text-indigo-600">
                  {infraData.data.categories.join(', ') || 'General'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Data Source</h4>
                <div
                  className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-${sourceInfo.color}-100 text-${sourceInfo.color}-700`}
                >
                  {infraData.source === "manual"
                    ? "✏️"
                    : infraData.source === "imported"
                    ? "📥"
                    : "🗺️"}
                  <span className="ml-1">{sourceInfo.label}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Location Categories</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {infraData.data.categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            {infraData.data.locations &&
              infraData.data.locations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900">
                    Sample Locations
                  </h4>
                  <div className="mt-2 space-y-1">
                    {infraData.data.locations
                      .slice(0, 3)
                      .map((location, index) => (
                        <div
                          key={location.id || index}
                          className="text-sm text-gray-600 bg-gray-50 rounded p-2"
                        >
                          <div className="font-medium">{location.name}</div>
                          <div className="text-xs">
                            {location.type?.toUpperCase()} •{" "}
                            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                            {location.status && ` • Status: ${location.status}`}
                          </div>
                        </div>
                      ))}
                    {infraData.data.locations.length > 3 && (
                      <div className="text-xs text-gray-500 pt-1">
                        ... and {infraData.data.locations.length - 3} more
                        locations
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        );
      }
      default:
        return <p className="text-gray-500">No details available</p>;
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300 transition-all transform hover:scale-105 shadow-sm"
            title="Back to Dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Data Collection Hub</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="font-medium">📁 Total: <span className="text-blue-600">{stats.totalItems}</span> items</span>
              <span className="font-medium">💾 Size: <span className="text-purple-600">{(stats.totalSize / 1024).toFixed(1)} KB</span></span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowImportDialog(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 text-sm transition-all transform hover:scale-105 shadow-lg"
          >
            📥 Import Data
          </button>
          <button
            onClick={handleMapView}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg hover:from-indigo-600 hover:to-blue-600 text-sm transition-all transform hover:scale-105 shadow-lg"
          >
            🗺️ Map View
          </button>
            <button
              onClick={() => setShowEnhancedExport(true)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition-colors"
            >
              📤 Basic Export
            </button>
            <button
              onClick={() => setShowImprovedExport(true)}
              className="px-3 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 text-sm transition-colors"
            >
              🚀 Advanced Export
            </button>
            <button
              onClick={() => setShowTempDataViewer(true)}
              className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm transition-colors"
            >
              🗂️ Temp Data
            </button>
            {selectedItems.size > 0 && (
              <button
                onClick={() => setShowBulkActions(true)}
                className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm transition-colors"
              >
                ⚡ Actions ({selectedItems.size})
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 space-y-4">
          {/* Data Source Filter Checkboxes */}
          <div className="flex items-center space-x-6 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center text-sm font-medium text-blue-900">
              <span className="mr-2">📊</span>
              Data Source Filters:
            </div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showManualData}
                onChange={(e) => setShowManualData(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-blue-800 flex items-center">
                <span className="mr-1">✏️</span>
                Show Manual Data
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showImportedData}
                onChange={(e) => setShowImportedData(e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-green-800 flex items-center">
                <span className="mr-1">📥</span>
                Show Imported Data
              </span>
            </label>
            <div className="ml-auto text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              {filteredData.length} items shown
            </div>
          </div>

          {/* Search and View Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">
                  🔍
                </span>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="type">Sort by Type</option>
                <option value="size">Sort by Size</option>
              </select>

              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${
                  viewMode === "grid"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400"
                }`}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${
                  viewMode === "list"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400"
                }`}
              >
                ☰
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1">
            {[
              { key: "all", label: "🔍 All Data", count: stats.totalItems },
              {
                key: "distance",
                label: "📏 Distance",
                count: stats.byType.distance || 0
              },
              {
                key: "elevation",
                label: "⛰️ Elevation",
                count: stats.byType.elevation || 0
              },
              {
                key: "polygon",
                label: "🔺 Polygon",
                count: stats.byType.polygon || 0
              },
              {
                key: "infrastructure",
                label: "🏗️ Infrastructure",
                count:
                  (stats.byType.infrastructure || 0) + (stats.byType.kml || 0)
              }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.key
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Selection Controls */}
          {filteredData.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedItems.size === filteredData.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                {selectedItems.size > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedItems.size} item
                    {selectedItems.size !== 1 ? "s" : ""} selected
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-h-[calc(100vh-16rem)] overflow-y-auto p-6">
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No data found
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : `No ${activeTab === "all" ? "" : activeTab} data available`}
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-2"
              }
            >
              {filteredData.map(renderItemCard)}
            </div>
          )}
        </div>

        {/* View Dialog */}
        <StandardDialog
          isOpen={showViewDialog}
          onClose={() => setShowViewDialog(false)}
          title={`View: ${currentItem?.name}`}
          size="lg"
        >
          {currentItem && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="p-6 space-y-6">
                <div className="border-b pb-4 bg-white rounded-t-lg p-4 shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-3xl">
                      {currentItem.type === "distance"
                        ? "📏"
                        : currentItem.type === "elevation"
                        ? "⛰️"
                        : currentItem.type === "polygon"
                        ? "🔺"
                        : currentItem.type === "kml"
                        ? "🗺️"
                        : "🏗️"}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">
                      {currentItem.name}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-blue-100 rounded-lg p-3">
                      <div className="font-medium text-blue-800">Type</div>
                      <div className="text-blue-600">{currentItem.type}</div>
                    </div>
                    <div className="bg-green-100 rounded-lg p-3">
                      <div className="font-medium text-green-800">Category</div>
                      <div className="text-green-600">
                        {currentItem.category}
                      </div>
                    </div>
                    <div className="bg-purple-100 rounded-lg p-3">
                      <div className="font-medium text-purple-800">Created</div>
                      <div className="text-purple-600">
                        {currentItem.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                    <div className="bg-orange-100 rounded-lg p-3">
                      <div className="font-medium text-orange-800">Updated</div>
                      <div className="text-orange-600">
                        {currentItem.updatedAt.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {currentItem.description && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-800 mb-1">
                        Description
                      </div>
                      <p className="text-gray-700">{currentItem.description}</p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  {renderDataDetails(currentItem)}
                </div>

                <div className="flex justify-end space-x-3 pt-4 bg-white rounded-b-lg p-4 shadow-sm">
                  <button
                    onClick={() => setShowViewDialog(false)}
                    className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleLoad(currentItem)}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                  >
                    Load Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </StandardDialog>

        {/* Edit Dialog */}
        <StandardDialog
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          title={`Edit: ${currentItem?.name}`}
          size="md"
        >
          <div className="bg-gradient-to-br from-green-50 to-blue-50">
            <div className="p-6 space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <label className="block text-sm font-medium text-green-700 mb-2">
                  📝 Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  📄 Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  📁 Category
                </label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      category: e.target.value
                    }))
                  }
                  className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <label className="block text-sm font-medium text-orange-700 mb-2">
                  🏷️ Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editForm.tags.join(", ")}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                    }))
                  }
                  className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 bg-white rounded-lg p-4 shadow-sm">
                <button
                  onClick={() => setShowEditDialog(false)}
                  className="px-6 py-2 text-gray-600 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </StandardDialog>

        {/* Export Dialog */}
        <StandardDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          title="Export Data"
          size="md"
        >
          <div className="p-6 space-y-4">
            <p className="text-gray-700">
              Export{" "}
              {selectedItems.size > 0
                ? selectedItems.size
                : filteredData.length}{" "}
              items
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleExport("json")}
                className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium">JSON Format</div>
                <div className="text-sm text-gray-600">
                  Complete data with all metadata
                </div>
              </button>

              <button
                onClick={() => handleExport("csv")}
                className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium">CSV Format</div>
                <div className="text-sm text-gray-600">
                  Basic metadata for spreadsheets
                </div>
              </button>

              <button
                onClick={() => handleExport("kml")}
                className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium">KML Format</div>
                <div className="text-sm text-gray-600">
                  Geographic data for mapping
                </div>
              </button>
            </div>
          </div>
        </StandardDialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          title="Delete Data"
          message={`Are you sure you want to delete "${currentItem?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="danger"
        />

        {/* Enhanced Export Manager */}
        <EnhancedExportManager
          isOpen={showEnhancedExport}
          onClose={() => setShowEnhancedExport(false)}
          preSelectedItems={Array.from(selectedItems)}
          preSelectedType={activeTab}
        />

        {/* Improved Export Manager */}
        <ImprovedExportManager
          isOpen={showImprovedExport}
          onClose={() => setShowImprovedExport(false)}
          preSelectedItems={Array.from(selectedItems)}
          preSelectedType={activeTab}
          onShowOnMap={handleShowOnMap}
          onSaveToTempState={handleSaveToTempState}
        />

        {/* Temporary Data Viewer */}
        <TempDataViewer
          isOpen={showTempDataViewer}
          onClose={() => setShowTempDataViewer(false)}
          onShowOnMap={handleShowOnMap}
        />

        {/* Data Map Visualization */}
        {showMapView && (
          <DataMapVisualization
            data={filteredData}
            onDataClick={handleView}
            onClose={() => setShowMapView(false)}
          />
        )}

        {/* Import Manager */}
        <DataImportManager
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImportComplete={(count) => {
            console.log(`Imported ${count} items`);
          }}
        />

        {/* Bulk Actions Dialog */}
        <StandardDialog
          isOpen={showBulkActions}
          onClose={() => setShowBulkActions(false)}
          title={`Bulk Actions (${selectedItems.size} items)`}
          size="md"
        >
          <div className="p-6 space-y-4">
            <div className="text-gray-600 mb-4">
              You have selected {selectedItems.size} items. What would you like
              to do?
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowBulkActions(false);
                  setShowImprovedExport(true);
                }}
                className="w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-3"
              >
                <span className="text-2xl">📤</span>
                <div>
                  <div className="font-medium">Export Selected Items</div>
                  <div className="text-sm text-gray-600">
                    Export as JSON, CSV, or KML
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  const selectedData = filteredData.filter((item) =>
                    selectedItems.has(item.id)
                  );
                  setShowMapView(true);
                  setShowBulkActions(false);
                }}
                className="w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-3"
              >
                <span className="text-2xl">🗺️</span>
                <div>
                  <div className="font-medium">View on Map</div>
                  <div className="text-sm text-gray-600">
                    Visualize selected items on map
                  </div>
                </div>
              </button>

              <button
                onClick={handleBulkDelete}
                className="w-full p-3 text-left border border-red-300 rounded-lg hover:bg-red-50 flex items-center space-x-3 text-red-600"
              >
                <span className="text-2xl">🗑️</span>
                <div>
                  <div className="font-medium">Delete Selected Items</div>
                  <div className="text-sm text-red-500">
                    This action cannot be undone
                  </div>
                </div>
              </button>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => setShowBulkActions(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </StandardDialog>
    </div>
  );
};

export default EnhancedDataManager;
