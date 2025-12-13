import Phaser from 'phaser';

export default class VirtualJoystick {
  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Graphics;
  private thumb: Phaser.GameObjects.Graphics;
  private baseX: number;
  private baseY: number;
  private thumbX: number;
  private thumbY: number;
  private radius: number = 60;
  private thumbRadius: number = 30;
  private isActive: boolean = false;
  private pointer: Phaser.Input.Pointer | null = null;
  
  // Output values
  private velocityX: number = 0;
  private velocityY: number = 0;
  private angle: number = 0;
  private force: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;
    this.thumbX = x;
    this.thumbY = y;

    // Create base circle (outer ring)
    this.base = scene.add.graphics();
    this.base.setDepth(1000);
    this.base.setScrollFactor(0);
    this.drawBase();

    // Create thumb circle (inner movable part)
    this.thumb = scene.add.graphics();
    this.thumb.setDepth(1001);
    this.thumb.setScrollFactor(0);
    this.drawThumb();

    // Set up touch events
    this.setupInput();
  }

  private drawBase() {
    this.base.clear();
    this.base.lineStyle(4, 0xFFFFFF, 0.5);
    this.base.strokeCircle(this.baseX, this.baseY, this.radius);
    this.base.fillStyle(0x000000, 0.3);
    this.base.fillCircle(this.baseX, this.baseY, this.radius);
  }

  private drawThumb() {
    this.thumb.clear();
    this.thumb.fillStyle(0xFFFFFF, 0.8);
    this.thumb.fillCircle(this.thumbX, this.thumbY, this.thumbRadius);
    this.thumb.lineStyle(2, 0x00FF00, 1);
    this.thumb.strokeCircle(this.thumbX, this.thumbY, this.thumbRadius);
  }

  private setupInput() {
    this.scene.input.on('pointerdown', this.onPointerDown, this);
    this.scene.input.on('pointermove', this.onPointerMove, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    // Check if touch is within joystick area (left side of screen)
    if (pointer.x < 200 && pointer.y > this.scene.scale.height - 200) {
      this.isActive = true;
      this.pointer = pointer;
      
      // Move base to touch location for better UX
      this.baseX = pointer.x;
      this.baseY = pointer.y;
      this.thumbX = pointer.x;
      this.thumbY = pointer.y;
      
      this.drawBase();
      this.drawThumb();
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (this.isActive && this.pointer === pointer) {
      // Calculate distance from base
      const dx = pointer.x - this.baseX;
      const dy = pointer.y - this.baseY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Constrain thumb within base radius
      if (distance < this.radius) {
        this.thumbX = pointer.x;
        this.thumbY = pointer.y;
      } else {
        // Clamp to edge of base
        const angle = Math.atan2(dy, dx);
        this.thumbX = this.baseX + Math.cos(angle) * this.radius;
        this.thumbY = this.baseY + Math.sin(angle) * this.radius;
      }

      // Calculate normalized velocity (-1 to 1)
      const normalizedDist = Math.min(distance, this.radius) / this.radius;
      this.angle = Math.atan2(dy, dx);
      this.force = normalizedDist;
      this.velocityX = Math.cos(this.angle) * this.force;
      this.velocityY = Math.sin(this.angle) * this.force;

      this.drawThumb();
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (this.pointer === pointer) {
      this.isActive = false;
      this.pointer = null;
      
      // Reset thumb to center
      this.thumbX = this.baseX;
      this.thumbY = this.baseY;
      this.velocityX = 0;
      this.velocityY = 0;
      this.force = 0;
      
      this.drawThumb();
    }
  }

  public getVelocityX(): number {
    return this.velocityX;
  }

  public getVelocityY(): number {
    return this.velocityY;
  }

  public getAngle(): number {
    return this.angle;
  }

  public getForce(): number {
    return this.force;
  }

  public isPressed(): boolean {
    return this.isActive;
  }

  public setVisible(visible: boolean) {
    this.base.setVisible(visible);
    this.thumb.setVisible(visible);
  }

  public destroy() {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.base.destroy();
    this.thumb.destroy();
  }
}
