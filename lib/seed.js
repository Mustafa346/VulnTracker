// lib/seed.js
// ─────────────────────────────────────────────────────────────────────────────
//  Database Seeder — ValnTracker Threat Encyclopedia
//  Populates the MongoDB 'attacks' collection with all 9 documented
//  cybersecurity attack entries.
//
//  HOW TO RUN:
//    npm run seed
//
//  WHAT IT DOES:
//    1. Connects to MongoDB using the MONGODB_URI from .env.local
//    2. Drops all existing attack entries (fresh seed every time)
//    3. Inserts all 9 attack documents
//    4. Disconnects cleanly
//
//  NOTE: This runs as a plain Node.js script (CommonJS), not as a
//  Next.js API route. That is why it uses require() instead of import.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/valntracker';

// ── Inline Attack Schema (avoids ES module import issues in Node.js) ──────────
const AttackSchema = new mongoose.Schema(
  {
    title:            String,
    category:         String,
    severity:         String,
    cvssScore:        Number,
    description:      String,
    howItWorks:       String,
    indicators:       [String],
    prevention:       [String],
    realWorldExample: String,
    affectedSystems:  [String],
    tags:             [String],
  },
  { timestamps: true }
);

const Attack =
  mongoose.models.Attack || mongoose.model('Attack', AttackSchema);

