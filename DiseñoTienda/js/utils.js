const API_BASE_URL = "https://localhost:7030";
const API_CARRITO_URL = `${API_BASE_URL}/api/Carrito`;

// ============================================
// DEBUG MODE - Mantener función vacía para compatibilidad
// ============================================
function debugLog(categoria, mensaje, datos = null) {
    // Función vacía - mantiene compatibilidad con código existente
}

// ============================================
// FUNCIONES COMPARTIDAS
// ============================================

/**
 * Obtiene el token JWT del almacenamiento local.
 * @returns {string | null} El token JWT.
 */
function obtenerToken() {
    return localStorage.getItem('token');
}

/**
 * Verifica si hay un token. Si no, redirige al login.
 * @returns {boolean} True si hay sesión activa, false si no.
 */
function verificarSesion() {
    const token = obtenerToken();
    
    if (!token) {
        mostrarNotificacion('Debes iniciar sesión para continuar', false);
        setTimeout(() => window.location.href = 'Login.html', 1500);
        return false;
    }
    
    // Verificar si el token está expirado
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiracion = new Date(payload.exp * 1000);
        const ahora = new Date();
        
        if (ahora > expiracion) {
            localStorage.removeItem('token');
            mostrarNotificacion('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', false);
            setTimeout(() => window.location.href = 'Login.html', 1500);
            return false;
        }
        
        return true;
        
    } catch (e) {
        console.error('Error al validar token:', e);
        localStorage.removeItem('token');
        mostrarNotificacion('Error en la sesión. Por favor, inicia sesión nuevamente.', false);
        setTimeout(() => window.location.href = 'Login.html', 1500);
        return false;
    }
}

/**
 * Muestra una notificación temporal tipo toast (mejorada)
 * @param {string} mensaje - El texto a mostrar
 * @param {boolean} esExito - true para éxito (verde), false para error (rojo)
 * @param {number} duracion - Milisegundos que durará la notificación (default: 3000)
 */
function mostrarNotificacion(mensaje, esExito = true, duracion = 3000) {
    // Remover notificaciones anteriores si existen
    const notificacionExistente = document.querySelector('.notificacion-toast');
    if (notificacionExistente) {
        notificacionExistente.remove();
    }

    // Crear la notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion-toast ${esExito ? 'exito' : 'error'}`;
    
    // Elegir el icono según el tipo
    const icono = esExito 
        ? '<i class="fas fa-check-circle"></i>' 
        : '<i class="fas fa-exclamation-circle"></i>';
    
    notificacion.innerHTML = `
        ${icono}
        <span>${mensaje}</span>
    `;
    
    // Agregar al body
    document.body.appendChild(notificacion);
    
    // Animar entrada
    setTimeout(() => {
        notificacion.classList.add('mostrar');
    }, 10);
    
    // Remover después de la duración especificada
    setTimeout(() => {
        notificacion.classList.remove('mostrar');
        setTimeout(() => {
            notificacion.remove();
        }, 300);
    }, duracion);
}

/**
 * Redirige a la página del carrito.
 */
function irAlCarrito() {
    window.location.href = 'Carrito.html';
}

/**
 * Actualiza el badge del carrito con la cantidad total de productos.
 */
async function actualizarBadgeCarrito() {
    const token = obtenerToken();
    const badge = document.getElementById('cantidadCarrito');
    
    if (!badge) return;
    
    if (!token) {
        badge.textContent = '0';
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE_URL}/api/Carrito/CantidadTotal`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (respuesta.ok) {
            const datos = await respuesta.json();
            badge.textContent = datos.cantidadTotal || '0';
            
            // Animación de pulse
            const badgeContainer = document.getElementById('carritoBadge');
            if (badgeContainer) {
                badgeContainer.classList.add('pulse');
                setTimeout(() => badgeContainer.classList.remove('pulse'), 500);
            }
        } else if (respuesta.status === 401) {
            localStorage.removeItem('token');
            badge.textContent = '0';
        } else {
            badge.textContent = '0';
        }
    } catch (error) {
        console.error('Error al actualizar badge del carrito:', error);
        badge.textContent = '0';
    }
}

// ============================================
// AGREGAR AL CARRITO (SIN CONFIRM MOLESTO)
// ============================================
/**
 * Agrega un producto al carrito
 * @param {number} idProducto - ID del producto a agregar
 * @param {string} talla - Talla seleccionada
 * @param {number} cantidad - Cantidad a agregar (default: 1)
 */
async function agregarAlCarrito(idProducto, talla, cantidad = 1) {
    if (!verificarSesion()) {
        mostrarNotificacion('Debes iniciar sesión para agregar productos al carrito', false);
        setTimeout(() => {
            window.location.href = 'Login.html';
        }, 1500);
        return;
    }

    if (!talla) {
        mostrarNotificacion('Por favor, selecciona una talla antes de agregar al carrito', false);
        return;
    }

    const token = obtenerToken();

    try {
        const respuesta = await fetch(`${API_CARRITO_URL}/AgregarProducto`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                idProducto: idProducto,
                cantidad: cantidad,
                talla: talla
            })
        });

        if (respuesta.status === 401) {
            mostrarNotificacion('Sesión expirada. Por favor, inicia sesión nuevamente', false);
            localStorage.removeItem('token');
            setTimeout(() => {
                window.location.href = 'Login.html';
            }, 1500);
            return;
        }

        if (!respuesta.ok) {
            const errorData = await respuesta.json();
            throw new Error(errorData.mensaje || 'Error al agregar al carrito');
        }

        // ¡ÉXITO! Mostrar notificación limpia (SIN CONFIRM)
        mostrarNotificacion('✓ Producto agregado al carrito correctamente', true);
        
        // Actualizar el badge del carrito
        actualizarBadgeCarrito();

    } catch (error) {
        console.error('Error al agregar producto:', error);
        mostrarNotificacion(error.message || 'No se pudo agregar el producto al carrito', false);
    }
}