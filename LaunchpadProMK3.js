//// Launchpad Pro MK3 MIDI mapping for Mixxx
//// created by Milkii B, hi Mum

/// wip

/// done
// 4*16 or 2*32 hotcue pads, matched to deck colour
// total 80 with 4 sets of intro start, end, outro start, end
// beatjump page with a range of jump lengths for all decks
// bpm scale page with visual aid to fix misanalysed tempo
// fix colour brightness scaling
// fix background for bpm scale
// make all the base functionality work
// fix undo bpm scale
// fix star up/down
// fix hotcues
// finish move to cleaner deck config object

/// todo
// sort_hotcues, sort_hotcues_remove_offsets
// reduce duplicated logic, recheck objects
// make the core logic saner
// literary programming comments
// finish one deck page with multiple controls
// make this truly 2 deck compatible
// make a two deck page
// make deck order truly free
// normalise variable names across functions
// make more robust through adding more checks
// make the bpm flash in a new place
// better deck colour display
// represent track colours
// a e s t h e t i c s and consistency
// party



//// Main object to represent the controller
var LaunchpadProMK3 = {};



/// DEBUG stuff
LaunchpadProMK3.DEBUGstate = 1;


// Terminal colour codes for DEBUG messages
const COLOURS = {
  RED: "[31m",
  GREEN: "[32m",
  ORANGE: "[33m",
  BLUE: "[34m",
  YELLOW: "[35m",
  MAGENTA: "[35m",
  CYAN: "[36m",
  RESET: "[0m"
};

// Shorthand for the above
const C = {
  R: COLOURS.RED,
  O: COLOURS.ORANGE,
  Y: COLOURS.YELLOW,
  G: COLOURS.GREEN,
  B: COLOURS.BLUE,
  M: COLOURS.MAGENTA,
  C: COLOURS.CYAN,
  RE: COLOURS.RESET
};


const DEBUG = function (message, colour, linesbefore, linesafter) {
  if (LaunchpadProMK3.DEBUGstate) {
    if (colour === undefined) { colour = ""; }
    if (typeof linesbefore === "number" && linesbefore > 0 && linesbefore < 50) { for (i = 0; i < linesbefore; i += 1) { console.log(" "); } }
    console.log(`${COLOURS.RED}DEBUG ${COLOURS.RESET}${colour}${message}${COLOURS.RESET}`);
    if (typeof linesafter === "number" && linesafter > 0 && linesafter < 50) { for (i = 0; i < linesafter; i += 1) { console.log(" "); } }
    //LaunchpadProMK3.sleep(1000)
  };
};

//const D = function(var1, var2, var3, var4, var5, var6) {
//  if (LaunchpadProMK3.DEBUGstate) {
//    console.log(`${C.R}D${C.RE}  ${var1)} ${C.O}   ${eval(var1)}   ${C.RE} ${var2} ${C.O}${var2}${C.RE} ${var3} ${C.O}${var3}${C.RE} ${var4} ${C.O}${var4}${C.RE} ${var5} ${C.O}${var5}${C.RE} ${var6} ${C.O}${var6}${C.RE}`)
//    //LaunchpadProMK3.sleep(333)
//  }
//};



//// Initialise main variables


// Init deck conf base object
LaunchpadProMK3.deck = LaunchpadProMK3.deck || {};

// MIDI addresses of the main 8x8 grid
LaunchpadProMK3.mainpadAddresses = [
  81, 82, 83, 84, 85, 86, 87, 88,
  71, 72, 73, 74, 75, 76, 77, 78,
  61, 62, 63, 64, 65, 66, 67, 68,
  51, 52, 53, 54, 55, 56, 57, 58,
  41, 42, 43, 44, 45, 46, 47, 48,
  31, 32, 33, 34, 35, 36, 37, 38,
  21, 22, 23, 24, 25, 26, 27, 28,
  11, 12, 13, 14, 15, 16, 17, 18];


// MIDI addresses of the left/right side pads
LaunchpadProMK3.sidepads = [
  80, 70, 89, 79,
  60, 50, 69, 59,
  40, 30, 49, 39,
  20, 10, 29, 19];


// Templates for assigning side pad controls
LaunchpadProMK3.sidepadNames = [
  "intro_start_",
  "intro_end_",
  "outro_start_",
  "outro_end_"];


// row above main pads
LaunchpadProMK3.row0 = [0x5B, 0x5C, 0x5D, 0x5E, 0x5F, 0x60, 0x61, 0x62];

// rows below main pads
LaunchpadProMK3.row1 = [0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x6B, 0x6C];
LaunchpadProMK3.row2 = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];


// Deck physical order (pad address offsets) and deck colours
LaunchpadProMK3.deck.config = {
  "3": { order: 1, colour: 0xfeb108 }, //yellow
  "1": { order: 2, colour: 0x378df7 }, //blue
  "2": { order: 3, colour: 0xd700d7 }, //magenta
  "4": { order: 4, colour: 0x88b31a }  //green
};


//LaunchpadProMK3.numberOfDecks = Object.keys(LaunchpadProMK3.deck.config).length;

const totalDecks = Object.keys(LaunchpadProMK3.deck.config).length;
const totalDeckHotcuePads = 64 / totalDecks;


// full brightness LED colour is confusing
// these set how bright the LEDs are for loaded and unloaded decks
const deckLoadedDimscale = 0.35
const deckUnloadedDimscale = 0.2


// Track which page is selected
LaunchpadProMK3.currentPage = 0; // Page 0 for hotcues

// Track which hotcue was last used
LaunchpadProMK3.lastHotcue = []; // Page 0 for hotcues

// Track what hotcue was last deleted
LaunchpadProMK3.redoLastDeletedHotcue = [];

// Which deck actions will be performed on
LaunchpadProMK3.lastHotcueChannel = "undefined"

// Track if the shift button is pressed
LaunchpadProMK3.shift = 0;


// Initialize bpmFlashStep array for all pads (11 through 88)
LaunchpadProMK3.bpmFlashStep = [];


// Initialize bpmFlashStep array for all pads (11 through 88)
LaunchpadProMK3.bpmFlashStepInit = function() {
  for (let pad = 11; pad <= 88; pad++) {
    let firstDigit = Math.floor(pad / 10);
    let lastDigit = pad % 10;
    // Only include pads with first digit 1-8 and last digit 1-8
    if (firstDigit >= 1 && firstDigit <= 8 && lastDigit >= 1 && lastDigit <= 8) {
      LaunchpadProMK3.bpmFlashStep[pad] = 0;
    }
  }
};
 
LaunchpadProMK3.bpmFlashStepInit();


// Initialize bpmScaled arrays for all decks
LaunchpadProMK3.bpmScaled = [];
LaunchpadProMK3.bpmScaled.samplesInBeat = [];
LaunchpadProMK3.bpmScaled.beatsToSamples0_5 = [];
LaunchpadProMK3.bpmScaled.beatsToSamples0_666 = [];
LaunchpadProMK3.bpmScaled.beatsToSamples0_75 = [];
LaunchpadProMK3.bpmScaled.beatsToSamples1_25 = [];
LaunchpadProMK3.bpmScaled.beatsToSamples1_333 = [];
LaunchpadProMK3.bpmScaled.beatsToSamples1_5 = [];

// Initialize bpmTimer arrays for all decks
LaunchpadProMK3.bpmTimerFor0_5 = [];
LaunchpadProMK3.bpmTimerFor0_666 = [];
LaunchpadProMK3.bpmTimerFor0_75 = [];
LaunchpadProMK3.bpmTimerFor1_25 = [];
LaunchpadProMK3.bpmTimerFor1_333 = [];
LaunchpadProMK3.bpmTimerFor1_5 = [];

// Initialize inNextBeat arrays for all decks
LaunchpadProMK3.inNextBeatFor0_5 = [];
LaunchpadProMK3.inNextBeatFor0_666 = [];
LaunchpadProMK3.inNextBeatFor0_75 = [];
LaunchpadProMK3.inNextBeatFor1_25 = [];
LaunchpadProMK3.inNextBeatFor1_333 = [];
LaunchpadProMK3.inNextBeatFor1_5 = [];

LaunchpadProMK3.lastFlashTime = {};

//// Initialisation and instantiation function; sets up decks, etc

LaunchpadProMK3.init = function () {

  DEBUG("######", C.M);
  DEBUG("######", C.O);
  DEBUG("######   init controller script n object", C.C);
  DEBUG("######", C.O);
  DEBUG("######", C.M);
  DEBUG("")
  DEBUG("ooooo                                                    oooo                                   .o8       ooooooooo.                           ooo        ooooo oooo    oooo   .oooo.", C.M)
  DEBUG("`888'                                                    `888                                  dc888      `888   `Y88.                         `88.       .888' `888   .8P'  .dPY''88b", C.M)
  DEBUG(" 888          .oooo.   oooo  oooo  ooo. .oo.    .ooooo.   888 .oo.   oo.ooooo.   .oooo.    .oooo888        888   .d88' oooo d8b  .ooooo.        888b     d'888   888  d8'          ]8P'", C.M)
  DEBUG(" 888         `P  )88b  `888  `888  `888P'Y88b  d88' `'Y8  888P'Y88b   888' `88b `P  )88b  d88' `888        888ooo88P'  `888''8P d88' `88b       8 Y88. .P  888   88888[          <88b.", C.M)
  DEBUG(" 888          .oP'888   888   888   888   888  888        888   888   888   888  .oP'888  888   888        888          888     888   888       8  `888'   888   888`88b.         `88b.", C.M)
  DEBUG(" 888       o d8(  888   888   888   888   888  888   .o8  888   888   888   888 d8(  888  888   888        888          888     888   888       8    Y     888   888  `88b.  o.   .88P", C.M)
  DEBUG("o888ooooood8 `Y888''8o  `V88V'V8P' o888o o888o `Y8bod8P' o888o o888o  888bod8P' `Y888''8o `Y8bod88P'      o888o        d888b    `Y8bod8P'      o8o        o888o o888o  o888o `8bd88P'", C.M)
  DEBUG("                                                                      888" , C.M)
  DEBUG("                                                                     o888o", C.M)
  DEBUG("")
  DEBUG("created by Milkii, with thanks to various Mixxx devs on Zulip, the forum and GitHub for help!", C.M)


  // Set LPP3 from DAW mode to programmer mode
  LaunchpadProMK3.setProgrammerMode();


  // Clear already lit pads
  //LaunchpadProMK3.clearAll();


  // construct deck objects based on the Components Deck object system
  if (totalDecks === 4) {
    DEBUG("totalDecks = 4 decks", C.O, 1)
    LaunchpadProMK3.decks = {
      "1": new LaunchpadProMK3.Deck(1),
      "2": new LaunchpadProMK3.Deck(2),
      "3": new LaunchpadProMK3.Deck(3),
      "4": new LaunchpadProMK3.Deck(4),
    }
  } else if (totalDecks === 2) {
    DEBUG("totalDecks = 2 decks", C.O, 1)
    LaunchpadProMK3.decks = {
      "1": new LaunchpadProMK3.Deck(1),
      "2": new LaunchpadProMK3.Deck(2),
    }
    DEBUG("decks madeeeee", C.R, 1, 1)
  };


  // MIDI handlers for deck selection, actions, and page selection
  DEBUG("LaunchpadProMK3.initExtras()", C.R, 1)
  LaunchpadProMK3.initExtras();

  // Select the initial desk
  DEBUG("LaunchpadProMK3.selectDeck(1)", C.R, 2)
  LaunchpadProMK3.selectDeck(1);

  // Initialise zeroth page (hotcues)
  DEBUG("LaunchpadProMK3.selectPage(0)", C.R, 2)
  LaunchpadProMK3.selectPage(0);


  DEBUG("######", C.R);
  DEBUG("######", C.O);
  DEBUG("init finished", C.G);
  DEBUG("######", C.O);
  DEBUG("######", C.R, 0, 24);

  //LaunchpadProMK3.lightUpRow2(LaunchpadProMK3.currentPage);
  LaunchpadProMK3.lightUpRow2();
};


// Set Launchpad Pro MK3 to Programmer Mode
LaunchpadProMK3.setProgrammerMode = function () {
  DEBUG("# sending programmer mode sysex..", C.O, 1);
  LaunchpadProMK3.sendSysEx([0x0E, 0x01]);
};


// Helper to construct and send SysEx message
LaunchpadProMK3.sendSysEx = function (data) {
  signal = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x0E].concat(data, [0xF7]);
  //DEBUG(signal)
  midi.sendSysexMsg(signal, signal.length);
};




//paused experiment
//LaunchpadProMK3.initMidiHigher = function(cc, r, g, b, func, args) {
//  DEBUG(`initMidiHigher    cc: ${cc}   deck:   {deck}    func: ${func}   r: ${r}   g: ${g}   b: ${b}`)
//  midi.makeInputHandler(0xB0, cc, (channel, control, value, status, group) => {
//    if (value !== 0) { func }
//    LaunchpadProMK3.sendRGB(cc, r, g, b); // bright
//  })
//};




//// Initialise misc key bindings


LaunchpadProMK3.initExtras = function () {
  // Deck selection buttons
  // deck 3
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[0], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectDeck(3); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[0], 0xd7, 0x00, 0xd7); // bright

  // deck 1
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[1], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectDeck(1); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[1], 0x1D, 0x46, 0x7B); // bright

  // deck 2
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[2], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectDeck(2); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[2], 0x7F, 0x58, 0x04); // bright

  // deck 4
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[3], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectDeck(4); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[3], 0x44, 0x60, 0x0D); // bright



  // page 1
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[0], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(0); }
  });
  // page 2
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[1], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(1); }
  });
  // page 3
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[2], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(2); }
  });
  // page 4
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[3], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(3); }
  });
  // page 5
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[4], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(4); }
  });
  // page 6
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[5], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(5); }
  });
  // page 7
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[6], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(6); }
  });


  // shift
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[7], (channel, control, value, status) => {
    if (value !== 0) {
      LaunchpadProMK3.shift = 1;
      LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[7], 0x2F, 0x7F, 0x7F);
      DEBUG("# shift on", C.G);
    } else if (value === 0) {
      LaunchpadProMK3.shift = 0;
      LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[7], 0x0B, 0x0B, 0x0F);
      DEBUG("# shift off", C.G);
    }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[7], 0x0B, 0x0B, 0x0F);


  // undo last hotcue
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row0[0], (channel, control, value, status) => {
    if (value !== 0) {
      LaunchpadProMK3.undoLastHotcue();
    }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row0[0], 0x7F, 0x30, 0x7F);

  // redo last hotcue
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row0[1], (channel, control, value, status) => {
    if (value !== 0) {
      LaunchpadProMK3.redoLastHotcue();
    }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row0[1], 0x2F, 0x20, 0x7F);


  // multi hotcue creation function
  hotcueCreationButton = LaunchpadProMK3.row0[7]
  midi.makeInputHandler(0xB0, hotcueCreationButton, (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.create4LeadupDropHotcues(LaunchpadProMK3.selectedDeck, value); }
  });
  LaunchpadProMK3.sendRGB(hotcueCreationButton, 0x7F, 0x7F, 0x7F);


  // hotcue color switch prev
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row0[4], (control, value, status, group) => {
    var channel = LaunchpadProMK3.lastHotcueChannel;
    if (typeof LaunchpadProMK3.lastHotcueChannel === "undefined") { return; }
    script.toggleControl(group, "hotcue_focus_color_prev");
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row0[4], 0x20, 0x20, 0x7F);

  // hotcue color switch next
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row0[5], (control, value, status, group) => {
    var channel = LaunchpadProMK3.lastHotcueChannel;
    if (typeof LaunchpadProMK3.lastHotcueChannel === "undefined") { return; }
    script.toggleControl(group, "hotcue_focus_color_next");
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row0[5], 0x7F, 0x20, 0x20);

};


