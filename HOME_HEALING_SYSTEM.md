# Frozen Fortune - Home Healing & Protection System 🏠💚

## Overview
Complete home benefit system where **Stick Homes heal players** and **Stone Homes heal faster plus prevent freezing damage**. Adds strategic value to building upgrades and creates safe zones for recovery.

---

## ✅ Home Benefits

### Stick Home 🏚️
**Basic Shelter with Healing**

| Feature | Value |
|---------|-------|
| **Healing Rate** | 2 HP/second |
| **Freeze Protection** | No |
| **Cost** | 10 Wood |
| **Max Health** | 3 HP |

**Benefits:**
- Heals player when standing inside
- Slow but steady HP regeneration
- Good for early game recovery
- Affordable healing solution

**Limitations:**
- Slow healing (2 HP/s)
- No freeze protection
- Still lose temperature in cold
- Vulnerable to blizzard damage

### Stone Home 🏰
**Advanced Fortress with Full Protection**

| Feature | Value |
|---------|-------|
| **Healing Rate** | 5 HP/second |
| **Freeze Protection** | Yes |
| **Cost** | 20 Stone |
| **Max Health** | 6 HP |

**Benefits:**
- Fast healing (2.5x faster than Stick)
- **Complete freeze protection**
- No temperature damage even at 0%
- Durable structure (6 HP)
- Ultimate safe zone

**Advantages:**
- Survive with empty furnace
- Fast recovery from bear attacks
- Safe AFK spot
- Long-term investment pays off

---

## 🎮 Healing Mechanics

### How It Works

**Player Inside Home:**
```typescript
// Every frame (60 FPS)
if (building.isPlayerInside(player.x, player.y)) {
  const healRate = building.getHealingRate(); // 2 or 5 HP/s
  
  // Apply healing
  playerHealth += healRate * delta / 1000;
  playerHealth = Math.min(playerHealth, maxHealth);
  
  // Visual feedback
  if (healingParticleTimer > 0.5) {
    createHealingParticle(player.x, player.y);
    healingParticleTimer = 0;
  }
}
```

**Healing Rates:**
- **Stick Home:** 2 HP/second
- **Stone Home:** 5 HP/second
- **Max Health:** 100 HP

**Recovery Times:**
```
From 0 HP to 100 HP:
- Stick Home: 50 seconds
- Stone Home: 20 seconds
- Difference: 2.5x faster with Stone Home
```

### Freeze Protection

**Without Stone Home:**
```typescript
// Temperature at 0%
if (temperature <= 0) {
  playerHealth -= 5 * delta / 1000; // -5 HP/second
  // Player dies in 20 seconds
}
```

**With Stone Home:**
```typescript
// Inside Stone Home
if (building.hasFreezeProtection() && playerInside) {
  // No freeze damage!
  // Temperature can be 0% safely
  // Player heals at 5 HP/s instead
}
```

**Strategic Impact:**
- Can survive with empty furnace
- No need to gather wood urgently
- Safe during blizzards
- Focus on other tasks

---

## 💡 Strategic Value

### Stick Home Strategy

**Early Game (0-15 minutes):**
- Build immediately (10 wood)
- Use for healing after bear fights
- Rest between gathering trips
- Cheap recovery option

**Healing Efficiency:**
- 2 HP/second = 120 HP/minute
- Good for minor injuries
- Requires staying inside
- Better than meat (25 HP instant)

**Limitations:**
- Must stay inside to heal
- Slow healing rate
- No freeze protection
- Still need furnace

### Stone Home Strategy

**Mid-Late Game (15+ minutes):**
- Upgrade from Stick Home
- Ultimate safe zone
- Fast healing + freeze immunity
- Worth the 20 stone investment

**Healing Efficiency:**
- 5 HP/second = 300 HP/minute
- Excellent for major injuries
- Fast recovery from bears
- Can AFK safely

**Freeze Protection Value:**
- Survive at 0% temperature
- No wood needed for survival
- Safe during blizzards
- Focus on stone/iron gathering

---

## 🎨 Visual Feedback

### Healing Particles

**Stick Home:**
```typescript
Particles: Small green sparkles
Rate: Every 0.5 seconds
Color: Light green (#90EE90)
Size: 0.3-0.5 scale
Speed: Slow upward drift
Lifespan: 1 second
```

