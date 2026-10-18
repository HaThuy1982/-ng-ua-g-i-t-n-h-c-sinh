// Web Audio API Synthesizer - 100% offline, zero external dependencies

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public musicEnabled: boolean = true;
  public bgmGainNode: GainNode | null = null;
  private isBgmPlaying: boolean = false;
  private bgmIntervalId: number | null = null;
  private nextNoteTime: number = 0;
  private currentStep: number = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.bgmGainNode = this.ctx.createGain();
        this.bgmGainNode.gain.setValueAtTime(0.22, this.ctx.currentTime);
        this.bgmGainNode.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /* =========================================================================
     DRAMATIC BACKGROUND MUSIC ENGINE (Offline procedural synthesis)
     Driving cinematic tempo: ~132 BPM with Kick, Bassline & Suspenseful Arp
     ========================================================================= */

  public startBgm() {
    if (!this.enabled || !this.musicEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.bgmGainNode) return;

    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    // Fade-in BGM volume smoothly
    this.bgmGainNode.gain.cancelScheduledValues(this.ctx.currentTime);
    this.bgmGainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.bgmGainNode.gain.linearRampToValueAtTime(0.22, this.ctx.currentTime + 0.3);

    // Lookahead scheduler
    const scheduleAheadTime = 0.15;
    const tempo = 132;
    const stepDuration = 60 / tempo / 4; // 16th note

    this.bgmIntervalId = window.setInterval(() => {
      if (!this.isBgmPlaying || !this.ctx) return;

      while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
        this.playMusicStep(this.nextNoteTime, this.currentStep);
        this.nextNoteTime += stepDuration;
        this.currentStep = (this.currentStep + 1) % 32; // 2-bar loop (32 sixteenths)
      }
    }, 25);
  }

  private playMusicStep(time: number, step: number) {
    if (!this.ctx || !this.bgmGainNode) return;

    // 1. Driving Kick Drum on quarter beats (steps 0, 4, 8, 12, 16, 20, 24, 28)
    if (step % 4 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.09);

      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

      osc.connect(gain);
      gain.connect(this.bgmGainNode);

      osc.start(time);
      osc.stop(time + 0.12);
    }

    // 2. High-energy Hat / Tick on offbeats and sixteenths
    if (step % 2 === 1 || step % 4 === 2) {
      const isAccent = step % 4 === 2;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(isAccent ? 3800 : 2600, time);

      gain.gain.setValueAtTime(isAccent ? 0.04 : 0.02, time);
      gain.gain.exponentialRampToValueAtTime(0.0005, time + 0.035);

      osc.connect(gain);
      gain.connect(this.bgmGainNode);

      osc.start(time);
      osc.stop(time + 0.04);
    }

    // 3. Cinematic Bassline (D minor progression: D -> F -> G -> A)
    // Note frequencies: D2=73.42, F2=87.31, G2=98.00, A2=110.00, C2=65.41
    const bassSequence = [
      73.42, 73.42, 146.83, 73.42, 73.42, 73.42, 146.83, 87.31,
      87.31, 87.31, 174.61, 87.31, 98.0,  98.0,  196.0,  110.0,
      73.42, 73.42, 146.83, 73.42, 73.42, 73.42, 146.83, 87.31,
      65.41, 65.41, 130.81, 65.41, 110.0, 110.0, 110.0, 123.47
    ];
    const bassFreq = bassSequence[step];

    if (bassFreq) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassFreq, time);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.002, time + 0.09);

      // Low pass filter for punchy modern warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500 + (step % 8) * 80, time);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGainNode);

      osc.start(time);
      osc.stop(time + 0.1);
    }

    // 4. Dramatic Suspense Arpeggio (driving syncopated notes in D minor)
    // D4=293.66, F4=349.23, A4=440, D5=587.33, E5=659.25, F5=698.46
    const arpNotes = [
      293.66, null, 349.23, null, 440.0, null, 587.33, null,
      349.23, 440.0, null, 587.33, 659.25, null, 698.46, 587.33,
      293.66, null, 349.23, null, 440.0, null, 587.33, null,
      587.33, 523.25, 440.0, 392.0, 440.0, null, 293.66, null
    ];
    const arFreq = arpNotes[step];

    if (arFreq) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(arFreq, time);

      gain.gain.setValueAtTime(0.06, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

      osc.connect(gain);
      gain.connect(this.bgmGainNode);

      osc.start(time);
      osc.stop(time + 0.09);
    }
  }

  public stopBgm(immediate = false) {
    if (!this.isBgmPlaying) return;
    this.isBgmPlaying = false;

    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }

    if (this.ctx && this.bgmGainNode) {
      if (immediate) {
        this.bgmGainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.bgmGainNode.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      } else {
        // Quick 150ms smooth fadeout
        this.bgmGainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.bgmGainNode.gain.setValueAtTime(this.bgmGainNode.gain.value, this.ctx.currentTime);
        this.bgmGainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);
      }
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled && this.isBgmPlaying) {
      this.stopBgm();
    }
  }

  /* =========================================================================
     SOUND EFFECTS
     ========================================================================= */

  public playBounce(pitchModifier = 1) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6
      const baseFreq = pentatonic[Math.floor(Math.random() * pentatonic.length)] * pitchModifier;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // Audio autoplay policy or device fallback
    }
  }

  public playBumper() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.19);
    } catch {
      // ignore
    }
  }

  public playBooster() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch {
      // ignore
    }
  }

  public playCountdown(isGo = false) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isGo ? 'sawtooth' : 'sine';
      const freq = isGo ? 880 : 440;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (isGo) {
        osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.25);
      }

      gain.gain.setValueAtTime(isGo ? 0.2 : 0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isGo ? 0.35 : 0.15));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + (isGo ? 0.36 : 0.16));
    } catch {
      // ignore
    }
  }

  public playTimerTick(isUrgent = false) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isUrgent ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isUrgent ? 880 : 660, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(isUrgent ? 440 : 330, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(isUrgent ? 0.12 : 0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {
      // ignore
    }
  }

  public playTimeoutBuzzer() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(160, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch {
      // ignore
    }
  }

  public playOvertake() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // ignore
    }
  }


  public playFanfare() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Royal fanfare notes: C5, E5, G5, C6 (chord arpeggio + triumphant climax)
      const notes = [
        { freq: 523.25, time: 0, duration: 0.12 },
        { freq: 659.25, time: 0.12, duration: 0.12 },
        { freq: 783.99, time: 0.24, duration: 0.15 },
        { freq: 1046.5, time: 0.40, duration: 0.6 }
      ];

      notes.forEach(({ freq, time, duration }) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + time);

        gain.gain.setValueAtTime(0.001, this.ctx!.currentTime + time);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx!.currentTime + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + time + duration);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + time);
        osc.stop(this.ctx!.currentTime + time + duration + 0.02);
      });
    } catch {
      // ignore
    }
  }

  public playFireworkBurst() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Noise-like pop/crackle for firework explosion
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const baseFreq = 220 + Math.random() * 120;
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.14);

      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // ignore
    }
  }
}

export const sound = new SoundEngine();
