window.showView = function(viewId) {
    document.querySelectorAll('.view-section').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    
    const target = document.getElementById(viewId);
    if (target) {
        if (viewId === 'viewDashboard') {
            target.style.display = 'contents'; 
        } else {
            target.style.display = 'block';
        }
        target.classList.add('active');
    }
};
/**
 * app.js â€” Coretax DJP Clone (E-Omzet Prototype)
 * Vanilla JavaScript, tanpa framework
 */

document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // 1. DROPDOWN MENUS
  // ============================================================
  const allDropdowns = document.querySelectorAll('.nav-item.dropdown, .dropdown');

  allDropdowns.forEach(dropdown => {
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
      const menu = dropdown.querySelector('.dropdown-menu');
      if (!menu) return;

      // Tutup dropdown lain
      allDropdowns.forEach(d => {
        if (d !== dropdown) {
          d.querySelector('.dropdown-menu')?.classList.remove('show');
        }
      });

      // Toggle dropdown ini
      menu.classList.toggle('show');
    });
  });

  // Klik di luar area dropdown â†’ tutup semua
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu.show').forEach(m => {
      m.classList.remove('show');
    });
  });

  // ============================================================
  // 2. SEARCH MODAL (Ctrl+K)
  // ============================================================
  const searchModal = document.getElementById('searchModal');
  const searchBar = document.getElementById('searchBar');
  const searchModalInput = document.getElementById('searchModalInput');

  const openSearchModal = () => {
    if (!searchModal) return;
    searchModal.classList.add('show');
    searchModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => searchModalInput?.focus(), 50);
  };

  const closeSearchModal = () => {
    if (!searchModal) return;
    searchModal.classList.remove('show');
    searchModal.setAttribute('aria-hidden', 'true');
    if (searchModalInput) searchModalInput.value = '';
  };

  // Klik search bar di header â†’ buka modal
  searchBar?.addEventListener('click', openSearchModal);

  // Klik background modal â†’ tutup
  searchModal?.addEventListener('click', (e) => {
    if (e.target === searchModal) closeSearchModal();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearchModal();
    }
    if (e.key === 'Escape') {
      closeSearchModal();
      document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
    }
  });

  // Quick link click â†’ navigasi (placeholder)
  document.querySelectorAll('.search-quick-link').forEach(link => {
    link.addEventListener('click', () => {
      const name = link.textContent.trim().replace('BARU', '').trim();
      closeSearchModal();
      showToast(`Membuka ${name}...`, 'info');
    });
  });

  // ============================================================
  // 3. TAB SWITCHING (Pengumuman / Bantuan)
  // ============================================================
  const tabPengumuman = document.getElementById('tabPengumuman');
  const tabBantuan = document.getElementById('tabBantuan');
  const tabContentPengumuman = document.getElementById('tabContentPengumuman');
  const tabContentBantuan = document.getElementById('tabContentBantuan');

  const switchTab = (activeTab, activeContent, inactiveTab, inactiveContent) => {
    if (!activeTab || !activeContent || !inactiveTab || !inactiveContent) return;
    activeTab.classList.add('active');
    inactiveTab.classList.remove('active');
    activeContent.classList.add('active');
    inactiveContent.classList.remove('active');
  };

  tabPengumuman?.addEventListener('click', () => {
    switchTab(tabPengumuman, tabContentPengumuman, tabBantuan, tabContentBantuan);
  });

  tabBantuan?.addEventListener('click', () => {
    switchTab(tabBantuan, tabContentBantuan, tabPengumuman, tabContentPengumuman);
  });

  // ============================================================
  // 4. BANNER CAROUSEL
  // ============================================================
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  const carouselContainer = document.querySelector('.carousel-container');
  let currentSlide = 0;
  let carouselTimer = null;

  const showSlide = (index) => {
    if (slides.length === 0) return;
    currentSlide = ((index % slides.length) + slides.length) % slides.length;

    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    slides[currentSlide].classList.add('active');
    if (dots[currentSlide]) dots[currentSlide].classList.add('active');
  };

  const nextSlide = () => showSlide(currentSlide + 1);
  const prevSlideAction = () => showSlide(currentSlide - 1);

  const startAutoPlay = () => {
    stopAutoPlay();
    if (slides.length > 1) {
      carouselTimer = setInterval(nextSlide, 5000);
    }
  };

  const stopAutoPlay = () => {
    if (carouselTimer) {
      clearInterval(carouselTimer);
      carouselTimer = null;
    }
  };

  prevBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
      document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    prevSlideAction();
    startAutoPlay();
  });

  nextBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
      document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    nextSlide();
    startAutoPlay();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
      showSlide(i);
      startAutoPlay();
    });
  });

  // Hover pause
  carouselContainer?.addEventListener('mouseenter', stopAutoPlay);
  carouselContainer?.addEventListener('mouseleave', startAutoPlay);

  // Inisialisasi
  showSlide(0);
  startAutoPlay();

  // ============================================================
  // 5. TOAST NOTIFICATION SYSTEM
  // ============================================================
  const getToastContainer = () => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  };

  const showToast = (message, type = 'info') => {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';

    const colors = {
      info: '#3b82f6',
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444'
    };

    toast.style.backgroundColor = colors[type] || colors.info;
    if (type === 'warning') toast.style.color = '#111';
    toast.innerHTML = message;

    toast.addEventListener('click', () => removeToast(toast));
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    // Auto dismiss 4 detik
    setTimeout(() => removeToast(toast), 4000);
  };

  const removeToast = (toast) => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  };

  // Expose globally
  window.showToast = showToast;

  // ============================================================
  // 6. TIME-BASED GREETING
  // ============================================================
  const greetingEl = document.getElementById('time-greeting');
  if (greetingEl) {
    const hour = new Date().getHours();
    let greeting = 'Selamat Pagi';
    if (hour >= 11 && hour < 15) greeting = 'Selamat Siang';
    else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
    else if (hour >= 18 || hour < 4) greeting = 'Selamat Malam';
    greetingEl.textContent = greeting;
  }

  // ============================================================
  // 7. EDUCATION CARDS â€” Click Handler
  // ============================================================
  document.querySelectorAll('.edu-card').forEach(card => {
    card.addEventListener('click', () => {
      const title = card.querySelector('.education-card-title')?.textContent || 'Fitur';
      showToast(`Fitur "${title}" akan segera tersedia`, 'info');
    });
  });

  // ============================================================
  // 8. BANTUAN ITEMS â€” Click Handler
  // ============================================================
  document.querySelectorAll('.bantuan-item').forEach(item => {
    item.addEventListener('click', () => {
      const title = item.querySelector('.bantuan-title')?.textContent || 'Bantuan';
      showToast(`Membuka "${title}"...`, 'info');
    });
  });

  // ============================================================
  // 9. NAV ITEM CLICK (non-dropdown)
  // ============================================================
  document.querySelectorAll('.nav-item:not(.dropdown)').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.querySelector('.nav-text')?.textContent?.trim() || 'Menu';
      showToast(`Membuka ${name}...`, 'info');
    });
  });

  // ============================================================
  // 10. PAGE LOAD ANIMATION
  // ============================================================
  const animTargets = document.querySelectorAll('.welcome-card, .carousel-container, .bantuan-panel, .education-card');
  animTargets.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = `opacity 0.4s ease ${i * 0.08}s, transform 0.4s ease ${i * 0.08}s`;

    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  });

  // ============================================================
  // 11. CONSOLE WELCOME
  // ============================================================
  console.log('%cðŸ›ï¸ Coretax DJP Clone â€” E-Omzet Prototype', 'color: #d4a017; font-size: 16px; font-weight: bold;');
  console.log('%cUntuk keperluan edukasi dan lomba esai perpajakan.', 'color: #9ca3af; font-size: 12px;');

  // ============================================================
  // 12. THEME TOGGLE (LIGHT/DARK MODE)
  // ============================================================
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const icon = themeToggle.querySelector('i');
      if (document.body.classList.contains('light-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        showToast('Mode Terang diaktifkan', 'info');
      } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        showToast('Mode Gelap diaktifkan', 'info');
      }
    });
  }

});
  // ============================================================
  // 13. MENU NAVIGATION (E-OMZET Prototype)
  // ============================================================
  document.querySelectorAll('.dropdown-item').forEach(item => {
    if(item.textContent.trim() === 'Manajemen Marketplace') {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
      document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
        // Hide dashboard, show marketplace view
        document.getElementById('viewDashboard').style.display = 'none';
        document.getElementById('viewManajemenMarketplace').style.display = 'block';
      document.getElementById('viewTrackingOmzet').style.display = 'none';
      document.getElementById('viewRincianTransaksi').style.display = 'none';
        // Close dropdown
        document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
        // Highlight menu
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active-menu'));
        item.closest('.nav-item').classList.add('active-menu');
      });
    }
    else if (item.textContent.trim() === 'Dashboard') {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
      document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
        // Show dashboard, hide marketplace view
        document.getElementById('viewDashboard').style.display = 'grid'; // because it uses grid typically, wait, let's just set to block or remove inline display
        document.getElementById('viewDashboard').style.display = '';
        document.getElementById('viewManajemenMarketplace').style.display = 'none';
      document.getElementById('viewTrackingOmzet').style.display = 'none';
      document.getElementById('viewRincianTransaksi').style.display = 'none';
        // Close dropdown
        document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
        // Highlight menu
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active-menu'));
        item.closest('.nav-item').classList.add('active-menu');
      });
    }
      });

