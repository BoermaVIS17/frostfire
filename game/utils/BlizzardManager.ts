import Phaser from 'phaser';
import FloatingText from './FloatingText';

export type WindDirection = 'up' | 'down' | 'left' | 'right';

export default class BlizzardManager {
  private scene: Phaser.Scene;
  private isActive: boolean = false;
  private warningActive: boolean = false;
  private blizzardTimer: number = 0;
  private nextBlizzardTime: number = 0;
  
  // Visual effects
  private fogOverlay!: Phaser.GameObjects.Rectangle;
  private blurOverlay!: Phaser.GameObjects.Rectangle;
  private windParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private windDirection: WindDirection = 'right';
  
  // Warning UI
  private warningText!: Phaser.GameObjects.Text;
  private warningBg!: Phaser.GameObjects.Rectangle;
  private countdownText!: Phaser.GameObjects.Text;
  
  // Configuration
  private readonly WARNING_DURATION = 10000; // 10 seconds warning
  private readonly BLIZZARD_DURATION = 30000; // 30 seconds storm
  private readonly MIN_INTERVAL = 300000; // 5 minutes
  private readonly MAX_INTERVAL = 600000; // 10 minutes

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.scheduleNextBlizzard();
  }

  private scheduleNextBlizzard() {
    // Random interval between 5-10 minutes
    this.nextBlizzardTime = Phaser.Math.Between(this.MIN_INTERVAL, this.MAX_INTERVAL);
    console.log(`Next blizzard in ${this.nextBlizzardTime / 1000} seconds`);
  }

  public update(delta: number) {
    if (this.warningActive || this.isActive) {
      this.blizzardTimer += delta;
    } else {
      // Count down to next blizzard
      this.nextBlizzardTime -= delta;
      
      if (this.nextBlizzardTime <= 0) {
        this.startWarning();
      }
    }

    // Update warning countdown
    if (this.warningActive) {
      const remaining = Math.ceil((this.WARNING_DURATION - this.blizzardTimer) / 1000);
      if (this.countdownText) {
        this.countdownText.setText(`${remaining}s`);
      }
      
      if (this.blizzardTimer >= this.WARNING_DURATION) {
        this.startBlizzard();
      }
    }

    // Update blizzard duration
    if (this.isActive) {
      const remaining = Math.ceil((this.BLIZZARD_DURATION - (this.blizzardTimer - this.WARNING_DURATION)) / 1000);
      if (this.countdownText) {
        this.countdownText.setText(`${remaining}s`);
      }
      
      if (this.blizzardTimer >= this.WARNING_DURATION + this.BLIZZARD_DURATION) {
        this.endBlizzard();
      }
    }
  }

  private startWarning() {
    this.warningActive = true;
    this.blizzardTimer = 0;
    
    console.log('Blizzard warning started!');
    
    // Create warning UI
    const centerX = 400;
    const centerY = 150;
    
    this.warningBg = this.scene.add.rectangle(centerX, centerY, 500, 100, 0xFF0000, 0.8);
    this.warningBg.setDepth(150);
    
    this.warningText = this.scene.add.text(centerX, centerY - 15, '⚠️ BLIZZARD WARNING ⚠️', {
      fontSize: '32px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    this.warningText.setOrigin(0.5);
    this.warningText.setDepth(151);
    
    this.countdownText = this.scene.add.text(centerX, centerY + 20, '10s', {
      fontSize: '24px',
      color: '#FFFF00',
      fontStyle: 'bold',
    });
    this.countdownText.setOrigin(0.5);
    this.countdownText.setDepth(151);
    
    // Flash effect
    this.scene.tweens.add({
      targets: [this.warningBg, this.warningText, this.countdownText],
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
    
    // Play warning sound effect (visual feedback)
    FloatingText.create(this.scene, centerX, 250, 'Seek Shelter!', '#FF0000', 28);
  }

  private startBlizzard() {
    this.warningActive = false;
    this.isActive = true;
    this.blizzardTimer = this.WARNING_DURATION; // Continue from warning
    
    // Remove warning UI
    if (this.warningBg) this.warningBg.destroy();
    if (this.warningText) this.warningText.destroy();
    
    // Pick random wind direction
    const directions: WindDirection[] = ['up', 'down', 'left', 'right'];
    this.windDirection = Phaser.Utils.Array.GetRandom(directions);
    
    console.log('Blizzard started! Wind from:', this.windDirection);
    
    // Create visual effects
    this.createFogEffect();
    this.createBlurEffect();
    this.createWindParticles();
    
    // Update countdown text style for active blizzard
    this.countdownText = this.scene.add.text(400, 50, '30s', {
      fontSize: '48px',
      color: '#00FFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.countdownText.setOrigin(0.5);
    this.countdownText.setDepth(151);
    
    // Pulsing countdown
    this.scene.tweens.add({
      targets: this.countdownText,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
    
    FloatingText.create(this.scene, 400, 300, 'BLIZZARD!', '#00FFFF', 48);
  }

  private createFogEffect() {
    // Heavy fog overlay
    this.fogOverlay = this.scene.add.rectangle(400, 300, 800, 600, 0xCCCCCC, 0);
    this.fogOverlay.setDepth(140);
    
    // Fade in fog
    this.scene.tweens.add({
      targets: this.fogOverlay,
      alpha: 0.6,
      duration: 2000,
      ease: 'Power2',
    });
    
    // Pulsing fog
    this.scene.tweens.add({
      targets: this.fogOverlay,
      alpha: 0.5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createBlurEffect() {
    // Edge blur/vignette effect
    const graphics = this.scene.add.graphics();
    graphics.setDepth(141);
    
    // Create gradient vignette
    graphics.fillStyle(0x000000, 0);
    graphics.fillRect(0, 0, 800, 600);
    
    // Top edge
    graphics.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0, 0.7, 0);
    graphics.fillRect(0, 0, 800, 100);
    
    // Bottom edge
    graphics.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0.7, 0, 0.7);
    graphics.fillRect(0, 500, 800, 100);
    
    // Left edge
    graphics.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0, 0, 0.7);
    graphics.fillRect(0, 0, 100, 600);
    
    // Right edge
    graphics.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0.7, 0.7, 0);
    graphics.fillRect(700, 0, 100, 600);
    
    this.blurOverlay = graphics as any;
  }

  private createWindParticles() {
    // Create snow particle texture if not exists
    if (!this.scene.textures.exists('blizzard_particle')) {
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xFFFFFF);
      graphics.fillCircle(3, 3, 3);
      graphics.generateTexture('blizzard_particle', 6, 6);
      graphics.destroy();
    }

    // Wind particle configuration based on direction
    let config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      speed: { min: 300, max: 500 },
      scale: { start: 1, end: 0.5 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 3000,
      frequency: 20,
      quantity: 3,
      tint: [0xFFFFFF, 0xCCCCFF, 0xEEEEFF],
    };

    // Set direction based on wind
    switch (this.windDirection) {
      case 'right':
        config.x = { min: -50, max: -50 };
        config.y = { min: 0, max: 600 };
        config.speedX = { min: 300, max: 500 };
        config.speedY = { min: -50, max: 50 };
        break;
      case 'left':
        config.x = { min: 850, max: 850 };
        config.y = { min: 0, max: 600 };
        config.speedX = { min: -500, max: -300 };
        config.speedY = { min: -50, max: 50 };
        break;
      case 'down':
        config.x = { min: 0, max: 800 };
        config.y = { min: -50, max: -50 };
        config.speedX = { min: -50, max: 50 };
        config.speedY = { min: 300, max: 500 };
        break;
      case 'up':
        config.x = { min: 0, max: 800 };
        config.y = { min: 650, max: 650 };
        config.speedX = { min: -50, max: 50 };
        config.speedY = { min: -500, max: -300 };
        break;
    }

    this.windParticles = this.scene.add.particles(0, 0, 'blizzard_particle', config);
    this.windParticles.setDepth(145);
  }

  private endBlizzard() {
    this.isActive = false;
    this.blizzardTimer = 0;
    
    console.log('Blizzard ended!');
    
    // Remove countdown
    if (this.countdownText) {
      this.scene.tweens.add({
        targets: this.countdownText,
        alpha: 0,
        duration: 1000,
        onComplete: () => this.countdownText.destroy(),
      });
    }
    
    // Fade out fog
    if (this.fogOverlay) {
      this.scene.tweens.add({
        targets: this.fogOverlay,
        alpha: 0,
        duration: 3000,
        onComplete: () => this.fogOverlay.destroy(),
      });
    }
    
    // Remove blur
    if (this.blurOverlay) {
      this.scene.tweens.add({
        targets: this.blurOverlay,
        alpha: 0,
        duration: 2000,
        onComplete: () => (this.blurOverlay as any).destroy(),
      });
    }
    
    // Stop wind particles
    if (this.windParticles) {
      this.windParticles.stop();
      this.scene.time.delayedCall(3000, () => {
        if (this.windParticles) this.windParticles.destroy();
      });
    }
    
    FloatingText.create(this.scene, 400, 300, 'Blizzard Passed', '#00FF00', 36);
    
    // Schedule next blizzard
    this.scheduleNextBlizzard();
  }

  public isBlizzardActive(): boolean {
    return this.isActive;
  }

  public isWarningActive(): boolean {
    return this.warningActive;
  }

  public getWindDirection(): WindDirection {
    return this.windDirection;
  }

  public forceBlizzard() {
    // For testing - trigger blizzard immediately
    this.nextBlizzardTime = 0;
  }

  public cleanup() {
    if (this.fogOverlay) this.fogOverlay.destroy();
    if (this.blurOverlay) (this.blurOverlay as any).destroy();
    if (this.windParticles) this.windParticles.destroy();
    if (this.warningBg) this.warningBg.destroy();
    if (this.warningText) this.warningText.destroy();
    if (this.countdownText) this.countdownText.destroy();
  }
}
