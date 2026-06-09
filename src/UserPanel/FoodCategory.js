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
      type: "popular",
      badge: `${count} orders`,
      badgeColor: "pop",
      discount: "Most ordered",
      title: dish.name,
      price: `₹${dish.basePrice}`,
      oldPrice: null,
      image: dish.image,
      cta: "Order now",
      categoryId: dish._catId,
      dishId: dish.id,
      orderCount: count,
    });
    break;
  }

  /* 3. Published / upcoming events */
  const today = new Date().toISOString().slice(0, 10);
  for (const ev of events || []) {
    if (!ev.isPublished) continue;
    if (ev.status !== "upcoming" && ev.date < today) continue;
    chips.push({
      id: `event-${ev.id}`,
      type: "event",
      image: ev.image || null,
      badge: fmtDate(ev.date),
      badgeColor: "event",
      discount: ev.highlights?.[0] || null,
      title: ev.title,
      price: ev.price ? `₹${ev.price}` : null,
      oldPrice: null,
      cta: "Book now",
      eventId: ev.id,
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
        type: "new",
        badge: "New Arrival",
        badgeColor: "pop",
        discount: "Just added",
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

/* ═══════════════════════════════════════════════
   PROMO CARD
═══════════════════════════════════════════════ */
const PromoCard = ({ item, onClick }) => {
  return (
    <button
      className={`pc-card pc-card--${item.type}`}
      onClick={() => onClick(item)}
      aria-label={item.title}
    >
      {/* Image / icon block */}
      <div className="pc-card__media">
        <img src={item.image} alt={item.title} loading="lazy" />
      </div>

      {/* Info */}
      <div className="pc-card__body">
        {/* Top row: type pill + badge */}
        <div className="pc-card__top">
          {item.badge && <span className="pc-card__badge">{item.badge}</span>}
        </div>

        {/* Title */}
        <p className="pc-card__title">{item.title}</p>

        {/* Bottom row: price + CTA */}
        <div className="pc-card__bottom">
          <div className="pc-card__price-group">
            {item.price && <span className="pc-card__price">{item.price}</span>}
            {item.oldPrice && <span className="pc-card__old-price">{item.oldPrice}</span>}
            {item.discount && !item.price && <span className="pc-card__discount">{item.discount}</span>}
          </div>
          <span className="pc-card__cta">{item.cta} →</span>
        </div>
      </div>
    </button>
  );
};

/* ─────────────────────────────────────────────
   Hook: returns window inner-width, debounced
───────────────────────────────────────────── */
function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    let raf;
    const handler = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setWidth(window.innerWidth)); };
    window.addEventListener("resize", handler);
    return () => { window.removeEventListener("resize", handler); cancelAnimationFrame(raf); };
  }, []);
  return width;
}

/* ─────────────────────────────────────────────
   Derive pageSize from viewport width:
     ≥ 1200px → 4 cards per page
     992–1199px → 3 cards per page
     768–991px  → 2 cards per page
     < 768px    → 1 card per page
───────────────────────────────────────────── */
function getPageSize(width) {
  if (width >= 1200) return 4;
  if (width >= 992) return 3;
  if (width >= 768) return 2;
  return 1;
}

