import Exam, { EXAM_SECTION_TYPES, EXAM_STATUSES } from '../models/Exam.js';

const SECTION_LABELS = {
  vocabulary_grammar: 'Từ vựng & Ngữ pháp',
  reading: 'Đọc hiểu',
  listening: 'Nghe hiểu',
};

const DEFAULT_SECTION_MINUTES = {
  vocabulary_grammar: 30,
  reading: 60,
  listening: 40,
};

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function buildDefaultSections(level = 'N3') {
  const minutesByLevel = {
    N1: { vocabulary_grammar: 60, reading: 50, listening: 60 },
    N2: { vocabulary_grammar: 45, reading: 60, listening: 50 },
    N3: { vocabulary_grammar: 35, reading: 35, listening: 40 },
    N4: { vocabulary_grammar: 30, reading: 25, listening: 35 },
    N5: { vocabulary_grammar: 25, reading: 20, listening: 30 },
  };

  const minutes = minutesByLevel[level] || DEFAULT_SECTION_MINUTES;

  return EXAM_SECTION_TYPES.map((type, index) => ({
    type,
    title: SECTION_LABELS[type],
    durationMinutes: minutes[type] || DEFAULT_SECTION_MINUTES[type],
    order: index + 1,
    groups: [],
  }));
}

export function createSlugBase({ level, year, month, title }) {
  const normalizedTitle = String(title || 'exam')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return [
    'jlpt',
    String(level || '').toLowerCase(),
    year,
    String(month || '').padStart(2, '0'),
    normalizedTitle || 'exam',
  ].filter(Boolean).join('-');
}

export async function createUniqueExamSlug(input, currentExamId = null) {
  const base = createSlugBase(input);
  let slug = base;
  let suffix = 2;

  while (true) {
    const existing = await Exam.findOne({ slug }).select('_id').lean();
    if (!existing || (currentExamId && String(existing._id) === String(currentExamId))) {
      return slug;
    }
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

function normalizeOption(option, index) {
  if (typeof option === 'string') {
    return {
      label: OPTION_LABELS[index] || String(index + 1),
      text: option,
      imageUrl: '',
    };
  }

  return {
    label: String(option?.label || OPTION_LABELS[index] || index + 1),
    text: String(option?.text || ''),
    imageUrl: String(option?.imageUrl || option?.optionImageUrl || ''),
  };
}

function normalizeCorrectIndex(value, optionsLength) {
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue)) return null;
  if (numericValue < 0 || numericValue >= Math.max(optionsLength, 1)) return null;
  return numericValue;
}

function normalizeOptionalSeconds(value) {
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) return null;
  return numericValue;
}

export function normalizeQuestion(question, index) {
  const options = Array.isArray(question?.options)
    ? question.options.map(normalizeOption).filter(option => option.text || option.imageUrl)
    : [];

  return {
    order: Number(question?.order) || index + 1,
    type: question?.type || 'other',
    questionText: String(question?.questionText || question?.text || ''),
    stemText: String(question?.stemText || ''),
    questionImageUrl: String(question?.questionImageUrl || ''),
    audioUrl: String(question?.audioUrl || ''),
    options,
    correctOptionIndex: normalizeCorrectIndex(question?.correctOptionIndex, options.length),
    answerSource: String(question?.answerSource || (
      question?.correctOptionIndex !== null && question?.correctOptionIndex !== undefined
        ? 'ai_inferred'
        : 'unknown'
    )),
    answerConfidence: question?.answerConfidence === null || question?.answerConfidence === undefined
      ? null
      : Math.max(0, Math.min(1, Number(question.answerConfidence) || 0)),
    explanation: String(question?.explanation || ''),
    points: Number(question?.points) || 1,
    aiNotes: String(question?.aiNotes || ''),
  };
}

export function normalizeQuestionGroup(group, fallback = {}) {
  const questions = Array.isArray(group?.questions)
    ? group.questions.map(normalizeQuestion).filter(question => question.questionText || question.options.length)
    : [];

  const mondaiNumber = Number(group?.mondaiNumber || fallback.mondaiNumber) || 1;

  return {
    order: Number(group?.order || fallback.order) || mondaiNumber,
    mondaiNumber,
    title: String(group?.title || fallback.title || `Mondai ${mondaiNumber}`),
    instruction: String(group?.instruction || fallback.instruction || ''),
    passageText: String(group?.passageText || ''),
    attachmentImageUrl: String(group?.attachmentImageUrl || ''),
    audioUrl: String(group?.audioUrl || ''),
    audioStartSeconds: normalizeOptionalSeconds(group?.audioStartSeconds),
    audioEndSeconds: normalizeOptionalSeconds(group?.audioEndSeconds),
    sourceFileUrl: String(group?.sourceFileUrl || fallback.sourceFileUrl || ''),
    sourceFileName: String(group?.sourceFileName || fallback.sourceFileName || ''),
    questions,
  };
}

