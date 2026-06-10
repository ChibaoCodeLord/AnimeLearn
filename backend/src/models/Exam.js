import mongoose from 'mongoose';

const EXAM_LEVELS = ['N1', 'N2', 'N3', 'N4', 'N5'];
const EXAM_SECTION_TYPES = ['vocabulary_grammar', 'reading', 'listening'];
const EXAM_STATUSES = ['draft', 'published', 'archived'];

const questionOptionSchema = new mongoose.Schema({
  label: { type: String, trim: true, default: '' },
  text: { type: String, trim: true, default: '' },
  imageUrl: { type: String, trim: true, default: '' },
}, { _id: true });

const questionSchema = new mongoose.Schema({
  order: { type: Number, default: 1, min: 1 },
  type: {
    type: String,
    trim: true,
    default: 'other',
    enum: [
      'kanji_reading',
      'vocabulary',
      'grammar',
      'reading',
      'listening',
      'sentence_reorder',
      'blank',
      'other',
    ],
  },
  questionText: { type: String, trim: true, default: '' },
  stemText: { type: String, trim: true, default: '' },
  questionImageUrl: { type: String, trim: true, default: '' },
  audioUrl: { type: String, trim: true, default: '' },
  options: {
    type: [questionOptionSchema],
    default: [],
  },
  correctOptionIndex: {
    type: Number,
    default: null,
    min: 0,
    max: 9,
  },
  answerSource: {
    type: String,
    enum: ['ai_inferred', 'source_marked', 'admin', 'unknown'],
    default: 'unknown',
  },
  answerConfidence: {
    type: Number,
    default: null,
    min: 0,
    max: 1,
  },
  explanation: { type: String, trim: true, default: '' },
  points: { type: Number, default: 1, min: 0 },
  aiNotes: { type: String, trim: true, default: '' },
}, { _id: true });

const questionGroupSchema = new mongoose.Schema({
  order: { type: Number, default: 1, min: 1 },
  mondaiNumber: { type: Number, default: 1, min: 1 },
  title: { type: String, trim: true, default: '' },
  instruction: { type: String, trim: true, default: '' },
  passageText: { type: String, trim: true, default: '' },
  attachmentImageUrl: { type: String, trim: true, default: '' },
  audioUrl: { type: String, trim: true, default: '' },
  audioStartSeconds: { type: Number, default: null, min: 0 },
  audioEndSeconds: { type: Number, default: null, min: 0 },
  sourceFileUrl: { type: String, trim: true, default: '' },
  sourceFileName: { type: String, trim: true, default: '' },
  questions: {
    type: [questionSchema],
    default: [],
  },
}, { _id: true });

const examSectionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: EXAM_SECTION_TYPES,
  },
  title: { type: String, trim: true, required: true },
  durationMinutes: { type: Number, default: 0, min: 0 },
  order: { type: Number, default: 1, min: 1 },
  groups: {
    type: [questionGroupSchema],
    default: [],
  },
}, { _id: true });

const examSchema = new mongoose.Schema({
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
  },
  title: { type: String, trim: true, required: true },
  subtitle: { type: String, trim: true, default: 'Kỳ thi JLPT' },
  level: { type: String, required: true, enum: EXAM_LEVELS },
  year: { type: Number, required: true, min: 1900 },
  month: { type: Number, required: true, min: 1, max: 12 },
  source: { type: String, trim: true, default: 'JLPT' },
  status: { type: String, enum: EXAM_STATUSES, default: 'draft', index: true },
  sections: {
    type: [examSectionSchema],
    default: [],
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  publishedAt: { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    },
  },
  toObject: { virtuals: true },
});

examSchema.index({ level: 1, year: -1, month: -1 });
examSchema.index({ status: 1, level: 1, year: -1, month: -1 });

export { EXAM_LEVELS, EXAM_SECTION_TYPES, EXAM_STATUSES };
export default mongoose.model('Exam', examSchema);
