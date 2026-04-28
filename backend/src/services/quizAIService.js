const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

export const generateQuizFromScript = async (script) => {
    try {
        const compactScript = script.map(s => `[${s.timestamp}] JP: ${s.japanese} - VI: ${s.vietnamese}`).join('\n');

        const fullPrompt = `You are an expert Japanese language teacher. 
I will provide you with a video script containing timestamps, Japanese text, and Vietnamese translations.
Your task is to generate a Multiple Choice Quiz AND determine the overall JLPT level of the video.

Rule 1: Select sentences distributed roughly evenly throughout the video.
Rule 2: You MUST use the EXACT timestamp of the sentence you choose from the script.
Rule 3: Rotate between 5 question types: "fill_in_blank", "vocabulary", "translation", "grammar_particle", "kanji_reading".
Rule 4: Provide exactly 4 options per question, only 1 is correct.
Rule 5: Provide a short educational explanation in Vietnamese.
Rule 6: CRITICAL! You MUST randomize the position of the correct answer among the 4 options.
Rule 7: Analyze the overall complexity of the vocabulary and grammar in the script to determine its JLPT level. The value MUST be exactly one of: "N5", "N4", "N3", "N2", "N1".

Output exactly this JSON structure:
{
  "jlptLevel": "N3",
  "questions": [
    {
      "timestamp": "00:15",
      "type": "grammar_particle",
      "questionText": "Trong câu '図書館___本を読みます', trợ từ cần điền là gì?",
      "options": ["に", "で", "を", "へ"],
      "correctAnswerIndex": 1,
      "explanation": "Trợ từ 'で' (de) chỉ địa điểm xảy ra hành động."
    }
  ]
}

Here is the video script:
${compactScript}`;

        // Gọi API Google Gemini (Dùng model gemini-2.5-flash siêu nhanh)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: fullPrompt }]
                }],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: "application/json" // Tính năng độc quyền của Gemini ép 100% ra JSON
                }
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Lỗi từ API Gemini');

        const aiText = data.candidates[0].content.parts[0].text;
        const parsedJson = JSON.parse(aiText);
        
        // TRẢ VỀ CẢ 2 DỮ LIỆU CHUẨN XÁC
        return {
            jlptLevel: parsedJson.jlptLevel,
            questions: parsedJson.questions
        };

    } catch (error) {
        console.error("Lỗi khi tạo Quiz bằng AI:", error);
        throw error;
    }
};