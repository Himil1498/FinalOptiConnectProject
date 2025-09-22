import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  LightBulbIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import StandardDialog from '../common/StandardDialog';

interface ToolSuggestion {
  id: string;
  toolId: string;
  type: 'complement' | 'workflow' | 'analysis' | 'optimization';
  title: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  onApply: () => void;
}

interface ActiveTool {
  id: string;
  name: string;
  isActive: boolean;
  hasData: boolean;
  dataType?: string;
}

interface MultiToolManagerProps {
  activeTools: ActiveTool[];
  onToolActivation: (toolId: string) => void;
  onShowSuggestions?: (suggestions: ToolSuggestion[]) => void;
}

const MultiToolManager: React.FC<MultiToolManagerProps> = ({
  activeTools,
  onToolActivation,
  onShowSuggestions
}) => {
  const [suggestions, setSuggestions] = useState<ToolSuggestion[]>([]);
  const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  // Generate smart suggestions based on active tools
  const generateSuggestions = useCallback(() => {
    const newSuggestions: ToolSuggestion[] = [];
    const activeToolIds = activeTools.filter(tool => tool.isActive).map(tool => tool.id);
    const toolsWithData = activeTools.filter(tool => tool.hasData);

    // Distance + Elevation combination
    if (activeToolIds.includes('distance') && !activeToolIds.includes('elevation')) {
      const distanceTool = activeTools.find(t => t.id === 'distance' && t.hasData);
      if (distanceTool) {
        newSuggestions.push({
          id: 'distance-elevation-combo',
          toolId: 'elevation',
          type: 'complement',
          title: 'Add Elevation Analysis',
          description: 'Enhance your distance measurement with elevation profile analysis',
          reason: 'You have measured distances. Adding elevation data will show the terrain difficulty and total elevation changes along your measured path.',
          priority: 'high',
          action: 'Activate Elevation Tool',
          onApply: () => onToolActivation('elevation')
        });
      }
    }

    // Polygon + Distance combination for area analysis
    if (activeToolIds.includes('polygon') && !activeToolIds.includes('distance')) {
      const polygonTool = activeTools.find(t => t.id === 'polygon' && t.hasData);
      if (polygonTool) {
        newSuggestions.push({
          id: 'polygon-distance-combo',
          toolId: 'distance',
          type: 'analysis',
          title: 'Measure Perimeter & Internal Distances',
          description: 'Measure distances within and around your polygon areas',
          reason: 'You have drawn polygons. Distance measurement can help analyze internal layouts, perimeter calculations, and access routes.',
          priority: 'medium',
          action: 'Activate Distance Tool',
          onApply: () => onToolActivation('distance')
        });
      }
    }

    // Elevation + Polygon for topographic analysis
    if (activeToolIds.includes('elevation') && !activeToolIds.includes('polygon')) {
      const elevationTool = activeTools.find(t => t.id === 'elevation' && t.hasData);
      if (elevationTool) {
        newSuggestions.push({
          id: 'elevation-polygon-combo',
          toolId: 'polygon',
          type: 'analysis',
          title: 'Define Elevation Zones',
          description: 'Create polygons around areas with similar elevation characteristics',
          reason: 'You have elevation data. Drawing polygons can help you define terrain zones, watershed boundaries, or elevation-based coverage areas.',
          priority: 'medium',
          action: 'Activate Polygon Tool',
          onApply: () => onToolActivation('polygon')
        });
      }
    }

    // Multi-tool workflow suggestions
    if (activeToolIds.length >= 2) {
      newSuggestions.push({
        id: 'comprehensive-analysis',
        toolId: 'workflow',
        type: 'workflow',
        title: 'Comprehensive Site Analysis',
        description: 'You\'re using multiple tools - consider a systematic site analysis workflow',
        reason: 'With multiple tools active, you can perform comprehensive site analysis including terrain, coverage areas, and infrastructure planning.',
        priority: 'medium',
        action: 'Open Analysis Guide',
        onApply: () => {
          // Show analysis workflow guide
          const notificationEvent = new CustomEvent('showNotification', {
            detail: {
              type: 'info',
              title: 'Analysis Workflow',
              message: '1. Measure critical distances 2. Analyze elevation profiles 3. Define coverage polygons 4. Export comprehensive data',
              duration: 8000
            }
          });
          window.dispatchEvent(notificationEvent);
        }
      });
    }

    // Data optimization suggestions
    if (toolsWithData.length >= 2) {
      newSuggestions.push({
        id: 'export-combined-data',
        toolId: 'optimization',
        type: 'optimization',
        title: 'Export Combined Analysis',
        description: 'Export all measurement data as a comprehensive report',
        reason: 'You have data from multiple tools. Consider exporting everything as a combined analysis report for documentation or sharing.',
        priority: 'low',
        action: 'Export All Data',
        onApply: () => {
          // Trigger combined export
          const notificationEvent = new CustomEvent('showNotification', {
            detail: {
              type: 'success',
              title: 'Export Initiated',
              message: 'Preparing combined data export from all active tools...',
              duration: 5000
            }
          });
          window.dispatchEvent(notificationEvent);
        }
      });
    }

    // Filter out dismissed suggestions
    const filteredSuggestions = newSuggestions.filter(s => !dismissedSuggestions.has(s.id));

    setSuggestions(filteredSuggestions);

    // Notify parent component
    if (onShowSuggestions) {
      onShowSuggestions(filteredSuggestions);
    }

    // Auto-show panel if there are high priority suggestions
    const hasHighPriority = filteredSuggestions.some(s => s.priority === 'high');
    if (hasHighPriority && filteredSuggestions.length > 0) {
      setShowSuggestionPanel(true);
    }
  }, [activeTools, onToolActivation, onShowSuggestions, dismissedSuggestions]);

  // Generate suggestions when tools change
  useEffect(() => {
    const timeoutId = setTimeout(generateSuggestions, 1000); // Debounce
    return () => clearTimeout(timeoutId);
  }, [generateSuggestions]);

  const applySuggestion = useCallback((suggestion: ToolSuggestion) => {
    suggestion.onApply();
    setDismissedSuggestions(prev => new Set(Array.from(prev).concat(suggestion.id)));

    const notificationEvent = new CustomEvent('showNotification', {
      detail: {
        type: 'success',
        title: 'Suggestion Applied',
        message: suggestion.action,
        duration: 3000
      }
    });
    window.dispatchEvent(notificationEvent);
  }, []);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setDismissedSuggestions(prev => new Set(Array.from(prev).concat(suggestionId)));
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <InformationCircleIcon className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      default:
        return <LightBulbIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  // Multi-tool status summary
  const toolsSummary = useMemo(() => {
    const active = activeTools.filter(t => t.isActive).length;
    const withData = activeTools.filter(t => t.hasData).length;
    return { active, withData, total: activeTools.length };
  }, [activeTools]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <>
      {/* Smart Suggestions Floating Button */}
      {!showSuggestionPanel && suggestions.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setShowSuggestionPanel(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 relative group"
            title={`${suggestions.length} smart suggestions available`}
          >
            <LightBulbIcon className="w-6 h-6" />
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {suggestions.length}
            </div>
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                {suggestions.length} smart suggestion{suggestions.length !== 1 ? 's' : ''} available
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Smart Suggestions Panel */}
      <StandardDialog
        isOpen={showSuggestionPanel}
        onClose={() => setShowSuggestionPanel(false)}
        title={`💡 Smart Tool Suggestions • ${toolsSummary.active} active tools • ${toolsSummary.withData} with data`}
        size="xl"
      >

        <div className="p-6">
          <div className="space-y-3">
              {suggestions.map(suggestion => (
                <div
                  key={suggestion.id}
                  className={`border rounded-lg p-4 ${getPriorityColor(suggestion.priority)} transition-all duration-200 hover:shadow-md`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getPriorityIcon(suggestion.priority)}
                      <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                        suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {suggestion.priority}
                      </span>
                    </div>
                    <button
                      onClick={() => dismissSuggestion(suggestion.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Dismiss suggestion"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-gray-700 text-sm mb-2">{suggestion.description}</p>

                  <div className="bg-white/60 rounded p-2 mb-3">
                    <p className="text-xs text-gray-600 italic">{suggestion.reason}</p>
                  </div>

                  <button
                    onClick={() => applySuggestion(suggestion)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium text-sm"
                  >
                    {suggestion.action}
                  </button>
                </div>
              ))}
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 p-4 text-center mt-6 -mx-6 -mb-6">
            <p className="text-xs text-gray-500">
              Suggestions are generated based on your current tool usage and data patterns
            </p>
          </div>
        </div>
      </StandardDialog>
    </>
  );
};

export default MultiToolManager;