"use client";

import { useState } from "react";
import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Note: Metadata export cannot be used in client components
// This would need to be moved to a separate metadata file in production

const contactInfo = [
  {
    title: "General Inquiries",
    email: "hello@landformlabs.co",
    description: "Questions about products, shipping, or just want to say hi?",
  },
  {
    title: "Sales & Custom Orders",
    email: "sales@landformlabs.co",
    description:
      "Ready to turn your epic adventure into jaw dropping proof of what you've done?",
  },
  {
    title: "Support",
    email: "support@landformlabs.co",
    description: "Issues with your order or need help with your NFC chip?",
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    projectType: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission - in production, this would connect to your form handler
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSubmitMessage(
      "Thanks for reaching out! We&rsquo;ll get back to you within 24 hours.",
    );
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
      projectType: "",
    });
    setIsSubmitting(false);
  };

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <div className="bg-alpine-mist py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-headline font-bold text-basalt sm:text-5xl lg:text-6xl">
                Let&rsquo;s Create Something{" "}
                <span className="text-gradient-adventure">Epic Together</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-storm">
                Got questions about turning your adventure into proof that
                you're awesome? Want to start a custom project? We&rsquo;d love
                to hear from you.
              </p>
            </div>
          </div>
        </div>

        <div className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
              {/* Contact Form */}
              <div>
                <h2 className="text-3xl font-headline font-bold text-basalt mb-6">
                  Send Us a Message
                </h2>
                <p className="text-slate-storm mb-8">
                  Fill out the form below and we&rsquo;ll get back to you within
                  24 hours. The more details you can share about your adventure,
                  the better we can help bring it to life!
                </p>

                {submitMessage && (
                  <div className="mb-6 p-4 bg-summit-sage/10 border border-summit-sage/20 rounded-lg">
                    <p className="text-summit-sage font-headline">
                      {submitMessage}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-headline font-semibold text-basalt mb-2"
                      >
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-slate-storm/20 rounded-lg focus-ring focus:border-summit-sage text-basalt"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-headline font-semibold text-basalt mb-2"
                      >
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-slate-storm/20 rounded-lg focus-ring focus:border-summit-sage text-basalt"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="projectType"
                      className="block text-sm font-headline font-semibold text-basalt mb-2"
                    >
                      What are you interested in?
                    </label>
                    <select
                      id="projectType"
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-storm/20 rounded-lg focus-ring focus:border-summit-sage text-basalt"
                    >
                      <option value="">Select a product type</option>
                      <option value="route-tile">Route Tile</option>
                      <option value="route-ornament">Route Ornament</option>
                      <option value="state-ornament">State Ornament</option>
                      <option value="pen-holder">Mountain Pen Holder</option>
                      <option value="custom">Custom Project</option>
                      <option value="question">General Question</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-headline font-semibold text-basalt mb-2"
                    >
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-storm/20 rounded-lg focus-ring focus:border-summit-sage text-basalt"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-headline font-semibold text-basalt mb-2"
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-slate-storm/20 rounded-lg focus-ring focus:border-summit-sage text-basalt resize-none"
                      placeholder="Tell us about your adventure! Include details like:
• Link to your Strava/Garmin/Komoot activity
• What makes this route special to you
• Any specific customization requests
• Questions about sizing, colors, or pricing"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`btn-primary w-full ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>

              {/* Contact Info */}
              <div>
                <h2 className="text-3xl font-headline font-bold text-basalt mb-6">
                  Get In Touch
                </h2>
                <p className="text-slate-storm mb-8">
                  Prefer to email directly? No problem! Here are the best ways
                  to reach us depending on what you need.
                </p>

                <div className="space-y-6">
                  {contactInfo.map((contact, index) => (
                    <div
                      key={index}
                      className="bg-summit-sage/5 rounded-lg p-6"
                    >
                      <h3 className="font-headline font-bold text-basalt text-lg mb-2">
                        {contact.title}
                      </h3>
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-summit-sage font-headline font-semibold hover:text-summit-sage/80 transition-colors duration-200"
                      >
                        {contact.email}
                      </a>
                      <p className="text-slate-storm text-sm mt-2">
                        {contact.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Quick Info */}
                <div className="mt-12 bg-basalt rounded-lg p-6">
                  <h3 className="font-headline font-bold text-alpine-mist text-lg mb-4">
                    Quick Info
                  </h3>
                  <div className="space-y-3 text-alpine-mist/90">
                    <div>
                      <strong className="text-alpine-mist">
                        Response Time:
                      </strong>{" "}
                      Within 24 hours
                    </div>
                    <div>
                      <strong className="text-alpine-mist">
                        Custom Order Timeline:
                      </strong>{" "}
                      1-2 weeks
                    </div>
                    <div>
                      <strong className="text-alpine-mist">
                        GPS Data Formats:
                      </strong>{" "}
                      GPX, Strava links, Garmin Connect, Komoot
                    </div>
                    <div>
                      <strong className="text-alpine-mist">Shipping:</strong>{" "}
                      Worldwide (US processing)
                    </div>
                  </div>
                </div>

                {/* Visit Our Etsy */}
                <div className="mt-8">
                  <h3 className="font-headline font-bold text-basalt text-lg mb-4">
                    Browse Ready-Made Products
                  </h3>
                  <p className="text-slate-storm mb-4">
                    Want to see our work in action? Check out our Etsy store for
                    examples and ready-to-ship items.
                  </p>
                  <a
                    href="https://landformlabs.etsy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary inline-block"
                  >
                    Visit Our Etsy Store
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Teaser */}
        <div className="bg-summit-sage py-12">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-headline font-bold text-alpine-mist mb-4">
              Still Have Questions?
            </h2>
            <p className="text-alpine-mist/90 mb-6">
              Check out our FAQ page for answers to common questions about
              materials, shipping, customization, and more.
            </p>
            <a href="/faq" className="btn-accent">
              View FAQ
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
