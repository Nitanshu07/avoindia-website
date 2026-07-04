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
    const col = db.collection('comments');

    // GET /api/comments?slug=X       → public, comments for a post
    // GET /api/comments?all=1        → admin only, all comments
    if (req.method === 'GET') {
      const { slug, all } = req.query;
      if (all === '1') {
        if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
        const comments = await col.find({}).sort({ ts: -1 }).toArray();
        return res.status(200).json(comments);
      }
      if (slug) {
        const comments = await col.find({ slug }).sort({ ts: 1 }).toArray();
        return res.status(200).json(comments);
      }
      return res.status(400).json({ error: 'Provide slug or all=1' });
    }

    // POST /api/comments  { slug, name, email, text }
    if (req.method === 'POST') {
      const { slug, name, text, email } = req.body || {};
      if (!slug || !text) return res.status(400).json({ error: 'slug and text required' });
      const comment = {
        slug,
        name: (name || 'Anonymous').slice(0, 80),
        email: (email || '').slice(0, 120),
        text: text.trim().slice(0, 1000),
        ts: Date.now(),
        createdAt: new Date(),
      };
      await col.insertOne(comment);
      // Increment comment count on the post document
      const postsCol = db.collection('posts');
      await postsCol.updateOne({ slug }, { $inc: { comments: 1 } });
      return res.status(201).json({ message: 'Comment added', comment });
    }

    // DELETE /api/comments?id=X  (admin)
    if (req.method === 'DELETE') {
      if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.query;
      const { ObjectId } = require('mongodb');
      try {
        await col.deleteOne({ _id: new ObjectId(id) });
        return res.status(200).json({ message: 'Deleted' });
      } catch {
        return res.status(400).json({ error: 'Invalid id' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Comments API error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};
