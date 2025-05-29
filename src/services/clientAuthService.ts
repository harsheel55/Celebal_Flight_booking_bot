// Client-side authentication service
// This service communicates with our Express API endpoints

import { User } from './authService';

// Register a new user
export async function registerUser(userData: {
  name: string;
  email: string;
  password: string;
  preferredLanguage?: string;
}): Promise<{ user: Omit<User, 'password'>; token: string }> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to register');
  }

  return response.json();
}

// Login user
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: Omit<User, 'password'>; token: string }> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to login');
  }

  return response.json();
}

// Google login/signup
export async function googleAuth(googleData: {
  name: string;
  email: string;
  googleId: string;
}): Promise<{ user: Omit<User, 'password'>; token: string }> {
  const response = await fetch('/api/auth/google', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(googleData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to authenticate with Google');
  }

  return response.json();
}

// Get user by ID
export async function getUserById(
  userId: string,
  token: string
): Promise<Omit<User, 'password'> | null> {
  const response = await fetch(`/api/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.json();
    throw new Error(error.message || 'Failed to get user');
  }

  return response.json();
}

// Update user's preferred language
export async function updateUserLanguage(
  userId: string,
  language: string,
  token: string
): Promise<Omit<User, 'password'>> {
  const response = await fetch(`/api/users/${userId}/language`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ language }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update language');
  }

  return response.json();
}

// Verify JWT token
export function parseJwt(token: string): { id: string; email: string; exp: number } {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );

  return JSON.parse(jsonPayload);
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = parseJwt(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}
