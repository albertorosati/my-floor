type SpeechCallback = (alternatives: string[], isFinal: boolean) => void;
type StatusCallback = (isListening: boolean, error?: string) => void;
type VolumeCallback = (level: number) => void;

interface IWindowSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export class SmartSpeechRecognizer {
  private recognition: any = null;
  private shouldBeRunning = false;
  private isListening = false;
  private onSpeech: SpeechCallback;
  private onStatus: StatusCallback;
  private onVolume?: VolumeCallback;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private volumeDecayTimer: ReturnType<typeof setTimeout> | null = null;

  // Tracciamento per tagliare le parole già consumate nella stessa frase continua
  private activeResultIndex = 0;
  private consumedCharLength = 0;
  private latestRawTranscript = '';

  constructor(
    onSpeech: SpeechCallback,
    onStatus: StatusCallback,
    onVolume?: VolumeCallback
  ) {
    this.onSpeech = onSpeech;
    this.onStatus = onStatus;
    this.onVolume = onVolume;
  }

  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as IWindowSpeech;
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  public start(): void {
    this.shouldBeRunning = true;
    this.consumedCharLength = 0;
    this.activeResultIndex = 0;
    this.createAndStartSession();
  }

  private createAndStartSession(): void {
    if (!this.shouldBeRunning) return;
    if (typeof window === 'undefined') return;

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch {
        // Ignora
      }
      this.recognition = null;
    }

    const win = window as unknown as IWindowSpeech;
    const SpeechConstructor =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechConstructor) {
      this.onStatus(
        false,
        'Riconoscimento vocale non supportato da questo browser (Usa Chrome, Safari o Edge).'
      );
      return;
    }

    try {
      const rec = new SpeechConstructor();
      rec.lang = 'it-IT';

      // Su iOS Safari il flag continuous: true provoca spesso l'abort immediato dell'audio engine
      const isIOS =
        typeof navigator !== 'undefined' &&
        (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' &&
            Boolean((navigator as any).maxTouchPoints && (navigator as any).maxTouchPoints > 1)));

      rec.continuous = !isIOS;
      rec.interimResults = true;
      rec.maxAlternatives = 5;

      rec.onstart = () => {
        this.isListening = true;
        this.onStatus(true);
      };

      rec.onspeechstart = () => {
        this.pulseVolume(0.8);
      };

      rec.onspeechend = () => {
        this.pulseVolume(0);
      };

      rec.onresult = (event: any) => {
        this.pulseVolume(1.0);
        const idx = event.resultIndex;
        const result = event.results[idx];
        if (!result) return;

        if (idx !== this.activeResultIndex) {
          this.activeResultIndex = idx;
          this.consumedCharLength = 0;
        }

        const alternatives: string[] = [];
        for (let i = 0; i < result.length; i++) {
          const fullTranscript: string = result[i].transcript || '';
          if (i === 0) {
            this.latestRawTranscript = fullTranscript;
          }
          const sliced =
            this.consumedCharLength > 0 &&
            fullTranscript.length >= this.consumedCharLength
              ? fullTranscript.slice(this.consumedCharLength).trim()
              : fullTranscript.trim();

          if (sliced.length > 0) {
            alternatives.push(sliced);
          }
        }

        if (alternatives.length > 0) {
          this.onSpeech(alternatives, Boolean(result.isFinal));
        }

        if (result.isFinal) {
          this.consumedCharLength = 0;
        }
      };

      rec.onerror = (event: any) => {
        const err = event?.error;
        if (err === 'no-speech' || err === 'aborted') {
          // Normale durante brevi silenzi, non bloccare il loop
          return;
        }
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          this.shouldBeRunning = false;
          this.isListening = false;
          this.onStatus(
            false,
            'Permesso microfono negato. Tocca l’icona del lucchetto nella barra per abilitarlo.'
          );
        } else {
          this.onStatus(this.isListening, `Avviso mic: ${err}`);
        }
      };

      rec.onend = () => {
        this.isListening = false;
        if (this.shouldBeRunning) {
          this.consumedCharLength = 0;
          // Ricrea una NUOVA istanza fresca (evita InvalidStateError su Chrome/Safari dopo il primo stop)
          this.restartTimer = setTimeout(() => {
            if (this.shouldBeRunning) {
              this.createAndStartSession();
            }
          }, 80);
        } else {
          this.onStatus(false);
        }
      };

      this.recognition = rec;
      rec.start();
    } catch {
      if (this.shouldBeRunning) {
        this.restartTimer = setTimeout(() => {
          if (this.shouldBeRunning) {
            this.createAndStartSession();
          }
        }, 300);
      }
    }
  }

  private pulseVolume(target: number): void {
    if (!this.onVolume) return;
    this.onVolume(target);
    if (this.volumeDecayTimer) {
      clearTimeout(this.volumeDecayTimer);
    }
    if (target > 0) {
      this.volumeDecayTimer = setTimeout(() => {
        this.onVolume?.(0);
      }, 450);
    }
  }

  /**
   * Segna il testo parlato finora come "già consumato" (appena qualcuno indovina o passa),
   * così che le parole appena pronunciate non vengano rianalizzate sulla nuova immagine!
   */
  public consumeCurrentBuffer(): void {
    this.consumedCharLength = this.latestRawTranscript.length;
  }

  public stop(): void {
    this.shouldBeRunning = false;
    this.isListening = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.volumeDecayTimer) {
      clearTimeout(this.volumeDecayTimer);
      this.volumeDecayTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch {
        // Ignora
      }
      this.recognition = null;
    }
    this.onStatus(false);
  }
}
