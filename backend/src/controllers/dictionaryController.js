import DictionaryService from '../services/dictionaryService.js';

export const translateWords = async (req, res) => {
    // ... (Giữ nguyên toàn bộ logic bên trong hàm của bạn)
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