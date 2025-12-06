namespace ventasZapatiilasAPI.Models.DTO
{
    public class PedidoListaDTO
    {
        public int IdPedido { get; set; }
        public DateTime FechaPedido { get; set; }
        public decimal Total { get; set; }
        public string EstadoPedido { get; set; } = string.Empty;
        public int CantidadItems { get; set; }
    }
}
