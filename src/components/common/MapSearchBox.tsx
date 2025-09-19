import React, { useEffect, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  HomeIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";

interface SearchSuggestion {
  id: string;
  displayName: string;
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  types: string[];
  isGeocoded?: boolean;
  geocodeResult?: google.maps.GeocoderResult;
}

interface MapSearchBoxProps {
  map: google.maps.Map | null;
  onPlaceSelect?: (place: any) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
  onFocusChange?: (focused: boolean) => void;
}

const MapSearchBox: React.FC<MapSearchBoxProps> = ({
  map,
  onPlaceSelect,
  searchValue,
  onSearchChange,
  className = "",
  onFocusChange
}) => {
  const [query, setQuery] = useState(searchValue || "");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
        onFocusChange?.(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onFocusChange]);

  // Use Text Search API instead of deprecated AutocompleteService
  const searchPlaces = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    try {
      // Using Text Search (New) API
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error("Google Maps API key not found");
        fallbackToGeocoding(searchQuery);
        return;
      }

      const response = await fetch(
        `https://places.googleapis.com/v1/places:searchText`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "places.displayName,places.formattedAddress,places.location,places.id,places.types"
          },
          body: JSON.stringify({
            textQuery: `${searchQuery} India`,
            regionCode: "IN",
            maxResultCount: 10
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.places && data.places.length > 0) {
        const formattedSuggestions: SearchSuggestion[] = data.places.map((place: any) => ({
          id: place.id,
          displayName: place.displayName?.text || "Unknown Place",
          formattedAddress: place.formattedAddress || "",
          location: place.location,
          types: place.types || []
        }));

        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Places API Error:", error);
      // Fallback to Geocoding API for basic search
      fallbackToGeocoding(searchQuery);
    }

    setIsLoading(false);
  };

  // Fallback method using Geocoding API
  const fallbackToGeocoding = (searchQuery: string) => {
    if (!window.google?.maps?.Geocoder) return;

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode(
      {
        address: `${searchQuery}, India`,
        componentRestrictions: { country: "IN" }
      },
      (results, status) => {
        if (status === "OK" && results && results.length > 0) {
          const formattedSuggestions: SearchSuggestion[] = results
            .slice(0, 10)
            .map((result, index) => ({
              id: result.place_id || `geocode_${index}`,
              displayName:
                result.address_components[0]?.long_name ||
                result.formatted_address.split(",")[0],
              formattedAddress: result.formatted_address,
              location: {
                latitude: result.geometry.location.lat(),
                longitude: result.geometry.location.lng()
              },
              types: result.types || [],
              isGeocoded: true,
              geocodeResult: result
            }));

          setSuggestions(formattedSuggestions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
        setIsLoading(false);
      }
    );
  };

  // Sync with external search value
  useEffect(() => {
    if (searchValue !== undefined) {
      setQuery(searchValue);
    }
  }, [searchValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Call external onChange if provided
    if (onSearchChange) {
      onSearchChange(value);
    }

    // Debounce search requests
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Reduced debounce time for better responsiveness
    searchTimeout.current = setTimeout(() => {
      if (value.trim().length > 2) {
        searchPlaces(value);
      } else if (value.trim().length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 150);
  };

  const clearMarkers = () => {
    markers.forEach((marker) => {
      if (marker.setMap) {
        marker.setMap(null);
      }
    });
    setMarkers([]);
  };

  const handleSelectPlace = (suggestion: SearchSuggestion) => {
    if (!suggestion.location || !map) return;

    clearMarkers();

    const lat = suggestion.location.latitude;
    const lng = suggestion.location.longitude;
    const position = { lat, lng };

    // Center map on selected location
    map.panTo(position);
    map.setZoom(15);

    // Create marker
    const marker = new window.google.maps.Marker({
      position,
      map,
      title: suggestion.displayName,
      animation: window.google.maps.Animation.DROP,
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        scaledSize: new window.google.maps.Size(40, 40)
      }
    });

    // Detailed InfoWindow
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
      <div style="padding:8px; max-width:280px; font-family:Arial,sans-serif;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <h4 style="margin:0; font-size:14px; color:#1976d2;">${
            suggestion.displayName
          }</h4>
          <button id="close-info" style="background:#f44336; color:white; border:none; border-radius:4px; cursor:pointer; padding:2px 6px; font-size:12px;">✖</button>
        </div>
        <p style="margin:2px 0; color:#555; font-size:12px;"><strong>Address:</strong> ${
          suggestion.formattedAddress
        }</p>
        <p style="margin:2px 0; color:#555; font-size:12px;"><strong>Coordinates:</strong> ${lat.toFixed(
          6
        )}, ${lng.toFixed(6)}</p>
        ${
          suggestion.types && suggestion.types.length > 0
            ? `<p style="margin:2px 0; color:#555; font-size:12px;"><strong>Types:</strong> ${suggestion.types
                .join(", ")
                .replace(/_/g, " ")}</p>`
            : ""
        }
        <p style="margin:2px 0; color:#555; font-size:12px;"><strong>Place ID:</strong> ${
          suggestion.id
        }</p>
        <p style="margin:2px 0; color:#555; font-size:12px;"><strong>Source:</strong> ${
          suggestion.isGeocoded ? "Geocoding API" : "Places API"
        }</p>
      </div>
    `,
      disableAutoPan: false,
      maxWidth: 280
    });

    // Hide default close button and attach custom red close button
    window.google.maps.event.addListener(infoWindow, "domready", () => {
      const iwClose = document.querySelector(".gm-ui-hover-effect");
      if (iwClose) (iwClose as HTMLElement).style.display = "none";

      const closeBtn = document.getElementById("close-info");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => infoWindow.close());
      }
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });

    // Auto-open the InfoWindow when marker is first created
    setTimeout(() => {
      infoWindow.open(map, marker);
    }, 500);

    setMarkers([marker]);

    if (onPlaceSelect) {
      onPlaceSelect({
        name: suggestion.displayName,
        address: suggestion.formattedAddress,
        location: { lat, lng },
        id: suggestion.id,
        types: suggestion.types
      });
    }

    setQuery(suggestion.displayName);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    clearMarkers();
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    if (onSearchChange) {
      onSearchChange("");
    }
  };

  const getTypeIcon = (types: string[]) => {
    if (types.includes('administrative_area_level_1') || types.includes('administrative_area_level_2')) {
      return <GlobeAltIcon className="h-4 w-4 text-blue-500" />;
    }
    if (types.includes('establishment') || types.includes('point_of_interest')) {
      return <BuildingOfficeIcon className="h-4 w-4 text-green-500" />;
    }
    if (types.includes('locality') || types.includes('sublocality')) {
      return <HomeIcon className="h-4 w-4 text-orange-500" />;
    }
    return <MapPinIcon className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div ref={searchBoxRef} className={`relative transition-all duration-300 ease-in-out ${className} ${isFocused ? 'scale-105 z-50' : 'z-10'}`}>
      <div className="relative">
        <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${isFocused ? 'text-indigo-500' : 'text-gray-400'}`} />
        <input
          type="text"
          placeholder="Search places in India..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            onFocusChange?.(true);
          }}
          onBlur={(e) => {
            // Keep focus state if clicking on suggestions
            if (!searchBoxRef.current?.contains(e.relatedTarget as Node)) {
              setTimeout(() => {
                setIsFocused(false);
                onFocusChange?.(false);
              }, 100);
            }
          }}
          className={`pl-10 pr-10 py-2 w-full text-sm border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none transition-all duration-300 ease-in-out ${
            isFocused
              ? 'border-indigo-500 ring-2 ring-indigo-500 shadow-lg scale-100'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        />
        {query && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center z-50">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            <span className="text-sm text-gray-600">Searching...</span>
          </div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectPlace(suggestion);
              }}
              onMouseDown={(e) => e.preventDefault()}
              className="w-full flex items-start p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
            >
              <div className="flex-shrink-0 mt-1 mr-3">
                {getTypeIcon(suggestion.types)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {suggestion.displayName}
                </div>
                <div className="text-gray-500 text-xs mt-1 line-clamp-2">
                  {suggestion.formattedAddress}
                </div>
                {suggestion.types && suggestion.types[0] && (
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {suggestion.types[0].replace(/_/g, " ")}
                    </span>
                    {suggestion.isGeocoded && (
                      <span className="ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Geocoded
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions &&
        suggestions.length === 0 &&
        !isLoading &&
        query.length > 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center z-50">
            <div className="text-gray-500 text-sm">
              No places found for "{query}"
            </div>
          </div>
        )}
    </div>
  );
};

export default MapSearchBox;