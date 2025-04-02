// https://github.com/mixxxdj/mixxx/wiki/midi%20scripting
// https://github.com/mixxxdj/mixxx/wiki/Components_JS#hotcuebutton
// https://fael-downloads-prod.focusrite.com/customer/prod/s3fs-public/downloads/LPP3_prog_ref_guide_200415.pdf
// https://github.com/antt0n/Launchpad-Core/blob/main/src/Drivers/LaunchpadProMK3.ts
// https://github.com/weskoop/Launchpad-Pro-Mk3-for-Bitwig/blob/main/src/LaunchPad.ts


// working title
var arg = {}


const sysexHeader = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x0E]
const sysexFooter = [0xF7]


const sysexCustomLayout7 = [0x00, 0x03, 0x06, 0x00]
const sysexCustomLayout8 = [0x00, 0x03, 0x07, 0x00]

const sysexProgMode = [0x0E, 0x01]


// helper function to add the appropriate hex before and after each sysex msg
arg.wrapSysex = function(sysexCore) {
	sysexMsg = sysexHeader.concat(sysexCore, sysexFooter)
	return sysexMsg
}

// helper function to make sending sysex neater
arg.sendSysex = function(message) {
	midi.sendSysexMsg(message, message.length)
}


// static array of Launchpad Pro MK3 custom/programmer mode pad CCs in decimal, from bottom row to top, each two row channel block switched; ch1cc1 on 7th row
// const LPpads = [ 21, 22, 23, 24, 25, 26, 27, 28,
// 	11, 12, 13, 14, 15, 16, 17, 18,
// 	41, 42, 43, 44, 45, 46, 47, 48,
// 	31, 32, 33, 34, 35, 36, 37, 38,
// 	61, 62, 63, 64, 65, 66, 67, 68,
// 	51, 52, 53, 54, 55, 56, 57, 58,
// 	81, 82, 83, 84, 85, 86, 87, 88,
// 	71, 72, 73, 74, 75, 76, 77, 78 ]

const LPpads = [ 81, 82, 83, 84, 85, 86, 87, 88,
                 71, 72, 73, 74, 75, 76, 77, 78,
                 61, 62, 63, 64, 65, 66, 67, 68,
                 51, 52, 53, 54, 55, 56, 57, 58,
                 41, 42, 43, 44, 45, 46, 47, 48,
                 31, 32, 33, 34, 35, 36, 37, 38,
                 21, 22, 23, 24, 25, 26, 27, 28,
                 11, 12, 13, 14, 15, 16, 17, 18 ]

arg.init = function() {
	console.log("################################################################################################")
	console.log("################################################################################################")
	console.log("################################################################################################")

	arg.sendSysex(arg.wrapSysex(sysexProgMode))

	arg.deck = new components.ComponentContainer()

	for (let i = 1; i < 4; i++) {
		console.log("init : " + i)
		arg.deck[i] = new arg.Deck(i , i);
		arg.deck[i].setCurrentDeck("[Channel" + i + "]");
	}

	// arg.clearLEDs()
}


arg.Deck = function(deckNumber, midiChannel) {
  console.log("deck: " + deckNumber)
  console.log("midichannel: " + midChannel)

	components.Deck.call(this, deckNumber)
	this.hotcueButtons = new components.ComponentContainer()

	// cc, 1 to 16
	for (var i = 1; i <= 16; i++) {
		console.log("inner i: " + i)

    let padArrayIncice = ((midiChannel - 1) * 16) + i - 1

		// translate indice to LED CC (in the right order)
		let hotcueAddr = LPpads[padArrayIncice]

		console.log("padArrayIncice: " + padArrayIndice + ", hotcueAddr: " + hotcueAddr)

		this.hotcueButtons[i] = new components.HotcueButton({
			number: i,
			group: '[Channel' + midiChannel + ']',
			// 0x90 = solid on
			// midi: [0x90 + c - 1, n],
			midi: [0x90, hotcueAddr],
			// colors automatically assigned by Components.JS framework
			sendRGB: function (color_obj) {
				// example Message (hardcoded bytes are controller specific).
				// colors entries contain 8-bit values, but SysEx only supports 7-bit values
				// so were bitshifting by 1 to reduce the resolution.
				// var msg = [0x03, 0x03, LPpadsi, color_obj.red>>1,color_obj.green>>1,color_obj.blue>>1]
				var msg = [0x03, z, color_obj.red>>1,color_obj.green>>1,color_obj.blue>>1]
				print(arg.wrapSysex(msg))

				// var msg = [0x90, LPpadsi, color_obj.red>>1,color_obj.green>>1,color_obj.blue>>1]
				// send message

				print(msg)
			},
			off: 0x00
		})
	}
}


arg.Deck.prototype = new components.Deck()


arg.shutdown = function() {
	// arg.sendSysex(arg.wrapSysex(sysexCustomLayout7))
}

