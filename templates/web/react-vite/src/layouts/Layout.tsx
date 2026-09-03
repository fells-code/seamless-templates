import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Vista } from "../components/kit";

/*
 * The signed-in shell: sidebar beside full-width content, over the backdrop.
 *
 * `main` deliberately has no max-width and no padding of its own. A screen that
 * wants a centred column asks for one, and a screen that wants a full-bleed band
 * across the top can have that instead. Capping the width here is what makes
 * every page in an application look like the same centred document.
 */
export default function MainLayout() {
  return (
    <div className="app-shell-flow relative min-h-screen text-ink lg:flex">
      <Vista />
      <Navbar />

      <main className="above-vista min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
