// ═══════════════════════════════════════════════════════════════
// CSA CYBER ESSENTIALS — Full Question Bank
// Source: Cyber Essentials in Action (AI Edition), CSA Singapore
// ═══════════════════════════════════════════════════════════════

const QUESTION_BANK = {

  // ── PILLAR 1: ASSETS ─────────────────────────────────────────
  assets: {
    name: 'Assets',
    icon: '🗂️',
    color: '#3a7fff',
    description: 'People, Hardware & Software, Data',
    questions: [
      {
        id:'A1', pillar:'🗂️ Assets — People',
        q:'What are the most common social engineering tactics used by threat actors to trick employees?',
        opts:['Creating urgent scenarios and impersonating trusted parties','Sending large file attachments via email','Calling the IT helpdesk directly','Exploiting software vulnerabilities remotely'],
        ans:0, tip:'Threat actors create urgency (e.g. urgent deadline, limited offer) and impersonate trusted parties (e.g. bank, IT team) to trick you into acting without thinking.',
        difficulty:1, scenario:'ATTACK 01'
      },
      {
        id:'A2', pillar:'🗂️ Assets — People',
        q:'Your CFO sends an urgent meeting invite while overseas and asks you to transfer funds to a new supplier. What should you do FIRST?',
        opts:['Transfer the funds — the CFO would only ask if it was real','Contact the CFO separately via a known, trusted channel to verify','Reply in the same meeting to confirm','Ask a colleague for their opinion before deciding'],
        ans:1, tip:'Contact the CFO outside of the online meeting via a known number or in-person. Deepfake impersonation can replicate faces and voices convincingly.',
        difficulty:2, scenario:'ATTACK 03'
      },
      {
        id:'A3', pillar:'🗂️ Assets — People',
        q:'Which of the following is a real-world example of how deepfakes are used in corporate environments?',
        opts:['Impersonating senior executives in video calls to authorise fraudulent payments','Automatically patching vulnerable software','Encrypting backup data for safe storage','Blocking malicious emails at the email gateway'],
        ans:0, tip:'In 2024, a finance employee paid out US$25.6 million after a video call with a deepfake CFO and colleagues. Verify high-value instructions through a separate, trusted channel.',
        difficulty:2, scenario:'ATTACK 02'
      },
      {
        id:'A4', pillar:'🗂️ Assets — Hardware & Software',
        q:'Your vendor wants to connect their laptop to your corporate network for a demo. Why is this risky?',
        opts:['It uses up too much network bandwidth','The device may contain malware that could spread across your network','It may slow down the demo performance','It requires extra IT configuration'],
        ans:1, tip:'External devices may carry malware (viruses, trojans, ransomware) that can infect other devices on your network. Always check with IT before allowing external devices to connect.',
        difficulty:1, scenario:'ATTACK 04'
      },
      {
        id:'A5', pillar:'🗂️ Assets — Hardware & Software',
        q:'Why should employees install only authorised software from trusted sources on their corporate devices?',
        opts:['Authorised software runs faster','Unauthorised software may contain malicious code that enables attacks','Only authorised software has a user interface','Unauthorised software is always more expensive'],
        ans:1, tip:'Google reports apps from outside the Play Store are 50x more likely to contain malware. Only install software approved by your IT team from trusted sources.',
        difficulty:1, scenario:'ATTACK 05'
      },
      {
        id:'A6', pillar:'🗂️ Assets — Hardware & Software',
        q:'Why should your IT division be informed when staff sign up for new SaaS cloud software or third-party AI services?',
        opts:['To ensure the software is cheaper','IT can only protect assets they know about — unapproved tools create "shadow IT"','To get approval for longer software trials','So IT can use the software too'],
        ans:1, tip:'Shadow IT/Shadow AI bypasses security controls. IBM\'s 2025 report found 20% of organisations suffered breaches due to shadow AI incidents, compromising personal data and IP.',
        difficulty:2, scenario:'ATTACK 06'
      },
      {
        id:'A7', pillar:'🗂️ Assets — Data',
        q:'What are common methods to protect sensitive corporate data from leakage?',
        opts:['Share data only via email','Password-protect/encrypt files at rest and in transit, and disable USB ports','Store all data on local drives without encryption','Allow all employees full access to all data'],
        ans:1, tip:'Encrypt files at rest and in transit, and disable USB ports. These measures protect data whether it\'s stored, being transferred, or someone tries to copy it.',
        difficulty:1, scenario:'ATTACK 07'
      },
      {
        id:'A8', pillar:'🗂️ Assets — Data',
        q:'What should your organisation consider when storing corporate data in the cloud?',
        opts:['Only the cost of cloud storage','The security of data transfer and data sovereignty/geolocation requirements','Whether the cloud provider has a good website design','The cloud provider\'s marketing materials'],
        ans:1, tip:'Consider: (1) Security of data in transit and at rest, (2) Geolocation — some customers impose data sovereignty requirements on where data can be stored.',
        difficulty:2, scenario:'ATTACK 08'
      },
    ]
  },

  // ── PILLAR 2: SECURE / PROTECT ────────────────────────────────
  secure: {
    name: 'Secure & Protect',
    icon: '🛡️',
    color: '#3aff9a',
    description: 'Malware Protection, Access Control, Secure Configuration',
    questions: [
      // Malware Protection
      {
        id:'S1', pillar:'🛡️ Malware Protection',
        q:'Employees work off cloud services with no corporate network. How should their laptops be protected from malicious internet traffic?',
        opts:['No protection needed — cloud services are always secure','Install virus/malware protection and a host-based firewall on each device','Only connect to trusted websites','Use a VPN to access public websites'],
        ans:1, tip:'Install virus and malware protection software AND a host-based firewall on each device. In Singapore, malicious bots account for nearly half of web traffic (Straits Times, 2025).',
        difficulty:1, scenario:'ATTACK 13'
      },
      {
        id:'S2', pillar:'🛡️ Malware Protection',
        q:'You need to work from a café and access your corporate network. What is the CORRECT approach?',
        opts:['Connect to the café\'s free WiFi — it\'s convenient','Avoid public WiFi and use your mobile hotspot or VPN to secure communications','Use public WiFi but don\'t check emails','Ask the café staff if their WiFi is safe'],
        ans:1, tip:'"Evil twin" attacks set up fake WiFi networks to steal credentials. Use your mobile hotspot or a VPN. An Australian man was charged for doing exactly this at airports.',
        difficulty:1, scenario:'ATTACK 14'
      },
      // Access Control
      {
        id:'S3', pillar:'🔑 Access Control',
        q:'Which of the following is an example of a STRONG passphrase?',
        opts:['Password123','IhadKAYAtoast@8am','Company2024','admin1234'],
        ans:1, tip:'A strong passphrase uses: a few random words forming a long phrase (12+ characters), upper/lower case, numbers, and special characters, and is unique per account.',
        difficulty:1, scenario:'ATTACK 15'
      },
      {
        id:'S4', pillar:'🔑 Access Control',
        q:'Multi-Factor Authentication (MFA) adds a second layer of protection. What does MFA typically add beyond your password?',
        opts:['A second password that must be different from the first','Something you HAVE (authenticator app/token) or something you ARE (fingerprint/face)','A security question about your childhood pet','A requirement to change your password every 30 days'],
        ans:1, tip:'MFA uses: something you KNOW (password) + something you HAVE (authenticator app, security token) or ARE (fingerprint, face ID). Using MFA makes you 99% less likely to be hacked (CISA).',
        difficulty:1, scenario:'ATTACK 16'
      },
      {
        id:'S5', pillar:'🔑 Access Control',
        q:'You manage multiple cloud accounts and struggle to remember all different passwords. What should you do?',
        opts:['Use the same password for all accounts — easier to remember','Use unique strong passphrases for each and manage them with a trusted password manager','Write all passwords in a notebook','Use simple passwords that are easy to type'],
        ans:1, tip:'Use unique strong passphrases for each account + a trusted password manager. Also explore Single Sign-On (SSO). Weak credentials are behind 47% of cloud attacks (CybersecurityDive, 2024).',
        difficulty:2, scenario:'ATTACK 17'
      },
      {
        id:'S6', pillar:'🔑 Access Control',
        q:'What should your organisation do to manage third-party vendor access to sensitive systems?',
        opts:['Give vendors full access to make their work easier','Require NDAs, limit vendor access to only what is needed, and remove access when work is complete','Share one admin account with all vendors','Allow vendors to set their own access permissions'],
        ans:1, tip:'Limit third-party access using least privilege — only what they need. 128,000 customer records were stolen when 12 moneylenders\' shared IT vendor was hacked (CNA, 2024).',
        difficulty:2, scenario:'ATTACK 18'
      },
      // Secure Configuration
      {
        id:'S7', pillar:'⚙️ Secure Configuration',
        q:'Why should you disable or remove features, services, or applications that are not in use on your device?',
        opts:['It improves device performance only','It reduces the risk of attacks exploiting known vulnerabilities in those services','It saves storage space','It makes the device easier to use'],
        ans:1, tip:'Every unused service is a potential attack vector. Remote Desktop Protocol (RDP) has been widely exploited to deploy ransomware — disable what you don\'t need.',
        difficulty:1, scenario:'ATTACK 19'
      },
      {
        id:'S8', pillar:'⚙️ Secure Configuration',
        q:'Why should cloud users review and change the default configuration settings for their cloud services?',
        opts:['Default settings are always the most secure option','Default settings are configured for usability, not security — they may leave systems exposed','Only advanced users need to change cloud settings','Cloud providers are responsible for all security settings'],
        ans:1, tip:'Cloud misconfiguration is a top threat identified by Cloud Security Alliance. Default settings prioritise usability — always review and harden them before going live.',
        difficulty:2, scenario:'ATTACK 20'
      },
      {
        id:'S9', pillar:'⚙️ Secure Configuration',
        q:'A new employee signs up for a cloud-based AI chatbot for customer service. What is the FIRST security step?',
        opts:['Launch it immediately to test with real customers','Review the AI provider\'s cybersecurity posture and configure security settings before deployment','Only use the chatbot during business hours','Let customers decide if they trust the AI'],
        ans:1, tip:'Review the provider\'s security track record, guardrails against prompt injection, and implement LLM firewalls. AI tools have the same security risks as any internet-facing service.',
        difficulty:2, scenario:'ATTACK 11'
      },
      // AI Security
      {
        id:'S10', pillar:'🤖 AI Security',
        q:'Before using a third-party AI transcription tool for a meeting with sensitive corporate data, what should you check?',
        opts:['Whether the AI tool has good reviews on the app store','Your organisation\'s data use policies and whether this AI tool is approved for corporate use','Whether the tool is free or paid','If colleagues have used it before'],
        ans:1, tip:'Check your org\'s data governance policies first. Samsung employees leaked trade secrets via ChatGPT — including source code and meeting recordings — before policies were in place.',
        difficulty:2, scenario:'ATTACK 09'
      },
      {
        id:'S11', pillar:'🤖 AI Security',
        q:'Why should employees monitor and report unusual output from generative AI tools used at work?',
        opts:['To report bugs to the AI vendor for marketing purposes','AI tools may hallucinate or produce manipulated output from cyber attacks — reporting helps protect others','Employees should not use AI tools at work','AI output is always accurate and needs no monitoring'],
        ans:1, tip:'Generative AI can hallucinate or be manipulated by prompt injection. Microsoft\'s AI recommended Ottawa Food Bank as a tourist attraction. Report anomalies to IT.',
        difficulty:2, scenario:'ATTACK 10'
      },
      {
        id:'S12', pillar:'🤖 AI Security',
        q:'An employee submits a client contract into an unapproved third-party AI tool. What is the risk?',
        opts:['The AI tool might give inaccurate summaries','The AI provider\'s terms may allow use of submitted data for training, exposing confidential information','The tool might be slow','The contract format may not be supported'],
        ans:1, tip:'Unapproved AI tools may use your data for training under foreign data privacy laws. TechCrunch (2025) reported ChatGPT public queries are being indexed by search engines.',
        difficulty:2, scenario:'Shadow AI'
      },
    ]
  },

  // ── PILLAR 3: UPDATE ──────────────────────────────────────────
  update: {
    name: 'Update',
    icon: '🔄',
    color: '#ffcc00',
    description: 'Keep software and systems updated promptly',
    questions: [
      {
        id:'U1', pillar:'🔄 Software Updates',
        q:'A software update reminder pops up while you\'re meeting a deadline. From a security perspective, why is it important to update promptly?',
        opts:['To get new UI features and interface improvements','New vulnerabilities may be discovered and exploited — security patches close these gaps','Updates are required only when a new device is purchased','Software updates are optional and can be done anytime'],
        ans:1, tip:'AI-driven automation now enables attackers to scan and exploit vulnerabilities with minimal human oversight. Cyber attackers are getting quicker at exploiting newly found vulnerabilities.',
        difficulty:1, scenario:'ATTACK 21'
      },
      {
        id:'U2', pillar:'🔄 Software Updates',
        q:'What is the recommended timeframe for applying critical security patches according to CSA Cyber Essentials?',
        opts:['Within 1 year','Within 14 days of patch release','Only during scheduled annual maintenance','Whenever is convenient for the IT team'],
        ans:1, tip:'CSA Cyber Essentials recommends applying critical security patches within 14 days of release. Every day unpatched is a window of opportunity for attackers.',
        difficulty:1, scenario:'ATTACK 21'
      },
      {
        id:'U3', pillar:'🔄 Software Updates',
        q:'Why is end-of-life software especially dangerous for organisations?',
        opts:['It runs too slowly for modern workloads','It no longer receives security patches, leaving vulnerabilities permanently unaddressed','It is too expensive to maintain','End-of-life software cannot connect to the internet'],
        ans:1, tip:'End-of-life software gets no security fixes. Every vulnerability discovered after support ends remains permanently exploitable — attackers actively target known EOL systems.',
        difficulty:2, scenario:'ATTACK 21'
      },
      {
        id:'U4', pillar:'🔄 Software Updates',
        q:'Ransomware attackers exploited unpatched software to enter a company\'s systems. Which Cyber Essentials control would have BEST prevented this?',
        opts:['Backing up data regularly','Applying software security patches promptly — critical patches within 14 days','Installing more antivirus tools after the attack','Training employees not to click any links'],
        ans:1, tip:'The wholesale company in the scenario had software updates turned on but employees delayed installation due to deadlines. Prompt patching closes the exploitation window.',
        difficulty:2, scenario:'Ransomware Scenario'
      },
    ]
  },

  // ── PILLAR 4: BACKUP ──────────────────────────────────────────
  backup: {
    name: 'Backup',
    icon: '💾',
    color: '#ff7a3c',
    description: 'Backup essential data and store separately',
    questions: [
      {
        id:'B1', pillar:'💾 Backup',
        q:'Why should backups be stored away from or separately from your operating environment?',
        opts:['It\'s not necessary — cloud storage is always safe','If the operating environment is compromised, a separate backup prevents it from being affected too','Backups are only needed for very large organisations','Separate storage makes backups slower to restore'],
        ans:1, tip:'A Canadian medical clinic had its backups deleted in a ransomware attack and had to close temporarily. It now keeps at least one offline copy. Store backups separately!',
        difficulty:1, scenario:'ATTACK 22'
      },
      {
        id:'B2', pillar:'💾 Backup',
        q:'Your organisation uses a SaaS-based CRM to manage customer data. Who is responsible for backing up this data?',
        opts:['The cloud/SaaS provider — they manage the infrastructure','Your organisation — under the cloud Shared Responsibility Model, data backup is your responsibility','No one needs to back up cloud data','The CRM software automatically creates secure backups'],
        ans:1, tip:'Under the cloud Shared Responsibility Model (SRM), backing up data stored in cloud applications is YOUR organisation\'s responsibility, not the cloud provider\'s.',
        difficulty:2, scenario:'ATTACK 23'
      },
      {
        id:'B3', pillar:'💾 Backup',
        q:'What should organisations do to ensure their backups are actually usable in a real incident?',
        opts:['Create backups and never touch them again','Regularly test restoration of data from backups to confirm they work','Trust that backups are correct without testing','Only test backups when an actual incident occurs'],
        ans:1, tip:'Untested backups are unreliable. Regularly test restoring data from your backups — a backup you\'ve never restored from may fail when you need it most.',
        difficulty:2, scenario:'ATTACK 22'
      },
      {
        id:'B4', pillar:'💾 Backup',
        q:'Ransomware has encrypted your files. You have a recent, tested, offline backup. What is the CORRECT response?',
        opts:['Pay the ransom to get the decryption key quickly','Do NOT pay; isolate infected systems, restore from offline backups, then report to authorities','Delete all files and start fresh','Wait for the attackers to contact you again'],
        ans:1, tip:'Never pay ransom — your data may not be decrypted, and you may be targeted again. Isolate systems → check nomoreransom.org → restore from offline backups → report to SingCERT.',
        difficulty:2, scenario:'Ransomware Response'
      },
    ]
  },

  // ── PILLAR 5: RESPOND ─────────────────────────────────────────
  respond: {
    name: 'Respond',
    icon: '🚨',
    color: '#ff5a5a',
    description: 'Detect, respond, and recover from cyber incidents',
    questions: [
      {
        id:'R1', pillar:'🚨 Respond',
        q:'Why should an incident response plan involve multiple functional divisions and stakeholders?',
        opts:['To increase the number of meetings held','So all divisions know their roles BEFORE an incident and can respond effectively','Only IT needs to be involved in cyber incidents','To spread blame across more departments'],
        ans:1, tip:'Different roles have different responsibilities: IT isolates systems, HR handles employee comms, Communications manages reputation, Legal/DPO handles regulatory reporting (PDPA).',
        difficulty:1, scenario:'ATTACK 24'
      },
      {
        id:'R2', pillar:'🚨 Respond',
        q:'An employee clicked a phishing link and their credentials were stolen. What is the IMMEDIATE first step?',
        opts:['Inform all staff via email about what happened','Reset the compromised password immediately and check for any accounts using the same password','Wait to see if any unauthorised access actually occurs','File a police report before doing anything else'],
        ans:1, tip:'Immediate: reset the compromised password and any accounts sharing that password. Check for data tampering. Then restore from backups if needed, assess PDPA obligations, notify PDPC if required.',
        difficulty:2, scenario:'Social Engineering Response'
      },
      {
        id:'R3', pillar:'🚨 Respond',
        q:'Your CRM vendor informs you that their database — including your customer data — has been hacked. As Data Protection Officer, what must you do?',
        opts:['Send a press release before informing the regulator','Notify the Personal Data Protection Commission (PDPC) within 3 calendar days of confirming the breach','Wait 30 days before deciding whether to report','Only report if customers complain'],
        ans:1, tip:'Under PDPA, notify PDPC as soon as practicable, and no later than 3 calendar days from determining it\'s a notifiable data breach. Notify affected customers proactively.',
        difficulty:2, scenario:'Supply Chain Attack'
      },
      {
        id:'R4', pillar:'🚨 Respond',
        q:'After a ransomware incident, what should IT personnel do to contain the attack from spreading?',
        opts:['Keep all systems running to maintain business continuity','Isolate affected systems: disconnect ethernet, disable WiFi/Bluetooth, and check nomoreransom.org','Immediately pay the ransom to decrypt files quickly','Delete all affected files and notify staff it\'s resolved'],
        ans:1, tip:'Isolate first to stop lateral spread: disconnect ethernet, disable WiFi and Bluetooth. Visit nomoreransom.org for free decryptors. Never pay ransom — it encourages repeat targeting.',
        difficulty:2, scenario:'Ransomware Response'
      },
      {
        id:'R5', pillar:'🚨 Respond',
        q:'An employee accidentally submitted a confidential client contract into an unapproved AI tool. What should they do FIRST?',
        opts:['Delete the conversation history in the AI tool','Report the incident to the IT/cybersecurity and data team immediately','Not tell anyone — the contract is probably safe','Change their password and hope nothing happens'],
        ans:1, tip:'Report immediately to IT/cyber and data team. They can assess whether it\'s a notifiable data breach under PDPA. Develop acceptable use policies for AI tools to prevent recurrence.',
        difficulty:2, scenario:'Shadow AI'
      },
    ]
  }
};

