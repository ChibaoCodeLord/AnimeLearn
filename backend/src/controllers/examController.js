import { Readable } from 'node:stream';
import Exam, { EXAM_SECTION_TYPES, EXAM_STATUSES } from '../models/Exam.js';
import { cloudinaryV2 } from '../config/cloudinary.js';
import { extractExamGroupFromFile, extractExamSectionFromFile } from '../services/examAIService.js';
import {
  buildDefaultSections,
  buildExamListFilter,
  createUniqueExamSlug,
  ensureSections,
  getExamSort,
  normalizeQuestionGroup,
  normalizeQuestionGroups,
  replaceSectionGroupsInExam,
  toExamResponse,
  upsertGroupInExam,
} from '../services/examService.js';

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 12));
  return { page, limit, skip: (page - 1) * limit };
}

function isObjectIdLike(value) {
  return /^[a-f\d]{24}$/i.test(String(value || ''));
}

async function findExamByIdOrSlug(value, filter = {}) {
  const query = isObjectIdLike(value)
    ? { _id: value, ...filter }
    : { slug: String(value || '').toLowerCase(), ...filter };
  return Exam.findOne(query);
}

function sendMulterError(res, error) {
  return res.status(400).json({
    error: error?.message || 'Lỗi upload file',
  });
}

function getUploadedFile(req, fieldNames) {
  if (req.file && fieldNames.includes(req.file.fieldname || 'file')) return req.file;
  if (!req.files) return null;

  for (const fieldName of fieldNames) {
    const value = req.files[fieldName];
    if (Array.isArray(value) && value[0]) return value[0];
  }

  return null;
}

function fileMeta(file) {
  if (!file) return null;
  return {
    name: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };
}

function uploadBufferToCloudinary(file, folder = 'animelearn_exams') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinaryV2.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
}

export function handleExamImportUpload(upload, mode = 'single') {
  return (req, res, next) => {
    const middleware = mode === 'importPreview'
      ? upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'documentFile', maxCount: 1 },
        { name: 'audioFile', maxCount: 1 },
      ])
      : upload.single('file');

    middleware(req, res, error => {
      if (error) return sendMulterError(res, error);
      next();
    });
  };
}

export const listPublishedExams = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = buildExamListFilter({
      search: req.query.search,
      level: req.query.level,
      includeDrafts: false,
    });

    const [total, exams] = await Promise.all([
      Exam.countDocuments(filter),
      Exam.find(filter)
        .sort(getExamSort(req.query.sort))
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      exams: exams.map(toExamResponse),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Exam] listPublishedExams:', error);
    res.status(500).json({ error: 'Lỗi lấy danh sách đề thi' });
  }
};

export const getPublishedExam = async (req, res) => {
  try {
    const exam = await findExamByIdOrSlug(req.params.id, { status: 'published' });
    if (!exam) return res.status(404).json({ error: 'Không tìm thấy đề thi' });
    res.json(toExamResponse(exam));
  } catch (error) {
    console.error('[Exam] getPublishedExam:', error);
    res.status(500).json({ error: 'Lỗi lấy chi tiết đề thi' });
  }
};

export const listAdminExams = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = buildExamListFilter({
      search: req.query.search,
      level: req.query.level,
      status: req.query.status,
      includeDrafts: true,
    });

    const [total, exams] = await Promise.all([
      Exam.countDocuments(filter),
      Exam.find(filter)
        .sort(getExamSort(req.query.sort))
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      exams: exams.map(toExamResponse),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Exam] listAdminExams:', error);
    res.status(500).json({ error: 'Lỗi lấy danh sách đề thi admin' });
  }
};

export const getAdminExam = async (req, res) => {
  try {
    const exam = await findExamByIdOrSlug(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Không tìm thấy đề thi' });
    res.json(toExamResponse(exam));
  } catch (error) {
    console.error('[Exam] getAdminExam:', error);
    res.status(500).json({ error: 'Lỗi lấy chi tiết đề thi admin' });
  }
};

export const createExam = async (req, res) => {
  try {
    const { title, subtitle, level, year, month, source, sections } = req.body;

    if (!title || !level || !year || !month) {
      return res.status(400).json({ error: 'Thiếu title, level, year hoặc month' });
    }

    const exam = new Exam({
      title,
      subtitle,
      level,
      year: Number(year),
      month: Number(month),
      source,
      sections: Array.isArray(sections) && sections.length ? sections : buildDefaultSections(level),
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
      status: 'draft',
    });

    exam.slug = await createUniqueExamSlug(exam);
    ensureSections(exam);
    await exam.save();

    res.status(201).json(toExamResponse(exam));
  } catch (error) {
    console.error('[Exam] createExam:', error);
    res.status(500).json({ error: error.message || 'Lỗi tạo đề thi' });
  }
};

export const updateExam = async (req, res) => {
  try {
    const exam = await findExamByIdOrSlug(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Không tìm thấy đề thi' });

    const editableFields = ['title', 'subtitle', 'level', 'year', 'month', 'source', 'sections'];
    editableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        exam[field] = req.body[field];
      }
    });

    exam.updatedBy = req.user?.id;
    ensureSections(exam);

    if (req.body.title || req.body.level || req.body.year || req.body.month) {
      exam.slug = await createUniqueExamSlug(exam, exam._id);
    }

    await exam.save();
    res.json(toExamResponse(exam));
  } catch (error) {
    console.error('[Exam] updateExam:', error);
    res.status(500).json({ error: error.message || 'Lỗi cập nhật đề thi' });
  }
};

