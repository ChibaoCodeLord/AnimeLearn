import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authMiddleware, restrictTo } from '../middleware/auth.js'
import Vocabulary from '../models/Vocabulary.js';
import Video from '../models/Video.js';
import { indexVideoScript } from '../services/ragChatService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolvePythonCommand() {
  if (process.env.PYTHON_PATH) {
    return process.env.PYTHON_PATH;
  }

  const projectRoot = path.resolve(__dirname, '../../..');
  const venvCandidates = [
    path.join(projectRoot, '.venv', 'Scripts', 'python.exe'),
    path.join(projectRoot, '.venv', 'bin', 'python')
  ];

  for (const candidate of venvCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return 'python';
}

const PYTHON_CMD = resolvePythonCommand();
console.log(`[Video Route] Using Python interpreter: ${PYTHON_CMD}`);

const router = express.Router();

//Router dịch script
//chỉ có user đã đăng nhập mới được tạo script
router.post('/analyze', authMiddleware, (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Define Path to python script
  const scriptPath = path.join(__dirname, '../scripts/transcribe.py');

  // Start python process
  const pythonProcess = spawn(PYTHON_CMD, [scriptPath, url]);

  const stdoutChunks = [];
  let errorString = '';
  let isHandled = false;

  const tryParseScriptJson = (rawOutput) => {
    const text = (rawOutput || '').trim();
    const startIndex = text.indexOf('[{');
    const endIndex = text.lastIndexOf('}]');
    const emptyStartIndex = text.indexOf('[]');

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      return JSON.parse(text.substring(startIndex, endIndex + 2));
    }
    if (emptyStartIndex !== -1) {
      return [];
    }

    throw new Error('Không tìm thấy dữ liệu mảng JSON trong chuỗi trả về.');
  };

  pythonProcess.stdout.on('data', (data) => {
    stdoutChunks.push(data);
  });

  pythonProcess.stderr.on('data', (data) => {
    errorString += data.toString();
    console.error(`[Python Log]: ${data.toString().trim()}`);
  });

  pythonProcess.on('error', (err) => {
    if (isHandled) return;
    isHandled = true;
    console.error(`Failed to start Python process: ${err.message}`);
    return res.status(500).json({ error: 'Failed to start transcription process', details: err.message });
  });

  pythonProcess.on('close', (code, signal) => {
    if (isHandled) return;
    isHandled = true;
    const dataString = Buffer.concat(stdoutChunks).toString('utf8');

    // Some Windows setups may still produce a non-zero exit code although valid JSON was emitted.
    // If stdout contains parseable script JSON, return success and keep stderr only for logging.
    try {
      const result = tryParseScriptJson(dataString);

      if (code !== 0 || signal) {
        console.warn(`[analyze] Python exited with code=${code}, signal=${signal ?? 'none'} but returned valid JSON output.`);
      }

      return res.json({
        title: "Youtube Video (Auto-Transcription)",
        jlpt_level: "Unknown",
        script: result
      });
    } catch (parseError) {
      console.error(`Process exited with code=${code}, signal=${signal ?? 'none'}. stderr: ${errorString}`);
      console.error('Failed to parse Python output:', dataString);

      const baseError = code !== 0 || signal ? 'Failed to transcribe video' : 'Invalid output format from transcription script';
      return res.status(500).json({
        error: baseError,
        details: errorString,
        exitCode: code,
        signal: signal ?? null
      });
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
    try:
      import unidic_lite
    except Exception:
      unidic_lite = None
    from deep_translator import GoogleTranslator

    def build_tagger():
      if unidic_lite is not None:
        try:
          import os
          dicdir = unidic_lite.DICDIR
          mecabrc = os.path.join(dicdir, "mecabrc")
          return fugashi.Tagger(f'-d "{dicdir}" -r "{mecabrc}"')
        except Exception:
          pass
      try:
        return fugashi.Tagger()
      except Exception:
        return None

    word = sys.argv[1]
    tagger = build_tagger()
    translator = GoogleTranslator(source='ja', target='vi')
    
    meaning = translator.translate(word)
    reading = ""
    pos = "Chưa rõ"
    
    if tagger is not None:
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

  const pythonProcess = spawn(PYTHON_CMD, ['-c', pythonScript, word]);
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
    const existing = await Vocabulary.findOne({ user: req.user.id || req.user.userId, word });
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
  console.log("\nĐã tới router save\n");    
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

    // thêm nội dung video hiện tại vào vector DB
    let ragIndexStatus = { ok: false, message: 'RAG index was not started' };
    ragIndexStatus = indexVideoScript(newVideo._id, script || [])
      .then((ragResult) => {
        // Khi nào xong thì log kết quả ra console của server
        console.log('RAG indexing completed...', ragResult);
      })
      .catch((ragError) => {
        // Nếu lỗi thì log lỗi, không làm ảnh hưởng đến request đã trả về cho user
        console.error('RAG indexing failed...', ragError);
      });

    // Trả về response ngay lập tức
    res.status(201).json({
      message: 'Lưu Video Script thành công',
      videoId: newVideo._id,
      rag: { ok: true, message: 'RAG indexing started asynchronously' }
    });
  } catch (error) {
    console.error('Lỗi khi lưu video:', error);
    res.status(500).json({ error: 'Lỗi tạo script video' });
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
    console.error('Lỗi khi lấy thông tin video:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin video' });
  }
});

export default router;
