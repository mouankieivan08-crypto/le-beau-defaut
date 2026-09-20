"use client";

/** Filet de sécurité ultime : s'affiche même si la mise en page principale a échoué. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#FAF5EC",
          color: "#14110E",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <p style={{ fontSize: 34, fontWeight: 700, letterSpacing: "0.06em", margin: 0 }}>LBD</p>
          <h1 style={{ fontSize: 22, marginTop: 12 }}>Le site est momentanément indisponible</h1>
          <p style={{ color: "#7A6F60", fontSize: 15, lineHeight: 1.6 }}>
            Nous sommes déjà prévenus. Réessayez dans un instant.
          </p>
          {error.digest && <p style={{ color: "#7A6F60", fontSize: 12 }}>Référence : {error.digest}</p>}
          <button
            onClick={reset}
            style={{
              marginTop: 20,
              padding: "12px 24px",
              borderRadius: 999,
              border: 0,
              background: "#14110E",
              color: "#FAF5EC",
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
