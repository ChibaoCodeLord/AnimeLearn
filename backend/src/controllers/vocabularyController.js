import mongoose from 'mongoose';
import Dictionary from '../models/Dictionary.js';
import Folder from '../models/Folder.js';
import Kanji from '../models/Kanji.js';
import Vocabulary from '../models/Vocabulary.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const VOCAB_RANGES = {
  '1-2000': [1, 2000],
  '2000-4000': [2000, 4000],
  '4000-6000': [4000, 6000],
  '6000-8000': [6000, 8000],
  '8000-10000': [8000, 10000]
};

const KANJI_FREQ_RANGES = {
  '1-500': [1, 500],
  '500-1000': [500, 1000],
  '1000-1500': [1000, 1500],
  '1500-2000': [1500, 2000]
};

const getUserId = (req) => req.user?.id || req.user?.userId;

const parsePagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const requestedLimit = Number.parseInt(query.limit, 16) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const paginatedResponse = ({ items, total, page, limit }) => ({
  items,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    hasPrev: page > 1,
    hasNext: page * limit < total
  }
});

const normalizeRange = (range, ranges, fallback) => ranges[range] ? range : fallback;

const parseJlptLevel = (value) => {
  if (!value) return 5;
  const normalized = String(value).toUpperCase().replace('N', '');
  const level = Number.parseInt(normalized, 10);
  return [1, 2, 3, 4, 5].includes(level) ? level : 5;
};

const isValidId = (value) => value && mongoose.Types.ObjectId.isValid(String(value));

const assertOwnedFolder = async (userId, folderId) => {
  if (!folderId) return null;
  if (!isValidId(folderId)) return undefined;

  return Folder.findOne({ _id: folderId, user: userId }).lean();
};

const buildVocabSnapshot = (source, userId, folderId) => ({
  user: userId,
  folderId,
  item_type: 'vocab',
  word: source.word,
  reading: source.reading,
  meaning_vi: Array.isArray(source.meanings)
    ? source.meanings.filter(Boolean).join('\n')
    : source.meaning_vi || source.meaning || '',
  meaning_en: source.meaning_en || '',
  part_of_speech: source.pos || source.part_of_speech || '',
  jlpt_level: source.jlpt_level || 'Unknown',
  popularity_score: source.popularity_score ?? 999999,
  example_sentence: source.example_sentence || '',
  example_meaning: source.example_meaning || ''
});

const buildKanjiSnapshot = (source, userId, folderId) => ({
  user: userId,
  folderId,
  item_type: 'kanji',
  word: source.kanji,
  meaning_vi: source.mean || '',
  mean: source.mean || '',
  on: source.on || '',
  kun: source.kun || '',
  jlpt_level: source.level ? `N${source.level}` : 'Unknown',
  stroke_count: source.stroke_count,
  freq: source.freq,
  detail: source.detail || '',
  img: source.img || '',
  example_sentence: Array.isArray(source.examples) ? source.examples[0]?.word || '' : '',
  example_meaning: Array.isArray(source.examples) ? source.examples[0]?.meaning || '' : ''
});

