using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SocialAI.Service.Models
{
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = null!;

        [BsonElement("name")]
        public string Name { get; set; } = null!;

        [BsonElement("email")]
        public string Email { get; set; } = null!;

        [BsonElement("role")]
        public string Role { get; set; } = "User";

        [BsonElement("isBlocked")]
        public bool IsBlocked { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; }
    }
}
