//// Launchpad Pro MK3 MIDI mapping for Mixxx
//// created by Milkii B

// wip

//done
// 4*16 or 2*32 hotcue pads, matched to deck colour
// total 80 with 4 sets of intro start, end, outro start, end
// beatjump page with a range of jump lengths for all decks
// bpm scale page with visual aid to fix misanalysed tempo
//

//todo
// make it all work
// make it more robust
// background for bpm scale
// better deck colour dir
// represent track colours
// make the bpm flash in a new place
// fix colour brightness scaling
// make the core logic sane
// restructure and refactor
// more checks
// aesthetics and consistency
// party


//// DEBUG stuff
// Terminal colour codes for DEBUG messages
const COLOURS = {
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  ORANGE: "\x1b[33m",
  BLUE: "\x1b[34m",
  YELLOW: "\x1b[35m",
  MAGENTA : "\x1b[35m",
  CYAN : "\x1b[36m",
  RESET: "\x1b[0m"
};

// Shorthand for the above
const C = {
  R: COLOURS.RED,
  G: COLOURS.GREEN,
  O: COLOURS.ORANGE,
  B: COLOURS.BLUE,
  Y: COLOURS.YELLOW,
  M: COLOURS.MAGENTA,
  C: COLOURS.CYAN,
  RE: COLOURS.RESET
};

const DEBUG = function(message, colour, linesbefore, linesafter) {
  if (LaunchpadProMK3.DEBUGstate) {
    if (colour === undefined) { colour = ""; }
    if (typeof linesbefore === "number" && linesbefore > 0 && linesbefore < 50) { for (i = 0; i < linesbefore; i+= 1) { console.log(" "); } }
    console.log(`${COLOURS.RED}DEBUG ${COLOURS.RESET}${colour}${message}${COLOURS.RESET}`);
    if (typeof linesafter === "number" && linesafter > 0 && linesafter < 50) { for (i = 0; i < linesafter; i+= 1) { console.log(" "); } }
    //LaunchpadProMK3.sleep(1000)
  }
};


/// Main object to represent the controller
var LaunchpadProMK3 = {};


LaunchpadProMK3.DEBUGstate = 1;


//// Initialise variables

/// MIDI addresses of the main 8x8 grid
LaunchpadProMK3.mainpadAddresses = [
  81, 82, 83, 84, 85, 86, 87, 88,
  71, 72, 73, 74, 75, 76, 77, 78,
  61, 62, 63, 64, 65, 66, 67, 68,
  51, 52, 53, 54, 55, 56, 57, 58,
  41, 42, 43, 44, 45, 46, 47, 48,
  31, 32, 33, 34, 35, 36, 37, 38,
  21, 22, 23, 24, 25, 26, 27, 28,
  11, 12, 13, 14, 15, 16, 17, 18 ];

// MIDI addresses of the left/right side pads
LaunchpadProMK3.sidepadAddresses = [
  80, 70, 89, 79,
  60, 50, 69, 59,
  40, 30, 49, 39,
  20, 10, 29, 19 ];


LaunchpadProMK3.rowAbove =  [ 0x5B, 0x5C, 0x5D, 0x5E, 0x5F, 0x60, 0x61, 0x62 ];

LaunchpadProMK3.row1Below = [ 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x6B, 0x6C ];
LaunchpadProMK3.row2Below = [ 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08 ];


LaunchpadProMK3.bpmScaleDeckLed = [
  "80", "70", "60", "50", "40", "30", "20", "10"
];


// Templates for assigning side pad controls
LaunchpadProMK3.sidepadNames = [
  "intro_start_",
  "intro_end_",
  "outro_start_",
  "outro_end_" ];


/// from top to bottom
LaunchpadProMK3.mainpadLayout = "3124";
//LaunchpadProMK3.mainpadLayout = "12";
// alternative layouts
//LaunchpadProMK3.mainpadLayout = "1234";
//LaunchpadProMK3.mainpadLayout = "4321";
//LaunchpadProMK3.mainpadLayout = "4213";

const totalDecks = LaunchpadProMK3.mainpadLayout.length
const totalDeckHotcues = 64/totalDecks

// Preset colours for decks
//LaunchpadProMK3.deckColours = [ 0x010103, 0x040201, 0x030103, 0x010301 ];
LaunchpadProMK3.deckColours = [ 0x378df7, 0xfeb108, 0xd700d7, 0x88b31a ];

// Pad addresses and deck colours
LaunchpadProMK3.switchDecksButtons = [
  [ 0x65, 0x7F, 0x00, 0x7F ],
  [ 0x66, 0x1D, 0x46, 0x7B ],
  [ 0x67, 0x7F, 0x58, 0x04 ],
  [ 0x68, 0x44, 0x60, 0x0D ] ];


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


//// Startup function, sets up decks, etc

LaunchpadProMK3.init = function() {
  DEBUG("######", C.M);
  DEBUG("######", C.R);
  DEBUG("###### init controller script n object", C.O);
  DEBUG("######", C.G);
  DEBUG("######", C.C, 0, 2);

  // Set LPP3 from DAW mode to programmer mode
  LaunchpadProMK3.setProgrammerMode();

  // Clear already lit pads
  //LaunchpadProMK3.clearAll();


  //Construct deck objects based on the Components Deck
  if (LaunchpadProMK3.mainpadLayout.length === 4) {
    DEBUG("4 decks")
    LaunchpadProMK3.decks = {
      "1": new LaunchpadProMK3.Deck(1),
      "2": new LaunchpadProMK3.Deck(2),
      "3": new LaunchpadProMK3.Deck(3),
      "4": new LaunchpadProMK3.Deck(4),
    }
  }
  if (LaunchpadProMK3.mainpadLayout.length === 2) {
    DEBUG("2 decks")
    LaunchpadProMK3.decks = {
      "1": new LaunchpadProMK3.Deck(1),
      "2": new LaunchpadProMK3.Deck(2),
    }
    DEBUG("decks madeeeee", C.R, 1, 2)
  };


  // MIDI handlers for deck selection, actions, and page selection
  DEBUG("LaunchpadProMK3.initExtras()", C.R,1)
  LaunchpadProMK3.initExtras();

  // Select the initial desk
  DEBUG("LaunchpadProMK3.selectDeck(X)", C.R, 2)
  LaunchpadProMK3.selectDeck(1);

  // Initialise zeroth page (hotcues)
  DEBUG("LaunchpadProMK3.selectPage(0)", C.R, 2)
  LaunchpadProMK3.selectPage(0);

  DEBUG("######", C.R);
  DEBUG("######", C.O);
  DEBUG("init finished",C.G);
  DEBUG("######", C.O);
  DEBUG("######", C.R, 0, 24);

  LaunchpadProMK3.lightUpRow2(LaunchpadProMK3.currentPage);
};

// Set Launchpad Pro MK3 to Programmer Mode
LaunchpadProMK3.setProgrammerMode = function() {
  DEBUG("# sending programmer mode sysex..", C.O);
  LaunchpadProMK3.sendSysEx([0x0E, 0x01]);
};


// Helper to construct and send SysEx message
LaunchpadProMK3.sendSysEx = function(data) {
  signal = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x0E].concat(data, [0xF7]);
  DEBUG(signal)
  midi.sendSysexMsg(signal, signal.length);
};



//// Initialise buttons

//abandoned experiment
//LaunchpadProMK3.initMidiHigher = function(cc, r, g, b, func, args) {
//  DEBUG(`initMidiHigher    cc: ${cc}   deck:   {deck}    func: ${func}   r: ${r}   g: ${g}   b: ${b}`)
//  midi.makeInputHandler(0xB0, cc, (channel, control, value, status, group) => {
//    if (value != 0) { func }
//    LaunchpadProMK3.sendRGB(cc, r, g, b); // bright
//  })
//};


