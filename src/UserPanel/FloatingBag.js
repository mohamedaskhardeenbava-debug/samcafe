import "./FloatingBag.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import closeIcon from "../assets/icons/close.png";
import { placeOrder } from "./placeOrder.js";
import PrinterReceipt from "../components/PrinterReceipt.js";
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
    const [orderForReceipt, setOrderForReceipt] = useState(null);

    const groupedBag = Object.values(
        safeBag.reduce((acc, item, index) => {
            const key = item.isCombo
                ? `${item.id}__${JSON.stringify(item.comboItems)}`
                : [
                    item.id,
                    item.customizationKey || "",
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
        }

        prevCountRef.current = totalItems;
    }, [totalItems]);

    if (location.pathname === "/" || location.pathname === "/thank-you" || location.pathname === "/scan-table")
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

    const minimizeSheet = () => {
        setClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setClosing(false);
        }, 250);
    };

    return (
        <>
            {/* Floating pill */}
            <button
                id="floating-bag-btn"
                className={`floating-btn ${shake ? "shake" : ""}`}
                onClick={() => setIsOpen(true)}
            >
                <span className="shadow"></span>
                <span className="edge"></span>
                <span className="front">🛒 {totalItems}</span>
            </button>

            {isOpen && (
                <div className={`bag-sheet ${closing ? "closing" : ""}`}>
                    {/* Header */}
                    <div className="bag-title-row">
                        <h3>Ordered Dishes</h3>
                        <div
                            className="view-btn"
                            onClick={minimizeSheet}
                            role="button"
                        >
                            <span className="shadow"></span>
                            <span className="edge"
                                style={{
                                    background: `linear-gradient(
      to left,
      var(--edge-color-dark) 0%,
      var(--edge-color-light) 8%,
      var(--edge-color-light) 92%,
      var(--edge-color-dark) 100%
    )`,
                                }}
                            ></span>
                            <span className="front" style={{ backgroundColor: "var(--color-red)" }}><img src={closeIcon} alt="" className="close-icon" style={{ filter: "var(--invert-filter)" }} /></span>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bag-items" id="bag-items-container">
                        {groupedBag.map((item, i) => (
                            <div
                                key={`${item.id}__${item.customizationKey || "base"}__${item.selectedSize}`}
                                className="bag-item-row"
                                data-dish-id={item.id}
                                data-custom-key={item.customizationKey || ""}
                            >
                                <img
                                    src={item.image}
                                    alt=""
                                    className={item.__pendingImage ? "pending-img" : "visible-img"}
                                />

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
                        onClick={async () => {
                            try {
                                const newOrder = await placeOrder(bag);
                                setIsOpen(false);
                                setOrderForReceipt(newOrder);   // 👈 show printer
                            } catch (err) {
                                console.error(err);
                                alert("Failed to place order");
                            }
                        }}
                    >
                        <span className="shadow" />
                        <span className="edge" />
                        <span className="front">
                            Place Order
                        </span>
                    </button>
                </div>
            )}
            {orderForReceipt && (
                <PrinterReceipt
                    order={orderForReceipt}
                    onDone={() => {
                        setOrderForReceipt(null);
                        navigate("/thank-you", { replace: true });
                    }}
                />
            )}
        </>
    );
};

export default FloatingBag;