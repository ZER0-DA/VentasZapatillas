using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Text.Json;
using ventasZapatiilasAPI.Data;
using ventasZapatiilasAPI.Models;
using ventasZapatiilasAPI.Models.DTO;

namespace ventasZapatiilasAPI.Services
{
    public class PedidoService : IPedidoService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<PedidoService> _logger;

        public PedidoService(AppDbContext context, ILogger<PedidoService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<(bool Success, string Message, PedidoResponseDTO? Pedido)> CrearPedidoAsync(CrearPedidoDTO pedidoDto)
        {
            try
            {
                
                var usuario = await _context.Usuarios.FindAsync(pedidoDto.IdUsuario);
                if (usuario == null)
                {
                    return (false, "Usuario no encontrado", null);
                }

                
                if (pedidoDto.Items == null || !pedidoDto.Items.Any())
                {
                    return (false, "El pedido debe contener al menos un producto", null);
                }

                
                var itemsJson = JsonSerializer.Serialize(pedidoDto.Items);

              
                var returnParam = new SqlParameter
                {
                    ParameterName = "@return",
                    SqlDbType = SqlDbType.Int,
                    Direction = ParameterDirection.ReturnValue
                };

                var idUsuarioParam = new SqlParameter("@IdUsuario", SqlDbType.Int)
                {
                    Value = pedidoDto.IdUsuario
                };

                var itemsParam = new SqlParameter("@Items", SqlDbType.NVarChar, -1)
                {
                    Value = itemsJson
                };

                var idPedidoParam = new SqlParameter
                {
                    ParameterName = "@IdPedido",
                    SqlDbType = SqlDbType.Int,
                    Direction = ParameterDirection.Output
                };

                var mensajeParam = new SqlParameter
                {
                    ParameterName = "@Mensaje",
                    SqlDbType = SqlDbType.NVarChar,
                    Size = 500,
                    Direction = ParameterDirection.Output
                };

         
                var connection = _context.Database.GetDbConnection();
                if (connection.State != ConnectionState.Open)
                {
                    await connection.OpenAsync();
                }

            
                using var command = connection.CreateCommand();
                command.CommandText = "SP_ProcesarPedido";
                command.CommandType = CommandType.StoredProcedure;

       
                command.Parameters.Add(returnParam);
                command.Parameters.Add(idUsuarioParam);
                command.Parameters.Add(itemsParam);
                command.Parameters.Add(idPedidoParam);
                command.Parameters.Add(mensajeParam);

       
                await command.ExecuteNonQueryAsync();

         
                var returnValue = returnParam.Value != DBNull.Value ? (int)returnParam.Value : -99;
                var mensaje = mensajeParam.Value?.ToString() ?? "Error desconocido";
                var idPedido = idPedidoParam.Value != DBNull.Value ? (int)idPedidoParam.Value : 0;

                _logger.LogInformation(
                    "SP ejecutado - Return: {ReturnValue}, IdPedido: {IdPedido}, Mensaje: {Mensaje}",
                    returnValue, idPedido, mensaje);

                if (returnValue == 0 && idPedido > 0)
                {
     
                    var pedidoCreado = await ObtenerPedidoPorIdAsync(idPedido);
                    return (true, mensaje, pedidoCreado);
                }
                else
                {
                    return (false, mensaje, null);
                }
            }
            catch (SqlException sqlEx)
            {
                _logger.LogError(sqlEx, "Error SQL al crear pedido: {Message}", sqlEx.Message);
                return (false, $"Error en la base de datos: {sqlEx.Message}", null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear pedido: {Message}", ex.Message);
                return (false, $"Error al procesar el pedido: {ex.Message}", null);
            }
        }

        public async Task<PedidoResponseDTO?> ObtenerPedidoPorIdAsync(int idPedido)
        {
            try
            {
                var pedido = await _context.Pedidos
                    .Include(p => p.Usuario)
                    .FirstOrDefaultAsync(p => p.IdPedido == idPedido);

                if (pedido == null)
                {
                    _logger.LogWarning("Pedido {IdPedido} no encontrado", idPedido);
                    return null;
                }

                var detalles = await _context.DetallePedidos
                    .Include(d => d.Producto)
                    .Include(d => d.Variante)
                    .Where(d => d.IdPedido == idPedido)
                    .Select(d => new DetallePedidoDTO
                    {
                        IdDetalle = d.IdDetalle,
                        IdProducto = d.IdProducto,
                        NombreProducto = d.Producto != null ? d.Producto.Modelo : "Producto no disponible",
                        MarcaProducto = d.Producto != null ? d.Producto.Marca : "",
                        Talla = d.Variante != null ? d.Variante.Talla : 0,
                        Cantidad = d.Cantidad,
                        PrecioUnitario = d.PrecioUnitario,
                        Subtotal = d.Subtotal
                    })
                    .ToListAsync();

                return new PedidoResponseDTO
                {
                    IdPedido = pedido.IdPedido,
                    IdUsuario = pedido.IdUsuario,
                    NombreUsuario = pedido.Usuario?.nombre ?? "Usuario no disponible",
                    CorreoUsuario = pedido.Usuario?.correo ?? "",
                    FechaPedido = pedido.FechaPedido,
                    Total = pedido.Total,
                    EstadoPedido = pedido.EstadoPedido,
                    Detalles = detalles
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener pedido {IdPedido}", idPedido);
                return null;
            }
        }

        public async Task<List<PedidoListaDTO>> ObtenerPedidosPorUsuarioAsync(int idUsuario)
        {
            try
            {
                return await _context.Pedidos
                    .Where(p => p.IdUsuario == idUsuario)
                    .OrderByDescending(p => p.FechaPedido)
                    .Select(p => new PedidoListaDTO
                    {
                        IdPedido = p.IdPedido,
                        FechaPedido = p.FechaPedido,
                        Total = p.Total,
                        EstadoPedido = p.EstadoPedido,
                        CantidadItems = _context.DetallePedidos.Count(d => d.IdPedido == p.IdPedido)
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener pedidos del usuario {IdUsuario}", idUsuario);
                return new List<PedidoListaDTO>();
            }
        }

        public async Task<List<PedidoListaDTO>> ObtenerTodosPedidosAsync()
        {
            try
            {
                return await _context.Pedidos
                    .OrderByDescending(p => p.FechaPedido)
                    .Select(p => new PedidoListaDTO
                    {
                        IdPedido = p.IdPedido,
                        FechaPedido = p.FechaPedido,
                        Total = p.Total,
                        EstadoPedido = p.EstadoPedido,
                        CantidadItems = _context.DetallePedidos.Count(d => d.IdPedido == p.IdPedido)
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener todos los pedidos");
                return new List<PedidoListaDTO>();
            }
        }

        public async Task<bool> ActualizarEstadoPedidoAsync(int idPedido, string nuevoEstado)
        {
            try
            {
                var pedido = await _context.Pedidos.FindAsync(idPedido);
                if (pedido == null)
                {
                    _logger.LogWarning("Pedido {IdPedido} no encontrado para actualizar estado", idPedido);
                    return false;
                }

                pedido.EstadoPedido = nuevoEstado;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Estado del pedido {IdPedido} actualizado a {NuevoEstado}",
                    idPedido, nuevoEstado);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar estado del pedido {IdPedido}", idPedido);
                return false;
            }
        }

        public async Task<bool> CancelarPedidoAsync(int idPedido)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var pedido = await _context.Pedidos.FindAsync(idPedido);
                if (pedido == null)
                {
                    _logger.LogWarning("Pedido {IdPedido} no encontrado para cancelar", idPedido);
                    return false;
                }

           
                if (pedido.EstadoPedido == "Enviado" || pedido.EstadoPedido == "Entregado")
                {
                    _logger.LogWarning("No se puede cancelar el pedido {IdPedido} en estado {Estado}",
                        idPedido, pedido.EstadoPedido);
                    return false;
                }

                
                var detalles = await _context.DetallePedidos
                    .Where(d => d.IdPedido == idPedido)
                    .ToListAsync();

                foreach (var detalle in detalles)
                {
                    var variante = await _context.ProductoVariantes.FindAsync(detalle.IdVariante);
                    if (variante != null)
                    {
                        variante.Stock += detalle.Cantidad;
                        _logger.LogInformation(
                            "Stock restaurado: Variante {IdVariante} +{Cantidad}",
                            detalle.IdVariante, detalle.Cantidad);
                    }
                }

                pedido.EstadoPedido = "Cancelado";
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Pedido {IdPedido} cancelado exitosamente", idPedido);
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error al cancelar pedido {IdPedido}", idPedido);
                return false;
            }
        }
    }
}