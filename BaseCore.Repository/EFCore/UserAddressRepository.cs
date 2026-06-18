using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository.EFCore
{
    public interface IUserAddressRepositoryEF
    {
        Task<List<UserAddress>> GetByUserIdAsync(string userId);
        Task<UserAddress?> GetByIdAsync(int id, string userId);
        Task<UserAddress?> GetDefaultAsync(string userId);
        Task<int> CountByUserIdAsync(string userId);
        Task AddAsync(UserAddress address);
        Task UpdateAsync(UserAddress address);
        Task DeleteAsync(UserAddress address);
        Task ClearDefaultAsync(string userId);
    }

    public class UserAddressRepositoryEF : IUserAddressRepositoryEF
    {
        private readonly AppDbContext _context;

        public UserAddressRepositoryEF(AppDbContext context)
        {
            _context = context;
        }

        public Task<List<UserAddress>> GetByUserIdAsync(string userId) =>
            _context.UserAddresses
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.CreatedAt)
                .ToListAsync();

        public Task<UserAddress?> GetByIdAsync(int id, string userId) =>
            _context.UserAddresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        public Task<UserAddress?> GetDefaultAsync(string userId) =>
            _context.UserAddresses.FirstOrDefaultAsync(a => a.UserId == userId && a.IsDefault);

        public Task<int> CountByUserIdAsync(string userId) =>
            _context.UserAddresses.CountAsync(a => a.UserId == userId);

        public async Task AddAsync(UserAddress address)
        {
            await _context.UserAddresses.AddAsync(address);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(UserAddress address)
        {
            _context.UserAddresses.Update(address);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(UserAddress address)
        {
            _context.UserAddresses.Remove(address);
            await _context.SaveChangesAsync();
        }

        public async Task ClearDefaultAsync(string userId)
        {
            var defaults = await _context.UserAddresses
                .Where(a => a.UserId == userId && a.IsDefault)
                .ToListAsync();
            foreach (var a in defaults) a.IsDefault = false;
            if (defaults.Count > 0) await _context.SaveChangesAsync();
        }
    }
}