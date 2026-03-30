"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import LogInteractionForm from "./LogInteractionForm";
import BottomSheet from "./BottomSheet";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogForm, setShowLogForm] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-rm-border bg-rm-bg/95 backdrop-blur-sm pb-safe">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          <button
            onClick={() => router.push("/")}
            className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] gap-0.5"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke={pathname === "/" ? "#e91e8c" : "#666666"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span
              className={`text-[10px] ${
                pathname === "/" ? "text-rm-accent" : "text-rm-muted"
              }`}
            >
              Pulse
            </span>
          </button>

          <button
            onClick={() => router.push("/contacts")}
            className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] gap-0.5"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke={
                pathname.startsWith("/contacts") ? "#e91e8c" : "#666666"
              }
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span
              className={`text-[10px] ${
                pathname.startsWith("/contacts")
                  ? "text-rm-accent"
                  : "text-rm-muted"
              }`}
            >
              Roster
            </span>
          </button>

          <button
            onClick={() => setShowLogForm(true)}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-rm-accent -mt-4"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </nav>

      <BottomSheet open={showLogForm} onClose={() => setShowLogForm(false)}>
        <LogInteractionForm onComplete={() => setShowLogForm(false)} />
      </BottomSheet>
    </>
  );
}
