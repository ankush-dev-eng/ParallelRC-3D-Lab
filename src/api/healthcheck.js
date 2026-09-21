import axios from 'axios';

export const fetchHealthCheck = async (params = {}) => {
  try {
    const response = await axios.get(`/api/healthcheck`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching HealthCheck:', error);
    throw error;
  }
};
