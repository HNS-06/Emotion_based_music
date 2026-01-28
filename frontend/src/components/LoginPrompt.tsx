import { Music2, Sparkles, TrendingUp, Heart, AudioWaveform } from 'lucide-react';
import { Button } from '@/components/ui/button';


interface LoginPromptProps {
  onGetStarted: () => void;
}

export default function LoginPrompt({ onGetStarted }: LoginPromptProps) {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="glass-card max-w-2xl w-full p-8 md:p-12 text-center space-y-6">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/10 shadow-xl">
            <AudioWaveform className="w-16 h-16 text-purple-400" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          Welcome to MoodWave
        </h1>

        <p className="text-lg text-muted-foreground">
          Discover music that matches your mood. Let AI analyze your emotions and curate the perfect playlist.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
          <div className="glass-card p-4 space-y-2">
            <Music2 className="w-8 h-8 mx-auto text-purple-400" />
            <h3 className="font-semibold">Smart Detection</h3>
            <p className="text-sm text-muted-foreground">Analyze typing patterns to detect your mood</p>
          </div>

          <div className="glass-card p-4 space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-pink-400" />
            <h3 className="font-semibold">Personalized</h3>
            <p className="text-sm text-muted-foreground">Get music recommendations tailored to you</p>
          </div>

          <div className="glass-card p-4 space-y-2">
            <TrendingUp className="w-8 h-8 mx-auto text-blue-400" />
            <h3 className="font-semibold">Track Moods</h3>
            <p className="text-sm text-muted-foreground">Visualize your emotional journey over time</p>
          </div>
        </div>

        <Button
          onClick={onGetStarted}
          size="lg"
          className="glass-button text-lg px-8"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
