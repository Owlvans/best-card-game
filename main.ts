// A working best-game-01 entry (Node 22, standard library only): the game is this directory's
// game/ folder, plain static files a desktop browser loads offline (game/index.html and its ES
// modules, no library and no network request), and the program hands it in. It copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library. A starting point, not a winner: Block Dodger, a
// plain 2D canvas game where a paddle dodges falling blocks and catches coins, with a title screen,
// score, lives and levels, game over and restart, flat colours and no sound. Build your own game
// (any genre, any library you vendor under game/, or none), put your 3 or 4 PNG or JPEG screenshots
// in screenshots/ (the first by name is the cover) and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';
import { readdirSync, statSync } from 'node:fs';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
function emberfallValidateSourceTree(rootDir) {
  const gameIndexPath = join(rootDir, 'game', 'index.html');
  if (!existsSync(gameIndexPath)) {
    throw new Error('Emberfall hand-in is incomplete: game/index.html is missing');
  }
  const shotsDir = join(rootDir, 'screenshots');
  const shotNames = existsSync(shotsDir) ? readdirSync(shotsDir) : [];
  const imageNames = shotNames.filter((name) => /\.(png|jpe?g)$/i.test(name));
  if (imageNames.length < 3) {
    throw new Error('Emberfall needs at least 3 screenshots, found ' + imageNames.length);
  }
  return imageNames.length;
}
function emberfallPrintManifest(outputDir) {
  const folderNames = ['game', 'screenshots'];
  for (const folderName of folderNames) {
    const tally = emberfallCountFolder(join(outputDir, folderName));
    console.log('emberfall manifest ' + folderName + ': ' + tally.fileCount + ' files, ' + tally.totalBytes + ' bytes');
  }
  const dossierStat = statSync(join(outputDir, 'dossier.json'));
  console.log('emberfall manifest dossier.json: 1 file, ' + dossierStat.size + ' bytes');
}
function emberfallCountFolder(folderPath) {
  let fileCount = 0;
  let totalBytes = 0;
  for (const entryName of readdirSync(folderPath)) {
    const entryPath = join(folderPath, entryName);
    const entryStat = statSync(entryPath);
    if (entryStat.isDirectory()) {
      const nested = emberfallCountFolder(entryPath);
      fileCount += nested.fileCount;
      totalBytes += nested.totalBytes;
    } else {
      fileCount += 1;
      totalBytes += entryStat.size;
    }
  }
  return { fileCount, totalBytes };
}

const emberfallShotCount = emberfallValidateSourceTree(here);
mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
console.log('emberfall validated screenshots: ' + emberfallShotCount);
emberfallPrintManifest(out);
