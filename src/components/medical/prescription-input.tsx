'use client';

import { useState } from 'react';
import { Plus, Trash2, Pill, Loader2, Save } from 'lucide-react';
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
  const { draftMedications, addMedication, updateMedication, removeMedication, addPrescriptionsToCase } = useMedicalStore();
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(existingPrescriptions?.length || 0);

  const handleSave = async () => {
    const validMeds = draftMedications.filter((m) => m.name.trim());
    if (validMeds.length === 0) { toast.error('Please add at least one medication name.'); return; }
    setIsSaving(true);
    try {
      // Use client-side store instead of API
      addPrescriptionsToCase(
        caseId,
        validMeds.map((m) => ({
          medicationName: m.name.trim(),
          dosage: m.dosage.trim() || null,
          frequency: m.frequency.trim() || null,
        }))
      );
      setSavedCount((prev) => prev + validMeds.length);
      toast.success(`Saved ${validMeds.length} medication(s).`);
      onComplete();
    } catch { toast.error('Failed to save prescriptions.'); } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center">
            <Pill className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium">Current medications</span>
        </div>
        {savedCount > 0 && (
          <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
            {savedCount} saved
          </span>
        )}
      </div>
      <div className="space-y-2.5">
        {draftMedications.map((med, index) => (
          <div key={index} className="rounded-xl border border-border bg-card p-3 warm-card-hover">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Medication *</Label>
                <Input placeholder="e.g., Metformin" value={med.name} onChange={(e) => updateMedication(index, { name: e.target.value })} className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Dosage</Label>
                <Input placeholder="e.g., 500mg" value={med.dosage} onChange={(e) => updateMedication(index, { dosage: e.target.value })} className="mt-1 h-8 text-sm" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Frequency</Label>
                  <Input placeholder="e.g., twice daily" value={med.frequency} onChange={(e) => updateMedication(index, { frequency: e.target.value })} className="mt-1 h-8 text-sm" />
                </div>
                {draftMedications.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 mt-5 flex-shrink-0 text-muted-foreground/50 hover:text-destructive" onClick={() => removeMedication(index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2.5">
        <Button variant="outline" size="sm" onClick={addMedication}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
          Save medications
        </Button>
      </div>
    </div>
  );
}
