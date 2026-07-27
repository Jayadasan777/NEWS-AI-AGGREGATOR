import React, { useEffect, useRef, useState } from 'react';

/**
 * CustomCursor — smooth lagging ring cursor that follows the mouse.
 * The outer ring lags behind the actual position.
 * Hidden on touch devices.
 */
export default function CustomCursor() {
  const dotRef   = useRef(null);
  const ringRef  = useRef(null);
  const pos      = useRef({ x: -100, y: -100 });
  const ring     = useRef({ x: -100, y: -100 });
  const raf      = useRef(null);
  const [visible, setVisible] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);
  const hoveringRef = useRef(false);

  useEffect(() => {
    // Hide native cursor via CSS
    document.documentElement.classList.add('custom-cursor-active');

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    };
    const onDown  = () => setClicking(true);
    const onUp    = () => setClicking(false);
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    // Track interactive elements for hover state
    const onOver = (e) => {
      const el = e.target.closest('a, button, [role="button"], input, select, textarea, [data-cursor-hover]');
      const isHovered = !!el;
      if (isHovered !== hoveringRef.current) {
        hoveringRef.current = isHovered;
        setHovering(isHovered);
      }
    };

    document.addEventListener('mousemove',   onMove,  { passive: true });
    document.addEventListener('mousedown',   onDown);
    document.addEventListener('mouseup',     onUp);
    document.addEventListener('mouseleave',  onLeave);
    document.addEventListener('mouseenter',  onEnter);
    document.addEventListener('mouseover',   onOver,  { passive: true });

    // RAF loop: dot follows exactly, ring lags smoothly
    const lerp = (a, b, t) => a + (b - a) * t;
    const loop = () => {
      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`;
      }
      if (ringRef.current) {
        ring.current.x = lerp(ring.current.x, pos.current.x, 0.1);
        ring.current.y = lerp(ring.current.y, pos.current.y, 0.1);
        ringRef.current.style.transform =
          `translate(${ring.current.x - 20}px, ${ring.current.y - 20}px)`;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);

    return () => {
      document.documentElement.classList.remove('custom-cursor-active');
      document.removeEventListener('mousemove',   onMove);
      document.removeEventListener('mousedown',   onDown);
      document.removeEventListener('mouseup',     onUp);
      document.removeEventListener('mouseleave',  onLeave);
      document.removeEventListener('mouseenter',  onEnter);
      document.removeEventListener('mouseover',   onOver);
      cancelAnimationFrame(raf.current);
    };
  }, []); // eslint-disable-line

  if (typeof window !== 'undefined' && ('ontouchstart' in window)) return null;

  return (
    <>
      {/* Dot — snaps to cursor */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'rgba(245,245,247,0.9)',
          pointerEvents: 'none',
          zIndex: 9999,
          willChange: 'transform',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.2s ease',
          mixBlendMode: 'difference',
        }}
      />
      {/* Ring — lags behind */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: `1.5px solid ${clicking ? 'rgba(244,63,94,0.9)' : hovering ? 'rgba(245,245,247,0.9)' : 'rgba(245,245,247,0.5)'}`,
          pointerEvents: 'none',
          zIndex: 9998,
          willChange: 'transform',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.2s ease, width 0.2s ease, height 0.2s ease, border-color 0.2s ease',
          width: hovering ? 52 : clicking ? 28 : 40,
          height: hovering ? 52 : clicking ? 28 : 40,
          mixBlendMode: 'difference',
        }}
      />
    </>
  );
}
