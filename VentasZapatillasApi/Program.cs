using Microsoft.EntityFrameworkCore;
using ventasZapatiilasAPI.Data;

var builder = WebApplication.CreateBuilder(args);

// Agregar DbContext con la cadena de conexión
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("CadenaConexion"))
);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 🔥 AGREGAR CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTodo", policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .AllowAnyOrigin();
    });
});

var app = builder.Build();

// Configuración del pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 🔥 ACTIVAR CORS
app.UseCors("PermitirTodo");

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();

app.Run();
