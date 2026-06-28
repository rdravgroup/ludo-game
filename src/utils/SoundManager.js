// src/utils/SoundManager.js
import { Audio } from 'expo-av';

// NOTE: Drop matching .mp3 files into /assets/sounds/ with these exact
// names (see README "Assets" section). Until then, this manager fails
// silently (logs a warning) so the game remains fully playable without audio.
const SOUND_FILES = {
  diceRoll: require('../../assets/sounds/dice_roll.mp3'),
  tokenMove: require('../../assets/sounds/token_move.mp3'),
  capture: require('../../assets/sounds/capture.mp3'),
  tokenHome: require('../../assets/sounds/token_home.mp3'),
  win: require('../../assets/sounds/win.mp3'),
  buttonTap: require('../../assets/sounds/button_tap.mp3'),
};

const MUSIC_FILE = require('../../assets/sounds/background_music.mp3');

class SoundManagerClass {
  constructor() {
    this.sfxPlayers = {};
    this.musicPlayer = null;
    this.soundEnabled = true;
    this.musicEnabled = true;
    this.ready = false;
  }

  async init() {
    if (this.ready) return;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.ready = true;
    } catch (e) {
      console.warn('SoundManager init failed', e);
    }
  }

  setEnabled(soundEnabled, musicEnabled) {
    const musicWasOff = !this.musicEnabled;
    this.soundEnabled = soundEnabled;
    this.musicEnabled = musicEnabled;
    if (!musicEnabled) {
      this.stopMusic();
    } else if (musicEnabled && musicWasOff) {
      this.startMusic();
    }
  }

  async play(name) {
    if (!this.soundEnabled) return;
    try {
      const source = SOUND_FILES[name];
      if (!source) return;
      const { sound } = await Audio.Sound.createAsync(source);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) sound.unloadAsync();
      });
      await sound.playAsync();
    } catch (e) {
      // Asset likely missing during initial scaffold — non-fatal.
      console.warn(`Sound "${name}" failed to play`, e?.message);
    }
  }

  async startMusic() {
    if (!this.musicEnabled || this.musicPlayer) return;
    try {
      const { sound } = await Audio.Sound.createAsync(MUSIC_FILE, {
        isLooping: true,
        volume: 0.35,
      });
      this.musicPlayer = sound;
      await sound.playAsync();
    } catch (e) {
      console.warn('Background music failed to load', e?.message);
    }
  }

  async stopMusic() {
    if (this.musicPlayer) {
      try {
        await this.musicPlayer.stopAsync();
        await this.musicPlayer.unloadAsync();
      } catch (e) {
        // ignore
      }
      this.musicPlayer = null;
    }
  }
}

export const SoundManager = new SoundManagerClass();
