using BaseCore.Entities;
using BaseCore.Repository;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.APIService.Helpers
{
    public static class NotificationHelper
    {
        public static async Task CreateAsync(
            AppDbContext db,
            string userId,
            string title,
            string message,
            string type,
            string? refId = null)
        {
            if (string.IsNullOrEmpty(userId)) return;

            db.Notifications.Add(new Notification
            {
                UserId    = userId,
                Title     = title,
                Message   = message,
                Type      = type,
                RefId     = refId,
                CreatedAt = DateTime.Now,
            });
            await db.SaveChangesAsync();
        }

        /// <summary>Lấy danh sách UserId của tất cả Admin trong hệ thống</summary>
        public static async Task<List<string>> GetAdminUserIdsAsync(AppDbContext db) =>
            await db.Users
                .Where(u => u.UserType == 1)
                .Select(u => u.Id)
                .ToListAsync();
    }
}
