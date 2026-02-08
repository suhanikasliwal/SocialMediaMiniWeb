using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using SocialAI.Service.Models;
using SocialAI.Service.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

//
// ======================================================
// CONFIGURATION BOOTSTRAP
// ======================================================
// Explicitly load configuration files to avoid environment
// ambiguity (critical for JWT key resolution).
//
builder.Configuration
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true);
    
    //bypass auth for demo mode just for testing purpose jwt token
var demoBypassAuth =
    builder.Configuration.GetValue<bool>("Demo:BypassAuth");

    // 🔍 TEMPORARY DIAGNOSTIC (CONFIRM FLAG IS READ)
// Console.WriteLine($"[DEMO MODE] BypassAuth = {demoBypassAuth}");

//
// ======================================================
// JWT CLAIM NORMALIZATION (NON-NEGOTIABLE)
// ======================================================
// Prevent ASP.NET from remapping "role" to legacy claim URIs.
// This ensures [Authorize(Roles = "Admin")] works correctly.
//
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

//
// ======================================================
// CORE FRAMEWORK SERVICES
// ======================================================
// Controllers + minimal API metadata support
//
builder.Services.AddControllersWithViews();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddHttpClient();


//
// ======================================================
// SWAGGER CONFIGURATION WITH JWT SUPPORT
// ======================================================
// Enables the Authorize button and propagates Bearer tokens
// into secured endpoints for local testing.
//
builder.Services.AddSwaggerGen(c =>
{
    // API surface definition
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SocialAI Admin API",
        Version = "v1"
    });

    // JWT Bearer authentication definition
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    // Apply Bearer auth globally to all endpoints
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

//
// ======================================================
// MONGODB DEPENDENCY REGISTRATION
// ======================================================
// Centralized MongoDB client using configuration binding.
//
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDb"));

builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;
    return new MongoClient(settings.ConnectionString);
});

//
// ======================================================
// JWT AUTHENTICATION (NODE → ASP.NET TRUST BRIDGE)
// ======================================================
// Uses the same symmetric key as Node.js (HS256).
// Includes explicit key resolution to avoid "signature key
// not found" errors when no 'kid' header exists.
//
var jwtKey = builder.Configuration["Jwt:Key"]!;
// Console.WriteLine("JWT KEY LOADED: " + jwtKey); // diagnostic only

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,          // issuer not enforced
            ValidateAudience = false,        // audience not enforced
            ValidateLifetime = true,         // exp claim enforced
            ValidateIssuerSigningKey = true, // signature must be valid

            // Bridge Node.js "role" → ASP.NET role system
            RoleClaimType = ClaimTypes.Role,

            // Primary signing key
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            )
        };

        // Explicit signing key resolver (critical for Node-issued JWTs)
        options.TokenValidationParameters.IssuerSigningKeyResolver =
            (token, securityToken, kid, parameters) =>
            {
                return new[]
                {
                    new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                };
            };
    });

//
// ======================================================
// APPLICATION SERVICES
// ======================================================
// Scoped services follow per-request lifecycle semantics.
//
builder.Services.AddScoped<AdminService>();
builder.Services.AddScoped<IAiService, AiService>();

var app = builder.Build();

//
// ======================================================
// MIDDLEWARE PIPELINE
// ======================================================
// Order is critical for authentication correctness.
//
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseRouting();

// Authentication MUST precede Authorization
if (!demoBypassAuth)
{
    app.UseAuthentication();
    app.UseAuthorization();
}


app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Admin}/{action=Index}/{id?}"
);

app.Run();
