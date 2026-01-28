import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MoodEntry, MoodCategory } from '../backend';

interface MoodChartProps {
  moodHistory: MoodEntry[];
}

export default function MoodChart({ moodHistory }: MoodChartProps) {
  const chartData = moodHistory
    .slice(0, 10)
    .reverse()
    .map((entry, index) => ({
      index: index + 1,
      intensity: entry.intensity,
      mood: entry.mood,
      time: new Date(Number(entry.timestamp) / 1000000).toLocaleDateString(),
    }));

  const getMoodColor = (mood: MoodCategory): string => {
    const colorMap: Record<MoodCategory, string> = {
      [MoodCategory.happy]: '#fbbf24',
      [MoodCategory.sad]: '#60a5fa',
      [MoodCategory.energetic]: '#f87171',
      [MoodCategory.calm]: '#34d399',
      [MoodCategory.angry]: '#ef4444',
      [MoodCategory.romantic]: '#ec4899',
      [MoodCategory.focused]: '#8b5cf6',
    };
    return colorMap[mood] || '#a855f7';
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          dataKey="index" 
          stroke="rgba(255,255,255,0.5)"
          tick={{ fill: 'rgba(255,255,255,0.7)' }}
        />
        <YAxis 
          stroke="rgba(255,255,255,0.5)"
          tick={{ fill: 'rgba(255,255,255,0.7)' }}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(0,0,0,0.8)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
          }}
          labelStyle={{ color: '#fff' }}
        />
        <Line
          type="monotone"
          dataKey="intensity"
          stroke="#a855f7"
          strokeWidth={3}
          dot={{ fill: '#a855f7', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
