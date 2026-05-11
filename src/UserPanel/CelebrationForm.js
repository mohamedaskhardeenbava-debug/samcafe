/* user panel */
import { useState, useEffect } from "react";
import api from "../api";
import { UserDatePicker, todayStr } from "./UserDatePicker";
import { UserTimePicker } from "./UserTimePicker";
import "./CelebrationForm.css";

const pad = (n) => String(n).padStart(2, "0");

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

const CELEBRATION_TYPES = [
    { label: "Birthday", value: "birthday" },
    { label: "Anniversary", value: "anniversary" },
    { label: "Meeting", value: "meeting" },
    { label: "Get Together", value: "gettogether" },
];

const DECORATION_TIERS = [
    { label: "Normal", value: "normal", price: 1500, desc: "Balloons & basic setup" },
    { label: "Elegant", value: "elegant", price: 3000, desc: "Flowers, drapes & lighting" },
    { label: "Luxury", value: "luxury", price: 5000, desc: "Premium full decor" },
];

const BIRTHDAY_EXTRAS = [{ key: "cake", label: "Cake" }, { key: "specialMention", label: "Special Mentions" }];
const MEETING_SEATING = [{ key: "standingBrochures", label: "Standing Brochures" }, { key: "placeHolders", label: "Place Holders" }, { key: "pens", label: "Pens" }];
const MEETING_AV = [{ key: "mic", label: "Microphone" }, { key: "projector", label: "Projector" }];
const ANNIVERSARY_EXTRAS = [{ key: "candleLight", label: "Candle Light Dinner" }, { key: "liveMusic", label: "Live Music" }, { key: "surpriseGift", label: "Surprise Gift Revealing" }, { key: "cake", label: "Cake" }, { key: "specialMention", label: "Special Mentions" }];
const GETTOGETHER_EXTRAS = [{ key: "liveMusic", label: "Live Music" }, { key: "mic", label: "Microphone" }, { key: "projector", label: "Projector" }, { key: "cake", label: "Cake" }, { key: "specialMention", label: "Special Mentions" }];
const EVENT_MENUS = [{ value: "veg", label: "Veg Menu" }, { value: "nonveg", label: "Non-Veg Menu" }, { value: "vegan", label: "Vegan Menu" }, { value: "custom", label: "Custom Menu" }];

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

    const handleSlotChange = (key) => { set("slotGroup", key); set("time", ""); };
    const handleDateChange = (d) => { set("date", d); set("time", ""); };

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

    const resetForm = () => setForm({
        type: "birthday", name: "", mobile: "", email: "", date: "", time: "", slotGroup: "",
        guests: 2, birthdayPersonName: "", birthdayPersonAge: "", cake: false,
        specialMention: false, specialMentionText: "", standingBrochures: false,
        placeHolders: false, pens: false, mic: false, projector: false, candleLight: false,
        liveMusic: false, surpriseGift: false, decoration: null, eventMenu: "", audioVideo: false, specialNote: "",
    });

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
                    <div className="home-btn home-btn-icon" onClick={handleHome} />
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
                    <button className="clp-submit" onClick={resetForm}>Book Another</button>
                </div>
            </div>
        );
    }

    return (
        <div className="clp-page">
            <div className="food-header">
                <button className="back-button" onClick={handleBack} />
                <div className="food-list-title">Celebration</div>
                <div className="home-btn home-btn-icon" onClick={handleHome} />
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

                            {/* Date, Slot & Time */}
                            <div className="clp-row">
                                <div className="clp-group" style={{ flex: "0 0 auto" }}>
                                    <label className="clp-field-label">Date *</label>
                                    <UserDatePicker
                                        value={form.date}
                                        min={tomorrowStr()}
                                        hasError={!!errors.date}
                                        onChange={handleDateChange}
                                    />
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
                                    <UserTimePicker
                                        value={form.time}
                                        hasError={!!errors.time}
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
                                <div className="clp-check-grid">{renderExtrasWithMention(BIRTHDAY_EXTRAS)}</div>
                            </div>
                        </div>
                    )}

                    {form.type === "meeting" && (
                        <div className="clp-block">
                            <div className="clp-title">Meeting Setup</div>
                            <div className="clp-card">
                                <div className="clp-sub-title">Table Decoration</div>
                                <div className="clp-check-grid">
                                    {MEETING_SEATING.map(ex => <CheckCard key={ex.key} label={ex.label} checked={form[ex.key]} onChange={v => set(ex.key, v)} />)}
                                </div>
                                <div className="clp-sub-title" style={{ marginTop: 10 }}>Audio / Video</div>
                                <div className="clp-check-grid">
                                    {MEETING_AV.map(ex => <CheckCard key={ex.key} label={ex.label} checked={form[ex.key]} onChange={v => set(ex.key, v)} />)}
                                </div>
                            </div>
                        </div>
                    )}

                    {form.type === "anniversary" && (
                        <div className="clp-block">
                            <div className="clp-title">Anniversary Extras</div>
                            <div className="clp-card">
                                <div className="clp-check-grid">{renderExtrasWithMention(ANNIVERSARY_EXTRAS)}</div>
                            </div>
                        </div>
                    )}

                    {form.type === "gettogether" && (
                        <div className="clp-block">
                            <div className="clp-title">Get Together Setup</div>
                            <div className="clp-card">
                                <div className="clp-check-grid">{renderExtrasWithMention(GETTOGETHER_EXTRAS)}</div>
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

                    
                        <button className={`clp-submit${loading ? " loading" : ""}`} onClick={handleSubmit} disabled={loading}>
                            {loading ? "Processing..." : "Book Celebration"}
                        </button>
                    
                </div>
            </div>
        </div>
    );
};

export default CelebrationForm;