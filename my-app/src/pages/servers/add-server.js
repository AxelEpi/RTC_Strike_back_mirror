"use client";
import { useState } from "react";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const description = e.target.description.value;
    const data = { name, description };

    try {
      setIsSubmitting(true);
      const response = await fetch(`${api}/servers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert.showError(errorData.error || "Invalid name or description");
        return;
      }

      const result = await response.json();
      alert.showSuccess("Server created successfully!");

      setTimeout(() => {
        router.push("/servers/" + result.id);
      }, 1500);
    } catch (error) {
      console.error("Server creation failed:", error);
      alert.showError("An error occurred while creating the server");
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
      <Sidebar data={sidebarData} />

      <main className="flex-1 bg-[var(--color-60)] overflow-y-auto">
        <div className="mt-20 max-w-2xl mx-auto py-8 px-6">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-3">
              CREATE A NEW SERVER
            </h1>
            <p className="text-[var(--color-30)] text-base">
              Customize your new server and invite your friends
            </p>
          </div>

          {/* Alert */}
          <Alert message={alert.message} type={alert.type} />

          {/* Create Server Form */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--color-30)]/20 p-8 shadow-lg">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Server Icon Preview */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--color-10)] to-[var(--color-10)]/70 flex items-center justify-center shadow-xl mb-3">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-[var(--foreground)] mb-2"
                >
                  Server Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  maxLength={50}
                  className="w-full px-4 py-3 border border-[var(--color-30)]/30 bg-[var(--color-60)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--color-10)] focus:border-[var(--color-10)] outline-none transition-all placeholder:text-[var(--color-30)]/50 hover:border-[var(--color-30)]/50"
                  placeholder="My Awesome Server"
                />
                <p className="mt-1 text-xs text-[var(--color-30)]">
                  Choose a unique and memorable name
                </p>
              </div>

              {/* Description Field */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-[var(--foreground)] mb-2"
                >
                  Description
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-[var(--color-30)]/30 bg-[var(--color-60)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--color-10)] focus:border-[var(--color-10)] outline-none transition-all placeholder:text-[var(--color-30)]/50 hover:border-[var(--color-30)]/50 resize-none"
                  placeholder="Describe your server and what you'll share here..."
                />
                <p className="mt-1 text-xs text-[var(--color-30)]">
                  Help others understand your server's theme
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-[var(--color-10)] hover:bg-[var(--color-10-hover)] text-white py-3.5 px-6 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99] focus:ring-4 focus:ring-[var(--color-10)]/30"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/servers")}
                  className="w-full mt-3 bg-transparent hover:bg-[var(--color-60)] text-[var(--color-30)] hover:text-[var(--foreground)] py-3 px-6 rounded-lg font-medium transition-all duration-200 border border-[var(--color-30)]/30 hover:border-[var(--color-30)]/50"
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
