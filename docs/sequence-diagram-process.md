# Quy trinh ve sequence diagram cho AnimeLearn

Tai lieu nay dung de ve cac so do tuan tu cho luong hoat dong cua du an AnimeLearn. Du an co frontend React/Vite, backend Express/MongoDB, Python AI service, Gemini API, Cloudinary va SMTP email.

## 1. Cach doc luong trong code

Khi ve mot sequence diagram, hay lan theo thu tu sau:

1. Xac dinh use case can ve.
   Vi du: dang nhap, phan tich video, luu tu vung, chat RAG, import de thi JLPT.

2. Tim diem bat dau o frontend.
   - Man hinh: `frontend/src/pages/*`
   - Component con: `frontend/src/components/*`
   - Ham goi API: `frontend/src/api/*.api.ts`
   - Danh sach endpoint: `frontend/src/api/endpoints.ts`
   - Client dung chung: `frontend/src/api/client.ts`

3. Tim endpoint backend.
   - Entry Express: `backend/server.js`
   - Route: `backend/src/routes/*.js`
   - Middleware xac thuc: `backend/src/middleware/auth.js`
   - Controller: `backend/src/controllers/*.js`
   - Service: `backend/src/services/*.js`
   - Model MongoDB: `backend/src/models/*.js`

4. Liet ke participant theo muc truu tuong vua du.
   Khong can dua moi function vao diagram. Chi can cac thanh phan co trao doi thong diep quan trong.

5. Ve luong chinh truoc.
   Sau do moi them nhanh loi, dieu kien `alt`, buoc tuy chon `opt`, lap `loop`, hoac tac vu nen `par`.

6. Kiem tra lai diagram voi code.
   Endpoint, middleware, service, model va external service phai dung ten va dung thu tu.

## 2. Bo participant chuan nen dung

| Participant | Khi nao dung |
| --- | --- |
| `User` | Nguoi hoc hoac admin thao tac tren UI |
| `React Page/Component` | Trang hoac component nhan thao tac |
| `apiClient` | Lop fetch dung chung trong frontend |
| `Express Route` | Route trong `backend/src/routes/*` |
| `authMiddleware` | Route can JWT/cookie/Authorization |
| `restrictTo(admin)` | Route chi danh cho admin |
| `Controller` | Xu ly request/response |
| `Service` | Nghiep vu, goi AI, tinh toan, enrich data |
| `MongoDB` | Cac model `User`, `Video`, `Quiz`, `Exam`, `Vocabulary`, ... |
| `AI_SERVICE` | Python FastAPI service, vi du `/transcribe`, `/ingest`, `/chat` |
| `Gemini API` | Tao quiz va import de thi bang AI |
| `Cloudinary` | Upload avatar/media/audio |
| `SMTP` | Gui email thong bao |

## 3. Mau khung Mermaid

Dung Mermaid de ve nhanh trong Markdown, hoac import vao draw.io. Moi so do ben duoi dung chung theme mau xanh nhat, nen trang va net den.

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#ffffff",
    "primaryColor": "#8ED0F2",
    "primaryBorderColor": "#111827",
    "primaryTextColor": "#111827",
    "actorBkg": "#E6F7FF",
    "actorBorder": "#111827",
    "actorTextColor": "#111827",
    "lineColor": "#111827",
    "signalColor": "#111827",
    "signalTextColor": "#111827",
    "activationBkgColor": "#8ED0F2",
    "activationBorderColor": "#111827"
  },
  "sequence": {
    "mirrorActors": false,
    "showSequenceNumbers": false
  }
}}%%

sequenceDiagram
    actor User
    participant UI as React Page/Component
    participant API as apiClient
    participant Route as Express Route
    participant Auth as authMiddleware
    participant Ctrl as Controller
    participant Svc as Service
    participant DB as MongoDB
    participant Ext as External Service

    User->>+UI: Thao tac tren giao dien
    UI->>+API: Goi ham API
    API->>+Route: HTTP request
    Route->>+Auth: Kiem tra token
    Auth-->>-Route: req.user
    Route->>+Ctrl: Chuyen request
    Ctrl->>+Svc: Xu ly nghiep vu
    Svc->>+DB: Doc/ghi du lieu
    DB-->>-Svc: Ket qua DB
    Svc->>+Ext: Goi dich vu ngoai neu co
    Ext-->>-Svc: Ket qua external
    Svc-->>-Ctrl: Data da xu ly
    Ctrl-->>-Route: JSON response
    Route-->>-API: HTTP response
    API-->>-UI: Data/Error
    UI-->>-User: Cap nhat giao dien
