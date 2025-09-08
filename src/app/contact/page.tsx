import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <div className="bg-alpine-mist py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-headline font-bold text-basalt sm:text-5xl lg:text-6xl">
                Let's Create Something{" "}
                <span className="text-gradient-adventure">Epic Together</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-storm">
                Got questions about turning your adventure into proof that
                you're awesome? Want to start a custom project? We'd love to
                hear from you.
              </p>
            </div>
          </div>
        </div>

        <div className="py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-headline font-bold text-basalt mb-6">
                Get In Touch
              </h2>
              <p className="text-slate-storm text-lg">
                Ready to turn your adventure into something amazing? Choose the
                best way to reach us based on what you need.
              </p>
            </div>

            <div className="space-y-8 mb-16">
              {contactInfo.map((contact, index) => (
                <div
                  key={index}
                  className="bg-summit-sage/5 rounded-lg p-8 hover:bg-summit-sage/10 transition-colors duration-200"
                >
                  <div className="md:flex md:items-center md:justify-between">
                    <div className="md:flex-1">
                      <h3 className="font-headline font-bold text-basalt text-2xl mb-2">
                        {contact.title}
                      </h3>
                      <p className="text-slate-storm text-base leading-relaxed mb-4 md:mb-0">
                        {contact.description}
                      </p>
                    </div>
                    <div className="md:ml-8 md:flex-shrink-0">
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-summit-sage font-headline font-semibold text-lg hover:text-summit-sage/80 transition-colors duration-200 inline-block whitespace-nowrap"
                      >
                        {contact.email}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Info */}
            <div className="bg-basalt rounded-lg p-8 mb-12">
              <h3 className="font-headline font-bold text-alpine-mist text-2xl mb-6 text-center">
                Quick Info
              </h3>
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 text-alpine-mist/90">
                <div className="text-center">
                  <strong className="text-alpine-mist block mb-2 text-lg">
                    Response Time
                  </strong>
                  <span className="text-base">Within 24 hours</span>
                </div>
                <div className="text-center">
                  <strong className="text-alpine-mist block mb-2 text-lg">
                    Custom Timeline
                  </strong>
                  <span className="text-base">1-2 weeks</span>
                </div>
                <div className="text-center">
                  <strong className="text-alpine-mist block mb-2 text-lg">
                    GPS Formats
                  </strong>
                  <span className="text-base">GPX, Strava, Garmin, Komoot</span>
                </div>
                <div className="text-center">
                  <strong className="text-alpine-mist block mb-2 text-lg">
                    Shipping
                  </strong>
                  <span className="text-base">Worldwide (US processing)</span>
                </div>
              </div>
            </div>

            {/* Visit Our Etsy */}
            <div className="text-center">
              <h3 className="font-headline font-bold text-basalt text-2xl mb-4">
                Browse Ready-Made Products
              </h3>
              <p className="text-slate-storm mb-6 text-lg">
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
