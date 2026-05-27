# AnimeLearn - Learn Japanese Through Anime

## 🌟 Introduction

Learning a new language can often feel like a tedious chore when restricted to traditional textbooks and rote memorization. For many Japanese language learners, their passion stems from anime and Japanese pop culture, but bridging the gap between casual viewing and active learning is difficult without the right tools.

**AnimeLearn** is an innovative platform designed to solve this by turning your favorite anime scenes into an immersive language-learning experience. Our platform provides dual subtitles, interactive vocabulary lookups, AI-powered grammar explanations, and gamified quizzes, empowering modern otakus to master Japanese naturally and effectively.

This project also serves as a robust application demonstrating the integration of modern web technologies, AI-powered transcription (Whisper), and Retrieval-Augmented Generation (RAG) for language education.

## ✨ Features

Our platform offers specialized features tailored for learners and administrators.

### 👨‍💼 For Administrators (Admin)

Admins maintain the quality of the learning material and monitor platform growth.

*   **Analytics Dashboard:** Visualize key metrics such as total videos, registered learners, and learning hours.
*   **Video & Content Management:** Upload YouTube videos, generate AI-powered scripts, and curate Japanese-Vietnamese dual subtitles.
*   **Vocabulary & Kanji Control:** Automatically extract and manage vocabulary lists, JLPT levels, and Kanji definitions for each video.
*   **User Management:** Oversee user accounts, track learner progress, and handle access control.

### 👩‍🎓 For Learners

Learners have access to a rich suite of interactive tools to study Japanese efficiently.

*   **Immersive Video Player:** Watch anime with synced dual subtitles. Toggle Furigana (reading aids) on or off depending on your level.
*   **Interactive Subtitles:** Click on any word in the subtitle to instantly look up its meaning, part of speech, JLPT level, and Kanji breakdown without pausing your flow.
*   **Shadowing & Karaoke Mode:** Practice speaking with Shadowing mode or enjoy synced lyrics in a beautiful Karaoke interface.
*   **Pop-up Quizzes:** Test your listening and reading comprehension with AI-generated quizzes that appear dynamically while watching.
*   **AI Grammar Assistant:** Ask the integrated AI Chatbot to deeply explain specific grammar patterns or cultural nuances found in the current scene.
*   **Personal Vocabulary Notebook:** Save interesting words to your personal notebook and review them later using Spaced Repetition (Flashcards).

## 💻 Tech Stack

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS
*   **Backend:** Node.js (Express), Python (FastAPI for AI processing)
*   **Database:** MongoDB, ChromaDB (for Vector Search/RAG)
*   **AI/ML:** Whisper (Audio Transcription), Kuroshiro/SudachiPy (Japanese NLP), LangChain

## 🚀 How to Run the Project

1. **Start the Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Start the Backend (Node.js):**
   ```bash
   cd backend
   npm run dev
   ```

3. **Start the AI Server (Python):**
   ```bash
   cd backend/scripts
   pip install fastapi uvicorn pydantic
   python server_AI.py
   ```

---

## 📧 Cấu hình gửi email (For Backend)
Backend đang dùng `nodemailer` + SMTP để gửi mail khi admin từ chối video hoặc khi bạn cần thêm luồng email khác.

1. Tạo file `backend/.env`.
2. Điền các biến SMTP sau:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM="AnimeLearn <your_email@gmail.com>"
```

3. Nếu dùng Gmail, hãy bật 2-step verification và tạo App Password. Không dùng mật khẩu đăng nhập thường.
4. Khởi động lại backend sau khi đổi env.

### Ý nghĩa các biến
- `SMTP_HOST`: máy chủ SMTP của nhà cung cấp mail.
- `SMTP_PORT`: thường là `587` với TLS hoặc `465` với SSL.
- `SMTP_SECURE`: để `false` cho cổng `587`, `true` cho cổng `465`.
- `SMTP_USER`: địa chỉ email dùng để gửi.
- `SMTP_PASS`: mật khẩu ứng dụng hoặc password SMTP.
- `SMTP_FROM`: tên người gửi hiển thị trên email.

### Cách test nhanh
- Vào admin, từ chối một video và nhập lý do.
- Nếu SMTP cấu hình đúng, user sẽ nhận email ngay sau khi trạng thái chuyển sang `rejected`.
- Nếu thiếu SMTP env, backend sẽ vẫn cập nhật trạng thái nhưng chỉ log cảnh báo và bỏ qua mail.

