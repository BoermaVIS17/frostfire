# Save Your Character Sprites

## Quick Instructions

Please save the 5 sprite images you uploaded to the `public/assets/` folder with these exact names:

### Image Mapping:
1. **Image 1** (back view, no face) → Save as: `player_back.png`
2. **Image 2** (front view with face) → Save as: `player_front.png`
3. **Image 3** (back view walking) → Save as: `player_back_walk.png`
4. **Image 4** (side view, face visible, facing left) → Save as: `player_left.png`
5. **Image 5** (side view, face visible, facing right) → Save as: `player_right.png`

## Save Location
```
c:\Users\Alex's Laptop\Desktop\frostfire-main\public\assets\
```

## How to Save:
1. Right-click each image in the chat
2. Select "Save Image As..."
3. Navigate to the `public\assets\` folder
4. Name it according to the mapping above
5. Ensure it's saved as PNG format

## After Saving:
Run the game with:
```bash
npm run dev
```

Your character sprites will automatically load and animate!

## Expected Result:
- Moving up → Shows back view (Image 1)
- Moving down → Shows front view (Image 2)
- Moving left → Shows left side view (Image 4)
- Moving right → Shows right side view (Image 5)
