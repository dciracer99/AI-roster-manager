"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  calculateCharismaScore,
  Interaction,
} from "@/lib/scoring";
import BottomNav from "@/components/BottomNav";
import ContactCard from "@/components/ContactCard";
import WeeklyChart from "@/components/WeeklyChart";

interface Contact {
  id: string;
  name: string;
  tier: "A" | "B" | "C";
  notes: string | null;
  reply_tone: string | null;
}

interface ContactWithScore extends Contact {
  charismaScore: number;
  lastInteraction: {
    content: string;
    direction: "sent" | "received";
    logged_at: string;
  } | null;
}

export default function PulseDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactWithScore[]>([]);
  const [allInteractions, setAllInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const [contactsRes, interactionsRes] = await Promise.all([
        supabase.from("contacts").select("*").eq("user_id", user.id),
        supabase
          .from("interactions")
          .select("*")
          .eq("user_id", user.id)
          .order("logged_at", { ascending: false }),
      ]);

      const contactsList = (contactsRes.data || []) as Contact[];
      const interactionsList = (interactionsRes.data || []) as Interaction[];
      setAllInteractions(interactionsList);

      const withScores: ContactWithScore[] = contactsList.map((contact) => {
        const contactInteractions = interactionsList.filter(
          (i) => i.contact_id === contact.id
        );
        const charismaScore = calculateCharismaScore(contactInteractions);
        const sorted = [...contactInteractions].sort(
          (a, b) =>
            new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
        );
        return {
          ...contact,
          charismaScore,
          lastInteraction: sorted[0]
            ? {
                content: sorted[0].content,
                direction: sorted[0].direction,
                logged_at: sorted[0].logged_at,
              }
            : null,
        };
      });

      // Sort: A-tier first, then by charisma score descending
      withScores.sort((a, b) => {
        if (a.tier !== b.tier) {
          const tierOrder = { A: 0, B: 1, C: 2 };
          return tierOrder[a.tier] - tierOrder[b.tier];
        }
        return b.charismaScore - a.charismaScore;
      });

      setContacts(withScores);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-rm-muted text-sm">Loading...</div>
      </div>
    );
  }

  const overallScore =
    contacts.length > 0
      ? Math.round(
          contacts.reduce((sum, c) => sum + c.charismaScore, 0) /
            contacts.length
        )
      : 0;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const textsLast7d = allInteractions.filter(
    (i) => new Date(i.logged_at) >= sevenDaysAgo
  ).length;

  // Priority open loops: last direction received, 12+ hours ago
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const openLoops = contacts.filter((c) => {
    if (!c.lastInteraction) return false;
    return (
      c.lastInteraction.direction === "received" &&
      new Date(c.lastInteraction.logged_at) < twelveHoursAgo
    );
  });

  const scoreColor =
    overallScore >= 70
      ? "text-green-400"
      : overallScore >= 40
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <div className="min-h-dvh pb-20 pt-safe">
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        {/* Header */}
        <h1 className="text-xl font-bold text-rm-text mb-6">Pulse</h1>

        {/* Overall Score */}
        <div className="bg-rm-card border border-rm-border rounded-xl p-5 mb-4 text-center">
          <div className="text-rm-muted text-xs uppercase tracking-wider mb-1">
            Charisma Score
          </div>
          <div className={`text-5xl font-bold tabular-nums ${scoreColor}`}>
            {overallScore}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-rm-card border border-rm-border rounded-xl p-4">
            <div className="text-rm-muted text-xs uppercase tracking-wider">
              Roster
            </div>
            <div className="text-2xl font-bold text-rm-text mt-1">
              {contacts.length}
            </div>
          </div>
          <div className="bg-rm-card border border-rm-border rounded-xl p-4">
            <div className="text-rm-muted text-xs uppercase tracking-wider">
              Texts (7d)
            </div>
            <div className="text-2xl font-bold text-rm-text mt-1">
              {textsLast7d}
            </div>
          </div>
        </div>

        {/* Open Loops */}
        {openLoops.length > 0 && (
          <div className="bg-rm-card border border-rm-accent/30 rounded-xl p-4 mb-4">
            <div className="text-rm-accent text-xs font-semibold uppercase tracking-wider mb-2">
              Open Loops — Reply Back
            </div>
            {openLoops.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/contacts/${c.id}`)}
                className="w-full flex items-center justify-between py-2 text-left"
              >
                <span className="text-rm-text text-sm">{c.name}</span>
                <span className="text-rm-muted text-xs truncate max-w-[150px]">
                  ← {c.lastInteraction?.content?.slice(0, 30)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Weekly Volume Chart */}
        <div className="bg-rm-card border border-rm-border rounded-xl p-4 mb-6">
          <div className="text-rm-muted text-xs uppercase tracking-wider mb-3">
            Volume (28d)
          </div>
          <WeeklyChart interactions={allInteractions} />
        </div>

        {/* Contact Cards */}
        <div className="space-y-3">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              id={contact.id}
              name={contact.name}
              tier={contact.tier}
              charismaScore={contact.charismaScore}
              lastInteraction={contact.lastInteraction}
            />
          ))}
        </div>

        {contacts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-rm-muted text-sm">
              No contacts yet. Hit the + button to get started.
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
