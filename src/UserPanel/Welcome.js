import "./Welcome.css";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import ThemeToggle from "./ThemeToggle";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api";
import loginImg from "../assets/welcome-images/login-image.jpeg";
import signupImg from "../assets/welcome-images/signup-image.jpeg";
import guestImg from "../assets/welcome-images/guest-image.jpeg";

const containerVariants = {
  hidden: {},
  visible: {}
};

const cardVariants = {
  hidden: (index) => ({
    opacity: 1,
    x: 0,
    position: "absolute",
    left: 0,
    zIndex: 10 - index
  }),
  visible: (index) => ({
    x: index * 240,   // 320 = card width + gap
    position: "absolute",
    left: 0,
    transition: {
      delay: index * 0.4,
      type: "spring",
      stiffness: 120,
      damping: 18
    }
  })
};

const Welcome = ({ toCamelCase, setCurrentUser, fetchMenu }) => {
  const navigate = useNavigate();
  const mobileInputRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [enableAutocomplete, setEnableAutocomplete] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeCard, setActiveCard] = useState(null);

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

  const goToCategories = () => {
    navigate("/categories", { state: { direction: "forward" } });
  };

  const handleGuest = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("tableNo");

    setCurrentUser({
      id: "guest",
      role: "guest"
    });

    if (window.innerWidth <= 768) {
      navigate("/scan-table");
    } else {
      navigate("/categories");
    }
  };

  const handleLogin = async () => {
    localStorage.removeItem("tableNo");
    if (mobile.length !== 10) {
      setErrorMsg("Enter a valid 10-digit mobile number.");
      return;
    }

    const matches = users.filter(u => u.mobile === mobile);

    if (matches.length === 0) {
      setErrorMsg("No account exists with this mobile number.");
      return;
    }

    if (matches.length > 1) {
      setErrorMsg("Multiple accounts exist with this number. Contact support.");
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
    if (window.innerWidth <= 768) {
      navigate("/scan-table");
    } else {
      navigate("/categories");
    }
  };

  const handleSignup = async () => {
    localStorage.removeItem("tableNo");
    if (!name.trim() || mobile.length !== 10) {
      setErrorMsg("Enter name and valid mobile number.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.get("/users");
      const users = res.data || [];

      const matches = users.filter(u => u.mobile === mobile);

      if (matches.length > 0) {
        setErrorMsg("An account already exists with this mobile number.");
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
      if (window.innerWidth <= 768) {
        navigate("/scan-table");
      } else {
        navigate("/categories");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-page">
      <ThemeToggle />
      <datalist id="user-mobiles">
        {filteredMobiles.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <div className="welcome-container">
        <div className="welcome-text">Welcome to</div>

        <div className="welcome-title">
          <img src={logo} alt="Cafe" />
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
                setErrorMsg("");
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
                  className="section floating-field"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    ref={mobileInputRef}
                    type="tel"
                    placeholder=" "
                    list={enableAutocomplete ? "user-mobiles" : undefined}
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setMobile(value);

                      if (value.length === 10) {
                        setEnableAutocomplete(false);
                        setTimeout(() => mobileInputRef.current?.blur(), 0);
                      } else {
                        setEnableAutocomplete(true);
                      }
                    }}
                  />
                  <label>Enter Mobile Number</label>
                </div>

                {errorMsg && activeCard === "login" && (
                  <div className="inline-error">
                    {errorMsg}
                  </div>
                )}

                <div
                  className="btn-container"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogin();
                    }}
                  >
                    Login
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
                setErrorMsg("");
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
                  className="section floating-field"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    required
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
                    }}
                  />
                  <label>Enter Name</label>
                </div>

                <div
                  className="section floating-field"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    required
                    type="tel"
                    placeholder=" "
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, "");
                      if (digitsOnly.length <= 10) {
                        setMobile(digitsOnly);
                      }
                    }}
                  />
                  <label>Enter Mobile Number</label>
                </div>

                {errorMsg && activeCard === "signup" && (
                  <div className="inline-error">
                    {errorMsg}
                  </div>
                )}

                <div
                  className="btn-container"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSignup();
                    }}
                  >
                    Sign Up
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
            <div className="card-image">
              <img src={guestImg} alt="Guest" />
            </div>
            <div className="card-overlay">
              <h4>Guest</h4>
              <p>Continue without an account</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Welcome;