export const getVocabulary = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { page, limit, skip } = parsePagination(req.query);
    const { folderId, item_type } = req.query;

    const filter = { user: userId };
    if (folderId && folderId !== 'all') filter.folderId = folderId === 'none' ? null : folderId;
    if (['vocab', 'kanji'].includes(item_type)) filter.item_type = item_type;

    const [items, total] = await Promise.all([
      Vocabulary.find(filter)
        .populate('folderId', 'name color')
        .sort({ saved_at: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vocabulary.countDocuments(filter)
    ]);

    return res.json(paginatedResponse({ items, total, page, limit }));
  } catch (error) {
    console.error('getVocabulary error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const updateVocabulary = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const allowedFields = [
      'folderId',
      'next_review_date',
      'review_interval',
      'ease_factor',
      'review_count',
      'review_date'
    ];

    const payload = {};
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) payload[field] = req.body[field];
    });

    if (Object.prototype.hasOwnProperty.call(payload, 'folderId')) {
      if (!payload.folderId) {
        payload.folderId = null;
      } else {
        const folder = await assertOwnedFolder(userId, payload.folderId);
        if (!folder) return res.status(404).json({ error: 'Folder not found' });
      }
    }

    const updated = await Vocabulary.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: payload },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Vocabulary not found' });
    return res.json(updated);
  } catch (error) {
    console.error('updateVocabulary error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const deleteVocabulary = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const deleted = await Vocabulary.findOneAndDelete({ _id: id, user: userId });
    if (!deleted) return res.status(404).json({ error: 'Vocabulary not found' });

    return res.json({ message: 'Vocabulary deleted successfully', vocab: deleted });
  } catch (error) {
    console.error('deleteVocabulary error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getFolders = async (req, res) => {
  try {
    const userId = getUserId(req);
    const [folders, counts] = await Promise.all([
      Folder.find({ user: userId }).sort({ createdAt: -1 }).lean(),
      Vocabulary.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), folderId: { $ne: null } } },
        { $group: { _id: '$folderId', total: { $sum: 1 } } }
      ])
    ]);

    const countMap = new Map(counts.map((item) => [String(item._id), item.total]));
    return res.json(folders.map((folder) => ({
      ...folder,
      itemCount: countMap.get(String(folder._id)) || 0
    })));
  } catch (error) {
    console.error('getFolders error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const createFolder = async (req, res) => {
  try {
    const userId = getUserId(req);
    const name = String(req.body.name || '').trim();
    const description = String(req.body.description || '').trim();
    const color = String(req.body.color || 'emerald').trim();

    if (!name) return res.status(400).json({ error: 'Folder name is required' });

    const folder = await Folder.create({ user: userId, name, description, color });
    return res.status(201).json(folder);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'Folder name already exists' });
    }

    console.error('createFolder error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const updateFolder = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const payload = {};

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      const name = String(req.body.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Folder name is required' });
      payload.name = name;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
      payload.description = String(req.body.description || '').trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'color')) {
      payload.color = String(req.body.color || 'emerald').trim();
    }

    const folder = await Folder.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: payload },
      { new: true }
    );

    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    return res.json(folder);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'Folder name already exists' });
    }

    console.error('updateFolder error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const deleted = await Folder.findOneAndDelete({ _id: id, user: userId });
    if (!deleted) return res.status(404).json({ error: 'Folder not found' });

    await Vocabulary.updateMany({ user: userId, folderId: id }, { $set: { folderId: null } });
    return res.json({ message: 'Folder deleted successfully', folder: deleted });
  } catch (error) {
    console.error('deleteFolder error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const saveLearningItem = async (req, res) => {
  try {
    const userId = getUserId(req);
    const itemType = req.body.item_type === 'kanji' ? 'kanji' : 'vocab';
    const folderId = req.body.folderId || null;

    const folder = await assertOwnedFolder(userId, folderId);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    let payload;
    if (itemType === 'kanji') {
      const source = isValidId(req.body.itemId)
        ? await Kanji.findById(req.body.itemId).lean()
        : await Kanji.findOne({ kanji: req.body.word }).lean();

      if (!source && !req.body.word) return res.status(404).json({ error: 'Kanji not found' });
      payload = buildKanjiSnapshot(
        source
          ? {
              ...source,
              ...req.body,
              kanji: source.kanji || req.body.word,
              mean: req.body.mean || req.body.meaning_vi || source.mean
            }
          : {
              ...req.body,
              kanji: req.body.word,
              mean: req.body.mean || req.body.meaning_vi
            },
        userId,
        folderId
      );
    } else {
      const source = isValidId(req.body.itemId)
        ? await Dictionary.findById(req.body.itemId).lean()
        : await Dictionary.findOne({ word: req.body.word }).lean();

      if (!source && !req.body.word) return res.status(404).json({ error: 'Dictionary item not found' });
      payload = buildVocabSnapshot(
        source
          ? {
              ...source,
              ...req.body,
              meanings: req.body.meaning_vi ? undefined : source.meanings
            }
          : req.body,
        userId,
        folderId
      );
    }

    const existing = await Vocabulary.findOne({
      user: userId,
      folderId,
      item_type: payload.item_type,
      word: payload.word
    });

    if (existing) {
      return res.status(200).json({ message: 'Item already saved', item: existing, duplicated: true });
    }

    const item = await Vocabulary.create(payload);
    return res.status(201).json({ message: 'Item saved successfully', item, duplicated: false });
  } catch (error) {
    console.error('saveLearningItem error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getPopularDictionary = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const rangeKey = normalizeRange(req.query.range, VOCAB_RANGES, '1-2000');
    const [min, max] = VOCAB_RANGES[rangeKey];
    const filter = { popularity_score: { $gte: min, $lte: max } };

    const [items, total] = await Promise.all([
      Dictionary.find(filter)
        .sort({ popularity_score: 1, word: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Dictionary.countDocuments(filter)
    ]);

    return res.json(paginatedResponse({ items, total, page, limit }));
  } catch (error) {
    console.error('getPopularDictionary error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getDiscoverKanji = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const mode = req.query.mode === 'freq' ? 'freq' : 'jlpt';
    const filter = {};

    if (mode === 'freq') {
      const rangeKey = normalizeRange(req.query.range, KANJI_FREQ_RANGES, '1-500');
      const [min, max] = KANJI_FREQ_RANGES[rangeKey];
      filter.freq = { $gte: min, $lte: max };
    } else {
      filter.level = parseJlptLevel(req.query.level);
    }

    const [items, total] = await Promise.all([
      Kanji.find(filter)
        .sort(mode === 'freq' ? { freq: 1, kanji: 1 } : { level: -1, freq: 1, kanji: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Kanji.countDocuments(filter)
    ]);

    return res.json(paginatedResponse({ items, total, page, limit }));
  } catch (error) {
    console.error('getDiscoverKanji error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
