import "./App.css"; //user panel
import { useEffect, useState, useRef } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import api from "./api";
import socket from "./socket";

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
//import TableScanner from "./UserPanel/TableScanner";

import FavouriteCategories from "./UserPanel/FavouriteCategories";
import FavouriteDishList from "./UserPanel/FavouriteDishList";
import FavouriteDishDetail from "./UserPanel/FavouriteDishDetail";
import ComboPage from "./UserPanel/ComboPage";
import FavouriteCombo from "./UserPanel/FavouriteCombo";
import OffersGrid from "./UserPanel/OffersGrid";

import EventHome from "./UserPanel/EventHome";
import EventsPage from "./UserPanel/EventsPage";
import ReservationForm from "./UserPanel/ReservationForm";
import CelebrationForm from "./UserPanel/CelebrationForm";
import PreBooking from "./UserPanel/PreBooking";
import CateringForm from "./UserPanel/CateringForm";

import bellSound from "./assets/sounds/bell.mp3";
import bellGif from "./assets/bell/bell.gif";
import bellStatic from "./assets/bell/bell-static.png";
import { normalizeBagItem, findMatchingBagIndex } from "./UserPanel/shared/normalizeBagItem";
import { getUnitPrice } from "./UserPanel/shared/bagUtils";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isBagOpen, setIsBagOpen] = useState(true);
  const [direction, setDirection] = useState(1);
  const [lastAction, setLastAction] = useState("forward");
  const [bag, setBag] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRinging, setIsRinging] = useState(false);
  const [isDineIn, setIsDineIn] = useState(false);

  const isExpandedPage = location.pathname.includes("/expanded");
  const bellAudioRef = useRef(new Audio(bellSound));
  // Keep a ref to the looping interval so we can clear it
  const bellLoopRef = useRef(null);

  const isAuthenticatedUser = Boolean(currentUser?.id);

  const fetchMenu = async () => {
    try {
      const [categoriesRes, ingredientsRes, favouritesRes, comboRes, offersRes, tablesRes, eventsRes, ordersRes] = await Promise.all([
        api.get("/categories"),
        api.get("/ingredients"),
        api.get("/favourites"),
        api.get("/combo"),
        api.get("/offers"),
        api.get("/tables"),
        api.get("/events").catch(() => ({ data: [] })),
        api.get("/orders").catch(() => ({ data: [] })),
      ]);

      setFoodData(prev => ({
        ...prev,
        categories: categoriesRes.data || [],
        ingredients: ingredientsRes.data || [],
        favourites: favouritesRes.data || [],
        combo: comboRes.data || [],
        comboOffers: comboRes.data || [],   // alias so FoodCategory can read comboOffers
        offers: offersRes.data || [],
        tables: tablesRes.data?.[0]?.list || [],
        events: eventsRes.data || [],
        orders: ordersRes.data || [],
      }));
    } catch (err) {
      console.error("Failed to load menu", err);
    }
  };

  useEffect(() => {
    const initUser = async () => {
      const rawUserId = localStorage.getItem("userId");
      if (!rawUserId) return;

      // 🔒 normalize id (remove accidental prefix)
      const userId = rawUserId.replace(/^user_/, "");

      try {
        const res = await api.get(`/users/${userId}`);
        setCurrentUser(res.data);
      } catch (err) {
        console.warn("User not found, clearing session");

        // 🔥 CRITICAL CLEANUP
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

  const addToBag = (rawItem) => {
    setBag(prev => {
      const item = normalizeBagItem(rawItem, foodData);

      const matchIndex = findMatchingBagIndex(prev, item);

      if (matchIndex !== -1) {
        return prev.map((p, i) =>
          i === matchIndex
            ? {
              ...p,
              quantity: p.quantity + item.quantity,
              totalPrice:
                p.unitPrice * (p.quantity + item.quantity)
            }
            : p
        );
      }

      return [...prev, item];
    });
  };

  // 👇 ADD THIS ONCE (useEffect)
  useEffect(() => {
    const handler = () => {
      setBag(prev => {
        if (!prev.length) return prev;

        const copy = [...prev];
        const lastIndex = copy.length - 1;

        copy[lastIndex] = {
          ...copy[lastIndex],
          __pendingImage: false
        };

        return copy;
      });
    };

    window.addEventListener("REVEAL_LAST_BAG_IMAGE", handler);
    return () =>
      window.removeEventListener("REVEAL_LAST_BAG_IMAGE", handler);
  }, []);

  const increaseQty = (index) => {
    setBag(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const unit = getUnitPrice(item);
        const newQty = Number(item.quantity || 1) + 1;

        return {
          ...item,
          quantity: newQty,
          totalPrice: unit * newQty
        };
      })
    );
  };

  const decreaseQty = (index) => {
    setBag(prev =>
      prev
        .map((item, i) => {
          if (i !== index) return item;

          const unit = getUnitPrice(item);
          const newQty = Number(item.quantity || 1) - 1;

          return {
            ...item,
            quantity: newQty,
            totalPrice: unit * newQty
          };
        })
        .filter(item => item.quantity > 0)
    );
  };

  const toCamelCase = (value = "") => {
    // preserve trailing space while typing
    const hasTrailingSpace = value.endsWith(" ");

    const formatted = value
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map(
        word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(" ");

    return hasTrailingSpace ? formatted + " " : formatted;
  };

  const handleBack = (e) => {
    e?.preventDefault();
    setDirection(-1);
    setLastAction("back");
    navigate(-1);
  };

  const handleHome = (e) => {
    e?.preventDefault();
    setDirection(-1);
    setLastAction("back");
    navigate("/categories");
  }

  const handleNavigate = (path) => {
    setDirection(1);
    setLastAction("forward");
    navigate(path);
  };

  useEffect(() => {
    if (lastAction === "back") {
      const timer = setTimeout(() => {
        setDirection(1);
        setLastAction("forward");
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, lastAction]);

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

  const onToggleFavourite = async (dish) => {
    try {
      const userId = localStorage.getItem("userId");

      /* =========================
         1️⃣ GUEST USER — localStorage toggle
         ========================= */
      if (!userId) {
        const guestFavs =
          JSON.parse(localStorage.getItem("guestFavourites")) || [];

        const exists = guestFavs.some(f => f.id === dish.id);

        const updated = exists
          ? guestFavs.filter(f => f.id !== dish.id)
          : [...guestFavs, dish];

        localStorage.setItem("guestFavourites", JSON.stringify(updated));
        return;
      }

      /* =========================
         2️⃣ PREPARE DISH OBJECT
         ========================= */
      const userRes = await api.get(`/users/${userId}`);
      const user = userRes.data;

      const enrichedDish = {
        ...dish,
        userId,
        customerName: user.name || "Guest"
      };

      const userFavourites = Array.isArray(user.favourites) ? user.favourites : [];
      const existsInUser = userFavourites.some(f => f.id === enrichedDish.id);

      const favsRes = await api.get("/favourites");
      const menuFavourites = Array.isArray(favsRes.data) ? favsRes.data : [];
      const existsInMenu = menuFavourites.some(f => f.id === enrichedDish.id);

      const isFavourited = existsInUser || existsInMenu;

      if (isFavourited) {
        /* =========================
           3️⃣ REMOVE FROM /favourites + USER.FAVOURITES
           ========================= */
        if (existsInMenu) {
          await api.delete(`/favourites/${enrichedDish.id}`);
        }

        setFoodData(prev => ({
          ...prev,
          favourites: menuFavourites.filter(f => f.id !== enrichedDish.id)
        }));

        const updatedUser = {
          ...user,
          favourites: userFavourites.filter(f => f.id !== enrichedDish.id)
        };

        await api.put(`/users/${userId}`, updatedUser);
        setCurrentUser(updatedUser);
      } else {
        /* =========================
           3️⃣ ADD TO /favourites + USER.FAVOURITES
           ========================= */
        if (!existsInMenu) {
          await api.post("/favourites", enrichedDish);

          setFoodData(prev => ({
            ...prev,
            favourites: [...menuFavourites, enrichedDish]
          }));
        }

        const updatedUser = {
          ...user,
          favourites: [...userFavourites, enrichedDish]
        };

        await api.put(`/users/${userId}`, updatedUser);
        setCurrentUser(updatedUser);
      }
    } catch (err) {
      console.error("Favourite toggle failed:", err);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [currentUser]);

  // Theme loading and live socket updates are handled by ThemeContext.
  // Do NOT add theme logic here — it would double-apply and conflict.

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const table = params.get("table");

    if (table) {
      localStorage.setItem("tableNo", table);
      setIsDineIn(true);
    }
  }, []);

  useEffect(() => {

    socket.on("data-change", ({ resource, action, payload }) => {

      if (resource === "orders") {
        setFoodData(prev => ({
          ...prev,
          orders:
            action === "created"
              ? [...prev.orders, payload]
              : prev.orders.map(o => o.id === payload.id ? payload : o)
        }));
      }

      if (
        resource === "ingredients" ||
        resource === "categories" ||
        resource === "favourites" ||
        resource === "combo" ||
        resource === "offers" ||
        resource === "events"
      ) {
        fetchMenu();
      }

    });

    return () => socket.off("data-change");

  }, []);

  /* ─────────────────────────────────────────────────────────────────────
     🔔 BELL — Helpers
  ───────────────────────────────────────────────────────────────────── */

  /**
   * Start looping the bell audio until stopBellAudio() is called.
   * Uses an ended-listener pattern so the loop works even on mobile,
   * where audio.loop is sometimes unreliable.
   */
  const startBellAudio = () => {
    const audio = bellAudioRef.current;
    if (!audio) return;

    // Remove any existing loop listener before adding a new one,
    // so calling startBellAudio twice (e.g. on reconnect / bell-sync)
    // never stacks duplicate listeners.
    if (bellLoopRef.current) {
      audio.removeEventListener("ended", bellLoopRef.current);
      bellLoopRef.current = null;
    }

    const loop = () => {
      audio.currentTime = 0;
      audio.play().catch(() => { });
    };

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

  /* ─────────────────────────────────────────────────────────────────────
     🔔 BELL — Socket listeners (mount once)
  ───────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    // Captured once at mount for handleSync (table is set before mount via URL param)
    const myTable = localStorage.getItem("tableNo");

    // Sync existing state when first connecting
    const handleSync = (activeBells) => {
      if (myTable && activeBells[myTable]) {
        setIsRinging(true);
        startBellAudio();
      }
    };

    // Admin turned off the bell for THIS table
    const handleBellOff = ({ tableNo }) => {
      const currentTable = localStorage.getItem("tableNo");
      if (tableNo === currentTable) {
        setIsRinging(false);
        stopBellAudio();
      }
    };

    // Another tab / the same table rung the bell (shouldn't usually
    // happen but keeps state consistent if admin re-rings somehow)
    const handleBellRing = ({ tableNo }) => {
      const currentTable = localStorage.getItem("tableNo");
      if (tableNo === currentTable) {
        setIsRinging(true);
        startBellAudio();
      }
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

  useEffect(() => {
    window.scrollTo(0, 0);
    // Also scroll the .App container in case it's the actual overflow/scroll element
    const appEl = document.querySelector(".App");
    if (appEl) appEl.scrollTo(0, 0);
  }, [location.pathname]);

  /* ─────────────────────────────────────────────────────────────────────
     🔔 BELL — User taps the floating bell button
  ───────────────────────────────────────────────────────────────────── */
  const handleRingBell = () => {
    const tableNo = localStorage.getItem("tableNo") || "Guest";
    if (isRinging) return;

    // Tell the server (which will broadcast to admin + echo back)
    socket.emit("bell-ring", { tableNo });

    // Start local audio immediately (don't wait for socket echo)
    setIsRinging(true);
    startBellAudio();
  };

  // if (loading) return <div className="app-loading">Loading menu...</div>;
  // if (error) return <div className="app-error">Failed to load menu</div>;

  const pageVariants = {
    initial: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: (direction) => ({
      opacity: 0,
      x: direction > 0 ? -100 : 100,
    }),
  };

  const pageTransition = {
    duration: 0.3,
    ease: "linear",
  };

  const motionProps = {
    variants: pageVariants,
    initial: "initial",
    animate: "animate",
    exit: "exit",
    transition: pageTransition,
    custom: direction,
  };

  const updateBagItem = (index, updatedItem) => {
    setBag(prev =>
      prev.map((item, i) =>
        i === index ? updatedItem : item
      )
    );
  };

  // const clearStorage = () => {
  //   try {
  //     localStorage.clear();
  //     console.log("Local storage cleared");
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // clearStorage();

  return (
    <LayoutGroup>
      <div className="App">
          {![
            "/events/reservation",
            "/events/celebration",
            "/events/events",
            "/events/prebooking",
            "/events/catering",
            "/events/hosted",
            "/events",
            "/events/home"
          ].includes(location.pathname) && (
              <FloatingBag
                bag={bag}
                increaseQty={increaseQty}
                decreaseQty={decreaseQty}
                isOpen={isBagOpen}
                setIsOpen={setIsBagOpen}
              />
            )}

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

          {isExpandedPage ? (
            <AnimatePresence mode="wait" initial={false}>
              <Routes location={location}>
                {/* Expanded page renders with NO exit/enter animation */}
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
                <Route
                  path="/"
                  element={
                    <motion.div {...motionProps}>
                      <Welcome
                        handleNavigate={handleNavigate}
                        toCamelCase={toCamelCase}
                        setCurrentUser={setCurrentUser}
                        fetchMenu={fetchMenu}
                      />
                    </motion.div>
                  }
                />

                <Route
                  path="/categories"
                  element={
                    <motion.div {...motionProps}>
                      <FoodCategory
                        foodData={foodData}
                        handleNavigate={handleNavigate}
                        currentUser={currentUser}
                      />
                    </motion.div>
                  }
                />

                <Route
                  path="/appetizer-builder"
                  element={
                    <AppetizerBuilder
                      foodData={foodData}
                      addToBag={addToBag}
                      handleBack={handleBack}
                      handleHome={handleHome}
                    />
                  }
                />

                <Route
                  path="/foods/:categoryId"
                  element={
                    <motion.div {...motionProps}>
                      <FoodList
                        foodData={foodData}
                        handleNavigate={handleNavigate}
                        handleBack={handleBack}
                        handleHome={handleHome}
                        addToBag={addToBag}
                        currentUser={currentUser}
                        setCurrentUser={setCurrentUser}
                      />
                    </motion.div>
                  }
                />

                <Route
                  path="/subcategory/:categoryId"
                  element={
                    <motion.div {...motionProps}>
                      <SubCategoryPage
                        foodData={foodData}
                        handleNavigate={handleNavigate}
                        handleBack={handleBack}
                        handleHome={handleHome}
                      />
                    </motion.div>
                  }
                />

                <Route
                  path="foods/:categoryId/grid"
                  element={
                    <motion.div {...motionProps}>
                      <FoodGridList
                        foodData={foodData}
                        handleNavigate={handleNavigate}
                        handleBack={handleBack}
                        handleHome={handleHome}
                        addToBag={addToBag}
                        currentUser={currentUser}
                        setCurrentUser={setCurrentUser}
                      />
                    </motion.div>
                  }
                />

                <Route
                  path="/food/:id"
                  element={
                    <motion.div {...motionProps}>
                      <FoodItem
                        foodData={foodData}
                        onToggleFavourite={onToggleFavourite}
                        addToBag={addToBag}
                        updateBagItem={updateBagItem}
                        setDirection={setDirection}
                        setLastAction={setLastAction}
                        toCamelCase={toCamelCase}
                        handleHome={handleHome}
                        handleBack={handleBack}
                        currentUser={currentUser}
                      />
                    </motion.div>
                  }
                />

                <Route
                  path="/ingredient/:id"
                  element={
                    <motion.div {...motionProps}>
                      <IngredientDetail
                        handleBack={handleBack}
                        foodData={foodData}
                        handleNavigate={handleNavigate}
                      />
                    </motion.div>
                  }
                />

                <Route
                  path="/thank-you"
                  element={
                    <motion.div {...motionProps}>
                      <ThankYou
                        bag={bag}
                        setBag={setBag}
                        setIsBagOpen={setIsBagOpen}
                      />
                    </motion.div>

                  }
                />

                {/* FAV CATEGORY PAGE */}
                <Route
                  path="/favourites/:source"
                  element={
                    <motion.div {...motionProps}>
                      <FavouriteCategories
                        foodData={foodData}
                        currentUser={currentUser}
                        handleBack={handleBack}
                        handleHome={handleHome}
                      />
                    </motion.div>
                  }
                />

                {/* FAV DISH LIST PAGE */}
                <Route
                  path="/favourites/:source/category/:categoryId"
                  element={
                    <motion.div {...motionProps}>
                      <FavouriteDishList
                        foodData={foodData}
                        currentUser={currentUser}
                        setCurrentUser={setCurrentUser}
                        handleBack={handleBack}
                        handleHome={handleHome}
                      />
                    </motion.div>
                  }
                />

                <Route
                  path="/favourites/:source/dish/:dishId"
                  element={
                    <motion.div {...motionProps}>
                      <FavouriteDishDetail
                        foodData={foodData}
                        handleBack={handleBack}
                        addToBag={addToBag}
                        handleHome={handleHome}
                        currentUser={currentUser}
                      />
                    </motion.div>
                  }
                />

                <Route
                  path="/combo"
                  element={
                    <motion.div {...motionProps}>
                      <ComboPage
                        foodData={foodData}
                        comboOfferRules={foodData.comboOffers || []}
                        addToBag={addToBag}
                        updateBagItem={updateBagItem}
                        handleBack={handleBack}
                        currentUser={currentUser}
                        setCurrentUser={setCurrentUser}
                      />
                    </motion.div>

                  }
                />

                <Route
                  path="/favourite-combos"
                  element={
                    isAuthenticatedUser ? (
                      <motion.div {...motionProps}>
                        <FavouriteCombo
                          currentUser={currentUser}
                          setCurrentUser={setCurrentUser}
                          addToBag={addToBag}
                          handleBack={handleBack}
                        />
                      </motion.div>

                    ) : (
                      <Navigate to="/categories" replace />
                    )
                  }
                />

                <Route
                  path="/offers"
                  element={
                    <motion.div {...motionProps}>
                      <OffersGrid
                        foodData={foodData}
                        addToBag={addToBag}
                        handleBack={() => navigate(-1)}
                        handleHome={() => navigate("/categories")}
                      />
                    </motion.div>
                  }
                />

                <Route
                  path="/events"
                  element={
                    <motion.div {...motionProps}>
                      <EventHome
                        handleBack={handleBack}
                        handleHome={handleHome}
                      />
                    </motion.div>
                  }
                />

                <Route
                  path="/events/hosted"
                  element={
                    <motion.div {...motionProps}>
                      <EventsPage
                        handleBack={handleBack}
                        handleHome={handleHome}
                        currentUser={currentUser}
                      />
                    </motion.div>
                  }
                />

                <Route
                  path="/events/reservation"
                  element={
                    <motion.div {...motionProps}>
                      <ReservationForm
                        foodData={foodData}
                        bag={bag}
                        setBag={setBag}
                        handleBack={handleBack}
                        handleHome={handleHome}
                      />
                    </motion.div>
                  }
                />
                <Route
                  path="/events/celebration"
                  element={
                    <motion.div {...motionProps}>
                      <CelebrationForm
                        bag={bag}
                        setBag={setBag}
                        handleBack={handleBack}
                        handleHome={handleHome}
                        navigateToCatering={() => handleNavigate("/events/catering")}
                      />
                    </motion.div>
                  }
                />
                <Route
                  path="/events/prebooking"
                  element={
                    <motion.div {...motionProps}>
                      <PreBooking
                        bag={bag}
                        setBag={setBag}
                        handleBack={handleBack}
                        handleHome={handleHome}
                      />
                    </motion.div>
                  }
                />
                <Route
                  path="/events/catering"
                  element={
                    <motion.div {...motionProps}>
                      <CateringForm
                        bag={bag}
                        setBag={setBag}
                        handleBack={handleBack}
                        handleHome={handleHome}
                      />
                    </motion.div>
                  }
                />

              </Routes>

            </AnimatePresence>
          )}
        </div>
      </LayoutGroup>
  );
}

export default App;