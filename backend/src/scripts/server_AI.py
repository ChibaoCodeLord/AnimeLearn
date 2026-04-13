from contextlib import asynccontextmanager
import sys
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from fastapi import Request
from fastapi.responses import JSONResponse
import os

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

@app.middleware("http")
async def validate_api_key(request: Request, call_next):
    # Bỏ qua kiểm tra cho health check (optional)
    if request.url.path in ["/health"]:
        return await call_next(request)
    
    # Lấy API Key từ header
    api_key = request.headers.get("X-API-KEY")
    expected_key = os.getenv("AI_KEY", "default-secret-key")
    
    # Kiểm tra API Key
    if api_key != expected_key:
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid or missing API Key"}
        )
    
    # Nếu OK, tiếp tục xử lý request
    response = await call_next(request)
    return response

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


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=9000)