```

## 4. Danh sach sequence diagram nen ve cho du an

Nen ve theo thu tu uu tien nay:

1. Dang ky, dang nhap, lay thong tin user hien tai.
2. Tai trang Home va danh sach video cong khai.
3. Phan tich YouTube video bang AI va luu video vao he thong.
4. Xem video, dem view, like, comment, danh dau da xem.
5. Tra tu trong subtitle va luu vao so tu vung.
6. Tao quiz AI tu script video.
7. Chat RAG voi noi dung video.
8. Quan ly de thi JLPT: tao exam, import bang AI, luu section/group, publish.
9. Admin duyet hoac tu choi video, gui email neu bi tu choi.
10. Profile tracking: ghi nhan session hoc, cap nhat streak/XP/gio hoc.

## 5. So do: dang nhap

Endpoint chinh: `POST /api/auth/login`

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#ffffff",
    "primaryColor": "#8ED0F2",
    "primaryBorderColor": "#111827",
    "primaryTextColor": "#111827",
    "actorBkg": "#E6F7FF",
    "actorBorder": "#111827",
    "actorTextColor": "#111827",
    "lineColor": "#111827",
    "signalColor": "#111827",
    "signalTextColor": "#111827",
    "activationBkgColor": "#8ED0F2",
    "activationBorderColor": "#111827"
  },
  "sequence": {
    "mirrorActors": false,
    "showSequenceNumbers": false
  }
}}%%

sequenceDiagram
    actor Learner as Nguoi hoc
    participant Login as Login.tsx
    participant AuthApi as auth.api.ts
    participant API as apiClient
    participant Route as /api/auth/login
    participant UserModel as User model
    participant JWT as jsonwebtoken

    Learner->>+Login: Nhap email, password
    Login->>+AuthApi: login(payload)
    AuthApi->>+API: POST /auth/login
    API->>+Route: POST /api/auth/login
    Route->>+UserModel: findOne(email).select(+password)
    UserModel-->>-Route: user hoac null

    alt Sai email hoac password
        Route-->>-API: 401 Invalid credentials
        API-->>-AuthApi: Throw ApiError
        AuthApi-->>-Login: Loi dang nhap
        Login-->>-Learner: Hien thi loi dang nhap
    else Hop le
        Route->>+UserModel: user.matchPassword(password)
        UserModel-->>-Route: true
        Route->>+JWT: sign({ id, email, role })
        JWT-->>-Route: token
        Route-->>-API: Set-Cookie token + JSON user
        API-->>-AuthApi: token, user
        AuthApi-->>-Login: Dang nhap thanh cong
        Login-->>-Learner: Dieu huong vao ung dung
    end
```

## 6. So do: phan tich va luu video bang AI

Endpoint chinh:
- `POST /api/video/analyze`
- `POST /api/video/save`

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#ffffff",
    "primaryColor": "#8ED0F2",
    "primaryBorderColor": "#111827",
    "primaryTextColor": "#111827",
    "actorBkg": "#E6F7FF",
    "actorBorder": "#111827",
    "actorTextColor": "#111827",
    "lineColor": "#111827",
    "signalColor": "#111827",
    "signalTextColor": "#111827",
    "activationBkgColor": "#8ED0F2",
    "activationBorderColor": "#111827"
  },
  "sequence": {
    "mirrorActors": false,
    "showSequenceNumbers": false
  }
}}%%

