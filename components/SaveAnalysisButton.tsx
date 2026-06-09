"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Analysis } from "@/lib/schema";
import type { Metrics, PatrimoineInput } from "@/lib/types";

interface Props {
  input: PatrimoineInput;
  metrics: Metrics;
  analysis: Analysis;
}

type Status = "idle" | "saving" | "saved" | "error";

export function SaveAnalysisButton({ input, metrics, analysis }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  const save = async () => {
    setStatus("saving");
    setMessage("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus("error");
        setMessage("Session expirée — reconnectez-vous.");
        return;
      }

      const { error } = await supabase.from("analyses").insert({
        user_id: user.id,
        snapshot: { input, metrics },
        result: analysis,
      });

      if (error) {
        setStatus("error");
        setMessage("Échec de l'enregistrement. Réessayez.");
        return;
      }

      setStatus("saved");
      setMessage("Radiographie enregistrée dans votre historique.");
    } catch {
      setStatus("error");
      setMessage("Erreur réseau lors de l'enregistrement.");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={save}
        disabled={status === "saving" || status === "saved"}
        className="inline-flex items-center rounded-lg border border-accent bg-white px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "saving"
          ? "Enregistrement…"
          : status === "saved"
            ? "✓ Enregistré"
            : "Sauvegarder cette radiographie"}
      </button>
      {message && (
        <span
          className={
            "text-sm " +
            (status === "error" ? "text-red-600" : "text-emerald-600")
          }
        >
          {message}
        </span>
      )}
    </div>
  );
}
