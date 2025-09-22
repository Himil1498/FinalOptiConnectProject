import React from "react";
import WorkflowPresets from "../workflow/WorkflowPresets";
import KeyboardShortcuts from "../common/KeyboardShortcuts";
import { WorkflowManagerProps } from "./types/MapInterfaces";

const WorkflowManager: React.FC<WorkflowManagerProps> = ({
  showWorkflowPresets,
  setShowWorkflowPresets,
  activeWorkflow,
  currentWorkflowStep,
  onWorkflowStart,
  onWorkflowAdvance,
  onWorkflowCancel,
  onToolActivation
}) => {
  return (
    <>
      {/* Workflow Presets System */}
      <WorkflowPresets
        isActive={showWorkflowPresets}
        onClose={() => setShowWorkflowPresets(false)}
        onWorkflowStart={onWorkflowStart}
        activeWorkflow={activeWorkflow}
        currentStep={currentWorkflowStep}
      />

      {/* Global Keyboard Shortcuts */}
      <KeyboardShortcuts
        onToolActivation={onToolActivation}
        onWorkflowOpen={() => setShowWorkflowPresets(true)}
        onDataManagerOpen={() => {}} // This will be handled by parent
        onSearchOpen={() => {}} // This will be handled by parent
      />

      {/* Active Workflow Status Bar */}
      {activeWorkflow && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg px-6 py-3 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
                <span className="font-semibold">{activeWorkflow.name}</span>
              </div>
              <div className="text-sm opacity-90">
                Step {currentWorkflowStep + 1} of {activeWorkflow.steps.length}: {activeWorkflow.steps[currentWorkflowStep]?.title}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onWorkflowAdvance}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
                >
                  {currentWorkflowStep < activeWorkflow.steps.length - 1 ? 'Next Step' : 'Complete'}
                </button>
                <button
                  onClick={onWorkflowCancel}
                  className="bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkflowManager;