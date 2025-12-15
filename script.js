Enter// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const userId = UserManager.getUserId();
        const user = await Database.getUser(userId);
        
        if (user) {
            UserManager.updatePoints(user.points);
            document.getElementById('userName').textContent = user.name || 'مستخدم';
        } else {
            UserManager.updatePoints(100);
        }
        
        // تحميل العروض
        loadOffers();
        
        // تحميل عناصر السحب
        loadWithdrawalItems();
        
        // تحميل الإعلانات
        loadAds();
        
        // إعداد الأحداث
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

async function loadOffers() {
    try {
        const offers = await Database.getOffers();
        const container = document.getElementById('offersContainer');
        
        container.innerHTML = offers.map(offer => `
            <div class="offer-card">
                <img src="${offer.image_url}" alt="${offer.title}" class="offer-image">
                <div class="offer-content">
                    <h3 class="offer-title">${offer.title}</h3>
                    <p class="offer-description">${offer.description}</p>
                    <div class="offer-points">
                        <i class="fas fa-coins"></i>
                        <span>${offer.points} نقطة</span>
                    </div>
                    <div class="offer-actions">
                        <button class="btn-primary" onclick="claimOffer('${offer.id}', ${offer.points}, ${offer.delay_hours})">
                            احصل على النقاط
                        </button>
                        ${offer.link ? `<a href="${offer.link}" target="_blank" class="btn-secondary">زيارة الرابط</a>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading offers:', error);
    }
}

async function loadWithdrawalItems() {
    try {
        const items = await Database.getWithdrawalItems();
        const container = document.getElementById('withdrawalContainer');
        
        container.innerHTML = items.map(item => `
            <div class="withdrawal-card">
                <img src="${item.image_url}" alt="${item.title}" class="withdrawal-image">
                <div class="withdrawal-content">
                    <h3 class="withdrawal-title">${item.title}</h3>
                    <p class="withdrawal-description">${item.description}</p>
                    <div class="withdrawal-points">
                        <i class="fas fa-coins"></i>
                        <span>${item.points_required} نقطة</span>
                    </div>
                    <div class="withdrawal-actions">
                        <button class="btn-primary" onclick="withdrawItem('${item.id}', '${item.title}', ${item.points_required})">
                            سحب الآن
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading withdrawal items:', error);
    }
}

async function loadAds() {
    try {
        const ads = await Database.getAds();
        const container = document.getElementById('adsContainer');
        
        container.innerHTML = ads.map(ad => `
            <div class="ad-card">
                <img src="${ad.image_url}" alt="${ad.title}" class="ad-image">
                <div class="ad-content">
                    <h3 class="ad-title">${ad.title}</h3>
                    <p class="ad-description">${ad.description}</p>
                    <div class="ad-points">
                        <i class="fas fa-coins"></i>
                        <span>${ad.points} نقطة</span>
                    </div>
                    <div class="offer-actions">
                        <a href="${ad.link}" target="_blank" class="btn-primary">
                            شاهد الإعلان
                        </a>
                        <button class="btn-secondary" onclick="claimAdPoints('${ad.id}', ${ad.points})">
                            احصل على النقاط
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading ads:', error);
    }
}

function claimOffer(offerId, points, delayHours) {
    const key = `offer_claimed_${offerId}`;
    if (localStorage.getItem(key)) {
        alert('لقد حصلت على نقاط هذا العرض مسبقاً!');
        return;
    }
    
    if (delayHours > 0) {
        setTimeout(() => {
            UserManager.addPoints(points);
            localStorage.setItem(key, 'true');
            alert(`مبروك! حصلت على ${points} نقطة بعد ${delayHours} ساعة`);
        }, delayHours * 60 * 60 * 1000);
        
        alert(`سيتم منحك ${points} نقطة بعد ${delayHours} ساعة`);
    } else {
        UserManager.addPoints(points);
        localStorage.setItem(key, 'true');
        alert(`مبروك! حصلت على ${points} نقطة`);
    }
}

function claimAdPoints(adId, points) {
    const key = `ad_claimed_${adId}`;
    if (localStorage.getItem(key)) {
        alert('لقد حصلت على نقاط هذا الإعلان مسبقاً!');
        return;
    }
    
    UserManager.addPoints(points);
    localStorage.setItem(key, 'true');
    alert(`مبروك! حصلت على ${points} نقطة`);
}

let currentWithdrawalItem = null;

function withdrawItem(itemId, itemTitle, pointsRequired) {
    const userPoints = UserManager.getUserPoints();
    
    if (userPoints < pointsRequired) {
        alert('نقاطك غير كافية للسحب!');
        return;
    }
    
    currentWithdrawalItem = { itemId, itemTitle, pointsRequired };
    
    document.getElementById('itemPoints').textContent = pointsRequired;
    document.getElementById('currentPoints').textContent = userPoints;
    document.getElementById('withdrawModal').style.display = 'flex';
}

function confirmWithdrawal() {
    if (!currentWithdrawalItem) return;
    
    const userPoints = UserManager.getUserPoints();
    const newPoints = userPoints - currentWithdrawalItem.pointsRequired;
    
    UserManager.updatePoints(newPoints);
    
    alert(`تم سحب ${currentWithdrawalItem.itemTitle} بنجاح!\n\nيرجى مراسلتنا على فيسبوك:\nwww.facebook.com/yourpage\n\nوسنقوم بإرسال الجائزة خلال 24 ساعة`);
    
    // إضافة سجل السحب
    const userId = UserManager.getUserId();
    Database.addActivity(userId, `سحب ${currentWithdrawalItem.itemTitle} بـ${currentWithdrawalItem.pointsRequired} نقطة`)
        .catch(console.error);
    
    closeModal();
}

function closeModal() {
    document.getElementById('withdrawModal').style.display = 'none';
    document.getElementById('referralModal').style.display = 'none';
    currentWithdrawalItem = null;
}

function copyReferralLink() {
    const input = document.getElementById('referralInput');
    input.select();
    document.execCommand('copy');
    alert('تم نسخ رابط الإحالة!');
}

function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function setupEventListeners() {
    // إغلاق المودال عند النقر خارجها
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    });
    
    // إغلاق المودال عند النقر على زر الإغلاق
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // رابط الفيسبوك
    document.getElementById('facebookLink').href = 'https://facebook.com/yourpage';
}

// كشف وصول المستخدم من رابط الإحالة
function checkReferral() {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    
    if (ref) {
        // منح نقاط للمستخدم الذي قام بالإحالة
        const referrerId = ref;
        const userId = UserManager.getUserId();
        
        if (userId !== referrerId) {
            // يمكنك إضافة منطق لمنح النقاط هنا
            Database.addActivity(referrerId, `كسب 10 نقاط من إحالة مستخدم جديد`)
                .then(() => {
                    // تحديث نقاط المُحيل
                    Database.getUser(referrerId).then(user => {
                        if (user) {
                            Database.updateUserPoints(referrerId, user.points + 10);
                        }
                    });
                })
                .catch(console.error);
        }
    }
}

// تشغيل كشف الإحالة عند التحميل
setTimeout(checkReferral, 1000);
