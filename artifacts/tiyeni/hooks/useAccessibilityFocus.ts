import { useRef, useEffect } from 'react';
import { Platform } from 'react-native';

export function useAccessibilityFocus(isFocused: boolean = false) {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (isFocused && ref.current) {
      // Focus management for accessibility
      if (Platform.OS === 'web') {
        // Web focus management
        if (ref.current.focus) {
          ref.current.focus();
        }
      } else {
        // Native focus management
        if (ref.current.setNativeProps) {
          ref.current.setNativeProps({
            accessibilityFocused: true,
          });
        }
      }
    }
  }, [isFocused]);

  return ref;
}

export function useFocusManagement() {
  const focusNextElement = (currentRef: React.RefObject<any>) => {
    if (currentRef.current && Platform.OS === 'web') {
      // Find next focusable element
      const nextElement = currentRef.current.nextSibling;
      if (nextElement && nextElement.focus) {
        nextElement.focus();
      }
    }
  };

  const focusPreviousElement = (currentRef: React.RefObject<any>) => {
    if (currentRef.current && Platform.OS === 'web') {
      // Find previous focusable element
      const prevElement = currentRef.current.previousSibling;
      if (prevElement && prevElement.focus) {
        prevElement.focus();
      }
    }
  };

  return {
    focusNextElement,
    focusPreviousElement,
  };
}
