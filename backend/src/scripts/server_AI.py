from contextlib import asynccontextmanager
import sys
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from fastapi import Request
from fastapi.responses import JSONResponse
import os

# Import RAG functions
from rag_worker import _vectorstore, ingest, chat, init_rag_system

# Import Transcribe functions
from transcribe import transcribe_media, log_err, init_transcribe_system

app = FastAPI(title="AnimeLearn Unified Service - RAG + Transcribe")

@app.middleware("http")
async def validate_api_key(request: Request, call_next):
    # Bỏ qua kiểm tra cho health check
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
    
    # Tiếp tục xử lý request
    response = await call_next(request)
    return response

@app.on_event("startup")
async def startup_event():
    print("🚀 Khởi tạo hệ thống AI...", file=sys.stderr)
    try:
        # Khởi tạo RAG System
        print("  📚 Khởi tạo RAG...", file=sys.stderr)
        init_rag_system()
        print("  ✅ RAG System đã sẵn sàng!", file=sys.stderr)
        
        # Khởi tạo Transcribe System
        print("  🎙️  Khởi tạo Transcribe...", file=sys.stderr)
        init_transcribe_system(use_gpu=True)
        print("  ✅ Transcribe System đã sẵn sàng!", file=sys.stderr)
        
        print("✅ Tất cả hệ thống AI đã sẵn sàng!", file=sys.stderr)
    except Exception as e:
        print(f"❌ Khởi tạo thất bại: {e}", file=sys.stderr)


@app.get("/health")
async def health_check():
    """Health check"""
    return {"status": "ok", "service": "unified"}

# ============================================================================
# DATA MODELS - RAG
# ============================================================================

class IngestPayload(BaseModel):
    video_id: str
    script: List[Dict[str, Any]]

class ChatPayload(BaseModel):
    video_id: str
    question: str
    history: Optional[List[Dict[str, Any]]] = []
    k: Optional[int] = 4

# ============================================================================
# DATA MODELS - TRANSCRIBE
# ============================================================================

class TranscribePayload(BaseModel):
    media_path: str
    use_gpu: Optional[bool] = True

# ============================================================================
# ENDPOINTS - RAG
# ============================================================================

@app.post("/ingest")
async def api_ingest(payload: IngestPayload):
    """Nạp script video vào vector store"""
    try:
        return ingest(payload.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def api_chat(payload: ChatPayload):
    """Chat với video script sử dụng RAG + LLM"""
    try:
        return chat(payload.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# ENDPOINTS - TRANSCRIBE
# ============================================================================

@app.post("/transcribe")
async def api_transcribe(payload: TranscribePayload):
    """
    Transcribe media file hoặc YouTube URL
    
    Request:
        {
            "media_path": "https://youtube.com/watch?v=...",
            "use_gpu": true
        }
    """
    try:
        log_err(f"📥 Bắt đầu transcribe: {payload.media_path}")
        results = transcribe_media(
            media_path=payload.media_path,
            use_gpu=payload.use_gpu
        )
        log_err(f"✅ Transcribe thành công: {len(results)} segments")
        return {
            "ok": True,
            "segments": results
        }
    except Exception as e:
        log_err(f"❌ Lỗi transcribe: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=9000)