export type Sense = {
  english_definitions: string[];
  parts_of_speech: string[];
};

export type JapaneseWord = {
  word?: string;
  reading: string;
};

export interface KanjiInfo {
  kanji: string;
  mean: string;
  kun: string;
  on: string;
  level: number | string;
  stroke_count: number | string;
  detail: string;
}

export type WordData = {
  id?: string;
  _id?: string;
  word: string;
  reading: string;
  partOfSpeech?: number | string;
  pos?: string;
  meaning?: string[] | string;
  meaning_vi?: string;
  is_common?: boolean;
  jlpt?: string[];
  senses?: Sense[];
  japanese?: JapaneseWord[];
};