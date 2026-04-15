/**
 * Resolve a companion target name to viewport coordinates.
 *
 * Target names match `data-companion-target` attributes in the DOM:
 *   column:<name>, result:<index>, run-button, analysis-menu, etc.
 *
 * Returns center coordinates of the element, or null if not found/off-screen.
 */
export function resolveTarget(target: string): { x: number; y: number } | null {
  const el = document.querySelector(`[data-companion-target="${target}"]`);
  if (!el) return null;

  const rect = el.getBoundingClientRect();

  // Check if the element is visible in the viewport
  if (
    rect.width === 0 ||
    rect.height === 0 ||
    rect.bottom < 0 ||
    rect.top > window.innerHeight ||
    rect.right < 0 ||
    rect.left > window.innerWidth
  ) {
    // Try to scroll it into view first
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Re-check after scroll (caller should retry after a delay)
    return null;
  }

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * Highlight a companion target element with a brief glow effect.
 */
export function highlightTarget(target: string): void {
  const el = document.querySelector(`[data-companion-target="${target}"]`);
  if (!el) return;
  el.classList.add("companion-point-highlight");
  setTimeout(() => el.classList.remove("companion-point-highlight"), 1500);
}
