import { useState, useEffect } from "react";
import api from "../api";
import homeIcon from "../assets/icons/home.png";
import "./CateringForm.css";

const CateringForm = ({ bag, setBag, handleBack, handleHome }) => {
    const [form, setForm] = useState({
        name: "",
        mobile: "",
        eventDate: "",
        guests: "",
        location: "",
        notes: ""
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

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
            } catch (err) {
                console.error(err);
            }
        };

        loadUser();
    }, []);

    const today = new Date().toISOString().split("T")[0];

    const safeBag = bag || [];

    const totalAmount = safeBag.reduce(
        (sum, item) => sum + Number(item.totalPrice || 0),
        0
    );

    const handleChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setErrors(prev => ({ ...prev, [key]: "" }));
    };

    const validate = () => {
        const err = {};

        if (!form.name) err.name = "Name is required";
        if (!form.mobile) err.mobile = "Mobile is required";
        if (!form.eventDate) err.eventDate = "Event date is required";

        if (form.eventDate && form.eventDate < today) {
            err.eventDate = "Invalid date";
        }

        if (form.guests && Number(form.guests) <= 0) {
            err.guests = "Invalid guest count";
        }

        return err;
    };

    const handleSubmit = async () => {
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setLoading(true);

            await api.post("/cateringOrders", {
                id: `cat_${Date.now()}`,
                ...form,
                items: safeBag,
                totalAmount,
                status: "pending",
                createdAt: new Date().toISOString()
            });

            alert("Catering request submitted!");

            setForm({
                name: "",
                mobile: "",
                eventDate: "",
                guests: "",
                location: "",
                notes: ""
            });

        } catch (err) {
            console.error(err);
            alert("Failed to submit");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cfp-page">

            {/* HEADER */}
            <div className="food-header">
                <button className="back-button" onClick={handleBack} />
                <div className="food-list-title">Catering Order</div>
                <div className="home-btn" onClick={handleHome}>
                    <img src={homeIcon} alt="" />
                </div>
            </div>

            <div className="cfp-container">

                <div className="cfp-section">
                    {/* CUSTOMER */}
                    <div className="cfp-card">
                        <div className="cfp-title">Customer Details</div>
                        <div className="cfp-group">
                            <div className="floating-field">
                                <input
                                    placeholder=" "
                                    value={form.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                />
                                <label>Enter Name</label>
                                {errors.name && <span className="cfp-error">{errors.name}</span>}
                            </div>

                            <div className="floating-field">
                                <input
                                    placeholder=" "
                                    type="tel"
                                    value={form.mobile}
                                    onChange={(e) => handleChange("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                                />
                                <label>Enter Mobile</label>
                                {errors.mobile && <span className="cfp-error">{errors.mobile}</span>}
                            </div>
                        </div>
                    </div>

                    {/* EVENT */}
                    <div className="cfp-card">
                        <div className="cfp-title">Event Details</div>
                        <div className="cfp-group">
                            <div className={`floating-field ${form.eventDate ? "has-value" : ""}`}>
                                <label>Enter Event Date</label>
                                <input
                                    type="date"
                                    min={today}
                                    value={form.eventDate}
                                    onChange={(e) => handleChange("eventDate", e.target.value)}
                                />
                                {errors.eventDate && <span className="cfp-error">{errors.eventDate}</span>}
                            </div>

                            <div className="floating-field">
                                <input
                                    placeholder=" "
                                    type="number"
                                    value={form.guests}
                                    onChange={(e) => handleChange("guests", e.target.value)}
                                />
                                <label>Enter Guests</label>
                                {errors.guests && <span className="cfp-error">{errors.guests}</span>}
                            </div>

                            <div className="floating-field">
                                <textarea
                                    placeholder=" "
                                    value={form.location}
                                    onChange={(e) => handleChange("location", e.target.value)}
                                />
                                <label>Enter Location</label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="cfp-section">

                    {/* ORDERS */}
                    <div className="cfp-card">
                        <div className="cfp-title">Your Order</div>

                        {!safeBag.length ? (
                            <div className="cfp-empty">
                                <p>No items selected</p>
                                <span>Add items from menu</span>
                            </div>
                        ) : (
                            <>
                                <div className="cfp-items">
                                    {safeBag.map((item, i) => (
                                        <div key={i} className="cfp-item">
                                            <div className="cfp-item-left">
                                                <span className="cfp-item-name">{item.name}</span>
                                                {item.selectedSize && (
                                                    <span className="cfp-item-size">
                                                        {item.selectedSize} X {item.quantity}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="cfp-item-price">
                                                ₹{item.totalPrice}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="cfp-total">
                                    <span>Total</span>
                                    <strong>₹{totalAmount}</strong>
                                </div>
                            </>
                        )}
                    </div>

                    {/* NOTES */}
                    <div className="cfp-card">
                        <div className="cfp-title">Additional Notes</div>

                        <div className="cfp-group floating-field">
                            <textarea
                                placeholder=" "
                                value={form.notes}
                                onChange={(e) => handleChange("notes", e.target.value)}
                            />
                            <label htmlFor="">Special Requirements(if any)</label>
                        </div>
                    </div>

                    {/* SUBMIT */}
                    <div className="cfp-submit-container">
                        <button
                            className={`cfp-submit ${loading ? "loading" : ""}`}
                            onClick={handleSubmit}
                        >
                            {loading ? "Submitting..." : "Submit Catering Request"}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CateringForm;