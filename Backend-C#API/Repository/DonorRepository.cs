using Microsoft.Data.SqlClient;
using BloodDonationAPI.Models;
using BloodDonationAPI.Data;

namespace BloodDonationAPI.Repository
{
    public class DonorRepository
    {
        private readonly DbConnection _db;
        public DonorRepository(DbConnection db) => _db = db;

        private static Donor MapReader(SqlDataReader r) => new Donor
        {
            DonorID    = r.GetInt32(r.GetOrdinal("DonorID")),
            FullName   = r.GetString(r.GetOrdinal("FullName")),
            Gender     = r["Gender"]  == DBNull.Value ? null : r.GetString(r.GetOrdinal("Gender")),
            BloodGroup = r.GetString(r.GetOrdinal("BloodGroup")),
            Phone      = r["Phone"]   == DBNull.Value ? null : r.GetString(r.GetOrdinal("Phone")),
            Address    = r["Address"] == DBNull.Value ? null : r.GetString(r.GetOrdinal("Address"))
        };

        // ========== GET ALL ==========
        public async Task<List<Donor>> GetAllAsync()
        {
            var list = new List<Donor>();
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = "SELECT DonorID, FullName, Gender, BloodGroup, Phone, Address FROM Donor ORDER BY FullName";
            using var cmd = new SqlCommand(sql, conn);
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync()) list.Add(MapReader(reader));
            return list;
        }

        // ========== SEARCH BY NAME — server-side ADO.NET parameterized query ==========
        public async Task<List<Donor>> SearchByNameAsync(string name)
        {
            var list = new List<Donor>();
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = @"SELECT DonorID, FullName, Gender, BloodGroup, Phone, Address
                           FROM Donor WHERE FullName LIKE @name ORDER BY FullName";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@name", $"%{name}%");
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync()) list.Add(MapReader(reader));
            return list;
        }

        // ========== GET BY ID ==========
        public async Task<Donor?> GetByIdAsync(int id)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = "SELECT DonorID, FullName, Gender, BloodGroup, Phone, Address FROM Donor WHERE DonorID = @id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync()) return MapReader(reader);
            return null;
        }

        // ========== DUPLICATE CHECK — same Phone (excluding self on edit) ==========
        public async Task<bool> PhoneExistsAsync(string phone, int excludeId = 0)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = "SELECT COUNT(1) FROM Donor WHERE Phone = @phone AND DonorID <> @excludeId";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@phone", phone);
            cmd.Parameters.AddWithValue("@excludeId", excludeId);
            return (int)await cmd.ExecuteScalarAsync() > 0;
        }

        // ========== CREATE ==========
        public async Task<int> CreateAsync(Donor d)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = @"INSERT INTO Donor (FullName, Gender, BloodGroup, Phone, Address)
                           VALUES (@FullName, @Gender, @BloodGroup, @Phone, @Address);
                           SELECT SCOPE_IDENTITY();";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@FullName",   d.FullName);
            cmd.Parameters.AddWithValue("@Gender",     (object?)d.Gender  ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@BloodGroup", d.BloodGroup);
            cmd.Parameters.AddWithValue("@Phone",      (object?)d.Phone   ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Address",    (object?)d.Address ?? DBNull.Value);
            return Convert.ToInt32(await cmd.ExecuteScalarAsync());
        }

        // ========== UPDATE ==========
        public async Task<bool> UpdateAsync(int id, Donor d)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = @"UPDATE Donor SET FullName=@FullName, Gender=@Gender,
                           BloodGroup=@BloodGroup, Phone=@Phone, Address=@Address
                           WHERE DonorID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@FullName",   d.FullName);
            cmd.Parameters.AddWithValue("@Gender",     (object?)d.Gender  ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@BloodGroup", d.BloodGroup);
            cmd.Parameters.AddWithValue("@Phone",      (object?)d.Phone   ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Address",    (object?)d.Address ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@id",         id);
            return await cmd.ExecuteNonQueryAsync() > 0;
        }

        // ========== DELETE ==========
        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = "DELETE FROM Donor WHERE DonorID = @id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            return await cmd.ExecuteNonQueryAsync() > 0;
        }
    }
}
