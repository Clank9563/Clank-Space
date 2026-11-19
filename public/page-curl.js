// 換頁時的紙張捲曲（WebGL）。
// 分工：還平貼著的舊頁 = View Transition 的截圖，沿摺線被切掉；
//       捲起來的部分 = 這裡用 WebGL 畫的一張會彎曲的紙（沒有字，是紙的背面），外加投在新頁上的影子。
// 不支援 WebGL、減少動態效果、或拿不到舊頁位置時，什麼都不做，退回 CSS 的翻頁效果。
(function () {
  var DURATION = 1300;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // 舊頁：離開前記下整張紙的位置，給新頁計算摺線用
  addEventListener('pageswap', function (e) {
    if (!e.viewTransition) return;
    var body = document.querySelector('.nb-body');
    if (!body) return;
    var r = body.getBoundingClientRect();
    try {
      sessionStorage.setItem('nb-sheet-rect', JSON.stringify({ left: r.left, top: r.top, width: r.width, height: r.height }));
    } catch (err) {}
  });

  addEventListener('pagereveal', function (e) {
    var vt = e.viewTransition;
    if (!vt) return;
    var a = window.navigation && navigation.activation;
    var back = !!(a && a.from && a.entry && a.navigationType === 'traverse' && a.entry.index < a.from.index);
    if (back) vt.types.add('back');
    if (reduce.matches) return;

    var oldRect = null;
    try { oldRect = JSON.parse(sessionStorage.getItem('nb-sheet-rect') || 'null'); } catch (err) {}
    var body = document.querySelector('.nb-body');
    if (!oldRect || !body) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'nb-curl';
    canvas.setAttribute('aria-hidden', 'true');
    var gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: true, alpha: true, depth: true });
    if (!gl) return;
    var curl = setup(gl);
    if (!curl) return;

    vt.types.add('curl');
    document.body.appendChild(canvas);

    // 被切掉的那張截圖：往前翻是舊頁；上一頁時是新頁（前一頁從左邊攤回來）
    var newRect = body.getBoundingClientRect();
    var sheet = back ? newRect : oldRect;
    var pseudo = back ? '::view-transition-new(nb-sheet)' : '::view-transition-old(nb-sheet)';

    var dpr = Math.min(devicePixelRatio || 1, 2);
    var W = innerWidth, H = innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // 摺線隨時間的位置：一開始斜的（從右下角掀起），翻到後來變直
    var L = sheet.left, R = sheet.left + sheet.width;
    function fold(t) {
      var p = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // 慢起、加速、慢收
      if (back) p = 1 - p;
      var radius = 46 + 34 * Math.sin(Math.PI * Math.min(1, p * 1.4));
      var angle = (1 - p) * 0.24 + 0.02;                // 弧度，摺線的傾斜
      var fx = R + 40 - p * (R - L + 40 + radius * 2.4); // 摺線在畫面頂端的 x
      return { fx: fx, fy: 0, angle: angle, radius: radius, p: p };
    }

    // 截圖的裁切：只留下摺線左側（還平貼著的部分）
    var frames = [];
    for (var i = 0; i <= 48; i++) {
      var f = fold(i / 48);
      var tan = Math.tan(f.angle);
      // 視窗座標的摺線 x(y) = fx - (y - fy) * tan；換成截圖座標（左上角為原點）
      var yTop = sheet.top, yBot = sheet.top + sheet.height;
      var xTop = f.fx - (yTop - f.fy) * tan - L;
      var xBot = f.fx - (yBot - f.fy) * tan - L;
      frames.push({
        clipPath: 'polygon(-100px -100px, ' + xTop.toFixed(1) + 'px 0px, ' + xBot.toFixed(1) + 'px ' + sheet.height.toFixed(1) + 'px, -100px ' + (sheet.height + 100).toFixed(1) + 'px)',
      });
    }

    var colors = readColors();
    var raf = 0, anim = null;
    // 進度直接讀裁切動畫的 currentTime，捲曲的紙和截圖的切口永遠同步
    function frame() {
      var t = anim ? Math.min(1, (Number(anim.currentTime) || 0) / DURATION) : 0;
      curl.draw(fold(t), sheet, W, H, dpr, colors, back);
      if (t < 1) raf = requestAnimationFrame(frame);
    }

    curl.draw(fold(0), sheet, W, H, dpr, colors, back);
    vt.ready.then(function () {
      anim = document.documentElement.animate(frames, { duration: DURATION, easing: 'linear', fill: 'both', pseudoElement: pseudo });
      raf = requestAnimationFrame(frame);
    }).catch(function () {});
    vt.finished.finally(function () {
      cancelAnimationFrame(raf);
      canvas.remove();
    });
  });

  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    function rgb(name, fallback) {
      var v = cs.getPropertyValue(name).trim() || fallback;
      var m = v.match(/^#([0-9a-f]{6})$/i);
      if (!m) return [0.9, 0.93, 0.86];
      var n = parseInt(m[1], 16);
      return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
    }
    return {
      pad: rgb('--pad', '#e4eedc'),
      grid: rgb('--grid', '#c6d9bb'),
      ink: rgb('--ink', '#1f2a22'),
      dark: document.documentElement.dataset.theme === 'dark',
    };
  }

  function setup(gl) {
    // 紙：一張網格，摺線右側的頂點捲到圓柱上，超過半圈就翻到背面平放
    var vsPaper = [
      'attribute vec2 aPos;',
      'uniform vec2 uRes; uniform vec2 uFold; uniform vec2 uDir; uniform float uR;',
      'varying float vS; varying float vTheta; varying vec2 vPage;',
      'void main() {',
      '  float s = dot(aPos - uFold, uDir);',
      '  float along = s; float z = 0.0; float th = 0.0;',
      '  float PI = 3.14159265;',
      '  if (s > 0.0) {',
      '    if (s < PI * uR) { th = s / uR; along = uR * sin(th); z = uR * (1.0 - cos(th)); }',
      '    else { th = PI; along = -(s - PI * uR); z = 2.0 * uR; }',
      '  }',
      '  vec2 p = aPos + uDir * (along - s);',
      '  float persp = 2200.0 / (2200.0 - z);', // 捲起的紙離讀者近，稍微放大
      '  vec2 c = vec2(uRes.x * 0.5, uRes.y * 0.45);',
      '  p = c + (p - c) * persp;',
      '  vS = s; vTheta = th; vPage = aPos;',
      '  vec2 clip = p / uRes * 2.0 - 1.0;',
      '  gl_Position = vec4(clip.x, -clip.y, -z / 1000.0, 1.0);',
      '}',
    ].join('\n');
    var fsPaper = [
      'precision mediump float;',
      'varying float vS; varying float vTheta; varying vec2 vPage;',
      'uniform vec3 uPad; uniform vec3 uGrid; uniform float uDark;',
      'float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
      'void main() {',
      '  if (vS <= 0.5) discard;',
      '  vec2 g = abs(fract(vPage / 24.0 + 0.5) - 0.5) * 24.0;',
      '  float line = 1.0 - smoothstep(0.0, 1.1, min(g.x, g.y));',
      '  bool backSide = !gl_FrontFacing;',
      '  vec3 paper = mix(uPad, uGrid, line * (backSide ? 0.35 : 1.0));', // 背面只隱約透出方格
      '  if (backSide) paper = mix(paper, vec3(1.0), uDark > 0.5 ? 0.04 : 0.18);',
      '  float n = hash(floor(vPage)) * 0.05 - 0.025;',
      '  float c = cos(vTheta);',
      '  float shade = 0.78 + 0.24 * abs(c);', // 圓柱側面較暗
      '  shade += 0.16 * exp(-pow(vTheta - 1.05, 2.0) / 0.09);', // 彎曲處的反光
      '  if (vTheta > 3.1) shade = backSide ? 1.0 : 0.95;',
      '  vec3 col = paper * shade + n;',
      '  gl_FragColor = vec4(col, 1.0);',
      '}',
    ].join('\n');
    // 影子：投在新頁上，緊貼捲起的紙邊緣，往外漸淡
    var vsShadow = [
      'attribute vec2 aPos;', 'uniform vec2 uRes;', 'varying vec2 vP;',
      'void main() { vP = aPos; vec2 clip = aPos / uRes * 2.0 - 1.0; gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0); }',
    ].join('\n');
    var fsShadow = [
      'precision mediump float;',
      'varying vec2 vP; uniform vec2 uFold; uniform vec2 uDir; uniform float uR; uniform vec3 uInk; uniform vec4 uSheet; uniform float uStrength;',
      'void main() {',
      '  if (vP.x < uSheet.x || vP.x > uSheet.z) discard;',
      '  float s = dot(vP - uFold, uDir);',
      '  if (s < 0.0) discard;',
      '  float d = max(s - uR * 0.9, 0.0);',
      '  float a = uStrength * smoothstep(0.0, uR * 0.5, s) * exp(-d / (uR * 1.3));',
      '  gl_FragColor = vec4(uInk * a, a);',
      '}',
    ].join('\n');

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    }
    function program(vs, fs) {
      var v = compile(gl.VERTEX_SHADER, vs), f = compile(gl.FRAGMENT_SHADER, fs);
      if (!v || !f) return null;
      var p = gl.createProgram();
      gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    }
    var paperProg = program(vsPaper, fsPaper);
    var shadowProg = program(vsShadow, fsShadow);
    if (!paperProg || !shadowProg) return null;

    var meshBuf = gl.createBuffer(), quadBuf = gl.createBuffer();
    var meshCount = 0, meshKey = '';

    function buildMesh(x0, y0, x1, y1) {
      var NX = 160, NY = 48, v = [];
      for (var j = 0; j < NY; j++) for (var i = 0; i < NX; i++) {
        var ax = x0 + (x1 - x0) * i / NX, bx = x0 + (x1 - x0) * (i + 1) / NX;
        var ay = y0 + (y1 - y0) * j / NY, by = y0 + (y1 - y0) * (j + 1) / NY;
        v.push(ax, ay, bx, ay, ax, by, bx, ay, bx, by, ax, by);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, meshBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
      meshCount = v.length / 2;
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    return {
      draw: function (f, sheet, W, H, dpr, col, back) {
        gl.clearColor(0, 0, 0, 0);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);
        var dir = [Math.cos(f.angle), Math.sin(f.angle)];
        var y0 = Math.max(sheet.top, -200), y1 = Math.min(sheet.top + sheet.height, H + 200);
        var key = [sheet.left, y0, sheet.left + sheet.width, y1].join(',');
        if (key !== meshKey) { buildMesh(sheet.left, y0, sheet.left + sheet.width, y1); meshKey = key; }

        // 影子
        gl.useProgram(shadowProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, W, 0, 0, H, W, 0, W, H, 0, H]), gl.STREAM_DRAW);
        var loc = gl.getAttribLocation(shadowProg, 'aPos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(gl.getUniformLocation(shadowProg, 'uRes'), W, H);
        gl.uniform2f(gl.getUniformLocation(shadowProg, 'uFold'), f.fx, f.fy);
        gl.uniform2f(gl.getUniformLocation(shadowProg, 'uDir'), dir[0], dir[1]);
        gl.uniform1f(gl.getUniformLocation(shadowProg, 'uR'), f.radius);
        gl.uniform3fv(gl.getUniformLocation(shadowProg, 'uInk'), col.dark ? [0, 0, 0] : col.ink);
        gl.uniform4f(gl.getUniformLocation(shadowProg, 'uSheet'), sheet.left, 0, sheet.left + sheet.width, H);
        gl.uniform1f(gl.getUniformLocation(shadowProg, 'uStrength'), (col.dark ? 0.55 : 0.32) * Math.sin(Math.PI * Math.min(1, f.p * 1.15 + 0.05)));
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // 捲起的紙（深度測試：翻到背面的那段要蓋在捲曲部分上面）
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.useProgram(paperProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, meshBuf);
        loc = gl.getAttribLocation(paperProg, 'aPos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(gl.getUniformLocation(paperProg, 'uRes'), W, H);
        gl.uniform2f(gl.getUniformLocation(paperProg, 'uFold'), f.fx, f.fy);
        gl.uniform2f(gl.getUniformLocation(paperProg, 'uDir'), dir[0], dir[1]);
        gl.uniform1f(gl.getUniformLocation(paperProg, 'uR'), f.radius);
        gl.uniform3fv(gl.getUniformLocation(paperProg, 'uPad'), col.pad);
        gl.uniform3fv(gl.getUniformLocation(paperProg, 'uGrid'), col.grid);
        gl.uniform1f(gl.getUniformLocation(paperProg, 'uDark'), col.dark ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, meshCount);
      },
    };
  }
})();
