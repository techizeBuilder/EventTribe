import { Link } from "react-router-dom";

const UserDashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 shadow-lg">
        <div className="p-5">
          <h2 className="text-xl font-bold">WELCOME BACK, FARHAN</h2>
          <nav className="mt-6">
            <ul>
              <li>
                <Link
                  to="/user/dashboard/bookings"
                  className="flex items-center gap-3 py-2 px-4 rounded-md text-sm hover:bg-gray-700"
                >
                  My Bookings
                </Link>
              </li>
              <li>
                <Link
                  to="/user/dashboard/payment-details"
                  className="flex items-center gap-3 py-2 px-4 rounded-md text-sm hover:bg-gray-700"
                >
                  Payment Details
                </Link>
              </li>
              <li>
                <Link
                  to="/user/dashboard/reservations"
                  className="flex items-center gap-3 py-2 px-4 rounded-md text-sm hover:bg-gray-700"
                >
                  My Reservations
                </Link>
              </li>
              <li>
                <Link
                  to="/user/dashboard/upcoming-events"
                  className="flex items-center gap-3 py-2 px-4 rounded-md text-sm hover:bg-gray-700"
                >
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link
                  to="/user/dashboard/past-events"
                  className="flex items-center gap-3 py-2 px-4 rounded-md text-sm hover:bg-gray-700"
                >
                  Past Events
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main section */}
      <div className="flex-grow p-6">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Link
              to="/user/dashboard/my-reservations"
              className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700"
            >
              My Reservations
            </Link>
            <Link
              {/* to="/user/dashboard/logout" */}
              className="px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700"
            >
              Log Out
            </Link>
          </div>
        </header>

      </div>
    </div>
  );
};

export default UserDashboard;
