export interface Vec2 {
  x: number;
  y: number;
}

export type DragonType = 'patrol' | 'swooper' | 'fireball' | 'hoverer';

export interface Player {
  pos: Vec2;
  vel: Vec2;
  width: number;
  height: number;
  onGround: boolean;
  facingRight: boolean;
  frame: number;
  frameTimer: number;
  squashTimer: number;
  blinkTimer: number;
  hasDoubleJumped: boolean;
  spinTimer: number;
}

export interface Fireball {
  pos: Vec2;
  vel: Vec2;
  width: number;
  height: number;
  life: number;
}

export interface Dragon {
  pos: Vec2;
  vel: Vec2;
  width: number;
  height: number;
  frame: number;
  frameTimer: number;
  startX: number;
  startY: number;
  range: number;
  type: DragonType;
  swoopTimer: number;
  fireballCooldown: number;
  alive: boolean;
  deathTimer: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface Tiger {
  pos: Vec2;
  vel: Vec2;
  width: number;
  height: number;
  frame: number;
  frameTimer: number;
  startX: number;
  range: number;
  alive: boolean;
  deathTimer: number;
}

export interface Rhino {
  pos: Vec2;
  vel: Vec2;
  width: number;
  height: number;
  frame: number;
  frameTimer: number;
  startX: number;
  range: number;
  hitPoints: number;
  maxHitPoints: number;
  alive: boolean;
  deathTimer: number;
  invincibleTimer: number;
}

export interface GoldChest {
  pos: Vec2;
  width: number;
  height: number;
  frame: number;
  frameTimer: number;
}

export type GameState = 'start' | 'playing' | 'gameover' | 'win';

export interface GameData {
  state: GameState;
  player: Player;
  dragons: Dragon[];
  fireballs: Fireball[];
  tigers: Tiger[];
  rhino: Rhino | null;
  platforms: Platform[];
  chest: GoldChest;
  lives: number;
  score: number;
  cameraX: number;
  levelWidth: number;
  invincibleTimer: number;
  totalEnemies: number;
  chestUnlocked: boolean;
}

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;
export const GRAVITY = 0.6;
export const JUMP_FORCE = -13;
export const PLAYER_SPEED = 4.5;
export const GROUND_Y = 380;

export const RAINBOW_COLORS = ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0077ff', '#8b00ff'];
