
function verProducto(nombre, imagen, precio, categoria) {
    const producto = { nombre, imagen, precio, categoria };
    localStorage.setItem("productoSeleccionado", JSON.stringify(producto));
    window.location.href = "DetalleProducto.html";
}

