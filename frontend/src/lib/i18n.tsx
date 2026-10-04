"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "hi";

export interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const translations: Translations = {
  // Navigation & General
  dashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
  attendance: { en: "Attendance", hi: "हाज़िरी" },
  register: { en: "Register", hi: "रजिस्टर" },
  tasks: { en: "Tasks", hi: "कार्य (टास्क)" },
  orders: { en: "Orders", hi: "आदेश (ऑर्डर्स)" },
  advances: { en: "Advances", hi: "अग्रिम वेतन" },
  complaints: { en: "Complaints", hi: "शिकायतें" },
  leaves: { en: "Leaves", hi: "छुट्टी आवेदन" },
  payroll: { en: "Payroll", hi: "वेतन (पेरोल)" },
  ledger: { en: "Ledger", hi: "खाता बही (लेज़र)" },
  employees: { en: "Employees", hi: "कर्मचारी" },
  settings: { en: "Settings", hi: "सेटिंग्स" },
  reports: { en: "Reports & Analytics", hi: "रिपोर्ट्स और विश्लेषण" },
  shopQr: { en: "Shop QR", hi: "दुकान QR कोड" },
  reviewQueue: { en: "Review Queue", hi: "समीक्षा कतार" },
  corrections: { en: "Corrections", hi: "समय सुधार" },
  auditLog: { en: "Audit Log", hi: "ऑडिट लॉग" },
  signOut: { en: "Sign Out", hi: "लॉग आउट" },
  adminWorkspace: { en: "Admin Workspace", hi: "व्यवस्थापक पैनल" },
  employeePortal: { en: "Employee Portal", hi: "कर्मचारी पोर्टल" },

  // Shift & Attendance
  checkIn: { en: "Check In", hi: "चेक-इन करें" },
  checkOut: { en: "Check Out", hi: "चेक-आउट करें" },
  startBreak: { en: "Start Break", hi: "चाय/लंच ब्रेक लें" },
  endBreak: { en: "End Break", hi: "ब्रेक समाप्त करें" },
  workingNow: { en: "Currently On Duty", hi: "ड्यूटी चालू है" },
  onBreak: { en: "On Break", hi: "ब्रेक पर हैं" },
  shiftCompleted: { en: "Shift Completed", hi: "शिफ्ट समाप्त" },
  notStarted: { en: "Not Checked In", hi: "चेक-इन नहीं हुआ" },
  todayShift: { en: "Today's Work Shift", hi: "आज की कार्य शिफ्ट" },
  hoursWorked: { en: "Hours Worked", hi: "कार्य घंटे" },
  breakTime: { en: "Break Duration", hi: "ब्रेक समय" },
  gpsVerified: { en: "GPS Verified", hi: "जीपीएस सत्यापित" },
  insideShop: { en: "Inside Shop Boundary", hi: "दुकान परिसर के अंदर" },
  present: { en: "Present", hi: "उपस्थित" },
  absent: { en: "Absent", hi: "अनुपस्थित" },
  fullDay: { en: "Full Day (≥10h)", hi: "पूरा दिन (≥10 घंटे)" },
  halfDay: { en: "Half Day (≥5h)", hi: "आधा दिन (≥5 घंटे)" },
  liveShift: { en: "Active Live Shift", hi: "सक्रिय लाइव शिफ्ट" },

  // Tasks & Orders
  assignTask: { en: "+ Create Task", hi: "+ नया टास्क बनाएं" },
  taskEvidence: { en: "Submit Evidence", hi: "सबूत / फोटो जमा करें" },
  dispatchOrder: { en: "+ Dispatch Order", hi: "+ ऑर्डर भेजें" },
  claimOrder: { en: "Claim Order", hi: "ऑर्डर स्वीकार करें" },
  packOrder: { en: "Start Packing", hi: "पैकिंग शुरू करें" },
  markDelivered: { en: "Mark Delivered", hi: "डिलीवर मार्क करें" },
  broadcastOpen: { en: "Broadcast Pool", hi: "उपलब्ध ऑर्डर्स" },
  assignedToYou: { en: "Assigned To You", hi: "आपको सौंपे गए कार्य" },
  inProgress: { en: "In Progress", hi: "प्रगति पर" },
  submitted: { en: "Submitted for Review", hi: "समीक्षा के लिए जमा" },
  completed: { en: "Completed", hi: "पूरा हो गया" },

  // Advances & Leaves
  requestAdvance: { en: "Request Salary Advance", hi: "अग्रिम वेतन आवेदन" },
  applyLeave: { en: "Apply for Leave", hi: "छुट्टी के लिए आवेदन करें" },
  raiseComplaint: { en: "Raise a Grievance / Complaint", hi: "शिकायत या समस्या दर्ज करें" },
  pendingApproval: { en: "Pending Approval", hi: "स्वीकृति प्रतीक्षित" },
  disbursed: { en: "Disbursed", hi: "भुगतान हो गया" },
  approved: { en: "Approved", hi: "स्वीकृत" },
  rejected: { en: "Rejected", hi: "अस्वीकृत" },

  // Auth & Admin Guard
  adminLoginTitle: { en: "Workforce CRM — Admin Security", hi: "वर्कफ़ोर्स CRM — व्यवस्थापक सुरक्षा" },
  adminLoginDesc: { en: "Please enter your administrator credentials to access the admin portal.", hi: "कृपया व्यवस्थापक पोर्टल खोलने के लिए अपनी आईडी और पासवर्ड दर्ज करें।" },
  emailAddress: { en: "Email Address", hi: "ईमेल आईडी" },
  password: { en: "Password", hi: "पासवर्ड" },
  loginButton: { en: "Authenticate & Open Admin", hi: "लॉगिन करें और पोर्टल खोलें" },
  invalidAdminCredentials: { en: "Invalid admin email or password. Please try again.", hi: "गलत व्यवस्थापक आईडी या पासवर्ड। कृपया पुनः प्रयास करें।" },
  syncLive: { en: "Cloud Live Synced", hi: "क्लाउड लाइव सिंक" },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("wcrm_lang") as Language;
      if (saved === "en" || saved === "hi") {
        setLangState(saved);
      }
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("wcrm_lang", newLang);
    }
  };

  const t = (key: string, defaultText?: string): string => {
    if (translations[key] && translations[key][lang]) {
      return translations[key][lang];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
