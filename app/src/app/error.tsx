"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Home, RefreshCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/shared/lib/logger";
import Link from "next/link";


interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function getErrorType(error: Error): string {
  if (error.name === "ChunkLoadError") return "Chunk Load Error";
  if (error.name === "TypeError") return "Type Error";
  if (error.name === "ReferenceError") return "Reference Error";
  if (error.name === "NetworkError") return "Network Error";
  if (error.message.includes("fetch")) return "Network Error";
  if (error.message.includes("Unauthorized")) return "Authorization Error";
  if (error.message.includes("forbidden")) return "Access Denied";
  return "Application Error";
}

function getErrorSeverity(error: Error): "low" | "medium" | "high" | "critical" {
  const type = getErrorType(error);
  if (type.includes("Network") || type.includes("Chunk")) return "medium";
  if (type.includes("Authorization") || type.includes("Access")) return "high";
  if (type.includes("Critical") || error.name === "SecurityError") return "critical";
  return "low";
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "low": return "bg-blue-100 text-blue-800 border-blue-200";
    case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "high": return "bg-orange-100 text-orange-800 border-orange-200";
    case "critical": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getRecoveryActions(errorType: string): Array<{
  label: string;
  action: string;
  primary?: boolean;
}> {
  switch (errorType) {
    case "Chunk Load Error":
      return [
        { label: "Actualiser la page", action: "reload", primary: true },
        { label: "Vider le cache", action: "clearCache" },
      ];
    case "Network Error":
      return [
        { label: "Vérifier la connexion", action: "checkNetwork", primary: true },
        { label: "Réessayer", action: "retry" },
      ];
    case "Authorization Error":
    case "Access Denied":
      return [
        { label: "Se reconnecter", action: "reauth", primary: true },
        { label: "Accueil", action: "home" },
      ];
    default:
      return [
        { label: "Réessayer", action: "retry", primary: true },
        { label: "Accueil", action: "home" },
      ];
  }
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorId] = useState(() => `err_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  const errorType = getErrorType(error);
  const severity = getErrorSeverity(error);
  const severityColorClass = getSeverityColor(severity);
  const recoveryActions = getRecoveryActions(errorType);

  useEffect(() => {
    // Log error for monitoring
    logger.error("Global error boundary triggered", {
      errorId,
      errorType,
      severity,
      message: error.message,
      name: error.name,
      digest: error.digest,
      stack: error.stack,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      timestamp: new Date().toISOString(),
    });
  }, [error, errorId, errorType, severity]);

  const handleAction = async (action: string) => {
    setIsRetrying(true);
    
    try {
      switch (action) {
        case "reload":
          window.location.reload();
          break;
        case "clearCache":
          if ('caches' in window) {
            await caches.keys().then(names => {
              return Promise.all(names.map(name => caches.delete(name)));
            });
          }
          window.location.reload();
          break;
        case "checkNetwork":
          // Simple network check
          await fetch("/api/health", { method: "HEAD" });
          reset();
          break;
        case "retry":
          reset();
          break;
        case "reauth":
          window.location.href = "/login";
          break;
        case "home":
          window.location.href = "/";
          break;
        default:
          reset();
      }
    } catch (actionError) {
      logger.error("Error recovery action failed", {
        errorId,
        action,
        actionError: actionError instanceof Error ? actionError.message : String(actionError),
      });
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Main Error Card */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Une erreur s&apos;est produite
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Nous nous excusons pour la gêne occasionnée. Notre équipe a été notifiée.
              </CardDescription>
            </div>
            <div className="flex justify-center gap-2">
              <Badge variant="outline" className={severityColorClass}>
                {errorType}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                ID: {errorId.slice(-8)}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Recovery Actions */}
            <div className="grid gap-3">
              {recoveryActions.map((action) => (
                <Button
                  key={action.action}
                  variant={action.primary ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => handleAction(action.action)}
                  disabled={isRetrying}
                >
                  {action.action === "retry" && <RefreshCcw className="mr-2 h-4 w-4" />}
                  {action.action === "home" && <Home className="mr-2 h-4 w-4" />}
                  {isRetrying ? "En cours..." : action.label}
                </Button>
              ))}
            </div>

            <Separator />

            {/* Error Details Toggle */}
            <div>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto text-gray-600 hover:text-gray-900"
                onClick={() => setShowDetails(!showDetails)}
              >
                <span className="text-sm">Détails techniques</span>
                {showDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              
              {showDetails && (
                <Card className="mt-4 bg-slate-50">
                  <CardContent className="p-4 space-y-3">
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="font-medium text-gray-700">Message:</span>
                        <p className="text-gray-600 mt-1 font-mono text-xs break-all">
                          {error.message}
                        </p>
                      </div>
                      {error.digest && (
                        <div>
                          <span className="font-medium text-gray-700">Digest:</span>
                          <p className="text-gray-600 mt-1 font-mono text-xs">
                            {error.digest}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <p className="text-gray-600 mt-1">{error.name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Timestamp:</span>
                        <p className="text-gray-600 mt-1 font-mono text-xs">
                          {new Date().toLocaleString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Separator />

            {/* Support Information */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Besoin d&apos;aide supplémentaire ?
              </p>
              <div className="flex justify-center gap-4">
                <Link
                  href="/contact"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Contacter le support
                </Link>
                <Link
                  href="/help"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Centre d&apos;aide
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            LMS IA © {new Date().getFullYear()} - Plateforme d&apos;apprentissage personnalisée
          </p>
        </div>
      </div>
    </div>
  );
}
