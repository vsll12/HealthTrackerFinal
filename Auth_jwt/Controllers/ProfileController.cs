using Auth_jwt.Data;
using Auth_jwt.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Auth_jwt.Controllers
{
	[Authorize]
	[Route("api/[controller]")]
	[ApiController]
	public class ProfileController : ControllerBase
	{
		private readonly ApplicationDbContext _context;
		private UserManager<ApplicationUser> _usermanager;


		public ProfileController(ApplicationDbContext context, UserManager<ApplicationUser> usermanager)
		{
			_context = context;
			_usermanager = usermanager;
		}

		[HttpGet]
		public async Task<IActionResult> GetProfile()
		{
			var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

			if (userId == null)
			{
				return Unauthorized();
			}

			var user = await _usermanager.FindByIdAsync(userId);

			if (user == null)
			{
				return NotFound();
			}

			return Ok(new
			{
				user.Name,
				user.Email,
				user.Age,
				user.Weight,
				user.Height,
				user.Gender,
				user.ProfileImagePath,
			});
		}

		[HttpPut]
		public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileDto model)
		{
			var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

			if (userId == null)
			{
				return Unauthorized();
			}

			var user = await _usermanager.FindByIdAsync(userId);

			if (user == null)
			{
				return NotFound();
			}

			user.Name = model.Name;
			user.Age = model.Age;
			user.Weight = model.Weight;
			user.Height = model.Height;

			if (model.File != null && model.File.Length > 0)
			{
				var fileName = $"{Guid.NewGuid()}_{model.File.FileName}";
				var filePath = Path.Combine("wwwroot/uploads", fileName);

				using (var stream = new FileStream(filePath, FileMode.Create))
				{
					await model.File.CopyToAsync(stream);
				}

				user.ProfileImagePath = fileName;
			}

			var result = await _usermanager.UpdateAsync(user);

			if (!result.Succeeded)
			{
				return BadRequest(result.Errors);
			}

			return Ok(new { message = "Profile updated successfully!", ProfileImagePath = user.ProfileImagePath });
		}
	}
}
