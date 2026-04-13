"""
Transcribe - Logic xử lý transcription + CLI Entry Point
Tách audio từ video/YouTube, transcribe với Whisper, dịch và phân tích từ vựng
"""

import sys
import json
import os
import subprocess
import tempfile
import shutil
import yt_dlp
import time
from typing import List, Dict, Any, Optional, Tuple
from faster_whisper import WhisperModel

try:
    import fugashi
    from deep_translator import GoogleTranslator
except ImportError:
    print("Vui lòng cài đặt thêm thư viện: pip install fugashi unidic-lite deep-translator", file=sys.stderr)
    sys.exit(1)

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# ============================================================================
# GLOBAL SINGLETON INSTANCES (Lưu RAM, chỉ tải 1 lần)
# ============================================================================

GLOBAL_WHISPER_MODEL = None
GLOBAL_TAGGER = None
GLOBAL_TRANSLATOR = None

def get_whisper_model(use_gpu: bool = True) -> WhisperModel:
    """
    Lấy Whisper model instance (singleton)
    Chỉ tải model lần đầu, những lần sau dùng bản cache
    """
    global GLOBAL_WHISPER_MODEL
    
    if GLOBAL_WHISPER_MODEL is not None:
        return GLOBAL_WHISPER_MODEL
    
    model_id = "small"
    log_err(f"🤖 Load Whisper model lần đầu: {model_id} (lâu ~30-60s)...")

    try:
        if use_gpu:
            GLOBAL_WHISPER_MODEL = WhisperModel(model_id, device="cuda", compute_type="int8_float16")
            log_err("✅ Đang chạy GPU (CUDA)")
        else:
            GLOBAL_WHISPER_MODEL = WhisperModel(model_id, device="cpu", compute_type="int8")
            log_err("✅ Đang chạy CPU")
    except Exception as e:
        log_err(f"⚠️  GPU lỗi -> dùng CPU | {e}")
        GLOBAL_WHISPER_MODEL = WhisperModel(model_id, device="cpu", compute_type="int8")
    
    log_err("✨ Whisper model đã sẵn sàng (lần sau sẽ nhanh hơn!)")
    return GLOBAL_WHISPER_MODEL


def get_tagger() -> Optional[fugashi.Tagger]:
    """
    Lấy Fugashi tagger instance (singleton)
    Chỉ tạo lần đầu, những lần sau dùng bản cache
    """
    global GLOBAL_TAGGER
    
    if GLOBAL_TAGGER is not None:
        return GLOBAL_TAGGER
    
    log_err("📝 Khởi tạo Fugashi tagger lần đầu...")
    GLOBAL_TAGGER = build_tagger()
    
    if GLOBAL_TAGGER:
        log_err("✨ Fugashi tagger đã sẵn sàng")
    
    return GLOBAL_TAGGER


def get_translator() -> GoogleTranslator:
    """
    Lấy Google Translator instance (singleton)
    """
    global GLOBAL_TRANSLATOR
    
    if GLOBAL_TRANSLATOR is not None:
        return GLOBAL_TRANSLATOR
    
    log_err("🌍 Khởi tạo Google Translator...")
    GLOBAL_TRANSLATOR = GoogleTranslator(source='ja', target='vi')
    log_err("✨ Google Translator đã sẵn sàng")
    
    return GLOBAL_TRANSLATOR


def init_transcribe_system(use_gpu: bool = True) -> None:
    """
    Khởi tạo toàn bộ Transcribe system một lần (nên gọi khi server startup)
    Điều này làm cho lần đầu chậm, nhưng những lần sau rất nhanh
    """
    log_err("🚀 Khởi tạo Transcribe System...")
    try:
        get_whisper_model(use_gpu=use_gpu)
        get_tagger()
        get_translator()
        log_err("✅ Transcribe System đã sẵn sàng!")
    except Exception as e:
        log_err(f"❌ Khởi tạo thất bại: {e}")
        raise

# ============================================================================
# LOGGING & UTILITIES
# ============================================================================

def log_err(msg: str) -> None:
    """Log ra stderr"""
    print(msg, file=sys.stderr, flush=True)


def format_time_mm_ss(seconds: float) -> str:
    """Chuyển giây thành MM:SS"""
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m:02d}:{s:02d}"


