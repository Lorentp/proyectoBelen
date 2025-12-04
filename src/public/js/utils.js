// =============================
// Funciones generales
// =============================

// Formatear números a moneda argentina ARS
export function formatARS(value) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS"
    }).format(value);
}

// Aviso toast básico (sin librerías)
export function showToast(msg, type = "info") {
    const div = document.createElement("div");
    div.className = `toast ${type}`;
    div.textContent = msg;

    document.body.appendChild(div);

    setTimeout(() => {
        div.classList.add("visible");
    }, 50);

    setTimeout(() => {
        div.classList.remove("visible");
        setTimeout(() => div.remove(), 300);
    }, 3000);
}