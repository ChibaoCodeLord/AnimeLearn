const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

export const generateQuizFromScript = async (script) => {
    try {
        // Rút gọn script
        const compactScript = script.map(s => `[${s.timestamp}] JP: ${s.japanese} - VI: ${s.vietnamese}`).join('\n');
        const fullPrompt = `You are an expert Japanese language teacher. 
I will provide you with a video script containing timestamps, Japanese text, and Vietnamese translations.
Your task is to generate a Multiple Choice Quiz.

Rule 1: Select sentences distributed roughly evenly throughout the video (aim for about 1 question per 30-second interval).
Rule 2: You MUST use the EXACT timestamp of the sentence you choose from the script. Do NOT invent, round, or estimate timestamps.
Rule 3: Rotate between 3 question types: "fill_in_blank", "vocabulary", "translation".
Rule 4: Provide exactly 4 options per question, only 1 is correct.
Rule 5: Provide a short educational explanation in Vietnamese.
Rule 6: CRITICAL! You MUST randomize the position of the correct answer among the 4 options. The "correctAnswerIndex" must vary randomly between 0, 1, 2, and 3 across the generated questions. Do NOT always place the correct answer at index 0.

Output exactly this JSON structure:
{
  "questions": [
    {
      "timestamp": "00:15",
      "type": "fill_in_blank",
      "questionText": "Trong câu '私は___が好きです', từ bị thiếu là gì?",
      "options": ["りんご", "りんか", "りこ", "りか"],
      "correctAnswerIndex": 0,
      "explanation": "りんご (Ringo) có nghĩa là quả táo."
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

        if (!response.ok) {
            console.error("Gemini Error Details:", data);
            throw new Error(data.error?.message || 'Lỗi từ API Gemini');
        }

        // Bóc tách JSON từ response của Gemini
        const aiText = data.candidates[0].content.parts[0].text;
        const parsedJson = JSON.parse(aiText);
        
        return parsedJson.questions;

    } catch (error) {
        console.error("Lỗi khi tạo Quiz bằng AI:", error);
        throw error;
    }
};