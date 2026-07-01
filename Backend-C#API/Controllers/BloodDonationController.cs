using Microsoft.AspNetCore.Mvc;
using BloodDonationAPI.Models;
using BloodDonationAPI.Repository;

namespace BloodDonationAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BloodDonationController : ControllerBase
    {
        private readonly BloodDonationRepository _repo;
        public BloodDonationController(BloodDonationRepository repo) => _repo = repo;

        // GET: api/BloodDonation
        [HttpGet]
        public async Task<IActionResult> GetAll()
            => Ok(await _repo.GetAllAsync());

        // GET: api/BloodDonation/search?name=ahmed  ← SEARCH FUNCTIONALITY
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { message = "Fadlan geli magaca donor-ka aad raadinayso" });
            return Ok(await _repo.SearchByDonorNameAsync(name));
        }

        // GET: api/BloodDonation/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _repo.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Deeqda dhiigga lama helin" });
            return Ok(item);
        }

        // POST: api/BloodDonation
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BloodDonation donation)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Numeric Validation
            if (donation.DonorID <= 0)
                return BadRequest(new { message = "DonorID waa inuu positive yahay" });
            if (donation.QuantityML < 100 || donation.QuantityML > 2000)
                return BadRequest(new { message = "QuantityML waa inuu u dhexeeyaa 100 - 2000 ml" });

            // Foreign Key Validation — Donor jiraa?
            bool donorExists = await _repo.DonorExistsAsync(donation.DonorID);
            if (!donorExists)
                return BadRequest(new { message = "Donor-ka la doortay ma jiro nidaamka" });

            // Duplicate Record Checking
            bool dup = await _repo.DuplicateExistsAsync(donation.DonorID, donation.DonationDate);
            if (dup)
                return Conflict(new { message = "Donor-kan horey ayuu deeq u sameeyay taariikhdan — Duplicate Record" });

            int newId = await _repo.CreateAsync(donation);
            donation.DonationID = newId;
            return CreatedAtAction(nameof(GetById), new { id = newId }, donation);
        }

        // PUT: api/BloodDonation/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] BloodDonation donation)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (donation.DonorID <= 0)
                return BadRequest(new { message = "DonorID waa inuu positive yahay" });
            if (donation.QuantityML < 100 || donation.QuantityML > 2000)
                return BadRequest(new { message = "QuantityML waa inuu u dhexeeyaa 100 - 2000 ml" });

            bool donorExists = await _repo.DonorExistsAsync(donation.DonorID);
            if (!donorExists)
                return BadRequest(new { message = "Donor-ka la doortay ma jiro nidaamka" });

            bool dup = await _repo.DuplicateExistsAsync(donation.DonorID, donation.DonationDate, id);
            if (dup)
                return Conflict(new { message = "Diiwaan kale oo isku mid ah (Donor + Taariikh) ayaa jira — Duplicate Record" });

            bool updated = await _repo.UpdateAsync(id, donation);
            if (!updated) return NotFound(new { message = "Deeqda dhiigga lama helin" });
            return Ok(new { message = "Deeqda dhiigga si guul ah loo cusbooneysiiyay" });
        }

        // DELETE: api/BloodDonation/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            bool deleted = await _repo.DeleteAsync(id);
            if (!deleted) return NotFound(new { message = "Deeqda dhiigga lama helin" });
            return Ok(new { message = "Deeqda dhiigga si guul ah looga tirtirtay" });
        }
    }
}
