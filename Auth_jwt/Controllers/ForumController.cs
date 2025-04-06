using Auth_jwt.Data;
using Auth_jwt.Dtos;
using Auth_jwt.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Auth_jwt.Controllers
{
	[Route("api/forum")]
	[ApiController]
	[Authorize]
	public class ForumController : ControllerBase
	{
		private readonly ApplicationDbContext _context;
		private readonly IWebHostEnvironment _environment;

		public ForumController(ApplicationDbContext context, IWebHostEnvironment environment)
		{
			_context = context;
			_environment = environment;
		}

		[HttpGet("posts")]
		public async Task<IActionResult> GetPosts()
		{
			try
			{
				var posts = await _context.ForumPosts
					.Include(p => p.User)
					.OrderBy(p => p.Timestamp)
					.Select(p => new
					{
						p.Id,
						UserId = p.UserId,
						UserName = p.User.UserName,
						Content = p.Content,
						FileUrl = p.FileUrl != null ? $"{Request.Scheme}://{Request.Host}/uploads/{p.FileUrl}" : null,
						Timestamp = p.Timestamp.ToString("o") // Consistent ISO format
					})
					.ToListAsync();
				return Ok(posts);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in GetPosts: {ex.Message}");
				return StatusCode(500, "Failed to retrieve posts.");
			}
		}

		[HttpPost("posts")]
		public async Task<IActionResult> CreatePost([FromForm] ForumPostDto dto)
		{
			try
			{
				var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
				if (currentUserId != dto.UserId)
				{
					return Unauthorized("User ID does not match authenticated user.");
				}

				string fileUrl = null;
				if (dto.File != null)
				{
					var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads");
					if (!Directory.Exists(uploadsFolder))
					{
						Directory.CreateDirectory(uploadsFolder);
					}

					var fileName = $"{Guid.NewGuid()}_{dto.File.FileName}";
					var filePath = Path.Combine(uploadsFolder, fileName);
					using (var stream = new FileStream(filePath, FileMode.Create))
					{
						await dto.File.CopyToAsync(stream);
					}
					fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
					Console.WriteLine($"File saved to: {filePath}, URL: {fileUrl}");
				}

				// Validation moved to ChatHub, just return data for SignalR
				var user = await _context.Users.FindAsync(dto.UserId);
				var response = new
				{
					Id = 0, // Temporary ID, set by ChatHub
					UserId = dto.UserId,
					UserName = user?.UserName ?? "Unknown",
					Content = dto.Content ?? "",
					FileUrl = fileUrl, // Full URL or null
					Timestamp = DateTime.UtcNow.ToString("o")
				};

				return Ok(response);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in CreatePost: {ex.Message}");
				return StatusCode(500, $"Failed to process post: {ex.Message}");
			}
		}
	}
}