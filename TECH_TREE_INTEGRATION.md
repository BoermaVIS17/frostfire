# Tech Tree & Resource Progression System ⚒️

## Overview
Complete mid-game and late-game progression system with **Stone** and **Iron** resources, **multi-hit mining**, **Quarry automation**, and **Stone Walls** defense upgrade.

---

## ✅ New Resources

### Stone Resource 💎
- **Grey rock sprites** scattered in wilderness
- **3 hits to mine** (harder than wood)
- **Visual damage states** (cracks appear)
- **Used for**: Quarry, Stone Walls, advanced buildings

### Iron Resource (Future) ⚙️
- **Dark metallic ore** (rare spawns)
- **5 hits to mine** (very hard)
- **Used for**: Advanced tools, weapons, automation

---

## ✅ New Buildings

### Quarry 🏗️
**Cost:** 50 Stone + 30 Wood
**Function:** Automated stone gathering
**Features:**
- Spawns QuarryWorker AI
- Worker mines stone rocks (3 hits each)
- Auto-deposits to quarry
- Continuous operation
- Visual: Grey stone building

### Stone Walls 🧱
**Cost:** 100 Stone + 50 Wood
**Function:** Complete bear protection
**Features:**
- Creates barrier around base
- **Blocks bears completely**
- Bears cannot pass through
- Permanent defense solution
- Visual: Grey stone wall segments

---

## 🎯 Progression Path

### Early Game (0-5 minutes)
```
Wood gathering → Furnace upgrade → Wilderness access
↓
Spear crafting → Bear combat → Meat collection
↓
Hut building → Worker automation
```

### Mid Game (5-15 minutes)
```
Stone rock discovery → Manual stone mining (3 hits each)
↓
Quarry building (50 stone + 30 wood)
↓
Automated stone gathering
↓
Stone accumulation (100+ stone)
```

### Late Game (15+ minutes)
```
Stone Walls (100 stone + 50 wood)
↓
Complete bear protection
↓
Safe base expansion
↓
Iron ore discovery (future)
↓
Advanced tech tree (future)
```

---

## 🔨 Mining Mechanics

### Wood (Trees)
- **Hits required:** 1
- **Time:** Instant (Space key)
- **Difficulty:** Easy
- **Respawn:** 10 seconds

### Stone (Rocks)
- **Hits required:** 3
- **Time:** ~6 seconds (2s per hit)
- **Difficulty:** Medium
- **Visual feedback:** Cracks appear
- **Respawn:** 30 seconds

### Iron (Ore) - Future
- **Hits required:** 5
- **Time:** ~15 seconds (3s per hit)
- **Difficulty:** Hard
- **Rare spawns:** Limited locations
- **Respawn:** 60 seconds

---

## 🤖 Quarry Worker AI

### Behavior States
1. **IDLE** - Looking for work
2. **MOVING_TO_ROCK** - Walking to stone rock
3. **MINING** - Hitting rock (3 times)
4. **MOVING_TO_QUARRY** - Returning with stone

### Mining Process
```
1. Find closest stone rock
2. Move to rock (within 30 units)
3. Mine for 2 seconds (visual bob animation)
4. Hit rock (damage state updates)
5. Repeat 3 times until rock destroyed
6. Collect stone
7. Return to quarry
8. Deposit stone (+1 to player count)
9. Repeat cycle
```

### Visual Feedback
- **White flash** when hitting
- **Bob animation** while mining
- **Carries stone** (visual indicator)
- **Stuck detection** (resets if stuck 3s)

---

## 🧱 Stone Walls System

### Wall Placement
- **4 wall segments** around base
- **North, South, East, West** positions
- **Each segment:** 200px wide
- **Height:** 60px tall
- **Collision:** Blocks bear movement

### Bear Interaction
```
Before walls: Bear can roam freely
After walls: Bear blocked by collision
Result: Complete base protection
```

### Strategic Value
- **No more bear attacks** on player
- **Safe resource gathering** near base
- **Worker protection** guaranteed
- **Allows AFK gameplay** (with automation)

---

## 📊 Resource Costs

### Buildings
| Building | Wood | Stone | Iron | Effect |
|----------|------|-------|------|--------|
| Furnace Upgrade | 10 | 0 | 0 | Unlock wilderness |
| Spear | 50 | 0 | 0 | Enable combat |
| Hut | 100 | 0 | 0 | Wood automation |
| **Quarry** | **30** | **50** | **0** | **Stone automation** |
| **Stone Walls** | **50** | **100** | **0** | **Bear protection** |

### Progression Timeline
```
Minute 0-5: Gather 10 wood → Upgrade furnace
Minute 5-10: Gather 50 wood → Craft spear
Minute 10-15: Gather 100 wood → Build hut
Minute 15-20: Mine 50 stone → Build quarry
Minute 20-30: Gather 100 stone → Build walls
Minute 30+: Advanced tech (iron, upgrades)
```

---

## 🎨 Visual Design

### Stone Rock Sprite
```
- Size: 32x32 pixels
- Color: Grey (#808080)
- Shape: Irregular rock
- States:
  * Full health: Solid grey
  * 2 HP: Light cracks (#CCCCCC tint)
  * 1 HP: Heavy cracks (#999999 tint)
  * 0 HP: Destroyed (particles)
```

### Quarry Building
```
- Size: 60x60 pixels
- Color: Dark grey stone
- Shape: Square building
- Features: Stone blocks, archway
- Worker spawns inside
```

### Stone Walls
```
- Size: 200x60 pixels per segment
- Color: Grey stone bricks
- Pattern: Brick texture
- Placement: 4 cardinal directions
- Collision: Full segment width
```

