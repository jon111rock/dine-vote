import { ref } from 'vue';
import axios from 'axios';  

export const useRecommendations = () => {
  const apiUrl = import.meta.env.VITE_DINE_GENUS_API_URL;

  const recommendations = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  const getRecommendations = async (roomId) => {
    isLoading.value = true;
    error.value = null;
    recommendations.value = [];

    try {
      const response = await axios.get(`${apiUrl}/recommendations/${roomId}`);
      recommendations.value = response.data;
      return response.data.data;
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    recommendations,
    isLoading,
    error,
    getRecommendations
  };
};