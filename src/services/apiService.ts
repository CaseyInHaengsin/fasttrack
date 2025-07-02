// API Service for communicating with the backend
import { authService } from './authService';

const API_BASE_URL = '/api'; // Use relative URL since we're behind nginx proxy

interface Fast {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  notes?: string;
}

interface WeightEntry {
  id: string;
  weight: number;
  date: Date;
  bmi: number;
  unit: 'kg' | 'lb';
}

interface SupplementEntry {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  time: Date;
  notes?: string;
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

interface TimerData {
  startTime: string;
  notes: string;
  isPaused: boolean;
  pausedAt: string | null;
  createdAt: string;
  updatedAt?: string;
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

  // Timer methods
  async getTimer(userId: string): Promise<TimerData | null> {
    return this.request<TimerData | null>(`/timer/${userId}`);
  }

  async startTimer(userId: string, startTime: Date, notes: string = ''): Promise<TimerData> {
    return this.request<TimerData>(`/timer/${userId}`, {
      method: 'POST',
      body: JSON.stringify({
        startTime: startTime.toISOString(),
        notes
      })
    });
  }

  async updateTimer(userId: string, updates: Partial<TimerData>): Promise<TimerData> {
    return this.request<TimerData>(`/timer/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteTimer(userId: string): Promise<void> {
    await this.request(`/timer/${userId}`, {
      method: 'DELETE'
    });
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
        duration: fast.duration,
        notes: fast.notes
      })
    });

    return {
      ...savedFast,
      startTime: new Date(savedFast.startTime),
      endTime: new Date(savedFast.endTime)
    };
  }

  async updateFast(userId: string, fastId: string, updates: Partial<Fast>): Promise<Fast> {
    const updatedFast = await this.request<any>(`/fasts/${userId}/${fastId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });

    return {
      ...updatedFast,
      startTime: new Date(updatedFast.startTime),
      endTime: new Date(updatedFast.endTime)
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

  // Supplement methods
  async getSupplements(userId: string): Promise<SupplementEntry[]> {
    const supplements = await this.request<any[]>(`/supplements/${userId}`);
    return supplements.map(supplement => ({
      ...supplement,
      time: new Date(supplement.time)
    }));
  }

  async saveSupplement(userId: string, supplement: Omit<SupplementEntry, 'id'>): Promise<SupplementEntry> {
    const savedSupplement = await this.request<any>(`/supplements/${userId}`, {
      method: 'POST',
      body: JSON.stringify({
        ...supplement,
        time: supplement.time.toISOString()
      })
    });

    return {
      ...savedSupplement,
      time: new Date(savedSupplement.time)
    };
  }

  async deleteSupplement(userId: string, supplementId: string): Promise<void> {
    await this.request(`/supplements/${userId}/${supplementId}`, {
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
    supplements?: SupplementEntry[];
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
      supplements: data.supplements?.map(supplement => ({
        ...supplement,
        time: supplement.time.toISOString()
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
    supplements: SupplementEntry[];
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
      })),
      supplements: data.supplements.map((supplement: any) => ({
        ...supplement,
        time: new Date(supplement.time)
      }))
    };
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }
}

export const apiService = new ApiService();