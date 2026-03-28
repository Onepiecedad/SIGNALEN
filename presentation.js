/* ═══════════════════════════════════════════════════════════════════════════
   SIGNALEN Presentation — Parent Frame Logic
   ═══════════════════════════════════════════════════════════════════════════ */

const slides = [
    "slides/slide_1_title.html",
    "slides/slide_2_sammanfattning.html",
    "slides/slide_3_tech_1.html",
    "slides/slide_4_tech_2.html",
    "slides/slide_5_varfor.html",
    "slides/slide_6_berattelsen_bakgrund.html",
    "slides/slide_7_berattelsen_twisten.html",
    "slides/slide_8_rumslayout.html",
    "slides/slide_9_visuell_design.html",
    "slides/slide_10_akt_1.html",
    "slides/slide_11_akt_2.html",
    "slides/slide_12_akt_3.html",
    "slides/slide_13_sv\u00e5righetsgrad.html",
    "slides/slide_14_dashboard.html",
    "slides/slide_15_hardvaru.html",
    "slides/slide_16_budget_slutord.html"
];

let current = 0;
let playing = false;

const audio = document.getElementById('ambientAudio');
const audioBtn = document.getElementById('audioBtn');
const audioIcon = document.getElementById('audioIcon');
const audioLabel = document.getElementById('audioLabel');
const frame = document.getElementById('slideFrame');
const totalNum = document.getElementById('totalNum');
const currentNum = document.getElementById('currentNum');
const dotsContainer = document.getElementById('dots');

totalNum.textContent = slides.length;

// ── Audio toggle ─────────────────────────────────────────────────────────
function toggleAudio() {
    if (playing) {
        audio.pause();
        audioIcon.innerHTML = '&#128264;';
        audioLabel.textContent = 'ATMOSFÄR';
        audioBtn.classList.remove('playing');
        playing = false;
    } else {
        audio.volume = 0.55;
        audio.play().then(() => {
            audioIcon.innerHTML = '&#128266;';
            audioLabel.textContent = 'LJUD AV';
            audioBtn.classList.add('playing');
            playing = true;
        }).catch((e) => {
            console.warn('Audio play blocked:', e);
        });
    }
}

// ── Build slide dots ──────────────────────────────────────────────────────
for (let i = 0; i < slides.length; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.dataset.idx = i;
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
}

// ── Scale iframe to fill viewport ─────────────────────────────────────────
function scaleFrame() {
    const vp = document.getElementById('viewport');
    const vpW = vp.clientWidth;
    const vpH = vp.clientHeight;
    const isMobilePortrait = window.innerWidth < 768 && window.innerHeight > window.innerWidth;

    const wrapper = frame.parentElement;

    if (isMobilePortrait) {
        // Mobile portrait: full viewport, slides use responsive CSS
        frame.style.width = vpW + 'px';
        frame.style.height = vpH + 'px';
        frame.style.transform = 'none';
        frame.style.transformOrigin = '';
        frame.scrolling = 'auto';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.overflow = 'hidden';
    } else {
        // Desktop / landscape: fit 1280×720 within viewport with transform scale
        const scaleX = vpW / 1280;
        const scaleY = vpH / 720;
        const scale = Math.min(scaleX, scaleY) * 0.97;

        frame.style.width = '1280px';
        frame.style.height = '720px';
        frame.style.transform = 'scale(' + scale + ')';
        frame.style.transformOrigin = 'top center';
        frame.scrolling = 'no';
        wrapper.style.width = Math.floor(1280 * scale) + 'px';
        wrapper.style.height = Math.floor(720 * scale) + 'px';
        wrapper.style.overflow = 'hidden';
    }
}

// ── Force video autoplay inside iframe (iOS workaround) ───────────────────
function forceVideoAutoplay() {
    try {
        const iframeDoc = frame.contentDocument || frame.contentWindow.document;
        const videos = iframeDoc.querySelectorAll('video');
        videos.forEach((v) => {
            v.muted = true;
            v.setAttribute('playsinline', '');
            v.play().catch(() => {});
        });
    } catch (e) {
        // Cross-origin — can't access, rely on slide's own autoplay
    }
}

// ── Swipe detection inside iframe (doesn't block scrolling) ──────────────
function setupIframeSwipe() {
    try {
        const iframeDoc = frame.contentDocument || frame.contentWindow.document;
        let startX = 0, startY = 0, startTime = 0;

        iframeDoc.addEventListener('touchstart', function(e) {
            startX = e.changedTouches[0].screenX;
            startY = e.changedTouches[0].screenY;
            startTime = Date.now();
        }, { passive: true });

        iframeDoc.addEventListener('touchend', function(e) {
            const dx = e.changedTouches[0].screenX - startX;
            const dy = e.changedTouches[0].screenY - startY;
            const dt = Date.now() - startTime;

            // Horizontal swipe: dx > dy, distance > 50px, time < 400ms
            if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 50 && dt < 400) {
                if (dx < 0) nextSlide();
                else prevSlide();
            }
        }, { passive: true });
    } catch (e) {
        // Cross-origin — can't access iframe
    }
}

// ── Navigate to slide ─────────────────────────────────────────────────────
function goTo(idx) {
    current = idx;
    frame.src = slides[current];
    frame.onload = function() {
        scaleFrame();
        forceVideoAutoplay();
        setupIframeSwipe();
    };
    currentNum.textContent = current + 1;
    document.getElementById('prevBtn').disabled = current === 0;
    document.getElementById('nextBtn').disabled = current === slides.length - 1;
    const dots = dotsContainer.querySelectorAll('.dot');
    dots.forEach((d, i) => {
        d.className = 'dot' + (i === current ? ' active' : '');
    });
    if (current > 0) document.getElementById('hint').style.display = 'none';
}

function nextSlide() { if (current < slides.length - 1) goTo(current + 1); }
function prevSlide() { if (current > 0) goTo(current - 1); }

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') nextSlide();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevSlide();
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
});

window.addEventListener('resize', scaleFrame);

// ── Fullscreen toggle (cross-browser + iOS fallback) ──────────────────────
function toggleFullscreen() {
    const elem = document.documentElement;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) {
        document.body.classList.toggle('ios-fullscreen');
        const icon = document.getElementById('fsIcon');
        if (document.body.classList.contains('ios-fullscreen')) {
            icon.textContent = '✕';
            window.scrollTo(0, 1);
        } else {
            icon.textContent = '⛶';
        }
        setTimeout(scaleFrame, 100);
        return;
    }

    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch((e) => {
                console.warn('Fullscreen request denied:', e);
            });
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

function onFullscreenChange() {
    const icon = document.getElementById('fsIcon');
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        icon.textContent = '✕';
    } else {
        icon.textContent = '⛶';
    }
    setTimeout(scaleFrame, 100);
}

document.addEventListener('fullscreenchange', onFullscreenChange);
document.addEventListener('webkitfullscreenchange', onFullscreenChange);

// Init
goTo(0);
scaleFrame();
