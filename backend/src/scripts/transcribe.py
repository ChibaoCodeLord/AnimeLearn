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
from faster_whisper import WhisperModel

try:
    from sudachipy import tokenizer
    from sudachipy import dictionary
    from deep_translator import GoogleTranslator
except ImportError:
    print("Vui lòng cài đặt thêm thư viện: pip install sudachipy sudachidict_core sudachidict_full deep-translator", file=sys.stderr)
    sys.exit(1)

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

def print_err(msg):
    print(msg, file=sys.stderr, flush=True)

def build_tokenizer():
    """Khởi tạo SudachiPy Tokenizer với từ điển FULL"""
    try:
        tokenizer_obj = dictionary.Dictionary(dict="full").create()
        mode = tokenizer.Tokenizer.SplitMode.C
        return tokenizer_obj, mode
    except Exception as e:
        print_err(f"Cảnh báo: Không khởi tạo được SudachiPy (Hãy chắc chắn đã cài sudachidict_full): {e}")
        return None, None

def lookup_words_via_api(words_list):
    """Hàm gọi API Node.js nội bộ để tra danh sách từ vựng"""
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
        print_err(f"Lỗi gọi API từ điển Local: {e}")
    
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

def preprocess_audio_for_vocals(input_audio: str) -> str:
    """Tiền xử lý: Lọc ồn, cắt bỏ tần số dư thừa, chuẩn hóa âm lượng cho giọng nói"""
    print_err("Đang tiền xử lý âm thanh (Lọc ồn, làm rõ giọng nói)...")
    if shutil.which("ffmpeg") is None:
        print_err("Cảnh báo: Không tìm thấy FFmpeg, bỏ qua bước tiền xử lý.")
        return input_audio

    tmpf = tempfile.NamedTemporaryFile(delete=False, suffix="_cleaned.mp3")
    cleaned_path = tmpf.name
    tmpf.close()

    filters = "highpass=f=80,lowpass=f=8000,afftdn=nf=-20,loudnorm"

    cmd = [
        "ffmpeg", "-y", "-i", input_audio,
        "-af", filters,
        "-vn", "-acodec", "libmp3lame", "-q:a", "2",
        cleaned_path
    ]

    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return cleaned_path
    except Exception as e:
        print_err(f"Lỗi khi tiền xử lý âm thanh: {e}. Sẽ dùng file gốc.")
        return input_audio

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
    raw_audio_path = media_path
    tmp_dir_to_delete = None
    tmp_audio_created = False

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
                print_err("Đang tách audio từ video...")
                raw_audio_path = extract_audio_from_video(media_path)
                tmp_audio_created = True

        audio_path = preprocess_audio_for_vocals(raw_audio_path)

        model_id = "large-v3-turbo"
        print_err(f"Load model: {model_id}")

        try:
            model = WhisperModel(model_id, device="cuda", compute_type="int8_float16")
            print_err("Đang chạy GPU (CUDA)")
        except Exception as e:
            print_err(f"GPU lỗi -> dùng CPU | {e}")
            model = WhisperModel(model_id, device="cpu", compute_type="int8")

        print_err("Đang khởi tạo bộ phân tích (SudachiPy FULL) và Trình dịch (Google Translator)...")
        tokenizer_obj, split_mode = build_tokenizer()
        translator = GoogleTranslator(source='ja', target='vi')

        if tokenizer_obj is None:
            print_err("Tiếp tục không tách từ vựng chi tiết vì SudachiPy chưa sẵn sàng.")
            
        print_err("Transcribing & Dịch thuật...")
        
        general_prompt = "こんにちは！これは自然な日本語の音声です。文脈に合わせて、漢字と句読点を正しく使って文字起こししてください。"
        
        segments, info = model.transcribe(
            audio_path,
            language="ja",
            condition_on_previous_text=False,
            initial_prompt=general_prompt,
            vad_parameters=dict(
                min_silence_duration_ms=500, # Tự động cắt câu ngay khi có khoảng lặng 400 mili-giây
                speech_pad_ms=100 # Giữ lại 100ms âm thanh ở đầu/cuối câu để không bị hụt tiếng
            )
        )
        
        results = []
        for seg in segments:
            ja_text = seg.text.strip()
            
            # --- 1. DỊCH CÂU: Bằng Google Translate ---
            vi_text = ""
            if ja_text:
                try:
                    vi_text = translator.translate(ja_text)
                except Exception as e:
                    print_err(f"Lỗi dịch câu: {e}")
            
            # --- 2. TÁCH TỪ VỰNG: Bằng SudachiPy (Tách Kanji gốc) ---
            temp_vocab_list = []
            words_to_lookup = []
            seen_words = set()
            
            if ja_text and tokenizer_obj is not None:
                tokens = tokenizer_obj.tokenize(ja_text, split_mode)
                
                i = 0
                while i < len(tokens):
                    word = tokens[i]
                    pos = word.part_of_speech()[0]
                    
                    if pos in ("名詞", "動詞", "形容詞", "副詞"):
                        chunk_surface = word.surface()
                        
                        # Danh sách chứa các từ gốc (Kanji) sẽ bóc tách được trong cụm này
                        base_words = [(word.dictionary_form(), pos)]
                        
                        # Nếu là động/tính từ, quét tiếp các thành phần phụ nối đuôi
                        if pos in ("動詞", "形容詞"):
                            j = i + 1
                            while j < len(tokens):
                                next_word = tokens[j]
                                next_pos = next_word.part_of_speech()[0]
                                
                                # Gộp các trợ động từ, trợ từ, hậu tố vào chung 1 cụm để lấy ngữ cảnh
                                if next_pos in ("助動詞", "助詞", "動詞", "接尾辞"):
                                    chunk_surface += next_word.surface()
                                    # Nếu trong cụm có thêm 1 động từ ghép khác, rút tiếp gốc Kanji của nó
                                    if next_pos in ("動詞", "形容詞"):
                                        base_words.append((next_word.dictionary_form(), next_pos))
                                    j += 1
                                else:
                                    break
                            i = j
                        else:
                            i += 1
                            
                        # Dịch cả cụm từ (Chỉ dịch nếu cụm từ đã bị chia/nối đuôi dài hơn từ gốc)
                        chunk_translation = ""
                        if pos in ("動詞", "形容詞") and chunk_surface != base_words[0][0]:
                            try:
                                chunk_translation = translator.translate(chunk_surface)
                                time.sleep(0.05) # Giảm tải Google API
                            except Exception:
                                pass
                        
                        # Lưu các gốc Kanji đã bóc tách được vào danh sách cần tra
                        for lemma, raw_pos in base_words:
                            if lemma in seen_words:
                                continue
                            seen_words.add(lemma)
                            
                            pos_vi = "Danh từ" if raw_pos == "名詞" else ("Động từ" if raw_pos == "動詞" else ("Tính từ" if raw_pos == "形容詞" else "Trạng từ"))
                            
                            words_to_lookup.append(lemma)
                            temp_vocab_list.append({
                                "word": lemma,
                                "reading": "", # Để trống cho API DB tự điền cách đọc chuẩn
                                "pos": pos_vi,
                                "chunk_surface": chunk_surface if chunk_translation else "",
                                "chunk_translation": chunk_translation,
                                "meaning": ""
                            })
                    else:
                        i += 1
            
            # --- 3. DỊCH TỪ VỰNG: Bằng API MongoDB (Và nối ngữ cảnh) ---
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
                        base_meaning = "Không tìm thấy dữ liệu từ điển offline cho từ này."
                        
                    # Gộp nghĩa ngữ cảnh (nếu có) vào phía sau cùng của định nghĩa
                    # Giúp giao diện React không bị mất dòng Âm Hán Việt
                    if vocab.get("chunk_translation"):
                        base_meaning += f"\n\n[Ngữ cảnh trong video]\n• {vocab['chunk_surface']}: {vocab['chunk_translation']}"
                        
                    vocab["meaning"] = base_meaning
                    
                    # Dọn dẹp key tạm thời để file JSON xuất ra được sạch sẽ
                    vocab.pop("chunk_surface", None)
                    vocab.pop("chunk_translation", None)
            
            results.append({
                "timestamp": format_time_mm_ss(seg.start),
                "japanese": ja_text,
                "vietnamese": vi_text,
                "vocabulary": temp_vocab_list
            })
            
        print_err("Đã xử lý xong!")
        
        # 1. Xuất JSON ra stdout để Nodejs đọc
        print(json.dumps(results, ensure_ascii=False))
        sys.stdout.flush() 

        # Dọn dẹp file rác
        if tmp_audio_created:
            try:
                if tmp_dir_to_delete:
                    shutil.rmtree(tmp_dir_to_delete)
                elif os.path.exists(raw_audio_path):
                    os.remove(raw_audio_path)
            except Exception:
                pass
        
        if audio_path != raw_audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except Exception:
                pass

        os._exit(0)

    except Exception as e:
        print_err(f"Lỗi: {e}")
        os._exit(1)

if __name__ == "__main__":
    main()