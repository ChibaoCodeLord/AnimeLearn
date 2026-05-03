import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getVocabulary, updateVocabulary, deleteVocabulary } from '../controllers/vocabularyController.js';

const router = express.Router();

router.get('/', authMiddleware, getVocabulary);
router.patch('/:id', authMiddleware, updateVocabulary);
router.delete('/:id', authMiddleware, deleteVocabulary);


export default router;