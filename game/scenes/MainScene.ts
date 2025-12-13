import Phaser from 'phaser';

// --- Helper Class for the Worker AI ---
class WorkerSprite extends Phaser.Physics.Arcade.Sprite {
  private sceneRef: MainScene;
  private aiState: 'IDLE' | 'MOVING_TO_TREE' | 'HARVESTING' | 'MOVING_TO_FURNACE' = 'IDLE';
  private target: Phaser.GameObjects.GameObject | null = null;
  private hasWood: boolean = false;
  private moveSpeed: number = 60;
  
  // Stuck Detection
  private lastPos: Phaser.Math.Vector2;
  private stuckTimer: number = 0;

  constructor(scene: MainScene, x: number, y: number) {
    super(scene, x, y, 'worker');
    this.sceneRef = scene;
    this.lastPos = new Phaser.Math.Vector2(x, y);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setBodySize(20, 20);
    this.setPushable(false); // Player cannot push worker
  }

  updateAI(dt: number) {
    if (!this.active) return;

    // Stuck Detection Logic
    if (this.aiState === 'MOVING_TO_TREE' || this.aiState === 'MOVING_TO_FURNACE') {
        const currentPos = new Phaser.Math.Vector2(this.x, this.y);
        if (this.lastPos.distance(currentPos) < 1) {
            this.stuckTimer += dt;
            if (this.stuckTimer > 2000) { // Stuck for 2 seconds
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
          this.setVelocity(0, 0);
          this.aiState = 'IDLE';
          return;
        }
        
        const distToTree = Phaser.Math.Distance.Between(this.x, this.y, (this.target as any).x, (this.target as any).y);
        if (distToTree < 30) {
          this.setVelocity(0, 0);
          this.startHarvesting();
        } else {
          this.sceneRef.physics.moveToObject(this, this.target, this.moveSpeed);
        }
        break;

      case 'HARVESTING':
        // Waiting for timer
        break;

      case 'MOVING_TO_FURNACE':
        const furnace = this.sceneRef.getFurnace();
        const distToFurnace = Phaser.Math.Distance.Between(this.x, this.y, furnace.x, furnace.y);
        
        if (distToFurnace < 60) {
          this.setVelocity(0, 0);
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
      const closest = this.sceneRef.getClosestTree(this.x, this.y);
      if (closest) {
        this.target = closest;
        this.aiState = 'MOVING_TO_TREE';
      } else {
        this.setVelocity(0, 0);
      }
    }
  }

  private startHarvesting() {
    this.aiState = 'HARVESTING';
    this.setTint(0xaaaaaa);
    
    this.sceneRef.time.delayedCall(2000, () => {
      if (!this.active) return;
      this.clearTint();
      if (this.target && this.target.active) {
        this.target.destroy();
        this.hasWood = true;
        this.aiState = 'MOVING_TO_FURNACE';
        this.sceneRef.triggerTreeRespawn();
      } else {
        this.aiState = 'IDLE';
      }
    });
  }

  private deposit() {
    this.hasWood = false;
    this.sceneRef.addWood(1);
    this.sceneRef.depositWorkerWood();
    this.aiState = 'IDLE';
  }
}

// --- Helper Class for Bear AI (Patrol Behavior) ---
class BearSprite extends Phaser.Physics.Arcade.Sprite {
    private sceneRef: MainScene;
    private aiState: 'IDLE' | 'ROAM' | 'CHASE' = 'IDLE';
    private moveTimer: number = 0;
    private targetPos: Phaser.Math.Vector2 | null = null;
    private roamSpeed: number = 50;

    constructor(scene: MainScene, x: number, y: number) {
        super(scene, x, y, 'bear');
        this.sceneRef = scene;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.setBodySize(24, 24);
        this.setBounce(0.5); 
    }

    updateAI(dt: number) {
        if (!this.active) return;

        // Simple State Machine
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
                         // Arrived or stuck
                         this.stopMoving();
                    } else {
                         this.sceneRef.physics.moveToObject(this, this.targetPos, this.roamSpeed);
                         // Flip based on movement X
                         this.setFlipX(this.body.velocity.x > 0);
                    }
                } else {
                    this.stopMoving();
                }
                break;
        }
    }

    private pickPatrolTarget() {
        // Patrol Zone: Right side (Wilderness)
        // Approx X: 500 to 780, Y: 50 to 550
        const tx = Phaser.Math.Between(500, 780);
        const ty = Phaser.Math.Between(50, 550);
        
        this.targetPos = new Phaser.Math.Vector2(tx, ty);
        this.aiState = 'ROAM';
    }

    private stopMoving() {
        this.setVelocity(0, 0);
        this.aiState = 'IDLE';
        this.moveTimer = Phaser.Math.Between(1000, 3000); // Pause for 1-3 seconds
    }
}

