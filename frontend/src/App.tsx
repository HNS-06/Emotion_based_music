import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { ThemeProvider } from 'next-themes';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import MoodDetector from './components/MoodDetector';
import MusicPlayer from './components/MusicPlayer';
import MoodInsights from './components/MoodInsights';
import BackgroundAnimation from './components/BackgroundAnimation';
import LoginPrompt from './components/LoginPrompt';
import LanguageSelector, { MusicLanguage } from './components/LanguageSelector';
import { MoodCategory, type Song } from './backend';

export default function App() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [currentMood, setCurrentMood] = useState<MoodCategory | null>(null);
  const [moodIntensity, setMoodIntensity] = useState<number>(50);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [musicLanguage, setMusicLanguage] = useState<MusicLanguage>('English');

  // We keep isAuthenticated just for the ProfileSetup logic if needed, but main UI depends on isStarted
  // Or we can just ignore profile setup for now if not logged in.
  const isAuthenticated = !!identity;
  // Only show profile setup if authenticated and profile is missing (optional enhancement)
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  useEffect(() => {
    if (userProfile?.moodHistory && userProfile.moodHistory.length > 0) {
      const latestMood = userProfile.moodHistory[0];
      setCurrentMood(latestMood.mood);
      setMoodIntensity(latestMood.intensity);
    }
  }, [userProfile]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen relative overflow-hidden">
        <BackgroundAnimation mood={currentMood} intensity={moodIntensity} />

        <div className="relative z-10 flex flex-col min-h-screen">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center glass-card border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl rounded-none md:rounded-b-2xl mb-4">
            <Header />
            <div className="hidden md:block">
              <LanguageSelector currentLanguage={musicLanguage} onLanguageChange={setMusicLanguage} />
            </div>
          </div>

          <main className="flex-1 container mx-auto px-4 py-8">
            {!isStarted ? (
              <LoginPrompt onGetStarted={() => setIsStarted(true)} />
            ) : (
              <>
                {showProfileSetup && <ProfileSetupModal />}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Left Column: Detector + Insights */}
                  <div className="lg:col-span-2 space-y-6">
                    <MoodDetector
                      onMoodDetected={(mood, intensity) => {
                        setCurrentMood(mood);
                        setMoodIntensity(intensity);
                      }}
                      currentMood={currentMood}
                      currentIntensity={moodIntensity}
                    />

                    <MoodInsights />
                  </div>

                  {/* Right Column: Player */}
                  <div className="lg:col-span-1">
                    <MusicPlayer
                      mood={currentMood}
                      currentSong={currentSong}
                      isPlaying={isPlaying}
                      onSongChange={setCurrentSong}
                      onPlayStateChange={setIsPlaying}
                      language={musicLanguage}
                    />

                    <div className="md:hidden mt-4 flex justify-center">
                      <LanguageSelector currentLanguage={musicLanguage} onLanguageChange={setMusicLanguage} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </ThemeProvider>
  );
}