/* ═══════════════════════════════════════════════
   PROMO CAROUSEL — responsive infinite page loop
   Pages are grouped by pageSize (3 / 2 / 1).
   Track layout: [clone-of-last-page, ...pages, clone-of-first-page]
   Page index is offset by 1 so index 0 = pages[0].
   On transitionEnd, landing on a clone silently
   snaps to its real twin — seamless infinite loop.
═══════════════════════════════════════════════ */
const PromoCarousel = ({ items, onCardClick }) => {
  const width = useWindowWidth();
  const pageSize = getPageSize(width);

  // Build pages from items based on current pageSize.
  // The last page is circularly filled with items from the start so every
  // page is always exactly `pageSize` cards — no empty slots, seamless loop.
  const pages = [];
  if (items.length > 0) {
    for (let i = 0; i < items.length; i += pageSize) {
      const slice = items.slice(i, i + pageSize);
      if (slice.length < pageSize) {
        // Fill the remainder by wrapping around from the beginning.
        // Use a unique key suffix so React doesn't confuse them with the
        // originals that are already visible on the first page.
        const needed = pageSize - slice.length;
        const fillers = items.slice(0, needed).map((item) => ({
          ...item,
          id: `${item.id}__fill`,
        }));
        pages.push([...slice, ...fillers]);
      } else {
        pages.push(slice);
      }
    }
  }
  const PAGE_COUNT = pages.length;

  // Extended track: [clone-of-last-page, ...pages, clone-of-first-page]
  const extended = PAGE_COUNT > 0
    ? [pages[PAGE_COUNT - 1], ...pages, pages[0]]
    : [];

  // Current index into `extended`; 1 = first real page
  const [idx, setIdx] = useState(1);
  const [animated, setAnimated] = useState(true);

  const startXRef = useRef(null);
  const autoRef = useRef(null);

  // Dot index: which real page we're on (0-based)
  const dotIdx = ((idx - 1) % PAGE_COUNT + PAGE_COUNT) % PAGE_COUNT;

  // When pageSize changes (resize), reset to page 1 without animation
  const prevPageSize = useRef(pageSize);
  useEffect(() => {
    if (prevPageSize.current !== pageSize) {
      prevPageSize.current = pageSize;
      setAnimated(false);
      setIdx(1);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
    }
  }, [pageSize]);

  const step = useCallback((dir) => {
    setAnimated(true);
    setIdx((prev) => prev + dir);
  }, []);

  const goToPage = useCallback((pageIdx) => {
    setAnimated(true);
    setIdx(pageIdx + 1);
  }, []);

  /* Auto-play */
  const resetAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => step(1), 4500);
  }, [step]);

  useEffect(() => {
    if (PAGE_COUNT < 2) return;
    resetAuto();
    return () => clearInterval(autoRef.current);
  }, [resetAuto, PAGE_COUNT]);

  /* Seamless infinite: snap from clone to real twin after transition */
  const handleTransitionEnd = useCallback(() => {
    if (idx === 0) {
      setAnimated(false);
      setIdx(PAGE_COUNT);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
    } else if (idx === PAGE_COUNT + 1) {
      setAnimated(false);
      setIdx(1);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
    }
  }, [idx, PAGE_COUNT]);

  /* Swipe support */
  const onTouchStart = (e) => { startXRef.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (startXRef.current === null) return;
    const dx = startXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) { step(dx > 0 ? 1 : -1); resetAuto(); }
    startXRef.current = null;
  };

  if (!items.length) return null;

  return (
    <div className="pc-root" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <button
        className="pc-arrow pc-arrow-left"
        onClick={() => { step(-1); resetAuto(); }}
        aria-label="Previous"
      />

      <div className="pc-viewport">
        <div
          className="pc-track"
          style={{
            width: `${extended.length * 100}%`,
            transform: `translateX(-${(idx / extended.length) * 100}%)`,
            transition: animated ? "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extended.map((group, gi) => (
            <div key={gi} className={`pc-page pc-page--${pageSize}`} style={{ width: `${100 / extended.length}%`, flex: `0 0 ${100 / extended.length}%` }}>
              {group.map((item) => (
                <PromoCard key={item.id} item={item} onClick={onCardClick} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <button
        className="pc-arrow pc-arrow-right"
        onClick={() => { step(1); resetAuto(); }}
        aria-label="Next"
      />

      {/* Dots — one per page (count changes with pageSize) */}
      {PAGE_COUNT > 1 && (
        <div className="pc-dots">
          {pages.map((_, i) => (
            <button
              key={i}
              className={`pc-dot ${i === dotIdx ? "active" : ""}`}
              onClick={() => { goToPage(i); resetAuto(); }}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
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

  // Promo carousel cards
  const handlePromoClick = (item) => {
    if (item.type === "offer") {
      // Offer → Offers page
      navigate("/offers");
    } else if (item.type === "dish" || item.type === "popular" || item.type === "new") {
      // Dish / popular / new arrival → FoodListExpanded so the dish is the focus
      navigate(`/foods/${item.categoryId}/expanded`, {
        state: { dishId: item.dishId, fromPromo: true }
      });
    } else if (item.type === "combo") {
      // Combo offer → Combo builder, pre-seeded with that offer
      navigate("/combo", { state: { comboOffer: item.comboOffer } });
    } else if (item.type === "event") {
      navigate("/events/hosted", { state: { eventId: item.eventId } });
    }
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
            <span className="shadow"></span>
            <span className="edge"></span>
            <span className="front">
              <img className="grid-icon" src={gridIcon} alt="" />
            </span>
          </button>
          <button
            className={`view-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            <span className="shadow"></span>
            <span className="edge"></span>
            <span className="front">
              <img className="list-icon" src={listIcon} alt="" />
            </span>
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