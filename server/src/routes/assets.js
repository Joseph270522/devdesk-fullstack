import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/pool.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name AS assigned_name FROM assets a
       LEFT JOIN users u ON u.id=a.assigned_to ORDER BY a.created_at DESC LIMIT 300`
    );
    res.json({ assets: result.rows });
  } catch (err) { next(err); }
});

router.post('/', allowRoles('admin','technician'),
  body('asset_tag').trim().isLength({ min: 2, max: 80 }),
  body('name').trim().isLength({ min: 2, max: 160 }),
  body('category').trim().isLength({ min: 2, max: 80 }),
  body('condition').optional().isIn(['Good','Needs Repair','Retired']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid asset data.', errors: errors.array() });
      const { asset_tag, name, category, serial_number = null, condition = 'Good', notes = null } = req.body;
      const result = await pool.query(
        `INSERT INTO assets (asset_tag,name,category,serial_number,condition,notes)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [asset_tag,name,category,serial_number,condition,notes]
      );
      res.status(201).json({ asset: result.rows[0] });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ message: 'Asset tag already exists.' });
      next(err);
    }
  }
);

router.patch('/:id', allowRoles('admin','technician'), async (req, res, next) => {
  try {
    const { name, category, serial_number, condition, notes } = req.body;
    if (condition && !['Good','Needs Repair','Retired'].includes(condition)) return res.status(400).json({ message: 'Invalid asset condition.' });
    const result = await pool.query(
      `UPDATE assets SET name=COALESCE($1,name), category=COALESCE($2,category),
       serial_number=COALESCE($3,serial_number), condition=COALESCE($4,condition),
       notes=COALESCE($5,notes) WHERE id=$6 RETURNING *`,
      [name ?? null, category ?? null, serial_number ?? null, condition ?? null, notes ?? null, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Asset not found.' });
    res.json({ asset: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id', allowRoles('admin'), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM assets WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Asset not found.' });
    res.status(204).end();
  } catch (err) { next(err); }
});
export default router;
