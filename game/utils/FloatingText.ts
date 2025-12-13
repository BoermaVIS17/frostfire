import Phaser from 'phaser';

export default class FloatingText {
  /**
   * Creates floating text that rises and fades out
   * @param scene - The Phaser scene
   * @param x - X position
   * @param y - Y position
   * @param text - Text to display
   * @param color - Text color (hex string)
   * @param fontSize - Font size (default: 20px)
   */
  static create(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    color: string = '#ffffff',
    fontSize: number = 20
  ): Phaser.GameObjects.Text {
    const floatingText = scene.add.text(x, y, text, {
      fontSize: `${fontSize}px`,
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });

    floatingText.setOrigin(0.5);
    floatingText.setDepth(100);

    // Animate: rise up and fade out
    scene.tweens.add({
      targets: floatingText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        floatingText.destroy();
      },
    });

    // Add slight random horizontal drift
    scene.tweens.add({
      targets: floatingText,
      x: x + Phaser.Math.Between(-10, 10),
      duration: 1000,
      ease: 'Sine.easeInOut',
    });

    return floatingText;
  }

  /**
   * Creates damage number with bounce effect
   */
  static createDamage(
    scene: Phaser.Scene,
    x: number,
    y: number,
    damage: number
  ): Phaser.GameObjects.Text {
    const damageText = scene.add.text(x, y, `-${damage}`, {
      fontSize: '28px',
      color: '#ff4444',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    });

    damageText.setOrigin(0.5);
    damageText.setDepth(100);
    damageText.setScale(0);

    // Pop in with scale
    scene.tweens.add({
      targets: damageText,
      scale: 1.5,
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Then float up and fade
        scene.tweens.add({
          targets: damageText,
          y: y - 60,
          scale: 1,
          alpha: 0,
          duration: 800,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            damageText.destroy();
          },
        });
      },
    });

    return damageText;
  }

  /**
   * Creates resource gain text with icon
   */
  static createResource(
    scene: Phaser.Scene,
    x: number,
    y: number,
    amount: number,
    resourceName: string,
    color: string = '#8B4513'
  ): Phaser.GameObjects.Text {
    const text = `+${amount} ${resourceName}`;
    const resourceText = scene.add.text(x, y, text, {
      fontSize: '22px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });

    resourceText.setOrigin(0.5);
    resourceText.setDepth(100);
    resourceText.setScale(0.5);

    // Bounce in
    scene.tweens.add({
      targets: resourceText,
      scale: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        // Float up
        scene.tweens.add({
          targets: resourceText,
          y: y - 40,
          alpha: 0,
          duration: 1000,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            resourceText.destroy();
          },
        });
      },
    });

    return resourceText;
  }

  /**
   * Creates critical hit text with extra emphasis
   */
  static createCritical(
    scene: Phaser.Scene,
    x: number,
    y: number,
    damage: number
  ): Phaser.GameObjects.Text {
    const critText = scene.add.text(x, y, `CRITICAL!\n-${damage}`, {
      fontSize: '32px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#ff0000',
      strokeThickness: 6,
      align: 'center',
    });

    critText.setOrigin(0.5);
    critText.setDepth(100);
    critText.setScale(0);

    // Dramatic entrance
    scene.tweens.add({
      targets: critText,
      scale: 2,
      duration: 200,
      ease: 'Elastic.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: critText,
          y: y - 70,
          scale: 1.5,
          alpha: 0,
          duration: 1000,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            critText.destroy();
          },
        });
      },
    });

    return critText;
  }
}
