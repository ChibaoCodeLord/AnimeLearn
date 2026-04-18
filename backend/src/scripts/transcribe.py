import sys
import json
import os
import subprocess
import tempfile
import shutil
import yt_dlp
import time
import urllib.request
import urllib.error

# ==========================================
# MA THUẬT: KHÓA MÕM CÁC THƯ VIỆN IN RÁC RA STDOUT
# ==========================================
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Lưu lại luồng Stdout gốc (sạch)
REAL_STDOUT = sys.stdout
# Ép tất cả lệnh print() thông thường chảy vào Stderr
sys.stdout = sys.stderr 

from faster_whisper import WhisperModel

try:
    from sudachipy import tokenizer
    from sudachipy import dictionary
    from deep_translator import GoogleTranslator
except ImportError:
    print("Vui lòng cài đặt thêm thư viện: pip install sudachipy sudachidict_core sudachidict_full deep-translator", file=sys.stderr)
    sys.exit(1)

# ==========================================
# 1. BIẾN GLOBAL ĐỂ GIỮ MODEL TRÊN RAM
# ==========================================
global_model = None
global_tokenizer_obj = None
global_split_mode = None
global_translator = None

# ==========================================
# 2. CÁC HÀM TIỆN ÍCH & XỬ LÝ ÂM THANH
# ==========================================
def log_err(msg):
    """Hàm log lỗi ra stderr"""
    print(msg, file=sys.stderr, flush=True)

class YTDLPLogger(object):
    def debug(self, msg): pass
    def warning(self, msg): log_err(f"YT-DLP Warning: {msg}")
    def error(self, msg): log_err(f"YT-DLP Error: {msg}")

def build_tokenizer():
    try:
        tokenizer_obj = dictionary.Dictionary(dict="full").create()
        mode = tokenizer.Tokenizer.SplitMode.C
        return tokenizer_obj, mode
    except Exception as e:
        log_err(f"Cảnh báo: Không khởi tạo được SudachiPy: {e}")
        return None, None

def lookup_words_via_api(words_list):
    if not words_list:
        return {}
    url = "http://localhost:5000/api/dictionary/lookup"
    payload = json.dumps({"words": words_list}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            if res_data.get("success"):
                return res_data.get("data", {})
    except Exception as e:
        log_err(f"Lỗi gọi API từ điển Local: {e}")
    return {}

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
        "no_warnings": True, 
        "logger": YTDLPLogger(), 
        "extractor_args": {"youtube": {"player_client": ["android", "web"]}}
    }
    log_err(f"Đang tải audio từ YouTube...")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    files = os.listdir(tmp_dir)
    if not files:
        raise RuntimeError("Không tìm thấy file audio")
    return os.path.join(tmp_dir, files[0])

def preprocess_audio_for_vocals(input_audio: str) -> str:
    log_err("Đang tiền xử lý âm thanh (Lọc ồn, làm rõ giọng nói)...")
    if shutil.which("ffmpeg") is None:
        return input_audio
    tmpf = tempfile.NamedTemporaryFile(delete=False, suffix="_cleaned.mp3")
    cleaned_path = tmpf.name
    tmpf.close()
    filters = "highpass=f=80,lowpass=f=8000,afftdn=nf=-20"
    cmd = ["ffmpeg", "-y", "-i", input_audio, "-af", filters, "-vn", "-acodec", "libmp3lame", "-q:a", "2", cleaned_path]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return cleaned_path
    except Exception as e:
        log_err(f"Lỗi khi tiền xử lý âm thanh: {e}. Sẽ dùng file gốc.")
        return input_audio

def add_nvidia_paths():
    def find_bin(pkg_name):
        try:
            import importlib.util
            spec = importlib.util.find_spec(pkg_name)
            if spec and spec.submodule_search_locations:
                base = spec.submodule_search_locations[0]
                bin_path = os.path.join(base, "bin")
                if os.path.exists(bin_path): return bin_path
        except Exception: pass
        return None
    for pkg in ("nvidia.cublas", "nvidia.cudnn"):
        path = find_bin(pkg)
        if path:
            os.environ["PATH"] = path + os.pathsep + os.environ["PATH"]
            if hasattr(os, "add_dll_directory"): os.add_dll_directory(path)

