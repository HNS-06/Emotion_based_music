import { useState, useEffect } from 'react';
import { MoodCategory } from '../backend';
import { MusicLanguage } from './LanguageSelector';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface MusicPlayerProps {
  mood: MoodCategory | null;
  currentSong: any | null; // Kept for compatibility but unused
  isPlaying: boolean; // Kept for compatibility but unused
  onSongChange: (song: any | null) => void; // Kept for compatibility
  onPlayStateChange: (isPlaying: boolean) => void; // Kept for compatibility
  language: MusicLanguage;
}

// Map mood + language -> Array of Playlist IDs
const PLAYLIST_DB: Record<MoodCategory, Record<MusicLanguage, string[]>> = {
  [MoodCategory.happy]: {
    English: ['37i9dQZF1DXdPec7aLTmlC', '37i9dQZF1DX3rxVfbeq1Pn', '5huWTkhjom3e1XErPgkqZq'], // Happy Hits, Good Vibes
    Hindi: ['4nNVfQ9eWidZXkBKZN5li4', '37i9dQZF1DX6QZp6p88j2w'], // Bollywood Butter (Official), Bollywood Central
    Tamil: ['37i9dQZF1DXd0D0xidFHhW', '37i9dQZF1DX1H8jTqFfO7Z'], // Hot Hits Tamil (Official), Top 50
    Malayalam: ['37i9dQZF1DWTR4ZOXtfd9p', '37i9dQZF1DX6QZp6p88j2w'], // Hot Hits Malayalam (Verified), Fast Songs
  },
  [MoodCategory.sad]: {
    English: ['37i9dQZF1DX7qK8ma5wgG1', '37i9dQZF1DWSqBruwoIXkA'], // Sad Songs, Life Sucks
    Hindi: ['37i9dQZF1DWXtlo6ENS92N', '37i9dQZF1DX5q67ZpWyRrZ'], // Bollywood Central (Sad/Chill), Sentimental
    Tamil: ['37i9dQZF1DXc6qgnxonYgp', '37i9dQZF1DX3mF1G8K8p86'], // Tamil Romance (Often Sad/Melody), Sad Generic
    Malayalam: ['3qrM3dmqyB9g0gq9WNNvZI', '37i9dQZF1DXcK0XGk821Uo'], // Malayalam To Sleep (Calm/Sad), Melody Hits
  },
  [MoodCategory.energetic]: {
    English: ['37i9dQZF1DX76Wlfdnj7AP', '37i9dQZF1DX0HRj9P7NxeE'], // Beast Mode, Workout
    Hindi: ['37i9dQZF1DWT0qC8YabOaR', '37i9dQZF1DXd8cOUiye1o2'], // Desi Party, Workout Bollywood
    Tamil: ['6Yp1xOHC2KLqyqjuq35bFn', '37i9dQZF1DX1H8jTqFfO7Z'], // Kuthu Fire (Popular User), Top 50
    Malayalam: ['37i9dQZF1DWTR4ZOXtfd9p', '1GEN83YaODIWUrLJsWKUlM'], // Hot Hits Malayalam, Fast Songs
  },
  [MoodCategory.calm]: {
    English: ['37i9dQZF1DWVqfgj8NqCsR', '37i9dQZF1DX4WYpdgoICN6'], // Chill Hits, Chillout Lounge
    Hindi: ['37i9dQZF1DX0F3lb30Ibi9', '37i9dQZF1DWSwxyU5zGZYe'], // Lofi Vibe Hindi (Official), Bollywood Acoustic
    Tamil: ['37i9dQZF1DXc6qgnxonYgp', '37i9dQZF1DWW2h0Qc9f7bH'], // Tamil Romance (Verified), Acoustic
    Malayalam: ['3qrM3dmqyB9g0gq9WNNvZI', '37i9dQZF1DXcK0XGk821Uo'], // Songs to Sleep (Verified), Melody Hits
  },
  [MoodCategory.angry]: {
    English: ['37i9dQZF1DWXepGEFFm3J4', '37i9dQZF1DXcF6B6QPhFDv', '1XXNxS5rVnpjqCfH0EQ1OE'], // Rock Classics, Adrenaline Workout
    Hindi: ['37i9dQZF1DX2SThom9u2re', '37i9dQZF1DWT0qC8YabOaR'], // Bollywood Rock, Desi Party
    Tamil: ['6Yp1xOHC2KLqyqjuq35bFn', '37i9dQZF1DX1H8jTqFfO7Z'], // Kuthu Fire (High Energy), Top 50
    Malayalam: ['37i9dQZF1DWTR4ZOXtfd9p', '1GEN83YaODIWUrLJsWKUlM'], // Hot Hits (Energy), Fast Songs
  },
  [MoodCategory.romantic]: {
    English: ['37i9dQZF1DXcBWIGoYBM5M', '37i9dQZF1DX0r3x8OtiwEM'], // Love Pop, Romantic Ballads
    Hindi: ['37i9dQZF1DXcKBPk6QDd4J', '37i9dQZF1DWUaJ60cbfh5n'], // Bollywood Mush (Official), Love Stories
    Tamil: ['37i9dQZF1DXc6qgnxonYgp', '4BME5NDpshjSW4Gxsnpyul', '37i9dQZF1EIUtYhOXKqLCG'], // Tamil Romance (Official), Melody
    Malayalam: ['3qrM3dmqyB9g0gq9WNNvZI', '75oCXlWZGw02jLlMiRj8Nf'], // Melody/Sleep, Romantic
  },
  [MoodCategory.focused]: {
    English: ['37i9dQZF1DWZeKCadgRdKQ', '37i9dQZF1DX8Uebhn9wzrS'], // Deep Focus, Lo-Fi Beats
    Hindi: ['37i9dQZF1DX0F3lb30Ibi9', '37i9dQZF1DX0XUZADUkmU2'], // Lofi Vibe Hindi (Official), Lofi
    Tamil: ['37i9dQZF1DXc6qgnxonYgp', '37i9dQZF1DWW2h0Qc9f7bH'], // Tamil Romance (Calm/Focus), Acoustic
    Malayalam: ['3qrM3dmqyB9g0gq9WNNvZI', '2KLJj6v04RKs7nGxrEEOQr'], // Songs to Sleep, Melody
  },
};

