namespace ventasZapatiilasAPI.Models.DTO
{
    public class CrearProductoDTO
    {
        public required string Marca { get; set; }
        public required string Modelo { get; set; }
        public string? Descripcion { get; set; }
        public required decimal Precio { get; set; }
        public required string Seccion { get; set; }
        public bool EsDestacado { get; set; } = false;
        public bool EnOferta { get; set; } = false;
        public decimal PorcentajeDescuento { get; set; } = 0;
        public required string Variantes { get; set; }  
    }
}