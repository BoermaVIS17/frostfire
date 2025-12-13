import Phaser from 'phaser';
import HealthBar from '../utils/HealthBar';

export default class StoneRock extends Phaser.Physics.Arcade.Sprite {
  private health: number = 3;
  private maxHealth: number = 3;
  private isBeingMined: boolean = false;
  private healthBar: HealthBar | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'stone_rock');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setImmovable(true);
    this.setDepth(3);
    
    // Create health bar (hidden initially)
    this.healthBar = new HealthBar(scene, {
      x: x - 15,
      y: y - 25,
      width: 30,
      height: 4,
      maxHealth: this.maxHealth,
      currentHealth: this.health,
      segmented: true,
      segments: 3,
      healthColor: 0x808080,
      lowHealthColor: 0x666666,
      criticalHealthColor: 0x444444,
    });
    this.healthBar.setVisible(false);
    this.healthBar.setDepth(10);
  }

  public hit(): boolean {
    if (this.isBeingMined) return false;
    
    this.health--;
    
    // Show health bar when hit
    if (this.healthBar) {
      this.healthBar.setVisible(true);
      this.healthBar.setHealth(this.health);
      this.healthBar.flash();
    }
    
    // Visual feedback - flash and shake
    this.setTint(0xFFFFFF);
    this.scene.tweens.add({
      targets: this,
      x: this.x + 2,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.clearTint();
      }
    });
    
    // Show damage cracks
    this.updateVisualState();
    
    // Check if destroyed
    if (this.health <= 0) {
      this.isBeingMined = true;
      if (this.healthBar) {
        this.healthBar.destroy();
        this.healthBar = null;
      }
      return true; // Rock is destroyed
    }
    
    return false; // Rock still has health
  }

  private updateVisualState() {
    // Change tint based on health
    if (this.health === 2) {
      this.setTint(0xCCCCCC); // Slightly damaged
    } else if (this.health === 1) {
      this.setTint(0x999999); // Very damaged
    }
  }

  public getHealth(): number {
    return this.health;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public reset() {
    this.health = this.maxHealth;
    this.isBeingMined = false;
    this.clearTint();
  }
}
