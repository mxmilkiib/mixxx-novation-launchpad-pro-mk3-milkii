# Launchpad Pro MK3 Controller Script Specification

**Version**: Current (3129 lines)  
**Author**: Milkii B  
**Target Hardware**: Novation Launchpad Pro MK3  
**Target Software**: Mixxx DJ Software  

## Overview

This specification describes a comprehensive Mixxx controller script for the Novation Launchpad Pro MK3, providing advanced DJ control capabilities with visual feedback through RGB LED pads. The script transforms the controller into a multi-deck hotcue station with BPM correction, beatjumping, looping, and audio routing features.

## Hardware Interface

### Physical Layout
- **Main Grid**: 8×8 RGB pad matrix (64 pads total)
- **Side Pads**: 16 RGB pads (8 left, 8 right)
- **Control Rows**: 
  - `row0`: 8 buttons above main grid
  - `row1`: 8 buttons below main grid  
  - `row2`: 8 buttons at bottom

### MIDI Implementation
- **Mode**: Programmer Mode (automatically switched from DAW mode)
- **Communication**: SysEx messages for RGB LED control
- **Input Handling**: Note On (0x90) and Control Change (0xB0) messages

## Core Architecture

### Core Object & State
```javascript
var LaunchpadProMK3 = {};

// Key state variables
LaunchpadProMK3.currentPage = 0;           // 0-9, toggled via row2[0-4]
LaunchpadProMK3.totalPages = 10;
LaunchpadProMK3.shift = 0;                 // Set by 0x5A (row0[7])
LaunchpadProMK3.keepPlayingMode = false;   // Toggled by row1[2] or row1[3]
LaunchpadProMK3.splitCue = 0;              // headSplit state
LaunchpadProMK3.splitCueUnVol = 0;         // UnVol system active
LaunchpadProMK3.totalDecks = 4;            // Configurable 2-4
```

### Deck Configuration
```javascript
// Colours for each deck, with the default physical order decks are usually arranged with
LaunchpadProMK3.deck.config = {
  "1": { order: 2, colour: 0x378df7 },     // Blue
  "2": { order: 3, colour: 0xfeb108 },     // Yellow  
  "3": { order: 1, colour: 0xd700d7 },     // Magenta
  "4": { order: 4, colour: 0x88b31a }      // Green
};

// Per-deck hotcue bank tracking - each deck has independent bank cycling
LaunchpadProMK3.hotcueBankPerDeck = {      // Banks 1-3, cycle 1→2→3→1
  1: 1, 2: 1, 3: 1, 4: 1
};
```

### Page Button Configuration
```javascript
// row2[0-4] toggle pairs for page selection
LaunchpadProMK3.pageButtonConfig = [
  { primary: 0, alt: 1 },                  // Hotcues ↔ One-Deck
  { primary: 2, alt: 3 },                  // Beatjump ↔ BPM Scale 
  { primary: 4, alt: 5 },                  // Loops ↔ Loops+Slip
  { primary: 6, alt: 7 },                  // Reverse Loops ↔ Reverse+Slip
  { primary: 8, alt: 9 }                   // Loop Move ↔ Loop Resize
];
```

