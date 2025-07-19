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

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error submitting violation:', error);
      throw error;
    }
  }

  async getViolationsByReporter(reporterAddress: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/violations?reporter=${reporterAddress}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching user violations:', error);
      return [];
    }
  }

  async getPendingViolations(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/violations?status=pending`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching pending violations:', error);
      return [];
    }
  }

  async getAllViolations(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/violations`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching all violations:', error);
      return [];
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

      const result = await response.json();
      return result.data;
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

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {};
    }
  }

  async uploadEvidence(file: File, violationId: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('evidence', file);
      formData.append('violationId', violationId);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Error uploading evidence:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();