import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./FoodCategory.css";
import listIcon from "../assets/icons/list.png";
import gridIcon from "../assets/icons/grid.png";

/* ═══════════════════════════════════════════════
   DATA HELPERS
═══════════════════════════════════════════════ */

/** Flatten every dish from categories + subCategories into a Map keyed by id */
function buildDishMap(categories = []) {
  const map = new Map();
  for (const cat of categories) {
    for (const d of cat.dishes || []) {
      map.set(d.id, { ...d, _catId: cat.id });
    }
    for (const sub of cat.subCategories || []) {
      for (const d of sub.dishes || []) {
        map.set(d.id, { ...d, _catId: cat.id, _subId: sub.id });
      }
    }
  }
  return map;
}

/** Count how many times each dishId appears across all orders */
function buildOrderCount(orders = []) {
  const count = new Map();
  for (const order of orders) {
    for (const item of order.items || []) {
      const id = item.id || item.dishId;
      if (id) count.set(id, (count.get(id) || 0) + (item.quantity || 1));
    }
  }
  return count;
}

/** Format "YYYY-MM-DD" → "Mon, DD Mmm" */
function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/* ─────────────────────────────────────────────
   Derive PROMO chips from live db data (max 8)
───────────────────────────────────────────── */
function derivePromoItems({ categories, orders, offers, comboOffers, events }) {
  const dishMap = buildDishMap(categories);
  const orderCount = buildOrderCount(orders);
  const chips = [];

  /* 1. Active offer dishes */
  for (const offer of offers || []) {
    if (offer.active !== "yes") continue;
    const dish = dishMap.get(offer.dishId);
    if (!dish?.name || !dish?.basePrice) continue;
    chips.push({
      id: `offer-${offer.id}`,
      type: "offer",                              // ← type "offer" → navigates to /offers
      badge: `${offer.percentage}% OFF`,
      badgeColor: "hot",
      discount: `Save ₹${Math.round(offer.offerAmount ?? (offer.originalPrice - offer.offerPrice))}`,
      title: dish.name,
      price: `₹${Math.round(offer.offerPrice)}`,
      oldPrice: `₹${offer.originalPrice}`,
      image: dish.image,
      cta: "Order now",
      categoryId: dish._catId,
      dishId: dish.id,
    });
  }

  /* 2. Top-ordered dish (trending) */
  const sorted = [...orderCount.entries()].sort((a, b) => b[1] - a[1]);
  for (const [id, count] of sorted) {
    const dish = dishMap.get(id);
    if (!dish?.name || !dish?.basePrice || !dish?.image) continue;
    chips.push({
      id: `trending-${id}`,
      type: "dish",
      badge: "Trending",
      badgeColor: "pop",
      discount: null,
      title: dish.name,
      price: `₹${dish.basePrice}`,
      oldPrice: null,
      image: dish.image,
      cta: "View",
      categoryId: dish._catId,
      dishId: dish.id,
      orderCount: count,
    });
    break;
  }

  /* 3. Best combo offer */
  const bestCombo = (comboOffers || []).reduce(
    (best, o) => (!best || o.value > best.value ? o : best), null
  );
  if (bestCombo) {
    const { starter, main } = bestCombo.condition || {};
    chips.push({
      id: `combo-${bestCombo.id}`,
      type: "combo",
      badge: "Best combo",
      badgeColor: "combo",
      discount: bestCombo.label,
      title: starter && main ? `${starter} + ${main}` : "Combo deal",
      price: null,
      oldPrice: null,
      image: null,
      cta: "Build combo",
      comboOffer: bestCombo,
    });
  }

  /* 4. Published / upcoming events */
  const today = new Date().toISOString().slice(0, 10);
  for (const ev of events || []) {
    if (!ev.isPublished) continue;
    if (ev.status !== "upcoming" && ev.date < today) continue;
    chips.push({
      id: `event-${ev.id}`,
      type: "event",
      badge: fmtDate(ev.date),
      badgeColor: "event",
      discount: ev.highlights?.[0] || null,
      title: ev.title,
      price: ev.price ? `₹${ev.price}` : null,
      oldPrice: null,
      image: ev.image || null,
      cta: "Book now",
      route: "/events",
    });
  }

  /* 5. New-arrival filler (last dishes by db position) */
  if (chips.length < 8) {
    const usedIds = new Set(chips.filter((c) => c.dishId).map((c) => c.dishId));
    const allDishes = [];
    for (const cat of categories || []) {
      for (const d of cat.dishes || []) {
        if (d.name && d.basePrice && d.image && !usedIds.has(d.id))
          allDishes.push({ ...d, _catId: cat.id });
      }
      for (const sub of cat.subCategories || []) {
        for (const d of sub.dishes || []) {
          if (d.name && d.basePrice && d.image && !usedIds.has(d.id))
            allDishes.push({ ...d, _catId: cat.id });
        }
      }
    }
    for (const dish of allDishes.slice(-(8 - chips.length))) {
      chips.push({
        id: `new-${dish.id}`,
        type: "dish",
        badge: "New",
        badgeColor: "pop",
        discount: null,
        title: dish.name,
        price: `₹${dish.basePrice}`,
        oldPrice: null,
        image: dish.image,
        cta: "Try it",
        categoryId: dish._catId,
        dishId: dish.id,
      });
    }
  }

  return chips.slice(0, 8);
}

