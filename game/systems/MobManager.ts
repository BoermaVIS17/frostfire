import Phaser from 'phaser';
import MapManager from './MapManager';

// --- Worker Sprite Class ---
export class WorkerSprite extends Phaser.Physics.Arcade.Sprite {
  // Explicit declarations to fix missing types
  public body!: Phaser.Physics.Arcade.Body;
  public x!: number;
  public y!: number;
  public active!: boolean;

  private sceneRef: Phaser.Scene;
  private mapManager: MapManager;
  private addWoodCallback: (amt: number) => void;
  private depositCallback: () => void;
  
  private aiState: 'IDLE' | 'MOVING_TO_TREE' | 'HARVESTING' | 'MOVING_TO_FURNACE' = 'IDLE';
  private target: Phaser.GameObjects.GameObject | null = null;
  private hasWood: boolean = false;
  private moveSpeed: number = 60;
  private lastPos: Phaser.Math.Vector2;
  private stuckTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, mapManager: MapManager, addWood: (n:number)=>void, deposit: ()=>void) {
    super(scene, x, y, 'worker');
    this.sceneRef = scene;
    this.mapManager = mapManager;
    this.addWoodCallback = addWood;
    this.depositCallback = deposit;
    this.lastPos = new Phaser.Math.Vector2(x, y);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    (this as any).setCollideWorldBounds(true);
    (this as any).setBodySize(20, 20);
    (this as any).setPushable(false);
  }

  updateAI(dt: number) {
    if (!this.active) return;

    if (this.aiState === 'MOVING_TO_TREE' || this.aiState === 'MOVING_TO_FURNACE') {
        const currentPos = new Phaser.Math.Vector2(this.x, this.y);
        if (this.lastPos.distance(currentPos) < 1) {
            this.stuckTimer += dt;
            if (this.stuckTimer > 2000) { 
                this.aiState = 'IDLE'; 
                this.stuckTimer = 0;
            }
        } else {
            this.stuckTimer = 0;
        }
        this.lastPos = currentPos;
    }

    switch (this.aiState) {
      case 'IDLE':
        this.findTask();
        break;

      case 'MOVING_TO_TREE':
        if (!this.target || !this.target.active) {
          (this as any).setVelocity(0, 0);
          this.aiState = 'IDLE';
          return;
        }
        
        const distToTree = Phaser.Math.Distance.Between(this.x, this.y, (this.target as any).x, (this.target as any).y);
        if (distToTree < 30) {
          (this as any).setVelocity(0, 0);
          this.startHarvesting();
        } else {
          this.sceneRef.physics.moveToObject(this, this.target, this.moveSpeed);
        }
        break;

      case 'HARVESTING':
        break;

      case 'MOVING_TO_FURNACE':
        const furnace = this.mapManager.furnace;
        const distToFurnace = Phaser.Math.Distance.Between(this.x, this.y, furnace.x, furnace.y);
        if (distToFurnace < 60) {
          (this as any).setVelocity(0, 0);
          this.deposit();
        } else {
          this.sceneRef.physics.moveToObject(this, furnace, this.moveSpeed);
        }
        break;
    }
  }

  private findTask() {
    if (this.hasWood) {
      this.aiState = 'MOVING_TO_FURNACE';
    } else {
      const closest = this.mapManager.getClosestTree(this.x, this.y);
      if (closest) {
        this.target = closest;
        this.aiState = 'MOVING_TO_TREE';
      } else {
        (this as any).setVelocity(0, 0);
      }
    }
  }

  private startHarvesting() {
    this.aiState = 'HARVESTING';
    (this as any).setTint(0xaaaaaa);
    this.sceneRef.time.delayedCall(2000, () => {
      if (!this.active) return;
      (this as any).clearTint();
      if (this.target && this.target.active) {
        this.target.destroy();
        this.hasWood = true;
        this.aiState = 'MOVING_TO_FURNACE';
        this.mapManager.triggerTreeRespawn();
      } else {
        this.aiState = 'IDLE';
      }
    });
  }

  private deposit() {
    this.hasWood = false;
    this.addWoodCallback(1);
    this.depositCallback();
    this.aiState = 'IDLE';
  }
}

// --- Bear Sprite Class ---
export class BearSprite extends Phaser.Physics.Arcade.Sprite {
    // Explicit declarations to fix missing types
    public body!: Phaser.Physics.Arcade.Body;
    public x!: number;
    public y!: number;
    public active!: boolean;