### Control Arrays
```javascript
// https://manual.mixxx.org/2.5/en_gb/chapters/appendix/mixxx_controls#control-[ChannelN]-beatjump_X_forward
// beatjump_X_forward, beatjump_X_backward. Jump by X beats. A control exists for X = 0.03125, 0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512. If a loop is active, the loop is moved forward by X beats.
LaunchpadProMK3.beatjumpControls = [       // Page 2 grid mapping
  "beatjump_128_backward", "beatjump_64_backward", "beatjump_32_backward", "beatjump_16_backward",
  "beatjump_8_backward", "beatjump_4_backward", "beatjump_2_backward", "beatjump_1_backward",
  "beatjump_128_forward", "beatjump_64_forward", "beatjump_32_forward", "beatjump_16_forward",
  "beatjump_8_forward", "beatjump_4_forward", "beatjump_2_forward", "beatjump_1_forward"
];

// BPM scaling columns with scale factors and Mixxx control names
LaunchpadProMK3.bpmScaleColumns = [        // Page 3 BPM scaling
  { index: 1, scale: 0.5, control: "beats_set_halve", colour: 0xFF5555 },
  { index: 2, scale: 0.666, control: "beats_set_twothirds", colour: 0x77FF77 },
  { index: 3, scale: 0.75, control: "beats_set_threefourths", colour: 0x7B00C2 },
  { index: 4, scale: 1, control: "beats_undo_adjustment", colour: 0xff0000 },
  { index: 5, scale: 1.25, control: "beats_set_fivefourths", colour: 0x00F },
  { index: 6, scale: 1.333, control: "beats_set_fourthirds", colour: 0x8B00C2 },
  { index: 7, scale: 1.5, control: "beats_set_threehalves", colour: 0x88FF88 },
  { index: 8, scale: 2, control: "beats_set_double", colour: 0xFF1111 }
];

// https://manual.mixxx.org/2.5/en_gb/chapters/appendix/mixxx_controls#control-[ChannelN]-beatloop_X_activate
// Activates a loop over X beats. A control exists for X = 0.03125, 0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512. Depending on the state of loop_anchor the loop is created forwards or backwards from the current position.
LaunchpadProMK3.loopControls = [           // Pages 4-5 loop sizes
  "1_activate", "2_activate", "4_activate", "8_activate",
  "16_activate", "32_activate", "64_activate", "128_activate"
];
```

### MIDI Handlers
```javascript
// Row Controls (0xB0) - Control Change messages
LaunchpadProMK3.row0 = [0x5B, 0x5C, 0x5D, 0x5E, 0x5F, 0x60, 0x61, 0x62];
LaunchpadProMK3.row1 = [0x69, 0x6A, 0x6B, 0x6C, 0x65, 0x66, 0x67, 0x68];
LaunchpadProMK3.row2 = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];

// Main Grid (0x90) - Note On/Off for 8x8 matrix
LaunchpadProMK3.mainpadAddresses = [81, 82, 83, 84, 85, 86, 87, 88, ...];

// Sidepads (0x90) - 16 pads around main grid for deck-specific controls
LaunchpadProMK3.sidepads = [80, 70, 89, 79, 60, 50, 69, 59, ...];
```

### Page System
The controller operates in 10 pages, organized in five primary/alternate pairs selected from `row2`:

- **Row2[0]**: Page 0 ↔ Page 1
- **Row2[1]**: Page 2 ↔ Page 3  
- **Row2[2]**: Page 4 ↔ Page 5
- **Row2[3]**: Page 6 ↔ Page 7
- **Row2[4]**: Page 8 ↔ Page 9

#### Page 0: Hotcues & Intro/Outro Markers
**Main Grid**: Hotcues per deck with per-deck banking system
- **Hotcue Banks**: Bank 1 (1–16), Bank 2 (17–32), Bank 3 (33–36; shown on first 4 pads only)
- **Total Capacity**: 36 hotcues per deck with independent bank cycling per deck
- **Interactions**: Normal press activates hotcue; Shift + press clears individual hotcue; Keep Playing mode prevents stop-on-release
- **Visual Feedback**: Color-coded by deck with brightness scaling for loaded/unloaded states

**Side Pads**: Intro/Outro markers (4 per deck) with beat-synchronized flashing
- `intro_start_activate`, `intro_end_activate`, `outro_start_activate`, `outro_end_activate`
- Each deck's sidepads are positioned based on deck order configuration

