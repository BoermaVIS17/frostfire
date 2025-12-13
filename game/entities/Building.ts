import Phaser from 'phaser';

export type BuildingType = 'stick_home' | 'stone_home';

export interface BuildingConfig {
  type: BuildingType;
  maxHealth: number;
  cost: { wood?: number; stone?: number };
  texture: string;
  name: string;
}

export interface BuildingBenefits {
  healingRate?: number; // HP per second
  freezeProtection?: boolean; // Prevents freezing damage
  description: string;
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

export const BUILDING_BENEFITS: Record<BuildingType, BuildingBenefits> = {
  stick_home: {
    healingRate: 2, // 2 HP per second
    freezeProtection: false,
    description: 'Heals player when inside',
  },
  stone_home: {
    healingRate: 5, // 5 HP per second (2.5x faster)
    freezeProtection: true,
    description: 'Fast healing + freeze protection',
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

  public repair(amount: number = 1): boolean {
    if (this.health >= this.maxHealth) {
      return false; // Already at full health
    }
    
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.updateHealthBar();
    this.updateDamageOverlay();
    
    // Visual feedback - green flash
    this.setTint(0x00FF00);
    this.scene.time.delayedCall(200, () => this.clearTint());
    
    // Scale pulse
    this.scene.tweens.add({
      targets: this,
      scale: 1.15,
      duration: 200,
      yoyo: true,
      ease: 'Back.out',
    });
    
    // Sparkle particles
    const particles = this.scene.add.particles(this.x, this.y, 'particle', {
      speed: { min: 50, max: 100 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      quantity: 10,
      tint: 0x00FF00,
      emitting: false,
    });
    particles.explode();
    this.scene.time.delayedCall(600, () => particles.destroy());
    
    return true; // Repair successful
  }
  
  public getRepairCost(): { wood?: number; stone?: number } {
    // Repair costs based on building type
    if (this.buildingType === 'stick_home') {
      return { wood: 2 }; // 2 wood per HP
    } else {
      return { stone: 3 }; // 3 stone per HP
    }
  }
  
  public canRepair(): boolean {
    return this.health < this.maxHealth;
  }
  
  public getRepairAmount(): number {
    return this.maxHealth - this.health;
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

  public getBenefits(): BuildingBenefits {
    return BUILDING_BENEFITS[this.buildingType];
  }

  public isPlayerInside(playerX: number, playerY: number): boolean {
    // Check if player is within building bounds
    const radius = 50; // Building interior radius
    const distance = Math.sqrt(
      Math.pow(playerX - this.x, 2) + Math.pow(playerY - this.y, 2)
    );
    return distance < radius;
  }

  public getHealingRate(): number {
    return BUILDING_BENEFITS[this.buildingType].healingRate || 0;
  }

  public hasFreezeProtection(): boolean {
    return BUILDING_BENEFITS[this.buildingType].freezeProtection || false;
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
