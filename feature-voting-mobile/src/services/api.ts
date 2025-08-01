import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feature, FeatureCreate } from '../types/Feature';

const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  private async getHeaders(): Promise<HeadersInit> {
    const userId = await AsyncStorage.getItem('user_id');
    return {
      'Content-Type': 'application/json',
      ...(userId && { 'Cookie': `user_id=${userId}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader && setCookieHeader.includes('user_id=')) {
      const userIdMatch = setCookieHeader.match(/user_id=([^;]+)/);
      if (userIdMatch) {
        await AsyncStorage.setItem('user_id', userIdMatch[1]);
      }
    }
    
    return response.json();
  }

  async fetchFeatures(sortBy: string = 'votes', order: string = 'desc'): Promise<Feature[]> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE_URL}/features?sort_by=${sortBy}&order=${order}`,
      {
        method: 'GET',
        headers,
        credentials: 'include',
      }
    );
    return this.handleResponse<Feature[]>(response);
  }

  async createFeature(featureData: FeatureCreate): Promise<Feature> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/features`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(featureData),
    });
    return this.handleResponse<Feature>(response);
  }

  async voteForFeature(featureId: string): Promise<Feature> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/features/${featureId}/vote`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });
    return this.handleResponse<Feature>(response);
  }

  async archiveFeature(featureId: string): Promise<Feature> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/features/${featureId}/archive`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });
    return this.handleResponse<Feature>(response);
  }

  async getAnchoredFeatures(featureId: string): Promise<Feature[]> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/features/${featureId}/anchored`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
    return this.handleResponse<Feature[]>(response);
  }
}

export const apiService = new ApiService();
