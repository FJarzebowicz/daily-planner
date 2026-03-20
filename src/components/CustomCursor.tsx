import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;

    let mouseX = 0, mouseY = 0;
    let dotX = 0, dotY = 0;
    let raf: number;

    function onMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    function animate() {
      dotX += (mouseX - dotX) * 0.15;
      dotY += (mouseY - dotY) * 0.15;
      dot!.style.left = `${dotX}px`;
      dot!.style.top = `${dotY}px`;
      raf = requestAnimationFrame(animate);
    }

    function onOver(e: MouseEvent) {
      const target = e.target as HTMLElement;

      // Detect interactive elements
      const interactive = target.closest(
        'button, a, input, textarea, select, [role="button"], .tc, .meal-card, .category-card, .nav-arrow, .backlog-tab, label'
      );
      dot!.classList.toggle('cursor-dot--hover', !!interactive);

      // Detect dark/blue sections for color inversion
      const darkSection = target.closest('.section--dark, .section--blue');
      dot!.classList.toggle('cursor-dot--invert', !!darkSection);
    }

    function onClick(e: MouseEvent) {
      const ripple = document.createElement('div');
      ripple.className = 'cursor-ripple';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mousedown', onClick);
    raf = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mousedown', onClick);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={dotRef} className="cursor-dot" />;
}
