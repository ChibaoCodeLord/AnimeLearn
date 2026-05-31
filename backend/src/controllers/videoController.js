import {
  countVideoLikeService,
  countVideoViewService,
  createVideoCommentService,
  deleteVideoCommentService,
  deleteVideoService,
  getPublicVideosService,
  getUserVideosService,
  getVideoCommentsService,
  getVideoDetailService,
  getVideoVocabularyService,
  getWatchHistoryService,
  markVideoWatchedService,
  removeVideoLikeService,
  toggleVideoCommentLikeService,
  updateVideoCommentService,
  updateVideoService,
} from '../services/videoService.js';

const getCurrentUserId = (req) => req.user?.id || req.user?.userId;

const handleControllerError = (res, error, fallbackMessage) => {
  console.error(fallbackMessage, error);
  return res.status(error.status || 500).json({
    error: error.message || fallbackMessage,
  });
};

export const countVideoViewController = async (req, res) => {
  try {
    return res.json(await countVideoViewService(req.params.id));
  } catch (error) {
    return handleControllerError(res, error, 'Lỗi khi tăng lượt xem video');
  }
};

export const countVideoLikeController = async (req, res) => {
  try {
    return res.json(await countVideoLikeService(req.params.id, getCurrentUserId(req)));
  } catch (error) {
    return handleControllerError(res, error, 'Lỗi khi tăng lượt thích video');
  }
};

export const removeVideoLikeController = async (req, res) => {
  try {
    return res.json(await removeVideoLikeService(req.params.id, getCurrentUserId(req)));
  } catch (error) {
    return handleControllerError(res, error, 'Lỗi khi bỏ thích video');
  }
};

export const getWatchHistoryController = async (req, res) => {
  try {
    const data = await getWatchHistoryService(getCurrentUserId(req), req.query.limit);
    return res.json({ success: true, data });
  } catch (error) {
    return handleControllerError(res, error, 'Lỗi khi lấy lịch sử xem video');
  }
};

export const markVideoWatchedController = async (req, res) => {
  try {
    const watched = await markVideoWatchedService(
      req.params.id,
      getCurrentUserId(req),
      req.body?.progress_seconds
    );
    return res.json({ success: true, watched });
  } catch (error) {
    return handleControllerError(res, error, 'Lỗi khi lưu lịch sử xem video');
  }
};

export const getVideoCommentsController = async (req, res) => {
  try {
    const comments = await getVideoCommentsService(req.params.id, getCurrentUserId(req));
    return res.json({ comments });
  } catch (error) {
    return handleControllerError(res, error, 'Lỗi khi lấy bình luận');
  }
};

export const createVideoCommentController = async (req, res) => {
  try {
    const comment = await createVideoCommentService({
      videoId: req.params.id,
      currentUserId: getCurrentUserId(req),
      content: req.body?.content,
      parentComment: req.body?.parentComment || null,
    });
    return res.status(201).json({ comment });
  } catch (error) {
    return handleControllerError(res, error, 'Lỗi khi tạo bình luận');
  }
};

export const toggleVideoCommentLikeController = async (req, res) => {
  try {
    return res.json(
      await toggleVideoCommentLikeService(req.params.commentId, getCurrentUserId(req))
    );
  } catch (error) {
    return handleControllerError(res, error, 'Lỗi khi thích bình luận');
  }
};

export const updateVideoCommentController = async (req, res) => {
  try {
    const comment = await updateVideoCommentService(
      req.params.commentId,
      getCurrentUserId(req),
      req.body?.content
    );
    return res.json({ comment });
  } catch (error) {
    return handleControllerError(res, error, 'Lỗi khi chỉnh sửa bình luận');
  }
};

export const deleteVideoCommentController = async (req, res) => {
  try {
    return res.json(
      await deleteVideoCommentService(req.params.commentId, getCurrentUserId(req))
    );
  } catch (error) {
    return handleControllerError(res, error, 'Lỗi khi xóa bình luận');
  }
};

export const getVideoDetailController = async (req, res) => {
  try {
    return res.json(await getVideoDetailService(req.params.id, req.user));
  } catch (error) {
    return handleControllerError(res, error, 'Lỗi khi lấy thông tin video');
  }
};

export const getUserVideosController = async (req, res) => {
  try {
    return res.json(
      await getUserVideosService(getCurrentUserId(req), req.query.page, req.query.limit)
    );
  } catch (error) {
    return handleControllerError(res, error, 'Lỗi khi lấy danh sách video');
  }
};

export const updateVideoController = async (req, res) => {
  try {
    return res.json(await updateVideoService(req.params.id, getCurrentUserId(req), req.body));
  } catch (error) {
    return handleControllerError(res, error, 'Lỗi khi cập nhật video');
  }
};

export const deleteVideoController = async (req, res) => {
  try {
    return res.json(await deleteVideoService(req.params.id, getCurrentUserId(req)));
  } catch (error) {
    return handleControllerError(res, error, 'Lỗi khi xóa video');
  }
};

export const getVideoVocabularyController = async (req, res) => {
  try {
    return res.json({
      success: true,
      data: await getVideoVocabularyService(req.params.id),
    });
  } catch (error) {
    return handleControllerError(res, error, 'Lỗi khi lấy từ vựng và Kanji của video');
  }
};

export const getPublicVideosController = async (req, res) => {
  try {
    return res.status(200).json(await getPublicVideosService(req.query));
  } catch (error) {
    return handleControllerError(res, error, 'Lỗi server khi tải danh sách video');
  }
};
