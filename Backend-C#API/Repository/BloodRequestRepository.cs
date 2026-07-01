using Microsoft.Data.SqlClient;
using BloodDonationAPI.Models;
using BloodDonationAPI.Data;

namespace BloodDonationAPI.Repository
{
    public class BloodRequestRepository
    {
        private readonly DbConnection _db;
        public BloodRequestRepository(DbConnection db) => _db = db;

        private static BloodRequest MapReader(SqlDataReader r) => new BloodRequest
        {
            RequestID     = r.GetInt32(r.GetOrdinal("RequestID")),
            RecipientID   = r.GetInt32(r.GetOrdinal("RecipientID")),
            RecipientName = r.GetString(r.GetOrdinal("RecipientName")),
            BloodGroup    = r.GetString(r.GetOrdinal("BloodGroup")),
            QuantityML    = r.GetInt32(r.GetOrdinal("QuantityML")),
            RequestDate   = r.GetDateTime(r.GetOrdinal("RequestDate"))
        };

        private const string SelectSql = @"
            SELECT br.RequestID, br.RecipientID, r.FullName AS RecipientName,
                   br.BloodGroup, br.QuantityML, br.RequestDate
            FROM BloodRequest br
            INNER JOIN Recipient r ON br.RecipientID = r.RecipientID";

        // ========== GET ALL ==========
        public async Task<List<BloodRequest>> GetAllAsync()
        {
            var list = new List<BloodRequest>();
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = SelectSql + " ORDER BY br.RequestDate DESC";
            using var cmd = new SqlCommand(sql, conn);
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync()) list.Add(MapReader(reader));
            return list;
        }

        // ========== SEARCH BY RECIPIENT NAME — server-side ADO.NET ==========
        public async Task<List<BloodRequest>> SearchByRecipientNameAsync(string name)
        {
            var list = new List<BloodRequest>();
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = SelectSql + " WHERE r.FullName LIKE @name ORDER BY br.RequestDate DESC";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@name", $"%{name}%");
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync()) list.Add(MapReader(reader));
            return list;
        }

        // ========== GET BY ID ==========
        public async Task<BloodRequest?> GetByIdAsync(int id)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = SelectSql + " WHERE br.RequestID = @id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync()) return MapReader(reader);
            return null;
        }

        // ========== Recipient jiraa? (Foreign Key Validation) ==========
        public async Task<bool> RecipientExistsAsync(int recipientId)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = "SELECT COUNT(1) FROM Recipient WHERE RecipientID = @id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", recipientId);
            return (int)await cmd.ExecuteScalarAsync() > 0;
        }

        // ========== DUPLICATE CHECK — isla Recipient, isla taariikh, isla koox dhiig ==========
        public async Task<bool> DuplicateExistsAsync(int recipientId, DateTime date, string bloodGroup, int excludeId = 0)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = @"SELECT COUNT(1) FROM BloodRequest
                           WHERE RecipientID = @recipientId
                             AND CAST(RequestDate AS DATE) = CAST(@date AS DATE)
                             AND BloodGroup = @bloodGroup
                             AND RequestID <> @excludeId";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@recipientId", recipientId);
            cmd.Parameters.AddWithValue("@date",        date.Date);
            cmd.Parameters.AddWithValue("@bloodGroup",  bloodGroup);
            cmd.Parameters.AddWithValue("@excludeId",   excludeId);
            return (int)await cmd.ExecuteScalarAsync() > 0;
        }

        // ========== CREATE ==========
        public async Task<int> CreateAsync(BloodRequest req)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = @"INSERT INTO BloodRequest (RecipientID, BloodGroup, QuantityML, RequestDate)
                           VALUES (@RecipientID, @BloodGroup, @QuantityML, @RequestDate);
                           SELECT SCOPE_IDENTITY();";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@RecipientID", req.RecipientID);
            cmd.Parameters.AddWithValue("@BloodGroup",  req.BloodGroup);
            cmd.Parameters.AddWithValue("@QuantityML",  req.QuantityML);
            cmd.Parameters.AddWithValue("@RequestDate", req.RequestDate.Date);
            return Convert.ToInt32(await cmd.ExecuteScalarAsync());
        }

        // ========== UPDATE ==========
        public async Task<bool> UpdateAsync(int id, BloodRequest req)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = @"UPDATE BloodRequest SET RecipientID=@RecipientID, BloodGroup=@BloodGroup,
                           QuantityML=@QuantityML, RequestDate=@RequestDate WHERE RequestID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@RecipientID", req.RecipientID);
            cmd.Parameters.AddWithValue("@BloodGroup",  req.BloodGroup);
            cmd.Parameters.AddWithValue("@QuantityML",  req.QuantityML);
            cmd.Parameters.AddWithValue("@RequestDate", req.RequestDate.Date);
            cmd.Parameters.AddWithValue("@id",          id);
            return await cmd.ExecuteNonQueryAsync() > 0;
        }

        // ========== DELETE ==========
        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = "DELETE FROM BloodRequest WHERE RequestID = @id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            return await cmd.ExecuteNonQueryAsync() > 0;
        }
    }
}
