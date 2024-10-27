import React from "react";
import { motion } from "framer-motion";

const Experience = () => {
  return (
    <motion.div
      className="p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2
        className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 
                     bg-clip-text text-transparent mb-8"
        style={{ fontFamily: "Josefin Sans, sans-serif", fontWeight: 700 }}
      >
        Experience
      </h2>

      {/* Add your experience content here */}
      <div className="space-y-8">
        <div className="p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-semibold text-purple-600 mb-2">
            Software Engineer
          </h3>
          <p className="text-gray-600 mb-4">Company Name • 2020 - Present</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Accomplishment 1</li>
            <li>Accomplishment 2</li>
            <li>Accomplishment 3</li>
          </ul>
        </div>

        {/* Add more experience items as needed */}
      </div>
    </motion.div>
  );
};

export default Experience;
