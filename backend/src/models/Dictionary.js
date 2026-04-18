import mongoose from 'mongoose';

const dictionarySchema = new mongoose.Schema({
    word: { type: String, required: true, index: true },
    reading: { type: String, index: true },
    pos: { type: String },
    meanings: [{ type: String }]
});

dictionarySchema.index({ word: 1, reading: 1 });

const Dictionary = mongoose.model('Dictionary', dictionarySchema);

export default Dictionary;