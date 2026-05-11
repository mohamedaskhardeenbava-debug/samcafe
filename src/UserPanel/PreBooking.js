// user panel
import { useState, useEffect } from "react";
import api from "../api";
import { UserDatePicker, todayStr } from "./UserDatePicker";
import { UserTimePicker } from "./UserTimePicker";
import "./PreBooking.css";

const pad = (n) => String(n).padStart(2, "0");
const tomorrowStr = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; };

const SLOT_GROUPS = [
    { label: "Breakfast", key: "BF", start: "07:00", end: "10:00" },
    { label: "Brunch", key: "BR", start: "10:00", end: "12:00" },
    { label: "Lunch", key: "LU", start: "12:00", end: "15:00" },
    { label: "Hi-Tea", key: "HT", start: "15:00", end: "18:00" },
    { label: "Dinner", key: "DI", start: "18:30", end: "22:00" },
];

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
        if (Object.keys(ve).length > 0) { setErrors(ve); return; }
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
                    <div className="home-btn home-btn-icon" onClick={handleHome} />
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
                <div className="home-btn home-btn-icon" onClick={handleHome} />
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
                                <UserDatePicker
                                    value={form.date}
                                    min={tomorrowStr()}
                                    hasError={!!errors.date}
                                    onChange={v => { setF("date", v); setF("time", ""); }}
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
                                <UserTimePicker
                                    value={form.time}
                                    hasError={!!errors.time}
                                    onChange={v => setF("time", v)}
                                    slotStart={activeSlot?.start}
                                    slotEnd={activeSlot?.end}
                                    isToday={form.date === todayStr()}
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
                            <button
                                className={`pbp-submit-btn${loading ? " loading" : ""}`}
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Confirm Pre Booking"}
                            </button>

                    </div>{/* end right col */}

                </div>{/* end grid */}
            </div>{/* end shell */}

        </div>
    );
};

export default PreBooking;