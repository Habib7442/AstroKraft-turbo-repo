import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";
import { PolicyPage } from "@/components/policy-page";
import { DATA_PROCESSORS } from "@/lib/data-processors";

const CONTACT_EMAIL = "vastubipra@gmail.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Privacy Policy",
    description: "How AstroKraft collects, uses, shares, retains and protects your personal data, and your rights.",
    path: "/privacy-policy",
    locale: isValidLocale(locale) ? locale : "en"
  });
}

// "Last updated" must match PRIVACY_NOTICE_VERSION in @astrokraft/validators.
export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

  return (
    <PolicyPage title="Privacy Policy" updatedAt="October 3, 2026">
      <p>
        This notice explains what personal data AstroKraft (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, why, who
        we share it with, how long we keep it, and the rights you have under India&rsquo;s Digital Personal Data
        Protection Act, 2023. AstroKraft, Rangirkhari, Silchar, Assam, India, is the Data Fiduciary for this data.
      </p>

      <div>
        <h2>What We Collect and Why</h2>
        <ul>
          <li>
            <strong>Account:</strong> name, email address and phone number, through our sign-in provider, to give
            you an account, order history and bookings.
          </li>
          <li>
            <strong>Orders:</strong> shipping name, phone number and address, items and payment status, to deliver
            your order, send invoices and handle returns or refunds.
          </li>
          <li>
            <strong>Consultations:</strong> name, phone number, and the date, time and place of birth you provide,
            to prepare and deliver your astrology consultation.
          </li>
          <li>
            <strong>Purohit bookings:</strong> name, phone number, puja location, preferred date and language, your
            message and any file you attach, to call you back and arrange the puja.
          </li>
          <li>
            <strong>Reviews and testimonials:</strong> your name, rating and comment, shown publicly once approved.
            For testimonials we also briefly keep your IP address to stop spam.
          </li>
          <li>
            <strong>Free tools (Kundli, gemstone recommendation):</strong> birth details are used only to compute
            your chart on the spot. We do not store them.
          </li>
          <li>
            <strong>Usage data:</strong> pages visited and clicks, to understand which parts of the site are
            useful. See &ldquo;Cookies and Analytics&rdquo; below.
          </li>
        </ul>
        <p>
          We process this data because you gave it to us for the stated purpose, or with your consent, which you
          give through the checkbox on each form. We use it only for that purpose, and never for advertising or
          sale.
        </p>
      </div>

      <div>
        <h2>Who We Share It With</h2>
        <p>
          We share personal data only with the service providers below, under contract, and only what each needs
          to do its job. Some of them process data outside India (for example in the United States). Apart from
          approved reviews and testimonials, which show your name, rating and comment publicly, only our own staff
          see your details, through our admin app.
        </p>
        <ul>
          {DATA_PROCESSORS.map((p) => (
            <li key={p.name}>
              <strong>{p.name}</strong>: {p.purpose}. Data: {p.data}.
            </li>
          ))}
        </ul>
        <p>We may also disclose data where Indian law requires it, for example to a court or tax authority.</p>
      </div>

      <div>
        <h2>How Long We Keep It</h2>
        <ul>
          <li>Unpaid or abandoned orders and consultation bookings: 30 days.</li>
          <li>Rejected reviews and testimonials: 30 days. Testimonial IP addresses: 30 days.</li>
          <li>Purohit booking requests: 90 days after the preferred puja date. Attached files: up to 180 days after upload.</li>
          <li>
            Paid orders and consultations, including the invoice details: 8 years, as required by Indian tax and
            company law, then deleted. If you delete your account, we remove your birth details and phone number
            from paid consultation records straight away, keeping only what the invoice needs.
          </li>
          <li>Your account: until you delete it. Approved reviews: until you ask us to remove them.</li>
        </ul>
        <p>Deletion runs automatically every day.</p>
      </div>

      <div>
        <h2>Your Rights</h2>
        <ul>
          <li>
            <strong>Access:</strong> get a summary of your data and who we have shared it with. Signed-in customers
            can download it instantly from <Link href={`/${locale}/my-data`}>Your Data &amp; Privacy</Link>.
          </li>
          <li>
            <strong>Correction:</strong> ask us to correct, complete or update your data.
          </li>
          <li>
            <strong>Erasure and withdrawing consent:</strong> delete your account from{" "}
            <Link href={`/${locale}/my-data`}>Your Data &amp; Privacy</Link>, or email us to withdraw consent for
            a booking, review or testimonial. We then stop processing and erase the data, except records the law
            requires us to keep. Withdrawing does not affect processing already done, or an order already paid
            for.
          </li>
          <li>
            <strong>Nomination:</strong> nominate another person to exercise these rights if you die or become
            unable to.
          </li>
          <li>
            <strong>Grievance redressal:</strong> complain to our Grievance Officer (below). If you are not
            satisfied with our response, you may complain to the Data Protection Board of India.
          </li>
        </ul>
        <p>For anything other than self-service download or account deletion, email {mail}.</p>
      </div>

      <div>
        <h2>Grievance Officer</h2>
        <p>
          Grievance Officer, AstroKraft, Rangirkhari, Silchar, Assam, India. Email: {mail}. We acknowledge
          requests within 48 hours and resolve them within 30 days. We may ask you to verify your identity first.
        </p>
      </div>

      <div>
        <h2>Children</h2>
        <p>
          Our services are for adults. You must be 18 or older to place an order, book a consultation or Purohit,
          or submit a testimonial, and you confirm this on each form. If you believe a child has given us personal
          data, email {mail} and we will delete it.
        </p>
      </div>

      <div>
        <h2>Security and Data Breaches</h2>
        <p>
          We protect your data with access controls that limit each record to you and our authorised staff,
          encrypted connections, private storage for uploaded files, and payment handled entirely by Razorpay. We
          do not store card, UPI or netbanking credentials. If a personal data breach occurs, we will inform you
          and the Data Protection Board of India as the law requires, with what happened and what you can do.
        </p>
      </div>

      <div>
        <h2>Cookies and Analytics</h2>
        <p>
          We use only strictly necessary cookies: the sign-in session from Clerk, and Razorpay&rsquo;s checkout
          cookies, loaded only when you start a payment. We use no advertising cookies.
        </p>
        <p>
          Our PostHog analytics store nothing on your device and do not record your screen or what you type into
          forms. We never link analytics to your name, email or phone number. As with any web request, your IP
          address reaches the analytics service, which discards it rather than storing it. Your browser&rsquo;s &ldquo;Do Not Track&rdquo; setting is
          respected.
        </p>
      </div>

      <div>
        <h2>Language</h2>
        <p>
          On request, we will provide this notice in any language listed in the Eighth Schedule to the
          Constitution of India, including Hindi, Bengali and Assamese. Email {mail}.
        </p>
      </div>

      <div>
        <h2>Changes to This Policy</h2>
        <p>
          If we change how we use your data, we will update this page and its date. Where the change needs your
          consent, we will ask for it again before applying it to you.
        </p>
      </div>
    </PolicyPage>
  );
}
