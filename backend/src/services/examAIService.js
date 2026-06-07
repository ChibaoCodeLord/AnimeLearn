import { normalizeQuestionGroup, normalizeQuestionGroups } from './examService.js';

function getGeminiConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_EXAM_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  };
}

const questionSchema = {
  type: 'OBJECT',
  properties: {
    order: { type: 'INTEGER' },
    type: {
      type: 'STRING',
      enum: [
        'kanji_reading',
        'vocabulary',
        'grammar',
        'reading',
        'listening',
        'sentence_reorder',
        'blank',
        'other',
      ],
    },
    questionText: { type: 'STRING' },
    stemText: { type: 'STRING' },
    options: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          label: { type: 'STRING' },
          text: { type: 'STRING' },
          imageUrl: { type: 'STRING' },
        },
        required: ['label', 'text'],
      },
    },
    correctOptionIndex: { type: 'INTEGER', nullable: true },
    answerSource: {
      type: 'STRING',
      enum: ['ai_inferred', 'source_marked', 'unknown'],
    },
    answerConfidence: { type: 'NUMBER' },
    explanation: { type: 'STRING' },
    aiNotes: { type: 'STRING' },
  },
  required: ['order', 'type', 'questionText', 'options'],
};

const groupSchema = {
  type: 'OBJECT',
  properties: {
    order: { type: 'INTEGER' },
    mondaiNumber: { type: 'INTEGER' },
    title: { type: 'STRING' },
    instruction: { type: 'STRING' },
    passageText: { type: 'STRING' },
    attachmentImageUrl: { type: 'STRING' },
    audioUrl: { type: 'STRING' },
    audioStartSeconds: { type: 'NUMBER', nullable: true },
    audioEndSeconds: { type: 'NUMBER', nullable: true },
    questions: {
      type: 'ARRAY',
      items: questionSchema,
    },
  },
  required: ['order', 'mondaiNumber', 'title', 'instruction', 'questions'],
};

const responseSchema = {
  type: 'OBJECT',
  properties: {
    sectionTitle: { type: 'STRING' },
    groups: {
      type: 'ARRAY',
      items: groupSchema,
    },
  },
  required: ['sectionTitle', 'groups'],
};

function sectionInstruction(sectionType, hasAudioFile = false) {
  switch (sectionType) {
    case 'vocabulary_grammar':
      return 'This is the JLPT vocabulary, kanji, and grammar section. Split by Mondai/問題 blocks. Extract, solve, choose the best answer, and explain vocabulary/grammar reasons in Vietnamese.';
    case 'reading':
      return 'This is the JLPT reading section. Split by reading Mondai/passages. Put each shared passage or table into that group passageText, then solve questions using evidence from the passage and explain in Vietnamese.';
    case 'listening':
      return hasAudioFile
        ? 'This is the JLPT listening section. Use both the printed document and the audio file. Split into Mondai blocks, usually Mondai 1, 2, 3, 4, and 5. Transcribe or summarize the relevant audio only as needed to solve each question, choose answers, explain in Vietnamese, and set audioStartSeconds/audioEndSeconds for each Mondai when possible.'
        : 'This is the JLPT listening section. Split by Mondai. Extract visible prompts/options/transcripts. If the answer depends on missing audio, set correctOptionIndex to null and explain what is missing.';
    default:
      return 'Extract and solve JLPT multiple-choice questions. Split content into Mondai groups when visible.';
  }
}

function buildPrompt({
  sectionType,
  sectionTitle = '',
  startMondaiNumber = 1,
  hasAudioFile = false,
}) {
  const listeningInstruction = sectionType === 'listening' && hasAudioFile
    ? `
Listening import detail:
- File 1 is the printed document/image/PDF for the listening section.
- File 2 is the full listening audio for this section.
- Use the audio to infer the correct answers when the document does not show an answer key.
- Split the output by Mondai. For JLPT listening, create Mondai 1, Mondai 2, Mondai 3, Mondai 4, and Mondai 5 when they are present in the document or audio.
- For each Mondai group, set audioStartSeconds and audioEndSeconds to the approximate segment in the full audio. Use null if a boundary cannot be determined.
- Keep audioUrl as an empty string. The server will fill the uploaded audio URL later.
`
    : '';

  return `
You are preparing JLPT exam content for an EdTech admin import tool.

Task:
- Read the provided image or PDF.
- This file may contain a FULL JLPT skill/section, not just one Mondai.
- Extract every visible question in this skill.
- Split the output into groups by Mondai/問題 number. If no Mondai boundary is visible, create one group for the whole file.
- Return valid JSON only.
- Keep Japanese text exactly as written, including punctuation and blank markers.
- Do not translate unless a translation is visibly present.
- For every question, choose the best correct answer as an expert Japanese teacher.
- If the source has a marked answer/key, use it and set answerSource to "source_marked".
- If the source does not show an answer, solve the question from the Japanese text/options and set answerSource to "ai_inferred".
- Set correctOptionIndex to null only when the image/PDF is too unclear, options are missing, or the question depends on missing audio.
- correctOptionIndex is zero-based: A=0, B=1, C=2, D=3.
- Write a concise explanation in Vietnamese for why the chosen answer is correct. If correctOptionIndex is null, explain what is missing.
- Set answerConfidence from 0 to 1. Use >=0.85 only when confident.
- Use option labels A, B, C, D for options in visual order.
- If a character is uncertain, preserve your best OCR guess and put a short note in aiNotes.
- Do not drop questions. Preserve question order across the full skill.

Section:
- sectionType: ${sectionType}
- desired sectionTitle: ${sectionTitle || ''}
- startMondaiNumber: ${startMondaiNumber || 1}

Section-specific instruction:
${sectionInstruction(sectionType, hasAudioFile)}
${listeningInstruction}

JSON shape:
{
  "sectionTitle": "Từ vựng & Ngữ pháp",
  "groups": [
    {
      "order": 1,
      "mondaiNumber": 1,
      "title": "問題1",
      "instruction": "Instruction text from the file",
      "passageText": "Shared reading passage/table text, empty string if none",
      "attachmentImageUrl": "",
      "audioUrl": "",
      "audioStartSeconds": null,
      "audioEndSeconds": null,
      "questions": [
        {
          "order": 1,
          "type": "kanji_reading | vocabulary | grammar | reading | listening | sentence_reorder | blank | other",
          "questionText": "Question prompt",
          "stemText": "Optional sentence/stem shown under the prompt",
          "options": [
            { "label": "A", "text": "..." },
            { "label": "B", "text": "..." },
            { "label": "C", "text": "..." },
            { "label": "D", "text": "..." }
          ],
          "correctOptionIndex": 2,
          "answerSource": "ai_inferred",
          "answerConfidence": 0.92,
          "explanation": "Giải thích ngắn bằng tiếng Việt vì sao đáp án này đúng.",
          "aiNotes": ""
        }
      ]
    }
  ]
}`;
}

