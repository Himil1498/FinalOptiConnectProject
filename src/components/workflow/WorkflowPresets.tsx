import React, { useState, useCallback } from 'react';
import {
  PlayIcon,
  StopIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PlusIcon,
  CogIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import StandardDialog from '../common/StandardDialog';

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  toolId: string;
  autoAdvance: boolean;
  duration?: number;
  parameters?: Record<string, any>;
}

export interface WorkflowPreset {
  id: string;
  name: string;
  description: string;
  category: 'site_analysis' | 'infrastructure_planning' | 'coverage_analysis' | 'terrain_study' | 'custom';
  steps: WorkflowStep[];
  estimatedDuration: number;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  author: string;
  usageCount: number;
}

interface WorkflowPresetsProps {
  isActive: boolean;
  onClose: () => void;
  onWorkflowStart: (preset: WorkflowPreset) => void;
  activeWorkflow?: WorkflowPreset | null;
  currentStep?: number;
}

const WorkflowPresets: React.FC<WorkflowPresetsProps> = ({
  isActive,
  onClose,
  onWorkflowStart,
  activeWorkflow,
  currentStep = 0
}) => {
  const [selectedPreset, setSelectedPreset] = useState<WorkflowPreset | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');
  const [filter, setFilter] = useState<string>('all');

  // Mock workflow presets
  const defaultPresets: WorkflowPreset[] = [
    {
      id: 'site-analysis-complete',
      name: 'Complete Site Analysis',
      description: 'Comprehensive analysis including distance measurements, elevation profiles, and coverage area definition',
      category: 'site_analysis',
      complexity: 'intermediate',
      estimatedDuration: 15,
      author: 'System',
      usageCount: 156,
      createdAt: new Date('2024-01-15'),
      steps: [
        {
          id: 'step-1',
          title: 'Measure Critical Distances',
          description: 'Measure distances between key infrastructure points',
          toolId: 'distance',
          autoAdvance: false,
          duration: 5
        },
        {
          id: 'step-2',
          title: 'Analyze Elevation Profile',
          description: 'Create elevation profiles along measured paths',
          toolId: 'elevation',
          autoAdvance: false,
          duration: 5
        },
        {
          id: 'step-3',
          title: 'Define Coverage Areas',
          description: 'Draw polygons for coverage zones',
          toolId: 'polygon',
          autoAdvance: false,
          duration: 5
        }
      ]
    },
    {
      id: 'infrastructure-planning',
      name: 'Infrastructure Planning',
      description: 'Plan new infrastructure placement with terrain and accessibility analysis',
      category: 'infrastructure_planning',
      complexity: 'advanced',
      estimatedDuration: 25,
      author: 'Engineering Team',
      usageCount: 89,
      createdAt: new Date('2024-02-01'),
      steps: [
        {
          id: 'step-1',
          title: 'Terrain Analysis',
          description: 'Analyze terrain for optimal placement',
          toolId: 'elevation',
          autoAdvance: false,
          duration: 8
        },
        {
          id: 'step-2',
          title: 'Access Route Planning',
          description: 'Plan access routes to infrastructure',
          toolId: 'distance',
          autoAdvance: false,
          duration: 7
        },
        {
          id: 'step-3',
          title: 'Coverage Zone Definition',
          description: 'Define service coverage areas',
          toolId: 'polygon',
          autoAdvance: false,
          duration: 10
        }
      ]
    },
    {
      id: 'quick-coverage-check',
      name: 'Quick Coverage Check',
      description: 'Fast coverage area assessment for existing infrastructure',
      category: 'coverage_analysis',
      complexity: 'beginner',
      estimatedDuration: 8,
      author: 'Operations Team',
      usageCount: 234,
      createdAt: new Date('2024-01-20'),
      steps: [
        {
          id: 'step-1',
          title: 'Draw Coverage Area',
          description: 'Quickly outline the coverage area',
          toolId: 'polygon',
          autoAdvance: false,
          duration: 4
        },
        {
          id: 'step-2',
          title: 'Measure Coverage Radius',
          description: 'Measure key coverage distances',
          toolId: 'distance',
          autoAdvance: false,
          duration: 4
        }
      ]
    }
  ];

  const [presets] = useState<WorkflowPreset[]>(defaultPresets);

  const filteredPresets = presets.filter(preset =>
    filter === 'all' || preset.category === filter
  );

  const handlePresetSelect = useCallback((preset: WorkflowPreset) => {
    setSelectedPreset(preset);
  }, []);

  const handleStartWorkflow = useCallback((preset: WorkflowPreset) => {
    onWorkflowStart(preset);
    // Increment usage count (in real app, this would update the backend)
    preset.usageCount += 1;

    const notificationEvent = new CustomEvent('showNotification', {
      detail: {
        type: 'success',
        title: 'Workflow Started',
        message: `Started "${preset.name}" workflow`,
        duration: 3000
      }
    });
    window.dispatchEvent(notificationEvent);
  }, [onWorkflowStart]);

  const getCategoryIcon = (category: WorkflowPreset['category']) => {
    switch (category) {
      case 'site_analysis': return '🔍';
      case 'infrastructure_planning': return '🏗️';
      case 'coverage_analysis': return '📡';
      case 'terrain_study': return '🏔️';
      default: return '⚙️';
    }
  };

  const getComplexityColor = (complexity: WorkflowPreset['complexity']) => {
    switch (complexity) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isActive) return null;

  return (
    <StandardDialog
      isOpen={isActive}
      onClose={onClose}
      title="🚀 Professional Workflow Presets"
      size="xl"
    >
      <div className="p-6">
        {/* Active Workflow Status */}
        {activeWorkflow && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full">
                  <PlayIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">{activeWorkflow.name}</h4>
                  <p className="text-sm text-blue-700">
                    Step {currentStep + 1} of {activeWorkflow.steps.length}: {activeWorkflow.steps[currentStep]?.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-blue-600">
                  {Math.round((currentStep / activeWorkflow.steps.length) * 100)}% Complete
                </div>
                <div className="w-24 bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / activeWorkflow.steps.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'all', label: 'All Workflows' },
              { id: 'site_analysis', label: 'Site Analysis' },
              { id: 'infrastructure_planning', label: 'Infrastructure' },
              { id: 'coverage_analysis', label: 'Coverage' },
              { id: 'terrain_study', label: 'Terrain' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Workflow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {filteredPresets.map(preset => (
            <div
              key={preset.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedPreset?.id === preset.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handlePresetSelect(preset)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getCategoryIcon(preset.category)}</span>
                  <h3 className="font-semibold text-gray-900">{preset.name}</h3>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getComplexityColor(preset.complexity)}`}>
                  {preset.complexity}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3">{preset.description}</p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    {preset.estimatedDuration}m
                  </span>
                  <span>{preset.steps.length} steps</span>
                  <span>{preset.usageCount} uses</span>
                </div>
              </div>

              {/* Quick Preview of Steps */}
              <div className="mt-3 space-y-1">
                {preset.steps.slice(0, 2).map((step, index) => (
                  <div key={step.id} className="flex items-center text-xs text-gray-500">
                    <span className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-xs mr-2">
                      {index + 1}
                    </span>
                    {step.title}
                  </div>
                ))}
                {preset.steps.length > 2 && (
                  <div className="text-xs text-gray-400">
                    +{preset.steps.length - 2} more steps...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Preset Details */}
        {selectedPreset && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Workflow Steps</h4>
              <button
                onClick={() => handleStartWorkflow(selectedPreset)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlayIcon className="w-4 h-4" />
                <span>Start Workflow</span>
              </button>
            </div>

            <div className="space-y-3">
              {selectedPreset.steps.map((step, index) => (
                <div key={step.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{step.title}</h5>
                    <p className="text-sm text-gray-600">{step.description}</p>
                    {step.duration && (
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        Estimated: {step.duration} minutes
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Custom Workflow Button */}
        <div className="border-t pt-4 mt-6">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Custom Workflow</span>
          </button>
        </div>
      </div>

      {/* Create Custom Workflow Dialog */}
      <StandardDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="Create Custom Workflow"
        size="md"
      >
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workflow Name
              </label>
              <input
                type="text"
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
                placeholder="Enter workflow name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newWorkflowDescription}
                onChange={(e) => setNewWorkflowDescription(e.target.value)}
                placeholder="Describe your workflow"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 Custom workflows can be created by recording your tool usage patterns or by manually defining steps.
              </p>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setShowCreateDialog(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Create Workflow
            </button>
          </div>
        </div>
      </StandardDialog>
    </StandardDialog>
  );
};

export default WorkflowPresets;