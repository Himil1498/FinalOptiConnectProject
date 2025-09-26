import React, { useState, useEffect, useCallback } from "react";
import {
  useUserManagement,
  CreateUserData
} from "../../hooks/useUserManagement";
import { User } from "../../types";
import { UserRegionPermissions } from "../../utils/userRegionManagement";

interface AdminUserCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: (user: User) => void;
}

const ROLE_OPTIONS: {
  value: User["role"];
  label: string;
  description: string;
}[] = [
  {
    value: "admin",
    label: "Administrator",
    description: "Full system access and user management"
  },
  {
    value: "manager",
    label: "Manager",
    description: "Regional management and team oversight"
  },
  {
    value: "technician",
    label: "Technician",
    description: "Field operations and equipment management"
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Read-only access to assigned regions"
  }
];

const DEPARTMENT_OPTIONS = [
  "Operations",
  "Engineering",
  "Network Planning",
  "Field Services",
  "IT Support",
  "Quality Assurance",
  "Customer Support",
  "Human Resources",
  "Finance",
  "Sales & Marketing"
];

const OFFICE_LOCATIONS = [
  "Delhi Head Office",
  "Mumbai Branch",
  "Bangalore Tech Center",
  "Chennai Operations",
  "Kolkata Regional",
  "Hyderabad Hub",
  "Pune Development Center",
  "Ahmedabad Branch",
  "Jaipur Office",
  "Lucknow Regional"
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

export const AdminUserCreationForm: React.FC<AdminUserCreationFormProps> = ({
  isOpen,
  onClose,
  onUserCreated
}) => {
  const {
    availableStates,
    statesGroupedByRegion,
    regionTemplates,
    getAvailableParentUsers,
    getUserRecommendations,
    getStatesForTemplate,
    createUser,
    loading,
    error
  } = useUserManagement();

  // Form state
  const [formData, setFormData] = useState<CreateUserData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    role: "viewer",
    department: "",
    // New basic fields
    employeeId: "",
    gender: "",
    address: {
      street: "",
      city: "",
      state: "",
      pinCode: ""
    },
    supervisorName: "",
    officeLocation: "",
    profilePicture: null,
    assignedStates: [],
    parentUserId: "",
    // Multiple managers/reporting structure
    reportingManagers: [],
    permissions: {
      canViewAllData: false,
      canEditInAssignedRegions: false,
      canCreateInAssignedRegions: false,
      canDeleteInAssignedRegions: false,
      canExportData: false,
      canShareData: false,
      toolsAccess: {
        distanceMeasurement: false,
        polygonDrawing: false,
        elevationAnalysis: false,
        infrastructureManagement: false
      }
    },
    restrictions: {
      strictGeofencing: true,
      allowNearBorder: false,
      borderTolerance: 10
    },
    groupIds: []
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [showStateSelector, setShowStateSelector] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Get available parent users and recommendations
  const parentUsers = getAvailableParentUsers();
  const recommendations = getUserRecommendations({ role: formData.role });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
        role: "viewer",
        department: "",
        // New basic fields
        employeeId: "",
        gender: "",
        address: {
          street: "",
          city: "",
          state: "",
          pinCode: ""
        },
        supervisorName: "",
        officeLocation: "",
        profilePicture: null,
        assignedStates: [],
        parentUserId: "",
        // Multiple managers/reporting structure
        reportingManagers: [],
        permissions: {
          canViewAllData: false,
          canEditInAssignedRegions: false,
          canCreateInAssignedRegions: false,
          canDeleteInAssignedRegions: false,
          canExportData: false,
          canShareData: false,
          toolsAccess: {
            distanceMeasurement: false,
            polygonDrawing: false,
            elevationAnalysis: false,
            infrastructureManagement: false
          }
        },
        restrictions: {
          strictGeofencing: true,
          allowNearBorder: false,
          borderTolerance: 10
        },
        groupIds: []
      });
      setSelectedTemplate("");
      setFormErrors({});
    }
  }, [isOpen]);

  // Handle role change - update permissions based on role
  const handleRoleChange = useCallback(
    (role: User["role"]) => {
      let defaultPermissions: UserRegionPermissions;

      switch (role) {
        case "admin":
          defaultPermissions = {
            canViewAllData: true,
            canEditInAssignedRegions: true,
            canCreateInAssignedRegions: true,
            canDeleteInAssignedRegions: true,
            canExportData: true,
            canShareData: true,
            toolsAccess: {
              distanceMeasurement: true,
              polygonDrawing: true,
              elevationAnalysis: true,
              infrastructureManagement: true
            }
          };
          break;
        case "manager":
          defaultPermissions = {
            canViewAllData: false,
            canEditInAssignedRegions: true,
            canCreateInAssignedRegions: true,
            canDeleteInAssignedRegions: false,
            canExportData: true,
            canShareData: true,
            toolsAccess: {
              distanceMeasurement: true,
              polygonDrawing: true,
              elevationAnalysis: true,
              infrastructureManagement: true
            }
          };
          break;
        case "technician":
          defaultPermissions = {
            canViewAllData: false,
            canEditInAssignedRegions: true,
            canCreateInAssignedRegions: true,
            canDeleteInAssignedRegions: false,
            canExportData: false,
            canShareData: false,
            toolsAccess: {
              distanceMeasurement: true,
              polygonDrawing: true,
              elevationAnalysis: true,
              infrastructureManagement: false
            }
          };
          break;
        case "viewer":
          defaultPermissions = {
            canViewAllData: false,
            canEditInAssignedRegions: false,
            canCreateInAssignedRegions: false,
            canDeleteInAssignedRegions: false,
            canExportData: false,
            canShareData: false,
            toolsAccess: {
              distanceMeasurement: false,
              polygonDrawing: false,
              elevationAnalysis: false,
              infrastructureManagement: false
            }
          };
          break;
        default:
          return;
      }

      setFormData((prev) => ({
        ...prev,
        role,
        permissions: defaultPermissions,
        assignedStates: recommendations.recommended // Auto-assign recommended states
      }));
    },
    [recommendations.recommended]
  );

  // Handle template selection
  const handleTemplateSelect = useCallback(
    async (templateName: string) => {
      if (!templateName) {
        setSelectedTemplate("");
        return;
      }

      setSelectedTemplate(templateName);
      const template =
        regionTemplates[templateName as keyof typeof regionTemplates];
      const states = await getStatesForTemplate(
        templateName as keyof typeof regionTemplates
      );

      setFormData((prev) => ({
        ...prev,
        assignedStates: states,
        permissions: template.permissions
      }));
    },
    [regionTemplates, getStatesForTemplate]
  );

  // Handle state selection
  const handleStateToggle = useCallback((stateName: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedStates: prev.assignedStates.includes(stateName)
        ? prev.assignedStates.filter((s) => s !== stateName)
        : [...prev.assignedStates, stateName]
    }));
  }, []);

  // Handle region selection (bulk state selection)
  const handleRegionSelect = useCallback(
    (region: string) => {
      if (region === "all") {
        setFormData((prev) => ({
          ...prev,
          assignedStates: availableStates
        }));
      } else if (region === "clear") {
        setFormData((prev) => ({
          ...prev,
          assignedStates: []
        }));
      } else {
        const regionStates = statesGroupedByRegion[region] || [];
        setFormData((prev) => ({
          ...prev,
          assignedStates: Array.from(
            new Set([...prev.assignedStates, ...regionStates])
          )
        }));
      }
      setSelectedRegion("all");
    },
    [availableStates, statesGroupedByRegion]
  );

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (
      formData.phoneNumber &&
      !/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(formData.phoneNumber)
    ) {
      errors.phoneNumber = "Invalid phone number format";
    }

    if (formData.assignedStates.length === 0 && formData.role !== "admin") {
      errors.assignedStates =
        "At least one state must be assigned (unless admin)";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      try {
        const success = await createUser(formData);
        if (success) {
          onClose();
          // The user will be in the store, we don't need to call onUserCreated here
          // as the parent component can listen to store changes
        }
      } catch (error) {
        console.error("Error creating user:", error);
      }
    },
    [formData, validateForm, createUser, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Create New User
              </h2>
              <p className="text-sm text-gray-500">
                Add a new user with regional access and permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-red-400 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Basic Information
                </h3>
                <div className="ml-auto">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Personal Details
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.name ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter full name"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value
                      }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.email ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter email address"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value
                      }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.password ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter password"
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value
                      }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.confirmPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Confirm password"
                  />
                  {formErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value
                      }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.phoneNumber
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="+91-XXXXX-XXXXX"
                  />
                  {formErrors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.phoneNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        department: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        employeeId: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="EMP001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gender: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supervisor/Manager Name
                  </label>
                  <input
                    type="text"
                    value={formData.supervisorName || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supervisorName: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Manager's full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Office Location
                  </label>
                  <select
                    value={formData.officeLocation || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        officeLocation: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Office Location</option>
                    {OFFICE_LOCATIONS.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-900">
                  Address Information
                </h3>
                <div className="ml-auto">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Location Details
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <textarea
                    value={formData.address?.street || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address!, street: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter complete street address"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.address?.city || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address!, city: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="City name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <select
                    value={formData.address?.state || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address!, state: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={formData.address?.pinCode || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address!, pinCode: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="6-digit PIN code"
                    pattern="[0-9]{6}"
                  />
                </div>
              </div>
            </div>

            {/* Profile Picture Upload */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-purple-900">
                  Profile Picture
                </h3>
                <div className="ml-auto">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Optional
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                    {formData.profilePicture ? (
                      <img
                        src={URL.createObjectURL(formData.profilePicture)}
                        alt="Profile preview"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Profile Picture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData((prev) => ({
                        ...prev,
                        profilePicture: file
                      }));
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB. Recommended: 400x400px square
                    image.
                  </p>
                </div>
              </div>
            </div>

            {/* Role and Hierarchy */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-orange-100 rounded-lg mr-3">
                  <svg
                    className="w-5 h-5 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-orange-900">
                  Role & Hierarchy
                </h3>
                <div className="ml-auto">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Organization Structure
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      handleRoleChange(e.target.value as User["role"])
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    {
                      ROLE_OPTIONS.find((r) => r.value === formData.role)
                        ?.description
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Under (Parent User)
                  </label>
                  <select
                    value={formData.parentUserId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        parentUserId: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No Parent (Top Level)</option>
                    {parentUsers.map((user: User) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role Recommendations */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900">
                  Recommendations for {formData.role}:
                </h4>
                <p className="text-sm text-blue-700">
                  {recommendations.reason}
                </p>
                {recommendations.recommended.length > 0 && (
                  <p className="text-sm text-blue-600 mt-1">
                    Suggested states: {recommendations.recommended.join(", ")}
                  </p>
                )}
              </div>

              {/* Additional Reporting Structure */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="p-1 bg-yellow-100 rounded mr-2">
                    <svg
                      className="w-4 h-4 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-yellow-900">
                    Multiple Reporting Structure
                  </h4>
                  <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Advanced
                  </span>
                </div>
                <p className="text-xs text-yellow-700 mb-3">
                  Add multiple managers/team leads this user reports to
                  (optional - for matrix organizations)
                </p>

                <div className="space-y-2">
                  {formData.reportingManagers?.map(
                    (manager: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={manager}
                          onChange={(e) => {
                            const newManagers = [
                              ...(formData.reportingManagers || [])
                            ];
                            newManagers[index] = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              reportingManagers: newManagers
                            }));
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-yellow-300 rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                        >
                          <option value="">Select Manager</option>
                          {parentUsers.map((user: User) => (
                            <option key={user.id} value={user.id}>
                              {user.name} ({user.role})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const newManagers = (
                              formData.reportingManagers || []
                            ).filter((_: string, i: number) => i !== index);
                            setFormData((prev) => ({
                              ...prev,
                              reportingManagers: newManagers
                            }));
                          }}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        reportingManagers: [
                          ...(prev.reportingManagers || []),
                          ""
                        ]
                      }));
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-yellow-700 border border-dashed border-yellow-300 rounded hover:bg-yellow-100 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add Another Manager
                  </button>
                </div>
              </div>
            </div>

            {/* Region Assignment */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Region Assignment
              </h3>

              {/* Template Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Templates
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a template...</option>
                  {Object.keys(regionTemplates).map((templateName) => (
                    <option key={templateName} value={templateName}>
                      {templateName}
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <p className="mt-1 text-sm text-gray-500">
                    {
                      regionTemplates[
                        selectedTemplate as keyof typeof regionTemplates
                      ].description
                    }
                  </p>
                )}
              </div>

              {/* Region Bulk Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bulk Region Selection
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleRegionSelect("all")}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    All India
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRegionSelect("clear")}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Clear All
                  </button>
                  {Object.keys(statesGroupedByRegion).map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => handleRegionSelect(region)}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      {region} ({statesGroupedByRegion[region]?.length || 0})
                    </button>
                  ))}
                </div>
              </div>

              {/* State Selection */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Assigned States ({formData.assignedStates.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowStateSelector(!showStateSelector)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {showStateSelector ? "Hide" : "Show"} State Selector
                  </button>
                </div>

                {formErrors.assignedStates && (
                  <p className="mb-2 text-sm text-red-600">
                    {formErrors.assignedStates}
                  </p>
                )}

                {/* Selected States Display */}
                {formData.assignedStates.length > 0 && (
                  <div className="mb-3 p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex flex-wrap gap-1">
                      {formData.assignedStates.map((state) => (
                        <span
                          key={state}
                          className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                        >
                          {state}
                          <button
                            type="button"
                            onClick={() => handleStateToggle(state)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* State Selector */}
                {showStateSelector && (
                  <div className="border border-gray-200 rounded-lg p-3 bg-white max-h-60 overflow-y-auto">
                    {Object.entries(
                      statesGroupedByRegion as Record<string, string[]>
                    ).map(([region, states]) => (
                      <div key={region} className="mb-4 last:mb-0">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {region}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {states.map((state: string) => (
                            <label
                              key={state}
                              className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={formData.assignedStates.includes(
                                  state
                                )}
                                onChange={() => handleStateToggle(state)}
                                className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-gray-700">{state}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Permissions & Tools Access */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Permissions & Tools Access
              </h3>

              {/* Data Permissions */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Data Permissions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canViewAllData}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            canViewAllData: e.target.checked
                          }
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        View All Data
                      </span>
                      <p className="text-xs text-gray-500">
                        Can view data beyond assigned regions
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canEditInAssignedRegions}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            canEditInAssignedRegions: e.target.checked
                          }
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Edit in Regions
                      </span>
                      <p className="text-xs text-gray-500">
                        Can edit data in assigned regions
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canCreateInAssignedRegions}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            canCreateInAssignedRegions: e.target.checked
                          }
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Create in Regions
                      </span>
                      <p className="text-xs text-gray-500">
                        Can create new data in assigned regions
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canDeleteInAssignedRegions}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            canDeleteInAssignedRegions: e.target.checked
                          }
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Delete in Regions
                      </span>
                      <p className="text-xs text-gray-500">
                        Can delete data in assigned regions
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canExportData}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            canExportData: e.target.checked
                          }
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Export Data
                      </span>
                      <p className="text-xs text-gray-500">
                        Can export data to various formats
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canShareData}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            canShareData: e.target.checked
                          }
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Share Data
                      </span>
                      <p className="text-xs text-gray-500">
                        Can share data with other users
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Tools Access */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  GIS Tools Access
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        formData.permissions.toolsAccess.distanceMeasurement
                      }
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            toolsAccess: {
                              ...prev.permissions.toolsAccess,
                              distanceMeasurement: e.target.checked
                            }
                          }
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Distance Measurement
                      </span>
                      <p className="text-xs text-gray-500">
                        Can use distance measurement tools
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.toolsAccess.polygonDrawing}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            toolsAccess: {
                              ...prev.permissions.toolsAccess,
                              polygonDrawing: e.target.checked
                            }
                          }
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Polygon Drawing
                      </span>
                      <p className="text-xs text-gray-500">
                        Can draw and edit polygons
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        formData.permissions.toolsAccess.elevationAnalysis
                      }
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            toolsAccess: {
                              ...prev.permissions.toolsAccess,
                              elevationAnalysis: e.target.checked
                            }
                          }
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Elevation Analysis
                      </span>
                      <p className="text-xs text-gray-500">
                        Can use elevation analysis tools
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        formData.permissions.toolsAccess
                          .infrastructureManagement
                      }
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            toolsAccess: {
                              ...prev.permissions.toolsAccess,
                              infrastructureManagement: e.target.checked
                            }
                          }
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Infrastructure Management
                      </span>
                      <p className="text-xs text-gray-500">
                        Can manage infrastructure data
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Restrictions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Geographic Restrictions
              </h3>
              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.restrictions.strictGeofencing}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        restrictions: {
                          ...prev.restrictions,
                          strictGeofencing: e.target.checked
                        }
                      }))
                    }
                    className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Strict Geofencing
                    </span>
                    <p className="text-xs text-gray-500">
                      User cannot work outside assigned regions at all
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.restrictions.allowNearBorder}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        restrictions: {
                          ...prev.restrictions,
                          allowNearBorder: e.target.checked
                        }
                      }))
                    }
                    className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Allow Near Border Work
                    </span>
                    <p className="text-xs text-gray-500">
                      Allow work near region borders within tolerance
                    </p>
                  </div>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Border Tolerance (kilometers)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.restrictions.borderTolerance}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        restrictions: {
                          ...prev.restrictions,
                          borderTolerance: parseInt(e.target.value) || 10
                        }
                      }))
                    }
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Distance in kilometers from region border where user can
                    work
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading.creating}
                className={`px-6 py-2 text-white rounded-lg transition-colors ${
                  loading.creating
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading.creating ? (
                  <div className="flex items-center space-x-2">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Creating User...</span>
                  </div>
                ) : (
                  "Create User"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminUserCreationForm;
