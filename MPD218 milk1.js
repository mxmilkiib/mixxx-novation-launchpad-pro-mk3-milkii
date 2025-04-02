MPD218milk = {};


/// DEBUG stuff
MPD218milk.DEBUGstate = 1;


// Terminal colour codes for DEBUG messages
const COLOURS = {
  RED: "\x1b[31m",
  GREEN: "\x1b[32m"  ,
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
  if (MPD218milk.DEBUGstate) {
    if (colour === undefined) { colour = ""; }
    if (typeof linesbefore === "number" && linesbefore > 0 && linesbefore < 50) { for (i = 0; i < linesbefore; i+= 1) { console.log(" "); } }
    console.log(`${COLOURS.RED}DEBUG ${COLOURS.RESET}${colour}${message}${COLOURS.RESET}`);
    if (typeof linesafter === "number" && linesafter > 0 && linesafter < 50) { for (i = 0; i < linesafter; i+= 1) { console.log(" "); } }
    //LaunchpadProMK3.sleep(1000)
  }
};




const pot = {
  "a": {
"1": 0x03,
"2": 0x09,
"3": 0x0C,
"4": 0x0D,
"5": 0x0E,
"6": 0x0F
  },
"b": {
"1": 0x10,
"2": 0x11,
"3": 0x12,
"4": 0x13,
"5": 0x14,
"6": 0x15
},
  "c": {
"1": 0x16,
"2": 0x17,
"3": 0x18,
"4": 0x19,
"5": 0x1A,
"6": 0x1B
  }
};


const waveformMaxZoom = 80;

MPD218milk.wavezoomAll = function wavezoomAll(value){
  const range = waveformMaxZoom - 1;
  DEBUG("range " + range)
  var newValue = Math.round(1+((value / 127) * range));
  DEBUG("newValue " + newValue)
  if (newValue > waveformMaxZoom) { newValue = waveformMaxZoom; }
  if (newValue < 1) newValue = 1;
  if (MPD218milk.lastwavevalue !== value) {
    for (var i=1; i<9; i++){
      engine.setValue("[Channel1]", "waveform_zoom", newValue);
    };
  }
  MPD218milk.lastwavevalue = value;
};



midi.makeInputHandler(0xB0, pot.c[6], (channel, control, value, status, _group) => {
  //if (value !== 0) { LaunchpadProMK3.selectDeck(3); }
  MPD218milk.wavezoomAll(value)
})









 //midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[0], (channel, control, value, status, _group) => {
 //   if (value !== 0) { LaunchpadProMK3.selectDeck(3); }
 // });
 // LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[0], 0xd7, 0x00, 0xd7); // bright


//LaunchpadProMK3.deck.config = {
//  "1": { order: 2, colour: 0x378df7, }, //blue
//  "2": { order: 3, colour: 0xfeb108, }, //orange
//  "3": { order: 1, colour: 0xd700d7, }, //magenta
//  "4": { order: 4, colour: 0x88b31a  }, //green
//}
//
//
////midi.sendSysexMsg(signal, signal.length);;
