import express from 'express';
import multer from 'multer';
import { authMiddleware, restrictTo } from '../middleware/auth.js';
import {
  createExam,
  deleteExam,
  getAdminExam,
  getPublishedExam,
  handleExamImportUpload,
  importAndSaveGroup,
  importPreview,
  listAdminExams,
  listPublishedExams,
  saveExamGroup,
  saveExamSection,
  updateExam,
  updateExamStatus,
  uploadExamMedia,
} from '../controllers/examController.js';

const router = express.Router();

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const documentMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
    ];
    const isAudioFile = file.fieldname === 'audioFile' && file.mimetype.startsWith('audio/');
    const isDocumentFile = ['file', 'documentFile'].includes(file.fieldname) && documentMimeTypes.includes(file.mimetype);

    if (!isAudioFile && !isDocumentFile) {
      return cb(new Error('Chi ho tro tai lieu anh/PDF va audio cho phan nghe'));
    }
    cb(null, true);
  },
});

const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isAudio = file.mimetype.startsWith('audio/');
    const isPdf = file.mimetype === 'application/pdf';
    if (!isImage && !isAudio && !isPdf) {
      return cb(new Error('Chỉ hỗ trợ ảnh, audio hoặc PDF'));
    }
    cb(null, true);
  },
});

router.use(authMiddleware);

router.get('/', listPublishedExams);
router.get('/:id', getPublishedExam);

router.use('/admin', restrictTo('admin'));

router.get('/admin/list', listAdminExams);
router.post('/admin', createExam);
router.post('/admin/import-preview', handleExamImportUpload(importUpload, 'importPreview'), importPreview);
router.post('/admin/upload-media', handleExamImportUpload(mediaUpload), uploadExamMedia);
router.get('/admin/:id', getAdminExam);
router.patch('/admin/:id', updateExam);
router.delete('/admin/:id', deleteExam);
router.patch('/admin/:id/status', updateExamStatus);
router.post('/admin/:id/section', saveExamSection);
router.post('/admin/:id/groups', saveExamGroup);
router.post('/admin/:id/import', handleExamImportUpload(importUpload), importAndSaveGroup);

export default router;
