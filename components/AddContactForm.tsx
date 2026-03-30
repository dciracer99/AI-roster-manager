"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function AddContactForm({
  onComplete,
  editContact,
}: {
  onComplete: () => void;
  editContact?: {
    id: string;
    name: string;
    tier: string;
    notes: string | null;
    reply_tone: string | null;
  };
}) {
  const supabase = createClient();
  const [name, setName] = useState(editContact?.name || "");
  const [tier, setTier] = useState(editContact?.tier || "B");
  const [notes, setNotes] = useState(editContact?.notes || "");
  const [replyTone, setReplyTone] = useState(editContact?.reply_tone || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    if (editContact) {
      const { error: updateError } = await supabase
        .from("contacts")
        .update({
          name: name.trim(),
          tier,
          notes: notes.trim() || null,
          reply_tone: replyTone.trim() || null,
        })
        .eq("id", editContact.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated. Please log in again.");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("contacts").insert({
        user_id: user.id,
        name: name.trim(),
        tier,
        notes: notes.trim() || null,
        reply_tone: replyTone.trim() || null,
      });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    onComplete();
    window.location.reload();
  }

  const tiers = [
    { value: "A", label: "A — Inner Circle", color: "#e91e8c" },
    { value: "B", label: "B — In the Mix", color: "#444444" },
    { value: "C", label: "C — Check-ins", color: "#2a2a2a" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-rm-text">
        {editContact ? "Edit Contact" : "Add Contact"}
      </h3>

      <div>
        <label className="block text-sm text-rm-muted mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-rm-bg border border-rm-border rounded-lg px-3 py-2.5 text-rm-text text-sm min-h-[44px]"
          placeholder="Their name"
        />
      </div>

      <div>
        <label className="block text-sm text-rm-muted mb-1">Tier</label>
        <div className="flex gap-2">
          {tiers.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTier(t.value)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium min-h-[44px] border ${
                tier === t.value
                  ? "text-white"
                  : "border-rm-border text-rm-muted"
              }`}
              style={
                tier === t.value
                  ? { backgroundColor: t.color, borderColor: t.color }
                  : {}
              }
            >
              {t.value}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-rm-muted mb-1">
          Notes (how you know them, vibe, context)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full bg-rm-bg border border-rm-border rounded-lg px-3 py-2.5 text-rm-text text-sm resize-none"
          placeholder="e.g. Met at Jake's party, into photography"
        />
      </div>

      <div>
        <label className="block text-sm text-rm-muted mb-1">
          Reply Tone (how should AI draft replies?)
        </label>
        <input
          type="text"
          value={replyTone}
          onChange={(e) => setReplyTone(e.target.value)}
          className="w-full bg-rm-bg border border-rm-border rounded-lg px-3 py-2.5 text-rm-text text-sm min-h-[44px]"
          placeholder="e.g. casual and funny, flirty but cool"
        />
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full py-3 bg-rm-accent text-white rounded-lg font-semibold text-sm min-h-[44px] disabled:opacity-50"
      >
        {loading ? "Saving..." : editContact ? "Save Changes" : "Add to Roster"}
      </button>
    </form>
  );
}
