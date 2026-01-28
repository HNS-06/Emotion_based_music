import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Keyboard, Hand, Loader2, Music } from 'lucide-react';
import { useSaveMoodEntry, useSaveTypingPattern, useGetMoodCategories } from '../hooks/useQueries';
import { MoodCategory } from '../backend';
import { toast } from 'sonner';

interface MoodDetectorProps {
  onMoodDetected: (mood: MoodCategory, intensity: number) => void;
  currentMood: MoodCategory | null;
  currentIntensity: number;
}

export default function MoodDetector({ onMoodDetected, currentMood, currentIntensity }: MoodDetectorProps) {
  const [typingText, setTypingText] = useState('');
  const [manualMood, setManualMood] = useState<MoodCategory | null>(null);
  const [manualIntensity, setManualIntensity] = useState([50]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const saveMoodEntry = useSaveMoodEntry();
  const saveTypingPattern = useSaveTypingPattern();
  const { data: moodCategories } = useGetMoodCategories();

  const typingStartTime = useRef<number | null>(null);
  const keyPressTimestamps = useRef<number[]>([]);

  const analyzeMoodFromTyping = (text: string, timestamps: number[]): { mood: MoodCategory; intensity: number } => {
    if (timestamps.length < 5) {
      return { mood: MoodCategory.calm, intensity: 50 };
    }

    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const speed = 1000 / avgInterval;

    let mood: MoodCategory;
    let intensity: number;

    if (speed > 8 && variance > 5000) {
      mood = MoodCategory.energetic;
      intensity = Math.min(90, 60 + speed * 2);
    } else if (speed > 6 && variance < 3000) {
      mood = MoodCategory.focused;
      intensity = Math.min(85, 50 + speed * 3);
    } else if (speed < 3 && variance > 8000) {
      mood = MoodCategory.sad;
      intensity = Math.max(30, 70 - speed * 10);
    } else if (speed < 4 && variance < 2000) {
      mood = MoodCategory.calm;
      intensity = 60;
    } else if (variance > 10000) {
      mood = MoodCategory.angry;
      intensity = Math.min(95, 70 + variance / 200);
    } else if (text.includes('love') || text.includes('heart') || text.includes('❤')) {
      mood = MoodCategory.romantic;
      intensity = 75;
    } else {
      mood = MoodCategory.happy;
      intensity = 65;
    }

    return { mood, intensity };
  };

  const handleTypingAnalysis = async () => {
    if (typingText.length < 20) {
      toast.error('Please type at least 20 characters for accurate analysis');
      return;
    }

    setIsAnalyzing(true);

    try {
      const { mood, intensity } = analyzeMoodFromTyping(typingText, keyPressTimestamps.current);

      const intervals: number[] = [];
      for (let i = 1; i < keyPressTimestamps.current.length; i++) {
        intervals.push(keyPressTimestamps.current[i] - keyPressTimestamps.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      const speed = 1000 / avgInterval;

      await saveTypingPattern.mutateAsync({
        speed,
        rhythm: variance,
        intensity: intensity / 100,
      });

      await saveMoodEntry.mutateAsync({ mood, intensity });

      onMoodDetected(mood, intensity);
      toast.success(`Mood detected: ${mood} (${intensity}% intensity)`);

      setTypingText('');
      keyPressTimestamps.current = [];
    } catch (error) {
      toast.error('Failed to analyze mood');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualMood) {
      toast.error('Please select a mood');
      return;
    }

    try {
      await saveMoodEntry.mutateAsync({ mood: manualMood, intensity: manualIntensity[0] });
      onMoodDetected(manualMood, manualIntensity[0]);
      toast.success(`Mood set: ${manualMood} (${manualIntensity[0]}% intensity)`);
    } catch (error) {
      toast.error('Failed to save mood');
    }
  };

  const handleKeyPress = () => {
    keyPressTimestamps.current.push(Date.now());
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/10 shadow-md">
          <Music className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Mood Detection</h2>
          <p className="text-sm text-muted-foreground">
            {currentMood ? `Current: ${currentMood} (${currentIntensity}%)` : 'No mood detected yet'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="typing" className="w-full">
        <TabsList className="grid w-full grid-cols-2 glass-card">
          <TabsTrigger value="typing" className="data-[state=active]:glass-button">
            <Keyboard className="w-4 h-4 mr-2" />
            Typing Analysis
          </TabsTrigger>
          <TabsTrigger value="manual" className="data-[state=active]:glass-button">
            <Hand className="w-4 h-4 mr-2" />
            Manual Selection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="typing" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Type your thoughts...</Label>
            <Textarea
              placeholder="Start typing to analyze your mood. The more you type, the more accurate the analysis..."
              value={typingText}
              onChange={(e) => setTypingText(e.target.value)}
              onKeyDown={handleKeyPress}
              className="glass-input min-h-[150px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Characters: {typingText.length} (minimum 20 for analysis)
            </p>
          </div>

          <Button
            onClick={handleTypingAnalysis}
            disabled={typingText.length < 20 || isAnalyzing}
            className="w-full glass-button"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Mood'
            )}
          </Button>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Select your mood</Label>
            <Select value={manualMood || undefined} onValueChange={(value) => setManualMood(value as MoodCategory)}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Choose a mood..." />
              </SelectTrigger>
              <SelectContent className="glass-card border-white/20">
                {moodCategories?.map((mood) => (
                  <SelectItem key={mood} value={mood} className="capitalize">
                    {getMoodEmoji(mood)} {mood}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Intensity: {manualIntensity[0]}%</Label>
            <Slider
              value={manualIntensity}
              onValueChange={setManualIntensity}
              min={0}
              max={100}
              step={5}
              className="py-4"
            />
          </div>

          <Button
            onClick={handleManualSubmit}
            disabled={!manualMood || saveMoodEntry.isPending}
            className="w-full glass-button"
          >
            {saveMoodEntry.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Set Mood'
            )}
          </Button>
        </TabsContent>
      </Tabs>
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