export default function MusicPlayer({ mood, language }: MusicPlayerProps) {
  // Store the index of the currently selected playlist for each mood/language combo
  // This resets if mood/language changes, but we verify index bounds
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [playlistID, setPlaylistID] = useState<string>('');

  useEffect(() => {
    if (mood && language) {
      const playlists = PLAYLIST_DB[mood]?.[language];
      if (playlists && playlists.length > 0) {
        // Ensure index is valid
        const validIndex = playlistIndex % playlists.length;
        setPlaylistID(playlists[validIndex]);
      } else {
        // Fallback to English if specific language combo missing? Or just empty.
        const fallback = PLAYLIST_DB[mood]?.['English']?.[0];
        setPlaylistID(fallback || '');
      }
    }
  }, [mood, language, playlistIndex]);

  // Reset index when mood or language changes to start fresh? 
  // Or keep it? Let's reset to 0 to be safe/simple.
  useEffect(() => {
    setPlaylistIndex(0);
  }, [mood, language]);

  const handleChangePlaylist = () => {
    setPlaylistIndex(prev => prev + 1);
  };

  if (!mood) {
    return (
      <div className="glass-card p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground text-lg">Select or detect a mood to start playing music</p>
        <p className="text-xs text-muted-foreground mt-2">Powered by Spotify</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden p-0 relative group">
      <iframe
        style={{ borderRadius: '12px' }}
        src={`https://open.spotify.com/embed/playlist/${playlistID}?utm_source=generator&theme=0`}
        width="100%"
        height="800"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify Music Player"
      />

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 text-xs backdrop-blur-md bg-black/50 hover:bg-black/70 text-white border border-white/10"
          onClick={handleChangePlaylist}
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Change Playlist
        </Button>
      </div>
    </div>
  );
}

