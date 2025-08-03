import { AiDisclaimer } from "@/components/AiDisclaimer";

const PrivacyPolicy = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p>If you are entering data for a patient under 16, you confirm you are their parent or legal guardian and consent to processing their data.</p>
      <section>
        <h2 className="text-xl font-semibold">What data we collect</h2>
        <p>Name, contact info, health history, appointment info.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Why we collect it</h2>
        <p>Scheduling, reminders, and enabling dentists to treat patients effectively.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Who can access it</h2>
        <p>The dentist you booked with and their authorized staff.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">How we store it</h2>
        <p>Secure EU-based servers, encrypted, with strict access controls.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Your rights</h2>
        <p>You can request a copy of your data, correct it, or have it deleted anytime.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Contact</h2>
        <p>For privacy requests, email privacy@dentibot.be</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Legal basis</h2>
        <p>Explicit consent (checked during registration).</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Data retention</h2>
        <p>We delete inactive patient data after 24 months unless the dentist retains it longer under medical obligations.</p>
      </section>
      <AiDisclaimer />
    </div>
  );
};

export default PrivacyPolicy;
