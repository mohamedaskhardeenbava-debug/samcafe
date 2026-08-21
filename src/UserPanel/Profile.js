import React from "react";
import { useNavigate } from "react-router-dom";
import "./FoodCategory.css";
import "./Profile.css";
import PageHeader from "./shared/PageHeader";
import Button3D from "./shared/Button3D";
import { endCustomerSession } from "./customerSession";

/** First letter of the customer's name, for the avatar circle. */
function initial(name) {
  const trimmed = (name || "").trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

const Profile = ({
  currentUser,
  setCurrentUser,
  handleBack,
  handleHome,
  isMyFavouritesEnabled,
  isMyOrdersCardEnabled,
}) => {
  const navigate = useNavigate();

  // Route is already gated in App.js, but guard here too in case this
  // component is ever reached directly (e.g. stale back/forward nav
  // after a logout in another tab).
  if (!currentUser || currentUser.id === "guest") {
    return null;
  }

  const handleLogout = async () => {
    await endCustomerSession();
    setCurrentUser(null);
    navigate("/", { replace: true });
  };

  return (
    <div className="food-list profile-page">
      <PageHeader
        title="Profile"
        wrapperClassName="food-header"
        titleClassName="food-list-title"
        onBack={handleBack}
        onHome={handleHome}
      />

      <div className="food-category profile-body" style={{ padding: "0px" }}>
        {/* Hero — avatar/name/mobile on a coloured banner, visually
            separated from the rest of the page as its own block rather
            than sitting flush with everything else beneath it. */}
        <div className="profile-hero">
          <div className="profile-avatar">{initial(currentUser.name)}</div>
          <div className="profile-name">{currentUser.name || "Guest"}</div>
          {currentUser.mobile && (
            <div className="profile-mobile">
              <span className="profile-mobile-icon" aria-hidden="true">📱</span>
              +91 {currentUser.mobile}
            </div>
          )}
        </div>

        {/* Section label groups the links together as one unit, so the
            list reads as "Your Account" rather than floating unlabeled
            between the hero and the logout button. */}
        <div className="profile-section">
          <div className="profile-section-label">Your Account</div>

          <div className="profile-links">
            {isMyOrdersCardEnabled && (
              <button
                type="button"
                className="profile-link-row"
                onClick={() => navigate("/my-orders")}
              >
                <span className="profile-link-icon profile-link-icon--orders" aria-hidden="true">🧾</span>
                <span className="profile-link-text">
                  <span className="profile-link-title">My Orders</span>
                  <span className="profile-link-sub">Track and review your past orders</span>
                </span>
                <span className="profile-link-arrow" aria-hidden="true">→</span>
              </button>
            )}

            {isMyFavouritesEnabled && (
              <button
                type="button"
                className="profile-link-row"
                onClick={() => navigate("/favourites/my")}
              >
                <span className="profile-link-icon profile-link-icon--favourites" aria-hidden="true">❤️</span>
                <span className="profile-link-text">
                  <span className="profile-link-title">My Favourites</span>
                  <span className="profile-link-sub">Dishes you've favourited</span>
                </span>
                <span className="profile-link-arrow" aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </div>

        <Button3D className="btn-3d red profile-logout-btn" onClick={handleLogout}>
          Log Out
        </Button3D>
      </div>
    </div>
  );
};

export default Profile;
