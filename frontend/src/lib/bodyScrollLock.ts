let lockCount = 0;
let savedScrollY = 0;

function getScrollbarGap(): number {
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

export function lockBodyScroll(): void {
  if (typeof document === 'undefined') return;

  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    const scrollbarGap = getScrollbarGap();

    document.documentElement.classList.add('app-scroll-locked');
    document.documentElement.style.setProperty(
      '--app-scroll-lock-top',
      `-${savedScrollY}px`,
    );
    document.documentElement.style.setProperty(
      '--app-scroll-lock-gap',
      `${scrollbarGap}px`,
    );
  }

  lockCount += 1;
}

export function unlockBodyScroll(): void {
  if (typeof document === 'undefined' || lockCount === 0) return;

  lockCount -= 1;
  if (lockCount > 0) return;

  document.documentElement.classList.remove('app-scroll-locked');
  document.documentElement.style.removeProperty('--app-scroll-lock-top');
  document.documentElement.style.removeProperty('--app-scroll-lock-gap');
  window.scrollTo(0, savedScrollY);
}