// --- MAIN SCENE ---

export default class MainScene extends Phaser.Scene {
  // Properties
  public cameras!: Phaser.Cameras.Scene2D.CameraManager;
  public add!: Phaser.GameObjects.GameObjectFactory;
  public physics!: Phaser.Physics.Arcade.ArcadePhysics;
  public input!: Phaser.Input.InputPlugin;
  public scene!: Phaser.Scenes.ScenePlugin;
  public time!: Phaser.Time.Clock;
  public make!: Phaser.GameObjects.GameObjectCreator;
  public scale!: Phaser.Scale.ScaleManager;
  public tweens!: Phaser.Tweens.TweenManager;

  // Game Objects
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private furnace!: Phaser.Physics.Arcade.Image;
  private trees!: Phaser.Physics.Arcade.StaticGroup;
  private bear!: BearSprite | null;
  private fogWall!: Phaser.GameObjects.Rectangle;
  private fogCollider!: Phaser.Physics.Arcade.StaticBody;
  private meatGroup!: Phaser.Physics.Arcade.Group;

  // Combat
  private spear!: Phaser.GameObjects.Sprite;
  private hasSpear: boolean = false;
  private isAttacking: boolean = false;
  private canAttack: boolean = true;
  private hasHitTarget: boolean = false;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private bearHP: number = 3;

  // Automation
  private hut!: Phaser.GameObjects.Image;
  private worker!: WorkerSprite | null;
  private hasHut: boolean = false;
  
  // Navigation
  private targetPosition: Phaser.Math.Vector2 | null = null;
  private isMoving: boolean = false;
  
  // Animation Properties
  private walkTween: Phaser.Tweens.Tween | null = null;
  private isWalkingAnim: boolean = false;
  private snowEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Game State
  private woodCount: number = 0;
  private meatCount: number = 0;
  private temperature: number = 100;
  private maxTemperature: number = 100;
  private furnaceLevel: number = 1;
  private burnRateModifier: number = 1.0;
  
  // Costs
  private upgradeCost: number = 10;
  private spearCost: number = 50;
  private hutCost: number = 100;
  
  // UI
  private tempText!: Phaser.GameObjects.Text;
  private woodText!: Phaser.GameObjects.Text;
  private meatText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  
  // Buttons
  private upgradeBtn!: Phaser.GameObjects.Container;
  private spearBtn!: Phaser.GameObjects.Container;
  private hutBtn!: Phaser.GameObjects.Container;
  
  // Logic
  private tempDecayEvent!: Phaser.Time.TimerEvent;
  private currentHarvestTimer: Phaser.Time.TimerEvent | null = null;
  private harvestingTree: Phaser.GameObjects.GameObject | null = null;
  private isGameOver: boolean = false;

  constructor() {
    super('MainScene');
  }

  preload() {
    this.createPlayerTexture();
    this.createTreeTexture();
    this.createFurnaceTexture();
    this.createBearTexture();
    
    // New Textures
    this.createSpearTexture();
    this.createMeatTexture();
    this.createHutTexture();
    this.createWorkerTexture();

    // Create Snow Particle Texture
    const g = this.make.graphics({x:0,y:0});
    g.fillStyle(0xFFFFFF); g.fillCircle(2,2,2);
    g.generateTexture('snow_particle', 4, 4);
  }

