/**
 * Admin Authentication Utilities
 *
 * NOTE: Authentication is currently disabled for internal development.
 * To re-enable passkey authentication for production, set ENABLE_AUTH = true
 * or configure process.env.VITE_ENABLE_AUTH = 'true'.
 */

export const ENABLE_AUTH = false;

const AUTH_KEY = 'listing_os_admin_session';

export function loginAdmin(passkey: string): boolean {
  if (!ENABLE_AUTH) return true;

  const validPasskey = import.meta.env.VITE_ADMIN_PASSKEY || 'admin123';
  if (passkey.trim() === validPasskey) {
    sessionStorage.setItem(AUTH_KEY, 'authenticated');
    localStorage.setItem(AUTH_KEY, 'authenticated'); // persistent session
    return true;
  }
  return false;
}

export function isAdminAuthenticated(): boolean {
  if (!ENABLE_AUTH) {
    return true; // Bypass authentication during internal development
  }
  const sessionToken = sessionStorage.getItem(AUTH_KEY) || localStorage.getItem(AUTH_KEY);
  return sessionToken === 'authenticated';
}

export function logoutAdmin(): void {
  sessionStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_KEY);
}

