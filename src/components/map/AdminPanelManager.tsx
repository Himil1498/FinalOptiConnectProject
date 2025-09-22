import React from "react";
import RegionAssignmentSystem from "../admin/RegionAssignmentSystem";
import UserGroupsManagement from "../admin/UserGroupsManagement";
import ManagerDashboard from "../admin/ManagerDashboard";
import DataImportSystem from "../admin/DataImportSystem";
import InfrastructureDataManagement from "../admin/InfrastructureDataManagement";
import ComprehensiveSearchSystem from "../search/ComprehensiveSearchSystem";
import DataManager from "../data/DataManager";
import LayoutManager from "../common/LayoutManager";
import { AdminPanelManagerProps } from "./types/MapInterfaces";
import { SavedDataItem } from "../../types";

const AdminPanelManager: React.FC<AdminPanelManagerProps> = ({
  user,
  isAdmin,
  showRegionPanel,
  showUserGroupsPanel,
  showManagerDashboard,
  showDataImport,
  showInfrastructureData,
  showSearchSystem,
  showDataManager,
  showLayoutManager,
  setShowRegionPanel,
  setShowUserGroupsPanel,
  setShowManagerDashboard,
  setShowDataImport,
  setShowInfrastructureData,
  setShowSearchSystem,
  setShowDataManager,
  setShowLayoutManager,
  onSearchResultSelect,
  onNavigateToLocation,
  activeTools,
  addNotification
}) => {
  return (
    <>
      {/* Region Assignment Panel */}
      {showRegionPanel && (
        <RegionAssignmentSystem
          isAdmin={isAdmin}
          currentUserId={user?.id || ""}
          onAssignmentChange={(assignments) => {
            // Region assignments updated
          }}
        />
      )}

      {/* User Groups Management Panel */}
      {showUserGroupsPanel && (
        <UserGroupsManagement
          isOpen={showUserGroupsPanel}
          onClose={() => setShowUserGroupsPanel(false)}
          currentUserId={user?.id || ""}
        />
      )}

      {/* Manager Dashboard Panel */}
      {showManagerDashboard && (
        <ManagerDashboard
          isOpen={showManagerDashboard}
          onClose={() => setShowManagerDashboard(false)}
          currentUserId={user?.id || ""}
        />
      )}

      {/* Data Import Panel */}
      {showDataImport && (
        <DataImportSystem
          isOpen={showDataImport}
          onClose={() => setShowDataImport(false)}
          currentUserId={user?.id || ""}
        />
      )}

      {/* Infrastructure Data Management Panel */}
      {showInfrastructureData && (
        <InfrastructureDataManagement
          isOpen={showInfrastructureData}
          onClose={() => setShowInfrastructureData(false)}
          currentUserId={user?.id || ""}
          userRole={user?.role || "viewer"}
        />
      )}

      {/* Comprehensive Search System Panel */}
      {showSearchSystem && (
        <ComprehensiveSearchSystem
          isOpen={showSearchSystem}
          onClose={() => setShowSearchSystem(false)}
          currentUserId={user?.id || ""}
          userRole={user?.role || "viewer"}
          onResultSelect={onSearchResultSelect}
          onNavigateToLocation={onNavigateToLocation}
        />
      )}

      {/* Data Manager Panel */}
      {showDataManager && (
        <DataManager
          onClose={() => setShowDataManager(false)}
          onItemLoad={(item: SavedDataItem) => {
            // Loading saved data
            addNotification({
              type: "success",
              message: `Loaded ${item.name}`,
              duration: 3000
            });
          }}
          activeTools={activeTools}
          onToolDataSave={(toolId, data) => {
            addNotification({
              type: "info",
              title: "Tool Data Saved",
              message: `${toolId} data has been saved to the data manager`,
              duration: 3000
            });
          }}
        />
      )}

      {/* Layout Manager Panel */}
      {showLayoutManager && (
        <LayoutManager
          isOpen={showLayoutManager}
          onClose={() => setShowLayoutManager(false)}
        />
      )}
    </>
  );
};

export default AdminPanelManager;