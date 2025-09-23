import { storage } from "@/store/storage";

const RECENT_SEARCHES_KEY = "himisiri_recent_searches";
const MAX_RECENT_SEARCHES = 10;

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

export class RecentSearchesService {
  static async getRecentSearches(): Promise<RecentSearch[]> {
    try {
      const storedSearches = storage.getString(RECENT_SEARCHES_KEY);
      if (storedSearches) {
        const searches: RecentSearch[] = JSON.parse(storedSearches);
        // Sort by timestamp (most recent first)
        return searches.sort((a, b) => b.timestamp - a.timestamp);
      }
      return [];
    } catch (error) {
      console.error("Error retrieving recent searches:", error);
      return [];
    }
  }

  static async addRecentSearch(query: string): Promise<void> {
    try {
      if (!query.trim()) return;

      const existingSearches = await this.getRecentSearches();

      // Remove existing search with same query (case-insensitive)
      const filteredSearches = existingSearches.filter(
        (search) => search.query.toLowerCase() !== query.toLowerCase()
      );

      // Add new search at the beginning
      const newSearch: RecentSearch = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: Date.now(),
      };

      const updatedSearches = [newSearch, ...filteredSearches];

      // Keep only the latest MAX_RECENT_SEARCHES items
      const trimmedSearches = updatedSearches.slice(0, MAX_RECENT_SEARCHES);

      storage.set(RECENT_SEARCHES_KEY, JSON.stringify(trimmedSearches));
    } catch (error) {
      console.error("Error adding recent search:", error);
    }
  }

  static async removeRecentSearch(searchId: string): Promise<void> {
    try {
      const existingSearches = await this.getRecentSearches();
      const updatedSearches = existingSearches.filter(
        (search) => search.id !== searchId
      );
      storage.set(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    } catch (error) {
      console.error("Error removing recent search:", error);
    }
  }

  static async clearAllRecentSearches(): Promise<void> {
    try {
      storage.delete(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error("Error clearing recent searches:", error);
    }
  }

  static async searchExists(query: string): Promise<boolean> {
    try {
      const existingSearches = await this.getRecentSearches();
      return existingSearches.some(
        (search) => search.query.toLowerCase() === query.toLowerCase()
      );
    } catch (error) {
      console.error("Error checking if search exists:", error);
      return false;
    }
  }
}
