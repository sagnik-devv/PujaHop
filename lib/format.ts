import { CrowdLevel } from './types';

/**
 * Formats distance in meters or kilometers.
 * e.g. 450m or 2.4 km
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Formats walking/travel duration in human readable format.
 * e.g. "8 mins" or "1 hr 15 mins"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} mins`;
  }
  const hrs = Math.floor(minutes / 60);
  const remainingMins = Math.round(minutes % 60);
  if (remainingMins === 0) {
    return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  }
  return `${hrs} hr ${remainingMins} min${remainingMins > 1 ? 's' : ''}`;
}

/**
 * Formats currency in Indian Rupees.
 */
export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount)}`;
}

/**
 * Returns color & description for a crowd level.
 */
export function getCrowdBadgeStyle(level: CrowdLevel): {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  dotColor: string;
} {
  switch (level) {
    case 'Low':
      return {
        color: '#246b3e',
        bgColor: '#eaf6ee',
        borderColor: '#b9e3c6',
        label: 'Low Crowd',
        dotColor: '#2F7D4A',
      };
    case 'Moderate':
      return {
        color: '#9c6508',
        bgColor: '#fdf6e7',
        borderColor: '#f4d89a',
        label: 'Moderate Rush',
        dotColor: '#D99A25',
      };
    case 'High':
      return {
        color: '#96231a',
        bgColor: '#fdf0ee',
        borderColor: '#f5beb9',
        label: 'Heavy Crowd',
        dotColor: '#B3261E',
      };
    case 'Surge':
    case 'Extremely High':
      return {
        color: '#630e0a',
        bgColor: '#f9dedb',
        borderColor: '#e8948d',
        label: 'Peak Surge',
        dotColor: '#7F1712',
      };
    case 'Insane':
      return {
        color: '#96231a',
        bgColor: '#ffebee',
        borderColor: '#ffcdd2',
        label: '🔥 Insane Footfall',
        dotColor: '#b71c1c',
      };
    default:
      return {
        color: '#554e48',
        bgColor: '#f1ede7',
        borderColor: '#dbd4cb',
        label: 'Estimated Rush',
        dotColor: '#756D65',
      };
  }
}
