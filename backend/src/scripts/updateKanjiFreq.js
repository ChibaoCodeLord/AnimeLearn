import mongoose from 'mongoose';
import fs from 'fs';
import Kanji from '../models/Kanji.js'; // Import đúng Model Kanji
import { fileURLToPath } from 'url'; 
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Cấu hình chuỗi kết nối Database và đường dẫn file
// (Nhớ điền lại URI Database thực tế của ông vào đây nhé)
const MONGO_URI = ''; 

// Đường dẫn tới file chứa data kanji (ví dụ: kanji.json)
const KANJI_DATA_FILE_PATH = path.join(__dirname, '../dict_data/kanji.json');

async function runMigration() {
  try {
    console.log('⏳ Đang kết nối tới Database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Kết nối MongoDB thành công!\n');

    console.log('⏳ Đang đọc file dữ liệu Kanji...');
    const rawData = fs.readFileSync(KANJI_DATA_FILE_PATH, 'utf-8');
    const kanjiData = JSON.parse(rawData);
    console.log(`✅ Đã đọc thành công ${kanjiData.length} object chữ Kanji từ file.\n`);

    console.log('⏳ Bắt đầu quá trình đồng bộ (Bulk Update) vào bảng KANJI...');
    
    let bulkOperations = [];
    let updatedCount = 0;

    for (let item of kanjiData) {
      // Bỏ qua nếu kanji này không có dữ liệu freq (freq = null)
      if (item.freq === null || item.freq === undefined) continue; 

      const kanjiChar = item.kanji;
      const freqScore = item.freq;

      // Tạo lệnh cập nhật đưa vào danh sách chờ
      bulkOperations.push({
        updateOne: { // Dùng updateOne vì mỗi chữ Kanji là duy nhất (unique)
          filter: { kanji: kanjiChar },
          update: { $set: { freq: freqScore } }
        }
      });

      // Khi mảng chờ gom đủ 5000 lệnh, thực thi đẩy lên DB 1 lần cho nhẹ máy
      if (bulkOperations.length === 5000) {
        await Kanji.bulkWrite(bulkOperations);
        updatedCount += 5000;
        console.log(`... Đã cập nhật thành công ${updatedCount} chữ Kanji.`);
        bulkOperations.length = 0; // Xóa mảng để gom lô tiếp theo
      }
    }

    // Đẩy nốt số lượng lệnh còn dư lại (nhỏ hơn 5000)
    if (bulkOperations.length > 0) {
      await Kanji.bulkWrite(bulkOperations);
      updatedCount += bulkOperations.length;
    }

    console.log(`\n🎉 HOÀN TẤT! Tổng cộng đã thêm trường 'freq' thành công cho ${updatedCount} chữ Kanji vào database.`);

  } catch (error) {
    console.error('❌ Quá trình chạy bị lỗi:', error);
  } finally {
    // Ngắt kết nối để trả lại tài nguyên
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối Database.');
  }
}

// Gọi hàm chạy script
runMigration();