### Quarry Worker
```
- Size: 20x20 pixels
- Color: Brown/grey
- Tool: Pickaxe visual
- Animation: Bob while mining
```

---

## 🔧 Technical Implementation

### MainScene Properties
```typescript
// Stone resources
private stoneCount: number = 0;
private ironCount: number = 0;
private stoneRocks: Phaser.GameObjects.Group;
private stoneText: Phaser.GameObjects.Text;
private ironText: Phaser.GameObjects.Text;

// Buildings
private hasQuarry: boolean = false;
private hasStoneWalls: boolean = false;
private quarry: Phaser.GameObjects.Image;
private quarryWorker: QuarryWorker | null = null;
private stoneWalls: Phaser.GameObjects.Rectangle[];

// UI Buttons
private quarryBtn: Phaser.GameObjects.Container;
private wallsBtn: Phaser.GameObjects.Container;
```

### Player Mining Integration
```typescript
// In Player class - add stone mining
private miningRock: StoneRock | null = null;
private miningProgress: number = 0;

// Space key now checks for both trees and rocks
if (spaceKey.isDown) {
  // Check for tree (instant)
  // Check for rock (3 hits)
}
```

### Stone Rock Spawning
```typescript
// Spawn 8-10 stone rocks in wilderness
for (let i = 0; i < 10; i++) {
  const x = Phaser.Math.Between(500, 750);
  const y = Phaser.Math.Between(100, 500);
  const rock = new StoneRock(this, x, y);
  this.stoneRocks.add(rock);
}
```

### Quarry Worker Update Loop
```typescript
// In MainScene update()
if (this.quarryWorker && this.quarryWorker.active) {
  this.quarryWorker.update(delta);
}
```

---

## 🎮 Gameplay Impact

### Why Stone Matters
1. **New goal** after initial upgrades
2. **Harder to gather** (3 hits vs 1)
3. **Enables automation** (quarry)
4. **Provides defense** (walls)
5. **Mid-game progression** (5-15 min mark)

### Why Quarry Matters
1. **Passive stone income** (like wood worker)
2. **Frees player** to explore/fight
3. **Required for walls** (100 stone needed)
4. **Automation milestone** (2nd worker type)

### Why Stone Walls Matter
1. **Complete bear protection** (no more attacks)
2. **Safe AFK** (with automation running)
3. **Late-game reward** (100 stone investment)
4. **Enables expansion** (build outside walls)
5. **Victory condition** (survived long enough)

---

## 📈 Balancing

### Stone Gathering Rates
```
Manual mining: ~10 stone/minute (3 hits per rock)
Quarry worker: ~5 stone/minute (slower but passive)
Combined: ~15 stone/minute

Time to 50 stone (quarry): 3-5 minutes
Time to 100 stone (walls): 6-10 minutes
```

### Resource Ratios
```
Wood: Easy, fast, abundant (1 hit)
Stone: Medium, slow, common (3 hits)
Iron: Hard, very slow, rare (5 hits)

Progression: Wood → Stone → Iron
```

---

## 🚀 Future Expansions

### Iron Tech Tree
- **Iron Pickaxe** - Mine stone in 1 hit
- **Iron Spear** - Kill bears in 1 hit
- **Iron Furnace** - 2x temperature capacity
- **Iron Walls** - Indestructible, taller

### Advanced Buildings
- **Smelter** - Convert ore to ingots
- **Forge** - Craft advanced tools
- **Watchtower** - See bears coming
- **Storage** - Increase resource caps

### Automation Upgrades
- **Quarry Level 2** - 2 workers
- **Worker Speed** - Faster gathering
- **Auto-Deposit** - Workers deposit automatically
- **Smart AI** - Workers avoid bears

---

## 📝 Integration Checklist

### Files to Modify
- ✅ `game/entities/StoneRock.ts` - Created
- ✅ `game/entities/QuarryWorker.ts` - Created
- ⏳ `game/scenes/MainScene.ts` - Add properties, UI, spawning
- ⏳ `game/entities/Player.ts` - Add stone mining to Space key
- ⏳ `game/utils/SaveManager.ts` - Add stone/iron to save data

### UI Elements to Add
- Stone count display (top left)
- Iron count display (top left)
- Quarry button (50 stone + 30 wood)
- Stone Walls button (100 stone + 50 wood)
- Mining progress bar (optional)

### Textures to Create
- `stone_rock` - Grey rock sprite
- `quarry` - Grey building sprite
- `quarry_worker` - Brown worker sprite
- `stone_wall` - Grey brick texture
- `iron_ore` - Dark metallic sprite (future)

---

## 🎯 Summary

### What This Adds
✅ **Stone resource** - New gathering challenge
✅ **Multi-hit mining** - 3 hits per rock
✅ **Quarry building** - Stone automation
✅ **Quarry worker AI** - Mines and deposits
✅ **Stone walls** - Complete bear defense
✅ **Mid-game goals** - 5-15 minute progression
✅ **Late-game reward** - Safe base with walls
✅ **Iron foundation** - Ready for expansion

### Player Experience
- **Minutes 0-5:** Learn wood gathering
- **Minutes 5-10:** Unlock wilderness, craft spear
- **Minutes 10-15:** Build hut, automate wood
- **Minutes 15-20:** Discover stone, mine manually
- **Minutes 20-25:** Build quarry, automate stone
- **Minutes 25-35:** Accumulate 100 stone
- **Minutes 35+:** Build walls, achieve safety

**The tech tree creates a compelling 30+ minute gameplay loop with clear milestones!** ⚒️💎🧱
