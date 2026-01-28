// Mock backend declarations for frontend build
export enum MoodCategory {
    happy = 'happy',
    sad = 'sad',
    energetic = 'energetic',
    calm = 'calm',
    angry = 'angry',
    romantic = 'romantic',
    focused = 'focused',
}

export interface MoodEntry {
    intensity: number;
    mood: MoodCategory;
    timestamp: bigint;
}

export interface UserProfile {
    username: string;
    avatarUrl: string;
    moodHistory: MoodEntry[];
}

export interface Song {
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
    audioUrl: string;
}

export interface UserPreferences {
    theme: string;
}

// Mock actor instance with LocalStorage persistence
const STORAGE_KEY = 'moodwave_user_profile';

const replacer = (key: string, value: any) => {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
};

const reviver = (key: string, value: any) => {
    if (key === 'timestamp' && typeof value === 'string') {
        return BigInt(value);
    }
    return value;
};

const loadProfile = (): UserProfile | null => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored, reviver) : null;
    } catch {
        return null;
    }
};

const saveProfileToStorage = (profile: UserProfile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile, replacer));
};

export const backend = {
    getCallerUserProfile: async (): Promise<UserProfile | null> => {
        return loadProfile();
    },
    saveCallerUserProfile: async (profile: UserProfile): Promise<void> => {
        saveProfileToStorage(profile);
    },
    saveMoodEntry: async (mood: MoodCategory, intensity: number): Promise<void> => {
        let profile = loadProfile();
        if (!profile) {
            // Auto-create guest profile if missing
            profile = {
                username: 'Guest',
                avatarUrl: '',
                moodHistory: [],
            };
        }

        const newEntry: MoodEntry = {
            mood,
            intensity,
            timestamp: BigInt(Date.now()),
        };
        // Add to history (newest first)
        profile.moodHistory = [newEntry, ...(profile.moodHistory || [])];
        saveProfileToStorage(profile);
    },
    saveTypingPattern: async (speed: number, rhythm: number, intensity: number): Promise<void> => {
        // Optional: Implement if needed, currently just empty to prevent errors
    },
    likeSong: async (song: Song): Promise<void> => {
        // Optional
    },
    saveUserPreferences: async (preferences: UserPreferences): Promise<void> => {
        const profile = loadProfile();
        if (profile) {
            // profile.preferences = preferences; // If preferences existed on type
            saveProfileToStorage(profile);
        }
    },
    getMoodCategories: async (): Promise<MoodCategory[]> => Object.values(MoodCategory),
    fetchMusicAPI: async (url: string): Promise<string> => '{}',
};
