namespace ventasZapatiilasAPI.Models.DTO
{
    public class DetallePedidoDTO
    {
        public int IdDetalle { get; set; }
        public int IdProducto { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public string MarcaProducto { get; set; } = string.Empty;
        public decimal Talla { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }
    }
}