**Stone Home:**
```typescript
Particles: Bright green aura
Rate: Every 0.3 seconds
Color: Bright green (#00FF00)
Size: 0.5-0.8 scale
Speed: Medium upward drift
Lifespan: 1.5 seconds
Effect: More intense than Stick
```

### Player Feedback

**While Healing:**
- Green glow around player
- Floating "+2" or "+5" text
- Health bar fills smoothly
- Gentle pulse effect

**Freeze Protection Active:**
- Blue shield icon above player
- "Protected from Cold" text
- Temperature bar shows shield
- No red warning flashes

---

## 📊 Cost-Benefit Analysis

### Stick Home

**Investment:**
- Build: 10 Wood
- Repair: 2 Wood/HP
- Total: ~16 Wood lifetime

**Benefits:**
- Healing: 2 HP/second
- Value: Saves meat (25 HP each)
- ROI: Good for early game

**Comparison to Meat:**
- Meat: 25 HP instant, costs hunting time
- Stick Home: Unlimited healing, costs time inside
- Better for: Multiple small injuries

### Stone Home

**Investment:**
- Build: 20 Stone
- Repair: 3 Stone/HP
- Total: ~38 Stone lifetime

**Benefits:**
- Healing: 5 HP/second (2.5x faster)
- Freeze Protection: Priceless
- Value: Eliminates wood gathering need

**ROI Calculation:**
```
Wood saved per hour (no freeze damage):
- 60 wood/hour (1 wood/minute for furnace)
- After 2 hours: 120 wood saved
- Equivalent value: 6 Stone Homes

Conclusion: Stone Home pays for itself quickly
```

---

## 🎯 Gameplay Integration

### MainScene Implementation

```typescript
// In update() loop
if (this.building) {
  const playerInside = this.building.isPlayerInside(
    this.player.x,
    this.player.y
  );
  
  if (playerInside) {
    // Apply healing
    const healRate = this.building.getHealingRate();
    this.playerHealth += healRate * delta / 1000;
    this.playerHealth = Math.min(this.playerHealth, this.playerMaxHealth);
    this.playerHealthBar.setHealth(this.playerHealth);
    
    // Visual feedback
    this.healingParticleTimer += delta;
    if (this.healingParticleTimer > 500) {
      ParticleEffects.createHealing(this, this.player.x, this.player.y);
      FloatingText.create(this, this.player.x, this.player.y - 20, 
        `+${healRate}`, '#00FF00', 16);
      this.healingParticleTimer = 0;
    }
    
    // Freeze protection
    if (this.building.hasFreezeProtection()) {
      this.freezeProtectionActive = true;
      // Skip freeze damage in temperature check
    }
  } else {
    this.freezeProtectionActive = false;
  }
}

// In temperature damage check
if (this.temperature <= 0 && !this.freezeProtectionActive) {
  this.playerHealth -= 5 * delta / 1000;
  // Apply freeze damage
}
```

### UI Indicators

**Inside Home Indicator:**
```typescript
// Show when player inside
if (playerInside) {
  homeIndicator.setVisible(true);
  homeIndicator.setText(`🏠 ${building.name}`);
  
  if (building.hasFreezeProtection()) {
    homeIndicator.setText(`🏠 ${building.name} 🛡️`);
  }
}
```

**Healing Rate Display:**
```typescript
// Show healing rate
healingText.setText(`Healing: +${healRate} HP/s`);
healingText.setColor('#00FF00');
healingText.setPosition(player.x, player.y - 40);
```

---

## 🏗️ Building Comparison

| Feature | Stick Home | Stone Home |
|---------|------------|------------|
| **Cost** | 10 Wood | 20 Stone |
| **Max HP** | 3 | 6 |
| **Healing** | 2 HP/s | 5 HP/s |
| **Freeze Protection** | ❌ | ✅ |
| **Durability** | Low | High |
| **Early Game** | ✅ Excellent | ❌ Too expensive |
| **Late Game** | ❌ Outclassed | ✅ Essential |
| **AFK Safe** | ❌ No | ✅ Yes |

---

## 🎮 Player Strategies

### Early Game (Stick Home)

