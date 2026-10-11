'use client';

import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChatMessage } from '@/store/medical-store';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  if (message.role === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-center my-3"
      >
        <span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full">
          {message.content}
        </span>
      </motion.div>
    );
  }

  if (message.role === 'assistant') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex gap-3 max-w-[85%] my-2"
      >
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
          <Brain className="h-4 w-4 text-primary" />
        </div>
        <div className="chat-bubble-assistant px-4 py-3 min-w-0">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.attachments.map((att, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs text-primary bg-primary/5 px-2 py-1 rounded-md">
                  {att.name}
                </span>
              ))}
            </div>
          )}
          <span className="block text-[10px] text-muted-foreground/60 mt-1.5">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </motion.div>
    );
  }

  // user message
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex justify-end my-2"
    >
      <div className="max-w-[75%]">
        <div className="chat-bubble-user px-4 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.attachments.map((att, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-md">
                  {att.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="block text-[10px] text-muted-foreground/60 mt-1 text-right">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 max-w-[85%] my-2">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
        <Brain className="h-4 w-4 text-primary" />
      </div>
      <div className="chat-bubble-assistant px-4 py-3 flex items-center gap-1.5">
        <span className="typing-dot h-2 w-2 rounded-full bg-primary/60" />
        <span className="typing-dot h-2 w-2 rounded-full bg-primary/60" />
        <span className="typing-dot h-2 w-2 rounded-full bg-primary/60" />
      </div>
    </div>
  );
}
