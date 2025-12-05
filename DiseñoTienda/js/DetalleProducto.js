
const params = new URLSearchParams(window.location.search);
const productoId = params.get("id");

if (!productoId) {
    alert("No se encontró el producto.");
    throw new Error("ID no encontrado");
}


const API_URL = `https://localhost:7030/api/Productos/${productoId}`;

async function cargarDetalleProducto() {
    try {
        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
            throw new Error("No se pudo obtener el producto");
        }

        const producto = await respuesta.json();

        const imagenUrl = producto.urlImagen
            ? (producto.urlImagen.startsWith("/")
                ? `https://localhost:7030${producto.urlImagen}`
                : producto.urlImagen)
            : "img/default.jpg";

        document.getElementById("producto-imagen").src = imagenUrl;

        document.getElementById("producto-nombre").textContent = producto.modelo;

        document.getElementById("producto-categoria").textContent = producto.seccion;

        document.getElementById("producto-precio").textContent = "$" + producto.precio;

        document.getElementById("producto-descripcion").textContent =
            producto.descripcion || "Sin descripción disponible.";

        const tallasContainer = document.getElementById("tallas-container");
        tallasContainer.innerHTML = "";

        if (producto.variantes && producto.variantes.length > 0) {
            producto.variantes.forEach(v => {
                const box = document.createElement("div");
                box.classList.add("talla-box");
                box.textContent = v.talla;
                tallasContainer.appendChild(box);
            });
        } else {
            tallasContainer.innerHTML = "<p>No hay tallas disponibles.</p>";
        }

    } catch (error) {
        console.error("Error cargando detalle del producto:", error);
    }
}

cargarDetalleProducto();
