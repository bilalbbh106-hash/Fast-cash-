Enter// تهيئة Supabase
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// وظائف إدارة البيانات
const Database = {
    // الحصول على العروض
    async getOffers() {
        const { data, error } = await supabase
            .from('offers')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    },
    
    // الحصول على عناصر السحب
    async getWithdrawalItems() {
        const { data, error } = await supabase
            .from('withdrawal_items')
            .select('*')
            .order('points_required');
        
        if (error) throw error;
        return data || [];
    },
    
    // الحصول على الإعلانات
    async getAds() {
        const { data, error } = await supabase
            .from('ads')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    },
    
    // الحصول على معلومات المستخدم
    async getUser(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },
    
    // إنشاء مستخدم جديد
    async createUser(userData) {
        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    // تحديث نقاط المستخدم
    async updateUserPoints(userId, points) {
        const { data, error } = await supabase
            .from('users')
            .update({ points: points })
            .eq('id', userId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    // إضافة سجل نشاط
    async addActivity(userId, activity) {
        const { data, error } = await supabase
            .from('activities')
            .insert([{
                user_id: userId,
                activity: activity,
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        return data;
    },
    
    // رفع صورة
    async uploadImage(file, folder) {
        const fileName = `${folder}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
            .from('fastcash-images')
            .upload(fileName, file);
        
        if (error) throw error;
        
        // الحصول على رابط عام للصورة
        const { data: { publicUrl } } = supabase.storage
            .from('fastcash-images')
            .getPublicUrl(fileName);
        
        return publicUrl;
    },
    
    // إضافة عرض جديد
    async addOffer(offerData) {
        const { data, error } = await supabase
            .from('offers')
            .insert([offerData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    // حذف عرض
    async deleteOffer(offerId) {
        const { error } = await supabase
            .from('offers')
            .delete()
            .eq('id', offerId);
        
        if (error) throw error;
    },
    
    // إضافة عنصر سحب
    async addWithdrawalItem(itemData) {
        const { data, error } = await supabase
            .from('withdrawal_items')
            .insert([itemData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    // إضافة إعلان
    async addAd(adData) {
        const { data, error } = await supabase
            .from('ads')
            .insert([adData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
};

// وظائف إدارة المستخدم المحلي
const UserManager = {
    getUserId() {
        let userId = localStorage.getItem('fastcash_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('fastcash_user_id', userId);
            
            // إنشاء مستخدم جديد في قاعدة البيانات
            Database.createUser({
                id: userId,
                points: 100, // نقاط بداية
                created_at: new Date().toISOString()
            }).catch(console.error);
        }
        return userId;
    },
    
    getUserPoints() {
        return parseInt(localStorage.getItem('fastcash_points') || '100');
    },
    
    updatePoints(points) {
        localStorage.setItem('fastcash_points', points.toString());
        const userId = this.getUserId();
        
        // تحديث النقاط في قاعدة البيانات
        Database.updateUserPoints(userId, points).catch(console.error);
        
        // تحديث الواجهة
        document.getElementById('userPoints').textContent = points;
    },
    
    addPoints(amount) {
        const current = this.getUserPoints();
        this.updatePoints(current + amount);
        
        // إضافة نشاط
        const userId = this.getUserId();
        Database.addActivity(userId, `كسب ${amount} نقطة`).catch(console.error);
    }
};

// تصدير المتغيرات للاستخدام في ملفات أخرى
window.Database = Database;
window.UserManager = UserManager;
window.supabaseClient = supabase;
