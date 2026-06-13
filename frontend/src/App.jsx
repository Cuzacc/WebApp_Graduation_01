import React, { useState, useEffect, useRef } from 'react'
import { 
  MapPin, Clock, Camera, Send, Plus, Trash2, 
  RotateCcw, Check, X, Edit3, ShieldAlert, 
  Award, Filter, RefreshCw, BarChart2, CheckCircle2,
  ChevronLeft, ChevronRight, Home, Calendar, BookOpen, 
  Image as ImageIcon, Play, Pause, ExternalLink, Download, Info,
  Upload, Settings, Trash
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

// Default Timeline fallback
const defaultTimeline = [
  { time: '08:00 - 09:00', title: 'Đón Khách & Chụp Ảnh Lưu Niệm', desc: 'Đón tiếp bạn bè và người thân tại sảnh hội trường chính, chụp những tấm hình kỷ niệm đầu ngày lễ.', icon: 'Camera' },
  { time: '09:00 - 10:30', title: 'Lễ Tốt Nghiệp Chính Thức', desc: 'Thực hiện làm lễ trao bằng và vinh danh cử nhân tại Hội trường chính.', icon: 'Award' },
  { time: '10:30 - 11:30', title: 'Chụp Ảnh Tự Do Tại Khuôn Viên', desc: 'Quang Tùng đi chụp ảnh kỷ yếu, chụp lưu niệm tự do cùng bạn bè tại sân trường và các góc check-in xịn sò.', icon: 'MapPin' },
  { time: '11:30 - 13:30', title: 'Tiệc Chiêu Đãi Thân Mật', desc: 'Dùng bữa trưa liên hoan thân mật cùng gia đình và bạn bè tại nhà hàng gần khuôn viên trường.', icon: 'Info' }
];

const renderTimelineIcon = (iconName) => {
  switch (iconName) {
    case 'Camera': return <Camera className="w-3.5 h-3.5" />;
    case 'Award': return <Award className="w-3.5 h-3.5" />;
    case 'MapPin': return <MapPin className="w-3.5 h-3.5" />;
    case 'Info':
    default:
      return <Info className="w-3.5 h-3.5" />;
  }
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
  // Navigation State
  const [activeView, setActiveView] = useState('home'); // 'home', 'logistics', 'guestbook', 'gallery'

  // Traffic Monitoring States
  const [trafficStats, setTrafficStats] = useState({
    active_users: 0,
    total_views: 0,
    total_visitors: 0,
    recent_logs: [],
    device_stats: { mobile: 0, desktop: 0 },
    top_endpoints: []
  });
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [logsLimit, setLogsLimit] = useState(20);

  // Canvas Confetti Ref
  const canvasRef = useRef(null);

  // Data states
  const [settings, setSettings] = useState({ 
    graduation_time: '2026-06-16T08:00:00', 
    current_location: 'Đại học Duy Tân 03 Quang Trung Đà Nẵng',
    avatar_url: '',
    google_maps_url: '',
    gallery_unlocked: 'false',
    timeline: '',
    site_title: 'QUANG TÙNG GRADUATION',
    invitation_desc: 'Sự hiện diện của mọi người là niềm vinh dự và là nguồn động viên to lớn để Tùng vững bước trên chặng đường sắp tới. Trân trọng kính mời mọi người đến tham dự và chung vui cùng Tùng trong buổi lễ tốt nghiệp đầy ý nghĩa này.',
    location_title: 'Hội trường chính',
    location_subtitle: 'Đại học Duy Tân 03 Quang Trung Đà Nẵng',
    location_parking: '🚗 Thông tin đỗ xe: Khách gửi xe tại bãi gửi xe của trường Đại học Duy Tân.'
  });
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

  // Slideshow states
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(true);

  // Admin states
  const [adminKey, setAdminKey] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState('pending'); // 'pending', 'approved', 'trash'
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [newLocationText, setNewLocationText] = useState('');
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [newTimeText, setNewTimeText] = useState('');
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);

  // Direct Inline Editing states for location card
  const [isEditingLocationTitle, setIsEditingLocationTitle] = useState(false);
  const [editLocationTitle, setEditLocationTitle] = useState('');
  const [isEditingLocationSubtitle, setIsEditingLocationSubtitle] = useState(false);
  const [editLocationSubtitle, setEditLocationSubtitle] = useState('');
  const [isEditingLocationParking, setIsEditingLocationParking] = useState(false);
  const [editLocationParking, setEditLocationParking] = useState('');

  // Direct Inline Editing states for timeline items
  const [editingTimelineIndex, setEditingTimelineIndex] = useState(null);
  const [editingTimelineItem, setEditingTimelineItem] = useState({ time: '', title: '', desc: '', icon: 'Info' });

  // Refs to track editing status and avoid auto-polling overwrite resets
  const isEditingLocationTitleRef = useRef(false);
  const isEditingLocationSubtitleRef = useRef(false);
  const isEditingLocationParkingRef = useRef(false);
  const isEditingLocationRef = useRef(false);
  const isEditingTimeRef = useRef(false);
  const editingTimelineIndexRef = useRef(null);

  useEffect(() => { isEditingLocationTitleRef.current = isEditingLocationTitle; }, [isEditingLocationTitle]);
  useEffect(() => { isEditingLocationSubtitleRef.current = isEditingLocationSubtitle; }, [isEditingLocationSubtitle]);
  useEffect(() => { isEditingLocationParkingRef.current = isEditingLocationParking; }, [isEditingLocationParking]);
  useEffect(() => { isEditingLocationRef.current = isEditingLocation; }, [isEditingLocation]);
  useEffect(() => { isEditingTimeRef.current = isEditingTime; }, [isEditingTime]);
  useEffect(() => { editingTimelineIndexRef.current = editingTimelineIndex; }, [editingTimelineIndex]);

  // WebSocket for Real-time Reactions
  const wsRef = useRef(null);
  const [floatingReactions, setFloatingReactions] = useState([]);

  // Admin Edit Form states
  const [editAvatarLoading, setEditAvatarLoading] = useState(false);
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editMapsUrl, setEditMapsUrl] = useState('');
  const [editGalleryUnlocked, setEditGalleryUnlocked] = useState(false);
  const [editTimelineItems, setEditTimelineItems] = useState([]);
  const [editSiteTitle, setEditSiteTitle] = useState('');
  const [editInvitationDesc, setEditInvitationDesc] = useState('');
  const [editGraduationTime, setEditGraduationTime] = useState('');
  
  // Ticking time states for system verification
  const [deviceTime, setDeviceTime] = useState(new Date().toLocaleTimeString('vi-VN'));
  const [serverTime, setServerTime] = useState(null);

  // Sync serverTime when settings update
  useEffect(() => {
    if (settings.server_time) {
      setServerTime(new Date(settings.server_time));
    }
  }, [settings.server_time]);

  // Ticking clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setDeviceTime(new Date().toLocaleTimeString('vi-VN'));
      setServerTime(prev => {
        if (!prev) return null;
        return new Date(prev.getTime() + 1000);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // 1b. WebSocket connection for real-time reactions
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/ws`;
    
    let socket;
    const connectWS = () => {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'reaction') {
            triggerFloatingReaction(data.reactionType);
          }
        } catch (e) {
          console.error("Lỗi WebSocket message:", e);
        }
      };
      
      socket.onclose = () => {
        setTimeout(connectWS, 3000); // reconnect
      };
      
      socket.onerror = () => {
        socket.close();
      };
    };
    
    connectWS();
    
    return () => {
      if (socket) socket.close();
    };
  }, []);

  const triggerFloatingReaction = (type) => {
    const chars = { heart: '❤️', cap: '🎓' };
    const char = chars[type] || '❤️';
    const id = Math.random();
    
    setFloatingReactions(prev => [
      ...prev,
      {
        id,
        char,
        left: 10 + Math.random() * 80,
        size: 24 + Math.random() * 24
      }
    ]);
    
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);
  };

  const sendReaction = (reactionType) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'reaction',
        reactionType
      }));
    } else {
      triggerFloatingReaction(reactionType);
    }
  };

  // Dynamic RSVP/attendance form options
  const getActivePhase = () => {
    const mockMode = settings.time_mock_mode || 'real';
    if (mockMode === 'moc_1') return 1;
    if (mockMode === 'moc_2') return 2;
    if (mockMode === 'moc_3') return 3;
    
    const gradTime = new Date(settings.graduation_time).getTime();
    const now = new Date().getTime();
    const ceremonyDuration = 4 * 60 * 60 * 1000;
    
    if (now < gradTime) return 1;
    if (now >= gradTime && now <= gradTime + ceremonyDuration) return 2;
    return 3;
  };

  const getAttendanceOptions = () => {
    const phase = getActivePhase();
    if (phase === 1) {
      return [
        { value: 'attending', label: 'Sẽ đến dự lễ 🎓' },
        { value: 'absent', label: 'Chúc từ xa 💌' }
      ];
    } else if (phase === 2) {
      return [
        { value: 'attending_ceremony', label: 'Đang ở buổi lễ nè 📸' },
        { value: 'absent', label: 'Chúc từ xa 💌' }
      ];
    } else {
      return [
        { value: 'attended', label: 'Đã tham gia 🎓' },
        { value: 'absent', label: 'Chúc từ xa 💌' }
      ];
    }
  };

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
      if (!isEditingLocationRef.current) setNewLocationText(settingsRes.data.current_location);
      if (!isEditingTimeRef.current) setNewTimeText(settingsRes.data.graduation_time);
      
      // Khởi tạo các ô nhập sửa đổi trực tiếp nếu chưa chỉnh sửa
      if (!isEditingLocationTitleRef.current) setEditLocationTitle(settingsRes.data.location_title || 'Hội trường chính');
      if (!isEditingLocationSubtitleRef.current) setEditLocationSubtitle(settingsRes.data.location_subtitle || 'Đại học Duy Tân 03 Quang Trung Đà Nẵng');
      if (!isEditingLocationParkingRef.current) setEditLocationParking(settingsRes.data.location_parking || '');
      setEditMapsUrl(settingsRes.data.google_maps_url || '');

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
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('graduation_admin_key');
        setIsAdminMode(false);
      }
    }
  };

  const fetchTrafficStats = async () => {
    if (!isAdminMode || !adminKey) return;
    setTrafficLoading(true);
    try {
      const headers = { 'X-Admin-Key': adminKey };
      const res = await axios.get(`${API_BASE}/admin/traffic?limit=${logsLimit}`, { headers });
      setTrafficStats(res.data);
    } catch (err) {
      console.error("Lỗi đồng bộ dữ liệu giám sát:", err);
    } finally {
      setTrafficLoading(false);
    }
  };

  const downloadTrafficCSV = async () => {
    if (!isAdminMode || !adminKey) return;
    try {
      const headers = { 'X-Admin-Key': adminKey };
      const response = await axios.get(`${API_BASE}/admin/traffic/export`, {
        headers,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `traffic_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Lỗi tải file CSV:", err);
      alert("Không thể tải file CSV nhật ký!");
    }
  };

  useEffect(() => {
    if (isAdminMode && activeView === 'monitoring') {
      fetchTrafficStats();
      const interval = setInterval(fetchTrafficStats, 15000);
      return () => clearInterval(interval);
    }
  }, [isAdminMode, activeView, adminKey, logsLimit]);

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

  // Parse Settings details when settings change
  useEffect(() => {
    setEditMapsUrl(settings.google_maps_url || '');
    setEditAvatarUrl(settings.avatar_url || '');
    setEditGalleryUnlocked(settings.gallery_unlocked === 'true');
    setEditSiteTitle(settings.site_title || 'QUANG TÙNG GRADUATION');
    setEditInvitationDesc(settings.invitation_desc || 'Sự hiện diện của mọi người là niềm vinh dự và là nguồn động viên to lớn để Tùng vững bước trên chặng đường sắp tới. Trân trọng kính mời mọi người đến tham dự và chung vui cùng Tùng trong buổi lễ tốt nghiệp đầy ý nghĩa này.');
    if (!isEditingTimeRef.current) setEditGraduationTime(settings.graduation_time || '2026-06-16T08:00:00');
    
    if (editingTimelineIndexRef.current === null) {
      try {
        if (settings.timeline) {
          setEditTimelineItems(JSON.parse(settings.timeline));
        } else {
          setEditTimelineItems(defaultTimeline);
        }
      } catch (e) {
        setEditTimelineItems(defaultTimeline);
      }
    }
  }, [settings]);

  // Set default attendance status when settings load
  useEffect(() => {
    const opts = getAttendanceOptions();
    const defaultStatus = opts[0]?.value || 'attending';
    setFormData(prev => ({ ...prev, attendance_status: defaultStatus }));
  }, [settings.graduation_time]);

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
      triggerConfetti();
    }
  }, [timeLeft.isFinished]);

  // Slideshow Auto-play logic
  useEffect(() => {
    let slideTimer;
    if (isSlideshowOpen && isSlideshowPlaying && wishes.length > 0) {
      slideTimer = setInterval(() => {
        setSlideshowIndex((prevIndex) => (prevIndex + 1) % wishes.length);
      }, 5000);
    }
    return () => clearInterval(slideTimer);
  }, [isSlideshowOpen, isSlideshowPlaying, wishes.length]);

  // 5. Creative graduation cap toss animation
  const triggerCapToss = () => {
    const newParticles = [];
    const elements = ['🎓', '🎓', '📜', '✨', '🎈', '✨'];
    for (let i = 0; i < 45; i++) {
      newParticles.push({
        id: Math.random(),
        char: elements[Math.floor(Math.random() * elements.length)],
        left: Math.random() * 100, 
        delay: Math.random() * 2, 
        size: 20 + Math.random() * 25, 
      });
    }
    setParticles(newParticles);
    setTimeout(() => {
      setParticles([]);
    }, 6000);
  };

  // HTML5 Canvas Confetti Explosion (Upgraded Modern Physics Engine)
  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let confettiParticles = [];
    const colors = [
      '#ffb703', // Gold
      '#800020', // Burgundy
      '#ff007f', // Vibrant Rose
      '#00f5d4', // Neon Cyan
      '#7b2cbf', // Royal Purple
      '#ff5400'  // Bright Orange
    ];
    
    const shapes = ['circle', 'square', 'triangle', 'heart'];
    
    const createBurst = (x, angle, speedMultiplier) => {
      for (let i = 0; i < 80; i++) {
        const theta = angle + (Math.random() - 0.5) * 0.4; // slight spread
        const speed = (Math.random() * 12 + 8) * speedMultiplier;
        
        confettiParticles.push({
          x: x,
          y: canvas.height + 10,
          vx: Math.cos(theta) * speed,
          vy: Math.sin(theta) * speed,
          radius: Math.random() * 4 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          opacity: 1,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          wobble: Math.random() * 10,
          wobbleSpeed: Math.random() * 0.1 + 0.05,
          gravity: 0.2,
          drag: 0.98
        });
      }
    };
    
    // Shoot from bottom left (pointing up-right, -45 degrees = -pi/4)
    createBurst(0, -Math.PI / 4, 1.2);
    // Shoot from bottom right (pointing up-left, -135 degrees = -3*pi/4)
    createBurst(canvas.width, -3 * Math.PI / 4, 1.2);
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      
      confettiParticles.forEach(p => {
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.006; // fade out slowly
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;
        
        const drift = Math.sin(p.wobble) * 1.5;
        
        if (p.opacity > 0 && p.y < canvas.height + 20) {
          active = true;
          ctx.save();
          ctx.translate(p.x + drift, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          
          ctx.beginPath();
          if (p.shape === 'circle') {
            ctx.arc(0, 0, p.radius, 0, 2 * Math.PI);
            ctx.fill();
          } else if (p.shape === 'triangle') {
            ctx.moveTo(0, -p.radius);
            ctx.lineTo(p.radius, p.radius);
            ctx.lineTo(-p.radius, p.radius);
            ctx.closePath();
            ctx.fill();
          } else if (p.shape === 'heart') {
            ctx.arc(-p.radius / 2, 0, p.radius / 2, Math.PI, 0, false);
            ctx.arc(p.radius / 2, 0, p.radius / 2, Math.PI, 0, false);
            ctx.lineTo(0, p.radius);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 1.5);
          }
          
          ctx.restore();
        }
      });
      
      if (active) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    
    animate();
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
          
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.75);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // 7. Handle File Selection
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const validFiles = [];
    const validPreviews = [];
    
    for (let file of files) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      if (!isVideo && !isImage) {
        alert(`Tệp "${file.name}" không hợp lệ. Chỉ chấp nhận Ảnh & Video!`);
        continue;
      }
      
      const sizeLimit = isVideo ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
      if (file.size > sizeLimit) {
        const sizeLabel = isVideo ? "50MB" : "15MB";
        alert(`Tệp "${file.name}" vượt quá dung lượng giới hạn (${sizeLabel})!`);
        continue;
      }
      
      if (isVideo) {
        try {
          const duration = await new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
              window.URL.revokeObjectURL(video.src);
              resolve(video.duration);
            };
            video.onerror = () => {
              resolve(0);
            };
            video.src = window.URL.createObjectURL(file);
          });
          
          if (duration > 180) { // 3 minutes = 180s
            alert(`Video "${file.name}" quá dài (thời lượng tối đa 3 phút)!`);
            continue;
          }
        } catch (err) {
          print("Lỗi kiểm tra thời lượng video:", err);
        }
      }
      
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setFilePreviews(prev => [...prev, ...validPreviews]);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // 8. Submit Wish / RSVP Form
  const handleSubmitWish = async (e) => {
    if (e) e.preventDefault();
    if (!formData.sender_name || !formData.message) return;

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('sender_name', formData.sender_name);
      payload.append('message', formData.message);
      payload.append('attendance_status', formData.attendance_status);
      if (formData.photographer_tag) {
        payload.append('photographer_tag', formData.photographer_tag);
      }
      
      if (selectedFiles.length > 0) {
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

      await axios.post(`${API_BASE}/wishes`, payload);

      // Reset Form & Close
      const opts = getAttendanceOptions();
      const defaultStatus = opts[0]?.value || 'attending';
      setFormData({ sender_name: '', message: '', photographer_tag: '', attendance_status: defaultStatus });
      setRsvpType(defaultStatus);
      setCustomAttendance('');
      setSelectedFiles([]);
      setFilePreviews([]);
      setIsSubmitOpen(false);
      
      triggerCapToss();
      triggerConfetti();
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

  const saveTimelineItem = async (idx, updatedItem) => {
    const newItems = [...editTimelineItems];
    newItems[idx] = updatedItem;
    setEditTimelineItems(newItems);
    setEditingTimelineIndex(null);
    try {
      const headers = { 'X-Admin-Key': adminKey };
      await axios.post(`${API_BASE}/admin/settings`, { timeline: JSON.stringify(newItems) }, { headers });
      fetchPublicData();
    } catch (err) {
      console.error("Cập nhật lịch trình lỗi:", err);
    }
  };

  const addTimelineItem = async () => {
    const newItem = { time: '00:00 - 00:00', title: 'Hoạt động mới', desc: 'Mô tả hoạt động mới', icon: 'Info' };
    const newItems = [...editTimelineItems, newItem];
    setEditTimelineItems(newItems);
    setEditingTimelineIndex(newItems.length - 1);
    setEditingTimelineItem(newItem);
    try {
      const headers = { 'X-Admin-Key': adminKey };
      await axios.post(`${API_BASE}/admin/settings`, { timeline: JSON.stringify(newItems) }, { headers });
      fetchPublicData();
    } catch (err) {
      console.error("Thêm hoạt động lỗi:", err);
    }
  };

  const deleteTimelineItem = async (idx) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hoạt động này?")) return;
    const newItems = editTimelineItems.filter((_, i) => i !== idx);
    setEditTimelineItems(newItems);
    setEditingTimelineIndex(null);
    try {
      const headers = { 'X-Admin-Key': adminKey };
      await axios.post(`${API_BASE}/admin/settings`, { timeline: JSON.stringify(newItems) }, { headers });
      fetchPublicData();
    } catch (err) {
      console.error("Xóa hoạt động lỗi:", err);
    }
  };

  const updateLocationTitle = async () => {
    try {
      const headers = { 'X-Admin-Key': adminKey };
      await axios.post(`${API_BASE}/admin/settings`, { location_title: editLocationTitle }, { headers });
      setIsEditingLocationTitle(false);
      fetchPublicData();
    } catch (err) {
      console.error("Cập nhật tên hội trường lỗi:", err);
    }
  };

  const updateLocationSubtitle = async () => {
    try {
      const headers = { 'X-Admin-Key': adminKey };
      await axios.post(`${API_BASE}/admin/settings`, { location_subtitle: editLocationSubtitle }, { headers });
      setIsEditingLocationSubtitle(false);
      fetchPublicData();
    } catch (err) {
      console.error("Cập nhật địa chỉ hội trường lỗi:", err);
    }
  };

  const updateLocationParking = async () => {
    try {
      const headers = { 'X-Admin-Key': adminKey };
      await axios.post(`${API_BASE}/admin/settings`, { location_parking: editLocationParking }, { headers });
      setIsEditingLocationParking(false);
      fetchPublicData();
    } catch (err) {
      console.error("Cập nhật thông tin đỗ xe lỗi:", err);
    }
  };

  const toggleGalleryLock = async (checked) => {
    try {
      const headers = { 'X-Admin-Key': adminKey };
      await axios.post(`${API_BASE}/admin/settings`, { gallery_unlocked: checked ? 'true' : 'false' }, { headers });
      fetchPublicData();
    } catch (err) {
      console.error("Lỗi thay đổi trạng thái khóa thư viện:", err);
    }
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    setEditAvatarLoading(true);
    try {
      const payload = new FormData();
      payload.append('file', file);
      
      const headers = { 
        'X-Admin-Key': adminKey
      };
      const res = await axios.post(`${API_BASE}/admin/upload`, payload, { headers });
      setEditAvatarUrl(res.data.url);
    } catch (err) {
      console.error("Tải avatar lên thất bại:", err);
      alert(err.response?.data?.detail || "Tải avatar lên thất bại!");
    } finally {
      setEditAvatarLoading(false);
    }
  };

  const saveAdminSettings = async () => {
    try {
      const headers = { 'X-Admin-Key': adminKey };
      const payload = {
        site_title: editSiteTitle,
        graduation_time: editGraduationTime,
        invitation_desc: editInvitationDesc,
        avatar_url: editAvatarUrl,
        gallery_unlocked: editGalleryUnlocked ? 'true' : 'false'
      };
      await axios.post(`${API_BASE}/admin/settings`, payload, { headers });
      setIsAdminSettingsOpen(false);
      fetchPublicData();
    } catch (err) {
      console.error("Lưu cấu hình lỗi:", err);
      alert("Lưu cấu hình thất bại!");
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
    window.location.href = '/'; 
  };

  // Filter wishes logic for feed
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

  const uniqueTags = ['all', 'attending', 'absent'];

  const filteredWishes = selectedTag === 'all' 
    ? activeWishesList 
    : selectedTag === 'attending'
      ? activeWishesList.filter(w => w.attendance_status === 'attending' || w.attendance_status === 'attending_ceremony' || w.attendance_status === 'attended')
      : activeWishesList.filter(w => w.attendance_status === 'absent');

  const allMediaItems = wishes
    .filter(w => w.is_approved && !w.is_deleted)
    .reduce((acc, w) => {
      if (w.image_urls && w.image_urls.length > 0) {
        w.image_urls.forEach(url => acc.push({ url, sender_name: w.sender_name, wish: w }));
      } else if (w.image_url) {
        acc.push({ url: w.image_url, sender_name: w.sender_name, wish: w });
      }
      return acc;
    }, []);

  const getFormattedGraduationDate = () => {
    try {
      const gradDate = new Date(settings.graduation_time);
      if (isNaN(gradDate.getTime())) {
        return {
          dateStr: 'Ngày 16 tháng 06 năm 2026',
          timeStr: 'Thứ Ba, vào lúc 08:00 sáng'
        };
      }
      
      const day = gradDate.getDate();
      const month = String(gradDate.getMonth() + 1).padStart(2, '0');
      const year = gradDate.getFullYear();
      
      const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayOfWeekStr = daysOfWeek[gradDate.getDay()];
      
      const hours = gradDate.getHours();
      const minutes = String(gradDate.getMinutes()).padStart(2, '0');
      const period = hours >= 12 ? 'chiều' : 'sáng';
      const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      const displayHoursStr = String(displayHours).padStart(2, '0');
      
      return {
        dateStr: `Ngày ${day} tháng ${month} năm ${year}`,
        timeStr: `${dayOfWeekStr}, vào lúc ${displayHoursStr}:${minutes} ${period}`
      };
    } catch (e) {
      return {
        dateStr: 'Ngày 16 tháng 06 năm 2026',
        timeStr: 'Thứ Ba, vào lúc 08:00 sáng'
      };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3a060b] via-[#5c0e17] to-[#1e0305] text-[#fceade] font-sans selection:bg-[#gold-primary]/30 relative pb-28 border-4 border-[#ffb703]/20 m-0 md:m-3 rounded-none md:rounded-3xl shadow-2xl">
      
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
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveView(activeView === 'monitoring' ? 'home' : 'monitoring')}
                className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all ${
                  activeView === 'monitoring'
                    ? 'bg-[#ffb703] text-[#1a0508] border-[#ffb703] font-bold shadow-glow-gold'
                    : 'bg-[#4a121a] hover:bg-[#ffb703]/25 text-[#ffb703] border-[#ffb703]/20'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Giám sát</span>
              </button>
              <button 
                onClick={() => setIsAdminSettingsOpen(true)}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#4a121a] hover:bg-[#ffb703]/25 text-[#ffb703] border border-[#ffb703]/20 flex items-center gap-1 transition-all"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Cấu hình</span>
              </button>
              <button 
                onClick={logoutAdmin}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#4a121a] hover:bg-[#800020] text-[#fceade] border border-[#ffb703]/10 transition-colors"
              >
                Thoát Admin
              </button>
            </div>
          </div>
        )}

        {/* 🎓 LOGO & HEADER */}
        <header className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#800020] to-[#ffb703] p-[2px] shadow-glow-burgundy mb-3 overflow-hidden">
            <div className="w-full h-full rounded-full bg-[#4a0e17] flex items-center justify-center overflow-hidden">
              {settings.avatar_url ? (
                <img 
                  src={settings.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <Award className="w-12 h-12 text-[#ffb703]" />
              )}
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#fceade] via-[#ffb703] to-[#fceade] bg-clip-text text-transparent">
            {settings.site_title || 'QUANG TÙNG GRADUATION'}
          </h1>
          <p className="text-xs text-[#ffb703] font-bold tracking-widest uppercase mt-1">Lễ Tốt Nghiệp Cử Nhân</p>
        </header>

        {/* ==================== VIEW 1: HOME / INVITATION ==================== */}
        {activeView === 'home' && (
          <div className="space-y-6 animate-fade-in">
            {/* 📜 ELEGANT INVITATION CARD */}
            <section className="bg-gradient-to-br from-[#4a0e17] via-[#2d0b11] to-[#150305] border-2 border-[#ffb703]/50 rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6)] shadow-glow-gold/10 relative overflow-hidden select-none text-center">
              {/* Outer decorative borders and corner frames */}
              <div className="absolute inset-2.5 border border-[#ffb703]/25 rounded-2xl pointer-events-none"></div>
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[#ffb703]/60 pointer-events-none"></div>
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[#ffb703]/60 pointer-events-none"></div>
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[#ffb703]/60 pointer-events-none"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[#ffb703]/60 pointer-events-none"></div>
              
              <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-[#ffb703]/5 blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-[#800020]/10 blur-2xl pointer-events-none"></div>

              {/* 1. Header Pill */}
              <div className="inline-block px-3 py-1 rounded-full bg-[#ffb703]/10 border border-[#ffb703]/30 mb-4 shadow-[0_2px_10px_rgba(255,183,3,0.05)]">
                <span className="text-[9px] font-black tracking-[0.25em] text-[#ffb703] uppercase block pl-[0.25em]">
                  TRÂN TRỌNG KÍNH MỜI
                </span>
              </div>

              {/* 2. Main Title */}
              <h2 className="text-2xl font-black bg-gradient-to-r from-[#fceade] via-[#ffb703] to-[#fceade] bg-clip-text text-transparent tracking-wide mb-1 leading-normal">
                LỄ TỐT NGHIỆP
              </h2>

              {/* 3. Ornamental Divider */}
              <div className="flex items-center justify-center gap-2.5 my-3.5">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#ffb703]/60"></div>
                <span className="text-[10px] text-[#ffb703]/75">❖</span>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#ffb703]/60"></div>
              </div>

              {/* 4. Elegant Text Body */}
              <div className="my-5 px-3 py-3.5 bg-[#150305]/65 border border-[#ffb703]/10 rounded-2xl max-w-[95%] mx-auto backdrop-blur-sm relative">
                <p className="text-[11px] sm:text-xs text-[#d0a5aa] leading-relaxed font-semibold italic text-justify sm:text-center">
                  "{settings.invitation_desc || 'Sự hiện diện của mọi người là niềm vinh dự và là nguồn động viên to lớn để Tùng vững bước trên chặng đường sắp tới. Trân trọng kính mời mọi người đến tham dự và chung vui cùng Tùng trong buổi lễ tốt nghiệp đầy ý nghĩa này.'}"
                </p>
              </div>

              {/* 5. Date & Location Cards */}
              <div className="grid grid-cols-1 gap-3.5 max-w-[95%] mx-auto mt-5">
                
                {/* Date card */}
                <div className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-r from-[#5c1620]/30 to-[#2d0b11]/50 border border-[#ffb703]/15 flex items-center gap-4 shadow-md transition-all hover:border-[#ffb703]/30">
                  <div className="w-10 h-10 rounded-xl bg-[#ffb703]/10 border border-[#ffb703]/25 flex items-center justify-center text-[#ffb703] shrink-0 shadow-[0_2px_8px_rgba(255,183,3,0.1)]">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-[#ffb703]/85 tracking-widest uppercase">THỜI GIAN</p>
                    <p className="text-xs font-black text-[#fceade] mt-0.5">{getFormattedGraduationDate().dateStr}</p>
                    <p className="text-[10px] text-[#d0a5aa] font-semibold">{getFormattedGraduationDate().timeStr}</p>
                  </div>
                </div>

                {/* Location card */}
                <div className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-r from-[#5c1620]/30 to-[#2d0b11]/50 border border-[#ffb703]/15 flex items-center gap-4 shadow-md transition-all hover:border-[#ffb703]/30">
                  <div className="w-10 h-10 rounded-xl bg-[#ffb703]/10 border border-[#ffb703]/25 flex items-center justify-center text-[#ffb703] shrink-0 shadow-[0_2px_8px_rgba(255,183,3,0.1)]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-[#ffb703]/85 tracking-widest uppercase">ĐỊA ĐIỂM</p>
                    <p className="text-xs font-black text-[#fceade] mt-0.5">{settings.location_title || 'Hội trường chính'}</p>
                    <p className="text-[10px] text-[#d0a5aa] font-semibold truncate leading-normal">{settings.location_subtitle || 'Đại học Duy Tân 03 Quang Trung Đà Nẵng'}</p>
                  </div>
                </div>

              </div>
            </section>

            {/* ⏳ COUNTDOWN WIDGET */}
            <section className="p-5 rounded-3xl bg-[#2d0b11]/50 border border-[#5c1620]/30 backdrop-blur-md shadow-glow-burgundy text-center relative">
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

              {isEditingTime && (
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
              )}

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

            {/* ✉️ RSVP QUICK FORM */}
            {!isAdminMode && (
              <section className="bg-[#2d0b11]/40 border border-[#5c1620]/30 rounded-3xl p-5 shadow-lg text-left relative">
                <h3 className="text-sm font-black text-[#ffb703] tracking-widest uppercase mb-4 flex items-center gap-1.5 border-b border-[#4a121a] pb-2">
                  <Send className="w-4 h-4 text-[#ffb703]" />
                  <span>XÁC NHẬN THAM DỰ</span>
                </h3>
                
                <form onSubmit={handleSubmitWish} className="space-y-4">
                  
                  {/* 1. Sender Name */}
                  <div>
                    <label className="text-[9px] font-bold text-[#ffb703] block mb-1">TÊN CỦA CẬU *</label>
                    <input
                      type="text"
                      required
                      value={formData.sender_name}
                      onChange={(e) => setFormData({...formData, sender_name: e.target.value})}
                      placeholder="Nhập tên của cậu để xác nhận..."
                      className="w-full bg-[#150305] border border-[#4a121a] rounded-xl px-3 py-2 text-xs text-[#fceade] focus:outline-none focus:border-[#ffb703]"
                    />
                  </div>

                  {/* 2. Attendance Status Buttons */}
                  <div>
                    <label className="text-[9px] font-bold text-[#ffb703] block mb-1">CẬU CÓ THỂ THAM GIA CÙNG TÙNG KHÔNG? *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {getAttendanceOptions().map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData({...formData, attendance_status: opt.value})}
                          className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                            formData.attendance_status === opt.value
                              ? 'bg-[#ffb703]/25 text-[#ffb703] border-[#ffb703]'
                              : 'bg-[#150305] text-[#d0a5aa] border-[#4a121a]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Wish Message */}
                  <div>
                    <label className="text-[9px] font-bold text-[#ffb703] block mb-1">TIN NHẮN / LỜI CHÚC NGẮN *</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="Gửi vài lời chia vui cùng Tùng nhé..."
                      className="w-full bg-[#150305] border border-[#4a121a] rounded-xl px-3 py-2 text-xs text-[#fceade] focus:outline-none focus:border-[#ffb703]"
                    />
                  </div>

                  {/* 5. Image & Video File Upload */}
                  <div>
                    <label className="text-[9px] font-bold text-[#ffb703] block mb-1">ĐÍNH KÈM ẢNH & VIDEO KỶ NIỆM (TÙY CHỌN)</label>
                    
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
                      <span className="text-[10px] text-[#ffb703] font-bold">NHẤN VÀO ĐỂ TẢI ẢNH & VIDEO KỶ NIỆM</span>
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

                  <button
                    type="submit"
                    disabled={loading || !formData.sender_name || !formData.message}
                    className="w-full py-2.5 bg-gradient-to-r from-[#800020] to-[#ffb703] text-[#1a0508] text-xs font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-glow-gold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>XÁC NHẬN & GỬI LỜI CHÚC 🎓</span>
                  </button>
                </form>
              </section>
            )}
          </div>
        )}

        {/* ==================== VIEW 2: LOGISTICS & TIMELINE ==================== */}
        {activeView === 'logistics' && (
          <div className="space-y-6 animate-fade-in">
            {/* 🟢 LIVE LOCATION BANNER */}
            <section className="p-4 rounded-2xl bg-gradient-to-r from-[#2d0b11] via-[#4a121a] to-[#2d0b11] border border-[#ffb703]/40 shadow-glow-gold relative group overflow-hidden">
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

            {/* 📅 INTERACTIVE EVENT TIMELINE */}
            <section className="bg-[#2d0b11]/40 border border-[#5c1620]/30 backdrop-blur-md rounded-3xl p-5 shadow-lg">
              <h3 className="text-xs font-black text-[#ffb703] tracking-widest uppercase mb-4 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#ffb703]" />
                <span>LỊCH TRÌNH NGÀY LỄ TỐT NGHIỆP</span>
              </h3>
              
              <div className="relative border-l-2 border-[#ffb703]/20 ml-2.5 pl-6 space-y-6">
                {editTimelineItems.map((item, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle icon marker */}
                    <div className="absolute -left-[37px] top-0.5 bg-[#4a0e17] border-2 border-[#ffb703] p-1 rounded-full text-[#ffb703]">
                      {renderTimelineIcon(item.icon)}
                    </div>
                    
                    {editingTimelineIndex === idx ? (
                      <div className="bg-[#1a0508]/85 border border-[#ffb703]/30 p-3 rounded-xl space-y-2 mt-1">
                        <input
                          type="text"
                          value={editingTimelineItem.time}
                          onChange={(e) => setEditingTimelineItem({ ...editingTimelineItem, time: e.target.value })}
                          className="w-full bg-[#150305] border border-[#4a121a] rounded px-2 py-1 text-xs text-[#fceade]"
                          placeholder="Thời gian (VD: 08:00 - 09:00)"
                        />
                        <input
                          type="text"
                          value={editingTimelineItem.title}
                          onChange={(e) => setEditingTimelineItem({ ...editingTimelineItem, title: e.target.value })}
                          className="w-full bg-[#150305] border border-[#4a121a] rounded px-2 py-1 text-xs font-bold text-[#fceade]"
                          placeholder="Tiêu đề hoạt động"
                        />
                        <textarea
                          value={editingTimelineItem.desc}
                          onChange={(e) => setEditingTimelineItem({ ...editingTimelineItem, desc: e.target.value })}
                          className="w-full bg-[#150305] border border-[#4a121a] rounded px-2 py-1 text-xs text-[#d0a5aa]"
                          placeholder="Mô tả chi tiết"
                          rows={2}
                        />
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={editingTimelineItem.icon}
                            onChange={(e) => setEditingTimelineItem({ ...editingTimelineItem, icon: e.target.value })}
                            className="bg-[#150305] border border-[#4a121a] rounded text-xs px-2 py-1 text-[#ffb703]"
                          >
                            <option value="Camera">Máy ảnh 📷</option>
                            <option value="Award">Bằng tốt nghiệp 🎓</option>
                            <option value="MapPin">Địa điểm 📍</option>
                            <option value="Info">Thông tin ℹ️</option>
                          </select>
                          <div className="flex gap-1">
                            <button
                              onClick={() => saveTimelineItem(idx, editingTimelineItem)}
                              className="px-2 py-1 bg-[#ffb703] text-[#1a0508] rounded text-xs font-bold flex items-center gap-0.5"
                            >
                              <Check className="w-3.5 h-3.5" /> Lưu
                            </button>
                            <button
                              onClick={() => setEditingTimelineIndex(null)}
                              className="px-2 py-1 bg-[#4a121a] rounded text-xs"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="group relative">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[9px] font-bold tracking-wider text-[#ffb703] uppercase block">{item.time}</span>
                            <h4 className="text-xs font-black text-[#fceade] mt-0.5">{item.title}</h4>
                            <p className="text-[10px] text-[#d0a5aa] mt-1 leading-relaxed">{item.desc}</p>
                          </div>
                          {isAdminMode && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                              <button
                                onClick={() => {
                                  setEditingTimelineIndex(idx);
                                  setEditingTimelineItem(item);
                                }}
                                className="p-1 text-[#ffb703] hover:text-[#fceade] transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteTimelineItem(idx)}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isAdminMode && (
                  <div className="pt-2 flex justify-center">
                    <button
                      onClick={addTimelineItem}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#4a0e17] border border-[#ffb703]/30 hover:border-[#ffb703]/60 text-[#ffb703] text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm hoạt động mới</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* 🗺️ EVENT LOCATION MAP CARD */}
            <section className="bg-[#2d0b11]/40 border border-[#5c1620]/30 backdrop-blur-md rounded-3xl p-5 shadow-lg text-center space-y-4">
              <h3 className="text-xs font-black text-[#ffb703] tracking-widest uppercase text-left flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#ffb703]" />
                <span>ĐỊA ĐIỂM & SƠ ĐỒ KHU VỰC</span>
              </h3>
              
              <div className="p-4 rounded-2xl bg-[#150305] border border-[#4a121a] text-left space-y-3">
                <div>
                  <span className="text-[8px] font-bold text-[#ffb703] uppercase">HỘI TRƯỜNG TỔ CHỨC:</span>
                  
                  {isEditingLocationTitle ? (
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        value={editLocationTitle}
                        onChange={(e) => setEditLocationTitle(e.target.value)}
                        className="flex-1 bg-[#1a0508] border border-[#ffb703]/40 rounded-lg px-2 py-1 text-xs text-[#fceade] focus:outline-none"
                      />
                      <button onClick={updateLocationTitle} className="p-1 bg-[#ffb703] text-[#1a0508] rounded-lg">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setIsEditingLocationTitle(false)} className="p-1 bg-[#4a121a] rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#fceade] font-bold mt-0.5">{settings.location_title || 'Hội trường chính'}</p>
                      {isAdminMode && (
                        <button 
                          onClick={() => setIsEditingLocationTitle(true)}
                          className="p-1 text-[#ffb703] hover:text-[#fceade] transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {isEditingLocationSubtitle ? (
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        value={editLocationSubtitle}
                        onChange={(e) => setEditLocationSubtitle(e.target.value)}
                        className="flex-1 bg-[#1a0508] border border-[#ffb703]/40 rounded-lg px-2 py-1 text-xs text-[#fceade] focus:outline-none"
                      />
                      <button onClick={updateLocationSubtitle} className="p-1 bg-[#ffb703] text-[#1a0508] rounded-lg">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setIsEditingLocationSubtitle(false)} className="p-1 bg-[#4a121a] rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-[#d0a5aa] mt-0.5">{settings.location_subtitle || 'Đại học Duy Tân 03 Quang Trung Đà Nẵng'}</p>
                      {isAdminMode && (
                        <button 
                          onClick={() => setIsEditingLocationSubtitle(true)}
                          className="p-1 text-[#ffb703] hover:text-[#fceade] transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isEditingLocationParking ? (
                  <div className="mt-1 flex gap-2">
                    <textarea
                      value={editLocationParking}
                      onChange={(e) => setEditLocationParking(e.target.value)}
                      rows={2}
                      className="flex-1 bg-[#1a0508] border border-[#ffb703]/40 rounded-lg px-2 py-1 text-xs text-[#fceade] focus:outline-none"
                    />
                    <button onClick={updateLocationParking} className="p-1 bg-[#ffb703] text-[#1a0508] rounded-lg self-end">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsEditingLocationParking(false)} className="p-1 bg-[#4a121a] rounded-lg self-end">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between border-t border-[#4a121a]/30 pt-2.5 mt-2">
                    <div className="text-[10px] text-[#d0a5aa] leading-relaxed flex-1">
                      {settings.location_parking || '🚗 Thông tin đỗ xe: Khách gửi xe tại bãi gửi xe của trường Đại học Duy Tân.'}
                    </div>
                    {isAdminMode && (
                      <button 
                        onClick={() => setIsEditingLocationParking(true)}
                        className="p-1 text-[#ffb703] hover:text-[#fceade] transition-colors shrink-0 ml-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.current_location)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#800020] to-[#ffb703] text-[#1a0508] font-bold text-xs shadow-glow-gold hover:scale-[1.03] active:scale-95 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>CHỈ ĐƯỜNG TRÊN GOOGLE MAPS</span>
              </a>
            </section>
          </div>
        )}

        {/* ==================== VIEW 3: GUESTBOOK & WISH FEED ==================== */}
        {activeView === 'guestbook' && (
          <div className="space-y-4 animate-fade-in">
            {/* 🎬 SLIDESHOW LAUNCHER CARD */}
            <section className="bg-gradient-to-r from-[#4a0e17]/80 to-[#2d0b11]/80 border border-[#ffb703]/30 rounded-2xl p-4 flex items-center justify-between shadow-glow-burgundy">
              <div className="flex-1 pr-3">
                <h4 className="text-xs font-bold text-[#ffb703]">Trình Chiếu Lời Chúc</h4>
                <p className="text-[9px] text-[#d0a5aa] mt-0.5 leading-relaxed">Bật trình chiếu xoay vòng lời chúc & hình ảnh trên màn hình lớn.</p>
              </div>
              <button
                onClick={() => {
                  setSlideshowIndex(0);
                  setIsSlideshowOpen(true);
                }}
                disabled={wishes.length === 0}
                className="px-3 py-2 bg-[#ffb703] text-[#1a0508] rounded-xl text-xs font-extrabold shadow-glow-gold hover:scale-105 transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Trình Chiếu</span>
              </button>
            </section>

            {/* 📑 ADMIN TABS */}
            {isAdminMode && (
              <div className="grid grid-cols-3 gap-2">
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
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-[#ffb703]" />
                  <span className="text-[11px] font-extrabold tracking-widest text-[#d0a5aa]">BẢNG TIN LỜI CHÚC</span>
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
                    {tag === 'all' ? 'TẤT CẢ 🌟' : tag === 'attending' ? 'SẼ ĐẾN DỰ LỄ 🎓' : 'CHÚC TỪ XA 💌'}
                  </button>
                ))}
              </div>
            </section>

            {/* FEED CARDS DISPLAY */}
            <main className="space-y-4">
              {filteredWishes.length === 0 ? (
                <div className="text-center p-8 rounded-2xl bg-[#2d0b11]/30 border border-[#4a121a]/30 text-xs text-[#d0a5aa] leading-relaxed">
                  🍿 Hiện chưa có thiệp chúc nào trong nhóm này. Hãy bấm nút "+" phía dưới để gửi lời chúc & ảnh đầu tiên nhé.
                </div>
              ) : (
                filteredWishes.map((wish) => (
                  <div 
                    key={wish.id} 
                    className="bg-[#2d0b11]/40 border border-[#5c1620]/30 backdrop-blur-md rounded-2xl p-4 shadow-lg relative overflow-hidden group"
                  >
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
                      {!isAdminMode && (
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                          (wish.attendance_status === 'attending' || wish.attendance_status === 'attending_ceremony' || wish.attendance_status === 'attended')
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-stone-500/15 text-[#d0a5aa] border border-stone-500/20'
                        }`}>
                          {wish.attendance_status === 'attending' 
                            ? '🎓 SẼ ĐẾN DỰ LỄ' 
                            : wish.attendance_status === 'attending_ceremony'
                            ? '📸 ĐANG Ở BUỔI LỄ'
                            : wish.attendance_status === 'attended'
                            ? '🎓 ĐÃ THAM GIA'
                            : '💌 CHÚC TỪ XA'}
                        </span>
                      )}
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
                      {wish.created_at ? (() => {
                        const dateObj = new Date(wish.created_at.endsWith('Z') ? wish.created_at : wish.created_at + 'Z');
                        return `${dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${dateObj.toLocaleDateString('vi-VN')}`;
                      })() : ''}
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
          </div>
        )}

        {/* ==================== VIEW 4: PHOTO GALLERY ==================== */}
        {activeView === 'gallery' && (
          <div className="space-y-6 animate-fade-in text-center py-6">
            {isAdminMode || settings.gallery_unlocked === 'true' ? (
              <div className="space-y-6">
                <section className="bg-gradient-to-br from-[#2d0b11]/70 via-[#4a0e17]/50 to-[#1e0305]/75 border border-[#ffb703]/20 backdrop-blur-md rounded-3xl p-6 shadow-glow-burgundy space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#150305] border border-[#ffb703]/30 text-[#ffb703] mb-1">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-extrabold text-[#fceade] tracking-wide uppercase">THƯ VIỆN KỶ NIỆM</h2>
                  <p className="text-xs text-[#d0a5aa] max-w-[85%] mx-auto font-medium">
                    Kho lưu trữ hình ảnh chất lượng cao tại buổi lễ.
                  </p>
                  {isAdminMode && (
                    <div className="flex flex-col items-center gap-2 pt-2 border-t border-[#4a121a]/30">
                      <div className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl py-1 px-3 inline-block font-bold">
                        👑 Chế độ Admin: Bạn có quyền xem trước thư viện ảnh
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="checkbox"
                          id="gallery_unlocked_page_checkbox"
                          checked={settings.gallery_unlocked === 'true'}
                          onChange={(e) => toggleGalleryLock(e.target.checked)}
                          className="w-4 h-4 rounded border-[#4a121a] bg-[#150305] text-[#ffb703] focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="gallery_unlocked_page_checkbox" className="text-[10px] font-bold text-[#ffb703] cursor-pointer">
                          MỞ KHÓA THƯ VIỆN ẢNH CHO KHÁCH MỜI
                        </label>
                      </div>
                    </div>
                  )}
                </section>

                {allMediaItems.length === 0 ? (
                  <div className="text-center p-12 rounded-3xl bg-[#2d0b11]/30 border border-[#4a121a]/30 text-xs text-[#d0a5aa] leading-relaxed">
                    📷 Chưa có hình ảnh hay video nào được đăng tải. Hãy gửi lời chúc kèm hình ảnh/video để xuất hiện tại đây nhé!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {allMediaItems.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="relative group rounded-2xl overflow-hidden border border-[#ffb703]/25 bg-[#150305] aspect-square cursor-pointer hover:border-[#ffb703] transition-all shadow-md"
                        onClick={() => setZoomedImage(item.url)}
                      >
                        {isVideoUrl(item.url) ? (
                          <div className="w-full h-full relative flex items-center justify-center">
                            <video src={item.url} className="w-full h-full object-cover" preload="metadata" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-[#ffb703]/80 text-[#1a0508] flex items-center justify-center pl-0.5">
                                <span className="text-[10px] text-[#1a0508]">▶</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img src={item.url} alt={`media-${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 text-left opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[9px] font-bold text-[#ffb703] truncate">Từ: {item.sender_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <section className="bg-gradient-to-br from-[#2d0b11]/70 via-[#4a0e17]/50 to-[#1e0305]/75 border border-[#ffb703]/20 backdrop-blur-md rounded-3xl p-8 shadow-glow-burgundy space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#150305] border border-[#ffb703]/30 text-[#ffb703] animate-pulse mb-2">
                  <Camera className="w-8 h-8" />
                </div>
                
                <h2 className="text-lg font-extrabold text-[#fceade] tracking-wide">THƯ VIỆN KỶ NIỆM</h2>
                <p className="text-xs text-[#d0a5aa] leading-relaxed max-w-[85%] mx-auto font-medium">
                  Kho lưu trữ hình ảnh chất lượng cao tại buổi lễ.
                </p>
                
                <div className="py-2.5 px-4 rounded-xl bg-[#150305]/60 border border-[#ffb703]/10 inline-block text-[10px] font-bold text-[#ffb703] tracking-widest uppercase">
                  🔒 SẼ MỞ SAU NGÀY LỄ TỐT NGHIỆP
                </div>

                <div className="h-[1px] w-full bg-[#4a121a]/40 my-6"></div>

                <div className="p-4 rounded-2xl bg-[#150305]/60 border border-[#ffb703]/10 text-xs text-[#d0a5aa] leading-relaxed max-w-xs mx-auto">
                  📸 Hình ảnh/video từ buổi lễ tốt nghiệp của Quang Tùng đang được tổng hợp và xử lý. Thư viện sẽ tự động mở khóa sau khi buổi lễ chính thức kết thúc để khách mời có thể vào xem và tải về.
                </div>
              </section>
            )}
          </div>
        )}

        {/* ==================== VIEW 5: MONITORING / TRAFFIC ==================== */}
        {activeView === 'monitoring' && isAdminMode && (
          <div className="space-y-6 animate-fade-in">
            {/* Title Banner */}
            <section className="bg-gradient-to-br from-[#2d0b11]/70 via-[#4a0e17]/50 to-[#1e0305]/75 border border-[#ffb703]/20 backdrop-blur-md rounded-3xl p-5 shadow-glow-burgundy space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#150305] border border-[#ffb703]/30 text-[#ffb703]">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-[#fceade] tracking-wide uppercase">GIÁM SÁT TRUY CẬP</h2>
                    <p className="text-[9px] text-[#d0a5aa] font-medium">Lưu lượng truy cập trang web thời gian thực</p>
                  </div>
                </div>
                <button
                  onClick={fetchTrafficStats}
                  disabled={trafficLoading}
                  className="p-2 rounded-xl bg-[#4a121a] hover:bg-[#ffb703]/20 border border-[#ffb703]/20 text-[#ffb703] transition-all flex items-center justify-center animate-hover"
                  title="Làm mới"
                >
                  <RefreshCw className={`w-4 h-4 ${trafficLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </section>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2">
              {/* Card 1: Active Users */}
              <div className="bg-[#2d0b11]/40 border border-[#5c1620]/30 backdrop-blur-md rounded-2xl p-3 text-center relative overflow-hidden flex flex-col justify-between">
                <span className="text-[8px] font-bold text-[#d0a5aa] uppercase tracking-wider block">Trực tuyến</span>
                <div className="flex items-center justify-center gap-1.5 my-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {trafficStats.active_users}
                  </span>
                </div>
                <span className="text-[7px] text-[#d0a5aa]/60 block font-medium">(Trong 5 phút)</span>
              </div>

              {/* Card 2: Page Views */}
              <div className="bg-[#2d0b11]/40 border border-[#5c1620]/30 backdrop-blur-md rounded-2xl p-3 text-center flex flex-col justify-between">
                <span className="text-[8px] font-bold text-[#d0a5aa] uppercase tracking-wider block">Lượt Xem</span>
                <span className="text-xl font-black text-[#ffb703] font-mono my-2 block">
                  {trafficStats.total_views}
                </span>
                <span className="text-[7px] text-[#d0a5aa]/60 block font-medium">Tổng lượt tải</span>
              </div>

              {/* Card 3: Unique Visitors */}
              <div className="bg-[#2d0b11]/40 border border-[#5c1620]/30 backdrop-blur-md rounded-2xl p-3 text-center flex flex-col justify-between">
                <span className="text-[8px] font-bold text-[#d0a5aa] uppercase tracking-wider block">Khách</span>
                <span className="text-xl font-black text-[#ffb703] font-mono my-2 block">
                  {trafficStats.total_visitors}
                </span>
                <span className="text-[7px] text-[#d0a5aa]/60 block font-medium">IP duy nhất</span>
              </div>
            </div>

            {/* Device breakdown & top endpoints */}
            <div className="grid grid-cols-1 gap-4">
              {/* Device breakdown card */}
              <div className="bg-[#2d0b11]/40 border border-[#5c1620]/30 backdrop-blur-md rounded-2xl p-4 space-y-3">
                <h3 className="text-[10px] font-bold tracking-widest text-[#ffb703] uppercase">PHÂN LOẠI THIẾT BỊ</h3>
                
                {(() => {
                  const totalDevices = trafficStats.device_stats.mobile + trafficStats.device_stats.desktop;
                  const mobilePercentage = totalDevices > 0 ? Math.round((trafficStats.device_stats.mobile / totalDevices) * 100) : 0;
                  const desktopPercentage = totalDevices > 0 ? Math.round((trafficStats.device_stats.desktop / totalDevices) * 100) : 0;
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-semibold">
                        <span className="text-[#ffb703]">Mobile: {mobilePercentage}% ({trafficStats.device_stats.mobile})</span>
                        <span className="text-[#d0a5aa]">Desktop: {desktopPercentage}% ({trafficStats.device_stats.desktop})</span>
                      </div>
                      <div className="w-full bg-[#150305] rounded-full h-2.5 overflow-hidden flex border border-[#4a121a]/55">
                        <div style={{ width: `${mobilePercentage}%` }} className="bg-[#ffb703] h-full transition-all duration-500"></div>
                        <div style={{ width: `${desktopPercentage}%` }} className="bg-[#800020] h-full transition-all duration-500"></div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Top Endpoints card */}
              <div className="bg-[#2d0b11]/40 border border-[#5c1620]/30 backdrop-blur-md rounded-2xl p-4 space-y-3">
                <h3 className="text-[10px] font-bold tracking-widest text-[#ffb703] uppercase">TOP 5 TRANG TRUY CẬP NHIỀU NHẤT</h3>
                <div className="space-y-2">
                  {trafficStats.top_endpoints && trafficStats.top_endpoints.length > 0 ? (
                    trafficStats.top_endpoints.map((ep, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-[#150305]/65 border border-[#4a121a]/30 p-2.5 rounded-xl text-xs">
                        <span className="font-mono text-[#d0a5aa] truncate max-w-[70%]">{ep.path}</span>
                        <span className="text-[#ffb703] font-bold shrink-0">{ep.count} view</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-[10px] text-[#d0a5aa]/60 py-2">Chưa có dữ liệu thống kê đường dẫn</div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Logs Table */}
            <div className="bg-[#2d0b11]/40 border border-[#5c1620]/30 backdrop-blur-md rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-[#4a121a]/30 pb-2">
                <h3 className="text-[10px] font-bold tracking-widest text-[#ffb703] uppercase">
                  NHẬT KÝ HOẠT ĐỘNG GẦN ĐÂY ({logsLimit} LƯỢT)
                </h3>
                <button
                  onClick={downloadTrafficCSV}
                  className="px-2.5 py-1 rounded-lg bg-[#4a121a] hover:bg-[#ffb703]/25 text-[#ffb703] border border-[#ffb703]/20 text-[9px] font-bold flex items-center gap-1 transition-all animate-hover"
                  title="Tải toàn bộ nhật ký dạng CSV"
                >
                  <Download className="w-3 h-3" />
                  <span>Xuất CSV</span>
                </button>
              </div>
              
              <div className="overflow-x-auto select-text scrollbar-thin">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-[#4a121a]/40 text-[#ffb703] font-bold">
                      <th className="pb-2 pr-2">Thời Gian</th>
                      <th className="pb-2 pr-2">Địa Chỉ IP</th>
                      <th className="pb-2 pr-2">Đường Dẫn</th>
                      <th className="pb-2">Thiết Bị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#4a121a]/20">
                    {trafficStats.recent_logs && trafficStats.recent_logs.length > 0 ? (
                      trafficStats.recent_logs.map((log) => {
                        // Vietnam time formatting (UTC+7 force)
                        const formatVietnamTime = (isoString) => {
                          if (!isoString) return '';
                          try {
                            const date = new Date(isoString);
                            return date.toLocaleString('vi-VN', {
                              timeZone: 'Asia/Ho_Chi_Minh',
                              hour12: false,
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              day: '2-digit',
                              month: '2-digit'
                            });
                          } catch (e) {
                            return isoString;
                          }
                        };

                        const getShortUA = (ua) => {
                          if (!ua) return 'Unknown';
                          if (ua.includes('iPhone')) return 'iPhone / iOS';
                          if (ua.includes('iPad')) return 'iPad / iOS';
                          if (ua.includes('Android')) {
                            if (ua.includes('Mobi')) return 'Android Mobile';
                            return 'Android Tablet';
                          }
                          if (ua.includes('Windows NT')) return 'Windows Desktop';
                          if (ua.includes('Macintosh')) return 'macOS Desktop';
                          if (ua.includes('Linux')) return 'Linux Desktop';
                          return ua.split(' ')[0] || 'Unknown';
                        };

                        return (
                          <tr key={log.id} className="text-[#fceade]/90 hover:bg-[#150305]/20">
                            <td className="py-2 pr-2 whitespace-nowrap font-mono">{formatVietnamTime(log.timestamp)}</td>
                            <td className="py-2 pr-2 font-mono text-[#ffb703]/80">{log.ip_address}</td>
                            <td className="py-2 pr-2 font-mono truncate max-w-[120px]" title={log.endpoint}>{log.endpoint}</td>
                            <td className="py-2 text-[#d0a5aa]" title={log.user_agent}>{getShortUA(log.user_agent)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-xs text-[#d0a5aa]/60">
                          Chưa ghi nhận hoạt động nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {trafficStats.recent_logs && trafficStats.recent_logs.length >= logsLimit && (
                <div className="pt-2 flex justify-center border-t border-[#4a121a]/20">
                  <button
                    onClick={() => setLogsLimit(prev => prev + 20)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#4a0e17] border border-[#ffb703]/30 hover:border-[#ffb703]/60 text-[#ffb703] text-[9px] font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-md"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Xem thêm nhật ký</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ➕ FLOATING ACTIONS BUTTON FOR SUBMITTING WISH */}
        {!isAdminMode && activeView !== 'home' && (
          <div className="fixed bottom-24 right-6 z-40">
            <button
              onClick={() => setIsSubmitOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#800020] via-[#ffb703] to-[#800020] text-[#1a0508] font-black text-xs tracking-wider uppercase shadow-glow-gold hover:scale-105 active:scale-95 transition-all animate-bounce"
            >
              <Plus className="w-5 h-5 shrink-0" />
              <span>Gửi lời chúc</span>
            </button>
          </div>
        )}

        {/* 📝 WRITE WISH & UPLOAD MODAL */}
        {isSubmitOpen && (
          <div className="fixed inset-0 bg-[#150305]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#2d0b11] border border-[#ffb703]/30 rounded-3xl p-5 max-w-sm w-full shadow-glow-gold max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between mb-4 border-b border-[#4a121a] pb-2">
                <span className="text-xs font-black text-[#ffb703] tracking-widest uppercase flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-[#ffb703]" />
                  <span>XÁC NHẬN THAM DỰ</span>
                </span>
                <button onClick={() => setIsSubmitOpen(false)} className="p-1 rounded-full bg-[#4a121a]/80 text-[#fceade]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitWish} className="space-y-4">
                
                {/* 1. Sender Name */}
                <div>
                  <label className="text-[9px] font-bold text-[#ffb703] block mb-1">TÊN CỦA CẬU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sender_name}
                    onChange={(e) => setFormData({...formData, sender_name: e.target.value})}
                    placeholder="Nhập tên của cậu để xác nhận..."
                    className="w-full bg-[#150305] border border-[#4a121a] rounded-xl px-3 py-2 text-xs text-[#fceade] focus:outline-none focus:border-[#ffb703]"
                  />
                </div>

                {/* 2. Attendance Status Buttons */}
                <div>
                  <label className="text-[9px] font-bold text-[#ffb703] block mb-1">CẬU CÓ THỂ THAM GIA CÙNG TÙNG KHÔNG? *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {getAttendanceOptions().map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({...formData, attendance_status: opt.value})}
                        className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                          formData.attendance_status === opt.value
                            ? 'bg-[#ffb703]/25 text-[#ffb703] border-[#ffb703]'
                            : 'bg-[#150305] text-[#d0a5aa] border-[#4a121a]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Wish Message */}
                <div>
                  <label className="text-[9px] font-bold text-[#ffb703] block mb-1">TIN NHẮN / LỜI CHÚC NGẮN *</label>
                  <textarea
                    required
                    rows={2}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Gửi vài lời chia vui cùng Tùng nhé..."
                    className="w-full bg-[#150305] border border-[#4a121a] rounded-xl px-3 py-2 text-xs text-[#fceade] focus:outline-none focus:border-[#ffb703]"
                  />
                </div>

                {/* 5. Image & Video File Upload */}
                <div>
                  <label className="text-[9px] font-bold text-[#ffb703] block mb-1">ĐÍNH KÈM ẢNH & VIDEO KỶ NIỆM (TÙY CHỌN)</label>
                  
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
                    <span className="text-[10px] text-[#ffb703] font-bold">NHẤN VÀO ĐỂ TẢI ẢNH & VIDEO KỶ NIỆM</span>
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
                  disabled={loading || !formData.sender_name || !formData.message}
                  className="w-full py-2.5 bg-gradient-to-r from-[#800020] to-[#ffb703] text-[#1a0508] text-xs font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-glow-gold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ĐANG NÉN & GỬI...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>XÁC NHẬN & GỬI LỜI CHÚC 🎓</span>
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

        {/* ⚙️ SYSTEM SETTINGS MODAL */}
        {isAdminSettingsOpen && (
          <div className="fixed inset-0 bg-[#150305]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#2d0b11] border border-[#ffb703]/30 rounded-3xl p-6 max-w-sm w-full shadow-glow-gold max-h-[90vh] overflow-y-auto space-y-4">
              
              <div className="flex items-center justify-between mb-2 border-b border-[#4a121a] pb-2">
                <span className="text-xs font-black text-[#ffb703] tracking-widest uppercase flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-[#ffb703]" />
                  <span>CẤU HÌNH HỆ THỐNG</span>
                </span>
                <button onClick={() => setIsAdminSettingsOpen(false)} className="p-1 rounded-full bg-[#4a121a]/80 text-[#fceade]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 1. Site Title */}
                <div>
                  <label className="text-[10px] font-bold text-[#d0a5aa] block mb-1">TIÊU ĐỀ TRANG WEB</label>
                  <input
                    type="text"
                    value={editSiteTitle}
                    onChange={(e) => setEditSiteTitle(e.target.value)}
                    className="w-full bg-[#150305] border border-[#4a121a] rounded-xl px-3 py-2 text-xs text-[#fceade] focus:outline-none focus:border-[#ffb703]"
                  />
                </div>



                {/* 3. Invitation Description */}
                <div>
                  <label className="text-[10px] font-bold text-[#d0a5aa] block mb-1">MÔ TẢ THƯ MỜI</label>
                  <textarea
                    rows={3}
                    value={editInvitationDesc}
                    onChange={(e) => setEditInvitationDesc(e.target.value)}
                    className="w-full bg-[#150305] border border-[#4a121a] rounded-xl px-3 py-2 text-xs text-[#fceade] focus:outline-none focus:border-[#ffb703]"
                  />
                </div>

                {/* 4. Avatar Upload */}
                <div>
                  <label className="text-[10px] font-bold text-[#d0a5aa] block mb-1">ẢNH ĐẠI DIỆN (AVATAR URL)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      className="flex-1 bg-[#150305] border border-[#4a121a] rounded-xl px-3 py-2 text-xs text-[#fceade] focus:outline-none focus:border-[#ffb703]"
                      placeholder="Dán URL ảnh hoặc tải lên..."
                    />
                    <label className="px-3 py-2 bg-[#4a121a] hover:bg-[#ffb703]/20 border border-[#ffb703]/25 text-[#ffb703] rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0">
                      {editAvatarLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>Tải Lên</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={editAvatarLoading}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleAvatarUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {editAvatarUrl && (
                    <div className="mt-2 flex items-center justify-center">
                      <img 
                        src={editAvatarUrl} 
                        alt="Avatar Preview" 
                        className="w-12 h-12 rounded-full object-cover border border-[#ffb703]/30"
                      />
                    </div>
                  )}
                </div>



                {/* 7. Modal Controls */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={saveAdminSettings}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#800020] to-[#ffb703] text-[#1a0508] text-xs font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-glow-gold flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>LƯU CÀI ĐẶT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdminSettingsOpen(false)}
                    className="px-4 py-2.5 bg-[#4a121a] hover:bg-[#800020] border border-[#ffb703]/10 text-[#fceade] text-xs font-bold rounded-xl active:scale-95 transition-all"
                  >
                    HỦY
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>

      {/* 📱 FLOATING BOTTOM GLASSMORPHIC NAVIGATION BAR */}
      <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 select-none">
        <nav className="bg-[#2d0b11]/85 border border-[#ffb703]/25 backdrop-blur-md rounded-2xl py-2.5 px-4 max-w-sm w-full flex justify-around shadow-[0_8px_32px_rgba(0,0,0,0.5)] shadow-glow-gold/10 relative">
          {[
            { id: 'home', label: 'Thư Mời', icon: Home },
            { id: 'logistics', label: 'Lịch Trình', icon: Calendar },
            { id: 'guestbook', label: 'Lời Chúc', icon: BookOpen },
            { id: 'gallery', label: 'Thư Viện', icon: ImageIcon }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex flex-col items-center gap-0.5 transition-all duration-300 relative ${
                activeView === tab.id 
                  ? 'text-[#ffb703] scale-105' 
                  : 'text-[#fceade]/60 hover:text-[#fceade]'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-wide">{tab.label}</span>
              
              {activeView === tab.id && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#ffb703] animate-pulse"></span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* 🔍 IMAGE LIGHTBOX OVERLAY */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-2 cursor-zoom-out select-none"
          onClick={() => setZoomedImage(null)}
        >
          <div className="absolute top-4 right-4 flex gap-2 z-[110]">
            <a 
              href={`${API_BASE}/download?url=${encodeURIComponent(zoomedImage)}`}
              download
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-full bg-[#150305]/70 text-[#ffb703] border border-[#ffb703]/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              title="Tải ảnh gốc"
            >
              <Download className="w-5 h-5" />
            </a>
            <button 
              onClick={() => setZoomedImage(null)}
              className="p-2 rounded-full bg-[#150305]/70 text-[#ffb703] border border-[#ffb703]/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {isVideoUrl(zoomedImage) ? (
            <video 
              src={zoomedImage} 
              controls
              autoPlay
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
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

      {/* 🎥 FULLSCREEN AUTO-SLIDESHOW OVERLAY */}
      {isSlideshowOpen && (
        <div className="fixed inset-0 bg-gradient-to-br from-[#1e0305] via-[#3a060b] to-[#150305] z-[90] flex flex-col justify-between p-8 select-none overflow-hidden animate-fade-in">
          
          {/* Header Controls */}
          <div className="flex justify-between items-center z-10">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-[#ffb703] animate-pulse" />
              <h2 className="text-sm font-black text-[#ffb703] tracking-widest uppercase">TRÌNH CHIẾU LỜI CHÚC 🎓</h2>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSlideshowPlaying(!isSlideshowPlaying)}
                className="p-2 rounded-full bg-[#2d0b11]/80 text-[#ffb703] border border-[#ffb703]/20 hover:bg-[#ffb703]/10 transition-colors"
              >
                {isSlideshowPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <button 
                onClick={() => setIsSlideshowOpen(false)}
                className="p-2 rounded-full bg-[#2d0b11]/80 text-[#fceade] border border-[#fceade]/10 hover:bg-red-950/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Wish Display (Fades when index changes) */}
          <div className="flex-1 flex items-center justify-center max-w-4xl mx-auto w-full my-6">
            {wishes.length > 0 ? (
              <div 
                key={slideshowIndex} 
                className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full animate-fade-in-slow"
              >
                {/* Text Section */}
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-[#ffb703] tracking-wider uppercase border-b-2 border-[#ffb703] pb-1">
                      {wishes[slideshowIndex].sender_name}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      (wishes[slideshowIndex].attendance_status === 'attending' || wishes[slideshowIndex].attendance_status === 'attending_ceremony' || wishes[slideshowIndex].attendance_status === 'attended')
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-stone-500/15 text-[#d0a5aa] border border-stone-500/20'
                    }`}>
                      {wishes[slideshowIndex].attendance_status === 'attending' 
                        ? '🎓 SẼ ĐẾN DỰ LỄ' 
                        : wishes[slideshowIndex].attendance_status === 'attending_ceremony'
                        ? '📸 ĐANG Ở BUỔI LỄ'
                        : wishes[slideshowIndex].attendance_status === 'attended'
                        ? '🎓 ĐÃ THAM GIA'
                        : '💌 CHÚC TỪ XA'}
                    </span>
                  </div>
                  <blockquote className="text-2xl md:text-3xl text-[#fceade] font-medium leading-relaxed font-serif italic">
                    "{wishes[slideshowIndex].message}"
                  </blockquote>
                  {wishes[slideshowIndex].photographer_tag && (
                    <p className="text-xs text-[#ffb703]/75 font-bold">
                      📸 Nguồn ảnh: {wishes[slideshowIndex].photographer_tag.toUpperCase()}
                    </p>
                  )}
                </div>

                {/* Media Section */}
                <div className="flex justify-center items-center h-80 md:h-[450px] w-full rounded-3xl overflow-hidden border-2 border-[#ffb703]/30 bg-[#150305] shadow-2xl relative">
                  {wishes[slideshowIndex].image_urls && wishes[slideshowIndex].image_urls.length > 0 ? (
                    isVideoUrl(wishes[slideshowIndex].image_urls[0]) ? (
                      <video 
                        src={wishes[slideshowIndex].image_urls[0]} 
                        autoPlay 
                        muted 
                        loop
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img 
                        src={wishes[slideshowIndex].image_urls[0]} 
                        alt="Slide kỉ niệm"
                        className="w-full h-full object-cover" 
                      />
                    )
                  ) : wishes[slideshowIndex].image_url ? (
                    isVideoUrl(wishes[slideshowIndex].image_url) ? (
                      <video 
                        src={wishes[slideshowIndex].image_url} 
                        autoPlay 
                        muted 
                        loop
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img 
                        src={wishes[slideshowIndex].image_url} 
                        alt="Slide kỉ niệm"
                        className="w-full h-full object-cover" 
                      />
                    )
                  ) : (
                    /* Default graduation card fallback when wish has no photos */
                    <div className="w-full h-full bg-gradient-to-br from-[#4a0e17] to-[#150305] flex flex-col items-center justify-center p-6 text-center text-[#ffb703]">
                      <Award className="w-16 h-16 animate-bounce mb-3" />
                      <p className="text-sm font-bold tracking-widest uppercase">CONGRATULATIONS</p>
                      <p className="text-[10px] text-[#d0a5aa] mt-1 max-w-[80%]">Chúc mừng lễ tốt nghiệp cử nhân của Quang Tùng!</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-[#d0a5aa] text-sm">Chưa có lời chúc nào được đăng tải để trình chiếu.</div>
            )}
          </div>

          {/* Footer Indicators */}
          <div className="flex justify-between items-center text-xs text-[#d0a5aa] border-t border-[#4a121a]/40 pt-4 z-10">
            <span>Đang trình chiếu: {slideshowIndex + 1}/{wishes.length} lời chúc</span>
            <div className="flex gap-1">
              <button 
                onClick={() => setSlideshowIndex((slideshowIndex - 1 + wishes.length) % wishes.length)}
                className="px-2 py-1 bg-[#2d0b11]/85 border border-[#ffb703]/20 rounded-lg text-[#ffb703] hover:bg-[#ffb703]/10"
              >
                Trước
              </button>
              <button 
                onClick={() => setSlideshowIndex((slideshowIndex + 1) % wishes.length)}
                className="px-2 py-1 bg-[#2d0b11]/85 border border-[#ffb703]/20 rounded-lg text-[#ffb703] hover:bg-[#ffb703]/10"
              >
                Tiếp Theo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
