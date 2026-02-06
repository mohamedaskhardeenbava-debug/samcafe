import "./FloatingBag.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import closeIcon from "../assets/icons/close.png";

const FloatingBag = ({
    bag,
    increaseQty,
    decreaseQty,
    isOpen,
    setIsOpen
}) => {
    const [closing, setClosing] = useState(false);
    const [shake, setShake] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const safeBag = Array.isArray(bag) ? bag : [];

    const groupedBag = Object.values(
        safeBag.reduce((acc, item, index) => {
            const key = [
                item.id,
                item.selectedSize || "",
                item.notes || "",
                item.isCustomized ? "custom" : "normal"
            ].join("__");

            if (!acc[key]) {
                acc[key] = {
                    ...item,
                    indices: [index] // 👈 track original indices
                };
            } else {
                acc[key].quantity += item.quantity;
                acc[key].totalPrice += item.totalPrice;
                acc[key].indices.push(index);
            }

            return acc;
        }, {})
    );

    const totalItems = groupedBag.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const prevCountRef = useRef(totalItems);

    useEffect(() => {
        if (totalItems > prevCountRef.current) {
            setShake(true);

            const timer = setTimeout(() => {
                setShake(false);
            }, 450); // must match animation duration
        }

        prevCountRef.current = totalItems;
    }, [totalItems]);

    if (location.pathname === "/" || location.pathname === "/thank-you")
        return null;

    const getUnitPrice = (item) => {
        if (item.isCombo) {
            return Number(item.perComboFinalPrice || 0);
        }
        return Number(item.unitPrice || 0);
    };

    const getLineTotal = (item) => {
        const unit = getUnitPrice(item);
        const qty = Number(item.quantity || 0);
        return unit * qty;
    };

    const subtotal = groupedBag.reduce(
        (sum, item) => sum + getLineTotal(item),
        0
    );

    const total = Number(subtotal.toFixed(2));

    const closeSheet = () => {
        setClosing(true);
        setTimeout(() => {
            setIsOpen(false)
                ;
            setClosing(false);
        }, 300); // must match CSS animation
    };

    return (
        <>
            {/* Floating pill */}
            <button
                className={`floating-btn ${shake ? "shake" : ""}`}
                onClick={() => setIsOpen(true)}
            >
                🛒 {totalItems}
            </button>

            {isOpen && (
                <div className="bag-overlay" onClick={closeSheet}>
                    <div
                        className={`bag-sheet ${closing ? "closing" : ""}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bag-title-row">
                            <h3>Ordered Dishes</h3>
                            <div
                                className="bag-close"
                                onClick={closeSheet}
                                role="button"
                            >
                                <img src={closeIcon} alt="" className="close-icon" />
                            </div>
                        </div>

                        {/* Items */}
                        <div className="bag-items">
                            {groupedBag.map((item, i) => (
                                <div key={i} className="bag-item-row">
                                    <img src={item.image} alt="" />

                                    <div className="bag-item-info">
                                        <div className="bag-item-name">{item.name}</div>
                                        <div className="bag-item-price">
                                            ₹{getUnitPrice(item).toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="bag-qty">
                                        <button onClick={() => decreaseQty(item.indices[0])}>−</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => increaseQty(item.indices[0])}>+</button>
                                    </div>

                                    <div className="bag-item-total">
                                        ₹{getLineTotal(item).toFixed(2)}
                                    </div>
                                </div>
                            ))}

                            {bag.length === 0 && (
                                <p style={{ textAlign: "center", marginTop: 20 }}>
                                    Your bag is empty
                                </p>
                            )}
                        </div>

                        {/* Summary */}
                        <div className="bag-summary">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>

                            <div className="summary-total">
                                <span>Total ({totalItems} items)</span>
                                <span className="floating-total-price">₹{total}</span>
                            </div>
                        </div>

                        {/* CTA */}
                        <button
                            className="continue-btn"
                            disabled={bag.length === 0}
                            onClick={() => navigate("/thank-you")}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default FloatingBag;