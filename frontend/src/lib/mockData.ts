import type { VideoData, SavedWord } from "../types/index.js";

export const MOCK_VIDEOS: VideoData[] = [
  {
    id: "vid_01",
    title: "Cuộc hội thoại cơ bản - Chào hỏi",
    thumbnail: "https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg",
    youtubeId: "aqz-KE-bpKQ",
    level: "N5",
    duration: "03:15",
    subtitles: [
      {
        id: "sub_1",
        startTime: 0,
        endTime: 3,
        translation: "Xin chào, rất vui được gặp bạn.",
        tokens: [
          { id: "w1", text: "初めまして", reading: "はじめまして", meaning: "Rất vui được gặp mặt (lần đầu)", isKeyWord: true, jlptLevel: "N5" },
          { id: "w2", text: "、", isKeyWord: false },
          { id: "w3", text: "よろしく", reading: "よろしく", meaning: "Mong được giúp đỡ", isKeyWord: true, jlptLevel: "N5" },
          { id: "w4", text: "お願い", reading: "おねがい", meaning: "Làm ơn / Nhờ vả", isKeyWord: true, jlptLevel: "N5" },
          { id: "w5", text: "します", isKeyWord: false },
          { id: "w6", text: "。", isKeyWord: false },
        ]
      },
      {
        id: "sub_2",
        startTime: 3.5,
        endTime: 6,
        translation: "Tôi là kỹ sư IT đến từ Việt Nam.",
        tokens: [
          { id: "w7", text: "私", reading: "わたし", meaning: "Tôi", isKeyWord: true, jlptLevel: "N5" },
          { id: "w8", text: "は", isKeyWord: false },
          { id: "w9", text: "ベトナム", reading: "Betonamu", meaning: "Việt Nam", isKeyWord: true },
          { id: "w10", text: "から", meaning: "Từ", isKeyWord: true, jlptLevel: "N5" },
          { id: "w11", text: "来た", reading: "きた", meaning: "Đã đến", isKeyWord: true, jlptLevel: "N5" },
          { id: "w12", text: "ITエンジニア", reading: "IT enjinia", meaning: "Kỹ sư IT", isKeyWord: true, jlptLevel: "N4" },
          { id: "w13", text: "です", isKeyWord: false },
          { id: "w14", text: "。", isKeyWord: false },
        ]
      }
    ]
  }
];

export const MOCK_SAVED_WORDS: SavedWord[] = [
  {
    id: "sw_1",
    videoId: "vid_01",
    word: "ITエンジニア",
    reading: "IT enjinia",
    meaning: "Kỹ sư IT",
    context: "私はベトナムから来たITエンジニアです。",
    savedAt: "2026-03-14T00:00:00Z"
  }
];