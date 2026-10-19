import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to get GoogleGenAI client with environment or user-supplied key
function getGeminiClient(userKey?: string): GoogleGenAI | null {
  const key = userKey || process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch {
    return null;
  }
}

// API: Evaluate Writing / Dictation
app.post('/api/evaluate-writing', async (req: Request, res: Response) => {
  try {
    const { userInput, targetAnswer, vietnamesePrompt, apiKey } = req.body;

    if (!userInput || !targetAnswer) {
      return res.status(400).json({ error: 'Missing userInput or targetAnswer' });
    }

    const ai = getGeminiClient(apiKey);
    if (!ai) {
      return res.json({
        useOffline: true,
        message: 'No valid GEMINI_API_KEY configured. Fallback to client-side engine.',
      });
    }

    const prompt = `
Bạn là giáo viên dạy tiếng Anh chuyên nghiệp cho người Việt Nam.
Nhiệm vụ: Chấm điểm bài viết tiếng Anh của học viên so với đáp án mẫu.

- Đề bài tiếng Việt: "${vietnamesePrompt || ''}"
- Đáp án mẫu chuẩn: "${targetAnswer}"
- Câu học viên viết: "${userInput}"

Hãy chấm điểm công tâm, chấp nhận các biến thể tương đương hợp lý (như rút gọn I'm / I am, don't / do not, mạo từ đồng nghĩa), nhưng bắt lỗi chính tả, sai thì ngữ pháp hoặc thiếu giới từ.

Hãy trả về DUY NHẤT một đối tượng JSON hợp lệ (không markdown block) có cấu trúc:
{
  "score": number, // từ 0 đến 100
  "grade": "excellent" | "good" | "fair" | "needs_work",
  "isAccepted": boolean, // true nếu câu đúng nghĩa và đúng ngữ pháp dù khác từ chút ít
  "grammarFeedback": string, // Nhận xét ngắn gọn bằng tiếng Việt về ngữ pháp, chia thì, giới từ
  "spellingErrors": string[], // Danh sách các từ viết sai chính tả (nếu có)
  "betterAlternatives": string[], // 1-2 cách diễn đạt tự nhiên khác của người bản xứ
  "highlight": string // Lời khen hoặc điểm cần khắc phục
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    const json = JSON.parse(text);
    return res.json(json);
  } catch (error: any) {
    console.warn('AI evaluation failed, returning fallback:', error.message);
    return res.json({
      useOffline: true,
      error: error.message,
    });
  }
});

// Helper for speaking evaluation handler
async function handlePronunciationEvaluation(req: Request, res: Response) {
  try {
    const {
      spokenText,
      targetAnswer,
      expectedText,
      vietnamesePrompt,
      vietnameseMeaning,
      apiKey,
    } = req.body;

    const actualSpoken = spokenText;
    const actualTarget = targetAnswer || expectedText;
    const actualPrompt = vietnamesePrompt || vietnameseMeaning;

    if (!actualSpoken || !actualTarget) {
      return res.status(400).json({ error: 'Missing spokenText or targetAnswer' });
    }

    const ai = getGeminiClient(apiKey);
    if (!ai) {
      return res.json({
        useOffline: true,
        message: 'No valid GEMINI_API_KEY. Using offline engine.',
      });
    }

    const prompt = `
Bạn là chuyên gia luyện phát âm tiếng Anh (Pronunciation Coach) cho người Việt Nam.
Nhiệm vụ: Chấm điểm và sửa lỗi phát âm dựa trên kết quả nhận diện giọng nói.

- Đề bài tiếng Việt: "${actualPrompt || ''}"
- Câu mẫu chuẩn tiếng Anh: "${actualTarget}"
- Câu nhận diện từ giọng nói học viên: "${actualSpoken}"

Hãy phân tích:
1. Độ khớp từ ngữ và âm thanh.
2. Các lỗi người Việt hay gặp trong câu này (ví dụ nuốt âm cuối /s/, /z/, /t/, /d/, quên đuôi -ed, âm /θ/ hay đọc thành /t/, /r/ và /l/, ngữ điệu).
3. Đưa ra hướng dẫn cụ thể cách đặt khẩu hình hoặc nhấn trọng âm.

Hãy trả về DUY NHẤT một đối tượng JSON hợp lệ (không markdown block) có cấu trúc:
{
  "overallScore": number, // 0 đến 100
  "score": number, // 0 đến 100
  "accuracy": number, // 0 đến 100
  "fluencyScore": number, // 0 đến 100
  "feedbackVi": string,
  "wordAnalysis": [
    {
      "word": string,
      "status": "correct" | "different" | "missing" | "extra",
      "expected": string
    }
  ],
  "phoneticTips": string[] // 2-3 mẹo phát âm thực tế cho người Việt với câu này
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    const json = JSON.parse(text);
    return res.json(json);
  } catch (error: any) {
    console.warn('AI speaking evaluation failed, returning fallback:', error.message);
    return res.json({
      useOffline: true,
      error: error.message,
    });
  }
}

app.post('/api/evaluate-pronunciation', handlePronunciationEvaluation);
app.post('/api/evaluate-speaking', handlePronunciationEvaluation);

// In dev mode, mount Vite middleware. In production, serve dist.
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
