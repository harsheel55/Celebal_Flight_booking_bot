import type { Request, Response } from 'express';
import { loginUser } from '@/services/authService';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Login user
    const { user, token } = await loginUser(email, password);

    // Return user and token
    return res.status(200).json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(401).json({ 
      message: error instanceof Error ? error.message : 'Invalid credentials' 
    });
  }
}
