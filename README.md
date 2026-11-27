# Skyhawk Valley 3D

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/zebhyrus/best-flight-game-entry/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/zebhyrus/best-flight-game-entry/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

Skyhawk Valley 3D is a complete original flight game that runs offline in a desktop browser from static files. Fly the Skyhawk in real 3D over a green valley with a river, a road, fields, barns, snowy mountains and a lit runway. The world is built on vendored three.js, with a heightmap terrain, a built aircraft, golden target rings and a runway with approach lights.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No network request is made. You can also open `game/index.html` through any static server.

## Controls

Arrows steer (up and down pitch, left and right roll), W and S throttle, Shift or Space boost, Ctrl slow down, F flaps, C changes the view, P pause, M sound, N next mission after a mission complete. Mouse drag steers too. On touch devices on screen buttons appear for steering, pitch, boost and slow down.

## Missions and scoring

Mission 1 RING RUN: fly through 8 golden rings, 100 points each plus 25 per streak step. Mission 2 VALLEY LANDING: line up with the runway lights, flare, and settle gently, 500 points plus bonuses for a smooth touchdown, centreline and flare. Mission 3 STORM DODGE: fly the rings while storm clouds push the plane and damage the hull on contact. A mission complete adds a time bonus. Fuel drains with throttle and boost, gliding at low throttle saves it. Running out of fuel, hitting a mountain, or slamming into the ground ends the flight.

## Files

`game/index.html` boots the game. `game/src/` holds one file per job: `config.js` tuning, `random.js` seeded random, `terrain.js` valley generation, `aircraft.js` flight physics, `missions.js` missions and scoring, `audio.js` synthesised sound, `input.js` keyboard mouse and touch, `hud.js` instruments, `scene.js` the three.js world and cameras, `shots.js` deterministic screenshot scenes, `main.js` boot and loop. `main.ts` copies `game/` and `screenshots/` to the output and writes `dossier.json`.


<sub>Entered on [make.fun](https://make.fun/?ref=9srzvfjv&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
