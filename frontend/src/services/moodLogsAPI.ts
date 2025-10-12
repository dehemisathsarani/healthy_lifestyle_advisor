/**
 * API service for Enhanced Mood Logs with MongoDB persistence
 * Handles saving and retrieving mood logs from the backend
 */

import { MoodLog } from '../types/enhancedMoodTracker';

const API_BASE_URL = 'http://localhost:8000/api/mental-health';

export class MoodLogsAPI {
  /**
   * Save a mood log to the database
   */
  static async saveMoodLog(moodLog: MoodLog, userId: string): Promise<MoodLog> {
    try {
      const response = await fetch(`${API_BASE_URL}/mood-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          mood_type: moodLog.moodType,
          mood: moodLog.mood,
          rating: moodLog.rating,
          description: moodLog.description,
          timestamp: moodLog.timestamp instanceof Date ? moodLog.timestamp.toISOString() : moodLog.timestamp,
          factors: moodLog.factors || [],
          activities: moodLog.activities.map(activity => ({
            id: activity.id,
            type: activity.type,
            content: activity.data,  // Transform 'data' to 'content' for backend
            timestamp: activity.timestamp instanceof Date ? activity.timestamp.toISOString() : activity.timestamp
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Mood log saved to MongoDB:', result);
      
      // Return the saved mood log from backend response
      const savedLog = result.mood_log;
      return {
        ...savedLog,
        id: savedLog._id || savedLog.id,
        moodType: savedLog.mood_type,
        timestamp: new Date(savedLog.timestamp),
        activities: savedLog.activities.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }))
      };
      
    } catch (error) {
      console.error('Error saving mood log:', error);
      throw error;
    }
  }

  /**
   * Get mood logs for a user
   */
  static async getMoodLogs(userId: string, limit: number = 50, skip: number = 0): Promise<MoodLog[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/mood-logs?user_id=${encodeURIComponent(userId)}&limit=${limit}&skip=${skip}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Mood logs retrieved from MongoDB:', result.mood_logs?.length || 0, 'logs');
      
      // Convert timestamp strings back to Date objects and map field names
      const moodLogs = result.mood_logs.map((log: any) => ({
        ...log,
        id: log._id || log.id,
        moodType: log.mood_type,
        timestamp: new Date(log.timestamp),
        activities: log.activities.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }))
      }));

      return moodLogs;
      
    } catch (error) {
      console.error('Error retrieving mood logs:', error);
      return [];
    }
  }

  /**
   * Update a mood log
   */
  static async updateMoodLog(moodLogId: string, moodLogData: Partial<MoodLog>, userId: string): Promise<{success: boolean, error?: string}> {
    try {
      const response = await fetch(`${API_BASE_URL}/mood-logs/${moodLogId}?user_id=${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...moodLogData,
          timestamp: moodLogData.timestamp instanceof Date ? moodLogData.timestamp.toISOString() : moodLogData.timestamp
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return { success: true };
      
    } catch (error) {
      console.error('Error updating mood log:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete a mood log
   */
  static async deleteMoodLog(moodLogId: string, userId: string): Promise<{success: boolean, error?: string}> {
    try {
      const response = await fetch(`${API_BASE_URL}/mood-logs/${moodLogId}?user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return { success: true };
      
    } catch (error) {
      console.error('Error deleting mood log:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get a specific mood log by ID
   */
  static async getMoodLog(moodLogId: string, userId: string): Promise<{success: boolean, mood_log?: MoodLog, error?: string}> {
    try {
      const response = await fetch(`${API_BASE_URL}/mood-logs/${moodLogId}?user_id=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Convert timestamp strings back to Date objects
      const moodLog = {
        ...result.mood_log,
        timestamp: new Date(result.mood_log.timestamp),
        activities: result.mood_log.activities.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }))
      };

      return {
        success: true,
        mood_log: moodLog
      };
      
    } catch (error) {
      console.error('Error retrieving mood log:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}