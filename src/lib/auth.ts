/**
 * Global Access Control & Authentication Layer
 *
 * Passcode Gate Configuration
 * To disable the lock in the future, toggle ACCESS_CONTROL_ENABLED to false.
 */

export const ACCESS_CONTROL_ENABLED = true;

// Backwards compatibility alias
export const ENABLE_AUTH = ACCESS_CONTROL_ENABLED;

// Private Access Passcode (Server/Client Verified)
export const ACCESS_PASSCODE = '9736648956';

// Storage session key for persisting unlocked session
const AUTH_SESSION_KEY = 'listing_os_private_access_session';

/**
 * Check if the current browser session has been unlocked with the valid passcode.
 */
export function isAccessAuthenticated(): boolean {
  if (!ACCESS_CONTROL_ENABLED) {
    return true; // Bypass lock when access control is disabled
  }

  try {
    const sessionVal = sessionStorage.getItem(AUTH_SESSION_KEY) || localStorage.getItem(AUTH_SESSION_KEY);
    return sessionVal === 'unlocked_authenticated';
  } catch {
    return false;
  }
}

/**
 * Attempt to unlock the platform with the provided passcode.
 * Returns true if valid, false otherwise.
 */
export function verifyAndLoginPasscode(inputPasscode: string): boolean {
  if (!ACCESS_CONTROL_ENABLED) {
    return true;
  }

  const cleaned = (inputPasscode || '').trim();
  if (cleaned === ACCESS_PASSCODE) {
    try {
      sessionStorage.setItem(AUTH_SESSION_KEY, 'unlocked_authenticated');
      localStorage.setItem(AUTH_SESSION_KEY, 'unlocked_authenticated');
      window.dispatchEvent(new Event('auth_state_changed'));
    } catch (e) {
      // Storage fallback
    }
    return true;
  }

  return false;
}

/**
 * Lock down the application and clear stored credentials.
 */
export function logoutAccess(): void {
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    window.dispatchEvent(new Event('auth_state_changed'));
  } catch (e) {
    // Storage fallback
  }
}

// Aliases for compatibility across existing files
export const isAdminAuthenticated = isAccessAuthenticated;
export const loginAdmin = verifyAndLoginPasscode;
export const logoutAdmin = logoutAccess;
