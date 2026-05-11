// user panel
import { useState, useEffect } from "react";
import api from "../api";
import { UserDatePicker, todayStr } from "./UserDatePicker";
import { UserTimePicker } from "./UserTimePicker";
import "./CateringForm.css";

const pad = (n) => String(n).padStart(2, "0");

/* ══════════════════════════════════
   Main Component — User Catering Form
══════════════════════════════════ */
const CateringForm = ({ bag, setBag, handleBack, handleHome }) => {
    const [form, setForm] = useState({
        name: "", mobile: "", email: "", guests: 1,
        eventDate: "", time: "", location: "", notes: ""
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [bookingId, setBookingId] = useState("");

    /* Pre-fill from logged-in user */
    useEffect(() => {
        const loadUser = async () => {
            try {
                const userId = localStorage.getItem("userId");
                if (!userId) return;
                const res = await api.get(`/users/${userId}`);
                setForm(prev => ({
                    ...prev,
                    name: res.data?.name || "",
                    mobile: res.data?.mobile || ""
                }));
            } catch (err) { console.error(err); }
        };
        loadUser();
    }, []);

    const safeBag = Array.isArray(bag) ? bag : [];
    const totalAmount = safeBag.reduce((s, i) => s + Number(i.totalPrice || 0), 0);

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
        if (!form.guests || form.guests < 1) err.guests = true;
        if (!form.eventDate) err.eventDate = true;
        if (!form.time) err.time = true;
        return err;
    };

    const handleSubmit = async () => {
        const ve = validate();
        if (Object.keys(ve).length > 0) { setErrors(ve); return; }
        try {
            setLoading(true);
            const newId = `cat_${Date.now()}`;
            await api.post("/cateringOrders", {
                id: newId,
                name: form.name,
                mobile: form.mobile,
                email: form.email || "",
                guests: form.guests,
                date: form.eventDate,
                eventDate: form.eventDate,
                time: form.time,
                location: form.location || "",
                notes: form.notes || "",
                items: safeBag,
                totalAmount,
                status: "pending",
                source: "User App",
                createdAt: new Date().toISOString(),
            });
            setBookingId(newId.slice(-6).toUpperCase());
            setSubmitted(true);
            if (typeof setBag === "function") setBag([]);
        } catch (e) {
            console.error(e);
            setErrors(prev => ({ ...prev, _submit: true }));
        } finally {
            setLoading(false);
        }
    };

    const fmtTime = (t) => {
        if (!t) return "";
        const [h, m] = t.split(":").map(Number);
        return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
    };

    /* ── Success Screen ── */
    if (submitted) {
        return (
            <div style={{ fontFamily: "inherit" }}>
                <div className="food-header">
                    <button className="back-button" onClick={handleBack} />
                    <div className="food-list-title">Catering</div>
                    <div className="home-btn home-btn-icon" onClick={handleHome} />
                </div>
                <div className="ucat-success-screen">
                    <div className="ucat-success-icon">🍽️</div>
                    <h2 className="ucat-success-title">Catering Submitted!</h2>
                    <p className="ucat-success-sub">We'll confirm your catering order shortly.</p>
                    <div className="ucat-success-id">
                        Booking ID: <span className="ucat-booking-code">#{bookingId}</span>
                    </div>
                    <div className="ucat-success-card">
                        <div className="ucat-sc-row"><span>Name</span><strong>{form.name}</strong></div>
                        <div className="ucat-sc-row"><span>Mobile</span><strong>{form.mobile}</strong></div>
                        <div className="ucat-sc-row"><span>Date</span><strong>{form.eventDate}</strong></div>
                        <div className="ucat-sc-row"><span>Time</span><strong>{fmtTime(form.time)}</strong></div>
                        <div className="ucat-sc-row"><span>Guests</span><strong>{form.guests}</strong></div>
                        {form.location && <div className="ucat-sc-row"><span>Location</span><strong>{form.location}</strong></div>}
                        {totalAmount > 0 && <div className="ucat-sc-row"><span>Order Total</span><strong>₹{totalAmount}</strong></div>}
                    </div>
                    <button className="ucat-back-home-btn" onClick={handleHome}>Back to Home</button>
                </div>
            </div>
        );
    }

    /* ── Main Form ── */
    return (
        <div className="ucat-page">
            <div className="food-header">
                <button className="back-button" onClick={handleBack} />
                <div className="food-list-title">Catering</div>
                <div className="home-btn home-btn-icon" onClick={handleHome} />
            </div>

            <div className="ucat-form-shell">
                <div className="ucat-form-grid">

                    {/* ════ LEFT COLUMN ════ */}
                    <div className="ucat-col">

                        {/* GUEST DETAILS */}
                        <div className="ucat-section-label">Your Details</div>
                        <div className="ucat-card">
                            <div className="ucat-form-row">
                                <div className="ucat-form-group" style={{ flex: 1.4 }}>
                                    <label>Name <span className="ucat-req">*</span></label>
                                    <input
                                        className={`ucat-input${errors.name ? " error" : ""}`}
                                        placeholder="Your full name"
                                        value={form.name}
                                        onChange={e => setF("name", e.target.value)}
                                    />
                                </div>
                                <div className="ucat-form-group" style={{ flex: 1 }}>
                                    <label>Guests <span className="ucat-req">*</span></label>
                                    <div className={`ucat-stepper${errors.guests ? " error" : ""}`}>
                                        <button type="button" onClick={() => setF("guests", Math.max(1, form.guests - 1))}>−</button>
                                        <span>{form.guests}</span>
                                        <button type="button" onClick={() => setF("guests", Math.min(1000, form.guests + 1))}>+</button>
                                    </div>
                                </div>
                            </div>

                            <div className="ucat-form-row">
                                <div className="ucat-form-group">
                                    <label>Mobile <span className="ucat-req">*</span></label>
                                    <input
                                        className={`ucat-input${errors.mobile ? " error" : ""}`}
                                        placeholder="10-digit number"
                                        type="tel"
                                        value={form.mobile}
                                        onChange={e => setF("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    />
                                </div>
                                <div className="ucat-form-group">
                                    <label>Email <span className="ucat-opt">(optional)</span></label>
                                    <input
                                        className={`ucat-input${errors.email ? " error" : ""}`}
                                        placeholder="email@example.com"
                                        type="email"
                                        value={form.email}
                                        onChange={e => setF("email", e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* EVENT DETAILS */}
                        <div className="ucat-section-label">Event Details</div>
                        <div className="ucat-card">
                            {/* Date */}
                            <div className="ucat-form-group">
                                <label>Event Date <span className="ucat-req">*</span></label>
                                <UserDatePicker
                                    value={form.eventDate}
                                    min={todayStr()}
                                    hasError={!!errors.eventDate}
                                    onChange={v => { setF("eventDate", v); setF("time", ""); }}
                                />
                            </div>

                            {/* Time */}
                            <div className="ucat-form-group">
                                <label>Preferred Time <span className="ucat-req">*</span></label>
                                <UserTimePicker
                                    value={form.time}
                                    hasError={!!errors.time}
                                    onChange={v => setF("time", v)}
                                />
                            </div>

                            {/* Location */}
                            <div className="ucat-form-group">
                                <label>Event Location <span className="ucat-opt">(optional)</span></label>
                                <input
                                    className="ucat-input"
                                    placeholder="Venue or address"
                                    value={form.location}
                                    onChange={e => setF("location", e.target.value)}
                                />
                            </div>
                        </div>

                        {/* NOTES */}
                        <div className="ucat-section-label">Note <span className="ucat-opt">(optional)</span></div>
                        <div className="ucat-card">
                            <textarea
                                className="ucat-notes"
                                rows={3}
                                placeholder="Special requests, dietary requirements, menu preferences..."
                                value={form.notes}
                                onChange={e => setF("notes", e.target.value)}
                            />
                        </div>

                    </div>{/* end left col */}

                    {/* ════ RIGHT COLUMN ════ */}
                    <div className="ucat-col">

                        {/* SELECTED ITEMS from bag */}
                        <div className="ucat-section-label">Selected Items</div>
                        <div className={`ucat-card${errors.bag ? " ucat-card-error" : ""}`}>
                            {!safeBag.length ? (
                                <div className="ucat-empty">
                                    <p>No items in your order</p>
                                    <span>Add catering items from the menu</span>
                                </div>
                            ) : (
                                <>
                                    <div className="ucat-items">
                                        {safeBag.map((item, i) => (
                                            <div key={i} className="ucat-item">
                                                <div>
                                                    <span className="ucat-item-name">{item.name}</span>
                                                    {item.selectedSize && <span className="ucat-item-size"> {item.selectedSize} × {item.quantity}</span>}
                                                </div>
                                                <div className="ucat-item-price">₹{item.totalPrice}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="ucat-bill">
                                        <div className="ucat-bill-row ucat-bill-total">
                                            <span>Total</span>
                                            <strong>₹{totalAmount}</strong>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* SUBMIT ERROR */}
                        {errors._submit && (
                            <div className="ucat-submit-error">Something went wrong. Please try again.</div>
                        )}
                            <button
                                className={`ucat-submit-btn${loading ? " loading" : ""}`}
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? "Submitting..." : "Submit Catering"}
                            </button>

                    </div>{/* end right col */}

                </div>{/* end grid */}
            </div>

        </div>
    );
};

export default CateringForm;