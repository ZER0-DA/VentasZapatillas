
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ventasZapatiilasAPI.Data;
using ventasZapatiilasAPI.Models;
using ventasZapatiilasAPI.Models.DTO;
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


        [HttpPost("Registrar")]
        public async Task<IActionResult> RegistrarUsuario([FromBody] RegistrarUsuarioDTO registroDTO)
        {
            try
            {
                if (await _context.Usuarios.AnyAsync(u => u.correo == registroDTO.Correo))
                {
                    return BadRequest(new { mensaje = "El correo ya está registrado" });
                }
                // 1. Lógica de Seguridad: Hashear la contraseña
                byte[] passwordHash = Seguridad.CrearHash(registroDTO.Password);


                var nuevoUsuario = new Usuario
                {
                    nombre = registroDTO.Nombre,
                    correo = registroDTO.Correo,
                    password_hash = passwordHash,
                    tipo_usuario = "Cliente",
                    fecha_registro = DateTime.UtcNow,
                    intentos_fallidos = 0,
                    estado_bloqueo = false
                };


                _context.Usuarios.Add(nuevoUsuario);
                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Usuario registrado exitosamente" });

            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al registrar el usuario", detalle = ex.Message });
            }





        }
    }
}
