'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSend: (content: string) => void;
  onAttach: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onAttach, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex items-end gap-2 p-3 bg-white border-t border-border/60">
      <Button
        variant="ghost"
        size="icon"
        onClick={onAttach}
        className="flex-shrink-0 h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5"
        disabled={disabled}
      >
        <Paperclip className="h-4.5 w-4.5" />
      </Button>

      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Describe the case, ask a question, or attach a scan\u2026'}
          disabled={disabled}
          rows={1}
          className="w-full resize-none rounded-xl border border-border/70 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all disabled:opacity-50"
          style={{ maxHeight: '160px' }}
        />
      </div>

      <Button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        size="icon"
        className="flex-shrink-0 h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
