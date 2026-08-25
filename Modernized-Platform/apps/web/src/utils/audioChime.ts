// Synthesized pleasant notification chimes via Web Audio API (Zero external assets needed)

class NotificationAudio {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Play subtle bell chime for proposals and messages
  public playChime(type: 'proposal' | 'message' | 'match' | 'success' | 'alert' = 'proposal') {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);

      if (type === 'proposal' || type === 'match') {
        // Double harmonic chime (E5 -> B5 -> E6)
        this.playTone(ctx, gainNode, 659.25, now, 0.28, 0.12);
        this.playTone(ctx, gainNode, 987.77, now + 0.12, 0.35, 0.14);
        this.playTone(ctx, gainNode, 1318.51, now + 0.24, 0.45, 0.10);
      } else if (type === 'message') {
        // Soft pop bubble chime (F#5 -> C#6)
        this.playTone(ctx, gainNode, 739.99, now, 0.18, 0.12);
        this.playTone(ctx, gainNode, 1108.73, now + 0.08, 0.30, 0.12);
      } else if (type === 'alert') {
        // Subtle soft notice
        this.playTone(ctx, gainNode, 440, now, 0.20, 0.08);
      } else {
        // Success single chime
        this.playTone(ctx, gainNode, 880, now, 0.25, 0.10);
      }
    } catch {
      // Audio playback silently guarded
    }
  }

  private playTone(
    ctx: AudioContext, 
    masterGain: GainNode, 
    freq: number, 
    startTime: number, 
    duration: number, 
    peakVolume: number
  ) {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    // Smooth envelope attack and exponential decay
    noteGain.gain.setValueAtTime(0.001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(peakVolume, startTime + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

export const notificationAudio = new NotificationAudio();
