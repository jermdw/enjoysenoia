import React from 'react';
import SEO from '../components/common/SEO';
import Hero from '../components/home/Hero';
import WelcomeSection from '../components/home/WelcomeSection';
import UpcomingEvents from '../components/home/UpcomingEvents';
import RecurringEvents from '../components/home/RecurringEvents';
import LatestNews from '../components/home/LatestNews';
import InstagramEmbed from '../components/home/InstagramEmbed';
import NewsletterSection from '../components/home/NewsletterSection';

export default function HomePage() {
  return (
    <>
      {/* No title: SEO falls back to the site's own home title. Passing
          "Enjoy Senoia" here doubled it as "Enjoy Senoia | Enjoy Senoia | …". */}
      <SEO
        description="The mission of the Senoia DDA is to revitalize, enhance, promote, and stimulate the economic development of Senoia while maintaining its historical integrity and charm."
      />
      <Hero />
      <WelcomeSection />
      <UpcomingEvents />
      <RecurringEvents />
      <LatestNews />
      <InstagramEmbed />
      <NewsletterSection />
    </>
  );
}
