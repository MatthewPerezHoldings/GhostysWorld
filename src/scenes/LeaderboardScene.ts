import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";
import { fetchTop, submitScore, type LeaderboardEntry } from "../score/globalScores";

export class LeaderboardScene extends Phaser.Scene {
  private name = "";
  private nameText!: Phaser.GameObjects.Text;
  private listText!: Phaser.GameObjects.Text;
  private status: "entering" | "submitting" | "viewing" = "entering";
  private finalScore = 0;

  constructor() { super("Leaderboard"); }

  create(data: { totalScore?: number }) {
    this.finalScore = data.totalScore ?? 0;
    this.add.text(GAME_W / 2, 60, "YOU WIN", { fontFamily: "monospace", fontSize: "40px", color: "#ffff66" }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 110, `Score: ${this.finalScore}`, { fontFamily: "monospace", fontSize: "20px", color: "#ffffff" }).setOrigin(0.5);

    this.add.text(GAME_W / 2, 160, "Enter name (a-z, max 16):", { fontFamily: "monospace", fontSize: "16px", color: "#aaaaaa" }).setOrigin(0.5);
    this.nameText = this.add.text(GAME_W / 2, 190, "_", { fontFamily: "monospace", fontSize: "28px", color: "#ffffff" }).setOrigin(0.5);

    this.listText = this.add.text(GAME_W / 2, 250, "loading…", { fontFamily: "monospace", fontSize: "16px", color: "#cccccc", align: "center" }).setOrigin(0.5, 0);

    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => this.onKey(e));

    fetchTop().then((entries) => this.renderList(entries));
  }

  private onKey(e: KeyboardEvent) {
    if (this.status !== "entering") return;
    if (e.key === "Enter" && this.name.length > 0) {
      this.status = "submitting";
      this.nameText.setText(this.name + " (submitting…)");
      submitScore(this.name, this.finalScore).then((entries) => {
        this.status = "viewing";
        this.nameText.setText(this.name);
        this.renderList(entries);
        this.add.text(GAME_W / 2, GAME_H - 30, "Press SPACE for title", {
          fontFamily: "monospace", fontSize: "14px", color: "#888888",
        }).setOrigin(0.5);
        this.input.keyboard?.once("keydown-SPACE", () => this.scene.start("Title"));
      });
      return;
    }
    if (e.key === "Backspace") {
      this.name = this.name.slice(0, -1);
    } else if (/^[a-zA-Z0-9]$/.test(e.key) && this.name.length < 16) {
      this.name += e.key.toUpperCase();
    }
    this.nameText.setText(this.name + (this.name.length < 16 ? "_" : ""));
  }

  private renderList(entries: LeaderboardEntry[]) {
    if (entries.length === 0) {
      this.listText.setText("(no scores yet)");
      return;
    }
    const lines = entries.map((e, i) => `${(i + 1).toString().padStart(2, " ")}. ${e.name.padEnd(16, " ")} ${e.score}`);
    this.listText.setText(lines.join("\n"));
  }
}
