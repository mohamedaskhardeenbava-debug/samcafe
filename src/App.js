import "./App.css";
import { useEffect, useState, useRef } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import api from "./api";
import socket from "./socket";

// ─── Page Components ───────────────────────────────────────────────────────
import Welcome from "./UserPanel/Welcome";
import FoodCategory from "./UserPanel/FoodCategory";
import AppetizerBuilder from "./UserPanel/AppetizerBuilder";
import SubCategoryPage from "./UserPanel/SubCategoryPage";
import FoodGridList from "./UserPanel/FoodGridList";
import FoodList from "./UserPanel/FoodList";
import FoodListExpanded from "./UserPanel/FoodListExpanded";
import FoodItem from "./UserPanel/FoodItem";
import IngredientDetail from "./UserPanel/IngredientDetail";
import ThankYou from "./UserPanel/ThankYou";
import FloatingBag from "./UserPanel/FloatingBag";

// ─── Favourites ─────────────────────────────────────────────────────────────
import FavouriteCategories from "./UserPanel/FavouriteCategories";
import FavouriteDishList from "./UserPanel/FavouriteDishList";
import FavouriteDishDetail from "./UserPanel/FavouriteDishDetail";
import ComboPage from "./UserPanel/ComboPage";
import FavouriteCombo from "./UserPanel/FavouriteCombo";
import OffersGrid from "./UserPanel/OffersGrid";

// ─── Events ─────────────────────────────────────────────────────────────────
import EventHome from "./UserPanel/EventHome";
import EventsPage from "./UserPanel/EventsPage";
import ReservationForm from "./UserPanel/ReservationForm";
import CelebrationForm from "./UserPanel/CelebrationForm";
import PreBooking from "./UserPanel/PreBooking";
import CateringForm from "./UserPanel/CateringForm";

// ─── Shared Components ───────────────────────────────────────────────────────
import PageLoader from "./components/PageLoader";

// ─── Assets ─────────────────────────────────────────────────────────────────
import bellSound from "./assets/sounds/bell.mp3";
import bellGif from "./assets/bell/bell.gif";
import bellStatic from "./assets/bell/bell-static.png";
import { normalizeBagItem, findMatchingBagIndex } from "./UserPanel/shared/normalizeBagItem";
import { getUnitPrice } from "./UserPanel/shared/bagUtils";

// ─── Page transition config ──────────────────────────────────────────────────
const pageVariants = {
  initial: (direction) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
  animate: { opacity: 1, x: 0 },
  exit: (direction) => ({ opacity: 0, x: direction > 0 ? -100 : 100 }),
};

const pageTransition = { duration: 0.3, ease: "linear" };

// ─── Routes that hide the FloatingBag ───────────────────────────────────────
const EVENT_PATHS = [
  "/events/reservation",
  "/events/celebration",
  "/events/events",
  "/events/prebooking",
  "/events/catering",
  "/events/hosted",
  "/events",
  "/events/home",
];

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // ─── State ────────────────────────────────────────────────────────────────
  const [isBagOpen, setIsBagOpen] = useState(true);
  const [direction, setDirection] = useState(1);
  const [lastAction, setLastAction] = useState("forward");
  const [bag, setBag] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRinging, setIsRinging] = useState(false);
  const [isDineIn, setIsDineIn] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [foodData, setFoodData] = useState({
    categories: [],
    favourites: [],
    combo: [],
    comboOffers: [],
    ingredients: [],
    orders: [],
    offers: [],
    events: [],
  });

  const bellAudioRef = useRef(new Audio(bellSound));
  const bellLoopRef = useRef(null);

  const isExpandedPage = location.pathname.includes("/expanded");
  const isAuthenticatedUser = Boolean(currentUser?.id);

  const motionProps = {
    variants: pageVariants,
    initial: "initial",
    animate: "animate",
    exit: "exit",
    transition: pageTransition,
    custom: direction,
  };

  // ─── Data Fetching ────────────────────────────────────────────────────────
  const fetchMenu = async () => {
    setMenuLoading(true);
    try {
      const [categoriesRes, ingredientsRes, favouritesRes, comboRes, offersRes, tablesRes, eventsRes, ordersRes] =
        await Promise.all([
          api.get("/categories"),
          api.get("/ingredients"),
          api.get("/favourites"),
          api.get("/combo"),
          api.get("/offers"),
          api.get("/tables"),
          api.get("/events").catch(() => ({ data: [] })),
          api.get("/orders").catch(() => ({ data: [] })),
        ]);

      setFoodData((prev) => ({
        ...prev,
        categories: categoriesRes.data || [],
        ingredients: ingredientsRes.data || [],
        favourites: favouritesRes.data || [],
        combo: comboRes.data || [],
        comboOffers: comboRes.data || [],
        offers: offersRes.data || [],
        tables: tablesRes.data?.[0]?.list || [],
        events: eventsRes.data || [],
        orders: ordersRes.data || [],
      }));
      setConnectionError(false);
      setInitialLoading(false);
    } catch (err) {
      console.error("Failed to load menu", err);
      setConnectionError(true);
    } finally {
      setMenuLoading(false);
    }
  };

  // ─── User Init ────────────────────────────────────────────────────────────
  useEffect(() => {
    const initUser = async () => {
      const rawUserId = localStorage.getItem("userId");
      if (!rawUserId) return;

      const userId = rawUserId.replace(/^user_/, "");

      try {
        const res = await api.get(`/users/${userId}`);
        setCurrentUser(res.data);
      } catch {
        localStorage.removeItem("userId");
        setCurrentUser(null);
      }
    };
    initUser();
  }, []);

  useEffect(() => {
    const tableNo = localStorage.getItem("tableNo");
    setIsDineIn(!!tableNo);
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const table = params.get("table");
    if (table) {
      localStorage.setItem("tableNo", table);
      setIsDineIn(true);
    }
  }, []);

  useEffect(() => { fetchMenu(); }, []);
  useEffect(() => { fetchMenu(); }, [currentUser]);

  // Auto-retry the initial connection if it failed, so the user isn't
  // stuck on "Reconnecting…" forever without another attempt being made.
  useEffect(() => {
    if (!initialLoading || !connectionError) return;
    const retryTimer = setTimeout(() => { fetchMenu(); }, 3000);
    return () => clearTimeout(retryTimer);
  }, [initialLoading, connectionError]);

  // ─── Scroll to Top on Route Change ───────────────────────────────────────
  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector(".App")?.scrollTo(0, 0);
  }, [location.pathname]);

  // ─── Navigation Direction Reset ──────────────────────────────────────────
  useEffect(() => {
    if (lastAction === "back") {
      const timer = setTimeout(() => {
        setDirection(1);
        setLastAction("forward");
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, lastAction]);

  // ─── Socket: Data Changes ─────────────────────────────────────────────────
  useEffect(() => {
    const MENU_RESOURCES = ["ingredients", "categories", "favourites", "combo", "offers", "events"];

    socket.on("data-change", ({ resource, action, payload }) => {
      if (resource === "orders") {
        setFoodData((prev) => ({
          ...prev,
          orders:
            action === "created"
              ? [...prev.orders, payload]
              : prev.orders.map((o) => (o.id === payload.id ? payload : o)),
        }));
      }
      if (MENU_RESOURCES.includes(resource)) fetchMenu();
    });

    return () => socket.off("data-change");
  }, []);

  // ─── Bell Audio Helpers ───────────────────────────────────────────────────
  const startBellAudio = () => {
    const audio = bellAudioRef.current;
    if (!audio) return;

    if (bellLoopRef.current) {
      audio.removeEventListener("ended", bellLoopRef.current);
      bellLoopRef.current = null;
    }

    const loop = () => { audio.currentTime = 0; audio.play().catch(() => { }); };
    audio.addEventListener("ended", loop);
    bellLoopRef.current = loop;
    audio.currentTime = 0;
    audio.play().catch(() => { });
  };

  const stopBellAudio = () => {
    const audio = bellAudioRef.current;
    if (!audio) return;
    if (bellLoopRef.current) {
      audio.removeEventListener("ended", bellLoopRef.current);
      bellLoopRef.current = null;
    }
    audio.pause();
    audio.currentTime = 0;
  };

  // ─── Socket: Bell ─────────────────────────────────────────────────────────
  useEffect(() => {
    const myTable = localStorage.getItem("tableNo");

    const handleSync = (activeBells) => {
      if (myTable && activeBells[myTable]) { setIsRinging(true); startBellAudio(); }
    };
    const handleBellOff = ({ tableNo }) => {
      if (tableNo === localStorage.getItem("tableNo")) { setIsRinging(false); stopBellAudio(); }
    };
    const handleBellRing = ({ tableNo }) => {
      if (tableNo === localStorage.getItem("tableNo")) { setIsRinging(true); startBellAudio(); }
    };

    socket.on("bell-sync", handleSync);
    socket.on("bell-off", handleBellOff);
    socket.on("bell-ring", handleBellRing);

    return () => {
      socket.off("bell-sync", handleSync);
      socket.off("bell-off", handleBellOff);
      socket.off("bell-ring", handleBellRing);
    };
  }, []);

  // ─── Bag: Fly-to-bag image reveal ────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      setBag((prev) => {
        if (!prev.length) return prev;
        const copy = [...prev];
        copy[copy.length - 1] = { ...copy[copy.length - 1], __pendingImage: false };
        return copy;
      });
    };
    window.addEventListener("REVEAL_LAST_BAG_IMAGE", handler);
    return () => window.removeEventListener("REVEAL_LAST_BAG_IMAGE", handler);
  }, []);

  // ─── Bag Actions ──────────────────────────────────────────────────────────
  const addToBag = (rawItem) => {
    setBag((prev) => {
      const item = normalizeBagItem(rawItem, foodData);
      const matchIndex = findMatchingBagIndex(prev, item);

      if (matchIndex !== -1) {
        return prev.map((p, i) =>
          i === matchIndex
            ? { ...p, quantity: p.quantity + item.quantity, totalPrice: p.unitPrice * (p.quantity + item.quantity) }
            : p
        );
      }
      return [...prev, item];
    });
  };

  const increaseQty = (index) => {
    setBag((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const unit = getUnitPrice(item);
        const newQty = Number(item.quantity || 1) + 1;
        return { ...item, quantity: newQty, totalPrice: unit * newQty };
      })
    );
  };

  const decreaseQty = (index) => {
    setBag((prev) =>
      prev
        .map((item, i) => {
          if (i !== index) return item;
          const unit = getUnitPrice(item);
          const newQty = Number(item.quantity || 1) - 1;
          return { ...item, quantity: newQty, totalPrice: unit * newQty };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const updateBagItem = (index, updatedItem) => {
    setBag((prev) => prev.map((item, i) => (i === index ? updatedItem : item)));
  };

  // ─── Navigation Helpers ───────────────────────────────────────────────────
  const handleBack = (e) => { e?.preventDefault(); setDirection(-1); setLastAction("back"); navigate(-1); };
  const handleHome = (e) => { e?.preventDefault(); setDirection(-1); setLastAction("back"); navigate("/categories"); };
  const handleNavigate = (path) => { setDirection(1); setLastAction("forward"); navigate(path); };

  // ─── User Helpers ─────────────────────────────────────────────────────────
  const toCamelCase = (value = "") => {
    const hasTrailingSpace = value.endsWith(" ");
    const formatted = value
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    return hasTrailingSpace ? formatted + " " : formatted;
  };

  const handleRingBell = () => {
    const tableNo = localStorage.getItem("tableNo") || "Guest";
    if (isRinging) return;
    socket.emit("bell-ring", { tableNo });
    setIsRinging(true);
    startBellAudio();
  };

  // ─── Favourites Toggle ────────────────────────────────────────────────────
  const onToggleFavourite = async (dish) => {
    try {
      const userId = localStorage.getItem("userId");

      // Guest user — localStorage only
      if (!userId) {
        const guestFavs = JSON.parse(localStorage.getItem("guestFavourites")) || [];
        const exists = guestFavs.some((f) => f.id === dish.id);
        const updated = exists ? guestFavs.filter((f) => f.id !== dish.id) : [...guestFavs, dish];
        localStorage.setItem("guestFavourites", JSON.stringify(updated));
        return;
      }

      const userRes = await api.get(`/users/${userId}`);
      const user = userRes.data;
      const enrichedDish = { ...dish, userId, customerName: user.name || "Guest" };

      const userFavourites = Array.isArray(user.favourites) ? user.favourites : [];
      const existsInUser = userFavourites.some((f) => f.id === enrichedDish.id);

      const favsRes = await api.get("/favourites");
      const menuFavourites = Array.isArray(favsRes.data) ? favsRes.data : [];
      const existsInMenu = menuFavourites.some((f) => f.id === enrichedDish.id);

      if (existsInUser || existsInMenu) {
        if (existsInMenu) await api.delete(`/favourites/${enrichedDish.id}`);
        setFoodData((prev) => ({ ...prev, favourites: menuFavourites.filter((f) => f.id !== enrichedDish.id) }));
        const updatedUser = { ...user, favourites: userFavourites.filter((f) => f.id !== enrichedDish.id) };
        await api.put(`/users/${userId}`, updatedUser);
        setCurrentUser(updatedUser);
      } else {
        if (!existsInMenu) {
          await api.post("/favourites", enrichedDish);
          setFoodData((prev) => ({ ...prev, favourites: [...menuFavourites, enrichedDish] }));
        }
        const updatedUser = { ...user, favourites: [...userFavourites, enrichedDish] };
        await api.put(`/users/${userId}`, updatedUser);
        setCurrentUser(updatedUser);
      }
    } catch (err) {
      console.error("Favourite toggle failed:", err);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <div className="App">
        <PageLoader
          label={connectionError ? "Reconnecting to the server…" : "Connecting to the server…"}
        />
      </div>
    );
  }

  return (
    <LayoutGroup>
      <div className="App">

        {/* Floating Bag — hidden on event pages */}
        {!EVENT_PATHS.includes(location.pathname) && (
          <FloatingBag
            bag={bag}
            increaseQty={increaseQty}
            decreaseQty={decreaseQty}
            isOpen={isBagOpen}
            setIsOpen={setIsBagOpen}
          />
        )}

        {/* Floating Bell — dine-in only */}
        {isDineIn && (
          <div
            className="floating-bell-wrapper"
            onClick={handleRingBell}
            title={isRinging ? "Attender called – waiting for response" : "Call the attender"}
          >
            <button
              className={`floating-bell ${isRinging ? "ringing" : ""}`}
              disabled={isRinging}
              aria-label="Call attender"
            >
              <img
                key={isRinging ? "animated" : "static"}
                src={isRinging ? bellGif : bellStatic}
                alt="Call Attender"
                className="bell-image"
              />
            </button>
            <div className="bell-tooltip">
              {isRinging ? "Attender is on the way!" : "Click to call the attender"}
            </div>
          </div>
        )}

        {/* Routes */}
        {isExpandedPage ? (
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location}>
              <Route
                path="/foods/:categoryId/expanded"
                element={
                  <div>
                    <FoodListExpanded
                      foodData={foodData}
                      addToBag={addToBag}
                      handleBack={handleBack}
                      handleHome={handleHome}
                    />
                  </div>
                }
              />
            </Routes>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>

              <Route path="/" element={<motion.div {...motionProps}><Welcome handleNavigate={handleNavigate} toCamelCase={toCamelCase} setCurrentUser={setCurrentUser} fetchMenu={fetchMenu} /></motion.div>} />

              <Route path="/categories" element={<motion.div {...motionProps}><FoodCategory foodData={foodData} handleNavigate={handleNavigate} currentUser={currentUser} /></motion.div>} />

              <Route path="/appetizer-builder" element={<AppetizerBuilder foodData={foodData} addToBag={addToBag} handleBack={handleBack} handleHome={handleHome} />} />

              <Route path="/foods/:categoryId" element={<motion.div {...motionProps}><FoodList foodData={foodData} handleNavigate={handleNavigate} handleBack={handleBack} handleHome={handleHome} addToBag={addToBag} currentUser={currentUser} setCurrentUser={setCurrentUser} /></motion.div>} />

              <Route path="/subcategory/:categoryId" element={<motion.div {...motionProps}><SubCategoryPage foodData={foodData} handleNavigate={handleNavigate} handleBack={handleBack} handleHome={handleHome} /></motion.div>} />

              <Route path="foods/:categoryId/grid" element={<motion.div {...motionProps}><FoodGridList foodData={foodData} handleNavigate={handleNavigate} handleBack={handleBack} handleHome={handleHome} addToBag={addToBag} currentUser={currentUser} setCurrentUser={setCurrentUser} /></motion.div>} />

              <Route path="/food/:id" element={<motion.div {...motionProps}><FoodItem foodData={foodData} onToggleFavourite={onToggleFavourite} addToBag={addToBag} updateBagItem={updateBagItem} setDirection={setDirection} setLastAction={setLastAction} toCamelCase={toCamelCase} handleHome={handleHome} handleBack={handleBack} currentUser={currentUser} /></motion.div>} />

              <Route path="/ingredient/:id" element={<motion.div {...motionProps}><IngredientDetail handleBack={handleBack} foodData={foodData} handleNavigate={handleNavigate} /></motion.div>} />

              <Route path="/thank-you" element={<motion.div {...motionProps}><ThankYou bag={bag} setBag={setBag} setIsBagOpen={setIsBagOpen} /></motion.div>} />

              <Route path="/favourites/:source" element={<motion.div {...motionProps}><FavouriteCategories foodData={foodData} currentUser={currentUser} handleBack={handleBack} handleHome={handleHome} /></motion.div>} />

              <Route path="/favourites/:source/category/:categoryId" element={<motion.div {...motionProps}><FavouriteDishList foodData={foodData} currentUser={currentUser} setCurrentUser={setCurrentUser} handleBack={handleBack} handleHome={handleHome} /></motion.div>} />

              <Route path="/favourites/:source/dish/:dishId" element={<motion.div {...motionProps}><FavouriteDishDetail foodData={foodData} handleBack={handleBack} addToBag={addToBag} handleHome={handleHome} currentUser={currentUser} /></motion.div>} />

              <Route path="/combo" element={<motion.div {...motionProps}><ComboPage foodData={foodData} comboOfferRules={foodData.comboOffers || []} addToBag={addToBag} updateBagItem={updateBagItem} handleBack={handleBack} currentUser={currentUser} setCurrentUser={setCurrentUser} /></motion.div>} />

              <Route path="/favourite-combos" element={isAuthenticatedUser ? <motion.div {...motionProps}><FavouriteCombo currentUser={currentUser} setCurrentUser={setCurrentUser} addToBag={addToBag} handleBack={handleBack} /></motion.div> : <Navigate to="/categories" replace />} />

              <Route path="/offers" element={<motion.div {...motionProps}><OffersGrid foodData={foodData} addToBag={addToBag} handleBack={() => navigate(-1)} handleHome={() => navigate("/categories")} /></motion.div>} />

              <Route path="/events" element={<motion.div {...motionProps}><EventHome handleBack={handleBack} handleHome={handleHome} /></motion.div>} />
              <Route path="/events/hosted" element={<motion.div {...motionProps}><EventsPage handleBack={handleBack} handleHome={handleHome} currentUser={currentUser} /></motion.div>} />
              <Route path="/events/reservation" element={<motion.div {...motionProps}><ReservationForm foodData={foodData} bag={bag} setBag={setBag} handleBack={handleBack} handleHome={handleHome} /></motion.div>} />
              <Route path="/events/celebration" element={<motion.div {...motionProps}><CelebrationForm bag={bag} setBag={setBag} handleBack={handleBack} handleHome={handleHome} navigateToCatering={() => handleNavigate("/events/catering")} /></motion.div>} />
              <Route path="/events/prebooking" element={<motion.div {...motionProps}><PreBooking bag={bag} setBag={setBag} handleBack={handleBack} handleHome={handleHome} /></motion.div>} />
              <Route path="/events/catering" element={<motion.div {...motionProps}><CateringForm bag={bag} setBag={setBag} handleBack={handleBack} handleHome={handleHome} /></motion.div>} />

            </Routes>
          </AnimatePresence>
        )}

      </div>
    </LayoutGroup>
  );
}

export default App;