// ── Attack Data ───────────────────────────────────────────────────────────────
const attacks = [
  // ── 1. SQL Injection ──────────────────────────────────────────────────────
  {
    title:       'SQL Injection',
    category:    'Injection Attack',
    severity:    'Critical',
    cvssScore:   9.8,
    description:
      'SQL Injection allows attackers to interfere with database queries by inserting malicious SQL code into input fields, potentially exposing, modifying, or deleting all data in the database.',
    howItWorks:
      "Attackers insert malicious SQL code into input fields. When the application passes this unsanitized input to a database query, the database executes the attacker's code instead of the intended query, bypassing authentication or dumping sensitive data.",
    indicators: [
      "Unusual error messages containing SQL keywords like 'syntax error near'",
      'Unexpected data appearing in application responses',
      'Application behaving differently when special characters (quotes, dashes) are entered',
      'Slow database queries or sudden timeouts',
    ],
    prevention: [
      'Use parameterized queries and prepared statements — never concatenate user input into SQL',
      'Implement strict input validation and sanitization on all fields',
      'Apply the principle of least privilege to database accounts',
      'Use stored procedures to limit direct query execution',
      'Deploy a Web Application Firewall (WAF)',
      'Conduct regular security audits and penetration testing',
    ],
    realWorldExample:
      'In 2008, Heartland Payment Systems suffered a breach via SQL injection exposing 130 million credit card numbers — one of the largest data breaches in US history.',
    affectedSystems: ['Web Applications', 'Databases', 'REST APIs', 'CMS Platforms'],
    tags: ['injection', 'database', 'sql', 'web', 'owasp'],
  },

  // ── 2. Cross-Site Scripting (XSS) ────────────────────────────────────────
  {
    title:       'Cross-Site Scripting (XSS)',
    category:    'Injection Attack',
    severity:    'High',
    cvssScore:   8.2,
    description:
      'XSS attacks inject malicious client-side scripts into web pages viewed by other users, allowing attackers to steal session cookies, redirect users, or perform actions on behalf of the victim.',
    howItWorks:
      "Attackers inject JavaScript into web pages through comment fields, search bars, or URL parameters. When other users load the infected page, their browser executes the script — stealing cookies, logging keystrokes, or redirecting to attacker-controlled sites.",
    indicators: [
      'Unexpected pop-ups or alert boxes appearing on web pages',
      'Unexplained redirects to unknown or suspicious websites',
      'Session cookies being transmitted to unknown domains',
      'Visible script tags appearing in page content',
    ],
    prevention: [
      'Encode all user-supplied output before rendering it in HTML',
      'Implement a strict Content Security Policy (CSP) header',
      'Validate and sanitize all inputs on both client and server side',
      'Use modern frameworks (React, Angular) that auto-escape output by default',
      'Set HttpOnly and Secure flags on all session cookies',
    ],
    realWorldExample:
      'The 2018 British Airways breach used XSS to skim payment data from 500,000 customers in real-time, resulting in a £20 million GDPR fine.',
    affectedSystems: ['Web Browsers', 'Web Applications', 'Social Media Platforms', 'Forums'],
    tags: ['xss', 'javascript', 'injection', 'web', 'browser', 'owasp'],
  },

  // ── 3. Phishing Attack ────────────────────────────────────────────────────
  {
    title:       'Phishing Attack',
    category:    'Social Engineering',
    severity:    'High',
    cvssScore:   7.5,
    description:
      "Phishing tricks targets into providing sensitive data such as passwords, credit card numbers, or banking credentials by impersonating legitimate institutions through email, SMS, or fake websites.",
    howItWorks:
      "Attackers craft convincing fake communications mimicking banks, tech companies, or employers. Victims click malicious links leading to fake login pages, download malware disguised as attachments, or are directly pressured into submitting credentials.",
    indicators: [
      'Unexpected emails demanding urgent action on your account',
      'Sender address slightly misspelled (e.g., support@paypa1.com vs paypal.com)',
      'Generic greetings like "Dear Customer" instead of your actual name',
      "Links whose hover URL does not match the displayed text",
      'Requests for passwords, OTPs, or card numbers over email',
    ],
    prevention: [
      'Enable multi-factor authentication (MFA) on all accounts',
      'Hover over links before clicking to verify the actual destination URL',
      'Navigate directly to websites rather than clicking email links',
      'Use email filtering and anti-phishing browser extensions',
      'Train all employees to recognise and report phishing attempts',
    ],
    realWorldExample:
      'The 2016 DNC hack began with a single spear-phishing email that stole credentials, leading to one of the most politically significant data breaches in history.',
    affectedSystems: ['Email Clients', 'Mobile Devices', 'Corporate Networks', 'Banking Portals'],
    tags: ['phishing', 'social engineering', 'email', 'credentials', 'spear-phishing'],
  },

  // ── 4. Ransomware ─────────────────────────────────────────────────────────
  {
    title:       'Ransomware',
    category:    'Malware',
    severity:    'Critical',
    cvssScore:   9.5,
    description:
      "Ransomware encrypts a victim's files or entire systems, then demands cryptocurrency payment for the decryption key. Modern strains also threaten to publicly leak stolen data if ransom is not paid.",
    howItWorks:
      "Typically spread via phishing emails or exposed RDP ports, ransomware executes silently and encrypts all reachable files using military-grade encryption. The victim is then presented with a ransom note with a payment deadline.",
    indicators: [
      'Files suddenly have unknown extensions appended (.locked, .encrypted, .crypt)',
      'Unable to open previously working documents or images',
      'Ransom note appearing on the desktop or inside folders',
      'Unusual CPU and disk activity from unknown background processes',
      'Antivirus or Task Manager being disabled without user action',
    ],
    prevention: [
      'Maintain regular offline backups following the 3-2-1 rule (3 copies, 2 media types, 1 offsite)',
      'Keep all operating systems and software fully patched',
      'Disable RDP if unused, or place it behind a VPN with MFA',
      'Deploy Endpoint Detection and Response (EDR) solutions',
      'Restrict user permissions to the minimum required (least privilege)',
    ],
    realWorldExample:
      'WannaCry (2017) infected 230,000 computers across 150 countries in one day, crippling the UK NHS and causing an estimated $4 billion in global damages.',
    affectedSystems: ['Windows Workstations', 'Linux Servers', 'Network Shared Drives', 'Backup Systems'],
    tags: ['ransomware', 'malware', 'encryption', 'extortion', 'wannacry'],
  },

  // ── 5. Man-in-the-Middle (MITM) ───────────────────────────────────────────
  {
    title:       'Man-in-the-Middle (MITM)',
    category:    'Network Attack',
    severity:    'High',
    cvssScore:   8.1,
    description:
      "A MITM attack secretly intercepts and potentially alters communications between two parties who each believe they are communicating directly and privately with the other.",
    howItWorks:
      "Attackers position themselves between victim and server using ARP spoofing, DNS hijacking, or rogue Wi-Fi hotspots. All traffic flows through the attacker who can read plaintext data, inject malicious content, or replay credentials.",
    indicators: [
      'Unexpected SSL/TLS certificate warnings appearing in the browser',
      'Unexplained slow network performance on trusted connections',
      'Being logged out of accounts repeatedly without explanation',
      'Receiving different content than expected from a familiar website',
    ],
    prevention: [
      'Always verify HTTPS (padlock icon) before entering credentials',
      'Avoid public Wi-Fi; use a reputable VPN when on untrusted networks',
      'Implement certificate pinning in mobile and desktop applications',
      'Enable HSTS (HTTP Strict Transport Security) on all web servers',
      'Monitor network traffic for unexpected ARP table changes',
    ],
    realWorldExample:
      'In 2015, Lenovo shipped laptops with Superfish adware pre-installed that intercepted all HTTPS connections, performing MITM attacks on millions of users without their knowledge.',
    affectedSystems: ['Public Wi-Fi Networks', 'Web Browsers', 'Mobile Applications', 'Corporate LANs'],
    tags: ['mitm', 'network', 'arp spoofing', 'ssl stripping', 'interception'],
  },

  // ── 6. DDoS Attack ────────────────────────────────────────────────────────
  {
    title:       'DDoS Attack',
    category:    'Network Attack',
    severity:    'High',
    cvssScore:   7.8,
    description:
      "A Distributed Denial-of-Service attack floods a target with massive traffic volumes from thousands of sources simultaneously, overwhelming servers and making services completely unavailable to legitimate users.",
    howItWorks:
      "Attackers control a botnet of compromised devices (computers, IoT gadgets) and direct them to simultaneously bombard the target. The server exhausts its processing capacity handling the flood of fake requests, causing slowdowns or total outages.",
    indicators: [
      'Dramatic spike in inbound traffic with no corresponding business reason',
      'Website or API becoming unreachable for all users simultaneously',
      'Traffic arriving from thousands of geographically diverse IP addresses',
      'Requests following identical suspicious patterns at high frequency',
    ],
    prevention: [
      'Use a CDN with built-in DDoS protection (Cloudflare, Akamai, AWS Shield)',
      'Configure rate limiting and connection throttling on all endpoints',
      'Deploy a Web Application Firewall (WAF) with traffic analysis',
      'Use anycast network routing to distribute and absorb attack traffic',
      'Maintain a tested incident response plan for DDoS scenarios',
    ],
    realWorldExample:
      'The 2016 Dyn DNS attack used the Mirai botnet (enslaved IoT devices) to generate 1.2 Tbps of traffic, taking down Twitter, Netflix, Reddit, and GitHub for hours.',
    affectedSystems: ['Web Servers', 'DNS Infrastructure', 'REST APIs', 'Gaming Platforms', 'Financial Services'],
    tags: ['ddos', 'dos', 'network', 'botnet', 'availability', 'flood'],
  },

  // ── 7. Zero-Day Exploit ───────────────────────────────────────────────────
  {
    title:       'Zero-Day Exploit',
    category:    'Exploit',
    severity:    'Critical',
    cvssScore:   9.3,
    description:
      "A zero-day exploit targets an unknown software vulnerability that the vendor has not yet discovered or patched. Defenders have zero days to prepare, making these the most dangerous type of attack.",
    howItWorks:
      "Researchers or criminal actors discover software flaws unknown to the vendor. Before a patch exists, attackers weaponise the vulnerability — executing arbitrary code, gaining privileged access, or crashing systems — with no available defence.",
    indicators: [
      'Unexplained system crashes or sudden changes in application behaviour',
      'Antivirus reporting anomalous activity with no known signature match',
      'Unexpected outbound network connections from trusted system processes',
      'Privilege escalation events without corresponding authorised user actions',
    ],
    prevention: [
      'Apply all vendor patches immediately upon release',
      'Use behaviour-based threat detection rather than signature-only antivirus',
      'Deploy application sandboxing and process isolation',
      "Enable OS exploit mitigation features (ASLR, DEP/NX)",
      "Implement network segmentation to limit an exploit's blast radius",
      'Follow threat intelligence feeds to stay aware of active exploitation',
    ],
    realWorldExample:
      'Stuxnet (2010) simultaneously used four separate zero-day exploits to sabotage Iranian nuclear centrifuges — widely considered the most sophisticated cyberweapon ever publicly discovered.',
    affectedSystems: ['All Software', 'Operating Systems', 'Web Browsers', 'Industrial Control Systems (ICS/SCADA)'],
    tags: ['zero-day', '0day', 'exploit', 'vulnerability', 'patch management'],
  },

  // ── 8. Credential Stuffing ────────────────────────────────────────────────
  {
    title:       'Credential Stuffing',
    category:    'Authentication Attack',
    severity:    'High',
    cvssScore:   7.3,
    description:
      "Credential stuffing uses large collections of username/password pairs stolen from previous data breaches to automatically attempt login on many different websites, exploiting widespread password reuse.",
    howItWorks:
      "Attackers purchase breach databases containing billions of real credentials. Automated tools systematically test these pairs against target platforms at high speed. Any successful login gives full account access without cracking a single password.",
    indicators: [
      'Login notifications you did not initiate arriving from unfamiliar locations',
      'Account settings or contact details changed without your knowledge',
      'Unfamiliar purchase history or activity visible in your account',
      'Being locked out due to excessive failed login attempts you did not make',
    ],
    prevention: [
      'Use a unique, randomly generated password for every single account',
      'Enable multi-factor authentication on every account that supports it',
      'Use a reputable password manager to generate and store credentials',
      'Check haveibeenpwned.com regularly to see if your email appeared in breaches',
      'Implement CAPTCHA and IP-based rate limiting on all login forms',
    ],
    realWorldExample:
      'In 2020, attackers used 160,000 stolen credentials in a stuffing attack against Nintendo accounts, exposing payment information and personal data of tens of thousands of users.',
    affectedSystems: ['Online Retail', 'Banking Portals', 'Gaming Services', 'Streaming Platforms', 'Corporate SSO'],
    tags: ['credential stuffing', 'authentication', 'password reuse', 'account takeover', 'breach'],
  },

  // ── 9. Social Engineering ─────────────────────────────────────────────────
  {
    title:       'Social Engineering',
    category:    'Social Engineering',
    severity:    'Medium',
    cvssScore:   6.9,
    description:
      "Social engineering is the psychological manipulation of people into performing actions or revealing confidential information. It exploits human trust, authority bias, and urgency rather than technical vulnerabilities.",
    howItWorks:
      "Attackers research targets to craft believable pretexts, then impersonate authority figures (IT support, executives, banks). They create urgency or fear that pressures victims into sharing credentials, wiring money, or granting system access before the victim has time to verify.",
    indicators: [
      'Unsolicited contact requesting sensitive information or urgent action',
      'Caller or messenger claiming authority but unable to verify their identity',
      'Pressure to act immediately, bypassing normal approval procedures',
      'Requests that conveniently skip standard security verification steps',
      'Unexpected offers or warnings that create strong emotional reactions',
    ],
    prevention: [
      'Establish mandatory identity verification procedures for all sensitive requests',
      'Run regular social engineering awareness training for all staff',
      'Create a safe culture where questioning unusual requests is encouraged',
      'Implement callback verification — hang up and call the official number',
      'Never share passwords or grant access even to apparent IT support staff',
    ],
    realWorldExample:
      "In 2020, Twitter's admin tools were compromised via a phone social engineering attack on employees, allowing attackers to hijack accounts of Obama, Elon Musk, and Apple to run a Bitcoin scam.",
    affectedSystems: ['All Organisations', 'Help Desks', 'Finance Departments', 'Executive Offices', 'HR Systems'],
    tags: ['social engineering', 'manipulation', 'pretexting', 'vishing', 'human hacking'],
  },
];

// ── Seed Function ─────────────────────────────────────────────────────────────
async function seed() {
  try {
    console.log('🌱 Starting ValnTracker database seed...\n');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Drop existing entries for a clean seed
    await Attack.deleteMany({});
    console.log('🗑️  Cleared existing attack entries\n');

    // Insert all 9 attacks
    const inserted = await Attack.insertMany(attacks);
    console.log(`✅ Successfully seeded ${inserted.length} attack entries:\n`);

    // Print a summary of what was seeded
    inserted.forEach((attack, i) => {
      console.log(
        `   ${i + 1}. ${attack.title.padEnd(35)} [${attack.severity}]  CVSS: ${attack.cvssScore}`
      );
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('🎉 Seeding complete! Run "npm run dev" to start the app.\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seeding failed:', err.message);
    console.error('   Check your MONGODB_URI in .env.local\n');
    process.exit(1);
  }
}

seed();
