import { GoogleGenerativeAI } from '@google/generative-ai';
import { pool } from '../index';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

interface ChatContext {
    userId: string;
    userEmail: string;
}

export const generateAIResponse = async (message: string, context: ChatContext): Promise<string> => {
    try {
        // 1. Fetch User Data for Context
        const shiftsRes = await pool.query(
            `SELECT * FROM shifts WHERE user_id = $1 AND start_time > NOW() - INTERVAL '3 months' ORDER BY start_time DESC LIMIT 20`,
            [context.userId]
        );

        const earningsRes = await pool.query(
            `SELECT SUM(payment_amount) as total FROM shifts WHERE user_id = $1 AND EXTRACT(MONTH FROM start_time) = EXTRACT(MONTH FROM NOW())`,
            [context.userId]
        );

        const shifts = shiftsRes.rows;
        const currentMonthEarnings = earningsRes.rows[0]?.total || 0;

        // 2. Construct System Prompt
        const systemPrompt = `
      You are an intelligent assistant for a doctor's shift management app.
      Your goal is to help the doctor manage their schedule and track earnings.
      The user's current context:
      - Email: ${context.userEmail}
      - Earnings this month: R$${currentMonthEarnings}
      - Recent Shifts: ${JSON.stringify(shifts.map(s => ({
            location: s.location_name,
            start: s.start_time,
            amount: s.payment_amount
        })))}

      Rules:
      - Answer questions about earnings and schedule based on the provided data.
      - If the user asks to schedule a shift, EXTRACT the details in JSON format inside a special block like this:
        \`\`\`json
        {
          "action": "create_shift",
          "location": "Hospital Name",
          "start_time": "ISO Date",
          "end_time": "ISO Date",
          "amount": 1000
        }
        \`\`\`
      - Be helpful, concise, and professional.
      - Default currency: BRL (R$).
      - Timezone: America/Sao_Paulo.
    `;

        // 3. Generate Content
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am ready to assist you with your shifts and earnings." }],
                }
            ],
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        return response.text();

    } catch (error) {
        console.error('Gemini API Error:', error);
        return "I'm having trouble connecting to my brain right now. Please try again later.";
    }
};
