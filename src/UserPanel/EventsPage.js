import React, { useState, useEffect } from "react";
import "./EventsPage.css";
import api from "../api";

// ─── helpers ───────────────────────────────────────────────────────────────
const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
        weekday: "short", day: "2-digit", month: "short", year: "numeric",
    });
};

const isPast = (iso) => iso && new Date(iso) < new Date();

const TYPE_EMOJI = {
    dining: "🍽️",
    special: "🎊",
    private: "🔒",
    seasonal: "🌿",
    live: "🎵",
    workshop: "👨‍🍳",
};

const TYPE_LABEL = {
    dining: "Dining Experience",
    special: "Special Occasion",
    private: "Private Booking",
    seasonal: "Seasonal Special",
    live: "Live Entertainment",
    workshop: "Workshop",
};

// ─── Main Component ─────────────────────────────────────────────────────────
const EventsPage = ({ handleBack, handleHome, currentUser }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);  // event detail view
    const [showEnroll, setShowEnroll] = useState(false);       // enroll modal
    const [filterType, setFilterType] = useState("all");
    const [submitState, setSubmitState] = useState("idle");    // idle | loading | success | error
    const [errorMsg, setErrorMsg] = useState("");
    const [myBookings, setMyBookings] = useState([]);

    const [form, setForm] = useState({
        name: currentUser?.name || "",
        email: currentUser?.email || "",
        phone: currentUser?.phone || "",
        guests: 1,
        specialRequests: "",
    });

    // ── load events ──
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get("/events");
                setEvents((res.data || []).filter((e) => e.isPublished));
            } catch (err) {
                console.error("Failed to load events:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    // ── load user's bookings ──
    useEffect(() => {
        if (!currentUser?.id) return;
        const fetchMyBookings = async () => {
            try {
                const res = await api.get("/eventBookings");
                setMyBookings(
                    (res.data || []).filter((b) => b.userId === currentUser.id)
                );
            } catch (err) {
                console.warn("Could not load bookings:", err);
            }
        };
        fetchMyBookings();
    }, [currentUser]);

    // ── derived ──
    const filteredEvents = events.filter(
        (e) => filterType === "all" || e.eventType === filterType
    );

    const isBooked = (eventId) => myBookings.some((b) => b.eventId === eventId && b.status !== "cancelled");

    const bookedForEvent = (eventId) => myBookings.find((b) => b.eventId === eventId && b.status !== "cancelled");

    const spotsLeft = (evt) => {
        if (!evt.maxCapacity) return null;
        const confirmed = 0; // in a real app fetch from aggregation; admin manages this
        return Math.max(0, evt.maxCapacity - confirmed);
    };

    // ── enroll submit ──
    const handleEnroll = async () => {
        if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
            setErrorMsg("Please fill in all required fields.");
            return;
        }
        setErrorMsg("");
        setSubmitState("loading");
        try {
            const payload = {
                id: `bk_${Date.now()}`,
                eventId: selectedEvent.id,
                userId: currentUser?.id || null,
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                guests: Number(form.guests) || 1,
                specialRequests: form.specialRequests.trim(),
                totalAmount: (Number(form.guests) || 1) * (Number(selectedEvent.price) || 0),
                status: "pending",
                bookedAt: new Date().toISOString(),
            };
            const res = await api.post("/eventBookings", payload);
            setMyBookings((p) => [...p, res.data]);
            setSubmitState("success");
        } catch (err) {
            console.error(err);
            setSubmitState("error");
            setErrorMsg("Booking failed. Please try again.");
        }
    };

    const openEnroll = (evt) => {
        setSelectedEvent(evt);
        setForm({
            name: currentUser?.name || "",
            email: currentUser?.email || "",
            phone: currentUser?.phone || "",
            guests: 1,
            specialRequests: "",
        });
        setSubmitState("idle");
        setErrorMsg("");
        setShowEnroll(true);
    };

    const closeEnroll = () => {
        setShowEnroll(false);
        setSubmitState("idle");
        setErrorMsg("");
    };

    // ── unique event types for filter ──
    const availableTypes = [...new Set(events.map((e) => e.eventType))];

    // ── render ──
    return (
        <div className="ep-page">
            {/* ── Top Bar ── */}
            <div className="ep-topbar">
                <button className="back-button" onClick={handleBack} aria-label="Back">
                </button>
                <div>
                    <h1 className="ep-page-title">Events</h1>
                    <p className="ep-page-sub">Reserve your spot at our special experiences</p>
                </div>
            </div>

            {/* ── Type Filter Scrollable ── */}
            <div className="ep-filter-scroll">
                <button
                    className={`ep-filter-chip ${filterType === "all" ? "active" : ""}`}
                    onClick={() => setFilterType("all")}
                >
                    🎉 All
                </button>
                {availableTypes.map((t) => (
                    <button
                        key={t}
                        className={`ep-filter-chip ${filterType === t ? "active" : ""}`}
                        onClick={() => setFilterType(t)}
                    >
                        {TYPE_EMOJI[t] || "✦"} {TYPE_LABEL[t] || t}
                    </button>
                ))}
            </div>

            {/* ── My Bookings Strip ── */}
            {myBookings.length > 0 && (
                <div className="ep-my-bookings-strip">
                    <p className="ep-strip-title">📌 My Bookings</p>
                    <div className="ep-strip-scroll">
                        {myBookings.map((b) => {
                            const evt = events.find((e) => e.id === b.eventId);
                            return (
                                <div key={b.id} className={`ep-strip-card ep-strip-${b.status}`}>
                                    <span className="ep-strip-evt">{evt?.title || "Event"}</span>
                                    <span className="ep-strip-guests">👥 {b.guests}</span>
                                    <span className={`ep-strip-status ep-strip-status-${b.status}`}>
                                        {b.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Events List ── */}
            {loading ? (
                <div className="ep-loading">
                    <div className="ep-spinner" />
                    <p>Loading events…</p>
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="ep-empty">
                    <div className="ep-empty-icon">🎪</div>
                    <p>No events available right now.</p>
                    <p className="ep-empty-sub">Check back soon for upcoming experiences!</p>
                </div>
            ) : (
                <div className="ep-events-list">
                    {filteredEvents.map((evt) => {
                        const booked = isBooked(evt.id);
                        const past = isPast(evt.date);
                        return (
                            <div
                                key={evt.id}
                                className={`ep-event-card ${past ? "ep-past" : ""}`}
                                onClick={() => setSelectedEvent(evt)}
                            >
                                {/* Image */}
                                <div className="ep-card-image">
                                    {evt.image ? (
                                        <img src={evt.image} alt={evt.title} />
                                    ) : (
                                        <div className="ep-card-placeholder">{TYPE_EMOJI[evt.eventType] || "🎉"}</div>
                                    )}
                                    <span className="ep-card-type-badge">
                                        {TYPE_EMOJI[evt.eventType]} {TYPE_LABEL[evt.eventType] || evt.eventType}
                                    </span>
                                    {booked && <span className="ep-booked-ribbon">✓ Booked</span>}
                                    {past && <span className="ep-past-ribbon">Ended</span>}
                                </div>

                                {/* Body */}
                                <div className="ep-card-body">
                                    <h3 className="ep-card-title">{evt.title}</h3>
                                    <p className="ep-card-desc">{evt.description}</p>

                                    <div className="ep-card-meta">
                                        <span>📅 {formatDate(evt.date)}</span>
                                        {evt.time && <span>⏰ {evt.time}</span>}
                                        {evt.venue && <span>📍 {evt.venue}</span>}
                                    </div>

                                    {evt.highlights?.length > 0 && (
                                        <div className="ep-highlights">
                                            {evt.highlights.slice(0, 3).map((h, i) => (
                                                <span key={i} className="ep-highlight-chip">✓ {h}</span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="ep-card-footer">
                                        <span className="ep-price">
                                            {!evt.price || evt.price === 0
                                                ? <span className="ep-free">Free</span>
                                                : `₹${Number(evt.price).toLocaleString("en-IN")}/person`}
                                        </span>
                                        {!past && (
                                            booked ? (
                                                <button
                                                    className="ep-booked-btn"
                                                    onClick={(e) => { e.stopPropagation(); }}
                                                >
                                                    ✓ Enrolled
                                                </button>
                                            ) : (
                                                <button
                                                    className="ep-enroll-btn"
                                                    onClick={(e) => { e.stopPropagation(); openEnroll(evt); }}
                                                >
                                                    Enroll Now
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

            {/* ══════════════ EVENT DETAIL SHEET ══════════════ */}
            {selectedEvent && !showEnroll && (
                <div className="ep-sheet-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="ep-sheet" onClick={(e) => e.stopPropagation()}>
                        <button className="ep-sheet-close" onClick={() => setSelectedEvent(null)}>✕</button>

                        {selectedEvent.image && (
                            <div className="ep-sheet-image">
                                <img src={selectedEvent.image} alt={selectedEvent.title} />
                            </div>
                        )}

                        <div className="ep-sheet-body">
                            <div className="ep-sheet-type">
                                {TYPE_EMOJI[selectedEvent.eventType]} {TYPE_LABEL[selectedEvent.eventType] || selectedEvent.eventType}
                            </div>
                            <h2 className="ep-sheet-title">{selectedEvent.title}</h2>
                            <p className="ep-sheet-desc">{selectedEvent.description}</p>

                            <div className="ep-sheet-meta-grid">
                                <div className="ep-sheet-meta-item">
                                    <span className="ep-meta-icon">📅</span>
                                    <div>
                                        <div className="ep-meta-label">Date</div>
                                        <div className="ep-meta-val">{formatDate(selectedEvent.date)}</div>
                                    </div>
                                </div>
                                {selectedEvent.time && (
                                    <div className="ep-sheet-meta-item">
                                        <span className="ep-meta-icon">⏰</span>
                                        <div>
                                            <div className="ep-meta-label">Time</div>
                                            <div className="ep-meta-val">{selectedEvent.time}</div>
                                        </div>
                                    </div>
                                )}
                                {selectedEvent.venue && (
                                    <div className="ep-sheet-meta-item">
                                        <span className="ep-meta-icon">📍</span>
                                        <div>
                                            <div className="ep-meta-label">Venue</div>
                                            <div className="ep-meta-val">{selectedEvent.venue}</div>
                                        </div>
                                    </div>
                                )}
                                <div className="ep-sheet-meta-item">
                                    <span className="ep-meta-icon">💰</span>
                                    <div>
                                        <div className="ep-meta-label">Price</div>
                                        <div className="ep-meta-val">
                                            {!selectedEvent.price || selectedEvent.price === 0
                                                ? "Free"
                                                : `₹${Number(selectedEvent.price).toLocaleString("en-IN")} / person`}
                                        </div>
                                    </div>
                                </div>
                                {selectedEvent.maxCapacity > 0 && (
                                    <div className="ep-sheet-meta-item">
                                        <span className="ep-meta-icon">👥</span>
                                        <div>
                                            <div className="ep-meta-label">Capacity</div>
                                            <div className="ep-meta-val">{selectedEvent.maxCapacity} seats</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedEvent.highlights?.length > 0 && (
                                <div className="ep-sheet-highlights">
                                    <h4>What's Included</h4>
                                    <div className="ep-highlights-list">
                                        {selectedEvent.highlights.map((h, i) => (
                                            <div key={i} className="ep-highlight-row">
                                                <span className="ep-highlight-check">✓</span>
                                                <span>{h}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedEvent.tags?.length > 0 && (
                                <div className="ep-sheet-tags">
                                    {selectedEvent.tags.map((t, i) => (
                                        <span key={i} className="ep-tag">{t}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Bottom Action */}
                        <div className="ep-sheet-cta">
                            {isPast(selectedEvent.date) ? (
                                <button className="ep-cta-btn ep-cta-disabled" disabled>Event Ended</button>
                            ) : isBooked(selectedEvent.id) ? (
                                <div className="ep-cta-booked">
                                    <span>✓ You're enrolled!</span>
                                    <span className="ep-cta-booking-id">
                                        Booking #{bookedForEvent(selectedEvent.id)?.id?.slice(-6)}
                                    </span>
                                </div>
                            ) : (
                                <button className="ep-cta-btn" onClick={() => openEnroll(selectedEvent)}>
                                    Enroll for this Event
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════ ENROLL MODAL ══════════════ */}
            {showEnroll && selectedEvent && (
                <div className="ep-sheet-overlay" onClick={closeEnroll}>
                    <div className="ep-enroll-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="ep-sheet-close" onClick={closeEnroll}>✕</button>

                        {submitState === "success" ? (
                            <div className="ep-success-screen">
                                <div className="ep-success-icon">🎉</div>
                                <h3>You're enrolled!</h3>
                                <p>
                                    We've received your booking for <strong>{selectedEvent.title}</strong>.
                                    We'll confirm it shortly.
                                </p>
                                <div className="ep-success-detail">
                                    <span>📅 {formatDate(selectedEvent.date)}</span>
                                    {selectedEvent.time && <span>⏰ {selectedEvent.time}</span>}
                                </div>
                                {(Number(selectedEvent.price) || 0) > 0 && (
                                    <p className="ep-success-amount">
                                        Total: ₹{(Number(form.guests) * Number(selectedEvent.price)).toLocaleString("en-IN")}
                                    </p>
                                )}
                                <button className="ep-cta-btn" onClick={() => { closeEnroll(); setSelectedEvent(null); }}>
                                    Back to Events
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="ep-enroll-header">
                                    <h3>Enroll for Event</h3>
                                    <p className="ep-enroll-sub">{selectedEvent.title}</p>
                                </div>

                                <div className="ep-enroll-body">
                                    {/* Guest count + Price preview */}
                                    {(Number(selectedEvent.price) || 0) > 0 && (
                                        <div className="ep-price-preview">
                                            <span>₹{Number(selectedEvent.price).toLocaleString("en-IN")} × {form.guests} guest(s)</span>
                                            <span className="ep-price-total">
                                                = ₹{(Number(form.guests) * Number(selectedEvent.price)).toLocaleString("en-IN")}
                                            </span>
                                        </div>
                                    )}

                                    <div className="ep-form-field">
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div className="ep-form-field">
                                        <label>Email *</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                    <div className="ep-form-field">
                                        <label>Phone *</label>
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                                            placeholder="+91 XXXXX XXXXX"
                                        />
                                    </div>
                                    <div className="ep-form-field">
                                        <label>Number of Guests</label>
                                        <div className="ep-guests-row">
                                            <button
                                                type="button"
                                                className="ep-qty-btn"
                                                onClick={() => setForm((p) => ({ ...p, guests: Math.max(1, p.guests - 1) }))}
                                            >−</button>
                                            <span className="ep-qty-val">{form.guests}</span>
                                            <button
                                                type="button"
                                                className="ep-qty-btn"
                                                onClick={() => {
                                                    const max = selectedEvent.maxCapacity || 20;
                                                    setForm((p) => ({ ...p, guests: Math.min(max, p.guests + 1) }));
                                                }}
                                            >+</button>
                                        </div>
                                    </div>
                                    <div className="ep-form-field">
                                        <label>Special Requests (optional)</label>
                                        <textarea
                                            value={form.specialRequests}
                                            rows={3}
                                            onChange={(e) => setForm((p) => ({ ...p, specialRequests: e.target.value }))}
                                            placeholder="Dietary restrictions, seating preferences…"
                                        />
                                    </div>

                                    {errorMsg && <p className="ep-error-msg">{errorMsg}</p>}
                                </div>

                                <div className="ep-enroll-footer">
                                    <button
                                        className="ep-cta-btn"
                                        onClick={handleEnroll}
                                        disabled={submitState === "loading"}
                                    >
                                        {submitState === "loading" ? "Submitting…" : "Confirm Enrollment"}
                                    </button>
                                    <button className="ep-cancel-btn" onClick={closeEnroll}>Cancel</button>
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