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

// hamburger and menu
document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menu-toggle");
    const closeMenu = document.getElementById("close-menu");
    const menu = document.getElementById("menu");
    const gallery = document.querySelector(".gallery");

    let isMenuOpen = false; // Track menu state

    // Open menu
    menuToggle.addEventListener("click", function () {
        menu.classList.add("active");
        isMenuOpen = true;
    });

    // Close menu
    closeMenu.addEventListener("click", function () {
        menu.classList.remove("active");
        isMenuOpen = false;
    });

    // Close menu when clicking a link
    document.querySelectorAll(".menu a").forEach(link => {
        link.addEventListener("click", function () {
            menu.classList.remove("active");
            isMenuOpen = false;
        });
    });
});

// stop scrolling when menu is open
document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menu-toggle");
    const closeMenu = document.getElementById("close-menu");
    const menu = document.getElementById("menu");

    // Open menu
    menuToggle.addEventListener("click", function () {
        menu.classList.add("active");
        document.body.classList.add("menu-open"); // Disable scrolling
    });

    // Close menu
    closeMenu.addEventListener("click", function () {
        menu.classList.remove("active");
        document.body.classList.remove("menu-open"); // Re-enable scrolling
    });

    // Close menu when clicking a link
    document.querySelectorAll(".menu a").forEach(link => {
        link.addEventListener("click", function () {
            menu.classList.remove("active");
            document.body.classList.remove("menu-open"); // Re-enable scrolling
        });
    });
});

// Change color of hamburger menu when scrolling past the header
document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.getElementById("menu-toggle");
    const header = document.querySelector("header");
    
    function updateHamburgerColor() {
        const headerBottom = header.offsetHeight; // Get header height

        if (window.scrollY > headerBottom) {
            hamburger.style.color = "#374a51"; // Change color when scrolled past the header
        } else {
            hamburger.style.color = "white"; // Default color in header
        }
    }

    // Run function on scroll
    window.addEventListener("scroll", updateHamburgerColor);
    
    // Run on page load in case the page is already scrolled down
    updateHamburgerColor();
});