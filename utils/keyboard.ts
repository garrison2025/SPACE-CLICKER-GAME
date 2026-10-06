export const isInteractiveKeyboardTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest(
      'input, textarea, select, button, a[href], [contenteditable="true"], [role="button"], [role="link"], [role="menuitem"], [role="option"], [role="switch"], [role="tab"]'
    )
  );
};