// Turn off main LEDs for page change
LaunchpadProMK3.clearMain = function () {
  //// main pads
  DEBUG("//// clearing main and side pads:", C.G, 1);
  // turn all pads off by compiling a multi-led affecting sysex msg to send
  //colorSpecMulti = LaunchpadProMK3.mainpadAddresses.map(address => [0x03, address, 0,0,0]).flatmap();
  const colorSpecMulti = _.flatMap(LaunchpadProMK3.mainpadAddresses, (address) => [0x03, address, 0, 0, 0]);
  LaunchpadProMK3.sendSysEx([0x03].concat(colorSpecMulti));
  //// sidepads
  const colorSpecMultiSide = _.flatMap(LaunchpadProMK3.sidepads, (address) => [0x03, address, 0, 0, 0]);
  LaunchpadProMK3.sendSysEx([0x03].concat(colorSpecMultiSide));
  DEBUG("/// end clearing main and side pads", C.R, 0, 2);
};


// Turn off ALL LEDs for page change or shutdown
LaunchpadProMK3.clearAll = function () {
  DEBUG("////  clearing all pads", C.G, 2);
  // compile and send a two part msg to turn all pads off
  ca = [0x03]; cb = [0x03];
  for (i = 0; i <= 0x3F; i += 1) { ca = ca.concat([0x03, i, 0, 0, 0]); } LaunchpadProMK3.sendSysEx(ca);
  for (i = 0x40; i <= 0x7F; i += 1) { cb = cb.concat([0x03, i, 0, 0, 0]); } LaunchpadProMK3.sendSysEx(cb);
  DEBUG("/// end clearing all pads", C.R);
};


// Shutdown function that should be triggered by Mixxx on close
LaunchpadProMK3.shutdown = function () {
  DEBUG("###  SHUTTINGDOWN  ###", C.O, 2, 3);
  LaunchpadProMK3.stopAllBpmTimers();
  LaunchpadProMK3.clearAll();
};

//LaunchpadProMK3.exit = function() {
//  // Clear all page indicator LEDs
//  for (let i = 0; i < 8; i++) {
//    midi.sendShortMsg(0x90, 90 + i, 0);
//  }
//  // Clear all LEDs on the Launchpad
//  LaunchpadProMK3.clearAll();
//  // Stop any active timers
//  LaunchpadProMK3.stopBpmTimers();
//  DEBUG("Launchpad Pro MK3 Exit");
//};



//// Deck constructor


