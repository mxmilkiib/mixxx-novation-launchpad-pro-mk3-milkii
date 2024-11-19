var LaunchpadProMK3 = {};

//// Debug stuff
// Generic debug for copying
// if (LaunchpadProMK3.debug) { debug("LOG   channel " + channel + "    control " + control + "    value " + value + "    status " + status + "    group " + group) }

const red = "\x1b[31m";
const green = "\x1b[32m";
const orange = "\x1b[33m";
const reset = "\x1b[0m";

LaunchpadProMK3.debug = 1;
debug = function(message, colour, space) {
  if (LaunchpadProMK3.debug) {
    if (colour === undefined) { var colour = "" }
    if (space !== undefined) { console.log("###") }
    console.log(red + "DEBUG " + reset + colour + message + reset); }
};

dbg = function(variable) {
  if (LaunchpadProMK3.debug) {
    console.log(orange + `DBG ${variable}: ` + variable);
  }
}


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
  11, 12, 13, 14, 15, 16, 17, 18 ]

/// from top to bottom
//LaunchpadProMK3.mainpadLayout = "1234";
//LaunchpadProMK3.mainpadLayout = "4321";
LaunchpadProMK3.mainpadLayout = "3124";
//LaunchpadProMK3.mainpadLayout = "4213";


// MIDI addresses of the left/right side pads
LaunchpadProMK3.sidepadAddresses = [
  80, 70, 89, 79,
  60, 50, 69, 59,
  40, 30, 49, 39,
  20, 10, 29, 19 ];

// Templates for assigning side pad controls
LaunchpadProMK3.sidepadNames = [
  "intro_start_",
  "intro_end_",
  "outro_start_",
  "outro_end_"
];


LaunchpadProMK3.extrasButtons = [ 11, 12, 13, 14, 15, 16, 17, 18, 28 ];

LaunchpadProMK3.extrasControls = [
  "beats_set_halve",
  "beats_set_twothirds",
  "beats_set_threefourths",
  "beats_set_fourthirds",
  "beats_set_threehalves",
  "beats_set_double",
  "beats_undo_adjustment",
  "stars_down",
  "stars_up"
];


LaunchpadProMK3.loopbeatControls = [
  //"hotcue_X_activate",
  // If hotcue X is not set, this sets a hotcue at the current play position and saves it as hotcue X of type “Hotcue”
  // In case a loop is currently enabled (i.e. if [ChannelN],loop_enabled is set to 1),
  // the loop will be saved as hotcue X instead and hotcue_X_type will be set to “Loop”
  // If hotcue X has been set as a regular cue point, the player seeks to the saved play position.

  //"hotcue_X_enabled",
  // 0 Hotcue X is not set, 1 Hotcue X is set, 2 Hotcue X is active (saved loop is enabled or hotcue is previewing)

  ///
  //"beetjump",
  // Jump forward (positive) or backward (negative) by N beats. If a loop is active, the loop is moved by X beats

  //"beatjump_size",
  // Set the number of beats to jump with beatloop_activate / beatjump_forward / beatjump_backward
  //"beatjump_size_halve",
  // Halve the value of beatjump_size
  //"beatjump_size_double",
  // Double the value of beatjump_size


  //"beatjump_backward",
  // Jump backward by beatjump_size. If a loop is active, the loop is moved backward by X beats
  //"beatjump_forward",
  // Jump forward by beatjump_size. If a loop is active, the loop is moved forward by X beats

  //"beatjump_X_backward",
  // Jump backward by X beats. If a loop is active, the loop is moved backward by X beats
  // ditto
  //"beatjump_X_forward",
  // Jump forward by X beats. If a loop is active, the loop is moved forward by X beats.
  // A control exists for X = 0.03125, 0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512.
  "beatjump_32_backward",
  "beatjump_16_backward",
  "beatjump_8_backward",
  "beatjump_4_backward",
  "beatjump_4_forward",
  "beatjump_8_forward",
  "beatjump_16_forward",
  "beatjump_32_forward",
  ///
  //"beatjump_64_backward",
  //"beatjump_128_backward",
  //"beatjump_2_backward",
  //"beatjump_1_backward",
  //"beatjump_1_forward",
  //"beatjump_2_forward",
  //"beatjump_128_forward",
  //"beatjump_64_forward",

  ///
  //"beatloop_activate",
  // Set a loop that is beatloop_size beats long and enables the loop
  //"beatloop_X_activate",
  // Activates a loop over X beats.
  //"beatloop_X_toggle",
  // Toggles a loop over X beats
  //"beatloop_1_activate",
  //"beatloop_2_activate",
  //"beatloop_4_activate",
  //"beatloop_8_activate",
  //"beatloop_16_activate",
  //"beatloop_32_activate",
  //"beatloop_64_activate",
  //"beatloop_128_activate",

  ///
  //"beatlooproll_activate",
  // Activates a rolling loop over beatloop_size beats. Once disabled, playback
  // will resume where the track would have been if it had not entered the loop.
  // "beatlooproll_X_activate",
  // Activates rolling loop over X beats. Once disabled, playback resumes where
  // the track would have been if it had not entered the loop. A control exists
  // for X = 0.03125, 0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512
  "beatlooproll_1_activate",
  "beatlooproll_2_activate",
  "beatlooproll_4_activate",
  "beatlooproll_8_activate",
  "beatlooproll_16_activate",
  "beatlooproll_32_activate",
  "beatlooproll_64_activate",
  "beatlooproll_128_activate",

  ///
  ///"loop_move",
  // Move loop forward by X beats (positive) or backward by X beats (negative).
  // If a saved loop is currently enabled, the modification is saved to the hotcue slot immediately.
  //"loop_move_x_forward",
  // Loop moves forward by X beats. If a saved loop is currently enabled, the modification is saved to the hotcue slot immediately.
  //"loop_move_x_backward",
  // Loop moves back by X beats. If a saved loop is currently enabled, the modification is saved to the hotcue slot immediately.
  "loop_move_32_backward",
  "loop_move_16_backward",
  "loop_move_8_backward",
  "loop_move_4_backward",
  "loop_move_4_forward",
  "loop_move_8_forward",
  "loop_move_16_forward",
  "loop_move_32_forward",

  ///
  //"loop_move_64_backward",
  //"loop_move_128_backward",
  //"loop_move_2_backward",
  //"loop_move_1_backward",
  //"loop_move_1_forward",
  //"loop_move_2_forward",
  //"loop_move_64_forward",
  //"loop_move_128_forward",

  ///
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

  "reloop_andstop",
  // Activate current loop, jump to its loop in point, and stop playback

  "loop_remove",
  // Clears the last active loop


  ///
  // Reverse
  //"reverse",

  //"reverseroll",
];


