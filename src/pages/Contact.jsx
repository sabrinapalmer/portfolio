import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your form submission logic here
    console.log("Form submitted:", formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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
        Contact Me
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact Information */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-purple-600 mb-4">
              Get in Touch
            </h3>
            <p className="text-gray-600 mb-6">
              I'd love to hear from you! Send me a message and I'll respond as
              soon as possible.
            </p>
          </div>

          <div className="space-y-4">
            <a
              href="mailto:your.email@example.com"
              className="flex items-center gap-3 text-gray-600 hover:text-purple-600 transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-full">
                <Mail size={20} className="text-purple-600" />
              </div>
              <span>your.email@example.com</span>
            </a>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="p-2 bg-purple-100 rounded-full">
                <Phone size={20} className="text-purple-600" />
              </div>
              <span>+1 (234) 567-8900</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="p-2 bg-purple-100 rounded-full">
                <MapPin size={20} className="text-purple-600" />
              </div>
              <span>Your Location</span>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-purple-400 
                       focus:ring focus:ring-purple-200 transition-all outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-purple-400 
                       focus:ring focus:ring-purple-200 transition-all outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-purple-400 
                       focus:ring focus:ring-purple-200 transition-all outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-gray-700 mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-purple-400 
                       focus:ring focus:ring-purple-200 transition-all outline-none resize-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 
                     hover:to-pink-500 text-white font-medium py-3 px-6 rounded-lg
                     transition-all duration-300 flex items-center justify-center gap-2
                     shadow-md hover:shadow-lg"
          >
            <Send size={20} />
            Send Message
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default Contact;
