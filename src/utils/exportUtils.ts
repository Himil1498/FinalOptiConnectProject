import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { KMLPlacemark } from './kmlParser';

export type ExportFormat = 'csv' | 'xlsx' | 'kml' | 'kmz';

export class ExportUtils {
  static async exportData(data: KMLPlacemark[], format: ExportFormat, filename: string): Promise<void> {
    switch (format) {
      case 'csv':
        this.exportToCSV(data, filename);
        break;
      case 'xlsx':
        this.exportToXLSX(data, filename);
        break;
      case 'kml':
        this.exportToKML(data, filename);
        break;
      case 'kmz':
        await this.exportToKMZ(data, filename);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  static exportToCSV(data: KMLPlacemark[], filename: string): void {
    const headers = [
      'Name',
      'Type',
      'Latitude',
      'Longitude',
      'Description',
      'Status',
      'Created Date',
      'Last Updated'
    ];

    const rows = data.map(item => [
      item.name || '',
      item.type || '',
      item.coordinates.lat.toString(),
      item.coordinates.lng.toString(),
      item.description || '',
      item.extendedData?.status || '',
      item.extendedData?.createdDate || '',
      item.extendedData?.lastUpdated || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }

  static exportToXLSX(data: KMLPlacemark[], filename: string): void {
    const worksheetData = [
      ['Name', 'Type', 'Latitude', 'Longitude', 'Description', 'Status', 'Created Date', 'Last Updated'],
      ...data.map(item => [
        item.name || '',
        item.type || '',
        item.coordinates.lat,
        item.coordinates.lng,
        item.description || '',
        item.extendedData?.status || '',
        item.extendedData?.createdDate || '',
        item.extendedData?.lastUpdated || ''
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Name
      { wch: 10 }, // Type
      { wch: 12 }, // Latitude
      { wch: 12 }, // Longitude
      { wch: 30 }, // Description
      { wch: 12 }, // Status
      { wch: 15 }, // Created Date
      { wch: 15 }  // Last Updated
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Infrastructure Data');

    const xlsxData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.downloadFile(xlsxData, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  static exportToKML(data: KMLPlacemark[], filename: string): void {
    const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${filename}</name>
    <description>Exported Infrastructure Data</description>`;

    const kmlStyles = `
    <Style id="popStyle">
      <IconStyle>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href>
        </Icon>
      </IconStyle>
    </Style>
    <Style id="subPopStyle">
      <IconStyle>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/blue-circle.png</href>
        </Icon>
      </IconStyle>
    </Style>`;

    const kmlPlacemarks = data.map(item => {
      const styleId = item.type === 'pop' ? 'popStyle' : 'subPopStyle';
      const extendedDataXml = item.extendedData ?
        Object.entries(item.extendedData)
          .map(([key, value]) => `        <Data name="${key}"><value>${this.escapeXml(value)}</value></Data>`)
          .join('\n') : '';

      return `    <Placemark>
      <name>${this.escapeXml(item.name || '')}</name>
      <description>${this.escapeXml(item.description || '')}</description>
      <styleUrl>#${styleId}</styleUrl>
      ${extendedDataXml ? `<ExtendedData>\n${extendedDataXml}\n      </ExtendedData>` : ''}
      <Point>
        <coordinates>${item.coordinates.lng},${item.coordinates.lat},0</coordinates>
      </Point>
    </Placemark>`;
    }).join('\n');

    const kmlFooter = `
  </Document>
</kml>`;

    const kmlContent = kmlHeader + kmlStyles + kmlPlacemarks + kmlFooter;
    this.downloadFile(kmlContent, `${filename}.kml`, 'application/vnd.google-earth.kml+xml');
  }

  static async exportToKMZ(data: KMLPlacemark[], filename: string): Promise<void> {
    const kmlContent = this.generateKMLContent(data, filename);

    const zip = new JSZip();
    zip.file('doc.kml', kmlContent);

    const kmzData = await zip.generateAsync({ type: 'blob' });
    this.downloadBlob(kmzData, `${filename}.kmz`, 'application/vnd.google-earth.kmz');
  }

  private static generateKMLContent(data: KMLPlacemark[], filename: string): string {
    const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${filename}</name>
    <description>Exported Infrastructure Data</description>`;

    const kmlStyles = `
    <Style id="popStyle">
      <IconStyle>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href>
        </Icon>
      </IconStyle>
    </Style>
    <Style id="subPopStyle">
      <IconStyle>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/blue-circle.png</href>
        </Icon>
      </IconStyle>
    </Style>`;

    const kmlPlacemarks = data.map(item => {
      const styleId = item.type === 'pop' ? 'popStyle' : 'subPopStyle';
      const extendedDataXml = item.extendedData ?
        Object.entries(item.extendedData)
          .map(([key, value]) => `        <Data name="${key}"><value>${this.escapeXml(value)}</value></Data>`)
          .join('\n') : '';

      return `    <Placemark>
      <name>${this.escapeXml(item.name || '')}</name>
      <description>${this.escapeXml(item.description || '')}</description>
      <styleUrl>#${styleId}</styleUrl>
      ${extendedDataXml ? `<ExtendedData>\n${extendedDataXml}\n      </ExtendedData>` : ''}
      <Point>
        <coordinates>${item.coordinates.lng},${item.coordinates.lat},0</coordinates>
      </Point>
    </Placemark>`;
    }).join('\n');

    const kmlFooter = `
  </Document>
</kml>`;

    return kmlHeader + kmlStyles + kmlPlacemarks + kmlFooter;
  }

  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private static downloadFile(content: string | ArrayBuffer, filename: string, contentType: string): void {
    const blob = new Blob([content], { type: contentType });
    this.downloadBlob(blob, filename, contentType);
  }

  private static downloadBlob(blob: Blob, filename: string, contentType: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static getExportFormats(): Array<{ value: ExportFormat; label: string; icon: string }> {
    return [
      { value: 'csv', label: 'CSV', icon: '📊' },
      { value: 'xlsx', label: 'Excel', icon: '📈' },
      { value: 'kml', label: 'KML', icon: '🌍' },
      { value: 'kmz', label: 'KMZ', icon: '🗜️' }
    ];
  }
}