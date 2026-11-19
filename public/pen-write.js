// 翻頁完後，右下角的筆拿起來，把新頁首屏看得到的內容依閱讀順序寫出來，寫完放回旁邊。
// - 標題一個字一個字寫（字與字之間提筆、速度有快慢、偶爾停頓）；其他內容一小段一小段快寫。
// - 拿起前先轉一下調整握姿；落筆有接觸回彈；放回桌上會滾一下才停。
// - 捲動、點擊、按鍵或調整視窗：立刻顯示全部內容，筆快速放回去。
// - 每一頁只在第一次進入時播放（記在 localStorage）；手機（筆不顯示）、減少動態效果時不播放。
// - 內容只有在確定要寫時才藏起來，任何失敗都會把全部內容立刻顯示。
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var BLOCKS = [
    '.nb-main > :not(.entries):not(.article):not(.btn-row)',
    '.nb-main > .btn-row',
    '.nb-main .entries > li',
    '.article-head > :not(.margin-mark)',
    '.prose > *',
    '.nb-main .article > :not(.article-head):not(.prose)',
    '.nb-aside > *',
  ].join(',');

  addEventListener('pagereveal', function (e) {
    if (reduce.matches) return;
    var vt = e.viewTransition;
    var pen = document.querySelector('.nb-pen');
    if (!pen || getComputedStyle(pen).display === 'none') return;
    // 每一頁只在第一次進入時寫；之後再來（換頁、重新整理、下次造訪）直接顯示內容
    var first = false;
    try {
      var key = 'nb-pen-written:' + location.pathname;
      first = !localStorage.getItem(key);
      localStorage.setItem(key, '1');
    } catch (err) {}
    if (!first) return;

    var headerBottom = (document.querySelector('.nb-header') || { getBoundingClientRect: function () { return { bottom: 0 }; } }).getBoundingClientRect().bottom;
    var blocks = Array.prototype.slice.call(document.querySelectorAll(BLOCKS)).filter(function (el) {
      var r = el.getBoundingClientRect();
      return r.height > 0 && r.top < innerHeight - 20 && r.bottom > headerBottom;
    });
    if (!blocks.length) return;

    // 先藏起來（翻頁時新頁上還沒有字），關掉會衝突的開場動畫
    var root = document.documentElement;
    root.classList.add('nb-pen-writing');
    // 筆已經把內容寫出來了，開場動畫（標題劃改、列表寫入）不再播，避免寫完又重播一次
    root.classList.remove('nb-play');
    blocks.forEach(function (b) { b.style.clipPath = 'polygon(0 0, 0 0, 0 0)'; });
    var revealed = false;
    function revealAll() {
      if (revealed) return;
      revealed = true;
      blocks.forEach(function (b) { b.style.clipPath = ''; });
      root.classList.remove('nb-pen-writing');
    }

    var go = function () {
      write(blocks, pen, revealAll).catch(function () { revealAll(); resetPen(pen); });
    };
    if (vt) vt.finished.then(go, go);
    else (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { setTimeout(go, 250); });
  });

  // ── 工具 ──
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function rand(a, b) { return a + Math.random() * (b - a); }

  function lineRects(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var rects = Array.prototype.slice.call(range.getClientRects()).filter(function (q) { return q.width > 1 && q.height > 4; });
    var out = [];
    rects.forEach(function (q) {
      var hit = null;
      for (var i = 0; i < out.length; i++) if (Math.abs(out[i].mid - (q.top + q.bottom) / 2) < q.height * 0.45) { hit = out[i]; break; }
      if (hit) {
        hit.left = Math.min(hit.left, q.left); hit.right = Math.max(hit.right, q.right);
        hit.top = Math.min(hit.top, q.top); hit.bottom = Math.max(hit.bottom, q.bottom);
      } else out.push({ left: q.left, right: q.right, top: q.top, bottom: q.bottom, mid: (q.top + q.bottom) / 2 });
    });
    return out.filter(function (l) { return l.top < innerHeight; }).sort(function (a, b) { return a.top - b.top || a.left - b.left; });
  }

  function resetPen(pen) {
    pen.style.translate = pen.style.rotate = pen.style.scale = pen.style.filter = pen.style.transition = '';
  }

  // ── 主流程 ──
  function write(blocks, pen, revealAll) {
    var skip = false;
    // 跳過時立刻同步顯示全部內容，讓這次點擊就能點到底下的連結
    var onSkip = function () { skip = true; revealAll(); };
    var evs = ['wheel', 'touchstart', 'keydown', 'pointerdown', 'resize'];
    evs.forEach(function (ev) { addEventListener(ev, onSkip, { passive: true, once: true }); });
    var cleanup = function () { evs.forEach(function (ev) { removeEventListener(ev, onSkip); }); };

    pen.style.transition = 'none';
    var tip = pen.querySelector('.pen-tip');
    var t0r = tip.getBoundingClientRect();
    var REST = { x: t0r.left + t0r.width / 2, y: t0r.top + t0r.height / 2, rot: 24, lift: 0, fore: 0 };
    var pose = Object.assign({}, REST);
    var WRITE_ROT = 38;

    function apply() {
      var lift = pose.lift, fore = pose.fore;
      pen.style.translate = (pose.x - REST.x).toFixed(1) + 'px ' + (pose.y - REST.y).toFixed(1) + 'px';
      pen.style.rotate = pose.rot.toFixed(2) + 'deg';
      // 抬起時放大、寫字時往紙面傾斜而縮短（以筆尖為軸）
      pen.style.scale = ((1 + 0.07 * lift) * (1 - 0.13 * fore)).toFixed(3) + ' ' + (1 + 0.07 * lift).toFixed(3);
      var dx = 8 + 18 * lift, dy = 14 + 22 * lift, bl = 6 + 10 * lift, a = 0.34 - 0.12 * lift;
      pen.style.filter = 'drop-shadow(' + dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px ' + bl.toFixed(1) + 'px rgba(31,42,34,' + a.toFixed(3) + ')) drop-shadow(' + (2 + 4 * lift).toFixed(1) + 'px ' + (3 + 5 * lift).toFixed(1) + 'px ' + (1.5 + 2 * lift).toFixed(1) + 'px rgba(31,42,34,' + (0.28 - 0.14 * lift).toFixed(3) + '))';
    }
    function tween(ms, fn) {
      return new Promise(function (res) {
        if (skip) return res();
        var s = performance.now();
        (function step(now) {
          if (skip) return res();
          var k = Math.min(1, (now - s) / ms);
          fn(k);
          apply();
          if (k < 1) requestAnimationFrame(step); else res();
        })(s);
      });
    }
    function moveTo(x, y, opts) {
      var from = Object.assign({}, pose);
      var dist = Math.hypot(x - from.x, y - from.y);
      var ms = opts.ms || Math.max(160, Math.min(800, 180 + dist * 0.55));
      var peak = opts.peak == null ? 0.6 : opts.peak;
      return tween(ms, function (k) {
        var e = ease(k);
        pose.x = from.x + (x - from.x) * e;
        pose.y = from.y + (y - from.y) * e - Math.sin(e * Math.PI) * Math.min(60, dist * 0.12);
        pose.rot = from.rot + ((opts.rot == null ? from.rot : opts.rot) - from.rot) * e;
        pose.fore = from.fore + ((opts.fore == null ? from.fore : opts.fore) - from.fore) * e;
        pose.lift = Math.max(opts.endLift || 0, from.lift + (peak - from.lift) * Math.sin(Math.min(1, e * 1.15) * Math.PI / 2)) * (1 - 0.7 * Math.max(0, (e - 0.75) / 0.25));
      });
    }
    function touchDown(ms) { // 落筆：輕微接觸回彈
      var l0 = pose.lift;
      return tween(ms || 100, function (k) { pose.lift = l0 * (1 - easeOut(k)) - 0.04 * Math.sin(k * Math.PI); });
    }
    function liftUp(to, ms) {
      var l0 = pose.lift;
      return tween(ms || 70, function (k) { pose.lift = l0 + (to - l0) * easeOut(k); });
    }

    // 一行字用一段動畫完成（不受畫面更新率影響）：
    // 拆成「筆劃單位」，標題一個字一單位、其他一小段一單位；單位之間筆尖輕輕提起
    function lineDuration(l, isTitle, fontSize) {
      var w = l.right - l.left;
      if (isTitle) return Math.max(1, Math.round(w / (fontSize * 0.98))) * 95;
      return Math.max(200, Math.min(520, w * 0.42));
    }
    function writeLine(block, l, isTitle, fontSize, dur) {
      var w = l.right - l.left, lh = l.bottom - l.top;
      var n = isTitle ? Math.max(1, Math.round(w / (fontSize * 0.98))) : Math.max(1, Math.round(w / (fontSize * 5.5)));
      // 每個單位的長短有變化，標題偶爾停頓
      var weights = [], sum = 0;
      for (var u = 0; u < n; u++) { var wt = rand(0.75, 1.3) + (isTitle && Math.random() < 0.1 ? rand(1, 2) : 0); weights.push(wt); sum += wt; }
      var edges = [0], acc = 0;
      for (u = 0; u < n; u++) { acc += weights[u] / sum; edges.push(acc); }
      var hr = block.getBoundingClientRect();
      var top = l.top - hr.top, bot = l.bottom - hr.top + 4, W = hr.width;
      var clip = function (x) {
        var xx = x - hr.left + 2;
        block.style.clipPath = 'polygon(-3000px -3000px, ' + (W + 3000) + 'px -3000px, ' + (W + 3000) + 'px ' + top + 'px, ' + xx + 'px ' + top + 'px, ' + xx + 'px ' + bot + 'px, -3000px ' + bot + 'px)';
      };
      var baseY = l.bottom - lh * 0.16;
      var strokes = isTitle ? 2.6 : 1.6;
      return tween(dur, function (k) {
        var u = 0;
        while (u < n - 1 && k > edges[u + 1]) u++;
        var uk = (k - edges[u]) / Math.max(1e-6, edges[u + 1] - edges[u]); // 單位內的進度
        var ph = uk * strokes * Math.PI;
        var x = l.left + w * (u + uk) / n;
        pose.x = x + Math.sin(ph * 2) * (isTitle ? 2.2 : 1.2);
        pose.y = baseY - Math.abs(Math.sin(ph)) * lh * (isTitle ? 0.5 : 0.3);
        pose.rot = WRITE_ROT + Math.sin(ph) * 1.4;
        // 單位結束前後輕輕提筆
        pose.lift = isTitle ? 0.14 * Math.max(0, 1 - Math.min(uk, 1 - uk) * 8) : 0;
        clip(l.left + w * (u + Math.min(1, uk * 1.05)) / n);
      }).then(function () { clip(l.right + 4); });
    }

    // 先估算總時間，內文超過預算就整體加速，首屏約 7 秒內寫完
    var plan = blocks.map(function (block) {
      var lines = lineRects(block);
      var cs = getComputedStyle(block.matches('h1, h2, h3, p, li') ? block : (block.querySelector('h1, h2, h3, p, li, a, strong, span') || block));
      var fontSize = parseFloat(cs.fontSize) || 17;
      var isTitle = block.matches('h1, .hero-title, .article-title, .page-title');
      return { block: block, lines: lines, fontSize: fontSize, isTitle: isTitle, durs: lines.map(function (l) { return lineDuration(l, isTitle, fontSize); }) };
    });
    // 固定成本：拿起 280、每段移動 230（含落筆）、每次換行 80、放回約 1000
    var titleMs = 0, bodyMs = 0, lineCount = 0, blockCount = 0;
    plan.forEach(function (b) {
      if (b.lines.length) blockCount++;
      b.durs.forEach(function (d) { if (b.isTitle) titleMs += d; else bodyMs += d; lineCount++; });
    });
    var BUDGET = 6500;
    var overhead = 280 + blockCount * 230 + Math.max(0, lineCount - blockCount) * 80 + 1000;
    var bodyScale = Math.min(1, Math.max(0.15, (BUDGET - titleMs - overhead) / Math.max(1, bodyMs)));

    function writeBlock(b) {
      if (skip) return Promise.resolve();
      var block = b.block, lines = b.lines;
      if (!lines.length) { block.style.clipPath = ''; return Promise.resolve(); }
      var li = 0;
      function next() {
        if (skip || li >= lines.length) { block.style.clipPath = ''; return Promise.resolve(); }
        var l = lines[li];
        var y = l.bottom - (l.bottom - l.top) * 0.16;
        // 換段：抬筆移過去再落筆；同一段裡換行：一個快速回車
        var travel = li === 0
          ? moveTo(l.left, y, { rot: WRITE_ROT, fore: 1, peak: 0.5, ms: 180 }).then(function () { return touchDown(50); })
          : moveTo(l.left, y, { ms: 80, peak: 0.18 });
        var dur = b.isTitle ? b.durs[li] : b.durs[li] * bodyScale;
        return travel.then(function () { return writeLine(block, l, b.isTitle, b.fontSize, dur); }).then(function () { li++; return next(); });
      }
      return next();
    }

    // 拿起：先轉一下調整握姿，再抬起
    var start = tween(280, function (k) {
      pose.rot = REST.rot - 5 * Math.sin(k * Math.PI);
      pose.lift = 0.35 * easeOut(k);
    });

    var chain = start.then(function () {
      var first = plan.find(function (b) { return b.lines.length; });
      if (!first) return;
      var l = first.lines[0];
      return moveTo(l.left, l.bottom - (l.bottom - l.top) * 0.16, { rot: WRITE_ROT, fore: 1, peak: 0.9 });
    });
    plan.forEach(function (b) { chain = chain.then(function () { return writeBlock(b); }); });

    return chain.then(function () {
      revealAll();
      var wasSkipped = skip;
      skip = false;
      // 放回：抬起、飛回桌面、放下、滾一下才停
      return liftUp(0.7, wasSkipped ? 60 : 120)
        .then(function () { return moveTo(REST.x, REST.y, { rot: REST.rot + 4, fore: 0, peak: 1, endLift: 0.15, ms: wasSkipped ? 420 : undefined }); })
        .then(function () { return liftUp(0, 130); })
        .then(function () {
          var r0 = pose.rot;
          return tween(700, function (k) {
            var damp = Math.exp(-4.5 * k);
            pose.rot = REST.rot + (r0 - REST.rot) * damp * Math.cos(k * 13);
            var roll = 4 * damp * Math.sin(k * 13); // 筆身滾動：垂直於筆身方向位移
            var a = (REST.rot + 90) * Math.PI / 180;
            pose.x = REST.x + Math.cos(a) * roll;
            pose.y = REST.y + Math.sin(a) * roll;
          });
        });
    }).then(function () {
      cleanup();
      resetPen(pen);
    });
  }
})();
