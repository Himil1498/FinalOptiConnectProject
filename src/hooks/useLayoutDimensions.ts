import { useState, useEffect } from 'react';

/**
 * Hook to detect navbar height dynamically
 */
export const useNavbarHeight = () => {
  const [navbarHeight, setNavbarHeight] = useState(64); // Default h-16 (64px)

  useEffect(() => {
    const updateNavbarHeight = () => {
      const navbar = document.querySelector('nav[role="navigation"]');
      if (navbar) {
        const rect = navbar.getBoundingClientRect();
        setNavbarHeight(rect.height);
      }
    };

    // Initial check
    updateNavbarHeight();

    // Set up observer for navbar changes
    const observer = new MutationObserver(updateNavbarHeight);
    const navbar = document.querySelector('nav[role="navigation"]');
    if (navbar) {
      observer.observe(navbar, {
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }

    // Listen for window resize
    window.addEventListener('resize', updateNavbarHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateNavbarHeight);
    };
  }, []);

  return navbarHeight;
};

/**
 * Hook to detect footer height dynamically
 */
export const useFooterHeight = () => {
  const [footerHeight, setFooterHeight] = useState(40); // Default collapsed height

  useEffect(() => {
    const updateFooterHeight = () => {
      const footer = document.querySelector('footer');
      if (footer) {
        const rect = footer.getBoundingClientRect();
        setFooterHeight(rect.height);
      }
    };

    // Initial check
    updateFooterHeight();

    // Set up observer for footer changes
    const observer = new MutationObserver(updateFooterHeight);
    const footer = document.querySelector('footer');
    if (footer) {
      observer.observe(footer, {
        attributes: true,
        attributeFilter: ['class', 'style'],
        childList: true,
        subtree: true
      });
    }

    // Listen for window resize
    window.addEventListener('resize', updateFooterHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateFooterHeight);
    };
  }, []);

  return footerHeight;
};

/**
 * Hook to detect sidebar width dynamically
 */
export const useSidebarWidth = () => {
  const [sidebarWidth, setSidebarWidth] = useState(280);

  useEffect(() => {
    const checkSidebarState = () => {
      const selectors = [
        ".dashboard-sidebar",
        '[class*="sidebar"]',
        'nav[class*="left"]',
        "aside",
        '[class*="navigation"]',
        '[class*="menu"]',
        ".fixed.left-0",
        ".fixed.inset-y-0"
      ];

      let sidebar = null;
      for (const selector of selectors) {
        sidebar = document.querySelector(selector);
        if (sidebar) break;
      }

      if (sidebar) {
        const rect = sidebar.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(sidebar);
        const isVisible =
          computedStyle.display !== "none" &&
          computedStyle.visibility !== "hidden" &&
          rect.width > 0;

        if (isVisible) {
          setSidebarWidth(rect.width + 16);
        } else {
          setSidebarWidth(16);
        }
      } else {
        setSidebarWidth(16);
      }
    };

    checkSidebarState();
    setTimeout(checkSidebarState, 10);

    let rafId: number;
    const observer = new MutationObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkSidebarState);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "class",
        "style",
        "data-collapsed",
        "data-expanded",
        "data-state"
      ]
    });

    window.addEventListener("resize", checkSidebarState);

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(
          '[class*="sidebar"], [class*="menu"], [class*="nav"], button'
        ) ||
        target.getAttribute("aria-expanded") !== null
      ) {
        requestAnimationFrame(checkSidebarState);
        requestAnimationFrame(() => requestAnimationFrame(checkSidebarState));
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", checkSidebarState);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return sidebarWidth;
};
