// user panel
import { useState, useEffect, useRef } from "react";
import api from "../api";
import homeIcon from "../assets/icons/home.png";
import "./PreBooking.css";

const pad = (n) => String(n).padStart(2, "0");
const todayStr = () => new Date().toISOString().split("T")[0];
const tomorrowStr = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; };

const SLOT_GROUPS = [
    { label: "Breakfast", key: "BF", start: "07:00", end: "10:00" },
    { label: "Brunch", key: "BR", start: "10:00", end: "12:00" },
    { label: "Lunch", key: "LU", start: "12:00", end: "15:00" },
    { label: "Hi-Tea", key: "HT", start: "15:00", end: "18:00" },
    { label: "Dinner", key: "DI", start: "18:30", end: "22:00" },
];

/* ══════════════════════════════════
   Custom Date Picker
══════════════════════════════════ */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const CustomDatePicker = ({ value, onChange, min, hasError }) => {
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

    const minD = min ? new Date(min + "T00:00:00") : null;
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const select = (d) => { onChange(`${calYear}-${pad(calMonth + 1)}-${pad(d)}`); setOpen(false); };
    const isDisabled = (d) => { if (!minD) return false; return new Date(`${calYear}-${pad(calMonth + 1)}-${pad(d)}T00:00:00`) < minD; };
    const displayVal = value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Select date";
    const yearRange = Array.from({ length: 20 }, (_, i) => calYear - 5 + i);

    return (
        <div className="pbp-cdp-wrap" ref={ref}>
            <button type="button"
                className={`pbp-cdp-trigger${hasError ? " error" : ""}`}
                onClick={() => { setOpen(o => !o); setView("day"); if (value) { const p = new Date(value); setCalYear(p.getFullYear()); setCalMonth(p.getMonth()); } }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className={`pbp-cdp-val${!value ? " ph" : ""}`}>{displayVal}</span>
                <span style={{ marginLeft: "auto", opacity: .4, fontSize: 12 }}>▾</span>
            </button>
            {open && (
                <div className="pbp-cdp-popup">
                    <div className="pbp-cdp-nav">
                        <button type="button" className="pbp-cdp-nav-btn" onClick={() => { if (view === "day") { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); } else if (view === "year") setCalYear(y => y - 20); }}>‹</button>
                        <div className="pbp-cdp-nav-center">
                            {view === "day" && (<><button type="button" className="pbp-cdp-nav-lbl" onClick={() => setView("month")}>{MONTHS[calMonth]}</button><button type="button" className="pbp-cdp-nav-lbl" onClick={() => setView("year")}>{calYear}</button></>)}
                            {view === "month" && <button type="button" className="pbp-cdp-nav-lbl" onClick={() => setView("year")}>{calYear}</button>}
                            {view === "year" && <span className="pbp-cdp-nav-lbl">{calYear - 5} – {calYear + 14}</span>}
                        </div>
                        <button type="button" className="pbp-cdp-nav-btn" onClick={() => { if (view === "day") { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); } else if (view === "year") setCalYear(y => y + 20); }}>›</button>
                    </div>
                    {view === "day" && (<>
                        <div className="pbp-cdp-weekdays">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <span key={d}>{d}</span>)}</div>
                        <div className="pbp-cdp-grid">
                            {cells.map((d, i) => { if (!d) return <span key={i} />; const ds = `${calYear}-${pad(calMonth + 1)}-${pad(d)}`, sel = ds === value, dis = isDisabled(d), tod = ds === todayStr(); return <button type="button" key={i} className={`pbp-cdp-day${sel ? " sel" : ""}${dis ? " dis" : ""}${tod && !sel ? " today" : ""}`} disabled={dis} onClick={() => select(d)}>{d}</button>; })}
                        </div>
                    </>)}
                    {view === "month" && <div className="pbp-cdp-month-grid">{MONTHS.map((m, i) => <button type="button" key={i} className={`pbp-cdp-month-btn${i === calMonth ? " sel" : ""}`} onClick={() => { setCalMonth(i); setView("day"); }}>{m.slice(0, 3)}</button>)}</div>}
                    {view === "year" && <div className="pbp-cdp-year-grid">{yearRange.map(y => <button type="button" key={y} className={`pbp-cdp-year-btn${y === calYear ? " sel" : ""}`} onClick={() => { setCalYear(y); setView("month"); }}>{y}</button>)}</div>}
                </div>
            )}
        </div>
    );
};

