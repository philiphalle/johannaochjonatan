// Countdown timer
function updateCountdown() {
    const weddingDate = new Date("2026-08-15T14:00:00+02:00").getTime();
    const now = new Date().getTime();
    const difference = weddingDate - now;

    if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        document.getElementById("countdown").innerHTML =
            `${days} dagar, ${hours} timmar, ${minutes} minuter, ${seconds} sekunder kvar`;
    } else {
        document.getElementById("countdown").innerHTML = "Bröllopsdagen är här!";
        // Firandet drar igång i samma sekund som nedräkningen tar slut.
        if (window.jjFinale) window.jjFinale.deadlineReached();
    }
}

setInterval(updateCountdown, 1000);
updateCountdown();

// F1 car button - play/pause song
document.addEventListener("DOMContentLoaded", () => {
    const helmetButton = document.getElementById("helmet-button");
    const raceSong = document.getElementById("race-song");

    helmetButton.addEventListener("click", () => {
        if (raceSong.paused) {
            raceSong.play();
        } else {
            raceSong.pause();
            raceSong.currentTime = 0;
        }
    });
});

// Hamburger menu functionality
document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menu-toggle");
    const closeMenu = document.getElementById("close-menu");
    const menu = document.getElementById("menu");

    // Open menu
    menuToggle.addEventListener("click", () => {
        menu.classList.add("active");
        document.body.classList.add("menu-open");
    });

    // Close menu
    closeMenu.addEventListener("click", () => {
        menu.classList.remove("active");
        document.body.classList.remove("menu-open");
    });

    // Close menu when clicking a link
    document.querySelectorAll(".menu a").forEach(link => {
        link.addEventListener("click", () => {
            menu.classList.remove("active");
            document.body.classList.remove("menu-open");
        });
    });
});

// Change hamburger color when scrolling past header
document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById("menu-toggle");
    hamburger.style.color = "#222";
});

// Duplicate carousel images for infinite scroll effect
document.addEventListener("DOMContentLoaded", () => {
    const carousel = document.querySelector(".carousel");
    if (carousel) {
        const images = carousel.innerHTML;
        carousel.innerHTML = images + images; // Duplicate for seamless loop
    }
});

// Secret double-J shortcut to show I Do modal
(function() {
    let lastKeyTime = 0;
    let lastKey = '';

    function startIdoAnimation() {
        const modal = document.getElementById('ido-modal');
        const bubble1 = document.getElementById('bubble1');
        const bubble2 = document.getElementById('bubble2');
        const heart = document.getElementById('ido-heart');

        // Reset animation state
        bubble1.classList.remove('show');
        bubble2.classList.remove('show');
        heart.classList.remove('animate');

        // Show modal
        modal.classList.add('active');
        document.body.classList.add('menu-open');

        // Jonatan says "I do!"
        setTimeout(() => {
            bubble1.classList.add('show');
        }, 800);

        // Johanna says "I do!"
        setTimeout(() => {
            bubble2.classList.add('show');
        }, 2000);

        // Heart animation
        setTimeout(() => {
            heart.classList.add('animate');
        }, 3000);
    }

    function closeIdoModal() {
        const modal = document.getElementById('ido-modal');
        modal.classList.remove('active');
        document.body.classList.remove('menu-open');
    }

    document.addEventListener('keydown', (e) => {
        // Ignore if typing in form fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }

        const currentTime = Date.now();
        const key = e.key.toLowerCase();

        if (key === 'j') {
            if (lastKey === 'j' && (currentTime - lastKeyTime) < 500) {
                startIdoAnimation();
            }
            lastKey = 'j';
            lastKeyTime = currentTime;
        } else {
            lastKey = '';
        }
    });

    // Close button and mobile J tap
    document.addEventListener('DOMContentLoaded', () => {
        const closeBtn = document.getElementById('close-ido');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeIdoModal);
        }

        // Close on click outside
        const modal = document.getElementById('ido-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeIdoModal();
                }
            });
        }

        // Mobile double-tap on J's
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) {
            let lastTapTime = 0;
            const secretJs = document.querySelectorAll('.secret-j');

            secretJs.forEach(j => {
                j.addEventListener('click', (e) => {
                    const currentTime = Date.now();
                    if (currentTime - lastTapTime < 500) {
                        e.preventDefault();
                        startIdoAnimation();
                    }
                    lastTapTime = currentTime;
                });
            });
        }
    });
})();

// OSA Modal functionality
document.addEventListener("DOMContentLoaded", () => {
    const openButton = document.getElementById("open-osa-form");
    const modal = document.getElementById("osa-modal");
    const closeButton = document.getElementById("close-modal");

    // Open modal
    openButton.addEventListener("click", () => {
        modal.classList.add("active");
        document.body.classList.add("menu-open");
    });

    // Close modal with button
    closeButton.addEventListener("click", () => {
        modal.classList.remove("active");
        document.body.classList.remove("menu-open");
    });

    // Close modal when clicking outside
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("active");
            document.body.classList.remove("menu-open");
        }
    });
});
