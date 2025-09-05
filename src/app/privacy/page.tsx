import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy - Landform Labs",
  description:
    "Learn how Landform Labs protects your personal information, GPS data, and privacy when creating custom adventure keepsakes.",
  keywords: [
    "privacy policy",
    "data protection",
    "GPS data privacy",
    "landform labs privacy",
    "personal information",
  ],
};

export default function Privacy() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <div className="bg-alpine-mist py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-headline font-bold text-basalt sm:text-5xl lg:text-6xl">
                Privacy Policy
              </h1>
              <p className="mt-6 max-w-3xl mx-auto text-xl text-slate-storm">
                Your adventures are personal. Here&rsquo;s how we protect your
                privacy while helping you own your epic moments.
              </p>
              <p className="mt-4 text-sm text-slate-storm/70">
                Last updated:{" "}
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Policy Content */}
        <div className="py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <section className="mb-12">
                <h2 className="text-3xl font-headline font-bold text-basalt mb-6">
                  Who We Are
                </h2>
                <p className="text-slate-storm leading-relaxed mb-4">
                  Landform Labs is a small business that creates custom
                  3D-printed keepsakes from your outdoor adventures. We&rsquo;re
                  based in the United States and operate primarily through our
                  Etsy store and this website.
                </p>
                <p className="text-slate-storm leading-relaxed">
                  Contact us about privacy matters at:{" "}
                  <a
                    href="mailto:hello@landformlabs.co"
                    className="text-summit-sage hover:text-summit-sage/80"
                  >
                    hello@landformlabs.co
                  </a>
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-headline font-bold text-basalt mb-6">
                  Information We Collect
                </h2>

                <h3 className="text-xl font-headline font-semibold text-basalt mb-4">
                  GPS and Route Data
                </h3>
                <p className="text-slate-storm leading-relaxed mb-4">
                  To create your custom route prints, we collect:
                </p>
                <ul className="list-disc pl-6 text-slate-storm mb-6">
                  <li>GPS coordinates and route data from your activities</li>
                  <li>
                    Activity details (date, duration, distance) if provided
                  </li>
                  <li>
                    Links to public activity pages (Strava, Garmin Connect,
                    etc.)
                  </li>
                  <li>GPX files or similar GPS data formats</li>
                </ul>

                <h3 className="text-xl font-headline font-semibold text-basalt mb-4">
                  Contact Information
                </h3>
                <ul className="list-disc pl-6 text-slate-storm mb-6">
                  <li>Name and email address</li>
                  <li>Shipping address for physical products</li>
                  <li>Phone number (if provided for shipping purposes)</li>
                  <li>Custom order specifications and preferences</li>
                </ul>

                <h3 className="text-xl font-headline font-semibold text-basalt mb-4">
                  Website Usage Data
                </h3>
                <ul className="list-disc pl-6 text-slate-storm mb-6">
                  <li>Browser type, device information, and IP address</li>
                  <li>Pages visited and time spent on our website</li>
                  <li>How you found our website (referral sources)</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-headline font-bold text-basalt mb-6">
                  How We Use Your Information
                </h2>

                <div className="bg-summit-sage/5 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-headline font-semibold text-basalt mb-4">
                    Primary Purpose: Creating Your Custom Products
                  </h3>
                  <ul className="list-disc pl-6 text-slate-storm">
                    <li>Process GPS data to create 3D models of your routes</li>
                    <li>Design and manufacture your custom keepsakes</li>
                    <li>
                      Communicate about your order progress and specifications
                    </li>
                    <li>Ship completed products to your address</li>
                  </ul>
                </div>

                <h3 className="text-xl font-headline font-semibold text-basalt mb-4">
                  Other Uses
                </h3>
                <ul className="list-disc pl-6 text-slate-storm mb-6">
                  <li>
                    Respond to your questions and provide customer support
                  </li>
                  <li>Improve our website and product offerings</li>
                  <li>
                    Send occasional updates about new products (with your
                    consent)
                  </li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-headline font-bold text-basalt mb-6">
                  Your GPS Data is Special
                </h2>
                <div className="bg-desert-stone/5 border-l-4 border-desert-stone p-6 mb-6">
                  <p className="text-slate-storm leading-relaxed mb-4">
                    <strong>We get it.</strong> Your GPS data represents your
                    personal adventures, favorite trails, and maybe even secret
                    spots you don&rsquo;t want the world to know about.
                  </p>
                  <p className="text-slate-storm leading-relaxed">
                    Here&rsquo;s our promise: We use your GPS data{" "}
                    <strong>only</strong> to create your custom products. We
                    don&rsquo;t share routes, sell location data, or create any
                    kind of trail database from your information.
                  </p>
                </div>

                <h3 className="text-xl font-headline font-semibold text-basalt mb-4">
                  GPS Data Protection
                </h3>
                <ul className="list-disc pl-6 text-slate-storm mb-6">
                  <li>
                    GPS data is stored securely and deleted after order
                    completion
                  </li>
                  <li>We never share your route data with third parties</li>
                  <li>
                    Public activity links are only accessed to download your
                    specific route
                  </li>
                  <li>
                    We don&rsquo;t store or analyze aggregated location patterns
                  </li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-headline font-bold text-basalt mb-6">
                  Information Sharing
                </h2>

                <h3 className="text-xl font-headline font-semibold text-basalt mb-4">
                  We Don&rsquo;t Sell Your Information
                </h3>
                <p className="text-slate-storm leading-relaxed mb-6">
                  We never sell, rent, or trade your personal information or GPS
                  data to anyone. Period.
                </p>

                <h3 className="text-xl font-headline font-semibold text-basalt mb-4">
                  Limited Sharing for Business Operations
                </h3>
                <p className="text-slate-storm leading-relaxed mb-4">
                  We may share minimal information with:
                </p>
                <ul className="list-disc pl-6 text-slate-storm mb-6">
                  <li>
                    <strong>Shipping partners</strong> (name and address only,
                    for delivery)
                  </li>
                  <li>
                    <strong>Payment processors</strong> (for Etsy transactions -
                    handled by Etsy&rsquo;s privacy policy)
                  </li>
                  <li>
                    <strong>Email service providers</strong> (for order
                    communications)
                  </li>
                  <li>
                    <strong>Legal authorities</strong> (if required by law)
                  </li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-headline font-bold text-basalt mb-6">
                  Third-Party Services
                </h2>

                <h3 className="text-xl font-headline font-semibold text-basalt mb-4">
                  Etsy Integration
                </h3>
                <p className="text-slate-storm leading-relaxed mb-4">
                  Most of our sales happen through Etsy. When you purchase
                  through our Etsy store, Etsy&rsquo;s privacy policy also
                  applies to that transaction. We recommend reviewing
                  <a
                    href="https://www.etsy.com/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-summit-sage hover:text-summit-sage/80"
                  >
                    Etsy&rsquo;s Privacy Policy
                  </a>
                  .
                </p>

                <h3 className="text-xl font-headline font-semibold text-basalt mb-4">
                  Activity Platforms
                </h3>
                <p className="text-slate-storm leading-relaxed mb-6">
                  If you share links to activities on Strava, Garmin Connect, or
                  other platforms, we only access the specific data needed for
                  your order. We don&rsquo;t store login credentials or access
                  other activities.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-headline font-bold text-basalt mb-6">
                  Data Security
                </h2>
                <p className="text-slate-storm leading-relaxed mb-4">
                  We implement appropriate technical and organizational measures
                  to protect your information:
                </p>
                <ul className="list-disc pl-6 text-slate-storm mb-6">
                  <li>Secure file transfer and storage systems</li>
                  <li>
                    Limited access to personal information (only what&rsquo;s
                    needed for your order)
                  </li>
                  <li>Regular deletion of GPS data after order completion</li>
                  <li>Encrypted communications for sensitive information</li>
                </ul>

                <div className="bg-basalt/5 rounded-lg p-6">
                  <p className="text-slate-storm text-sm">
                    <strong>Note:</strong> While we strive to protect your
                    information, no method of transmission over the internet is
                    100% secure. We recommend being cautious about sharing
                    sensitive location information.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-headline font-bold text-basalt mb-6">
                  Your Rights and Choices
                </h2>

                <h3 className="text-xl font-headline font-semibold text-basalt mb-4">
                  Access and Control
                </h3>
                <p className="text-slate-storm leading-relaxed mb-4">
                  You can:
                </p>
                <ul className="list-disc pl-6 text-slate-storm mb-6">
                  <li>
                    Request a copy of the personal information we have about you
                  </li>
                  <li>Ask us to correct inaccurate information</li>
                  <li>
                    Request deletion of your information (after order
                    completion)
                  </li>
                  <li>Opt out of marketing communications at any time</li>
                </ul>

                <h3 className="text-xl font-headline font-semibold text-basalt mb-4">
                  Marketing Communications
                </h3>
                <p className="text-slate-storm leading-relaxed mb-6">
                  We&rsquo;ll only send you marketing emails if you explicitly
                  opt in. You can unsubscribe at any time using the link in our
                  emails or by contacting us directly.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-headline font-bold text-basalt mb-6">
                  International Users
                </h2>
                <p className="text-slate-storm leading-relaxed mb-6">
                  Landform Labs operates from the United States. If you&rsquo;re
                  located outside the US, your information may be transferred
                  to, stored, and processed in the United States. By using our
                  services, you consent to this transfer.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-headline font-bold text-basalt mb-6">
                  Children&rsquo;s Privacy
                </h2>
                <p className="text-slate-storm leading-relaxed mb-6">
                  Our services are not intended for children under 13. We
                  don&rsquo;t knowingly collect personal information from
                  children under 13. If you believe we have collected
                  information from a child, please contact us immediately.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-headline font-bold text-basalt mb-6">
                  Changes to This Policy
                </h2>
                <p className="text-slate-storm leading-relaxed mb-6">
                  We may update this privacy policy occasionally. When we do,
                  we&rsquo;ll update the &ldquo;Last updated&rdquo; date at the
                  top of this page. For significant changes, we&rsquo;ll notify
                  you by email if we have your contact information.
                </p>
              </section>

              <section className="mb-12 bg-summit-sage/10 rounded-lg p-8">
                <h2 className="text-3xl font-headline font-bold text-basalt mb-6">
                  Questions? We&rsquo;re Here to Help
                </h2>
                <p className="text-slate-storm leading-relaxed mb-4">
                  If you have questions about how we handle your information,
                  don&rsquo;t hesitate to reach out.
                </p>
                <div className="text-slate-storm">
                  <p className="mb-2">
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:hello@landformlabs.co"
                      className="text-summit-sage hover:text-summit-sage/80"
                    >
                      hello@landformlabs.co
                    </a>
                  </p>
                  <p className="mb-2">
                    <strong>Subject Line:</strong> Privacy Question
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
