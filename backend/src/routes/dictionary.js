import express from 'express';
import { translateWords, searchDictionary } from '../controllers/dictionaryController.js'; // Nhớ phải có đuôi .js

const router = express.Router();

// API: POST /api/dictionary/lookup
router.post('/lookup', translateWords);

router.get('/search', searchDictionary);

// Dòng này sẽ giải quyết cái lỗi "does not provide an export named 'default'"
export default router;