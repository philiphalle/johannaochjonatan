function updateCountdown() {
    const weddingDate = new Date("2026-06-13").getTime();
    const now = new Date().getTime();
    const difference = weddingDate - now;

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    document.getElementById("countdown").innerHTML =
        `${days} dagar, ${hours} timmar, ${minutes} minuter, ${seconds} sekunder kvar`;
}

setInterval(updateCountdown, 1000);
updateCountdown();

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

// image carousel
document.addEventListener("DOMContentLoaded", () => {
    const images = document.querySelectorAll(".scroll-image");

    const scrollReveal = () => {
        const triggerBottom = window.innerHeight * 0.8;

        images.forEach((img) => {
            const imgTop = img.getBoundingClientRect().top;
            if (imgTop < triggerBottom) {
                img.classList.add("show");
            }
        });
    };

    window.addEventListener("scroll", scrollReveal);
    scrollReveal(); // Run once to show initial images
});

// lightbox
document.addEventListener("DOMContentLoaded", () => {
    const images = document.querySelectorAll(".scroll-image");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const closeBtn = document.querySelector(".close");

    images.forEach(img => {
        img.addEventListener("click", () => {
            lightboxImg.src = img.src;
            lightbox.classList.add("show");
        });
    });

    closeBtn.addEventListener("click", () => {
        lightbox.classList.remove("show");
    });

    lightbox.addEventListener("click", (e) => {
        if (e.target !== lightboxImg) {
            lightbox.classList.remove("show");
        }
    });
});