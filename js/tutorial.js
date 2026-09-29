(function() {
    // Inject tutorial CSS
    const style = document.createElement('style');
    style.innerHTML = `
        .tut-overlay-panel {
            position: fixed;
            background: rgba(10, 12, 26, 0.85); /* Darker, slightly blueish matching theme */
            z-index: 9998;
            transition: all 0.3s ease;
            pointer-events: auto;
        }
        #tut-hole-border {
            position: fixed;
            z-index: 9999;
            pointer-events: none;
            border: 2px solid #eab308;
            border-radius: 6px;
            box-shadow: 0 0 0 1px rgba(234, 179, 8, 0.2), 0 0 15px rgba(234, 179, 8, 0.4);
            transition: all 0.3s ease;
            display: none;
        }
        #tut-tooltip {
            position: fixed;
            z-index: 10000;
            background: #151528; /* Coretax secondary dark */
            border: 1px solid #353855;
            border-left: 4px solid #eab308; /* Gold accent */
            color: #ffffff;
            padding: 16px 20px;
            border-radius: 8px;
            max-width: 300px;
            font-size: 14px;
            font-weight: 500;
            line-height: 1.5;
            box-shadow: 0 10px 25px rgba(0,0,0,0.6);
            display: none;
            pointer-events: none;
            transition: opacity 0.3s ease, transform 0.3s ease;
            opacity: 0;
            transform: translateY(10px);
        }
    `;
    document.head.appendChild(style);

    // Create 4 blocking panels
    const dTop = document.createElement('div');
    const dBottom = document.createElement('div');
    const dLeft = document.createElement('div');
    const dRight = document.createElement('div');
    const panels = [dTop, dBottom, dLeft, dRight];
    
    panels.forEach(p => {
        p.className = 'tut-overlay-panel';
        p.style.display = 'none';
        document.body.appendChild(p);
    });

    const dHole = document.createElement('div');
    dHole.id = 'tut-hole-border';
    document.body.appendChild(dHole);

    const tooltip = document.createElement('div');
    tooltip.id = 'tut-tooltip';
    document.body.appendChild(tooltip);

        const steps = [
        {
            target: 'tutNavEOmzet',
            text: "Ini 3 fitur utama E-Omzet. Silakan klik menu E-Omzet."
        },
        {
            target: 'tutNavManajemen',
            text: "Pertama, Manajemen Marketplace. Ini untuk menghubungkan akun toko online Anda dengan Coretax secara real-time.<br><br>Klik Manajemen Marketplace.",
            delayNext: 2000 // Wait 3.5s before moving to next step so user can see the UI
        },
        {
            target: 'tutNavEOmzet',
            text: "Buka kembali menu E-Omzet."
        },
        {
            target: 'tutNavTracking',
            text: "Kedua, Tracking Omzet. Fitur ini memantau dan mengirim sinyal otomatis jika omzet Anda menembus batas bebas pajak Rp 500 Juta.<br><br>Klik Tracking Omzet.",
            delayNext: 2000
        },
        {
            target: 'tutNavEOmzet',
            text: "Terakhir, buka kembali menu E-Omzet."
        },
        {
            target: 'tutNavRincian',
            text: "Ketiga, Rincian Transaksi. Setiap transaksi akan terekam secara otomatis di sini.<br><br>Klik Rincian Transaksi.",
            delayNext: 2000
        },
        {
            target: 'simulatorToggle',
            text: "Mari kita simulasikan transaksi! Buka HP dengan mengklik tab <b>SIMULASI API</b> di sebelah kanan layar."
        },
                {
            target: 'mobileSimulator',
            waitForAppClick: true,
            text: "Ini layar HP simulasi Anda.<br><br>Klik Shopee (atau aplikasi apa saja) untuk memulai."
        },
        {
            target: 'simBtnTambah',
            text: "Klik Tambah Penghasilan untuk menambah omzet sebesar Rp 100 Juta."
        },
        {
            target: 'simBtnTambah',
            text: "Lagi!"
        },
        {
            target: 'simBtnTambah',
            text: "Terus!"
        },
        {
            target: 'simBtnTambah',
            text: "Lanjutkan kliknya!"
        },
        {
            target: 'simBtnTambah',
            text: "Lagi!"
        },
        {
            target: 'simBtnTambah',
            text: "Satu kali lagi! Omzet ke-6 ini (Rp 600 Juta) akan menembus batas dan otomatis dipungut PPh 22 0,5%!"
        },
        {
            target: 'closeSimulator',
            text: "Mantap! Pungutan berhasil dilakukan otomatis.<br><br>Silakan tutup HP dengan menekan tombol silang (X) di pojok kiri atas."
        },
        {
            target: 'btnLaporkan',
            text: "Data transaksi dan pemungutan pajak sudah terekam.<br><br>Sekarang klik tombol Laporkan."
        },
        {
            target: 'tutNavSPT',
            text: "Sekarang klik menu SPT."
        },
        {
            target: 'tutNavSPTMasa',
            text: "Klik Surat Pemberitahuan (SPT)."
        },
        {
            target: 'tutBtnLanjutkan',
            text: "Klik tombol Lanjutkan pada Konsep SPT Anda."
        },
        {
            target: 'sptFormPage',
            text: "Tutorial selesai!<br><br>Seluruh laporan tadi sudah otomatis masuk ke SPT, menghitung pajak terutang, dan siap dilaporkan.<br><br>Klik di mana saja untuk mengakhiri."
        }
    ];

    let currentStep = 0;
    let clickHandler = null;

    function showStep(index) {
        if (index >= steps.length) {
            endTutorial();
            return;
        }

        // Close dropdowns aggressively between certain steps if needed to reset state cleanly
        // (Native clicks handle most of this, but just in case we need a clean slate)
        if (index === 2 || index === 13) {
            document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
        }

        const step = steps[index];
        let el = document.getElementById(step.target);

        

        if (!el || el.offsetHeight === 0 || el.offsetWidth === 0) {
            // Wait for element to become visible (CSS transitions/renders)
            setTimeout(() => showStep(index), 100);
            return;
        }

        const rect = el.getBoundingClientRect();
        
        // Pad the highlight hole
        let pad = 6;
        if (step.target === 'tutNavEOmzet' || step.target === 'tutNavSPT') pad = 0; // Nav items look better tight
        
        const top = rect.top - pad;
        const left = rect.left - pad;
        const width = rect.width + (pad * 2);
        const height = rect.height + (pad * 2);
        const bottom = top + height;
        const right = left + width;

        // Position overlays
        panels.forEach(p => p.style.display = 'block');
        dHole.style.display = 'block';

        dTop.style.top = '0';
        dTop.style.left = '0';
        dTop.style.width = '100%';
        dTop.style.height = top + 'px';

        dBottom.style.top = bottom + 'px';
        dBottom.style.left = '0';
        dBottom.style.width = '100%';
        dBottom.style.height = `calc(100vh - ${bottom}px)`;

        dLeft.style.top = top + 'px';
        dLeft.style.left = '0';
        dLeft.style.width = left + 'px';
        dLeft.style.height = height + 'px';

        dRight.style.top = top + 'px';
        dRight.style.left = right + 'px';
        dRight.style.width = `calc(100vw - ${right}px)`;
        dRight.style.height = height + 'px';

        dHole.style.top = top + 'px';
        dHole.style.left = left + 'px';
        dHole.style.width = width + 'px';
        dHole.style.height = height + 'px';

        // Ensure hole border radius matches target roughly
        const computedStyle = window.getComputedStyle(el);
        dHole.style.borderRadius = computedStyle.borderRadius === '0px' ? '6px' : computedStyle.borderRadius;

        // Position tooltip
        tooltip.innerHTML = step.text;
        tooltip.style.display = 'block';
        
        // Force reflow for transitions
        void tooltip.offsetWidth;
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateY(0)';

        let tooltipTop = bottom + 12;
        let tooltipLeft = left;

        // Smart positioning
        if (tooltipTop + 150 > window.innerHeight) {
            tooltipTop = top - 12 - tooltip.offsetHeight; // Above
            if (tooltipTop < 10) tooltipTop = 10;
        }
        if (tooltipLeft + 300 > window.innerWidth) {
            tooltipLeft = window.innerWidth - 320; // Keep on screen
        }

        tooltip.style.top = tooltipTop + 'px';
        tooltip.style.left = tooltipLeft + 'px';

        // Attach native click listener to the real element
        if (clickHandler) {
            el.removeEventListener('click', clickHandler);
        }

                                clickHandler = (e) => {
            // Custom condition to wait for app click
            if (step.waitForAppClick && !e.target.closest('.sim-app-icon')) {
                return; 
            }

            el.removeEventListener('click', clickHandler);
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(10px)';
            currentStep++;
            const delay = step.delayNext ? step.delayNext : 400;
            
            if (delay > 400) {
                dHole.style.opacity = '0';
                panels.forEach(p => p.style.opacity = '0');
                setTimeout(() => {
                    dHole.style.opacity = '1';
                    panels.forEach(p => p.style.opacity = '1');
                    showStep(currentStep);
                }, delay);
            } else {
                setTimeout(() => showStep(currentStep), delay);
            }
        };

        el.addEventListener('click', clickHandler);
    }

    function endTutorial() {
        panels.forEach(p => p.style.display = 'none');
        dHole.style.display = 'none';
        tooltip.style.display = 'none';
        if (typeof window.showToast === 'function') {
            window.showToast('<i class="fa-solid fa-flag-checkered" style="margin-right:8px;"></i> Simulasi Juri Selesai', 'success');
        }
    }

    // Auto Start Initialization
    window.addEventListener('load', () => {
        // Reset app state
        window.showView('viewDashboard');
        window.closeSimApp();
        if (window.eOmzetState) {
            window.eOmzetState.transactions = [];
            window.eOmzetState.ebupotEntries = [];
            window.eOmzetState.sptReported = false;
        }
        if (typeof window.renderAll === 'function') window.renderAll();
        document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = '');

        // Remove old trigger button if exists
        const oldBtn = document.getElementById('tutBtnMulai');
        if (oldBtn) oldBtn.remove();

        // Start 
        setTimeout(() => showStep(0), 1000);
    });

})();









