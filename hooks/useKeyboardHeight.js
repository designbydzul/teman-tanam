import { useState, useEffect } from 'react';

/**
 * Hook to track mobile keyboard height using Visual Viewport API
 * Returns the keyboard height in pixels
 *
 * Usage:
 * const keyboardHeight = useKeyboardHeight();
 *
 * Then use keyboardHeight in your component's styling to adjust layout
 */
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Only run on mobile devices with visualViewport support
    if (!window.visualViewport) {
      return;
    }

    const handleResize = () => {
      const viewportHeight = window.visualViewport.height;
      const viewportOffsetTop = window.visualViewport.offsetTop;
      const windowHeight = window.innerHeight;

      // Calculate keyboard height
      // Keyboard is open when viewport height + offset is less than window height
      const newKeyboardHeight = windowHeight - viewportHeight - viewportOffsetTop;

      // Only set keyboard height if it's significant (> 50px)
      // This avoids false positives from small viewport changes
      setKeyboardHeight(newKeyboardHeight > 50 ? newKeyboardHeight : 0);
    };

    // Listen to viewport resize events
    window.visualViewport.addEventListener('resize', handleResize);

    // Initial call
    handleResize();

    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
    };
  }, []);

  return keyboardHeight;
}
