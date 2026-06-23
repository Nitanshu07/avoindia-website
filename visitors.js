const clientPromise = require('../lib/mongodb');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'avoindia-secret-key-change-in-production';

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
    const col = db.collection('visitors');

    // POST: register a new visitor/lead
    if (req.method === 'POST') {
      const { name, email, phone, interest, city, source } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      // Check for duplicate email
      const existing = await col.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(200).json({ message: 'Already registered', duplicate: true });
      }

      const visitor = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : '',
        interest: interest || 'General Enquiry',
        city: city ? city.trim() : '',
        source: source || 'website',
        registeredAt: new Date(),
        contacted: false,
        notes: '',
      };

      await col.insertOne(visitor);
      return res.status(201).json({ message: 'Registered successfully', visitor });
    }

    // GET: list visitors (admin only)
    if (req.method === 'GET') {
      if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

      const { page = 1, limit = 50, interest, contacted } = req.query;
      const filter = {};
      if (interest) filter.interest = interest;
      if (contacted !== undefined) filter.contacted = contacted === 'true';

      const total = await col.countDocuments(filter);
      const visitors = await col
        .find(filter)
        .sort({ registeredAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .toArray();

      return res.status(200).json({ visitors, total, page: parseInt(page) });
    }

    // PUT: mark visitor as contacted / add notes (admin only)
    if (req.method === 'PUT') {
      if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { email, contacted, notes } = req.body;
      await col.updateOne(
        { email: email.toLowerCase().trim() },
        { $set: { contacted, notes, updatedAt: new Date() } }
      );
      return res.status(200).json({ message: 'Updated' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};
