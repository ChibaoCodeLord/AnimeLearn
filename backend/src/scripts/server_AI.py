from contextlib import asynccontextmanager
import sys
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Import các hàm từ file rag_worker.py của bạn
from rag_worker import  _vectorstore, ingest, chat, init_rag_system

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Khởi tạo hệ thống khi server bắt đầu chạy
#     init_rag_system()
#     print("✅ RAG System Ready!")
#     yield
#     # Dọn dẹp nếu cần khi tắt server

app = FastAPI(title="AnimeLearn RAG Service")

# --- PHẦN KHỞI TẠO (Warming up) ---
# Biến toàn cục để giữ Model và DB trên RAM
# GLOBAL_STORE = None
# GLOBAL_EMBEDDINGS = None

@app.on_event("startup")
async def startup_event():

    print("🚀 Đang khởi tạo Embedding Model và Vector DB...", file=sys.stderr)
    try:
        # Kích hoạt trước Vector DB và nạp model vào RAM
        # GLOBAL_STORE, _ = _vectorstore()
        init_rag_system()
        print("✅ Hệ thống đã sẵn sàng và Model đã nằm trên RAM!", file=sys.stderr)
    except Exception as e:
        print(f"❌ Khởi tạo thất bại: {e}", file=sys.stderr)

# --- DATA MODELS---
class IngestPayload(BaseModel):
    video_id: str
    script: List[Dict[str, Any]]

class ChatPayload(BaseModel):
    video_id: str
    question: str
    history: Optional[List[Dict[str, Any]]] = []
    k: Optional[int] = 4

# --- ENDPOINTS ---
@app.post("/ingest")
async def api_ingest(payload: IngestPayload):
    try:
        return ingest(payload.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def api_chat(payload: ChatPayload):
    try:
        return chat(payload.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @app.post("/chat")
# async def api_chat_stream(payload: ChatPayload):
#     # Chúng ta truyền GLOBAL_STORE (Vector DB đã nạp sẵn trên RAM) vào logic
#     # StreamingResponse sẽ tự động "hút" dữ liệu từ generator (yield)
#     return StreamingResponse(
#         chat_stream_logic(payload.model_dump(), GLOBAL_STORE),
#         media_type="text/event-stream"
#     )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9000)