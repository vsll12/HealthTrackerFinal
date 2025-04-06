using Auth_jwt.Data;
using Auth_jwt.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Linq;
using System.Threading.Tasks;

namespace Auth_jwt.Controllers
{
	[Route("api/friends")]
	[ApiController]
	[Authorize]
	public class FriendsController : ControllerBase
	{
		private readonly ApplicationDbContext _context;

		public FriendsController(ApplicationDbContext context)
		{
			_context = context;
		}

		[HttpGet("non-friends")]
		public async Task<IActionResult> GetNonFriends()
		{
			var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			if (string.IsNullOrEmpty(currentUserId))
			{
				return Unauthorized("User ID not found in token.");
			}

			var allUsers = await _context.Users.ToListAsync();
			System.Console.WriteLine($"Total Users in DB: {allUsers.Count}");

			var connectedUsers = await _context.Friendships
				.Where(f => (f.UserId1 == currentUserId || f.UserId2 == currentUserId)
							&& f.Status != FriendshipStatus.Rejected) // Exclude only Pending and Accepted
				.Select(f => f.UserId1 == currentUserId ? f.UserId2 : f.UserId1)
				.Distinct()
				.ToListAsync();
			System.Console.WriteLine($"Connected Users Count: {connectedUsers.Count}, IDs: {string.Join(", ", connectedUsers)}");

			// Get users not in connectedUsers and not the current user
			var nonFriends = await _context.Users
				.Where(u => u.Id != currentUserId && !connectedUsers.Contains(u.Id))
				.Select(u => new { u.Id, u.UserName })
				.ToListAsync();
			System.Console.WriteLine($"Non-Friends Count: {nonFriends.Count}");

			return Ok(nonFriends);
		}

		[HttpGet("users")]
		public async Task<IActionResult> GetUsers()
		{
			var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			var users = await _context.Users
				.Where(u => u.Id != currentUserId)
				.Select(u => new { u.Id, u.UserName })
				.ToListAsync();
			return Ok(users);
		}

		[HttpPost("follow/{userId}")]
		public async Task<IActionResult> SendFollowRequest(string userId)
		{
			var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			if (currentUserId == userId) return BadRequest("Cannot follow yourself.");

			var existingFriendship = await _context.Friendships
				.FirstOrDefaultAsync(f =>
					(f.UserId1 == currentUserId && f.UserId2 == userId) ||
					(f.UserId1 == userId && f.UserId2 == currentUserId));

			if (existingFriendship != null) return BadRequest("Friendship request already exists or is accepted.");

			var friendship = new Friendship
			{
				UserId1 = currentUserId,
				UserId2 = userId,
				Status = FriendshipStatus.Pending
			};

			_context.Friendships.Add(friendship);
			await _context.SaveChangesAsync();

			return Ok(new { message = "Follow request sent." });
		}

		[HttpPut("accept/{friendshipId}")]
		public async Task<IActionResult> AcceptFollowRequest(int friendshipId)
		{
			var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			var friendship = await _context.Friendships
				.FirstOrDefaultAsync(f => f.Id == friendshipId && f.UserId2 == currentUserId);

			if (friendship == null) return NotFound("Friendship request not found.");
			if (friendship.Status != FriendshipStatus.Pending) return BadRequest("Request already processed.");

			friendship.Status = FriendshipStatus.Accepted;
			await _context.SaveChangesAsync();

			return Ok(new { message = "Follow request accepted." });
		}

		[HttpGet("pending")]
		public async Task<IActionResult> GetPendingRequests()
		{
			var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			var pending = await _context.Friendships
				.Where(f => f.UserId2 == currentUserId && f.Status == FriendshipStatus.Pending)
				.Include(f => f.User1)
				.Select(f => new { f.Id, UserName = f.User1.UserName })
				.ToListAsync();
			return Ok(pending);
		}

		[HttpGet("friends/{userId}")]
		public async Task<IActionResult> GetFriends(string userId)
		{
			var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			if (userId != currentUserId) return Unauthorized();

			var friends = await _context.Friendships
				.Where(f => (f.UserId1 == userId || f.UserId2 == userId) && f.Status == FriendshipStatus.Accepted)
				.Select(f => new
				{
					Id = f.UserId1 == userId ? f.UserId2 : f.UserId1,
					Name = f.UserId1 == userId ? f.User2.UserName : f.User1.UserName
				})
				.ToListAsync();
			return Ok(friends);
		}

		// Reject a follow request
		[HttpPut("reject/{friendshipId}")]
		public async Task<IActionResult> RejectFollowRequest(int friendshipId)
		{
			var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			var friendship = await _context.Friendships
				.FirstOrDefaultAsync(f => f.Id == friendshipId && f.UserId2 == currentUserId);

			if (friendship == null) return NotFound("Friendship request not found.");
			if (friendship.Status != FriendshipStatus.Pending) return BadRequest("Request already processed.");

			friendship.Status = FriendshipStatus.Rejected;
			await _context.SaveChangesAsync();

			return Ok(new { message = "Follow request rejected." });
		}
	}
}