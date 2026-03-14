import type { GameData, Player, Dragon, Platform, GoldChest, Fireball, Tiger, Rhino } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, RAINBOW_COLORS } from './types';

const SKY_GRADIENT_TOP = '#4db8ff';
const SKY_GRADIENT_BOTTOM = '#87ceeb';
const GROUND_COLOR = '#4a9e2f';
const GROUND_DARK = '#3a7a22';

function drawSky(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, SKY_GRADIENT_TOP);
  gradient.addColorStop(1, SKY_GRADIENT_BOTTOM);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawBackgroundClouds(ctx: CanvasRenderingContext2D, cameraX: number) {
  // Distant background clouds for depth
  const seed = 42;
  for (let i = 0; i < 8; i++) {
    const cx = ((seed * (i + 1) * 7919) % 2400) - (cameraX * 0.15) % 2400;
    const cy = 60 + (seed * (i + 1) * 104729) % 120;
    const w = 100 + (i * 37) % 80;
    const wrappedX = ((cx % 2400) + 2400) % 2400 - 400;
    drawCloud(ctx, wrappedX, cy, w, 0.4);
  }
}

function drawRainbow(ctx: CanvasRenderingContext2D, cameraX: number) {
  const rainbowX = 300 - cameraX * 0.3;
  ctx.globalAlpha = 0.5;
  RAINBOW_COLORS.forEach((color, i) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(rainbowX, GROUND_Y, 200 + i * 16, Math.PI, 0);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

function drawGround(ctx: CanvasRenderingContext2D, cameraX: number) {
  ctx.fillStyle = GROUND_COLOR;
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

  ctx.fillStyle = '#5cb83c';
  for (let i = 0; i < 40; i++) {
    const gx = (i * 53 - cameraX * 0.98) % CANVAS_WIDTH;
    const wrappedGx = ((gx % CANVAS_WIDTH) + CANVAS_WIDTH) % CANVAS_WIDTH;
    ctx.fillRect(wrappedGx, GROUND_Y - 3, 3, 6);
  }

  ctx.fillStyle = GROUND_DARK;
  ctx.fillRect(0, GROUND_Y + 20, CANVAS_WIDTH, 2);
}

function drawCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, alpha: number) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';

  // Main body - overlapping circles to form cloud shape
  const r = w * 0.12;
  const bumps = Math.max(3, Math.floor(w / 30));

  // Bottom row of bumps (the flat-ish base)
  for (let i = 0; i < bumps; i++) {
    const bx = cx + (i / (bumps - 1)) * w * 0.8 + w * 0.1;
    ctx.beginPath();
    ctx.arc(bx, cy + r * 0.3, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Top bumps (the puffy top)
  const topBumps = bumps - 1;
  for (let i = 0; i < topBumps; i++) {
    const bx = cx + ((i + 0.5) / (bumps - 1)) * w * 0.8 + w * 0.1;
    const topR = r * (0.9 + ((i * 7 + 3) % 5) * 0.1);
    ctx.beginPath();
    ctx.arc(bx, cy - r * 0.5, topR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Central big bump
  ctx.beginPath();
  ctx.arc(cx + w * 0.5, cy - r * 0.7, r * 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
}

function drawPlatform(ctx: CanvasRenderingContext2D, p: Platform, cameraX: number) {
  if (p.y === GROUND_Y) return;
  const sx = p.x - cameraX;
  if (sx + p.width < 0 || sx > CANVAS_WIDTH) return;

  // Soft shadow beneath
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#000000';
  drawCloud(ctx, sx + 4, p.y + 8, p.width, 0.08);
  ctx.globalAlpha = 1;

  // Main cloud
  drawCloud(ctx, sx, p.y, p.width, 0.85);

  // Highlight on top
  drawCloud(ctx, sx + 2, p.y - 2, p.width * 0.6, 0.3);
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, cameraX: number, invincible: boolean) {
  const sx = player.pos.x - cameraX;
  let sy = player.pos.y;

  if (invincible && Math.floor(Date.now() / 100) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  // Squash/stretch
  let scaleX = 1;
  let scaleY = 1;
  if (player.squashTimer > 0) {
    // Landing squash
    const t = player.squashTimer / 8;
    scaleX = 1 + t * 0.3;
    scaleY = 1 - t * 0.2;
  } else if (!player.onGround && player.vel.y < -2) {
    // Jumping stretch
    scaleX = 0.85;
    scaleY = 1.15;
  } else if (!player.onGround && player.vel.y > 4) {
    // Falling stretch
    scaleX = 0.9;
    scaleY = 1.1;
  }

  ctx.save();
  const centerX = sx + player.width / 2;
  const bottomY = sy + player.height;
  ctx.translate(centerX, bottomY);

  // Sommersault spin during double jump
  if (player.spinTimer > 0) {
    const spinProgress = 1 - player.spinTimer / 20;
    ctx.rotate(spinProgress * Math.PI * 2 * (player.facingRight ? 1 : -1));
  }

  if (!player.facingRight) {
    ctx.scale(-scaleX, scaleY);
  } else {
    ctx.scale(scaleX, scaleY);
  }
  ctx.translate(-centerX, -bottomY);

  // Arm swing
  const armSwing = player.onGround ? Math.sin(player.frame * 0.8) * 6 : -3;

  // Body
  ctx.fillStyle = '#44aa44';
  ctx.fillRect(sx + 8, sy + 14, 20, 22);

  // Arms
  ctx.fillStyle = '#44aa44';
  ctx.fillRect(sx + 2, sy + 16 + armSwing, 8, 5);
  ctx.fillRect(sx + 26, sy + 16 - armSwing, 8, 5);
  // Hands
  ctx.fillStyle = '#ffcc88';
  ctx.fillRect(sx + 1, sy + 18 + armSwing, 4, 4);
  ctx.fillRect(sx + 31, sy + 18 - armSwing, 4, 4);

  // Head
  ctx.fillStyle = '#ffcc88';
  ctx.fillRect(sx + 10, sy, 16, 16);

  // Eyes (with blink)
  const isBlinking = player.blinkTimer > 175;
  if (isBlinking) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(sx + 14, sy + 7, 3, 1);
    ctx.fillRect(sx + 20, sy + 7, 3, 1);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx + 13, sy + 4, 5, 5);
    ctx.fillRect(sx + 19, sy + 4, 5, 5);
    ctx.fillStyle = '#000000';
    ctx.fillRect(sx + 15, sy + 5, 3, 3);
    ctx.fillRect(sx + 21, sy + 5, 3, 3);
    // Pupils
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx + 16, sy + 5, 1, 1);
    ctx.fillRect(sx + 22, sy + 5, 1, 1);
  }

  // Mouth
  if (!player.onGround && player.vel.y < 0) {
    // Open mouth when jumping
    ctx.fillStyle = '#cc5533';
    ctx.fillRect(sx + 15, sy + 11, 6, 3);
    ctx.fillStyle = '#ffcc88';
    ctx.fillRect(sx + 16, sy + 11, 4, 1);
  } else {
    ctx.fillStyle = '#cc5533';
    ctx.fillRect(sx + 15, sy + 11, 6, 2);
  }

  // Beard
  ctx.fillStyle = '#cc6633';
  ctx.fillRect(sx + 11, sy + 13, 14, 4);
  ctx.fillRect(sx + 13, sy + 17, 10, 2);

  // Hat (leprechaun-style)
  ctx.fillStyle = '#228822';
  ctx.fillRect(sx + 8, sy - 10, 20, 12);
  ctx.fillStyle = '#116611';
  ctx.fillRect(sx + 6, sy - 1, 24, 4);
  // Gold buckle
  ctx.fillStyle = '#ffdd00';
  ctx.fillRect(sx + 13, sy - 8, 10, 5);
  ctx.fillStyle = '#228822';
  ctx.fillRect(sx + 15, sy - 7, 6, 3);

  // Legs (animated run cycle)
  ctx.fillStyle = '#336633';
  if (player.onGround) {
    const legPhase = player.frame * 0.8;
    const leg1 = Math.sin(legPhase) * 5;
    const leg2 = Math.sin(legPhase + Math.PI) * 5;
    ctx.fillRect(sx + 10, sy + 36, 6, 10 + leg1);
    ctx.fillRect(sx + 20, sy + 36, 6, 10 + leg2);
    // Boots
    ctx.fillStyle = '#5c3317';
    ctx.fillRect(sx + 8, sy + 44 + leg1, 10, 4);
    ctx.fillRect(sx + 18, sy + 44 + leg2, 10, 4);
  } else {
    // Jump pose: legs tucked
    if (player.vel.y < 0) {
      ctx.fillRect(sx + 10, sy + 34, 6, 8);
      ctx.fillRect(sx + 20, sy + 34, 6, 8);
      ctx.fillStyle = '#5c3317';
      ctx.fillRect(sx + 8, sy + 40, 10, 4);
      ctx.fillRect(sx + 18, sy + 40, 10, 4);
    } else {
      // Falling: legs spread
      ctx.fillRect(sx + 8, sy + 36, 6, 12);
      ctx.fillRect(sx + 22, sy + 36, 6, 12);
      ctx.fillStyle = '#5c3317';
      ctx.fillRect(sx + 6, sy + 44, 10, 4);
      ctx.fillRect(sx + 20, sy + 44, 10, 4);
    }
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawDragonBase(ctx: CanvasRenderingContext2D, sx: number, sy: number, dragon: Dragon, bodyColor: string, wingColor: string) {
  const facingRight = dragon.type === 'fireball' ? true : dragon.vel.x >= 0;
  const wingFlap = Math.sin(dragon.frame * 0.5) * 8;

  // Wings
  ctx.fillStyle = wingColor;
  if (facingRight) {
    ctx.fillRect(sx - 5, sy - 5 + wingFlap, 20, 12);
    ctx.fillRect(sx + 35, sy - 5 - wingFlap, 20, 12);
  } else {
    ctx.fillRect(sx + 5, sy - 5 - wingFlap, 20, 12);
    ctx.fillRect(sx + 35, sy - 5 + wingFlap, 20, 12);
  }

  // Body
  ctx.fillStyle = bodyColor;
  ctx.fillRect(sx + 10, sy, 40, 25);

  // Head
  ctx.fillStyle = bodyColor;
  if (facingRight) {
    ctx.fillRect(sx + 45, sy - 3, 18, 20);
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(sx + 55, sy + 2, 4, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 56, sy + 3, 2, 2);
  } else {
    ctx.fillRect(sx - 3, sy - 3, 18, 20);
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(sx + 1, sy + 2, 4, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 2, sy + 3, 2, 2);
  }

  // Tail
  ctx.fillStyle = wingColor;
  if (facingRight) {
    ctx.fillRect(sx, sy + 8, 12, 8);
    ctx.fillRect(sx - 6, sy + 5, 8, 6);
  } else {
    ctx.fillRect(sx + 38, sy + 8, 12, 8);
    ctx.fillRect(sx + 58, sy + 5, 8, 6);
  }

  // Belly
  ctx.fillStyle = '#ff9966';
  ctx.fillRect(sx + 18, sy + 15, 24, 8);
}

function drawDragon(ctx: CanvasRenderingContext2D, dragon: Dragon, cameraX: number) {
  const sx = dragon.pos.x - cameraX;
  const sy = dragon.pos.y;
  if (sx + dragon.width < -20 || sx > CANVAS_WIDTH + 20) return;

  if (!dragon.alive) {
    // Death animation - tumbling and fading
    ctx.globalAlpha = dragon.deathTimer / 40;
    ctx.save();
    ctx.translate(sx + 30, sy + 20);
    ctx.rotate((40 - dragon.deathTimer) * 0.15);
    ctx.translate(-(sx + 30), -(sy + 20));
    drawDragonBase(ctx, sx, sy, dragon, '#888', '#666');
    ctx.restore();
    ctx.globalAlpha = 1;
    return;
  }

  const facingRight = dragon.type === 'fireball' ? true : dragon.vel.x >= 0;

  switch (dragon.type) {
    case 'patrol':
      drawDragonBase(ctx, sx, sy, dragon, '#dd3333', '#cc2222');
      // Flame
      if (dragon.frame % 8 < 4) {
        if (facingRight) {
          ctx.fillStyle = '#ff8800';
          ctx.fillRect(sx + 63, sy + 5, 10, 6);
          ctx.fillStyle = '#ffcc00';
          ctx.fillRect(sx + 68, sy + 7, 8, 3);
        } else {
          ctx.fillStyle = '#ff8800';
          ctx.fillRect(sx - 13, sy + 5, 10, 6);
          ctx.fillStyle = '#ffcc00';
          ctx.fillRect(sx - 16, sy + 7, 8, 3);
        }
      }
      break;

    case 'swooper':
      // Purple swooping dragon
      drawDragonBase(ctx, sx, sy, dragon, '#9933cc', '#7722aa');
      // Speed lines when diving
      if (Math.abs(dragon.pos.y - dragon.startY) > 40) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#cc88ff';
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(sx + 15 + i * 12, sy - 8 - i * 3, 2, 6);
        }
        ctx.globalAlpha = 1;
      }
      break;

    case 'fireball':
      // Dark red fireball dragon with glowing mouth
      drawDragonBase(ctx, sx, sy, dragon, '#aa2200', '#881100');
      // Glowing charging effect
      const charge = dragon.fireballCooldown < 30;
      if (charge) {
        ctx.fillStyle = '#ff4400';
        ctx.globalAlpha = 0.6 + Math.sin(dragon.frame * 0.5) * 0.3;
        ctx.beginPath();
        ctx.arc(sx + 58, sy + 8, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // Constant flame
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(sx + 63, sy + 3, 14, 8);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(sx + 70, sy + 5, 10, 4);
      break;

    case 'hoverer':
      // Green hovering dragon
      drawDragonBase(ctx, sx, sy, dragon, '#33aa55', '#228844');
      // Hover particles
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#66ffaa';
      const t = dragon.frame * 0.2;
      ctx.fillRect(sx + 20, sy + 28 + Math.sin(t) * 3, 3, 3);
      ctx.fillRect(sx + 35, sy + 30 + Math.sin(t + 2) * 3, 2, 2);
      ctx.globalAlpha = 1;
      break;
  }
}

function drawFireball(ctx: CanvasRenderingContext2D, fb: Fireball, cameraX: number) {
  const sx = fb.pos.x - cameraX;
  const sy = fb.pos.y;
  if (sx < -20 || sx > CANVAS_WIDTH + 20) return;

  // Core
  ctx.fillStyle = '#ff4400';
  ctx.beginPath();
  ctx.arc(sx + 6, sy + 4, 6, 0, Math.PI * 2);
  ctx.fill();

  // Inner glow
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(sx + 6, sy + 4, 3, 0, Math.PI * 2);
  ctx.fill();

  // Trail
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(sx - 4 - fb.vel.x * 2, sy + 1, 8, 6);
  ctx.globalAlpha = 0.25;
  ctx.fillRect(sx - 8 - fb.vel.x * 3, sy + 2, 6, 4);
  ctx.globalAlpha = 1;
}

function drawTiger(ctx: CanvasRenderingContext2D, tiger: Tiger, cameraX: number) {
  const sx = tiger.pos.x - cameraX;
  const sy = tiger.pos.y;
  if (sx + tiger.width < -10 || sx > CANVAS_WIDTH + 10) return;

  const facingRight = tiger.vel.x > 0;

  if (!tiger.alive) {
    // Squished flat death animation
    ctx.globalAlpha = tiger.deathTimer / 30;
    ctx.fillStyle = '#e8912a';
    ctx.fillRect(sx + 4, sy + tiger.height - 8, tiger.width - 8, 8);
    ctx.fillStyle = '#cc7a1e';
    // Stripes on squished body
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(sx + 12 + i * 10, sy + tiger.height - 7, 4, 6);
    }
    ctx.globalAlpha = 1;
    return;
  }

  const legAnim = Math.sin(tiger.frame * 0.7) * 3;

  // Tail
  ctx.fillStyle = '#e8912a';
  if (facingRight) {
    ctx.fillRect(sx - 4, sy + 4, 10, 5);
    ctx.fillRect(sx - 8, sy + 1, 6, 5);
  } else {
    ctx.fillRect(sx + tiger.width - 6, sy + 4, 10, 5);
    ctx.fillRect(sx + tiger.width + 2, sy + 1, 6, 5);
  }

  // Legs
  ctx.fillStyle = '#d4800e';
  ctx.fillRect(sx + 6, sy + 22, 6, 10 + legAnim);
  ctx.fillRect(sx + 16, sy + 22, 6, 10 - legAnim);
  ctx.fillRect(sx + 26, sy + 22, 6, 10 + legAnim);
  ctx.fillRect(sx + 36, sy + 22, 6, 10 - legAnim);

  // Paws
  ctx.fillStyle = '#fff5e0';
  ctx.fillRect(sx + 5, sy + 28 + legAnim, 8, 4);
  ctx.fillRect(sx + 15, sy + 28 - legAnim, 8, 4);
  ctx.fillRect(sx + 25, sy + 28 + legAnim, 8, 4);
  ctx.fillRect(sx + 35, sy + 28 - legAnim, 8, 4);

  // Body
  ctx.fillStyle = '#e8912a';
  ctx.fillRect(sx + 4, sy + 4, 40, 20);

  // Stripes
  ctx.fillStyle = '#cc6600';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(sx + 10 + i * 9, sy + 6, 4, 16);
  }

  // Belly
  ctx.fillStyle = '#fff5e0';
  ctx.fillRect(sx + 10, sy + 16, 28, 7);

  // Head
  ctx.fillStyle = '#e8912a';
  if (facingRight) {
    ctx.fillRect(sx + 36, sy - 2, 16, 18);
    // Ears
    ctx.fillRect(sx + 38, sy - 6, 5, 5);
    ctx.fillRect(sx + 46, sy - 6, 5, 5);
    ctx.fillStyle = '#ffb8d0';
    ctx.fillRect(sx + 39, sy - 5, 3, 3);
    ctx.fillRect(sx + 47, sy - 5, 3, 3);
    // Face
    ctx.fillStyle = '#fff5e0';
    ctx.fillRect(sx + 40, sy + 6, 10, 8);
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 41, sy + 2, 3, 3);
    ctx.fillRect(sx + 47, sy + 2, 3, 3);
    // Nose
    ctx.fillStyle = '#ff6688';
    ctx.fillRect(sx + 46, sy + 7, 4, 3);
    // Whiskers
    ctx.fillStyle = '#ccc';
    ctx.fillRect(sx + 50, sy + 6, 6, 1);
    ctx.fillRect(sx + 50, sy + 10, 6, 1);
  } else {
    ctx.fillRect(sx - 4, sy - 2, 16, 18);
    ctx.fillRect(sx - 3, sy - 6, 5, 5);
    ctx.fillRect(sx + 5, sy - 6, 5, 5);
    ctx.fillStyle = '#ffb8d0';
    ctx.fillRect(sx - 2, sy - 5, 3, 3);
    ctx.fillRect(sx + 6, sy - 5, 3, 3);
    ctx.fillStyle = '#fff5e0';
    ctx.fillRect(sx - 2, sy + 6, 10, 8);
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 2, sy + 2, 3, 3);
    ctx.fillRect(sx + 8, sy + 2, 3, 3);
    ctx.fillStyle = '#ff6688';
    ctx.fillRect(sx - 2, sy + 7, 4, 3);
    ctx.fillStyle = '#ccc';
    ctx.fillRect(sx - 8, sy + 6, 6, 1);
    ctx.fillRect(sx - 8, sy + 10, 6, 1);
  }
}

function drawRhino(ctx: CanvasRenderingContext2D, rhino: Rhino, cameraX: number) {
  const sx = rhino.pos.x - cameraX;
  const sy = rhino.pos.y;
  if (sx + rhino.width < -20 || sx > CANVAS_WIDTH + 20) return;

  const facingRight = rhino.vel.x > 0;

  if (!rhino.alive) {
    // Death animation - tips over and fades
    ctx.globalAlpha = rhino.deathTimer / 60;
    ctx.save();
    ctx.translate(sx + 40, sy + rhino.height);
    ctx.rotate((60 - rhino.deathTimer) * 0.02);
    ctx.translate(-(sx + 40), -(sy + rhino.height));
    drawRhinoBody(ctx, sx, sy, rhino, facingRight);
    ctx.restore();
    ctx.globalAlpha = 1;
    return;
  }

  // Flash when invincible after hit
  if (rhino.invincibleTimer > 0 && Math.floor(rhino.invincibleTimer / 4) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  drawRhinoBody(ctx, sx, sy, rhino, facingRight);
  ctx.globalAlpha = 1;

  // Health bar above rhino
  const barWidth = 40;
  const barX = sx + (rhino.width - barWidth) / 2;
  const barY = sy - 14;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(barX - 1, barY - 1, barWidth + 2, 8);
  for (let i = 0; i < rhino.maxHitPoints; i++) {
    const segW = (barWidth - 4) / rhino.maxHitPoints;
    ctx.fillStyle = i < rhino.hitPoints ? '#ff3333' : '#333333';
    ctx.fillRect(barX + 2 + i * (segW + 1), barY + 1, segW - 1, 4);
  }
}

function drawRhinoBody(ctx: CanvasRenderingContext2D, sx: number, sy: number, rhino: Rhino, facingRight: boolean) {
  const legAnim = Math.sin(rhino.frame * 0.6) * 4;
  // Gets angrier (redder) as health drops
  const anger = (rhino.maxHitPoints - rhino.hitPoints) / rhino.maxHitPoints;
  const r = Math.floor(100 + anger * 100);
  const g = Math.floor(100 - anger * 40);
  const b = Math.floor(100 - anger * 40);
  const bodyColor = `rgb(${r},${g},${b})`;
  const darkColor = `rgb(${r - 20},${g - 20},${b - 20})`;

  // Legs
  ctx.fillStyle = darkColor;
  ctx.fillRect(sx + 10, sy + 36, 10, 14 + legAnim);
  ctx.fillRect(sx + 25, sy + 36, 10, 14 - legAnim);
  ctx.fillRect(sx + 45, sy + 36, 10, 14 + legAnim);
  ctx.fillRect(sx + 60, sy + 36, 10, 14 - legAnim);

  // Hooves
  ctx.fillStyle = '#444';
  ctx.fillRect(sx + 9, sy + 46 + legAnim, 12, 4);
  ctx.fillRect(sx + 24, sy + 46 - legAnim, 12, 4);
  ctx.fillRect(sx + 44, sy + 46 + legAnim, 12, 4);
  ctx.fillRect(sx + 59, sy + 46 - legAnim, 12, 4);

  // Body (large barrel shape)
  ctx.fillStyle = bodyColor;
  ctx.fillRect(sx + 5, sy + 10, 70, 30);

  // Belly
  ctx.fillStyle = `rgb(${r + 30},${g + 30},${b + 30})`;
  ctx.fillRect(sx + 15, sy + 28, 50, 10);

  // Head
  ctx.fillStyle = bodyColor;
  if (facingRight) {
    ctx.fillRect(sx + 62, sy + 4, 22, 28);
    // Horn
    ctx.fillStyle = '#ddd';
    ctx.fillRect(sx + 78, sy + 2, 6, 4);
    ctx.fillRect(sx + 82, sy - 2, 4, 6);
    // Ear
    ctx.fillStyle = darkColor;
    ctx.fillRect(sx + 64, sy, 6, 8);
    // Eye
    ctx.fillStyle = anger > 0.3 ? '#ff0000' : '#000';
    ctx.fillRect(sx + 72, sy + 10, 5, 5);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx + 74, sy + 10, 2, 2);
    // Nostril
    ctx.fillStyle = '#555';
    ctx.fillRect(sx + 80, sy + 20, 3, 3);
  } else {
    ctx.fillRect(sx - 4, sy + 4, 22, 28);
    // Horn
    ctx.fillStyle = '#ddd';
    ctx.fillRect(sx - 4, sy + 2, 6, 4);
    ctx.fillRect(sx - 6, sy - 2, 4, 6);
    // Ear
    ctx.fillStyle = darkColor;
    ctx.fillRect(sx + 10, sy, 6, 8);
    // Eye
    ctx.fillStyle = anger > 0.3 ? '#ff0000' : '#000';
    ctx.fillRect(sx + 3, sy + 10, 5, 5);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx + 4, sy + 10, 2, 2);
    // Nostril
    ctx.fillStyle = '#555';
    ctx.fillRect(sx - 3, sy + 20, 3, 3);
  }

  // Tail
  ctx.fillStyle = darkColor;
  if (facingRight) {
    ctx.fillRect(sx - 2, sy + 14, 8, 4);
    ctx.fillRect(sx - 6, sy + 12, 5, 3);
  } else {
    ctx.fillRect(sx + 74, sy + 14, 8, 4);
    ctx.fillRect(sx + 81, sy + 12, 5, 3);
  }
}

function drawChest(ctx: CanvasRenderingContext2D, chest: GoldChest, cameraX: number, unlocked: boolean) {
  const sx = chest.pos.x - cameraX;
  const sy = chest.pos.y;
  if (sx + chest.width < 0 || sx > CANVAS_WIDTH) return;

  if (unlocked) {
    // Golden glow when unlocked
    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(sx + 25, sy + 15, 45 + Math.sin(chest.frame * 0.1) * 8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Dim red glow when locked
    ctx.fillStyle = 'rgba(255, 50, 50, 0.1)';
    ctx.beginPath();
    ctx.arc(sx + 25, sy + 15, 35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Chest body
  ctx.fillStyle = unlocked ? '#8B4513' : '#5a3010';
  ctx.fillRect(sx, sy + 15, 50, 35);

  // Chest lid
  ctx.fillStyle = unlocked ? '#A0522D' : '#4a2508';
  ctx.fillRect(sx - 2, sy + 5, 54, 15);

  // Gold trim
  ctx.fillStyle = unlocked ? '#FFD700' : '#888866';
  ctx.fillRect(sx + 5, sy + 12, 40, 3);
  ctx.fillRect(sx + 20, sy + 5, 10, 15);

  if (unlocked) {
    // Keyhole open
    ctx.fillRect(sx + 22, sy + 20, 6, 8);

    // Gold coins peeking out
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(sx + 15, sy + 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 35, sy + 6, 4, 0, Math.PI * 2);
    ctx.fill();

    // Sparkles
    const sparkle = Math.sin(chest.frame * 0.15);
    if (sparkle > 0.5) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx + 10 + sparkle * 10, sy - 2, 3, 3);
      ctx.fillRect(sx + 35 - sparkle * 5, sy + 2, 2, 2);
    }
  } else {
    // Lock/padlock
    ctx.fillStyle = '#888888';
    ctx.fillRect(sx + 21, sy + 22, 8, 10);
    // Lock shackle
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx + 25, sy + 22, 5, Math.PI, 0);
    ctx.stroke();
    // Chains across
    ctx.strokeStyle = '#777777';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy + 28);
    ctx.lineTo(sx + 50, sy + 28);
    ctx.stroke();
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, lives: number, score: number) {
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Lives:', 15, 30);
  for (let i = 0; i < lives; i++) {
    ctx.fillStyle = '#ff3366';
    ctx.fillRect(80 + i * 25, 18, 10, 10);
    ctx.fillRect(85 + i * 25, 14, 10, 10);
    ctx.fillRect(82 + i * 25, 24, 14, 4);
  }

  ctx.fillStyle = '#FFD700';
  ctx.textAlign = 'right';
  ctx.fillText(`Score: ${score}`, CANVAS_WIDTH - 15, 30);
}

function drawEnemyBar(ctx: CanvasRenderingContext2D, totalEnemies: number, chestUnlocked: boolean, aliveEnemies: number) {
  const barWidth = 300;
  const barX = 250;
  const barY = 12;
  const killed = totalEnemies - aliveEnemies;
  const progress = totalEnemies > 0 ? killed / totalEnemies : 0;

  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Enemies: ${killed}/${totalEnemies}`, barX + barWidth / 2, barY - 1);

  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(barX, barY + 2, barWidth, 8);

  // Rainbow progress bar
  const filledWidth = barWidth * progress;
  if (filledWidth > 0) {
    const gradient = ctx.createLinearGradient(barX, 0, barX + filledWidth, 0);
    RAINBOW_COLORS.forEach((color, i) => {
      gradient.addColorStop(i / (RAINBOW_COLORS.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY + 2, filledWidth, 8);
  }

  // Chest icon at end
  if (chestUnlocked) {
    ctx.fillStyle = '#FFD700';
  } else {
    ctx.fillStyle = '#888866';
  }
  ctx.fillRect(barX + barWidth + 4, barY, 10, 10);
}

function drawOverlay(ctx: CanvasRenderingContext2D, state: string, score: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';

  if (state === 'start') {
    // Rainbow title
    const title = 'Over the Rainbow';
    ctx.font = 'bold 48px monospace';
    const titleX = CANVAS_WIDTH / 2;
    const titleY = 140;
    // Each letter a rainbow color
    let offsetX = titleX - ctx.measureText(title).width / 2;
    for (let i = 0; i < title.length; i++) {
      ctx.fillStyle = RAINBOW_COLORS[i % RAINBOW_COLORS.length];
      ctx.fillText(title[i], offsetX, titleY);
      offsetX += ctx.measureText(title[i]).width;
    }

    ctx.fillStyle = '#44aa44';
    ctx.font = 'bold 28px monospace';
    ctx.fillText("Patrick's Quest for Gold", CANVAS_WIDTH / 2, 200);

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.fillText('Press SPACE or Tap to Start', CANVAS_WIDTH / 2, 280);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '14px monospace';
    ctx.fillText('Arrows/WASD = Move  |  SPACE = Jump', CANVAS_WIDTH / 2, 330);
    ctx.fillText('Stomp all enemies to unlock the gold!', CANVAS_WIDTH / 2, 355);
  } else if (state === 'gameover') {
    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('Game Over', CANVAS_WIDTH / 2, 160);

    ctx.fillStyle = '#FFD700';
    ctx.font = '24px monospace';
    ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, 230);

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.fillText('Press SPACE or Tap to Try Again', CANVAS_WIDTH / 2, 310);
  } else if (state === 'win') {
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 44px monospace';
    ctx.fillText('You Found the Gold!', CANVAS_WIDTH / 2, 140);

    ctx.fillStyle = '#44aa44';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('Patrick is Rich!', CANVAS_WIDTH / 2, 200);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px monospace';
    ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, 260);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '20px monospace';
    ctx.fillText('Press SPACE or Tap to Play Again', CANVAS_WIDTH / 2, 330);
  }
}

export function render(ctx: CanvasRenderingContext2D, game: GameData) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawSky(ctx);
  drawRainbow(ctx, game.cameraX);
  drawBackgroundClouds(ctx, game.cameraX);
  drawGround(ctx, game.cameraX);

  for (const p of game.platforms) {
    drawPlatform(ctx, p, game.cameraX);
  }

  drawChest(ctx, game.chest, game.cameraX, game.chestUnlocked);

  for (const t of game.tigers) {
    drawTiger(ctx, t, game.cameraX);
  }

  if (game.rhino) {
    drawRhino(ctx, game.rhino, game.cameraX);
  }

  for (const fb of game.fireballs) {
    drawFireball(ctx, fb, game.cameraX);
  }

  for (const d of game.dragons) {
    drawDragon(ctx, d, game.cameraX);
  }

  drawPlayer(ctx, game.player, game.cameraX, game.invincibleTimer > 0);

  drawHUD(ctx, game.lives, game.score);
  const aliveEnemies = game.dragons.filter(d => d.alive).length + game.tigers.filter(t => t.alive).length + (game.rhino && game.rhino.alive ? 1 : 0);
  drawEnemyBar(ctx, game.totalEnemies, game.chestUnlocked, aliveEnemies);

  if (game.state !== 'playing') {
    drawOverlay(ctx, game.state, game.score);
  }
}
