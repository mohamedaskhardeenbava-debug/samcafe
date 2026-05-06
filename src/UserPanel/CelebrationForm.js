/* user panel */
import { useState, useEffect, useRef } from "react";
import api from "../api";
import homeIcon from "../assets/icons/home.png";
import "./CelebrationForm.css";

const pad = (n) => String(n).padStart(2, "0");
const todayStr = () => new Date().toISOString().split("T")[0];

/* Tomorrow — disables today AND all past dates */
const tomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
};

const SLOT_GROUPS = [
    { label: "Breakfast", key: "BF", start: "07:00", end: "10:00" },
    { label: "Brunch", key: "BR", start: "10:00", end: "12:00" },
    { label: "Lunch", key: "LU", start: "12:00", end: "15:00" },
    { label: "Hi-Tea", key: "HT", start: "15:00", end: "18:00" },
    { label: "Dinner", key: "DI", start: "18:30", end: "22:00" },
];

/* ─── Celebration Types (no inline emoji icons) ─── */
const CELEBRATION_TYPES = [
    { label: "Birthday", value: "birthday" },
    { label: "Anniversary", value: "anniversary" },
    { label: "Meeting", value: "meeting" },
    { label: "Get Together", value: "gettogether" },
];

/* ─── Decoration tiers ─── */
const DECORATION_TIERS = [
    { label: "Normal", value: "normal", price: 1500, desc: "Balloons & basic setup" },
    { label: "Elegant", value: "elegant", price: 3000, desc: "Flowers, drapes & lighting" },
    { label: "Luxury", value: "luxury", price: 5000, desc: "Premium full decor" },
];

/* ─── Birthday extras ─── */
const BIRTHDAY_EXTRAS = [
    { key: "cake", label: "Cake" },
    { key: "specialMention", label: "Special Mentions" },
];

/* ─── Meeting extras ─── */
const MEETING_SEATING = [
    { key: "standingBrochures", label: "Standing Brochures" },
    { key: "placeHolders", label: "Place Holders" },
    { key: "pens", label: "Pens" },
];
const MEETING_AV = [
    { key: "mic", label: "Microphone" },
    { key: "projector", label: "Projector" },
];

/* ─── Anniversary extras ─── */
const ANNIVERSARY_EXTRAS = [
    { key: "candleLight", label: "Candle Light Dinner" },
    { key: "liveMusic", label: "Live Music" },
    { key: "surpriseGift", label: "Surprise Gift Revealing" },
    { key: "cake", label: "Cake" },
    { key: "specialMention", label: "Special Mentions" },
];

/* ─── Get Together extras ─── */
const GETTOGETHER_EXTRAS = [
    { key: "liveMusic", label: "Live Music" },
    { key: "mic", label: "Microphone" },
    { key: "projector", label: "Projector" },
    { key: "cake", label: "Cake" },
    { key: "specialMention", label: "Special Mentions" },
];

/* ─── Event Menu ─── */
const EVENT_MENUS = [
    { value: "veg", label: "Veg Menu" },
    { value: "nonveg", label: "Non-Veg Menu" },
    { value: "vegan", label: "Vegan Menu" },
    { value: "custom", label: "Custom Menu" },
];

