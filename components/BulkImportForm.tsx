"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface Props {
  contactId?: string;
  onComplete: () => void;
}

export default function BulkImportForm({ contactId, onComplete }: Props) {
  const supabase = createClient();
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  const [selectedContact, setSelectedContact] = useState(contactId || "");
  const [rawText, setRawText] = useState("");
  const [platform, setPlatform] = useState("");
  const [format, setFormat] = useState<"auto" | "manual">("auto");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    async function loadContacts() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("contacts")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");
      if (data) setContacts(data);
    }
    if (!contactId) loadContacts();
  }, []);

  function parseMessages(text: string): { direction: "sent" | "received"; content: string }[] {
    const lines = text.split("\n").filter((l) => l.trim());
    const messages: { direction: "sent" | "received"; content: string }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Format: "me: message" or "them: message"
      const meMatch = trimmed.match(/^(me|i|sent|you|>>?)\s*[:>-]\s*(.+)/i);
      const themMatch = trimmed.match(/^(them|they|received|<<?\s*)\s*[:>-]\s*(.+)/i);

      // Format: "> message" (sent) or "< message" (received)
      const arrowSent = trimmed.match(/^>\s*(.+)/);
      const arrowRecv = trimmed.match(/^<\s*(.+)/);

      // Format: "→ message" or "← message"
      const unicodeSent = trimmed.match(/^[→➡]\s*(.+)/);
      const unicodeRecv = trimmed.match(/^[←⬅]\s*(.+)/);

      if (meMatch) {
        messages.push({ direction: "sent", content: meMatch[2].trim() });
      } else if (themMatch) {
        messages.push({ direction: "received", content: themMatch[2].trim() });
      } else if (arrowSent) {
        messages.push({ direction: "sent", content: arrowSent[1].trim() });
      } else if (arrowRecv) {
        messages.push({ direction: "received", content: arrowRecv[1].trim() });
      } else if (unicodeSent) {
        messages.push({ direction: "sent", content: unicodeSent[1].trim() });
      } else if (unicodeRecv) {
        messages.push({ direction: "received", content: unicodeRecv[1].trim() });
      } else {
        // No prefix — skip or treat as unknown
        // Try to detect iPhone copy-paste format: "Name\nMessage\nTimestamp"
        // For now, skip lines without a clear direction prefix
      }
    }

    return messages;
  }

  async function handleImport() {
    const target = contactId || selectedContact;
    if (!target) {
      setResult("Select a contact first.");
      return;
    }
    if (!rawText.trim()) {
      setResult("Paste some messages first.");
      return;
    }

    setSaving(true);
    setResult(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let messages: { direction: "sent" | "received"; content: string }[];

    if (format === "auto") {
      messages = parseMessages(rawText);
      if (messages.length === 0) {
        setResult(
          "Couldn't parse any messages. Use the format:\nme: your message\nthem: their message"
        );
        setSaving(false);
        return;
      }
    } else {
      // Manual: each line alternates sent/received
      const lines = rawText
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => l.trim());
      messages = lines.map((content, idx) => ({
        direction: idx % 2 === 0 ? ("received" as const) : ("sent" as const),
        content,
      }));
    }

    // Insert all at once, with timestamps spaced 1 minute apart for ordering
    const now = new Date();
    const inserts = messages.map((msg, idx) => ({
      user_id: user.id,
      contact_id: target,
      direction: msg.direction,
      content: msg.content,
      platform: platform || null,
      logged_at: new Date(
        now.getTime() - (messages.length - idx) * 60000
      ).toISOString(),
    }));

    const { error } = await supabase.from("interactions").insert(inserts);

    if (error) {
      setResult(`Error: ${error.message}`);
    } else {
      setResult(`Imported ${messages.length} messages.`);
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-rm-text">Bulk Import</h3>
      <p className="text-rm-muted text-xs">
        Paste a conversation. Use these formats:
      </p>

      <div className="bg-rm-bg border border-rm-border rounded-lg p-3 text-xs text-rm-muted font-mono space-y-1">
        <div>me: hey what are you up to</div>
        <div>them: nm just chilling hbu</div>
        <div>me: about to grab food wanna come</div>
        <div>them: bet where at</div>
      </div>

      <p className="text-rm-muted text-xs">
        Also works with: <code className="text-rm-accent">&gt; sent</code>{" "}
        <code className="text-rm-accent">&lt; received</code> or{" "}
        <code className="text-rm-accent">→ sent</code>{" "}
        <code className="text-rm-accent">← received</code>
      </p>

      {!contactId && (
        <select
          value={selectedContact}
          onChange={(e) => setSelectedContact(e.target.value)}
          className="w-full bg-rm-bg border border-rm-border rounded-lg px-3 py-2.5 text-rm-text text-sm min-h-[44px]"
        >
          <option value="">Select contact...</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setFormat("auto")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium min-h-[44px] ${
            format === "auto"
              ? "bg-rm-accent text-white"
              : "bg-rm-bg border border-rm-border text-rm-muted"
          }`}
        >
          Labeled (me/them)
        </button>
        <button
          onClick={() => setFormat("manual")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium min-h-[44px] ${
            format === "manual"
              ? "bg-rm-accent text-white"
              : "bg-rm-bg border border-rm-border text-rm-muted"
          }`}
        >
          Alternating
        </button>
      </div>

      {format === "manual" && (
        <p className="text-rm-muted text-xs">
          Each line alternates: line 1 = them, line 2 = you, line 3 = them...
        </p>
      )}

      <input
        type="text"
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        className="w-full bg-rm-bg border border-rm-border rounded-lg px-3 py-2.5 text-rm-text text-sm min-h-[44px]"
        placeholder="Platform (iMessage, Instagram, etc.)"
      />

      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        rows={10}
        className="w-full bg-rm-bg border border-rm-border rounded-lg px-3 py-2.5 text-rm-text text-sm resize-none font-mono"
        placeholder={
          format === "auto"
            ? "me: hey whats up\nthem: not much hbu\nme: tryna go out tonight?"
            : "not much hbu\ntryna go out tonight\nbet where"
        }
      />

      {result && (
        <div
          className={`text-sm p-3 rounded-lg ${
            result.startsWith("Error") || result.startsWith("Couldn")
              ? "bg-red-500/10 text-red-400"
              : "bg-green-500/10 text-green-400"
          }`}
        >
          {result}
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={saving}
        className="w-full py-3 bg-rm-accent text-white rounded-lg font-semibold text-sm min-h-[44px] disabled:opacity-50"
      >
        {saving ? "Importing..." : "Import Messages"}
      </button>
    </div>
  );
}
