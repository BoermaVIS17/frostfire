# Frozen Fortune - Health Bars & Stone Mining System 💚⛏️

## Overview
Complete health bar system for **player**, **bears**, and **buildings**, plus **stone resource nodes** with **3-hit mining mechanics**. Visual feedback with segmented bars, color coding, and proximity-based visibility.

---

## ✅ Health Bar System

### 1. **HealthBar Utility Class** (`game/utils/HealthBar.ts`)

**Universal health bar component with:**
- Configurable size, colors, and position
- Segmented or continuous display
- Color-coded health states (green/orange/red)
- Flash effects on damage
- Background and border styling
- Easy integration with any entity

#### Configuration Options
```typescript
{
  x: number,                    // Position X
  y: number,                    // Position Y
  width: number,                // Bar width
  height: number,               // Bar height
  maxHealth: number,            // Maximum health
  currentHealth: number,        // Current health
  segmented?: boolean,          // Use segments
  segments?: number,            // Number of segments
  healthColor?: number,         // Healthy color (green)
  lowHealthColor?: number,      // Low health color (orange)
  criticalHealthColor?: number, // Critical color (red)
  borderColor?: number,         // Border color
  borderWidth?: number          // Border thickness
}
```

#### Methods
```typescript
setHealth(health: number)      // Update health value
damage(amount: number)         // Take damage with flash
heal(amount: number)           // Restore health
flash(color, duration)         // Flash effect
setVisible(visible: boolean)   // Show/hide bar
setPosition(x, y)              // Move bar
getHealth(): number            // Current health
getHealthPercent(): number     // 0-1 percentage
isEmpty(): boolean             // Health = 0
isFull(): boolean              // Health = max
```

---

### 2. **Player Health Bar** (Top-Left UI)

**Location:** Top-left corner of screen
**Style:** Continuous bar with smooth transitions

#### Features
- **100 HP maximum** (configurable)
- **Color-coded states:**
  - Green: 51-100% health
  - Orange: 26-50% health
  - Red: 0-25% health
- **Fixed to screen** (scrollFactor 0)
- **Always visible**
- **Label:** "HEALTH" text above bar

#### Damage Sources
1. **Bear Attacks**
   - Direct hit: -20 HP
   - Knockback effect
   - Red flash on screen

2. **Freezing Damage**
   - Temperature at 0%: -5 HP per second
   - Gradual health drain
   - Warning text appears

3. **Blizzard Exposure** (optional)
   - Outside during storm: -2 HP per second
   - Encourages shelter use
   - Stacks with freezing

#### Visual Feedback
- Health bar updates immediately
- Flash white on damage
- Screen shake on heavy damage
- Red vignette at low health
- Death screen at 0 HP

---

### 3. **Bear Health Bars** (Floating)

**Location:** Above each bear
**Style:** Red bar with white flash

#### Normal Bear
```typescript
Health: 30 HP
Bar Width: 40px
Bar Height: 6px
Color: Red (#FF0000)
Position: Bear.y - 30px
```

#### Alpha Bear (Future)
```typescript
Health: 60 HP
Bar Width: 60px
Bar Height: 8px
Color: Dark Red (#CC0000)
Position: Bear.y - 35px
Scale: 1.5x size
```

#### Features
- **Always visible** when bear active
- **Follows bear** position
- **Flash white** when hit
- **Smooth updates** with tweens
- **Disappears** when bear dies

#### Combat Feedback
- Bar flashes on each spear hit
- Decreases smoothly
- Shows exact remaining health
- Helps player gauge threat

---

### 4. **Building Health Bars** (Proximity-Based)

**Location:** Above building
**Style:** Segmented bars (3 or 6 segments)

#### Stick Home (3 Segments)
```typescript
Max Health: 3 HP
Segments: 3
Width: 60px
Height: 8px
Colors: Green → Orange → Red
Visibility: When damaged OR player nearby
```

#### Stone Home (6 Segments)
```typescript
Max Health: 6 HP
Segments: 6
Width: 80px
Height: 8px
Colors: Green → Orange → Red
Visibility: When damaged OR player nearby
```

#### Visibility Rules
```typescript
Show bar if:
  - Building health < max health (damaged)
  OR
  - Player within 100 units of building
  
Hide bar if:
  - Building at full health
  AND
  - Player far from building (>100 units)
```

#### Segment Display
- Each segment = 1 HP
- Filled segments = current health
- Empty segments = lost health
- Easy to read at a glance
- No math required

