import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import api from '../api';

interface Message {
    role: 'user' | 'model';
    text: string;
}

const ChatAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: 'Olá! Sou seu assistente virtual. Pergunte sobre seus plantões ou ganhos.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const toggleChat = () => setIsOpen(!isOpen);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setLoading(true);

        try {
            const res = await api.post('/ai/chat', { message: userMessage });
            setMessages(prev => [...prev, { role: 'model', text: res.data.response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: "Desculpe, não consegui conectar ao servidor." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={toggleChat}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                </button>
            </div>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 animate-fade-in-up overflow-hidden">
                    <div className="bg-blue-600 p-4 flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full">
                            <Bot className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Assistente Dr.</h3>
                            <p className="text-blue-100 text-xs">Desenvolvido com IA</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Pergunte sobre seus ganhos ou escala..."
                                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatAssistant;
