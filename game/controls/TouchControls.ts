import Phaser from 'phaser';
import VirtualJoystick from './VirtualJoystick';

export default class TouchControls {
  private scene: Phaser.Scene;
  private joystick: VirtualJoystick;
  
  // Action buttons
  private actionButton: Phaser.GameObjects.Container;
  private buildButton: Phaser.GameObjects.Container;
  private dashButton: Phaser.GameObjects.Container;
  
  // Build menu
  private buildMenu: Phaser.GameObjects.Container | null = null;
  private buildMenuOpen: boolean = false;
  
  // Dash mechanic
  private lastTapTime: number = 0;
  private doubleTapDelay: number = 300; // ms
  private isDashing: boolean = false;
  private dashCooldown: number = 0;
  private dashCooldownTime: number = 1000; // 1 second cooldown

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Create virtual joystick (bottom-left)
    this.joystick = new VirtualJoystick(scene, 100, scene.scale.height - 100);
    
    // Create action buttons (bottom-right)
    this.actionButton = this.createActionButton();
    this.buildButton = this.createBuildButton();
    this.dashButton = this.createDashButton();
    
    // Set up double-tap detection for dash
    this.setupDoubleTap();
  }

  private createActionButton(): Phaser.GameObjects.Container {
    const x = this.scene.scale.width - 100;
    const y = this.scene.scale.height - 100;
    
    const container = this.scene.add.container(x, y);
    container.setDepth(1000);
    container.setScrollFactor(0);
    
    // Button background
    const bg = this.scene.add.circle(0, 0, 50, 0xFF4500, 0.8);
    bg.setStrokeStyle(4, 0xFFFFFF);
    
    // Button icon (changes based on context)
    const icon = this.scene.add.text(0, 0, '⚔️', {
      fontSize: '32px',
      color: '#FFFFFF',
    });
    icon.setOrigin(0.5);
    
    // Label
    const label = this.scene.add.text(0, 60, 'ACTION', {
      fontSize: '12px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    label.setOrigin(0.5);
    
    container.add([bg, icon, label]);
    
    // Make interactive
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      this.onActionButtonPressed();
      // Visual feedback
      this.scene.tweens.add({
        targets: bg,
        scale: 0.9,
        duration: 100,
        yoyo: true,
      });
    });
    
    return container;
  }

  private createBuildButton(): Phaser.GameObjects.Container {
    const x = this.scene.scale.width - 100;
    const y = this.scene.scale.height - 220;
    
    const container = this.scene.add.container(x, y);
    container.setDepth(1000);
    container.setScrollFactor(0);
    
    // Button background
    const bg = this.scene.add.circle(0, 0, 45, 0x8B4513, 0.8);
    bg.setStrokeStyle(4, 0xFFFFFF);
    
    // Button icon
    const icon = this.scene.add.text(0, 0, '🏠', {
      fontSize: '28px',
      color: '#FFFFFF',
    });
    icon.setOrigin(0.5);
    
    // Label
    const label = this.scene.add.text(0, 55, 'BUILD', {
      fontSize: '12px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    label.setOrigin(0.5);
    
    container.add([bg, icon, label]);
    
    // Make interactive
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      this.toggleBuildMenu();
      // Visual feedback
      this.scene.tweens.add({
        targets: bg,
        scale: 0.9,
        duration: 100,
        yoyo: true,
      });
    });
    
    return container;
  }

  private createDashButton(): Phaser.GameObjects.Container {
    const x = this.scene.scale.width - 220;
    const y = this.scene.scale.height - 100;
    
    const container = this.scene.add.container(x, y);
    container.setDepth(1000);
    container.setScrollFactor(0);
    
    // Button background
    const bg = this.scene.add.circle(0, 0, 40, 0x00BFFF, 0.8);
    bg.setStrokeStyle(4, 0xFFFFFF);
    
    // Button icon
    const icon = this.scene.add.text(0, 0, '💨', {
      fontSize: '24px',
      color: '#FFFFFF',
    });
    icon.setOrigin(0.5);
    
    // Label
    const label = this.scene.add.text(0, 50, 'DASH', {
      fontSize: '12px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    label.setOrigin(0.5);
    
    container.add([bg, icon, label]);
    
    // Make interactive
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      this.onDashButtonPressed();
      // Visual feedback
      this.scene.tweens.add({
        targets: bg,
        scale: 0.9,
        duration: 100,
        yoyo: true,
      });
    });
    
    return container;
  }

  private createBuildMenu() {
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;
    
    const menu = this.scene.add.container(centerX, centerY);
    menu.setDepth(1500);
    menu.setScrollFactor(0);
    
    // Background overlay
    const overlay = this.scene.add.rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, 0x000000, 0.7);
    overlay.setOrigin(0.5);
    
    // Menu panel
    const panel = this.scene.add.rectangle(0, 0, 400, 300, 0x2C3E50, 1);
    panel.setStrokeStyle(4, 0xFFFFFF);
    
    // Title
    const title = this.scene.add.text(0, -120, 'BUILD MENU', {
      fontSize: '24px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    
    // Stick Home button
    const stickHomeBtn = this.createMenuButton(-80, -20, '🏚️ Stick Home', '30 Wood', () => {
      this.scene.events.emit('build-stick-home');
      this.closeBuildMenu();
    });
    
    // Stone Home button
    const stoneHomeBtn = this.createMenuButton(80, -20, '🏰 Stone Home', '50 Stone + 30 Wood', () => {
      this.scene.events.emit('build-stone-home');
      this.closeBuildMenu();
    });
    
    // Close button
    const closeBtn = this.scene.add.text(0, 100, 'CLOSE', {
      fontSize: '18px',
      color: '#FF0000',
      fontStyle: 'bold',
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeBuildMenu());
    
    menu.add([overlay, panel, title, stickHomeBtn, stoneHomeBtn, closeBtn]);
    
    // Fade in animation
    menu.setAlpha(0);
    this.scene.tweens.add({
      targets: menu,
      alpha: 1,
      duration: 200,
    });
    
    return menu;
  }

  private createMenuButton(x: number, y: number, text: string, cost: string, callback: () => void): Phaser.GameObjects.Container {
    const btn = this.scene.add.container(x, y);
    
    const bg = this.scene.add.rectangle(0, 0, 150, 80, 0x3498DB, 1);
    bg.setStrokeStyle(3, 0xFFFFFF);
    
    const label = this.scene.add.text(0, -15, text, {
      fontSize: '16px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    label.setOrigin(0.5);
    
    const costLabel = this.scene.add.text(0, 15, cost, {
      fontSize: '12px',
      color: '#FFD700',
    });
    costLabel.setOrigin(0.5);
    
    btn.add([bg, label, costLabel]);
    
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      callback();
      this.scene.tweens.add({
        targets: bg,
        scale: 0.95,
        duration: 100,
        yoyo: true,
      });
    });
    
    return btn;
  }

  private setupDoubleTap() {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const currentTime = Date.now();
      
      // Check if this is a double-tap
      if (currentTime - this.lastTapTime < this.doubleTapDelay) {
        // Double-tap detected - trigger dash
        this.onDashButtonPressed();
      }
      
      this.lastTapTime = currentTime;
    });
  }

  private onActionButtonPressed() {
    // Emit event for context-sensitive action
    this.scene.events.emit('mobile-action-pressed');
  }

  private toggleBuildMenu() {
    if (this.buildMenuOpen) {
      this.closeBuildMenu();
    } else {
      this.openBuildMenu();
    }
  }

  private openBuildMenu() {
    if (!this.buildMenu) {
      this.buildMenu = this.createBuildMenu();
      this.buildMenuOpen = true;
    }
  }

  private closeBuildMenu() {
    if (this.buildMenu) {
      this.scene.tweens.add({
        targets: this.buildMenu,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this.buildMenu?.destroy();
          this.buildMenu = null;
          this.buildMenuOpen = false;
        },
      });
    }
  }

  private onDashButtonPressed() {
    if (this.dashCooldown <= 0) {
      this.isDashing = true;
      this.dashCooldown = this.dashCooldownTime;
      this.scene.events.emit('mobile-dash-pressed');
      
      // Visual cooldown feedback
      const dashBg = this.dashButton.list[0] as Phaser.GameObjects.Circle;
      dashBg.setFillStyle(0x666666, 0.5);
      
      this.scene.time.delayedCall(this.dashCooldownTime, () => {
        dashBg.setFillStyle(0x00BFFF, 0.8);
      });
    }
  }

  public update(delta: number) {
    // Update dash cooldown
    if (this.dashCooldown > 0) {
      this.dashCooldown -= delta;
    }
    
    // Update action button icon based on context
    this.updateActionButtonContext();
  }

  private updateActionButtonContext() {
    const icon = this.actionButton.list[1] as Phaser.GameObjects.Text;
    const label = this.actionButton.list[2] as Phaser.GameObjects.Text;
    
    // This will be updated by the scene based on what's nearby
    // For now, default to attack icon
    // Scene can call setActionContext() to change it
  }

  public setActionContext(type: 'attack' | 'gather' | 'interact', text: string) {
    const icon = this.actionButton.list[1] as Phaser.GameObjects.Text;
    const label = this.actionButton.list[2] as Phaser.GameObjects.Text;
    
    switch (type) {
      case 'attack':
        icon.setText('⚔️');
        break;
      case 'gather':
        icon.setText('🪓');
        break;
      case 'interact':
        icon.setText('💬');
        break;
    }
    
    label.setText(text.toUpperCase());
  }

  public getJoystick(): VirtualJoystick {
    return this.joystick;
  }

  public setVisible(visible: boolean) {
    this.joystick.setVisible(visible);
    this.actionButton.setVisible(visible);
    this.buildButton.setVisible(visible);
    this.dashButton.setVisible(visible);
  }

  public destroy() {
    this.joystick.destroy();
    this.actionButton.destroy();
    this.buildButton.destroy();
    this.dashButton.destroy();
    if (this.buildMenu) {
      this.buildMenu.destroy();
    }
  }
}
