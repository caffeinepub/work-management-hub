import { Building2, CheckCircle2, Users, Shield } from 'lucide-react';
import LoginButton from './LoginButton';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Work Management Hub</span>
          </div>
          <LoginButton />
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight text-balance">
              Streamline Your Work
              <span className="block text-primary mt-2">Management Process</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              A comprehensive platform for managing multi-role workflows with secure authentication and intelligent approval systems.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <LoginButton variant="hero" />
            <p className="text-sm text-muted-foreground">
              Secure authentication powered by Internet Identity
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-5xl mx-auto mt-24 grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Users className="h-8 w-8 text-primary" />}
            title="Multi-Role System"
            description="Support for 8 distinct roles including Client, Partner, Admin, and specialized positions."
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8 text-primary" />}
            title="Secure Access"
            description="Built on Internet Identity for decentralized, secure authentication without passwords."
          />
          <FeatureCard
            icon={<CheckCircle2 className="h-8 w-8 text-primary" />}
            title="Approval Workflow"
            description="Streamlined registration and approval process managed by administrators."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-24 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Work Management Hub. Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-soft hover:shadow-glow transition-all duration-300">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-card-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
