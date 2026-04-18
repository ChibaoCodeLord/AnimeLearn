import { useMemo, useRef, useState } from 'react';
import { Bot, Loader2, MessageCircle, Minus, RefreshCw, Send, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
}

interface VideoRagChatWidgetProps {
  videoId: string | null;
  bottomOffsetClassName?: string;
}

const API_BASE_URL = 'http://localhost:5000';

function toHistory(messages: ChatMessage[]) {
  const history: Array<{ question: string; answer: string }> = [];

  for (let i = 0; i < messages.length - 1; i += 1) {
    const maybeUser = messages[i];
    const maybeAssistant = messages[i + 1];

    if (maybeUser.role === 'user' && maybeAssistant?.role === 'assistant') {
      history.push({
        question: maybeUser.text,
        answer: maybeAssistant.text,
      });
    }
  }

  return history.slice(-4);
}

export default function VideoRagChatWidget({ videoId, bottomOffsetClassName = 'bottom-4 md:bottom-6' }: VideoRagChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'hello',
      role: 'assistant',
      text: 'Hi! Mình là trợ lý RAG cho video này. Hãy hỏi về đoạn hội thoại Nhật bạn đang xem.',
      createdAt: Date.now(),
    },
  ]);

  const messageBoxRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(
    () => Boolean(videoId && messageInput.trim() && !isSending),
    [videoId, messageInput, isSending]
  );

  const scrollToBottom = () => {
    if (!messageBoxRef.current) return;
    messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
  };

  const appendMessage = (role: ChatRole, text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role,
        text,
        createdAt: Date.now(),
      },
    ]);

    setTimeout(scrollToBottom, 10);
  };

  const handleSyncIndex = async () => {
    if (!videoId) {
      toast.error('Video này chưa có id. Hãy lưu hoặc mở video từ cộng đồng trước.');
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/video/${videoId}/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.details || result?.error || 'Không thể đồng bộ dữ liệu RAG.');
      }

      toast.success(`Đã đồng bộ RAG: ${result?.chunks_indexed ?? 0} đoạn.`);
    } catch (error: any) {
      toast.error(error?.message || 'Đồng bộ RAG thất bại.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSend = async () => {
    if (!videoId) {
      toast.error('Bạn cần mở video đã lưu để chat theo ngữ cảnh video.');
      return;
    }

    const question = messageInput.trim();
    if (!question || isSending) return;

    appendMessage('user', question);
    setMessageInput('');
    setIsSending(true);

    try {
      const history = toHistory(messages);
      const response = await fetch(`${API_BASE_URL}/api/chat/video/${videoId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.details || result?.error || 'Chat API lỗi.');
      }

      appendMessage('assistant', result?.answer || 'Mình chưa có câu trả lời phù hợp.');
    } catch (error: any) {
      appendMessage('assistant', `Mình đang gặp lỗi khi truy vấn RAG: ${error?.message || 'Không xác định'}`);
    } finally {
      setIsSending(false);
    }
  };
  

  return (
    <div className={`fixed right-4 ${bottomOffsetClassName} md:right-6 z-50`}>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="size-14 rounded-full shadow-xl text-white bg-linear-to-br from-red-500 via-orange-500 to-rose-600 hover:scale-105 transition-transform flex items-center justify-center border border-white/40"
          aria-label="Mở chat RAG"
        >
          <MessageCircle className="size-6" />
        </button>
      ) : (
        <div className="w-[min(92vw,360px)] h-[500px] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-linear-to-r from-slate-900 via-rose-900 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Bot className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Video RAG Chat</p>
                <p className="text-[11px] text-white/70">Hỏi theo ngữ cảnh video hiện tại</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-white hover:bg-white/10"
                onClick={handleSyncIndex}
                disabled={isSyncing || !videoId}
                title="Đồng bộ index cho video"
              >
                {isSyncing ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-white hover:bg-white/10"
                onClick={() => setIsOpen(false)}
                title="Thu gọn"
              >
                <Minus className="size-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-white hover:bg-white/10"
                onClick={() => {
                  setIsOpen(false);
                  setMessages([
                    {
                      id: 'hello',
                      role: 'assistant',
                      text: 'Hi! Mình là trợ lý RAG cho video này. Hãy hỏi về đoạn hội thoại Nhật bạn đang xem.',
                      createdAt: Date.now(),
                    },
                  ]);
                  setMessageInput('');
                }}
                title="Đóng chat"
              >
                <X className="size-3" />
              </Button>
            </div>
          </div>

          <div ref={messageBoxRef} className="flex-1 overflow-y-auto bg-slate-50 px-3 py-3 space-y-2">
            {!videoId && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs p-2">
                Video chưa có id. Hãy lưu video hoặc mở video từ danh sách cộng đồng để dùng RAG chat.
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'ml-auto bg-slate-900 text-white rounded-br-md'
                    : 'mr-auto bg-white border border-slate-200 text-slate-700 rounded-bl-md'
                )}
              >
                {msg.text}
              </div>
            ))}

            {isSending && (
              <div className="mr-auto bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-bl-md px-3 py-2 text-sm inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Đang tìm context từ vector DB...
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-200 bg-white">
            <div className="flex gap-2 items-end">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Hỏi về đoạn hội thoại trong video..."
                className="h-10"
              />
              <Button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className="h-10 px-3 bg-slate-900 hover:bg-slate-800 text-white"
              >
                {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