sequenceDiagram
    actor User as Nguoi dung
    participant UI as VideoWorkspace.tsx
    participant VideoApi as video.api.ts
    participant Route as /api/video
    participant Auth as authMiddleware
    participant Ctrl as videoController
    participant VideoSvc as videoService
    participant AI as AI_SERVICE
    participant Gemini as Gemini API
    participant Mongo as MongoDB
    participant RAG as RAG ingest

    User->>+UI: Nhap YouTube URL
    UI->>+VideoApi: analyzeVideo({ url })
    VideoApi->>+Route: POST /api/video/analyze
    Route->>+Auth: Kiem tra token
    Auth-->>-Route: req.user
    Route->>+Ctrl: analyzeVideoController
    Ctrl->>+VideoSvc: analyzeVideoScriptService(url)
    VideoSvc->>+AI: POST /transcribe { media_path, use_gpu }
    AI-->>-VideoSvc: title, jlpt_level, script/segments
    VideoSvc-->>-Ctrl: script da normalize
    Ctrl-->>-Route: Preview script
    Route-->>-VideoApi: JSON preview
    VideoApi-->>-UI: Preview script
    UI-->>-User: Hien thi preview script

    User->>+UI: Bam luu video
    UI->>+VideoApi: saveVideo({ youtube_url, script })
    VideoApi->>+Route: POST /api/video/save
    Route->>+Auth: Kiem tra token
    Auth-->>-Route: req.user
    Route->>+Ctrl: saveVideoController
    Ctrl->>+VideoSvc: saveVideoWithQuizService(userId, url, script)
    VideoSvc->>+Mongo: Tim Kanji lien quan de enrich vocab
    Mongo-->>-VideoSvc: kanjiData
    VideoSvc->>+Gemini: generateQuizFromScript(script)
    Gemini-->>-VideoSvc: jlptLevel, questions
    VideoSvc->>+Mongo: Tao Video
    Mongo-->>-VideoSvc: videoData
    VideoSvc->>+Mongo: Tao Quiz neu AI tra questions
    Mongo-->>-VideoSvc: quizData
    VideoSvc--)RAG: indexVideoScript(videoId, script)
    RAG--)AI: POST /ingest
    VideoSvc-->>-Ctrl: newVideo, newQuiz
    Ctrl-->>-Route: Luu thanh cong
    Route-->>-VideoApi: JSON response
    VideoApi-->>-UI: newVideo, newQuiz
    UI-->>-User: Hien thi video da luu
```

Ghi chu khi ve: `indexVideoScript` la tac vu nen, trong code goi `.catch(console.error)`, nen dung mui ten bat dong bo `--)`.

## 7. So do: xem video va hoc tu vung

Endpoint chinh:
- `GET /api/video/detail/:id`
- `POST /api/video/view/:id`
- `POST /api/video/watched/:id`
- `POST /api/video/translate-word`
- `POST /api/vocabulary/save`

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#ffffff",
    "primaryColor": "#8ED0F2",
    "primaryBorderColor": "#111827",
    "primaryTextColor": "#111827",
    "actorBkg": "#E6F7FF",
    "actorBorder": "#111827",
    "actorTextColor": "#111827",
    "lineColor": "#111827",
    "signalColor": "#111827",
    "signalTextColor": "#111827",
    "activationBkgColor": "#8ED0F2",
    "activationBorderColor": "#111827"
  },
  "sequence": {
    "mirrorActors": false,
    "showSequenceNumbers": false
  }
}}%%

sequenceDiagram
    actor Learner as Nguoi hoc
    participant Page as VideoWorkspace/ExamDetail UI
    participant VideoApi as video.api.ts
    participant VocabApi as vocabulary.api.ts
    participant Route as Express routes
    participant Auth as authMiddleware
    participant VideoSvc as videoService
    participant VocabCtrl as vocabularyController
    participant Mongo as MongoDB
    participant Python as Python NLP/Translator

    Learner->>+Page: Mo video
    Page->>+VideoApi: getVideoDetail(videoId)
    VideoApi->>+Route: GET /api/video/detail/:id
    Route->>+Auth: Kiem tra token
    Auth-->>-Route: req.user
    Route->>+VideoSvc: getVideoDetailService(videoId, user)
    VideoSvc->>+Mongo: Video.findById + user state
    Mongo-->>VideoSvc: video detail
    VideoSvc-->>Route: video, script, vocab
    Route-->>VideoApi: JSON video detail
    VideoApi-->>Page: video, script, vocab
    Page-->>Learner: Hien thi video

    Page->>VideoApi: countView(videoId)
    VideoApi->>Route: POST /api/video/view/:id
    Route->>VideoSvc: countVideoViewService(videoId)
    VideoSvc->>Mongo: Tang views_count
    Mongo-->>VideoSvc: view updated
    VideoSvc-->>Route: Ket qua dem view
    Route-->>VideoApi: JSON response
    VideoApi-->>Page: View counted

    Learner->>Page: Click mot tu trong subtitle
    Page->>VideoApi: translateWord(word)
    VideoApi->>Route: POST /api/video/translate-word
    Route->>VideoSvc: translateWordService(word)
    VideoSvc->>+Python: fugashi + GoogleTranslator
    Python-->>-VideoSvc: reading, meaning_vi, part_of_speech
    VideoSvc-->>Route: Ket qua tra tu
    Route-->>VideoApi: JSON word detail
    VideoApi-->>Page: Ket qua tra tu
    Page-->>Learner: Hien thi popup tu vung

    Learner->>Page: Luu tu vao folder
    Page->>+VocabApi: saveLearningItem(payload)
    VocabApi->>+Route: POST /api/vocabulary/save
    Route->>+Auth: Kiem tra token
    Auth-->>-Route: req.user
    Route->>+VocabCtrl: saveLearningItem
    VocabCtrl->>Mongo: Kiem tra folder, source Dictionary/Kanji, duplicate
    Mongo-->>VocabCtrl: Ket qua
    VocabCtrl->>Mongo: Vocabulary.create(payload)
    Mongo-->>VocabCtrl: item da luu
    VocabCtrl-->>-Route: Item saved
    Route-->>-VocabApi: JSON response
    VocabApi-->>-Page: Item saved
    Page-->>Learner: Bao da luu

    Learner->>Page: Xem gan het video
    Page->>VideoApi: markWatched(videoId, progress)
    VideoApi->>Route: POST /api/video/watched/:id
    Route->>+Auth: Kiem tra token
    Auth-->>-Route: req.user
    Route->>VideoSvc: markVideoWatchedService
    VideoSvc->>Mongo: Upsert VideoWatched
    Mongo-->>VideoSvc: watch state
    VideoSvc-->>Route: Da danh dau
    Route-->>VideoApi: JSON response
    VideoApi-->>Page: Watched updated
    Page-->>-Learner: Cap nhat tien do
    deactivate Mongo
    deactivate VideoSvc
    deactivate Route
    deactivate VideoApi
```

