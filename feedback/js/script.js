import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ بيانات مشروعك الحقيقية
const firebaseConfig = {
  apiKey: "AIzaSyC5UjzMRr9BOBtuBIbI6sThWtv3BI0HPzo",
  authDomain: "feedbacksoftskils.firebaseapp.com",
  projectId: "feedbacksoftskils",
  storageBucket: "feedbacksoftskils.firebasestorage.app",
  messagingSenderId: "347396669754",
  appId: "1:347396669754:web:54344c7c874b7cdb11d003"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // هذا هو المتغير الذي سنستخدمه للحفظ والقراءة

const ratings = { nps: 0, session: 0, logistics: 0 };

function setupRating(containerId, key) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const stars = container.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.dataset.value);
            ratings[key] = value;
            stars.forEach(s => {
                const starValue = parseInt(s.dataset.value);
                if (starValue <= value) {
                    s.classList.remove('fa-regular');
                    s.classList.add('fa-solid', 'active');
                } else {
                    s.classList.remove('fa-solid', 'active');
                    s.classList.add('fa-regular');
                }
            });
        });
    });
}

function setupNPS() {
    const container = document.getElementById('npsRating');
    const label = document.getElementById('npsLabel');
    if (!container) return;
    const buttons = container.querySelectorAll('.nps-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const value = parseInt(btn.dataset.value);
            ratings.nps = value;
            buttons.forEach(b => b.classList.remove('active', 'detractor', 'passive', 'promoter'));
            btn.classList.add('active');
            if (value <= 6) {
                label.textContent = '😕 لن أوصي به';
                label.style.color = '#DC2626';
                buttons.forEach(b => { if (parseInt(b.dataset.value) <= 6) b.classList.add('detractor'); });
            } else if (value <= 8) {
                label.textContent = '😐 ربما أوصي به';
                label.style.color = '#D97706';
                buttons.forEach(b => { const v = parseInt(b.dataset.value); if (v >= 7 && v <= 8) b.classList.add('passive'); });
            } else {
                label.textContent = '😊 سأوصي به بشدة!';
                label.style.color = '#059669';
                buttons.forEach(b => { if (parseInt(b.dataset.value) >= 9) b.classList.add('promoter'); });
            }
        });
    });
}

setupNPS();
setupRating('sessionRating', 'session');
setupRating('logisticsRating', 'logistics');

const sessionSelect = document.getElementById('sessionSelect');
const sessionFeedback = document.getElementById('sessionFeedback');
if (sessionSelect && sessionFeedback) {
    sessionSelect.addEventListener('change', function() {
        if (this.value !== "") {
            sessionFeedback.style.display = 'block';
            sessionFeedback.style.animation = 'popIn 0.3s ease';
        } else {
            sessionFeedback.style.display = 'none';
        }
    });
}

document.getElementById('feedbackForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (ratings.nps === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'تنبيه',
            text: 'الرجاء تقييم الملتقى بشكل عام (مدى التوصية)',
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#FDBA74',
            customClass: { popup: 'swal-custom-popup' }
        });
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> جاري الإرسال...';

    try {
        const feedback = {
            name: document.getElementById('name').value || 'مجهول',
            role: document.querySelector('input[name="role"]:checked')?.value || 'غير محدد',
            npsRating: ratings.nps,
            sessionName: sessionSelect ? sessionSelect.value : '',
            sessionRating: ratings.session,
            speakerFeedback: document.getElementById('speakerFeedback')?.value || '',
            logisticsRating: ratings.logistics,
            strengths: document.getElementById('strengths').value,
            weaknesses: document.getElementById('weaknesses').value,
            suggestions: document.getElementById('suggestions').value,
            messageToSpeakers: document.getElementById('messageToSpeakers')?.value || '',
            messageToOrganizers: document.getElementById('messageToOrganizers')?.value || '',
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, "feedback"), feedback);

        Swal.fire({
            icon: 'success',
            title: 'شكراً لمشاركتك!',
            text: 'تم استلام ملاحظاتك بنجاح. رأيك سيساعدنا على التطور!',
            confirmButtonText: 'رائع!',
            confirmButtonColor: '#A7F3D0',
            timer: 3500,
            timerProgressBar: true,
            customClass: { popup: 'swal-custom-popup' }
        });

        setTimeout(() => {
            document.getElementById('feedbackForm').reset();
            document.querySelectorAll('.star').forEach(s => {
                s.classList.remove('fa-solid', 'active');
                s.classList.add('fa-regular');
            });
            document.querySelectorAll('.nps-btn').forEach(b => {
                b.classList.remove('active', 'detractor', 'passive', 'promoter');
            });
            document.getElementById('npsLabel').textContent = '';
            if (sessionFeedback) sessionFeedback.style.display = 'none';
            ratings.nps = ratings.session = ratings.logistics = 0;
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane me-2"></i> إرسال التغذية الراجعة';
        }, 500);

    } catch (error) {
        console.error("Error:", error);
        Swal.fire({
            icon: 'error',
            title: 'حدث خطأ',
            text: 'فشل في إرسال البيانات. الرجاء المحاولة مرة أخرى.',
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#FECACA',
            customClass: { popup: 'swal-custom-popup' }
        });
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane me-2"></i> إرسال التغذية الراجعة';
    }
});