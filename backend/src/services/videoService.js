import Video from '../models/Video.js';
import VideoLike from '../models/VideoLike.js';
import VideoWatched from '../models/VideoWatched.js';
import VideoComment from '../models/VideoComment.js';
import Kanji from '../models/Kanji.js';

const createError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const findVideoOrThrow = async (videoId, fields) => {
  const query = Video.findById(videoId);
  if (fields) query.select(fields);
  const video = await query;
  if (!video) {
    throw createError('Video không tồn tại', 404);
  }
  return video;
};

const validateCommentContent = (content) => {
  const normalizedContent = String(content || '').trim();

  if (!normalizedContent) {
    throw createError('Nội dung bình luận không được để trống', 400);
  }

  if (normalizedContent.length > 1000) {
    throw createError('Bình luận tối đa 1000 ký tự', 400);
  }

  return normalizedContent;
};

const formatComment = (comment, currentUserId) => {
  const likes = comment.likes || [];
  return {
    id: comment._id,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    isEdited: comment.updatedAt && comment.createdAt
      ? new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 1000
      : false,
    likesCount: likes.length,
    likedByMe: currentUserId
      ? likes.some(id => String(id) === String(currentUserId))
      : false,
    author: comment.author ? {
      id: comment.author._id,
      fullName: comment.author.fullName,
      profilePicture: comment.author.profilePicture || null,
      role: comment.author.role || 'user',
    } : null,
  };
};

export const countVideoViewService = async (videoId) => {
    const video = await findVideoOrThrow(videoId, 'views_count status');
    console.log("đã tăng view");
    if (video.status !== 'approved') {
        return {
            message: 'View skipped for unapproved video',
            views_count: video.views_count,
        };
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views_count: 1 } },
        { new: true }
    ).select('views_count');

    return {
        message: 'View counted successfully',
        views_count: updatedVideo?.views_count ?? video.views_count,
    };
};

export const countVideoLikeService = async (videoId, currentUserId) => {
  const video = await findVideoOrThrow(videoId, 'likes_count status');

  if (video.status !== 'approved') {
    return {
      message: 'Like skipped for unapproved video',
      likes_count: video.likes_count,
    };
  }

  let likeResult;
  try {
    likeResult = await VideoLike.updateOne(
      { video: videoId, user: currentUserId },
      { $setOnInsert: { video: videoId, user: currentUserId } },
      { upsert: true }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return {
      message: 'Video đã được thích trước đó',
      alreadyLiked: true,
      likes_count: video.likes_count,
    };
  }

  if (!likeResult.upsertedCount) {
    return {
      message: 'Video đã được thích trước đó',
      alreadyLiked: true,
      likes_count: video.likes_count,
    };
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { likes_count: 1 } },
    { new: true }
  ).select('likes_count');

  return {
    message: 'Like counted successfully',
    alreadyLiked: false,
    likes_count: updatedVideo?.likes_count ?? video.likes_count,
  };
};

export const removeVideoLikeService = async (videoId, currentUserId) => {
  const video = await findVideoOrThrow(videoId, 'likes_count status');

  if (video.status !== 'approved') {
    return {
      message: 'Like skipped for unapproved video',
      likes_count: video.likes_count,
    };
  }

  const unlikeResult = await VideoLike.deleteOne({ video: videoId, user: currentUserId });

  if (!unlikeResult.deletedCount) {
    return {
      message: 'Video chưa được thích trước đó',
      alreadyUnliked: true,
      likes_count: video.likes_count,
    };
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { likes_count: -1 } },
    { new: true }
  ).select('likes_count');

  return {
    message: 'Unlike counted successfully',
    alreadyUnliked: false,
    likes_count: Math.max(0, updatedVideo?.likes_count ?? video.likes_count),
  };
};

export const getWatchHistoryService = async (currentUserId, requestedLimit = 30) => {
  const limit = Math.min(Math.max(Number.parseInt(requestedLimit) || 30, 1), 100);
  const watchedVideos = await VideoWatched.find({ user: currentUserId })
    .sort({ watched_at: -1 })
    .limit(limit)
    .populate({
      path: 'video',
      select: '_id title thumbnail_url jlpt_level views_count likes_count created_date duration video_theme status',
    })
    .lean();

  return watchedVideos
    .filter(item => item.video)
    .map(item => ({
      history_id: item._id,
      id: item.video._id,
      title: item.video.title,
      thumbnail_url: item.video.thumbnail_url,
      jlpt_level: item.video.jlpt_level,
      views_count: item.video.views_count,
      likes_count: item.video.likes_count,
      created_date: item.video.created_date,
      duration: item.video.duration || 0,
      video_theme: item.video.video_theme || '',
      status: item.video.status,
      watched_at: item.watched_at,
      progress_seconds: item.progress_seconds || 0,
    }));
};