**Survival Loop:**
```
1. Gather wood (keep furnace burning)
2. Build Stick Home (10 wood)
3. Hunt bears for meat
4. Heal in home after fights (2 HP/s)
5. Repeat gathering cycle
```

**Healing Strategy:**
- Use home for minor injuries (<50 HP)
- Use meat for emergencies (instant 25 HP)
- Stay inside during recovery
- Keep furnace burning

### Mid Game (Transition)

**Upgrade Path:**
```
1. Mine stone rocks (3 hits each)
2. Accumulate 20 stone
3. Build Stone Home
4. Destroy Stick Home (optional)
5. Enjoy fast healing + freeze protection
```

**Resource Priority:**
- Save stone for Stone Home
- Don't waste on repairs
- Rush to 20 stone quickly
- Huge quality of life upgrade

### Late Game (Stone Home)

**Optimal Play:**
```
1. Enter Stone Home
2. Heal to full (20 seconds)
3. Ignore furnace (freeze protected)
4. Focus on stone/iron gathering
5. Return to heal as needed
```

**AFK Strategy:**
- Stay in Stone Home
- Heal to full HP
- Temperature doesn't matter
- Completely safe
- Can leave game running

---

## 📱 Mobile Integration

### Touch Controls

**Home Indicator:**
- Shows when player inside
- Displays healing rate
- Shows freeze protection status
- Positioned top-center

**Visual Cues:**
- Green glow around screen edges
- Healing particles on player
- Health bar fills visibly
- Shield icon for freeze protection

---

## 🔧 API Reference

### Building Methods

```typescript
// Check if player is inside building
isPlayerInside(playerX: number, playerY: number): boolean
// Returns: true if within 50 unit radius

// Get healing rate
getHealingRate(): number
// Returns: 2 (Stick) or 5 (Stone) HP/second

// Check freeze protection
hasFreezeProtection(): boolean
// Returns: false (Stick) or true (Stone)

// Get all benefits
getBenefits(): BuildingBenefits
// Returns: { healingRate, freezeProtection, description }
```

### Usage Example

```typescript
// Check if player can heal
if (building.isPlayerInside(player.x, player.y)) {
  const healRate = building.getHealingRate();
  
  // Apply healing
  playerHealth += healRate * delta / 1000;
  
  // Check freeze protection
  if (building.hasFreezeProtection()) {
    skipFreezeDamage = true;
  }
  
  // Show feedback
  showHealingEffect(healRate);
}
```

---

## 📊 Balancing

### Healing Rates
- **Stick Home:** 2 HP/s (conservative)
- **Stone Home:** 5 HP/s (generous)
- **Ratio:** 2.5x difference
- **Balance:** Stone Home worth the investment

### Freeze Protection
- **Value:** Eliminates wood gathering need
- **Impact:** Huge quality of life improvement
- **Balance:** Requires 20 stone (significant investment)
- **Fairness:** Late-game reward

### Recovery Times
```
From 50 HP to 100 HP:
- Stick Home: 25 seconds
- Stone Home: 10 seconds
- Meat (x2): Instant but costs resources

From 0 HP to 100 HP:
- Stick Home: 50 seconds
- Stone Home: 20 seconds
- Meat (x4): Instant but expensive
```

---

## 📝 Summary

### What This Adds
✅ **Stick Home healing** - 2 HP/second regeneration
✅ **Stone Home fast healing** - 5 HP/second (2.5x faster)
✅ **Freeze protection** - Stone Home prevents cold damage
✅ **Safe zones** - Homes become recovery spots
✅ **Strategic depth** - Building choice matters more
✅ **AFK capability** - Stone Home allows safe idling
✅ **Resource value** - Stone Home worth 20 stone investment
✅ **Visual feedback** - Healing particles and indicators

### Player Benefits
- **Healing without meat** - Unlimited recovery
- **Fast recovery** - Stone Home heals quickly
- **Freeze immunity** - No wood needed for survival
- **Safe AFK** - Can leave game in Stone Home
- **Strategic choices** - When to upgrade buildings
- **Quality of life** - Less tedious resource management

**Frozen Fortune now has a complete home healing system!** Stick Homes heal players at 2 HP/second, while Stone Homes heal at 5 HP/second AND provide complete freeze protection. This makes building upgrades strategically valuable and creates safe zones for recovery and AFK gameplay. 🏠💚🛡️
