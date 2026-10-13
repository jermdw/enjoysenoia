import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle } from 'lucide-react';
import SEO from '../components/common/SEO';

/**
 * Answers are written from what the site already publishes (Welcome Center
 * details in the footer, the event pages' vendor application buttons). Keep
 * them to facts the DDA has confirmed. When an answer varies by event, point
 * to the event's own page rather than naming an event inbox, so the event page
 * is the one place contacts need to be kept current.
 *
 * `a` is plain text for the FAQPage structured data; `body` is what renders,
 * so an answer can carry links.
 */
const email = (address) => (
  <a href={`mailto:${address}`} className="text-senoia-red font-medium hover:underline">
    {address}
  </a>
);

const link = (to, label) => (
  <Link to={to} className="text-senoia-red font-medium hover:underline">
    {label}
  </Link>
);

const external = (href, label) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-senoia-red font-medium hover:underline"
  >
    {label}
  </a>
);

const SECTIONS = [
  {
    title: 'Visiting & the Welcome Center',
    items: [
      {
        q: 'Where is the Welcome Center and when is it open?',
        a: 'The Welcome Center is at 68 Main St, Senoia, GA 30276. Hours are Monday through Thursday 11:00 AM to 3:00 PM, and Friday and Saturday 11:00 AM to 4:00 PM. You can call (770) 727-9173.',
        body: (
          <>
            The Welcome Center is at <strong>68 Main St</strong>, Senoia, GA 30276. Hours are Monday
            through Thursday 11:00 AM – 3:00 PM, and Friday and Saturday 11:00 AM – 4:00 PM. You can
            call <a href="tel:770-727-9173" className="text-senoia-red font-medium hover:underline">(770) 727-9173</a>.
          </>
        ),
      },
      {
        q: 'What is the best way to reach someone with a question?',
        a: 'Use the contact form or email info@enjoysenoia.com for general questions. For a specific event, use the contact listed on that event\'s page. Replies can take a little while.',
        body: (
          <>
            Use the {link('/contact', 'contact form')} or email {email('info@enjoysenoia.com')} for
            general questions. For a specific event, use the contact listed on that event's page.
            Replies can take a little while.
          </>
        ),
      },
      {
        q: 'Where can I rent a space for an event or gathering?',
        a: 'It depends on the venue. The Senoia Welcome Center rents its space depending on when you need it. The Senoia Farmers\' Market should be contacted directly through senoiafarmersmarket.com. The Stone Lodge at Marimac Lake and Freeman Sasser at Seavy Street park are managed by the City of Senoia (senoia.com/parksites). The Senoia Area Historical Society rents a meeting room (senoiahistory.com/meeting-room). Other downtown places that rent space include The Veranda, Pearl & Pine Brewery, Maguires Irish Pub, and The Classic Market, and a new venue is planned for the old Buggy Shop in early 2027.',
        body: (
          <>
            <p>It depends on the venue:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5">
              <li>
                <strong>Senoia Welcome Center:</strong> yes, we rent out our space depending on when
                you need it. Email {email('welcome@enjoysenoia.com')}.
              </li>
              <li>
                <strong>Senoia Farmers' Market:</strong> contact them directly at{' '}
                {external('https://www.senoiafarmersmarket.com/', 'senoiafarmersmarket.com')}.
              </li>
              <li>
                <strong>The Stone Lodge at Marimac Lake</strong> and{' '}
                <strong>Freeman Sasser at Seavy Street park</strong> are managed by the City;
                details are at {external('https://www.senoia.com/parksites', 'senoia.com/parksites')}.
              </li>
              <li>
                <strong>Senoia Area Historical Society:</strong> rents a{' '}
                {external('https://senoiahistory.com/meeting-room', 'meeting room')}.
              </li>
              <li>
                <strong>Other downtown spaces:</strong> The Veranda, Pearl &amp; Pine Brewery,
                Maguires Irish Pub, and The Classic Market also rent space, and a new venue is
                planned for the old Buggy Shop in early 2027.
              </li>
            </ul>
          </>
        ),
      },
      {
        q: 'How can I send the DDA a message?',
        a: 'Use the contact form on the Contact Us page, or email info@enjoysenoia.com. For a specific event, use the contact listed on that event\'s page.',
        body: (
          <>
            Use the {link('/contact', 'contact form')}, or email {email('info@enjoysenoia.com')}{' '}
            directly. For a specific event, use the contact listed on that event's page.
          </>
        ),
      },
      {
        q: 'What is the mailing address?',
        a: 'Senoia DDA, PO Box 310, Senoia, GA 30276.',
        body: <>Senoia DDA, PO Box 310, Senoia, GA 30276.</>,
      },
    ],
  },
  {
    title: 'Events',
    items: [
      {
        q: 'Where can I see what is coming up?',
        a: 'The Upcoming Events page lists every scheduled event with its date, location, and a link to details. Past Events keeps the archive.',
        body: (
          <>
            {link('/events', 'Upcoming Events')} lists every scheduled event with its date, location,
            and a link to details. {link('/past-events', 'Past Events')} keeps the archive.
          </>
        ),
      },
      {
        q: 'Who do I contact about a specific event?',
        a: 'Open the event on the Upcoming Events page. Each event\'s page lists who to contact and any sign-up or application links. If a page has no contact listed, use the contact form.',
        body: (
          <>
            Open the event on the {link('/events', 'Upcoming Events')} page. Each event's page lists who
            to contact, along with any sign-up or application links. If a page has no contact listed,
            use the {link('/contact', 'contact form')}.
          </>
        ),
      },
      {
        q: 'How do I become a vendor at a downtown event?',
        a: 'Each event has its own application process, and its application is on that event\'s page on the Upcoming Events page. If an event\'s page has no application, use the contact form.',
        body: (
          <>
            Each event has its own application process, and the application is on that event's page on
            the {link('/events', 'Upcoming Events')} page. If an event's page has no application, use
            the {link('/contact', 'contact form')}.
          </>
        ),
      },
      {
        q: 'How do I volunteer at an event?',
        a: 'Each event posts its own volunteer sign-ups closer to the date. Look on that event\'s page on the Upcoming Events page, and check back if you do not see one yet. You can also use the contact form.',
        body: (
          <>
            Each event posts its own volunteer sign-ups closer to the date. Look on that event's page on
            the {link('/events', 'Upcoming Events')} page, and check back if you don't see one yet. You
            can also use the {link('/contact', 'contact form')}.
          </>
        ),
      },
      {
        q: 'Where can I find Halloween and Masquerade information?',
        a: 'Halloween in Senoia and The Halloween Masquerade each have their own page with schedules, maps, and sign-ups.',
        body: (
          <>
            Halloween in Senoia and The Halloween Masquerade each have their own page with schedules,
            maps, and sign-ups: {link('/halloween', 'Halloween in Senoia')} and{' '}
            {link('/masquerade', 'The Halloween Masquerade')}.
          </>
        ),
      },
      {
        q: 'Are there photos and videos from past events?',
        a: 'Yes. Photo galleries and videos from past events are on the Media page.',
        body: (
          <>
            Yes. Photo galleries and videos from past events are on the {link('/media', 'Media')} page.
          </>
        ),
      },
    ],
  },
  {
    title: 'Businesses & the DDA',
    items: [
      {
        q: 'How do I get my business listed in the downtown directory?',
        a: 'Email info@enjoysenoia.com with your business name, address, phone, website, and a short description.',
        body: (
          <>
            Email {email('info@enjoysenoia.com')} with your business name, address, phone, website,
            and a short description. Browse the current listings in the{' '}
            {link('/downtown-businesses', 'business directory')}.
          </>
        ),
      },
      {
        q: 'Is help available for opening or improving a downtown business?',
        a: 'Yes. The DDA Business Portal covers façade grants, permit and guideline information, and how to reach the DDA about opening a business.',
        body: (
          <>
            Yes. The {link('/dda-business-portal', 'DDA Business Portal')} covers façade grants,
            permit and guideline information, and how to reach the DDA about opening a business.
          </>
        ),
      },
      {
        q: 'Where are DDA meeting agendas, minutes, and forms?',
        a: 'On the Files, Forms & Downloads page, which also holds the façade grant application and the DDA bylaws.',
        body: (
          <>
            On the {link('/files-forms-and-downloads', 'Files, Forms & Downloads')} page, which also
            holds the façade grant application and the DDA bylaws.
          </>
        ),
      },
      {
        q: 'What does the DDA do?',
        a: 'The Senoia Downtown Development Authority works to revitalize, enhance, promote, and stimulate the economic development of Senoia while maintaining its historical integrity and charm.',
        body: (
          <>
            The Senoia Downtown Development Authority works to revitalize, enhance, promote, and
            stimulate the economic development of Senoia while maintaining its historical integrity
            and charm. Learn more on {link('/about-the-dda', 'About the DDA')}.
          </>
        ),
      },
    ],
  },
];

