const ManageMarketing = () => {
  return (
    <div className="min-h-screen p-6 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">Marketing</h1>

      <div className="mb-6">
        <p className="text-gray-400">
          Send an instant message to your fan base.
        </p>
        <h2 className="text-xl font-semibold mb-2">Farhan's Organization:</h2>
        <textarea
          className="w-full h-32 p-2 bg-gray-800 rounded-md border border-gray-600 text-white mb-4"
          placeholder="Type your message here. Use {firstName} to address the recipient by their first name."
        />
        <div className="flex items-center space-x-4 mb-4">
          <select className="p-2 bg-gray-800 text-white rounded-md">
            <option>Select Audience</option>
          </select>
          <select className="p-2 bg-gray-800 text-white rounded-md">
            <option>Select City</option>
          </select>
          <select className="p-2 bg-gray-800 text-white rounded-md">
            <option>Select Link</option>
          </select>
          <button className="py-2 px-4 bg-blue-600 rounded-md">
            Insert First Name
          </button>
        </div>
        <div className="flex justify-between">
          <button className="py-2 px-4 bg-blue-600 rounded-md">Preview</button>
          <button className="py-2 px-4 bg-blue-600 rounded-md">
            Send Message
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Past Campaigns</h3>
        <table className="w-full">
          <thead>
            <tr className="text-gray-400">
              <th className="text-left">Title & Date</th>
              <th className="text-left">Preview</th>
              <th className="text-left">Delivery</th>
            </tr>
          </thead>
          <tbody>
            {/* Example Row */}
            <tr className="hover:bg-gray-700">
              <td>Sample Campaign - 01 Jan 2023</td>
              <td>View</td>
              <td>Delivered</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageMarketing;