// Preset colours for decks
LaunchpadProMK3.deckColours = [ 0x000002, 0x040201, 0x020002, 0x000200 ];

// Which deck actions will be performed on
// LaunchpadProMK3.lastHotcueChannel=1

// Track which page is selected
LaunchpadProMK3.currentPage = 0; // Page 0 for hotcues

// Track which hotcue was last used
LaunchpadProMK3.lastHotcue = []; // Page 0 for hotcues

// Track what hotcue was last deleted
LaunchpadProMK3.redoLastDeletedHotcue = []

// Track if the shift button is pressed
LaunchpadProMK3.shift = 0;


//// Startup function, sets up decks, etc.
LaunchpadProMK3.init = function() {
  //debug("\n\n\ninit:\n");
  // Set LPP3 from DAW mode to programmer mode
  LaunchpadProMK3.setProgrammerMode();

  // Create deck objects
  LaunchpadProMK3.decks = {
    1: new LaunchpadProMK3.Deck(1),
    2: new LaunchpadProMK3.Deck(2),
    3: new LaunchpadProMK3.Deck(3),
    4: new LaunchpadProMK3.Deck(4)
  }

  // Clear already lit pads
  LaunchpadProMK3.clearAll();

  // MIDI handlers for deck selection, actions, and page selection
  LaunchpadProMK3.initExtras();

  // Select the initial desk
  LaunchpadProMK3.selectDeck(1);

  // Initialise zeroth page (hotcues)
  LaunchpadProMK3.switchPage(0);

  //debug("\ninit finished\n\n\n\n\n");
};

// Set Launchpad Pro MK3 to Programmer Mode
LaunchpadProMK3.setProgrammerMode = function() {
  LaunchpadProMK3.sendSysEx([0x0E, 0x01]);
};

// Helper to construct and send SysEx messages
LaunchpadProMK3.sendSysEx = function(data) {
  midi.sendSysexMsg([0xF0, 0x00, 0x20, 0x29, 0x02, 0x0E].concat(data, [0xF7]), data.length + 7);
};



//// Initialise buttons

