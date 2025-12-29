
// A simple synth for retro UI sounds without external assets

const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let ctx: AudioContext | null = null;

const getCtx = () => {
    if (!ctx) ctx = new AudioContextClass();
    return ctx;
};

export const playSound = (type: 'scan' | 'decode' | 'success' | 'click' | 'error' | 'analyze') => {
    try {
        const audio = getCtx();
        if (audio.state === 'suspended') audio.resume();

        const osc = audio.createOscillator();
        const gain = audio.createGain();
        
        osc.connect(gain);
        gain.connect(audio.destination);

        const now = audio.currentTime;

        if (type === 'scan') {
            // High pitch sweep
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'decode') {
            // Digital blip
            osc.type = 'square';
            osc.frequency.setValueAtTime(400 + Math.random() * 200, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'success') {
            // Harmonious chime
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(554, now + 0.1); // C#
            osc.frequency.setValueAtTime(659, now + 0.2); // E
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } else if (type === 'click') {
            // Soft click
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
            osc.start(now);
            osc.stop(now + 0.03);
        } else if (type === 'error') {
            // Low buzz
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'analyze') {
             // Computery processing sound
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.3);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }

    } catch (e) {
        // Audio might be blocked or failed, ignore
    }
};
