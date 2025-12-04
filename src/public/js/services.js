// =============================
// Funciones relacionadas a Servicios
// =============================


const searchInput = document.getElementById("serviceSearch");

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const searchText = searchInput.value.toLowerCase();
        const cards = document.querySelectorAll(".card");

        cards.forEach(card => {
            const title = card.querySelector("h3").textContent.toLowerCase();
            card.style.display = title.includes(searchText) ? "block" : "none";
        });
    });
}