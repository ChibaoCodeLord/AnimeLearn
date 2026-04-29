import Vocabulary from "../models/Vocabulary.js"

export const getALLVocabulary = async(userId) => {
    return Vocabulary.find({user: userId}).sort({saved_at: -1});
};

export const updateVocabulary = async(userId, vocabId, data) => {
    return Vocabulary.findOneAndUpdate(
        {_id: vocabId, user: userId},
        {$set: data},
        {new: true}
    );
};