## 8. So do: tao quiz AI tu video

Endpoint chinh:
- `GET /api/quiz/:videoId`
- `POST /api/quiz/:videoId/generate`

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#ffffff",
    "primaryColor": "#8ED0F2",
    "primaryBorderColor": "#111827",
    "primaryTextColor": "#111827",
    "actorBkg": "#E6F7FF",
    "actorBorder": "#111827",
    "actorTextColor": "#111827",
    "lineColor": "#111827",
    "signalColor": "#111827",
    "signalTextColor": "#111827",
    "activationBkgColor": "#8ED0F2",
    "activationBorderColor": "#111827"
  },
  "sequence": {
    "mirrorActors": false,
    "showSequenceNumbers": false
  }
}}%%

sequenceDiagram
    actor Learner as Nguoi hoc
    participant Page as QuizPage.tsx
    participant QuizApi as quiz.api.ts
    participant Route as /api/quiz
    participant Auth as authMiddleware
    participant QuizCtrl as quiz route/controller
    participant QuizAI as quizAIService
    participant Gemini as Gemini API
    participant Mongo as MongoDB

    Learner->>+Page: Mo quiz cua video
    Page->>+QuizApi: getQuizByVideoId(videoId)
    QuizApi->>+Route: GET /api/quiz/:videoId
    Route->>+Auth: Kiem tra token
    Auth-->>-Route: req.user
    Route->>+Mongo: Quiz.findOne({ videoId })
    Mongo-->>Route: quiz hoac null

    alt Quiz da ton tai
        Route-->>QuizApi: quiz
        QuizApi-->>Page: quiz
        Page-->>Learner: Hien thi quiz
    else Chua co quiz
        Route-->>QuizApi: 404/null
        QuizApi-->>Page: Chua co quiz
        Page->>QuizApi: generateQuiz(videoId, { script })
        QuizApi->>Route: POST /api/quiz/:videoId/generate
        Route->>+Auth: Kiem tra token
        Auth-->>-Route: req.user
        Route->>+QuizAI: generateQuizFromScript(script)
        QuizAI->>+Gemini: generateContent(prompt + script)
        Gemini-->>QuizAI: JSON jlptLevel, questions
        QuizAI-->>Route: aiResult
        Route->>Mongo: Quiz.create({ videoId, questions })
        Mongo-->>Route: quiz moi
        Route->>Mongo: Video.findByIdAndUpdate(jlpt_level)
        Mongo-->>Route: video updated
        Route-->>QuizApi: quiz moi + jlptLevel
        QuizApi-->>Page: quiz moi + jlptLevel
        Page-->>Learner: Hien thi quiz moi
        deactivate Gemini
        deactivate QuizAI
    end
    deactivate Mongo
    deactivate Route
    deactivate QuizApi
    deactivate Page