function getGeminiText(data) {
  return data?.candidates?.[0]?.content?.parts
    ?.map(part => part.text || '')
    .join('')
    .trim();
}

function parseJsonText(text) {
  if (!text) throw new Error('Gemini không trả về nội dung');

  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(cleaned);
}

function buildGeminiFileParts(files) {
  return files.flatMap((entry, index) => {
    const sourceFile = entry.file;
    return [
      {
        text: `${entry.label || `File ${index + 1}`}: ${sourceFile.originalname || 'upload'} (${sourceFile.mimetype})`,
      },
      {
        inlineData: {
          mimeType: sourceFile.mimetype,
          data: sourceFile.buffer.toString('base64'),
        },
      },
    ];
  });
}

async function callGemini({ prompt, file, files, useSchema }) {
  const { apiKey, model } = getGeminiConfig();
  const generationConfig = {
    temperature: 0.1,
    responseMimeType: 'application/json',
  };

  if (useSchema) {
    generationConfig.responseSchema = responseSchema;
  }

  const inputFiles = Array.isArray(files) && files.length
    ? files
    : [{ file, label: 'Source file' }].filter(entry => entry.file);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            ...buildGeminiFileParts(inputFiles),
          ],
        }],
        generationConfig,
      }),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Gemini API error');
  }

  return data;
}

async function extractWithGemini({
  file,
  files,
  sectionType,
  sectionTitle = '',
  startMondaiNumber = 1,
}) {
  if (!getGeminiConfig().apiKey) {
    throw new Error('GEMINI_API_KEY chưa được cấu hình');
  }

  const inputFiles = Array.isArray(files) && files.length
    ? files
    : [{ file, label: 'Source file' }].filter(entry => entry.file);

  if (!inputFiles.length || inputFiles.some(entry => !entry.file?.buffer?.length)) {
    throw new Error('File import không hợp lệ');
  }

  const hasAudioFile = inputFiles.some(entry => (
    entry.role === 'audio' || entry.file?.mimetype?.startsWith('audio/')
  ));
  const prompt = buildPrompt({
    sectionType,
    sectionTitle,
    startMondaiNumber,
    hasAudioFile,
  });
  let data;

  try {
    data = await callGemini({ prompt, files: inputFiles, useSchema: true });
  } catch (_error) {
    data = await callGemini({ prompt, files: inputFiles, useSchema: false });
  }

  return parseJsonText(getGeminiText(data));
}

export async function extractExamSectionFromFile({
  file,
  audioFile = null,
  sectionType,
  sectionTitle = '',
  startMondaiNumber = 1,
}) {
  const inputFiles = [
    { file, label: 'File 1 - printed document', role: 'document' },
    audioFile ? { file: audioFile, label: 'File 2 - listening audio', role: 'audio' } : null,
  ].filter(Boolean);

  const parsed = await extractWithGemini({
    file,
    files: inputFiles,
    sectionType,
    sectionTitle,
    startMondaiNumber,
  });
  const rawGroups = Array.isArray(parsed.groups)
    ? parsed.groups
    : [parsed];

  const sourceFileName = [file?.originalname, audioFile?.originalname].filter(Boolean).join(' + ');
  const groups = normalizeQuestionGroups(rawGroups, {
    sourceFileName,
  }).map((group, index) => ({
    ...group,
    order: index + 1,
    mondaiNumber: Number(group.mondaiNumber) || startMondaiNumber + index,
    sourceFileName,
  }));

  return {
    sectionTitle: parsed.sectionTitle || sectionTitle || '',
    groups,
  };
}

export async function extractExamGroupFromFile({
  file,
  sectionType,
  mondaiNumber = 1,
  title = '',
  instruction = '',
}) {
  const section = await extractExamSectionFromFile({
    file,
    sectionType,
    sectionTitle: title,
    startMondaiNumber: Number(mondaiNumber) || 1,
  });

  const firstGroup = section.groups[0] || normalizeQuestionGroup({
    mondaiNumber,
    title: title || `Mondai ${mondaiNumber}`,
    instruction,
    questions: [],
  }, {
    sourceFileName: file.originalname,
  });

  return {
    ...firstGroup,
    title: firstGroup.title || title || `Mondai ${mondaiNumber}`,
    instruction: firstGroup.instruction || instruction,
  };
}
