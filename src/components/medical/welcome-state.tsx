'use client';

import { ScanLine, MessageSquare, Pill } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface WelcomeStateProps {
  onAction: (action: 'upload_scan' | 'discuss_case' | 'review_meds') => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const actionCards = [
  {
    action: 'upload_scan' as const,
    icon: ScanLine,
    title: 'Review a medical scan',
    description: 'Upload an MRI, CT, or X-ray for analysis',
  },
  {
    action: 'discuss_case' as const,
    icon: MessageSquare,
    title: 'Discuss a clinical case',
    description: 'Start with a clinical question or describe the patient\'s presentation',
  },
  {
    action: 'review_meds' as const,
    icon: Pill,
    title: 'Review medications',
    description: 'Check a medication list for interactions and contraindications',
  },
];

export function WelcomeState({ onAction }: WelcomeStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center max-w-md"
      >
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          {getGreeting()}, Doctor.
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          I&apos;m here to help you review scans, organize clinical context, and explore possible findings. What would you like to look at today?
        </p>
      </motion.div>

      <div className="w-full max-w-md space-y-3">
        {actionCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.action}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + index * 0.1, ease: 'easeOut' }}
            >
              <Card
                className="p-4 cursor-pointer warm-card-hover border-border/50 bg-white hover:bg-white/90 group"
                onClick={() => onAction(card.action)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
