import React, { useState, useEffect } from 'react'
import { 
  MapPin, Clock, Camera, Send, Plus, Trash2, 
  RotateCcw, Check, X, Edit3, ShieldAlert, 
  Award, Filter, RefreshCw, BarChart2, CheckCircle2,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import axios from 'axios'

// API base URL - routes through Nginx port 80/api or directly
const API_BASE = '/api';

// Helper to check if a URL is a video asset based on extension
const isVideoUrl = (url) => {
  if (!url) return false;
  const ext = url.split('.').pop().toLowerCase();
  return ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext);
};

// Carousel component for swipeable image slide show
function WishCarousel({ urls, senderName, onZoomImage }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  if (!urls || urls.length === 0) return null;

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % urls.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex - 1 + urls.length) % urls.length);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % urls.length);
    }
    if (touchStart - touchEnd < -50) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + urls.length) % urls.length);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden mb-3 border border-[#ffb703]/20 bg-[#150305] relative group select-none shadow-glow-burgundy">
      <div 
        className="w-full h-60 flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {urls.map((url, idx) => (
          isVideoUrl(url) ? (
            <video 
              key={idx}
              src={url} 
              controls
              preload="metadata"
              className="w-full h-full object-contain bg-[#150305] shrink-0"
            />
          ) : (
            <img 
              key={idx}
              src={url} 
              alt={`Kỷ niệm từ ${senderName} ${idx + 1}`}
              className="w-full h-full object-contain bg-[#150305] shrink-0 cursor-zoom-in"
              onClick={() => onZoomImage && onZoomImage(url)}
              loading="lazy"
            />
          )
        ))}
      </div>

      {urls.length > 1 && (
        <>
          <button 
            type="button"
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-[#150305]/70 text-[#ffb703] border border-[#ffb703]/10 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-[#150305]/70 text-[#ffb703] border border-[#ffb703]/10 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
            {urls.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  currentIndex === idx ? 'bg-[#ffb703] w-3' : 'bg-[#fceade]/40'
                }`}
              />
            ))}
          </div>

          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#150305]/70 text-[8px] font-bold text-[#ffb703]">
            {currentIndex + 1}/{urls.length}
          </div>
        </>
      )}
    </div>
  );
}

function App() {
  // State variables
  const [settings, setSettings] = useState({ graduation_time: '2026-06-15T08:00:00', current_location: 'Đang chuẩn bị' });
  const [wishes, setWishes] = useState([]);
  const [adminWishes, setAdminWishes] = useState([]);
  const [trashWishes, setTrashWishes] = useState([]);
  const [adminStats, setAdminStats] = useState({ total_attending: 0, total_absent: 0, total_wishes: 0, total_images: 0 });
  
  // UI states
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: false });
  const [selectedTag, setSelectedTag] = useState('all');
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [particles, setParticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({ sender_name: '', message: '', photographer_tag: '', attendance_status: 'attending' });
  const [rsvpType, setRsvpType] = useState('attending'); // 'attending', 'absent', 'other'
  const [customAttendance, setCustomAttendance] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  // Admin states
  const [adminKey, setAdminKey] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState('pending'); // 'pending', 'approved', 'trash'
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [newLocationText, setNewLocationText] = useState('');
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [newTimeText, setNewTimeText] = useState('');

  // Admin Login modal states
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');


  // 1. Check for admin key in URL search parameters or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adminParam = params.get('admin');
    const keyFromUrl = params.get('key');
    const storedKey = localStorage.getItem('graduation_admin_key');
    
    if (adminParam === 'unlock') {
      setIsAdminLoginOpen(true);
      // clean up URL search param to prevent popping up on reload
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    if (keyFromUrl) {
      localStorage.setItem('graduation_admin_key', keyFromUrl);
      setAdminKey(keyFromUrl);
      setIsAdminMode(true);
    } else if (storedKey) {
      setAdminKey(storedKey);
      setIsAdminMode(true);
    }
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError('');
    try {
      const res = await axios.post(`${API_BASE}/admin/login`, {
        username: adminUsername,
        password: adminPassword
      });
      const token = res.data.session_token;
      localStorage.setItem('graduation_admin_key', token);
      setAdminKey(token);
      setIsAdminMode(true);
      setIsAdminLoginOpen(false);
      setAdminUsername('');
      setAdminPassword('');
      triggerCapToss();
    } catch (err) {
      console.error("Đăng nhập admin thất bại:", err);
      setAdminError(err.response?.data?.detail || "Sai tài khoản hoặc mật khẩu");
    }
  };


  // 2. Fetch public settings and approved wishes
  const fetchPublicData = async () => {
    try {
      const settingsRes = await axios.get(`${API_BASE}/settings`);
      setSettings(settingsRes.data);
      setNewLocationText(settingsRes.data.current_location);
      setNewTimeText(settingsRes.data.graduation_time);

      const wishesRes = await axios.get(`${API_BASE}/wishes`);
      setWishes(wishesRes.data);
    } catch (err) {
      console.error("Lỗi đồng bộ dữ liệu public:", err);
    }
  };

  // 3. Fetch admin-only data (wishes, stats, trash)
  const fetchAdminData = async () => {
    if (!isAdminMode || !adminKey) return;
    try {
      const headers = { 'X-Admin-Key': adminKey };
      
      const adminWishesRes = await axios.get(`${API_BASE}/admin/wishes`, { headers });
      setAdminWishes(adminWishesRes.data);

      const trashRes = await axios.get(`${API_BASE}/admin/wishes/trash`, { headers });
      setTrashWishes(trashRes.data);

      const statsRes = await axios.get(`${API_BASE}/admin/stats`, { headers });
      setAdminStats(statsRes.data);
    } catch (err) {
      console.error("Lỗi đồng bộ dữ liệu quản trị (Có thể sai mã admin_key):", err);
      // If unauthorized, clear local storage
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('graduation_admin_key');
        setIsAdminMode(false);
      }
    }
  };

  // Load starting data
  useEffect(() => {
    fetchPublicData();
    const interval = setInterval(fetchPublicData, 10000); // refresh public data every 10s
    return () => clearInterval(interval);
  }, []);

  // Refresh admin data when admin status or public wishes change
  useEffect(() => {
    if (isAdminMode) {
      fetchAdminData();
    }
  }, [isAdminMode, wishes]);

  // Reset selected filter tag when admin tab changes
  useEffect(() => {
    setSelectedTag('all');
  }, [adminTab]);

  // 4. Calculate countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const target = new Date(settings.graduation_time).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: true });
        clearInterval(timer);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isFinished: false });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [settings.graduation_time]);

  // Trigger cap toss effect when countdown ends
  useEffect(() => {
    if (timeLeft.isFinished) {
      triggerCapToss();
    }
  }, [timeLeft.isFinished]);

  // 5. Creative graduation cap toss animation
  const triggerCapToss = () => {
    const newParticles = [];
    const elements = ['🎓', '🎓', '📜', '✨', '🎈', '✨'];
    for (let i = 0; i < 45; i++) {
      newParticles.push({
        id: Math.random(),
        char: elements[Math.floor(Math.random() * elements.length)],
        left: Math.random() * 100, // horizontal percentage
        delay: Math.random() * 2, // staggered animation
        size: 20 + Math.random() * 25, // custom sizing
      });
    }
    setParticles(newParticles);
    // Auto cleanup particles
    setTimeout(() => {
      setParticles([]);
    }, 6000);
  };

  // 6. Client-Side Image Compression using HTML5 Canvas
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;

          // Maintain aspect ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.75 quality
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.75);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // 7. Handle Image File Selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setFilePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => {
      // Revoke object URL to avoid memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // 8. Submit Public Wish
  const handleSubmitWish = async (e) => {
    e.preventDefault();
    if (!formData.sender_name || !formData.message) return;

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('sender_name', formData.sender_name);
      payload.append('message', formData.message);
      payload.append('attendance_status', formData.attendance_status);
      
      if (formData.photographer_tag) {
        payload.append('photographer_tag', formData.photographer_tag.trim());
      }

      if (selectedFiles.length > 0) {
        // Nén ảnh trực tiếp trên client trước khi upload, giữ nguyên video
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          if (file.type.startsWith('video/')) {
            payload.append('files', file, file.name);
          } else {
            const compressedBlob = await compressImage(file);
            payload.append('files', compressedBlob, `upload_${i}.jpg`);
          }
        }
      }

      await axios.post(`${API_BASE}/wishes`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Reset Form & Close
      setFormData({ sender_name: '', message: '', photographer_tag: '', attendance_status: 'attending' });
      setRsvpType('attending');
      setCustomAttendance('');
      setSelectedFiles([]);
      setFilePreviews([]);
      setIsSubmitOpen(false);
      
      // Trigger graduation cap animation for delightful submission feedback
      triggerCapToss();
      fetchPublicData();
    } catch (err) {
      console.error("Gửi lời chúc thất bại:", err);
    } finally {
      setLoading(false);
    }
  };

  // ==================== ADMIN ACTIONS ====================

  const updateLocation = async () => {
    try {
      const headers = { 'X-Admin-Key': adminKey };
      await axios.post(`${API_BASE}/admin/settings`, { current_location: newLocationText }, { headers });
      setIsEditingLocation(false);
      fetchPublicData();
    } catch (err) {
      console.error("Cập nhật vị trí lỗi:", err);
    }
  };

  const updateGraduationTime = async () => {
    try {
      const headers = { 'X-Admin-Key': adminKey };
      await axios.post(`${API_BASE}/admin/settings`, { graduation_time: newTimeText }, { headers });
      setIsEditingTime(false);
      fetchPublicData();
    } catch (err) {
      console.error("Cập nhật giờ đếm ngược lỗi:", err);
    }
  };

  const handleApprove = async (id) => {
    try {
      const headers = { 'X-Admin-Key': adminKey };
      await axios.post(`${API_BASE}/admin/wishes/${id}/approve`, {}, { headers });
      fetchPublicData();
    } catch (err) {
      console.error("Approve lỗi:", err);
    }
  };

  const handleSoftDelete = async (id) => {
    try {
      const headers = { 'X-Admin-Key': adminKey };
      await axios.post(`${API_BASE}/admin/wishes/${id}/delete`, {}, { headers });
      fetchPublicData();
    } catch (err) {
      console.error("Soft delete lỗi:", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      const headers = { 'X-Admin-Key': adminKey };
      await axios.post(`${API_BASE}/admin/wishes/${id}/restore`, {}, { headers });
      fetchAdminData();
      fetchPublicData();
    } catch (err) {
      console.error("Khôi phục thiệp lỗi:", err);
    }
  };

  const handleHardDelete = async (id) => {
    if (!window.confirm("Cậu có chắc chắn muốn Xóa Vĩnh Viễn thiệp chúc này khỏi server không?")) return;
    try {
      const headers = { 'X-Admin-Key': adminKey };
      await axios.delete(`${API_BASE}/admin/wishes/${id}/hard`, { headers });
      fetchAdminData();
      fetchPublicData();
    } catch (err) {
      console.error("Xoá cứng lỗi:", err);
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem('graduation_admin_key');
    setAdminKey('');
    setIsAdminMode(false);
    window.location.href = '/'; // clear URL search param
  };

  // Lấy danh sách thiệp đang hoạt động tùy theo chế độ và tab (nếu là Admin)
  let activeWishesList = [];
  if (isAdminMode) {
    if (adminTab === 'pending') {
      activeWishesList = adminWishes.filter(w => !w.is_approved);
    } else if (adminTab === 'approved') {
      activeWishesList = adminWishes.filter(w => w.is_approved);
    } else if (adminTab === 'trash') {
      activeWishesList = trashWishes;
    }
  } else {
    activeWishesList = wishes;
  }

  // Filter images by photographer tag
  const uniqueTags = ['all', ...new Set(activeWishesList.filter(w => w.photographer_tag).map(w => w.photographer_tag))];

  const filteredWishes = selectedTag === 'all' 
    ? activeWishesList 
    : activeWishesList.filter(w => w.photographer_tag === selectedTag);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3a060b] via-[#5c0e17] to-[#1e0305] text-[#fceade] font-sans selection:bg-[#gold-primary]/30 relative pb-24 border-4 border-[#ffb703]/20 m-0 md:m-3 rounded-none md:rounded-3xl shadow-2xl">

      
      {/* 🎓 GRADUATION CAP TOSS FLOATING PARTICLES */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute text-center animate-float-up pointer-events-none"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              fontSize: `${p.size}px`,
              bottom: '-50px'
            }}
          >
            {p.char}
          </div>
        ))}
      </div>

      {/* 🔴 PULSING DECORATIVE BACKGROUND GLOW */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full bg-[#800020]/15 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] rounded-full bg-[#ffb703]/5 blur-[120px] animate-pulse-slow"></div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6">

        {/* 👑 ADMIN BADGE BAR */}
        {isAdminMode && (
          <div className="mb-6 p-3 rounded-2xl bg-[#2d0b11]/80 border border-[#ffb703]/30 backdrop-blur-md flex items-center justify-between shadow-glow-gold">
            <div className="flex items-center gap-2 text-xs font-bold text-[#ffb703] tracking-wide">
              <ShieldAlert className="w-4 h-4 animate-bounce" />
              <span>CHẾ ĐỘ QUẢN TRỊ VIÊN</span>
            </div>
            <button 
              onClick={logoutAdmin}
              className="text-xs px-2.5 py-1 rounded-lg bg-[#4a121a] hover:bg-[#800020] text-[#fceade] border border-[#ffb703]/10 transition-colors"
            >
              Thoát Admin
            </button>
          </div>
        )}

        {/* 🎓 LOGO & HEADER */}
        <header className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#800020] to-[#ffb703] p-[2px] shadow-glow-burgundy mb-3">
            <div className="w-full h-full rounded-full bg-[#4a0e17] flex items-center justify-center">
              <Award className="w-8 h-8 text-[#ffb703]" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#fceade] via-[#ffb703] to-[#fceade] bg-clip-text text-transparent">
            QUANG TÙNG GRADUATION
          </h1>
          <p className="text-xs text-[#d0a5aa] mt-1">Chúc mừng Lễ Tốt Nghiệp của Quang Tùng</p>
        </header>

        {/* 🟢 LIVE LOCATION BANNER WITH METALLIC border AND GLOW */}
        <section className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#2d0b11] via-[#4a121a] to-[#2d0b11] border border-[#ffb703]/40 shadow-glow-gold relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ffb703] to-transparent animate-pulse-slow"></div>
          <div className="flex items-start gap-3">
            <div className="relative mt-1">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffb703] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ffb703]"></span>
              </span>
            </div>
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#ffb703]/90">VỊ TRÍ TRỰC TIẾP CỦA QUANG TÙNG</span>
              {isEditingLocation ? (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newLocationText}
                    onChange={(e) => setNewLocationText(e.target.value)}
                    className="flex-1 bg-[#1a0508] border border-[#ffb703]/40 rounded-lg px-2 py-1 text-xs text-[#fceade] focus:outline-none"
                    placeholder="Điền vị trí..."
                  />
                  <button onClick={updateLocation} className="p-1 bg-[#ffb703] text-[#1a0508] rounded-lg">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsEditingLocation(false)} className="p-1 bg-[#4a121a] rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold text-[#fceade] tracking-wide mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#ffb703] shrink-0" />
                    {settings.current_location}
                  </p>
                  {isAdminMode && (
                    <button 
                      onClick={() => setIsEditingLocation(true)}
                      className="p-1 text-[#ffb703] hover:text-[#fceade] transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ⏳ COUNTDOWN WIDGET (ELEGANT FLIP STYLE GLASS CARD) */}
        <section className="mb-8 p-5 rounded-3xl bg-[#2d0b11]/50 border border-[#5c1620]/30 backdrop-blur-md shadow-glow-burgundy text-center relative">
          <div className="absolute top-2 right-3 flex gap-1">
            {isAdminMode && (
              <button 
                onClick={() => setIsEditingTime(!isEditingTime)} 
                className="p-1 text-xs text-[#ffb703] flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Đổi Giờ</span>
              </button>
            )}
          </div>
          
          <span className="text-[10px] font-bold tracking-widest text-[#d0a5aa] uppercase block mb-3">ĐẾM NGƯỢC NHẬN BẰNG CỬ NHÂN</span>

          {isEditingTime ? (
            <div className="mb-4 p-3 rounded-xl bg-[#1a0508] border border-[#ffb703]/30 flex flex-col gap-2">
              <label className="text-[10px] text-[#d0a5aa] text-left">Định dạng: YYYY-MM-DDTHH:MM:SS</label>
              <input
                type="text"
                value={newTimeText}
                onChange={(e) => setNewTimeText(e.target.value)}
                className="bg-[#1a0508] border border-[#ffb703]/40 rounded-lg px-3 py-1.5 text-xs text-[#fceade] focus:outline-none"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={updateGraduationTime} className="px-3 py-1 bg-[#ffb703] text-[#1a0508] rounded-lg text-xs font-bold">Lưu</button>
                <button onClick={() => setIsEditingTime(false)} className="px-3 py-1 bg-[#4a121a] rounded-lg text-xs">Hủy</button>
              </div>
            </div>
          ) : null}

          {timeLeft.isFinished ? (
            <div className="py-2">
              <h2 className="text-2xl font-black text-[#ffb703] animate-pulse">CHÚC MỪNG TÂN CỬ NHÂN! 🎉</h2>
              <p className="text-xs text-[#d0a5aa] mt-1">Giây phút vinh quang đã đến. Cảm ơn cậu đã đồng hành cùng Quang Tùng.</p>
              <button 
                onClick={triggerCapToss}
                className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#800020] to-[#ffb703] text-[#1a0508] font-bold text-xs shadow-glow-gold hover:scale-105 active:scale-95 transition-all"
              >
                🎓 TUNG MŨ ĂN MỪNG!
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2.5 max-w-xs mx-auto">
              {[
                { label: 'NGÀY', value: timeLeft.days },
                { label: 'GIỜ', value: timeLeft.hours },
                { label: 'PHÚT', value: timeLeft.minutes },
                { label: 'GIÂY', value: timeLeft.seconds }
              ].map((item, index) => (
                <div key={index} className="flex flex-col">
                  <div className="bg-[#4a121a]/80 border border-[#ffb703]/25 rounded-2xl p-2.5 shadow-md relative overflow-hidden group">
                    <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#150305]/40"></div>
                    <span className="text-2xl font-black font-mono text-[#ffb703] block tracking-tight">
                      {String(item.value).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-[8px] font-bold tracking-widest text-[#d0a5aa] mt-1.5">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 📊 ADMIN STATS PANEL */}
        {isAdminMode && (
          <section className="mb-6 p-4 rounded-2xl bg-[#2d0b11]/40 border border-[#4a121a]/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#ffb703] mb-3">
              <BarChart2 className="w-4 h-4" />
              <span>THỐNG KÊ LỄ TỐT NGHIỆP</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-[#1a0508]/60 p-2.5 rounded-xl border border-[#4a121a]/30">
                <span className="text-[9px] text-[#d0a5aa] block">SẼ ĐẾN DỰ LỄ 🎓</span>
                <span className="text-xl font-extrabold text-[#ffb703]">{adminStats.total_attending}</span>
              </div>
              <div className="bg-[#1a0508]/60 p-2.5 rounded-xl border border-[#4a121a]/30">
                <span className="text-[9px] text-[#d0a5aa] block">CHÚC TỪ XA 💌</span>
                <span className="text-xl font-extrabold text-[#d0a5aa]">{adminStats.total_absent}</span>
              </div>
            </div>
          </section>
        )}

        {/* 📑 ADMIN TABS */}
        {isAdminMode && (
          <div className="mb-6 grid grid-cols-3 gap-2">
            <button
              onClick={() => setAdminTab('pending')}
              className={`py-2 px-1 text-center rounded-xl font-bold text-xs border transition-all ${
                adminTab === 'pending'
                  ? 'bg-[#ffb703]/25 text-[#ffb703] border-[#ffb703] shadow-glow-burgundy'
                  : 'bg-[#2d0b11]/50 text-[#d0a5aa] border-[#4a121a]/30 hover:bg-[#4a121a]/40'
              }`}
            >
              Chờ duyệt ({adminWishes.filter(w => !w.is_approved).length})
            </button>
            <button
              onClick={() => setAdminTab('approved')}
              className={`py-2 px-1 text-center rounded-xl font-bold text-xs border transition-all ${
                adminTab === 'approved'
                  ? 'bg-[#ffb703]/25 text-[#ffb703] border-[#ffb703]'
                  : 'bg-[#2d0b11]/50 text-[#d0a5aa] border-[#4a121a]/30 hover:bg-[#4a121a]/40'
              }`}
            >
              Đã duyệt ({adminWishes.filter(w => w.is_approved).length})
            </button>
            <button
              onClick={() => setAdminTab('trash')}
              className={`py-2 px-1 text-center rounded-xl font-bold text-xs border transition-all ${
                adminTab === 'trash'
                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : 'bg-[#2d0b11]/50 text-[#d0a5aa] border-[#4a121a]/30 hover:bg-[#4a121a]/40'
              }`}
            >
              Thùng rác ({trashWishes.length})
            </button>
          </div>
        )}

        {/* 🔍 FILTER TAGS & PHOTO HEADER */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#ffb703]" />
              <span className="text-[11px] font-extrabold tracking-widest text-[#d0a5aa]">BẢNG TIN ẢNH & LỜI CHÚC</span>
            </div>
            <span className="text-[10px] text-[#ffb703] font-mono">
              {isAdminMode 
                ? (adminTab === 'pending' ? `${filteredWishes.length} thiệp chờ duyệt` : adminTab === 'approved' ? `${filteredWishes.length} thiệp đã duyệt` : `${filteredWishes.length} thiệp trong thùng rác`)
                : `${filteredWishes.length} thiệp đã duyệt`
              }
            </span>
          </div>

          {/* Tag scroll filter bar */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {uniqueTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full shrink-0 transition-all border ${
                  selectedTag === tag 
                    ? 'bg-gradient-to-r from-[#800020] to-[#ffb703] text-[#1a0508] border-[#ffb703]/40' 
                    : 'bg-[#2d0b11]/50 text-[#d0a5aa] border-[#4a121a]/30 hover:bg-[#4a121a]/40'
                }`}
              >
                {tag === 'all' ? 'TẤT CẢ 🌟' : tag.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {/* 📰 SOCIAL FEED (DIPLOMA CARD DESIGN) */}
        <main className="space-y-4">
          {filteredWishes.length === 0 ? (
            <div className="text-center p-8 rounded-2xl bg-[#2d0b11]/30 border border-[#4a121a]/30 text-xs text-[#d0a5aa] leading-relaxed">
              🍿 Hiện chưa có thiệp chúc nào trong nhóm này. Hãy bấm nút phía dưới để gửi lời chúc & ảnh đầu tiên nhé.
            </div>
          ) : (
            filteredWishes.map((wish) => (
              <div 
                key={wish.id} 
                className="bg-[#2d0b11]/40 border border-[#5c1620]/30 backdrop-blur-md rounded-2xl p-4 shadow-lg relative overflow-hidden group"
              >
                {/* 📜 DIPLOMA DECORATIVE STYLE: Gold corner ribbon / stamp */}
                <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden pointer-events-none">
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#ffb703]/25 animate-pulse"></div>
                </div>

                {/* Header Name & RSVP Tag */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#ffb703] tracking-wide uppercase">{wish.sender_name}</span>
                    {!wish.is_approved && (
                      <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                        ⏳ ĐỢI DUYỆT
                      </span>
                    )}
                  </div>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                    wish.attendance_status === 'attending' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : wish.attendance_status === 'absent'
                      ? 'bg-stone-500/15 text-[#d0a5aa] border border-stone-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                  }`}>
                    {wish.attendance_status === 'attending' 
                      ? '🎓 SẼ ĐẾN DỰ LỄ' 
                      : wish.attendance_status === 'absent' 
                      ? '💌 CHÚC TỪ XA' 
                      : `✍️ ${wish.attendance_status}`}
                  </span>
                </div>

                {/* Wish Message */}
                <p className="text-xs text-[#fceade]/90 leading-relaxed mb-3 font-medium whitespace-pre-line bg-[#150305]/20 p-2.5 rounded-xl border border-[#4a121a]/20">
                  {wish.message}
                </p>

                {/* Wish Image */}
                {wish.image_urls && wish.image_urls.length > 0 ? (
                  <WishCarousel urls={wish.image_urls} senderName={wish.sender_name} onZoomImage={setZoomedImage} />
                ) : wish.image_url ? (
                  <div className="rounded-xl overflow-hidden mb-3 border border-[#4a121a]/40 bg-[#150305] relative group flex items-center justify-center">
                    {isVideoUrl(wish.image_url) ? (
                      <video 
                        src={wish.image_url} 
                        controls
                        preload="metadata"
                        className="w-full h-auto max-h-96 object-contain bg-[#150305] group-hover:scale-[1.01] transition-transform duration-300"
                      />
                    ) : (
                      <img 
                        src={wish.image_url} 
                        alt={`Kỷ niệm từ ${wish.sender_name}`}
                        className="w-full h-auto max-h-96 object-contain bg-[#150305] group-hover:scale-[1.01] transition-transform duration-300 cursor-zoom-in"
                        onClick={() => setZoomedImage(wish.image_url)}
                        loading="lazy"
                      />
                    )}
                  </div>
                ) : null}

                {/* Footer Tag Photographer */}
                {wish.photographer_tag && (
                  <div className="flex items-center gap-1 text-[9px] text-[#ffb703] font-bold">
                    <Camera className="w-3 h-3" />
                    <span>Nguồn: {wish.photographer_tag.toUpperCase()}</span>
                  </div>
                )}
                
                {/* Date time */}
                <div className="text-[8px] text-[#d0a5aa]/60 mt-1 text-right">
                  {new Date(wish.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(wish.created_at).toLocaleDateString('vi-VN')}
                </div>

                {/* 👑 ADMIN INTERACTION ACTIONS */}
                {isAdminMode && (
                  <div className="border-t border-[#4a121a] pt-3 mt-3 flex justify-end gap-2">
                    {adminTab === 'trash' ? (
                      <>
                        <button
                          onClick={() => handleRestore(wish.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs hover:bg-emerald-500/30 flex items-center gap-1 font-bold transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Khôi Phục</span>
                        </button>
                        <button
                          onClick={() => handleHardDelete(wish.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-600/35 text-red-200 border border-red-600/30 text-xs hover:bg-red-600/45 flex items-center gap-1 font-bold transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa Cứng</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(wish.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 ${
                            wish.is_approved 
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30' 
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                          }`}
                        >
                          {wish.is_approved ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                          <span>{wish.is_approved ? 'Hủy Duyệt' : 'Duyệt'}</span>
                        </button>
                        <button
                          onClick={() => handleSoftDelete(wish.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-xs hover:bg-red-500/30 flex items-center gap-1 font-bold transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </main>

        {/* ➕ FLOATING ACTIONS BUTTON FOR SUBMITTING WISH */}
        {!isAdminMode && (
          <div className="fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setIsSubmitOpen(true)}
              className="flex items-center gap-1 px-4 py-3 rounded-full bg-gradient-to-r from-[#800020] via-[#ffb703] to-[#800020] text-[#1a0508] font-black text-xs shadow-glow-gold hover:scale-105 active:scale-95 transition-all animate-bounce"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>GỬI LỜI CHÚC & ẢNH 🎓</span>
            </button>
          </div>
        )}

        {/* 📝 WRITE WISH & UPLOAD MODAL */}
        {isSubmitOpen && (
          <div className="fixed inset-0 bg-[#150305]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#2d0b11] border border-[#ffb703]/30 rounded-3xl p-5 max-w-sm w-full shadow-glow-gold max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between mb-4 border-b border-[#4a121a] pb-2">
                <span className="text-xs font-black text-[#ffb703] tracking-widest uppercase flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>GỬI LỜI CHÚC TỐT NGHIỆP</span>
                </span>
                <button onClick={() => setIsSubmitOpen(false)} className="p-1 rounded-full bg-[#4a121a]/80 text-[#fceade]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitWish} className="space-y-4">
                
                {/* 1. Sender Name */}
                <div>
                  <label className="text-[10px] font-bold text-[#d0a5aa] block mb-1">TÊN CỦA CẬU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sender_name}
                    onChange={(e) => setFormData({...formData, sender_name: e.target.value})}
                    placeholder="Nhập tên của cậu..."
                    className="w-full bg-[#150305] border border-[#4a121a] rounded-xl px-3 py-2 text-xs text-[#fceade] focus:outline-none focus:border-[#ffb703]"
                  />
                </div>

                {/* 2. RSVP Options */}
                <div>
                  <label className="text-[10px] font-bold text-[#d0a5aa] block mb-1.5">CẬU CÓ ĐẾN DỰ LỄ TRỰC TIẾP KHÔNG? *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRsvpType('attending');
                        setFormData({...formData, attendance_status: 'attending'});
                      }}
                      className={`py-2 px-1 text-[9px] font-bold rounded-xl border flex items-center justify-center gap-0.5 transition-all ${
                        rsvpType === 'attending'
                          ? 'bg-[#ffb703]/25 text-[#ffb703] border-[#ffb703]'
                          : 'bg-[#150305] text-[#d0a5aa] border-[#4a121a]'
                      }`}
                    >
                      <span>SẼ ĐẾN DỰ LỄ 🎓</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRsvpType('absent');
                        setFormData({...formData, attendance_status: 'absent'});
                      }}
                      className={`py-2 px-1 text-[9px] font-bold rounded-xl border flex items-center justify-center gap-0.5 transition-all ${
                        rsvpType === 'absent'
                          ? 'bg-[#ffb703]/25 text-[#ffb703] border-[#ffb703]'
                          : 'bg-[#150305] text-[#d0a5aa] border-[#4a121a]'
                      }`}
                    >
                      <span>CHÚC TỪ XA 💌</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRsvpType('other');
                        setFormData({...formData, attendance_status: customAttendance || 'Khác'});
                      }}
                      className={`py-2 px-1 text-[9px] font-bold rounded-xl border flex items-center justify-center gap-0.5 transition-all ${
                        rsvpType === 'other'
                          ? 'bg-[#ffb703]/25 text-[#ffb703] border-[#ffb703]'
                          : 'bg-[#150305] text-[#d0a5aa] border-[#4a121a]'
                      }`}
                    >
                      <span>KHÁC ✍️</span>
                    </button>
                  </div>
                  
                  {rsvpType === 'other' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        required
                        value={customAttendance}
                        onChange={(e) => {
                          setCustomAttendance(e.target.value);
                          setFormData({...formData, attendance_status: e.target.value});
                        }}
                        placeholder="Nhập trạng thái tham dự của cậu..."
                        className="w-full bg-[#150305] border border-[#4a121a] rounded-xl px-3 py-2 text-xs text-[#fceade] focus:outline-none focus:border-[#ffb703]"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Wish Message */}
                <div>
                  <label className="text-[10px] font-bold text-[#d0a5aa] block mb-1">LỜI CHÚC CỦA CẬU *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="..."
                    className="w-full bg-[#150305] border border-[#4a121a] rounded-xl px-3 py-2 text-xs text-[#fceade] focus:outline-none focus:border-[#ffb703]"
                  />
                </div>

                {/* 4. Photographer Tag */}
                <div>
                  <label className="text-[10px] font-bold text-[#d0a5aa] block mb-1">NGUỒN ẢNH / PHÓ NHÁY (NẾU CÓ)</label>
                  <input
                    type="text"
                    value={formData.photographer_tag}
                    onChange={(e) => setFormData({...formData, photographer_tag: e.target.value})}
                    placeholder="Ví dụ: Máy cơ Tuấn, iPhone Mẹ..."
                    className="w-full bg-[#150305] border border-[#4a121a] rounded-xl px-3 py-2 text-xs text-[#fceade] focus:outline-none focus:border-[#ffb703]"
                  />
                </div>

                {/* 5. Image & Video File Upload */}
                <div>
                  <label className="text-[10px] font-bold text-[#d0a5aa] block mb-1">ĐÍNH KÈM HÌNH ẢNH & VIDEO KỶ NIỆM (TÙY CHỌN)</label>
                  
                  {filePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3 max-h-32 overflow-y-auto p-1 bg-[#150305] rounded-xl border border-[#4a121a]/30">
                      {filePreviews.map((preview, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden border border-[#ffb703]/25 aspect-square bg-[#2d0b11]">
                          {selectedFiles[index] && selectedFiles[index].type.startsWith('video/') ? (
                            <video src={preview} className="w-full h-full object-cover" preload="metadata" />
                          ) : (
                            <img src={preview} alt={`preview-${index}`} className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(index)}
                            className="absolute top-1 right-1 p-0.5 rounded-full bg-red-600 text-white z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="border-2 border-dashed border-[#4a121a] hover:border-[#ffb703]/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-[#150305]/50 transition-colors">
                    <Camera className="w-6 h-6 text-[#ffb703] mb-1" />
                    <span className="text-[10px] text-[#d0a5aa] font-bold">NHẤN VÀO ĐỂ TẢI ẢNH & VIDEO</span>
                    <span className="text-[8px] text-[#d0a5aa]/60 mt-0.5">Chọn nhiều ảnh/video cùng lúc</span>
                    <input 
                      type="file" 
                      multiple
                      accept="image/*,video/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                </div>


                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#800020] to-[#ffb703] text-[#1a0508] text-xs font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-glow-gold flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ĐANG NÉN & GỬI...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>GỬI LỜI CHÚC ĐỢI PHÊ DUYỆT 🎓</span>
                    </>
                  )}
                </button>

              </form>
            </div>
          </div>
        )}

        {/* 🔑 ADMIN LOGIN MODAL */}
        {isAdminLoginOpen && (
          <div className="fixed inset-0 bg-[#150305]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#2d0b11] border border-[#ffb703]/30 rounded-3xl p-6 max-w-sm w-full shadow-glow-gold">
              
              <div className="flex items-center justify-between mb-4 border-b border-[#4a121a] pb-2">
                <span className="text-xs font-black text-[#ffb703] tracking-widest uppercase flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#ffb703] animate-pulse" />
                  <span>XÁC THỰC QUẢN TRỊ VIÊN</span>
                </span>
                <button onClick={() => setIsAdminLoginOpen(false)} className="p-1 rounded-full bg-[#4a121a]/80 text-[#fceade]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {adminError && (
                <div className="mb-4 p-2.5 rounded-xl bg-red-950/50 border border-red-500/30 text-[11px] text-red-400 font-medium">
                  ⚠️ {adminError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-[#d0a5aa] block mb-1">TÊN ĐĂNG NHẬP</label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Nhập tài khoản admin..."
                    className="w-full bg-[#150305] border border-[#4a121a] rounded-xl px-3 py-2.5 text-xs text-[#fceade] focus:outline-none focus:border-[#ffb703]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#d0a5aa] block mb-1">MẬT KHẨU</label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full bg-[#150305] border border-[#4a121a] rounded-xl px-3 py-2.5 text-xs text-[#fceade] focus:outline-none focus:border-[#ffb703]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-2 bg-gradient-to-r from-[#800020] to-[#ffb703] text-[#1a0508] text-xs font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-glow-gold flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>XÁC NHẬN ĐĂNG NHẬP</span>
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* 🔍 IMAGE LIGHTBOX OVERLAY */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-2 cursor-zoom-out select-none"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#150305]/70 text-[#ffb703] border border-[#ffb703]/25 z-[110]"
          >
            <X className="w-5 h-5" />
          </button>
          
          {isVideoUrl(zoomedImage) ? (
            <video 
              src={zoomedImage} 
              controls
              autoPlay
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} // prevent close when clicking on video controls
            />
          ) : (
            <img 
              src={zoomedImage} 
              alt="Phóng to ảnh" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          )}
        </div>
      )}
    </div>
  )
}

export default App
