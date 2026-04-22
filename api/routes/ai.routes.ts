import express from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware';
import { generateAIResponse } from '../services/ai.service';

const router = express.Router();

router.post('/chat', authenticateJWT, async (req: AuthRequest, res) => {
    const { message } = req.body;
    const user = req.user;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const aiResponse = await generateAIResponse(message, {
            userId: user!.id,
            userEmail: user!.email
        });

        res.json({ response: aiResponse });
    } catch (error) {
        console.error('AI Route Error:', error);
        res.status(500).json({ error: 'Failed to process AI request' });
    }
});

export default router;
