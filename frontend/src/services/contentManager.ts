// Content Tracking System for Mood Tracker
// Prevents duplicate content and ensures fresh recommendations

export interface ContentTracker {
  jokes: Set<string>;
  quotes: Set<string>;
  images: Set<string>;
  music: Set<string>;
  games: Set<string>;
}

export class ContentManager {
  private static sessionTracker: ContentTracker = {
    jokes: new Set(),
    quotes: new Set(),
    images: new Set(),
    music: new Set(),
    games: new Set()
  };

  // Check if content has been shown
  static hasBeenShown(type: keyof ContentTracker, id: string): boolean {
    return this.sessionTracker[type].has(id);
  }

  // Mark content as shown
  static markAsShown(type: keyof ContentTracker, id: string): void {
    this.sessionTracker[type].add(id);
  }

  // Filter out already shown content
  static filterUniqueContent<T extends { id?: string; text?: string; joke?: string; title?: string }>(
    type: keyof ContentTracker, 
    content: T[]
  ): T[] {
    return content.filter(item => {
      const id = this.getContentId(item);
      if (!this.hasBeenShown(type, id)) {
        this.markAsShown(type, id);
        return true;
      }
      return false;
    });
  }

  // Get unique identifier for content
  private static getContentId(item: any): string {
    return item.id || 
           item.text || 
           item.joke || 
           item.title || 
           item.videoId || 
           JSON.stringify(item).substring(0, 50);
  }

  // Get count of shown content
  static getShownCount(type: keyof ContentTracker): number {
    return this.sessionTracker[type].size;
  }

  // Check if we need to refresh content pools
  static shouldRefreshPool(type: keyof ContentTracker, totalAvailable: number): boolean {
    const shownCount = this.getShownCount(type);
    return shownCount >= Math.floor(totalAvailable * 0.8); // Refresh when 80% shown
  }

  // Clear specific content type tracker
  static clearContentTracker(contentType: keyof ContentTracker): void {
    this.sessionTracker[contentType].clear()
  }

  // Clear all content trackers
  static clearAllTrackers(): void {
    Object.values(this.sessionTracker).forEach(tracker => tracker.clear())
  }

  // Reset tracker for new sessions (enhanced)
  static resetTracker(): void {
    this.sessionTracker = {
      quotes: new Set(),
      jokes: new Set(),
      images: new Set(),
      music: new Set(),
      games: new Set()
    }
  }
}