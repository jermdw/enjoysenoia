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
      <SEO
        title="Enjoy Senoia"
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
