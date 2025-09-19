import { useState, useEffect, useCallback } from 'react';

interface FullscreenHook {
  isFullscreen: boolean;
  toggleFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  enterFullscreen: () => Promise<void>;
  isSupported: boolean;
}

export const useFullscreen = (): FullscreenHook => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isSupported = !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled
  );

  const getFullscreenElement = () => {
    return (
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement ||
      null
    );
  };

  const enterFullscreen = useCallback(async (): Promise<void> => {
    if (!isSupported) return;

    const element = document.documentElement;

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    } catch (error) {
      console.warn('Failed to enter fullscreen:', error);
    }
  }, [isSupported]);

  const exitFullscreen = useCallback(async (): Promise<void> => {
    if (!isSupported) return;

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.warn('Failed to exit fullscreen:', error);
    }
  }, [isSupported]);

  const toggleFullscreen = useCallback(async (): Promise<void> => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!getFullscreenElement());
    };

    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ];

    events.forEach(event => {
      document.addEventListener(event, handleFullscreenChange);
    });

    // Initial check
    handleFullscreenChange();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFullscreenChange);
      });
    };
  }, []);

  return {
    isFullscreen,
    toggleFullscreen,
    exitFullscreen,
    enterFullscreen,
    isSupported
  };
};

export default useFullscreen;