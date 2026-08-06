/**
 * CSA and SingCERT resource links mapped to each Cyber Essentials measure.
 *
 * Sources:
 *  - SG Cyber Safe Toolkits: https://www.sgcybersafe.gov.sg
 *  - SingCERT Incident Reporting: https://www.csa.gov.sg/singcert/reporting
 *  - CSA Cybersecurity Toolkit for IT Teams (Appendices PDF):
 *    https://isomer-user-content.by.gov.sg/36/744568da-0801-4cb5-a2b2-f54615ceed10/Cybersecurity-Toolkit-for-IT-Team-Appendices.pdf
 */

export interface CsaResource {
  label: string;
  url: string;
  /** Who this resource is aimed at */
  audience: "employees" | "it-teams" | "business-owners" | "general";
}

export type MeasureResources = {
  measureId: string;
  resources: CsaResource[];
};

const BASE = "https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/cybersecurity-resources-for-organisations";

const EMPLOYEE_TOOLKIT: CsaResource = {
  label: "SG Cyber Safe — Toolkits for Employees",
  url: `${BASE}/toolkits-for-employees/`,
  audience: "employees",
};

const IT_TOOLKIT: CsaResource = {
  label: "SG Cyber Safe — Toolkits for IT Teams",
  url: `${BASE}/toolkits-for-it-teams/`,
  audience: "it-teams",
};

const IT_TOOLKIT_APPENDICES: CsaResource = {
  label: "CSA Cybersecurity Toolkit for IT Teams — Appendices (PDF)",
  url: "https://isomer-user-content.by.gov.sg/36/744568da-0801-4cb5-a2b2-f54615ceed10/Cybersecurity-Toolkit-for-IT-Team-Appendices.pdf",
  audience: "it-teams",
};

const BUSINESS_TOOLKIT: CsaResource = {
  label: "SG Cyber Safe — Toolkits for Enterprise Leaders & SME Owners",
  url: `${BASE}/toolkits-for-enterprise-leaders-and-sme-owners/`,
  audience: "business-owners",
};

const SINGCERT_REPORT: CsaResource = {
  label: "SingCERT — Report a Cybersecurity Incident",
  url: "https://www.csa.gov.sg/singcert/reporting",
  audience: "general",
};

const SINGCERT_ALERTS: CsaResource = {
  label: "SingCERT — Alerts & Advisories",
  url: "https://www.csa.gov.sg/singcert/Advisories",
  audience: "it-teams",
};

const CE_RESOURCES: CsaResource = {
  label: "CSA — Cybersecurity Resources for Organisations",
  url: `${BASE}/`,
  audience: "general",
};

export const MEASURE_RESOURCES: MeasureResources[] = [
  {
    measureId: "A.1",
    resources: [
      EMPLOYEE_TOOLKIT,
      BUSINESS_TOOLKIT,
      {
        label: "SG Cyber Safe — Cybersecurity Awareness Training",
        url: `${BASE}/toolkits-for-employees/`,
        audience: "employees",
      },
      CE_RESOURCES,
    ],
  },
  {
    measureId: "A.2",
    resources: [
      IT_TOOLKIT,
      IT_TOOLKIT_APPENDICES,
      {
        label: "CSA — Appendix 4: Hardware Asset Inventory Template",
        url: "https://isomer-user-content.by.gov.sg/36/744568da-0801-4cb5-a2b2-f54615ceed10/Cybersecurity-Toolkit-for-IT-Team-Appendices.pdf",
        audience: "it-teams",
      },
      {
        label: "CSA — Appendix 5: Software Asset Inventory Template",
        url: "https://isomer-user-content.by.gov.sg/36/744568da-0801-4cb5-a2b2-f54615ceed10/Cybersecurity-Toolkit-for-IT-Team-Appendices.pdf",
        audience: "it-teams",
      },
    ],
  },
  {
    measureId: "A.3",
    resources: [
      IT_TOOLKIT,
      IT_TOOLKIT_APPENDICES,
      {
        label: "CSA — Appendix 7: Data Asset Inventory Template",
        url: "https://isomer-user-content.by.gov.sg/36/744568da-0801-4cb5-a2b2-f54615ceed10/Cybersecurity-Toolkit-for-IT-Team-Appendices.pdf",
        audience: "it-teams",
      },
      {
        label: "PDPC — Guide on Data Protection Practices",
        url: "https://www.pdpc.gov.sg/help-and-resources/2021/09/guide-on-data-protection-practices",
        audience: "business-owners",
      },
    ],
  },
  {
    measureId: "A.4",
    resources: [
      IT_TOOLKIT,
      SINGCERT_ALERTS,
      {
        label: "SingCERT — Malware Removal Guide",
        url: "https://www.csa.gov.sg/singcert/Advisories",
        audience: "it-teams",
      },
      CE_RESOURCES,
    ],
  },
  {
    measureId: "A.5",
    resources: [
      IT_TOOLKIT,
      IT_TOOLKIT_APPENDICES,
      {
        label: "CSA — Appendix 10: Account Inventory Template",
        url: "https://isomer-user-content.by.gov.sg/36/744568da-0801-4cb5-a2b2-f54615ceed10/Cybersecurity-Toolkit-for-IT-Team-Appendices.pdf",
        audience: "it-teams",
      },
      BUSINESS_TOOLKIT,
    ],
  },
  {
    measureId: "A.6",
    resources: [
      IT_TOOLKIT,
      SINGCERT_ALERTS,
      IT_TOOLKIT_APPENDICES,
    ],
  },
  {
    measureId: "A.7",
    resources: [
      IT_TOOLKIT,
      SINGCERT_ALERTS,
      {
        label: "SingCERT — Critical Patch Advisories",
        url: "https://www.csa.gov.sg/singcert/Advisories",
        audience: "it-teams",
      },
    ],
  },
  {
    measureId: "A.8",
    resources: [
      IT_TOOLKIT,
      BUSINESS_TOOLKIT,
      {
        label: "SG Cyber Safe — Backup and Recovery Best Practices",
        url: `${BASE}/toolkits-for-it-teams/`,
        audience: "it-teams",
      },
    ],
  },
  {
    measureId: "A.9",
    resources: [
      SINGCERT_REPORT,
      SINGCERT_ALERTS,
      BUSINESS_TOOLKIT,
      {
        label: "SingCERT — Incident Response Resources",
        url: "https://www.csa.gov.sg/singcert",
        audience: "general",
      },
      {
        label: "CSA — Incident Reporting Obligations",
        url: "https://www.csa.gov.sg/legislation/cybersecurity-act",
        audience: "business-owners",
      },
    ],
  },
];

const BY_MEASURE = new Map(MEASURE_RESOURCES.map((m) => [m.measureId, m.resources]));

export function resourcesForMeasure(measureId: string): CsaResource[] {
  return BY_MEASURE.get(measureId) ?? [];
}

const AUDIENCE_LABEL: Record<CsaResource["audience"], string> = {
  employees: "Employees",
  "it-teams": "IT Teams",
  "business-owners": "Business Owners",
  general: "General",
};

export function audienceLabel(a: CsaResource["audience"]): string {
  return AUDIENCE_LABEL[a];
}
