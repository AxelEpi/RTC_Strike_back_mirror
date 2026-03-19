import { useState } from "react";
import { useRouter } from "next/router";
import { useAlert } from "../../hooks/useAlert";
import Alert from "../../components/Alert/Alert";

const apiHost = process.env.NEXT_PUBLIC_API_URL;

export default function Register() {
  const router = useRouter();
  const alert = useAlert();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const email = e.target.email.value;
    const password = e.target.password.value;

    const data = { username, email, password };

    try {
      const response = await fetch(`${apiHost}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert.showError(errorData.error || "Registration failed");
        return;
      }

      const result = await response.json();
      console.log("Register successful:", result);

      alert.showSuccess("Registration successful!");
      e.target.reset();

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error) {
      console.error("Register failed:", error);
      alert.showError(error.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-3 md:p-4">
      <div className="bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-[#334155]">
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-4 md:mb-6 text-center bg-gradient-to-r from-[#7c3aed] to-[#ec4899] bg-clip-text text-transparent">
          Register
        </h2>

        <Alert message={alert.message} type={alert.type} />

        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="username"
              className="block text-xs md:text-sm font-medium text-[var(--color-30)] mb-2"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              className="w-full px-3 md:px-4 py-2 border border-[var(--color-30)]/30 bg-transparent text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--color-10)] focus:border-transparent outline-none transition placeholder:text-[var(--color-30)]/50 text-sm md:text-base"
              placeholder="your_username"
            />
          </div>

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
            Register
          </button>
        </form>

        <p className="text-center text-xs md:text-sm text-[var(--color-30)] mt-4 md:mt-6">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-[#7c3aed] hover:text-[#6d28d9] font-semibold hover:underline transition"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