//// misc key bindings
LaunchpadProMK3.initExtras = function() {

  // Deck selection buttons
  //if (totalDecks === 4) {
    // deck 3
    midi.makeInputHandler(0xB0, LaunchpadProMK3.row1Below[0], (channel, control, value, status, group) => {
      if (value != 0) { LaunchpadProMK3.selectDeck(3); }
    });
    LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1Below[0], 0x1D, 0x46, 0x7B); // brightP
  //}

  // deck 1
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1Below[1], (channel, control, value, status, group) => {
    if (value != 0) { LaunchpadProMK3.selectDeck(1); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1Below[1], 0x1D, 0x46, 0x7B); // bright

  // deck 2
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1Below[2], (channel, control, value, status, group) => {
    if (value != 0) { LaunchpadProMK3.selectDeck(2); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1Below[2], 0x7F, 0x58, 0x04); // bright

  //if (totalDecks = 4) {  // deck 4
    midi.makeInputHandler(0xB0, LaunchpadProMK3.row1Below[3], (channel, control, value, status, group) => {
      if (value != 0) { LaunchpadProMK3.selectDeck(4); }
    });
    LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1Below[3], 0x44, 0x60, 0x0D); // bright
  //}



  // page 1
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2Below[0], (channel, control, value, status, group) => {
    if (value != 0) { LaunchpadProMK3.selectPage(0); }
  });
  // page 2
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2Below[1], (channel, control, value, status, group) => {
    if (value != 0) { LaunchpadProMK3.selectPage(1); }
  });
  // page 3
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2Below[2], (channel, control, value, status, group) => {
    if (value != 0) { LaunchpadProMK3.selectPage(2); }
  });
  // page 4
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2Below[3], (channel, control, value, status, group) => {
    if (value != 0) { LaunchpadProMK3.selectPage(3); }
  });
  // page 5
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2Below[4], (channel, control, value, status, group) => {
    if (value != 0) { LaunchpadProMK3.selectPage(4); }
  });

  // shift
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2Below[7], (channel, control, value, status) => {
    if (value !== 0) {
      LaunchpadProMK3.shift = 1;
      LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2Below[7], 0x2F, 0x7F, 0x7F);
      DEBUG("# shift on", C.G);
    } else if (value == 0) {
      LaunchpadProMK3.shift = 0;
      LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2Below[7], 0x0B, 0x0B, 0x0F)  ;
      DEBUG("# shift off", C.G);
    }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2Below[7], 0x0B, 0x0B, 0x0F);



  // undo last hotcue
  midi.makeInputHandler(0xB0, LaunchpadProMK3.rowAbove[1] , (channel, control, value, status) => {
    if (value != 0) {
      LaunchpadProMK3.undoLastHotcue();
    }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.rowAbove[1], 0x7F, 0x30, 0x7F);

  // redo last hotcue
  midi.makeInputHandler(0xB0, LaunchpadProMK3.rowAbove[2], (channel, control, value, status) => {
    if (value != 0) {
      LaunchpadProMK3.redoLastHotcue();
    }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.rowAbove[2], 0x2F, 0x20, 0x7F);


  // multi hotcue creation function
  midi.makeInputHandler(0xB0, LaunchpadProMK3.rowAbove[4], (channel, control, value, status, group) => {
    if (value != 0) { LaunchpadProMK3.create4LeadupDropHotcues(LaunchpadProMK3.selectedDeck, value); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.rowAbove[4], 0x7F, 0x7F, 0x7F);



  LaunchpadProMK3.mainpadAddresses.forEach(address => {
    DEBUG("start updateLoopPage pads handler ")
    DEBUG(address)
    DEBUG(LaunchpadProMK3.currentPage)
    midi.makeInputHandler(0xB0, address, (channel, control, value, status, group) => {
      DEBUG(LaunchpadProMK3.currentPage)
      if (LaunchpadProMK3.currentPage === 4 && value != 0) {
          if (address > 11 && address < 28) { padPoss = 4 }
          if (address > 31 && address < 48) { padPoss = 3 }
          if (address > 51 && address < 68) { padPoss = 2 }
          if (address > 71 && address < 88) { padPoss = 1 }
          deck = LaunchpadProMK3.mainpadLayout[padPoss-1];
          channel = "[Channel" + deck + "]";
          // beatloop on top row, beatlooproll on bottom row
          const firstDigit = parseInt(address / 10);
          const lastDigit = address % 10;
          if (firstDigit % 2 === 0) {
            fun = "beatloop"; // even
          } else {
            fun = "beatlooproll"; // odd
          }
          control = fun + LaunchpadProMK3.loopControls[lastDigit];
          DEBUG("loops   channel " + channel + "   address " + address + "   control " + control);
          script.toggleControl(channel, control, 50);
        };
    });
  });
};


// hotcue color switch prev
midi.makeInputHandler(0xB0, LaunchpadProMK3.rowAbove[6], (control, value, status, group) => {
  var channel = LaunchpadProMK3.lastHotcueChannel;
  if (typeof LaunchpadProMK3.lastHotcueChannel === "undefined") { return; }
  script.toggleControl(channel,"hotcue_focus_color_prev");
});
//LaunchpadProMK3.sendRGB(LaunchpadProMK3.rowAbove[6], 0x20, 0x20, 0x7F);

// hotcue color switch next
midi.makeInputHandler(0xB0, LaunchpadProMK3.rowAbove[7], (control, value, status, group) => {
  var channel = LaunchpadProMK3.lastHotcueChannel;
  if (typeof LaunchpadProMK3.lastHotcueChannel === "undefined") { return; }
  script.toggleControl(channel,"hotcue_focus_color_next");
});
//LaunchpadProMK3.sendRGB(LaunchpadProMK3.rowAbove[7], 0x7F, 0x20, 0x20);


// switch page WIP, bottom righ
//midi.makeInputHandler(0xB0, LaunchpadProMK3.row1Below[7], (channel, control, value, status) => {
//  if (value != 0) {
//    LaunchpadProMK3.selectPage();
//  }
//});
//LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1Below[7], 0x7F, 0x7F, 0x7F);



//// Deck constructor
LaunchpadProMK3.Deck = function (deckNumber) {

  DEBUG("##### constructing deck: " + deckNumber, C.G, 2);
  components.Deck.call(this, deckNumber);

  this.deckOrderIndex = LaunchpadProMK3.mainpadLayout.indexOf(deckNumber);
  DEBUG("this.deckOrderIndex " + this.deckOrderIndex)
  this.deckMainSliceStartIndex = this.deckOrderIndex * totalDeckHotcues;
  DEBUG("this.deckMainSliceStartIndex " + this.deckMainSliceStartIndex)
  this.deckPadAddresses = LaunchpadProMK3.mainpadAddresses.slice(this.deckMainSliceStartIndex, this.deckMainSliceStartIndex + totalDeckHotcues);
  DEBUG("this.deckMainSliceStartIndex " + this.deckpadaddresses)
  this.deckSideSliceStartIndex = this.deckOrderIndex * 4;
  DEBUG("this.deckSideSliceStartIndex " + this.deckSideSliceStartIndex)
  this.deckSidepadAddresses = LaunchpadProMK3.sidepadAddresses.slice(this.deckSideSliceStartIndex,this.deckSideSliceStartIndex + 4);
  DEBUG("this.deckSidepadAddresses " + this.deckSidepadAddresses)
  this.deckColour = LaunchpadProMK3.deckColours[deckNumber-1];

  DEBUG("### " + C.RE + " deck objects instantiation:     deckNumber " + C.O + deckNumber + C.RE + ",   group " + C.O + this.currentDeck + C.RE + ",   colour " + C.O + "#" + this.deckColour.toString(16).padStart(6, "0").toUpperCase(), C.O, 1);
  DEBUG("# deckPadAddresses" + C.RE + " for this deck: " + C.O + this.deckPadAddresses, C.O);

  engine.makeConnection(`[Channel${deckNumber}]`, "track_loaded", LaunchpadProMK3.onTrackLoadedOrUnloaded);

  DEBUG("# hotcue buttons init", C.G, 1);



  //// Deck Main Hotcues
  this.hotcueButtons = [];
  i
  for (i = 1; i <= totalDeckHotcues; i+=1) {
    color_object = "";
    this.i = i;
    let padAddress = this.deckPadAddresses[i-1];
    let hotcueNum = i;

    deckLoaded = engine.getValue(`${this.currentDeck}`, "track_loaded");
    DEBUG("deckLoaded " + deckLoaded);
    DEBUG("i " + C.O + i + C.RE + ",   padAddress " + C.O + padAddress + C.RE + "/" +C.O+ "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase());
    DEBUG(this.deckColour + " / " + LaunchpadProMK3.hexToRGB(this.deckColour));
    if (deckLoaded !== 1) { this.deckColourBg = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(this.deckColour),0.03); }
    if (deckLoaded === 1) { this.deckColourBg = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(this.deckColour),0.22); }
    DEBUG(this.deckColourBg);
    LaunchpadProMK3.sendRGB(padAddress, this.deckColourBg[0], this.deckColourBg[1], this.deckColourBg[2]);

    // Create hotcue button, using ComponentsJS objects/methods
    this.hotcueButtons[i-1] = new components.HotcueButton({
      // Not using midi: because sysex is where it's at with this controller
      //midi: [0x90, padAddress],
      number: this.i, // This is the hotcue number
      padAddress: padAddress,

      input: midi.makeInputHandler(0x90, padAddress, (channel, control, value, status) => {
        /// When the pad is being pressed
        if (value != 0) { DEBUG("(main pad press: " + C.RE + "loaded? " + C.O + engine.getValue(`${this.currentDeck}`,"track_loaded") + C.RE + "   value: " + C.O + value + C.RE + "   page: " + C.O + LaunchpadProMK3.currentPage + C.RE + ")", C.RE, 1); }
        // Check the deck is loaded with a track, that the page is right, that it's a button press not release
        //if (engine.getValue(`${this.currentDeck}`,"track_loaded") !== 1 || value === 0) { return; }

        //0
        if (LaunchpadProMK3.currentPage === 0) {
          if (LaunchpadProMK3.shift === 0) {

            /// If shift not pressed: Hotcue Creation
            DEBUG("no shift..", C.O);
            DEBUG("input: deckNumber " + C.O + deckNumber + C.RE + "/" + C.O + this.currentDeck + C.RE + ",  i " + C.O + i + C.RE + ",  padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   hotcueNum " + C.O + hotcueNum, C.G);
            // Helper function to trigger hotcue activation control value on then
            // off the hotcue on press which either creates or jumps to the hotcue
            script.triggerControl(this.currentDeck, "hotcue_" + hotcueNum + "_activate", 50);
            // Set new last hotcue channel
            LaunchpadProMK3.lastHotcueChannel = this.currentDeck;
            // Add new entry to undo list
            LaunchpadProMK3.lastHotcue.unshift( [ this.currentDeck, "hotcue_" + hotcueNum, padAddress, deckNumber ] );
            DEBUG("LaunchpadProMK3.lastHotcue:  " + C.O + LaunchpadProMK3.lastHotcue);

          } else {
            /// If shift is pressed: Hotcue Deletion
            DEBUG("shift, hotcue clear " + C.RE + hotcueNum + C.G + " on " + C.RE + this.currentDeck,C.G);
            // Helper function to toggle hotcue clear control on then off
            script.triggerControl(this.currentDeck, "hotcue_" + hotcueNum + "_clear", 50);
            // Has to be full page refresh because a track could be on two decks
            LaunchpadProMK3.updateHotcuePage();

            //let deckColour = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(this.deckColour),0.05)
            //LaunchpadProMK3.darkenRGBColour(this.deckColour,0.05)// Get the deck color
            //DEBUG("padAddress " + padAddress + "   deckColour " + deckColour + "   " + typeof deckColour)
            //LaunchpadProMK3.sendHEX(padAddress, deckColour); // Reset the pad to the deck color
            //LaunchpadProMK3.sendHEX(61, [3, 7, 12]); // Reset the pad to the deck color
            //DEBUG(`Hotcue ${hotcueNum} on deck ${this.currentDeck}  reset to deck color.`,C.O,1);

          };
          DEBUG("end of page 0 input action")
        };

        //1
        if (LaunchpadProMK3.currentPage === 1) {
          if (value !== 0) {
            let beatjumpControlSel = LaunchpadProMK3.beatjumpControls[hotcueNum-1]
            script.triggerControl(this.currentDeck, beatjumpControlSel, 50);
            DEBUG("BEATJUMP " + C.O + beatjumpControlSel + C.RE + " on deck " + this.currentDeck,C.G, 1)
          }
        };

        //2
        if (LaunchpadProMK3.currentPage === 2) {
          if (value !== 0) {
            if (engine.getValue(this.currentDeck, "track_loaded") === 1) {
              let bpmControlSel = LaunchpadProMK3.bpmScaleLayout[padAddress % 10][0]
              if (parseInt(padAddress/10) % 2 !== 0) bpmControlSel = "stars_down";
              script.triggerControl(this.currentDeck, bpmControlSel, 50);
              DEBUG("bpmCALE " + C.O + bpmControlSel + C.RE + " on deck " + this.currentDeck,C.G, 1)
            }
          }
        };

        //3
        if (LaunchpadProMK3.currentPage === 3) {
          if (value !== 0) {
            if (padAddress > 11 && padAddress < 28) { padPoss = 4 }
            if (padAddress > 31 && padAddress < 48) { padPoss = 3 }
            if (padAddress > 51 && padAddress < 68) { padPoss = 2 }
            if (padAddress > 71 && padAddress < 88) { padPoss = 1 }
            deck = LaunchpadProMK3.mainpadLayout[padPoss-1];
            channel = "[Channel" + deck + "]";
            const firstDigit = parseInt(padAddress / 10);
            const lastDigit = padAddress % 10;
            if (firstDigit % 2 === 0) {
              fun = "beatloop" // even
            } else {
              fun = "beatlooproll" // odd
            }
            control = fun + LaunchpadProMK3.loopControls[lastDigit];
            DEBUG("loops   channel " + channel + "   padAddress " + padAddress + "   control " + control);

            script.toggleControl(channel, control, 50);
          };
        };
      }),

      // how to change the lights of pads managed this way
      sendRGB: function (color_obj) {
        //DEBUG("currentPage: " + LaunchpadProMK3.currentPage)
        //DEBUG(color_obj.toString())
        let deckLoaded = engine.getValue(`[Channel${deckNumber}]`, "track_loaded");
        //DEBUG(deckColour)
        //let rgb = LaunchpadProMK3.hexToRGB(deckColour);
        //DEBUG(rgb)
        if (deckLoaded !== 1) { rgb = LaunchpadProMK3.darkenRGBColour(rgb, 0.12) }
        if (LaunchpadProMK3.currentPage === 0) {
          LaunchpadProMK3.sendRGB(this.padAddress, color_obj.red>>1,color_obj.green>>1,color_obj.blue>>1);
          DEBUG("sendRGB: deckNumber " + C.O + deckNumber + C.RE + "/" + C.O + this.currentDeck + C.RE + ",  i " + C.O + i + C.RE + ",  padAddress " + C.O + padAddress + C.RE + " / " + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   hotcueNum " + C.O + hotcueNum);
        }
      },
    });

    //shutdown: undefined

    // bind action to a change of hotcue status
    engine.makeConnection(`[Channel${deckNumber}]`, `hotcue_${hotcueNum}_status`, (value) => {
      let deckColour = this.deckColour // Get the deck color
      DEBUG("hotcue status ; deckColour " + deckColour);
      let deckColourBg = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(deckColour),0.1);
      DEBUG("hotcue status ; deckColourBg " + deckColourBg);
      if (LaunchpadProMK3.currentPage === 0) {
        LaunchpadProMK3.turnOffPad(padAddress, deckColourBg);
      }
    });
    // bind an action to a hotcue being cleared
    engine.makeConnection(`[Channel${deckNumber}]`, `hotcue_${hotcueNum}_clear`, (value) => {
      if (value === 0) return
      let deckColour = this.deckColour; // Get the deck color
      let deckColourBg = LaunchpadProMK3.darkenRGBColour(deckColour,0.1);
      DEBUG("Hotcue CLEAR    deckColour " + deckColour + "   deckColourBg " + deckColourBg )
      if (LaunchpadProMK3.currentPage === 0) {
        LaunchpadProMK3.turnOffPad(padAddress, LaunchpadProMK3.hexToRGB(deckColourBg));
      };
    })
  }

  DEBUG("# ending mainpads init", C.R);


  //// deck Sidepad Intro/Outro Hotcues

  //DEBUG("## deck sidepads instantiation:  deckNumber " + deckNumber, C.G, 1);
  DEBUG("# sidepad button init:", C.G, 1);
  this.sideButtons = [];
  for (sidepad = 1; sidepad <= 4; sidepad+= 1) {
    this.i = i;
    let padAddress = this.deckSidepadAddresses[sidepad-1]
    //if (totalDecks === 2) { padAddress = padAddress-20 };
    let sidepadControlName = LaunchpadProMK3.sidepadNames[sidepad-1];
    rgb = LaunchpadProMK3.hexToRGB(0x00FFFF);
    DEBUG("deck " + C.O + deckNumber + C.RE + ",   sidepad " + C.O + sidepad + C.RE + ",   padAddress " + C.O + padAddress + C.RE + " / " + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + ",   sidepadControlName: " + C.O + sidepadControlName );
    this.sideButtons[sidepad-1] = new components.Button({
      midi: [0xB0, padAddress],
      padAddress: this.padAddress, // Get ready
      // sendRGB: LaunchpadProMK3.sendRGB(this.sidepadAddress, 0x00, 0x00, 0xFF),

      input: midi.makeInputHandler(0xB0, padAddress, (channel, control, value, status) => {
        if (LaunchpadProMK3.currentPage === 0) {
          if (LaunchpadProMK3.shift === 0) {
            DEBUG("side press: deck " + C.O + deckNumber +C.RE+"   padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + ",   sidepadControlName: " +C.O+ sidepadControlName + "activate", C.G, 1);
            script.triggerControl(`[Channel${deckNumber}]`, `${sidepadControlName}activate`, 50);
            LaunchpadProMK3.lastHotcue.unshift( [ deckNumber, sidepadControlName, padAddress, deckNumber ] );
          } else {
            script.triggerControl(`[Channel${deckNumber}]`, `${sidepadControlName}clear`, 50);
          };
        };
      }),

    });
    engine.makeConnection(`[Channel${deckNumber}]`, `${sidepadControlName}enabled`, (value) => {
      if (LaunchpadProMK3.currentPage === 0) {
        LaunchpadProMK3.trackWithInOut(value, deckNumber, padAddress);
      };
    });
  };
  DEBUG("# ending sidepads init", C.R);


  DEBUG("# reconnect to group:", C.G, 1);
  // Set the group properties of the above Components and connect their output callback functions
  this.reconnectComponents(function (c) {
    if (c.group === undefined) {
      // 'this' inside a function passed to reconnectComponents refers to the ComponentContainer
      // so 'this' refers to the custom Deck object being constructed
      c.group = this.currentDeck;
    }
    DEBUG("reconnectComponents" + C.RE + " to current group if group undefined, group: " + C.O + c.group + C.RE + ",  this.currentDeck " + C.O + this.currentDeck, C.O,0,1);
  });
};

LaunchpadProMK3.Deck.prototype = new components.Deck();

//// End of Deck object setup



//// Page functions

// Handle switching pages, cycling or directly

LaunchpadProMK3.selectPage = function(page) {
  // find target page if none provided
  if (page === undefined) {
    page = (+LaunchpadProMK3.currentPage+1) % 5;
    DEBUG("## page undefined, selectPage setting page to " + C.O + page+1, C.O, 2);
  }

  DEBUG("#### " + C.RE + "switching page from " + C.O + (+LaunchpadProMK3.currentPage+1) + C.RE + " to " + C.O + (+page+1), C.G, 2);
  LaunchpadProMK3.currentPage = page;

  if (page === 0) { LaunchpadProMK3.updateHotcuePage(); }
  else if (page === 1) { LaunchpadProMK3.updateBeatjumpPage(); }
  else if (page === 2) { LaunchpadProMK3.updateBpmScalePage(); }
  else if (page === 3) { LaunchpadProMK3.updateLoopPage(); }
  else if (page === 4) { LaunchpadProMK3.updateReverseLoopPage(); }

  if (page !== 2) { LaunchpadProMK3.stopTimers() }

  LaunchpadProMK3.lightUpRow2();
};



/// First page

// Function to update pad lights for each hotcue
LaunchpadProMK3.updateHotcuePage = function(deck) {
  DEBUG("### set/refresh hotcue page: " + deck, C.G, 1);
  if (deck === undefined) {
    DEBUG("## undefined =  updating all decks..", C.O);
    LaunchpadProMK3.updateHotcueLights(1);
    LaunchpadProMK3.updateHotcueLights(2);
    DEBUG(LaunchpadProMK3.mainpadLayout.length)
    if (totalDecks === 4) {
      LaunchpadProMK3.updateHotcueLights(3);
      LaunchpadProMK3.updateHotcueLights(4);
    }
    DEBUG("end updating decks", C.R, 0, 2);
  } else {
    DEBUG("## updating " + deck, C.G);
    LaunchpadProMK3.updateHotcueLights(deck);
    DEBUG("end updating deck", C.R, 1, 2);
  }
};

// Update pad lights for a specific deck
LaunchpadProMK3.updateHotcueLights = function(deck) {
  let deckColour = LaunchpadProMK3.deckColours[deck-1];

  if (deckColour === undefined) {
    deckColour = 0x444444;
    DEBUG(`Input Colour: ${deckColour}, Type: ${typeof deckColour}`);
  }


  if (LaunchpadProMK3.currentPage === 0) {
    let colourSpecMulti = [];
    DEBUG("## update hotcue lights for " + C.RE + "deck " + C.O + deck + C.RE + "   deckColour " + C.O + "#" + deckColour.toString(16).padStart(6, "0").toUpperCase(), C.G, 1);
    for (i = 1; i <= totalDeckHotcues; i+=1) {
      DEBUG("deck" + deck)
      DEBUG("totalDeckHotcues " + totalDeckHotcues)
      DEBUG("i " + i)
      //DEBUG("  eh " + JSON.stringify(LaunchpadProMK3.decks));
      //DEBUG("  eh " + LaunchpadProMK3.decks[deck]);
      let hotcueEnabled = engine.getValue(`[Channel${deck}]`, `hotcue_${i}_status`);
      let hotcueColour = engine.getValue(`[Channel${deck}]`, `hotcue_${i}_color`);
      //DEBUG("  eh " + LaunchpadProMK3.decks[deck].deckPadAddresses);
      //DEBUG("  et " + LaunchpadProMK3.decks[deck].deckPadAddresses[i])
      let deckLoaded = engine.getValue(`[Channel${deck}]`, "track_loaded")
      padAddress = LaunchpadProMK3.decks[deck].deckPadAddresses[i-1];

      if (hotcueEnabled === 1 && deckLoaded === 1) {
        let rgb = LaunchpadProMK3.hexToRGB(hotcueColour);
        DEBUG(C.RE + "   deck " + C.O + deck + C.RE + "   i " + C.O + i + C.RE + "   padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   deckColour " + C.O + "#" + deckColour.toString(16).padStart(6, "0").toUpperCase() + C.RE + "   hotcueEnabled " + C.O + hotcueEnabled + C.RE + ",   hotcueColour " + C.O + "#" + hotcueColour.toString(16).padStart(6, "0").toUpperCase())
        colourSpecMulti = colourSpecMulti.concat([ 0x03, padAddress, Math.floor(rgb[0]/2), Math.floor(rgb[1]/2), Math.floor(rgb[2]/2) ]);

      } else {
        // if no hotcue, set pad to deck colour
        // if deck unloaded, dim deck colour
        DEBUG(`deckColour: ${deckColour}`)
        let rgb = LaunchpadProMK3.hexToRGB(deckColour);
        DEBUG(" rgb1 " + rgb);
        if (deckLoaded === 1) { rgb = LaunchpadProMK3.darkenRGBColour(rgb,0.12) }
        if (deckLoaded !== 1) { rgb = LaunchpadProMK3.darkenRGBColour(rgb,0.02) }
        DEBUG(" rgb2 " + rgb);
        //let rgb = LaunchpadProMK3.hexToRGB(deckColour);
        //let rgb = LaunchpadProMK3.darkenRGBColour(deckColour,1);
        colourSpecMulti = colourSpecMulti.concat([ 0x03, padAddress, rgb[0], rgb[1], rgb[2] ]);
        DEBUG(" deck " + C.O + deck + C.RE + "   i " + C.O + i + C.RE + "   sidepad " + C.O + sidepad + C.RE + "   padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.R + "   not used, rgb " + rgb);
      }
    }
    DEBUG("# finished creating pad address sysex msg, sending...", C.O);
    LaunchpadProMK3.sendSysEx([0x03].concat(colourSpecMulti));
    DEBUG("end updating main pads", C.R, 0, 1);
  }


  // Sidebar, to blue and off
  DEBUG("## update sidepad lights" + C.RE + " for deck " + C.O + deck, C.G);
  for (i = 1; i <= 4; i += 1) {
    let sidepad = (deck) * 4 + i;
    //let padAddress = LaunchpadProMK3.sidepadAddresses[sidepad];
    let padAddress = LaunchpadProMK3.decks[deck].deckSidepadAddresses[i-1];
    DEBUG(padAddress)
    let sidepadControlName = LaunchpadProMK3.sidepadNames[i-1];
    DEBUG(sidepadControlName)
    let sidepadEnabled = engine.getValue(`[Channel${deck}]`, `${sidepadControlName}enabled`);
    if (sidepadEnabled === 1) {
      DEBUG("     deck " + C.O + deck + C.RE + "   i " + C.O + i + C.RE + "   sidepad " + C.O + sidepad + C.RE + "   padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   control " + C.G + sidepadControlName + "activate");
      LaunchpadProMK3.trackWithInOut(1, deck, padAddress);
    } else {
      LaunchpadProMK3.trackWithInOut(0, deck, padAddress);
    }
  }
  DEBUG("end updating sidepads", C.R, 0, 1);
};



/// Second page

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

LaunchpadProMK3.updateBeatjumpPage = function() {
  if (LaunchpadProMK3.currentPage === 1) {
    for (let deck = 1; deck <= totalDecks; deck+=1 ) {
      let deckColour = LaunchpadProMK3.decks[deck].deckColour;
      DEBUG("deck " + deck + "   deckColour #"+ deckColour, C.G, 1);
      let rgb = LaunchpadProMK3.hexToRGB(deckColour);
      DEBUG("rgb "+ rgb, C.G);
      deckLoaded = engine.getValue(`[Channel${deck}]`, "track_loaded");
      let gradLength = totalDeckHotcues/2
      let gradDark = generateGradient([20,20,20], [112,112,112], gradLength);
      let gradLight = generateGradient(rgb, [127,127,127], gradLength);
      let gradBoth = gradDark.concat(gradLight);
      //let gradBoth = interleave(gradDark, gradLight)
      DEBUG(gradBoth.length + "   gradBoth " + gradBoth);
      let pads = LaunchpadProMK3.decks[deck].deckPadAddresses;
      DEBUG(pads)
      for (let pad of pads) {
        let toSend = gradBoth.shift();
        DEBUG(toSend)
        //if (deckLoaded === 1) { rgb = LaunchpadProMK3.darkenRGBColour(rgb,0.12) }
        if (deckLoaded !== 1) { toSend = LaunchpadProMK3.darkenRGBColour(toSend,0.16) }
        DEBUG(gradBoth.length + "   gradBoth " + gradBoth);
        let r = toSend[0]/2;
        let g = toSend[1]/2;
        let b = toSend[2]/2;
        DEBUG("toSend " + toSend + "    pad " + pad + "   r " + r + "  g "+ g + "   b "+ b, C.O);
        LaunchpadProMK3.sendRGB(pad, r, g, b);
      };
    }
    //LaunchpadProMK3.beatjumpExtrasButtons
  }
};



/// Third page

LaunchpadProMK3.bpmScaleLayout = {
  "1": [ 0.5, "beats_set_halve", 0x111111 ],
  "2": [ 0.666, "beats_set_twothirds", 0x343434],
  "3": [ 0.75, "beats_set_threefourths", 0x6a6a6a ],
  "4": [ 1, "noop", 0x331111 ],
  "5": [ 1, "noop", 0x331111 ],
  "6": [ 1.25, "beats_set_threehalves", 0x6a6a6a ],
  "7": [ 1.333, "beats_set_fourthirds", 0x343434 ],
  "8": [ 1.5, "beats_set_double", 0x111111 ]
}


LaunchpadProMK3.updateBpmScalePage = function() {
  if (LaunchpadProMK3.currentPage === 2) {
    DEBUG("### updateBpmScalePage", C.G, 2, 1);
    LaunchpadProMK3.clearMain();
    let deckOrder = LaunchpadProMK3.mainpadLayout;
    DEBUG(deckOrder, C.G);
    DEBUG(JSON.stringify(LaunchpadProMK3.bpmScaleLayout), C.O, 1, 1)

    // Clear existing timers
    //LaunchpadProMK3.stopTimers();

    let loaded = [];
    bpmScaledFlashBpm = [];
    bpmScaledFlashTimes = [];
    LaunchpadProMK3.timer = [];
    tempoScaleRun = [];

    // for each deck
    for (let d = 1; d <= 4; d+=1) {
      DEBUG("d " + d, C.G);
      loaded[d] = engine.getValue(`[Channel${d}]`, "track_loaded")
      DEBUG("  loaded[d] " + loaded[d], C.O);

      colour = LaunchpadProMK3.deckColours[d-1]
      //DEBUG("  colour " + colour);
      DEBUG("  colour hex " + colour.toString(16));
      colour = LaunchpadProMK3.hexToRGB(colour);
      if (loaded[d] === 0) {
        colour = LaunchpadProMK3.darkenRGBColour(colour,0.1);
      }
      DEBUG("  colour rgb " + colour)

      // if deck is loaded
      if (loaded[d] === 1){
        pads = LaunchpadProMK3.decks[d].deckPadAddresses;
        DEBUG("  bpm " + engine.getValue("[Channel" + d + "]", "bpm"))
        bpm = engine.getValue("[Channel" + d + "]", "bpm")
        DEBUG("  bpm " + bpm)

        if (bpm !== 0) {
          let deck = deckOrder.indexOf(d)

          DEBUG("  bpm " + bpm)
          //d.bpm = bpm.slice
          //DEBUG("  d.bpm " + d.bpm)
          DEBUG("  pads " + pads)
          //bpmScaledFlashBpm[d] = [bpm];
          bpmScaledFlashBpm[d] = [];
          DEBUG("bpmScaledFlashBpm[d] " + bpmScaledFlashBpm[d])
          bpmScaledFlashTimes[d] = [];
          LaunchpadProMK3[d].timer = {}
          // for each pad that deck has
          scaleInc = 0

          Object.entries(LaunchpadProMK3.bpmScaleLayout).forEach(scale => {
            //for (let i = 1; i <= Object.keys(LaunchpadProMK3.bpmScaleLayout).length; i++) {
            //const lastDigit = address % 10;
            DEBUG("scale: " + scale, C.O, 1)
            scaleInc = scale[0]
            DEBUG(scaleInc)
            //scaleIndex =
            DEBUG("  deck " + deck)
            let address = 80 - (deck * 20) + +scale[0]
            DEBUG("  address " + address)
            channel = "[Channel" + d + "]";
            DEBUG("  channel " + channel)
            ratio = scale[1][0]
            DEBUG("  ratio " + ratio);
            control = scale[1][1];
            DEBUG("  control " + control)
            let colour = scale[1][2];
            DEBUG("  colour #" + colour.toString(16))
            value = "127"
            DEBUG("  value " + value)

            bpmScaledFlashBpm[d].push(bpm * ratio);
            DEBUG("  bpmScaledFlashBpm[d] " + bpmScaledFlashBpm[d])
            bpmScaledTime = (60000 / bpmScaledFlashBpm[d][scaleInc-1])
            DEBUG("  bpmScaledTime " + bpmScaledTime)
            bpmScaledFlashTimes[d].push(bpmScaledTime);
            //DEBUG(JSON.stringify(LaunchpadProMK3[d].timer))

            DEBUG("   setting timers:   d " + d + "    scale[0] " + scale[0] + "    address " + address + "   bpmScaledTime " + bpmScaledTime + "    " + bpmScaledTime, C.R);
            //LaunchpadProMK3.timer[d] = engine.beginTimer(bpmScaledFlashTimes[d].values.at(-1), function() {

            DEBUG(LaunchpadProMK3[d].timer[address])
            LaunchpadProMK3[d].timer[address] = engine.beginTimer(bpmScaledTime, function() {
              LaunchpadProMK3.tempoScaleDeckFlash(address, d, control, colour);
              DEBUG( address + " " + d + " " + control + "   " + bpmScaledTime)
            }),

              status = "176"
            group = channel
            //midi.makeInputHandler(0xB0, address, (channel, control, value, status, group) => {
            //  if (value !== 0) {
            //    DEBUG("extras " + address + " " + control);
            //    //script.toggleControl(channel, control, 50);
            //    //DEBUG(JSON.stringify(LaunchpadProMK3.timer[d]))
            //  };
            //});
            DEBUG(LaunchpadProMK3[d].timer)
            DEBUG(colour)
            colour = LaunchpadProMK3.hexToRGB(colour)
            DEBUG(colour)
            LaunchpadProMK3.sendRGB(address, colour[0], colour[1], colour[2]);
          })

        }
        DEBUG("BPMSCALEDFLAAAAASH " + bpmScaledFlashBpm, C.M);
        DEBUG("BPMSCALEDtimes " + bpmScaledFlashTimes, C.M);
      }
      LaunchpadProMK3.sidepadDeckColour(deckOrder, d);
    }
  }
}


//engine.makeConnection("[Channel" + deckIndex + "]", "beat_active", LaunchpadProMK3.tempoScaleDeckFlash )

LaunchpadProMK3.tempoScaleDeckFlash = function(address, d, control, colour) {
  //DEBUG("  inner flash     d " +
  DEBUG(colour)
  if (!tempoScaleRun[address]) {
    LaunchpadProMK3.sendRGB(address, colour[0], colour[1], colour[2]);
    LaunchpadProMK3.sendRGB(address-10, colour[0], colour[1], colour[2]);
  }
  if (tempoScaleRun[address]) {
    LaunchpadProMK3.sendRGB(address, 0, 0, 0);
    LaunchpadProMK3.sendRGB(address-10, 0, 0, 0);
  }
  tempoScaleRun[address] = !tempoScaleRun[address];
  DEBUG(JSON.stringify(tempoScaleRun))
  //DEBUG(LaunchpadProMK3.timer)
}

LaunchpadProMK3.stopTimers = function() {
  DEBUG(totalDecks)
  for (let d = 0; d < totalDecks; d + 1)
    if (LaunchpadProMK3[d]) {
      for (let t in LaunchpadProMK3[d].timer) {
        if (LaunchpadProMK3[d].timer.hasOwnProperty(timer)) {
          DEBUG("STOPPING TIMER", C.R, 1, 1)
          engine.stopTimer(LaunchpadProMK3[d].timer[t]);
        }
      }
    }
  LaunchpadProMK3.timer = {};
}



/// Update fourth page

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
  "_1_activate",
  "_2_activate",
  "_4_activate",
  "_8_activate",
  "_16_activate",
  "_32_activate",
  "_64_activate",
  "_128_activate"
];

LaunchpadProMK3.updateLoopPage = function() {
  //if (LaunchpadProMK3.currentPage === 3) {
  DEBUG("## updateLoopPage", C.G, 2, 1);
  LaunchpadProMK3.clearMain();

  for (let deck = 1; deck <= 4; deck+=1 ) {
    let deckColour = LaunchpadProMK3.decks[deck].deckColour;
    DEBUG("deck " + deck + "   deckColour #"+ deckColour, C.G, 1);
    let rgb = LaunchpadProMK3.hexToRGB(deckColour);
    DEBUG("rgb "+ rgb, C.G);
    deckLoaded = engine.getValue(`[Channel${deck}]`, "track_loaded");

    let gradMono = generateGradient([127,127,127], [0,0,20], 8);
    let gradPoly = generateGradient(rgb, [20,20,40],8);
    let gradBoth = gradMono.concat(gradPoly);
    DEBUG(gradBoth.length + "   gradBoth " + gradBoth);
    let pads = LaunchpadProMK3.decks[deck].deckPadAddresses;
    for (let pad of pads) {
      let toSend = gradBoth.shift();
      //if (deckLoaded === 1) { rgb = LaunchpadProMK3.darkenRGBColour(rgb,0.12) }
      if (deckLoaded !== 1) { toSend = LaunchpadProMK3.darkenRGBColour(toSend,0.16) }
      DEBUG(gradBoth.length + "   gradBoth " + gradBoth);
      let r = toSend[0]/2;
      let g = toSend[1]/2;
      let b = toSend[2]/2;
      DEBUG("toSend " + toSend + "    pad " + pad + "   r " + r + "  g "+ g + "   b "+ b, C.O);
      LaunchpadProMK3.sendRGB(pad, r, g, b);
    };
    DEBUG("end updateLoopPage deck gradient creation")
  };

  DEBUG("## end updateLoopPage", C.G, 1, 2);
};


/// Update fifth page

LaunchpadProMK3.updateReverseLoopPage = function() {
  if (LaunchpadProMK3.currentPage === 4) {
    DEBUG("## updateReverseLoopPage", C.G, 2, 1);
    LaunchpadProMK3.clearMain();
    for (let deck = 1; deck <= 4; deck+=1 ) {
      let deckColour = LaunchpadProMK3.decks[deck].deckColour;
      DEBUG("deck " + deck + "   deckColour #"+ deckColour, C.G, 1);
      let rgb = LaunchpadProMK3.hexToRGB(deckColour);
      DEBUG("rgb "+ rgb, C.G);
      deckLoaded = engine.getValue(`[Channel${deck}]`, "track_loaded");

      let gradMono = generateGradient([20,0,0], [127,127,127], 8);
      let gradPoly = generateGradient([40,20,20], rgb, 8);
      let gradBoth = gradMono.concat(gradPoly);
      DEBUG(gradBoth.length + "   gradBoth " + gradBoth);
      let pads = LaunchpadProMK3.decks[deck].deckPadAddresses;
      for (let pad of pads) {
        let toSend = gradBoth.shift();
        //if (deckLoaded === 1) { rgb = LaunchpadProMK3.darkenRGBColour(rgb,0.12) }
        if (deckLoaded !== 1) { toSend = LaunchpadProMK3.darkenRGBColour(toSend,0.16) }
        DEBUG(gradBoth.length + "   gradBoth " + gradBoth);
        let r = toSend[0]/2;
        let g = toSend[1]/2;
        let b = toSend[2]/2;
        DEBUG("toSend " + toSend + "    pad " + pad + "   r " + r + "  g "+ g + "   b "+ b, C.O);
        LaunchpadProMK3.sendRGB(pad, r, g, b);
      };
    };
  };
}



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
  // If hotcue X has been set as a regular cue point, the player seeks to the saved play position.

  //"hotcue_X_enabled",
  // 0 Hotcue X is not set, 1 Hotcue X is set, 2 Hotcue X is active (saved loop is enabled or hotcue is previewing)

  // Reverse
  //"reverse",

  //"reverseroll",
];



//// Single pad light functions

// Helper function to convert RGB hex value to individual R, G, B values
LaunchpadProMK3.hexToRGB = function(hex) {
  //DEBUG("hexToRGB #" + hex)
  var r = (hex >> 16) & 0xFF;
  var g = (hex >> 8) & 0xFF;
  var b = hex & 0xFF;
  //DEBUG("rgb " + [r, g, b]);
  return [r, g, b];
};

// Send RGB values
LaunchpadProMK3.sendRGB = function(pad, r, g, b) {
  LaunchpadProMK3.sendSysEx([0x03, 0x03, pad, r, g, b]);
};

LaunchpadProMK3.sendHEX = function(pad, hex) {
  var r = (hex >> 16) & 0xFF;
  var g = (hex >> 8) & 0xFF;
  var b = hex & 0xFF;
  //divided by two becaure MIDI is 0-127
  LaunchpadProMK3.sendSysEx([0x03, 0x03, pad, Math.round(r/2), Math.round(g/2), Math.round(b/2)]);
};

LaunchpadProMK3.darkenRGBColour = function(rgb, ratio) {
  // Clamp the ratio between 0 and 1
  ratio = Math.max(0, Math.min(1, ratio));
  rgb[0] = Math.round(rgb[0] * ratio)
  rgb[1] = Math.round(rgb[1] * ratio)
  rgb[2] = Math.round(rgb[2] * ratio)
  return rgb
}


// Turn off pad LEDs
LaunchpadProMK3.turnOffPad = function(pad, rgb) {
  //LaunchpadProMK3.sendRGB(pad, 0, 0, 0)
  if (rgb === undefined) rgb = [ 0, 0, 0 ];
  LaunchpadProMK3.sendRGB(pad, rgb[0], rgb[1], rgb[2]);
};



//// Multiple pad light functions

// Turn a sidepad colour to blue or off
LaunchpadProMK3.trackWithInOut = function(value, deckNumber, padAddress) {
  //DEBUG("## trackWithInOut    value " + value + ", padAddress " + padAddress);
  if (value > 0) {
    LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0xFF);
  } else {
    LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0x00);
  }
};

// Sidepad deck colours
LaunchpadProMK3.sidepadDeckColour = function(deckOrder, d) {
  const sideAddresses = LaunchpadProMK3.sidepadAddresses.slice();
  DEBUG(LaunchpadProMK3.sidepadAddresses, C.O);
  DEBUG(sideAddresses, C.O, 1);
  let currentDeck = deckOrder[d - 1]; // Get the current deck value
  let deckColour = LaunchpadProMK3.deckColours[currentDeck - 1]; // Assuming decks are 1-based indexed
  let nextAddress = sideAddresses.shift(); // Get LED address for this index
  DEBUG(nextAddress);
  LaunchpadProMK3.sendHEX(nextAddress, deckColour); // Set the color for current deck LED
  let next2Address = sideAddresses.shift();
  DEBUG(next2Address, C.R);
  LaunchpadProMK3.sendHEX(next2Address, deckColour); // Set the color for current deck LED
  let next3Address = sideAddresses.shift(); // Get LED address for this index
  DEBUG(next3Address, C.O);
  LaunchpadProMK3.sendHEX(next3Address, deckColour); // Set the color for current deck LED
  let next4Address = sideAddresses.shift();
  DEBUG(next4Address, C.G);
  LaunchpadProMK3.sendHEX(next4Address, deckColour); // Set the color for current deck LED
  DEBUG("extras side colour deck " + d + "   nextAddress " + nextAddress, C.O, 0, 2);
}

