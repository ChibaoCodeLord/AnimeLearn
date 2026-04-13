import sys
import json
import os
import subprocess
import tempfile
import shutil
import yt_dlp
import time
from faster_whisper import WhisperModel

try:
    import fugashi
    from deep_translator import GoogleTranslator
except ImportError:
    print("Vui lòng cài đặt thêm thư viện: pip install fugashi unidic-lite deep-translator", file=sys.stderr)
    sys.exit(1)

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

def print_err(msg):
    print(msg, file=sys.stderr, flush=True)

def build_tagger():
    # Prefer bundled UniDic-Lite to avoid relying on a system-wide MeCab config on Windows.
    try:
        import importlib
        unidic_lite = importlib.import_module("unidic_lite")
        dicdir = unidic_lite.DICDIR
        mecabrc = os.path.join(dicdir, "mecabrc")
        opts = f'-d "{dicdir}" -r "{mecabrc}"'
        return fugashi.Tagger(opts)
    except Exception as e:
        print_err(f"Cảnh báo: Không dùng được unidic-lite cho Fugashi: {e}")

    try:
        return fugashi.Tagger()
    except Exception as e:
        print_err(f"Cảnh báo: Không khởi tạo được Fugashi: {e}")
        return None

def safe_feature_attr(feature, attr_name, default=""):
    try:
        value = getattr(feature, attr_name, default)
        return value if value else default
    except Exception:
        return default

def extract_audio_from_video(video_path: str) -> str:
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("Không tìm thấy ffmpeg trong PATH")
    tmpf = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
    audio_path = tmpf.name
    tmpf.close()
    cmd = ["ffmpeg", "-y", "-i", video_path, "-vn", "-acodec", "libmp3lame", "-q:a", "2", audio_path]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return audio_path

def download_youtube_audio(url: str) -> str:
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
    print_err(f"Đang tải audio từ YouTube...")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    files = os.listdir(tmp_dir)
    if not files:
        raise RuntimeError("Không tìm thấy file audio")
    return os.path.join(tmp_dir, files[0])

def add_nvidia_paths():
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

def format_time_mm_ss(seconds: float):
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m:02d}:{s:02d}"

def main():
    if len(sys.argv) < 2:
        print_err("Cần cung cấp URL video")
        sys.exit(1)
        
    add_nvidia_paths()
    media_path = sys.argv[1]
    audio_path = media_path
    tmp_dir_to_delete = None
    tmp_audio_created = False

    try:
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
                print_err("Đang tách audio từ video...")
                audio_path = extract_audio_from_video(media_path)
                tmp_audio_created = True

        model_id = "small"
        # model_id = "kotoba-tech/kotoba-whisper-v2.0"
        print_err(f"Load model: {model_id}")

        try:
            model = WhisperModel(model_id, device="cuda", compute_type="int8_float16")
            print_err("Đang chạy GPU (CUDA)")
        except Exception as e:
            print_err(f"GPU lỗi -> dùng CPU | {e}")
            model = WhisperModel(model_id, device="cpu", compute_type="int8")

        print_err("Đang khởi tạo bộ phân tích (Fugashi) và Trình dịch (Google Translator)...")
        tagger = build_tagger()
        translator = GoogleTranslator(source='ja', target='vi')

        if tagger is None:
            print_err("Tiếp tục không tách từ vựng chi tiết vì Fugashi chưa sẵn sàng.")
            print_err(f"Python đang dùng: {sys.executable}")

        print_err("Transcribing & Dịch thuật...")
        segments, info = model.transcribe(
            audio_path,
            language="ja",
            chunk_length=30,
            condition_on_previous_text=False
        )
        
        results = []
        for seg in segments:
            ja_text = seg.text.strip()
            
            # --- 1. Dịch thuật nguyên câu ---
            vi_text = ""
            if ja_text:
                try:
                    vi_text = translator.translate(ja_text)
                except Exception as e:
                    print_err(f"Lỗi dịch câu: {e}")
            
            # --- 2. Phân tách và dịch từ vựng (Vocabulary) ---
            vocab_list = []
            seen_words = set()
            
            if ja_text and tagger is not None:
                for word in tagger(ja_text):
                    # Chỉ quét các loại từ chính
                    pos = safe_feature_attr(word.feature, 'pos1')
                    
                    if pos in ("名詞", "動詞", "形容詞", "副詞"): # Danh từ, động từ, tính từ, trạng từ
                        lemma = word.feature.lemma if hasattr(word.feature, 'lemma') and word.feature.lemma else word.surface
                        
                        # Loại bỏ lặp từ
                        if lemma in seen_words:
                            continue
                        seen_words.add(lemma)
                        
                        reading = safe_feature_attr(word.feature, 'kana')
                        
                        meaning = ""
                        try:
                            meaning = translator.translate(lemma)
                            time.sleep(0.05) # Giảm tải chút xíu cho API
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
            
        print_err("Đã xử lý xong!")
        
        # 1. Xuất JSON ra stdout để Nodejs đọc
        print(json.dumps(results, ensure_ascii=False))
        
        # 2. Ép đẩy dữ liệu sang Node.js ngay lập tức (Rất quan trọng!)
        sys.stdout.flush() 

        # 3. Tự tay dọn dẹp file audio rác
        if tmp_audio_created:
            try:
                if tmp_dir_to_delete:
                    shutil.rmtree(tmp_dir_to_delete)
                elif os.path.exists(audio_path):
                    os.remove(audio_path)
            except Exception:
                pass

        # 4. RÚT ĐIỆN CÁI RỤP! (Thoát ngay lập tức với mã 0, bỏ qua lỗi giải phóng GPU)
        os._exit(0)

    except Exception as e:
        print_err(f"Lỗi: {e}")
        os._exit(1)

if __name__ == "__main__":
    main()