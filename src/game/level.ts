import type { Platform, Dragon, GoldChest, Player, Tiger, Rhino } from './types';
import { GROUND_Y, PLAYER_SPEED, RAINBOW_COLORS } from './types';

export const LEVEL_WIDTH = 6000;

// Seeded random for reproducible procedural generation
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function createPlatforms(): Platform[] {
  const ground: Platform = { x: 0, y: GROUND_Y, width: LEVEL_WIDTH, height: 70 };
  const rand = seededRandom(12345);
  const floating: Platform[] = [];

  // Starter stepping-stone so player can reach first cloud platform
  floating.push({ x: 200, y: 320, width: 80, height: 18, color: RAINBOW_COLORS[0] });

  // Platforms near fireball dragons so player can stomp them
  // Dragon at x:1300 y:180
  floating.push({ x: 1220, y: 240, width: 90, height: 18, color: RAINBOW_COLORS[3] });
  floating.push({ x: 1340, y: 170, width: 80, height: 16, color: RAINBOW_COLORS[4] });
  // Dragon at x:2800 y:160
  floating.push({ x: 2720, y: 230, width: 90, height: 18, color: RAINBOW_COLORS[1] });
  floating.push({ x: 2840, y: 150, width: 80, height: 16, color: RAINBOW_COLORS[2] });
  // Dragon at x:4600 y:190
  floating.push({ x: 4520, y: 250, width: 90, height: 18, color: RAINBOW_COLORS[5] });
  floating.push({ x: 4640, y: 180, width: 80, height: 16, color: RAINBOW_COLORS[0] });

  // Procedurally generate rainbow-colored platforms
  let x = 350;
  let colorIdx = 0;

  while (x < LEVEL_WIDTH - 300) {
    const width = 90 + Math.floor(rand() * 70);
    const y = 200 + Math.floor(rand() * 130);
    const gap = 120 + Math.floor(rand() * 140);

    floating.push({
      x,
      y,
      width,
      height: 20,
      color: RAINBOW_COLORS[colorIdx % RAINBOW_COLORS.length],
    });

    // More stepping-stone platforms for traversal
    if (rand() > 0.35) {
      const stepX = x + width + 60 + Math.floor(rand() * 40);
      const stepY = y - 30 - Math.floor(rand() * 40);
      floating.push({
        x: stepX,
        y: stepY,
        width: 60 + Math.floor(rand() * 40),
        height: 16,
        color: RAINBOW_COLORS[(colorIdx + 3) % RAINBOW_COLORS.length],
      });
    }

    x += width + gap;
    colorIdx++;
  }

  return [ground, ...floating];
}

export function createDragons(): Dragon[] {
  return [
    // Patrol dragons - faster, wider ranges
    { pos: { x: 500, y: 320 }, vel: { x: 3, y: 0 }, width: 60, height: 40, frame: 0, frameTimer: 0, startX: 500, startY: 320, range: 250, type: 'patrol', swoopTimer: 0, fireballCooldown: 0, alive: true, deathTimer: 0 },
    { pos: { x: 1600, y: 340 }, vel: { x: -2.8, y: 0 }, width: 60, height: 40, frame: 0, frameTimer: 0, startX: 1600, startY: 340, range: 200, type: 'patrol', swoopTimer: 0, fireballCooldown: 0, alive: true, deathTimer: 0 },
    { pos: { x: 2500, y: 320 }, vel: { x: 3.2, y: 0 }, width: 60, height: 40, frame: 0, frameTimer: 0, startX: 2500, startY: 320, range: 300, type: 'patrol', swoopTimer: 0, fireballCooldown: 0, alive: true, deathTimer: 0 },
    { pos: { x: 4200, y: 330 }, vel: { x: -3.5, y: 0 }, width: 60, height: 40, frame: 0, frameTimer: 0, startX: 4200, startY: 330, range: 250, type: 'patrol', swoopTimer: 0, fireballCooldown: 0, alive: true, deathTimer: 0 },
    { pos: { x: 5400, y: 320 }, vel: { x: 3, y: 0 }, width: 60, height: 40, frame: 0, frameTimer: 0, startX: 5400, startY: 320, range: 200, type: 'patrol', swoopTimer: 0, fireballCooldown: 0, alive: true, deathTimer: 0 },

    // Swooping dragons - faster, deeper dives
    { pos: { x: 900, y: 130 }, vel: { x: -2.2, y: 0 }, width: 60, height: 40, frame: 0, frameTimer: 0, startX: 900, startY: 130, range: 280, type: 'swooper', swoopTimer: 0, fireballCooldown: 0, alive: true, deathTimer: 0 },
    { pos: { x: 2100, y: 120 }, vel: { x: 2.5, y: 0 }, width: 60, height: 40, frame: 0, frameTimer: 0, startX: 2100, startY: 120, range: 250, type: 'swooper', swoopTimer: 0, fireballCooldown: 0, alive: true, deathTimer: 0 },
    { pos: { x: 3600, y: 140 }, vel: { x: -2.8, y: 0 }, width: 60, height: 40, frame: 0, frameTimer: 0, startX: 3600, startY: 140, range: 300, type: 'swooper', swoopTimer: 0, fireballCooldown: 0, alive: true, deathTimer: 0 },

    // Fireball dragons - shorter cooldowns, more of them
    { pos: { x: 1300, y: 180 }, vel: { x: 0, y: 0 }, width: 60, height: 40, frame: 0, frameTimer: 0, startX: 1300, startY: 180, range: 0, type: 'fireball', swoopTimer: 0, fireballCooldown: 70, alive: true, deathTimer: 0 },
    { pos: { x: 2800, y: 160 }, vel: { x: 0, y: 0 }, width: 60, height: 40, frame: 0, frameTimer: 0, startX: 2800, startY: 160, range: 0, type: 'fireball', swoopTimer: 0, fireballCooldown: 55, alive: true, deathTimer: 0 },
    { pos: { x: 4600, y: 190 }, vel: { x: 0, y: 0 }, width: 60, height: 40, frame: 0, frameTimer: 0, startX: 4600, startY: 190, range: 0, type: 'fireball', swoopTimer: 0, fireballCooldown: 60, alive: true, deathTimer: 0 },

    // Hovering dragons - faster bob, faster patrol
    { pos: { x: 3300, y: 240 }, vel: { x: 2, y: 0 }, width: 60, height: 40, frame: 0, frameTimer: 0, startX: 3300, startY: 240, range: 220, type: 'hoverer', swoopTimer: 0, fireballCooldown: 0, alive: true, deathTimer: 0 },
    { pos: { x: 4900, y: 220 }, vel: { x: -2.2, y: 0 }, width: 60, height: 40, frame: 0, frameTimer: 0, startX: 4900, startY: 220, range: 300, type: 'hoverer', swoopTimer: 0, fireballCooldown: 0, alive: true, deathTimer: 0 },
    { pos: { x: 5600, y: 250 }, vel: { x: 1.8, y: 0 }, width: 60, height: 40, frame: 0, frameTimer: 0, startX: 5600, startY: 250, range: 200, type: 'hoverer', swoopTimer: 0, fireballCooldown: 0, alive: true, deathTimer: 0 },
  ];
}

export function createTigers(): Tiger[] {
  const tigerHeight = 32;
  const tigerY = GROUND_Y - tigerHeight;
  return [
    { pos: { x: 400, y: tigerY }, vel: { x: 1.8, y: 0 }, width: 48, height: tigerHeight, frame: 0, frameTimer: 0, startX: 400, range: 150, alive: true, deathTimer: 0 },
    { pos: { x: 1000, y: tigerY }, vel: { x: -2.2, y: 0 }, width: 48, height: tigerHeight, frame: 0, frameTimer: 0, startX: 1000, range: 180, alive: true, deathTimer: 0 },
    { pos: { x: 1500, y: tigerY }, vel: { x: 2, y: 0 }, width: 48, height: tigerHeight, frame: 0, frameTimer: 0, startX: 1500, range: 200, alive: true, deathTimer: 0 },
    { pos: { x: 2200, y: tigerY }, vel: { x: -2.5, y: 0 }, width: 48, height: tigerHeight, frame: 0, frameTimer: 0, startX: 2200, range: 160, alive: true, deathTimer: 0 },
    { pos: { x: 2900, y: tigerY }, vel: { x: 2.2, y: 0 }, width: 48, height: tigerHeight, frame: 0, frameTimer: 0, startX: 2900, range: 190, alive: true, deathTimer: 0 },
    { pos: { x: 3500, y: tigerY }, vel: { x: -1.8, y: 0 }, width: 48, height: tigerHeight, frame: 0, frameTimer: 0, startX: 3500, range: 170, alive: true, deathTimer: 0 },
    { pos: { x: 4000, y: tigerY }, vel: { x: 2.8, y: 0 }, width: 48, height: tigerHeight, frame: 0, frameTimer: 0, startX: 4000, range: 220, alive: true, deathTimer: 0 },
    { pos: { x: 4700, y: tigerY }, vel: { x: -2, y: 0 }, width: 48, height: tigerHeight, frame: 0, frameTimer: 0, startX: 4700, range: 150, alive: true, deathTimer: 0 },
    { pos: { x: 5300, y: tigerY }, vel: { x: 2.5, y: 0 }, width: 48, height: tigerHeight, frame: 0, frameTimer: 0, startX: 5300, range: 200, alive: true, deathTimer: 0 },
    { pos: { x: 5700, y: tigerY }, vel: { x: -3, y: 0 }, width: 48, height: tigerHeight, frame: 0, frameTimer: 0, startX: 5700, range: 180, alive: true, deathTimer: 0 },
  ];
}

export function createRhino(): Rhino {
  const rhinoHeight = 50;
  return {
    pos: { x: 5500, y: GROUND_Y - rhinoHeight },
    vel: { x: 2, y: 0 },
    width: 80,
    height: rhinoHeight,
    frame: 0,
    frameTimer: 0,
    startX: 5500,
    range: 200,
    hitPoints: 3,
    maxHitPoints: 3,
    alive: true,
    deathTimer: 0,
    invincibleTimer: 0,
  };
}

export function createChest(): GoldChest {
  return {
    pos: { x: LEVEL_WIDTH - 150, y: GROUND_Y - 50 },
    width: 50,
    height: 50,
    frame: 0,
    frameTimer: 0,
  };
}

export function createPlayer(): Player {
  return {
    pos: { x: 100, y: GROUND_Y - 48 },
    vel: { x: 0, y: 0 },
    width: 36,
    height: 48,
    onGround: true,
    facingRight: true,
    frame: 0,
    frameTimer: 0,
    squashTimer: 0,
    blinkTimer: 0,
    hasDoubleJumped: false,
    spinTimer: 0,
  };
}
