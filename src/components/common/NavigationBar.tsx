import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  MapIcon,
  ChartBarIcon,
  UsersIcon,
  FolderIcon
} from "@heroicons/react/24/outline";
import { SkipLink } from "./AccessibilityEnhancements";
import MapSearchBox from "./MapSearchBox";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  badge?: number;
}

interface NavigationBarProps {
  mapInstance?: google.maps.Map | null;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ mapInstance }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const navigationItems: NavigationItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: MapIcon
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: ChartBarIcon
    },
    {
      name: "Admin",
      href: "/admin",
      icon: ShieldCheckIcon,
      roles: ["admin"]
    }
  ];

  const filteredNavItems = navigationItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role || "")
  );

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const isActiveRoute = (href: string) => {
    return (
      location.pathname === href || location.pathname.startsWith(`${href}/`)
    );
  };

  return (
    <>
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <nav
        className="bg-white shadow-sm border-b border-gray-200 relative z-30"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="w-full">
          <div className="flex items-center h-16 px-4">
            {/* Left section - Logo and brand - Fixed width */}
            <div className="flex items-center space-x-4 w-64 flex-shrink-0">
              <Link to="/dashboard" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">
                    OptiConnect
                  </h1>
                  <p className="text-xs text-gray-500 -mt-1">GIS Platform</p>
                </div>
              </Link>
            </div>

            {/* Center section - Desktop Navigation - Fixed position */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div className="hidden md:flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.href);

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? "bg-white text-indigo-700 shadow-sm border border-indigo-100"
                          : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                      {item.badge && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right section - Compact and well-spaced */}
            <div
              className="flex items-center space-x-2 justify-end flex-shrink-0 ml-auto"
              style={{ width: "520px" }}
            >
              {/* Dynamic content area - controlled width */}
              <div
                className="flex items-center justify-start"
                style={{ width: "280px" }}
              >
                {/* Dashboard - Search Box */}
                {location.pathname === "/dashboard" && (
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isSearchFocused ? "w-[280px]" : "w-[240px]"
                    }`}
                  >
                    <MapSearchBox
                      map={mapInstance || null}
                      searchValue={searchValue}
                      onSearchChange={setSearchValue}
                      onPlaceSelect={(place) => {
                        // Handle selected place
                      }}
                      className="w-full"
                      onFocusChange={setIsSearchFocused}
                    />
                  </div>
                )}

                {/* Analytics - Compact Features */}
                {location.pathname === "/analytics" && (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded text-xs">
                      <ChartBarIcon className="w-3 h-3 text-blue-600" />
                      <span className="text-blue-700 font-medium">Live</span>
                    </div>
                    <button className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded text-xs hover:bg-green-100 transition-colors">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-green-700 font-medium">Export</span>
                    </button>
                  </div>
                )}

                {/* Admin - Compact Features */}
                {location.pathname === "/admin" && (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-purple-50 px-2 py-1 rounded text-xs">
                      <ShieldCheckIcon className="w-3 h-3 text-purple-600" />
                      <span className="text-purple-700 font-medium">Admin</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded text-xs">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                      <span className="text-yellow-700 font-medium">
                        3 Tasks
                      </span>
                    </div>
                  </div>
                )}

                {/* Other Pages - Minimal Branding */}
                {!["dashboard", "analytics", "admin"].includes(
                  location.pathname.replace("/", "")
                ) && (
                  <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded text-xs">
                    <MapIcon className="w-3 h-3 text-gray-600" />
                    <span className="text-gray-700 font-medium">GIS</span>
                  </div>
                )}
              </div>

              {/* Quick Actions - Only show on dashboard */}
              {location.pathname === "/dashboard" && (
                <div className="hidden md:flex items-center space-x-1">
                  <button
                    aria-label="Add New Tower"
                    className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                    title="Add New Tower"
                  >
                    <MapIcon className="w-5 h-5" />
                  </button>
                  <button
                    aria-label="Data Export"
                    className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                    title="Export Data"
                  >
                    <ChartBarIcon className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Notifications */}
              <button
                aria-label="Notifications (1 unread)"
                className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 relative"
              >
                <BellIcon className="w-5 h-5" />
                <span
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"
                  aria-hidden="true"
                ></span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium truncate max-w-24">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role || "viewer"}
                    </p>
                  </div>
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isProfileMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Profile Dropdown Menu - Position left to avoid right panel conflict */}
                {isProfileMenuOpen && (
                  <div
                    className="absolute mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 max-h-[80vh] overflow-y-auto profile-dropdown-scroll"
                    style={{
                      zIndex: 999999,
                      right: "0px",
                      transform: "translateX(-60px)" // Reduced spacing to give more room for live coordinates
                    }}
                  >
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user?.email}
                      </p>
                      <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                        {/* Last Login */}
                        <div className="flex items-center text-xs text-gray-400">
                          <span className="mr-1">🟢</span>
                          <span>
                            Last login:{" "}
                            {user?.lastLogin
                              ? `${new Date(user.lastLogin).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                  }
                                )} at ${new Date(
                                  user.lastLogin
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true
                                })}`
                              : `${new Date().toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })} at ${new Date().toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true
                                  }
                                )}`}
                          </span>
                        </div>

                        {/* User Role Badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Role:</span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              user?.role === "admin"
                                ? "bg-red-100 text-red-700"
                                : user?.role === "manager"
                                ? "bg-blue-100 text-blue-700"
                                : user?.role === "technician"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {user?.role
                              ? user.role.charAt(0).toUpperCase() +
                                user.role.slice(1)
                              : "Viewer"}
                          </span>
                        </div>

                        {/* Session Duration */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Session:</span>
                          <span>2h 15m active</span>
                        </div>

                        {/* Location/Department */}
                        {user?.department && (
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>Dept:</span>
                            <span className="truncate ml-2">
                              {user.department}
                            </span>
                          </div>
                        )}

                        {/* Working Hours & Timezone */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Time:</span>
                          <span>IST (GMT+5:30)</span>
                        </div>

                        {/* Recent Location */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Last viewed:</span>
                          <span className="truncate ml-1">New Delhi</span>
                        </div>
                      </div>
                    </div>

                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <UserCircleIcon className="w-4 h-4 mr-3" />
                      View Profile
                    </button>

                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <CogIcon className="w-4 h-4 mr-3" />
                      Account Settings
                    </button>

                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <BellIcon className="w-4 h-4 mr-3" />
                      Notifications
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                        3
                      </span>
                    </button>

                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <MagnifyingGlassIcon className="w-4 h-4 mr-3" />
                      Activity Log
                    </button>

                    <hr className="my-1 border-gray-200" />

                    {/* GIS-Specific Features */}
                    <div className="px-3 py-2 bg-blue-50 border-l-2 border-blue-200">
                      <div className="text-xs font-medium text-blue-700 mb-1">
                        🗺️ Map Preferences
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>View:</span>
                          <select className="text-xs bg-white border rounded px-1 py-0.5 w-16">
                            <option>Hybrid</option>
                            <option>Satellite</option>
                            <option>Roadmap</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Coords:</span>
                          <select className="text-xs bg-white border rounded px-1 py-0.5 w-16">
                            <option>Decimal</option>
                            <option>DMS</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <hr className="my-1 border-gray-200" />

                    {/* Quick Shortcuts */}
                    <div className="px-3 py-2">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        ⚡ Quick Access
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <button className="flex items-center text-xs bg-gray-50 hover:bg-gray-100 rounded px-1 py-1">
                          <span className="mr-1">📍</span>
                          <span>Distance</span>
                        </button>
                        <button className="flex items-center text-xs bg-gray-50 hover:bg-gray-100 rounded px-1 py-1">
                          <span className="mr-1">📐</span>
                          <span>Polygon</span>
                        </button>
                        <button className="flex items-center text-xs bg-gray-50 hover:bg-gray-100 rounded px-1 py-1">
                          <span className="mr-1">📊</span>
                          <span>Elevation</span>
                        </button>
                        <button className="flex items-center text-xs bg-gray-50 hover:bg-gray-100 rounded px-1 py-1">
                          <span className="mr-1">🎯</span>
                          <span>Location</span>
                        </button>
                      </div>
                    </div>

                    <hr className="my-1 border-gray-200" />

                    <div className="px-4 py-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Theme</span>
                        <button className="flex items-center space-x-1 bg-gray-100 rounded px-2 py-1 text-xs hover:bg-gray-200">
                          <span>🌙</span>
                          <span>Dark</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Language</span>
                        <select className="text-xs bg-white border rounded px-1 py-0.5">
                          <option>English</option>
                          <option>हिंदी</option>
                          <option>தமிழ்</option>
                        </select>
                      </div>
                    </div>

                    <hr className="my-1 border-gray-200" />

                    {/* Security Section */}
                    <div className="px-3 py-2 bg-green-50 border-l-2 border-green-200">
                      <div className="text-xs font-medium text-green-700 mb-1">
                        🔒 Security
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Sessions:</span>
                          <span className="text-green-600 font-medium">
                            2 devices
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Login IP:</span>
                          <span className="font-mono text-xs">
                            192.168.1.100
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>2FA:</span>
                          <span className="text-green-600">✓ On</span>
                        </div>
                      </div>
                    </div>

                    <hr className="my-1 border-gray-200" />

                    {/* Help Section */}
                    <div className="px-3 py-2">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        ❓ Help
                      </div>
                      <div className="space-y-0.5">
                        <button className="flex items-center w-full text-xs text-gray-600 hover:text-gray-800 py-0.5">
                          <span className="mr-2">⌨️</span>
                          <span>Shortcuts</span>
                          <span className="ml-auto text-gray-400 text-xs">
                            Ctrl+?
                          </span>
                        </button>
                        <button className="flex items-center w-full text-xs text-gray-600 hover:text-gray-800 py-0.5">
                          <span className="mr-2">📖</span>
                          <span>User Guide</span>
                        </button>
                        <button className="flex items-center w-full text-xs text-gray-600 hover:text-gray-800 py-0.5">
                          <span className="mr-2">💬</span>
                          <span>Support</span>
                        </button>
                      </div>
                    </div>

                    <hr className="my-1 border-gray-200" />

                    <button
                      onClick={logout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation-menu"
                aria-label={
                  isMobileMenuOpen
                    ? "Close navigation menu"
                    : "Open navigation menu"
                }
                className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div
              id="mobile-navigation-menu"
              className="md:hidden border-t border-gray-200 bg-white"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.href);

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                        isActive
                          ? "bg-indigo-100 text-indigo-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                      {item.badge && (
                        <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Search */}
              <div className="px-4 py-3 border-t border-gray-200">
                <MapSearchBox
                  map={mapInstance || null}
                  searchValue={searchValue}
                  onSearchChange={setSearchValue}
                  onPlaceSelect={(place) => {
                    // Handle selected place
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default NavigationBar;
