import mongoose from 'mongoose';

const labelSchema = new mongoose.Schema({
    name_level: { type: String, required: true }, // N5, N4...
    color_hex: { type: String, required: true } // VD: #E63946
});

export default mongoose.model('Label', labelSchema);