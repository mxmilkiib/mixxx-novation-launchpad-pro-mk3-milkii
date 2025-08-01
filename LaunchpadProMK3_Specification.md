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

### Deck Configuration
```javascript
// Supports 2-4 decks with configurable colors and physical ordering
LaunchpadProMK3.deck.config = {
  "1": { order: 2, colour: 0x378df7 }, // Blue
  "2": { order: 3, colour: 0xfeb108 }, // Yellow  
  "3": { order: 1, colour: 0xd700d7 }, // Magenta
  "4": { order: 4, colour: 0x88b31a }  // Green
};
```

### Page System
The controller operates in 6 distinct pages, each providing different functionality:

#### Page 0: Hotcues & Intro/Outro Markers
**Main Grid**: 64 hotcue pads (16 per deck for 4-deck, 32 per deck for 2-deck)
- **Hotcue Banks**: Switch between hotcues 1-16 (Bank 1) and 17-32 (Bank 2)
- **Total Capacity**: 32 hotcues per deck (128 total for 4-deck setup)
- **Visual Feedback**: Color-coded by deck, brightness indicates hotcue presence
- **Interactions**:
  - Normal press: Activate/trigger hotcue
  - Shift + press: Delete individual hotcue
  - Keep Playing Mode: Hotcues don't stop playback when released

**Side Pads**: Intro/Outro markers (4 per deck)
- `intro_start_activate`, `intro_end_activate`
- `outro_start_activate`, `outro_end_activate`

#### Page 1: Beatjump Controls
**Main Grid**: Beatjump controls for all decks
```javascript
// Beatjump values (beats)
[128, 64, 32, 16, 8, 4, 2, 1] // backward
[128, 64, 32, 16, 8, 4, 2, 1] // forward
```

#### Page 2: BPM Scaling & Tempo Correction
**Main Grid**: BPM scaling tools with visual feedback
```javascript
// Scale factors for tempo correction
{ scale: 0.5,   control: "beats_set_halve" }
{ scale: 0.666, control: "beats_set_twothirds" }
{ scale: 0.75,  control: "beats_set_threefoutrths" }
{ scale: 1,     control: "beats_undo_adjustment" }
{ scale: 1.25,  control: "beats_set_fivefourths" }
{ scale: 1.333, control: "beats_set_fourthirds" }
{ scale: 1.5,   control: "beats_set_threehalves" }
{ scale: 2,     control: "beats_set_double" }
```

#### Page 3: Loop Controls
**Main Grid**: Beatloop controls
- Even rows: `beatloop_X_activate` (set loop)
- Odd rows: `beatlooproll_X_activate` (rolling loop)
- Loop sizes: 1, 2, 4, 8, 16, 32, 64, 128 beats

#### Page 4: Reverse Loop Controls
**Main Grid**: Reverse loop variations
- Fractional loops: 0.125, 0.25, 0.5, 1, 2, 4, 8, 16 beats
- All controls use `beatlooproll_X_activate`

#### Page 5: One Deck Focus Mode
**Main Grid**: Dedicated controls for a single selected deck
- **Deck Selection**: Via side pads
- **Enhanced Control**: Full grid dedicated to one deck's functions

## Control Mappings

### Row 0 (Top Controls)
| Pad | Function | Page Dependency |
|-----|----------|----------------|
| 0-2 | Color cycling controls | All |
| 3   | Hotcue Bank 1 selector | Page 0 only |
| 4   | Hotcue Bank 2 selector | Page 0 only |
| 5-6 | Reserved | - |
| 7   | **Shift** (hold for alternates) | All |

### Row 1 (Middle Controls)
| Pad | Normal Function | Shift Function |
|-----|----------------|----------------|
| 0   | Undo last hotcue | - |
| 1   | Redo last hotcue | - |
| 2   | Keep Playing Mode toggle | - |
| 3   | Keep Playing Mode toggle | - |
| 4   | Create leadup hotcues (Deck 3) | **Clear all hotcues (Deck 3)** |
| 5   | Create leadup hotcues (Deck 1) | **Clear all hotcues (Deck 1)** |
| 6   | Create leadup hotcues (Deck 2) | **Clear all hotcues (Deck 2)** |
| 7   | Create leadup hotcues (Deck 4) | **Clear all hotcues (Deck 4)** |

### Row 2 (Bottom Controls)
| Pad | Function |
|-----|----------|
| 0   | Select Page 0 (Hotcues) |
| 1   | Select Page 1 (Beatjump) |
| 2   | Select Page 2 (BPM Scale) |
| 3   | Select Page 3 (Loops) |
| 4   | Select Page 4 (Reverse Loops) |
| 5   | Select Page 5 (One Deck) |
| 6   | Split Cue/UnVol toggle |
| 7   | Reserved |

