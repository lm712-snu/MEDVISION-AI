'use client';

import { useState } from 'react';
import { Plus, Trash2, Pill, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Current Medications
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enter the patient&apos;s current prescriptions for interaction checking.
          </p>
        </div>
        {savedCount > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {savedCount} saved
          </span>
        )}
      </div>

      <div className="space-y-3">
        {draftMedications.map((med, index) => (
          <Card key={index} className="p-0">
            <CardContent className="p-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <Label className="text-xs">Medication Name *</Label>
                  <Input
                    placeholder="e.g., Metformin"
                    value={med.name}
                    onChange={(e) => updateMedication(index, { name: e.target.value })}
                    className="mt-1 h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Dosage</Label>
                  <Input
                    placeholder="e.g., 500mg"
                    value={med.dosage}
                    onChange={(e) => updateMedication(index, { dosage: e.target.value })}
                    className="mt-1 h-9 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Frequency</Label>
                    <Input
                      placeholder="e.g., twice daily"
                      value={med.frequency}
                      onChange={(e) => updateMedication(index, { frequency: e.target.value })}
                      className="mt-1 h-9 text-sm"
                    />
                  </div>
                  {draftMedications.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 mt-5 flex-shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeMedication(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={addMedication}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Medication
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
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
