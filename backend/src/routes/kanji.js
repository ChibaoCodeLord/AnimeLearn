import express from 'express';
import Kanji from '../models/Kanji.js';

const router = express.Router();

/**
 * [POST] /api/kanji/lookup
 * Trả về thông tin của nhiều chữ Kanji cùng lúc (dùng khi click vào một từ vựng dài).
 * Body: { "characters": ["違", "反"] }
 */
router.post('/lookup', async (req, res) => {
    try {
        const { characters } = req.body; 

        if (!characters || !Array.isArray(characters)) {
            return res.status(400).json({ success: false, error: 'Vui lòng cung cấp mảng characters' });
        }

        const kanjiData = await Kanji.find({ kanji: { $in: characters } });
        res.json({ success: true, data: kanjiData });
    } catch (error) {
        console.error('Lỗi API lookup Kanji:', error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
});

/**
 * [GET] /api/kanji/detail/:character
 * Trả về thông tin chi tiết (kèm hình ảnh nét vẽ) của 1 chữ Kanji duy nhất.
 * Param: /api/kanji/detail/違
 */
router.get('/detail/:character', async (req, res) => {
    try {
        const char = req.params.character;
        const kanjiInfo = await Kanji.findOne({ kanji: char });

        if (!kanjiInfo) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy chữ Kanji này' });
        }

        res.json({ success: true, data: kanjiInfo });
    } catch (error) {
        console.error('Lỗi API chi tiết Kanji:', error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
});

export default router;