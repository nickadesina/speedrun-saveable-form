// Vercel Serverless Function for Authentication
// Password is stored in environment variable, not in code!

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get password from environment variable (set in Vercel dashboard)
  const CORRECT_PASSWORD = process.env.APP_PASSWORD || 'speedrun2025';
  const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key';

  if (req.method === 'POST') {
    const { password, action } = req.body;

    if (action === 'login') {
      if (password === CORRECT_PASSWORD) {
        // Create a simple token (in production, use JWT)
        const token = Buffer.from(`${Date.now()}:${SESSION_SECRET}`).toString('base64');
        
        res.status(200).json({ 
          success: true, 
          token: token,
          message: 'Authentication successful' 
        });
      } else {
        res.status(401).json({ 
          success: false, 
          message: 'Invalid password' 
        });
      }
    } else if (action === 'verify') {
      // Verify token (simple check for demo)
      const { token } = req.body;
      if (token) {
        try {
          const decoded = Buffer.from(token, 'base64').toString();
          const [timestamp] = decoded.split(':');
          const age = Date.now() - parseInt(timestamp);
          
          // Token expires after 24 hours
          if (age < 24 * 60 * 60 * 1000) {
            res.status(200).json({ valid: true });
          } else {
            res.status(401).json({ valid: false, message: 'Token expired' });
          }
        } catch (e) {
          res.status(401).json({ valid: false, message: 'Invalid token' });
        }
      } else {
        res.status(401).json({ valid: false, message: 'No token provided' });
      }
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}