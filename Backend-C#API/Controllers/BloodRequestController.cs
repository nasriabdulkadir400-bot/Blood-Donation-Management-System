using Microsoft.AspNetCore.Mvc;
using BloodDonationAPI.Models;
using BloodDonationAPI.Repository;

namespace BloodDonationAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BloodRequestController : ControllerBase
    {
        private readonly BloodRequestRepository _repo;
        public BloodRequestController(BloodRequestRepository repo) => _repo = repo;

        // GET: api/BloodRequest
        [HttpGet]
        public async Task<IActionResult> GetAll()
            => Ok(await _repo.GetAllAsync());

        // GET: api/BloodRequest/search?name=maryan  ← SEARCH FUNCTIONALITY
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { message = "Fadlan geli magaca recipient-ka aad raadinayso" });
            return Ok(await _repo.SearchByRecipientNameAsync(name));
        }

        // GET: api/BloodRequest/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _repo.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Codsiga dhiigga lama helin" });
            return Ok(item);
        }

        // POST: api/BloodRequest
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BloodRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Numeric Validation
            if (request.RecipientID <= 0)
                return BadRequest(new { message = "RecipientID waa inuu positive yahay" });
            if (request.QuantityML < 100 || request.QuantityML > 5000)
                return BadRequest(new { message = "QuantityML waa inuu u dhexeeyaa 100 - 5000 ml" });
            if (string.IsNullOrWhiteSpace(request.BloodGroup))
                return BadRequest(new { message = "Koox dhiigga waa loo baahan yahay" });

            // Foreign Key Validation
            bool recipientExists = await _repo.RecipientExistsAsync(request.RecipientID);
            if (!recipientExists)
                return BadRequest(new { message = "Recipient-ka la doortay ma jiro nidaamka" });

            // Duplicate Record Checking
            bool dup = await _repo.DuplicateExistsAsync(request.RecipientID, request.RequestDate, request.BloodGroup);
            if (dup)
                return Conflict(new { message = "Codsi isku mid ah ayaa horey u jiray (Recipient + Taariikh + Koox) — Duplicate Record" });

            int newId = await _repo.CreateAsync(request);
            request.RequestID = newId;
            return CreatedAtAction(nameof(GetById), new { id = newId }, request);
        }

        // PUT: api/BloodRequest/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] BloodRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (request.RecipientID <= 0)
                return BadRequest(new { message = "RecipientID waa inuu positive yahay" });
            if (request.QuantityML < 100 || request.QuantityML > 5000)
                return BadRequest(new { message = "QuantityML waa inuu u dhexeeyaa 100 - 5000 ml" });
            if (string.IsNullOrWhiteSpace(request.BloodGroup))
                return BadRequest(new { message = "Koox dhiigga waa loo baahan yahay" });

            bool recipientExists = await _repo.RecipientExistsAsync(request.RecipientID);
            if (!recipientExists)
                return BadRequest(new { message = "Recipient-ka la doortay ma jiro nidaamka" });

            bool dup = await _repo.DuplicateExistsAsync(request.RecipientID, request.RequestDate, request.BloodGroup, id);
            if (dup)
                return Conflict(new { message = "Diiwaan kale oo isku mid ah ayaa jira — Duplicate Record" });

            bool updated = await _repo.UpdateAsync(id, request);
            if (!updated) return NotFound(new { message = "Codsiga dhiigga lama helin" });
            return Ok(new { message = "Codsiga dhiigga si guul ah loo cusbooneysiiyay" });
        }

        // DELETE: api/BloodRequest/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            bool deleted = await _repo.DeleteAsync(id);
            if (!deleted) return NotFound(new { message = "Codsiga dhiigga lama helin" });
            return Ok(new { message = "Codsiga dhiigga si guul ah looga tirtirtay" });
        }
    }
}
