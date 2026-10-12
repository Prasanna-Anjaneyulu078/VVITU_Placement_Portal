import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, ChevronDown, ChevronUp, Loader2, Bot } from 'lucide-react';
import api from '../../../utils/axiosConfig';
import './index.css';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const toggleOpen = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: 'Hi! I am the VVITU AI Placement Assistant. How can I help you today?',
          sources: []
        }
      ]);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: userMessage });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.answer,
        sources: response.data.sources || []
      }]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I am sorry, I am having trouble connecting to my knowledge base right now. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const sendQuickQuestion = (q) => {
    if (isLoading) return;
    setInput(q);
    // Use timeout to allow setInput to finish if needed, but we can just call API directly
    const mockEvent = { preventDefault: () => {} };
    handleSubmit({ ...mockEvent, target: { value: q } }, q); // we need to refactor handleSubmit slightly to accept text directly or use a separate func
  };

  const handleQuickSend = async (q) => {
    if (isLoading) return;
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: q });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.answer,
        sources: response.data.sources || []
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I am sorry, I am having trouble connecting to my knowledge base right now.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  const quickQuestions = [
    "What jobs am I eligible for?",
    "Why am I not eligible?",
    "What skills are required?",
    "What documents do I need?",
    "What is my application status?"
  ];

  if (!isOpen) {
    return (
      <button className="ai-assistant-fab" onClick={toggleOpen} aria-label="Open AI Assistant">
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div className="ai-assistant-modal">
      <div className="ai-assistant-header">
        <div className="ai-header-title">
          <Sparkles size={20} className="ai-header-icon" />
          <div>
            <h3>AI Placement Assistant</h3>
            <span>Ask questions about jobs and placements</span>
          </div>
        </div>
        <button className="ai-close-btn" onClick={toggleOpen}>
          <X size={20} />
        </button>
      </div>

      <div className="ai-assistant-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`ai-message-wrapper ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}>
            {msg.role === 'assistant' && (
              <div className="ai-avatar">
                <Bot size={18} />
              </div>
            )}
            <div className="ai-message-content">
              <div className="ai-bubble">
                {msg.content}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="ai-sources">
                  <strong>Sources:</strong>
                  <ul>
                    {msg.sources.map((s, i) => (
                      <li key={i}>• {s.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="ai-message-wrapper bot-message">
            <div className="ai-avatar">
              <Bot size={18} />
            </div>
            <div className="ai-message-content">
              <div className="ai-bubble ai-loading">
                <Loader2 className="spinner-icon" size={16} /> Thinking...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length < 3 && (
        <div className="ai-quick-questions">
          {quickQuestions.map((q, i) => (
            <button key={i} className="ai-quick-btn" onClick={() => handleQuickSend(q)} disabled={isLoading}>
              {q}
            </button>
          ))}
        </div>
      )}

      <form className="ai-assistant-input" onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about jobs, eligibility..."
          disabled={isLoading}
          rows={1}
        />
        <button type="submit" disabled={!input.trim() || isLoading}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
