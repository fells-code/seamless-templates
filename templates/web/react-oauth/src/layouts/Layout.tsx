import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black">
      <Navbar />

      <main className="flex-1 pt-8 px-4 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
