/*const togglePassword = document.querySelector('#togglePassword');
const passwordInput = document.querySelector('#contrasena');

togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    this.classList.toggle('fa-eye')
    this.classList.toggle('fa-eye-slash');
});

const API_BASE_URL = 'https://localhost:7030'; 
const API_LOGIN_URL = `${API_BASE_URL}/api/VerificarLogin/login`; 

const loginForm = document.getElementById('loginForm');
const correoInput = document.getElementById('correo');
const contrasenaInput = document.getElementById('contrasena');
const mensajeEstado = document.getElementById('mensaje-estado');

function mostrarMensaje(texto, esExito = false) {
    mensajeEstado.textContent = texto;
    mensajeEstado.classList.remove('success', 'error');
    mensajeEstado.classList.add(esExito ? 'success' : 'error');
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const correo = correoInput.value;
    const password = contrasenaInput.value; 
    
    const datosLogin = {
        correo: correo, 
        password: password 
    };
    
    mostrarMensaje('Conectando...', false); 
    
    try {
        const respuesta = await fetch(API_LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosLogin) 
        });

        const datosRespuesta = await respuesta.json();

        if (respuesta.ok) {
            // ÉXITO (Status 200 OK)
            mostrarMensaje(`${datosRespuesta.mensaje}`, true);
            
            // 🔥 IMPORTANTE: Guardar el TOKEN JWT (lo más importante)
            localStorage.setItem('token', datosRespuesta.token);
            
            // Guardar datos adicionales del usuario
            localStorage.setItem('usuarioCorreo', correo);
            localStorage.setItem('usuarioId', datosRespuesta.usuarioId);
            localStorage.setItem('sesion', 'activa');
            
            console.log('Token guardado:', datosRespuesta.token); // Para debug
            
            setTimeout(() => {
                window.location.href = 'Ventas.html';
            }, 800);
            
        } else {
            mostrarMensaje(`ERROR (${respuesta.status}): ${datosRespuesta.mensaje || 'Credenciales inválidas.'}`, false);
        }

    } catch (error) {
        mostrarMensaje('Error de red: No se pudo conectar con la API. Verifica CORS.', false);
        console.error('Error de fetch:', error);
    }
});*/

const togglePassword = document.querySelector('#togglePassword');
const passwordInput = document.querySelector('#contrasena');

togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    this.classList.toggle('fa-eye')
    this.classList.toggle('fa-eye-slash');
});

const API_BASE_URL = 'https://localhost:7030'; 
const API_LOGIN_URL = `${API_BASE_URL}/api/VerificarLogin/login`; 

const loginForm = document.getElementById('loginForm');
const correoInput = document.getElementById('correo');
const contrasenaInput = document.getElementById('contrasena');
const mensajeEstado = document.getElementById('mensaje-estado');

