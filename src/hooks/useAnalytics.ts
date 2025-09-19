import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useTheme } from './useTheme';
import {
  UsageStatistics,
  UserActivity,
  ToolMetrics,
  DataCreationAnalytics,
  SystemHealthMetrics,
  PerformanceMetrics,
  UsageTrend,
  AnalyticsReport,
  AnalyticsFilter,
  AlertRule,
  AnalyticsInsight
} from '../types';

interface AnalyticsState {
  usageStats: UsageStatistics | null;
  userActivities: UserActivity[];
  toolMetrics: ToolMetrics[];
  dataAnalytics: DataCreationAnalytics | null;
  systemHealth: SystemHealthMetrics | null;
  performance: PerformanceMetrics | null;
  trends: UsageTrend[];
  reports: AnalyticsReport[];
  alerts: AlertRule[];
  insights: AnalyticsInsight[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export const useAnalytics = () => {
  const { user } = useAuth();
  const { addNotification, setLoading } = useTheme();

  const [state, setState] = useState<AnalyticsState>({
    usageStats: null,
    userActivities: [],
    toolMetrics: [],
    dataAnalytics: null,
    systemHealth: null,
    performance: null,
    trends: [],
    reports: [],
    alerts: [],
    insights: [],
    loading: false,
    error: null,
    lastUpdated: null
  });

  // Mock data generation
  const generateMockData = useCallback(() => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Usage Statistics
    const usageStats: UsageStatistics = {
      totalUsers: 156,
      activeUsers: 89,
      totalSessions: 1247,
      averageSessionDuration: 28.5, // minutes
      totalDataItems: 3421,
      totalStorageUsed: 2.8, // GB
      period: {
        start: lastMonth.toISOString(),
        end: now.toISOString()
      }
    };

    // User Activities
    const userActivities: UserActivity[] = [
      {
        userId: 'admin',
        userName: 'Admin User',
        lastLogin: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        sessionCount: 45,
        totalTimeSpent: 1280, // minutes
        actionsPerformed: 892,
        toolsUsed: ['distance', 'polygon', 'elevation', 'infrastructure', 'admin'],
        dataCreated: 23,
        dataShared: 12,
        status: 'active'
      },
      {
        userId: 'manager',
        userName: 'Regional Manager',
        lastLogin: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        sessionCount: 32,
        totalTimeSpent: 856,
        actionsPerformed: 564,
        toolsUsed: ['distance', 'polygon', 'admin', 'data'],
        dataCreated: 18,
        dataShared: 8,
        status: 'active'
      },
      {
        userId: 'tech',
        userName: 'Field Technician',
        lastLogin: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        sessionCount: 28,
        totalTimeSpent: 672,
        actionsPerformed: 445,
        toolsUsed: ['distance', 'elevation', 'infrastructure'],
        dataCreated: 15,
        dataShared: 5,
        status: 'active'
      },
      {
        userId: 'viewer',
        userName: 'Regular User',
        lastLogin: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        sessionCount: 12,
        totalTimeSpent: 245,
        actionsPerformed: 123,
        toolsUsed: ['search', 'data'],
        dataCreated: 3,
        dataShared: 1,
        status: 'idle'
      }
    ];

    // Tool Metrics
    const toolMetrics: ToolMetrics[] = [
      {
        toolName: 'Distance Measurement',
        toolType: 'distance',
        usageCount: 487,
        uniqueUsers: 78,
        averageUsageTime: 3.2,
        successRate: 98.5,
        errorCount: 7,
        lastUsed: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        popularityRank: 1,
        growthRate: 15.3
      },
      {
        toolName: 'Polygon Drawing',
        toolType: 'polygon',
        usageCount: 334,
        uniqueUsers: 65,
        averageUsageTime: 5.8,
        successRate: 96.2,
        errorCount: 13,
        lastUsed: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        popularityRank: 2,
        growthRate: 8.7
      },
      {
        toolName: 'Search System',
        toolType: 'search',
        usageCount: 298,
        uniqueUsers: 89,
        averageUsageTime: 1.8,
        successRate: 94.1,
        errorCount: 18,
        lastUsed: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        popularityRank: 3,
        growthRate: 22.1
      },
      {
        toolName: 'Data Manager',
        toolType: 'data',
        usageCount: 245,
        uniqueUsers: 56,
        averageUsageTime: 4.5,
        successRate: 97.8,
        errorCount: 5,
        lastUsed: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        popularityRank: 4,
        growthRate: 35.2
      },
      {
        toolName: 'Elevation Tool',
        toolType: 'elevation',
        usageCount: 178,
        uniqueUsers: 42,
        averageUsageTime: 2.9,
        successRate: 99.1,
        errorCount: 2,
        lastUsed: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        popularityRank: 5,
        growthRate: 12.8
      }
    ];

    // Data Creation Analytics
    const dataAnalytics: DataCreationAnalytics = {
      period: 'Last 30 days',
      totalCreated: 156,
      byType: {
        distance: 67,
        polygon: 42,
        elevation: 28,
        infrastructure: 19
      },
      byUser: {
        admin: 45,
        manager: 38,
        tech: 33,
        viewer: 24,
        others: 16
      },
      byRegion: {
        Maharashtra: 78,
        Gujarat: 34,
        Rajasthan: 25,
        Karnataka: 19
      },
      avgFileSize: 2.4, // KB
      storageGrowth: 15.7, // %
      sharedItems: 89,
      publicItems: 23
    };

    // System Health
    const systemHealth: SystemHealthMetrics = {
      cpu: {
        usage: 45.2,
        cores: 8,
        load: [0.45, 0.52, 0.38]
      },
      memory: {
        total: 16384, // MB
        used: 8192,
        free: 8192,
        usage: 50.0
      },
      storage: {
        total: 1000, // GB
        used: 280,
        free: 720,
        usage: 28.0
      },
      network: {
        latency: 12.5, // ms
        throughput: 850, // Mbps
        errors: 0.02 // %
      },
      database: {
        connections: 25,
        queryTime: 45.2, // ms
        errorRate: 0.01 // %
      },
      uptime: 99.98,
      lastCheck: now.toISOString()
    };

    // Performance Metrics
    const performance: PerformanceMetrics = {
      pageLoadTime: 1.2, // seconds
      apiResponseTime: 245, // ms
      renderTime: 85, // ms
      errorRate: 0.15, // %
      crashRate: 0.002, // %
      userSatisfactionScore: 4.6, // out of 5
      bottlenecks: [
        {
          component: 'Map Rendering',
          severity: 'medium',
          impact: 'Slight delay in large polygon rendering',
          suggestion: 'Implement progressive loading for complex geometries'
        },
        {
          component: 'Search API',
          severity: 'low',
          impact: 'Occasional slow response for complex queries',
          suggestion: 'Add query optimization and caching'
        }
      ]
    };

    // Usage Trends (last 7 days)
    const trends: UsageTrend[] = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      return {
        date: date.toISOString().split('T')[0],
        users: Math.floor(Math.random() * 30) + 60,
        sessions: Math.floor(Math.random() * 50) + 100,
        dataCreated: Math.floor(Math.random() * 15) + 5,
        toolUsage: {
          distance: Math.floor(Math.random() * 20) + 30,
          polygon: Math.floor(Math.random() * 15) + 20,
          search: Math.floor(Math.random() * 25) + 35,
          data: Math.floor(Math.random() * 12) + 15,
          elevation: Math.floor(Math.random() * 10) + 10
        },
        errors: Math.floor(Math.random() * 3),
        performance: Math.random() * 20 + 80
      };
    });

    // Analytics Insights
    const insights: AnalyticsInsight[] = [
      {
        id: 'insight-1',
        type: 'trend',
        title: 'Data Manager Usage Surge',
        description: 'Data Manager usage has increased by 35% this month, indicating growing adoption of data organization features.',
        severity: 'medium',
        category: 'usage',
        data: { growthRate: 35.2, tool: 'data' },
        actionable: true,
        suggestedActions: [
          'Consider adding more data management features',
          'Provide advanced training on data organization',
          'Monitor server capacity for increased data storage'
        ],
        generatedAt: now.toISOString(),
        confidence: 0.92
      },
      {
        id: 'insight-2',
        type: 'recommendation',
        title: 'Search Performance Optimization',
        description: 'Search queries are taking 15% longer than optimal. Consider implementing query caching.',
        severity: 'low',
        category: 'performance',
        data: { avgResponseTime: 245, target: 200 },
        actionable: true,
        suggestedActions: [
          'Implement Redis caching for frequent queries',
          'Optimize database indexes',
          'Add query result pagination'
        ],
        generatedAt: now.toISOString(),
        confidence: 0.87
      },
      {
        id: 'insight-3',
        type: 'anomaly',
        title: 'Unusual Error Spike',
        description: 'Map rendering errors increased by 300% yesterday, but have since normalized.',
        severity: 'low',
        category: 'performance',
        data: { errorSpike: '2024-01-15', errorCount: 12, normalCount: 3 },
        actionable: false,
        generatedAt: now.toISOString(),
        confidence: 0.95
      }
    ];

    return {
      usageStats,
      userActivities,
      toolMetrics,
      dataAnalytics,
      systemHealth,
      performance,
      trends,
      insights
    };
  }, []);

  // Initialize with mock data
  useEffect(() => {
    const mockData = generateMockData();
    setState(prev => ({
      ...prev,
      ...mockData,
      lastUpdated: new Date().toISOString()
    }));
  }, [generateMockData]);

  const refreshAnalytics = useCallback(async () => {
    setLoading('analytics', true, 'Refreshing analytics...');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockData = generateMockData();
      setState(prev => ({
        ...prev,
        ...mockData,
        lastUpdated: new Date().toISOString(),
        error: null
      }));

      addNotification({
        type: 'success',
        message: 'Analytics data refreshed',
        duration: 2000
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to refresh analytics data'
      }));

      addNotification({
        type: 'error',
        message: 'Failed to refresh analytics',
        duration: 5000
      });
    } finally {
      setLoading('analytics', false);
    }
  }, [generateMockData, setLoading, addNotification]);

  const generateReport = useCallback(async (
    type: AnalyticsReport['type'],
    filter: AnalyticsFilter,
    format: AnalyticsReport['format'] = 'json'
  ): Promise<string> => {
    setLoading('generateReport', true, 'Generating report...');

    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const reportId = `report-${Date.now()}`;
      const newReport: AnalyticsReport = {
        id: reportId,
        title: `${type.replace('_', ' ').toUpperCase()} Report`,
        type,
        period: filter.dateRange,
        data: {}, // Would contain actual report data
        generatedBy: user?.id || 'system',
        generatedAt: new Date().toISOString(),
        format,
        status: 'ready',
        downloadUrl: `/api/reports/${reportId}/download`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      setState(prev => ({
        ...prev,
        reports: [newReport, ...prev.reports]
      }));

      addNotification({
        type: 'success',
        message: `${format.toUpperCase()} report generated successfully`,
        duration: 3000
      });

      return reportId;
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to generate report',
        duration: 5000
      });
      throw error;
    } finally {
      setLoading('generateReport', false);
    }
  }, [user?.id, setLoading, addNotification]);

  const trackUserAction = useCallback((action: string, tool: string, metadata?: any) => {
    // Track user actions for analytics
    console.log('Analytics: User action tracked', { action, tool, metadata, user: user?.id });

    // In a real implementation, this would send data to analytics service
    // For now, we'll just log it
  }, [user?.id]);

  const getFilteredData = useCallback((filter: AnalyticsFilter) => {
    // Apply filters to analytics data
    // This is a simplified version - in reality, this would query the backend

    const filteredTrends = state.trends.filter(trend => {
      const trendDate = new Date(trend.date);
      const startDate = new Date(filter.dateRange.start);
      const endDate = new Date(filter.dateRange.end);
      return trendDate >= startDate && trendDate <= endDate;
    });

    const filteredToolMetrics = filter.tools
      ? state.toolMetrics.filter(metric => filter.tools!.includes(metric.toolName))
      : state.toolMetrics;

    return {
      trends: filteredTrends,
      toolMetrics: filteredToolMetrics,
      usageStats: state.usageStats,
      dataAnalytics: state.dataAnalytics
    };
  }, [state]);

  return {
    ...state,
    refreshAnalytics,
    generateReport,
    trackUserAction,
    getFilteredData
  };
};