LaunchpadProMK3.initExtras = function() {
  /// Deck selection buttons
  // deck 3
  midi.makeInputHandler(0xB0, 0x65, (channel, control, value, status, group) => {
    if (value != 0) { LaunchpadProMK3.selectDeck(3);
      //debug("selectedDeck = " + LaunchpadProMK3.selectedDeck);
    }
  });
  LaunchpadProMK3.sendRGB(0x65, 0x7F, 0x00, 0x7F); // bright

  // deck 1
  midi.makeInputHandler(0xB0, 0x66, (channel, control, value, status, group) => {
    if (value != 0) { LaunchpadProMK3.selectDeck(1);
      //debug("selectedDeck = " + LaunchpadProMK3.selectedDeck);
    }
  });
  LaunchpadProMK3.sendRGB(0x66, 0x1D, 0x46, 0x7B); // bright

  // deck 2
  midi.makeInputHandler(0xB0, 0x67, (channel, control, value, status, group) => {
    if (value != 0) { LaunchpadProMK3.selectDeck(2);
      //debug("selectedDeck = " + LaunchpadProMK3.selectedDeck);
    }
  });
  LaunchpadProMK3.sendRGB(0x67, 0x7F, 0x58, 0x04); // bright

  // deck 4
  midi.makeInputHandler(0xB0, 0x68, (channel, control, value, status, group) => {
    if (value != 0) { LaunchpadProMK3.selectDeck(4);
      //debug("selectedDeck = " + LaunchpadProMK3.selectedDeck);
    }
  });
  LaunchpadProMK3.sendRGB(0x68, 0x44, 0x60, 0x0D); // bright


  // hotcue color switch next
  midi.makeInputHandler(0xB0, 0x6A, (control, value, status, group) => {
    if (typeof LaunchpadProMK3.lastHotcueChannel === "undefined") { return; }
    let channel = LaunchpadProMK3.lastHotcueChannel;
    script.toggleControl(channel,"hotcue_focus_color_next");
  });
  LaunchpadProMK3.sendRGB(0x6A, 0x7F, 0x20, 0x20);

  // hotcue color switch prev
  midi.makeInputHandler(0xB0, 0x6B, (control, value, status, group) => {
    if (typeof LaunchpadProMK3.lastHotcueChannel === "undefined") { return; }
    let channel = LaunchpadProMK3.lastHotcueChannel;
    script.toggleControl(channel,"hotcue_focus_color_prev");
  });
  LaunchpadProMK3.sendRGB(0x6B, 0x20, 0x20, 0x7F);

  // undo last hotcue
  midi.makeInputHandler(0xB0, 0x62, (channel, control, value, status) => {
    if (value != 0) {
      LaunchpadProMK3.undoLastHotcue();
    }
  });
  LaunchpadProMK3.sendRGB(0x62, 0x7F, 0x30, 0x7F);

  // redo last hotcue
  midi.makeInputHandler(0xB0, 0x61, (channel, control, value, status) => {
    if (value != 0) {
      LaunchpadProMK3.redoLastHotcue();
    }
  });
  LaunchpadProMK3.sendRGB(0x61, 0x2F, 0x20, 0x7F);

  // switch page WIP, bottom right
  midi.makeInputHandler(0xB0, 0x6C, (channel, control, value, status) => {
    if (value != 0) {
      LaunchpadProMK3.switchPage();
    }
  });
  LaunchpadProMK3.sendRGB(0x6C, 0x7F, 0x7F, 0x7F);

  // shift
  midi.makeInputHandler(0xB0, 0x01, (channel, control, value, status) => {
    if (value !== 0) {
      LaunchpadProMK3.shift = 1;
      LaunchpadProMK3.sendRGB(0x01, 0x2F, 0x7F, 0x7F);
    } else if (value == 0) {
      LaunchpadProMK3.shift = 0;
      LaunchpadProMK3.sendRGB(0x01, 0x0B, 0x0B, 0x0F);
    }
  });
  LaunchpadProMK3.sendRGB(0x01, 0x0B, 0x0B, 0x0F);

  // create multiple hotcues
  midi.makeInputHandler(0xB0, 0x03, (channel, control, value, status, group) => {
    if (value != 0) { LaunchpadProMK3.create4LeadupDropHotcues(LaunchpadProMK3.selectedDeck, value); }
  });
  LaunchpadProMK3.sendRGB(0x03, 0x7F, 0x7F, 0x7F);

};



//// Deck constructor

