using Microsoft.Data.SqlClient;
using BloodDonationAPI.Models;
using BloodDonationAPI.Data;

namespace BloodDonationAPI.Repository
{
    public class RecipientRepository
    {
        private readonly DbConnection _db;
        public RecipientRepository(DbConnection db) => _db = db;

        private static Recipient MapReader(SqlDataReader r) => new Recipient
        {
            RecipientID  = r.GetInt32(r.GetOrdinal("RecipientID")),
            FullName     = r.GetString(r.GetOrdinal("FullName")),
            BloodGroup   = r.GetString(r.GetOrdinal("BloodGroup")),
            Phone        = r["Phone"]        == DBNull.Value ? null : r.GetString(r.GetOrdinal("Phone")),
            HospitalName = r["HospitalName"] == DBNull.Value ? null : r.GetString(r.GetOrdinal("HospitalName"))
        };

        // ========== GET ALL ==========
        public async Task<List<Recipient>> GetAllAsync()
        {
            var list = new List<Recipient>();
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = "SELECT RecipientID, FullName, BloodGroup, Phone, HospitalName FROM Recipient ORDER BY FullName";
            using var cmd = new SqlCommand(sql, conn);
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync()) list.Add(MapReader(reader));
            return list;
        }

        // ========== SEARCH BY NAME — server-side ADO.NET ==========
        public async Task<List<Recipient>> SearchByNameAsync(string name)
        {
            var list = new List<Recipient>();
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = @"SELECT RecipientID, FullName, BloodGroup, Phone, HospitalName
                           FROM Recipient WHERE FullName LIKE @name ORDER BY FullName";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@name", $"%{name}%");
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync()) list.Add(MapReader(reader));
            return list;
        }

        // ========== GET BY ID ==========
        public async Task<Recipient?> GetByIdAsync(int id)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = "SELECT RecipientID, FullName, BloodGroup, Phone, HospitalName FROM Recipient WHERE RecipientID = @id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync()) return MapReader(reader);
            return null;
        }

        // ========== DUPLICATE CHECK — same Phone ==========
        public async Task<bool> PhoneExistsAsync(string phone, int excludeId = 0)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = "SELECT COUNT(1) FROM Recipient WHERE Phone = @phone AND RecipientID <> @excludeId";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@phone", phone);
            cmd.Parameters.AddWithValue("@excludeId", excludeId);
            return (int)await cmd.ExecuteScalarAsync() > 0;
        }

        // ========== CREATE ==========
        public async Task<int> CreateAsync(Recipient r)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = @"INSERT INTO Recipient (FullName, BloodGroup, Phone, HospitalName)
                           VALUES (@FullName, @BloodGroup, @Phone, @HospitalName);
                           SELECT SCOPE_IDENTITY();";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@FullName",     r.FullName);
            cmd.Parameters.AddWithValue("@BloodGroup",   r.BloodGroup);
            cmd.Parameters.AddWithValue("@Phone",        (object?)r.Phone        ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@HospitalName", (object?)r.HospitalName ?? DBNull.Value);
            return Convert.ToInt32(await cmd.ExecuteScalarAsync());
        }

        // ========== UPDATE ==========
        public async Task<bool> UpdateAsync(int id, Recipient r)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = @"UPDATE Recipient SET FullName=@FullName, BloodGroup=@BloodGroup,
                           Phone=@Phone, HospitalName=@HospitalName WHERE RecipientID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@FullName",     r.FullName);
            cmd.Parameters.AddWithValue("@BloodGroup",   r.BloodGroup);
            cmd.Parameters.AddWithValue("@Phone",        (object?)r.Phone        ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@HospitalName", (object?)r.HospitalName ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@id",           id);
            return await cmd.ExecuteNonQueryAsync() > 0;
        }

        // ========== DELETE ==========
        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = "DELETE FROM Recipient WHERE RecipientID = @id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            return await cmd.ExecuteNonQueryAsync() > 0;
        }
    }
}
