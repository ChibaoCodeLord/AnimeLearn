import argparse
import json
import os
import io
import re
import sys
import traceback
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import chromadb
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from openai import OpenAI

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

#làm sạch ký tự vì Khi bộ mã hóa (Tokenizer) được viết bằng ngôn ngữ Rust của 
# Hugging Face đọc đến ký tự lỗi này, nó không thể chuyển đổi sang chuỗi chuẩn (UTF-8). 
# Thay vì báo lỗi "Ký tự không hợp lệ", hệ thống kết nối PyO3 của Rust lại báo một lỗi chung chung là 
# TypeError: TextEncodeInput must be Union... khiến chúng ta hiểu lầm là lỗi do code.
def sanitize_text(text: Any) -> str:
    """Làm sạch chuỗi, loại bỏ các ký tự Unicode lỗi khiến Rust Tokenizer bị crash"""
    if text is None:
        return ""
    text = str(text)
    # Loại bỏ Null bytes
    text = text.replace('\x00', '')
    # Loại bỏ các ký tự Surrogate (U+D800 đến U+DFFF) - Thủ phạm chính gây lỗi
    text = re.sub(r'[\ud800-\udfff]', '', text)
    return text.encode('utf-8', 'ignore').decode('utf-8').strip()

def _log(message: str) -> None:
    print(message, file=sys.stderr, flush=True)


BACKEND_DIR = Path(__file__).resolve().parents[2]
# Tải biến môi trường (Giữ nguyên cả .evn phòng trường hợp bạn gõ sai tên file thực tế)
load_dotenv(BACKEND_DIR / ".evn")
load_dotenv(BACKEND_DIR / ".env")

EMBED_MODEL = os.getenv("RAG_EMBED_MODEL", "intfloat/multilingual-e5-base")
COLLECTION_NAME = os.getenv("RAG_COLLECTION", "video_script_rag")
K_DEFAULT = int(os.getenv("RAG_TOP_K", "4"))
CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "3"))
CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "1"))

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3:8b-instruct-q4_K_M")


@dataclass
class ScriptLine:
    text_jp: str
    text_vn: str
    ts: str


def _db_path() -> str:
    custom = os.getenv("RAG_DB_PATH", "").strip()
    if custom:
        return custom
    base = BACKEND_DIR  # backend/
    return str(base / "rag" / "chroma_db")


def _resolve_chroma_class():
    import importlib
    try:
        module = importlib.import_module("langchain_chroma")
        return getattr(module, "Chroma")
    except Exception:
        module = importlib.import_module("langchain_community.vectorstores")
        return getattr(module, "Chroma")


def _vectorstore() -> Tuple[Any, chromadb.ClientAPI]:
    db_path = _db_path()
    os.makedirs(db_path, exist_ok=True)

    chroma_client = chromadb.PersistentClient(path=db_path)
    
    # SỬ DỤNG CLASS MẶC ĐỊNH: Tự động dùng GPU nếu có, tự động xử lý kiểu dữ liệu
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBED_MODEL,
        encode_kwargs={'normalize_embeddings': True}
    )
    
    Chroma = _resolve_chroma_class()

    store = Chroma(
        client=chroma_client,
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
    )
    return store, chroma_client


def _parse_ts_to_seconds(ts: str) -> float:
    if not ts:
        return -1.0
    ts = ts.strip()
    if not ts:
        return -1.0
    parts = ts.split(":")
    try:
        if len(parts) == 2:
            mm = float(parts[0])
            ss = float(parts[1])
            return mm * 60 + ss
        if len(parts) == 3:
            hh = float(parts[0])
            mm = float(parts[1])
            ss = float(parts[2])
            return hh * 3600 + mm * 60 + ss
    except Exception:
        return -1.0
    return -1.0


