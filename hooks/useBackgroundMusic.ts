import { useEffect, useRef } from 'react';
import { GameState } from '../types';

interface MusicProps {
  gameState: GameState;
  level: number;
  isEnabled: boolean;
}

const C4_FREQ = 261.63;
const FADE_TIME = 0.5;
const NOTE_DURATION = 0.25;
const MELODY_SEQUENCE = [0, 4, 7, 12, 7, 4, 0, -5]; // Cmaj7 arpeggio feel
const MASTER_VOLUME = 0.1;

const semitonesToFrequency = (baseFreq: number, semitones: number) => {
  return baseFreq * Math.pow(2, semitones / 12);
};

// A small gain envelope function to create distinct notes
const playNoteWithEnvelope = (
    context: AudioContext,
    oscillator: OscillatorNode,
    gainNode: GainNode,
    frequency: number,
    volume: number
) => {
    const now = context.currentTime;
    oscillator.frequency.setValueAtTime(frequency, now);

    // Attack-Decay envelope for a clean note
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now); // Start from current value
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + NOTE_DURATION * 0.95); // Decay
};


export const useBackgroundMusic = ({ gameState, level, isEnabled }: MusicProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  
  // Refs for each layer's oscillator and dedicated gain node
  const melodyLayer = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);
  const harmony3Layer = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);
  const harmony5Layer = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  const schedulerRef = useRef<number | null>(null);
  const noteIndexRef = useRef(0);

  useEffect(() => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;

      const masterGain = context.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(context.destination);
      mainGainRef.current = masterGain;
      
      const createLayer = (type: OscillatorType) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        gain.gain.value = 0; // Start silent
        osc.type = type;
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        return { osc, gain };
      };
      
      melodyLayer.current = createLayer('triangle');
      harmony3Layer.current = createLayer('sine');
      harmony5Layer.current = createLayer('sine');

    } catch (e) {
      console.error("Web Audio API is not supported.");
    }

    return () => {
      if (schedulerRef.current) clearInterval(schedulerRef.current);
      audioContextRef.current?.close().catch(e => console.error("Error closing AudioContext:", e));
    };
  }, []);

  useEffect(() => {
    const context = audioContextRef.current;
    const masterGain = mainGainRef.current;
    const melody = melodyLayer.current;
    const harmony3 = harmony3Layer.current;
    const harmony5 = harmony5Layer.current;

    if (schedulerRef.current !== null) {
      clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }

    if (!context || !masterGain || !melody || !harmony3 || !harmony5) return;

    const shouldPlay = gameState === 'playing' && isEnabled;

    if (shouldPlay) {
      if (context.state === 'suspended') context.resume();
      masterGain.gain.cancelScheduledValues(context.currentTime);
      masterGain.gain.linearRampToValueAtTime(MASTER_VOLUME, context.currentTime + FADE_TIME);
      
      noteIndexRef.current = 0;

      const scheduleNotes = () => {
        const levelShift = level - 1;
        const levelAdjustedBaseFreq = semitonesToFrequency(C4_FREQ, levelShift);
        
        const pingPongLength = MELODY_SEQUENCE.length * 2 - 2;
        const effectiveIndex = noteIndexRef.current % (pingPongLength || 1);
        const note = effectiveIndex < MELODY_SEQUENCE.length
            ? MELODY_SEQUENCE[effectiveIndex]
            : MELODY_SEQUENCE[pingPongLength - effectiveIndex];

        // Play Melody Note
        const melodyFreq = semitonesToFrequency(levelAdjustedBaseFreq, note);
        playNoteWithEnvelope(context, melody.osc, melody.gain, melodyFreq, 1.0);

        // Play Harmony 3 if applicable
        if (level >= 3) {
            const harmony3Freq = semitonesToFrequency(levelAdjustedBaseFreq, note + 4);
            playNoteWithEnvelope(context, harmony3.osc, harmony3.gain, harmony3Freq, 0.7);
        } else {
             harmony3.gain.gain.cancelScheduledValues(context.currentTime);
             harmony3.gain.gain.setValueAtTime(0, context.currentTime);
        }

        // Play Harmony 5 if applicable
        if (level >= 5) {
            const harmony5Freq = semitonesToFrequency(levelAdjustedBaseFreq, note + 7);
            playNoteWithEnvelope(context, harmony5.osc, harmony5.gain, harmony5Freq, 0.5);
        } else {
            harmony5.gain.gain.cancelScheduledValues(context.currentTime);
            harmony5.gain.gain.setValueAtTime(0, context.currentTime);
        }
        
        noteIndexRef.current++;
      };
      
      scheduleNotes(); // Play first note immediately
      schedulerRef.current = window.setInterval(scheduleNotes, NOTE_DURATION * 1000);

    } else {
      masterGain.gain.cancelScheduledValues(context.currentTime);
      masterGain.gain.linearRampToValueAtTime(0, context.currentTime + FADE_TIME);
    }
    
    return () => {
        if (schedulerRef.current !== null) {
            clearInterval(schedulerRef.current);
            schedulerRef.current = null;
        }
    };

  }, [gameState, level, isEnabled]);
};
