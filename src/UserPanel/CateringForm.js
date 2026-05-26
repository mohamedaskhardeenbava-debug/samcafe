// user panel
import { useState, useEffect, useMemo } from "react";
import api from "../api";
import { UserDatePicker, todayStr } from "./UserDatePicker";
import { UserTimePicker } from "./UserTimePicker";
import "./CateringForm.css";
import "./ReservationForm.css";

const pad = (n) => String(n).padStart(2, "0");
const tomorrowStr = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; };

const SLOT_GROUPS = [
    { label: "Breakfast", key: "BF", start: "07:00", end: "10:00", icon: "🌅" },
    { label: "Brunch", key: "BR", start: "10:00", end: "12:00", icon: "☀️" },
    { label: "Lunch", key: "LU", start: "12:00", end: "15:00", icon: "🍱" },
    { label: "Hi-Tea", key: "HT", start: "15:00", end: "18:00", icon: "🫖" },
    { label: "Dinner", key: "DI", start: "18:30", end: "22:00", icon: "🌙" },
];

const DECORATION_TIERS = [
    { label: "Normal", value: "normal", price: 1500, desc: "Balloons & basic setup" },
    { label: "Elegant", value: "elegant", price: 3000, desc: "Flowers, drapes & lighting" },
    { label: "Luxury", value: "luxury", price: 5000, desc: "Premium full decor" },
];

const EXTRA_PRICES = {
    cake: 500, specialMention: 0, mic: 500, projector: 800,
    liveMusic: 2000, surpriseGift: 300, candleLight: 800, music: 1500, speaker: 600,
};

const calcExtrasTotal = (form) => {
    let t = 0;
    Object.keys(EXTRA_PRICES).forEach(k => { if (form[k]) t += EXTRA_PRICES[k]; });
    if (form.decoration) {
        const tier = DECORATION_TIERS.find(d => d.value === form.decoration);
        if (tier) t += tier.price;
    }
    return t;
};