LaunchpadProMK3.Deck = function (deckNum) {
  //D(LaunchpadProMK3.DEBUGstate, C.M, this.deckColour, this.pads, test)
  DEBUG("", C.RE, 2)
  DEBUG("  o8o               o8o      .             .o8                      oooo", C.M);
  DEBUG("  `''               `''    .o8            '888                      `888", C.M);
  DEBUG(" oooo  ooo. .oo.   oooo  .o888oo      .oooo888   .ooooo.   .ooooo.   888  oooo", C.M);
  DEBUG(" 888  `888P'Y88b  `888    888        d88' `888  d88' `88b d88' `'Y8  888 .8P'", C.M);
  DEBUG(" 888   888   888   888    888        888   888  888ooo888 888        888888.", C.M);
  DEBUG(" 888   888   888   888    888 .      888   888  888    .o 888   .o8  888 `88b.", C.M);
  DEBUG(" o888o o888o o888o o888o   '888'     `Y8bod88P' `Y8bod8P' `Y8bod8P' o888o o888o", C.M);
  DEBUG("");
  DEBUG("#### constructing deck " + deckNum, C.M, 2);
  // connect deck object to Components system
  components.Deck.call(this, deckNum);

  // give object the deck colour
  this.deckColour = LaunchpadProMK3.deck.config[deckNum].colour;
  DEBUG("### " + C.RE + " deck object instantiation   deckNum " + C.O + deckNum + C.RE + "   this.currentDeck " + C.O + this.currentDeck + C.RE + "   colour " + C.O + "#" + this.deckColour.toString(16).padStart(6, "0").toUpperCase() + C.RE + " (" + C.O + LaunchpadProMK3.hexToRGB(this.deckColour) + C.RE + ")");
  // save this in RGB array format to use later
  this.deckRgb = LaunchpadProMK3.hexToRGB(this.deckColour);

  // give object its physical order
  this.deckOrderIndex = LaunchpadProMK3.deck.config[deckNum].order;
  DEBUG("this.deckOrderIndex (LaunchpadProMK3.deck.config[deckNum].order) " + C.O + LaunchpadProMK3.deck.config[deckNum].order)
  // what pad is the first of the set the deck will manage?
  this.deckMainSliceStartIndex = (this.deckOrderIndex - 1) * totalDeckHotcuePads;
  DEBUG("this.deckMainSliceStartIndex " + C.O + this.deckMainSliceStartIndex)
  // what is the set of main grid pads this deck will manage?
  this.pads = LaunchpadProMK3.mainpadAddresses.slice(this.deckMainSliceStartIndex, this.deckMainSliceStartIndex + totalDeckHotcuePads);
  DEBUG("this.pads " + C.O + LaunchpadProMK3.mainpadAddresses.slice(this.deckMainSliceStartIndex, this.deckMainSliceStartIndex + totalDeckHotcuePads))
  // save what the first pad is for later quick reference
  this.padsFirst = this.pads[0];

  // sidepad pads
  DEBUG(LaunchpadProMK3.sidepads, 1, 1)
  // what is the first sidepad of the set for this deck?
  this.deckSideSliceStartIndex = (LaunchpadProMK3.deck.config[deckNum].order - 1) * 4;
  // what is the full set of side pads this deck will use?
  this.deckSidepadAddresses = LaunchpadProMK3.sidepads.slice(this.deckSideSliceStartIndex, this.deckSideSliceStartIndex + 4);
  DEBUG("this.deckSideSliceStartIndex " + C.O + this.deckSideSliceStartIndex - 1)
  DEBUG("this.deckSidepadAddresses " + C.O + LaunchpadProMK3.sidepads.slice(this.deckSideSliceStartIndex, this.deckSideSliceStartIndex + 4))


  //// Deck Main Hotcues
  // initialise an array, attached to the object, that will hold the individual hotcue objects
  this.hotcueButtons = [];
  DEBUG("## hotcue pads init", C.G, 1);

  // either 16 or 32
  // for the whole number of hotcues this deck will have..
  for (let i = 1; i <= totalDeckHotcuePads; i += 1) {
    color_obj = "";
    this.i = i;
    let padAddress = this.pads[i - 1];
    // give the hotcue a number,
    let hotcueNum = i;
    // is this deck loaded?
    deckLoaded = engine.getValue(`${this.currentDeck}`, "track_loaded");
    DEBUG(padAddress)
    DEBUG("i " + C.O + i + C.RE + "    padAddress " + C.O + padAddress + C.RE + " / " + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   deck " + C.O + this.currentDeck + C.RE + "   deckLoaded " + C.R + deckLoaded + C.RE + "   deckColour " + C.O + "#" + this.deckColour.toString(16).toUpperCase() + C.RE + " (" + C.O + LaunchpadProMK3.hexToRGB(this.deckColour) + C.RE + ")");

    if (deckLoaded !== 1) { this.deckRgb = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(this.deckColour), deckUnloadedDimscale); }
    if (deckLoaded === 1) { this.deckRgb = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(this.deckColour), deckLoadedDimscale); }
    //this.deckColourBg = LaunchpadProMK3.hexToRGB(this.deckColourBg)
    LaunchpadProMK3.sendRGB(padAddress, this.deckRgb[0], this.deckRgb[1], this.deckRgb[2]);

    // Create hotcue button, using ComponentsJS objects
    this.hotcueButtons[i - 1] = new components.HotcueButton({
      // Not using midi: because sysex is where it's at with this controller
      //midi: [0x90, padAddress],
      number: this.i, // This is the hotcue number
      padAddress: padAddress,

      // what happens when pads get pressed
      input: midi.makeInputHandler(0x90, padAddress, (channel, control, value, status) => {
        if (value !== 0) { DEBUG("(main pad press: " + C.RE + "loaded? " + C.O + engine.getValue(`${this.currentDeck}`, "track_loaded") + C.RE + "   value: " + C.O + value + C.RE + "   page: " + C.O + LaunchpadProMK3.currentPage + C.RE + ")", C.RE, 1); }
        // check the deck is loaded with a track, that the page is right, that it's a button press not release
        //if (engine.getValue(`${this.currentDeck}`,"track_loaded") !== 1 || value === 0) { return; }

        //0
        // hotcues, intro/outro, multihotcue creation, deck select
        if (LaunchpadProMK3.currentPage === 0) {
          // is shift pressed?
          if (LaunchpadProMK3.shift === 0) {
            // if shift not pressed: Hotcue Activation
            DEBUG("no shift..  value " + value, C.O);
            // is this a note down or note up event?
            if (value !== 0) {
              DEBUG("input: deckNum" + C.O + deckNum + C.RE + "/" + C.O + this.currentDeck + C.RE + ",  i " + C.O + i + C.RE + ",  padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   hotcueNum " + C.O + hotcueNum, C.G, 0, 1);
              // activate creation trigger
              engine.setValue(this.currentDeck, "hotcue_" + hotcueNum + "_activate", 1)
              // set new last hotcue channel
              LaunchpadProMK3.lastHotcueChannel = this.currentDeck;
              // add new entry to undo list
              DEBUG(LaunchpadProMK3.lastHotcue.slice(-1))
              // construct name of control target
              hotcueName = "hotcue_" + (hotcueNum)
              DEBUG(hotcueName)
              // will this hotcue be the same as the last hotcue?
              // color_object = "";
              if (LaunchpadProMK3.lastHotcue[0] !== this.currentDeck && LaunchpadProMK3.lastHotcue.slice(-1) !== hotcueName) {
                LaunchpadProMK3.lastHotcue.unshift([this.currentDeck, hotcueName, padAddress, deckNum, color_obj]);
              }
              // on note up, deactivate control trigger
            } else if (value === 0) {
              engine.setValue(this.currentDeck, "hotcue_" + hotcueNum + "_activate", 0)
            }
            DEBUG("LaunchpadProMK3.lastHotcue:  " + C.O + LaunchpadProMK3.lastHotcue);

            /// if shift is pressed: Hotcue Deletion
            if (LaunchpadProMK3.shift === 1) {
              DEBUG("shift, hotcue clear " + C.RE + hotcueNum + C.G + " on " + C.RE + this.currentDeck, C.G);
              // helper function to toggle hotcue clear control on then off
              script.triggerControl(this.currentDeck, "hotcue_" + hotcueNum + "_clear", 50);
              // has to be full page refresh because a track could be on two decks
              LaunchpadProMK3.updateHotcuePage();
              DEBUG("leaving hotcue page btton press..", C.R, 0, 1);
            }
          }
          DEBUG("end of page 0 input action");
        }; //end of page0, hotcue input handler

        //1
        // beatjump
        if (LaunchpadProMK3.currentPage === 1) {
          if (value !== 0) {
            // what control in the array is activated with this pad?
            let beatjumpControlSel = LaunchpadProMK3.beatjumpControls[hotcueNum - 1];
            script.triggerControl(this.currentDeck, beatjumpControlSel, 50);
            DEBUG("BEATJUMP " + C.O + beatjumpControlSel + C.RE + " on deck " + this.currentDeck, C.G, 1);
          }
        };

        //2
        // bpm scaling
        if (LaunchpadProMK3.currentPage === 2) {
          // if a pad is pressed on page 2
          if (value !== 0) {
            DEBUG("bpm scaling..  padAddress " + C.O + padAddress + C.RE);
            // check if this deck is loaded
            if (engine.getValue(this.currentDeck, "track_loaded") === 1) {
              // get what control this pad should trigger
              let bpmScalingControl = LaunchpadProMK3.bpmScaling[padAddress % 10].control;
              // if the last number is zero
              DEBUG(parseInt(padAddress / 10));
              if (parseInt(padAddress / 10) % 2 !== 0) {
                // what is the first digit of the pad
                let firstDigit = Math.floor(padAddress / 10);
                // if the first digit is even then pad is stars up, and vice versa
                firstDigit % 2 === 0 ? bpmScalingControl = "stars_up" : bpmControlSel = "stars_down";
              }
              // trigger the control (on then off)
              script.triggerControl(this.currentDeck, bpmScalingControl, 50);
              DEBUG("bpmSCALE " + C.O + bpmScalingControl + C.RE + " on deck " + this.currentDeck, C.G, 1);
              // refresh all the pads
              LaunchpadProMK3.updateBpmScalePage();
            }
          }
        }; //end page 2, bpm scaling

        //3 & 4
        // loops
        if (LaunchpadProMK3.currentPage === 3 || LaunchpadProMK3.currentPage === 4) {
          if (value !== 0) {
            DEBUG("it's loopin time")
            reverse = "";
            if (Object.values(LaunchpadProMK3.decks[1].pads).includes(padAddress)) { deck = 1 }
            if (Object.values(LaunchpadProMK3.decks[2].pads).includes(padAddress)) { deck = 2 }
            if (Object.values(LaunchpadProMK3.decks[3].pads).includes(padAddress)) { deck = 3 }
            if (Object.values(LaunchpadProMK3.decks[4].pads).includes(padAddress)) { deck = 4 }

            channel = "[Channel" + deck + "]";
            const firstDigit = parseInt(padAddress / 10);
            const lastDigit = padAddress % 10;
            if (firstDigit % 2 === 0) {
              fun = "beatloop_" // even
            } else {
              fun = "beatlooproll_" // odd
            }
            if (LaunchpadProMK3.currentPage === 4) { reverse = "r" }
            control = fun + reverse + LaunchpadProMK3.loopControls[lastDigit];
            DEBUG("loops   channel " + channel + "   padAddress " + padAddress + "   control " + control);
            script.toggleControl(channel, control, 50);
          };
        };
        //5
        // loop
        if (LaunchpadProMK3.currentPage === 5) {
          if (value !== 0) {
            DEBUG("it's loopin extra tools time on page 5")
          }
        } // end loop pages

        //6
        // one deck
        if (LaunchpadProMK3.currentPage === 6) {
          if (value !== 0) {
            DEBUG("one deck time, page 6")
            if (engine.getValue(this.currentDeck, "track_loaded") === 1) {
              deck = LaunchpadProMK3.selectedDeck;
              const firstDigit = parseInt(padAddress / 10);
              const lastDigit = padAddress % 10;
              if (firstDigit % 2 === 0) { fun = "beatloop_" } else { fun = "beatlooproll_" }
              if (firstDigit === 8 || firstDigit === 7) { padPoss = 4 }
              else if (firstDigit === 6 || firstDigit === 5) { padPoss = 4 }
              else if (firstDigit === 4 || firstDigit === 3) { padPoss = 4 }
              else if (firstDigit === 2 || firstDigit === 1) { padPoss = 4 }
            }
          }
        }
      }), //end input handler

      // how the lights of pads managed this way are changed
      sendRGB: function (color_obj) {
        //DEBUG("this.deckColour: " +C.O+ this.deckColour)
        //let rgb = LaunchpadProMK3.hexToRGB(this.deckColour);
        //DEBUG("rgb " +C.O+ rgb)
        //if (deckLoaded !== 1) { rgb = LaunchpadProMK3.darkenRGBColour(rgb, deckUnloadedDimscale) }
        if (LaunchpadProMK3.currentPage === 0) {
          let deckLoaded = engine.getValue(`[Channel${deckNum}]`, "track_loaded");
          DEBUG("sendRGB: " + C.RE + "color_obj " + C.O + JSON.stringify(color_obj) + C.RE + "   deckNum " + C.O + deckNum + C.RE + "   i " + C.O + i + C.RE + "   padAddress " + C.O + padAddress + C.RE + " / " + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   deckLoaded " + C.O + deckLoaded, C.G, 1);
          LaunchpadProMK3.sendRGB(this.padAddress, color_obj.red >> 1, color_obj.green >> 1, color_obj.blue >> 1);
        }
      } //end sendrgb method
    }) //end hotcue component

    //shutdown: undefined

    // bind action to a change of hotcue status
    DEBUG("makeConnection")
    engine.makeConnection(`[Channel${deckNum}]`, `hotcue_${hotcueNum}_status`, (value) => {
      //if (value === 0) { return }
      if (LaunchpadProMK3.currentPage === 0 || value !== 0) {
        let deckColour = this.deckColour // Get the deck color
        let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
        let deckDimUnloaded = LaunchpadProMK3.darkenRGBColour(deckRgb, deckUnloadedDimscale);
        LaunchpadProMK3.sendRGB(padAddress, deckDimUnloaded[0], deckDimUnloaded[1], deckDimUnloaded[2]);
        DEBUG("makeConnection " + C.RE + " hotcue_X_status" + C.RE + "   deckColour hex " + C.O + "#" + deckColour.toString(16) + C.RE + "   deckRgb " + C.O + deckRgb + C.RE + "   deckDimUnloaded " + C.O + deckDimUnloaded, C.G, 1, 2);
      }
      if (value === 0) {

      }
    }); //end of makeConnection

    // bind an action to a hotcue being cleared
    //engine.makeConnection(`[Channel${deckNum}]`, `hotcue_${hotcueNum}_clear`, (value) => {
    //  if (value === 0) { return }
    //  let deckColour = this.deckColour; // Get the deck color
    //  let deckColourBg = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(deckColour), deckUnloadedDimscale);
    //  DEBUG("makeConnection" +C.RE+ "hotcue_X_clear    deckColour " + deckColour + "   deckColourBg " + deckColourBg, C.R, 1, 2);
    //  if (LaunchpadProMK3.currentPage === 0) {
    //    let rgbArray = LaunchpadProMK3.hexToRGB(deckColourBg);
// LaunchpadProMK3.sendRGB(padAddress, rgbArray[0], rgbArray[1], rgbArray[2]);
    //  };
    //})
    DEBUG("# ending mainpads init", C.R);
  };

  //// Deck Sidepad Intro/Outro Hotcues
  DEBUG("## intro/outro " + C.B + "sidepads init   deckNum " + deckNum, C.G, 1);
  this.sideButtons = [];
  for (sidepad = 1; sidepad <= 4; sidepad += 1) {
    DEBUG("sidepad " + sidepad, C.G, 1)
    DEBUG("this.deckSidepadAddresses " + this.deckSidepadAddresses)
    //let padAddress = this.deckSidepadAddresses[sidepad-1]
    let padAddress = this.deckSidepadAddresses[sidepad - 1];
    if (LaunchpadProMK3.selectPage === 6) { padAddress = LaunchpadProMK3.sidepads[12 + sidepad] - 20 };
    // the sidepad control this loop will setup
    let sidepadControlName = LaunchpadProMK3.sidepadNames[sidepad - 1];
    let rgb = LaunchpadProMK3.hexToRGB(0x00FFFF)
    DEBUG(padAddress)
    DEBUG("sidepad " + C.O + sidepad + C.RE + "   padAddress " + C.O + padAddress + C.RE + " / " + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   sidepadControlName " + C.O + sidepadControlName + C.RE + "   deck " + C.O + deckNum);

    // setup a new sidepad button component
    this.sideButtons[sidepad - 1] = new components.Button({
      midi: [0xB0, padAddress],
      padAddress: this.padAddress, // Get ready
      // sendRGB: LaunchpadProMK3.sendRGB(this.sidepadAddress, 0x00, 0x00, 0xFF),

      // what to do when a sidepad is pressed
      input: midi.makeInputHandler(0xB0, padAddress, (channel, control, value, status) => {
        if (LaunchpadProMK3.currentPage === 0) {
          if (value !== 0) {
            if (LaunchpadProMK3.shift === 0) {
              DEBUG("side press: deck " + C.O + deckNum + C.RE + "   padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   sidepadControlName: " + C.O + sidepadControlName + "activate", C.G, 1);
              script.triggerControl(`[Channel${deckNum}]`, `${sidepadControlName}activate`, 50);
              LaunchpadProMK3.lastHotcue.unshift([deckNum, sidepadControlName, padAddress, deckNum]);
            } else {
              script.triggerControl(`[Channel${deckNum}]`, `${sidepadControlName}clear`, 50);
            };
          }
        }; //end page 0
        if (LaunchpadProMK3.currentPage === 2) {
          //if (value !== 0) {
          //let firstDigit = Math.floor(padAddress / 10);
          //let bpmScalingControl = firstDigit % 2 === 0 ? "stars_up" : "stars_down";
          //script.triggerControl(this.currentDeck, bpmScalingControl, 50);
          //DEBUG("bpmSCALE " +C.O+ bpmScalingControl +C.RE+ " on deck " + this.currentDeck, C.G);
          //LaunchpadProMK3.updateBpmScalePage();
          //}
        }; //end page 2
      }), //end sidepad input handler

    }); //end sidepad button components


    engine.makeConnection(`[Channel${deckNum}]`, `${sidepadControlName}enabled`, (value) => {
      if (LaunchpadProMK3.currentPage === 0) {
        //LaunchpadProMK3.trackWithIntroOutro(value, deckNum, padAddress);
        LaunchpadProMK3.trackWithIntroOutro(1, deckNum, padAddress);
      }
    }); //end makeConnection
  }; //end sidepad init loop
  DEBUG("# ending sidepads init", C.R, 0, 2);



  // Initialize the bpm scaling arrays for this deck
  LaunchpadProMK3.bpmScaled[deckNum] = []
  LaunchpadProMK3.bpmScaled[deckNum].samplesInBeat = []
  LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples0_5 = []
  LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples0_666 = []
  LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples0_75 = []
  LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples1_25 = []
  LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples1_333 = []
  LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples1_5 = []

  // Initialize timer arrays properly
  if (LaunchpadProMK3.bpmTimerFor0_5[deckNum] === undefined) {
    LaunchpadProMK3.bpmTimerFor0_5[deckNum] = [];
  }
  if (LaunchpadProMK3.bpmTimerFor0_666[deckNum] === undefined) {
    LaunchpadProMK3.bpmTimerFor0_666[deckNum] = [];
  }
  if (LaunchpadProMK3.bpmTimerFor0_75[deckNum] === undefined) {
    LaunchpadProMK3.bpmTimerFor0_75[deckNum] = [];
  }
  if (LaunchpadProMK3.bpmTimerFor1_25[deckNum] === undefined) {
    LaunchpadProMK3.bpmTimerFor1_25[deckNum] = [];
  }
  if (LaunchpadProMK3.bpmTimerFor1_333[deckNum] === undefined) {
    LaunchpadProMK3.bpmTimerFor1_333[deckNum] = [];
  }
  if (LaunchpadProMK3.bpmTimerFor1_5[deckNum] === undefined) {
    LaunchpadProMK3.bpmTimerFor1_5[deckNum] = [];
  }

  LaunchpadProMK3.bpmTimerFor0_5[deckNum] = 0
  LaunchpadProMK3.bpmTimerFor0_666[deckNum] = 0
  LaunchpadProMK3.bpmTimerFor0_75[deckNum] = 0
  LaunchpadProMK3.bpmTimerFor1_25[deckNum] = 0
  LaunchpadProMK3.bpmTimerFor1_333[deckNum] = 0
  LaunchpadProMK3.bpmTimerFor1_5[deckNum] = 0

  LaunchpadProMK3.inNextBeatFor0_5[deckNum] = []
  LaunchpadProMK3.inNextBeatFor0_666[deckNum] = []
  LaunchpadProMK3.inNextBeatFor0_75[deckNum] = []
  LaunchpadProMK3.inNextBeatFor1_25[deckNum] = []
  LaunchpadProMK3.inNextBeatFor1_333[deckNum] = []
  LaunchpadProMK3.inNextBeatFor1_5[deckNum] = []

  

  // on track load, calculate scaled beat positions
  engine.makeConnection(`[Channel${deckNum}]`, "track_loaded", function () {
    LaunchpadProMK3.sleep(50)
    LaunchpadProMK3.bpmScaledInit(deckNum)
    LaunchpadProMK3.onTrackLoadedOrUnloaded(deckNum)
  })


  // on play/stop, stop all timers
  engine.makeConnection(`[Channel${deckNum}]`, "play", function (value) {
    DEBUG("Play/stop event on deck " + deckNum + " - value: " + value, C.G);
    
    if (value === 0) { // track stopped
      DEBUG("Track stopped on deck " + deckNum + ", stopping all BPM timers", C.R);

      // Stop all timers before resetting lights
      LaunchpadProMK3.stopAllBpmTimers();

      // Reset lights on this deck to loaded normal scale colours
      let pads = LaunchpadProMK3.decks[deckNum].pads;
      for (let i = 0; i < 8; i++) {
        let padAddress = pads[i];
        let j = i + 1;
        let key = j.toString();
        if (LaunchpadProMK3.bpmScaling[key]) {
          let ratioRgb = LaunchpadProMK3.hexToRGB(LaunchpadProMK3.bpmScaling[key].colour);
          let topPad = padAddress;
          let bottomPad = padAddress - 10;
          LaunchpadProMK3.sendRGB(topPad, ratioRgb[0], ratioRgb[1], ratioRgb[2]);
          LaunchpadProMK3.sendRGB(bottomPad, ratioRgb[0], ratioRgb[1], ratioRgb[2]);
        }
      }
    }
    
    if (LaunchpadProMK3.currentPage == 2) { // Only handle BPM flash on page 2
      // First reset all timers and steps to ensure a clean state
      // LaunchpadProMK3.stopAllBpmTimers();

      // When play starts, we need to force reset the bpm flash steps
      LaunchpadProMK3.bpmResetToBpm(deckNum);

      if (value === 1) { // track started playing
        DEBUG("Track started playing on deck " + deckNum + ", starting flash animations", C.G);
        
        // Start flash animations for the pads in this deck
        let pads = LaunchpadProMK3.decks[deckNum].pads;
        //let deckColour = LaunchpadProMK3.hexToRGB(LaunchpadProMK3.decks[deckNum].colour);
        
        // Manually trigger flash for each pad with proper color mapping
        // bpmScaling only has 8 entries keyed "1" through "8"
        // We need to map our pad indexes to these keys correctly
        // Get BPM scaling colors - store for use in the loop
        scaleColorsRgb = [];
        for (let j = 1; j <= 8; j++) {
          let key = j.toString();
          if (LaunchpadProMK3.bpmScaling[key]) {
            scaleColorsRgb.push(LaunchpadProMK3.hexToRGB(LaunchpadProMK3.bpmScaling[key].colour));
            DEBUG("### Adding scale color #" + LaunchpadProMK3.bpmScaling[key].colour.toString(16) + " for key " + key, C.O);
          }
        }
        
        // Give a small delay before starting flashes to ensure clean state
        engine.beginTimer(20, function() {
          DEBUG("Starting flash animations for: deckNum " + deckNum, C.G);
          
          // Only flash up to 8 pads (the number of bpmScaling entries) per column
          // The controller has a grid layout with 8 pads per deck
          // for (let i = 0; i < Math.min(pads.length, 8); i++) {
          for (let i = 0; i < 8; i++) {
            let padAddress = pads[i];
            // Use the color from bpmColors array to avoid undefined access
            if (i < scaleColorsRgb.length) {
              LaunchpadProMK3.bpmFlash(padAddress, scaleColorsRgb[i], deckRgb);
            }
          }
        }, true);
      } else if (value === 0) { // track stopped
        DEBUG("Track stopped on deck " + deckNum + ", resetting BPM colors", C.R);
        LaunchpadProMK3.bpmResetToBpm(deckNum);
      }
    }
  });

  // on playback rate change, recalculate scaled beat positions
  engine.makeConnection(`[Channel${deckNum}]`, "rate", function () {
    LaunchpadProMK3.bpmScaledInit(deckNum)
  })

  // on beat_active, calculate times until scaled beats, from now to +1 beat
  engine.makeConnection(`[Channel${deckNum}]`, "beat_active", function () {
    // this feature is found on page 3 irl
    if (LaunchpadProMK3.currentPage === 2) {
      let scaleColorsRgb = [];
      for (let j = 1; j <= 8; j++) {
        let key = j.toString();
        if (LaunchpadProMK3.bpmScaling[key]) {
          scaleColorsRgb.push(LaunchpadProMK3.hexToRGB(LaunchpadProMK3.bpmScaling[key].colour));
        }
      }
      // get the playhead position in the trach, between 0 and 1
      let now = engine.getValue(`[Channel${deckNum}]`, "playposition")
      // get the track length in samples
      let trackLength = LaunchpadProMK3.bpmScaled[deckNum].trackLength
      // convert playhead position to sample position
      let nowSamplePosition = now * LaunchpadProMK3.bpmScaled[deckNum].trackLength

      // calculate how many samples from now to oneBeatLater
      let oneBeatLater = nowSamplePosition + LaunchpadProMK3.bpmScaled[deckNum].samplesInBeat
      // for each scale ratio, get the sample positions of the scaled beats due between now and oneBeatLater
      LaunchpadProMK3.inNextBeatFor0_5[deckNum] = LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples0_5.filter((x) => x >= nowSamplePosition && x < oneBeatLater)
      LaunchpadProMK3.inNextBeatFor0_666[deckNum] = LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples0_666.filter((x) => x >= nowSamplePosition && x < oneBeatLater)
      LaunchpadProMK3.inNextBeatFor0_75[deckNum] = LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples0_75.filter((x) => x >= nowSamplePosition && x < oneBeatLater)
      LaunchpadProMK3.inNextBeatFor1_25[deckNum] = LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples1_25.filter((x) => x >= nowSamplePosition && x < oneBeatLater)
      LaunchpadProMK3.inNextBeatFor1_333[deckNum] = LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples1_333.filter((x) => x >= nowSamplePosition && x < oneBeatLater)
      LaunchpadProMK3.inNextBeatFor1_5[deckNum] = LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples1_5.filter((x) => x >= nowSamplePosition && x < oneBeatLater)

      // clear timers from previous beat
      LaunchpadProMK3.stopAllBpmTimers();

      /// begin to initiate timers to flash bpm pads
      // whats the top left-most pad for this deck?
      let firstPad = LaunchpadProMK3.decks[deckNum].padsFirst
      DEBUG("   firstPad " + firstPad, C.G, 1, 0)
      // get the deck colour in rgb array form
      let deckRgb = LaunchpadProMK3.decks[deckNum].deckRgb
      DEBUG("   deckRgb " + deckRgb)
      // calculate how many ms between the sample position of now and the next beat
      let samplesPerMs = LaunchpadProMK3.bpmScaled[deckNum].sampleRate / 1000;
      DEBUG("   samplesPerMs " + samplesPerMs)

      // get the top left-most pad for this deck
      // let firstDigit = Math.floor(firstPad / 10);
      // flash column 4 and 5 in the usual manner
      LaunchpadProMK3.bpmFlash(firstPad + 4, scaleColorsRgb[4], deckRgb)
      LaunchpadProMK3.bpmFlash(firstPad + 5, scaleColorsRgb[5], deckRgb)

      // *sigh*
      /// flash 0.5, 0.666, 0.75, 1.25, 1.333, 1.5 using timers that are triggered at the start of each current beat
      // flashing for half speed
      // loop through array of when the scaled beats are in this next regular beat
      for (let i = 0; i < LaunchpadProMK3.inNextBeatFor0_5[deckNum].length; i++) {
        // get this sample position for this beat
        let samplePos = LaunchpadProMK3.inNextBeatFor0_5[deckNum][i]
        // Convert sample position to relative milliseconds from now
        let msFromNow = Math.max(10, (samplePos - nowSamplePosition) / samplesPerMs);
        DEBUG("   msFromNow " + msFromNow + "ms");
        DEBUG("Timer for 0.5 BPM: " + msFromNow + "ms");
        if (msFromNow > 0 && msFromNow < 3000) { // Sanity check - don't set timers too far in advance
          LaunchpadProMK3.bpmTimerFor0_5[deckNum][i] = engine.beginTimer(msFromNow, function () {
            LaunchpadProMK3.bpmFlash(firstPad, scaleColorsRgb[0], deckRgb);
          }, true);
        }
      }
      // flashing for two thirds speed
      for (let i = 0; i < LaunchpadProMK3.inNextBeatFor0_666[deckNum].length; i++) {
        let samplePos = LaunchpadProMK3.inNextBeatFor0_666[deckNum][i]
        // let now = engine.getValue(`[Channel${deckNum}]`, "playposition")
        // let currentPosition = nowSamplePosition + samplePos * length;
        let msFromNow = Math.max(10, (samplePos - nowSamplePosition) / samplesPerMs);
        DEBUG("Timer for 0.666 BPM: " + msFromNow + "ms");
        if (msFromNow > 0 && msFromNow < 3000) { // Sanity check - don't set timers too far in advance
          LaunchpadProMK3.bpmTimerFor0_666[deckNum][i] = engine.beginTimer(msFromNow, function () {
            LaunchpadProMK3.bpmFlash(firstPad + 1, scaleColorsRgb[1], deckRgb);
          }, true);
        }
      }
      // flashing for three fourths speed
      for (let i = 0; i < LaunchpadProMK3.inNextBeatFor0_75[deckNum].length; i++) {
        let samplePos = LaunchpadProMK3.inNextBeatFor0_75[deckNum][i]
        // let now = engine.getValue(`[Channel${deckNum}]`, "playposition")
        // let currentPosition = nowSamplePosition + samplePos * length;
        let msFromNow = Math.max(10, (samplePos - nowSamplePosition) / samplesPerMs);
        DEBUG("Timer for 0.75 BPM: " + msFromNow + "ms");
        if (msFromNow > 0 && msFromNow < 3000) { // Sanity check - don't set timers too far in advance
          LaunchpadProMK3.bpmTimerFor0_75[deckNum][i] = engine.beginTimer(msFromNow, function () {
            LaunchpadProMK3.bpmFlash(firstPad + 2, scaleColorsRgb[2], deckRgb);
          }, true);
        }
      }
      // flashing for one and a quarter speed
      for (let i = 0; i < LaunchpadProMK3.inNextBeatFor1_25[deckNum].length; i++) {
        let samplePos = LaunchpadProMK3.inNextBeatFor1_25[deckNum][i]
        // let now = engine.getValue(`[Channel${deckNum}]`, "playposition")
        // let currentPosition = nowSamplePosition + samplePos * length;
        let msFromNow = Math.max(10, (samplePos - nowSamplePosition) / samplesPerMs);
        DEBUG("Timer for 1.25 BPM: " + msFromNow + "ms");
        if (msFromNow > 0 && msFromNow < 3000) { // Sanity check - don't set timers too far in advance
          LaunchpadProMK3.bpmTimerFor1_25[deckNum][i] = engine.beginTimer(msFromNow, function () {
            LaunchpadProMK3.bpmFlash(firstPad + 3, scaleColorsRgb[5], deckRgb);
          }, true);
        }
      }
      // flashing for a third faster
      for (let i = 0; i < LaunchpadProMK3.inNextBeatFor1_333[deckNum].length; i++) {
        let samplePos = LaunchpadProMK3.inNextBeatFor1_333[deckNum][i]
        // let now = engine.getValue(`[Channel${deckNum}]`, "playposition")
        // let currentPosition = nowSamplePosition + samplePos * length;
        let msFromNow = Math.max(10, (samplePos - nowSamplePosition) / samplesPerMs);
        DEBUG("Timer for 1.333 BPM: " + msFromNow + "ms");
        if (msFromNow > 0 && msFromNow < 3000) { // Sanity check - don't set timers too far in advance
          LaunchpadProMK3.bpmTimerFor1_333[deckNum][i] = engine.beginTimer(msFromNow, function () {
            LaunchpadProMK3.bpmFlash(firstPad + 4, scaleColorsRgb[6], deckRgb);
          }, true);
        }
      }
      // flashing for double speed
      for (let i = 0; i < LaunchpadProMK3.inNextBeatFor1_5[deckNum].length; i++) {
        let samplePos = LaunchpadProMK3.inNextBeatFor1_5[deckNum][i]
        // let now = engine.getValue(`[Channel${deckNum}]`, "playposition")
        // let currentPosition = nowSamplePosition + samplePos * length;
        let msFromNow = Math.max(10, (samplePos - nowSamplePosition) / samplesPerMs);
        DEBUG("Timer for 1.5 BPM: " + msFromNow + "ms");
        if (msFromNow > 0 && msFromNow < 3000) { // Sanity check - don't set timers too far in advance
          LaunchpadProMK3.bpmTimerFor1_5[deckNum][i] = engine.beginTimer(msFromNow, function () {
            LaunchpadProMK3.bpmFlash(firstPad + 5, scaleColorsRgb[7], deckRgb);
          }, true);
        }
      }
    }
  })

  DEBUG("# reconnect to group", C.G, 1);
  // Set the group properties of the above Components and connect their output callback functions
  this.reconnectComponents(function (c) {
    if (c.group === undefined) {
      // 'this' inside a function passed to reconnectComponents refers to the ComponentContainer
      // so 'this' refers to the custom Deck object being constructed
      c.group = this.currentDeck;
    }
    DEBUG("reconnectComponents" + C.RE + " to current group if group undefined;    group " + C.O + c.group + C.RE + " / this.currentDeck " + C.O + this.currentDeck, C.O, 0, 1);
  });
}


LaunchpadProMK3.stopAllBpmTimers = function () {
  for (let deckNum = 0; deckNum < LaunchpadProMK3.totalDecks; deckNum++) {

    if (LaunchpadProMK3.bpmTimerFor0_5[deckNum]) {
      for (let i = 0; i < LaunchpadProMK3.bpmTimerFor0_5[deckNum].length; i++) {
        if (LaunchpadProMK3.bpmTimerFor0_5[deckNum][i]) {
          engine.stopTimer(LaunchpadProMK3.bpmTimerFor0_5[deckNum][i]);
          LaunchpadProMK3.bpmTimerFor0_5[deckNum][i] = null;
        }
      }
      LaunchpadProMK3.bpmTimerFor0_5[deckNum] = [];
    }
    if (LaunchpadProMK3.bpmTimerFor0_666[deckNum]) {
      for (let i = 0; i < LaunchpadProMK3.bpmTimerFor0_666[deckNum].length; i++) {
        if (LaunchpadProMK3.bpmTimerFor0_666[deckNum][i]) {
          engine.stopTimer(LaunchpadProMK3.bpmTimerFor0_666[deckNum][i]);
          LaunchpadProMK3.bpmTimerFor0_666[deckNum][i] = null;
        }
      }
      LaunchpadProMK3.bpmTimerFor0_666[deckNum] = [];
    }
    if (LaunchpadProMK3.bpmTimerFor0_75[deckNum]) {
      for (let i = 0; i < LaunchpadProMK3.bpmTimerFor0_75[deckNum].length; i++) {
        if (LaunchpadProMK3.bpmTimerFor0_75[deckNum][i]) {
          engine.stopTimer(LaunchpadProMK3.bpmTimerFor0_75[deckNum][i]);
          LaunchpadProMK3.bpmTimerFor0_75[deckNum][i] = null;
        }
      }
      LaunchpadProMK3.bpmTimerFor0_75[deckNum] = [];
    }

    if (LaunchpadProMK3.bpmTimerFor1_25[deckNum]) {
      for (let i = 0; i < LaunchpadProMK3.bpmTimerFor1_25[deckNum].length; i++) {
        if (LaunchpadProMK3.bpmTimerFor1_25[deckNum][i]) {
          engine.stopTimer(LaunchpadProMK3.bpmTimerFor1_25[deckNum][i]);
          LaunchpadProMK3.bpmTimerFor1_25[deckNum][i] = null;
        }
      }
      LaunchpadProMK3.bpmTimerFor1_25[deckNum] = [];
    }
    if (LaunchpadProMK3.bpmTimerFor1_333[deckNum]) {
      for (let i = 0; i < LaunchpadProMK3.bpmTimerFor1_333[deckNum].length; i++) {
        if (LaunchpadProMK3.bpmTimerFor1_333[deckNum][i]) {
          engine.stopTimer(LaunchpadProMK3.bpmTimerFor1_333[deckNum][i]);
          LaunchpadProMK3.bpmTimerFor1_333[deckNum][i] = null;
        }
      }
      LaunchpadProMK3.bpmTimerFor1_333[deckNum] = [];
    }
    if (LaunchpadProMK3.bpmTimerFor1_5[deckNum]) {
      for (let i = 0; i < LaunchpadProMK3.bpmTimerFor1_5[deckNum].length; i++) {
        if (LaunchpadProMK3.bpmTimerFor1_5[deckNum][i]) {
          engine.stopTimer(LaunchpadProMK3.bpmTimerFor1_5[deckNum][i]);
          LaunchpadProMK3.bpmTimerFor1_5[deckNum][i] = null;
        }
      }
      LaunchpadProMK3.bpmTimerFor1_5[deckNum] = [];
    }
  }
  // Reset all flash steps to stop the flashing behavior
  for (let pad = 11; pad <= 88; pad++) {
    LaunchpadProMK3.bpmFlashStep[pad] = 0;
    
    // Also stop any active flash timers
    if (LaunchpadProMK3.bpmFlashTimers && LaunchpadProMK3.bpmFlashTimers[pad]) {
      DEBUG("Stopping flash timer for pad " + pad + " in stopAllBpmTimers");
      engine.stopTimer(LaunchpadProMK3.bpmFlashTimers[pad]);
      LaunchpadProMK3.bpmFlashTimers[pad] = null;
    }
  }
  
  // Ensure we reset the flash timer array completely
  LaunchpadProMK3.bpmFlashTimers = {}; // Changed from [] to {} since we're using object with keys
  LaunchpadProMK3.bpmFlashStep = {}; // Reset steps too
  DEBUG("All bpm flash timers stopped and reset.");
}

LaunchpadProMK3.Deck.prototype = new components.Deck();

//// End of Deck object setup



//// Page functions


// Handle switching pages
LaunchpadProMK3.selectPage = function (page) {
  // find target page if none provided
  if (page === undefined) {
    page = (+LaunchpadProMK3.currentPage + 1) % 7;
    DEBUG("## page undefined, selectPage setting page to " + C.O + page + 1, C.O, 2);
  }

  DEBUG("#### " + C.RE + "switching page from " + C.O + (+LaunchpadProMK3.currentPage + 1) + C.RE + " to " + C.O + (+page + 1), C.G, 2);
  LaunchpadProMK3.currentPage = page;

  // Clean up all animation timers when leaving BPM scaling page
  if (LaunchpadProMK3.currentPage !== 2) {
    DEBUG("Switching away from BPM scaling page, cleaning up all timers");
    // Clean up all animation timers for all decks
    LaunchpadProMK3.stopAllBpmTimers();
  }

  if (page === 0) {
    LaunchpadProMK3.updateHotcuePage();
  }
  else if (page === 1) {
    LaunchpadProMK3.updateBeatjumpPage();
  }
  else if (page === 2) {
    LaunchpadProMK3.updateBpmScalePage();
  }
  else if (page === 3) {
    LaunchpadProMK3.updateLoopPage();
  }
  else if (page === 4) { 
    LaunchpadProMK3.updateReverseLoopPage(); 
  }
  else if (page === 5) { 
    LaunchpadProMK3.updateLoopExtrasPage(); 
  }
  else if (page === 6) { 
    LaunchpadProMK3.updateOneDeckPage(); 
  }

  LaunchpadProMK3.lightUpRow2()

  DEBUG("leaving selectPage..", C.R, 1, 1)

  DEBUG(JSON.stringify(LaunchpadProMK3.deck.config))
};


LaunchpadProMK3.clearBeatConnections = function () {
  if (LaunchpadProMK3.beatConnections && LaunchpadProMK3.beatConnections.length > 0) {
    DEBUG("Clearing " + LaunchpadProMK3.beatConnections.length + " beat connections");
    // Disconnect each connection
    for (let i = 0; i < LaunchpadProMK3.beatConnections.length; i++) {
      let conn = LaunchpadProMK3.beatConnections[i];
      if (conn) {
        engine.disconnectControl(conn.group, conn.control, conn.callback);
        DEBUG("Disconnected " + conn.group + "." + conn.control);
      }
    }
    // Clear the array
    LaunchpadProMK3.beatConnections = [];
  };
};


// Update main and side pad lights for a specific deck
LaunchpadProMK3.updateHotcueLights = function (deck) {
  DEBUG(JSON.stringify(deck))
  DEBUG(JSON.stringify(LaunchpadProMK3.deck.config))
  DEBUG(JSON.stringify(LaunchpadProMK3.deck.config[deck]))
  let deckColour = LaunchpadProMK3.deck.config[deck].colour;
  if (deckColour === undefined) {
    deckColour = 0x444444;
  }
  // hotcues
  let colourSpecMulti = [];
  let deckLoaded = engine.getValue(`[Channel${deck}]`, "track_loaded")
  DEBUG("## update hotcue lights for " + C.RE + "deck " + C.O + deck + C.RE + "   deckColour " + C.O + "#" + deckColour.toString(16).padStart(6, "0").toUpperCase() + C.RE + "   totalDeckHotcuePads " + C.O + totalDeckHotcuePads + C.RE + "   deckLoaded " + C.O + deckLoaded, C.G, 1);

  // go through the hotcues one by one
  for (let i = 1; i <= totalDeckHotcuePads; i += 1) {
    padAddress = LaunchpadProMK3.decks[deck].pads[i - 1];
    if (LaunchpadProMK3.currentPage === 6) { padAddress = LaunchpadProMK3.decks[4].pads[i - 1]; }
    if (deckLoaded !== 1) {
      // if deck unloaded, dim deck colour
      deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
      deckRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, deckUnloadedDimscale)

    } else if (deckLoaded === 1) {
      // is the hotcue enabled?
      hotcueEnabled = engine.getValue(`[Channel${deck}]`, `hotcue_${i}_status`);
      if (hotcueEnabled === 1) {
        // if so, get it's colour
        hotcueColour = engine.getValue(`[Channel${deck}]`, `hotcue_${i}_color`);
        deckRgb = LaunchpadProMK3.hexToRGB(hotcueColour);
        debugHotcueEnabled = "   hotcueEnabled " + C.O + hotcueEnabled + C.RE + "   hotcueColour " + C.O + "#" + hotcueColour.toString(16).padStart(6, "0").toUpperCase();
      } else if (hotcueEnabled !== 1) {
        // if no hotcue, set pad to somewhat dimmed deck colour
        deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
        deckRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, deckLoadedDimscale);
        debugHotcueEnabled = "   hotcueEnabled " + C.R + "0   deckColour " + C.O + "#" + deckColour.toString(16).padStart(6, "0").toUpperCase() + C.RE + "   deckRgb " + deckRgb;
      }
      DEBUG("d " + C.O + deck + C.RE + "   i " + C.O + i + C.RE + "   padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + debugHotcueEnabled, C.RE)
    }
    colourSpecMulti = colourSpecMulti.concat([0x03, padAddress, Math.floor(deckRgb[0] / 2), Math.floor(deckRgb[1] / 2), Math.floor(deckRgb[2] / 2)]);
    //colourSpecMulti = colourSpecMulti.concat([ 0x03, padAddress, deckRgb[0], deckRgb[1], deckRgb[2] ]);
  }

  DEBUG("# finished creating pad address sysex msg, sending...", C.O, 1);
  LaunchpadProMK3.sendSysEx([0x03].concat(colourSpecMulti));
  DEBUG("end updating main pads", C.R, 1, 1);

  // Sidebar, to blue and off
  DEBUG("## update sidepad lights" + C.RE + " for deck " + C.O + deck, C.G);
  for (i = 1; i <= 4; i += 1) {
    let sidepad = (deck) * 4 + i;
    //let padAddress = LaunchpadProMK3.sidepads[sidepad];
    let padAddress = LaunchpadProMK3.decks[deck].deckSidepadAddresses[i - 1];
    if (LaunchpadProMK3.currentPage === 6) { padAddress = LaunchpadProMK3.sidepads[11 + i] };
    let sidepadControlName = LaunchpadProMK3.sidepadNames[i - 1];
    let sidepadEnabled = engine.getValue(`[Channel${deck}]`, `${sidepadControlName}enabled`);
    if (sidepadEnabled === 1) {
      DEBUG("d " + C.O + deck + C.RE + "   i " + C.O + i + C.RE + "   sidepad " + C.O + sidepad + C.RE + "   padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   control " + C.O + sidepadControlName + C.G + "activate");
      LaunchpadProMK3.trackWithIntroOutro(1, deck, padAddress);
    } else {
      LaunchpadProMK3.trackWithIntroOutro(0, deck, padAddress);
    }
  }
  DEBUG("end updating sidepads", C.R, 0, 1);
};






