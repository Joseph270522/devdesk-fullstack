import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const issueToken = (user) => jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET, { expiresIn: '12h' });

router.post('/register',
  body('name').trim().isLength({ min: 2, max: 120 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: 'Please check the submitted fields.', errors: errors.array() });
      const { name, email, password } = req.body;
      const passwordHash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3)
         RETURNING id, name, email, role, created_at`,
        [name, email, passwordHash]
      );
      const user = result.rows[0];
      res.status(201).json({ token: issueToken(user), user });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ message: 'An account with this email already exists.' });
      next(err);
    }
  }
);

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: 'Email and password are required.' });
      const { email, password } = req.body;
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ message: 'Email or password is incorrect.' });
      }
      const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
      res.json({ token: issueToken(safeUser), user: safeUser });
    } catch (err) { next(err); }
  }
);

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));
export default router;
