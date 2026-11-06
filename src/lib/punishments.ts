export const PUNISHMENTS = [
  "Joget 10 detik tanpa musik 💃",
  "Pijat bahu pemenang selama 1 menit 💆",
  "Bilang \"Kamu memang paling jago\" dengan tulus 🙇",
  "Traktir minuman favorit pemenang 🧋",
  "Tirukan suara hewan pilihan pemenang 🐔",
  "Pakai foto profil pilihan pemenang selama 1 jam 📸",
  "Push-up 5 kali 💪",
  "Nyanyikan reff lagu pilihan pemenang 🎤",
  "Ngomong pakai logat daerah selama 3 menit 🗣️",
  "Ambilkan camilan untuk pemenang 🍿",
  "Pose patung selama 30 detik 🗿",
  "Puji pemenang dengan 3 kalimat berbeda ✨",
];

export const randomPunishment = () => PUNISHMENTS[Math.floor(Math.random() * PUNISHMENTS.length)];
