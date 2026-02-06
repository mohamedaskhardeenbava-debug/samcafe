import "./App.css";
import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import api from "./api";

import Welcome from "./UserPanel/Welcome";
import FoodCategory from "./UserPanel/FoodCategory";
import FoodGridList from "./UserPanel/FoodGridList";
import FoodList from "./UserPanel/FoodList";
import FoodListExpanded from "./UserPanel/FoodListExpanded";
import FoodItem from "./UserPanel/FoodItem";
import IngredientDetail from "./UserPanel/IngredientDetail";
import ThankYou from "./UserPanel/ThankYou";
import FloatingBag from "./UserPanel/FloatingBag";

import FavouriteCategories from "./UserPanel/FavouriteCategories";
import FavouriteDishList from "./UserPanel/FavouriteDishList";
import FavouriteDishDetail from "./UserPanel/FavouriteDishDetail";
import ComboPage from "./UserPanel/ComboPage";
import FavouriteCombo from "./UserPanel/FavouriteCombo";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isBagOpen, setIsBagOpen] = useState(false);
  const [direction, setDirection] = useState(1);
  const [lastAction, setLastAction] = useState("forward");
  const [bag, setBag] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const isExpandedPage = location.pathname.includes("/expanded");

  const isAuthenticatedUser =
    currentUser && currentUser.id !== "guest";

  const fetchMenu = async () => {
    try {
      const res = await api.get("/menu");
      const menu = res.data;

      setFoodData(prev => ({
        ...prev,
        categories: menu.categories || [],
        favourites: menu.favourites || [], // ✅ REQUIRED FOR CROWD PICKS
        combo: menu.combo || [],
        ingredients: menu.ingredients || []
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

  const addToBag = (item) => {
    setBag(prev => [...prev, item]);
  };

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
         1️⃣ UPDATE MENU.FAVOURITES (ALWAYS)
         ========================= */
      const menuRes = await api.get("/menu");
      const menu = menuRes.data;

      const menuFavourites = Array.isArray(menu.favourites)
        ? menu.favourites
        : [];

      let enrichedDish = dish;

      if (userId) {
        const userRes = await api.get(`/users/${userId}`);
        const user = userRes.data;

        enrichedDish = {
          ...dish,
          userId,
          customerName: user.name    // ✅ ADD
        };
      }

      const existsInMenu = menuFavourites.some(f => f.id === dish.id);

      if (!existsInMenu) {
        const updatedMenu = {
          ...menu,
          favourites: [...menuFavourites, enrichedDish]
        };

        await api.put("/menu", updatedMenu);

        setFoodData(prev => ({
          ...prev,
          favourites: updatedMenu.favourites
        }));
      }

      /* =========================
         2️⃣ UPDATE USER.FAVOURITES (ONLY IF LOGGED IN)
         ========================= */
      if (!userId) {
        const guestFavs =
          JSON.parse(localStorage.getItem("guestFavourites")) || [];

        const exists = guestFavs.some(f => f.id === dish.id);
        if (!exists) {
          const updated = [...guestFavs, dish];
          localStorage.setItem("guestFavourites", JSON.stringify(updated));

          setFoodData(prev => ({
            ...prev,
            favourites: prev.favourites // menu favourites unchanged
          }));
        }
        return;
      }

      const userRes = await api.get(`/users/${userId}`);
      const user = userRes.data;

      const userFavourites = Array.isArray(user.favourites)
        ? user.favourites
        : [];

      const existsInUser = userFavourites.some(f => f.id === dish.id);

      if (!existsInUser) {
        const updatedUser = {
          ...user,
          favourites: [...userFavourites, dish]
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
    // Close floating bag on category / home-like pages
    if (
      location.pathname === "/categories" ||
      location.pathname === "/" ||
      location.pathname === "/thank-you"
    ) {
      setIsBagOpen(false);
    }
  }, [location.pathname]);

  const pageVariants = {
    initial: (direction) => ({
      x: direction > 0 ? 100 : -100,
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

  const disablePageAnimation =
    location.state?.disablePageAnimation === true;

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
    </LayoutGroup>
  );
}

export default App;
