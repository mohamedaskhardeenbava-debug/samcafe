import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./QuickLinksFab.css";
import { useIsBelowWidth } from "./shared/useIsBelowWidth";

/**
 * QuickLinksFab — "…" floating trigger shown on the Food Category page
 * only. Popping open reveals 4 shortcut items (Crowd Picks, Combo,
 * Offers, Events & Bookings) fanned out along a quarter-circle arc
 * from straight up (12 o'clock) to straight left (9 o'clock) of the
 * trigger button, each item popping outward from the trigger's own
 * position — same pop-in-place idea as the Uiverse tooltip reference
 * (icon in the middle, related items blossoming out around it), just
 * swept across an arc instead of pinned to fixed compass points.
 *
 * Each item is its own name, rendered directly as the clickable pill
 * (.quick-links-item-label) — no separate icon/circle element. That
 * label's RIGHT edge is what sits on the common ARC_RADIUS arc: the
 * label itself is right-anchored (position: right: 0 in the CSS), so
 * translating it by the arc point directly places its inner edge —
 * the side facing the trigger — on that shared arc.
 *
 * Every pill shares the same fixed height (see .quick-links-item-label
 * in the CSS — height + flex centering, not an intrinsic
 * content-driven height), so pills never differ in height even though
 * their widths do (each is just its own name, and names differ in
 * length).
 *
 * Because pill widths DO differ, evenly spacing items by angle alone
 * (a constant angular step) does not give equal on-screen gaps
 * between them — a wider pill "eats into" the angular gap on either
 * side of it more than a narrow one does. To make the gap between
 * every pair of adjacent pills' facing edges equal, each item's
 * angular position is computed cumulatively in layoutAngles() below:
 * item 0 starts at ARC_START, and each subsequent item's angle adds
 * the PREVIOUS item's own angular width (pixel width / radius, i.e.
 * arc length s = rθ solved for θ) plus a fixed GAP_PX gap, also
 * converted to an angle the same way.
 *
 * The gap from the trigger's own edge to item 0 doesn't need this
 * treatment — every item sits on the same ARC_RADIUS circle, so the
 * radial distance from the trigger's center out to any point on that
 * circle is already identical for all of them by definition of a
 * circle, regardless of angle.
 *
 * .quick-links-menu is a sibling of the trigger button, absolutely
 * positioned over the trigger's own bottom-right corner rather than
 * nested inside it — a separate layer floating above the page, the
 * same way .mobile-footer-nav is its own element rather than living
 * inside whatever button opens/closes it.
 *
 * Each item's arc position is expressed as CSS custom properties
 * (--qli-tx/--qli-ty, the resting offset from the trigger's corner)
 * computed once per render — so QuickLinksFab.css only needs to
 * animate a generic translate(var(--qli-tx), var(--qli-ty)) rather
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

// Radius the pills' right edges rest at once popped out, and the arc
// they're spread across. Widened slightly past a plain quarter-circle
// — 80° (just past straight up) through 185° (just past straight
// left) — because that extra angular room is what let the radius
// drop much further while still fitting the equal on-screen GAPS
// between pills of different widths (see layoutAngles() below): a
// wide pill like "Events & Bookings" needs real angular space
// regardless of radius, so a tighter span alone would force the
// radius — and therefore the distance from every pill to the trigger
// button — right back up. 5° past each end of a plain 90° span is a
// small enough tilt that the arc still reads as "up and to the left"
// rather than pointing sideways or down.
//
// Uses the compact pill sizing in the CSS (11px/9px font, minimal
// padding) — every extra pixel of pill width also pushes the whole
// arc's radius up, so this is tuned to the smallest radius that still
// fits both the widened span and that compact sizing. GAP_PX is the
// target gap, in pixels, between consecutive pills (the
// trigger-to-first-pill distance doesn't need a separate setting —
// see layoutAngles()).
const ARC_RADIUS = 154;
const ARC_RADIUS_MOBILE = 130;
const GAP_PX = 6;
const GAP_PX_MOBILE = 4;
const ARC_START_DEG = 80;
const ARC_END_DEG = 185;

/**
 * Cumulative angular position (in degrees) for the RIGHT (near) edge
 * of each item, given each item's own pixel width — so that the
 * arc-length gap between every pair of adjacent items' facing edges
 * comes out equal on screen, regardless of how wide each item's label
 * pill actually is.
 *
 * The gap from the trigger's own edge out to item 0's near edge does
 * NOT need this treatment: every item sits on the same ARC_RADIUS
 * circle around the trigger, so that radial distance is already
 * identical for every item regardless of angle — rotating an item
 * along the arc changes its position, not its distance from the
 * trigger's center. Item 0 simply starts at ARC_START itself, with no
 * added gap.
 *
 * Returns an array of ABSOLUTE angles in degrees, one per item, ready
 * to feed straight into Math.cos/Math.sin — not offsets from
 * ARC_START that the caller would still need to add ARC_START to.
 */
