/**
 * Auth Store (Layer 2: Application State)
 * 
 * Manages user authentication state.
 * Uses authService (Layer 4) - never imports Supabase directly.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { UserProfile } from '@/types';
import { authService } from '@/lib/infrastructure';

interface AuthStore {
    // State
    user: UserProfile | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
    signOut: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
    devtools(
        (set) => ({
            // Initial State
            user: null,
            isLoading: true,
            error: null,

            // Initialize - check for existing session
            initialize: async () => {
                try {
                    set({ isLoading: true, error: null });
                    const user = await authService.getCurrentUser();
                    set({ user, isLoading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to initialize',
                        isLoading: false,
                    });
                }
            },

            // Email/Password Sign In
            signIn: async (email, password) => {
                try {
                    set({ isLoading: true, error: null });
                    const user = await authService.signInWithEmail(email, password);
                    set({ user, isLoading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Sign in failed',
                        isLoading: false,
                    });
                    throw error;
                }
            },

            // OAuth Sign In
            signInWithOAuth: async (provider) => {
                try {
                    set({ isLoading: true, error: null });
                    await authService.signInWithOAuth(provider);
                    // OAuth redirects, state will be updated on callback
                } catch (error) {
                    // 'OAuth redirect initiated' is expected, not an error
                    if (error instanceof Error && !error.message.includes('redirect')) {
                        set({
                            error: error.message,
                            isLoading: false,
                        });
                    }
                }
            },

            // Sign Out
            signOut: async () => {
                try {
                    set({ isLoading: true, error: null });
                    await authService.signOut();
                    set({ user: null, isLoading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Sign out failed',
                        isLoading: false,
                    });
                }
            },

            clearError: () => set({ error: null }),
        }),
        { name: 'AuthStore' }
    )
);
