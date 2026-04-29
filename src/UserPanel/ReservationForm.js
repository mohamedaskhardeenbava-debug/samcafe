import { useState, useEffect, useRef } from "react";
import api from "../api";
import homeIcon from "../assets/icons/home.png";
import "./ReservationForm.css";
import { useToast } from "./Usetoast";

const pad = (n) => String(n).padStart(2, "0");
const todayStr = () => new Date().toISOString().split("T")[0];

const SLOT_GROUPS = [
    { label: "Breakfast", key: "BF", start: "07:00", end: "10:00" },
    { label: "Brunch", key: "BR", start: "10:00", end: "12:00" },
    { label: "Lunch", key: "LU", start: "12:00", end: "15:00" },
    { label: "Hi-Tea", key: "HT", start: "15:00", end: "18:00" },
    { label: "Dinner", key: "DI", start: "18:30", end: "22:00" },
];

const TABLE_PREFS = [
    {
        label: "Window",
        desc: "Natural light, street view",
        svg: (
            <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="56" height="40" rx="3" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1.5" />
                <line x1="30" y1="2" x2="30" y2="42" stroke="#60a5fa" strokeWidth="1.5" />
                <line x1="2" y1="22" x2="58" y2="22" stroke="#60a5fa" strokeWidth="1.5" />
                <rect x="10" y="28" width="16" height="10" rx="2" fill="#93c5fd" opacity=".6" />
                <rect x="34" y="28" width="16" height="10" rx="2" fill="#93c5fd" opacity=".6" />
                <path d="M8 6 L14 14 M18 6 L24 14" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        label: "Booth",
        desc: "Cozy enclosed seating",
        svg: (
            <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="52" height="36" rx="6" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" />
                <rect x="4" y="4" width="12" height="36" rx="4" fill="#fbbf24" />
                <rect x="44" y="4" width="12" height="36" rx="4" fill="#fbbf24" />
                <rect x="16" y="16" width="28" height="12" rx="3" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.2" />
                <circle cx="30" cy="22" r="4" fill="#fcd34d" />
            </svg>
        ),
    },
    {
        label: "Hitter",
        desc: "High-top bar seating",
        svg: (
            <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="16" y="6" width="28" height="6" rx="2" fill="#6b7280" stroke="#4b5563" strokeWidth="1.2" />
                <line x1="30" y1="12" x2="30" y2="38" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
                <circle cx="14" cy="18" r="5" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.2" />
                <line x1="14" y1="23" x2="14" y2="38" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                <circle cx="46" cy="18" r="5" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.2" />
                <line x1="46" y1="23" x2="46" y2="38" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        label: "Any",
        desc: "No preference",
        svg: (
            <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="14" width="40" height="22" rx="4" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />
                <rect x="18" y="8" width="6" height="10" rx="2" fill="#9ca3af" />
                <rect x="36" y="8" width="6" height="10" rx="2" fill="#9ca3af" />
                <rect x="18" y="32" width="6" height="10" rx="2" fill="#9ca3af" />
                <rect x="36" y="32" width="6" height="10" rx="2" fill="#9ca3af" />
                <circle cx="30" cy="25" r="5" fill="#d1d5db" />
                <text x="30" y="29" textAnchor="middle" fontSize="8" fill="#9ca3af" fontWeight="700">ANY</text>
            </svg>
        ),
    },
];

/* ─── Custom Date Picker ─────────────────────────── */
const MONTHS_CDP = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CustomDatePicker = ({ value, onChange, min }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const parsed = value ? new Date(value) : new Date();
    const [view, setView] = useState("day");
    const [calYear, setCalYear] = useState(parsed.getFullYear());
    const [calMonth, setCalMonth] = useState(parsed.getMonth());

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const minD = min ? new Date(min) : null;
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const select = (d) => {
        const s = `${calYear}-${pad(calMonth + 1)}-${pad(d)}`;
        onChange(s); setOpen(false);
    };
    const isDisabled = (d) => {
        if (!minD) return false;
        const ds = new Date(`${calYear}-${pad(calMonth + 1)}-${pad(d)}T00:00:00`);
        return ds < minD;
    };
    const displayVal = value
        ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "Select date";
    const yearRange = Array.from({ length: 20 }, (_, i) => calYear - 5 + i);

    return (
        <div className="cdp-wrap" ref={ref} style={{ display: "inline-block", position: "relative" }}>
            <button type="button" className="cdp-trigger rf-cdp-trigger" onClick={() => { setOpen(o => !o); setView("day"); if (value) { const p = new Date(value); setCalYear(p.getFullYear()); setCalMonth(p.getMonth()); } }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <span className="rf-cdp-val">{displayVal}</span>
                <span style={{ marginLeft: "auto", opacity: .4, fontSize: 12 }}>▾</span>
            </button>
            {open && (
                <div className="cdp-popup" style={{ zIndex: 9999 }}>
                    <div className="cdp-nav">
                        <button type="button" className="cdp-nav-btn" onClick={() => { if (view === "day") { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); } else if (view === "year") setCalYear(y => y - 20); }}>‹</button>
                        <div className="cdp-nav-center">
                            {view === "day" && <><button type="button" className="cdp-nav-lbl" onClick={() => setView("month")}>{MONTHS_CDP[calMonth]}</button><button type="button" className="cdp-nav-lbl" onClick={() => setView("year")}>{calYear}</button></>}
                            {view === "month" && <button type="button" className="cdp-nav-lbl" onClick={() => setView("year")}>{calYear}</button>}
                            {view === "year" && <span className="cdp-nav-lbl">{calYear - 5} – {calYear + 14}</span>}
                        </div>
                        <button type="button" className="cdp-nav-btn" onClick={() => { if (view === "day") { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); } else if (view === "year") setCalYear(y => y + 20); }}>›</button>
                    </div>
                    {view === "day" && (<>
                        <div className="cdp-weekdays">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <span key={d}>{d}</span>)}</div>
                        <div className="cdp-grid">
                            {cells.map((d, i) => {
                                if (!d) return <span key={i} />;
                                const ds = `${calYear}-${pad(calMonth + 1)}-${pad(d)}`;
                                const sel = ds === value, dis = isDisabled(d), tod = ds === todayStr();
                                return <button type="button" key={i} className={`cdp-day${sel ? " cdp-sel" : ""}${dis ? " cdp-dis" : ""}${tod && !sel ? " cdp-today" : ""}`} disabled={dis} onClick={() => select(d)}>{d}</button>;
                            })}
                        </div>
                    </>)}
                    {view === "month" && (
                        <div className="cdp-month-grid">
                            {MONTHS_CDP.map((m, i) => <button type="button" key={i} className={`cdp-month-btn${i === calMonth ? " cdp-sel" : ""}`} onClick={() => { setCalMonth(i); setView("day"); }}>{m.slice(0, 3)}</button>)}
                        </div>
                    )}
                    {view === "year" && (
                        <div className="cdp-year-grid">
                            {yearRange.map(y => <button type="button" key={y} className={`cdp-year-btn${y === calYear ? " cdp-sel" : ""}`} onClick={() => { setCalYear(y); setView("month"); }}>{y}</button>)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/* ─── Clock Time Picker ─────────────────────────── */
const ClockTimePicker = ({ value, onChange, slotStart, slotEnd, disabled, isToday }) => {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState("hour");
    const ref = useRef(null);
    const svgRef = useRef(null);

    const parseTime = (v) => {
        if (!v) return { h: 12, m: 0, ampm: "PM" };
        const [hh, mm] = v.split(":").map(Number);
        return { h: hh % 12 || 12, m: mm, ampm: hh >= 12 ? "PM" : "AM" };
    };

    // Use a ref for internal state to avoid re-render loops
    const selRef = useRef(parseTime(value));
    const [sel, setSel] = useState(parseTime(value));

    // Sync only when value changes externally (not from our own onChange)
    const lastEmitted = useRef(value);
    useEffect(() => {
        if (value && value !== lastEmitted.current) {
            const p = parseTime(value);
            selRef.current = p;
            setSel(p);
        }
    }, [value]);

    const to24 = (h, m, ampm) => {
        let hh = ampm === "PM" ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
        return `${pad(hh)}:${pad(m)}`;
    };

    const slotH24Start = slotStart ? parseInt(slotStart.split(":")[0]) : 0;
    const slotH24End = slotEnd ? parseInt(slotEnd.split(":")[0]) : 24;
    const nowH = new Date().getHours();
    const nowM = new Date().getMinutes();

    const isHourDisabled = (h, ampm) => {
        if (disabled) return true;
        const h24 = ampm === "PM" ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
        if (slotStart && slotEnd && (h24 < slotH24Start || h24 >= slotH24End)) return true;
        if (isToday && h24 < nowH) return true;
        return false;
    };

    const isMinDisabled = (m) => {
        if (disabled) return true;
        const cur = selRef.current;
        const h24 = parseInt(to24(cur.h, m, cur.ampm).split(":")[0]);
        if (isToday && h24 === nowH && m < nowM) return true;
        return false;
    };

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setMode("hour"); } };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const CLOCK_R = 100; const CENTER = 110; const HOUR_R = 78; const MIN_R = 78;
    const hours12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    const hourAngle = (h) => ((h % 12) / 12) * 360 - 90;
    const minAngle = (m) => (m / 60) * 360 - 90;
    const polarToXY = (angle, r) => ({
        x: CENTER + r * Math.cos((angle * Math.PI) / 180),
        y: CENTER + r * Math.sin((angle * Math.PI) / 180),
    });

    const emitChange = (ns) => {
        const v = to24(ns.h, ns.m, ns.ampm);
        lastEmitted.current = v;
        onChange(v);
    };

    const selectHour = (h) => {
        if (isHourDisabled(h, selRef.current.ampm)) return;
        const ns = { ...selRef.current, h };
        selRef.current = ns;
        setSel({ ...ns });
        emitChange(ns);
        setTimeout(() => setMode("minute"), 200);
    };

    const selectMinute = (m) => {
        if (isMinDisabled(m)) return;
        const ns = { ...selRef.current, m };
        selRef.current = ns;
        setSel({ ...ns });
        emitChange(ns);
        setTimeout(() => { setOpen(false); setMode("hour"); }, 200);
    };

    const toggleAmpm = (ap) => {
        const ns = { ...selRef.current, ampm: ap };
        selRef.current = ns;
        setSel({ ...ns });
        emitChange(ns);
    };

    // Drag on clock face
    const handleSvgDrag = (e) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = clientX - rect.left - CENTER;
        const y = clientY - rect.top - CENTER;
        const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
        const norm = ((angle % 360) + 360) % 360;
        if (mode === "hour") {
            const h = Math.round(norm / 30) % 12 || 12;
            if (!isHourDisabled(h, selRef.current.ampm)) {
                const ns = { ...selRef.current, h };
                selRef.current = ns;
                setSel({ ...ns });
                emitChange(ns);
            }
        } else {
            const rawM = Math.round(norm / 6) % 60;
            const snapped = Math.round(rawM / 5) * 5 % 60;
            if (!isMinDisabled(snapped)) {
                const ns = { ...selRef.current, m: snapped };
                selRef.current = ns;
                setSel({ ...ns });
                emitChange(ns);
            }
        }
    };

    const displayVal = value ? (() => {
        const [hh, mm] = value.split(":").map(Number);
        const ap = hh >= 12 ? "PM" : "AM";
        return `${hh % 12 || 12}:${pad(mm)} ${ap}`;
    })() : "Select time";

    const handAngle = mode === "hour" ? hourAngle(sel.h) : minAngle(sel.m);
    const handR = mode === "hour" ? HOUR_R - 14 : MIN_R - 14;
    const handTip = polarToXY(handAngle, handR);

    return (
        <div className="ctp-wrap" ref={ref}>
            <button type="button" className={`ctp-trigger${disabled ? " ctp-disabled" : ""}`} onClick={() => !disabled && setOpen(o => !o)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <span className={`ctp-val${!value ? " ctp-placeholder" : ""}`}>{displayVal}</span>
                <span style={{ marginLeft: "auto", opacity: .4, fontSize: 12 }}>▾</span>
            </button>
            {open && !disabled && (
                <div className="ctp-popup">
                    <div className="ctp-header">
                        <div className="ctp-ampm-col">
                            <button type="button" className={`ctp-ampm-btn${sel.ampm === "AM" ? " active" : ""}`} onClick={() => toggleAmpm("AM")}>AM</button>
                            <button type="button" className={`ctp-ampm-btn${sel.ampm === "PM" ? " active" : ""}`} onClick={() => toggleAmpm("PM")}>PM</button>
                        </div>
                        <div className="ctp-time-display">
                            <span className={`ctp-hm-btn${mode === "hour" ? " active" : ""}`} onClick={() => setMode("hour")}>{pad(sel.h)}</span>
                            <span className="ctp-colon">:</span>
                            <span className={`ctp-hm-btn${mode === "minute" ? " active" : ""}`} onClick={() => setMode("minute")}>{pad(sel.m)}</span>
                        </div>
                    </div>
                    <svg
                        ref={svgRef}
                        width={CENTER * 2} height={CENTER * 2}
                        className="ctp-clock-svg"
                        onMouseMove={(e) => e.buttons === 1 && handleSvgDrag(e)}
                        onTouchMove={handleSvgDrag}
                        style={{ touchAction: "none" }}
                    >
                        <circle cx={CENTER} cy={CENTER} r={CLOCK_R} fill="#f8f9fa" stroke="#e5e7eb" strokeWidth="1.5" />
                        <line x1={CENTER} y1={CENTER} x2={handTip.x} y2={handTip.y} stroke="#1dd1a1" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx={CENTER} cy={CENTER} r="4" fill="#1dd1a1" />
                        <circle cx={handTip.x} cy={handTip.y} r="16" fill="#1dd1a1" opacity="0.18" />
                        <circle cx={handTip.x} cy={handTip.y} r="4" fill="#1dd1a1" />
                        {mode === "hour" && hours12.map((h) => {
                            const ang = hourAngle(h);
                            const pos = polarToXY(ang, HOUR_R);
                            const isSelected = sel.h === h;
                            const isDis = isHourDisabled(h, sel.ampm);
                            return (
                                <g key={h} onClick={() => selectHour(h)} style={{ cursor: isDis ? "not-allowed" : "pointer" }}>
                                    <circle cx={pos.x} cy={pos.y} r="16" fill={isSelected ? "#1dd1a1" : "transparent"} />
                                    <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                                        fontSize="13" fontWeight={isSelected ? "700" : "400"}
                                        fill={isDis ? "#ccc" : isSelected ? "#fff" : "#333"}>{h}</text>
                                </g>
                            );
                        })}
                        {mode === "minute" && minutes.map((m) => {
                            const ang = minAngle(m);
                            const pos = polarToXY(ang, MIN_R);
                            const isSelected = sel.m === m;
                            const isDis = isMinDisabled(m);
                            return (
                                <g key={m} onClick={() => selectMinute(m)} style={{ cursor: isDis ? "not-allowed" : "pointer" }}>
                                    <circle cx={pos.x} cy={pos.y} r="16" fill={isSelected ? "#1dd1a1" : "transparent"} />
                                    <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                                        fontSize="12" fontWeight={isSelected ? "700" : "400"}
                                        fill={isDis ? "#ccc" : isSelected ? "#fff" : "#333"}>{pad(m)}</text>
                                </g>
                            );
                        })}
                    </svg>
                    <div className="ctp-footer">
                        <button type="button" className="ctp-cancel-btn" onClick={() => { setOpen(false); setMode("hour"); }}>Cancel</button>
                        <button type="button" className="ctp-ok-btn" onClick={() => { emitChange(selRef.current); setOpen(false); setMode("hour"); }}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Main Form Component ────────────────────────── */
const ReservationForm = ({ handleBack, handleHome, foodData }) => {
    const { toast } = useToast();
    const [form, setForm] = useState({
        name: "", mobile: "", email: "", guests: 2,
        slotGroup: "", time: "", date: todayStr(),
        tablePref: "Any", notes: "", status: "pending",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [bookingId, setBookingId] = useState("");
    const [errors, setErrors] = useState({});
    const [showCrossCheck, setShowCrossCheck] = useState(false);

    // Pre-fill user — run once on mount only
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const uid = localStorage.getItem("userId");
                if (!uid) return;
                const res = await api.get(`/users/${uid}`);
                if (!cancelled) {
                    setForm(p => ({ ...p, name: res.data?.name || "", mobile: res.data?.mobile || "", email: res.data?.email || "" }));
                }
            } catch { }
        };
        load();
        return () => { cancelled = true; };
    }, []); // empty deps — runs once

    const set = (key, val) => {
        setForm(p => ({ ...p, [key]: val }));
        setErrors(e => ({ ...e, [key]: "" }));
    };

    const fmtTime = (t) => {
        if (!t) return "";
        const [h, m] = t.split(":").map(Number);
        return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
    };

    const currentSlot = SLOT_GROUPS.find(s => s.key === form.slotGroup);
    const isToday = form.date === todayStr();

    const handleSlotChange = (key) => {
        set("slotGroup", key);
        set("time", "");
    };

    const handleDateChange = (d) => {
        set("date", d);
        set("time", "");
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim() || form.name.trim().length < 2) e.name = "Enter a valid name";
        const cleanMobile = form.mobile.replace(/\D/g, "");
        if (!cleanMobile || cleanMobile.length !== 10) e.mobile = "Enter a valid 10-digit number";
        if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Invalid email";
        if (!form.guests || Number(form.guests) < 1) e.guests = "At least 1 guest required";
        if (!form.date) e.date = "Pick a date";
        else if (form.date < todayStr()) e.date = "Date cannot be in the past";
        if (!form.slotGroup) e.slotGroup = "Pick a dining slot";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const id = `res_${Date.now()}`;
            await api.post("/reservations", { id, ...form, status: "pending", source: "User App", createdAt: new Date().toISOString() });
            setBookingId(id.slice(-6).toUpperCase());
            setSubmitted(true);
        } catch {
            toast.error("Failed to reserve table. Please try again.");
        } finally {
            setSubmitting(false);
            setShowCrossCheck(false);
        }
    };

    // Success screen
    if (submitted) {
        const slot = SLOT_GROUPS.find(s => s.key === form.slotGroup);
        return (
            <div className="rf-page">
                <div className="rf-success-screen">
                    <div className="rf-success-icon">
                        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                            <circle cx="30" cy="30" r="30" fill="#d1fae5" />
                            <path d="M18 30 L26 38 L42 22" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h2 className="rf-success-title">Reservation Confirmed!</h2>
                    <p className="rf-success-sub">Your table is reserved. We look forward to hosting you.</p>
                    <div className="rf-booking-id">
                        <span className="rf-booking-label">Booking ID</span>
                        <span className="rf-booking-code">#{bookingId}</span>
                    </div>
                    <div className="rf-success-card">
                        <div className="rf-sc-row"><span className="rf-sc-label">Guest</span><span className="rf-sc-val">{form.name}</span></div>
                        <div className="rf-sc-row"><span className="rf-sc-label">Date</span><span className="rf-sc-val">{form.date}</span></div>
                        <div className="rf-sc-row"><span className="rf-sc-label">Slot</span><span className="rf-sc-val">{slot?.label}</span></div>
                        {form.time && <div className="rf-sc-row"><span className="rf-sc-label">Time</span><span className="rf-sc-val">{fmtTime(form.time)}</span></div>}
                        <div className="rf-sc-row"><span className="rf-sc-label">Guests</span><span className="rf-sc-val">{form.guests}</span></div>
                        <div className="rf-sc-row"><span className="rf-sc-label">Seating</span><span className="rf-sc-val">{form.tablePref}</span></div>
                        {form.notes && <div className="rf-sc-row rf-sc-notes"><span className="rf-sc-label">Notes</span><span className="rf-sc-val">{form.notes}</span></div>}
                    </div>
                    <p className="rf-success-policy">Please arrive 10 min early. Reservation held for 15 min.</p>
                    <button className="rf-cta-btn" onClick={() => { setSubmitted(false); setForm({ name: "", mobile: "", email: "", guests: 2, slotGroup: "", time: "", date: todayStr(), tablePref: "Any", notes: "", status: "pending" }); }}>Make Another Reservation</button>
                    <button className="rf-ghost-btn" onClick={handleHome}>Back to Home</button>
                </div>
            </div>
        );
    }

    // Cross-check modal
    const CrossCheckModal = () => (
        <div className="rf-modal-overlay" onClick={() => setShowCrossCheck(false)}>
            <div className="rf-modal" onClick={e => e.stopPropagation()}>
                <div className="rf-modal-title">Confirm Your Booking</div>
                <div className="rf-modal-grid">
                    {[
                        ["Name", form.name],
                        ["Mobile", "+91 " + form.mobile],
                        ["Email", form.email || "—"],
                        ["Guests", form.guests],
                        ["Date", form.date],
                        ["Time", form.time ? fmtTime(form.time) : "Not specified"],
                        ["Slot", SLOT_GROUPS.find(s => s.key === form.slotGroup)?.label || "—"],
                        ["Seating", form.tablePref],
                    ].map(([k, v]) => (
                        <div key={k} className="rf-modal-row">
                            <span className="rf-modal-key">{k}</span>
                            <span className="rf-modal-val">{v}</span>
                        </div>
                    ))}
                </div>
                {form.notes && <div className="rf-modal-notes"><span className="rf-modal-key">Notes</span><span>{form.notes}</span></div>}
                <div className="rf-modal-actions">
                    <button className="rf-ghost-btn" onClick={() => setShowCrossCheck(false)}>Edit</button>
                    <button className="rf-cta-btn" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? <span className="rf-spinner" /> : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="rf-page">
            {showCrossCheck && <CrossCheckModal />}

            <div className="rf-header">
                <button className="back-button" onClick={handleBack} />
                <div>
                    <div className="rf-page-title">Table Reservation</div>
                    <div className="rf-page-sub">Reserve your perfect dining experience</div>
                </div>
                <div className="home-btn" onClick={handleHome}><img src={homeIcon} alt="home" /></div>
            </div>

            <div className="rf-single-form">
                <div className="rf-form-grid">

                    {/* LEFT COLUMN */}
                    <div className="rf-col rf-col-left">

                        {/* Guest Details */}
                        <div className="rf-section">
                            <div className="rf-section-title">Guest Details</div>
                            <div className="rf-field-group">
                                <label>Full Name <span className="rf-req">*</span></label>
                                <input className={`rf-input${errors.name ? " error" : ""}`} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Enter your name" />
                                {errors.name && <span className="rf-error">{errors.name}</span>}
                            </div>
                            <div className="rf-row">
                                <div className="rf-field-group" style={{ flex: 1.4 }}>
                                    <label>Mobile <span className="rf-req">*</span></label>
                                    <div className="rf-input-prefix-wrap">
                                        <span className="rf-prefix">+91</span>
                                        <input className={`rf-input rf-input-with-prefix${errors.mobile ? " error" : ""}`} type="tel" value={form.mobile} onChange={e => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" />
                                    </div>
                                    {errors.mobile && <span className="rf-error">{errors.mobile}</span>}
                                </div>
                                <div className="rf-field-group" style={{ flex: 1 }}>
                                    <label>Email <span className="rf-optional">(optional)</span></label>
                                    <input className={`rf-input${errors.email ? " error" : ""}`} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="your@email.com" />
                                    {errors.email && <span className="rf-error">{errors.email}</span>}
                                </div>
                            </div>
                            <div className="rf-row rf-row-inline">
                                <div className="rf-field-group" style={{ flex: "0 0 auto" }}>
                                    <label>Guests <span className="rf-req">*</span></label>
                                    <div className="rf-stepper-ctrl">
                                        <button type="button" className="rf-stepper-btn" onClick={() => set("guests", Math.max(1, form.guests - 1))}>−</button>
                                        <span className="rf-stepper-val">{form.guests}</span>
                                        <button type="button" className="rf-stepper-btn" onClick={() => set("guests", Math.min(30, form.guests + 1))}>+</button>
                                    </div>
                                    {errors.guests && <span className="rf-error">{errors.guests}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Seating Preference — visual cards */}
                        <div className="rf-section">
                            <div className="rf-section-title">Seating Preference</div>
                            <div className="rf-table-pref-grid">
                                {TABLE_PREFS.map(p => (
                                    <button type="button" key={p.label}
                                        className={`rf-table-pref-card${form.tablePref === p.label ? " active" : ""}`}
                                        onClick={() => set("tablePref", p.label)}>
                                        {form.tablePref === p.label && <span className="rf-tpref-tick">✓</span>}
                                        <div className="rf-tpref-visual">{p.svg}</div>
                                        <div className="rf-tpref-label">{p.label}</div>
                                        <div className="rf-tpref-desc">{p.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="rf-col rf-col-right">
                        <div className="rf-section">
                            <div className="rf-section-title">Date &amp; Dining Slot</div>

                            <div className="rf-row rf-row-inline">
                                <div className="rf-field-group" style={{ flex: "0 0 auto" }}>
                                    <label>Date <span className="rf-req">*</span></label>
                                    <CustomDatePicker value={form.date} min={todayStr()} onChange={handleDateChange} />
                                    {errors.date && <span className="rf-error">{errors.date}</span>}
                                </div>

                                <div className="rf-field-group">
                                    <label>Dining Slot <span className="rf-req">*</span></label>
                                    <div className="rf-slot-groups">
                                        {SLOT_GROUPS.map(sg => {
                                            const nowH = new Date().getHours();
                                            const slotEndH = parseInt(sg.end.split(":")[0]);
                                            const isPastSlot = isToday && nowH >= slotEndH;
                                            return (
                                                <div key={sg.key}
                                                    className={`rf-slot-group${form.slotGroup === sg.key ? " active" : ""}${isPastSlot ? " rf-slot-disabled" : ""}`}
                                                    onClick={() => !isPastSlot && handleSlotChange(sg.key)}>
                                                    <span className="rf-sg-label">{sg.label}</span>
                                                    <span className="rf-sg-time">{sg.start} – {sg.end}</span>
                                                    {isPastSlot && <span className="rf-slot-past-badge">Passed</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {errors.slotGroup && <span className="rf-error">{errors.slotGroup}</span>}
                                </div>

                                <div className="rf-field-group" style={{ flex: "0 0 auto" }}>
                                    <label>Preferred Time <span className="rf-optional">(optional)</span></label>
                                    <ClockTimePicker
                                        value={form.time}
                                        onChange={v => set("time", v)}
                                        slotStart={currentSlot?.start}
                                        slotEnd={currentSlot?.end}
                                        disabled={!form.slotGroup}
                                        isToday={isToday}
                                    />
                                    {!form.slotGroup && <span style={{ fontSize: 11, color: "#aaa", marginTop: 4, display: "block" }}>Select a slot first</span>}
                                    {form.slotGroup && currentSlot && <span style={{ fontSize: 11, color: "#888", marginTop: 4, display: "block" }}>{currentSlot.start} – {currentSlot.end}</span>}
                                </div>
                            </div>


                        </div>
                        {/* Notes */}
                        <div className="rf-section">
                            <div className="rf-section-title">Special Requests</div>
                            <textarea className="rf-textarea rf-textarea-grow" rows={3}
                                placeholder="Dietary restrictions, occasion, special setup..."
                                value={form.notes} onChange={e => set("notes", e.target.value)} />
                        </div>

                        <button type="button" className="rf-cta-btn rf-submit-btn" onClick={() => { if (validate()) setShowCrossCheck(true); }}>
                            Review &amp; Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationForm;