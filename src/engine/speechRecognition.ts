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
  private onSpeech: SpeechCallback;
  private onStatus: StatusCallback;
  private onVolume?: VolumeCallback;

  // Tracciamento per tagliare le parole già consumate nella stessa frase continua
  private activeResultIndex = 0;
  private consumedCharLength = 0;
  private latestRawTranscript = '';

  // Audio Meter (Web Audio API) per feedback visivo onde sonore
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private volumeRafId: number | null = null;

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
    const win = window as unknown as IWindowSpeech;
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  public start(deviceId?: string): void {
    const win = window as unknown as IWindowSpeech;
    const SpeechConstructor =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechConstructor) {
      this.onStatus(
        false,
        'Browser non supportato per il riconoscimento vocale (Usa Chrome, Edge o Brave).'
      );
      return;
    }

    this.shouldBeRunning = true;
    this.consumedCharLength = 0;
    this.activeResultIndex = 0;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignora
      }
    }

    const rec = new SpeechConstructor();
    rec.lang = 'it-IT';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 5;

    rec.onstart = () => {
      this.onStatus(true);
    };

    rec.onresult = (event: any) => {
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
        // Taglia la parte della frase continua già usata per la risposta precedente
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
        // Normale durante brevi silenzi, il watchdog in onend lo riavvia subito
        return;
      }
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        this.shouldBeRunning = false;
        this.onStatus(
          false,
          'Permesso microfono negato. Consenti il microfono nella barra degli indirizzi.'
        );
      } else {
        this.onStatus(true, `Avviso mic: ${err}`);
      }
    };

    rec.onend = () => {
      if (this.shouldBeRunning) {
        // Riavvio istantaneo continuo per non perdere neanche un decimo di secondo
        try {
          this.consumedCharLength = 0;
          rec.start();
        } catch {
          setTimeout(() => {
            if (this.shouldBeRunning) {
              try {
                rec.start();
              } catch {
                // Ignora
              }
            }
          }, 120);
        }
      } else {
        this.onStatus(false);
      }
    };

    this.recognition = rec;
    try {
      rec.start();
    } catch {
      // Se già attivo
    }

    if (this.onVolume) {
      this.startVolumeMeter(deviceId);
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
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignora
      }
      this.recognition = null;
    }
    this.stopVolumeMeter();
    this.onStatus(false);
  }

  private async startVolumeMeter(deviceId?: string): Promise<void> {
    try {
      this.stopVolumeMeter();
      const constraints: MediaStreamConstraints = {
        audio: deviceId
          ? { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true }
          : { echoCancellation: true, noiseSuppression: true },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.mediaStream = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      this.audioContext = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      this.analyser = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!this.analyser || !this.shouldBeRunning) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 65);
        this.onVolume?.(normalized);
        this.volumeRafId = requestAnimationFrame(updateVolume);
      };
      this.volumeRafId = requestAnimationFrame(updateVolume);
    } catch {
      // Il meter visivo è opzionale
    }
  }

  private stopVolumeMeter(): void {
    if (this.volumeRafId !== null) {
      cancelAnimationFrame(this.volumeRafId);
      this.volumeRafId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
  }
}
