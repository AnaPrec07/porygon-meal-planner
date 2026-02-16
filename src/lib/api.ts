/** API client: Firebase ID token per request. */
import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface UserPreferences {
  food_allergies?: string;
  foods_dislike?: string;
  foods_like?: string;
  meals_per_day?: number;
  meal_preference?: string;
  goals?: string;
  bad_habits?: string;
  body_scan_info?: string;
  onboarding_complete?: boolean;
}

export interface ProgressEntry {
  id: number;
  date: string;
  meals_logged?: string;
  notes?: string;
}

export interface UserStats {
  points: number;
  streak: number;
  last_check_in_date?: string;
}

export interface Badge {
  id: number;
  badge_name: string;
  badge_description?: string;
  earned_at: string;
}

class ApiClient {
  /** Get current Firebase ID token for API auth (GCP native). */
  private async getToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    try {
      return await user.getIdToken(/* forceRefresh */ false);
    } catch {
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error((error as { error?: string }).error || 'Request failed');
    }

    return response.json();
  }

  async session(idToken: string, name?: string): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: idToken, name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Session failed' }));
      throw new Error((err as { error?: string }).error || 'Session failed');
    }
    return res.json();
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  async getPreferences(): Promise<{ preferences: UserPreferences | null }> {
    return this.request<{ preferences: UserPreferences | null }>('/preferences');
  }

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<{ success: boolean; preferences: UserPreferences }> {
    return this.request<{ success: boolean; preferences: UserPreferences }>('/preferences', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  }

  async addProgressEntry(date: string, meals_logged?: string, notes?: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/progress', {
      method: 'POST',
      body: JSON.stringify({ date, meals_logged, notes }),
    });
  }

  async getProgressEntries(): Promise<{ entries: ProgressEntry[] }> {
    return this.request<{ entries: ProgressEntry[] }>('/progress');
  }

  async getStats(): Promise<{ stats: UserStats; badges: Badge[] }> {
    return this.request<{ stats: UserStats; badges: Badge[] }>('/stats');
  }

  async sendMessage(message: string): Promise<{ response: string }> {
    return this.request<{ response: string }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async saveMealPlan(week_start_date: string, plan_data: any): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/meal-plans', {
      method: 'POST',
      body: JSON.stringify({ week_start_date, plan_data }),
    });
  }

  async getMealPlan(week_start_date: string): Promise<{ plan: any }> {
    return this.request<{ plan: any }>(`/meal-plans?week_start_date=${encodeURIComponent(week_start_date)}`);
  }
}

export const api = new ApiClient();
