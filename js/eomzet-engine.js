// ============================================================
// E-OMZET STATE MANAGEMENT & RENDERING ENGINE
// ============================================================

const FMT = (n) => new Intl.NumberFormat('id-ID').format(n);
const FMTC = (n) => 'Rp ' + FMT(n);

window.eOmzetState = {
  transactions: [],
  ebupotEntries: [],
  connectedPlatforms: [
    { platform: "shopee", shopName: "Maju Bersatu Store", sellerId: "SHP-872361", url: "", status: "Terhubung" },
    { platform: "tokopedia", shopName: "Maju Bersatu", sellerId: "TKP-99120", url: "", status: "Terhubung" },
    { platform: "blibli", shopName: "Maju Bersatu Official", sellerId: "BLI-11234", url: "", status: "Terhubung" },
    { platform: "lazada", shopName: "Maju Bersatu Laz", sellerId: "LZD-99881", url: "", status: "Terhubung" }
  ],
  sptReported: false,
  sptSubmitted: false,
  BATAS_NET: 500000000,
  BATAS_PKP: 4800000000,
  TARIF_PPH22: 0.005
};

// ============================================================
// COMPUTED VALUES
// ============================================================
function getComputedState() {
  const S = window.eOmzetState;
  const activeTx = S.transactions.filter(t => !t.isRefunded);
  const totalKotor = activeTx.reduce((s, t) => s + t.kotor, 0);
  const totalBiaya = activeTx.reduce((s, t) => s + t.biaya, 0);
  const totalNet = activeTx.reduce((s, t) => s + t.net, 0);
  const totalPPh22 = activeTx.reduce((s, t) => s + t.pph22, 0);
  const saldoKas = activeTx.reduce((s, t) => s + (t.net - t.pph22), 0);
  const sisaKuota = Math.max(0, S.BATAS_NET - totalNet);
  const pctProgress = Math.min(100, (totalNet / S.BATAS_NET) * 100);
  const isPPhActive = totalNet > S.BATAS_NET && totalNet <= S.BATAS_PKP;
  const isPPhStopped = totalNet > S.BATAS_PKP;

  // Platform breakdown
  const platforms = {};
  activeTx.forEach(t => {
    if (!platforms[t.platform]) platforms[t.platform] = { shop: t.shop, kotor: 0, net: 0 };
    platforms[t.platform].kotor += t.kotor;
    platforms[t.platform].net += t.net;
  });

  return { totalKotor, totalBiaya, totalNet, totalPPh22, saldoKas, sisaKuota, pctProgress, isPPhActive, isPPhStopped, platforms };
}

// ============================================================
// ADD TRANSACTION
// ============================================================
function addTransaction(platformObj) {
  const S = window.eOmzetState;
  const kotor = 100000000; // 100 juta per klik
  const biaya = 0; // Biaya platform dihapus agar angka masuk bersih 100 juta
  const net = kotor - biaya;

  // Calculate cumulative BEFORE this transaction
  const activeTx = S.transactions.filter(t => !t.isRefunded);
  const prevNet = activeTx.reduce((s, t) => s + t.net, 0);
  const afterNet = prevNet + net;

  let pph22 = 0;
  if (afterNet > S.BATAS_NET && prevNet <= S.BATAS_PKP) {
    // Only tax the portion that exceeds the 500M threshold
    let taxableAmount = net;
    if (prevNet < S.BATAS_NET) {
      taxableAmount = afterNet - S.BATAS_NET;
    }
    
    // If it crosses the PKP limit in this transaction, only tax up to PKP limit
    if (afterNet > S.BATAS_PKP && prevNet <= S.BATAS_PKP) {
      taxableAmount = S.BATAS_PKP - Math.max(prevNet, S.BATAS_NET);
    }
    
    pph22 = Math.round(taxableAmount * S.TARIF_PPH22);
  }

  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  
  // Format invoice dynamically
  const platformName = typeof platformObj === 'object' ? (platformObj.platform || 'Unknown') : platformObj;
  const shopName = typeof platformObj === 'object' ? (platformObj.shopName || 'Store') : 'Store';
  const prefix = platformName.substring(0,3).toUpperCase();
  const inv = `INV/${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}/${prefix}/${Math.floor(100000+Math.random()*900000)}`;

  const trx = {
    id: Date.now() + Math.floor(Math.random()*1000),
    no: S.transactions.length + 1,
    date: dateStr,
    platform: platformName,
    shop: shopName,
    invoice: inv,
    kotor,
    biaya,
    net,
    pph22,
    isRefunded: false
  };

  S.transactions.push(trx);

  // If PPh22 was withheld, add eBupot entry
  if (pph22 > 0) {
    S.ebupotEntries.push({
      no: S.ebupotEntries.length + 1,
      masa: 'September 2026',
      ntpn: 'NTPN' + Date.now().toString().slice(-8),
      pemotong: `PT ${platformName} Indonesia`,
      dpp: net,
      tarif: '0,5%',
      pph: pph22
    });
  }

  renderAll();
  return trx;
}

