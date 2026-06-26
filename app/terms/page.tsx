import type { Metadata } from "next";
import LegalPageShell, {
  LegalSection,
  LegalParagraph,
  LegalList,
} from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms & Conditions — The Whites Bangladesh",
  description:
    "The terms that govern your use of The Whites Stories (TWS) website and purchases.",
};

export default function TermsConditionsPage() {
  return (
    <LegalPageShell
      title="Terms & Conditions"
      lastUpdated="June 2026"
      intro="By using The Whites Stories website, you agree to the following terms."
    >
      <LegalSection title="Orders">
        <LegalParagraph>
          All orders are subject to product availability. We reserve the right to
          cancel any order due to pricing errors, stock issues, or suspected
          fraud. Orders are confirmed only after successful payment or order
          verification.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Pricing">
        <LegalParagraph>
          All prices are listed in Bangladeshi Taka (BDT). Prices may change
          without prior notice. Promotional prices are valid only during the
          stated campaign.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Product Information">
        <LegalParagraph>
          We strive to display products as accurately as possible. Please note:
        </LegalParagraph>
        <LegalList
          items={[
            "Slight color differences may occur due to screen settings",
            "Measurements may vary slightly",
            "Player names, numbers, and patches are customized according to your selected options",
          ]}
        />
      </LegalSection>

      <LegalSection title="Shipping">
        <LegalParagraph>
          Delivery times depend on location and courier service. Delays caused by
          courier companies, weather, strikes, or unforeseen events are beyond
          our control.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Returns & Exchanges">
        <LegalParagraph>
          Returns or exchanges are accepted only if:
        </LegalParagraph>
        <LegalList
          items={[
            "Wrong product delivered",
            "Wrong size shipped (different from ordered)",
            "Manufacturing defect",
            "Damaged during shipping (must be reported promptly with evidence)",
          ]}
        />
        <LegalParagraph>Returns are not accepted for:</LegalParagraph>
        <LegalList
          items={[
            "Change of mind",
            "Incorrect size selected by the customer",
            "Customized jerseys (name, number, patches)",
            "Minor color variation due to display differences",
          ]}
        />
      </LegalSection>

      <LegalSection title="Refunds">
        <LegalParagraph>
          Approved refunds will be processed using the original payment method
          whenever possible. Shipping charges are generally non-refundable unless
          the mistake was made by TWS.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Intellectual Property">
        <LegalParagraph>
          All logos, graphics, website content, product photos, and branding of
          The Whites Stories are the property of TWS unless otherwise stated.
          Unauthorized copying or commercial use is prohibited.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="User Conduct">
        <LegalParagraph>Users agree not to:</LegalParagraph>
        <LegalList
          items={[
            "Provide false information",
            "Attempt fraudulent transactions",
            "Interfere with website functionality",
            "Upload malicious content",
          ]}
        />
      </LegalSection>

      <LegalSection title="Limitation of Liability">
        <LegalParagraph>
          TWS shall not be liable for indirect or consequential losses arising
          from the use of this website or purchased products, except where
          required by applicable law.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Changes to Terms">
        <LegalParagraph>
          We reserve the right to modify these Terms & Conditions at any time.
          Updated versions will be published on this page.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Contact">
        <LegalParagraph>
          For questions regarding these Terms & Conditions, please contact us
          through our official communication channels.
        </LegalParagraph>
      </LegalSection>
    </LegalPageShell>
  );
}
