import { describe, expect, it, vi } from "vitest";
import {
  distinctVisitorAlertKinds,
  playVisitorAlertSound,
  VISITOR_ALERT_SOUND_URL,
} from "../client/src/lib/dashboard-audio";

describe("dashboard visitor alert audio", () => {
  it("uses the uploaded visitor alert MP3", () => {
    expect(VISITOR_ALERT_SOUND_URL).toBe(
      "/manus-storage/zioan.UYgBxW_0493b2d7.mp3",
    );
  });

  it("deduplicates simultaneous alert kinds", () => {
    expect(
      distinctVisitorAlertKinds(["checkout", "otp", "checkout", "confirmation"]),
    ).toEqual(["checkout", "otp", "confirmation"]);
  });

  it("configures and plays the supplied sound without throwing on autoplay rejection", async () => {
    const play = vi.fn(() => Promise.reject(new Error("autoplay blocked")));
    const audio = { preload: "", volume: 0, play };

    playVisitorAlertSound(() => audio);

    expect(audio.preload).toBe("auto");
    expect(audio.volume).toBe(0.85);
    expect(play).toHaveBeenCalledOnce();
    await Promise.resolve();
  });
});
