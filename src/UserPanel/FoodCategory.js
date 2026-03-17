import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./FoodCategory.css";
import listIcon from "../assets/icons/list.png";
import gridIcon from "../assets/icons/grid.png";

const FoodCategory = ({ foodData, currentUser }) => {
  const [viewMode, setViewMode] = useState("grid"); // default grid
  const isAuthenticatedUser =
    currentUser && currentUser.id !== "guest";

  const categoriesToRender = [];
  useEffect(() => {
    categoriesToRender.forEach(cat => {
      const img = new Image();
      img.src = cat.image;
    });
  }, []);

  /* ONLY LOGGED-IN USERS */
  if (isAuthenticatedUser) {
    categoriesToRender.push(
      {
        id: "my",
        name: "My Favourites",
        image: "/assets/category-assets/pizza.png",
        route: "/favourites/my"
      },
      {
        id: "others",
        name: "Crowd Picks",
        image: "/assets/category-assets/crowd.png",
        route: "/favourites/others"
      }
    );
  }

  /* GUESTS SEE ONLY CROWD PICKS */
  if (!isAuthenticatedUser) {
    categoriesToRender.push({
      id: "others",
      name: "Crowd Picks",
      image: "/assets/category-assets/crowd.png",
      route: "/favourites/others"
    });
  }

  /* COMBO */
  categoriesToRender.push({
    id: "combo",
    name: "Combos",
    image: "/assets/category-assets/combo.png",
    route: "/combo"
  });

  /* NORMAL CATEGORIES */
  (foodData.categories || []).forEach((category) => {

    const hasSubCategories =
      Array.isArray(category.subCategories) &&
      category.subCategories.length > 0;

    let route;

    // ✅ SPECIAL CASE FOR APPETIZER
    if (category.id === "appetizer") {
      route = "/appetizer-builder";
    } else {
      route = hasSubCategories
        ? `/subcategory/${category.id}`
        : `/foods/${category.id}/grid`;
    }

    categoriesToRender.push({
      id: category.id,
      name: category.name,
      image: category.image,
      route
    });

  });

  return (
    <div className="food-category">

      {/* VIEW TOGGLE */}
      <div className="view-toggle">
        <button
          className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
          onClick={() => setViewMode("grid")}
        >
          <img className="grid-icon" src={gridIcon} alt="" />
        </button>

        <button
          className={`view-btn ${viewMode === "list" ? "active" : ""}`}
          onClick={() => setViewMode("list")}
        >
          <img className="list-icon" src={listIcon} alt="" />
        </button>
      </div>

      <div className={`food-category-container ${viewMode}`}>
        {categoriesToRender.map((category) => (
          <Link
            key={category.id}
            to={category.route}
            className={`food-category-items
            ${viewMode}
            ${category.id === "my" ? "my-favourites" : ""}
            ${category.id === "others" ? "crowd-picks" : ""}
            ${category.id === "combo" ? "combo-category" : ""}
          `}
          >
            <div className="food-category-image">
              <img
                src={category.image}
                alt={category.name}
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="food-category-name">
              {category.name}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FoodCategory;
