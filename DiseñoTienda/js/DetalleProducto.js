const API_PRODUCTOS_URL = `${API_BASE_URL}/api/Productos`;
const API_CARRITO_URL = `${API_BASE_URL}/api/Carrito`;

let productoActual = null;
let varianteSeleccionada = null;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (!verificarSesion()) return;

    const params = new URLSearchParams(window.location.search);
    const productoId = params.get("id");

    if (!productoId) {
        mostrarNotificacion('Producto no encontrado', false);
        setTimeout(() => window.location.href = 'Ventas.html', 1500);
        return;
    }

    cargarDetalleProducto(productoId);
    actualizarBadgeCarrito();
});

// ============================================
// CARGAR PRODUCTO
// ============================================
async function cargarDetalleProducto(productoId) {
    try {
        const respuesta = await fetch(`${API_PRODUCTOS_URL}/${productoId}`);
        
        if (!respuesta.ok) {
            throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
        }

        const producto = await respuesta.json();
        productoActual = producto;
        renderizarDetalleProducto(producto);

    } catch (error) {
        console.error('Error al cargar detalle del producto:', error);
        mostrarNotificacion('Error al cargar el producto', false);
        setTimeout(() => window.location.href = 'Ventas.html', 2000);
    }
}

// ============================================
// RENDER DETALLE
// ============================================
function renderizarDetalleProducto(producto) {
    const imagenUrl = producto.urlImagen?.startsWith("/")
        ? `${API_BASE_URL}${producto.urlImagen}`
        : producto.urlImagen || "img/default.jpg";
    
    document.getElementById("producto-imagen").src = imagenUrl;
    document.getElementById("producto-nombre").textContent = 
        `${producto.marca || ''} ${producto.modelo || 'Sin nombre'}`.trim();
    document.getElementById("producto-categoria").textContent = 
        producto.seccion || 'Sin categoría';
    document.getElementById("producto-precio").textContent = 
        `$${producto.precio ? producto.precio.toFixed(2) : '0.00'}`;
    document.getElementById("producto-descripcion").textContent = 
        producto.descripcion || 'Sin descripción disponible';

    renderizarVariantes(producto.variantes || []);

    const btnComprar = document.querySelector('.btn-comprar');
    if (btnComprar) {
        btnComprar.onclick = agregarAlCarritoDesdeDetalle;
    }
}

// ============================================
// RENDER VARIANTES (TALLAS)
// ============================================
function renderizarVariantes(variantes) {
    const contenedor = document.getElementById("tallas-container");
    
    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!variantes || variantes.length === 0) {
        contenedor.innerHTML = '<p class="sin-tallas">No hay tallas disponibles</p>';
        return;
    }

    variantes.forEach(variante => {
        const box = document.createElement("div");
        box.classList.add("talla-box");

        if (variante.stock <= 0) {
            box.classList.add("sin-stock");
            box.title = "Sin stock disponible";
        }

        box.textContent = variante.talla;
        box.onclick = () => seleccionarVariante(variante, box);

        contenedor.appendChild(box);
    });
}

// ============================================
// SELECCIONAR TALLA
// ============================================
function seleccionarVariante(variante, elemento) {
    if (variante.stock <= 0) {
        mostrarNotificacion('Esta talla no tiene stock disponible', false);
        return;
    }

    document.querySelectorAll('.talla-box')
        .forEach(b => b.classList.remove('seleccionada'));

    elemento.classList.add('seleccionada');
    varianteSeleccionada = variante;
}

// ============================================
// AGREGAR AL CARRITO
// ============================================
async function agregarAlCarritoDesdeDetalle() {
    if (!varianteSeleccionada) {
        mostrarNotificacion('Por favor, selecciona una talla primero', false);
        return;
    }

    const token = obtenerToken();
    if (!token) {
        mostrarNotificacion('Sesión expirada. Inicia sesión nuevamente', false);
        setTimeout(() => window.location.href = 'Login.html', 1500);
        return;
    }

    try {
        const payload = {
            idproducto: productoActual.id,
            idvariante: varianteSeleccionada.id,
            cantidad: 1
        };

        const respuesta = await fetch(`${API_CARRITO_URL}/AgregarAlCarrito`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            mostrarNotificacion(
                `✅ ${productoActual.modelo} - Talla ${varianteSeleccionada.talla} agregado al carrito`,
                true
            );

            actualizarBadgeCarrito();

            document.querySelectorAll('.talla-box')
                .forEach(b => b.classList.remove('seleccionada'));
            varianteSeleccionada = null;

            if (confirm('Producto agregado al carrito. ¿Deseas ver tu carrito?')) {
                window.location.href = 'carrito.html';
            }

        } else if (respuesta.status === 401) {
            mostrarNotificacion('Sesión expirada. Inicia sesión nuevamente', false);
            localStorage.removeItem('token');
            setTimeout(() => window.location.href = 'Login.html', 1500);

        } else {
            mostrarNotificacion(datos.mensaje || 'Error al agregar producto al carrito', false);
        }

    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        mostrarNotificacion('Error de conexión. Por favor, intenta nuevamente', false);
    }
}

// ============================================
// IR AL CARRITO
// ============================================
function irAlCarrito() {
    window.location.href = 'carrito.html';
}