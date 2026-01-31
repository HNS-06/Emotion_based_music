import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Keyboard, Hand, Loader2, Music, Mic, Square } from 'lucide-react';
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

  // Audio Analysis State
  const [isListening, setIsListening] = useState(false);
  const [audioIntensity, setAudioIntensity] = useState(0);
  const [audioMood, setAudioMood] = useState<MoodCategory | null>(null);

  const saveMoodEntry = useSaveMoodEntry();
  const saveTypingPattern = useSaveTypingPattern();
  const { data: moodCategories } = useGetMoodCategories();

  const typingStartTime = useRef<number | null>(null);
  const keyPressTimestamps = useRef<number[]>([]);

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  // Auto-analysis for typing
  useEffect(() => {
    const minChars = 5;
    if (typingText.length < minChars) return;

    const timeoutId = setTimeout(() => {
      handleTypingAnalysis(true); // true = automatic
    }, 1000); // 1s debounce

    return () => clearTimeout(timeoutId);
  }, [typingText]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      source.connect(analyser);
      analyser.fftSize = 256;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      setIsListening(true);
      draw();
      toast.success('Microphone connected');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopListening = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null; // Important: clear ref
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect(); // Disconnect analyser too
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsListening(false);
    setAudioIntensity(0);
  };

  const draw = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate intensity
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    // Normalize to 0-100 (approximate, audio levels vary)
    const currentIntensity = Math.min(100, Math.round((average / 255) * 200));

    setAudioIntensity(currentIntensity);

    // Naive mood mapping based on intensity
    let detectedMood: MoodCategory = MoodCategory.calm;
    if (currentIntensity > 80) detectedMood = MoodCategory.energetic;
    else if (currentIntensity > 60) detectedMood = MoodCategory.happy; // or Angry?
    else if (currentIntensity > 40) detectedMood = MoodCategory.focused;
    else if (currentIntensity > 10) detectedMood = MoodCategory.calm;
    else detectedMood = MoodCategory.sad; // Silence = Sad?

    setAudioMood(detectedMood);


    // Draw Graph
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2; // Scale down

      // Gradient color based on height/intensity
      const hue = (i / bufferLength) * 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  const handleAudioSubmit = async () => {
    if (!audioMood) return;

    try {
      await saveMoodEntry.mutateAsync({ mood: audioMood, intensity: audioIntensity });
      onMoodDetected(audioMood, audioIntensity);
      toast.success(`Broadcasting Mood: ${audioMood} (${audioIntensity}%)`);
    } catch (error) {
      toast.error("Failed to sync mood");
    }
  };

  const analyzeMoodFromTyping = (text: string, timestamps: number[]): { mood: MoodCategory; intensity: number } => {
    if (timestamps.length < 5) { // Lenient for short text
      if (text.length > 0 && text.length < 10) {
        // Very short text heuristics
        if (text.includes('!') || text.toUpperCase() === text) return { mood: MoodCategory.energetic, intensity: 80 };
        if (text.includes('...')) return { mood: MoodCategory.sad, intensity: 40 };
      }
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

  const handleTypingAnalysis = async (isAuto = false) => {
    if (typingText.length < 5) {
      if (!isAuto) toast.error('Please type at least 5 characters');
      return;
    }

    setIsAnalyzing(true);

    try {
      const { mood, intensity } = analyzeMoodFromTyping(typingText, keyPressTimestamps.current);

      const speed = keyPressTimestamps.current.length > 2 ? 1000 / ((keyPressTimestamps.current[keyPressTimestamps.current.length - 1] - keyPressTimestamps.current[0]) / keyPressTimestamps.current.length) : 0;
      const variance = 1000;

      await saveTypingPattern.mutateAsync({
        speed,
        rhythm: variance,
        intensity: intensity / 100,
      });

      await saveMoodEntry.mutateAsync({ mood, intensity });

      onMoodDetected(mood, intensity);
      if (!isAuto) toast.success(`Mood detected: ${mood} (${intensity}% intensity)`);

      // Do not clear text for auto-mode continuity
      // setTypingText('');
      // keyPressTimestamps.current = [];
    } catch (error) {
      if (!isAuto) toast.error('Failed to analyze mood');
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
    <div className="glass-card p-4 md:p-6 space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/10 shadow-md">
          <Music className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Mood Detection</h2>
          <p className="text-sm text-muted-foreground">
            {currentMood ? `Current: ${currentMood} (${currentIntensity}%)` : 'No mood detected yet'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="audio" className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass-card h-auto p-1">
          <TabsTrigger value="audio" className="data-[state=active]:glass-button text-xs md:text-sm py-2 px-1">
            <Mic className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Audio Analysis</span>
            <span className="md:hidden">Audio</span>
          </TabsTrigger>
          <TabsTrigger value="typing" className="data-[state=active]:glass-button text-xs md:text-sm py-2 px-1">
            <Keyboard className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Typing Analysis</span>
            <span className="md:hidden">Typing</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="data-[state=active]:glass-button text-xs md:text-sm py-2 px-1">
            <Hand className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Manual Selection</span>
            <span className="md:hidden">Manual</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audio" className="space-y-4 mt-4">
          <div className="flex flex-col items-center justify-center p-4 border border-white/10 rounded-lg bg-black/20">
            <canvas
              ref={canvasRef}
              width="300"
              height="100"
              className="w-full h-[150px] rounded-md bg-black/40 mb-4"
            />

            <div className="w-full flex items-center justify-between mb-4 px-2">
              <span className="text-sm font-medium">Intensity: {audioIntensity}%</span>
              <span className="text-sm font-medium capitalize">
                Mood: {audioMood ? `${getMoodEmoji(audioMood)} ${audioMood}` : '--'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full">
              {!isListening ? (
                <Button onClick={startListening} className="flex-1 glass-button bg-green-500/20 hover:bg-green-500/30">
                  <Mic className="w-4 h-4 mr-2" /> Start Listening
                </Button>
              ) : (
                <Button onClick={stopListening} variant="destructive" className="flex-1">
                  <Square className="w-4 h-4 mr-2" /> Stop Listening
                </Button>
              )}
              <Button
                onClick={handleAudioSubmit}
                disabled={!audioMood || !isListening}
                className="flex-1 glass-button"
              >
                Set Mood
              </Button>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Play music and let the microphone detect the vibe!
          </p>
        </TabsContent>

        <TabsContent value="typing" className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Type your thoughts...</Label>
              {isAnalyzing && <span className="text-xs text-purple-400 animate-pulse">Analyzing...</span>}
            </div>

            <Textarea
              placeholder="Start typing... I will listen to your words and play the right songs."
              value={typingText}
              onChange={(e) => setTypingText(e.target.value)}
              onKeyDown={handleKeyPress}
              className="glass-input min-h-[150px] resize-none focus:ring-purple-500/50"
            />
            <p className="text-xs text-muted-foreground flex justify-between">
              <span>Characters: {typingText.length}</span>
              <span>Default: Automatic</span>
            </p>
          </div>
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
