import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Trash2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// 1. Định nghĩa Interface cho Message
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// 2. Hàm giả lập AI Chat
const mockInvokeLLM = async (userMsg: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const lowerMsg = userMsg.toLowerCase();
      
      if (lowerMsg.includes('～ている') || lowerMsg.includes('teiru')) {
        resolve('**～ている (te iru)** thường có 2 nghĩa chính:\n\n1. **Hành động đang diễn ra:** Giống V-ing trong tiếng Anh.\n   *Ví dụ:* 今、ご飯を**食べている** (Bây giờ tôi đang ăn cơm).\n2. **Trạng thái đang duy trì:** Kết quả của hành động vẫn còn.\n   *Ví dụ:* 彼は結婚し**ている** (Anh ấy đã/đang kết hôn).\n\n*JLPT Level: N5*');
      } 
      else if (lowerMsg.includes('xin chào')) {
        resolve('Trong tiếng Nhật có nhiều cách nói "Xin chào" tùy thời điểm:\n\n- Sáng: **おはようございます** (Ohayou gozaimasu)\n- Trưa/Chiều: **こんにちは** (Konnichiwa)\n- Tối: **こんばんは** (Konbanwa)\n\nNếu nói chuyện với bạn bè thân thiết, chỉ cần nói ngắn gọn là **おはよう** (Ohayou) nhé! 😊');
      }
      else {
        resolve(`Cảm ơn bạn đã hỏi về: "${userMsg}". \n\nVì hiện tại mình đang chạy ở chế độ **Mock Data** (chưa kết nối AI thật), nên mình chỉ có thể trả lời các câu hỏi mẫu như:\n- ～ている form nghĩa là gì?\n- Phân biệt は và が\n- Các cách nói "xin chào" trong tiếng Nhật\n\nBạn hãy thử chọn một trong các câu hỏi gợi ý bên dưới nhé! 🎌`);
      }
    }, 1500);
  });
};

export default function AIChatTutor() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Chào bạn! 👋 Mình là trợ lý học tập tiếng Nhật của My Anime.\n\nBạn đang gặp khó khăn với điểm ngữ pháp nào, hay có từ vựng nào trong video chưa hiểu rõ không? Cứ hỏi mình nhé!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await mockInvokeLLM(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, mình đang gặp chút sự cố kết nối. Bạn thử lại sau nhé!' }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Đã làm mới cuộc hội thoại. Bạn cần mình giúp gì tiếp theo nào?'
      }
    ]);
  };

  const quickQuestions = [
    '～ている form nghĩa là gì?',
    'Phân biệt は và が',
    '～ないといけない dùng khi nào?',
    'Các cách nói "xin chào"',
  ];

  return (
    // Đã thay đổi: Thêm h-[calc(100vh-4rem)] để giới hạn chiều cao (trừ đi header layout nếu có) và p-4
    <div className="h-[calc(100vh)] w-full bg-slate-50 flex flex-col items-center justify-center animate-in fade-in duration-500">
      
      {/* Chat Container */}
      {/* Đã thay đổi: Xóa overflow-y-scroll ở đây vì container bao ngoài không nên scroll. Thêm h-full max-w-4xl */}
      <div className="w-full h-full bg-white shadow-sm flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center relative">
              <Bot className="w-6 h-6 text-emerald-600" />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Gia sư Tiếng Nhật</h2>
              <p className="text-sm text-emerald-600 font-medium">Đang trực tuyến</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearChat}
            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full w-10 h-10 transition-colors"
            title="Xóa đoạn chat"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages Area */}
        {/* Đã thay đổi: flex-1 giúp nó chiếm phần còn lại, overflow-y-auto để kích hoạt scroll */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50 custom-scrollbar relative">
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {/* Avatar AI */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-auto">
                    <Bot className="w-4 h-4 text-emerald-600" />
                  </div>
                )}

                {/* Bubble */}
                <div className={`max-w-[85%] md:max-w-[75%] px-5 py-3.5 shadow-sm ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-2xl rounded-br-sm' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-bl-sm' 
                }`}>
                  {isUser ? (
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="text-[15px] leading-relaxed prose prose-slate prose-p:my-1.5 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1 prose-strong:text-slate-900 prose-strong:font-bold prose-code:text-emerald-700 prose-code:bg-emerald-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-semibold prose-code:before:content-none prose-code:after:content-none max-w-none">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Avatar User */}
                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-auto border border-slate-300">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Typing Indicator */}
          {loading && (
            <div className="flex gap-3 justify-start items-end animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* Quick Questions & Input Area */}
        <div className="bg-white border-t border-slate-100 p-4 shrink-0">
          
          {/* Gợi ý câu hỏi */}
          {messages.length <= 2 && !loading && (
            <div className="flex flex-wrap gap-2 mb-4">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="text-sm font-medium px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 transition-all cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Form nhập liệu */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-center"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-full pl-6 pr-14 py-4 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm placeholder:text-slate-400 text-[15px]"
              disabled={loading}
              autoComplete="off"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 shadow-sm transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
            </Button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-3 font-medium">
            AI có thể mắc lỗi. Vui lòng kiểm tra lại thông tin quan trọng.
          </p>
        </div>

      </div>
    </div>
  );
}