import { Pills } from "./pills";

export const DAYS = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"] as const;

const OPTIONS = DAYS.map((label, i) => ({ value: String(i), label }));

type DayPillsProps = {
  selected: number;
  onSelect?: (index: number) => void;
};

export function DayPills({ selected, onSelect }: DayPillsProps) {
  return <Pills options={OPTIONS} selected={String(selected)} onSelect={(v) => onSelect?.(Number(v))} wrap={false} />;
}
