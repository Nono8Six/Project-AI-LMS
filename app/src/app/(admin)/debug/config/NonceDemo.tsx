"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCSPNonce } from "@/shared/utils/csp";
import { appendScriptWithNonce } from "@/shared/utils/dom";

type NonceState = {
  nonce: string | null;
  injected: boolean;
  error?: string | undefined;
  value: string | null;
};

export default function NonceDemo() {
  const nonce = useCSPNonce();
  const [state, setState] = useState<NonceState>({ nonce, injected: false, value: null });

  useEffect(() => {
    setState((s) => ({ ...s, nonce }));
  }, [nonce]);

  const canInject = useMemo(() => Boolean(nonce), [nonce]);

  const inject = () => {
    if (!nonce) {
      setState((s) => ({ ...s, error: "Aucun nonce disponible (CSP_USE_NONCE n'est peut-être pas activé)", injected: false }));
      return;
    }
    try {
      const { dispose } = appendScriptWithNonce({ text: 'window.__nonce_demo__ = "ok"', nonce });
      // Lire la valeur écrite par le script injecté
      const val = (window as unknown as { __nonce_demo__?: string }).__nonce_demo__ ?? null;
      setState((s) => ({ ...s, injected: true, value: val, error: undefined }));
      // Nettoyage immédiat du noeud script (la valeur globale reste)
      dispose();
    } catch (e) {
      setState((s) => ({ ...s, error: (e as Error)?.message || "Injection échouée", injected: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSP Nonce Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-muted-foreground">Nonce présent</div>
          <div className="font-mono">{nonce ? "oui" : "non"}</div>
          <div className="text-muted-foreground">Valeur du nonce</div>
          <div className="font-mono truncate" title={nonce ?? undefined}>{nonce ?? "(null)"}</div>
          <div className="text-muted-foreground">Script injecté</div>
          <div className="font-mono">{state.injected ? "oui" : "non"}</div>
          <div className="text-muted-foreground">Valeur globale</div>
          <div className="font-mono">{state.value ?? "(null)"}</div>
        </div>

        {state.error && (
          <div className="text-red-600">Erreur: {state.error}</div>
        )}

        <div className="pt-2">
          <Button onClick={inject} disabled={!canInject}>
            Injecter un script signé par nonce
          </Button>
          {!canInject && (
            <div className="text-xs text-muted-foreground mt-2">
              Activez <code className="font-mono">CSP_USE_NONCE=true</code> pour générer un nonce par requête
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