def add_nvidia_paths() -> None:
    """Thêm NVIDIA paths cho GPU"""
    def find_bin(pkg_name):
        try:
            import importlib.util
            spec = importlib.util.find_spec(pkg_name)
            if spec and spec.submodule_search_locations:
                base = spec.submodule_search_locations[0]
                bin_path = os.path.join(base, "bin")
                if os.path.exists(bin_path):
                    return bin_path
        except Exception:
            pass
        return None

    for pkg in ("nvidia.cublas", "nvidia.cudnn"):
        path = find_bin(pkg)
        if path:
            os.environ["PATH"] = path + os.pathsep + os.environ["PATH"]
            if hasattr(os, "add_dll_directory"):
                os.add_dll_directory(path)


# ============================================================================
# AUDIO HANDLERS
# ============================================================================

def extract_audio_from_video(video_path: str) -> str:
    """Tách audio từ video file"""
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("Không tìm thấy ffmpeg trong PATH")
    tmpf = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
    audio_path = tmpf.name
    tmpf.close()
    cmd = ["ffmpeg", "-y", "-i", video_path, "-vn", "-acodec", "libmp3lame", "-q:a", "2", audio_path]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return audio_path


def download_youtube_audio(url: str) -> str:
    """Tải audio từ YouTube"""
    tmp_dir = tempfile.mkdtemp()
    outtmpl = os.path.join(tmp_dir, "audio.%(ext)s")
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": outtmpl,
        "noplaylist": True,
        "quiet": True,
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "web"]
            }
        }
    }
    log_err("Đang tải audio từ YouTube...")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    files = os.listdir(tmp_dir)
    if not files:
        raise RuntimeError("Không tìm thấy file audio")
    return os.path.join(tmp_dir, files[0])


# ============================================================================
# FUGASHI & TRANSLATION
# ============================================================================

def build_tagger() -> Optional[fugashi.Tagger]:
    """Xây dựng Fugashi tagger"""
    try:
        import importlib
        unidic_lite = importlib.import_module("unidic_lite")
        dicdir = unidic_lite.DICDIR
        mecabrc = os.path.join(dicdir, "mecabrc")
        opts = f'-d "{dicdir}" -r "{mecabrc}"'
        return fugashi.Tagger(opts)
    except Exception as e:
        log_err(f"Cảnh báo: Không dùng được unidic-lite cho Fugashi: {e}")

    try:
        return fugashi.Tagger()
    except Exception as e:
        log_err(f"Cảnh báo: Không khởi tạo được Fugashi: {e}")
        return None


def safe_feature_attr(feature, attr_name: str, default: str = "") -> str:
    """Lấy attribute từ Fugashi feature an toàn"""
    try:
        value = getattr(feature, attr_name, default)
        return value if value else default
    except Exception:
        return default


# ============================================================================
# CORE TRANSCRIPTION (PUBLIC API)
# ============================================================================

