const API_BASE_URL = "https://localhost:7030";

// ============================================
// MODO DEBUG - CAMBIA A false CUANDO TERMINES
// ============================================
const DEBUG_MODE = true;

function debugLog(categoria, mensaje, datos = null) {
    if (!DEBUG_MODE) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const estilo = {
        'TOKEN': 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;',
        'SESION': 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px;',
        'API': 'background: #FF9800; color: white; padding: 2px 5px; border-radius: 3px;',
        'ERROR': 'background: #f44336; color: white; padding: 2px 5px; border-radius: 3px;',
        'CARRITO': 'background: #9C27B0; color: white; padding: 2px 5px; border-radius: 3px;'
    };
    
    console.log(
        `%c${categoria}%c [${timestamp}] ${mensaje}`,
        estilo[categoria] || 'background: #607D8B; color: white; padding: 2px 5px;',
        'color: inherit;'
    );
    
    if (datos) {
        console.log('📊 Datos:', datos);
    }
}

// ============================================
// FUNCIONES COMPARTIDAS
// ============================================

/**
 * Obtiene el token JWT del almacenamiento local.
 * @returns {string | null} El token JWT.
 */
function obtenerToken() {
    const token = localStorage.getItem('token');
    debugLog('TOKEN', token ? '✅ Token encontrado en localStorage' : '❌ No hay token en localStorage');
    
    if (token && DEBUG_MODE) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiracion = new Date(payload.exp * 1000);
            const ahora = new Date();
            const minRestantes = Math.floor((expiracion - ahora) / 1000 / 60);
            
            debugLog('TOKEN', `Expira en ${minRestantes} minutos`, {
                usuario: payload.sub || payload.unique_name,
                expiracion: expiracion.toLocaleString()
            });
        } catch (e) {
            debugLog('ERROR', 'Token inválido o mal formado', e);
        }
    }
    
    return token;
}

/**
 * Verifica si hay un token. Si no, redirige al login.
 * @returns {boolean} True si hay sesión activa, false si no.
 */
function verificarSesion() {
    debugLog('SESION', '🔍 Verificando sesión...');
    
    const token = obtenerToken();
    
    if (!token) {
        debugLog('ERROR', '❌ No hay sesión activa - redirigiendo a Login');
        mostrarNotificacion('Debes iniciar sesión para continuar', false);
        setTimeout(() => {
            window.location.href = 'Login.html';
        }, 1500);
        return false;
    }
    
    // Verificar si el token está expirado
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiracion = new Date(payload.exp * 1000);
        const ahora = new Date();
        
        if (ahora > expiracion) {
            debugLog('ERROR', '⚠️ Token EXPIRADO - limpiando y redirigiendo');
            localStorage.removeItem('token');
            mostrarNotificacion('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', false);
            setTimeout(() => {
                window.location.href = 'Login.html';
            }, 1500);
            return false;
        }
        
        debugLog('SESION', '✅ Sesión válida y activa');
        return true;
        
    } catch (e) {
        debugLog('ERROR', '❌ Error al validar token - puede estar corrupto', e);
        localStorage.removeItem('token');
        mostrarNotificacion('Error en la sesión. Por favor, inicia sesión nuevamente.', false);
        setTimeout(() => {
            window.location.href = 'Login.html';
        }, 1500);
        return false;
    }
}

/**
 * Muestra una notificación temporal en pantalla.
 * @param {string} mensaje - El texto a mostrar.
 * @param {boolean} esExito - Si es éxito (true) o error (false).
 */
function mostrarNotificacion(mensaje, esExito = true) {
    debugLog('NOTIF', `${esExito ? '✅' : '❌'} ${mensaje}`);
    
    const notif = document.createElement('div');
    notif.className = `notificacion-carrito ${esExito ? '' : 'error'}`;
    notif.innerHTML = `
        <span>${esExito ? '✓' : '✗'}</span>
        <span>${mensaje}</span>
    `;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.remove();
    }, 3000);
}

/**
 * Redirige a la página del carrito.
 */
function irAlCarrito() {
    debugLog('NAV', '🛒 Navegando al carrito');
    window.location.href = 'Carrito.html';
}

/**
 * Actualiza el badge del carrito con la cantidad total de productos.
 */
