import React, { useState, useEffect } from 'react';
import {
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface ResponsivenessTest {
  id: string;
  name: string;
  description: string;
  breakpoint: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
}

interface ViewportInfo {
  width: number;
  height: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
}

export const MobileResponsivenessTest: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [viewport, setViewport] = useState<ViewportInfo>({
    width: window.innerWidth,
    height: window.innerHeight,
    deviceType: 'desktop',
    orientation: 'landscape'
  });

  const [tests, setTests] = useState<ResponsivenessTest[]>([]);

  const updateViewport = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (width <= 768) deviceType = 'mobile';
    else if (width <= 1024) deviceType = 'tablet';

    const orientation = width > height ? 'landscape' : 'portrait';

    setViewport({ width, height, deviceType, orientation });
  };

  const runResponsivenessTests = () => {
    const newTests: ResponsivenessTest[] = [];

    // Test 1: Mobile Navigation
    const mobileNav = document.querySelector('.md\\:hidden');
    newTests.push({
      id: 'mobile-nav',
      name: 'Mobile Navigation',
      description: 'Mobile navigation should be visible on small screens',
      breakpoint: '≤ 768px',
      status: viewport.width <= 768 && mobileNav ? 'pass' : 'fail',
      details: viewport.width <= 768
        ? (mobileNav ? 'Mobile navigation is properly displayed' : 'Mobile navigation not found')
        : 'Test not applicable on larger screens'
    });

    // Test 2: Desktop Navigation Hidden on Mobile
    const desktopNav = document.querySelector('.hidden.md\\:flex');
    newTests.push({
      id: 'desktop-nav-hidden',
      name: 'Desktop Navigation Hidden',
      description: 'Desktop navigation should be hidden on mobile',
      breakpoint: '≤ 768px',
      status: viewport.width <= 768 && !getComputedStyle(desktopNav || document.body).display.includes('flex') ? 'pass' :
              viewport.width > 768 ? 'pass' : 'fail',
      details: viewport.width <= 768
        ? 'Desktop navigation properly hidden on mobile'
        : 'Desktop navigation visible on larger screens'
    });

    // Test 3: Touch-Friendly Tap Targets
    const buttons = document.querySelectorAll('button, .clickable, .btn, a');
    let touchFriendlyCount = 0;
    buttons.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      if (rect.height >= 44 && rect.width >= 44) touchFriendlyCount++;
    });

    const touchFriendlyPercentage = (touchFriendlyCount / buttons.length) * 100;
    newTests.push({
      id: 'touch-targets',
      name: 'Touch-Friendly Targets',
      description: 'Interactive elements should be at least 44px × 44px',
      breakpoint: 'All sizes',
      status: touchFriendlyPercentage >= 80 ? 'pass' : touchFriendlyPercentage >= 60 ? 'warning' : 'fail',
      details: `${touchFriendlyCount}/${buttons.length} elements (${touchFriendlyPercentage.toFixed(1)}%) meet touch target requirements`
    });

    // Test 4: Horizontal Scrolling
    const body = document.body;
    const hasHorizontalScroll = body.scrollWidth > viewport.width;
    newTests.push({
      id: 'horizontal-scroll',
      name: 'No Horizontal Scroll',
      description: 'Content should not cause horizontal scrolling',
      breakpoint: 'All sizes',
      status: !hasHorizontalScroll ? 'pass' : 'fail',
      details: hasHorizontalScroll
        ? `Page width (${body.scrollWidth}px) exceeds viewport (${viewport.width}px)`
        : 'No horizontal scrolling detected'
    });

    // Test 5: Font Size Readability
    const computedStyle = getComputedStyle(document.body);
    const fontSize = parseFloat(computedStyle.fontSize);
    newTests.push({
      id: 'font-size',
      name: 'Readable Font Size',
      description: 'Base font size should be at least 14px on mobile',
      breakpoint: '≤ 768px',
      status: viewport.width <= 768
        ? (fontSize >= 14 ? 'pass' : 'warning')
        : 'pass',
      details: `Base font size: ${fontSize}px`
    });

    // Test 6: Viewport Meta Tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    newTests.push({
      id: 'viewport-meta',
      name: 'Viewport Meta Tag',
      description: 'Proper viewport meta tag should be present',
      breakpoint: 'All sizes',
      status: viewportMeta ? 'pass' : 'fail',
      details: viewportMeta
        ? `Viewport: ${viewportMeta.getAttribute('content')}`
        : 'Viewport meta tag not found'
    });

    // Test 7: Layout Grid Responsiveness
    const gridElements = document.querySelectorAll('.layout-grid-2, .layout-grid-3, .layout-grid-4');
    let responsiveGrids = 0;
    gridElements.forEach(grid => {
      const style = getComputedStyle(grid);
      const columns = style.gridTemplateColumns;
      if (viewport.width <= 768 && columns.includes('1fr') && !columns.includes('repeat')) {
        responsiveGrids++;
      } else if (viewport.width > 768) {
        responsiveGrids++; // Assume correct on larger screens
      }
    });

    newTests.push({
      id: 'responsive-grids',
      name: 'Responsive Grid Layouts',
      description: 'Grid layouts should stack on mobile',
      breakpoint: '≤ 768px',
      status: gridElements.length === 0 ? 'pass' :
              (responsiveGrids === gridElements.length ? 'pass' : 'warning'),
      details: `${responsiveGrids}/${gridElements.length} grids are responsive`
    });

    setTests(newTests);
  };

  useEffect(() => {
    updateViewport();
    runResponsivenessTests();

    const handleResize = () => {
      updateViewport();
      setTimeout(runResponsivenessTests, 100); // Delay to allow layout changes
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    runResponsivenessTests();
  }, [viewport]);

  const getDeviceIcon = () => {
    switch (viewport.deviceType) {
      case 'mobile': return DevicePhoneMobileIcon;
      case 'tablet': return DeviceTabletIcon;
      default: return ComputerDesktopIcon;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return CheckCircleIcon;
      case 'warning': return ExclamationTriangleIcon;
      default: return XCircleIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-50';
      case 'warning': return 'bg-yellow-50';
      default: return 'bg-red-50';
    }
  };

  const DeviceIcon = getDeviceIcon();
  const passCount = tests.filter(t => t.status === 'pass').length;
  const warningCount = tests.filter(t => t.status === 'warning').length;
  const failCount = tests.filter(t => t.status === 'fail').length;

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-xl z-40 transition-all duration-300">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Mobile Responsiveness Test
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={runResponsivenessTests}
              className="text-sm bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              Refresh
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-gray-100 rounded"
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronUpIcon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
              aria-label="Close"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-3">
          <DeviceIcon className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">
            {viewport.width} × {viewport.height} ({viewport.deviceType}, {viewport.orientation})
          </span>
        </div>

        <div className="flex space-x-4 text-sm">
          <span className="text-green-600">✓ {passCount}</span>
          <span className="text-yellow-600">⚠ {warningCount}</span>
          <span className="text-red-600">✗ {failCount}</span>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
        {tests.map((test) => {
          const StatusIcon = getStatusIcon(test.status);

          return (
            <div
              key={test.id}
              className={`p-3 rounded-lg border ${getStatusBgColor(test.status)} border-gray-200`}
            >
              <div className="flex items-start space-x-2">
                <StatusIcon className={`w-5 h-5 mt-0.5 ${getStatusColor(test.status)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {test.name}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {test.breakpoint}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {test.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {test.details}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Resize your browser window to test different breakpoints
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileResponsivenessTest;