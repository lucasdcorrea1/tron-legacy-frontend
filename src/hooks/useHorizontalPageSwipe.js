import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PAGE_ORDER = ['/', '/servicos', '/blog'];
const THRESHOLD = 60;

export default function useHorizontalPageSwipe(containerRef) {
  const navigate = useNavigate();
  const location = useLocation();
  const touch = useRef({ x: 0, y: 0 });
  const swiped = useRef(false);

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;

    const isMobile = () => window.innerWidth <= 768;

    const onTouchStart = (e) => {
      if (!isMobile()) return;
      if (e.target.closest('.carousel-viewport')) return;
      touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      swiped.current = false;
    };

    const onTouchMove = (e) => {
      if (!isMobile() || swiped.current) return;
      if (e.target.closest('.carousel-viewport')) return;

      const dx = e.touches[0].clientX - touch.current.x;
      const dy = e.touches[0].clientY - touch.current.y;

      if (Math.abs(dx) < THRESHOLD) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.8) return;

      swiped.current = true;

      const idx = PAGE_ORDER.indexOf(location.pathname);
      if (idx === -1) return;

      if (dx < 0 && idx < PAGE_ORDER.length - 1) {
        navigate(PAGE_ORDER[idx + 1]);
      } else if (dx > 0 && idx > 0) {
        navigate(PAGE_ORDER[idx - 1]);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [containerRef, navigate, location.pathname]);
}
