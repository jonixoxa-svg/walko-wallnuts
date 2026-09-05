"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import type { Locale } from "@/lib/site";

export default function SignOutButton({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      onClick={async () => {
        setBusy(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push(`/${locale}`);
        router.refresh();
      }}
      disabled={busy}
      className="btn btn-outline !py-2.5 !text-[0.82rem]"
    >
      <LogOut size={15} />
      {label}
    </button>
  );
}