/* ══════════════════════════════════
   Clock Time Picker — with sweep
══════════════════════════════════ */
const ClockTimePicker = ({ value, onChange, slotStart, slotEnd, isToday, hasError, disabled }) => {
    const [open, setOpen] = useState(false);
    const modeRef = useRef("hour");
    const [modeSt, setModeSt] = useState("hour");
    const ref = useRef(null);
    const svgRef = useRef(null);
    const dragging = useRef(false);

    const parseTime = (v) => { if (!v) return { h: 12, m: 0, ampm: "PM" }; const [hh, mm] = v.split(":").map(Number); return { h: hh % 12 || 12, m: mm, ampm: hh >= 12 ? "PM" : "AM" }; };
    const selRef = useRef(parseTime(value));
    const [sel, setSel] = useState(parseTime(value));
    const lastEmitted = useRef(value);

    useEffect(() => { if (value && value !== lastEmitted.current) { const p = parseTime(value); selRef.current = p; setSel(p); } }, [value]);

    const to24 = (h, m, ampm) => { let hh = ampm === "PM" ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h); return `${pad(hh)}:${pad(m)}`; };
    const emit = (ns) => { const v = to24(ns.h, ns.m, ns.ampm); lastEmitted.current = v; onChange(v); };

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); modeRef.current = "hour"; setModeSt("hour"); } };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const slotH24Start = slotStart ? parseInt(slotStart.split(":")[0]) : null;
    const slotH24End = slotEnd ? parseInt(slotEnd.split(":")[0]) : null;
    const nowH = new Date().getHours(), nowM = new Date().getMinutes();

    const isHourDis = (h, ampm) => { const h24 = ampm === "PM" ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h); if (slotH24Start !== null && slotH24End !== null && (h24 < slotH24Start || h24 >= slotH24End)) return true; if (isToday && h24 < nowH) return true; return false; };
    const isMinDis = (m) => { const cur = selRef.current; const h24 = cur.ampm === "PM" ? (cur.h === 12 ? 12 : cur.h + 12) : (cur.h === 12 ? 0 : cur.h); if (isToday && h24 === nowH && m <= nowM) return true; return false; };

    const CLOCK_R = 100, CENTER = 110, HOUR_R = 78, MIN_R = 78;
    const hours12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    const hourAngle = (h) => ((h % 12) / 12) * 360 - 90;
    const minAngle = (m) => (m / 60) * 360 - 90;
    const toXY = (angle, r) => ({ x: CENTER + r * Math.cos(angle * Math.PI / 180), y: CENTER + r * Math.sin(angle * Math.PI / 180) });

    const valueFromEvent = (e) => { const svg = svgRef.current; if (!svg) return null; const rect = svg.getBoundingClientRect(); const src = e.touches?.[0] ?? e.changedTouches?.[0] ?? e; const x = src.clientX - rect.left - CENTER, y = src.clientY - rect.top - CENTER; const norm = ((Math.atan2(y, x) * 180 / Math.PI + 90) % 360 + 360) % 360; if (modeRef.current === "hour") { const h = Math.round(norm / 30) % 12 || 12; return isHourDis(h, selRef.current.ampm) ? null : { kind: "hour", h }; } else { const snapped = Math.round(Math.round(norm / 6) / 5) * 5 % 60; return isMinDis(snapped) ? null : { kind: "min", m: snapped }; } };
    const applyVal = (v) => { if (!v) return; const ns = v.kind === "hour" ? { ...selRef.current, h: v.h } : { ...selRef.current, m: v.m }; selRef.current = ns; setSel({ ...ns }); emit(ns); };
    const onPointerDown = (e) => { e.preventDefault(); dragging.current = true; svgRef.current?.setPointerCapture?.(e.pointerId); applyVal(valueFromEvent(e)); };
    const onPointerMove = (e) => { if (!dragging.current) return; applyVal(valueFromEvent(e)); };
    const onPointerUp = (e) => { if (!dragging.current) return; dragging.current = false; applyVal(valueFromEvent(e)); if (modeRef.current === "hour") { modeRef.current = "minute"; setModeSt("minute"); } else { setOpen(false); modeRef.current = "hour"; setModeSt("hour"); } };
    const tapHour = (h) => { if (isHourDis(h, selRef.current.ampm)) return; const ns = { ...selRef.current, h }; selRef.current = ns; setSel({ ...ns }); emit(ns); modeRef.current = "minute"; setModeSt("minute"); };
    const tapMinute = (m) => { if (isMinDis(m)) return; const ns = { ...selRef.current, m }; selRef.current = ns; setSel({ ...ns }); emit(ns); setOpen(false); modeRef.current = "hour"; setModeSt("hour"); };
    const tapAmpm = (ap) => { const ns = { ...selRef.current, ampm: ap }; selRef.current = ns; setSel({ ...ns }); emit(ns); };

    const mode = modeSt;
    const displayVal = value ? (() => { const [hh, mm] = value.split(":").map(Number); return `${hh % 12 || 12}:${pad(mm)} ${hh >= 12 ? "PM" : "AM"}`; })() : (disabled ? "Select a dining slot first" : slotStart && slotEnd ? `${slotStart}–${slotEnd}` : "Select time");
    const handAngle = mode === "hour" ? hourAngle(sel.h) : minAngle(sel.m);
    const handTip = toXY(handAngle, (mode === "hour" ? HOUR_R : MIN_R) - 14);

    return (
        <div className="pbp-ctp-wrap" ref={ref}>
            <button type="button" className={`pbp-ctp-trigger${hasError ? " error" : ""}${disabled ? " pbp-ctp-disabled" : ""}`} onClick={() => { if (!disabled) setOpen(o => !o); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <span className={`pbp-ctp-val${!value ? " ph" : ""}`}>{displayVal}</span>
                <span style={{ marginLeft: "auto", opacity: .4, fontSize: 11 }}>▾</span>
            </button>
            {
                open && (
                    <div className="pbp-ctp-popup" style={{ position: "relative" }}>
                        <div className="pbp-ctp-header">
                            <div className="pbp-ctp-ampm-col">
                                <button type="button" className={`pbp-ctp-ampm-btn${sel.ampm === "AM" ? " active" : ""}`} onClick={() => tapAmpm("AM")}>AM</button>
                                <button type="button" className={`pbp-ctp-ampm-btn${sel.ampm === "PM" ? " active" : ""}`} onClick={() => tapAmpm("PM")}>PM</button>
                            </div>
                            <div className="pbp-ctp-time-display">
                                <span className={`pbp-ctp-hm${mode === "hour" ? " active" : ""}`} onClick={() => { modeRef.current = "hour"; setModeSt("hour"); }}>{pad(sel.h)}</span>
                                <span className="pbp-ctp-colon">:</span>
                                <span className={`pbp-ctp-hm${mode === "minute" ? " active" : ""}`} onClick={() => { modeRef.current = "minute"; setModeSt("minute"); }}>{pad(sel.m)}</span>
                            </div>
                        </div>
                        <svg ref={svgRef} width={CENTER * 2} height={CENTER * 2} className="pbp-ctp-clock"
                            style={{ touchAction: "none", display: "block" }}
                            onPointerDown={onPointerDown} onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
                            <circle cx={CENTER} cy={CENTER} r={CLOCK_R} fill="#f8f9fa" stroke="#e5e7eb" strokeWidth="1.5" />
                            <line x1={CENTER} y1={CENTER} x2={handTip.x} y2={handTip.y} stroke="var(--color-red,#e74c3c)" strokeWidth="2.5" strokeLinecap="round" />
                            <circle cx={CENTER} cy={CENTER} r="4" fill="var(--color-red,#e74c3c)" />
                            <circle cx={handTip.x} cy={handTip.y} r="16" fill="var(--color-red,#e74c3c)" opacity="0.18" />
                            <circle cx={handTip.x} cy={handTip.y} r="4" fill="var(--color-red,#e74c3c)" />
                            {mode === "hour" && hours12.map(h => { const ang = hourAngle(h), pos = toXY(ang, HOUR_R), isSel = sel.h === h, isDis = isHourDis(h, sel.ampm); return (<g key={h} style={{ cursor: isDis ? "not-allowed" : "pointer" }} onPointerDown={e => { e.stopPropagation(); if (!isDis) tapHour(h); }}><circle cx={pos.x} cy={pos.y} r="16" fill={isSel ? "var(--color-red,#e74c3c)" : isDis ? "#f3f4f6" : "transparent"} /><text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight={isSel ? "700" : "400"} fill={isSel ? "#fff" : isDis ? "#d1d5db" : "#333"}>{h}</text></g>); })}
                            {mode === "minute" && minutes.map(m => { const ang = minAngle(m), pos = toXY(ang, MIN_R), isSel = sel.m === m, isDis = isMinDis(m); return (<g key={m} style={{ cursor: isDis ? "not-allowed" : "pointer" }} onPointerDown={e => { e.stopPropagation(); if (!isDis) tapMinute(m); }}><circle cx={pos.x} cy={pos.y} r="16" fill={isSel ? "var(--color-red,#e74c3c)" : isDis ? "#f3f4f6" : "transparent"} /><text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight={isSel ? "700" : "400"} fill={isSel ? "#fff" : isDis ? "#d1d5db" : "#333"}>{pad(m)}</text></g>); })}
                        </svg>
                        <div className="pbp-ctp-footer">
                            <button type="button" className="pbp-ctp-cancel" onClick={() => { setOpen(false); modeRef.current = "hour"; setModeSt("hour"); }}>Cancel</button>
                            <button type="button" className="pbp-ctp-ok" onClick={() => { emit(selRef.current); setOpen(false); modeRef.current = "hour"; setModeSt("hour"); }}>OK</button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

/* ══════════════════════════════════
   Main Component
══════════════════════════════════ */
const PreBooking = ({ bag, setBag, handleBack, handleHome }) => {
    const [form, setForm] = useState({
        name: "", mobile: "", email: "", guests: 1,
        date: tomorrowStr(), time: "", slotGroup: "", notes: ""
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [bookingId, setBookingId] = useState("");

    /* Pre-fill from logged-in user */
    useEffect(() => {
        const loadUser = async () => {
            try {
                const id = localStorage.getItem("userId");
                if (!id) return;
                const r = await api.get(`/users/${id}`);
                setForm(p => ({ ...p, name: r.data?.name || "", mobile: r.data?.mobile || "", email: r.data?.email || "" }));
            } catch (e) { console.error(e); }
        };
        loadUser();
    }, []);

    const safeBag = bag || [];
    const guestCount = parseInt(form.guests, 10) || 0;
    const isGroupDiscount = guestCount > 8;
    const subtotal = safeBag.reduce((s, i) => s + Number(i.totalPrice || 0), 0);
    const discount = isGroupDiscount ? Math.round(subtotal * 0.1) : 0;
    const totalAmount = subtotal - discount;

    const setF = (key, val) => {
        setForm(p => ({ ...p, [key]: val }));
        setErrors(p => ({ ...p, [key]: "" }));
    };

    const validate = () => {
        const err = {};
        if (!form.name.trim() || form.name.trim().length < 2) err.name = true;
        const mob = form.mobile.replace(/\D/g, "");
        if (!mob || mob.length !== 10) err.mobile = true;
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = true;
        if (!form.guests || guestCount < 1) err.guests = true;
        if (!form.date) err.date = true;
        if (!form.slotGroup) err.slotGroup = true;
        if (!form.time) err.time = true;
        if (!safeBag.length) err.bag = true;
        return err;
    };

    const handleSubmit = async () => {
        const ve = validate();
        if (Object.keys(ve).length > 0) {
            setErrors(ve);
            return;
        }
        try {
            setLoading(true);
            const newId = `pre_${Date.now()}`;
            await api.post("/preBookings", {
                id: newId,
                name: form.name,
                mobile: form.mobile,
                email: form.email || "",
                guests: guestCount,
                date: form.date,
                time: form.time,
                slotGroup: form.slotGroup || "",
                notes: form.notes || "",
                items: safeBag,
                subtotal,
                discount,
                totalAmount,
                status: "scheduled",
                createdAt: new Date().toISOString(),
            });
            setBookingId(newId.slice(-6).toUpperCase());
            setSubmitted(true);
            setBag([]);
        } catch (e) {
            console.error(e);
            setErrors(prev => ({ ...prev, _submit: true }));
        } finally {
            setLoading(false);
        }
    };

    const activeSlot = SLOT_GROUPS.find(s => s.key === form.slotGroup);
    const fmtTime = (t) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`; };

    /* ── Success Screen ── */
    if (submitted) {
        const slot = SLOT_GROUPS.find(s => s.key === form.slotGroup);
        return (
            <div className="pbp-page">
                <div className="food-header">
                    <button className="back-button" onClick={handleBack} />
                    <div className="food-list-title">Pre Booking</div>
                    <div className="home-btn" onClick={handleHome}><img src={homeIcon} alt="" /></div>
                </div>
                <div className="pbp-success-screen">
                    <div className="pbp-success-icon">
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="32" r="32" fill="#d1fae5" />
                            <path d="M20 32 L28 40 L44 24" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h2 className="pbp-success-title">Pre-Booking Confirmed!</h2>
                    <p className="pbp-success-sub">Your food order is reserved. See you soon!</p>
                    <div className="pbp-booking-id">
                        <span className="pbp-booking-label">Booking ID</span>
                        <span className="pbp-booking-code">#{bookingId}</span>
                    </div>
                    <div className="pbp-success-card">
                        {[
                            ["Guest", form.name],
                            ["Date", form.date],
                            ["Time", fmtTime(form.time)],
                            ["Slot", slot?.label || "—"],
                            ["Guests", form.guests],
                            ["Total", `₹${totalAmount}`],
                        ].map(([k, v]) => (
                            <div key={k} className="pbp-sc-row">
                                <span className="pbp-sc-label">{k}</span>
                                <span className="pbp-sc-val">{v}</span>
                            </div>
                        ))}
                    </div>
                    <button className="pbp-submit-btn" style={{ marginTop: 8, maxWidth: 280 }}
                        onClick={() => { setSubmitted(false); setForm({ name: form.name, mobile: form.mobile, email: form.email, guests: 1, date: tomorrowStr(), time: "", slotGroup: "", notes: "" }); }}>
                        Make Another Booking
                    </button>
                    <button className="pbp-cancel-btn" style={{ marginTop: 8, maxWidth: 280 }} onClick={handleHome}>Back to Home</button>
                </div>
            </div>
        );
    }

    /* ── Main Form ── */
    return (
        <div className="pbp-page">

            <div className="food-header">
                <button className="back-button" onClick={handleBack} />
                <div className="food-list-title">Pre Booking</div>
                <div className="home-btn" onClick={handleHome}><img src={homeIcon} alt="" /></div>
            </div>

            <div className="pbp-form-shell">
                <div className="pbp-form-grid">

                    {/* ════ LEFT COLUMN ════ */}
                    <div className="pbp-col">

                        {/* GUEST DETAILS */}
                        <div className="pbp-section-label">Guest Details</div>
                        <div className="pbp-card">
                            <div className="pbp-form-row">
                                <div className="pbp-form-group" style={{ flex: 1.4 }}>
                                    <label>Name <span className="pbp-req">*</span></label>
                                    <input
                                        className={`pbp-input${errors.name ? " error" : ""}`}
                                        placeholder="Your name"
                                        value={form.name}
                                        onChange={e => setF("name", e.target.value)}
                                    />
                                </div>
                                <div className="pbp-form-group" style={{ flex: 1 }}>
                                    <label>Guests <span className="pbp-req">*</span></label>
                                    <div className={`pbp-stepper${errors.guests ? " error" : ""}`}>
                                        <button type="button" onClick={() => setF("guests", Math.max(1, form.guests - 1))}>−</button>
                                        <span>{form.guests}</span>
                                        <button type="button" onClick={() => setF("guests", Math.min(50, form.guests + 1))}>+</button>
                                    </div>
                                    {isGroupDiscount && <span className="pbp-discount-note">🎉 Group &gt;8 — 10% off!</span>}
                                </div>
                            </div>
                            <div className="pbp-form-row">
                                <div className="pbp-form-group">
                                    <label>Mobile <span className="pbp-req">*</span></label>
                                    <input
                                        className={`pbp-input${errors.mobile ? " error" : ""}`}
                                        placeholder="10-digit number"
                                        type="tel"
                                        value={form.mobile}
                                        onChange={e => setF("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    />
                                </div>
                                <div className="pbp-form-group">
                                    <label>Email <span className="pbp-opt">(optional)</span></label>
                                    <input
                                        className={`pbp-input${errors.email ? " error" : ""}`}
                                        placeholder="email@example.com"
                                        type="email"
                                        value={form.email}
                                        onChange={e => setF("email", e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* NOTES */}
                        <div className="pbp-section-label">Note <span className="pbp-opt">(optional)</span></div>
                        <div className="pbp-card">
                            <textarea
                                className="pbp-notes"
                                rows={3}
                                placeholder="Special requests, dietary restrictions..."
                                value={form.notes}
                                onChange={e => setF("notes", e.target.value)}
                            />
                        </div>

                    </div>{/* end left col */}

                    {/* ════ RIGHT COLUMN ════ */}
                    <div className="pbp-col">

                        {/* SCHEDULE */}
                        <div className="pbp-section-label">Date &amp; Dining Slot</div>
                        <div className="pbp-card">
                            {/* Date */}
                            <div className="pbp-form-group pbp-schedule-date">
                                <label>Date <span className="pbp-req">*</span></label>
                                <CustomDatePicker
                                    value={form.date}
                                    min={tomorrowStr()}
                                    onChange={v => { setF("date", v); setF("time", ""); }}
                                    hasError={!!errors.date}
                                />
                            </div>

                            {/* Dining Slot */}
                            <div className="pbp-form-group pbp-schedule-slots">
                                <label>Dining Slot <span className="pbp-req">*</span></label>
                                <div className="pbp-slot-groups">
                                    {SLOT_GROUPS.map(sg => {
                                        const nowH = new Date().getHours();
                                        const slotEndH = parseInt(sg.end.split(":")[0]);
                                        const isPast = form.date === todayStr() && nowH >= slotEndH;
                                        return (
                                            <div key={sg.key}
                                                className={`pbp-slot-group${form.slotGroup === sg.key ? " active" : ""}${isPast ? " pbp-slot-disabled" : ""}`}
                                                onClick={() => { if (!isPast) { setF("slotGroup", sg.key); setF("time", ""); } }}>
                                                <span className="pbp-sg-label">{sg.label}</span>
                                                <span className="pbp-sg-time">{sg.start} – {sg.end}</span>
                                                {isPast && <span className="pbp-slot-past-badge">Passed</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                                {errors.slotGroup && <span className="pbp-field-error">Pick a dining slot</span>}
                            </div>

                            {/* Time */}
                            <div className="pbp-form-group pbp-schedule-time">
                                <label>Preferred Time <span className="pbp-req">*</span></label>
                                <ClockTimePicker
                                    value={form.time}
                                    onChange={v => setF("time", v)}
                                    slotStart={activeSlot?.start}
                                    slotEnd={activeSlot?.end}
                                    isToday={form.date === todayStr()}
                                    hasError={!!errors.time}
                                    disabled={!form.slotGroup}
                                />
                                {!form.slotGroup && <span className="pbp-time-hint">Select a slot first</span>}
                                {form.slotGroup && activeSlot && <span className="pbp-time-hint">{activeSlot.start} – {activeSlot.end}</span>}
                            </div>
                        </div>

                        {/* PRE-ORDER FOODS */}
                        <div className="pbp-section-label">Pre-Order Foods</div>
                        <div className={`pbp-card${errors.bag ? " pbp-card-error" : ""}`}>
                            {!safeBag.length ? (
                                <div className="pbp-empty">
                                    <p>No items selected</p>
                                    <span>Add items from the menu to pre-order</span>
                                </div>
                            ) : (
                                <>
                                    <div className="pbp-items">
                                        {safeBag.map((item, i) => (
                                            <div key={i} className="pbp-item">
                                                <div>
                                                    <span className="pbp-item-name">{item.name}</span>
                                                    {item.selectedSize && <span className="pbp-item-size"> {item.selectedSize} × {item.quantity}</span>}
                                                </div>
                                                <div className="pbp-item-price">₹{item.totalPrice}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pbp-bill">
                                        <div className="pbp-bill-row"><span>Subtotal</span><span>₹{subtotal}</span></div>
                                        {isGroupDiscount && (
                                            <div className="pbp-bill-row pbp-bill-discount">
                                                <span>Group Discount (10%)</span><span>− ₹{discount}</span>
                                            </div>
                                        )}
                                        <div className="pbp-bill-row pbp-bill-total">
                                            <span>Total (Pay in Advance)</span><strong>₹{totalAmount}</strong>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* SUBMIT ERROR */}
                        {errors._submit && (
                            <div className="pbp-submit-error">Something went wrong. Please try again.</div>
                        )}

                        {/* ACTIONS */}
                        <div className="pbp-actions">
                            <button className="pbp-cancel-btn" type="button" onClick={handleBack}>Cancel</button>
                            <button
                                className={`pbp-submit-btn${loading ? " loading" : ""}`}
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Confirm Pre Booking"}
                            </button>
                        </div>

                    </div>{/* end right col */}

                </div>{/* end grid */}
            </div>{/* end shell */}

        </div>
    );
};

export default PreBooking;