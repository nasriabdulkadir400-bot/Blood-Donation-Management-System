using Microsoft.AspNetCore.Mvc;
using BloodDonationAPI.Models;
using BloodDonationAPI.Repository;

namespace BloodDonationAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecipientController : ControllerBase
    {
        private readonly RecipientRepository _repo;
        public RecipientController(RecipientRepository repo) => _repo = repo;

        // GET: api/Recipient
        [HttpGet]
        public async Task<IActionResult> GetAll()
            => Ok(await _repo.GetAllAsync());

        // GET: api/Recipient/search?name=maryan  ← SEARCH FUNCTIONALITY
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { message = "Fadlan geli magaca aad raadinayso" });
            return Ok(await _repo.SearchByNameAsync(name));
        }

        // GET: api/Recipient/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _repo.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Recipient lama helin" });
            return Ok(item);
        }

        // POST: api/Recipient
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Recipient recipient)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (string.IsNullOrWhiteSpace(recipient.FullName))
                return BadRequest(new { message = "Magaca buuxa waa loo baahan yahay" });
            if (string.IsNullOrWhiteSpace(recipient.BloodGroup))
                return BadRequest(new { message = "Koox dhiigga waa loo baahan yahay" });

            // Duplicate Record Checking
            if (!string.IsNullOrWhiteSpace(recipient.Phone))
            {
                bool dup = await _repo.PhoneExistsAsync(recipient.Phone);
                if (dup) return Conflict(new { message = "Recipient leh telefoonkan horey ayuu u jiray — Duplicate Record" });
            }

            int newId = await _repo.CreateAsync(recipient);
            recipient.RecipientID = newId;
            return CreatedAtAction(nameof(GetById), new { id = newId }, recipient);
        }

        // PUT: api/Recipient/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Recipient recipient)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (string.IsNullOrWhiteSpace(recipient.FullName))
                return BadRequest(new { message = "Magaca buuxa waa loo baahan yahay" });
            if (string.IsNullOrWhiteSpace(recipient.BloodGroup))
                return BadRequest(new { message = "Koox dhiigga waa loo baahan yahay" });

            if (!string.IsNullOrWhiteSpace(recipient.Phone))
            {
                bool dup = await _repo.PhoneExistsAsync(recipient.Phone, id);
                if (dup) return Conflict(new { message = "Recipient kale oo leh telefoonkan ayaa jira — Duplicate Record" });
            }

            bool updated = await _repo.UpdateAsync(id, recipient);
            if (!updated) return NotFound(new { message = "Recipient lama helin" });
            return Ok(new { message = "Recipient si guul ah loo cusbooneysiiyay" });
        }

        // DELETE: api/Recipient/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            bool deleted = await _repo.DeleteAsync(id);
            if (!deleted) return NotFound(new { message = "Recipient lama helin" });
            return Ok(new { message = "Recipient si guul ah looga tirtirtay" });
        }
    }
}
