
using Microsoft.AspNetCore.Mvc;
using ventasZapatiilasAPI.Data;
using ventasZapatiilasAPI.Models;
using ventasZapatiilasAPI.Services;

namespace ventasZapatiilasAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegistrarUsuarioController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RegistrarUsuarioController(AppDbContext context)
        {
            _context = context;
        }


        [HttpPost]
        public async Task<IActionResult> RegistrarUsuario([FromBody] RegistrarUsuario registroDTO)
        {
            // 1. Lógica de Seguridad: Hashear la contraseña
            byte[] passwordHash = Seguridad.CrearHash(registroDTO.password);

            // 2. Mapeo del DTO a la Entidad de la Base de Datos
            var nuevoUsuario = new Usuario
            {
                nombre = registroDTO.nombre,
                correo = registroDTO.correo,
                password_hash = passwordHash, 
                tipo_usuario = registroDTO.tipo_usuario,
                fecha_registro = DateTime.UtcNow, // El servidor pone la fecha
                intentos_fallidos = 0,
                estado_bloqueo = false
            };

           
            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Usuario registrado exitosamente" });
        }

    }
}
