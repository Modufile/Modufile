/**
 * Auth Service (Layer 4: Infrastructure Adapter)
 * 
 * Implements IAuthService interface using Supabase.
 * Can be swapped for Firebase/Auth0/etc. without changing UI code.
 */

import { supabase } from './supabase';
import type { IAuthService, UserProfile, SubscriptionTier } from '@/types';

class SupabaseAuthAdapter implements IAuthService {
    async getCurrentUser(): Promise<UserProfile | null> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        // Fetch subscription tier from our users table
        const { data: profile } = await supabase
            .from('users')
            .select('subscription_tier')
            .eq('id', user.id)
            .single();

        const tier: SubscriptionTier = profile?.subscription_tier || 'free';

        return {
            id: user.id,
            email: user.email || '',
            tier,
            quotas: this.getQuotasForTier(tier),
        };
    }

    async signInWithEmail(email: string, password: string): Promise<UserProfile> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw new Error(error.message);
        if (!data.user) throw new Error('No user returned');

        const user = await this.getCurrentUser();
        if (!user) throw new Error('Failed to fetch user profile');

        return user;
    }

    async signInWithOAuth(provider: 'google' | 'github'): Promise<UserProfile> {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) throw new Error(error.message);

        // OAuth redirects, so we won't reach here immediately
        // The user profile will be fetched on callback
        throw new Error('OAuth redirect initiated');
    }

    async signOut(): Promise<void> {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
    }

    onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    const profile = await this.getCurrentUser();
                    callback(profile);
                } else {
                    callback(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }

    private getQuotasForTier(tier: SubscriptionTier) {
        const quotas = {
            free: {
                dailyConversions: 20,
                maxFileSize: 50 * 1024 * 1024, // 50MB
                maxBatchSize: 5,
            },
            pro: {
                dailyConversions: Infinity,
                maxFileSize: 500 * 1024 * 1024, // 500MB
                maxBatchSize: Infinity,
            },
        };

        return quotas[tier];
    }
}

// Export singleton instance
export const authService: IAuthService = new SupabaseAuthAdapter();
