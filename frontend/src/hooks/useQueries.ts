import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, MoodCategory, Song, UserPreferences } from '../backend';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useSaveMoodEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mood, intensity }: { mood: MoodCategory; intensity: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveMoodEntry(mood, intensity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useSaveTypingPattern() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ speed, rhythm, intensity }: { speed: number; rhythm: number; intensity: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveTypingPattern(speed, rhythm, intensity);
    },
  });
}

export function useLikeSong() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (song: Song) => {
      if (!actor) throw new Error('Actor not available');
      return actor.likeSong(song);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useSaveUserPreferences() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: UserPreferences) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveUserPreferences(preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetMoodCategories() {
  const { actor, isFetching } = useActor();

  return useQuery<MoodCategory[]>({
    queryKey: ['moodCategories'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMoodCategories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFetchMusicAPI() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (url: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.fetchMusicAPI(url);
    },
  });
}
