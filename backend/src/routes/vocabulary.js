import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getVocabulary, updateVocabulary } from '../controllers/vocabularyController.js';

const router = express.Router();

router.get('/', authMiddleware, getVocabulary);
router.patch('/:id', authMiddleware, updateVocabulary);

export default router;