// Select deck and change LEDs
LaunchpadProMK3.selectDeck = function(deck) {
  LaunchpadProMK3.selectedDeck = deck;
  DEBUG("### selecting deck " + deck, C.G, 3);
  // Easier identity
  sdb = LaunchpadProMK3.switchDecksButtons;
  // Brightness reduction factor
  let b = 0.2

  // far left
  LaunchpadProMK3.sendRGB(sdb[0][0],Math.round(sdb[0][1]*b),Math.round(sdb[0][2]*b),Math.round(sdb[0][3]*b));
  // near left
  LaunchpadProMK3.sendRGB(sdb[1][0],Math.round(sdb[1][1]*b),Math.round(sdb[1][2]*b),Math.round(sdb[1][3]*b));
  // near right
  LaunchpadProMK3.sendRGB(sdb[2][0],Math.round(sdb[2][1]*b),Math.round(sdb[2][2]*b),Math.round(sdb[2][3]*b));
  // far right
  LaunchpadProMK3.sendRGB(sdb[3][0],Math.round(sdb[3][1]*b),Math.round(sdb[3][2]*b),Math.round(sdb[3][3]*b));

  if (deck === 3) { LaunchpadProMK3.sendRGB(sdb[0][0],sdb[0][1],sdb[0][2],sdb[0][3]); }
  else if (deck === 1) { LaunchpadProMK3.sendRGB(sdb[1][0],sdb[1][1],sdb[1][2],sdb[1][3]); }
  else if (deck === 2) { LaunchpadProMK3.sendRGB(sdb[2][0],sdb[2][1],sdb[2][2],sdb[2][3]); }
  else if (deck === 4) { LaunchpadProMK3.sendRGB(sdb[3][0],sdb[3][1],sdb[3][2],sdb[3][3]); };
};


