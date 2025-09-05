import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About Us - The Story Behind Landform Labs",
  description:
    "Learn how Landform Labs transforms your outdoor adventures into beautiful 3D printed keepsakes. Discover our mission to help adventurers own their epic moments.",
  keywords: [
    "about landform labs",
    "adventure keepsakes",
    "3D printing story",
    "outdoor gear company",
    "custom memorabilia",
  ],
};

export default function About() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <div className="bg-alpine-mist py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-headline font-bold text-basalt sm:text-5xl lg:text-6xl">
                We Turn Your{" "}
                <span className="text-gradient-adventure">
                  &ldquo;Remember That Epic Hike?&rdquo;
                </span>{" "}
                Into Something You Can Actually Hold
              </h1>
              <p className="mt-6 max-w-3xl mx-auto text-xl text-slate-storm">
                As an avid cyclist, I was always frustrated that my most
                memorable rides and races were just lines on a map or photos on
                my phone. I wanted something more tangible, something that
                captured the essence of those adventures.
              </p>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-headline font-bold text-basalt mb-6">
                The Story Behind the Story
              </h2>
              <p className="text-slate-storm leading-relaxed mb-6">
                Landform Labs was born from a simple realization: your most epic
                adventures deserve better than being buried in your camera roll
                or stuck in your Strava history.
              </p>
              <p className="text-slate-storm leading-relaxed mb-6">
                We&rsquo;re that friend who actually <em>gets</em> why you spent
                three hours describing a rock formation, and we figured out how
                to turn those GPS breadcrumbs from your &ldquo;easy 5-mile
                loop&rdquo; (that definitely wasn&rsquo;t 5 miles or easy) into
                something awesome enough for your coffee table.
              </p>

              <h2 className="text-3xl font-headline font-bold text-basalt mt-16 mb-6">
                What We Actually Do
              </h2>
              <p className="text-xl text-summit-sage font-headline font-semibold mb-6">
                We transform your outdoor memories into tangible keepsakes that
                don&rsquo;t suck.
              </p>

              <div className="grid gap-8 md:grid-cols-2 mt-8">
                <div className="bg-summit-sage/5 rounded-lg p-6">
                  <h3 className="font-headline font-bold text-basalt text-lg mb-3">
                    Route Prints
                  </h3>
                  <p className="text-slate-storm text-sm">
                    That time you got &ldquo;slightly&rdquo; lost and
                    accidentally discovered the most beautiful trail ever? We
                    turn that squiggly GPS line into stunning 3D art that makes
                    you look like the adventure legend you are.
                  </p>
                </div>

                <div className="bg-desert-stone/5 rounded-lg p-6">
                  <h3 className="font-headline font-bold text-basalt text-lg mb-3">
                    Adventure Ornaments
                  </h3>
                  <p className="text-slate-storm text-sm">
                    Because your Christmas tree deserves better than generic
                    baubles. Your favorite peak as a holiday decoration?{" "}
                    <em>Chef&rsquo;s kiss.</em>
                  </p>
                </div>

                <div className="bg-slate-storm/5 rounded-lg p-6">
                  <h3 className="font-headline font-bold text-basalt text-lg mb-3">
                    Desk Accessories
                  </h3>
                  <p className="text-slate-storm text-sm">
                    Mountain-shaped pen holders and trail-inspired organizers
                    that make Monday meetings slightly less soul-crushing. Your
                    coworkers will be jealous.
                  </p>
                </div>

                <div className="bg-basalt/5 rounded-lg p-6">
                  <h3 className="font-headline font-bold text-basalt text-lg mb-3">
                    Custom Keepsakes
                  </h3>
                  <p className="text-slate-storm text-sm">
                    That summit you thought would kill you but didn&rsquo;t?
                    That trail where you had your biggest breakthrough? We make
                    those moments into something you can actually hold.
                  </p>
                </div>
              </div>

              <h2 className="text-3xl font-headline font-bold text-basalt mt-16 mb-6">
                Why We&rsquo;re Obsessed With This
              </h2>
              <p className="text-slate-storm leading-relaxed mb-4">
                Here&rsquo;s the thing about adventures: they change you. That
                random Tuesday hike where you finally felt like yourself again.
                The trail that kicked your butt but gave you confidence you
                never knew you had. The route you&rsquo;ve done a hundred times
                that somehow still surprises you.
              </p>
              <p className="text-slate-storm leading-relaxed mb-4">
                Those moments matter. They deserve more than a Strava post and a
                fading memory.
              </p>
              <p className="text-slate-storm leading-relaxed mb-6">
                We believe your adventures should live in your everyday life,
                not just your photo albums. Because when you&rsquo;re having a
                rough day and you see that impossible trail you conquered
                sitting on your desk? That&rsquo;s not just décor. That&rsquo;s
                proof you&rsquo;re way more badass than you remember.
              </p>

              <div className="bg-summit-sage p-8 rounded-lg text-center mt-12">
                <p className="text-3xl font-headline font-bold text-alpine-mist">
                  Get Out There, Amaze Yourself, Own It, Repeat
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Our Approach Section */}
        <div className="bg-desert-stone py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-headline font-bold text-alpine-mist sm:text-4xl">
                Built Different
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="text-center border-2 border-alpine-mist p-6 rounded-lg">
                <h3 className="font-headline font-bold text-alpine-mist text-lg mb-2">
                  Craftfully Honest
                </h3>
                <p className="text-alpine-mist/90 text-sm">
                  Your GPS data might look like spaghetti, but our 3D print of
                  it will be gorgeous. Work with you every step of the way to
                  ensure the final result is exactly what you want.
                </p>
              </div>

              <div className="text-center border-2 border-alpine-mist p-6 rounded-lg">
                <h3 className="font-headline font-bold text-alpine-mist text-lg mb-2">
                  Meaningfully Personal
                </h3>
                <p className="text-alpine-mist/90 text-sm">
                  This isn&rsquo;t mass-produced adventure-themed stuff with
                  mountains slapped on it. Every piece we create tells{" "}
                  <em>your</em> story.
                </p>
              </div>

              <div className="text-center border-2 border-alpine-mist p-6 rounded-lg">
                <h3 className="font-headline font-bold text-alpine-mist text-lg mb-2">
                  Cleverly Practical
                </h3>
                <p className="text-alpine-mist/90 text-sm">
                  Beautiful proof that actually reminds you that hard work pays
                  off. Tap your phone and instantly relive your most epic
                  adventures.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Get Out There Section */}
        <div className="bg-basalt py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-headline font-bold text-alpine-mist sm:text-4xl mb-6">
              Get Out There (Then Bring It Home)
            </h2>
            <p className="text-lg text-alpine-mist/90 leading-relaxed mb-6">
              We&rsquo;re here for the &ldquo;Own It&rdquo; part. Because after
              you&rsquo;ve gotten out there and amazed yourself, you deserve
              something tangible to prove it happened. Something that reminds
              you daily that you&rsquo;re the kind of person who does impossible
              things for fun.
            </p>
            <p className="text-xl text-alpine-mist font-headline mb-8">
              Your adventures shaped you. Now let us help you shape them back.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/products" className="btn-primary">
                See What We Make
              </Link>
              <Link
                href="/contact"
                className="bg-transparent border-2 border-alpine-mist text-alpine-mist hover:bg-alpine-mist hover:text-basalt font-headline font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Let&rsquo;s Create Something Awesome
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