  create() {
    this.initGameValues();

    // 1. World Setup
    const centerX = 400;
    const centerY = 300;
    
    // Furnace Glow
    const furnaceGlow = this.add.circle(centerX, centerY, 100, 0xffaa00, 0.2);
    this.tweens.add({ targets: furnaceGlow, alpha: 0.1, duration: 1000, yoyo: true, repeat: -1 });

    this.furnace = this.physics.add.staticImage(centerX, centerY, 'furnace');
    this.furnace.setCircle(30, 2, 2);

    this.trees = this.physics.add.staticGroup();
    this.spawnTrees(5, true);

    this.meatGroup = this.physics.add.group();

    // 2. Player Setup
    this.player = this.physics.add.sprite(100, 100, 'player');
    this.player.setCollideWorldBounds(true);
    // Adjusted hit box for new texture
    this.player.setBodySize(24, 24);
    this.player.setOffset(4, 8); 
    this.player.setDepth(5);

    // Spear (Visual, attached to player logic in update)
    this.spear = this.add.sprite(100, 100, 'spear');
    this.spear.setOrigin(0, 0.5); // Pivot at handle
    this.spear.setVisible(false);
    this.spear.setDepth(4);

    // Footstep Particles
    this.snowEmitter = this.add.particles(0, 0, 'snow_particle', {
        lifespan: 300,
        speed: { min: 10, max: 20 },
        scale: { start: 1, end: 0 },
        alpha: { start: 0.8, end: 0 },
        gravityY: 0,
        emitting: false
    });
    this.snowEmitter.setDepth(1);

    // 3. Fog of War
    this.fogWall = this.add.rectangle(650, 300, 300, 600, 0x000000, 0.95).setDepth(10);
    const wallBody = this.add.rectangle(500, 300, 10, 600, 0xff0000, 0);
    this.physics.add.existing(wallBody, true);
    this.fogCollider = wallBody.body as Phaser.Physics.Arcade.StaticBody;
    this.physics.add.collider(this.player, wallBody);

    // 4. Input
    this.input.on('pointerdown', this.handlePointerDown, this);
    if (this.input.keyboard) {
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    // 5. UI
    this.createUI(centerX, centerY);

    // 6. Loop
    this.tempDecayEvent = this.time.addEvent({
      delay: 1000,
      callback: this.decayTemperature,
      callbackScope: this,
      loop: true
    });
  }

  update(time: number, delta: number) {
    if (this.isGameOver) return;

    // Movement Logic
    if (this.isMoving && this.targetPosition) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.targetPosition.x, this.targetPosition.y);
      if (distance < 4) {
        this.player.body.reset(this.targetPosition.x, this.targetPosition.y);
        this.isMoving = false;
        this.targetPosition = null;
        this.player.setVelocity(0);
      }
    }

    // Visual Flip Logic (Eskimo Style)
    if (this.player.body.velocity.x < -10) {
        this.player.setFlipX(true);
    } else if (this.player.body.velocity.x > 10) {
        this.player.setFlipX(false);
    }

    // Animation: Walk "Bob" Effect
    const velocity = this.player.body.velocity.length();
    if (velocity > 10 && !this.isWalkingAnim) {
        this.startWalkAnimation();
    } else if (velocity <= 10 && this.isWalkingAnim) {
        this.stopWalkAnimation();
    }

    // Spear Positioning & Hit Detection
    if (this.hasSpear) {
      this.spear.setVisible(true);
      // Attach to player side (account for flip)
      const flipOffset = this.player.flipX ? -6 : 6;
      this.spear.setPosition(this.player.x + flipOffset, this.player.y + 8); 
      
      // Rotate towards mouse for aiming
      const activePointer = this.input.activePointer;
      const angleToPointer = Phaser.Math.Angle.Between(this.spear.x, this.spear.y, activePointer.x, activePointer.y);
      this.spear.setRotation(angleToPointer);
      
      // Attack Logic
      if (this.spaceKey.isDown && this.canAttack && !this.isAttacking) {
        this.performAttack();
      }

      // Continuous Hit Check during attack frames
      if (this.isAttacking && !this.hasHitTarget) {
        this.checkCombatHit();
      }
    }

    // Worker AI
    if (this.worker && this.worker.active) {
      this.worker.updateAI(delta);
    }

    // Bear AI
    if (this.bear && this.bear.active) {
        this.bear.updateAI(delta);

        // Kill worker collision
        if (this.worker && this.worker.active) {
            this.physics.overlap(this.bear, this.worker, () => {
                this.worker?.destroy();
                this.worker = null;
                this.statusText.setText("WORKER KILLED!");
                this.checkButtonsVisibility();
            });
        }
    }

    // Interactions
    if (!this.isMoving && !this.isGameOver) {
      this.checkTreeInteraction();
      this.checkFurnaceInteraction();
    }
    this.physics.overlap(this.player, this.meatGroup, this.collectMeat, undefined, this);
    
