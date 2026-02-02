// ADMIN - Weekly appointments (SweetAlert editor)
const ADMIN_PASS = new URLSearchParams(window.location.search).get("pass") || "1234";

function createAppointment() {
  const services = Array.isArray(window.ADMIN_SERVICES) ? window.ADMIN_SERVICES : [];
  const today = new Date().toISOString().slice(0, 10);

  const serviceOptions = services
    .map(s => `<option value="${s._id}" data-duration="${s.duration || 30}">${escapeHtml(s.name)} (${s.duration || 30} min)</option>`)
    .join("");

  Swal.fire({
    title: "Nuevo turno (manual)",
    html: `
      <input id="name" class="swal2-input" placeholder="Nombre">
      <input id="phone" class="swal2-input" placeholder="WhatsApp (ej: 54911XXXXXXX)">

      <select id="serviceId" class="swal2-input">
        <option value="">Servicio (escribir abajo si no está)</option>
        ${serviceOptions}
      </select>
      <input id="service" class="swal2-input" placeholder="Servicio (opcional)">

      <input id="date" type="date" class="swal2-input" value="${today}">
      <input id="time" type="time" class="swal2-input" value="07:00" step="1800">
      <input id="durationMinutes" type="number" class="swal2-input" value="30" min="30" step="30" placeholder="Duración (min)">
      <small style="display:block; text-align:left; color:#8b7a7a; margin:6px 6px 0;">
        Se valida contra bloqueos, solapamientos y horario 07:00–21:00.
      </small>
    `,
    showCancelButton: true,
    confirmButtonText: "Crear",
    didOpen: () => {
      const select = document.getElementById("serviceId");
      const duration = document.getElementById("durationMinutes");
      select.addEventListener("change", () => {
        const opt = select.options[select.selectedIndex];
        const d = Number(opt?.dataset?.duration);
        if (Number.isFinite(d) && d > 0) duration.value = String(d);
      });
    },
    preConfirm: () => {
      const payload = {
        name: document.getElementById("name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        serviceId: document.getElementById("serviceId").value || null,
        service: document.getElementById("service").value.trim(),
        date: document.getElementById("date").value,
        time: document.getElementById("time").value,
        durationMinutes: document.getElementById("durationMinutes").value
      };

      if (!payload.name || !payload.phone || !payload.date || !payload.time) {
        Swal.showValidationMessage("Nombre, teléfono, fecha y hora son obligatorios");
        return false;
      }

      return fetch(`/admin/appointments-week/create?pass=${ADMIN_PASS}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Error creando turno");
        }
        return res;
      }).then(() => window.location.reload())
        .catch(err => {
          Swal.showValidationMessage(err.message || "Error creando turno");
          return false;
        });
    }
  });
}

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