```

## 9. So do: chat RAG theo video

Endpoint chinh:
- `POST /api/chat/video/:videoId/index`
- `POST /api/chat/video/:videoId/ask`

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#ffffff",
    "primaryColor": "#8ED0F2",
    "primaryBorderColor": "#111827",
    "primaryTextColor": "#111827",
    "actorBkg": "#E6F7FF",
    "actorBorder": "#111827",
    "actorTextColor": "#111827",
    "lineColor": "#111827",
    "signalColor": "#111827",
    "signalTextColor": "#111827",
    "activationBkgColor": "#8ED0F2",
    "activationBorderColor": "#111827"
  },
  "sequence": {
    "mirrorActors": false,
    "showSequenceNumbers": false
  }
}}%%

sequenceDiagram
    actor Learner as Nguoi hoc
    participant Widget as VideoRagChatWidget
    participant ChatApi as chat.api.ts
    participant Route as /api/chat
    participant Auth as authMiddleware
    participant Mongo as MongoDB
    participant RagSvc as ragChatService
    participant AI as AI_SERVICE
    participant VectorDB as ChromaDB/Vector Store

    opt Khi video moi duoc luu hoac can index lai
        Widget->>+ChatApi: indexVideo(videoId)
        ChatApi->>+Route: POST /api/chat/video/:videoId/index
        Route->>+Auth: Kiem tra token
        Auth-->>-Route: req.user
        Route->>+Mongo: Video.findById(videoId)
        Mongo-->>Route: video.script
        Route->>+RagSvc: indexVideoScript(videoId, script)
        RagSvc->>+AI: POST /ingest
        AI->>+VectorDB: Luu embedding theo video_id
        VectorDB-->>AI: Luu thanh cong
        AI-->>RagSvc: Ket qua ingest
        RagSvc-->>Route: result
        Route-->>ChatApi: Da index
        ChatApi-->>Widget: Da index
        deactivate VectorDB
        deactivate AI
        deactivate RagSvc
        deactivate Mongo
        deactivate Route
        deactivate ChatApi
    end

    Learner->>+Widget: Dat cau hoi ve canh/phu de
    Widget->>+ChatApi: askVideo(videoId, question, history)
    ChatApi->>+Route: POST /api/chat/video/:videoId/ask
    Route->>+Auth: Kiem tra token
    Auth-->>-Route: req.user
    Route->>+Mongo: Video.findById(videoId)
    Mongo-->>Route: video ton tai
    Route->>+RagSvc: askVideoQuestion(videoId, question, history)
    RagSvc->>+AI: POST /chat
    AI->>+VectorDB: Tim source lien quan
    VectorDB-->>AI: chunks/sources
    AI-->>RagSvc: answer, sources
    RagSvc-->>Route: ragResult
    Route-->>ChatApi: answer, sources
    ChatApi-->>Widget: answer, sources
    Widget-->>Learner: Hien thi cau tra loi
    deactivate VectorDB
    deactivate AI
    deactivate RagSvc
    deactivate Mongo
    deactivate Route
    deactivate ChatApi
    deactivate Widget
```

## 10. So do: admin import de thi JLPT bang AI

