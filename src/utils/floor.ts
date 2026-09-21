/**
 * Utility functions for Floor formatting & labels
 * Floor 0 is represented as "Ground Floor"
 */

export function getFloorLabel(floor: number): string {
  if (floor === 0) return 'Ground Floor';
  if (floor === 1) return '1st Floor';
  if (floor === 2) return '2nd Floor';
  if (floor === 3) return '3rd Floor';
  return `${floor}th Floor`;
}

export function getFloorShortLabel(floor: number): string {
  if (floor === 0) return 'Ground';
  return `Floor ${floor}`;
}

export function getFloorBadgeLabel(floor: number): string {
  if (floor === 0) return 'Ground (0)';
  return `Floor ${floor}`;
}
