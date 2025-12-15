import Phaser from 'phaser';
import Player from './Player'; // Assumes Player.ts is the base sprite class
import ParticleEffects from '../utils/ParticleEffects';
import FloatingText from '../utils/FloatingText';
import MapManager from '../systems/MapManager';
import UIManager from '../systems/UIManager';

export default class PlayerController {
  private scene: Phaser.Scene;
  public player!: Player;
  private spear!: Phaser.GameObjects.Sprite;
  private interactionIndicator!: Phaser.GameObjects.Arc;
  
  // State
  public woodCount: number = 0;
  public meatCount: number = 0;
  public snowCount: number = 0;
  public stoneCount: number = 0;
  public temperature: number = 100;
  public maxTemperature: number = 100;

  // Inventory Limits
  private maxInventory: number = 10;
  
  // Status
  public hasSpear: boolean = false;
  private isAttacking: boolean = false;
  private canAttack: boolean = true;
  public hasHitTarget: boolean = false;
  private burnRateModifier: number = 1.0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public get totalItems(): number { 
      return this.woodCount + this.stoneCount + this.meatCount; 
  }

  preload() {
    this.createPlayerTextures();
    this.createSpearTexture();
  }

  create(x: number, y: number) {
    this.player = new Player(this.scene, x, y);
    this.player.setDepth(5);
    
    // Interaction Indicator (Gold pulsing ring)
    this.interactionIndicator = this.scene.add.circle(x, y, 22, 0xffffff, 0);
    this.interactionIndicator.setStrokeStyle(3, 0xFFD700);
    this.interactionIndicator.setDepth(4);
    this.interactionIndicator.setVisible(false);

    // Spear Setup
    this.spear = this.scene.add.sprite(x, y, 'spear');
    this.spear.setOrigin(0, 0.5);
    this.spear.setVisible(false);
    this.spear.setDepth(6);
  }

  update(input: Phaser.Input.InputPlugin, mapManager: MapManager) {
    if (!this.player.active) return;
    
    this.player.update();
    this.updateSpear(input);
    this.checkInteractionRange(mapManager);
  }

  private checkInteractionRange(mapManager: MapManager) {
    const p = this.player;
    let show = false;

    // Check Furnace (Deposit)
    if (mapManager.furnace) {
        if (Phaser.Math.Distance.Between(p.x, p.y, mapManager.furnace.x, mapManager.furnace.y) < 100) {
            show = true;
        }
    }
    
    // Check Quarry (Deposit)
    if (!show && mapManager.quarry) {
        if (Phaser.Math.Distance.Between(p.x, p.y, mapManager.quarry.x, mapManager.quarry.y) < 80) {
            show = true;
        }
    }

    // Check Resources (Gather)
    if (!show) {
        const closestTree = mapManager.getClosestTree(p.x, p.y);
        if (closestTree && Phaser.Math.Distance.Between(p.x, p.y, (closestTree as any).x, (closestTree as any).y) < 70) {
            show = true;
        }
        
        // Also check stones if no tree triggered it
        if (!show) {
             mapManager.stonesGroup.children.iterate((child) => {
                 const stone = child as Phaser.Physics.Arcade.Sprite;
                 if (stone.active && Phaser.Math.Distance.Between(p.x, p.y, stone.x, stone.y) < 60) {
                     show = true;
                 }
                 return true;
             });
        }
    }

    if (show) {
        this.interactionIndicator.setPosition(p.x, p.y);
        this.interactionIndicator.setVisible(true);
        const scale = 1 + Math.sin(this.scene.time.now / 200) * 0.15;
        this.interactionIndicator.setScale(scale);
    } else {
        this.interactionIndicator.setVisible(false);
    }
  }

  private updateSpear(input: Phaser.Input.InputPlugin) {
    if (this.hasSpear) {
      this.spear.setVisible(true);
      const dir = this.player.getCurrentDirection();
      let offsetX = 0;
      let offsetY = 0;
      
      if (dir === 'right') offsetX = 15;
      else if (dir === 'left') offsetX = -15;
      else if (dir === 'down') offsetY = 15;
      else if (dir === 'up') offsetY = -15;
      
      this.spear.setPosition(this.player.x + offsetX, this.player.y + offsetY); 
      
      // Rotate towards mouse
      const activePointer = input.activePointer;
      const angleToPointer = Phaser.Math.Angle.Between(this.spear.x, this.spear.y, activePointer.x, activePointer.y);
      this.spear.setRotation(angleToPointer);
    }
  }

