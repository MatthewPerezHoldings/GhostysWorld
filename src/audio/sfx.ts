import Phaser from "phaser";

export type SfxKey = "bark" | "toot" | "chime" | "dig" | "treat" | "alert" | "step" | "win-game";

const FILES: Record<SfxKey, string> = {
  bark: "/assets/audio/bark.mp3",
  toot: "/assets/audio/toot.mp3",
  chime: "/assets/audio/chime.mp3",
  dig: "/assets/audio/dig.mp3",
  treat: "/assets/audio/treat-eat.mp3",
  alert: "/assets/audio/alert.mp3",
  step: "/assets/audio/step.mp3",
  "win-game": "/assets/audio/win-game.mp3",
};

export function preloadSfx(scene: Phaser.Scene) {
  for (const [k, path] of Object.entries(FILES)) {
    scene.load.audio(`sfx-${k}`, path);
  }
}

export function play(scene: Phaser.Scene, key: SfxKey, volume = 0.6) {
  if (!scene.sound) return;
  const cacheKey = `sfx-${key}`;
  if (!scene.cache.audio.exists(cacheKey)) return;
  try {
    scene.sound.play(cacheKey, { volume });
  } catch {
    // Asset failed to decode; ignore so gameplay continues.
  }
}
