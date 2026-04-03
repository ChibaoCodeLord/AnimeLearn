import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptPath = path.join(__dirname, '../scripts/rag_worker.py');
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL; 



/**
 * Hàm bổ trợ để gọi API chung
 */
async function callRAGService(endpoint, payload) {
  try {
    const response = await fetch(`${RAG_SERVICE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `RAG Service error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[RAG_API_ERROR] ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Export: Đưa dữ liệu video vào Vector DB
 */
export async function indexVideoScript(videoId, script) {
  console.log(`[RAG] Gửi yêu cầu Ingest cho Video: ${videoId}`);
  return callRAGService('ingest', {
    video_id: String(videoId),
    script: Array.isArray(script) ? script : [],
  });
}

/**
 * Export: Hỏi đáp về nội dung video
 */
export async function askVideoQuestion(videoId, question, history = []) {
  console.log(`[RAG] Gửi câu hỏi cho Video: ${videoId}`);
  return callRAGService('chat', {
    video_id: String(videoId),
    question,
    history: Array.isArray(history) ? history : [],
  });
}