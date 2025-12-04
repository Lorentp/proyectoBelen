// ADMIN - Weekly appointments (SweetAlert editor)
const ADMIN_PASS = new URLSearchParams(window.location.search).get("pass") || "1234";

function editAppointment(id) {
  fetch(`/admin/api/appointment/${id}?pass=${ADMIN_PASS}`)
    .then(res => {
      if (!res.ok) throw new Error("Turno no encontrado");
      return res.json();
    })
    .then(appt => {
      Swal.fire({
        title: "Editar Turno",
        html: `
          <input id="name" class="swal2-input" value="${escapeHtml(appt.name || "")}">
          <input id="phone" class="swal2-input" value="${escapeHtml(appt.phone || "")}">
          <input id="service" class="swal2-input" value="${escapeHtml(appt.service || appt.serviceName || "")}">
          <input id="date" type="date" class="swal2-input" value="${appt.date || ""}">
          <input id="time" type="time" class="swal2-input" value="${appt.time || ""}">
          <select id="status" class="swal2-input">
            <option value="confirmed" ${appt.status === "confirmed" ? "selected" : ""}>Confirmado</option>
            <option value="pending" ${appt.status === "pending" ? "selected" : ""}>Pendiente</option>
            <option value="cancelled" ${appt.status === "cancelled" ? "selected" : ""}>Cancelado</option>
          </select>
        `,
        showCancelButton: true,
        confirmButtonText: "Guardar cambios",
        preConfirm: () => {
          const payload = {
            name: document.getElementById("name").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            service: document.getElementById("service").value.trim(),
            date: document.getElementById("date").value,
            time: document.getElementById("time").value,
            status: document.getElementById("status").value
          };

          return fetch(`/admin/appointments-week/update/${id}?pass=${ADMIN_PASS}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }).then(res => {
            if (!res.ok) throw new Error("Error actualizando turno");
            return res;
          }).then(() => window.location.reload());
        }
      });
    })
    .catch(err => {
      console.error("editAppointment:", err);
      Swal.fire("Error", "No se pudo cargar el turno", "error");
    });
}

function deleteAppointment(id) {
  Swal.fire({
    title: "¿Eliminar turno?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar"
  }).then(result => {
    if (result.isConfirmed) {
      fetch(`/admin/appointments-week/delete/${id}?pass=${ADMIN_PASS}`, {
        method: "POST"
      }).then(res => {
        if (!res.ok) throw new Error("Error eliminando turno");
        window.location.reload();
      });
    }
  });
}

// Basic escaping for values inserted into template strings
function escapeHtml(unsafe) {
  return (unsafe + "").replace(/[&<>"'`=\/]/g, function (s) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    })[s];
  });
}