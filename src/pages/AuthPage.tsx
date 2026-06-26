import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginUser, registerUser, clearError, setCredentials } from "../store/slices/authSlice.js";
import { RootState, AppDispatch } from "../store/index.js";
import { Sparkles, Mail, Lock, User, AlertCircle, Shield, ArrowLeft } from "lucide-react";
import NeoCard from "../components/ui/NeoCard.js";
import axiosInstance from "../api/axiosInstance.js";

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [isLogin, setIsLogin] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // Citizen inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");

  // Admin inputs
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  // Validation States
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Parse admin query parameter on load
  useEffect(() => {
    const isAdminParam = searchParams.get("admin") === "true";
    if (isAdminParam) {
      setIsAdminMode(true);
    }
  }, [searchParams]);

  useEffect(() => {
    dispatch(clearError());
    setErrors({});
    setAdminError("");
  }, [isLogin, isAdminMode, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      onAuthSuccess();
    }
  }, [isAuthenticated, onAuthSuccess]);

  // Listen for success message from popup (after callback completes)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { token, user } = event.data;
        if (token && user) {
          dispatch(setCredentials({ token, user }));
          onAuthSuccess();
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [dispatch, onAuthSuccess]);

  const validateForm = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!email) {
      tempErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      tempErrors.password = "Password is required";
    } else if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters";
    }

    if (!isLogin) {
      if (!name) {
        tempErrors.name = "Full name is required";
      }
      if (password !== confirmPassword) {
        tempErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isLogin) {
      await dispatch(loginUser({ email, password }));
    } else {
      await dispatch(registerUser({ name, email, password }));
    }
  };

  // Handle Admin Login process
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    if (!adminUsername) {
      setAdminError("Admin username is required");
      return;
    }
    if (!adminPassword) {
      setAdminError("Admin password is required");
      return;
    }

    setAdminLoading(true);
    try {
      const response = await axiosInstance.post("/admin/login", {
        username: adminUsername,
        password: adminPassword,
      });
      if (response.data?.success) {
        const token = response.data.token;
        localStorage.setItem("admin_token", token);
        navigate("/admin");
      } else {
        setAdminError(response.data?.message || "Invalid administrative credentials");
      }
    } catch (err: any) {
      setAdminError(err.response?.data?.message || "Invalid administrative credentials");
    } finally {
      setAdminLoading(false);
    }
  };

  // Trigger Google callback route in popup or fallback redirect
  const handleGoogleLogin = () => {
    const baseURL = (import.meta as any).env.VITE_API_BASE_URL || "";
    const authUrl = `${baseURL}/api/auth/google`;
    
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      authUrl,
      "google_oauth_popup",
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
    );
    
    if (!popup) {
      // Fallback if popup is blocked
      window.location.href = authUrl;
    }
  };

  // Logo component
  const Logo = () => (
    <div className="flex flex-col items-center justify-center mb-6">
      <svg className="w-20 h-20 drop-shadow-lg mb-2" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="30" fill="#E0F2FE" />
        <circle cx="50" cy="48" r="28" fill="#F0F9FF" />
        <circle cx="42" cy="42" r="4" fill="#1E293B" />
        <circle cx="58" cy="42" r="4" fill="#1E293B" />
        <circle cx="43" cy="41" r="1.5" fill="#FFFFFF" />
        <circle cx="59" cy="41" r="1.5" fill="#FFFFFF" />
        <path d="M46 48 L54 48 L50 56 Z" fill="#F59E0B" />
        <circle cx="36" cy="48" r="3" fill="#FDA4AF" opacity="0.6" />
        <circle cx="64" cy="48" r="3" fill="#FDA4AF" opacity="0.6" />
        <path d="M22 46 C15 35 10 50 16 65 C22 75 35 75 42 66" fill="#58CC02" stroke="#46A302" strokeWidth="2" />
        <path d="M46 59 L54 59 L50 63 Z" fill="#58CC02" />
      </svg>
      <h1 className="text-2xl font-black text-gray-800 tracking-tight">
        {isAdminMode ? "Community Hero Admin" : "Community Hero"}
      </h1>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
        {isAdminMode ? "Municipal Control gateway" : "Civic Guardian Network"}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md">
        <Logo />

        <NeoCard className="bg-white">
          {/* Tabs header */}
          <div className="flex border-b border-gray-100 pb-3 mb-6">
            {isAdminMode ? (
              <div className="flex-grow flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsAdminMode(false)}
                  className="flex items-center space-x-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Citizen Area</span>
                </button>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center space-x-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Gateway</span>
                </span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 text-center pb-2 text-sm font-black transition-colors ${
                    isLogin ? "text-[#58cc02] border-b-3 border-[#58cc02]" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 text-center pb-2 text-sm font-black transition-colors ${
                    !isLogin ? "text-[#58cc02] border-b-3 border-[#58cc02]" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Error banners */}
          {!isAdminMode && (error || Object.keys(errors).length > 0) && (
            <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-bold flex items-start space-x-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span>{error || "Form validation errors exist. See fields below."}</span>
              </div>
            </div>
          )}

          {isAdminMode && adminError && (
            <div className="mb-4 bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-600 font-bold flex items-start space-x-1.5 animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{adminError}</span>
            </div>
          )}

          {/* Admin Login Form */}
          {isAdminMode ? (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full py-2.5 pl-10 pr-4 bg-slate-50 border-2 border-gray-200 rounded-xl text-xs font-bold outline-none transition focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-2.5 pl-10 pr-4 bg-slate-50 border-2 border-gray-200 rounded-xl text-xs font-bold outline-none transition focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-700 active:translate-y-0.5 active:shadow-none shadow-[0_4px_0_0_#4338ca] text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{adminLoading ? "Authorizing..." : "Authorize Admin Login"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAdminMode(false)}
                className="w-full py-2.5 text-center text-xs text-gray-500 hover:text-gray-700 font-bold tracking-tight transition"
              >
                Cancel & Back to Citizen Area
              </button>
            </form>
          ) : (
            /* Citizen Login Form */
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name - Register only */}
                {!isLogin && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Doe"
                        className={`w-full py-2.5 pl-10 pr-4 bg-slate-50 border-2 rounded-xl text-xs font-bold outline-none transition focus:border-[#58cc02] ${
                          errors.name ? "border-red-400" : "border-gray-200"
                        }`}
                      />
                    </div>
                    {errors.name && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.name}</p>}
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane.doe@gmail.com"
                      className={`w-full py-2.5 pl-10 pr-4 bg-slate-50 border-2 rounded-xl text-xs font-bold outline-none transition focus:border-[#58cc02] ${
                        errors.email ? "border-red-400" : "border-gray-200"
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="******"
                      className={`w-full py-2.5 pl-10 pr-4 bg-slate-50 border-2 rounded-xl text-xs font-bold outline-none transition focus:border-[#58cc02] ${
                        errors.password ? "border-red-400" : "border-gray-200"
                      }`}
                    />
                  </div>
                  {errors.password && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.password}</p>}
                </div>

                {/* Confirm Password - Register only */}
                {!isLogin && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="******"
                        className={`w-full py-2.5 pl-10 pr-4 bg-slate-50 border-2 rounded-xl text-xs font-bold outline-none transition focus:border-[#58cc02] ${
                          errors.confirmPassword ? "border-red-400" : "border-gray-200"
                        }`}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}

                {/* Bouncy action submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 mt-2 btn-bouncy text-xs uppercase flex items-center justify-center space-x-1"
                >
                  <span>{loading ? "Authenticating..." : isLogin ? "Log In" : "Create Account"}</span>
                </button>
              </form>

              {/* Social login divider */}
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-gray-100" />
                <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-gray-100" />
              </div>

              {/* Simulated Google SSO button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full py-2.5 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-xl text-xs font-bold text-gray-600 flex items-center justify-center space-x-2 active:scale-[0.98] transition cursor-pointer mb-4"
              >
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Admin Login Bottom trigger option */}
              <div className="border-t border-gray-100 pt-4 mt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsAdminMode(true)}
                  className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-gray-500 hover:text-indigo-600 transition"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Login for Admin</span>
                </button>
              </div>
            </>
          )}
        </NeoCard>
      </div>
    </div>
  );
}
