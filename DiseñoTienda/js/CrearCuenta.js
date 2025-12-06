// Diseño
const togglePassword = document.querySelector('#togglePassword');
const passwordInput = document.querySelector('#contrasena');

togglePassword.addEventListener('click', function () {
    
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    this.classList.toggle('fa-eye')
    this.classList.toggle('fa-eye-slash');
});



const API_BASE_URL = 'https://localhost:7030'; 
const API_REGISTRO_URL = `${API_BASE_URL}/api/RegistrarUsuario/Registrar`; 


const registrarUsaurio = document.getElementById('registrarUsuario');
const nombreUs = document.getElementById('nombre');
const correoUs = document.getElementById('correo');

const passwordUs = document.getElementById('contrasena');
const mensajeEstado = document.getElementById('mensaje-estado');


function mostrarMensaje(texto, esExito = false) {
    mensajeEstado.textContent = texto;
    mensajeEstado.classList.remove('success', 'error');
    mensajeEstado.classList.add(esExito ? 'success' : 'error');
}


registrarUsaurio.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = nombreUs.value;
    const correo = correoUs.value;
    const password = passwordUs.value; 


    const datosUsuario= {
        nombre: nombre,
        correo: correo,
        password: password
    };

    mostrarMensaje('Conectando...', false); 

    try {
        const respuesta = await fetch(API_REGISTRO_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(datosUsuario)
        });



        const datosRespuesta = await respuesta.json();



        if (respuesta.ok) {

            mostrarMensaje(`✅ ${datosRespuesta.mensaje || 'Registro exitoso.'}`, true);

            setTimeout(() => {
                window.location.href = 'Ventas.html';
            }, 800);

        } else {
        
            mostrarMensaje(`ERROR (${respuesta.status}): ${datosRespuesta.mensaje || 'Error desconocido al registrar.'}`, false);
        }
    } catch (error) {
        mostrarMensaje('Error de red: No se pudo conectar con la API. Verifica CORS.', false);
        console.error('Error de fetch:', error);
    }
});










