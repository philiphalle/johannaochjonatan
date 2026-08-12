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
        const MAX_FILL = 0.62;   // hur stor del av skärmen som är fylld när glaset är fullt
        const POUR_ANGLE = 20;   // grader innan champagnen börjar rinna över kanten

        let spawnDebt = 0;
        let popped = false;
        let liquid = 0;      // 0-1, nuvarande nivå
        let tilt = 0;        // grader, positivt = höger sida ned
        let tiltTarget = 0;

        // Skärmen är glaset: ytan lutar tvärtemot hur enheten hålls.
        function surfaceY(x) {
            const base = H - liquid * H * MAX_FILL;
            return base - (x - W / 2) * Math.tan((tilt * Math.PI) / 180);
        }

        function spawnBubble(y) {
            const x = rand(0, W);
            bubbles.push({
                x: x,
                drawX: x,
                y: y === undefined ? H - rand(0, 40) : y,
                r: rand(9, 34) * S,
                vy: -rand(55, 150) * S,
                phase: rand(0, Math.PI * 2),
                wob: rand(10, 30) * S
            });
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

        function drawLiquid() {
            if (liquid <= 0.004) return;
            const yL = surfaceY(0);
            const yR = surfaceY(W);

            const grad = ctx.createLinearGradient(0, Math.min(yL, yR), 0, H);
            grad.addColorStop(0, "rgba(255, 214, 120, 0.55)");
            grad.addColorStop(1, "rgba(214, 150, 40, 0.75)");

            ctx.beginPath();
            ctx.moveTo(0, yL);
            ctx.lineTo(W, yR);
            ctx.lineTo(W, H + 4);
            ctx.lineTo(0, H + 4);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();

            // Skummet på ytan.
            ctx.beginPath();
            ctx.moveTo(0, yL);
            ctx.lineTo(W, yR);
            ctx.strokeStyle = "rgba(255, 248, 224, 0.9)";
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        startLoop(function (dt) {
            ctx.clearRect(0, 0, W, H);

            // Mjuk följning så att lutningen inte hackar.
            tilt += (tiltTarget - tilt) * Math.min(1, dt * 7);

            if (popped) {
                const tipped = Math.abs(tilt) > POUR_ANGLE;

                if (tipped && liquid > 0) {
                    // Häller ut: nivån sjunker och droppar sprutar över kanten.
                    const over = Math.min(1, (Math.abs(tilt) - POUR_ANGLE) / 30);
                    liquid = Math.max(0, liquid - over * 0.5 * dt);

                    const edgeX = tilt > 0 ? W : 0;
                    const dir = tilt > 0 ? 1 : -1;
                    const edgeY = surfaceY(edgeX);
                    const drops = Math.round(over * 70 * dt);
                    for (let i = 0; i < drops; i++) {
                        particles.push({
                            x: edgeX,
                            y: edgeY + rand(-14, 14),
                            vx: dir * rand(90, 330) * S,
                            vy: rand(-70, 90) * S,
                            life: rand(0.5, 1.1),
                            maxLife: 1.1,
                            size: rand(2, 5) * S,
                            color: GOLD[Math.floor(Math.random() * GOLD.length)]
                        });
                    }
                } else if (!tipped && liquid < 1) {
                    // Håll enheten rak så fylls glaset på igen.
                    liquid = Math.min(1, liquid + 0.42 * dt);
                }

                // Bubblor bildas bara i vätskan.
                spawnDebt += spawnRate * dt * liquid;
                while (spawnDebt >= 1) {
                    if (bubbles.length < maxBubbles) spawnBubble();
                    spawnDebt -= 1;
                }
            }

            drawLiquid();

            // Bubblorna stiger och spricker när de når ytan.
            for (let i = bubbles.length - 1; i >= 0; i--) {
                const b = bubbles[i];
                b.phase += dt * 2.2;
                b.y += b.vy * dt;
                const x = b.x + Math.sin(b.phase) * b.wob;
                b.drawX = x;

                if (b.y - b.r < surfaceY(x) || b.y + b.r < -20) {
                    if (b.y + b.r > 0) splash(x, b.y, 5, 2.4);
                    bubbles.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255, 236, 178, 0.18)";
                ctx.fill();
                ctx.strokeStyle = "rgba(255, 248, 224, 0.8)";
                ctx.lineWidth = 1.6;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(x - b.r * 0.32, b.y - b.r * 0.34, Math.max(1, b.r * 0.2), 0, Math.PI * 2);
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

        function onOrient(e) {
            if (e.gamma === null || e.gamma === undefined) return;
            tiltTarget = Math.max(-50, Math.min(50, e.gamma));
        }

        function onPointerTilt(e) {
            tiltTarget = Math.max(-40, Math.min(40, (e.clientX / W - 0.5) * 70));
        }

        function setHint(text) {
            tiltHint.textContent = text;
            tiltHint.hidden = false;
        }

        const canOrient = typeof window.DeviceOrientationEvent !== "undefined";
        const needsPermission =
            canOrient && typeof window.DeviceOrientationEvent.requestPermission === "function";

        if (needsPermission) {
            // iOS kräver att användaren själv säger ja till rörelsesensorn.
            tiltBtn.hidden = false;
            tiltBtn.onclick = function () {
                window.DeviceOrientationEvent.requestPermission()
                    .then(function (state) {
                        if (state === "granted") {
                            window.addEventListener("deviceorientation", onOrient);
                            tiltBtn.hidden = true;
                            setHint("Luta telefonen så rinner champagnen ut");
                        }
                    })
                    .catch(function () { /* ingen sensor, ingen skada skedd */ });
            };
        } else if (canOrient && isTouch()) {
            window.addEventListener("deviceorientation", onOrient);
            after(1400, function () { setHint("Luta telefonen så rinner champagnen ut"); });
        } else {
            window.addEventListener("pointermove", onPointerTilt);
            after(1400, function () { setHint("Dra musen i sidled för att luta glaset"); });
        }

        // Klicka/tappa för att spräcka bubblor.
        canvas.addEventListener("pointerdown", onTapPop);
        function onTapPop(e) {
            for (let i = bubbles.length - 1; i >= 0; i--) {
                const b = bubbles[i];
                const dx = b.drawX - e.clientX;
                const dy = b.y - e.clientY;
                if (Math.sqrt(dx * dx + dy * dy) < b.r + 18) {
                    splash(b.drawX, b.y, 10, 3);
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
