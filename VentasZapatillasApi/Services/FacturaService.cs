using Microsoft.Extensions.Options;

// ALIAS PARA EVITAR CHOQUES
using QuestDocument = QuestPDF.Fluent.Document;
using QuestContainer = QuestPDF.Infrastructure.IContainer;

using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

using ventasZapatiilasAPI.Models;


namespace ventasZapatiilasAPI.Services
{
    public class FacturaService : IFacturaService
    {
        private readonly IPedidoService _pedidoService;
        private readonly AppSettings _appSettings;
        private readonly ILogger<FacturaService> _logger;

        public FacturaService(
            IPedidoService pedidoService,
            IOptions<AppSettings> appSettings,
            ILogger<FacturaService> logger)
        {
            _pedidoService = pedidoService;
            _appSettings = appSettings.Value;
            _logger = logger;

            // Configurar QuestPDF
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<byte[]> GenerarFacturaPdfAsync(int idPedido)
        {
            try
            {
                var pedido = await _pedidoService.ObtenerPedidoPorIdAsync(idPedido);
                if (pedido == null)
                {
                    throw new Exception("Pedido no encontrado");
                }

                var pdf = QuestDocument.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(2, Unit.Centimetre);
                        page.DefaultTextStyle(x => x.FontSize(10));

                        // Encabezado
                        page.Header().Element(c => ComposeHeader(c, pedido));

                        // Contenido
                        page.Content().Element(c => ComposeContent(c, pedido));

                        // Pie de página
                        page.Footer().Element(c => ComposeFooter(c, pedido));
                    });
                }).GeneratePdf();

                return pdf;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar factura PDF para pedido {IdPedido}", idPedido);
                throw;
            }
        }

        private void ComposeHeader(QuestContainer container, Models.DTO.PedidoResponseDTO pedido)
        {
            container.Column(column =>
            {
                // Logo y nombre de la empresa
                column.Item().Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text(_appSettings.NombreEmpresa)
                            .FontSize(20)
                            .Bold()
                            .FontColor(Colors.Blue.Darken2);

                        col.Item().Text(_appSettings.DireccionEmpresa)
                            .FontSize(9);

                        col.Item().Text($"Tel: {_appSettings.TelefonoEmpresa}")
                            .FontSize(9);

                        col.Item().Text(_appSettings.EmailEmpresa)
                            .FontSize(9);
                    });

                    row.RelativeItem().Column(col =>
                    {
                        col.Item().AlignRight().Text("FACTURA")
                            .FontSize(18)
                            .Bold();

                        col.Item().AlignRight().Text($"Nº {pedido.IdPedido:D6}")
                            .FontSize(12);

                        col.Item().AlignRight().Text($"Fecha: {pedido.FechaPedido:dd/MM/yyyy}")
                            .FontSize(9);

                        col.Item().AlignRight().Text($"Estado: {pedido.EstadoPedido}")
                            .FontSize(9)
                            .Bold();
                    });
                });

                // Línea separadora
                column.Item().PaddingVertical(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                // Información del cliente
                column.Item().Background(Colors.Grey.Lighten3).Padding(10).Column(col =>
                {
                    col.Item().Text("DATOS DEL CLIENTE").FontSize(12).Bold();
                    col.Item().Text($"Nombre: {pedido.NombreUsuario}").FontSize(9);
                    col.Item().Text($"Correo: {pedido.CorreoUsuario}").FontSize(9);
                    col.Item().Text($"ID Cliente: {pedido.IdUsuario}").FontSize(9);
                });
            });
        }

        private void ComposeContent(QuestContainer container, Models.DTO.PedidoResponseDTO pedido)
        {
            container.PaddingVertical(20).Column(column =>
            {
                // Título de la tabla
                column.Item().Text("DETALLE DE LA COMPRA").FontSize(12).Bold();

                column.Item().PaddingVertical(5);

                // Tabla de productos
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(30);  // #
                        columns.RelativeColumn(3);   // Producto
                        columns.RelativeColumn(2);   // Marca
                        columns.ConstantColumn(50);  // Talla
                        columns.ConstantColumn(60);  // Cantidad
                        columns.ConstantColumn(80);  // Precio Unit.
                        columns.ConstantColumn(90);  // Subtotal
                    });

                    // Encabezado de la tabla
                    table.Header(header =>
                    {
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                            .Text("#").FontColor(Colors.White).FontSize(9).Bold();

                        header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                            .Text("Producto").FontColor(Colors.White).FontSize(9).Bold();

                        header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                            .Text("Marca").FontColor(Colors.White).FontSize(9).Bold();

                        header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                            .Text("Talla").FontColor(Colors.White).FontSize(9).Bold();

                        header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                            .Text("Cantidad").FontColor(Colors.White).FontSize(9).Bold();

                        header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                            .Text("Precio Unit.").FontColor(Colors.White).FontSize(9).Bold();

                        header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                            .Text("Subtotal").FontColor(Colors.White).FontSize(9).Bold();
                    });

                    // Filas de productos
                    int index = 1;
                    foreach (var detalle in pedido.Detalles)
                    {
                        var backgroundColor = index % 2 == 0 ? Colors.Grey.Lighten3 : Colors.White;

                        table.Cell().Background(backgroundColor).Padding(5)
                            .Text(index.ToString()).FontSize(9);

                        table.Cell().Background(backgroundColor).Padding(5)
                            .Text(detalle.NombreProducto).FontSize(9);

                        table.Cell().Background(backgroundColor).Padding(5)
                            .Text(detalle.MarcaProducto).FontSize(9);

                        table.Cell().Background(backgroundColor).Padding(5)
                            .AlignCenter().Text(detalle.Talla.ToString()).FontSize(9);

                        table.Cell().Background(backgroundColor).Padding(5)
                            .AlignCenter().Text(detalle.Cantidad.ToString()).FontSize(9);

                        table.Cell().Background(backgroundColor).Padding(5)
                            .AlignRight().Text($"${detalle.PrecioUnitario:N2}").FontSize(9);

                        table.Cell().Background(backgroundColor).Padding(5)
                            .AlignRight().Text($"${detalle.Subtotal:N2}").FontSize(9);

                        index++;
                    }
                });

                // Totales
                column.Item().PaddingTop(20).AlignRight().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.AutoItem().Width(150).Text("TOTAL:")
                            .FontSize(14).Bold();
                        row.AutoItem().Width(100).AlignRight()
                            .Text($"${pedido.Total:N2}")
                            .FontSize(14).Bold().FontColor(Colors.Green.Darken2);
                    });
                });
            });
        }

        private void ComposeFooter(QuestContainer container, Models.DTO.PedidoResponseDTO pedido)
        {
            container.Column(column =>
            {
                column.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                column.Item().PaddingTop(10).Text(text =>
                {
                    text.Span("Gracias por su compra. ").FontSize(9);
                    text.Span($"Para consultas: {_appSettings.EmailEmpresa}").FontSize(9).Italic();
                });

                column.Item().AlignCenter().Text($"Documento generado el {DateTime.Now:dd/MM/yyyy HH:mm}")
                    .FontSize(8).FontColor(Colors.Grey.Medium);
            });
        }

        public async Task<string> GenerarFacturaHtmlAsync(int idPedido)
        {
            try
            {
                var pedido = await _pedidoService.ObtenerPedidoPorIdAsync(idPedido);
                if (pedido == null)
                {
                    throw new Exception("Pedido no encontrado");
                }

                var html = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Factura #{pedido.IdPedido:D6}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .header {{ text-align: center; margin-bottom: 30px; }}
        .company-info {{ margin-bottom: 20px; }}
        .customer-info {{ background-color: #f0f0f0; padding: 15px; margin-bottom: 20px; }}
        table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; }}
        th {{ background-color: #2c5aa0; color: white; padding: 10px; text-align: left; }}
        td {{ padding: 8px; border-bottom: 1px solid #ddd; }}
        .total {{ text-align: right; font-size: 18px; font-weight: bold; color: #2c5aa0; }}
        .footer {{ text-align: center; margin-top: 30px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>{_appSettings.NombreEmpresa}</h1>
        <h2>FACTURA Nº {pedido.IdPedido:D6}</h2>
    </div>

    <div class='company-info'>
        <p><strong>Dirección:</strong> {_appSettings.DireccionEmpresa}</p>
        <p><strong>Teléfono:</strong> {_appSettings.TelefonoEmpresa}</p>
        <p><strong>Email:</strong> {_appSettings.EmailEmpresa}</p>
        <p><strong>Fecha:</strong> {pedido.FechaPedido:dd/MM/yyyy}</p>
    </div>

    <div class='customer-info'>
        <h3>DATOS DEL CLIENTE</h3>
        <p><strong>Nombre:</strong> {pedido.NombreUsuario}</p>
        <p><strong>Correo:</strong> {pedido.CorreoUsuario}</p>
        <p><strong>Estado del Pedido:</strong> {pedido.EstadoPedido}</p>
    </div>

    <h3>DETALLE DE LA COMPRA</h3>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Marca</th>
                <th>Talla</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Subtotal</th>
            </tr>
        </thead>
        <tbody>";

                int index = 1;
                foreach (var detalle in pedido.Detalles)
                {
                    html += $@"
            <tr>
                <td>{index}</td>
                <td>{detalle.NombreProducto}</td>
                <td>{detalle.MarcaProducto}</td>
                <td>{detalle.Talla}</td>
                <td>{detalle.Cantidad}</td>
                <td>${detalle.PrecioUnitario:N2}</td>
                <td>${detalle.Subtotal:N2}</td>
            </tr>";
                    index++;
                }

                html += $@"
        </tbody>
    </table>

    <div class='total'>
        <p>TOTAL: ${pedido.Total:N2}</p>
    </div>

    <div class='footer'>
        <p>Gracias por su compra</p>
        <p>Documento generado el {DateTime.Now:dd/MM/yyyy HH:mm}</p>
    </div>
</body>
</html>";

                return html;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar factura HTML para pedido {IdPedido}", idPedido);
                throw;
            }
        }
    }
}