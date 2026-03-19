import { useRouter } from "next/router";
import { useState } from "react";
import { useAlert } from "../../hooks/useAlert";
import Alert from "../../components/Alert/Alert";

const apiHost = process.env.NEXT_PUBLIC_API_URL;
console.log("🌍 API Host utilisé:", apiHost);

export default function Login() {
  const router = useRouter();
  const alert = useAlert();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const data = { email, password };

    console.log("🔐 Tentative de login...");
    console.log("📧 Email:", email);

    try {
      const response = await fetch(`${apiHost}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Login échoué:", errorData);
        alert.showError(errorData.error || "Invalid email or password");
        return;
      }

      const result = await response.json();
      console.log("✅ Login successful:", result);

      // 🔥 AJOUT CRUCIAL : Sauvegarder le token
      if (result.token) {
        console.log("🔑 Token reçu:", result.token.substring(0, 20) + "...");
        localStorage.setItem("token", result.token);

        // Vérifier que c'est bien sauvegardé
        const saved = localStorage.getItem("token");
        console.log("💾 Token sauvegardé ?", saved ? "OUI ✅" : "NON ❌");

        if (!saved) {
          console.error("❌ ERREUR: Token non sauvegardé dans localStorage");
          alert.showError("Erreur lors de la sauvegarde de la session");
          return;
        }
      } else {
        console.warn("⚠️ Pas de token dans la réponse du serveur");
        console.warn("Le WebSocket ne fonctionnera pas sans token !");
        // On continue quand même si vous utilisez seulement des cookies
      }

      // Redirect to servers
      console.log("🚀 Redirection vers /servers...");
      router.push("/servers");
    } catch (error) {
      console.error("💥 Erreur login:", error);
      alert.showError("Erreur de connexion au serveur");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-3 md:p-4">
      <div className="bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-[#334155]">
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-4 md:mb-6 text-center bg-gradient-to-r from-[#7c3aed] to-[#ec4899] bg-clip-text text-transparent">
          Login
        </h2>

        <Alert message={alert.message} type={alert.type} />

        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-xs md:text-sm font-medium text-[var(--color-30)] mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-3 md:px-4 py-2 border border-[var(--color-30)]/30 bg-transparent text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--color-10)] focus:border-transparent outline-none transition placeholder:text-[var(--color-30)]/50 text-sm md:text-base"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs md:text-sm font-medium text-[var(--color-30)] mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full px-3 md:px-4 py-2 border border-[var(--color-30)]/30 bg-transparent text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--color-10)] focus:border-transparent outline-none transition placeholder:text-[var(--color-30)]/50 text-sm md:text-base"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white py-2.5 md:py-3 px-4 rounded-lg hover:from-[#6d28d9] hover:to-[#5b21b6] focus:ring-4 focus:ring-[#7c3aed]/30 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm md:text-base"
          >
            Login
          </button>
        </form>

        <p className="text-center text-xs md:text-sm text-[var(--color-30)] mt-4 md:mt-6">
          Don't have an account?{" "}
          <a
            href="/auth/signup"
            className="text-[var(--color-10)] hover:text-[var(--color-10-hover)] font-medium hover:underline transition"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
