import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useInfrastructureData } from "../../hooks/useInfrastructureData";
import { InfrastructureCategory, Coordinates, User } from "../../types";
import {
  InfrastructureItem,
  InfrastructureFilter
} from "../../hooks/useInfrastructureData";
import { ExportUtils, ExportFormat } from "../../utils/exportUtils";
import AddPOPLocationForm, { POPLocationData } from "../map/AddPOPLocationForm";
import {
  InfrastructureDataTable,
  InfrastructureFilters,
  InfrastructureAddForm,
  KMLDataTab,
  InfrastructureCategoriesTab,
  InfrastructureReportsTab
} from "./infrastructure";

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
  const { uiState, addNotification } = useTheme();
  const isDark = uiState.theme.mode === "dark";

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

  // KML Data state
  const [kmlSearchTerm, setKmlSearchTerm] = useState("");
  const [kmlTypeFilter, setKmlTypeFilter] = useState<"all" | "pop" | "subPop">(
    "all"
  );

  // Map layer visibility state
  const [showPOPData, setShowPOPData] = useState(false);
  const [showSubPOPData, setShowSubPOPData] = useState(false);

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

  // Filtered KML data
  const filteredKMLData = useMemo(() => {
    let filtered = kmlData;

    if (kmlTypeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === kmlTypeFilter);
    }

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

    return filtered;
  }, [kmlData, kmlTypeFilter, kmlSearchTerm]);

  // POP and Sub POP data counts
  const popData = useMemo(() => kmlData.filter(item => item.type === 'pop'), [kmlData]);
  const subPopData = useMemo(() => kmlData.filter(item => item.type === 'subPop'), [kmlData]);

  const manuallyAddedData = useMemo(
    () => kmlData.filter((item) => item.extendedData?.isManuallyAdded),
    [kmlData]
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
    setExportType('single');
    setShowExportFormatModal(true);
  }, []);

  const handleExportWithFormat = useCallback((format: string, items: any[] = []) => {
    const exportItems = items.length > 0 ? items : [selectedItem].filter(Boolean);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = exportItems.length === 1
      ? `${exportItems[0].name || 'location'}-${timestamp}`
      : `infrastructure-export-${timestamp}`;

    try {
      switch (format) {
        case 'csv':
          exportToCSV(exportItems, filename);
          break;
        case 'xlsx':
          exportToXLSX(exportItems, filename);
          break;
        case 'kml':
          exportToKML(exportItems, filename);
          break;
        case 'kmz':
          exportToKMZ(exportItems, filename);
          break;
        default:
          throw new Error('Unsupported format');
      }

      addNotification({
        type: 'success',
        message: `📊 ${exportItems.length} item(s) exported as ${format.toUpperCase()}`,
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to export as ${format.toUpperCase()}`,
        duration: 3000
      });
    }

    setShowExportFormatModal(false);
  }, [selectedItem, addNotification]);

  const exportToCSV = useCallback((items: any[], filename: string) => {
    const headers = ['Name', 'Type', 'Location', 'Latitude', 'Longitude', 'Status', 'Description', 'ID', 'UniqueID', 'NetworkID', 'RefCode', 'CreatedOn', 'UpdatedOn', 'Address', 'ContactName', 'ContactNo', 'IsRented', 'AgreementStartDate', 'AgreementEndDate', 'NatureOfBusiness', 'StructureType', 'UPSAvailability', 'BackupAvailability'];

    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        `"${item.name || ''}"`,
        `"${item.type || ''}"`,
        `"${item.location || ''}"`,
        item.coordinates?.lat || item.lat || '',
        item.coordinates?.lng || item.lng || '',
        `"${item.extendedData?.status || item.status || ''}"`,
        `"${item.description || ''}"`,
        `"${item.id || ''}"`,
        `"${item.extendedData?.uniqueId || ''}"`,
        `"${item.extendedData?.networkId || ''}"`,
        `"${item.extendedData?.refCode || ''}"`,
        `"${item.extendedData?.createdOn || item.createdDate || ''}"`,
        `"${item.extendedData?.updatedOn || item.lastUpdated || ''}"`,
        `"${item.extendedData?.address || ''}"`,
        `"${item.extendedData?.contactName || ''}"`,
        `"${item.extendedData?.contactNo || ''}"`,
        `"${item.extendedData?.isRented || ''}"`,
        `"${item.extendedData?.agreementStartDate || ''}"`,
        `"${item.extendedData?.agreementEndDate || ''}"`,
        `"${item.extendedData?.natureOfBusiness || ''}"`,
        `"${item.extendedData?.structureType || ''}"`,
        `"${item.extendedData?.upsAvailability || ''}"`,
        `"${item.extendedData?.backupAvailability || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  }, []);

  const exportToXLSX = useCallback((items: any[], filename: string) => {
    const headers = ['Name', 'Type', 'Location', 'Latitude', 'Longitude', 'Status', 'Description', 'ID', 'UniqueID', 'NetworkID', 'RefCode', 'CreatedOn', 'UpdatedOn', 'Address', 'ContactName', 'ContactNo', 'IsRented', 'AgreementStartDate', 'AgreementEndDate', 'NatureOfBusiness', 'StructureType', 'UPSAvailability', 'BackupAvailability'];

    let xlsxContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xlsxContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xlsxContent += '<Worksheet ss:Name="Infrastructure Data">\n';
    xlsxContent += '<Table>\n';

    // Header row
    xlsxContent += '<Row>\n';
    headers.forEach(header => {
      xlsxContent += `<Cell><Data ss:Type="String">${header}</Data></Cell>\n`;
    });
    xlsxContent += '</Row>\n';

    // Data rows
    items.forEach(item => {
      xlsxContent += '<Row>\n';
      const values = [
        item.name || '',
        item.type || '',
        item.location || '',
        item.coordinates?.lat || item.lat || '',
        item.coordinates?.lng || item.lng || '',
        item.extendedData?.status || item.status || '',
        item.description || '',
        item.id || '',
        item.extendedData?.uniqueId || '',
        item.extendedData?.networkId || '',
        item.extendedData?.refCode || '',
        item.extendedData?.createdOn || item.createdDate || '',
        item.extendedData?.updatedOn || item.lastUpdated || '',
        item.extendedData?.address || '',
        item.extendedData?.contactName || '',
        item.extendedData?.contactNo || '',
        item.extendedData?.isRented || '',
        item.extendedData?.agreementStartDate || '',
        item.extendedData?.agreementEndDate || '',
        item.extendedData?.natureOfBusiness || '',
        item.extendedData?.structureType || '',
        item.extendedData?.upsAvailability || '',
        item.extendedData?.backupAvailability || ''
      ];

      values.forEach(value => {
        xlsxContent += `<Cell><Data ss:Type="String">${value}</Data></Cell>\n`;
      });
      xlsxContent += '</Row>\n';
    });

    xlsxContent += '</Table>\n</Worksheet>\n</Workbook>';

    const blob = new Blob([xlsxContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
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
${items.map(item => `    <Placemark>
      <name>${item.name || 'Unnamed Location'}</name>
      <description><![CDATA[
        <h3>${item.name || 'Unnamed Location'}</h3>
        <p><strong>Type:</strong> ${item.type || 'N/A'}</p>
        <p><strong>Status:</strong> ${item.extendedData?.status || item.status || 'Unknown'}</p>
        <p><strong>Description:</strong> ${item.description || 'No description available'}</p>
        <p><strong>ID:</strong> ${item.id || 'N/A'}</p>
        <p><strong>Created:</strong> ${item.extendedData?.createdOn || item.createdDate || 'N/A'}</p>
        <p><strong>Updated:</strong> ${item.extendedData?.updatedOn || item.lastUpdated || 'N/A'}</p>
      ]]></description>
      <Point>
        <coordinates>${item.coordinates?.lng || item.lng || 0},${item.coordinates?.lat || item.lat || 0},0</coordinates>
      </Point>
    </Placemark>`).join('\n')}
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const link = document.createElement('a');
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
${items.map(item => `    <Placemark>
      <name>${item.name || 'Unnamed Location'}</name>
      <description><![CDATA[
        <h3>${item.name || 'Unnamed Location'}</h3>
        <p><strong>Type:</strong> ${item.type || 'N/A'}</p>
        <p><strong>Status:</strong> ${item.extendedData?.status || item.status || 'Unknown'}</p>
        <p><strong>Description:</strong> ${item.description || 'No description available'}</p>
        <p><strong>Contact:</strong> ${item.extendedData?.contactName || 'N/A'} (${item.extendedData?.contactNo || 'N/A'})</p>
        <p><strong>Address:</strong> ${item.extendedData?.address || 'N/A'}</p>
      ]]></description>
      <Point>
        <coordinates>${item.coordinates?.lng || item.lng || 0},${item.coordinates?.lat || item.lat || 0},0</coordinates>
      </Point>
    </Placemark>`).join('\n')}
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kmz' });
    const link = document.createElement('a');
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

      // Show user feedback
      addNotification({
        type: show ? "success" : "info",
        message: show
          ? "📶 Sub POP data shown on map"
          : "📶 Sub POP data hidden from map",
        duration: 2000
      });

      console.log(
        "Sub POP data toggle:",
        show,
        "Current visibility:",
        isKMLLayerVisible?.("subPop"),
        "KML Data items:",
        kmlData?.length || 0
      );
    },
    [addNotification, toggleKMLLayer, isKMLLayerVisible, kmlData]
  );

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
      label: `KML Data (${kmlData.length})`,
      icon: "📍",
      description: "Map visualization"
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-7xl h-full max-h-[90vh] rounded-lg shadow-xl overflow-auto toolbox-scrollbar ${
          isDark ? "bg-gray-900" : "bg-white"
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? "border-gray-700 bg-gray-800" : "border-gray-200"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg ${
                isDark
                  ? "bg-blue-900/50 text-blue-400"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h2
                className={`text-xl font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Infrastructure Data Management
              </h2>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                📋 Manage telecom infrastructure with manual entry, coordinate
                input, and visualization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? "text-gray-400 hover:text-white hover:bg-gray-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
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

        {/* Tabs */}
        <div
          className={`px-6 border-b ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? isDark
                      ? "border-blue-400 text-blue-400"
                      : "border-blue-500 text-blue-600"
                    : isDark
                    ? "border-transparent text-gray-400 hover:text-gray-200"
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
        <div className="flex-1 overflow-auto p-6 toolbox-scrollbar">
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
            <InfrastructureCategoriesTab
              categories={categories}
              isDark={isDark}
            />
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <InfrastructureReportsTab
              isDark={isDark}
              dataLength={allData.length}
            />
          )}

          {/* KML Data Tab */}
          {activeTab === "kml" && (
            <KMLDataTab
              kmlData={kmlData}
              filteredKMLData={filteredKMLData}
              manuallyAddedData={manuallyAddedData}
              kmlTypeFilter={kmlTypeFilter}
              kmlSearchTerm={kmlSearchTerm}
              isDark={isDark}
              map={map}
              isSelectingLocation={isSelectingLocation}
              showPOPData={showPOPData}
              showSubPOPData={showSubPOPData}
              onKmlTypeFilterChange={(filter) => {
                setKmlTypeFilter(filter);
              }}
              onKmlSearchChange={setKmlSearchTerm}
              onTogglePOPData={handleTogglePOPData}
              onToggleSubPOPData={handleToggleSubPOPData}
              onExportData={() => {
                setExportType("bulk");
                setShowExportFormatModal(true);
              }}
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

        {/* Export Format Modal */}
        {showExportFormatModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Choose export format for {exportType === 'single' ? '1 item' : `${selectedItems.length || 'selected'} items`}:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleExportWithFormat('csv')}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center transition-colors"
                  >
                    <div className="text-2xl mb-2">📊</div>
                    <div className="text-sm font-medium text-gray-900">CSV</div>
                    <div className="text-xs text-gray-500">Spreadsheet format</div>
                  </button>
                  <button
                    onClick={() => handleExportWithFormat('xlsx')}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center transition-colors"
                  >
                    <div className="text-2xl mb-2">📋</div>
                    <div className="text-sm font-medium text-gray-900">XLSX</div>
                    <div className="text-xs text-gray-500">Excel format</div>
                  </button>
                  <button
                    onClick={() => handleExportWithFormat('kml')}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center transition-colors"
                  >
                    <div className="text-2xl mb-2">🗺️</div>
                    <div className="text-sm font-medium text-gray-900">KML</div>
                    <div className="text-xs text-gray-500">Google Earth format</div>
                  </button>
                  <button
                    onClick={() => handleExportWithFormat('kmz')}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center transition-colors"
                  >
                    <div className="text-2xl mb-2">📦</div>
                    <div className="text-sm font-medium text-gray-900">KMZ</div>
                    <div className="text-xs text-gray-500">Compressed KML</div>
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
      </div>
    </div>
  );
};

export default InfrastructureDataManagement;
