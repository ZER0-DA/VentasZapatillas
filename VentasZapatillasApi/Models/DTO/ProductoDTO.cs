using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations.Schema;

namespace ventasZapatiilasAPI.Models.DTO
{
    public class ProductoDTO
    {
        public int Id { get; set; }
        public required string Marca { get; set; }
        public required string Modelo { get; set; }
        public string? Descripcion { get; set; }
        public required decimal Precio { get; set; }
        public required string UrlImagen { get; set; }
        public required string Seccion { get; set; }
        public bool EsDestacado { get; set; }
        public bool EnOferta { get; set; }
        public decimal? PorcentajeDescuento { get; set; }=0;
        public DateTime FechaCreacion { get; set; }

        public List<VarianteInfoDTO> Variantes { get; set; } = new List<VarianteInfoDTO>();

       
    }
}