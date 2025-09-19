export interface AnalyticsPermissions {
  canViewSystemHealth: boolean;
  canViewUserActivity: boolean;
  canViewDetailedMetrics: boolean;
  canExportReports: boolean;
  canViewSensitiveData: boolean;
  canViewAllUsers: boolean;
  canViewPerformanceData: boolean;
  maxDataRange: number; // in days
}

export interface User {
  role: 'admin' | 'manager' | 'technician' | 'viewer';
  permissions: string[];
}

export const getAnalyticsPermissions = (user: User | null): AnalyticsPermissions => {
  if (!user) {
    return {
      canViewSystemHealth: false,
      canViewUserActivity: false,
      canViewDetailedMetrics: false,
      canExportReports: false,
      canViewSensitiveData: false,
      canViewAllUsers: false,
      canViewPerformanceData: false,
      maxDataRange: 0
    };
  }

  switch (user.role) {
    case 'admin':
      return {
        canViewSystemHealth: true,
        canViewUserActivity: true,
        canViewDetailedMetrics: true,
        canExportReports: true,
        canViewSensitiveData: true,
        canViewAllUsers: true,
        canViewPerformanceData: true,
        maxDataRange: 365
      };

    case 'manager':
      return {
        canViewSystemHealth: true,
        canViewUserActivity: true,
        canViewDetailedMetrics: true,
        canExportReports: user.permissions.includes('view_analytics'),
        canViewSensitiveData: false,
        canViewAllUsers: user.permissions.includes('manage_users'),
        canViewPerformanceData: true,
        maxDataRange: 90
      };

    case 'technician':
      return {
        canViewSystemHealth: false,
        canViewUserActivity: false,
        canViewDetailedMetrics: false,
        canExportReports: false,
        canViewSensitiveData: false,
        canViewAllUsers: false,
        canViewPerformanceData: user.permissions.includes('view_basic_analytics'),
        maxDataRange: 30
      };

    case 'viewer':
      return {
        canViewSystemHealth: false,
        canViewUserActivity: false,
        canViewDetailedMetrics: user.permissions.includes('view_basic_analytics'),
        canExportReports: false,
        canViewSensitiveData: false,
        canViewAllUsers: false,
        canViewPerformanceData: user.permissions.includes('view_basic_analytics'),
        maxDataRange: 7
      };

    default:
      return {
        canViewSystemHealth: false,
        canViewUserActivity: false,
        canViewDetailedMetrics: false,
        canExportReports: false,
        canViewSensitiveData: false,
        canViewAllUsers: false,
        canViewPerformanceData: false,
        maxDataRange: 0
      };
  }
};

export const getFilteredMetrics = (metrics: any[], permissions: AnalyticsPermissions) => {
  if (!permissions.canViewDetailedMetrics) {
    return [];
  }

  return metrics.filter(metric => {
    // Filter out sensitive metrics for non-admin users
    if (!permissions.canViewSensitiveData) {
      const sensitiveMetrics = ['security_events', 'failed_logins', 'system_errors', 'data_access_logs'];
      return !sensitiveMetrics.includes(metric.type);
    }
    return true;
  });
};

export const getFilteredUserActivities = (activities: any[], permissions: AnalyticsPermissions) => {
  if (!permissions.canViewUserActivity) {
    return [];
  }

  return activities.map(activity => {
    if (!permissions.canViewSensitiveData) {
      // Remove sensitive user information for non-admin users
      return {
        ...activity,
        email: undefined,
        ipAddress: undefined,
        deviceFingerprint: undefined,
        sessionDetails: undefined
      };
    }
    return activity;
  });
};

export const shouldShowComponent = (componentName: string, permissions: AnalyticsPermissions): boolean => {
  switch (componentName) {
    case 'systemHealth':
      return permissions.canViewSystemHealth;
    case 'userActivity':
      return permissions.canViewUserActivity;
    case 'detailedMetrics':
      return permissions.canViewDetailedMetrics;
    case 'exportReports':
      return permissions.canExportReports;
    case 'performanceData':
      return permissions.canViewPerformanceData;
    default:
      return false;
  }
};