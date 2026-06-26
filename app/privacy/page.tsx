import type { Metadata } from "next";
import LegalPageShell, {
  LegalSection,
  LegalParagraph,
  LegalList,
} from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy — The Whites Bangladesh",
  description:
    "How The Whites Stories (TWS) collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      lastUpdated="June 2026"
      intro="At The Whites Stories (TWS), we respect your privacy and are committed to protecting your personal information."
    >
      <LegalSection title="Information We Collect">
        <LegalParagraph>
          When you place an order or contact us, we may collect:
        </LegalParagraph>
        <LegalList
          items={[
            "Full Name",
            "Phone Number",
            "Email Address (if provided)",
            "Shipping Address",
            "Order Details",
            "Payment Information (such as transaction ID for verification)",
          ]}
        />
      </LegalSection>

      <LegalSection title="How We Use Your Information">
        <LegalParagraph>Your information is used to:</LegalParagraph>
        <LegalList
          items={[
            "Process and deliver your order",
            "Contact you regarding your purchase",
            "Verify payments",
            "Provide customer support",
            "Improve our products and services",
          ]}
        />
      </LegalSection>

      <LegalSection title="Data Protection">
        <LegalParagraph>
          We do not sell, rent, or share your personal information with third
          parties except when necessary for:
        </LegalParagraph>
        <LegalList
          items={[
            "Courier delivery",
            "Payment verification",
            "Legal obligations",
          ]}
        />
      </LegalSection>

      <LegalSection title="Payment">
        <LegalParagraph>
          TWS does not store sensitive payment information such as card numbers.
          Payments are processed through trusted payment providers or
          bank/mobile financial services.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Cookies">
        <LegalParagraph>Our website may use cookies to:</LegalParagraph>
        <LegalList
          items={[
            "Improve browsing experience",
            "Remember cart items",
            "Analyze website traffic",
          ]}
        />
        <LegalParagraph>
          You can disable cookies through your browser settings.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Third-Party Services">
        <LegalParagraph>Our website may use services such as:</LegalParagraph>
        <LegalList
          items={[
            "Google Analytics",
            "Meta Pixel",
            "Payment gateways",
            "Courier partners",
          ]}
        />
        <LegalParagraph>Each service has its own privacy policy.</LegalParagraph>
      </LegalSection>

      <LegalSection title="Your Rights">
        <LegalParagraph>You may request to:</LegalParagraph>
        <LegalList
          items={[
            "View your stored information",
            "Correct inaccurate information",
            "Request deletion of your personal data (unless required for legal or accounting purposes)",
          ]}
        />
      </LegalSection>

      <LegalSection title="Contact">
        <LegalParagraph>
          For any privacy-related questions, contact us via our official Facebook
          page, WhatsApp, or email.
        </LegalParagraph>
      </LegalSection>
    </LegalPageShell>
  );
}
