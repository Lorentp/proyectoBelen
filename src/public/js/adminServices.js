// ADMIN - Services CRUD (uses SweetAlert2)
const ADMIN_PASS = new URLSearchParams(window.location.search).get("pass") || "1234";

function openCreateService() {
  Swal.fire({
    title: "Nuevo Servicio",
    html: `
      <input id="name" class="swal2-input" placeholder="Nombre">
      <input id="description" class="swal2-input" placeholder="Descripción">
      <input id="duration" type="number" class="swal2-input" placeholder="Duración (min)" value="30">
      <input id="price" type="number" class="swal2-input" placeholder="Precio">
    `,
    showCancelButton: true,
    confirmButtonText: "Crear",
    preConfirm: () => {
      const name = document.getElementById("name").value.trim();
      const description = document.getElementById("description").value.trim();
      const duration = document.getElementById("duration").value;
      const price = document.getElementById("price").value;

      if (!name || price === "" || duration === "") {
        Swal.showValidationMessage("Nombre, duración y precio son obligatorios");
        return false;
      }

      return fetch(`/admin/services/create?pass=${ADMIN_PASS}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, duration, price })
      })
        .then(res => {
          if (!res.ok) throw new Error("Error creando servicio");
          return res;
        })
        .then(() => window.location.reload());
    }
  });
}

function openEditService(id) {
  const row = document.querySelector(`tr[data-id='${id}']`);
  const name = row.querySelector(".service-name").innerText;
  const description = row.querySelector(".service-description").innerText;
  const duration = row.querySelector(".service-duration")?.innerText?.replace("min", "").trim() || "30";
  const price = row.querySelector(".service-price").innerText.replace("$", "").trim();

  Swal.fire({
    title: "Editar Servicio",
    html: `
      <input id="name" class="swal2-input" value="${name}">
      <input id="description" class="swal2-input" value="${description}">
      <input id="duration" type="number" class="swal2-input" value="${duration}">
      <input id="price" type="number" class="swal2-input" value="${price}">
    `,
    showCancelButton: true,
    confirmButtonText: "Guardar cambios",
    preConfirm: () => {
      const newName = document.getElementById("name").value.trim();
      const newDescription = document.getElementById("description").value.trim();
      const newDuration = document.getElementById("duration").value;
      const newPrice = document.getElementById("price").value;

      return fetch(`/admin/services/update/${id}?pass=${ADMIN_PASS}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDescription,
          duration: newDuration,
          price: newPrice
        })
      }).then(res => {
        if (!res.ok) throw new Error("Error actualizando servicio");
        window.location.reload();
      });
    }
  });
}

function deleteService(id) {
  Swal.fire({
    title: "¿Eliminar servicio?",
    text: "No podrás deshacer esta acción",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Eliminar"
  }).then(result => {
    if (result.isConfirmed) {
      fetch(`/admin/services/delete/${id}?pass=${ADMIN_PASS}`, { method: "POST" }).then(res => {
        if (!res.ok) throw new Error("Error eliminando servicio");
        window.location.reload();
      });
    }
  });
}

