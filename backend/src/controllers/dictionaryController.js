import DictionaryService from '../services/dictionaryService.js';
// Import đúng 2 Model làm nguồn dữ liệu tra cứu
import Dictionary from '../models/Dictionary.js'; 
import Kanji from '../models/Kanji.js';           

export const translateWords = async (req, res) => {
    try {
        const { words } = req.body;
        if (!words || !Array.isArray(words)) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp một mảng 'words' hợp lệ." });
        }
        const result = await DictionaryService.lookupMultipleWords(words);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi Server.", error: error.message });
    }
};

// Hàm phụ trợ chống sập Regex khi người dùng gõ ký tự đặc biệt
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

// backend/src/controllers/dictionaryController.js
export const searchDictionary = async (req, res) => {
    try {
        // Kiểm tra sự tồn tại của các Model
        if (!Dictionary || !Kanji) {
            return res.status(500).json({
                success: false, 
                message: "Lỗi: Chưa import Model Dictionary hoặc Kanji." 
            });
        }

        const { q = '', page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const queryText = q.trim();

        if (!queryText) {
            return res.status(200).json({ 
                success: true, 
                data: [], 
                kanjiData: [], 
                hasMore: false, 
                total: 0 
            });
        }

        const safeQuery = escapeRegExp(queryText);
        const searchRegex = new RegExp(safeQuery, 'i');
        const upperQuery = queryText.toUpperCase(); // Để khớp chính xác với bản IN HOA trong DB

        // 1. THIẾT LẬP ĐIỀU KIỆN TÌM KIẾM
        
        // Điều kiện cho bảng Dictionary (Từ vựng)
        const dictCondition = {
            $or: [
                { word: searchRegex },
                { reading: searchRegex },
                { meanings: searchRegex } 
            ]
        };

        // Điều kiện cho bảng Kanji (Hán tự)
        const kanjiCondition = {
            $or: [
                { kanji: searchRegex },
                { mean: searchRegex }, // Tìm Regex (mộng -> MỘNG)
                { mean: upperQuery },  // Tìm khớp chính xác (mộng -> MỘNG)
                { detail: searchRegex },
                { on: searchRegex },
                { kun: searchRegex }
            ]
        };

        // 2. THỰC THI TRUY VẤN SONG SONG
        const [dictResults, totalCount, rawKanjiResults] = await Promise.all([
            Dictionary.find(dictCondition).skip(skip).limit(limitNum).lean(),
            Dictionary.countDocuments(dictCondition),
            pageNum === 1 ? Kanji.find(kanjiCondition).limit(15).lean() : Promise.resolve([])
        ]);

        // 3. XỬ LÝ DỮ LIỆU TRƯỚC KHI TRẢ VỀ (DATA MAPPING)

        // Map lại trường meanings cho Dictionary
        const formattedDictResults = dictResults.map(item => ({
            ...item,
            meaning: item.meanings 
        }));

        // ✨ QUAN TRỌNG: Chuyển mean từ IN HOA sang chữ thường cho Kanji
        const formattedKanjiResults = rawKanjiResults.map(k => ({
            ...k,
            mean: k.mean ? k.mean.toLowerCase() : '' 
        }));

        // 4. PHẢN HỒI CHO FRONTEND
        res.status(200).json({
            success: true,
            data: formattedDictResults,      // Danh sách từ vựng
            kanjiData: formattedKanjiResults, // Danh sách Hán tự (đã lowercase mean)
            hasMore: totalCount > skip + dictResults.length,
            total: totalCount
        });

    } catch (error) {
        console.error("Lỗi search dictionary:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi tra từ điển', 
            errorDetail: error.message 
        });
    }
};