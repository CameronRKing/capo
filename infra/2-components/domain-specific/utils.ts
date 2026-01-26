export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const humanizeKey = (key: string): string => {
  // Handles camelCase, PascalCase, snake_case, kebab-case, and mixed digits.
  // Examples:
  //   currentQuarterKey -> Current Quarter Key
  //   current_quarter_key -> Current Quarter Key
  //   current-quarter2Key -> Current Quarter 2 Key
  const spaced = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1 $2')
    .replace(/(\d+)([a-zA-Z]+)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  if (!spaced) return '';

  return spaced
    .split(' ')
    .filter(Boolean)
    .map(capitalize)
    .join(' ');
}