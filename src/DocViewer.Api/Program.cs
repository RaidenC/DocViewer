using DocViewer.Api.Hubs;
using DocViewer.Application.Interfaces;
using DocViewer.Infrastructure.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5217", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// MediatR
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

// SignalR
builder.Services.AddSignalR();

// Services
builder.Services.AddTransient<IFileSystemService, FileSystemService>();
builder.Services.AddTransient<ISearchService, OpenSearchService>();
builder.Services.AddHostedService<DocumentSyncService>();

// Configuration - load from appsettings.json
// The DataRoot is relative to ContentRootPath (the project folder)
var app = builder.Build();

var contentRoot = app.Services.GetRequiredService<IWebHostEnvironment>().ContentRootPath;
var dataRootConfig = builder.Configuration["DataRoot"] ?? "../../data";
var dataRoot = Path.GetFullPath(Path.Combine(contentRoot, dataRootConfig));

Console.WriteLine($"Content root: {contentRoot}");
Console.WriteLine($"Data root config: {dataRootConfig}");
Console.WriteLine($"Data root: {dataRoot}");
Console.WriteLine($"Data exists: {Directory.Exists(dataRoot)}");

// Override configuration with resolved path
builder.Configuration["DataRoot"] = dataRoot;

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();

app.UseAuthorization();

app.MapHub<DocumentHub>("/hubs/documents");

app.MapControllers();

app.Run();