const layoutAngles = (widths, radius, gapPx) => {
  const gapAngleDeg = (gapPx / radius) * (180 / Math.PI);
  let cursorDeg = ARC_START_DEG;
  const angles = [];
  widths.forEach((w, i) => {
    angles.push(cursorDeg);
    const widthAngleDeg = (w / radius) * (180 / Math.PI);
    cursorDeg += widthAngleDeg + gapAngleDeg;
  });
  return angles;
};
const LINKS = [
  { key: "others", label: "Crowd Picks", route: "/favourites/others" },
  { key: "combo", label: "Combo", route: "/combo" },
  { key: "offers", label: "Offers", route: "/offers" },
  { key: "events", label: "Events & Bookings", route: "/events" },
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
  const itemRefs = useRef({});
  const [itemWidths, setItemWidths] = useState({});
  const navigate = useNavigate();
  const isMobile = useIsBelowWidth(480);
  const arcRadius = isMobile ? ARC_RADIUS_MOBILE : ARC_RADIUS;
  const gapPx = isMobile ? GAP_PX_MOBILE : GAP_PX;

  const open = clickOpen || hoverOpen;

  const enabledFlags = {
    others: isCrowdPicksEnabled,
    combo: isComboEnabled,
    offers: isOffersEnabled,
    events: isEventsEnabled,
  };

  const visibleLinks = LINKS.filter((l) => enabledFlags[l.key] !== false);

  // Real measured pixel width of each pill — layoutAngles() needs
  // this to solve for equal on-screen gaps (see the file header
  // comment), and a character-count estimate would drift from
  // whatever the browser's actual font metrics produce. Measured
  // after every render that could change a pill's rendered width:
  // the visible link set, and switching the mobile/desktop pill
  // size (font-size/padding change on the 480px breakpoint).
  useLayoutEffect(() => {
    const next = {};
    visibleLinks.forEach((link) => {
      const el = itemRefs.current[link.key];
      // offsetWidth (not getBoundingClientRect) — the pill is
      // transform: scale()'d down while closed (see the CSS), and
      // getBoundingClientRect reports the POST-transform size, which
      // would measure it far too small. offsetWidth reflects the
      // element's own layout box, unaffected by any transform applied
      // to it.
      if (el) next[link.key] = el.offsetWidth;
    });
    setItemWidths(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleLinks.map((l) => l.key).join(","), isMobile]);

  // Falls back to each pill's max-width (see the CSS) until the real
  // measurement above lands on the first render, so items still get
  // a reasonable — if not yet pixel-perfect — arc position instead of
  // all collapsing to width 0.
  const fallbackWidth = isMobile ? 65 : 80;
  const widths = visibleLinks.map((l) => itemWidths[l.key] ?? fallbackWidth);
  const angles = useMemo(
    () => layoutAngles(widths, arcRadius, gapPx),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [widths.join(","), arcRadius, gapPx]
  );

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
    // of `inert` below, so a focused .quick-links-item-label can
    // never become an inert descendant even for a single frame.
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
          const angleRad = (angles[i] * Math.PI) / 180;
          // Standard unit-circle placement around the trigger's
          // center: at 90° (straight up) this is (0, -R) and at 180°
          // (straight left) it's (-R, 0) — i.e. tx swings from 0 to
          // -x and ty swings from -y to 0 as the angle sweeps from
          // 90° to 180°, landing every item strictly in the
          // (-x, -y) quadrant relative to the trigger, as requested.
          // Unlike a plain evenly-spaced angle, angles[i] here already
          // accounts for every earlier item's own pixel width (see
          // layoutAngles() above), so the gap between this item and
          // the previous one comes out equal on screen despite the
          // items being different widths. (The gap from the trigger to
          // item 0 is already equal for every item by construction —
          // see layoutAngles()'s own comment.)
          //
          // This (tx, ty) point is exactly where the label's RIGHT
          // EDGE should land — the label itself is right-anchored
          // within its own box (position: right: 0 in the CSS), so
          // translating it by (tx, ty) directly puts its right edge
          // there with no extra shift needed.
          const tx = Math.cos(angleRad) * arcRadius;
          const ty = -Math.sin(angleRad) * arcRadius;
          return (
            <button
              type="button"
              key={link.key}
              ref={(el) => { itemRefs.current[link.key] = el; }}
              className="quick-links-item-label"
              style={{
                "--qli-tx": `${tx.toFixed(1)}px`,
                "--qli-ty": `${ty.toFixed(1)}px`,
                transitionDelay: open ? `${i * 45}ms` : `${(visibleLinks.length - 1 - i) * 30}ms`,
              }}
              onClick={() => goTo(link.route)}
              aria-label={link.label}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickLinksFab;
