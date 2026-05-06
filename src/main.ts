import Phaser from "phaser";
import { GAME_W, GAME_H } from "./config";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { LevelScene } from "./scenes/LevelScene";
import { GameOverScene } from "./scenes/GameOverScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_W,
  height: GAME_H,
  backgroundColor: "#000000",
  physics: { default: "arcade", arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, TitleScene, LevelScene, GameOverScene],
});
