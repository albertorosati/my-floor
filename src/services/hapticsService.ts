class HapticsService {
  public enabled = true;

  private isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  private vibrate(pattern: number | number[]): void {
    if (!this.enabled || !this.isSupported()) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignora se non consentito dal browser
    }
  }

  public vibrateCorrect(): void {
    this.vibrate(45);
  }

  public vibratePass(): void {
    this.vibrate([60, 40, 60]);
  }

  public vibrateUrgentTick(): void {
    this.vibrate(25);
  }

  public vibrateVictory(): void {
    this.vibrate([80, 40, 80, 40, 160]);
  }

  public vibrateTap(): void {
    this.vibrate(12);
  }
}

export const hapticsService = new HapticsService();
