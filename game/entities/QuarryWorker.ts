import Phaser from 'phaser';
import StoneRock from './StoneRock';

export default class QuarryWorker extends Phaser.Physics.Arcade.Sprite {
  private sceneRef: any;
  private aiState: 'IDLE' | 'MOVING_TO_ROCK' | 'MINING' | 'MOVING_TO_QUARRY' = 'IDLE';
  private target: StoneRock | null = null;
  private hasStone: boolean = false;
  private moveSpeed: number = 50;
  private miningProgress: number = 0;
  private miningTime: number = 2000; // 2 seconds per hit
  
  // Stuck Detection
  private stuckTimer: number = 0;
  private lastPosition: { x: number; y: number } = { x: 0, y: 0 };

  constructor(scene: any, x: number, y: number) {
    super(scene, x, y, 'quarry_worker');
    this.sceneRef = scene;
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setCollideWorldBounds(true);
    this.setBodySize(20, 20);
    this.setPushable(false);
  }

  update(delta: number) {
    if (!this.active) return;

    // Stuck detection
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.lastPosition.x, this.lastPosition.y);
    if (dist < 1 && (this.aiState === 'MOVING_TO_ROCK' || this.aiState === 'MOVING_TO_QUARRY')) {
      this.stuckTimer += delta;
      if (this.stuckTimer > 3000) {
        this.aiState = 'IDLE';
        this.target = null;
        this.stuckTimer = 0;
      }
    } else {
      this.stuckTimer = 0;
    }
    this.lastPosition = { x: this.x, y: this.y };

    switch (this.aiState) {
      case 'IDLE':
        this.handleIdle();
        break;
      case 'MOVING_TO_ROCK':
        this.handleMovingToRock();
        break;
      case 'MINING':
        this.handleMining(delta);
        break;
      case 'MOVING_TO_QUARRY':
        this.handleMovingToQuarry();
        break;
    }
  }

  private handleIdle() {
    this.setVelocity(0, 0);
    
    if (!this.hasStone) {
      // Find closest stone rock
      const rock = this.sceneRef.getClosestStoneRock(this.x, this.y);
      if (rock) {
        this.target = rock;
        this.aiState = 'MOVING_TO_ROCK';
      }
    } else {
      // Return to quarry
      this.aiState = 'MOVING_TO_QUARRY';
    }
  }

  private handleMovingToRock() {
    if (!this.target || !this.target.active) {
      this.aiState = 'IDLE';
      this.target = null;
      return;
    }

    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    
    if (distance < 30) {
      this.setVelocity(0, 0);
      this.aiState = 'MINING';
      this.miningProgress = 0;
    } else {
      this.scene.physics.moveToObject(this, this.target, this.moveSpeed);
    }
  }

  private handleMining(delta: number) {
    if (!this.target || !this.target.active) {
      this.aiState = 'IDLE';
      this.target = null;
      return;
    }

    this.miningProgress += delta;
    
    // Visual mining effect - bob up and down
    if (Math.floor(this.miningProgress / 200) % 2 === 0) {
      this.setTint(0xFFFFFF);
    } else {
      this.clearTint();
    }

    if (this.miningProgress >= this.miningTime) {
      // Hit the rock
      const destroyed = this.target.hit();
      
      if (destroyed) {
        // Rock destroyed, collect stone
        this.hasStone = true;
        this.target = null;
        this.aiState = 'MOVING_TO_QUARRY';
        this.clearTint();
      } else {
        // Rock still has health, continue mining
        this.miningProgress = 0;
      }
    }
  }

  private handleMovingToQuarry() {
    const quarry = this.sceneRef.getQuarryPosition();
    if (!quarry) {
      this.aiState = 'IDLE';
      return;
    }

    const distance = Phaser.Math.Distance.Between(this.x, this.y, quarry.x, quarry.y);
    
    if (distance < 50) {
      this.setVelocity(0, 0);
      // Deposit stone
      this.sceneRef.depositStone(1);
      this.hasStone = false;
      this.aiState = 'IDLE';
    } else {
      this.scene.physics.moveToObject(this, quarry, this.moveSpeed);
    }
  }

  public getState(): string {
    return this.aiState;
  }

  public hasResource(): boolean {
    return this.hasStone;
  }
}