#### Page 1: One-Deck Focus Mode
**Main Grid**: Mixed controls for the selected deck with enhanced functionality
- **Bottom 2 Rows**: Selected deck hotcues (banked as in Page 0)
- **Middle Rows**: Beatjump controls with tempo-synchronized flashing
- **Top Rows**: Loop controls (planned expansion)
- **Sidepads**: Deck selection system; rightmost per-deck sidepad toggles loop mode
- **Deck Selection**: Left three sidepads select target deck; rightmost toggles loop behavior

#### Page 2: Beatjump Controls
**Main Grid**: Beatjump controls per deck with deck-colored gradients and tempo-synchronized flashing
```javascript
// Backward: 128, 64, 32, 16, 8, 4, 2, 1 beats
// Forward:  128, 64, 32, 16, 8, 4, 2, 1 beats
```
- **Visual System**: Deck-colored gradients with beat-synchronized flashing for tempo feedback
- **Sidepads**: Deck colors with beat flashing for visual synchronization
- **Grid Layout**: 8×8 grid mapped to beatjump controls with visual feedback

#### Page 3: BPM Scaling & Tempo Correction
**Main Grid**: BPM scale columns with animated feedback system
- **Even Rows**: Display scale colors from `bpmScaleColumns` configuration
- **Odd Rows**: Show deck colors for visual consistency
- **Animation System**: Scaled-beat animations with 4-state cycle for visual tempo feedback
- **Sidepads**: Deck colors with beat flashing; scaled-beat animations synchronized to grid

#### Page 4: Loop Controls (Forward)
**Main Grid**: Beatloop activations across standard loop sizes
- **Loop Sizes**: 1, 2, 4, 8, 16, 32, 64, 128 beats
- **Controls**: Uses `beatloop_X_activate` Mixxx controls
- **Visual**: Deck-colored grid with loop size indicators

#### Page 5: Loop Controls (Forward + Slip)
**Main Grid**: Same as Page 4 with slip mode enabled
- **Slip Mode**: Automatically enables `slip_enabled` for all decks
- **Behavior**: Loops maintain position while allowing real-time manipulation
- **Visual**: Identical to Page 4 with slip state indication

#### Page 6: Loop Controls (Reverse)
**Main Grid**: Reverse loop variations using `beatlooproll` controls
- **Reverse Behavior**: Loops created backwards from current position
- **Controls**: Uses `beatlooproll_X_activate` for reverse loop behavior
- **Visual**: Deck-colored grid with reverse loop indicators

#### Page 7: Loop Controls (Reverse + Slip)
**Main Grid**: Same as Page 6 with slip mode enabled
- **Combination**: Reverse loop behavior with slip mode for real-time manipulation
- **Use Case**: Advanced loop techniques requiring reverse positioning and slip

#### Page 8: Loop Move
**Main Grid**: Move active loop by specified beat amounts
- **Functionality**: Shift existing loop position by 1–128 beats
- **Controls**: Loop move controls for precise loop positioning
- **Visual**: Grid shows move distances with deck color coding

#### Page 9: Loop Resize
**Main Grid**: Resize active loop with halve/double patterns
- **Column Layout**: Each column represents different resize operations
- **Patterns**: Halve, double, and proportional resize controls
- **Visual**: Grid shows resize operations with visual feedback

## Control Mappings

### Row 0 (Top Controls)
| Pad | Function | Notes |
|-----|----------|-------|
| 0   | Hotcue color previous | Affects `lastHotcueChannel`; cycles through Mixxx hotcue color palette |
| 1   | Hotcue color next | Affects `lastHotcueChannel`; cycles through Mixxx hotcue color palette |
| 2   | Dim brightness down; Shift: cycle hotcue bank (all decks) | Bank lights reflect usage patterns across all decks |
| 3   | Dim brightness up; Shift: cycle hotcue bank (all decks) | Bank lights reflect usage patterns across all decks |
| 4-6 | Reserved | Future expansion for additional hotcue management features |
| 7   | Hold: Clear-All-Hotcues modifier; Tap: toggle all effects | Used with Row1 deck buttons on Page 0; effects toggle controls all effect units |

