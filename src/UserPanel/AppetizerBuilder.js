import "./AppetizerBuilder.css";
import { useState, useRef } from "react";
import { flyToBag } from "../components/flyToBag.js";
import PageHeader from "./shared/PageHeader.js";
import Button3D from "./shared/Button3D.js";
import { buildDishBagItem } from "./shared/bagUtils.js";

const AppetizerBuilder = ({ foodData, addToBag, handleBack, handleHome }) => {

  const [selectedSauce, setSelectedSauce] = useState(null);
  const [selectedMain, setSelectedMain] = useState(null);
  const [qty, setQty] = useState(1);

  const finalImgRef = useRef(null);

  const appetizerCategory = foodData.categories.find(
    c => c.id === "appetizer"
  );

  const sauces = appetizerCategory?.appetizerSauces || [];
  const mains = appetizerCategory?.appetizerMain || [];

  const finalDish =
    selectedSauce && selectedMain
      ? appetizerCategory?.dishes?.find(
        d => d.id === `${selectedSauce.id}_${selectedMain.id}`
      )
      : null;

  const resetSelection = () => {
    setSelectedSauce(null);
    setSelectedMain(null);
    setQty(1);
  };

  const addDishToBag = () => {
    if (!finalDish) return;

    addToBag(
      buildDishBagItem(finalDish, "appetizer", {
        quantity: qty,
        totalPrice: finalDish.basePrice * qty,
        ingredients: finalDish.ingredients
      })
    );

    // fly the final dish image to the bag
    if (finalImgRef.current) {
      flyToBag({
        imgEl: finalImgRef.current,
        dishId: finalDish.id,
        customizationKey: ""
      });
    }
  };

  return (
    <div className="appetizer-builder">

      <PageHeader
        title="Build Your Appetizer"
        titleTag="h2"
        onBack={handleBack}
        onHome={handleHome}
      />

      <div className="builder-grid">

        {/* SAUCE COLUMN */}
        <div className="appetizer-first-grid">
          <div className="builder-column">
            <h3 className="builder-column-header">Sauce</h3>
            <div className="builder-column-scroll">
              <div className="builder-column-grid">
                {sauces.map(sauce => (
                  <div
                    key={sauce.id}
                    className={`builder-item ${selectedSauce?.id === sauce.id ? "active" : ""}`}
                    onClick={() => setSelectedSauce(sauce)}
                  >
                    <div className="builder-item-image">
                      <img src={sauce.image} alt="" />
                    </div>
                    <div className="builder-item-name">{sauce.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN INGREDIENT */}
          <div className="builder-column">
            <h3 className="builder-column-header">Main Ingredient</h3>
            <div className="builder-column-scroll">
              <div className="builder-main-column-grid">
                {mains.map(item => (
                  <div
                    key={item.id}
                    className={`builder-main-item ${selectedMain?.id === item.id ? "active" : ""}`}
                    onClick={() => setSelectedMain(item)}
                  >
                    <div className="builder-main-item-image">
                      <img src={item.image} alt="" />
                    </div>
                    <div className="builder-main-item-name">{item.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FINAL DISH */}
        <div className="appetizer-last-grid">
          <div className="final-column">
            <h3 className="builder-column-header">Your Appetizer</h3>
            <div className="final-column-scroll">
              {finalDish ? (
                <div className="final-card">
                  <div className="final-image">
                    {/* ref attached here so flyToBag can grab the element */}
                    <img
                      ref={finalImgRef}
                      src={finalDish.image}
                      alt={finalDish.name}
                    />
                  </div>

                  <div className="final-name">{finalDish.name}</div>

                  <div className="final-price">₹ {finalDish.basePrice}</div>


                  <Button3D className="btn-3d red" onClick={resetSelection} frontStyle={{ padding: "0 10px" }}>
                    Delete
                  </Button3D>

                  <Button3D className="btn-3d green" onClick={addDishToBag} frontStyle={{ padding: "0 10px" }}>
                    Add to Bag
                  </Button3D>
                </div>
              ) : (
                <div className="final-placeholder">
                  <div className="placeholder-icon">🍽️</div>
                  <div className="placeholder-text">
                    Select a <strong>sauce</strong> and <strong>main ingredient</strong> to build your appetizer
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppetizerBuilder;
