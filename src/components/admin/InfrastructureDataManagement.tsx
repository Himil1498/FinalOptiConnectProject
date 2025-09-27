import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useInfrastructureData } from "../../hooks/useInfrastructureData";
import { InfrastructureCategory, Coordinates, User } from "../../types";
import {
  InfrastructureItem,
  InfrastructureFilter
} from "../../hooks/useInfrastructureData";
import { ExportUtils, ExportFormat } from "../../utils/exportUtils";
import {
  useDataStore,
  InfrastructureData
} from "../../contexts/DataStoreContext";
import AddPOPLocationForm, { POPLocationData } from "../map/AddPOPLocationForm";
import InfrastructureDataTable from "./infrastructure/InfrastructureDataTable";
import InfrastructureFilters from "./infrastructure/InfrastructureFilters";
import InfrastructureAddForm from "./infrastructure/InfrastructureAddForm";
import KMLDataTab from "./infrastructure/KMLDataTab";
import InfrastructureCategoriesTab from "./infrastructure/InfrastructureCategoriesTab";
import InfrastructureReportsTab from "./infrastructure/InfrastructureReportsTab";

export interface InfrastructureDataManagementProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  userRole: User["role"];
  kmlData?: any[];
  toggleKMLLayer?: (layerName: string) => void;
  isKMLLayerVisible?: (layerName: string) => boolean;
  map?: google.maps.Map | null;
  onLocationAdd?: (location: POPLocationData) => void;
}

const InfrastructureDataManagement: React.FC<
  InfrastructureDataManagementProps
