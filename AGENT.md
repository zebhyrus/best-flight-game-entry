# Skyhawk Valley — AGENT.md

## What was built

Skyhawk Valley, a complete original 3D chase view flight game in pure
Canvas 2D, no libraries, no network requests, no audio files. The
Skyhawk flies over a seeded green valley with a river, a road, crop
fields, barns, trees, snowy mountains, drifting clouds and a lit
runway. The HUD shows altitude, speed, heading with compass point,
score, mission, fuel, hull, throttle and an artificial horizon dial.

## Controls

Arrows steer (up and down pitch, left and right roll), W and S
throttle, Shift or Space boost, Ctrl slow down, P pause, M sound,
N next mission after a mission complete. Mouse drag steers. On touch
devices on screen buttons appear for steering, pitch, boost and slow.

## Missions and scoring

Three mission types rotate as levels advance. RING RUN: fly through
8 golden rings, 100 points each plus 25 per streak step. VALLEY
LANDING: line up with the runway lights and settle gently, 500
points plus 250 for a smooth touchdown. STORM DODGE: fly the rings
while storm clouds damage the hull on contact. Mission complete adds
a time bonus. Fuel drains with throttle and boost. Stall below 58 KT
sinks the plane. Mountains, storms and hard ground impacts damage
the hull. Running out of fuel, hitting a mountain, or slamming into
the ground ends the flight. Best score is kept in local storage.

## Sound

All synthesised with WebAudio: engine hum that follows throttle and
speed, ring chime, storm buzz, landing thud, crash noise. M toggles.

## How it was tested

Served with `node serve.ts --port 8123` and driven in headless
Chrome for Testing (159.0.8154.6) over CDP with a small Node script
(`/tmp/cdp-shot.js`, not part of the entry): each `?shot=` page
reported `window.__shotReady === true` with zero console exceptions
and zero external network requests. The plain `--screenshot` flag
fired before the first paint, so CDP was used instead. The autopilot
in `shots.js` was fixed twice from what the screenshots showed:
first a heading sign error that made the plane spiral, then ring
capture and spacing so it passes rings (play shot: 5 of 8, streak 5,
score 750). A live play test (`/tmp/cdp-play.js`) pressed Space to
start, held ArrowLeft for 1.5 s, and confirmed the status line read
"Playing. Fly the rings.", heading turned left to 273 W, speed 163
KT, fuel draining, no exceptions.

Screenshot commands (Chrome CDP on port 9222, server on 8123):

```
node /tmp/cdp-shot.js "http://127.0.0.1:8123/?shot=start&seed=1" /tmp/shot-start-8.png
node /tmp/cdp-shot.js "http://127.0.0.1:8123/?shot=play&seed=1" /tmp/shot-play-7.png
node /tmp/cdp-shot.js "http://127.0.0.1:8123/?shot=mission&seed=1" /tmp/shot-mission-7.png
node /tmp/cdp-shot.js "http://127.0.0.1:8123/?shot=end&seed=1" /tmp/shot-end-7.png
```

PNGs were converted to JPEG quality 88 into `screenshots/`.
`main.ts` was run twice into separate dirs and `diff -r` confirmed
both runs write identical bytes; dossier sha256
97bdb92003d93db9faec5d91321dcc58ab49caae3b4924c33b2fd59ffb75573a.

## File list with sizes

- LICENSE 1095
- README.md 2889
- main.ts 2414 (written, run, then revised with a fail fast validation)
- serve.ts 2446
- package.json 160
- vendor/makefun-game.ts 56282 (kit copy, unchanged, verified by diff)
- game/index.html 1790
- game/src/config.js 1074
- game/src/random.js 792
- game/src/terrain.js 3516
- game/src/aircraft.js 4072
- game/src/missions.js 5585
- game/src/audio.js 3503
- game/src/input.js 3747
- game/src/hud.js 6196
- game/src/render.js 16038
- game/src/shots.js 3161
- game/src/main.js 7285 (written, tested in headless Chrome, then revised)
- screenshots/1-start.jpg 84630 (1280x800, title screen)
- screenshots/2-play.jpg 89248 (1280x800, ring run mid flight)
- screenshots/3-mission.jpg 91032 (1280x800, landing approach)
- screenshots/4-end.jpg 78920 (1280x800, mission complete)