### Row 1 (Middle Controls)
| Pad | Normal Function | Shift Function | Hold Row0[7] |
|-----|-----------------|----------------|---------------|
| 0   | Undo last hotcue | - | - |
| 1   | Redo last hotcue | - | - |
| 2   | Keep Playing Mode toggle | - | - |
| 3   | Keep Playing Mode toggle | - | - |
| 4   | Create multi hotcues (Deck 3) | Cycle hotcue bank (Deck 3) | Clear all hotcues (Deck 3) |
| 5   | Create multi hotcues (Deck 1) | Cycle hotcue bank (Deck 1) | Clear all hotcues (Deck 1) |
| 6   | Create multi hotcues (Deck 2) | Cycle hotcue bank (Deck 2) | Clear all hotcues (Deck 2) |
| 7   | Create multi hotcues (Deck 4) | Cycle hotcue bank (Deck 4) | Clear all hotcues (Deck 4) |

### Row 2 (Bottom Controls)
| Pad | Function |
|-----|----------|
| 0   | Toggle Page 0 ↔ 1 | Hotcues ↔ One-Deck Focus |
| 1   | Toggle Page 2 ↔ 3 | Beatjump ↔ BPM Scale |
| 2   | Toggle Page 4 ↔ 5 | Loops ↔ Loops+Slip |
| 3   | Toggle Page 6 ↔ 7 | Reverse Loops ↔ Reverse+Slip |
| 4   | Toggle Page 8 ↔ 9 | Loop Move ↔ Loop Resize |
| 5   | Reserved | Future expansion |
| 6   | Split Cue UnVol toggle | Temporary split off; restores previous states on exit |
| 7   | Split Cue (headSplit) toggle | Main split cue control or UnVol exit when active |

## Advanced Features

### Hotcue Management System

#### Multi-Hotcue Creation
**Function**: `create4LeadupDropHotcues(deck, value)`
- **Purpose**: Creates precisely-timed hotcues for build-up and drop sections
- **Hotcue Pattern**: 4 leadup markers + drop point + 3 outro markers
- **Timing**: -192, -128, -64, -32, -16, drop, +128 (plus intermediate approach) as scripted
- **Colors**: Dark green (leadup), orange (approach), red (drop), purple (outro)
- **Cooldown**: 1-second minimum between activations to prevent rapid-fire creation
- **Use Case**: EDM/Dance music with predictable build-up and drop patterns

#### Hotcue Clearing System
**Function**: `clearAllHotcues(deckNum)`
- **Purpose**: Mass removal of all hotcues on specified deck for clean slate
- **Scope**: Clears all hotcues across banks 1–3 (36 total hotcues)
- **Undo Integration**: Adds all cleared hotcues to undo stack for complete recovery
- **Trigger**: Hold Row0[7] while pressing corresponding Row1 deck button (Page 0)
- **Safety**: Full undo/redo compatibility prevents accidental data loss

#### Undo/Redo System
**Data Structure**: 
- **Undo Stack**: `LaunchpadProMK3.lastHotcue[]` - tracks all operations in reverse order
- **Redo Stack**: `LaunchpadProMK3.redoLastDeletedHotcue[]` - tracks cleared operations
- **Tracking**: channel, control name, pad address, deck number, color for complete restoration

**Operations**: Individual hotcue deletion, mass hotcue clearing, multi-hotcue creation
**Persistence**: Maintains across page switches and controller state changes
**Recovery**: Full restoration of hotcue positions, colors, and deck associations

### Audio Routing

