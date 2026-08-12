/* ============================================================
   Finalen - vad som händer när nedräkningen når noll.

   Tre shower roterar: fyrverkeri, pixelvigsel och champagne.
   Första gången en besökare får se en show slumpas den fram,
   därefter stegar replay-knappen vidare till nästa i ordningen.
   ============================================================ */
(function () {
    const WEDDING_TIME = Date.parse("2026-08-15T14:00:00+02:00");
    const SHOWS = ["fireworks", "pixel", "champagne"];
    const INDEX_KEY = "jj-finale-index";
    const SEEN_KEY = "jj-finale-seen";

    // localStorage kan vara blockerad i privat läge - fall tillbaka på minnet.
    const store = (function () {
        try {
            localStorage.setItem("jj-test", "1");
            localStorage.removeItem("jj-test");
            return localStorage;
        } catch (e) {
            const mem = {};
            return {
                getItem: (k) => (k in mem ? mem[k] : null),
                setItem: (k, v) => { mem[k] = String(v); }
            };
        }
    })();

    let overlay, canvas, gold, title, closeBtn, replayBtn, replayHint;
    let bubble1, bubble2, ring, heart, bottle, tiltBtn, tiltHint;

    let ctx = null;
    let W = 0, H = 0, S = 1;
    let rafId = null;
    let timers = [];
    let active = false;
    let deadlineHandled = false;
    let audioCtx = null;

    // Partikelvärldar - nollställs mellan showerna.
    let particles = [];
    let rockets = [];
    let bubbles = [];
    let cork = null;

    const GOLD = ["#ffd66b", "#fff3c4", "#ffffff", "#ffb347", "#f7e7ce", "#ffe9a8"];
    const PIXEL_COLORS = ["#ff6ea9", "#ffd66b", "#ffffff", "#e91e63", "#fff3c4", "#8bd3ff"];

    const reduceMotion = () =>
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const isSmall = () => Math.min(window.innerWidth, window.innerHeight) < 600;

    const isTouch = () => "ontouchstart" in window || navigator.maxTouchPoints > 0;

    const rand = (min, max) => min + Math.random() * (max - min);

    function after(ms, fn) {
        timers.push(setTimeout(fn, ms));
    }

    /* ---------- Canvas ---------- */

    function sizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
        ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Skalfaktor så att fart och storlek känns lika på mobil som på desktop.
        S = Math.max(0.55, Math.min(1.15, Math.min(W, H) / 900));
    }

    function startLoop(step) {
        let last = performance.now();
        const tick = (now) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            step(dt);
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
    }

    function fadeTrails(alpha) {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(10, 8, 14, " + alpha + ")";
        ctx.fillRect(0, 0, W, H);
    }

    function drawGlowParticles() {
        ctx.globalCompositeOperation = "lighter";
        particles.forEach((p) => {
            const a = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = a;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (0.4 + a * 0.6), 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
    }

    function stepParticles(dt, gravity, drag) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.vy += gravity * dt;
            p.vx *= drag;
            p.vy *= drag;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    /* ---------- Titel ---------- */

    function setTitle(main, sub) {
        title.innerHTML =
            '<span class="finale-title-main">' + main + "</span>" +
            '<span class="finale-title-sub">' + sub + "</span>";
    }

    function showTitle() {
        title.classList.add("show");
    }

    /* ---------- Show 1: fyrverkeri ---------- */

    function runFireworks() {
        const burst = isSmall() ? 46 : 84;
        let nextLaunch = 0.25;
        let elapsed = 0;

        function launchRocket(x, targetY) {
            const g = 500;
            const dist = Math.max(60, H - targetY);
            rockets.push({
                x: x,
                y: H + 8,
                vx: rand(-30, 30),
                vy: -Math.sqrt(2 * g * dist),
                targetY: targetY,
                color: GOLD[Math.floor(Math.random() * GOLD.length)]
            });
        }

        function explode(r) {
            const count = burst + Math.floor(rand(-10, 14));
            const twoTone = Math.random() < 0.4;
            const second = GOLD[Math.floor(Math.random() * GOLD.length)];
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + rand(-0.06, 0.06);
                const speed = rand(70, 280) * S;
                particles.push({
                    x: r.x,
                    y: r.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: rand(0.9, 1.9),
                    maxLife: 1.9,
                    size: rand(1.6, 3.4) * S,
                    color: twoTone && i % 2 === 0 ? second : r.color
                });
            }
        }

        startLoop(function (dt) {
            elapsed += dt;
            fadeTrails(0.19);

            // Nya raketer fram till finalvolleyn.
            nextLaunch -= dt;
            if (nextLaunch <= 0 && elapsed < 8.4) {
                launchRocket(rand(W * 0.12, W * 0.88), rand(H * 0.14, H * 0.46));
                nextLaunch = rand(0.34, 0.62);
            }

            // Rakethantering.
            for (let i = rockets.length - 1; i >= 0; i--) {
                const r = rockets[i];
                r.vy += 500 * dt;
                r.x += r.vx * dt;
                r.y += r.vy * dt;

                ctx.globalCompositeOperation = "lighter";
                ctx.strokeStyle = r.color;
                ctx.lineWidth = 2.2 * S;
                ctx.beginPath();
                ctx.moveTo(r.x, r.y);
                ctx.lineTo(r.x - r.vx * 0.03, r.y - r.vy * 0.03);
                ctx.stroke();
                ctx.globalCompositeOperation = "source-over";

                if (r.y <= r.targetY || r.vy >= 0) {
                    explode(r);
                    rockets.splice(i, 1);
                }
            }

            stepParticles(dt, 150, 0.985);
            drawGlowParticles();
        });

        after(1200, function () {
            setTitle("De har sagt ja!", "15 augusti 2026");
            showTitle();
        });

        // Finalvolley.
        after(8600, function () {
            for (let i = 0; i < 5; i++) {
                after(i * 160, function () {
                    launchRocket(rand(W * 0.1, W * 0.9), rand(H * 0.1, H * 0.4));
                });
            }
        });

        after(12500, close);
    }

    /* ---------- Show 2: pixelvigseln ---------- */

    function runPixel(opts) {
        overlay.classList.add("walking");

        // Låt webbläsaren måla startpositionen innan de går in i bild.
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                overlay.classList.add("walk-in");
            });
        });

        startLoop(function (dt) {
            ctx.clearRect(0, 0, W, H);
            stepParticles(dt, 420, 0.995);
            // Fyrkanter utan rotation ger pixelkänslan.
            particles.forEach(function (p) {
                ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 0.8));
                ctx.fillStyle = p.color;
                ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
            });
            ctx.globalAlpha = 1;
        });

        after(1500, function () { overlay.classList.remove("walking"); });
        after(1800, function () { bubble1.classList.add("show"); });
        after(3000, function () { bubble2.classList.add("show"); });
        after(4100, function () { ring.classList.add("show"); });
        after(5100, function () { heart.classList.add("pulse"); });

        after(6100, function () {
            heart.classList.remove("pulse");
            heart.classList.add("burst");
            pixelConfetti();
            if (opts.gesture) jingle();
        });

        after(6500, function () {
            setTitle("Johanna &amp; Jonatan", "Gifta 15 augusti 2026");
            showTitle();
        });

        after(13000, close);
    }

    function pixelConfetti() {
        const rect = heart.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const count = isSmall() ? 90 : 170;

        for (let i = 0; i < count; i++) {
            const angle = rand(0, Math.PI * 2);
            const speed = rand(90, 460) * S;
            const size = Math.round(rand(5, 13) * S);
            particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 120,
                life: rand(2.4, 4.2),
                maxLife: 4.2,
                size: size,
                color: PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)]
            });
        }
    }

    /* ---------- Show 3: champagnen ---------- */

    function runChampagne() {
        const maxBubbles = isSmall() ? 55 : 95;
        const spawnRate = isSmall() ? 11 : 18; // bubblor per sekund
        const MAX_FILL = 0.58;  // andel av skärmytan när glaset är fullt

        let spawnDebt = 0;
        let popped = false;
        let fill = 0;           // 0-1, hur mycket champagne som är kvar
        let gAngle = 0;         // tyngdkraftens riktning i skärmplanet, 0 = rakt ned
        let gTarget = 0;

        /* Skärmen är glaset, sett rakt framifrån. Mynningen är telefonens
           överkant - precis som på ett riktigt glas rinner det ut först när
           man lutar så mycket att vätskan når upp till kanten. */

        // Klipper skärmrutan mot halvplanet n·p >= d, alltså den del som är "under" ytan.
        function clipRect(nx, ny, d) {
            const rect = [[0, 0], [W, 0], [W, H], [0, H]];
            const out = [];
            for (let i = 0; i < 4; i++) {
                const a = rect[i];
                const b = rect[(i + 1) % 4];
                const da = nx * a[0] + ny * a[1] - d;
                const db = nx * b[0] + ny * b[1] - d;
                if (da >= 0) out.push(a);
                if ((da >= 0) !== (db >= 0)) {
                    const t = da / (da - db);
                    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
                }
            }
            return out;
        }

        function polyArea(p) {
            let a = 0;
            for (let i = 0; i < p.length; i++) {
                const q = p[(i + 1) % p.length];
                a += p[i][0] * q[1] - q[0] * p[i][1];
            }
            return Math.abs(a) / 2;
        }

        // Hittar ytans läge så att vätskans area motsvarar volymen.
        // Arean minskar när d växer, så en enkel halvering räcker.
        function levelFor(nx, ny, volume) {
            let lo = Infinity;
            let hi = -Infinity;
            const rect = [[0, 0], [W, 0], [W, H], [0, H]];
            for (let i = 0; i < 4; i++) {
                const v = nx * rect[i][0] + ny * rect[i][1];
                if (v < lo) lo = v;
                if (v > hi) hi = v;
            }
            for (let i = 0; i < 22; i++) {
                const mid = (lo + hi) / 2;
                if (polyArea(clipRect(nx, ny, mid)) > volume) lo = mid;
                else hi = mid;
            }
            return (lo + hi) / 2;
        }

        // Hur stor del av överkanten som vätskan täcker - där rinner det ut.
        function spillSpan(poly) {
            let x0 = Infinity;
            let x1 = -Infinity;
            for (let i = 0; i < poly.length; i++) {
                if (poly[i][1] <= 0.5) {
                    if (poly[i][0] < x0) x0 = poly[i][0];
                    if (poly[i][0] > x1) x1 = poly[i][0];
                }
            }
            return x1 > x0 ? { x0: x0, x1: x1, len: x1 - x0 } : null;
        }

        function spawnBubble(nx, ny, d, deepest) {
            // Bubblor bildas nere i vätskan, inte uppe vid ytan.
            for (let tries = 0; tries < 8; tries++) {
                const x = rand(0, W);
                const y = rand(0, H);
                const depth = nx * x + ny * y - d;
                if (depth > (deepest - d) * 0.35) {
                    bubbles.push({
                        x: x,
                        y: y,
                        drawX: x,
                        drawY: y,
                        r: rand(9, 34) * S,
                        speed: rand(55, 150) * S,
                        phase: rand(0, Math.PI * 2),
                        wob: rand(10, 30) * S
                    });
                    return;
                }
            }
        }

        function splash(x, y, count, size) {
            for (let i = 0; i < count; i++) {
                const angle = rand(0, Math.PI * 2);
                const speed = rand(40, 170) * S;
                particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: rand(0.3, 0.75),
                    maxLife: 0.75,
                    size: rand(1.4, size) * S,
                    color: GOLD[Math.floor(Math.random() * GOLD.length)]
                });
            }
        }

        // Korken skjuter iväg från flaskans mynning när den poppar.
        function pop() {
            popped = true;
            gold.classList.add("on");

            // Mynningen sitter uppe till vänster på emojin, så allt skjuts åt vänster.
            const rect = bottle.getBoundingClientRect();
            const bx = rect.left + rect.width * 0.22;
            const by = rect.top + rect.height * 0.24;

            cork = {
                x: bx,
                y: by,
                vx: -rand(460, 600) * S,
                vy: -rand(700, 880) * S,
                angle: 0,
                spin: rand(6, 11)
            };

            for (let i = 0; i < (isSmall() ? 30 : 50); i++) {
                const angle = -Math.PI + rand(0.15, 1.15);
                const speed = rand(160, 560) * S;
                particles.push({
                    x: bx,
                    y: by,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: rand(0.6, 1.5),
                    maxLife: 1.5,
                    size: rand(1.6, 3.4) * S,
                    color: GOLD[Math.floor(Math.random() * GOLD.length)]
                });
            }
        }

        function drawLiquid(poly, nx, ny, d, deepest) {
            if (poly.length < 3) return;

            // Gradienten löper från ytan ned mot vätskans djupaste punkt.
            const depth = deepest - d;
            const grad = ctx.createLinearGradient(
                nx * d, ny * d,
                nx * (d + depth), ny * (d + depth)
            );
            grad.addColorStop(0, "rgba(255, 214, 120, 0.55)");
            grad.addColorStop(1, "rgba(214, 150, 40, 0.78)");

            ctx.beginPath();
            ctx.moveTo(poly[0][0], poly[0][1]);
            for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();

            // Skummet ritas bara längs själva ytan, inte längs glasets kanter.
            ctx.strokeStyle = "rgba(255, 248, 224, 0.9)";
            ctx.lineWidth = 3;
            for (let i = 0; i < poly.length; i++) {
                const a = poly[i];
                const b = poly[(i + 1) % poly.length];
                const onSurface =
                    Math.abs(nx * a[0] + ny * a[1] - d) < 0.6 &&
                    Math.abs(nx * b[0] + ny * b[1] - d) < 0.6;
                if (onSurface) {
                    ctx.beginPath();
                    ctx.moveTo(a[0], a[1]);
                    ctx.lineTo(b[0], b[1]);
                    ctx.stroke();
                }
            }
        }

        startLoop(function (dt) {
            ctx.clearRect(0, 0, W, H);

            // Mjuk följning längs kortaste vägen runt cirkeln.
            let diff = gTarget - gAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            gAngle += diff * Math.min(1, dt * 7);

            const nx = Math.sin(gAngle);
            const ny = Math.cos(gAngle);

            // Djupaste hörnet i tyngdkraftens riktning.
            let deepest = -Infinity;
            const rect = [[0, 0], [W, 0], [W, H], [0, H]];
            for (let i = 0; i < 4; i++) {
                const v = nx * rect[i][0] + ny * rect[i][1];
                if (v > deepest) deepest = v;
            }

            const d = levelFor(nx, ny, fill * MAX_FILL * W * H);
            const poly = clipRect(nx, ny, d);
            const spill = fill > 0.001 ? spillSpan(poly) : null;

            if (popped) {
                if (spill) {
                    // Vätskan når mynningen: den rinner ut och nivån sjunker.
                    const rate = (spill.len / W) * 0.85;
                    fill = Math.max(0, fill - rate * dt);

                    const drops = Math.round(rate * 130 * dt);
                    for (let i = 0; i < drops; i++) {
                        const x = rand(spill.x0, spill.x1);
                        const speed = rand(120, 380) * S;
                        particles.push({
                            x: x,
                            y: rand(-6, 6),
                            vx: nx * speed + rand(-40, 40),
                            vy: ny * speed + rand(-40, 40),
                            life: rand(0.5, 1.1),
                            maxLife: 1.1,
                            size: rand(2, 5) * S,
                            color: GOLD[Math.floor(Math.random() * GOLD.length)]
                        });
                    }
                } else if (fill < 1) {
                    // Håll glaset rakt så fylls det på igen.
                    fill = Math.min(1, fill + 0.42 * dt);
                }

                spawnDebt += spawnRate * dt * fill;
                while (spawnDebt >= 1) {
                    if (bubbles.length < maxBubbles) spawnBubble(nx, ny, d, deepest);
                    spawnDebt -= 1;
                }
            }

            drawLiquid(poly, nx, ny, d, deepest);

            // Bubblorna stiger rakt uppåt i vätskan och spricker vid ytan.
            for (let i = bubbles.length - 1; i >= 0; i--) {
                const b = bubbles[i];
                b.phase += dt * 2.2;
                b.x -= nx * b.speed * dt;
                b.y -= ny * b.speed * dt;

                // Vingla i sidled, alltså vinkelrätt mot stigriktningen.
                const sway = Math.sin(b.phase) * b.wob;
                b.drawX = b.x - ny * sway;
                b.drawY = b.y + nx * sway;

                const depth = nx * b.drawX + ny * b.drawY - d;
                const outside =
                    b.drawX < -60 || b.drawX > W + 60 || b.drawY < -60 || b.drawY > H + 60;

                if (depth < b.r || outside) {
                    if (!outside) splash(b.drawX, b.drawY, 5, 2.4);
                    bubbles.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(b.drawX, b.drawY, b.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255, 236, 178, 0.18)";
                ctx.fill();
                ctx.strokeStyle = "rgba(255, 248, 224, 0.8)";
                ctx.lineWidth = 1.6;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(
                    b.drawX - b.r * 0.32, b.drawY - b.r * 0.34,
                    Math.max(1, b.r * 0.2), 0, Math.PI * 2
                );
                ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
                ctx.fill();
            }

            // Korken.
            if (cork) {
                cork.vy += 900 * dt;
                cork.x += cork.vx * dt;
                cork.y += cork.vy * dt;
                cork.angle += cork.spin * dt;

                ctx.save();
                ctx.translate(cork.x, cork.y);
                ctx.rotate(cork.angle);
                ctx.fillStyle = "#d9b382";
                ctx.fillRect(-8 * S, -13 * S, 16 * S, 26 * S);
                ctx.fillStyle = "#b8905e";
                ctx.fillRect(-8 * S, 1 * S, 16 * S, 6 * S);
                ctx.restore();

                if (cork.x + 30 < 0 || cork.x - 30 > W || cork.y - 30 > H) cork = null;
            }

            stepParticles(dt, 300, 0.99);
            drawGlowParticles();
        });

        // Flaskan skakar först, poppar sedan.
        after(950, pop);
        after(2300, function () {
            setTitle("Skål - de har sagt ja!", "15 augusti 2026");
            showTitle();
        });
        after(22000, close);

        /* --- Luta enheten för att hälla --- */

        // beta = framåt/bakåt, gamma = i sidled. Tillsammans ger de
        // tyngdkraftens riktning i skärmens plan.
        function onOrient(e) {
            if (e.beta === null || e.beta === undefined) return;
            const beta = (e.beta * Math.PI) / 180;
            const gamma = ((e.gamma || 0) * Math.PI) / 180;

            const gx = Math.sin(gamma) * Math.cos(beta);
            const gy = Math.sin(beta);
            if (Math.abs(gx) < 0.02 && Math.abs(gy) < 0.02) return; // platt: ingen riktning

            let angle = Math.atan2(gx, gy);

            // Kompensera för att skärmen kan vara vriden mot enheten.
            const screenAngle =
                (window.screen && window.screen.orientation && window.screen.orientation.angle) || 0;
            angle -= (screenAngle * Math.PI) / 180;

            gTarget = angle;
        }

        // På desktop finns ingen sensor: tyngdkraften pekar mot muspekaren.
        function onPointerTilt(e) {
            gTarget = Math.atan2(e.clientX - W / 2, e.clientY - H / 2);
        }

        function setHint(text) {
            tiltHint.textContent = text;
            tiltHint.hidden = false;
        }

        const canOrient = typeof window.DeviceOrientationEvent !== "undefined";
        const needsPermission =
            canOrient && typeof window.DeviceOrientationEvent.requestPermission === "function";
        const tiltText = "Luta telefonen framåt så rinner champagnen ut över kanten";

        if (needsPermission) {
            // iOS kräver att användaren själv säger ja till rörelsesensorn.
            tiltBtn.hidden = false;
            tiltBtn.onclick = function () {
                window.DeviceOrientationEvent.requestPermission()
                    .then(function (state) {
                        if (state === "granted") {
                            window.addEventListener("deviceorientation", onOrient);
                            tiltBtn.hidden = true;
                            setHint(tiltText);
                        }
                    })
                    .catch(function () { /* ingen sensor, ingen skada skedd */ });
            };
        } else if (canOrient && isTouch()) {
            window.addEventListener("deviceorientation", onOrient);
            after(1400, function () { setHint(tiltText); });
        } else {
            window.addEventListener("pointermove", onPointerTilt);
            after(1400, function () { setHint("För musen mot överkanten för att hälla"); });
        }

        // Klicka/tappa för att spräcka bubblor.
        canvas.addEventListener("pointerdown", onTapPop);
        function onTapPop(e) {
            for (let i = bubbles.length - 1; i >= 0; i--) {
                const b = bubbles[i];
                const dx = b.drawX - e.clientX;
                const dy = b.drawY - e.clientY;
                if (Math.sqrt(dx * dx + dy * dy) < b.r + 18) {
                    splash(b.drawX, b.drawY, 10, 3);
                    bubbles.splice(i, 1);
                }
            }
        }

        cleanupHooks.push(function () {
            canvas.removeEventListener("pointerdown", onTapPop);
            window.removeEventListener("deviceorientation", onOrient);
            window.removeEventListener("pointermove", onPointerTilt);
            tiltBtn.hidden = true;
            tiltBtn.onclick = null;
            tiltHint.hidden = true;
        });
    }

    /* ---------- Ljud ---------- */

    // Liten 8-bit-jingel. Bara bonus - får aldrig krascha showen.
    function jingle() {
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            if (!audioCtx) audioCtx = new AC();
            if (audioCtx.state === "suspended") audioCtx.resume();

            const notes = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
            const t0 = audioCtx.currentTime + 0.05;

            notes.forEach(function (freq, i) {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                const start = t0 + i * 0.15;
                osc.type = "square";
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(0.06, start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
                osc.connect(gain).connect(audioCtx.destination);
                osc.start(start);
                osc.stop(start + 0.17);
            });
        } catch (e) {
            /* tyst är helt okej */
        }
    }

    /* ---------- Uppspelning ---------- */

    let cleanupHooks = [];

    function stopShow() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        timers.forEach(clearTimeout);
        timers = [];
        cleanupHooks.forEach(function (fn) { fn(); });
        cleanupHooks = [];
    }

    function resetStage() {
        overlay.classList.remove(
            "show-fireworks", "show-pixel", "show-champagne",
            "walk-in", "walking", "finale-static"
        );
        gold.classList.remove("on");
        title.classList.remove("show");
        title.innerHTML = "";
        bubble1.classList.remove("show");
        bubble2.classList.remove("show");
        ring.classList.remove("show");
        heart.classList.remove("pulse", "burst");
        particles = [];
        rockets = [];
        bubbles = [];
        cork = null;
    }

    function play(name, opts) {
        opts = opts || {};
        stopShow();
        resetStage();
        sizeCanvas();
        ctx.clearRect(0, 0, W, H);

        overlay.classList.add("active", "show-" + name);
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("menu-open");
        active = true;

        // Med reducerad rörelse: ingen animation, bara budskapet.
        if (reduceMotion()) {
            overlay.classList.add("finale-static");
            setTitle(
                name === "pixel" ? "Johanna &amp; Jonatan" : "De har sagt ja!",
                "15 augusti 2026"
            );
            showTitle();
            after(7000, close);
            return;
        }

        if (name === "fireworks") runFireworks();
        else if (name === "pixel") runPixel(opts);
        else runChampagne();
    }

    function close() {
        if (!active) return;
        active = false;
        stopShow();
        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("menu-open");
        setTimeout(function () {
            if (!active) {
                resetStage();
                if (ctx) ctx.clearRect(0, 0, W, H);
            }
        }, 500);
    }

    // Slumpad show första gången, därefter nästa i ordningen vid varje replay.
    function nextShow(advance) {
        let idx = parseInt(store.getItem(INDEX_KEY), 10);
        if (isNaN(idx)) {
            idx = Math.floor(Math.random() * SHOWS.length);
        } else if (advance) {
            idx = (idx + 1) % SHOWS.length;
        }
        store.setItem(INDEX_KEY, idx);
        return SHOWS[idx];
    }

    function revealReplay() {
        replayBtn.classList.add("revealed");
        replayHint.hidden = false;
    }

    /* ---------- Init ---------- */

    document.addEventListener("DOMContentLoaded", function () {
        overlay = document.getElementById("finale");
        canvas = document.getElementById("finale-canvas");
        gold = document.getElementById("finale-gold");
        title = document.getElementById("finale-title");
        closeBtn = document.getElementById("finale-close");
        replayBtn = document.getElementById("finale-replay");
        replayHint = document.getElementById("finale-hint");
        bubble1 = document.getElementById("finale-bubble1");
        bubble2 = document.getElementById("finale-bubble2");
        ring = document.getElementById("finale-ring");
        heart = document.getElementById("finale-heart");
        bottle = document.getElementById("finale-bottle");
        tiltBtn = document.getElementById("finale-tilt");
        tiltHint = document.getElementById("finale-tilt-hint");

        if (!overlay || !canvas || !replayBtn) return;

        sizeCanvas();

        closeBtn.addEventListener("click", close);

        replayBtn.addEventListener("click", function () {
            play(nextShow(true), { gesture: true });
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && active) close();
        });

        window.addEventListener("resize", function () {
            if (active) sizeCanvas();
        });

        // Efter vigseln: knappen kliver fram och första besöket firas automatiskt.
        if (Date.now() >= WEDDING_TIME) {
            deadlineHandled = true;
            revealReplay();
            if (!store.getItem(SEEN_KEY)) {
                store.setItem(SEEN_KEY, "1");
                setTimeout(function () {
                    play(nextShow(false), { gesture: false });
                }, 1200);
            }
        }
    });

    // Anropas av nedräkningen i script.js när klockan slår 14:00.
    window.jjFinale = {
        play: play,
        deadlineReached: function () {
            if (deadlineHandled || !overlay) return;
            deadlineHandled = true;
            revealReplay();
            store.setItem(SEEN_KEY, "1");
            play(nextShow(false), { gesture: false });
        }
    };
})();
