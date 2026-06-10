/**
 * Image Open Graph générée à la volée (next/og) : c'est l'aperçu qu'on voit
 * quand le lien est partagé (mail, LinkedIn, Slack). Reprend le visuel clé
 * de l'app : score de robustesse + repères de la grille.
 *
 * Route handler classique plutôt que le fichier-convention opengraph-image :
 * le loader de métadonnées de Next 14 génère du code invalide quand le chemin
 * du projet contient une apostrophe (cas du dossier local de développement).
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";

const SIZE = { width: 1200, height: 630 };

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, color: "#94a3b8", letterSpacing: 2 }}>
            OUTIL PÉDAGOGIQUE
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            Radiographie de patrimoine
          </div>
          <div style={{ marginTop: 20, fontSize: 30, color: "#cbd5e1" }}>
            Vos chiffres calculés en code. L'IA explique, elle ne calcule
            jamais.
          </div>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "24px 32px",
              borderRadius: 16,
              background: "#fbbf24",
              color: "#451a03",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 600 }}>
              Score de robustesse
            </div>
            <div style={{ fontSize: 56, fontWeight: 700 }}>58 / 100</div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 12,
              fontSize: 26,
              color: "#e2e8f0",
            }}
          >
            {[
              { ok: true, text: "Coussin de liquidité : 13,6 mois" },
              { ok: false, text: "Immobilier : 77,8 % du patrimoine" },
              {
                ok: false,
                text: "Résidence principale : 53,3 % — concentration",
              },
            ].map((line) => (
              <div
                key={line.text}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    background: line.ok ? "#34d399" : "#fbbf24",
                  }}
                />
                <div>{line.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    SIZE,
  );
}