export const markVideoWatchedService = async (videoId, currentUserId, progressSeconds = 0) => {
  const video = await findVideoOrThrow(videoId, '_id status');
  if (video.status !== 'approved') {
    throw createError('Video chưa được duyệt', 403);
  }

  const watched = await VideoWatched.create({
    video: videoId,
    user: currentUserId,
    watched_at: new Date(),
    progress_seconds: Math.max(0, Number(progressSeconds) || 0),
  });

  const oldWatchedIds = await VideoWatched.find({ user: currentUserId })
    .sort({ watched_at: -1 })
    .skip(30)
    .select('_id')
    .lean();

  if (oldWatchedIds.length > 0) {
    await VideoWatched.deleteMany({
      _id: { $in: oldWatchedIds.map(item => item._id) },
    });
  }

  return watched;
};

export const getVideoCommentsService = async (videoId, currentUserId) => {
  await findVideoOrThrow(videoId, '_id');

  const [comments, replies] = await Promise.all([
    VideoComment.find({ video: videoId, parentComment: null })
      .populate('author', 'fullName profilePicture role')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    VideoComment.find({ video: videoId, parentComment: { $ne: null } })
      .populate('author', 'fullName profilePicture role')
      .sort({ createdAt: 1 })
      .limit(200)
      .lean(),
  ]);

  const repliesByParent = replies.reduce((acc, reply) => {
    const key = String(reply.parentComment);
    if (!acc[key]) acc[key] = [];
    acc[key].push(formatComment(reply, currentUserId));
    return acc;
  }, {});

  return comments.map(comment => ({
    ...formatComment(comment, currentUserId),
    replies: repliesByParent[String(comment._id)] || [],
  }));
};

export const createVideoCommentService = async ({
  videoId,
  currentUserId,
  content,
  parentComment = null,
}) => {
  const normalizedContent = validateCommentContent(content);
  await findVideoOrThrow(videoId, '_id');

  if (parentComment) {
    const parent = await VideoComment.findOne({
      _id: parentComment,
      video: videoId,
      parentComment: null,
    }).select('_id').lean();

    if (!parent) {
      throw createError('Bình luận gốc không tồn tại', 404);
    }
  }

  const comment = await VideoComment.create({
    video: videoId,
    author: currentUserId,
    parentComment,
    content: normalizedContent,
  });

  const populated = await VideoComment.findById(comment._id)
    .populate('author', 'fullName profilePicture role')
    .lean();

  return {
    ...formatComment(populated, currentUserId),
    replies: [],
  };
};

export const toggleVideoCommentLikeService = async (commentId, currentUserId) => {
  const comment = await VideoComment.findById(commentId);
  if (!comment) {
    throw createError('Bình luận không tồn tại', 404);
  }

  const liked = comment.likes.some(id => String(id) === String(currentUserId));
  if (liked) {
    comment.likes = comment.likes.filter(id => String(id) !== String(currentUserId));
  } else {
    comment.likes.push(currentUserId);
  }

  await comment.save();
  return {
    likedByMe: !liked,
    likesCount: comment.likes.length,
  };
};

export const updateVideoCommentService = async (commentId, currentUserId, content) => {
  const normalizedContent = validateCommentContent(content);
  const comment = await VideoComment.findById(commentId);

  if (!comment) {
    throw createError('Bình luận không tồn tại', 404);
  }

  if (String(comment.author) !== String(currentUserId)) {
    throw createError('Bạn không có quyền chỉnh sửa bình luận này', 403);
  }

  comment.content = normalizedContent;
  await comment.save();

  const populated = await VideoComment.findById(comment._id)
    .populate('author', 'fullName profilePicture role')
    .lean();

  return {
    ...formatComment(populated, currentUserId),
    replies: [],
  };
};

export const deleteVideoCommentService = async (commentId, currentUserId) => {
  const comment = await VideoComment.findById(commentId);

  if (!comment) {
    throw createError('Bình luận không tồn tại', 404);
  }

  if (String(comment.author) !== String(currentUserId)) {
    throw createError('Bạn không có quyền xóa bình luận này', 403);
  }

  await VideoComment.deleteMany({
    $or: [
      { _id: comment._id },
      { parentComment: comment._id },
    ],
  });

  return { message: 'Đã xóa bình luận' };
};