/* ─────────────────────────────────────────────
   Derive POPULAR DISHES (top 12 by order count)
───────────────────────────────────────────── */
function derivePopularDishes({ categories, orders }, limit = 12) {
  const dishMap = buildDishMap(categories);
  const orderCount = buildOrderCount(orders);
  const result = [];

  for (const [id, count] of [...orderCount.entries()].sort((a, b) => b[1] - a[1])) {
    const d = dishMap.get(id);
    if (!d?.name || !d?.basePrice || !d?.image) continue;
    result.push({
      id,
      name: d.name,
      image: d.image,
      price: d.basePrice,
      categoryId: d._catId,
      subCategoryId: d._subId || null,
      orderCount: count,
    });
    if (result.length >= limit) break;
  }
  return result;
}

/* ─────────────────────────────────────────────
   Derive EVENTS (published + upcoming)
───────────────────────────────────────────── */
function deriveEvents({ events }) {
  const today = new Date().toISOString().slice(0, 10);
  return (events || []).filter(
    (ev) => ev.isPublished && (ev.status === "upcoming" || ev.date >= today)
  );
}

/* ─────────────────────────────────────────────
   Derive FAVOURITE COMBOS (top 6 by order count)
───────────────────────────────────────────── */
function deriveFavouriteCombos({ orders }, limit = 6) {
  const comboCount = new Map();
  for (const order of orders || []) {
    for (const item of order.items || []) {
      if (!item.isCombo) continue;
      const key = item.id || item.name;
      if (!key) continue;
      comboCount.set(key, {
        count: (comboCount.get(key)?.count || 0) + (item.quantity || 1),
        item,
      });
    }
  }
  return [...comboCount.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ count, item }) => ({
      id: item.id || item.name,
      name: item.name,
      image:
        item.comboItems?.main?.image ||
        item.comboItems?.starter?.image ||
        item.comboItems?.drink?.image ||
        null,
      price: item.unitPrice || item.perComboFinalPrice || 0,
      orderCount: count,
      comboItems: item.comboItems || {},
    }));
}

/* ─────────────────────────────────────────────
   Derive CROWD PICKS — top dishes from ALL orders (different frame from popular)
   Shows the top 10 dishes by unique order frequency
───────────────────────────────────────────── */
function deriveCrowdPicks({ categories, orders }, limit = 10) {
  const dishMap = buildDishMap(categories);

  // Count unique orders (not quantities) per dish → real "crowd" signal
  const uniqueOrderCount = new Map();
  for (const order of orders || []) {
    const seenInThisOrder = new Set();
    for (const item of order.items || []) {
      const id = item.id || item.dishId;
      if (!id || seenInThisOrder.has(id)) continue;
      seenInThisOrder.add(id);
      uniqueOrderCount.set(id, (uniqueOrderCount.get(id) || 0) + 1);
    }
  }

  const result = [];
  for (const [id, count] of [...uniqueOrderCount.entries()].sort((a, b) => b[1] - a[1])) {
    const d = dishMap.get(id);
    if (!d?.name || !d?.basePrice || !d?.image) continue;
    result.push({
      id,
      name: d.name,
      image: d.image,
      price: d.basePrice,
      categoryId: d._catId,
      subCategoryId: d._subId || null,
      orderCount: count,
    });
    if (result.length >= limit) break;
  }
  return result;
}
const ACCENT_MAP = {
  hot: "#FF6B35",
  pop: "#1A73E8",
  combo: "#7B61FF",
  event: "#0F9D58",
};