LaunchpadProMK3.Deck = function (deckNumber) {
  components.Deck.call(this, deckNumber);

  this.deckOrderIndex = LaunchpadProMK3.mainpadLayout.indexOf(deckNumber);
  this.deckMainSliceStartIndex = this.deckOrderIndex * 16;
  this.deckPadAddresses = LaunchpadProMK3.mainpadAddresses.slice(this.deckMainSliceStartIndex, this.deckMainSliceStartIndex+16);
  this.deckSideSliceStartIndex = this.deckOrderIndex * 4;
  this.deckSidepadAddresses = LaunchpadProMK3.sidepadAddresses.slice(this.deckSideSliceStartIndex,this.deckSideSliceStartIndex+4);
  this.deckColour = LaunchpadProMK3.deckColours[deckNumber-1]

  //debug("### deck objects instantiation:   deckNumber " + deckNumber + ",   group " + this.currentDeck + ",   colour " + this.deckColour, green, 1);
  //debug(this.deckPadAddresses + "\n")

  engine.makeConnection(`[Channel${deckNumber}]`, "track_loaded", LaunchpadProMK3.onTrackLoadedOrUnloaded);

  //// Deck Main Hotcues
  this.hotcueButtons = [];
  for (let i = 1; i <= 16; i++) {
    color_object = ""
    let padAddress = this.deckPadAddresses[i-1];
    this.i = i;

    //debug("## hotcueButtons:   i " + i + ",   padAddress " + padAddress + "\n");

    LaunchpadProMK3.sendRGB2(padAddress, this.deckColour)

    this.hotcueButtons[i-1] = new components.HotcueButton({
      //midi: [0x90, padAddress],
      number: this.i, // This is the hotcue number
      padAddress: padAddress,
      input: midi.makeInputHandler(0x90, padAddress, (channel, control, value, status) => {
        //debug("track_loaded? " + engine.getValue(`${this.currentDeck}`,"track_loaded") + "   value: " + value + "   cp: " + LaunchpadProMK3.currentPage)
        // Check if this is the hotcue page, and that there is a track loaded on the deck of the pad pressed
        if (engine.getValue(`${this.currentDeck}`,"track_loaded") !== 1 ||
          LaunchpadProMK3.currentPage !== 0 || value === 0) { return };
        // If shift is not pressed down
        // Creating a hotcue
        if (LaunchpadProMK3.shift === 0) {
          debug("no shift..")
          // Check that this is a button being pressed not release, and that the deck has a track loaded
          //if (value !== 0) {
          // When the pad is being pressed
          debug("d " + deckNumber + "/" + this.currentDeck + ",  i/hc " + i + ",  padAddress " + padAddress);
          //engine.setValue(this.currentDeck, "hotcue_" + i + "_activate", 1);  // Trigger hotcue on input
          script.triggerControl(this.currentDeck, "hotcue_" + i + "_activate", 50)
          LaunchpadProMK3.lastHotcueChannel = this.currentDeck
          LaunchpadProMK3.lastHotcue.unshift( [ this.currentDeck, "hotcue_" + i, padAddress, deckNumber ] )
          //} else if (value === 0) {
          //  // When the pad has been released
          //  engine.setValue("[Channel" + deckNumber + "]", "hotcue_" + i + "_activate", 0);  // Trigger hotcue on input
          //};
        } else {
          // If shift is pressed down
          // Deleting a hotcue
          debug("shift")
          //if (value !== 0) {
          // Helper function to toggle control on then off
          script.triggerControl(this.currentDeck, "hotcue_" + i + "_clear", 50)
          // On press
          //engine.setValue("[Channel" + deckNumber + "]", "hotcue_" + i + "_clear", 1);  // Trigger hotcue on input
          //} else if (!value) {
          // On release
          //engine.setValue("[Channel" + deckNumber + "]", "hotcue_" + i + "_clear", 0);  // Trigger hotcue on input
          //};
          LaunchpadProMK3.sendRGB2(padAddress, this.deckColour)
          LaunchpadProMK3.updateHotcuePage();
        };
      }),
      sendRGB: function(color_obj) {
        //debug("cp: " + LaunchpadProMK3.currentPage)
        //debug(color_obj.toString())
        if (LaunchpadProMK3.currentPage === 0) {
          LaunchpadProMK3.sendRGB(this.padAddress, color_obj.red>>1,color_obj.green>>1,color_obj.blue>>1);
        }
      },
      //shutdown: undefined
    });
};


//// deck Sidepad Intro/Outro Hotcues
debug("## deck sidepads instantiation:  deckNumber " + deckNumber + "\n", green, 1);
this.sideButtons = [];
for (let sidepad = 1; sidepad <= 4; sidepad++) {
  let padAddress = this.deckSidepadAddresses[sidepad-1]
  let sidepadControlName = LaunchpadProMK3.sidepadNames[sidepad-1];
  let rgb = LaunchpadProMK3.hexToRGB(0x0000FF);

  //debug("# deck " + deckNumber + ", sidepad " + sidepad + ",  padAddress " +  padAddress + ",  sidepadControlName " + sidepadControlName + "\n");

  this.sideButtons[sidepad-1] = new components.Button({
    midi: [0xB0, padAddress],
    padAddress: padAddress, // Get ready
    // sendRGB: LaunchpadProMK3.sendRGB(this.sidepadAddress, 0x00, 0x00, 0xFF),
    // sendRGB: LaunchpadProMK3.sendRGB(padAddress, rgb[0], rgb[1], rgb[2]),
    input: midi.makeInputHandler(0xB0, padAddress, (channel, control, value, status) => {
      if (LaunchpadProMK3.currentPage === 0) {
        if (value) {
          engine.setValue("[Channel" + deckNumber + "]", `${sidepadControlName}activate`, 1);
        } else if (!value) {
          engine.setValue("[Channel" + deckNumber + "]", `${sidepadControlName}activate`, 0);
        };
      }
    }),
  });
  engine.makeConnection(`[Channel${deckNumber}]`, `${sidepadControlName}enabled`, (value) => {
    if (LaunchpadProMK3.currentPage === 0) {
      LaunchpadProMK3.onTrackWithInOut(value, deckNumber, padAddress);
    }
  });
};


// Set the group properties of the above Components and connect their output callback functions
this.reconnectComponents(function (c) {
  //debug("reconnectComponents: " + c.group + ",  this.currentDeck " + this.currentDeck + "\n")
  if (c.group === undefined) {
    // 'this' inside a function passed to reconnectComponents refers to the ComponentContainer
    // so 'this' refers to the custom Deck object being constructed
    c.group = this.currentDeck;
  };
});
};

