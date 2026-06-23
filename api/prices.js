const clientPromise = require('../lib/mongodb');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'avoindia-secret-key-change-in-production';

const DEFAULT_PRICES = [
  { variety: 'Hass Avocado', slug: 'hass', price: 180, unit: 'kg', change: 2.3, prevPrice: 176, weekPrice: 172, fillPct: 78, badge: 'up' },
  { variety: 'Fuerte Avocado', slug: 'fuerte', price: 145, unit: 'kg', change: 1.1, prevPrice: 143, weekPrice: 140, fillPct: 62, badge: 'up' },
  { variety: 'Ettinger Avocado', slug: 'ettinger', price: 130, unit: 'kg', change: -0.5, prevPrice: 131, weekPrice: 128, fillPct: 55, badge: 'down' },
  { variety: 'Lula Avocado', slug: 'lula', price: 160, unit: 'kg', change: 3.7, prevPrice: 154, weekPrice: 150, fillPct: 68, badge: 'up' },
  { variety: 'Bulk (500 kg+)', slug: 'bulk', price: 110, unit: 'kg', change: 0, prevPrice: 110, weekPrice: 108, fillPct: 45, badge: 'up' },
  { variety: 'Organic Premium', slug: 'organic', price: 220, unit: 'kg', change: 1.8, prevPrice: 216, weekPrice: 210, fillPct: 88, badge: 'up' },
];

function verifyAdmin(req) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return false;
  try {
    const decoded = jwt.verify(auth.split(' ')[1], SECRET);
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const client = await clientPromise;
    const db = client.db('avoindia');
    const col = db.collection('prices');

    if (req.method === 'GET') {
      let prices = await col.find({}).toArray();
      if (!prices || prices.length === 0) {
        // Seed with defaults
        await col.insertMany(DEFAULT_PRICES);
        prices = DEFAULT_PRICES;
      }
      return res.status(200).json(prices);
    }

    if (req.method === 'POST') {
      if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const updates = req.body; // array of price objects
      if (!Array.isArray(updates)) return res.status(400).json({ error: 'Expected array of prices' });

      for (const item of updates) {
        await col.updateOne(
          { slug: item.slug },
          { $set: { ...item, updatedAt: new Date() } },
          { upsert: true }
        );
      }
      return res.status(200).json({ message: 'Prices updated successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};