/* ═══════════════════════════════════════════════
   PROMO CHIP
═══════════════════════════════════════════════ */
const PromoChip = ({ item, onClick }) => (
  <button
    className={`pc-chip pc-chip-${item.badgeColor}`}
    onClick={() => onClick(item)}
    aria-label={item.title}
    style={{ "--chip-accent": ACCENT_MAP[item.badgeColor] || "#FF6B35" }}
  >
    <span className="pc-chip-badge">{item.badge}</span>
    <span className="pc-chip-title">{item.title}</span>
    {item.discount && <span className="pc-chip-discount">{item.discount}</span>}
  </button>
);

/* ═══════════════════════════════════════════════
   PROMO CAROUSEL — 4 chips per page
═══════════════════════════════════════════════ */
const PromoCarousel = ({ items, onCardClick }) => {
  const PAGE_SIZE = 4;
  const pages = [];
  for (let i = 0; i < items.length; i += PAGE_SIZE) pages.push(items.slice(i, i + PAGE_SIZE));
  const MAX = pages.length - 1;

  const [page, setPage] = useState(0);
  const startXRef = useRef(null);
  const autoRef = useRef(null);

  const go = useCallback(
    (dir) => setPage((p) => Math.max(0, Math.min(MAX, p + dir))), [MAX]
  );

  const resetAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => setPage((p) => (p >= MAX ? 0 : p + 1)), 4000);
  }, [MAX]);

  useEffect(() => { resetAuto(); return () => clearInterval(autoRef.current); }, [resetAuto]);

  const onTouchStart = (e) => { startXRef.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (startXRef.current === null) return;
    const dx = startXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) { go(dx > 0 ? 1 : -1); resetAuto(); }
    startXRef.current = null;
  };

  if (!items.length) return null;

  return (
    <div className="pc-root" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <button className="pc-arrow pc-arrow-left"
        onClick={() => { go(-1); resetAuto(); }} disabled={page === 0} aria-label="Previous" />

      <div className="pc-viewport">
        <div className="pc-track">
          {pages.map((group, gi) => (
            <div key={gi} className="pc-page">
              {group.map((item) => (
                <PromoChip key={item.id} item={item} onClick={onCardClick} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <button className="pc-arrow pc-arrow-right"
        onClick={() => { go(1); resetAuto(); }} disabled={page === MAX} aria-label="Next" />
    </div>
  );
};

/* ═══════════════════════════════════════════════
   POPULAR DISHES SECTION
═══════════════════════════════════════════════ */
const PopularDishes = ({ dishes, onDishClick }) => {
  if (!dishes.length) return null;

  return (
    <section className="popular-section">
      <div className="section-header">
        <h2 className="section-title">🔥 Popular Dishes</h2>
        <span className="section-sub">Most ordered by your crowd</span>
      </div>

      <div className="popular-scroll">
        {dishes.map((dish, i) => (
          <button
            key={dish.id}
            className="popular-card"
            onClick={() => onDishClick(dish)}
            aria-label={dish.name}
          >
            {/* Rank badge */}
            <span className={`popular-rank ${i < 3 ? "popular-rank-top" : ""}`}>
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
            </span>

            <div className="popular-img-wrap">
              <img src={dish.image} alt={dish.name} loading="lazy" decoding="async" />
            </div>

            <div className="popular-info">
              <span className="popular-name">{dish.name}</span>
              <div className="popular-meta">
                <span className="popular-price">₹{dish.price}</span>
                <span className="popular-orders">{dish.orderCount} orders</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════
   CROWD PICKS SECTION
═══════════════════════════════════════════════ */
const CrowdPicksSection = ({ dishes, onDishClick }) => {
  if (!dishes.length) return null;

  return (
    <section className="popular-section">
      <div className="section-header">
        <h2 className="section-title">👥 Crowd Picks</h2>
        <Link to="/favourites/others" className="section-link">View all</Link>
      </div>

      <div className="popular-scroll">
        {dishes.map((dish, i) => (
          <button
            key={dish.id}
            className="popular-card crowd-pick-card"
            onClick={() => onDishClick(dish)}
            aria-label={dish.name}
          >
            <span className={`popular-rank ${i < 3 ? "popular-rank-top" : ""}`}>
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
            </span>

            <div className="popular-img-wrap">
              <img src={dish.image} alt={dish.name} loading="lazy" decoding="async" />
            </div>

            <div className="popular-info">
              <span className="popular-name">{dish.name}</span>
              <div className="popular-meta">
                <span className="popular-price">₹{dish.price}</span>
                <span className="popular-orders">{dish.orderCount} tables ordered</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};


const FavouriteCombos = ({ combos, onComboClick }) => {
  if (!combos.length) return null;

  return (
    <section className="popular-section">
      <div className="section-header">
        <h2 className="section-title">🍱 Favourite Combos</h2>
        <Link to="/combo" className="section-link">Build your own</Link>
      </div>

      <div className="popular-scroll">
        {combos.map((combo, i) => (
          <button
            key={combo.id}
            className="popular-card"
            onClick={() => onComboClick(combo)}
            aria-label={combo.name}
          >
            <span className={`popular-rank ${i < 3 ? "popular-rank-top" : ""}`}>
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
            </span>

            <div className="popular-img-wrap" style={{ background: "linear-gradient(135deg,#7B61FF22,#7B61FF11)" }}>
              {combo.image
                ? <img src={combo.image} alt={combo.name} loading="lazy" decoding="async" />
                : <span style={{ fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>🍱</span>
              }
            </div>

            <div className="popular-info">
              <span className="popular-name">{combo.name}</span>
              <div className="popular-meta">
                <span className="popular-price">₹{combo.price}</span>
                <span className="popular-orders">{combo.orderCount} orders</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════
   EVENTS SECTION
═══════════════════════════════════════════════ */
const EventsSection = ({ events, onEventClick }) => {
  if (!events.length) return null;

  return (
    <section className="events-section">
      <div className="section-header">
        <h2 className="section-title">🎉 Upcoming Events</h2>
        <Link to="/events" className="section-link">View all</Link>
      </div>

      <div className="events-grid">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="event-card"
            onClick={() => onEventClick(ev)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onEventClick(ev)}
          >
            {/* Image or gradient placeholder */}
            <div className="event-img-wrap">
              {ev.image
                ? <img src={ev.image} alt={ev.title} loading="lazy" decoding="async" />
                : <div className="event-img-placeholder">
                  <span className="event-img-icon">🎊</span>
                </div>
              }
              <span className="event-date-badge">{fmtDate(ev.date)} · {ev.time}</span>
            </div>

            <div className="event-body">
              <span className="event-type-tag">{ev.eventType}</span>
              <h3 className="event-title">{ev.title}</h3>
              <p className="event-venue">📍 {ev.venue}</p>

              {ev.highlights?.length > 0 && (
                <ul className="event-highlights">
                  {ev.highlights.slice(0, 3).map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              )}

              <div className="event-footer">
                <div className="event-price-wrap">
                  <span className="event-price-label">Per person</span>
                  <span className="event-price">₹{ev.price}</span>
                </div>
                <div className="event-capacity">
                  <span className="event-capacity-dot" />
                  {ev.maxCapacity} seats
                </div>
                <button
                  className="event-cta"
                  onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                >
                  Book now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════
   FOOD CATEGORY — main component
═══════════════════════════════════════════════ */
const FoodCategory = ({ foodData, currentUser }) => {
  const [viewMode, setViewMode] = useState("grid");
  const [promoItems, setPromoItems] = useState([]);
  const [popularDishes, setPopularDishes] = useState([]);
  const [crowdPicks, setCrowdPicks] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [favouriteCombos, setFavouriteCombos] = useState([]);
  const navigate = useNavigate();

  const isAuthenticatedUser = currentUser && currentUser.id !== "guest";

  /* ── Derive all sections from foodData ── */
  useEffect(() => {
    if (!foodData) return;
    const { categories = [], orders = [], offers = [], comboOffers = [], combo = [], events = [] } = foodData;
    const resolvedComboOffers = comboOffers.length ? comboOffers : combo;

    setPromoItems(derivePromoItems({ categories, orders, offers, comboOffers: resolvedComboOffers, events }));
    setPopularDishes(derivePopularDishes({ categories, orders }));
    setCrowdPicks(deriveCrowdPicks({ categories, orders }));
    setUpcomingEvents(deriveEvents({ events }));
    setFavouriteCombos(deriveFavouriteCombos({ orders }));
  }, [foodData]);

  /* ── Navigation handlers ── */
  const handlePromoClick = (item) => {
    if (item.type === "offer") {
      // Offer chips → go to Offers page
      navigate("/offers");
    } else if (item.type === "dish") {
      // Dish chips → open FoodList at that dish
      navigate(`/foods/${item.categoryId}/grid`, { state: { dishId: item.dishId } });
    } else if (item.type === "combo") {
      navigate("/combo", { state: { comboOffer: item.comboOffer } });
    } else if (item.type === "event") {
      navigate(item.route || "/events");
    }
  };

  /**
   * Clicking a dish in Popular Dishes → navigate to that category's
   * FoodList page (grid view) and open on that specific dish.
   *
   * FoodList reads location.state.dishId to set initialIndex, so
   * passing it here is enough — no other change needed.
   */
  const handleDishClick = (dish) => {
    // If the dish belongs to a sub-category the route is the sub-category id
    const targetCatId = dish.subCategoryId || dish.categoryId;
    navigate(`/foods/${targetCatId}/grid`, { state: { dishId: dish.id } });
  };

  /**
   * Clicking an event card → navigate to /events, passing the eventId
   * so the events page can scroll / highlight it.
   */
  const handleEventClick = (ev) => {
    navigate("/events", { state: { eventId: ev.id } });
  };

  /**
   * Clicking a favourite combo → open the combo builder page.
   */
  const handleComboClick = (combo) => {
    navigate("/combo");
  };

  /* ── Build category list ── */
  const categoriesToRender = [];

  if (isAuthenticatedUser) {
    categoriesToRender.push(
      { id: "my", name: "My Favourites", image: "/assets/category-assets/pizza.png", route: "/favourites/my" },
      { id: "others", name: "Crowd Picks", image: "/assets/category-assets/crowd.png", route: "/favourites/others" }
    );
  } else {
    categoriesToRender.push({
      id: "others", name: "Crowd Picks", image: "/assets/category-assets/crowd.png", route: "/favourites/others",
    });
  }

  categoriesToRender.push(
    { id: "combo", name: "Combos", image: "/assets/category-assets/combo.png", route: "/combo" },
    { id: "offers", name: "Offers", image: "/assets/category-assets/offers.png", route: "/offers" },
    { id: "events", name: "Events & Booking", image: "/assets/category-assets/events.png", route: "/events" }
  );

  (foodData?.categories || []).forEach((category) => {
    const hasSubCategories = Array.isArray(category.subCategories) && category.subCategories.length > 0;
    const route =
      category.id === "appetizer"
        ? "/appetizer-builder"
        : hasSubCategories
          ? `/subcategory/${category.id}`
          : `/foods/${category.id}/grid`;
    categoriesToRender.push({ id: category.id, name: category.name, image: category.image, route });
  });

  /* ── Preload category images ── */
  useEffect(() => {
    categoriesToRender.forEach((cat) => {
      if (cat.image) { const img = new Image(); img.src = cat.image; }
    });
  }, []);

  return (
    <div className="food-category">

      {/* ── Sticky top bar ── */}
      <div className="view-toggle">
        <PromoCarousel items={promoItems} onCardClick={handlePromoClick} />
        <div className="view-toggle-btns">
          <button
            className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
          >
            <img className="grid-icon" src={gridIcon} alt="" />
          </button>
          <button
            className={`view-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            <img className="list-icon" src={listIcon} alt="" />
          </button>
        </div>
      </div>

      {/* ── Category grid / list ── */}
      <div className={`food-category-container ${viewMode}`}>
        {categoriesToRender.map((category) => (
          <Link
            key={category.id}
            to={category.route}
            className={`food-category-items ${viewMode}
              ${category.id === "my" ? "my-favourites" : ""}
              ${category.id === "others" ? "crowd-picks" : ""}
              ${category.id === "combo" ? "combo-category" : ""}
            `}
          >
            <div className="food-category-image">
              <img src={category.image} alt={category.name} loading="lazy" decoding="async" />
            </div>
            <div className="food-category-name">{category.name}</div>
          </Link>
        ))}
      </div>

    </div>
  );
};

export default FoodCategory;