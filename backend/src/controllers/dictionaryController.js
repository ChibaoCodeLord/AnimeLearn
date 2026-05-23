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
        const viExactRegex = new RegExp(`(^|[\\s,.:;!?\\-()\\n\\r])` + safeQuery + `([\\s,.:;!?\\-()\\n\\r]|$)`, 'i');
        const upperQuery = queryText.toUpperCase();

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
                { mean: searchRegex },
                { mean: upperQuery }, 
                { detail: searchRegex },
                { on: searchRegex },
                { kun: searchRegex }
            ]
        };

        // 2. THỰC THI TRUY VẤN SONG SONG VỚI POPULARITY SORT
        // Lưu ý: Đã thêm aggregation pipeline để ưu tiên Exact Match lên đầu, sau đó mới sort theo popularity
        
        const [dictResults, totalCount, rawKanjiResults] = await Promise.all([
            Dictionary.aggregate([
                { $match: dictCondition },
                {
                    $addFields: {
                        exactMatchPriority: {
                            $cond: { 
                                if: { 
                                    $or: [
                                        { $eq: ["$word", queryText] },
                                        { $eq: ["$reading", queryText] }
                                    ]
                                }, 
                                then: 0, 
                                else: {
                                    $cond: {
                                        if: {
                                            $anyElementTrue: {
                                                $map: {
                                                    input: { $cond: { if: { $isArray: "$meanings" }, then: "$meanings", else: ["$meanings"] } },
                                                    as: "meanStr",
                                                    in: {
                                                        $regexMatch: {
                                                            input: { $cond: { if: { $eq: [{ $type: "$$meanStr" }, "string"] }, then: "$$meanStr", else: "" } },
                                                            regex: viExactRegex
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        then: 1,
                                        else: 2 
                                    }
                                }
                            }
                        },
                        // BÙA HỘ MỆNH Ở ĐÂY: Nếu undefined thì ép thành 999999 ngay trên RAM
                        popularity_score: { $ifNull: ["$popularity_score", 999999] }
                    }
                },
                { 
                    // Sắp xếp: Ưu tiên Tầng -> Độ phổ biến -> ID
                    $sort: { 
                        exactMatchPriority: 1, 
                        popularity_score: 1,
                        _id: 1
                    } 
                },
                { 
                    // Sắp xếp: Ưu tiên Tầng (0 -> 1 -> 2), trong cùng 1 Tầng thì đua bằng Độ phổ biến
                    $sort: { 
                        exactMatchPriority: 1, 
                        popularity_score: 1,
                        _id: 1
                    } 
                },
                { $skip: skip },
                { $limit: limitNum }
            ]),
            Dictionary.countDocuments(dictCondition),
            pageNum === 1 ? Kanji.find(kanjiCondition).limit(15).lean() : Promise.resolve([])
        ]);
        console.log(`\n🔍 [DEBUG] TỪ KHÓA TÌM KIẾM: "${queryText}"`);
        if (dictResults.length > 0) {
            // Map ra một object ngắn gọn để in cho đẹp, bỏ qua mảng meanings dài ngoằng
            const debugTable = dictResults.map(item => ({
                Từ_vựng: item.word,
                Cách_đọc: item.reading || 'N/A',
                Tầng_Ưu_Tiên: item.exactMatchPriority, // 0: Kanji chuẩn, 1: Việt chuẩn, 2: Khớp 1 phần
                Điểm_Phổ_Biến: item.popularity_score
            }));
            
            // Dùng console.table để vẽ bảng trong Terminal Node.js cực kỳ trực quan
            console.table(debugTable);
        } else {
            console.log("❌ Không tìm thấy kết quả nào.");
        }

        // 3. XỬ LÝ DỮ LIỆU TRƯỚC KHI TRẢ VỀ (DATA MAPPING)

        // Lọc bỏ trường tạm thời exactMatchPriority và map lại meanings
        const formattedDictResults = dictResults.map(item => {
            const { exactMatchPriority, ...rest } = item;
            return {
                ...rest,
                meaning: item.meanings 
            };
        });

        // Chuyển mean từ IN HOA sang chữ thường cho Kanji
        const formattedKanjiResults = rawKanjiResults.map(k => ({
            ...k,
            mean: k.mean ? k.mean.toLowerCase() : '' 
        }));

        // 4. PHẢN HỒI CHO FRONTEND
        res.status(200).json({
            success: true,
            data: formattedDictResults,
            kanjiData: formattedKanjiResults,
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