export function normalizeQuestionGroups(groups, fallback = {}) {
  const sourceGroups = Array.isArray(groups) && groups.length ? groups : [];
  return sourceGroups
    .map((group, index) => normalizeQuestionGroup(group, {
      ...fallback,
      order: Number(group?.order) || index + 1,
      mondaiNumber: Number(group?.mondaiNumber) || index + 1,
      title: group?.title || `Mondai ${index + 1}`,
    }))
    .filter(group => group.questions.length || group.passageText || group.attachmentImageUrl || group.audioUrl);
}

export function getQuestionCount(examLike) {
  return (examLike.sections || []).reduce((sectionTotal, section) => (
    sectionTotal + (section.groups || []).reduce((groupTotal, group) => (
      groupTotal + (group.questions || []).length
    ), 0)
  ), 0);
}

function convertNestedIds(value) {
  if (Array.isArray(value)) return value.map(convertNestedIds);
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (value._bsontype === 'ObjectId') return String(value);

  const converted = {};
  Object.entries(value).forEach(([key, entry]) => {
    if (key === '__v') return;
    if (key === '_id') {
      converted.id = String(entry);
      return;
    }
    converted[key] = convertNestedIds(entry);
  });
  return converted;
}

export function toExamResponse(examDoc) {
  if (!examDoc) return null;
  const raw = typeof examDoc.toObject === 'function'
    ? examDoc.toObject({ virtuals: true })
    : examDoc;
  const exam = convertNestedIds(raw);
  exam.totalQuestions = getQuestionCount(exam);
  exam.totalDurationMinutes = (exam.sections || []).reduce(
    (total, section) => total + (Number(section.durationMinutes) || 0),
    0,
  );
  return exam;
}

export function buildExamListFilter({ search = '', level = '', status = 'published', includeDrafts = false }) {
  const filter = {};

  if (!includeDrafts) {
    filter.status = 'published';
  } else if (status && status !== 'all') {
    if (EXAM_STATUSES.includes(status)) filter.status = status;
  }

  if (level && level !== 'all') {
    filter.level = level;
  }

  const normalizedSearch = String(search || '').trim();
  if (normalizedSearch) {
    const numericSearch = Number(normalizedSearch);
    filter.$or = [
      { title: { $regex: normalizedSearch, $options: 'i' } },
      { subtitle: { $regex: normalizedSearch, $options: 'i' } },
      { slug: { $regex: normalizedSearch, $options: 'i' } },
    ];

    if (Number.isInteger(numericSearch)) {
      filter.$or.push({ year: numericSearch }, { month: numericSearch });
    }
  }

  return filter;
}

export function getExamSort(sort = 'newest') {
  if (sort === 'oldest') return { year: 1, month: 1, createdAt: 1 };
  return { year: -1, month: -1, createdAt: -1 };
}

export function ensureSections(exam) {
  if (!Array.isArray(exam.sections) || exam.sections.length === 0) {
    exam.sections = buildDefaultSections(exam.level);
    return;
  }

  EXAM_SECTION_TYPES.forEach((type, index) => {
    const existing = exam.sections.find(section => section.type === type);
    if (!existing) {
      exam.sections.push({
        type,
        title: SECTION_LABELS[type],
        durationMinutes: DEFAULT_SECTION_MINUTES[type],
        order: index + 1,
        groups: [],
      });
    }
  });
}

export function upsertGroupInExam(exam, sectionType, group, mode = 'append') {
  if (!EXAM_SECTION_TYPES.includes(sectionType)) {
    throw new Error('Phần thi không hợp lệ');
  }

  ensureSections(exam);
  const section = exam.sections.find(item => item.type === sectionType);
  const normalizedGroup = normalizeQuestionGroup(group, {
    order: (section.groups || []).length + 1,
  });

  if (mode === 'replace') {
    const index = section.groups.findIndex(item => Number(item.mondaiNumber) === Number(normalizedGroup.mondaiNumber));
    if (index >= 0) {
      section.groups.splice(index, 1, normalizedGroup);
    } else {
      section.groups.push(normalizedGroup);
    }
  } else {
    section.groups.push(normalizedGroup);
  }

  section.groups.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  return normalizedGroup;
}

export function replaceSectionGroupsInExam(exam, sectionType, groups, mode = 'replace') {
  if (!EXAM_SECTION_TYPES.includes(sectionType)) {
    throw new Error('Phần thi không hợp lệ');
  }

  ensureSections(exam);
  const section = exam.sections.find(item => item.type === sectionType);
  const normalizedGroups = normalizeQuestionGroups(groups);

  if (mode === 'append') {
    section.groups.push(...normalizedGroups);
  } else {
    section.groups.splice(0, section.groups.length, ...normalizedGroups);
  }

  section.groups.forEach((group, index) => {
    group.order = index + 1;
    if (!group.mondaiNumber) group.mondaiNumber = index + 1;
  });
  section.groups.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  return normalizedGroups;
}
