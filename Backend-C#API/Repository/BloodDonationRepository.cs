using Microsoft.Data.SqlClient;
using BloodDonationAPI.Models;
using BloodDonationAPI.Data;

namespace BloodDonationAPI.Repository
{
    public class BloodDonationRepository
    {
        private readonly DbConnection _db;
        public BloodDonationRepository(DbConnection db) => _db = db;

        private static BloodDonation MapReader(SqlDataReader r) => new BloodDonation
        {
            DonationID   = r.GetInt32(r.GetOrdinal("DonationID")),
            DonorID      = r.GetInt32(r.GetOrdinal("DonorID")),
            DonorName    = r.GetString(r.GetOrdinal("DonorName")),
            DonationDate = r.GetDateTime(r.GetOrdinal("DonationDate")),
            QuantityML   = r.GetInt32(r.GetOrdinal("QuantityML"))
        };

        private const string SelectSql = @"
            SELECT bd.DonationID, bd.DonorID, d.FullName AS DonorName,
                   bd.DonationDate, bd.QuantityML
            FROM BloodDonation bd
            INNER JOIN Donor d ON bd.DonorID = d.DonorID";

        // ========== GET ALL ==========
        public async Task<List<BloodDonation>> GetAllAsync()
        {
            var list = new List<BloodDonation>();
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = SelectSql + " ORDER BY bd.DonationDate DESC";
            using var cmd = new SqlCommand(sql, conn);
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync()) list.Add(MapReader(reader));
            return list;
        }

        // ========== SEARCH BY DONOR NAME — server-side ADO.NET parameterized ==========
        public async Task<List<BloodDonation>> SearchByDonorNameAsync(string name)
        {
            var list = new List<BloodDonation>();
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = SelectSql + " WHERE d.FullName LIKE @name ORDER BY bd.DonationDate DESC";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@name", $"%{name}%");
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync()) list.Add(MapReader(reader));
            return list;
        }

        // ========== GET BY ID ==========
        public async Task<BloodDonation?> GetByIdAsync(int id)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = SelectSql + " WHERE bd.DonationID = @id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync()) return MapReader(reader);
            return null;
        }

        // ========== Donor jiraa? (Foreign Key Validation) ==========
        public async Task<bool> DonorExistsAsync(int donorId)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = "SELECT COUNT(1) FROM Donor WHERE DonorID = @donorId";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@donorId", donorId);
            return (int)await cmd.ExecuteScalarAsync() > 0;
        }

        // ========== DUPLICATE CHECK — isla Donor isla taariikh ==========
        public async Task<bool> DuplicateExistsAsync(int donorId, DateTime date, int excludeId = 0)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = @"SELECT COUNT(1) FROM BloodDonation
                           WHERE DonorID = @donorId
                             AND CAST(DonationDate AS DATE) = CAST(@date AS DATE)
                             AND DonationID <> @excludeId";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@donorId",   donorId);
            cmd.Parameters.AddWithValue("@date",      date.Date);
            cmd.Parameters.AddWithValue("@excludeId", excludeId);
            return (int)await cmd.ExecuteScalarAsync() > 0;
        }

        // ========== CREATE ==========
        public async Task<int> CreateAsync(BloodDonation d)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = @"INSERT INTO BloodDonation (DonorID, DonationDate, QuantityML)
                           VALUES (@DonorID, @DonationDate, @QuantityML);
                           SELECT SCOPE_IDENTITY();";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@DonorID",      d.DonorID);
            cmd.Parameters.AddWithValue("@DonationDate", d.DonationDate.Date);
            cmd.Parameters.AddWithValue("@QuantityML",   d.QuantityML);
            return Convert.ToInt32(await cmd.ExecuteScalarAsync());
        }

        // ========== UPDATE ==========
        public async Task<bool> UpdateAsync(int id, BloodDonation d)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = @"UPDATE BloodDonation SET DonorID=@DonorID,
                           DonationDate=@DonationDate, QuantityML=@QuantityML
                           WHERE DonationID=@id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@DonorID",      d.DonorID);
            cmd.Parameters.AddWithValue("@DonationDate", d.DonationDate.Date);
            cmd.Parameters.AddWithValue("@QuantityML",   d.QuantityML);
            cmd.Parameters.AddWithValue("@id",           id);
            return await cmd.ExecuteNonQueryAsync() > 0;
        }

        // ========== DELETE ==========
        public async Task<bool> DeleteAsync(int id)
        {
            using var conn = _db.GetConnection();
            await conn.OpenAsync();
            string sql = "DELETE FROM BloodDonation WHERE DonationID = @id";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            return await cmd.ExecuteNonQueryAsync() > 0;
        }
    }
}