LaunchpadProMK3.lightUpRow2 = function(page) {
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2Below[0], 40, 30, 40);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2Below[1], 40, 30, 40);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2Below[2], 40, 30, 40);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2Below[3], 40, 30, 40);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2Below[4], 40, 30, 40);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2Below[0] + page, 127, 20, 20);
};


// Track load/unload action
LaunchpadProMK3.onTrackLoadedOrUnloaded = function(value, group) {
  DEBUG((value === 1 ? `###  Track loaded on ${group}` : `###  Track unloaded from ${group}`), C.G, 2);
  deck = group.match(/(\d+)/)[1];
  if (LaunchpadProMK3.currentPage === 0) {
    //LaunchpadProMK3.updateHotcueLights(deck);
    DEBUG("LaunchpadProMK3.updateHotcuePage()")
    LaunchpadProMK3.updateHotcuePage();
    DEBUG("leaving LaunchpadProMK3.updateHotcuePage()")

  } else if (LaunchpadProMK3.currentPage === 1) {
    DEBUG("LaunchpadProMK3.updateBeatjumpPage()")
    LaunchpadProMK3.updateBeatjumpPage();
    wEBUG("leaving LaunchpadProMK3.updateBeatjumpPage()")

  } else if (LaunchpadProMK3.currentPage === 2) {
    DEBUG("LaunchpadProMK3.updateBpmScalePage()")
    LaunchpadProMK3.updateBpmScalePage();
    DEBUG("leaving LaunchpadProMK3.updateBpmScalePage()")
    LaunchpadProMK3.updateBpmScalePage();

  } else if (LaunchpadProMK3.currentPage === 3) {
    DEBUG("LaunchpadProMK3.updateLoopPage()")
    LaunchpadProMK3.updateLoopPage();
    DEBUG("leaving LaunchpadProMK3.updateLoopPage()")

  } else if (LaunchpadProMK3.currentDeck === 4) {
    DEBUG("LaunchpadProMK3.updateReverseLoopPage()")
    LaunchpadProMK3.updateReverseLoopPage();
    DEBUG("leaving LaunchpadProMK3.updateReverseLoopPage()")
  }
  DEBUG("  track load unload action fin....", C.R, 1, 2)
}


