// Drug interaction reference data (prototype - local reference table)
// In production, this would integrate with RxNav API or similar

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'mild' | 'moderate' | 'severe' | 'contraindicated';
  description: string;
  mechanism?: string;
  recommendation?: string;
}

export interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
}

// Common MRI-relevant drug interactions and considerations
const DRUG_INTERACTION_DB: DrugInteraction[] = [
  {
    drug1: 'metformin',
    drug2: 'iodinated contrast',
    severity: 'severe',
    description: 'Metformin and iodinated contrast media combination increases risk of lactic acidosis.',
    mechanism: 'Contrast-induced acute kidney injury reduces metformin clearance.',
    recommendation: 'Hold metformin 48 hours before and after contrast-enhanced imaging. Monitor renal function.',
  },
  {
    drug1: 'warfarin',
    drug2: 'acetaminophen',
    severity: 'moderate',
    description: 'Acetaminophen may potentiate the anticoagulant effect of warfarin, increasing bleeding risk.',
    mechanism: 'Inhibition of warfarin metabolism via CYP enzymes.',
    recommendation: 'Monitor INR closely if acetaminophen is used regularly. Consider alternative analgesics.',
  },
  {
    drug1: 'aspirin',
    drug2: 'warfarin',
    severity: 'severe',
    description: 'Concomitant use significantly increases bleeding risk, including intracranial hemorrhage.',
    mechanism: 'Additive antiplatelet and anticoagulant effects.',
    recommendation: 'Avoid combination unless specifically indicated with close INR monitoring.',
  },
  {
    drug1: 'clopidogrel',
    drug2: 'omeprazole',
    severity: 'moderate',
    description: 'Omeprazole may reduce the antiplatelet effect of clopidogrel.',
    mechanism: 'CYP2C19 inhibition reduces clopidogrel activation to active metabolite.',
    recommendation: 'Consider pantoprazole or H2-receptor antagonist as alternative.',
  },
  {
    drug1: 'gadolinium-based contrast',
    drug2: 'kidney disease',
    severity: 'severe',
    description: 'Gadolinium-based contrast agents risk nephrogenic systemic fibrosis in patients with severe renal impairment.',
    mechanism: 'Impaired renal clearance leads to gadolinium tissue deposition.',
    recommendation: 'Assess eGFR before gadolinium administration. Use macrocyclic agents or avoid contrast if eGFR < 30.',
  },
  {
    drug1: 'lithium',
    drug2: 'nsaid',
    severity: 'moderate',
    description: 'NSAIDs increase lithium levels, risk of lithium toxicity.',
    mechanism: 'NSAIDs reduce renal lithium clearance.',
    recommendation: 'Monitor lithium levels closely. Consider alternative analgesics.',
  },
  {
    drug1: 'ssri',
    drug2: 'tramadol',
    severity: 'severe',
    description: 'Combined use increases risk of serotonin syndrome and seizures.',
    mechanism: 'Additive serotonergic effects and lowering of seizure threshold.',
    recommendation: 'Avoid combination. If unavoidable, use lowest effective dose and monitor closely.',
  },
  {
    drug1: 'levodopa',
    drug2: 'maoi',
    severity: 'contraindicated',
    description: 'Concomitant use can cause hypertensive crisis.',
    mechanism: 'MAOIs prevent catecholamine metabolism, leading to excessive adrenergic stimulation.',
    recommendation: 'Contraindicated. Allow 14-day washout between MAOIs and levodopa.',
  },
];

// Normalize medication names for matching
function normalize(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

// Check for interactions between a list of medications
export function checkInteractions(medications: Medication[]): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];
  const normalizedMeds = medications.map((m) => ({
    ...m,
    normalizedName: normalize(m.name),
  }));

  for (const interaction of DRUG_INTERACTION_DB) {
    const drug1Norm = normalize(interaction.drug1);
    const drug2Norm = normalize(interaction.drug2);

    for (const med of normalizedMeds) {
      // Check if this medication matches drug1 and any other matches drug2
      if (med.normalizedName.includes(drug1Norm) || drug1Norm.includes(med.normalizedName)) {
        for (const otherMed of normalizedMeds) {
          if (otherMed === med) continue;
          if (
            otherMed.normalizedName.includes(drug2Norm) ||
            drug2Norm.includes(otherMed.normalizedName)
          ) {
            interactions.push({
              ...interaction,
              drug1: med.name,
              drug2: otherMed.name,
            });
          }
        }
      }
    }
  }

  return interactions;
}

// Get severity color for display
export function getSeverityColor(severity: DrugInteraction['severity']): string {
  switch (severity) {
    case 'mild':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'moderate':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'severe':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'contraindicated':
      return 'bg-red-200 text-red-900 border-red-500';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

export function getSeverityLabel(severity: DrugInteraction['severity']): string {
  switch (severity) {
    case 'mild': return 'Mild';
    case 'moderate': return 'Moderate';
    case 'severe': return 'Severe';
    case 'contraindicated': return 'Contraindicated';
    default: return 'Unknown';
  }
}
