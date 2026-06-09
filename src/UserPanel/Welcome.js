import "./Welcome.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import ThemeToggle from "./ThemeToggle";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api";
import loginImg from "../assets/welcome-images/login-image.jpeg";
import signupImg from "../assets/welcome-images/signup-image.jpeg";
import guestImg from "../assets/welcome-images/guest-image.jpeg";

import logoLight from "../assets/logo-light.png";
import logoDark from "../assets/logo-dark.png";

import { useTheme } from "./ThemeContext";

const Welcome = ({ toCamelCase, setCurrentUser, fetchMenu }) => {
  const navigate = useNavigate();
  const mobileInputRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [enableAutocomplete, setEnableAutocomplete] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [activeCard, setActiveCard] = useState(null);

  const { theme } = useTheme();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [animateCards, setAnimateCards] = useState(false);
  const filteredMobiles = users
    .map(u => u.mobile)
    .filter(m => m.startsWith(mobile))
    .sort();

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateCards(true);
    }, 100); // slight delay ensures visible animation
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users");
        setUsers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };

    fetchUsers();
  }, []);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 576);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 576);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const containerVariants = {
    hidden: {},
    visible: {}
  };

  const cardVariants = {
    hidden: (index) => ({
      opacity: 1,
      x: 0,
      position: isMobile ? "relative" : "absolute",
      left: 0,
      zIndex: 10 - index
    }),
    visible: (index) => ({
      x: isMobile ? 0 : index * 240,
      position: isMobile ? "relative" : "absolute",
      left: 0,
      transition: {
        delay: isMobile ? 0 : index * 0.4,
        type: "spring",
        stiffness: 120,
        damping: 18
      }
    })
  };

  const goToCategories = () => {
    navigate("/categories", { state: { direction: "forward" } });
  };

  const handleGuest = () => {
    localStorage.removeItem("userId");

    setCurrentUser({
      id: "guest",
      role: "guest"
    });

    navigate("/categories");
  };

  const handleLogin = async () => {
    const e = {};
    if (mobile.length !== 10) e.mobile = "Enter a valid 10-digit mobile number.";
    if (Object.keys(e).length > 0) { setFormErrors(e); return; }

    const matches = users.filter(u => u.mobile === mobile);

    if (matches.length === 0) {
      setFormErrors({ mobile: "No account exists with this mobile number." });
      return;
    }

    if (matches.length > 1) {
      setFormErrors({ mobile: "Multiple accounts found. Contact support." });
      return;
    }

    const user = matches[0];
    localStorage.setItem("userId", user.id);

    // 🔁 SYNC USER INTO STATE
    setCurrentUser(user);

    // 🔁 REFRESH MENU + FAVOURITES
    fetchMenu();
    setActiveCard(null);
    setMobile("");
    navigate("/categories");
  };

  const handleSignup = async () => {
    const e = {};
    if (!name.trim() || name.trim().length < 2) e.name = "Enter a valid name.";
    if (mobile.length !== 10) e.mobile = "Enter a valid 10-digit mobile number.";
    if (Object.keys(e).length > 0) { setFormErrors(e); return; }

    try {
      setLoading(true);

      const res = await api.get("/users");
      const users = res.data || [];

      const matches = users.filter(u => u.mobile === mobile);

      if (matches.length > 0) {
        setFormErrors({ mobile: "An account already exists with this mobile number." });
        return;
      }

      const newUser = {
        id: `user_${mobile}`,
        name: name.trim(),
        mobile,
        favourites: [],
        combo: [],
        orders: []
      };

      await api.post("/users", newUser);

      // ✅ login ONLY first time
      localStorage.setItem("userId", newUser.id);

      setActiveCard(null);
      setName("");
      setMobile("");
      setCurrentUser(newUser);
      // 🔁 REFRESH MENU
      fetchMenu();
      navigate("/categories");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-page">
      {/* Wave background */}
      <div className="welcome-waves" aria-hidden="true">
        <div className="welcome-wave" />
        <div className="welcome-wave" />
        <div className="welcome-wave" />
      </div>
      <ThemeToggle />
      <datalist id="user-mobiles">
        {filteredMobiles.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <div className="welcome-container">
        <div className="welcome-text">Welcome to</div>

        <div className="welcome-title">
          <img
            src={theme === "light" ? logoLight : logoDark}
            alt="Cafe"
          />
        </div>

        <div className="welcome-slogan">
          Where every bite feels right
        </div>

        <motion.div
          className="profile-cards"
          variants={containerVariants}
          initial="hidden"
          animate={animateCards ? "visible" : "hidden"}
        >
          <motion.div
            className={`profile-card flip-card ${activeCard === "login" ? "flipped" : ""}`}
            variants={cardVariants}
            custom={0}
          >
            <div
              className="flip-inner"
              onClick={() => {
                setFormErrors({});
                setMobile("");
                setActiveCard(prev => (prev === "login" ? null : "login"));
              }}
            >
              {/* FRONT */}
              <div className="flip-front">
                <div className="card-image">
                  <img src={loginImg} alt="Login" />
                </div>

                <div className="card-overlay">
                  <h4>Login</h4>
                  <p>Login using your mobile number</p>
                </div>
              </div>

              {/* BACK */}
              <div className="flip-back signup-modal">
                <h3>Login</h3>

                <div
                  className="section"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mat">
                    <input
                      ref={mobileInputRef}
                      className={`mat-input${formErrors.mobile ? " error" : ""}`}
                      style={{paddingLeft: "4px"}}
                      type="tel"
                      placeholder=" "
                      list={enableAutocomplete ? "user-mobiles" : undefined}
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setMobile(value);
                        setFormErrors(prev => ({ ...prev, mobile: "" }));
                        if (value.length === 10) {
                          setEnableAutocomplete(false);
                          setTimeout(() => mobileInputRef.current?.blur(), 0);
                        } else {
                          setEnableAutocomplete(true);
                        }
                      }}
                    />
                    <label className={`mat-label${formErrors.mobile ? " mat-label-error" : ""}`}>
                      Mobile Number
                    </label>
                    <span className={`mat-bar${formErrors.mobile ? " mat-bar-error" : ""}`} />
                  </div>
                  {formErrors.mobile && (
                    <span className="mat-error">{formErrors.mobile}</span>
                  )}
                </div>

                <div
                  className="btn-container"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="wc-login-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogin();
                    }}
                  >
                    <span className="shadow"></span>
                    <span className="edge"></span>
                    <span className="front">Login</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className={`profile-card flip-card ${activeCard === "signup" ? "flipped" : ""}`}
            variants={cardVariants}
            custom={1}
          >
            <div
              className="flip-inner"
              onClick={() => {
                setFormErrors({});
                setName("");
                setMobile("");
                setActiveCard(prev => (prev === "signup" ? null : "signup"));
              }}
            >
              {/* FRONT */}
              <div className="flip-front">
                <div className="card-image">
                  <img src={signupImg} alt="Signup" />
                </div>

                <div className="card-overlay">
                  <h4>Sign Up</h4>
                  <p>Create a new profile</p>
                </div>
              </div>

              {/* BACK */}
              <div className="flip-back signup-modal">
                <h3>Create Profile</h3>

                <div
                  className="section"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mat">
                    <input
                      className={`mat-input${formErrors.name ? " error" : ""}`}
                      placeholder=" "
                      type="text"
                      maxLength={100}
                      value={name}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value.length > 100) return;
                        const words = value.trim().split(/\s+/);
                        if (words.length > 5) return;
                        setName(toCamelCase(value));
                        setFormErrors(prev => ({ ...prev, name: "" }));
                      }}
                    />
                    <label className={`mat-label${formErrors.name ? " mat-label-error" : ""}`}>
                      Full Name
                    </label>
                    <span className={`mat-bar${formErrors.name ? " mat-bar-error" : ""}`} />
                  </div>
                  {formErrors.name && (
                    <span className="mat-error">{formErrors.name}</span>
                  )}
                </div>

                <div
                  className="section"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mat">
                    <input
                      className={`mat-input${formErrors.mobile ? " error" : ""}`}
                      type="tel"
                      placeholder=" "
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, "");
                        if (digitsOnly.length <= 10) {
                          setMobile(digitsOnly);
                          setFormErrors(prev => ({ ...prev, mobile: "" }));
                        }
                      }}
                    />
                    <label className={`mat-label${formErrors.mobile ? " mat-label-error" : ""}`}>
                      Mobile Number
                    </label>
                    <span className={`mat-bar${formErrors.mobile ? " mat-bar-error" : ""}`} />
                  </div>
                  {formErrors.mobile && (
                    <span className="mat-error">{formErrors.mobile}</span>
                  )}
                </div>

                <div
                  className="btn-container"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="wc-login-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSignup();
                    }}
                  >
                    <span className="shadow"></span>
                    <span className="edge"></span>
                    <span className="front">Sign Up</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="profile-card"
            variants={cardVariants}
            custom={2}
            onClick={handleGuest}
          >
            <div className="flip-front">
              <div className="card-image">
                <img src={guestImg} alt="Guest" />
              </div>
              <div className="card-overlay">
                <h4>Guest</h4>
                <p>Continue without an account</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Welcome;