# Frozen Fortune - Death & Respawn System 💀🔥

## Overview
Complete death and respawn system where players lose all items and respawn at the furnace when health reaches 0. Adds consequence to combat and survival failures while keeping the game accessible.

---

## ✅ Death System

### Death Triggers

**Health Reaches 0:**
```typescript
if (playerHealth <= 0) {
  triggerDeath();
}
```

**Death Sources:**
1. **Bear Attacks** - 20 damage per hit
2. **Freezing** - 5 HP/second at 0% temperature
3. **Blizzard Exposure** - 2 HP/second during storms
4. **Starvation** (future) - Low food meter

### Death Sequence

```
1. Player health reaches 0
2. Screen fades to black (1 second)
3. Death screen appears
4. Show death message and stats
5. Player clicks "Respawn" button
6. Screen fades back in
7. Player respawns at furnace
8. All items reset to 0
9. Health restored to 100
10. Temperature restored to 100
```

---

## 🔥 Respawn System

### Respawn Location

**Always at Furnace:**
- X: 300 (furnace location)
- Y: 350 (furnace location)
- Consistent spawn point
- Safe starting area
- Near resources

### Respawn State

**Player Stats Reset:**
```typescript
playerHealth = 100 (full HP)
temperature = 100 (warm)
```

**Inventory Wiped:**
```typescript
woodCount = 0
meatCount = 0
stoneCount = 0
ironCount = 0 (future)
```

**Buildings/Upgrades Preserved:**
```typescript
hasSpear = KEPT
hasHut = KEPT
hutType = KEPT
hutHealth = KEPT
furnaceLevel = KEPT
hasQuarry = KEPT
```

**Progression Preserved:**
```typescript
daysSurvived = KEPT
totalWoodGathered = KEPT
totalMeatCollected = KEPT
totalStoneGathered = KEPT
bearsKilled = KEPT
achievements = KEPT
```

---

## 💀 Death Screen

### Visual Design

**Background:**
- Black overlay (0.9 alpha)
- Red vignette edges
- Skull icon (💀)

**Title:**
```
"YOU DIED"
Font: 48px Bold
Color: Red (#FF0000)
Position: Center top
```

**Death Message:**
```
"Killed by: Bear" / "Froze to Death" / "Died in Blizzard"
Font: 24px
Color: White
Position: Below title
```

**Stats Display:**
```
Days Survived: X
Items Lost:
  - Wood: X
  - Meat: X
  - Stone: X
  
Buildings Preserved:
  - Stick/Stone Home
  - Spear
  - Quarry
```

**Respawn Button:**
```
Text: "RESPAWN AT FURNACE"
Size: 200x60 pixels
Color: Orange (#FF8C00)
Position: Center bottom
Hover: Glow effect
```

### Mobile Design

**Touch-Friendly:**
- Large respawn button (250x80)
- Clear tap target
- No keyboard required
- Auto-focus on button

---

## 🎮 Death Penalties

### What You Lose

**All Resources:**
- ❌ Wood (all)
- ❌ Meat (all)
- ❌ Stone (all)
- ❌ Iron (all, future)

**Temporary Progress:**
- ❌ Current gathering streak
- ❌ Inventory contents
- ❌ Position in world

### What You Keep

**Permanent Upgrades:**
- ✅ Furnace level
- ✅ Spear (if crafted)
- ✅ Hut/Home (if built)
- ✅ Quarry (if built)
- ✅ Building health

**Progression Stats:**
- ✅ Days survived
- ✅ Total resources gathered
- ✅ Bears killed
- ✅ Achievements
- ✅ High scores

### Strategic Impact

**Risk vs Reward:**
- Carrying many resources = high risk
- Deposit resources before risky actions
- Build storage for safety (future)
- Don't hoard unnecessarily

**Death Recovery:**
- Respawn with nothing
- Must re-gather resources
- Buildings still functional
- Workers still active
- Can recover quickly

---

## 📊 Death Statistics

### Tracking Deaths

**SaveManager Integration:**
```typescript
interface ProgressionData {
  totalDeaths: number;
  deathsByBear: number;
  deathsByFreezing: number;
  deathsByBlizzard: number;
  longestSurvival: number;
}
```

**Death Counter:**
- Track total deaths
- Track death causes
- Show on game over screen
- Include in progression stats

### Achievements (Future)

