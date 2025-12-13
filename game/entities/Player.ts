import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private scene: Phaser.Scene;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private moveSpeed: number = 200;
  private dashSpeed: number = 400;
  private isGathering: boolean = false;
  private isAttacking: boolean = false;
  private isDashing: boolean = false;
  private dashDuration: number = 200; // ms
  private dashTimer: number = 0;
  private currentDirection: string = 'down';
  
  // Touch control support
  private touchVelocityX: number = 0;
  private touchVelocityY: number = 0;
  private useTouchControls: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player_idle_down');
    this.scene = scene;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setCollideWorldBounds(true);
    this.setBodySize(24, 24);
    this.setOffset(4, 8);
    this.setDepth(5);

    this.setupInput();
    this.createAnimations();
  }

  private setupInput() {
    if (this.scene.input.keyboard) {
      this.cursors = this.scene.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
  }

  private createAnimations() {
    const anims = this.scene.anims;

    // Idle animations
    if (!anims.exists('player_idle_down')) {
      anims.create({
        key: 'player_idle_down',
        frames: [{ key: 'player_front' }],
        frameRate: 1,
      });
    }

    if (!anims.exists('player_idle_up')) {
      anims.create({
        key: 'player_idle_up',
        frames: [{ key: 'player_back' }],
        frameRate: 1,
      });
    }

    if (!anims.exists('player_idle_left')) {
      anims.create({
        key: 'player_idle_left',
        frames: [{ key: 'player_left' }],
        frameRate: 1,
      });
    }

    if (!anims.exists('player_idle_right')) {
      anims.create({
        key: 'player_idle_right',
        frames: [{ key: 'player_right' }],
        frameRate: 1,
      });
    }

    // Walk animations (using bob effect in update instead)
    if (!anims.exists('player_walk_down')) {
      anims.create({
        key: 'player_walk_down',
        frames: [{ key: 'player_front' }],
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!anims.exists('player_walk_up')) {
      anims.create({
        key: 'player_walk_up',
        frames: [{ key: 'player_back' }],
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!anims.exists('player_walk_left')) {
      anims.create({
        key: 'player_walk_left',
        frames: [{ key: 'player_left' }],
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!anims.exists('player_walk_right')) {
      anims.create({
        key: 'player_walk_right',
        frames: [{ key: 'player_right' }],
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  public update(delta?: number) {
    // Update dash timer
    if (this.isDashing && delta) {
      this.dashTimer += delta;
      if (this.dashTimer >= this.dashDuration) {
        this.isDashing = false;
        this.dashTimer = 0;
      }
    }

    if (this.isGathering || this.isAttacking) {
      this.setVelocity(0, 0);
      return;
    }

    let velocityX = 0;
    let velocityY = 0;

    // Check if using touch controls
    if (this.useTouchControls && (this.touchVelocityX !== 0 || this.touchVelocityY !== 0)) {
      velocityX = this.touchVelocityX;
      velocityY = this.touchVelocityY;
    } else {
      // WASD keys
      if (this.wasdKeys.W.isDown || this.cursors.up.isDown) {
        velocityY = -1;
      } else if (this.wasdKeys.S.isDown || this.cursors.down.isDown) {
        velocityY = 1;
      }

      if (this.wasdKeys.A.isDown || this.cursors.left.isDown) {
        velocityX = -1;
      } else if (this.wasdKeys.D.isDown || this.cursors.right.isDown) {
        velocityX = 1;
      }
    }

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= 0.707;
      velocityY *= 0.707;
    }

    this.setVelocity(velocityX, velocityY);

    // Update animations based on movement
    if (velocityX !== 0 || velocityY !== 0) {
      // Determine primary direction
      if (Math.abs(velocityX) > Math.abs(velocityY)) {
        if (velocityX < 0) {
          this.currentDirection = 'left';
          this.play('player_walk_left', true);
        } else {
          this.currentDirection = 'right';
          this.play('player_walk_right', true);
        }
      } else {
        if (velocityY < 0) {
          this.currentDirection = 'up';
          this.play('player_walk_up', true);
        } else {
          this.currentDirection = 'down';
          this.play('player_walk_down', true);
        }
      }
    } else {
      // Idle animation
      this.play(`player_idle_${this.currentDirection}`, true);
    }
  }

  private handleGatherInput() {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.triggerGather();
    }
  }

  public triggerGather() {
    if (this.isGathering) return;
    
    this.isGathering = true;
    this.setVelocity(0, 0);
    
    // Visual feedback - slight scale animation
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.isGathering = false;
      }
    });

    // Emit gather event
    this.scene.events.emit('player-gather', this.x, this.y);
  }

  public triggerAttack(targetX: number, targetY: number) {
    if (this.isAttacking) return;
    
    this.isAttacking = true;
    this.setVelocity(0, 0);

    // Calculate attack direction
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    
    // Quick lunge in attack direction
    this.scene.tweens.add({
      targets: this,
      x: this.x + Math.cos(angle) * 15,
      y: this.y + Math.sin(angle) * 15,
      duration: 150,
      yoyo: true,
      onComplete: () => {
        this.isAttacking = false;
      }
    });

    // Emit attack event
    this.scene.events.emit('player-attack', targetX, targetY, angle);
  }

  public getIsGathering(): boolean {
    return this.isGathering;
  }

  public getIsAttacking(): boolean {
    return this.isAttacking;
  }

  public getCurrentDirection(): string {
    return this.currentDirection;
  }

  // Touch control methods
  public setTouchVelocity(x: number, y: number) {
    this.touchVelocityX = x;
    this.touchVelocityY = y;
  }

  public enableTouchControls(enabled: boolean) {
    this.useTouchControls = enabled;
  }

  public triggerDash() {
    if (this.isDashing) return;
    
    this.isDashing = true;
    this.dashTimer = 0;
    
    // Get current movement direction or use facing direction
    let dashX = this.touchVelocityX || 0;
    let dashY = this.touchVelocityY || 0;
    
    // If not moving, dash in facing direction
    if (dashX === 0 && dashY === 0) {
      switch (this.currentDirection) {
        case 'up': dashY = -1; break;
        case 'down': dashY = 1; break;
        case 'left': dashX = -1; break;
        case 'right': dashX = 1; break;
      }
    }
    
    // Normalize
    const length = Math.sqrt(dashX * dashX + dashY * dashY);
    if (length > 0) {
      dashX /= length;
      dashY /= length;
    }
    
    // Apply dash velocity
    const dashDistance = 100;
    this.scene.tweens.add({
      targets: this,
      x: this.x + dashX * dashDistance,
      y: this.y + dashY * dashDistance,
      duration: this.dashDuration,
      ease: 'Power2',
    });
    
    // Visual effect - afterimage
    const afterimage = this.scene.add.sprite(this.x, this.y, this.texture.key);
    afterimage.setAlpha(0.5);
    afterimage.setTint(0x00BFFF);
    afterimage.setDepth(this.depth - 1);
    
    this.scene.tweens.add({
      targets: afterimage,
      alpha: 0,
      duration: this.dashDuration,
      onComplete: () => afterimage.destroy(),
    });
  }
}