LaunchpadProMK3.gradientSetup = function (deck, altpos, gradStartA, gradEndA, gradStartB, gradEndB) {
  let deckColour = LaunchpadProMK3.decks[deck].deckColour;
  //let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
  DEBUG("deck " + deck + "   deckColour #" + deckColour + "   deckRgb " + deckRgb, C.G, 1);
  deckLoaded = engine.getValue(`[Channel${deck}]`, "track_loaded");
  let gradLength = totalDeckHotcuePads / 2
  let gradA = LaunchpadProMK3.gradientCalculate(gradStartA, gradEndA, gradLength);
  let gradB = LaunchpadProMK3.gradientCalculate(gradStartB, gradEndB, gradLength);
  let gradBoth = gradA.concat(gradB);
  DEBUG("  gradBoth " + C.O + gradBoth + C.RE + "   len " + C.O + gradBoth.length);
  if (altpos === undefined) { altpos = 1 }
  let pads = ""
  if (LaunchpadProMK3.currentPage !== 6) {
    pads = LaunchpadProMK3.decks[deck].pads;
  } else {
    pads = LaunchpadProMK3.decks[altpos].pads;
  }
  DEBUG(pads)
  for (let pad of pads) {
    let toSend = gradBoth.shift();
    DEBUG(toSend)
    if (deckLoaded !== 1) { toSend = LaunchpadProMK3.darkenRGBColour(toSend, deckLoadedDimscale) }
    DEBUG("  gradBoth " + C.O + gradBoth + C.RE + "   len " + C.O + gradBoth.length);
    let r = toSend[0];
    let g = toSend[1];
    let b = toSend[2];
    DEBUG("toSend " + toSend + "    pad " + pad + "   r " + r + "  g " + g + "   b " + b, C.O);
    LaunchpadProMK3.sendRGB(pad, r, g, b);
  };
}

LaunchpadProMK3.gradientCalculate = function (color1, color2, steps) {
  const gradient = [];
  for (let i = 0; i < steps; i++) {
    let scale = i / (steps - 1);
    let r = Math.round(color1[0] * (1 - scale) + color2[0] * scale);
    let g = Math.round(color1[1] * (1 - scale) + color2[1] * scale);
    let b = Math.round(color1[2] * (1 - scale) + color2[2] * scale);
    DEBUG(`${r},${g},${b}`);
    gradient.push([r, g, b]);
  }
  return gradient;
};



//// Single pad light functions


// Helper function to convert RGB hex value to individual R, G, B values
LaunchpadProMK3.hexToRGB = function (hex) {
  // If it's already an array, return it
  if (Array.isArray(hex)) {
    return hex;
  }
  //DEBUG("hexToRGB #" + hex)
  var r = (hex >> 16) & 0xFF;
  var g = (hex >> 8) & 0xFF;
  var b = hex & 0xFF;
  //DEBUG("rgb " + [r, g, b]);
  return [r, g, b];
};


function interleave(arr, arr2) {
  let newArr = [];
  for (let i = 0; i < arr.length; i++) {
    newArr.push(arr[i], arr2[i]);
  }
  return newArr;
};


// Send RGB values to a single pad
LaunchpadProMK3.sendRGB = function (pad, r, g, b) {
  DEBUG(" sendRGB>>   r " + C.O + r + C.RE + "   g " + C.O + g + C.RE + "   b " + C.O + b);
  if (g === undefined  && r !== undefined) {
   b = r[2];
   g = r[1];
   r = r[0];
  }
  if (r === undefined) rgb = [0, 0, 0];
  //DEBUG("   r " +C.O+ r +C.RE+ "   g " +C.O+ g +C.RE+ "   b " +C.O+ b);
  r = Math.floor(r / 2)
  g = Math.floor(g / 2)
  b = Math.floor(b / 2)
  //DEBUG("pad " +C.O+ pad +C.RE+ "   r " +C.O+ r +C.RE+ "   g " +C.O+ g +C.RE+ "   b " +C.O+ b);
  LaunchpadProMK3.sendSysEx([0x03, 0x03, pad, r, g, b]);
};

LaunchpadProMK3.sendHEX = function (pad, hex) {
  var r = (hex >> 16) & 0xFF;
  var g = (hex >> 8) & 0xFF;
  var b = hex & 0xFF;
  //divided by two becaure MIDI is 0-127
  LaunchpadProMK3.sendSysEx([0x03, 0x03, pad, Math.floor(r / 2), Math.floor(g / 2), Math.floor(b / 2)]);
};


// Darken an RGB colour by ratio
LaunchpadProMK3.darkenRGBColour = function (rgbIn, ratio) {
  if (ratio === undefined) { DEBUG("LaunchpadProMK3.darkenRGBColour   darken ratio undefined, so ratio = 0.2"); ratio = 0.2, C.O }
  // Clamp the ratio between 0 and 1
  ratio = Math.max(0, Math.min(1, ratio));
  // Apply non-linear scaling (square the ratio for better sensitivity)
  ratioNu = +(ratio ** 2).toFixed(4);
  let rgb = [];
  let debugMiddle = "";
  rgb[0] = Math.round(rgbIn[0] * ratioNu);
  rgb[1] = Math.round(rgbIn[1] * ratioNu);
  rgb[2] = Math.round(rgbIn[2] * ratioNu);
  if (rgbIn[0] > 127 || rgbIn[1] > 127 || rgbIn[2] > 127) { debugMiddle = C.R + "   OOVVEERR 127!" + C.RE }
  //DEBUG(" LaunchpadProMK3.darkenRGBColour()    " +C.RE+ "scale " +C.O+ ratio +C.RE+ "   ratioNu " +C.O+ ratioNu+C.RE+ "   page " +C.O+ LaunchpadProMK3.currentPage +C.RE+ "   rgb in " +C.O+ rgbIn +C.RE+ debugMiddle + "   rgb out " +C.O+ rgb, C.G);
  return rgb;
}
// Apply the darkening factor
//  return [
//    Math.round(rgb[0] * factor),
//    Math.round(rgb[1] * factor),
//    Math.round(rgb[2] * factor)
//  ];
//};
// Turn off pad LEDs
//LaunchpadProMK3.turnOffPad = function(pad, rgb) {
//  //LaunchpadProMK3.sendRGB(pad, 0, 0, 0)
//  if (rgb === undefined) rgb = [ 0, 0, 0 ];
//  LaunchpadProMK3.sendRGB(pad, rgb[0], rgb[1], rgb[2]);
//};

// Turn a sidepad colour to blue or off
LaunchpadProMK3.trackWithIntroOutro = function (value, deckNum, padAddress) {
  //DEBUG("## trackWithIntroOutro    value " + value + ", padAddress " + padAddress);
  if (value > 0) {
    LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0xFF);
  } else {
    LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0x00);
  }
};




//// Multiple pad light functions


// sidepad deck colours
LaunchpadProMK3.sidepadDeckColour = function (d) {
  DEBUG("LaunchpadProMK3.sidepadDeckColour()", C.G, 2)
  DEBUG("d " + d, C.O);

  let deckPosition = LaunchpadProMK3.deck.config[d].order;
  let deckColour = LaunchpadProMK3.deck.config[d].colour;
  let deckSidepadsStart = ((deckOrder - 1) * 4);
  DEBUG("deckSidepadsStart " + deckSidepadsStart, C.O);

  // get hard copy of array of sidepad addresses for deck position
  const sidepads = LaunchpadProMK3.sidepads.slice(deckSidepadsStart, deckSidepadsStart + 4);
  DEBUG("sidepads " + sidepads, C.O);

  let nextAddress = sidepads.shift(); // cut next LED address from sidepad list
  DEBUG(nextAddress);
  LaunchpadProMK3.sendHEX(nextAddress, deckColour); // Set the color for current deck LED
  let next2Address = sidepads.shift();
  DEBUG(next2Address, C.R);
  LaunchpadProMK3.sendHEX(next2Address, deckColour); // Set the color for current deck LED
  let next3Address = sidepads.shift(); // Get LED address for this index
  DEBUG(next3Address, C.O);
  LaunchpadProMK3.sendHEX(next3Address, deckColour); // Set the color for current deck LED
  let next4Address = sidepads.shift();
  DEBUG(next4Address, C.G);
  LaunchpadProMK3.sendHEX(next4Address, deckColour); // Set the color for current deck LED
  DEBUG("extras side colour deck " + d + "   nextAddress " + nextAddress, C.O, 0, 2);
}


// Select deck and change LEDs
LaunchpadProMK3.selectDeck = function (deckNum) {
  DEBUG("### selecting deck " + deckNum, C.G, 3);
  // remember selection
  LaunchpadProMK3.selectedDeck = deckNum
  Object.entries(LaunchpadProMK3.deck.config).forEach((d) => {
    DEBUG(d[1].colour)
    let deckRgb = LaunchpadProMK3.hexToRGB(d[1].colour);
    DEBUG("d " + JSON.stringify(d) + "   deckNum " + deckNum + "   deckRgb " + deckRgb + "   hex " + "#" + d[1].colour.toString(16), C.R);
    if (+d[0] !== deckNum) {
      deckRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, deckUnloadedDimscale);
    }
    DEBUG(100 + d[1].order)
    DEBUG(deckRgb)
    LaunchpadProMK3.sendRGB(100 + d[1].order, deckRgb);
    if (+d[0] === deckNum) {
      LaunchpadProMK3.sendRGB(hotcueCreationButton, deckRgb);
    }
  });
  if (LaunchpadProMK3.currentPage === 6) {
    LaunchpadProMK3.updateOneDeckPage()
  }
};


// LEDs for changing page
LaunchpadProMK3.lightUpRow2 = function () {
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[0], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[1], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[2], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[3], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[4], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[5], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[6], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[0] + LaunchpadProMK3.currentPage, 127, 0, 20);
};



// Track load/unload reaction
LaunchpadProMK3.onTrackLoadedOrUnloaded = function (value, deckNum) {
  DEBUG((value === 1 ? `###  Track loaded on deck ${deckNum}` : `###  Track unloaded from deck ${deckNum}`), C.G, 2);

  LaunchpadProMK3.updateCurrentPage()
  LaunchpadProMK3.bpmFlashStepInit()

  DEBUG("track load/unload per page action fin....", C.R, 1, 2)
}


// refresh whatever the current page is3
LaunchpadProMK3.updateCurrentPage = function () {
  DEBUG("LaunchpadProMK3.updateCurrentPage()", C.R, 1, 2)
  switch (LaunchpadProMK3.currentPage) {
    case 0:
      DEBUG("LaunchpadProMK3.updateHotcuePage()")
      LaunchpadProMK3.updateHotcuePage();
      DEBUG("leaving LaunchpadProMK3.updateHotcuePage()")
      break;
    case 1:
      DEBUG("LaunchpadProMK3.updateBeatjumpPage()")
      LaunchpadProMK3.updateBeatjumpPage();
      DEBUG("leaving LaunchpadProMK3.updateBeatjumpPage()")
      break;
    case 2:
      DEBUG("LaunchpadProMK3.updateBpmScalePage()")
      LaunchpadProMK3.updateBpmScalePage();
      DEBUG("leaving LaunchpadProMK3.updateBpmScalePage()")
      break;
    case 3:
      DEBUG("LaunchpadProMK3.updateLoopPage()")
      LaunchpadProMK3.updateLoopPage();
      DEBUG("leaving LaunchpadProMK3.updateLoopPage()")
      break;
    case 4:
      DEBUG("LaunchpadProMK3.updateReverseLoopPage()")
      LaunchpadProMK3.updateReverseLoopPage();
      DEBUG("leaving LaunchpadProMK3.updateReverseLoopPage()")
      break;
    case 5:
      DEBUG("LaunchpadProMK3.updateLoopExtrasPage()")
      LaunchpadProMK3.updateLoopExtrasPage();
      DEBUG("leaving LaunchpadProMK3.updateLoopExtrasPage()")
      break;
    case 6:
      DEBUG("LaunchpadProMK3.updateOneDeckPage()")
      // Add any additional logic if needed
      break;
    default:
      DEBUG("Unknown page: " + LaunchpadProMK3.currentPage);
  }
  DEBUG("leaving LaunchpadProMK3.updateCurrentPage()")
}



//// Other hotcue helper functions


LaunchpadProMK3.undoLastHotcue = function () {
  DEBUG("####################### undooooo", C.G, 1);
  // Check that a hotcue has been created
  //if (LaunchpadProMK3.lastHotcue[0] === undefined) { return; }
  // Deserialise the hotcue to undo away
  let popped = LaunchpadProMK3.lastHotcue.shift();
  if (popped === undefined) { DEBUG("no undo stack"); return }
  DEBUG("## popped:  " + popped, C.O, 1);
  DEBUG("## LaunchpadProMK3.lastHotcue:  " + LaunchpadProMK3.lastHotcue, C.G, 1);
  DEBUG("## LaunchpadProMK3.redoLastDeletedHotcue:  " + LaunchpadProMK3.redoLastDeletedHotcue, C.G);
  let channel = popped[0];
  // Deserealise array
  let control = popped[1];
  let padAddress = popped[2];
  let deckNum = popped[3];
  DEBUG("## undoLastHotcue:   cont  " + control + ",   channel  " + channel + ",   deck  " + deckNum + ",   pad " + padAddress, C.O);
  let colour
  // Clear hotcue
  // Common JS func to toggle a control on then off again
  script.triggerControl(channel, control + "_clear", 64);
  // Add undone hotcue to redo list, in case
  LaunchpadProMK3.redoLastDeletedHotcue.unshift(popped);
  DEBUG("## LaunchpadProMK3.redoLastDeletedHotcue:  " + LaunchpadProMK3.redoLastDeletedHotcue);
  // Reset pad colour to deck colour
  LaunchpadProMK3.sendHEX(padAddress, LaunchpadProMK3.decks[deckNum].colour);
  LaunchpadProMK3.updateHotcuePage();
  DEBUG("leaving undoLastHotcue..", C.R, 1, 1)
};


LaunchpadProMK3.redoLastHotcue = function () {
  DEBUG("REDO", C.R, 1, 1);
  // Check if a hotcue has been undone
  if (LaunchpadProMK3.redoLastDeletedHotcue[0] === undefined) { return; }
  // Get the undone hotcue to redo
  let unpopped = LaunchpadProMK3.redoLastDeletedHotcue.shift();
  DEBUG("## unpopped:  " + unpopped, C.O, 1);
  DEBUG("## LaunchpadProMK3.redoLastDeletedHotcue:  " + LaunchpadProMK3.redoLastDeletedHotcue, C.O, 1);
  // Deserialise the hotcue to redo
  let channel = unpopped[0];
  let control = unpopped[1];
  let padAddress = unpopped[2];
  let deckNum = unpopped[3];
  let colour = unpopped[4];
  DEBUG("### redoLastHotcue:   cont; " + control + ",   chan; " + channel + ",   deck; " + deckNum + ",   pad;" + padAddress + "   colour " + colour);
  // Activate the hotcue to undelete it
  script.triggerControl(channel, control + "_activate", 64);
  // Add redone hotcue back to undo stack again
  LaunchpadProMK3.lastHotcue.unshift([channel, control, padAddress, deckNum]);
  DEBUG("## LaunchpadProMK3.lastHotcue:  " + LaunchpadProMK3.lastHotcue);
  LaunchpadProMK3.updateHotcuePage();
  DEBUG("leaving redoLastHotcue..", C.R, 1, 1)
};


// To add time between steps in multi hotcue function
LaunchpadProMK3.sleep = function (time) {
  let then = Date.now();
  while (true) {
    let now = Date.now();
    if (now - then > time) {
      break;
    };
  };
};



lastHotcueCreationTime = "";

leadupCues = {
  "1": { control: "beatjump_128_backward", colour: 0x1DBEBD }, //teal
  "2": { control: "beatjump_64_forward", colour: 0x8DC63F }, //green
  "3": { control: "beatjump_32_forward", colour: 0xf8d200 }, //yellow
  "4": { control: "beatjump_16_forward", colour: 0xff8000 }, //orange
  "5": { control: "beatjump_16_forward", colour: 0xEF1441 } //red
}


function isCloseEnough(array, num, precision = 2) {
  return array.some(n => Math.abs(n - num) < Math.pow(10, -precision));
}


LaunchpadProMK3.create4LeadupDropHotcues = function (deck, value) {
  DEBUG(`## create hotcues  ${C.Y} -128 -64 -32 -16 ${C.R}drop ${C.RE}on ${C.O}${deck}`, C.G, 2);
  if (value === 0 || value === undefined) return 0;
  group = `[Channel${deck}]`;

  // what time is it right now?
  let now = Date.now()
  // is now at least a second after the last time?
  if (now < (lastHotcueCreationTime + 1000)) {
    DEBUG("DENIED   " + lastHotcueCreationTime + "   " + now, C.R);
    return
  }
  // record now as the new lastwhat is the time right now?
  lastHotcueCreationTime = now
  // how long is the track in samples?
  let samplesTotal = engine.getValue(group, "track_samples");

  let hotcuePositions = [];
  // get the first twenty hotcue positions, store in an array
  for (let h = 0; h <= 19; h++) {
    hotcuePositions[h] = engine.getValue(group, "hotcue_" + (+h + 1) + "_position")
    //if (hotcuePositions[h]) hotcueRightmost = h;
  }
  DEBUG("hotcuePositions  creation " + C.O + hotcuePositions, C.G)

  // for each of the controls in the object;
  DEBUG("leadupCues " + C.O + JSON.stringify(leadupCues));
  for (const number of Object.entries(leadupCues)) {
    DEBUG(JSON.stringify(number))
    DEBUG("number " + C.O + number[1].control)
    let control = number[1].control
    let colour = number[1].colour
    DEBUG(`control ${C.O}${control}${C.RE}   colour ${C.O}#${colour.toString(16)}`, C.G, 1)
    // perform it
    engine.setValue(group, control, 1)
    // pause so the jump takes effect
    // LaunchpadProMK3.sleep(100);
    // how far through the track is ther, between 0-1
    playPosition = engine.getValue(group, "playposition");
    // if it's before 0, aka the start of the track then..
    DEBUG("playPosition " + C.O + playPosition)
    if (playPosition <= 0) {
      // do nothing in this loop round
      DEBUG("doo nowttt", C.O)
    } else if (0 < playPosition) {
      // find the first unused hotcue
      DEBUG("hotcuePositions mid " + C.O + hotcuePositions)
      // how many samples into the track right now?
      samplesNow = samplesTotal * playPosition;
      DEBUG("samplesNow " + C.O + samplesNow)
      // has this sample position got a hotcue already?
      //if (!hotcuePositions.includes(samplesNow)) {
      if (!isCloseEnough(hotcuePositions, samplesNow, 3)) {
        hotcueSpace = hotcuePositions.findIndex((hotcueSpaceFree) => hotcueSpaceFree === -1)
        DEBUG("hotcueSpace " + C.O + hotcueSpace)
        // if there is no hotcue space then give up
        if (hotcueSpace === -1) { DEBUG("no hotcue space", C.R); return }
        // colate control
        hotcueSpaceTitle = "hotcue_" + (hotcueSpace + 1)
        DEBUG("hotcueSpaceTitle " + C.O + hotcueSpaceTitle)
        // create new hotcue
        engine.setValue(group, hotcueSpaceTitle + "_set", 1);
        // give that hotcue its colour
        engine.setValue(group, hotcueSpaceTitle + "_color", colour); // green
        // what is its pad?
        DEBUG("LaunchpadProMK3.decks[deck].deckMainSliceStartIndex " + C.O + LaunchpadProMK3.decks[deck].deckMainSliceStartIndex)
        pad = LaunchpadProMK3.decks[deck].deckMainSliceStartIndex + hotcueSpace;
        DEBUG("pad " + C.O + pad)
        // add to undo list
        LaunchpadProMK3.lastHotcue.unshift([group, hotcueSpaceTitle, pad, deck, colour]);

        // add to existing check
        hotcuePositions[hotcueSpace] = samplesNow;
        DEBUG("hotcuePositions end " + C.O + hotcuePositions, C.R, 0, 1)
      }
    }
  };

  //for (let X = hotcueRightmost; X <= 19; X++) {
  //  LaunchpadProMK3.sleep(25);

  DEBUG("# end multi hotcue creation", C.R, 0, 2);
};


//LaunchpadProMK3.wavezoomAll = function wavezoomAll(value){
//  const range = 60 - 1;
//  var newValue = Math.round(1+((value / 127) * range));
//  if (newValue > 60) { newValue = 60; }
//  if (newValue < 1) newValue = 1;
//  if (LaunchpadProMK3.lastwavevalue !== value) :{
//    for (var i=1; i<9; i++){
//      engine.setValue(LaunchpadProMK3.Deck[i], "waveform_zoom", newValue);
//    };
//  }
//  LaunchpadProMK3.lastwavevalue = value;
//}
//
//midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[0], (channel, control, value, status, _group) => {
//  if (value !== 0) { LaunchpadProMK3.selectDeck(3); }
//});
//LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[0], 0xd7, 0x00, 0xd7); // bright
//

//getFunctionName = function getFunctionName() { //return name of calling function
//  var re = /function (.*?)\(/
//    var s = NK2.getFunctionName.caller.toString();
//    var m = re.exec(s) ;
//  };
//
//LaunchpadProMK3.doNothing = function doNothing(){//dummy function - do nothing
//  if (NK2.debug>2){print("##function: "+NK2.getFunctionName())};
//  return false;
//};

LaunchpadProMK3.wheelTurn = function (channel, control, value, status, group) {
  let mod = ""
  if (value > 64) mod = 32;
  const newValue = value + 64 - mod;
  const deck = parseInt(group.substr(8, 1), 10);
  // In either case, register the movement
  if (engine.isScratching(deck)) {
    engine.scratchTick(deck, newValue); // Scratch!
  } else {
    engine.setValue(group, "jog", newValue / 5); // Pitch bend
  }
};



/// First page (0)


// Function to update pad lights for each hotcue
LaunchpadProMK3.updateHotcuePage = function (deck) {
  if (LaunchpadProMK3.currentPage === 0) {
    DEBUG("  ");
    DEBUG("                              .o8                .                                                                   .oooo.   ", C.M);
    DEBUG("                             '888              .o8                                                                  d8P'`Y8b  ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.       oo.ooooo.   .oooo.    .oooooooo  .ooooo.       888    888 ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b       888' `88b `P  )88b  888' `88b  d88' `88b      888    888 ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888       888   888  .oP'888  888   888  888ooo888      888    888 ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o       888   888 d8(  888  `88bod8P'  888    .o      `88b  d88' ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'       888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'       `Y8bd8P'  ", C.M);
    DEBUG("              888                                                    888                 d'     YD                            ", C.M);
    DEBUG("             o888o                                                  o888o                 'Y88888P'                           ", C.M);
    DEBUG("  ");
    DEBUG(" LaunchpadProMK3.updateHotcuePage() ", C.B);
    DEBUG("### set/refresh hotcue page, deck " + deck, C.M);
    if (deck === undefined) {
      DEBUG("## deck undefined = updating all decks..", C.O, 1);
      DEBUG(JSON.stringify(deck));
      DEBUG(JSON.stringify(LaunchpadProMK3.deck.config));
      DEBUG(JSON.stringify(LaunchpadProMK3.deck.config[deck]));
      LaunchpadProMK3.updateHotcueLights(1);
      LaunchpadProMK3.updateHotcueLights(2);
      if (totalDecks === 4) {
        LaunchpadProMK3.updateHotcueLights(3);
        LaunchpadProMK3.updateHotcueLights(4);
      }
      DEBUG("end updating decks", C.R, 0, 1);
    } else {
      DEBUG("## updating " + deck, C.G);
      LaunchpadProMK3.updateHotcueLights(deck);
      DEBUG("end updating deck", C.R, 0, 1);
    }
  }
};


/// Second page (1)

LaunchpadProMK3.beatjumpControls = [
  //"beatjump",
  // Jump forward (positive) or backward (negative) by N beats. If a loop is active, the loop is moved by X beats

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


LaunchpadProMK3.updateBeatjumpPage = function () {
  if (LaunchpadProMK3.currentPage === 1) {
    DEBUG("  ");
    DEBUG("                              .o8                .                                                                  .o  ", C.M);
    DEBUG("                             '888              .o8                                                                o888  ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.      oo.ooooo.   .oooo.    .oooooooo  .ooooo.        888  ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b      888' `88b `P  )88b  888' `88b  d88' `88b       888  ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888      888   888  .oP'888  888   888  888ooo888       888  ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o      888   888 d8(  888  `88bod8P'  888    .o       888  ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'      888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'      o888o ", C.M);
    DEBUG("              888                                                   888                 d'     YD                       ", C.M);
    DEBUG("             o888o                                                 o888o                 'Y88888P'                      ", C.M);
    DEBUG("  ");
    DEBUG("### updateBeatjumpPage", C.B, 0, 1);

    LaunchpadProMK3.clearMain();
    for (let deckNum = 1; deckNum <= totalDecks; deckNum += 1) {
      let deckColour = LaunchpadProMK3.decks[deckNum].deckColour;
      let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
      gradStartA = [20, 20, 20];
      gradEndA = [112, 112, 112];
      gradStartB = deckRgb;
      gradEndB = [127, 127, 127];
      LaunchpadProMK3.gradientSetup(deckNum, undefined, gradStartA, gradEndA, gradStartB, gradEndB);
    };
    //LaunchpadProMK3.beatjumpExtrasButtons
  }
};




/// Third page (2)


LaunchpadProMK3.bpmScaling = {
  "1": { scale: 0.5, control: "beats_set_halve", indicator: "beat_active_0_5", colour: 0x111111 },
  "2": { scale: 0.666, control: "beats_set_twothirds", indicator: "beat_active_0_666", colour: 0x343434 },
  "3": { scale: 0.75, control: "beats_set_threefourths", indicator: "beat_active_0_75", colour: 0x6a6a6a },
  "4": { scale: 1, control: "beats_undo_adjustment", indicator: "beat_active", colour: 0x331111 },
  "5": { scale: 1, control: "beats_undo_adjustment", indicator: "beat_active", colour: 0x331111 },
  "6": { scale: 1.25, control: "beats_set_fourthirds", indicator: "beat_active_1_25", colour: 0x6a6a6a },
  "7": { scale: 1.333, control: "beats_set_threehalves", indicator: "beat_active_1_333", colour: 0x343434 },
  "8": { scale: 1.5, control: "beats_set_double", indicator: "beat_active_1_5", colour: 0x111111 }
};


//// bpm scaled beat flash

LaunchpadProMK3.bpmFlashStep = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// change all main pads to deck colours

LaunchpadProMK3.bpmResetToDeck = function (deckNum) {
  //// main pads
  DEBUG("//// reset main pads of each deck to deck colour:", C.G, 1);
  for (const [deckNum, conf] of Object.entries(LaunchpadProMK3.deck.config)) {
    let deckColour = conf.colour
    let pads = LaunchpadProMK3.decks[deckNum].pads
    let deckRgb = LaunchpadProMK3.hexToRGB(deckColour)
    DEBUG(deckNum)
    DEBUG(conf.order)
    DEBUG(deckColour)
    DEBUG(deckRgb)  

    deckLoaded = engine.getValue(`[Channel${deckNum}]`, "track_loaded");
    if (deckLoaded === 1) { deckRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, deckLoadedDimscale); }
    if (deckLoaded !== 1) { deckRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, deckUnloadedDimscale); }
    pads.forEach((pad) => {
      LaunchpadProMK3.sendRGB(pad, deckRgb[0], deckRgb[1], deckRgb[2]);
    });
  }
  DEBUG("/// end resetting main pads to deck colour", C.R, 1, 2);
}

LaunchpadProMK3.bpmResetToBpm = function (deckNum) {
  if (deckNum) {
    let pads = LaunchpadProMK3.decks[deckNum].pads;
    let scaleColumn = 1;
    DEBUG("pads " + pads, C.R);
    for (let pad of pads) {
      let scaleColour = LaunchpadProMK3.bpmScaling[scaleColumn].colour;
      let scaleRgb = LaunchpadProMK3.hexToRGB(scaleColour);
      DEBUG("scaleColumn " + scaleColumn, C.R);
      DEBUG("pad " + pad, C.R);
      DEBUG("scaleColour " + scaleColour, C.R);
      DEBUG("scaleRgb " + scaleRgb, C.R);
      LaunchpadProMK3.sendRGB(pad, scaleRgb[0], scaleRgb[1], scaleRgb[2]);
      scaleColumn = scaleColumn + 1;
      if (scaleColumn === 9) scaleColumn = 1;
    }
    DEBUG("/// end resetting main pads to bpm colour", C.R, 1, 2);
    ;
  };
}




LaunchpadProMK3.updateBpmScalePage = function () {
  if (LaunchpadProMK3.currentPage === 2) {
    DEBUG("  ");
    DEBUG("                              .o8                .                                                                 .oooo.   ", C.M);
    DEBUG("                             '888              .o8                                                               .dP''Y88b  ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.      oo.ooooo.   .oooo.    .oooooooo  .ooooo.            ]8P'  ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b       888' `88b `P  )88b  888' `88b  d88' `88b         .d8P'  ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888       888   888  .oP'888  888   888  888ooo888       .dP'     ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o       888   888 d8(  888  `88bod8P'  888    .o     .oP        ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'       888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'     8888888888 ", C.M);
    DEBUG("              888                                                   888                 d'     YD                            ", C.M);
    DEBUG("             o888o                                                 o888o                 'Y88888P'                           ", C.M);
    DEBUG("  ");
    DEBUG("### updateBpmScalePage", C.B, 0, 1);
    LaunchpadProMK3.clearMain();
    DEBUG("## updateBpmScalePage after clearMain", C.B, 0, 3);

    // reset pads to deckcolour so they're ready to continue
    LaunchpadProMK3.bpmResetToDeck()
    DEBUG("end bpmResetToDeck()", C.R);

    // clear existing timers
    LaunchpadProMK3.stopAllBpmTimers();
    DEBUG("stopping any existing bpm scale timers..");

    //// Init timers for each deck
    //for (let deck=1; deck<=4; deck++) {
    //  LaunchpadProMK3.bpmTimerLoopInit(deck);
    //}

    // initialise deck check var
    let loaded = [];

    // Initialize arrays for BPM scaling
    LaunchpadProMK3.beatConnections = [];


    // Initialize pad press handlers if not already initialized
    if (!LaunchpadProMK3.onPadPressed) {
      LaunchpadProMK3.onPadPressed = {};
    }
    // for each deck
    //DEBUG("set up loops for each deck to create timers for each double-pad if they're playing");
    for (let deckNum = 1; deckNum <= 4; deckNum++) {
      DEBUG(" ############################################# deckNum " + C.O + deckNum, C.G, 1);
      // what are the pads of the deck?
      let pads = LaunchpadProMK3.decks[deckNum].pads;
      // what is the colour of the deck?
      let deckColour = LaunchpadProMK3.deck.config[deckNum].colour;
      DEBUG("deckColour " + deckColour.toString(16));
      // turn the deck colour hex value into an rgb array
      let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
      DEBUG("deckRgb " + deckRgb);
      // darken the colour of the deck so it's not distracting
      let deckRgbDim = LaunchpadProMK3.darkenRGBColour(deckRgb, deckUnloadedDimscale);
      // let deckRgbDim = deckRgb;
      // is the deck loaded? create an array with this info
      // is this deck loaded?
      let deckLoaded = engine.getValue(`[Channel${deckNum}]`, "track_loaded");
      DEBUG("deckLoaded for Channel? " + deckNum + " = " + deckLoaded);

      // if no track is loaded, make the pads dimmer but still visible
      if (deckLoaded !== 1) {
        DEBUG("deckNum " + deckNum + " deck not loaded", C.R);
        for (let i = 1; i <= 8; i++) {
          let padAddress = pads[i - 1];
          // for each pad of the deck, turn it the shaded deck colour
          LaunchpadProMK3.sendRGB(padAddress, deckRgbDim[0], deckRgbDim[1], deckRgbDim[2]);
          LaunchpadProMK3.sendRGB(padAddress - 10, deckRgbDim[0], deckRgbDim[1], deckRgbDim[2]);
        }
        return;
      } else {

        // initialize pads for loaded decks with proper colours
        for (let i = 1; i <= 8; i++) {
          // each column has two pads - top and bottom
          //let topPad = 80 - ((deckNum-1) * 20) + i;
          let topPad = pads[i - 1];
          let bottomPad = topPad - 10; // 10 is the offset to go to the row below
          // get colour for this column
          let scaleColour = LaunchpadProMK3.bpmScaling[i].colour;
          let scaleRgb = LaunchpadProMK3.hexToRGB(scaleColour);
          let scaleRgbDim = LaunchpadProMK3.darkenRGBColour(scaleRgb, 0.6); // Match the dimming level used in animation
          // initialize both pads with dim colour
          DEBUG("### INIT PAD    deckNum " + deckNum + "   column " + i + "   scaleColour " + scaleColour + " scaleRgb " + scaleRgb + "   scaleRgbDim " + scaleRgbDim, C.R);
          LaunchpadProMK3.sendRGB(topPad, scaleRgbDim[0], scaleRgbDim[1], scaleRgbDim[2]);
          LaunchpadProMK3.sendRGB(bottomPad, scaleRgbDim[0], scaleRgbDim[1], scaleRgbDim[2]);
        }

        // skip if no BPM is detected
        let bpm = engine.getValue(`[Channel${deckNum}]`, "bpm");
        if (!bpm) {
          // initialize pads for decks with no BPM as dimmed
          DEBUG("### INIT PAD    NOOO BBBPPPMMM       deckNum " + deckNum + " no BPM detected!!!", C.R);
          for (let i = 1; i <= 8; i++) {
            //let padAddress = 80 - ((deckNum-1) * 20) + i;
            let padAddress = pads[i - 1];
            let dimWhiteRgb = LaunchpadProMK3.darkenRGBColour([30, 30, 30], 0.7);
            LaunchpadProMK3.sendRGB(padAddress, dimWhiteRgb[0], dimWhiteRgb[1], dimWhiteRgb[2]);
            LaunchpadProMK3.sendRGB(padAddress - 10, dimWhiteRgb[0], dimWhiteRgb[1], dimWhiteRgb[2]);
          }
          return;
        }

        // connect the beat scale buttons to their indicator and control
        let scaleColumnNum = 1;
        step = 0;
        for (let key in LaunchpadProMK3.bpmScaling) {
          let ratio = LaunchpadProMK3.bpmScaling[key];
          //pad = 80 - ((deckNum-1) * 20) + scaleInc;
          let currentPad = pads[scaleColumnNum - 1];
          // let currentPad = pad
          let control = ratio.control;
          let indicator = ratio.indicator;
          let scaleRgb = LaunchpadProMK3.hexToRGB(ratio.colour);
          scaleColumnNum++
          DEBUG(`currentPad ${currentPad}   deckNum ${deckNum}   scaleColumnNum ${scaleColumnNum}   indicator ${indicator}   control ${control}`, C.G)
          DEBUG("   bpmFlashStep " + JSON.stringify(LaunchpadProMK3.bpmFlashStep))

          // what is the first digit of the pad
          let firstDigit = Math.floor(currentPad / 10);
          if (firstDigit % 2 === 0) {
            // connect pad to corresponding beat scale control
            DEBUG(`engine.makeConnection("[Channel${deckNum}]", "${indicator}", LaunchpadProMK3.bpmFlash(${currentPad}, ${scaleRgb}, ${deckRgb})`)
            engine.makeConnection(`[Channel${deckNum}]`, indicator, function () {
              DEBUG("makeConnection triggered; inside currentPad" + currentPad + "   deckNum " + deckNum)
              LaunchpadProMK3.bpmFlash(currentPad, scaleRgb, deckRgb)
            });
          }
        }
          DEBUG("## end of bpm scaling loop", C.R);
      }
        DEBUG("## end of deck loop", C.R);
    };// end of page 2
      DEBUG("## end updateBpmScalePage", C.G, 1, 2);
  }
}



//LaunchpadProMK3.onPadPressed[pad] = function(pad, velocity) {
//  if (velocity > 0) {
//    // Use the control to change the BPM
//    DEBUG("Activating control: " + control + " for deckNum " + deckNum);
//    engine.setValue(`[Channel${deckNum}]`, control, 1);
//
//    // Visual feedback - highlight the pad
//    let rgb = LaunchpadProMK3.hexToRGB(ratio.colour);
//    LaunchpadProMK3.sendRGB(pad, rgb[0], rgb[1], rgb[2]);
//
//    // Reset the pad color to default after a short delay
//    //engine.beginTimer(100, function() {
//    //  let dimRgb = LaunchpadProMK3.darkenRGBColour(rgb, 0.3);
//    //  LaunchpadProMK3.sendRGB(padAddress, dimRgb[0], dimRgb[1], dimRgb[2]);
//    //}, true);
//  }
//};



LaunchpadProMK3.bpmRatioMask = {
  1: 0.5,
  2: 0.666,
  3: 0.75,
  4: 1,
  5: 1,
  6: 1.25,
  7: 1.333,
  8: 1.5,
}

LaunchpadProMK3.bpmScaledInit = function (deckNum) {
  DEBUG("bpmScaledInit for deckNum " + deckNum, C.G, 1, 2);
  // init object to calculate and store bpm scales for each deck
  // DEBUG("bpm: " + LaunchpadProMK3.bpmScaled[deckNum].bpm);
  // DEBUG("length: " + LaunchpadProMK3.bpmScaled[deckNum].length);
  // DEBUG("position: " + LaunchpadProMK3.bpmScaled[deckNum].position);
  // DEBUG("sampleRate: " + LaunchpadProMK3.bpmScaled[deckNum].sampleRate);
  // DEBUG("msInBeat: " + LaunchpadProMK3.bpmScaled[deckNum].msInBeat);
  // DEBUG("samplesInBeat: " + LaunchpadProMK3.bpmScaled[deckNum].samplesInBeat);
  let bpm = engine.getValue(`[Channel${deckNum}]`, "bpm");
  let trackLength = engine.getValue(`[Channel${deckNum}]`, "track_samples");
  let position = engine.getValue(`[Channel${deckNum}]`, "playposition");
  let sampleRate = engine.getValue(`[Channel${deckNum}]`, "track_samplerate");
  let msInBeat = 60000 / bpm;
  let samplesInBeat = sampleRate * msInBeat / 60000;
  let beatsInSong = trackLength / samplesInBeat;

  // TODO: is this right?
  // Calculate scaled values
  let samplesInBeat0_5 = samplesInBeat * 2;      // Half speed = twice as many samples per beat
  let beatsInSong0_5 = trackLength / (samplesInBeat * 2);
  let samplesInBeat0_666 = samplesInBeat * 1.5;  // 2/3 speed = 1.5x as many samples per beat
  let beatsInSong0_666 = trackLength / (samplesInBeat * 1.5);
  let samplesInBeat0_75 = samplesInBeat * 1.333; // 3/4 speed = 1.333x as many samples per beat
  let beatsInSong0_75 = trackLength / (samplesInBeat * 1.333);
  let samplesInBeat1_25 = samplesInBeat * 0.8;   // 1.25x speed = 0.8x as many samples per beat
  let beatsInSong1_25 = trackLength / (samplesInBeat * 0.8);
  let samplesInBeat1_333 = samplesInBeat * 0.75; // 1.333x speed = 0.75x as many samples per beat
  let beatsInSong1_333 = trackLength / (samplesInBeat * 0.75);
  let samplesInBeat1_5 = samplesInBeat * 0.667;  // 1.5x speed = 0.667x as many samples per beat
  let beatsInSong1_5 = trackLength / (samplesInBeat * 0.667);

  // Now create the object with all the calculated values
  LaunchpadProMK3.bpmScaled[deckNum] = {
    bpm: bpm,
    trackLength: trackLength,
    position: position,
    sampleRate: sampleRate,
    msInBeat: msInBeat,
    samplesInBeat: samplesInBeat,
    beatsInSong: beatsInSong,
    // work out samples in beats at different speeds, and how many beats in song they correspond to
    samplesInBeat0_5: samplesInBeat0_5,
    beatsInSong0_5: beatsInSong0_5,
    samplesInBeat0_666: samplesInBeat0_666,
    beatsInSong0_666: beatsInSong0_666,
    samplesInBeat0_75: samplesInBeat0_75,
    beatsInSong0_75: beatsInSong0_75,
    samplesInBeat1_25: samplesInBeat1_25,
    beatsInSong1_25: beatsInSong1_25,
    samplesInBeat1_333: samplesInBeat1_333,
    beatsInSong1_333: beatsInSong1_333,
    samplesInBeat1_5: samplesInBeat1_5,
    beatsInSong1_5: beatsInSong1_5,
    beatsToSamples: [],
    beatsToSamples0_5: [],
    beatsToSamples0_666: [],
    beatsToSamples0_75: [],
    beatsToSamples1_25: [],
    beatsToSamples1_333: [],
    beatsToSamples1_5: []
  }

  
  for (let i = 0; i < LaunchpadProMK3.bpmScaled[deckNum].beatsInSong; i++) {
    LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples[i] = i * LaunchpadProMK3.bpmScaled[deckNum].samplesInBeat;
    // DEBUG("beatsToSamples" + i, C.G);
  }

  for (let i = 0; i < LaunchpadProMK3.bpmScaled[deckNum].beatsInSong0_5; i++) {
    LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples0_5[i] = i * LaunchpadProMK3.bpmScaled[deckNum].samplesInBeat0_5;
    // DEBUG("beatsToSamples0_5" + i, C.G);
  }

  for (let i = 0; i < LaunchpadProMK3.bpmScaled[deckNum].beatsInSong0_666; i++) {
    LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples0_666[i] = i * LaunchpadProMK3.bpmScaled[deckNum].samplesInBeat0_666;
    // DEBUG("beatsToSamples0_666" + i, C.G);
  }

  for (let i = 0; i < LaunchpadProMK3.bpmScaled[deckNum].beatsInSong0_75; i++) {
    LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples0_75[i] = i * LaunchpadProMK3.bpmScaled[deckNum].samplesInBeat0_75;
    // DEBUG("beatsToSamples0_75" + i, C.G);
  }

  for (let i = 0; i < LaunchpadProMK3.bpmScaled[deckNum].beatsInSong1_25; i++) {
    LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples1_25[i] = i * LaunchpadProMK3.bpmScaled[deckNum].samplesInBeat1_25;
    // DEBUG("beatsToSamples1_25" + i, C.G);
  }

  for (let i = 0; i < LaunchpadProMK3.bpmScaled[deckNum].beatsInSong1_333; i++) {
    LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples1_333[i] = i * LaunchpadProMK3.bpmScaled[deckNum].samplesInBeat1_333;
    // DEBUG("beatsToSamples1_333" + i, C.G);
  }

  for (let i = 0; i < LaunchpadProMK3.bpmScaled[deckNum].beatsInSong1_5; i++) {
    LaunchpadProMK3.bpmScaled[deckNum].beatsToSamples1_5[i] = i * LaunchpadProMK3.bpmScaled[deckNum].samplesInBeat1_5;
    // DEBUG("beatsToSamples1_5" + i, C.G);
  }
}


// initialize bpmFlashTimers array if it doesn't exist
if (!LaunchpadProMK3.bpmFlashTimers) {
  LaunchpadProMK3.bpmFlashTimers = [];
}

