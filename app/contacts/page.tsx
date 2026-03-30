"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { calculateCharismaScore, Interaction } from "@/lib/scoring";
import BottomNav from "@/components/BottomNav";
import BottomSheet from "@/components/BottomSheet";
import AddContactForm from "@/components/AddContactForm";

interface Contact {
  id: string;
  name: string;
  tier: "A" | "B" | "C";
  notes: string | null;
  reply_tone: string | null;
}

const tierColors: Record<string, string> = {
  A: "#e91e8c",
  B: "#444444",
  C: "#2a2a2a",
};

export default function ContactsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [contacts, setContacts] = useState<
    (Contact & { charismaScore: number })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

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
        supabase.from("contacts").select("*").eq("user_id", user.id).order("name"),
        supabase.from("interactions").select("*").eq("user_id", user.id),
      ]);

      const contactsList = (contactsRes.data || []) as Contact[];
      const interactionsList = (interactionsRes.data || []) as Interaction[];

      const withScores = contactsList.map((contact) => ({
        ...contact,
        charismaScore: calculateCharismaScore(
          interactionsList.filter((i) => i.contact_id === contact.id)
        ),
      }));

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

  return (
    <div className="min-h-dvh pb-20 pt-safe">
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-rm-text">Roster</h1>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-rm-accent text-white rounded-lg text-sm font-medium min-h-[44px]"
          >
            + Add
          </button>
        </div>

        <div className="space-y-2">
          {contacts.map((contact) => {
            const scoreColor =
              contact.charismaScore >= 70
                ? "text-green-400"
                : contact.charismaScore >= 40
                ? "text-yellow-400"
                : "text-red-400";

            return (
              <button
                key={contact.id}
                onClick={() => router.push(`/contacts/${contact.id}`)}
                className="w-full flex items-center justify-between p-4 bg-rm-card border border-rm-border rounded-xl text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-bold w-6 h-6 rounded flex items-center justify-center text-white"
                    style={{ backgroundColor: tierColors[contact.tier] }}
                  >
                    {contact.tier}
                  </span>
                  <div>
                    <div className="text-rm-text font-medium text-sm">
                      {contact.name}
                    </div>
                    {contact.notes && (
                      <div className="text-rm-muted text-xs truncate max-w-[200px]">
                        {contact.notes}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`text-base font-bold tabular-nums ${scoreColor}`}
                >
                  {contact.charismaScore}
                </span>
              </button>
            );
          })}
        </div>

        {contacts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-rm-muted text-sm mb-4">
              Your roster is empty. Add your first contact.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="px-6 py-3 bg-rm-accent text-white rounded-lg font-semibold text-sm"
            >
              Add Contact
            </button>
          </div>
        )}
      </div>

      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)}>
        <AddContactForm onComplete={() => setShowAdd(false)} />
      </BottomSheet>

      <BottomNav />
    </div>
  );
}