---

## ⛏️ Stone Mining System

### 1. **Stone Rock Nodes**

**Appearance:** Grey rock sprites scattered in world
**Health:** 3 hits to destroy
**Respawn:** 30 seconds after destruction

#### Spawn Locations
```typescript
// Wilderness area (after furnace upgrade)
Count: 8-10 rocks
X Range: 500-750
Y Range: 100-500
Min Distance: 50 units apart
```

#### Visual States
- **Full Health (3 HP):** Solid grey (#808080)
- **2 HP:** Light cracks (#CCCCCC tint)
- **1 HP:** Heavy cracks (#999999 tint)
- **0 HP:** Destroyed (particles + stone drop)

### 2. **Mining Mechanics**

#### Player Action
```typescript
// Press SPACE near rock
if (nearStoneRock && spacePressed) {
  rock.hit();
  
  if (rock.health > 0) {
    // Show damage
    FloatingText: "Hit! (X/3)"
    Particles: Stone chips
    Sound: *clink*
  } else {
    // Rock destroyed
    FloatingText: "+1 Stone"
    Particles: Stone explosion
    Sound: *crack*
    Player.stoneCount++
  }
}
```

#### Hit Progression
```
Hit 1: 3 HP → 2 HP
  - Health bar appears (3 segments)
  - 1 segment empties
  - Light cracks appear
  - Rock shakes
  - White flash

Hit 2: 2 HP → 1 HP
  - 2nd segment empties
  - Heavy cracks appear
  - Rock shakes more
  - White flash

Hit 3: 1 HP → 0 HP
  - 3rd segment empties
  - Rock explodes
  - Stone chips fly
  - +1 Stone collected
  - Rock respawns in 30s
```

### 3. **Health Bar Integration**

**Stone Rock Health Bar:**
```typescript
Position: Rock.x - 15, Rock.y - 25
Width: 30px
Height: 4px
Segments: 3
Colors: Grey (#808080 → #666666 → #444444)
Visibility: Hidden until first hit
```

**Behavior:**
- Hidden initially
- Appears on first hit
- Shows remaining hits
- Flash white on each hit
- Destroyed with rock

### 4. **Resource Collection**

#### Stone Uses
1. **Stone Home** - 20 stone
2. **Stone Walls** - 100 stone
3. **Quarry** - 50 stone
4. **Repairs** - 5 stone per repair
5. **Future upgrades** - Various costs

#### Gathering Rate
```
Manual Mining:
  - 3 hits per rock = 1 stone
  - ~6 seconds per rock
  - ~10 stones/minute

Quarry (Automated):
  - Worker mines automatically
  - ~5 stones/minute passive
  - Requires 50 stone + 30 wood to build
```

---

## 🎨 Visual Design

### Player Health Bar
```
Position: 16, 16 (top-left)
Size: 200x20 pixels
Style: Continuous bar
Colors:
  - Background: Black (0.5 alpha)
  - Green: 51-100% (#00FF00)
  - Orange: 26-50% (#FFAA00)
  - Red: 0-25% (#FF0000)
  - Border: White 2px
Label: "HEALTH" above bar
```

### Bear Health Bar
```
Position: Above bear (-30px Y)
Size: 40x6 pixels (normal), 60x8 (alpha)
Style: Continuous bar
Colors:
  - Background: Black (0.5 alpha)
  - Bar: Red (#FF0000)
  - Border: White 2px
  - Flash: White (#FFFFFF)
```

### Building Health Bar
```
Position: Above building (-50px Y)
Size: 60x8 (stick), 80x8 (stone)
Style: Segmented (3 or 6)
Colors:
  - Background: Black (0.5 alpha)
  - Green: 67-100% (#00FF00)
  - Orange: 34-66% (#FFAA00)
  - Red: 0-33% (#FF0000)
  - Border: White 2px
Gap: 2px between segments
```

### Stone Rock Health Bar
```
Position: Above rock (-25px Y)
Size: 30x4 pixels
Style: Segmented (3)
Colors:
  - Background: Black (0.5 alpha)
  - Grey: Full (#808080)
  - Dark Grey: Low (#666666)
  - Darker: Critical (#444444)
  - Border: White 2px
```

---

## 🎮 Gameplay Integration

### Player Health System
```typescript
// In MainScene
playerHealth: number = 100;
playerMaxHealth: number = 100;
playerHealthBar: HealthBar;

// Bear attack
onBearHit() {
  this.playerHealth -= 20;
  this.playerHealthBar.damage(20);
  this.cameras.main.shake(200, 0.01);
  
  if (this.playerHealth <= 0) {
    this.gameOver();
  }
}

// Freezing damage
update() {
  if (this.temperature <= 0) {
    this.playerHealth -= 5 * delta / 1000;
    this.playerHealthBar.setHealth(this.playerHealth);
    
    if (this.playerHealth <= 0) {
      this.gameOver();
    }
  }
}
```

### Bear Health System
```typescript
// In BearSprite class
health: number = 30;
maxHealth: number = 30;
healthBar: HealthBar;

takeDamage(amount: number) {
  this.health -= amount;
  this.healthBar.damage(amount);
  
  if (this.health <= 0) {
    this.die();
  }
}
```

### Stone Mining Integration
```typescript
// In MainScene
handlePlayerGather() {
  const nearestRock = this.getClosestStoneRock();
  
  if (nearestRock && distance < 60) {
    const destroyed = nearestRock.hit();
    
    if (destroyed) {
      this.stoneCount++;
      FloatingText.createResource(this, x, y, 1, 'Stone', '#808080');
      ParticleEffects.createStoneChips(this, x, y);
      nearestRock.destroy();
      this.scheduleRockRespawn();
    } else {
      FloatingText.create(this, x, y, `${nearestRock.getHealth()}/3`, '#808080', 18);
    }
  }
}
```

---

## 📊 Balancing

### Player Health
```
Max Health: 100 HP
Bear Damage: -20 HP (5 hits to kill)
Freeze Damage: -5 HP/second (20 seconds to kill)
Blizzard Damage: -2 HP/second (50 seconds to kill)
Healing: Meat restores +25 HP
```

### Bear Health
```
Normal Bear: 30 HP (3 spear hits)
Alpha Bear: 60 HP (6 spear hits)
Spear Damage: 10 HP per hit
Attack Cooldown: 2 seconds
```

### Building Health
```
Stick Home: 3 HP (3 blizzards)
Stone Home: 6 HP (6 blizzards)
Blizzard Damage: -1 HP per storm
Repair Cost: 5 wood/stone
```

### Stone Mining
```
Rock Health: 3 hits
Mining Time: ~2 seconds per hit
Total Time: ~6 seconds per stone
Respawn Time: 30 seconds
Rocks in World: 8-10 active
```

---

## 🔧 Technical Implementation

### HealthBar Class Features
- **Reusable component** for any entity
- **Configurable styling** via config object
- **Segmented or continuous** display modes
- **Automatic color transitions** based on health %
- **Flash effects** with customizable color/duration
- **Position tracking** for moving entities
- **Depth management** for proper layering
- **Scroll factor** for UI vs world bars
- **Clean destroy** method for memory management

### Integration Pattern
```typescript
// 1. Create health bar
this.healthBar = new HealthBar(scene, {
  x: this.x,
  y: this.y - 30,
  width: 40,
  height: 6,
  maxHealth: 30,
  currentHealth: 30,
});

// 2. Update on damage
takeDamage(amount) {
  this.health -= amount;
  this.healthBar.damage(amount);
}

// 3. Update position (for moving entities)
update() {
  this.healthBar.setPosition(this.x, this.y - 30);
}

// 4. Clean up
destroy() {
  this.healthBar.destroy();
}
```

---

## 📝 Summary

### What Was Added
✅ **HealthBar utility class** - Reusable component
✅ **Player health system** - 100 HP with damage sources
✅ **Player health bar UI** - Top-left continuous bar
✅ **Bear health bars** - Floating above bears
✅ **Building health bars** - Segmented proximity display
✅ **Stone rock nodes** - 8-10 grey rocks in world
✅ **3-hit mining mechanic** - Progressive damage system
✅ **Stone rock health bars** - 3-segment display
✅ **Visual feedback** - Flash, shake, particles
✅ **Color coding** - Green/orange/red states

### Player Experience
- **Clear health status** - Always know HP
- **Bear threat assessment** - See enemy health
- **Building condition** - Monitor durability
- **Mining progress** - Know hits remaining
- **Visual feedback** - Satisfying hit effects
- **Strategic decisions** - When to fight/flee/repair

**Frozen Fortune now has comprehensive health bar systems and stone mining mechanics!** 💚⛏️🏰
