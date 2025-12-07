const API_BASE_URL = "https://localhost:7030";

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
 * Muestra una notificación temporal en pantalla.
 * @param {string} mensaje - El texto a mostrar.
 * @param {boolean} esExito - Si es éxito (true) o error (false).
 */
function mostrarNotificacion(mensaje, esExito = true) {
    const notif = document.createElement('div');
    notif.className = `notificacion-carrito ${esExito ? '' : 'error'}`;
    notif.innerHTML = `
        <span>${esExito ? '✓' : '✗'}</span>
        <span>${mensaje}</span>
    `;
    
    document.body.appendChild(notif);
    
    setTimeout(() => notif.remove(), 3000);
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