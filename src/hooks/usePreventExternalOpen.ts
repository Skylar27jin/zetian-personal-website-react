// src/hooks/usePreventExternalOpen.ts
import { useEffect } from 'react';
import { isNativeApp } from '../pkg/platform';
// 如果之后要用 Capacitor Browser，可以在这里 import

export function usePreventExternalOpen() {
  useEffect(() => {
    if (!isNativeApp()) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href') || '';
      if (!href.startsWith('http')) return; // 内部链接不管

      e.preventDefault();
      e.stopPropagation();

      // TODO: 在这里用 Capacitor Browser 打开，之后再一起补
      // Browser.open({ url: href });
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
}