// ── FLAT LIST FOR EASY RANDOM ACCESS ──────────────────────────
const ALL_QUESTIONS = Object.values(QUESTION_BANK).flatMap(p => p.questions);

// ── ZONE → PILLAR MAPPING FOR CYBER HUNTERS ───────────────────
const HUNTER_ZONES = [
  { id:'assets',  zone:1, name:'Asset Atoll',            pillar:QUESTION_BANK.assets,  boss:{ name:'Shadow IT Lord',   sprite:'🕵️', hp:60, xpReward:100, item:'🗂️ Asset Badge' } },
  { id:'secure',  zone:2, name:'Security Sanctum',        pillar:QUESTION_BANK.secure,  boss:{ name:'Ransomware Dragon', sprite:'🐲', hp:80, xpReward:150, item:'🛡️ Shield Badge' } },
  { id:'update',  zone:3, name:'Patch Plains',            pillar:QUESTION_BANK.update,  boss:{ name:'Zero-Day Phantom',  sprite:'👻', hp:70, xpReward:120, item:'🔄 Update Badge' } },
  { id:'backup',  zone:4, name:'Backup Bastion',          pillar:QUESTION_BANK.backup,  boss:{ name:'Data Void Wraith',  sprite:'💀', hp:90, xpReward:180, item:'💾 Backup Badge' } },
  { id:'respond', zone:5, name:'Response HQ',             pillar:QUESTION_BANK.respond, boss:{ name:'APT Overlord',      sprite:'☠️', hp:120,xpReward:250, item:'🚨 Master Badge' } },
];

