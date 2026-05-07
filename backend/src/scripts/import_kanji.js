import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Kanji from '../models/Kanji.js'; // Đường dẫn trỏ tới file Model vừa tạo

// Cấu hình dotenv và đường dẫn để chạy độc lập
dotenv.config({ path: '../../.env' }); 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ĐIỀN ĐƯỜNG DẪN TỚI FILE KANJI.JSON CỦA BẠN VÀO ĐÂY
const JSON_FILE_PATH = path.join(__dirname, '../dict_data/kanji.json');
const MONGO_URI = 'mongourl';

async function importKanjiData() {
    try {
        console.log('⏳ Đang kết nối Database...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Đã kết nối MongoDB!');

        console.log('⏳ Đang đọc file kanji.json...');
        const rawData = fs.readFileSync(path.resolve(JSON_FILE_PATH), 'utf-8');
        const kanjiList = JSON.parse(rawData);
        console.log(`📦 Đã đọc được ${kanjiList.length} chữ Kanji.`);

        console.log('⏳ Đang dọn dẹp và chuẩn bị dữ liệu...');
        const formattedData = kanjiList.map(item => {
            let parsedComps = [];
            let parsedExamples = [];
            
            // Xử lý chuỗi JSON bị kẹt bên trong file
            try { if (item.compDetail) parsedComps = JSON.parse(item.compDetail); } catch (e) {}
            try { if (item.examples) parsedExamples = JSON.parse(item.examples); } catch (e) {}

            return {
                kanji: item.kanji,
                mean: item.mean,
                kun: item.kun,
                on: item.on,
                level: item.level,
                stroke_count: item.stroke_count,
                detail: item.detail,
                compDetail: parsedComps,
                examples: parsedExamples,
                img: item.img
            };
        });

        console.log('🚀 Đang bơm vào Database (Sẽ mất vài giây)...');
        await Kanji.insertMany(formattedData, { ordered: false });
        
        console.log('🎉 Xong! Toàn bộ Kanji đã được nhập thành công!');
        process.exit(0);

    } catch (error) {
        if (error.code === 11000) {
            console.log('⚠️ Báo cáo: Đã nhập xong. Đã bỏ qua các chữ Kanji bị trùng lặp.');
            process.exit(0);
        } else {
            console.error('❌ Lỗi import:', error);
            process.exit(1);
        }
    }
}

importKanjiData();