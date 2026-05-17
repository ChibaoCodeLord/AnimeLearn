

import mongoose from 'mongoose';
import fs from 'fs';
// ĐÃ SỬA: Import đúng Model Dictionary
import Dictionary from '../models/Dictionary.js'; 
import { fileURLToPath } from 'url'; 
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Cấu hình chuỗi kết nối Database và đường dẫn file
// (Nhớ điền lại URI Database thực tế của ông vào đây nhé)
const MONGO_URI = ''; 

const META_BANK_FILE_PATH = path.join(__dirname, '../dict_data/term_meta_bank_1.json');

async function runMigration() {
  try {
    console.log('⏳ Đang kết nối tới Database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Kết nối MongoDB thành công!\n');

    console.log('⏳ Đang đọc file dữ liệu tần suất JPDB...');
    const rawData = fs.readFileSync(META_BANK_FILE_PATH, 'utf-8');
    const metaData = JSON.parse(rawData);
    console.log(`✅ Đã đọc thành công ${metaData.length} object từ file JSON.\n`);

    console.log('⏳ Bắt đầu quá trình đồng bộ (Bulk Update) vào bảng DICTIONARY...');
    
    let bulkOperations = [];
    let updatedCount = 0;

    for (let item of metaData) {
      // Chỉ xử lý các item có đánh dấu là tần suất ("freq")
      if (item[1] !== "freq") continue; 

      const word = item[0];
      const metaObj = item[2];
      
      let rankScore = null;
      let wordReading = null;

      // Phân tích Object chứa điểm số theo cấu trúc JPDB
      if (typeof metaObj === 'object' && metaObj !== null) {
        if (metaObj.frequency && metaObj.frequency.value) {
          rankScore = metaObj.frequency.value;
          wordReading = metaObj.reading;
        } else if (metaObj.value) {
          rankScore = metaObj.value;
        }
      } else if (typeof metaObj === 'number') {
        // Fallback xử lý cho định dạng cũ (nếu có)
        rankScore = metaObj;
      }

      if (rankScore !== null) {
        // Tạo query tìm kiếm: luôn tìm theo word, nếu có reading thì ghép thêm vào để chính xác 100%
        let filterQuery = { word: word };
        if (wordReading) {
          filterQuery.reading = wordReading; 
        }

        // Tạo lệnh cập nhật đưa vào danh sách chờ
        bulkOperations.push({
          updateMany: {
            filter: filterQuery,
            update: { $set: { popularity_score: rankScore } }
          }
        });
      }

      // Khi mảng chờ gom đủ 5000 lệnh, thực thi đẩy lên DB 1 lần
      if (bulkOperations.length === 5000) {
        // ĐÃ SỬA: Dùng Dictionary thay vì Vocabulary
        await Dictionary.bulkWrite(bulkOperations);
        updatedCount += 5000;
        console.log(`... Đã đẩy thành công ${updatedCount} bản ghi lên Database.`);
        bulkOperations.length = 0; // Xóa mảng để gom lô tiếp theo
      }
    }

    // Đẩy nốt số lượng lệnh còn dư lại (nhỏ hơn 5000)
    if (bulkOperations.length > 0) {
      // ĐÃ SỬA: Dùng Dictionary thay vì Vocabulary
      await Dictionary.bulkWrite(bulkOperations);
      updatedCount += bulkOperations.length;
    }

    console.log(`\n🎉 HOÀN TẤT! Tổng cộng đã ánh xạ thứ hạng thành công cho ${updatedCount} từ vựng vào bảng DICTIONARY.`);

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