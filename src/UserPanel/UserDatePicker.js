// UserDatePicker.js — shared user-panel date picker
// Import once, reuse across CateringForm, CelebrationForm, PreBooking, ReservationForm
//
// Props:
//   value       – "YYYY-MM-DD" string or ""
//   onChange    – (value: string) => void
//   min         – optional "YYYY-MM-DD"  – dates before this are disabled
//   max         – optional "YYYY-MM-DD"  – dates after this are disabled
//   hasError    – boolean – shows red border on the trigger
//   placeholder – string shown when no date is selected (default "Select date")
//   disabled    – boolean

import React, { useState, useEffect, useRef } from "react";
import "./UserDatePicker.css";

const pad = (n) => String(n).padStart(2, "0");
export const todayStr = () => new Date().toISOString().split("T")[0];

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const CAL_ICON = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8"  y1="2" x2="8"  y2="6" />
        <line x1="3"  y1="10" x2="21" y2="10" />
    </svg>
);

export const UserDatePicker = ({
    value,
    onChange,
    min,
    max,
    hasError = false,
    placeholder = "Select date",
    disabled = false,
}) => {
    const [open, setOpen]       = useState(false);
    const [view, setView]       = useState("day");
    const ref                   = useRef(null);

    const seed   = value ? new Date(value) : new Date();
    const [calYear,  setCalYear]  = useState(seed.getFullYear());
    const [calMonth, setCalMonth] = useState(seed.getMonth());

    // Sync calendar head when value changes externally
    useEffect(() => {
        if (value) {
            const d = new Date(value);
            setCalYear(d.getFullYear());
            setCalMonth(d.getMonth());
        }
    }, [value]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const minD = min ? new Date(min + "T00:00:00") : null;
    const maxD = max ? new Date(max + "T00:00:00") : null;

    const isDisabled = (dateStr) => {
        const d = new Date(dateStr + "T00:00:00");
        if (minD && d < minD) return true;
        if (maxD && d > maxD) return true;
        return false;
    };

    const firstDay    = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const selectDay = (d) => {
        const s = `${calYear}-${pad(calMonth + 1)}-${pad(d)}`;
        onChange(s);
        setOpen(false);
    };

    const prevNav = () => {
        if (view === "day") {
            if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
            else setCalMonth(m => m - 1);
        } else if (view === "year") setCalYear(y => y - 20);
    };

    const nextNav = () => {
        if (view === "day") {
            if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
            else setCalMonth(m => m + 1);
        } else if (view === "year") setCalYear(y => y + 20);
    };

    const yearRange = Array.from({ length: 20 }, (_, i) => calYear - 5 + i);
    const today     = todayStr();

    const displayVal = value
        ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : placeholder;

    return (
        <div className="udp-wrap" ref={ref}>
            <button
                type="button"
                className={`udp-trigger${hasError ? " udp-error" : ""}${disabled ? " udp-disabled" : ""}`}
                disabled={disabled}
                onClick={() => { setOpen(o => !o); setView("day"); }}
            >
                {CAL_ICON}
                <span className={`udp-val${!value ? " udp-ph" : ""}`}>{displayVal}</span>
                <span className="udp-arrow">▾</span>
            </button>

            {open && !disabled && (
                <div className="udp-popup">

                    {/* Navigation */}
                    <div className="udp-nav">
                        <button type="button" className="udp-nav-btn" onClick={prevNav}>‹</button>
                        <div className="udp-nav-center">
                            {view === "day" && (
                                <>
                                    <button type="button" className="udp-nav-lbl" onClick={() => setView("month")}>{MONTHS[calMonth]}</button>
                                    <button type="button" className="udp-nav-lbl" onClick={() => setView("year")}>{calYear}</button>
                                </>
                            )}
                            {view === "month" && (
                                <button type="button" className="udp-nav-lbl" onClick={() => setView("year")}>{calYear}</button>
                            )}
                            {view === "year" && (
                                <span className="udp-nav-lbl">{calYear - 5} – {calYear + 14}</span>
                            )}
                        </div>
                        <button type="button" className="udp-nav-btn" onClick={nextNav}>›</button>
                    </div>

                    {/* Day view */}
                    {view === "day" && (
                        <>
                            <div className="udp-weekdays">
                                {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <span key={d}>{d}</span>)}
                            </div>
                            <div className="udp-grid">
                                {cells.map((d, i) => {
                                    if (!d) return <span key={i} />;
                                    const ds  = `${calYear}-${pad(calMonth + 1)}-${pad(d)}`;
                                    const sel = ds === value;
                                    const dis = isDisabled(ds);
                                    const tod = ds === today;
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            className={`udp-day${sel ? " udp-sel" : ""}${dis ? " udp-dis" : ""}${tod && !sel ? " udp-today" : ""}`}
                                            disabled={dis}
                                            onClick={() => selectDay(d)}
                                        >{d}</button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Month view */}
                    {view === "month" && (
                        <div className="udp-month-grid">
                            {MONTHS.map((m, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`udp-month-btn${i === calMonth ? " udp-sel" : ""}`}
                                    onClick={() => { setCalMonth(i); setView("day"); }}
                                >{m.slice(0, 3)}</button>
                            ))}
                        </div>
                    )}

                    {/* Year view */}
                    {view === "year" && (
                        <div className="udp-year-grid">
                            {yearRange.map(y => (
                                <button
                                    key={y}
                                    type="button"
                                    className={`udp-year-btn${y === calYear ? " udp-sel" : ""}`}
                                    onClick={() => { setCalYear(y); setView("month"); }}
                                >{y}</button>
                            ))}
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default UserDatePicker;
