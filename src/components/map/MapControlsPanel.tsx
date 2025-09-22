import React, { useState } from "react";
import {
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  GlobeAltIcon,
  MapIcon as MapIconOutline,
  PhotoIcon,
  BeakerIcon,
  MapPinIcon,
  ArrowsRightLeftIcon,
  Squares2X2Icon
} from "@heroicons/react/24/outline";
import { useFullscreen } from "../../hooks/useFullscreen";
import SimpleTooltip from "../common/SimpleTooltip";

interface MapControlsPanelProps {
  map: google.maps.Map | null;
  currentMapType?: string;
  onMapTypeChange?: (mapType: string) => void;
  multiToolMode?: boolean;
  onMultiToolToggle?: () => void;
}

const MapControlsPanel: React.FC<MapControlsPanelProps> = ({
  map,
  currentMapType = "hybrid",
  onMapTypeChange,
  multiToolMode = false,
  onMultiToolToggle
}) => {
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentLocationMarker, setCurrentLocationMarker] = useState<google.maps.Marker | null>(null);

  const handleZoomIn = () => {
    if (map) {
      const currentZoom = map.getZoom();
      if (currentZoom !== undefined) {
        const newZoom = Math.min(currentZoom + 1, 20); // Max zoom 20
        map.setZoom(newZoom);
      }
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const currentZoom = map.getZoom();
      if (currentZoom !== undefined) {
        const newZoom = Math.max(currentZoom - 1, 4); // Min zoom 4
        map.setZoom(newZoom);
      }
    }
  };

  const handleMyLocation = () => {
    if (map && navigator.geolocation) {
      // Show loading notification
      const loadingEvent = new CustomEvent('showNotification', {
        detail: {
          type: 'info',
          title: 'Finding Location',
          message: 'Locating your current position...',
          duration: 3000
        }
      });
      window.dispatchEvent(loadingEvent);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          // More responsive location setting - use setCenter and setZoom together
          map.setCenter(pos);
          map.setZoom(17);

          // Force map to focus properly
          setTimeout(() => {
            map.setCenter(pos);
            map.panTo(pos);
          }, 100);

          // Clear any existing location markers first
          if (currentLocationMarker) {
            currentLocationMarker.setMap(null);
          }

          // Add a marker for current location
          const marker = new google.maps.Marker({
            position: pos,
            map: map,
            title: "Your Current Location",
            icon: {
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              scaledSize: new google.maps.Size(40, 40)
            },
            animation: google.maps.Animation.DROP
          });

          // Store marker in component state for cleanup
          setCurrentLocationMarker(marker);

          // Show success notification with coordinates
          const successEvent = new CustomEvent('showNotification', {
            detail: {
              type: 'success',
              title: 'Location Found',
              message: `Located at ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`,
              duration: 4000
            }
          });
          window.dispatchEvent(successEvent);

          // Add info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-semibold text-sm">Your Current Location</h3>
                <p class="text-xs text-gray-600">
                  Lat: ${pos.lat.toFixed(6)}<br>
                  Lng: ${pos.lng.toFixed(6)}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  Accuracy: ±${position.coords.accuracy?.toFixed(0) || 'Unknown'} meters
                </p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          // Auto-open info window immediately and keep it open longer
          setTimeout(() => {
            infoWindow.open(map, marker);
            setTimeout(() => infoWindow.close(), 5000);
          }, 200);
        },
        (error) => {
          let errorMessage = "Location access denied or unavailable.";
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please enable location permissions.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
          }

          const errorEvent = new CustomEvent('showNotification', {
            detail: {
              type: 'error',
              title: 'Location Error',
              message: errorMessage,
              duration: 5000
            }
          });
          window.dispatchEvent(errorEvent);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000 // 1 minute for more accurate location
        }
      );
    } else {
      const errorEvent = new CustomEvent('showNotification', {
        detail: {
          type: 'error',
          title: 'Geolocation Unavailable',
          message: 'Your browser does not support geolocation.',
          duration: 4000
        }
      });
      window.dispatchEvent(errorEvent);
    }
  };

  const handleResizeToIndia = () => {
    if (map) {
      // More precise India bounds for better focus
      const indiaBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(6.4, 68.2), // Southwest corner (Kanyakumari area)
        new google.maps.LatLng(37.1, 97.4) // Northeast corner (Kashmir area)
      );

      // Fit bounds with padding for better visualization
      map.fitBounds(indiaBounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      });

      // Ensure proper zoom level for India-only view
      setTimeout(() => {
        const currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 5.5) {
          map.setZoom(5.5); // Optimal zoom level for India
        }
      }, 300);

      // Center precisely on India's geographic center
      setTimeout(() => {
        const indiaCenter = { lat: 20.5937, lng: 78.9629 };
        map.setCenter(indiaCenter);
      }, 500);

      // Show notification
      const notificationEvent = new CustomEvent('showNotification', {
        detail: {
          type: 'success',
          title: 'Map Focused',
          message: 'Map view adjusted to show India',
          duration: 2000
        }
      });
      window.dispatchEvent(notificationEvent);
    }
  };

  const handleMapTypeChange = (mapType: string) => {
    if (map) {
      // Changing map type

      let googleMapType: google.maps.MapTypeId;
      switch (mapType) {
        case "roadmap":
          googleMapType = google.maps.MapTypeId.ROADMAP;
          break;
        case "satellite":
          googleMapType = google.maps.MapTypeId.SATELLITE;
          break;
        case "terrain":
          googleMapType = google.maps.MapTypeId.TERRAIN;
          break;
        case "hybrid":
        default:
          googleMapType = google.maps.MapTypeId.HYBRID;
          break;
      }

      try {
        // Apply the map type change
        map.setMapTypeId(googleMapType);

        // Small delay to ensure map type is applied
        setTimeout(() => {
          // Force a refresh to ensure the change takes effect
          google.maps.event.trigger(map, "resize");
        }, 100);

        // Update parent state
        if (onMapTypeChange) {
          onMapTypeChange(mapType);
        }

        // Show notification
        const notificationEvent = new CustomEvent('showNotification', {
          detail: {
            type: 'success',
            title: 'Map Type Changed',
            message: `Switched to ${mapType.charAt(0).toUpperCase() + mapType.slice(1)} view`,
            duration: 2000
          }
        });
        window.dispatchEvent(notificationEvent);

        // Map type successfully changed
      } catch (error) {
        console.error("Error changing map type:", error);

        const errorEvent = new CustomEvent('showNotification', {
          detail: {
            type: 'error',
            title: 'Map Type Error',
            message: 'Failed to change map type. Please try again.',
            duration: 3000
          }
        });
        window.dispatchEvent(errorEvent);
      }
    } else {
      console.warn("Map instance not available for maptype change");

      const warningEvent = new CustomEvent('showNotification', {
        detail: {
          type: 'warning',
          title: 'Map Not Ready',
          message: 'Map is still loading. Please try again in a moment.',
          duration: 3000
        }
      });
      window.dispatchEvent(warningEvent);
    }
  };

  const mapTypes = [
    {
      id: "roadmap",
      name: "Roadmap",
      icon: MapIconOutline,
      description: "Default road map view"
    },
    {
      id: "satellite",
      name: "Satellite",
      icon: PhotoIcon,
      description: "Satellite imagery"
    },
    {
      id: "hybrid",
      name: "Hybrid",
      icon: GlobeAltIcon,
      description: "Satellite with labels"
    },
    {
      id: "terrain",
      name: "Terrain",
      icon: BeakerIcon,
      description: "Terrain view"
    }
  ];

  return (
    <div
      className="fixed right-0 z-50 w-12"
      style={{ top: "4rem" }}
    >
      <div className="h-full bg-gradient-to-b from-white via-gray-50/98 to-gray-100/95 backdrop-blur-sm border-l-2 border-gray-200/60 shadow-2xl flex flex-col">
        {/* Clean icon strip like collapsed sidebar */}
        <div className="flex flex-col space-y-1 p-1">
          {/* Zoom Controls */}
          <SimpleTooltip content="Zoom In" position="left">
            <button
              onClick={handleZoomIn}
              className="w-full flex items-center justify-center p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 ease-in-out group hover:scale-110 active:scale-95"
            >
              <MagnifyingGlassPlusIcon className="h-6 w-6 text-blue-500 group-hover:text-blue-600 transition-colors duration-200" />
            </button>
          </SimpleTooltip>
          <SimpleTooltip content="Zoom Out" position="left">
            <button
              onClick={handleZoomOut}
              className="w-full flex items-center justify-center p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 ease-in-out group hover:scale-110 active:scale-95"
            >
              <MagnifyingGlassMinusIcon className="h-6 w-6 text-blue-500 group-hover:text-blue-600 transition-colors duration-200" />
            </button>
          </SimpleTooltip>

          {/* Location & Resize Controls */}
          <SimpleTooltip content="Find My Location" position="left">
            <button
              onClick={handleMyLocation}
              className="w-full flex items-center justify-center p-2 hover:bg-green-50 hover:text-green-600 rounded-lg transition-all duration-200 ease-in-out group hover:scale-110 active:scale-95"
            >
              <MapPinIcon className="h-6 w-6 text-green-500 group-hover:text-green-600 transition-colors duration-200" />
            </button>
          </SimpleTooltip>
          <SimpleTooltip content="Fit India on Screen" position="left">
            <button
              onClick={handleResizeToIndia}
              className="w-full flex items-center justify-center p-2 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-all duration-200 ease-in-out group hover:scale-110 active:scale-95"
            >
              <ArrowsRightLeftIcon className="h-6 w-6 text-emerald-500 group-hover:text-emerald-600 transition-colors duration-200" />
            </button>
          </SimpleTooltip>

          {/* Fullscreen Control */}
          <SimpleTooltip
            content={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            position="left"
          >
            <button
              onClick={toggleFullscreen}
              className="w-full flex items-center justify-center p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 ease-in-out group hover:scale-110 active:scale-95"
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="h-6 w-6 text-purple-500 group-hover:text-purple-600 transition-colors duration-200" />
              ) : (
                <ArrowsPointingOutIcon className="h-6 w-6 text-purple-500 group-hover:text-purple-600 transition-colors duration-200" />
              )}
            </button>
          </SimpleTooltip>

          {/* Map Type Controls */}
          <SimpleTooltip content="Change Map Type" position="left">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center p-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all duration-200 ease-in-out group hover:scale-110 active:scale-95"
            >
              <GlobeAltIcon className="h-6 w-6 text-indigo-500 group-hover:text-indigo-600 transition-colors duration-200" />
            </button>
          </SimpleTooltip>

          {/* Multi-Tool Mode Toggle */}
          {onMultiToolToggle && (
            <SimpleTooltip
              content={multiToolMode ? "Switch to Single Tool Mode" : "Switch to Multi-Tool Mode"}
              position="left"
            >
              <button
                onClick={onMultiToolToggle}
                className={`w-full flex items-center justify-center p-2 rounded-lg transition-all duration-200 ease-in-out group hover:scale-110 active:scale-95 ${
                  multiToolMode
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'hover:bg-amber-50 hover:text-amber-600'
                }`}
              >
                <Squares2X2Icon className={`h-6 w-6 transition-colors duration-200 ${
                  multiToolMode
                    ? 'text-green-700'
                    : 'text-amber-500 group-hover:text-amber-600'
                }`} />
              </button>
            </SimpleTooltip>
          )}
        </div>
      </div>

      {/* Expanded Map Type Options */}
      {isExpanded && (
        <div className="absolute top-0 right-full mr-3 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-3 min-w-[180px] animate-in slide-in-from-right-4 duration-300">
          <div className="text-xs font-semibold text-gray-800 mb-3 px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg border border-gray-200">
            🗺️ Map Type
          </div>
          <div className="space-y-1">
            {mapTypes.map((type) => {
              const Icon = type.icon;
              const isActive = currentMapType === type.id;

              return (
                <button
                  key={type.id}
                  onClick={() => {
                    handleMapTypeChange(type.id);
                    setIsExpanded(false);
                  }}
                  className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-colors text-left ${
                    isActive
                      ? "bg-blue-100 text-blue-900 border border-blue-200"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                  title={type.description}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{type.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Click outside to close map type menu */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

export default MapControlsPanel;
