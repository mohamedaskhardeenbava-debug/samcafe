import "./Welcome.css";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api";

const Welcome = ({ toCamelCase }) => {
  const navigate = useNavigate();

  const [showProfileChoice, setShowProfileChoice] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    open: false,
    title: "",
    message: ""
  });

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);

  const goToCategories = () => {
    navigate("/categories", { state: { direction: "forward" } });
  };

  const handleGuest = () => {
    goToCategories();
  };

  const handleSignup = async () => {
    resetSignupForm();
    if (!name.trim() || !mobile.trim()) {
      setAlertConfig({
        open: true,
        title: "Missing Information",
        message: "Please enter both name and mobile number."
      });
      return;
    }

    if (mobile.length !== 10) {
      setAlertConfig({
        open: true,
        title: "Invalid Mobile Number",
        message: "Please enter a valid 10-digit mobile number."
      });
      return;
    }

    const words = name.trim().split(/\s+/);

    if (words.length > 5) {
      setAlertConfig({
        open: true,
        title: "Name Too Long",
        message: "Name should not contain more than 5 words."
      });
      return;
    }

    if (name.length > 100) {
      setAlertConfig({
        open: true,
        title: "Name Too Long",
        message: "Name should not exceed 100 characters."
      });
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Fetch all users
      const res = await api.get("/users");
      const users = Array.isArray(res.data) ? res.data : [];

      // 2️⃣ Check if user already exists (by mobile)
      const existingUser = users.find(
        (u) => u.mobile === mobile.trim()
      );

      if (existingUser) {
        localStorage.setItem("userId", existingUser.id);
        resetSignupForm();
        goToCategories();
        return;
      }

      // 3️⃣ CREATE NEW USER (SIGN UP)
      const newUser = {
        id: `user_${mobile}`,
        name: name.trim(),
        mobile: mobile.trim(),
        favourites: [],
        combo: [],
        orders: []
      };

      await api.post("/users", newUser);
      localStorage.setItem("userId", newUser.id);
      resetSignupForm();
      goToCategories();

    } catch (err) {
      console.error("Signup/Login failed", err);
      alert("Failed to continue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 }
  };

  const resetSignupForm = () => {
    setName("");
    setMobile("");
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
      <AnimatePresence>
        {showProfileChoice && (
          <motion.div
            className="overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <motion.div
              className="profile-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3>Choose Profile</h3>

              <div className="profile-cards">
                <div
                  className="profile-card"
                  onClick={() => {
                    setShowProfileChoice(false);
                    setShowSignupForm(true);
                  }}
                >
                  <h4>Sign Up</h4>
                  <p>Create your profile for a better experience</p>
                </div>

                <div
                  className="profile-card secondary"
                  onClick={handleGuest}
                >
                  <h4>Guest</h4>
                  <p>Continue without creating an account</p>
                </div>
              </div>

              <button
                className="link-btn"
                onClick={() => {
                  resetSignupForm();
                  setShowProfileChoice(false);
                }}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIGNUP FORM OVERLAY */}
      <AnimatePresence>
        {showSignupForm && (
          <motion.div
            className="overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <motion.div
              className="signup-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3>Create Profile</h3>

              <div className="section">
                <label>Name</label>
                <input
                  required
                  autoFocus
                  type="text"
                  maxLength={100}
                  value={name}
                  onChange={(e) => {
                    let value = e.target.value;

                    if (value.length > 100) return;

                    const words = value.trim().split(/\s+/);
                    if (words.length > 5) return;

                    setName(toCamelCase(value));
                  }}
                />
              </div>

              <div className="section">
                <label>Mobile Number</label>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "");
                    if (digitsOnly.length <= 10) {
                      setMobile(digitsOnly);
                    }
                  }}
                />
              </div>

              <div className="btn-container">
                <button
                  className="primary"
                  onClick={handleSignup}
                  disabled={loading}
                >
                  {loading ? "Signing Up..." : "Sign Up"}
                </button>

                <button
                  className="link-btn"
                  onClick={() => {
                    resetSignupForm();
                    setShowSignupForm(false);
                  }}
                >
                  Back
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alertConfig.open && (
          <motion.div
            className="alert-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="alert-modal"
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="alert-icon">⚠️</div>

              <h3 className="alert-title">{alertConfig.title}</h3>

              <p className="alert-message">
                {alertConfig.message}
              </p>

              <button
                className="alert-btn"
                onClick={() =>
                  setAlertConfig({ open: false, title: "", message: "" })
                }
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Welcome;
