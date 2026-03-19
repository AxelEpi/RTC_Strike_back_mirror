"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAlert } from "../../hooks/useAlert";
import { useSidebarData } from "../../hooks/useSidebarData";
import Alert from "../../components/Alert/Alert";
import Sidebar from "../../components/Sidebar/page";

const api = process.env.NEXT_PUBLIC_API_URL;

export default function Layout() {
  const router = useRouter();
  const alert = useAlert();
  const { sidebarData, loading } = useSidebarData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    description: "",
    password: "",
  });

  useEffect(() => {
    if (!loading && sidebarData?.user) {
      const user = sidebarData.user;
      setFormData((prev) => ({
        ...prev,
        username: user.username ?? "",
        email: user.email ?? "",
        description: user.description ?? "",
      }));
    }
  }, [loading, sidebarData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      username: formData.username,
      email: formData.email,
      description: formData.description,
      password: formData.password || undefined,
    };

    try {
      setIsSubmitting(true);
      const response = await fetch(`${api}/auth/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert.showError(errorData.error || "Invalid update data");
        return;
      }

      await response.json();
      alert.showSuccess("Account updated successfully!");

      setTimeout(() => {
        router.push("/servers");
      }, 1500);
    } catch (error) {
      console.error("Account update failed:", error);
      alert.showError("An error occurred while updating the account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasData = Boolean(
    sidebarData?.user ||
    (sidebarData?.listServerData && sidebarData.listServerData.length),
  );

  if (loading && !hasData) {
    return (
      <div className="flex min-h-screen bg-[var(--background)] items-center justify-center">
        <p className="text-[var(--foreground)]">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
      <div className="hidden md:block">
        <Sidebar data={sidebarData} />
      </div>

      <main className="flex-1 bg-[var(--color-60)] overflow-y-auto">
        <div className="mt-6 md:mt-20 max-w-2xl mx-auto py-4 md:py-8 px-4 md:px-6">
          {/* Header */}
          <div className="mb-6 md:mb-8 text-center">
            <h1 className="text-2xl md:text-4xl font-bold text-[var(--foreground)] mb-2 md:mb-3">
              Update Account
            </h1>
            <p className="text-[var(--color-30)] text-sm md:text-base">
              Manage your profile information and security
            </p>
          </div>

          {/* Alert */}
          <Alert message={alert.message} type={alert.type} />

          {/* Update Account Form */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--color-30)]/20 p-4 md:p-8 shadow-lg">
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
              {/* Server Icon Preview */}
              <div className="flex flex-col items-center mb-4 md:mb-6">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[var(--color-10)] to-[var(--color-10)]/70 flex items-center justify-center shadow-xl mb-2 md:mb-3">
                  <svg
                    className="w-10 h-10 md:w-12 md:h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.418 0-8 2.015-8 4.5V20h16v-1.5c0-2.485-3.582-4.5-8-4.5z"
                    />
                  </svg>
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs md:text-sm font-semibold text-[var(--foreground)] mb-2"
                >
                  Username
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  maxLength={50}
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-[var(--color-30)]/30 bg-[var(--color-60)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--color-10)] focus:border-[var(--color-10)] outline-none transition-all placeholder:text-[var(--color-30)]/50 hover:border-[var(--color-30)]/50 text-sm md:text-base"
                  placeholder="Your username"
                />
              </div>

              {/*Description Field */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-xs md:text-sm font-semibold text-[var(--foreground)] mb-2"
                >
                  Description
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  required
                  maxLength={50}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-[var(--color-30)]/30 bg-[var(--color-60)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--color-10)] focus:border-[var(--color-10)] outline-none transition-all placeholder:text-[var(--color-30)]/50 hover:border-[var(--color-30)]/50 text-sm md:text-base"
                  placeholder="Your description"
                />
              </div>

              {/*Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs md:text-sm font-semibold text-[var(--foreground)] mb-2"
                >
                  Email
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  maxLength={50}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-[var(--color-30)]/30 bg-[var(--color-60)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--color-10)] focus:border-[var(--color-10)] outline-none transition-all placeholder:text-[var(--color-30)]/50 hover:border-[var(--color-30)]/50 text-sm md:text-base"
                  placeholder="Your email"
                />
              </div>

              {/*Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs md:text-sm font-semibold text-[var(--foreground)] mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  maxLength={50}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-[var(--color-30)]/30 bg-[var(--color-60)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--color-10)] focus:border-[var(--color-10)] outline-none transition-all placeholder:text-[var(--color-30)]/50 hover:border-[var(--color-30)]/50 text-sm md:text-base"
                  placeholder="New password (optional)"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 md:pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[var(--color-10)] hover:bg-[var(--color-10-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white py-2.5 md:py-3.5 px-4 md:px-6 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99] focus:ring-4 focus:ring-[var(--color-10)]/30 text-sm md:text-base"
                >
                  {isSubmitting ? "Saving..." : "Update"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/servers")}
                  className="w-full mt-2 md:mt-3 bg-transparent hover:bg-[var(--color-60)] text-[var(--color-30)] hover:text-[var(--foreground)] py-2.5 md:py-3 px-4 md:px-6 rounded-lg font-medium transition-all duration-200 border border-[var(--color-30)]/30 hover:border-[var(--color-30)]/50 text-sm md:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
