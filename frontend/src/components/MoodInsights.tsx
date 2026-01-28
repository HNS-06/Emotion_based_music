import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Heart, Activity } from 'lucide-react';
import { MoodCategory } from '../backend';
import MoodChart from './MoodChart';

export default function MoodInsights() {
  const { data: userProfile, isLoading } = useGetCallerUserProfile();

  if (isLoading) {
    return (
      <div className="glass-card p-6 space-y-4">
        <div className="h-8 bg-white/10 rounded animate-pulse" />
        <div className="h-32 bg-white/10 rounded animate-pulse" />
      </div>
    );
  }

  const moodHistory = userProfile?.moodHistory || [];


  const moodCounts: Record<string, number> = {};
  moodHistory.forEach(entry => {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
  });

  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as MoodCategory | undefined;
  const avgIntensity = moodHistory.length > 0
    ? Math.round(moodHistory.reduce((sum, entry) => sum + entry.intensity, 0) / moodHistory.length)
    : 0;

  return (
    <div className="space-y-4">
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Mood Insights
        </h2>

        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">Dominant Mood</span>
            </div>
            <p className="text-2xl font-bold capitalize">
              {dominantMood ? `${getMoodEmoji(dominantMood)} ${dominantMood}` : 'No data yet'}
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-medium">Avg Intensity</span>
            </div>
            <p className="text-2xl font-bold">{avgIntensity}%</p>
          </div>


        </div>
      </div>

      {moodHistory.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Mood Trends</h3>
          <MoodChart moodHistory={moodHistory} />
        </div>
      )}
    </div>
  );
}

function getMoodEmoji(mood: MoodCategory): string {
  const emojiMap: Record<MoodCategory, string> = {
    [MoodCategory.happy]: '😊',
    [MoodCategory.sad]: '😢',
    [MoodCategory.energetic]: '⚡',
    [MoodCategory.calm]: '😌',
    [MoodCategory.angry]: '😠',
    [MoodCategory.romantic]: '💕',
    [MoodCategory.focused]: '🎯',
  };
  return emojiMap[mood] || '🎵';
}
