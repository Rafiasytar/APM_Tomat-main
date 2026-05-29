/**
 * app.js — Entry point Express untuk TomatoScan
 * Menangani semua routing dengan data dummy (tanpa koneksi ML)
 */

const express = require('express');
const path    = require('path');
const multer  = require('multer');
const fs      = require('fs');
const session = require('express-session');
const bcrypt  = require('bcryptjs');
const sequelize = require('./config/database');
const User      = require('./models/User');
const History   = require('./models/History');
const Disease   = require('./models/Disease');

const diseaseMapping = {
    "Bacterial_spot": "Tomato Bacterial spot",
    "Early_blight": "Tomato Early blight",
    "Late_blight": "Tomato Late blight",
    "Leaf_Mold": "Tomato Leaf Mold",
    "Septoria_leaf_spot": "Tomato Septoria leaf spot",
    "Spider_mites Two-spotted_spider_mite": "Tomato Spider mites",
    "Target_Spot": "Tomato Target Spot",
    "Tomato_Yellow_Leaf_Curl_Virus": "Tomato Yellow Leaf Curl Virus",
    "Tomato_mosaic_virus": "Tomato mosaic virus",
    "healthy": "Tomato Healthy",
    "powdery_mildew": "Tomato Powdery Mildew"
};

const app  = express();
const PORT = process.env.PORT || 3000;

User.hasMany(History, { foreignKey: 'user_id' });
History.belongsTo(User, { foreignKey: 'user_id' });

// Sinkronisasi Database MySQL
sequelize.sync().then(async () => {
  const tableInfo = await sequelize.getQueryInterface().describeTable('predictions');
  if (!tableInfo.user_id) {
    await sequelize.getQueryInterface().addColumn('predictions', 'user_id', {
      type: require('sequelize').DataTypes.INTEGER,
      allowNull: true
    });
  }
  console.log('✅ Database MySQL terhubung dan tabel disinkronisasi.');
}).catch(err => {
  console.error('❌ Gagal menghubungi database MySQL. Pastikan XAMPP/MySQL menyala.', err);
});

// ── Konfigurasi Multer untuk upload gambar ───────────────────────────────
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const unik = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unik + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Middleware ────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'tomatoscan-local-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// (Riwayat sekarang diambil dari MySQL)

// ════════════════════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════════════════════

// GET / — Halaman Beranda
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function redirectIfLoggedIn(req, res, next) {
  if (req.session.user) return res.redirect('/');
  next();
}

// GET /login - Halaman masuk
app.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('pages/login', {
    activePage: 'login',
    title: 'Masuk - TomatoScan',
    error: null,
    success: req.query.registered ? 'Akun berhasil dibuat. Silakan masuk untuk melihat riwayat prediksi.' : null,
    old: {}
  });
});

// POST /login - Proses masuk
app.post('/login', redirectIfLoggedIn, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = req.body.password || '';

  try {
    const user = await User.findOne({ where: { email } });
    const isValidPassword = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!user || !isValidPassword) {
      return res.status(401).render('pages/login', {
        activePage: 'login',
        title: 'Masuk - TomatoScan',
        error: 'Email atau kata sandi tidak sesuai.',
        success: null,
        old: { email }
      });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    res.redirect('/');
  } catch (error) {
    console.error('Gagal login:', error);
    res.status(500).render('pages/login', {
      activePage: 'login',
      title: 'Masuk - TomatoScan',
      error: 'Terjadi kesalahan saat masuk. Coba lagi sebentar.',
      success: null,
      old: { email }
    });
  }
});

// GET /register - Halaman daftar
app.get('/register', redirectIfLoggedIn, (req, res) => {
  res.render('pages/register', {
    activePage: 'register',
    title: 'Daftar - TomatoScan',
    error: null,
    old: {}
  });
});

