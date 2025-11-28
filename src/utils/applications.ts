/**
 * Utility functions for fetching installed applications from the backend
 */

const BACKEND_URL = 'http://127.0.0.1:14200';

export interface Application {
  name: string;
  path: string;
  platform?: string;
  executable?: string;
}

export interface ApplicationsResponse {
  applications: Application[];
  count: number;
  platform: string;
  status: string;
}

/**
 * Fetch all installed applications from the backend
 */
export async function getInstalledApplications(): Promise<Application[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/applications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      
      if (response.status === 404) {
        throw new Error('Applications endpoint not found. Please restart the backend server.');
      }
      
      throw new Error(`Failed to fetch applications: ${response.status} ${response.statusText}`);
    }
    
    const data: ApplicationsResponse = await response.json();
    return data.applications || [];
  } catch (error) {
    console.error('Error fetching applications:', error);
    
    // Provide more helpful error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to backend. Is the backend server running on port 14200?');
    }
    
    throw error;
  }
}

