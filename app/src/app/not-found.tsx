import Link from "next/link";
import { ArrowLeft, BookOpen, GraduationCap, Home, Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface QuickLink {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

const popularResources: QuickLink[] = [
  {
    href: "/",
    title: "Accueil",
    description: "Retour à la page d'accueil",
    icon: <Home className="h-5 w-5" />,
  },
  {
    href: "/courses",
    title: "Cours disponibles",
    description: "Découvrez nos formations IA",
    icon: <BookOpen className="h-5 w-5" />,
    badge: "Populaire",
  },
  {
    href: "/dashboard",
    title: "Mon tableau de bord",
    description: "Suivez vos progrès d'apprentissage",
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    href: "/learn",
    title: "Commencer à apprendre",
    description: "Parcours personnalisé avec IA",
    icon: <TrendingUp className="h-5 w-5" />,
    badge: "IA",
  },
];

const suggestedSections = [
  {
    title: "Intelligence Artificielle",
    links: [
      { href: "/courses/ai-basics", title: "Fondamentaux de l'IA" },
      { href: "/courses/machine-learning", title: "Machine Learning" },
      { href: "/courses/deep-learning", title: "Deep Learning" },
    ],
  },
  {
    title: "Programmation",
    links: [
      { href: "/courses/python", title: "Python pour l'IA" },
      { href: "/courses/javascript", title: "JavaScript moderne" },
      { href: "/courses/data-science", title: "Data Science" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", title: "Centre d'aide" },
      { href: "/contact", title: "Contacter le support" },
      { href: "/faq", title: "Questions fréquentes" },
    ],
  },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">LMS IA</span>
            </Link>
            <Button variant="ghost" asChild>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center space-y-8 mb-16">
          {/* Hero Section */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-32 w-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    404
                  </span>
                </div>
                <div className="absolute -top-2 -right-2 h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-sm">🤖</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-900">
                Page introuvable
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Même notre IA n&apos;arrive pas à localiser cette page ! 
                Mais ne vous inquiétez pas, nous allons vous aider à retrouver votre chemin vers l&apos;apprentissage.
              </p>
            </div>
          </div>

          {/* Search Section */}
          <Card className="max-w-2xl mx-auto shadow-sm">
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher des cours, des sujets..."
                    className="pl-10"
                  />
                </div>
                <Button>
                  Rechercher
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Suggestions populaires
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularResources.map((resource) => (
              <Card key={resource.href} className="group hover:shadow-lg transition-shadow cursor-pointer">
                <Link href={resource.href}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {resource.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{resource.title}</CardTitle>
                        </div>
                      </div>
                      {resource.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {resource.badge}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription>{resource.description}</CardDescription>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Suggested Sections */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Explorer par catégorie
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {suggestedSections.map((section) => (
              <Card key={section.title} className="h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {section.links.map((link, index) => (
                    <div key={link.href}>
                      <Link
                        href={link.href}
                        className="text-blue-600 hover:text-blue-800 hover:underline block py-1"
                      >
                        {link.title}
                      </Link>
                      {index < section.links.length - 1 && (
                        <Separator className="mt-2" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
          <CardContent className="py-12 text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                Toujours perdu ?
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Notre équipe est là pour vous accompagner dans votre parcours d&apos;apprentissage. 
                N&apos;hésitez pas à nous contacter pour obtenir de l&apos;aide personnalisée.
              </p>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button asChild>
                <Link href="/contact">
                  Contacter le support
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/help">
                  Centre d&apos;aide
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center space-x-2">
              <div className="h-6 w-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">LMS IA</span>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} LMS IA - Plateforme d&apos;apprentissage personnalisée par intelligence artificielle
            </p>
            <p className="text-xs text-gray-400">
              Transformez votre apprentissage avec l&apos;IA conversationnelle
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

