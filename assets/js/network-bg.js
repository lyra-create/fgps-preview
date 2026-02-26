/**
 * network-bg.js — Seismic Survey Network Animation
 * FGPS background canvas — self-initialising, transparent, ambient
 *
 * Usage: <script src="assets/js/network-bg.js"></script> before </body>
 * No configuration needed.
 */
(function () {
  'use strict';

  // ─── Colour helpers ─────────────────────────────────────────────────────────
  var TEAL  = [0, 212, 170];
  var AMBER = [245, 166, 35];

  function teal(a) {
    return 'rgba(0,212,170,' + a.toFixed(3) + ')';
  }
  function amb(a) {
    return 'rgba(245,166,35,' + a.toFixed(3) + ')';
  }

  // ─── Canvas setup ───────────────────────────────────────────────────────────
  var canvas = document.createElement('canvas');
  var s = canvas.style;
  s.position      = 'fixed';
  s.top           = '0';
  s.left          = '0';
  s.width         = '100%';
  s.height        = '100%';
  s.zIndex        = '0';
  s.pointerEvents = 'none';
  s.background    = 'transparent';

  // Insert behind all existing content
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext('2d');

  var W = 0, H = 0, MAX_DIST = 0;

  // ─── Scene state ────────────────────────────────────────────────────────────
  var nodes       = [];
  var conns       = [];
  var tracks      = [];
  var amberAt     = 0;   // timestamp for next amber trigger
  var nextTurnover = 0;  // timestamp for next connection cycle

  // ─── Resize ─────────────────────────────────────────────────────────────────
  function resize() {
    W         = canvas.width  = window.innerWidth;
    H         = canvas.height = window.innerHeight;
    MAX_DIST  = Math.sqrt(W * W + H * H) * 0.17;
  }

  window.addEventListener('resize', function () {
    resize();
    rebuild();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Node
  // Represents a geodetic network control point / receiver position.
  // Breathes gently around a slowly drifting base position.
  // ───────────────────────────────────────────────────────────────────────────
  function Node() {
    this.bx   = W * 0.04 + Math.random() * W * 0.92;  // base x
    this.by   = H * 0.04 + Math.random() * H * 0.92;  // base y
    this.dvx  = (Math.random() - 0.5) * 0.005;
    this.dvy  = (Math.random() - 0.5) * 0.005;

    // Breathing oscillation (independent x/y for elliptical feel)
    this.amp   = 3 + Math.random() * 6;
    this.freqX = 0.00022 + Math.random() * 0.00022;
    this.freqY = this.freqX * (0.55 + Math.random() * 0.55);
    this.phX   = Math.random() * Math.PI * 2;
    this.phY   = Math.random() * Math.PI * 2;

    // Visual
    this.r    = 1.2 + Math.random() * 1.5;
    this.op   = 0.17 + Math.random() * 0.13;   // teal opacity

    // Amber state
    this.amberStart = -1e18;
    this.amberDur   = 0;

    // Cached screen position (written by update, read by draw & connections)
    this.x = this.bx;
    this.y = this.by;
  }

  Node.prototype.update = function (t, dt) {
    // Slow drift
    this.bx += this.dvx * dt;
    this.by += this.dvy * dt;

    // Soft boundary: gentle inward nudge
    var mx = W * 0.08, my = H * 0.08;
    if (this.bx < mx)       this.dvx += 2.5e-5 * dt;
    else if (this.bx > W - mx) this.dvx -= 2.5e-5 * dt;
    if (this.by < my)       this.dvy += 2.5e-5 * dt;
    else if (this.by > H - my) this.dvy -= 2.5e-5 * dt;

    // Velocity damping — keeps drift from accelerating
    this.dvx *= 0.9997;
    this.dvy *= 0.9997;

    // Breathing overlay
    this.x = this.bx + Math.cos(t * this.freqX + this.phX) * this.amp;
    this.y = this.by + Math.sin(t * this.freqY + this.phY) * this.amp;
  };

  Node.prototype.draw = function (t) {
    var elapsed = t - this.amberStart;
    var isAmber = elapsed >= 0 && elapsed < this.amberDur;

    if (isAmber) {
      // Fade envelope: 250ms in, hold, 600ms out
      var fadeIn  = Math.min(1, elapsed / 250);
      var fadeOut = Math.min(1, (this.amberDur - elapsed) / 600);
      var env     = Math.min(fadeIn, fadeOut);

      // Soft outer glow
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 6, 0, Math.PI * 2);
      ctx.fillStyle = amb(0.055 * env);
      ctx.fill();

      // Inner ring
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = amb(0.18 * env);
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r + 0.8, 0, Math.PI * 2);
      ctx.fillStyle = amb(0.9 * env);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = teal(this.op);
      ctx.fill();
    }
  };

  Node.prototype.triggerAmber = function (t, dur) {
    this.amberStart = t;
    this.amberDur   = dur;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Connection
  // A thin edge in the geodetic network mesh.
  // Fades in when created, fades out when killed.
  // ───────────────────────────────────────────────────────────────────────────
  function Conn(a, b) {
    this.a    = a;
    this.b    = b;
    this.peak = 0.045 + Math.random() * 0.065;  // target opacity
    this.op   = 0;                               // current opacity
    this.dir  = 1;                               // 1=fadein, 0=hold, -1=fadeout
    this.rate = 0.00012 + Math.random() * 0.00014; // opacity per ms
  }

  Conn.prototype.update = function (dt) {
    if (this.dir === 0) return;
    this.op += this.dir * this.rate * dt;
    if (this.op >= this.peak) { this.op = this.peak; this.dir = 0; }
    if (this.op <= 0)         { this.op = 0; }
  };

  Conn.prototype.kill  = function ()  { this.dir = -1; };
  Conn.prototype.alive = function ()  { return this.op > 0 || this.dir === 1; };
  Conn.prototype.dying = function ()  { return this.dir === -1; };

  Conn.prototype.draw = function () {
    if (this.op < 0.002) return;
    var dx   = this.b.x - this.a.x;
    var dy   = this.b.y - this.a.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > MAX_DIST * 1.12) { this.kill(); return; }

    // Opacity falls off with distance
    var fade = 1 - dist / (MAX_DIST * 1.12);

    ctx.beginPath();
    ctx.moveTo(this.a.x, this.a.y);
    ctx.lineTo(this.b.x, this.b.y);
    ctx.strokeStyle = teal(this.op * fade);
    ctx.lineWidth   = 0.6;
    ctx.stroke();
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Survey Track
  // A long diagonal line representing a seismic vessel track / towed streamer.
  // Carries a slow-moving pulse — data flowing back to the vessel.
  // ───────────────────────────────────────────────────────────────────────────
  function Track() {
    this.init();
  }

  Track.prototype.init = function () {
    var horiz = Math.random() < 0.6;  // slight bias toward horizontal survey lines
    var angle = (Math.random() - 0.5) * 48 * Math.PI / 180;  // ±24°

    if (horiz) {
      var yFrac = 0.08 + Math.random() * 0.84;
      this.x1 = -W * 0.08;
      this.y1 = H * yFrac;
      this.x2 =  W * 1.08;
      this.y2 = this.y1 + Math.tan(angle) * W * 1.16;
    } else {
      var xFrac = 0.08 + Math.random() * 0.84;
      this.x1 = W * xFrac;
      this.y1 = -H * 0.08;
      this.x2 = this.x1 + Math.tan(angle) * H * 1.16;
      this.y2 =  H * 1.08;
    }

    this.op      = 0.05 + Math.random() * 0.07;
    this.lw      = 0.6  + Math.random() * 1.0;

    // Pulse
    this.pt      = Math.random();         // 0..1 position along track
    this.pdir    = Math.random() < 0.5 ? 1 : -1;
    this.pspd    = 0.000065 + Math.random() * 0.000095;   // per ms
    this.plen    = 0.07 + Math.random() * 0.11;           // fraction of track

    // Second sub-pulse at different phase (optional — 50% of tracks)
    this.hasSub  = Math.random() < 0.5;
    this.pt2     = (this.pt + 0.45 + Math.random() * 0.1) % 1;
    this.plen2   = this.plen * (0.4 + Math.random() * 0.35);
  };

  Track.prototype.update = function (dt) {
    this.pt  += this.pdir * this.pspd * dt;
    if (this.pt  >  1.12) this.pt  = -0.12;
    if (this.pt  < -0.12) this.pt  =  1.12;

    if (this.hasSub) {
      this.pt2 += this.pdir * this.pspd * 0.82 * dt;
      if (this.pt2 >  1.12) this.pt2 = -0.12;
      if (this.pt2 < -0.12) this.pt2 =  1.12;
    }
  };

  Track.prototype._drawPulse = function (pos, plen, opacity) {
    var ps = Math.max(0, pos - plen / 2);
    var pe = Math.min(1, pos + plen / 2);
    if (ps >= 1 || pe <= 0) return;

    var px1 = this.x1 + (this.x2 - this.x1) * ps;
    var py1 = this.y1 + (this.y2 - this.y1) * ps;
    var px2 = this.x1 + (this.x2 - this.x1) * pe;
    var py2 = this.y1 + (this.y2 - this.y1) * pe;

    var g = ctx.createLinearGradient(px1, py1, px2, py2);
    g.addColorStop(0,   teal(0));
    g.addColorStop(0.5, teal(opacity));
    g.addColorStop(1,   teal(0));

    ctx.beginPath();
    ctx.moveTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.strokeStyle = g;
    ctx.lineWidth   = this.lw * 2.5;
    ctx.stroke();
  };

  Track.prototype.draw = function () {
    // Base line
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.strokeStyle = teal(this.op);
    ctx.lineWidth   = this.lw;
    ctx.stroke();

    // Primary pulse
    this._drawPulse(this.pt,  this.plen,  0.40);

    // Optional secondary echo
    if (this.hasSub) {
      this._drawPulse(this.pt2, this.plen2, 0.22);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Scene initialisation
  // ───────────────────────────────────────────────────────────────────────────
  function rebuild() {
    var i, j, dx, dy, c;

    nodes  = [];
    conns  = [];
    tracks = [];

    // 50 nodes scattered across canvas
    for (i = 0; i < 50; i++) {
      nodes.push(new Node());
    }

    // Initial mesh: connect pairs within MAX_DIST (Delaunay-ish proximity graph)
    for (i = 0; i < nodes.length; i++) {
      for (j = i + 1; j < nodes.length; j++) {
        dx = nodes[i].bx - nodes[j].bx;
        dy = nodes[i].by - nodes[j].by;
        if (Math.sqrt(dx * dx + dy * dy) < MAX_DIST) {
          c      = new Conn(nodes[i], nodes[j]);
          c.op   = c.peak;  // start fully visible — they've always been there
          c.dir  = 0;
          conns.push(c);
        }
      }
    }

    // 7 survey tracks
    for (i = 0; i < 7; i++) {
      tracks.push(new Track());
    }

    // Reset timers so they trigger soon after rebuild
    nextTurnover = 0;
    amberAt      = 0;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Connection turnover — simulates network optimisation:
  // some edges disappear, new ones appear, like a least-squares adjustment
  // finding a better network configuration
  // ───────────────────────────────────────────────────────────────────────────
  function doTurnover(t) {
    if (t < nextTurnover) return;
    nextTurnover = t + 700 + Math.random() * 1300;

    // Kill 3-5% of live connections
    var live = conns.filter(function (c) { return !c.dying() && c.op > 0.01; });
    var killN = Math.max(1, Math.floor(live.length * 0.035));
    for (var k = 0; k < killN; k++) {
      var idx = Math.floor(Math.random() * live.length);
      live[idx].kill();
    }

    // Spawn roughly the same number of new connections
    var addN = killN + Math.floor(Math.random() * 3);
    for (var a = 0; a < addN; a++) {
      var ni = Math.floor(Math.random() * nodes.length);
      var nj = Math.floor(Math.random() * nodes.length);
      if (ni === nj) continue;
      var dx = nodes[ni].x - nodes[nj].x;
      var dy = nodes[ni].y - nodes[nj].y;
      if (Math.sqrt(dx * dx + dy * dy) < MAX_DIST) {
        conns.push(new Conn(nodes[ni], nodes[nj]));
      }
    }

    // Prune fully dead connections
    conns = conns.filter(function (c) { return c.alive(); });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Amber highlighting — one node periodically gets "processed"
  // ───────────────────────────────────────────────────────────────────────────
  function scheduleAmber(t) {
    amberAt = t + 4500 + Math.random() * 7000;
  }

  function doAmber(t) {
    if (amberAt === 0) { scheduleAmber(t); return; }
    if (t < amberAt)   return;

    // Pick a random node
    var n = nodes[Math.floor(Math.random() * nodes.length)];
    n.triggerAmber(t, 2000 + Math.random() * 1800);

    // Occasionally trigger a second node shortly after (cluster processing)
    if (Math.random() < 0.3) {
      var delay = 400 + Math.random() * 600;
      var n2 = nodes[Math.floor(Math.random() * nodes.length)];
      // Use a small setTimeout so we don't need extra state
      (function (node, lag) {
        setTimeout(function () {
          node.triggerAmber(performance.now(), 1200 + Math.random() * 800);
        }, lag);
      }(n2, delay));
    }

    scheduleAmber(t);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Render loop
  // ───────────────────────────────────────────────────────────────────────────
  var lastT = 0;

  // Reset last timestamp after the tab regains focus to avoid large dt spikes
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) lastT = 0;
  });

  function frame(t) {
    requestAnimationFrame(frame);
    if (document.hidden) return;

    if (lastT === 0) { lastT = t; return; }
    var dt = Math.min(t - lastT, 48);  // cap at 48ms (~20fps minimum)
    lastT = t;

    // ── Update ──
    for (var i = 0; i < nodes.length;  i++) nodes[i].update(t, dt);
    for (var j = 0; j < conns.length;  j++) conns[j].update(dt);
    for (var k = 0; k < tracks.length; k++) tracks[k].update(dt);

    doTurnover(t);
    doAmber(t);

    // ── Draw ──
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';

    // Layer 1 — Survey tracks (furthest back, below the mesh)
    for (var ti = 0; ti < tracks.length; ti++) tracks[ti].draw();

    // Layer 2 — Network connections
    for (var ci = 0; ci < conns.length; ci++) conns[ci].draw();

    // Layer 3 — Nodes (on top so amber pops)
    for (var ni = 0; ni < nodes.length; ni++) nodes[ni].draw(t);
  }

  // ── Boot ────────────────────────────────────────────────────────────────────
  resize();
  rebuild();
  requestAnimationFrame(frame);

}());