LaunchpadProMK3.Deck.prototype = new components.Deck();



//// Single pad light functions

// Helper function to convert RGB hex value to individual R, G, B values
LaunchpadProMK3.hexToRGB = function(hex) {
  //debug("hexToRGB #" + hex.toString(16));
  var r = (hex >> 16) & 0xFF;
  var g = (hex >> 8) & 0xFF;
  var b = hex & 0xFF;
  //debug([r, g, b]);
  return [r, g, b];
};

// Send RGB values
LaunchpadProMK3.sendRGB = function(pad, r, g, b) {
  LaunchpadProMK3.sendSysEx([0x03, 0x03, pad, r, g, b]);
};
LaunchpadProMK3.sendRGB2 = function(pad, hex) {
  var r = (hex >> 16) & 0xFF;
  var g = (hex >> 8) & 0xFF;
  var b = hex & 0xFF;
  LaunchpadProMK3.sendSysEx([0x03, 0x03, pad, r, g, b]);
};


// Turn off pad LEDs
LaunchpadProMK3.turnOffPad = function(pad) {
  LaunchpadProMK3.sendRGB(pad, 0, 0, 0);
};

// Turn off main LEDs for page change
LaunchpadProMK3.clearMain = function() {
  //debug("/////// clearing main pads:");
  for (var i = 0; i < 64; i++) {
    //debug("turning off " + LaunchpadProMK3.mainpadAddresses[i] + " ("+LaunchpadProMK3.mainpadAddresses[i].toString(16)+")");
    LaunchpadProMK3.turnOffPad(LaunchpadProMK3.mainpadAddresses[i]);
  };
  for (var i = 0; i < 16; i++) {
    //debug("turning off " + LaunchpadProMK3.sidepadAddresses[i] + " ("+LaunchpadProMK3.sidepadAddresses[i].toString(16)+")");
    LaunchpadProMK3.turnOffPad(LaunchpadProMK3.sidepadAddresses[i]);
  };
};

// Turn off all LEDs for page change or shutdown
LaunchpadProMK3.clearAll = function() {
  //debug("clearing all pads:", orange);
  for (var i = 0; i <= 0x7F; i++) {
    LaunchpadProMK3.turnOffPad(i);
  };
};

// Shutdown function that should be triggered by Mixxx on close
LaunchpadProMK3.shutdown = function() {
  //debug("###  SHUTTINGDOWN  ###", orange, 1);
  LaunchpadProMK3.clearAll;
  LaunchpadProMK3.setProgrammerMode();
}

