import { useState, useEffect } from "react";
import api from "../api";
import homeIcon from "../assets/icons/home.png";
import "./PreBooking.css";

const PreBooking = ({ bag, setBag, handleBack, handleHome }) => {
    const [form, setForm] = useState({
        name: "",
        mobile: "",
        date: "",
        time: ""
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

        if (!form.mobile || form.mobile.length !== 10) {
            err.mobile = "Valid mobile required";
        }

        if (!form.date) err.date = "Date is required";
        if (!form.time) err.time = "Time is required";

        if (form.date && form.date < today) {
            err.date = "Invalid date";
        }

        if (!safeBag.length) {
            err.bag = "Your bag is empty";
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

            await api.post("/preBookings", {
                id: `pre_${Date.now()}`,
                name: form.name || "Guest",
                mobile: form.mobile || "",
                date: form.date,
                time: form.time,
                items: safeBag,
                totalAmount,
                status: "scheduled",
                createdAt: new Date().toISOString()
            });

            alert("Pre-booking successful!");

            setBag([]);
            setForm(prev => ({
                ...prev,
                date: "",
                time: ""
            }));

        } catch (err) {
            console.error(err);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pbp-page">

            {/* HEADER */}
            <div className="food-header">
                <button className="back-button" onClick={handleBack} />
                <div className="food-list-title">Pre Booking</div>
                <div className="home-btn" onClick={handleHome}>
                    <img src={homeIcon} alt="" />
                </div>
            </div>

            <div className="pbp-container">

                <div className="pbp-card">
                    <div className="pbp-card-title">Customer Details</div>
                    <div className="pbp-group" >
                        <div className="floating-field">
                            <input
                            placeholder=" "
                                value={form.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                            />
                            <label>Enter Name</label>
                            {errors.name && <span className="pbp-error">{errors.name}</span>}
                        </div>

                        <div className="floating-field">
                            <input
                            placeholder=" "
                                value={form.mobile}
                                onChange={(e) => handleChange("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                            />
                            <label>Enter Mobile</label>
                            {errors.mobile && <span className="pbp-error">{errors.mobile}</span>}
                        </div>
                    </div>
                </div>

                {/* SCHEDULE */}
                <div className="pbp-card">
                    <div className="pbp-card-title">Schedule Pickup</div>

                    <div className="pbp-row">
                        <div className="pbp-group" >
                            <div className={`floating-field ${form.date ? "has-value" : ""}`}>
                                <label>Enter Date</label>
                                <input
                                placeholder=" "
                                    type="date"
                                    min={today}
                                    value={form.date}
                                    onChange={(e) => handleChange("date", e.target.value)}
                                />
                                {errors.date && <span className="pbp-error">{errors.date}</span>}
                            </div>

                            <div className={`floating-field ${form.time ? "has-value" : ""}`}>
                                <label>Enter Time</label>
                                <input
                                placeholder=" "
                                    type="time"
                                    value={form.time}
                                    onChange={(e) => handleChange("time", e.target.value)}
                                />
                                {errors.time && <span className="pbp-error">{errors.time}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BAG PREVIEW */}
                <div className="pbp-card">
                    <div className="pbp-card-title">Your Order</div>

                    {!safeBag.length ? (
                        <div className="pbp-empty">
                            <p>No items selected</p>
                            <span>Add items from menu</span>
                        </div>
                    ) : (
                        <>
                            <div className="pbp-items">
                                {safeBag.map((item, i) => (
                                    <div key={i} className="pbp-item">
                                        <div className="pbp-item-left">
                                            <span className="pbp-item-name">{item.name}</span>
                                            {item.selectedSize && (
                                                <span className="pbp-item-size">
                                                    {item.selectedSize} X {item.quantity}
                                                </span>
                                            )}
                                        </div>

                                        <div className="pbp-item-price">
                                            ₹{item.totalPrice}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pbp-total">
                                <span>Total</span>
                                <strong>₹{totalAmount}</strong>
                            </div>
                        </>
                    )}

                    {errors.bag && <span className="pbp-error">{errors.bag}</span>}
                </div>

                {/* SUBMIT */}
                <div className="pbp-submit-container">
                    <button
                        className={`pbp-submit ${loading ? "loading" : ""}`}
                        onClick={handleSubmit}
                    >
                        {loading ? "Processing..." : "Confirm Pre Booking"}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PreBooking;