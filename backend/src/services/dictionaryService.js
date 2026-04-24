import Dictionary from '../models/Dictionary.js';

export default class DictionaryService {
    static async lookupMultipleWords(wordsArray) {
        // ... (Giữ nguyên toàn bộ logic bên trong hàm)
        try {
            const uniqueWords = [...new Set(wordsArray.filter(w => w))];
            const foundWords = await Dictionary.find({ word: { $in: uniqueWords } }).lean();

            const wordMap = {};
            foundWords.forEach(item => {
                if (!wordMap[item.word]) wordMap[item.word] = [];
                wordMap[item.word].push({
                    reading: item.reading,
                    pos: item.pos,
                    meanings: item.meanings
                });
            });
            return wordMap;
        } catch (error) {
            console.error("Lỗi trong DictionaryService:", error);
            throw error;
        }
    }
}