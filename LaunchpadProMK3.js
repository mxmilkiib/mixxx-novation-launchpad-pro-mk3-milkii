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

// from top to bottom
LaunchpadProMK3.mainpadLayout = "3124"


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



LaunchpadProMK3.deckColours = [ 0x000002, 0x040201, 0x020002, 0x000200 ];


// Which deck actions will be performed on
// LaunchpadProMK3.lastHotcueChannel=1

// Which page of MIDI functions is selected
LaunchpadProMK3.currentPage = 0; // Page 0 for hotcues

LaunchpadProMK3.shift = 0;

//// Startup function, sets up decks, etc.

LaunchpadProMK3.init = function() {
  debug("\n\n\ninit:\n");
  // Set LPP3 to programmer mode
  LaunchpadProMK3.setProgrammerMode();

  // create decks
LaunchpadProMK3.decks = {
  1: new LaunchpadProMK3.Deck(1),
  2: new LaunchpadProMK3.Deck(2),
  3: new LaunchpadProMK3.Deck(3),
  4: new LaunchpadProMK3.Deck(4)
}

  // Clear lights
  LaunchpadProMK3.clearAll();

  // Setup hotcue connections
  //LaunchpadProMK3.connectHotcues();

  // MIDI handlers for deck selection, actions, and page selection
  LaunchpadProMK3.initExtras();

  // Set the initial desk
  LaunchpadProMK3.selectDeck(1);

  // Initialise zeroth page (hotcues)
  LaunchpadProMK3.switchPage(0);

  debug("\ninit finished\n\n\n\n\n");
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
    if (value) { LaunchpadProMK3.selectDeck(3); }
    debug("selectedDeck = " + LaunchpadProMK3.selectedDeck);
  });
  LaunchpadProMK3.sendRGB(0x65, 0x7F, 0x00, 0x7F); // bright

  // deck 1
  midi.makeInputHandler(0xB0, 0x66, (channel, control, value, status, group) => {
    if (value) { LaunchpadProMK3.selectDeck(1); }
    debug("selectedDeck = " + LaunchpadProMK3.selectedDeck);
  });
  LaunchpadProMK3.sendRGB(0x66, 0x1D, 0x46, 0x7B); // bright

  // deck 2
  midi.makeInputHandler(0xB0, 0x67, (channel, control, value, status, group) => {
    if (value) { LaunchpadProMK3.selectDeck(2); }
    debug("selectedDeck = " + LaunchpadProMK3.selectedDeck);
  });
  LaunchpadProMK3.sendRGB(0x67, 0x7F, 0x58, 0x04); // bright

  // deck 4
  midi.makeInputHandler(0xB0, 0x68, (channel, control, value, status, group) => {
    if (value) { LaunchpadProMK3.selectDeck(4); }
    debug("selectedDeck = " + LaunchpadProMK3.selectedDeck);
  });
  LaunchpadProMK3.sendRGB(0x68, 0x44, 0x60, 0x0D); // bright


  // create multiple hotcues
  midi.makeInputHandler(0xB0, 0x03, (channel, control, value, status, group) => {
    if (value) { LaunchpadProMK3.create4LeadupDropHotcues(LaunchpadProMK3.selectedDeck, value); }
  });
  LaunchpadProMK3.sendRGB(0x03, 0x7F, 0x7F, 0x7F);


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


  // switch page WIP, bottom right
  midi.makeInputHandler(0xB0, 0x6C, (channel, control, value, status) => {
    if (value != 0) {
      if (LaunchpadProMK3.currentPage === 1) { LaunchpadProMK3.switchPage(0); }
      if (LaunchpadProMK3.currentPage === 0) { LaunchpadProMK3.switchPage(1); }
      LaunchpadProMK3.currentPage ^= 1;
    }
  });
  LaunchpadProMK3.sendRGB(0x6C, 0x7F, 0x7F, 0x7F);

  // shift
  midi.makeInputHandler(0xB0, 0x08, (channel, control, value, status) => {
    if (value !== 0) {
      LaunchpadProMK3.shift = 1;
      LaunchpadProMK3.sendRGB(0x08, 0x2F, 0x7F, 0x7F);
    }
    if (value == 0) {
      LaunchpadProMK3.shift = 0;
      LaunchpadProMK3.sendRGB(0x08, 0x01, 0x0F, 0x0F);
    }
  });
  LaunchpadProMK3.sendRGB(0x08, 0x01, 0x0F, 0x0F);
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

  debug("### deck objects instantiation:   deckNumber " + deckNumber + ",   group " + this.currentDeck + ",   colour " + this.deckColour, green, 1);
  debug(this.deckPadAddresses + "\n")

  engine.makeConnection(`[Channel${deckNumber}]`, "track_loaded", LaunchpadProMK3.onTrackLoadedOrUnloaded);

  //// Deck Main Hotcues
  this.hotcueButtons = [];
  for (let i = 1; i <= 16; i++) {
    let padAddress = this.deckPadAddresses[i-1];
    this.i = i;

    debug("# hotcueButtons:   i " + i + ",   padAddress " + padAddress + "\n");

    LaunchpadProMK3.sendRGB2(padAddress, this.deckColour)
    //aunchpadProMK3.deckColours[deckNumber]);

    this.hotcueButtons[i-1] = new components.HotcueButton({
      //midi: [0x90, padAddress],
      number: this.i, // This is the hotcue number
      padAddress: padAddress,
      sendRGB: sendRGBfunc,
      input: midi.makeInputHandler(0x90, padAddress, (channel, control, value, status) => {
        if (LaunchpadProMK3.shift == 0) {
          if (value) {
            debug("d " + deckNumber + "/" + this.currentDeck + ",  i/hc " + i + ",  padAddress " + padAddress);
            engine.setValue("[Channel" + deckNumber + "]", "hotcue_" + i + "_activate", 1);  // Trigger hotcue on input
            LaunchpadProMK3.lastHotcueChannel = "[Channel" + deckNumber + "]";
          } else if (!value) {
            engine.setValue("[Channel" + deckNumber + "]", "hotcue_" + i + "_activate", 0);  // Trigger hotcue on input
          };
        } else if (LaunchpadProMK3.shift == 1) {
          if (value) {
            engine.setValue("[Channel" + deckNumber + "]", "hotcue_" + i + "_clear", 1);  // Trigger hotcue on input
          } else if (!value) {
            engine.setValue("[Channel" + deckNumber + "]", "hotcue_" + i + "_clear", 0);  // Trigger hotcue on input
          };
          LaunchpadProMK3.sendRGB2(padAddress, this.deckColour)
        };
      }),
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

    debug("# deck " + deckNumber + ", sidepad " + sidepad + ",  padAddress " +  padAddress + ",  sidepadControlName " + sidepadControlName + "\n");

    this.sideButtons[sidepad-1] = new components.Button({
      midi: [0xB0, padAddress],
      padAddress: padAddress, // Get ready
      // sendRGB: LaunchpadProMK3.sendRGB(this.sidepadAddress, 0x00, 0x00, 0xFF),
      // sendRGB: LaunchpadProMK3.sendRGB(padAddress, rgb[0], rgb[1], rgb[2]),
      input: midi.makeInputHandler(0xB0, padAddress, (channel, control, value, status) => {
        if (value) {
          engine.setValue("[Channel" + deckNumber + "]", `${sidepadControlName}activate`, 1);
        } else if (!value) {
          engine.setValue("[Channel" + deckNumber + "]", `${sidepadControlName}activate`, 0);
        };
      }),
    });
    engine.makeConnection(`[Channel${deckNumber}]`, `${sidepadControlName}enabled`, (value) => {
      LaunchpadProMK3.onTrackWithInOut(value, deckNumber, padAddress);
    });
  };


  // Set the group properties of the above Components and connect their output callback functions
  this.reconnectComponents(function (c) {
    debug("reconnectComponents: " + c.group + ",  this.currentDeck " + this.currentDeck + "\n")
    if (c.group === undefined) {
      // 'this' inside a function passed to reconnectComponents refers to the ComponentContainer
      // so 'this' refers to the custom Deck object being constructed
      c.group = this.currentDeck;
    };
  });
};

LaunchpadProMK3.Deck.prototype = new components.Deck();

// sendRGB for hotcues, broken out for clarity
sendRGBfunc = function (color_obj) {
  LaunchpadProMK3.sendRGB(this.padAddress, color_obj.red>>1,color_obj.green>>1,color_obj.blue>>1);
};



//// Helper to connect hotcues for all channels
//LaunchpadProMK3.connectHotcues = function() {
//  debug("### Helper connectHotcues:\n");
//
//  lpArray = LaunchpadProMK3.mainpadAddresses;
//
//  for (let deck = 1; deck <= 4; deck++) {
//
//
//    // for (let i = 1; i <= 16; i++)  {
//    //   debug()
//    //   let pad = LaunchpadProMK3.mainpadAddresses[deck * 16 - 16 + i - 1]
//    //   let hotcueIndex = lpArray.indexOf(pad) + ((deck - 1) * 16 + 1)
//    //   debug("hotcueIndex:" + hotcueIndex)
//    //   debug("hotcueIndex16: " + hotcueIndex.toString(16))
//    //   debug("pad: " + pad)
//
//    //   engine.makeConnection(`[Channel${deck}]`, `hotcue_${i}_status`, function(value) {
//    //     if (value === 0) {
//    //       LaunchpadProMK3.turnOffPad(pad);
//    //     }
//    //   });
//
//    // }
//
//    // for (let sidepad = 1; sidepad <= 4; sidepad++) {
//    //   let sidepadAddressIndex = 4 * (deck - 1) + sidepad - 1
//    //   let sidepadAddress = LaunchpadProMK3.sidepadAddresses[sidepadAddressIndex]
//    //   let sidepadControlName = LaunchpadProMK3.sidepadNames[sidepad-1]
//    //   let rgb = LaunchpadProMK3.hexToRGB(0x0000FF);
//
//    //   debug(" sidepad " + sidepad + ",  sidepadAddressIndex " + sidepadAddressIndex + ",  sidepadAddress " + sidepadAddress + ",  sidepadControlName " + sidepadControlName )
//
//    // LaunchpadProMK3.onTrackWithInOut
//    // if (`${sidepadControlName}enabled`) { LaunchpadProMK3.sendRGB(sidepadAddress, rgb[0], rgb[1], rgb[2])}
//
//    // midi.makeInputHandler(0xB0, sidepadAddress, (channel, control, value, status) => {
//    //   if (value) {
//    //     engine.setValue("[Channel" + deck + "]", `${sidepadControlName}activate`, 1);
//    //   }
//    //   if (!value) {
//    //     engine.setValue("[Channel" + deck + "]", `${sidepadControlName}activate`, 0);
//    //   }
//    // })
//    // engine.makeConnection(`[Channel${deck}]`, `${sidepadControlName}enabled`, LaunchpadProMK3.onTrackWithInOut);
//    // }
//  };
//};



//// Helper functions

// Helper function to convert RGB hex value to individual R, G, B values
LaunchpadProMK3.hexToRGB = function(hex) {
  debug("hexToRGB #" + hex.toString(16));
  var r = (hex >> 16) & 0xFF;
  var g = (hex >> 8) & 0xFF;
  var b = hex & 0xFF;
  debug([r, g, b]);
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

// Turn off all LEDs for page change or shutdown
LaunchpadProMK3.clearAll = function() {
  debug("clearing all pads:", orange);
  for (var i = 0; i < 0x7F; i++) {
    LaunchpadProMK3.turnOffPad(i);
  };
};

// Turn off main LEDs for page change
LaunchpadProMK3.clearMain = function() {
  debug("clearing main pads:");
  for (var i = 0; i < 64; i++) {
    debug("turning off " + LaunchpadProMK3.mainpadAddresses[i] + " ("+LaunchpadProMK3.mainpadAddresses[i].toString(16)+")");
    LaunchpadProMK3.turnOffPad(LaunchpadProMK3.mainpadAddresses[i]);
  };
};

// Set selected deck and change LEDs
LaunchpadProMK3.selectDeck = function(deck) {
  LaunchpadProMK3.selectedDeck = deck;
  debug("selecting deck " + deck);
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

// Handle switching back to page 0 (hotcues) and refreshing lights
LaunchpadProMK3.switchPage = function(pageNumber) {
  debug("### switching page from " + LaunchpadProMK3.currentPage + " to " + pageNumber);
  if (pageNumber === 0) { LaunchpadProMK3.updateHotcuePage() };
  if (pageNumber === 1) { LaunchpadProMK3.updateExtrasPage() };
};


// Function to update pad lights for each hotcue
LaunchpadProMK3.updateHotcuePage = function(deck) {
  debug("## set/refresh hotcue page: " + deck);
  if (deck === undefined) {
    debug("## undefined =  updating all decks..");
    LaunchpadProMK3.clearMain();
    LaunchpadProMK3.updateHotcueLights(1);
    LaunchpadProMK3.updateHotcueLights(2);
    LaunchpadProMK3.updateHotcueLights(3);
    LaunchpadProMK3.updateHotcueLights(4);
  } else {
    debug("updating " + deck);
    LaunchpadProMK3.updateDeckLights(deck);
  };
  debug("\n");
};

// Update pad lights for a specific deck
LaunchpadProMK3.updateHotcueLights = function(deck) {
  var deckColour = LaunchpadProMK3.deckColours[deck-1]
  debug("## updateDeckLights:   deck " + deck + ",   deckColour " + deckColour + "\n");
  for (var i = 0; i < 16; i++) {
    let cueEnabled = engine.getValue(`[Channel${deck}]`, `hotcue_${i + 1}_status`);
    let cueColor = engine.getValue(`[Channel${deck}]`, `hotcue_${i + 1}_color`);
    let address = LaunchpadProMK3.decks[deck].deckPadAddresses[i]
    debug("i " + i + ",   address " + address + ",   deckColour " + deckColour + ",   cueEnabled " + cueEnabled + ",   cueColor #" + cueColor.toString(16))
    if (cueEnabled === 1) {
      let rgb = LaunchpadProMK3.hexToRGB(cueColor);
      debug(rgb)
      LaunchpadProMK3.sendRGB(address, rgb[0]/2, rgb[1]/2, rgb[2]/2);
    } else {
      let rgb = LaunchpadProMK3.hexToRGB(LaunchpadProMK3.deckColours[deck-1]);
      debug(rgb)
      LaunchpadProMK3.sendRGB(address, rgb[0], rgb[1], rgb[2]);
    };
  };
};

LaunchpadProMK3.updateExtrasPage = function() {
  debug("## updateExtrasPage");
  LaunchpadProMK3.clearMain();
  let control = 0;
  // LaunchpadProMK3.sendRGB(address, address, address*4, addr0ess*7)
  for (let address of LaunchpadProMK3.extrasButtons) {
    // add = LaunchpadProMK3.extrasButtons[addInd]
    midi.makeInputHandler(0xB0, address, (channel, control, value, status, group) => {
      if (value) { LaunchpadProMK3.extrasControls[control] };
      debug("extras " + address);
    });
    // LaunchpadProMK3.sendRGB(address, 0x7F, 0x7F, 0x7F)
    control = control+1;
  };
};


// Turn a sidepad colour to blue or off
LaunchpadProMK3.onTrackWithInOut = function(value, deckNumber, padAddress) {
  debug(" value " + value + ", padAddress " + padAddress);
  if (value > 0) {
    debug(`Turning sidepad for deck ${deckNumber} blue: ${padAddress}`);
    LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0xFF);
  } else {
    debug(`Turning sidepad for deck ${deckNumber} off: ${padAddress}`);
    LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0x00);
  };
};


// Do things on track load/unload
LaunchpadProMK3.onTrackLoadedOrUnloaded = function(value, group) {
  debug(value === 1 ? `###  Track loaded on ${group}\n` : `###  Track unloaded from ${group}\n`, green, 1);
  deck = group.match(/(\d+)/)[1];
  LaunchpadProMK3.sleep(500);
  LaunchpadProMK3.updateHotcueLights(deck);
};


//LaunchpadProMK3.hotcue_last_delete = function(channel, control, value, status, group) {
//  if (PioneerCDJ850.last_hotcue < 1 || PioneerCDJ850.last_hotcue > 4)
//    return;
//  key = "hotcue_" + PioneerCDJ850.last_hotcue + "_clear";
//  engine.setValue(group,key,value);
//  PioneerCDJ850.last_hotcue = 0;
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

// Create a number of hotcues working back from playhead position
LaunchpadProMK3.create4LeadupDropHotcues = function (deck, value) {
  debug("create4LDH, deck " + deck, "value " + value);
  // debug("LOG   channel " + channel + "    control " + _control + "    value " + value + "    status " + _status + "    group " + group)
  if (value === 0 || value === undefined) return 0;
  group = `[Channel${deck}]`;
  for (let X = 1; X <= 64; X++) {
    let hotcueVariable = "hotcue_" + X + "_status";
    if (engine.getValue(group, hotcueVariable) === 0) {
      X += 3;
      hotcueFocus = "hotcue_"+X+"_set";
      engine.setValue(group,hotcueFocus, 1);
      hotcueColourFocus = "hotcue_"+X+"_color";
      engine.setValue(group,hotcueColourFocus, 0x32be44); // green
      engine.setValue(group, "beatjump_16_backward", 1);
      LaunchpadProMK3.sleep(50);
      engine.setValue(group,"hotcue_"+(X-1)+"_set", 1);
      engine.setValue(group,"hotcue_"+(X-1)+"_color", 0xf8d200); // yellow
      engine.setValue(group, "beatjump_16_backward", 1);
      LaunchpadProMK3.sleep(50);
      engine.setValue(group,"hotcue_"+(X-2)+"_set", 1);
      engine.setValue(group,"hotcue_"+(X-2)+"_color", 0xf8d200); // yellow
      engine.setValue(group, "beatjump_32_backward", 1);
      LaunchpadProMK3.sleep(50);
      engine.setValue(group,"hotcue_"+(X-3)+"_set", 1);
      engine.setValue(group,"hotcue_"+(X-3)+"_color", 0xf8d200); // yellow
      engine.setValue(group, "beatjump_64_forward", 1);
      LaunchpadProMK3.sleep(50);
      engine.setValue(group, "intro_end_activate", 1);
      return;
    };
  };
};