export const updateExamStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!EXAM_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Trạng thái đề thi không hợp lệ' });
    }

    const exam = await findExamByIdOrSlug(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Không tìm thấy đề thi' });

    exam.status = status;
    exam.updatedBy = req.user?.id;
    exam.publishedAt = status === 'published' ? new Date() : null;
    ensureSections(exam);
    await exam.save();

    res.json(toExamResponse(exam));
  } catch (error) {
    console.error('[Exam] updateExamStatus:', error);
    res.status(500).json({ error: 'Lỗi cập nhật trạng thái đề thi' });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const exam = await findExamByIdOrSlug(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Không tìm thấy đề thi' });

    await Exam.deleteOne({ _id: exam._id });
    res.json({ success: true, message: 'Đã xóa đề thi', id: String(exam._id) });
  } catch (error) {
    console.error('[Exam] deleteExam:', error);
    res.status(500).json({ error: 'Lỗi xóa đề thi' });
  }
};

export const importPreview = async (req, res) => {
  try {
    const { sectionType, mondaiNumber, title, instruction, sectionTitle } = req.body;
    const documentFile = getUploadedFile(req, ['file', 'documentFile']);
    const audioFile = getUploadedFile(req, ['audioFile']);

    if (!EXAM_SECTION_TYPES.includes(sectionType)) {
      return res.status(400).json({ error: 'Phần thi không hợp lệ' });
    }
    if (!documentFile) {
      return res.status(400).json({ error: 'Vui lòng upload ảnh hoặc PDF tài liệu' });
    }
    if (sectionType === 'listening' && !audioFile) {
      return res.status(400).json({ error: 'Phần nghe cần upload thêm file audio' });
    }

    const section = await extractExamSectionFromFile({
      file: documentFile,
      audioFile,
      sectionType,
      sectionTitle: sectionTitle || title || '',
      startMondaiNumber: Number(mondaiNumber) || 1,
    });

    const audioUpload = audioFile
      ? await uploadBufferToCloudinary(audioFile, 'animelearn_exams/listening')
      : null;

    const groups = section.groups.map((group, index) => ({
      ...group,
      instruction: group.instruction || instruction || '',
      audioUrl: audioUpload?.secure_url || group.audioUrl || '',
      order: index + 1,
    }));
    const group = groups[0] || null;

    res.json({
      sectionType,
      sectionTitle: section.sectionTitle,
      groups,
      group,
      file: fileMeta(documentFile),
      audioFile: fileMeta(audioFile),
    });
  } catch (error) {
    console.error('[Exam] importPreview:', error);
    res.status(500).json({ error: error.message || 'Lỗi AI import đề thi' });
  }
};

export const saveExamSection = async (req, res) => {
  try {
    const { sectionType, groups, mode = 'replace' } = req.body;

    if (!EXAM_SECTION_TYPES.includes(sectionType)) {
      return res.status(400).json({ error: 'Phần thi không hợp lệ' });
    }

    const normalizedGroups = normalizeQuestionGroups(groups);
    if (!normalizedGroups.length) {
      return res.status(400).json({ error: 'Không có Mondai nào để lưu' });
    }

    const exam = await findExamByIdOrSlug(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Không tìm thấy đề thi' });

    replaceSectionGroupsInExam(exam, sectionType, normalizedGroups, mode);
    exam.updatedBy = req.user?.id;
    await exam.save();

    res.json({
      exam: toExamResponse(exam),
      groups: normalizedGroups,
    });
  } catch (error) {
    console.error('[Exam] saveExamSection:', error);
    res.status(500).json({ error: error.message || 'Lỗi lưu kỹ năng vào đề thi' });
  }
};

export const saveExamGroup = async (req, res) => {
  try {
    const { sectionType, group, mode = 'append' } = req.body;

    if (!EXAM_SECTION_TYPES.includes(sectionType)) {
      return res.status(400).json({ error: 'Phần thi không hợp lệ' });
    }

    const exam = await findExamByIdOrSlug(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Không tìm thấy đề thi' });

    const normalizedGroup = normalizeQuestionGroup(group);
    upsertGroupInExam(exam, sectionType, normalizedGroup, mode);
    exam.updatedBy = req.user?.id;
    await exam.save();

    res.json({
      exam: toExamResponse(exam),
      group: normalizedGroup,
    });
  } catch (error) {
    console.error('[Exam] saveExamGroup:', error);
    res.status(500).json({ error: error.message || 'Lỗi lưu Mondai vào đề thi' });
  }
};

export const importAndSaveGroup = async (req, res) => {
  try {
    const { sectionType, mondaiNumber, title, instruction, mode = 'append' } = req.body;

    if (!EXAM_SECTION_TYPES.includes(sectionType)) {
      return res.status(400).json({ error: 'Phần thi không hợp lệ' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng upload ảnh hoặc PDF' });
    }

    const exam = await findExamByIdOrSlug(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Không tìm thấy đề thi' });

    const group = await extractExamGroupFromFile({
      file: req.file,
      sectionType,
      mondaiNumber: Number(mondaiNumber) || 1,
      title,
      instruction,
    });

    upsertGroupInExam(exam, sectionType, group, mode);
    exam.updatedBy = req.user?.id;
    await exam.save();

    res.json({
      exam: toExamResponse(exam),
      group,
    });
  } catch (error) {
    console.error('[Exam] importAndSaveGroup:', error);
    res.status(500).json({ error: error.message || 'Lỗi import và lưu Mondai' });
  }
};

export const uploadExamMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng upload file media' });
    }

    const result = await uploadBufferToCloudinary(req.file);
    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      originalName: req.file.originalname,
    });
  } catch (error) {
    console.error('[Exam] uploadExamMedia:', error);
    res.status(500).json({ error: error.message || 'Lỗi upload media đề thi' });
  }
};