**Death-Related:**
- "First Blood" - Die for the first time
- "Survivor" - Survive 10 days without dying
- "Immortal" - Survive 50 days without dying
- "Phoenix" - Respawn 10 times
- "Bear Slayer" - Kill 5 bears without dying

---

## 🎨 Visual Feedback

### Death Animation

**Player Death:**
```typescript
1. Player sprite turns red
2. Fade to 0 alpha (500ms)
3. Collapse animation
4. Particle burst (red/black)
5. Screen shake
6. Sound effect (death sound)
```

**Screen Transition:**
```typescript
1. Red flash (100ms)
2. Fade to black (1000ms)
3. Show death screen
4. Fade in death UI (500ms)
```

### Respawn Animation

**Spawn Effect:**
```typescript
1. White flash at furnace
2. Player fades in (0 → 1 alpha)
3. Sparkle particles
4. Glow effect
5. Sound effect (respawn chime)
```

**Camera:**
```typescript
1. Fade from black (1000ms)
2. Center on furnace
3. Zoom in slightly
4. Zoom back to normal
```

---

## 🔧 Implementation

### MainScene Integration

```typescript
// Death detection
update(delta: number) {
  if (this.playerHealth <= 0 && !this.isDead) {
    this.triggerDeath();
  }
}

// Death trigger
private triggerDeath() {
  this.isDead = true;
  this.physics.pause(); // Stop game
  
  // Death animation
  this.player.setTint(0xFF0000);
  this.cameras.main.shake(500, 0.02);
  
  this.tweens.add({
    targets: this.player,
    alpha: 0,
    duration: 500,
    onComplete: () => {
      this.showDeathScreen();
    }
  });
  
  // Particle burst
  ParticleEffects.createDeathBurst(this, this.player.x, this.player.y);
  
  // Track death
  this.trackDeath();
}

// Show death screen
private showDeathScreen() {
  // Fade to black
  const blackOverlay = this.add.rectangle(
    this.cameras.main.centerX,
    this.cameras.main.centerY,
    this.scale.width,
    this.scale.height,
    0x000000,
    0
  );
  blackOverlay.setDepth(1000);
  blackOverlay.setScrollFactor(0);
  
  this.tweens.add({
    targets: blackOverlay,
    alpha: 0.9,
    duration: 1000,
    onComplete: () => {
      this.createDeathUI();
    }
  });
}

// Create death UI
private createDeathUI() {
  const centerX = this.cameras.main.centerX;
  const centerY = this.cameras.main.centerY;
  
  // Title
  const title = this.add.text(centerX, centerY - 150, 'YOU DIED', {
    fontSize: '48px',
    color: '#FF0000',
    fontStyle: 'bold',
  });
  title.setOrigin(0.5);
  title.setDepth(1001);
  title.setScrollFactor(0);
  
  // Death cause
  const cause = this.add.text(centerX, centerY - 80, 
    `Killed by: ${this.deathCause}`, {
    fontSize: '24px',
    color: '#FFFFFF',
  });
  cause.setOrigin(0.5);
  cause.setDepth(1001);
  cause.setScrollFactor(0);
  
  // Stats
  const stats = this.add.text(centerX, centerY - 20, 
    `Days Survived: ${this.daysSurvived}\n\nItems Lost:\n  Wood: ${this.woodCount}\n  Meat: ${this.meatCount}\n  Stone: ${this.stoneCount}`, {
    fontSize: '18px',
    color: '#FFFFFF',
    align: 'center',
  });
  stats.setOrigin(0.5);
  stats.setDepth(1001);
  stats.setScrollFactor(0);
  
  // Respawn button
  const button = this.add.rectangle(centerX, centerY + 150, 200, 60, 0xFF8C00);
  button.setDepth(1001);
  button.setScrollFactor(0);
  button.setInteractive({ useHandCursor: true });
  
  const buttonText = this.add.text(centerX, centerY + 150, 'RESPAWN', {
    fontSize: '24px',
    color: '#FFFFFF',
    fontStyle: 'bold',
  });
  buttonText.setOrigin(0.5);
  buttonText.setDepth(1002);
  buttonText.setScrollFactor(0);
  
  button.on('pointerdown', () => {
    this.respawnPlayer();
  });
  
  button.on('pointerover', () => {
    button.setFillStyle(0xFFAA00);
  });
  
  button.on('pointerout', () => {
    button.setFillStyle(0xFF8C00);
  });
}

// Respawn player
private respawnPlayer() {
  // Clear death UI
  this.children.list.forEach(child => {
    if (child.depth >= 1000) {
      child.destroy();
    }
  });
  
  // Reset player state
  this.playerHealth = 100;
  this.temperature = 100;
  this.playerHealthBar.setHealth(100);
  
  // Reset inventory
  this.woodCount = 0;
  this.meatCount = 0;
  this.stoneCount = 0;
  this.updateResourceUI();
  
  // Respawn at furnace
  this.player.setPosition(300, 350);
  this.player.setAlpha(0);
  this.player.clearTint();
  
  // Fade in
  this.tweens.add({
    targets: this.player,
    alpha: 1,
    duration: 1000,
  });
  
  // Spawn effect
  ParticleEffects.createRespawnEffect(this, 300, 350);
  
  // Resume game
  this.isDead = false;
  this.physics.resume();
  
  // Camera fade in
  this.cameras.main.fadeIn(1000);
}

// Track death
private trackDeath() {
  const progression = SaveManager.loadProgression();
  progression.totalDeaths = (progression.totalDeaths || 0) + 1;
  
  // Track by cause
  if (this.deathCause === 'Bear') {
    progression.deathsByBear = (progression.deathsByBear || 0) + 1;
  } else if (this.deathCause === 'Freezing') {
    progression.deathsByFreezing = (progression.deathsByFreezing || 0) + 1;
  } else if (this.deathCause === 'Blizzard') {
    progression.deathsByBlizzard = (progression.deathsByBlizzard || 0) + 1;
  }
  
  SaveManager.saveProgression(progression);
}
```

