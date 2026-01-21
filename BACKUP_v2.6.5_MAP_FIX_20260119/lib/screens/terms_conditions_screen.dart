import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme.dart';

class TermsConditionsScreen extends StatelessWidget {
  const TermsConditionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Terms & Conditions',
          style: GoogleFonts.inter(
            color: Colors.black,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'PAYPARQ.AI TERMS & CONDITIONS',
              style: GoogleFonts.inter(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Last updated: January 18, 2026',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 32),
            _buildSection(
              '1. Subject and Scope of Service',
              'These Terms of Use ("Terms") govern the relationship between the digital service provider ("Provider") and the end-user ("User") regarding the use of the platform for private parking management, digital protection, identification of unauthorized parking, and administrative processing of irregular parking reports. By using the service, the User confirms they have read, understood, and accepted these Terms.',
            ),
            _buildSection(
              '2. Service Content and Functionality',
              'The Provider enables the User to:\n'
                  '• Register and digitally verify private parking spaces\n'
                  '• Generate and receive official identification tags (stickers) for physical marking\n'
                  '• Access a user account to submit reports of unauthorized parking by third parties\n'
                  '• Upload photographs and event data\n'
                  '• Track the status of administrative processing\n'
                  '• Communicate via digital channels with the Provider\n'
                  '• Utilize technical and administrative report processing\n'
                  '• Initiate informal debt collection processes against third parties on behalf of the User, where applicable\n\n'
                  'The Provider does not assume the obligation of legal representation, judicial proceedings, nor does it provide public authority.',
            ),
            _buildSection(
              '3. Subscription and Payment',
              'The service is activated upon purchase of a monthly subscription. Subscriptions are:\n'
                  '• Charged in advance\n'
                  '• Automatically renewed\n'
                  '• Cancellable at any time via the user interface\n\n'
                  'Cancellation takes effect at the start of the next billing cycle. Funds paid for the current period are non-refundable.',
            ),
            _buildSection(
              '4. User Responsibilities and Obligations',
              'The User agrees to:\n'
                  '• Provide truthful, complete, and updated information\n'
                  '• Use the service exclusively for managing their own parking spaces\n'
                  '• Ensure photographs and information are accurate, clear, and time-relevant\n'
                  '• Refrain from submitting reports not relating to actual irregular parking\n'
                  '• Correctly place the official tag in a visible location\n'
                  '• Not transfer the account or tag to third parties without approval\n\n'
                  'The User bears sole responsibility for all actions taken via their account.',
            ),
            _buildSection(
              '5. Administrative Processing of Reports',
              'The Provider verifies each submission to determine:\n'
                  '• If evidence is complete and legible\n'
                  '• If the event meets the criteria for action\n'
                  '• If debt collection against a third party can be initiated\n\n'
                  'The Provider may reject a report if it:\n'
                  '• Violates rules\n'
                  '• Lacks clear evidence\n'
                  '• Involves abuse or irregularities\n'
                  '• Lacks grounds for a procedure\n\n'
                  'The Provider does not guarantee the outcome, the amount of potential recovery, or processing time.',
            ),
            _buildSection(
              '6. Limitations of Service and Liability',
              'The Provider is not responsible for:\n'
                  '• Actions and conduct of third parties\n'
                  '• The success of debt collection\n'
                  '• Damage resulting from improper use of the service\n'
                  '• Errors caused by incorrect User data\n'
                  '• Decisions by authorities that no grounds for action exist\n\n'
                  'The service is provided "as is" and "as available," without guarantees of continuous availability or error-free operation.',
            ),
            _buildSection(
              '7. Prohibition of Unauthorized Use',
              'Users are strictly prohibited from:\n'
                  '• Submitting fictitious or intentionally inaccurate reports\n'
                  '• Manipulating photographs or data\n'
                  '• Misusing tags or using them on third-party parking spaces\n'
                  '• Interfering with platform operation\n'
                  '• Attempting unauthorized access\n\n'
                  'In case of abuse, the Provider may suspend or deactivate the account immediately without a refund.',
            ),
            _buildSection(
              '8. Processing of Personal Data',
              'The Provider processes personal data exclusively for:\n'
                  '• Service provision and report processing\n'
                  '• Communication with involved parties\n'
                  '• Technical and security optimization\n\n'
                  'All data is stored in accordance with GDPR and national regulations. Users have rights to access, rectification, restriction, portability, and erasure.',
            ),
            _buildSection(
              '9. Amendments to Terms',
              'The Provider reserves the right to modify these Terms at any time. Users will be notified of significant changes via email or the application. Continued use constitutes acceptance of the new Terms.',
            ),
            _buildSection(
              '10. Termination of Service',
              'A User may request account deactivation at any time. The Provider may terminate the relationship in case of:\n'
                  '• Terms violations\n'
                  '• System abuse\n'
                  '• Non-payment\n'
                  '• Illegal activity',
            ),
            _buildSection(
              '11. Applicable Law and Jurisdiction',
              'The laws of the Republic of Croatia apply. Disputes shall be resolved amicably; otherwise, the court at the Provider\'s seat shall have jurisdiction.',
            ),
            _buildSection(
              '12. Entry into Force',
              'These Terms enter into force on the day of publication and remain valid until amended or revoked.',
            ),
            _buildSection(
              '13. Limitation of Liability: Failure to Contact Vehicle Owner',
              'The User acknowledges that the Provider does not guarantee the identification or contacting of the vehicle owner. The Provider is not liable for:\n'
                  '• Failure to establish contact\n'
                  '• Loss, damage, or missed collection due to non-contact\n'
                  '• Decisions or actions of third parties\n'
                  '• Financial or material damage regarding unidentified vehicles',
            ),
            _buildSection(
              '14. General Limitation of Liability and Inclusion of Partners',
              'The User releases the Provider and its partners from liability for damages arising from service use, including technical failures or unsuccessful collections. Partners act as separate processors, and the Provider is not liable for their specific actions or errors.\n\n'
                  'The User expressly releases the Provider and its partners from liability in an absolute sense, regardless of the circumstances or events connected with the use of the service.',
            ),
            _buildSection(
              '15. Free Tier Model and Daily Parking Tickets',
              'Users may opt for the "Free Tier" without a monthly fee under these rules:\n'
                  '• Revenue Share: Revenue from successfully collected Daily Parking Tickets is split on predefined terms after transaction and administrative costs\n'
                  '• Warning vs. Ticket: The User decides whether to issue a free Warning or a Daily Parking Ticket (initiating administrative collection, e.g., 20 EUR)\n'
                  '• Burden of Proof: User must provide high-quality evidence (min. 2 photos, 5 mins apart)\n'
                  '• Payout: User\'s share is paid to their IBAN only after successful and final collection from the third party',
            ),
            _buildSection(
              '16. Absolute Indemnity Clause',
              'The User (parking owner/manager) expressly accepts and agrees to the following:\n'
                  '• Total independence: The Provider offers only a technological platform. Each individual decision is the sole and discretionary decision of the User\n'
                  '• Release of liability: The User irrevocably waives any claims for any direct, indirect, incidental, or consequential damage\n'
                  '• Legal protection of the Provider: If a third party initiates any procedure, the User agrees to fully indemnify the Provider for all costs\n'
                  '• Force Majeure: The Provider is not liable for system failures caused by factors beyond its control',
            ),
            _buildSection(
              '17. ISO/IEC 27001 & GDPR Strict Compliance Provision',
              'This platform is engineered to adhere to the strictest global standards for Information Security Management (ISO/IEC 27001) and the General Data Protection Regulation (GDPR).\n'
                  '• Data Minimization: Personal data is processed strictly for execution of the parking contract\n'
                  '• Encryption & Integrity: All data is encrypted at rest and in transit\n'
                  '• Zero-Knowledge Principle: The Provider implements strict access controls; staff access is logged and restricted\n'
                  '• Data Subject Rights: The Provider facilitates the "Right to be Forgotten"\n'
                  '• Third-Party Processing: All subprocessors (Stripe, Meta, Firebase) are vetted for equivalent high-level security certifications',
            ),
            const SizedBox(height: 32),
            _buildSection(
              'COMPANY INFORMATION',
              'Parent company: Leadvex Group LLC\n'
                  'Headquarters: 1309 Coffeen Avenue STE 1200 Sheridan Wyoming 82801\n'
                  'Tax Number: EIN 98-1844326\n'
                  'Contact: payparq@outlook.com\n'
                  'Phone: +385 915963139\n\n'
                  'Croatian Partner: Indirektno, Vl. Karlo Žamić, Obala Kneza Domagoja 52, 21322 Brela, OIB: 83928715622',
            ),
            const SizedBox(height: 48),
            Center(
              child: Text(
                '© 2026 PayParq.AI • Professional Enforcement Systems',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: Colors.grey[400],
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: GoogleFonts.inter(
              fontSize: 14,
              height: 1.6,
              color: Colors.grey[800],
            ),
          ),
        ],
      ),
    );
  }
}