    // UI Updates
    this.tempText.setText(`Temp: ${Math.floor(this.temperature)}%`);
    this.woodText.setText(`Wood: ${this.woodCount}`);
    this.meatText.setText(`Meat: ${this.meatCount}`);
    this.checkButtonsVisibility();
  }

  // --- Animation Helpers ---
  private startWalkAnimation() {
    this.isWalkingAnim = true;
    this.walkTween = this.tweens.add({
        targets: this.player,
        scaleY: 0.9, // Less extreme squash for the new sprite
        scaleX: 1.1,
        y: '+=2',
        duration: 150,
        yoyo: true,
        repeat: -1,
        onYoyo: () => {
             this.snowEmitter.emitParticleAt(this.player.x, this.player.y + 16, 2);
        }
    });
  }

  private stopWalkAnimation() {
    this.isWalkingAnim = false;
    if (this.walkTween) {
        this.walkTween.stop();
        this.walkTween = null;
    }
    this.player.setScale(1);
  }

  // --- Actions ---

  private performAttack() {
    this.isAttacking = true;
    this.canAttack = false;
    this.hasHitTarget = false; // Reset hit flag

    // Tween Spear forward
    const angle = this.spear.rotation;
    this.tweens.add({
      targets: this.spear,
      x: this.spear.x + Math.cos(angle) * 20,
      y: this.spear.y + Math.sin(angle) * 20,
      duration: 150,
      yoyo: true,
      onComplete: () => {
        this.isAttacking = false;
        // Cooldown
        this.time.delayedCall(400, () => { this.canAttack = true; });
      }
    });
  }

  private checkCombatHit() {
    if (this.bear && this.bear.active) {
      // Manual distance check from spear tip
      const angle = this.spear.rotation;
      const tipX = this.spear.x + Math.cos(angle) * 32;
      const tipY = this.spear.y + Math.sin(angle) * 32;
      
      const dist = Phaser.Math.Distance.Between(tipX, tipY, this.bear.x, this.bear.y);
      if (dist < 40) {
        this.damageBear();
        this.hasHitTarget = true; 
      }
    }
  }

  private damageBear() {
    if (!this.bear) return;
    
    this.bearHP--;
    this.cameras.main.shake(100, 0.005);
    this.bear.setTint(0xff0000);
    this.time.delayedCall(200, () => this.bear?.clearTint());

    // Knockback Bear away from spear
    const angle = this.spear.rotation;
    this.bear.body.velocity.x += Math.cos(angle) * 250;
    this.bear.body.velocity.y += Math.sin(angle) * 250;

    if (this.bearHP <= 0) {
      this.killBear();
    }
  }

  private killBear() {
    if (!this.bear) return;
    
    const x = this.bear.x;
    const y = this.bear.y;

    // Blood Splatter
    const bloodEmitter = this.add.particles(x, y, 'meat', {
        lifespan: 600,
        speed: { min: 50, max: 150 },
        scale: { start: 0.4, end: 0 },
        gravityY: 100,
        tint: 0x8a0303,
        emitting: false
    });
    bloodEmitter.explode(15);

    // Drop Meat
    const meat = this.meatGroup.create(x, y, 'meat') as Phaser.Physics.Arcade.Sprite;
    meat.setScale(0); 
    
    this.tweens.add({
        targets: meat,
        scale: 1,
        y: y - 25,
        duration: 300,
        ease: 'Back.out',
        onComplete: () => {
            this.tweens.add({
                targets: meat,
                y: y,
                duration: 200,
                ease: 'Bounce.out',
                onComplete: () => {
                     this.tweens.add({ 
                        targets: meat, 
                        y: meat.y - 5, 
                        duration: 800, 
                        yoyo: true, 
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            });
        }
    });

    this.time.delayedCall(1000, () => bloodEmitter.destroy());

    this.bear.destroy();
    this.bear = null;
    this.statusText.setText("BEAR SLAIN!");

    this.time.delayedCall(30000, () => this.spawnBear());
  }

  private collectMeat(player: any, meat: any) {
    meat.destroy();
    this.meatCount++;
    this.statusText.setText("Collected Meat!");
    this.time.delayedCall(1000, () => this.statusText.setText(''));
  }

  // --- Automation Logic ---

  public getClosestTree(x: number, y: number): Phaser.GameObjects.GameObject | null {
    let closest: Phaser.GameObjects.GameObject | null = null;
    let minMsg = 99999;
    this.trees.children.iterate((tree) => {
        if (!tree.active) return true;
        const d = Phaser.Math.Distance.Between(x, y, (tree as any).x, (tree as any).y);
        if (d < minMsg) {
            minMsg = d;
            closest = tree;
        }
        return true;
    });
    return closest;
  }

  public getFurnace() {
    return this.furnace;
  }

  public addWood(amount: number) {
    this.woodCount += amount;
  }

  public depositWorkerWood() {
    this.temperature = Math.min(this.maxTemperature, this.temperature + 15);
  }

  public triggerTreeRespawn() {
    this.time.delayedCall(2000, () => {
        const isUnlocked = this.furnaceLevel >= 2;
        this.spawnTrees(1, !isUnlocked);
    });
  }

  // --- Setup Helpers ---

  private initGameValues() {
    this.isGameOver = false;
    this.woodCount = 0;
    this.meatCount = 0;
    this.temperature = 100;
    this.furnaceLevel = 1;
    this.hasSpear = false;
    this.hasHitTarget = false;
    this.hasHut = false;
    this.worker = null;
    this.bearHP = 3;
    this.burnRateModifier = 1.0;
    this.isWalkingAnim = false;
  }

  private createUI(cx: number, cy: number) {
    const textStyle = { font: '20px Arial', color: '#000000', fontStyle: 'bold' };
    this.tempText = this.add.text(16, 16, 'Temp: 100%', textStyle);
    this.woodText = this.add.text(16, 46, 'Wood: 0', textStyle);
    this.meatText = this.add.text(16, 76, 'Meat: 0', { ...textStyle, color: '#aa0000' });
    this.levelText = this.add.text(16, 106, 'Furnace Lv: 1', textStyle);
    this.statusText = this.add.text(cx, 100, '', { ...textStyle, color: '#333' }).setOrigin(0.5);

    this.upgradeBtn = this.createButton(cx, cy + 60, 'Upgrade (10)', 0x2ecc71, () => this.upgradeFurnace());
    this.spearBtn = this.createButton(cx + 200, cy + 200, 'Craft Spear (50)', 0x3498db, () => this.craftSpear());
    this.hutBtn = this.createButton(cx - 200, cy + 100, 'Build Hut (100)', 0xf1c40f, () => this.buildHut());

    this.spearBtn.setVisible(false);
    this.hutBtn.setVisible(false);
  }

  private createButton(x: number, y: number, label: string, color: number, callback: () => void) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 160, 40, color).setStrokeStyle(2, 0xffffff);
    const text = this.add.text(0, 0, label, { fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    container.add([bg, text]);
    container.setSize(160, 40);
    container.setInteractive(new Phaser.Geom.Rectangle(-80, -20, 160, 40), Phaser.Geom.Rectangle.Contains);
    container.on('pointerdown', (p: any, lx: any, ly: any, e: any) => {
        if (e) e.stopPropagation();
        callback();
    });
    return container;
  }

  private checkButtonsVisibility() {
    if (this.isGameOver) {
        this.upgradeBtn.setVisible(false);
        this.spearBtn.setVisible(false);
        this.hutBtn.setVisible(false);
        return;
    }

    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.furnace.x, this.furnace.y);
    const nearFurnace = dist < 120;
    
    if (this.furnaceLevel < 2 && nearFurnace && this.woodCount >= this.upgradeCost) {
        this.upgradeBtn.setVisible(true);
    } else {
        this.upgradeBtn.setVisible(false);
    }

    if (this.furnaceLevel >= 2 && !this.hasSpear) {
        this.spearBtn.setVisible(true);
        const txt = this.spearBtn.list[1] as Phaser.GameObjects.Text;
        const bg = this.spearBtn.list[0] as Phaser.GameObjects.Rectangle;
        if (this.woodCount < this.spearCost) {
            bg.setFillStyle(0x7f8c8d);
            this.spearBtn.disableInteractive();
        } else {
            bg.setFillStyle(0x3498db);
            this.spearBtn.setInteractive(new Phaser.Geom.Rectangle(-80, -20, 160, 40), Phaser.Geom.Rectangle.Contains);
        }
    } else {
        this.spearBtn.setVisible(false);
    }

    if (this.furnaceLevel >= 2) {
        this.hutBtn.setVisible(true);
        const txt = this.hutBtn.list[1] as Phaser.GameObjects.Text;
        const bg = this.hutBtn.list[0] as Phaser.GameObjects.Rectangle;
        
        if (!this.hasHut) {
             txt.setText(`Build Hut (${this.hutCost})`);
             if (this.woodCount < this.hutCost) {
                 bg.setFillStyle(0x7f8c8d);
                 this.hutBtn.disableInteractive();
             } else {
                 bg.setFillStyle(0xf1c40f);
                 this.hutBtn.setInteractive(new Phaser.Geom.Rectangle(-80, -20, 160, 40), Phaser.Geom.Rectangle.Contains);
             }
        } else if (!this.worker) {
             txt.setText(`Hire Worker (50)`);
             if (this.woodCount < 50) {
                 bg.setFillStyle(0x7f8c8d);
                 this.hutBtn.disableInteractive();
             } else {
                 bg.setFillStyle(0xf39c12);
                 this.hutBtn.setInteractive(new Phaser.Geom.Rectangle(-80, -20, 160, 40), Phaser.Geom.Rectangle.Contains);
             }
        } else {
            this.hutBtn.setVisible(false);
        }
    } else {
        this.hutBtn.setVisible(false);
    }
  }

  // --- Button Handlers ---

  private upgradeFurnace() {
    this.woodCount -= this.upgradeCost;
    this.furnaceLevel++;
    this.burnRateModifier = 0.5;
    this.furnace.setScale(1.5);
    this.furnace.body.updateFromGameObject();
    this.statusText.setText("FURNACE UPGRADED!");
    this.cameras.main.flash(500, 255, 255, 255);
    
    this.tweens.add({ targets: this.fogWall, alpha: 0, duration: 2000, onComplete: () => this.fogWall.destroy() });
    this.fogCollider.enable = false;
    this.spawnBear();
    this.spawnTrees(5, false);
  }

  private craftSpear() {
    if (this.woodCount >= this.spearCost) {
        this.woodCount -= this.spearCost;
        this.hasSpear = true;
        this.statusText.setText("SPEAR EQUIPPED! [SPACE] TO ATTACK");
    }
  }

  private buildHut() {
    if (!this.hasHut) {
        if (this.woodCount >= this.hutCost) {
            this.woodCount -= this.hutCost;
            this.hasHut = true;
            this.hut = this.add.image(300, 350, 'hut');
            this.statusText.setText("HUT BUILT!");
        }
    } else {
        if (this.woodCount >= 50) {
            this.woodCount -= 50;
            this.worker = new WorkerSprite(this, 300, 380);
            this.statusText.setText("WORKER HIRED!");
        }
    }
  }

  // --- Core Game Logic ---

  private handlePointerDown(pointer: Phaser.Input.Pointer, gameObjects: any[]) {
    if (gameObjects.length > 0) return;
    if (this.isGameOver) {
      this.scene.restart();
      return;
    }
    this.targetPosition = new Phaser.Math.Vector2(pointer.x, pointer.y);
    this.physics.moveToObject(this.player, this.targetPosition, 200);
    this.isMoving = true;
    
    // Rotation removed for flip logic
    this.cancelHarvesting();
  }

  private spawnTrees(count: number, safeZoneOnly: boolean) {
    for (let i = 0; i < count; i++) {
      let x, y, dist;
      let attempts = 0;
      do {
        attempts++;
        const minX = safeZoneOnly ? 50 : (Math.random() > 0.5 ? 550 : 50);
        const maxX = safeZoneOnly ? 480 : 750;
        x = Phaser.Math.Between(minX, maxX);
        y = Phaser.Math.Between(50, 550);
        dist = Phaser.Math.Distance.Between(x, y, this.furnace.x, this.furnace.y);
      } while (dist < 150 && attempts < 50);

      const tree = this.trees.create(x, y, 'tree') as Phaser.Physics.Arcade.Sprite;
      tree.setImmovable(true);
      tree.setBodySize(20, 20);
      tree.setOffset(10, 28);
    }
  }

  private spawnBear() {
      // Logic moved to BearSprite class but triggered here
      let x = 700;
      let y = 300;
      
      // Attempt safe spawn
      let attempts = 0;
      let safeSpawn = false;
      do {
         attempts++;
         x = Phaser.Math.Between(550, 750);
         y = Phaser.Math.Between(50, 550);
         const distToPlayer = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
         if (distToPlayer > 250) safeSpawn = true;
      } while(!safeSpawn && attempts < 10);

      this.bear = new BearSprite(this, x, y);
      
      this.bearHP = 3;
      this.physics.add.overlap(this.player, this.bear, this.hitPlayerBear, undefined, this);
  }

  private hitPlayerBear(player: any, bear: any) {
      if (this.woodCount > 0) {
          this.statusText.setText("BEAR ATTACK! LOST WOOD!");
          this.woodCount = 0;
          this.cameras.main.shake(200, 0.01);
          
          const angle = Phaser.Math.Angle.Between(bear.x, bear.y, player.x, player.y);
          player.body.reset(player.x + Math.cos(angle) * 80, player.y + Math.sin(angle) * 80);
          this.targetPosition = null;
          this.isMoving = false;
          
          player.setTint(0xff0000);
          this.time.delayedCall(300, () => player.clearTint());
      }
  }

  private checkTreeInteraction() {
    let closestTree: Phaser.Physics.Arcade.Sprite | null = null;
    let closestDist = 9999;
    this.trees.children.iterate((child) => {
      const tree = child as Phaser.Physics.Arcade.Sprite;
      if (!tree.active) return true;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, tree.x, tree.y);
      if (dist < closestDist) { closestDist = dist; closestTree = tree; }
      return true;
    });

    if (closestTree && closestDist < 60) {
      if (this.harvestingTree !== closestTree) this.startHarvesting(closestTree);
    } else {
      this.cancelHarvesting();
    }
  }

  private startHarvesting(tree: Phaser.GameObjects.GameObject) {
    this.cancelHarvesting();
    this.harvestingTree = tree;
    this.statusText.setText('Harvesting...');
    this.currentHarvestTimer = this.time.delayedCall(1000, () => this.completeHarvest(tree));
  }

  private cancelHarvesting() {
    if (this.currentHarvestTimer) { this.currentHarvestTimer.remove(); this.currentHarvestTimer = null; }
    this.harvestingTree = null;
    if (this.statusText.text === 'Harvesting...') this.statusText.setText('');
  }

  private completeHarvest(tree: Phaser.GameObjects.GameObject) {
    if (!tree.active) return;
    tree.destroy();
    this.woodCount++;
    this.statusText.setText('+1 Wood!');
    this.harvestingTree = null;
    this.triggerTreeRespawn();
  }

  private checkFurnaceInteraction() {
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.furnace.x, this.furnace.y);
    if (dist < 80) {
        if (this.meatCount > 0) {
            const heat = this.meatCount * 50;
            this.temperature = Math.min(this.maxTemperature, this.temperature + heat);
            this.statusText.setText(`Deposited Meat! +${heat}% Temp`);
            this.meatCount = 0;
        }
        else if (this.woodCount > 0) {
             const savingForUpgrade = this.furnaceLevel < 2 && this.woodCount >= this.upgradeCost && dist < 120;
             if (!savingForUpgrade) {
                const fuelAmount = this.woodCount * 10;
                this.temperature = Math.min(this.maxTemperature, this.temperature + fuelAmount);
                this.statusText.setText(`Deposited ${this.woodCount} Wood!`);
                this.woodCount = 0;
             }
        }
    }
  }

  private decayTemperature() {
    if (this.isGameOver) return;
    this.temperature -= (1 * this.burnRateModifier);
    if (this.temperature <= 0) { this.temperature = 0; this.gameOver(); }
  }

  private gameOver() {
    this.isGameOver = true;
    this.physics.pause();
    this.player.setTint(0x888888);
    const { width, height } = this.scale;
    this.add.rectangle(width/2, height/2, 400, 200, 0x000000, 0.8).setDepth(20);
    this.add.text(width/2, height/2 - 20, 'THE FIRE HAS DIED', { font: '32px Arial', color: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5).setDepth(21);
    this.add.text(width/2, height/2 + 30, 'Click anywhere to Restart', { font: '16px Arial', color: '#ffffff' }).setOrigin(0.5).setDepth(21);
    if (this.tempDecayEvent) this.tempDecayEvent.remove();
  }

  // --- Texture Generators ---
  private createPlayerTexture() {
    const g = this.make.graphics({x:0,y:0});
    
    // Draw Eskimo Style Sprite (32x32)
    // Parka Body
    g.fillStyle(0x3498db); // Blue
    g.fillRoundedRect(4, 8, 24, 20, 8); 
    
    // White Fur Trim (Vertical)
    g.fillStyle(0xecf0f1); 
    g.fillRect(14, 8, 4, 20);
    g.fillRect(4, 24, 24, 4); // Bottom trim

    // Head/Hood
    g.fillStyle(0xecf0f1); // White Hood
    g.fillCircle(16, 10, 10);
    g.fillStyle(0x2c3e50); // Dark inner hood
    g.fillCircle(16, 10, 8);
    g.fillStyle(0xe67e22); // Face (Skin tone)
    g.fillCircle(16, 11, 5);

    // Boots
    g.fillStyle(0x5d4037);
    g.fillEllipse(10, 30, 8, 6);
    g.fillEllipse(22, 30, 8, 6);

    g.generateTexture('player', 32, 32);
  }
  private createTreeTexture() {
    const g = this.make.graphics({x:0,y:0});
    g.fillStyle(0x5D4037); g.fillRect(16,38,8,10);
    g.fillStyle(0x2E7D32); g.fillTriangle(20,10,2,40,38,40); g.fillTriangle(20,0,6,28,34,28); g.fillTriangle(20,-10,10,16,30,16);
    g.fillStyle(0xE0F7FA); g.beginPath(); g.moveTo(20,-10); g.lineTo(15,0); g.lineTo(25,0); g.closePath(); g.fill();
    g.generateTexture('tree', 40, 48);
  }
  private createFurnaceTexture() {
    const g = this.make.graphics({x:0,y:0});
    g.fillStyle(0x616161); g.fillCircle(32,32,30); g.fillStyle(0x212121); g.fillCircle(32,32,24);
    g.fillStyle(0xD32F2F); g.fillCircle(32,34,10); g.fillStyle(0xFF9800); g.fillTriangle(32,10,22,36,42,36);
    g.fillStyle(0xFFEB3B); g.fillTriangle(32,20,28,36,36,36);
    g.generateTexture('furnace', 64, 64);
  }
  private createBearTexture() {
    const g = this.make.graphics({x:0,y:0});
    g.fillStyle(0xF5F5F5); g.fillCircle(20,20,18); g.fillCircle(10,8,6); g.fillCircle(30,8,6);
    g.fillStyle(0xE0E0E0); g.fillEllipse(20,26,12,10); g.fillStyle(0x212121); g.fillCircle(20,24,3);
    g.fillCircle(14,18,2); g.fillCircle(26,18,2);
    g.generateTexture('bear', 40, 40);
  }
  private createSpearTexture() {
    const g = this.make.graphics({x:0,y:0});
    g.fillStyle(0x8D6E63); g.fillRect(0,3,32,2); // Shaft
    g.fillStyle(0xBDC3C7); g.fillTriangle(32,4, 28,1, 28,7); // Tip
    g.generateTexture('spear', 34, 8);
  }
  private createMeatTexture() {
    const g = this.make.graphics({x:0,y:0});
    g.fillStyle(0xC0392B); g.fillCircle(8,8,8); g.fillStyle(0xE74C3C); g.fillCircle(6,6,3);
    g.generateTexture('meat', 16, 16);
  }
  private createHutTexture() {
    const g = this.make.graphics({x:0,y:0});
    g.fillStyle(0x795548); g.fillRect(4,20,32,20); // Base
    g.fillStyle(0x8D6E63); g.fillTriangle(20,0, 0,20, 40,20); // Roof
    g.fillStyle(0x3E2723); g.fillRect(16,30,8,10); // Door
    g.generateTexture('hut', 40, 40);
  }
  private createWorkerTexture() {
    const g = this.make.graphics({x:0,y:0});
    g.fillStyle(0xF1C40F); g.fillRect(0,0,20,20); // Yellow body
    g.lineStyle(2, 0x000000); g.strokeRect(0,0,20,20);
    g.generateTexture('worker', 20, 20);
  }
}