// Turn off main LEDs for page change
LaunchpadProMK3.clearMain = function() {
  //// main pads
  DEBUG("//// clearing main and side pads:", C.O);
  //colorSpecMulti = LaunchpadProMK3.mainpadAddresses.map(address => [0x03, address, 0,0,0]).flatmap();
  const colorSpecMulti = _.flatMap(LaunchpadProMK3.mainpadAddresses, (address) => [0x03, address, 0,0,0]);
  LaunchpadProMK3.sendSysEx([0x03].concat(colorSpecMulti));
  //// sidepads
  const colorSpecMultiSide = _.flatMap(LaunchpadProMK3.sidepadAddresses, (address) => [0x03, address, 0,0,0]);
  LaunchpadProMK3.sendSysEx([0x03].concat(colorSpecMultiSide));
  DEBUG("/// end clearing main and side pads", C.R, 1, 2);
};

// Turn off all LEDs for page change or shutdown
LaunchpadProMK3.clearAll = function() {
  DEBUG("////  clearing all pads", C.G, 2);
  ca = [0x03]; cb = [0x03];
  for (i = 0; i <= 0x3F; i+= 1) { ca = ca.concat([0x03, i, 0,0,0]); } LaunchpadProMK3.sendSysEx(ca);
  for (i = 0x40; i <= 0x7F; i+= 1) { cb = cb.concat([0x03, i, 0,0,0]); } LaunchpadProMK3.sendSysEx(cb);
  DEBUG("/// end clearing all pads", C.R);
};