LaunchpadProMK3.undoLastHotcue = function() {
  debug("undooooo")
  //engine.setValue, LaunchpadProMK3.lastHotcue[1] +"_clear", 1);  // Trigger hotcue on input
  //LaunchpadProMK3.sleep(50)
  //engine.setValue(LaunchpadProMK3.lastHotcue[0], +"_clear", 0);
  // Check that a hotcue has been created
  if (LaunchpadProMK3.lastHotcue[0] === undefined) return
  // Deserialise the hotcue to undo away
  let popped = LaunchpadProMK3.lastHotcue.shift()
  debug("## popped:  " + popped)
  debug("## LaunchpadProMK3.lastHotcue:  " + LaunchpadProMK3.lastHotcue)
  let channel = popped[0];
  let control = popped[1];
  let padAddress = popped[2];
  let deckNumber = popped[3];
  debug("### undoLastHotcue:   cont; " + control + ",   chan; " + channel + ",   deck; " + deckNumber + ",   pad;" + padAddress);
  // Common JS func to toggle a control on then off again
  script.triggerControl(channel, control + "_clear", 64);
  // Add undone hotcue to redo list
  LaunchpadProMK3.redoLastDeletedHotcue.unshift(popped)
  // Reset pad colour to deck colour
  LaunchpadProMK3.sendRGB2(padAddress, LaunchpadProMK3.deckColours[deckNumber-1]);
  LaunchpadProMK3.updateHotcuePage();
}

LaunchpadProMK3.redoLastHotcue = function() {
  // Check if a hotcue has been undone
  if (LaunchpadProMK3.redoLastDeletedHotcue[0] === undefined) return
  // Get the undone hotcue to redo
  let unpopped = LaunchpadProMK3.redoLastDeletedHotcue.shift()
  debug("## unpopped:  " + unpopped)
  debug("## LaunchpadProMK3.redoLastDeletedHotcue:  " + LaunchpadProMK3.redoLastDeletedHotcue)
  // Deserialise the hotcue to redo
  let channel = unpopped[0];
  let control = unpopped[1];
  let padAddress = unpopped[2];
  let deckNumber = unpopped[3];
  debug("### redoLastHotcue:   cont; " + control + ",   chan; " + channel + ",   deck; " + deckNumber + ",   pad;" + padAddress);
  // Activate the hotcue to undelete it
  script.triggerControl(channel, control + "_activate", 64);
  // Add redone hotcue back to undo stack again
  LaunchpadProMK3.lastHotcue.unshift( [ channel, control, padAddress, deckNumber ] );
  LaunchpadProMK3.updateHotcuePage();
}


//// Multiple pad light functions

// Turn a sidepad colour to blue or off
LaunchpadProMK3.onTrackWithInOut = function(value, deckNumber, padAddress) {
  //debug("## onTrackWithInOut    value " + value + ", padAddress " + padAddress);
  if (value > 0) {
    //debug(`## Turning sidepad for deck ${deckNumber} blue: ${padAddress}`);
    LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0xFF);
  } else {
    //debug(`## Turning sidepad for deck ${deckNumber} off: ${padAddress}`);
    LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0x00);
  };
};

// Handle switching pages, cycling or directly
LaunchpadProMK3.switchPage = function(page) {
  //debugextra = "";
  // find target page if none provided
  if (page === undefined) {
    page = (LaunchpadProMK3.currentPage+1) % 3;
    //debug("## switchPage    page now: " + page)
  }

  debugextra = "   to   " + page;
  //debug("### switching page from " + LaunchpadProMK3.currentPage + debugextra);
  LaunchpadProMK3.currentPage = page;
  if (page === 0) { LaunchpadProMK3.updateHotcuePage() }
  else if (page === 1) { LaunchpadProMK3.updateExtrasPage() }
  else if (page === 2) { LaunchpadProMK3.updateLoopBeat() }

};

// Function to update pad lights for each hotcue
LaunchpadProMK3.updateHotcuePage = function(deck) {
  //debug("## set/refresh hotcue page: " + deck);
  if (deck === undefined) {
    //debug("## undefined =  updating all decks..");
    LaunchpadProMK3.clearMain();
    LaunchpadProMK3.updateHotcueLights(1);
    LaunchpadProMK3.updateHotcueLights(2);
    LaunchpadProMK3.updateHotcueLights(3);
    LaunchpadProMK3.updateHotcueLights(4);
  } else {
    //debug("updating " + deck);
    LaunchpadProMK3.updateDeckLights(deck);
  };
  //debug("\n");
};

