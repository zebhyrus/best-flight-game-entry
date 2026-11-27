# Zephyr Valley 3D

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/zebhyrus/best-flight-game-entry/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/zebhyrus/best-flight-game-entry/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

Zephyr Valley 3D is a complete original flight game that runs offline in a desktop browser from static files. Fly the Zephyr in real 3D over a green valley with a river gorge, a bridge, a small village beside a lit airstrip, fields, barns, snowy mountains and golden target rings. The world is built on vendored three.js, with a heightmap terrain, a built aircraft, golden target rings with a light beam on the next one, and a runway with approach lights.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No network request is made. You can also open `game/index.html` through any static server.

## Controls

Arrows steer (up and down pitch, left and right roll), W and S throttle, Shift or Space boost, Ctrl slow down, F flaps, C changes the view, P pause, M sound, N next mission after a mission complete. Mouse drag steers too. On touch devices buttons appear for steering, pitch, boost and slow down. Boost widens the view and swells the wind sound.

## Missions and scoring

Four mission types come in a shuffled order, so each cycle feels fresh. RING RUN: fly through 8 golden rings, 100 points each plus 25 per streak step. VALLEY LANDING: line up with the runway lights at Meridian Airstrip, flare, and settle gently, 500 points plus bonuses for a smooth touchdown, centreline and flare, with dust on touchdown. STORM DODGE: fly the rings while storm clouds push the plane and damage the hull on contact. GORGE SLALOM: fly 10 gates through Zephyr Gorge against a 95 second clock, 100 points per gate plus a time bonus. A mission complete adds a time bonus. Fuel now drains fast enough to bind: a full tank lasts about 75 seconds at cruise, so throttle discipline and short boost bursts decide whether a long sortie ends at the airstrip or in the fields. A low fuel warning flashes on the HUD and beeps. Running out of fuel, hitting a mountain, or slamming into the ground ends the flight.

## Tested in v2.3

Played in headless Chrome for Testing: all four mission types completed, Ring Run 8 of 8 rings in 35 seconds, Valley Landing graded SMOOTH LANDING in 66 seconds with dust on touchdown, Storm Dodge 8 of 8 rings in 35 seconds, Gorge Slalom 10 of 10 gates in 29 seconds. Low fuel warning, boost view kick and mission order shuffle all checked. The look takes its cue from strong feed entries: big easy to read rings, a volcano landmark, warm bright colours and a yellow high wing plane that stays clear in frame.

## Files

`game/index.html` boots the game. `game/src/` holds one file per job: `config.js` tuning, `random.js` seeded random, `terrain.js` valley generation, `aircraft.js` flight physics, `missions.js` missions and scoring, `audio.js` synthesised sound, `input.js` keyboard mouse and touch, `hud.js` instruments, `scene.js` the three.js world and cameras, `shots.js` deterministic screenshot scenes, `main.js` boot and loop. `main.ts` copies `game/` and `screenshots/` to the output and writes `dossier.json`.

<sub>Entered on [make.fun](https://make.fun/?ref=9srzvfjv&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
