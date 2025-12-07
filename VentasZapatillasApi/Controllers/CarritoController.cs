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
    [Authorize] 
    public class CarritoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CarritoController(AppDbContext context)
        {
            _context = context;
        }

        
        [HttpPost("AgregarAlCarrito")]
        public async Task<IActionResult> AgregarAlCarrito([FromBody] CarritoDTO carritoDto)
        {
            try
            {
                if (carritoDto.Cantidad <= 0)
                {
                    return BadRequest(new { mensaje = "La cantidad debe ser mayor a 0" });
                }

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
                    .FirstOrDefaultAsync(c => c.IdUsuario == idUsuario && c.IdProducto == carritoDto.Idproducto && c.IdVariante  == carritoDto.Idvariante);

                if (existente != null)
                {
                    // Si ya existe, aumentar cantidad
                    existente.Cantidad += carritoDto.Cantidad;
                    existente.FechaAgregado = DateTime.UtcNow; // Actualizar fecha
                    _context.Carrito.Update(existente);
                }
                else
                {
                    // Si no existe, crear nuevo
                    var nuevoItem = new Carrito
                    {
                        IdUsuario = idUsuario,
                        IdProducto = carritoDto.Idproducto,
                        IdVariante = carritoDto.Idvariante,
                        Cantidad = carritoDto.Cantidad,
                        FechaAgregado = DateTime.UtcNow,
                        Producto = producto! // Establecer la navegación con el producto que ya consultamos
                    };

                    await _context.Carrito.AddAsync(nuevoItem);
                }

                await _context.SaveChangesAsync();

                // Obtener cantidad total de productos en el carrito
                var cantidadTotal = await _context.Carrito
                    .Where(c => c.IdUsuario == idUsuario)
                    .SumAsync(c => c.Cantidad);

                return Ok(new
                {
                    mensaje = "Producto agregado al carrito correctamente",
                    cantidadEnCarrito = cantidadTotal
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al agregar producto", error = ex.Message });
            }
        }

        
        [HttpGet("ObtenerCarrito")]
        public async Task<IActionResult> ObtenerCarrito()
        {
            try
            {
                
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized(new { mensaje = "Debes iniciar sesión" });
                }

                int idUsuario = int.Parse(userIdClaim);

                
                var carrito = await _context.Carrito
                    .Where(c => c.IdUsuario == idUsuario)
                    .Include(c => c.Producto) 
                    .Select(c => new
                    {
                        idCarrito = c.IdCarrito,
                        idProducto = c.IdProducto,
                        marca = c.Producto.Marca,
                        modelo = c.Producto.Modelo,
                        precio = c.Producto.Precio,
                        imagen = c.Producto.UrlImagen,
                        cantidad = c.Cantidad,
                        subtotal = c.Cantidad * c.Producto.Precio,
                        fechaAgregado = c.FechaAgregado,
                        talla = c.Variante.Talla,
                        idVariante = c.IdVariante
                    })
                    .OrderByDescending(c => c.fechaAgregado) 
                    .ToListAsync();

               
                var total = carrito.Sum(c => c.subtotal);

                return Ok(new
                {
                    productos = carrito,
                    totalProductos = carrito.Count,
                    cantidadTotal = carrito.Sum(c => c.cantidad),
                    totalPagar = total
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener carrito", error = ex.Message });
            }
        }


        [HttpPut("ActualizarCantidad")]
        public async Task<IActionResult> ActualizarCantidad([FromBody] ActualizarCantidadDTO dto)
        {
            try
            {
                if (dto.Cantidad <= 0)
                {
                    return BadRequest(new { mensaje = "La cantidad debe ser mayor a 0" });
                }

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized(new { mensaje = "Debes iniciar sesión" });
                }

                int idUsuario = int.Parse(userIdClaim);

               
                var item = await _context.Carrito
                    .FirstOrDefaultAsync(c => c.IdCarrito == dto.IdCarrito && c.IdUsuario == idUsuario);

                if (item == null)
                {
                    return NotFound(new { mensaje = "Producto no encontrado en el carrito" });
                }

                
                item.Cantidad = dto.Cantidad;
                item.FechaAgregado = DateTime.UtcNow;

                _context.Carrito.Update(item);
                await _context.SaveChangesAsync();

                // Calcular nuevo subtotal
                var producto = await _context.Productos
                    .FirstOrDefaultAsync(p => p.IdProducto == item.IdProducto);

                var subtotal = item.Cantidad * (producto?.Precio ?? 0);

                return Ok(new
                {
                    mensaje = "Cantidad actualizada correctamente",
                    nuevaCantidad = item.Cantidad,
                    subtotal = subtotal
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al actualizar cantidad", error = ex.Message });
            }
        }

      
      
        [HttpDelete("EliminarProducto/{idCarrito}")]
        public async Task<IActionResult> EliminarProducto(int idCarrito)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized(new { mensaje = "Debes iniciar sesión" });
                }

                int idUsuario = int.Parse(userIdClaim);

                // Buscar el item
                var item = await _context.Carrito
                    .FirstOrDefaultAsync(c => c.IdCarrito == idCarrito && c.IdUsuario == idUsuario);

                if (item == null)
                {
                    return NotFound(new { mensaje = "Producto no encontrado en el carrito" });
                }

                _context.Carrito.Remove(item);
                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Producto eliminado del carrito correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al eliminar producto", error = ex.Message });
            }
        }

        
        [HttpDelete("VaciarCarrito")]
        public async Task<IActionResult> VaciarCarrito()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized(new { mensaje = "Debes iniciar sesión" });
                }

                int idUsuario = int.Parse(userIdClaim);

                // Obtener todos los items del carrito del usuario
                var items = await _context.Carrito
                    .Where(c => c.IdUsuario == idUsuario)
                    .ToListAsync();

                if (items.Count == 0)
                {
                    return Ok(new { mensaje = "El carrito ya está vacío" });
                }

                _context.Carrito.RemoveRange(items);
                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Carrito vaciado correctamente", productosEliminados = items.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al vaciar carrito", error = ex.Message });
            }
        }

        [HttpGet("CantidadTotal")]
        public async Task<IActionResult> ObtenerCantidadTotal()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized(new { mensaje = "Debes iniciar sesión" });
                }

                int idUsuario = int.Parse(userIdClaim);

                var cantidadTotal = await _context.Carrito
                    .Where(c => c.IdUsuario == idUsuario)
                    .SumAsync(c => c.Cantidad);

                return Ok(new { cantidadTotal });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener cantidad", error = ex.Message });
            }
        }
    }
}