// Update pad lights for a specific deck
LaunchpadProMK3.updateHotcueLights = function(deck) {
  if (LaunchpadProMK3.currentPage === 0) {
    var deckColour = LaunchpadProMK3.deckColours[deck-1]
    //debug("## updateDeckLights:   deck " + deck + ",   deckColour " + deckColour + "\n");
    for (var i = 0; i < 16; i++) {
      let cueEnabled = engine.getValue(`[Channel${deck}]`, `hotcue_${i + 1}_status`);
      let cueColor = engine.getValue(`[Channel${deck}]`, `hotcue_${i + 1}_color`);
      let address = LaunchpadProMK3.decks[deck].deckPadAddresses[i]
      //debug("i " + i + ",   address " + address + ",   deckColour " + deckColour + ",   cueEnabled " + cueEnabled + ",   cueColor #" + cueColor.toString(16))
      if (cueEnabled === 1) {
        let rgb = LaunchpadProMK3.hexToRGB(cueColor);
        //debug(rgb)
        LaunchpadProMK3.sendRGB(address, rgb[0]/2, rgb[1]/2, rgb[2]/2);
      } else {
        let rgb = LaunchpadProMK3.hexToRGB(LaunchpadProMK3.deckColours[deck-1]);
        //debug(rgb)
        LaunchpadProMK3.sendRGB(address, rgb[0], rgb[1], rgb[2]);
      };
    };
    for (let i = 0; i < 4; i++) {
      let sidepad = deck * 4 + i
      let padAddress = LaunchpadProMK3.sidepadAddresses[sidepad];
      LaunchpadProMK3.onTrackWithInOut(padAddress);
    }
  };
}



// Do things on track load/unload
LaunchpadProMK3.onTrackLoadedOrUnloaded = function(value, group) {
  //debug(value === 1 ? `###  Track loaded on ${group}\n` : `###  Track unloaded from ${group}\n`, green, 1);
  deck = group.match(/(\d+)/)[1];
  //LaunchpadProMK3.sleep(500);
  if (LaunchpadProMK3.currentPage === 0) {
    LaunchpadProMK3.updateHotcueLights(deck);
  }
};


// Update second page
LaunchpadProMK3.updateExtrasPage = function() {
  //debug("## updateExtrasPage");
  LaunchpadProMK3.clearMain();
  let control = 0;
  // LaunchpadProMK3.sendRGB(address, address, address*4, addr0ess*7)
  for (let address of LaunchpadProMK3.extrasButtons) {
    // add = LaunchpadProMK3.extrasButtons[addInd]
    midi.makeInputHandler(0xB0, address, (channel, control, value, status, group) => {
      if (LaunchpadProMK3.currentPage === 1) {
        if (value) { LaunchpadProMK3.extrasControls[control] };
        //debug("extras " + address);
      }
    });
    LaunchpadProMK3.sendRGB(address, 0x70, 0x73, 0x71)
    control = control+1;
  };
};


// Update third page
LaunchpadProMK3.updateLoopBeat = function() {
  //debug("## updateLoopBeatPage");
  LaunchpadProMK3.clearMain();
  const addresses = LaunchpadProMK3.mainpadAddresses
  const controls = LaunchpadProMK3.loopbeatControls
  const controlslen = controls.length
  //const control = 0;
  //debug("outside loop " + addresses[control])
  //for (let control of controls) {
  let i = 0
  while (i < controlslen) {
    //debug("outside loop " + addresses[i])
    //debug(controlslen + "   " + controls)
    let address = addresses[i]
    //debug("inner loop " + addresses[i])
    //debug(address)
    //dbg(address)
    midi.makeInputHandler(0xB0, address, (channel, control, value, status, group) => {
      if (LaunchpadProMK3.currentPage === 2) {
        //debug("loopbeat: " + control + ",   addresss: " + address);
      }
    });
    let factor = i * 7;
    let r = factor * 6
    let g = factor * 5
    let b = factor * 4
    LaunchpadProMK3.sendRGB(address, r, g, b)
    //control = control+1;
    i++
  };
};



//// Other hotcue helper functions

//LaunchpadProMK3.hotcue_last_delete = function(channel, control, value, status, group) {
//  if (PioneerCDJ850.last_hotcue < 1 || PioneerCDJ850.last_hotcue > 4)
//    return;
//  key = "hotcue_" + PioneerCDJ850.last_hotcue + "_clear";
//  engine.setValue(group,key,value);
//  LaunchpadProMK3.last_hotcue = 0;
//};


