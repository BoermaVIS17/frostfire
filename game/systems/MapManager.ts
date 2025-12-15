import Phaser from 'phaser';

export default class MapManager {
  private scene: Phaser.Scene;
  
  // Groups
  public trees!: Phaser.Physics.Arcade.StaticGroup;
  public stonesGroup!: Phaser.Physics.Arcade.StaticGroup;
  public snowPilesGroup!: Phaser.Physics.Arcade.Group;
  public igloos: Phaser.GameObjects.Image[] = [];
  
  // Single Objects
  public furnace!: Phaser.Physics.Arcade.Image;
  public quarry!: Phaser.Physics.Arcade.Image;
  public hut: Phaser.GameObjects.Image | null = null;
  
  // Hut Interior Components
  private hutFloor: Phaser.GameObjects.Image | null = null;
  private hutWalls: Phaser.GameObjects.Image | null = null;
  private hutRoof: Phaser.GameObjects.Image | null = null;
  public hutDoorTrigger: Phaser.Physics.Arcade.Image | null = null;
  private isPlayerInHut: boolean = false;
  
  // Visuals
  public fogWall!: Phaser.GameObjects.Rectangle;
  public fogCollider!: Phaser.Physics.Arcade.StaticBody;
  public blizzardOverlay!: Phaser.GameObjects.Image;
  private furnaceGlow!: Phaser.GameObjects.Shape;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  preload() {
    // Load all real PNG assets
    this.scene.load.image('tree', 'assets/tree1.png');
    this.scene.load.image('quarry', 'assets/quarry.png');
    this.scene.load.image('stone', 'assets/rock.png');
    this.scene.load.image('igloo', 'assets/igloo.png.png');
    this.scene.load.image('snow_pile', 'assets/snow_pile.png');
    this.scene.load.image('hut', 'assets/hut_wood.png');
    this.scene.load.image('blizzard_overlay', 'assets/Blizzard.png');
    
    // Load hut interior assets
    this.scene.load.image('floor_wood', 'assets/floor_wood.png');
    this.scene.load.image('wall_wood', 'assets/wall_wood.png');
    this.scene.load.image('hut_wood', 'assets/hut_wood.png');
    this.scene.load.image('trigger_enter', 'assets/Enter Sprite.png');
    
    // Keep generated textures for assets without PNGs
    this.createFurnaceTexture();
    this.createSnowParticleTexture();
  }

  create() {
    const centerX = 400;
    const centerY = 300;

    // Furnace & Glow
    this.furnaceGlow = this.scene.add.circle(centerX, centerY, 100, 0xffaa00, 0.2);
    this.scene.tweens.add({ targets: this.furnaceGlow, alpha: 0.1, duration: 1000, yoyo: true, repeat: -1 });

    this.furnace = this.scene.physics.add.staticImage(centerX, centerY, 'furnace');
    this.furnace.setCircle(30, 2, 2);

    // Quarry (Deposit Point)
    this.quarry = this.scene.physics.add.staticImage(650, 450, 'quarry');
    this.quarry.setScale(0.5); // Larger building size
    // Adjust hit box for easier overlap
    this.quarry.body.updateFromGameObject();

    // Groups
    this.trees = this.scene.physics.add.staticGroup();
    this.stonesGroup = this.scene.physics.add.staticGroup();
    this.snowPilesGroup = this.scene.physics.add.group();
    
    // Initial Spawns
    this.spawnTrees(5, true);
    this.spawnStones(3);
    this.spawnSnowPiles(Phaser.Math.Between(5, 10));

    // Fog of War
    this.fogWall = this.scene.add.rectangle(650, 300, 300, 600, 0x000000, 0.95).setDepth(10);
    const wallBody = this.scene.add.rectangle(500, 300, 10, 600, 0xff0000, 0);
    this.scene.physics.add.existing(wallBody, true);
    this.fogCollider = wallBody.body as Phaser.Physics.Arcade.StaticBody;

    // Blizzard Overlay
    this.blizzardOverlay = this.scene.add.image(400, 300, 'blizzard_overlay');
    this.blizzardOverlay.setDisplaySize(800, 600);
    this.blizzardOverlay.setAlpha(0);
    this.blizzardOverlay.setDepth(15);
    
    // Create Hut with Interior
    this.createHutWithInterior(300, 300);
  }

  update(delta: number, isBlizzardActive: boolean) {
    // Update Blizzard Visuals
    const wasBlizzardActive = this.blizzardOverlay.alpha > 0.1;
    if (isBlizzardActive && !wasBlizzardActive) {
      this.scene.tweens.add({ targets: this.blizzardOverlay, alpha: 0.5, duration: 2000, ease: 'Power2' });
    } else if (!isBlizzardActive && wasBlizzardActive) {
      this.scene.tweens.add({ targets: this.blizzardOverlay, alpha: 0, duration: 3000, ease: 'Power2' });
    }

    // Update Igloos
    this.updateIgloos(delta, isBlizzardActive);
  }

  // --- Spawning Logic ---