/* ══════════════════════════════════
   Add Dish Popup
══════════════════════════════════ */
const AddDishPopup = ({ onClose, onAdd, existingIds, guests }) => {
    const [menuData, setMenuData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeCat, setActiveCat] = useState(null);
    const [vegFilter, setVegFilter] = useState("all"); // "all" | "veg" | "nonveg"
    const [search, setSearch] = useState("");

    useEffect(() => {
        api.get("/categories")
            .then(res => { setMenuData(res.data); setLoading(false); })
            .catch(() => { setMenuData([]); setLoading(false); });
    }, []);

    /* Flatten categories & filter isEventFood === true */
    const { categories, allDishes } = useMemo(() => {
        if (!menuData) return { categories: [], allDishes: [] };
        const rawCats = Array.isArray(menuData) ? menuData : (menuData.categories || []);
        const cats = [];
        const dishes = [];

        rawCats.forEach(topCat => {
            const subs = topCat.subCategories || [];
            if (subs.length > 0) {
                subs.forEach(sub => {
                    const subDishes = (sub.dishes || []).filter(d => d.isEventFood === true);
                    if (subDishes.length > 0) {
                        cats.push({ id: sub.id, name: sub.name, parentName: topCat.name });
                        subDishes.forEach(d => dishes.push({
                            ...d,
                            price: d.basePrice || d.price || 0,
                            categoryId: sub.id,
                            categoryName: sub.name,
                        }));
                    }
                });
            } else {
                const topDishes = (topCat.dishes || []).filter(d => d.isEventFood === true);
                if (topDishes.length > 0) {
                    cats.push({ id: topCat.id, name: topCat.name });
                    topDishes.forEach(d => dishes.push({
                        ...d,
                        price: d.basePrice || d.price || 0,
                        categoryId: topCat.id,
                        categoryName: topCat.name,
                    }));
                }
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
        <div className="ucat-dish-popup-overlay" onClick={onClose}>
            <div className="ucat-dish-popup" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="ucat-dish-popup-header">
                    <h3 className="ucat-dish-popup-title">Add Dish</h3>
                    <button className="ucat-dish-popup-close" onClick={onClose}>✕</button>
                </div>

                {/* Search */}
                <div className="ucat-dish-popup-search-wrap">
                    <input
                        className="ucat-dish-popup-search"
                        placeholder="Search dishes…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Category tabs */}
                {!loading && (
                    <div className="ucat-dish-popup-cats">
                        <button
                            className={`ucat-dish-cat-btn${!activeCat ? " active" : ""}`}
                            onClick={() => setActiveCat(null)}>
                            All
                        </button>
                        {categories.map(c => (
                            <button
                                key={c.id}
                                className={`ucat-dish-cat-btn${activeCat === c.id ? " active" : ""}`}
                                onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}>
                                {c.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Veg / Non-Veg filter */}
                <div className="ucat-dish-popup-veg-row">
                    {["all", "veg", "nonveg"].map(v => (
                        <button key={v}
                            className={`ucat-veg-filter-btn${vegFilter === v ? " active-" + v : ""}`}
                            onClick={() => setVegFilter(v)}>
                            {v === "all" ? "All" : v === "veg" ? "🟢 Veg" : "🔴 Non-Veg"}
                        </button>
                    ))}
                </div>

                {/* Dish grid */}
                <div className="ucat-dish-popup-body">
                    {loading ? (
                        <div className="ucat-dish-popup-loading">Loading dishes…</div>
                    ) : filteredDishes.length === 0 ? (
                        <div className="ucat-dish-popup-empty">
                            {allDishes.length === 0
                                ? "No event food dishes found. Mark dishes as Event Food in the menu."
                                : "No dishes match your filter."}
                        </div>
                    ) : (
                        <div className="ucat-dish-grid">
                            {filteredDishes.map(dish => {
                                const already = existingIds.has(dish.id);
                                const total = dish.price * guestCount;
                                return (
                                    <div key={dish.id} className={`ucat-dish-card${already ? " added" : ""}`}>
                                        {dish.image ? (
                                            <img src={dish.image} alt={dish.name} className="ucat-dish-card-img" />
                                        ) : (
                                            <div className="ucat-dish-card-img ucat-dish-placeholder">🍽️</div>
                                        )}
                                        <div className="ucat-dish-card-body">
                                            <div className="ucat-dish-card-name">{dish.name}</div>
                                            <div className="ucat-dish-card-cat">{dish.categoryName}</div>
                                            <div className="ucat-dish-card-price">
                                                ₹{dish.price}/person
                                                <span className="ucat-dish-card-total"> = ₹{total.toLocaleString()} for {guestCount}</span>
                                            </div>
                                        </div>
                                        <button
                                            className={`ucat-dish-card-btn${already ? " remove" : ""}`}
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
   CheckCard
══════════════════════════════════ */
const CheckCard = ({ label, price, checked, onChange }) => (
    <label className={`ucat-check-card${checked ? " active" : ""}`}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ display: "none" }} />
        <div className="ucat-check-card-title">
            <div>{label}</div>
            {price ? <div style={{ fontSize: 10, color: "#aaa" }}>+₹{price}</div> : null}
        </div>
        {checked && <span className="ucat-check-tick">✓</span>}
    </label>
);

/* ══════════════════════════════════
   Main Component — User Catering Form
══════════════════════════════════ */
const CateringForm = ({ handleBack, handleHome }) => {
    const [form, setForm] = useState({
        name: "", mobile: "", email: "", guests: 20,
        eventDate: "", time: "", slotGroup: "",
        /* Address */
        addrDoorNo: "", addrStreet: "", addrArea: "",
        addrLandmark: "", addrCity: "", addrDistrict: "", addrState: "", addrPincode: "",
        notes: "",
        /* Celebration-style extras */
        decoration: null,
        cake: false, specialMention: false, specialMentionText: "",
        mic: false, projector: false, music: false, speaker: false,
        liveMusic: false, surpriseGift: false, candleLight: false,
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
                const userId = localStorage.getItem("userId");
                if (!userId) return;
                const res = await api.get(`/users/${userId}`);
                setForm(prev => ({
                    ...prev,
                    name: res.data?.name || "",
                    mobile: res.data?.mobile || "",
                    email: res.data?.email || "",
                }));
            } catch (err) { console.error(err); }
        };
        loadUser();
    }, []);

    const guestCount = Math.max(1, parseInt(form.guests, 10) || 1);

    const buildAddress = (f) => [
        f.addrDoorNo, f.addrStreet, f.addrArea,
        f.addrLandmark, f.addrCity, f.addrDistrict, f.addrState, f.addrPincode,
    ].filter(Boolean).join(", ");

    const setF = (key, val) => {
        setForm(p => ({ ...p, [key]: val }));
        setErrors(p => ({ ...p, [key]: "" }));
    };

    /* Recalculate dish totals when guests changes */
    useEffect(() => {
        setSelectedDishes(prev => prev.map(d => ({
            ...d,
            totalPrice: (d.unitPrice || d.price || 0) * guestCount,
        })));
    }, [guestCount]);

    const dishTotal = selectedDishes.reduce((s, d) => s + (d.totalPrice || 0), 0);
    const extrasTotal = calcExtrasTotal(form);
    const totalAmount = dishTotal + extrasTotal;

    const handleDishAdd = (dish, remove) => {
        if (remove) {
            setSelectedDishes(prev => prev.filter(d => d.id !== dish.id));
        } else {
            const unitPrice = dish.price || 0;
            setSelectedDishes(prev => [...prev, {
                ...dish,
                unitPrice,
                totalPrice: unitPrice * guestCount,
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
        if (!form.eventDate) err.eventDate = true;
        if (!form.slotGroup) err.slotGroup = true;
        if (!form.time) err.time = true;
        /* Address — all mandatory */
        if (!form.addrDoorNo.trim()) err.addrDoorNo = true;
        if (!form.addrStreet.trim()) err.addrStreet = true;
        if (!form.addrArea.trim()) err.addrArea = true;
        if (!form.addrCity.trim()) err.addrCity = true;
        if (!form.addrDistrict.trim()) err.addrDistrict = true;
        if (!form.addrState.trim()) err.addrState = true;
        if (!form.addrPincode || form.addrPincode.length !== 6) err.addrPincode = true;
        return err;
    };

    const handleSubmit = async () => {
        const ve = validate();
        if (Object.keys(ve).length > 0) { setErrors(ve); return; }
        try {
            setLoading(true);
            const newId = `cat_${Date.now()}`;
            const address = buildAddress(form);
            await api.post("/cateringOrders", {
                id: newId,
                name: form.name,
                mobile: form.mobile,
                email: form.email || "",
                guests: guestCount,
                date: form.eventDate,
                eventDate: form.eventDate,
                time: form.time,
                slotGroup: form.slotGroup || "",
                location: address,
                addrDoorNo: form.addrDoorNo,
                addrStreet: form.addrStreet,
                addrArea: form.addrArea,
                addrLandmark: form.addrLandmark,
                addrCity: form.addrCity,
                addrDistrict: form.addrDistrict,
                addrState: form.addrState,
                addrPincode: form.addrPincode,
                notes: form.notes || "",
                decoration: form.decoration,
                cake: form.cake, specialMention: form.specialMention,
                specialMentionText: form.specialMentionText,
                mic: form.mic, projector: form.projector,
                music: form.music, speaker: form.speaker,
                liveMusic: form.liveMusic, surpriseGift: form.surpriseGift,
                candleLight: form.candleLight,
                items: selectedDishes,
                dishTotal,
                extrasTotal,
                totalAmount,
                status: "pending",
                source: "User App",
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
                        {form.slotGroup && <div className="ucat-sc-row"><span>Slot</span><strong>{SLOT_GROUPS.find(s => s.key === form.slotGroup)?.label}</strong></div>}
                        <div className="ucat-sc-row"><span>Time</span><strong>{fmtTime(form.time)}</strong></div>
                        <div className="ucat-sc-row"><span>Guests</span><strong>{guestCount}</strong></div>
                        <div className="ucat-sc-row"><span>Dishes Total</span><strong>₹{dishTotal.toLocaleString()}</strong></div>
                        {extrasTotal > 0 && <div className="ucat-sc-row"><span>Extras</span><strong>₹{extrasTotal.toLocaleString()}</strong></div>}
                        <div className="ucat-sc-row"><span>Grand Total</span><strong>₹{totalAmount.toLocaleString()}</strong></div>
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
                        <div className="section-title">Your Details</div>
                        <div className="ucat-card">
                            <div className="field-group" style={{ flex: 1.4 }}>
                                <div className="mat">
                                    <input
                                        className={`mat-input${errors.name ? " error" : ""}`}
                                        placeholder=" "
                                        value={form.name}
                                        onChange={e => setF("name", e.target.value)}
                                    />
                                    <label className="mat-label">Name <span className="ucat-req">*</span></label>
                                    <span className="mat-bar" />
                                </div>
                            </div>


                            <div className="mat-row">
                                <div className="field-group" style={{ flex: 1.4 }}>
                                    <div className="mat-input-prefix-wrap">
                                        <div className="mat-prefix">+91</div>
                                        <div className="mat">
                                            <input
                                                className={`mat-input${errors.mobile ? " error" : ""}`}
                                                placeholder=" "
                                                type="tel"
                                                value={form.mobile}
                                                onChange={e => setF("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                                            />
                                            <label className="mat-label">Mobile <span className="ucat-req">*</span></label>
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
                                        <label className="mat-label">Email <span className="ucat-opt">(optional)</span></label>
                                        <span className="mat-bar" />
                                    </div>
                                </div>
                            </div>

                            <div className="field-group" style={{ flex: 1 }}>
                                <label>Guests <span className="ucat-req">*</span></label>
                                <div className={`stepper-ctrl${errors.guests ? " error" : ""}`}>
                                    <button className="stepper-btn" type="button" onClick={() => setF("guests", Math.max(1, form.guests - 1))}>−</button>
                                    <span className="stepper-val" >{form.guests}</span>
                                    <button className="stepper-btn" type="button" onClick={() => setF("guests", Math.min(10000, form.guests + 1))}>+</button>
                                </div>
                            </div>
                        </div>

                        {/* EVENT DETAILS */}
                        <div className="section-title">Event Details</div>
                        <div className="ucat-card">
                            <div className="field-group">
                                <label>Event Date <span className="ucat-req">*</span></label>
                                <UserDatePicker
                                    value={form.eventDate}
                                    min={tomorrowStr()}
                                    hasError={!!errors.eventDate}
                                    onChange={v => { setF("eventDate", v); setF("time", ""); setF("slotGroup", ""); }}
                                />
                            </div>

                            <div className="field-group">
                                <label>Dining Slot <span className="ucat-req">*</span></label>
                                <div className="slot-groups">
                                    {SLOT_GROUPS.map(sg => (
                                        <button
                                            key={sg.key}
                                            type="button"
                                            className={`slot-group${form.slotGroup === sg.key ? " active" : ""}`}
                                            onClick={() => {
                                                const next = form.slotGroup === sg.key ? "" : sg.key;
                                                setF("slotGroup", next);
                                                setF("time", "");
                                            }}
                                        >
                                            <span className="slot-group-label">{sg.label}</span>
                                            <span className="slot-group-time">{sg.start}–{sg.end}</span>
                                        </button>
                                    ))}
                                </div>
                                {errors.slotGroup && <span className="ucat-field-error">Please select a dining slot</span>}
                            </div>

                            <div className="field-group">
                                <label>
                                    Preferred Time <span className="ucat-req">*</span>
                                    {form.slotGroup && (() => {
                                        const sg = SLOT_GROUPS.find(s => s.key === form.slotGroup);
                                        return sg ? <span className="ucat-slot-hint-inline">{sg.start} – {sg.end}</span> : null;
                                    })()}
                                </label>
                                <UserTimePicker
                                    value={form.time}
                                    hasError={!!errors.time}
                                    onChange={v => setF("time", v)}
                                    slotStart={SLOT_GROUPS.find(s => s.key === form.slotGroup)?.start}
                                    slotEnd={SLOT_GROUPS.find(s => s.key === form.slotGroup)?.end}
                                    disabled={!form.slotGroup}
                                    isToday={false}
                                    placeholder={!form.slotGroup ? "Select a slot first" : undefined}
                                />
                                {!form.slotGroup && (
                                    <span className="ucat-hint">Select a dining slot above to enable time picker</span>
                                )}
                            </div>
                        </div>

                        {/* ADDRESS */}
                        <div className="section-title">Event Address <span className="ucat-req">*</span></div>
                        <div className="ucat-card">
                            <div className="ucat-addr-grid">
                                {[
                                    { key: "addrDoorNo", label: "Door No. / Building", placeholder: "Door / Flat No." },
                                    { key: "addrStreet", label: "Street Name", placeholder: "Street / Road" },
                                    { key: "addrArea", label: "Area / Locality", placeholder: "Area / Colony" },
                                    { key: "addrLandmark", label: "Landmark", placeholder: "Near / Opposite…", optional: true },
                                    { key: "addrCity", label: "City", placeholder: "City" },
                                    { key: "addrDistrict", label: "District", placeholder: "District" },
                                    { key: "addrState", label: "State", placeholder: "State" },
                                    { key: "addrPincode", label: "Pincode", placeholder: "6-digit pincode" },
                                ].map(field => (
                                    <div key={field.key} className="field-group">
                                        <div className="mat">
                                            <input
                                                className={`mat-input${errors[field.key] ? " error" : ""}`}
                                                placeholder=" "
                                                value={form[field.key]}
                                                maxLength={field.key === "addrPincode" ? 6 : undefined}
                                                onChange={e => {
                                                    const v = field.key === "addrPincode"
                                                        ? e.target.value.replace(/\D/g, "").slice(0, 6)
                                                        : e.target.value;
                                                    setF(field.key, v);
                                                }}
                                            />
                                            <label className="mat-label">
                                                {field.label}
                                                {!field.optional
                                                    ? <span className="ucat-req"> *</span>
                                                    : <span className="ucat-opt"> (optional)</span>}
                                            </label>
                                            <span className="mat-bar" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* NOTES */}
                        <div className="section-title">Note <span className="ucat-opt">(optional)</span></div>
                        <div className="ucat-card">
                            <div className="mat-area">
                                <textarea
                                    className="ucat-notes"
                                    rows={3}
                                    placeholder="Special requests, dietary requirements, additional info..."
                                    value={form.notes}
                                    onChange={e => setF("notes", e.target.value)}
                                />
                                <span className="mat-area-bar" />
                            </div>
                        </div>

                    </div>{/* end left col */}

                    {/* ════ RIGHT COLUMN ════ */}
                    <div className="ucat-col">

                        {/* DECORATION */}
                        <div className="section-title">Decoration</div>
                        <div className="ucat-card">
                            <div className="ucat-deco-grid">
                                <button type="button"
                                    className={`ucat-deco-btn${!form.decoration ? " active" : ""}`}
                                    onClick={() => setF("decoration", null)}>
                                    None
                                </button>
                                {DECORATION_TIERS.map(t => (
                                    <button key={t.value} type="button"
                                        className={`ucat-deco-btn${form.decoration === t.value ? " active" : ""}`}
                                        onClick={() => setF("decoration", t.value)}>
                                        <span className="ucat-deco-label">{t.label}</span>
                                        <span className="ucat-deco-price">₹{t.price.toLocaleString()}</span>
                                        <span className="ucat-deco-desc">{t.desc}</span>
                                        {form.decoration === t.value && <span className="ucat-deco-tick">✓</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ADD-ONS */}
                        <div className="section-title">Add-ons & Services</div>
                        <div className="ucat-card">
                            <div className="ucat-check-grid">
                                {[
                                    { key: "cake", label: "Cake", price: 500 },
                                    { key: "specialMention", label: "Special Mention", price: 0 },
                                    { key: "liveMusic", label: "Live Music", price: 2000 },
                                    { key: "surpriseGift", label: "Surprise Gift", price: 300 },
                                    { key: "candleLight", label: "Candle Light", price: 800 },
                                    { key: "mic", label: "Microphone", price: 500 },
                                    { key: "projector", label: "Projector", price: 800 },
                                    { key: "music", label: "Music System", price: 1500 },
                                    { key: "speaker", label: "Speaker", price: 600 },
                                ].map(ex => (
                                    <CheckCard key={ex.key} label={ex.label} price={ex.price}
                                        checked={form[ex.key]} onChange={v => setF(ex.key, v)} />
                                ))}
                            </div>
                            {form.specialMention && (
                                <div className="mat-area" style={{ marginTop: 8 }}>
                                    <textarea
                                        className="ucat-notes"
                                        rows={2}
                                        placeholder="Describe what to announce / mention..."
                                        value={form.specialMentionText}
                                        onChange={e => setF("specialMentionText", e.target.value)}
                                    />
                                    <span className="mat-area-bar" />
                                </div>
                            )}
                        </div>

                        {/* DISHES */}
                        <div className="section-title">
                            Selected Dishes
                            <button type="button" className="chip" onClick={() => setShowDishPopup(true)}>
                                <span className="shadow"></span>
                                <span className="edge"></span>
                                <span className="front">+ Add Dish</span>
                            </button>
                        </div>
                        <div className="ucat-card">
                            {selectedDishes.length === 0 ? (
                                <div className={"ucat-empty ucat-card-error"}>
                                    <p>No dishes selected</p>
                                    <span>Click "Add Dish" to pick event food items</span>
                                </div>
                            ) : (
                                <>
                                    <div className="ucat-items">
                                        {selectedDishes.map((dish, i) => (
                                            <div key={i} className="ucat-item">
                                                <div>
                                                    <span className="ucat-item-name">{dish.name}</span>
                                                    <span className="ucat-item-size"> ₹{dish.unitPrice} × {guestCount} guests</span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <div className="ucat-item-price">₹{dish.totalPrice?.toLocaleString()}</div>
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
                                        className="ucat-addmore-dish-btn"
                                        onClick={() => setShowDishPopup(true)}
                                    >
                                        + Add More
                                    </button>
                                </>
                            )}
                        </div>

                        {/* PRICE SUMMARY */}
                        {(dishTotal > 0 || extrasTotal > 0) && (
                            <div className="ucat-card ucat-bill">
                                {dishTotal > 0 && (
                                    <div className="ucat-bill-row">
                                        <span>Dishes ({selectedDishes.length} × {guestCount} guests)</span>
                                        <span>₹{dishTotal.toLocaleString()}</span>
                                    </div>
                                )}
                                {form.decoration && (
                                    <div className="ucat-bill-row">
                                        <span>Decoration ({DECORATION_TIERS.find(d => d.value === form.decoration)?.label})</span>
                                        <span>₹{DECORATION_TIERS.find(d => d.value === form.decoration)?.price.toLocaleString()}</span>
                                    </div>
                                )}
                                {Object.keys(EXTRA_PRICES).filter(k => form[k] && EXTRA_PRICES[k] > 0).map(k => (
                                    <div key={k} className="ucat-bill-row">
                                        <span style={{ textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</span>
                                        <span>₹{EXTRA_PRICES[k]}</span>
                                    </div>
                                ))}
                                <div className="ucat-bill-row ucat-bill-total">
                                    <span>Grand Total</span>
                                    <strong>₹{totalAmount.toLocaleString()}</strong>
                                </div>
                            </div>
                        )}

                        {/* ERRORS */}
                        {errors._submit && (
                            <div className="ucat-submit-error">Something went wrong. Please try again.</div>
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
                                <span className="front">{loading ? "Submitting..." : "Submit Catering"}</span>
                            </button>
                            <button
                                className="form-action-btn cancel"
                                type="button"
                                disabled={loading}
                                onClick={() => {
                                    setForm({
                                        name: "", mobile: "", email: "", guests: 20,
                                        eventDate: "", time: "", slotGroup: "",
                                        addrDoorNo: "", addrStreet: "", addrArea: "",
                                        addrLandmark: "", addrCity: "", addrDistrict: "", addrState: "", addrPincode: "",
                                        notes: "",
                                        decoration: null,
                                        cake: false, specialMention: false, specialMentionText: "",
                                        mic: false, projector: false, music: false, speaker: false,
                                        liveMusic: false, surpriseGift: false, candleLight: false,
                                    });
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

export default CateringForm;