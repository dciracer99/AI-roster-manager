"use client";

import { useEffect } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function BottomSheet({
  open,
  onClose,
  children,
}: BottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-rm-card border-t border-rm-border rounded-t-2xl animate-slide-up max-h-[85dvh] overflow-y-auto pb-safe">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-rm-border" />
        </div>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}
