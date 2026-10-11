'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMedicalStore } from '@/store/medical-store';
import { toast } from 'sonner';

interface InlineCaseFormProps {
  onSubmit: (caseData: { id: string; patientId: string; scanType: string; bodyRegion: string }) => void;
}

const SCAN_TYPES = ['MRI', 'CT', 'X-ray', 'Ultrasound', 'PET', 'Mammography'];
const BODY_REGIONS = [
  'Brain', 'Cervical Spine', 'Thoracic Spine', 'Lumbar Spine',
  'Chest', 'Abdomen', 'Pelvis', 'Shoulder', 'Knee', 'Hip',
  'Ankle', 'Wrist', 'Cardiac', 'Whole Body',
];

export function InlineCaseForm({ onSubmit }: InlineCaseFormProps) {
  const { draftCase, setDraftCase, createCase } = useMedicalStore();
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async () => {
    if (!draftCase.patientId.trim()) {
      toast.error('Please enter a patient identifier.');
      return;
    }
    if (!draftCase.bodyRegion.trim()) {
      toast.error('Please select a body region.');
      return;
    }

    setIsCreating(true);
    try {
      // Use client-side store instead of API
      const newCase = createCase({
        patientName: draftCase.patientName || null,
        patientId: draftCase.patientId,
        scanType: draftCase.scanType,
        bodyRegion: draftCase.bodyRegion,
        notes: draftCase.notes || null,
      });

      toast.success('Case created successfully.');
      onSubmit({
        id: newCase.id,
        patientId: draftCase.patientId,
        scanType: draftCase.scanType,
        bodyRegion: draftCase.bodyRegion,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create case';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="my-3 ml-11"
    >
      <div className="chat-bubble-assistant p-4 space-y-4">
        <p className="text-sm text-foreground font-medium">
          Set up the case
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Patient identifier
            </Label>
            <Input
              placeholder="e.g., PT-20250610"
              value={draftCase.patientId}
              onChange={(e) => setDraftCase({ patientId: e.target.value })}
              className="h-9 text-sm bg-background border-border/60"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Patient name <span className="text-muted-foreground/50">(optional)</span>
            </Label>
            <Input
              placeholder="e.g., Jane Doe"
              value={draftCase.patientName}
              onChange={(e) => setDraftCase({ patientName: e.target.value })}
              className="h-9 text-sm bg-background border-border/60"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Scan type
            </Label>
            <Select
              value={draftCase.scanType}
              onValueChange={(v) => setDraftCase({ scanType: v })}
            >
              <SelectTrigger className="h-9 text-sm bg-background border-border/60">
                <SelectValue placeholder="Select scan type" />
              </SelectTrigger>
              <SelectContent>
                {SCAN_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Body region
            </Label>
            <Select
              value={draftCase.bodyRegion}
              onValueChange={(v) => setDraftCase({ bodyRegion: v })}
            >
              <SelectTrigger className="h-9 text-sm bg-background border-border/60">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {BODY_REGIONS.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isCreating || !draftCase.patientId.trim() || !draftCase.bodyRegion.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Creating...
              </>
            ) : (
              'Set up case'
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