// Shutdown function that should be triggered by Mixxx on close
LaunchpadProMK3.shutdown = function() {
  DEBUG("###  SHUTTINGDOWN  ###", C.O, 2, 3);
  LaunchpadProMK3.stopTimers();
  LaunchpadProMK3.clearAll();
};


function generateGradient(color1, color2, steps) {
  const gradient = [];
  for (let i = 0; i < steps; i++) {
    let ratio = i / (steps - 1);
    let r = Math.round(color1[0] * (1 - ratio) + color2[0] * ratio);
    let g = Math.round(color1[1] * (1 - ratio) + color2[1] * ratio);
    let b = Math.round(color1[2] * (1 - ratio) + color2[2] * ratio);
    DEBUG(`${r},${g},${b}`);
    gradient.push([r,g,b]);
  }
  return gradient;
};

function interleave (arr, arr2) {
  let newArr = [];
  for (let i = 0; i < arr.length; i++) {
    newArr.push(arr[i], arr2[i]);
  }

  return newArr;
};


//// Other hotcue helper functions

LaunchpadProMK3.undoLastHotcue = function() {
  DEBUG("####################### undooooo", C.G, 1);
  // Check that a hotcue has been created
  //if (LaunchpadProMK3.lastHotcue[0] === undefined) { return; }
  // Deserialise the hotcue to undo away
  let popped = LaunchpadProMK3.lastHotcue.shift();
  if (popped === undefined) { DEBUG("no undo stack"); return }
  DEBUG("## popped:  " + popped, C.O, 1);
  DEBUG("## LaunchpadProMK3.lastHotcue:  " + LaunchpadProMK3.lastHotcue, C.O, 1);
  DEBUG("## LaunchpadProMK3.redoLastDeletedHotcue:  " + LaunchpadProMK3.redoLastDeletedHotcue);
  let channel = popped[0];
  // Deserealise array
  let control = popped[1];
  let padAddress = popped[2];
  let deckNumber = popped[3];
  DEBUG("### undoLastHotcue:   cont; " + control + ",   chan; " + channel + ",   deck; " + deckNumber + ",   pad;" + padAddress, C.O);
  // Clear hotcue
  // Common JS func to toggle a control on then off again
  script.triggerControl(channel, control + "_clear", 64);
  // Add undone hotcue to redo list, in case
  LaunchpadProMK3.redoLastDeletedHotcue.unshift(popped);
  DEBUG("## LaunchpadProMK3.redoLastDeletedHotcue:  " + LaunchpadProMK3.redoLastDeletedHotcue);
  // Reset pad colour to deck colour
  LaunchpadProMK3.sendHEX(padAddress, LaunchpadProMK3.deckColours[deckNumber-1]);
  LaunchpadProMK3.updateHotcuePage();
};


