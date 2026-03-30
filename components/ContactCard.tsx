"use client";

import { useRouter } from "next/navigation";

interface ContactCardProps {
  id: string;
  name: string;
  tier: "A" | "B" | "C";
  charismaScore: number;
  lastInteraction?: {
    content: string;
    direction: "sent" | "received";
    logged_at: string;
  } | null;
}

const tierColors = { A: "#e91e8c", B: "#444444", C: "#2a2a2a" };

export default function ContactCard({
  id,
  name,
  tier,
  charismaScore,
  lastInteraction,
}: ContactCardProps) {
  const router = useRouter();

  const scoreColor =
    charismaScore >= 70
      ? "text-green-400"
      : charismaScore >= 40
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <button
      onClick={() => router.push(`/contacts/${id}`)}
      className="w-full text-left p-4 bg-rm-card border border-rm-border rounded-xl active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-rm-text font-medium text-base">{name}</span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: tierColors[tier], color: "#fff" }}
          >
            {tier}
          </span>
        </div>
        <span className={`text-lg font-bold tabular-nums ${scoreColor}`}>
          {charismaScore}
        </span>
      </div>

      {lastInteraction ? (
        <div className="flex items-center gap-2 text-sm text-rm-muted">
          <span className="shrink-0">
            {lastInteraction.direction === "sent" ? "→" : "←"}
          </span>
          <span className="truncate">{lastInteraction.content}</span>
        </div>
      ) : (
        <div className="text-sm text-rm-muted">No interactions yet</div>
      )}
    </button>
  );
}
