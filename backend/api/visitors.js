const clientPromise = require('../lib/mongodb');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

async function sendEnquiryEmail({ name, email, phone, interest, city, message, source }) {
  if (source !== 'contact_form') return;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) return;
  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: gmailPass } });
  await transporter.sendMail({
    from: '"AvoIndia Website" <' + gmailUser + '>',
    to: 'singhasheesh7@gmail.com',
    subject: 'New Enquiry from ' + name + ' — AvoIndia',
    html: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;"><div style="background:#2d6a4f;padding:24px;text-align:center;"><h1 style="color:white;margin:0;font-size:1.4rem;">New Website Enquiry</h1></div><div style="padding:28px;"><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:8px 0;color:#6b7280;width:130px;">Name</td><td style="padding:8px 0;font-weight:600;">' + name + '</td></tr><tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;"><a href="mailto:' + email + '" style="color:#2d6a4f;">' + email + '</a></td></tr><tr><td style="padding:8px 0;color:#6b7280;">Phone</td><td style="padding:8px 0;">' + (phone || '-') + '</td></tr><tr><td style="padding:8px 0;color:#6b7280;">Business</td><td style="padding:8px 0;">' + (city || '-') + '</td></tr><tr><td style="padding:8px 0;color:#6b7280;">Interest</td><td style="padding:8px 0;"><span style="background:#d8f3dc;color:#2d6a4f;padding:3px 10px;border-radius:20px;">' + (interest || '-') + '</span></td></tr></table>' + (message ? '<div style="margin-top:20px;padding:16px;background:#f9fafb;border-radius:8px;border-left:3px solid #2d6a4f;"><p style="margin:0;color:#374151;">' + message + '</p></div>' : '') + '<div style="margin-top:24px;text-align:center;"><a href="mailto:' + email + '" style="background:#2d6a4f;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Reply to ' + name + '</a></div></div><div style="padding:16px;background:#f9fafb;text-align:center;color:#9ca3af;font-size:0.78rem;">AvoIndia Website</div></div>',
  });
}

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
    const col = db.collection('visitors');

    if (req.method === 'POST') {
      const { name, email, phone, interest, city, source, message } = req.body;
      if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
      const existing = await col.findOne({ email: email.toLowerCase().trim() });
      if (existing && source !== 'contact_form') return res.status(200).json({ message: 'Already registered', duplicate: true });
      const visitor = { name: name.trim(), email: email.toLowerCase().trim(), phone: phone ? phone.trim() : '', interest: interest || 'General Enquiry', city: city ? city.trim() : '', source: source || 'website', message: message ? message.trim() : '', registeredAt: new Date(), contacted: false, notes: '' };
      await col.insertOne(visitor);
      sendEnquiryEmail({ name: visitor.name, email: visitor.email, phone: visitor.phone, interest: visitor.interest, city: visitor.city, message: visitor.message, source }).catch(err => console.error('Email failed:', err));
      return res.status(201).json({ message: 'Registered successfully', visitor });
    }

    if (req.method === 'GET') {
      if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { page = 1, limit = 50, interest, contacted } = req.query;
      const filter = {};
      if (interest) filter.interest = interest;
      if (contacted !== undefined) filter.contacted = contacted === 'true';
      const total = await col.countDocuments(filter);
      const visitors = await col.find(filter).sort({ registeredAt: -1 }).skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit)).toArray();
      return res.status(200).json({ visitors, total, page: parseInt(page) });
    }

    if (req.method === 'PUT') {
      if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const { email, contacted, notes } = req.body;
      await col.updateOne({ email: email.toLowerCase().trim() }, { $set: { contacted, notes, updatedAt: new Date() } });
      return res.status(200).json({ message: 'Updated' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};
