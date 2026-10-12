export const VISITOR_ALERT_SOUND_URL =
  "/manus-storage/zioan.UYgBxW_0493b2d7.mp3";

export type VisitorAlertAudio = {
  preload: string;
  volume: number;
  play: () => Promise<unknown>;
};

export function playVisitorAlertSound(
  createAudio: () => VisitorAlertAudio,
): void {
  try {
    const audio = createAudio();
    audio.preload = "auto";
    audio.volume = 0.85;
    void audio.play().catch(() => {
      // Browsers may block autoplay until the admin interacts with the page.
    });
  } catch {
    // Ignore audio playback failures.
  }
}

export function distinctVisitorAlertKinds<T extends string>(
  kinds: readonly T[],
): T[] {
  return Array.from(new Set(kinds));
}
