# Frozen Fortune - Building Repair System 🔧🏠

## Overview
Complete repair mechanic allowing players to restore damaged buildings by standing nearby and paying resource costs. Prevents buildings from being permanently destroyed after blizzard damage.

---

## ✅ Repair Mechanics

### Resource Costs

| Building Type | Cost per HP | Total Repair Cost (0 → Max) |
|---------------|-------------|----------------------------|
| **Stick Home** | 2 Wood | 6 Wood (3 HP) |
| **Stone Home** | 3 Stone | 18 Stone (6 HP) |

### How to Repair

**Step 1: Approach Building**
- Stand within 80 units of damaged building
- Building health bar becomes visible
- Repair prompt appears

**Step 2: Check Resources**
- Stick Home: Need 2 wood per HP
- Stone Home: Need 3 stone per HP
- Can repair multiple HP if you have resources

**Step 3: Repair Action**
- **Keyboard:** Press `R` key near building
- **Touch:** Tap "REPAIR" action button
- **Mobile:** Context-sensitive action changes to repair

**Step 4: Visual Feedback**
- Green flash on building
- Scale pulse animation (1.0 → 1.15 → 1.0)
- Green sparkle particles
- Health bar updates
- Damage cracks disappear
- Floating text: "+1 HP" or "Repaired!"

---

## 🎮 Repair System Features

### 1. **Smart Repair Detection**

```typescript
// Building checks if it can be repaired
canRepair(): boolean {
  return health < maxHealth;
}

// Get amount needed to fully repair
getRepairAmount(): number {
  return maxHealth - health;
}

// Get cost for one repair
getRepairCost(): { wood?: number; stone?: number } {
  if (buildingType === 'stick_home') {
    return { wood: 2 };
  } else {
    return { stone: 3 };
  }
}
```

### 2. **Proximity-Based UI**

**When Player Near Damaged Building:**
- Health bar shows current HP
- Repair prompt appears: "Press R to Repair (2 Wood)"
- Action button changes to "REPAIR" (mobile)
- Cost displayed in UI

**When Player Far from Building:**
- Health bar hidden (if at full HP)
- No repair prompt
- Action button returns to normal

### 3. **Resource Management**

**Before Repair:**
```typescript
// Check if player has resources
const cost = building.getRepairCost();

if (building.type === 'stick_home') {
  if (playerWood >= cost.wood) {
    // Can repair
  } else {
    // Show "Not enough wood!" message
  }
} else {
  if (playerStone >= cost.stone) {
    // Can repair
  } else {
    // Show "Not enough stone!" message
  }
}
```

**After Repair:**
```typescript
// Deduct resources
if (building.type === 'stick_home') {
  playerWood -= 2;
} else {
  playerStone -= 3;
}

// Repair building
building.repair(1); // +1 HP

// Show feedback
FloatingText.create(scene, x, y, '+1 HP', '#00FF00', 24);
```

### 4. **Visual Feedback**

