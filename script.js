// Countdown timer
function updateCountdown() {
    const weddingDate = new Date("2026-08-15").getTime();
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
