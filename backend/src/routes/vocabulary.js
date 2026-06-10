import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createFolder,
  deleteFolder,
  deleteVocabulary,
  getDiscoverKanji,
  getFolders,
  getPopularDictionary,
  getVocabulary,
  saveLearningItem,
  updateFolder,
  updateVocabulary
} from '../controllers/vocabularyController.js';

const router = express.Router();

router.get('/folders', authMiddleware, getFolders);
router.post('/folders', authMiddleware, createFolder);
router.patch('/folders/:id', authMiddleware, updateFolder);
router.delete('/folders/:id', authMiddleware, deleteFolder);

router.get('/discover/dictionary', authMiddleware, getPopularDictionary);
router.get('/discover/kanji', authMiddleware, getDiscoverKanji);

router.get('/', authMiddleware, getVocabulary);
router.post('/save', authMiddleware, saveLearningItem);
router.patch('/:id', authMiddleware, updateVocabulary);
router.delete('/:id', authMiddleware, deleteVocabulary);

export default router;
