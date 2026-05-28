/**
 * public/js/main.js
 * Script client-side TomatoScan
 * Menangani: upload preview, drag-drop, animasi bar akurasi, mobile menu
 */

// ── Inisialisasi setelah DOM siap ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initUploadArea();
  initAccuracyBar();
  initMobileMenu();
  initFormLoadingState();
});

// ════════════════════════════════════════════════════════════════════════
// UPLOAD AREA — Drag & Drop + Preview Gambar
// ════════════════════════════════════════════════════════════════════════

function initUploadArea() {
  const uploadArea     = document.getElementById('upload-area');
  const fileInput      = document.getElementById('file-input');
  const previewImg     = document.getElementById('preview-img');
  const placeholder    = document.getElementById('upload-placeholder');
  const fileNameBar    = document.getElementById('file-name-bar');
  const fileNameText   = document.getElementById('file-name-text');
  const btnScan        = document.getElementById('btn-scan');

  // Keluar lebih awal jika elemen tidak ada (halaman selain predict)
  if (!uploadArea || !fileInput) return;

  // ── Event: klik pada area upload ──────────────────────────────────
  uploadArea.addEventListener('click', (e) => {
    // Hindari trigger ganda jika klik di input sendiri
    if (e.target !== fileInput) fileInput.click();
  });

  // ── Event: file dipilih melalui dialog ────────────────────────────
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectedFile(e.target.files[0]);
    }
  });

  // ── Drag & Drop events ────────────────────────────────────────────
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('border-[#C0392B]', 'bg-[#FEF0EF]/50', '!border-solid');
  });

  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('border-[#C0392B]', 'bg-[#FEF0EF]/50', '!border-solid');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('border-[#C0392B]', 'bg-[#FEF0EF]/50', '!border-solid');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      // Masukkan file ke input (agar form bisa submit)
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      handleSelectedFile(file);
    } else if (file) {
      showFileError('Hanya file gambar yang didukung (JPG, PNG, WEBP)');
    }
  });

  /**
   * Fungsi utama handle file yang dipilih:
   * - Validasi ukuran & tipe
   * - Tampilkan preview gambar
   * - Aktifkan tombol scan
   */
  function handleSelectedFile(file) {
    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      showFileError('Format tidak didukung. Gunakan JPG, PNG, atau WEBP.');
      return;
    }
    // Validasi ukuran (maks 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      showFileError('Ukuran file terlalu besar. Maksimal 10 MB.');
      return;
    }

    // Baca file dan tampilkan preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (previewImg) {
        previewImg.src = ev.target.result;
        previewImg.classList.remove('hidden');
      }
      if (placeholder) placeholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);

    // Tampilkan nama file
    if (fileNameBar)  fileNameBar.classList.remove('hidden');
    if (fileNameText) fileNameText.textContent = file.name;

    // Aktifkan tombol scan
    if (btnScan) btnScan.disabled = false;
  }
}

/**
 * clearFile() — Reset area upload ke kondisi awal
 * Dipanggil dari tombol "×" di file name bar
 */
function clearFile() {
  const fileInput   = document.getElementById('file-input');
  const previewImg  = document.getElementById('preview-img');
  const placeholder = document.getElementById('upload-placeholder');
  const fileNameBar = document.getElementById('file-name-bar');
  const btnScan     = document.getElementById('btn-scan');

  if (fileInput)   fileInput.value = '';
  if (previewImg) {
    previewImg.src = '';
    previewImg.classList.add('hidden');
  }
  if (placeholder) placeholder.classList.remove('hidden');
  if (fileNameBar) fileNameBar.classList.add('hidden');
  if (btnScan)     btnScan.disabled = true;
}

/**
 * Tampilkan pesan error upload sederhana (toast/alert)
 */
function showFileError(msg) {
  const area = document.getElementById('upload-area');
  // Flash border merah sebentar
  if (area) {
    area.classList.add('border-red-500', 'bg-red-50/50');
    setTimeout(() => area.classList.remove('border-red-500', 'bg-red-50/50'), 2000);
  }
  alert('⚠️ ' + msg);
}

// ════════════════════════════════════════════════════════════════════════
// ACCURACY BAR — Animasi fill setelah halaman load
// ════════════════════════════════════════════════════════════════════════

function initAccuracyBar() {
  // Cari semua elemen bar akurasi (bisa ada di predict & detail)
  const bars = document.querySelectorAll('.acc-bar-fill');
  if (!bars.length) return;

  // Gunakan IntersectionObserver agar animasi trigger saat elemen terlihat
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const targetWidth = bar.dataset.width || bar.getAttribute('data-width');
        // Delay kecil untuk efek visual yang lebih smooth
        setTimeout(() => {
          bar.style.width = targetWidth || '0%';
        }, 150);
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.1 });

  bars.forEach(bar => observer.observe(bar));
}

// ════════════════════════════════════════════════════════════════════════
// MOBILE MENU — Toggle hamburger navbar
// ════════════════════════════════════════════════════════════════════════

function initMobileMenu() {
  // toggleMobileMenu dipanggil dari onclick di navbar.ejs
  // Fungsi ini hanya sebagai fallback inisialisasi
}

/**
 * toggleMobileMenu() — Dipanggil dari onclick di navbar.ejs
 * Membuka/menutup dropdown mobile menu
 */
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (!menu) return;
  menu.classList.toggle('hidden');
}

// Tutup mobile menu jika klik di luar navbar
document.addEventListener('click', (e) => {
  const menu = document.getElementById('mobile-menu');
  const btn  = document.getElementById('mobile-menu-btn');
  if (!menu || !btn) return;
  if (!menu.contains(e.target) && !btn.contains(e.target)) {
    menu.classList.add('hidden');
  }
});

// ════════════════════════════════════════════════════════════════════════
// FORM LOADING STATE — Ubah tombol saat form submit
// ════════════════════════════════════════════════════════════════════════

function initFormLoadingState() {
  const form    = document.getElementById('predict-form');
  const btnScan = document.getElementById('btn-scan');
  const btnText = document.getElementById('btn-text');
  const btnIcon = document.getElementById('btn-icon');

  if (!form || !btnScan) return;

  form.addEventListener('submit', () => {
    // Pastikan file sudah dipilih
    const fileInput = document.getElementById('file-input');
    if (!fileInput || !fileInput.files || !fileInput.files.length) return;

    // Ubah tampilan tombol menjadi loading
    btnScan.disabled = true;
    if (btnText) btnText.textContent = 'Menganalisis...';

    // Ganti ikon dengan spinner SVG
    if (btnIcon) {
      btnIcon.outerHTML = `
        <svg id="btn-icon" class="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>`;
    }
  });
}
