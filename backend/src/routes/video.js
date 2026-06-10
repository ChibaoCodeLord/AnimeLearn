import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

import {
  countVideoLikeController,
  countVideoViewController,
  createVideoCommentController,
  deleteVideoController,
  deleteVideoCommentController,
  getPublicVideosController,
  getUserVideosController,
  getVideoCommentsController,
  getVideoDetailController,
  getVideoVocabularyController,
  getWatchHistoryController,
  markVideoWatchedController,
  removeVideoLikeController,
  toggleVideoCommentLikeController,
  updateVideoCommentController,
  updateVideoController,
  analyzeVideoController,
  translateWordController,
  saveWordController,
  saveVideoController,
  convertFuriganaController
} from '../controllers/videoController.js';

const router = express.Router();

router.post('/analyze', authMiddleware, analyzeVideoController);
router.post('/translate-word', translateWordController);
router.post('/save-word', authMiddleware, saveWordController);
router.post('/save', authMiddleware, saveVideoController);
router.get('/detail/:id', authMiddleware, getVideoDetailController);
router.post('/view/:id', countVideoViewController);
router.post('/like/:id', authMiddleware, countVideoLikeController);
router.post('/unlike/:id', authMiddleware, removeVideoLikeController);
router.get('/watched', authMiddleware, getWatchHistoryController);
router.post('/watched/:id', authMiddleware, markVideoWatchedController);
router.get('/:id/comments', authMiddleware, getVideoCommentsController);
router.post('/:id/comments', authMiddleware, createVideoCommentController);
router.post('/comments/:commentId/like', authMiddleware, toggleVideoCommentLikeController);
router.patch('/comments/:commentId', authMiddleware, updateVideoCommentController);
router.delete('/comments/:commentId', authMiddleware, deleteVideoCommentController);
router.get('/user/my-videos', authMiddleware, getUserVideosController);
router.put('/update/:id', authMiddleware, updateVideoController);
router.delete('/delete/:id', authMiddleware, deleteVideoController);
router.get('/vocabulary/:id', getVideoVocabularyController);
router.get('/public-videos', getPublicVideosController);
router.post('/furigana-line', convertFuriganaController);

export default router;
