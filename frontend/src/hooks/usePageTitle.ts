import { useEffect } from 'react';

/** Sets document.title for the current route; restores the default on unmount. */
export function usePageTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} · EVSync`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