#### Split Cue System
**Functions**: `toggleSplitCue()` and `toggleSplitCueUnVol()`
- **Split (Row2[7])**: Toggles `headSplit` and updates LED state; routes selected deck to headphones
- **UnVol (Row2[6])**: Temporarily disables `headSplit` and adjusts `headMix` for independent volume control
- **Exit Behavior**: Pressing Row2[7] while UnVol active exits system and restores previous `headSplit`/`headMix` states
- **Visual Feedback**: Row2[6] shows orange when UnVol active; Row2[7] shows deep blue when split enabled
- **Use Case**: DJ monitoring without affecting main mix; temporary volume adjustments

#### Keep Playing Mode
**Function**: Prevents hotcue button releases from stopping playback
- **Activation**: Row1[2] or Row1[3] toggle (both buttons synchronized)
- **Visual Feedback**: Blue-purple button illumination when active
- **Auto-Reset**: Automatically disables when new hotcue is pressed
- **Use Case**: Live performance requiring continuous playback control; prevents accidental stops

### Visual Feedback System

#### Color Coding
- **Deck Colors**: Blue, Yellow, Magenta, Green (configurable via hex codes)
- **Brightness Scaling**: 
  - Loaded deck active: 85% brightness for clear visibility
  - Loaded deck inactive: 40% brightness for secondary indication
  - Unloaded deck: 20% brightness for minimal presence
- **Hotcue States**: Present (full deck color), Empty (dimmed deck color), Bank indicator (bright/dim based on active bank)

#### Bank Indicator Lights
- **Row0[2] and Row0[3]**: Indicate hotcue bank usage across all decks
- **Color Semantics**: 
  - Bright green: All decks using this bank
  - Medium green: Some decks using this bank
  - Dim green: Bank not in use
  - Orange glow: Mixed bank usage patterns
- **Real-time Updates**: Reflects current bank state across all active decks

#### Sidepad Feedback
- **Deck Colors**: Sidepads display deck color based on physical positioning
- **Beat Flashing**: Synchronized flashing on relevant pages (0–3) for tempo indication
- **Position Mapping**: 4 sidepads per deck based on deck order configuration

#### Animation System
- **Beat-synchronized Flashing**: Tempo-dependent visual feedback for beatjump and BPM pages
- **Gradient Generation**: Visual organization with deck-colored gradients
- **Multi-pad SysEx**: Efficient LED updates using batch messaging
- **State Transitions**: Smooth visual transitions between different controller states

## Technical Implementation

### MIDI Communication
```javascript
// SysEx message structure for LED control
LaunchpadProMK3.sendSysEx([0x03, padAddress, red, green, blue])

// RGB color conversion and direct control
LaunchpadProMK3.hexToRGB(hexColor) // Returns [r, g, b] array
LaunchpadProMK3.sendRGB(pad, r, g, b) // Direct RGB control with bounds checking
```

### Component Integration
- **Base Framework**: Mixxx Components.js framework for core functionality
- **Deck Objects**: Extended `components.Deck` with custom properties and methods
- **Button Objects**: `components.HotcueButton` with enhanced functionality and state tracking
- **Per-Deck Banks**: `hotcueBankPerDeck` maps deck numbers to active bank states (1–3)

### Core Functions
```javascript
// Page Management
LaunchpadProMK3.selectPage(page);          // Switch to page 0-9 with cleanup
LaunchpadProMK3.updateHotcuePage();        // Update Page 0 display and bank lights
LaunchpadProMK3.updateBeatjumpPage();      // Update Page 2 display with gradients
LaunchpadProMK3.updateBpmScalePage();      // Update Page 3 display with animations
LaunchpadProMK3.updateLoopPage();          // Update Pages 4-5 display
LaunchpadProMK3.updateReverseLoopPage();   // Update Pages 6-7 display
LaunchpadProMK3.updateLoopMovePage();      // Update Page 8 display
LaunchpadProMK3.updateLoopResizePage();    // Update Page 9 display

// Hotcue Management
LaunchpadProMK3.create4LeadupDropHotcues(deck, value);  // Multi-hotcue creation
LaunchpadProMK3.clearAllHotcues(deckNum);               // Clear all hotcues with undo
LaunchpadProMK3.undoLastHotcue();                       // Undo last operation
LaunchpadProMK3.redoLastHotcue();                       // Redo last operation
LaunchpadProMK3.cycleHotcueBank(deckNum);               // Cycle bank 1→2→3→1
LaunchpadProMK3.updateHotcueBankLights();               // Update bank indicators

// Visual & Audio
LaunchpadProMK3.toggleSplitCue();          // Toggle headSplit state
LaunchpadProMK3.toggleSplitCueUnVol();     // Toggle UnVol system
LaunchpadProMK3.resetKeepPlayingMode();    // Reset keep playing state
LaunchpadProMK3.sendRGB(pad, r, g, b);    // Send RGB to pad with validation
LaunchpadProMK3.hexToRGB(hexColor);       // Convert hex to [r,g,b] array
```

