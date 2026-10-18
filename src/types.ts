export interface Student {
  id: string;
  name: string;
  color: string;
  secondaryColor: string;
}

export interface Marble {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  secondaryColor: string;
  rank?: number;
  finishTime?: number;
  finishReason?: 'finish_line' | 'timeout';
  glow: number;
  highlightTimer: number;
  stuckTimer: number;
}

export interface Peg {
  x: number;
  y: number;
  radius: number;
  glow: number;
  type?: 'regular' | 'gold' | 'bumper' | 'neon';
}

export interface Spinner {
  x: number;
  y: number;
  radius: number;
  angle: number;
  angularSpeed: number;
  arms: number;
  length: number;
  color?: string;
}

export interface Bumper {
  x: number;
  y: number;
  radius: number;
  glow: number;
  power: number;
  color?: string;
}

export interface SpeedBooster {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 'down' | 'left' | 'right';
  multiplier: number;
  glow?: number;
}

export interface Ramp {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  color: string;
}

export type RaceState = 'idle' | 'countdown' | 'racing' | 'finished';

