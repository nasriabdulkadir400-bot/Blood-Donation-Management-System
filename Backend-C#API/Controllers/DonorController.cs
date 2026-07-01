using Microsoft.AspNetCore.Mvc;
using BloodDonationAPI.Models;
using BloodDonationAPI.Repository;

namespace BloodDonationAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DonorController : ControllerBase
    {
        private readonly DonorRepository _repo;
        public DonorController(DonorRepository repo) => _repo = repo;

        // GET: api/Donor
        [HttpGet]
        public async Task<IActionResult> GetAll()
            => Ok(await _repo.GetAllAsync());

        // GET: api/Donor/search?name=ahmed  ← SEARCH FUNCTIONALITY
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { message = "Fadlan geli magaca aad raadinayso" });
            return Ok(await _repo.SearchByNameAsync(name));
        }

        // GET: api/Donor/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var donor = await _repo.GetByIdAsync(id);
            if (donor == null) return NotFound(new { message = "Donor lama helin" });
            return Ok(donor);
        }

        // POST: api/Donor
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Donor donor)
        {
            // Required Fields + Model Validation
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Empty Field Check
            if (string.IsNullOrWhiteSpace(donor.FullName))
                return BadRequest(new { message = "Magaca buuxa waa loo baahan yahay" });
            if (string.IsNullOrWhiteSpace(donor.BloodGroup))
                return BadRequest(new { message = "Koox dhiigga waa loo baahan yahay" });

            // Numeric Validation — DonorID should be 0 for new
            if (donor.DonorID != 0)
                return BadRequest(new { message = "DonorID waa inuu noqdaa 0 markii la sameeynayo" });

            // Duplicate Record Checking (Phone)
            if (!string.IsNullOrWhiteSpace(donor.Phone))
            {
                bool dup = await _repo.PhoneExistsAsync(donor.Phone);
                if (dup) return Conflict(new { message = "Donor leh telefoonkan horey ayuu u jiray — Duplicate Record" });
            }

            int newId = await _repo.CreateAsync(donor);
            donor.DonorID = newId;
            return CreatedAtAction(nameof(GetById), new { id = newId }, donor);
        }

        // PUT: api/Donor/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Donor donor)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (string.IsNullOrWhiteSpace(donor.FullName))
                return BadRequest(new { message = "Magaca buuxa waa loo baahan yahay" });
            if (string.IsNullOrWhiteSpace(donor.BloodGroup))
                return BadRequest(new { message = "Koox dhiigga waa loo baahan yahay" });

            // Duplicate check (excluding self)
            if (!string.IsNullOrWhiteSpace(donor.Phone))
            {
                bool dup = await _repo.PhoneExistsAsync(donor.Phone, id);
                if (dup) return Conflict(new { message = "Donor kale oo leh telefoonkan ayaa jira — Duplicate Record" });
            }

            bool updated = await _repo.UpdateAsync(id, donor);
            if (!updated) return NotFound(new { message = "Donor lama helin" });
            return Ok(new { message = "Donor si guul ah loo cusbooneysiiyay" });
        }

        // DELETE: api/Donor/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            bool deleted = await _repo.DeleteAsync(id);
            if (!deleted) return NotFound(new { message = "Donor lama helin" });
            return Ok(new { message = "Donor si guul ah looga tirtirtay" });
        }
    }
}
