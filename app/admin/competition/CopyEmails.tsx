"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/Button";

// Copies every entrant's email, comma-separated, ready to paste into Bcc.
export default function CopyEmails({ emails }: { emails: string[] }) {
  const [copied, setCopied] = useState(false);

  if (emails.length === 0) return null;

  async function copy() {
    await navigator.clipboard.writeText(emails.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="secondary" onClick={copy} aria-live="polite">
      {copied ? `Copied ${emails.length} emails` : `Copy all ${emails.length} emails`}
    </Button>
  );
}
