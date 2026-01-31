// ADMIN - Blocks CRUD (uses SweetAlert2)
const ADMIN_PASS = new URLSearchParams(window.location.search).get("pass") || "1234";
const FILTER_DATE = new URLSearchParams(window.location.search).get("date") || "";

function openCreateBlock() {
  Swal.fire({
    title: "Nuevo bloqueo",
    html: `
      <input id="date" type="date" class="swal2-input" value="${FILTER_DATE}">
      <input id="startTime" type="time" class="swal2-input" value="07:00" step="1800">
      <input id="endTime" type="time" class="swal2-input" value="21:00" step="1800">
      <input id="reason" class="swal2-input" placeholder="Motivo (opcional)">
      <div style="text-align:left; margin-top:8px;">
        <label style="display:flex; gap:8px; align-items:center; font-weight:600;">
          <input id="allDay" type="checkbox">
          Bloquear día completo (07:00 a 21:00)
        </label>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Guardar",
    didOpen: () => {
      const allDay = document.getElementById("allDay");
      const start = document.getElementById("startTime");
      const end = document.getElementById("endTime");
      allDay.addEventListener("change", () => {
        if (allDay.checked) {
          start.value = "07:00";
          end.value = "21:00";
        }
      });
    },
    preConfirm: () => {
      const date = document.getElementById("date").value;
      const startTime = document.getElementById("startTime").value;
      const endTime = document.getElementById("endTime").value;
      const reason = document.getElementById("reason").value.trim();

      if (!date || !startTime || !endTime) {
        Swal.showValidationMessage("Fecha y rango horario son obligatorios");
        return false;
      }

      return fetch(`/admin/blocks/create?pass=${encodeURIComponent(ADMIN_PASS)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, startTime, endTime, reason })
      }).then(res => {
        if (!res.ok) throw new Error("Error creando bloqueo");
        return res;
      }).then(() => window.location.reload());
    }
  });
}

function deleteBlock(id, date) {
  Swal.fire({
    title: "¿Eliminar bloqueo?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Eliminar"
  }).then(result => {
    if (result.isConfirmed) {
      const q = date ? `&date=${encodeURIComponent(date)}` : "";
      fetch(`/admin/blocks/delete/${id}?pass=${encodeURIComponent(ADMIN_PASS)}${q}`, {
        method: "POST"
      }).then(res => {
        if (!res.ok) throw new Error("Error eliminando bloqueo");
        window.location.reload();
      });
    }
  });
}

