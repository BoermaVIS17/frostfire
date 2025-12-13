import Phaser from 'phaser';

export default class ParticleEffects {
  /**
   * Creates wood chip particles when chopping trees
   */
  static createWoodChips(
    scene: Phaser.Scene,
    x: number,
    y: number
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    // Create wood chip texture if it doesn't exist
    if (!scene.textures.exists('wood_chip')) {
      const graphics = scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0x8B4513);
      graphics.fillRect(0, 0, 4, 4);
      graphics.generateTexture('wood_chip', 4, 4);
      graphics.destroy();
    }

    const emitter = scene.add.particles(x, y, 'wood_chip', {
      speed: { min: 100, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      gravityY: 300,
      quantity: 15,
      tint: [0x8B4513, 0xA0522D, 0xD2691E],
      emitting: false,
    });

    emitter.explode();

    scene.time.delayedCall(1000, () => {
      emitter.destroy();
    });

    return emitter;
  }

  /**
   * Creates blood splatter particles when hitting bear
   */
  static createBloodSplatter(
    scene: Phaser.Scene,
    x: number,
    y: number
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    // Create blood particle texture if it doesn't exist
    if (!scene.textures.exists('blood_particle')) {
      const graphics = scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0x8B0000);
      graphics.fillCircle(3, 3, 3);
      graphics.generateTexture('blood_particle', 6, 6);
      graphics.destroy();
    }

    const emitter = scene.add.particles(x, y, 'blood_particle', {
      speed: { min: 80, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0.3 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      gravityY: 200,
      quantity: 12,
      tint: [0x8B0000, 0xDC143C, 0xFF0000],
      emitting: false,
    });

    emitter.explode();

    scene.time.delayedCall(800, () => {
      emitter.destroy();
    });

    return emitter;
  }

  /**
   * Creates impact particles for general hits
   */
  static createImpact(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: number = 0xFFFFFF
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    if (!scene.textures.exists('impact_particle')) {
      const graphics = scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xFFFFFF);
      graphics.fillCircle(2, 2, 2);
      graphics.generateTexture('impact_particle', 4, 4);
      graphics.destroy();
    }

    const emitter = scene.add.particles(x, y, 'impact_particle', {
      speed: { min: 50, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 8,
      tint: color,
      emitting: false,
    });

    emitter.explode();

    scene.time.delayedCall(600, () => {
      emitter.destroy();
    });

    return emitter;
  }

  /**
   * Creates sparkle effect for collecting items
   */
  static createSparkle(
    scene: Phaser.Scene,
    x: number,
    y: number
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    if (!scene.textures.exists('sparkle_particle')) {
      const graphics = scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xFFFF00);
      graphics.fillCircle(3, 3, 3);
      graphics.generateTexture('sparkle_particle', 6, 6);
      graphics.destroy();
    }

    const emitter = scene.add.particles(x, y, 'sparkle_particle', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      gravityY: -50,
      quantity: 10,
      tint: [0xFFFF00, 0xFFD700, 0xFFA500],
      emitting: false,
    });

    emitter.explode();

    scene.time.delayedCall(800, () => {
      emitter.destroy();
    });

    return emitter;
  }

  /**
   * Creates smoke puff effect
   */
  static createSmoke(
    scene: Phaser.Scene,
    x: number,
    y: number
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    if (!scene.textures.exists('smoke_particle')) {
      const graphics = scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0x888888);
      graphics.fillCircle(4, 4, 4);
      graphics.generateTexture('smoke_particle', 8, 8);
      graphics.destroy();
    }

    const emitter = scene.add.particles(x, y, 'smoke_particle', {
      speed: { min: 20, max: 50 },
      angle: { min: 260, max: 280 },
      scale: { start: 0.5, end: 1.5 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 800,
      gravityY: -30,
      quantity: 5,
      tint: [0x888888, 0xAAAAAA, 0xCCCCCC],
      emitting: false,
    });

    emitter.explode();

    scene.time.delayedCall(1000, () => {
      emitter.destroy();
    });

    return emitter;
  }

  /**
   * Creates healing/positive effect particles
   */
  static createHeal(
    scene: Phaser.Scene,
    x: number,
    y: number
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    if (!scene.textures.exists('heal_particle')) {
      const graphics = scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0x00FF00);
      graphics.fillCircle(3, 3, 3);
      graphics.generateTexture('heal_particle', 6, 6);
      graphics.destroy();
    }

    const emitter = scene.add.particles(x, y, 'heal_particle', {
      speed: { min: 20, max: 60 },
      angle: { min: 260, max: 280 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1000,
      gravityY: -80,
      quantity: 15,
      tint: [0x00FF00, 0x00FF88, 0x88FF88],
      emitting: false,
    });

    emitter.explode();

    scene.time.delayedCall(1200, () => {
      emitter.destroy();
    });

    return emitter;
  }
}