  public triggerAttack(x: number, y: number, callback: (angle: number) => void) {
      if (this.hasSpear && this.canAttack && !this.isAttacking) {
        this.isAttacking = true;
        this.canAttack = false;
        this.hasHitTarget = false;
        
        const angle = this.spear.rotation;
        
        // Visual Tween
        this.scene.tweens.add({
            targets: this.spear,
            x: this.spear.x + Math.cos(angle) * 20,
            y: this.spear.y + Math.sin(angle) * 20,
            duration: 150,
            yoyo: true,
            onComplete: () => {
                this.isAttacking = false;
                this.scene.time.delayedCall(400, () => { this.canAttack = true; });
            }
        });

        // Trigger logic callback for hit detection
        callback(angle);
      }
  }

  // --- Interaction Logic ---

  public handleGather(mapManager: MapManager, statusCallback: (msg: string) => void) {
    if (this.totalItems >= this.maxInventory) {
        statusCallback(`Inventory Full! (${this.totalItems}/${this.maxInventory})`);
        FloatingText.create(this.scene, this.player.x, this.player.y - 30, `Inventory Full! (${this.totalItems}/${this.maxInventory})`, '#FF0000', 20);
        return;
    }

    let target: Phaser.GameObjects.GameObject | null = null;
    let type: 'wood' | 'stone' = 'wood';
    let closestDist = 70; // Max range

    // Check Trees
    mapManager.trees.children.iterate((child) => {
      const tree = child as Phaser.Physics.Arcade.Sprite;
      if (!tree.active) return true;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, tree.x, tree.y);
      if (dist < closestDist) { 
          closestDist = dist; 
          target = tree; 
          type = 'wood';
      }
      return true;
    });

