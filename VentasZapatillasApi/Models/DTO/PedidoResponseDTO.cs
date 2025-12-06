namespace ventasZapatiilasAPI.Models.DTO
{
    public class PedidoResponseDTO
    {
        public int IdPedido { get; set; }
        public int IdUsuario { get; set; }
        public string NombreUsuario { get; set; } = string.Empty;
        public string CorreoUsuario { get; set; } = string.Empty;
        public DateTime FechaPedido { get; set; }
        public decimal Total { get; set; }
        public string EstadoPedido { get; set; } = string.Empty;
        public List<DetallePedidoDTO> Detalles { get; set; } = new();
    }
}
