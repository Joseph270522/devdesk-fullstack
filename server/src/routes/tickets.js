import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { pool } from '../db/pool.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { search = '', status = '', priority = '' } = req.query;
    const values = [`%${search}%`, status, priority];
    const result = await pool.query(
      `SELECT t.*, requester.name AS requester_name, assignee.name AS assignee_name
       FROM tickets t JOIN users requester ON requester.id=t.requester_id
       LEFT JOIN users assignee ON assignee.id=t.assignee_id
       WHERE (t.title ILIKE $1 OR t.description ILIKE $1)
       AND ($2 = '' OR t.status = $2) AND ($3 = '' OR t.priority = $3)
       ORDER BY t.created_at DESC LIMIT 200`,
      values
    );
    res.json({ tickets: result.rows });
  } catch (err) { next(err); }
});

router.post('/',
  body('title').trim().isLength({ min: 3, max: 180 }),
  body('description').trim().isLength({ min: 5 }),
  body('category').optional().trim().isLength({ max: 60 }),
  body('priority').optional().isIn(['Low','Medium','High','Critical']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid ticket data.', errors: errors.array() });
      const { title, description, category = 'Hardware', priority = 'Medium' } = req.body;
      const result = await pool.query(
        `INSERT INTO tickets (title, description, category, priority, requester_id)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [title, description, category, priority, req.user.id]
      );
      res.status(201).json({ ticket: result.rows[0] });
    } catch (err) { next(err); }
  }
);

router.get('/:id', param('id').isInt({ min: 1 }), async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT t.*, requester.name AS requester_name, assignee.name AS assignee_name
       FROM tickets t JOIN users requester ON requester.id=t.requester_id
       LEFT JOIN users assignee ON assignee.id=t.assignee_id WHERE t.id=$1`,
      [req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Ticket not found.' });
    res.json({ ticket: result.rows[0] });
  } catch (err) { next(err); }
});

router.patch('/:id',
  allowRoles('admin','technician'),
  body('status').optional().isIn(['Open','In Progress','Resolved','Closed']),
  body('priority').optional().isIn(['Low','Medium','High','Critical']),
  body('assignee_id').optional({ nullable: true }).isInt({ min: 1 }),
  async (req, res, next) => {
    try {
      const { status, priority, assignee_id } = req.body;
      if (!status && !priority && assignee_id === undefined) return res.status(400).json({ message: 'Provide a field to update.' });
      const current = await pool.query('SELECT id FROM tickets WHERE id=$1', [req.params.id]);
      if (!current.rowCount) return res.status(404).json({ message: 'Ticket not found.' });
      const result = await pool.query(
        `UPDATE tickets SET
          status=COALESCE($1,status),
          priority=COALESCE($2,priority),
          assignee_id=CASE WHEN $3::boolean THEN $4::bigint ELSE assignee_id END,
          updated_at=NOW()
         WHERE id=$5 RETURNING *`,
        [status || null, priority || null, assignee_id !== undefined, assignee_id ?? null, req.params.id]
      );
      res.json({ ticket: result.rows[0] });
    } catch (err) { next(err); }
  }
);

router.delete('/:id', allowRoles('admin'), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM tickets WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Ticket not found.' });
    res.status(204).end();
  } catch (err) { next(err); }
});
export default router;
