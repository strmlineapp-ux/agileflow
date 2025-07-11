
import { useEffect, type RefObject } from 'react';

/**
 * Custom hook that focuses an element when it's ready.
 * It uses requestAnimationFrame to ensure the focus command runs after the
 * browser has painted the element, making it reliable for components that
 * are conditionally rendered or displayed (like in tabs).
 *
 * @param ref - A React ref object attached to the element to be focused.
 * @param isReady - A boolean flag that indicates when the element is ready to be focused.
 */
export function useFocusOnMount(ref: RefObject<HTMLElement>, isReady: boolean) {
  useEffect(() => {
    if (isReady && ref.current) {
      const animationFrame = requestAnimationFrame(() => {
        ref.current?.focus();
      });
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [isReady, ref]);
}
