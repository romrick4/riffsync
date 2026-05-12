const MEMBER_COLORS = [
  { dot: "bg-red-500", bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/25", label: "Red" },
  { dot: "bg-sky-500", bg: "bg-sky-500/15", text: "text-sky-400", border: "border-sky-500/25", label: "Sky" },
  { dot: "bg-amber-500", bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/25", label: "Amber" },
  { dot: "bg-rose-500", bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/25", label: "Rose" },
  { dot: "bg-emerald-500", bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25", label: "Emerald" },
  { dot: "bg-cyan-500", bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/25", label: "Cyan" },
  { dot: "bg-pink-500", bg: "bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/25", label: "Pink" },
  { dot: "bg-lime-500", bg: "bg-lime-500/15", text: "text-lime-400", border: "border-lime-500/25", label: "Lime" },
] as const;

export type MemberColor = (typeof MEMBER_COLORS)[number];

export function getMemberColor(userId: string, memberIds: string[]): MemberColor {
  const sorted = [...memberIds].sort();
  const index = sorted.indexOf(userId);
  return MEMBER_COLORS[(index === -1 ? 0 : index) % MEMBER_COLORS.length];
}

export function buildMemberColorMap(memberIds: string[]): Map<string, MemberColor> {
  const map = new Map<string, MemberColor>();
  const sorted = [...memberIds].sort();
  for (let i = 0; i < sorted.length; i++) {
    map.set(sorted[i], MEMBER_COLORS[i % MEMBER_COLORS.length]);
  }
  return map;
}
