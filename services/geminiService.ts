import { GoogleGenAI } from "@google/genai";
import { EmployeeProfile, BoxDefinition } from "../types";

const createClient = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateDevelopmentPlan = async (employee: EmployeeProfile, box: BoxDefinition): Promise<string> => {
  const client = createClient();
  if (!client) return "API Key not configured.";

  const prompt = `
    Роль: Ты опытный HR-директор и карьерный коуч.
    Задача: Дай краткие, конкретные рекомендации (3-4 пункта) по развитию сотрудника на основе методики 9-box.
    
    Сотрудник: ${employee.name}
    Должность: ${employee.position}
    Категория 9-box: ${box.name}
    Описание категории: ${box.description}
    
    Структура ответа:
    1. Краткий диагноз.
    2. План действий (список).
    3. Риски (если есть).
    
    Тон: Профессиональный, поддерживающий, ориентированный на бизнес.
    Формат: Markdown. Не используй общие фразы, дай конкретику для руководителя.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "Не удалось сгенерировать рекомендации.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Произошла ошибка при получении рекомендаций от ИИ.";
  }
};