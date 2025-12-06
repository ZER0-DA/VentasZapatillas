using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ventasZapatiilasAPI.Models.DTO;
using ventasZapatiilasAPI.Services;

namespace ventasZapatiilasAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PedidoController : ControllerBase
    {
        private readonly IPedidoService _pedidoService;
        private readonly IFacturaService _facturaService;
        private readonly IEmailService _emailService;
        private readonly ILogger<PedidoController> _logger;

        public PedidoController(
            IPedidoService pedidoService,
            IFacturaService facturaService,
            IEmailService emailService,
            ILogger<PedidoController> logger)
        {
            _pedidoService = pedidoService;
            _facturaService = facturaService;
            _emailService = emailService;
            _logger = logger;
        }

        /// <summary>
        /// Crear un nuevo pedido
        /// POST: api/Pedido
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<PedidoResponseDTO>> CrearPedido([FromBody] CrearPedidoDTO pedidoDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Crear el pedido usando el SP
                var (success, message, pedido) = await _pedidoService.CrearPedidoAsync(pedidoDto);

                if (!success || pedido == null)
                {
                    return BadRequest(new { mensaje = message });
                }

                // Generar factura PDF
                byte[] facturaPdf;
                try
                {
                    facturaPdf = await _facturaService.GenerarFacturaPdfAsync(pedido.IdPedido);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al generar factura para pedido {IdPedido}", pedido.IdPedido);
                    // Continuar aunque falle la factura
                    facturaPdf = Array.Empty<byte>();
                }

                // Enviar emails (asíncrono, no bloqueante)
                _ = Task.Run(async () =>
                {
                    try
                    {
                        // Email de confirmación
                        await _emailService.EnviarEmailConfirmacionPedidoAsync(
                            pedido.CorreoUsuario,
                            pedido.NombreUsuario,
                            pedido
                        );

                        // Email con factura (si se generó correctamente)
                        if (facturaPdf.Length > 0)
                        {
                            await _emailService.EnviarEmailConFacturaAsync(
                                pedido.CorreoUsuario,
                                pedido.NombreUsuario,
                                pedido.IdPedido,
                                facturaPdf
                            );
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error al enviar emails para pedido {IdPedido}", pedido.IdPedido);
                    }
                });

                return CreatedAtAction(
                    nameof(ObtenerPedidoPorId),
                    new { id = pedido.IdPedido },
                    new
                    {
                        mensaje = "Pedido creado exitosamente",
                        pedido = pedido
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear pedido");
                return StatusCode(500, new { mensaje = "Error interno al procesar el pedido" });
            }
        }

        /// <summary>
        /// Obtener pedido por ID
        /// GET: api/Pedido/{id}
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<PedidoResponseDTO>> ObtenerPedidoPorId(int id)
        {
            try
            {
                var pedido = await _pedidoService.ObtenerPedidoPorIdAsync(id);

                if (pedido == null)
                {
                    return NotFound(new { mensaje = "Pedido no encontrado" });
                }

                return Ok(pedido);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener pedido {IdPedido}", id);
                return StatusCode(500, new { mensaje = "Error al obtener el pedido" });
            }
        }

        /// <summary>
        /// Obtener pedidos de un usuario
        /// GET: api/Pedido/usuario/{idUsuario}
        /// </summary>
        [HttpGet("usuario/{idUsuario}")]
        [Authorize]
        public async Task<ActionResult<List<PedidoListaDTO>>> ObtenerPedidosPorUsuario(int idUsuario)
        {
            try
            {
                var pedidos = await _pedidoService.ObtenerPedidosPorUsuarioAsync(idUsuario);
                return Ok(pedidos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener pedidos del usuario {IdUsuario}", idUsuario);
                return StatusCode(500, new { mensaje = "Error al obtener los pedidos" });
            }
        }

        /// <summary>
        /// Obtener todos los pedidos (Admin)
        /// GET: api/Pedido/todos
        /// </summary>
        [HttpGet("todos")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<List<PedidoListaDTO>>> ObtenerTodosPedidos()
        {
            try
            {
                var pedidos = await _pedidoService.ObtenerTodosPedidosAsync();
                return Ok(pedidos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener todos los pedidos");
                return StatusCode(500, new { mensaje = "Error al obtener los pedidos" });
            }
        }

        /// <summary>
        /// Actualizar estado del pedido
        /// PUT: api/Pedido/{id}/estado
        /// </summary>
        [HttpPut("{id}/estado")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ActualizarEstadoPedido(int id, [FromBody] ActualizarEstadoPedidoDTO estadoDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var resultado = await _pedidoService.ActualizarEstadoPedidoAsync(id, estadoDto.Estado);

                if (!resultado)
                {
                    return NotFound(new { mensaje = "Pedido no encontrado" });
                }

                return Ok(new { mensaje = "Estado actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar estado del pedido {IdPedido}", id);
                return StatusCode(500, new { mensaje = "Error al actualizar el estado" });
            }
        }

        /// <summary>
        /// Cancelar pedido
        /// POST: api/Pedido/{id}/cancelar
        /// </summary>
        [HttpPost("{id}/cancelar")]
        [Authorize]
        public async Task<IActionResult> CancelarPedido(int id)
        {
            try
            {
                var resultado = await _pedidoService.CancelarPedidoAsync(id);

                if (!resultado)
                {
                    return BadRequest(new { mensaje = "No se pudo cancelar el pedido. Verifica su estado." });
                }

                return Ok(new { mensaje = "Pedido cancelado exitosamente. El stock ha sido restaurado." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cancelar pedido {IdPedido}", id);
                return StatusCode(500, new { mensaje = "Error al cancelar el pedido" });
            }
        }

        /// <summary>
        /// Descargar factura en PDF
        /// GET: api/Pedido/{id}/factura/pdf
        /// </summary>
        [HttpGet("{id}/factura/pdf")]
        [Authorize]
        public async Task<IActionResult> DescargarFacturaPdf(int id)
        {
            try
            {
                var pedido = await _pedidoService.ObtenerPedidoPorIdAsync(id);
                if (pedido == null)
                {
                    return NotFound(new { mensaje = "Pedido no encontrado" });
                }

                var pdf = await _facturaService.GenerarFacturaPdfAsync(id);
                return File(pdf, "application/pdf", $"Factura_{id:D6}.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar factura PDF para pedido {IdPedido}", id);
                return StatusCode(500, new { mensaje = "Error al generar la factura" });
            }
        }

        /// <summary>
        /// Ver factura en HTML
        /// GET: api/Pedido/{id}/factura/html
        /// </summary>
        [HttpGet("{id}/factura/html")]
        [Authorize]
        public async Task<IActionResult> VerFacturaHtml(int id)
        {
            try
            {
                var pedido = await _pedidoService.ObtenerPedidoPorIdAsync(id);
                if (pedido == null)
                {
                    return NotFound(new { mensaje = "Pedido no encontrado" });
                }

                var html = await _facturaService.GenerarFacturaHtmlAsync(id);
                return Content(html, "text/html");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar factura HTML para pedido {IdPedido}", id);
                return StatusCode(500, new { mensaje = "Error al generar la factura" });
            }
        }

        /// <summary>
        /// Reenviar factura por email
        /// POST: api/Pedido/{id}/reenviar-factura
        /// </summary>
        [HttpPost("{id}/reenviar-factura")]
        [Authorize]
        public async Task<IActionResult> ReenviarFactura(int id)
        {
            try
            {
                var pedido = await _pedidoService.ObtenerPedidoPorIdAsync(id);
                if (pedido == null)
                {
                    return NotFound(new { mensaje = "Pedido no encontrado" });
                }

                var pdf = await _facturaService.GenerarFacturaPdfAsync(id);
                var enviado = await _emailService.EnviarEmailConFacturaAsync(
                    pedido.CorreoUsuario,
                    pedido.NombreUsuario,
                    id,
                    pdf
                );

                if (!enviado)
                {
                    return StatusCode(500, new { mensaje = "Error al enviar el email" });
                }

                return Ok(new { mensaje = "Factura reenviada exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al reenviar factura para pedido {IdPedido}", id);
                return StatusCode(500, new { mensaje = "Error al reenviar la factura" });
            }
        }
    }
}