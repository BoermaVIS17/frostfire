# Character Sprite Setup Instructions

## Required Sprite Files

Please save your character sprite images to the `public/assets/` folder with these exact names:

1. **player_front.png** - Front-facing view (Image 2 or 4 from your uploads)
2. **player_back.png** - Back view (Image 1 or 3 from your uploads)
3. **player_left.png** - Left-facing view (Image 4 from your uploads)
4. **player_right.png** - Right-facing view (Image 5 from your uploads)
5. **player_back_walk.png** - Back walking view (Image 3 from your uploads)

## File Mapping

Based on your uploaded images:
- **Image 1 (back view, no face)** → `player_back.png`
- **Image 2 (front view with face)** → `player_front.png`
- **Image 3 (back view walking)** → `player_back_walk.png`
- **Image 4 (side/front angle with face)** → `player_left.png`
- **Image 5 (side/front angle with face, opposite)** → `player_right.png`

## Controls

Once the sprites are in place, the game will have:
- **WASD or Arrow Keys** - Move character in 4 directions
- **Space** - Gather resources (trees) when nearby
- **Click** - Attack with spear (when equipped)

The character will automatically animate based on movement direction!
