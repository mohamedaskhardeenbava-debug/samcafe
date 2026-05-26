import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "./EventsPage.css";
import api from "../api";
import { useToast } from "./Usetoast";
import closeIcon from "../assets/icons/close.png";

// ─── helpers ────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
        weekday: "short", day: "2-digit", month: "short", year: "numeric",
    });
};

const formatTime = (t) => {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hr = h % 12 || 12;
    return `${hr}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const isPast = (iso) => iso && new Date(iso) < new Date();

const daysUntil = (iso) => {
    if (!iso) return null;
    const diff = new Date(iso) - new Date();
    if (diff < 0) return null;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const msUntilStart = (evt) => {
    if (!evt.date) return null;
    const eventDt = new Date(`${evt.date}T${evt.time || "00:00"}`);
    const diff = eventDt - new Date();
    return diff > 0 ? diff : 0;
};

const daysUntilClose = (evt) => {
    const close = getBookingCloseDate(evt);
    if (!close) return null;
    const diff = close - new Date();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getBookingCloseDate = (evt) => {
    if (evt.bookingCloseDate) return new Date(evt.bookingCloseDate);
    if (!evt.date) return null;
    const d = new Date(evt.date);
    d.setDate(d.getDate() - 2);
    return d;
};

const isBookingClosed = (evt) => {
    const close = getBookingCloseDate(evt);
    if (!close) return false;
    return new Date() > close;
};

const msUntilClose = (evt) => {
    const close = getBookingCloseDate(evt);
    if (!close) return null;
    const diff = close - new Date();
    return diff > 0 ? diff : 0;
};

const formatCountdown = (ms) => {
    if (ms <= 0) return null;
    const totalSec = Math.floor(ms / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
};

const capacityPercent = (evt, bookings) => {
    const max = Number(evt.maxCapacity) || 0;
    if (!max) return null;
    const booked = bookings.filter(b => b.eventId === evt.id && b.status !== "cancelled")
        .reduce((sum, b) => sum + (Number(b.guests) || 1), 0);
    return Math.min(100, Math.round((booked / max) * 100));
};

const seatsLeft = (evt, bookings) => {
    const max = Number(evt.maxCapacity) || 0;
    if (!max) return null;
    const booked = bookings.filter(b => b.eventId === evt.id && b.status !== "cancelled")
        .reduce((sum, b) => sum + (Number(b.guests) || 1), 0);
    return Math.max(0, max - booked);
};

const TYPE_LABEL = {
    dining: "Dining Experience", special: "Special Occasion",
    private: "Private Booking", seasonal: "Seasonal Special",
    live: "Live Entertainment", workshop: "Workshop",
};
const TYPE_GRADIENT = {
    dining: "linear-gradient(135deg,#f59e0b,#ef4444)",
    special: "linear-gradient(135deg,#8b5cf6,#ec4899)",
    private: "linear-gradient(135deg,#1e40af,#0891b2)",
    seasonal: "linear-gradient(135deg,#16a34a,#65a30d)",
    live: "linear-gradient(135deg,#7c3aed,#db2777)",
    workshop: "linear-gradient(135deg,#0891b2,#0d9488)",
};

// ─── Coupon Pool ─────────────────────────────────────────────────────────────
const COUPON_POOL = [
    { code: "FEAST10", label: "10% OFF", desc: "10% off your next order", color: "#ff9f43" },
    { code: "LUCKY20", label: "20% OFF", desc: "20% off on your next visit", color: "#ee5253" },
    { code: "FREEAPP", label: "FREE APPETIZER", desc: "One complimentary starter on us", color: "#5f27cd" },
    { code: "DRINK50", label: "₹50 OFF DRINKS", desc: "₹50 off on your beverages", color: "#00b894" },
    { code: "VIP15", label: "15% OFF", desc: "15% off – VIP member special", color: "#e17055" },
    { code: "CHEFSPEC", label: "CHEF'S SPECIAL", desc: "Complimentary chef's special dessert", color: "#6c5ce7" },
];
const randomCoupon = () => COUPON_POOL[Math.floor(Math.random() * COUPON_POOL.length)];

// ─── Countdown Hook ───────────────────────────────────────────────────────────
const useCountdown = (targetMs) => {
    // Round to the nearest second so floating-point noise doesn't cause
    // a new targetMs on every render and trigger an infinite loop.
    const stableMs = targetMs === null ? null : Math.round(targetMs / 1000) * 1000;
    const [remaining, setRemaining] = useState(stableMs);

    useEffect(() => {
        if (stableMs === null) return;
        // Only reset the counter when the rounded target actually changes
        // (e.g. a different event was selected), not on every re-render.
        setRemaining(stableMs);
        const id = setInterval(() => {
            setRemaining(prev => Math.max(0, prev - 1000));
        }, 1000);
        return () => clearInterval(id);
    }, [stableMs]); // eslint-disable-line react-hooks/exhaustive-deps

    return remaining;
};

// ─── Badges ──────────────────────────────────────────────────────────────────
const CountdownBadge = ({ evt, variant = "card" }) => {
    // useMemo prevents a fresh Date() on every render from producing a new
    // millisecond value that re-triggers useCountdown's effect each render.
    const ms = useMemo(() => msUntilClose(evt), [evt]);
    const remaining = useCountdown(ms);
    if (ms === null || ms <= 0) return null;
    const isUrgent = remaining < 24 * 3600 * 1000;
    const label = formatCountdown(remaining);
    if (!label) return null;
    return (
        <span className={`ep-countdown-badge ${isUrgent ? "ep-countdown-urgent" : ""} ep-countdown-${variant}`}>
            Closes in {label}
        </span>
    );
};

const EventStartCountdown = ({ evt, variant = "card" }) => {
    const ms = useMemo(() => msUntilStart(evt), [evt]);
    const remaining = useCountdown(ms);
    if (ms === null || ms <= 0) return null;
    const label = formatCountdown(remaining);
    if (!label) return null;
    const isImminent = remaining < 3600 * 1000;
    return (
        <span className={`ep-start-countdown ${isImminent ? "ep-start-imminent" : ""} ep-start-${variant}`}>
            Starts in {label}
        </span>
    );
};

const BookingDeadlineBadge = ({ evt, variant = "card" }) => {
    const days = daysUntilClose(evt);
    if (days === null) return null;
    if (isBookingClosed(evt)) return null;
    const isUrgent = days <= 1;
    return (
        <span className={`ep-booking-days-badge ${isUrgent ? "ep-booking-days-urgent" : ""} ep-booking-days-${variant}`}>
            {days === 0 ? "Last day to book!" : days === 1 ? "1 day left to enroll" : `${days} days left to enroll`}
        </span>
    );
};

const SeatsLeftBadge = ({ evt, allBookings, variant = "card" }) => {
    const pct = capacityPercent(evt, allBookings);
    const left = seatsLeft(evt, allBookings);
    if (pct === null) return null;
    if (pct < 90) return null;
    return (
        <span className={`ep-seats-badge ep-seats-${variant}`}>
            Only {left} seat{left !== 1 ? "s" : ""} left!
        </span>
    );
};

// ─── Improved Scratch Card ────────────────────────────────────────────────────
const ScratchCard = ({ coupon, onDone }) => {
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const isPointerDown = useRef(false);
    const lastPos = useRef(null);
    const revealedRef = useRef(false);
    const [revealed, setRevealed] = useState(false);
    const [pct, setPct] = useState(0);
    const [copied, setCopied] = useState(false);
    const [animIn, setAnimIn] = useState(false);

    useEffect(() => {
        setTimeout(() => setAnimIn(true), 80);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctxRef.current = ctx;
        drawSurface(ctx, canvas.width, canvas.height);
    }, []);

    const drawSurface = (ctx, W, H) => {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;

        // Gold gradient base
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, "#c8a84b");
        grad.addColorStop(0.2, "#f5d88a");
        grad.addColorStop(0.4, "#c9973a");
        grad.addColorStop(0.55, "#f0c96a");
        grad.addColorStop(0.7, "#b8832c");
        grad.addColorStop(0.85, "#e8c060");
        grad.addColorStop(1, "#c8a84b");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Diagonal bright sheen lines
        ctx.save();
        for (let i = -H; i < W + H; i += 14) {
            ctx.globalAlpha = 0.12;
            ctx.strokeStyle = "#fff9e6";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + H * 0.7, H);
            ctx.stroke();
        }
        ctx.restore();

        // Subtle radial highlight top-left
        const shine = ctx.createRadialGradient(W * 0.25, H * 0.25, 0, W * 0.25, H * 0.25, W * 0.55);
        shine.addColorStop(0, "rgba(255,255,220,0.32)");
        shine.addColorStop(1, "rgba(255,255,220,0)");
        ctx.fillStyle = shine;
        ctx.fillRect(0, 0, W, H);

        // Decorative border inset
        ctx.save();
        ctx.strokeStyle = "rgba(255,240,150,0.55)";
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 8, W - 16, H - 16);
        ctx.restore();

        // Center instruction text
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(80,50,0,0.75)";
        ctx.font = "bold 14px system-ui,sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("SCRATCH TO REVEAL", W / 2, H / 2 - 12);
        ctx.font = "11px system-ui,sans-serif";
        ctx.fillStyle = "rgba(80,50,0,0.5)";
        ctx.fillText("Use finger or mouse", W / 2, H / 2 + 10);

        // Star dots pattern
        ctx.save();
        for (let i = 0; i < 28; i++) {
            const sx = 20 + Math.random() * (W - 40);
            const sy = 20 + Math.random() * (H - 40);
            const r = 1.2 + Math.random() * 1.8;
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = "#fff8cc";
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    };

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const src = e.touches ? e.touches[0] : e;
        return {
            x: (src.clientX - rect.left) * scaleX,
            y: (src.clientY - rect.top) * scaleY,
        };
    };

    const scratch = (pos) => {
        if (revealedRef.current) return;
        const ctx = ctxRef.current;
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 64;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (lastPos.current) {
            ctx.beginPath();
            ctx.moveTo(lastPos.current.x, lastPos.current.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 32, 0, Math.PI * 2);
        ctx.fill();
        lastPos.current = pos;
        checkReveal();
    };

    const checkReveal = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparent = 0;
        for (let i = 3; i < data.length; i += 16) {
            if (data[i] < 128) transparent++;
        }
        const total = (canvas.width * canvas.height) / 4;
        const p = Math.min(100, Math.round((transparent / total) * 100));
        setPct(p);
        if (p > 52 && !revealedRef.current) {
            revealedRef.current = true;
            setRevealed(true);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const onPointerDown = useCallback((e) => {
        e.preventDefault();
        isPointerDown.current = true;
        lastPos.current = null;
        const canvas = canvasRef.current;
        canvas.setPointerCapture(e.pointerId);
        scratch(getPos(e));
    }, []);

    const onPointerMove = useCallback((e) => {
        e.preventDefault();
        if (!isPointerDown.current) return;
        scratch(getPos(e));
    }, []);

    const onPointerUp = useCallback(() => {
        isPointerDown.current = false;
        lastPos.current = null;
    }, []);

    const copyCode = () => {
        navigator.clipboard?.writeText(coupon.code).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className={`sc-wrapper ${animIn ? "sc-anim-in" : ""}`}>
            {/* Prize card */}
            <div className="sc-card-shell" style={{ "--c": coupon.color }}>
                <div className="sc-card-glow" style={{ background: coupon.color }} />
                <div className="sc-card-inner">
                    <div className="sc-confetti-dots">
                        {[...Array(8)].map((_, i) => (
                            <span key={i} className="sc-dot" style={{ "--i": i, "--c": coupon.color }} />
                        ))}
                    </div>
                    <div className="sc-prize-badge" style={{ background: coupon.color }}>
                        <span className="sc-prize-label-text">{coupon.label}</span>
                    </div>
                    <p className="sc-prize-desc-text">{coupon.desc}</p>
                    <div className="sc-code-row">
                        <code className="sc-code">{coupon.code}</code>
                        <button
                            className={`sc-copy-btn ${copied ? "copied" : ""}`}
                            style={{ "--c": coupon.color }}
                            onClick={copyCode}
                        >
                            {copied ? "Copied!" : "Copy Code"}
                        </button>
                    </div>
                </div>

                {/* Scratch surface overlaid on top */}
                {!revealed && (
                    <canvas
                        ref={canvasRef}
                        width={320}
                        height={160}
                        className="sc-canvas-overlay"
                        style={{ touchAction: "none", cursor: revealed ? "default" : "crosshair" }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerLeave={onPointerUp}
                    />
                )}
            </div>

            {/* Progress */}
            {!revealed && (
                <div className="sc-progress-row">
                    <div className="sc-progress-track">
                        <div
                            className="sc-progress-bar"
                            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${coupon.color}aa, ${coupon.color})` }}
                        />
                    </div>
                    <span className="sc-pct">{pct}%</span>
                </div>
            )}

            {revealed && (
                <button
                    className="sc-use-btn"
                    style={{ background: `linear-gradient(135deg, ${coupon.color}dd, ${coupon.color})` }}
                    onClick={onDone}
                >
                    Use This Coupon
                </button>
            )}
        </div>
    );
};

