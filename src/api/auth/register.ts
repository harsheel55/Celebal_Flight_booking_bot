import type { Request, Response } from 'express';
import { registerUser } from '@/services/authService';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, password, preferredLanguage } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Register user
    const { user, token } = await registerUser({
      name,
      email,
      password,
      preferredLanguage: preferredLanguage || 'en',
    });

    // Return user and token
    return res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to register user' 
    });
  }
}
