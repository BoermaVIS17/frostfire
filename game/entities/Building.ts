import Phaser from 'phaser';

export type BuildingType = 'stick_home' | 'stone_home';

export interface BuildingConfig {
  type: BuildingType;
  maxHealth: number;
  cost: { wood?: number; stone?: number };
  texture: string;
  name: string;
}

export const BUILDING_CONFIGS: Record<BuildingType, BuildingConfig> = {
  stick_home: {
    type: 'stick_home',
    maxHealth: 3,
    cost: { wood: 10 },
    texture: 'stick_home',
    name: 'Stick Home',
  },
  stone_home: {
    type: 'stone_home',
    maxHealth: 6,
    cost: { stone: 20 },
    texture: 'stone_home',
    name: 'Stone Home',
  },
};

export default class Building extends Phaser.GameObjects.Image {
  private buildingType: BuildingType;
  private health: number;
  private maxHealth: number;
  private config: BuildingConfig;
  private healthBar: Phaser.GameObjects.Graphics | null = null;
  private damageOverlay: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, type: BuildingType) {
    const config = BUILDING_CONFIGS[type];
    super(scene, x, y, config.texture);
    
    this.buildingType = type;
    this.config = config;
    this.maxHealth = config.maxHealth;
    this.health = this.maxHealth;
    
    scene.add.existing(this);
    this.setDepth(4);
    
    // Create health bar
    this.createHealthBar();
  }

  private createHealthBar() {
    this.healthBar = this.scene.add.graphics();
    this.healthBar.setDepth(this.depth + 1);
    this.updateHealthBar();
  }

  private updateHealthBar() {
    if (!this.healthBar) return;
    
    this.healthBar.clear();
    
    // Background
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(this.x - 30, this.y - 50, 60, 8);
    
    // Health bar
    const healthPercent = this.health / this.maxHealth;
    let color = 0x00FF00; // Green
    
    if (healthPercent <= 0.33) {
      color = 0xFF0000; // Red
    } else if (healthPercent <= 0.66) {
      color = 0xFFAA00; // Orange
    }
    
    this.healthBar.fillStyle(color);
    this.healthBar.fillRect(this.x - 30, this.y - 50, 60 * healthPercent, 8);
    
    // Border
    this.healthBar.lineStyle(2, 0xFFFFFF, 0.8);
    this.healthBar.strokeRect(this.x - 30, this.y - 50, 60, 8);
  }

  private updateDamageOverlay() {
    if (this.damageOverlay) {
      this.damageOverlay.destroy();
      this.damageOverlay = null;
    }
    
    const damagePercent = 1 - (this.health / this.maxHealth);
    
    if (damagePercent > 0) {
      this.damageOverlay = this.scene.add.graphics();
      this.damageOverlay.setDepth(this.depth);
      
      // Draw cracks based on damage
      this.damageOverlay.lineStyle(2, 0x000000, damagePercent * 0.8);
      
      const numCracks = Math.floor(damagePercent * 5);
      for (let i = 0; i < numCracks; i++) {
        const startX = this.x + Phaser.Math.Between(-20, 20);
        const startY = this.y + Phaser.Math.Between(-20, 20);
        const endX = startX + Phaser.Math.Between(-15, 15);
        const endY = startY + Phaser.Math.Between(10, 30);
        
        this.damageOverlay.lineBetween(startX, startY, endX, endY);
      }
    }
  }

  public takeDamage(amount: number = 1): boolean {
    this.health -= amount;
    
    // Visual feedback
    this.setTint(0xFF0000);
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.clearTint();
        this.setAlpha(1);
      },
    });
    
    // Shake effect
    this.scene.tweens.add({
      targets: this,
      x: this.x + 3,
      duration: 50,
      yoyo: true,
      repeat: 3,
    });
    
    this.updateHealthBar();
    this.updateDamageOverlay();
    
    // Check if destroyed
    if (this.health <= 0) {
      this.destroy();
      return true; // Building destroyed
    }
    
    return false; // Building still standing
  }

  public repair(amount: number = 1) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.updateHealthBar();
    this.updateDamageOverlay();
    
    // Visual feedback
    this.scene.tweens.add({
      targets: this,
      scale: 1.1,
      duration: 200,
      yoyo: true,
    });
  }

  public getHealth(): number {
    return this.health;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public getType(): BuildingType {
    return this.buildingType;
  }

  public getConfig(): BuildingConfig {
    return this.config;
  }

  public destroy(fromScene?: boolean) {
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    if (this.damageOverlay) {
      this.damageOverlay.destroy();
    }
    super.destroy(fromScene);
  }
}
