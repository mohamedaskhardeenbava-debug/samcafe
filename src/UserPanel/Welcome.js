import "./Welcome.css";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const Welcome = ({ users, setUsers }) => {
  const navigate = useNavigate();

  const [showProfileChoice, setShowProfileChoice] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);

  const goToCategories = () => {
    navigate("/categories", { state: { direction: "forward" } });
  };

  const handleGuest = () => {
    goToCategories();
  };

  const handleSignup = () => {
    if (!name.trim() || !mobile.trim()) {
      alert("Please enter name and mobile number");
      return;
    }

    const newUser = {
      id: `user_${mobile}`,
      name,
      mobile
    };

    setUsers((prev) => [...prev, newUser]);
    goToCategories();
  };

  return (
    <div className="welcome-page">
      <ThemeToggle />

      <div className="welcome-container">
        <div className="welcome-text">Welcome to</div>

        <div className="welcome-title">
          <img src={logo} alt="Cafe" />
        </div>

        <div className="welcome-slogan">
          Where every bite feels right
        </div>

        <div className="welcome-cta">
          <button
            className="cta-button"
            onClick={() => setShowProfileChoice(true)}
          >
            Get Started
          </button>
        </div>
      </div>

      {/* PROFILE CHOICE OVERLAY */}
      {showProfileChoice && (
        <div className="overlay">
          <div className="modal">
            <h3>Continue as</h3>

            <button
              className="primary"
              onClick={() => {
                setShowProfileChoice(false);
                setShowSignupForm(true);
              }}
            >
              Sign Up
            </button>

            <button onClick={handleGuest}>
              Continue as Guest
            </button>

            <button
              className="link-btn"
              onClick={() => setShowProfileChoice(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* SIGNUP FORM OVERLAY */}
      {showSignupForm && (
        <div className="overlay">
          <div className="modal">
            <h3>Create Profile</h3>

            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="tel"
              placeholder="Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />

            <button
              className="primary"
              onClick={handleSignup}
              disabled={loading}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>

            <button
              className="link-btn"
              onClick={() => setShowSignupForm(false)}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Welcome;
