import React, { useState, useEffect, useCallback, useMemo } from "react";

interface StateFeature {
  type: "Feature";
  properties: {
    st_nm: string;
  };
  geometry: {
    type: "MultiPolygon";
    coordinates: number[][][][];
  };
}

interface IndiaGeoData {
  type: "FeatureCollection";
  features: StateFeature[];
}

interface UserRegionAssignment {
  userId: string;
  userName: string;
  assignedStates: string[];
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}

interface RegionAssignmentSystemProps {
  isAdmin: boolean;
  currentUserId: string;
  onAssignmentChange?: (assignments: UserRegionAssignment[]) => void;
}

const RegionAssignmentSystem: React.FC<RegionAssignmentSystemProps> = ({
  isAdmin,
  currentUserId,
  onAssignmentChange
}) => {
  const [geoData, setGeoData] = useState<IndiaGeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<UserRegionAssignment[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [showAssignmentPanel, setShowAssignmentPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Mock users data (in real app, this would come from API)
  const mockUsers = [
    { id: "user1", name: "Rajesh Kumar", role: "user" as const },
    { id: "user2", name: "Priya Sharma", role: "user" as const },
    { id: "user3", name: "Amit Singh", role: "user" as const },
    { id: "user4", name: "Sunita Patel", role: "user" as const },
    { id: "user5", name: "Deepak Gupta", role: "user" as const }
  ];

  // Load India GeoJSON data
  useEffect(() => {
    const loadGeoData = async () => {
      try {
        const response = await fetch("/india.json");
        const data: IndiaGeoData = await response.json();
        setGeoData(data);

        // Initialize some sample assignments
        const sampleAssignments: UserRegionAssignment[] = [
          {
            userId: "user1",
            userName: "Rajesh Kumar",
            assignedStates: ["Maharashtra", "Gujarat"],
            role: "user",
            createdAt: new Date("2024-01-15"),
            updatedAt: new Date("2024-01-15")
          },
          {
            userId: "user2",
            userName: "Priya Sharma",
            assignedStates: ["Tamil Nadu", "Karnataka", "Kerala"],
            role: "user",
            createdAt: new Date("2024-01-20"),
            updatedAt: new Date("2024-02-05")
          },
          {
            userId: "user3",
            userName: "Amit Singh",
            assignedStates: ["Uttar Pradesh", "Bihar", "Jharkhand"],
            role: "user",
            createdAt: new Date("2024-02-01"),
            updatedAt: new Date("2024-02-01")
          }
        ];
        setAssignments(sampleAssignments);
      } catch (error) {
        console.error("Error loading geo data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadGeoData();
  }, []);

  // Get list of all states
  const allStates = useMemo(() => {
    if (!geoData) return [];
    return geoData.features.map((feature) => feature.properties.st_nm).sort();
  }, [geoData]);

  // Filter states based on search term
  const filteredStates = useMemo(() => {
    return allStates.filter((state) =>
      state.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allStates, searchTerm]);

  // Get current user's assigned states
  const currentUserStates = useMemo(() => {
    const assignment = assignments.find((a) => a.userId === currentUserId);
    return assignment?.assignedStates || [];
  }, [assignments, currentUserId]);

  // Handle state selection
  const handleStateToggle = useCallback((stateName: string) => {
    setSelectedStates((prev) => {
      if (prev.includes(stateName)) {
        return prev.filter((s) => s !== stateName);
      } else {
        return [...prev, stateName];
      }
    });
  }, []);

  // Save assignment
  const handleSaveAssignment = useCallback(() => {
    if (!selectedUser || selectedStates.length === 0) return;

    const user = mockUsers.find((u) => u.id === selectedUser);
    if (!user) return;

    const newAssignment: UserRegionAssignment = {
      userId: selectedUser,
      userName: user.name,
      assignedStates: [...selectedStates],
      role: user.role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setAssignments((prev) => {
      const filtered = prev.filter((a) => a.userId !== selectedUser);
      const updated = [...filtered, newAssignment];
      onAssignmentChange?.(updated);
      return updated;
    });

    // Reset form
    setSelectedUser("");
    setSelectedStates([]);
    setShowAssignmentPanel(false);
  }, [selectedUser, selectedStates, onAssignmentChange]);

  // Remove assignment
  const handleRemoveAssignment = useCallback(
    (userId: string) => {
      setAssignments((prev) => {
        const updated = prev.filter((a) => a.userId !== userId);
        onAssignmentChange?.(updated);
        return updated;
      });
    },
    [onAssignmentChange]
  );

  // Get assignment statistics
  const getAssignmentStats = useMemo(() => {
    const totalUsers = mockUsers.length;
    const assignedUsers = assignments.length;
    const totalStates = allStates.length;
    const assignedStates = new Set(assignments.flatMap((a) => a.assignedStates))
      .size;
    const unassignedStates = allStates.filter(
      (state) => !assignments.some((a) => a.assignedStates.includes(state))
    );

    return {
      totalUsers,
      assignedUsers,
      unassignedUsers: totalUsers - assignedUsers,
      totalStates,
      assignedStates,
      unassignedStates
    };
  }, [assignments, allStates, mockUsers.length]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Loading region data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    // User view - show assigned regions
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-3">
          Your Assigned Regions
        </h3>
        {currentUserStates.length > 0 ? (
          <div className="space-y-2">
            {currentUserStates.map((state) => (
              <div key={state} className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">{state}</span>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                You can only work within these {currentUserStates.length}{" "}
                assigned region{currentUserStates.length !== 1 ? "s" : ""}.
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            No regions assigned yet. Contact your administrator.
          </div>
        )}
      </div>
    );
  }

  // Admin view
  return (
    <>
      {/* Admin Panel */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-white rounded-lg shadow-lg p-4 max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Region Assignment System
            </h2>
            <button
              onClick={() => setShowAssignmentPanel(!showAssignmentPanel)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              {showAssignmentPanel ? "Close Assignment" : "New Assignment"}
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-lg font-bold text-blue-600">
                {getAssignmentStats.assignedUsers}
              </div>
              <div className="text-xs text-gray-600">Assigned Users</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-lg font-bold text-green-600">
                {getAssignmentStats.assignedStates}
              </div>
              <div className="text-xs text-gray-600">Assigned States</div>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <div className="text-lg font-bold text-orange-600">
                {getAssignmentStats.unassignedUsers}
              </div>
              <div className="text-xs text-gray-600">Unassigned Users</div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="text-lg font-bold text-red-600">
                {getAssignmentStats.unassignedStates.length}
              </div>
              <div className="text-xs text-gray-600">Unassigned States</div>
            </div>
          </div>

          {/* Assignment Panel */}
          {showAssignmentPanel && (
            <div className="border rounded-lg p-4 mb-4 bg-gray-50">
              <h3 className="text-md font-bold text-gray-900 mb-3">
                Create New Assignment
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* User Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select User:
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Choose a user...</option>
                    {mockUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* State Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search States:
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search states..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* State Selection */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign States ({selectedStates.length} selected):
                </label>
                <div className="max-h-40 overflow-y-auto border rounded bg-white p-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {filteredStates.map((state) => (
                      <label
                        key={state}
                        className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStates.includes(state)}
                          onChange={() => handleStateToggle(state)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">{state}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => {
                    setSelectedUser("");
                    setSelectedStates([]);
                    setShowAssignmentPanel(false);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssignment}
                  disabled={!selectedUser || selectedStates.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Save Assignment
                </button>
              </div>
            </div>
          )}

          {/* Current Assignments */}
          <div>
            <h3 className="text-md font-bold text-gray-900 mb-3">
              Current Assignments
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {assignments.map((assignment) => (
                <div
                  key={assignment.userId}
                  className="border rounded-lg p-3 bg-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-gray-900">
                        {assignment.userName}
                      </span>
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {assignment.role}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveAssignment(assignment.userId)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="Remove assignment"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">
                      States ({assignment.assignedStates.length}):
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {assignment.assignedStates.map((state) => (
                        <span
                          key={state}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                        >
                          {state}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Updated: {assignment.updatedAt.toLocaleDateString()}
                  </div>
                </div>
              ))}

              {assignments.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No assignments created yet. Click "New Assignment" to get
                  started.
                </div>
              )}
            </div>
          </div>

          {/* Unassigned States */}
          {getAssignmentStats.unassignedStates.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-2">
                Unassigned States ({getAssignmentStats.unassignedStates.length}
                ):
              </h4>
              <div className="flex flex-wrap gap-1">
                {getAssignmentStats.unassignedStates.map((state) => (
                  <span
                    key={state}
                    className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                  >
                    {state}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RegionAssignmentSystem;
