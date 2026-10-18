import React, { useRef, useEffect, useCallback } from 'react';
import { Marble, Peg, Bumper, Spinner, SpeedBooster, Ramp, RaceState } from '../types';
import { sound } from '../utils/audio';

interface FireworkParticle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  gravity: number;
  friction: number;
  sparkle: boolean;
}

interface FireworkRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  growthRate: number;
}

const FIREWORK_PALETTES = [
  ['#ffd700', '#ffeb3b', '#ff9800', '#ffffff'], // Royal Gold & Amber
  ['#ff1744', '#f50057', '#ff80ab', '#ffffff'], // Radiant Ruby
  ['#00e5ff', '#1de9b6', '#00b0ff', '#ffffff'], // Electric Cyan
  ['#d500f9', '#7c4dff', '#e040fb', '#ffffff'], // Majestic Purple
  ['#00e676', '#76ff03', '#b2ff59', '#ffffff'], // Emerald Jade
];

interface TrackCanvasProps {
  marbles: Marble[];
  setMarbles: React.Dispatch<React.SetStateAction<Marble[]>>;
  raceState: RaceState;
  speedMultiplier: number;
  targetDuration: number;
  onFinish: (winner: Marble) => void;
  countdownValue: number;
}

const VIRTUAL_WIDTH = 1200;
const VIRTUAL_HEIGHT = 760;
const FINISH_LINE_Y = 675;
const GATE_Y = 125;

export const TrackCanvas: React.FC<TrackCanvasProps> = ({
  marbles,
  setMarbles,
  raceState,
  speedMultiplier,
  targetDuration,
  onFinish,
  countdownValue,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Obstacles refs (6 Spinners, 10 Bumpers, 4 Deflector Ramps, 4 Speed Boosters, 11 Peg Rows)
  const pegsRef = useRef<Peg[]>([]);
  const bumpersRef = useRef<Bumper[]>([]);
  const spinnersRef = useRef<Spinner[]>([]);
  const rampsRef = useRef<Ramp[]>([]);
  const boostersRef = useRef<SpeedBooster[]>([]);
  const winnerDetectedRef = useRef<boolean>(false);

  // Suspense & overtake tracking refs
  const lastLeaderIdRef = useRef<string | null>(null);
  const overtakeAlertRef = useRef<{ name: string; timer: number } | null>(null);

  // Race timing refs
  const raceStartTimeRef = useRef<number>(0);
  const lastTickSecRef = useRef<number>(-1);

  // Fireworks particle system refs
  const fireworkParticlesRef = useRef<FireworkParticle[]>([]);
  const fireworkRingsRef = useRef<FireworkRing[]>([]);
  const lastFireworkBurstTimeRef = useRef<number>(0);

  // Screen shake ref and trigger
  const shakeIntensityRef = useRef<number>(0);
  const addScreenShake = useCallback((amount: number) => {
    shakeIntensityRef.current = Math.min(10, Math.max(shakeIntensityRef.current, amount));
  }, []);

  // Initialize rich track obstacles with high-drama obstacles and balanced distribution
  const initObstacles = useCallback(() => {
    const pegs: Peg[] = [];
    const bumpers: Bumper[] = [];
    const spinners: Spinner[] = [];
    const ramps: Ramp[] = [];
    const boosters: SpeedBooster[] = [];

    // 1. 11 High-Bounciness Bumper Obstacles
    bumpers.push(
      // Upper flanks
      { x: 180, y: 225, radius: 24, glow: 0, power: 9.0, color: '#00e5ff' },
      { x: 1020, y: 225, radius: 24, glow: 0, power: 9.0, color: '#00e5ff' },
      // Upper inner gates
      { x: 440, y: 240, radius: 24, glow: 0, power: 8.5, color: '#ffd700' },
      { x: 760, y: 240, radius: 24, glow: 0, power: 8.5, color: '#ffd700' },
      // Mid flanks
      { x: 175, y: 385, radius: 25, glow: 0, power: 9.0, color: '#e040fb' },
      { x: 1025, y: 385, radius: 25, glow: 0, power: 9.0, color: '#e040fb' },
      // Lower inner gates
      { x: 270, y: 545, radius: 25, glow: 0, power: 8.5, color: '#00e676' },
      { x: 930, y: 545, radius: 25, glow: 0, power: 8.5, color: '#00e676' },
      // Central Red Challenge Bumper (dramatic turnaround before finish)
      { x: 600, y: 520, radius: 25, glow: 0, power: 9.2, color: '#ff1744' },
      // Super Launch Bumpers above finish line
      { x: 485, y: 585, radius: 26, glow: 0, power: 9.5, color: '#ff9100' },
      { x: 715, y: 585, radius: 26, glow: 0, power: 9.5, color: '#ff9100' }
    );

    // 2. 6 Dynamic Rotating Spinners (Tier 1 & Tier 2)
    spinners.push(
      // Row 1 (y ~ 300)
      { x: 270, y: 305, radius: 10, angle: 0, angularSpeed: 0.045, arms: 4, length: 42, color: '#00e5ff' },
      { x: 600, y: 295, radius: 12, angle: Math.PI / 4, angularSpeed: -0.05, arms: 4, length: 45, color: '#ffd700' },
      { x: 930, y: 305, radius: 10, angle: 0, angularSpeed: 0.045, arms: 4, length: 42, color: '#00e5ff' },
      // Row 2 (y ~ 470)
      { x: 370, y: 470, radius: 10, angle: Math.PI / 3, angularSpeed: -0.048, arms: 3, length: 44, color: '#ff2d75' },
      { x: 600, y: 455, radius: 12, angle: 0, angularSpeed: 0.055, arms: 4, length: 45, color: '#00ff88' },
      { x: 830, y: 470, radius: 10, angle: Math.PI / 3, angularSpeed: -0.048, arms: 3, length: 44, color: '#ff2d75' }
    );

    // 3. 8 Deflector Ramps (Angled kinetic guide rails, diamond splitter, and choke-point funnel rails)
    ramps.push(
      // Upper deflector funnels
      { x1: 100, y1: 185, x2: 215, y2: 235, thickness: 8, color: '#38bdf8' },
      { x1: 1100, y1: 185, x2: 985, y2: 235, thickness: 8, color: '#38bdf8' },
      // Mid diamond kinetic splitter
      { x1: 600, y1: 345, x2: 540, y2: 385, thickness: 8, color: '#c084fc' },
      { x1: 600, y1: 345, x2: 660, y2: 385, thickness: 8, color: '#c084fc' },
      // Mid flanks
      { x1: 95, y1: 430, x2: 200, y2: 475, thickness: 8, color: '#f43f5e' },
      { x1: 1105, y1: 430, x2: 1000, y2: 475, thickness: 8, color: '#f43f5e' },
      // Lower choke point funnel rails (directing contenders into intense sprint showdown)
      { x1: 220, y1: 520, x2: 355, y2: 565, thickness: 8, color: '#facc15' },
      { x1: 980, y1: 520, x2: 845, y2: 565, thickness: 8, color: '#facc15' }
    );

    // 4. 6 Speed Booster Zones (Chevron Acceleration Pads)
    boosters.push(
      { x: 325, y: 195, width: 44, height: 48, direction: 'down', multiplier: 1.8, glow: 0 },
      { x: 831, y: 195, width: 44, height: 48, direction: 'down', multiplier: 1.8, glow: 0 },
      { x: 480, y: 380, width: 46, height: 46, direction: 'down', multiplier: 2.0, glow: 0 },
      { x: 674, y: 380, width: 46, height: 46, direction: 'down', multiplier: 2.0, glow: 0 },
      // Lower sprint booster pads
      { x: 395, y: 575, width: 44, height: 44, direction: 'down', multiplier: 2.2, glow: 0 },
      { x: 805, y: 575, width: 44, height: 44, direction: 'down', multiplier: 2.2, glow: 0 }
    );

    // 5. 11 Rows of Plinko Pegs (Avoiding collision with bumpers, spinners, ramps, boosters)
    const startY = 175;
    const endY = 625;
    const rows = 11;
    const colSpacing = 64;
    const baseOffsetX = (VIRTUAL_WIDTH - 15 * colSpacing) / 2; // ~120px

    for (let r = 0; r < rows; r++) {
      const y = startY + r * ((endY - startY) / (rows - 1));
      const isOdd = r % 2 === 1;
      const cols = isOdd ? 15 : 16;
      const offsetX = isOdd ? baseOffsetX + colSpacing / 2 : baseOffsetX;

      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * colSpacing;

        // Skip peg if overlapping any bumper
        let overlap = false;
        for (const b of bumpers) {
          if (Math.hypot(x - b.x, y - b.y) < b.radius + 20) { overlap = true; break; }
        }
        if (overlap) continue;

        // Skip peg if overlapping any spinner
        for (const s of spinners) {
          if (Math.hypot(x - s.x, y - s.y) < s.length + 18) { overlap = true; break; }
        }
        if (overlap) continue;

        // Skip peg if overlapping any speed booster
        for (const bst of boosters) {
          if (Math.abs(x - bst.x) < bst.width / 2 + 16 && Math.abs(y - bst.y) < bst.height / 2 + 16) {
            overlap = true; break;
          }
        }
        if (overlap) continue;

        // Skip peg if overlapping any deflector ramp
        for (const rm of ramps) {
          const dx = rm.x2 - rm.x1;
          const dy = rm.y2 - rm.y1;
          const lenSq = dx * dx + dy * dy;
          let t = ((x - rm.x1) * dx + (y - rm.y1) * dy) / lenSq;
          t = Math.max(0, Math.min(1, t));
          const cx = rm.x1 + t * dx;
          const cy = rm.y1 + t * dy;
          if (Math.hypot(x - cx, y - cy) < rm.thickness / 2 + 18) { overlap = true; break; }
        }
        if (overlap) continue;

        pegs.push({
          x,
          y,
          radius: 5.5,
          glow: 0,
          type: r % 3 === 0 ? 'gold' : r % 3 === 1 ? 'neon' : 'regular',
        });
      }
    }

    pegsRef.current = pegs;
    bumpersRef.current = bumpers;
    spinnersRef.current = spinners;
    rampsRef.current = ramps;
    boostersRef.current = boosters;
  }, []);

  useEffect(() => {
    initObstacles();
  }, [initObstacles]);

  // Fireworks trigger function
  const triggerFirework = useCallback((x: number, y: number, count = 75) => {
    const palette = FIREWORK_PALETTES[Math.floor(Math.random() * FIREWORK_PALETTES.length)];
    const primaryColor = palette[0];

    // Shockwave expanding ring
    fireworkRingsRef.current.push({
      x,
      y,
      radius: 4,
      maxRadius: 70,
      color: primaryColor,
      alpha: 1.0,
      growthRate: 3.5,
    });

    // Particle sparks
    const newParticles: FireworkParticle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
      const speed = 1.8 + Math.random() * 7.2;
      const color = palette[Math.floor(Math.random() * palette.length)];

      newParticles.push({
        x,
        y,
        prevX: x,
        prevY: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2.2 + Math.random() * 2.2,
        alpha: 1.0,
        decay: 0.009 + Math.random() * 0.012,
        gravity: 0.055 + Math.random() * 0.025,
        friction: 0.965,
        sparkle: Math.random() > 0.45,
      });
    }

    fireworkParticlesRef.current.push(...newParticles);
    sound.playFireworkBurst();
  }, []);

  // Reset winner detection and fireworks when restarting
  useEffect(() => {
    if (raceState === 'idle' || raceState === 'countdown') {
      winnerDetectedRef.current = false;
      fireworkParticlesRef.current = [];
      fireworkRingsRef.current = [];
      shakeIntensityRef.current = 0;
      raceStartTimeRef.current = 0;
      lastTickSecRef.current = -1;
      lastLeaderIdRef.current = null;
      overtakeAlertRef.current = null;
    } else if (raceState === 'racing') {
      raceStartTimeRef.current = performance.now();
      lastTickSecRef.current = -1;
      lastLeaderIdRef.current = null;
      overtakeAlertRef.current = null;
    }
  }, [raceState]);

  // Main animation and physics loop
  useEffect(() => {
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // 1. Resize canvas dynamically to fit container while keeping crisp DPR
      const container = containerRef.current;
      if (container) {
        const containerW = container.clientWidth;
        const containerH = container.clientHeight;
        const dpr = window.devicePixelRatio || 1;

        // Remove arbitrary scale cap so canvas can utilize 100% of available screen on projectors
        const scaleX = (containerW - 8) / VIRTUAL_WIDTH;
        const scaleY = (containerH - 8) / VIRTUAL_HEIGHT;
        const scale = Math.min(scaleX, scaleY);

        const targetW = Math.floor(VIRTUAL_WIDTH * scale);
        const targetH = Math.floor(VIRTUAL_HEIGHT * scale);

        if (canvas.width !== targetW * dpr || canvas.height !== targetH * dpr) {
          canvas.width = targetW * dpr;
          canvas.height = targetH * dpr;
          canvas.style.width = `${targetW}px`;
          canvas.style.height = `${targetH}px`;
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(scale * dpr, scale * dpr);
      }

      // 2. Physics Simulation step (if racing)
      if (raceState === 'racing' && !winnerDetectedRef.current) {
        // High-precision race timer
        const now = performance.now();
        if (raceStartTimeRef.current === 0) {
          raceStartTimeRef.current = now;
        }
        const elapsedSec = (now - raceStartTimeRef.current) / 1000;
        const remainingSec = Math.max(0, targetDuration - elapsedSec);

        // Sound warning on final 5 seconds (5, 4, 3, 2, 1)
        if (remainingSec <= 5.0 && remainingSec > 0) {
          const currentCeil = Math.ceil(remainingSec);
          if (currentCeil !== lastTickSecRef.current) {
            lastTickSecRef.current = currentCeil;
            sound.playTimerTick(true);
            addScreenShake(1.6);
          }
        }

        // Timeout Finish Condition: When selected time expires, the student whose marble is farthest ahead is called as the winner!
        if (elapsedSec >= targetDuration && !winnerDetectedRef.current) {
          winnerDetectedRef.current = true;
          const sorted = [...marbles].sort((a, b) => b.y - a.y);
          const timeoutWinner = sorted[0];
          if (timeoutWinner) {
            timeoutWinner.y = Math.max(timeoutWinner.y, FINISH_LINE_Y + 4);
            timeoutWinner.rank = 1;
            timeoutWinner.finishTime = targetDuration;
            timeoutWinner.finishReason = 'finish_line';
            sound.playTimeoutBuzzer();
            sound.playFanfare();
            addScreenShake(8);

            triggerFirework(timeoutWinner.x, timeoutWinner.y - 10, 95);
            setTimeout(() => triggerFirework(VIRTUAL_WIDTH * 0.28, 320, 75), 140);
            setTimeout(() => triggerFirework(VIRTUAL_WIDTH * 0.72, 340, 75), 280);
            lastFireworkBurstTimeRef.current = Date.now() + 350;

            onFinish(timeoutWinner);
          }
        }

        // Progression pacing across the entire chosen duration
        const timeProgress = Math.min(1, Math.max(0, elapsedSec / targetDuration));
        const expectedPackY = GATE_Y + (FINISH_LINE_Y - GATE_Y - 45) * Math.pow(timeProgress, 0.85);

        // Adaptive physics pace based on selected duration, with dramatic tension slowdown in photo-finish final stretch
        const leaderY = marbles.reduce((max, m) => Math.max(max, m.y), 0);
        const isNearFinish = leaderY > FINISH_LINE_Y - 70;
        const stretchFactor = isNearFinish ? 0.82 : 1.0;
        const paceFactor = Math.min(1.3, Math.max(0.42, Math.sqrt(28 / targetDuration))) * stretchFactor;
        const gravity = 0.20 * speedMultiplier * paceFactor;
        const restitution = 0.55;
        const pegs = pegsRef.current;
        const bumpers = bumpersRef.current;
        const spinners = spinnersRef.current;
        const ramps = rampsRef.current;
        const boosters = boostersRef.current;

        // Rotate spinners
        for (const sp of spinners) {
          sp.angle += sp.angularSpeed * speedMultiplier * paceFactor;
        }

        // Fade glows
        for (const p of pegs) {
          if (p.glow > 0.02) p.glow *= 0.88;
        }
        for (const b of bumpers) {
          if (b.glow > 0.02) b.glow *= 0.88;
        }
        for (const bst of boosters) {
          if ((bst.glow || 0) > 0.02) bst.glow = (bst.glow || 0) * 0.88;
        }

        // Move marbles
        for (let i = 0; i < marbles.length; i++) {
          const m = marbles[i];

          // Gravity
          m.vy += gravity;

          // Unpredictable slight wind/jitter
          m.vx += (Math.random() - 0.5) * 0.12 * speedMultiplier;

          // Drag
          m.vx *= 0.995;
          m.vy *= 0.995;

          // Max speed clamp
          const maxSpeed = 12 * speedMultiplier * paceFactor;
          const currentSpeed = Math.hypot(m.vx, m.vy);
          if (currentSpeed > maxSpeed) {
            m.vx = (m.vx / currentSpeed) * maxSpeed;
            m.vy = (m.vy / currentSpeed) * maxSpeed;
          }

          // Controlled pacing: prevent marbles from dropping through the entire track prematurely
          if (m.y > expectedPackY + 75 && timeProgress < 0.90) {
            m.vy -= 0.16 * speedMultiplier;
            if (m.vy > 2.2) m.vy *= 0.94;
          } else if (m.y < expectedPackY - 110) {
            m.vy += 0.10 * speedMultiplier;
          }

          m.x += m.vx * speedMultiplier;
          m.y += m.vy * speedMultiplier;

          // Anti-stuck logic
          if (
            Math.abs(m.vx) < 0.2 &&
            Math.abs(m.vy) < 0.4 &&
            m.y > 180 &&
            m.y < FINISH_LINE_Y - 40
          ) {
            m.stuckTimer = (m.stuckTimer || 0) + 1;
            if (m.stuckTimer > 35) {
              m.vx += (Math.random() - 0.5) * 3.5;
              m.vy += 1.8;
              m.stuckTimer = 0;
            }
          } else {
            m.stuckTimer = 0;
          }

          // Wall Collisions
          const leftWall = 70;
          const rightWall = VIRTUAL_WIDTH - 70;

          if (m.x - m.radius < leftWall) {
            m.x = leftWall + m.radius;
            m.vx = -m.vx * restitution;
            sound.playBounce(0.85);
            if (Math.abs(m.vx) > 3.5) addScreenShake(2.5);
          } else if (m.x + m.radius > rightWall) {
            m.x = rightWall - m.radius;
            m.vx = -m.vx * restitution;
            sound.playBounce(0.85);
            if (Math.abs(m.vx) > 3.5) addScreenShake(2.5);
          }

          // Starting funnel walls
          if (m.y < 140) {
            if (m.x < 370 && m.y > 35 + (370 - m.x) * 0.7) {
              m.x = 370;
              m.vx = Math.abs(m.vx) * 0.5 + 0.5;
            }
            if (m.x > VIRTUAL_WIDTH - 370 && m.y > 35 + (m.x - (VIRTUAL_WIDTH - 370)) * 0.7) {
              m.x = VIRTUAL_WIDTH - 370;
              m.vx = -Math.abs(m.vx) * 0.5 - 0.5;
            }
          }

          // Deflector Ramps collision
          for (const rm of ramps) {
            const rdx = rm.x2 - rm.x1;
            const rdy = rm.y2 - rm.y1;
            const lenSq = rdx * rdx + rdy * rdy;
            let t = ((m.x - rm.x1) * rdx + (m.y - rm.y1) * rdy) / lenSq;
            t = Math.max(0, Math.min(1, t));
            const cx = rm.x1 + t * rdx;
            const cy = rm.y1 + t * rdy;
            const dist = Math.hypot(m.x - cx, m.y - cy);
            const minDist = m.radius + rm.thickness / 2;

            if (dist < minDist && dist > 0) {
              const nx = (m.x - cx) / dist;
              const ny = (m.y - cy) / dist;
              m.x = cx + nx * minDist;
              m.y = cy + ny * minDist;

              const dot = m.vx * nx + m.vy * ny;
              if (dot < 0) {
                m.vx = (m.vx - 2 * dot * nx) * restitution + (Math.random() - 0.5) * 0.6;
                m.vy = (m.vy - 2 * dot * ny) * restitution;
                sound.playBounce(1.2);
                addScreenShake(3.0);
              }
            }
          }

          // Speed Booster Zones (Chevron Acceleration Pads)
          for (const bst of boosters) {
            if (
              m.x >= bst.x - bst.width / 2 &&
              m.x <= bst.x + bst.width / 2 &&
              m.y >= bst.y - bst.height / 2 &&
              m.y <= bst.y + bst.height / 2
            ) {
              if (m.vy < 9 * speedMultiplier) {
                m.vy += 2.8 * speedMultiplier;
                bst.glow = 1.0;
                sound.playBooster();
                addScreenShake(2.0);
              }
            }
          }

          // Pegs collision
          for (const peg of pegs) {
            const dx = m.x - peg.x;
            const dy = m.y - peg.y;
            const dist = Math.hypot(dx, dy);
            const minDist = m.radius + peg.radius;

            if (dist < minDist && dist > 0) {
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDist - dist;
              m.x += nx * overlap;
              m.y += ny * overlap;

              const dot = m.vx * nx + m.vy * ny;
              m.vx = (m.vx - 2 * dot * nx) * restitution + (Math.random() - 0.5) * 0.6;
              m.vy = (m.vy - 2 * dot * ny) * restitution;

              peg.glow = 1.0;
              sound.playBounce(1 + (peg.y / VIRTUAL_HEIGHT) * 0.5);
            }
          }

          // Bumpers collision
          for (const b of bumpers) {
            const dx = m.x - b.x;
            const dy = m.y - b.y;
            const dist = Math.hypot(dx, dy);
            const minDist = m.radius + b.radius;

            if (dist < minDist && dist > 0) {
              const nx = dx / dist;
              const ny = dy / dist;
              m.x = b.x + nx * minDist;
              m.y = b.y + ny * minDist;

              m.vx = nx * b.power;
              m.vy = ny * b.power;

              b.glow = 1.0;
              sound.playBumper();
              addScreenShake(6.5); // Screen shake on strong bumper bounce!
            }
          }

          // Spinners collision
          for (const sp of spinners) {
            for (let a = 0; a < sp.arms; a++) {
              const armAngle = sp.angle + (a * 2 * Math.PI) / sp.arms;
              const armEndX = sp.x + Math.cos(armAngle) * sp.length;
              const armEndY = sp.y + Math.sin(armAngle) * sp.length;

              const segX = armEndX - sp.x;
              const segY = armEndY - sp.y;
              const segLenSq = segX * segX + segY * segY;
              let t = ((m.x - sp.x) * segX + (m.y - sp.y) * segY) / segLenSq;
              t = Math.max(0, Math.min(1, t));

              const closestX = sp.x + t * segX;
              const closestY = sp.y + t * segY;
              const dist = Math.hypot(m.x - closestX, m.y - closestY);

              if (dist < m.radius + 4) {
                const nx = (m.x - closestX) / (dist || 1);
                const ny = (m.y - closestY) / (dist || 1);
                m.x = closestX + nx * (m.radius + 4);
                m.y = closestY + ny * (m.radius + 4);

                const bladeSpeed = sp.angularSpeed * sp.length * 2.5;
                m.vx += -Math.sin(armAngle) * bladeSpeed * 0.8 + nx * 3;
                m.vy += Math.cos(armAngle) * bladeSpeed * 0.8 + ny * 3;

                sound.playBounce(1.4);
                addScreenShake(4.5); // Screen shake on fast spinner blade strike!
              }
            }
          }

          // Marble-to-marble elastic repulsion
          for (let j = i + 1; j < marbles.length; j++) {
            const m2 = marbles[j];
            const dx = m2.x - m.x;
            const dy = m2.y - m.y;
            const dist = Math.hypot(dx, dy);
            const minDist = m.radius + m2.radius;

            if (dist < minDist && dist > 0) {
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = (minDist - dist) * 0.5;

              m.x -= nx * overlap;
              m.y -= ny * overlap;
              m2.x += nx * overlap;
              m2.y += ny * overlap;

              const kx = m.vx - m2.vx;
              const ky = m.vy - m2.vy;
              const p = 2 * (nx * kx + ny * ky) / 2;

              m.vx -= p * nx * 0.6;
              m.vy -= p * ny * 0.6;
              m2.vx += p * nx * 0.6;
              m2.vy += p * ny * 0.6;
            }
          }

          // Finish Gate Barrier Enforcement:
          // "trò chơi phải hết thời gian đã chọn mới có học sinh về đích"
          const isGateLocked = elapsedSec < targetDuration;
          if (isGateLocked) {
            const barrierTopY = FINISH_LINE_Y - 18;
            if (m.y + m.radius >= barrierTopY) {
              m.y = barrierTopY - m.radius;
              // Bounce upward back into the race!
              m.vy = -Math.abs(m.vy) * 0.75 - 2.6;
              m.vx += (Math.random() - 0.5) * 4.5;
              sound.playBounce(1.4);
              addScreenShake(2.0);
            }
          }

          // Check Finish line ONLY if gate is unlocked (time has fully elapsed)
          if (!isGateLocked && m.y + m.radius >= FINISH_LINE_Y && !winnerDetectedRef.current) {
            winnerDetectedRef.current = true;
            m.rank = 1;
            m.finishTime = targetDuration;
            m.finishReason = 'finish_line';
            sound.playTimeoutBuzzer();
            sound.playFanfare();
            addScreenShake(8); // Grand celebratory shake upon crossing the line!

            // Launch immediate grand firework burst right at winning marble
            triggerFirework(m.x, m.y - 10, 95);
            setTimeout(() => triggerFirework(VIRTUAL_WIDTH * 0.28, 320, 75), 140);
            setTimeout(() => triggerFirework(VIRTUAL_WIDTH * 0.72, 340, 75), 280);
            lastFireworkBurstTimeRef.current = Date.now() + 350;

            onFinish(m);
            break;
          }
        }
      }

      // Continuous festive fireworks if race is finished
      if (raceState === 'finished') {
        const now = Date.now();
        if (now - lastFireworkBurstTimeRef.current > 380) {
          triggerFirework(
            120 + Math.random() * (VIRTUAL_WIDTH - 240),
            180 + Math.random() * 450,
            70
          );
          lastFireworkBurstTimeRef.current = now;
        }
      }

      // Screen shake calculation (decaying smoothly for punchy feedback)
      let shakeX = 0;
      let shakeY = 0;
      if (shakeIntensityRef.current > 0.05) {
        shakeX = (Math.random() - 0.5) * 2 * shakeIntensityRef.current;
        shakeY = (Math.random() - 0.5) * 2 * shakeIntensityRef.current;
        shakeIntensityRef.current *= 0.86;
        if (shakeIntensityRef.current < 0.05) shakeIntensityRef.current = 0;
      }

      ctx.save();
      if (shakeX !== 0 || shakeY !== 0) {
        ctx.translate(shakeX, shakeY);
      }

      // 3. Render Canvas Elements
      ctx.clearRect(-20, -20, VIRTUAL_WIDTH + 40, VIRTUAL_HEIGHT + 40);

      // Deep Luxury Navy Track Gradient
      const trackGrad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
      trackGrad.addColorStop(0, '#091330');
      trackGrad.addColorStop(0.4, '#0c193f');
      trackGrad.addColorStop(0.8, '#0a1435');
      trackGrad.addColorStop(1, '#050a1a');
      ctx.fillStyle = trackGrad;
      ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

      // Subtle Gold Grid Lines
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.06)';
      ctx.lineWidth = 1;
      for (let y = 0; y < VIRTUAL_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(80, y);
        ctx.lineTo(VIRTUAL_WIDTH - 80, y);
        ctx.stroke();
      }

      // Track Glowing Rails
      const leftWallX = 70;
      const rightWallX = VIRTUAL_WIDTH - 70;

      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.moveTo(leftWallX, 135);
      ctx.lineTo(leftWallX, 695);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rightWallX, 135);
      ctx.lineTo(rightWallX, 695);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Starting Funnel Rails
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(350, 35);
      ctx.lineTo(380, 125);
      ctx.lineTo(leftWallX, 135);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(VIRTUAL_WIDTH - 350, 35);
      ctx.lineTo(VIRTUAL_WIDTH - 380, 125);
      ctx.lineTo(rightWallX, 135);
      ctx.stroke();

      // Starting Gate Bar
      if (raceState === 'idle' || raceState === 'countdown') {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(380, GATE_Y);
        ctx.lineTo(VIRTUAL_WIDTH - 380, GATE_Y);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 12px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CỔNG XUẤT PHÁT', VIRTUAL_WIDTH / 2, GATE_Y - 10);
      }

      // Finish Line (Golden Checkered Ribbon)
      const boxSize = 14;
      const numBoxes = Math.floor((rightWallX - leftWallX) / boxSize);
      for (let i = 0; i < numBoxes; i++) {
        for (let r = 0; r < 2; r++) {
          const isWhite = (i + r) % 2 === 0;
          ctx.fillStyle = isWhite ? '#ffffff' : '#ffd700';
          ctx.fillRect(leftWallX + i * boxSize, FINISH_LINE_Y + r * boxSize, boxSize, boxSize);
        }
      }
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 13px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        '🏁 ĐÍCH ĐẾN - GỌI TÊN HỌC SINH LÊN BẢNG 🏁',
        VIRTUAL_WIDTH / 2,
        FINISH_LINE_Y + 45
      );

      // Render Dynamic Finish Barrier: LOCKED until chosen time has elapsed!
      let barrierRemainingSec = targetDuration;
      if (raceState === 'racing') {
        const now = performance.now();
        const elapsed = (now - raceStartTimeRef.current) / 1000;
        barrierRemainingSec = Math.max(0, targetDuration - elapsed);
      }

      const barrierY = FINISH_LINE_Y - 18;
      if (raceState === 'racing' && barrierRemainingSec > 0) {
        // Active Laser Forcefield Barrier
        ctx.save();
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 90);
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.75 + 0.25 * pulse})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff2255';
        ctx.shadowBlur = 14;
        ctx.setLineDash([12, 6]);
        ctx.lineDashOffset = -Date.now() / 35;
        ctx.beginPath();
        ctx.moveTo(leftWallX + 6, barrierY);
        ctx.lineTo(rightWallX - 6, barrierY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        // Forcefield Status Badge
        const badgeW = 420;
        const badgeH = 26;
        const badgeX = (VIRTUAL_WIDTH - badgeW) / 2;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(badgeX, barrierY - badgeH / 2, badgeW, badgeH, 13);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 11px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          `🔒 CỔNG ĐÍCH MỞ KHI HẾT GIỜ (${barrierRemainingSec.toFixed(1)}s)`,
          VIRTUAL_WIDTH / 2,
          barrierY
        );
        ctx.restore();
      } else if (raceState === 'finished' || (raceState === 'racing' && barrierRemainingSec <= 0)) {
        // Open Golden Laser Ribbon
        ctx.save();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(leftWallX + 6, barrierY);
        ctx.lineTo(rightWallX - 6, barrierY);
        ctx.stroke();

        const badgeW = 320;
        const badgeH = 26;
        const badgeX = (VIRTUAL_WIDTH - badgeW) / 2;
        ctx.fillStyle = 'rgba(6, 78, 59, 0.94)';
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(badgeX, barrierY - badgeH / 2, badgeW, badgeH, 13);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#6ee7b7';
        ctx.font = 'bold 11px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔓 CỔNG ĐÍCH ĐÃ MỞ - CHÚC MỪNG!', VIRTUAL_WIDTH / 2, barrierY);
        ctx.restore();
      }

      // Render Deflector Ramps (Angled Kinetic Rails)
      for (const rm of rampsRef.current) {
        ctx.save();
        ctx.shadowColor = rm.color;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = rm.color;
        ctx.lineWidth = rm.thickness;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rm.x1, rm.y1);
        ctx.lineTo(rm.x2, rm.y2);
        ctx.stroke();

        // Neon core stripe
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(rm.x1, rm.y1);
        ctx.lineTo(rm.x2, rm.y2);
        ctx.stroke();
        ctx.restore();
      }

      // Render Speed Booster Zones (Chevron Acceleration Pads)
      for (const bst of boostersRef.current) {
        ctx.save();
        ctx.translate(bst.x, bst.y);

        const isGlow = (bst.glow || 0) > 0.05;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = isGlow ? 18 : 6;
        ctx.fillStyle = isGlow ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 229, 255, 0.15)';
        ctx.strokeStyle = isGlow ? '#ffffff' : 'rgba(0, 229, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-bst.width / 2, -bst.height / 2, bst.width, bst.height, 8);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Animated neon chevrons
        const cycle = (Date.now() / 200) % 2;
        ctx.fillStyle = isGlow ? '#ffffff' : '#00e5ff';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▼', 0, -8 + cycle * 4);
        ctx.fillText('▼', 0, 4 + cycle * 4);

        ctx.restore();
      }

      // Render Spinners
      for (const sp of spinnersRef.current) {
        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.rotate(sp.angle);

        const spinColor = sp.color || '#f59e0b';
        ctx.fillStyle = spinColor;
        ctx.shadowColor = spinColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, sp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        for (let a = 0; a < sp.arms; a++) {
          const angle = (a * 2 * Math.PI) / sp.arms;
          ctx.save();
          ctx.rotate(angle);
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(0, -3, sp.length, 6);

          ctx.fillStyle = spinColor;
          ctx.beginPath();
          ctx.arc(sp.length, 0, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }

      // Render Bumpers
      for (const b of bumpersRef.current) {
        ctx.save();
        ctx.translate(b.x, b.y);

        const bumpColor = b.color || '#38bdf8';
        if (b.glow > 0.05) {
          ctx.shadowColor = bumpColor;
          ctx.shadowBlur = 25 * b.glow;
        }

        const bGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, b.radius);
        bGrad.addColorStop(0, '#ffffff');
        bGrad.addColorStop(0.3, bumpColor);
        bGrad.addColorStop(1, '#050c1f');

        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = bumpColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BẬT', 0, 0);

        ctx.restore();
      }

      // Render Pegs (Plinko pins)
      for (const p of pegsRef.current) {
        ctx.save();
        ctx.translate(p.x, p.y);

        if (p.glow > 0.05) {
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 16 * p.glow;
        }

        const isGold = p.type === 'gold';
        const isNeon = p.type === 'neon';
        const pGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, p.radius);
        if (isGold) {
          pGrad.addColorStop(0, '#ffffff');
          pGrad.addColorStop(0.4, '#ffd700');
          pGrad.addColorStop(1, '#b45309');
        } else if (isNeon) {
          pGrad.addColorStop(0, '#ffffff');
          pGrad.addColorStop(0.4, '#00e5ff');
          pGrad.addColorStop(1, '#0369a1');
        } else {
          pGrad.addColorStop(0, '#ffffff');
          pGrad.addColorStop(0.5, '#cbd5e1');
          pGrad.addColorStop(1, '#475569');
        }

        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Determine current sorted positions for live tracking HUD
      const sortedMarbles = [...marbles].sort((a, b) => b.y - a.y);
      const leaderId = raceState === 'racing' && sortedMarbles.length > 0 ? sortedMarbles[0].id : null;

      // Track dramatic overtake events for live announcer banner & sounds
      if (raceState === 'racing' && sortedMarbles.length > 0) {
        const topMarble = sortedMarbles[0];
        if (lastLeaderIdRef.current && lastLeaderIdRef.current !== topMarble.id && topMarble.y > 170) {
          overtakeAlertRef.current = { name: topMarble.name, timer: 90 };
          sound.playOvertake();
          addScreenShake(2.5);
        }
        lastLeaderIdRef.current = topMarble.id;
      }

      // Draw high-speed motion trails behind top contenders
      if (raceState === 'racing') {
        for (let k = 0; k < Math.min(3, sortedMarbles.length); k++) {
          const mTop = sortedMarbles[k];
          const speed = Math.hypot(mTop.vx, mTop.vy);
          if (speed > 1.2) {
            ctx.save();
            ctx.strokeStyle =
              k === 0
                ? 'rgba(255, 215, 0, 0.65)'
                : k === 1
                ? 'rgba(56, 189, 248, 0.55)'
                : 'rgba(249, 115, 22, 0.55)';
            ctx.lineWidth = mTop.radius * 0.85;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(mTop.x, mTop.y);
            ctx.lineTo(mTop.x - mTop.vx * 3.5, mTop.y - mTop.vy * 3.5);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Render Marbles
      for (const m of marbles) {
        ctx.save();
        ctx.translate(m.x, m.y);

        const isLeader = m.id === leaderId;

        // Leader Glowing Aura
        if (isLeader) {
          ctx.save();
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(0, 0, m.radius + 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Marble shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(2, 4, m.radius * 0.9, m.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3D Shaded Marble Sphere
        const mGrad = ctx.createRadialGradient(
          -m.radius * 0.35,
          -m.radius * 0.35,
          m.radius * 0.1,
          0,
          0,
          m.radius
        );
        mGrad.addColorStop(0, '#ffffff');
        mGrad.addColorStop(0.2, m.secondaryColor);
        mGrad.addColorStop(0.8, m.color);
        mGrad.addColorStop(1, '#050a18');

        ctx.fillStyle = mGrad;
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();

        // Gold Rim
        ctx.strokeStyle = isLeader ? '#ffd700' : 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = isLeader ? 2.5 : 1.5;
        ctx.stroke();

        // Specular dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(-m.radius * 0.35, -m.radius * 0.35, m.radius * 0.22, 0, Math.PI * 2);
        ctx.fill();

        // Name Tag Label above marble (Crisp, high-contrast & legible for projector view)
        ctx.font = isLeader ? 'bold 13px "Be Vietnam Pro", sans-serif' : 'bold 12px "Be Vietnam Pro", sans-serif';
        const tagText = isLeader ? `👑 ${m.name}` : m.name;
        const textWidth = ctx.measureText(tagText).width;
        const tagPadding = 10;
        const tagH = isLeader ? 22 : 20;
        const tagW = textWidth + tagPadding * 2;
        const tagY = -m.radius - (isLeader ? 18 : 15);

        // Tag Background
        ctx.fillStyle = isLeader ? 'rgba(16, 28, 66, 0.95)' : 'rgba(8, 14, 34, 0.9)';
        ctx.strokeStyle = isLeader ? '#ffd700' : 'rgba(255, 215, 0, 0.7)';
        ctx.lineWidth = isLeader ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(-tagW / 2, tagY - tagH / 2, tagW, tagH, 6);
        ctx.fill();
        ctx.stroke();

        // Tag Text
        ctx.fillStyle = isLeader ? '#ffd700' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, 0, tagY);

        ctx.restore();
      }

      // Live HUD Timer (Left Top Corner - Symmetrical and highly visible on projectors)
      {
        ctx.save();
        const timerX = 18;
        const timerY = 16;
        const timerW = 215;
        const timerH = 92;

        ctx.fillStyle = 'rgba(7, 13, 31, 0.88)';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(timerX, timerY, timerW, timerH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 11px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('⏱️ ĐỒNG HỒ ĐUA', timerX + 12, timerY + 18);

        let currentRemaining = targetDuration;
        let progressRatio = 0;

        if (raceState === 'racing') {
          const now = performance.now();
          const elapsed = (now - raceStartTimeRef.current) / 1000;
          currentRemaining = Math.max(0, targetDuration - elapsed);
          progressRatio = Math.min(1, elapsed / targetDuration);
        } else if (raceState === 'finished') {
          currentRemaining = 0;
          progressRatio = 1;
        }

        const isUrgent = raceState === 'racing' && currentRemaining <= 5.0 && currentRemaining > 0;

        // Big Digital Digits
        ctx.font = '900 24px "Cinzel", "Be Vietnam Pro", monospace';
        ctx.fillStyle = isUrgent
          ? '#ff2255'
          : raceState === 'racing'
          ? '#ffd700'
          : '#38bdf8';
        if (isUrgent) {
          ctx.shadowColor = '#ff2255';
          ctx.shadowBlur = 12;
        }
        ctx.fillText(`${currentRemaining.toFixed(1)}s`, timerX + 12, timerY + 45);
        ctx.shadowBlur = 0;

        // Subtitle / Target
        ctx.font = '10px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = isUrgent ? '#fca5a5' : '#94a3b8';
        ctx.fillText(
          isUrgent
            ? `⚠️ SẮP HẾT GIỜ (${Math.ceil(currentRemaining)}s)`
            : `Mục tiêu: ${targetDuration}s (${progressRatio > 0 ? Math.round(progressRatio * 100) : 0}%)`,
          timerX + 12,
          timerY + 62
        );

        // Progress Bar
        const barX = timerX + 12;
        const barY = timerY + 72;
        const barW = timerW - 24;
        const barH = 7;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 4);
        ctx.fill();

        if (progressRatio > 0) {
          const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
          if (isUrgent) {
            barGrad.addColorStop(0, '#f97316');
            barGrad.addColorStop(1, '#ef4444');
          } else {
            barGrad.addColorStop(0, '#00e5ff');
            barGrad.addColorStop(0.5, '#ffd700');
            barGrad.addColorStop(1, '#10b981');
          }
          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(barX, barY, Math.max(8, barW * progressRatio), barH, 4);
          ctx.fill();
        }

        ctx.restore();
      }

      // Dramatic Overtake Announcement Banner (Top Center)
      if (raceState === 'racing' && overtakeAlertRef.current && overtakeAlertRef.current.timer > 0) {
        overtakeAlertRef.current.timer--;
        ctx.save();
        const alertW = 420;
        const alertH = 38;
        const alertX = (VIRTUAL_WIDTH - alertW) / 2;
        const alertY = 16;

        const alertGrad = ctx.createLinearGradient(alertX, 0, alertX + alertW, 0);
        alertGrad.addColorStop(0, '#dc2626');
        alertGrad.addColorStop(0.5, '#ea580c');
        alertGrad.addColorStop(1, '#dc2626');

        ctx.fillStyle = alertGrad;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.roundRect(alertX, alertY, alertW, alertH, 19);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;
        ctx.fillText(
          `⚡ BỨT PHÁ DẪN ĐẦU: ${overtakeAlertRef.current.name.toUpperCase()}! 🔥`,
          VIRTUAL_WIDTH / 2,
          alertY + alertH / 2
        );
        ctx.restore();
      }

      // Emergency Pulsing Edge Glow in the final 5 seconds
      if (raceState === 'racing') {
        const now = performance.now();
        const elapsed = (now - raceStartTimeRef.current) / 1000;
        const remaining = Math.max(0, targetDuration - elapsed);
        if (remaining <= 5.0 && remaining > 0) {
          const pulse = 0.35 + 0.25 * Math.sin(Date.now() / 120);
          ctx.save();
          ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
          ctx.lineWidth = 6;
          ctx.strokeRect(3, 3, VIRTUAL_WIDTH - 6, VIRTUAL_HEIGHT - 6);
          ctx.restore();
        }
      }

      // Live Top 3 Mini-Leaderboard on track side (only during race, non-intrusive for projector)
      if (raceState === 'racing' && sortedMarbles.length > 0) {
        ctx.save();
        const hudX = VIRTUAL_WIDTH - 230;
        const hudY = 16;
        const hudW = 215;
        const hudH = 92;

        ctx.fillStyle = 'rgba(7, 13, 31, 0.85)';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(hudX, hudY, hudW, hudH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 11px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('⚡ BẢNG XẾP HẠNG TRỰC TIẾP', hudX + 12, hudY + 18);

        const medals = ['🥇', '🥈', '🥉'];
        const topCount = Math.min(3, sortedMarbles.length);
        for (let k = 0; k < topCount; k++) {
          const mb = sortedMarbles[k];
          ctx.fillStyle = k === 0 ? '#ffd700' : k === 1 ? '#e2e8f0' : '#f97316';
          ctx.font = k === 0 ? 'bold 12px "Be Vietnam Pro", sans-serif' : '11px "Be Vietnam Pro", sans-serif';
          const nameTrimmed = mb.name.length > 15 ? mb.name.slice(0, 14) + '…' : mb.name;
          ctx.fillText(`${medals[k]} ${nameTrimmed}`, hudX + 12, hudY + 40 + k * 20);
        }
        ctx.restore();
      }

      // 4. Render Fireworks Particle System Overlay (Directly on top of track and marbles!)
      const rings = fireworkRingsRef.current;
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        ctx.save();
        ctx.globalAlpha = Math.max(0, r.alpha);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        r.radius += r.growthRate;
        r.alpha -= 0.035;
        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          rings.splice(i, 1);
        }
      }

      const particles = fireworkParticlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 9;

        // Draw light streak from previous position
        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Shimmer glint for sparkling particles
        if (p.sparkle && p.alpha > 0.4) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Physics step
        p.prevX = p.x;
        p.prevY = p.y;
        p.vx *= p.friction;
        p.vy = p.vy * p.friction + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.y > VIRTUAL_HEIGHT + 20) {
          particles.splice(i, 1);
        }
      }

      // 5. Render Countdown Overlay if in countdown state
      if (raceState === 'countdown') {
        ctx.save();
        ctx.fillStyle = 'rgba(3, 6, 17, 0.65)';
        ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

        const cdText = countdownValue > 0 ? `${countdownValue}` : 'XUẤT PHÁT!';
        ctx.font = '900 80px "Cinzel", "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ffd700';
        ctx.fillText(cdText, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2);
        ctx.restore();
      }

      ctx.restore(); // Restore screen shake transformation

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [marbles, raceState, speedMultiplier, targetDuration, onFinish, countdownValue]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full flex items-center justify-center p-1 sm:p-2 bg-[#050917] overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_0_1px_rgba(212,175,55,0.25)]"
      />
    </div>
  );
};
