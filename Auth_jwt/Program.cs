using Auth_jwt.Data;
using Auth_jwt.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Auth_jwt
{
	public class Program
	{
		public static void Main(string[] args)
		{
			var builder = WebApplication.CreateBuilder(args);

			// CORS configuration for SignalR and frontend
			builder.Services.AddCors(options =>
			{
				options.AddPolicy("AllowChatApp", policy =>
				{
					policy.WithOrigins("http://localhost:5173") // Frontend URL
						  .AllowAnyMethod()
						  .AllowAnyHeader()
						  .AllowCredentials(); // Required for SignalR with auth
				});
			});

			// Database context
			builder.Services.AddDbContext<ApplicationDbContext>(options =>
				options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

			// Identity configuration
			builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
			{
				options.Password.RequireDigit = true;
				options.User.RequireUniqueEmail = true;
			})
				.AddEntityFrameworkStores<ApplicationDbContext>()
				.AddDefaultTokenProviders();

			// SignalR
			builder.Services.AddSignalR();

			// JWT Authentication
			builder.Services.AddAuthentication(options =>
			{
				options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
				options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
			}).AddJwtBearer(options =>
			{
				options.TokenValidationParameters = new TokenValidationParameters
				{
					ValidateIssuer = false,
					ValidateAudience = false,
					ValidateLifetime = true,
					ValidateIssuerSigningKey = true,
					ValidIssuer = builder.Configuration["Jwt:Issuer"],
					ValidAudience = builder.Configuration["Jwt:Audience"],
					IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
				};
				// Ensure SignalR works with JWT
				options.Events = new JwtBearerEvents
				{
					OnMessageReceived = context =>
					{
						var accessToken = context.Request.Query["access_token"];
						var path = context.HttpContext.Request.Path;
						if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chatHub"))
						{
							context.Token = accessToken;
						}
						return Task.CompletedTask;
					}
				};
			});

			// Add controllers and Swagger
			builder.Services.AddControllers();
			builder.Services.AddEndpointsApiExplorer();
			builder.Services.AddSwaggerGen();

			var app = builder.Build();

			// Middleware pipeline
			if (app.Environment.IsDevelopment())
			{
				app.UseSwagger();
				app.UseSwaggerUI();
			}

			app.UseHttpsRedirection();

			// Serve static files (e.g., uploads)
			app.UseStaticFiles(); // Default wwwroot
			app.UseStaticFiles(new StaticFileOptions
			{
				FileProvider = new PhysicalFileProvider(Path.Combine(builder.Environment.WebRootPath, "uploads")),
				RequestPath = "/uploads"
			});

			app.UseCors("AllowChatApp"); // Before routing for SignalR

			app.UseRouting(); // Routing before auth
			app.UseAuthentication(); // Authentication before authorization
			app.UseAuthorization();

			// Map endpoints
			app.MapControllers();
			app.MapHub<ChatHub>("/chatHub"); // SignalR hub

			app.Run();
		}
	}
}