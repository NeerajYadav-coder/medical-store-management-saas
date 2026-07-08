import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { ownerOnly } from '../middleware/role.middleware.js';
import { auditAction } from '../middleware/audit.middleware.js';
import {
  getSuggestions,
  getSuggestionsSummary,
  actionSuggestion,
  updateSettings
} from '../controllers/reorder.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', getSuggestions);
router.get('/summary', getSuggestionsSummary);
router.post('/:id/action', auditAction('ACTION', 'REORDER_SUGGESTION'), actionSuggestion);

// Only owners can change forecast settings
router.post('/admin/forecast-settings', ownerOnly, auditAction('UPDATE', 'FORECAST_SETTINGS'), updateSettings);

export default router;
