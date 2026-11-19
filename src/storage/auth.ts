const AUTH_STORAGE_KEY = 'clarityos_auth_v1';
const SESSION_UNLOCKED_KEY = 'clarityos_session_unlocked';

export interface StoredAuthData {
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getStoredAuth(): StoredAuthData | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuthData;
  } catch {
    return null;
  }
}

export function isSessionUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_UNLOCKED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markSessionUnlocked(): void {
  try {
    sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
  } catch {
    // ignore
  }
}

export function lockSession(): void {
  try {
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
  } catch {
    // ignore
  }
}

export async function setupCredentials(
  username: string,
  passwordPlain: string
): Promise<void> {
  const salt = generateSalt();
  const passwordHash = await sha256(passwordPlain + salt);
  const authData: StoredAuthData = {
    username: username.trim(),
    passwordHash,
    salt,
    createdAt: Date.now(),
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  markSessionUnlocked();
}

export async function verifyCredentials(
  usernameInput: string,
  passwordInput: string
): Promise<boolean> {
  const stored = getStoredAuth();
  if (!stored) return false;

  const trimmedInput = usernameInput.trim().toLowerCase();
  const storedUsername = stored.username.trim().toLowerCase();

  if (trimmedInput !== storedUsername) {
    return false;
  }

  const hash = await sha256(passwordInput + stored.salt);
  return hash === stored.passwordHash;
}

export function disableAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
}
