import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);
router.get('/summary', async (_req, res, next) => {
  try {
    const [tickets, assets, recent] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status='Open')::int AS open,
        COUNT(*) FILTER (WHERE status='In Progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE status='Resolved')::int AS resolved
        FROM tickets`),
      pool.query(`SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE condition='Needs Repair')::int AS needs_repair
        FROM assets`),
      pool.query(`SELECT id,title,status,priority,created_at FROM tickets ORDER BY created_at DESC LIMIT 5`)
    ]);
    res.json({ tickets: tickets.rows[0], assets: assets.rows[0], recent: recent.rows });
  } catch (err) { next(err); }
});
export default router;
