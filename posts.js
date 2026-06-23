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

const DEFAULT_POSTS = [
  {
    slug: 'avocado-prices-q3-2024',
    title: 'Avocado prices expected to rise 8–12% in Q3 2024 — here\'s why',
    excerpt: 'Global avocado supply from Mexico is tightening due to water restrictions in Michoacán state. This seasonal constraint, combined with rising Indian demand in metro cities, is pushing wholesale prices upward.',
    content: 'Full article content here...',
    category: 'Market',
    author: 'Anil Kumar',
    authorRole: 'Head of Procurement',
    authorInitials: 'AK',
    authorColor: '#2d6a4f',
    likes: 42,
    comments: 12,
    published: true,
    createdAt: new Date('2024-06-20'),
  },
  {
    slug: 'cold-chain-journey',
    title: 'How we maintain freshness: Our cold-chain journey from port to plate',
    excerpt: 'Avocados are climacteric fruits — they ripen after harvest. Managing this ripening window across India\'s diverse climates is our biggest challenge and greatest expertise.',
    content: 'Full article content here...',
    category: 'Agriculture',
    author: 'Priya Rao',
    authorRole: 'Distribution Manager',
    authorInitials: 'PR',
    authorColor: '#f4a261',
    likes: 87,
    comments: 24,
    published: true,
    createdAt: new Date('2024-06-17'),
  },
];

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const client = await clientPromise;
    const db = client.db('avoindia');
    const col = db.collection('posts');

    if (req.method === 'GET') {
      let posts = await col.find({ published: true }).sort({ createdAt: -1 }).toArray();
      if (!posts || posts.length === 0) {
        await col.insertMany(DEFAULT_POSTS);
        posts = DEFAULT_POSTS;
      }
      return res.status(200).json(posts);
    }

    if (req.method === 'POST') {
      if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const post = {
        ...req.body,
        slug: req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60),
        likes: 0,
        comments: 0,
        published: req.body.published !== false,
        createdAt: new Date(),
      };
      await col.insertOne(post);
      return res.status(201).json({ message: 'Post created', post });
    }

    if (req.method === 'PUT') {
      if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { slug, ...updates } = req.body;
      await col.updateOne({ slug }, { $set: { ...updates, updatedAt: new Date() } });
      return res.status(200).json({ message: 'Post updated' });
    }

    if (req.method === 'DELETE') {
      if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { slug } = req.query;
      await col.deleteOne({ slug });
      return res.status(200).json({ message: 'Post deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};
