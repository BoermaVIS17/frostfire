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
  private isGathering: boolean = false;
  private isAttacking: boolean = false;
  private currentDirection: string = 'down';

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

  public update() {
    if (this.isGathering || this.isAttacking) {
      this.setVelocity(0, 0);
      return;
    }

    this.handleMovement();
    this.handleGatherInput();
  }

  private handleMovement() {
    let velocityX = 0;
    let velocityY = 0;

    // Check WASD keys
    if (this.wasdKeys.A.isDown || this.cursors.left.isDown) {
      velocityX = -this.moveSpeed;
    } else if (this.wasdKeys.D.isDown || this.cursors.right.isDown) {
      velocityX = this.moveSpeed;
    }

    if (this.wasdKeys.W.isDown || this.cursors.up.isDown) {
      velocityY = -this.moveSpeed;
    } else if (this.wasdKeys.S.isDown || this.cursors.down.isDown) {
      velocityY = this.moveSpeed;
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
}
