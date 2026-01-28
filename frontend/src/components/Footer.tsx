import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="glass-card border-t border-white/10 py-6 mt-auto backdrop-blur-xl">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
          © 2025. Built with <Heart className="w-4 h-4 text-pink-500 fill-pink-500" /> using{' '}
          <a 
            href="https://caffeine.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
