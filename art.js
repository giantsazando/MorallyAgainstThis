/* Pixel-art placeholder covers drawn from each game's "art" settings.
 * art = { scene, sky: [top, bottom], m: motif, c: [main, shade, highlight] }
 * Games without art get settings derived from their id, so every cover is stable.
 * Exposes window.PixelCover.url(game, width?) -> PNG data URL (cached).
 */
(function () {
  'use strict';

  var H = 25; // logical pixel height; width defaults to 40 (8:5)

  // Motif sprites. '.' = transparent, a = main colour, b = shade, c = highlight.
  // A dark outline is added automatically around every sprite.
  var SPRITES = {
    wing: [
      '.a.........',
      '.aa........',
      '.aab.......',
      '.aabb......',
      '..aabba....',
      '..aaabbaa..',
      '...aaabbba.',
      '....aaacbb.',
      '.....aaacb.',
      '.......aac.',
      '.........a.'
    ],
    moon: [
      '....aaaa...',
      '..aaaa.....',
      '.aaab......',
      '.aab.......',
      'aaab.......',
      'aacb.......',
      'aaab.......',
      '.aab.......',
      '.aaab......',
      '..aaaa.....',
      '....aaaa...'
    ],
    sword: [
      '.....c.....',
      '....cab....',
      '....cab....',
      '....cab....',
      '....cab....',
      '....cab....',
      '....cab....',
      '..bbbbbbb..',
      '.....a.....',
      '.....a.....',
      '....bbb....'
    ],
    crystal: [
      '.....c.....',
      '....cab....',
      '...caabb...',
      '..caaabbb..',
      '..caaabbb..',
      '..caaabbb..',
      '..caaabbb..',
      '..caaabbb..',
      '...caabb...',
      '....cab....',
      '.....b.....'
    ],
    tree: [
      '....aaa....',
      '..aaaaaaa..',
      '.aaacaaaaa.',
      '.aaaaaacaa.',
      'aacaaaaaaaa',
      '.aaaaaaaaa.',
      '..aaaaaaa..',
      '....bbb....',
      '....bbb....',
      '....bbb....',
      '...bbbbb...'
    ],
    banner: [
      'c..........',
      'caaaaaaaa..',
      'caaaaaaaa..',
      'caabbbbaa..',
      'caabccbaa..',
      'caabbbbaa..',
      'caaaaaaaa..',
      'caaaa.aaa..',
      'caa.....a..',
      'c..........',
      'c..........'
    ],
    circle: [
      '...aaaaa...',
      '..a.....a..',
      '.a..bbb..a.',
      'a..b...b..a',
      'a.b..c..b.a',
      'a.b.ccc.b.a',
      'a.b..c..b.a',
      'a..b...b..a',
      '.a..bbb..a.',
      '..a.....a..',
      '...aaaaa...'
    ],
    tower: [
      '....a.a....',
      '....aaa....',
      '....aca....',
      '....aaa....',
      '...aaaaa...',
      '...abaca...',
      '...aaaaa...',
      '..aaaaaaa..',
      '..aabaaba..',
      '..aaaaaaa..',
      '.aaaabaaaa.'
    ],
    clock: [
      '...aaaaa...',
      '..abbbbba..',
      '.abbbcbbba.',
      'abbbbcbbbba',
      'abbbbcbbbba',
      'abbbbcccbba',
      'abbbbbbbbba',
      'abbbbbbbbba',
      '.abbbbbbba.',
      '..abbbbba..',
      '...aaaaa...'
    ],
    gate: [
      '..aaaaaaa..',
      '.aabbbbbaa.',
      'aab.....baa',
      'aab.ccc.baa',
      'aab.ccc.baa',
      'aab.ccc.baa',
      'aab.ccc.baa',
      'aab.ccc.baa',
      'aab.ccc.baa',
      'aab.ccc.baa',
      'aaa.....aaa'
    ],
    card: [
      '.aaaaaaa.',
      '.abbbbba.',
      '.abbcbba.',
      '.abcccba.',
      '.accccca.',
      '.abbcbba.',
      '.abbcbba.',
      '.abbbbba.',
      '.abbbbba.',
      '.aaaaaaa.'
    ],
    egg: [
      '....aaa....',
      '...aaaaa...',
      '..aaaaaaa..',
      '..acaaaaa..',
      '.aaccaaaaa.',
      '.aaaaaaaaa.',
      '.abaabaaba.',
      '.babababab.',
      '.aaaaaaaaa.',
      '..aaaaaaa..',
      '...aaaaa...'
    ],
    star: [
      '.....a.....',
      '.....a.....',
      '....aaa....',
      'aaaaacaaaaa',
      '.aaaccbaaa.',
      '..aacbbaa..',
      '...aaaaa...',
      '..aaa.aaa..',
      '..aa...aa..',
      '.aa.....aa.',
      '.a.......a.'
    ],
    castle: [
      'a.a.....a.a',
      'aaa.a.a.aaa',
      'aaa.aaa.aaa',
      'aba.aba.aba',
      'aaaaaaaaaaa',
      'aaaaabaaaaa',
      'aabaaaaabaa',
      'aaaaacaaaaa',
      'aaaacccaaaa',
      'aaaacccaaaa',
      'aaaacccaaaa'
    ],
    key: [
      '..aaa......',
      '.abbba.....',
      '.ab.ba.....',
      '.abbba.....',
      '..aaa......',
      '...a.......',
      '...ac......',
      '...aaa.....',
      '...a.......',
      '...aaa.....',
      '...a.......'
    ],
    planet: [
      '.....aaa.....',
      '...acaaaaa...',
      '..accaaaaaa..',
      'bbbaaaaaaabbb',
      '..bbbbbbbbb..',
      '..aaaaaaaaa..',
      '...aaaaaaa...',
      '.....aaa.....'
    ],
    gem: [
      '..ccccccc..',
      '.cbbabbabc.',
      'cbbaabaabbc',
      '.aaaaaaaaa.',
      '..aaaaaaa..',
      '...aaaaa...',
      '....aaa....',
      '.....a.....'
    ],
    crown: [
      'a....a....a',
      'aa..aaa..aa',
      'aaa.aaa.aaa',
      'aaaaaaaaaaa',
      'abaacacaaba',
      'aaaaaaaaaaa',
      'bbbbbbbbbbb'
    ],
    robot: [
      '.....c.....',
      '.....a.....',
      '..aaaaaaa..',
      '..abbabba..',
      '..acbacba..',
      '..aaaaaaa..',
      '..aabbbaa..',
      '...aaaaa...',
      '.aaaaaaaaa.',
      'aa.abcba.aa',
      'a..aaaaa..a',
      '...a...a...',
      '..aa...aa..'
    ],
    orb: [
      '...aaaaa...',
      '..accaaaa..',
      '.accaaaaaa.',
      '.acaaaaaaa.',
      '.aaaaaaaaa.',
      '.aaaaaaaaa.',
      '..aaaaaaa..',
      '...aaaaa...',
      '...bbbbb...',
      '..bbbbbbb..'
    ],
    stairs: [
      '........aaa',
      '........aca',
      '......aaaaa',
      '......abbba',
      '....aaaaaaa',
      '....abbbbba',
      '..aaaaaaaaa',
      '..abbbbbbba',
      'aaaaaaaaaaa',
      'abbbbbbbbba'
    ],
    shield: [
      'aaaaaaaaaaa',
      'abbbbcbbbba',
      'abbbbcbbbba',
      'abbcccccbba',
      'abbbbcbbbba',
      'abbbbcbbbba',
      '.abbbcbbba.',
      '.abbbbbbba.',
      '..abbbbba..',
      '...abbba...',
      '....aaa....'
    ],
    flame: [
      '.....a.....',
      '....aa.....',
      '....aaa....',
      '...aaaa.a..',
      '..aaabaaa..',
      '..aabbbaa..',
      '.aabbcbbaa.',
      '.aabcccbaa.',
      '.aabcccbaa.',
      '..aabcbaa..',
      '...aaaaa...'
    ],
    comet: [
      '..........a',
      '.........a.',
      '.......aa..',
      '.....aab...',
      '....abb....',
      '..ccbb.....',
      '.cccc......',
      'ccccc......',
      'cccc.......',
      '.cc........'
    ],
    rune: [
      '..aaaaaaa..',
      '.aaaaaaaaa.',
      '.aaacaaaaa.',
      '.aaacacaaa.',
      '.aaaccaaaa.',
      '.aaacaaaaa.',
      '.aaacaaaaa.',
      '.aaaaaaaaa.',
      '.aaaaaaaaa.',
      'bbbbbbbbbbb'
    ],
    mask: [
      '.aaaaaaaaa.',
      'aaaaaaaaaaa',
      'aabbaaabbaa',
      'abcbaaabcba',
      'aaaaaaaaaaa',
      'aaaaabaaaaa',
      '.aaaaaaaaa.',
      '..aabbbaa..',
      '...aaaaa...'
    ],
    ship: [
      '.....a.....',
      '.....ac....',
      '....aac....',
      '...aaac....',
      '..aaaac....',
      '.aaaaac....',
      '.....b.....',
      'bbbbbbbbbbb',
      '.bbcbcbcbb.',
      '..bbbbbbb..'
    ],
    wolf: [
      '.a.......a.',
      '.aa.....aa.',
      '.aaa...aaa.',
      '.aaaaaaaaa.',
      'aaaaaaaaaaa',
      'aacaaaaacaa',
      'aaaaaaaaaaa',
      '.aaaabaaaa.',
      '..aabbbaa..',
      '...aabaa...',
      '....aaa....'
    ],
    skull: [
      '..aaaaaaa..',
      '.aaaaaaaaa.',
      '.acaaaaaaa.',
      '.abbaaabba.',
      '.abbaaabba.',
      '.aaaabaaaa.',
      '..aaaaaaa..',
      '...ababa...',
      '...aaaaa...'
    ],
    leaf: [
      '........aa.',
      '......aaaa.',
      '....aaaaba.',
      '...aaaabaa.',
      '..aacabaaa.',
      '..aaabaaa..',
      '.aaabaaa...',
      '.aabaaa....',
      '.abaa......',
      'b..........'
    ],
    blossom: [
      '....aaa....',
      '...aaaaa...',
      '.aa.aaa.aa.',
      'aaaa.a.aaaa',
      'aaaaabaaaaa',
      '.aa.bcb.aa.',
      '...aabaa...',
      '..aaa.aaa..',
      '..aaa.aaa..',
      '...a...a...'
    ],
    heart: [
      '.aaa...aaa.',
      'aacaa.aaaaa',
      'acaaaaaaaaa',
      'aaaaaaaaaaa',
      'aaaaaaaaaab',
      '.aaaaaaaab.',
      '..aaaaaab..',
      '...aaaab...',
      '....aab....',
      '.....a.....'
    ],
    wagon: [
      '...bbbbbb...',
      '..bccbbbbb..',
      '.bbbbbbbbbb.',
      '.bbbbbbbbbb.',
      'aaaaaaaaaaaa',
      '.aaa....aaa.',
      'acaca..acaca',
      '.aaa....aaa.'
    ],
    sun: [
      '.....a.....',
      '..a..a..a..',
      '...aaaaa...',
      '..abbbbba..',
      'aaabbcbbaaa',
      '..abbbbba..',
      '...aaaaa...',
      '..a..a..a..',
      '.....a.....'
    ],
    rocket: [
      '.....a.....',
      '....aaa....',
      '....aca....',
      '...aaaaa...',
      '...acbca...',
      '...aaaaa...',
      '...aaaaa...',
      '..aaaaaaa..',
      '.aa.aaa.aa.',
      '....bbb....',
      '.....b.....'
    ]
  };

  var SCENES = ['sky', 'night', 'fire', 'sea', 'space', 'forest', 'dungeon', 'sand', 'storm'];
  var MOTIFS = Object.keys(SPRITES);
  var OUTLINE = [18, 15, 24];

  // ---------- colour & random helpers ----------
  function hex(h) {
    h = String(h || '#888').replace('#', '');
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); });
  }
  function shade(c, t) { return t < 0 ? mix(c, [0, 0, 0], -t) : mix(c, [255, 255, 255], t); }

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function rng(seed) {
    var s = seed || 1;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hsl(h, s, l) {
    s /= 100; l /= 100;
    var k = function (n) { return (n + h / 30) % 12; };
    var a = s * Math.min(l, 1 - l);
    var f = function (n) { return Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))); };
    return '#' + [f(0), f(8), f(4)].map(function (v) { return (v < 16 ? '0' : '') + v.toString(16); }).join('');
  }

  // Settings for games whose data has no art entry.
  function derivedArt(id) {
    var r = rng(hash(id));
    var scene = SCENES[Math.floor(r() * SCENES.length)];
    var hue = Math.floor(r() * 360);
    var skyByScene = {
      sky: [hsl(205, 70, 55), hsl(195, 80, 85)],
      night: [hsl(240, 50, 12), hsl(250, 45, 35)],
      fire: [hsl(10, 70, 20), hsl(30, 90, 55)],
      sea: [hsl(200, 70, 50), hsl(190, 70, 80)],
      space: [hsl(260, 60, 6), hsl(250, 50, 22)],
      forest: [hsl(150, 40, 35), hsl(90, 50, 75)],
      dungeon: [hsl(30, 15, 14), hsl(30, 20, 32)],
      sand: [hsl(35, 80, 60), hsl(45, 90, 85)],
      storm: [hsl(225, 20, 18), hsl(220, 15, 45)]
    };
    return {
      scene: scene,
      sky: skyByScene[scene],
      m: MOTIFS[Math.floor(r() * MOTIFS.length)],
      c: [hsl(hue, 70, 58), hsl(hue, 60, 36), hsl((hue + 40) % 360, 90, 85)]
    };
  }

  // ---------- drawing ----------
  function Canvas(w, h) {
    this.w = w;
    this.h = h;
    this.px = new Array(w * h);
  }
  Canvas.prototype.set = function (x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return;
    this.px[y * this.w + x] = c;
  };
  Canvas.prototype.get = function (x, y) { return this.px[y * this.w + x]; };
  Canvas.prototype.rect = function (x, y, w, h, c) {
    for (var j = y; j < y + h; j++) for (var i = x; i < x + w; i++) this.set(i, j, c);
  };

  var BAYER = [[0, 2], [3, 1]];

  // Banded vertical gradient with 2x2 ordered dithering between bands.
  function gradient(cv, top, bottom, toRow) {
    var bands = 6;
    for (var y = 0; y < toRow; y++) {
      var t = y / Math.max(1, toRow - 1) * (bands - 1);
      var band = Math.floor(t);
      var frac = t - band;
      for (var x = 0; x < cv.w; x++) {
        var b = frac * 4 > BAYER[y % 2][x % 2] + 0.5 ? band + 1 : band;
        cv.set(x, y, mix(top, bottom, Math.min(b, bands - 1) / (bands - 1)));
      }
    }
  }

  function hills(cv, r, base, amp, color, freq) {
    var phase = r() * 10;
    for (var x = 0; x < cv.w; x++) {
      var top = Math.round(base - amp * (0.5 + 0.5 * Math.sin(x * freq + phase)));
      for (var y = top; y < cv.h; y++) cv.set(x, y, color);
    }
  }

  function stars(cv, r, count, maxRow, colors) {
    for (var i = 0; i < count; i++) {
      cv.set(Math.floor(r() * cv.w), Math.floor(r() * maxRow), colors[Math.floor(r() * colors.length)]);
    }
  }

  function cloud(cv, x, y, color, edge) {
    cv.rect(x + 1, y, 4, 1, color);
    cv.rect(x, y + 1, 7, 1, color);
    cv.rect(x + 2, y + 2, 6, 1, edge);
  }

  var SCENE_DRAW = {
    sky: function (cv, sky, r) {
      gradient(cv, sky[0], sky[1], cv.h);
      var white = [255, 255, 255];
      var edge = mix(sky[1], white, 0.5);
      for (var i = 0; i < Math.max(2, Math.round(cv.w / 16)); i++) {
        cloud(cv, Math.floor(r() * (cv.w - 8)), 2 + Math.floor(r() * 6), white, edge);
      }
      hills(cv, r, cv.h - 3, 3, mix(shade(sky[0], -0.2), [70, 140, 80], 0.6), 0.25);
      hills(cv, r, cv.h - 1, 2, mix(shade(sky[0], -0.4), [40, 100, 55], 0.7), 0.4);
    },
    night: function (cv, sky, r) {
      gradient(cv, sky[0], sky[1], cv.h);
      stars(cv, r, Math.round(cv.w * 0.6), cv.h - 6, [[255, 255, 255], mix(sky[1], [255, 255, 255], 0.6)]);
      hills(cv, r, cv.h - 2, 3, shade(sky[0], -0.5), 0.2);
    },
    fire: function (cv, sky, r) {
      gradient(cv, sky[0], sky[1], cv.h);
      var hot = [255, 106, 26];
      var glow = [255, 205, 70];
      for (var x = 0; x < cv.w; x++) {
        var hgt = 3 + Math.floor(r() * 4) + (x % 3 === 0 ? 2 : 0);
        for (var y = cv.h - hgt; y < cv.h; y++) cv.set(x, y, y > cv.h - hgt + 2 ? glow : hot);
      }
      stars(cv, r, Math.round(cv.w * 0.3), cv.h - 6, [glow, hot]);
    },
    sea: function (cv, sky, r) {
      var horizon = Math.round(cv.h * 0.64);
      gradient(cv, sky[0], sky[1], horizon);
      var water = mix(sky[0], [20, 70, 140], 0.55);
      var deep = shade(water, -0.3);
      var foam = mix(sky[1], [255, 255, 255], 0.6);
      for (var y = horizon; y < cv.h; y++) {
        for (var x = 0; x < cv.w; x++) {
          var wave = (x + y * 3) % 8 === 0 && r() > 0.3;
          cv.set(x, y, wave ? foam : (y - horizon) % 3 === 2 ? deep : water);
        }
      }
    },
    space: function (cv, sky, r) {
      gradient(cv, sky[0], sky[1], cv.h);
      stars(cv, r, Math.round(cv.w * 0.9), cv.h, [[255, 255, 255], [170, 180, 255], mix(sky[1], [255, 255, 255], 0.4)]);
    },
    forest: function (cv, sky, r) {
      gradient(cv, sky[0], sky[1], cv.h);
      var back = mix(shade(sky[0], -0.25), [40, 110, 70], 0.5);
      var front = mix(shade(sky[0], -0.55), [20, 70, 40], 0.6);
      [[back, cv.h - 4, 6], [front, cv.h - 1, 5]].forEach(function (layer) {
        for (var x = -2; x < cv.w; x += 3 + Math.floor(r() * 3)) {
          var hgt = layer[2] + Math.floor(r() * 4);
          for (var j = 0; j < hgt; j++) {
            var half = Math.floor(j / 2);
            for (var i = -half; i <= half; i++) cv.set(x + i, layer[1] - hgt + j + 1, layer[0]);
          }
        }
        cv.rect(0, layer[1], cv.w, cv.h - layer[1], layer[0]);
      });
    },
    dungeon: function (cv, sky) {
      var brick = shade(sky[1], -0.1);
      var brick2 = shade(sky[1], -0.25);
      var mortar = shade(sky[0], -0.3);
      for (var y = 0; y < cv.h; y++) {
        var row = Math.floor(y / 3);
        for (var x = 0; x < cv.w; x++) {
          var off = row % 2 ? 3 : 0;
          var isMortar = y % 3 === 2 || (x + off) % 6 === 0;
          cv.set(x, y, isMortar ? mortar : ((x + off) / 6 | 0) % 3 === row % 3 ? brick2 : brick);
        }
      }
      cv.rect(0, cv.h - 3, cv.w, 3, shade(sky[0], -0.2));
      var flame = [255, 170, 40];
      [4, cv.w - 5].forEach(function (x) {
        cv.rect(x, 9, 1, 4, [110, 70, 40]);
        cv.set(x, 8, flame);
        cv.set(x, 7, [255, 230, 120]);
      });
    },
    sand: function (cv, sky, r) {
      gradient(cv, sky[0], sky[1], cv.h);
      var sun = [255, 240, 190];
      cv.rect(cv.w - 9, 3, 4, 4, sun);
      var dune = mix(sky[1], [220, 170, 90], 0.6);
      hills(cv, r, cv.h - 4, 3, dune, 0.18);
      hills(cv, r, cv.h - 1, 2, shade(dune, -0.2), 0.3);
    },
    storm: function (cv, sky, r) {
      gradient(cv, sky[0], sky[1], cv.h);
      var rain = mix(sky[1], [200, 210, 230], 0.5);
      for (var i = 0; i < cv.w * 1.2; i++) {
        var x = Math.floor(r() * cv.w);
        var y = Math.floor(r() * cv.h);
        cv.set(x, y, rain);
        cv.set(x - 1, y + 1, rain);
      }
      var bolt = [255, 245, 170];
      var bx = 4 + Math.floor(r() * 5);
      for (var by = 0; by < 12; by++) {
        cv.set(bx, by, bolt);
        if (by % 3 === 2) bx += 1;
      }
      hills(cv, r, cv.h - 1, 2, shade(sky[0], -0.5), 0.3);
    }
  };

  function drawSprite(cv, art) {
    var rows = SPRITES[art.m] || SPRITES.star;
    var colors = { a: hex(art.c[0]), b: hex(art.c[1]), c: hex(art.c[2]) };
    var w = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    var h = rows.length;
    var ox = Math.floor((cv.w - w) / 2);
    var groundless = art.scene === 'space' || art.scene === 'dungeon';
    var oy = groundless ? Math.floor((cv.h - h) / 2) : cv.h - h - 5;

    var mask = {};
    rows.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) {
        if (colors[row[x]]) mask[(x + ox) + ',' + (y + oy)] = colors[row[x]];
      }
    });
    // Outline: any empty pixel touching the sprite (including diagonals).
    Object.keys(mask).forEach(function (k) {
      var p = k.split(',').map(Number);
      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          var nk = (p[0] + dx) + ',' + (p[1] + dy);
          if (!mask[nk]) cv.set(p[0] + dx, p[1] + dy, OUTLINE);
        }
      }
    });
    // Soft shadow under grounded motifs.
    if (!groundless) {
      var shadowY = oy + h + 1;
      for (var sx = ox + 1; sx < ox + w - 1; sx++) {
        var under = cv.get(sx, shadowY);
        if (under) cv.set(sx, shadowY, shade(under, -0.35));
      }
    }
    Object.keys(mask).forEach(function (k) {
      var p = k.split(',').map(Number);
      cv.set(p[0], p[1], mask[k]);
    });
  }

  function paint(game, width) {
    var art = game.art && SCENE_DRAW[game.art.scene] ? game.art : derivedArt(game.id);
    var sky = (art.sky || []).map(hex);
    if (sky.length < 2) sky = [hex('#334'), hex('#99a')];
    var cv = new Canvas(width, H);
    var r = rng(hash(game.id + ':' + width));
    SCENE_DRAW[art.scene](cv, sky, r);
    drawSprite(cv, {
      scene: art.scene,
      m: art.m,
      c: (art.c && art.c.length === 3) ? art.c : ['#ddd', '#888', '#fff']
    });
    return cv;
  }

  var cache = {};

  function url(game, width) {
    width = width || 40;
    var key = game.id + '@' + width;
    if (cache[key]) return cache[key];
    var cv = paint(game, width);
    var canvas = document.createElement('canvas');
    canvas.width = cv.w;
    canvas.height = cv.h;
    var ctx = canvas.getContext('2d');
    var img = ctx.createImageData(cv.w, cv.h);
    for (var i = 0; i < cv.px.length; i++) {
      var c = cv.px[i] || [0, 0, 0];
      img.data[i * 4] = c[0];
      img.data[i * 4 + 1] = c[1];
      img.data[i * 4 + 2] = c[2];
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    cache[key] = canvas.toDataURL('image/png');
    return cache[key];
  }

  window.PixelCover = { url: url };
})();