// POST /register - Proses daftar akun
app.post('/register', redirectIfLoggedIn, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = normalizeEmail(req.body.email);
  const password = req.body.password || '';
  const confirmPassword = req.body.confirmPassword || '';
  const agreed = req.body.terms === 'on';

  const renderRegisterError = (message) => res.status(400).render('pages/register', {
    activePage: 'register',
    title: 'Daftar - TomatoScan',
    error: message,
    old: { name, email }
  });

  if (!name || !email || !password || !confirmPassword) {
    return renderRegisterError('Semua field wajib diisi.');
  }

  if (password.length < 6) {
    return renderRegisterError('Kata sandi minimal 6 karakter.');
  }

  if (password !== confirmPassword) {
    return renderRegisterError('Konfirmasi kata sandi tidak sama.');
  }

  if (!agreed) {
    return renderRegisterError('Centang persetujuan syarat dan ketentuan terlebih dahulu.');
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return renderRegisterError('Email sudah terdaftar. Silakan masuk dengan akun tersebut.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ name, email, password_hash: passwordHash });

    res.redirect('/login?registered=1');
  } catch (error) {
    console.error('Gagal daftar:', error);
    renderRegisterError('Terjadi kesalahan saat membuat akun. Coba lagi sebentar.');
  }
});

// POST /logout - Keluar akun
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

app.get('/', (req, res) => {
  res.render('pages/home', { activePage: 'home', title: 'TomatoScan — Deteksi Penyakit Tomat' });
});

// GET /predict — Halaman Prediksi (kosong)
app.get('/predict', (req, res) => {
  res.render('pages/predict', {
    activePage: 'predict',
    title: 'Prediksi Penyakit — TomatoScan',
    result: null
  });
});

// POST /predict — Proses upload & tampilkan hasil
app.post('/predict', upload.single('image'), async (req, res) => {
  // Simpan path gambar jika ada file yang diupload
  const imgPath = req.file ? '/uploads/' + req.file.filename : null;

  try {
    let apiResult = null;
    
    // Jika ada file gambar, kirim ke backend Python FastAPI
    if (req.file) {
      // Menggunakan native fetch di Node.js (Node >= 18)
      const fileBuffer = fs.readFileSync(req.file.path);
      const blob = new Blob([fileBuffer], { type: req.file.mimetype });
      
      const formData = new FormData();
      formData.append('file', blob, req.file.originalname);
      
      console.log('Mengirim gambar ke API Python...');
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        apiResult = await response.json();
        console.log('Hasil dari API Python:', apiResult);
      } else {
        console.error('API Python merespons dengan error:', response.status);
      }
    }
    
    if (!apiResult) {
      throw new Error("Gagal mendapatkan prediksi dari backend.");
    }

    if (apiResult.error) {
      throw new Error("Backend Python Error: " + apiResult.error);
    }
    
    // Gunakan murni data dari backend
    const finalResult = apiResult;

    // Ambil deskripsi dan treatment dari database berdasarkan label
    const dbLabel = finalResult.disease && finalResult.disease.en ? (diseaseMapping[finalResult.disease.en] || finalResult.disease.en) : null;
    if (dbLabel) {
      const diseaseData = await Disease.findOne({ where: { label: dbLabel } });
      if (diseaseData) {
        try {
          finalResult.symptoms = JSON.parse(diseaseData.symptoms || "[]");
          finalResult.treatments = JSON.parse(diseaseData.treatments || "[]");
        } catch (e) {
          console.error("Gagal parse JSON dari DB");
        }
        finalResult.severityLabel = diseaseData.severityLabel || finalResult.severityLabel;
        finalResult.severity = diseaseData.severity || finalResult.severity;
        if (diseaseData.name_id && diseaseData.name_en) {
          finalResult.disease.name = `${diseaseData.name_id} (${diseaseData.name_en})`;
        }
      }
    }

    // Simpan riwayat hanya untuk pengguna yang sudah login.
    if (req.session.user) {
      await History.create({
        user_id: req.session.user.id,
        disease_name: finalResult.disease.name,
        severity: finalResult.severity,
        accuracy: finalResult.accuracy,
        img_path: imgPath,
        result_json: JSON.stringify(finalResult)
      });
    }

    res.render('pages/predict', {
      activePage: 'predict',
      title: 'Hasil Prediksi — TomatoScan',
      result: { ...finalResult, imgPath }
    });
    
  } catch (error) {
    console.error('Error saat menghubungi API Python:', error);
    
    // Render error jika gagal (bukan dummy)
    res.render('pages/predict', {
      activePage: 'predict',
      title: 'Hasil Prediksi — TomatoScan',
      result: null,
      error: 'Gagal terhubung ke AI model. Pastikan server Python sedang berjalan.'
    });
  }
});

