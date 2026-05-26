import express from 'express';
import { auth } from '../middleware/auth.js';
import * as calendarSyncController from '../controllers/calendarSyncController.js';

const router = express.Router();

router.get('/status', auth, calendarSyncController.getStatus);
router.get('/:provider/auth-url', auth, calendarSyncController.getAuthUrl);
router.get('/:provider/callback', calendarSyncController.handleCallback);
router.get('/:provider/events', auth, calendarSyncController.importEvents);
router.delete('/:provider/disconnect', auth, calendarSyncController.disconnect);

export default router;
