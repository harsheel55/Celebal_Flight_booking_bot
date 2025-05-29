import type { Request, Response } from 'express';
import { googleAuth } from '@/services/authService';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, googleId } = req.body;

    // Validate input
    if (!name || !email || !googleId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Authenticate with Google
    const { user, token } = await googleAuth({
      name,
      email,
      googleId,
    });

    // Return user and token
    return res.status(200).json({ user, token });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to authenticate with Google' 
    });
  }
}