/* ═══════════════════════════════
   Custom Date Picker (matches ReservationForm)
═══════════════════════════════ */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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
        <div className="clp-cdp-wrap" ref={ref} style={{ display: "inline-block", position: "relative" }}>
            <button type="button" className="clp-cdp-trigger" onClick={() => { setOpen(o => !o); setView("day"); if (value) { const p = new Date(value); setCalYear(p.getFullYear()); setCalMonth(p.getMonth()); } }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <span className="clp-cdp-val">{displayVal}</span>
                <span style={{ marginLeft: "auto", opacity: .4, fontSize: 12 }}>▾</span>
            </button>
            {open && (
                <div className="clp-cdp-popup" style={{ zIndex: 9999 }}>
                    <div className="clp-cdp-nav">
                        <button type="button" className="clp-cdp-nav-btn" onClick={() => { if (view === "day") { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); } else if (view === "year") setCalYear(y => y - 20); }}>‹</button>
                        <div className="clp-cdp-nav-center">
                            {view === "day" && <><button type="button" className="clp-cdp-nav-lbl" onClick={() => setView("month")}>{MONTHS[calMonth]}</button><button type="button" className="clp-cdp-nav-lbl" onClick={() => setView("year")}>{calYear}</button></>}
                            {view === "month" && <button type="button" className="clp-cdp-nav-lbl" onClick={() => setView("year")}>{calYear}</button>}
                            {view === "year" && <span className="clp-cdp-nav-lbl">{calYear - 5} – {calYear + 14}</span>}
                        </div>
                        <button type="button" className="clp-cdp-nav-btn" onClick={() => { if (view === "day") { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); } else if (view === "year") setCalYear(y => y + 20); }}>›</button>
                    </div>
                    {view === "day" && (<>
                        <div className="clp-cdp-weekdays">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <span key={d}>{d}</span>)}</div>
                        <div className="clp-cdp-grid">
                            {cells.map((d, i) => {
                                if (!d) return <span key={i} />;
                                const ds = `${calYear}-${pad(calMonth + 1)}-${pad(d)}`;
                                const sel = ds === value, dis = isDisabled(d), tod = ds === todayStr();
                                return <button type="button" key={i} className={`clp-cdp-day${sel ? " clp-cdp-sel" : ""}${dis ? " clp-cdp-dis" : ""}${tod && !sel ? " clp-cdp-today" : ""}`} disabled={dis} onClick={() => select(d)}>{d}</button>;
                            })}
                        </div>
                    </>)}
                    {view === "month" && (
                        <div className="clp-cdp-month-grid">
                            {MONTHS.map((m, i) => <button type="button" key={i} className={`clp-cdp-month-btn${i === calMonth ? " clp-cdp-sel" : ""}`} onClick={() => { setCalMonth(i); setView("day"); }}>{m.slice(0, 3)}</button>)}
                        </div>
                    )}
                    {view === "year" && (
                        <div className="clp-cdp-year-grid">
                            {yearRange.map(y => <button type="button" key={y} className={`clp-cdp-year-btn${y === calYear ? " clp-cdp-sel" : ""}`} onClick={() => { setCalYear(y); setView("month"); }}>{y}</button>)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/* ═══════════════════════════════
   Clock Time Picker (matches ReservationForm — slot-aware)
═══════════════════════════════ */
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

    const selRef = useRef(parseTime(value));
    const [sel, setSel] = useState(parseTime(value));
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
        selRef.current = ns; setSel({ ...ns }); emitChange(ns);
        setTimeout(() => setMode("minute"), 200);
    };

    const selectMinute = (m) => {
        if (isMinDisabled(m)) return;
        const ns = { ...selRef.current, m };
        selRef.current = ns; setSel({ ...ns }); emitChange(ns);
        setTimeout(() => { setOpen(false); setMode("hour"); }, 200);
    };

    const toggleAmpm = (ap) => {
        const ns = { ...selRef.current, ampm: ap };
        selRef.current = ns; setSel({ ...ns }); emitChange(ns);
    };

    const isDragging = useRef(false);
    const modeRef = useRef(mode);
    useEffect(() => { modeRef.current = mode; }, [mode]);

    const getAngleFromEvent = (e) => {
        if (!svgRef.current) return null;
        const rect = svgRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const angle = Math.atan2(clientY - rect.top - CENTER, clientX - rect.left - CENTER) * (180 / Math.PI) + 90;
        return ((angle % 360) + 360) % 360;
    };

    const applyAngle = (norm) => {
        if (modeRef.current === "hour") {
            const h = Math.round(norm / 30) % 12 || 12;
            if (!isHourDisabled(h, selRef.current.ampm)) {
                const ns = { ...selRef.current, h }; selRef.current = ns; setSel({ ...ns }); emitChange(ns);
            }
        } else {
            const snapped = Math.round(Math.round(norm / 6) % 60 / 5) * 5 % 60;
            if (!isMinDisabled(snapped)) {
                const ns = { ...selRef.current, m: snapped }; selRef.current = ns; setSel({ ...ns }); emitChange(ns);
            }
        }
    };

    const handleSvgMouseDown = (e) => { e.preventDefault(); isDragging.current = true; const n = getAngleFromEvent(e); if (n !== null) applyAngle(n); };
    const handleSvgTouchStart = (e) => { isDragging.current = true; const n = getAngleFromEvent(e); if (n !== null) applyAngle(n); };

    useEffect(() => {
        const onMM = (e) => { if (!isDragging.current) return; const n = getAngleFromEvent(e); if (n !== null) applyAngle(n); };
        const onMU = () => { if (!isDragging.current) return; isDragging.current = false; if (modeRef.current === "hour") setTimeout(() => setMode("minute"), 150); else setTimeout(() => { setOpen(false); setMode("hour"); }, 150); };
        const onTM = (e) => { if (!isDragging.current) return; e.preventDefault(); const n = getAngleFromEvent(e); if (n !== null) applyAngle(n); };
        const onTE = () => { if (!isDragging.current) return; isDragging.current = false; if (modeRef.current === "hour") setTimeout(() => setMode("minute"), 150); else setTimeout(() => { setOpen(false); setMode("hour"); }, 150); };
        window.addEventListener("mousemove", onMM);
        window.addEventListener("mouseup", onMU);
        window.addEventListener("touchmove", onTM, { passive: false });
        window.addEventListener("touchend", onTE);
        return () => { window.removeEventListener("mousemove", onMM); window.removeEventListener("mouseup", onMU); window.removeEventListener("touchmove", onTM); window.removeEventListener("touchend", onTE); };
    }, []);

    const displayVal = value ? (() => {
        const [hh, mm] = value.split(":").map(Number);
        return `${hh % 12 || 12}:${pad(mm)} ${hh >= 12 ? "PM" : "AM"}`;
    })() : "Select time";

    const handAngle = mode === "hour" ? hourAngle(sel.h) : minAngle(sel.m);
    const handTip = polarToXY(handAngle, mode === "hour" ? HOUR_R - 14 : MIN_R - 14);

    return (
        <div className="clp-ctp-wrap" ref={ref}>
            <button type="button" className={`clp-cdp-trigger${disabled ? " clp-ctp-disabled" : ""}`} onClick={() => !disabled && setOpen(o => !o)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <span className={`clp-cdp-val${!value ? " clp-ctp-placeholder" : ""}`}>{displayVal}</span>
                <span style={{ marginLeft: "auto", opacity: .4, fontSize: 12 }}>▾</span>
            </button>
            {open && !disabled && (
                <div className="clp-ctp-popup">
                    <div className="clp-ctp-header">
                        <div className="clp-ctp-ampm-col">
                            <button type="button" className={`clp-ctp-ampm-btn${sel.ampm === "AM" ? " active" : ""}`} onClick={() => toggleAmpm("AM")}>AM</button>
                            <button type="button" className={`clp-ctp-ampm-btn${sel.ampm === "PM" ? " active" : ""}`} onClick={() => toggleAmpm("PM")}>PM</button>
                        </div>
                        <div className="clp-ctp-time-display">
                            <span className={`clp-ctp-hm-btn${mode === "hour" ? " active" : ""}`} onClick={() => setMode("hour")}>{pad(sel.h)}</span>
                            <span className="clp-ctp-colon">:</span>
                            <span className={`clp-ctp-hm-btn${mode === "minute" ? " active" : ""}`} onClick={() => setMode("minute")}>{pad(sel.m)}</span>
                        </div>
                    </div>
                    <svg ref={svgRef} width={CENTER * 2} height={CENTER * 2} className="clp-ctp-clock-svg"
                        onMouseDown={handleSvgMouseDown} onTouchStart={handleSvgTouchStart}
                        style={{ touchAction: "none" }}>
                        <circle cx={CENTER} cy={CENTER} r={CLOCK_R} fill="#f8f9fa" stroke="#e5e7eb" strokeWidth="1.5" />
                        <line x1={CENTER} y1={CENTER} x2={handTip.x} y2={handTip.y} stroke="var(--color-red)" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx={CENTER} cy={CENTER} r="4" fill="var(--color-red)" />
                        <circle cx={handTip.x} cy={handTip.y} r="16" fill="var(--color-red)" opacity="0.18" />
                        <circle cx={handTip.x} cy={handTip.y} r="4" fill="var(--color-red)" />
                        {mode === "hour" && hours12.map((h) => {
                            const ang = hourAngle(h); const pos = polarToXY(ang, HOUR_R);
                            const isSel = sel.h === h; const isDis = isHourDisabled(h, sel.ampm);
                            return (<g key={h} onClick={() => selectHour(h)} style={{ cursor: isDis ? "not-allowed" : "pointer" }}><circle cx={pos.x} cy={pos.y} r="16" fill={isSel ? "var(--color-red)" : "transparent"} /><text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight={isSel ? "700" : "400"} fill={isDis ? "#ccc" : isSel ? "#fff" : "#333"}>{h}</text></g>);
                        })}
                        {mode === "minute" && minutes.map((m) => {
                            const ang = minAngle(m); const pos = polarToXY(ang, MIN_R);
                            const isSel = sel.m === m; const isDis = isMinDisabled(m);
                            return (<g key={m} onClick={() => selectMinute(m)} style={{ cursor: isDis ? "not-allowed" : "pointer" }}><circle cx={pos.x} cy={pos.y} r="16" fill={isSel ? "var(--color-red)" : "transparent"} /><text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight={isSel ? "700" : "400"} fill={isDis ? "#ccc" : isSel ? "#fff" : "#333"}>{pad(m)}</text></g>);
                        })}
                    </svg>
                    <div className="clp-ctp-footer">
                        <button type="button" className="clp-ctp-cancel-btn" onClick={() => { setOpen(false); setMode("hour"); }}>Cancel</button>
                        <button type="button" className="clp-ctp-ok-btn" onClick={() => { emitChange(selRef.current); setOpen(false); setMode("hour"); }}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Checkbox Card ─── */
const CheckCard = ({ label, checked, onChange }) => (
    <label className={`clp-check-card${checked ? " active" : ""}`}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ display: "none" }} />
        <span className="clp-check-label">{label}</span>
        {checked && <span className="clp-check-tick">✓</span>}
    </label>
);

/* ─── Decoration Picker ─── */
const DecorationPicker = ({ value, onChange }) => (
    <div className="clp-deco-grid">
        <button type="button" className={`clp-deco-none-btn${!value ? " active" : ""}`} onClick={() => onChange(null)}>
            No Decoration
        </button>
        {DECORATION_TIERS.map(t => (
            <button key={t.value} type="button" className={`clp-deco-card${value === t.value ? " active" : ""}`} onClick={() => onChange(t.value)}>
                <div className="clp-deco-label">{t.label}</div>
                <div className="clp-deco-price">₹{t.price.toLocaleString()}</div>
                <div className="clp-deco-desc">{t.desc}</div>
                {value === t.value && <span className="clp-check-tick">✓</span>}
            </button>
        ))}
    </div>
);

/* ═══════════════════════════════
   Main Component
═══════════════════════════════ */
const CelebrationForm = ({ handleBack, handleHome }) => {
    const [form, setForm] = useState({
        type: "birthday",
        name: "", mobile: "", email: "",
        date: "", time: "", slotGroup: "",
        guests: 2,
        birthdayPersonName: "", birthdayPersonAge: "",
        cake: false,
        specialMention: false, specialMentionText: "",
        standingBrochures: false, placeHolders: false, pens: false,
        mic: false, projector: false,
        candleLight: false, liveMusic: false, surpriseGift: false,
        decoration: null,
        eventMenu: "",
        audioVideo: false,
        specialNote: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [bookingId, setBookingId] = useState("");

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userId = localStorage.getItem("userId");
                if (!userId) return;
                const res = await api.get(`/users/${userId}`);
                setForm(prev => ({ ...prev, name: res.data?.name || "", mobile: res.data?.mobile || "", email: res.data?.email || "" }));
            } catch (err) { console.error(err); }
        };
        loadUser();
    }, []);

    const set = (key, val) => {
        setForm(prev => ({ ...prev, [key]: val }));
        setErrors(prev => ({ ...prev, [key]: "" }));
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
        const err = {};
        if (!form.name.trim()) err.name = "Name required";
        if (!form.mobile || form.mobile.replace(/\D/g, "").length !== 10) err.mobile = "Valid 10-digit mobile required";
        if (!form.date) err.date = "Date required";
        if (form.date && form.date < tomorrowStr()) err.date = "Please select a future date (today not allowed)";
        if (!form.slotGroup) err.slotGroup = "Please select a dining slot";
        if (!form.time) err.time = "Time required";
        if (!form.guests || Number(form.guests) < 1) err.guests = "At least 1 guest required";
        if (form.type === "birthday" && !form.birthdayPersonName.trim()) err.birthdayPersonName = "Birthday person name required";
        return err;
    };

    const handleSubmit = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
        try {
            setLoading(true);
            const id = `cele_${Date.now()}`;
            await api.post("/celebrations", {
                id, ...form,
                status: "pending",
                source: "User App",
                createdAt: new Date().toISOString(),
            });
            setBookingId(id.slice(-6).toUpperCase());
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            alert("Failed to submit. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    /* ─── Special Mention expansion helper ─── */
    const renderExtrasWithMention = (extras) => extras.map(ex => (
        <div key={ex.key} className="clp-extra-item-wrap">
            <CheckCard label={ex.label} checked={form[ex.key]} onChange={v => set(ex.key, v)} />
            {ex.key === "specialMention" && form.specialMention && (
                <div className="clp-mention-box">
                    <textarea
                        className="clp-mention-textarea"
                        placeholder="Describe what you'd like announced or mentioned during the event..."
                        value={form.specialMentionText}
                        onChange={e => set("specialMentionText", e.target.value)}
                        rows={3}
                    />
                </div>
            )}
        </div>
    ));

    /* ─── Success Screen ─── */
    if (submitted) {
        const typeObj = CELEBRATION_TYPES.find(t => t.value === form.type);
        return (
            <div className="clp-page">
                <div className="food-header">
                    <button className="back-button" onClick={handleBack} />
                    <div className="food-list-title">Celebration</div>
                    <div className="home-btn" onClick={handleHome}><img src={homeIcon} alt="" /></div>
                </div>
                <div className="clp-success-screen">
                    <div className="clp-success-icon">
                        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                            <circle cx="36" cy="36" r="36" fill="#d1fae5" />
                            <path d="M22 36 L32 46 L50 28" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h2 className="clp-success-title">Celebration Booked!</h2>
                    <p className="clp-success-sub">We look forward to making it special for you.</p>
                    <div className="clp-booking-id">
                        <span className="clp-booking-label">Booking ID</span>
                        <span className="clp-booking-code">#{bookingId}</span>
                    </div>
                    <div className="clp-success-card">
                        {[
                            ["Guest", form.name],
                            ["Type", typeObj?.label],
                            ["Date", form.date],
                            ["Time", form.time ? (() => { const [h, m] = form.time.split(":").map(Number); return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`; })() : ""],
                            ["Guests", form.guests],
                            ["Decoration", form.decoration ? DECORATION_TIERS.find(t => t.value === form.decoration)?.label : "None"],
                        ].map(([k, v]) => (
                            <div key={k} className="clp-sc-row">
                                <span className="clp-sc-label">{k}</span>
                                <span className="clp-sc-val">{v}</span>
                            </div>
                        ))}
                    </div>
                    <button className="clp-submit" onClick={() => {
                        setSubmitted(false);
                        setForm({ type: "birthday", name: "", mobile: "", email: "", date: "", time: "", slotGroup: "", guests: 2, birthdayPersonName: "", birthdayPersonAge: "", cake: false, specialMention: false, specialMentionText: "", standingBrochures: false, placeHolders: false, pens: false, mic: false, projector: false, candleLight: false, liveMusic: false, surpriseGift: false, decoration: null, eventMenu: "", audioVideo: false, specialNote: "" });
                    }}>
                        Book Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="clp-page">
            <div className="food-header">
                <button className="back-button" onClick={handleBack} />
                <div className="food-list-title">Celebration</div>
                <div className="home-btn" onClick={handleHome}><img src={homeIcon} alt="" /></div>
            </div>

            <div className="clp-container">
                {/* ── LEFT COLUMN ── */}
                <div className="clp-section">

                    {/* Event Type */}
                    <div className="clp-block">
                        <div className="clp-title">Event Type</div>
                        <div className="clp-type-grid">
                            {CELEBRATION_TYPES.map(t => (
                                <button key={t.value} type="button"
                                    className={`clp-type-card${form.type === t.value ? " active" : ""}`}
                                    onClick={() => set("type", t.value)}>
                                    <span className="clp-type-label">{t.label}</span>
                                    {form.type === t.value && <span className="clp-check-tick">✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Guest Details */}
                    <div className="clp-block">
                        <div className="clp-title">Your Details</div>
                        <div className="clp-card">
                            <div className="clp-group floating-field">
                                <input placeholder=" " value={form.name} onChange={e => set("name", e.target.value)} />
                                <label>Full Name *</label>
                                {errors.name && <span className="clp-error">{errors.name}</span>}
                            </div>
                            <div className="clp-row">
                                <div className="clp-group floating-field" style={{ flex: 1.4 }}>
                                    <input placeholder=" " value={form.mobile} onChange={e => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} type="tel" />
                                    <label>Mobile *</label>
                                    {errors.mobile && <span className="clp-error">{errors.mobile}</span>}
                                </div>
                                <div className="clp-group floating-field" style={{ flex: 1 }}>
                                    <input placeholder=" " value={form.email} onChange={e => set("email", e.target.value)} type="email" />
                                    <label>Email (optional)</label>
                                </div>
                            </div>
                            <div className="clp-row">
                                <div className="clp-group" style={{ flex: "0 0 auto" }}>
                                    <label className="clp-field-label">Date *</label>
                                    <CustomDatePicker value={form.date} min={tomorrowStr()} onChange={handleDateChange} />
                                    {errors.date && <span className="clp-error">{errors.date}</span>}
                                </div>
                                <div className="clp-group">
                                    <label className="clp-field-label">Dining Slot *</label>
                                    <div className="clp-slot-groups">
                                        {SLOT_GROUPS.map(sg => {
                                            const nowH = new Date().getHours();
                                            const slotEndH = parseInt(sg.end.split(":")[0]);
                                            const isPastSlot = isToday && nowH >= slotEndH;
                                            return (
                                                <div key={sg.key}
                                                    className={`clp-slot-group${form.slotGroup === sg.key ? " active" : ""}${isPastSlot ? " clp-slot-disabled" : ""}`}
                                                    onClick={() => !isPastSlot && handleSlotChange(sg.key)}>
                                                    <span className="clp-sg-label">{sg.label}</span>
                                                    <span className="clp-sg-time">{sg.start} – {sg.end}</span>
                                                    {isPastSlot && <span className="clp-slot-past-badge">Passed</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {errors.slotGroup && <span className="clp-error">{errors.slotGroup}</span>}
                                </div>
                                <div className="clp-group" style={{ flex: "0 0 auto" }}>
                                    <label className="clp-field-label">Preferred Time *</label>
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
                                    {errors.time && <span className="clp-error">{errors.time}</span>}
                                </div>
                            </div>
                            <div className="clp-group">
                                <label className="clp-field-label">Number of Guests *</label>
                                <div className="clp-stepper">
                                    <button type="button" className="clp-stepper-btn" onClick={() => set("guests", Math.max(1, form.guests - 1))}>−</button>
                                    <span className="clp-stepper-val">{form.guests}</span>
                                    <button type="button" className="clp-stepper-btn" onClick={() => set("guests", Math.min(500, form.guests + 1))}>+</button>
                                </div>
                                {errors.guests && <span className="clp-error">{errors.guests}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="clp-section">

                    {form.type === "birthday" && (
                        <div className="clp-block">
                            <div className="clp-title">Birthday Details</div>
                            <div className="clp-card">
                                <div className="clp-row">
                                    <div className="clp-group floating-field" style={{ flex: 1.5 }}>
                                        <input placeholder=" " value={form.birthdayPersonName} onChange={e => set("birthdayPersonName", e.target.value)} />
                                        <label>Birthday Person's Name *</label>
                                        {errors.birthdayPersonName && <span className="clp-error">{errors.birthdayPersonName}</span>}
                                    </div>
                                    <div className="clp-group floating-field" style={{ flex: 1 }}>
                                        <input placeholder=" " type="number" min="1" max="120" value={form.birthdayPersonAge} onChange={e => set("birthdayPersonAge", e.target.value)} />
                                        <label>Age (optional)</label>
                                    </div>
                                </div>
                                <div className="clp-title" style={{ marginBottom: 8 }}>Add-ons</div>
                                <div className="clp-check-grid">
                                    {renderExtrasWithMention(BIRTHDAY_EXTRAS)}
                                </div>
                            </div>
                        </div>
                    )}

                    {form.type === "meeting" && (
                        <div className="clp-block">
                            <div className="clp-title">Meeting Setup</div>
                            <div className="clp-card">
                                <div className="clp-sub-title">Table Decoration</div>
                                <div className="clp-check-grid">
                                    {MEETING_SEATING.map(ex => (
                                        <CheckCard key={ex.key} label={ex.label} checked={form[ex.key]} onChange={v => set(ex.key, v)} />
                                    ))}
                                </div>
                                <div className="clp-sub-title" style={{ marginTop: 10 }}>Audio / Video</div>
                                <div className="clp-check-grid">
                                    {MEETING_AV.map(ex => (
                                        <CheckCard key={ex.key} label={ex.label} checked={form[ex.key]} onChange={v => set(ex.key, v)} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {form.type === "anniversary" && (
                        <div className="clp-block">
                            <div className="clp-title">Anniversary Extras</div>
                            <div className="clp-card">
                                <div className="clp-check-grid">
                                    {renderExtrasWithMention(ANNIVERSARY_EXTRAS)}
                                </div>
                            </div>
                        </div>
                    )}

                    {form.type === "gettogether" && (
                        <div className="clp-block">
                            <div className="clp-title">Get Together Setup</div>
                            <div className="clp-card">
                                <div className="clp-check-grid">
                                    {renderExtrasWithMention(GETTOGETHER_EXTRAS)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Decoration */}
                    <div className="clp-block">
                        <div className="clp-title">Decoration</div>
                        <DecorationPicker value={form.decoration} onChange={v => set("decoration", v)} />
                    </div>

                    {/* Audio & Video (skip if meeting — already there) */}
                    {form.type !== "meeting" && (
                        <div className="clp-block">
                            <div className="clp-title">Audio & Video</div>
                            <div className="clp-card">
                                <div className="clp-check-grid">
                                    <CheckCard label="Microphone" checked={form.mic} onChange={v => set("mic", v)} />
                                    <CheckCard label="Projector" checked={form.projector} onChange={v => set("projector", v)} />
                                </div>
                                <div className="clp-av-price">Audio & Video Setup — ₹1,500</div>
                            </div>
                        </div>
                    )}

                    {/* Event Menu */}
                    <div className="clp-block">
                        <div className="clp-title">Event Menu</div>
                        <div className="clp-menu-grid">
                            {EVENT_MENUS.map(m => (
                                <button key={m.value} type="button"
                                    className={`clp-menu-card${form.eventMenu === m.value ? " active" : ""}`}
                                    onClick={() => set("eventMenu", form.eventMenu === m.value ? "" : m.value)}>
                                    <span className="clp-menu-label">{m.label}</span>
                                    {form.eventMenu === m.value && <span className="clp-check-tick">✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Special Note */}
                    <div className="clp-block">
                        <div className="clp-title">Special Notes</div>
                        <div className="clp-card">
                            <div className="floating-field">
                                <label htmlFor="clp-note">Any special requests?</label>
                                <textarea id="clp-note" value={form.specialNote} onChange={e => set("specialNote", e.target.value)} className="clp-textarea" />
                            </div>
                        </div>
                    </div>

                    <div className="clp-submit-container">
                        <button className={`clp-submit${loading ? " loading" : ""}`} onClick={handleSubmit} disabled={loading}>
                            {loading ? "Processing..." : "Book Celebration"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CelebrationForm;