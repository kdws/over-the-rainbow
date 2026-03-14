import type { GameData, Fireball } from './types';
import { GRAVITY, JUMP_FORCE, PLAYER_SPEED, CANVAS_WIDTH, GROUND_Y } from './types';
import { createPlayer, createDragons, createPlatforms, createChest, createTigers, createRhino, LEVEL_WIDTH } from './level';
import { playJump, playHit, playTreasure, playGameOver, playStomp, initAudio } from './audio';

function countAliveEnemies(game: GameData): number {
  const aliveDragons = game.dragons.filter(d => d.alive).length;
  const aliveTigers = game.tigers.filter(t => t.alive).length;
  const rhinoAlive = game.rhino && game.rhino.alive ? 1 : 0;
  return aliveDragons + aliveTigers + rhinoAlive;
}

export function createGameData(): GameData {
  const dragons = createDragons();
  const tigers = createTigers();
  const rhino = createRhino();
  const totalEnemies = dragons.length + tigers.length + 1; // +1 for rhino
  return {
    state: 'start',
    player: createPlayer(),
    dragons,
    fireballs: [],
    tigers,
    rhino,
    platforms: createPlatforms(),
    chest: createChest(),
    lives: 3,
    score: 0,
    cameraX: 0,
    levelWidth: LEVEL_WIDTH,
    invincibleTimer: 0,
    totalEnemies,
    chestUnlocked: false,
  };
}

export function resetGame(_game: GameData): GameData {
  return {
    ...createGameData(),
    state: 'playing',
  };
}

function respawnPlayer(game: GameData): void {
  game.player.pos.x = Math.max(0, game.player.pos.x - 200);
  game.player.pos.y = GROUND_Y - game.player.height;
  game.player.vel.x = 0;
  game.player.vel.y = 0;
  game.player.onGround = true;
  game.player.squashTimer = 0;
  game.player.hasDoubleJumped = false;
  game.player.spinTimer = 0;
  game.invincibleTimer = 120;
}

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function handlePlayerHit(game: GameData): boolean {
  game.lives--;
  playHit();
  if (game.lives <= 0) {
    game.state = 'gameover';
    playGameOver();
    return true;
  }
  respawnPlayer(game);
  return false;
}

