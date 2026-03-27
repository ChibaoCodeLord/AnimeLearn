import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/auth.js';
import Vocabulary from '../models/Vocabulary.js';
import Video from '../models/Video.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.post('/analyze', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Define Path to python script
  const scriptPath = path.join(__dirname, '../scripts/transcribe.py');

  // Start python process
  const pythonProcess = spawn('python', [scriptPath, url]);

  const stdoutChunks = [];
  let errorString = '';

  pythonProcess.stdout.on('data', (data) => {
    stdoutChunks.push(data);
  });

  pythonProcess.stderr.on('data', (data) => {
    errorString += data.toString();
    console.error(`[Python Log]: ${data.toString().trim()}`);
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Process exited with code ${code}. Error: ${errorString}`);
      return res.status(500).json({ error: 'Failed to transcribe video', details: errorString });
    }

    let dataString = '';
    try {
      dataString = Buffer.concat(stdoutChunks).toString('utf8').trim();

      // Trích xuất JSON bằng cách khoanh vùng cụm mảng [{ ... }] để loại bỏ mọi chuỗi tải [download] nhiễu bị dính cùng dòng do \r
      const startIndex = dataString.indexOf('[{');
      const endIndex = dataString.lastIndexOf('}]');
      const emptyStartIndex = dataString.indexOf('[]');

      let cleanJson = '';
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        cleanJson = dataString.substring(startIndex, endIndex + 2);
      } else if (emptyStartIndex !== -1) {
        cleanJson = '[]';
      } else {
        throw new Error("Không tìm thấy dữ liệu mảng JSON trong chuỗi trả về.");
      }

      const result = JSON.parse(cleanJson);

      return res.json({
        title: "Youtube Video (Auto-Transcription)",
        jlpt_level: "Unknown",
        script: result
      });
    } catch (parseError) {
      console.error('Failed to parse Python output:', dataString);
      return res.status(500).json({ error: 'Invalid output format from transcription script' });
    }
  });
});

router.post('/translate-word', (req, res) => {
  const { word } = req.body;
  if (!word) return res.status(400).json({ error: 'Word is required' });

  // Một script python mini nhúng trực tiếp để tra từ nhanh
  const pythonScript = `
import sys, json
sys.stdout.reconfigure(encoding='utf-8')
try:
    import fugashi
    from deep_translator import GoogleTranslator
    word = sys.argv[1]
    tagger = fugashi.Tagger()
    translator = GoogleTranslator(source='ja', target='vi')
    
    meaning = translator.translate(word)
    reading = ""
    pos = "Chưa rõ"
    
    for node in tagger(word):
        pos = node.feature.pos1 if hasattr(node.feature, 'pos1') else ""
        reading = node.feature.kana if hasattr(node.feature, 'kana') else ""
        break # lấy node đầu tiên
        
    print(json.dumps({
        "word": word,
        "reading": reading,
        "meaning_vi": meaning,
        "part_of_speech": pos
    }, ensure_ascii=False))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

  const pythonProcess = spawn('python', ['-c', pythonScript, word]);
  let outData = '';

  pythonProcess.stdout.on('data', (data) => {
    outData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    try {
      res.json(JSON.parse(outData));
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });
});

router.post('/save-word', authMiddleware, async (req, res) => {
  try {
    const { word, reading, meaning_vi, meaning_en, part_of_speech, jlpt_level, example_sentence, example_meaning } = req.body;

    // Check if word already exists for this user
    const existing = await Vocabulary.findOne({ user: req.user.userId, word });
    if (existing) {
      return res.status(400).json({ message: 'Từ này đã có trong sổ tay' });
    }

    const newVocab = new Vocabulary({
      user: req.user.userId,
      word,
      reading,
      meaning_vi,
      meaning_en,
      part_of_speech,
      jlpt_level,
      example_sentence,
      example_meaning
    });

    await newVocab.save();
    res.status(201).json({ message: 'Lưu từ vựng thành công!', vocab: newVocab });
  } catch (error) {
    console.error('Error saving vocabulary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { title, youtube_url, jlpt_level, script } = req.body;

    const ytMatch = youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    const ytId = ytMatch ? ytMatch[1] : null;
    const thumbnail_url = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';

    const newVideo = new Video({
      title,
      youtube_url,
      thumbnail_url,
      jlpt_level: jlpt_level || 'Unknown',
      script,
      creator: req.user.id || req.user.userId
    });

    await newVideo.save();

    res.status(201).json({ message: 'Lưu Video Script thành công', videoId: newVideo._id });
  } catch (error) {
    console.error('Lỗi khi lưu video:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/detail/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video không tồn tại' });

    // Tạo data tương thích với frontend load từ local storage
    res.json({
      id: video._id,
      title: video.title,
      youtube_url: video.youtube_url,
      script: video.script,
      jlpt_level: video.jlpt_level
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
