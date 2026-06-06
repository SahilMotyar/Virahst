"use client";

/**
 * Sign In pill + stub modal (Phase 5). No real auth yet — the modal explains
 * that accounts are coming and shows disabled provider buttons as placeholders.
 */

import { useState } from "react";
import { config } from "@/config";
import { Modal } from "@/components/ui/Modal";

export function SignInButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-bg transition-colors hover:bg-black"
      >
        Sign In
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Accounts coming soon"
        title={`Sign in to ${config.brand}`}
      >
        <p>
          Sign-in will let you favourite objects, leave comments, and join the
          community chat. It isn’t wired up yet — these are placeholders.
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            disabled
            className="flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-ink-2 opacity-60"
          >
            Continue with Google
          </button>
          <button
            type="button"
            disabled
            className="flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-ink-2 opacity-60"
          >
            Continue with email
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-ink-2/70">
          No account is created and no data is collected.
        </p>
      </Modal>
    </>
  );
}
