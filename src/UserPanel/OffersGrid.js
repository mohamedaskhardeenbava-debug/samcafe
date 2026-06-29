import "./OffersGrid.css"; // reuse same UI
import { useNavigate } from "react-router-dom";
import { flyToBag } from "../components/flyToBag";
import HomeButton from "./shared/HomeButton";
import Button3D from "./shared/Button3D";

const OffersGrid = ({ foodData, addToBag, handleBack, handleHome }) => {
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  // 🔥 flatten all dishes
  const allDishes = foodData.categories.flatMap(cat => [
    ...(cat.dishes || []).map(d => ({ ...d, categoryId: cat.id })),
    ...(cat.subCategories || []).flatMap(sub =>
      (sub.dishes || []).map(d => ({ ...d, categoryId: sub.id }))
    )
  ]);

  // ✅ filter valid offers
  const validOffers = (foodData.offers || []).filter(o => {
    return (
      o.active === "yes" &&
      o.startDate <= today &&
      o.endDate >= today
    );
  });

  // 🔥 merge dish + offer
  const offerDishes = validOffers.map(o => {
    const dish = allDishes.find(d => d.id === o.dishId);

    if (!dish) return null;

    return {
      ...dish,
      offerPrice: o.offerPrice,
      percentage: o.percentage,
      originalPrice: o.originalPrice
    };
  }).filter(Boolean);

  return (
    <div className="offers-grid-page">

      {/* HEADER */}
      <div className="offers-grid-header">
        <button className="back-button" onClick={handleBack} />

        <div className="offers-grid-title">Offers</div>

        <HomeButton onClick={handleHome} />
      </div>

      {/* GRID */}
      <div className="food-category-container">
        {offerDishes.map(dish => (
          <div
            key={dish.id}
            className="offers-card"
          >

            {/* IMAGE */}
            <div className="offers-card-image">
              <img src={dish.image} alt={dish.name} />
            </div>

            {/* INFO */}
            <div className="offers-card-info">

              <div className="offers-card-name">
                {dish.name}
              </div>

              <div className="offers-card-price">
                ₹{dish.offerPrice}

                <span className="offers-card-original">
                  ₹{dish.originalPrice}
                </span>
              </div>

              <div className="offers-card-badge">
                {dish.percentage}% OFF
              </div>

            </div>

            {/* ADD BUTTON */}
            <Button3D
              className="btn-3d red"
              frontStyle={{ padding: "0 10px" }}
              onClick={(e) => {
                e.stopPropagation();

                const img = e.currentTarget
                  .closest(".offers-card")
                  .querySelector("img");

                addToBag({
                  id: dish.id,
                  name: dish.name,
                  image: dish.image,
                  categoryId: dish.categoryId,
                  quantity: 1,
                  unitPrice: dish.offerPrice,
                  totalPrice: dish.offerPrice,
                  appliedOffer: {
                    percentage: dish.percentage,
                    originalPrice: dish.originalPrice
                  }
                });

                flyToBag({
                  imgEl: img,
                  dishId: dish.id
                });
              }}
            >
              Add to Bag
            </Button3D>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OffersGrid;