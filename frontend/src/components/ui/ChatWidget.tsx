import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { cn } from './GlassCard';
import ReactMarkdown from 'react-markdown';
import { fetchJson } from '../../api/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export default function ChatWidget({ candidateId }: { candidateId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'ai', content: "Hi! Ask me any questions about this candidate based on their official documents." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetchJson<{response: string}>(`/adventure/chat/${candidateId}`, {
        method: 'POST',
        body: JSON.stringify({ message: userMessage.content })
      });
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: res.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: 'Sorry, I encountered an error answering that.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 p-4 bg-nw-primary text-white rounded-full shadow-xl hover:bg-nw-primary-light transition-all duration-300 z-40",
          isOpen && "scale-0 opacity-0"
        )}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <div
        className={cn(
          "fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] flex flex-col glass-card border-black/10 dark:border-white/10 z-50 transition-all duration-300 origin-bottom-right shadow-2xl",
          isOpen ? "scale-100 opacity-100" : "scale-50 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10 bg-nw-primary/5 dark:bg-nw-primary/10 rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-nw-primary dark:text-nw-primary-light" />
            <h3 className="font-medium text-nw-text-light dark:text-nw-text-dark">Ask AI Assistant</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-nw-text-light-muted hover:text-nw-text-light dark:text-nw-text-dark-muted dark:hover:text-nw-text-dark">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-nw-primary text-white rounded-tr-sm" 
                  : "bg-black/5 dark:bg-white/10 text-nw-text-light dark:text-nw-text-dark rounded-tl-sm"
              )}>
                {msg.role === 'ai' ? (
                  <div className="prose dark:prose-invert prose-sm prose-p:my-1 prose-ul:my-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-black/5 dark:bg-white/10 rounded-2xl px-4 py-3 rounded-tl-sm flex space-x-1">
                <div className="w-2 h-2 bg-nw-text-light-muted dark:bg-nw-text-dark-muted rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-nw-text-light-muted dark:bg-nw-text-dark-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-nw-text-light-muted dark:bg-nw-text-dark-muted rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-black/10 dark:border-white/10">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about policies, background..."
              className="w-full bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-full pl-4 pr-12 py-2 text-sm focus:outline-none focus:border-nw-primary dark:focus:border-nw-primary-light text-nw-text-light dark:text-nw-text-dark placeholder-nw-text-light-muted dark:placeholder-nw-text-dark-muted"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-1 top-1 p-1.5 bg-nw-primary text-white rounded-full hover:bg-nw-primary-light transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
