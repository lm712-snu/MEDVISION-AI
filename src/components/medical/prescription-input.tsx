'use client';

import { useState } from 'react';
import { Plus, Trash2, Pill, Loader2, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMedicalStore } from '@/store/medical-store';
import { toast } from 'sonner';

interface PrescriptionInputProps {
  caseId: string;
  existingPrescriptions?: { id: string; medicationName: string; dosage: string | null; frequency: string | null }[];
  onComplete: () => void;
}

export function PrescriptionInput({ caseId, existingPrescriptions, onComplete }: PrescriptionInputProps) {
  const { draftMedications, addMedication, updateMedication, removeMedication } = useMedicalStore();
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(existingPrescriptions?.length || 0);

  const handleSave = async () => {
    const validMeds = draftMedications.filter((m) => m.name.trim());
    if (validMeds.length === 0) {
      toast.error('Please add at least one medication name.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medications: validMeds.map((m) => ({
            name: m.name.trim(),
            dosage: m.dosage.trim() || undefined,
            frequency: m.frequency.trim() || undefined,
          })),
          source: 'manual',
        }),
      });
      if (!res.ok) throw new Error('Failed to save prescriptions');
      const data = await res.json();
      setSavedCount((prev) => prev + data.created);
      toast.success(`Saved ${data.created} medication(s).`);
      onComplete();
    } catch (err) {
      toast.error('Failed to save prescriptions.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <Pill className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Current Medications</h3>
            <p className="text-xs text-muted-foreground">
              Add prescriptions for interaction checking.
            </p>
          </div>
        </div>
        {savedCount > 0 && (
          <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
            <Check className="h-3 w-3 inline mr-0.5" />
            {savedCount} saved
          </span>
        )}
      </div>

      <div className="space-y-3">
        {draftMedications.map((med, index) => (
          <div
            key={index}
            className="rounded-xl border border-border/50 bg-background/30 p-3.5 hover:border-border transition-colors"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Medication Name *</Label>
                <Input
                  placeholder="e.g., Metformin"
                  value={med.name}
                  onChange={(e) => updateMedication(index, { name: e.target.value })}
                  className="mt-1 h-9 text-sm bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
              <div>
                <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Dosage</Label>
                <Input
                  placeholder="e.g., 500mg"
                  value={med.dosage}
                  onChange={(e) => updateMedication(index, { dosage: e.target.value })}
                  className="mt-1 h-9 text-sm bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Frequency</Label>
                  <Input
                    placeholder="e.g., twice daily"
                    value={med.frequency}
                    onChange={(e) => updateMedication(index, { frequency: e.target.value })}
                    className="mt-1 h-9 text-sm bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>
                {draftMedications.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 mt-5.5 flex-shrink-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeMedication(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={addMedication}
          className="border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Medication
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-[oklch(0.72_0.15_170)] to-[oklch(0.65_0.18_140)] text-white border-0 hover:opacity-90"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5 mr-1.5" />
          )}
          Save Prescriptions
        </Button>
      </div>
    </div>
  );
}
