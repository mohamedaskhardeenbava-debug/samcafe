import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./QuickLinksFab.css";

/**
 * QuickLinksFab — "…" floating trigger shown on the Food Category page
 * only. Popping open reveals 4 shortcut buttons (Crowd Picks, Combo,
 * Offers, Events & Bookings) fanned out along a quarter-circle arc
 * from straight up (12 o'clock) to straight left (9 o'clock) of the
 * trigger button, each item popping outward from the trigger's own
 * position — same pop-in-place idea as the Uiverse tooltip reference
 * (icon in the middle, related items blossoming out around it), just
 * swept across an arc instead of pinned to fixed compass points.
 *
 * .quick-links-menu is a sibling of the trigger button, absolutely
 * positioned over the trigger's own bottom-right corner rather than
 * nested inside it — a separate layer floating above the page, the
 * same way .mobile-footer-nav is its own element rather than living
 * inside whatever button opens/closes it.
 *
 * Each item's arc position is expressed as CSS custom properties
 * (--qli-tx/--qli-ty, the resting offset from the trigger's corner)
 * computed once per render from its index — evenly spaced angles
 * between 90° (up) and 180° (left) — so QuickLinksFab.css only needs
 * to animate a generic translate(var(--qli-tx), var(--qli-ty)) rather
 * than hardcoding four separate positions.
 *
 * Open triggers: hover (desktop/mouse) OR a click/tap.
 * Close triggers: clicking the trigger again while open, picking one
 * of the 4 buttons, the mouse leaving the whole cluster (hover-only
 * opens), or a tap outside it (click-opened, touch devices).
 *
 * A click and a hover are tracked separately (`clickOpen` / `hoverOpen`)
 * so a second *click* always closes the menu even if the cursor is
 * still hovering it — otherwise the hover state would just re-open it
 * the instant the click-close ran.
 */

// Radius the items rest at once popped out, and the arc they're
// spread across — 90° (straight up) through 180° (straight left),
// matching the FAB's bottom-right anchor so the arc sweeps up and
// over to the left of the button rather than through the page edge.
const ARC_RADIUS = 84;
const ARC_START_DEG = 90;
const ARC_END_DEG = 180;

/**
 * Evenly spaced angle (in degrees) for item `i` of `count` along the
 * arc — single item still lands at the arc's midpoint rather than
 * dividing-by-zero at one of its ends.
 */
const arcAngle = (i, count) => {
  if (count <= 1) return (ARC_START_DEG + ARC_END_DEG) / 2;
  return ARC_START_DEG + ((ARC_END_DEG - ARC_START_DEG) * i) / (count - 1);
};
const LINKS = [
  { key: "others", label: "Crowd Picks", route: "/favourites/others", glyph: "🔥" },
  { key: "combo", label: "Combo", route: "/combo", glyph: "🍱" },
  { key: "offers", label: "Offers", route: "/offers", glyph: "🏷️" },
  { key: "events", label: "Events & Bookings", route: "/events", glyph: "📅" },
];

const QuickLinksFab = ({
  isCrowdPicksEnabled = true,
  isComboEnabled = true,
  isOffersEnabled = true,
  isEventsEnabled = true,
}) => {
  const [clickOpen, setClickOpen] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  const open = clickOpen || hoverOpen;

  const enabledFlags = {
    others: isCrowdPicksEnabled,
    combo: isComboEnabled,
    offers: isOffersEnabled,
    events: isEventsEnabled,
  };

  const visibleLinks = LINKS.filter((l) => enabledFlags[l.key] !== false);

  useEffect(() => {
    if (!clickOpen) return;
    const handleOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setClickOpen(false);
        setHoverOpen(false);
        if (document.activeElement instanceof HTMLElement && wrapRef.current.contains(document.activeElement)) {
          document.activeElement.blur();
        }
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [clickOpen]);

  if (visibleLinks.length === 0) return null;

  const goTo = (route) => {
    setClickOpen(false);
    setHoverOpen(false);
    // Blur whatever's focused before closing — belt-and-braces on top
    // of `inert` below, so a focused .quick-links-item can never
    // become an inert descendant even for a single frame.
    if (document.activeElement instanceof HTMLElement && wrapRef.current?.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    navigate(route);
  };

  const handleTriggerClick = () => {
    setClickOpen((prev) => {
      const next = !prev;
      if (!next) {
        setHoverOpen(false); // a closing click also cancels any lingering hover-open
        if (document.activeElement instanceof HTMLElement && wrapRef.current?.contains(document.activeElement)) {
          document.activeElement.blur();
        }
      }
      return next;
    });
  };

  return (
    <div
      className={`quick-links-fab-wrap ${open ? "open" : ""}`}
      ref={wrapRef}
      onMouseEnter={() => setHoverOpen(true)}
      onMouseLeave={() => setHoverOpen(false)}
    >
      <button
        type="button"
        className="quick-links-fab-btn"
        onClick={handleTriggerClick}
        aria-label="Quick links"
        aria-expanded={open}
      >
        <span className="quick-links-fab-icon">⋯</span>
      </button>

      {/* Separate layer anchored over the trigger's own corner — not
          nested inside .quick-links-fab-btn — so it floats above the
          page independently of the button's own hover/active
          transforms, the same way .mobile-footer-nav sits apart from
          whatever navigation triggered it. */}
      <div className="quick-links-menu" inert={!open}>
        {visibleLinks.map((link, i) => {
          const angleRad = (arcAngle(i, visibleLinks.length) * Math.PI) / 180;
          // Standard unit-circle placement around the trigger's
          // center: at 90° (straight up) this is (0, -R) and at 180°
          // (straight left) it's (-R, 0) — i.e. tx swings from 0 to
          // -x and ty swings from -y to 0 as the angle sweeps from
          // 90° to 180°, landing every item strictly in the
          // (-x, -y) quadrant relative to the trigger, as requested.
          const tx = Math.cos(angleRad) * ARC_RADIUS;
          const ty = -Math.sin(angleRad) * ARC_RADIUS;
          return (
            <button
              type="button"
              key={link.key}
              className="quick-links-item"
              style={{
                "--qli-tx": `${tx.toFixed(1)}px`,
                "--qli-ty": `${ty.toFixed(1)}px`,
                transitionDelay: open ? `${i * 45}ms` : `${(visibleLinks.length - 1 - i) * 30}ms`,
              }}
              onClick={() => goTo(link.route)}
              aria-label={link.label}
              title={link.label}
            >
              <span className="quick-links-item-glyph">{link.glyph}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickLinksFab;
