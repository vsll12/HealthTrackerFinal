using Auth_jwt.Data;
using Auth_jwt.Models;
using Microsoft.EntityFrameworkCore;

public class FriendshipService
{
	private readonly ApplicationDbContext _context;

	public FriendshipService(ApplicationDbContext context)
	{
		_context = context;
	}

	public async Task<bool> SendFriendRequest(string senderId, string receiverId)
	{
		if (senderId == receiverId) return false; 

		var existingRequest = await _context.Friendships
			.FirstOrDefaultAsync(f =>
				(f.UserId1 == senderId && f.UserId2 == receiverId) ||
				(f.UserId1 == receiverId && f.UserId2 == senderId));

		if (existingRequest != null) return false; 

		var friendship = new Friendship
		{
			UserId1 = senderId,
			UserId2 = receiverId,
			Status = FriendshipStatus.Pending
		};

		_context.Friendships.Add(friendship);
		await _context.SaveChangesAsync();
		return true;
	}

	public async Task<bool> AcceptFriendRequest(int friendshipId)
	{
		var friendship = await _context.Friendships.FindAsync(friendshipId);
		if (friendship == null) return false;

		friendship.Status = FriendshipStatus.Accepted;
		await _context.SaveChangesAsync();
		return true;
	}

	public async Task<List<ApplicationUser>> GetFriends(string userId)
	{
		var friends = await _context.Friendships
			.Where(f => (f.UserId1 == userId || f.UserId2 == userId) && f.Status == FriendshipStatus.Accepted)
			.Select(f => f.UserId1 == userId ? f.User2 : f.User1)
			.ToListAsync();

		return friends;
	}
}