import React, { useState, useCallback, useRef } from 'react';

interface BulkUserImportProps {
  isOpen: boolean;
  onClose: () => void;
  onUsersImported?: (users: any[]) => void;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

export const BulkUserImport: React.FC<BulkUserImportProps> = ({
  isOpen,
  onClose,
  onUsersImported,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (selectedFile) {
      setFile(selectedFile);
      setImportErrors([]);
      setImportSuccess(false);

      // Parse CSV for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        const preview = lines.slice(1, 6).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const row: any = { row: index + 2 };
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });
          return row;
        }).filter(row => Object.values(row).some(v => v !== ''));

        setPreviewData(preview);
      };
      reader.readAsText(selectedFile);
    }
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file =>
      file.type === 'text/csv' ||
      file.name.endsWith('.csv') ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx')
    );

    if (csvFile) {
      handleFileSelect(csvFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setImportErrors([]);

    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate some validation errors
      const errors: ImportError[] = [
        { row: 3, field: 'email', message: 'Invalid email format' },
        { row: 7, field: 'phoneNumber', message: 'Invalid phone number' },
      ];

      if (errors.length > 0) {
        setImportErrors(errors);
      } else {
        setImportSuccess(true);
        onUsersImported?.(previewData);
      }
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'name', 'email', 'employeeId', 'phoneNumber', 'department',
      'role', 'gender', 'supervisorName', 'officeLocation',
      'street', 'city', 'state', 'pinCode', 'assignedStates'
    ];

    const sampleData = [
      {
        name: 'John Doe',
        email: 'john.doe@company.com',
        employeeId: 'EMP001',
        phoneNumber: '+91-9876543210',
        department: 'Engineering',
        role: 'technician',
        gender: 'male',
        supervisorName: 'Jane Smith',
        officeLocation: 'Delhi Head Office',
        street: '123 Tech Park, Sector 62',
        city: 'New Delhi',
        state: 'Delhi',
        pinCode: '110001',
        assignedStates: 'Delhi,Punjab,Haryana'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        employeeId: 'EMP002',
        phoneNumber: '+91-9876543211',
        department: 'Operations',
        role: 'manager',
        gender: 'female',
        supervisorName: 'Admin User',
        officeLocation: 'Mumbai Branch',
        street: '456 Business District, Andheri',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400001',
        assignedStates: 'Maharashtra,Gujarat,Goa'
      },
      {
        name: 'Raj Patel',
        email: 'raj.patel@company.com',
        employeeId: 'EMP003',
        phoneNumber: '+91-9876543212',
        department: 'Field Services',
        role: 'technician',
        gender: 'male',
        supervisorName: 'Jane Smith',
        officeLocation: 'Bangalore Tech Center',
        street: '789 Innovation Hub, Electronic City',
        city: 'Bangalore',
        state: 'Karnataka',
        pinCode: '560100',
        assignedStates: 'Karnataka,Tamil Nadu,Kerala'
      }
    ];

    const csvRows = [
      headers.join(','),
      ...sampleData.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row] || '';
          // Escape values containing commas or quotes
          return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user_import_template_${new Date().getFullYear()}_${(new Date().getMonth() + 1).toString().padStart(2, '0')}_${new Date().getDate().toString().padStart(2, '0')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Bulk User Import</h2>
                <p className="text-indigo-100 text-sm">Import multiple users from CSV/Excel file</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-blue-100 rounded">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-1">Import Instructions</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Download the template CSV file and fill in your user data</li>
                    <li>• Required fields: name, email, employeeId, role, department</li>
                    <li>• Maximum 1000 users per import</li>
                    <li>• Ensure email addresses are unique</li>
                    <li>• Role values: admin, manager, technician, viewer</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Template Download */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">CSV Template</h3>
                <p className="text-sm text-gray-500">Download the template with example data and required columns</p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download Template</span>
              </button>
            </div>

            {/* File Upload */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="space-y-3">
                <div className="flex justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3 3m0 0l3-3m-3 3V9" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">
                    {file ? file.name : 'Drop your CSV file here, or click to browse'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports CSV and Excel files up to 10MB
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Data */}
            {previewData.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Preview (First 5 rows)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-1 text-left font-medium text-gray-700">Name</th>
                        <th className="px-2 py-1 text-left font-medium text-gray-700">Email</th>
                        <th className="px-2 py-1 text-left font-medium text-gray-700">Employee ID</th>
                        <th className="px-2 py-1 text-left font-medium text-gray-700">Role</th>
                        <th className="px-2 py-1 text-left font-medium text-gray-700">Department</th>
                        <th className="px-2 py-1 text-left font-medium text-gray-700">Office</th>
                        <th className="px-2 py-1 text-left font-medium text-gray-700">States</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-2 py-1 text-gray-900">{row.name || '-'}</td>
                          <td className="px-2 py-1 text-gray-900">{row.email || '-'}</td>
                          <td className="px-2 py-1 text-gray-900">{row.employeeId || '-'}</td>
                          <td className="px-2 py-1 text-gray-900">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              row.role === 'admin' ? 'bg-red-100 text-red-800' :
                              row.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                              row.role === 'technician' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {row.role || '-'}
                            </span>
                          </td>
                          <td className="px-2 py-1 text-gray-900">{row.department || '-'}</td>
                          <td className="px-2 py-1 text-gray-900">{row.officeLocation || '-'}</td>
                          <td className="px-2 py-1 text-gray-900">
                            {row.assignedStates ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-800">
                                {row.assignedStates.split(',').length} states
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import Errors */}
            {importErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-900 mb-2">Import Errors Found</h3>
                <div className="space-y-1">
                  {importErrors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700">
                      Row {error.row}, {error.field}: {error.message}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {importSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-green-900">Import Successful!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  All users have been imported successfully.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing || importSuccess}
            className={`px-6 py-2 text-white rounded-lg transition-colors ${
              !file || importing || importSuccess
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {importing ? (
              <div className="flex items-center space-x-2">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Importing...</span>
              </div>
            ) : (
              'Import Users'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUserImport;