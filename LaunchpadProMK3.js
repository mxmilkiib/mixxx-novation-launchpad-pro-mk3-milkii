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





// Init deck conf base object
LaunchpadProMK3.deck = LaunchpadProMK3.deck || {};




//// Instantiation function; set up decks, etc

LaunchpadProMK3.init = function () {
  DEBUG("ooooo                                                    oooo                                   .o8 ", C.M, 2)
  DEBUG("`888'                                                    `888                                 dc888 ", C.M)
  DEBUG(" 888          .oooo.   oooo  oooo  ooo. .oo.    .ooooo.   888 .oo.   oo.ooooo.   .oooo.    .oooo888 ", C.M)
  DEBUG(" 888         `P  )88b  `888  `888  `888P'Y88b  d88' `'Y8  888P'Y88b   888' `88b `P  )88b  d88' `888 ", C.M)
  DEBUG(" 888          .oP'888   888   888   888   888  888        888   888   888   888  .oP'888  888   888 ", C.M)
  DEBUG(" 888       o d8(  888   888   888   888   888  888   .o8  888   888   888   888 d8(  888  888   888 ", C.M)
  DEBUG("o888ooooood8 `Y888''8o  `V88V'V8P' o888o o888o `Y8bod8P' o888o o888o  888bod8P' `Y888''8o `Y8bod88P'", C.M)
  DEBUG("                                                                      888", C.M)
  DEBUG("                                                                     o888o", C.M)
  DEBUG("")
  DEBUG("          ooooooooo.                           ooo        ooooo oooo    oooo   .oooo.", C.M)
  DEBUG("          `888   `Y88.                         `88.       .888' `888   .8P'  .dPY''88b", C.M)
  DEBUG("           888   .d88' oooo d8b  .ooooo.        888b     d'888   888  d8'          ]8P'", C.M)
  DEBUG("           888ooo88P'  `888''8P d88' `88b       8 Y88. .P  888   88888[          <88b.", C.M)
  DEBUG("           888          888     888   888       8  `888'   888   888`88b.         `88b.", C.M)
  DEBUG("           888          888     888   888       8    Y     888   888  `88b.  o.   .88P", C.M)
  DEBUG("          o888o        d888b    `Y8bod8P'      o8o        o888o o888o  o888o `8bd88P'", C.M)
  DEBUG("")
  DEBUG("   created by Milkii, with thanks to various Mixxx devs on Zulip, the forum and GitHub for help!", C.C, 0, 2)
  DEBUG("####", C.M);
  DEBUG("#####", C.O);
  DEBUG("######   init controller script n object", C.G);
  DEBUG("#####", C.O);
  DEBUG("####", C.M)


  // switch LPP3 from DAW mode to programmer mode
  LaunchpadProMK3.setProgrammerMode();

  // clear already lit pads
  //LaunchpadProMK3.clearAll();

  // MIDI handlers for deck selection, actions, and page selection
  DEBUG("LaunchpadProMK3.initVars()", C.G, 1)
  LaunchpadProMK3.initVars();

  // construct Deck objects based on the Components JS Deck object system
  if (LaunchpadProMK3.totalDecks === 4) {
    DEBUG("LaunchpadProMK3.totalDecks = 4 decks", C.O, 0, 1)
    LaunchpadProMK3.decks = {
      "1": new LaunchpadProMK3.Deck(1),
      "2": new LaunchpadProMK3.Deck(2),
      "3": new LaunchpadProMK3.Deck(3),
      "4": new LaunchpadProMK3.Deck(4),
    }
  } else if (LaunchpadProMK3.totalDecks === 2) {
    DEBUG("LaunchpadProMK3.totalDecks = 2 decks", C.O, 0, 1)
    LaunchpadProMK3.decks = {
      "1": new LaunchpadProMK3.Deck(1),
      "2": new LaunchpadProMK3.Deck(2),
    }
    DEBUG("decks madeeeee", C.R, 1, 1)
  };

  // MIDI handlers for deck selection, actions, and page selection
  DEBUG("LaunchpadProMK3.initExtras()", C.G, 1)
  LaunchpadProMK3.initExtras();

  // Select the initial desk
  DEBUG("LaunchpadProMK3.selectDeck(1)", C.G, 1)
  LaunchpadProMK3.selectDeck(1);

  // Initialise zeroth page (hotcues)
  DEBUG("LaunchpadProMK3.selectPage(0)", C.G, 1)
  LaunchpadProMK3.selectPage(0);

  //LaunchpadProMK3.lightUpRow2(LaunchpadProMK3.currentPage);
  LaunchpadProMK3.lightUpRow2();

  DEBUG("#####", C.M);
  DEBUG("######", C.O);
  DEBUG("init finished", C.R);
  DEBUG("######", C.O);
  DEBUG("#####", C.M, 0, 24);
};


// set Launchpad Pro MK3 to Programmer Mode
LaunchpadProMK3.setProgrammerMode = function () {
  DEBUG("# sending programmer mode sysex..", C.O, 1);
  LaunchpadProMK3.sendSysEx([0x0E, 0x01]);
};


// helper to construct and send SysEx message
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

LaunchpadProMK3.initVars = function () {
  //// initialise main variables

  // MIDI addresses of the main 8x8 grid
  LaunchpadProMK3.mainpadAddresses = [
    81, 82, 83, 84, 85, 86, 87, 88,
    71, 72, 73, 74, 75, 76, 77, 78,
    61, 62, 63, 64, 65, 66, 67, 68,
    51, 52, 53, 54, 55, 56, 57, 58,
    41, 42, 43, 44, 45, 46, 47, 48,
    31, 32, 33, 34, 35, 36, 37, 38,
    21, 22, 23, 24, 25, 26, 27, 28,
    11, 12, 13, 14, 15, 16, 17, 18
  ];


  // MIDI addresses of the left/right side pads
  LaunchpadProMK3.sidepads = [
    80, 70, 89, 79,
    60, 50, 69, 59,
    40, 30, 49, 39,
    20, 10, 29, 19
  ];

  // sidepad pads
  DEBUG("LaunchpadProMK3.sidepads " + C.O + LaunchpadProMK3.sidepads, C.RE)

  // Templates for assigning side pad controls
  LaunchpadProMK3.sidepadNames = [
    "intro_start_",
    "intro_end_",
    "outro_start_",
    "outro_end_"
  ];

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


  LaunchpadProMK3.totalDecks = Object.keys(LaunchpadProMK3.deck.config).length;
  LaunchpadProMK3.totalDeckHotcuePads = 64 / LaunchpadProMK3.totalDecks;

  // full brightness LED colour is confusing
  // these set how bright the LEDs are for loaded and unloaded decks
  LaunchpadProMK3.deckLoadedDimscale = 0.35
  LaunchpadProMK3.deckUnloadedDimscale = 0.2


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

  // provide the rgb colors for the bpm scaling columns in an array for easy use later
  let scaleColumnRgb = [];
  for (let j = 1; j <= 8; j++) {
    let key = j.toString();
    if (LaunchpadProMK3.bpmScaling[key]) {
      scaleColumnRgb.push(LaunchpadProMK3.hexToRGB(LaunchpadProMK3.bpmScaling[key].colour));
    }
  }
  // create arrays to store sample positions for each beat
  // const beatSamplePos = [];

  LaunchpadProMK3.altBpmBeatSampleLength = [];

  // initialize bpmFlashStep array for all pads (11 through 88)
  LaunchpadProMK3.bpmFlashStep = [];


  // Initialize bpmScaled arrays for all decks
  LaunchpadProMK3.bpmScaled = [];
  LaunchpadProMK3.bpmScaled.samplesInBeat = [];
  LaunchpadProMK3.bpmScaled.beatSamplePos = [];
  LaunchpadProMK3.bpmScaled.beatSamplePos0_5 = [];
  LaunchpadProMK3.bpmScaled.beatSamplePos0_666 = [];
  LaunchpadProMK3.bpmScaled.beatSamplePos0_75 = [];
  LaunchpadProMK3.bpmScaled.beatSamplePos1_25 = [];
  LaunchpadProMK3.bpmScaled.beatSamplePos1_333 = [];
  LaunchpadProMK3.bpmScaled.beatSamplePos1_5 = [];


  LaunchpadProMK3.beatsSamplePos = []
  LaunchpadProMK3.altBpmBeatSampleLength = []


  // initialize base bpmTimer array
  LaunchpadProMK3.bpmTimer = [];


  // initialize base inNextBeat arrays
  LaunchpadProMK3.inNextBeat = [];

  // initialize base lastFlashTime object
  LaunchpadProMK3.lastFlashTime = {};
}



//// initialise misc key bindings

LaunchpadProMK3.initExtras = function () {
  // Deck selection buttons
  // TODO currently order here is hardcoded
  // select deck 3
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[0], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectDeck(3); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[0], 0xd7, 0x00, 0xd7); // bright

  // select deck 1
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[1], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectDeck(1); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[1], 0x1D, 0x46, 0x7B); // bright

  // select deck 2
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[2], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectDeck(2); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[2], 0x7F, 0x58, 0x04); // bright

  // select deck 4
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[3], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectDeck(4); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[3], 0x44, 0x60, 0x0D); // bright


  // select page 1
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[0], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(0); }
  });
  // select page 2
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[1], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(1); }
  });
  // select page 3
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[2], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(2); }
  });
  // select page 4
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[3], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(3); }
  });
  // select page 5
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[4], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(4); }
  });
  // select page 6
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[5], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(5); }
  });
  // select page 7
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[6], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(6); }
  });


  // shift;press and hold to access alternate functions for other pads
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


  // pop and pull hotcue info for the ability to undo and redo
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
  // creates 4 leadup and then a drop hotcue, playhead to be on drop when pressed
  // TODO currently creation positions are hardcoded
  hotcueCreationButton = LaunchpadProMK3.row0[7]
  midi.makeInputHandler(0xB0, hotcueCreationButton, (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.create4LeadupDropHotcues(LaunchpadProMK3.selectedDeck, value); }
  });
  LaunchpadProMK3.sendRGB(hotcueCreationButton, 0x7F, 0x7F, 0x7F);


  // ability to switch color of a hotcue that has been created
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
  DEBUG("## end LaunchpadProMK3.initExtras()", C.R, 1);
};



//// clearing an resetting main hotcues

// turn off main LEDs for page change
LaunchpadProMK3.clearMain = function () {
  //// main pads
  DEBUG("/// clearing main and side pads", C.G, 1);
  // turn all pads off by compiling a multi-led affecting sysex msg to send
  //colorSpecMulti = LaunchpadProMK3.mainpadAddresses.map(address => [0x03, address, 0,0,0]).flatmap();
  const colorSpecMulti = _.flatMap(LaunchpadProMK3.mainpadAddresses, (address) => [0x03, address, 0, 0, 0]);
  LaunchpadProMK3.sendSysEx([0x03].concat(colorSpecMulti));
  //// sidepads
  const colorSpecMultiSide = _.flatMap(LaunchpadProMK3.sidepads, (address) => [0x03, address, 0, 0, 0]);
  LaunchpadProMK3.sendSysEx([0x03].concat(colorSpecMultiSide));
  DEBUG("/// end clearing main and side pads", C.R);
};


// turn off ALL LEDs for page change or shutdown
LaunchpadProMK3.clearAll = function () {
  DEBUG("/// clearing all pads", C.G, 2);
  // compile and send a two part msg to turn all pads off
  ca = [0x03]; cb = [0x03];
  for (i = 0; i <= 0x3F; i += 1) { ca = ca.concat([0x03, i, 0, 0, 0]); } LaunchpadProMK3.sendSysEx(ca);
  for (i = 0x40; i <= 0x7F; i += 1) { cb = cb.concat([0x03, i, 0, 0, 0]); } LaunchpadProMK3.sendSysEx(cb);
  DEBUG("/// end clearing all pads", C.R);
};


// Shutdown function that should be triggered by Mixxx on close
LaunchpadProMK3.shutdown = function () {
  DEBUG("###  SHUTTINGDOWN..  ###", C.O, 2, 3);
  LaunchpadProMK3.stopAllBpmTimers();
  LaunchpadProMK3.clearAll();
  DEBUG("LaunchpadProMK3 controller script now exiting");
}



//// Deck constructor

LaunchpadProMK3.Deck = function (deckNum) {
  //D(LaunchpadProMK3.DEBUGstate, C.M, this.deckColour, this.pads, test)
  DEBUG("")
  DEBUG("  o8o               o8o      .             .o8                      oooo       ", C.M);
  DEBUG("  `''               `''    .o8            '888                      `888       ", C.M);
  DEBUG(" oooo  ooo. .oo.   oooo  .o888oo      .oooo888   .ooooo.   .ooooo.   888  oooo ", C.M);
  DEBUG(" 888  `888P'Y88b  `888    888        d88' `888  d88' `88b d88' `'Y8  888 .8P'  ", C.M);
  DEBUG(" 888   888   888   888    888        888   888  888ooo888 888        888888.   ", C.M);
  DEBUG(" 888   888   888   888    888 .      888   888  888    .o 888   .o8  888 `88b. ", C.M);
  DEBUG(" o888o o888o o888o o888o   '888'     `Y8bod88P' `Y8bod8P' `Y8bod8P' o888o o888o", C.M, 0, 1);
  // DEBUG("### constructing " + C.M + "deck " + deckNum, C.G);
  // connect deck object to Components system
  components.Deck.call(this, deckNum);

  // give deck object the configured deck colour
  this.deckColour = LaunchpadProMK3.deck.config[deckNum].colour;
  DEBUG("Deck: ### deck object instantiation   " + C.RE + "deckNum " + C.R + deckNum + C.RE + "   this.currentDeck " + C.O + this.currentDeck + C.RE + "   deckColour " + C.O + "#" + this.deckColour.toString(16).padStart(6, "0").toUpperCase() + C.RE + " (" + C.O + LaunchpadProMK3.hexToRGB(this.deckColour) + C.RE + ")", C.G, 0, 1);
  // save this.deckColour in RGB arrray format to use later
  this.deckRgb = LaunchpadProMK3.hexToRGB(this.deckColour);
  // give object its physical order
  this.deckOrderIndex = LaunchpadProMK3.deck.config[deckNum].order;
  DEBUG("Deck: this.deckOrderIndex " + C.O + this.deckOrderIndex + C.RE + " (LaunchpadProMK3.deck.config[deckNum].order)")
  // what pad is the first of the set the deck will manage?
  this.deckMainSliceStartIndex = (this.deckOrderIndex - 1) * LaunchpadProMK3.totalDeckHotcuePads;
  DEBUG("Deck: this.deckMainSliceStartIndex " + C.O + this.deckMainSliceStartIndex)
  // what is the set of main grid pads this deck will manage?
  this.pads = LaunchpadProMK3.mainpadAddresses.slice(this.deckMainSliceStartIndex, this.deckMainSliceStartIndex + LaunchpadProMK3.totalDeckHotcuePads);
  DEBUG("Deck: this.pads " + C.O + this.pads + C.RE + " (" + this.deckMainSliceStartIndex + "-" + (this.deckMainSliceStartIndex + 16) + ")")
  // save just the first pad number for quick reference later
  this.padsFirst = this.pads[0];

  // what is the first sidepad of the set for this deck?
  this.deckSideSliceStartIndex = (LaunchpadProMK3.deck.config[deckNum].order - 1) * 4;
  DEBUG("Deck: this.deckSideSliceStartIndex " + C.O + (this.deckSideSliceStartIndex - 1))
  // what is the full set of four sidepads for this deck?
  this.deckSidepadAddresses = LaunchpadProMK3.sidepads.slice(this.deckSideSliceStartIndex, this.deckSideSliceStartIndex + 4);
  DEBUG("Deck: this.deckSidepadAddresses " + C.O + LaunchpadProMK3.sidepads.slice(this.deckSideSliceStartIndex, this.deckSideSliceStartIndex + 4))

  //// Deck Main Hotcues
  // initialise an array, attached to the object, that will hold the individual hotcue objects
  this.hotcueButtons = [];
  DEBUG("## start hotcue pads init", C.G, 1);

  // either 16 or 32
  // for the whole number of hotcues this deck will have..
  for (let i = 1; i <= LaunchpadProMK3.totalDeckHotcuePads; i += 1) {
    color_obj = "";
    this.i = i;
    let padAddress = this.pads[i - 1];
    // give the hotcue a number
    let hotcueNum = i;
    // is this deck loaded?
    let deckLoaded = engine.getValue(`${this.currentDeck}`, "track_loaded");
    DEBUG("Deck: main pad " + i + C.RE + "   deckNum " + C.O + deckNum + C.RE + " (" + C.O + this.currentDeck + C.RE + ")   deckLoaded " + C.R + deckLoaded + C.RE + "   deckColour " + C.O + "#" + this.deckColour.toString(16).toUpperCase() + C.RE + " (" + C.O + LaunchpadProMK3.hexToRGB(this.deckColour) + C.RE + ")    padAddress " + C.O + padAddress + C.RE + " (" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + ")", C.G);
    if (deckLoaded !== 1) { this.deckRgb = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(this.deckColour), LaunchpadProMK3.deckUnloadedDimscale); }
    if (deckLoaded === 1) { this.deckRgb = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(this.deckColour), LaunchpadProMK3.deckLoadedDimscale); }
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
        if (value !== 0) { DEBUG("Deck (input):   main pad press: " + C.O + padAddress + C.RE + "   loaded? " + C.O + engine.getValue(`${this.currentDeck}`, "track_loaded") + C.RE + "   value: " + C.O + value + C.RE + "   page: " + C.O + LaunchpadProMK3.currentPage + C.RE + ")", C.RE, 1); }
        // check the deck is loaded with a track, that the page is right, that it's a button press not release
        //if (engine.getValue(`${this.currentDeck}`,"track_loaded") !== 1 || value === 0) { return; }

        //0
        // hotcues, intro/outro, multihotcue creation, deck select
        if (LaunchpadProMK3.currentPage === 0) {
          // is shift pressed?
          if (LaunchpadProMK3.shift === 0) {
            // if shift not pressed: Hotcue Activation
            DEBUG("Deck (input): no shift..  value " + C.O + value);
            // is this a note down or note up event?
            if (value !== 0) {
              DEBUG("Deck (input): deckNum" + C.O + deckNum + C.RE + "/" + C.O + this.currentDeck + C.RE + ",  i " + C.O + i + C.RE + ",  padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   hotcueNum " + C.O + hotcueNum, C.G, 0, 1);
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
            DEBUG("Deck (input): LaunchpadProMK3.lastHotcue:  " + C.O + LaunchpadProMK3.lastHotcue);

            /// if shift is pressed: Hotcue Deletion
            if (LaunchpadProMK3.shift === 1) {
              DEBUG("Deck (input): shift, hotcue clear " + C.RE + hotcueNum + C.G + " on " + C.RE + this.currentDeck, C.G);
              // helper function to toggle hotcue clear control on then off
              script.triggerControl(this.currentDeck, "hotcue_" + hotcueNum + "_clear", 50);
              // has to be full page refresh because a track could be on two decks
              LaunchpadProMK3.updateHotcuePage();
              DEBUG("Deck (input): leaving hotcue page btton press..", C.R, 0, 1);
            }
          }
          DEBUG("Deck (input): end of page 0 input action");
        }; //end of page0, hotcue input handler

        //1
        // beatjump
        if (LaunchpadProMK3.currentPage === 1) {
          if (value !== 0) {
            // what control in the array is activated with this pad?
            let beatjumpControlSel = LaunchpadProMK3.beatjumpControls[hotcueNum - 1];
            script.triggerControl(this.currentDeck, beatjumpControlSel, 50);
            DEBUG("Deck (input): BEATJUMP " + C.O + beatjumpControlSel + C.RE + " on deck " + this.currentDeck, C.G, 1);
          }
        };

        //2
        // bpm scaling
        if (LaunchpadProMK3.currentPage === 2) {
          // if a pad is pressed on page 2
          if (value !== 0) {
            DEBUG("Deck (input): bpm scaling..  padAddress " + C.O + padAddress + C.RE);
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
              DEBUG("Deck (input): bpmSCALE " + C.O + bpmScalingControl + C.RE + " on deck " + this.currentDeck, C.G, 1);
              // refresh all the pads
              LaunchpadProMK3.updateBpmScalePage();
            }
          }
        }; //end page 2, bpm scaling

        //3 & 4
        // loops
        if (LaunchpadProMK3.currentPage === 3 || LaunchpadProMK3.currentPage === 4) {
          if (value !== 0) {
            DEBUG("Deck (input): it's loopin time", C.G, 1);
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
            DEBUG("Deck (input): loops   channel " + C.O + channel + C.RE + "   padAddress " + C.O + padAddress + C.RE + "   control " + C.O + control);
            script.toggleControl(channel, control, 50);
          };
        };
        //5
        // loop
        if (LaunchpadProMK3.currentPage === 5) {
          if (value !== 0) {
            DEBUG("Deck (input): it's loopin extra tools time on page 5", C.G, 1)
          }
        } // end loop pages

        //6
        // one deck
        if (LaunchpadProMK3.currentPage === 6) {
          if (value !== 0) {
            DEBUG("Deck (input): one deck time, page 6", C.G, 1)
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
        //if (deckLoaded !== 1) { rgb = LaunchpadProMK3.darkenRGBColour(rgb, LaunchpadProMK3.deckUnloadedDimscale) }
        if (LaunchpadProMK3.currentPage === 0) {
          let deckLoaded = engine.getValue(`[Channel${deckNum}]`, "track_loaded");
          DEBUG("Deck (output): sendRGB   color_obj " + C.O + JSON.stringify(color_obj) + C.RE + "   deckNum " + C.O + deckNum + C.RE + "   i " + C.O + i + C.RE + "   padAddress " + C.O + padAddress + C.RE + " / " + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   deckLoaded " + C.O + deckLoaded, C.O);
          LaunchpadProMK3.sendRGB(this.padAddress, color_obj.red >> 1, color_obj.green >> 1, color_obj.blue >> 1);
        }
      } //end sendrgb method
    }) //end hotcue component

    //shutdown: undefined

    // bind action to a change of hotcue status
    engine.makeConnection(`[Channel${deckNum}]`, `hotcue_${hotcueNum}_status`, (value) => {
      //if (value === 0) { return }
      if (LaunchpadProMK3.currentPage === 0 || value !== 0) {
        let deckColour = this.deckColour // Get the deck color
        let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
        let deckDimUnloaded = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckUnloadedDimscale);
        LaunchpadProMK3.sendRGB(padAddress, deckDimUnloaded[0], deckDimUnloaded[1], deckDimUnloaded[2]);
        DEBUG(">> makeConnection " + C.RE + "hotcue_X_status" + C.RE + "   deckColour hex " + C.O + "#" + deckColour.toString(16) + C.RE + "   deckRgb " + C.O + deckRgb + C.RE + "   deckDimUnloaded " + C.O + deckDimUnloaded, C.G, 2, 1);
      }
      if (value === 0) {

      }
    }); //end of makeConnection

    // bind an action to a hotcue being cleared
    //engine.makeConnection(`[Channel${deckNum}]`, `hotcue_${hotcueNum}_clear`, (value) => {
    //  if (value === 0) { return }
    //  let deckColour = this.deckColour; // Get the deck color
    //  let deckColourBg = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(deckColour), LaunchpadProMK3.deckUnloadedDimscale);
    //  DEBUG("makeConnection" +C.RE+ "hotcue_X_clear    deckColour " + deckColour + "   deckColourBg " + deckColourBg, C.R, 1, 2);
    //  if (LaunchpadProMK3.currentPage === 0) {
    //    let rgbArray = LaunchpadProMK3.hexToRGB(deckColourBg);
    // LaunchpadProMK3.sendRGB(padAddress, rgbArray[0], rgbArray[1], rgbArray[2]);
    //  };
    //})
  };
  DEBUG("Deck: ## ending mainpads init" + C.RE + " for deckNum " + C.O + deckNum, C.R, 0, 1);

  //// Deck sidepad Intro/Outro Hotcues
  DEBUG("Deck: ## intro/outro sidepads init" + C.RE + "  for deckNum " + C.O + deckNum, C.G);
  this.sideButtons = [];
  DEBUG("Deck: this.deckSidepadAddresses " + C.O + this.deckSidepadAddresses)
  for (sidepad = 1; sidepad <= 4; sidepad += 1) {
    //let padAddress = this.deckSidepadAddresses[sidepad-1]
    let padAddress = this.deckSidepadAddresses[sidepad - 1];
    if (LaunchpadProMK3.selectPage === 6) { padAddress = LaunchpadProMK3.sidepads[12 + sidepad] - 20 };
    // the sidepad control this loop will setup
    let sidepadControlName = LaunchpadProMK3.sidepadNames[sidepad - 1];
    let rgb = LaunchpadProMK3.hexToRGB(0x00FFFF)
    DEBUG("Deck: sidepad " + C.O + sidepad + C.RE + "   padAddress " + C.O + padAddress + C.RE + " / " + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   sidepadControlName " + C.O + sidepadControlName + C.RE + "   deck " + C.O + deckNum, C.G);

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
              DEBUG("Deck (input): side press: deck " + C.O + deckNum + C.RE + "   padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   sidepadControlName: " + C.O + sidepadControlName + C.RE + "activate", C.G, 1);
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
      DEBUG(">> makeConnection " + C.O + sidepadControlName + C.RE + " enabled on deck " + C.O + deckNum + C.RE + " padAddress " + C.O + padAddress, C.G);
      if (LaunchpadProMK3.currentPage === 0) {
        //LaunchpadProMK3.trackWithIntroOutro(value, deckNum, padAddress);
        LaunchpadProMK3.trackWithIntroOutro(1, deckNum, padAddress);
      }
    }); //end makeConnection
  }; //end sidepad init loop
  DEBUG("Deck: ## ending sidepads init" + C.RE + " for deck " + C.O + deckNum, C.R, 0, 1);


  // Initialize the bpm scaling arrays for this deck
  DEBUG("Deck: ## init bpm scaling etc arrays" + C.RE + " for deck " + C.O + deckNum, C.G)
  // Initialize the bpm scaling arrays for this deck
  LaunchpadProMK3.bpmScaled[deckNum] = []
  LaunchpadProMK3.bpmScaled[deckNum].samplesInBeat = []
  LaunchpadProMK3.bpmScaled[deckNum].beatSamplePos = []
  LaunchpadProMK3.bpmScaled[deckNum].beatSamplePos0_5 = []
  LaunchpadProMK3.bpmScaled[deckNum].beatSamplePos0_666 = []
  LaunchpadProMK3.bpmScaled[deckNum].beatSamplePos0_75 = []
  LaunchpadProMK3.bpmScaled[deckNum].beatSamplePos1_25 = []
  LaunchpadProMK3.bpmScaled[deckNum].beatSamplePos1_333 = []
  LaunchpadProMK3.bpmScaled[deckNum].beatSamplePos1_5 = []

  LaunchpadProMK3.altBpmBeatSampleLength[deckNum] = [];


  // Initialize timer arrays properly
  LaunchpadProMK3.beatsSamplePos[deckNum].forEach(scale => {
    LaunchpadProMK3.bpmTimer[deckNum][scale] = 0;
  });


  LaunchpadProMK3.bpmTimer[deckNum] = 0


  DEBUG("## end init for bpm scaling etc arrays" + C.RE + " for deck " + C.O + deckNum, C.R, 0, 1)

  // on track load, calculate scaled beat positions
  engine.makeConnection(`[Channel${deckNum}]`, "track_loaded", function () {
    let value = engine.getValue(`[Channel${deckNum}]`, "track_loaded")
    DEBUG(">> makeConnection " + C.O + "track loaded event on deck " + C.G + deckNum + C.RE + "   value " + C.O + value, C.G, 1)
    LaunchpadProMK3.sleep(50)
    LaunchpadProMK3.bpmScaledInit(deckNum)
    LaunchpadProMK3.onTrackLoadedOrUnloaded(value, deckNum)
  })


  // on play/stop, stop all timers
  engine.makeConnection(`[Channel${deckNum}]`, "play", function (value) {
    DEBUG(">> makeConnection " + C.O + "play/stop event on deck " + C.O + deckNum + C.RE + "   value " + C.O + value, C.G, 1)

    if (value === 0) { // track stopped
      DEBUG(">> play: track is stopped on deck " + C.O + deckNum + C.RE + ", stopping all BPM timers..", C.G);
      // Stop all timers before resetting lights
      LaunchpadProMK3.stopAllBpmTimers();

      if (LaunchpadProMK3.currentPage === 2) { // Only handle BPM flash on page 2
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

      // First reset all timers and steps to ensure a clean state
      // LaunchpadProMK3.stopAllBpmTimers();

      // When play starts, we need to force reset the bpm flash steps
      LaunchpadProMK3.bpmResetToBpm(deckNum);

      if (value === 1) { // track started playing
        DEBUG(">> play: track now playing on deck " + C.O + deckNum + C.RE + ", starting flash animations", C.G);

        // Start flash animations for the pads in this deck
        let pads = LaunchpadProMK3.decks[deckNum].pads;
        //let deckColour = LaunchpadProMK3.hexToRGB(LaunchpadProMK3.decks[deckNum].colour);

        // Manually trigger flash for each pad with proper color mapping
        // bpmScaling only has 8 entries keyed "1" through "8"
        // We need to map our pad indexes to these keys correctly
        // Get BPM scaling colors - store for use in the loop
        scaleColorsRgb = [];
        for (let j = 1; j <= 8; j++) {
          let scale = j.toString();
          if (LaunchpadProMK3.bpmScaling[scale]) {
            scaleColorsRgb.push(LaunchpadProMK3.hexToRGB(LaunchpadProMK3.bpmScaling[scale].colour));
            DEBUG(">> play: adding scale color " + C.O + "#" + LaunchpadProMK3.bpmScaling[scale].colour.toString(16) + C.RE + " for key " + C.O + scale);
          }
        }

        // Give a small delay before starting flashes to ensure clean state
        // engine.beginTimer(20, function () {
        DEBUG(">> play: starting flash animations for deckNum " + C.O + deckNum + C.RE, C.G);

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
        // }, true);
      } else if (value === 0) { // track stopped
        DEBUG(">> play: track stopped on deck " + C.O + deckNum + C.RE + ", resetting BPM colors", C.R);
        LaunchpadProMK3.bpmResetToBpm(deckNum);
      }
    }
    DEBUG(">> end makeConnection  play/stop event on deck " + C.O + deckNum + C.RE + "   value " + C.O + value, C.R);
  });

  // on playback rate change, recalculate scaled beat positions
  engine.makeConnection(`[Channel${deckNum}]`, "rate", function () {
    DEBUG(">> makeConnection  rate changed on deck " + C.O + deckNum + C.RE + ", recalcuating scaled beat positions", C.G);
    LaunchpadProMK3.bpmScaledInit(deckNum)
  })

  // on beat_active, calculate times until scaled beats, from now to +1 beat
  engine.makeConnection(`[Channel${deckNum}]`, "beat_active", function () {
    if (LaunchpadProMK3.currentPage === 2) {
      DEBUG(">> makeConnection   beat active on deck " + C.O + deckNum + C.RE + ", starting flash animations", C.M);
      // this feature is found on page 3 irl

      // get the playhead position in the track, between 0 and 1
      let now = engine.getValue(`[Channel${deckNum}]`, "playposition")
      // get the track length in samples
      let trackLength = LaunchpadProMK3.bpmScaled[deckNum].trackLength
      // convert playhead position to sample position
      let nowSamplePosition = now * trackLength

      // calculate how many samples from now to oneBeatLater
      let oneBeatLater = nowSamplePosition + LaunchpadProMK3.bpmScaled[deckNum].samplesInBeat

      // clear timers from previous beat
      LaunchpadProMK3.stopAllBpmTimers();

      // for each scale ratio, get the sample positions of the scaled beats due between now and oneBeatLater
      LaunchpadProMK3.beatsSamplePos[deckNum].forEach(scale => {
        LaunchpadProMK3.inNextBeatFor[deckNum][scale] = LaunchpadProMK3.beatsSamplePos[deckNum][scale].filter((x) => x >= nowSamplePosition && x < oneBeatLater)
      })

      //       LaunchpadProMK3.inNextBeatFor[deckNum] = LaunchpadProMK3.beatsSamplePos[deckNum][scale].filter((x) => x >= nowSamplePosition && x < oneBeatLater)
      //       LaunchpadProMK3.inNextBeatFor[deckNum] = LaunchpadProMK3.beatsSamplePos[deckNum][scale].filter((x) => x >= nowSamplePosition && x < oneBeatLater)
      //       LaunchpadProMK3.inNextBeatFor[deckNum] = LaunchpadProMK3.beatsSamplePos[deckNum][scale].filter((x) => x >= nowSamplePosition && x < oneBeatLater)
      //       LaunchpadProMK3.inNextBeatFor[deckNum] = LaunchpadProMK3.beatsSamplePos[deckNum][scale].filter((x) => x >= nowSamplePosition && x < oneBeatLater)
      //       LaunchpadProMK3.inNextBeatFor[deckNum] = LaunchpadProMK3.beatsSamplePos[deckNum][scale].filter((x) => x >= nowSamplePosition && x < oneBeatLater)
      //       LaunchpadProMK3.beatsSamplePos[deckNum][scale]

      // LaunchpadProMK3.inNextBeatFor[deckNum].forEach(beat => {
      // DEBUG("beat_active: ###### " +C.O+ LaunchpadProMK3.inNextBeatFor[deckNum][scale], C.M)
      // })

      // clear timers from previous beat
      // LaunchpadProMK3.stopAllBpmTimers();

      /// begin to initiate timers to flash bpm pads
      // whats the top left-most pad for this deck?
      let firstPad = LaunchpadProMK3.decks[deckNum].padsFirst
      DEBUG("beat_active:   firstPad " + C.O + firstPad, C.G, 1, 0)
      // get the deck colour in rgb array form
      let deckRgb = LaunchpadProMK3.decks[deckNum].deckRgb
      DEBUG("beat_active:   deckRgb " + C.O + deckRgb)
      // calculate how many samples from now to oneBeatLater
      let samplesPerMs = LaunchpadProMK3.bpmScaled[deckNum].sampleRate / 1000;
      DEBUG("beat_active:   samplesPerMs " + C.O + samplesPerMs)

      // get the top left-most pad for this deck
      // let firstDigit = Math.floor(firstPad / 10);
      // flash column 4 and 5 in the usual manner
      // LaunchpadProMK3.bpmFlash(firstPad + 4, scaleColorsRgb[4], deckRgb)
      // LaunchpadProMK3.bpmFlash(firstPad + 5, scaleColorsRgb[5], deckRgb)

      // *sigh*
      /// flash 0.5, 0.666, 0.75, 1.25, 1.333, 1.5 using timers that are triggered at the start of each current beat
      // flashing for half speed
      // loop through array of when the scaled beats are in this next regular beat


      LaunchpadProMK3.beatsSamplePos[deckNum].forEach(scale => {
        // get this sample position for this next alt beat
        LaunchpadProMK3.inNextBeatFor[deckNum][scale].forEach((samplePos) => {
          // convert sample position to relative milliseconds from now
          let msFromNow = Math.max(10, (samplePos - nowSamplePosition) / samplesPerMs);
          DEBUG("beat_active:   timer for 0.5 BPM: " + C.O + msFromNow + "ms");
          if (msFromNow > 0 && msFromNow < 3000) { // Sanity check - don't set timers too far in advance
            LaunchpadProMK3.bpmTimer[deckNum][scale] = engine.beginTimer(msFromNow, function () {
              LaunchpadProMK3.bpmFlash(firstPad, scaleColorsRgb[0], deckRgb);
            }, true);
          }
        })
      })
      // // flashing for two thirds speed
      // for (let i = 0; i < LaunchpadProMK3.inNextBeatFor0_666[deckNum].length; i++) {
      //   let samplePos = LaunchpadProMK3.inNextBeatFor0_666[deckNum][i]
      //   // let now = engine.getValue(`[Channel${deckNum}]`, "playposition")
      //   // let currentPosition = nowSamplePosition + samplePos * length;
      //   let msFromNow = Math.max(10, (samplePos - nowSamplePosition) / samplesPerMs);
      //   DEBUG("beat_active:   timer for 0.666 BPM: " + C.O + msFromNow + "ms");
      //   if (msFromNow > 0 && msFromNow < 3000) { // Sanity check - don't set timers too far in advance
      //     LaunchpadProMK3.bpmTimerFor0_666[deckNum][i] = engine.beginTimer(msFromNow, function () {
      //       LaunchpadProMK3.bpmFlash(firstPad + 1, scaleColorsRgb[1], deckRgb);
      //     }, true);
      //   }
      // }
      // // flashing for three fourths speed
      // for (let i = 0; i < LaunchpadProMK3.inNextBeatFor0_75[deckNum].length; i++) {
      //   let samplePos = LaunchpadProMK3.inNextBeatFor0_75[deckNum][i]
      //   // let now = engine.getValue(`[Channel${deckNum}]`, "playposition")
      //   // let currentPosition = nowSamplePosition + samplePos * length;
      //   let msFromNow = Math.max(10, (samplePos - nowSamplePosition) / samplesPerMs);
      //   DEBUG("beat_active:   timer for 0.75 BPM: " + C.O + msFromNow + "ms");
      //   if (msFromNow > 0 && msFromNow < 3000) { // Sanity check - don't set timers too far in advance
      //     LaunchpadProMK3.bpmTimerFor0_75[deckNum][i] = engine.beginTimer(msFromNow, function () {
      //       LaunchpadProMK3.bpmFlash(firstPad + 2, scaleColorsRgb[2], deckRgb);
      //     }, true);
      //   }
      // }
      // // flashing for one and a quarter speed
      // for (let i = 0; i < LaunchpadProMK3.inNextBeatFor1_25[deckNum].length; i++) {
      //   let samplePos = LaunchpadProMK3.inNextBeatFor1_25[deckNum][i]
      //   // let now = engine.getValue(`[Channel${deckNum}]`, "playposition")
      //   // let currentPosition = nowSamplePosition + samplePos * length;
      //   let msFromNow = Math.max(10, (samplePos - nowSamplePosition) / samplesPerMs);
      //   DEBUG("beat_active:   timer for 1.25 BPM: " + C.O + msFromNow + "ms");
      //   if (msFromNow > 0 && msFromNow < 3000) { // Sanity check - don't set timers too far in advance
      //     LaunchpadProMK3.bpmTimerFor1_25[deckNum][i] = engine.beginTimer(msFromNow, function () {
      //       LaunchpadProMK3.bpmFlash(firstPad + 3, scaleColorsRgb[5], deckRgb);
      //     }, true);
      //   }
      // }
      // // flashing for a third faster
      // for (let i = 0; i < LaunchpadProMK3.inNextBeatFor1_333[deckNum].length; i++) {
      //   let samplePos = LaunchpadProMK3.inNextBeatFor1_333[deckNum][i]
      //   // let now = engine.getValue(`[Channel${deckNum}]`, "playposition")
      //   // let currentPosition = nowSamplePosition + samplePos * length;
      //   let msFromNow = Math.max(10, (samplePos - nowSamplePosition) / samplesPerMs);
      //   DEBUG("beat_active:   timer for 1.333 BPM: " + C.O + msFromNow + "ms");
      //   if (msFromNow > 0 && msFromNow < 3000) { // Sanity check - don't set timers too far in advance
      //     LaunchpadProMK3.bpmTimerFor1_333[deckNum][i] = engine.beginTimer(msFromNow, function () {
      //       LaunchpadProMK3.bpmFlash(firstPad + 4, scaleColorsRgb[6], deckRgb);
      //     }, true);
      //   }
      // }
      // // flashing for double speed
      // for (let i = 0; i < LaunchpadProMK3.inNextBeatFor1_5[deckNum].length; i++) {
      //   let samplePos = LaunchpadProMK3.inNextBeatFor1_5[deckNum][i]
      //   // let now = engine.getValue(`[Channel${deckNum}]`, "playposition")
      //   // let currentPosition = nowSamplePosition + samplePos * length;
      //   let msFromNow = Math.max(10, (samplePos - nowSamplePosition) / samplesPerMs);
      //   DEBUG("beat_active:   timer for 1.5 BPM: " + C.O + msFromNow + "ms");
      //   if (msFromNow > 0 && msFromNow < 3000) { // Sanity check - don't set timers too far in advance
      //     LaunchpadProMK3.bpmTimerFor1_5[deckNum][i] = engine.beginTimer(msFromNow, function () {
      //       LaunchpadProMK3.bpmFlash(firstPad + 5, scaleColorsRgb[7], deckRgb);
      //     }, true);
      //   }
      // }
    }
  })

  DEBUG("### init reconnect Components properties to group", C.G, 1);
  // Set the group properties of the above Components and connect their output callback functions
  this.reconnectComponents(function (c) {
    if (c.group === undefined) {
      // 'this' inside a function passed to reconnectComponents refers to the ComponentContainer
      // so 'this' refers to the custom Deck object being constructed
      c.group = this.currentDeck;
    }
    DEBUG("Deck:  reconnectComponents" + C.RE + " (current group if group undefined)   " + C.O + c.group, C.O);
  });
  DEBUG("Deck: ### end reconnect Components properties to group", C.R, 0, 1);
}


LaunchpadProMK3.stopAllBpmTimers = function () {
  DEBUG("stopAllBpmTimers: stopping all alt tempo beat timers within this regular beat, for all decks", C.G);
  LaunchpadProMK3.beatsSamplePos[deckNum].forEach(scale => {
    scale.forEach(beat => {
      if (beat) {
        engine.stopTimer(beat);
        beat = null;
      }
    })
  })
  
  // for (let deckNum = 0; deckNum < LaunchpadProMK3.totalDecks; deckNum++) {
  //   if (LaunchpadProMK3.bpmTimerFor0_5[deckNum]) {
  //     for (let i = 0; i < LaunchpadProMK3.bpmTimerFor0_5[deckNum].length; i++) {
  //       if (LaunchpadProMK3.bpmTimerFor0_5[deckNum][i]) {
  //         engine.stopTimer(LaunchpadProMK3.bpmTimerFor0_5[deckNum][i]);
  //         LaunchpadProMK3.bpmTimerFor0_5[deckNum][i] = null;
  //       }
  //     }
  //     LaunchpadProMK3.bpmTimerFor0_5[deckNum] = [];
  //   }
  //   if (LaunchpadProMK3.bpmTimerFor0_666[deckNum]) {
  //     for (let i = 0; i < LaunchpadProMK3.bpmTimerFor0_666[deckNum].length; i++) {
  //       if (LaunchpadProMK3.bpmTimerFor0_666[deckNum][i]) {
  //         engine.stopTimer(LaunchpadProMK3.bpmTimerFor0_666[deckNum][i]);
  //         LaunchpadProMK3.bpmTimerFor0_666[deckNum][i] = null;
  //       }
  //     }
  //     LaunchpadProMK3.bpmTimerFor0_666[deckNum] = [];
  //   }
  //   if (LaunchpadProMK3.bpmTimerFor0_75[deckNum]) {
  //     for (let i = 0; i < LaunchpadProMK3.bpmTimerFor0_75[deckNum].length; i++) {
  //       if (LaunchpadProMK3.bpmTimerFor0_75[deckNum][i]) {
  //         engine.stopTimer(LaunchpadProMK3.bpmTimerFor0_75[deckNum][i]);
  //         LaunchpadProMK3.bpmTimerFor0_75[deckNum][i] = null;
  //       }
  //     }
  //     LaunchpadProMK3.bpmTimerFor0_75[deckNum] = [];
  //   }

  //   if (LaunchpadProMK3.bpmTimerFor1_25[deckNum]) {
  //     for (let i = 0; i < LaunchpadProMK3.bpmTimerFor1_25[deckNum].length; i++) {
  //       if (LaunchpadProMK3.bpmTimerFor1_25[deckNum][i]) {
  //         engine.stopTimer(LaunchpadProMK3.bpmTimerFor1_25[deckNum][i]);
  //         LaunchpadProMK3.bpmTimerFor1_25[deckNum][i] = null;
  //       }
  //     }
  //     LaunchpadProMK3.bpmTimerFor1_25[deckNum] = [];
  //   }
  //   if (LaunchpadProMK3.bpmTimerFor1_333[deckNum]) {
  //     for (let i = 0; i < LaunchpadProMK3.bpmTimerFor1_333[deckNum].length; i++) {
  //       if (LaunchpadProMK3.bpmTimerFor1_333[deckNum][i]) {
  //         engine.stopTimer(LaunchpadProMK3.bpmTimerFor1_333[deckNum][i]);
  //         LaunchpadProMK3.bpmTimerFor1_333[deckNum][i] = null;
  //       }
  //     }
  //     LaunchpadProMK3.bpmTimerFor1_333[deckNum] = [];
  //   }
  //   if (LaunchpadProMK3.bpmTimerFor1_5[deckNum]) {
  //     for (let i = 0; i < LaunchpadProMK3.bpmTimerFor1_5[deckNum].length; i++) {
  //       if (LaunchpadProMK3.bpmTimerFor1_5[deckNum][i]) {
  //         engine.stopTimer(LaunchpadProMK3.bpmTimerFor1_5[deckNum][i]);
  //         LaunchpadProMK3.bpmTimerFor1_5[deckNum][i] = null;
  //       }
  //     }
  //     LaunchpadProMK3.bpmTimerFor1_5[deckNum] = [];
  //   }
  // }
  // Reset all flash steps to stop the flashing behavior
  for (let pad = 11; pad <= 88; pad++) {
    LaunchpadProMK3.bpmFlashStep[pad] = 0;

    // Also stop any active flash timers
    if (LaunchpadProMK3.bpmFlashTimers && LaunchpadProMK3.bpmFlashTimers[pad]) {
      DEBUG("stopAllBpmTimers: stopping flash timer for pad " + C.O + pad + C.R + " in stopAllBpmTimers", C.O);
      engine.stopTimer(LaunchpadProMK3.bpmFlashTimers[pad]);
      LaunchpadProMK3.bpmFlashTimers[pad] = null;
    }
  }

  // Ensure we reset the flash timer array completely
  LaunchpadProMK3.bpmFlashTimers = {}; // object with keys
  LaunchpadProMK3.bpmFlashStep = [] // reset steps too
  DEBUG("stopAllBpmTimers: all bpm flash timers stopped and reset", C.R);
}

LaunchpadProMK3.Deck.prototype = new components.Deck();

//// End of Deck object setup



//// Page functions

// handle switching pages
LaunchpadProMK3.selectPage = function (page) {
  // find target page if none provided
  if (page === undefined) {
    page = (+LaunchpadProMK3.currentPage + 1) % 7;
    DEBUG("selectPage: page undefined, selectPage setting page to " + C.O + page + 1, C.G, 1);
  }

  DEBUG("selectPage: switching page from " + C.O + (+LaunchpadProMK3.currentPage + 1) + C.RE + " to " + C.O + (+page + 1), C.G, 1);
  LaunchpadProMK3.currentPage = page;

  // Clean up all animation timers when leaving BPM scaling page
  if (LaunchpadProMK3.currentPage !== 2) {
    DEBUG("selectPage: switching away from BPM scaling page, cleaning up all timers");
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

  // DEBUG("selectPage: deck.config: " +C.O+ JSON.stringify(LaunchpadProMK3.deck.config))
  DEBUG("selectPage: leaving selectPage..", C.R, 0, 1)
};


LaunchpadProMK3.clearBeatConnections = function () {
  if (LaunchpadProMK3.beatConnections && LaunchpadProMK3.beatConnections.length > 0) {
    DEBUG("clearBeatConnections: ### clearing " + C.O + LaunchpadProMK3.beatConnections.length + C.RE + " beat connections");
    // Disconnect each connection
    for (let i = 0; i < LaunchpadProMK3.beatConnections.length; i++) {
      let conn = LaunchpadProMK3.beatConnections[i];
      if (conn) {
        engine.disconnectControl(conn.group, conn.control, conn.callback);
        DEBUG("clearBeatConnections:   disconnected " + C.O + conn.group + C.RE + "." + C.O + conn.control);
      }
    }
    // Clear the array
    LaunchpadProMK3.beatConnections = [];
  };
};


// Update main and side pad lights for a specific deck
LaunchpadProMK3.updateHotcueLights = function (deck) {
  DEBUG("updateHotcueLights:           deck " + C.O + JSON.stringify(deck))
  DEBUG("updateHotcueLights:    deck.config " + C.O + JSON.stringify(LaunchpadProMK3.deck.config))
  DEBUG("updateHotcueLights: deck.config[" + C.O + deck + C.RE + "] " + C.O + JSON.stringify(LaunchpadProMK3.deck.config[deck]))
  let deckColour = LaunchpadProMK3.deck.config[deck].colour;
  if (deckColour === undefined) {
    deckColour = 0x444444;
  }
  // hotcues
  let colourSpecMulti = [];
  let deckLoaded = engine.getValue(`[Channel${deck}]`, "track_loaded")
  DEBUG("updateHotcueLights: hotcue lights for " + C.RE + "deck " + C.O + deck + C.RE + "   deckColour " + C.O + "#" + deckColour.toString(16).padStart(6, "0").toUpperCase() + C.RE + "   LaunchpadProMK3.totalDeckHotcuePads " + C.O + LaunchpadProMK3.totalDeckHotcuePads + C.RE + "   deckLoaded " + C.O + deckLoaded, C.G, 1);

  // go through the hotcues one by one
  for (let i = 1; i <= LaunchpadProMK3.totalDeckHotcuePads; i += 1) {
    padAddress = LaunchpadProMK3.decks[deck].pads[i - 1];
    if (LaunchpadProMK3.currentPage === 6) { padAddress = LaunchpadProMK3.decks[4].pads[i - 1]; }
    if (deckLoaded !== 1) {
      // if deck unloaded, dim deck colour
      DEBUG("updateHotcueLights: deck " + C.RE + deck + C.RE + " unloaded", C.R);
      deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
      deckRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckUnloadedDimscale)

    } else if (deckLoaded === 1) {
      DEBUG("updateHotcueLights: deck " + C.RE + deck + C.RE + " loaded", C.G);
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
        deckRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckLoadedDimscale);
        debugHotcueEnabled = "   hotcueEnabled " + C.R + "0   deckColour " + C.O + "#" + deckColour.toString(16).padStart(6, "0").toUpperCase() + C.RE + "   deckRgb " + C.O + deckRgb;
      }
      DEBUG("d " + C.O + deck + C.RE + "   i " + C.O + i + C.RE + "   padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + debugHotcueEnabled, C.RE)
    }
    colourSpecMulti = colourSpecMulti.concat([0x03, padAddress, Math.floor(deckRgb[0] / 2), Math.floor(deckRgb[1] / 2), Math.floor(deckRgb[2] / 2)]);
    //colourSpecMulti = colourSpecMulti.concat([ 0x03, padAddress, deckRgb[0], deckRgb[1], deckRgb[2] ]);
  }

  DEBUG("updateHotcueLights: finished creating pad address sysex msg, sending...", C.O, 1);
  LaunchpadProMK3.sendSysEx([0x03].concat(colourSpecMulti));
  DEBUG("updateHotcueLights: end updating main pads", C.R);

  // Sidebar, to blue and off
  DEBUG("updateHotcueLights: update sidepad lights" + C.RE + " for deck " + C.O + deck, C.G, 1);
  for (let i = 1; i <= 4; i += 1) {
    let sidepad = (deck) * 4 + i;
    //let padAddress = LaunchpadProMK3.sidepads[sidepad];
    let padAddress = LaunchpadProMK3.decks[deck].deckSidepadAddresses[i - 1];
    if (LaunchpadProMK3.currentPage === 6) { padAddress = LaunchpadProMK3.sidepads[11 + i] };
    let sidepadControlName = LaunchpadProMK3.sidepadNames[i - 1];
    let sidepadEnabled = engine.getValue(`[Channel${deck}]`, `${sidepadControlName}enabled`);
    if (sidepadEnabled === 1) {
      DEBUG("updateHotcueLights: d " + C.O + deck + C.RE + "   i " + C.O + i + C.RE + "   sidepad " + C.O + sidepad + C.RE + "   padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   control " + C.O + sidepadControlName + C.G + "activate", C.G);
      LaunchpadProMK3.trackWithIntroOutro(1, deck, padAddress);
    } else {
      LaunchpadProMK3.trackWithIntroOutro(0, deck, padAddress);
    }
  }
  DEBUG("updateHotcueLights: end updating sidepads", C.R, 0, 1);
};



LaunchpadProMK3.gradientSetup = function (deck, altpos, gradStartA, gradEndA, gradStartB, gradEndB) {
  let deckColour = LaunchpadProMK3.decks[deck].deckColour;
  let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
  DEBUG("gradientSetup: deck " + C.O + deck + C.RE + "   altpos " + C.O + altpos + C.RE + "   deckColour " + C.O + "#" + deckColour + C.RE + "   deckRgb " + C.O + deckRgb, C.G, 1);
  deckLoaded = engine.getValue(`[Channel${deck}]`, "track_loaded");
  let gradLength = LaunchpadProMK3.totalDeckHotcuePads / 2
  let gradA = LaunchpadProMK3.gradientCalculate(gradStartA, gradEndA, gradLength);
  let gradB = LaunchpadProMK3.gradientCalculate(gradStartB, gradEndB, gradLength);
  let gradBoth = gradA.concat(gradB);
  DEBUG("gradientSetup:  gradBoth " + C.O + gradBoth + C.RE + "   len " + C.O + gradBoth.length);
  if (altpos === undefined) { altpos = 1 }
  let pads = ""
  if (LaunchpadProMK3.currentPage !== 6) {
    pads = LaunchpadProMK3.decks[deck].pads;
  } else {
    pads = LaunchpadProMK3.decks[altpos].pads;
  }
  DEBUG("gradientSetup: pads " + C.O + pads + C.RE + "   len " + C.O + pads.length);
  for (let pad of pads) {
    let toSend = gradBoth.shift();
    DEBUG("gradientSetup: toSend " + C.O + toSend + C.RE + "   len " + C.O + gradBoth.length);
    if (deckLoaded !== 1) { toSend = LaunchpadProMK3.darkenRGBColour(toSend, LaunchpadProMK3.deckLoadedDimscale) }
    DEBUG("gradientSetup:  gradBoth " + C.O + gradBoth + C.RE + "   len " + C.O + gradBoth.length);
    let r = toSend[0];
    let g = toSend[1];
    let b = toSend[2];
    DEBUG("gradientSetup: toSend " + C.O + toSend + C.RE + "   pad " + C.O + pad + C.RE + "   r " + C.O + r + C.RE + "  g " + C.O + g + C.RE + "   b " + C.O + b, C.O);
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


/* function interleave(arr, arr2) {
  let newArr = [];
  for (let i = 0; i < arr.length; i++) {
    newArr.push(arr[i], arr2[i]);
  }
  return newArr;
} */;


// Send RGB values to a single pad
LaunchpadProMK3.sendRGB = function (pad, r, g, b) {
  // DEBUG(" sendRGB>>   r " + C.O + r + C.RE + "   g " + C.O + g + C.RE + "   b " + C.O + b);
  if (g === undefined && r !== undefined) {
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
  // if (ratio === undefined) { DEBUG("LaunchpadProMK3.darkenRGBColour   darken ratio undefined, so ratio = 0.2", C.O); ratio = 0.2 }
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


LaunchpadProMK3.sidepadDeckColour = function (d) {
  DEBUG("LaunchpadProMK3.sidepadDeckColour()", C.G, 2)
  DEBUG("sidepadDeckColour:   d " + C.O + d, C.RE);

  let deckPosition = LaunchpadProMK3.deck.config[d].order;
  let deckColour = LaunchpadProMK3.deck.config[d].colour;
  let deckSidepadsStart = ((deckPosition - 1) * 4);
  DEBUG("sidepadDeckColour:   deckSidepadsStart " + C.O + deckSidepadsStart);

  // get hard copy of array of sidepad addresses for deck position
  const sidepads = LaunchpadProMK3.sidepads.slice(deckSidepadsStart, deckSidepadsStart + 4);
  DEBUG("sidepadDeckColour:   sidepads " + C.O + sidepads);

  // cut next LED address from sidepad list
  let nextAddress = sidepads.shift();
  DEBUG("sidepadDeckColour:   nextAddress " + C.O + nextAddress);
  LaunchpadProMK3.sendHEX(nextAddress, deckColour);
  // Set the color for current deck LED
  let next2Address = sidepads.shift();
  DEBUG("sidepadDeckColour:   next2Address " + C.O + next2Address, C.R);
  LaunchpadProMK3.sendHEX(next2Address, deckColour);
  // Set the color for next deck LED
  let next3Address = sidepads.shift();
  DEBUG("sidepadDeckColour:   next3Address " + C.O + next3Address, C.R);
  LaunchpadProMK3.sendHEX(next3Address, deckColour);
  // Set the color for next next deck LEDs
  let next4Address = sidepads.shift();
  DEBUG("sidepadDeckColour:   next4Address " + C.O + next4Address, C.R);
  LaunchpadProMK3.sendHEX(next4Address, deckColour);
  DEBUG("sidepadDeckColour:   extras side colour deck " + C.O + d + C.RE + "   nextAddress " + C.O + nextAddress + C.RE + "   next2Address " + C.O + next2Address + C.RE + "   next3Address " + C.O + next3Address + C.RE + "   next4Address " + C.O + next4Address + C.RE, C.RE, 0, 1);
}


// Select deck and change LEDs
LaunchpadProMK3.selectDeck = function (deckNum) {
  DEBUG("selectDeck:   deckNum " + C.O + deckNum + C.RE, C.G, 2);
  // remember selection
  LaunchpadProMK3.selectedDeck = deckNum
  Object.entries(LaunchpadProMK3.deck.config).forEach((d) => {
    let deckRgb = LaunchpadProMK3.hexToRGB(d[1].colour);
    DEBUG("selectDeck:   " + C.RE + "d " + C.O + JSON.stringify(d) + C.RE + "   deckNum " + C.O + deckRgb + C.RE + "   colour " + C.O + "#" + d[1].colour.toString(16) + C.RE + deckNum + C.RE + "   deckRgb " + C.O + deckRgb + C.RE + "   deck order " + C.O + d[1].order + C.RE + "/" + C.O + LaunchpadProMK3.totalDecks, C.R);
    if (+d[0] !== deckNum) {
      deckRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckUnloadedDimscale);
    }
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
  DEBUG((value === 1 ? `onTrackLoadedOrUnloaded: track loaded on deck ${deckNum}` : `onTrackLoadedOrUnloaded: track unloaded from deck ${deckNum}`), C.G);

  LaunchpadProMK3.updateCurrentPage()
  LaunchpadProMK3.bpmFlashStepInit()

  DEBUG("onTrackLoadedOrUnloaded: track load/unload per page action fin....", C.R, 0, 1)
}


// refresh whatever the current page is3
LaunchpadProMK3.updateCurrentPage = function () {
  DEBUG("entering LaunchpadProMK3.updateCurrentPage()", C.R, 2, u2)
  switch (LaunchpadProMK3.currentPage) {
    case 0:
      DEBUG("LaunchpadProMK3.updateHotcuePage()", C.G, 1)
      LaunchpadProMK3.updateHotcuePage();
      DEBUG("leaving LaunchpadProMK3.updateHotcuePage()", C.R, 1)
      break;
    case 1:
      DEBUG("LaunchpadProMK3.updateBeatjumpPage()", C.G, 1)
      LaunchpadProMK3.updateBeatjumpPage();
      DEBUG("leaving LaunchpadProMK3.updateBeatjumpPage()", C.R, 1)
      break;
    case 2:
      DEBUG("LaunchpadProMK3.updateBpmScalePage()", C.G, 1)
      LaunchpadProMK3.updateBpmScalePage();
      DEBUG("leaving LaunchpadProMK3.updateBpmScalePage()", C.R, 1)
      break;
    case 3:
      DEBUG("LaunchpadProMK3.updateLoopPage()", C.G, 1)
      LaunchpadProMK3.updateLoopPage();
      DEBUG("leaving LaunchpadProMK3.updateLoopPage()", C.R, 1)
      break;
    case 4:
      DEBUG("LaunchpadProMK3.updateReverseLoopPage()", C.G, 1)
      LaunchpadProMK3.updateReverseLoopPage();
      DEBUG("leaving LaunchpadProMK3.updateReverseLoopPage()", C.R, 1)
      break;
    case 5:
      DEBUG("LaunchpadProMK3.updateLoopExtrasPage()", C.G, 1)
      LaunchpadProMK3.updateLoopExtrasPage();
      DEBUG("leaving LaunchpadProMK3.updateLoopExtrasPage()", C.R, 1)
      break;
    case 6:
      DEBUG("LaunchpadProMK3.updateOneDeckPage()", C.G, 1)
      LaunchpadProMK3.updateOneDeckPage();
      DEBUG("leaving LaunchpadProMK3.updateOneDeckPage()", C.R, 1)
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


LaunchpadProMK3.startTime = function () {
  LaunchpadProMK3.startTime = Date.now();
};

LaunchpadProMK3.whereTime = function () {
  return C.Y + "-whereTime: " + C.RE + (Date.now() - LaunchpadProMK3.startTime);
};

let lastHotcueCreationTime = 0;


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
    DEBUG("                              .o8                .                                                                .oooo.   ", C.M);
    DEBUG("                             '888              .o8                                                               d8P'`Y8b  ", C.M);
    DEBUG(" oooo  ooo. .oo.   oooo  .o888oo   .oooo.   .o888oo  .ooooo.      oo.ooooo.   .oooo.    .oooooooo  .ooooo.      888    888 ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b      888' `88b `P  )88b  888' `88b  d88' `88b    888    888 ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888      888   888  .oP'888  888   888  888ooo888    888    888 ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o      888   888 d8(  888  `88bod8P'  888    .o    `88b  d88' ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'      888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'     `Y8bd8P'  ", C.M);
    DEBUG("              888                                                   888                 d'     YD                          ", C.M);
    DEBUG("             o888o                                                 o888o                 'Y88888P'                         ", C.M);
    DEBUG("  ");
    DEBUG("LaunchpadProMK3.updateHotcuePage()", C.G);
    DEBUG("updateHotcuePage: set/refresh hotcue page, deck " + deck, C.G);
    if (deck === undefined) {
      DEBUG("updateHotcuePage: deck undefined = updating all decks..", C.O);
      DEBUG("updateHotcuePage: deck " + C.O + JSON.stringify(deck));
      DEBUG("updateHotcuePage: LaunchpadProMK3.deck.config " + C.O + JSON.stringify(LaunchpadProMK3.deck.config));
      DEBUG("updateHotcuePage: LaunchpadProMK3.deck.config[deck] " + C.O + JSON.stringify(LaunchpadProMK3.deck.config[deck]));
      LaunchpadProMK3.updateHotcueLights(1);
      LaunchpadProMK3.updateHotcueLights(2);
      if (LaunchpadProMK3.totalDecks === 4) {
        LaunchpadProMK3.updateHotcueLights(3);
        LaunchpadProMK3.updateHotcueLights(4);
      }
      DEBUG("updateHotcuePage: end updating decks", C.R, 0, 1);
    } else {
      DEBUG("updateHotcuePage: ## updating " + C.O + deck, C.G);
      LaunchpadProMK3.updateHotcueLight(deck);
      DEBUG("updateHotcuePage: ### end updating deck", C.R, 0, 1);
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
    DEBUG("                              .o8                .                                                               .o  ", C.M);
    DEBUG("                             '888              .o8                                                             o888  ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.     oo.ooooo.   .oooo.    .oooooooo  .ooooo.      888  ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b     888' `88b `P  )88b  888' `88b  d88' `88b     888  ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888     888   888  .oP'888  888   888  888ooo888     888  ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o     888   888 d8(  888  `88bod8P'  888    .o     888  ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'     888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'    o888o ", C.M);
    DEBUG("              888                                                 888                 d'     YD                     ", C.M);
    DEBUG("             o888o                                               o888o                 'Y88888P'                    ", C.M);
    DEBUG("  ");
    DEBUG("### updateBeatjumpPage", C.G, 0, 1);

    LaunchpadProMK3.clearMain();
    for (let deckNum = 1; deckNum <= LaunchpadProMK3.totalDecks; deckNum += 1) {
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
  DEBUG("bpmResetToDeck: resetting main pads of " + C.O + deckNum + C.RE + " to deck colour", C.G, 1);
  for (const [deckNum, conf] of Object.entries(LaunchpadProMK3.deck.config)) {
    let deckColour = conf.colour
    let pads = LaunchpadProMK3.decks[deckNum].pads
    let deckRgb = LaunchpadProMK3.hexToRGB(deckColour)
    DEBUG("bpmResetToDeck: deckNum " + C.O + deckNum)
    DEBUG("bpmResetToDeck: conf.order " + C.O + conf.order)
    DEBUG("bpmResetToDeck: deckColour " + C.O + "#" + deckColour.toString(16))
    DEBUG("bpmResetToDeck: deckRgb " + C.O + deckRgb)

    deckLoaded = engine.getValue(`[Channel${deckNum}]`, "track_loaded");
    if (deckLoaded === 1) { deckRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckLoadedDimscale); }
    if (deckLoaded !== 1) { deckRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckUnloadedDimscale); }
    pads.forEach((pad) => {
      LaunchpadProMK3.sendRGB(pad, deckRgb[0], deckRgb[1], deckRgb[2]);
    });
  }
  DEBUG("bpmResetToDeck: end resetting main pads to deck colour", C.R, 0, 1);
}

LaunchpadProMK3.bpmResetToBpm = function (deckNum) {
  if (deckNum) {
    DEBUG("bpmResetToDeck: resetting main pads of " + C.O + deckNum + C.RE + " to bpm scale column colour", C.G, 1);
    let pads = LaunchpadProMK3.decks[deckNum].pads;
    let scaleColumn = 1;
    DEBUG("bpmResetToBpm: pads " + C.O + pads, C.O);
    for (let pad of pads) {
      let scaleColour = LaunchpadProMK3.bpmScaling[scaleColumn].colour;
      let scaleRgb = LaunchpadProMK3.hexToRGB(scaleColour);
      DEBUG("bpmResetToBpm:  scaleColumn " + C.O + scaleColumn + C.RE + "   pad " + C.O + pad + C.RE + "   scaleColour " + C.O + "#" + scaleColour.toString(16) + C.RE + "   scaleRgb " + C.O + scaleRgb);
      LaunchpadProMK3.sendRGB(pad, scaleRgb[0], scaleRgb[1], scaleRgb[2]);
      scaleColumn = scaleColumn + 1;
      if (scaleColumn === 9) scaleColumn = 1;
    }
    DEBUG("bpmResetToBpm: end resetting main pads to bpm colour", C.R, 0, 1);
  };
}




LaunchpadProMK3.updateBpmScalePage = function () {
  if (LaunchpadProMK3.currentPage === 2) {
    DEBUG("  ");
    DEBUG("                              .o8                .                                                               .oooo.   ", C.M);
    DEBUG("                             '888              .o8                                                             .dP''Y88b  ", C.M);
    DEBUG("  oooo  ooo. .oo.   oooo  .o888oo   .oooo.   .o888oo  .ooooo.     oo.ooooo.   .oooo.    .oooooooo  .ooooo.           ]8P' ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b     888' `88b `P  )88b  888' `88b  d88' `88b        .d8P'  ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888     888   888  .oP'888  888   888  888ooo888      .dP'     ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o     888   888 d8(  888  `88bod8P'  888    .o    .oP        ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'     888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'    8888888888 ", C.M);
    DEBUG("              888                                                 888                 d'     YD                           ", C.M);
    DEBUG("             o888o                                               o888o                 'Y88888P'                          ", C.M);
    DEBUG("  ");
    DEBUG("updateBpmScalePage:", C.G);
    LaunchpadProMK3.clearMain();

    // reset pads to deckcolour so they're ready to continue
    LaunchpadProMK3.bpmResetToDeck()

    // clear existing timers
    LaunchpadProMK3.stopAllBpmTimers();
    // DEBUG("updateBpmScalePage:   stopping any existing bpm scale timers..", C.R, 0, 1);

    // init/reset bpm flash step array
    LaunchpadProMK3.bpmFlashStepInit();

    // initialise deck check var
    let loaded = [];

    // initialize arrays for BPM scaling
    LaunchpadProMK3.beatConnections = [];


    // initialize pad press handlers if not already initialized
    if (!LaunchpadProMK3.onPadPressed) {
      LaunchpadProMK3.onPadPressed = {};
    }

    // for each deck
    //DEBUG("set up loops for each deck to create timers for each double-pad if they're playing");
    for (let deckNum = 1; deckNum <= LaunchpadProMK3.totalDecks; deckNum++) {
      DEBUG("updateBpmScalePage: ######### deckNum " + C.O + deckNum, C.G, 1);
      // what are the pads of the deck?
      let pads = LaunchpadProMK3.decks[deckNum].pads;
      // what is the colour of the deck?
      let deckColour = LaunchpadProMK3.deck.config[deckNum].colour;
      DEBUG("updateBpmScalePage: deckColour " + C.O + "#" + deckColour.toString(16));
      // turn the deck colour hex value into an rgb array
      let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
      DEBUG("updateBpmScalePage: deckRgb " + C.O + deckRgb);
      // darken the colour of the deck so it's not distracting
      let deckRgbDim = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckUnloadedDimscale);
      DEBUG("updateBpmScalePage: deckRgbDim " + C.O + deckRgbDim);
      // is this deck loaded?
      let deckLoaded = engine.getValue(`[Channel${deckNum}]`, "track_loaded");
      DEBUG("updateBpmScalePage: deckLoaded for Channel? " + C.O + deckNum + C.RE + " = " + C.O + deckLoaded);

      // if no track is loaded, make the pads dimmer but still visible
      if (deckLoaded !== 1) {
        DEBUG("updateBpmScalePage: deckNum " + C.O + deckNum + C.R + " deck not loaded", C.R);
        for (let i = 1; i <= 8; i++) {
          let padAddress = pads[i - 1];
          // for each pad of the deck, turn it the shaded deck colour
          LaunchpadProMK3.sendRGB(padAddress, deckRgbDim[0], deckRgbDim[1], deckRgbDim[2]);
          LaunchpadProMK3.sendRGB(padAddress - 10, deckRgbDim[0], deckRgbDim[1], deckRgbDim[2]);
        }
        continue;

      } else {
        // if the deck is loaded;
        // initialize pads for loaded decks with proper colours
        for (let i = 1; i <= 8; i++) {
          // each column has two pads - top and bottom
          let topPad = pads[i - 1];
          let bottomPad = topPad - 10; // 10 is the offset to go to the row below
          // get colour for this column
          let scaleColour = LaunchpadProMK3.bpmScaling[i].colour;
          let scaleRgb = LaunchpadProMK3.hexToRGB(scaleColour);
          let scaleRgbDim = LaunchpadProMK3.darkenRGBColour(scaleRgb, 0.6); // Match the dimming level used in animation
          // initialize both pads with dim colour
          DEBUG("updateBpmScalePage: INIT PAD    deckNum " + C.O + deckNum + C.RE + "   column " + C.O + i + C.RE + "   scaleColour " + C.O + "#" + scaleColour.toString(16) + C.RE + "   scaleRgb " + C.O + scaleRgb + C.RE + "   scaleRgbDim " + C.O + scaleRgbDim, C.G);
          LaunchpadProMK3.sendRGB(topPad, scaleRgbDim[0], scaleRgbDim[1], scaleRgbDim[2]);
          LaunchpadProMK3.sendRGB(bottomPad, scaleRgbDim[0], scaleRgbDim[1], scaleRgbDim[2]);
        }

        // skip if no BPM is detected
        let bpm = engine.getValue(`[Channel${deckNum}]`, "bpm");
        if (!bpm) {
          // initialize pads for decks with no BPM as dimmed
          DEBUG("updateBpmScalePage: INIT PAD    NOOO BBBPPPMMM       deckNum " + deckNum + " no BPM detected!!!", C.R);
          for (let i = 1; i <= 8; i++) {
            //let padAddress = 80 - ((deckNum-1) * 20) + i;
            let padAddress = pads[i - 1];
            let dimWhiteRgb = LaunchpadProMK3.darkenRGBColour([30, 30, 30], 0.7);
            LaunchpadProMK3.sendRGB(padAddress, dimWhiteRgb[0], dimWhiteRgb[1], dimWhiteRgb[2]);
            LaunchpadProMK3.sendRGB(padAddress - 10, dimWhiteRgb[0], dimWhiteRgb[1], dimWhiteRgb[2]);
          }
          continue;
        }

        //DEBUG("is there a timing array for this deck? " + LaunchpadProMK3.bpmScaled[deckNum].slice(0, 5))
        // are the alt tempo arrays for this deck existing? if not, create them
        if (!LaunchpadProMK3.bpmScaled[deckNum]) LaunchpadProMK3.bpmScaledInit(deckNum)

        // connect the beat scale buttons to their indicator and control
        let scaleColumnNum = 1;
        step = 0;
        for (let key in LaunchpadProMK3.bpmScaling) {
          let ratio = LaunchpadProMK3.bpmScaling[key];
          let currentPad = pads[scaleColumnNum - 1];
          let control = ratio.control;
          let indicator = ratio.indicator;
          let scaleRgb = LaunchpadProMK3.hexToRGB(ratio.colour);
          scaleColumnNum++
          DEBUG(`updateBpmScalePage: currentPad ${C.O}${currentPad}${C.RE}   deckNum ${C.O}${deckNum}${C.RE}   scaleColumnNum ${C.O}${scaleColumnNum}${C.RE}   indicator ${C.O}${indicator}${C.RE}   control ${C.O}${control}${C.RE}`, C.G)
          DEBUG("updateBpmScalePage: bpmFlashStep " + C.O + LaunchpadProMK3.bpmFlashStep)

          // what is the first digit of the pad
          let firstDigit = Math.floor(currentPad / 10);
          if (firstDigit % 2 === 0) {
            // connect pad to corresponding beat scale control
            DEBUG(`>> makeConnection("[Channel${deckNum}]", "${indicator}", LaunchpadProMK3.bpmFlash(${currentPad}, ${scaleRgb}, ${deckRgb})`, C.O)

            engine.makeConnection(`[Channel${deckNum}]`, indicator, function () {
              DEBUG(">> makeConnection triggered   inside currentPad " + C.O + currentPad + C.RE + "   deckNum " + C.O + deckNum, C.O)
              LaunchpadProMK3.bpmFlash(currentPad, scaleRgb, deckRgb)
            });

          }
        }
        DEBUG("updateBpmScalePage: ## end of bpm scaling loop", C.R);
      }
      DEBUG("updateBpmScalePage: ## end of deck loop", C.R);
    };// end of page 2
    DEBUG("updateBpmScalePage: ## end updateBpmScalePage", C.R, 0, 1);
  }
}


LaunchpadProMK3.bpmFlashStepInit = function () {
  // reset the bpm pad flash step array
  LaunchpadProMK3.bpmFlashStep = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
};

// init object to calculate and store bpm scales for each deck
LaunchpadProMK3.bpmScaledInit = function (deckNum) {
  DEBUG("bpmScaledInit: ####### for deckNum " + deckNum, C.G, 2);
  LaunchpadProMK3.bpmFlashStepInit();

  // create/clear arrays to store sample positions for each beat for each speed for this deck
  LaunchpadProMK3.beatsSamplePos[deckNum]["0.5"] = [];
  LaunchpadProMK3.beatsSamplePos[deckNum]["0.666"] = [];
  LaunchpadProMK3.beatsSamplePos[deckNum]["0.75"] = [];
  LaunchpadProMK3.beatsSamplePos[deckNum]["1.25"] = [];
  LaunchpadProMK3.beatsSamplePos[deckNum]["1.333"] = [];
  LaunchpadProMK3.beatsSamplePos[deckNum]["1.5"] = [];
  
  // what is the track length in sample numbers?
  const trackLength = engine.getValue(`[Channel${deckNum}]`, "track_samples");
  // get the playhead position in the track, between 0 and 1
  const nowPos = engine.getValue(`[Channel${deckNum}]`, "playposition");
  // what is the current position in sample numbers?
  // since playposition is between 0 and 1, multiplying it by the track length
  const nowPosSample = trackLength * nowPos;

  // what is the sample rate of the audio file?
  const sampleRate = engine.getValue(`[Channel${deckNum}]`, "track_samplerate")
  // what is the bpm?
  const bpm = engine.getValue(`[Channel${deckNum}]`, "bpm");
  // how many samples in a beat?
  const samplesInBeat = (sampleRate / 60) * bpm;

  // how many regular beats in the song?
  // const beatsInSong = Math.floor(trackLength / samplesInBeat);

  DEBUG("bpmScaledInit: trackLength: " + C.O + trackLength);
  DEBUG("bpmScaledInit: position: " + C.O + nowPos)
  DEBUG("bpmScaledInit: nowPosSample: " + C.O + nowPosSample)
  DEBUG("bpmScaledInit: sampleRate: " + C.O + sampleRate);
  DEBUG("bpmScaledInit: bpm: " + C.O + bpm);
  DEBUG("bpmScaledInit: samplesInBeat: " + C.O + samplesInBeat);
  // DEBUG("bpmScaledInit: beatsInSong: " +C.O+ beatsInSong);


  // calculate scaled size of a beat for each scale
  // const altBpmBeatSampleLength[deckNum][0.5] = samplesInBeat * 0.5;     // half as many samples per beat
  // const altBpmBeatSampleLength[deckNum][0.666] = samplesInBeat * 0.666; // 2/3 as many samples per beat
  // const altBpmBeatSampleLength[deckNum][0.75] = samplesInBeat * 0.75;   // 3/4 as many samples per beat
  // const altBpmBeatSampleLength[deckNum][1.25] = samplesInBeat * 1.25;   // 1.25 as many samples per beat
  // const altBpmBeatSampleLength[deckNum][1.333] = samplesInBeat * 1.333; // 1.333 as many samples per beat
  // const altBpmBeatSampleLength[deckNum][1.5] = samplesInBeat * 1.5;     // 1.5 as many samples per beat


  LaunchpadProMK3.beatsSamplePos[deckNum].forEach(scale => {
    LaunchpadProMK3.altBpmBeatSampleLength[deckNum][scale] = samplesInBeat * (scale);
  })

  // calculate song length in beats for each scaled beat size
  // const songLengthInBeatsSamples[deckNum][0.5] = trackLength / altBpmBeatSampleLength[deckNum][0.5];
  // const songLengthInBeatsSamples[deckNum][0.666] = trackLength / altBpmBeatSampleLength[deckNum][0.666];
  // const songLengthInBeatsSamples[deckNum][0.75] = trackLength / altBpmBeatSampleLength[deckNum][0.75];
  // const songLengthInBeatsSamples[deckNum][1.25] = trackLength / altBpmBeatSampleLength[deckNum][1.25];
  // const songLengthInBeatsSamples[deckNum][1.333] = trackLength / altBpmBeatSampleLength[deckNum][1.333];
  // const songLengthInBeatsSamples[deckNum][1.5] = trackLength / altBpmBeatSampleLength[deckNum][1.5];

  LaunchpadProMK3.altBpmBeatSampleLength[deckNum].forEach(scale => {
    LaunchpadProMK3.songLengthInBeatsSamples[deckNum][scale] = trackLength / altBpmBeatSampleLength[deckNum][scale];
  })

  // calculate sample positions for each beat at each speed
  LaunchpadProMK3.songLengthInBeatsSamples[deckNum].forEach(scale => {
    LaunchpadProMK3.beatsSamplePos[deckNum][scale].push(LaunchpadProMK3.songLengthInBeatsSamples[deckNum][scale] * LaunchpadProMK3.altBpmBeatSampleLength[deckNum][scale]);
  });



  // for (let pos = 0; l < trackLength; pos + altBpmBeatSampleLength[deckNum]) {
  //   beatsSamplePos0_5[deckNum].push(i * altBpmBeatSampleLength0_5[deckNum]);
  //   beatsSamplePos0_666[deckNum].push(i * altBpmBeatSampleLength0_666[deckNum]);
  //   beatsSamplePos0_75[deckNum].push(i * altBpmBeatSampleLength0_75[deckNum]);
  //   beatsSamplePos1_25[deckNum].push(i * altBpmBeatSampleLength1_25[deckNum]);
  //   beatsSamplePos1_333[deckNum].push(i * altBpmBeatSampleLength1_333[deckNum]);
  //   beatsSamplePos1_5[deckNum].push(i * altBpmBeatSampleLength1_5[deckNum]);
  // }

  // // calculate sample positions for each speed
  // for (let i = 0; i < numBeats; i++) {
  //   beatSamplePos.push(i * samplesInBeat);
  //   beatSamplePos0_5.push(i * (samplesInBeat * 0.5));
  //   beatSamplePos0_666.push(i * (samplesInBeat * 0.666));
  //   beatSamplePos0_75.push(i * (samplesInBeat * 0.75));
  //   beatSamplePos1_25.push(i * (samplesInBeat * 1.25));
  //   beatSamplePos1_333.push(i * (samplesInBeat * 1.333));
  //   beatSamplePos1_5.push(i * (samplesInBeat * 1.5));
  // }
  // // for every scale ratio, generate an array with sample positions for each beat in each alternate tempo
  // for (let beatNum = 0; beatNum <= beatsInSong; beatNum++) {
  //   let beatSamplePos = beatNum * samplesInBeat;
  //   beatSamplePos[beatNum] = beatSamplePos;
  //   //DEBUG(deckNum + "   beatSamplePos   " +C.RE+ "beatNum " +C.O+ beatNum +C.RE+ "/" +C.O+ beatsInSong +C.RE+ "   beatSamplePos " +C.O+ beatSamplePos +C.RE+ "   samplesInBeat " +C.O+ samplesInBeat, C.G);
  // }

  // // for fractional tempos below the current tempo
  // for (let beatNum = 0; beatNum <= beatsInSong0_5; beatNum++) {
  //   let beatSamplePos = beatNum * samplesInBeat0_5;
  //   beatSamplePos0_5[beatNum] = beatSamplePos;
  //   //DEBUG(deckNum + "   beatSamplePos0_5   " +C.RE+ "beatNum " +C.O+ beatNum +C.RE+ "/" +C.O+ beatsInSong0_5 +C.RE+ "   beatsInSong0_5 " +C.O+ beatSamplePos0_5 +C.RE+ "   samplesInBeat0_5 " +C.O+ samplesInBeat0_5, C.G);
  // }
  // for (let beatNum = 0; beatNum < beatsInSong0_666; beatNum++) {
  //   let beatSamplePos = beatNum * samplesInBeat0_666;
  //   beatSamplePos0_666[beatNum] = beatSamplePos;
  //   // DEBUG(deckNum + "   beatSamplePos0_666   " +C.RE+ "beatNum " +C.O+ beatNum +C.RE+ "/" +C.O+ beatsInSong0_666 +C.RE+ "   beatSamplePos0_666 " +C.O+ beatSamplePos0_666 +C.RE+ "   samplesInBeat0_666 " +C.O+ samplesInBeat0_666, C.G);
  // }
  // for (let beatNum = 0; beatNum < beatsInSong0_75; beatNum++) {
  //   let beatSamplePos = beatNum * samplesInBeat0_75;
  //   beatSamplePos0_75[beatNum] = beatSamplePos;
  //   // DEBUG(deckNum + "   beatSamplePos0_75   " +C.RE+ "beatNum " +C.O+ beatNum +C.RE+ "/" +C.O+ beatsInSong0_75 +C.RE+ "   beatSamplePos_75 " +C.O+ beatSamplePos0_75 +C.RE+ "   samplesInBeat0_75 " +C.O+ samplesInBeat0_75, C.G);
  // }

  // // for fractional tempos above the current tempo
  // for (let beatNum = 0; beatNum < beatsInSong1_25; beatNum++) {
  //   let beatSamplePos = beatNum * samplesInBeat1_25;
  //   beatSamplePos1_25[beatNum] = beatSamplePos;
  //   // DEBUG(deckNum + "   beatSamplePos1_25   " +C.RE+ "beatNum " +C.O+ beatNum +C.RE+ "/" +C.O+ beatsInSong1_25 +C.RE+ "   beatSamplePos1_25 " +C.O+ beatSamplePos1_25 +C.RE+ "   samplesInBeat1_25 " +C.O+ samplesInBeat1_25, C.G);
  // }
  // for (let beatNum = 0; beatNum < beatsInSong1_333; beatNum++) {
  //   let beatSamplePos = beatNum * samplesInBeat1_333;
  //   beatSamplePos1_333[beatNum] = beatSamplePos;
  //   // DEBUG(deckNum + "   beatSamplePos1_333   " +C.RE+ "beatNum " +C.O+ beatNum +C.RE+ "/" +C.O+ beatsInSong1_333 +C.RE+ "   beatSamplePos1_333 " +C.O+ beatSamplePos1_333 +C.RE+ "   samplesInBeat1_333 " +C.O+ samplesInBeat1_333, C.G);
  // }
  // for (let beatNum = 0; beatNum < beatsInSong1_5; beatNum++) {
  //   let beatSamplePos = beatNum * samplesInBeat1_5;
  //   beatSamplePos1_5[beatNum] = beatSamplePos;
  //   // DEBUG(deckNum + "   beatSamplePos1_5   " +C.RE+ "beatNum " +C.O+ beatNum +C.RE+ "/" +C.O+ beatsInSong1_5 +C.RE+ "   beatSamplePos1_5 " +C.O+ beatSamplePos1_5 +C.RE+ "   samplesInBeat1_5 " +C.O+ samplesInBeat1_5, C.G);
  // }

  // calculate the number of beats in the track
  const numBeats = Math.floor(trackLength / (msInBeat / 1000));



  // ensure LaunchpadProMK3.bpmScaled exists
  if (!LaunchpadProMK3.bpmScaled) {
    LaunchpadProMK3.bpmScaled = {};
  }
  // create the object with all the calculated values
  LaunchpadProMK3.bpmScaled[deckNum] = {
    // store base info for this deck atm
    bpm: bpm,
    trackLength: trackLength,
    position: position,
    sampleRate: sampleRate,
    msInBeat: msInBeat,
    // // store the calculated values for each speed in the object
    // samplesInBeat: samplesInBeat,
    // beatsInSong: beatsInSong,
    // samplesInBeat0_5: samplesInBeat0_5,
    // samplesInBeat0_666: samplesInBeat0_666,
    // samplesInBeat0_75: samplesInBeat0_75,
    // samplesInBeat1_25: samplesInBeat1_25,
    // samplesInBeat1_333: samplesInBeat1_333,
    // samplesInBeat1_5: samplesInBeat1_5,
    // beatsInSong0_5: beatsInSong0_5,
    // beatsInSong0_666: beatsInSong0_666,
    // beatsInSong0_75: beatsInSong0_75,
    // beatsInSong1_25: beatsInSong1_25,
    // beatsInSong1_333: beatsInSong1_333,
    // beatsInSong1_5: beatsInSong1_5,
    // // store the arrays of sample positions for each speed in the object
    beatSamplePos: beatSamplePos,
    beatSamplePos0_5: beatSamplePos0_5,
    beatSamplePos0_666: beatSamplePos0_666,
    beatSamplePos0_75: beatSamplePos0_75,
    beatSamplePos1_25: beatSamplePos1_25,
    beatSamplePos1_333: beatSamplePos1_333,
    beatSamplePos1_5: beatSamplePos1_5

    // samplesInBeat0_5: samplesInBeat * 0.5,
    // samplesInBeat0_666: samplesInBeat * 0.666,
    // samplesInBeat0_75: samplesInBeat * 0.75,
    // samplesInBeat1_25: samplesInBeat * 1.25,
    // samplesInBeat1_333: samplesInBeat * 1.333,
    // samplesInBeat1_5: samplesInBeat * 1.5,
  };

  // DEBUG("all: " + JSON.stringify(LaunchpadProMK3.bpmScaled[deckNum]))
  DEBUG("bpmScaledInit: samplesInBeat: " + C.O + LaunchpadProMK3.bpmScaled[deckNum].samplesInBeat);
  DEBUG("### end of bpmScaledInit", C.R, 0, 1)
}

LaunchpadProMK3.bpmFlash = function (pad, scaleRgb, deckRgb) {
  // rate limiting - only proceed if no flash occurred for this pad in the last 30ms
  if (LaunchpadProMK3.lastFlashTime && LaunchpadProMK3.lastFlashTime[pad] && (new Date().getTime() - LaunchpadProMK3.lastFlashTime[pad]) < 0) {
    DEBUG("bpmFlash: rate limited....... for pad " + C.O + pad, C.R);
    return
  }

  // record this flash time
  if (!LaunchpadProMK3.lastFlashTime) LaunchpadProMK3.lastFlashTime = {};
  LaunchpadProMK3.lastFlashTime[pad] = new Date().getTime();

  // get the top and bottom pad addresses for this column
  let topPad = pad;
  let bottomPad = pad - 10; // 10 is the offset to go to the row below (top row is 81-88, bottom row is 71-78)

  // get a dimmed version of the rgb colour value for this pad
  let deckRgbDim = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckUnloadedDimscale);

  // clear any existing timer for this pad
  if (LaunchpadProMK3.bpmFlashTimers[pad]) {
    DEBUG("bpmFlash: stopping existing timer for pad " + C.O + pad, C.R);
    engine.stopTimer(LaunchpadProMK3.bpmFlashTimers[pad]);
    LaunchpadProMK3.bpmFlashTimers[pad] = null;
  }

  // Check if any track is playing first
  let anyTrackPlaying = false;
  let activeDeck = 1; // Default to deck

  for (let deckNum = 1; deckNum <= 4; deckNum++) {
    if (engine.getValue(`[Channel${deckNum}]`, "play") === 1) {
      DEBUG("bpmFlash: track playing on deck " + C.O + deckNum, C.O);
      anyTrackPlaying = true;
      activeDeck = deckNum;
      break;
    }
  }

  // If no track is playing, just set the initial state and return
  if (!anyTrackPlaying) {
    DEBUG("bpmFlash: no track playing, setting initial state for pad " + C.O + pad, C.R);
    LaunchpadProMK3.sendRGB(topPad, deckRgbDim[0], deckRgbDim[1], deckRgbDim[2]);
    LaunchpadProMK3.sendRGB(bottomPad, deckRgbDim[0], deckRgbDim[1], deckRgbDim[2]);
    LaunchpadProMK3.bpmFlashStep[pad] = 0;
    return;
  }

  // Get the BPM scale for this pad (based on column)
  //let bpmScales = [0.5, 0.666, 0.75, 1.25, 1.333, 1.5];
  let padColumn = pad % 10;
  let bpmScale = LaunchpadProMK3.bpmScaling[padColumn].scale
  DEBUG("bpmFlash: pad " + C.O + pad + C.RE + "   column " + C.O + padColumn + C.RE + "   scale " + C.G + bpmScale + C.RE + "   scaleRgb " + C.O + scaleRgb + C.RE + "   deckRgb " + C.O + deckRgb);
  //let bpmScale = (padColumn >= 1 && padColumn <= 6) ? bpmScaleRatio : 1;

  // Get BPM from the active deck
  let bpm = engine.getValue(`[Channel${activeDeck}]`, "bpm");
  DEBUG("bpmFlash: bpm " + C.O + bpm);
  if (!bpm || bpm <= 0) return;

  // Calculate flash timings
  let samplesInBeat;
  switch (bpmScale) {
    case 0.5: samplesInBeat = LaunchpadProMK3.bpmScaled[activeDeck].samplesInBeat0_5; break;
    case 0.666: samplesInBeat = LaunchpadProMK3.bpmScaled[activeDeck].samplesInBeat0_666; break;
    case 0.75: samplesInBeat = LaunchpadProMK3.bpmScaled[activeDeck].samplesInBeat0_75; break;
    case 1.25: samplesInBeat = LaunchpadProMK3.bpmScaled[activeDeck].samplesInBeat1_25; break;
    case 1.333: samplesInBeat = LaunchpadProMK3.bpmScaled[activeDeck].samplesInBeat1_333; break;
    case 1.5: samplesInBeat = LaunchpadProMK3.bpmScaled[activeDeck].samplesInBeat1_5; break;
    default: samplesInBeat = LaunchpadProMK3.bpmScaled[activeDeck].samplesInBeat;
  }

  // Convert samples to milliseconds for the timer
  let msPerStep = (samplesInBeat / LaunchpadProMK3.bpmScaled[activeDeck].sampleRate) * 1000;

  DEBUG("bpmFlash: samplesInBeat " + C.O + samplesInBeat)
  DEBUG("bpmFlash: msPerStep " + C.O + msPerStep)
  // Get the appropriate samples per beat based on the scale
  let samplesPerMs = LaunchpadProMK3.bpmScaled[activeDeck].sampleRate / 1000;

  // Define a self-contained animation function that works regardless of external state
  const flashPad = function () {
    // Always check if any track is still playing
    let stillPlaying = false;
    for (let deckNum = 1; deckNum <= 4; deckNum++) {
      if (engine.getValue(`[Channel${deckNum}]`, "play") === 1) {
        stillPlaying = true;
        break;
      }
    }

    let deckRgbDim = LaunchpadProMK3.darkenRGBColour(deckRgb);
    if (!stillPlaying) {
      // If track stopped, reset pads to initial state
      DEBUG("bpmFlash flashPad: track stopped during animation for pad " + C.O + pad);
      LaunchpadProMK3.sendRGB(topPad, deckRgbDim[0], deckRgbDim[1], deckRgbDim[2]);
      LaunchpadProMK3.sendRGB(bottomPad, deckRgbDim[0], deckRgbDim[1], deckRgbDim[2]);
      LaunchpadProMK3.bpmFlashStep[pad] = 0;

      // Stop timers to prevent continued animations after track stops
      //if (LaunchpadProMK3.bpmFlashTimers[pad]) {
      //  engine.stopTimer(LaunchpadProMK3.bpmFlashTimers[pad]);
      //  LaunchpadProMK3.bpmFlashTimers[pad] = null;
      //}

      return; // Stop animation
    }

    // Get current step and advance to next state
    let currentStep = LaunchpadProMK3.bpmFlashStep[pad];
    DEBUG("bpmFlash flashPad: ### CURRENT STEP    currentStep " + C.B + currentStep + C.RE + "   for pad " + C.O + pad + C.RE + " at " + C.O + (Date.now()) + C.RE + " ms", C.M);

    switch (currentStep) {
      case 0: // STEP 0: both pads on
        LaunchpadProMK3.sendRGB(topPad, scaleRgb[0], scaleRgb[1], scaleRgb[2]);
        LaunchpadProMK3.sendRGB(bottomPad, scaleRgb[0], scaleRgb[1], scaleRgb[2]);
        LaunchpadProMK3.bpmFlashStep[pad] = 1;
        DEBUG("bpmFlash flashPad: step 0→1: both pads on for pad " + C.O + pad, C.B);
        break;

      case 1: // STEP 1: bottom pad off
        LaunchpadProMK3.sendRGB(bottomPad, deckRgb[0], deckRgb[1], deckRgb[2]);
        LaunchpadProMK3.bpmFlashStep[pad] = 2;
        DEBUG("bpmFlash flashPad: step 1→2: bottom pad off for pad " + C.O + pad, C.B);
        break;

      case 2: // STEP 2: both pads on again
        LaunchpadProMK3.sendRGB(bottomPad, scaleRgb[0], scaleRgb[1], scaleRgb[2]);
        LaunchpadProMK3.bpmFlashStep[pad] = 3;
        DEBUG("bpmFlash flashPad: step 2→3: bottom pad off for pad " + C.O + pad, C.B);
        break;

      case 3: // STEP 3: top pad off
        LaunchpadProMK3.sendRGB(topPad, deckRgb[0], deckRgb[1], deckRgb[2]);
        LaunchpadProMK3.bpmFlashStep[pad] = 0;
        DEBUG("bpmFlash flashPad: step 3→0: top pad off for pad " + C.O + pad, C.B);
        break;

      default: // Reset if somehow we got an invalid state
        LaunchpadProMK3.bpmFlashStep[pad] = 0;
        break;
    }

    // Schedule the next animation step
    if (LaunchpadProMK3.bpmFlashTimers[pad]) {
      DEBUG("bpmFlash flashPad: stopping previous flash timer for pad " + C.O + pad, C.R);
      engine.stopTimer(LaunchpadProMK3.bpmFlashTimers[pad]);
      LaunchpadProMK3.bpmFlashTimers[pad] = null;
    }

    // Only schedule next step if still playing
    if (stillPlaying) {
      DEBUG("bpmFlash flashPad: scheduling " + C.RE + "next flash step in " + C.O + msPerStep + C.RE + " ms for pad " + C.O + pad + C.RE + "......", C.O);
      LaunchpadProMK3.bpmFlashTimers[pad] = engine.beginTimer(msPerStep, flashPad, true);
    }
  };

  // Start the animation immediately if a track is playing
  if (anyTrackPlaying) {
    DEBUG("bpmFlash flashPad: again..........", C.M, 0, 1);
    flashPad();
  } else {
    DEBUG("bpmFlash flashPad: not starting animation for pad " + C.O + pad + C.RE + " - no track playing");
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
    DEBUG("                              .o8                .                                                               .oooo.   ", C.M);
    DEBUG("                             '888              .o8                                                             .dP''Y88b  ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.     oo.ooooo.   .oooo.    .oooooooo  .ooooo.           ]8P' ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b     888' `88b `P  )88b  888' `88b  d88' `88b        <88b.  ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888     888   888  .oP'888  888   888  888ooo888         `88b. ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o     888   888 d8(  888  `88bod8P'  888    .o    o.   .88P  ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'     888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'    `8bd88P'   ", C.M);
    DEBUG("              888                                                  888                 d'     YD                          ", C.M);
    DEBUG("             o888o                                                o888o                 'Y88888P'                         ", C.M);
    DEBUG("  ");
    DEBUG("### updateLoopPage", C.G, 0, 1);

    LaunchpadProMK3.clearMain();
    for (let deck = 1; deck <= LaunchpadProMK3.totalDecks; deck += 1) {
      let deckColour = LaunchpadProMK3.decks[deck].deckColour;
      let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
      DEBUG("deck " + C.O + deck + C.RE + "   deckColour " + C.O + "#" + deckColour + C.RE + "   deckRgb " + C.O + deckRgb, C.G);

      gradStartA = [70, 70, 70];
      gradEndA = [10, 10, 30];
      //gradStartB = [20, 20, 20];
      //gradStartB = [120, 120, 120];
      gradStartB = [70, 70, 70];
      gradEndB = deckRgb;
      LaunchpadProMK3.gradientSetup(deck, undefined, gradStartA, gradEndA, gradStartB, gradEndB);
      DEBUG("updateLoopPage: end deck gradient creation", C.R);
    };

    DEBUG("### end updateLoopPage", C.R, 1, 2);
  };
};



/// Fifth page (4)


LaunchpadProMK3.updateReverseLoopPage = function () {
  if (LaunchpadProMK3.currentPage === 4) {
    DEBUG("  ")
    DEBUG("                              .o8                .                                                                   .o   ", C.M);
    DEBUG("                             '888              .o8                                                                 .d88   ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.     oo.ooooo.   .oooo.    .oooooooo  .ooooo.       .d'888   ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b     888' `88b `P  )88b  888' `88b  d88' `88b    .d'  888   ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888     888   888  .oP'888  888   888  888ooo888     88ooo888oo ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o     888   888 d8(  888  `88bod8P'  888    .o         888   ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'     888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'        o888o  ", C.M);
    DEBUG("              888                                                  888                 d'     YD                         ", C.M);
    DEBUG("             o888o                                                o888o                 'Y88888P'                         ", C.M);
    DEBUG("  ");
    DEBUG("### updateReverseLoopPage", C.G, 0, 1);

    LaunchpadProMK3.clearMain();
    for (let deck = 1; deck <= 4; deck += 1) {
      let deckColour = LaunchpadProMK3.decks[deck].deckColour;
      let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
      DEBUG("deck " + C.O + deck + C.RE + "   deckColour " + C.O + "#" + deckColour + C.RE + "   deckRgb " + C.O + deckRgb, C.G);
      gradStartA = [30, 10, 10];
      gradEndA = [127, 127, 127];
      gradStartB = [70, 70, 70];
      gradEndB = deckRgb;
      LaunchpadProMK3.gradientSetup(deck, undefined, gradStartA, gradEndA, gradStartB, gradEndB);
    };
    DEBUG("### end updateReverseLoopPage", C.R, 1, 2);
  };
};




// Sixth page (5)

LaunchpadProMK3.updateLoopExtrasPage = function () {
  if (LaunchpadProMK3.currentPage === 5) {
    DEBUG("  ");
    DEBUG("                              .o8                .                                                               oooooooo ", C.M);
    DEBUG("                             '888              .o8                                                              dP''''''' ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.     oo.ooooo.   .oooo.    .oooooooo  .ooooo.     d88888b.   ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b     888' `88b `P  )88b  888' `88b  d88' `88b       `Y88b   ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888     888   888  .oP'888  888   888  888ooo888          ]88  ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o     888   888 d8(  888  `88bod8P'  888    .o    o.   .88P  ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'     888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'    `8bd88P'   ", C.M);
    DEBUG("              888                                                  888                 d'     YD                            ", C.M);
    DEBUG("             o888o                                                o888o                 'Y88888P'                           ", C.M);
    DEBUG("  ")
    DEBUG("### updateLoopExtrasPage", C.G, 0, 1);

    LaunchpadProMK3.clearMain();

    DEBUG("### end updateLoopExtrasPage", C.R, 1, 2);
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



// seventh page (6)
// page that shows controls for only one deck


LaunchpadProMK3.updateOneDeckPage = function () {
  if (LaunchpadProMK3.currentPage === 6) {
    DEBUG("                              .o8                .                                                                .ooo   ", C.M);
    DEBUG("                             '888              .o8                                                              .88'     ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.     oo.ooooo.   .oooo.    .oooooooo  .ooooo.     d88'      ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b     888' `88b `P  )88b  888' `88b  d88' `88b   .d'  888   ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888     888   888  .oP'888  888   888  888ooo888    88ooo888oo ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o     888   888 d8(  888  `88bod8P'  888    .o   `Y88   88P ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'     888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'    `88bod8'  ", C.M);
    DEBUG("              888                                                  888                 d'     YD                         ", C.M);
    DEBUG("             o888o                                                o888o                 'Y88888P'                        ", C.M);
    DEBUG("  ");
    DEBUG("### updateOneDeckPage", C.G, 0, 1);
    //if (address > 11 && address < 28) { padPoss = 4 }
    //if (address > 31 && address < 48) { padPoss = 3 }
    //if (address > 51 && address < 68) { padPoss = 2 }
    //if (address > 71 && address < 88) { padPoss = 1 }

    oneDeckCurrent = LaunchpadProMK3.selectedDeck;
    //LaunchpadProMK3.changeMainToDeck()
    LaunchpadProMK3.clearMain();

    let deckColour = LaunchpadProMK3.decks[oneDeckCurrent].deckColour;
    let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);

    DEBUG("updateOneDeckPage: deck " + C.O + oneDeckCurrent + C.RE + "   deckColour " + C.O + "#" + deckColour + C.RE + "   deckRgb " + C.O + deckRgb, C.G);
    DEBUG("updateOneDeckPage: top; rloop gradient;");
    gradStartA = [20, 0, 0];
    gradEndA = [127, 127, 127];
    gradStartB = [20, 20, 20];
    gradEndB = deckRgb;
    LaunchpadProMK3.gradientSetup(oneDeckCurrent, 3, gradStartA, gradEndA, gradStartB, gradEndB);
    LaunchpadProMK3.updateHotcueLights(oneDeckCurrent);

    DEBUG("updateOneDeckPage: middle; loop gradient;");
    DEBUG("updateOneDeckPage: deck " + C.O + oneDeckCurrent + C.RE + "   deckColour " + C.O + "#" + deckColour + C.RE + "   deckRgb " + C.O + deckRgb, C.G);
    gradStartA = [127, 127, 127];
    gradEndA = [0, 0, 20];
    gradStartB = deckRgb;
    gradEndB = [20, 20, 20];
    LaunchpadProMK3.gradientSetup(oneDeckCurrent, 1, gradStartA, gradEndA, gradStartB, gradEndB);
    LaunchpadProMK3.updateHotcueLights(oneDeckCurrent);

    DEBUG("updateOneDeckPage: bottom; beatjump gradient;");
    DEBUG("updateOneDeckPage: deck " + C.O + oneDeckCurrent + C.RE + "   deckColour " + C.O + "#" + deckColour + C.RE + "   deckRgb " + C.O + deckRgb, C.G);
    gradStartA = [20, 20, 20];
    gradEndA = [112, 112, 112];
    gradStartB = deckRgb;
    gradEndB = [127, 127, 127];
    LaunchpadProMK3.gradientSetup(oneDeckCurrent, 2, gradStartA, gradEndA, gradStartB, gradEndB);
    LaunchpadProMK3.updateHotcueLights(oneDeckCurrent);
  }// end page check
}