import Phaser from 'phaser';

export interface HealthBarConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  maxHealth: number;
  currentHealth: number;
  segmented?: boolean;
  segments?: number;
  showBackground?: boolean;
  backgroundColor?: number;
  healthColor?: number;
  lowHealthColor?: number;
  criticalHealthColor?: number;
  borderColor?: number;
  borderWidth?: number;
}

export default class HealthBar {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private border: Phaser.GameObjects.Graphics;
  private segments: Phaser.GameObjects.Graphics[] = [];
  
  private config: Required<HealthBarConfig>;
  private currentHealth: number;
  private maxHealth: number;

  constructor(scene: Phaser.Scene, config: HealthBarConfig) {
    this.scene = scene;
    this.maxHealth = config.maxHealth;
    this.currentHealth = config.currentHealth;
    
    // Default config
    this.config = {
      x: config.x,
      y: config.y,
      width: config.width,
      height: config.height,
      maxHealth: config.maxHealth,
      currentHealth: config.currentHealth,
      segmented: config.segmented ?? false,
      segments: config.segments ?? 1,
      showBackground: config.showBackground ?? true,
      backgroundColor: config.backgroundColor ?? 0x000000,
      healthColor: config.healthColor ?? 0x00FF00,
      lowHealthColor: config.lowHealthColor ?? 0xFFAA00,
      criticalHealthColor: config.criticalHealthColor ?? 0xFF0000,
      borderColor: config.borderColor ?? 0xFFFFFF,
      borderWidth: config.borderWidth ?? 2,
    };

    this.container = scene.add.container(this.config.x, this.config.y);
    this.background = scene.add.graphics();
    this.bar = scene.add.graphics();
    this.border = scene.add.graphics();

    this.container.add([this.background, this.bar, this.border]);
    
    this.draw();
  }

  private draw() {
    this.background.clear();
    this.bar.clear();
    this.border.clear();
    
    // Clear old segments
    this.segments.forEach(seg => seg.destroy());
    this.segments = [];

    // Background
    if (this.config.showBackground) {
      this.background.fillStyle(this.config.backgroundColor, 0.5);
      this.background.fillRect(0, 0, this.config.width, this.config.height);
    }

    // Health bar color based on percentage
    const healthPercent = this.currentHealth / this.maxHealth;
    let barColor = this.config.healthColor;
    
    if (healthPercent <= 0.25) {
      barColor = this.config.criticalHealthColor;
    } else if (healthPercent <= 0.5) {
      barColor = this.config.lowHealthColor;
    }

    if (this.config.segmented && this.config.segments > 1) {
      // Draw segmented health bar
      const segmentWidth = this.config.width / this.config.segments;
      const gap = 2;
      const filledSegments = Math.ceil((this.currentHealth / this.maxHealth) * this.config.segments);

      for (let i = 0; i < this.config.segments; i++) {
        const segment = this.scene.add.graphics();
        const x = i * segmentWidth;
        
        if (i < filledSegments) {
          segment.fillStyle(barColor);
        } else {
          segment.fillStyle(0x333333, 0.5);
        }
        
        segment.fillRect(x + gap, 0, segmentWidth - gap * 2, this.config.height);
        this.segments.push(segment);
        this.container.add(segment);
      }
    } else {
      // Draw continuous health bar
      const barWidth = (this.currentHealth / this.maxHealth) * this.config.width;
      this.bar.fillStyle(barColor);
      this.bar.fillRect(0, 0, barWidth, this.config.height);
    }

    // Border
    this.border.lineStyle(this.config.borderWidth, this.config.borderColor, 0.8);
    this.border.strokeRect(0, 0, this.config.width, this.config.height);
  }

  public setHealth(health: number) {
    this.currentHealth = Math.max(0, Math.min(health, this.maxHealth));
    this.draw();
  }

  public damage(amount: number) {
    this.setHealth(this.currentHealth - amount);
    this.flash();
  }

  public heal(amount: number) {
    this.setHealth(this.currentHealth + amount);
  }

  public flash(color: number = 0xFFFFFF, duration: number = 100) {
    // Flash effect
    const flashGraphics = this.scene.add.graphics();
    flashGraphics.fillStyle(color, 0.8);
    flashGraphics.fillRect(0, 0, this.config.width, this.config.height);
    this.container.add(flashGraphics);

    this.scene.tweens.add({
      targets: flashGraphics,
      alpha: 0,
      duration: duration,
      onComplete: () => flashGraphics.destroy(),
    });
  }

  public setPosition(x: number, y: number) {
    this.container.setPosition(x, y);
  }

  public setVisible(visible: boolean) {
    this.container.setVisible(visible);
  }

  public setDepth(depth: number) {
    this.container.setDepth(depth);
  }

  public setScrollFactor(x: number, y?: number) {
    this.container.setScrollFactor(x, y);
  }

  public getHealth(): number {
    return this.currentHealth;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public getHealthPercent(): number {
    return this.currentHealth / this.maxHealth;
  }

  public isEmpty(): boolean {
    return this.currentHealth <= 0;
  }

  public isFull(): boolean {
    return this.currentHealth >= this.maxHealth;
  }

  public destroy() {
    this.segments.forEach(seg => seg.destroy());
    this.background.destroy();
    this.bar.destroy();
    this.border.destroy();
    this.container.destroy();
  }
}
