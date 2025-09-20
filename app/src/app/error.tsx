"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { logger } from "@/shared/lib/logger";
import {
  AUTH_LOGIN_PATH,
  AUTH_SIGNUP_PATH,
  ROOT_PATH,
} from "@/shared/constants/routes";

interface ErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error("Unhandled application error", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Une erreur est survenue</h1>
          <p className="text-sm text-muted-foreground">
            Nous ne pouvons pas afficher la page pour l'instant. Vous pouvez tenter un nouvel essai ou revenir vers une section connue de l'application.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Réessayer</Button>
          <Button variant="outline" asChild>
            <Link href={ROOT_PATH}>Retour à l'accueil</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={AUTH_LOGIN_PATH}>Connexion</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={AUTH_SIGNUP_PATH}>Créer un compte</Link>
          </Button>
        </div>

        {error.digest ? (
          <p className="text-xs text-muted-foreground">
            Identifiant de suivi : {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
