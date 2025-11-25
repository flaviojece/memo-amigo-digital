export const frequencyOptions = [
  { value: "daily", label: "Diariamente" },
  { value: "2x_day", label: "2x ao dia" },
  { value: "3x_day", label: "3x ao dia" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "as_needed", label: "Quando necessário" },
];

export function translateFrequency(value: string): string {
  const found = frequencyOptions.find(opt => opt.value === value);
  return found?.label || value;
}
