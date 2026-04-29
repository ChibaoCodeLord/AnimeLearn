import { getALLVocabulary, updateVocabulary as updateVocabularyService } from "../services/vocabularyService.js";


export const getVocabulary = async(req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const list = await getALLVocabulary(userId);
        return res.json(list);
    } catch (error) {
        console.error('getVocabulary error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const updateVocabulary = async(req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const {id} = req.params;
        const { next_review_date, review_interval, ease_factor, review_count } = req.body;

        const updated = await updateVocabularyService(userId, id, {
            next_review_date,
            review_interval,
            ease_factor,
            review_count
            });
        if(!updated) {
            return res.status(404).json({ error: 'Vocabulary not found' });
        }
        return res.json(updated);
    } catch (error) {
        console.error('updateVocabularyReview error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}