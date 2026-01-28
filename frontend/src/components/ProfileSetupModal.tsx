import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { UserProfile } from '../backend';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProfile: UserProfile = {
      username: name.trim(),
      avatarUrl: '', // Default or generated
      moodHistory: [],
    };

    await saveProfile.mutateAsync(newProfile);
  };

  return (
    <Dialog open={true}>
      <DialogContent className="glass-card border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to MoodWave! 🎵</DialogTitle>
          <DialogDescription>
            Let's get started by setting up your profile.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">What should we call you?</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            disabled={!name.trim() || saveProfile.isPending}
            className="w-full glass-button"
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              'Get Started'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
