import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Bot, User, Calendar, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

const CONVERSATION_SEQUENCE = [
  {
    id: 1,
    role: "user",
    text: "Hi, do you have any appointments available for a check-up next Tuesday?",
    delay: 1000
  },
  {
    id: 2,
    role: "ai",
    text: "Hello! 👋 I'd be happy to help with that. Let me check Dr. Sarah's schedule for next Tuesday...",
    delay: 1500
  },
  {
    id: 3,
    role: "ai",
    text: "I have a few openings on Tuesday, Oct 24th:\n• 10:00 AM\n• 2:30 PM\n• 4:15 PM\n\nWhich one works best for you?",
    delay: 2000
  },
  {
    id: 4,
    role: "user",
    text: "The 10:00 AM slot would be perfect.",
    delay: 1500
  },
  {
    id: 5,
    role: "ai",
    text: "Great choice! I've reserved the 10:00 AM slot for you. Would you like me to send a calendar invite?",
    delay: 1500
  },
  {
    id: 6,
    role: "user",
    text: "Yes please!",
    delay: 1000
  },
  {
    id: 7,
    role: "ai",
    text: "Done! 📅 I've sent the confirmation to your email. Is there anything else I can help you with?",
    delay: 1500
  }
];

export function AIReceptionistDemo() {
  const [visibleMessages, setVisibleMessages] = useState<typeof CONVERSATION_SEQUENCE>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= CONVERSATION_SEQUENCE.length) {
      // Reset loop after a long pause
      const timeout = setTimeout(() => {
        setVisibleMessages([]);
        setCurrentIndex(0);
      }, 5000);
      return () => clearTimeout(timeout);
    }

    const message = CONVERSATION_SEQUENCE[currentIndex];

    // If it's AI turn, show typing indicator first
    if (message.role === "ai") {
      setIsTyping(true);
      const typingTimeout = setTimeout(() => {
        setIsTyping(false);
        setVisibleMessages(prev => [...prev, message]);
        setCurrentIndex(prev => prev + 1);
      }, message.delay);
      return () => clearTimeout(typingTimeout);
    } else {
      // User message appears after delay
      const timeout = setTimeout(() => {
        setVisibleMessages(prev => [...prev, message]);
        setCurrentIndex(prev => prev + 1);
      }, message.delay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex]);

  return (
    <div className="relative w-full max-w-md mx-auto perspective-1000">
      {/* Floating Elements/Decorations */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-12 top-20 z-0 hidden md:block"
      >
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-full">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Status</p>
            <p className="text-sm font-bold text-gray-800">Booking Confirmed</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -left-12 bottom-32 z-0 hidden md:block"
      >
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Response Time</p>
            <p className="text-sm font-bold text-gray-800">Instant</p>
          </div>
        </div>
      </motion.div>

      {/* Main Chat Interface */}
      <Card className="relative z-10 border-0 shadow-2xl overflow-hidden bg-white/90 backdrop-blur-xl rounded-[2rem] ring-1 ring-black/5 h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">AI Assistant</h3>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <p className="text-xs text-blue-600 font-medium">Always Online</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {visibleMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
                  ))}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex justify-start"
              >
                <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-none flex gap-1.5 items-center shadow-sm">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Input Mockup */}
        <div className="p-4 border-t border-gray-100 bg-white/50">
          <div className="bg-gray-50 rounded-full p-3 flex items-center justify-between border border-gray-100">
            <div className="w-32 h-2 bg-gray-200 rounded-full ml-2" />
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