// function to flash a single pad
LaunchpadProMK3.bpmFlash = function (pad, scaleRgb, deckRgb) {
  DEBUG("bpmFlash for pad " + pad + "     with scaleRgb " + scaleRgb + "     with deckRgb " + deckRgb, C.O, 1);

  // rate limiting - only proceed if no flash occurred for this pad in the last 30ms
  if (LaunchpadProMK3.lastFlashTime && LaunchpadProMK3.lastFlashTime[pad] && (new Date().getTime() - LaunchpadProMK3.lastFlashTime[pad]) < 0) {
    DEBUG("rate limited..", C.G);
    return;
  }

  // record this flash time
  if (!LaunchpadProMK3.lastFlashTime) LaunchpadProMK3.lastFlashTime = {};
  LaunchpadProMK3.lastFlashTime[pad] = new Date().getTime();

  // get the top and bottom pad addresses for this column
  let topPad = pad;
  let bottomPad = pad - 10; // 10 is the offset to go to the row below (top row is 81-88, bottom row is 71-78)


  // get a dimmed version of the rgb colour value for this pad
  let deckRgbDim = LaunchpadProMK3.darkenRGBColour(deckRgb);

  // clear any existing timer for this pad
  if (LaunchpadProMK3.bpmFlashTimers[pad]) {
    DEBUG("Stopping existing timer for pad " + pad, C.R);
    engine.stopTimer(LaunchpadProMK3.bpmFlashTimers[pad]);
    LaunchpadProMK3.bpmFlashTimers[pad] = null;
  }
  
  // Initialize step if it's not set
  if (LaunchpadProMK3.bpmFlashStep[pad] === undefined) {
    LaunchpadProMK3.bpmFlashStep[pad] = 0;
  }

  // Check if any track is playing first
  let anyTrackPlaying = false;
  let activeDeck = 1; // Default to deck
  
  for (let deckNum = 1; deckNum <= 4; deckNum++) {
    if (engine.getValue(`[Channel${deckNum}]`, "play") === 1) {
      DEBUG("Track playing on deck " + deckNum);
      anyTrackPlaying = true;
      activeDeck = deckNum;
      break;
    }
  }
  
  // If no track is playing, just set the initial state and return
  if (!anyTrackPlaying) {
    DEBUG("No track playing, setting initial state for pad " + pad);
    LaunchpadProMK3.sendRGB(topPad, deckRgbDim[0], deckRgbDim[1], deckRgbDim[2]);
    LaunchpadProMK3.sendRGB(bottomPad, deckRgbDim[0], deckRgbDim[1], deckRgbDim[2]);
    LaunchpadProMK3.bpmFlashStep[pad] = 0;
    return;
  }
  
  // Get BPM from the active deck
  let bpm = engine.getValue(`[Channel${activeDeck}]`, "bpm");
  if (!bpm || bpm <= 0) bpm = 128; // Fallback to standard BPM if none detected
  DEBUG("Current BPM: " + bpm);
 
  // Get the BPM scale for this pad (based on column)
  let bpmScales = [0.5, 0.666, 0.75, 1.25, 1.333, 1.5];
  let padColumn = pad % 10;
  let bpmScale = (padColumn >= 1 && padColumn <= 6) ? bpmScales[padColumn - 1] : 1;
  
  // Calculate flash timings
  // Make each step a full beat or even multiple beats for a very visible effect
  let msPerBeat = (60000 / bpm) * (1 / bpmScale);
  let msPerStep = msPerBeat * 4;
  DEBUG("pad " + pad + " bpmScale " + bpmScale + "   msPerBeat " + msPerBeat + "ms    msPerStep " + msPerStep + "ms");
  
  // Define a self-contained animation function that works regardless of external state
  const flashPad = function() {
    // Always check if any track is still playing
    let stillPlaying = false;
    for (let deckNum = 1; deckNum <= 4; deckNum++) {
      if (engine.getValue(`[Channel${deckNum}]`, "play") === 1) {
        stillPlaying = true;
        break;
      }
    }
    
    if (!stillPlaying) {
      // If track stopped, reset pads to initial state
      DEBUG("Track stopped during animation for pad " + pad);
      LaunchpadProMK3.sendRGB(topPad, deckRgbDim[0], deckRgbDim[1], deckRgbDim[2]);
      LaunchpadProMK3.sendRGB(bottomPad, deckRgbDim[0], deckRgbDim[1], deckRgbDim[2]);
      LaunchpadProMK3.bpmFlashStep[pad] = 0;
      
      // Stop timers to prevent continued animations after track stops
      if (LaunchpadProMK3.bpmFlashTimers[pad]) {
        engine.stopTimer(LaunchpadProMK3.bpmFlashTimers[pad]);
        LaunchpadProMK3.bpmFlashTimers[pad] = null;
      }
      return; // Stop animation
    }
    
    // Get current step and advance to next state
    let currentStep = LaunchpadProMK3.bpmFlashStep[pad];
    DEBUG("### CURRENT STEP    currentStep " + currentStep + "   for pad " + pad, C.O);
    
    let deckRgbDim = LaunchpadProMK3.darkenRGBColour(deckRgb);
    switch (currentStep) {
      case 0: // STEP 0: both pads on
        LaunchpadProMK3.sendRGB(topPad, scaleRgb[0], scaleRgb[1], scaleRgb[2]);
        LaunchpadProMK3.sendRGB(bottomPad, scaleRgb[0], scaleRgb[1], scaleRgb[2]);
        LaunchpadProMK3.bpmFlashStep[pad] = 1;
        DEBUG("Step 0→1: Both pads ON for pad " + pad);
        break;
        
      case 1: // STEP 1: bottom pad off
        LaunchpadProMK3.sendRGB(bottomPad, deckRgb[0], deckRgb[1], deckRgb[2]);
        LaunchpadProMK3.bpmFlashStep[pad] = 2;
        DEBUG("Step 1→2: Bottom pad OFF for pad " + pad);
        break;
        
      case 2: // STEP 2: both pads on again
        LaunchpadProMK3.sendRGB(bottomPad, scaleRgb[0], scaleRgb[1], scaleRgb[2]);
        LaunchpadProMK3.bpmFlashStep[pad] = 3;
        DEBUG("Step 2→3: Bottom pad ON again for pad " + pad);
        break;
        
      case 3: // STEP 3: top pad off
        LaunchpadProMK3.sendRGB(topPad, deckRgb[0], deckRgb[1], deckRgb[2]);
        LaunchpadProMK3.bpmFlashStep[pad] = 0;
        DEBUG("Step 3→0: Top pad OFF for pad " + pad);
        break;
        
      default: // Reset if somehow we got an invalid state
        LaunchpadProMK3.bpmFlashStep[pad] = 0;
        break;
    }
    
    // Schedule the next animation step
    if (LaunchpadProMK3.bpmFlashTimers[pad]) {
      DEBUG("Stopping previous flash timer for pad " + pad);
      engine.stopTimer(LaunchpadProMK3.bpmFlashTimers[pad]);
      LaunchpadProMK3.bpmFlashTimers[pad] = null;
    }
    
    // Only schedule next step if still playing
    if (stillPlaying) {
      DEBUG("Scheduling next flash step in " + msPerStep + "ms for pad " + pad);
      LaunchpadProMK3.bpmFlashTimers[pad] = engine.beginTimer(msPerStep, flashPad, true);
    }
  };
  
  // Start the animation immediately if a track is playing
  if (anyTrackPlaying) {
    DEBUG("             flashPad() again");
    flashPad();
  } else {
    DEBUG("Not starting animation for pad " + pad + " - no track playing");
  }
}




/// Fourth page (3)


LaunchpadProMK3.loopControls = [
  //"beatloop_activate",
  // Set a loop that is beatloop_size beats long and enables the loop
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

LaunchpadProMK3.updateLoopPage = function () {
  if (LaunchpadProMK3.currentPage === 3) {
    DEBUG("");
    DEBUG("                              .o8                .                                                                   .oooo.   ", C.M);
    DEBUG("                             '888              .o8                                                                 .dP''Y88b  ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.       oo.ooooo.   .oooo.    .oooooooo  .ooooo.             ]8P' ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b       888' `88b `P  )88b  888' `88b  d88' `88b          <88b.  ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888       888   888  .oP'888  888   888  888ooo888           `88b. ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o       888   888 d8(  888  `88bod8P'  888    .o      o.   .88P  ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'       888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'      `8bd88P'   ", C.M);
    DEBUG("              888                                                    888                 d'     YD                            ", C.M);
    DEBUG("             o888o                                                  o888o                 'Y88888P'                           ", C.M);
    DEBUG("");
    DEBUG("## updateLoopPage", C.B, 0, 1);

    LaunchpadProMK3.clearMain();
    for (let deck = 1; deck <= totalDecks; deck += 1) {
      let deckColour = LaunchpadProMK3.decks[deck].deckColour;
      let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
      DEBUG("deck " + deck + "   deckColour #" + deckColour + "   deckRgb " + deckRgb, C.G);
      //gradStartA = [127, 127, 127];
      gradStartA = [70, 70, 70];
      gradEndA = [10, 10, 30];
      //gradStartB = [20, 20, 20];
      //gradStartB = [120, 120, 120];
      gradStartB = [70, 70, 70];
      gradEndB = deckRgb;
      LaunchpadProMK3.gradientSetup(deck, undefined, gradStartA, gradEndA, gradStartB, gradEndB);
      DEBUG("end updateLoopPage deck gradient creation")
    };

    DEBUG("## end updateLoopPage", C.G, 1, 2);
  };
};



/// Fifth page (4)


LaunchpadProMK3.updateReverseLoopPage = function () {
  if (LaunchpadProMK3.currentPage === 4) {
    DEBUG("  ");
    DEBUG("                              .o8                .                                                                       .o   ", C.M);
    DEBUG("                             '888              .o8                                                                     .d88   ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.       oo.ooooo.   .oooo.    .oooooooo  .ooooo.         .d'888   ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b       888' `88b `P  )88b  888' `88b  d88' `88b     .d'  888   ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888       888   888  .oP'888  888   888  888ooo888      88ooo888oo ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o       888   888 d8(  888  `88bod8P'  888    .o           888   ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'       888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'          o888o  ", C.M);
    DEBUG("              888                                                    888                 d'     YD                            ", C.M);
    DEBUG("             o888o                                                  o888o                 'Y88888P'                           ", C.M);
    DEBUG("  ");
    DEBUG("## updateReverseLoopPage", C.B, 0, 1);

    LaunchpadProMK3.clearMain();
    for (let deck = 1; deck <= 4; deck += 1) {
      let deckColour = LaunchpadProMK3.decks[deck].deckColour;
      let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
      DEBUG("deck " + deck + "   deckColour #" + deckColour + "   deckRgb " + deckRgb, C.G);
      gradStartA = [30, 10, 10];
      gradEndA = [127, 127, 127];
      gradStartB = [70, 70, 70];
      gradEndB = deckRgb;
      LaunchpadProMK3.gradientSetup(deck, undefined, gradStartA, gradEndA, gradStartB, gradEndB);
    };
    DEBUG("## end updateReverseLoopPage", C.G, 1, 2);
  };
};




// Sixth page (5)

LaunchpadProMK3.updateLoopExtrasPage = function () {
  if (LaunchpadProMK3.currentPage === 5) {
    DEBUG("  ");
    DEBUG("                              .o8                .                                                                   oooooooo ", C.M);
    DEBUG("                             '888              .o8                                                                  dP''''''' ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.       oo.ooooo.   .oooo.    .oooooooo  .ooooo.       d88888b.   ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b       888' `88b `P  )88b  888' `88b  d88' `88b         `Y88b   ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888       888   888  .oP'888  888   888  888ooo888            ]88  ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o       888   888 d8(  888  `88bod8P'  888    .o      o.   .88P  ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'       888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'      `8bd88P'   ", C.M);
    DEBUG("              888                                                    888                 d'     YD                            ", C.M);
    DEBUG("             o888o                                                  o888o                 'Y88888P'                           ", C.M);
    DEBUG("  ")
    DEBUG("## updateLoopExtrasPage", C.B, 0, 1);

    LaunchpadProMK3.clearMain();

    DEBUG("## end updateLoopExtrasPage", C.G, 1, 2);
  };
};



LaunchpadProMK3.loopMoveControls = [
  ///"loop_move",
  // Move loop forward by X beats (positive) or backward by X beats (negative).
  // If a saved loop is currently enabled, the modification is saved to the hotcue slot immediately.
  //"loop_move_x_forward",
  // Loop moves forward by X beats. If a saved loop is currently enabled, the modification is saved to the hotcue slot immediately.
  //"loop_move_x_backward",
  // Loop moves back by X beats. If a saved loop is currently enabled, the modification is saved to the hotcue slot immediately.
  "loop_move_1_backward",
  "loop_move_2_backward",
  "loop_move_4_backward",
  "loop_move_8_backward",
  "loop_move_16_backward",
  "loop_move_32_backward",
  "loop_move_64_backward",
  "loop_move_128_backward",

  "loop_move_1_forward",
  "loop_move_2_forward",
  "loop_move_4_forward",
  "loop_move_8_forward",
  "loop_move_16_forward",
  "loop_move_32_forward",
  "loop_move_64_forward",
  "loop_move_128_forward"
];


LaunchpadProMK3.loopExtraControls = [
  "loop_in_goto",
  // Seek to the loop in point.
  "loop out_goto",
  // Seek to the loop out point.

  "loop_half",
  // Halves beatloop_size. If beatloop_size equals the size of the loop, the loop is resized.
  // If a saved loop is currently enabled, the modification is saved to the hotcue slot immediately.
  "loop_double",
  // Doubles beatloop_size. If beatloop_size equals size of the loop, loop is resized.
  // If a saved loop is currently enabled, the modification is saved to the hotcue slot immediately.
  //"loop_scale",
  // Scale the loop length by the value scale is set to by moving the end marker.

  // beatloop_size is not updated to reflect the change. If a saved loop is
  // currently enabled, the modification is saved to the hotcue slot immediately.

  //"loop_in",
  // If loop disabled, sets player loop in position to the current play position.
  // If loop enabled, press and hold to move loop in position to the current play position.
  // If quantize is enabled, beatloop_size will be updated to reflect the new loop size
  //"loop_out",
  // If loop disabled, sets player loop out position to the current play position.
  // If loop enabled, press & hold to move loop out position to the current play position.
  // If quantize is enabled, beatloop_size will be updated to reflect the new loop size.


  "slip_enabled",
  // When active, playback continues muted in the background during a loop, scratch etc.
  // Once disabled, the audible playback will resume where the track would have been.

  "loop_enabled",
  // Indicates whether or not a loop is enabled.
  //"loop_start_position",
  // The player loop-in position in samples, -1 if not set.
  //"loop_end_position",
  // The player loop-in position in samples, -1 if not set.  "reloop_toggle",
  // Toggles the current loop on or off. If the loop is ahead of the current play position,
  // the track will keep playing normally until it reaches the loop.

  "reloop_andstop",  // Activate current loop, jump to its loop in point, and stop playback

  "loop_remove",
  // Clears the last active loop/

  //"hotcue_X_activate",
  // If hotcue X is not set, this sets a hotcue at the current play position and saves it as hotcue X of type “Hotcue”
  // In case a loop is currently enabled (i.e. if [ChannelN],loop_enabled is set to 1),
  // the loop will be saved as hotcue X instead and hotcue_X_type will be set to “Loop”
  // If hotcue X has been set asrsrr cue point, the player seeks to the saved play position.

  //"hotcue_X_enabled",
  // 0 Hotcue X is not set, 1 Hotcue X is set, 2 Hotcue X is active (saved loop is enabled or hotcue is previewing)

  //r//"reverse",

  //"reverseroll",
];




// seventh page (6)
// page that shows controls for only one deck


LaunchpadProMK3.updateOneDeckPage = function () {
  if (LaunchpadProMK3.currentPage === 6) {
    DEBUG("                              .o8                .                                                                    .ooo   ", C.M);
    DEBUG("                             '888              .o8                                                                  .88'     ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.       oo.ooooo.   .oooo.    .oooooooo  .ooooo.       d88'      ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b       888' `88b `P  )88b  888' `88b  d88' `88b     d888P'Ybo. ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888       888   888  .oP'888  888   888  888ooo888     Y88[   ]88 ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o       888   888 d8(  888  `88bod8P'  888    .o     `Y88   88P ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'       888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'      `88bod8'  ", C.M);
    DEBUG("              888                                                    888                 d'     YD                           ", C.M);
    DEBUG("             o888o                                                  o888o                 'Y88888P'                          ", C.M);
    DEBUG("  ");
    DEBUG("## updateOneDeckPage", C.B, 0, 1);
    //if (address > 11 && address < 28) { padPoss = 4 }
    //if (address > 31 && address < 48) { padPoss = 3 }
    //if (address > 51 && address < 68) { padPoss = 2 }
    //if (address > 71 && address < 88) { padPoss = 1 }

    oneDeckCurrent = LaunchpadProMK3.selectedDeck;
    //LaunchpadProMK3.changeMainToDeck()
    LaunchpadProMK3.clearMain();

    let deckColour = LaunchpadProMK3.decks[oneDeckCurrent].deckColour;
    let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);

    DEBUG("deck " + oneDeckSelected + "   deckColour #" + deckColour + "   deckRgb " + deckRgb, C.G);
    DEBUG("top; rloop gradient;");
    gradStartA = [20, 0, 0];
    gradEndA = [127, 127, 127];
    gradStartB = [20, 20, 20];
    gradEndB = deckRgb;
    LaunchpadProMK3.gradientSetup(oneDeckCurrent, 3, gradStartA, gradEndA, gradStartB, gradEndB);
    LaunchpadProMK3.updateHotcueLights(oneDeckCurrent);

    DEBUG("middle; loop gradient;");
    DEBUG("deck " + oneDeckCurrent + "   deckColour #" + deckColour + "   deckRgb " + deckRgb, C.G);
    gradStartA = [127, 127, 127];
    gradEndA = [0, 0, 20];
    gradStartB = deckRgb;
    gradEndB = [20, 20, 20];
    LaunchpadProMK3.gradientSetup(oneDeckCurrent, 1, gradStartA, gradEndA, gradStartB, gradEndB);
    LaunchpadProMK3.updateHotcueLights(oneDeckCurrent);

    DEBUG("bottom; beatjump gradient;");
    DEBUG("deck " + oneDeckCurrent + "   deckColour #" + deckColour + "   deckRgb " + deckRgb, C.G);
    gradStartA = [20, 20, 20];
    gradEndA = [112, 112, 112];
    gradStartB = deckRgb;
    gradEndB = [127, 127, 127];
    LaunchpadProMK3.gradientSetup(oneDeckCurrent, 2, gradStartA, gradEndA, gradStartB, gradEndB);
    LaunchpadProMK3.updateHotcueLights(oneDeckCurrent);
  }// end page check
}