export const getVideoDetailService = async (videoId, currentUser) => {
  const video = await findVideoOrThrow(videoId);
  const currentUserId = currentUser?.id || currentUser?.userId;
  const isAdmin = currentUser?.role === 'admin';
  const isCreator = currentUserId && String(video.creator) === String(currentUserId);
  const likedByMe = currentUserId
    ? await VideoLike.exists({ video: video._id, user: currentUserId })
    : false;

  if (video.status !== 'approved' && !isAdmin && !isCreator) {
    throw createError('Video chưa được duyệt nên bạn không có quyền xem', 403);
  }

  return {
    id: video._id,
    title: video.title,
    youtube_url: video.youtube_url,
    script: video.script,
    vocab_list: video.vocab_list,
    jlpt_level: video.jlpt_level,
    status: video.status,
    views_count: video.views_count,
    likes_count: video.likes_count,
    likedByMe: Boolean(likedByMe),
  };
};

export const getUserVideosService = async (currentUserId, requestedPage = 1, requestedLimit = 5) => {
  const page = Math.max(Number.parseInt(requestedPage) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(requestedLimit) || 5, 1), 100);
  const skip = (page - 1) * limit;
  const total = await Video.countDocuments({ creator: currentUserId });
  const videos = await Video.find({ creator: currentUserId })
    .select('_id title thumbnail_url jlpt_level views_count status visibility created_date duration video_theme')
    .sort({ created_date: -1 })
    .skip(skip)
    .limit(limit);
  const totalPages = Math.ceil(total / limit);

  return {
    videos,
    pagination: {
      currentPage: page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const updateVideoService = async (videoId, currentUserId, data) => {
  const video = await findVideoOrThrow(videoId);

  if (String(video.creator) !== String(currentUserId)) {
    throw createError('Bạn không có quyền chỉnh sửa video này', 403);
  }

  if (data.title) video.title = data.title;
  if (data.visibility && ['public', 'private'].includes(data.visibility)) {
    video.visibility = data.visibility;
  }
  if (data.jlpt_level) video.jlpt_level = String(data.jlpt_level);

  await video.save();

  return {
    message: 'Video đã được cập nhật',
    video: {
      _id: video._id,
      title: video.title,
      youtube_url: video.youtube_url,
      jlpt_level: video.jlpt_level,
      status: video.status,
      visibility: video.visibility,
    },
  };
};

export const deleteVideoService = async (videoId, currentUserId) => {
  const video = await findVideoOrThrow(videoId);

  if (String(video.creator) !== String(currentUserId)) {
    throw createError('Bạn không có quyền xóa video này', 403);
  }

  await Video.findByIdAndDelete(videoId);
  return { message: 'Video đã được xóa' };
};

export const getVideoVocabularyService = async (videoId) => {
  const video = await Video.findById(videoId).select('script').lean();
  if (!video?.script?.length) return [];

  const vocabMap = new Map();
  const allKanjiSet = new Set();

  video.script.forEach(segment => {
    if (!Array.isArray(segment.vocabulary)) return;
    segment.vocabulary.forEach(vocab => {
      if (vocabMap.has(vocab.word)) return;
      vocabMap.set(vocab.word, vocab);
      vocab.word.split('').forEach(char => {
        if (char.match(/[\u4e00-\u9faf]/)) allKanjiSet.add(char);
      });
    });
  });

  const kanjiData = await Kanji.find({ kanji: { $in: Array.from(allKanjiSet) } })
    .select('kanji mean kun on level stroke_count detail img')
    .lean();
  const kanjiMap = Object.fromEntries(kanjiData.map(kanji => [kanji.kanji, kanji]));

  return Array.from(vocabMap.values()).map(vocab => ({
    word: vocab.word,
    reading: vocab.reading,
    meaning: vocab.meaning,
    pos: vocab.pos,
    kanji_info: vocab.word
      .split('')
      .filter(char => char.match(/[\u4e00-\u9faf]/))
      .map(char => kanjiMap[char])
      .filter(Boolean),
  }));
};

export const getPublicVideosService = async ({ level, page = 1, limit = 4 }) => {
  const pageNum = Math.max(Number.parseInt(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number.parseInt(limit) || 4, 1), 100);
  const skip = (pageNum - 1) * limitNum;
  const query = { status: 'approved', visibility: 'public' };

  if (level === 'Mixed') {
    query.jlpt_level = { $nin: ['N1', 'N2', 'N3', 'N4', 'N5'] };
  } else if (level) {
    query.jlpt_level = level;
  }

  const [videos, total] = await Promise.all([
    Video.find(query)
      .select('_id title thumbnail_url jlpt_level views_count likes_count created_date duration video_theme')
      .sort({ created_date: -1 })
      .allowDiskUse(true)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Video.countDocuments(query),
  ]);

  return {
    success: true,
    data: videos.map(video => ({
      id: video._id,
      title: video.title,
      thumbnail_url: video.thumbnail_url,
      jlpt_level: video.jlpt_level,
      views_count: video.views_count,
      likes_count: video.likes_count,
      created_date: video.created_date,
      duration: video.duration || 0,
      video_theme: video.video_theme || '',
    })),
    hasMore: total > skip + videos.length,
    total,
  };
};
