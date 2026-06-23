import "./PrinterReceipt.css";
import { useRef } from "react";

const LETTERS = "Printing...".split("");

const PrinterReceipt = ({ order, onDone }) => {
    const overlayRef = useRef(null);

    const handleDone = () => {
        if (overlayRef.current) overlayRef.current.classList.add("pr-hiding");
        setTimeout(onDone, 420);
    };

    if (!order) return null;

    const {
        id,
        tableNo,
        mode,
        date,
        time,
        userName,
        items = [],
        totalAmount,
        totalWithGST,
    } = order;

    const formattedDate = date
        ? (() => {
            const d = new Date(date);
            return isNaN(d) ? date : d.toLocaleDateString("en-GB");
        })()
        : new Date().toLocaleDateString("en-GB");

    const subTotal = totalWithGST?.subTotal ?? totalAmount ?? 0;
    const cgst = totalWithGST?.cgst ?? 0;
    const sgst = totalWithGST?.sgst ?? 0;
    const total = totalWithGST?.total ?? totalAmount ?? 0;

    return (
        <div className="pr-overlay" ref={overlayRef}>
            <div className="pr-body">
                <div className="pr-slide-in">

                    {/* ── Printer + Receipt ── */}
                    <div className="wrapper printing">

                        <div className="printer" />

                        <div className="printer-display">
                            <span className="printer-message">Click to print</span>
                            <div className="letter-wrapper">
                                {LETTERS.map((ch, i) => (
                                    <span className="letter" key={i}>{ch}</span>
                                ))}
                            </div>
                        </div>

                        <div className="receipt-wrapper">
                            <div className="receipt">

                                {/* Header */}
                                <div className="receipt-header">
                                    <div>
                                        Sam Cafe<br />
                                        Lavanya complex<br />
                                        Madurai – 625014
                                    </div>
                                    <div className="logo">🍽</div>
                                </div>

                                {/* Sub-header */}
                                <div className="receipt-subheader">
                                    <div>
                                        Order #{id}<br />
                                        {tableNo ? `Table: ${tableNo}  |  ` : ""}
                                        {formattedDate} – {time}<br />
                                        Mode: {mode === "dine in" ? "Dine In" : "Take Away"}
                                        {userName && userName !== "Guest" && (
                                            <><br />Customer: {userName}</>
                                        )}
                                    </div>
                                </div>

                                {/* Items table */}
                                <table className="receipt-table">
                                    <tbody>
                                        <tr>
                                            <th>Item</th>
                                            <th>Qty</th>
                                            <th>Price</th>
                                        </tr>

                                        {items.map((item, i) => (
                                            <tr key={i}>
                                                <td>{item.dishName}</td>
                                                <td>{item.quantity}x</td>
                                                <td>{Number(item.totalPrice).toFixed(2)}</td>
                                            </tr>
                                        ))}

                                        <tr className="receipt-subtotal">
                                            <td colSpan={2}>Subtotal</td>
                                            <td>{Number(subTotal).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={2}>CGST (2.5%)</td>
                                            <td>{Number(cgst).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={2}>SGST (2.5%)</td>
                                            <td>{Number(sgst).toFixed(2)}</td>
                                        </tr>
                                        <tr className="receipt-total">
                                            <td colSpan={2}>Total</td>
                                            <td>{Number(total).toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className="receipt-message">Thank you for your order!</div>
                            </div>
                        </div>
                    </div>
                    {/* ── end .wrapper ── */}

                    {/* ── 3D Done button — fades in after animation ── */}
                    <div className="pr-done-btn-wrap">
                        <button className="pr-done-btn" onClick={handleDone}>
                            <span className="pr-btn-shadow" />
                            <span className="pr-btn-edge" />
                            <span className="pr-btn-front">✓ Done</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PrinterReceipt;