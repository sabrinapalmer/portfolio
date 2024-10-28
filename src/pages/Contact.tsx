import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { pageTransition } from "../utils/animation";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type SubmissionStatus = "idle" | "submitting" | "success" | "error";

const Contact: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState<SubmissionStatus>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    // Simulate form submission - replace with your actual form handling logic
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus("success");
      setFormState({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      setStatus("error");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <motion.div {...pageTransition}>
      <h2 className="font-josefin text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-8 inline-flex items-center">
        Contact Me
        <Mail className="text-pink-500 ml-2 mt-[-4px]" size={20} />
      </h2>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div className="space-y-8">
          <div className="prose prose-purple">
            <h3 className="font-josefin text-xl font-semibold text-purple-500">
              Let's Connect!
            </h3>
            <p className="font-josefin text-gray-600">
              I'm always interested in hearing about new projects and
              opportunities. Feel free to reach out!
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <Mail className="font-josefin text-purple-500 mt-1" size={20} />
              <div>
                <h4 className="font-josefin font-medium text-purple-500">
                  Email
                </h4>
                <p className="font-josefin text-gray-600">
                  sabrinampalmer@gmail.com
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="font-josefin block text-sm font-medium text-purple-500"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formState.name}
                onChange={handleChange}
                className="font-josefin mt-1 block w-full rounded-md border border-purple-200 shadow-sm p-3 
                       focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="font-josefin block text-sm font-medium text-purple-500"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formState.email}
                onChange={handleChange}
                className="font-josefin mt-1 block w-full rounded-md border border-purple-200 shadow-sm p-3 
                       focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="font-josefin block text-sm font-medium text-purple-500"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formState.message}
                onChange={handleChange}
                className="font-josefin mt-1 block w-full rounded-md border border-purple-200 shadow-sm p-3 
                       focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={status === "submitting"}
              className="font-josefin w-full flex items-center justify-center px-4 py-3 border border-transparent 
                     rounded-md shadow-sm text-white bg-gradient-to-r from-purple-400 to-pink-400 
                     hover:from-purple-400 hover:to-pink-400 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-purple-400 disabled:opacity-50 
                     disabled:cursor-not-allowed"
            >
              {status === "submitting" ? (
                "Sending..."
              ) : (
                <>
                  Send Message
                  <Send className="font-josefin ml-2" size={18} />
                </>
              )}
            </button>

            {status === "success" && (
              <p className="font-josefin text-green-600 text-center">
                Message sent successfully!
              </p>
            )}
            {status === "error" && (
              <p className="font-josefin text-red-600 text-center">
                There was an error sending your message. Please try again.
              </p>
            )}
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default Contact;
