type InstallStateListener = (canInstall: boolean, isStandalone: boolean) => void;

class PwaInstallService {
  private deferredPrompt: any = null;
  private listeners: Set<InstallStateListener> = new Set();
  public isStandalone = false;
  public isIOS = false;

  constructor() {
    if (typeof window === 'undefined') return;

    this.isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as any).standalone);

    this.isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' &&
        Boolean((navigator as any).maxTouchPoints && (navigator as any).maxTouchPoints > 1));

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.notify();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isStandalone = true;
      this.notify();
    });
  }

  public subscribe(listener: InstallStateListener): () => void {
    this.listeners.add(listener);
    listener(this.canInstall(), this.isStandalone);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const can = this.canInstall();
    this.listeners.forEach((fn) => fn(can, this.isStandalone));
  }

  public canInstall(): boolean {
    if (this.isStandalone) return false;
    // Su iOS non c'è beforeinstallprompt, ma si può sempre mostrare la guida per aggiungere alla Home
    if (this.isIOS) return true;
    return Boolean(this.deferredPrompt);
  }

  public async triggerInstall(): Promise<'accepted' | 'dismissed' | 'ios-guide'> {
    if (this.isIOS) {
      return 'ios-guide';
    }

    if (!this.deferredPrompt) {
      return 'dismissed';
    }

    try {
      this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.notify();
      return choice.outcome === 'accepted' ? 'accepted' : 'dismissed';
    } catch {
      return 'dismissed';
    }
  }
}

export const pwaInstallService = new PwaInstallService();
