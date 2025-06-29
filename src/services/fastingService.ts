// Backend service for storing fasting data
// This would connect to your actual backend API

interface Fast {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  userId: string;
}

interface FastingData {
  id?: string;
  startTime: string;
  endTime: string;
  duration: number;
  userId: string;
}

class FastingService {
  private baseUrl = process.env.VITE_API_URL || 'http://localhost:3001/api';

  // Save fast to backend
  async saveFast(fast: Omit<Fast, 'id'>): Promise<Fast> {
    try {
      const response = await fetch(`${this.baseUrl}/fasts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          startTime: fast.startTime.toISOString(),
          endTime: fast.endTime.toISOString(),
          duration: fast.duration,
          userId: fast.userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save fast');
      }

      const data = await response.json();
      return {
        ...data,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime)
      };
    } catch (error) {
      console.error('Error saving fast:', error);
      // Fallback to localStorage if backend is unavailable
      return this.saveToLocalStorage(fast);
    }
  }

  // Get all fasts for a user
  async getFasts(userId: string): Promise<Fast[]> {
    try {
      const response = await fetch(`${this.baseUrl}/fasts?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fasts');
      }

      const data = await response.json();
      return data.map((fast: FastingData) => ({
        ...fast,
        startTime: new Date(fast.startTime),
        endTime: new Date(fast.endTime)
      }));
    } catch (error) {
      console.error('Error fetching fasts:', error);
      // Fallback to localStorage if backend is unavailable
      return this.getFromLocalStorage(userId);
    }
  }

  // Delete a fast
  async deleteFast(fastId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/fasts/${fastId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete fast');
      }
    } catch (error) {
      console.error('Error deleting fast:', error);
      // Fallback to localStorage if backend is unavailable
      this.deleteFromLocalStorage(fastId);
    }
  }

  // Sync local data with backend
  async syncData(userId: string): Promise<void> {
    try {
      const localFasts = this.getFromLocalStorage(userId);
      const backendFasts = await this.getFasts(userId);

      // Find fasts that exist locally but not on backend
      const fastsToSync = localFasts.filter(localFast => 
        !backendFasts.some(backendFast => backendFast.id === localFast.id)
      );

      // Upload missing fasts to backend
      for (const fast of fastsToSync) {
        await this.saveFast({
          startTime: fast.startTime,
          endTime: fast.endTime,
          duration: fast.duration,
          userId: fast.userId
        });
      }
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  }

  // LocalStorage fallback methods
  private saveToLocalStorage(fast: Omit<Fast, 'id'>): Fast {
    const newFast: Fast = {
      ...fast,
      id: crypto.randomUUID()
    };

    const existingFasts = this.getFromLocalStorage(fast.userId);
    const updatedFasts = [...existingFasts, newFast];
    
    localStorage.setItem(`fastingData_${fast.userId}`, JSON.stringify(updatedFasts));
    return newFast;
  }

  private getFromLocalStorage(userId: string): Fast[] {
    const data = localStorage.getItem(`fastingData_${userId}`);
    if (!data) return [];

    try {
      const parsed = JSON.parse(data);
      return parsed.map((fast: any) => ({
        ...fast,
        startTime: new Date(fast.startTime),
        endTime: new Date(fast.endTime)
      }));
    } catch {
      return [];
    }
  }

  private deleteFromLocalStorage(fastId: string): void {
    // This would need the userId to work properly
    // For now, we'll iterate through all possible user data
    const keys = Object.keys(localStorage).filter(key => key.startsWith('fastingData_'));
    
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const fasts = JSON.parse(data);
          const updatedFasts = fasts.filter((fast: any) => fast.id !== fastId);
          localStorage.setItem(key, JSON.stringify(updatedFasts));
        } catch {
          // Ignore parsing errors
        }
      }
    });
  }

  private getAuthToken(): string {
    // Return the authentication token
    // This would typically come from your auth system
    return localStorage.getItem('authToken') || '';
  }
}

export const fastingService = new FastingService();