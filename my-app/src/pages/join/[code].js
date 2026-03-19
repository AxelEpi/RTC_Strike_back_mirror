"use client";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useAlert } from "../../hooks/useAlert";
import Alert from "../../components/Alert/Alert";

const apiHost = process.env.NEXT_PUBLIC_API_URL;

const VIEW = { JOIN: "join", LOGIN: "login", SIGNUP: "signup" };

export default function JoinPage() {
  const router = useRouter();
  const { code } = router.query;
  const alert = useAlert();

  const [view, setView] = useState(VIEW.JOIN);
  const [serverName, setServerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!code) return;
    const token = localStorage.getItem("token");
    if (token) setIsAuthenticated(true);
    fetchServerInfo(code);
  }, [code]);

  const fetchServerInfo = async (inviteCode) => {
    try {
      const res = await fetch(`${apiHost}/invitations/${inviteCode}`);
      if (!res.ok) throw new Error("Invitation invalide ou expiree");
      const data = await res.json();
      setServerName(data.server_name);
    } catch (err) {
      alert.showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const joinServer = async (token) => {
    const res = await fetch(`${apiHost}/invitations/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ code }),
    });
    if (!res.ok) throw new Error("Impossible de rejoindre le serveur");
    return res.json();
  };

  const handleJoin = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setView(VIEW.LOGIN);
      return;
    }
    try {
      setSubmitting(true);
      const data = await joinServer(token);
      router.push(`/servers/${data.server_id}`);
    } catch (err) {
      alert.showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      setSubmitting(true);
      const res = await fetch(`${apiHost}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert.showError(err.error || "Invalid email or password");
        return;
      }
      const result = await res.json();
      if (result.token) localStorage.setItem("token", result.token);
      setIsAuthenticated(true);
      const data = await joinServer(result.token);
      router.push(`/servers/${data.server_id}`);
    } catch (err) {
      alert.showError("Erreur de connexion au serveur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      setSubmitting(true);
      const res = await fetch(`${apiHost}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert.showError(err.error || "Registration failed");
        return;
      }
      alert.showSuccess("Compte cree avec succes !");

      const loginRes = await fetch(`${apiHost}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!loginRes.ok) {
        setTimeout(() => router.push("/auth/login"), 1500);
        return;
      }
      const loginResult = await loginRes.json();
      if (loginResult.token) localStorage.setItem("token", loginResult.token);
      setIsAuthenticated(true);
      const data = await joinServer(loginResult.token);
      router.push(`/servers/${data.server_id}`);
    } catch (err) {
      alert.showError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 md:px-4 py-2 border border-[var(--color-30)]/30 bg-transparent text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--color-10)] focus:border-transparent outline-none transition placeholder:text-[var(--color-30)]/50 text-sm md:text-base";

  const labelClass =
    "block text-xs md:text-sm font-medium text-[var(--color-30)] mb-2";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
        <div className="text-xl text-[var(--foreground)] animate-pulse">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-3 md:p-4">
      <div className="bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-[#334155]">

        <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-1 text-center bg-gradient-to-r from-[#7c3aed] to-[#ec4899] bg-clip-text text-transparent">
          {view === VIEW.JOIN && "Rejoindre un serveur"}
          {view === VIEW.LOGIN && "Login"}
          {view === VIEW.SIGNUP && "Register"}
        </h2>

        {view !== VIEW.JOIN && (
          <p className="text-center text-xs text-[var(--color-30)] mb-5">
            Apres {view === VIEW.LOGIN ? "connexion" : "inscription"}, vous rejoindrez automatiquement{" "}
            <span className="text-[var(--foreground)] font-semibold">{serverName}</span>
          </p>
        )}

        <Alert message={alert.message} type={alert.type} />

        {view === VIEW.JOIN && (
          <div className="mt-4 space-y-5">
            <div className="border border-[#334155] rounded-xl p-5 text-center">
              <p className="text-xs uppercase tracking-widest text-[var(--color-30)] mb-1">
                Serveur
              </p>
              <p className="text-xl font-bold text-[var(--foreground)]">
                {serverName}
              </p>
              <p className="text-xs text-[var(--color-30)]/60 mt-1">
                Code : {code}
              </p>
            </div>

            {!isAuthenticated && (
              <p className="text-xs text-center text-[var(--color-30)]">
                Vous devez etre connecte pour rejoindre ce serveur.
              </p>
            )}

            <button
              onClick={handleJoin}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white py-2.5 md:py-3 px-4 rounded-lg hover:from-[#6d28d9] hover:to-[#5b21b6] focus:ring-4 focus:ring-[#7c3aed]/30 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm md:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              {submitting && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {isAuthenticated ? "Rejoindre le serveur" : "Continuer"}
            </button>

            {!isAuthenticated && (
              <div className="flex gap-3">
                <button
                  onClick={() => { setView(VIEW.LOGIN); }}
                  className="flex-1 border border-[var(--color-30)]/30 text-[var(--color-30)] hover:text-[var(--foreground)] hover:border-[var(--color-10)] py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  Login
                </button>
                <button
                  onClick={() => { setView(VIEW.SIGNUP); }}
                  className="flex-1 border border-[var(--color-30)]/30 text-[var(--color-30)] hover:text-[var(--foreground)] hover:border-[var(--color-10)] py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        )}

        {view === VIEW.LOGIN && (
          <form className="space-y-4 md:space-y-5 mt-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className={inputClass}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className={inputClass}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white py-2.5 md:py-3 px-4 rounded-lg hover:from-[#6d28d9] hover:to-[#5b21b6] focus:ring-4 focus:ring-[#7c3aed]/30 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm md:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              {submitting && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              Login et rejoindre
            </button>
            <p className="text-center text-xs md:text-sm text-[var(--color-30)]">
              Pas de compte ?{" "}
              <button
                type="button"
                onClick={() => setView(VIEW.SIGNUP)}
                className="text-[#7c3aed] hover:text-[#6d28d9] font-semibold hover:underline transition"
              >
                Register
              </button>
            </p>
          </form>
        )}

        {view === VIEW.SIGNUP && (
          <form className="space-y-4 md:space-y-5 mt-4" onSubmit={handleSignup}>
            <div>
              <label htmlFor="username" className={labelClass}>Username</label>
              <input
                type="text"
                id="username"
                name="username"
                required
                className={inputClass}
                placeholder="your_username"
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className={inputClass}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className={inputClass}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white py-2.5 md:py-3 px-4 rounded-lg hover:from-[#6d28d9] hover:to-[#5b21b6] focus:ring-4 focus:ring-[#7c3aed]/30 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm md:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              {submitting && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              Register et rejoindre
            </button>
            <p className="text-center text-xs md:text-sm text-[var(--color-30)]">
              Deja un compte ?{" "}
              <button
                type="button"
                onClick={() => setView(VIEW.LOGIN)}
                className="text-[#7c3aed] hover:text-[#6d28d9] font-semibold hover:underline transition"
              >
                Login
              </button>
            </p>
          </form>
        )}

        <div className="flex gap-3 mt-6 pt-5 border-t border-[#334155]">
          {view !== VIEW.JOIN ? (
            <button
              onClick={() => setView(VIEW.JOIN)}
              className="flex-1 text-[var(--color-30)] hover:text-[var(--foreground)] border border-[var(--color-30)]/30 hover:border-[var(--color-30)] py-2 rounded-lg text-sm font-semibold transition-all text-center"
            >
              Retour
            </button>
          ) : (
            <a
              href="/"
              className="flex-1 text-[var(--color-30)] hover:text-[var(--foreground)] border border-[var(--color-30)]/30 hover:border-[var(--color-30)] py-2 rounded-lg text-sm font-semibold transition-all text-center"
            >
              Accueil
            </a>
          )}
        </div>

      </div>
    </div>
  );
}