// ============================================================
// RENDERERS
// ============================================================
function renderAll() {
  renderRincianTransaksi();
  renderTrackingOmzet();
  renderEbupot();
  renderSPT();
  renderSimulator();
  renderManajemenMarketplace();
}

function renderRincianTransaksi() {
  const S = window.eOmzetState;
  const C = getComputedState();
  const tbody = document.getElementById('rincianTbody');
  const tfoot = document.getElementById('rincianTfoot');
  const countEl = document.getElementById('rincianCount');
  if (!tbody) return;

  if (S.transactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding: 32px 16px; text-align: center; color: var(--text-muted); font-style: italic;">Belum ada data transaksi.</td></tr>`;
  } else {
    let html = '';
    S.transactions.forEach((t, i) => {
      html += `<tr style="border-bottom: 1px solid var(--border-light); background-color: var(--bg-card);">
        <td style="padding: 12px 24px;">${i + 1}</td>
        <td style="padding: 12px 24px;">${t.date}</td>
        <td style="padding: 12px 24px;">${t.platform}</td>
        <td style="padding: 12px 24px; font-family: monospace;">${t.invoice}</td>
        <td style="padding: 12px 24px; text-align: right;">${FMTC(t.kotor)}</td>
        <td style="padding: 12px 24px; text-align: right; color: var(--nav-red);">- ${FMTC(t.pph22)}</td>
        <td style="padding: 12px 24px; text-align: right;">${FMTC(t.net)}</td>
      </tr>`;
    });
    tbody.innerHTML = html;
  }

  tfoot.innerHTML = `<tr style="background-color: rgba(255,255,255,0.03); border-top: 2px solid var(--border-light);">
    <td colspan="4" style="padding: 16px 24px; font-weight: 700; color: var(--text-primary); text-align: right;">Total Keseluruhan (Tahun 2026)</td>
    <td style="padding: 16px 24px; text-align: right; font-weight: 700; color: var(--text-primary);">${FMTC(C.totalKotor)}</td>
    <td style="padding: 16px 24px; text-align: right; font-weight: 700; color: var(--nav-red);">- ${FMTC(C.totalPPh22)}</td>
    <td style="padding: 16px 24px; text-align: right; font-weight: 800; color: var(--text-primary); font-size: 14px;">${FMTC(C.totalNet)}</td>
  </tr>`;

  if (countEl) countEl.textContent = `Menampilkan 1 hingga ${S.transactions.length} dari total ${S.transactions.length} data transaksi API terhubung`;
}