LaunchpadProMK3.redoLastHotcue = function() {
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
  let deckNumber = unpopped[3];
  DEBUG("### redoLastHotcue:   cont; " + control + ",   chan; " + channel + ",   deck; " + deckNumber + ",   pad;" + padAddress);
  // Activate the hotcue to undelete it
  script.triggerControl(channel, control + "_activate", 64);
  // Add redone hotcue back to undo stack again
  LaunchpadProMK3.lastHotcue.unshift( [ channel, control, padAddress, deckNumber ] );
  DEBUG("## LaunchpadProMK3.lastHotcue:  " + LaunchpadProMK3.lastHotcue);
  LaunchpadProMK3.updateHotcuePage();
};


//LaunchpadProMK3.hotcue_last_delete = function(channel, control, value, status, group) {
//  if (PioneerCDJ850.last_hotcue < 1 || PioneerCDJ850.last_hotcue > 4)
//    return;
//  key = "hotcue_" + PioneerCDJ850.last_hotcue + "_clear";
//  engine.setValue(group,key,value);
//  LaunchpadProMK3.last_hotcue = 0;
//};


// To add time between steps in multi hotcue function
LaunchpadProMK3.sleep = function(time) {
  let then = Date.now();
  while (true) {
    let now = Date.now();
    if (now - then > time) {
      break;
    };
  };
};



// Create a number of hotcues working back from playhead position
// -128 -64 -32 -16 drop/breakdown
LaunchpadProMK3.create4LeadupDropHotcues = function (deck, value) {
  DEBUG(`# create hotcues:  ${C.Y} -128 -64 -32 -16 ${C.R}drop ${C.RE}on ${C.O}${deck},   value  ${value}`, C.G, 2);
  if (value === 0 || value === undefined) return 0;
  group = `[Channel${deck}]`;
  hotcueCheck = [];
  for (let h = 1; h<=20; h++) {
    hotcueCheck[h] = engine.getValue(group, "hotcue_" + h + "_position" )
  }
  DEBUG(hotcueCheck)
  for (let X = 1; X <= 19; X++) {
    DEBUG(X)
    let hotcueVariable = "hotcue_" + X + "_status";
    if (engine.getValue(group, hotcueVariable) === 0) {
      //X += 4;
      // Create -128, teal, 1
      engine.setValue(group, "beatjump_128_backward", 1);
      LaunchpadProMK3.sleep(50);
      DEBUG(engine.getValue(group,"playposition"))
      DEBUG(hotcueCheck)
      if (hotcueCheck.includes(engine.getValue(group,"playposition")) !== true ) {
        engine.setValue(group,"hotcue_"+X+"_set", 1);
        engine.setValue(group,"hotcue_"+X+"_color", 0x1DBEBD); // teal
        padAddress = LaunchpadProMK3.decks[deck].hotcueButtons[X].padAddress;
        LaunchpadProMK3.lastHotcue.unshift( [ "[Channel" + deck + "]", "hotcue_" + X, padAddress, deck ] );
        DEBUG("LaunchpadProMK3.lastHotcue:  " + C.O + LaunchpadProMK3.lastHotcue);
      }
      // Create -64, green, 2
      engine.setValue(group, "beatjump_64_forward", 1);
      LaunchpadProMK3.sleep(50);
      DEBUG(hotcueCheck)
      DEBUG(engine.getValue(group,"playposition"))
      if (hotcueCheck.includes(engine.getValue(group,"playposition")) !== true ) {
        engine.setValue(group,"hotcue_"+(X+1)+"_set", 1);
        engine.setValue(group,"hotcue_"+(X+1)+"_color", 0x8DC63F); // green
        LaunchpadProMK3.lastHotcue.unshift( [ "[Channel" + deck + "]", "hotcue_" + (X+1), padAddress+1, deck ] );
      }
      // Create -32, yellow, 3
      engine.setValue(group, "beatjump_32_forward", 1);
      LaunchpadProMK3.sleep(50);
      DEBUG(hotcueCheck)
      DEBUG(engine.getValue(group,"playposition"))
      if (hotcueCheck.includes(engine.getValue(group,"playposition")) !== true ) {
        engine.setValue(group,"hotcue_"+(X+2)+"_set", 1);
        engine.setValue(group,"hotcue_"+(X+2)+"_color",  0xf8d200); // yellow
        LaunchpadProMK3.lastHotcue.unshift( [ "[Channel" + deck + "]", "hotcue_" + (X+2), padAddress+2, deck ] );
      }
      // Create -16, orange, 4
      engine.setValue(group,"beatjump_16_forward", 1);
      LaunchpadProMK3.sleep(50);
      DEBUG(hotcueCheck)
      DEBUG(engine.getValue(group,"playposition"))
      if (hotcueCheck.includes(engine.getValue(group,"playposition")) !== true ) {
        engine.setValue(group,"hotcue_"+(X+3)+"_set", 1);
        engine.setValue(group,"hotcue_"+(X+3)+"_color", 0xff8000); // orange
        LaunchpadProMK3.lastHotcue.unshift( [ "[Channel" + deck + "]", "hotcue_" + (X+3), padAddress+3, deck ] );
      }
      // Create main hotcue, red, 5
      engine.setValue(group,"beatjump_16_forward", 1);
      LaunchpadProMK3.sleep(50);
      DEBUG(hotcueCheck)
      DEBUG(engine.getValue(group,"playposition"))
      if (hotcueCheck.includes(engine.getValue(group,"playposition")) !== true ) {
        engine.setValue(group,"hotcue_"+(X+4)+"_set", 1);
        engine.setValue(group,"hotcue_"+(X+4)+"_color", 0xEF1441); // red
        LaunchpadProMK3.lastHotcue.unshift( [ "[Channel" + deck + "]", "hotcue_" + (X+4), padAddress+4, deck ] );
        DEBUG("LaunchpadProMK3.lastHotcue:  " + C.O + LaunchpadProMK3.lastHotcue);
      }
      return;
    };
  };
  DEBUG("# end multi hotcue creation", C.R, 0, 2)
};