def _normalize_line(item: Dict[str, Any]) -> Optional[ScriptLine]:
    # Lấy và làm sạch tiếng Nhật
    jp = str(item.get("japanese") or item.get("line_jp") or item.get("jp") or item.get("text") or "")
    jp = sanitize_text(jp)
    
    if not jp:
        return None

    # Lấy và làm sạch tiếng Việt
    vn = str(item.get("vietnamese") or item.get("line_vn") or item.get("vn") or "")
    vn = sanitize_text(vn)
    
    ts = str(item.get("timestamp") or item.get("start_time") or item.get("start") or "").strip()

    if ts and re.fullmatch(r"\d+(\.\d+)?", ts):
        sec = float(ts)
        m = int(sec // 60)
        s = sec - m * 60
        ts = f"{m:02d}:{s:05.2f}"

    return ScriptLine(text_jp=jp, text_vn=vn, ts=ts)


def _chunk_lines(lines: List[ScriptLine], chunk_size: int, overlap: int) -> List[Tuple[int, List[ScriptLine]]]:
    if not lines:
        return []
    chunk_size = max(1, chunk_size)
    overlap = max(0, min(overlap, chunk_size - 1))
    step = max(1, chunk_size - overlap)

    chunks: List[Tuple[int, List[ScriptLine]]] = []
    start = 0
    while start < len(lines):
        end = min(start + chunk_size, len(lines))
        chunks.append((start, lines[start:end]))
        if end == len(lines):
            break
        start += step
    return chunks


def _build_chunk_text(video_id: str, lines: List[ScriptLine]) -> str:
    joined_lines = []
    joined_lines.append(f"VIDEO_ID: {video_id}")
    for line in lines:
        if line.ts:
            joined_lines.append(f"[{line.ts}] JP: {line.text_jp}\nVN: {line.text_vn}".strip())
        else:
            joined_lines.append(f"JP: {line.text_jp}\nVN: {line.text_vn}".strip())
    return "\n\n".join(joined_lines)


def _build_history_text(history: Any) -> str:
    if not isinstance(history, list):
        return ""
    parts: List[str] = []
    for item in history[-4:]:
        if not isinstance(item, dict):
            continue
        # sanitize cả câu hỏi và câu trả lời cũ
        q = sanitize_text(item.get("question") or "")
        a = sanitize_text(item.get("answer") or "")
        if q:
            parts.append(f"User: {q}")
        if a:
            parts.append(f"Assistant: {a}")
    return "\n".join(parts).strip()


def _build_llm_client() -> Tuple[OpenAI, str]:
    if OPENAI_API_KEY:
        return OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL or None), OPENAI_MODEL
    # Fallback to local Ollama OpenAI-compatible API.
    return OpenAI(api_key="ollama", base_url=OLLAMA_BASE_URL), OLLAMA_MODEL


def _ask_llm(context: str, question: str, history: Any) -> str:
    _log("Da goi hoi LLM")
    client, model = _build_llm_client()
    history_text = _build_history_text(history)

    system_content = (
        "Ban la tro ly hoc tieng Nhat cho nen tang AnimeLearn. "
        "Chi tra loi dua tren Context duoc cung cap va lien quan truc tiep den video hien tai. "
        "Neu context khong du thong tin thi tra loi ro rang: 'Toi khong tim thay thong tin trong video nay.' "
        "Tra loi bằng tiếng Việt, ngan gon, de hieu, co the trich dan timestamp neu co."
    )

    user_parts = []
    if history_text:
        user_parts.append(f"History:\n{history_text}")
    user_parts.append(f"Context:\n{context}")
    user_parts.append(f"Question: {question}")

    resp = client.chat.completions.create(
        model=model,
        temperature=0.0,
        messages=[
            {"role": "system", "content": system_content},
            {"role": "user", "content": "\n\n".join(user_parts)},
        ],
    )
    return (resp.choices[0].message.content or "").strip()


