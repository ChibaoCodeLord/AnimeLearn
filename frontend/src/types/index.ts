export interface WordToken {
  id: string;
  text: string;           // Chữ gốc trong câu
  reading?: string;       // Cách đọc (Hiragana/Romaji)
  meaning?: string;       // Nghĩa tiếng Việt
  isKeyWord: boolean;     // Có phải từ khóa cần gạch chân không
  jlptLevel?: string;     // N5, N4, N3...
}

export interface SubtitleLine {
  id: string;
  startTime: number;      // Giây
  endTime: number;
  tokens: WordToken[];    // Câu được bóc tách thành các từ
  translation: string;    // Nghĩa cả câu
}

export interface VideoData {
  id: string;
  title: string;
  thumbnail: string;
  youtubeId: string;
  level: string;
  duration: string;
  subtitles: SubtitleLine[];
}

export interface SavedWord {
  id: string;
  videoId: string;
  word: string;
  reading: string;
  meaning: string;
  context: string;        // Câu chứa từ đó
  savedAt: string;
}