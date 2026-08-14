/**
 * Global Access Control & Authentication Layer
 *
 * Passcode Gate Configuration
 * Setting ACCESS_CONTROL_ENABLED to false will disable the passcode gate.
 */

export const ACCESS_CONTROL_ENABLED = true;

// Backwards compatibility alias
export const ENABLE_AUTH = ACCESS_CONTROL_ENABLED;

// Private Access Passcode
export const ACCESS_PASSCODE = '9736648956';

// Storage session key for persisting unlocked session for the current browser session
const SESSION_STORAGE_KEY = 'listing_os_session_unlocked_v3';

// Clear any stale legacy localStorage tokens on load so old sessions don't bypass the gate
try {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('listing_os_private_access_session');
    localStorage.removeItem('listing_os_admin_session');
    localStorage.removeItem('admin_authenticated');
  }
} catch {
  // Ignore storage errors
}

/**
 * Check if the current browser session has been unlocked with the valid passcode.
 */
export function isAccessAuthenticated(): boolean {
  if (!ACCESS_CONTROL_ENABLED) {
    return true; // Bypass lock when access control is disabled
  }

  try {
    const sessionVal = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return sessionVal === 'true';
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
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      window.dispatchEvent(new Event('auth_state_changed'));
    } catch {
      // Storage fallback
    }
    return true;
  }

  return false;
}

/**
 * Lock down the application and clear stored session.
 */
export function logoutAccess(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('listing_os_private_access_session');
    localStorage.removeItem('listing_os_admin_session');
    localStorage.removeItem('admin_authenticated');
    window.dispatchEvent(new Event('auth_state_changed'));
  } catch {
    // Storage fallback
  }
}

// Compatibility aliases
export const isAdminAuthenticated = isAccessAuthenticated;
export const loginAdmin = verifyAndLoginPasscode;
export const logoutAdmin = logoutAccess;
