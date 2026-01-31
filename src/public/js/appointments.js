// =============================
// Manejo de turnos (frontend)
// =============================

// Cargar horarios al cambiar la fecha
const datePicker = document.getElementById("datePicker");
const timeSelect = document.getElementById("timeSelect");

if (datePicker) {
    datePicker.addEventListener("change", async (e) => {
        const date = e.target.value;
        const serviceId = document.getElementById("serviceId")?.value || "";

        if (!date) return;

        try {
            timeSelect.innerHTML = `<option value="">Cargando...</option>`;
            const res = await fetch(`/appointments/available?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`);
            const times = await res.json();

            timeSelect.innerHTML = "";

            if (!Array.isArray(times) || times.length === 0) {
                timeSelect.innerHTML = `<option>No hay horarios disponibles</option>`;
                return;
            }

            times.forEach(t => {
                const option = document.createElement("option");
                option.value = t;
                option.textContent = t;
                timeSelect.appendChild(option);
            });
        } catch (err) {
            console.error("Error cargando horarios:", err);
            alert("Hubo un problema al cargar los horarios disponibles.");
        }
    });
}
