import React, { useState, useCallback } from 'react';
import { SystemConfiguration } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import {
  CogIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface SystemConfigurationManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConfigItemProps {
  config: SystemConfiguration;
  onUpdate: (id: string, value: any) => Promise<void>;
}

const ConfigItem: React.FC<ConfigItemProps> = ({ config, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(config.value);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateValue = useCallback((newValue: any): string | null => {
    if (!config.validation) return null;

    const { required, min, max, pattern, enum: enumValues } = config.validation;

    if (required && (newValue === undefined || newValue === null || newValue === '')) {
      return 'This field is required';
    }

    if (config.dataType === 'number') {
      const numValue = Number(newValue);
      if (isNaN(numValue)) return 'Must be a valid number';
      if (min !== undefined && numValue < min) return `Must be at least ${min}`;
      if (max !== undefined && numValue > max) return `Must be at most ${max}`;
    }

    if (config.dataType === 'string' && pattern) {
      const regex = new RegExp(pattern);
      if (!regex.test(newValue)) return 'Invalid format';
    }

    if (enumValues && !enumValues.includes(newValue)) {
      return `Must be one of: ${enumValues.join(', ')}`;
    }

    return null;
  }, [config]);

  const handleSave = async () => {
    const error = validateValue(value);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsLoading(true);
    setValidationError(null);

    try {
      await onUpdate(config.id, value);
      setIsEditing(false);
    } catch (error) {
      setValidationError('Failed to update configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(config.value);
    setIsEditing(false);
    setValidationError(null);
  };

  const renderValueInput = () => {
    if (!isEditing) {
      return (
        <span className="text-sm font-medium text-gray-900">
          {config.dataType === 'boolean' ? (value ? 'Enabled' : 'Disabled') :
           config.dataType === 'json' ? JSON.stringify(value) :
           String(value)}
        </span>
      );
    }

    switch (config.dataType) {
      case 'boolean':
        return (
          <select
            value={value ? 'true' : 'false'}
            onChange={(e) => setValue(e.target.value === 'true')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            min={config.validation?.min}
            max={config.validation?.max}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        );

      case 'array':
        return (
          <textarea
            value={Array.isArray(value) ? value.join('\n') : value}
            onChange={(e) => setValue(e.target.value.split('\n').filter(line => line.trim()))}
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="One item per line"
          />
        );

      case 'json':
        return (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                setValue(JSON.parse(e.target.value));
              } catch {
                setValue(e.target.value);
              }
            }}
            rows={6}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
            placeholder="Valid JSON format"
          />
        );

      default:
        if (config.validation?.enum) {
          return (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {config.validation.enum.map((option: any) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        }

        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            pattern={config.validation?.pattern}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        );
    }
  };

  const getCategoryColor = (category: SystemConfiguration['category']) => {
    switch (category) {
      case 'security': return 'bg-red-100 text-red-800';
      case 'performance': return 'bg-green-100 text-green-800';
      case 'features': return 'bg-blue-100 text-blue-800';
      case 'integrations': return 'bg-purple-100 text-purple-800';
      case 'storage': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-medium text-gray-900 mr-3">{config.key}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(config.category)}`}>
              {config.category}
            </span>
            {config.requiresRestart && (
              <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Requires Restart
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">{config.description}</p>

          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Current Value
              </label>
              {renderValueInput()}
            </div>

            {validationError && (
              <div className="flex items-center text-sm text-red-600">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {validationError}
              </div>
            )}

            <div className="text-xs text-gray-500">
              <span>Default: {String(config.defaultValue)}</span>
              <span className="mx-2">•</span>
              <span>Environment: {config.environment}</span>
              <span className="mx-2">•</span>
              <span>Last modified: {new Date(config.lastModified).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isLoading || !config.isEditable}
                className="p-2 text-green-600 hover:bg-green-50 rounded-md disabled:opacity-50"
                title="Save changes"
              >
                {isLoading ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckIcon className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-md disabled:opacity-50"
                title="Cancel changes"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              disabled={!config.isEditable}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-50"
              title={config.isEditable ? "Edit configuration" : "This configuration is read-only"}
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}

          {!config.isEditable && (
            <InformationCircleIcon className="h-4 w-4 text-gray-400" title="Read-only configuration" />
          )}
        </div>
      </div>
    </div>
  );
};

export const SystemConfigurationManager: React.FC<SystemConfigurationManagerProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const { addNotification } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [configurations, setConfigurations] = useState<SystemConfiguration[]>([
    {
      id: 'config-1',
      category: 'security',
      key: 'session.timeout',
      value: 3600,
      description: 'Session timeout in seconds. Users will be automatically logged out after this period of inactivity.',
      dataType: 'number',
      defaultValue: 3600,
      isEditable: true,
      requiresRestart: false,
      validation: { required: true, min: 300, max: 86400 },
      lastModified: new Date().toISOString(),
      modifiedBy: user?.id || 'system',
      environment: 'all'
    },
    {
      id: 'config-2',
      category: 'security',
      key: 'auth.maxLoginAttempts',
      value: 5,
      description: 'Maximum number of failed login attempts before account lockout.',
      dataType: 'number',
      defaultValue: 5,
      isEditable: true,
      requiresRestart: false,
      validation: { required: true, min: 1, max: 20 },
      lastModified: new Date().toISOString(),
      modifiedBy: user?.id || 'system',
      environment: 'all'
    },
    {
      id: 'config-3',
      category: 'performance',
      key: 'map.clustering.enabled',
      value: true,
      description: 'Enable clustering for map markers to improve performance with large datasets.',
      dataType: 'boolean',
      defaultValue: true,
      isEditable: true,
      requiresRestart: false,
      lastModified: new Date().toISOString(),
      modifiedBy: user?.id || 'system',
      environment: 'all'
    },
    {
      id: 'config-4',
      category: 'features',
      key: 'analytics.retentionDays',
      value: 90,
      description: 'Number of days to retain analytics data before automatic cleanup.',
      dataType: 'number',
      defaultValue: 90,
      isEditable: true,
      requiresRestart: false,
      validation: { required: true, min: 7, max: 365 },
      lastModified: new Date().toISOString(),
      modifiedBy: user?.id || 'system',
      environment: 'all'
    },
    {
      id: 'config-5',
      category: 'integrations',
      key: 'email.provider',
      value: 'smtp',
      description: 'Email service provider for sending notifications and reports.',
      dataType: 'string',
      defaultValue: 'smtp',
      isEditable: true,
      requiresRestart: true,
      validation: { required: true, enum: ['smtp', 'sendgrid', 'mailgun', 'ses'] },
      lastModified: new Date().toISOString(),
      modifiedBy: user?.id || 'system',
      environment: 'all'
    },
    {
      id: 'config-6',
      category: 'storage',
      key: 'backup.schedule',
      value: { frequency: 'daily', time: '02:00', retention: 30 },
      description: 'Automated backup schedule configuration.',
      dataType: 'json',
      defaultValue: { frequency: 'daily', time: '02:00', retention: 30 },
      isEditable: true,
      requiresRestart: false,
      lastModified: new Date().toISOString(),
      modifiedBy: user?.id || 'system',
      environment: 'all'
    }
  ]);

  const categories = ['all', 'security', 'performance', 'features', 'integrations', 'storage'];

  const handleUpdateConfiguration = useCallback(async (id: string, value: any) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setConfigurations(prev => prev.map(config =>
        config.id === id
          ? {
              ...config,
              value,
              lastModified: new Date().toISOString(),
              modifiedBy: user?.id || 'system'
            }
          : config
      ));

      addNotification({
        type: 'success',
        message: 'Configuration updated successfully',
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to update configuration',
        duration: 5000
      });
      throw error;
    }
  }, [user?.id, addNotification]);

  const filteredConfigurations = configurations.filter(config => {
    const matchesCategory = selectedCategory === 'all' || config.category === selectedCategory;
    const matchesSearch = config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CogIcon className="h-6 w-6 text-gray-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">System Configuration</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search configurations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Configuration List */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {filteredConfigurations.length === 0 ? (
            <div className="text-center py-12">
              <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No configurations found</h3>
              <p className="text-gray-600">Try adjusting your search terms or category filter.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredConfigurations.map(config => (
                <ConfigItem
                  key={config.id}
                  config={config}
                  onUpdate={handleUpdateConfiguration}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};