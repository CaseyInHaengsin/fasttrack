// API Service for communicating with the backend
import { authService } from './authService';

const API_BASE_URL = '/api'; // Use relative URL since we're behind nginx proxy

interface Fast {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}

interface WeightEntry {
  id: string;
  weight: number;
  date: Date;
  bmi: number;
  unit: 'kg' | 'lb';
}

interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  height: number;
  heightUnit: 'cm' | 'in';
  currentWeight: number;
  weightUnit: 'kg' | 'lb';
  goalWeight: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = authService.getAuthToken();
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (response.status === 401) {
      // Token expired or invalid, logout user
      await authService.logout();
      window.location.reload();
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Fasting data methods
  async getFasts(userId: string): Promise<Fast[]> {
    const fasts = await this.request<any[]>(`/fasts/${userId}`);
    return fasts.map(fast => ({
      ...fast,
      startTime: new Date(fast.startTime),
      endTime: new Date(fast.endTime)
    }));
  }

  async saveFast(userId: string, fast: Omit<Fast, 'id'>): Promise<Fast> {
    const savedFast = await this.request<any>(`/fasts/${userId}`, {
      method: 'POST',
      body: JSON.stringify({
        startTime: fast.startTime.toISOString(),
        endTime: fast.endTime.toISOString(),
        duration: fast.duration
      })
    });

    return {
      ...savedFast,
      startTime: new Date(savedFast.startTime),
      endTime: new Date(savedFast.endTime)
    };
  }

  async deleteFast(userId: string, fastId: string): Promise<void> {
    await this.request(`/fasts/${userId}/${fastId}`, {
      method: 'DELETE'
    });
  }

  // Weight data methods
  async getWeights(userId: string): Promise<WeightEntry[]> {
    const weights = await this.request<any[]>(`/weight/${userId}`);
    return weights.map(weight => ({
      ...weight,
      date: new Date(weight.date)
    }));
  }

  async saveWeight(userId: string, weight: Omit<WeightEntry, 'id' | 'date'>): Promise<WeightEntry> {
    const savedWeight = await this.request<any>(`/weight/${userId}`, {
      method: 'POST',
      body: JSON.stringify(weight)
    });

    return {
      ...savedWeight,
      date: new Date(savedWeight.date)
    };
  }

  async deleteWeight(userId: string, weightId: string): Promise<void> {
    await this.request(`/weight/${userId}/${weightId}`, {
      method: 'DELETE'
    });
  }

  // Profile methods
  async getProfile(userId: string): Promise<UserProfile | null> {
    return this.request<UserProfile | null>(`/profile/${userId}`);
  }

  async saveProfile(userId: string, profile: UserProfile): Promise<UserProfile> {
    return this.request<UserProfile>(`/profile/${userId}`, {
      method: 'POST',
      body: JSON.stringify(profile)
    });
  }

  // Import/Export methods
  async importData(userId: string, data: {
    fasts?: Fast[];
    weights?: WeightEntry[];
    profile?: UserProfile;
  }): Promise<void> {
    const payload = {
      fasts: data.fasts?.map(fast => ({
        ...fast,
        startTime: fast.startTime.toISOString(),
        endTime: fast.endTime.toISOString()
      })),
      weights: data.weights?.map(weight => ({
        ...weight,
        date: weight.date.toISOString()
      })),
      profile: data.profile
    };

    await this.request(`/import/${userId}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async exportData(userId: string): Promise<{
    fasts: Fast[];
    weights: WeightEntry[];
    profile: UserProfile | null;
    exportedAt: string;
  }> {
    const data = await this.request<any>(`/export/${userId}`);
    
    return {
      ...data,
      fasts: data.fasts.map((fast: any) => ({
        ...fast,
        startTime: new Date(fast.startTime),
        endTime: new Date(fast.endTime)
      })),
      weights: data.weights.map((weight: any) => ({
        ...weight,
        date: new Date(weight.date)
      }))
    };
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }
}

export const apiService = new ApiService();