// ============================================================
// 13. MENU NAVIGATION (E-OMZET Prototype) - UNIFIED ROUTING
// ============================================================
const routeMap = {
  'Manajemen Marketplace': 'viewManajemenMarketplace',
  'Tracking Omzet': 'viewTrackingOmzet',
  'Rincian Transaksi': 'viewRincianTransaksi',
  'Dashboard': 'viewDashboard',
  'Bukti Potong Unifikasi': 'viewEbupotUnifikasi',
  'Surat Pemberitahuan (SPT)': 'viewSPTMasa',
};

document.querySelectorAll('.dropdown-item').forEach(item => {
  const text = item.textContent.trim();
  if (routeMap[text]) {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
      showView(routeMap[text]);
      const navParent = item.closest('.nav-item');
      if (navParent) {
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active-menu'));
        navParent.classList.add('active-menu');
      }
    });
  }
});

// Portal Saya main nav â†’ Dashboard
document.querySelectorAll('.nav-item').forEach(item => {
  if (item.querySelector('.nav-text') && item.querySelector('.nav-text').textContent.trim() === 'Portal Saya') {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.dropdown-menu')) return;
      showView('viewDashboard');
      document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active-menu'));
      item.classList.add('active-menu');
    });
  }
});

// ============================================================
// 14. MARKETPLACE SIMULATOR (Profil Toko + Tambah Penjualan)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('simulatorToggle');
  const sim = document.getElementById('mobileSimulator');
  const closeBtn = document.getElementById('closeSimulator');
  const simPlatform = document.getElementById('simPlatform');
  const simLogo = document.getElementById('simLogo');
  const simLog = document.getElementById('simLog');
  const btnTambah = document.getElementById('btnTambahPenjualan');
  const btnCopyId = document.getElementById('btnCopyId');
  const simHeader = document.getElementById('simHeader');

  // Toggle Simulator
  if (toggle) toggle.addEventListener('click', () => sim.classList.add('open'));
  if (closeBtn) closeBtn.addEventListener('click', () => sim.classList.remove('open'));

  // Change Platform
  if (simPlatform) simPlatform.addEventListener('change', (e) => {
    const opt = e.target.options[e.target.selectedIndex];
    if (simLogo) simLogo.src = opt.dataset.logo;
    if (simHeader) simHeader.style.background = `linear-gradient(135deg, ${opt.dataset.color}, ${opt.dataset.color}cc)`;
    if (btnTambah) btnTambah.style.background = `linear-gradient(135deg, ${opt.dataset.color}, ${opt.dataset.color}cc)`;
    const avatar = document.getElementById('simAvatar');
    if (avatar) avatar.style.background = `linear-gradient(135deg, ${opt.dataset.color}, ${opt.dataset.color}cc)`;
    const shopName = document.getElementById('simShopName');
    if (shopName) shopName.textContent = opt.dataset.shop;
    const sellerId = document.getElementById('simSellerId');
    if (sellerId) sellerId.textContent = opt.dataset.id;
  });

  // Copy Seller ID
  if (btnCopyId) btnCopyId.addEventListener('click', () => {
    const id = document.getElementById('simSellerId')?.textContent || '';
    navigator.clipboard.writeText(id).then(() => {
      btnCopyId.innerHTML = '<i class="fa-solid fa-check"></i> Tersalin!';
      setTimeout(() => { btnCopyId.innerHTML = '<i class="fa-solid fa-copy"></i> Salin ID'; }, 2000);
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = id;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      btnCopyId.innerHTML = '<i class="fa-solid fa-check"></i> Tersalin!';
      setTimeout(() => { btnCopyId.innerHTML = '<i class="fa-solid fa-copy"></i> Salin ID'; }, 2000);
    });
  });

  // Tambah Penjualan
  if (btnTambah) btnTambah.addEventListener('click', () => {
    const platform = simPlatform ? simPlatform.value : 'Shopee';
    const trx = addTransaction(platform);
    const C = getComputedState();
    
    // Log
    const time = new Date().toLocaleTimeString('id-ID');
    const logEntry = document.createElement('div');
    let logHtml = `<span style="color:#aaa;">[${time}]</span> POST /api/v1/omzet<br>`;
    logHtml += `<span style="color:#fff;">+${FMTC(trx.kotor)} (${platform})</span><br>`;
    logHtml += `<span style="color:#60a5fa;">Net: ${FMTC(trx.net)}</span>`;
    if (trx.pph22 > 0) {
      logHtml += `<br><span style="color:#f87171;">PPh 22: -${FMTC(trx.pph22)}</span>`;
    }
    logHtml += '<br>---';
    logEntry.innerHTML = logHtml;
    logEntry.style.marginBottom = '8px';
    if (simLog) simLog.prepend(logEntry);

    // Button feedback
    btnTambah.innerHTML = '<i class="fa-solid fa-check-circle"></i> Terkirim!';
    btnTambah.style.opacity = '0.7';
    setTimeout(() => {
      btnTambah.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Uji Coba Tambah Penjualan';
      btnTambah.style.opacity = '1';
    }, 1500);
  });

  // ============================================================
  // 15. LAPORKAN BUTTON (Rincian Transaksi â†’ SPT)
  // ============================================================
  const btnLaporkan = document.getElementById('btnLaporkan');
  if (btnLaporkan) btnLaporkan.addEventListener('click', () => {
    const S = window.eOmzetState;
    S.sptReported = true;
    renderSPT();
    showToast('<i class="fa-solid fa-circle-check" style="margin-right:8px;"></i> Transaksi berhasil dilaporkan ke SPT Masa September 2026.<br><small>Klik untuk menuju halaman SPT...</small>', 'success');
    
    // Make toast clickable to navigate to SPT
    setTimeout(() => {
      const toast = document.querySelector('.toast-notification');
      if (toast) {
        toast.style.cursor = 'pointer';
        toast.addEventListener('click', () => {
          showView('viewSPTMasa');
          toast.remove();
        });
      }
    }, 100);
  });

  // ============================================================
  // 16. KIRIM SPT
  // ============================================================
  const btnKirimSPT = document.getElementById('btnKirimSPT');
  if (btnKirimSPT) btnKirimSPT.addEventListener('click', () => {
    const S = window.eOmzetState;
    S.sptSubmitted = true;
    renderSPT();
    showToast('<i class="fa-solid fa-paper-plane" style="margin-right:8px;"></i> SPT Masa PPh 22 berhasil dikirim!<br><small>BPE (Bukti Penerimaan Elektronik) tersedia.</small>', 'success');
  });

  // ============================================================
  // 17. "Ke Menu eBupot" BUTTON
  // ============================================================
  const btnKeEbupot = document.getElementById('btnKeEbupot');
  if (btnKeEbupot) btnKeEbupot.addEventListener('click', () => {
    showView('viewEbupotUnifikasi');
  });

  // ============================================================
  // INITIAL RENDER
  // ============================================================
  renderAll();
});


