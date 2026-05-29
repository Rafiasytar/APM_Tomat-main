const sequelize = require('./config/database');
const Disease = require('./models/Disease');

const diseasesData = [
  {
    label: "Tomato Early blight",
    name_id: "Hawar Daun Awal",
    name_en: "Early Blight",
    severity: "tinggi",
    severityLabel: "Kritis & Menular",
    symptoms: JSON.stringify(["Bercak hitam/coklat konsentris","Daun menguning","Gugur daun prematur"]),
    treatments: JSON.stringify([
      {"type":"red","title":"Pemusnahan","text":"Pangkas dan musnahkan daun/cabang yang terinfeksi."},
      {"type":"amber","title":"Fungisida","text":"Semprotkan fungisida tembaga atau klorotalonil."},
      {"type":"green","title":"Pencegahan","text":"Gunakan mulsa untuk mencegah percikan tanah."}
    ])
  },
  {
    label: "Tomato Late blight",
    name_id: "Hawar Daun Lanjut",
    name_en: "Late Blight",
    severity: "tinggi",
    severityLabel: "Sangat Kritis",
    symptoms: JSON.stringify(["Bercak basah pada daun","Lesi coklat pada batang","Buah busuk keras"]),
    treatments: JSON.stringify([
      {"type":"red","title":"Cabut Tanaman","text":"Cabut dan bakar tanaman yang terinfeksi parah segera."},
      {"type":"amber","title":"Fungisida Kontak","text":"Gunakan fungisida mankozeb secara rutin."}
    ])
  },
  {
    label: "Tomato Healthy",
    name_id: "Tomat Sehat",
    name_en: "Healthy",
    severity: "rendah",
    severityLabel: "Kondisi Prima",
    symptoms: JSON.stringify(["Daun hijau segar","Tidak ada bercak/lesi","Pertumbuhan normal"]),
    treatments: JSON.stringify([
      {"type":"green","title":"Perawatan Lanjutan","text":"Teruskan penyiraman dan pemupukan rutin."},
      {"type":"green","title":"Monitoring","text":"Periksa tanaman seminggu sekali."}
    ])
  },
  {
    label: "Tomato Bacterial spot",
    name_id: "Bercak Bakteri",
    name_en: "Bacterial Spot",
    severity: "sedang",
    severityLabel: "Perlu Perhatian",
    symptoms: JSON.stringify(["Bercak kecil kebasahan","Pusat bercak berwarna hitam","Lubang pada daun"]),
    treatments: JSON.stringify([
      {"type":"amber","title":"Bakterisida","text":"Semprotkan bakterisida berbahan aktif tembaga."},
      {"type":"green","title":"Hindari Percikan","text":"Lakukan penyiraman di pangkal batang, jangan membasahi daun."}
    ])
  },
  {
    label: "Tomato Leaf Mold",
    name_id: "Jamur Daun",
    name_en: "Leaf Mold",
    severity: "sedang",
    severityLabel: "Perlu Perhatian",
    symptoms: JSON.stringify(["Bercak kuning pucat di atas daun","Beludru zaitun di bawah daun","Daun menggulung"]),
    treatments: JSON.stringify([
      {"type":"amber","title":"Ventilasi","text":"Tingkatkan sirkulasi udara antar tanaman."},
      {"type":"green","title":"Pengendalian Kelembaban","text":"Kurangi kelembaban di sekitar area tanam."}
    ])
  },
  {
    label: "Tomato Septoria leaf spot",
    name_id: "Bercak Daun Septoria",
    name_en: "Septoria Leaf Spot",
    severity: "sedang",
    severityLabel: "Perlu Perhatian",
    symptoms: JSON.stringify(["Bercak melingkar","Tengah pucat pinggir gelap","Titik hitam kecil di tengah"]),
    treatments: JSON.stringify([
      {"type":"red","title":"Pangkas Daun Bawah","text":"Pangkas daun bagian bawah yang menyentuh tanah."},
      {"type":"amber","title":"Fungisida","text":"Gunakan fungisida secara preventif."}
    ])
  },
  {
    label: "Tomato Spider mites",
    name_id: "Tungau Laba-laba",
    name_en: "Spider Mites Two-spotted",
    severity: "sedang",
    severityLabel: "Perlu Perhatian",
    symptoms: JSON.stringify(["Bintik kuning/putih halus","Jaring tipis di daun","Daun kusam"]),
    treatments: JSON.stringify([
      {"type":"amber","title":"Akarisida","text":"Gunakan semprotan sabun insektisida atau akarisida."},
      {"type":"green","title":"Penyemprotan Air","text":"Semprot daun dengan air secara kuat untuk menjatuhkan tungau."}
    ])
  },
  {
    label: "Tomato Target Spot",
    name_id: "Bercak Target",
    name_en: "Target Spot",
    severity: "sedang",
    severityLabel: "Perlu Perhatian",
    symptoms: JSON.stringify(["Bercak coklat gelap","Bentuk cincin target","Lesi pada batang"]),
    treatments: JSON.stringify([
      {"type":"amber","title":"Sirkulasi Udara","text":"Jaga jarak tanam agar aliran udara lancar."},
      {"type":"green","title":"Fungisida Berkala","text":"Gunakan fungisida yang sesuai secara berkala."}
    ])
  },
  {
    label: "Tomato Yellow Leaf Curl Virus",
    name_id: "Virus Keriting Daun Kuning",
    name_en: "Yellow Leaf Curl Virus",
    severity: "tinggi",
    severityLabel: "Kritis & Menular",
    symptoms: JSON.stringify(["Daun mengerut & melengkung","Warna kuning/klorosis","Pertumbuhan terhambat (kerdil)"]),
    treatments: JSON.stringify([
      {"type":"red","title":"Pemusnahan Total","text":"Cabut dan musnahkan tanaman segera untuk mencegah penyebaran."},
      {"type":"amber","title":"Kendalikan Kutu Kebul","text":"Semprot insektisida untuk membasmi kutu kebul (vektor virus)."}
    ])
  },
  {
    label: "Tomato mosaic virus",
    name_id: "Virus Mosaik",
    name_en: "Mosaic Virus",
    severity: "tinggi",
    severityLabel: "Kritis & Menular",
    symptoms: JSON.stringify(["Bercak belang terang-gelap","Daun mengerut","Buah cacat"]),
    treatments: JSON.stringify([
      {"type":"red","title":"Cabut Tanaman","text":"Tanaman yang terinfeksi harus langsung dicabut."},
      {"type":"amber","title":"Sanitasi Alat","text":"Cuci tangan dan alat pertanian dengan sabun/disinfektan sebelum menangani tanaman lain."}
    ])
  },
  {
    label: "Tomato Powdery Mildew",
    name_id: "Embun Tepung",
    name_en: "Powdery Mildew",
    severity: "sedang",
    severityLabel: "Penyakit Terdeteksi — Perlu Penanganan",
    symptoms: JSON.stringify([
      "Bercak putih seperti tepung pada permukaan daun",
      "Daun menguning dan layu",
      "Serangan parah dapat mematikan jaringan daun"
    ]),
    treatments: JSON.stringify([
      {
        "type": "amber",
        "title": "Fungisida",
        "text": "Semprotkan fungisida berbahan aktif sulfur atau kalium bikarbonat."
      },
      {
        "type": "green",
        "title": "Sirkulasi Udara",
        "text": "Tingkatkan jarak tanam dan pangkas daun bawah untuk mengurangi kelembaban."
      }
    ])
  }
];

async function seedDatabase() {
  try {
    // Pastikan koneksi dan tabel sinkron
    await sequelize.authenticate();
    console.log('✅ Koneksi database berhasil.');
    
    await sequelize.sync();
    
    // Hapus data lama agar tidak terjadi duplikasi jika script dijalankan ulang (opsional)
    await Disease.destroy({ where: {}, truncate: true });
    console.log('🧹 Tabel diseases dikosongkan.');

    // Masukkan data baru
    await Disease.bulkCreate(diseasesData);
    console.log('🌱 Seed data diseases berhasil dimasukkan!');
    
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat melakukan seeding:', error);
  } finally {
    await sequelize.close();
  }
}

seedDatabase();
