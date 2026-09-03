'use client';

const USER_ID_KEY = 'pujo_hop_user_id';
const USER_NAME_KEY = 'pujo_hop_display_name';

/**
 * Returns a persistent unique UUID for the user.
 * If an authenticated user ID is passed, it is preferred.
 * Otherwise, retrieves or generates a persistent guest UUID in localStorage.
 */
export function getOrSetHopUserId(authUserId?: string | null): string {
  if (authUserId) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_ID_KEY, authUserId);
    }
    return authUserId;
  }

  if (typeof window === 'undefined') {
    return '00000000-0000-0000-0000-000000000000';
  }

  let storedId = localStorage.getItem(USER_ID_KEY);
  if (!storedId) {
    storedId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, storedId);
  }

  return storedId;
}

/**
 * Gets the saved display name for Hop Rooms from localStorage.
 */
export function getHopDisplayName(authUserName?: string | null): string {
  if (authUserName) return authUserName;
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(USER_NAME_KEY) || '';
}

/**
 * Saves the display name for Hop Rooms in localStorage.
 */
export function setHopDisplayName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_NAME_KEY, name.trim());
}