---

## 📱 Mobile Support

### Touch Controls

**Respawn Button:**
- Large tap target (250x80)
- Clear visual feedback
- No keyboard needed
- Auto-focus on appear

**Death Screen:**
- Full-screen overlay
- Tap anywhere to focus
- Swipe-proof (no accidental dismiss)
- Clear instructions

---

## 🎯 Balancing

### Death Penalty Severity

**Harsh:**
- ❌ Lose ALL resources
- ❌ Lose position
- ❌ Lose current progress

**Fair:**
- ✅ Keep buildings
- ✅ Keep upgrades
- ✅ Keep progression stats
- ✅ Keep achievements

**Recovery Time:**
```
From death to functional:
- 0 minutes: Respawn
- 2 minutes: Gather 10 wood
- 5 minutes: Gather 20 stone
- 10 minutes: Back to pre-death state

Conclusion: Reasonable penalty, not game-ending
```

### Risk Management

**Before Risky Actions:**
1. Deposit resources at home
2. Ensure full health
3. Have escape route
4. Know respawn location

**Resource Hoarding:**
- Don't carry everything
- Use buildings as storage
- Spend resources on upgrades
- Death penalty encourages spending

---

## 🔄 Death Loop Prevention

### Anti-Frustration Features

**Respawn Safety:**
- Always at furnace (safe area)
- Full health restored
- Full temperature restored
- No immediate threats

**Quick Recovery:**
- Trees near furnace
- Rocks in wilderness
- Workers still active
- Buildings still functional

**Progression Preserved:**
- Don't lose days survived
- Don't lose total stats
- Don't lose achievements
- Don't lose buildings

### Soft Respawn (Future)

**Optional Easy Mode:**
- Keep 50% of resources
- Respawn at home instead
- Reduced death penalty
- For casual players

---

## 📝 Summary

### What This Adds
✅ **Death detection** - Health reaches 0
✅ **Death screen** - Stats and respawn button
✅ **Respawn system** - At furnace location
✅ **Inventory wipe** - Lose all resources
✅ **Building preservation** - Keep upgrades
✅ **Progression tracking** - Track deaths
✅ **Visual feedback** - Death and respawn animations
✅ **Mobile support** - Touch-friendly UI

### Player Experience
- **Consequence** - Death matters
- **Fair penalty** - Lose items, keep progress
- **Quick recovery** - Back in game fast
- **Risk management** - Strategic decisions
- **Progression** - Buildings make death less punishing

**Frozen Fortune now has a complete death and respawn system!** Players lose all resources but respawn at the furnace with full health. Buildings and progression are preserved, making death a setback but not game-ending. 💀🔥✨