async function actualizarBadgeCarrito() {
    debugLog('CARRITO', '🔄 Actualizando badge del carrito...');
    
    const token = obtenerToken();
    const badge = document.getElementById('cantidadCarrito');
    
    if (!badge) {
        debugLog('CARRITO', '⚠️ Elemento badge no encontrado en DOM');
        return;
    }
    
    if (!token) {
        debugLog('CARRITO', '❌ No hay token - badge = 0');
        badge.textContent = '0';
        return;
    }

    try {
        debugLog('API', '📡 Llamando a CantidadTotal...');
        
        const respuesta = await fetch(`${API_BASE_URL}/api/Carrito/CantidadTotal`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        debugLog('API', `Respuesta: ${respuesta.status} ${respuesta.statusText}`);

        if (respuesta.ok) {
            const datos = await respuesta.json();
            debugLog('CARRITO', `✅ Cantidad obtenida: ${datos.cantidadTotal}`, datos);
            
            badge.textContent = datos.cantidadTotal || '0';
            
            // Animación de pulse
            const badgeContainer = document.getElementById('carritoBadge');
            if (badgeContainer) {
                badgeContainer.classList.add('pulse');
                setTimeout(() => badgeContainer.classList.remove('pulse'), 500);
            }
        } else if (respuesta.status === 401) {
            debugLog('ERROR', '❌ Token expirado (401) - limpiando sesión');
            localStorage.removeItem('token');
            badge.textContent = '0';
        } else {
            debugLog('ERROR', `❌ Error ${respuesta.status} al obtener cantidad`);
            badge.textContent = '0';
        }
    } catch (error) {
        debugLog('ERROR', '❌ Error de conexión al actualizar badge', error);
        badge.textContent = '0';
    }
}

// ============================================
// COMANDOS DE DEBUG EN CONSOLA
// ============================================
if (DEBUG_MODE) {
    window.debugCommands = {
        verToken: function() {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('%c❌ No hay token', 'color: red; font-size: 16px;');
                return;
            }
            
            try {
                const parts = token.split('.');
                const payload = JSON.parse(atob(parts[1]));
                console.log('%c✅ TOKEN ENCONTRADO', 'color: green; font-size: 16px;');
                console.table(payload);
                
                const exp = new Date(payload.exp * 1000);
                const ahora = new Date();
                console.log(`Expira: ${exp.toLocaleString()}`);
                console.log(`Vigente: ${ahora < exp ? '✅ SÍ' : '❌ NO'}`);
            } catch (e) {
                console.log('%c⚠️ Error al decodificar token', 'color: orange; font-size: 16px;', e);
            }
        },
        
        borrarToken: function() {
            localStorage.removeItem('token');
            console.log('%c🗑️ Token eliminado', 'color: orange; font-size: 16px;');
            actualizarBadgeCarrito();
        },
        
        verStorage: function() {
            console.log('%c📦 LOCALSTORAGE COMPLETO:', 'color: purple; font-size: 16px;');
            console.table(localStorage);
        },
        
        testAPI: async function() {
            console.log('%c🧪 Probando conexión con API...', 'color: cyan; font-size: 16px;');
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.log('%c❌ No hay token para probar', 'color: red; font-size: 14px;');
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/api/Carrito/CantidadTotal`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`%cStatus: ${response.status}`, response.ok ? 'color: green;' : 'color: red;', 'font-size: 14px;');
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('%c✅ Respuesta exitosa:', 'color: green; font-size: 14px;');
                    console.table(data);
                } else {
                    console.log('%c❌ Error en respuesta', 'color: red; font-size: 14px;');
                }
            } catch (error) {
                console.log('%c❌ Error en prueba de API', 'color: red; font-size: 14px;', error);
            }
        },
        
        ayuda: function() {
            console.log(`%c
╔════════════════════════════════════════╗
║     🔍 COMANDOS DE DEBUG DISPONIBLES   ║
╚════════════════════════════════════════╝

debugCommands.verToken()    - Ver info del token
debugCommands.borrarToken() - Eliminar token
debugCommands.verStorage()  - Ver localStorage completo
debugCommands.testAPI()     - Probar conexión con API
debugCommands.ayuda()       - Mostrar esta ayuda
            `, 'color: cyan; font-family: monospace;');
        }
    };
    
    console.log('%c🔍 MODO DEBUG ACTIVADO', 'background: #4CAF50; color: white; font-size: 20px; padding: 10px;');
    console.log('%cEscribe debugCommands.ayuda() para ver comandos disponibles', 'color: cyan; font-size: 14px;');
}