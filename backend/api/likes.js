const clientPromise = require('../lib/mongodb');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'avoindia-secret-key-change-in-production';

function verifyAdmin(req) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return false;
  try {
    const decoded = jwt.verify(auth.split(' ')[1], SECRET);
    return decoded.role === 'admin';
  } catch { return false; }
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const client = await clientPromise;
    const db = client.db('avoindia');

    // GET /api/likes  (admin) -> { postLikes: [{slug, title, likes}], recentLikes: [...] }
    if (req.method === 'GET') {
      if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const likesCol = db.collection('likes');
      const postsCol = db.collection('posts');
      const posts = await postsCol.find({}, { projection: { slug: 1, title: 1, likes: 1 } }).toArray();
      const recentLikes = await likesCol.find({}).sort({ ts: -1 }).limit(50).toArray();
      const postLikes = posts.map(p => ({ slug: p.slug, title: p.title, likes: p.likes || 0 }))
        .sort((a, b) => (b.likes - a.likes));
      return res.status(200).json({ postLikes, recentLikes });
    }

    // POST /api/likes  { slug, name, email } -> record like
    if (req.method === 'POST') {
      const { slug, name, email } = req.body || {};
      if (!slug) return res.status(400).json({ error: 'slug required' });
      const likesCol = db.collection('likes');
      const postsCol = db.collection('posts');
      const like = {
        slug,
        name: (name || 'Anonymous').slice(0, 80),
        email: (email || '').slice(0, 120),
        ts: Date.now(),
        createdAt: new Date(),
      };
      await likesCol.insertOne(like);
      // Increment likes on the post document
      await postsCol.updateOne({ slug }, { $inc: { likes: 1 } });
      return res.status(201).json({ message: 'Like recorded' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Likes API error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};
