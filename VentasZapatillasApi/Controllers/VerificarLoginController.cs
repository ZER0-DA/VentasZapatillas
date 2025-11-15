using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ventasZapatiilasAPI.Data;   // <--- ¡Necesitas importar tu contexto de datos!
using ventasZapatiilasAPI.Models;
using ventasZapatiilasAPI.Services;
// Asegúrate de que tu DTO se llame 'LoginDTO' si quieres seguir las convenciones.

namespace ventasZapatiilasAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VerificarLoginController : ControllerBase
    {
        // 1. Declarar _context como AppDbContext
        private readonly AppDbContext _context;

        // 2. Inyectar AppDbContext
        public VerificarLoginController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        // Asegúrate de que el DTO sea LoginDTO, no Login
        public async Task<IActionResult> Login([FromBody] Login login)
        {
            // 1. Buscar usuario por correo/nombre usando el DbSet directo
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.correo == login.correo);

            if (usuario == null)
            {
                return Unauthorized(new { mensaje = "Credenciales inválidas" });
            }

            // 2. Verificar la contraseña hasheada
            bool isPasswordValid = Seguridad.VerificarPassword(
                login.password,
                usuario.password_hash
            );

            if (!isPasswordValid)
            {
                return Unauthorized(new { mensaje = "Credenciales inválidas" });
            }

            // 3. Éxito
            return Ok(new { mensaje = "Login exitoso", usuarioId = usuario.id_usuario, tipoUsuario = usuario.tipo_usuario });
        }
    }
}
