import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const trapDialogFocus = (event: ReactKeyboardEvent<HTMLElement>) => {
  if (event.key !== 'Tab') return;

  const root = event.currentTarget;
  const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => element.getAttribute('aria-hidden') !== 'true');

  if (focusable.length === 0) {
    event.preventDefault();
    root.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey) {
    if (active === root || active === first || !(active instanceof Node) || !root.contains(active)) {
      event.preventDefault();
      last.focus();
    }
    return;
  }

  if (active === root || active === last || !(active instanceof Node) || !root.contains(active)) {
    event.preventDefault();
    first.focus();
  }
};