// ─── Carousel ────────────────────────────────────────────────────────────────
const Carousel = ({ images, title }) => {
    const [idx, setIdx] = useState(0);
    const timer = useRef(null);
    const goTo = useCallback((i) => {
        setIdx(i);
        clearInterval(timer.current);
        timer.current = setInterval(() => setIdx(p => (p + 1) % images.length), 3500);
    }, [images.length]);
    useEffect(() => {
        if (images.length <= 1) return;
        timer.current = setInterval(() => setIdx(p => (p + 1) % images.length), 3500);
        return () => clearInterval(timer.current);
    }, [images]);
    if (!images.length) return null;
    return (
        <div className="ep-carousel">
            <div className="ep-carousel-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
                {images.map((src, i) => (
                    <div key={i} className="ep-carousel-slide"><img src={src} alt={`${title}-${i}`} /></div>
                ))}
            </div>
            {images.length > 1 && (
                <>
                    <button className="ep-car-prev" onClick={(e) => { e.stopPropagation(); goTo((idx - 1 + images.length) % images.length); }} />
                    <button className="ep-car-next" onClick={(e) => { e.stopPropagation(); goTo((idx + 1) % images.length); }} />
                    <div className="ep-car-dots">
                        {images.map((_, i) => (
                            <button key={i} className={`ep-car-dot ${i === idx ? "active" : ""}`}
                                onClick={(e) => { e.stopPropagation(); goTo(i); }} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// ─── Main ────────────────────────────────────────────────────────────────────
const EventsPage = ({ handleBack, handleHome, currentUser }) => {
    const { toast } = useToast();
    const [events, setEvents] = useState([]);
    const [allBookings, setAllBookings] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [allDishes, setAllDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEnroll, setShowEnroll] = useState(false);
    const [filterType, setFilterType] = useState("all");
    const [submitState, setSubmitState] = useState("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [coupon, setCoupon] = useState(null);
    const [showAddGuest, setShowAddGuest] = useState(false);
    const [addGuestForm, setAddGuestForm] = useState({ guests: 1 });
    const [addGuestState, setAddGuestState] = useState("idle");
    const [form, setForm] = useState({
        name: currentUser?.name || "", email: currentUser?.email || "",
        phone: currentUser?.phone || "", guests: 1, specialRequests: "",
    });

    // FIX: Use stable currentUser ID instead of the object reference to avoid infinite loop
    const currentUserId = currentUser?.id || null;

    useEffect(() => {
        const fetch_ = async () => {
            try {
                const res = await api.get("/events");
                setEvents((res.data || []).filter(e => e.isPublished));
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch_();
    }, []);

    useEffect(() => {
        api.get("/eventBookings").then(r => setAllBookings(r.data || [])).catch(() => { });
    }, []);

    useEffect(() => {
        api.get("/categories").then(r => {
            const list = [];
            (r.data || []).forEach(cat => {
                (cat.subCategories || []).forEach(sub =>
                    (sub.dishes || []).forEach(d => list.push({ ...d, cat: cat.name })));
                (cat.dishes || []).forEach(d => list.push({ ...d, cat: cat.name }));
            });
            setAllDishes(list);
        }).catch(() => { });
    }, []);

    // FIX: use currentUserId (string|null) not currentUser (object) to avoid infinite re-render
    useEffect(() => {
        if (currentUserId) {
            setMyBookings(allBookings.filter(b => b.userId === currentUserId));
        }
    }, [allBookings, currentUserId]);

    const filteredEvents = events.filter(e => filterType === "all" || e.eventType === filterType);
    const availableTypes = [...new Set(events.map(e => e.eventType))];
    const isBooked = (id) => myBookings.some(b => b.eventId === id && b.status !== "cancelled");
    const bookedForEvent = (id) => myBookings.find(b => b.eventId === id && b.status !== "cancelled");
    const getEventImages = (evt) => evt.images?.length ? evt.images : evt.image ? [evt.image] : [];
    const getEventDishes = (evt) => !evt.dishes?.length ? [] : allDishes.filter(d => evt.dishes.includes(d.id));

    const validateEnrollForm = () => {
        if (!form.name.trim()) return "Please enter your full name.";
        const cleanPhone = form.phone.replace(/\D/g, "");
        if (!cleanPhone || cleanPhone.length !== 10) return "Enter a valid 10-digit phone number.";
        if (!form.email.trim()) return "Please enter your email address.";
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(form.email.trim())) return "Enter a valid email address.";
        return null;
    };

    const handleEnroll = async () => {
        const validationErr = validateEnrollForm();
        if (validationErr) { setErrorMsg(validationErr); return; }
        setErrorMsg(""); setSubmitState("loading");
        try {
            const payload = {
                id: `bk_${Date.now()}`, eventId: selectedEvent.id,
                userId: currentUserId, name: form.name.trim(),
                email: form.email.trim(), phone: form.phone.trim(),
                guests: Number(form.guests) || 1,
                specialRequests: form.specialRequests.trim(),
                totalAmount: (Number(form.guests) || 1) * (Number(selectedEvent.price) || 0),
                status: "pending", bookedAt: new Date().toISOString(),
            };
            const res = await api.post("/eventBookings", payload);
            setAllBookings(p => [...p, res.data]);
            setMyBookings(p => [...p, res.data]);
            setCoupon(randomCoupon());
            setSubmitState("scratch");
        } catch (err) {
            console.error(err);
            setSubmitState("error");
            setErrorMsg("Booking failed. Please try again.");
        }
    };

    const openEnroll = (evt) => {
        setSelectedEvent(evt);
        setForm({ name: currentUser?.name || "", email: currentUser?.email || "", phone: currentUser?.phone || "", guests: 1, specialRequests: "" });
        setSubmitState("idle"); setErrorMsg(""); setCoupon(null); setShowEnroll(true);
    };
    const closeEnroll = () => { setShowEnroll(false); setSubmitState("idle"); setErrorMsg(""); setCoupon(null); };
    const handleScratchDone = () => { closeEnroll(); setSelectedEvent(null); };

    const handleAddGuests = async () => {
        const extra = Number(addGuestForm.guests) || 1;
        if (extra < 1) return;
        setAddGuestState("loading");
        try {
            const booking = bookedForEvent(selectedEvent?.id);
            if (!booking) return;
            const pricePerPerson = Number(selectedEvent?.price || 0);
            const newGuests = (Number(booking.guests) || 1) + extra;
            const newTotal = newGuests * pricePerPerson;
            const updated = { ...booking, guests: newGuests, totalAmount: newTotal };
            await api.put(`/eventBookings/${booking.id}`, updated);
            setAllBookings(p => p.map(b => b.id === booking.id ? updated : b));
            setMyBookings(p => p.map(b => b.id === booking.id ? updated : b));
            setAddGuestState("done");
        } catch (err) {
            console.error(err);
            setAddGuestState("idle");
            toast.error("Failed to update guests. Please try again.");
        }
    };

    const openAddGuest = (evt) => {
        setSelectedEvent(evt);
        setAddGuestForm({ guests: 1 });
        setAddGuestState("idle");
        setShowAddGuest(true);
    };
    const closeAddGuest = () => { setShowAddGuest(false); setAddGuestState("idle"); setAddGuestForm({ guests: 1 }); };

    return (
        <div className="ep-page">

            {/* Hero */}
            <div className="ep-hero">
                <div className="ep-hero-bg" />
                <div className="ep-hero-content">
                    <div className="ep-hero-topbar">
                        <button className="events-back-button" onClick={handleBack} />
                        <div className="home-btn  home-btn-icon" onClick={handleHome} />
                    </div>
                    <div className="ep-hero-text">
                        <h1 className="ep-hero-title">Experiences &<br />Special Events</h1>
                        <p className="ep-hero-sub">Crafted moments. Memorable evenings.</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="ep-filter-section">
                <div className="ep-filter-scroll">
                    <button className={`chip ${filterType === "all" ? "active" : ""}`} onClick={() => setFilterType("all")}>
                        <span className="shadow"></span>
                        <span className="edge"></span>
                        <span className="front">All Events</span>
                    </button>
                    {availableTypes.map(t => (
                        <button key={t} className={`chip ${filterType === t ? "active" : ""}`} onClick={() => setFilterType(t)}>
                            <span className="shadow"></span>
                            <span className="edge"></span>
                            <span className="front">{TYPE_LABEL[t] || t}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Events Grid */}
            {loading ? (
                <div className="ep-loading"><div className="ep-spinner" /><p>Loading events…</p></div>
            ) : filteredEvents.length === 0 ? (
                <div className="ep-empty">
                    <p>No events right now.</p>
                    <p className="ep-empty-sub">Check back soon for upcoming experiences!</p>
                </div>
            ) : (
                <div className="ep-events-grid">
                    {filteredEvents.map(evt => {
                        const booked = isBooked(evt.id);
                        const past = isPast(evt.date);
                        const closed = isBookingClosed(evt);
                        const images = getEventImages(evt);
                        const days = daysUntil(evt.date);
                        const gradient = TYPE_GRADIENT[evt.eventType] || TYPE_GRADIENT.special;
                        const pct = capacityPercent(evt, allBookings);
                        const left = seatsLeft(evt, allBookings);
                        const almostFull = pct !== null && pct >= 90;

                        return (
                            <div key={evt.id}
                                className={`ep-event-card ${past ? "ep-past" : ""} ${almostFull && !past ? "ep-almost-full" : ""}`}
                                onClick={() => setSelectedEvent(evt)}>

                                <div className="ep-card-visual">
                                    {images.length > 0
                                        ? <Carousel images={images} title={evt.title} />
                                        : <div className="ep-card-placeholder" style={{ background: gradient }}><span>{TYPE_LABEL[evt.eventType]?.charAt(0) || "E"}</span></div>
                                    }
                                    <div className="ep-card-overlay" />
                                    <span className="ep-card-type-badge" style={{ background: gradient }}>
                                        {TYPE_LABEL[evt.eventType] || evt.eventType}
                                    </span>
                                    {booked && <span className="ep-booked-ribbon">Booked</span>}
                                    {past && <span className="ep-past-ribbon">Ended</span>}
                                    {!past && !booked && days !== null && days <= 7 && (
                                        <span className={`ep-urgency-tag ${days <= 1 ? "ep-urgency-blink" : ""}`}>
                                            {days === 0 ? "Today!" : days === 1 ? "Tomorrow!" : `${days} days left`}
                                        </span>
                                    )}
                                    {evt.isSpecialized && <span className="ep-specialized-tag">Specialized</span>}
                                    {!past && !booked && <span className="ep-reward-badge">Win Coupon</span>}
                                    {almostFull && !past && <span className="ep-fire-badge">{left} left!</span>}
                                </div>

                                <div className="ep-card-body">
                                    <h3 className="ep-card-title">{evt.title}</h3>
                                    <p className="ep-card-desc">{evt.description}</p>

                                    <div className="ep-card-meta">
                                        <span className="ep-meta-item">{formatDate(evt.date)}</span>
                                        {evt.time && <span className="ep-meta-item">{formatTime(evt.time)}</span>}
                                        {evt.venue && <span className="ep-meta-item">{evt.venue}</span>}
                                    </div>

                                    {!past && <EventStartCountdown evt={evt} variant="card" />}
                                    {!past && !booked && !closed && <CountdownBadge evt={evt} variant="card" />}
                                    {!past && !booked && !closed && <BookingDeadlineBadge evt={evt} variant="card" />}
                                    {!past && !booked && closed && <span className="ep-booking-closed-badge">Booking Closed</span>}

                                    {pct !== null && !past && (
                                        <div className="ep-capacity-bar-wrap">
                                            <div className="ep-capacity-bar">
                                                <div className="ep-capacity-fill"
                                                    style={{ width: `${pct}%`, background: pct >= 90 ? "#ee5253" : pct >= 70 ? "#ff9f43" : "#1dd1a1" }} />
                                            </div>
                                            <span className="ep-capacity-label"
                                                style={{ color: pct >= 90 ? "#ee5253" : pct >= 70 ? "#f0932b" : "#888" }}>
                                                {pct >= 90 ? `Only ${left} seats!` : `${left} seats available`}
                                            </span>
                                        </div>
                                    )}

                                    {evt.highlights?.length > 0 && (
                                        <div className="ep-highlights">
                                            {evt.highlights.slice(0, 3).map((h, i) => <span key={i} className="ep-highlight-chip">{h}</span>)}
                                        </div>
                                    )}
                                    {evt.dishes?.length > 0 && (
                                        <div className="ep-dishes-teaser">{evt.dishes.length} dishes on the menu</div>
                                    )}

                                    <div className="ep-card-footer">
                                        <div className="ep-price-block">
                                            {!evt.price || evt.price === 0
                                                ? <span className="ep-free-tag">Free Entry</span>
                                                : <><span className="ep-price-amount">₹{Number(evt.price).toLocaleString("en-IN")}</span><span className="ep-price-per">/person</span></>
                                            }
                                        </div>
                                        {!past && (
                                            booked ? (
                                                <button className="ep-booked-btn" onClick={e => e.stopPropagation()}>Enrolled</button>
                                            ) : closed ? (
                                                <button className="ep-booked-btn ep-closed-btn" disabled onClick={e => e.stopPropagation()}>Closed</button>
                                            ) : (
                                                <button className="form-action-btn submit" onClick={e => { e.stopPropagation(); openEnroll(evt); }}>
                                                    <span className="shadow"></span>
                                                    <span className="edge"></span>
                                                    <span className="front">Book Ticket</span>
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* EVENT DETAIL SHEET */}
            {selectedEvent && !showEnroll && (
                <div className="ep-sheet-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="ep-sheet" onClick={e => e.stopPropagation()}>
                        <button className="ep-sheet-close-btn" onClick={() => setSelectedEvent(null)}><img src={closeIcon} alt="" className="close-icon" /></button>

                        {getEventImages(selectedEvent).length > 0 && (
                            <div className="ep-sheet-image-wrap">
                                <Carousel images={getEventImages(selectedEvent)} title={selectedEvent.title} />
                            </div>
                        )}

                        <div className="ep-sheet-body">
                            <div className="ep-sheet-type-row">
                                <span className="ep-sheet-type-badge" style={{ background: TYPE_GRADIENT[selectedEvent.eventType] || TYPE_GRADIENT.special }}>
                                    {TYPE_LABEL[selectedEvent.eventType] || selectedEvent.eventType}
                                </span>
                                {selectedEvent.isSpecialized && <span className="ep-sheet-spec-badge">Specialized</span>}
                                {!isPast(selectedEvent.date) && !isBooked(selectedEvent.id) && !isBookingClosed(selectedEvent) && (
                                    <span className="ep-sheet-reward-badge">Book & Win Coupon!</span>
                                )}
                            </div>

                            <h2 className="ep-sheet-title">{selectedEvent.title}</h2>
                            <p className="ep-sheet-desc">{selectedEvent.description}</p>

                            {!isPast(selectedEvent.date) && (
                                <div className="ep-sheet-urgency-row">
                                    <EventStartCountdown evt={selectedEvent} variant="sheet" />
                                    {!isBooked(selectedEvent.id) && !isBookingClosed(selectedEvent) && (
                                        <>
                                            <CountdownBadge evt={selectedEvent} variant="sheet" />
                                            <BookingDeadlineBadge evt={selectedEvent} variant="sheet" />
                                        </>
                                    )}
                                    {isBookingClosed(selectedEvent) && <span className="ep-booking-closed-badge ep-booking-closed-sheet">Booking is now Closed</span>}
                                    <SeatsLeftBadge evt={selectedEvent} allBookings={allBookings} variant="sheet" />
                                </div>
                            )}

                            {(() => {
                                const pct = capacityPercent(selectedEvent, allBookings);
                                const left = seatsLeft(selectedEvent, allBookings); // ✅ FIX

                                if (pct === null || isPast(selectedEvent.date)) return null;

                                return (
                                    <div className="ep-sheet-capacity">
                                        <div className="ep-sheet-cap-label">
                                            <span>Seat Availability</span>
                                            <span
                                                style={{
                                                    color: pct >= 90 ? "#ee5253" : "#555",
                                                    fontWeight: 700
                                                }}
                                            >
                                                {left} seats remaining
                                            </span>
                                        </div>

                                        <div className="ep-capacity-bar ep-cap-sheet">
                                            <div
                                                className="ep-capacity-fill"
                                                style={{
                                                    width: `${pct}%`,
                                                    background:
                                                        pct >= 90
                                                            ? "#ee5253"
                                                            : pct >= 70
                                                                ? "#ff9f43"
                                                                : "#1dd1a1",
                                                    transition: "width 0.8s ease"
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="ep-sheet-meta-grid">
                                {[
                                    { label: "Date", val: formatDate(selectedEvent.date) },
                                    { label: "Time", val: selectedEvent.time ? formatTime(selectedEvent.time) : null },
                                    { label: "Venue", val: selectedEvent.venue },
                                    { label: "Price", val: !selectedEvent.price || selectedEvent.price === 0 ? "Free" : `₹${Number(selectedEvent.price).toLocaleString("en-IN")} / person` },
                                    { label: "Capacity", val: selectedEvent.maxCapacity > 0 ? `${selectedEvent.maxCapacity} seats` : null },
                                    { label: "Booking closes", val: (() => { const c = getBookingCloseDate(selectedEvent); return c ? formatDate(c.toISOString()) : null; })() },
                                    { label: "Package", val: selectedEvent.packageLabel },
                                ].filter(m => m.val).map((m, i) => (
                                    <div key={i} className="ep-sheet-meta-item">
                                        <div><div className="ep-meta-label">{m.label}</div><div className="ep-meta-val">{m.val}</div></div>
                                    </div>
                                ))}
                            </div>

                            {selectedEvent.highlights?.length > 0 && (
                                <div className="ep-sheet-section">
                                    <h4 className="ep-section-heading">What's Included</h4>
                                    <div className="ep-highlights-list">
                                        {selectedEvent.highlights.map((h, i) => (
                                            <div key={i} className="ep-highlight-row">
                                                <span className="ep-highlight-check">✓</span><span>{h}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedEvent.dishes?.length > 0 && (
                                <div className="ep-sheet-section">
                                    <h4 className="ep-section-heading">Menu for this Event</h4>
                                    <div className="ep-menu-grid">
                                        {getEventDishes(selectedEvent).slice(0, 12).map(dish => (
                                            <div key={dish.id} className="ep-menu-item">
                                                {dish.image ? <img src={dish.image} alt={dish.name} className="ep-menu-img" />
                                                    : <div className="ep-menu-img ep-menu-img-placeholder">M</div>}
                                                <div className="ep-menu-info">
                                                    <span className="ep-menu-name">{dish.name}</span>
                                                    <span className="ep-menu-price">₹{dish.basePrice}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {getEventDishes(selectedEvent).length > 12 && (
                                            <div className="ep-menu-more">+{getEventDishes(selectedEvent).length - 12} more</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedEvent.tags?.length > 0 && (
                                <div className="ep-sheet-tags">
                                    {selectedEvent.tags.map((t, i) => <span key={i} className="ep-tag">{t}</span>)}
                                </div>
                            )}
                        </div>

                        <div className="ep-sheet-cta">
                            {isPast(selectedEvent.date) ? (
                                <button className="form-action-btn disabled">
                                    <span className="shadow"></span>
                                    <span className="edge"></span>
                                    <span className="front">Event Ended</span>
                                </button>
                            ) : isBooked(selectedEvent.id) ? (
                                <div className="ep-cta-booked-stack">
                                    <div className="ep-cta-booked">
                                        <span>You're enrolled!</span>
                                        <span className="ep-cta-booking-id">
                                            Booking #{bookedForEvent(selectedEvent.id)?.id?.slice(-6)}
                                            &nbsp;· {bookedForEvent(selectedEvent.id)?.guests} guest{bookedForEvent(selectedEvent.id)?.guests !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    {!isBookingClosed(selectedEvent) && (
                                        <button className="ep-add-guest-btn" onClick={() => openAddGuest(selectedEvent)}>
                                            Add More Guests
                                        </button>
                                    )}
                                </div>
                            ) : isBookingClosed(selectedEvent) ? (
                                <button className="form-action-btn disabled" disabled>
                                    <span className="shadow"></span>
                                    <span className="edge"></span>
                                    <span className="front">Booking Closed</span>
                                </button>
                            ) : (
                                <button className="form-action-btn done" onClick={() => openEnroll(selectedEvent)}>
                                    <span></span>
                                    <span className="shadow"></span>
                                    <span className="edge"></span>
                                    <span className="front">Book Ticket &amp; Win a Coupon</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ENROLL MODAL */}
            {showEnroll && selectedEvent && (
                <div className="ep-sheet-overlay" onClick={submitState === "scratch" ? undefined : closeEnroll}>
                    <div className="ep-enroll-modal" onClick={e => e.stopPropagation()}>

                        {submitState !== "scratch" && (
                            <button className="ep-sheet-close-btn" onClick={closeEnroll}><img src={closeIcon} alt="" className="close-icon" /></button>
                        )}

                        {submitState === "scratch" && coupon ? (
                            /* ─── Improved success + scratch screen ─── */
                            <div className="ep-success-screen">
                                <div className="ep-success-header">
                                    <div className="ep-success-check-ring">
                                        <div className="ep-success-check">✓</div>
                                    </div>
                                    <h3 className="ep-success-title">You're Enrolled!</h3>
                                    <p className="ep-success-event-name">{selectedEvent.title}</p>
                                    <p className="ep-success-date">{formatDate(selectedEvent.date)}</p>
                                </div>

                                <div className="ep-success-divider">
                                    <span>Your reward is waiting</span>
                                </div>

                                <ScratchCard coupon={coupon} onDone={handleScratchDone} />
                            </div>
                        ) : (
                            <>
                                <div className="ep-enroll-header">
                                    <div className="ep-enroll-evt-thumb">
                                        {getEventImages(selectedEvent)[0]
                                            ? <img src={getEventImages(selectedEvent)[0]} alt={selectedEvent.title} />
                                            : <div className="ep-enroll-thumb-placeholder" style={{ background: TYPE_GRADIENT[selectedEvent.eventType] }}>{selectedEvent.title?.charAt(0)}</div>}
                                    </div>
                                    <div>
                                        <h3>Book Your Ticket</h3>
                                        <p className="ep-enroll-sub">{selectedEvent.title}</p>
                                        <p className="ep-enroll-date">{formatDate(selectedEvent.date)}</p>
                                    </div>
                                </div>

                                <div className="ep-reward-teaser">
                                    <span>Confirm your spot and scratch a card to win an exclusive coupon!</span>
                                </div>

                                <div className="ep-enroll-body">
                                    {(Number(selectedEvent.price) || 0) > 0 && (
                                        <div className="ep-price-preview">
                                            <span>₹{Number(selectedEvent.price).toLocaleString("en-IN")} × {form.guests} guest(s)</span>
                                            <span className="ep-price-total">= ₹{(Number(form.guests) * Number(selectedEvent.price)).toLocaleString("en-IN")}</span>
                                        </div>
                                    )}
                                    <div className="ep-form-field">
                                        <input type="text" value={form.name} placeholder=" "
                                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                                        <label>Full Name *</label>
                                        <span className="ep-mat-bar" />
                                    </div>
                                    <div className="ep-form-field">
                                        <input type="email" value={form.email} placeholder=" "
                                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                                        <label>Email *</label>
                                        <span className="ep-mat-bar" />
                                    </div>
                                    <div className="ep-form-field">
                                        <input type="tel" value={form.phone} placeholder=" "
                                            maxLength={10}
                                            onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} />
                                        <label>Phone * <span style={{ fontSize: 10, color: "#aaa", fontWeight: 400 }}>(10 digits)</span></label>
                                        <span className="ep-mat-bar" />
                                    </div>
                                    <div className="ep-form-field-guest">
                                        <label>Number of Guests</label>
                                        <div className="ep-guests-row">
                                            <button type="button" className="ep-qty-btn" onClick={() => setForm(p => ({ ...p, guests: Math.max(1, p.guests - 1) }))}>−</button>
                                            <span className="ep-qty-val">{form.guests}</span>
                                            <button type="button" className="ep-qty-btn" onClick={() => { const max = selectedEvent.maxCapacity || 20; setForm(p => ({ ...p, guests: Math.min(max, p.guests + 1) })); }}>+</button>
                                        </div>
                                    </div>
                                    <div className="ep-form-field">
                                        <textarea rows={3} value={form.specialRequests} placeholder=" "
                                            onChange={e => setForm(p => ({ ...p, specialRequests: e.target.value }))} />
                                        <label>Special Requests (optional)</label>
                                        <span className="ep-mat-bar" />
                                    </div>
                                    {errorMsg && <p className="ep-error-msg">{errorMsg}</p>}
                                </div>

                                <div className="ep-enroll-footer">
                                    <button className="ep-action-btn submit" onClick={handleEnroll} disabled={submitState === "loading"}>
                                        <span className="ep-btn-shadow"></span>
                                        <span className="ep-btn-edge"></span>
                                        <span className="ep-btn-front">{submitState === "loading" ? "Submitting…" : "Confirm & Win Coupon"}</span>
                                    </button>
                                    <button className="ep-action-btn cancel" onClick={closeEnroll}>
                                        <span className="ep-btn-shadow"></span>
                                        <span className="ep-btn-edge"></span>
                                        <span className="ep-btn-front">Cancel</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ADD GUEST MODAL */}
            {showAddGuest && selectedEvent && (
                <div className="ep-sheet-overlay" onClick={closeAddGuest}>
                    <div className="ep-enroll-modal ep-add-guest-modal" onClick={e => e.stopPropagation()}>
                        <button className="ep-sheet-close-btn" onClick={closeAddGuest}><img src={closeIcon} alt="" className="close-icon" /></button>

                        {addGuestState === "done" ? (
                            <div className="ep-success-screen">
                                <div className="ep-success-header">
                                    <div className="ep-success-check-ring">
                                        <div className="ep-success-check">✓</div>
                                    </div>
                                    <h3 className="ep-success-title">Guests Added!</h3>
                                    <p className="ep-success-event-name">{selectedEvent.title}</p>
                                    <p className="ep-success-date">
                                        New total: <strong>{bookedForEvent(selectedEvent.id)?.guests} guests</strong>
                                    </p>
                                </div>
                                <button className="form-action-btn" style={{ margin: "20px 24px 0" }} onClick={() => { closeAddGuest(); setSelectedEvent(null); }}>
                                    <span className="shadow"></span>
                                    <span className="edge"></span>
                                    <span className="front">Done</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="ep-enroll-header">
                                    <div className="ep-enroll-evt-thumb">
                                        {(() => { const imgs = !selectedEvent.images?.length ? (selectedEvent.image ? [selectedEvent.image] : []) : selectedEvent.images; return imgs[0] ? <img src={imgs[0]} alt={selectedEvent.title} /> : <div className="ep-enroll-thumb-placeholder" style={{ background: "linear-gradient(135deg,#8b5cf6,#ec4899)" }}>{selectedEvent.title?.charAt(0)}</div>; })()}
                                    </div>
                                    <div>
                                        <h3>Add More Guests</h3>
                                        <p className="ep-enroll-sub">{selectedEvent.title}</p>
                                        <p className="ep-enroll-date">
                                            Currently booked: <strong>{bookedForEvent(selectedEvent.id)?.guests} guest{bookedForEvent(selectedEvent.id)?.guests !== 1 ? "s" : ""}</strong>
                                        </p>
                                    </div>
                                </div>

                                <div className="ep-enroll-body">
                                    {(() => {
                                        const maxCap = Number(selectedEvent.maxCapacity) || 0;
                                        const totalBooked = allBookings
                                            .filter(b => b.eventId === selectedEvent.id && b.status !== "cancelled")
                                            .reduce((s, b) => s + (Number(b.guests) || 1), 0);
                                        const remaining = maxCap > 0 ? maxCap - totalBooked : null;
                                        return remaining !== null ? (
                                            <div className="ep-add-guest-capacity">
                                                <span><strong>{remaining}</strong> seat{remaining !== 1 ? "s" : ""} remaining out of {maxCap} total</span>
                                            </div>
                                        ) : null;
                                    })()}

                                    <div className="ep-form-field-guest">
                                        <label>How many guests to add?</label>
                                        <div className="ep-guests-row">
                                            <button type="button" className="ep-qty-btn" onClick={() => setAddGuestForm(p => ({ ...p, guests: Math.max(1, p.guests - 1) }))}>−</button>
                                            <span className="ep-qty-val">{addGuestForm.guests}</span>
                                            <button type="button" className="ep-qty-btn" onClick={() => {
                                                const maxCap = Number(selectedEvent.maxCapacity) || 0;
                                                const totalBooked = allBookings.filter(b => b.eventId === selectedEvent.id && b.status !== "cancelled").reduce((s, b) => s + (Number(b.guests) || 1), 0);
                                                const slotsLeft = maxCap > 0 ? maxCap - totalBooked : 20;
                                                setAddGuestForm(p => ({ ...p, guests: Math.min(slotsLeft, p.guests + 1) }));
                                            }}>+</button>
                                        </div>
                                    </div>

                                    {Number(selectedEvent.price) > 0 && (
                                        <div className="ep-price-preview">
                                            <span>₹{Number(selectedEvent.price).toLocaleString("en-IN")} × {addGuestForm.guests} extra guest(s)</span>
                                            <span className="ep-price-total">+ ₹{(addGuestForm.guests * Number(selectedEvent.price)).toLocaleString("en-IN")}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="ep-enroll-footer">
                                    <button className="ep-action-btn submit" disabled={addGuestState === "loading"} onClick={handleAddGuests}>
                                        <span className="ep-btn-shadow"></span>
                                        <span className="ep-btn-edge"></span>
                                        <span className="ep-btn-front">{addGuestState === "loading" ? "Updating…" : `Confirm Add ${addGuestForm.guests} Guest${addGuestForm.guests !== 1 ? "s" : ""}`}</span>
                                    </button>
                                    <button className="ep-action-btn cancel" onClick={closeAddGuest}>
                                        <span className="ep-btn-shadow"></span>
                                        <span className="ep-btn-edge"></span>
                                        <span className="ep-btn-front">Cancel</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsPage;