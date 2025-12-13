# Frozen Fortune - Tiered Building System 🏠🏰

## Overview
Complete tiered building system with **Stick Home** and **Stone Home**, featuring **durability mechanics**, **blizzard damage**, and **strategic resource management**. Buildings can take damage during blizzards and must be maintained to survive.

---

## ✅ Building Types

### Stick Home 🏚️
**Early Game Shelter**

| Property | Value |
|----------|-------|
| **Cost** | 10 Wood |
| **Max Health** | 3 Hits |
| **Durability** | Low |
| **Build Time** | Fast |
| **Strategy** | Cheap, quick survival solution |

**Pros:**
- Very affordable (only 10 wood)
- Quick to build in early game
- Provides basic shelter from blizzards
- Good for first-time players

**Cons:**
- Only survives 3 blizzard hits
- Requires frequent repairs
- Can be destroyed quickly
- Not viable for long-term survival

### Stone Home 🏰
**Mid-Game Fortress**

| Property | Value |
|----------|-------|
| **Cost** | 20 Stone |
| **Max Health** | 6 Hits |
| **Durability** | High |
| **Build Time** | Slower (requires mining) |
| **Strategy** | Long-term survival investment |

**Pros:**
- Double the durability (6 hits)
- Lasts much longer
- Better for extended gameplay
- Shows progression achievement

**Cons:**
- Expensive (20 stone)
- Requires stone mining (3 hits per rock)
- Takes longer to gather resources
- Mid-game unlock

---

## 🔨 Building Mechanics

### Construction
```typescript
// Stick Home
Cost: 10 Wood
Build: Click "Build" button → Select "Stick Home"
Result: Instant construction at player location

// Stone Home
Cost: 20 Stone
Build: Click "Build" button → Select "Stone Home"
Result: Instant construction at player location
```

### Health System
- **Initial Health**: Full (3 or 6 depending on type)
- **Damage Source**: Blizzard storms
- **Damage Rate**: 1 hit per blizzard (if player not inside)
- **Destruction**: Building destroyed at 0 health

### Visual Feedback
**Health Bar:**
- Green: 67-100% health
- Orange: 34-66% health
- Red: 0-33% health
- Bar positioned above building

**Damage Overlay:**
- Cracks appear as health decreases
- More cracks = more damage
- Visual intensity scales with damage
- Black crack lines on building

**Damage Animation:**
- Red flash when hit
- Shake effect
- Alpha pulse (0.5 → 1.0)
- Tween-based smooth animation

---

## ❄️ Blizzard Damage System

### How It Works
```
1. Blizzard starts (30-second storm)
2. Check player location every 5 seconds
3. If player NOT inside building:
   → Building takes 1 damage
4. If player IS inside building:
   → Building protected (no damage)
5. Repeat until blizzard ends
```

### Damage Calculation
```typescript
// During blizzard
if (blizzardActive) {
  const playerInside = checkPlayerInBuilding();
  
  if (!playerInside && building.exists) {
    building.takeDamage(1);
    
    if (building.health <= 0) {
      building.destroy();
      showMessage("Your home was destroyed!");
    }
  }
}
```

### Survival Strategy
**Option 1: Stay Inside**
- Enter building during blizzard
- Building takes no damage
- Safe and reliable
- Boring but effective

**Option 2: Risk It**
- Stay outside to gather resources
- Building takes damage
- High risk, high reward
- Requires repairs later

**Option 3: Dash to Safety**
- Gather until warning appears
- Dash to building before storm
- Balanced approach
- Requires good timing

---

## 🔧 Repair System

### Repair Mechanics
```typescript
// Repair building
Cost: 5 Wood (Stick Home) or 5 Stone (Stone Home)
Action: Interact with damaged building
Result: +1 Health restored
```

### Repair Strategy
- **Preventive**: Repair before blizzard
- **Emergency**: Repair after taking damage
- **Economic**: Let it take some damage, repair in bulk
- **Replacement**: Destroy and rebuild if too damaged

### Visual Feedback
- Scale pulse animation (1.0 → 1.1 → 1.0)
- Health bar updates
- Cracks disappear/reduce
- Positive sound effect (future)

---

## 📊 Resource Management

### Stick Home Economics
```
Build: 10 Wood
Lifespan: 3 Blizzards
Cost per Blizzard: ~3.3 Wood
Total Investment: 10 Wood

Repairs: 5 Wood per hit
Max Repairs: 2 (before destruction)
Total Cost: 10 + (2 × 5) = 20 Wood
```

### Stone Home Economics
```
Build: 20 Stone
Lifespan: 6 Blizzards
Cost per Blizzard: ~3.3 Stone
Total Investment: 20 Stone

Repairs: 5 Stone per hit
Max Repairs: 5 (before destruction)
Total Cost: 20 + (5 × 5) = 45 Stone
```

### Cost-Benefit Analysis
**Stick Home:**
- Cheaper upfront
- Faster to build
- Good for short-term
- Higher maintenance

**Stone Home:**
- Expensive upfront
- Requires mining time
- Better long-term value
- Lower maintenance

---

## 🎮 Gameplay Integration

### Early Game (0-10 minutes)
```
1. Gather 10 wood
2. Build Stick Home
3. Survive first blizzards
4. Repair as needed
5. Save for Stone Home
```

