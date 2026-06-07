//user panel
import { useState, useEffect } from "react";
import api from "../api";
import { UserDatePicker, todayStr } from "./UserDatePicker";
import { UserTimePicker } from "./UserTimePicker";
import "./ReservationForm.css";
import "./PreviewModal.css";
import { useToast } from "./Usetoast";
import homeIcon from "../assets/icons/home.png";

const pad = (n) => String(n).padStart(2, "0");

const SLOT_GROUPS = [
    { label: "Breakfast", key: "BF", start: "07:00", end: "10:00" },
    { label: "Brunch", key: "BR", start: "10:00", end: "12:00" },
    { label: "Lunch", key: "LU", start: "12:00", end: "15:00" },
    { label: "Hi-Tea", key: "HT", start: "15:00", end: "18:00" },
    { label: "Dinner", key: "DI", start: "18:30", end: "22:00" },
];

/* ─── Default SVG visuals keyed by label ─── */
const DEFAULT_PREF_SVGS = {
    Window: (
        <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="56" height="40" rx="3" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1.5" />
            <line x1="30" y1="2" x2="30" y2="42" stroke="#60a5fa" strokeWidth="1.5" />
            <line x1="2" y1="22" x2="58" y2="22" stroke="#60a5fa" strokeWidth="1.5" />
            <rect x="10" y="28" width="16" height="10" rx="2" fill="#93c5fd" opacity=".6" />
            <rect x="34" y="28" width="16" height="10" rx="2" fill="#93c5fd" opacity=".6" />
            <path d="M8 6 L14 14 M18 6 L24 14" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    ),
    Booth: (
        <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="52" height="36" rx="6" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" />
            <rect x="4" y="4" width="12" height="36" rx="4" fill="#fbbf24" />
            <rect x="44" y="4" width="12" height="36" rx="4" fill="#fbbf24" />
            <rect x="16" y="16" width="28" height="12" rx="3" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.2" />
            <circle cx="30" cy="22" r="4" fill="#fcd34d" />
        </svg>
    ),
    Hitter: (
        <svg viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="16" y="6" width="28" height="6" rx="2" fill="#6b7280" stroke="#4b5563" strokeWidth="1.2" />
            <line x1="30" y1="12" x2="30" y2="38" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
            <circle cx="14" cy="18" r="5" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.2" />
            <line x1="14" y1="23" x2="14" y2="38" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            <circle cx="46" cy="18" r="5" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.2" />
            <line x1="46" y1="23" x2="46" y2="38" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    Any: (
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
};

const FALLBACK_TABLE_PREFS = [
    { label: "Any", desc: "No preference" },
    { label: "Window", desc: "Natural light, street view" },
    { label: "Booth", desc: "Cozy enclosed seating" },
    { label: "Hitter", desc: "High-top bar seating" },
];

/* ─── Main Form Component ─── */
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

    /* ── Dynamic table preferences from /tablePreferences ── */
    const [tablePrefs, setTablePrefs] = useState(FALLBACK_TABLE_PREFS);
    const [prefsLoaded, setPrefsLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const loadPrefs = async () => {
            try {
                const res = await api.get("/tablePreferences");
                const records = res.data || [];
                if (!cancelled && records.length > 0) {
                    const sorted = [...records].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
                    setTablePrefs(sorted.map(r => ({
                        label: r.label,
                        desc: r.desc || "",
                        image: r.image || null,
                        svg: r.image
                            ? <img src={r.image} alt={r.label} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                            : DEFAULT_PREF_SVGS[r.label] || <span style={{ fontSize: 24 }}>🪑</span>,
                    })));
                }
            } catch {
                setTablePrefs(FALLBACK_TABLE_PREFS.map(p => ({
                    ...p,
                    svg: DEFAULT_PREF_SVGS[p.label] || <span style={{ fontSize: 24 }}>🪑</span>,
                })));
            } finally {
                if (!cancelled) setPrefsLoaded(true);
            }
        };
        loadPrefs();
        return () => { cancelled = true; };
    }, []);

    /* Pre-fill user */
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
    }, []);

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

    const handleSlotChange = (key) => { set("slotGroup", key); set("time", ""); };
    const handleDateChange = (d) => { set("date", d); set("time", ""); };

    const validate = () => {
        const e = {};
        if (!form.name.trim() || form.name.trim().length < 2) e.name = "Enter a valid name";
        const cleanMobile = form.mobile.replace(/\D/g, "");
        if (!cleanMobile || cleanMobile.length !== 10) e.mobile = "Enter a valid 10-digit number";
        if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Invalid email";
        if (!form.guests || Number(form.guests) < 1) e.guests = "At least 1 guest required";
        if (!form.date) e.date = "Pick a date";
        if (!form.time) e.time = "Pick a time";
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

    /* ── Success Screen ── */
    if (submitted) {
        const slot = SLOT_GROUPS.find(s => s.key === form.slotGroup);
        return (
            <div className="rf-page">
                <div className="food-header">
                    <button className="back-button" onClick={handleBack} />
                    <div style={{ flex: "1 1" }}>
                        <div className="rf-page-title">Table Reservation</div>
                        <div className="rf-page-sub">Reserve your perfect dining experience</div>
                    </div>
                    <div className="home-btn home-btn-icon" onClick={handleHome}>
                        <span className="shadow"></span>
                        <span className="edge"></span>
                        <span className="front"><img src={homeIcon} alt="home-btn" /></span>
                    </div>
                </div>
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
                    <button className="form-action-btn submit" onClick={() => {
                        setSubmitted(false);
                        setForm({ name: "", mobile: "", email: "", guests: 2, slotGroup: "", time: "", date: todayStr(), tablePref: "Any", notes: "", status: "pending" });
                    }}>
                        <span className="shadow"></span>
                        <span className="edge"></span>
                        <span className="front">Make Another Reservation</span>
                    </button>

                    <button className="form-action-btn submit" onClick={handleHome}>
                        <span className="shadow"></span>
                        <span className="edge"></span>
                        <span className="front">Back to Home</span>
                    </button>
                </div>
            </div>
        );
    }

    /* ── Cross-check Modal ── */
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
                    <button className="form-action-btn cancel" onClick={() => setShowCrossCheck(false)}>
                        <span className="shadow"></span>
                        <span className="edge"></span>
                        <span className="front">Edit</span>
                    </button>
                    <button className="form-action-btn submit" onClick={handleSubmit} disabled={submitting}>
                        <span className="shadow"></span>
                        <span className="edge"></span>
                        <span className="front">{submitting ? <span className="rf-spinner" /> : "Confirm"}</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="rf-page">
            {showCrossCheck && <CrossCheckModal />}

            <div className="food-header">
                <button className="back-button" onClick={handleBack} />
                <div style={{ flex: "1 1" }}>
                    <div className="rf-page-title">Table Reservation</div>
                    <div className="rf-page-sub">Reserve your perfect dining experience</div>
                </div>
                <div className="home-btn home-btn-icon" onClick={handleHome}>
                    <span className="shadow"></span>
                    <span className="edge"></span>
                    <span className="front"><img src={homeIcon} alt="home-btn" /></span>
                </div>
            </div>

            <div className="rf-single-form">
                <div className="rf-form-grid">

                    {/* LEFT COLUMN */}
                    <div className="rf-col rf-col-left">

                        {/* Guest Details */}
                        <div className="rf-section">
                            <div className="section-title">Guest Details</div>

                            {/* Full Name */}
                            <div className="field-group">
                                <div className="mat">
                                    <input className={`mat-input${errors.name ? " error" : ""}`} value={form.name} onChange={e => set("name", e.target.value)} placeholder=" " autoComplete="name" />
                                    <label className="mat-label">Full Name <span className="rf-req">*</span></label>
                                    <span className="mat-bar" />
                                </div>
                            </div>

                            <div className="mat-row">
                                {/* Mobile */}
                                <div className="field-group" style={{ flex: 1.4 }}>

                                    <div className={"mat-input-prefix-wrap"}>
                                        <span className={`mat-prefix${errors.mobile ? " error" : ""}`}>+91</span>
                                        <div className="mat">
                                            <input className={`mat-input${errors.mobile ? " error" : ""}`} type="tel" value={form.mobile} onChange={e => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder=" " autoComplete="tel" />
                                            <label className="mat-label">Mobile <span className="rf-req">*</span></label>
                                            <span className="mat-bar" />
                                        </div>

                                    </div>
                                </div>

                                {/* Email */}
                                <div className="field-group" style={{ flex: 1 }}>
                                    <div className="mat">
                                        <input className={`mat-input${errors.email ? " error" : ""}`} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder=" " autoComplete="email" />
                                        <label className="mat-label">Email <span className="rf-optional">(optional)</span></label>
                                        <span className="mat-bar" />
                                    </div>
                                </div>
                            </div>

                            <div className="field-group" style={{ flex: "0 0 auto" }}>
                                <label>Guests <span className="rf-req">*</span></label>
                                <div className="stepper-ctrl">
                                    <button type="button" className="stepper-btn" onClick={() => set("guests", Math.max(1, form.guests - 1))}>−</button>
                                    <span className="stepper-val">{form.guests}</span>
                                    <button type="button" className="stepper-btn" onClick={() => set("guests", Math.min(30, form.guests + 1))}>+</button>
                                </div>
                                {errors.guests && <span className="rf-error">{errors.guests}</span>}
                            </div>
                        </div>

                        {/* Seating Preference */}
                        <div className="rf-section">
                            <div className="section-title">Seating Preference</div>
                            {!prefsLoaded && (
                                <div style={{ padding: "12px 0", color: "#aaa", fontSize: 13 }}>Loading options…</div>
                            )}
                            <div className="rf-table-pref-grid">
                                {tablePrefs.map(p => (
                                    <button type="button" key={p.label}
                                        className={`rf-table-pref-card${form.tablePref === p.label ? " active" : ""}`}
                                        onClick={() => set("tablePref", p.label)}>
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
                            <div className="section-title">Date &amp; Dining Slot</div>

                            {/* Date */}
                            <div className="field-group" style={{ flex: "0 0 auto" }}>
                                <label>Date <span className="rf-req">*</span></label>
                                <UserDatePicker
                                    value={form.date}
                                    min={todayStr()}
                                    hasError={!!errors.date}
                                    onChange={handleDateChange}
                                />
                                {errors.date && <span className="rf-error">{errors.date}</span>}
                            </div>

                            {/* Dining Slot */}
                            <div className="field-group">
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

                            {/* Preferred Time (optional) */}
                            <div className="field-group" style={{ flex: "0 0 auto" }}>
                                <label>Preferred Time <span className="rf-optional">(optional)</span></label>
                                <UserTimePicker
                                    value={form.time}
                                    onChange={v => set("time", v)}
                                    slotStart={currentSlot?.start}
                                    slotEnd={currentSlot?.end}
                                    disabled={!form.slotGroup}
                                    isToday={isToday}
                                    hasError={!!errors.time}
                                />
                                {!form.slotGroup && <span style={{ fontSize: 11, color: "#aaa", marginTop: 4, display: "block" }}>Select a slot first</span>}
                                {form.slotGroup && currentSlot && <span style={{ fontSize: 11, color: "#888", marginTop: 4, display: "block" }}>{currentSlot.start} – {currentSlot.end}</span>}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="rf-section">
                            <div className="section-title">Special Requests</div>
                            <div className="field-group">
                                <textarea
                                    className="rf-textarea"
                                    rows={3}
                                    placeholder=" "
                                    value={form.notes}
                                    onChange={e => set("notes", e.target.value)}
                                    maxLength={300}
                                />
                            </div>
                        </div>

                        <div className="form-btn-row">
                            <button type="button" className="form-action-btn cancel" onClick={() => {
                                setForm({ name: "", mobile: "", email: "", guests: 2, slotGroup: "", time: "", date: todayStr(), tablePref: "Any", notes: "", status: "pending" });
                                setErrors({});
                                handleBack();
                            }}>
                                <span className="shadow"></span>
                                <span className="edge"></span>
                                <span className="front">Cancel</span>
                            </button>
                            <button type="button" className="form-action-btn submit" onClick={() => { if (validate()) setShowCrossCheck(true); }}>
                                <span className="shadow"></span>
                                <span className="edge"></span>
                                <span className="front">Review & Confirm</span>
                            </button>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationForm;