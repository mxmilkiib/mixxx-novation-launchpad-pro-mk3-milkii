#!/bin/bash

# First fix the engine.beginTimer calls
sed -i 's/engine\.beginTimer(ms, LaunchpadProMK3\.bpmFlash(\([^)]*\)))/engine.beginTimer(ms, function() { LaunchpadProMK3.bpmFlash(\1); })/g' /home/milk/.mixxx/controllers/LaunchpadProMK3.js

# Next add the rgb variable definition in the bpmFlash function
sed -i '/let dimRgb = LaunchpadProMK3\.darkenRGBColour(rgb)/i\  // Define rgb array with default colors (red)\n  let rgb = [127, 0, 0]; // Default to red if not specified' /home/milk/.mixxx/controllers/LaunchpadProMK3.js
