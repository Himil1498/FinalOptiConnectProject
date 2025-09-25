# Unified Geofencing System - Usage Guide

## Overview
The unified geofencing system is now ready for production use. All tools now use the same validation system, and region-based user assignments are fully supported.

## 🚀 Quick Start for User Creation Form

### 1. Import the Hook
```typescript
import { useUserRegionManagement } from '../hooks/useUserRegionManagement';
```

### 2. Use in Component
```typescript
const UserCreationForm = () => {
  const {
    availableStates,
    statesGroupedByRegion,
    regionTemplates,
    isLoadingStates,
    createRegionConfig,
    getRecommendations,
    getStatesForTemplate,
    error
  } = useUserRegionManagement();

  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'technician' | 'viewer'>('viewer');

  // Get role-based recommendations
  const recommendations = getRecommendations({ role: userRole });

  // Handle template selection
  const handleTemplateSelect = async (templateName: keyof typeof regionTemplates) => {
    const states = await getStatesForTemplate(templateName);
    setSelectedStates(states);
  };

  // Create user with region assignments
  const handleCreateUser = async (userData: any) => {
    const result = await createRegionConfig(
      userData.userId,
      selectedStates,
      regionTemplates['Metro Cities Only'].permissions, // or custom permissions
      { strictGeofencing: true, allowNearBorder: false },
      'admin-user-id'
    );

    if (result.success) {
      console.log('User created with regions:', result.assignedStates);
    } else {
      console.error('Failed to assign regions:', result.message);
    }
  };

  return (
    <div>
      {/* Role Selection */}
      <select value={userRole} onChange={(e) => setUserRole(e.target.value)}>
        <option value="admin">Administrator</option>
        <option value="manager">Manager</option>
        <option value="technician">Technician</option>
        <option value="viewer">Viewer</option>
      </select>

      {/* Template Selection */}
      <div>
        <h3>Quick Templates:</h3>
        {Object.keys(regionTemplates).map(template => (
          <button
            key={template}
            onClick={() => handleTemplateSelect(template)}
          >
            {template}
          </button>
        ))}
      </div>

      {/* State Selection */}
      <div>
        <h3>Available States ({availableStates.length}):</h3>
        {Object.entries(statesGroupedByRegion).map(([region, states]) => (
          <div key={region}>
            <h4>{region} ({states.length} states)</h4>
            {states.map(state => (
              <label key={state}>
                <input
                  type="checkbox"
                  checked={selectedStates.includes(state)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStates([...selectedStates, state]);
                    } else {
                      setSelectedStates(selectedStates.filter(s => s !== state));
                    }
                  }}
                />
                {state}
              </label>
            ))}
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div>
        <h3>Recommended for {userRole}:</h3>
        <p>{recommendations.reason}</p>
        <p>Suggested states: {recommendations.recommended.join(', ')}</p>
      </div>

      {/* Selected States */}
      <div>
        <h3>Selected States ({selectedStates.length}):</h3>
        <p>{selectedStates.join(', ')}</p>
      </div>

      {error && <div className="error">{error}</div>}

      <button onClick={handleCreateUser} disabled={selectedStates.length === 0}>
        Create User with Region Assignment
      </button>
    </div>
  );
};
```

## 🔧 Available Functions

### State Management
- `availableStates` - All Indian states (35+ states/UTs)
- `statesGroupedByRegion` - States grouped by North, South, East, West, Northeast, Central, Islands
- `loadStates()` - Manually load states (auto-loaded by default)

### Validation
- `validateAssignments(states)` - Validate state list before assignment
- `validateLocation(userId, location, assignedStates)` - Check if user can work at location

### User Configuration
- `createRegionConfig(userId, states, permissions, restrictions)` - Assign regions to user
- `updateRegionConfig(userId, updates)` - Update user's region assignments
- `getRecommendations(user)` - Get role-based state recommendations

### Bulk Operations
- `bulkAssign(userIds, states, permissions)` - Assign regions to multiple users

### Templates
- `regionTemplates` - Pre-defined assignment templates:
  - **Full India Access** - All states with full permissions
  - **Northern Region** - Northern states with standard permissions
  - **Metro Cities Only** - Major metros with limited permissions
  - **Viewer Only** - Single state with read-only permissions

## 🛡️ How Tools Now Work

All tools (Distance, Polygon, Elevation) now automatically:

1. **Check if user is in India** using `india-boundary.geojson`
2. **Check if user is in assigned states** using `india.json`
3. **Show helpful error messages** with suggested locations
4. **Prevent tool usage outside restrictions**

Example tool validation:
```typescript
// This happens automatically in all tools now
const validation = await validateGeofence(lat, lng, {
  strictMode: true,
  assignedStates: ['Delhi', 'Maharashtra'],
  userId: 'user-123'
});

if (!validation.isValid) {
  showError(validation.message); // "Location is outside your assigned regions"
  return;
}
```

## 📊 File Structure

```
src/
├── utils/
│   ├── unifiedGeofencing.ts          # Main geofencing engine
│   └── userRegionManagement.ts      # User region assignment logic
├── hooks/
│   ├── useUnifiedGeofencing.ts       # React hook for geofencing
│   └── useUserRegionManagement.ts   # React hook for user regions
└── components/
    └── [all tools now use unified system]
```

## 🎯 Benefits

✅ **Single source of truth** - No more conflicting geofencing logic
✅ **Precise boundaries** - Uses actual India state boundaries
✅ **User-specific restrictions** - Each user has their assigned regions
✅ **Role-based templates** - Quick setup for common scenarios
✅ **Bulk operations** - Assign regions to multiple users at once
✅ **Future-ready** - Easy to extend for districts/cities if needed

## 🚀 Ready for Production

The system has been:
- ✅ TypeScript compiled successfully
- ✅ All existing tools updated
- ✅ Redundant files removed
- ✅ Build tested and working
- ✅ React hooks created for easy integration

**Your geofencing system is production-ready for tomorrow's user creation form!** 🎉