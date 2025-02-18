function updateCountdown() {
    const weddingDate = new Date("2025-07-20").getTime();
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