### Mid Game (10-20 minutes)
```
1. Mine stone rocks (3 hits each)
2. Accumulate 20 stone
3. Build Stone Home
4. Destroy Stick Home (optional)
5. Focus on other upgrades
```

### Late Game (20+ minutes)
```
1. Stone Home fully upgraded
2. Minimal repairs needed
3. Focus on automation
4. Build quarry for stone
5. Prepare for advanced tech
```

---

## 🏗️ Building Class API

### Constructor
```typescript
new Building(scene, x, y, type)
// type: 'stick_home' | 'stone_home'
```

### Methods
```typescript
takeDamage(amount: number): boolean
// Returns true if building destroyed

repair(amount: number): void
// Restores health (max = maxHealth)

getHealth(): number
// Current health value

getMaxHealth(): number
// Maximum health value

getType(): BuildingType
// 'stick_home' | 'stone_home'

getConfig(): BuildingConfig
// Full configuration object

destroy(): void
// Clean up and remove building
```

### Events
```typescript
// Emitted by building
'building-damaged' // When taking damage
'building-destroyed' // When health reaches 0
'building-repaired' // When repaired
```

---

## 💾 Save System Integration

### Save Data
```typescript
{
  hasHut: boolean,
  hutType: 'stick_home' | 'stone_home' | null,
  hutHealth: number,
  stoneCount: number,
  totalStoneGathered: number
}
```

### Load Logic
```typescript
if (saveData.hasHut && saveData.hutType) {
  const building = new Building(
    this,
    300, 350,
    saveData.hutType
  );
  
  // Restore health
  building.setHealth(saveData.hutHealth);
}
```

---

## 🎨 Visual Design

### Stick Home Sprite
```
Size: 40x40 pixels
Color: Brown (#8B4513)
Style: Simple wooden structure
Features: Stick frame, thatched roof
```

### Stone Home Sprite
```
Size: 50x50 pixels
Color: Gray (#808080)
Style: Stone brick construction
Features: Stone walls, solid roof
```

### Health Bar
```
Position: Above building (-50px Y offset)
Size: 60x8 pixels
Colors:
  - Background: Black (0.5 alpha)
  - Green: 67-100% health
  - Orange: 34-66% health
  - Red: 0-33% health
Border: White (2px, 0.8 alpha)
```

### Damage Cracks
```
Style: Black lines (2px width)
Opacity: Scales with damage (0-80%)
Pattern: Random diagonal cracks
Count: 0-5 cracks based on damage
```

---

## 🔄 Upgrade Path

### Progression
```
No Shelter
    ↓
Stick Home (10 Wood)
    ↓
Stone Home (20 Stone)
    ↓
Fortified Stone (Future: 50 Stone + 30 Iron)
    ↓
Castle (Future: 100 Stone + 50 Iron)
```

### Future Upgrades
- **Reinforced Walls**: +3 max health
- **Roof Repair**: Auto-repair 1 HP per day
- **Stone Quarry**: Automated stone gathering
- **Multiple Buildings**: Build outposts
- **Defensive Structures**: Walls, towers, traps

---

## 📈 Balancing

### Blizzard Frequency
- Every 5-10 minutes
- 30-second duration
- 1 damage per storm (if exposed)

### Building Lifespan
```
Stick Home: 3 blizzards = 15-30 minutes
Stone Home: 6 blizzards = 30-60 minutes
```

### Resource Availability
```
Wood: Easy (1 hit per tree)
Stone: Medium (3 hits per rock)
Repair Cost: 50% of build cost
```

### Strategic Depth
- **Early game**: Stick Home is essential
- **Mid game**: Stone Home is goal
- **Late game**: Automation makes repairs easy
- **Risk/reward**: Stay outside vs stay safe

---

## 🧪 Testing Checklist

### Building Construction
- [ ] Stick Home builds with 10 wood
- [ ] Stone Home builds with 20 stone
- [ ] Building appears at correct location
- [ ] Health bar displays correctly
- [ ] Can only build one home at a time

### Damage System
- [ ] Blizzard damages building when player outside
- [ ] No damage when player inside
- [ ] Health bar updates correctly
- [ ] Cracks appear as damage increases
- [ ] Building destroys at 0 health

### Repair System
- [ ] Can repair with correct resources
- [ ] Health increases by 1
- [ ] Cannot repair above max health
- [ ] Visual feedback works
- [ ] Cracks disappear when repaired

### Save/Load
- [ ] Building type saves correctly
- [ ] Building health saves correctly
- [ ] Building restores on load
- [ ] Stone count persists
- [ ] Can continue after reload

---

## 📝 Summary

### What This Adds
✅ **Two building types** - Stick (cheap) vs Stone (durable)
✅ **Durability system** - 3 hits vs 6 hits
✅ **Blizzard damage** - Buildings take damage in storms
✅ **Health tracking** - Visual health bar
✅ **Damage visualization** - Cracks appear
✅ **Repair mechanics** - Restore health with resources
✅ **Strategic depth** - Risk/reward decisions
✅ **Progression path** - Early → Mid → Late game
✅ **Save integration** - Building state persists
✅ **Stone resource** - New gathering challenge

### Player Experience
- **Early game**: Build cheap Stick Home
- **Mid game**: Upgrade to Stone Home
- **Late game**: Maintain and expand
- **Strategy**: Balance risk vs safety
- **Progression**: Clear upgrade path

**Frozen Fortune now has a complete tiered building system with durability mechanics!** 🏠❄️🏰