  public spawnTrees(count: number, safeZoneOnly: boolean) {
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
      tree.setScale(0.2); // RPG-style tree size
      tree.setCircle(16, 4, 16);
      tree.setImmovable(true);
    }
  }

  public spawnStones(count: number) {
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
      stone.setScale(0.1); // Small item size
    }
  }

  public spawnSnowPiles(count: number) {
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(50, 750);
      const y = Phaser.Math.Between(50, 550);
      const snowPile = this.snowPilesGroup.create(x, y, 'snow_pile') as Phaser.Physics.Arcade.Sprite;
      snowPile.setScale(0.2); // RPG-style snow pile size
      this.scene.tweens.add({
        targets: snowPile,
        y: snowPile.y - 3,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  // --- Building Logic ---

  public buildHut() {
      if (!this.hut) {
        this.hut = this.scene.add.image(300, 350, 'hut');
        this.hut.setScale(0.3); // RPG-style building size
      }
  }

  public createHutWithInterior(x: number, y: number) {
    // Layer 1 (Bottom): Floor
    this.hutFloor = this.scene.add.image(x, y, 'floor_wood');
    this.hutFloor.setDisplaySize(200, 200);
    this.hutFloor.setDepth(1);
    
    // Layer 2 (Middle): Walls
    this.hutWalls = this.scene.add.image(x, y, 'wall_wood');
    this.hutWalls.setDisplaySize(200, 200);
    this.hutWalls.setDepth(2);
    
    // Layer 3 (Top): Roof (hut_wood)
    this.hutRoof = this.scene.add.image(x, y, 'hut_wood');
    this.hutRoof.setDisplaySize(200, 200);
    this.hutRoof.setDepth(10); // High depth so it's on top
    this.hutRoof.setAlpha(1); // Fully visible by default
    
    // Door Trigger (at the bottom-center of the hut, where the door would be)
    const doorX = x;
    const doorY = y + 80; // Bottom of the hut
    this.hutDoorTrigger = this.scene.physics.add.image(doorX, doorY, 'trigger_enter');
    this.hutDoorTrigger.setDisplaySize(60, 40); // Door-sized trigger
    this.hutDoorTrigger.setAlpha(0.3); // Semi-transparent for debugging (can set to 0 later)
    this.hutDoorTrigger.setDepth(0);
    this.hutDoorTrigger.body.setAllowGravity(false);
    (this.hutDoorTrigger.body as Phaser.Physics.Arcade.Body).setImmovable(true);
  }

  public updateHutRoofFading(playerOverlapping: boolean) {
    if (!this.hutRoof) return;
    
    // Player entered hut
    if (playerOverlapping && !this.isPlayerInHut) {
      this.isPlayerInHut = true;
      this.scene.tweens.add({
        targets: this.hutRoof,
        alpha: 0,
        duration: 500,
        ease: 'Power2'
      });
    }
    // Player left hut
    else if (!playerOverlapping && this.isPlayerInHut) {
      this.isPlayerInHut = false;
      this.scene.tweens.add({
        targets: this.hutRoof,
        alpha: 1,
        duration: 500,
        ease: 'Power2'
      });
    }
  }

  public placeIgloo(x: number, y: number) {
      const igloo = this.scene.add.image(x, y, 'igloo');
      igloo.setScale(0.3); // RPG-style building size
      igloo.setData('meltTimer', 0);
      igloo.setData('isActive', true);
      this.igloos.push(igloo);
  }

  public upgradeFurnaceVisuals() {
    this.furnace.setScale(1.5);
    this.furnace.body.updateFromGameObject();
    
    // Remove Fog
    this.scene.tweens.add({ targets: this.fogWall, alpha: 0, duration: 2000, onComplete: () => this.fogWall.destroy() });
    this.fogCollider.enable = false;
    
    // Respawn trees in new area
    this.spawnTrees(5, false);
  }

  private updateIgloos(delta: number, isBlizzardActive: boolean) {
    for (let i = this.igloos.length - 1; i >= 0; i--) {
      const igloo = this.igloos[i];
      if (!igloo.getData('isActive')) continue;
      
      if (!isBlizzardActive) {
        let meltTimer = igloo.getData('meltTimer') || 0;
        meltTimer += delta;
        igloo.setData('meltTimer', meltTimer);
        const meltDuration = 120000;
        
        if (meltTimer >= meltDuration) {
          igloo.destroy();
          this.igloos.splice(i, 1);
        } else {
          igloo.setAlpha(1 - (meltTimer / meltDuration));
        }
      } else {
        igloo.setData('meltTimer', 0);
        igloo.setAlpha(1);
      }
    }
  }

  public getClosestTree(x: number, y: number): Phaser.GameObjects.GameObject | null {
    let closest: Phaser.GameObjects.GameObject | null = null;
    let minMsg = 99999;
    this.trees.children.iterate((tree) => {
        if (!tree.active) return true;
        const d = Phaser.Math.Distance.Between(x, y, (tree as any).x, (tree as any).y);
        if (d < minMsg) { minMsg = d; closest = tree; }
        return true;
    });
    return closest;
  }

  public triggerTreeRespawn() {
    this.scene.time.delayedCall(2000, () => {
        // Simple check: assume if fog is gone, allow full map spawn, otherwise safe zone
        const isUnlocked = !this.fogCollider.enable;
        this.spawnTrees(1, !isUnlocked);
    });
  }

  // --- Texture Generation (Only for assets without PNG files) ---

  private createFurnaceTexture() {
    const g = this.scene.make.graphics({x:0,y:0});
    g.fillStyle(0x616161); g.fillCircle(32,32,30); g.fillStyle(0x212121); g.fillCircle(32,32,24);
    g.fillStyle(0xD32F2F); g.fillCircle(32,34,10); g.fillStyle(0xFF9800); g.fillTriangle(32,10,22,36,42,36);
    g.fillStyle(0xFFEB3B); g.fillTriangle(32,20,28,36,36,36);
    g.generateTexture('furnace', 64, 64);
    g.destroy();
  }
  
  private createSnowParticleTexture() {
    const g = this.scene.make.graphics({x:0,y:0});
    g.fillStyle(0xFFFFFF); g.fillCircle(2,2,2);
    g.generateTexture('snow_particle', 4, 4);
    g.destroy();
  }
}