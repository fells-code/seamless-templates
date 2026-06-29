import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@seamless-auth/react";

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "Beta Access", to: "/beta" },
  ];

  return (
    <nav className="w-full bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 relative">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="text-xl font-semibold text-gray-950 tracking-tight dark:text-white"
        >
          Seamless Auth - Template
        </Link>

        <div className="hidden md:flex gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="relative group text-gray-700 dark:text-gray-300 font-medium"
            >
              {link.label}

              <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-[#2169a8] group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-5">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="h-9 w-9 rounded-full bg-[#2169a8] text-white flex items-center justify-center font-semibold"
                aria-label="Open account menu"
              >
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg py-1 z-20">
                  <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                    {user?.email || user?.phone}
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-md text-sm bg-[#2169a8] text-white hover:bg-[#1a568a] transition"
            >
              Login
            </Link>
          )}
        </div>

        <button
          className="md:hidden text-gray-700 dark:text-gray-300"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 px-4 py-4 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="block text-gray-700 dark:text-gray-300 text-lg font-medium"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {isAuthenticated ? (
            <>
              <div className="text-gray-700 dark:text-gray-300">
                {user?.email || user?.phone}
              </div>

              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="w-full px-4 py-2 rounded-md bg-[#2169a8] text-white hover:bg-[#1a568a] transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="block w-full px-4 py-2 text-center rounded-md bg-[#2169a8] text-white hover:bg-[#1a568a] transition"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
