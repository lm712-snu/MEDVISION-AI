'use client';

import { motion } from 'framer-motion';
import type { ChatMessage } from '@/store/medical-store';

const avatarSrc = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/doctor-avatar.svg`;

function DoctorAvatar({ small = false }: { small?: boolean }) {
  return (
    <div className={`relative mt-0.5 flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d7eee6] bg-[#e4f6f0] ${small ? 'h-9 w-9' : 'h-10 w-10'}`}>
      <img
        src={avatarSrc}
        alt="MedVision AI assistant"
        width={40}
        height={45}
        className="h-full w-full object-cover object-top"
      />
    </div>
  );
}

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
        className="my-3 flex justify-center"
      >
        <span className="rounded-full bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
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
        className="my-3 flex max-w-[92%] gap-2.5 sm:gap-3"
      >
        <DoctorAvatar />
        <div className="chat-bubble-assistant min-w-0 rounded-2xl rounded-tl-md px-4 py-3">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-primary">MedVision AI</span>
            <span className="h-1 w-1 rounded-full bg-[#8fc9b8]" />
            <span className="text-[10px] text-muted-foreground/70">Clinical copilot</span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{message.content}</p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.attachments.map((att, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-md bg-primary/5 px-2 py-1 text-xs text-primary">
                  {att.name}
                </span>
              ))}
            </div>
          )}
          <span className="mt-1.5 block text-[10px] text-muted-foreground/60">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="my-2 flex justify-end"
    >
      <div className="max-w-[82%] sm:max-w-[75%]">
        <div className="chat-bubble-user px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.attachments.map((att, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-1 text-xs">
                  {att.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="mt-1 block text-right text-[10px] text-muted-foreground/60">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <div className="my-3 flex max-w-[92%] gap-2.5 sm:gap-3">
      <DoctorAvatar small />
      <div className="chat-bubble-assistant flex items-center gap-1.5 rounded-2xl rounded-tl-md px-4 py-3">
        <span className="mr-1 text-[11px] font-medium text-primary">MedVision AI</span>
        <span className="typing-dot h-2 w-2 rounded-full bg-primary/60" />
        <span className="typing-dot h-2 w-2 rounded-full bg-primary/60" />
        <span className="typing-dot h-2 w-2 rounded-full bg-primary/60" />
      </div>
    </div>
  );
}