const STRUCTURED_DATA_ID = 'faq-structured-data';

export default function FaqPage() {
  // FAQPage JSON-LD, added while this page is mounted so it never lingers on
  // other routes.
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = STRUCTURED_DATA_ID;
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: SECTIONS.flatMap((section) => section.items).map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title="Frequently Asked Questions"
        description="Answers to common questions about visiting Senoia, the Welcome Center, downtown events, vendor applications, volunteering, and the business directory."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
            <HelpCircle className="w-4 h-4 text-senoia-gold" />
            <span>Help & Information</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-stone-900">
            Frequently Asked Questions
          </h1>
          <p className="text-stone-600 text-base sm:text-lg">
            Quick answers about visiting downtown Senoia, events, vendor applications, and the DDA.
            Can't find what you need? Use the {link('/contact', 'contact form')}, email{' '}
            {email('info@enjoysenoia.com')}, or stop by the Welcome Center.
          </p>
        </div>

        {SECTIONS.map((section) => (
          <section key={section.title} className="space-y-3" aria-labelledby={`faq-${section.title}`}>
            <h2
              id={`faq-${section.title}`}
              className="text-xl font-bold font-serif text-stone-900"
            >
              {section.title}
            </h2>
            {/* Native <details> keeps this keyboard- and screen-reader-friendly
                with no accordion state to manage. */}
            <div className="bg-white rounded-2xl shadow-xs border border-stone-200 divide-y divide-stone-200">
              {section.items.map((item) => (
                <details key={item.q} className="group">
                  <summary className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="font-semibold text-stone-900">{item.q}</span>
                    <ChevronDown className="w-5 h-5 shrink-0 text-senoia-gold transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="px-5 sm:px-6 pb-5 -mt-1 text-sm sm:text-base text-stone-600 leading-relaxed">
                    {item.body}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