function renderTrackingOmzet() {
  const C = getComputedState();
  const S = window.eOmzetState;

  const el = (id) => document.getElementById(id);
  if (el('trackTotalNet')) el('trackTotalNet').textContent = FMTC(C.totalNet);
  
  if (el('trackSisaKuota')) {
    el('trackSisaKuota').textContent = C.sisaKuota > 0 ? FMTC(C.sisaKuota) : 'Rp 0';
    el('trackSisaKuota').style.color = C.sisaKuota > 0 ? 'var(--nav-green)' : 'var(--nav-red)';
  }

  if (el('trackStatusPPh')) {
    if (C.isPPhStopped) {
      el('trackStatusPPh').innerHTML = '<span style="color: var(--nav-blue);"><i class="fa-solid fa-circle-stop"></i> PUNGUTAN DIHENTIKAN</span>';
      el('trackStatusInfo').innerHTML = 'Omzet > Rp 4,8 M Ã¢â‚¬â€ PPh 22: <strong>Dihentikan</strong>';
    } else if (C.isPPhActive) {
      el('trackStatusPPh').innerHTML = '<span style="color: var(--nav-red);"><i class="fa-solid fa-triangle-exclamation"></i> DIPUNGUT 0,5%</span>';
      el('trackStatusInfo').innerHTML = 'Pemungutan PPh 22: <strong>Aktif (0,5%)</strong>';
    } else {
      el('trackStatusPPh').innerHTML = '<span style="color: var(--accent-gold);"><i class="fa-solid fa-shield-halved"></i> BEBAS PUNGUTAN</span>';
      el('trackStatusInfo').innerHTML = 'Pemungutan PPh 22: <strong>Nonaktif</strong>';
    }
  }

  if (el('trackPercent')) el('trackPercent').textContent = C.pctProgress.toFixed(1) + '%';
  if (el('trackProgressBar')) el('trackProgressBar').style.width = Math.min(100, C.pctProgress) + '%';

  // Platform breakdown
  const ptbody = el('trackPlatformTbody');
  if (ptbody) {
    if (Object.keys(C.platforms).length === 0) {
      ptbody.innerHTML = `<tr><td colspan="3" style="padding: 32px 16px; text-align: center; color: var(--text-muted); font-style: italic;">Belum ada omzet tercatat.</td></tr>`;
    } else {
      const iconMap = { 'Shopee': '<i class="fa-solid fa-store" style="color: #ee4d2d; margin-right: 8px;"></i>', 'Tokopedia': '<i class="fa-solid fa-bag-shopping" style="color: #42b549; margin-right: 8px;"></i>' };
      let html = '';
      for (const [pf, data] of Object.entries(C.platforms)) {
        html += `<tr style="border-bottom: 1px solid var(--border-light);">
          <td style="padding: 16px 0; font-weight: 600; color: var(--text-primary);">${iconMap[pf] || ''} ${pf} (${data.shop})</td>
          <td style="padding: 16px 0; text-align: right; color: var(--text-muted);">${FMTC(data.kotor)}</td>
          <td style="padding: 16px 0; text-align: right; font-weight: 700; color: var(--text-primary);">${FMTC(data.net)}</td>
        </tr>`;
      }
      html += `<tr>
        <td style="padding: 16px 0; font-weight: 700; color: var(--accent-gold); font-size: 14px;">Total Terakumulasi</td>
        <td style="padding: 16px 0; text-align: right; color: var(--text-muted);">${FMTC(C.totalKotor)}</td>
        <td style="padding: 16px 0; text-align: right; font-weight: 800; color: var(--accent-gold); font-size: 15px;">${FMTC(C.totalNet)}</td>
      </tr>`;
      ptbody.innerHTML = html;
    }
  }

  // PPh total in sidebar
  if (el('trackPPhTotal')) {
    el('trackPPhTotal').innerHTML = `Total PPh 22 Dipotong: <span style="color: var(--accent-gold);">${FMTC(C.totalPPh22)}</span>`;
  }
}