function mostrarMensaje(texto, esExito = false) {
    mensajeEstado.textContent = texto;
    mensajeEstado.classList.remove('success', 'error');
    mensajeEstado.classList.add(esExito ? 'success' : 'error');
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    console.log('═══════════════════════════════════════');
    console.log('🔐 INICIANDO PROCESO DE LOGIN');
    console.log('═══════════════════════════════════════');
    
    const correo = correoInput.value;
    const password = contrasenaInput.value; 
    
    console.log('📧 Email:', correo);
    console.log('🔑 Password:', password ? '***' : '(vacío)');
    
    const datosLogin = {
        correo: correo, 
        password: password 
    };
    
    mostrarMensaje('Conectando...', false); 
    
    try {
        console.log('📡 Enviando request a:', API_LOGIN_URL);
        console.log('📦 Datos enviados:', JSON.stringify(datosLogin));
        
        const respuesta = await fetch(API_LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosLogin) 
        });

        console.log('📨 Respuesta recibida - Status:', respuesta.status, respuesta.statusText);

        const datosRespuesta = await respuesta.json();
        console.log('📄 Datos de respuesta:', datosRespuesta);

        if (respuesta.ok) {
            console.log('%c✅ LOGIN EXITOSO', 'color: green; font-size: 18px; font-weight: bold;');
            
            // ÉXITO (Status 200 OK)
            mostrarMensaje(`${datosRespuesta.mensaje}`, true);
            
            // Verificar que el token existe en la respuesta
            if (!datosRespuesta.token) {
                console.error('%c❌ ERROR: La API no devolvió un token', 'color: red; font-size: 16px;');
                console.log('Respuesta completa:', datosRespuesta);
                mostrarMensaje('Error: No se recibió token del servidor', false);
                return;
            }
            
            console.log('🔑 Token recibido (primeros 50 chars):', datosRespuesta.token.substring(0, 50) + '...');
            console.log('🔑 Token completo:', datosRespuesta.token);
            
            // 🔥 PASO 1: Limpiar localStorage antes de guardar (por si acaso)
            console.log('🧹 Limpiando localStorage anterior...');
            localStorage.clear();
            
            // 🔥 PASO 2: Guardar el TOKEN JWT
            console.log('💾 Guardando token en localStorage...');
            localStorage.setItem('token', datosRespuesta.token);
            
            // 🔥 PASO 3: Verificar INMEDIATAMENTE que se guardó
            const tokenGuardado = localStorage.getItem('token');
            if (tokenGuardado) {
                console.log('%c✅ TOKEN GUARDADO EXITOSAMENTE', 'color: green; font-size: 16px; font-weight: bold;');
                console.log('Token guardado (verificación):', tokenGuardado.substring(0, 50) + '...');
            } else {
                console.error('%c❌ ERROR CRÍTICO: Token NO se guardó en localStorage', 'color: red; font-size: 18px; font-weight: bold;');
                alert('ERROR: No se pudo guardar la sesión. Revisa la consola.');
                return;
            }
            
            // Guardar datos adicionales del usuario
            console.log('💾 Guardando datos adicionales...');
            localStorage.setItem('usuarioCorreo', correo);
            localStorage.setItem('usuarioId', datosRespuesta.usuarioId);
            localStorage.setItem('sesion', 'activa');
            
            // Verificar TODO el localStorage
            console.log('📦 localStorage completo después de guardar:');
            console.table({
                token: localStorage.getItem('token') ? 'EXISTE ✅' : 'NO EXISTE ❌',
                usuarioCorreo: localStorage.getItem('usuarioCorreo'),
                usuarioId: localStorage.getItem('usuarioId'),
                sesion: localStorage.getItem('sesion')
            });
            
            console.log('⏳ Esperando 800ms antes de redirigir...');
            
            setTimeout(() => {
                console.log('🚀 Verificación final antes de redirigir:');
                const tokenFinal = localStorage.getItem('token');
                if (tokenFinal) {
                    console.log('%c✅ Token aún existe antes de redirigir', 'color: green; font-weight: bold;');
                    console.log('🚀 Redirigiendo a Ventas.html...');
                    window.location.href = 'Ventas.html';
                } else {
                    console.error('%c❌ ERROR: Token desapareció antes de redirigir', 'color: red; font-size: 16px; font-weight: bold;');
                    alert('ERROR CRÍTICO: La sesión se perdió. No se puede continuar.');
                }
            }, 800);
            
        } else {
            console.error('%c❌ LOGIN FALLIDO', 'color: red; font-size: 18px;');
            console.error('Status:', respuesta.status);
            console.error('Mensaje:', datosRespuesta.mensaje);
            mostrarMensaje(`ERROR (${respuesta.status}): ${datosRespuesta.mensaje || 'Credenciales inválidas.'}`, false);
        }

    } catch (error) {
        console.error('%c❌ ERROR DE CONEXIÓN', 'color: red; font-size: 18px;');
        console.error('Error completo:', error);
        mostrarMensaje('Error de red: No se pudo conectar con la API. Verifica CORS.', false);
    }
    
    console.log('═══════════════════════════════════════');
});