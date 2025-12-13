import Phaser from 'phaser';

export default class StoneRock extends Phaser.Physics.Arcade.Sprite {
  private health: number = 3;
  private maxHealth: number = 3;
  private isBeingMined: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'stone_rock');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setImmovable(true);
    this.setDepth(3);
  }

  public hit(): boolean {
    if (this.isBeingMined) return false;
    
    this.health--;
    
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