    private sceneRef: Phaser.Scene;
    private aiState: 'IDLE' | 'ROAM' | 'CHASE' = 'IDLE';
    private moveTimer: number = 0;
    private targetPos: Phaser.Math.Vector2 | null = null;
    private roamSpeed: number = 50;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'bear');
        this.sceneRef = scene;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        (this as any).setCollideWorldBounds(true);
        (this as any).setBodySize(24, 24);
        (this as any).setBounce(0.5); 
    }

    updateAI(dt: number) {
        if (!this.active) return;
        switch(this.aiState) {
            case 'IDLE':
                this.moveTimer -= dt;
                if (this.moveTimer <= 0) {
                    this.pickPatrolTarget();
                }
                break;
            case 'ROAM':
                if (this.targetPos) {
                    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.targetPos.x, this.targetPos.y);
                    if (dist < 10 || this.body.velocity.length() < 5) {
                         this.stopMoving();
                    } else {
                         this.sceneRef.physics.moveToObject(this, this.targetPos, this.roamSpeed);
                         (this as any).setFlipX(this.body.velocity.x > 0);
                    }
                } else {
                    this.stopMoving();
                }
                break;
        }
    }

    private pickPatrolTarget() {
        const tx = Phaser.Math.Between(500, 780);
        const ty = Phaser.Math.Between(50, 550);
        this.targetPos = new Phaser.Math.Vector2(tx, ty);
        this.aiState = 'ROAM';
    }

    private stopMoving() {
        (this as any).setVelocity(0, 0);
        this.aiState = 'IDLE';
        this.moveTimer = Phaser.Math.Between(1000, 3000); 
    }
}

// --- Manager ---
export default class MobManager {
  private scene: Phaser.Scene;
  
  public bear: BearSprite | null = null;
  public worker: WorkerSprite | null = null;
  public bearHP: number = 3;
  public meatGroup!: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  preload() {
    this.createBearTexture();
    this.createWorkerTexture();
  }

  create() {
    this.meatGroup = this.scene.physics.add.group();
  }

  update(delta: number) {
    if (this.worker && this.worker.active) {
      this.worker.updateAI(delta);
    }
    if (this.bear && this.bear.active) {
      this.bear.updateAI(delta);
      
      // Worker collision logic
      if (this.worker && this.worker.active) {
          this.scene.physics.overlap(this.bear, this.worker, () => {
              (this.worker as any)?.destroy();
              this.worker = null;
          });
      }
    }
  }

  public spawnBear(playerX: number, playerY: number) {
      let x = 700;
      let y = 300;
      let attempts = 0;
      let safeSpawn = false;
      do {
         attempts++;
         x = Phaser.Math.Between(550, 750);
         y = Phaser.Math.Between(50, 550);
         const distToPlayer = Phaser.Math.Distance.Between(x, y, playerX, playerY);
         if (distToPlayer > 250) safeSpawn = true;
      } while(!safeSpawn && attempts < 10);

      this.bear = new BearSprite(this.scene, x, y);
      this.bearHP = 3;
  }

  public spawnWorker(mapManager: MapManager, addWood: (n: number)=>void, deposit: ()=>void) {
      this.worker = new WorkerSprite(this.scene, 300, 380, mapManager, addWood, deposit);
  }

  public damageBear(amount: number): boolean {
      if(!this.bear) return false;
      this.bearHP -= amount;
      (this.bear as any).setTint(0xff0000);
      this.scene.time.delayedCall(200, () => (this.bear as any)?.clearTint());
      return this.bearHP <= 0;
  }

  public killBear() {
      if (!this.bear) return;
      const x = this.bear.x;
      const y = this.bear.y;
      
      // Drop Meat
      const meat = this.meatGroup.create(x, y, 'meat') as Phaser.Physics.Arcade.Sprite;
      meat.setScale(0); 
      this.scene.tweens.add({
        targets: meat, scale: 1, y: y - 25, duration: 300, ease: 'Back.out',
        onComplete: () => {
            this.scene.tweens.add({
                targets: meat, y: y, duration: 200, ease: 'Bounce.out',
                onComplete: () => {
                     this.scene.tweens.add({ 
                        targets: meat, y: meat.y - 5, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                    });
                }
            });
        }
      });

      (this.bear as any).destroy();
      this.bear = null;
  }

  // --- Textures ---
  private createBearTexture() {
    const g = this.scene.make.graphics({x:0,y:0});
    g.fillStyle(0xF5F5F5); g.fillCircle(20,20,18); g.fillCircle(10,8,6); g.fillCircle(30,8,6);
    g.fillStyle(0xE0E0E0); g.fillEllipse(20,26,12,10); g.fillStyle(0x212121); g.fillCircle(20,24,3);
    g.fillCircle(14,18,2); g.fillCircle(26,18,2);
    g.generateTexture('bear', 40, 40);
    g.destroy();
  }
  private createWorkerTexture() {
    const g = this.scene.make.graphics({x:0,y:0});
    g.fillStyle(0xF1C40F); g.fillRect(0,0,20,20); // Yellow body
    g.lineStyle(2, 0x000000); g.strokeRect(0,0,20,20);
    g.generateTexture('worker', 20, 20);
    g.destroy();
  }
}