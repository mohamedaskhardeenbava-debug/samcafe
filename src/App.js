import "./App.css";
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

import bellSound from "./assets/sounds/bell.mp3";
import bellGif from "./assets/bell/bell.gif";
import bellStatic from "./assets/bell/bell-static.png";

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

  const isAuthenticatedUser = Boolean(currentUser?.id);

  const fetchMenu = async () => {
    try {
      const [categoriesRes, ingredientsRes, favouritesRes, comboRes] = await Promise.all([
        api.get("/categories"),
        api.get("/ingredients"),
        api.get("/favourites"),
        api.get("/combo")
      ]);

      setFoodData(prev => ({
        ...prev,
        categories: categoriesRes.data || [],
        ingredients: ingredientsRes.data || [],
        favourites: favouritesRes.data || [],
        combo: comboRes.data || []
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

  const findCategoryByDish = (foodData, dishId) => {
    for (const cat of foodData.categories) {

      if (Array.isArray(cat.dishes) &&
        cat.dishes.some(d => d.id === dishId)) {
        return cat;
      }

      if (Array.isArray(cat.subCategories)) {
        for (const sub of cat.subCategories) {
          if (Array.isArray(sub.dishes) &&
            sub.dishes.some(d => d.id === dishId)) {
            return sub;
          }
        }
      }

    }

    return null;
  };

  const normalizeBagItem = (rawItem, foodData) => {
    const category =
      foodData.categories.find(c => c.id === rawItem.categoryId) ||
      findCategoryByDish(foodData, rawItem.id);

    const dish =
      Array.isArray(category?.dishes)
        ? category.dishes.find(d => d.id === rawItem.id)
        : null || {};

    const defaultSize =
      category?.sizes?.[0]?.name?.toLowerCase() || "regular";

    const quantity = Number(rawItem.quantity || 1);
    const unitPrice = Number(rawItem.unitPrice || dish.basePrice || 0);
    const baseIngredients =
      Array.isArray(rawItem.ingredients) && rawItem.ingredients.length > 0
        ? rawItem.ingredients
        : (dish.ingredients || []).map(i => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          pricePer100g: i.pricePer100g || 0,
          totalPrice: 0
        }));

    return {
      id: rawItem.id,
      name: rawItem.name || dish.name,
      image: rawItem.image || dish.image,
      categoryId: category?.id || rawItem.categoryId,

      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,

      status: "placed",
      isCustomized: !!rawItem.isCustomized,
      selectedSize: rawItem.selectedSize || defaultSize,
      notes: rawItem.notes || "",
      ingredients: baseIngredients,
      createdAt: new Date().toISOString(),
      pickupAt: null
    };
  };

  const ingredientSignature = (ings = []) =>
    ings
      .map(i => `${i.name}:${i.quantity}`)
      .sort()
      .join("|");

  const addToBag = (rawItem) => {
    setBag(prev => {
      const item = normalizeBagItem(rawItem, foodData);

      const matchIndex = prev.findIndex(p =>
        p.id === item.id &&
        p.selectedSize === item.selectedSize &&
        p.isCustomized === item.isCustomized &&
        ingredientSignature(p.ingredients) === ingredientSignature(item.ingredients) &&
        (p.notes || "") === (item.notes || "")
      );

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

  const getEffectiveUnitPrice = (item) => {
    if (item.isCombo) {
      return Number(item.perComboFinalPrice || 0);
    }
    return Number(item.unitPrice || 0);
  };

  const increaseQty = (index) => {
    setBag(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const unit = getEffectiveUnitPrice(item);
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

          const unit = getEffectiveUnitPrice(item);
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
    ingredients: [],
    orders: []
  });

  const onToggleFavourite = async (dish) => {
    try {
      const userId = localStorage.getItem("userId");

      /* =========================
         1️⃣ PREPARE DISH OBJECT
         ========================= */
      let enrichedDish = { ...dish };

      if (userId) {
        const userRes = await api.get(`/users/${userId}`);
        const user = userRes.data;

        enrichedDish = {
          ...dish,
          userId,
          customerName: user.name || "Guest"
        };
      }

      /* =========================
         2️⃣ UPDATE MENU.FAVOURITES
         ========================= */
      /* =========================
   2️⃣ UPDATE /favourites
   ========================= */
      const favsRes = await api.get("/favourites");
      const menuFavourites = Array.isArray(favsRes.data) ? favsRes.data : [];

      const existsInMenu = menuFavourites.some(f => f.id === enrichedDish.id);

      if (!existsInMenu) {
        await api.post("/favourites", enrichedDish);

        setFoodData(prev => ({
          ...prev,
          favourites: [...menuFavourites, enrichedDish]
        }));
      }

      /* =========================
         3️⃣ GUEST USER
         ========================= */
      if (!userId) {
        const guestFavs =
          JSON.parse(localStorage.getItem("guestFavourites")) || [];

        const exists = guestFavs.some(f => f.id === enrichedDish.id);

        if (!exists) {
          const updated = [...guestFavs, enrichedDish];

          localStorage.setItem(
            "guestFavourites",
            JSON.stringify(updated)
          );
        }

        return;
      }

      /* =========================
         4️⃣ UPDATE USER.FAVOURITES
         ========================= */
      const userRes = await api.get(`/users/${userId}`);
      const user = userRes.data;

      const userFavourites = Array.isArray(user.favourites)
        ? user.favourites
        : [];

      const existsInUser = userFavourites.some(
        f => f.id === enrichedDish.id
      );

      if (!existsInUser) {
        const updatedUser = {
          ...user,
          favourites: [...userFavourites, enrichedDish]
        };

        await api.put(`/users/${userId}`, updatedUser);

        setCurrentUser(updatedUser);
      }

    } catch (err) {
      console.error("Favourite save failed:", err);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [currentUser]);

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

      console.log("SYNC EVENT:", resource, action);

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
        resource === "combo"
      ) {
        fetchMenu();
      }

    });

    return () => socket.off("data-change");

  }, []);

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
  const handleRingBell = () => {
    const audio = bellAudioRef.current;

    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(err => console.error(err));

    setIsRinging(true);

    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
      setIsRinging(false);
    }, 2000);
  };

  // if (loading) return <div className="app-loading">Loading menu...</div>;
  // if (error) return <div className="app-error">Failed to load menu</div>;

  return (
    <LayoutGroup>
      <div className="App">
        <FloatingBag
          bag={bag}
          isOpen={isBagOpen}
          setIsOpen={setIsBagOpen}
          increaseQty={increaseQty}
          decreaseQty={decreaseQty}
        />

        {isDineIn && (
          <div className="floating-bell-wrapper" onClick={handleRingBell}>
            <button
              className={`floating-bell ${isRinging ? "ringing" : ""}`}
            >
              <img
                key={isRinging ? "animated" : "static"}
                src={isRinging ? bellGif : bellStatic}
                alt="Call Attender"
                className="bell-image"
              />
            </button>

            <div className="bell-tooltip">
              Click to call the attender
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
                path="/subcategory/:categoryId"
                element={
                  <SubCategoryPage
                    foodData={foodData}
                    handleBack={handleBack}
                    handleHome={handleHome}
                  />
                }
              />

              <Route
                path="/subcategory/:categoryId"
                element={
                  <SubCategoryPage
                    foodData={foodData}
                    handleBack={handleBack}
                    handleHome={handleHome}
                  />
                }
              />

              <Route
                path="/foods/:categoryId/grid"
                element={
                  <motion.div {...motionProps}>
                    <FoodGridList
                      foodData={foodData}
                      addToBag={addToBag}
                      handleBack={handleBack}
                      handleHome={handleHome}
                    />
                  </motion.div>
                }
              />

              <Route
                path="/foods/:categoryId"
                element={
                  <FoodList
                    handleBack={handleBack}
                    foodData={foodData}
                    handleNavigate={handleNavigate}
                    addToBag={addToBag}
                    handleHome={handleHome}
                  />
                }
              />

              <Route
                path="/food/:id"
                element={
                  <motion.div {...motionProps}>
                    <FoodItem
                      handleBack={handleBack}
                      foodData={foodData}
                      handleNavigate={handleNavigate}
                      onToggleFavourite={onToggleFavourite}
                      addToBag={addToBag}
                      updateBagItem={updateBagItem}
                      setDirection={setDirection}
                      setLastAction={setLastAction}
                      toCamelCase={toCamelCase}
                      handleHome={handleHome}
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
                      onOrderPlaced={(order) =>
                        setFoodData(prev => ({
                          ...prev,
                          orders: [...(prev.orders || []), order]
                        }))
                      }
                    />
                  </motion.div>

                }
              />

              {/* <Route
                path="/scan-table"
                element={
                  <motion.div {...motionProps}>
                    <TableScanner />
                  </motion.div>
                }
              /> */}

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

            </Routes>

          </AnimatePresence>
        )}
      </div>
    </LayoutGroup >
  );
}

export default App;