export function update(game: GameData, keys: Set<string>): GameData {
  if (game.state !== 'playing') {
    if (keys.has(' ')) {
      initAudio();
      if (game.state === 'start') {
        game.state = 'playing';
      } else {
        return resetGame(game);
      }
      keys.delete(' ');
    }
    game.chest.frame++;
    return game;
  }

  const player = game.player;

  // Arrow key movement
  player.vel.x = 0;
  if (keys.has('ArrowRight') || keys.has('d')) {
    player.vel.x = PLAYER_SPEED;
    player.facingRight = true;
  }
  if (keys.has('ArrowLeft') || keys.has('a')) {
    player.vel.x = -PLAYER_SPEED;
    player.facingRight = false;
  }

  // Jump / Double jump
  if (keys.has(' ') || keys.has('ArrowUp') || keys.has('w')) {
    if (player.onGround) {
      player.vel.y = JUMP_FORCE;
      player.onGround = false;
      player.hasDoubleJumped = false;
      playJump();
    } else if (!player.hasDoubleJumped) {
      player.vel.y = JUMP_FORCE * 0.85;
      player.hasDoubleJumped = true;
      player.spinTimer = 20;
      playJump();
    }
    keys.delete(' ');
    keys.delete('ArrowUp');
    keys.delete('w');
  }

  // Apply gravity
  player.vel.y += GRAVITY;

  // Move player
  player.pos.x += player.vel.x;
  player.pos.y += player.vel.y;

  // Clamp to level bounds
  if (player.pos.x < 0) player.pos.x = 0;
  if (player.pos.x > LEVEL_WIDTH - player.width) player.pos.x = LEVEL_WIDTH - player.width;

  // Animation frame (only when moving)
  if (Math.abs(player.vel.x) > 0.1) {
    player.frameTimer++;
    if (player.frameTimer > 6) {
      player.frame++;
      player.frameTimer = 0;
    }
  }

  // Blink timer
  player.blinkTimer++;
  if (player.blinkTimer > 180) {
    player.blinkTimer = 0;
  }

  // Squash timer
  if (player.squashTimer > 0) {
    player.squashTimer--;
  }

  // Spin timer (double jump sommersault)
  if (player.spinTimer > 0) {
    player.spinTimer--;
  }

  // Platform collision
  const wasOnGround = player.onGround;
  player.onGround = false;
  for (const plat of game.platforms) {
    if (
      player.vel.y >= 0 &&
      rectsOverlap(
        player.pos.x + 4, player.pos.y + player.height - 4, player.width - 8, 8,
        plat.x, plat.y, plat.width, plat.height,
      )
    ) {
      if (player.pos.y + player.height - player.vel.y <= plat.y + 5) {
        player.pos.y = plat.y - player.height;
        player.vel.y = 0;
        player.onGround = true;
        player.hasDoubleJumped = false;
        player.spinTimer = 0;
        if (!wasOnGround) {
          player.squashTimer = 8;
        }
      }
    }
  }

  // Fall off screen
  if (player.pos.y > 500) {
    if (handlePlayerHit(game)) return game;
  }

  // Invincibility countdown
  if (game.invincibleTimer > 0) {
    game.invincibleTimer--;
  }

  // Update dragons
  game.dragons = game.dragons.filter(dragon => {
    if (!dragon.alive) {
      dragon.deathTimer--;
      dragon.pos.y += 3;
      return dragon.deathTimer > 0;
    }

    dragon.frameTimer++;
    if (dragon.frameTimer > 4) {
      dragon.frame++;
      dragon.frameTimer = 0;
    }

    switch (dragon.type) {
      case 'patrol':
        dragon.pos.x += dragon.vel.x;
        if (dragon.pos.x > dragon.startX + dragon.range) {
          dragon.vel.x = -Math.abs(dragon.vel.x);
        } else if (dragon.pos.x < dragon.startX - dragon.range) {
          dragon.vel.x = Math.abs(dragon.vel.x);
        }
        break;

      case 'swooper':
        dragon.pos.x += dragon.vel.x;
        dragon.swoopTimer += 0.03;
        dragon.pos.y = dragon.startY + Math.sin(dragon.swoopTimer) * 120;
        if (dragon.pos.x > dragon.startX + dragon.range) {
          dragon.vel.x = -Math.abs(dragon.vel.x);
        } else if (dragon.pos.x < dragon.startX - dragon.range) {
          dragon.vel.x = Math.abs(dragon.vel.x);
        }
        break;

      case 'fireball':
        dragon.fireballCooldown--;
        if (dragon.fireballCooldown <= 0) {
          const dx = player.pos.x - dragon.pos.x;
          const dy = player.pos.y - dragon.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 500) {
            const speed = 4;
            game.fireballs.push({
              pos: { x: dragon.pos.x + 30, y: dragon.pos.y + 15 },
              vel: { x: (dx / dist) * speed, y: (dy / dist) * speed },
              width: 12,
              height: 8,
              life: 120,
            });
          }
          dragon.fireballCooldown = 90 + Math.floor(Math.random() * 60);
        }
        break;

      case 'hoverer':
        dragon.pos.x += dragon.vel.x;
        dragon.swoopTimer += 0.05;
        dragon.pos.y = dragon.startY + Math.sin(dragon.swoopTimer) * 40;
        if (dragon.pos.x > dragon.startX + dragon.range) {
          dragon.vel.x = -Math.abs(dragon.vel.x);
        } else if (dragon.pos.x < dragon.startX - dragon.range) {
          dragon.vel.x = Math.abs(dragon.vel.x);
        }
        break;
    }

    // Dragon collision
    if (
      game.invincibleTimer <= 0 &&
      rectsOverlap(
        player.pos.x + 6, player.pos.y + 4, player.width - 12, player.height - 8,
        dragon.pos.x, dragon.pos.y, dragon.width, dragon.height,
      )
    ) {
      const playerBottom = player.pos.y + player.height;
      const dragonTop = dragon.pos.y;
      const isAbove = playerBottom - player.vel.y <= dragonTop + 12;
      const isFalling = player.vel.y > 0;

      if (isAbove && isFalling) {
        dragon.alive = false;
        dragon.deathTimer = 40;
        dragon.vel.x = 0;
        player.vel.y = JUMP_FORCE * 0.6;
        game.score += 100;
        playStomp();
      } else {
        if (handlePlayerHit(game)) return false;
      }
    }

    return true;
  });

  // Update fireballs
  game.fireballs = game.fireballs.filter((fb: Fireball) => {
    fb.pos.x += fb.vel.x;
    fb.pos.y += fb.vel.y;
    fb.life--;

    if (
      game.invincibleTimer <= 0 &&
      rectsOverlap(
        player.pos.x + 6, player.pos.y + 4, player.width - 12, player.height - 8,
        fb.pos.x, fb.pos.y, fb.width, fb.height,
      )
    ) {
      if (handlePlayerHit(game)) return false;
      return false;
    }

    return fb.life > 0;
  });

  // Update tigers
  game.tigers = game.tigers.filter(tiger => {
    if (!tiger.alive) {
      tiger.deathTimer--;
      return tiger.deathTimer > 0;
    }

    tiger.pos.x += tiger.vel.x;
    tiger.frameTimer++;
    if (tiger.frameTimer > 5) {
      tiger.frame++;
      tiger.frameTimer = 0;
    }

    if (tiger.pos.x > tiger.startX + tiger.range) {
      tiger.vel.x = -Math.abs(tiger.vel.x);
    } else if (tiger.pos.x < tiger.startX - tiger.range) {
      tiger.vel.x = Math.abs(tiger.vel.x);
    }

    if (
      game.invincibleTimer <= 0 &&
      rectsOverlap(
        player.pos.x + 6, player.pos.y + 4, player.width - 12, player.height - 8,
        tiger.pos.x, tiger.pos.y, tiger.width, tiger.height,
      )
    ) {
      const playerBottom = player.pos.y + player.height;
      const tigerTop = tiger.pos.y;
      const isAbove = playerBottom - player.vel.y <= tigerTop + 10;
      const isFalling = player.vel.y > 0;

      if (isAbove && isFalling) {
        tiger.alive = false;
        tiger.deathTimer = 30;
        tiger.vel.x = 0;
        player.vel.y = JUMP_FORCE * 0.6;
        game.score += 50;
        playStomp();
      } else {
        if (handlePlayerHit(game)) return false;
      }
    }

    return true;
  });

  // Update rhino boss
  if (game.rhino) {
    const rhino = game.rhino;
    if (!rhino.alive) {
      rhino.deathTimer--;
      if (rhino.deathTimer <= 0) {
        game.rhino = null;
      }
    } else {
      // Invincibility cooldown after being stomped
      if (rhino.invincibleTimer > 0) {
        rhino.invincibleTimer--;
      }

      // Movement - gets faster as health drops
      const speedMult = 1 + (rhino.maxHitPoints - rhino.hitPoints) * 0.5;
      rhino.pos.x += rhino.vel.x * speedMult;

      rhino.frameTimer++;
      if (rhino.frameTimer > 4) {
        rhino.frame++;
        rhino.frameTimer = 0;
      }

      if (rhino.pos.x > rhino.startX + rhino.range) {
        rhino.vel.x = -Math.abs(rhino.vel.x);
      } else if (rhino.pos.x < rhino.startX - rhino.range) {
        rhino.vel.x = Math.abs(rhino.vel.x);
      }

      // Collision with player
      if (
        game.invincibleTimer <= 0 &&
        rectsOverlap(
          player.pos.x + 6, player.pos.y + 4, player.width - 12, player.height - 8,
          rhino.pos.x, rhino.pos.y, rhino.width, rhino.height,
        )
      ) {
        const playerBottom = player.pos.y + player.height;
        const rhinoTop = rhino.pos.y;
        const isAbove = playerBottom - player.vel.y <= rhinoTop + 14;
        const isFalling = player.vel.y > 0;

        if (isAbove && isFalling && rhino.invincibleTimer <= 0) {
          rhino.hitPoints--;
          player.vel.y = JUMP_FORCE * 0.7;
          playStomp();

          if (rhino.hitPoints <= 0) {
            rhino.alive = false;
            rhino.deathTimer = 60;
            rhino.vel.x = 0;
            game.score += 500;
          } else {
            rhino.invincibleTimer = 60;
            game.score += 100;
          }
        } else if (rhino.invincibleTimer <= 0) {
          if (handlePlayerHit(game)) return game;
        }
      }
    }
  }

  // Check if all enemies are dead -> unlock chest
  const aliveCount = countAliveEnemies(game);
  game.chestUnlocked = aliveCount === 0;

  // Score: kills + distance bonus
  game.score = Math.max(game.score, (game.totalEnemies - aliveCount) * 75 + Math.floor(player.pos.x / 20));

  // Chest collision (win) - only if unlocked
  if (
    game.chestUnlocked &&
    rectsOverlap(
      player.pos.x, player.pos.y, player.width, player.height,
      game.chest.pos.x, game.chest.pos.y, game.chest.width, game.chest.height,
    )
  ) {
    game.score += 1000;
    game.state = 'win';
    playTreasure();
    return game;
  }

  game.chest.frame++;

  // Camera follows player (centered)
  const targetCameraX = player.pos.x - CANVAS_WIDTH * 0.5 + player.width / 2;
  game.cameraX += (targetCameraX - game.cameraX) * 0.1;
  game.cameraX = Math.max(0, Math.min(game.cameraX, LEVEL_WIDTH - CANVAS_WIDTH));

  return game;
}