## Advanced Features

### Hotcue Management System

#### Multi-Hotcue Creation
**Function**: `create4LeadupDropHotcues(deck, value)`
- Creates 8 precisely-timed hotcues: 4 leadup + 1 drop + 3 outro
- **Timing**: -256, -192, -128, -64, -32, -16, drop, +128 beats
- **Colors**: Dark green (leadup), orange (approach), red (drop), purple (outro)
- **Cooldown**: 1-second minimum between activations

#### Hotcue Clearing System
**Function**: `clearAllHotcues(deckNum)` *(New Feature)*
- Clears all 32 hotcues on specified deck
- Adds all cleared hotcues to undo stack for recovery
- **Trigger**: Shift + Row1 deck selection buttons
- **Undo Integration**: Full compatibility with existing undo/redo system

#### Undo/Redo System
**Undo Stack**: `LaunchpadProMK3.lastHotcue[]`
**Redo Stack**: `LaunchpadProMK3.redoLastDeletedHotcue[]`
- Tracks: channel, control name, pad address, deck number, color
- **Operations**: Individual hotcue deletion, mass hotcue clearing
- **Persistence**: Maintains across page switches

### Audio Routing

#### Split Cue System
**Function**: `toggleSplitCueUnVol()`
- **Purpose**: Independent headphone cueing without affecting main mix
- **Implementation**: Routes selected deck to headphones only
- **Control**: Row2[6] toggle button
- **Visual**: Button brightness indicates active state

#### Keep Playing Mode
**Function**: Prevents hotcue button releases from stopping playback
- **Activation**: Row1[2] or Row1[3] toggle
- **Visual Feedback**: Blue-purple button illumination
- **Auto-Reset**: Automatically disables when new hotcue is pressed
- **Use Case**: Live performance, continuous playback control

### Visual Feedback System

#### Color Coding
- **Deck Colors**: Blue, Yellow, Magenta, Green (configurable)
- **Brightness Scaling**:
  - Loaded deck active: 85% brightness
  - Loaded deck inactive: 40% brightness  
  - Unloaded deck: 20% brightness
- **Hotcue States**: 
  - Present: Full deck color
  - Empty: Dimmed deck color
  - Bank indicator: Bright/dim based on active bank

#### Animation System
- **Beat-synchronized flashing** for tempo-dependent controls
- **Gradient generation** for visual organization
- **Multi-pad SysEx** messaging for efficient LED updates

## Technical Implementation

### MIDI Communication
```javascript
// SysEx message structure for LED control
LaunchpadProMK3.sendSysEx([0x03, padAddress, red, green, blue])

// RGB color conversion
LaunchpadProMK3.hexToRGB(hexColor) // Returns [r, g, b] array
LaunchpadProMK3.sendRGB(pad, r, g, b) // Direct RGB control
```

### Component Integration
- **Base**: Mixxx Components.js framework
- **Deck Objects**: Extended `components.Deck` with custom properties
- **Button Objects**: `components.HotcueButton` with enhanced functionality

### Error Handling & Debugging
- **Comprehensive DEBUG system** with color-coded terminal output
- **Graceful degradation** for missing deck configurations
- **Safe array access** with bounds checking
- **Connection cleanup** on page switches

### Performance Optimizations
- **Batch LED updates** via multi-pad SysEx messages
- **Conditional page updates** to prevent unnecessary processing
- **Efficient color calculation** with cached RGB values
- **Connection management** with proper cleanup procedures

## Configuration & Customization

### Deck Setup
- **2-Deck Mode**: Full 32 hotcues per deck (64 total)
- **4-Deck Mode**: 16 visible hotcues per deck with banking (128 total)
- **Color Customization**: Hex color codes for deck identification
- **Physical Order**: Configurable pad layout arrangement

### Extensibility Points
- **Page System**: Framework for additional control pages
- **Control Arrays**: Easily modifiable control mappings
- **Color Schemes**: Customizable visual themes
- **Debug Levels**: Adjustable logging verbosity

## Dependencies
- **lodash.mixxx.js**: Utility functions
- **midi-components-0.0.js**: Component framework
- **Mixxx Engine**: Core DJ software integration

## Startup Sequence
1. Initialize programmer mode (switch from DAW mode)
2. Configure deck objects and color schemes
3. Set up MIDI input handlers for all controls
4. Initialize hotcue bank system
5. Load default page (Page 0 - Hotcues)
6. Display ASCII art welcome message

## Shutdown Procedure
- Clear all LED displays
- Cleanup beat connections and timers
- Reset controller to default state

---

*This specification covers the complete functionality of the Launchpad Pro MK3 controller script as implemented. The system provides professional-grade DJ control with extensive hotcue management, visual feedback, and audio routing capabilities suitable for live performance and studio work.*