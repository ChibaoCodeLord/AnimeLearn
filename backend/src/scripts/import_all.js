import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
// Nhớ trỏ đúng đường dẫn vào trong src/ và có đuôi .js
import Dictionary from '../models/Dictionary.js'; 

// Cấu hình lại __dirname cho chuẩn ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thay bằng URL MongoDB của bạn nếu cần
const MONGO_URI = "mongo-url";

async function importAllDicts() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Đã kết nối MongoDB!");
        
        let totalWords = 0;

        // Vòng lặp đọc 27 file
        for (let i = 1; i <= 27; i++) {
            const fileName = `term_bank_${i}.json`;
            // Chú ý đường dẫn: Lùi ra 1 bước (..) để vào dict_data
            const filePath = path.join(__dirname, '../dict_data', fileName); 

            if (fs.existsSync(filePath)) {
                console.log(`⏳ Đang đọc ${fileName}...`);
                const rawData = fs.readFileSync(filePath, 'utf8');
                const termBank = JSON.parse(rawData);

                const formattedData = termBank.map(item => ({
                    word: item[0] || "",           
                    reading: item[1] || "",        
                    pos: item[2] || "",            
                    meanings: item[5] || []        
                }));

                if (formattedData.length > 0) {
                    await Dictionary.insertMany(formattedData);
                    totalWords += formattedData.length;
                    console.log(`✔️ Đã nạp ${formattedData.length} từ từ ${fileName}.`);
                }
            }
        }

        console.log(`\n🎉 XONG! Đã import ${totalWords} từ vựng vào Database!`);
        process.exit(0); // Chạy xong tự động tắt

    } catch (error) {
        console.error("❌ Lỗi:", error);
        process.exit(1);
    }
}

importAllDicts();