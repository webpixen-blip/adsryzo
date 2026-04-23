(function() {
    const API_URL = window.location.origin + '/api/get-ad'; // Fallback for local testing, update to full URL for production
    const SESSION_KEY = 'ad_session_progress';
    const VIEW_SYNC_URL = window.location.origin + '/api/update';

    async function initAdServer() {
        try {
            const response = await fetch(API_URL);
            const { ads, settings } = await response.json();
            
            if (!ads || ads.length === 0) return;

            const progress = loadProgress();
            startAdLoop(ads, settings, progress);
        } catch (e) {
            console.error('AdServer Initialization Failed', e);
        }
    }

    function loadProgress() {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            // Check if session expired
            if (Date.now() - data.startTime > 3600000) { // 1 hour default
                return resetProgress();
            }
            return data;
        }
        return resetProgress();
    }

    function resetProgress() {
        const data = { startTime: Date.now(), index: 0, lastShown: 0 };
        saveProgress(data);
        return data;
    }

    function saveProgress(data) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    }

    function startAdLoop(ads, settings, progress) {
        const delays = settings.progressiveDelays || [5, 12, 24];
        
        const check = () => {
            const elapsed = (Date.now() - progress.startTime) / 1000;
            const nextAdIndex = progress.index;
            
            if (nextAdIndex < ads.length) {
                const requiredDelay = delays[nextAdIndex] || delays[delays.length - 1];
                
                if (elapsed >= requiredDelay && (Date.now() - progress.lastShown > 5000)) {
                    showAd(ads[nextAdIndex]);
                    progress.index++;
                    progress.lastShown = Date.now();
                    saveProgress(progress);
                }
            }
            setTimeout(check, 1000);
        };
        check();
    }

    function showAd(ad) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);backdrop-filter:blur(10px);z-index:999999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.5s ease;pointer-events:all;padding:20px;';
        
        const card = document.createElement('div');
        card.style.cssText = 'background:rgba(255,255,255,0.9);border-radius:24px;padding:24px;max-width:500px;width:100%;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);position:relative;transform:scale(0.9);transition:transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);';

        const closeBtn = document.createElement('button');
        let countdown = 5;
        closeBtn.disabled = true;
        closeBtn.innerHTML = `Wait ${countdown}s`;
        closeBtn.style.cssText = 'position:absolute;top:-15px;right:-15px;width:80px;height:40px;background:#4f46e5;color:white;border:none;border-radius:12px;font-weight:bold;cursor:not-allowed;opacity:0.7;font-size:12px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);';

        const content = document.createElement('div');
        if (ad.type === 'custom') {
            content.innerHTML = `<a href="${ad.targetUrl}" target="_blank"><img src="${ad.imageUrl}" style="width:100%;border-radius:16px;display:block;"></a>`;
        } else {
            // For network codes
            content.innerHTML = ad.code;
        }

        card.appendChild(closeBtn);
        card.appendChild(content);
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        // Animation logic
        setTimeout(() => {
            overlay.style.opacity = '1';
            card.style.transform = 'scale(1)';
        }, 10);

        const timer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                closeBtn.innerHTML = `Wait ${countdown}s`;
            } else {
                clearInterval(timer);
                closeBtn.innerHTML = 'Close';
                closeBtn.disabled = false;
                closeBtn.style.cursor = 'pointer';
                closeBtn.style.opacity = '1';
                closeBtn.style.background = '#ef4444';
            }
        }, 1000);

        closeBtn.onclick = () => {
            overlay.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => overlay.remove(), 500);
        };

        // Track view
        fetch(VIEW_SYNC_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'increment_view', adId: ad.id })
        }).catch(() => {});
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdServer);
    } else {
        initAdServer();
    }
})();