def ingest(payload: Dict[str, Any]) -> Dict[str, Any]:
    _log("Đã gọi hàm ingest")
    video_id = str(payload.get("video_id") or "").strip()
    script = payload.get("script")

    if not video_id:
        raise ValueError("Missing video_id")
    if not isinstance(script, list):
        raise ValueError("script must be a list")

    lines = []
    for item in script:
        if not isinstance(item, dict):
            continue
        normalized = _normalize_line(item)
        if normalized:
            lines.append(normalized)

    if not lines:
        return {
            "ok": True,
            "video_id": video_id,
            "chunks_indexed": 0,
            "message": "No valid Japanese lines to index",
        }

    store, chroma_client = _vectorstore()
    collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)

    # Re-indexing the same video should replace old chunks.
    collection.delete(where={"video_id": video_id})

    chunks = _chunk_lines(lines, CHUNK_SIZE, CHUNK_OVERLAP)
    docs: List[str] = []
    ids: List[str] = []
    metadatas: List[Dict[str, Any]] = []
    
    for idx, (start_idx, chunk_lines) in enumerate(chunks):
        text = _build_chunk_text(video_id, chunk_lines)
        first_ts = chunk_lines[0].ts if chunk_lines and chunk_lines[0].ts else ""
        first_ts_sec = _parse_ts_to_seconds(first_ts)

        docs.append(f"passage: {text}")
        ids.append(f"{video_id}_chunk_{idx}")
        metadatas.append(
            {
                "video_id": video_id,
                "chunk_index": idx,
                "line_start": start_idx,
                "line_end": start_idx + len(chunk_lines) - 1,
                "timestamp": first_ts,
                "timestamp_sec": first_ts_sec,
            }
        )
        _log(f"\n CHUAN BI NAP vao DB chunk {idx + 1}/{len(chunks)}...")

    # Tiến hành nạp (Sử dụng class chuẩn nên sẽ không còn lỗi Type Error)
    store.add_texts(texts=docs, ids=ids, metadatas=metadatas)
    _log("=> INGEST THANH CONG!")

    return {
        "ok": True,
        "video_id": video_id,
        "chunks_indexed": len(docs),
        "message": "Indexed successfully",
    }


def chat(payload: Dict[str, Any]) -> Dict[str, Any]:
    video_id = str(payload.get("video_id") or "").strip()
    question = sanitize_text(payload.get("question") or "")
    history = payload.get("history")
    k = int(payload.get("k") or K_DEFAULT)

    _log("\nĐã gọi hàm chat")
    _log(f"video id: {video_id}")
    _log(f"question: {question}\n")

    if not video_id or not question:
        raise ValueError("Missing video_id or question")

    store, _ = _vectorstore()
    
    docs = store.similarity_search(
        query=f"query: {question}",
        k=max(1, k),
        filter={"video_id": video_id},
    )

    # FIX LỖI INDEX OUT OF RANGE: Kiểm tra docs rỗng trước khi truy cập docs[0]
    if not docs:
        _log(f"[RAG WARNING] Không tìm thấy dữ liệu cho video_id: {video_id} trong ChromaDB.")
        return {
            "ok": True,
            "video_id": video_id,
            "answer": "Toi khong tim thay thong tin trong video nay.",
            "sources": [],
        }

    _log(f"query DB (Preview chunk 1): {docs[0].page_content[:100]}...\n")

    context_parts: List[str] = []
    sources: List[Dict[str, Any]] = []

    for d in docs:
        metadata = d.metadata or {}
        raw_text = d.page_content or ""
        cleaned_text = sanitize_text(raw_text[9:] if raw_text.startswith("passage: ") else raw_text)

        timestamp = str(metadata.get("timestamp") or "").strip()
        chunk_index = metadata.get("chunk_index")

        if timestamp:
            context_parts.append(f"[{timestamp}] {cleaned_text}")
        else:
            context_parts.append(cleaned_text)

        sources.append(
            {
                "chunk_index": chunk_index,
                "timestamp": timestamp,
                "line_start": metadata.get("line_start"),
                "line_end": metadata.get("line_end"),
            }
        )

    context = "\n\n".join(context_parts)

    try:
        answer = _ask_llm(context=context, question=question, history=history)
        if not answer:
            answer = "Toi khong tim thay thong tin trong video nay."
    except Exception as ex:
        _log(f"LỖI LLM: {str(ex)}")
        answer = "Toi da tim duoc noi dung lien quan trong video, nhung he thong AI hien tai dang gap loi."
        sources.append({"error": str(ex)})

    return {
        "ok": True,
        "video_id": video_id,
        "answer": answer,
        "sources": sources,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["ingest", "chat"])
    args = parser.parse_args()

    input_stream = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
    raw_input = input_stream.read().strip()
    payload = json.loads(raw_input) if raw_input else {}

    if args.action == "ingest":
        result = ingest(payload)
    else:
        result = chat(payload)

    # Trả về kết quả JSON chuẩn cho stdout để Node.js đọc
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as err:
        _log(f"CRITICAL ERROR: {str(err)}")
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({"ok": False, "error": str(err)}, ensure_ascii=False))
        sys.exit(1)