> = ({
  isOpen,
  onClose,
  currentUserId,
  userRole,
  kmlData = [],
  toggleKMLLayer,
  isKMLLayerVisible,
  map,
  onLocationAdd
}) => {
  const { addNotification } = useTheme();
  const { saveData, generateDataName, getDataByType } = useDataStore();

  // Use our custom hook for infrastructure data management
  const infrastructureHook = useInfrastructureData();
  const {
    data: filteredData,
    allData,
    filters,
    selectedItems,
    setSelectedItems,
    updateFilter,
    addItem,
    updateItem,
    deleteItem,
    bulkDelete,
    setData
  } = infrastructureHook;

  // Local state for UI management
  const [activeTab, setActiveTab] = useState<
    "data" | "add" | "categories" | "reports" | "kml"
  >("data");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InfrastructureItem | null>(
    null
  );
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] =
    useState<Coordinates | null>(null);
  const [formData, setFormData] = useState<Partial<InfrastructureItem>>({});
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showExportFormatModal, setShowExportFormatModal] = useState(false);
  const [exportType, setExportType] = useState<"bulk" | "single">("bulk");
  const [showSaveToDataManagerModal, setShowSaveToDataManagerModal] =
    useState(false);
  const [selectedSaveCategory, setSelectedSaveCategory] =
    useState("Infrastructure");

  // KML Data state
  const [kmlSearchTerm, setKmlSearchTerm] = useState("");
  const [kmlTypeFilter, setKmlTypeFilter] = useState<"all" | "pop" | "subPop">(
    "all"
  );

  // Advanced search state
  const [advancedFilters, setAdvancedFilters] = useState({
    name: "",
    type: "all" as "all" | "pop" | "subPop",
    status: "all",
    dateRange: "all",
    latMin: "",
    latMax: "",
    lngMin: "",
    lngMax: "",
    hasProperties: "all",
    source: "all"
  });

  // Map layer visibility state
  const [showPOPData, setShowPOPData] = useState(false);
  const [showSubPOPData, setShowSubPOPData] = useState(false);
  const [showManualData, setShowManualData] = useState(true);
  const [showImportedData, setShowImportedData] = useState(true);

  // Imported data state
  const [importedData, setImportedData] = useState<any[]>([]);

  // Manual data from DataStore
  const [manualInfrastructureData, setManualInfrastructureData] = useState<
    any[]
  >([]);

  // Fetch manual and imported infrastructure data from DataStore
  useEffect(() => {
    const fetchDataFromStore = () => {
      try {
        const infrastructureData = getDataByType("infrastructure");
        const kmlData = getDataByType("kml");
        const allInfraData = [...infrastructureData, ...kmlData];

        // Filter manual data
        const manualData = allInfraData.filter((item) => {
          const infraItem = item as InfrastructureData;
          return infraItem.source === "manual" || item.tags.includes("manual");
        });

        // Filter imported data
        const importedDataItems = allInfraData.filter((item) => {
          const infraItem = item as InfrastructureData;
          return (
            infraItem.source === "imported" || item.tags.includes("imported")
          );
        });

        // Convert manual data to format compatible with KML data display
        const convertedManualData = manualData.flatMap((item) => {
          const infraItem = item as InfrastructureData;
          return infraItem.data.locations.map((location) => ({
            id: location.id,
            name: location.name,
            type: location.type,
            lat: location.lat,
            lng: location.lng,
            coordinates: { lat: location.lat, lng: location.lng },
            extendedData: {
              status: location.status || "active",
              isManuallyAdded: true,
              originalDataId: item.id,
              ...location.properties
            },
            description: `Manual ${location.type.toUpperCase()} location`,
            source: "manual"
          }));
        });

        // Convert imported data to format compatible with KML data display
        const convertedImportedData = importedDataItems.flatMap((item) => {
          const infraItem = item as InfrastructureData;
          return infraItem.data.locations.map((location) => ({
            id: location.id,
            name: location.name,
            type: location.type,
            lat: location.lat,
            lng: location.lng,
            coordinates: { lat: location.lat, lng: location.lng },
            extendedData: {
              status: location.status || "active",
              isImported: true,
              originalDataId: item.id,
              ...location.properties
            },
            description: `Imported ${location.type.toUpperCase()} location`,
            source: "imported",
            fileType: infraItem.type // Keep track of file type
          }));
        });

        setManualInfrastructureData(convertedManualData);
        setImportedData(convertedImportedData);

        console.log("Loaded manual data:", convertedManualData.length, "items");
        console.log(
          "Loaded imported data:",
          convertedImportedData.length,
          "items"
        );
      } catch (error) {
        console.error(
          "Failed to fetch infrastructure data from DataStore:",
          error
        );
      }
    };

    fetchDataFromStore();

    // Set up interval to refresh data periodically
    const interval = setInterval(fetchDataFromStore, 5000);
    return () => clearInterval(interval);
  }, [getDataByType]);

  // Sync checkbox states with actual KML layer visibility
  useEffect(() => {
    if (isKMLLayerVisible) {
      const popVisible = isKMLLayerVisible("pop");
      const subPopVisible = isKMLLayerVisible("subPop");

      if (popVisible !== showPOPData) {
        setShowPOPData(popVisible);
      }
      if (subPopVisible !== showSubPOPData) {
        setShowSubPOPData(subPopVisible);
      }

      console.log(
        "Syncing visibility - POP:",
        popVisible,
        "SubPOP:",
        subPopVisible
      );
    }
  }, [isKMLLayerVisible, showPOPData, showSubPOPData]);

  // Map interaction state
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [pendingCoordinates, setPendingCoordinates] =
    useState<Coordinates | null>(null);
  const [showAddLocationForm, setShowAddLocationForm] = useState(false);
  const [mapClickListener, setMapClickListener] =
    useState<google.maps.MapsEventListener | null>(null);

  // Mock categories data
  const categories: any[] = useMemo(
    () => [
      {
        id: "network",
        name: "Network Infrastructure",
        icon: "🌐",
        description: "Core network components and connectivity",
        subCategories: [
          {
            id: "fiber",
            name: "Fiber Optic Cables",
            attributes: { priority: "high", count: 45 }
          },
          {
            id: "switches",
            name: "Network Switches",
            attributes: { priority: "high", count: 23 }
          },
          {
            id: "routers",
            name: "Core Routers",
            attributes: { priority: "critical", count: 12 }
          }
        ]
      },
      {
        id: "power",
        name: "Power Systems",
        icon: "⚡",
        description: "Power supply and backup systems",
        subCategories: [
          {
            id: "ups",
            name: "UPS Systems",
            attributes: { priority: "critical", count: 18 }
          },
          {
            id: "generators",
            name: "Backup Generators",
            attributes: { priority: "high", count: 8 }
          },
          {
            id: "solar",
            name: "Solar Panels",
            attributes: { priority: "medium", count: 15 }
          }
        ]
      },
      {
        id: "transmission",
        name: "Transmission Equipment",
        icon: "📡",
        description: "Wireless and transmission infrastructure",
        subCategories: [
          {
            id: "towers",
            name: "Cell Towers",
            attributes: { priority: "critical", count: 32 }
          },
          {
            id: "antennas",
            name: "Antennas",
            attributes: { priority: "high", count: 67 }
          },
          {
            id: "microwave",
            name: "Microwave Links",
            attributes: { priority: "medium", count: 28 }
          }
        ]
      },
      {
        id: "facilities",
        name: "Facilities",
        icon: "🏢",
        description: "Physical infrastructure and buildings",
        subCategories: [
          {
            id: "datacenters",
            name: "Data Centers",
            attributes: { priority: "critical", count: 5 }
          },
          {
            id: "cabinets",
            name: "Equipment Cabinets",
            attributes: { priority: "medium", count: 89 }
          },
          {
            id: "shelters",
            name: "Equipment Shelters",
            attributes: { priority: "medium", count: 34 }
          }
        ]
      }
    ],
    []
  );

  // Mock infrastructure data
  useEffect(() => {
    const mockData: InfrastructureItem[] = [
      {
        id: "1",
        name: "Mumbai Central Tower",
        type: "Cell Tower",
        location: "Mumbai, Maharashtra",
        coordinates: { lat: 19.076, lng: 72.8777 },
        status: "active",
        category: "transmission",
        subCategory: "towers",
        priority: "critical",
        cost: 2500000,
        description: "Primary transmission tower serving Mumbai central area",
        createdDate: "2023-01-15",
        lastUpdated: "2024-01-10"
      },
      {
        id: "2",
        name: "Delhi Hub Router",
        type: "Core Router",
        location: "New Delhi",
        coordinates: { lat: 28.6139, lng: 77.209 },
        status: "active",
        category: "network",
        subCategory: "routers",
        priority: "critical",
        cost: 1800000,
        description: "Main routing hub for North India operations",
        createdDate: "2023-03-20",
        lastUpdated: "2024-01-08"
      },
      {
        id: "3",
        name: "Bangalore DC UPS",
        type: "UPS System",
        location: "Bangalore, Karnataka",
        coordinates: { lat: 12.9716, lng: 77.5946 },
        status: "maintenance",
        category: "power",
        subCategory: "ups",
        priority: "high",
        cost: 950000,
        description: "Backup power system for Bangalore data center",
        createdDate: "2023-06-10",
        lastUpdated: "2024-01-05"
      }
    ];
    setData(mockData);
  }, [setData]);

  // Combined KML + Manual + Imported data
  const combinedInfrastructureData = useMemo(() => {
    return [...kmlData, ...manualInfrastructureData, ...importedData];
  }, [kmlData, manualInfrastructureData, importedData]);

  // Filtered combined data
  const filteredKMLData = useMemo(() => {
    let filtered = combinedInfrastructureData;

    // Data source visibility filters
    filtered = filtered.filter((item) => {
      // Manual data toggle
      if (item.source === "manual" || item.extendedData?.isManuallyAdded) {
        return showManualData;
      }
      // Imported data toggle
      if (item.source === "imported" || item.fileType) {
        return showImportedData;
      }
      // KML data (always shown when neither manual nor imported)
      return true;
    });

    // Basic type filter
    if (kmlTypeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === kmlTypeFilter);
    }

    // Advanced type filter (overrides basic if set)
    if (advancedFilters.type !== "all") {
      filtered = filtered.filter((item) => item.type === advancedFilters.type);
    }

    // Basic search term
    if (kmlSearchTerm) {
      const searchLower = kmlSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.extendedData?.status?.toLowerCase().includes(searchLower) ||
          item.coordinates?.lat?.toString().includes(searchLower) ||
          item.coordinates?.lng?.toString().includes(searchLower) ||
          item.lat?.toString().includes(searchLower) ||
          item.lng?.toString().includes(searchLower)
      );
    }

    // Advanced name filter
    if (advancedFilters.name) {
      const nameSearchLower = advancedFilters.name.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name?.toLowerCase().includes(nameSearchLower)
      );
    }

    // Advanced status filter
    if (advancedFilters.status !== "all") {
      filtered = filtered.filter((item) => {
        const status = item.extendedData?.status?.toLowerCase() || "active";
        return status === advancedFilters.status.toLowerCase();
      });
    }

    // Geographic boundary filters
    if (advancedFilters.latMin) {
      const latMin = parseFloat(advancedFilters.latMin);
      filtered = filtered.filter((item) => {
        const lat = item.coordinates?.lat || item.lat;
        return lat !== undefined && lat >= latMin;
      });
    }

    if (advancedFilters.latMax) {
      const latMax = parseFloat(advancedFilters.latMax);
      filtered = filtered.filter((item) => {
        const lat = item.coordinates?.lat || item.lat;
        return lat !== undefined && lat <= latMax;
      });
    }

    if (advancedFilters.lngMin) {
      const lngMin = parseFloat(advancedFilters.lngMin);
      filtered = filtered.filter((item) => {
        const lng = item.coordinates?.lng || item.lng;
        return lng !== undefined && lng >= lngMin;
      });
    }

    if (advancedFilters.lngMax) {
      const lngMax = parseFloat(advancedFilters.lngMax);
      filtered = filtered.filter((item) => {
        const lng = item.coordinates?.lng || item.lng;
        return lng !== undefined && lng <= lngMax;
      });
    }

    // Properties filter
    if (advancedFilters.hasProperties !== "all") {
      filtered = filtered.filter((item) => {
        const hasProps =
          item.extendedData && Object.keys(item.extendedData).length > 0;
        return advancedFilters.hasProperties === "yes" ? hasProps : !hasProps;
      });
    }

    // Source filter
    if (advancedFilters.source !== "all") {
      filtered = filtered.filter((item) => {
        if (advancedFilters.source === "manual") {
          return item.source === "manual" || item.extendedData?.isManuallyAdded;
        } else if (advancedFilters.source === "kml") {
          return (
            item.source === "kml" ||
            (!item.source && !item.extendedData?.isManuallyAdded)
          );
        } else if (advancedFilters.source === "imported") {
          return item.source === "imported";
        }
        return true;
      });
    }

    return filtered;
  }, [
    combinedInfrastructureData,
    kmlTypeFilter,
    kmlSearchTerm,
    advancedFilters,
    showManualData,
    showImportedData
  ]);

  // POP and Sub POP data counts
  const popData = useMemo(
    () => combinedInfrastructureData.filter((item) => item.type === "pop"),
    [combinedInfrastructureData]
  );
  const subPopData = useMemo(
    () => combinedInfrastructureData.filter((item) => item.type === "subPop"),
    [combinedInfrastructureData]
  );

  const manuallyAddedData = useMemo(
    () =>
      combinedInfrastructureData.filter(
        (item) => item.extendedData?.isManuallyAdded || item.source === "manual"
      ),
    [combinedInfrastructureData]
  );

  // ESC key handler
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  // Permission helpers
  const canAdd = useCallback(() => {
    return ["admin", "manager"].includes(userRole);
  }, [userRole]);

  const canEdit = useCallback(
    (item: InfrastructureItem) => {
      if (userRole === "admin") return true;
      if (userRole === "manager") return true;
      return false;
    },
    [userRole]
  );

  const canDelete = useCallback(
    (item: InfrastructureItem) => {
      return userRole === "admin";
    },
    [userRole]
  );

  // Open save to data manager modal
  const openSaveToDataManagerModal = useCallback(() => {
    if (
      !combinedInfrastructureData ||
      combinedInfrastructureData.length === 0
    ) {
      addNotification({
        type: "warning",
        message: "No infrastructure data available to save",
        duration: 3000
      });
      return;
    }
    setShowSaveToDataManagerModal(true);
  }, [combinedInfrastructureData, addNotification]);

  // Convert combined data to InfrastructureData format and save to DataStore
  const saveInfrastructureDataToStore = useCallback(
    async (category: string) => {
      try {
        // Only save KML data (not manual data which is already saved)
        const kmlOnlyData = combinedInfrastructureData.filter(
          (item) =>
            item.source !== "manual" && !item.extendedData?.isManuallyAdded
        );

        if (kmlOnlyData.length === 0) {
          addNotification({
            type: "warning",
            message:
              "No KML data available to save (manual data is already saved)",
            duration: 3000
          });
          return;
        }

        // Convert KML data to InfrastructureData format
        const kmlLocations = kmlOnlyData.map((item) => ({
          id:
            item.id ||
            `kml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: item.name || "Unknown Location",
          lat: item.coordinates?.lat || item.lat || 0,
          lng: item.coordinates?.lng || item.lng || 0,
          type:
            item.type === "pop"
              ? ("pop" as const)
              : item.type === "subPop"
              ? ("subPop" as const)
              : ("custom" as const),
          status: item.extendedData?.status || "active",
          properties: {
            ...item.extendedData,
            originalKMLData: true,
            uniqueId: item.extendedData?.uniqueId,
            networkId: item.extendedData?.networkId,
            refCode: item.extendedData?.refCode,
            description: item.description
          }
        }));

        const infrastructureData: Omit<
          InfrastructureData,
          "id" | "createdAt" | "updatedAt" | "metadata"
        > = {
          name: generateDataName("kml", "KML Infrastructure"),
          type: "kml" as const,
          description: `KML infrastructure data with ${
            kmlOnlyData.length
          } locations (${
            kmlOnlyData.filter((item) => item.type === "pop").length
          } POP, ${
            kmlOnlyData.filter((item) => item.type === "subPop").length
          } Sub POP)`,
          tags: ["kml", "infrastructure", "imported"],
          category: category,
          data: {
            locations: kmlLocations,
            totalCount: kmlOnlyData.length,
            categories: ["POP", "SUB_POP"]
          },
          source: "kml" as const
        };

        const savedId = await saveData(infrastructureData);

        addNotification({
          type: "success",
          message: `🗺️ KML data saved to Data Manager in "${category}" category (${kmlOnlyData.length} locations)`,
          duration: 4000
        });

        console.log("KML data saved to DataStore with ID:", savedId);
        setShowSaveToDataManagerModal(false);
      } catch (error) {
        console.error("Failed to save KML data to DataStore:", error);
        addNotification({
          type: "error",
          message: "Failed to save KML data to Data Manager",
          duration: 3000
        });
      }
    },
    [combinedInfrastructureData, saveData, generateDataName, addNotification]
  );

  // Handlers
  const handleFilterChange = useCallback(
    (key: keyof InfrastructureFilter, value: string) => {
      updateFilter(key, value);
    },
    [updateFilter]
  );

  const handleItemSelect = useCallback(
    (itemId: string, selected: boolean) => {
      if (selected) {
        setSelectedItems((prev) => [...prev, itemId]);
      } else {
        setSelectedItems((prev) => prev.filter((id) => id !== itemId));
      }
    },
    [setSelectedItems]
  );

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedItems(filteredData.map((item) => item.id));
      } else {
        setSelectedItems([]);
      }
    },
    [filteredData, setSelectedItems]
  );

  const handleEditItem = useCallback((item: InfrastructureItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowEditModal(true);
  }, []);

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      if (window.confirm("Are you sure you want to delete this item?")) {
        deleteItem(itemId);
      }
    },
    [deleteItem]
  );

  const handleBulkAction = useCallback(
    (action: string) => {
      switch (action) {
        case "delete":
          if (
            window.confirm(`Delete ${selectedItems.length} selected items?`)
          ) {
            bulkDelete();
          }
          break;
        case "export":
          setExportType("bulk");
          setShowExportFormatModal(true);
          break;
        case "activate":
          selectedItems.forEach((id) => {
            updateItem(id, { status: "active" });
          });
          setSelectedItems([]);
          break;
        case "maintenance":
          selectedItems.forEach((id) => {
            updateItem(id, { status: "maintenance" });
          });
          setSelectedItems([]);
          break;
      }
    },
    [selectedItems, bulkDelete, updateItem, setSelectedItems]
  );

  const handleQuickAdd = useCallback(
    (category: InfrastructureCategory, subCategory: any) => {
      setFormData({
        category: category.name,
        subCategory: subCategory.id,
        status: "active",
        priority: "medium"
      });
      setShowAddModal(true);
    },
    []
  );

  // Map integration handlers
  const handleSelectLocationFromMap = useCallback(() => {
    if (!map) {
      console.warn("No map instance available for location selection");
      return;
    }

    console.log("Starting map location selection...");
    setIsSelectingLocation(true);

    if (mapClickListener) {
      google.maps.event.removeListener(mapClickListener);
      setMapClickListener(null);
    }

    const listener = map.addListener(
      "click",
      (event: google.maps.MapMouseEvent) => {
        console.log("Map clicked!", event.latLng?.toJSON());
        if (event.latLng) {
          const coordinates = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          console.log("Setting coordinates:", coordinates);
          setPendingCoordinates(coordinates);
          setShowAddLocationForm(true);
          setIsSelectingLocation(false);
          google.maps.event.removeListener(listener);
          setMapClickListener(null);
        }
      }
    );

    setMapClickListener(listener);
    console.log("Map click listener added, listener ID:", listener);
  }, [map, mapClickListener]);

  const handleAddManually = useCallback(() => {
    setPendingCoordinates(null);
    setShowAddLocationForm(true);
  }, []);

  const handleCancelLocationSelection = useCallback(() => {
    setIsSelectingLocation(false);
    if (mapClickListener) {
      google.maps.event.removeListener(mapClickListener);
      setMapClickListener(null);
    }
  }, [mapClickListener]);

  const handleSaveLocation = useCallback(
    (locationData: POPLocationData) => {
      onLocationAdd?.(locationData);
      setShowAddLocationForm(false);
      setPendingCoordinates(null);
    },
    [onLocationAdd]
  );

  const handleCloseAddLocationForm = useCallback(() => {
    setShowAddLocationForm(false);
    setPendingCoordinates(null);
    handleCancelLocationSelection();
  }, [handleCancelLocationSelection]);

  const handleViewLocationOnMap = useCallback(
    (item: any) => {
      if (!map) {
        console.warn("No map instance available");
        return;
      }

      let coordinates;
      if (item.coordinates) {
        coordinates = item.coordinates;
      } else if (item.lat && item.lng) {
        coordinates = { lat: item.lat, lng: item.lng };
      } else {
        console.warn("No coordinates found for item:", item);
        return;
      }

      // Center map on location
      map.panTo(coordinates);
      map.setZoom(15);

      // Create a distinctive marker
      const marker = new google.maps.Marker({
        position: coordinates,
        map: map,
        title: item.name || "Location",
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#EF4444" stroke="#FFFFFF" stroke-width="3"/>
              <circle cx="20" cy="20" r="8" fill="#FFFFFF"/>
              <text x="20" y="26" text-anchor="middle" fill="#EF4444" font-size="10" font-weight="bold">📍</text>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        },
        animation: google.maps.Animation.BOUNCE
      });

      // Create enhanced info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
        <div style="max-width: 320px; padding: 8px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <div style="width: 8px; height: 8px; background: #10B981; border-radius: 50%; margin-right: 8px;"></div>
            <h4 style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">${
              item.name || "Unknown Location"
            }</h4>
          </div>
          <div style="background: #F9FAFB; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px;"><strong>Type:</strong> ${
              item.type || "N/A"
            }</p>
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px;"><strong>Coordinates:</strong> ${coordinates.lat.toFixed(
              6
            )}, ${coordinates.lng.toFixed(6)}</p>
            ${
              item.extendedData?.status
                ? `<p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px;"><strong>Status:</strong>
                   <span style="background: #10B981; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${item.extendedData.status}</span></p>`
                : ""
            }
          </div>
          ${
            item.description
              ? `<p style="margin: 0; color: #4B5563; font-size: 13px; line-height: 1.4;"><strong>Description:</strong> ${item.description}</p>`
              : ""
          }
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
            <p style="margin: 0; color: #9CA3AF; font-size: 11px; text-align: center;">📍 Click anywhere to close</p>
          </div>
        </div>
      `,
        position: coordinates
      });

      // Open info window
      infoWindow.open(map, marker);

      // Stop marker animation after 2 seconds
      setTimeout(() => {
        marker.setAnimation(null);
      }, 2000);

      // Remove marker and info window after 10 seconds
      setTimeout(() => {
        marker.setMap(null);
        infoWindow.close();
      }, 10000);

      // Add click listener to close manually
      const clickListener = map.addListener("click", () => {
        marker.setMap(null);
        infoWindow.close();
        google.maps.event.removeListener(clickListener);
      });

      // Show success notification
      addNotification({
        type: "success",
        message: `📍 ${item.name || "Location"} shown on map`,
        duration: 3000
      });
    },
    [map, addNotification]
  );

  const handleViewDetails = useCallback((item: any) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  }, []);

  const handleExportItem = useCallback((item: any) => {
    setSelectedItem(item);
    setExportType("single");
    setShowExportFormatModal(true);
  }, []);

  const handleExportWithFormat = useCallback(
    (format: string, items: any[] = []) => {
      const exportItems =
        items.length > 0 ? items : [selectedItem].filter(Boolean);
      const timestamp = new Date().toISOString().split("T")[0];
      const filename =
        exportItems.length === 1
          ? `${exportItems[0].name || "location"}-${timestamp}`
          : `infrastructure-export-${timestamp}`;

      try {
        switch (format) {
          case "csv":
            exportToCSV(exportItems, filename);
            break;
          case "xlsx":
            exportToXLSX(exportItems, filename);
            break;
          case "kml":
            exportToKML(exportItems, filename);
            break;
          case "kmz":
            exportToKMZ(exportItems, filename);
            break;
          default:
            throw new Error("Unsupported format");
        }

        addNotification({
          type: "success",
          message: `📊 ${
            exportItems.length
          } item(s) exported as ${format.toUpperCase()}`,
          duration: 3000
        });
      } catch (error) {
        addNotification({
          type: "error",
          message: `Failed to export as ${format.toUpperCase()}`,
          duration: 3000
        });
      }

      setShowExportFormatModal(false);
    },
    [selectedItem, addNotification]
  );

  const exportToCSV = useCallback((items: any[], filename: string) => {
    const headers = [
      "Name",
      "Type",
      "Location",
      "Latitude",
      "Longitude",
      "Status",
      "Description",
      "ID",
      "UniqueID",
      "NetworkID",
      "RefCode",
      "CreatedOn",
      "UpdatedOn",
      "Address",
      "ContactName",
      "ContactNo",
      "IsRented",
      "AgreementStartDate",
      "AgreementEndDate",
      "NatureOfBusiness",
      "StructureType",
      "UPSAvailability",
      "BackupAvailability"
    ];

    const csvContent = [
      headers.join(","),
      ...items.map((item) =>
        [
          `"${item.name || ""}"`,
          `"${item.type || ""}"`,
          `"${item.location || ""}"`,
          item.coordinates?.lat || item.lat || "",
          item.coordinates?.lng || item.lng || "",
          `"${item.extendedData?.status || item.status || ""}"`,
          `"${item.description || ""}"`,
          `"${item.id || ""}"`,
          `"${item.extendedData?.uniqueId || ""}"`,
          `"${item.extendedData?.networkId || ""}"`,
          `"${item.extendedData?.refCode || ""}"`,
          `"${item.extendedData?.createdOn || item.createdDate || ""}"`,
          `"${item.extendedData?.updatedOn || item.lastUpdated || ""}"`,
          `"${item.extendedData?.address || ""}"`,
          `"${item.extendedData?.contactName || ""}"`,
          `"${item.extendedData?.contactNo || ""}"`,
          `"${item.extendedData?.isRented || ""}"`,
          `"${item.extendedData?.agreementStartDate || ""}"`,
          `"${item.extendedData?.agreementEndDate || ""}"`,
          `"${item.extendedData?.natureOfBusiness || ""}"`,
          `"${item.extendedData?.structureType || ""}"`,
          `"${item.extendedData?.upsAvailability || ""}"`,
          `"${item.extendedData?.backupAvailability || ""}"`
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  }, []);

  const exportToXLSX = useCallback((items: any[], filename: string) => {
    const headers = [
      "Name",
      "Type",
      "Location",
      "Latitude",
      "Longitude",
      "Status",
      "Description",
      "ID",
      "UniqueID",
      "NetworkID",
      "RefCode",
      "CreatedOn",
      "UpdatedOn",
      "Address",
      "ContactName",
      "ContactNo",
      "IsRented",
      "AgreementStartDate",
      "AgreementEndDate",
      "NatureOfBusiness",
      "StructureType",
      "UPSAvailability",
      "BackupAvailability"
    ];

    let xlsxContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xlsxContent +=
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xlsxContent += '<Worksheet ss:Name="Infrastructure Data">\n';
    xlsxContent += "<Table>\n";

    // Header row
    xlsxContent += "<Row>\n";
    headers.forEach((header) => {
      xlsxContent += `<Cell><Data ss:Type="String">${header}</Data></Cell>\n`;
    });
    xlsxContent += "</Row>\n";

    // Data rows
    items.forEach((item) => {
      xlsxContent += "<Row>\n";
      const values = [
        item.name || "",
        item.type || "",
        item.location || "",
        item.coordinates?.lat || item.lat || "",
        item.coordinates?.lng || item.lng || "",
        item.extendedData?.status || item.status || "",
        item.description || "",
        item.id || "",
        item.extendedData?.uniqueId || "",
        item.extendedData?.networkId || "",
        item.extendedData?.refCode || "",
        item.extendedData?.createdOn || item.createdDate || "",
        item.extendedData?.updatedOn || item.lastUpdated || "",
        item.extendedData?.address || "",
        item.extendedData?.contactName || "",
        item.extendedData?.contactNo || "",
        item.extendedData?.isRented || "",
        item.extendedData?.agreementStartDate || "",
        item.extendedData?.agreementEndDate || "",
        item.extendedData?.natureOfBusiness || "",
        item.extendedData?.structureType || "",
        item.extendedData?.upsAvailability || "",
        item.extendedData?.backupAvailability || ""
      ];

      values.forEach((value) => {
        xlsxContent += `<Cell><Data ss:Type="String">${value}</Data></Cell>\n`;
      });
      xlsxContent += "</Row>\n";
    });

    xlsxContent += "</Table>\n</Worksheet>\n</Workbook>";

    const blob = new Blob([xlsxContent], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.xlsx`;
    link.click();
  }, []);

  const exportToKML = useCallback((items: any[], filename: string) => {
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Infrastructure Data Export</name>
    <description>Exported infrastructure locations</description>
${items
  .map(
    (item) => `    <Placemark>
      <name>${item.name || "Unnamed Location"}</name>
      <description><![CDATA[
        <h3>${item.name || "Unnamed Location"}</h3>
        <p><strong>Type:</strong> ${item.type || "N/A"}</p>
        <p><strong>Status:</strong> ${
          item.extendedData?.status || item.status || "Unknown"
        }</p>
        <p><strong>Description:</strong> ${
          item.description || "No description available"
        }</p>
        <p><strong>ID:</strong> ${item.id || "N/A"}</p>
        <p><strong>Created:</strong> ${
          item.extendedData?.createdOn || item.createdDate || "N/A"
        }</p>
        <p><strong>Updated:</strong> ${
          item.extendedData?.updatedOn || item.lastUpdated || "N/A"
        }</p>
      ]]></description>
      <Point>
        <coordinates>${item.coordinates?.lng || item.lng || 0},${
      item.coordinates?.lat || item.lat || 0
    },0</coordinates>
      </Point>
    </Placemark>`
  )
  .join("\n")}
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], {
      type: "application/vnd.google-earth.kml+xml"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.kml`;
    link.click();
  }, []);

  const exportToKMZ = useCallback((items: any[], filename: string) => {
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Infrastructure Data Export (KMZ)</name>
    <description>Compressed KML export of infrastructure locations</description>
${items
  .map(
    (item) => `    <Placemark>
      <name>${item.name || "Unnamed Location"}</name>
      <description><![CDATA[
        <h3>${item.name || "Unnamed Location"}</h3>
        <p><strong>Type:</strong> ${item.type || "N/A"}</p>
        <p><strong>Status:</strong> ${
          item.extendedData?.status || item.status || "Unknown"
        }</p>
        <p><strong>Description:</strong> ${
          item.description || "No description available"
        }</p>
        <p><strong>Contact:</strong> ${
          item.extendedData?.contactName || "N/A"
        } (${item.extendedData?.contactNo || "N/A"})</p>
        <p><strong>Address:</strong> ${item.extendedData?.address || "N/A"}</p>
      ]]></description>
      <Point>
        <coordinates>${item.coordinates?.lng || item.lng || 0},${
      item.coordinates?.lat || item.lat || 0
    },0</coordinates>
      </Point>
    </Placemark>`
  )
  .join("\n")}
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], {
      type: "application/vnd.google-earth.kmz"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.kmz`;
    link.click();
  }, []);

  // Checkbox handlers for showing/hiding data on map
  const handleTogglePOPData = useCallback(
    (show: boolean) => {
      setShowPOPData(show);

      if (toggleKMLLayer) {
        // Check current state and only toggle if needed
        const isCurrentlyVisible = isKMLLayerVisible?.("pop") || false;
        if (show !== isCurrentlyVisible) {
          toggleKMLLayer("pop");
        }
      }

      // Show user feedback
      addNotification({
        type: show ? "success" : "info",
        message: show
          ? "📡 POP data shown on map"
          : "📡 POP data hidden from map",
        duration: 2000
      });

      console.log(
        "POP data toggle:",
        show,
        "Current visibility:",
        isKMLLayerVisible?.("pop"),
        "KML Data items:",
        kmlData?.length || 0
      );
    },
    [addNotification, toggleKMLLayer, isKMLLayerVisible, kmlData]
  );

  const handleToggleSubPOPData = useCallback(
    (show: boolean) => {
      setShowSubPOPData(show);

      if (toggleKMLLayer) {
        // Check current state and only toggle if needed
        const isCurrentlyVisible = isKMLLayerVisible?.("subPop") || false;
        if (show !== isCurrentlyVisible) {
          toggleKMLLayer("subPop");
        }
      }

      addNotification({
        type: "info",
        message: `Sub POP data ${show ? "shown" : "hidden"} on map`,
        duration: 2000
      });
    },
    [addNotification, toggleKMLLayer, isKMLLayerVisible]
  );

  // Handlers for manual and imported data visibility
  const handleToggleManualData = useCallback(
    (show: boolean) => {
      setShowManualData(show);
      addNotification({
        type: "info",
        message: `Manual data ${show ? "shown" : "hidden"} on map`,
        duration: 2000
      });
    },
    [addNotification]
  );

  const handleToggleImportedData = useCallback(
    (show: boolean) => {
      setShowImportedData(show);
      addNotification({
        type: "info",
        message: `Imported data ${show ? "shown" : "hidden"} on map`,
        duration: 2000
      });
    },
    [addNotification]
  );

  // Save imported data to DataStore
  const handleSaveImportedData = useCallback(async () => {
    try {
      if (importedData.length === 0) {
        addNotification({
          type: "warning",
          message: "No imported data to save",
          duration: 3000
        });
        return;
      }

      // Here you would save the imported data to your DataStore
      // For now, we'll simulate this
      addNotification({
        type: "success",
        message: `Saved ${importedData.length} imported locations to DataStore`,
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: "error",
        message: "Failed to save imported data",
        duration: 3000
      });
    }
  }, [importedData, addNotification]);

  const highlightSearchTerm = useCallback(
    (text: string, term: string): React.ReactNode => {
      if (!term) return text;

      const regex = new RegExp(`(${term})`, "gi");
      const parts = text.split(regex);

      return parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="bg-yellow-200 text-yellow-900 rounded px-1"
          >
            {part}
          </mark>
        ) : (
          part
        )
      );
    },
    []
  );

  // Tab configuration
  const tabs = [
    {
      id: "data",
      label: "Infrastructure Data",
      icon: "📊",
      description: "View and manage data"
    },
    {
      id: "add",
      label: "Add New",
      icon: "➕",
      description: "Create new entries"
    },
    {
      id: "categories",
      label: "Categories",
      icon: "📂",
      description: "Organize by type"
    },
    {
      id: "reports",
      label: "Reports",
      icon: "📈",
      description: "Analytics & insights"
    },
    {
      id: "kml",
      label: `Infrastructure Data (${combinedInfrastructureData.length})`,
      icon: "📍",
      description: "KML & Manual data"
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300 transition-all transform hover:scale-105 shadow-sm"
                title="Back to Dashboard"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Infrastructure Management Hub
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="font-medium">
                    📁 Total:{" "}
                    <span className="text-blue-600">
                      {combinedInfrastructureData.length}
                    </span>{" "}
                    items
                  </span>
                  <span className="font-medium">
                    📡 POP:{" "}
                    <span className="text-red-600">
                      {
                        combinedInfrastructureData.filter(
                          (item) => item.type === "pop"
                        ).length
                      }
                    </span>
                  </span>
                  <span className="font-medium">
                    🏢 Sub POP:{" "}
                    <span className="text-green-600">
                      {
                        combinedInfrastructureData.filter(
                          (item) => item.type === "subPop"
                        ).length
                      }
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={openSaveToDataManagerModal}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 text-sm transition-all transform hover:scale-105 shadow-lg"
              >
                💾 Save to Data Manager
              </button>
              <button
                onClick={() => {
                  setExportType("bulk");
                  setShowExportFormatModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg hover:from-indigo-600 hover:to-blue-600 text-sm transition-all transform hover:scale-105 shadow-lg"
              >
                📤 Export Data
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="min-h-[calc(100vh-12rem)] overflow-auto p-6">
            {/* Infrastructure Data Tab */}
            {activeTab === "data" && (
              <div className="space-y-6">
                <InfrastructureFilters
                  filter={filters}
                  onFilterChange={handleFilterChange}
                  categories={categories}
                  selectedItems={selectedItems}
                  onBulkAction={handleBulkAction}
                  onAddNew={() => setShowAddModal(true)}
                  canAdd={canAdd()}
                />

                <InfrastructureDataTable
                  data={filteredData}
                  selectedItems={selectedItems}
                  onItemSelect={handleItemSelect}
                  onSelectAll={handleSelectAll}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                  onViewLocation={handleViewLocationOnMap}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              </div>
            )}

            {/* Add New Tab */}
            {activeTab === "add" && (
              <InfrastructureAddForm
                categories={categories}
                formData={formData}
                selectedCoordinates={selectedCoordinates}
                map={map}
                isSelectingLocation={isSelectingLocation}
                pendingCoordinates={pendingCoordinates}
                showAddLocationForm={showAddLocationForm}
                onFormDataChange={setFormData}
                onCoordinatesChange={setSelectedCoordinates}
                onShowMapPicker={() => setShowMapPicker(true)}
                onQuickAdd={handleQuickAdd}
                onSelectLocationFromMap={handleSelectLocationFromMap}
                onAddManually={handleAddManually}
                onCancelLocationSelection={handleCancelLocationSelection}
                onSaveLocation={handleSaveLocation}
                onCloseAddLocationForm={handleCloseAddLocationForm}
              />
            )}

            {/* Categories Tab */}
            {activeTab === "categories" && (
              <InfrastructureCategoriesTab categories={categories} />
            )}

            {/* Reports Tab */}
            {activeTab === "reports" && (
              <InfrastructureReportsTab dataLength={allData.length} />
            )}

            {/* KML Data Tab */}
            {activeTab === "kml" && (
              <KMLDataTab
                kmlData={kmlData}
                filteredKMLData={filteredKMLData}
                manuallyAddedData={manuallyAddedData}
                kmlTypeFilter={kmlTypeFilter}
                kmlSearchTerm={kmlSearchTerm}
                advancedFilters={advancedFilters}
                map={map}
                isSelectingLocation={isSelectingLocation}
                showPOPData={showPOPData}
                showSubPOPData={showSubPOPData}
                showManualData={showManualData}
                showImportedData={showImportedData}
                importedData={importedData}
                onKmlTypeFilterChange={(filter) => {
                  setKmlTypeFilter(filter);
                }}
                onKmlSearchChange={setKmlSearchTerm}
                onAdvancedFiltersChange={setAdvancedFilters}
                onTogglePOPData={handleTogglePOPData}
                onToggleSubPOPData={handleToggleSubPOPData}
                onToggleManualData={handleToggleManualData}
                onToggleImportedData={handleToggleImportedData}
                onExportData={() => {
                  setExportType("bulk");
                  setShowExportFormatModal(true);
                }}
                onSaveToDataManager={openSaveToDataManagerModal}
                onSaveImportedData={handleSaveImportedData}
                onViewLocationOnMap={handleViewLocationOnMap}
                onViewDetails={handleViewDetails}
                onExportItem={handleExportItem}
                onSelectLocationFromMap={handleSelectLocationFromMap}
                onAddManually={handleAddManually}
                onCancelLocationSelection={handleCancelLocationSelection}
                highlightSearchTerm={highlightSearchTerm}
              />
            )}
          </div>

          {/* Add POP Location Form */}
          <AddPOPLocationForm
            isOpen={showAddLocationForm}
            onClose={handleCloseAddLocationForm}
            onSave={handleSaveLocation}
            initialCoordinates={pendingCoordinates || undefined}
          />

          {/* Enhanced Details Modal */}
          {showDetailsModal && selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-full">
                        <span className="text-2xl">
                          {selectedItem.type === "pop"
                            ? "📡"
                            : selectedItem.type === "subPop"
                            ? "🏢"
                            : "📍"}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">
                          {selectedItem.name || "Unknown Location"}
                        </h3>
                        <p className="text-blue-100 text-sm">
                          {selectedItem.type === "pop"
                            ? "Point of Presence"
                            : selectedItem.type === "subPop"
                            ? "Sub Point of Presence"
                            : "Infrastructure Location"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content with enhanced layout */}
                <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                  {/* Status Badge */}
                  <div className="mb-6">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedItem.status === "Active" ||
                        selectedItem.status === "active" ||
                        !selectedItem.status
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : selectedItem.status === "Inactive" ||
                            selectedItem.status === "inactive"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : selectedItem.status === "Planned" ||
                            selectedItem.status === "planned"
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          : "bg-gray-100 text-gray-800 border border-gray-200"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          selectedItem.status === "Active" ||
                          selectedItem.status === "active" ||
                          !selectedItem.status
                            ? "bg-green-500"
                            : selectedItem.status === "Inactive" ||
                              selectedItem.status === "inactive"
                            ? "bg-red-500"
                            : selectedItem.status === "Planned" ||
                              selectedItem.status === "planned"
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                        }`}
                      ></span>
                      {selectedItem.status || "Active"}
                    </span>
                  </div>

                  {/* Main Info Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Location Information */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-lg">
                      <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                        <span className="text-xl mr-2">🌍</span>
                        Location Information
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
                          <label className="text-sm font-medium text-blue-700 flex items-center">
                            <span className="mr-1">📍</span>
                            Name
                          </label>
                          <p className="text-lg font-semibold text-blue-900 mt-1">
                            {selectedItem.name || "N/A"}
                          </p>
                        </div>
                        <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
                          <label className="text-sm font-medium text-blue-700 flex items-center">
                            <span className="mr-1">
                              {selectedItem.type === "pop"
                                ? "📡"
                                : selectedItem.type === "subPop"
                                ? "🏢"
                                : "🏗️"}
                            </span>
                            Type
                          </label>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                              selectedItem.type === "pop"
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : selectedItem.type === "subPop"
                                ? "bg-orange-100 text-orange-800 border border-orange-200"
                                : "bg-gray-100 text-gray-800 border border-gray-200"
                            }`}
                          >
                            {selectedItem.type === "pop"
                              ? "Point of Presence"
                              : selectedItem.type === "subPop"
                              ? "Sub Point of Presence"
                              : selectedItem.type?.toUpperCase() || "N/A"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
                            <label className="text-sm font-medium text-blue-700 flex items-center">
                              <span className="mr-1">🧭</span>
                              Latitude
                            </label>
                            <p className="text-sm font-mono text-blue-900 bg-blue-50 px-2 py-1 rounded mt-1 border">
                              {(
                                selectedItem.coordinates?.lat ||
                                selectedItem.latitude ||
                                selectedItem.lat
                              )?.toFixed(6) || "N/A"}
                            </p>
                          </div>
                          <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
                            <label className="text-sm font-medium text-blue-700 flex items-center">
                              <span className="mr-1">🧭</span>
                              Longitude
                            </label>
                            <p className="text-sm font-mono text-blue-900 bg-blue-50 px-2 py-1 rounded mt-1 border">
                              {(
                                selectedItem.coordinates?.lng ||
                                selectedItem.longitude ||
                                selectedItem.lng
                              )?.toFixed(6) || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Technical Details */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200 shadow-lg">
                      <h4 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center">
                        <span className="text-xl mr-2">⚙️</span>
                        Technical Details
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white/80 p-3 rounded-lg border border-emerald-100">
                          <label className="text-sm font-medium text-emerald-700 flex items-center">
                            <span className="mr-1">📝</span>
                            Description
                          </label>
                          <p className="text-sm text-emerald-900 mt-1 bg-emerald-50/70 px-3 py-2 rounded border">
                            {selectedItem.description ||
                              "No description available"}
                          </p>
                        </div>
                        <div className="bg-white/80 p-3 rounded-lg border border-emerald-100">
                          <label className="text-sm font-medium text-emerald-700 flex items-center">
                            <span className="mr-1">🔍</span>
                            Data Source
                          </label>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 border ${
                              selectedItem.source === "manual" ||
                              selectedItem.extendedData?.isManuallyAdded
                                ? "bg-green-100 text-green-800 border-green-200"
                                : selectedItem.source === "kml"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-blue-100 text-blue-800 border-blue-200"
                            }`}
                          >
                            {selectedItem.source === "manual" ||
                            selectedItem.extendedData?.isManuallyAdded
                              ? "✏️ Manual Entry"
                              : selectedItem.source === "kml"
                              ? "🗺️ KML File"
                              : "📥 Imported Data"}
                          </span>
                        </div>
                        {selectedItem.extendedData?.uniqueId && (
                          <div className="bg-white/80 p-3 rounded-lg border border-emerald-100">
                            <label className="text-sm font-medium text-emerald-700 flex items-center">
                              <span className="mr-1">🔑</span>
                              Unique ID
                            </label>
                            <p className="text-sm font-mono text-emerald-900 bg-emerald-50 px-2 py-1 rounded mt-1 border">
                              {selectedItem.extendedData.uniqueId}
                            </p>
                          </div>
                        )}
                        {selectedItem.extendedData?.networkId && (
                          <div className="bg-white/80 p-3 rounded-lg border border-emerald-100">
                            <label className="text-sm font-medium text-emerald-700 flex items-center">
                              <span className="mr-1">🌐</span>
                              Network ID
                            </label>
                            <p className="text-sm font-mono text-emerald-900 bg-emerald-50 px-2 py-1 rounded mt-1 border">
                              {selectedItem.extendedData.networkId}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Extended Properties */}
                  {(selectedItem.properties || selectedItem.extendedData) && (
                    <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 shadow-lg">
                      <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                        <span className="text-xl mr-2">📋</span>
                        Extended Properties
                      </h4>

                      {/* Common Properties in Card Format */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {selectedItem.extendedData?.refCode && (
                          <div className="bg-white/90 p-3 rounded-lg border border-purple-100">
                            <label className="text-sm font-medium text-purple-700 flex items-center">
                              <span className="mr-1">🏷️</span>
                              Reference Code
                            </label>
                            <p className="text-sm font-mono text-purple-900 bg-purple-50 px-2 py-1 rounded mt-1">
                              {selectedItem.extendedData.refCode}
                            </p>
                          </div>
                        )}

                        {selectedItem.extendedData?.address && (
                          <div className="bg-white/90 p-3 rounded-lg border border-purple-100">
                            <label className="text-sm font-medium text-purple-700 flex items-center">
                              <span className="mr-1">🏠</span>
                              Address
                            </label>
                            <p className="text-sm text-purple-900 mt-1">
                              {selectedItem.extendedData.address}
                            </p>
                          </div>
                        )}

                        {selectedItem.extendedData?.contactName && (
                          <div className="bg-white/90 p-3 rounded-lg border border-purple-100">
                            <label className="text-sm font-medium text-purple-700 flex items-center">
                              <span className="mr-1">👤</span>
                              Contact Name
                            </label>
                            <p className="text-sm text-purple-900 mt-1">
                              {selectedItem.extendedData.contactName}
                            </p>
                          </div>
                        )}

                        {selectedItem.extendedData?.contactNo && (
                          <div className="bg-white/90 p-3 rounded-lg border border-purple-100">
                            <label className="text-sm font-medium text-purple-700 flex items-center">
                              <span className="mr-1">📞</span>
                              Contact Number
                            </label>
                            <p className="text-sm font-mono text-purple-900 bg-purple-50 px-2 py-1 rounded mt-1">
                              {selectedItem.extendedData.contactNo}
                            </p>
                          </div>
                        )}

                        {selectedItem.extendedData?.createdOn && (
                          <div className="bg-white/90 p-3 rounded-lg border border-purple-100">
                            <label className="text-sm font-medium text-purple-700 flex items-center">
                              <span className="mr-1">📅</span>
                              Created On
                            </label>
                            <p className="text-sm text-purple-900 mt-1">
                              {selectedItem.extendedData.createdOn}
                            </p>
                          </div>
                        )}

                        {selectedItem.extendedData?.updatedOn && (
                          <div className="bg-white/90 p-3 rounded-lg border border-purple-100">
                            <label className="text-sm font-medium text-purple-700 flex items-center">
                              <span className="mr-1">🔄</span>
                              Updated On
                            </label>
                            <p className="text-sm text-purple-900 mt-1">
                              {selectedItem.extendedData.updatedOn}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Raw JSON Data */}
                      <div className="bg-white/90 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-purple-700 flex items-center">
                            <span className="mr-1">💾</span>
                            Raw Data (JSON)
                          </label>
                          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                            Click to expand
                          </span>
                        </div>
                        <details className="cursor-pointer">
                          <summary className="text-xs text-purple-700 hover:text-purple-900 cursor-pointer">
                            View complete object structure
                          </summary>
                          <pre className="text-xs text-purple-900 overflow-auto max-h-40 mt-2 bg-purple-25 p-2 rounded border">
                            {JSON.stringify(
                              selectedItem.properties ||
                                selectedItem.extendedData,
                              null,
                              2
                            )}
                          </pre>
                        </details>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Footer */}
                <div className="px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-blue-50 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Last Updated:</span>{" "}
                    {new Date().toLocaleDateString()}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleViewLocationOnMap(selectedItem)}
                      className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg transform transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      <div className="relative flex items-center space-x-2">
                        <span>🗺️</span>
                        <span className="font-medium">View on Map</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export Format Modal */}
          {showExportFormatModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Export Data
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Choose export format for{" "}
                    {exportType === "single"
                      ? "1 item"
                      : `${selectedItems.length || "selected"} items`}
                    :
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleExportWithFormat("csv")}
                      className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center transition-colors"
                    >
                      <div className="text-2xl mb-2">📊</div>
                      <div className="text-sm font-medium text-gray-900">
                        CSV
                      </div>
                      <div className="text-xs text-gray-500">
                        Spreadsheet format
                      </div>
                    </button>
                    <button
                      onClick={() => handleExportWithFormat("xlsx")}
                      className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center transition-colors"
                    >
                      <div className="text-2xl mb-2">📋</div>
                      <div className="text-sm font-medium text-gray-900">
                        XLSX
                      </div>
                      <div className="text-xs text-gray-500">Excel format</div>
                    </button>
                    <button
                      onClick={() => handleExportWithFormat("kml")}
                      className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center transition-colors"
                    >
                      <div className="text-2xl mb-2">🗺️</div>
                      <div className="text-sm font-medium text-gray-900">
                        KML
                      </div>
                      <div className="text-xs text-gray-500">
                        Google Earth format
                      </div>
                    </button>
                    <button
                      onClick={() => handleExportWithFormat("kmz")}
                      className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center transition-colors"
                    >
                      <div className="text-2xl mb-2">📦</div>
                      <div className="text-sm font-medium text-gray-900">
                        KMZ
                      </div>
                      <div className="text-xs text-gray-500">
                        Compressed KML
                      </div>
                    </button>
                  </div>
                </div>
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                  <button
                    onClick={() => setShowExportFormatModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save to Data Manager Modal */}
          {showSaveToDataManagerModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    💾 Save to Data Manager
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Choose a category for saving{" "}
                    {
                      combinedInfrastructureData.filter(
                        (item) => item.source !== "manual"
                      ).length
                    }{" "}
                    KML locations to Data Manager:
                  </p>
                  <div className="space-y-3">
                    <label className="block">
                      <input
                        type="radio"
                        name="category"
                        value="Infrastructure"
                        checked={selectedSaveCategory === "Infrastructure"}
                        onChange={(e) =>
                          setSelectedSaveCategory(e.target.value)
                        }
                        className="mr-3"
                      />
                      <span className="text-sm font-medium">
                        🏗️ Infrastructure
                      </span>
                      <p className="text-xs text-gray-500 ml-6">
                        Network infrastructure and facilities
                      </p>
                    </label>
                    <label className="block">
                      <input
                        type="radio"
                        name="category"
                        value="Telecom"
                        checked={selectedSaveCategory === "Telecom"}
                        onChange={(e) =>
                          setSelectedSaveCategory(e.target.value)
                        }
                        className="mr-3"
                      />
                      <span className="text-sm font-medium">📡 Telecom</span>
                      <p className="text-xs text-gray-500 ml-6">
                        Telecommunications equipment and towers
                      </p>
                    </label>
                    <label className="block">
                      <input
                        type="radio"
                        name="category"
                        value="Network"
                        checked={selectedSaveCategory === "Network"}
                        onChange={(e) =>
                          setSelectedSaveCategory(e.target.value)
                        }
                        className="mr-3"
                      />
                      <span className="text-sm font-medium">🌐 Network</span>
                      <p className="text-xs text-gray-500 ml-6">
                        Network connectivity and routing
                      </p>
                    </label>
                    <label className="block">
                      <input
                        type="radio"
                        name="category"
                        value="Assets"
                        checked={selectedSaveCategory === "Assets"}
                        onChange={(e) =>
                          setSelectedSaveCategory(e.target.value)
                        }
                        className="mr-3"
                      />
                      <span className="text-sm font-medium">🏢 Assets</span>
                      <p className="text-xs text-gray-500 ml-6">
                        Physical assets and properties
                      </p>
                    </label>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800">
                      💡 <strong>Note:</strong> Manual data is already saved
                      automatically. Only KML data will be saved to the selected
                      category.
                    </p>
                  </div>
                </div>
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-2">
                  <button
                    onClick={() => setShowSaveToDataManagerModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      saveInfrastructureDataToStore(selectedSaveCategory)
                    }
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    💾 Save to {selectedSaveCategory}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfrastructureDataManagement;
