import Phaser from "phaser";
import type { PlayerIntent } from "./PlayerIntent";

export class KeyboardInput {
  private keyW: Phaser.Input.Keyboard.Key;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyS: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyShift: Phaser.Input.Keyboard.Key;
  private key1: Phaser.Input.Keyboard.Key;
  private key2: Phaser.Input.Keyboard.Key;
  private key3: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.keyW = kb.addKey("W");
    this.keyA = kb.addKey("A");
    this.keyS = kb.addKey("S");
    this.keyD = kb.addKey("D");
    this.cursors = kb.createCursorKeys();
    this.keyShift = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.key1 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.key3 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
  }

  read(): PlayerIntent {
    const up = this.keyW.isDown || this.cursors.up?.isDown;
    const down = this.keyS.isDown || this.cursors.down?.isDown;
    const left = this.keyA.isDown || this.cursors.left?.isDown;
    const right = this.keyD.isDown || this.cursors.right?.isDown;

    return {
      moveX: (left ? -1 : 0) + (right ? 1 : 0),
      moveY: (up ? -1 : 0) + (down ? 1 : 0),
      sneak: this.keyShift.isDown,
      dropTreat: Phaser.Input.Keyboard.JustDown(this.key1),
      squirrelCall: Phaser.Input.Keyboard.JustDown(this.key2),
      dropTurtle: Phaser.Input.Keyboard.JustDown(this.key3),
    };
  }
}
