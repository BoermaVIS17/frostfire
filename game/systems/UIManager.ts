import Phaser from 'phaser';

export default class UIManager {
  private scene: Phaser.Scene;

  // Text Elements
  private tempText!: Phaser.GameObjects.Text;
  private woodText!: Phaser.GameObjects.Text;
  private meatText!: Phaser.GameObjects.Text;
  private snowText!: Phaser.GameObjects.Text;
  private stoneText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;

  // Buttons
  public upgradeBtn!: Phaser.GameObjects.Container;
  public spearBtn!: Phaser.GameObjects.Container;
  public hutBtn!: Phaser.GameObjects.Container;
  public iglooBtn!: Phaser.GameObjects.Container;
  public saveBtn!: Phaser.GameObjects.Container;
  public stokeFireBtn!: Phaser.GameObjects.Container;

  // Callbacks
  private onUpgrade: () => void;
  private onCraftSpear: () => void;
  private onBuildHut: () => void;
  private onBuildIgloo: () => void;
  private onSave: () => void;
  private onStokeFire: () => void;

  constructor(
    scene: Phaser.Scene,
    callbacks: {
      onUpgrade: () => void,
      onCraftSpear: () => void,
      onBuildHut: () => void,
      onBuildIgloo: () => void,
      onSave: () => void,
      onStokeFire: () => void
    }
  ) {
    this.scene = scene;
    this.onUpgrade = callbacks.onUpgrade;
    this.onCraftSpear = callbacks.onCraftSpear;
    this.onBuildHut = callbacks.onBuildHut;
    this.onBuildIgloo = callbacks.onBuildIgloo;
    this.onSave = callbacks.onSave;
    this.onStokeFire = callbacks.onStokeFire;
  }

  preload() {
    this.createMeatTexture();
  }

  create(centerX: number, centerY: number) {
    const textStyle = { font: '20px Arial', color: '#000000', fontStyle: 'bold' };
    
    // HUD
    this.tempText = this.scene.add.text(16, 16, 'Temp: 100%', textStyle);
    this.woodText = this.scene.add.text(16, 46, 'Wood: 0', textStyle);
    this.meatText = this.scene.add.text(16, 76, 'Meat: 0', { ...textStyle, color: '#aa0000' });
    this.snowText = this.scene.add.text(16, 106, 'Snow: 0', { ...textStyle, color: '#00BFFF' });
    this.stoneText = this.scene.add.text(16, 136, 'Stone: 0', { ...textStyle, color: '#808080' });
    this.levelText = this.scene.add.text(16, 166, 'Furnace Lv: 1', textStyle);
    this.statusText = this.scene.add.text(centerX, 100, '', { ...textStyle, color: '#333' }).setOrigin(0.5);

    // Progression Stats (Top Right)
    this.statsText = this.scene.add.text(784, 16, '', { font: '16px Arial', color: '#000000', fontStyle: 'bold', align: 'right' });
    this.statsText.setOrigin(1, 0);

    // Buttons
    this.upgradeBtn = this.createButton(centerX, centerY + 60, 'Upgrade (10)', 0x2ecc71, this.onUpgrade);
    this.spearBtn = this.createButton(centerX + 200, centerY + 200, 'Craft Spear (50)', 0x3498db, this.onCraftSpear);
    this.hutBtn = this.createButton(centerX - 200, centerY + 100, 'Build Hut (100)', 0xf1c40f, this.onBuildHut);
    this.iglooBtn = this.createButton(centerX, centerY + 150, 'Build Igloo (10 Snow)', 0x00CED1, this.onBuildIgloo);
    this.saveBtn = this.createButton(centerX, centerY + 250, 'Save Game', 0x9b59b6, this.onSave);
    
    // Stoke Fire Button (initially hidden)
    this.stokeFireBtn = this.createButton(400, 400, 'STOKE FIRE! (0/10)', 0xFF4500, this.onStokeFire);
    this.stokeFireBtn.setVisible(false);
    this.stokeFireBtn.setDepth(160);

    // Initial Visibility
    this.spearBtn.setVisible(false);
    this.hutBtn.setVisible(false);
    this.iglooBtn.setVisible(false);
  }

  // --- Public API ---

  public updateStats(
    stats: { 
      wood: number, 
      meat: number, 
      snow: number, 
      stone: number, 
      temp: number, 
      level: number,
      townWood?: number,
      townMeat?: number,
      townStone?: number
    },
    statusMessage?: string
  ) {
    this.tempText.setText(`Temp: ${Math.floor(stats.temp)}%`);
    
    // Update labels to show Inventory + (Town Stash)
    const tWood = stats.townWood ?? 0;
    const tStone = stats.townStone ?? 0;
    const tMeat = stats.townMeat ?? 0;

    this.woodText.setText(`Wood: ${stats.wood} (Town: ${tWood})`);
    this.meatText.setText(`Meat: ${stats.meat} (Town: ${tMeat})`);
    this.stoneText.setText(`Stone: ${stats.stone} (Town: ${tStone})`);
    
    this.snowText.setText(`Snow: ${stats.snow}`);
    this.levelText.setText(`Furnace Lv: ${stats.level}`);
    
    if (statusMessage) {
        this.statusText.setText(statusMessage);
    }
  }

