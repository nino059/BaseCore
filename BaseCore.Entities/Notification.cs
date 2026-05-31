namespace BaseCore.Entities
{
    public class Notification
    {
        public int Id { get; set; }
        public string UserId { get; set; } = "";
        public string Title { get; set; } = "";
        public string Message { get; set; } = "";
        public string Type { get; set; } = "";      // "order" | "product" | "blog"
        public string? RefId { get; set; }           // id đơn hàng / tranh / bài viết
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
