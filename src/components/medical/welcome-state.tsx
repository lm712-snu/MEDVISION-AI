'use client';

import { ScanLine, MessageSquare, Pill, ArrowUpRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

const avatarSrc = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/doctor-avatar.svg`;

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
    description: "Start with a clinical question or describe the patient's presentation",
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
    <div className="flex min-h-full flex-col items-center justify-center px-5 py-8 sm:px-8 sm:py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-xl"
      >
        <div className="mb-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:items-end sm:gap-5">
          <div className="relative flex h-40 w-40 shrink-0 items-end justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#e5f7f1] to-[#d0eee5] sm:h-44 sm:w-44">
            <img
              src={avatarSrc}
              alt="Friendly MedVision AI doctor assistant"
              width={160}
              height={180}
              className="h-[180px] w-[160px] object-contain object-bottom"
            />
            <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#168779] shadow-sm" aria-label="Ready to help">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <div className="relative mb-1 max-w-xs rounded-2xl rounded-bl-md border border-[#dcefe8] bg-white px-5 py-4 shadow-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-primary/70">Your clinical copilot</span>
            <p className="text-base font-semibold leading-snug text-foreground">“Hello, Doctor!”</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              I’m MedVision AI. How can I help you today?
            </p>
            <span className="absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 border-b border-r border-[#dcefe8] bg-white sm:bottom-5 sm:-left-1.5 sm:border-b-0 sm:border-l" />
          </div>
        </div>

        <div className="mb-7 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">Clinical intelligence, alongside you</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {getGreeting()}, Doctor.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            Let’s work through it together. Review scans, organize clinical context, or explore a question about a case.
          </p>
        </div>
      </motion.div>

      <div className="w-full max-w-xl space-y-3">
        {actionCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.action}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12 + index * 0.08, ease: 'easeOut' }}
            >
              <Card
                role="button"
                tabIndex={0}
                onClick={() => onAction(card.action)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onAction(card.action);
                  }
                }}
                className="warm-card-hover group cursor-pointer border-border/60 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f6f1] transition-colors group-hover:bg-[#d8eee7]">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">{card.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{card.description}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
      <p className="mt-5 flex items-center gap-2 text-center text-[11px] text-muted-foreground/80">
        <Sparkles className="h-3.5 w-3.5 text-primary/70" />
        Clinical decision support only — use your professional judgment.
      </p>
    </div>
  );
}
