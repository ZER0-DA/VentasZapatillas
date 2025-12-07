using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using ventasZapatiilasAPI.Data;
using ventasZapatiilasAPI.Models;
using ventasZapatiilasAPI.Models.DTO;

namespace ventasZapatiilasAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ProductosController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }


        private static ProductoDTO MapearProducto(Producto p)
        {
            return new ProductoDTO
            {
                Id = p.IdProducto,
                Marca = p.Marca,
                Modelo = p.Modelo,
                Descripcion = p.Descripcion,
                Precio = p.Precio,
                UrlImagen = p.UrlImagen,
                Seccion = p.Seccion,
                EsDestacado = p.EsDestacado,
                EnOferta = p.EnOferta,
                PorcentajeDescuento = p.PorcentajeDescuento,
                FechaCreacion = p.FechaCreacion,
                Variantes = p.Variantes.Select(v => new VarianteInfoDTO
                {
                    Id = v.IdVariante,
                    Talla = v.Talla,
                    Stock = v.Stock
                }).ToList()
            };
        }

  
        [HttpPost("NuevoProducto")]
        public async Task<IActionResult> CrearProducto([FromForm] CrearProductoDTO dto, IFormFile imagen)
        {
            try
            {

                if (imagen == null || imagen.Length == 0)
                    return BadRequest(new { mensaje = "Debe proporcionar una imagen del producto" });

                var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".webp" };

                var extension = Path.GetExtension(imagen.FileName).ToLowerInvariant();

                if (!extensionesPermitidas.Contains(extension))
                    return BadRequest(new { mensaje = "Solo se permiten imágenes JPG, PNG o WEBP" });

                if (dto.Precio <= 0)
                    return BadRequest(new { mensaje = "El precio debe ser mayor a 0" });

                if (string.IsNullOrEmpty(dto.Variantes))
                    return BadRequest(new { mensaje = "Debe proporcionar variantes con tallas y stock" });


                List<VarianteDTO>? variantes;

                try
                {
                    variantes = JsonSerializer.Deserialize<List<VarianteDTO>>(dto.Variantes);
                }
                catch
                {
                    return BadRequest(new { mensaje = "El formato de las variantes no es válido" });
                }

                if (variantes == null || variantes.Count == 0)
                    return BadRequest(new { mensaje = "Debe agregar al menos una talla con stock" });

            

                var uploadsFolder = Path.Combine(_env.WebRootPath ?? "wwwroot", "imagenes");

                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var nombreArchivo = $"{Guid.NewGuid():N}{extension}";
                var rutaCompleta = Path.Combine(uploadsFolder, nombreArchivo);

                using (var stream = new FileStream(rutaCompleta, FileMode.Create))
                {
                    await imagen.CopyToAsync(stream);
                }


                if (!dto.EnOferta)
                    dto.PorcentajeDescuento = 0;


                var producto = new Producto
                {
                    Marca = dto.Marca,
                    Modelo = dto.Modelo,
                    Descripcion = dto.Descripcion,
                    Precio = dto.Precio,
                    Seccion = dto.Seccion,
                    EsDestacado = dto.EsDestacado,
                    EnOferta = dto.EnOferta,
                    PorcentajeDescuento = dto.PorcentajeDescuento,
                    UrlImagen = $"/imagenes/{nombreArchivo}",
                    FechaCreacion = DateTime.UtcNow,
                    Variantes = variantes.Select(v => new ProductoVariante
                    {
                        Talla = v.Talla,
                        Stock = v.Stock,
                        
                    }).ToList()
                };

                _context.Productos.Add(producto);
                await _context.SaveChangesAsync();

                return StatusCode (201, new
                {
                    mensaje = "Producto creado exitosamente",
                    productoId = producto.IdProducto,
                    imagenUrl = producto.UrlImagen,
                    totalVariantes = producto.Variantes.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error al crear el producto: {ex.Message}" });
            }
        }


        [HttpGet("ObtenerProductos")]
        public async Task<IActionResult> ObtenerProductos()
        {
            try
            {
                var productos = await _context.Productos
                    .Include(p => p.Variantes)
                    .ToListAsync();

                return Ok(productos.Select(MapearProducto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error al obtener productos: {ex.Message}" });
            }
        }

    
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerProductoPorId(int id)
        {
            try
            {
                var producto = await _context.Productos
                    .Include(p => p.Variantes)
                    .FirstOrDefaultAsync(p => p.IdProducto == id);

                if (producto == null)
                    return NotFound(new { mensaje = "Producto no encontrado" });

                return Ok(MapearProducto(producto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error: {ex.Message}" });
            }
        }

    
        [HttpGet("seccion/{seccion}")]
        public async Task<IActionResult> ObtenerPorSeccion(string seccion)
        {
            try
            {
                var productos = await _context.Productos
                    .Include(p => p.Variantes)
                    .Where(p => p.Seccion.ToLower() == seccion.ToLower())
                    .ToListAsync();

                return Ok(productos.Select(MapearProducto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error: {ex.Message}" });
            }
        }

        
        [HttpGet("destacados")]
        public async Task<IActionResult> ObtenerDestacados()
        {
            try
            {
                var productos = await _context.Productos
                    .Include(p => p.Variantes)
                    .Where(p => p.EsDestacado)
                    .ToListAsync();

                return Ok(productos.Select(MapearProducto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error: {ex.Message}" });
            }
        }



        [HttpGet("ofertas")]
        public async Task<IActionResult> ObtenerOfertas()
        {
            try
            {
                var productos = await _context.Productos
                    .Include(p => p.Variantes)
                    .Where(p => p.EnOferta)
                    .ToListAsync();

                return Ok(productos.Select(MapearProducto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error: {ex.Message}" });
            }
        }
    }
}
