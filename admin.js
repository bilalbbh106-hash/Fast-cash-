const ADMIN_PASSWORD = '2009bb2009';
let currentEditingId = null;

// التحقق من كلمة المرور
function checkAdminAuth() {
    const isAuthenticated = sessionStorage.getItem('fastcash_admin_auth') === 'true';
    
    if (!isAuthenticated) {
        const password = prompt('أدخل كلمة مرور الأدمن:');
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('fastcash_admin_auth', 'true');
            return true;
        } else {
            alert('كلمة المرور غير صحيحة!');
            window.location.href = 'index.html';
            return false;
        }
    }
    return true;
}

// تهيئة لوحة التحكم
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAdminAuth()) return;
    
    try {
        await loadOffersList();
        await loadWithdrawalList();
        await loadAdsList();
        await loadUsersList();
        
        setupAdminEventListeners();
        setupImagePreviews();
        
    } catch (error) {
        console.error('Error initializing admin:', error);
    }
});

function switchTab(tabName) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // إظهار التبويب المحدد
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
}

async function loadOffersList() {
    try {
        const offers = await Database.getOffers();
        const container = document.getElementById('offersList');
        
        container.innerHTML = offers.map(offer => `
            <div class="item-card">
                <div>
                    <h4>${offer.title}</h4>
                    <p>${offer.points} نقطة - تأخير: ${offer.delay_hours || 0} ساعة</p>
                </div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="editOffer('${offer.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteOffer('${offer.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading offers list:', error);
    }
}

async function loadWithdrawalList() {
    try {
        const items = await Database.getWithdrawalItems();
        const container = document.getElementById('withdrawalList');
        
        container.innerHTML = items.map(item => `
            <div class="item-card">
                <div>
                    <h4>${item.title}</h4>
                    <p>${item.points_required} نقطة - ${item.type}</p>
                </div>
                <div class="item-actions">
                    <button class="delete-btn" onclick="deleteWithdrawalItem('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading withdrawal list:', error);
    }
}

async function loadAdsList() {
    try {
        const ads = await Database.getAds();
        const container = document.getElementById('adsList');
        
        container.innerHTML = ads.map(ad => `
            <div class="item-card">
                <div>
                    <h4>${ad.title}</h4>
                    <p>${ad.points} نقطة</p>
                </div>
                <div class="item-actions">
                    <button class="delete-btn" onclick="deleteAd('${ad.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading ads list:', error);
    }
}

async function loadUsersList() {
    try {
        const { data: users, error } = await supabaseClient
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('usersList');
        container.innerHTML = (users || []).map(user => `
            <div class="item-card">
                <div>
                    <h4>${user.id}</h4>
                    <p>النقاط: ${user.points || 0}</p>
                    <small>${new Date(user.created_at).toLocaleDateString('ar-SA')}</small>
                </div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="editUserPoints('${user.id}', ${user.points || 0})">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading users list:', error);
    }
}

function setupAdminEventListeners() {
    // نموذج إضافة عرض
    document.getElementById('offerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const imageFile = document.getElementById('offerImage').files[0];
        const title = document.getElementById('offerTitle').value;
        const description = document.getElementById('offerDescription').value;
        const link = document.getElementById('offerLink').value;
        const points = parseInt(document.getElementById('offerPoints').value);
        const delay = parseInt(document.getElementById('offerDelay').value);
        
        try {
            let imageUrl = '';
            if (imageFile) {
                imageUrl = await Database.uploadImage(imageFile, 'offers');
            }
            
            await Database.addOffer({
                title,
                description,
                image_url: imageUrl,
                link: link || null,
                points,
                delay_hours: delay,
                created_at: new Date().toISOString()
            });
            
            alert('تم إضافة العرض بنجاح!');
            document.getElementById('offerForm').reset();
            document.getElementById('offerImagePreview').style.display = 'none';
            await loadOffersList();
            
        } catch (error) {
            console.error('Error adding offer:', error);
            alert('حدث خطأ أثناء إضافة العرض');
        }
    });
    
    // نموذج إضافة عنصر سحب
    document.getElementById('withdrawalForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const imageFile = document.getElementById('withdrawalImage').files[0];
        const title = document.getElementById('withdrawalTitle').value;
        const description = document.getElementById('withdrawalDescription').value;
        const points = parseInt(document.getElementById('withdrawalPoints').value);
        const type = document.getElementById('withdrawalType').value;
        
        try {
            let imageUrl = '';
            if (imageFile) {
                imageUrl = await Database.uploadImage(imageFile, 'withdrawal');
            }
            
            await Database.addWithdrawalItem({
                title,
                description,
                image_url: imageUrl,
                points_required: points,
                type,
                created_at: new Date().toISOString()
            });
            
            alert('تم إضافة عنصر السحب بنجاح!');
            document.getElementById('withdrawalForm').reset();
            document.getElementById('withdrawalImagePreview').style.display = 'none';
            await loadWithdrawalList();
            
        } catch (error) {
            console.error('Error adding withdrawal item:', error);
            alert('حدث خطأ أثناء إضافة عنصر السحب');
        }
    });
    
    // نموذج إضافة إعلان
    document.getElementById('adForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const imageFile = document.getElementById('adImage').files[0];
        const title = document.getElementById('adTitle').value;
        const description = document.getElementById('adDescription').value;
        const link = document.getElementById('adLink').value;
        const points = parseInt(document.getElementById('adPoints').value);
        
        try {
            let imageUrl = '';
            if (imageFile) {
                imageUrl = await Database.uploadImage(imageFile, 'ads');
            }
            
            await Database.addAd({
                title,
                description,
                image_url: imageUrl,
                link,
                points,
                created_at: new Date().toISOString()
            });
            
            alert('تم إضافة الإعلان بنجاح!');
            document.getElementById('adForm').reset();
            document.getElementById('adImagePreview').style.display = 'none';
            await loadAdsList();
            
        } catch (error) {
            console.error('Error adding ad:', error);
            alert('حدث خطأ أثناء إضافة الإعلان');
        }
    });
    
    // بحث المستخدمين
    document.getElementById('searchUser').addEventListener('input', async (e) => {
        // يمكن إضافة منطق البحث هنا
    });
}

