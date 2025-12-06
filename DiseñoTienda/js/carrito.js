const API_CARRITO_URL = `${API_BASE_URL}/api/Carrito`;


async function cargarCarrito() {
    if (!verificarSesion()) return;

    const token = obtenerToken();
    const itemsBody = document.getElementById('items-carrito-body');
    const contenido = document.getElementById('carrito-contenido');
    const vacioMensaje = document.getElementById('carrito-vacio-mensaje');
    
    if (!itemsBody) return;
    
    // Mostrar mensaje de carga mientras se espera la respuesta
    itemsBody.innerHTML = '<tr><td colspan="5">Cargando carrito...</td></tr>';
    
    try {
        const respuesta = await fetch(`${API_CARRITO_URL}/ObtenerCarrito`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (respuesta.status === 401) {
            mostrarNotificacion('Sesión expirada. Inicia sesión nuevamente.', false);
            localStorage.removeItem('token'); 
            setTimeout(() => window.location.href = 'Login.html', 1500);
            return;
        }

        if (!respuesta.ok) {
            const errorData = await respuesta.json();
            throw new Error(errorData.mensaje || 'Error al obtener el carrito');
        }

        const datosCarrito = await respuesta.json();
        
        // Manejar el estado del carrito (vacío o con contenido)
        if (datosCarrito.productos.length === 0) {
            if (contenido) contenido.style.display = 'none';
            if (vacioMensaje) vacioMensaje.style.display = 'flex';
            itemsBody.innerHTML = '';
            return;
        }

        if (contenido) contenido.style.display = 'block';
        if (vacioMensaje) vacioMensaje.style.display = 'none';
        
        renderizarCarrito(datosCarrito);

    } catch (error) {
        console.error('Error al cargar carrito:', error);
        mostrarNotificacion('Error de conexión o del servidor al cargar el carrito.', false);
        itemsBody.innerHTML = '<tr><td colspan="5">No se pudo cargar el carrito.</td></tr>';
    }
}

/**
 * Dibuja la tabla de productos y actualiza el resumen.
 * @param {object} datos - Objeto con los datos del carrito.
 */
function renderizarCarrito(datos) {
    const itemsBody = document.getElementById('items-carrito-body');
    if (!itemsBody) return;
    
    itemsBody.innerHTML = ''; 

    datos.productos.forEach(item => {
        const fila = document.createElement('tr');
        
        // Construye la URL de la imagen
        const imageUrl = item.imagen 
            ? (item.imagen.startsWith("/") ? `${API_BASE_URL}${item.imagen}` : item.imagen)
            : "img/default.jpg";

        fila.innerHTML = `
            <td>
                <div class="item-detalle">
                    <img src="${imageUrl}" alt="${item.modelo}" class="producto-img-miniatura">
                    <span>${item.marca} - ${item.modelo}</span>
                </div>
            </td>
            <td>$${item.precio.toFixed(2)}</td>
            <td>
                <input 
                    type="number" 
                    min="1" 
                    value="${item.cantidad}" 
                    class="cantidad-input"
                    onchange="actualizarCantidad(${item.idCarrito}, this.value)"
                >
            </td>
            <td>$${item.subtotal.toFixed(2)}</td>
            <td>
                <button class="btn-eliminar" onclick="eliminarProducto(${item.idCarrito})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        itemsBody.appendChild(fila);
    });

    // Actualizar resumen
    const totalProductosBadge = document.getElementById('total-productos-badge');
    const cantidadTotal = document.getElementById('cantidadTotal');
    const totalAPagar = document.getElementById('total-a-pagar');
    
    if (totalProductosBadge) totalProductosBadge.textContent = datos.productos.length;
    if (cantidadTotal) cantidadTotal.textContent = datos.cantidadTotal;
    if (totalAPagar) totalAPagar.textContent = `$${datos.totalPagar.toFixed(2)}`;
    
    // Habilitar/Deshabilitar botón de pago
    const procederBtn = document.getElementById('proceder-pago-btn');
    if (procederBtn) {
        procederBtn.disabled = datos.totalPagar === 0;
    }
    
    // Actualizar badge global del carrito
    actualizarBadgeCarrito();
}

// ============================================
// ACTUALIZAR CANTIDAD (PUT)
// ============================================

/**
 * Envía una solicitud PUT a la API para actualizar la cantidad de un producto.
 * @param {number} idCarrito - ID del item del carrito a modificar.
 * @param {string | number} nuevaCantidad - La nueva cantidad deseada.
 */
async function actualizarCantidad(idCarrito, nuevaCantidad) {
    if (!verificarSesion()) return;
    
    const cantidad = parseInt(nuevaCantidad);
    if (isNaN(cantidad) || cantidad < 1) {
        mostrarNotificacion('Cantidad inválida. Mínimo es 1.', false);
        cargarCarrito(); 
        return;
    }

    const token = obtenerToken();
    
    try {
        const respuesta = await fetch(`${API_CARRITO_URL}/ActualizarCantidad`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                idCarrito: idCarrito,
                cantidad: cantidad 
            })
        });

        if (respuesta.status === 401) {
            mostrarNotificacion('Sesión expirada.', false);
            localStorage.removeItem('token');
            setTimeout(() => window.location.href = 'Login.html', 1500);
            return;
        }

        if (!respuesta.ok) {
            const errorData = await respuesta.json();
            throw new Error(errorData.mensaje || 'Error al actualizar cantidad');
        }

        mostrarNotificacion('Cantidad actualizada.', true);
        cargarCarrito(); // Recargar todo el carrito para recalcular totales

    } catch (error) {
        console.error('Error al actualizar cantidad:', error);
        mostrarNotificacion(`Error: ${error.message || 'No se pudo actualizar la cantidad.'}`, false);
        cargarCarrito(); 
    }
}

// ============================================
// ELIMINAR PRODUCTO (DELETE)
// ============================================

/**
 * Envía una solicitud DELETE a la API para eliminar un producto del carrito.
 * @param {number} idCarrito - ID del item del carrito a eliminar.
 */
async function eliminarProducto(idCarrito) {
    if (!verificarSesion() || !confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        return;
    }

    const token = obtenerToken();
    
    try {
        const respuesta = await fetch(`${API_CARRITO_URL}/EliminarProducto/${idCarrito}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (respuesta.status === 401) {
            mostrarNotificacion('Sesión expirada.', false);
            localStorage.removeItem('token');
            setTimeout(() => window.location.href = 'Login.html', 1500);
            return;
        }

        if (!respuesta.ok) {
            const errorData = await respuesta.json();
            throw new Error(errorData.mensaje || 'Error al eliminar producto');
        }

        mostrarNotificacion('Producto eliminado correctamente.', true);
        cargarCarrito(); // Recargar el carrito
        
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        mostrarNotificacion('Error al eliminar producto.', false);
    }
}

// ============================================
// VACIAR CARRITO (DELETE)
// ============================================

/**
 * Envía una solicitud DELETE a la API para vaciar todo el carrito.
 */
async function vaciarCarrito() {
    if (!verificarSesion() || !confirm('¿Estás seguro de que deseas vaciar todo el carrito? Esta acción es irreversible.')) {
        return;
    }

    const token = obtenerToken();
    
    try {
        const respuesta = await fetch(`${API_CARRITO_URL}/VaciarCarrito`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (respuesta.status === 401) {
            mostrarNotificacion('Sesión expirada.', false);
            localStorage.removeItem('token');
            setTimeout(() => window.location.href = 'Login.html', 1500);
            return;
        }

        if (!respuesta.ok) {
            const errorData = await respuesta.json();
            throw new Error(errorData.mensaje || 'Error al vaciar carrito');
        }

        mostrarNotificacion('El carrito ha sido vaciado.', true);
        cargarCarrito(); // Recargar, lo que mostrará el mensaje de carrito vacío
        
    } catch (error) {
        console.error('Error al vaciar carrito:', error);
        mostrarNotificacion('Error al vaciar carrito.', false);
    }
}

// ============================================
// IR AL CHECKOUT
// ============================================

/**
 * Redirige a la página de checkout
 */
function irAlCheckout() {
    debugLog('NAV', '🛒 Navegando al checkout');
    window.location.href = 'checkout.html';
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Iniciar la carga del carrito al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarCarrito();
    actualizarBadgeCarrito();
    
    // Conectar botón de finalizar compra
    const btnCheckout = document.getElementById('proceder-pago-btn');
    if (btnCheckout) {
        btnCheckout.addEventListener('click', irAlCheckout);
    }
});