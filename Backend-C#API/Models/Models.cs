using System.ComponentModel.DataAnnotations;

namespace BloodDonationAPI.Models
{
    // ===== DONOR MODEL =====
    // Waafaqsan: Donor table (FullName, Gender, BloodGroup, Phone, Address)
    public class Donor
    {
        public int DonorID { get; set; }

        [Required(ErrorMessage = "Magaca buuxa waa loo baahan yahay")]
        [MinLength(2, ErrorMessage = "Magaca waa inuu ka koobnaadaa ugu yaraan 2 xaraf")]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        public string? Gender { get; set; }

        [Required(ErrorMessage = "Koox dhiigga waa loo baahan yahay")]
        [MaxLength(5)]
        public string BloodGroup { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? Phone { get; set; }

        [MaxLength(150)]
        public string? Address { get; set; }
    }

    // ===== BLOOD DONATION MODEL =====
    // Waafaqsan: BloodDonation table (DonorID, DonationDate, QuantityML)
    public class BloodDonation
    {
        public int DonationID { get; set; }

        [Required(ErrorMessage = "Donor waa loo baahan yahay")]
        public int DonorID { get; set; }

        // JOIN ka: magaca Donor (ma kaydna database)
        public string? DonorName { get; set; }

        [Required(ErrorMessage = "Taariikhda waa loo baahan tahay")]
        public DateTime DonationDate { get; set; }

        [Range(100, 2000, ErrorMessage = "Qadarka ML waa inuu u dhexeeyaa 100 - 2000")]
        public int QuantityML { get; set; }
    }

    // ===== RECIPIENT MODEL =====
    // Waafaqsan: Recipient table (FullName, BloodGroup, Phone, HospitalName)
    public class Recipient
    {
        public int RecipientID { get; set; }

        [Required(ErrorMessage = "Magaca buuxa waa loo baahan yahay")]
        [MinLength(2, ErrorMessage = "Magaca waa inuu ka koobnaadaa ugu yaraan 2 xaraf")]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Koox dhiigga waa loo baahan yahay")]
        [MaxLength(5)]
        public string BloodGroup { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? Phone { get; set; }

        [MaxLength(100)]
        public string? HospitalName { get; set; }
    }

    // ===== BLOOD REQUEST MODEL =====
    // Waafaqsan: BloodRequest table (RecipientID, BloodGroup, QuantityML, RequestDate)
    public class BloodRequest
    {
        public int RequestID { get; set; }

        [Required(ErrorMessage = "Recipient waa loo baahan yahay")]
        public int RecipientID { get; set; }

        // JOIN ka: magaca Recipient (ma kaydna database)
        public string? RecipientName { get; set; }

        [Required(ErrorMessage = "Koox dhiigga waa loo baahan yahay")]
        [MaxLength(5)]
        public string BloodGroup { get; set; } = string.Empty;

        [Range(100, 5000, ErrorMessage = "Qadarka ML waa inuu u dhexeeyaa 100 - 5000")]
        public int QuantityML { get; set; }

        [Required(ErrorMessage = "Taariikhda waa loo baahan tahay")]
        public DateTime RequestDate { get; set; }
    }
}
