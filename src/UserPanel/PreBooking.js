// user panel
import { useState, useEffect, useMemo } from "react";
import api from "../api";
import { UserDatePicker, todayStr } from "./UserDatePicker";
import { UserTimePicker } from "./UserTimePicker";
import "./PreBooking.css";
import "./ReservationForm.css";

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
   Add Dish Popup — ALL dishes (no isEventFood filter)
══════════════════════════════════ */
const AddDishPopup = ({ onClose, onAdd, existingIds, guests }) => {
    const [menuData, setMenuData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeCat, setActiveCat] = useState(null);
    const [vegFilter, setVegFilter] = useState("all");
    const [search, setSearch] = useState("");

    useEffect(() => {
        api.get("/categories")
            .then(res => { setMenuData(res.data); setLoading(false); })
            .catch(() => { setMenuData([]); setLoading(false); });
    }, []);

    /* All dishes — no isEventFood filter for prebooking */
    const { categories, allDishes } = useMemo(() => {
        if (!menuData) return { categories: [], allDishes: [] };
        const rawCats = Array.isArray(menuData) ? menuData : (menuData.categories || []);
        const cats = [];
        const dishes = [];

        rawCats.forEach(topCat => {
            const subs = topCat.subCategories || [];
            if (subs.length > 0) {
                subs.forEach(sub => {
                    if ((sub.dishes || []).length > 0) {
                        cats.push({ id: sub.id, name: sub.name });
                        (sub.dishes || []).forEach(d => dishes.push({
                            ...d,
                            price: d.basePrice || d.price || 0,
                            categoryId: sub.id,
                            categoryName: sub.name,
                        }));
                    }
                });
            } else if ((topCat.dishes || []).length > 0) {
                cats.push({ id: topCat.id, name: topCat.name });
                (topCat.dishes || []).forEach(d => dishes.push({
                    ...d,
                    price: d.basePrice || d.price || 0,
                    categoryId: topCat.id,
                    categoryName: topCat.name,
                }));
            }
        });

        return { categories: cats, allDishes: dishes };
    }, [menuData]);

    const guestCount = Math.max(1, parseInt(guests, 10) || 1);

    const filteredDishes = useMemo(() => {
        let d = activeCat ? allDishes.filter(x => x.categoryId === activeCat) : allDishes;
        if (vegFilter === "veg") d = d.filter(x => x.isVeg !== false);
        if (vegFilter === "nonveg") d = d.filter(x => x.isVeg === false);
        if (search.trim()) {
            const q = search.toLowerCase();
            d = d.filter(x => (x.name || "").toLowerCase().includes(q));
        }
        return d;
    }, [allDishes, activeCat, vegFilter, search]);

    return (
        <div className="pbp-dish-popup-overlay" onClick={onClose}>
            <div className="pbp-dish-popup" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="pbp-dish-popup-header">
                    <h3 className="pbp-dish-popup-title">Add Dish</h3>
                    <button className="pbp-dish-popup-close" onClick={onClose}>✕</button>
                </div>

                {/* Search */}
                <div className="pbp-dish-popup-search-wrap">
                    <input
                        className="pbp-dish-popup-search"
                        placeholder="Search dishes…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Category tabs */}
                {!loading && (
                    <div className="pbp-dish-popup-cats">
                        <button className={`pbp-dish-cat-btn${!activeCat ? " active" : ""}`} onClick={() => setActiveCat(null)}>All</button>
                        {categories.map(c => (
                            <button key={c.id}
                                className={`pbp-dish-cat-btn${activeCat === c.id ? " active" : ""}`}
                                onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}>
                                {c.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Veg filter */}
                <div className="pbp-dish-popup-veg-row">
                    {["all", "veg", "nonveg"].map(v => (
                        <button key={v}
                            className={`pbp-veg-filter-btn${vegFilter === v ? " active-" + v : ""}`}
                            onClick={() => setVegFilter(v)}>
                            {v === "all" ? "All" : v === "veg" ? "🟢 Veg" : "🔴 Non-Veg"}
                        </button>
                    ))}
                </div>

                {/* Dish grid */}
                <div className="pbp-dish-popup-body">
                    {loading ? (
                        <div className="pbp-dish-popup-empty">Loading dishes…</div>
                    ) : filteredDishes.length === 0 ? (
                        <div className="pbp-dish-popup-empty">No dishes found.</div>
                    ) : (
                        <div className="pbp-dish-grid">
                            {filteredDishes.map(dish => {
                                const already = existingIds.has(dish.id);
                                const total = dish.price * guestCount;
                                return (
                                    <div key={dish.id} className={`pbp-dish-card${already ? " added" : ""}`}>
                                        {dish.image ? (
                                            <img src={dish.image} alt={dish.name} className="pbp-dish-card-img" />
                                        ) : (
                                            <div className="pbp-dish-card-img pbp-dish-placeholder">🍽️</div>
                                        )}
                                        <div className="pbp-dish-card-body">
                                            <div className="pbp-dish-card-name">{dish.name}</div>
                                            <div className="pbp-dish-card-cat">{dish.categoryName}</div>
                                            <div className="pbp-dish-card-price">
                                                ₹{dish.price}/person
                                                <span className="pbp-dish-card-total"> = ₹{total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <button
                                            className={`pbp-dish-card-btn${already ? " remove" : ""}`}
                                            onClick={() => onAdd(dish, already)}
                                            title={already ? "Remove" : "Add"}>
                                            {already ? "✕" : "+"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════
   Main Component
══════════════════════════════════ */
const PreBooking = ({ handleBack, handleHome }) => {
    const [form, setForm] = useState({
        name: "", mobile: "", email: "", guests: 1,
        date: tomorrowStr(), time: "", slotGroup: "", notes: ""
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [bookingId, setBookingId] = useState("");
    const [selectedDishes, setSelectedDishes] = useState([]);
    const [showDishPopup, setShowDishPopup] = useState(false);

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

    const guestCount = parseInt(form.guests, 10) || 0;
    const isGroupDiscount = guestCount > 8;

    /* Recalculate when guests changes */
    useEffect(() => {
        setSelectedDishes(prev => prev.map(d => ({
            ...d,
            totalPrice: (d.unitPrice || d.price || 0) * Math.max(1, guestCount),
        })));
    }, [guestCount]);

    const subtotal = selectedDishes.reduce((s, d) => s + (d.totalPrice || 0), 0);
    const discount = isGroupDiscount ? Math.round(subtotal * 0.1) : 0;
    const totalAmount = subtotal - discount;

    const setF = (key, val) => {
        setForm(p => ({ ...p, [key]: val }));
        setErrors(p => ({ ...p, [key]: "" }));
    };

    const handleDishAdd = (dish, remove) => {
        if (remove) {
            setSelectedDishes(prev => prev.filter(d => d.id !== dish.id));
        } else {
            const unitPrice = dish.price || 0;
            setSelectedDishes(prev => [...prev, {
                ...dish,
                unitPrice,
                totalPrice: unitPrice * Math.max(1, guestCount),
            }]);
        }
    };

    const existingIds = useMemo(() => new Set(selectedDishes.map(d => d.id)), [selectedDishes]);

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
        if (!selectedDishes.length) err.bag = true;
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
                name: form.name, mobile: form.mobile, email: form.email || "",
                guests: guestCount, date: form.date, time: form.time,
                slotGroup: form.slotGroup || "", notes: form.notes || "",
                items: selectedDishes, subtotal, discount, totalAmount,
                status: "scheduled", source: "User App",
                createdAt: new Date().toISOString(),
            });
            setBookingId(newId.slice(-6).toUpperCase());
            setSubmitted(true);
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
                            ["Guests", guestCount],
                            ["Dishes", selectedDishes.length],
                            ["Total", `₹${totalAmount.toLocaleString()}`],
                        ].map(([k, v]) => (
                            <div key={k} className="pbp-sc-row">
                                <span className="pbp-sc-label">{k}</span>
                                <span className="pbp-sc-val">{v}</span>
                            </div>
                        ))}
                    </div>
                    <button className="pbp-submit-btn" style={{ marginTop: 8, maxWidth: 280 }}
                        onClick={() => { setSubmitted(false); setSelectedDishes([]); setForm({ name: form.name, mobile: form.mobile, email: form.email, guests: 1, date: tomorrowStr(), time: "", slotGroup: "", notes: "" }); }}>
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
                        <div className="section-title">Guest Details</div>
                        <div className="pbp-card">
                            <div className="field-group">
                                <div className="mat">
                                    <input
                                        className={`mat-input${errors.name ? " error" : ""}`}
                                        placeholder=" "
                                        value={form.name}
                                        onChange={e => setF("name", e.target.value)}
                                    />
                                    <label className="mat-label">Name <span className="pbp-req">*</span></label>
                                    <span className="mat-bar" />
                                </div>
                            </div>
                            <div className="mat-row">
                                <div className="field-group" style={{ flex: 1.4 }}>
                                    <div className="mat-input-prefix-wrap">
                                        <div className={`mat-prefix${errors.mobile ? " error" : ""}`}>+91</div>
                                        <div className="mat">
                                            <input
                                                className={`mat-input${errors.mobile ? " error" : ""}`}
                                                placeholder=" "
                                                type="tel"
                                                value={form.mobile}
                                                onChange={e => setF("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                                            />
                                            <label className="mat-label">Mobile <span className="pbp-req">*</span></label>
                                            <span className="mat-bar" />
                                        </div>
                                    </div>

                                </div>
                                <div className="field-group" style={{ flex: 1 }}>
                                    <div className="mat">
                                        <input
                                            className={`mat-input${errors.email ? " error" : ""}`}
                                            placeholder=" "
                                            type="email"
                                            value={form.email}
                                            onChange={e => setF("email", e.target.value)}
                                        />
                                        <label className="mat-label">Email <span className="pbp-opt">(optional)</span></label>
                                        <span className="mat-bar" />
                                    </div>
                                </div>
                            </div>

                            <div className="field-group">
                                <label>Guests <span className="pbp-req">*</span></label>
                                <div className={`stepper-ctrl${errors.guests ? " error" : ""}`}>
                                    <button className="stepper-btn" type="button" onClick={() => setF("guests", Math.max(1, form.guests - 1))}>−</button>
                                    <span className="stepper-val">{form.guests}</span>
                                    <button className="stepper-btn" type="button" onClick={() => setF("guests", Math.min(500, form.guests + 1))}>+</button>
                                </div>
                                {isGroupDiscount && <span className="pbp-discount-note">🎉 Group &gt;8 — 10% off!</span>}
                            </div>
                        </div>

                        {/* NOTES */}
                        <div className="section-title">Note <span className="pbp-opt">(optional)</span></div>

                        <textarea
                            className="pbp-notes"
                            rows={3}
                            placeholder="Special requests, dietary restrictions..."
                            value={form.notes}
                            onChange={e => setF("notes", e.target.value)}
                        />

                    </div>{/* end left col */}

                    {/* ════ RIGHT COLUMN ════ */}
                    <div className="pbp-col">

                        {/* SCHEDULE */}
                        <div className="section-title">Date &amp; Dining Slot</div>
                        <div className="pbp-card">
                            <div className="field-group pbp-schedule-date">
                                <label>Date <span className="pbp-req">*</span></label>
                                <UserDatePicker
                                    value={form.date}
                                    min={tomorrowStr()}
                                    hasError={!!errors.date}
                                    onChange={v => { setF("date", v); setF("time", ""); }}
                                />
                            </div>
                            <div className="field-group pbp-schedule-slots">
                                <label>Dining Slot <span className="pbp-req">*</span></label>
                                <div className="slot-groups">
                                    {SLOT_GROUPS.map(sg => {
                                        const nowH = new Date().getHours();
                                        const slotEndH = parseInt(sg.end.split(":")[0]);
                                        const isPast = form.date === todayStr() && nowH >= slotEndH;
                                        return (
                                            <div key={sg.key}
                                                className={`slot-group${form.slotGroup === sg.key ? " active" : ""}${isPast ? " pbp-slot-disabled" : ""}`}
                                                onClick={() => { if (!isPast) { setF("slotGroup", sg.key); setF("time", ""); } }}>
                                                <span className="slot-group-label">{sg.label}</span>
                                                <span className="slot-group-time">{sg.start} – {sg.end}</span>
                                                {isPast && <span className="slot-group-passed-badge">Passed</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                                {errors.slotGroup && <span className="pbp-field-error">Pick a dining slot</span>}
                            </div>
                            <div className="field-group pbp-schedule-time">
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
                        <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>Pre-Order Foods</span>
                            <button type="button" className="pbp-add-dish-btn" onClick={() => setShowDishPopup(true)}>
                                + Add Dish
                            </button>
                        </div>
                        <div className={`pbp-card${errors.bag ? " pbp-card-error" : ""}`}>
                            {selectedDishes.length === 0 ? (
                                <div className="pbp-empty">
                                    <p>No dishes selected</p>
                                    <span>Click "Add Dish" to pick items</span>
                                </div>
                            ) : (
                                <>
                                    <div className="pbp-items">
                                        {selectedDishes.map((dish, i) => (
                                            <div key={i} className="pbp-item">
                                                <div>
                                                    <span className="pbp-item-name">{dish.name}</span>
                                                    <span className="pbp-item-size"> ₹{dish.unitPrice} × {guestCount}</span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <div className="pbp-item-price">₹{dish.totalPrice?.toLocaleString()}</div>
                                                    <button type="button"
                                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 16, padding: "0 4px" }}
                                                        onClick={() => setSelectedDishes(prev => prev.filter(d => d.id !== dish.id))}>
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        className="pbp-addmore-dish-btn"
                                        onClick={() => setShowDishPopup(true)}
                                    >
                                        + Add More
                                    </button>
                                    <div className="pbp-bill">
                                        <div className="pbp-bill-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                                        {isGroupDiscount && (
                                            <div className="pbp-bill-row pbp-bill-discount">
                                                <span>Group Discount (10%)</span><span>− ₹{discount.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="pbp-bill-row pbp-bill-total">
                                            <span>Total (Pay in Advance)</span><strong>₹{totalAmount.toLocaleString()}</strong>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {errors._submit && (
                            <div className="pbp-submit-error">Something went wrong. Please try again.</div>
                        )}

                        <div className="form-btn-row">
                            <button
                                className={`form-action-btn submit${loading ? " loading" : ""}`}
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                <span className="shadow"></span>
                                <span className="edge"></span>
                                <span className="front">{loading ? "Processing..." : "Confirm Pre Booking"}</span>
                            </button>
                            <button
                                className="form-action-btn cancel"
                                type="button"
                                disabled={loading}
                                onClick={() => {
                                    setForm({ name: "", mobile: "", email: "", guests: 1, date: tomorrowStr(), time: "", slotGroup: "", notes: "" });
                                    setSelectedDishes([]);
                                    setErrors({});
                                    handleBack();
                                }}
                            >
                                <span className="shadow"></span>
                                <span className="edge"></span>
                                <span className="front">Cancel</span>
                            </button>
                        </div>

                    </div>{/* end right col */}

                </div>{/* end grid */}
            </div>

            {/* ADD DISH POPUP */}
            {showDishPopup && (
                <AddDishPopup
                    onClose={() => setShowDishPopup(false)}
                    onAdd={handleDishAdd}
                    existingIds={existingIds}
                    guests={form.guests}
                />
            )}

        </div>
    );
};

export default PreBooking;