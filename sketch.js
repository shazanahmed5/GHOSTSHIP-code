let ghosts = [], bits = [];
let score = 0, combo = 0, lives = 3, best = 0;
let duration = 30, startTime = 0, lastSpawn = 0, shake = 0;
let state = 'start';

function setup() {
  createCanvas(480, 360);
  textFont('Georgia');
}

function elapsed() {
  return (millis() - startTime) / 1000;
}

function startGame() {
  ghosts = []; bits = [];
  score = 0; combo = 0; lives = 3;
  startTime = millis(); lastSpawn = 0;
  state = 'play';
}

function endGame() {
  state = 'over';
  best = max(best, score);
}

function spawnGhost() {
  const e = elapsed();
  ghosts.push({
    x: random(40, width - 40),
    y: random(60, height - 40),
    r: 30,
    born: millis(),
    life: max(700, random(1300, 1900) - e * 25),
    evil: random() < 0.2 + min(0.15, e * 0.005),
    seed: random(1000),
    sp: 1 + e * 0.05
  });
}

function burst(x, y, c) {
  for (let i = 0; i < 16; i++) {
    const a = random(TWO_PI), s = random(1, 4);
    bits.push({ x, y, vx: cos(a) * s, vy: sin(a) * s, life: 1, c });
  }
}

function draw() {
  background(15, 10, 25);
  randomSeed(7);
  noStroke();
  for (let i = 0; i < 40; i++) {
    fill(255, 120 + 100 * sin(frameCount * 0.03 + i));
    ellipse(random(width), random(height), 2);
  }
  randomSeed(millis());

  if (state === 'start') return banner('GHOST HUNT\nClick ghosts. Avoid red eyes.\nMisses reset your combo.\n\nClick to start');
  if (state === 'over') return banner('Game over\nScore: ' + score + '   Best: ' + best + '\n\nClick to retry');

  const e = elapsed();
  if (e >= duration || lives <= 0) return endGame();

  if (millis() - lastSpawn > max(350, 900 - e * 18)) {
    spawnGhost();
    lastSpawn = millis();
  }

  push();
  if (shake > 0) { translate(random(-shake, shake), random(-shake, shake)); shake *= 0.85; }

  for (let i = ghosts.length - 1; i >= 0; i--) {
    const g = ghosts[i];
    const age = (millis() - g.born) / g.life;
    if (age >= 1) {
      if (!g.evil) { lives--; combo = 0; shake = 8; }
      ghosts.splice(i, 1);
      continue;
    }
    g.x = constrain(g.x + (noise(g.seed, frameCount * 0.01) - 0.5) * 6 * g.sp, 30, width - 30);
    g.y = constrain(g.y + (noise(g.seed + 99, frameCount * 0.01) - 0.5) * 6 * g.sp, 40, height - 30);
    g.age = age;
  }
  for (const g of ghosts) drawGhost(g);

  for (let i = bits.length - 1; i >= 0; i--) {
    const b = bits[i];
    b.x += b.vx; b.y += b.vy; b.life -= 0.03;
    fill(b.c[0], b.c[1], b.c[2], 255 * b.life);
    ellipse(b.x, b.y, 5);
    if (b.life <= 0) bits.splice(i, 1);
  }
  pop();

  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text('Score: ' + score, 12, 10);
  text('Combo: x' + (1 + floor(combo / 5)), 12, 32);
  textAlign(RIGHT, TOP);
  text('Time: ' + ceil(duration - e), width - 12, 10);
  fill(255, 107, 138);
  text('♥'.repeat(max(0, lives)), width - 12, 32);
}

function drawGhost(g) {
  const a = 255 * min(1, g.age * 8, (1 - g.age) * 3);
  const r = g.r * (1 - g.age * 0.35);
  const y = g.y + sin(frameCount * 0.1 + g.seed) * 4;
  const body = g.evil ? color(200, 170, 255, a) : color(220, 255, 230, a);
  noStroke();
  fill(red(body), green(body), blue(body), a * 0.2);
  ellipse(g.x, y, r * 3);
  fill(body);
  ellipse(g.x, y, r * 2);
  rect(g.x - r, y, r * 2, r * 0.8);
  for (let i = 0; i < 3; i++) ellipse(g.x - r * 0.66 + i * r * 0.66, y + r * 0.8, r * 0.7);
  const ang = atan2(mouseY - y, mouseX - g.x);
  for (const s of [-1, 1]) {
    fill(g.evil ? color(255, 40, 60, a) : color(20, a));
    ellipse(g.x + s * r * 0.4 + cos(ang) * 2, y - r * 0.2 + sin(ang) * 2, r * 0.3);
  }
}

function banner(msg) {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(22);
  text(msg, width / 2, height / 2);
}

function mousePressed() {
  if (state !== 'play') { startGame(); return; }
  for (let i = ghosts.length - 1; i >= 0; i--) {
    const g = ghosts[i];
    if (dist(mouseX, mouseY, g.x, g.y) < g.r * 1.1) {
      if (g.evil) {
        lives--; combo = 0; shake = 10; score = max(0, score - 3);
        burst(g.x, g.y, [255, 60, 80]);
      } else {
        score += 1 + floor(combo / 5);
        combo++;
        burst(g.x, g.y, [220, 255, 230]);
      }
      ghosts.splice(i, 1);
      return;
    }
  }
  combo = 0;
}