function renderEbupot() {
  const S = window.eOmzetState;
  const C = getComputedState();
  const tbody = document.getElementById('ebupotTbody');
  if (!tbody) return;

  if (S.ebupotEntries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="padding: 48px 24px; text-align: center; color: var(--text-muted);">
      <i class="fa-solid fa-file-circle-xmark" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
      Belum ada bukti potong. Pemungutan PPh 22 dimulai setelah omzet melebihi Rp 500 juta.
    </td></tr>`;
  } else {
    let html = '';
    S.ebupotEntries.forEach((e, i) => {
      html += `<tr style="border-bottom: 1px solid var(--border-light); background-color: var(--bg-card);">
        <td style="padding: 12px 24px;">${i + 1}</td>
        <td style="padding: 12px 24px;">${e.masa}</td>
        <td style="padding: 12px 24px; font-family: monospace;">${e.ntpn}</td>
        <td style="padding: 12px 24px;">${e.pemotong}</td>
        <td style="padding: 12px 24px; text-align: right;">${FMTC(e.dpp)}</td>
        <td style="padding: 12px 24px; text-align: center;">0,5%</td>
        <td style="padding: 12px 24px; text-align: right;">${FMTC(e.pph)}</td>
        <td style="padding: 12px 24px; text-align: center;"><span style="background: rgba(74,222,128,0.1); color: var(--nav-green); padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700;">Prepopulated</span></td>
      </tr>`;
    });
    tbody.innerHTML = html;
  }

  const el = (id) => document.getElementById(id);
  if (el('ebupotTotalPPh')) el('ebupotTotalPPh').textContent = FMTC(C.totalPPh22);
  if (el('ebupotCount')) el('ebupotCount').textContent = S.ebupotEntries.length + ' Dokumen';
}

function renderSPT() {
  const S = window.eOmzetState;
  const C = getComputedState();
  
      const kotor = C.totalKotor;
  const beban = kotor * 0.8;
  const neto = kotor - beban; // neto = 20%
  const ptkp = 54000000;
  const pkp = Math.max(0, neto - ptkp);
  const pkpBulat = Math.floor(pkp / 1000) * 1000;
  
  let pphTerutang = 0;
  if (pkpBulat > 0) {
    if (pkpBulat <= 60000000) {
      pphTerutang = pkpBulat * 0.05;
    } else if (pkpBulat <= 250000000) {
      pphTerutang = (60000000 * 0.05) + ((pkpBulat - 60000000) * 0.15);
    } else if (pkpBulat <= 500000000) {
      pphTerutang = (60000000 * 0.05) + (190000000 * 0.15) + ((pkpBulat - 250000000) * 0.25);
    } else if (pkpBulat <= 5000000000) {
      pphTerutang = (60000000 * 0.05) + (190000000 * 0.15) + (250000000 * 0.25) + ((pkpBulat - 500000000) * 0.30);
    } else {
      pphTerutang = (60000000 * 0.05) + (190000000 * 0.15) + (250000000 * 0.25) + (4500000000 * 0.30) + ((pkpBulat - 5000000000) * 0.35);
    }
  }
  
  const kurangLebihBayar = pphTerutang - C.totalPPh22;

  // Update L1 Pembukuan
  if (document.getElementById('sptL1Omzet')) document.getElementById('sptL1Omzet').textContent = FMTC(kotor);
  if (document.getElementById('sptL1Hpp')) document.getElementById('sptL1Hpp').textContent = FMTC(0);
  if (document.getElementById('sptL1Bruto')) document.getElementById('sptL1Bruto').textContent = FMTC(kotor);
  if (document.getElementById('sptL1Beban')) document.getElementById('sptL1Beban').textContent = FMTC(beban);
  if (document.getElementById('sptL1Neto')) document.getElementById('sptL1Neto').textContent = FMTC(neto);

  // Update Induk
  if (document.getElementById('sptIndukNeto')) document.getElementById('sptIndukNeto').textContent = FMTC(neto);
  if (document.getElementById('sptIndukC2')) document.getElementById('sptIndukC2').textContent = FMTC(neto);
  if (document.getElementById('sptIndukC4')) document.getElementById('sptIndukC4').textContent = FMTC(neto);
  if (document.getElementById('sptIndukC6')) document.getElementById('sptIndukC6').textContent = FMTC(pkpBulat);
  if (document.getElementById('sptIndukC7')) document.getElementById('sptIndukC7').textContent = FMTC(pphTerutang);
  if (document.getElementById('sptIndukC9')) document.getElementById('sptIndukC9').textContent = FMTC(pphTerutang);
  
  if (document.getElementById('sptIndukKredit')) document.getElementById('sptIndukKredit').textContent = FMTC(C.totalPPh22);
  if (document.getElementById('sptL1TotalKredit')) document.getElementById('sptL1TotalKredit').textContent = FMTC(C.totalPPh22);
  if (document.getElementById('sptIndukE11a')) document.getElementById('sptIndukE11a').textContent = FMTC(kurangLebihBayar);
  if (document.getElementById('sptIndukE11c')) document.getElementById('sptIndukE11c').textContent = FMTC(kurangLebihBayar);

  const tbody = document.getElementById('sptL1KreditTable');
  if (tbody) {
    let html = '';
    if (S.ebupotEntries.length === 0) {
      html = '<tr><td colspan="4" style="padding: 12px 8px; color: #666; font-style: italic;">Tidak ada data pemungutan PPh 22</td></tr>';
    } else {
      S.ebupotEntries.forEach(entry => {
        html += `<tr style="border-bottom: 1px solid #333;">
            <td style="padding: 12px 8px; color: #fff;">` + entry.pemotong + `</td>
            <td style="padding: 12px 8px; color: #ccc;">` + entry.ntpn + `</td>
            <td style="padding: 12px 8px; color: #ccc;">` + entry.masa + `</td>
            <td style="padding: 12px 8px; text-align: right; color: #fff;">` + FMTC(entry.pph) + `</td>
          </tr>`;
      });
    }
    tbody.innerHTML = html;
  }
  
  if (S.sptSubmitted) {
    const bannerTitle = document.querySelector('#sptKonsepPage h2');
    if (bannerTitle) bannerTitle.textContent = 'SPT Berhasil Dilaporkan';
    const bannerBox = bannerTitle.parentElement;
    if (bannerBox) {
        bannerBox.style.background = '#16a34a';
        bannerTitle.style.color = 'white';
        bannerBox.querySelector('i').style.color = 'white';
    }
    const btnBuat = document.querySelector('#sptKonsepPage button');
    if (btnBuat) btnBuat.style.display = 'none';
  }
}

window.switchSptTab = function(tabName) {
    document.getElementById('tabInduk').style.color = '#888';
    document.getElementById('tabInduk').style.borderBottomColor = 'transparent';
    document.getElementById('tabL1').style.color = '#888';
    document.getElementById('tabL1').style.borderBottomColor = 'transparent';
    
    document.getElementById('contentInduk').style.display = 'none';
    document.getElementById('contentL1').style.display = 'none';
    
    const activeTab = document.getElementById('tab' + tabName);
    activeTab.style.color = '#ffd600';
    activeTab.style.borderBottomColor = '#ffd600';
    
    document.getElementById('content' + tabName).style.display = 'block';
};

window.submitSpt = function() {
    window.eOmzetState.sptSubmitted = true;
    if (typeof window.showToast === 'function') {
        window.showToast('<i class="fa-solid fa-paper-plane" style="margin-right:8px;"></i> SPT Berhasil Dilaporkan!', 'success');
    }
    document.getElementById('sptKonsepPage').style.display = 'block';
    document.getElementById('sptFormPage').style.display = 'none';
    
    // Update Konsep Page UI to show submitted state
    const bannerTitle = document.querySelector('#sptKonsepPage h2');
    if (bannerTitle) bannerTitle.textContent = 'SPT Berhasil Dilaporkan';
    const bannerBox = bannerTitle.parentElement;
    if (bannerBox) {
        bannerBox.style.background = '#16a34a';
        bannerTitle.style.color = 'white';
        bannerBox.querySelector('i').style.color = 'white';
    }
    
    const btnBuat = document.querySelector('#sptKonsepPage button');
    if (btnBuat) btnBuat.style.display = 'none';
    
    renderAll();
};

// ============================================================
// MARKETPLACE SIMULATOR LOGIC
// ============================================================
window.currentSimApp = null; 

window.openSimApp = function(index) {
  const p = window.eOmzetState.connectedPlatforms[index];
  if (p.status === 'Menunggu Pemutusan') return;
  window.currentSimApp = index;
  renderAll();
};

window.closeSimApp = function() {
  window.currentSimApp = null;
  const overlay = document.getElementById('simAppProfile');
  if (overlay) overlay.style.display = 'none';
  renderAll();
};

window.toggleSimProfile = function() {
  const overlay = document.getElementById('simAppProfile');
  if (overlay) {
    if (overlay.style.display === 'none' || overlay.style.display === '') {
      overlay.style.display = 'flex';
    } else {
      overlay.style.display = 'none';
    }
  }
};

window.simTambahPenjualan = function() {
  if (window.currentSimApp === null) return;
  const p = window.eOmzetState.connectedPlatforms[window.currentSimApp];
  if (p) {
    addTransaction(p);
  }
};

window.simRetur = function(txId) {
  const S = window.eOmzetState;
  const tx = S.transactions.find(t => t.id === txId);
  if (tx && !tx.isRefunded) {
    tx.isRefunded = true;
    if (tx.pph22 > 0) {
      const bupotIndex = S.ebupotEntries.findIndex(e => e.dpp === tx.net && e.pph === tx.pph22);
      if (bupotIndex !== -1) {
        S.ebupotEntries.splice(bupotIndex, 1);
      }
    }
    if (typeof window.showToast === 'function') {
      window.showToast('Transaksi berhasil diretur. PPh 22 dibatalkan (jika ada).', 'warning');
    }
    renderAll();
  }
};

window.promptRemovePlatform = function(index) {
  window.platformToRemoveIndex = index;
  document.getElementById('modalPutusIntegrasi').style.display = 'flex';
};

function renderSimulator() {
  const S = window.eOmzetState;
  const C = getComputedState();
  const screenHome = document.getElementById('simHomescreen');
  const screenApp = document.getElementById('simAppView');
  const grid = document.getElementById('simAppGrid');
  
  if (!screenHome || !screenApp || !grid) return;

  const iconUrls = {
    'shopee': 'img/shopee.png',
    'tokopedia': 'img/tokopedia.png',
    'tiktok': 'https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg',
    'blibli': 'img/blibli.png',
    'lazada': 'img/lazada.png'
  };

  if (window.currentSimApp === null) {
    screenHome.style.display = 'flex';
    screenApp.style.display = 'none';
    
    let html = '';
    if (S.connectedPlatforms.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: white; font-size: 12px; margin-top: 20px;">Belum ada aplikasi toko.</div>';
    } else {
      S.connectedPlatforms.forEach((p, i) => {
        const logo = iconUrls[p.platform] || 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/128px-React-icon.svg.png';
        const isPending = p.status === 'Menunggu Pemutusan';
        const opacity = isPending ? '0.5' : '1';
        const clickHandler = isPending ? `onclick="window.showToast('Aplikasi tidak dapat dibuka (Menunggu Pemutusan)', 'error')"` : `onclick="window.openSimApp(${i})"`;
        
        html += `
        <div class="sim-app-icon" ${clickHandler} style="display: flex; flex-direction: column; align-items: center; cursor: pointer; gap: 8px; opacity: ${opacity};">
          <div style="width: 50px; height: 50px; background: white; border-radius: 12px; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
              <img src="${logo}" style="width: 32px; height: 32px; object-fit: contain; mix-blend-mode: multiply;">
          </div>
          <span style="color: white; font-size: 11px; text-shadow: 0 1px 2px rgba(0,0,0,0.8); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60px;">${p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}</span>
        </div>`;
      });
      grid.innerHTML = html;
    }
  } else {
    screenHome.style.display = 'none';
    screenApp.style.display = 'flex';
    
    const p = S.connectedPlatforms[window.currentSimApp];
    if (!p) {
      window.closeSimApp();
      return;
    }
    
    document.getElementById('simAppLogo').src = iconUrls[p.platform] || '';
    document.getElementById('simAppTitle').textContent = p.shopName;
    
    const platformTxs = S.transactions.filter(t => t.platform === p.platform);
    const saldo = platformTxs.filter(t => !t.isRefunded).reduce((sum, t) => sum + (t.net - t.pph22), 0);
    document.getElementById('simAppSaldo').textContent = FMTC(saldo);
    
    const btnTambah = document.getElementById('btnSimTambahPenghasilan');
    if (btnTambah) btnTambah.onclick = () => addTransaction(p);
    
    const txList = document.getElementById('simAppTxList');
    if (txList) {
      let txHtml = '';
      if (platformTxs.length === 0) {
        txHtml = '<div style="text-align: center; color: #888; font-size: 12px; padding: 20px;">Belum ada transaksi.</div>';
      } else {
        [...platformTxs].reverse().forEach(t => {
          if (t.isRefunded) {
             txHtml += `
             <div style="background: #fff; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; opacity: 0.6; margin-bottom: 8px;">
                 <div>
                     <div style="font-size: 11px; color: #999; margin-bottom: 4px;">${t.date}</div>
                     <div style="font-weight: 700; font-size: 13px; color: #dc2626; text-decoration: line-through;">+ ${FMTC(t.kotor)}</div>
                     <div style="font-size: 11px; color: #ef4444; font-weight: bold; margin-top: 4px;">DIRETUR</div>
                 </div>
             </div>`;
          } else {
             txHtml += `
             <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                 <div>
                     <div style="font-size: 11px; color: #888; margin-bottom: 4px;">${t.date}</div>
                     <div style="font-weight: 700; font-size: 13px; color: #16a34a;">+ ${FMTC(t.kotor)}</div>
                     ${t.pph22 > 0 ? `<div style="font-size: 10px; color: #dc2626; margin-top: 4px;">Dipungut PPh: -${FMTC(t.pph22)}</div>` : ''}
                 </div>
                 <button onclick="window.simRetur(${t.id})" style="background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">Retur</button>
             </div>`;
          }
        });
      }
      txList.innerHTML = txHtml;
    }
    
    const profileOverlay = document.getElementById('simAppProfile');
    if (profileOverlay) {
        document.getElementById('simProfileShopName').textContent = p.shopName;
        document.getElementById('simProfileSellerId').textContent = p.sellerId;
        document.getElementById('simProfileAvatar').textContent = p.shopName.charAt(0).toUpperCase();
        
        const profileStatus = document.getElementById('simProfileStatus');
        const pungutanStatus = document.getElementById('simProfilePungutan');
        
        if (p.status === 'Menunggu Pemutusan') {
            profileStatus.innerHTML = '<i class="fa-solid fa-clock"></i> Menunggu Pemutusan';
            profileStatus.style.color = 'var(--nav-orange)';
            if (pungutanStatus) {
              pungutanStatus.innerHTML = '<i class="fa-solid fa-circle-stop"></i> Pemungutan Dihentikan';
              pungutanStatus.style.color = '#94a3b8';
            }
        } else {
            profileStatus.innerHTML = '<i class="fa-solid fa-check-circle"></i> Terhubung dengan Coretax';
            profileStatus.style.color = '#16a34a';
            if (pungutanStatus) {
              if (C.totalNet > window.eOmzetState.BATAS_NET) {
                pungutanStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Aktif Dipungut (Omzet > 500Jt)';
                pungutanStatus.style.color = '#dc2626';
              } else {
                pungutanStatus.innerHTML = '<i class="fa-solid fa-shield"></i> Bebas (Kumulatif < 500Jt)';
                pungutanStatus.style.color = '#16a34a';
              }
            }
        }
    }
  }
}

function renderManajemenMarketplace() {
  const tbody = document.getElementById('mpTbody');
  if (!tbody) return;
  const S = window.eOmzetState;
  
  if (S.connectedPlatforms.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding: 32px 16px; text-align: center; color: var(--text-muted); font-style: italic;">Belum ada platform marketplace yang terhubung.</td></tr>`;
  } else {
    let html = '';
    const iconMap = { 
      'shopee': '<i class="fa-solid fa-store" style="color: #ee4d2d; margin-right: 8px;"></i> Shopee', 
      'tokopedia': '<i class="fa-solid fa-bag-shopping" style="color: #42b549; margin-right: 8px;"></i> Tokopedia', 
      'tiktok': '<i class="fa-brands fa-tiktok" style="color: #000; margin-right: 8px;"></i> TikTok Shop', 
      'blibli': '<i class="fa-solid fa-cart-shopping" style="color: #0085FF; margin-right: 8px;"></i> Blibli', 
      'lazada': '<i class="fa-solid fa-heart" style="color: #0F136D; margin-right: 8px;"></i> Lazada' 
    };
    
    S.connectedPlatforms.forEach((p, i) => {
      const platformDisplay = iconMap[p.platform] || p.platform;
      const currentStatus = p.status || 'Terhubung';
      
      let statusBadge = '';
      let actionBtn = '';
      
      if (currentStatus === 'Terhubung') {
          statusBadge = `<span style="background-color: rgba(74, 222, 128, 0.1); color: var(--nav-green); padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700;"><i class="fa-solid fa-check" style="margin-right: 4px;"></i> Terhubung</span>`;
          actionBtn = `<button class="btn-coretax" onclick="window.promptRemovePlatform(${i})" style="background: transparent; border: 1px solid var(--border-color); color: var(--nav-red); padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;"><i class="fa-solid fa-link-slash"></i> Putus</button>`;
      } else if (currentStatus === 'Menunggu Pemutusan') {
          statusBadge = `<span style="background-color: rgba(251, 146, 60, 0.1); color: var(--nav-orange); padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700;"><i class="fa-solid fa-clock" style="margin-right: 4px;"></i> Menunggu Pemutusan</span>`;
          actionBtn = `<button class="btn-coretax" disabled style="background: transparent; border: 1px solid var(--border-light); color: var(--text-muted); padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: not-allowed;"><i class="fa-solid fa-hourglass-half"></i> Proses</button>`;
      }

      html += `<tr style="border-bottom: 1px solid var(--border-light);">
        <td style="padding: 16px; font-weight: 600; color: var(--text-primary);">${platformDisplay}</td>
        <td style="padding: 16px; color: var(--text-secondary);">${p.shopName}</td>
        <td style="padding: 16px; color: var(--text-secondary);">${p.sellerId}</td>
        <td style="padding: 16px;">${statusBadge}</td>
        <td style="padding: 16px; text-align: center;">${actionBtn}</td>
      </tr>`;
    });
    tbody.innerHTML = html;
  }
}











