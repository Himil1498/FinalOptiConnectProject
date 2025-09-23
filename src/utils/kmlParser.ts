export interface KMLPlacemark {
  id: string;
  name: string;
  description?: string;
  coordinates: {
    lat: number;
    lng: number;
    altitude?: number;
  };
  extendedData: Record<string, string>;
  type: 'pop' | 'subPop';
}

export interface KMLData {
  placemarks: KMLPlacemark[];
  bounds?: google.maps.LatLngBounds;
}

export class KMLParser {
  static async parseKMLFile(url: string, type: 'pop' | 'subPop'): Promise<KMLData> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch KML file: ${response.statusText}`);
      }

      const kmlText = await response.text();
      return this.parseKMLString(kmlText, type);
    } catch (error) {
      console.error('Error fetching KML file:', error);
      throw error;
    }
  }

  static parseKMLString(kmlString: string, type: 'pop' | 'subPop'): KMLData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(kmlString, 'text/xml');

    const placemarks: KMLPlacemark[] = [];
    const bounds = new google.maps.LatLngBounds();

    // Get all Placemark elements
    const placemarkElements = doc.querySelectorAll('Placemark');

    placemarkElements.forEach((placemark, index) => {
      try {
        const name = placemark.querySelector('name')?.textContent || `${type}_${index}`;
        const description = placemark.querySelector('description')?.textContent || '';

        // Get coordinates
        const coordinatesElement = placemark.querySelector('coordinates');
        if (!coordinatesElement?.textContent) return;

        const coords = coordinatesElement.textContent.trim().split(',');
        if (coords.length < 2) return;

        const lng = parseFloat(coords[0]);
        const lat = parseFloat(coords[1]);
        const altitude = coords[2] ? parseFloat(coords[2]) : undefined;

        if (isNaN(lat) || isNaN(lng)) return;

        // Get extended data
        const extendedData: Record<string, string> = {};
        const dataElements = placemark.querySelectorAll('ExtendedData Data');

        dataElements.forEach(dataElement => {
          const nameAttr = dataElement.getAttribute('name');
          const valueElement = dataElement.querySelector('value');

          if (nameAttr && valueElement?.textContent) {
            extendedData[nameAttr] = valueElement.textContent;
          }
        });

        const placemarkData: KMLPlacemark = {
          id: extendedData.unique_id || `${type}_${index}`,
          name,
          description,
          coordinates: { lat, lng, altitude },
          extendedData,
          type
        };

        placemarks.push(placemarkData);
        bounds.extend(new google.maps.LatLng(lat, lng));
      } catch (error) {
        console.error('Error parsing placemark:', error);
      }
    });

    return {
      placemarks,
      bounds: placemarks.length > 0 ? bounds : undefined
    };
  }

  static createMarkerIcon(type: 'pop' | 'subPop'): google.maps.Icon {
    const color = type === 'pop' ? '#FF6B6B' : '#4ECDC4';

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8" fill="${color}" stroke="#fff" stroke-width="2"/>
          <text x="12" y="16" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">
            ${type === 'pop' ? 'P' : 'S'}
          </text>
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(24, 24),
      anchor: new google.maps.Point(12, 12)
    };
  }

  static createInfoWindowContent(placemark: KMLPlacemark): string {
    const { name, extendedData, type } = placemark;

    return `
      <div style="max-width: 300px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
          ${name}
        </h3>
        <div style="margin-bottom: 8px;">
          <span style="background: ${type === 'pop' ? '#FF6B6B' : '#4ECDC4'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
            ${type === 'pop' ? 'POP' : 'Sub POP'}
          </span>
        </div>
        ${Object.entries(extendedData).map(([key, value]) => {
          if (!value || key === 'unique_id') return '';
          const displayName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          return `
            <div style="margin-bottom: 6px;">
              <strong style="color: #374151; font-size: 12px;">${displayName}:</strong>
              <span style="color: #6b7280; font-size: 12px; margin-left: 4px;">${value}</span>
            </div>
          `;
        }).join('')}
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af;">
          Coordinates: ${placemark.coordinates.lat.toFixed(6)}, ${placemark.coordinates.lng.toFixed(6)}
        </div>
      </div>
    `;
  }
}