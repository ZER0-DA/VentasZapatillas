using ventasZapatiilasAPI.Models.DTO;

namespace ventasZapatiilasAPI.Services
{
    // Interfaz para servicio de pedidos
    public interface IPedidoService
    {
        Task<(bool Success, string Message, PedidoResponseDTO? Pedido)> CrearPedidoAsync(CrearPedidoDTO pedidoDto);
        Task<PedidoResponseDTO?> ObtenerPedidoPorIdAsync(int idPedido);
        Task<List<PedidoListaDTO>> ObtenerPedidosPorUsuarioAsync(int idUsuario);
        Task<List<PedidoListaDTO>> ObtenerTodosPedidosAsync();
        Task<bool> ActualizarEstadoPedidoAsync(int idPedido, string nuevoEstado);
        Task<bool> CancelarPedidoAsync(int idPedido);
    }

    // Interfaz para servicio de facturas
    public interface IFacturaService
    {
        Task<byte[]> GenerarFacturaPdfAsync(int idPedido);
        Task<string> GenerarFacturaHtmlAsync(int idPedido);
    }

    // Interfaz para servicio de email
    public interface IEmailService
    {
        Task<bool> EnviarEmailConFacturaAsync(string destinatario, string nombreUsuario, int idPedido, byte[] facturaPdf);
        Task<bool> EnviarEmailConfirmacionPedidoAsync(string destinatario, string nombreUsuario, PedidoResponseDTO pedido);
    }
}