Endpoint chinh:
- `POST /api/exams/admin`
- `POST /api/exams/admin/import-preview`
- `POST /api/exams/admin/:id/section`
- `PATCH /api/exams/admin/:id/status`

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#ffffff",
    "primaryColor": "#8ED0F2",
    "primaryBorderColor": "#111827",
    "primaryTextColor": "#111827",
    "actorBkg": "#E6F7FF",
    "actorBorder": "#111827",
    "actorTextColor": "#111827",
    "lineColor": "#111827",
    "signalColor": "#111827",
    "signalTextColor": "#111827",
    "activationBkgColor": "#8ED0F2",
    "activationBorderColor": "#111827"
  },
  "sequence": {
    "mirrorActors": false,
    "showSequenceNumbers": false
  }
}}%%

sequenceDiagram
    actor Admin
    participant UI as ExamAdminPanel
    participant ExamApi as exam.api.ts
    participant Route as /api/exams
    participant Auth as authMiddleware
    participant Role as restrictTo(admin)
    participant Upload as multer memoryStorage
    participant Ctrl as examController
    participant ExamAI as examAIService
    participant Gemini as Gemini API
    participant Cloudinary
    participant Mongo as MongoDB

    Admin->>+UI: Tao de thi moi
    UI->>+ExamApi: adminCreate(payload)
    ExamApi->>+Route: POST /api/exams/admin
    Route->>+Auth: Kiem tra token
    Auth-->>-Route: req.user
    Route->>+Role: Kiem tra role admin
    Role-->>-Route: Cho phep
    Route->>+Ctrl: createExam
    Ctrl->>+Mongo: Exam.create(default sections)
    Mongo-->>Ctrl: exam
    Ctrl-->>Route: exam
    Route-->>ExamApi: JSON exam
    ExamApi-->>UI: exam
    UI-->>Admin: Hien thi de moi

    Admin->>UI: Upload anh/PDF va audio neu listening
    UI->>ExamApi: importPreview(formData)
    ExamApi->>Route: POST /api/exams/admin/import-preview
    Route->>+Auth: Kiem tra token
    Auth-->>-Route: req.user
    Route->>+Role: Kiem tra role admin
    Role-->>-Route: Cho phep
    Route->>+Upload: Doc file vao memory
    Upload-->>-Route: req.file/req.files
    Route->>Ctrl: importPreview
    Ctrl->>+ExamAI: extractExamSectionFromFile(file, audioFile, sectionType)
    ExamAI->>+Gemini: generateContent(prompt + inlineData)
    Gemini-->>ExamAI: JSON section/groups/questions
    ExamAI-->>Ctrl: groups da normalize
    deactivate Gemini
    deactivate ExamAI

    opt Co audioFile
        Ctrl->>+Cloudinary: uploadBufferToCloudinary(audio)
        Cloudinary-->>-Ctrl: secure_url
    end

    Ctrl-->>Route: Preview groups/questions
    Route-->>ExamApi: JSON preview
    ExamApi-->>UI: Preview groups/questions
    UI-->>Admin: Hien thi preview AI

    Admin->>UI: Sua noi dung va xac nhan luu
    UI->>ExamApi: saveSection(examId, { sectionType, groups })
    ExamApi->>Route: POST /api/exams/admin/:id/section
    Route->>+Auth: Kiem tra token
    Auth-->>-Route: req.user
    Route->>+Role: Kiem tra role admin
    Role-->>-Route: Cho phep
    Route->>Ctrl: saveExamSection
    Ctrl->>Mongo: Tim exam, replace section groups, save
    Mongo-->>Ctrl: exam da cap nhat
    Ctrl-->>Route: exam moi
    Route-->>ExamApi: JSON exam
    ExamApi-->>UI: exam moi
    UI-->>Admin: Da luu section

    Admin->>UI: Publish de thi
    UI->>ExamApi: adminStatus(examId, "published")
    ExamApi->>Route: PATCH /api/exams/admin/:id/status
    Route->>+Auth: Kiem tra token
    Auth-->>-Route: req.user
    Route->>+Role: Kiem tra role admin
    Role-->>-Route: Cho phep
    Route->>Ctrl: updateExamStatus
    Ctrl->>Mongo: Cap nhat status/publishedAt
    Mongo-->>Ctrl: exam published
    Ctrl-->>Route: Trang thai moi
    Route-->>ExamApi: JSON exam
    ExamApi-->>UI: Trang thai moi
    UI-->>-Admin: De thi da publish
    deactivate Mongo
    deactivate Ctrl
    deactivate Route
    deactivate ExamApi
