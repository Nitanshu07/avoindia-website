const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'avoindia-secret-key-change-in-production';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'avoadmin2024';

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = jwt.sign(
    { role: 'admin', iat: Date.now() },
    SECRET,
    { expiresIn: '8h' }
  );

  return res.status(200).json({ token, message: 'Login successful' });
};