  public updateProgressionText(text: string) {
      this.statsText.setText(text);
  }

  public showStatus(msg: string, duration: number = 1000) {
      this.statusText.setText(msg);
      if(duration > 0) {
          this.scene.time.delayedCall(duration, () => this.statusText.setText(''));
      }
  }

  public updateBlizzardButton(isActive: boolean, clicks: number, needed: number) {
      if(isActive) {
          this.stokeFireBtn.setVisible(true);
          const btnText = this.stokeFireBtn.list[1] as Phaser.GameObjects.Text;
          btnText.setText(`STOKE FIRE! (${clicks}/${needed})`);
          
          const btnBg = this.stokeFireBtn.list[0] as Phaser.GameObjects.Rectangle;
          btnBg.setFillStyle(clicks >= needed ? 0x00FF00 : 0xFF4500);
      } else {
          this.stokeFireBtn.setVisible(false);
      }
  }

  public checkButtonsVisibility(
      isGameOver: boolean, 
      furnaceLevel: number, 
      distToFurnace: number,
      townWood: number,
      snowCount: number,
      hasSpear: boolean,
      hasHut: boolean,
      hasWorker: boolean,
      isPlacingIgloo: boolean,
      costs: { upgrade: number, spear: number, hut: number, igloo: number }
  ) {
    if (isGameOver) {
        this.upgradeBtn.setVisible(false);
        this.spearBtn.setVisible(false);
        this.hutBtn.setVisible(false);
        return;
    }

    const nearFurnace = distToFurnace < 120;
    
    // Upgrade Button
    if (furnaceLevel < 2 && nearFurnace && townWood >= costs.upgrade) {
        this.upgradeBtn.setVisible(true);
    } else {
        this.upgradeBtn.setVisible(false);
    }

    // Spear Button
    if (furnaceLevel >= 2 && !hasSpear) {
        this.spearBtn.setVisible(true);
        const bg = this.spearBtn.list[0] as Phaser.GameObjects.Rectangle;
        if (townWood < costs.spear) {
            bg.setFillStyle(0x7f8c8d);
            this.spearBtn.disableInteractive();
        } else {
            bg.setFillStyle(0x3498db);
            this.spearBtn.setInteractive(new Phaser.Geom.Rectangle(-80, -20, 160, 40), Phaser.Geom.Rectangle.Contains);
        }
    } else {
        this.spearBtn.setVisible(false);
    }

    // Hut Button
    if (furnaceLevel >= 2) {
        this.hutBtn.setVisible(true);
        const txt = this.hutBtn.list[1] as Phaser.GameObjects.Text;
        const bg = this.hutBtn.list[0] as Phaser.GameObjects.Rectangle;
        
        if (!hasHut) {
             txt.setText(`Build Hut (${costs.hut})`);
             if (townWood < costs.hut) {
                 bg.setFillStyle(0x7f8c8d);
                 this.hutBtn.disableInteractive();
             } else {
                 bg.setFillStyle(0xf1c40f);
                 this.hutBtn.setInteractive(new Phaser.Geom.Rectangle(-80, -20, 160, 40), Phaser.Geom.Rectangle.Contains);
             }
        } else if (!hasWorker) {
             txt.setText(`Hire Worker (50)`);
             if (townWood < 50) {
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

    // Igloo Button
    if (!isPlacingIgloo) {
        this.iglooBtn.setVisible(true);
        const iglooBg = this.iglooBtn.list[0] as Phaser.GameObjects.Rectangle;
        if (snowCount < costs.igloo) {
            iglooBg.setFillStyle(0x7f8c8d);
            this.iglooBtn.disableInteractive();
        } else {
            iglooBg.setFillStyle(0x00CED1);
            this.iglooBtn.setInteractive(new Phaser.Geom.Rectangle(-80, -20, 160, 40), Phaser.Geom.Rectangle.Contains);
        }
    } else {
        this.iglooBtn.setVisible(false);
    }
  }

  // --- Internal Helpers ---

  private createButton(x: number, y: number, label: string, color: number, callback: () => void) {
    const container = this.scene.add.container(x, y);
    const bg = this.scene.add.rectangle(0, 0, 160, 40, color).setStrokeStyle(2, 0xffffff);
    const text = this.scene.add.text(0, 0, label, { fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    container.add([bg, text]);
    container.setSize(160, 40);
    container.setInteractive(new Phaser.Geom.Rectangle(-80, -20, 160, 40), Phaser.Geom.Rectangle.Contains);
    container.on('pointerdown', (p: any, lx: any, ly: any, e: any) => {
        if (e) e.stopPropagation();
        callback();
    });
    return container;
  }

  private createMeatTexture() {
    const g = this.scene.make.graphics({x:0,y:0});
    g.fillStyle(0xC0392B); g.fillCircle(8,8,8); g.fillStyle(0xE74C3C); g.fillCircle(6,6,3);
    g.generateTexture('meat', 16, 16);
    g.destroy();
  }
}