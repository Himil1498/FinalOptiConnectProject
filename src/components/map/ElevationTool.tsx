import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect
} from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { validateGeofence } from "../../utils/unifiedGeofencing";
import ToolboxContainer from "../common/ToolboxContainer";
import StandardDialog from "../common/StandardDialog";
import { Z_INDEX } from "../../constants/zIndex";
import { LAYOUT_DIMENSIONS, TOOLBOX_POSITIONING } from "../../constants/layout";
import { useStackedToolboxPositioning } from "../../hooks/useStackedToolboxPositioning";
import {
  useNavbarHeight,
  useFooterHeight,
  useSidebarWidth
} from "../../hooks/useLayoutDimensions";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Sidebar-aware positioning hook for consistent UI layout
const useSidebarAwarePositioning = () => {
  const [sidebarWidth, setSidebarWidth] = useState(280);

  useEffect(() => {
    const checkSidebarState = () => {
      const selectors = [
        ".dashboard-sidebar",
        '[class*="sidebar"]',
        'nav[class*="left"]',
        "aside",
        '[class*="navigation"]',
        '[class*="menu"]',
        ".fixed.left-0",
        ".fixed.inset-y-0"
      ];

      let sidebar = null;
      for (const selector of selectors) {
        sidebar = document.querySelector(selector);
        if (sidebar) break;
      }

      if (sidebar) {
        const rect = sidebar.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(sidebar);
        const isVisible =
          computedStyle.display !== "none" &&
          computedStyle.visibility !== "hidden" &&
          rect.width > 0;

        if (isVisible) {
          setSidebarWidth(rect.width + 16);
        } else {
          setSidebarWidth(16);
        }
      } else {
        setSidebarWidth(16);
      }
    };

    checkSidebarState();
    setTimeout(checkSidebarState, 10);

    let rafId: number;
    const observer = new MutationObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkSidebarState);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "class",
        "style",
        "data-collapsed",
        "data-expanded",
        "data-state"
      ]
    });

    window.addEventListener("resize", checkSidebarState);

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(
          '[class*="sidebar"], [class*="menu"], [class*="nav"], button'
        ) ||
        target.getAttribute("aria-expanded") !== null
      ) {
        requestAnimationFrame(checkSidebarState);
        requestAnimationFrame(() => requestAnimationFrame(checkSidebarState));
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", checkSidebarState);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return { sidebarWidth };
};

interface ElevationPoint {
  id: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  elevation: number;
  timestamp: Date;
  type?: "marker" | "highest" | "lowest" | "intermediate";
  label?: string;
}

interface ElevationProfile {
  points: ElevationPoint[];
  totalDistance: number;
  elevationGain: number;
  elevationLoss: number;
  minElevation: number;
  maxElevation: number;
  averageElevation: number;
  grade: number;
}

interface SavedElevationProfile {
  id: string;
  name: string;
  points: ElevationPoint[];
  profile: ElevationProfile;
  unit: ElevationUnit;
  createdAt: Date;
  notes?: string;
}

interface ElevationToolProps {
  isActive: boolean;
  onToggle: () => void;
  map?: google.maps.Map | null;
  mapWidth: number;
  mapHeight: number;
  onDataChange?: (hasData: boolean) => void;
  isPrimaryTool?: boolean;
  multiToolMode?: boolean;
}

type ElevationUnit = "meters" | "feet";

