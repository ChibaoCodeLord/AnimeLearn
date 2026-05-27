# AnimeLearn - Learn Japanese Through Anime

## 🌟 Introduction

Learning a new language can often feel like a tedious chore when restricted to traditional textbooks and rote memorization. For many Japanese language learners, their passion stems from anime and Japanese pop culture, but bridging the gap between casual viewing and active learning is difficult without the right tools.

**AnimeLearn** is an innovative platform designed to solve this by turning your favorite anime scenes into an immersive language-learning experience. Our platform provides dual subtitles, interactive vocabulary lookups, AI-powered grammar explanations, and gamified quizzes, empowering modern otakus to master Japanese naturally and effectively.

This project also serves as a robust application demonstrating the integration of modern web technologies, AI-powered transcription (Whisper), and Retrieval-Augmented Generation (RAG) for language education.

## ✨ Features

Our platform offers specialized features tailored for learners and administrators.

### 👨‍💼 For Administrators (Admin)
Admins maintain the quality of the learning material and monitor platform growth.
* **Analytics Dashboard:** Visualize key metrics such as total videos, registered learners, and learning hours.
* **Video & Content Management:** Upload YouTube videos, generate AI-powered scripts, and curate Japanese-Vietnamese dual subtitles.
* **Vocabulary & Kanji Control:** Automatically extract and manage vocabulary lists, JLPT levels, and Kanji definitions for each video.
* **User Management:** Oversee user accounts, track learner progress, and handle access control.

### 👩‍🎓 For Learners
Learners have access to a rich suite of interactive tools to study Japanese efficiently.
* **Immersive Video Player:** Watch anime with synced dual subtitles. Toggle Furigana (reading aids) on or off depending on your level.
* **Interactive Subtitles:** Click on any word in the subtitle to instantly look up its meaning, part of speech, JLPT level, and Kanji breakdown without pausing your flow.
* **Shadowing & Karaoke Mode:** Practice speaking with Shadowing mode or enjoy synced lyrics in a beautiful Karaoke interface.
* **Pop-up Quizzes:** Test your listening and reading comprehension with AI-generated quizzes that appear dynamically while watching.
* **AI Grammar Assistant:** Ask the integrated AI Chatbot to deeply explain specific grammar patterns or cultural nuances found in the current scene.
* **Personal Vocabulary Notebook:** Save interesting words to your personal notebook and review them later using Spaced Repetition (Flashcards).

## 💻 Tech Stack

* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **Backend:** Node.js (Express), Python (FastAPI for AI processing)
* **Database:** MongoDB, ChromaDB (for Vector Search/RAG)
* **AI/ML:** Whisper (Audio Transcription), Kuroshiro/SudachiPy (Japanese NLP), LangChain

---

## 📸 Program Demo

### 1. Guest Interface

#### 1.1 Landing Page
Experience an engaging welcome screen introducing the platform's core values.
![Landing Page](ĐƯỜNG_DẪN_LINK_ẢNH_LANDING_PAGE_TẠI_ĐÂY)

#### 1.2 Authentication
* **Login Page:** Secure access portal with custom error handling and social login support.
  ![Login Page](https://github.com/user-attachments/assets/b4f26dd5-1431-4b96-9e8d-5dff670d0e18)

* **Sign Up Page:** Intuitive onboarding experience designed for new Japanese learners.
  ![SignUp Page](https://github.com/user-attachments/assets/546611ad-7717-403d-a760-f721079a4094)

---

### 2. Learner Interface

#### 2.1 Home Dashboard
Browse through an expansive library of video contents categorized perfectly by topics and JLPT sub-levels.
![Home Dashboard](https://github.com/user-attachments/assets/04e718d4-563a-448f-8dc7-1e44d13c5ec5)

#### 2.2 Immersive Learning Player
Study seamlessly with high-fidelity media layout integrated with dynamic subtitles, Furigana controller, and speed toggles.
![Immersive Workspace](https://github.com/user-attachments/assets/b3c87df9-0757-4913-b58e-97563c094b80)

#### 2.3 Interactive Dictionary & Kanji Toolkit
Instantly lookup Kanji composition, radicals, stroke-counts, and translations by interacting with running lyrics.
![Interactive Dictionary](https://github.com/user-attachments/assets/58bbdca4-dbc0-4521-aebf-5000ade177b9)

#### 2.4 Pop-up Grammar Quiz
Reinforce immediate comprehension with interactive mini-quizzes triggered during the media streaming flow.
![Interactive Pop-up Quiz](https://github.com/user-attachments/assets/917b6c78-197c-42d0-b7f8-b4728cdffb0f)

#### 2.5 Profile & Gamified Analytics
Keep motivation running high with continuous streak calculation, rank leveling, and statistical chart trackers.
![User Profile & Analytics - Part 1](https://github.com/user-attachments/assets/61171e7b-e6c1-450e-8b77-c98aa77d0223)
![User Profile & Analytics - Part 2](https://github.com/user-attachments/assets/7a48c637-9e1d-429e-8f8c-0f7c9976f66e)

---


