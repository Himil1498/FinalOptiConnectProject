import React, { useRef, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { setMapCenter, setMapZoom, setSelectedTower } from "../../store/slices/mapSlice";
import { MapContainerProps } from "./types/MapInterfaces";

const MapContainer: React.FC<MapContainerProps> = ({ center, zoom, onMapReady }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const { towers, layers } = useSelector((state: RootState) => state.map);
  const dispatch = useDispatch<AppDispatch>();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const boundaryRef = useRef<google.maps.Data | null>(null);

  // Debounce refs for preventing excessive updates
  const centerUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const zoomUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Performance optimization refs
  const isDraggingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  // Load India boundary from GeoJSON file
  const loadIndiaBoundary = useCallback(async () => {
    if (!googleMapRef.current) return;

    try {
      const response = await fetch("/india-boundary.geojson");
      const geoJsonData = await response.json();

      // Add data layer for boundaries
      const dataLayer = new google.maps.Data();
      dataLayer.addGeoJson(geoJsonData);

      // Style the boundary
      dataLayer.setStyle({
        strokeColor: "#2563eb",
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: "transparent",
        fillOpacity: 0,
        clickable: false
      });

      dataLayer.setMap(googleMapRef.current);
      boundaryRef.current = dataLayer;
    } catch (error) {
      console.error("Error loading India boundary:", error);
    }
  }, []);

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case "active":
        return "#10B981";
      case "inactive":
        return "#6B7280";
      case "maintenance":
        return "#F59E0B";
      case "critical":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  }, []);

  const getTowerIcon = (type: string, status: string): string => {
    const baseUrl = "/icons/";
    const statusColor =
      status === "active"
        ? "green"
        : status === "maintenance"
        ? "yellow"
        : status === "critical"
        ? "red"
        : "gray";

    return `${baseUrl}tower-${type}-${statusColor}.png`;
  };

  const createInfoWindowContent = useCallback(
    (tower: any): string => {
      return `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">${
          tower.name
        }</h3>
        <div style="font-size: 14px; line-height: 1.4;">
          <p><strong>Type:</strong> ${tower.type.toUpperCase()}</p>
          <p><strong>Status:</strong> <span style="color: ${getStatusColor(
            tower.status
          )}">${
        tower.status.charAt(0).toUpperCase() + tower.status.slice(1)
      }</span></p>
          <p><strong>Signal Strength:</strong> ${tower.signal_strength}%</p>
          <p><strong>Coverage Radius:</strong> ${tower.coverage_radius}km</p>
          <p><strong>Installed:</strong> ${new Date(
            tower.installed_date
          ).toLocaleDateString()}</p>
          <p><strong>Last Maintenance:</strong> ${new Date(
            tower.last_maintenance
          ).toLocaleDateString()}</p>
          <div style="margin-top: 8px;">
            <strong>Equipment:</strong><br>
            ${tower.equipment
              .map(
                (item: string) =>
                  `<span style="display: inline-block; background: #e3f2fd; padding: 2px 6px; margin: 2px; border-radius: 3px; font-size: 12px;">${item}</span>`
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
    },
    [getStatusColor]
  );

  // Optimized event handlers with better performance
  const handleCenterChanged = useCallback(() => {
    if (googleMapRef.current && !isDraggingRef.current) {
      if (centerUpdateTimeoutRef.current) {
        clearTimeout(centerUpdateTimeoutRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        centerUpdateTimeoutRef.current = setTimeout(() => {
          if (googleMapRef.current) {
            const newCenter = googleMapRef.current.getCenter();
            if (newCenter) {
              const lat = newCenter.lat();
              const lng = newCenter.lng();
              dispatch(setMapCenter([lat, lng]));
            }
          }
        }, 50);
      });
    }
  }, [dispatch]);

  const handleZoomChanged = useCallback(() => {
    if (googleMapRef.current) {
      if (zoomUpdateTimeoutRef.current) {
        clearTimeout(zoomUpdateTimeoutRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        zoomUpdateTimeoutRef.current = setTimeout(() => {
          if (googleMapRef.current) {
            const newZoom = googleMapRef.current.getZoom();
            if (newZoom) {
              dispatch(setMapZoom(newZoom));
            }
          }
        }, 100);
      });
    }
  }, [dispatch]);

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    handleCenterChanged();
  }, [handleCenterChanged]);

  // Initialize Google Map (only once)
  useEffect(() => {
    if (mapRef.current && !googleMapRef.current) {
      try {
        googleMapRef.current = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeId: google.maps.MapTypeId.HYBRID,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: false,
          scaleControl: false,
          rotateControl: false,
          panControl: false,
          gestureHandling: "greedy",
          scrollwheel: true,
          draggable: true,
          clickableIcons: true,
          keyboardShortcuts: true,
          minZoom: 4,
          maxZoom: 20,
          disableDoubleClickZoom: false,
          draggableCursor: 'grab',
          draggingCursor: 'grabbing',
          styles: [
            {
              featureType: "poi.business",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "poi.government",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "poi.school",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        // Add event listeners with performance optimization
        googleMapRef.current.addListener("center_changed", handleCenterChanged);
        googleMapRef.current.addListener("zoom_changed", handleZoomChanged);
        googleMapRef.current.addListener("dragstart", handleDragStart);
        googleMapRef.current.addListener("dragend", handleDragEnd);

        // Add idle event for better performance
        googleMapRef.current.addListener("idle", () => {
          if (isDraggingRef.current) {
            isDraggingRef.current = false;
          }
        });

        // Load India boundary GeoJSON
        loadIndiaBoundary();

        // Notify parent component that map is ready
        if (onMapReady) {
          onMapReady(googleMapRef.current);
        }
      } catch (error) {
        console.error("Error creating Google Map:", error);
      }
    }

    // Cleanup timeouts and animation frames on unmount
    return () => {
      if (centerUpdateTimeoutRef.current) {
        clearTimeout(centerUpdateTimeoutRef.current);
      }
      if (zoomUpdateTimeoutRef.current) {
        clearTimeout(zoomUpdateTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [center, zoom, handleCenterChanged, handleZoomChanged, loadIndiaBoundary, onMapReady]);

  // Update map center and zoom when props change
  useEffect(() => {
    if (googleMapRef.current) {
      const currentCenter = googleMapRef.current.getCenter();
      const currentZoom = googleMapRef.current.getZoom();

      if (
        currentCenter &&
        (Math.abs(currentCenter.lat() - center.lat) > 0.0001 ||
          Math.abs(currentCenter.lng() - center.lng) > 0.0001)
      ) {
        googleMapRef.current.panTo(center);
      }

      if (currentZoom !== zoom) {
        googleMapRef.current.setZoom(zoom);
      }
    }
  }, [center.lat, center.lng, zoom]);

  // Update towers on map
  useEffect(() => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers for visible towers
    const towersLayer = layers.find((layer) => layer.id === "towers");
    if (towersLayer?.visible) {
      towers.forEach((tower) => {
        const marker = new google.maps.Marker({
          position: { lat: tower.position[0], lng: tower.position[1] },
          map: googleMapRef.current,
          title: tower.name,
          icon: {
            url: getTowerIcon(tower.type, tower.status),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32)
          }
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: createInfoWindowContent(tower)
        });

        marker.addListener("click", () => {
          infoWindow.open(googleMapRef.current, marker);
          dispatch(setSelectedTower(tower));
        });

        // Add coverage circle
        if (layers.find((layer) => layer.id === "coverage")?.visible) {
          new google.maps.Circle({
            strokeColor: getStatusColor(tower.status),
            strokeOpacity: 0.6,
            strokeWeight: 2,
            fillColor: getStatusColor(tower.status),
            fillOpacity: 0.1,
            map: googleMapRef.current,
            center: { lat: tower.position[0], lng: tower.position[1] },
            radius: tower.coverage_radius * 1000
          });
        }

        markersRef.current.push(marker);
      });
    }
  }, [towers, layers, dispatch, createInfoWindowContent, getStatusColor]);

  // Toggle boundary visibility
  useEffect(() => {
    const boundariesLayer = layers.find((layer) => layer.id === "boundaries");
    if (boundaryRef.current) {
      boundaryRef.current.setMap(
        boundariesLayer?.visible ? googleMapRef.current : null
      );
    }
  }, [layers]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
};

export default MapContainer;