    // Check Stones
    mapManager.stonesGroup.children.iterate((child) => {
      const stone = child as Phaser.Physics.Arcade.Sprite;
      if (!stone.active) return true;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, stone.x, stone.y);
      if (dist < closestDist) { 
          closestDist = dist; 
          target = stone; 
          type = 'stone';
      }
      return true;
    });

    if (target) {
        const tx = (target as any).x;
        const ty = (target as any).y;
        
        if (type === 'wood') {
            ParticleEffects.createWoodChips(this.scene, tx, ty);
            FloatingText.createResource(this.scene, tx, ty - 20, 1, 'Wood', '#8B4513');
            this.woodCount++;
            statusCallback('+1 Wood');
            (target as any).destroy();
            mapManager.triggerTreeRespawn();
        } else {
            ParticleEffects.createWoodChips(this.scene, tx, ty); // Reusing particle effect
            FloatingText.createResource(this.scene, tx, ty - 20, 1, 'Stone', '#7f8c8d');
            this.stoneCount++;
            statusCallback('+1 Stone');
            (target as any).destroy();
            // Simple respawn for stone for now
             this.scene.time.delayedCall(5000, () => mapManager.spawnStones(1));
        }
    } else {
      statusCallback('Nothing to gather!');
    }
  }

  public depositAllResources() {
      const stored = { 
          wood: this.woodCount, 
          stone: this.stoneCount, 
          meat: this.meatCount 
      };
      
      this.woodCount = 0;
      this.stoneCount = 0;
      this.meatCount = 0;
      
      return stored;
  }

  public collectMeat(meat: any, statusCallback: (msg: string) => void) {
    if (this.totalItems >= this.maxInventory) {
        statusCallback(`Inventory Full! (${this.totalItems}/${this.maxInventory})`);
        FloatingText.create(this.scene, this.player.x, this.player.y - 30, `Inventory Full! (${this.totalItems}/${this.maxInventory})`, '#FF0000', 20);
        return;
    }
    ParticleEffects.createSparkle(this.scene, meat.x, meat.y);
    FloatingText.createResource(this.scene, meat.x, meat.y - 20, 1, 'Meat', '#DC143C');
    meat.destroy();
    this.meatCount++;
    statusCallback("Collected Meat!");
  }

  public collectSnowPile(snowPile: any, statusCallback: (msg: string) => void) {
    // Snow usually doesn't count towards heavy inventory in this design
    ParticleEffects.createSparkle(this.scene, snowPile.x, snowPile.y);
    FloatingText.createResource(this.scene, snowPile.x, snowPile.y - 20, 1, 'Snow', '#00BFFF');
    snowPile.destroy();
    this.snowCount++;
    statusCallback("Collected Snow!");
  }

  public checkFurnaceDeposit(furnace: any, furnaceLevel: number, upgradeCost: number, statusCallback: (msg: string) => void) {
    // Furnace acts as a heat source and disposal for burning, not main storage
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, furnace.x, furnace.y);
    if (dist < 80) {
        if (this.meatCount > 0) {
            const heat = this.meatCount * 50;
            this.temperature = Math.min(this.maxTemperature, this.temperature + heat);
            statusCallback(`Deposited Meat! +${heat}% Temp`);
            this.meatCount = 0;
        }
        else if (this.woodCount > 0) {
            // Note: Upgrades now use Town Stash, so we just burn wood here for heat
            const fuelAmount = this.woodCount * 10;
            this.temperature = Math.min(this.maxTemperature, this.temperature + fuelAmount);
            statusCallback(`Burned ${this.woodCount} Wood!`);
            this.woodCount = 0;
        }
    }
  }

  public decayTemperature(amount: number) {
      this.temperature -= (amount * this.burnRateModifier);
      if (this.temperature <= 0) this.temperature = 0;
  }

  public increaseTemperature(amount: number) {
      this.temperature = Math.min(this.maxTemperature, this.temperature + amount);
  }

  public setBurnRate(rate: number) {
      this.burnRateModifier = rate;
  }

  // --- Getters ---
  public getSpear() { return this.spear; }
  public isSpearAttacking() { return this.isAttacking; }

  // --- Texture Generation ---
  private createPlayerTextures() {
    const g = this.scene.make.graphics({x:0,y:0});
    
    // Front view
    g.clear();
    g.fillStyle(0x3498db); g.fillRoundedRect(4, 8, 24, 20, 8);
    g.fillStyle(0xecf0f1); g.fillRect(14, 8, 4, 20); g.fillRect(4, 24, 24, 4);
    g.fillStyle(0xecf0f1); g.fillCircle(16, 10, 10);
    g.fillStyle(0x2c3e50); g.fillCircle(16, 10, 8);
    g.fillStyle(0xe67e22); g.fillCircle(16, 11, 5);
    g.fillStyle(0x5d4037); g.fillEllipse(10, 30, 8, 6); g.fillEllipse(22, 30, 8, 6);
    g.generateTexture('player_front', 32, 32);
    
    // Back view
    g.clear();
    g.fillStyle(0x3498db); g.fillRoundedRect(4, 8, 24, 20, 8);
    g.fillStyle(0xecf0f1); g.fillRect(4, 24, 24, 4);
    g.fillStyle(0xecf0f1); g.fillCircle(16, 10, 10);
    g.fillStyle(0x5d4037); g.fillEllipse(10, 30, 8, 6); g.fillEllipse(22, 30, 8, 6);
    g.generateTexture('player_back', 32, 32);
    
    // Left view
    g.clear();
    g.fillStyle(0x3498db); g.fillRoundedRect(4, 8, 24, 20, 8);
    g.fillStyle(0xecf0f1); g.fillRect(4, 24, 24, 4);
    g.fillStyle(0xecf0f1); g.fillCircle(12, 10, 10);
    g.fillStyle(0x2c3e50); g.fillCircle(12, 10, 8);
    g.fillStyle(0xe67e22); g.fillCircle(12, 11, 5);
    g.fillStyle(0x5d4037); g.fillEllipse(10, 30, 8, 6); g.fillEllipse(22, 30, 8, 6);
    g.generateTexture('player_left', 32, 32);
    
    // Right view
    g.clear();
    g.fillStyle(0x3498db); g.fillRoundedRect(4, 8, 24, 20, 8);
    g.fillStyle(0xecf0f1); g.fillRect(4, 24, 24, 4);
    g.fillStyle(0xecf0f1); g.fillCircle(20, 10, 10);
    g.fillStyle(0x2c3e50); g.fillCircle(20, 10, 8);
    g.fillStyle(0xe67e22); g.fillCircle(20, 11, 5);
    g.fillStyle(0x5d4037); g.fillEllipse(10, 30, 8, 6); g.fillEllipse(22, 30, 8, 6);
    g.generateTexture('player_right', 32, 32);
    
    g.destroy();
  }
  private createSpearTexture() {
    const g = this.scene.make.graphics({x:0,y:0});
    g.fillStyle(0x8D6E63); g.fillRect(0,3,32,2); 
    g.fillStyle(0xBDC3C7); g.fillTriangle(32,4, 28,1, 28,7); 
    g.generateTexture('spear', 34, 8);
    g.destroy();
  }
}