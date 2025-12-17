
import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeStudentProgress = async (student: Student): Promise<string> => {
  try {
    const isB2orC1 = student.licenseClass !== 'B tự động';
    
    const prompt = `
      Bạn là một trợ lý ảo thông minh chuyên phân tích dữ liệu đào tạo lái xe (DAT).
      Hãy phân tích tiến độ của học viên sau đây và đưa ra nhận xét ngắn gọn, hữu ích (dưới 150 từ) bằng tiếng Việt.

      Thông tin học viên:
      - Tên: ${student.fullName}
      - Hạng bằng: ${student.licenseClass}
      - Mục tiêu chung: ${student.targetKm} km và ${student.targetHours} giờ.
      - Hiện tại chung: ${student.currentKm} km và ${student.currentHours} giờ.
      - Giờ ban đêm: ${student.currentNightHours}/${student.targetNightHours} giờ.
      ${isB2orC1 ? `- Giờ xe số tự động: ${student.currentAutomaticHours}/${student.targetAutomaticHours} giờ.` : ''}
      
      Hãy đưa ra lời khuyên cụ thể. Nếu họ thiếu giờ đêm hoặc giờ tự động (đối với B2/C1), hãy nhắc nhở ưu tiên.
      Định dạng kết quả trả về dưới dạng Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Không thể tạo nhận xét vào lúc này.";
  } catch (error) {
    console.error("Lỗi khi gọi Gemini:", error);
    return "Đã xảy ra lỗi khi phân tích dữ liệu. Vui lòng thử lại sau.";
  }
};
