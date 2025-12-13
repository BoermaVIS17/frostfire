export interface GameSaveData {
  // Resources
  woodCount: number;
  meatCount: number;
  
  // Game State
  temperature: number;
  furnaceLevel: number;
  hasSpear: boolean;
  hasHut: boolean;
  
  // Player Position
  playerX: number;
  playerY: number;
  
  // Progression
  daysSurvived: number;
  totalWoodGathered: number;
  totalMeatCollected: number;
  bearsKilled: number;
  
  // Timestamp
  lastSaved: number;
  playTime: number; // in seconds
}

export interface ProgressionData {
  highScore: number; // Best days survived
  totalGamesPlayed: number;
  totalPlayTime: number;
  achievements: string[];
}

export default class SaveManager {
  private static readonly SAVE_KEY = 'frostfire_save';
  private static readonly PROGRESSION_KEY = 'frostfire_progression';
  private static readonly AUTO_SAVE_INTERVAL = 30000; // 30 seconds

  /**
   * Save current game state to local storage
   */
  static saveGame(data: GameSaveData): boolean {
    try {
      const saveData = {
        ...data,
        lastSaved: Date.now(),
      };
      
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
      console.log('Game saved successfully!', saveData);
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load game state from local storage
   */
  static loadGame(): GameSaveData | null {
    try {
      const savedData = localStorage.getItem(this.SAVE_KEY);
      
      if (!savedData) {
        console.log('No save data found');
        return null;
      }
      
      const data = JSON.parse(savedData) as GameSaveData;
      console.log('Game loaded successfully!', data);
      return data;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * Check if a save file exists
   */
  static hasSaveData(): boolean {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }

  /**
   * Delete current save file
   */
  static deleteSave(): boolean {
    try {
      localStorage.removeItem(this.SAVE_KEY);
      console.log('Save data deleted');
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  /**
   * Get formatted last saved time
   */
  static getLastSavedTime(): string | null {
    const data = this.loadGame();
    if (!data || !data.lastSaved) return null;
    
    const date = new Date(data.lastSaved);
    return date.toLocaleString();
  }

  /**
   * Save progression data (high scores, achievements)
   */
  static saveProgression(data: ProgressionData): boolean {
    try {
      localStorage.setItem(this.PROGRESSION_KEY, JSON.stringify(data));
      console.log('Progression saved!', data);
      return true;
    } catch (error) {
      console.error('Failed to save progression:', error);
      return false;
    }
  }

  /**
   * Load progression data
   */
  static loadProgression(): ProgressionData {
    try {
      const savedData = localStorage.getItem(this.PROGRESSION_KEY);
      
      if (!savedData) {
        // Return default progression data
        return {
          highScore: 0,
          totalGamesPlayed: 0,
          totalPlayTime: 0,
          achievements: [],
        };
      }
      
      return JSON.parse(savedData) as ProgressionData;
    } catch (error) {
      console.error('Failed to load progression:', error);
      return {
        highScore: 0,
        totalGamesPlayed: 0,
        totalPlayTime: 0,
        achievements: [],
      };
    }
  }

  /**
   * Update high score if current score is better
   */
  static updateHighScore(daysSurvived: number): boolean {
    const progression = this.loadProgression();
    
    if (daysSurvived > progression.highScore) {
      progression.highScore = daysSurvived;
      this.saveProgression(progression);
      console.log('New high score!', daysSurvived);
      return true; // New record!
    }
    
    return false;
  }

  /**
   * Increment total games played
   */
  static incrementGamesPlayed(): void {
    const progression = this.loadProgression();
    progression.totalGamesPlayed++;
    this.saveProgression(progression);
  }

  /**
   * Add play time to total
   */
  static addPlayTime(seconds: number): void {
    const progression = this.loadProgression();
    progression.totalPlayTime += seconds;
    this.saveProgression(progression);
  }

  /**
   * Unlock achievement
   */
  static unlockAchievement(achievementId: string): boolean {
    const progression = this.loadProgression();
    
    if (!progression.achievements.includes(achievementId)) {
      progression.achievements.push(achievementId);
      this.saveProgression(progression);
      console.log('Achievement unlocked:', achievementId);
      return true; // Newly unlocked
    }
    
    return false; // Already unlocked
  }

  /**
   * Check if achievement is unlocked
   */
  static hasAchievement(achievementId: string): boolean {
    const progression = this.loadProgression();
    return progression.achievements.includes(achievementId);
  }

  /**
   * Export save data as JSON string (for backup)
   */
  static exportSave(): string | null {
    const saveData = this.loadGame();
    if (!saveData) return null;
    
    return JSON.stringify(saveData, null, 2);
  }

  /**
   * Import save data from JSON string
   */
  static importSave(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString) as GameSaveData;
      return this.saveGame(data);
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }

  /**
   * Get auto-save interval
   */
  static getAutoSaveInterval(): number {
    return this.AUTO_SAVE_INTERVAL;
  }

  /**
   * Format play time as readable string
   */
  static formatPlayTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Create default save data
   */
  static createDefaultSave(): GameSaveData {
    return {
      woodCount: 0,
      meatCount: 0,
      temperature: 100,
      furnaceLevel: 1,
      hasSpear: false,
      hasHut: false,
      playerX: 100,
      playerY: 100,
      daysSurvived: 0,
      totalWoodGathered: 0,
      totalMeatCollected: 0,
      bearsKilled: 0,
      lastSaved: Date.now(),
      playTime: 0,
    };
  }
}