// ── GACHA REWARDS ─────────────────────────────────────────────
const GACHA_POOL = [
  { icon:'💎', name:'Cyber Diamond',   rarity:'EPIC',   rc:'#cc55ff', effect:'Double XP next battle' },
  { icon:'🛡️', name:'Shield Pack',     rarity:'RARE',   rc:'#ffcc00', effect:'Resist next wrong answer' },
  { icon:'⚡', name:'Speed Boost',     rarity:'COMMON', rc:'#7a9fff', effect:'+20 bonus XP' },
  { icon:'🔑', name:'Master Key',      rarity:'EPIC',   rc:'#cc55ff', effect:'Auto-answer next Q hint' },
  { icon:'🎖️', name:'Honor Medal',     rarity:'RARE',   rc:'#ffcc00', effect:'+1 HP restored' },
  { icon:'🌟', name:'Star Fragment',   rarity:'COMMON', rc:'#7a9fff', effect:'+15 bonus XP' },
  { icon:'🧬', name:'Data Core',       rarity:'RARE',   rc:'#ffcc00', effect:'+50 bonus XP' },
  { icon:'🔮', name:'Cyber Crystal',   rarity:'EPIC',   rc:'#cc55ff', effect:'Reveal one wrong answer' },
];

function getRandomGacha(){
  const roll = Math.random();
  const pool = roll < 0.15 ? GACHA_POOL.filter(g=>g.rarity==='EPIC')
             : roll < 0.45 ? GACHA_POOL.filter(g=>g.rarity==='RARE')
             : GACHA_POOL.filter(g=>g.rarity==='COMMON');
  return pool[Math.floor(Math.random()*pool.length)];
}

function getQuestionsByPillar(pillarId, count=4){
  const pool = QUESTION_BANK[pillarId]?.questions || ALL_QUESTIONS;
  const shuffled = [...pool].sort(()=>Math.random()-0.5);
  return shuffled.slice(0, count);
}

function getRandomQuestion(excludeIds=[]){
  const pool = ALL_QUESTIONS.filter(q=>!excludeIds.includes(q.id));
  return pool[Math.floor(Math.random()*pool.length)];
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.CyberQB = { QUESTION_BANK, ALL_QUESTIONS, HUNTER_ZONES, GACHA_POOL, getRandomGacha, getQuestionsByPillar, getRandomQuestion };
}
