/**
 * Combines multiple class names into a single string, filtering out falsy values
 * @param classes - Array of class names, objects, or falsy values
 * @returns Combined class names string
 */
export function classNames(
  ...classes: (string | undefined | null | false | { [key: string]: boolean })[]
): string {
  return classes
    .map(cls => {
      if (!cls) return '';
      if (typeof cls === 'string') return cls;
      return Object.entries(cls)
        .filter(([_, value]) => value)
        .map(([key]) => key)
        .join(' ');
    })
    .filter(Boolean)
    .join(' ');
}