document.addEventListener('DOMContentLoaded', () => {
  const mpForm = document.getElementById('marketplaceForm');
  if (mpForm) {
    mpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const platform = document.getElementById('mpPlatform').value;
      const shopName = document.getElementById('mpStoreName').value;
      const sellerId = document.getElementById('mpStoreId').value;
      const url = document.getElementById('mpStoreUrl').value;
      
      window.eOmzetState.connectedPlatforms.push({
        platform: platform,
        shopName: shopName,
        sellerId: sellerId,
        url: url
      });
      
      // Update UI
      if (typeof renderAll === "function") {
        renderAll();
      }
      
      // Show toast
      showToast('Integrasi Marketplace berhasil ditambahkan.', 'success');
      
      // Reset form
      mpForm.reset();
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const formPutus = document.getElementById('formPutusIntegrasi');
  if (formPutus) {
    formPutus.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const fileInput = document.getElementById('filePutusIntegrasi');
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        showToast('Silakan unggah dokumen pernyataan terlebih dahulu.', 'error');
        return;
      }

      const index = window.platformToRemoveIndex;
      if (index !== null && index >= 0 && index < window.eOmzetState.connectedPlatforms.length) {
        window.eOmzetState.connectedPlatforms[index].status = 'Menunggu Pemutusan';
        
        if (typeof renderAll === "function") {
          renderAll();
        }
        showToast('Dokumen tersimpan. Pemutusan integrasi sedang diproses.', 'success');
      }
      
      document.getElementById('modalPutusIntegrasi').style.display = 'none';
      window.platformToRemoveIndex = null;
    });
  }
});

// Clock for Simulator
setInterval(() => {
  const now = new Date();
  const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const clockHomescreen = document.getElementById('simClock');
  const clockApps = document.querySelectorAll('.simClockApp');
  
  if (clockHomescreen) clockHomescreen.textContent = timeStr;
  clockApps.forEach(el => el.textContent = timeStr);
}, 1000);



