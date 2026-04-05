import { useState, useEffect } from "react";
import api from "../api";
import homeIcon from "../assets/icons/home.png";
import "./ReservationForm.css";

const ReservationForm = ({ handleBack, handleHome, foodData }) => {
    const [form, setForm] = useState({
        name: "",
        mobile: "",
        date: "",
        time: "",
        guests: "",
        tableNo: ""
    });

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
                console.error("User fetch failed", err);
            }
        };

        loadUser();
    }, []);

    const today = new Date().toISOString().split("T")[0];
    const tables = (foodData?.tables || []).map(Number);

    useEffect(() => {
        if (tables.length > 0 && !form.tableNo) {
            setForm(prev => ({
                ...prev,
                tableNo: tables[0]
            }));
        }
    }, [tables]);

    const handleChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        if (!form.name || !form.mobile || !form.date || !form.time) {
            alert("Please fill all required fields");
            return;
        }

        if (form.date < today) {
            alert("Please select a valid date");
            return;
        }

        try {
            await api.post("/reservations", {
                id: `res_${Date.now()}`,
                ...form,
                status: "pending"
            });

            alert("Table reserved successfully!");

            // reset form
            setForm({
                name: "",
                mobile: "",
                date: "",
                time: "",
                guests: "",
                tableNo: ""
            });

        } catch (err) {
            console.error(err);
            alert("Failed to reserve table");
        }
    };

    return (
        <div className="rf-page">

            {/* HEADER */}
            <div className="food-header">
                <button className="back-button" onClick={handleBack} />
                <div className="food-list-title">Table Reservation</div>
                <div className="home-btn" onClick={handleHome}>
                    <img src={homeIcon} alt="home" />
                </div>
            </div>

            {/* FORM */}
            <div className="rf-container">

                <div className="rf-section">
                    <div className="rf-section-title">Details</div>

                    <div className="rf-group floating-field">
                        <input
                            placeholder=" "
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                        />
                        <label>Enter Name</label>
                    </div>

                    <div className="rf-group floating-field">
                        <input
                            placeholder=" "
                            type="tel"
                            value={form.mobile}
                            onChange={(e) => handleChange("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        />
                        <label>Enter Mobile Number</label>
                    </div>

                    <div className="rf-row">
                        <div className={`rf-group floating-field ${form.date ? "has-value" : ""}`}>
                            <label>Enter Date</label>
                            <input
                                type="date"
                                min={today}
                                value={form.date}
                                onChange={(e) => handleChange("date", e.target.value)}
                            />
                        </div>

                        <div className={`rf-group floating-field ${form.time ? "has-value" : ""}`}>
                            <label>Enter Time</label>
                            <input
                                type="time"
                                value={form.time}
                                onChange={(e) => handleChange("time", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rf-group floating-field">
                        <input
                            placeholder=" "
                            type="number"
                            value={form.guests}
                            onChange={(e) => handleChange("guests", e.target.value)}
                        />
                        <label>Enter Number of Guests</label>
                    </div>

                </div>

                <div className="rf-section">
                    {/* TABLE SELECT */}
                    <div className="rf-section-title">Select Table</div>

                    <div className="rf-table-grid">
                        {tables.length > 0 ? (
                            tables.sort((a, b) => a - b).map((t) => (
                                <div
                                    key={t}
                                    className={`rf-table ${Number(form.tableNo) === Number(t) ? "active" : ""}`}
                                    onClick={() => handleChange("tableNo", t)}
                                >
                                    Table-{t}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: 10, color: "#888" }}>
                                No tables available
                            </div>
                        )}
                    </div>

                    {/* SUBMIT */}
                    <div className="rf-submit-btn-container" onClick={handleSubmit}>
                        <button className="rf-submit-btn">Confirm Reservation</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationForm;