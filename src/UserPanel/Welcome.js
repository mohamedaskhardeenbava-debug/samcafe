import "./Welcome.css";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import ThemeToggle from "./ThemeToggle";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api";

const Welcome = ({ toCamelCase, setCurrentUser, fetchMenu }) => {
  const navigate = useNavigate();
  const mobileInputRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [enableAutocomplete, setEnableAutocomplete] = useState(true);
  const [alertConfig, setAlertConfig] = useState({
    open: false,
    title: "",
    message: ""
  });

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const filteredMobiles = users
    .map(u => u.mobile)
    .filter(m => m.startsWith(mobile))
    .sort();

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
    // 🔒 clear any previous login
    localStorage.removeItem("userId");

    setCurrentUser({
      id: "guest",
      role: "guest"
    });

    goToCategories();
  };

  const handleLogin = async () => {
    if (mobile.length !== 10) {
      setAlertConfig({
        open: true,
        title: "Invalid Mobile Number",
        message: "Enter a valid 10-digit mobile number."
      });
      return;
    }

    const matches = users.filter(u => u.mobile === mobile);

    if (matches.length === 0) {
      setAlertConfig({
        open: true,
        title: "User Not Found",
        message: "No account exists with this mobile number."
      });
      return;
    }

    if (matches.length > 1) {
      setAlertConfig({
        open: true,
        title: "Duplicate Accounts Found",
        message: "Multiple accounts exist with this number. Contact support."
      });
      return;
    }

    const user = matches[0];
    localStorage.setItem("userId", user.id);

    // 🔁 SYNC USER INTO STATE
    setCurrentUser(user);

    // 🔁 REFRESH MENU + FAVOURITES
    fetchMenu();
    setShowLoginForm(false);
    setMobile("");
    navigate("/categories");
  };

  const handleSignup = async () => {
    if (!name.trim() || mobile.length !== 10) {
      setAlertConfig({
        open: true,
        title: "Invalid Input",
        message: "Enter name and valid mobile number."
      });
      return;
    }

    try {
      setLoading(true);

      const res = await api.get("/users");
      const users = res.data || [];

      const matches = users.filter(u => u.mobile === mobile);

      if (matches.length > 0) {
        setAlertConfig({
          open: true,
          title: "Duplicate Account",
          message: "An account already exists with this mobile number."
        });
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

      setShowSignupForm(false);
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

        <div className="profile-cards">
          <div
            className="profile-card"
            onClick={() => setShowLoginForm(true)}
          >
            <h4>Login</h4>
            <p>Login using your mobile number</p>
          </div>

          <div
            className="profile-card secondary"
            onClick={() => setShowSignupForm(true)}
          >
            <h4>Sign Up</h4>
            <p>Create a new profile</p>
          </div>

          <div
            className="profile-card secondary"
            onClick={handleGuest}
          >
            <h4>Guest</h4>
            <p>Continue without an account</p>
          </div>
        </div>
      </div>

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

              <div className="section floating-field">
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

              <div className="section floating-field">
                <input
                  required
                  type="tel"
                  placeholder=" "
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
                <label>Enter Mobile Number</label>
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
        {showLoginForm && (
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
              <h3>Login</h3>

              <div className="section  floating-field">
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

                      setTimeout(() => {
                        mobileInputRef.current?.blur();
                      }, 0);
                    } else {
                      // re-enable while typing
                      setEnableAutocomplete(true);
                    }
                  }}
                />
                <label>Enter Mobile Number</label>
              </div>

              <div className="btn-container">
                <button
                  className="primary"
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? "Logging In..." : "Login"}
                </button>

                <button
                  className="link-btn"
                  onClick={() => {
                    setShowLoginForm(false);
                    setMobile("");
                    setEnableAutocomplete(true);
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