const ElevationTool: React.FC<ElevationToolProps> = ({
  isActive,
  onToggle,
  map,
  mapWidth,
  mapHeight,
  onDataChange,
  isPrimaryTool = false,
  multiToolMode = false
}) => {
  const [elevationPoints, setElevationPoints] = useState<ElevationPoint[]>([]);
  const [unit, setUnit] = useState<ElevationUnit>("meters");
  const [showChart, setShowChart] = useState(true);
  const [showTerrain, setShowTerrain] = useState(false);
  const [showFullSizeGraph, setShowFullSizeGraph] = useState(false);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileMode, setProfileMode] = useState(false);
  const [fourPointMode, setFourPointMode] = useState(false);
  const [markedPoints, setMarkedPoints] = useState<ElevationPoint[]>([]);
  const [savedProfiles, setSavedProfiles] = useState<SavedElevationProfile[]>(
    []
  );
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileNotes, setProfileNotes] = useState("");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const { sidebarWidth } = useSidebarAwarePositioning();
  const { top: stackedTop } = useStackedToolboxPositioning(
    "elevation-tool",
    isActive
  );
  const navbarHeight = useNavbarHeight();
  const footerHeight = useFooterHeight();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Notify parent when data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(elevationPoints.length > 0 || savedProfiles.length > 0);
    }
  }, [elevationPoints.length, savedProfiles.length, onDataChange]);

  // Convert pixel coordinates to lat/lng (India bounds approximation)
  const pixelToLatLng = useCallback(
    (x: number, y: number) => {
      const lat = 37.6 - (y / mapHeight) * (37.6 - 6.4);
      const lng = 68.1 + (x / mapWidth) * (97.25 - 68.1);
      return { lat, lng };
    },
    [mapWidth, mapHeight]
  );

  // Enhanced mock elevation data generation (improved realism)
  const generateMockElevation = useCallback(
    (lat: number, lng: number): number => {
      // Create realistic elevation data based on India's geography
      // Himalayas in the north (higher latitudes), plains in the center, Western Ghats on west coast

      // Base elevation from latitude (Himalayas effect)
      let elevation = Math.max(0, (lat - 20) * 200); // Higher elevation towards north

      // Add Western Ghats effect (around 73-77 longitude)
      if (lng >= 73 && lng <= 77) {
        elevation += Math.abs(Math.sin(((lng - 75) * Math.PI) / 2)) * 800;
      }

      // Add Eastern Ghats effect (around 78-84 longitude)
      if (lng >= 78 && lng <= 84) {
        elevation += Math.abs(Math.sin(((lng - 81) * Math.PI) / 3)) * 400;
      }

      // Add some random variation for realism
      elevation += (Math.random() - 0.5) * 100;

      // Ensure minimum elevation (sea level)
      elevation = Math.max(0, elevation);

      // Add coastal effects (lower elevation near coasts)
      if (lat < 15 || lng < 70 || lng > 90) {
        elevation *= 0.3;
      }

      return Math.round(elevation);
    },
    []
  );

  // Real elevation data fetching using Google Elevation API
  const getRealElevation = useCallback(
    async (lat: number, lng: number): Promise<number> => {
      try {
        // Check if Google Maps is available
        if (
          typeof google !== "undefined" &&
          google.maps &&
          google.maps.ElevationService
        ) {
          const elevationService = new google.maps.ElevationService();

          return new Promise((resolve) => {
            elevationService.getElevationForLocations(
              {
                locations: [{ lat, lng }]
              },
              (results, status) => {
                if (status === google.maps.ElevationStatus.OK && results?.[0]) {
                  resolve(Math.round(results[0].elevation));
                } else {
                  console.warn("Elevation service failed:", status);
                  // Fallback to mock data if service fails
                  resolve(generateMockElevation(lat, lng));
                }
              }
            );
          });
        } else {
          // Fallback to mock data if Google Maps not available
          return generateMockElevation(lat, lng);
        }
      } catch (error) {
        console.error("Error fetching real elevation:", error);
        return generateMockElevation(lat, lng);
      }
    },
    [generateMockElevation]
  );

  // Calculate distance between two points
  const calculateDistance = useCallback(
    (point1: ElevationPoint, point2: ElevationPoint) => {
      const R = 6371; // Earth radius in km
      const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
      const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((point1.lat * Math.PI) / 180) *
          Math.cos((point2.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  // Generate elevation profile between two points with intermediate sampling
  const generateDetailedProfile = useCallback(
    async (
      startPoint: ElevationPoint,
      endPoint: ElevationPoint,
      sampleCount: number = 20
    ) => {
      const points: ElevationPoint[] = [];

      for (let i = 0; i <= sampleCount; i++) {
        const ratio = i / sampleCount;
        const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * ratio;
        const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * ratio;

        // Convert to pixel coordinates for display
        const x = startPoint.x + (endPoint.x - startPoint.x) * ratio;
        const y = startPoint.y + (endPoint.y - startPoint.y) * ratio;

        try {
          const elevation = await getRealElevation(lat, lng);

          points.push({
            id: `profile-${Date.now()}-${i}`,
            lat,
            lng,
            x,
            y,
            elevation,
            timestamp: new Date()
          });
        } catch (error) {
          console.error(`Error getting elevation for point ${i}:`, error);
        }

        // Add small delay to avoid overwhelming the API
        if (i < sampleCount) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      return points;
    },
    [getRealElevation]
  );

  // Convert elevation based on unit
  const convertElevation = useCallback(
    (elevationInMeters: number) => {
      return unit === "feet" ? elevationInMeters * 3.28084 : elevationInMeters;
    },
    [unit]
  );

  // Generate 4-point elevation data: 2 markers + highest + lowest between them
  const generateFourPointElevationData = useCallback(
    async (marker1: ElevationPoint, marker2: ElevationPoint) => {
      setIsGeneratingProfile(true);

      try {
        const notificationEvent = new CustomEvent("showNotification", {
          detail: {
            type: "info",
            title: "Finding Elevation Extremes",
            message:
              "Analyzing elevation data between markers to find highest and lowest points...",
            duration: 3000
          }
        });
        window.dispatchEvent(notificationEvent);

        // Generate sample points between the two markers (20 points for analysis)
        const samplePoints = [];
        const sampleCount = 20;

        for (let i = 0; i <= sampleCount; i++) {
          const ratio = i / sampleCount;
          const lat = marker1.lat + (marker2.lat - marker1.lat) * ratio;
          const lng = marker1.lng + (marker2.lng - marker1.lng) * ratio;
          const x = marker1.x + (marker2.x - marker1.x) * ratio;
          const y = marker1.y + (marker2.y - marker1.y) * ratio;

          try {
            const elevation = await getRealElevation(lat, lng);
            samplePoints.push({
              id: `sample-${Date.now()}-${i}`,
              lat,
              lng,
              x,
              y,
              elevation,
              timestamp: new Date(),
              type: "intermediate" as const
            });
          } catch (error) {
            console.error(
              `Error getting elevation for sample point ${i}:`,
              error
            );
          }

          // Small delay to avoid overwhelming the API
          if (i < sampleCount) {
            await new Promise((resolve) => setTimeout(resolve, 80));
          }
        }

        // Find highest and lowest points from samples
        let highestPoint = samplePoints[0];
        let lowestPoint = samplePoints[0];

        samplePoints.forEach((point) => {
          if (point.elevation > highestPoint.elevation) {
            highestPoint = point;
          }
          if (point.elevation < lowestPoint.elevation) {
            lowestPoint = point;
          }
        });

        // Create the final 4 points with proper labels and types
        const finalPoints: ElevationPoint[] = [
          { ...marker1, type: "marker", label: "Marker 1" },
          { ...marker2, type: "marker", label: "Marker 2" },
          {
            ...highestPoint,
            id: `highest-${Date.now()}`,
            type: "highest",
            label: `Highest Point (${convertElevation(
              highestPoint.elevation
            ).toFixed(1)} ${unit})`
          },
          {
            ...lowestPoint,
            id: `lowest-${Date.now()}`,
            type: "lowest",
            label: `Lowest Point (${convertElevation(
              lowestPoint.elevation
            ).toFixed(1)} ${unit})`
          }
        ];

        setElevationPoints(finalPoints);

        const successEvent = new CustomEvent("showNotification", {
          detail: {
            type: "success",
            title: "4-Point Analysis Complete",
            message: `Found highest point at ${convertElevation(
              highestPoint.elevation
            ).toFixed(1)} ${unit} and lowest at ${convertElevation(
              lowestPoint.elevation
            ).toFixed(1)} ${unit}`,
            duration: 5000
          }
        });
        window.dispatchEvent(successEvent);
      } catch (error) {
        console.error("Error generating 4-point elevation data:", error);

        const errorEvent = new CustomEvent("showNotification", {
          detail: {
            type: "error",
            title: "Analysis Failed",
            message:
              "Failed to analyze elevation data between markers. Please try again.",
            duration: 5000
          }
        });
        window.dispatchEvent(errorEvent);
      } finally {
        setIsGeneratingProfile(false);
      }
    },
    [getRealElevation, convertElevation, unit]
  );

  // Get high and low elevation points
  const getHighLowPoints = useMemo(() => {
    if (elevationPoints.length < 2) return { highPoint: null, lowPoint: null };

    let highPoint = elevationPoints[0];
    let lowPoint = elevationPoints[0];

    elevationPoints.forEach((point) => {
      if (point.elevation > highPoint.elevation) {
        highPoint = point;
      }
      if (point.elevation < lowPoint.elevation) {
        lowPoint = point;
      }
    });

    return { highPoint, lowPoint };
  }, [elevationPoints]);

  // Calculate elevation profile analysis
  const elevationProfile = useMemo((): ElevationProfile => {
    if (elevationPoints.length < 2) {
      return {
        points: elevationPoints,
        totalDistance: 0,
        elevationGain: 0,
        elevationLoss: 0,
        minElevation: elevationPoints[0]?.elevation || 0,
        maxElevation: elevationPoints[0]?.elevation || 0,
        averageElevation: elevationPoints[0]?.elevation || 0,
        grade: 0
      };
    }

    let totalDistance = 0;
    let elevationGain = 0;
    let elevationLoss = 0;
    let minElevation = elevationPoints[0].elevation;
    let maxElevation = elevationPoints[0].elevation;
    let totalElevation = 0;

    for (let i = 1; i < elevationPoints.length; i++) {
      const prev = elevationPoints[i - 1];
      const curr = elevationPoints[i];

      totalDistance += calculateDistance(prev, curr);

      const elevationDiff = curr.elevation - prev.elevation;
      if (elevationDiff > 0) {
        elevationGain += elevationDiff;
      } else {
        elevationLoss += Math.abs(elevationDiff);
      }

      minElevation = Math.min(minElevation, curr.elevation);
      maxElevation = Math.max(maxElevation, curr.elevation);
      totalElevation += curr.elevation;
    }

    const averageElevation = totalElevation / elevationPoints.length;
    const totalElevationChange =
      elevationPoints[elevationPoints.length - 1].elevation -
      elevationPoints[0].elevation;
    const grade =
      totalDistance > 0
        ? (totalElevationChange / (totalDistance * 1000)) * 100
        : 0;

    return {
      points: elevationPoints,
      totalDistance,
      elevationGain,
      elevationLoss,
      minElevation,
      maxElevation,
      averageElevation,
      grade
    };
  }, [elevationPoints, calculateDistance]);

  // Handle map click to get elevation
  const handleMapClick = useCallback(
    async (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isActive) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const { lat, lng } = pixelToLatLng(x, y);

      try {
        // Strict validation for India boundaries
        const validation = await validateGeofence(lat, lng, {
          strictMode: true,
          showWarnings: true,
          allowNearBorder: false,
          borderTolerance: 0
        });

        if (!validation.isValid) {
          const notificationEvent = new CustomEvent("showNotification", {
            detail: {
              type: "error",
              title: "Access Restricted",
              message: `${validation.message} ${
                validation.suggestedAction || ""
              }`,
              duration: 8000
            }
          });
          window.dispatchEvent(notificationEvent);
          return; // BLOCK elevation tool usage outside India
        }
      } catch (error) {
        console.error("Error validating geographic boundaries:", error);
        const notificationEvent = new CustomEvent("showNotification", {
          detail: {
            type: "error",
            title: "Validation Error",
            message:
              "Unable to validate location boundaries. Please try again.",
            duration: 5000
          }
        });
        window.dispatchEvent(notificationEvent);
        return;
      }

      setLoading(true);

      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Get real elevation data
        const elevation = await getRealElevation(lat, lng);

        const newPoint: ElevationPoint = {
          id: `elevation-${Date.now()}`,
          lat,
          lng,
          x,
          y,
          elevation,
          timestamp: new Date(),
          type: "marker",
          label: fourPointMode ? `Marker ${markedPoints.length + 1}` : undefined
        };

        if (fourPointMode) {
          // Handle 4-point mode: only allow 2 markers, then find highest/lowest
          if (markedPoints.length < 2) {
            const updatedMarkers = [...markedPoints, newPoint];
            setMarkedPoints(updatedMarkers);

            if (updatedMarkers.length === 2) {
              // Generate 4-point elevation data
              await generateFourPointElevationData(
                updatedMarkers[0],
                updatedMarkers[1]
              );
            } else {
              setElevationPoints(updatedMarkers);
            }
          } else {
            // Reset and start over with new marker
            setMarkedPoints([newPoint]);
            setElevationPoints([newPoint]);
          }
        } else if (profileMode) {
          setElevationPoints((prev) => [...prev, newPoint]);
        } else {
          setElevationPoints([newPoint]);
        }
      } catch (error) {
        console.error("Error fetching elevation:", error);
      } finally {
        setLoading(false);
      }
    },
    [
      isActive,
      profileMode,
      fourPointMode,
      markedPoints,
      pixelToLatLng,
      getRealElevation,
      generateFourPointElevationData
    ]
  );

  // Add Google Maps click listener for proper geographic validation enforcement
  useEffect(() => {
    if (!map || !isActive) return;

    const handleGoogleMapClick = async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      try {
        // Strict validation for India boundaries
        const validation = await validateGeofence(lat, lng, {
          strictMode: true,
          showWarnings: true,
          allowNearBorder: false,
          borderTolerance: 0
        });

        if (!validation.isValid) {
          const notificationEvent = new CustomEvent("showNotification", {
            detail: {
              type: "error",
              title: "Access Restricted",
              message: `${validation.message} ${
                validation.suggestedAction || ""
              }`,
              duration: 8000
            }
          });
          window.dispatchEvent(notificationEvent);
          return; // BLOCK elevation tool usage outside India
        }
      } catch (error) {
        console.error("Error validating geographic boundaries:", error);
        const notificationEvent = new CustomEvent("showNotification", {
          detail: {
            type: "error",
            title: "Validation Error",
            message:
              "Unable to validate location boundaries. Please try again.",
            duration: 5000
          }
        });
        window.dispatchEvent(notificationEvent);
        return;
      }

      // Call the same logic as handleMapClick using Google Maps coordinates
      setLoading(true);

      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Get real elevation data
        const elevation = await getRealElevation(lat, lng);

        // Convert to pixel coordinates for display
        const projection = map.getProjection();
        let x = 0,
          y = 0;
        if (projection) {
          const bounds = map.getBounds();
          const mapDiv = map.getDiv();
          if (bounds && mapDiv) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const mapRect = mapDiv.getBoundingClientRect();
            x = ((lng - sw.lng()) / (ne.lng() - sw.lng())) * mapRect.width;
            y = ((ne.lat() - lat) / (ne.lat() - sw.lat())) * mapRect.height;
          }
        }

        const newPoint: ElevationPoint = {
          id: `elevation-${Date.now()}`,
          lat,
          lng,
          x,
          y,
          elevation,
          timestamp: new Date(),
          type: "marker",
          label: fourPointMode ? `Marker ${markedPoints.length + 1}` : undefined
        };

        if (fourPointMode) {
          // Handle 4-point mode: only allow 2 markers, then find highest/lowest
          if (markedPoints.length < 2) {
            const updatedMarkers = [...markedPoints, newPoint];
            setMarkedPoints(updatedMarkers);

            if (updatedMarkers.length === 2) {
              // Generate 4-point elevation data
              await generateFourPointElevationData(
                updatedMarkers[0],
                updatedMarkers[1]
              );
            } else {
              setElevationPoints(updatedMarkers);
            }
          } else {
            // Reset and start over with new marker
            setMarkedPoints([newPoint]);
            setElevationPoints([newPoint]);
          }
        } else if (profileMode) {
          setElevationPoints((prev) => [...prev, newPoint]);
        } else {
          setElevationPoints([newPoint]);
        }
      } catch (error) {
        console.error("Error fetching elevation:", error);
      } finally {
        setLoading(false);
      }
    };

    const clickListener = map.addListener("click", handleGoogleMapClick);

    return () => {
      if (clickListener) {
        clickListener.remove();
      }
    };
  }, [
    map,
    isActive,
    fourPointMode,
    markedPoints,
    profileMode,
    getRealElevation,
    generateFourPointElevationData
  ]);

  // Clear all points
  const clearPoints = () => {
    setElevationPoints([]);
    setMarkedPoints([]);
  };

  // Remove last point
  const removeLastPoint = () => {
    setElevationPoints((prev) => prev.slice(0, -1));
  };

  // Generate detailed elevation profile between first and last marked points
  const generateDetailedElevationProfile = useCallback(async () => {
    if (elevationPoints.length < 2) {
      const notificationEvent = new CustomEvent("showNotification", {
        detail: {
          type: "warning",
          title: "Insufficient Points",
          message:
            "Mark at least 2 points on the map to generate a detailed elevation profile.",
          duration: 4000
        }
      });
      window.dispatchEvent(notificationEvent);
      return;
    }

    setIsGeneratingProfile(true);

    try {
      const startPoint = elevationPoints[0];
      const endPoint = elevationPoints[elevationPoints.length - 1];

      const notificationEvent = new CustomEvent("showNotification", {
        detail: {
          type: "info",
          title: "Generating Profile",
          message: "Fetching detailed elevation data between marked points...",
          duration: 3000
        }
      });
      window.dispatchEvent(notificationEvent);

      // Generate detailed profile with 30 sample points
      const detailedPoints = await generateDetailedProfile(
        startPoint,
        endPoint,
        30
      );

      // Replace current points with detailed profile
      setElevationPoints(detailedPoints);

      const successEvent = new CustomEvent("showNotification", {
        detail: {
          type: "success",
          title: "Profile Generated",
          message: `Generated detailed elevation profile with ${detailedPoints.length} data points.`,
          duration: 4000
        }
      });
      window.dispatchEvent(successEvent);
    } catch (error) {
      console.error("Error generating detailed profile:", error);

      const errorEvent = new CustomEvent("showNotification", {
        detail: {
          type: "error",
          title: "Profile Generation Failed",
          message:
            "Failed to generate detailed elevation profile. Please try again.",
          duration: 5000
        }
      });
      window.dispatchEvent(errorEvent);
    } finally {
      setIsGeneratingProfile(false);
    }
  }, [elevationPoints, generateDetailedProfile]);

  // Prepare Chart.js data
  const chartData = useMemo(() => {
    if (elevationPoints.length < 2) return null;

    // Calculate cumulative distances
    const distances = [0];
    for (let i = 1; i < elevationPoints.length; i++) {
      const dist = calculateDistance(
        elevationPoints[i - 1],
        elevationPoints[i]
      );
      distances.push(distances[distances.length - 1] + dist);
    }

    // Prepare datasets
    const datasets = [
      {
        label: "Elevation Profile",
        data: elevationPoints.map((point, index) => ({
          x: distances[index],
          y: point.elevation,
          point: point
        })),
        borderColor: "#2563eb",
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom
          );
          gradient.addColorStop(0, "rgba(37, 99, 235, 0.2)");
          gradient.addColorStop(0.6, "rgba(37, 99, 235, 0.1)");
          gradient.addColorStop(1, "rgba(37, 99, 235, 0.03)");
          return gradient;
        },
        fill: true,
        tension: 0.4, // Smooth wavy curves
        borderWidth: 3,
        pointBackgroundColor: elevationPoints.map((point) => {
          if (point.type === "highest") return "#ef4444";
          if (point.type === "lowest") return "#22c55e";
          if (point.type === "marker") return "#f97316";
          return "#3b82f6";
        }),
        pointBorderColor: "#ffffff",
        pointBorderWidth: elevationPoints.map((point) => {
          if (
            point.type === "highest" ||
            point.type === "lowest" ||
            point.type === "marker"
          )
            return 3;
          return 2;
        }),
        pointRadius: elevationPoints.map((point) => {
          if (point.type === "highest" || point.type === "lowest") return 8;
          if (point.type === "marker") return 6;
          return 4;
        }),
        pointHoverRadius: elevationPoints.map((point) => {
          if (point.type === "highest" || point.type === "lowest") return 10;
          if (point.type === "marker") return 8;
          return 6;
        })
      }
    ];

    return {
      datasets,
      labels: distances.map((d) => d.toFixed(1))
    };
  }, [elevationPoints, calculateDistance]);

  // Chart.js options - simplified configuration
  const chartOptions = useMemo(() => {
    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const point = context.raw.point;
              const lines = [
                `Elevation: ${context.parsed.y.toFixed(1)} ${
                  unit === "feet" ? "ft" : "m"
                }`,
                `Distance: ${context.parsed.x.toFixed(2)} km`
              ];
              if (point?.label) {
                lines.unshift(point.label);
              }
              return lines;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Distance (km)"
          }
        },
        y: {
          title: {
            display: true,
            text: `Elevation (${unit === "feet" ? "ft" : "m"})`
          }
        }
      }
    };
    return options;
  }, [unit]);

  // Get terrain classification
  const getTerrainClass = (elevation: number) => {
    if (elevation < 200) return { name: "Plains", color: "#22c55e" };
    if (elevation < 600) return { name: "Hills", color: "#eab308" };
    if (elevation < 1500) return { name: "Mountains", color: "#f97316" };
    return { name: "High Mountains", color: "#ef4444" };
  };

  // Save current elevation profile
  const saveProfile = useCallback(() => {
    if (elevationPoints.length < 2) {
      const notificationEvent = new CustomEvent("showNotification", {
        detail: {
          type: "warning",
          title: "Insufficient Data",
          message:
            "Please create an elevation profile with at least 2 points before saving.",
          duration: 5000
        }
      });
      window.dispatchEvent(notificationEvent);
      return;
    }

    if (!profileName.trim()) {
      const notificationEvent = new CustomEvent("showNotification", {
        detail: {
          type: "warning",
          title: "Name Required",
          message: "Please enter a name for the elevation profile.",
          duration: 5000
        }
      });
      window.dispatchEvent(notificationEvent);
      return;
    }

    const savedProfile: SavedElevationProfile = {
      id: editingProfileId || `elevation-profile-${Date.now()}`,
      name: profileName,
      points: [...elevationPoints],
      profile: elevationProfile,
      unit,
      createdAt: editingProfileId
        ? savedProfiles.find((p) => p.id === editingProfileId)?.createdAt ||
          new Date()
        : new Date(),
      notes: profileNotes
    };

    if (editingProfileId) {
      setSavedProfiles((prev) =>
        prev.map((p) => (p.id === editingProfileId ? savedProfile : p))
      );
    } else {
      setSavedProfiles((prev) => [...prev, savedProfile]);
    }

    setShowSaveDialog(false);
    setProfileName("");
    setProfileNotes("");
    setEditingProfileId(null);

    const notificationEvent = new CustomEvent("showNotification", {
      detail: {
        type: "success",
        title: editingProfileId ? "Profile Updated" : "Profile Saved",
        message: `Elevation profile "${savedProfile.name}" has been ${
          editingProfileId ? "updated" : "saved"
        } successfully.`,
        duration: 3000
      }
    });
    window.dispatchEvent(notificationEvent);
  }, [
    elevationPoints,
    elevationProfile,
    profileName,
    profileNotes,
    unit,
    editingProfileId,
    savedProfiles
  ]);

  // Load saved elevation profile
  const loadProfile = useCallback((profile: SavedElevationProfile) => {
    setElevationPoints(profile.points);
    setUnit(profile.unit);
    setSelectedProfileId(profile.id);
    setProfileMode(true);

    const notificationEvent = new CustomEvent("showNotification", {
      detail: {
        type: "success",
        title: "Profile Loaded",
        message: `Elevation profile "${profile.name}" loaded successfully.`,
        duration: 3000
      }
    });
    window.dispatchEvent(notificationEvent);
  }, []);

  // Delete saved elevation profile
  const deleteProfile = useCallback(
    (profileId: string) => {
      const profile = savedProfiles.find((p) => p.id === profileId);
      if (!profile) return;

      setSavedProfiles((prev) => prev.filter((p) => p.id !== profileId));

      if (selectedProfileId === profileId) {
        setSelectedProfileId(null);
      }

      const notificationEvent = new CustomEvent("showNotification", {
        detail: {
          type: "success",
          title: "Profile Deleted",
          message: `Elevation profile "${profile.name}" has been deleted.`,
          duration: 3000
        }
      });
      window.dispatchEvent(notificationEvent);
    },
    [savedProfiles, selectedProfileId]
  );

  // Export elevation data
  const exportData = useCallback(() => {
    if (elevationPoints.length === 0) {
      const notificationEvent = new CustomEvent("showNotification", {
        detail: {
          type: "warning",
          title: "No Data",
          message: "No elevation data to export.",
          duration: 5000
        }
      });
      window.dispatchEvent(notificationEvent);
      return;
    }

    const exportData = {
      type: "ElevationProfile",
      metadata: {
        createdAt: new Date().toISOString(),
        totalPoints: elevationPoints.length,
        unit,
        profileMode
      },
      profile: elevationProfile,
      points: elevationPoints.map((point) => ({
        coordinates: [point.lng, point.lat],
        elevation: point.elevation,
        timestamp: point.timestamp
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `elevation-profile-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const notificationEvent = new CustomEvent("showNotification", {
      detail: {
        type: "success",
        title: "Export Complete",
        message: "Elevation data exported successfully.",
        duration: 3000
      }
    });
    window.dispatchEvent(notificationEvent);
  }, [elevationPoints, elevationProfile, unit, profileMode]);

  // Edit existing profile
  const editProfile = useCallback((profile: SavedElevationProfile) => {
    setProfileName(profile.name);
    setProfileNotes(profile.notes || "");
    setEditingProfileId(profile.id);
    setShowSaveDialog(true);
  }, []);

  return (
    <>
      <ToolboxContainer
        title="Elevation Tool"
        isActive={isActive}
        onToggle={onToggle}
        position={{
          top: `${TOOLBOX_POSITIONING.top}px`,
          bottom: `${TOOLBOX_POSITIONING.bottom}px`,
          left: `${sidebarWidth + TOOLBOX_POSITIONING.padding}px`,
          width: `${TOOLBOX_POSITIONING.width}px`
        }}
        zIndex={Z_INDEX.TOOLBOX_ELEVATION}
      >
        <div
          className={`text-sm mb-3 p-3 rounded-lg border shadow-sm ${
            fourPointMode
              ? "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200"
              : profileMode
              ? "bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200"
              : "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200"
          }`}
        >
          <div className="font-semibold text-gray-800 mb-1 flex items-center">
            <span className="mr-2">
              {fourPointMode ? "🎯" : profileMode ? "📈" : "🗻"}
            </span>
            {fourPointMode ? "4-Point Analysis" : profileMode ? "Elevation Profile" : "Single Point Analysis"}
          </div>
          <div className="text-xs text-gray-600">
            {fourPointMode
              ? `${markedPoints.length}/2 markers placed. ${
                  markedPoints.length === 0
                    ? "Click to place first marker"
                    : markedPoints.length === 1
                    ? "Click to place second marker (will find highest/lowest between them)"
                    : "Analysis complete! Click to reset and start over."
                }`
              : profileMode
              ? "Click multiple points to create elevation profile"
              : "Click on the map to get elevation data"}
          </div>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="relative">
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as ElevationUnit)}
              className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 pr-8 bg-white hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none transition-all duration-200 cursor-pointer shadow-sm"
            >
              <option value="meters">🗻 Meters</option>
              <option value="feet">🏔️ Feet</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={profileMode}
                onChange={(e) => {
                  setProfileMode(e.target.checked);
                  if (e.target.checked) setFourPointMode(false);
                }}
                className="w-3 h-3 text-purple-600 focus:ring-purple-500"
              />
              <span>Profile Mode</span>
            </label>
          </div>

          <div className="flex items-center space-x-1">
            <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={fourPointMode}
                onChange={(e) => {
                  setFourPointMode(e.target.checked);
                  if (e.target.checked) {
                    setProfileMode(false);
                    clearPoints();
                  }
                }}
                className="w-3 h-3 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-orange-700">4-Point Analysis</span>
            </label>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-3">
          <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={showChart}
              onChange={(e) => setShowChart(e.target.checked)}
              className="w-3 h-3 text-purple-600 focus:ring-purple-500"
            />
            <span>Show Chart</span>
          </label>
          <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={showTerrain}
              onChange={(e) => setShowTerrain(e.target.checked)}
              className="w-3 h-3 text-purple-600 focus:ring-purple-500"
            />
            <span>Terrain Analysis</span>
          </label>
        </div>

        {/* Current Point Info */}
        {elevationPoints.length > 0 && (
          <div className="mb-3 p-2 bg-purple-50 rounded border border-purple-200">
            <div className="text-xs text-gray-600">
              <div className="font-medium text-purple-700">Latest Point:</div>
              <div>
                Elevation:{" "}
                {convertElevation(
                  elevationPoints[elevationPoints.length - 1].elevation
                ).toFixed(1)}{" "}
                {unit === "feet" ? "ft" : "m"}
              </div>
              <div>
                Coordinates:{" "}
                {elevationPoints[elevationPoints.length - 1].lat.toFixed(4)},{" "}
                {elevationPoints[elevationPoints.length - 1].lng.toFixed(4)}
              </div>
              {showTerrain && (
                <div className="flex items-center space-x-1 mt-1">
                  <div
                    className="w-3 h-3 rounded"
                    style={{
                      backgroundColor: getTerrainClass(
                        elevationPoints[elevationPoints.length - 1].elevation
                      ).color
                    }}
                  />
                  <span>
                    {
                      getTerrainClass(
                        elevationPoints[elevationPoints.length - 1].elevation
                      ).name
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Analysis */}
        {profileMode && elevationPoints.length > 1 && (
          <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
            <div className="text-xs text-gray-600">
              <div className="font-medium text-blue-700">Profile Analysis:</div>
              <div>
                Distance: {elevationProfile.totalDistance.toFixed(2)} km
              </div>
              <div>
                Elevation Gain:{" "}
                {convertElevation(elevationProfile.elevationGain).toFixed(1)}{" "}
                {unit === "feet" ? "ft" : "m"}
              </div>
              <div>
                Elevation Loss:{" "}
                {convertElevation(elevationProfile.elevationLoss).toFixed(1)}{" "}
                {unit === "feet" ? "ft" : "m"}
              </div>
              <div>Grade: {elevationProfile.grade.toFixed(1)}%</div>

              {/* High/Low Points */}
              {getHighLowPoints.highPoint && getHighLowPoints.lowPoint && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-red-700">Highest:</span>
                    <span>
                      {convertElevation(
                        getHighLowPoints.highPoint.elevation
                      ).toFixed(1)}{" "}
                      {unit === "feet" ? "ft" : "m"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-700">Lowest:</span>
                    <span>
                      {convertElevation(
                        getHighLowPoints.lowPoint.elevation
                      ).toFixed(1)}{" "}
                      {unit === "feet" ? "ft" : "m"}
                    </span>
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    Range:{" "}
                    {convertElevation(
                      getHighLowPoints.highPoint.elevation -
                        getHighLowPoints.lowPoint.elevation
                    ).toFixed(1)}{" "}
                    {unit === "feet" ? "ft" : "m"}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={removeLastPoint}
            disabled={elevationPoints.length === 0}
            className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Undo Point
          </button>
          <button
            onClick={clearPoints}
            disabled={elevationPoints.length === 0}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="space-y-2 mb-3">
          {/* Profile Generation */}
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={generateDetailedElevationProfile}
              disabled={elevationPoints.length < 2 || isGeneratingProfile}
              className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isGeneratingProfile ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-3 w-3 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating Profile...
                </>
              ) : (
                "🗺️ Generate Detailed Profile"
              )}
            </button>
          </div>

          {/* CRUD Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={elevationPoints.length < 2}
              className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Profile
            </button>
            <button
              onClick={exportData}
              disabled={elevationPoints.length === 0}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Export Data
            </button>
          </div>
        </div>

        {/* Elevation Chart */}
        {showChart && elevationPoints.length > 1 && (
          <div className="border rounded p-2 bg-gray-50 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-700">
                Elevation Profile
              </div>
              <button
                onClick={() => setShowFullSizeGraph(true)}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
                title="View full-size graph"
              >
                🔍 Full Size
              </button>
            </div>
            <div
              ref={chartContainerRef}
              className="w-full border rounded bg-white p-2 overflow-auto"
              style={{ height: "300px" }}
            >
              {chartData ? (
                <Line data={chartData} options={chartOptions as any} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Chart will appear when you have at least 2 elevation points
                </div>
              )}
            </div>

            {/* 4-Point Mode Legend */}
            {fourPointMode && elevationPoints.length > 0 && (
              <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                <div className="text-xs font-medium text-orange-800 mb-1">
                  4-Point Analysis Legend
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-orange-500 rounded-full border border-white"></div>
                    <span className="text-orange-700">Markers</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full border border-white"></div>
                    <span className="text-red-700">Highest</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                    <span className="text-green-700">Lowest</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
                    <span className="text-blue-700">Standard</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saved Profiles */}
        {savedProfiles.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-2">
              Saved Profiles ({savedProfiles.length})
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {savedProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="p-2 bg-gray-50 rounded border text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 truncate flex-1">
                      {profile.name}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => loadProfile(profile)}
                        className="px-1 py-0.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                        title="Load Profile"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => editProfile(profile)}
                        className="px-1 py-0.5 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 transition-colors"
                        title="Edit Profile"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProfile(profile.id)}
                        className="px-1 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                        title="Delete Profile"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                  <div className="text-gray-500 text-xs">
                    {profile.points.length} points •{" "}
                    {profile.profile.totalDistance.toFixed(1)} km
                  </div>
                  {profile.notes && (
                    <div className="text-gray-500 text-xs mt-1 italic truncate">
                      {profile.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
              <div className="text-xs text-purple-600">
                Fetching elevation data...
              </div>
            </div>
          </div>
        )}
      </ToolboxContainer>

      {/* Save Dialog */}
      <StandardDialog
        isOpen={showSaveDialog}
        onClose={() => {
          setShowSaveDialog(false);
          setProfileName("");
          setProfileNotes("");
          setEditingProfileId(null);
        }}
        title={`${editingProfileId ? "Edit" : "Save"} Elevation Profile`}
        size="md"
      >
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter profile name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={profileNotes}
                onChange={(e) => setProfileNotes(e.target.value)}
                placeholder="Add description or notes"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="text-sm text-purple-800 space-y-1">
                <div>
                  <strong>Points:</strong> {elevationPoints.length}
                </div>
                <div>
                  <strong>Distance:</strong>{" "}
                  {elevationProfile.totalDistance.toFixed(2)} km
                </div>
                <div>
                  <strong>Elevation Range:</strong>{" "}
                  {convertElevation(elevationProfile.minElevation).toFixed(0)} -{" "}
                  {convertElevation(elevationProfile.maxElevation).toFixed(0)}{" "}
                  {unit === "feet" ? "ft" : "m"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setProfileName("");
                setProfileNotes("");
                setEditingProfileId(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveProfile}
              disabled={!profileName.trim()}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {editingProfileId ? "Update" : "Save"} Profile
            </button>
          </div>
        </div>
      </StandardDialog>

      {/* Full-Size Graph Overlay */}
      {showFullSizeGraph && (
        <div
          className="fixed bg-white"
          style={{
            zIndex: 99999,
            top: `${navbarHeight}px`,
            left: `${sidebarWidth}px`,
            bottom: `${footerHeight}px`,
            right: "0"
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                📊 Elevation Profile - Interactive Analysis
              </h3>
              <button
                onClick={() => setShowFullSizeGraph(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 group"
                title="Close (Esc)"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500 group-hover:text-gray-700" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-hidden">
            {/* Enhanced Stats - 4 Key Data Points */}
            <div className="mb-6 grid grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-sm font-medium text-blue-700">
                  Total Distance
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {elevationProfile.totalDistance.toFixed(2)} km
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {(elevationProfile.totalDistance * 1000).toFixed(0)}m
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-sm font-medium text-red-700">
                  Highest Point
                </div>
                <div className="text-2xl font-bold text-red-900">
                  {getHighLowPoints.highPoint
                    ? convertElevation(
                        getHighLowPoints.highPoint.elevation
                      ).toFixed(0)
                    : "0"}{" "}
                  {unit === "feet" ? "ft" : "m"}
                </div>
                <div className="text-xs text-red-600 mt-1">
                  {getHighLowPoints.highPoint
                    ? `${getHighLowPoints.highPoint.lat.toFixed(
                        4
                      )}, ${getHighLowPoints.highPoint.lng.toFixed(4)}`
                    : "N/A"}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-sm font-medium text-green-700">
                  Lowest Point
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {getHighLowPoints.lowPoint
                    ? convertElevation(
                        getHighLowPoints.lowPoint.elevation
                      ).toFixed(0)
                    : "0"}{" "}
                  {unit === "feet" ? "ft" : "m"}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {getHighLowPoints.lowPoint
                    ? `${getHighLowPoints.lowPoint.lat.toFixed(
                        4
                      )}, ${getHighLowPoints.lowPoint.lng.toFixed(4)}`
                    : "N/A"}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-sm font-medium text-purple-700">
                  Total Elevation Gain
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {convertElevation(elevationProfile.elevationGain).toFixed(0)}{" "}
                  {unit === "feet" ? "ft" : "m"}
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  Grade: {elevationProfile.grade.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Interactive Large Graph */}
            <div
              className="flex-1 border rounded-lg p-4 bg-gray-50"
              style={{ height: "calc(100vh - 280px)" }}
            >
              <div className="relative h-full">
                <div className="w-full h-full border rounded bg-white p-4">
                  {chartData ? (
                    <Line
                      data={chartData}
                      options={
                        {
                          ...chartOptions,
                          plugins: {
                            ...chartOptions.plugins,
                            title: {
                              display: true,
                              text: "Elevation Profile - Full Size View",
                              font: {
                                size: 18,
                                weight: "bold"
                              },
                              color: "#374151"
                            }
                          }
                        } as any
                      }
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-lg">
                      Chart will appear when you have at least 2 elevation
                      points
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Elevation Overlay */}
      {isActive && (
        <div
          className="absolute inset-0 z-10 cursor-crosshair"
          onClick={handleMapClick}
          style={{
            pointerEvents: isPrimaryTool || !multiToolMode ? "auto" : "none"
          }}
        >
          {/* Render elevation points */}
          {elevationPoints.map((point, index) => {
            const { highPoint, lowPoint } = getHighLowPoints;

            // Determine enhanced point styling based on type and elevation
            let markerClass =
              "absolute w-5 h-5 bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform cursor-pointer";
            let labelClass =
              "absolute -top-12 left-1/2 transform -translate-x-1/2 text-xs font-bold text-purple-700 bg-white px-3 py-1 rounded-lg shadow-lg whitespace-nowrap border border-purple-200 backdrop-blur-sm bg-opacity-95";
            let iconClass =
              "absolute inset-0 flex items-center justify-center text-white text-xs";
            let icon = "📍";
            let labelText = `${convertElevation(point.elevation).toFixed(
              0
            )} ${unit}`;

            // Use the type property for enhanced styling in 4-point mode
            if (point.type === "highest") {
              markerClass =
                "absolute w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 border-3 border-white rounded-full shadow-xl transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform cursor-pointer animate-pulse";
              labelClass =
                "absolute -top-14 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-700 bg-red-50 px-3 py-2 rounded-lg shadow-xl whitespace-nowrap border-2 border-red-300 backdrop-blur-sm bg-opacity-95";
              iconClass =
                "absolute inset-0 flex items-center justify-center text-white text-sm";
              icon = "🔺";
              labelText =
                point.label ||
                `Highest: ${convertElevation(point.elevation).toFixed(
                  0
                )} ${unit}`;
            } else if (point.type === "lowest") {
              markerClass =
                "absolute w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 border-3 border-white rounded-full shadow-xl transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform cursor-pointer animate-pulse";
              labelClass =
                "absolute -top-14 left-1/2 transform -translate-x-1/2 text-xs font-bold text-green-700 bg-green-50 px-3 py-2 rounded-lg shadow-xl whitespace-nowrap border-2 border-green-300 backdrop-blur-sm bg-opacity-95";
              iconClass =
                "absolute inset-0 flex items-center justify-center text-white text-sm";
              icon = "🔻";
              labelText =
                point.label ||
                `Lowest: ${convertElevation(point.elevation).toFixed(
                  0
                )} ${unit}`;
            } else if (point.type === "marker") {
              markerClass =
                "absolute w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform cursor-pointer";
              labelClass =
                "absolute -top-12 left-1/2 transform -translate-x-1/2 text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-lg shadow-lg whitespace-nowrap border border-orange-200 backdrop-blur-sm bg-opacity-95";
              iconClass =
                "absolute inset-0 flex items-center justify-center text-white text-xs";
              icon = "🎯";
              labelText =
                point.label ||
                `${convertElevation(point.elevation).toFixed(0)} ${unit}`;
            } else {
              // Fallback to legacy high/low point detection for profile mode
              const { highPoint, lowPoint } = getHighLowPoints;
              if (highPoint && point.id === highPoint.id) {
                markerClass =
                  "absolute w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 border-3 border-white rounded-full shadow-xl transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform cursor-pointer animate-pulse";
                labelClass =
                  "absolute -top-14 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-700 bg-red-50 px-3 py-2 rounded-lg shadow-xl whitespace-nowrap border-2 border-red-300 backdrop-blur-sm bg-opacity-95";
                iconClass =
                  "absolute inset-0 flex items-center justify-center text-white text-sm";
                icon = "🔺";
              } else if (lowPoint && point.id === lowPoint.id) {
                markerClass =
                  "absolute w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 border-3 border-white rounded-full shadow-xl transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform cursor-pointer animate-pulse";
                labelClass =
                  "absolute -top-14 left-1/2 transform -translate-x-1/2 text-xs font-bold text-green-700 bg-green-50 px-3 py-2 rounded-lg shadow-xl whitespace-nowrap border-2 border-green-300 backdrop-blur-sm bg-opacity-95";
                iconClass =
                  "absolute inset-0 flex items-center justify-center text-white text-sm";
                icon = "🔻";
              }
            }

            return (
              <div key={point.id}>
                {/* Point marker */}
                <div
                  className={markerClass}
                  style={{
                    left: point.x,
                    top: point.y
                  }}
                >
                  <div className={iconClass}>
                    {point.type === "highest"
                      ? "H"
                      : point.type === "lowest"
                      ? "L"
                      : icon}
                  </div>
                </div>

                {/* Line to next point in profile mode */}
                {profileMode && index < elevationPoints.length - 1 && (
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: "100%", height: "100%" }}
                  >
                    <line
                      x1={point.x}
                      y1={point.y}
                      x2={elevationPoints[index + 1].x}
                      y2={elevationPoints[index + 1].y}
                      stroke="#8b5cf6"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  </svg>
                )}
              </div>
            );
          })}

          {/* Loading indicator */}
          {loading && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <span className="text-sm text-purple-600">
                    Getting elevation...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ElevationTool;