```

## 11. So do: admin duyet hoac tu choi video

Endpoint chinh: `PATCH /api/admin/videos/:id/status`

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#ffffff",
    "primaryColor": "#8ED0F2",
    "primaryBorderColor": "#111827",
    "primaryTextColor": "#111827",
    "actorBkg": "#E6F7FF",
    "actorBorder": "#111827",
    "actorTextColor": "#111827",
    "lineColor": "#111827",
    "signalColor": "#111827",
    "signalTextColor": "#111827",
    "activationBkgColor": "#8ED0F2",
    "activationBorderColor": "#111827"
  },
  "sequence": {
    "mirrorActors": false,
    "showSequenceNumbers": false
  }
}}%%

sequenceDiagram
    actor Admin
    participant UI as AdminPanel
    participant AdminApi as admin.api.ts
    participant Route as /api/admin/videos/:id/status
    participant Auth as authMiddleware
    participant Role as restrictTo(admin)
    participant Mongo as MongoDB
    participant Email as emailService
    participant SMTP as SMTP server

    Admin->>+UI: Chon approved/rejected/pending
    UI->>+AdminApi: updateVideoStatus(id, status, reason)
    AdminApi->>+Route: PATCH /api/admin/videos/:id/status
    Route->>+Auth: Kiem tra token
    Auth-->>-Route: req.user
    Route->>+Role: Kiem tra role admin
    Role-->>-Route: Cho phep
    Route->>+Mongo: Video.findById(id).populate(creator)
    Mongo-->>Route: existingVideo
    Route->>Mongo: Video.findByIdAndUpdate(status)
    Mongo-->>Route: video moi

    opt status = rejected va co email creator
        Route--)Email: sendVideoRejectedEmail(...)
        Email--)SMTP: sendMail
    end

    Route-->>AdminApi: message, video status
    AdminApi-->>UI: Cap nhat status
    UI-->>-Admin: Cap nhat bang quan tri
    deactivate Mongo
    deactivate Route
    deactivate AdminApi
```

## 12. Quy uoc khi ve de bao ve do chinh xac

1. Ten endpoint phai trung voi `frontend/src/api/endpoints.ts` va route backend.
2. Route co `authMiddleware` thi bat buoc the hien buoc auth.
3. Route admin phai co them `restrictTo(admin)`.
4. Tac vu nen dung mui ten bat dong bo `--)`, vi du index RAG hoac gui email.
5. Dung `->>+` khi participant bat dau xu ly va `-->>-` khi participant tra ket qua de hien activation bar.
6. Neu muon thanh activation keo dai den cuoi luong, chi dung `->>+` o lan goi dau, dung `-->>` cho cac response giua chung, roi dong bang `deactivate Participant` o cuoi.
7. Goi AI, Cloudinary, SMTP nen tach thanh external participant.
8. MongoDB khong can tach tung collection neu diagram qua day. Neu can chi tiet, doi `MongoDB` thanh `User`, `Video`, `Quiz`, `Exam`, `Vocabulary`.
9. Voi luong AI, luon ve nhanh loi `alt` neu request co the fail vi thieu API key, file sai dinh dang, AI timeout, hoac JSON parse loi.
10. Khong ve state UI qua chi tiet. Sequence diagram uu tien thong diep giua cac thanh phan.

## 13. Lenh ho tro trace nhanh

```powershell
rg "ENDPOINTS.video" frontend/src
rg "router\\." backend/src/routes/video.js
rg "analyzeVideoController|saveVideoController" backend/src
rg "extractExamSectionFromFile|generateQuizFromScript|indexVideoScript" backend/src
```

## 14. Checklist truoc khi dua vao bao cao

1. Co actor ro rang: `Nguoi hoc` hoac `Admin`.
2. Co frontend component/page va API layer.
3. Co backend route, middleware, controller/service.
4. Co database/external services neu luong co doc ghi hoac goi AI.
5. Co nhanh loi/toi thieu mot `alt` cho luong dang nhap, upload/import, AI.
6. Ten message ngan gon, dung dong tu: `POST`, `findById`, `generateContent`, `save`, `return`.
7. Diagram khong qua 12 participant. Neu qua dai, tach thanh 2 diagram: "preview" va "save", hoac "index" va "ask".