function setupImagePreviews() {
    // معاينة صورة العرض
    document.getElementById('offerImage').addEventListener('change', function(e) {
        const preview = document.getElementById('offerImagePreview');
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    // معاينة صورة السحب
    document.getElementById('withdrawalImage').addEventListener('change', function(e) {
        const preview = document.getElementById('withdrawalImagePreview');
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    // معاينة صورة الإعلان
    document.getElementById('adImage').addEventListener('change', function(e) {
        const preview = document.getElementById('adImagePreview');
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
            reader.readAsDataURL(this.files[0]);
        }
    });
}

async function deleteOffer(offerId) {
    if (confirm('هل أنت متأكد من حذف هذا العرض؟')) {
        try {
            await Database.deleteOffer(offerId);
            alert('تم حذف العرض بنجاح');
            await loadOffersList();
        } catch (error) {
            console.error('Error deleting offer:', error);
            alert('حدث خطأ أثناء حذف العرض');
        }
    }
}

async function deleteWithdrawalItem(itemId) {
    if (confirm('هل أنت متأكد من حذف عنصر السحب هذا؟')) {
        try {
            const { error } = await supabaseClient
                .from('withdrawal_items')
                .delete()
                .eq('id', itemId);
            
            if (error) throw error;
            
            alert('تم حذف عنصر السحب بنجاح');
            await loadWithdrawalList();
        } catch (error) {
            console.error('Error deleting withdrawal item:', error);
            alert('حدث خطأ أثناء حذف عنصر السحب');
        }
    }
}

async function deleteAd(adId) {
    if (confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
        try {
            const { error } = await supabaseClient
                .from('ads')
                .delete()
                .eq('id', adId);
            
            if (error) throw error;
            
            alert('تم حذف الإعلان بنجاح');
            await loadAdsList();
        } catch (error) {
            console.error('Error deleting ad:', error);
            alert('حدث خطأ أثناء حذف الإعلان');
        }
    }
}

function editUserPoints(userId, currentPoints) {
    const newPoints = prompt(`أدخل عدد النقاط الجديد للمستخدم (الحالي: ${currentPoints}):`, currentPoints);
    
    if (newPoints && !isNaN(newPoints)) {
        Database.updateUserPoints(userId, parseInt(newPoints))
            .then(() => {
                alert('تم تحديث نقاط المستخدم');
                loadUsersList();
            })
            .catch(error => {
                console.error('Error updating user points:', error);
                alert('حدث خطأ أثناء تحديث النقاط');
            });
    }
}