// To add time between steps in multi hotcue function
LaunchpadProMK3.sleep = function(time) {
  var then = Date.now();
  while (true) {
    var now = Date.now();
    if (now - then > time) {
      break;
    };
  };
};


// Set selected deck and change LEDs
LaunchpadProMK3.selectDeck = function(deck) {
  LaunchpadProMK3.selectedDeck = deck;
  //debug("### selecting deck " + deck);
  // unbrightness ratio
  let b=6;
  if (deck === 3) {
    LaunchpadProMK3.sendRGB(0x65, 0x7F, 0x00, 0x7F);
    LaunchpadProMK3.sendRGB(0x66, 0x1D/b, 0x46/b, 0x7B/b);
    LaunchpadProMK3.sendRGB(0x67, 0x7F/b, 0x58/b, 0x04/b);
    LaunchpadProMK3.sendRGB(0x68, 0x44/b, 0x60/b, 0x0D/b);
  } else if (deck === 1) {
    LaunchpadProMK3.sendRGB(0x65, 0x7F/b, 0x00, 0x7F/b);
    LaunchpadProMK3.sendRGB(0x66, 0x1D, 0x46, 0x7B);
    LaunchpadProMK3.sendRGB(0x67, 0x7F/b, 0x58/b, 0x04/b);
    LaunchpadProMK3.sendRGB(0x68, 0x44/b, 0x60/b, 0x0b/b);
  } else if (deck === 2) {
    LaunchpadProMK3.sendRGB(0x65, 0x7F/b, 0x00, 0x7F/b);
    LaunchpadProMK3.sendRGB(0x66, 0x1D/b, 0x46/b, 0x7B/b);
    LaunchpadProMK3.sendRGB(0x67, 0x7F, 0x58, 0x04);
    LaunchpadProMK3.sendRGB(0x68, 0x44/b, 0x60/b, 0x0D/b);
  } else if (deck === 4) {
    LaunchpadProMK3.sendRGB(0x65, 0x7F/b, 0x00, 0x7F/b);
    LaunchpadProMK3.sendRGB(0x66, 0x1D/b, 0x46/b, 0x7B/b);
    LaunchpadProMK3.sendRGB(0x67, 0x7F/b, 0x58/b, 0x04/b);
    LaunchpadProMK3.sendRGB(0x68, 0x44, 0x60, 0x0D);
  };
};


// Create a number of hotcues working back from playhead position
LaunchpadProMK3.create4LeadupDropHotcues = function (deck, value) {
  //debug("Create hotcues for drop/breakdown + at -16, -32, -64,   deck " + deck, ",   value " + value);
  // debug("LOG   channel " + channel + "    control " + _control + "    value " + value + "    status " + _status + "    group " + group)
  if (value === 0 || value === undefined) return 0;
  group = `[Channel${deck}]`;
  for (let X = 1; X <= 36; X++) {
    let hotcueVariable = "hotcue_" + X + "_status";
    if (engine.getValue(group, hotcueVariable) === 0) {
      X += 3;
      // Create main hotcue
      hotcueFocus = "hotcue_"+X+"_set";
      engine.setValue(group,hotcueFocus, 1);
      hotcueColourFocus = "hotcue_"+X+"_color";
      engine.setValue(group,hotcueColourFocus, 0x32be44); // green
      engine.setValue(group, "beatjump_16_backward", 1);
      LaunchpadProMK3.sleep(50);
      // Create -16
      engine.setValue(group,"hotcue_"+(X-1)+"_set", 1);
      engine.setValue(group,"hotcue_"+(X-1)+"_color", 0xf8d200); // yellow
      engine.setValue(group, "beatjump_16_backward", 1);
      LaunchpadProMK3.sleep(50);
      // Create -32
      engine.setValue(group,"hotcue_"+(X-2)+"_set", 1);
      engine.setValue(group,"hotcue_"+(X-2)+"_color", 0xf8d200); // yellow
      engine.setValue(group, "beatjump_32_backward", 1);
      LaunchpadProMK3.sleep(50);
      // Create -64
      engine.setValue(group,"hotcue_"+(X-3)+"_set", 1);
      engine.setValue(group,"hotcue_"+(X-3)+"_color", 0xf8d200); // yellow
      engine.setValue(group, "beatjump_64_forward", 1);
      LaunchpadProMK3.sleep(50);
      //
      engine.setValue(group, "intro_end_activate", 1);
      return;
    };
  };
};