// GET /history — Halaman Riwayat Prediksi
app.get('/history', async (req, res) => {
  if (!req.session.user) {
    return res.render('pages/history', {
      activePage: 'history',
      title: 'Riwayat Prediksi - TomatoScan',
      historyList: [],
      isAuthenticated: false
    });
  }

  try {
    const dbHistory = await History.findAll({
      where: { user_id: req.session.user.id },
      order: [['createdAt', 'DESC']]
    });
    // Format data kembali agar sesuai dengan struktur EJS
    const historyList = dbHistory.map(entry => {
      let resultData = {};
      try {
        resultData = JSON.parse(entry.result_json) || {};
      } catch(e) {}
      
      const dateObj = entry.createdAt ? new Date(entry.createdAt) : new Date();
      const dateStr = dateObj.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

      return {
        id: entry.id,
        disease: resultData.disease || { name: entry.disease_name, en: entry.disease_name },
        accuracy: entry.accuracy,
        severity: entry.severity,
        severityLabel: resultData.severityLabel || entry.severity,
        metrics: resultData.metrics || {},
        symptoms: resultData.symptoms || [],
        treatments: resultData.treatments || [],
        imgPath: entry.img_path,
        date: dateStr
      };
    });
    
    res.render('pages/history', {
      activePage: 'history',
      title: 'Riwayat Prediksi — TomatoScan',
      historyList,
      isAuthenticated: true
    });
  } catch (error) {
    console.error("Gagal mengambil riwayat:", error);
    res.render('pages/history', { activePage: 'history', title: 'Riwayat Error', historyList: [], isAuthenticated: true });
  }
});

// GET /history/:id — Detail riwayat prediksi
app.get('/history/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/history');

  try {
    const entryData = await History.findOne({
      where: { id: req.params.id, user_id: req.session.user.id }
    });
    if (!entryData) return res.redirect('/history');
    
    let resultData = {};
    try {
      resultData = JSON.parse(entryData.result_json) || {};
    } catch(e) {}

    let symptoms = resultData.symptoms || [];
    let treatments = resultData.treatments || [];
    let severityLabel = resultData.severityLabel || entryData.severity;

    if (resultData.disease && resultData.disease.en) {
      const dbLabel = diseaseMapping[resultData.disease.en] || resultData.disease.en;
      const diseaseData = await Disease.findOne({ where: { label: dbLabel } });
      if (diseaseData) {
        try {
          symptoms = JSON.parse(diseaseData.symptoms || "[]");
          treatments = JSON.parse(diseaseData.treatments || "[]");
        } catch (e) {}
        severityLabel = diseaseData.severityLabel || severityLabel;
      }
    }

    const dateObj = entryData.createdAt ? new Date(entryData.createdAt) : new Date();
    const dateStr = dateObj.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

    const entry = {
      id: entryData.id,
      disease: resultData.disease || { name: entryData.disease_name, en: entryData.disease_name },
      accuracy: entryData.accuracy,
      severity: entryData.severity,
      severityLabel: severityLabel,
      metrics: resultData.metrics || {},
      symptoms: symptoms,
      treatments: treatments,
      imgPath: entryData.img_path,
      date: dateStr
    };

    res.render('pages/detail', {
      activePage: 'history',
      title: `Detail: ${entry.disease.name} — TomatoScan`,
      entry
    });
  } catch (error) {
    console.error(error);
    res.redirect('/history');
  }
});

// POST /history/delete/:id — Hapus satu entri riwayat
app.post('/history/delete/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/history');

  try {
    await History.destroy({ where: { id: req.params.id, user_id: req.session.user.id } });
  } catch (err) {
    console.error(err);
  }
  res.redirect('/history');
});

// POST /history/clear — Hapus semua riwayat
app.post('/history/clear', async (req, res) => {
  if (!req.session.user) return res.redirect('/history');

  try {
    await History.destroy({ where: { user_id: req.session.user.id } });
  } catch (err) {
    console.error(err);
  }
  res.redirect('/history');
});

// POST /history/batch-delete — Hapus riwayat terpilih
app.post('/history/batch-delete', async (req, res) => {
  if (!req.session.user) return res.redirect('/history');

  try {
    const idsString = req.body.ids;
    if (idsString) {
      const ids = idsString.split(',').map(id => id.trim()).filter(id => id);
      if (ids.length > 0) {
        await History.destroy({ where: { id: ids, user_id: req.session.user.id } });
      }
    }
  } catch (err) {
    console.error(err);
  }
  res.redirect('/history');
});

// ── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🍅 TomatoScan berjalan di: http://localhost:${PORT}`);
  console.log(`   Tekan Ctrl+C untuk menghentikan server.\n`);
});
