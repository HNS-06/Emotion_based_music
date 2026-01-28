import { Music2, AudioWaveform } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center gap-3">
      <div className="p-2 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/10 shadow-md">
        <AudioWaveform className="w-6 h-6 text-purple-400" />
      </div>
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          MoodWave
        </h1>
        <p className="text-xs text-muted-foreground">Music for your mood</p>
      </div>
    </header>
  );
}
