using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using ventasZapatiilasAPI.Models;
using ventasZapatiilasAPI.Models.DTO;

namespace ventasZapatiilasAPI.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;
        }

        public async Task<bool> EnviarEmailConFacturaAsync(
            string destinatario,
            string nombreUsuario,
            int idPedido,
            byte[] facturaPdf)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
                message.To.Add(new MailboxAddress(nombreUsuario, destinatario));
                message.Subject = $"Factura de tu pedido #{idPedido:D6}";

                var builder = new BodyBuilder();
                builder.HtmlBody = $@"
                    <html>
                    <body style='font-family: Arial, sans-serif;'>
                        <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                            <h2 style='color: #2c5aa0;'>¡Gracias por tu compra, {nombreUsuario}!</h2>
                            
                            <p>Tu pedido <strong>#{idPedido:D6}</strong> ha sido procesado exitosamente.</p>
                            
                            <div style='background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                                <h3 style='margin-top: 0;'>Detalles del pedido</h3>
                                <p><strong>Número de pedido:</strong> #{idPedido:D6}</p>
                                <p><strong>Estado:</strong> Pendiente</p>
                                <p><strong>Fecha:</strong> {DateTime.Now:dd/MM/yyyy}</p>
                            </div>
                            
                            <p>Adjunto encontrarás la factura de tu compra en formato PDF.</p>
                            
                            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                            
                            <hr style='border: none; border-top: 1px solid #ddd; margin: 30px 0;'>
                            
                            <p style='font-size: 12px; color: #666;'>
                                Este es un correo automático, por favor no responder.<br>
                                {_emailSettings.SenderName}<br>
                                {_emailSettings.SenderEmail}
                            </p>
                        </div>
                    </body>
                    </html>
                ";

                // Adjuntar PDF
                builder.Attachments.Add($"Factura_{idPedido:D6}.pdf", facturaPdf, ContentType.Parse("application/pdf"));

                message.Body = builder.ToMessageBody();

                return await EnviarEmailAsync(message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar email con factura a {Destinatario}", destinatario);
                return false;
            }
        }

        public async Task<bool> EnviarEmailConfirmacionPedidoAsync(
            string destinatario,
            string nombreUsuario,
            PedidoResponseDTO pedido)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
                message.To.Add(new MailboxAddress(nombreUsuario, destinatario));
                message.Subject = $"Confirmación de pedido #{pedido.IdPedido:D6}";

                // Generar tabla de productos
                var productosHtml = string.Join("", pedido.Detalles.Select(d => $@"
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #ddd;'>{d.NombreProducto}</td>
                        <td style='padding: 10px; border-bottom: 1px solid #ddd;'>{d.MarcaProducto}</td>
                        <td style='padding: 10px; border-bottom: 1px solid #ddd; text-align: center;'>{d.Talla}</td>
                        <td style='padding: 10px; border-bottom: 1px solid #ddd; text-align: center;'>{d.Cantidad}</td>
                        <td style='padding: 10px; border-bottom: 1px solid #ddd; text-align: right;'>${d.PrecioUnitario:N2}</td>
                        <td style='padding: 10px; border-bottom: 1px solid #ddd; text-align: right;'>${d.Subtotal:N2}</td>
                    </tr>
                "));

                var builder = new BodyBuilder();
                builder.HtmlBody = $@"
                    <html>
                    <body style='font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;'>
                        <div style='max-width: 650px; margin: 30px auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>
                            
                            <!-- Header -->
                            <div style='background: linear-gradient(135deg, #2c5aa0 0%, #1e3c72 100%); padding: 30px; text-align: center;'>
                                <h1 style='color: white; margin: 0; font-size: 28px;'>¡Pedido Confirmado!</h1>
                                <p style='color: #e0e0e0; margin: 10px 0 0 0;'>Gracias por tu compra, {nombreUsuario}</p>
                            </div>
                            
                            <!-- Content -->
                            <div style='padding: 30px;'>
                                
                                <!-- Order Info -->
                                <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;'>
                                    <h2 style='color: #2c5aa0; margin-top: 0; font-size: 20px;'>Información del Pedido</h2>
                                    <table style='width: 100%; border-collapse: collapse;'>
                                        <tr>
                                            <td style='padding: 8px 0; color: #666;'><strong>Número de pedido:</strong></td>
                                            <td style='padding: 8px 0; text-align: right;'>#{pedido.IdPedido:D6}</td>
                                        </tr>
                                        <tr>
                                            <td style='padding: 8px 0; color: #666;'><strong>Fecha:</strong></td>
                                            <td style='padding: 8px 0; text-align: right;'>{pedido.FechaPedido:dd/MM/yyyy HH:mm}</td>
                                        </tr>
                                        <tr>
                                            <td style='padding: 8px 0; color: #666;'><strong>Estado:</strong></td>
                                            <td style='padding: 8px 0; text-align: right;'>
                                                <span style='background-color: #ffc107; color: #000; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;'>
                                                    {pedido.EstadoPedido}
                                                </span>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                                
                                <!-- Products Table -->
                                <h3 style='color: #333; margin-bottom: 15px;'>Productos</h3>
                                <table style='width: 100%; border-collapse: collapse; margin-bottom: 25px;'>
                                    <thead>
                                        <tr style='background-color: #2c5aa0; color: white;'>
                                            <th style='padding: 12px; text-align: left;'>Producto</th>
                                            <th style='padding: 12px; text-align: left;'>Marca</th>
                                            <th style='padding: 12px; text-align: center;'>Talla</th>
                                            <th style='padding: 12px; text-align: center;'>Cant.</th>
                                            <th style='padding: 12px; text-align: right;'>Precio</th>
                                            <th style='padding: 12px; text-align: right;'>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productosHtml}
                                    </tbody>
                                </table>
                                
                                <!-- Total -->
                                <div style='background-color: #e8f5e9; padding: 20px; border-radius: 8px; text-align: right;'>
                                    <p style='margin: 0; font-size: 24px; color: #2e7d32; font-weight: bold;'>
                                        TOTAL: ${pedido.Total:N2}
                                    </p>
                                </div>
                                
                                <!-- Next Steps -->
                                <div style='margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;'>
                                    <h3 style='color: #856404; margin-top: 0; font-size: 16px;'>📦 Próximos pasos</h3>
                                    <ul style='color: #856404; margin: 10px 0; padding-left: 20px;'>
                                        <li>Recibirás un correo cuando tu pedido sea procesado</li>
                                        <li>Te notificaremos cuando esté en camino</li>
                                        <li>Tiempo estimado de entrega: 3-5 días hábiles</li>
                                    </ul>
                                </div>
                                
                            </div>
                            
                            <!-- Footer -->
                            <div style='background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #ddd;'>
                                <p style='color: #666; margin: 0; font-size: 14px;'>
                                    ¿Tienes preguntas? Contáctanos en <a href='mailto:{_emailSettings.SenderEmail}' style='color: #2c5aa0; text-decoration: none;'>{_emailSettings.SenderEmail}</a>
                                </p>
                                <p style='color: #999; margin: 10px 0 0 0; font-size: 12px;'>
                                    Este es un correo automático, por favor no responder.<br>
                                    © {DateTime.Now.Year} {_emailSettings.SenderName}. Todos los derechos reservados.
                                </p>
                            </div>
                            
                        </div>
                    </body>
                    </html>
                ";

                message.Body = builder.ToMessageBody();

                return await EnviarEmailAsync(message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar email de confirmación a {Destinatario}", destinatario);
                return false;
            }
        }

        private async Task<bool> EnviarEmailAsync(MimeMessage message)
        {
            try
            {
                using var client = new SmtpClient();

                // Conectar al servidor SMTP
                await client.ConnectAsync(
                    _emailSettings.SmtpHost,
                    _emailSettings.SmtpPort,
                    _emailSettings.EnableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None
                );

                // Autenticar
                if (_emailSettings.UsarAutenticacion)
                {
                    await client.AuthenticateAsync(_emailSettings.SenderEmail, _emailSettings.SenderPassword);
                }

                // Enviar email
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation("Email enviado exitosamente a {Destinatario}", message.To.FirstOrDefault()?.ToString());
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar email");
                return false;
            }
        }
    }
}