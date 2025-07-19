const API_BASE_URL = 'http://localhost:3001/api';

export interface ViolationSubmission {
  reporter: string;
  vehicleId: number;
  violationType: number;
  description: string;
  location: string;
  greenfieldUrl: string;
  blockchainTxHash: string;
}

export interface ViolationReview {
  status: 'approved' | 'rejected';
  reviewer: string;
  fineAmount?: number;
  reviewNotes?: string;
}

class ApiService {
  async submitViolation(violationData: ViolationSubmission): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/violations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(violationData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting violation:', error);
      throw error;
    }
  }

  async getViolationsByReporter(reporterAddress: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/violations/reporter/${reporterAddress}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user violations:', error);
      throw error;
    }
  }

  async getPendingViolations(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/violations/status/pending`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching pending violations:', error);
      throw error;
    }
  }

  async getAllViolations(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/violations`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching all violations:', error);
      throw error;
    }
  }

  async reviewViolation(violationId: number, reviewData: ViolationReview): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/violations/${violationId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error reviewing violation:', error);
      throw error;
    }
  }

  async getStatistics(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();