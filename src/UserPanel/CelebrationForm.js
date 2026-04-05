import { useState, useEffect } from "react";
import api from "../api";
import homeIcon from "../assets/icons/home.png";
import "./CelebrationForm.css";

const CelebrationForm = ({ handleBack, handleHome }) => {
    const [form, setForm] = useState({
        type: "birthday",
        name: "",
        mobile: "",
        date: "",
        time: "",
        guests: "",
        cake: false,
        decoration: false,
        specialNote: ""
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const [openDropdown, setOpenDropdown] = useState(false);

    const options = [
        { label: "Birthday", value: "birthday" },
        { label: "Candle Light Dinner", value: "candle" }
    ];

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

    useEffect(() => {
        const close = () => setOpenDropdown(false);
        window.addEventListener("click", close);
        return () => window.removeEventListener("click", close);
    }, []);

    const today = new Date().toISOString().split("T")[0];

    const handleChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setErrors(prev => ({ ...prev, [key]: "" }));
    };

    const validate = () => {
        const err = {};

        if (!form.name) err.name = "Name required";
        if (!form.mobile) err.mobile = "Mobile required";
        if (!form.date) err.date = "Date required";
        if (!form.time) err.time = "Time required";

        if (form.date && form.date < today) {
            err.date = "Invalid date";
        }

        if (Number(form.guests) <= 0) {
            err.guests = "Guests must be > 0";
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

            await api.post("/celebrations", {
                id: `cele_${Date.now()}`,
                ...form,
                status: "pending",
                createdAt: new Date().toISOString()
            });

            alert("Celebration booked!");

            setForm({
                type: "birthday",
                name: "",
                mobile: "",
                date: "",
                time: "",
                guests: "",
                cake: false,
                decoration: false,
                specialNote: ""
            });

        } catch (err) {
            console.error(err);
            alert("Failed to submit");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="clp-page">

            {/* HEADER */}
            <div className="food-header">
                <button className="back-button" onClick={handleBack} />
                <div className="food-list-title">Celebration</div>
                <div className="home-btn" onClick={handleHome}>
                    <img src={homeIcon} alt="" />
                </div>
            </div>

            <div className="clp-container">

                {/* TYPE */}
                <div className="clp-section">
                    <div className="section">
                        <div className="clp-title">Event Type</div>
                        <div className="clp-card">
                            <div className="clp-group floating-field">
                                <div className="custom-dropdown">
                                    <div
                                        className={`dropdown-selected ${openDropdown ? "open" : ""}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdown(prev => !prev);
                                        }}
                                    >
                                        {options.find(o => o.value === form.type)?.label}
                                    </div>

                                    <div className={`dropdown-menu ${openDropdown ? "open" : ""}`}>
                                        {options.map(opt => (
                                            <div
                                                key={opt.value}
                                                className="dropdown-item"
                                                onClick={() => {
                                                    handleChange("type", opt.value);
                                                    setOpenDropdown(false);
                                                }}
                                            >
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DETAILS */}
                    <div className="section">
                        <div className="clp-title">Details</div>
                        <div className="clp-card">

                            <div className="clp-group floating-field">
                                <input
                                    placeholder=" "
                                    value={form.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                />
                                <label>Enter Name</label>
                                {errors.name && <span className="clp-error">{errors.name}</span>}
                            </div>

                            <div className="clp-group floating-field">
                                <input
                                    placeholder=" "
                                    value={form.mobile}
                                    onChange={(e) => handleChange("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                                />
                                <label>Enter Mobile</label>
                                {errors.mobile && <span className="clp-error">{errors.mobile}</span>}
                            </div>

                            <div className="clp-row">
                                <div className={`clp-group floating-field ${form.date ? "has-value" : ""}`}>
                                    <label>Enter Date</label>
                                    <input
                                        type="date"
                                        min={today}
                                        value={form.date}
                                        onChange={(e) => handleChange("date", e.target.value)}
                                    />
                                    {errors.date && <span className="clp-error">{errors.date}</span>}
                                </div>

                                <div className={`clp-group floating-field ${form.time ? "has-value" : ""}`}>
                                    <label>Enter Time</label>
                                    <input
                                        type="time"
                                        value={form.time}
                                        onChange={(e) => handleChange("time", e.target.value)}
                                    />
                                    {errors.time && <span className="clp-error">{errors.time}</span>}
                                </div>
                            </div>

                            <div className="clp-group floating-field">
                                <input
                                    placeholder=" "
                                    type="number"
                                    value={form.guests}
                                    onChange={(e) => handleChange("guests", e.target.value)}
                                />
                                <label>Enter Guests</label>
                                {errors.guests && <span className="clp-error">{errors.guests}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="clp-section">
                    <div className="section">
                        <div className="clp-title">Extras</div>
                        {/* EXTRAS */}
                        <div className="clp-card">

                            <label>
                                <input
                                    type="checkbox"
                                    checked={form.cake}
                                    onChange={(e) => handleChange("cake", e.target.checked)}
                                />
                                Cake
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={form.decoration}
                                    onChange={(e) => handleChange("decoration", e.target.checked)}
                                />
                                Decoration
                            </label>
                        </div>
                    </div>

                    {/* NOTES */}
                    <div className="section">
                        <div className="clp-title">Special Notes</div>
                        <div className="clp-card">
                            <div className="floating-field">
                                <label htmlFor="">Enter Special Notes(if any)</label>
                                <textarea
                                    value={form.specialNote}
                                    onChange={(e) => handleChange("specialNote", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SUBMIT */}
                    <div className="clp-submit-container">
                        <button
                            className={`clp-submit ${loading ? "loading" : ""}`}
                            onClick={handleSubmit}
                        >
                            {loading ? "Processing..." : "Book Celebration"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CelebrationForm;