import { useEffect, useRef } from 'react';

const INTERACTIVE =
  'button, a, [role="button"], .tc, .meal-card, .category-card, .nav-arrow, .backlog-tab, label, .toggle, .tc-check, select';

const TEXT_INPUT = 'input, textarea';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;

    let mouseX = 0;
    let mouseY = 0;
    let dotX = 0;
    let dotY = 0;
    let raf: number;
    let clickTimeout: ReturnType<typeof setTimeout> | null = null;

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

      // Text input → caret mode
      const isTextInput = target.closest(TEXT_INPUT);
      // Interactive element → grow mode
      const isInteractive = !isTextInput && target.closest(INTERACTIVE);
      // Dark section → invert colors
      const isDark = target.closest('.section--dark, .section--blue');

      dot!.classList.toggle('cursor-dot--text', !!isTextInput);
      dot!.classList.toggle('cursor-dot--interactive', !!isInteractive);
      dot!.classList.toggle('cursor-dot--invert', !!isDark);
    }

    function onDown() {
      dot!.classList.add('cursor-dot--click');
      if (clickTimeout) clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => {
        dot!.classList.remove('cursor-dot--click');
      }, 150);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mousedown', onDown);
    raf = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mousedown', onDown);
      cancelAnimationFrame(raf);
      if (clickTimeout) clearTimeout(clickTimeout);
    };
  }, []);

  return <div ref={dotRef} className="cursor-dot" />;
}
