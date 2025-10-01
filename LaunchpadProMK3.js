//// Launchpad Pro MK3 MIDI mapping for Mixxx
//// created by Milkii B, hi Mum!

/// Features Available:
// HOTCUE SYSTEM:
// • 64 hotcue pads across 2-4 decks (color-coded by deck)
// • 36 hotcues per deck (3 banks; banks 1–2: 1–32, bank 3: 33–36)
// • Individual hotcue deletion (shift + pad)
// • Mass hotcue deletion per deck (shift + creation buttons)
// • Multi-hotcue creation (4 leadup + drop + 3 outro hotcues)
// • Full undo/redo system for all hotcue operations
// • Keep Playing Mode (hotcues don't stop playback on release)
// • Hotcue sequence uses script.triggerControl for beatjumps and restores original play position
//
// PAGE SYSTEM (12 pages total, 10 currently active):
// • Page 0: Hotcues; sidepads = intro/outro markers per deck (intro start/end, outro start/end)
// • Page 1: One-deck mixed controls — rows 1–4 loops, rows 5–6 beatjump, rows 7–8 hotcues; sidepads: left column loop move, right column loop resize
// • Page 2: Beatjump controls (1–128 beats, backward/forward) with tempo-synced flashing
// • Page 3: BPM scaling & tempo correction with visual feedback
// • Page 4: Forward loop controls (beatloop vs beatlooproll selectable)
// • Page 5: Reverse loop controls (reverse roll/loop)
// • Page 6: Loop move (move loop by 1–128 beats)
// • Page 7: Loop resize (halve/double across columns)
// • Page 8: Animation page 1 (alt + button 0)
// • Page 9: Animation page 2 (alt + button 1)
// • Page 10: Reserved for future use (alt + button 2)
// • Page 11: Reserved for future use (alt + button 3)
//
// CONTROL BUTTONS:
// • Top left pad: Reverse roll toggle
// • Row0
//   - Pads 1–2: Brightness control (shift = cycle all hotcue banks)
//   - Pads 3–4: Hotcue color switching
//   - Pads 5–6: Loop mode switches (exit-on-release toggle; roll vs set)
//   - Pad 8: Effects toggle / clear-all modifier
// • Row1
//   - Pads 1–4: on page 0 deck select (no shift), shift = multi-hotcue create; on page 1 these select the deck being controlled
//   - Pad 5: Alt modifier (clear all hotcues, access pages 8-11)
//   - Pad 6: Redo hotcue
//   - Pad 7: Slip toggle (global)
//   - Pad 8: Split cue toggle
// • Row2
//   - Pads 1–4: Page selection (toggle pages 0↔1, 2↔3, 4↔5, 6↔7; alt held = pages 8-11)
//   - Pad 5: Shift modifier
//   - Pad 6: Undo hotcue
//   - Pad 7: Keep playing mode
//   - Pad 8: Split cue volume switch
// • Sidepads
//   - Page 0: Per-deck intro/outro markers (4 per deck: intro start/end, outro start/end)
//   - Page 1: Left column = loop move; Right column = loop resize
//
// VISUAL SYSTEM:
// • RGB LED control with brightness scaling
// • Deck color coding (blue, yellow, magenta, green)
// • Beat-synchronized flashing for beatjump pads (pages 1 & 2)
// • Gradient generation for visual organization
// • Bank indicators and hotcue presence feedback
//
// AUDIO ROUTING:
// • Split cue system (independent headphone cueing)
// • Deck selection and focus controls
// • Intro/outro marker system on sidepads (4 markers per deck)
//
// HARDWARE INTERFACE:
// • 8x8 main grid (64 pads) + 16 sidepads + 24 control buttons
// • Automatic mode switching (DAW → Programmer mode)
// • SysEx messaging for RGB control
// • Configurable deck order and colors

// RUNTIME MANAGEMENT:
// • Per-deck hotcue sequence timers with global cancel function
// • Robust cleanup on page changes and shutdown (timers, engine connections, MIDI handlers)
// • Beatjump and sidepad beat flashing connections are disconnected when not needed
/// wip

/// todo
// verify no lingering timers/connections after page switches or shutdown; test hotcue sequence creation and undo/redo
// fix star up/down
// sort_hotcues, sort_hotcues_remove_offsets
// literary programming comments
// finish one deck page with multiple controls
// make this truly 2 deck compatible
// make a two deck page
// make deck order truly free
// normalise variable names across functions
// represent track colours
// a e s t h e t i c s and consistency
// party
// [done 2025-08-23] cancelAllHotcueSequenceTimers for hotcue sequences
// [done 2025-08-23] Refactor create4LeadupDropHotcues to use script.triggerControl and restore position
// [done 2025-08-23] Cleanup selectPage + shutdown: timers, engine connections, MIDI handlers
// [done] clear all hotcues functionality with undo support

/*
 * SCRIPT STRUCTURE OUTLINE
 * ========================
 * 
 * • global constants and configuration
 *   - COLOURS: colour definitions for pads and LEDs
 *   - C: shorthand colour mappings
 *   - DEBUG: debug logging function
 *   - leadupCues: predefined cue point configurations
 * 
 * • LaunchpadProMK3 (main controller object)
 *   - core initialization functions
 *     • init(): main initialization entry point
 *     • initProgrammerMode(): sets up programmer mode
 *     • initVars(): initializes controller variables and state
 *     • initExtras(): additional initialization (slip mode, page handlers, etc.)
 *     • initMidiHandlers(): sets up MIDI input handlers
 * 
 *   - utility functions
 *     • sendSysEx(): sends system exclusive MIDI messages
 *     • sleep(): timing utility
 *     • _rand7(): random number generator
 *     • getDeckFromOrder(): maps deck order to deck number
 * 
 *   - LED and visual control functions
 *     • sendRGB(): sends RGB colour to specific pad
 *     • sendHEX(): sends hex colour to pad
 *     • hexToRGB(): converts hex to RGB values
 *     • clearMain(): clears main grid
 *     • clearAll(): clears all pads and LEDs
 *     • clearPageMidiHandlers(): clears page-specific MIDI handlers
 * 
 *   - page management functions
 *     • selectPage(): switches between different controller pages
 *     • refreshCurrentPage(): refreshes current page display
 *     • updateOneDeckModeButtons(): updates one-deck mode controls
 *     • handlePageButtonPress(): processes page button interactions
 * 
 *   - row 0 control functions (top row interface)
 *     • updateRow0LoopModeSwitch(): updates loop mode switch display
 *     • setupRow0LoopModeSwitch(): configures loop mode switch
 *     • updateRow0SelectedDeckSwatch(): updates selected deck indicator
 * 
 *   - brightness and display functions
 *     • decreaseDimBrightness(): decreases LED brightness
 *     • increaseDimBrightness(): increases LED brightness
 * 
 *   - hotcue management functions
 *     • cycleHotcueBank(): cycles through hotcue banks for single deck
 *     • cycleHotcueBankAllDecks(): cycles hotcue banks for all decks
 *     • updateHotcueLights(): updates hotcue LED states
 *     • updateHotcuePage(): refreshes hotcue page display
 *     • updateHotcuePages(): updates hotcue pages for specific deck
 *     • updateHotcueBankLights(): updates hotcue bank indicators
 *     • setupSelectedDeckHotcues(): configures hotcue display for selected deck
 *     • undoLastHotcue(): undoes last hotcue action
 *     • redoLastHotcue(): redoes last hotcue action
 *     • clearAllHotcues(): clears all hotcues for deck
 *     • create4LeadupDropHotcues(): creates automatic drop cues
 *     • getDeckBank(): gets current hotcue bank for deck
 *     • hotcueNumForGridIndex(): maps grid position to hotcue number
 *     • hotcueNumForHotcueIndex(): maps hotcue index to number
 * 
 *   - loop control functions
 *     • buildLoopControlName(): builds control names for loop functions
 *     • handleLoopControl(): processes loop control interactions
 *     • updateLoopPage(): updates loop page display
 *     • updateReverseLoopPage(): updates reverse loop page
 *     • updateLoopMovePage(): updates loop move page
 *     • updateLoopResizePage(): updates loop resize page
 *     • updateOneDeckLoopLighting(): updates one-deck loop lighting
 *     • requestLoopLEDRefresh(): requests loop LED refresh
 *     • updateLoopPagesActiveOverlay(): updates loop page overlays
 *     • clearAllLoopsAndRolls(): clears all active loops and rolls
 * 
 *   - beatjump and tempo functions
 *     • setupOneDeckBeatjumpLighting(): configures beatjump lighting
 *     • updateBeatjumpPage(): updates beatjump page display
 *     • setupBeatjumpFlashing(): sets up beatjump beat flashing
 *     • cleanupBeatjumpFlashing(): cleans up beatjump connections
 *     • setupOneDeckLoopFlashing(): sets up loop beat flashing for 4, 8, 16 beat loops
 *     • cleanupOneDeckLoopFlashing(): cleans up loop beat connections
 *     • setupLoopPagesFlashing(): sets up loop beat flashing for pages 4 & 5
 *     • cleanupLoopPagesFlashing(): cleans up loop pages beat connections
 *     • bpmResetToDeck(): resets BPM to deck tempo
 *     • bpmResetToBpm(): resets BPM to specific value
 *     • updateBpmScalePage(): updates BPM scale page
 *     • isScaledBeatActive(): checks if scaled beat is active
 *     • setupScaledBeatConnections(): sets up scaled beat connections
 *     • cleanupScaledBeatConnections(): cleans up scaled beat connections
 * 
 *   - deck management functions
 *     • setupOneDeckRow1DeckButtons(): configures deck selection buttons
 *     • updateOneDeckPage(): updates one-deck page display
 *     • sidepadDeckColour(): gets colour for deck sidepads
 *     • setupPage0SidepadFlashing(): sets up sidepad beat flashing
 *     • cleanupPage0SidepadFlashing(): cleans up sidepad connections
 *     • setupSidepadBeatFlashing(): sets up sidepad beat indicators
 *     • cleanupSidepadBeatFlashing(): cleans up sidepad beat connections
 * 
 *   - animation system functions
 *     • page8Handler(): handles animation page 8
 *     • page9Handler(): handles animation page 9
 *     • bindAnimationRow0Controls(): binds animation control row
 *     • toggleAutoCycle(): toggles automatic parameter cycling
 *     • cycleInterval(): cycles through beat intervals (4/8/16/32)
 *     • cycleMode(): cycles through auto-cycle modes (variant/style/both)
 *     • performAutoCycle(): executes auto-cycle parameter change
 * 
 *   - slip mode functions
 *     • refreshSlipLed(): refreshes slip mode LED
 *     • setSlipEnabled(): enables/disables slip mode
 *     • updateSlipStateFromEngine(): updates slip state from mixxx engine
 * 
 *   - split cue functions
 *     • toggleSplitCue(): toggles split cue functionality
 *     • toggleSplitCueUnVol(): toggles split cue with volume
 * 
 *   - effect functions
 *     • enableAllEffects(): enables all effects
 *     • toggleReverseRoll(): toggles reverse roll effect
 * 
 *   - gradient and colour functions
 *     • gradientSetup(): sets up colour gradients
 *     • getLoopGradientPalette(): gets gradient palette for loops
 *     • gradientCalculate(): calculates gradient between colours
 *     • rgbToHsl(): converts RGB to HSL colour space
 *     • hslToRgb(): converts HSL to RGB colour space
 *     • hueRotateRGB(): rotates hue of RGB colour
 *     • lightenRGBColour(): lightens RGB colour
 *     • darkenRGBColour(): darkens RGB colour
 *     • mixRGB(): mixes two RGB colours
 *     • buildHueRotatedLightnessGradient(): builds hue-rotated gradients
 *     • getMainGridPadAddressesForRows(): gets pad addresses for rows
 *     • applyLinearGradientToSpecificPads(): applies linear gradients to pads
 *     • applySplitGradientToSpecificPads(): applies split gradients to pads
 * 
 *   - timer and connection management
 *     • clearBeatConnections(): clears beat-related engine connections
 *     • cancelAllHotcueSequenceTimers(): cancels all hotcue sequence timers
 *     • cancelLoopVerifyTimer(): cancels loop verification timer
 *     • cancelHotcueSequenceTimer(): cancels specific hotcue sequence timer
 * 
 *   - track and intro/outro functions
 *     • trackWithIntroOutro(): handles track intro/outro detection
 *     • lightUpRow2(): lights up row 2 for track sections
 * 
 *   - utility and helper functions
 *     • resetKeepPlayingMode(): resets keep playing mode
 *     • printReadme(): prints controller information
 *     • shutdown(): cleanup function for controller shutdown
 * 
 *   - Deck constructor function
 *     • Deck(): constructor for individual deck objects
 *       - properties: deckNum, group, hotcueBank, etc.
 *       - methods: sendRGB() for deck-specific RGB control
 *       - engine connections for track_loaded, bpm, play, loop states
 *       - component reconnection functionality
 * 
 * • animation system objects
 *   - animation controller object
 *     • init(): initializes animation system
 *     • startAnimation(): starts animation loop
 *     • stopAnimation(): stops animation loop
 *     • animationLoop(): main animation loop function
 *     • updateAnimation(): updates current animation frame
 *     • nextAnimation(): switches to next animation
 *     • prevAnimation(): switches to previous animation
 *     • toggleAutoHue(): toggles automatic hue cycling
 *     • updateHue(): updates hue value
 *     • updatePageIndicator(): updates page indicator display
 *     • animation pattern functions:
 *       - rainbowWave(): creates rainbow wave pattern
 *       - pulsingGrid(): creates pulsing grid pattern
 *       - colorSpiral(): creates spiral colour pattern
 *       - scanLines(): creates scanning line pattern
 *     • hsvToRgb(): HSV to RGB conversion for animations
 * 
 *   - visual effects renderer object
 *     • clamp(): clamps values to range
 *     • hsvToRgb255(): HSV to RGB conversion (0-255 range)
 *     • sendPad(): sends colour to specific pad
 *     • clearGrid(): clears the pad grid
 *     • setPage(): sets current page
 *     • bindControls(): binds control handlers
 *     • control functions:
 *       - toggleAutoHue(): toggles auto hue mode
 *       - updateHue(): updates hue value
 *       - adjustSpeed(): adjusts animation speed
 *       - nextVariant()/prevVariant(): changes animation variants
 *       - togglePulseMode(): toggles pulse mode
 *       - nextStyle()/prevStyle(): changes visual styles
 *     • paintControlRow(): paints control row indicators
 *     • currentStyles(): gets current style array
 *     • render(): main render function
 *     • hueBase(): gets base hue value
 *     • pattern drawing functions:
 *       - drawRings(): draws ring patterns
 *       - drawDiag(): draws diagonal patterns
 *       - drawChecker(): draws checkerboard patterns
 *       - drawLattice(): draws lattice patterns
 *       - drawSpiral(): draws spiral patterns
 *       - drawRider(): draws rider patterns
 *       - drawRadial(): draws radial patterns
 *       - drawVortex(): draws vortex patterns
 *     • setupBeatConnections(): sets up beat-synced connections
 *     • cleanupBeatConnections(): cleans up beat connections
 * 
 * • utility functions (global scope)
 *   - isCloseEnough(): checks if number is close to array values
 */





//// MARK: LaunchpadProMK3
//// Main object to represent the controller
var LaunchpadProMK3 = {};


// Init deck conf base object
LaunchpadProMK3.deck = LaunchpadProMK3.deck || {};



/// unified logging system
// log levels: 0=OFF, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG, 5=TRACE
LaunchpadProMK3.LOG_LEVEL = 4;  // default: DEBUG (to match old DEBUGstate=1 behavior)

// category-specific log levels (override global if set, null = use global)
LaunchpadProMK3.LOG_CATEGORIES = {
  gradients: null,      // gradient calculations
  beatFlash: null,      // beat-synced flashing
  loops: null,          // loop operations
  hotcues: null,        // hotcue operations
  midi: null,           // midi handlers
  timers: null          // timer operations
};

// deprecated flags - now controlled by LOG_LEVEL
// DEBUGstate: use LOG_LEVEL >= 4 instead
// DEBUG_GRADIENTS: use LOG_CATEGORIES.gradients = 4 instead
// DEBUG_GRADIENTS_VERBOSE: use LOG_CATEGORIES.gradients = 5 instead
LaunchpadProMK3.DEBUGstate = 1;  // kept for any remaining checks, but DEBUG() now uses LOG_LEVEL
LaunchpadProMK3.DEBUG_GRADIENTS = 0;
LaunchpadProMK3.DEBUG_GRADIENTS_VERBOSE = 0;


// Terminal colour codes for DEBUG message
const COLOURS = {
  // Standard colours
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  MAGENTA: "\x1b[35m",
  CYAN: "\x1b[36m",
  ORANGE: "\x1b[33m", // 208 = bright orange
  RESET: "\x1b[0m",

  // Darker (standard low-brightness)
  DARK_RED: "\x1b[38;5;88m",
  DARK_GREEN: "\x1b[38;5;22m",
  DARK_YELLOW: "\x1b[38;5;100m",
  DARK_BLUE: "\x1b[38;5;18m",
  DARK_MAGENTA: "\x1b[38;5;90m",
  DARK_CYAN: "\x1b[38;5;30m",

  // Pastels (24-bit truecolor)
  PASTEL_RED: "\x1b[38;2;255;128;128m",
  PASTEL_ORANGE: "\x1b[38;2;255;178;102m",
  PASTEL_YELLOW: "\x1b[38;2;255;255;153m",
  PASTEL_GREEN: "\x1b[38;2;153;255;153m",
  PASTEL_BLUE: "\x1b[38;2;153;204;255m",
  PASTEL_MAGENTA: "\x1b[38;2;255;153;255m",
  PASTEL_CYAN: "\x1b[38;2;153;255;255m",

  // Greys
  GREY: "\x1b[38;5;245m",       // Light-Mid Grey
  DARK_GREY: "\x1b[38;5;240m",  // Darker Grey
  LIGHT_GREY: "\x1b[38;5;250m"  // Very Light Grey
};

const C = {
  // Standard
  R: COLOURS.RED,
  O: COLOURS.ORANGE,
  Y: COLOURS.YELLOW,
  G: COLOURS.GREEN,
  B: COLOURS.BLUE,
  M: COLOURS.MAGENTA,
  C: COLOURS.CYAN,
  RE: COLOURS.RESET,

  // Dark
  DR: COLOURS.DARK_RED,
  DG: COLOURS.DARK_GREEN,
  DY: COLOURS.DARK_YELLOW,
  DB: COLOURS.DARK_BLUE,
  DM: COLOURS.DARK_MAGENTA,
  DC: COLOURS.DARK_CYAN,

  // Pastel
  PR: COLOURS.PASTEL_RED,
  PO: COLOURS.PASTEL_ORANGE,
  PY: COLOURS.PASTEL_YELLOW,
  PG: COLOURS.PASTEL_GREEN,
  PB: COLOURS.PASTEL_BLUE,
  PM: COLOURS.PASTEL_MAGENTA,
  PC: COLOURS.PASTEL_CYAN,

  // Greys
  GR: COLOURS.GREY,
  DGY: COLOURS.DARK_GREY,
  LG: COLOURS.LIGHT_GREY,

  // Misc
  P: COLOURS.PASTEL_MAGENTA
};


// MARK: MIDI AND HARDWARE CONSTANTS
const MIDI = {
  // MIDI CHANNELS AND STATUS BYTES
  CHANNEL_0: 0xB0,
  NOTE_ON: 0x90,
  NOTE_OFF: 0x80,
  CONTROL_CHANGE: 0xB0,
  
  // SYSEX VALUES
  SYSEX_START: 0xF0,
  SYSEX_END: 0xF7,
  NOVATION_MANUFACTURER_ID: [0x00, 0x20, 0x29],
  LAUNCHPAD_PRO_MK3_DEVICE_ID: 0x0E,
  PROGRAMMER_MODE: [0x0E, 0x01],
  
  // COMMON MIDI VALUES
  VELOCITY_MAX: 127,
  VELOCITY_OFF: 0,
  
  // timing constants
  DEBOUNCE_MS: 50,
  REFRESH_INTERVAL_MS: 100
};

const COLORS = {
  // RGB COMPONENT VALUES (0-127 range for MIDI)
  RGB: {
    BLACK: [0, 0, 0],
    WHITE: [127, 127, 127],
    RED: [127, 0, 0],
    GREEN: [0, 127, 0],
    BLUE: [0, 0, 127],
    YELLOW: [127, 127, 0],
    MAGENTA: [127, 0, 127],
    CYAN: [0, 127, 127],
    
    // deck colors
    DECK_1_BLUE: [55, 141, 247],    // 0x378df7
    DECK_2_YELLOW: [254, 177, 8],   // 0xfeb108  
    DECK_3_MAGENTA: [215, 0, 215],  // 0xd700d7
    DECK_4_GREEN: [136, 179, 26],   // 0x88b31a
    
    // page indicator colors
    PAGE_PRIMARY: [127, 0, 20],
    PAGE_ALT: [127, 30, 30],
    
    // split cue colors
    SPLIT_CUE_OFF: [5, 5, 48],
    SPLIT_CUE_ON: [32, 32, 127],
    SPLIT_CUE_ON_MOD: [0, 0, 127],
    SPLIT_CUE_UN_VOL: [80, 32, 32],
    SPLIT_CUE_UN_VOL_PREV: [32, 16, 16],
    
    // slip toggle colors  
    SLIP_ON: [0, 95, 127],
    SLIP_OFF: [8, 16, 16],
    
    // feedback colors
    ACTIVE_GREEN: [0, 255, 0],
    SHIFT_HIGHLIGHT: [0, 127, 95],
    
    // button colors
    SHIFT_ON: [48, 127, 111],
    SHIFT_OFF: [32, 127, 95],
    ALT_ON: [0, 30, 46],
    ALT_OFF: [0, 102, 127],
    HOTCUE_PREV: [127, 0, 0],
    HOTCUE_NEXT: [0, 127, 0],
    EFFECTS_ON: [95, 127, 0],
    EFFECTS_OFF: [32, 16, 0],
    KEEP_PLAYING_ON: [95, 0, 127],
    KEEP_PLAYING_OFF: [127, 127, 0],
    UNDO: [127, 48, 127],
    REDO: [47, 32, 127],
    
    // one-deck mode colors
    ONE_DECK_TOGGLE: [0, 100, 80],
    ONE_DECK_ROLL: [90, 0, 90]
  },
  
  // HEX COLOR VALUES
  HEX: {
    // deck colors for visual identification and LED lighting
    // physical order determines which 16-pad section of the grid each deck controls
    DECK_1_BLUE: 0x378df7,     // physical order: 2
    DECK_2_YELLOW: 0xfeb108,   // physical order: 3
    DECK_3_MAGENTA: 0xd700d7,  // physical order: 1
    DECK_4_GREEN: 0x88b31a,    // physical order: 4
    DEFAULT_WHITE: 0xFFFFFF,
    
    // bmp scale colors for tempo scaling columns
    // columns 1-4: slower tempos (0.5x to 1.0x), columns 5-8: faster tempos (1.25x to 2.0x)
    BPM_SCALE_RED: 0xFF5555,        // 0.5x
    BPM_SCALE_GREEN: 0x77FF77,      // 0.666x
    BPM_SCALE_PURPLE: 0x7B00C2,     // 0.75x
    BPM_SCALE_DARK_RED: 0xff0000,   // 1.0x (undo)
    BPM_SCALE_BLUE: 0x00F,          // 1.25x
    BPM_SCALE_DARK_PURPLE: 0x8B00C2, // 1.333x
    BPM_SCALE_LIGHT_GREEN: 0x88FF88, // 1.5x
    BPM_SCALE_LIGHT_RED: 0xFF1111   // 2.0x
  }
};

const ADDRESSES = {
  // MAIN 8x8 GRID ADDRESSES (64 pads)
  // MIDI addresses arranged from top-left to bottom-right
  MAIN_GRID: [
    81, 82, 83, 84, 85, 86, 87, 88,  // row 1
    71, 72, 73, 74, 75, 76, 77, 78,  // row 2
    61, 62, 63, 64, 65, 66, 67, 68,  // row 3
    51, 52, 53, 54, 55, 56, 57, 58,  // row 4
    41, 42, 43, 44, 45, 46, 47, 48,  // row 5
    31, 32, 33, 34, 35, 36, 37, 38,  // row 6
    21, 22, 23, 24, 25, 26, 27, 28,  // row 7
    11, 12, 13, 14, 15, 16, 17, 18   // row 8
  ],
  
  // SIDE PADS (16 total)
  // Left/right side pads arranged in 4 groups of 4 for the 4 decks
  SIDE_PADS: [
    80, 70, 89, 79,  // deck 1 group
    60, 50, 69, 59,  // deck 2 group
    40, 30, 49, 39,  // deck 3 group  
    20, 10, 29, 19   // deck 4 group
  ],
  
  // CONTROL BUTTON ROWS
  ROW_0: [0x5B, 0x5C, 0x5D, 0x5E, 0x5F, 0x60, 0x61, 0x62],  // row above main pads (8 buttons)
  ROW_1: [0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x6B, 0x6C],  // rows below main pads (16 buttons total)
  ROW_2: [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08],  // rows below main pads (16 buttons total)
  
  // SPECIAL CONTROLS
  REVERSE_ROLL_MOMENTARY: 0x5A,  // momentary reverse roll (unused spare control – top-left CC)
  
  // HELPER VALUES
  GRID_WIDTH: 8,
  GRID_HEIGHT: 8,
  TOTAL_MAIN_PADS: 64,
  TOTAL_SIDE_PADS: 16,
  DECKS_SUPPORTED: 4
};

const PAGE_CONFIG = {
  // page selection button configuration for row2 (first 4 pads)
  // each button toggles between two pages on normal press
  // alt held + press overrides to access pages 8-11
  // button 0: page 0 (hotcues) ↔ page 1 (one deck) | alt: page 8 (animation 1)
  // button 1: page 2 (beatjump) ↔ page 3 (bpm scale) | alt: page 9 (animation 2)
  // button 2: page 4 (forward loop) ↔ page 5 (reverse loop) | alt: page 10 (future)
  // button 3: page 6 (loop move) ↔ page 7 (loop resize) | alt: page 11 (future)
  // note: row2 pad 5 (index 4) is now dedicated shift modifier (not a page button)
  // note: row2 pad 6 (index 5) is reserved for undo
  // note: row2 pad 7 (index 6) is reserved for keep playing mode
  BUTTON_MAP: [
    { primary: 0, alt: 1, altPage: 8 },
    { primary: 2, alt: 3, altPage: 9 },
    { primary: 4, alt: 5, altPage: 10 },
    { primary: 6, alt: 7, altPage: 11 }
  ],
  
  // sidepad control names for intro/outro markers
  // each deck gets 4 sidepads: intro start, intro end, outro start, outro end
  SIDEPAD_NAMES: [
    "intro_start_",
    "intro_end_", 
    "outro_start_",
    "outro_end_"
  ]
};

// mixxx control names - prevents typos, enables autocomplete
const CONTROLS = {
  // deck state
  TRACK_LOADED: "track_loaded",
  TRACK_SAMPLES: "track_samples",
  PLAY_POSITION: "playposition",
  BEAT_ACTIVE: "beat_active",
  
  // loop controls
  LOOP_ENABLED: "loop_enabled",
  LOOP_REMOVE: "loop_remove",
  LOOP_ANCHOR: "loop_anchor",
  
  // slip/sync
  SLIP_ENABLED: "slip_enabled",
  REVERSE_ROLL: "reverseroll",
  
  // master controls
  HEAD_SPLIT: "headSplit",
  HEAD_MIX: "headMix",
  
  // effects
  EFFECT_ENABLED: "enabled",
  NUM_EFFECT_SLOTS: "num_effectslots",
  
  // hotcues
  HOTCUE_POSITION: "hotcue_${num}_position",
  HOTCUE_ENABLED: "hotcue_${num}_enabled",
  HOTCUE_STATUS: "hotcue_${num}_status",
  HOTCUE_COLOR: "hotcue_${num}_color",
  HOTCUE_SET: "hotcue_${num}_set",
  HOTCUE_CLEAR: "hotcue_${num}_clear",
  HOTCUE_ACTIVATE: "hotcue_${num}_activate",
  
  // intro/outro markers  
  INTRO_START_ENABLED: "intro_start_enabled",
  INTRO_END_ENABLED: "intro_end_enabled",
  OUTRO_START_ENABLED: "outro_start_enabled",
  OUTRO_END_ENABLED: "outro_end_enabled",
  
  // helpers for building control names
  hotcue: (num, action) => `hotcue_${num}_${action}`,
  beatloop: (size, reverse = false) => `beatloop_${reverse ? 'r' : ''}${size}_activate`,
  beatlooproll: (size, reverse = false) => `beatlooproll_${reverse ? 'r' : ''}${size}_activate`,
  effectUnit: (unit) => `[EffectRack1_EffectUnit${unit}]`,
  effectSlot: (unit, slot) => `[EffectRack1_EffectUnit${unit}_Effect${slot}]`
};

const TIMING = {
  // debug and ui
  DEBUG_LINE_LIMIT: 250,
  DEBUG_MAX_TIME: 30000,  // 30 seconds
  LED_REFRESH_THROTTLE: 50,  // ms
  LOOP_VERIFY_DELAY: 80,    // ms - delay before verifying loop state
  HOTCUE_UPDATE_DELAY: 50,  // ms - delay for hotcue page refresh
  HOTCUE_SEQUENCE_DELAY: 100,  // ms - delay between hotcue creations (mixxx control processing time)
  LED_PULSE_DURATION: 120,  // ms - duration of LED pulse animations
  ANIMATION_SPEED_HOLD_STEP: 180,  // ms - interval for held animation speed button
  
  // conversion factors
  MS_TO_SECONDS: 1000,
  SECONDS_TO_MS: 0.001,
  
  // rate limiting
  HOTCUE_CREATION_THROTTLE: 1000  // ms - minimum time between leadup/drop sequences
};

LaunchpadProMK3.appStartTimestamp = Date.now();

// global state tracking for hotcue creation sequences
LaunchpadProMK3.lastHotcueCreationTime = 0;

// improved logging system with levels
// MARK: LOG() functions
const LOG = {
  // internal helper with lazy evaluation and custom color support
  _log: function(level, levelName, defaultColour, message, linesbefore, linesafter, category, customColour) {
    // check category-specific level first, then global
    const effectiveLevel = (category && LaunchpadProMK3.LOG_CATEGORIES[category] !== null) 
      ? LaunchpadProMK3.LOG_CATEGORIES[category] 
      : LaunchpadProMK3.LOG_LEVEL;
    
    if (level > effectiveLevel) return;
    
    // lazy evaluation: if message is a function, call it now
    const resolvedMessage = (typeof message === 'function') ? message() : message;
    
    // use custom color if provided, otherwise default for this level
    const colour = customColour || defaultColour;
    
    if (typeof linesbefore === "number" && linesbefore > 0 && linesbefore < TIMING.DEBUG_LINE_LIMIT) {
      for (let i = 0; i < linesbefore; i += 1) { print(" "); }
    }
    const timestamp = (Date.now() - LaunchpadProMK3.appStartTimestamp) / TIMING.MS_TO_SECONDS;
    const catStr = category ? `[${category}] ` : "";
    print(`${C.GR}${timestamp.toFixed(3)}${C.RE} ${colour}${levelName}${C.RE} ${catStr}${colour}${resolvedMessage}${C.RE}`);
    if (typeof linesafter === "number" && linesafter > 0 && linesafter < TIMING.DEBUG_LINE_LIMIT) {
      for (let i = 0; i < linesafter; i += 1) { print(" "); }
    }
  },
  
  error: function(message, linesbefore, linesafter, category, customColour) {
    this._log(1, "ERROR", C.R, message, linesbefore, linesafter, category, customColour);
  },
  
  warn: function(message, linesbefore, linesafter, category, customColour) {
    this._log(2, "WARN ", C.Y, message, linesbefore, linesafter, category, customColour);
  },
  
  info: function(message, linesbefore, linesafter, category, customColour) {
    this._log(3, "INFO ", C.G, message, linesbefore, linesafter, category, customColour);
  },
  
  debug: function(message, linesbefore, linesafter, category, customColour) {
    this._log(4, "DEBUG", C.C, message, linesbefore, linesafter, category, customColour);
  },
  
  trace: function(message, linesbefore, linesafter, category, customColour) {
    this._log(5, "TRACE", C.GR, message, linesbefore, linesafter, category, customColour);
  }
};

/**
 * backward-compatible DEBUG function - now redirects to LOG.debug
 * 
 * DEPRECATED: use LOG.debug() directly for new code
 * maintained for backward compatibility with existing 498 DEBUG() calls
 * 
 * migration: DEBUG(msg, colour, before, after) → LOG.debug(msg, before, after, null, colour)
 * 
 * @param {string|function} message - debug message or function returning message
 * @param {string} colour - ANSI color code (optional, passed as customColour to LOG)
 * @param {number} linesbefore - blank lines before message
 * @param {number} linesafter - blank lines after message
 * @returns {void}
 * @deprecated use LOG.debug() instead
 */
const DEBUG = function (message, colour, linesbefore, linesafter) {
  // redirect to LOG.debug with custom color support
  // note: category is null, colour becomes customColour parameter
  LOG.debug(message, linesbefore, linesafter, null, colour);
};

//const D = function(var1, var2, var3, var4, var5, var6) {
//  if (LaunchpadProMK3.DEBUGstate) {
//    console.log(`${C.R}D${C.RE}  ${var1)} ${C.O}   ${eval(var1)}   ${C.RE} ${var2} ${C.O}${var2}${C.RE} ${var3} ${C.O}${var3}${C.RE} ${var4} ${C.O}${var4}${C.RE} ${var5} ${C.O}${var5}${C.RE} ${var6} ${C.O}${var6}${C.RE}`)
//    //LaunchpadProMK3.sleep(333)
//  }
//};


// Object.prototype.forEach = function (callback) {
//   for (let key in this) {
//     if (this.hasOwnProperty(key)) {
//       callback(this[key], key, this);
//     }
//   }
// };



/**
 * initialize LaunchpadProMK3 controller
 * called by Mixxx when controller is connected
 * MARK: init()
 * @param {string} id - controller ID from XML mapping
 * @param {boolean} debugging - true if --controller-debug flag is set
 * @returns {void}
 */
LaunchpadProMK3.init = function (id, debugging) {
  // initialize animation state
  LaunchpadProMK3.animationStateInitialized = {};
  LaunchpadProMK3.lastQuantizedStep = {};
  LaunchpadProMK3.currentMainBeatCycle = {};
  LOG.debug("ooooo                                                    oooo                                   .o8 ", 2, 0, null, C.M)
  LOG.debug("`888'                                                    `888                                 dc888 ", 0, 0, null, C.M)
  LOG.debug(" 888          .oooo.   oooo  oooo  ooo. .oo.    .ooooo.   888 .oo.   oo.ooooo.   .oooo.    .oooo888 ", 0, 0, null, C.M)
  LOG.debug(" 888         `P  )88b  `888  `888  `888P'Y88b  d88' `'Y8  888P'Y88b   888' `88b `P  )88b  d88' `888 ", 0, 0, null, C.M)
  LOG.debug(" 888          .oP'888   888   888   888   888  888        888   888   888   888  .oP'888  888   888 ", 0, 0, null, C.M)
  LOG.debug(" 888       o d8(  888   888   888   888   888  888   .o8  888   888   888   888 d8(  888  888   888 ", 0, 0, null, C.M)
  LOG.debug("o888ooooood8 `Y888''8o  `V88V'V8P' o888o o888o `Y8bod8P' o888o o888o  888bod8P' `Y888''8o `Y8bod88P'", 0, 0, null, C.M)
  LOG.debug("                                                                      888                           ", 0, 0, null, C.M)
  LOG.debug("                                                                     o888o                          ", 0, 0, null, C.M)
  LOG.debug("")
  LOG.debug("          ooooooooo.                           ooo        ooooo oooo    oooo   .oooo.               ", 0, 0, null, C.M)
  LOG.debug("          `888   `Y88.                         `88.       .888' `888   .8P'  .dPY''88b              ", 0, 0, null, C.M)
  LOG.debug("           888   .d88' oooo d8b  .ooooo.        888b     d'888   888  d8'          ]8P'             ", 0, 0, null, C.M)
  LOG.debug("           888ooo88P'  `888''8P d88' `88b       8 Y88. .P  888   88888[          <88b.              ", 0, 0, null, C.M)
  LOG.debug("           888          888     888   888       8  `888'   888   888`88b.         `88b.             ", 0, 0, null, C.M)
  LOG.debug("           888          888     888   888       8    Y     888   888  `88b.  o.   .88P              ", 0, 0, null, C.M)
  LOG.debug("          o888o        d888b    `Y8bod8P'      o8o        o888o o888o  o888o `8bd88P'               ", 0, 0, null, C.M)
  LOG.debug("")
  LOG.debug("   created by Milkii, with thanks to various Mixxx devs on Zulip, the forum and GitHub for help!", 0, 0, null, C.C)
  LOG.debug("###### init controller script n object", 2, 1, null, C.G);


  // switch LPP3 from DAW mode to programmer mode
  LOG.debug("LaunchpadProMK3.initProgrammerMode()", 0, 0, null, C.O)
  LaunchpadProMK3.initProgrammerMode();

  // clear already lit pads
  //LaunchpadProMK3.clearAll();

  // MIDI handlers for deck selection, actions, and page selection
  LOG.debug("LaunchpadProMK3.initVars()", 0, 0, null, C.O)
  LaunchpadProMK3.initVars();


  // construct Deck objects based on the Components JS Deck object system
  if (LaunchpadProMK3.totalDecks === 4) {
    LOG.debug("LaunchpadProMK3.totalDecks = 4 decks, creating..", C.O, 0, 1)
    LaunchpadProMK3.decks = {
      "1": new LaunchpadProMK3.Deck(1),
      "2": new LaunchpadProMK3.Deck(2),
      "3": new LaunchpadProMK3.Deck(3),
      "4": new LaunchpadProMK3.Deck(4),
    }
  } else if (LaunchpadProMK3.totalDecks === 2) {
    LOG.debug("LaunchpadProMK3.totalDecks = 2 decks, creating..", C.O, 0, 1)
    LaunchpadProMK3.decks = {
      "1": new LaunchpadProMK3.Deck(1),
      "2": new LaunchpadProMK3.Deck(2),
    }
    // Don't call bpmScaledInit here without a deck number
    // LaunchpadProMK3.bpmScaledInit()
    LOG.debug("decks madeeeee", 1, 1, null, C.R)
  };

  // Initialize per-deck animation cycle trackers using integer keys
  for (let i = 1; i <= LaunchpadProMK3.totalDecks; i++) {
    // Ensure the deck object itself exists before trying to set properties related to it.
    // Note: LaunchpadProMK3.decks uses string keys "1", "2", etc.
    if (LaunchpadProMK3.decks[i.toString()]) { 
        LaunchpadProMK3.lastQuantizedStep[i] = -1;       // Use integer deckNum 'i' as key
        LaunchpadProMK3.currentMainBeatCycle[i] = 0;    // Use integer deckNum 'i' as key
    } else {
        LOG.debug("LaunchpadProMK3.init: Deck " + i + " not found in LaunchpadProMK3.decks for animation cycle init.", C.R);
    }
  }


  // MIDI handlers for deck selection, actions, and page selection
  LOG.debug("LaunchpadProMK3.initExtras()", 1, 0, null, C.G)
  LaunchpadProMK3.initExtras();
  // Paint row0[4] with the selected deck color at startup
  LaunchpadProMK3.updateRow0SelectedDeckSwatch();

  // Bind all MIDI input handlers after extras/helpers are initialized
  LOG.debug("LaunchpadProMK3.initMidiHandlers()", 1, 0, null, C.G)
  LaunchpadProMK3.initMidiHandlers();

  // Select the initial desk
  // DEBUG("LaunchpadProMK3.selectDeck(1)", C.G, 1)
  // LaunchpadProMK3.selectDeck(1);


  // Initialise zeroth page (hotcues)
  LOG.debug("LaunchpadProMK3.selectPage(0)", 1, 0, null, C.G)
  LaunchpadProMK3.selectPage(0);

  // Print concise readme
  LaunchpadProMK3.printReadme();

  LOG.debug("init finished", 2, 24, null, C.R);
};



// MARK: BASE FUNCTIONS

/**
 * set Launchpad Pro MK3 to Programmer Mode
 * required for custom LED control via SysEx
 * @returns {void}
 */
LaunchpadProMK3.initProgrammerMode = function () {
  LaunchpadProMK3.sendSysEx(MIDI.PROGRAMMER_MODE);
};


/**
 * construct and send SysEx message to controller
 * @param {Array<number>} data - SysEx data bytes (without start/end markers)
 * @returns {void}
 */
LaunchpadProMK3.sendSysEx = function (data) {
  const signal = [MIDI.SYSEX_START]
    .concat(MIDI.NOVATION_MANUFACTURER_ID)
    .concat([0x02, MIDI.LAUNCHPAD_PRO_MK3_DEVICE_ID])
    .concat(data)
    .concat([MIDI.SYSEX_END]);
  //DEBUG(signal)
  midi.sendSysexMsg(signal, signal.length);
};




// MARK: SLEEP()
// to add time between steps in multi hotcue function
// blocking busy-wait; keep durations small and avoid in performance-critical paths.
LaunchpadProMK3.sleep = function (time) {
  let then = Date.now();
  while (true) {
    let now = Date.now();
    if (now - then > time) {
      break;
    };
  };
};
// moved to LaunchpadProMK3.lastHotcueCreationTime for proper namespacing


/**
 * iterate over all decks with a callback
 * DRY helper to eliminate repeated deck iteration loops
 * @param {function} callback - function(deckNum, channel) to call for each deck
 * @returns {void}
 */
LaunchpadProMK3.forEachDeck = function(callback) {
  for (let deckNum = 1; deckNum <= this.totalDecks; deckNum++) {
    callback(deckNum, `[Channel${deckNum}]`);
  }
};


/**
 * cleanup connections for all decks using a cleanup function
 * DRY helper to eliminate repeated cleanup loops in selectPage
 * @param {function} cleanupFn - cleanup function to call for each deck
 * @returns {void}
 */
LaunchpadProMK3.cleanupConnectionsForAllDecks = function(cleanupFn) {
  this.forEachDeck((deckNum) => cleanupFn.call(this, deckNum));
};


/**
 * create deck button handler for row1 pads 1-4
 * DRY factory to eliminate duplicate deck button handlers
 * @param {number} buttonIndex - button index (1-4)
 * @param {number} orderIndex - physical order index (1-4)
 * @param {number} deckNum - deck number (1-4)
 * @returns {function} MIDI input handler function
 */
LaunchpadProMK3.createDeckButtonHandler = function(buttonIndex, orderIndex, deckNum) {
  return (channel, control, value, status, _group) => {
    if (value === 0) return;
    
    // page 0: hotcue operations (alt = clear all, shift = create multi, normal = select)
    if (this.currentPage === 0) {
      if (this.altHeld) {
        this.clearAllHotcues(deckNum);
        LOG.debug("Row1 pad " + buttonIndex + " + Alt: Clear all hotcues on deck " + deckNum, C.R);
      } else if (this.shiftHeld) {
        this.create4LeadupDropHotcues(deckNum, value);
        LOG.debug("Row1 pad " + buttonIndex + " + Shift: Create multiple hotcues for deck " + deckNum, C.Y);
      } else {
        const deck = parseInt(this.getDeckFromOrder(orderIndex), 10);
        if (!isNaN(deck)) {
          this.oneDeckCurrent = deck;
          this.updateRow0SelectedDeckSwatch();
          this.setupOneDeckRow1DeckButtons(deck);
          LOG.debug("Row1 pad " + buttonIndex + ": Selected deck " + deck, C.G);
        }
      }
    }
    
    // page 1: one-deck mode deck selection
    if (this.currentPage === 1) {
      const deck = parseInt(this.getDeckFromOrder(orderIndex), 10);
      if (!isNaN(deck)) {
        if (this.oneDeckCurrent !== deck) {
          this.oneDeckCurrent = deck;
          this.updateOneDeckPage();
        } else {
          this.setupOneDeckRow1DeckButtons(deck);
        }
      }
    }
  };
};


/**
 * page metadata registry
 * lightweight page handler system - maps page numbers to names and update functions
 * @type {Object}
 */
LaunchpadProMK3.pageMetadata = {
  0: { name: 'hotcues', updateFn: function() { LaunchpadProMK3.updateHotcuePage(); LaunchpadProMK3.updateHotcueBankLights(); LaunchpadProMK3.cleanupConnectionsForAllDecks(LaunchpadProMK3.setupPage0SidepadFlashing); } },
  1: { name: 'onedeck', updateFn: function() { LaunchpadProMK3.updateOneDeckPage(); } },
  2: { name: 'beatjump', updateFn: function() { LaunchpadProMK3.updateBeatjumpPage(); } },
  3: { name: 'bpmscale', updateFn: function() { LaunchpadProMK3.updateBpmScalePage(); } },
  4: { name: 'loop_forward', updateFn: function() { LaunchpadProMK3.updateLoopPage(); } },
  5: { name: 'loop_reverse', updateFn: function() { LaunchpadProMK3.updateReverseLoopPage(); } },
  6: { name: 'loop_move', updateFn: function() { LaunchpadProMK3.updateLoopMovePage(); } },
  7: { name: 'loop_resize', updateFn: function() { LaunchpadProMK3.updateLoopResizePage(); } },
  8: { name: 'animation_1', updateFn: function() { LaunchpadProMK3.page8Handler && LaunchpadProMK3.page8Handler(); } },
  9: { name: 'animation_2', updateFn: function() { LaunchpadProMK3.page9Handler && LaunchpadProMK3.page9Handler(); } },
  10: { name: 'reserved', updateFn: function() { /* reserved */ } },
  11: { name: 'reserved', updateFn: function() { /* reserved */ } }
};

/**
 * get current page metadata
 * @returns {Object} page metadata {name, updateFn}
 */
LaunchpadProMK3.getCurrentPageInfo = function() {
  return this.pageMetadata[this.currentPage] || { name: 'unknown', updateFn: function() {} };
};

/**
 * get page name by number
 * @param {number} pageNum - page number (0-11)
 * @returns {string} page name
 */
LaunchpadProMK3.getPageName = function(pageNum) {
  const meta = this.pageMetadata[pageNum];
  return meta ? meta.name : 'unknown';
};


/**
 * initialize all controller variables and state
 * MARK: initVars()
 * called during init() to set up pad addresses, colors, and state objects
 * @returns {void}
 */
LaunchpadProMK3.initVars = function () {
  //// Initialize main variables

  // MIDI addresses of the main 8x8 grid (64 pads)
  // Addresses are arranged from top-left to bottom-right
  LaunchpadProMK3.mainpadAddresses = ADDRESSES.MAIN_GRID;


  // Sidepad system
  // MIDI addresses of the left/right side pads (16 total)
  // Arranged in 4 groups of 4 for the 4 decks
  LaunchpadProMK3.sidepads = ADDRESSES.SIDE_PADS;


  // Sidepad control names for intro/outro markers
  // Each deck gets 4 sidepads: intro start, intro end, outro start, outro end
  LaunchpadProMK3.sidepadNames = PAGE_CONFIG.SIDEPAD_NAMES;


  // Control button rows
  // Row above main pads (8 buttons)
  LaunchpadProMK3.row0 = ADDRESSES.ROW_0;

  // Rows below main pads (16 buttons total)
  LaunchpadProMK3.row1 = ADDRESSES.ROW_1;
  LaunchpadProMK3.row2 = ADDRESSES.ROW_2;

  // Configuration for page selection buttons on row2 (first 4 pads)
  // each button toggles between two pages on normal press
  // alt modifier held + press overrides to access pages 8-11
  // Button 0: Page 0 (Hotcues) ↔ Page 1 (One Deck) | Alt: Page 8 (Animation 1)
  // Button 1: Page 2 (Beatjump) ↔ Page 3 (BPM Scale) | Alt: Page 9 (Animation 2)
  // Button 2: Page 4 (Forward Loop) ↔ Page 5 (Reverse Loop) | Alt: Page 10 (Future)
  // Button 3: Page 6 (Loop Move) ↔ Page 7 (Loop Resize) | Alt: Page 11 (Future)
  // Note: Row2 pad 5 (index 4) is now dedicated shift modifier (not a page button)
  // Note: Row2 pad 6 (index 5) is reserved for Undo
  // Note: Row2 pad 7 (index 6) is reserved for keep playing mode
  LaunchpadProMK3.pageButtonConfig = PAGE_CONFIG.BUTTON_MAP;

  // Colors for page indicator LEDs on row2
  // Primary page color (bright red)
  LaunchpadProMK3.pagePrimaryHighlightRgb = COLORS.RGB.PAGE_PRIMARY;   
  // Alt page color (pastel red for toggled state)
  LaunchpadProMK3.pageAltHighlightRgb = COLORS.RGB.PAGE_ALT;


  // Deck physical order (pad address offsets) and deck colours
  // Order determines which 16-pad section of the grid each deck controls
  // Colors are used for visual identification and LED lighting
  LaunchpadProMK3.deck.config = {
    "1": { order: 2, colour: COLORS.HEX.DECK_1_BLUE }, //blue
    "2": { order: 3, colour: COLORS.HEX.DECK_2_YELLOW }, //yellow
    "3": { order: 1, colour: COLORS.HEX.DECK_3_MAGENTA }, //magenta
    "4": { order: 4, colour: COLORS.HEX.DECK_4_GREEN }  //green
  };

  // Helper function to find which deck has a specific physical order
  // Used for mapping button presses to the correct deck based on grid position
  LaunchpadProMK3.getDeckFromOrder = function(order) {
    return Object.keys(LaunchpadProMK3.deck.config).find(key => LaunchpadProMK3.deck.config[key].order === order);
  };

  // BPM scaling controls for page 3
  // Each column represents a different tempo scaling factor
  // Columns 1-4: slower tempos (0.5x to 1.0x), Columns 5-8: faster tempos (1.25x to 2.0x)
  LaunchpadProMK3.bpmScaleColumns = [
    { index: 1, scale: 0.5, control: "beats_set_halve", indicator: "beat_active_0_5", colour: COLORS.HEX.BPM_SCALE_RED }, //2
    { index: 2, scale: 0.666, control: "beats_set_twothirds", indicator: "beat_active_0_666", colour: COLORS.HEX.BPM_SCALE_GREEN }, //1.5
    { index: 3, scale: 0.75, control: "beats_set_threefourths", indicator: "beat_active_0_75", colour: COLORS.HEX.BPM_SCALE_PURPLE }, //1.333
    { index: 4, scale: 1, control: "beats_undo_adjustment", indicator: "beat_active", colour: COLORS.HEX.BPM_SCALE_DARK_RED }, //1
    { index: 5, scale: 1.25, control: "beats_set_fivefourths", indicator: "beat_active_1_25", colour: COLORS.HEX.BPM_SCALE_BLUE }, //
    { index: 6, scale: 1.333, control: "beats_set_fourthirds", indicator: "beat_active_1_333", colour: COLORS.HEX.BPM_SCALE_DARK_PURPLE }, //0.75
    { index: 7, scale: 1.5, control: "beats_set_threehalves", indicator: "beat_active_1_5", colour: COLORS.HEX.BPM_SCALE_LIGHT_GREEN }, //0.666
    { index: 8, scale: 2, control: "beats_set_double", indicator: "beat_active_2", colour: COLORS.HEX.BPM_SCALE_LIGHT_RED } //0.5
  ];


  // provide the rgb colors for the bpm scaling columns in an array for easy use later
  // Note: this precomputed array is currently unused; leave stub for potential future use.
  // const scaleColumnRgb = LaunchpadProMK3.bpmScaleColumns.map(column => LaunchpadProMK3.hexToRGB(column.colour));

  LaunchpadProMK3.totalDecks = Object.keys(LaunchpadProMK3.deck.config).length;
  // Hotcue system configuration
  // Separate variables: total hotcues vs grid display 
  LaunchpadProMK3.totalDeckHotcuePadsShown = 64 / LaunchpadProMK3.totalDecks; // Grid display calculation (16 per deck for 4 decks)
  LaunchpadProMK3.totalDeckHotcueButtons = 36; // Total hotcue buttons per deck (3 banks of 16, 16, 4)

  // LED brightness scaling for different deck states
  // These set how bright the LEDs are for loaded and unloaded decks
  LaunchpadProMK3.deckLoadedActiveDimscale = 0.85  // Bright for active hotcues
  LaunchpadProMK3.deckLoadedInactiveDimscale = 0.4 // Medium for loaded but inactive
  LaunchpadProMK3.deckUnloadedDimscale = 0.2       // Dim for unloaded decks
  // One-deck page specific brightness for the selected deck when unloaded
  // Lower this so unloaded looks clearly dimmer than loaded (ratio^2)
  LaunchpadProMK3.oneDeckUnloadedDimscale = 0.39

  // Brightness/contrast control variables for dimmed pads
  // Controls the visual feedback for loaded vs unloaded decks
  LaunchpadProMK3.dimBrightnessStep = 0.05; // How much to change brightness by
  LaunchpadProMK3.dimBrightnessMin = 0.1;   // Minimum brightness level
  LaunchpadProMK3.dimBrightnessMax = 0.9;   // Maximum brightness level

  // Global brightness scaling (affects every pad on every page)
  // New system: all LED outputs are scaled by this factor inside sendRGB().
  // Range 0.1..1.0; step 0.05. Kept separate from legacy per-deck dimscales above.
  LaunchpadProMK3.globalBrightnessScale = 1.0;
  LaunchpadProMK3.globalBrightnessStep = 0.075;
  LaunchpadProMK3.globalBrightnessMin = 0.10;
  LaunchpadProMK3.globalBrightnessMax = 1.00;

  // Button system tracking
  // Track what buttons are what for easy reference
  LaunchpadProMK3.buttons = {};

  // Page system tracking
  // Track which page is selected (0-9)
  LaunchpadProMK3.currentPage = 0; // Page 0 for hotcues
  // Total number of pages (0..9)
  LaunchpadProMK3.totalPages = 10;

  // Hotcue operation tracking
  // Track which hotcue was last used for undo/redo system
  LaunchpadProMK3.lastHotcue = []; // Page 0 for hotcues

  // Track what hotcue was last deleted for redo system
  LaunchpadProMK3.redoLastDeletedHotcue = [];

  // Track which deck channel was last used for hotcue operations
  LaunchpadProMK3.lastHotcueChannel = "undefined"

  // Modifier button state tracking
  // Track if the shift button is pressed (accesses alternate functions)
  LaunchpadProMK3.shiftHeld = 0;

  // Track if row0 pad 8 is being held down (for clear all hotcues modifier)
  LaunchpadProMK3.altHeld = 0;

  // Track if "keep playing" mode is active (when row2[7] is pressed)
  LaunchpadProMK3.keepPlayingMode = false;

  // Track global Slip mode state (dedicated toggle applies to all decks)
  LaunchpadProMK3.slipEnabled = false;

  // Track global reverse roll state (dedicated toggle applies to all decks)
  LaunchpadProMK3.reverseRollEnabled = false;

  // Hotcue bank switching system - now per-deck to support individual pagination
  // Each deck has its own hotcue bank: 1 (hotcues 1-16), 2 (hotcues 17-32), 3 (hotcues 33-36)
  // Banks can be cycled independently per deck or all at once
  LaunchpadProMK3.hotcueBankPerDeck = {
    1: 1, // Deck 1 starts on bank 1
    2: 1, // Deck 2 starts on bank 1  
    3: 1, // Deck 3 starts on bank 1
    4: 1  // Deck 4 starts on bank 1
  };
  
  // Legacy global bank for compatibility - will be phased out
  LaunchpadProMK3.hotcueBankActive = 1;
  
  // Functions moved to Init Extras Helpers section below to declutter initVars
  // - cycleHotcueBank()
  // - cycleHotcueBankAllDecks()
  // - refreshCurrentPage()
  // - decreaseDimBrightness()
  // - increaseDimBrightness()

  // Loop jump sizes for one-deck loop pads
  LaunchpadProMK3.loopJumpSizes = [
    "512",
    "256",
    "128",
    "64",
    "32",
    "16",
    "8",
    "4",
    "4",
    "2",
    "1",
    "0.5",
    "0.25",
    "0.125",
    "0.0625",
    "0.03125"
  ]; 
  // Default one-deck loop behavior: beatlooproll (latched, non-momentary by default)
LaunchpadProMK3.oneDeckLoopUsesRoll = true;
  // Default one-deck loop press semantics for persistent loops: use toggle instead of activate
  LaunchpadProMK3.oneDeckUseLoopToggle = true;
  // Whether a persistent loop should exit on pad release (momentary behavior for beatloop)
  // When true and using persistent loops (not roll), pressing a loop pad enables the loop
  // and releasing the pad turns the loop off.
LaunchpadProMK3.oneDeckLoopExitOnRelease = false;
// Track which pad currently owns the active loop on one-deck page (for LED restore logic)
LaunchpadProMK3.oneDeckActiveLoopPad = null;
// Debounce duplicate press events on one-deck loop pads (press locked until release)
LaunchpadProMK3._loopPadPressed = {};
// Single verification timer to avoid stacking multiple LED repaints
LaunchpadProMK3._loopVerifyTimerId = null;
// Ensure we only attach loop mode switch handlers once to avoid duplicates on page refresh
LaunchpadProMK3._row0LoopModeSwitchAttached = false;
// Fixed colors for one-deck mode buttons (row 0, pads 1 and 2); randomization disabled
// Keep function for compatibility, but return a stable mid-brightness value.
LaunchpadProMK3._rand7 = function () { return 64; }; // stable mid-brightness value
// Use explicit RGBs aligned with updateOneDeckModeButtons() palettes
LaunchpadProMK3.oneDeckTogglePadColor = COLORS.RGB.ONE_DECK_TOGGLE; // turquoise base
LaunchpadProMK3.oneDeckRollPadColor = COLORS.RGB.ONE_DECK_ROLL;    // violet base


  // MARK: INITSTATE()
  // centralized state initialization - all state objects created once here
  // track active loop pad per deck for non-one-deck loop pages (4/5)
  LaunchpadProMK3.loopActivePadByDeck = { 1: null, 2: null, 3: null, 4: null };
  
  // track active roll per deck for one-deck mode
  LaunchpadProMK3.oneDeckActiveRollByDeck = {};
  
  // hotcue sequence timers and cancellation tokens
  LaunchpadProMK3._hotcueSequenceTimers = {};
  LaunchpadProMK3._hotcueSequenceTokens = {};
  
  // loop verification timer id
  LaunchpadProMK3._loopVerifyTimerId = null;
  
  // bpm flash animation system
  // initialize bpmFlashStep object for all pads (11 through 88)
  LaunchpadProMK3.bpmFlashStep = {};

  // animation and timing system initialization
  LaunchpadProMK3.lastFlashTime = {};
  LaunchpadProMK3.songLengthInBeatsSamples = {};
  LaunchpadProMK3.lastTriggerOfPlayConnection = {};
  LaunchpadProMK3.lastBeatStep = {};
  
  // animation state tracking objects
  LaunchpadProMK3.animationSteps = {};
  LaunchpadProMK3.lastBeatSteps = {};
};



/**
 * initialize control buttons and their state
 * MARK: initExtras()
 * sets up shift, alt, brightness, and other control buttons
 * @returns {void}
 */
LaunchpadProMK3.initExtras = function () {
  // control button system initialization
  // note: deck order is currently hardcoded via DECK_CONSTANTS.BUTTON_MAP
  // this is intentional for predictable layout; use DECK_CONSTANTS to customize


  // shift modifier button (moved to row2 pad 5)
  // press and hold to access alternate functions for other pads
  LaunchpadProMK3.buttons.shift = LaunchpadProMK3.row2[4]
  // Handler moved to initMidiHandlers()


  // Alt modifier button (row1 pad 5) - used for clear all hotcues functionality and secondary page access
  LaunchpadProMK3.buttons.alt = LaunchpadProMK3.row1[4]
  // Handler moved to initMidiHandlers()

  // Brightness control and hotcue bank switching (row0[0] and row0[1])
  // Normal press: brightness control for dimmed pads
  // Shift + press: cycle hotcue banks for all decks
  LaunchpadProMK3.buttons.brightnessControlDown = LaunchpadProMK3.row0[0]
  // Handler moved to initMidiHandlers()
  
  LaunchpadProMK3.buttons.brightnessControlUp = LaunchpadProMK3.row0[1]
  // Handler moved to initMidiHandlers()

  // Initialize hotcue bank lights
  LaunchpadProMK3.updateHotcueBankLights();

  // three-function controls for row 1 pads 1-4 on page 0:
  // - default: select deck/channel (highlights selection)
  // - shift held: create multiple hotcues (4 leadup + drop + 3 outro)
  // - alt held: clear all hotcues for the associated deck
  // note: deck mapping is based on physical order, not deck number
  // row1 pad 1: maps to physical order 1
  LaunchpadProMK3.buttons.deckButton1 = LaunchpadProMK3.row1[0]
  // Handler moved to initMidiHandlers()

  // row1 pad 2: maps to physical order 2
  LaunchpadProMK3.buttons.deckButton2 = LaunchpadProMK3.row1[1]
  // Handler moved to initMidiHandlers()

  // row1 pad 3: maps to physical order 3
  LaunchpadProMK3.buttons.deckButton3 = LaunchpadProMK3.row1[2]
  // Handler moved to initMidiHandlers()

  // row1 pad 4: maps to physical order 4
  LaunchpadProMK3.buttons.deckButton4 = LaunchpadProMK3.row1[3]
  // Handler moved to initMidiHandlers()


  // Undo/redo hotcue system
  // Undo last hotcue (row2 pad 6)
  LaunchpadProMK3.buttons.undoLastHotcue = LaunchpadProMK3.row2[5]
  // Handler moved to initMidiHandlers()


  // Redo last hotcue (row1 pad 6)
  LaunchpadProMK3.buttons.redoLastHotcue = LaunchpadProMK3.row1[5]
  // Handler moved to initMidiHandlers()


  // Keep playing mode toggle (row2 pad 7)
  LaunchpadProMK3.buttons.keepPlayingMode = LaunchpadProMK3.row2[6]
  // Handler moved to initMidiHandlers()
  

  // dedicated slip toggle (moved to row1 pad 7)
  LaunchpadProMK3.buttons.slipToggle = LaunchpadProMK3.row1[6];
  
  // momentary reverse roll (unused spare control – top-left CC)
  LaunchpadProMK3.buttons.reverseRollMomentary = ADDRESSES.REVERSE_ROLL_MOMENTARY
  // Helper to refresh slip LED from current LaunchpadProMK3.slipEnabled
  LaunchpadProMK3.refreshSlipLed = function() {
    const on = !!LaunchpadProMK3.slipEnabled;
    const onCol = COLORS.RGB.SLIP_ON;   // teal when ON
    const offCol = COLORS.RGB.SLIP_OFF;  // dim when OFF
    try {
      const pad = LaunchpadProMK3.buttons.slipToggle;
      const col = on ? onCol : offCol;
      LaunchpadProMK3.sendRGB(pad, col);
    } catch (e) { DEBUG("refreshSlipLed exception: " + e, C.R); }
  };
  // Set slip for all decks and update LED
  LaunchpadProMK3.setSlipEnabled = function(on) {
    LaunchpadProMK3.slipEnabled = !!on;
    LaunchpadProMK3.forEachDeck((deckNum, channel) => {
      try { engine.setValue(channel, CONTROLS.SLIP_ENABLED, LaunchpadProMK3.slipEnabled ? 1 : 0); } catch (e) { DEBUG("setSlipEnabled deck " + deckNum + " exception: " + e, C.R); }
    });
    LaunchpadProMK3.refreshSlipLed();
  };
  // Read current engine slip state to derive initial LED
  LaunchpadProMK3.updateSlipStateFromEngine = function() {
    let any = false;
    LaunchpadProMK3.forEachDeck((deckNum, channel) => {
      try { if (engine.getValue(channel, CONTROLS.SLIP_ENABLED) === 1) { any = true; } } catch (e) { DEBUG("updateSlipStateFromEngine deck " + deckNum + " exception: " + e, C.R); }
    });
    LaunchpadProMK3.slipEnabled = any;
    LaunchpadProMK3.refreshSlipLed();
  };
  // Clear all persistent loops and rolls across all decks (Shift + Slip)
  LaunchpadProMK3.clearAllLoopsAndRolls = function() {
    try {
      // Stop any pending loop verification timer to avoid overlap
      if (LaunchpadProMK3._loopVerifyTimerId) {
        try { engine.stopTimer(LaunchpadProMK3._loopVerifyTimerId); } catch (e) { DEBUG("stopTimer loopVerifyTimer exception: " + e, C.R); }
        LOG.debug("Shift+Slip: stopped loopVerifyTimer id " + C.O + LaunchpadProMK3._loopVerifyTimerId, C.Y);
        LaunchpadProMK3._loopVerifyTimerId = null;
      }
      // Clear per-deck states
      LaunchpadProMK3.forEachDeck((deckNum, channel) => {
        try {
          // Turn off any active roll first
          try {
            const rec = LaunchpadProMK3.oneDeckActiveRollByDeck[deckNum];
            if (rec && rec.control) {
              engine.setValue(channel, rec.control, 0);
              LaunchpadProMK3.oneDeckActiveRollByDeck[deckNum] = null;
            }
          } catch (e) { DEBUG("clear active roll deck " + deckNum + " exception: " + e, C.R); }
          // Remove deck loop in/out points regardless of enabled state (clear unsaved loops)
          engine.setValue(channel, CONTROLS.LOOP_REMOVE, 1);
          // Clear per-deck latched pad
          try {
            LaunchpadProMK3.loopActivePadByDeck[deckNum] = null;
          } catch (e) { DEBUG("clear loop active pad deck " + deckNum + " exception: " + e, C.R); }
        } catch (e) { DEBUG("Shift+Slip: deck " + deckNum + " clear exception: " + e, C.Y); }
      });
      // Clear one-deck latch
      LaunchpadProMK3.oneDeckActiveLoopPad = null;
      // Refresh LEDs on current page
      LaunchpadProMK3.requestLoopLEDRefresh(LaunchpadProMK3.currentPage);
      if (LaunchpadProMK3.currentPage === 4 || LaunchpadProMK3.currentPage === 5) { LaunchpadProMK3.refreshCurrentPage(); }
      LOG.debug("Shift+Slip: cleared all loops and rolls across all decks", C.M);
    } catch (e) {
      LOG.debug("Shift+Slip clearAllLoopsAndRolls exception: " + e, C.R);
    }
  };
  // Bind slip toggle
  // Handler moved to initMidiHandlers()
  // Initialize LED to reflect engine state
  LaunchpadProMK3.updateSlipStateFromEngine();


  // Page button toggle handler for row2 (first 4 pads)
  // normal press: toggles between primary and alt pages
  // alt held + press: overrides to access pages 8-11
  LaunchpadProMK3.handlePageButtonPress = function(buttonIndex) {
    const cfg = LaunchpadProMK3.pageButtonConfig[buttonIndex];
    if (!cfg || cfg.primary === null) {
      LOG.debug("handlePageButtonPress: no mapping for index " + C.O + buttonIndex, C.Y);
      return;
    }
    
    // alt held: override to altPage (pages 8-11)
    if (LaunchpadProMK3.altHeld && cfg.altPage !== undefined) {
      LOG.debug("handlePageButtonPress(" + C.O + buttonIndex + C.RE + ") [alt held] -> page " + C.O + cfg.altPage, C.G);
      LaunchpadProMK3.selectPage(cfg.altPage);
      return;
    }
    
    // normal press: toggle between primary and alt pages
    const primary = cfg.primary;
    const alt = cfg.alt;
    const current = LaunchpadProMK3.currentPage;

    let target = primary;
    if (alt !== null && (current === primary || current === alt)) {
      target = (current === primary) ? alt : primary;
    }
    LOG.debug("handlePageButtonPress(" + C.O + buttonIndex + C.RE + ") -> target page " + C.O + target, C.G);
    LaunchpadProMK3.selectPage(target);
  };

  // Bind the page selection buttons (row2 pads 1-4) to the toggle handler
  // Handlers moved to initMidiHandlers()


  // Hotcue color switching controls
  // Previous hotcue color (row0 pad 3)
  LaunchpadProMK3.buttons.hotcueColorSwitchPrev = LaunchpadProMK3.row0[2]
  // Handler moved to initMidiHandlers()

  // Next hotcue color (row0 pad 4)
  LaunchpadProMK3.buttons.hotcueColorSwitchNext = LaunchpadProMK3.row0[3]
  // Handler moved to initMidiHandlers()
  LOG.debug("## end LaunchpadProMK3.initExtras() - all control buttons initialized", 0, 20, null, C.R);


  // Effects and hotcue clearing system
  // Toggle all individual effects on/off (row0 pad 8)
  // Also serves as modifier for clear all hotcues when held
  LaunchpadProMK3.allEffectsEnabled = false; // Track the state
  
  LaunchpadProMK3.buttons.allEffectsEnabled = LaunchpadProMK3.row0[7]
  
/**
 * update brightness button LEDs for one-deck mode
 * sets row0 pads 0-1 to show brightness controls
 * @returns {void}
 */
LaunchpadProMK3.updateOneDeckModeButtons = function () {
  try {
    if (LaunchpadProMK3.currentPage !== 1 || !LaunchpadProMK3.row0) return;
    // Use the global bank light scheme (green/jade) for brightness pads on page 1 as well
    LaunchpadProMK3.updateHotcueBankLights();
  } catch (e) { DEBUG("updateOneDeckModeButtons exception: " + e, C.R); }
};

// Helper: row0 loop mode switch visual/inputs now use ONLY pads 5 and 6
// - row0[5] = EXIT-ON-RELEASE toggle indicator/input (for persistent loops)
// - row0[6] = LOOP TYPE toggle (beatlooproll vs beatloop)
LaunchpadProMK3.updateRow0LoopModeSwitch = function () {
  try {
    if (!LaunchpadProMK3.row0) return;
    const pads = LaunchpadProMK3.row0;
    const left = pads[5], right = pads[6];
    if (left === undefined || right === undefined) return;
    // do not override row0 visuals on animation pages (8/9)
    if (LaunchpadProMK3.currentPage === 8 || LaunchpadProMK3.currentPage === 9) return;
    const bright = [127, 127, 127];
    const dim    = [30, 30, 30];    // mildly dark when off (loop pages)
    const dark   = [6, 6, 6];       // proper dark on non-loop pages
    const isRoll = LaunchpadProMK3.oneDeckLoopUsesRoll === true;
    const exitOnRelease = LaunchpadProMK3.oneDeckLoopExitOnRelease === true;
    const p = LaunchpadProMK3.currentPage;
    const isLoopContext = (p === 1 || p === 4 || p === 5 || p === 6 || p === 7);

    // On loop pages: show bright when on, dim when off. On other pages: very dark.
    const leftCol = isLoopContext ? (exitOnRelease ? bright : dim) : dark;
    const rightCol = isLoopContext ? (isRoll ? bright : dim) : dark;

    LaunchpadProMK3.sendRGB(left, leftCol);
    LaunchpadProMK3.sendRGB(right, rightCol);
    LOG.debug(
      () => "updateRow0LoopModeSwitch: p=" + p + " loopCtx=" + isLoopContext +
      " exitOnReleaseLED(row0[5])=" + JSON.stringify(leftCol) +
      " rollLED(row0[6])=" + JSON.stringify(rightCol) +
      " isRoll=" + isRoll + " exitOnRelease=" + exitOnRelease,
      0, 0, null, C.Y
    );
  } catch (e) { DEBUG("updateRow0LoopModeSwitch exception: " + e, C.R); }
};
/**
 * setup row0 loop mode switch visual indicators
 * updates LED colors based on loop/roll state
 * @returns {void}
 */
LaunchpadProMK3.setupRow0LoopModeSwitch = function () {
  try {
    if (!LaunchpadProMK3.row0) return;
    const pads = LaunchpadProMK3.row0;
    const left = pads[5], right = pads[6];
    // If already attached, only repaint LEDs to reflect current state
    if (LaunchpadProMK3._row0LoopModeSwitchAttached) {
      LaunchpadProMK3.updateRow0LoopModeSwitch();
      return;
    }
    const isRelevantPage = () => {
      const p = LaunchpadProMK3.currentPage;
      return (p === 1 || p === 4 || p === 5 || p === 6 || p === 7);
    };
    // Left pad: toggle exit-on-release
    if (left !== undefined) {
      midi.makeInputHandler(0xB0, left, (channel, control, value) => {
        if (!isRelevantPage()) return;
        if (value === 0) return; // press only
        LaunchpadProMK3.oneDeckLoopExitOnRelease = !LaunchpadProMK3.oneDeckLoopExitOnRelease;
        LOG.debug("Row0[5]: toggled exit-on-release -> " + (LaunchpadProMK3.oneDeckLoopExitOnRelease ? "enabled" : "disabled"), C.G);
        LaunchpadProMK3.updateRow0LoopModeSwitch();
        LaunchpadProMK3.updateOneDeckModeButtons();
      });
      LOG.debug("setupRow0LoopModeSwitch: attached EXIT-ON-RELEASE to row0[5] pad 0x" + left.toString(16).toUpperCase(), C.Y);
    }
    // Right pad: toggle roll vs set
    if (right !== undefined) {
      midi.makeInputHandler(0xB0, right, (channel, control, value) => {
        if (!isRelevantPage()) return;
        if (value === 0) return; // press only
        LaunchpadProMK3.oneDeckLoopUsesRoll = !LaunchpadProMK3.oneDeckLoopUsesRoll;
        LOG.debug("Row0[6]: toggled loop type -> " + (LaunchpadProMK3.oneDeckLoopUsesRoll ? "beatlooproll" : "beatloop"), C.G);
        LaunchpadProMK3.updateRow0LoopModeSwitch();
        LaunchpadProMK3.updateOneDeckModeButtons();
      });
      LOG.debug("setupRow0LoopModeSwitch: attached LOOP TYPE toggle to row0[6] pad 0x" + right.toString(16).toUpperCase(), C.Y);
    }
    LaunchpadProMK3.updateRow0LoopModeSwitch();
    LaunchpadProMK3._row0LoopModeSwitchAttached = true;
  } catch (e) { DEBUG("setupRow0LoopModeSwitch exception: " + e, C.R); }
};
 
// Helper: paint row0[4] swatch to selected deck color (usable on any page)
LaunchpadProMK3.updateRow0SelectedDeckSwatch = function () {
  try {
    if (!LaunchpadProMK3.row0) return;
    const pad = LaunchpadProMK3.row0[4];
    if (pad === undefined) return;
    // Use one-deck selection if set; default to deck 1
    const selectedDeck = LaunchpadProMK3.oneDeckCurrent || 1;
    const deckObj = LaunchpadProMK3.decks && LaunchpadProMK3.decks[selectedDeck];
    const deckColour = deckObj && deckObj.deckColour ? deckObj.deckColour : 0xFFFFFF;
    const rgb = LaunchpadProMK3.hexToRGB(deckColour);
    LaunchpadProMK3.sendRGB(pad, rgb);
    LOG.debug("updateRow0SelectedDeckSwatch: deck=" + selectedDeck + " colour=#" + deckColour + " rgb=" + rgb, C.M);
  } catch (e) { DEBUG("updateRow0SelectedDeckSwatch exception: " + e, C.R); }
};

 
/**
 * cycle to the next hotcue bank for a specific deck
 * banks: 1 (hotcues 1-16), 2 (17-32), 3 (33-36)
 * @param {number} deckNum - deck number (1-4)
 * @returns {void}
 */
LaunchpadProMK3.cycleHotcueBank = function(deckNum) {
  if (!LaunchpadProMK3.hotcueBankPerDeck[deckNum]) {
    LaunchpadProMK3.hotcueBankPerDeck[deckNum] = 1;
  }
  // Cycle through banks: 1 -> 2 -> 3 -> 1
  LaunchpadProMK3.hotcueBankPerDeck[deckNum] += 1;
  if (LaunchpadProMK3.hotcueBankPerDeck[deckNum] > 3) {
    LaunchpadProMK3.hotcueBankPerDeck[deckNum] = 1;
  }
  LOG.debug("cycleHotcueBank: Deck " + deckNum + " now on bank " + LaunchpadProMK3.hotcueBankPerDeck[deckNum], C.G);
  // Update the displays
  if (LaunchpadProMK3.currentPage === 0) {
    LaunchpadProMK3.updateHotcuePage();
  } else if (LaunchpadProMK3.currentPage === 1) {
    LaunchpadProMK3.updateOneDeckPage();
  }
};

/**
 * cycle hotcue banks for all decks simultaneously
 * @returns {void}
 */
LaunchpadProMK3.cycleHotcueBankAllDecks = function() {
  LaunchpadProMK3.forEachDeck((deckNum) => {
    if (!LaunchpadProMK3.hotcueBankPerDeck[deckNum]) {
      LaunchpadProMK3.hotcueBankPerDeck[deckNum] = 1;
    }
    // Cycle through banks: 1 -> 2 -> 3 -> 1
    LaunchpadProMK3.hotcueBankPerDeck[deckNum] += 1;
    if (LaunchpadProMK3.hotcueBankPerDeck[deckNum] > 3) {
      LaunchpadProMK3.hotcueBankPerDeck[deckNum] = 1;
    }
  });
  LOG.debug("cycleHotcueBankAllDecks: All decks now on bank " + LaunchpadProMK3.hotcueBankPerDeck[1], C.G);
  // Update the displays
  if (LaunchpadProMK3.currentPage === 0) {
    LaunchpadProMK3.updateHotcuePage();
  } else if (LaunchpadProMK3.currentPage === 1) {
    LaunchpadProMK3.updateOneDeckPage();
  }
  // Update bank lights to reflect new state
  LaunchpadProMK3.updateHotcueBankLights();
};

/**
 * refresh the current page's LEDs
 * called after brightness changes or page state updates
 * @returns {void}
 */
LaunchpadProMK3.refreshCurrentPage = function() {
  try {
    // page updater lookup - cleaner than switch statement
    const pageUpdaters = {
      0: LaunchpadProMK3.updateHotcuePage,
      1: LaunchpadProMK3.updateOneDeckPage,
      2: LaunchpadProMK3.updateBeatjumpPage,
      3: LaunchpadProMK3.updateBpmScalePage,
      4: LaunchpadProMK3.updateLoopPage,
      5: LaunchpadProMK3.updateReverseLoopPage,
      6: LaunchpadProMK3.updateLoopMovePage,
      7: LaunchpadProMK3.updateLoopResizePage,
      8: LaunchpadProMK3.page8Handler,
      9: LaunchpadProMK3.page9Handler
    };
    
    const updater = pageUpdaters[LaunchpadProMK3.currentPage];
    if (updater) {
      return updater();
    }
  } catch (e) { DEBUG("refreshCurrentPage exception: " + e, C.Y); }
};

/**
 * decrease global LED brightness
 * @returns {void}
 */
LaunchpadProMK3.decreaseDimBrightness = function() {
  LaunchpadProMK3.globalBrightnessScale = Math.max(
    LaunchpadProMK3.globalBrightnessMin,
    +(LaunchpadProMK3.globalBrightnessScale - LaunchpadProMK3.globalBrightnessStep).toFixed(2)
  );
  LOG.debug("decreaseDimBrightness: globalBrightnessScale=" + LaunchpadProMK3.globalBrightnessScale, C.Y);
  LaunchpadProMK3.refreshCurrentPage();
  // Repaint bank indicators if visible (no-op on other pages)
  LaunchpadProMK3.updateHotcueBankLights();
};

/**
 * increase global LED brightness
 * @returns {void}
 */
LaunchpadProMK3.increaseDimBrightness = function() {
  LaunchpadProMK3.globalBrightnessScale = Math.min(
    LaunchpadProMK3.globalBrightnessMax,
    +(LaunchpadProMK3.globalBrightnessScale + LaunchpadProMK3.globalBrightnessStep).toFixed(2)
  );
  LOG.debug("increaseDimBrightness: globalBrightnessScale=" + LaunchpadProMK3.globalBrightnessScale, C.Y);
  LaunchpadProMK3.refreshCurrentPage();
  // Repaint bank indicators if visible (no-op on other pages)
  LaunchpadProMK3.updateHotcueBankLights();
};

// Helper: Build loop control name string for Mixxx
// Input opts: { roll: boolean, reverse: boolean, size: string|number, suffix?: string }
// Examples:
//  - {roll:false, reverse:false, size:"4"}       -> "beatloop_4_activate"
//  - {roll:true,  reverse:true,  size:"8"}       -> "beatlooproll_r8_activate"
//  - {roll:true,  reverse:false, size:"0.5"}     -> "beatlooproll_0.5_activate"
//  - {roll:false, reverse:true,  size:"0.0625"}  -> "beatloop_r0.0625_activate"
LaunchpadProMK3.buildLoopControlName = function (opts) {
  try {
    opts = opts || {};
    const roll = !!opts.roll;
    const reverse = !!opts.reverse;
    let size = (opts.size !== undefined && opts.size !== null) ? String(opts.size) : "4";
    // Normalize size token spacing
    size = size.trim();
    // Default suffix for Mixxx loop triggering is _activate
    const suffix = (typeof opts.suffix === "string" && opts.suffix.length) ? opts.suffix : "_activate";
    const prefix = roll ? "beatlooproll_" : "beatloop_";
    const rev = reverse ? "r" : "";
    const control = prefix + rev + size + suffix;
    LOG.debug("buildLoopControlName: roll=" + roll + " reverse=" + reverse + " size=" + size + " -> " + control, 1, 0, null, C.G);
    return control;
  } catch (e) {
    LOG.debug("buildLoopControlName exception: " + e, C.R);
    // Safe fallback
    return (opts && opts.roll ? "beatlooproll_" : "beatloop_") + "4_activate";
  }
};

/**
 * handle loop/beatjump control activation
 * manages both one-deck and multi-deck loop pages
 * @param {string} channel - Mixxx channel (e.g., '[Channel1]')
 * @param {number} padAddress - MIDI pad address
 * @param {number} gridPosition - grid position (0-63)
 * @param {string} pageType - 'oneDeck' or page number
 * @param {number} deckNum - deck number (1-4)
 * @param {number} [pressValue] - MIDI value (0=release, non-zero=press)
 * @returns {boolean} true if handled
 */
LaunchpadProMK3.handleLoopControl = function(channel, padAddress, gridPosition, pageType, deckNum, pressValue) {
  LOG.debug("handleLoopControl: channel=" + channel + " padAddress=" + padAddress + " gridPosition=" + gridPosition + " pageType=" + pageType + " deckNum=" + deckNum + " pressValue=" + pressValue, C.Y);
  
  // handling for one-deck page: use the full loopJumpSizes (16 sizes across over two rows per direction)
  if (pageType === "oneDeck") {
    try {
      // ignore if no track loaded
      try { if (engine.getValue(channel, CONTROLS.TRACK_LOADED) !== 1) { return false; } } catch (e) { DEBUG("track_loaded check exception: " + e, C.R); }
      // Ensure the array exists
      const sizes = LaunchpadProMK3.loopJumpSizes;
      // Derive row/column from gridPosition (0..63)
      const rowIndex = Math.floor(gridPosition / 8);   // 0..7 (0=top)
      const colIndex = gridPosition % 8;               // 0..7 (0=left)
      LOG.debug("handleLoopControl: rowIndex=" + rowIndex + " colIndex=" + colIndex, C.Y);
      // Direction mapping (top two rows = reverse, bottom two = forward)
      const isReverse = (rowIndex >= 0 && rowIndex <= 1);
      // Within each direction, map to 0/1
      const rowWithinDir = isReverse ? rowIndex : (rowIndex - 2);
      // Compute size index according to custom per-row mapping:
      // Reverse rows (rowIndex 0–1):
      //   - Row 0: indices 0..7, left→right = large→small
      //   - Row 1: indices 8..15, RIGHT end = largest → flip columns
      // Forward rows (rowIndex 2–3):
      //   - Row 2: indices 8..15, RIGHT end = largest → flip columns
      //   - Row 3: indices 0..7, left→right = large→small
      let sizeIndex;
      if (isReverse) {
        if (rowWithinDir === 0) {
          sizeIndex = 0 + colIndex;            // top outer row: 0..7 (large->small)
        } else {
          sizeIndex = 8 + (7 - colIndex);      // top inner row: 8..15, flipped so rightmost is largest
        }
      } else {
        if (rowWithinDir === 0) {
          sizeIndex = 8 + (7 - colIndex);      // bottom outer row: 8..15, flipped so rightmost is largest
        } else {
          sizeIndex = 0 + colIndex;            // bottom inner row: 0..7
        }
      }
      // Choose loop type on One-Deck page
      // roll usage follows the row0[6] toggle for both directions
      const deckNumLocal = LaunchpadProMK3.oneDeckCurrent || 1;
      const useRoll = !!LaunchpadProMK3.oneDeckLoopUsesRoll;
      // Determine size string: prefer loopJumpSizes; fallback to legacy 8-size map if unavailable
      const sizeStr = sizes[sizeIndex];
      LOG.debug("handleLoopControl: isReverse=" + isReverse + " sizeIndex=" + sizeIndex + " sizeStr=" + sizeStr, C.Y);

      // Choose control suffix
      // Always use _activate for reliability across all sizes; we implement toggle semantics in-script
      const isPressed = (pressValue === undefined) ? true : (pressValue !== 0);
      const suffix = "_activate";
      const control = LaunchpadProMK3.buildLoopControlName({ roll: useRoll, reverse: false, size: sizeStr, suffix: suffix });
      LOG.debug("handleLoopControl: isPressed=" + isPressed + " control=" + control, C.Y);

      if (useRoll) {
        const exitOnRelease = (LaunchpadProMK3.oneDeckLoopExitOnRelease === true);
        // momentary roll (exit-on-release)
        if (exitOnRelease) {
          if (isPressed) {
            try {
              const rec = LaunchpadProMK3.oneDeckActiveRollByDeck[deckNumLocal];
              // turn off any other roll
              if (rec && rec.control && rec.pad !== padAddress) {
                try { engine.setValue(channel, rec.control, 0); } catch (e) { DEBUG("turn off other roll exception: " + e, C.R); }
              }
              // ensure persistent loop is off first
              try { if (engine.getValue(channel, CONTROLS.LOOP_ENABLED) === 1) { engine.setValue(channel, CONTROLS.LOOP_ENABLED, 0); LaunchpadProMK3.oneDeckActiveLoopPad = null; } } catch (e) { DEBUG("disable persistent loop exception: " + e, C.R); }
              // engage roll
              try { if (isReverse) { engine.setValue(channel, CONTROLS.LOOP_ANCHOR, 1); } } catch (e) { DEBUG("set loop_anchor exception: " + e, C.R); }
              try { engine.setValue(channel, control, 1); } catch (e) { DEBUG("engage roll control exception: " + e, C.R); }
              LaunchpadProMK3.oneDeckActiveRollByDeck[deckNumLocal] = { pad: padAddress, control: control };
              try { LaunchpadProMK3.sendRGB(padAddress, ...COLORS.RGB.ACTIVE_GREEN); } catch (e) { DEBUG("sendRGB active green exception: " + e, C.R); }
            } catch (e) { DEBUG("momentary roll press error: " + e, C.Y); }
          } else {
            // release: stop only if this pad is active
            try {
              const rec = (LaunchpadProMK3.oneDeckActiveRollByDeck || {})[deckNumLocal];
              if (rec && rec.pad === padAddress) {
                try { engine.setValue(channel, rec.control, 0); } catch (e) { DEBUG("stop roll control exception: " + e, C.R); }
                LaunchpadProMK3.oneDeckActiveRollByDeck[deckNumLocal] = null;
                LaunchpadProMK3.requestLoopLEDRefresh(1);
              }
            } catch (e) { DEBUG("momentary roll release error: " + e, C.Y); }
          }
          return true;
        }
        // latched roll toggle (press to toggle on/off)
        if (isPressed) {
          try {
            const rec = LaunchpadProMK3.oneDeckActiveRollByDeck[deckNumLocal];
            if (rec && rec.pad === padAddress) {
              // toggle off current roll on same pad
              try { engine.setValue(channel, rec.control, 0); } catch (e) { DEBUG("toggle off roll exception: " + e, C.R); }
              LaunchpadProMK3.oneDeckActiveRollByDeck[deckNumLocal] = null;
              LaunchpadProMK3.requestLoopLEDRefresh(1);
              return true;
            }
            // If another roll is active on this deck, turn it off first
            if (rec && rec.control && rec.pad !== padAddress) {
              engine.setValue(channel, rec.control, 0);
            }
            // Ensure only one loop is active: if a persistent loop exists, disable/remove it first
            try {
              if (engine.getValue(channel, CONTROLS.LOOP_ENABLED) === 1) {
                if (LaunchpadProMK3.shiftHeld) {
                  engine.setValue(channel, CONTROLS.LOOP_REMOVE, 1);
                } else {
                  engine.setValue(channel, CONTROLS.LOOP_ENABLED, 0);
                }
                LaunchpadProMK3.oneDeckActiveLoopPad = null;
                LaunchpadProMK3.requestLoopLEDRefresh(1);
              }
            } catch (e) { DEBUG("disable persistent loop exception: " + e, C.R); }
            // Engage this roll
            try { if (isReverse) { engine.setValue(channel, CONTROLS.LOOP_ANCHOR, 1); } } catch (e) { DEBUG("set loop_anchor exception: " + e, C.R); }
            // engage roll and keep it on until toggled off explicitly
            try { engine.setValue(channel, control, 1); } catch (e) { DEBUG("engage roll control exception: " + e, C.R); }
            LaunchpadProMK3.oneDeckActiveRollByDeck[deckNumLocal] = { pad: padAddress, control: control };
            // keep it visibly green immediately; overlay will keep it
            try { LaunchpadProMK3.sendRGB(padAddress, 0x00, 0xFF, 0x00); } catch (e) { DEBUG("sendRGB green exception: " + e, C.R); }
            LaunchpadProMK3.requestLoopLEDRefresh(1);
          } catch (e) { DEBUG("latched roll toggle error: " + e, C.Y); }
        }
        // Ignore release for latched behavior; LEDs are refreshed on toggle
      } else {
        // Persistent loop press semantics
        if (isPressed) {
          // Shift: remove current loop (and do not create a new one)
          if (LaunchpadProMK3.shiftHeld) {
            if (engine.getValue(channel, CONTROLS.LOOP_ENABLED) === 1) {
              engine.setValue(channel, CONTROLS.LOOP_REMOVE, 1);
            }
            LaunchpadProMK3.oneDeckActiveLoopPad = null;
            LaunchpadProMK3.requestLoopLEDRefresh(1);
            LOG.debug("OneDeck: SHIFT remove loop", C.M);
            return true;
          }
          // Always support same-pad OFF for persistent loops, regardless of engine state (avoid race)
          if (LaunchpadProMK3.oneDeckActiveLoopPad === padAddress) {
            if (LaunchpadProMK3.shiftHeld) {
              engine.setValue(channel, CONTROLS.LOOP_REMOVE, 1);
            } else {
              engine.setValue(channel, CONTROLS.LOOP_ENABLED, 0);
            }
            LaunchpadProMK3.oneDeckActiveLoopPad = null;
            LaunchpadProMK3.requestLoopLEDRefresh(1);
            LOG.debug("OneDeck: toggled OFF current loop via same pad", C.M);
            LOG.debug("Loop control(oneDeck): " + C.O + control + C.RE + " row=" + rowIndex + " col=" + colIndex + " pressed=" + isPressed, 1, 0, null, C.G);
            return true;
          }
          const loopEnabled = engine.getValue(channel, CONTROLS.LOOP_ENABLED) === 1;

          // Toggle semantics: clear existing loop only if it's from a different pad in toggle mode
          if (LaunchpadProMK3.oneDeckUseLoopToggle) {
            if (loopEnabled && LaunchpadProMK3.oneDeckActiveLoopPad && LaunchpadProMK3.oneDeckActiveLoopPad !== padAddress) {
              if (LaunchpadProMK3.shiftHeld) {
                engine.setValue(channel, CONTROLS.LOOP_REMOVE, 1);
              } else {
                engine.setValue(channel, CONTROLS.LOOP_ENABLED, 0);
              }
              // Avoid immediate full-row repaint; timer below will refresh LEDs once new loop state is known
            }
          } else {
            // Activate mode: always clear existing loop before setting the new one if any loop is active
            if (loopEnabled) {
              if (LaunchpadProMK3.shiftHeld) {
                engine.setValue(channel, CONTROLS.LOOP_REMOVE, 1);
              } else {
                engine.setValue(channel, CONTROLS.LOOP_ENABLED, 0);
              }
              // Avoid immediate full-row repaint; timer below will refresh LEDs once new loop state is known
            }
          }
          // Trigger the selected control (pulse). Using _activate ensures loop is applied.
          // Ensure only one loop is active: if a roll is active on this deck, turn it off first
          try {
            const rollRec = (LaunchpadProMK3.oneDeckActiveRollByDeck || {})[deckNumLocal];
            if (rollRec && rollRec.control) {
              engine.setValue(channel, rollRec.control, 0);
              LaunchpadProMK3.oneDeckActiveRollByDeck[deckNumLocal] = null;
            }
          } catch (e) { DEBUG("clear roll before loop exception: " + e, C.R); }
          script.triggerControl(channel, control, 50);
          // immediate feedback and optimistic latch: show green now; verify shortly after
          try { LaunchpadProMK3.sendRGB(padAddress, 0x00, 0xFF, 0x00); } catch (e) { DEBUG("sendRGB green exception: " + e, C.R); }
          LaunchpadProMK3.oneDeckActiveLoopPad = padAddress;
          // verify loop state shortly after, but throttle to a single timer to avoid stacked repaints
          if (LaunchpadProMK3._loopVerifyTimerId) {
            try { engine.stopTimer(LaunchpadProMK3._loopVerifyTimerId); } catch (e) { DEBUG("stopTimer loopVerifyTimer exception: " + e, C.R); }
            LOG.debug("loopVerifyTimer: stopped previous id " + C.O + LaunchpadProMK3._loopVerifyTimerId, C.Y);
            LaunchpadProMK3._loopVerifyTimerId = null;
          }
          let loopVerifyId = engine.beginTimer(TIMING.LOOP_VERIFY_DELAY, function () {
            LaunchpadProMK3._loopVerifyTimerId = null;
            LOG.debug("loopVerifyTimer: fired id " + C.O + loopVerifyId + C.RE + " deck " + C.O + deckNumLocal, C.G);
            const enabled = (engine.getValue(channel, CONTROLS.LOOP_ENABLED) === 1);
            if (enabled) {
              LaunchpadProMK3.oneDeckActiveLoopPad = padAddress;
            } else {
              // If not enabled, clear the latch to avoid stale green
              LaunchpadProMK3.oneDeckActiveLoopPad = null;
            }
            LaunchpadProMK3.requestLoopLEDRefresh(1);
            LOG.debug("Loop control(oneDeck): " + C.O + control + C.RE + " row=" + rowIndex + " col=" + colIndex + " pressed=" + isPressed, 1, 0, null, C.G);
          }, true);
          LaunchpadProMK3._loopVerifyTimerId = loopVerifyId;
          LOG.debug("loopVerifyTimer: scheduled id " + C.O + loopVerifyId + C.RE + " deck " + C.O + deckNumLocal, C.G);
        } else {
          // Release behavior for persistent loops when exit-on-release is enabled
          if (LaunchpadProMK3.oneDeckLoopExitOnRelease && LaunchpadProMK3.oneDeckActiveLoopPad === padAddress) {
            engine.setValue(channel, CONTROLS.LOOP_ENABLED, 0);
            LaunchpadProMK3.oneDeckActiveLoopPad = null;
            LaunchpadProMK3.requestLoopLEDRefresh(1);
          } else if (LaunchpadProMK3.oneDeckLoopExitOnRelease) {
            // In exit-on-release mode, always restore LEDs on release
            LaunchpadProMK3.requestLoopLEDRefresh(1);
          }
        }
      }
    } catch (e) {
      LOG.debug("handleLoopControl(oneDeck) exception: " + e, C.R);
      return false;
    }
    return true;
  }

  // Non-one-deck pages (4–7): use the MIDDLE HALF of loopJumpSizes (8 sizes) per half-slice
  // - Top half of the deck slice (first 8 pads) = reverse (prefix 'r')
  // - Bottom half = forward
  // - Columns map left→right to largest→smallest within that 8-size middle window
  // Fallback to legacy LaunchpadProMK3.loopControls if loopJumpSizes not available
  const padIndexWithinSlice = (LaunchpadProMK3.mainpadAddresses.indexOf(padAddress) - LaunchpadProMK3.decks[deckNum].deckMainSliceStartIndex);
  if (padIndexWithinSlice < 0 || padIndexWithinSlice > 15) {
    LOG.debug("Loop control: invalid padIndexWithinSlice " + padIndexWithinSlice + " for padAddress " + padAddress, C.R);
    return false;
  }
  const column = padIndexWithinSlice % 8; // 0..7, left to right
  // page 4 = forward only; page 5 = reverse only
  const isReverse = (LaunchpadProMK3.currentPage === 5);

  // Determine loop type: follow roll toggle for both pages; reverse still uses roll but only when toggle on
  let useRoll = !!LaunchpadProMK3.oneDeckLoopUsesRoll;

  // on loop pages, map columns large->small to full 16-size table outer to inner halves by page
  let sizeStr;
  const sizes = LaunchpadProMK3.loopJumpSizes || [];
  if (sizes.length >= 16) {
    // columns 0..7 map to outer 8: indices 0..7 for reverse page, 8..15 for forward page (flipped)
    if (isReverse) {
      sizeStr = sizes[0 + column];
    } else {
      sizeStr = sizes[8 + (7 - column)];
    }
  } else if (sizes.length >= 8) {
    sizeStr = sizes[Math.min(7, Math.max(0, column))];
  } else {
    sizeStr = sizes[column] || "4";
  }
  
  // Build the control name for non-oneDeck pages
  const suffix = "_activate";
  const loopControl = LaunchpadProMK3.buildLoopControlName({ roll: useRoll, reverse: isReverse, size: sizeStr, suffix: suffix });
  LOG.debug("handleLoopControl(non-oneDeck): sizeStr=" + sizeStr + " isReverse=" + isReverse + " useRoll=" + useRoll + " control=" + loopControl, C.Y);
  
  // Toggle semantics and single-active enforcement on non-one-deck pages
  const isPressed = (pressValue === undefined) ? true : (pressValue !== 0);
  if (isPressed) {
    try {
      const currentActive = LaunchpadProMK3.loopActivePadByDeck[deckNum] || null;
      const rollRec = LaunchpadProMK3.oneDeckActiveRollByDeck[deckNum] || null;
      const loopEnabled = (engine.getValue(channel, CONTROLS.TRACK_LOADED) === 1 && engine.getValue(channel, CONTROLS.LOOP_ENABLED) === 1);
      // disallow on unloaded decks
      if (engine.getValue(channel, CONTROLS.TRACK_LOADED) !== 1) { return false; }

      if (useRoll) {
        // Same-pad roll toggles off
        if (rollRec && rollRec.pad === padAddress) {
          engine.setValue(channel, rollRec.control, 0);
          LaunchpadProMK3.oneDeckActiveRollByDeck[deckNum] = null;
          try { LaunchpadProMK3.requestLoopLEDRefresh(pageType); } catch (e) { DEBUG("requestLoopLEDRefresh exception: " + e, C.R); }
          return true;
        }
        // Ensure no persistent loop remains
        if (loopEnabled) {
          if (LaunchpadProMK3.shiftHeld) {
            engine.setValue(channel, CONTROLS.LOOP_REMOVE, 1);
          } else {
            engine.setValue(channel, CONTROLS.LOOP_ENABLED, 0);
          }
          LaunchpadProMK3.loopActivePadByDeck[deckNum] = null;
          try { LaunchpadProMK3.requestLoopLEDRefresh(pageType); } catch (e) { DEBUG("requestLoopLEDRefresh exception: " + e, C.R); }
        }
        // Turn off any other roll first
        if (rollRec && rollRec.control) {
          engine.setValue(channel, rollRec.control, 0);
          LaunchpadProMK3.oneDeckActiveRollByDeck[deckNum] = null;
        }
        // anchor reverse and engage latched roll
        try { if (isReverse) { engine.setValue(channel, "loop_anchor", 1); } } catch (e) { DEBUG("set loop_anchor exception: " + e, C.R); }
        try { engine.setValue(channel, loopControl, 1); } catch (e) { DEBUG("engage roll control exception: " + e, C.R); }
        try {
          LaunchpadProMK3.oneDeckActiveRollByDeck[deckNum] = { pad: padAddress, control: loopControl };
          LaunchpadProMK3.requestLoopLEDRefresh(pageType);
        } catch (e) { DEBUG("set active roll exception: " + e, C.R); }
        return true;
      } else {
        // Persistent loop
        if (currentActive === padAddress && loopEnabled) {
          // Same pad pressed again: toggle loop off
          if (LaunchpadProMK3.shiftHeld) {
            engine.setValue(channel, CONTROLS.LOOP_REMOVE, 1);
          } else {
            engine.setValue(channel, CONTROLS.LOOP_ENABLED, 0);
          }
          LaunchpadProMK3.loopActivePadByDeck[deckNum] = null;
          LaunchpadProMK3.updateRow0SelectedDeckSwatch();
          LaunchpadProMK3.setupOneDeckRow1DeckButtons(deck);
          return true;
        }
        // If a different pad is pressed while a loop is active, clear it first
        if (loopEnabled && currentActive && currentActive !== padAddress) {
          if (LaunchpadProMK3.shiftHeld) {
            engine.setValue(channel, CONTROLS.LOOP_REMOVE, 1);
          } else {
            engine.setValue(channel, CONTROLS.LOOP_ENABLED, 0);
          }
          LaunchpadProMK3.loopActivePadByDeck[deckNum] = null;
        }
        // Turn off any active roll before setting a persistent loop
        if (rollRec && rollRec.control) {
          engine.setValue(channel, rollRec.control, 0);
          LaunchpadProMK3.oneDeckActiveRollByDeck[deckNum] = null;
        }
      }
    } catch (e) { DEBUG("Loop toggle check exception: " + e, C.Y); }
  }
};



  // Split cue system controls
  // Split cue toggle (row1 pad 8)
  // Split cue volume switch (row2 pad 8)
  LaunchpadProMK3.buttons.splitCueToggle = LaunchpadProMK3.row1[7]
  LaunchpadProMK3.buttons.splitCueVolumeSwitch = LaunchpadProMK3.row2[7]
  LaunchpadProMK3.splitCueColourOff = COLORS.RGB.SPLIT_CUE_OFF;
  LaunchpadProMK3.splitCueColourOn = COLORS.RGB.SPLIT_CUE_ON;
  LaunchpadProMK3.splitCueColourOnMod = COLORS.RGB.SPLIT_CUE_ON_MOD;
  LaunchpadProMK3.splitCueColourUnVol = COLORS.RGB.SPLIT_CUE_UN_VOL;
  LaunchpadProMK3.splitCueColourUnVolPrev = COLORS.RGB.SPLIT_CUE_UN_VOL_PREV;

  // Initialize split cue toggle and volume switch
  if (!engine.getValue("[Master]","headSplit")) {
    LaunchpadProMK3.splitCue = 0;
    LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueToggle, LaunchpadProMK3.splitCueColourOff);
    LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueVolumeSwitch, LaunchpadProMK3.splitCueColourUnVolPrev); 
  } else {
    LaunchpadProMK3.splitCue = 1;
    LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueToggle, LaunchpadProMK3.splitCueColourOn);
    LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueVolumeSwitch, LaunchpadProMK3.splitCueColourUnVol);
  }
  // Initialize the enhanced UnVol system - default to off regardless of headSplit state
  LaunchpadProMK3.splitCueUnVol = 0;


  // toggle split cue
  // Handler moved to initMidiHandlers()

  // toggle split cue
  LaunchpadProMK3.toggleSplitCue = function () {
    LaunchpadProMK3.splitCue = engine.getValue("[Master]", CONTROLS.HEAD_SPLIT);
    LOG.debug("toggleSplitCue " + LaunchpadProMK3.splitCue, C.G);
    if (!LaunchpadProMK3.splitCue) {
      engine.setValue("[Master]", CONTROLS.HEAD_SPLIT, 1);
      LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueToggle, LaunchpadProMK3.splitCueColourOn);
      LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueVolumeSwitch, LaunchpadProMK3.splitCueColourUnVol);
    } else {
      engine.setValue("[Master]", CONTROLS.HEAD_SPLIT, 0);
      LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueToggle, LaunchpadProMK3.splitCueColourOff);
      LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueVolumeSwitch, LaunchpadProMK3.splitCueColourUnVolPrev);
    }
  }


  // toggle split cue volume switch
  // Handler moved to initMidiHandlers()
  LaunchpadProMK3.toggleSplitCueUnVol = function () {
    // Enhanced UnVol system that works with headSplit enabled
    if (!LaunchpadProMK3.splitCueUnVol) {
      // Activating UnVol system
      LaunchpadProMK3.splitCueUnVol = 1;
      
      // Store current states
      LaunchpadProMK3.splitCueUnVolPrev = engine.getValue("[Master]", CONTROLS.HEAD_MIX);
      LaunchpadProMK3.splitCueUnVolPrevSplit = engine.getValue("[Master]", CONTROLS.HEAD_SPLIT);
      
      // If headSplit was enabled, temporarily turn it off
      if (LaunchpadProMK3.splitCueUnVolPrevSplit) {
        engine.setValue("[Master]", CONTROLS.HEAD_SPLIT, 0);
        LaunchpadProMK3.splitCue = 0; // Update local state
        // Set button colors for headSplit enabled case
        LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueToggle, LaunchpadProMK3.splitCueColourOff); // Deep blue
        LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueVolumeSwitch, LaunchpadProMK3.splitCueColourUnVol); // Orange
      } else {
        // Original behavior for headSplit disabled case
        engine.setValue("[Master]", CONTROLS.HEAD_SPLIT, 1);
        LaunchpadProMK3.splitCue = 1; // Update local state
        LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueToggle, LaunchpadProMK3.splitCueColourOnMod); // Normal split cue color
        LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueVolumeSwitch, LaunchpadProMK3.splitCueColourUnVol); // Orange
      }
      
      // Set headMix to full cue
      engine.setValue("[Master]", CONTROLS.HEAD_MIX, 1);
      
    } else {
      // Deactivating UnVol system
      LaunchpadProMK3.splitCueUnVol = 0;
      
      // Restore original states
      engine.setValue("[Master]", CONTROLS.HEAD_SPLIT, LaunchpadProMK3.splitCueUnVolPrevSplit);
      engine.setValue("[Master]", CONTROLS.HEAD_MIX, LaunchpadProMK3.splitCueUnVolPrev);
      LaunchpadProMK3.splitCue = LaunchpadProMK3.splitCueUnVolPrevSplit; // Update local state
      
      // Restore normal button colors
      if (LaunchpadProMK3.splitCueUnVolPrevSplit) {
        // headSplit was originally enabled
        LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueToggle, LaunchpadProMK3.splitCueColourOn); // Normal split cue enabled
        LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueVolumeSwitch, LaunchpadProMK3.splitCueColourUnVolPrev); // Default off
      } else {
        // headSplit was originally disabled
        LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueToggle, LaunchpadProMK3.splitCueColourOff); // Normal split cue disabled
        LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueVolumeSwitch, LaunchpadProMK3.splitCueColourUnVolPrev); // Default off
      }
    }
    
    LOG.debug("toggleSplitCueUnVol " + LaunchpadProMK3.splitCueUnVol + " (headSplit originally: " + LaunchpadProMK3.splitCueUnVolPrevSplit + ")", C.G);
  }
}

/**
 * bind all MIDI input handlers for control buttons
 * MARK: initMidiHandlers()
 * sets up shift, alt, brightness, page buttons, and special functions
 * @returns {void}
 */
LaunchpadProMK3.initMidiHandlers = function () {
  // shift modifier button (row1[4])
  midi.makeInputHandler(MIDI.CONTROL_CHANGE, LaunchpadProMK3.buttons.shift, (channel, control, value, status) => {
    if (value !== 0) {
      LaunchpadProMK3.shiftHeld = true;
      // brighter sea green on press
      LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.shift, ...COLORS.RGB.SHIFT_ON);
      LOG.debug("# shift on", C.G);
      // refresh row0 colors on animation pages
      if (LaunchpadProMK3.currentPage === 8 || LaunchpadProMK3.currentPage === 9) {
        LaunchpadProMK3.paintAnimationRow0(true);
      }
    } else if (value === 0) {
      LaunchpadProMK3.shiftHeld = false;
      // sea green on release
      LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.shift, ...COLORS.RGB.SHIFT_OFF);
      LOG.debug("# shift off", C.G);
      // refresh row0 colors on animation pages
      if (LaunchpadProMK3.currentPage === 8 || LaunchpadProMK3.currentPage === 9) {
        LaunchpadProMK3.paintAnimationRow0(false);
      }
    }
  });

  // Initial LED for shift (released state) — sea green
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.shift, ...COLORS.RGB.SHIFT_OFF);

  // Alt modifier button (row1 pad 5)
  midi.makeInputHandler(MIDI.CONTROL_CHANGE, LaunchpadProMK3.buttons.alt, (channel, control, value, status) => {
    if (value !== 0) {
      LaunchpadProMK3.altHeld = true;
      // Turn button darker when pressed
      LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.alt, ...COLORS.RGB.ALT_ON);
      LOG.debug("# alt on", C.G);
    } else if (value === 0) {
      LaunchpadProMK3.altHeld = false;
      // Restore normal brightness when released
      LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.alt, ...COLORS.RGB.ALT_OFF);
      LOG.debug("# alt off", C.G);
    }
  });

  // Initial LED for alt (released state)
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.alt, ...COLORS.RGB.ALT_OFF);

  // Brightness controls and hotcue bank cycling
  midi.makeInputHandler(MIDI.CONTROL_CHANGE, LaunchpadProMK3.buttons.brightnessControlDown, (channel, control, value, status) => {
    if (value !== 0) {
      if (LaunchpadProMK3.shiftHeld) {
        LaunchpadProMK3.cycleHotcueBankAllDecks();
        LOG.debug("Shift + row0[0]: cycled hotcue banks for all decks", C.G);
      } else {
        LaunchpadProMK3.decreaseDimBrightness();
        LOG.debug("row0[0]: decreased brightness", C.Y);
      }
    }
  });
  midi.makeInputHandler(MIDI.CONTROL_CHANGE, LaunchpadProMK3.buttons.brightnessControlUp, (channel, control, value, status) => {
    if (value !== 0) {
      if (LaunchpadProMK3.shiftHeld) {
        LaunchpadProMK3.cycleHotcueBankAllDecks();
        LOG.debug("Shift + row0[1]: cycled hotcue banks for all decks", C.G);
      } else {
        LaunchpadProMK3.increaseDimBrightness();
        LOG.debug("row0[1]: increased brightness", C.Y);
      }
    }
  });

  // Initial LEDs for brightness controls (use green/jade scheme)
  LaunchpadProMK3.updateHotcueBankLights();

  // Row1 deck buttons (hotcue helper / page 1 deck select)
  // consolidated using factory pattern - maps button to order and deck
  const deckButtonMap = [
    { button: 1, order: 1, deck: 3 },  // row1 pad 1 -> physical order 1 -> deck 3 (magenta)
    { button: 2, order: 2, deck: 1 },  // row1 pad 2 -> physical order 2 -> deck 1 (blue)
    { button: 3, order: 3, deck: 2 },  // row1 pad 3 -> physical order 3 -> deck 2 (yellow)
    { button: 4, order: 4, deck: 4 }   // row1 pad 4 -> physical order 4 -> deck 4 (green)
  ];
  deckButtonMap.forEach(({button, order, deck}) => {
    midi.makeInputHandler(
      MIDI.CONTROL_CHANGE,
      LaunchpadProMK3.buttons[`deckButton${button}`],
      LaunchpadProMK3.createDeckButtonHandler(button, order, deck)
    );
  });

  // Initial LEDs for row1 deck buttons with their deck colors
  const d1 = parseInt(LaunchpadProMK3.getDeckFromOrder(1), 10);
  const d2 = parseInt(LaunchpadProMK3.getDeckFromOrder(2), 10);
  const d3 = parseInt(LaunchpadProMK3.getDeckFromOrder(3), 10);
  const d4 = parseInt(LaunchpadProMK3.getDeckFromOrder(4), 10);
  const setBtn = (btn, deck) => {
    if (!isNaN(deck) && LaunchpadProMK3.decks[deck]) {
      const rgb = LaunchpadProMK3.hexToRGB(LaunchpadProMK3.decks[deck].deckColour || 0xFFFFFF);
      try { LaunchpadProMK3.sendRGB(btn, rgb); } catch (e) { DEBUG("sendRGB deck button exception: " + e, C.R); }
    }
  };
  setBtn(LaunchpadProMK3.buttons.deckButton1, d1);
  setBtn(LaunchpadProMK3.buttons.deckButton2, d2);
  setBtn(LaunchpadProMK3.buttons.deckButton3, d3);
  setBtn(LaunchpadProMK3.buttons.deckButton4, d4);

  // Undo/Redo hotcue handlers
  midi.makeInputHandler(MIDI.CONTROL_CHANGE, LaunchpadProMK3.buttons.undoLastHotcue, (channel, control, value, status) => {
    if (value !== 0) {
      LaunchpadProMK3.undoLastHotcue();
    }
  });
  // Initial LED for undo
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.undoLastHotcue, ...COLORS.RGB.UNDO);
  midi.makeInputHandler(MIDI.CONTROL_CHANGE, LaunchpadProMK3.buttons.redoLastHotcue, (channel, control, value, status) => {
    if (value !== 0) {
      LaunchpadProMK3.redoLastHotcue();
    }
  });
  // Initial LED for redo
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.redoLastHotcue, ...COLORS.RGB.REDO);

  // Keep playing mode toggle
  midi.makeInputHandler(MIDI.CONTROL_CHANGE, LaunchpadProMK3.buttons.keepPlayingMode, (channel, control, value, status) => {
    if (value !== 0) {
      if (LaunchpadProMK3.keepPlayingMode) {
        LaunchpadProMK3.resetKeepPlayingMode();
        LOG.debug("Keep playing mode deactivated by row2[6]", C.Y);
      } else {
        LaunchpadProMK3.keepPlayingMode = true;
        LOG.debug("Keep playing mode activated by row2[6]", C.Y);
        LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.keepPlayingMode, ...COLORS.RGB.KEEP_PLAYING_ON); // Blue-purple
      }
    }
  });

  // Initial LED for keep playing mode (off = bright yellow)
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.keepPlayingMode, ...COLORS.RGB.KEEP_PLAYING_OFF);

  // Slip toggle (global)
  midi.makeInputHandler(MIDI.CONTROL_CHANGE, LaunchpadProMK3.buttons.slipToggle, (channel, control, value, status) => {
    if (value !== 0) {
      // Shift + Slip: clear loops/rolls on all decks (do not toggle slip state)
      if (LaunchpadProMK3.shiftHeld) {
        LaunchpadProMK3.clearAllLoopsAndRolls();
        return;
      }
      // Normal press: toggle slip mode globally
      LaunchpadProMK3.setSlipEnabled(!LaunchpadProMK3.slipEnabled);
      LOG.debug("Slip " + (LaunchpadProMK3.slipEnabled ? "enabled" : "disabled") + " by row2[4]", C.C);
    }
  });

  // Page selection buttons (row2 pads 1-4)
  for (let i = 0; i < LaunchpadProMK3.pageButtonConfig.length; i += 1) {
    midi.makeInputHandler(MIDI.CONTROL_CHANGE, LaunchpadProMK3.row2[i], ((idx) => (channel, control, value, status, _group) => {
      if (value !== 0) { LaunchpadProMK3.handlePageButtonPress(idx); }
    })(i));
  }

  // rebind slip toggle to its new button (row1[6]) and color
  LaunchpadProMK3.updateSlipStateFromEngine();

  // Hotcue color switching controls
  midi.makeInputHandler(MIDI.CONTROL_CHANGE, LaunchpadProMK3.buttons.hotcueColorSwitchPrev, (channel, control, value, status, group) => {
    if (value !== 0) {
      let targetChannel = LaunchpadProMK3.lastHotcueChannel;
      if (typeof targetChannel === "undefined" || !targetChannel) {
        targetChannel = "[Channel1]";
      }
      script.toggleControl(targetChannel, "hotcue_focus_color_prev");
      LOG.debug("hotcue_focus_color_prev on " + targetChannel, C.G);
    }
  });
  midi.makeInputHandler(MIDI.CONTROL_CHANGE, LaunchpadProMK3.buttons.hotcueColorSwitchNext, (channel, control, value, status, group) => {
    if (value !== 0) {
      let targetChannel = LaunchpadProMK3.lastHotcueChannel;
      if (typeof targetChannel === "undefined" || !targetChannel) {
        targetChannel = "[Channel1]";
      }
      script.toggleControl(targetChannel, "hotcue_focus_color_next");
      LOG.debug("hotcue_focus_color_next on " + targetChannel, C.G);
    }
  });

  // Initial LEDs for hotcue color switching
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.hotcueColorSwitchPrev, ...COLORS.RGB.HOTCUE_PREV); // prev = red
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.hotcueColorSwitchNext, ...COLORS.RGB.HOTCUE_NEXT); // next = green
  // Toggle all effects (row0 pad 8)
  midi.makeInputHandler(MIDI.CONTROL_CHANGE, LaunchpadProMK3.buttons.allEffectsEnabled, (channel, control, value, status, group) => {
    if (value === MIDI.VELOCITY_MAX) {  // Button pressed
      LOG.debug("Row0 pad 8 held down - clear all hotcues mode active", C.O);

      LaunchpadProMK3.allEffectsEnabled = !LaunchpadProMK3.allEffectsEnabled;

      const numUnits = 4; // Use default 4 EffectUnits
      for (let i = 1; i <= numUnits; i++) {
        const unitGroup = `[EffectRack1_EffectUnit${i}]`;
        engine.setValue(unitGroup, 'enabled', LaunchpadProMK3.allEffectsEnabled ? 1 : 0);

        const numSlots = engine.getValue(unitGroup, 'num_effectslots') || 3;
        for (let s = 1; s <= numSlots; s++) {
          const slotGroup = `[EffectRack1_EffectUnit${i}_Effect${s}]`;
          engine.setValue(slotGroup, 'enabled', LaunchpadProMK3.allEffectsEnabled ? 1 : 0);
        }
      }

      if (LaunchpadProMK3.allEffectsEnabled) {
        LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.allEffectsEnabled, ...COLORS.RGB.EFFECTS_ON);
      } else {
        LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.allEffectsEnabled, ...COLORS.RGB.EFFECTS_OFF);
      }

      LOG.debug("All effects " + (LaunchpadProMK3.allEffectsEnabled ? "enabled" : "disabled"), C.G);
    } else if (value === 0) {  // Button released
      LOG.debug("Row0 pad 8 released - clear all hotcues mode deactivated", C.O);
    }
  });

  // Initial LED for effects toggle based on current state
  if (LaunchpadProMK3.allEffectsEnabled) {
    LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.allEffectsEnabled, ...COLORS.RGB.EFFECTS_ON);
  } else {
    LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.allEffectsEnabled, ...COLORS.RGB.EFFECTS_OFF);
  }

  // Split cue controls
  midi.makeInputHandler(MIDI.CONTROL_CHANGE, LaunchpadProMK3.buttons.splitCueToggle, (channel, control, value, status, _group) => {
    if (value !== 0) {
      if (!LaunchpadProMK3.splitCueUnVol) {
        LaunchpadProMK3.toggleSplitCue();
      } else {
        LaunchpadProMK3.splitCueUnVol = 0;
        engine.setValue("[Master]", "headSplit", LaunchpadProMK3.splitCueUnVolPrevSplit);
        LaunchpadProMK3.splitCue = LaunchpadProMK3.splitCueUnVolPrevSplit; // Update local state
        LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueVolumeSwitch, LaunchpadProMK3.splitCueColourUnVolPrev); // Button 6 default
        if (LaunchpadProMK3.splitCueUnVolPrevSplit) {
          LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueToggle, LaunchpadProMK3.splitCueColourOnMod); // Button 7 split enabled
        } else {
          LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.splitCueToggle, LaunchpadProMK3.splitCueColourOff); // Button 7 split disabled
        }
        LOG.debug("UnVol system deactivated via button 7 - cue turned off", C.Y);
      }
    }
  });
  midi.makeInputHandler(MIDI.CONTROL_CHANGE, LaunchpadProMK3.buttons.splitCueVolumeSwitch, (channel, control, value, status, _group) => {
    if (value !== 0) { 
      LaunchpadProMK3.toggleSplitCueUnVol();
    }
  });
  
  // momentary reverse roll pad (press = engage; release = disengage)
  // bright scarlet when idle, darker scarlet while held
  (function() {
    const brightScarlet = [0xFF, 0x28, 0x10];
    const darkScarlet   = [0x40, 0x06, 0x04];
    const pad = LaunchpadProMK3.buttons.reverseRollMomentary;
    midi.makeInputHandler(MIDI.CONTROL_CHANGE, pad, (channel, control, value, status, _group) => {
      // always act on the currently selected deck (default to Deck 1)
      const selectedDeck = LaunchpadProMK3.oneDeckCurrent || 1;
      const targetChannel = `[Channel${selectedDeck}]`;
      if (value !== 0) {
        engine.setValue(targetChannel, "reverseroll", 1);
        LaunchpadProMK3.sendRGB(pad, darkScarlet);
      } else {
        engine.setValue(targetChannel, "reverseroll", 0);
        LaunchpadProMK3.sendRGB(pad, brightScarlet);
      }
    });
    // initial LED (idle)
    LaunchpadProMK3.sendRGB(pad, brightScarlet);
  })();
  
};

/**
 * toggle reverse roll mode for selected deck
 * @returns {void}
 */
LaunchpadProMK3.toggleReverseRoll = function() {
  // pick deck like above; default to Deck 1
  const selectedDeck = LaunchpadProMK3.oneDeckCurrent || 1;
  const targetChannel = `[Channel${selectedDeck}]`;
  if (LaunchpadProMK3.reverseRollEnabled) {
    LaunchpadProMK3.reverseRollEnabled = false;
    engine.setValue(targetChannel, "reverseroll", 0);
    LOG.debug("Reverse roll disabled", C.Y);
  } else {
    LaunchpadProMK3.reverseRollEnabled = true;
    engine.setValue(targetChannel, "reverseroll", 1);
    LOG.debug("Reverse roll enabled", C.Y);
  }
};

/**
 * Deck constructor - creates an individual deck object
 * each deck manages its own hotcues, sidepads, and visual feedback
 * @param {number} deckNum - deck number (1-4)
 * @constructor
 */
LaunchpadProMK3.Deck = function (deckNum) {
  //D(LaunchpadProMK3.DEBUGstate, C.M, this.deckColour, this.pads, test)
  LOG.debug("", 2, 0, null, C.RE)
  LOG.debug("  o8o               o8o      .             .o8                      oooo       ", C.M);
  LOG.debug("  `''               `''    .o8            '888                      `888       ", C.M);
  LOG.debug(" oooo  ooo. .oo.   oooo  .o888oo      .oooo888   .ooooo.   .ooooo.   888  oooo ", C.M);
  LOG.debug(" 888  `888P'Y88b  `888    888        d88' `888  d88' `88b d88' `'Y8  888 .8P'  ", C.M);
  LOG.debug(" 888   888   888   888    888        888   888  888ooo888 888        888888.   ", C.M);
  LOG.debug(" 888   888   888   888    888 .      888   888  888    .o 888   .o8  888 `88b. ", C.M);
  LOG.debug(" o888o o888o o888o o888o   '888'     `Y8bod88P' `Y8bod8P' `Y8bod8P' o888o o888o " + deckNum, 0, 2, null, C.M);
  // DEBUG("### constructing " + C.M + "deck " + deckNum, C.G);
  // connect deck object to Components system
  components.Deck.call(this, deckNum);

  // give deck object the configured deck colour
  this.deckColour = LaunchpadProMK3.deck.config[deckNum].colour;
  LOG.debug("Deck(" + C.O + deckNum + C.G + ") ### object instantiation    this.currentDeck " + C.O + this.currentDeck + C.RE + "   deckColour " + C.O + "#" + this.deckColour.toString(16).padStart(6, "0").toUpperCase() + C.RE + " (" + C.O + LaunchpadProMK3.hexToRGB(this.deckColour) + C.RE + ")", C.G);
  // save this.deckColour in RGB arrray format to use later
  this.deckRgb = LaunchpadProMK3.hexToRGB(this.deckColour);
  // give object its physical order
  this.deckOrderIndex = LaunchpadProMK3.deck.config[deckNum].order;
  LOG.debug("Deck(" + C.O + deckNum + C.RE + ") this.deckOrderIndex " + C.O + this.deckOrderIndex + C.RE + " (via LaunchpadProMK3.deck.config[deckNum].order)")
  // what pad is the first of the set the deck will manage?
  this.deckMainSliceStartIndex = (this.deckOrderIndex - 1) * LaunchpadProMK3.totalDeckHotcuePadsShown;
  LOG.debug("Deck(" + C.O + deckNum + C.RE + ") this.deckMainSliceStartIndex " + C.O + this.deckMainSliceStartIndex)
  // what is the set of main grid pads this deck will manage?
  this.pads = LaunchpadProMK3.mainpadAddresses.slice(this.deckMainSliceStartIndex, this.deckMainSliceStartIndex + LaunchpadProMK3.totalDeckHotcuePadsShown);
  LOG.debug("Deck(" + C.O + deckNum + C.RE + ") this.pads " + C.O + this.pads + C.RE + " (" + this.deckMainSliceStartIndex + "-" + (this.deckMainSliceStartIndex + 16) + ")")
  // save just first and last pad number for quick reference later
  this.padsFirst = this.pads[0];
  this.padsLast = this.pads[this.pads.length - 1];

  // what is the first sidepad of the set for this deck?
  this.deckSideSliceStartIndex = (LaunchpadProMK3.deck.config[deckNum].order - 1) * 4;
  LOG.debug("Deck(" + C.O + deckNum + C.RE + ") this.deckSideSliceStartIndex " + C.O + (this.deckSideSliceStartIndex - 1))
  // what is the full set of four sidepads for this deck?
  this.deckSidepadAddresses = LaunchpadProMK3.sidepads.slice(this.deckSideSliceStartIndex, this.deckSideSliceStartIndex + 4);
  LOG.debug("Deck(" + C.O + deckNum + C.RE + ") this.deckSidepadAddresses " + C.O + LaunchpadProMK3.sidepads.slice(this.deckSideSliceStartIndex, this.deckSideSliceStartIndex + 4))
  

  let deckLoaded = engine.getValue(`${this.currentDeck}`, "track_loaded");
  LOG.debug("Deck(" + C.O + deckNum + C.RE + ") deckLoaded " + C.O + deckLoaded)
  LOG.debug("Deck(" + C.O + deckNum + C.RE + ") deckColour " + C.O + "#" + this.deckColour.toString(16).toUpperCase() + C.RE + " (" + C.O + LaunchpadProMK3.hexToRGB(this.deckColour) + C.RE + ")")
  //// Deck Main Hotcues
  // Initialize hotcue button array for this deck
  // Each deck can have up to 36 hotcues across 3 banks
  this.hotcueButtons = [];
  LOG.debug("Deck(" + C.O + deckNum + C.G + ") ### start hotcue pads init", 1, 0, null, C.G);


  channel = "[Channel" + deckNum + "]";

  // Create hotcue buttons for all 36 hotcues (3 banks)
  // MARK: Deck main pad init
  for (let i = 1; i <= LaunchpadProMK3.totalDeckHotcueButtons; i += 1) {
    color_obj = "";
    this.i = i;
    // Calculate pad address: only 16 physical pads, so map both banks to same pads
    let padGridIndex = (i - 1) % LaunchpadProMK3.totalDeckHotcuePadsShown; // 0-15 for display grid
    let padAddress = this.pads[padGridIndex];
    // give the hotcue a number (1-36)
    let hotcueNum = i;
    this.deckRgb = LaunchpadProMK3.dimForState(LaunchpadProMK3.hexToRGB(this.deckColour), 'unloaded');
    LaunchpadProMK3.sendRGB(padAddress, this.deckRgb[0], this.deckRgb[1], this.deckRgb[2]);

    // Create hotcue button, using ComponentsJS objects
    this.hotcueButtons[i - 1] = new components.HotcueButton({
      // Not using midi: because sysex is where it's at with this controller
      //midi: [0x90, padAddress],
      number: this.i, // This is the hotcue number
      padAddress: padAddress,

      // what happens when pads get pressed
      input: midi.makeInputHandler(MIDI.NOTE_ON, padAddress, (channel, control, value, status) => {
        if (value !== 0) { DEBUG("Deck(" + C.O + deckNum + C.RE + ") (input):   main pad press: " + C.O + padAddress + C.RE + "   loaded? " + C.O + engine.getValue(`${this.currentDeck}`, "track_loaded") + C.RE + "   value: " + C.O + value + C.RE + "   page: " + C.O + LaunchpadProMK3.currentPage + C.RE + ")", C.RE, 1); }
        // check the deck is loaded with a track, that the page is right, that it's a button press not release
        //if (engine.getValue(`${this.currentDeck}`,"track_loaded") !== 1 || value === 0) { return; }


        //MARK: P0 HOTCUES
        // hotcues, intro/outro, multihotcue creation, deck select
        if (LaunchpadProMK3.currentPage === 0) {
          // is shift pressed?
          if (LaunchpadProMK3.shiftHeld === 0) {
            // if shift not pressed: Hotcue Activation
            LOG.debug("Deck(" + C.O + deckNum + C.RE + ") (input): no shift..  value " + C.O + value);
            // is this a note down or note up event?
            if (value !== 0) {
              // Calculate actual hotcue number using helper
              let actualHotcueNum = LaunchpadProMK3.hotcueNumForGridIndex(deckNum, padGridIndex);
              LOG.debug("Deck(" + C.O + deckNum + C.G + ") (input): deckNum" + C.O + deckNum + C.RE + "/" + C.O + this.currentDeck + C.RE + ",  padGridIndex " + C.O + padGridIndex + C.RE + ",  padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   actualHotcueNum " + C.O + actualHotcueNum, C.G, 0, 1);
              
              // Check if keep playing mode is active
              if (LaunchpadProMK3.keepPlayingMode) {
                // Reset keep playing mode and restore yellow color
                LaunchpadProMK3.resetKeepPlayingMode();
                // Start playback if not already playing
                if (engine.getValue(this.currentDeck, "play") !== 1) {
                  engine.setValue(this.currentDeck, "play", 1);
                }
              }
              
              // activate creation trigger
              engine.setValue(this.currentDeck, "hotcue_" + actualHotcueNum + "_activate", 1)
              // set new last hotcue channel
              LaunchpadProMK3.lastHotcueChannel = this.currentDeck;
              // add new entry to undo list
              // DEBUG(LaunchpadProMK3.lastHotcue.slice(-1))
              // construct name of control target
              hotcueName = "hotcue_" + (actualHotcueNum)
              // DEBUG(hotcueName)
              // will this hotcue be the same as the last hotcue?
              // color_object = "";
              if (LaunchpadProMK3.lastHotcue[0] !== this.currentDeck && LaunchpadProMK3.lastHotcue.slice(-1) !== hotcueName) {
                LaunchpadProMK3.lastHotcue.unshift([this.currentDeck, hotcueName, padAddress, deckNum, color_obj]);
              }
              // on note up, deactivate control trigger
            } else if (value === 0) {
              // Only deactivate if keep playing mode is not active
              if (!LaunchpadProMK3.keepPlayingMode) {
                // Calculate actual hotcue number for note release
                let actualHotcueNum = LaunchpadProMK3.hotcueNumForGridIndex(deckNum, padGridIndex);
                engine.setValue(this.currentDeck, "hotcue_" + actualHotcueNum + "_activate", 0)
              }
            }
            LOG.debug("Deck(" + C.O + deckNum + C.RE + ") (input): LaunchpadProMK3.lastHotcue:  " + C.O + LaunchpadProMK3.lastHotcue);

          /// if shift is pressed: Hotcue Deletion
          } else if (LaunchpadProMK3.shiftHeld) {
            if (value !== 0) {
              // Calculate actual hotcue number for clearing
              let actualHotcueNum = LaunchpadProMK3.hotcueNumForGridIndex(deckNum, padGridIndex);
              LOG.debug("Deck(" + C.O + deckNum + C.RE + ") (input): shift, hotcue clear " + C.RE + actualHotcueNum + C.G + " on " + C.RE + this.currentDeck, C.G);
              // helper function to toggle hotcue clear control on then off
              script.triggerControl(this.currentDeck, "hotcue_" + actualHotcueNum + "_clear", 50);
              // has to be full page refresh because a track could be on two decks
              LaunchpadProMK3.updateHotcuePages();
              LOG.debug("Deck(" + C.O + deckNum + C.RE + ") (input): leaving hotcue page btton press..", 0, 1, null, C.R);
            }
          }
          LOG.debug("Deck(" + C.O + deckNum + C.RE + ") (input): end of page 0 input action");
        }; //end of page0, hotcue input handler



        //MARK: P1 ONEDECK
        // one deck
        if (LaunchpadProMK3.currentPage === 1) {
          // Get the selected deck for one deck mode
          const selectedDeck = LaunchpadProMK3.oneDeckCurrent || 1;
          const selectedChannel = `[Channel${selectedDeck}]`;
          LOG.debug("One-deck page: pad press on deck " + deckNum + " (selected deck: " + selectedDeck + ")", C.Y);
          // In one-deck mode, all pads control the selected deck regardless of which deck sent the message
          // Find which grid position this pad represents (0-63)
          const gridPosition = LaunchpadProMK3.mainpadAddresses.indexOf(padAddress);
          LOG.debug("One-deck page: padAddress=" + padAddress + " gridPosition=" + gridPosition + " (row: " + Math.floor(gridPosition/8) + ", col: " + (gridPosition%8) + ")", C.Y);
          if (gridPosition !== -1) {
            LOG.debug("Row type: " + (gridPosition < 32 ? "Loop" : (gridPosition < 48 ? "Beatjump" : "Hotcue")), C.Y);
            // rows 7-8: hotcues
            if (gridPosition >= 48 && gridPosition < 64) {
              const hotcueIndex = gridPosition - 48; // 0..15
              let actualHotcueNum = LaunchpadProMK3.hotcueNumForHotcueIndex(selectedDeck, hotcueIndex);
              const deckBank = LaunchpadProMK3.getDeckBank(selectedDeck);
              if (deckBank === 3 && hotcueIndex >= 4) {
                return;
              }
              if (LaunchpadProMK3.shiftHeld === 0) {
                // press: activate; release: deactivate unless keepPlaying
                if (value !== 0) {
                  if (LaunchpadProMK3.keepPlayingMode && engine.getValue(selectedChannel, "play") !== 1) {
                    engine.setValue(selectedChannel, "play", 1);
                  }
                  engine.setValue(selectedChannel, "hotcue_" + actualHotcueNum + "_activate", 1);
                  LaunchpadProMK3.lastHotcueChannel = selectedChannel;
                  const hotcueName = "hotcue_" + actualHotcueNum;
                  LaunchpadProMK3.lastHotcue.unshift([selectedChannel, hotcueName, padAddress, selectedDeck]);
                  engine.beginTimer(50, function () { LaunchpadProMK3.updateHotcuePages(selectedDeck); }, true);
                } else if (!LaunchpadProMK3.keepPlayingMode) {
                  engine.setValue(selectedChannel, "hotcue_" + actualHotcueNum + "_activate", 0);
                }
              } else if (LaunchpadProMK3.shiftHeld) {
                if (value !== 0) {
                  script.triggerControl(selectedChannel, "hotcue_" + actualHotcueNum + "_clear", 50);image
                  LaunchpadProMK3.updateHotcuePages(selectedDeck);
                }
              }
            }
            // rows 5-6: beatjump
            else if (gridPosition >= 32 && gridPosition < 48) {
              if (value !== 0) {
                const beatjumpIndex = gridPosition - 32; // 0..15
                const beatjumpControl = LaunchpadProMK3.beatjumpControls[beatjumpIndex];
                if (beatjumpControl) {
                  script.triggerControl(selectedChannel, beatjumpControl, 50);
                  LOG.debug("Page 1 BEATJUMP: " + C.O + beatjumpControl + C.RE + " on deck " + C.O + selectedDeck + C.RE, 1, 0, null, C.G);
                }
              }
            }
            // rows 1-4: forward loop controls
              // 
              // LOOP PAD FUNCTIONALITY & MECHANISM:
              // 
              // These 16 pads (2 rows × 8 columns) provide granular loop control for the selected deck:
              // 
              // LAYOUT:
              // - Rows 1-2 (top): Reverse loops (r prefix) - loops backward from current position
              // - Rows 3-4 (bottom): Forward loops - loops forward from current position
              // - Columns: Loop sizes from right to left (small → large)
              //   Rightmost: 1 beat, Leftmost: 128 beats
              // 
              // MAPPING MECHANISM:
              // - padAddress % 10 → column index (0-9)
              // - column index → loopControls array index (7-0, reversed for intuitive right=small)
              // - gridPosition / 8 → row index (0-3) for reverse/forward determination
              // 
              // CONTROL GENERATION:
              // - Uses handleLoopControl() helper for DRY implementation
              // - Control names: {beatloop_|beatlooproll_}{r?}{size}_activate
              // - Examples: beatloop_1_activate, beatlooproll_r8_activate
              // 
              // MODE SWITCHING:
              // - oneDeckLoopUsesRoll flag toggles between beatloop_ and beatlooproll_ controls
              // - beatlooproll provides temporary loops that resume playback when disabled
              // - beatloop creates persistent loops that stay active until manually cleared
              // 
              // VALIDATION:
              // - Only activates when track is loaded (track_loaded === 1)
              // - Safe array bounds checking prevents invalid loop index access
              // - Consistent error handling and debug logging via helper function
              // 
            else {
              // Per-pad press lock to prevent duplicate press handling
              const isPress = (value !== 0);
              const wasPressed = !!LaunchpadProMK3._loopPadPressed[padAddress];
              if (isPress) {
                if (wasPressed) { return; }
                LaunchpadProMK3._loopPadPressed[padAddress] = true;
              } else {
                LaunchpadProMK3._loopPadPressed[padAddress] = false;
              }
              // Targeted debug to verify top rows are handled
              const dbgRow = Math.floor(gridPosition / 8);
              const dbgCol = (gridPosition % 8);
              LOG.debug("Page1 LOOP PAD press: row=" + dbgRow + " col=" + dbgCol + " val=" + value + " loaded? " + engine.getValue(selectedChannel, "track_loaded"), C.Y, 1);
              if (LaunchpadProMK3.oneDeckLoopUsesRoll === undefined) { LaunchpadProMK3.oneDeckLoopUsesRoll = false; }
              // Pass press/release value so beatlooproll can be momentary (hold)
              LaunchpadProMK3.handleLoopControl(selectedChannel, padAddress, gridPosition, "oneDeck", undefined, value);
            }
          }
        }


        //MARK: P2 BEATJUMP
        // beatjump
        if (LaunchpadProMK3.currentPage === 2) {
          if (value !== 0) {
            // what control in the array is activated with this pad?
            let beatjumpControlSel = LaunchpadProMK3.beatjumpControls[hotcueNum - 1];
            script.triggerControl(this.currentDeck, beatjumpControlSel, 50);
            LOG.debug("Deck(" + C.O + deckNum + C.RE + ") (input): BEATJUMP " + C.O + beatjumpControlSel + C.RE + " on deck " + this.currentDeck, 1, 0, null, C.G);
          }
        };



        //MARK: P3 BPMSCALE
        // bpm scaling
        if (LaunchpadProMK3.currentPage === 3) {
          // if a pad is pressed on page 2
          if (value !== 0) {
            LOG.debug("Deck(" + C.O + deckNum + C.RE + ") (input): bpm scaling..  padAddress " + C.O + padAddress + C.RE);
            // check if this deck is loaded
            let columnIndex = (padAddress % 10 - 1);
            LOG.debug("PAD DEBUG: padAddress=" + padAddress + " maps to columnIndex=" + columnIndex, C.Y);

            if (engine.getValue(this.currentDeck, "track_loaded") === 1) {
              // get what control this pad should trigger
              let bpmScaleColumnsControl = LaunchpadProMK3.bpmScaleColumns[columnIndex].control;
              // if the last number is zero
              LOG.debug(parseInt(padAddress / 10));
              if (parseInt(padAddress / 10) % 2 !== 0) {
                // what is the first digit of the pad
                let firstDigit = Math.floor(padAddress / 10);
                // if the first digit is even then pad is stars up, and vice versa
                bpmScaleColumnsControl = (firstDigit % 2 === 0) ? "stars_up" : "stars_down";
              }
              // trigger the control (on then off)
              script.triggerControl(this.currentDeck, bpmScaleColumnsControl, 50);
              LOG.debug("Deck(" + C.O + deckNum + C.G + ") (input): bpmSCALE " + C.O + bpmScaleColumnsControl, 1, 0, null, C.G);
              // refresh all the pads
              LaunchpadProMK3.updateBpmScalePage();
            }
          }
        }; //end page 2, bpm scaling



        //MARK: P4/5 LOOPS (FORWARD/REVERSE)
        // loops
        if (LaunchpadProMK3.currentPage === 4 || LaunchpadProMK3.currentPage === 5) {
          if (value !== 0) {
            LOG.debug("Deck(" + C.O + deckNum + C.G + ") (input): it's loopin time", 1, 0, null, C.G);
            let deck;
            if (Object.values(LaunchpadProMK3.decks[1].pads).includes(padAddress)) { deck = 1 }
            if (Object.values(LaunchpadProMK3.decks[2].pads).includes(padAddress)) { deck = 2 }
            if (Object.values(LaunchpadProMK3.decks[3].pads).includes(padAddress)) { deck = 3 }
            if (Object.values(LaunchpadProMK3.decks[4].pads).includes(padAddress)) { deck = 4 }

            LaunchpadProMK3.handleLoopControl(this.currentDeck, padAddress, undefined, LaunchpadProMK3.currentPage, deck);
          };
        };


        //MARK: P6 LOOP MOVE
        if (LaunchpadProMK3.currentPage === 6) {
          if (value !== 0) {
            // Determine which of the 16 pad positions within this deck slice was pressed
            const padIndexWithinSlice = (LaunchpadProMK3.mainpadAddresses.indexOf(padAddress) - LaunchpadProMK3.decks[deckNum].deckMainSliceStartIndex);
            if (padIndexWithinSlice >= 0 && padIndexWithinSlice < 16) {
              // Map 0..15 to moves: columns 0..7 backward (128..1), 8..15 forward (128..1)
              const column = padIndexWithinSlice % 8; // 0..7
              const isTopHalf = padIndexWithinSlice < 8; // rows within slice but we only care columns
              const beatAmounts = [128, 64, 32, 16, 8, 4, 2, 1];
              const beats = beatAmounts[column];
                const direction = (padIndexWithinSlice < 8) ? "backward" : "forward";
                const control = `loop_move_${beats}_${direction}`;
                script.triggerControl(this.currentDeck, control, 50);
              LOG.debug("LoopMove: " + C.O + control + C.RE + " on " + C.O + this.currentDeck, C.G);
            }
          }
        }

        //MARK: P7 LOOP RESIZE
        if (LaunchpadProMK3.currentPage === 7) {
          if (value !== 0) {
            const padIndexWithinSlice = (LaunchpadProMK3.mainpadAddresses.indexOf(padAddress) - LaunchpadProMK3.decks[deckNum].deckMainSliceStartIndex);
            if (padIndexWithinSlice >= 0 && padIndexWithinSlice < 16) {
              // Use columns as scale amounts; left half halve, right half double, or map explicit sizes
              const column = padIndexWithinSlice % 8; // 0..7
              // Flip orientation: 0..3 double (more on the far left), 4..7 halve (more on the far right)
              if (column < 4) {
                // Double (4 - column) times: col0=4x, col1=3x, col2=2x, col3=1x
                for (let i = 0; i < (4 - column); i += 1) {
                  script.triggerControl(this.currentDeck, "loop_double", 50);
                }
                LOG.debug("LoopResize: loop_double x" + (4 - column) + " on " + C.O + this.currentDeck, C.G);
              } else {
                // Halve (column - 3) times: col4=1x, col5=2x, col6=3x, col7=4x
                for (let i = 0; i < (column - 3); i += 1) {
                  script.triggerControl(this.currentDeck, "loop_halve", 50);
                }
                LOG.debug("LoopResize: loop_halve x" + (column - 3) + " on " + C.O + this.currentDeck, C.G);
              }
            }
          }
        }

      }), //end input handler

      // how the lights of pads managed this way are changed
      sendRGB: function (color_obj) {
        if (LaunchpadProMK3.currentPage === 0) {
          let deckLoaded = engine.getValue(channel, "track_loaded");
          LaunchpadProMK3.sendRGB(this.padAddress, color_obj.red >> 1, color_obj.green >> 1, color_obj.blue >> 1);
        }
      } //end sendrgb method
    }) //end hotcue component

    //shutdown: undefined

    // bind action to a change of hotcue status
    engine.makeConnection(channel, "hotcue_" + hotcueNum + "_status", (value) => {
      //if (value === 0) { return }
      if (LaunchpadProMK3.currentPage === 0 && value !== 0) {
        // Only update the pad if this hotcue is in the currently active bank for this deck
          let deckBank = LaunchpadProMK3.getDeckBank(deckNum);
          let currentBankStart = (deckBank - 1) * LaunchpadProMK3.totalDeckHotcuePadsShown + 1;
          let currentBankEnd = deckBank * LaunchpadProMK3.totalDeckHotcuePadsShown;
        
        if (hotcueNum >= currentBankStart && hotcueNum <= currentBankEnd) {
          let deckColour = this.deckColour // Get the deck color
          let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
          // let deckDimUnloaded = LaunchpadProMK3.dimForState(deckRgb, 'unloaded');
          let deckDimUnloaded = LaunchpadProMK3.dimForState(deckRgb, 'inactive');

          LaunchpadProMK3.sendRGB(padAddress, deckDimUnloaded);
          LOG.debug(">> makeConnection " + C.C + "hotcue_X_status" + C.RE + "   hotcueNum " + C.O + hotcueNum + C.RE + "   deckColour hex " + C.O + "#" + deckColour.toString(16) + C.RE + "   deckRgb " + C.O + deckRgb + C.RE + "   deckDimUnloaded " + C.O + deckDimUnloaded, 1, 0, null, C.G);
        }
      }
      // If one-deck (page 1) is active and this deck is selected, update the selected-deck hotcues
      if (LaunchpadProMK3.currentPage === 1) {
        const selectedDeck = LaunchpadProMK3.oneDeckCurrent || 1;
        if (deckNum === selectedDeck) {
          let currentBankStart = (LaunchpadProMK3.hotcueBankActive - 1) * 16 + 1;
          let currentBankEnd = LaunchpadProMK3.hotcueBankActive * 16;
          if (hotcueNum >= currentBankStart && hotcueNum <= currentBankEnd) {
            LaunchpadProMK3.setupSelectedDeckHotcues(selectedDeck);
          }
        }
      }
      if (value === 0) {

      }
    }); //end of makeConnection
  };
  LOG.debug("Deck(" + C.O + deckNum + C.R + ") ### ending mainpads init", 0, 1, null, C.R);
  ////MARK: DECK SIDE PAD INIT
  // Initialize intro/outro marker sidepads for this deck
  LOG.debug("Deck(" + C.O + deckNum + C.G + ") ### intro/outro sidepads init", C.G);
  this.sideButtons = [];
  LOG.debug("Deck(" + C.O + deckNum + C.RE + ") this.deckSidepadAddresses " + C.O + this.deckSidepadAddresses)
  for (let sidepad = 1; sidepad <= 4; sidepad += 1) {
    //let padAddress = this.deckSidepadAddresses[sidepad-1]
    const padAddress = this.deckSidepadAddresses[sidepad - 1];
    // Remove incorrect array bounds access - this was causing crashes
    // if (LaunchpadProMK3.selectPage === 6) { padAddress = LaunchpadProMK3.sidepads[12 + sidepad] - 20 };
    // the sidepad control this loop will setup
    const sidepadControlName = LaunchpadProMK3.sidepadNames[sidepad - 1];
    // Each sidepad controls: intro_start, intro_end, outro_start, outro_end

    LOG.debug("Deck(" + deckNum + ")" + C.RE + " side pad " + C.O + sidepad + C.RE + "   padAddress " + C.O + padAddress + C.RE + " (" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + ")", C.O)
    if (deckLoaded !== 1) { this.deckRgb = LaunchpadProMK3.dimForState(LaunchpadProMK3.hexToRGB(this.deckColour), 'unloaded'); }
    if (deckLoaded === 1) { this.deckRgb = LaunchpadProMK3.dimForState(LaunchpadProMK3.hexToRGB(this.deckColour), 'active'); }
    LaunchpadProMK3.sendRGB(padAddress, this.deckRgb[0], this.deckRgb[1], this.deckRgb[2]);

    // Create hotcue button, using ComponentsJS objects
    this.sideButtons[sidepad - 1] = new components.Button({
      midi: [0xB0, padAddress],
      padAddress: this.padAddress, // Get ready
      // sendRGB: LaunchpadProMK3.sendRGB(this.sidepadAddress, 0x00, 0x00, 0xFF),

      // what to do when a sidepad is pressed
      input: midi.makeInputHandler(0xB0, padAddress, (channel, control, value, status) => {
        if (LaunchpadProMK3.currentPage === 0) {
          if (value !== 0) {
            channel = "[Channel" + deckNum + "]";
            if (LaunchpadProMK3.shiftHeld === 0) {
              LOG.debug("Deck(" + C.O + deckNum + C.G + ") (input): side press: deck " + C.O + deckNum + C.RE + "   channel " + C.O + channel + C.RE + "   padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   sidepadControlName: " + C.O + sidepadControlName + C.G + "activate", C.G, 1);
              
              // Check if keep playing mode is active
              if (LaunchpadProMK3.keepPlayingMode) {
                // Reset keep playing mode and restore yellow color
                LaunchpadProMK3.resetKeepPlayingMode();
                // Start playback if not already playing
                if (engine.getValue(channel, "play") !== 1) {
                  engine.setValue(channel, "play", 1);
                }
              }
              
              engine.setValue(channel, `${sidepadControlName}activate`, 1);
              LaunchpadProMK3.lastHotcue.unshift([deckNum, sidepadControlName, padAddress, deckNum]);
            } else {
              LOG.debug("Deck(" + C.O + deckNum + C.G + ") (input): side press: deck " + C.O + deckNum + C.RE + "   channel " + C.O + channel + C.RE + "   padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   sidepadControlName: " + C.O + sidepadControlName + C.G + "clear", C.G, 1);
              engine.setValue(channel, `${sidepadControlName}clear`, 1);
            };
          }
        }; //end page 0
        if (LaunchpadProMK3.currentPage === 2) {
          //if (value !== 0) {
          //}
        }; //end page 2
      }), //end sidepad input handler
    }); //end sidepad button components

    engine.makeConnection(channel, `${sidepadControlName}enabled`, (value) => {
      LOG.debug(">> makeConnection " + C.O + sidepadControlName + C.RE + "activate enabled on deck " + C.O + deckNum + C.RE + " padAddress " + C.O + padAddress, C.G);
      if (LaunchpadProMK3.currentPage === 0) {
        LaunchpadProMK3.trackWithIntroOutro(value, deckNum, padAddress);
      }
    }); //end makeConnection
  }; //end sidepad init loop
  LOG.debug("Deck(" + C.O + deckNum + C.R + "): ### ending sidepads init", 0, 1, null, C.R);



  // on track load, calculate scaled beat positions
  // MARK: MAKECONN TRACK_LOADED
  engine.makeConnection(channel, "track_loaded", function () {
    let value = engine.getValue(channel, "track_loaded")
    LOG.debug(">> makeConnection: " + C.O + "track loaded event on deck " + C.R + deckNum + C.RE + "   value " + C.O + value, 1, 0, null, C.G)
    if (LaunchpadProMK3.currentPage === 0) { LaunchpadProMK3.updateHotcueLights(deckNum); }
    if (LaunchpadProMK3.currentPage === 3) { 
      if (value === 1) {
        LaunchpadProMK3.bpmResetToBpm(deckNum);
      } else {
        LaunchpadProMK3.bpmResetToDeck(deckNum);
      }
    }
    // If one-deck (page 1) is active and this deck is selected, update page 1 visuals
    if (LaunchpadProMK3.currentPage === 1) {
      const selectedDeck = LaunchpadProMK3.oneDeckCurrent || 1;
      if (deckNum === selectedDeck) {
        LOG.debug(">> track_loaded: updating page 1 for selected deck " + C.O + selectedDeck + C.RE + " with new track", C.G);
        LaunchpadProMK3.updateOneDeckPage();
      }
    }
  })


  // MARK: MAKECONN BPM CHANGE
  engine.makeConnection(channel, `bpm`, function () {
    let value = engine.getValue(channel, "bpm")
    LOG.debug(">> makeConnection:" + C.G + " bpm change event on deck " + C.R + deckNum + C.RE + "   value " + C.O + value, 2, 0, null, C.G)
  })




  // on play/stop, stop all bpm timers
  // MARK: MAKECONN PLAY/STOP
  engine.makeConnection(channel, "play", function (value) {
    LOG.debug(">> makeConnection:" + C.O + " play/stop event on deck " + C.R + deckNum + C.RE + "   value " + C.R + value, 2, 0, null, C.G)
    if (LaunchpadProMK3.decks[deckNum].firstTriggerOfPlayConnection !== 0 || LaunchpadProMK3.decks[deckNum].firstTriggerOfPlayConnection === undefined) {
      let now = Date.now()
      if (now - LaunchpadProMK3.decks[deckNum].firstTriggerOfPlayConnection < 500) {
        LOG.debug(">> makeConnection: play/stop, second play connection on deck " + C.R + deckNum + C.O + " within 500ms, ignoring..", C.O, 0, 1)
        return
      }
      LaunchpadProMK3.decks[deckNum].firstTriggerOfPlayConnection = 0
    }
    // Removed blocking busy-wait; non-blocking to avoid 'step is still running'
    LaunchpadProMK3.decks[deckNum].firstTriggerOfPlayConnection = Date.now()
    let scaleColoursRgb = []
    let pads = LaunchpadProMK3.decks[deckNum].pads;
    // is the track being stopped, only handle BPM flash timers on page 2
    if (value === 0 && LaunchpadProMK3.currentPage === 3) {
      LOG.debug(">> play/stop: track is now in a stopped state on deck " + C.R + deckNum + C.RE + ", stopping all BPM timers..", C.R);
      // stop all timers before resetting lights
      // reset lights on this deck to loaded normal scale colours
      // Only reset to BPM colors if track is still loaded
      let trackLoaded = engine.getValue(channel, "track_loaded");
      if (trackLoaded === 1) {
        LaunchpadProMK3.bpmResetToBpm(deckNum)
      } else {
        LaunchpadProMK3.bpmResetToDeck(deckNum)
      }
      // when play stops, we need to force reset the bpm flash steps
      LOG.debug(">> play/stop: track stopped on deck " + C.O + deckNum + C.RE + ", resetting BPM colors", C.R);
    }

    if (value === 1 && LaunchpadProMK3.currentPage === 3) { // track started playing
      // LaunchpadProMK3.bpmResetToDeck(deckNum);
      const now = Date.now();
      // DEBUG(">> play/stop: track now playing on deck " + C.R + deckNum + C.G + ", starting flash animations   now " + C.O + now + C.RE + "   LaunchpadProMK3.lastTriggerOfPlayConnection[deckNum] " + C.O + LaunchpadProMK3.lastTriggerOfPlayConnection[deckNum], C.G, 1);
      if (LaunchpadProMK3.lastTriggerOfPlayConnection[deckNum] === undefined) {
        LaunchpadProMK3.lastTriggerOfPlayConnection[deckNum] = now
      } else if (now - LaunchpadProMK3.lastTriggerOfPlayConnection[deckNum] < 20) {
        return
      }
      // Start flash animations for the pads in this deck
      // let deckRgb = LaunchpadProMK3.decks[deckNum].deckRgb; // UNUSED VARIABLE
      // LaunchpadProMK3.bpmResetToDeck(deckNum);
    }
  })



  // MARK: MAKECONN LOOP_ENABLED
  // keep internal loop trackers and LEDs in sync with external loop changes
  engine.makeConnection(channel, "loop_enabled", function (value) {
    try {
      LOG.debug(">> makeConnection: " + C.O + "loop_enabled" + C.RE + " change on deck " + C.O + deckNum + C.RE + "   value " + C.O + value, 2, 0, null, C.G);
      // when the engine loop gets disabled, clear persistent loop latches; do not touch roll latches here
      if (value === 0) {
        // value === 0: loop disabled externally — clear persistent loop latches
        try {
          LaunchpadProMK3.loopActivePadByDeck[deckNum] = null;
        } catch (e) { DEBUG("loop_enabled handler: clear loopActivePadByDeck exception: " + e, C.Y); }
        try {
          // Clear one-deck latch if this deck is currently selected
          if (LaunchpadProMK3.oneDeckActiveLoopPad && (LaunchpadProMK3.oneDeckCurrent === deckNum)) {
            LaunchpadProMK3.oneDeckActiveLoopPad = null;
          }
        } catch (e) { DEBUG("loop_enabled handler: clear oneDeckActiveLoopPad exception: " + e, C.Y); }
      }
      // Refresh loop LEDs on the active page
      LaunchpadProMK3.requestLoopLEDRefresh(LaunchpadProMK3.currentPage);
    } catch (e) {
      LOG.debug("loop_enabled connection handler exception: " + e, C.R);
    }
  });

  // MARK: MAKECONN LOOP_REMOVE
  // Clear internal latches immediately when a loop is removed externally
  engine.makeConnection(channel, "loop_remove", function (value) {
    try {
      LOG.debug(">> makeConnection: " + C.O + "loop_remove" + C.RE + " change on deck " + C.O + deckNum + C.RE + "   value " + C.O + value, 2, 0, null, C.G);
      if (value !== 0) {
        try {
          LaunchpadProMK3.loopActivePadByDeck[deckNum] = null;
        } catch (e) { DEBUG("loop_remove handler: clear loopActivePadByDeck exception: " + e, C.Y); }
        try {
          if (LaunchpadProMK3.oneDeckCurrent === deckNum) {
            LaunchpadProMK3.oneDeckActiveLoopPad = null;
          }
        } catch (e) { DEBUG("loop_remove handler: clear oneDeckActiveLoopPad exception: " + e, C.Y); }
        LaunchpadProMK3.requestLoopLEDRefresh(LaunchpadProMK3.currentPage);
      }
    } catch (e) {
      LOG.debug("loop_remove connection handler exception: " + e, C.R);
    }
  });

  LOG.debug("Deck(" + C.O + deckNum + C.G + ") ### init reconnect Components properties to group", 1, 0, null, C.G);
  // Set the group properties of the above Components and connect their output callback functions
  // This ensures all hotcue and sidepad components are properly connected to the deck
  this.reconnectComponents(function (c) {
    if (c.group === undefined) {
      // 'this' inside a function passed to reconnectComponents refers to the ComponentContainer
      // so 'this' refers to the custom Deck object being constructed
      c.group = this.currentDeck;
    }
    LOG.debug("reconnectComponents(" + C.O + deckNum + C.O + ")" + C.RE + " (current group if group undefined)   " + C.O + c.group, C.O);
  })
  LOG.debug("Deck(" + C.O + deckNum + C.R + ") ### end reconnect Components properties to group", 0, 1, null, C.R);
};

LaunchpadProMK3.Deck.prototype = new components.Deck();

//// End of Deck object setup


//// Animation System for Page 8
LaunchpadProMK3.animations = {
    currentAnimation: 0,
    currentHue: 0,
    autoHue: false,
    hueSpeed: 1,
    animationFrame: null,
    lastFrameTime: 0,
    frameInterval: 50, // ms per frame (20 FPS)
    
    // Animation presets
    animations: [
        { name: 'Rainbow Wave', func: 'rainbowWave' },
        { name: 'Pulsing Grid', func: 'pulsingGrid' },
        { name: 'Color Spiral', func: 'colorSpiral' },
        { name: 'Scan Lines', func: 'scanLines' }
    ],
    
    // Initialize animation system
    init: function() {
        this.currentAnimation = 0;
        this.currentHue = 0;
        this.autoHue = false;
        this.stopAnimation();
    },
    
    // Start the animation loop
    startAnimation: function() {
        if (this.animationFrame) return;
        this.lastFrameTime = Date.now();
        this.animationLoop();
    },
    
    // Stop the animation loop
    stopAnimation: function() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    },
    
    // Main animation loop
    animationLoop: function() {
        const now = Date.now();
        const delta = now - this.lastFrameTime;
        
        if (delta >= this.frameInterval) {
            this.lastFrameTime = now - (delta % this.frameInterval);
            this.updateAnimation();
        }
        
        this.animationFrame = requestAnimationFrame(this.animationLoop.bind(this));
    },
    
    // Update current animation frame
    updateAnimation: function() {
        if (this.autoHue) {
            this.currentHue = (this.currentHue + this.hueSpeed) % 360;
        }
        
        const animFunc = this[this.animations[this.currentAnimation].func];
        if (typeof animFunc === 'function') {
            animFunc.call(this);
        }
    },
    
    // Cycle to next animation
    nextAnimation: function() {
        this.currentAnimation = (this.currentAnimation + 1) % this.animations.length;
        this.updatePageIndicator();
    },
    
    // Cycle to previous animation
    prevAnimation: function() {
        this.currentAnimation = (this.currentAnimation - 1 + this.animations.length) % this.animations.length;
        this.updatePageIndicator();
    },
    
    // Toggle auto-hue cycling
    toggleAutoHue: function() {
        this.autoHue = !this.autoHue;
        this.updatePageIndicator();
    },
    
    // Update hue manually
    updateHue: function(delta) {
        this.currentHue = (this.currentHue + delta + 360) % 360;
        this.updatePageIndicator();
    },
    
    // Update page indicator lights
    updatePageIndicator: function() {
        // Update row0[2] and row0[3] to show current animation and mode
        const animColor = this.autoHue ? [0, 127, 0] : [0, 0, 127];
        sendRGB(0x02, ...animColor); // Animation selector
        sendRGB(0x03, Math.floor(this.currentHue * 255 / 360), 255, 255); // Color indicator
    },
    
    // Animation: Rainbow wave effect
    rainbowWave: function() {
        const time = Date.now() * 0.001;
        const speed = 0.5;
        
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const dx = x / 7 * 2 - 1;
                const dy = y / 7 * 2 - 1;
                const dist = Math.sqrt(dx * dx + dy * dy) / Math.SQRT2;
                const hue = ((this.currentHue + (x + y) * 15 + time * 50) % 360) / 360;
                const sat = 1.0 - dist * 0.5;
                const val = 0.5 + Math.sin(time * speed + dist * 5) * 0.5;
                
                const rgb = this.hsvToRgb(hue, sat, val);
                sendRGB((y + 1) * 0x10 + x, ...rgb);
            }
        }
    },
    
    // Animation: Pulsing grid
    pulsingGrid: function() {
        const time = Date.now() * 0.001;
        const speed = 0.7;
        
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const dx = (x / 7) * 2 - 1;
                const dy = (y / 7) * 2 - 1;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                const pulse = (Math.sin(time * speed + dist * 4) + 1) * 0.5;
                const hue = (this.currentHue + dist * 30) % 360 / 360;
                const sat = 0.8;
                const val = 0.2 + pulse * 0.8;
                
                const rgb = this.hsvToRgb(hue, sat, val);
                sendRGB((y + 1) * 0x10 + x, ...rgb);
            }
        }
    },
    
    // Animation: Color spiral
    colorSpiral: function() {
        const time = Date.now() * 0.001;
        const centerX = 3.5;
        const centerY = 3.5;
        
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const angle = (Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2);
                const dist = Math.sqrt(dx * dx + dy * dy) / 5.0;
                
                const hue = ((this.currentHue / 360) + angle * 0.5 + time * 0.2) % 1.0;
                const sat = 0.8;
                const val = 0.5 + Math.sin(dist * 4 - time * 2) * 0.5;
                
                const rgb = this.hsvToRgb(hue, sat, val);
                sendRGB((y + 1) * 0x10 + x, ...rgb);
            }
        }
    },
    
    // Animation: Scan lines
    scanLines: function() {
        const time = Date.now() * 0.001;
        const speed = 1.0;
        
        for (let y = 0; y < 8; y++) {
            const linePos = (time * speed + y * 0.2) % 2.0;
            const lineBrightness = Math.max(0, 1.0 - Math.abs(1.0 - linePos));
            
            for (let x = 0; x < 8; x++) {
                const hue = ((this.currentHue + x * 20) % 360) / 360;
                const sat = 0.8;
                const val = 0.2 + lineBrightness * 0.8;
                
                const rgb = this.hsvToRgb(hue, sat, val);
                sendRGB((y + 1) * 0x10 + x, ...rgb);
            }
        }
    },
    
    // Convert HSV to RGB (h: 0-1, s: 0-1, v: 0-1) - uses consolidated function
    hsvToRgb: function(h, s, v) {
        return LaunchpadProMK3.hsvToRgb(h, s, v, 127);
    }
};
// Initialize animations when the script loads
LaunchpadProMK3.animations.init();


/**
 * Beat-driven animation engine for pages 8/9
 * MARK: Beat-driven Animation Engine (pages 8/9)
 * provides visual effects synchronized to beat with user controls
 * @namespace
 */
LaunchpadProMK3.anim = {
  page: 8,
  hueDeg: 0,
  autoHue: false,
  hueStep: 10,
  speedScale: 1.0,     // 0.05x .. 3x
  minSpeed: 0.05,      // slower speeds for more control
  maxSpeed: 3.0,       // reduced to prevent freeze
  subdiv: 12,          // steps per beat
  lastStep: -1,
  variant: 0,
  connections: [],
  flashConnections: [],
  drivingDeck: null,
  
  // auto-cycle system for hands-off parameter changes
  autoCycle: false,
  autoCycleBeatCount: 0,
  autoCycleInterval: 16,  // change every 16 beats (power of 2)
  autoCycleMode: 0,       // 0=variant, 1=style, 2=both

  clamp: function(v, a, b) { return Math.max(a, Math.min(b, v)); },
  // uses consolidated hsvToRgb function with 255 scale
  hsvToRgb255: function(h, s, v) {
    return LaunchpadProMK3.hsvToRgb(h, s, v, 255);
  },
  sendPad: function(y, x, rgb, pulse, flash) {
    const idx = y * 8 + x;
    const pad = LaunchpadProMK3.mainpadAddresses[idx];
    if (!pad) return;
    if (flash) { LaunchpadProMK3.sendRGBFlash(pad, rgb[0], rgb[1], rgb[2]); return; }
    if (pulse) { LaunchpadProMK3.sendRGBPulse(pad, rgb[0], rgb[1], rgb[2]); return; }
    LaunchpadProMK3.sendRGB(pad, rgb[0], rgb[1], rgb[2]);
  },
  clearGrid: function() {
    LaunchpadProMK3.clearMain();
  },
  setPage: function(p) { this.page = p; this.lastStep = -1; },

  // controls on the top grid row (row 1)
  // NOTE: main animation controls moved to row0 with shift modifiers
  // this function is kept for backward compatibility but can be removed
  bindControls: function() {
    const rowTop = (LaunchpadProMK3.mainpadAddresses || []).slice(0,8);
    const mk = (i, fn) => {
      if (!rowTop[i]) return;
      midi.makeInputHandler(MIDI.NOTE_ON, rowTop[i], (channel, control, value) => { 
        if (value !== 0) fn();
      });
    };
    mk(0, () => this.prevStyle());
    mk(1, () => this.updateHue(-this.hueStep));
    mk(2, () => this.updateHue(+this.hueStep));
    mk(3, () => this.toggleAutoHue());
    mk(4, () => this.adjustSpeed(-0.25));
    mk(5, () => this.adjustSpeed(+0.25));
    mk(6, () => this.nextVariant());
    mk(7, () => this.togglePulseMode());
  },

  toggleAutoHue: function() { this.autoHue = !this.autoHue; this.paintControlRow(); },
  updateHue: function(delta) { this.hueDeg = (this.hueDeg + delta + 360) % 360; this.paintControlRow(); },
  adjustSpeed: function(delta) { this.speedScale = this.clamp(this.speedScale + delta, this.minSpeed, this.maxSpeed); this.paintControlRow(); },
  nextVariant: function() { this.variant = (this.variant + 1) % 8; this.paintControlRow(); },
  prevVariant: function() { this.variant = (this.variant + 7) % 8; this.paintControlRow(); },
  pulseMode: false,
  togglePulseMode: function() { this.pulseMode = !this.pulseMode; this.paintControlRow(); },
  
  // toggle auto-cycle mode
  toggleAutoCycle: function() { 
    this.autoCycle = !this.autoCycle; 
    this.autoCycleBeatCount = 0;
    this.paintControlRow(); 
  },
  
  // cycle through auto-cycle intervals (4, 8, 16, 32 beats)
  cycleInterval: function() {
    const intervals = [4, 8, 16, 32];
    const idx = intervals.indexOf(this.autoCycleInterval);
    this.autoCycleInterval = intervals[(idx + 1) % intervals.length];
    this.autoCycleBeatCount = 0;
    this.paintControlRow();
  },
  
  // cycle through auto-cycle modes
  cycleMode: function() {
    this.autoCycleMode = (this.autoCycleMode + 1) % 3;
    this.paintControlRow();
  },
  
  // perform the auto-cycle action
  performAutoCycle: function() {
    if (this.autoCycleMode === 0) {
      // cycle variant only
      this.nextVariant();
    } else if (this.autoCycleMode === 1) {
      // cycle style only
      this.nextStyle();
    } else {
      // cycle both (variant every time, style every 2nd time)
      this.nextVariant();
      if (this.autoCycleBeatCount % 2 === 0) {
        this.nextStyle();
      }
    }
  },

  paintControlRow: function() {
    const rowTop = (LaunchpadProMK3.mainpadAddresses || []).slice(0,8);
    if (rowTop.length < 8) return;
    const on = [0,120,0];
    // pad 3: auto-hue (green=on) + auto-cycle indicator (brighter when auto-cycle active)
    const pad3 = this.autoHue ? (this.autoCycle ? [0,120,80] : [0,120,0]) : [0,20,0];
    // pad 4: speed - + interval indicator (brightness = interval: 4=dim, 32=bright)
    const intervalBrightness = this.autoCycleInterval === 4 ? 40 : this.autoCycleInterval === 8 ? 60 : this.autoCycleInterval === 16 ? 90 : 120;
    const pad4 = this.autoCycle ? [intervalBrightness, intervalBrightness/3, 120] : [20,20,120];
    // pad 6: variant + mode indicator (color varies by mode)
    const modeColors = [[120,120,0], [120,60,0], [120,0,120]];  // yellow=variant, orange=style, magenta=both
    const pad6 = this.autoCycle ? modeColors[this.autoCycleMode] : [120,120,0];
    
    const cells = [
      on,
      LaunchpadProMK3.hueRotateRGB([120, 0, 120], -this.hueStep),
      LaunchpadProMK3.hueRotateRGB([120, 0, 120], +this.hueStep),
      pad3,
      pad4,
      [120,20,20],
      pad6,
      this.pulseMode ? [0,120,120] : [0,30,30],
    ];
    for (let i=0;i<8;i++) {
      const pad = rowTop[i];
      const c = cells[i];
      LaunchpadProMK3.sendRGB(pad, c[0], c[1], c[2]);
    }
  },

  stylesA: [ "rings", "diag", "checker", "lattice" ],
  stylesB: [ "spiral", "rider", "radial", "vortex" ],
  styleIndex: 0,
  currentStyles: function() { return (this.page === 8) ? this.stylesA : this.stylesB; },
  nextStyle: function() { this.styleIndex = (this.styleIndex + 1) % this.currentStyles().length; },
  prevStyle: function() { this.styleIndex = (this.styleIndex + this.currentStyles().length - 1) % this.currentStyles().length; },

  render: function(step) {
    if (this.autoHue) this.hueDeg = (this.hueDeg + this.speedScale) % 360;
    const name = this.currentStyles()[this.styleIndex];
    if (!name) return;
    if      (name === "rings")   this.drawRings(step);
    else if (name === "diag")    this.drawDiag(step);
    else if (name === "checker") this.drawChecker(step);
    else if (name === "lattice") this.drawLattice(step);
    else if (name === "spiral")  this.drawSpiral(step);
    else if (name === "rider")   this.drawRider(step);
    else if (name === "radial")  this.drawRadial(step);
    else if (name === "vortex")  this.drawVortex(step);
  },

  hueBase: function() { return (this.hueDeg % 360) / 360; },

  drawRings: function(step) {
    const cX=3.5, cY=3.5;
    const waves = 1 + (this.variant % 3);
    for (let y=0;y<8;y++) for (let x=0;x<8;x++) {
      const dx = x-cX, dy=y-cY, d = Math.sqrt(dx*dx+dy*dy);
      const phase = (d*waves + step/this.subdiv * this.speedScale) % 1;
      const v = 0.3 + 0.7*Math.max(0, 1-Math.abs(phase*2-1));
      const h = (this.hueBase() + d*0.05) % 1;
      const rgb = this.hsvToRgb255(h, 0.9, v);
      this.sendPad(y,x,rgb, this.pulseMode && (phase<0.1));
    }
  },
  drawDiag: function(step) {
    const skew = (this.variant%4)-1.5;
    for (let y=0;y<8;y++) for (let x=0;x<8;x++) {
      const s = (x + y*skew + step/this.subdiv * this.speedScale);
      const band = Math.floor(s) % 2;
      const h = (this.hueBase() + x*0.04 + y*0.02) % 1;
      const v = band? 0.85 : 0.2;
      const rgb = this.hsvToRgb255(h, 0.9, v);
      this.sendPad(y,x,rgb, false, band && this.pulseMode);
    }
  },
  drawChecker: function(step) {
    const sz = 1 + (this.variant % 3);
    for (let y=0;y<8;y++) for (let x=0;x<8;x++) {
      const cell = ((Math.floor((x+step)% (2*sz)/sz) ^ Math.floor((y+step)% (2*sz)/sz)) & 1);
      const h = (this.hueBase() + (cell? 0.0 : 0.5)) % 1;
      const v = cell? 0.85 : 0.08;
      const rgb = this.hsvToRgb255(h, 0.9, v);
      this.sendPad(y,x,rgb, this.pulseMode && cell);
    }
  },
  drawLattice: function(step) {
    const gap = 2 + (this.variant % 4);
    for (let y=0;y<8;y++) for (let x=0;x<8;x++) {
      const on = (x%gap=== (step%gap)) || (y%gap=== (step%gap));
      const h = (this.hueBase() + (x+y)*0.02) % 1;
      const v = on? 0.85 : 0.05;
      const rgb = this.hsvToRgb255(h, 0.9, v);
      this.sendPad(y,x,rgb, this.pulseMode && on);
    }
  },
  drawSpiral: function(step) {
    const cX=3.5,cY=3.5, rot = (step/this.subdiv)*this.speedScale;
    for (let y=0;y<8;y++) for (let x=0;x<8;x++) {
      const ang = Math.atan2(y-cY, x-cX)/(2*Math.PI);
      const d = Math.hypot(x-cX, y-cY);
      const band = Math.floor((ang + rot + d*0.15)*(4 + (this.variant%3))) % 2;
      const h = (this.hueBase() + ang + d*0.03) % 1;
      const v = band? 0.85 : 0.1;
      const rgb = this.hsvToRgb255(h, 0.9, v);
      this.sendPad(y,x,rgb, this.pulseMode && band);
    }
  },
  drawRider: function(step) {
    const lanes = 2 + (this.variant%3);
    for (let y=0;y<8;y++) for (let x=0;x<8;x++) {
      const lane = y % lanes;
      const pos = (step + lane*2) % 16;
      const on = (x === (pos % 8)) || (x === 7 - (pos % 8));
      const h = (this.hueBase() + lane*0.08) % 1;
      const v = on? 0.9 : 0.05;
      const rgb = this.hsvToRgb255(h, 0.9, v);
      this.sendPad(y,x,rgb, this.pulseMode && on);
    }
  },
  drawRadial: function(step) {
    const cX=3.5,cY=3.5;
    for (let y=0;y<8;y++) for (let x=0;x<8;x++) {
      const d=Math.hypot(x-cX,y-cY);
      const on = Math.floor((d*2 + step/2) % 2)===0;
      const h=(this.hueBase() + d*0.05) % 1;
      const v= on? 0.9: 0.08;
      const rgb = this.hsvToRgb255(h, 0.9, v);
      this.sendPad(y,x,rgb, this.pulseMode && on);
    }
  },
  drawVortex: function(step) {
    const cX=3.5,cY=3.5, twist = 0.2 + (this.variant%4)*0.1;
    for (let y=0;y<8;y++) for (let x=0;x<8;x++) {
      const d=Math.hypot(x-cX,y-cY);
      const a=Math.atan2(y-cY,x-cX)/(2*Math.PI);
      const band = Math.floor((a + d*twist + step/this.subdiv*this.speedScale)*6) % 2;
      const h=(this.hueBase() + a + d*0.02) % 1;
      const v= band? 0.85: 0.1;
      const rgb = this.hsvToRgb255(h, 0.9, v);
      this.sendPad(y,x,rgb, this.pulseMode && band);
    }
  },

  setupBeatConnections: function() {
    this.cleanupBeatConnections();
    this.connections = [];
    this.flashConnections = [];
    for (let deckNum=1; deckNum<=LaunchpadProMK3.totalDecks; deckNum++) {
      const group = "[Channel" + deckNum + "]";
      const c1 = engine.makeConnection(group, "beat_distance", (value, grp) => {
        if (LaunchpadProMK3.currentPage !== 8 && LaunchpadProMK3.currentPage !== 9) return;
        const loaded = engine.getValue(grp, "track_loaded");
        const playing = engine.getValue(grp, "play");
        if (loaded !== 1 || playing !== 1) return;
        this.drivingDeck = deckNum;
        // clamp speedScale to prevent freeze at extreme values
        const clampedSpeed = Math.max(0.05, Math.min(3.0, this.speedScale));
        const subdiv = Math.max(1, Math.floor(this.subdiv * clampedSpeed));
        const quant = Math.floor((value % 1.0) * subdiv);
        if (quant !== this.lastStep) {
          this.lastStep = quant;
          this.render(quant);
        }
      });
      this.connections.push(c1);

      const c2 = engine.makeConnection(group, "beat_active", (active, grp) => {
        if (LaunchpadProMK3.currentPage !== 8 && LaunchpadProMK3.currentPage !== 9) return;
        const loaded = engine.getValue(grp, "track_loaded");
        const playing = engine.getValue(grp, "play");
        if (loaded !== 1 || playing !== 1) return;
        
        // auto-cycle system on downbeat
        if (active === 1 && this.autoCycle) {
          this.autoCycleBeatCount++;
          if (this.autoCycleBeatCount >= this.autoCycleInterval) {
            this.autoCycleBeatCount = 0;
            this.performAutoCycle();
          }
        }
        
        if (!this.pulseMode) return;
        if (active === 1) {
          for (let y=0;y<8;y++) for (let x=0;x<8;x++) {
            this.sendPad(y,x,[10,10,10],true,false);
          }
        }
      });
      this.flashConnections.push(c2);
    }
  },
  cleanupBeatConnections: function() {
    for (const c of (this.connections||[])) { if (c) c.disconnect(); }
    for (const c of (this.flashConnections||[])) { if (c) c.disconnect(); }
    this.connections = [];
    this.flashConnections = [];
  },
};


// MARK: Page 8 - Animations
LaunchpadProMK3.page8Handler = function() {
    // Clear any existing handlers first
    LaunchpadProMK3.clearPageMidiHandlers();
    // Ensure grid is clear
    LaunchpadProMK3.clearMain();
    // Configure beat-driven animation engine for page 8
    if (LaunchpadProMK3.anim && typeof LaunchpadProMK3.anim.setPage === 'function') {
      LaunchpadProMK3.anim.setPage(8);
      LaunchpadProMK3.anim.setupBeatConnections(); 
      LaunchpadProMK3.anim.render(0);
    }
    // Override row0 controls on animation pages
    LaunchpadProMK3.bindAnimationRow0Controls();
    LaunchpadProMK3.lightUpRow2();
};

// MARK: Page 9 - Animations (alt set)
LaunchpadProMK3.page9Handler = function() {
    // Clear any existing handlers first
    LaunchpadProMK3.clearPageMidiHandlers();
    // Start animation on alt set (engine is beat-driven)
    // Reuse the same animation engine, but setPage(9) to switch the style set
    if (LaunchpadProMK3.anim && typeof LaunchpadProMK3.anim.setPage === 'function') {
      LaunchpadProMK3.anim.setPage(9);
      LaunchpadProMK3.anim.setupBeatConnections(); 
      LaunchpadProMK3.anim.render(0);
    }
    // Override row0 controls on animation pages
    LaunchpadProMK3.bindAnimationRow0Controls();
    LaunchpadProMK3.lightUpRow2();
};

// bind row0 controls for animation pages with shift modifier support
// normal: animation controls with specific colors
// shift: auto-cycle controls with different colors
LaunchpadProMK3.bindAnimationRow0Controls = function () {
  if (!LaunchpadProMK3.row0) return;
  const r0 = LaunchpadProMK3.row0;
  
  // helper to refresh row0 colors
  const refreshRow0Colors = () => {
    if (LaunchpadProMK3.currentPage !== 8 && LaunchpadProMK3.currentPage !== 9) return;
    LaunchpadProMK3.paintAnimationRow0(LaunchpadProMK3.shiftHeld);
  };
  
  // brightness down/up: keep existing handlers (row0[0], row0[1])
  
  // row0[2]: hue - / shift: prev variant
  midi.makeInputHandler(0xB0, r0[2], (ch, ctrl, value) => { 
    if (value !== 0 && (LaunchpadProMK3.currentPage===8||LaunchpadProMK3.currentPage===9)) { 
      if (LaunchpadProMK3.shiftHeld) {
        LaunchpadProMK3.anim.prevVariant();
      } else {
        LaunchpadProMK3.anim.updateHue(-10);
      }
      refreshRow0Colors();
    } 
  });
  
  // row0[3]: hue + / shift: next variant
  midi.makeInputHandler(0xB0, r0[3], (ch, ctrl, value) => { 
    if (value !== 0 && (LaunchpadProMK3.currentPage===8||LaunchpadProMK3.currentPage===9)) { 
      if (LaunchpadProMK3.shiftHeld) {
        LaunchpadProMK3.anim.nextVariant();
      } else {
        LaunchpadProMK3.anim.updateHue(+10);
      }
      refreshRow0Colors();
    } 
  });
  
  // row0[4]: speed - / shift: cycle interval
  let _animSpeedHoldTimer = null;
  midi.makeInputHandler(0xB0, r0[4], (ch, ctrl, value) => {
    if (!(LaunchpadProMK3.currentPage===8||LaunchpadProMK3.currentPage===9)) return;
    if (value !== 0) {
      if (LaunchpadProMK3.shiftHeld) {
        // shift: cycle auto-cycle interval
        LaunchpadProMK3.anim.cycleInterval();
        refreshRow0Colors();
      } else {
        // normal: start continuous speed decrease
        LaunchpadProMK3.anim.adjustSpeed(-0.25);
        if (_animSpeedHoldTimer) { 
          try { engine.stopTimer(_animSpeedHoldTimer); } catch (e) {}
          _animSpeedHoldTimer = null; 
        }
        _animSpeedHoldTimer = engine.beginTimer(TIMING.ANIMATION_SPEED_HOLD_STEP, function () { 
          LaunchpadProMK3.anim.adjustSpeed(-0.25); 
        }, false);
        refreshRow0Colors();
      }
    } else {
      // release: stop speed timer
      if (_animSpeedHoldTimer) { 
        try { engine.stopTimer(_animSpeedHoldTimer); } catch (e) {}
        _animSpeedHoldTimer = null; 
      }
      refreshRow0Colors();
    }
  });
  
  // row0[5]: speed + / shift: cycle auto-cycle mode
  midi.makeInputHandler(0xB0, r0[5], (ch, ctrl, value) => {
    if (value !== 0 && (LaunchpadProMK3.currentPage===8||LaunchpadProMK3.currentPage===9)) {
      if (LaunchpadProMK3.shiftHeld) {
        // shift: cycle auto-cycle mode
        LaunchpadProMK3.anim.cycleMode();
      } else {
        // normal: speed increase
        LaunchpadProMK3.anim.adjustSpeed(+0.25);
      }
      refreshRow0Colors();
    }
  });
  
  // row0[6]: auto-hue toggle / shift: toggle auto-cycle
  midi.makeInputHandler(0xB0, r0[6], (ch, ctrl, value) => {
    if (value !== 0 && (LaunchpadProMK3.currentPage===8||LaunchpadProMK3.currentPage===9)) {
      if (LaunchpadProMK3.shiftHeld) {
        LaunchpadProMK3.anim.toggleAutoCycle();
      } else {
        LaunchpadProMK3.anim.toggleAutoHue();
      }
      refreshRow0Colors();
    }
  });
  
  // row0[7]: next style / shift: toggle pulse mode
  midi.makeInputHandler(0xB0, r0[7], (ch, ctrl, value) => {
    if (value !== 0 && (LaunchpadProMK3.currentPage===8||LaunchpadProMK3.currentPage===9)) {
      if (LaunchpadProMK3.shiftHeld) {
        LaunchpadProMK3.anim.togglePulseMode();
      } else {
        LaunchpadProMK3.anim.nextStyle();
      }
      refreshRow0Colors();
    }
  });
  
  // initial paint
  refreshRow0Colors();
  
  // store cleanup function for page exit
  LaunchpadProMK3._animationRow0Cleanup = refreshRow0Colors;
};


// MARK: RESTOREROW0COLORS()
// restore original row0 colors when leaving animation pages
LaunchpadProMK3.restoreRow0Colors = function() {
  if (!LaunchpadProMK3.row0) return;
  const r0 = LaunchpadProMK3.row0;
  
  // r0[0], r0[1] = brightness (handled by brightness system)
  
  // r0[2] = hotcue color prev (red)
  LaunchpadProMK3.sendRGB(r0[2], ...COLORS.RGB.HOTCUE_PREV);
  
  // r0[3] = hotcue color next (green)
  LaunchpadProMK3.sendRGB(r0[3], ...COLORS.RGB.HOTCUE_NEXT);
  
  // r0[4] = deck swatch
  LaunchpadProMK3.updateRow0SelectedDeckSwatch();
  
  // r0[5], r0[6] = loop mode switches
  LaunchpadProMK3.updateRow0LoopModeSwitch();
  
  // r0[7] = effects toggle
  const effectsColor = LaunchpadProMK3.allEffectsEnabled ? 
    COLORS.RGB.EFFECTS_ON : COLORS.RGB.EFFECTS_OFF;
  LaunchpadProMK3.sendRGB(r0[7], ...effectsColor);
};


// MARK: PAINTANIMATIONROW0()
// paint row0 with animation-specific colors
// shiftMode: when true, shows shift function colors
LaunchpadProMK3.paintAnimationRow0 = function(shiftMode) {
  if (!LaunchpadProMK3.row0) return;
  const r0 = LaunchpadProMK3.row0;
  const anim = LaunchpadProMK3.anim;
  
  if (!shiftMode) {
    // normal mode colors
    // r0[0], r0[1] = brightness (handled elsewhere)
    
    // r0[2] = hue - (magenta dim)
    LaunchpadProMK3.sendRGB(r0[2], 80, 0, 80);
    
    // r0[3] = hue + (magenta bright)
    LaunchpadProMK3.sendRGB(r0[3], 120, 0, 120);
    
    // r0[4] = speed - (red, brighter when held)
    LaunchpadProMK3.sendRGB(r0[4], 45, 11, 11);
    
    // r0[5] = speed + (blue)
    LaunchpadProMK3.sendRGB(r0[5], 11, 23, 45);
    
    // r0[6] = auto-hue toggle (green when on, dim when off)
    const autoHueColor = anim.autoHue ? [0, 120, 0] : [0, 20, 0];
    LaunchpadProMK3.sendRGB(r0[6], ...autoHueColor);
    
    // r0[7] = next style (yellow/orange for style cycling)
    LaunchpadProMK3.sendRGB(r0[7], 120, 80, 0);
    
  } else {
    // shift mode colors (auto-cycle controls)
    
    // r0[2] = prev variant (dim yellow)
    LaunchpadProMK3.sendRGB(r0[2], 80, 80, 0);
    
    // r0[3] = next variant (bright yellow)
    LaunchpadProMK3.sendRGB(r0[3], 120, 120, 0);
    
    // r0[4] = cycle interval (color shows current interval)
    const intervalBrightness = anim.autoCycleInterval === 4 ? 40 : 
                               anim.autoCycleInterval === 8 ? 60 : 
                               anim.autoCycleInterval === 16 ? 90 : 120;
    const intervalColor = anim.autoCycle ? 
      [intervalBrightness, intervalBrightness/3, 120] : [30, 10, 60];
    LaunchpadProMK3.sendRGB(r0[4], ...intervalColor);
    
    // r0[5] = cycle mode (color shows mode: yellow=variant, orange=style, magenta=both)
    const modeColors = [[120, 120, 0], [120, 60, 0], [120, 0, 120]];
    const modeColor = anim.autoCycle ? modeColors[anim.autoCycleMode] : [60, 60, 0];
    LaunchpadProMK3.sendRGB(r0[5], ...modeColor);
    
    // r0[6] = toggle auto-cycle (cyan when active, dim blue when off)
    const autoCycleColor = anim.autoCycle ? [0, 120, 120] : [0, 30, 30];
    LaunchpadProMK3.sendRGB(r0[6], ...autoCycleColor);
    
    // r0[7] = toggle pulse mode (cyan when on, dim when off)
    const pulseColor = anim.pulseMode ? [0, 120, 120] : [0, 30, 30];
    LaunchpadProMK3.sendRGB(r0[7], ...pulseColor);
  }
};

/**
 * clear all MIDI input handlers for pads when switching pages
 * MARK: clearPageMidiHandlers()
 * prevents conflicts between different page handlers
 * @returns {void}
 */
LaunchpadProMK3.clearPageMidiHandlers = function () {
  LOG.debug("clearPageMidiHandlers: Clearing all pad MIDI handlers", C.G);
  
  // Instead of removing handlers (which isn't supported), we overwrite them with empty functions
  // This effectively disables the previous handlers when switching pages
  const emptyHandler = function () { /* no-op */ };
  
  // Clear handlers for all deck pads - both Note On (0x90) and Control Change (0xB0) messages
  for (let deck = 1; deck <= LaunchpadProMK3.totalDecks; deck += 1) {
    // Graceful degradation: if deck doesn't exist, skip it
    const deckObj = LaunchpadProMK3.decks[deck];
    if (!deckObj) {
      continue;
    }
    
    // Graceful degradation: if pads array doesn't exist, skip this deck
    const pads = deckObj.pads || [];
    
    for (let i = 0; i < pads.length; i++) {
      // Graceful degradation: skip invalid pad addresses
      const padAddress = pads[i];
      if (!padAddress) {
        continue;
      }
      
      // Overwrite with empty handlers for both message types
      midi.makeInputHandler(MIDI.NOTE_ON, padAddress, emptyHandler); // Note On
      midi.makeInputHandler(MIDI.CONTROL_CHANGE, padAddress, emptyHandler); // Control Change
    }
  }
  
  // Also clear handlers for sidepads for both message types
  // Graceful degradation: if sidepads doesn't exist, use empty array
  const sidepads = LaunchpadProMK3.sidepads || [];
  
  for (let i = 0; i < sidepads.length; i++) {
    // Graceful degradation: skip invalid sidepad addresses
    const sidepadAddress = sidepads[i];
    if (!sidepadAddress) {
      continue;
    }
    
    // Overwrite with empty handlers
    midi.makeInputHandler(MIDI.NOTE_ON, sidepadAddress, emptyHandler); // Note On
    midi.makeInputHandler(MIDI.CONTROL_CHANGE, sidepadAddress, emptyHandler); // Control Change
  }
  
  LOG.debug("clearPageMidiHandlers: Done clearing all handlers", C.G);
};



/**
 * clean up all beat-synchronized connections when switching pages
 * MARK: clearBeatConnections()
 * gracefully handles missing connections array
 * @returns {void}
 */
LaunchpadProMK3.clearBeatConnections = function () {
  const beatConnections = LaunchpadProMK3.beatConnections || [];
  
  if (beatConnections.length > 0) {
    LOG.debug("clearBeatConnections: ### clearing " + C.O + beatConnections.length + C.RE + " beat connections");
    // Disconnect each connection
    for (let i = 0; i < beatConnections.length; i++) {
      const conn = beatConnections[i];
      // graceful degradation: skip if connection object incomplete
      if (!conn || !conn.group || !conn.control || !conn.callback) {
        continue;
      }
      engine.disconnectControl(conn.group, conn.control, conn.callback);
      LOG.debug("clearBeatConnections: disconnected " + C.O + conn.group + C.RE + "." + C.O + conn.control);
    }
  }
  
  // Always clear the array
  LaunchpadProMK3.beatConnections = [];
};


/**
 * cancel all active hotcue sequence timers across all decks
 * MARK: cancelAllHotcueSequenceTimers()
 * @returns {void}
 */
LaunchpadProMK3.cancelAllHotcueSequenceTimers = function () {
  let stopped = 0;
  for (const deck in LaunchpadProMK3._hotcueSequenceTimers) {
    const id = LaunchpadProMK3._hotcueSequenceTimers[deck];
    if (id) {
      try { 
        engine.stopTimer(id); 
        stopped += 1;
      } catch (e) { 
        LOG.warn("failed to stop hotcue sequence timer for deck " + deck + ": " + e, 0, 0, "timers"); 
      }
    }
    LaunchpadProMK3._hotcueSequenceTimers[deck] = null;
  }
  LOG.info("cancelAllHotcueSequenceTimers: stopped " + stopped + " timer(s)", 0, 0, "timers");
};

/**
 * cancel the loop verification timer if active
 * MARK: cancelLoopVerifyTimer()
 * @returns {void}
 */
LaunchpadProMK3.cancelLoopVerifyTimer = function () {
  if (LaunchpadProMK3._loopVerifyTimerId !== null) {
    try { 
      engine.stopTimer(LaunchpadProMK3._loopVerifyTimerId); 
      LOG.debug("cancelLoopVerifyTimer: stopped id " + LaunchpadProMK3._loopVerifyTimerId, 0, 0, "timers");
    } catch (e) { 
      LOG.warn("failed to stop loop verify timer: " + e, 0, 0, "timers"); 
    }
    LaunchpadProMK3._loopVerifyTimerId = null;
  }
};

/**
 * cancel hotcue sequence timer for a specific deck
 * MARK: cancelHotcueSequenceTimer(deck)
 * @param {number} deck - deck number (1-4)
 * @returns {void}
 */
LaunchpadProMK3.cancelHotcueSequenceTimer = function (deck) {
  const id = LaunchpadProMK3._hotcueSequenceTimers[deck];
  if (id) {
    try { 
      engine.stopTimer(id); 
    } catch (e) { 
      LOG.warn("failed to stop hotcue sequence timer for deck " + deck + ": " + e, 0, 0, "timers"); 
    }
  }
  LaunchpadProMK3._hotcueSequenceTimers[deck] = null;
  // invalidate any in-flight sequence by changing its token
  LaunchpadProMK3._hotcueSequenceTokens[deck] = {};
  LOG.debug("cancelHotcueSequenceTimer(" + deck + "): stopped", 0, 0, "timers");
};






//// Single pad light functions

/**
 * send RGB color to a single pad via SysEx
 * MARK: sendRGB/HEX()
 * @param {number} pad - MIDI pad address (0-127)
 * @param {number|Array<number>} r - red value (0-255) or RGB array [r,g,b]
 * @param {number} [g] - green value (0-255)
 * @param {number} [b] - blue value (0-255)
 * @returns {void}
 */
LaunchpadProMK3.sendRGB = function (pad, r, g, b) {
  // input validation
  if (pad === undefined || pad === null) {
    LOG.error("sendRGB: pad address is undefined/null");
    return;
  }
  if (pad < 0 || pad > 127) {
    LOG.error("sendRGB: invalid pad address " + pad + " (must be 0-127)");
    return;
  }
  
  // support array form: sendRGB(pad, [r,g,b])
  if (g === undefined && b === undefined && Array.isArray(r)) {
    [r, g, b] = r;
  }
  
  // default undefined colors to 0
  r = r || 0;
  g = g || 0;
  b = b || 0;
  
  // warn if RGB values out of range (will be clamped)
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    LOG.warn("sendRGB: RGB values out of range [" + r + "," + g + "," + b + "], clamping to 0-255");
  }
  
  // apply global brightness scaling (affects all pages)
  const scale = LaunchpadProMK3.globalBrightnessScale !== undefined ? LaunchpadProMK3.globalBrightnessScale : 1.0;
  if (scale !== 1.0) {
    r = Math.max(0, Math.min(255, Math.round(r * scale)));
    g = Math.max(0, Math.min(255, Math.round(g * scale)));
    b = Math.max(0, Math.min(255, Math.round(b * scale)));
  }
  
  // convert 0..255 to 0..127 with clamping
  const toMidi = (v) => Math.max(0, Math.min(127, Math.floor(v / 2)));
  LaunchpadProMK3.sendSysEx([0x03, 0x03, pad, toMidi(r), toMidi(g), toMidi(b)]);
};

/**
 * send hex color to a single pad via SysEx
 * @param {number} pad - MIDI pad address (0-127)
 * @param {number} hex - hex color value (0xRRGGBB)
 * @returns {void}
 */
LaunchpadProMK3.sendHEX = function (pad, hex) {
  // input validation
  if (pad === undefined || pad === null) {
    LOG.error("sendHEX: pad address is undefined/null");
    return;
  }
  if (pad < 0 || pad > 127) {
    LOG.error("sendHEX: invalid pad address " + pad + " (must be 0-127)");
    return;
  }
  if (hex === undefined || hex === null) {
    LOG.error("sendHEX: hex color is undefined/null");
    return;
  }
  
  let r = (hex >> 16) & 0xFF;
  let g = (hex >> 8) & 0xFF;
  let b = hex & 0xFF;
  
  // apply global brightness scaling
  const scale = LaunchpadProMK3.globalBrightnessScale !== undefined ? LaunchpadProMK3.globalBrightnessScale : 1.0;
  if (scale !== 1.0) {
    r = Math.max(0, Math.min(255, Math.round(r * scale)));
    g = Math.max(0, Math.min(255, Math.round(g * scale)));
    b = Math.max(0, Math.min(255, Math.round(b * scale)));
  }
  
  // divided by two because MIDI is 0-127
  LaunchpadProMK3.sendSysEx([0x03, 0x03, pad, Math.floor(r / 2), Math.floor(g / 2), Math.floor(b / 2)]);
};



/**
 * convert RGB hex value to individual R, G, B values
 * MARK: hexToRGB()
 * @param {number|Array<number>} hex - hex color value (0xRRGGBB) or RGB array [R, G, B]
 * @returns {Array<number>} RGB array [R, G, B] with values 0-255
 */
LaunchpadProMK3.hexToRGB = function (hex) {
  // if it's already an array, return it
  if (Array.isArray(hex)) {
    return hex;
  }
  const r = (hex >> 16) & 0xFF;
  const g = (hex >> 8) & 0xFF;
  const b = hex & 0xFF;
  return [r, g, b];
};



/**
 * get the current hotcue bank for a deck (1-3)
 * MARK: getDeckBank(), hotcueNumForGridIndex(), hotcueNumForHotcueIndex()
 * @param {number} deckNum - deck number (1-4)
 * @returns {number} bank number (1, 2, or 3)
 */
LaunchpadProMK3.getDeckBank = function (deckNum) {
  // input validation
  if (deckNum === undefined || deckNum === null) {
    LOG.warn("getDeckBank: deckNum is undefined/null, defaulting to bank 1");
    return 1;
  }
  if (deckNum < 1 || deckNum > LaunchpadProMK3.totalDecks) {
    LOG.warn("getDeckBank: deckNum " + deckNum + " out of range (1-" + LaunchpadProMK3.totalDecks + "), defaulting to bank 1");
    return 1;
  }
  return LaunchpadProMK3.hotcueBankPerDeck[deckNum] || 1;
};

/**
 * convert page 0 pad grid index to absolute hotcue number
 * @param {number} deckNum - deck number (1-4)
 * @param {number} padGridIndex - pad index within deck's 16-pad slice (0-15)
 * @returns {number} absolute hotcue number (1-based)
 */
LaunchpadProMK3.hotcueNumForGridIndex = function (deckNum, padGridIndex) {
  const bankOffset = (LaunchpadProMK3.getDeckBank(deckNum) - 1) * LaunchpadProMK3.totalDeckHotcuePadsShown;
  return bankOffset + padGridIndex + 1;
};

/**
 * convert one-deck page hotcue index to absolute hotcue number
 * @param {number} deckNum - deck number (1-4)
 * @param {number} hotcueIndex - hotcue index within rows 7-8 (0-15)
 * @returns {number} absolute hotcue number (1-based)
 */
LaunchpadProMK3.hotcueNumForHotcueIndex = function (deckNum, hotcueIndex) {
  const bankOffset = (LaunchpadProMK3.getDeckBank(deckNum) - 1) * 16;
  return bankOffset + hotcueIndex + 1;
};
/**
 * convert HSV to RGB color space
 * consolidated function for all HSV conversions in the script
 * @param {number} h - hue (0-1)
 * @param {number} s - saturation (0-1)
 * @param {number} v - value/brightness (0-1)
 * @param {number} [scale=127] - output scale (127 for MIDI, 255 for standard RGB)
 * @returns {Array<number>} RGB array [r, g, b] scaled to specified range
 */
LaunchpadProMK3.hsvToRgb = function(h, s, v, scale = 127) {
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  
  return [Math.round(r * scale), Math.round(g * scale), Math.round(b * scale)];
};


/**
 * darken an RGB color by a given ratio
 * MARK: darkenRGBColour()
 * applies non-linear scaling for better visual sensitivity
 * @param {Array<number>} rgbIn - RGB array [r, g, b] with values 0-255
 * @param {number} ratio - darkening ratio (0-1, clamped)
 * @returns {Array<number>} darkened RGB array [r, g, b]
 */
LaunchpadProMK3.darkenRGBColour = function (rgbIn, ratio) {
  // if (ratio === undefined) { DEBUG("LaunchpadProMK3.darkenRGBColour   darken ratio undefined, so ratio = 0.2", C.O); ratio = 0.2 }
  ratio = Math.max(0, Math.min(1, ratio));
  // Apply non-linear scaling (square the ratio for better sensitivity)
  let ratioNu = +(ratio ** 2).toFixed(4);
  let rgb = [];
  // let debugMiddle = ""; // UNUSED VARIABLE
  rgb[0] = Math.round(rgbIn[0] * ratioNu);
  rgb[1] = Math.round(rgbIn[1] * ratioNu);
  rgb[2] = Math.round(rgbIn[2] * ratioNu);
  // if (rgbIn[0] > 127 || rgbIn[1] > 127 || rgbIn[2] > 127) { debugMiddle = C.R + "   OOVVEERR 127!" + C.RE } // UNUSED DEBUG CODE
  return rgb;
};


/**
 * dim RGB color based on semantic state
 * DRY helper to replace repeated darkenRGBColour calls with dimscale constants
 * @param {Array<number>} rgb - RGB array [r, g, b] with values 0-255
 * @param {string} state - semantic state name
 * @returns {Array<number>} dimmed RGB array [r, g, b]
 */
LaunchpadProMK3.dimForState = function(rgb, state) {
  const scales = {
    unloaded: this.deckUnloadedDimscale,
    loaded: this.deckLoadedDimscale,
    inactive: this.deckLoadedInactiveDimscale,
    active: this.deckLoadedActiveDimscale,
    onedeck_unloaded: this.oneDeckUnloadedDimscale,
    onedeck_loaded: this.oneDeckLoadedDimscale
  };
  const scale = scales[state];
  if (scale === undefined) {
    LOG.warn("dimForState: unknown state '" + state + "', using 1.0");
    return rgb;
  }
  return this.darkenRGBColour(rgb, scale);
};


// MARK: P0 TRACKWITHINTROOUTRO()
// toggle sidepad colour to blue or off based on intro/outro marker status
// blue indicates marker is active, off indicates no marker
LaunchpadProMK3.trackWithIntroOutro = function (value, deckNum, padAddress) {
  if (value > 0) {
    LOG.debug("trackWithIntroOutro(" + C.O + deckNum + C.O + ") pad " + C.O + padAddress + C.RE + "   deckLoaded " + C.O + value + C.RE)
    LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0xFF);
  } else {
    LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0x00);
  }
};

/**
 * update hotcue bank indicator lights
 * controls brightness buttons (row0[0] and row0[1]) to show bank status
 * @returns {void}
 */
LaunchpadProMK3.updateHotcueBankLights = function () {
  // Always paint brightness pads with the green/jade scheme regardless of page
  
  // Colors for different bank states
  const dimGreen = [0x20, 0x40, 0x20];      // Very dim - bank not in use
  const mediumGreen = [0x40, 0x7F, 0x40];   // Medium - some decks using this bank
  const brightGreen = [0x7F, 0xFF, 0x7F];   // Bright - all decks using this bank
  const orangeGlow = [0x7F, 0x4F, 0x00];    // Orange - mixed bank usage
  
  // Count how many decks are using each bank
  let bank1Count = 0, bank2Count = 0, bank3Count = 0;
  for (let deck = 1; deck <= LaunchpadProMK3.totalDecks; deck++) {
    const deckBank = LaunchpadProMK3.getDeckBank(deck);
    if (deckBank === 1) bank1Count++;
    else if (deckBank === 2) bank2Count++;
    else if (deckBank === 3) bank3Count++;
  }
  
  const totalDecks = LaunchpadProMK3.totalDecks;
  let bank1Color, bank2Color;
  
  // Determine colors based on usage patterns
  if (bank1Count === totalDecks) {
    // All decks on bank 1
    bank1Color = brightGreen;
    bank2Color = dimGreen;
  } else if (bank2Count === totalDecks) {
    // All decks on bank 2
    bank1Color = dimGreen;
    bank2Color = brightGreen;
  } else if (bank3Count === totalDecks) {
    // All decks on bank 3 - show mixed orange on both
    bank1Color = orangeGlow;
    bank2Color = orangeGlow;
  } else {
    // Mixed usage - show proportional brightness
    bank1Color = bank1Count > 0 ? mediumGreen : dimGreen;
    bank2Color = (bank2Count + bank3Count) > 0 ? mediumGreen : dimGreen;
  }
  
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row0[0], bank2Color);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row0[1], bank1Color);
  
  LOG.debug("updateHotcueBankLights: Bank usage - 1:" + bank1Count + " 2:" + bank2Count + " 3:" + bank3Count, C.G);
};


//// Multiple pad light functions
// (removed) sendTopAndBottom(padAddress, ...) was unused and removed to reduce cruft.


// MARK: SIDEPADDECKCOLOUR()
// Set the color of all sidepads for a specific deck
// Used for visual deck identification
LaunchpadProMK3.sidepadDeckColour = function (d) {
  LOG.debug("LaunchpadProMK3.sidepadDeckColour()", 2, 0, null, C.G)
  LOG.debug("sidepadDeckColour:   d " + C.O + d, C.RE);

  // Graceful degradation: if deck config doesn't exist, use default values
  const deckConfig = LaunchpadProMK3.deck.config[d] || { order: d, colour: 0xFFFFFF };
  const deckPosition = deckConfig.order;
  const deckColour = deckConfig.colour;
  const deckSidepadsStart = ((deckPosition - 1) * 4);
  LOG.debug("sidepadDeckColour:   deckSidepadsStart " + C.O + deckSidepadsStart);

  // Graceful degradation: if sidepads array doesn't exist, use default addresses
  const sidepads = LaunchpadProMK3.sidepads ? 
    LaunchpadProMK3.sidepads.slice(deckSidepadsStart, deckSidepadsStart + 4) : 
    [80, 70, 89, 79]; // Default sidepad addresses
  LOG.debug("sidepadDeckColour:   sidepads " + C.O + sidepads);

  // Graceful degradation: if not enough sidepads, use what we have
  const availableSidepads = sidepads.length >= 4 ? sidepads : sidepads.concat([80, 70, 89, 79].slice(0, 4 - sidepads.length));

  // cut next LED address from sidepad list
  const nextAddress = availableSidepads.shift();
  if (nextAddress !== undefined) {
    LOG.debug("sidepadDeckColour:   nextAddress " + C.O + nextAddress);
    LaunchpadProMK3.sendHEX(nextAddress, deckColour);
  }
  
  // Set the color for current deck LED
  const next2Address = availableSidepads.shift();
  if (next2Address !== undefined) {
    LOG.debug("sidepadDeckColour:   next2Address " + C.O + next2Address, C.R);
    LaunchpadProMK3.sendHEX(next2Address, deckColour);
  }
  
  // Set the color for next deck LED
  const next3Address = availableSidepads.shift();
  if (next3Address !== undefined) {
    LOG.debug("sidepadDeckColour:   next3Address " + C.O + next3Address, C.R);
    LaunchpadProMK3.sendHEX(next3Address, deckColour);
  }
  
  // Set the color for next next deck LEDs
  const next4Address = availableSidepads.shift();
  if (next4Address !== undefined) {
    LOG.debug("sidepadDeckColour:   next4Address " + C.O + next4Address, C.R);
    LaunchpadProMK3.sendHEX(next4Address, deckColour);
  }
  
  LOG.debug("sidepadDeckColour:   extras side colour deck " + C.O + d + C.RE + "   nextAddress " + C.O + nextAddress + C.RE + "   next2Address " + C.O + next2Address + C.RE + "   next3Address " + C.O + next3Address + C.RE + "   next4Address " + C.O + next4Address + C.RE, 0, 1, null, C.RE);
};


  // LEDs for page selection and system controls
  // lights up row2 buttons with appropriate colors for current page
  LaunchpadProMK3.lightUpRow2 = function () {
  LOG.debug("LaunchpadProMK3.lightUpRow2()", 0, 1, null, C.G)
  
  // Graceful degradation: if row2 array doesn't exist, use default addresses
  const row2 = LaunchpadProMK3.row2 || [0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x6B, 0x6C];
  
    // Base color for page buttons (desaturated purple-ish)
    for (let i = 0; i < LaunchpadProMK3.pageButtonConfig.length; i += 1) {
      LaunchpadProMK3.sendRGB(row2[i], 127, 110, 127);
    }

    // Determine which row2 button corresponds to the current page and whether it's an alt
    let highlightIndex = null;
    let isAlt = false;
    for (let i = 0; i < LaunchpadProMK3.pageButtonConfig.length; i += 1) {
      const cfg = LaunchpadProMK3.pageButtonConfig[i];
      if (!cfg) { continue; }
      if (cfg.primary === LaunchpadProMK3.currentPage) { highlightIndex = i; isAlt = false; break; }
      if (cfg.alt !== null && cfg.alt === LaunchpadProMK3.currentPage) { highlightIndex = i; isAlt = true; break; }
    }

    if (highlightIndex !== null) {
      const rgb = isAlt ? LaunchpadProMK3.pageAltHighlightRgb : LaunchpadProMK3.pagePrimaryHighlightRgb;
      LaunchpadProMK3.sendRGB(row2[highlightIndex], rgb);
    }

    // Highlight 4th button when on animation pages (8/9)
    if (LaunchpadProMK3.currentPage === 8 || LaunchpadProMK3.currentPage === 9) {
      const rgb = LaunchpadProMK3.pageAltHighlightRgb;
      LaunchpadProMK3.sendRGB(row2[3], rgb);
    }

    // ensure Undo button (row2 pad 6) LED is set and not overridden by page paints
    LaunchpadProMK3.sendRGB(row2[5], 0x7F, 0x30, 0x7F);

    // Ensure slip toggle LED reflects current slip state after repaint
    LaunchpadProMK3.refreshSlipLed();
  };


// MARK: GRADIENTSETUP()
// apply split gradients to deck pads for visual organization
// creates two separate gradients that meet in the middle
LaunchpadProMK3.gradientSetup = function (deck, altpos, gradStartA, gradEndA, gradStartB, gradEndB) {
  // Graceful degradation: if deck doesn't exist, use deck 1 as fallback
  const targetDeck = LaunchpadProMK3.decks[deck] || LaunchpadProMK3.decks[1];
  if (!targetDeck) {
    LOG.debug("gradientSetup: No decks available, skipping", C.Y);
    return;
  }
  
  // Graceful degradation: if deckColour doesn't exist, use white
  const deckColour = targetDeck.deckColour || 0xFFFFFF;
  const deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
  if (LaunchpadProMK3.DEBUG_GRADIENTS) {
    LOG.debug("gradientSetup: deck " + C.O + deck + C.RE + "   altpos " + C.O + altpos + C.RE + "   deckColour " + C.O + "#" + deckColour + C.RE + "   deckRgb " + C.O + deckRgb, 1, 0, null, C.G);
  }
  const channel = `[Channel${deck}]`;
  const deckLoaded = engine.getValue(channel, "track_loaded");
  const gradLength = LaunchpadProMK3.totalDeckHotcuePadsShown / 2
  const gradA = LaunchpadProMK3.gradientCalculate(gradStartA, gradEndA, gradLength);
  const gradB = LaunchpadProMK3.gradientCalculate(gradStartB, gradEndB, gradLength);
  const gradBoth = gradA.concat(gradB);
  if (LaunchpadProMK3.DEBUG_GRADIENTS_VERBOSE) {
    LOG.debug("gradientSetup:  gradBoth " + C.O + gradBoth + C.RE + "   len " + C.O + gradBoth.length);
  }
  if (altpos === undefined) { altpos = 1 }
  
  // Graceful degradation: determine which deck's pads to use
  let pads = null;
  if (LaunchpadProMK3.currentPage !== 6) {
    // Use target deck's pads, fallback to empty array if not available
    pads = targetDeck.pads || [];
  } else {
    // Use altpos deck's pads, fallback to target deck, then empty array
    const altDeck = LaunchpadProMK3.decks[altpos] || targetDeck;
    pads = altDeck.pads || [];
  }
  if (LaunchpadProMK3.DEBUG_GRADIENTS) {
    LOG.debug("gradientSetup: pads " + C.O + pads + C.RE + "   len " + C.O + pads.length);
  }
  
  // Graceful degradation: if no gradient data, use solid colors
  if (!gradBoth || gradBoth.length === 0) {
    LOG.debug("gradientSetup: No gradient data, using solid colors", C.Y);
    const solidColor = [127, 127, 127]; // Gray
    for (let pad of pads) {
      if (pad !== null && pad !== undefined) {
        LaunchpadProMK3.sendRGB(pad, solidColor);
      }
    }
    return;
  }
  
  for (let pad of pads) {
    // Skip invalid pad addresses
    if (!pad) { continue; }
    let toSend = gradBoth.shift();
    // Graceful degradation: if no color data, use white
    if (!toSend || !Array.isArray(toSend) || toSend.length < 3) {
      toSend = [127, 127, 127]; // Gray
    }
    
    if (LaunchpadProMK3.DEBUG_GRADIENTS_VERBOSE) {
      LOG.debug("gradientSetup: toSend " + C.O + toSend + C.RE + "   len " + C.O + gradBoth.length);
    }
    if (deckLoaded !== 1) { toSend = LaunchpadProMK3.dimForState(toSend, 'unloaded'); }
    if (LaunchpadProMK3.DEBUG_GRADIENTS_VERBOSE) {
      LOG.debug("gradientSetup: gradBoth " + C.O + gradBoth + C.RE + "   len " + C.O + gradBoth.length);
    }
    const r = toSend[0];
    const g = toSend[1];
    const b = toSend[2];
    if (LaunchpadProMK3.DEBUG_GRADIENTS_VERBOSE) {
      LOG.debug("toSend " + toSend + "    pad " + pad + "   r " + r + "  g " + g + "   b " + b, C.O);
    }
    LaunchpadProMK3.sendRGB(pad, r, g, b);
  };
};


/**
 * get gradient palette for loop pages
 * MARK: GETLOOPGRADIENTPALETTE()
 * centralized palette generation for loop-related pages (1,4,5,6,7)
 * @param {Array<number>} deckRgb - deck color as RGB array
 * @param {number} page - page number (1,4,5,6,7)
 * @returns {Object} gradient palette {gradStartA, gradEndA, gradStartB, gradEndB}
 */
LaunchpadProMK3.getLoopGradientPalette = function (deckRgb, page) {
  // Safety defaults
  const deck = (Array.isArray(deckRgb) && deckRgb.length >= 3) ? deckRgb : [127, 127, 127];
  // Requested palettes
  // Forward (smallest -> longest)
  const aqua        = [0, 255, 255];   // aqua blue (brightened for page 1 clarity)
  const blueViolet  = [114, 0, 255];   // blue violet (brightened for page 1 clarity)
  // Reverse (smallest -> longest)
  const ochre       = [127, 80, 20];   // ochre orange
  const plumRed     = [127, 0, 54];    // plum red
  // Keep existing accents for pages 6/7
  const blue        = [0, 60, 200];
  const red        = [200, 60, 0];
  const purple      = [120, 0, 160];
  const neutralA = [40, 40, 40];
  const neutralB = [60, 60, 60];
  const warm     = [200, 120, 40];
  const blueAccent = [0, 0, 255]; // blue accent
  const purpleAccent = [255, 0, 255]; // purple accent

  switch (page) {
    case 5: // reverse loop page: warm palette (red-shift allusion)
      return { gradStartA: ochre,        gradEndA: red,    gradStartB: plumRed,       gradEndB: red };
    case 4: // forward loop page: cool palette
    case 1: // one-deck loop rows (forward uses cool; reverse rows call page 5 explicitly)
      return { gradStartA: blueViolet,         gradEndA: blue, gradStartB: aqua,        gradEndB: blue };
    case 6: // loop move page (unchanged)
      return { gradStartA: neutralA,     gradEndA: blue,       gradStartB: neutralB,    gradEndB: deck };
    case 7: // loop resize page (unchanged)
      return { gradStartA: warm,         gradEndA: deck,       gradStartB: purple,      gradEndB: deck };
    default:
      return { gradStartA: neutralA,     gradEndA: deck,       gradStartB: purple,      gradEndB: deck };
  }
};

// Calculate a linear gradient between two colors
// Returns an array of RGB values representing the gradient steps
LaunchpadProMK3.gradientCalculate = function (color1, color2, steps) {
  // Graceful degradation: if inputs are invalid, return default gradient
  if (!color1 || !Array.isArray(color1) || color1.length < 3) {
    color1 = [0, 0, 0]; // Black
  }
  if (!color2 || !Array.isArray(color2) || color2.length < 3) {
    color2 = [255, 255, 255]; // White
  }
  if (!steps || steps <= 0) {
    steps = 1;
  }
  
  const gradient = [];
  for (let i = 0; i < steps; i++) {
    const scale = i / (steps - 1);
    const r = Math.round(color1[0] * (1 - scale) + color2[0] * scale);
    const g = Math.round(color1[1] * (1 - scale) + color2[1] * scale);
    const b = Math.round(color1[2] * (1 - scale) + color2[2] * scale);
    if (LaunchpadProMK3.DEBUG_GRADIENTS_VERBOSE) {
      LOG.debug(`${r},${g},${b}`);
    }
    gradient.push([r, g, b]);
  }
  return gradient;
};


/**
 * convert RGB to HSL color space
 * MARK: RGBTOHSL(), HSLTORGB(), HUEROTATE RGB(), BUILDHUEROTATEDLIGHTNESSGRADIENT()
 * @param {Array<number>} rgb - RGB array [r, g, b] with values 0-255
 * @returns {Array<number>} HSL array [h, s, l] where h=0-360, s=0-1, l=0-1
 */
LaunchpadProMK3.rgbToHsl = function (rgb) {
  let r = (rgb[0] || 0) / 255;
  let g = (rgb[1] || 0) / 255;
  let b = (rgb[2] || 0) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = 0; s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max - min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h = h * 60;
  }
  return [h, s, l];
};

/**
 * convert HSL to RGB color space
 * @param {number} h - hue (0-360)
 * @param {number} s - saturation (0-1)
 * @param {number} l - lightness (0-1)
 * @returns {Array<number>} RGB array [r, g, b] with values 0-255
 */
LaunchpadProMK3.hslToRgb = function (h, s, l) {
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  h = ((h % 360) + 360) % 360; // normalize
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hk = h / 360;
    r = hue2rgb(p, q, hk + 1/3);
    g = hue2rgb(p, q, hk);
    b = hue2rgb(p, q, hk - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

/**
 * rotate hue of an RGB color by degrees
 * @param {Array<number>} rgb - RGB array [r, g, b]
 * @param {number} degrees - hue rotation in degrees
 * @returns {Array<number>} rotated RGB array
 */
LaunchpadProMK3.hueRotateRGB = function (rgb, degrees) {
  const hsl = LaunchpadProMK3.rgbToHsl(rgb);
  const h = (hsl[0] + (degrees || 0));
  return LaunchpadProMK3.hslToRgb(h, hsl[1], hsl[2]);
};

/**
 * lighten an RGB color by increasing lightness
 * @param {Array<number>} rgbIn - RGB array [r, g, b]
 * @param {number} deltaL - lightness increase (0-1)
 * @returns {Array<number>} lightened RGB array
 */
LaunchpadProMK3.lightenRGBColour = function (rgbIn, deltaL) {
  const hsl = LaunchpadProMK3.rgbToHsl(rgbIn);
  const lNew = Math.max(0, Math.min(1, hsl[2] + (deltaL || 0)));
  return LaunchpadProMK3.hslToRgb(hsl[0], hsl[1], lNew);
};

/**
 * linearly blend two RGB colors
 * @param {number|Array<number>} a - first color (hex or RGB array)
 * @param {number|Array<number>} b - second color (hex or RGB array)
 * @param {number} t - blend factor (0-1)
 * @returns {Array<number>} blended RGB array
 */
LaunchpadProMK3.mixRGB = function (a, b, t) {
  t = Math.max(0, Math.min(1, t || 0));
  a = LaunchpadProMK3.hexToRGB(a);
  b = LaunchpadProMK3.hexToRGB(b);
  const r = Math.round(a[0] * (1 - t) + b[0] * t);
  const g = Math.round(a[1] * (1 - t) + b[1] * t);
  const bb = Math.round(a[2] * (1 - t) + b[2] * t);
  return [r, g, bb];
};

// Build a small vertical gradient with slight hue rotation and controlled lightness
/**
 * build gradient with hue rotation and lightness interpolation
 * @param {Array<number>} baseRgb - starting RGB color
 * @param {number} steps - number of gradient steps
 * @param {number} huePerStep - degrees to rotate per step
 * @param {number} lStart - starting lightness (0-1)
 * @param {number} lEnd - ending lightness (0-1)
 * @param {number} [satScale=1] - optional saturation multiplier
 * @returns {Array<Array<number>>} array of RGB arrays
 */
LaunchpadProMK3.buildHueRotatedLightnessGradient = function (baseRgb, steps, huePerStep, lStart, lEnd, satScale) {
  steps = Math.max(1, steps | 0);
  const out = [];
  const hsl = LaunchpadProMK3.rgbToHsl(baseRgb);
  const h0 = hsl[0], s0 = hsl[1];
  const s = Math.max(0, Math.min(1, (satScale === undefined ? 1 : satScale) * s0));
  for (let i = 0; i < steps; i++) {
    const t = (steps === 1) ? 0 : (i / (steps - 1));
    const hi = h0 + (huePerStep || 0) * i;
    const li = (lStart !== undefined && lEnd !== undefined)
      ? (lStart + (lEnd - lStart) * t)
      : hsl[2];
    out.push(LaunchpadProMK3.hslToRgb(hi, s, li));
  }
  return out;
};


// MARK: GETMAINGRIDPADADDRESSESFORROWS()
// returns a flat array of pad addresses for the given grid row indices.
// Accepts 1-based rows (1..8) or 0-based (0..7). Preserves left→right order per row.
// Used for applying visual effects to specific row groups
LaunchpadProMK3.getMainGridPadAddressesForRows = function (rowIndices) {
  const rows = Array.isArray(rowIndices) ? rowIndices : [rowIndices];
  const pads = [];
  // Graceful degradation: if mainpadAddresses doesn't exist, use sane defaults
  const mainpadAddresses = LaunchpadProMK3.mainpadAddresses || [
    81, 82, 83, 84, 85, 86, 87, 88,
    71, 72, 73, 74, 75, 76, 77, 78,
    61, 62, 63, 64, 65, 66, 67, 68,
    51, 52, 53, 54, 55, 56, 57, 58,
    41, 42, 43, 44, 45, 46, 47, 48,
    31, 32, 33, 34, 35, 36, 37, 38,
    21, 22, 23, 24, 25, 26, 27, 28,
    11, 12, 13, 14, 15, 16, 17, 18
  ];
  for (let r of rows) {
    let idx = r;
    if (r >= 1 && r <= 8) { idx = r - 1; }
    if (idx >= 0 && idx < 8) {
      const start = idx * 8;
      const rowPads = mainpadAddresses.slice(start, start + 8);
      for (let p of rowPads) { if (p !== null && p !== undefined) { pads.push(p); } }
    }
  }
  return pads;
};


// MARK: APPLYLINEARGRADIENTTOSPECIFICPADS()
// apply a single linear gradient across an explicit pad list (8/16/32 pads).
// Used for creating smooth color transitions across specific pad groups
LaunchpadProMK3.applyLinearGradientToSpecificPads = function (deck, pads, startRgb, endRgb) {
  if (!pads || pads.length === 0) { return; }
  const channel = `[Channel${deck}]`;
  const deckLoaded = engine.getValue(channel, "track_loaded");
  const steps = Math.max(1, pads.length);
  const grad = LaunchpadProMK3.gradientCalculate(startRgb, endRgb, steps);
  for (let i = 0; i < pads.length; i++) {
    const pad = pads[i];
    if (!pad) { continue; }
    let rgb = grad[i] || endRgb;
    if (deckLoaded !== 1) {
      let dimRatio = LaunchpadProMK3.deckUnloadedDimscale;
      try {
        if (LaunchpadProMK3.currentPage === 1 && deck === (LaunchpadProMK3.oneDeckCurrent || 1)) {
          dimRatio = LaunchpadProMK3.oneDeckUnloadedDimscale;
        }
      } catch (e) {}
      rgb = LaunchpadProMK3.darkenRGBColour(rgb, dimRatio);
    }
    LaunchpadProMK3.sendRGB(pad, rgb[0], rgb[1], rgb[2]);
  }
};


// MARK: APPLYSPLITGRADIENTTOSPECIFICPADS()
// split the pad list into two equal halves and apply A and B gradients respectively.
// Ideal for 16 pads over two rows, or 32 pads over four rows.
// Creates visual separation between different control sections
LaunchpadProMK3.applySplitGradientToSpecificPads = function (deck, pads, gradStartA, gradEndA, gradStartB, gradEndB) {
  if (!pads || pads.length === 0) { return; }
  const half = Math.floor(pads.length / 2);
  // If odd, fall back to a single linear gradient
  if (half === 0 || (half * 2) !== pads.length) {
    LaunchpadProMK3.applyLinearGradientToSpecificPads(deck, pads, gradStartA, gradEndB);
    return;
  }
  const channel = `[Channel${deck}]`;
  const deckLoaded = engine.getValue(channel, "track_loaded");
  const gradA = LaunchpadProMK3.gradientCalculate(gradStartA, gradEndA, half);
  const gradB = LaunchpadProMK3.gradientCalculate(gradStartB, gradEndB, half);
  for (let i = 0; i < pads.length; i++) {
    const pad = pads[i];
    if (!pad) { continue; }
    let rgb = (i < half) ? (gradA[i] || gradEndA) : (gradB[i - half] || gradEndB);
    if (deckLoaded !== 1) {
      let dimRatio = LaunchpadProMK3.deckUnloadedDimscale;
      try {
        if (LaunchpadProMK3.currentPage === 1 && deck === (LaunchpadProMK3.oneDeckCurrent || 1)) {
          dimRatio = LaunchpadProMK3.oneDeckUnloadedDimscale;
        }
      } catch (e) {}
      rgb = LaunchpadProMK3.darkenRGBColour(rgb, dimRatio);
    }
    LaunchpadProMK3.sendRGB(pad, rgb[0], rgb[1], rgb[2]);
  }
};


//// clearing and resetting main hotcues
// MARK: CLEARMAIN()
// turn off all main grid and sidepad LEDs for page changes
LaunchpadProMK3.clearMain = function () {
  //// main pads
  LOG.debug("clearMain: /// clearing ALL main and side pads", 1, 0, null, C.G);
  // turn all pads off by compiling a multi-led affecting sysex msg to send
  // Replace _.flatMap with manual implementation
  let colorSpecMulti = [];
  
  // Graceful degradation: if mainpadAddresses doesn't exist, use default addresses
  const mainpadAddresses = LaunchpadProMK3.mainpadAddresses || [
    81, 82, 83, 84, 85, 86, 87, 88,
    71, 72, 73, 74, 75, 76, 77, 78,
    61, 62, 63, 64, 65, 66, 67, 68,
    51, 52, 53, 54, 55, 56, 57, 58,
    41, 42, 43, 44, 45, 46, 47, 48,
    31, 32, 33, 34, 35, 36, 37, 38,
    21, 22, 23, 24, 25, 26, 27, 28,
    11, 12, 13, 14, 15, 16, 17, 18
  ];
  
  for (let i = 0; i < mainpadAddresses.length; i++) {
    const address = mainpadAddresses[i];
    if (address) {
      colorSpecMulti.push(0x03, address, 0, 0, 0);
    }
  }
  LaunchpadProMK3.sendSysEx([0x03, ...colorSpecMulti]);
  
  //// sidepads
  let colorSpecMultiSide = [];
  
  // Graceful degradation: if sidepads doesn't exist, use default addresses
  const sidepads = LaunchpadProMK3.sidepads || [80, 70, 89, 79, 60, 50, 69, 59, 40, 30, 49, 39, 20, 10, 29, 19];
  
  for (let i = 0; i < sidepads.length; i++) {
    const address = sidepads[i];
    if (address) {
      colorSpecMultiSide.push(0x03, address, 0, 0, 0);
    }
  }
  LaunchpadProMK3.sendSysEx([0x03, ...colorSpecMultiSide]);
  
  LOG.debug("clearMain: /// end clearing ALL main and side pads", C.R);
};


// turn off ALL LEDs for page change or shutdown
// MARK: CLEARALL()
// comprehensive LED clearing for all pads on the controller
LaunchpadProMK3.clearAll = function () {
  LOG.debug("/// clearing all pads", 2, 0, null, C.G);
  // compile and send a two part msg to turn all pads off
  let ca = [0x03]; 
  let cb = [0x03];
  for (let i = 0; i <= 0x3F; i += 1) { 
    ca.push(0x03, i, 0, 0, 0); 
  } 
  LaunchpadProMK3.sendSysEx(ca);
  for (let i = 0x40; i <= 0x7F; i += 1) { 
    cb.push(0x03, i, 0, 0, 0); 
  } 
  LaunchpadProMK3.sendSysEx(cb);
  LOG.debug("/// end clearing all pads", C.R);
};


/**
 * shutdown LaunchpadProMK3 controller
 * called by Mixxx when controller is disconnected or Mixxx closes
 * MARK: shutdown()
 * cleans up all LEDs, timers, and connections
 * @returns {void}
 */
LaunchpadProMK3.shutdown = function () {
  LOG.info("### shutdown initiated ###", 2, 3);
  
  // cancel all hotcue sequence timers
  try { 
    LaunchpadProMK3.cancelAllHotcueSequenceTimers(); 
  } catch (e) { 
    LOG.error("failed to cancel hotcue sequence timers: " + e); 
  }
  
  // cancel any pending loop verification timer
  try { 
    LaunchpadProMK3.cancelLoopVerifyTimer(); 
  } catch (e) { 
    LOG.error("failed to cancel loop verify timer: " + e); 
  }
  
  // disconnect known beat/flash connections per deck
  LaunchpadProMK3.forEachDeck((deckNum) => {
    try { LaunchpadProMK3.cleanupScaledBeatConnections(deckNum); } catch (e) { LOG.warn("cleanup scaled beat deck " + deckNum + ": " + e); }
    try { LaunchpadProMK3.cleanupBeatjumpFlashing(deckNum); } catch (e) { LOG.warn("cleanup beatjump deck " + deckNum + ": " + e); }
    try { LaunchpadProMK3.cleanupOneDeckLoopFlashing(deckNum); } catch (e) { LOG.warn("cleanup onedeck loop deck " + deckNum + ": " + e); }
    try { LaunchpadProMK3.cleanupLoopPagesFlashing(deckNum); } catch (e) { LOG.warn("cleanup loop pages deck " + deckNum + ": " + e); }
    try { LaunchpadProMK3.cleanupSidepadBeatFlashing(deckNum); } catch (e) { LOG.warn("cleanup sidepad beat deck " + deckNum + ": " + e); }
    try { LaunchpadProMK3.cleanupPage0SidepadFlashing(deckNum); } catch (e) { LOG.warn("cleanup page0 sidepad deck " + deckNum + ": " + e); }
  });
  
  // clear any global beat connections
  try { 
    LaunchpadProMK3.clearBeatConnections(); 
  } catch (e) { 
    LOG.error("failed to clear beat connections: " + e); 
  }
  
  // clear MIDI input handlers to avoid lingering callbacks
  try { 
    LaunchpadProMK3.clearPageMidiHandlers(); 
  } catch (e) { 
    LOG.error("failed to clear page MIDI handlers: " + e); 
  }
  
  // finally clear LEDs
  try {
    LaunchpadProMK3.clearAll();
  } catch (e) {
    LOG.error("failed to clear LEDs: " + e);
  }
  
  LOG.info("LaunchpadProMK3 controller script shutdown complete");
}





// select deck and change LEDs
// MARK: SELECTDECK()
// LaunchpadProMK3.selectDeck = function (deckNum) {
//   DEBUG("selectDeck: deckNum " + C.O + deckNum + C.RE, C.G, 2)
//   LaunchpadProMK3.sleep(50);
//   // remember selection
//   LaunchpadProMK3.selectedDeck = deckNum
//   Object.entries(LaunchpadProMK3.deck.config).forEach((d) => {
//     let deckRgb = LaunchpadProMK3.hexToRGB(d[1].colour);
//     DEBUG("selectDeck: " + C.RE + "d " + C.O + JSON.stringify(d) + C.RE + "   deckNum " + C.O + deckRgb + C.RE + "   colour " + C.O + "#" + d[1].colour.toString(16) + C.RE + "   deckRgb " + C.O + deckRgb + C.RE + "   deck order " + C.O + d[1].order + C.RE + "/" + C.O + LaunchpadProMK3.totalDecks, C.O);
//     if (+d[0] !== deckNum) {
//       deckRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckUnloadedDimscale);
//     }
//     LaunchpadProMK3.sendRGB(100 + d[1].order, deckRgb);
//     if (+d[0] === deckNum) {
//       // LaunchpadProMK3.sendRGB(hotcueCreationButton, deckRgb);
//     }
//   });
//   if (LaunchpadProMK3.currentPage === 6) {
//     LaunchpadProMK3.updateOneDeckPage()
//   }
// };






//// Page functions
/**
 * switch to a different page
 * MARK: selectPage()
 * manages page transitions and cleanup of previous page resources
 * @param {number} page - page number (0-9)
 * @returns {void}
 */
LaunchpadProMK3.selectPage = function (page) {
  // find target page if none provided
  LOG.debug(() => "selectPage(" + C.O + page + C.G + ")", 25, 0, null, C.G);
  if (page === undefined) {
    page = (+LaunchpadProMK3.currentPage + 1) % LaunchpadProMK3.totalPages;
    LOG.debug(() => "selectPage: page undefined, selectPage setting page to next page    " + C.M + page, C.O);
  }
  LOG.debug(() => "selectPage: switching page from " + C.M + LaunchpadProMK3.currentPage + C.O + " to " + C.M + page, C.O);
  LaunchpadProMK3.currentPage = page;
  LaunchpadProMK3.updateRow0SelectedDeckSwatch();
  
  // Proactive cleanup for robust page transitions
  try { LaunchpadProMK3.cancelAllHotcueSequenceTimers(); } catch (e) {}
  try { LaunchpadProMK3.cancelLoopVerifyTimer(); } catch (e) {}
  try { LaunchpadProMK3.clearPageMidiHandlers(); } catch (e) {}
  if (page !== 3) {
    LOG.debug("selectPage: page !== 3, cleaning up scaled beat connections", C.R);
    LaunchpadProMK3.cleanupConnectionsForAllDecks(LaunchpadProMK3.cleanupScaledBeatConnections);
  }
  if (page !== 2 && page !== 1) {
    LOG.debug("selectPage: page !== 1 or 2, cleaning up beatjump flashing", C.R);
    LaunchpadProMK3.cleanupConnectionsForAllDecks(LaunchpadProMK3.cleanupBeatjumpFlashing);
  }
  if (page !== 1) {
    LOG.debug("selectPage: page !== 1, cleaning up loop flashing", C.R);
    LaunchpadProMK3.cleanupConnectionsForAllDecks(LaunchpadProMK3.cleanupOneDeckLoopFlashing);
  }
  if (page !== 4 && page !== 5) {
    LOG.debug("selectPage: page !== 4 or 5, cleaning up loop pages flashing", C.R);
    LaunchpadProMK3.cleanupConnectionsForAllDecks(LaunchpadProMK3.cleanupLoopPagesFlashing);
  }
  if (page !== 2 && page !== 3) {
    LOG.debug("selectPage: page !== 2 or 3, cleaning up sidepad beat connections", C.R);
    LaunchpadProMK3.cleanupConnectionsForAllDecks(LaunchpadProMK3.cleanupSidepadBeatFlashing);
  }
  if (page !== 0) {
    LOG.debug("selectPage: page !== 0, cleaning up page 0 sidepad flashing", C.R);
    LaunchpadProMK3.cleanupConnectionsForAllDecks(LaunchpadProMK3.cleanupPage0SidepadFlashing);
    LOG.debug("selectPage: page !== 0, cleaning up beat connections", C.R);
    // Clean up any existing beat connections
    LaunchpadProMK3.clearBeatConnections();
  }
LOG.debug("########### selectPage before if: page " + C.O + page, C.R);
  // Slip mode is controlled by dedicated toggle; no changes on page switch

  // use page metadata to call appropriate update function
  const pageMeta = LaunchpadProMK3.pageMetadata[page];
  if (pageMeta && pageMeta.updateFn) {
    LOG.debug(() => "selectPage: calling update for page " + C.O + page + C.G + " (" + pageMeta.name + ")", C.G);
    pageMeta.updateFn();
  } else {
    LOG.debug(() => "selectPage: no update function for page " + C.O + page, C.Y);
  }
  // Page 10-11 reserved for custom functionality
  LOG.debug("selectPage: resetting bottom row deck selection buttons for new page..", 0, 0, null, C.O)
  LaunchpadProMK3.lightUpRow2()
  
  // Update bank lights for all page switches (will turn off when not page 0)
  LaunchpadProMK3.updateHotcueBankLights();
  // Always refresh row0 loop mode LEDs to reflect current page context
  LaunchpadProMK3.updateRow0LoopModeSwitch();
  
  // restore row0 colors when leaving animation pages
  if (page !== 8 && page !== 9) {
    LaunchpadProMK3.restoreRow0Colors();
  }
  
  LOG.debug(() => "selectPage: leaving selectPage(" + C.O + page + C.R + ")", 0, 20, null, C.R)
};


// page 10 removed; no handler remains by design


// MARK: P0 UPDATEHOTCUELIGHTS()
// update main and side pad lights for a specific deck
// refreshes all visual indicators for hotcues and intro/outro markers
LaunchpadProMK3.updateHotcueLights = function (deckNum) {
  LOG.debug(() => "updateHotcueLights(" + deckNum + "): deck.config[" + deckNum + "] " + JSON.stringify(LaunchpadProMK3.deck.config[deckNum]), 2, 0, null, C.G)
  const channel = `[Channel${deckNum}]`
  const deckColour = LaunchpadProMK3.deck.config[deckNum].colour;
  const deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
  const deckLoaded = engine.getValue(channel, CONTROLS.TRACK_LOADED);
  let colourSpecMulti = [];

  // go through the hotcues for the current bank and make a longer multi-pad midi msg
  for (let i = 0; i < LaunchpadProMK3.totalDeckHotcuePadsShown; i++) {  // 0-based: cleaner array access
    let padAddress = LaunchpadProMK3.decks[deckNum].pads[i];
    if (LaunchpadProMK3.currentPage === 6) { padAddress = LaunchpadProMK3.decks[4].pads[i]; }
    
    // Calculate actual hotcue number based on per-deck bank using helpers
    const deckBank = LaunchpadProMK3.getDeckBank(deckNum);
    let actualHotcueNum = LaunchpadProMK3.hotcueNumForGridIndex(deckNum, i);
    
    // For bank 3, only show hotcues 33-36 (4 hotcues) instead of 16
    if (deckBank === 3 && i > 4) {
      // For bank 3, only the first 4 pads show hotcues 33-36, the rest stay dark
      actualHotcueNum = -1; // Invalid hotcue number will be handled below
    }
    
    LOG.debug("updateHotcueLights(" + C.O + deckNum + C.O + ") pad " + C.O + padAddress + C.RE + "   deckBank " + C.O + deckBank + C.RE + "   actualHotcueNum " + C.O + actualHotcueNum + C.RE + "   deckLoaded " + C.O + deckLoaded + C.RE + "   deckRgb " + C.O + deckRgb + C.RE)
    let padRgb;
    if (deckLoaded !== 1) {
      padRgb = LaunchpadProMK3.dimForState(deckRgb, 'unloaded');
    }
    if (deckLoaded === 1) {
      if (actualHotcueNum > 0 && actualHotcueNum <= LaunchpadProMK3.totalDeckHotcueButtons) {
        // is the hotcue enabled?
        const hotcueEnabled = engine.getValue(channel, CONTROLS.hotcue(actualHotcueNum, "status"));
        if (hotcueEnabled === 1) {
          // deck loaded, hotcue exists, if so, get it's colour
          const hotcueColour = engine.getValue(channel, CONTROLS.hotcue(actualHotcueNum, "color"));
          // const debugHotcueEnabled = "   hotcueEnabled " + C.O + hotcueEnabled + C.RE + "   hotcueColour " + C.O + "#" + hotcueColour.toString(16).padStart(6, "0").toUpperCase(); // UNUSED VARIABLE
          padRgb = LaunchpadProMK3.dimForState(LaunchpadProMK3.hexToRGB(hotcueColour), 'active');
          LOG.debug(() => "padRgb " + C.O + padRgb + C.RE)
        } else if (hotcueEnabled !== 1) {
          // deck loaded but no hotcue, set pad to deck colour, LoadedInactive
          padRgb = LaunchpadProMK3.dimForState(deckRgb, 'inactive');
          LOG.debug(() => "  padRgb " + C.O + padRgb + C.RE)
        }
      } else {
        // Invalid hotcue number (e.g., bank 3 beyond pad 4), turn off the pad
        padRgb = LaunchpadProMK3.dimForState(deckRgb, 'unloaded');
      }
    }
    // apply global brightness scaling to bulk SysEx output as well
    const _gbs = (LaunchpadProMK3.globalBrightnessScale !== undefined) ? LaunchpadProMK3.globalBrightnessScale : 1.0;
    let _r = Math.floor((padRgb[0] * _gbs) / 2);
    let _g = Math.floor((padRgb[1] * _gbs) / 2);
    let _b = Math.floor((padRgb[2] * _gbs) / 2);
    // clamp to MIDI 0..127 just like sendRGB does post-scaling
    _r = Math.max(0, Math.min(127, _r));
    _g = Math.max(0, Math.min(127, _g));
    _b = Math.max(0, Math.min(127, _b));
    colourSpecMulti.push(0x03, padAddress, _r, _g, _b);
    LOG.debug(colourSpecMulti)
    LOG.debug("updateHotcueLights(" + C.O + deckNum + C.O + "): finished creating pad address sysex msg, sending...", C.O);
    LaunchpadProMK3.sendSysEx([0x03, ...colourSpecMulti]);
    colourSpecMulti = [];
  }

  LOG.debug("updateHotcueLights(" + C.O + deckNum + C.O + "): finished creating pad address sysex msg, sending...", C.O);
  LOG.debug("updateHotcueLights(" + C.O + deckNum + C.R + "): end updating main pads", C.R);

  // Sidebar, to blue and off
  LOG.debug("updateHotcueLights(" + C.O + deckNum + C.G + "): update sidepad lights for deck " + C.O + deckNum, 1, 0, null, C.G);
  for (let i = 0; i < 4; i++) {  // 0-based: cleaner array access
    const sidepad = (deckNum) * 4 + (i + 1);
    let padAddress = LaunchpadProMK3.decks[deckNum].deckSidepadAddresses[i];
    if (LaunchpadProMK3.currentPage === 6) { padAddress = LaunchpadProMK3.sidepads[11 + (i + 1)]; }
    const sidepadControlName = LaunchpadProMK3.sidepadNames[i];
    const sidepadEnabled = engine.getValue(channel, `${sidepadControlName}enabled`);
    if (sidepadEnabled === 1) {

      LOG.debug("updateHotcueLights(" + C.O + deckNum + C.O + "): " + C.RE + "sidepad enabled: " + C.O + i + C.RE + "   sidepad " + C.O + sidepad + C.RE + "   padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   control " + C.O + sidepadControlName + C.G + "activate", C.O);
      LaunchpadProMK3.trackWithIntroOutro(1, deckNum, padAddress);
    } else {
      LOG.debug("updateHotcueLights(" + C.O + deckNum + C.O + "): " + C.RE + "sidepad disabled: " + C.O + i + C.RE + "   sidepad " + C.O + sidepad + C.RE + "   padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   control " + C.O + sidepadControlName + C.G + "activate", C.O);
      LaunchpadProMK3.trackWithIntroOutro(0, deckNum, padAddress);
    }
  }
  LOG.debug("updateHotcueLights(" + C.O + deckNum + C.R + "): end updating sidepads", C.R);
};




/// First page (0) - Hotcue System

/**
 * update page 0: hotcue page
 * MARK: p0 updateHotcuePage()
 * displays hotcues for all 4 decks (16 hotcues per deck)
 * @param {number} [deck] - specific deck to update, or all if undefined
 * @returns {void}
 */
LaunchpadProMK3.updateHotcuePage = function (deck) {
  if (LaunchpadProMK3.currentPage === 0) {
    LOG.debug("  ", 2, 0, null, C.RE);
    LOG.debug(" ▄         ▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄         ▄  ▄▄▄▄▄▄▄▄▄▄▄ ", C.M);
    LOG.debug("▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌       ▐░▌▐░░░░░░░░░░░▌", C.M);
    LOG.debug("▐░▌       ▐░▌▐░█▀▀▀▀▀▀▀█░▌ ▀▀▀▀█░█▀▀▀▀ ▐░█▀▀▀▀▀▀▀▀▀ ▐░▌       ▐░▌▐░█▀▀▀▀▀▀▀▀▀ ", C.M);
    LOG.debug("▐░▌       ▐░▌▐░▌       ▐░▌     ▐░▌     ▐░▌          ▐░▌       ▐░▌▐░▌          ", C.M);
    LOG.debug("▐░█▄▄▄▄▄▄▄█░▌▐░▌       ▐░▌     ▐░▌     ▐░▌          ▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄▄▄ ", C.M);
    LOG.debug("▐░░░░░░░░░░░▌▐░▌       ▐░▌     ▐░▌     ▐░▌          ▐░▌       ▐░▌▐░░░░░░░░░░░▌", C.M);
    LOG.debug("▐░█▀▀▀▀▀▀▀█░▌▐░▌       ▐░▌     ▐░▌     ▐░▌          ▐░▌       ▐░▌▐░█▀▀▀▀▀▀▀▀▀ ", C.M);
    LOG.debug("▐░▌       ▐░▌▐░▌       ▐░▌     ▐░▌     ▐░▌          ▐░▌       ▐░▌▐░▌          ", C.M);
    LOG.debug("▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄█░▌     ▐░▌     ▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄▄▄ ", C.M);
    LOG.debug("▐░▌       ▐░▌▐░░░░░░░░░░░▌     ▐░▌     ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌", C.M);
    LOG.debug(" ▀         ▀  ▀▀▀▀▀▀▀▀▀▀▀       ▀       ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀ ", C.M);
    LOG.debug("  ");
    LOG.debug("LaunchpadProMK3.updateHotcuePage()", C.G);
    if (deck === undefined) {
      LOG.debug("updateHotcuePage(" + C.O + deck + C.O + "): deck undefined so updating all decks..", C.O);
      LOG.debug(() => "updateHotcuePage(" + C.O + deck + C.RE + "): LaunchpadProMK3.deck.config " + C.O + JSON.stringify(LaunchpadProMK3.deck.config), 0, 0, null);
      LOG.debug(() => "updateHotcuePage(" + C.O + deck + C.RE + "): LaunchpadProMK3.deck.config[deck] " + C.O + JSON.stringify(LaunchpadProMK3.deck.config[deck]), 0, 0, null);
      LaunchpadProMK3.updateHotcueLights(1);
      LaunchpadProMK3.updateHotcueLights(2);
      if (LaunchpadProMK3.totalDecks === 4) {
        LaunchpadProMK3.updateHotcueLights(3);
        LaunchpadProMK3.updateHotcueLights(4);
      }
      LOG.debug("updateHotcuePage: end updating decks", 0, 1, null, C.R);
    } else {
      LOG.debug("updateHotcuePage: ## updating deck " + C.O + deck, C.G);
      LOG.debug(() => "updateHotcuePage: deck " + C.O + JSON.stringify(deck), 0, 0, null);
      LaunchpadProMK3.updateHotcueLights(deck);
      LOG.debug("updateHotcuePage: ### end updating deck", 0, 1, null, C.R);
    }
    
    // Update hotcue bank lights when page is updated
    LaunchpadProMK3.updateHotcueBankLights();
  }
};



/**
 * undo the last hotcue operation
 * MARK: p0 undoLastHotcue()
 * maintains a stack of operations for undo/redo functionality
 * @returns {void}
 */
LaunchpadProMK3.undoLastHotcue = function () {
  LOG.debug("undoLastHotcue: ####################### undooooo", 1, 0, null, C.G);
  // Check that a hotcue has been created
  const popped = LaunchpadProMK3.lastHotcue.shift();
  if (popped === undefined) { DEBUG("no undo stack"); return }
  LOG.debug("undoLastHotcue: ## popped:  " + popped, 1, 0, null, C.O);
  LOG.debug("undoLastHotcue: ## LaunchpadProMK3.lastHotcue:  " + LaunchpadProMK3.lastHotcue, 1, 0, null, C.G);
  LOG.debug("undoLastHotcue: ## LaunchpadProMK3.redoLastDeletedHotcue:  " + LaunchpadProMK3.redoLastDeletedHotcue, C.G);
  const channel = popped[0];
  // Deserealise array
  const control = popped[1];
  const padAddress = popped[2];
  const deckNum = popped[3];
  LOG.debug("## undoLastHotcue:   cont  " + control + ",   channel  " + channel + ",   deck  " + deckNum + ",   pad " + padAddress, C.O);
  // let colour // UNUSED VARIABLE
  // Clear hotcue
  // Common JS func to toggle a control on then off again
  script.triggerControl(channel, control + "_clear", 64);
  // Add undone hotcue to redo list, in case
  LaunchpadProMK3.redoLastDeletedHotcue.unshift(popped);
  LOG.debug("undoLastHotcue: ## LaunchpadProMK3.redoLastDeletedHotcue:  " + LaunchpadProMK3.redoLastDeletedHotcue);
  // Reset pad colour to deck colour
  LaunchpadProMK3.sendHEX(padAddress, LaunchpadProMK3.decks[deckNum].deckColour);
  LaunchpadProMK3.updateHotcuePage();
  LOG.debug("undoLastHotcue: leaving undoLastHotcue..", 1, 1, null, C.R)
};


// MARK: P0 REDOLASTHOTCUE()
// redo the last undone hotcue operation
// restores hotcues that were previously undone
LaunchpadProMK3.redoLastHotcue = function () {
  LOG.debug("redoLastHotcue: ####################### REDOOO", 1, 1, null, C.R);
  // Check if a hotcue has been undone
  if (LaunchpadProMK3.redoLastDeletedHotcue[0] === undefined) { return; }
  // Get the undone hotcue to redo
  const unpopped = LaunchpadProMK3.redoLastDeletedHotcue.shift();
  LOG.debug("redoLastHotcue: ## unpopped:  " + unpopped, 1, 0, null, C.O);
  LOG.debug("redoLastHotcue: ## LaunchpadProMK3.redoLastDeletedHotcue:  " + LaunchpadProMK3.redoLastDeletedHotcue, 1, 0, null, C.O);
  // Deserialise the hotcue to redo
  const channel = unpopped[0];
  const control = unpopped[1];
  const padAddress = unpopped[2];
  const deckNum = unpopped[3];
  // const colour = unpopped[4]; // UNUSED VARIABLE
  LOG.debug("### redoLastHotcue:   cont; " + control + ",   chan; " + channel + ",   deck; " + deckNum + ",   pad;" + padAddress);
  // Activate the hotcue to undelete it
  script.triggerControl(channel, control + "_activate", 64);
  // Add redone hotcue back to undo stack again
  LaunchpadProMK3.lastHotcue.unshift([channel, control, padAddress, deckNum]);
  LOG.debug("## LaunchpadProMK3.lastHotcue:  " + LaunchpadProMK3.lastHotcue);
  LaunchpadProMK3.updateHotcuePage();
  LOG.debug("redoLastHotcue: leaving redoLastHotcue..", 1, 1, null, C.R)
};


/**
 * clear all hotcues for a specific deck
 * MARK: p0 clearAllHotcues()
 * removes all 36 hotcues and adds them to the undo stack
 * @param {number} deckNum - deck number (1-4)
 * @returns {void}
 */
LaunchpadProMK3.clearAllHotcues = function (deckNum) {
  LOG.debug("clearAllHotcues: ####################### CLEAR ALL HOTCUES on deck " + deckNum, 1, 1, null, C.R);
  
  if (!deckNum || deckNum < 1 || deckNum > LaunchpadProMK3.totalDecks) {
    LOG.debug("clearAllHotcues: Invalid deck number: " + deckNum, C.R);
    return;
  }
  
  const channel = `[Channel${deckNum}]`;
  const clearedHotcues = [];
  
  // Loop through all 32 hotcues for this deck
  for (let hotcueNum = 1; hotcueNum <= LaunchpadProMK3.totalDeckHotcueButtons; hotcueNum++) {
    const hotcueName = "hotcue_" + hotcueNum;
    
    // Check if this hotcue exists (has a position set)
    const hotcuePosition = engine.getValue(channel, hotcueName + "_position");
    if (hotcuePosition !== -1) {
      // Calculate the pad address for this hotcue (for undo list)
      // Only hotcues 1-16 are directly visible on pads, but we track all for undo
      let padAddress = 0;
      if (hotcueNum <= LaunchpadProMK3.totalDeckHotcuePadsShown) {
        const deckObj = LaunchpadProMK3.decks[deckNum];
        if (deckObj && deckObj.pads) {
          padAddress = deckObj.pads[hotcueNum - 1] || 0;
        }
      }
      
      // Clear the hotcue
      script.triggerControl(channel, hotcueName + "_clear", 64);
      
      // Add to cleared hotcues list for undo (in reverse order so undo works correctly)
      clearedHotcues.unshift([channel, hotcueName, padAddress, deckNum]);
      
      LOG.debug("clearAllHotcues: Cleared hotcue " + hotcueNum + " on deck " + deckNum);
    }
  }
  
  // Add all cleared hotcues to the undo stack
  if (clearedHotcues.length > 0) {
    // Add all cleared hotcues to the beginning of the undo list
    LaunchpadProMK3.lastHotcue = clearedHotcues.concat(LaunchpadProMK3.lastHotcue);
    LOG.debug("clearAllHotcues: Added " + clearedHotcues.length + " hotcues to undo list");
  }
  
  // Update the display
  LaunchpadProMK3.updateHotcuePages(deckNum);
  LOG.debug("clearAllHotcues: leaving clearAllHotcues..", 1, 1, null, C.R);
};


/**
 * leadup cue definitions for create4LeadupDropHotcues
 * defines the beat positions and colors for automatic hotcue sequence creation
 */
const leadupCues = {
  "1": { control: "beatjump_256_backward", colour: 0x006838, label: "-265" }, // -265, dark green
  "2": { control: "beatjump_64_forward", colour: 0x006838, label: "-192" },   // -192, dark green
  "3": { control: "beatjump_64_forward", colour: 0x006838, label: "-128" },   // -128, dark green
  "4": { control: "beatjump_64_forward", colour: 0x006838, label: "-64" },   // -64,  dark green
  "5": { control: "beatjump_32_forward", colour: 0xff8000, label: "-32" },    // -32,  orange
  "6": { control: "beatjump_16_forward", colour: 0xff8000, label: "-16" },    // -16,  orange
  "7": { control: "beatjump_16_forward", colour: 0xc71136, label: "DROP" },    // drop, red
  "8": { control: "beatjump_128_forward", colour: 0x5C3F97, label: "+128" },   // +128, purple
}

// Helper function to set hotcue label using new UTF-8 string controls
LaunchpadProMK3.setHotcueLabel = function(group, hotcueNumber, labelText) {
  try {
    const labelControl = "hotcue_" + hotcueNumber + "_label_text";
    engine.setStringValue(group, labelControl, labelText);
    print("LaunchpadProMK3: Set hotcue " + hotcueNumber + " label to: " + labelText);
  } catch (e) {
    print("LaunchpadProMK3: Error setting hotcue label: " + e);
  }
};

// Helper function to get hotcue label using new UTF-8 string controls
LaunchpadProMK3.getHotcueLabel = function(group, hotcueNumber) {
  try {
    const labelControl = "hotcue_" + hotcueNumber + "_label_text";
    return engine.getStringValue(group, labelControl);
  } catch (e) {
    print("LaunchpadProMK3: Error getting hotcue label: " + e);
    return "";
  }
};

/**
 * helper function to check if a number is close to any value in an array
 * @param {Array<number>} array - array of numbers to check against
 * @param {number} num - number to check
 * @param {number} [precision=2] - decimal precision for comparison
 * @returns {boolean} true if close match found
 */
function isCloseEnough(array, num, precision = 2) {
  return array.some(n => Math.abs(n - num) < Math.pow(10, -precision));
}
/**
 * create 4 leadup + drop + 3 outro hotcues for DJ mixing
 * positions hotcues at specific beat intervals for smooth transitions
 * @param {number} deck - deck number (1-4)
 * @param {number} value - MIDI value (0=ignore)
 * @returns {number|void} returns 0 if value is 0/undefined
 */
LaunchpadProMK3.create4LeadupDropHotcues = function (deck, value) {
  LOG.debug(`create4LeadupDropHotcues: ## create hotcues  ${C.Y} -192 -128 -64 -32 -16 ${C.R}drop ${C.RE}on ${C.O}${deck}`, 2, 0, null, C.G);
  if (value === 0 || value === undefined) return 0;
  const group = `[Channel${deck}]`;
  
  // Check if deck has a track loaded before continuing
  const trackLoaded = engine.getValue(group, "track_loaded");
  if (trackLoaded !== 1) {
    LOG.debug(`create4LeadupDropHotcues: deck ${deck} has no track loaded (track_loaded: ${trackLoaded}), aborting`, C.R);
    return;
  }
  
  // what time is it right now?
  const now = Date.now()
  // original playPosition
  const originalPlayPosition = engine.getValue(group, "playposition");
  // rate limit: ensure at least 1 second between sequence creations
  if (now < (LaunchpadProMK3.lastHotcueCreationTime + TIMING.HOTCUE_CREATION_THROTTLE)) {
    LOG.warn("create4LeadupDropHotcues: rate limited (last: " + LaunchpadProMK3.lastHotcueCreationTime + ", now: " + now + ")", 0, 0, "hotcues");
    return;
  }
  // record now as the new last time
  LaunchpadProMK3.lastHotcueCreationTime = now;
  // how long is the track in samples?
  const samplesTotal = engine.getValue(group, "track_samples");
  const hotcuePositions = [];
  // get the first twenty hotcue positions, store in an array
  for (let h = 0; h <= 35; h++) {
    hotcuePositions[h] = engine.getValue(group, "hotcue_" + (+h + 1) + "_position")
    //if (hotcuePositions[h]) hotcueRightmost = h;
  }
  LOG.debug("create4LeadupDropHotcues: hotcuePositions  creation " + C.O + hotcuePositions);
  // for each of the controls in the object;
  LOG.debug(() => "create4LeadupDropHotcues: leadupCues " + C.O + JSON.stringify(leadupCues), 0, 0, null);
  // Non-blocking sequence runner to avoid busy-wait sleeps
  const steps = Object.entries(leadupCues);
  let idx = 0;

  // proactively cancel any in-flight sequence for this deck
  try { LaunchpadProMK3.cancelHotcueSequenceTimer(deck); } catch (e) {}
  // initialize per-deck cancellation token and store a local reference
  const token = {};
  LaunchpadProMK3._hotcueSequenceTokens[deck] = token;
  LOG.debug("create4LeadupDropHotcues: token created for deck " + C.O + deck, C.G);

  const processStep = function () {
    // Abort early if sequence was canceled before this step
    if (LaunchpadProMK3._hotcueSequenceTokens && LaunchpadProMK3._hotcueSequenceTokens[deck] !== token) {
      LOG.debug("create4LeadupDropHotcues: sequence canceled before step; abort", C.Y);
      return;
    }
    if (idx >= steps.length) {
      // Sequence finished: restore original play position
      try { engine.setValue(group, "playposition", originalPlayPosition); } catch (e) {}
      LaunchpadProMK3._hotcueSequenceTimers[deck] = null;
      if (LaunchpadProMK3._hotcueSequenceTokens) { LaunchpadProMK3._hotcueSequenceTokens[deck] = null; }
      return;
    }

    const number = steps[idx];
    LOG.debug(() => JSON.stringify(number), 0, 0, null);
    LOG.debug("number " + C.O + number[1].control);
    const control = number[1].control;
    const colour = number[1].colour;
    LOG.debug(`control ${C.O}${control}${C.RE}   colour ${C.O}#${colour.toString(16)}`, 1, 0, null, C.G);

    // perform it - handle multiple controls separated by semicolon
    const controls = control.split(';');
    LOG.debug(`create4LeadupDropHotcues: controls ${C.O}${controls}`, 1, 0, null, C.G);

    // Trigger control(s) immediately via script.triggerControl for proper on/off pulsing
    for (const singleControl of controls) {
      LOG.debug(`create4LeadupDropHotcues: singleControl ${C.O}${singleControl}`, 1, 0, null, C.G);
      const trimmedControl = singleControl.trim();
      if (trimmedControl) {
        try { script.triggerControl(group, trimmedControl, 50); } catch (e) { try { engine.setValue(group, trimmedControl, 1); } catch (e2) {} }
        LOG.debug(`create4LeadupDropHotcues: ${C.O}${trimmedControl}${C.RE}`, 1, 0, null, C.G);
      }
    }

    // after delay (gives mixxx control system time to process), read position and set hotcue
    let localTimerId = null;
    LOG.debug("create4LeadupDropHotcues: scheduling timer; prev id " + C.O + (LaunchpadProMK3._hotcueSequenceTimers[deck] || "none") + C.RE + " deck " + C.O + deck, C.G);
    localTimerId = engine.beginTimer(TIMING.HOTCUE_SEQUENCE_DELAY, function () {
      LOG.debug("create4LeadupDropHotcues: timer fired id " + C.O + localTimerId + C.RE + " deck " + C.O + deck, C.G);
      // One-shot timer: just clear stored id
      LaunchpadProMK3._hotcueSequenceTimers[deck] = null;

      // Abort if sequence was canceled mid-tick
      if (LaunchpadProMK3._hotcueSequenceTokens && LaunchpadProMK3._hotcueSequenceTokens[deck] !== token) {
        LOG.debug("create4LeadupDropHotcues: timer fired after cancel; abort", C.Y);
        try { engine.setValue(group, "playposition", originalPlayPosition); } catch (e) {}
        return;
      }

      // Validate deck is still loaded
      if (engine.getValue(group, "track_loaded") !== 1) {
        LOG.debug("create4LeadupDropHotcues: deck unloaded mid-sequence; aborting", C.Y);
        return;
      }

      // how far through the track is the playhead now, between 0 and 1
      const playPosition = engine.getValue(group, "playposition");
      LOG.debug("create4LeadupDropHotcues: playPosition " + C.O + playPosition);
      if (playPosition >= 0 && playPosition < 1) {
        // find the first unused hotcue
        LOG.debug("create4LeadupDropHotcues: hotcuePositions mid " + C.O + hotcuePositions);
        // how many samples into the track right now?
        const samplesNow = samplesTotal * playPosition;
        LOG.debug("create4LeadupDropHotcues: samplesNow " + C.O + samplesNow);
        // has this sample position got a hotcue already?
        if (!isCloseEnough(hotcuePositions, samplesNow, 3)) {
          const hotcueSpace = hotcuePositions.findIndex((hotcueSpaceFree) => hotcueSpaceFree === -1);
          LOG.debug("create4LeadupDropHotcues: hotcueSpace " + C.O + hotcueSpace);
          // if there is no hotcue space then give up
          if (hotcueSpace !== -1) {
            const hotcueSpaceTitle = "hotcue_" + (hotcueSpace + 1);
            LOG.debug("create4LeadupDropHotcues: hotcueSpaceTitle " + C.O + hotcueSpaceTitle);
            // create new hotcue
            engine.setValue(group, hotcueSpaceTitle + "_set", 1);
            // give that hotcue its colour
            engine.setValue(group, hotcueSpaceTitle + "_color", colour);
            // set the hotcue label using new string controls
            const hotcueNum = hotcueSpace + 1;
            const leadupCueKey = (idx + 1).toString();
            if (leadupCues[leadupCueKey] && leadupCues[leadupCueKey].label) {
              LaunchpadProMK3.setHotcueLabel(group, hotcueNum, leadupCues[leadupCueKey].label);
            }
            // what is its pad?
            LOG.debug("create4LeadupDropHotcues: LaunchpadProMK3.decks[deck].deckMainSliceStartIndex " + C.O + LaunchpadProMK3.decks[deck].deckMainSliceStartIndex);
            const pad = LaunchpadProMK3.decks[deck].deckMainSliceStartIndex + hotcueSpace;
            LOG.debug("create4LeadupDropHotcues: pad " + C.O + pad);
            // add to undo list
            LaunchpadProMK3.lastHotcue.unshift([group, hotcueSpaceTitle, pad, deck, colour]);

            // add to existing check
            hotcuePositions[hotcueSpace] = samplesNow;
            LOG.debug("create4LeadupDropHotcues: hotcuePositions end " + C.O + hotcuePositions, 0, 1, null, C.R);
          } else {
            LOG.debug("create4LeadupDropHotcues: no hotcue space", C.R);
          }
        }
      } else {
        // out of bounds; skip
        LOG.debug("create4LeadupDropHotcues: out-of-bounds playPosition; skipping", C.O);
      }

      // Next step
      idx += 1;
      // Check cancellation before proceeding to next step
      if (LaunchpadProMK3._hotcueSequenceTokens && LaunchpadProMK3._hotcueSequenceTokens[deck] !== token) {
        LOG.debug("create4LeadupDropHotcues: canceled before next step; stop", C.Y);
        try { engine.setValue(group, "playposition", originalPlayPosition); } catch (e) {}
        return;
      }
      processStep();
    }, true);
    LaunchpadProMK3._hotcueSequenceTimers[deck] = localTimerId;
    LOG.debug("create4LeadupDropHotcues: scheduled id " + C.O + localTimerId + C.RE + " deck " + C.O + deck, C.G);
  };

  processStep();

  //for (let X = hotcueRightmost; X <= 19; X++) {
  //  LaunchpadProMK3.sleep(25);

  LOG.debug("create4LeadupDropHotcues: # end multi hotcue creation", 0, 2, null, C.R);
};


/**
 * update page 1: one-deck mode
 * MARK: p1 updateOneDeckPage()
 * combines hotcues, beatjump, and loop controls for selected deck
 * @returns {void}
 */
LaunchpadProMK3.updateOneDeckPage = function () {
  if (LaunchpadProMK3.currentPage === 1) {
    LOG.debug("  ");
    LOG.debug(" ▄▄▄▄▄▄▄▄▄▄▄  ▄▄        ▄  ▄▄▄▄▄▄▄▄▄▄▄ ", C.M);
    LOG.debug("▐░░░░░░░░░░░▌▐░░▌      ▐░▌▐░░░░░░░░░░░▌", C.M);
    LOG.debug("▐░█▀▀▀▀▀▀▀█░▌▐░▌░▌     ▐░▌▐░█▀▀▀▀▀▀▀▀▀ ", C.M);
    LOG.debug("▐░▌       ▐░▌▐░▌▐░▌    ▐░▌▐░▌          ", C.M);
    LOG.debug("▐░▌       ▐░▌▐░▌ ▐░▌   ▐░▌▐░█▄▄▄▄▄▄▄▄▄ ", C.M);
    LOG.debug("▐░▌       ▐░▌▐░▌  ▐░▌  ▐░▌▐░░░░░░░░░░░▌", C.M);
    LOG.debug("▐░▌       ▐░▌▐░▌   ▐░▌ ▐░▌▐░█▀▀▀▀▀▀▀▀▀ ", C.M);
    LOG.debug("▐░▌       ▐░▌▐░▌    ▐░▌▐░▌▐░▌          ", C.M);
    LOG.debug("▐░█▄▄▄▄▄▄▄█░▌▐░▌     ▐░▐░▌▐░█▄▄▄▄▄▄▄▄▄ ", C.M);
    LOG.debug("▐░░░░░░░░░░░▌▐░▌      ▐░░▌▐░░░░░░░░░░░▌", C.M);
    LOG.debug(" ▀▀▀▀▀▀▀▀▀▀▀  ▀        ▀▀  ▀▀▀▀▀▀▀▀▀▀▀ ", C.M);
    LOG.debug("  ");
    LOG.debug("### updateOneDeckPage()", 0, 1, null, C.G);
    
    // Initialize selected deck if not already set
    if (!LaunchpadProMK3.oneDeckCurrent) {
      LaunchpadProMK3.oneDeckCurrent = 1; // Default to deck 1
    }
    
    // Clear the main pad grid safely
    LaunchpadProMK3.clearMain();
    
    // Get the selected deck's color
    let selectedDeck = LaunchpadProMK3.oneDeckCurrent;
    
    // Graceful degradation: if deck doesn't exist, use deck 1
    const targetDeck = LaunchpadProMK3.decks[selectedDeck] || LaunchpadProMK3.decks[1];
    if (!targetDeck) {
      LOG.debug("updateOneDeckPage: No decks available, using defaults", C.Y);
      selectedDeck = 1;
      LaunchpadProMK3.oneDeckCurrent = 1;
    }
    
    // Graceful degradation: if deckColour doesn't exist, use white
    const deckColour = targetDeck.deckColour || 0xFFFFFF;
    const deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
    
    LOG.debug("updateOneDeckPage: selected deck " + C.O + selectedDeck + C.RE + "   deckColour " + C.O + "#" + deckColour + C.RE + "   deckRgb " + C.O + deckRgb, C.G);
    
    // Delegate rows 1–4 loop visuals to targeted renderer so it stays in sync with mapping
    try { LaunchpadProMK3.updateOneDeckLoopLighting(); } catch (e) { DEBUG("updateOneDeckPage: loop lighting exception: " + e, C.Y); }

    // Set up beat-synchronized dimming for specific loop sizes (4, 8, 16 beats)
    LaunchpadProMK3.setupOneDeckLoopFlashing(selectedDeck);

    // rows 5-6: beatjump (handled by dedicated function, 16 pads)
    LaunchpadProMK3.setupOneDeckBeatjumpLighting(selectedDeck);

    // rows 7-8: hotcues (16 pads)
    LaunchpadProMK3.setupSelectedDeckHotcues(selectedDeck);
    
    // Clear existing sidepad handlers first to prevent conflicts
    const emptyHandler = function () { /* no-op */ };
    const sidepads = LaunchpadProMK3.sidepads || [];
    for (let i = 0; i < sidepads.length; i++) {
      const sidepadAddress = sidepads[i];
      if (sidepadAddress) {
        midi.makeInputHandler(MIDI.NOTE_ON, sidepadAddress, emptyHandler);
        midi.makeInputHandler(MIDI.CONTROL_CHANGE, sidepadAddress, emptyHandler);
      }
    }
    
    // Setup side buttons for One-Deck page
    // RIGHT column sidepads: loop resize controls (top 3 dec incl halve, next 3 inc incl double)
    // LEFT column sidepads: loop move controls for selected deck (top 3 back, next 3 fwd)
    // Bottom 2 pads on each side show intro/outro markers in blue adjacent to hotcue rows
    const allSidepads = LaunchpadProMK3.sidepads || [];
    const leftSidepads = allSidepads.filter(addr => addr !== null && addr !== undefined && (addr % 10 === 0));
    const rightSidepads = allSidepads.filter(addr => addr !== null && addr !== undefined && (addr % 10 === 9));

    // Reserve layout: top 6 for loop controls, bottom 2 for markers
    const leftLoopPads = leftSidepads.slice(0, 6);
    const rightLoopPads = rightSidepads.slice(0, 6);
    const leftMarkerPads = leftSidepads.slice(6, 8);
    const rightMarkerPads = rightSidepads.slice(6, 8);

    // Helpers for resize controls
    const adjustLoopSizeBy = (group, delta) => {
      const current = engine.getValue(group, "beatloop_size");
      let next = current + delta;
      next = Math.max(0.03125, Math.min(512, next));
      engine.setValue(group, "beatloop_size", next);
    };
    const adjustLoopSizeMul = (group, factor) => {
      const current = engine.getValue(group, "beatloop_size");
      let next = current * factor;
      next = Math.max(0.03125, Math.min(512, next));
      engine.setValue(group, "beatloop_size", next);
    };
    const wireRightPad = (pad, pressRgb, releaseRgb, onPress) => {
      LaunchpadProMK3.sendRGB(pad, releaseRgb[0], releaseRgb[1], releaseRgb[2]);
      midi.makeInputHandler(0xB0, pad, (channel, control, value) => {
        if (LaunchpadProMK3.currentPage !== 1) return;
        const deckNow = LaunchpadProMK3.oneDeckCurrent || 1;
        const group = (LaunchpadProMK3.decks[deckNow] && LaunchpadProMK3.decks[deckNow].currentDeck) ? LaunchpadProMK3.decks[deckNow].currentDeck : (`[Channel${deckNow}]`);
        if (value !== 0) {
          LaunchpadProMK3.sendRGB(pad, pressRgb[0], pressRgb[1], pressRgb[2]);
          try { onPress(group); } catch (e) { DEBUG("right sidepad onPress exception: " + e, C.R); }
        } else {
          LaunchpadProMK3.sendRGB(pad, releaseRgb[0], releaseRgb[1], releaseRgb[2]);
        }
      });
    };

    // Right column: repaint as deck colour (dim if unloaded)
    const rightIncPads = rightLoopPads.slice(0, 3);
    const rightDecPads = rightLoopPads.slice(3, 6);
    const _ch = `[Channel${selectedDeck}]`;
    const _loaded = engine.getValue(_ch, "track_loaded");
    const sideBaseRgb = (_loaded === 1) ? deckRgb : LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.oneDeckUnloadedDimscale);
    const decBaseGrad = rightDecPads.map(() => sideBaseRgb);
    const decPressGrad = rightDecPads.map(() => LaunchpadProMK3.darkenRGBColour(sideBaseRgb, 0.75));
    const incBaseGrad = rightIncPads.map(() => sideBaseRgb);
    const incPressGrad = rightIncPads.map(() => LaunchpadProMK3.darkenRGBColour(sideBaseRgb, 0.75));
    // Emphasize center-adjacent ops only when deck is loaded (keep uniform deck colour when unloaded)
    if (_loaded === 1) {
      // Decrease group (bottom): nearest center is index 0 -> Halve (vivid lime)
      if (rightDecPads.length >= 1) {
        decBaseGrad[0] = [96, 127, 12];
        decPressGrad[0] = LaunchpadProMK3.darkenRGBColour(decBaseGrad[0], 0.75);
      }
      // Increase group (top): nearest center is index 2 -> Double (vivid aqua)
      if (rightIncPads.length >= 3) {
        incBaseGrad[2] = [10, 127, 120];
        incPressGrad[2] = LaunchpadProMK3.darkenRGBColour(incBaseGrad[2], 0.75);
      }
    }
    // Wire dec (bottom): Halve, -4, -8 (top->bottom within bottom trio)
    for (let i = 0; i < rightDecPads.length; i++) {
      const pad = rightDecPads[i];
      if (i === 0) wireRightPad(pad, decPressGrad[i], decBaseGrad[i], (group) => script.triggerControl(group, "loop_halve", 50));
      else if (i === 1) wireRightPad(pad, decPressGrad[i], decBaseGrad[i], (group) => adjustLoopSizeBy(group, -4));
      else wireRightPad(pad, decPressGrad[i], decBaseGrad[i], (group) => adjustLoopSizeBy(group, -8));
    }
    // Wire inc (top): +8, +4, Double (top->bottom within top trio)
    for (let i = 0; i < rightIncPads.length; i++) {
      const pad = rightIncPads[i];
      if (i === 2) wireRightPad(pad, incPressGrad[i], incBaseGrad[i], (group) => script.triggerControl(group, "loop_double", 50));
      else if (i === 1) wireRightPad(pad, incPressGrad[i], incBaseGrad[i], (group) => adjustLoopSizeBy(group, +4));
      else wireRightPad(pad, incPressGrad[i], incBaseGrad[i], (group) => adjustLoopSizeBy(group, +8));
    }

    // Left column: repaint as deck colour (dim if unloaded), handlers unchanged
    const fwdPads = leftLoopPads.slice(0, 3);
    const backPads = leftLoopPads.slice(3, 6);
    const backBaseGrad = backPads.map(() => sideBaseRgb);
    const backPressGrad = backPads.map(rgb => LaunchpadProMK3.darkenRGBColour(sideBaseRgb, 0.75));
    const fwdBaseGrad = fwdPads.map(() => sideBaseRgb);
    const fwdPressGrad = fwdPads.map(rgb => LaunchpadProMK3.darkenRGBColour(sideBaseRgb, 0.75));
    // Paint base
    for (let i = 0; i < backPads.length; i++) {
      const pad = backPads[i];
      const c = backBaseGrad[i] || backBaseStart;
      LaunchpadProMK3.sendRGB(pad, c[0], c[1], c[2]);
    }
    for (let i = 0; i < fwdPads.length; i++) {
      const pad = fwdPads[i];
      const c = fwdBaseGrad[i] || fwdBaseStart;
      LaunchpadProMK3.sendRGB(pad, c[0], c[1], c[2]);
    }
    // Wire handlers: dynamic multiples of beatloop_size
    // Backward multipliers map (top->bottom of backPads): [1x, 4x, 8x]
    const performLoopMove = (group, beats) => {
      // Positive beats = forward, Negative = backward
      engine.setValue(group, "loop_move", beats);
    };
    const getLoopLen = (group) => {
      const sz = engine.getValue(group, "beatloop_size");
      return Math.max(0.03125, sz || 0);
    };
    const backMultipliers = [1, 4, 8];
    for (let i = 0; i < backPads.length; i++) {
      const pad = backPads[i];
      const baseC = backBaseGrad[i] || backBaseStart;
      const pressC = backPressGrad[i] || LaunchpadProMK3.darkenRGBColour(baseC, 0.75);
      midi.makeInputHandler(0xB0, pad, (channel, control, value) => {
        if (LaunchpadProMK3.currentPage !== 1) return;
        const deckNow = LaunchpadProMK3.oneDeckCurrent || 1;
        const group = (LaunchpadProMK3.decks[deckNow] && LaunchpadProMK3.decks[deckNow].currentDeck) ? LaunchpadProMK3.decks[deckNow].currentDeck : ("[Channel" + deckNow + "]");
        if (value !== 0) {
          const beats = -backMultipliers[i] * getLoopLen(group);
          performLoopMove(group, beats);
          LaunchpadProMK3.sendRGB(pad, pressC[0], pressC[1], pressC[2]);
        } else {
          LaunchpadProMK3.sendRGB(pad, baseC[0], baseC[1], baseC[2]);
        }
      });
    }
    // Forward multipliers map (top->bottom of fwdPads): [8x, 4x, 1x]
    const fwdMultipliers = [8, 4, 1];
    for (let i = 0; i < fwdPads.length; i++) {
      const pad = fwdPads[i];
      const baseC = fwdBaseGrad[i] || fwdBaseStart;
      const pressC = fwdPressGrad[i] || LaunchpadProMK3.darkenRGBColour(baseC, 0.75);
      midi.makeInputHandler(0xB0, pad, (channel, control, value) => {
        if (LaunchpadProMK3.currentPage !== 1) return;
        const deckNow = LaunchpadProMK3.oneDeckCurrent || 1;
        const group = (LaunchpadProMK3.decks[deckNow] && LaunchpadProMK3.decks[deckNow].currentDeck) ? LaunchpadProMK3.decks[deckNow].currentDeck : ("[Channel" + deckNow + "]");
        if (value !== 0) {
          const beats = fwdMultipliers[i] * getLoopLen(group);
          performLoopMove(group, beats);
          LaunchpadProMK3.sendRGB(pad, pressC[0], pressC[1], pressC[2]);
        } else {
          LaunchpadProMK3.sendRGB(pad, baseC[0], baseC[1], baseC[2]);
        }
      });
    }

    // Bottom two pads per side: intro/outro markers near hotcue rows; paint as deck colour
    const selectedDeckGroup = `[Channel${selectedDeck}]`;
    const markerMapping = [
      { pad: leftMarkerPads[0], control: "intro_start_" },
      { pad: leftMarkerPads[1], control: "intro_end_" },
      { pad: rightMarkerPads[0], control: "outro_start_" },
      { pad: rightMarkerPads[1], control: "outro_end_" },
    ];
    const paintMarkerPad = (pad, controlBase) => {
      if (pad === undefined) return;
      const _ld = engine.getValue(selectedDeckGroup, "track_loaded");
      
      if (_ld === 1) {
        // track loaded - check if marker is set and use appropriate colors
        const markerSet = engine.getValue(selectedDeckGroup, `${controlBase}enabled`);
        if (markerSet === 1) {
          // marker is set - use full blue like trackWithIntroOutro
          LaunchpadProMK3.sendRGB(pad, 0x00, 0x00, 0xFF);
        } else {
          // no marker set - use black to indicate available
          LaunchpadProMK3.sendRGB(pad, 0x00, 0x00, 0x00);
        }
      } else {
        // track not loaded - use dimmed deck color
        const base = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.oneDeckUnloadedDimscale);
        LaunchpadProMK3.sendRGB(pad, base[0], base[1], base[2]);
      }
    };
    const wireMarkerPad = (pad, controlBase) => {
      if (pad === undefined) return;
      paintMarkerPad(pad, controlBase);
      midi.makeInputHandler(0xB0, pad, (channel, control, value) => {
        if (LaunchpadProMK3.currentPage !== 1) return;
        if (value !== 0) {
          if (LaunchpadProMK3.shiftHeld) {
            engine.setValue(selectedDeckGroup, `${controlBase}clear`, 1);
          } else {
            engine.setValue(selectedDeckGroup, `${controlBase}activate`, 1);
          }
          // repaint after action
          paintMarkerPad(pad, controlBase);
        }
      });
    };
    for (const m of markerMapping) {
      if (m.pad !== undefined) wireMarkerPad(m.pad, m.control);
    }
    
    // Light up all row0 pads with the active deck's color
    LOG.debug("updateOneDeckPage: Setting row0 colors for deck " + C.O + selectedDeck, C.M);
    const activeDeckObj = LaunchpadProMK3.decks[selectedDeck];
    if (activeDeckObj && LaunchpadProMK3.row0) {
      const activeDeckColor = LaunchpadProMK3.hexToRGB(activeDeckObj.deckColour || 0xFFFFFF);
      let [r, g, b] = activeDeckColor;
      
      // Make row0 pads bright to indicate active deck
      r = Math.min(255, r * 1.2);
      g = Math.min(255, g * 1.2);
      b = Math.min(255, b * 1.2);
      
      LOG.debug("updateOneDeckPage: row0 RGB values: " + C.O + r + "," + g + "," + b, C.M);
      
      for (let i = 0; i < LaunchpadProMK3.row0.length; i++) {
        // Preserve special controls on row 0:
        // - row0[0], row0[1]: brightness controls
        // - row0[2], row0[3]: hotcue color switching (prev/next)
        // - row0[7]: effects toggle (all FX)
        if (i === 0 || i === 1 || i === 2 || i === 3 || i === 7) continue;
        const padAddress = LaunchpadProMK3.row0[i];
        LaunchpadProMK3.sendRGB(padAddress, r, g, b);
        LOG.debug("updateOneDeckPage: Set row0 pad " + C.O + padAddress + C.RE + " to RGB(" + r + "," + g + "," + b + ")", C.M);
      }
      // Override the first two pads with mode button LEDs
      LaunchpadProMK3.updateOneDeckModeButtons();
      // Reinforce hotcue color switch indicators on pads 3 and 4
      try {
        if (LaunchpadProMK3.row0 && LaunchpadProMK3.row0[2] !== undefined && LaunchpadProMK3.row0[3] !== undefined) {
          LaunchpadProMK3.sendRGB(LaunchpadProMK3.row0[2], 0x7F, 0x00, 0x00); // prev = red
          LaunchpadProMK3.sendRGB(LaunchpadProMK3.row0[3], 0x00, 0x7F, 0x00); // next = green
        }
      } catch (e) {}
      // Handlers for row0[0]/[1] are already attached in initExtras(); no need to reattach here
      // Setup and paint loop mode switch on row0[5] (SET) and row0[6] (ROLL)
      try { LaunchpadProMK3.setupRow0LoopModeSwitch(); } catch (e) { DEBUG("setupRow0LoopModeSwitch exception: " + e, C.Y); }
      
      LOG.debug("updateOneDeckPage: row0 pads lit with active deck " + C.O + selectedDeck + C.RE + " color", C.G);
    } else {
      LOG.debug("updateOneDeckPage: Could not set row0 colors - activeDeckObj=" + C.O + !!activeDeckObj + C.RE + " row0=" + C.O + !!LaunchpadProMK3.row0, C.Y);
    }
    
  }
  LOG.debug("### end updateOneDeckPage", 1, 2, null, C.R);
};
/**
 * update loop LED lighting for one-deck page
 * highlights active loops and rolls on rows 3-6
 * @returns {void}
 */
LaunchpadProMK3.updateOneDeckLoopLighting = function () {
  try {
    // Only paint when on One-Deck page
    if (LaunchpadProMK3.currentPage !== 1) { return; }

    // Determine selected deck and its colour
    const selectedDeck = LaunchpadProMK3.oneDeckCurrent || 1;
    const deckObj = (LaunchpadProMK3.decks && LaunchpadProMK3.decks[selectedDeck]) ? LaunchpadProMK3.decks[selectedDeck] : null;
    const deckColour = deckObj && deckObj.deckColour ? deckObj.deckColour : 0xFFFFFF;
    const deckRgb = LaunchpadProMK3.hexToRGB(deckColour);

    // Rows 1–4 contain loop pads on One-Deck page
    // Apply REVERSE loop gradient to rows 1–2 (top) and FORWARD loop gradient to rows 3–4 (bottom)
    const loopPadsReverse = LaunchpadProMK3.getMainGridPadAddressesForRows([1, 2]);
    const loopPadsForward = LaunchpadProMK3.getMainGridPadAddressesForRows([3, 4]);

    // Reverse loops (page 5 palette): ochre to plum-red
    const palRev = LaunchpadProMK3.getLoopGradientPalette(deckRgb, 5);
    const gradStartA_Rev = palRev.gradStartA;
    const gradEndA_Rev   = palRev.gradEndA;
    const gradStartB_Rev = palRev.gradStartB;
    const gradEndB_Rev   = palRev.gradEndB;
    LaunchpadProMK3.applySplitGradientToSpecificPads(selectedDeck, loopPadsReverse, gradStartA_Rev, gradEndA_Rev, gradStartB_Rev, gradEndB_Rev);

    // Forward loops (page 1 palette): aqua to blue-violet
    const palFwd = LaunchpadProMK3.getLoopGradientPalette(deckRgb, 1);
    const gradStartA_Fwd = palFwd.gradStartA;
    const gradEndA_Fwd   = palFwd.gradEndA;
    const gradStartB_Fwd = palFwd.gradStartB;
    const gradEndB_Fwd   = palFwd.gradEndB;
    LaunchpadProMK3.applySplitGradientToSpecificPads(selectedDeck, loopPadsForward, gradStartA_Fwd, gradEndA_Fwd, gradStartB_Fwd, gradEndB_Fwd);

    // Overlay green LED on the active persistent loop pad
    try {
      // Prefer active roll if present, else persistent loop
      const rollRec = LaunchpadProMK3.oneDeckActiveRollByDeck && LaunchpadProMK3.oneDeckActiveRollByDeck[selectedDeck];
      if (rollRec && rollRec.pad) {
        LaunchpadProMK3.sendRGB(rollRec.pad, 0x00, 0xFF, 0x00);
      } else {
        const pad = LaunchpadProMK3.oneDeckActiveLoopPad;
        if (pad) {
          const ch = "[Channel" + selectedDeck + "]";
          if (engine.getValue(ch, "loop_enabled") === 1) {
            LaunchpadProMK3.sendRGB(pad, 0x00, 0xFF, 0x00);
          } else {
            LaunchpadProMK3.oneDeckActiveLoopPad = null; // loop no longer active
          }
        }
      }
    } catch (e) { DEBUG("updateOneDeckLoopLighting: overlay exception: " + e, C.Y); }
  } catch (e) {
    LOG.debug("updateOneDeckLoopLighting exception: " + e, C.R);
  }
};

/**
 * request LED refresh for loop-related pages
 * targeted refresh called by event handlers and timers
 * @param {number|string} pageType - 1/'oneDeck' for one-deck, 4/5 for loop pages
 * @returns {void}
 */
LaunchpadProMK3.requestLoopLEDRefresh = function (pageType) {
  try {
    if (pageType === 1 || pageType === "oneDeck") {
      return LaunchpadProMK3.updateOneDeckLoopLighting();
    }
    if (pageType === 4 || pageType === 5) {
      return LaunchpadProMK3.updateLoopPagesActiveOverlay();
    }
  } catch (e) { DEBUG("requestLoopLEDRefresh exception: " + e, C.R); }
};

/**
 * overlay green LEDs on active loop pads for pages 4/5
 * highlights which loop is currently active per deck
 * @returns {void}
 */
LaunchpadProMK3.updateLoopPagesActiveOverlay = function () {
  try {
    if (LaunchpadProMK3.currentPage !== 4 && LaunchpadProMK3.currentPage !== 5) return;
    for (let deck = 1; deck <= LaunchpadProMK3.totalDecks; deck += 1) {
      let activePad = null;
      const ch = "[Channel" + deck + "]";
      // only overlay for loaded decks
      if (engine.getValue(ch, "track_loaded") !== 1) { continue; }
      // Prefer active roll if present
      const rollRec = LaunchpadProMK3.oneDeckActiveRollByDeck && LaunchpadProMK3.oneDeckActiveRollByDeck[deck];
      if (rollRec && rollRec.pad) {
        activePad = rollRec.pad;
      } else {
        const loopPad = LaunchpadProMK3.loopActivePadByDeck && LaunchpadProMK3.loopActivePadByDeck[deck];
        if (loopPad) {
          if (engine.getValue(ch, "loop_enabled") === 1) {
            activePad = loopPad;
          } else {
            // Clear latch if loop is no longer enabled
            LaunchpadProMK3.loopActivePadByDeck[deck] = null;
          }
        }
      }
      if (activePad) {
        LaunchpadProMK3.sendRGB(activePad, 0x00, 0xFF, 0x00);
      }
    }
  } catch (e) { DEBUG("updateLoopPagesActiveOverlay exception: " + e, C.Y); }
};

/**
 * setup row1 deck selection buttons for one-deck page
 * selected deck is bright, others are dimmed
 * @param {number} selectedDeck - currently selected deck (1-4)
 * @returns {void}
 */
LaunchpadProMK3.setupOneDeckRow1DeckButtons = function(selectedDeck) {
  try {
    const row1 = LaunchpadProMK3.row1 || [0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x6B, 0x6C];
    const orders = [1, 2, 3, 4]; // physical order mapping across pads 1-4
    for (let i = 0; i < 4; i++) {
      const padAddress = row1[i];
      if (padAddress === undefined || padAddress === null) continue;
      const deckStr = LaunchpadProMK3.getDeckFromOrder(orders[i]);
      const deck = parseInt(deckStr, 10);
      if (isNaN(deck)) continue;
      const cfg = LaunchpadProMK3.deck && LaunchpadProMK3.deck.config ? LaunchpadProMK3.deck.config[deck] : null;
      const baseRgb = LaunchpadProMK3.hexToRGB((cfg && cfg.colour) ? cfg.colour : 0xFFFFFF);
      let r = baseRgb[0], g = baseRgb[1], b = baseRgb[2];
      if (deck === selectedDeck) {
        r = Math.min(255, Math.floor(r * 1.3));
        g = Math.min(255, Math.floor(g * 1.3));
        b = Math.min(255, Math.floor(b * 1.3));
      } else {
        r = Math.max(0, Math.floor(r * 0.6));
        g = Math.max(0, Math.floor(g * 0.6));
        b = Math.max(0, Math.floor(b * 0.6));
      }
      LaunchpadProMK3.sendRGB(padAddress, r, g, b);
    }
  } catch (e) {
    LOG.debug("setupOneDeckRow1DeckButtons exception: " + e, C.Y);
  }
};

// Setup beatjump lighting for One Deck page rows 5-6 (positions 32-47)
LaunchpadProMK3.setupOneDeckBeatjumpLighting = function(selectedDeck) {
  const deckObj = LaunchpadProMK3.decks[selectedDeck];
  if (!deckObj) return;
  
  const deckColour = deckObj.deckColour || 0xFFFFFF;
  const deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
  const channel = `[Channel${selectedDeck}]`;
  const deckLoaded = engine.getValue(channel, "track_loaded");
  
  // Use the same gradient setup as beatjump page (page 1)
  let gradStartA = [127, 20, 20];  // Red-ish start
  let gradEndA = deckRgb;          // Fade to deck color
  let gradStartB = [20, 20, 127];  // Blue-ish start  
  let gradEndB = deckRgb;          // Fade to deck color
  
  // Calculate gradient for 16 positions (8 forward + 8 backward)
  const gradLength = 8;
  const gradA = LaunchpadProMK3.gradientCalculate(gradStartA, gradEndA, gradLength);
  const gradB = LaunchpadProMK3.gradientCalculate(gradStartB, gradEndB, gradLength);
  const gradBoth = gradA.concat(gradB);
  
  LOG.debug("setupOneDeckBeatjumpLighting: selected deck " + C.O + selectedDeck + C.RE + "   deckRgb " + C.O + deckRgb + C.RE + "   gradBoth.length " + C.O + gradBoth.length, C.G);
  
  // Apply gradient to positions 32-47 (rows 5-6)
  for (let i = 0; i < 16; i++) {
    const gridPosition = 32 + i; // positions 32-47
    const padAddress = LaunchpadProMK3.mainpadAddresses[gridPosition];
    const beatjumpControl = LaunchpadProMK3.beatjumpControls[i];
    
    if (beatjumpControl && padAddress && gradBoth[i]) {
      let toSend = gradBoth[i];
      
      // Adjust brightness based on deck loaded status
      if (deckLoaded !== 1) {
        let dimRatio = LaunchpadProMK3.deckUnloadedDimscale;
        try {
          if (LaunchpadProMK3.currentPage === 1 && selectedDeck === (LaunchpadProMK3.oneDeckCurrent || 1)) {
            dimRatio = LaunchpadProMK3.oneDeckUnloadedDimscale;
          }
        } catch (e) {}
        toSend = LaunchpadProMK3.darkenRGBColour(toSend, dimRatio);
      }
      
      const [r, g, b] = toSend;
      LaunchpadProMK3.sendRGB(padAddress, r, g, b);
      
      LOG.debug("setupOneDeckBeatjumpLighting: pad " + C.O + padAddress + C.RE + " (pos " + C.O + gridPosition + C.RE + ") -> " + C.O + beatjumpControl + C.RE + " RGB(" + r + "," + g + "," + b + ")", C.M);
    }
  }
  
  // Set up beatjump LED flashing for One Deck page
  LaunchpadProMK3.setupBeatjumpFlashing(selectedDeck);
};



LaunchpadProMK3.beatjumpControls = [
  //"beatjump",
  // MARK: P1 BEATJUMPCONTROLS()
  // jump forward (positive) or backward (negative) by N beats. if a loop is active, the loop is moved by X beats

  //"beatjump_size",
  // Set the number of beats to jump with beatloop_activate / beatjump_forward / beatjump_backward
  //"beatjump_size_halve",
  // Halve the value of beatjump_size
  //"beatjump_size_double",
  // Double the value of beatjump_size

  //"beatjump_backward"
  // Jump backward by beatjump_size. If a loop is active, the loop is moved backward by X beats
  //"beatjump_forward",
  // Jump forward by beatjump_size. If a loop is active, the loop is moved forward by X beats

  //"beatjump_X_backward",0
  // Jump backward by X beats. If a loop is active, the loop is moved backward by X beats
  //"beatjump_X_forward",
  // Jump forward by X beats. If a loop is active, the loop is moved forward by X beats.
  // control exists for X = 0.03125, 0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512.
  "beatjump_128_backward",
  "beatjump_64_backward",
  "beatjump_32_backward",
  "beatjump_16_backward",


  "beatjump_8_backward",
  "beatjump_4_backward",
  "beatjump_2_backward",
  "beatjump_1_backward",

  "beatjump_128_forward",
  "beatjump_64_forward",
  "beatjump_32_forward",
  "beatjump_16_forward",

  "beatjump_8_forward",
  "beatjump_4_forward",
  "beatjump_2_forward",
  "beatjump_1_forward",
];



// MARK: P2 UPDATEBEATJUMPPAGE()
// function to update beatjump page
LaunchpadProMK3.updateBeatjumpPage = function () {
  if (LaunchpadProMK3.currentPage === 2) {
    LOG.debug("  ", 2, 0, null, C.RE);
    LOG.debug(" ▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄  ▄▄       ▄▄ ", C.M);
    LOG.debug("▐░░░░░░░░░░▌ ▐░░░░░░░░░░░▌▐░░▌     ▐░░▌", C.M);
    LOG.debug("▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░▌░▌   ▐░▐░▌", C.M);
    LOG.debug("▐░▌       ▐░▌▐░▌       ▐░▌▐░▌▐░▌ ▐░▌▐░▌", C.M);
    LOG.debug("▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌▐░▌ ▐░▐░▌ ▐░▌", C.M);
    LOG.debug("▐░░░░░░░░░░▌ ▐░░░░░░░░░░░▌▐░▌  ▐░▌  ▐░▌", C.M);
    LOG.debug("▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░▌   ▀   ▐░▌", C.M);
    LOG.debug("▐░▌       ▐░▌▐░▌          ▐░▌       ▐░▌", C.M);
    LOG.debug("▐░█▄▄▄▄▄▄▄█░▌▐░▌          ▐░▌       ▐░▌", C.M);
    LOG.debug("▐░░░░░░░░░░▌ ▐░▌          ▐░▌       ▐░▌", C.M);
    LOG.debug(" ▀▀▀▀▀▀▀▀▀▀   ▀            ▀         ▀ ", C.M);
    LOG.debug("  ");
    LOG.debug("updateBeatjumpPage()", 0, 1, null, C.G);

    LaunchpadProMK3.clearMain();
    
    // Set up sidepads with deck colors and beat flashing
    for (let deckNum = 1; deckNum <= LaunchpadProMK3.totalDecks; deckNum += 1) {
      // Set deck colors on sidepads
      LaunchpadProMK3.sidepadDeckColour(deckNum);
      
      // Set up beat flashing for sidepads
      LaunchpadProMK3.setupSidepadBeatFlashing(deckNum);
      
      // Set up main grid gradients
      let deckColour = LaunchpadProMK3.decks[deckNum].deckColour;
      let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
      let gradStartA = [127, 20, 20];
      let gradEndA = deckRgb;
      let gradStartB = [20, 20, 127];
      let gradEndB = deckRgb;
      LaunchpadProMK3.gradientSetup(deckNum, undefined, gradStartA, gradEndA, gradStartB, gradEndB);
      
      // Set up beatjump LED flashing
      LaunchpadProMK3.setupBeatjumpFlashing(deckNum);
    };
  }
};




/// third page (2)


// MARK: P2 BPMRESETTODECK()
// change all main pads to deck colours
LaunchpadProMK3.bpmResetToDeck = function (deckNum) {
  //// main pads
  LOG.debug("bpmResetToDeck(" + C.O + deckNum + C.G + "): resetting main pads to deck colour", C.G);
  let order = LaunchpadProMK3.deck.config[deckNum].order
  let pads = LaunchpadProMK3.decks[deckNum].pads
  let deckColour = LaunchpadProMK3.decks[deckNum].deckColour
  let deckRgb = LaunchpadProMK3.hexToRGB(deckColour)
  LOG.debug("bpmResetToDeck(" + C.O + deckNum + C.RE + "): pads " + C.O + pads, C.O);
  LOG.debug("bpmResetToDeck(" + C.O + deckNum + C.RE + "): order " + C.O + order)
  LOG.debug("bpmResetToDeck(" + C.O + deckNum + C.RE + "): deckColour " + C.O + "#" + deckColour.toString(16))
  LOG.debug("bpmResetToDeck(" + C.O + deckNum + C.RE + "): deckRgb " + C.O + deckRgb)

  let deckLoaded = engine.getValue(`[Channel${deckNum}]`, "track_loaded");
  deckRgb = (deckLoaded === 1)
    ? LaunchpadProMK3.dimForState(deckRgb, 'active')
    : LaunchpadProMK3.dimForState(deckRgb, 'unloaded');
  pads.forEach((pad) => {
    LaunchpadProMK3.sendRGB(pad, deckRgb[0], deckRgb[1], deckRgb[2]);
  })
  LOG.debug("bpmResetToDeck(" + C.O + deckNum + C.R + "): end resetting main pads to deck colour", C.R);
}
// }

// change all main pads to bpm scale column colours
// MARK: P2 BPMRESETTOBPM()
// LaunchpadProMK3.bpmResetToBpm = function (deckNum) {
//   if (deckNum) {
//     DEBUG("bpmResetToBpm: resetting main pads of deck " + C.R + deckNum + C.G + " to bpm scale column colour", C.G, 1);
//     let pads = LaunchpadProMK3.decks[deckNum].pads;
//     let columnCount = 0;
//     for (let pad of pads) {
//       let scaleColour = LaunchpadProMK3.bpmScaleColumns[columnCount % LaunchpadProMK3.bpmScaleColumns.length].colour;
//       let scaleRgb = LaunchpadProMK3.hexToRGB(scaleColour);
//       DEBUG("bpmResetToBpm: columnCount " + C.O + columnCount + C.RE + "   pad " + C.O + pad + C.RE + "   scaleColour " + C.O + "#" + scaleColour.toString(16) + C.RE + "   scaleRgb " + C.O + scaleRgb);
//       LaunchpadProMK3.sendRGB(pad, scaleRgb[0], scaleRgb[1], scaleRgb[2]);
//       columnCount = columnCount + 1;
//       if (columnCount === 8) columnCount = 0;
//     }
//     DEBUG("bpmResetToBpm: end resetting loaded deck main pads to bpm colour", C.R, 0, 1);
//   };
// }


// MARK: P2 BPMRESETTOBPM()
LaunchpadProMK3.bpmResetToBpm = function (deckNum) {
  if (deckNum) {
  LOG.debug("bpmResetToBpm: Deck " + C.R + deckNum + C.G + ": Even rows use scale colors; odd rows use deck color.", 1, 0, null, C.G);
    let pads = LaunchpadProMK3.decks[deckNum].pads;
    let columnCount = 0; // To determine which of the 8 bpmScaleColumns colors to use
    let deckColourHex = LaunchpadProMK3.decks[deckNum].deckColour;
    let deckRgb = LaunchpadProMK3.hexToRGB(deckColourHex);

    for (let pad of pads) {
      // Determine the color from bpmScaleColumns based on the current column of the pad
      let scaleColumnColourHex = LaunchpadProMK3.bpmScaleColumns[columnCount % LaunchpadProMK3.bpmScaleColumns.length].colour;
      let scaleColumnRgb = LaunchpadProMK3.hexToRGB(scaleColumnColourHex);

      // Determine the row index (1-indexed from bottom, e.g., bottom hardware row is 1, top is 8)
      // This assumes pads are numbered 11-18 (row 1), 21-28 (row 2), ..., 81-88 (row 8)
      let rowIndexOneBased = Math.floor(pad / 10);

      let debugMsg = "bpmResetToBpm: Pad " + C.O + pad + C.RE +
                     " (col " + C.O + columnCount + C.RE + ", row " + C.O + rowIndexOneBased + C.RE + ") " +
                     "scale #" + C.O + scaleColumnColourHex.toString(16) + C.RE +
                     ", deck #" + C.O + deckColourHex.toString(16) + C.RE;

      if (rowIndexOneBased % 2 === 0) { // If the row index (1-based from bottom) is even
        // Even row: Use the color from bpmScaleColumns corresponding to the pad's column
        LaunchpadProMK3.sendRGB(pad, scaleColumnRgb[0], scaleColumnRgb[1], scaleColumnRgb[2]);
        LOG.debug(debugMsg + " -> EVEN row, using scaleColor", C.P, 2);
      } else {
        // Odd row: Use the default deck color
        LaunchpadProMK3.sendRGB(pad, deckRgb[0], deckRgb[1], deckRgb[2]);
        LOG.debug(debugMsg + " -> ODD row, using deckColor", C.P, 2);
      }
      
      columnCount = columnCount + 1;
      if (columnCount === 8) { // After processing 8 columns, reset for the next conceptual row of pads
        columnCount = 0;
      }
    }
    LOG.debug("bpmResetToBpm: finished processing pads for deck " + C.R + deckNum, 0, 1, null, C.R);
  };
}




// MARK: P3 UPDATEBPMSCALEPAGE()
// function to update bpm scale page
LaunchpadProMK3.updateBpmScalePage = function () {
    if (LaunchpadProMK3.currentPage === 3) {
    LOG.debug("  ");
    LOG.debug("                              .o8                .                                                               .oooo.    ", C.M);
    LOG.debug("                             '888              .o8                                                             .dP''Y88b   ", C.M);
    LOG.debug("  oooo  ooo. .oo.oooos.   .oooo888   .oooo.   .o888oo  .ooooo.     oo.ooooo.   .oooo.    .oooooooo  .ooooo.           ]8P' ", C.M);
    LOG.debug(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b     888' `88b `P  )88b  888' `88b  d88' `88b        .d8P'   ", C.M);
    LOG.debug("  888   888   888   888 888   888   .oP'888    888   888ooo888     888   888  .oP'888  888   888  888ooo888      .dP'      ", C.M);
    LOG.debug("  888   888   888   888 888   888  d8(  888    888 . 888    .o     888   888 d8(  888  `88bod8P'  888    .o    .oP         ", C.M);
    LOG.debug("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'     888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'    `8bd888P'   ", C.M);
    LOG.debug("              888                                                  888                 d'     YD                           ", C.M);
    LOG.debug("             o888o                                                o888o                 'Y88888P'                          ", C.M);
    LOG.debug("  ");
    LOG.debug("updateBpmScalePage()", C.G);
    LaunchpadProMK3.clearMain();

    // initialize arrays for BPM scaling
    LaunchpadProMK3.beatConnections = [];

    // Process all decks in a single loop for better performance
    for (let deckNum = 1; deckNum <= LaunchpadProMK3.totalDecks; deckNum++) {
      LOG.debug("updateBpmScalePage(" + C.O + deckNum + C.G + "): ######### deckNum " + C.R + deckNum, 2, 0, null, C.G);
      LaunchpadProMK3.sidepadDeckColour(deckNum);
      
      // Set up beat flashing for sidepads
      LaunchpadProMK3.setupSidepadBeatFlashing(deckNum);
      
      // Cache channel string to avoid repeated string concatenation
      const channel = `[Channel${deckNum}]`;
      // Get all needed engine values in one batch
      const bpm = engine.getValue(channel, "bpm");
      const isPlaying = bpm > 0 ? engine.getValue(channel, "play") : 0;

      // LaunchpadProMK3.bpmResetToDeck(deckNum);
      LaunchpadProMK3.setupScaledBeatConnections(deckNum);
      
      if (bpm > 0) {
        LOG.debug("updateBpmScalePage(" + C.O + deckNum + C.G + "): yep it's loaded, resetting to bpm scale colour", C.G, 1);
        // reset to BPM scale color
        LaunchpadProMK3.bpmResetToBpm(deckNum);
        // get first pad for this deck
        const firstPad = LaunchpadProMK3.decks[deckNum].padsFirst;
        LOG.debug("updateBpmScalePage(" + C.O + deckNum + C.G + "): firstPad " + C.R + firstPad, 1, 0, null, C.G);
      } else {
        LOG.debug("updateBpmScalePage(" + C.O + deckNum + C.G + "): nope it's not loaded, resetting to deck colour", C.G, 1);
        LaunchpadProMK3.bpmResetToDeck(deckNum);
      }
    }
  }
}
LOG.debug("updateBpmScalePage: ## end of bpm scaling loop", C.R);


// MARK: ISSCALEDBEATACTIVE()
LaunchpadProMK3.isScaledBeatActive = function (deck, speedup) {
  // Get the current beat distance
  let distance = engine.getParameter("[Channel" + deck + "]", "beat_distance");
  // Apply the speedup factor and take modulo 1 to keep it in the 0-1 range
  let scaledDistance = (distance * speedup) % 1;
  // Return true if the beat is active (using the same logic as beat_active)
  // beat_active is essentially equivalent to distance <= 0.2 || distance >= 0.8
  return scaledDistance <= 0.2 || scaledDistance >= 0.8;
}


// MARK: SETUPSCALEDBEATCONNECTIONS()
LaunchpadProMK3.setupScaledBeatConnections = function (deckNum) {
  LOG.debug("setupScaledBeatConnections(" + C.O + deckNum + C.G + ")", 1, 0, null, C.G);
  if (!LaunchpadProMK3.decks[deckNum].scaledBeatConnection) {
    let channel = "[Channel" + deckNum + "]"; // Not strictly needed if using script.deckFromGroup

    LaunchpadProMK3.decks[deckNum].scaledBeatConnection = engine.makeConnection(
      channel,
      "beat_distance",

      function (value, group, control) {
        const deckNum = script.deckFromGroup(group); // CRITICAL: get deck for THIS event, assign to user-preferred 'deckNum'
        //DEBUG_SETUP_SCALED_BEAT("beat_distance raw: " + value.toFixed(3) + " for deck " + deckNum, C.P);

        // Check if track is loaded before proceeding
        const trackLoaded = engine.getValue(group, "track_loaded");
        if (trackLoaded !== 1) {
          return; // Don't update colors if track is not loaded
        }

        const numMasterDivisions = 12; 
        const numAnimationSteps = 4;   
        const ANIMATION_SCALED_BEATS_PER_STEP = 0.5; // Default: 1 scaled beat per animation step.
                                                   // Set to 2 for half speed (each step lasts 2 scaled beats).
                                                   // Set to 0.5 for double speed (each step lasts 0.5 scaled beats).

        // Graceful degradation: initialize tracking objects if they don't exist
        if (LaunchpadProMK3.lastQuantizedStep[deckNum] === undefined) {
            LaunchpadProMK3.lastQuantizedStep[deckNum] = -1;
        }
        if (LaunchpadProMK3.currentMainBeatCycle[deckNum] === undefined) {
            LaunchpadProMK3.currentMainBeatCycle[deckNum] = 0;
        }

        const currentQuantizedStepValue = Math.floor((value % 1.0) * numMasterDivisions);

        if ((LaunchpadProMK3.lastQuantizedStep[deckNum] === numMasterDivisions - 1 && currentQuantizedStepValue === 0) || LaunchpadProMK3.lastQuantizedStep[deckNum] === -1) {
            LaunchpadProMK3.currentMainBeatCycle[deckNum]++;
        }
        LaunchpadProMK3.lastQuantizedStep[deckNum] = currentQuantizedStepValue;

        const quantizedMainBeatDistance = LaunchpadProMK3.currentMainBeatCycle[deckNum] + (currentQuantizedStepValue / numMasterDivisions);

        const baseDeckRgbForAnim = LaunchpadProMK3.decks[deckNum].deckRgb; 
        const backgroundPadRgb = LaunchpadProMK3.darkenRGBColour(baseDeckRgbForAnim, 0.7);
        
        LaunchpadProMK3.bpmScaleColumns.forEach(column => {
          const scaleRgb = LaunchpadProMK3.hexToRGB(column.colour); 
          
          let topPad = LaunchpadProMK3.decks[deckNum].padsFirst + column.index -1; // User preferred name
          let bottomPad = topPad - 10; // User preferred name

          const totalScaledBeatProgress = quantizedMainBeatDistance * column.scale;
          let animationStep = Math.floor(totalScaledBeatProgress / ANIMATION_SCALED_BEATS_PER_STEP) % numAnimationSteps;
          
          const padStates = [
            { // State 0: Bottom Active, Top BG
              action: () => {
                LaunchpadProMK3.sendRGB(topPad, backgroundPadRgb[0], backgroundPadRgb[1], backgroundPadRgb[2]);
                LaunchpadProMK3.sendRGB(bottomPad, scaleRgb[0], scaleRgb[1], scaleRgb[2]); 
              }
            },
            { // State 1: Both Active
              action: () => {
                LaunchpadProMK3.sendRGB(topPad, backgroundPadRgb[0], backgroundPadRgb[1], backgroundPadRgb[2]);
                LaunchpadProMK3.sendRGB(bottomPad, backgroundPadRgb[0], backgroundPadRgb[1], backgroundPadRgb[2]);
                // LaunchpadProMK3.sendRGB(topPad, scaleRgb[0], scaleRgb[1], scaleRgb[2]);
                // LaunchpadProMK3.sendRGB(bottomPad, scaleRgb[0], scaleRgb[1], scaleRgb[2]);
              }
            },
            { // State 2: Top Active, Bottom BG
              action: () => {
                LaunchpadProMK3.sendRGB(topPad, scaleRgb[0], scaleRgb[1], scaleRgb[2]);
                LaunchpadProMK3.sendRGB(bottomPad, backgroundPadRgb[0], backgroundPadRgb[1], backgroundPadRgb[2]);
              }
            },
            { // State 3: Both BG (Reset)
              action: () => {
                LaunchpadProMK3.sendRGB(topPad, backgroundPadRgb[0], backgroundPadRgb[1], backgroundPadRgb[2]);
                LaunchpadProMK3.sendRGB(bottomPad, backgroundPadRgb[0], backgroundPadRgb[1], backgroundPadRgb[2]);
              }
            }
          ];

          if (padStates[animationStep]) {
            padStates[animationStep].action();
          } else {
            LaunchpadProMK3.sendRGB(bottomPad, backgroundPadRgb[0], backgroundPadRgb[1], backgroundPadRgb[2]);
            LaunchpadProMK3.sendRGB(topPad, backgroundPadRgb[0], backgroundPadRgb[1], backgroundPadRgb[2]);
          }
        });
      }
    );
  } else {
      LOG.debug("setupScaledBeatConnections: Connection already exists for deck " + deckNum, C.Y);
  }
};
LaunchpadProMK3.cleanupScaledBeatConnections = function (deckNum) {
  if (LaunchpadProMK3.decks[deckNum] && LaunchpadProMK3.decks[deckNum].scaledBeatConnection) {
    LaunchpadProMK3.decks[deckNum].scaledBeatConnection.disconnect();
    LaunchpadProMK3.decks[deckNum].scaledBeatConnection = null;
    LOG.debug("cleanupScaledBeatConnections(" + C.O + deckNum + C.G + "): cleaned up scaled beat connection for deck " + C.O + deckNum, C.G);
  }
}


// MARK: SETUPSIDEPADBEATFLASHING()
LaunchpadProMK3.setupSidepadBeatFlashing = function (deckNum) {
  LOG.debug("setupSidepadBeatFlashing(" + C.O + deckNum + C.G + ")", 1, 0, null, C.G);
  
  // Only set up if not already connected
  if (!LaunchpadProMK3.decks[deckNum].sidepadBeatConnection) {
    let channel = "[Channel" + deckNum + "]";
    let deckColour = LaunchpadProMK3.decks[deckNum].deckColour;
    let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
    
    // Get the sidepad addresses for this deck
    let deckSidepads = LaunchpadProMK3.decks[deckNum].deckSidepadAddresses;
    
    LaunchpadProMK3.decks[deckNum].sidepadBeatConnection = engine.makeConnection(
      channel,
      "beat_active",
      function (value, group, control) {
        // Only flash if we're on page 1 or 2
        if (LaunchpadProMK3.currentPage !== 1 && LaunchpadProMK3.currentPage !== 2) {
          return;
        }
        
        // Check if track is loaded and playing
        const trackLoaded = engine.getValue(group, "track_loaded");
        const isPlaying = engine.getValue(group, "play");
        
        if (trackLoaded !== 1 || isPlaying !== 1) {
          return;
        }
        
        // Flash all sidepads for this deck on beat
        deckSidepads.forEach((padAddress) => {
          if (value === 1) {
            // Beat is active - flash with darker color
            LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0x40); // Deep blue flash
          } else {
            // Beat is inactive - return to deck color
            LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0xFF);
          }
        });
      }
    );
    
    LOG.debug("setupSidepadBeatFlashing(" + C.O + deckNum + C.G + "): set up beat flashing for sidepads", C.G);
  } else {
    LOG.debug("setupSidepadBeatFlashing: Connection already exists for deck " + deckNum, C.Y);
  }
};


// MARK: CLEANUPSIDEPADBEATFLASHING()
LaunchpadProMK3.cleanupSidepadBeatFlashing = function (deckNum) {
  if (LaunchpadProMK3.decks[deckNum] && LaunchpadProMK3.decks[deckNum].sidepadBeatConnection) {
    LaunchpadProMK3.decks[deckNum].sidepadBeatConnection.disconnect();
    LaunchpadProMK3.decks[deckNum].sidepadBeatConnection = null;
    LOG.debug("cleanupSidepadBeatFlashing(" + C.O + deckNum + C.G + "): cleaned up sidepad beat connection for deck " + C.O + deckNum, C.G);
  }
}


/// Fourth page (3)

LaunchpadProMK3.loopControls = [
  //"beatloop_activate",
  // MARK: P3 LOOPCONTROLS()
  // set a loop that is beatloop_size beats long and enables the loop
  //"beatloop_X_activate",
  // Activates a loop over X beats.
  //"beatloop_X_toggle",
  // Toggles a loop over X beats

  //"beatlooproll_activate",
  // Activates a rolling loop over beatloop_size beats. Once disabled, playback
  // will resume where the track would have been if it had not entered the loop.
  // "beatlooproll_X_activate",
  // ctivates rolling loop over X beats. Once disabled, playback resumes where
  // the track would have been if it had not entered the loop. A control exists
  // for X = 0.03125, 0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512  "_1_activate",
  "1_activate",
  "2_activate",
  "4_activate",
  "8_activate",
  "16_activate",
  "32_activate",
  "64_activate",
  "128_activate"
];




/**
 * update page 4: forward loop page
 * MARK: p4 updateLoopPage()
 * displays beatloop controls for all decks
 * @returns {void}
 */
LaunchpadProMK3.updateLoopPage = function () {
  LOG.debug("updateLoopPage");
  // Only update the page if on the forward loop page (4)
  if (LaunchpadProMK3.currentPage === 4) {
    LOG.debug("");
    LOG.debug(" ▄            ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄ ", C.M);
    LOG.debug("▐░▌          ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌", C.M);
    LOG.debug("▐░▌          ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ", C.M);
    LOG.debug("▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌       ▐░▌▐░▌          ", C.M);
    LOG.debug("▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄▄▄ ", C.M);
    LOG.debug("▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌", C.M);
    LOG.debug("▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░█▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀█░▌", C.M);
    LOG.debug("▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌                    ▐░▌", C.M);
    LOG.debug("▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌▐░▌           ▄▄▄▄▄▄▄▄▄█░▌", C.M);
    LOG.debug("▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌          ▐░░░░░░░░░░░▌", C.M);
    LOG.debug(" ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀            ▀▀▀▀▀▀▀▀▀▀▀ ", C.M);
    LOG.debug("  ");
    LOG.debug("### updateLoopPage()", 0, 1, null, C.G);

    LaunchpadProMK3.clearMain();
    for (let deck = 1; deck <= LaunchpadProMK3.totalDecks; deck += 1) {
      let deckColour = LaunchpadProMK3.decks[deck].deckColour;
      let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
      LOG.debug("deck " + C.O + deck + C.RE + "   deckColour " + C.O + "#" + deckColour + C.RE + "   deckRgb " + C.O + deckRgb, C.G);

      // Forward loop pages: top half subtly cool to imply reverse option, bottom half towards deck colour for forward
      let pal = LaunchpadProMK3.getLoopGradientPalette(deckRgb, 4);
      let gradStartA = pal.gradStartA;
      let gradEndA   = pal.gradEndA;
      let gradStartB = pal.gradStartB;
      let gradEndB   = pal.gradEndB;

      LaunchpadProMK3.gradientSetup(deck, undefined, gradStartA, gradEndA, gradStartB, gradEndB);
      
      // Set up beat-synchronized dimming for specific loop sizes (4, 8, 16 beats)
      LaunchpadProMK3.setupLoopPagesFlashing(deck);
    };
    LOG.debug("updateLoopPage: end deck gradient creation", C.R);
    // Overlay active loop pads in green if any are latched
    LaunchpadProMK3.updateLoopPagesActiveOverlay();
  };
  LOG.debug("### end updateLoopPage", 1, 2, null, C.R);
};




/**
 * update page 5: reverse loop page
 * MARK: p5 updateReverseLoopPage()
 * displays reverse beatloop controls for all decks
 * @returns {void}
 */
LaunchpadProMK3.updateReverseLoopPage = function () {
  if (LaunchpadProMK3.currentPage === 5) {
    LOG.debug("  ");
    LOG.debug(" ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄               ▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄ ", C.M);
    LOG.debug("▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌             ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌", C.M);
    LOG.debug("▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀  ▐░▌           ▐░▌ ▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌", C.M);
    LOG.debug("▐░▌       ▐░▌▐░▌            ▐░▌         ▐░▌  ▐░▌          ▐░▌       ▐░▌", C.M);
    LOG.debug("▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄▄▄    ▐░▌       ▐░▌   ▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌", C.M);
    LOG.debug("▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌    ▐░▌     ▐░▌    ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌", C.M);
    LOG.debug("▐░█▀▀▀▀█░█▀▀ ▐░█▀▀▀▀▀▀▀▀▀      ▐░▌   ▐░▌     ▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀█░█▀▀ ", C.M);
    LOG.debug("▐░▌     ▐░▌  ▐░▌                ▐░▌ ▐░▌      ▐░▌          ▐░▌     ▐░▌  ", C.M);
    LOG.debug("▐░▌      ▐░▌ ▐░█▄▄▄▄▄▄▄▄▄        ▐░▐░▌       ▐░█▄▄▄▄▄▄▄▄▄ ▐░▌      ▐░▌ ", C.M);
    LOG.debug("▐░▌       ▐░▌▐░░░░░░░░░░░▌        ▐░▌        ▐░░░░░░░░░░░▌▐░▌       ▐░▌", C.M);
    LOG.debug(" ▀         ▀  ▀▀▀▀▀▀▀▀▀▀▀          ▀          ▀▀▀▀▀▀▀▀▀▀▀  ▀         ▀ ", C.M);
    LOG.debug("  ");
    LOG.debug("### updateReverseLoopPage()", 0, 1, null, C.G);

    // Set a flag so we know this page is active
    LaunchpadProMK3.reverseLoopPageActive = true;

    // Clear the main grid
    LaunchpadProMK3.clearMain();

    // Visuals: split gradient per deck; top half cool blue (reverse), bottom half purple→deck
    for (let deck = 1; deck <= LaunchpadProMK3.totalDecks; deck += 1) {
      let deckColour = LaunchpadProMK3.decks[deck].deckColour;
      let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
      // First half (top rows for this deck slice): blue-ish to subdued blue
      let pal = LaunchpadProMK3.getLoopGradientPalette(deckRgb, 5);
      let gradStartA = pal.gradStartA;
      let gradEndA   = pal.gradEndA;
      // Second half (bottom rows): purple accent to deck colour
      let gradStartB = pal.gradStartB;
      let gradEndB   = pal.gradEndB;
      LaunchpadProMK3.gradientSetup(deck, undefined, gradStartA, gradEndA, gradStartB, gradEndB);
      
      // Set up beat-synchronized dimming for specific loop sizes (4, 8, 16 beats)
      LaunchpadProMK3.setupLoopPagesFlashing(deck);
    }

    // Overlay active loop pads in green if any are latched
    LaunchpadProMK3.updateLoopPagesActiveOverlay();

    LOG.debug("### end updateReverseLoopPage", 1, 2, null, C.R);
  };
};


// LaunchpadProMK3.loopMoveControls = [
//   ///"loop_move",
//   // MARK: P5 LOOPMOVECONTROLS()
//   // move loop forward by X beats (positive) or backward by X beats (negative).
//   // If a saved loop is currently enabled, the modification is saved to the hotcue slot immediately.
//   //"loop_move_x_forward",
//   // Loop moves forward by X beats. If a saved loop is currently enabled, the modification is saved to the hotcue slot immediately.
//   //"loop_move_x_backward",
//   // Loop moves back by X beats. If a saved loop is currently enabled, the modification is saved to the hotcue slot immediately.
//   "loop_move_1_backward",
//   "loop_move_2_backward",
//   "loop_move_4_backward",
//   "loop_move_8_backward",
//   "loop_move_16_backward",
//   "loop_move_32_backward",
//   "loop_move_64_backward",
//   "loop_move_128_backward",

//   "loop_move_1_forward",
//   "loop_move_2_forward",
//   "loop_move_4_forward",
//   "loop_move_8_forward",
//   "loop_move_16_forward",
//   "loop_move_32_forward",
//   "loop_move_64_forward",
//   "loop_move_128_forward"
// ];



// Function to enable all effects in one go
// MARK: ENABLEALLEFFECTS()
LaunchpadProMK3.enableAllEffects = function() {
    // Graceful degradation: use common script function if available, otherwise fallback
    if (script && script.enableAllEffects) {
        script.enableAllEffects();
        return;
    }

    // Use default 4 EffectUnits (Mixxx 2.3 default); avoid querying controls
    const numUnits = 4;

    // Enable all units and all their slots
    for (let i = 1; i <= numUnits; i++) {
      const unitGroup = `[EffectRack1_EffectUnit${i}]`;
      engine.setValue(unitGroup, 'enabled', 1);

      const numSlots = engine.getValue(unitGroup, 'num_effectslots') || 3;
      for (let s = 1; s <= numSlots; s++) {
        const slotGroup = `[EffectRack1_EffectUnit${i}_Effect${s}]`;
        engine.setValue(slotGroup, 'enabled', 1);
      }
    }
};





/**
 * setup beat-synchronized flashing for page 0 sidepads
 * MARK: setupPage0SidepadFlashing()
 * flashes intro/outro marker pads on beat
 * @param {number} deckNum - deck number (1-4)
 * @returns {void}
 */
LaunchpadProMK3.setupPage0SidepadFlashing = function (deckNum) {
  LOG.debug("setupPage0SidepadFlashing(" + C.O + deckNum + C.G + ")", 1, 0, null, C.G);
  if (!LaunchpadProMK3.decks[deckNum].page0SidepadBeatConnections) {
    LaunchpadProMK3.decks[deckNum].page0SidepadBeatConnections = [];
  }
  let channel = "[Channel" + deckNum + "]";
  let deckColour = LaunchpadProMK3.decks[deckNum].deckColour;
  let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
  let deckSidepads = LaunchpadProMK3.decks[deckNum].deckSidepadAddresses;
  let sidepadNames = LaunchpadProMK3.sidepadNames;

  for (let i = 0; i < 4; i++) {
    // Clean up any existing connection for this sidepad
    if (LaunchpadProMK3.decks[deckNum].page0SidepadBeatConnections[i]) {
      LaunchpadProMK3.decks[deckNum].page0SidepadBeatConnections[i].disconnect();
      LaunchpadProMK3.decks[deckNum].page0SidepadBeatConnections[i] = null;
    }
    let padAddress = deckSidepads[i];
    let cueControl = sidepadNames[i] + "enabled";
    LaunchpadProMK3.decks[deckNum].page0SidepadBeatConnections[i] = engine.makeConnection(
      channel,
      "beat_active",
      function (value, group, control) {
        if (LaunchpadProMK3.currentPage !== 0) return;
        // Only flash if cue is enabled
        let cueEnabled = engine.getValue(channel, cueControl);
        if (cueEnabled !== 1) return;
        if (value === 1) {
          // On beat: darken
          let darkRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, 0.30); // Subtle dim (15% dimming)
          LaunchpadProMK3.sendRGB(padAddress, darkRgb[0], darkRgb[1], darkRgb[2]);
        } else {
          // Off beat: normal (blue for enabled, as in trackWithIntroOutro)
          LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0xFF);
        }
      }
    );
  }
};

/**
 * update page 6: loop move page
 * MARK: p6 updateLoopMovePage()
 * controls for moving loop position
 * @returns {void}
 */
LaunchpadProMK3.updateLoopMovePage = function () {
  if (LaunchpadProMK3.currentPage === 6) {
    LOG.debug("  ");
    LOG.debug(" ▄            ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄ ", C.M);
    LOG.debug("▐░▌          ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌", C.M);
    LOG.debug("▐░▌          ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌", C.M);
    LOG.debug("▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌       ▐░▌", C.M);
    LOG.debug("▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄█░▌", C.M);
    LOG.debug("▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░░░░░░░░░░░▌", C.M);
    LOG.debug("▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░█▀▀▀▀▀▀▀▀▀ ", C.M);
    LOG.debug("▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌          ", C.M);
    LOG.debug("▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌▐░▌          ", C.M);
    LOG.debug("▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌          ", C.M);
    LOG.debug(" ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀           ", C.M);
    LOG.debug("  ");
    LOG.debug("### updateLoopMovePage()", 0, 1, null, C.G);
    LaunchpadProMK3.clearMain();

    // Visuals: gradient per deck towards deck colour
    LaunchpadProMK3.forEachDeck((deckNum) => {
      let deckRgb = LaunchpadProMK3.hexToRGB(LaunchpadProMK3.decks[deckNum].deckColour);
      let pal = LaunchpadProMK3.getLoopGradientPalette(deckRgb, 6);
      let gradStartA = pal.gradStartA;
      let gradEndA   = pal.gradEndA;   // cool blue accent / per palette
      let gradStartB = pal.gradStartB;
      let gradEndB   = pal.gradEndB;
      LaunchpadProMK3.gradientSetup(deckNum, undefined, gradStartA, gradEndA, gradStartB, gradEndB);
    });
  }
};

/**
 * update page 7: loop resize page
 * MARK: p7 updateLoopResizePage()
 * controls for resizing active loops
 * @returns {void}
 */
LaunchpadProMK3.updateLoopResizePage = function () {
  if (LaunchpadProMK3.currentPage === 7) {
    LOG.debug("  ");
    LOG.debug(" ▄            ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄ ", C.M);
    LOG.debug("▐░▌          ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌", C.M);
    LOG.debug("▐░▌          ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌", C.M);
    LOG.debug("▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌       ▐░▌", C.M);
    LOG.debug("▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄█░▌", C.M);
    LOG.debug("▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░░░░░░░░░░░▌", C.M);
    LOG.debug("▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░█▀▀▀▀▀▀▀▀▀ ", C.M);
    LOG.debug("▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌          ", C.M);
    LOG.debug("▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌▐░▌          ", C.M);
    LOG.debug("▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌          ", C.M);
    LOG.debug(" ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀           ", C.M);
    LOG.debug("  ");
    LOG.debug("### updateLoopResizePage()", 0, 1, null, C.G);
    LaunchpadProMK3.clearMain();

    // Visuals: soft orange/purple blend towards deck colour
    LaunchpadProMK3.forEachDeck((deckNum) => {
      let deckRgb = LaunchpadProMK3.hexToRGB(LaunchpadProMK3.decks[deckNum].deckColour);
      let pal = LaunchpadProMK3.getLoopGradientPalette(deckRgb, 7);
      let gradStartA = pal.gradStartA; // warm orange / per palette
      let gradEndA   = pal.gradEndA;
      let gradStartB = pal.gradStartB;  // purple accent / per palette
      let gradEndB   = pal.gradEndB;
      LaunchpadProMK3.gradientSetup(deckNum, undefined, gradStartA, gradEndA, gradStartB, gradEndB);
    });
  }
};






/**
 * cleanup page 0 sidepad beat flashing connections
 * MARK: cleanupPage0SidepadFlashing()
 * @param {number} deckNum - deck number (1-4)
 * @returns {void}
 */
LaunchpadProMK3.cleanupPage0SidepadFlashing = function (deckNum) {
  if (LaunchpadProMK3.decks[deckNum] && LaunchpadProMK3.decks[deckNum].page0SidepadBeatConnections) {
    for (let i = 0; i < 4; i++) {
      if (LaunchpadProMK3.decks[deckNum].page0SidepadBeatConnections[i]) {
        LaunchpadProMK3.decks[deckNum].page0SidepadBeatConnections[i].disconnect();
        LaunchpadProMK3.decks[deckNum].page0SidepadBeatConnections[i] = null;
      }
    }
  }
}
/**
 * setup beat-synchronized flashing for beatjump page
 * MARK: setupBeatjumpFlashing()
 * @param {number} deckNum - deck number (1-4)
 * @returns {void}
 */
LaunchpadProMK3.setupBeatjumpFlashing = function (deckNum) {
  LOG.debug("setupBeatjumpFlashing(" + C.O + deckNum + C.G + ")", 1, 0, null, C.G);
  
  // Only set up if not already connected
  if (!LaunchpadProMK3.decks[deckNum].beatjumpBeatConnection) {
    let channel = "[Channel" + deckNum + "]";
    
    // Initialize beat counter for this deck
    if (!LaunchpadProMK3.decks[deckNum].beatjumpBeatCounter) {
      LaunchpadProMK3.decks[deckNum].beatjumpBeatCounter = 0;
    }
    
    // Store original colors for each pad to restore after flashing
    if (!LaunchpadProMK3.decks[deckNum].beatjumpOriginalColors) {
      LaunchpadProMK3.decks[deckNum].beatjumpOriginalColors = {};
    }
    
    LaunchpadProMK3.decks[deckNum].beatjumpBeatConnection = engine.makeConnection(
      channel,
      "beat_active",
      function (value, group, control) {
        // Only flash on pages 1 (one-deck mixed) or 2 (beatjump)
        if (LaunchpadProMK3.currentPage !== 1 && LaunchpadProMK3.currentPage !== 2) { return; }
        // On page 1, only flash for the currently selected deck
        if (LaunchpadProMK3.currentPage === 1 && LaunchpadProMK3.oneDeckCurrent && deckNum !== LaunchpadProMK3.oneDeckCurrent) { return; }
        
        // Check if track is loaded and playing
        const trackLoaded = engine.getValue(group, "track_loaded");
        const isPlaying = engine.getValue(group, "play");
        
        if (trackLoaded !== 1 || isPlaying !== 1) {
          return;
        }
        
        // Increment beat counter on each beat
        if (value === 1) {
          LaunchpadProMK3.decks[deckNum].beatjumpBeatCounter++;
          
          // For each pad, check if it should flash based on its beatjump amount
          const isOneDeckMixedPage = (LaunchpadProMK3.currentPage === 1);
          let pads = LaunchpadProMK3.decks[deckNum].pads;
          let targetCount = isOneDeckMixedPage ? 16 : (pads && Array.isArray(pads) ? pads.length : 0);
          for (let i = 0; i < targetCount; i++) {
            let padAddress = isOneDeckMixedPage ? LaunchpadProMK3.mainpadAddresses[32 + i] : pads[i];
            let beatjumpControl = LaunchpadProMK3.beatjumpControls[i];
            
            if (!beatjumpControl) {
              continue;
            }
            
            // Page 2: flash only top row of the deck slice; Page 1: flash both beatjump rows (32..47)
            if (!isOneDeckMixedPage) {
              let isTopRow = i >= pads.length - 8;
              if (!isTopRow) { continue; }
            }
            
            // Extract the beat amount from the control name (e.g., "beatjump_4_forward" -> 4)
            let beatAmount = 1; // default
            let match = beatjumpControl.match(/beatjump_(\d+)_/);
            if (match) {
              beatAmount = parseInt(match[1]);
            }
            
            // Check if current beat is a multiple of this pad's beat amount
            if (LaunchpadProMK3.decks[deckNum].beatjumpBeatCounter % beatAmount === 0) {
              // Store original color if not already stored
              if (!LaunchpadProMK3.decks[deckNum].beatjumpOriginalColors[padAddress]) {
                // Get current pad color from the gradient setup
                let deckColour = LaunchpadProMK3.decks[deckNum].deckColour;
                let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
                let gradStartA = [127, 20, 20];
                let gradEndA = deckRgb;
                let gradStartB = [20, 20, 127];
                let gradEndB = deckRgb;
                let gradLength = 8; // fixed to 8 per row
                let gradA = LaunchpadProMK3.gradientCalculate(gradStartA, gradEndA, gradLength);
                let gradB = LaunchpadProMK3.gradientCalculate(gradStartB, gradEndB, gradLength);
                let gradBoth = gradA.concat(gradB);
                let originalColor = gradBoth[i] || deckRgb;
                LaunchpadProMK3.decks[deckNum].beatjumpOriginalColors[padAddress] = originalColor;
              }
              
              // Flash the pad (darken it) - will stay dimmed until next beat
              let originalColor = LaunchpadProMK3.decks[deckNum].beatjumpOriginalColors[padAddress];
              
              // Check if this is the 16-beat pad on a 16-beat boundary for darker flash
              let is16BeatPadOn16Beat = (beatAmount === 16) && (LaunchpadProMK3.decks[deckNum].beatjumpBeatCounter % 16 === 0);
              let flashRatio = is16BeatPadOn16Beat ? 0.30 : 0.60; // Much darker only for 16-beat pad on 16-beat markers
              let flashColor = LaunchpadProMK3.darkenRGBColour(originalColor, flashRatio);
              LaunchpadProMK3.sendRGB(padAddress, flashColor[0], flashColor[1], flashColor[2]);
              
              let beatMarkerInfo = is16BeatPadOn16Beat ? " [16-BEAT PAD DARK FLASH]" : "";
              LOG.debug("setupBeatjumpFlashing: Deck " + C.O + deckNum + C.RE + " pad " + C.O + padAddress + C.RE + " flashing (beat " + C.O + LaunchpadProMK3.decks[deckNum].beatjumpBeatCounter + C.RE + " % " + C.O + beatAmount + C.RE + " = 0)" + beatMarkerInfo, C.G);
            } else {
              // Restore original color if this beat doesn't trigger a flash
              if (LaunchpadProMK3.decks[deckNum].beatjumpOriginalColors[padAddress]) {
                let originalColor = LaunchpadProMK3.decks[deckNum].beatjumpOriginalColors[padAddress];
                LaunchpadProMK3.sendRGB(padAddress, originalColor[0], originalColor[1], originalColor[2]);
              }
            }
          }
        }
        // Remove the else if (value === 0) block - no longer restore colors on beat end
      }
    );
    
    LOG.debug("setupBeatjumpFlashing(" + C.O + deckNum + C.G + "): set up beat flashing for beatjump page", C.G);
  } else {
    LOG.debug("setupBeatjumpFlashing: Connection already exists for deck " + deckNum, C.Y);
  }
};

/**
 * cleanup beatjump page beat flashing connections
 * MARK: cleanupBeatjumpFlashing()
 * @param {number} deckNum - deck number (1-4)
 * @returns {void}
 */
LaunchpadProMK3.cleanupBeatjumpFlashing = function (deckNum) {
  if (LaunchpadProMK3.decks[deckNum] && LaunchpadProMK3.decks[deckNum].beatjumpBeatConnection) {
    LaunchpadProMK3.decks[deckNum].beatjumpBeatConnection.disconnect();
    LaunchpadProMK3.decks[deckNum].beatjumpBeatConnection = null;
    LaunchpadProMK3.decks[deckNum].beatjumpBeatCounter = 0;
    LaunchpadProMK3.decks[deckNum].beatjumpOriginalColors = {};
    LOG.debug("cleanupBeatjumpFlashing(" + C.O + deckNum + C.G + "): cleaned up beatjump beat connection for deck " + C.O + deckNum, C.G);
  }
};


/**
 * setup beat-synchronized flashing for one-deck loop controls
 * MARK: setupOneDeckLoopFlashing()
 * @param {number} deckNum - deck number (1-4)
 * @returns {void}
 */
LaunchpadProMK3.setupOneDeckLoopFlashing = function (deckNum) {
  LOG.debug("setupOneDeckLoopFlashing(" + C.O + deckNum + C.G + ")", 1, 0, null, C.G);
  
  // Only set up if not already connected
  if (!LaunchpadProMK3.decks[deckNum].loopBeatConnection) {
    let channel = "[Channel" + deckNum + "]";
    
    // Initialize beat counter for this deck (separate from beatjump counter)
    if (!LaunchpadProMK3.decks[deckNum].loopBeatCounter) {
      LaunchpadProMK3.decks[deckNum].loopBeatCounter = 0;
    }
    
    // Store original colors for each pad to restore after flashing
    if (!LaunchpadProMK3.decks[deckNum].loopOriginalColors) {
      LaunchpadProMK3.decks[deckNum].loopOriginalColors = {};
    }
    
    LaunchpadProMK3.decks[deckNum].loopBeatConnection = engine.makeConnection(
      channel,
      "beat_active",
      function (value, group, control) {
        // Only flash on page 1 (one-deck mixed)
        if (LaunchpadProMK3.currentPage !== 1) { return; }
        // Only flash for the currently selected deck
        if (LaunchpadProMK3.oneDeckCurrent && deckNum !== LaunchpadProMK3.oneDeckCurrent) { return; }
        
        // Check if track is loaded and playing
        const trackLoaded = engine.getValue(group, "track_loaded");
        const isPlaying = engine.getValue(group, "play");
        
        if (trackLoaded !== 1 || isPlaying !== 1) {
          return;
        }
        
        // Increment beat counter on each beat
        if (value === 1) {
          LaunchpadProMK3.decks[deckNum].loopBeatCounter++;
          
          // Target loop lengths to flash: 4, 8, and 16 beats
          const targetLoopSizes = ["4", "8", "16"];
          const loopJumpSizes = LaunchpadProMK3.loopJumpSizes || [];
          
          // Process all 32 loop pads (rows 1-4, positions 0-31)
          for (let gridPosition = 0; gridPosition < 32; gridPosition++) {
            const padAddress = LaunchpadProMK3.mainpadAddresses[gridPosition];
            const rowIndex = Math.floor(gridPosition / 8);   // 0-3
            const colIndex = gridPosition % 8;               // 0-7
            
            // Use the same mapping logic as handleLoopControl
            const isReverse = (rowIndex >= 0 && rowIndex <= 1);
            const rowWithinDir = isReverse ? rowIndex : (rowIndex - 2);
            
            let sizeIndex;
            if (isReverse) {
              if (rowWithinDir === 0) {
                sizeIndex = 0 + colIndex;            // top outer row: 0..7 (large->small)
              } else {
                sizeIndex = 8 + (7 - colIndex);      // top inner row: 8..15, flipped so rightmost is largest
              }
            } else {
              if (rowWithinDir === 0) {
                sizeIndex = 8 + (7 - colIndex);      // bottom outer row: 8..15, flipped so rightmost is largest
              } else {
                sizeIndex = 0 + colIndex;            // bottom inner row: 0..7
              }
            }
            
            if (sizeIndex >= loopJumpSizes.length) continue;
            const loopSize = loopJumpSizes[sizeIndex];
            
            // Only flash target loop sizes (4, 8, 16 beats) and avoid duplicate positions
            if (!targetLoopSizes.includes(loopSize)) continue;
            
            // Skip duplicate "4" at index 8 - only use the one at index 7
            if (loopSize === "4" && sizeIndex === 8) continue;
            
            const beatAmount = parseInt(loopSize);
            if (isNaN(beatAmount)) continue;
            
            // Check if current beat is a multiple of this pad's beat amount
            if (LaunchpadProMK3.decks[deckNum].loopBeatCounter % beatAmount === 0) {
              // Store original color if not already stored
              if (!LaunchpadProMK3.decks[deckNum].loopOriginalColors[padAddress]) {
                // Get current pad color based on row (reverse vs forward gradients)
                const deckObj = LaunchpadProMK3.decks[deckNum];
                const deckColour = deckObj && deckObj.deckColour ? deckObj.deckColour : 0xFFFFFF;
                const deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
                
                let originalColor;
                if (rowIndex >= 0 && rowIndex <= 1) {
                  // Reverse loops (rows 1-2): use reverse palette
                  const palRev = LaunchpadProMK3.getLoopGradientPalette(deckRgb, 5);
                  const gradA = LaunchpadProMK3.gradientCalculate(palRev.gradStartA, palRev.gradEndA, 8);
                  const gradB = LaunchpadProMK3.gradientCalculate(palRev.gradStartB, palRev.gradEndB, 8);
                  const gradBoth = gradA.concat(gradB);
                  originalColor = gradBoth[gridPosition] || deckRgb;
                } else {
                  // Forward loops (rows 3-4): use forward palette
                  const palFwd = LaunchpadProMK3.getLoopGradientPalette(deckRgb, 1);
                  const gradA = LaunchpadProMK3.gradientCalculate(palFwd.gradStartA, palFwd.gradEndA, 8);
                  const gradB = LaunchpadProMK3.gradientCalculate(palFwd.gradStartB, palFwd.gradEndB, 8);
                  const gradBoth = gradA.concat(gradB);
                  originalColor = gradBoth[gridPosition - 16] || deckRgb;
                }
                LaunchpadProMK3.decks[deckNum].loopOriginalColors[padAddress] = originalColor;
              }
              
              // Flash the pad (darken it)
              let originalColor = LaunchpadProMK3.decks[deckNum].loopOriginalColors[padAddress];
              
              // Special handling for 16-beat pads on 16-beat boundaries (darker flash)
              let is16BeatPadOn16Beat = (beatAmount === 16) && (LaunchpadProMK3.decks[deckNum].loopBeatCounter % 16 === 0);
              let flashRatio = is16BeatPadOn16Beat ? 0.30 : 0.60; // Much darker only for 16-beat pad on 16-beat markers
              let flashColor = LaunchpadProMK3.darkenRGBColour(originalColor, flashRatio);
              LaunchpadProMK3.sendRGB(padAddress, flashColor[0], flashColor[1], flashColor[2]);
              
              let beatMarkerInfo = is16BeatPadOn16Beat ? " [16-BEAT PAD DARK FLASH]" : "";
              LOG.debug("setupOneDeckLoopFlashing: Deck " + C.O + deckNum + C.RE + " pad " + C.O + padAddress + C.RE + " (row " + rowIndex + " col " + colIndex + " sizeIndex " + sizeIndex + " size " + loopSize + " " + (isReverse ? "REVERSE" : "FORWARD") + ") flashing (beat " + C.O + LaunchpadProMK3.decks[deckNum].loopBeatCounter + C.RE + " % " + C.O + beatAmount + C.RE + " = 0)" + beatMarkerInfo, C.G);
            } else {
              // Restore original color if this beat doesn't trigger a flash
              if (LaunchpadProMK3.decks[deckNum].loopOriginalColors[padAddress]) {
                let originalColor = LaunchpadProMK3.decks[deckNum].loopOriginalColors[padAddress];
                LaunchpadProMK3.sendRGB(padAddress, originalColor[0], originalColor[1], originalColor[2]);
              }
            }
          }
        }
      }
    );
    
    LOG.debug("setupOneDeckLoopFlashing(" + C.O + deckNum + C.G + "): set up beat flashing for loop pads", C.G);
  } else {
    LOG.debug("setupOneDeckLoopFlashing: Connection already exists for deck " + deckNum, C.Y);
  }
};

/**
 * cleanup one-deck loop flashing connections
 * MARK: cleanupOneDeckLoopFlashing()
 * @param {number} deckNum - deck number (1-4)
 * @returns {void}
 */
LaunchpadProMK3.cleanupOneDeckLoopFlashing = function (deckNum) {
  if (LaunchpadProMK3.decks[deckNum] && LaunchpadProMK3.decks[deckNum].loopBeatConnection) {
    LaunchpadProMK3.decks[deckNum].loopBeatConnection.disconnect();
    LaunchpadProMK3.decks[deckNum].loopBeatConnection = null;
    LaunchpadProMK3.decks[deckNum].loopBeatCounter = 0;
    LaunchpadProMK3.decks[deckNum].loopOriginalColors = {};
    LOG.debug("cleanupOneDeckLoopFlashing(" + C.O + deckNum + C.G + "): cleaned up loop beat connection for deck " + C.O + deckNum, C.G);
  }
};

/**
 * setup beat-synchronized flashing for loop pages (4/5)
 * MARK: setupLoopPagesFlashing()
 * @param {number} deckNum - deck number (1-4)
 * @returns {void}
 */
LaunchpadProMK3.setupLoopPagesFlashing = function (deckNum) {
  LOG.debug("setupLoopPagesFlashing(" + C.O + deckNum + C.G + ")", 1, 0, null, C.G);
  
  // Only set up if not already connected
  if (!LaunchpadProMK3.decks[deckNum].loopPagesBeatConnection) {
    let channel = "[Channel" + deckNum + "]";
    
    // Initialize beat counter for this deck (separate from other counters)
    if (!LaunchpadProMK3.decks[deckNum].loopPagesBeatCounter) {
      LaunchpadProMK3.decks[deckNum].loopPagesBeatCounter = 0;
    }
    
    // Store original colors for each pad to restore after flashing
    if (!LaunchpadProMK3.decks[deckNum].loopPagesOriginalColors) {
      LaunchpadProMK3.decks[deckNum].loopPagesOriginalColors = {};
    }
    
    LaunchpadProMK3.decks[deckNum].loopPagesBeatConnection = engine.makeConnection(
      channel,
      "beat_active",
      function (value, group, control) {
        // Only flash on pages 4 (forward loops) or 5 (reverse loops)
        if (LaunchpadProMK3.currentPage !== 4 && LaunchpadProMK3.currentPage !== 5) { return; }
        
        // Check if track is loaded and playing
        const trackLoaded = engine.getValue(group, "track_loaded");
        const isPlaying = engine.getValue(group, "play");
        
        if (trackLoaded !== 1 || isPlaying !== 1) {
          return;
        }
        
        // Increment beat counter on each beat
        if (value === 1) {
          LaunchpadProMK3.decks[deckNum].loopPagesBeatCounter++;
          
          // Target loop lengths to flash: 4, 8, and 16 beats
          const targetLoopSizes = ["4", "8", "16"];
          const loopJumpSizes = LaunchpadProMK3.loopJumpSizes || [];
          
          // Get this deck's slice boundaries
          const deckSliceStart = LaunchpadProMK3.decks[deckNum].deckMainSliceStartIndex;
          if (typeof deckSliceStart !== 'number') return;
          
          // Process the 16 pads in this deck's slice
          for (let padIndexWithinSlice = 0; padIndexWithinSlice < 16; padIndexWithinSlice++) {
            const globalPadIndex = deckSliceStart + padIndexWithinSlice;
            const padAddress = LaunchpadProMK3.mainpadAddresses[globalPadIndex];
            const rowWithinSlice = Math.floor(padIndexWithinSlice / 8);   // 0-1 (top/bottom half)
            const colWithinSlice = padIndexWithinSlice % 8;               // 0-7 (left to right)
            
            // Determine if this is reverse or forward based on current page and row
            let isReverse;
            if (LaunchpadProMK3.currentPage === 5) {
              // Page 5: reverse loops
              isReverse = true;
            } else if (LaunchpadProMK3.currentPage === 4) {
              // Page 4: forward loops  
              isReverse = false;
            } else {
              continue; // shouldn't happen
            }
            
            // Map to size index using the same logic as handleLoopControl for non-oneDeck pages
            // Top half of slice = reverse (prefix 'r'), bottom half = forward
            // Columns map left→right to largest→smallest within the middle 8-size window
            const sizes = loopJumpSizes;
            let sizeIndex;
            
            if (rowWithinSlice === 0) {
              // Top half: columns 0..7 map to indices 0..7 (large to small)
              sizeIndex = colWithinSlice;
            } else {
              // Bottom half: columns 0..7 map to indices 8..15 (large to small, flipped)
              sizeIndex = 8 + (7 - colWithinSlice);
            }
            
            if (sizeIndex >= sizes.length) continue;
            const loopSize = sizes[sizeIndex];
            
            // Only flash target loop sizes (4, 8, 16 beats) and avoid duplicate positions
            if (!targetLoopSizes.includes(loopSize)) continue;
            
            // Skip duplicate "4" at index 8 - only use the one at index 7
            if (loopSize === "4" && sizeIndex === 8) continue;
            
            const beatAmount = parseInt(loopSize);
            if (isNaN(beatAmount)) continue;
            
            // Check if current beat is a multiple of this pad's beat amount
            if (LaunchpadProMK3.decks[deckNum].loopPagesBeatCounter % beatAmount === 0) {
              // Store original color if not already stored
              if (!LaunchpadProMK3.decks[deckNum].loopPagesOriginalColors[padAddress]) {
                // Get current pad color from the gradient
                const deckObj = LaunchpadProMK3.decks[deckNum];
                const deckColour = deckObj && deckObj.deckColour ? deckObj.deckColour : 0xFFFFFF;
                const deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
                
                // Use the appropriate gradient palette for this page
                const paletteType = (LaunchpadProMK3.currentPage === 4) ? 4 : 5; // forward or reverse
                const pal = LaunchpadProMK3.getLoopGradientPalette(deckRgb, paletteType);
                
                // Calculate gradient colors for this pad position
                const gradA = LaunchpadProMK3.gradientCalculate(pal.gradStartA, pal.gradEndA, 8);
                const gradB = LaunchpadProMK3.gradientCalculate(pal.gradStartB, pal.gradEndB, 8);
                const gradBoth = gradA.concat(gradB);
                const originalColor = gradBoth[padIndexWithinSlice] || deckRgb;
                
                LaunchpadProMK3.decks[deckNum].loopPagesOriginalColors[padAddress] = originalColor;
              }
              
              // Flash the pad (darken it)
              let originalColor = LaunchpadProMK3.decks[deckNum].loopPagesOriginalColors[padAddress];
              
              // Special handling for 16-beat pads on 16-beat boundaries (darker flash)
              let is16BeatPadOn16Beat = (beatAmount === 16) && (LaunchpadProMK3.decks[deckNum].loopPagesBeatCounter % 16 === 0);
              let flashRatio = is16BeatPadOn16Beat ? 0.30 : 0.60; // Much darker only for 16-beat pad on 16-beat markers
              let flashColor = LaunchpadProMK3.darkenRGBColour(originalColor, flashRatio);
              LaunchpadProMK3.sendRGB(padAddress, flashColor[0], flashColor[1], flashColor[2]);
              
              let beatMarkerInfo = is16BeatPadOn16Beat ? " [16-BEAT PAD DARK FLASH]" : "";
              let pageInfo = LaunchpadProMK3.currentPage === 4 ? "FORWARD" : "REVERSE";
              LOG.debug("setupLoopPagesFlashing: Deck " + C.O + deckNum + C.RE + " pad " + C.O + padAddress + C.RE + " (slice " + rowWithinSlice + " col " + colWithinSlice + " sizeIndex " + sizeIndex + " size " + loopSize + " " + pageInfo + ") flashing (beat " + C.O + LaunchpadProMK3.decks[deckNum].loopPagesBeatCounter + C.RE + " % " + C.O + beatAmount + C.RE + " = 0)" + beatMarkerInfo, C.G);
            } else {
              // Restore original color if this beat doesn't trigger a flash
              if (LaunchpadProMK3.decks[deckNum].loopPagesOriginalColors[padAddress]) {
                let originalColor = LaunchpadProMK3.decks[deckNum].loopPagesOriginalColors[padAddress];
                LaunchpadProMK3.sendRGB(padAddress, originalColor[0], originalColor[1], originalColor[2]);
              }
            }
          }
        }
      }
    );
    
    LOG.debug("setupLoopPagesFlashing(" + C.O + deckNum + C.G + "): set up beat flashing for loop pages", C.G);
  } else {
    LOG.debug("setupLoopPagesFlashing: Connection already exists for deck " + deckNum, C.Y);
  }
};

/**
 * cleanup loop pages beat flashing connections
 * MARK: cleanupLoopPagesFlashing()
 * @param {number} deckNum - deck number (1-4)
 * @returns {void}
 */
LaunchpadProMK3.cleanupLoopPagesFlashing = function (deckNum) {
  if (LaunchpadProMK3.decks[deckNum] && LaunchpadProMK3.decks[deckNum].loopPagesBeatConnection) {
    LaunchpadProMK3.decks[deckNum].loopPagesBeatConnection.disconnect();
    LaunchpadProMK3.decks[deckNum].loopPagesBeatConnection = null;
    LaunchpadProMK3.decks[deckNum].loopPagesBeatCounter = 0;
    LaunchpadProMK3.decks[deckNum].loopPagesOriginalColors = {};
    LOG.debug("cleanupLoopPagesFlashing(" + C.O + deckNum + C.G + "): cleaned up loop pages beat connection for deck " + C.O + deckNum, C.G);
  }
};


/**
 * reset keep playing mode and restore button colors
 * @returns {void}
 */
LaunchpadProMK3.resetKeepPlayingMode = function() {
  if (LaunchpadProMK3.keepPlayingMode) {
    LaunchpadProMK3.keepPlayingMode = false;
    LOG.debug("Keep playing mode deactivated", C.Y);
    // Restore bright yellow color to both buttons
    LaunchpadProMK3.sendRGB(LaunchpadProMK3.buttons.keepPlayingMode, 0x7F, 0x7F, 0x00); // Bright yellow
  }
};

/**
 * print welcome message with controller features
 * displayed during initialization
 * @returns {void}
 */
LaunchpadProMK3.printReadme = function () {
  LOG.debug("", 1, 0, null, C.RE);
  LOG.debug("┌─── LaunchpadProMK3 Controller Script ───┐", C.C);
  LOG.debug("│ Features:                               │", C.W);
  LOG.debug("│ • Hotcues: 36/deck (3 banks)            │", C.W);
  LOG.debug("│ • One-Deck mixed controls               │", C.W);
  LOG.debug("│ • Intro/Outro markers on sidepads       │", C.W);
  LOG.debug("│ • BPM scaling & Beatjump                │", C.W);
  LOG.debug("│ • Loop move/resize; roll & exit modes   │", C.W);
  LOG.debug("│ • Undo/Redo; Keep Playing; Slip; FX     │", C.W);
  LOG.debug("│ Pages: 0 Hotcues | 1 One-Deck | 2 Beat  │", C.G);
  LOG.debug("│        3 BPM | 4/5 Loops | 6 Move | 7   │", C.G);
  LOG.debug("│        Resize | 8/9 Animations          │", C.G);
  LOG.debug("└─── by Milkii ───────────────────────────┘", C.C);
  LOG.debug("", 1, 0, null, C.RE);
};



/**
 * setup hotcue controls for one-deck page
 * lights up rows 7-8 (bottom 2 rows) with hotcue controls
 * @param {number} selectedDeck - deck number (1-4)
 * @returns {void}
 */
LaunchpadProMK3.setupSelectedDeckHotcues = function(selectedDeck) {
  const channel = `[Channel${selectedDeck}]`;
  const deckLoaded = engine.getValue(channel, "track_loaded");
  const deckObj = LaunchpadProMK3.decks[selectedDeck];
  if (!deckObj) return;
  
  const deckRgb = LaunchpadProMK3.hexToRGB(deckObj.deckColour || 0xFFFFFF);
  
  // Light up the bottom 2 rows (positions 48-63) with hotcue controls
  for (let i = 48; i < 64; i++) {
    const padAddress = LaunchpadProMK3.mainpadAddresses[i];
    const hotcueIndex = i - 48; // 0-15 for the 16 hotcues in bottom 2 rows
    
    // Calculate actual hotcue number based on per-deck bank
    let deckBank = LaunchpadProMK3.hotcueBankPerDeck[selectedDeck] || 1;
    let bankOffset = (deckBank - 1) * 16; // 0 for bank 1, 16 for bank 2, 32 for bank 3
    let actualHotcueNum = bankOffset + hotcueIndex + 1; // 1-16 for bank 1, 17-32 for bank 2, 33-36 for bank 3
    
    // For bank 3, only show hotcues 33-36 (first 4 pads), turn off the rest
    if (deckBank === 3 && hotcueIndex >= 4) {
      actualHotcueNum = -1; // Invalid hotcue number will turn off the pad
    }
    
    if (padAddress) {
      let padRgb;
      
      if (deckLoaded !== 1) {
        // Track not loaded - on page 1 show bright deck colour (page-specific dimscale)
        let dimRatio = LaunchpadProMK3.deckLoadedDimscale;
        if (LaunchpadProMK3.currentPage === 1 && selectedDeck === (LaunchpadProMK3.oneDeckCurrent || 1)) {
          dimRatio = LaunchpadProMK3.oneDeckLoadedDimscale;
        }
        padRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, dimRatio);
      } else if (actualHotcueNum > 0 && actualHotcueNum <= LaunchpadProMK3.totalDeckHotcueButtons) {
        // Track loaded and valid hotcue number - check if hotcue is enabled
        const hotcueEnabled = engine.getValue(channel, `hotcue_${actualHotcueNum}_status`);
        if (hotcueEnabled === 1) {
          // Hotcue is set - get the actual hotcue color
          const hotcueColour = engine.getValue(channel, `hotcue_${actualHotcueNum}_color`);
          padRgb = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(hotcueColour), LaunchpadProMK3.deckLoadedActiveDimscale);
        } else {
          // No hotcue set - use deck color with inactive brightness
          padRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckLoadedInactiveDimscale);
        }
      } else {
        // Invalid hotcue number (e.g., bank 3 beyond pad 4), turn off the pad
        padRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckUnloadedDimscale);
      }
      
      LaunchpadProMK3.sendRGB(padAddress, padRgb[0], padRgb[1], padRgb[2]);
    }
  }
};

/**
 * update hotcue visuals across pages when hotcues change
 * refreshes page 0 and page 1 hotcue displays
 * @param {number} [deck] - specific deck to update, or all if undefined
 * @returns {void}
 */
LaunchpadProMK3.updateHotcuePages = function(deck) {
  // Update page 0 (hotcue page)
  if (LaunchpadProMK3.currentPage === 0) {
    LaunchpadProMK3.updateHotcuePage(deck);
  }
  // Update one-deck page (page 1) hotcue rows if selected deck matches
  else if (LaunchpadProMK3.currentPage === 1) {
    const selectedDeck = LaunchpadProMK3.oneDeckCurrent || 1;
    if (deck === undefined || deck === selectedDeck) {
      LaunchpadProMK3.setupSelectedDeckHotcues(selectedDeck);
    }
  }
};