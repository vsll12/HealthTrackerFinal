using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using Auth_jwt.Data;
using Auth_jwt.Models;
using Microsoft.AspNetCore.Identity;
using Auth_jwt.Dtos;

namespace Auth_jwt.Controllers
{
	[Route("api/friends")]
	[ApiController]
	[Authorize] 
	public class FriendsController : ControllerBase
	{
		private readonly ApplicationDbContext _context;
		private readonly UserManager<ApplicationUser> _userManager;

		public FriendsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
		{
			_context = context;
			_userManager = userManager;
		}

		[HttpGet("{userId}")]
		public async Task<IActionResult> GetFriends(string userId)
		{
			var friends = await _context.Friendships
				.Where(f => (f.UserId1 == userId || f.UserId2 == userId) && f.Status == FriendshipStatus.Accepted)
				.Include(f => f.User1)
				.Include(f => f.User2)
				.ToListAsync();

			var friendList = friends.Select(f => f.UserId1 == userId ? f.User2 : f.User1).ToList();

			return Ok(friendList);
		}

		[HttpPost("request")]
		public async Task<IActionResult> SendFriendRequest([FromBody] FriendRequestDto request)
		{
			var user = await _userManager.FindByIdAsync(request.UserId);
			if (user == null)
			{
				return NotFound("User not found");
			}

			var existingFriendship = await _context.Friendships
				.FirstOrDefaultAsync(f => (f.UserId1 == request.UserId && f.UserId2 == request.FriendId) ||
										  (f.UserId1 == request.FriendId && f.UserId2 == request.UserId));

			if (existingFriendship != null)
			{
				return BadRequest("Friendship request already exists.");
			}

			var friendship = new Friendship
			{
				UserId1 = request.UserId,
				UserId2 = request.FriendId,
				Status = FriendshipStatus.Pending
			};

			_context.Friendships.Add(friendship);
			await _context.SaveChangesAsync();

			return Ok("Friend request sent");
		}

		[HttpPost("accept")]
		public async Task<IActionResult> AcceptFriendRequest([FromBody] FriendRequestDto request)
		{
			var friendship = await _context.Friendships
				.FirstOrDefaultAsync(f => f.UserId1 == request.UserId && f.UserId2 == request.FriendId && f.Status == FriendshipStatus.Pending);

			if (friendship == null)
			{
				return NotFound("Friend request not found");
			}

			friendship.Status = FriendshipStatus.Accepted;
			_context.Friendships.Update(friendship);
			await _context.SaveChangesAsync();

			return Ok("Friend request accepted");
		}

		[HttpPost("reject")]
		public async Task<IActionResult> RejectFriendRequest([FromBody] FriendRequestDto request)
		{
			var friendship = await _context.Friendships
				.FirstOrDefaultAsync(f => f.UserId1 == request.UserId && f.UserId2 == request.FriendId && f.Status == FriendshipStatus.Pending);

			if (friendship == null)
			{
				return NotFound("Friend request not found");
			}

			friendship.Status = FriendshipStatus.Rejected;
			_context.Friendships.Update(friendship);
			await _context.SaveChangesAsync();

			return Ok("Friend request rejected");
		}

		[HttpGet("status/{userId}/{friendId}")]
		public async Task<IActionResult> GetFriendshipStatus(string userId, string friendId)
		{
			var friendship = await _context.Friendships
				.FirstOrDefaultAsync(f => (f.UserId1 == userId && f.UserId2 == friendId) || (f.UserId1 == friendId && f.UserId2 == userId));

			if (friendship == null)
			{
				return Ok(FriendshipStatus.Pending); 
			}

			return Ok(friendship.Status);
		}
	}
}
