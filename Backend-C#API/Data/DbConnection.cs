using Microsoft.Data.SqlClient;

namespace BloodDonationAPI.Data
{
    public class DbConnection
    {
        private readonly IConfiguration _configuration;

        public DbConnection(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public SqlConnection GetConnection()
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection")!;
            return new SqlConnection(connectionString);
        }
    }
}