**Green Flash:**
- Building tints green (#00FF00)
- Lasts 200ms
- Clear indication of repair

**Scale Pulse:**
- Scales to 1.15x
- Smooth Back.out easing
- 200ms duration with yoyo
- Satisfying "pop" effect

**Sparkle Particles:**
- 10 green particles
- Explode from building center
- Speed: 50-100 pixels/second
- Lifespan: 500ms
- Auto-cleanup after 600ms

**Health Bar Update:**
- Segment fills immediately
- Color updates (red → orange → green)
- Smooth transition

**Damage Overlay:**
- Cracks disappear/reduce
- Opacity decreases
- Building looks healthier

---

## 💰 Cost-Benefit Analysis

### Stick Home Economics

**Build Cost:** 10 Wood
**Repair Costs:**
- 1 HP: 2 Wood
- 2 HP: 4 Wood
- 3 HP (full): 6 Wood

**Total Investment:**
- Build + Full Repair: 10 + 6 = **16 Wood**
- Build + Partial Repairs: 10 + (2 × repairs)

**Strategy:**
- Repair after each blizzard: 2 wood/storm
- Let it take 2 damage, repair both: 4 wood
- Rebuild vs repair at 1 HP: Rebuild cheaper (10 vs 6)

### Stone Home Economics

**Build Cost:** 20 Stone
**Repair Costs:**
- 1 HP: 3 Stone
- 2 HP: 6 Stone
- 6 HP (full): 18 Stone

**Total Investment:**
- Build + Full Repair: 20 + 18 = **38 Stone**
- Build + Partial Repairs: 20 + (3 × repairs)

**Strategy:**
- Repair after 2 blizzards: 6 stone
- Let it take 4 damage, repair all: 12 stone
- Rebuild vs repair at 2 HP: Repair cheaper (12 vs 20)

---

## 🎯 Strategic Decisions

### When to Repair?

**Immediate Repair (Preventive):**
- After every blizzard
- Keep building at full HP
- Most expensive option
- Safest strategy

**Delayed Repair (Economic):**
- Wait until 50% HP
- Repair in bulk
- Saves trips
- Riskier if caught in storm

**Emergency Repair (Reactive):**
- Only when critical (1 HP)
- Cheapest option
- High risk of destruction
- Not recommended

### Repair vs Rebuild?

**Stick Home:**
```
Rebuild: 10 Wood
Repair from 0 HP: 6 Wood
Decision: Rebuild is more expensive
Strategy: Always repair if possible
```

**Stone Home:**
```
Rebuild: 20 Stone
Repair from 0 HP: 18 Stone
Decision: Rebuild slightly more expensive
Strategy: Repair unless at 1-2 HP (then rebuild)
```

**Breakeven Points:**
- Stick Home: Always repair (6 < 10)
- Stone Home: Repair if ≥3 HP needed (9+ stone)

---

## 🔄 Repair Workflow

### Player Perspective

```
1. Blizzard damages building (-1 HP)
2. Player notices health bar (yellow/red)
3. Player approaches building
4. Repair prompt appears
5. Player checks resources
6. Player presses R (or taps button)
7. Resources deducted
8. Building flashes green
9. Health bar updates
10. Cracks disappear
11. Repeat as needed
```

### System Flow

```typescript
// In MainScene update()
if (playerNearBuilding && building.canRepair()) {
  // Show repair prompt
  repairPrompt.setVisible(true);
  repairPrompt.setText(`Press R to Repair (${cost})`);
  
  // Update action button (mobile)
  touchControls.setActionContext('interact', 'REPAIR');
  
  // Check for repair input
  if (Phaser.Input.Keyboard.JustDown(rKey) || mobileActionPressed) {
    attemptRepair();
  }
} else {
  repairPrompt.setVisible(false);
}

function attemptRepair() {
  const cost = building.getRepairCost();
  
  // Check resources
  if (building.type === 'stick_home' && playerWood >= cost.wood) {
    playerWood -= cost.wood;
    building.repair(1);
    FloatingText.create(scene, building.x, building.y, '+1 HP', '#00FF00', 24);
    ParticleEffects.createSparkle(scene, building.x, building.y);
  } else if (building.type === 'stone_home' && playerStone >= cost.stone) {
    playerStone -= cost.stone;
    building.repair(1);
    FloatingText.create(scene, building.x, building.y, '+1 HP', '#00FF00', 24);
    ParticleEffects.createSparkle(scene, building.x, building.y);
  } else {
    FloatingText.create(scene, building.x, building.y, 'Not enough resources!', '#FF0000', 20);
  }
}
```

---

## 📱 Mobile Integration

### Touch Controls

**Action Button Context:**
```typescript
// When near damaged building
if (playerNearBuilding && building.canRepair()) {
  actionButton.setIcon('🔧');
  actionButton.setLabel('REPAIR');
  actionButton.setCost(building.getRepairCost());
}

// On button press
onActionPressed() {
  if (context === 'repair') {
    attemptRepair();
  }
}
```

**Visual Feedback:**
- Button shows repair icon (🔧)
- Cost displayed below button
- Button grays out if insufficient resources
- Green flash on successful repair

---

## 🎨 UI Elements

### Repair Prompt (Keyboard)
```
Position: Above building
Text: "Press R to Repair (2 Wood)"
Font: 16px Arial Bold
Color: Yellow (#FFD700)
Background: Black semi-transparent
Visibility: Only when player nearby
```

### Action Button (Mobile)
```
Icon: 🔧 (wrench)
Label: "REPAIR"
Cost: "2 Wood" or "3 Stone"
Color: Orange (#FF8C00)
Size: 50px radius
Position: Bottom-right
```

### Feedback Messages
```
Success: "+1 HP" (Green, 24px)
Insufficient: "Not enough resources!" (Red, 20px)
Full Health: "Already at full health!" (Yellow, 18px)
```

---

## 🔧 API Reference

### Building Class Methods

```typescript
// Repair building by amount
repair(amount: number = 1): boolean
// Returns: true if repaired, false if already full

// Get cost to repair 1 HP
getRepairCost(): { wood?: number; stone?: number }
// Returns: { wood: 2 } or { stone: 3 }

// Check if building can be repaired
canRepair(): boolean
// Returns: true if health < maxHealth

// Get total HP needed for full repair
getRepairAmount(): number
// Returns: maxHealth - currentHealth
```

### Usage Examples

```typescript
// Check if repair is possible
if (building.canRepair()) {
  const cost = building.getRepairCost();
  const needed = building.getRepairAmount();
  
  console.log(`Need ${needed} repairs`);
  console.log(`Cost: ${cost.wood || cost.stone} per HP`);
}

// Attempt repair
if (playerHasResources(cost)) {
  const success = building.repair(1);
  
  if (success) {
    deductResources(cost);
    showFeedback('+1 HP');
  }
}

// Repair multiple HP
const repairAmount = Math.min(
  building.getRepairAmount(),
  Math.floor(playerWood / 2) // How many we can afford
);

for (let i = 0; i < repairAmount; i++) {
  building.repair(1);
  playerWood -= 2;
}
```

---

## 📊 Balancing

### Repair Costs
- **Stick Home:** 2 wood/HP (20% of build cost)
- **Stone Home:** 3 stone/HP (15% of build cost)
- **Ratio:** Stone homes cheaper to maintain per HP

### Resource Availability
- **Wood:** Easy to gather (1 hit per tree)
- **Stone:** Medium difficulty (3 hits per rock)
- **Balance:** Stone homes harder to build, easier to maintain

### Time Investment
- **Gather 2 wood:** ~4 seconds (2 trees)
- **Gather 3 stone:** ~6 seconds (1 rock)
- **Repair time:** Instant (just resource cost)

---

## 🎮 Gameplay Impact

### Strategic Depth
- **Resource management:** Save wood/stone for repairs
- **Risk assessment:** Repair now vs later
- **Economic planning:** Repair vs rebuild decisions
- **Blizzard preparation:** Pre-repair before storms

### Player Engagement
- **Active maintenance:** Buildings require care
- **Meaningful choices:** When to repair
- **Resource sink:** Prevents infinite stockpiling
- **Progression:** Better buildings = better maintenance

### Balance Changes
- **Buildings not doomed:** Can always be repaired
- **Blizzards less punishing:** Damage is reversible
- **Long-term viability:** Stone homes worth investment
- **Resource value:** Wood/stone always useful

---

## 📝 Summary

### What This Adds
✅ **Repair mechanic** - Restore building HP
✅ **Resource costs** - 2 wood or 3 stone per HP
✅ **Visual feedback** - Green flash, sparkles, scale pulse
✅ **Smart detection** - Proximity-based repair prompts
✅ **Mobile support** - Context-sensitive action button
✅ **Strategic depth** - Repair vs rebuild decisions
✅ **Balance** - Buildings not permanently destroyed
✅ **API methods** - canRepair(), getRepairCost(), etc.

### Player Benefits
- **Buildings not doomed** - Always repairable
- **Strategic choices** - When and how much to repair
- **Resource management** - Save for repairs
- **Visual clarity** - Clear repair prompts and feedback
- **Mobile-friendly** - Easy touch controls

**Frozen Fortune now has a complete building repair system!** Players can restore damaged buildings by paying 2 wood (Stick Home) or 3 stone (Stone Home) per HP. The system includes visual feedback, proximity detection, mobile integration, and strategic repair vs rebuild decisions. 🔧🏠✨