def format_time_mm_ss(seconds: float):
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m:02d}:{s:02d}"

# ==========================================
# 3. HÀM EXPORT CHO server_AI.py
# ==========================================

def init_transcribe_system(use_gpu: bool = True):
    global global_model, global_tokenizer_obj, global_split_mode, global_translator
    log_err("Đang khởi tạo hệ thống AI (Whisper + SudachiPy)...")
    
    if use_gpu:
        add_nvidia_paths()
        
    model_id = "large-v3-turbo"
    try:
        device = "cuda" if use_gpu else "cpu"
        compute_type = "int8_float16" if use_gpu else "int8"
        global_model = WhisperModel(model_id, device=device, compute_type=compute_type)
        log_err(f"✅ Đang chạy Whisper trên {device.upper()}")
    except Exception as e:
        log_err(f"⚠️ GPU lỗi -> Dùng CPU | {e}")
        global_model = WhisperModel(model_id, device="cpu", compute_type="int8")

    global_tokenizer_obj, global_split_mode = build_tokenizer()
    global_translator = GoogleTranslator(source='ja', target='vi')
    log_err("✅ Khởi tạo hệ thống thành công!")
    return True

def transcribe_media(media_path: str, use_gpu: bool = True):
    global global_model, global_tokenizer_obj, global_split_mode, global_translator
    
    if global_model is None:
        init_transcribe_system(use_gpu)

    raw_audio_path = media_path
    tmp_dir_to_delete = None
    tmp_audio_created = False
    audio_path = None
    results = []

    try:
        if media_path.startswith(("http://", "https://")):
            if "youtube.com" in media_path or "youtu.be" in media_path:
                raw_audio_path = download_youtube_audio(media_path)
                tmp_dir_to_delete = os.path.dirname(raw_audio_path)
                tmp_audio_created = True
            else:
                raise ValueError("Chỉ hỗ trợ link YouTube")
        else:
            if not os.path.exists(media_path):
                raise FileNotFoundError(f"Không tìm thấy file: {media_path}")
            ext = os.path.splitext(media_path)[1].lower()
            if ext in (".mp4", ".mkv", ".mov", ".avi", ".webm"):
                log_err("Đang tách audio từ video...")
                raw_audio_path = extract_audio_from_video(media_path)
                tmp_audio_created = True

        audio_path = preprocess_audio_for_vocals(raw_audio_path)

        log_err("Transcribing & Dịch thuật (Đã tối ưu timestamp siêu chuẩn)...")
        general_prompt = "これは歌の歌詞、またはアニメのセリフです。文脈に合わせて、漢字と句読点を正しく使って文字起こししてください。"
        
        HALLUCINATION_BLACKLIST = [
            "字幕", "初音ミク", "ご視聴", 
            "再生リスト", 
            "評価お願い", "twitter", "tiktok", "instagram"
        ]

        segments, info = global_model.transcribe(
            audio_path,
            language="ja",
            condition_on_previous_text=False,
            initial_prompt=general_prompt,
            vad_filter=False,
            beam_size=5,
            word_timestamps=True, # TÍNH NĂNG VÀNG: Căn giờ chuẩn xác đến từng chữ cái!
            temperature=[0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
            no_speech_threshold=0.6 
        )
        
        for seg in segments:
            ja_text = seg.text.strip()
            
            if not ja_text:
                continue
                
            clean_text = ja_text.replace("。", "").replace("、", "").replace("！", "").replace("？", "").replace("♪", "").replace("～", "").strip()
            if len(clean_text) == 0:
                continue
                
            is_hallucination = any(bad_word in ja_text.lower() for bad_word in HALLUCINATION_BLACKLIST)
            if is_hallucination:
                log_err(f"🛡️ Đã chặn câu bịa đặt (Ảo giác): {ja_text}")
                continue

            vi_text = ""
            if ja_text:
                try:
                    vi_text = global_translator.translate(ja_text)
                except Exception as e:
                    log_err(f"Lỗi dịch câu: {e}")
            
            temp_vocab_list = []
            words_to_lookup = []
            seen_words = set()
            
            if ja_text and global_tokenizer_obj is not None:
                tokens = global_tokenizer_obj.tokenize(ja_text, global_split_mode)
                i = 0
                while i < len(tokens):
                    word = tokens[i]
                    pos = word.part_of_speech()[0]
                    
                    if pos in ("名詞", "動詞", "形容詞", "副詞"):
                        chunk_surface = word.surface()
                        base_words = [(word.dictionary_form(), pos)]
                        
                        if pos in ("動詞", "形容詞"):
                            j = i + 1
                            while j < len(tokens):
                                next_word = tokens[j]
                                next_pos = next_word.part_of_speech()[0]
                                if next_pos in ("助動詞", "助詞", "動詞", "接尾辞"):
                                    chunk_surface += next_word.surface()
                                    if next_pos in ("動詞", "形容詞"):
                                        base_words.append((next_word.dictionary_form(), next_pos))
                                    j += 1
                                else:
                                    break
                            i = j
                        else:
                            i += 1
                            
                        chunk_translation = ""
                        if pos in ("動詞", "形容詞") and chunk_surface != base_words[0][0]:
                            try:
                                chunk_translation = global_translator.translate(chunk_surface)
                                time.sleep(0.05) 
                            except Exception: pass
                        
                        for lemma, raw_pos in base_words:
                            if lemma in seen_words: continue
                            seen_words.add(lemma)
                            pos_vi = "Danh từ" if raw_pos == "名詞" else ("Động từ" if raw_pos == "動詞" else ("Tính từ" if raw_pos == "形容詞" else "Trạng từ"))
                            
                            words_to_lookup.append(lemma)
                            temp_vocab_list.append({
                                "word": lemma,
                                "reading": "", 
                                "pos": pos_vi,
                                "chunk_surface": chunk_surface if chunk_translation else "",
                                "chunk_translation": chunk_translation,
                                "meaning": ""
                            })
                    else:
                        i += 1
            
            if words_to_lookup:
                dict_results = lookup_words_via_api(words_to_lookup)
                for vocab in temp_vocab_list:
                    w = vocab["word"]
                    base_meaning = ""
                    if w in dict_results and len(dict_results[w]) > 0:
                        vocab["reading"] = dict_results[w][0].get("reading", "")
                        meanings_array = dict_results[w][0].get("meanings", [])
                        base_meaning = "\n".join(meanings_array).strip()
                    else:
                        try:
                            fallback_meaning = global_translator.translate(w)
                            base_meaning = fallback_meaning
                            time.sleep(0.05) 
                        except Exception as e:
                            log_err(f"Lỗi Google Dịch (Fallback) cho từ {w}: {e}")
                            base_meaning = "Không tìm thấy dữ liệu từ điển offline cho từ này."
                        
                    if vocab.get("chunk_translation"):
                        base_meaning += f"\n\n[Ngữ cảnh trong video]\n• {vocab['chunk_surface']}: {vocab['chunk_translation']}"
                        
                    vocab["meaning"] = base_meaning
                    vocab.pop("chunk_surface", None)
                    vocab.pop("chunk_translation", None)
            
            results.append({
                "timestamp": format_time_mm_ss(seg.start),
                "start": round(seg.start, 3), # THÊM start chuẩn xác (để Frontend xài)
                "end": round(seg.end, 3),     # THÊM end chuẩn xác
                "japanese": ja_text,
                "vietnamese": vi_text,
                "vocabulary": temp_vocab_list
            })
            
        log_err("Đã bóc băng và xử lý xong 1 video!")
        return results

    except Exception as e:
        log_err(f"Lỗi hệ thống: {e}")
        raise e

    finally:
        if tmp_audio_created:
            try:
                if tmp_dir_to_delete: shutil.rmtree(tmp_dir_to_delete)
                elif os.path.exists(raw_audio_path): os.remove(raw_audio_path)
            except Exception: pass
        if audio_path and audio_path != raw_audio_path and os.path.exists(audio_path):
            try: os.remove(audio_path)
            except Exception: pass

if __name__ == "__main__":
    if len(sys.argv) < 2:
        log_err("Cần cung cấp URL video")
        sys.exit(1)
    
    init_transcribe_system()
    final_results = transcribe_media(sys.argv[1])
    
    print(json.dumps(final_results, ensure_ascii=False), file=REAL_STDOUT)
    REAL_STDOUT.flush()
    os._exit(0)