# Sound Assets

Drop the following royalty-free `.mp3` files into this folder with these
exact filenames — `SoundManager.js` already references them:

| Filename               | Used for                          | Suggested length |
|-------------------------|------------------------------------|-------------------|
| `dice_roll.mp3`         | Dice roll SFX                      | 0.5–1s            |
| `token_move.mp3`        | Token hop/step SFX                 | 0.2–0.4s          |
| `capture.mp3`           | Capturing an opponent's token      | 0.5–1s            |
| `token_home.mp3`        | A token reaching the center        | 0.5–1s            |
| `win.mp3`               | Victory fanfare                    | 2–4s              |
| `button_tap.mp3`        | UI button taps                     | 0.1–0.2s          |
| `background_music.mp3`  | Looping background music           | 30s+ loop         |

## Where to get free assets

- [Pixabay Audio](https://pixabay.com/sound-effects/) — CC0, no attribution needed
- [Freesound.org](https://freesound.org/) — filter by CC0 license
- [Kenney.nl Game Assets](https://kenney.nl/assets?q=audio) — UI/game SFX packs, CC0

Until these files exist, the app runs fine — `SoundManager.js` catches the
missing-asset error and just logs a warning, so gameplay is unaffected.
