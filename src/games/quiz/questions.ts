export interface Question {
  q: string;
  options: string[];
  /** Index of the correct option */
  a: number;
}

// Pengetahuan umum. Tambahkan pertanyaan baru di sini.
export const QUESTIONS: Question[] = [
  { q: "Apa ibu kota Indonesia saat ini (2024)?", options: ["Jakarta", "Bandung", "Surabaya", "Medan"], a: 0 },
  { q: "Planet terbesar di tata surya adalah...", options: ["Saturnus", "Jupiter", "Neptunus", "Bumi"], a: 1 },
  { q: "Berapa jumlah provinsi di Indonesia (2024)?", options: ["34", "36", "38", "40"], a: 2 },
  { q: "Lagu kebangsaan Indonesia diciptakan oleh...", options: ["Ismail Marzuki", "W.R. Supratman", "C. Simanjuntak", "Kusbini"], a: 1 },
  { q: "Hewan tercepat di darat adalah...", options: ["Singa", "Kuda", "Cheetah", "Rusa"], a: 2 },
  { q: "Gunung tertinggi di dunia adalah...", options: ["K2", "Kilimanjaro", "Everest", "Jayawijaya"], a: 2 },
  { q: "Berapa hasil 7 × 8?", options: ["54", "56", "58", "64"], a: 1 },
  { q: "Candi Borobudur terletak di provinsi...", options: ["Jawa Tengah", "Jawa Timur", "DI Yogyakarta", "Bali"], a: 0 },
  { q: "Simbol kimia untuk emas adalah...", options: ["Ag", "Au", "Fe", "Go"], a: 1 },
  { q: "Samudra terluas di dunia adalah...", options: ["Hindia", "Atlantik", "Arktik", "Pasifik"], a: 3 },
  { q: "Pulau terbesar di Indonesia adalah...", options: ["Sumatra", "Kalimantan", "Papua", "Sulawesi"], a: 2 },
  { q: "Siapa presiden pertama Indonesia?", options: ["Soeharto", "B.J. Habibie", "Soekarno", "Moh. Hatta"], a: 2 },
  { q: "Berapa jumlah pemain sepak bola dalam satu tim di lapangan?", options: ["9", "10", "11", "12"], a: 2 },
  { q: "Gas yang paling banyak di atmosfer Bumi adalah...", options: ["Oksigen", "Nitrogen", "Karbon dioksida", "Hidrogen"], a: 1 },
  { q: "Mata uang Jepang adalah...", options: ["Won", "Yuan", "Yen", "Baht"], a: 2 },
  { q: "Hari Kemerdekaan Indonesia diperingati setiap tanggal...", options: ["17 Agustus", "1 Juni", "28 Oktober", "10 November"], a: 0 },
  { q: "Planet yang dijuluki Planet Merah adalah...", options: ["Venus", "Mars", "Merkurius", "Jupiter"], a: 1 },
  { q: "Berapa jumlah hari dalam tahun kabisat?", options: ["364", "365", "366", "367"], a: 2 },
  { q: "Danau vulkanik terbesar di Indonesia adalah...", options: ["Danau Toba", "Danau Singkarak", "Danau Poso", "Danau Maninjau"], a: 0 },
  { q: "Alat musik angklung berasal dari daerah...", options: ["Jawa Barat", "Bali", "Sumatra Barat", "Maluku"], a: 0 },
  { q: "Benua terkecil di dunia adalah...", options: ["Eropa", "Antartika", "Australia", "Amerika Selatan"], a: 2 },
  { q: "Air mendidih pada suhu berapa (di permukaan laut)?", options: ["90°C", "100°C", "110°C", "120°C"], a: 1 },
  { q: "Bahasa resmi Brasil adalah...", options: ["Spanyol", "Portugis", "Inggris", "Prancis"], a: 1 },
  { q: "Komodo hidup secara alami di provinsi...", options: ["NTB", "NTT", "Bali", "Sulawesi Selatan"], a: 1 },
  { q: "Organ tubuh yang memompa darah adalah...", options: ["Paru-paru", "Hati", "Ginjal", "Jantung"], a: 3 },
  { q: "Sungai terpanjang di Indonesia adalah...", options: ["Sungai Musi", "Sungai Kapuas", "Sungai Mahakam", "Sungai Barito"], a: 1 },
  { q: "Berapa sisi yang dimiliki segi enam?", options: ["5", "6", "7", "8"], a: 1 },
  { q: "Menara Eiffel berada di kota...", options: ["London", "Roma", "Paris", "Berlin"], a: 2 },
  { q: "Penemu bola lampu pijar yang populer adalah...", options: ["Nikola Tesla", "Thomas Edison", "Alexander G. Bell", "Isaac Newton"], a: 1 },
  { q: "Hewan apa yang menjadi lambang negara Indonesia?", options: ["Elang Jawa", "Garuda", "Jalak Bali", "Cendrawasih"], a: 1 },
  { q: "Berapa hasil 144 ÷ 12?", options: ["10", "11", "12", "14"], a: 2 },
  { q: "Tari Kecak berasal dari...", options: ["Bali", "Jawa Tengah", "Aceh", "Papua"], a: 0 },
  { q: "Bintang yang paling dekat dengan Bumi adalah...", options: ["Sirius", "Matahari", "Proxima Centauri", "Polaris"], a: 1 },
  { q: "Warna hasil campuran biru dan kuning adalah...", options: ["Ungu", "Oranye", "Hijau", "Cokelat"], a: 2 },
  { q: "Rendang adalah masakan khas dari...", options: ["Sumatra Barat", "Jawa Timur", "Sulawesi Utara", "Kalimantan"], a: 0 },
  { q: "Berapa jumlah benua di dunia (umumnya diajarkan)?", options: ["5", "6", "7", "8"], a: 2 },
  { q: "Negara dengan jumlah penduduk terbanyak (2024) adalah...", options: ["Tiongkok", "India", "Amerika Serikat", "Indonesia"], a: 1 },
  { q: "Satu jam terdiri dari berapa detik?", options: ["360", "600", "3.600", "6.000"], a: 2 },
];
