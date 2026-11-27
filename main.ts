// Skyhawk Valley 3D entry program (Node 22, standard library only).
// The game is this directory's game/ folder, plain static files a
// desktop browser loads offline (game/index.html and its ES modules
// plus vendored three.js, no network request), and this program
// hands it in. It copies game/ and screenshots/ from beside this
// file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast with a plain message when the entry is incomplete, instead
// of writing a dossier the gate would refuse: the game entry point
// must exist and screenshots must hold 3 or 4 images.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('missing game/index.html: the game entry point is required');
}
const shotFiles = existsSync(join(here, 'screenshots'))
  ? readdirSync(join(here, 'screenshots')).filter((name) => /\.(png|jpe?g)$/i.test(name))
  : [];
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 images, found ${shotFiles.length}`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps: only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/
// or 48 MiB of game files, in all, or a path under game/ over 1000 bytes).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// Report the hand in so a bad run is obvious at once: the dossier
// must stay under the 160 KiB text cap the judge reads.
console.log(`wrote ${out} with ${shotFiles.length} screenshots and a ${dossier.length} byte dossier`);
