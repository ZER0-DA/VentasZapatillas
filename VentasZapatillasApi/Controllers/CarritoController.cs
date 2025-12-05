using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ventasZapatiilasAPI.Data;
using ventasZapatiilasAPI.Models;
using ventasZapatiilasAPI.Models.DTO;

namespace ventasZapatiilasAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Requiere estar logueado
    public class CarritoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CarritoController(AppDbContext context)
        {
            _context = context;
        }

        // Agregar producto al carrito
        [HttpPost("AgregarAlCarrito")]
        public async Task<IActionResult> AgregarAlCarrito([FromBody] CarritoDTO carritoDto)
        {
            try
            {
                // Obtener el ID del usuario desde el token JWT
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized(new { mensaje = "Debes iniciar sesión" });
                }

                int idUsuario = int.Parse(userIdClaim);

                // Verificar si el producto existe
                var producto = await _context.Productos
                    .FirstOrDefaultAsync(p => p.IdProducto == carritoDto.Idproducto);

                if (producto == null)
                {
                    return NotFound(new { mensaje = "Producto no encontrado" });
                }

                // Buscar si ya existe en el carrito
                var existente = await _context.Carrito
                    .FirstOrDefaultAsync(c => c.IdUsuario == idUsuario && c.IdProducto == carritoDto.Idproducto);

                if (existente != null)
                {
                    // Si ya existe, aumentar cantidad
                    existente.Cantidad += carritoDto.Cantidad;
                    _context.Carrito.Update(existente);
                }
                else
                {
                    // Si no existe, crear nuevo
                    var nuevoItem = new Carrito
                    {
                        IdUsuario = idUsuario,
                        IdProducto = carritoDto.Idproducto,
                        Cantidad = carritoDto.Cantidad,
                        FechaAgregado = DateTime.UtcNow
                    };

                    await _context.Carrito.AddAsync(nuevoItem);
                }

                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Producto agregado al carrito correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al agregar producto", error = ex.Message });
            }
        }

        // Obtener productos del carrito del usuario logueado
        [HttpGet("ObtenerCarrito")]
        public async Task<IActionResult> ObtenerCarrito()
        {
            try
            {
                // Obtener ID del usuario desde el token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized(new { mensaje = "Debes iniciar sesión" });
                }

                int idUsuario = int.Parse(userIdClaim);

                // Obtener todos los productos en el carrito con sus detalles
                var carrito = await _context.Carrito
                    .Where(c => c.IdUsuario == idUsuario)
                    .Include(c => c.Producto) // Traer información del producto
                    .Select(c => new
                    {
                        idCarrito = c.IdCarrito,
                        idProducto = c.IdProducto,
                        nombre = c.Producto.Modelo,
                        precio = c.Producto.Precio,
                        imagen = c.Producto.UrlImagen,
                        cantidad = c.Cantidad,
                        subtotal = c.Cantidad * c.Producto.Precio,
                        fechaAgregado = c.FechaAgregado
                    })
                    .ToListAsync();

                // Calcular total
                var total = carrito.Sum(c => c.subtotal);

                return Ok(new
                {
                    productos = carrito,
                    totalProductos = carrito.Count,
                    totalPagar = total
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener carrito", error = ex.Message });
            }
        }
    }
}