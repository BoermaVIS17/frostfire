import Phaser from 'phaser';
import Player from '../entities/Player';
import FloatingText from '../utils/FloatingText';
import ParticleEffects from '../utils/ParticleEffects';
import SaveManager, { GameSaveData } from '../utils/SaveManager';
import BlizzardManager from '../utils/BlizzardManager';
import StoneRock from '../entities/StoneRock';
import QuarryWorker from '../entities/QuarryWorker';
import MapManager from '../systems/MapManager';
import UIManager from '../systems/UIManager';
import PlayerController from '../entities/PlayerController';
import MobManager from '../systems/MobManager';

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
  private player!: Player;
  private furnace!: Phaser.Physics.Arcade.Image;
  private trees!: Phaser.Physics.Arcade.StaticGroup;
  private bear!: BearSprite | null;
  private fogWall!: Phaser.GameObjects.Rectangle;
  private fogCollider!: Phaser.Physics.Arcade.StaticBody;
  private meatGroup!: Phaser.Physics.Arcade.Group;
  private stonesGroup!: Phaser.Physics.Arcade.StaticGroup;
  private snowPilesGroup!: Phaser.Physics.Arcade.Group;
  private igloos!: Phaser.GameObjects.Image[];
  private quarry!: Phaser.GameObjects.Image | null;
  private blizzardOverlay!: Phaser.GameObjects.Image;

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

  // Game State
  private woodCount: number = 0;
  private meatCount: number = 0;
  private snowCount: number = 0;
  private stoneCount: number = 0;
  private temperature: number = 100;
  private maxTemperature: number = 100;
  private furnaceLevel: number = 1;
  private burnRateModifier: number = 1.0;
  
  // Costs
  private upgradeCost: number = 10;
  private spearCost: number = 50;
  private hutCost: number = 100;
  private iglooCost: number = 10;
  
  // UI
  private tempText!: Phaser.GameObjects.Text;
  private woodText!: Phaser.GameObjects.Text;
  private meatText!: Phaser.GameObjects.Text;
  private snowText!: Phaser.GameObjects.Text;
  private stoneText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  
  // Buttons
  private upgradeBtn!: Phaser.GameObjects.Container;
  private spearBtn!: Phaser.GameObjects.Container;
  private hutBtn!: Phaser.GameObjects.Container;
  private iglooBtn!: Phaser.GameObjects.Container;
  private placingIgloo: boolean = false;
  
  // Logic
  private tempDecayEvent!: Phaser.Time.TimerEvent;
  private currentHarvestTimer: Phaser.Time.TimerEvent | null = null;
  private harvestingTree: Phaser.GameObjects.GameObject | null = null;
  private isGameOver: boolean = false;

  // Save System & Progression
  private autoSaveTimer!: Phaser.Time.TimerEvent;
  private daysSurvived: number = 0;
  private totalWoodGathered: number = 0;
  private totalMeatCollected: number = 0;
  private bearsKilled: number = 0;
  private playTimeSeconds: number = 0;
  private dayTimer: number = 0;
  private saveBtn!: Phaser.GameObjects.Container;
  private statsText!: Phaser.GameObjects.Text;

  // Blizzard System
  private blizzardManager!: BlizzardManager;
  private stokeFireBtn!: Phaser.GameObjects.Container;
  private stokeFireClicks: number = 0;
  private readonly STOKE_CLICKS_NEEDED = 10;

  constructor() {
    super('MainScene');
  }

  preload() {
    // Load all real PNG assets
    // Map Assets
    this.load.image('tree', 'assets/tree1.png');
    this.load.image('quarry', 'assets/quarry.png');
    this.load.image('stone', 'assets/rock.png');
    this.load.image('snow_pile', 'assets/snow_pile.png');
    this.load.image('igloo', 'assets/igloo.png.png');
    this.load.image('hut', 'assets/hut_wood.png');
    this.load.image('blizzard_overlay', 'assets/Blizzard.png');
    
    // Player Assets
    this.load.image('player_idle', 'assets/player_idle.png');
    this.load.image('player_run_right', 'assets/player_run_right.png');
    this.load.image('player_run_left', 'assets/player_run_left.png');
    this.load.image('player_run_up', 'assets/player_run_up_right.png');
    this.load.image('player_run_up_right', 'assets/player_run_up_right.png');
    this.load.image('player_run_up_left', 'assets/player_run_up_left.png');
    
    // Other Assets (keep these for now - will use generated textures if no PNG available)
    this.createFurnaceTexture();
    this.createBearTexture();
    this.createSpearTexture();
    this.createMeatTexture();
    this.createWorkerTexture();
    this.createSnowParticleTexture();
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
    this.stonesGroup = this.physics.add.staticGroup();
    this.snowPilesGroup = this.physics.add.group();
    this.igloos = [];
    this.quarry = null;

    // Spawn stone resources
    this.spawnStones(3);

    // Spawn snow piles
    this.spawnSnowPiles(Phaser.Math.Between(5, 10));

    // Create blizzard overlay (initially hidden)
    this.blizzardOverlay = this.add.image(400, 300, 'blizzard_overlay');
    this.blizzardOverlay.setDisplaySize(800, 600);
    this.blizzardOverlay.setAlpha(0);
    this.blizzardOverlay.setDepth(15);

    // 2. Player Setup
    this.player = new Player(this, 100, 100);
    
    // Create player animations
    this.createPlayerAnimations();

    // Spear (Visual, attached to player logic in update)
    this.spear = this.add.sprite(100, 100, 'spear');
    this.spear.setOrigin(0, 0.5); // Pivot at handle
    this.spear.setVisible(false);
    this.spear.setDepth(4);


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

    // Player event listeners
    this.events.on('player-gather', this.handlePlayerGather, this);
    this.events.on('player-attack', this.handlePlayerAttack, this);

    // 5. UI
    this.createUI(centerX, centerY);

    // 6. Loop
    this.tempDecayEvent = this.time.addEvent({
      delay: 1000,
      callback: this.decayTemperature,
      callbackScope: this,
      loop: true
    });

    // 7. Auto-save system
    this.autoSaveTimer = this.time.addEvent({
      delay: SaveManager.getAutoSaveInterval(),
      callback: this.autoSave,
      callbackScope: this,
      loop: true
    });

    // 8. Day counter (60 seconds = 1 day)
    this.time.addEvent({
      delay: 60000,
      callback: this.incrementDay,
      callbackScope: this,
      loop: true
    });

    // 9. Play time tracker
    this.time.addEvent({
      delay: 1000,
      callback: () => { this.playTimeSeconds++; },
      callbackScope: this,
      loop: true
    });

    // 10. Try to load saved game
    this.loadGameState();

    // 11. Initialize Blizzard System
    this.blizzardManager = new BlizzardManager(this);
    
    // Create Stoke Fire button (hidden until blizzard)
    this.stokeFireBtn = this.createButton(400, 400, 'STOKE FIRE! (0/10)', 0xFF4500, () => this.stokeFire());
    this.stokeFireBtn.setVisible(false);
    this.stokeFireBtn.setDepth(160);
  }

  update(time: number, delta: number) {
    if (this.isGameOver) return;

    // Update blizzard system
    this.blizzardManager.update(delta);
    this.updateBlizzardUI();

    // Update player (handles WASD/arrow movement and animations)
    this.player.update();

    // Spear Positioning & Hit Detection
    if (this.hasSpear) {
      this.spear.setVisible(true);
      // Attach to player side based on direction
      const dir = this.player.getCurrentDirection();
      let offsetX = 0;
      let offsetY = 0;
      
      if (dir === 'right') offsetX = 15;
      else if (dir === 'left') offsetX = -15;
      else if (dir === 'down') offsetY = 15;
      else if (dir === 'up') offsetY = -15;
      
      this.spear.setPosition(this.player.x + offsetX, this.player.y + offsetY); 
      
      // Rotate towards mouse for aiming
      const activePointer = this.input.activePointer;
      const angleToPointer = Phaser.Math.Angle.Between(this.spear.x, this.spear.y, activePointer.x, activePointer.y);
      this.spear.setRotation(angleToPointer);

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
    this.physics.overlap(this.player, this.meatGroup, this.collectMeat, undefined, this);
    this.physics.overlap(this.player, this.snowPilesGroup, this.collectSnowPile, undefined, this);
    
    // Quarry Deposit Check (using refactored system approach)
    this.checkQuarryDeposit();
    
    // Hut Door Trigger Check (for roof fading - if using refactored MapManager)
    this.checkHutDoorTrigger();
    
    // UI Updates
    this.tempText.setText(`Temp: ${Math.floor(this.temperature)}%`);
    this.woodText.setText(`Wood: ${this.woodCount}`);
    this.meatText.setText(`Meat: ${this.meatCount}`);
    this.snowText.setText(`Snow: ${this.snowCount}`);
    this.stoneText.setText(`Stone: ${this.stoneCount}`);
    this.checkButtonsVisibility();

    // Handle igloo placement mode
    if (this.placingIgloo) {
      this.handleIglooPlacement();
    }

    // Update igloo melting timers
    this.updateIgloos(delta);
  }


  // --- Actions ---

  private handlePlayerAttack(targetX: number, targetY: number, angle: number) {
    if (!this.hasSpear) return;
    
    this.isAttacking = true;
    this.canAttack = false;
    this.hasHitTarget = false;

    // Tween Spear forward
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

  private handlePlayerGather(playerX: number, playerY: number) {
    // Check for nearby trees
    let closestTree: Phaser.Physics.Arcade.Sprite | null = null;
    let closestDist = 9999;
    
    this.trees.children.iterate((child) => {
      const tree = child as Phaser.Physics.Arcade.Sprite;
      if (!tree.active) return true;
      const dist = Phaser.Math.Distance.Between(playerX, playerY, tree.x, tree.y);
      if (dist < closestDist) { 
        closestDist = dist; 
        closestTree = tree; 
      }
      return true;
    });

    if (closestTree && closestDist < 60) {
      // Add wood chip particles
      ParticleEffects.createWoodChips(this, closestTree.x, closestTree.y);
      
      // Complete harvest with juice
      this.completeHarvest(closestTree);
    } else {
      this.statusText.setText('No tree nearby!');
      this.time.delayedCall(1000, () => this.statusText.setText(''));
    }
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
    
    const damage = 1;
    this.bearHP--;
    
    // Blood splatter particles
    ParticleEffects.createBloodSplatter(this, this.bear.x, this.bear.y);
    
    // Damage number
    FloatingText.createDamage(this, this.bear.x, this.bear.y - 20, damage);
    
    // Enhanced screen shake
    this.cameras.main.shake(150, 0.008);
    
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

    // Track bear kills
    this.bearsKilled++;
    this.checkAchievements();

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
    // Sparkle effect when collecting
    ParticleEffects.createSparkle(this, meat.x, meat.y);
    
    // Floating text
    FloatingText.createResource(this, meat.x, meat.y - 20, 1, 'Meat', '#DC143C');
    
    meat.destroy();
    this.meatCount++;
    this.totalMeatCollected++;
    this.statusText.setText("Collected Meat!");
    this.time.delayedCall(1000, () => this.statusText.setText(''));
  }

  private collectSnowPile(player: any, snowPile: any) {
    // Sparkle effect when collecting
    ParticleEffects.createSparkle(this, snowPile.x, snowPile.y);
    
    // Floating text
    FloatingText.createResource(this, snowPile.x, snowPile.y - 20, 1, 'Snow', '#00BFFF');
    
    snowPile.destroy();
    this.snowCount++;
    this.statusText.setText("Collected Snow!");
    this.time.delayedCall(1000, () => this.statusText.setText(''));
  }

  private checkQuarryDeposit() {
    // Note: This is a temporary bridge method for the old MainScene structure
    // In the refactored version, this would be handled by PlayerController and UIManager
    // For now, we'll check if there's a quarry object (from old code or new MapManager)
    
    // Try to find quarry - could be from old code or new MapManager
    const quarryX = 650;
    const quarryY = 450;
    const depositRange = 80;
    
    const distToQuarry = Phaser.Math.Distance.Between(this.player.x, this.player.y, quarryX, quarryY);
    
    if (distToQuarry < depositRange) {
      // Check if player has any resources to deposit
      const hasResources = this.woodCount > 0 || this.stoneCount > 0 || this.meatCount > 0;
      
      if (hasResources) {
        // Show deposit prompt (could be triggered by key press in full implementation)
        // For now, auto-deposit when near quarry
        const totalItems = this.woodCount + this.stoneCount + this.meatCount;
        
        if (totalItems > 0) {
          // Visual feedback
          ParticleEffects.createSparkle(this, quarryX, quarryY);
          FloatingText.create(this, quarryX, quarryY - 30, 'Resources Deposited!', '#FFD700', 24);
          
          // Deposit resources (this would update town stash in full refactor)
          this.statusText.setText(`Deposited: ${this.woodCount}W ${this.stoneCount}S ${this.meatCount}M`);
          
          // Reset player inventory
          this.woodCount = 0;
          this.stoneCount = 0;
          this.meatCount = 0;
          
          this.time.delayedCall(2000, () => this.statusText.setText(''));
        }
      }
    }
  }

  private checkHutDoorTrigger() {
    // This method bridges to the refactored MapManager's hut interior system
    // Note: This assumes MapManager has been instantiated with the hut interior
    // In the old MainScene structure, we don't have direct access to MapManager
    // So we'll check manually for now
    
    // Door trigger position (matches MapManager's createHutWithInterior)
    const doorX = 300;
    const doorY = 380; // 300 + 80
    const triggerRange = 40;
    
    const distToTrigger = Phaser.Math.Distance.Between(this.player.x, this.player.y, doorX, doorY);
    const isOverlapping = distToTrigger < triggerRange;
    
    // If using the refactored MapManager, call its update method
    // For now, we'll handle it here as a bridge
    // Note: When fully refactored, this would be: mapManager.updateHutRoofFading(isOverlapping);
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
    this.snowCount = 0;
    this.stoneCount = 0;
    this.temperature = 100;
    this.furnaceLevel = 1;
    this.hasSpear = false;
    this.hasHitTarget = false;
    this.hasHut = false;
    this.worker = null;
    this.bearHP = 3;
    this.burnRateModifier = 1.0;
    this.placingIgloo = false;
  }

  private createUI(cx: number, cy: number) {
    const textStyle = { font: '20px Arial', color: '#000000', fontStyle: 'bold' };
    this.tempText = this.add.text(16, 16, 'Temp: 100%', textStyle);
    this.woodText = this.add.text(16, 46, 'Wood: 0', textStyle);
    this.meatText = this.add.text(16, 76, 'Meat: 0', { ...textStyle, color: '#aa0000' });
    this.snowText = this.add.text(16, 106, 'Snow: 0', { ...textStyle, color: '#00BFFF' });
    this.stoneText = this.add.text(16, 136, 'Stone: 0', { ...textStyle, color: '#808080' });
    this.levelText = this.add.text(16, 166, 'Furnace Lv: 1', textStyle);
    this.statusText = this.add.text(cx, 100, '', { ...textStyle, color: '#333' }).setOrigin(0.5);

    // Progression stats (top right)
    this.statsText = this.add.text(784, 16, '', { font: '16px Arial', color: '#000000', fontStyle: 'bold', align: 'right' });
    this.statsText.setOrigin(1, 0);
    this.updateStatsDisplay();

    this.upgradeBtn = this.createButton(cx, cy + 60, 'Upgrade (10)', 0x2ecc71, () => this.upgradeFurnace());
    this.spearBtn = this.createButton(cx + 200, cy + 200, 'Craft Spear (50)', 0x3498db, () => this.craftSpear());
    this.hutBtn = this.createButton(cx - 200, cy + 100, 'Build Hut (100)', 0xf1c40f, () => this.buildHut());
    this.iglooBtn = this.createButton(cx, cy + 150, 'Build Igloo (10 Snow)', 0x00CED1, () => this.startIglooPlacement());
    this.saveBtn = this.createButton(cx, cy + 250, 'Save Game', 0x9b59b6, () => this.manualSave());

    this.spearBtn.setVisible(false);
    this.hutBtn.setVisible(false);
    this.iglooBtn.setVisible(false);
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

    if (!this.placingIgloo) {
        this.iglooBtn.setVisible(true);
        const iglooBg = this.iglooBtn.list[0] as Phaser.GameObjects.Rectangle;
        if (this.snowCount < this.iglooCost) {
            iglooBg.setFillStyle(0x7f8c8d);
            this.iglooBtn.disableInteractive();
        } else {
            iglooBg.setFillStyle(0x00CED1);
            this.iglooBtn.setInteractive(new Phaser.Geom.Rectangle(-80, -20, 160, 40), Phaser.Geom.Rectangle.Contains);
        }
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
    
    // Add quarry building
    if (!this.quarry) {
      this.quarry = this.add.image(650, 450, 'quarry');
      this.quarry.setScale(0.8);
      this.quarry.setAlpha(0);
      this.tweens.add({
        targets: this.quarry,
        alpha: 1,
        duration: 2000,
        ease: 'Power2'
      });
    }
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

  private startIglooPlacement() {
    if (this.snowCount >= this.iglooCost) {
      this.placingIgloo = true;
      this.statusText.setText("Click to place Igloo!");
      this.iglooBtn.setVisible(false);
    }
  }

  private handleIglooPlacement() {
    const pointer = this.input.activePointer;
    
    if (pointer.isDown && pointer.leftButtonDown()) {
      const x = pointer.x;
      const y = pointer.y;
      
      this.snowCount -= this.iglooCost;
      this.placingIgloo = false;
      
      const igloo = this.add.image(x, y, 'igloo');
      igloo.setScale(0.8);
      igloo.setData('meltTimer', 0);
      igloo.setData('isActive', true);
      
      this.igloos.push(igloo);
      
      this.statusText.setText("IGLOO BUILT!");
      this.time.delayedCall(1000, () => this.statusText.setText(''));
      
      ParticleEffects.createSparkle(this, x, y);
    }
    
    if (this.input.keyboard && this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).isDown) {
      this.placingIgloo = false;
      this.statusText.setText("Cancelled!");
      this.time.delayedCall(1000, () => this.statusText.setText(''));
    }
  }

  private updateIgloos(delta: number) {
    const isBlizzardActive = this.blizzardManager.isBlizzardActive();
    
    for (let i = this.igloos.length - 1; i >= 0; i--) {
      const igloo = this.igloos[i];
      
      if (!igloo.getData('isActive')) continue;
      
      if (!isBlizzardActive) {
        let meltTimer = igloo.getData('meltTimer') || 0;
        meltTimer += delta;
        igloo.setData('meltTimer', meltTimer);
        
        const meltDuration = 120000;
        if (meltTimer >= meltDuration) {
          ParticleEffects.createSparkle(this, igloo.x, igloo.y);
          FloatingText.create(this, igloo.x, igloo.y - 20, 'Melted!', '#00BFFF', 20);
          igloo.destroy();
          this.igloos.splice(i, 1);
        } else {
          const alphaProgress = 1 - (meltTimer / meltDuration);
          igloo.setAlpha(alphaProgress);
        }
      } else {
        igloo.setData('meltTimer', 0);
        igloo.setAlpha(1);
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
    
    // Click to attack if player has spear
    if (this.hasSpear && this.canAttack && !this.isAttacking) {
      this.player.triggerAttack(pointer.x, pointer.y);
    }
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

  private spawnStones(count: number) {
    for (let i = 0; i < count; i++) {
      let x, y, dist;
      let attempts = 0;
      do {
        attempts++;
        x = Phaser.Math.Between(500, 750);
        y = Phaser.Math.Between(50, 550);
        dist = Phaser.Math.Distance.Between(x, y, this.furnace.x, this.furnace.y);
      } while (dist < 150 && attempts < 50);

      const stone = this.stonesGroup.create(x, y, 'stone') as Phaser.Physics.Arcade.Sprite;
      stone.setImmovable(true);
      stone.setScale(0.8);
    }
  }

  private spawnSnowPiles(count: number) {
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(50, 750);
      const y = Phaser.Math.Between(50, 550);
      
      const snowPile = this.snowPilesGroup.create(x, y, 'snow_pile') as Phaser.Physics.Arcade.Sprite;
      snowPile.setScale(0.6);
      
      this.tweens.add({
        targets: snowPile,
        y: snowPile.y - 3,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
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
          // Impact particles at player position
          ParticleEffects.createImpact(this, player.x, player.y, 0xFF0000);
          
          // Floating text showing wood loss
          FloatingText.create(this, player.x, player.y - 30, '-' + this.woodCount + ' Wood!', '#FF0000', 24);
          
          this.statusText.setText("BEAR ATTACK! LOST WOOD!");
          this.woodCount = 0;
          
          // Enhanced screen shake for damage
          this.cameras.main.shake(300, 0.015);
          
          const angle = Phaser.Math.Angle.Between(bear.x, bear.y, player.x, player.y);
          player.body.reset(player.x + Math.cos(angle) * 80, player.y + Math.sin(angle) * 80);
          
          // Flash red multiple times
          player.setTint(0xff0000);
          this.time.delayedCall(150, () => {
              player.clearTint();
              this.time.delayedCall(150, () => {
                  player.setTint(0xff0000);
                  this.time.delayedCall(150, () => player.clearTint());
              });
          });
      }
  }


  private completeHarvest(tree: Phaser.GameObjects.GameObject) {
    if (!tree.active) return;
    
    const treeX = (tree as any).x;
    const treeY = (tree as any).y;
    
    // Floating text for wood collection
    FloatingText.createResource(this, treeX, treeY - 20, 1, 'Wood', '#8B4513');
    
    tree.destroy();
    this.woodCount++;
    this.totalWoodGathered++;
    this.statusText.setText('+1 Wood!');
    this.harvestingTree = null;
    this.triggerTreeRespawn();
    this.checkAchievements();
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
    
    // Check if player is in shelter during blizzard
    const isInShelter = this.isPlayerInShelter();
    const isBlizzardActive = this.blizzardManager.isBlizzardActive();
    
    // Calculate decay rate
    let decayRate = 1 * this.burnRateModifier;
    
    if (isBlizzardActive) {
      if (isInShelter) {
        // Protected in shelter - normal decay
        decayRate = 1 * this.burnRateModifier;
      } else {
        // Exposed to blizzard - 5x faster decay
        decayRate = 5 * this.burnRateModifier;
      }
    }
    
    this.temperature -= decayRate;
    if (this.temperature <= 0) { this.temperature = 0; this.gameOver(); }
  }

  private gameOver() {
    this.isGameOver = true;
    this.physics.pause();
    this.player.setTint(0x888888);
    
    // Update progression before game over
    this.updateProgression();
    
    // Delete current save (game is over)
    SaveManager.deleteSave();
    
    const { width, height } = this.scale;
    const progression = SaveManager.loadProgression();
    
    // Game Over Screen
    this.add.rectangle(width/2, height/2, 500, 350, 0x000000, 0.9).setDepth(20);
    
    this.add.text(width/2, height/2 - 140, 'THE FIRE HAS DIED', { 
      font: '32px Arial', 
      color: '#ff0000', 
      fontStyle: 'bold' 
    }).setOrigin(0.5).setDepth(21);
    
    // Final Stats
    const stats = [
      `Days Survived: ${this.daysSurvived}`,
      `Wood Gathered: ${this.totalWoodGathered}`,
      `Meat Collected: ${this.totalMeatCollected}`,
      `Bears Defeated: ${this.bearsKilled}`,
      `Play Time: ${SaveManager.formatPlayTime(this.playTimeSeconds)}`,
      '',
      `High Score: ${progression.highScore} days`,
    ];
    
    this.add.text(width/2, height/2 - 40, stats.join('\n'), { 
      font: '18px Arial', 
      color: '#ffffff',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5).setDepth(21);
    
    this.add.text(width/2, height/2 + 130, 'Click anywhere to Restart', { 
      font: '16px Arial', 
      color: '#aaaaaa' 
    }).setOrigin(0.5).setDepth(21);
    
    if (this.tempDecayEvent) this.tempDecayEvent.remove();
    if (this.autoSaveTimer) this.autoSaveTimer.remove();
  }

  // --- Texture Generators (Only for assets without PNG files) ---
  private createSnowParticleTexture() {
    const g = this.make.graphics({x:0,y:0});
    g.fillStyle(0xFFFFFF); g.fillCircle(2,2,2);
    g.generateTexture('snow_particle', 4, 4);
    g.destroy();
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
    g.fillStyle(0x8D6E63); g.fillRect(0,3,32,2);
    g.fillStyle(0xBDC3C7); g.fillTriangle(32,4, 28,1, 28,7);
    g.generateTexture('spear', 34, 8);
  }
  
  private createMeatTexture() {
    const g = this.make.graphics({x:0,y:0});
    g.fillStyle(0xC0392B); g.fillCircle(8,8,8); g.fillStyle(0xE74C3C); g.fillCircle(6,6,3);
    g.generateTexture('meat', 16, 16);
  }
  
  private createWorkerTexture() {
    const g = this.make.graphics({x:0,y:0});
    g.fillStyle(0xF1C40F); g.fillRect(0,0,20,20);
    g.lineStyle(2, 0x000000); g.strokeRect(0,0,20,20);
    g.generateTexture('worker', 20, 20);
  }

  // --- Save System Methods ---

  private autoSave() {
    if (this.isGameOver) return;
    
    const saved = this.saveGameState();
    if (saved) {
      FloatingText.create(this, 400, 50, 'Game Auto-Saved', '#9b59b6', 18);
    }
  }

  private manualSave() {
    const saved = this.saveGameState();
    if (saved) {
      this.statusText.setText('Game Saved!');
      FloatingText.create(this, 400, 300, 'Game Saved Successfully!', '#9b59b6', 24);
      this.time.delayedCall(2000, () => this.statusText.setText(''));
    } else {
      this.statusText.setText('Save Failed!');
      this.time.delayedCall(2000, () => this.statusText.setText(''));
    }
  }

  private saveGameState(): boolean {
    const saveData: GameSaveData = {
      woodCount: this.woodCount,
      meatCount: this.meatCount,
      temperature: this.temperature,
      furnaceLevel: this.furnaceLevel,
      hasSpear: this.hasSpear,
      hasHut: this.hasHut,
      playerX: this.player.x,
      playerY: this.player.y,
      daysSurvived: this.daysSurvived,
      totalWoodGathered: this.totalWoodGathered,
      totalMeatCollected: this.totalMeatCollected,
      bearsKilled: this.bearsKilled,
      lastSaved: Date.now(),
      playTime: this.playTimeSeconds,
      snowCount: this.snowCount,
      stoneCount: this.stoneCount,
    } as any;

    return SaveManager.saveGame(saveData);
  }

  private loadGameState() {
    const saveData = SaveManager.loadGame();
    
    if (!saveData) {
      console.log('No save data found, starting new game');
      return;
    }

    // Restore resources
    this.woodCount = saveData.woodCount;
    this.meatCount = saveData.meatCount;
    this.snowCount = (saveData as any).snowCount || 0;
    this.stoneCount = (saveData as any).stoneCount || 0;
    this.temperature = saveData.temperature;
    this.furnaceLevel = saveData.furnaceLevel;
    this.hasSpear = saveData.hasSpear;
    this.hasHut = saveData.hasHut;

    // Restore player position
    this.player.setPosition(saveData.playerX, saveData.playerY);

    // Restore progression
    this.daysSurvived = saveData.daysSurvived;
    this.totalWoodGathered = saveData.totalWoodGathered;
    this.totalMeatCollected = saveData.totalMeatCollected;
    this.bearsKilled = saveData.bearsKilled;
    this.playTimeSeconds = saveData.playTime;

    // Restore furnace state
    if (this.furnaceLevel >= 2) {
      this.furnace.setScale(1.5);
      this.fogWall.setAlpha(0);
      this.fogCollider.enable = false;
      
      // Restore quarry
      if (!this.quarry) {
        this.quarry = this.add.image(650, 450, 'quarry');
        this.quarry.setScale(0.8);
      }
    }

    // Restore spear
    if (this.hasSpear) {
      this.spear.setVisible(true);
    }

    // Restore hut
    if (this.hasHut) {
      this.hut = this.add.image(300, 350, 'hut');
    }

    this.statusText.setText('Game Loaded!');
    FloatingText.create(this, 400, 300, 'Welcome Back!', '#2ecc71', 28);
    this.time.delayedCall(2000, () => this.statusText.setText(''));

    console.log('Game state loaded successfully');
  }

  private incrementDay() {
    if (this.isGameOver) return;
    
    this.daysSurvived++;
    this.updateStatsDisplay();
    
    // Show day notification
    FloatingText.create(this, 400, 300, `Day ${this.daysSurvived}`, '#FFD700', 32);
    
    // Auto-save on day change
    this.saveGameState();
  }

  private updateStatsDisplay() {
    const progression = SaveManager.loadProgression();
    
    const stats = [
      `Day: ${this.daysSurvived}`,
      `High Score: ${progression.highScore}`,
      `Time: ${SaveManager.formatPlayTime(this.playTimeSeconds)}`,
    ];
    
    this.statsText.setText(stats.join('\n'));
  }

  private updateProgression() {
    // Update high score
    const isNewRecord = SaveManager.updateHighScore(this.daysSurvived);
    
    if (isNewRecord && this.daysSurvived > 0) {
      FloatingText.create(this, 400, 250, 'NEW HIGH SCORE!', '#FFD700', 36);
      this.cameras.main.flash(500, 255, 215, 0);
    }

    // Add play time
    SaveManager.addPlayTime(this.playTimeSeconds);
    
    // Check for achievements
    this.checkAchievements();
  }

  private checkAchievements() {
    // First Day
    if (this.daysSurvived >= 1 && !SaveManager.hasAchievement('first_day')) {
      SaveManager.unlockAchievement('first_day');
      this.showAchievement('First Day', 'Survived your first day!');
    }

    // Week Survivor
    if (this.daysSurvived >= 7 && !SaveManager.hasAchievement('week_survivor')) {
      SaveManager.unlockAchievement('week_survivor');
      this.showAchievement('Week Survivor', 'Survived 7 days!');
    }

    // Lumberjack
    if (this.totalWoodGathered >= 100 && !SaveManager.hasAchievement('lumberjack')) {
      SaveManager.unlockAchievement('lumberjack');
      this.showAchievement('Lumberjack', 'Gathered 100 wood!');
    }

    // Bear Hunter
    if (this.bearsKilled >= 10 && !SaveManager.hasAchievement('bear_hunter')) {
      SaveManager.unlockAchievement('bear_hunter');
      this.showAchievement('Bear Hunter', 'Defeated 10 bears!');
    }

    // Master Builder
    if (this.hasHut && this.furnaceLevel >= 2 && !SaveManager.hasAchievement('master_builder')) {
      SaveManager.unlockAchievement('master_builder');
      this.showAchievement('Master Builder', 'Built everything!');
    }
  }

  private showAchievement(title: string, description: string) {
    const centerX = 400;
    const centerY = 300;

    // Achievement popup
    const bg = this.add.rectangle(centerX, centerY, 400, 120, 0x000000, 0.9);
    bg.setDepth(200);

    const titleText = this.add.text(centerX, centerY - 20, `🏆 ${title}`, {
      fontSize: '24px',
      color: '#FFD700',
      fontStyle: 'bold',
    });
    titleText.setOrigin(0.5);
    titleText.setDepth(201);

    const descText = this.add.text(centerX, centerY + 15, description, {
      fontSize: '16px',
      color: '#FFFFFF',
    });
    descText.setOrigin(0.5);
    descText.setDepth(201);

    // Fade in
    bg.setAlpha(0);
    titleText.setAlpha(0);
    descText.setAlpha(0);

    this.tweens.add({
      targets: [bg, titleText, descText],
      alpha: 1,
      duration: 500,
      ease: 'Power2',
    });

    // Fade out and destroy after 3 seconds
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: [bg, titleText, descText],
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          bg.destroy();
          titleText.destroy();
          descText.destroy();
        },
      });
    });
  }

  // --- Blizzard System Methods ---

  private updateBlizzardUI() {
    const isBlizzardActive = this.blizzardManager.isBlizzardActive();
    const wasBlizzardActive = this.blizzardOverlay.alpha > 0.1;
    
    // Fade in/out blizzard overlay
    if (isBlizzardActive && !wasBlizzardActive) {
      this.tweens.add({
        targets: this.blizzardOverlay,
        alpha: 0.5,
        duration: 2000,
        ease: 'Power2'
      });
    } else if (!isBlizzardActive && wasBlizzardActive) {
      this.tweens.add({
        targets: this.blizzardOverlay,
        alpha: 0,
        duration: 3000,
        ease: 'Power2'
      });
    }
    
    // Show/hide Stoke Fire button during blizzard
    if (isBlizzardActive) {
      this.stokeFireBtn.setVisible(true);
      
      // Update button text with click progress
      const btnText = this.stokeFireBtn.list[1] as Phaser.GameObjects.Text;
      btnText.setText(`STOKE FIRE! (${this.stokeFireClicks}/${this.STOKE_CLICKS_NEEDED})`);
      
      // Change button color based on progress
      const btnBg = this.stokeFireBtn.list[0] as Phaser.GameObjects.Rectangle;
      if (this.stokeFireClicks >= this.STOKE_CLICKS_NEEDED) {
        btnBg.setFillStyle(0x00FF00); // Green when complete
      } else {
        btnBg.setFillStyle(0xFF4500); // Orange-red when active
      }
    } else {
      this.stokeFireBtn.setVisible(false);
      this.stokeFireClicks = 0; // Reset for next blizzard
    }
  }

  private stokeFire() {
    if (!this.blizzardManager.isBlizzardActive()) return;
    
    this.stokeFireClicks++;
    
    // Visual feedback
    ParticleEffects.createImpact(this, 400, 400, 0xFF4500);
    FloatingText.create(this, 400 + Phaser.Math.Between(-20, 20), 380, '+1', '#FF4500', 24);
    
    // Add temperature for each click
    this.temperature = Math.min(this.maxTemperature, this.temperature + 2);
    
    // Check if goal reached
    if (this.stokeFireClicks >= this.STOKE_CLICKS_NEEDED) {
      FloatingText.create(this, 400, 350, 'Fire Stoked!', '#FFD700', 32);
      this.cameras.main.flash(200, 255, 140, 0);
      
      // Bonus temperature
      this.temperature = Math.min(this.maxTemperature, this.temperature + 10);
    }
  }

  private createPlayerAnimations() {
    // Create animations from the loaded sprite images
    // Since we have single frame images, we'll use them as single-frame animations
    
    // Idle animation
    this.anims.create({
      key: 'player_idle',
      frames: [{ key: 'player_idle', frame: 0 }],
      frameRate: 1,
      repeat: -1
    });
    
    // Walk right animation
    this.anims.create({
      key: 'player_walk_right',
      frames: [{ key: 'player_run_right', frame: 0 }],
      frameRate: 8,
      repeat: -1
    });
    
    // Walk left animation
    this.anims.create({
      key: 'player_walk_left',
      frames: [{ key: 'player_run_left', frame: 0 }],
      frameRate: 8,
      repeat: -1
    });
    
    // Walk up-right animation
    this.anims.create({
      key: 'player_walk_up_right',
      frames: [{ key: 'player_run_up_right', frame: 0 }],
      frameRate: 8,
      repeat: -1
    });
    
    // Walk up-left animation
    this.anims.create({
      key: 'player_walk_up_left',
      frames: [{ key: 'player_run_up_left', frame: 0 }],
      frameRate: 8,
      repeat: -1
    });
  }

  private isPlayerInShelter(): boolean {
    // Check if player is near hut (shelter)
    if (this.hasHut && this.hut) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.hut.x, this.hut.y);
      if (dist < 80) {
        return true;
      }
    }
    
    // Check if player is near furnace (also provides shelter)
    const furnaceDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.furnace.x, this.furnace.y);
    if (furnaceDist < 100) {
      return true;
    }
    
    // Check if player is near any igloo (provides shelter during blizzard)
    for (const igloo of this.igloos) {
      if (igloo.active) {
        const iglooDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, igloo.x, igloo.y);
        if (iglooDistance < 60) {
          return true;
        }
      }
    }
    
    return false;
  }
}