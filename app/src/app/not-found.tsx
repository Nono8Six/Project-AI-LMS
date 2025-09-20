import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  AUTH_LOGIN_PATH,
  AUTH_SIGNUP_PATH,
  MEMBER_ROUTES,
  ROOT_PATH,
} from "@/shared/constants/routes";

const PRIMARY_LINKS = [
  { href: ROOT_PATH, label: "Accueil" },
  { href: AUTH_LOGIN_PATH, label: "Connexion" },
  { href: AUTH_SIGNUP_PATH, label: "Créer un compte" },
];

const MEMBER_LINKS = MEMBER_ROUTES.map((route) => ({
  href: route,
  label: route.replace("/", "").replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
}));

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold">Page introuvable</h1>
          <p className="text-sm text-muted-foreground">
            La ressource demandée n'existe pas ou n'est plus disponible. Sélectionnez une destination connue pour poursuivre votre navigation.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {PRIMARY_LINKS.map((link) => (
            <Button key={link.href} variant={link.href === ROOT_PATH ? "default" : "outline"} asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>

        {MEMBER_LINKS.length > 0 ? (
          <div className="w-full rounded-lg border bg-muted/50 p-6 text-left">
            <h2 className="text-sm font-semibold text-muted-foreground">Sections principales</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {MEMBER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-foreground underline-offset-4 hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

