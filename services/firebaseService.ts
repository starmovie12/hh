
import { Movie } from '../types';

// Using the configuration provided in the original HTML
const firebaseConfig = {
    apiKey: "AIzaSyAFj5jrF26JDJdcteQzdojXcUypvm3UaKc", 
    authDomain: "bhaag-df531.firebaseapp.com",        
    databaseURL: "https://bhaag-df531-default-rtdb.firebaseio.com", 
    projectId: "bhaag-df531",                         
    storageBucket: "bhaag-df531.firebasestorage.app",
    appId: "1:421542632463:web:xxxxxxxxxxxxxx" 
};

/**
 * Since standard Firebase v8/v9 imports might conflict with the sandbox,
 * we use a simplified fetch-based approach for the Realtime Database REST API.
 * This is faster and more reliable in this specific environment.
 */

const BASE_URL = firebaseConfig.databaseURL;

export const fetchAllMovies = async (): Promise<Movie[]> => {
  try {
    const response = await fetch(`${BASE_URL}/movies_by_id.json`);
    if (!response.ok) throw new Error('Failed to fetch movies');
    const data = await response.json();
    if (!data) return [];
    
    // Convert object of objects to array
    return Object.values(data) as Movie[];
  } catch (error) {
    console.error("Firebase fetch error:", error);
    return [];
  }
};

export const fetchMovieById = async (id: string): Promise<Movie | null> => {
  try {
    const response = await fetch(`${BASE_URL}/movies_by_id/${id}.json`);
    if (!response.ok) throw new Error('Failed to fetch movie');
    const data = await response.json();
    return data as Movie;
  } catch (error) {
    console.error("Firebase fetch by id error:", error);
    return null;
  }
};