### Event Flow
1. **Page Selection**: row2[0-4] → `handlePageButtonPress()` → `selectPage()` with cleanup
2. **Hotcue Operations**: main grid → hotcue activation/deletion → undo/redo stack management
3. **Bank Switching**: Shift + row1[4-7] → `cycleHotcueBank()` → `updateHotcueBankLights()`
4. **Clear All**: Hold row0[7] + row1[4-7] → `clearAllHotcues()` → undo stack population
5. **Split Cue**: row2[6-7] → `toggleSplitCue()` / `toggleSplitCueUnVol()` with state restoration

### Error Handling & Debugging
- **Comprehensive DEBUG System**: Color-coded terminal output with timestamp tracking
- **Graceful Degradation**: Fallback behavior for missing deck configurations
- **Safe Array Access**: Bounds checking for all array operations
- **Connection Cleanup**: Proper cleanup procedures on page switches and state changes

### Performance Optimizations
- **Batch LED Updates**: Multi-pad SysEx messages for efficient LED control
- **Conditional Page Updates**: Prevents unnecessary processing for inactive pages
- **Efficient Color Calculation**: Cached RGB values and optimized color conversions
- **Connection Management**: Proper cleanup procedures with connection state tracking

## Configuration & Customization

### Deck Setup
- **2-Deck Mode**: Full 36 hotcues per deck (72 total) with independent banking
- **4-Deck Mode**: 36 hotcues per deck (144 total) with per-deck bank management
- **Color Customization**: Hex color codes for deck identification and visual consistency
- **Physical Order**: Configurable pad layout arrangement for different DJ setups

### Extensibility Points
- **Page System**: Framework for additional control pages with toggle functionality
- **Control Arrays**: Easily modifiable control mappings for different Mixxx versions
- **Color Schemes**: Customizable visual themes and brightness scaling
- **Debug Levels**: Adjustable logging verbosity for development and troubleshooting

## Dependencies
- **lodash.mixxx.js**: Utility functions for enhanced JavaScript operations
- **midi-components-0.0.js**: Component framework for MIDI device integration
- **Mixxx Engine**: Core DJ software integration and control system

## Startup Sequence
1. Initialize programmer mode (switch from DAW mode automatically)
2. Configure deck objects and color schemes from configuration
3. Set up MIDI input handlers for all controls and pages
4. Initialize per-deck hotcue bank system and bank indicator LEDs
5. Load default page (Page 0 - Hotcues) with full visual setup
6. Display ASCII art welcome message and initialization status

## Shutdown Procedure
- Clear all LED displays and reset controller state
- Cleanup beat connections and timers for proper resource management
- Reset controller to default state for next session
- Disconnect all MIDI connections and restore default LED states

---

*This specification covers the complete functionality of the Launchpad Pro MK3 controller script as implemented. The system provides professional-grade DJ control with extensive hotcue management, visual feedback, and audio routing capabilities suitable for live performance and studio work. The modular page system and per-deck banking provide flexible control layouts for different DJ styles and performance requirements.*