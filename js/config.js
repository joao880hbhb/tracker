/**
 * KAIH 30 Hari — konfigurasi konten
 * ------------------------------------------------------------------
 * Semua konten statis yang mudah diganti tim konten ada di sini.
 * Tidak perlu menyentuh logika aplikasi untuk mengganti video atau poster.
 */
(function () {
  "use strict";

  // Ganti path ilustrasi placeholder ini dengan gambar final jika sudah tersedia.
  const habits = [
    {
      id: "bangun-pagi",
      number: "01",
      name: "Bangun Pagi",
      short: "Bangun tepat waktu dan siap memulai hari.",
      icon: "sunrise",
      image: "assets/images/illustrations/habits/bangun-pagi-placeholder.svg",
      soft: "#FEF3C7",
      ink: "#A16207",
      description:
        "Membuka hari dengan segar dan siap. Mulai dari bangun tepat waktu, merapikan tempat tidur, lalu bersiap tanpa tergesa-gesa.",
      why:
        "Bangun pagi melatih disiplin dan memberi waktu yang cukup untuk beribadah, sarapan, dan bersiap ke sekolah. Tubuh dan pikiran juga terasa lebih segar.",
      examples: [
        "Bangun pukul 05.30 dan merapikan tempat tidur.",
        "Berdoa serta sarapan sebelum berangkat sekolah.",
        "Menyiapkan buku dan seragam pada malam sebelumnya."
      ],
      tips:
        "Letakkan jam weker di seberang tempat tidur. Saat alarm berbunyi, kamu harus bangkit untuk mematikannya."
    },
    {
      id: "beribadah",
      number: "02",
      name: "Beribadah",
      short: "Berdoa dan bersyukur sesuai keyakinanmu.",
      icon: "pray",
      image: "assets/images/illustrations/habits/beribadah-placeholder.svg",
      soft: "#F3E8FF",
      ink: "#7E22CE",
      description:
        "Menyempatkan waktu untuk berdoa dan mendekatkan diri kepada Tuhan, sesuai keyakinan dan cara masing-masing.",
      why:
        "Beribadah membentuk ketenangan hati, rasa syukur, dan kesadaran untuk berbuat baik. Nilai-nilai ini menjadi bekal penting dalam kehidupan sehari-hari.",
      examples: [
        "Berdoa sebelum dan sesudah belajar.",
        "Mengikuti kegiatan ibadah bersama keluarga.",
        "Menyisihkan waktu tenang untuk merenung dan bersyukur."
      ],
      tips:
        "Hubungkan ibadah dengan rutinitas yang sudah ada, misalnya berdoa tepat setelah bangun tidur atau sebelum makan."
    },
    {
      id: "berolahraga",
      number: "03",
      name: "Berolahraga",
      short: "Gerakkan tubuh minimal 30 menit setiap hari.",
      icon: "activity",
      image: "assets/images/illustrations/habits/berolahraga-placeholder.svg",
      soft: "#DCFCE7",
      ink: "#15803D",
      description:
        "Menggerakkan tubuh setiap hari agar bugar, kuat, dan penuh energi. Olahraga tidak harus berat—yang penting rutin dan menyenangkan.",
      why:
        "Aktivitas fisik menjaga kesehatan jantung, memperkuat otot dan tulang, serta membantu pikiran tetap fokus. Bergerak juga membuat suasana hati lebih baik.",
      examples: [
        "Berjalan cepat atau bersepeda di sekitar rumah.",
        "Bermain lompat tali atau sepak bola bersama teman.",
        "Mengikuti senam pagi di sekolah."
      ],
      tips:
        "Pilih olahraga yang benar-benar kamu nikmati. Ajak teman atau anggota keluarga agar lebih semangat dan sulit dilewatkan."
    },
    {
      id: "makan-sehat",
      number: "04",
      name: "Makan Sehat dan Bergizi",
      short: "Pilih makanan bergizi dan minum cukup air.",
      icon: "apple",
      image: "assets/images/illustrations/habits/makan-sehat-placeholder.svg",
      soft: "#FFEDD5",
      ink: "#C2410C",
      description:
        "Memilih makanan bergizi seimbang dan minum air putih yang cukup untuk mendukung pertumbuhan serta kemampuan belajar.",
      why:
        "Makanan bergizi memberi energi untuk belajar dan bermain. Kebiasaan ini membantu pertumbuhan, menjaga daya tahan tubuh, dan mencegah rasa lelah berlebihan.",
      examples: [
        "Makan buah atau sayur pada salah satu waktu makan.",
        "Membawa botol air putih ke sekolah.",
        "Memilih camilan yang lebih sehat dibanding gorengan."
      ],
      tips:
        "Gunakan konsep isi piringku: setengah piring sayur dan buah, seperempat karbohidrat, dan seperempat lauk berprotein."
    },
    {
      id: "gemar-belajar",
      number: "05",
      name: "Gemar Belajar",
      short: "Baca, bertanya, atau coba hal baru setiap hari.",
      icon: "book-open",
      image: "assets/images/illustrations/habits/gemar-belajar-placeholder.svg",
      soft: "#E0F2FE",
      ink: "#0369A1",
      description:
        "Menumbuhkan rasa ingin tahu lewat membaca, mencoba, bertanya, dan menemukan hal baru di sekitar kita.",
      why:
        "Belajar terus-menerus membuka wawasan dan melatih kemampuan berpikir. Kebiasaan kecil ini akan membantu kamu beradaptasi dan mengejar cita-cita.",
      examples: [
        "Membaca buku selama 15 menit sebelum tidur.",
        "Mencatat satu hal baru yang dipelajari hari ini.",
        "Bertanya kepada guru atau orang tua tentang hal yang penasaran."
      ],
      tips:
        "Siapkan buku di tempat yang mudah terlihat. Mulai dari bacaan yang kamu sukai, tidak harus buku pelajaran."
    },
    {
      id: "bermasyarakat",
      number: "06",
      name: "Bermasyarakat",
      short: "Bantu orang di rumah atau lingkunganmu.",
      icon: "users",
      image: "assets/images/illustrations/habits/bermasyarakat-placeholder.svg",
      soft: "#DCFCE7",
      ink: "#0F766E",
      description:
        "Hadir dan peduli terhadap orang-orang di sekitar, mulai dari keluarga, teman sekelas, hingga tetangga.",
      why:
        "Bermasyarakat mengajarkan kerja sama, empati, dan tanggung jawab. Anak yang peduli akan lebih mudah membangun pertemanan yang sehat dan lingkungan yang nyaman.",
      examples: [
        "Membantu pekerjaan rumah tanpa diminta.",
        "Ikut kerja bakti atau kegiatan kelas.",
        "Menolong teman yang kesulitan belajar."
      ],
      tips:
        "Mulai dari satu tindakan kecil setiap hari. Menyapa tetangga atau menawarkan bantuan kepada teman sudah termasuk bermasyarakat."
    },
    {
      id: "tidur-cepat",
      number: "07",
      name: "Tidur Cepat",
      short: "Tidur cukup agar tubuh siap menyambut besok.",
      icon: "moon-star",
      image: "assets/images/illustrations/habits/tidur-cepat-placeholder.svg",
      soft: "#F3E8FF",
      ink: "#4338CA",
      description:
        "Memberi tubuh dan otak waktu istirahat yang cukup dengan tidur lebih awal secara rutin.",
      why:
        "Saat tidur, tubuh tumbuh dan otak menyimpan pelajaran hari itu. Tidur cukup membantu kamu fokus, menjaga suasana hati, dan merasa segar keesokan hari.",
      examples: [
        "Memasang pengingat tidur 30 menit sebelum waktu tidur.",
        "Menjauhkan gawai dari tempat tidur.",
        "Membaca buku sebagai pengganti menonton layar sebelum tidur."
      ],
      tips:
        "Buat ritual tidur yang tenang: matikan lampu utama, lakukan peregangan ringan, lalu tarik napas perlahan. Targetkan tidur 8–10 jam untuk anak usia sekolah."
    }
  ];

  const moods = {
    happy: { label: "Senang", icon: "smile" },
    okay: { label: "Biasa saja", icon: "meh" },
    tired: { label: "Lelah", icon: "battery-low" }
  };

  /**
   * VIDEO
   * ------------------------------------------------------------------
   * Setiap item mendukung dua format:
   *
   * 1) YouTube
   *    type: "youtube"
   *    youtubeId: "cozeCsjMV-4"  // ID setelah watch?v=
   *    watchUrl: "https://www.youtube.com/watch?v=cozeCsjMV-4"
   *
   * 2) Video lokal atau MP4 eksternal
   *    type: "mp4"
   *    src: "assets/images/videos/nama-video.mp4"
   *    watchUrl: ""  // opsional
   *
   * poster: URL gambar cover 16:9 (bisa SVG, JPG, atau PNG).
   * duration: teks durasi, boleh dikosongkan.
   */
  const videos = [
    {
      id: "video-kaih",
      type: "mp4",
      src: "assets/images/videos/VID-20261111-WA0000.mp4",
      watchUrl: "",
      poster: "assets/images/videos/video-01.svg",
      title: "7 Kebiasaan Anak Indonesia Hebat",
      description: "Video edukasi tentang tujuh kebiasaan Anak Indonesia Hebat.",
      tag: "Video edukasi",
      duration: "03:20",
      channel: ""
    }
  ];

  /**
   * POSTER
   * ------------------------------------------------------------------
   * src: path gambar poster di assets/images/posters/.
   * Ganti file di assets/images/posters/ atau arahkan ke URL gambar.
   * downloadName: nama file saat pengguna menekan Download Poster.
   */
  const posters = [
    {
      id: "poster-kaih",
      number: "01",
      src: "assets/images/posters/Bangun sebulum subuh sebelum jam 05.00_page-0001.jpg",
      title: "Karakter Hebatmu! 7 Kebiasaan Anak Indonesia Hebat",
      description: "Poster lengkap tujuh kebiasaan Anak Indonesia Hebat untuk dibaca dan dipasang di kelas.",
      tag: "7 Kebiasaan Anak Indonesia Hebat",
      downloadName: "poster-7-kebiasaan-anak-indonesia-hebat"
    }
  ];

  window.KAIH = window.KAIH || {};
  window.KAIH.CONFIG = Object.freeze({
    appName: "KAIH 30 Hari",
    storageKey: "kaih_habit_tracker_v1",
    totalDays: 30,
    habits,
    moods,
    videos,
    posters
  });
})();