def transcribe_media(media_path: str, use_gpu: bool = True) -> List[Dict[str, Any]]:
    """
    Xử lý media file hoặc YouTube URL
    - Lấy audio từ YouTube hoặc tách từ video
    - Transcribe với Whisper
    - Dịch sang Việt
    - Phân tích từ vựng
    
    ⚡ TỐI ƯU: Model được cache lần đầu, lần sau dùng RAM không tải lại
    
    Args:
        media_path: URL YouTube hoặc đường dẫn file video
        use_gpu: Sử dụng GPU (CUDA) nếu có
    
    Returns:
        Danh sách results với timestamp, japanese, vietnamese, vocabulary
    """
    add_nvidia_paths()
    
    audio_path = media_path
    tmp_dir_to_delete = None
    tmp_audio_created = False

    try:
        # === BƯỚC 1: Lấy audio ===
        if media_path.startswith(("http://", "https://")):
            if "youtube.com" in media_path or "youtu.be" in media_path:
                audio_path = download_youtube_audio(media_path)
                tmp_dir_to_delete = os.path.dirname(audio_path)
                tmp_audio_created = True
            else:
                raise ValueError("Chỉ hỗ trợ link YouTube")
        else:
            if not os.path.exists(media_path):
                raise FileNotFoundError(f"Không tìm thấy file: {media_path}")
            ext = os.path.splitext(media_path)[1].lower()
            if ext in (".mp4", ".mkv", ".mov", ".avi", ".webm"):
                log_err("🎬 Đang tách audio từ video...")
                audio_path = extract_audio_from_video(media_path)
                tmp_audio_created = True

        # === BƯỚC 2: Load Whisper Model (CACHED - chỉ lấy từ RAM lần sau) ===
        log_err("⏳ Lấy Whisper model...")
        model = get_whisper_model(use_gpu=use_gpu)

        # === BƯỚC 3: Lấy Fugashi & Translator (CACHED) ===
        log_err("⏳ Lấy Fugashi tagger và Google Translator...")
        tagger = get_tagger()
        translator = get_translator()

        if tagger is None:
            log_err("⚠️  Tiếp tục không tách từ vựng chi tiết vì Fugashi chưa sẵn sàng.")

        # === BƯỚC 4: Transcribe ===
        log_err("🎙️  Đang transcribe audio...")
        segments, info = model.transcribe(
            audio_path,
            language="ja",
            chunk_length=30,
            condition_on_previous_text=False
        )
        
        results = []
        for seg in segments:
            ja_text = seg.text.strip()
            
            # Dịch toàn câu
            vi_text = ""
            if ja_text:
                try:
                    vi_text = translator.translate(ja_text)
                except Exception as e:
                    log_err(f"Lỗi dịch câu: {e}")
            
            # Phân tách và dịch từ vựng
            vocab_list = []
            seen_words = set()
            
            if ja_text and tagger is not None:
                for word in tagger(ja_text):
                    pos = safe_feature_attr(word.feature, 'pos1')
                    
                    if pos in ("名詞", "動詞", "形容詞", "副詞"):
                        lemma = word.feature.lemma if hasattr(word.feature, 'lemma') and word.feature.lemma else word.surface
                        
                        if lemma in seen_words:
                            continue
                        seen_words.add(lemma)
                        
                        reading = safe_feature_attr(word.feature, 'kana')
                        
                        meaning = ""
                        try:
                            meaning = translator.translate(lemma)
                            time.sleep(0.05)
                        except Exception:
                            pass
                            
                        pos_vi = pos
                        if pos == "名詞": pos_vi = "Danh từ"
                        elif pos == "動詞": pos_vi = "Động từ"
                        elif pos == "形容詞": pos_vi = "Tính từ"
                        elif pos == "副詞": pos_vi = "Trạng từ"
                        
                        vocab_list.append({
                            "word": lemma,
                            "reading": reading,
                            "meaning": meaning,
                            "pos": pos_vi
                        })
                        
            results.append({
                "timestamp": format_time_mm_ss(seg.start),
                "japanese": ja_text,
                "vietnamese": vi_text,
                "vocabulary": vocab_list
            })
            
        log_err("✅ Đã xử lý xong!")
        
        return results

    finally:
        # Dọn dẹp file tạm
        if tmp_audio_created:
            try:
                if tmp_dir_to_delete:
                    shutil.rmtree(tmp_dir_to_delete)
                elif os.path.exists(audio_path):
                    os.remove(audio_path)
            except Exception:
                pass


# ============================================================================
# CLI ENTRY POINT
# ============================================================================

def main():
    """CLI entry point - xử lý transcription từ command line"""
    if len(sys.argv) < 2:
        log_err("Cần cung cấp URL video hoặc đường dẫn file")
        sys.exit(1)

    media_path = sys.argv[1]

    try:
        # Khởi tạo models lần đầu (để lần sau nhanh hơn)
        log_err("🔧 Khởi tạo hệ thống (lần đầu sẽ lâu)...")
        init_transcribe_system(use_gpu=True)
        
        # Transcribe
        log_err(f"📥 Bắt đầu transcribe: {media_path}")
        results = transcribe_media(media_path, use_gpu=True)
        
        # Xuất JSON ra stdout để Node.js đọc
        print(json.dumps(results, ensure_ascii=False))
        
        # Ép đẩy dữ liệu ngay lập tức
        sys.stdout.flush()
        
        # Thoát ngay (bỏ qua lỗi giải phóng GPU)
        os._exit(0)

    except Exception as e:
        log_err(f"❌ Lỗi: {e}")
        os._exit(1)


if __name__ == "__main__":
    main()

