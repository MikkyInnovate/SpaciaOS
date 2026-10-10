"use client";

import { useState } from "react";
import {
  PhoneCall,
  Mic,
  Volume2,
  CheckCircle2,
  Calendar,
  Building2,
  Wallet,
  Clock,
  UserCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  property: string;
  budget: string;
  timeline: string;
  bantScore: number;
  status: "HOT" | "WARM";
  conversation: {
    speaker: "ai" | "buyer";
    text: string;
    timestamp: string;
  }[];
  extracted: {
    budget: string;
    authority: string;
    need: string;
    timeline: string;
    liquidity: string;
  };
}

const SCENARIOS: Scenario[] = [
  {
    id: "penthouse",
    name: "Dr. Folake Alabi",
    property: "The Glass House, Ikoyi Waterfront (4-Bed)",
    budget: "₦450,000,000",
    timeline: "< 14 Days",
    bantScore: 96,
    status: "HOT",
    conversation: [
      {
        speaker: "ai",
        text: "Good afternoon Dr. Alabi, thank you for your inquiry on the Ikoyi Waterfront Penthouse. Are you looking to acquire this as a primary residence or an investment asset?",
        timestamp: "00:04",
      },
      {
        speaker: "buyer",
        text: "Primary residence. My family is relocating from London next month. We need private boat mooring and minimum 4 en-suite bedrooms.",
        timestamp: "00:12",
      },
      {
        speaker: "ai",
        text: "Understood. The 4-bed penthouse features a private 12-meter jetty and full smart automation. Regarding the ₦450M asking price, is financing required or are you transacting via certified funds?",
        timestamp: "00:21",
      },
      {
        speaker: "buyer",
        text: "Liquid bank draft ready at Zenith Bank. I am in Lagos this Saturday and want a private viewing with my architect.",
        timestamp: "00:30",
      },
      {
        speaker: "ai",
        text: "Outstanding. I have confirmed your criteria. I am reserving Saturday at 11:30 AM directly with our Lead Partner, Babatunde. You will receive calendar and gate access passes via SMS shortly.",
        timestamp: "00:39",
      },
    ],
    extracted: {
      budget: "₦450M Liquid (Zenith Bank Draft)",
      authority: "Sole Buyer + Family Architect",
      need: "4-Bed + 12m Boat Mooring",
      timeline: "Saturday 11:30 AM Inspection",
      liquidity: "100% Certified Funds",
    },
  },
  {
    id: "commercial",
    name: "Engr. Nnamdi Okonjo",
    property: "Civic Tower Grade-A Office Floor, VI",
    budget: "₦850,000,000",
    timeline: "30 Days",
    bantScore: 91,
    status: "HOT",
    conversation: [
      {
        speaker: "ai",
        text: "Hello Engr. Okonjo, welcome to SpaciaOS. I see you downloaded the prospectus for the Civic Tower office floor. What square footage is your syndicate targeting?",
        timestamp: "00:03",
      },
      {
        speaker: "buyer",
        text: "We require 1,200 square meters contiguous. Need 24/7 dual generator backup and minimum 25 dedicated parking bays.",
        timestamp: "00:11",
      },
      {
        speaker: "ai",
        text: "The 8th floor offers exactly 1,280 sqm with 28 allocated bays and redundant 1.5MVA power. Are you looking at outright acquisition or long-term institutional lease?",
        timestamp: "00:22",
      },
      {
        speaker: "buyer",
        text: "Outright purchase. Board approved ₦850M capital expenditure last Tuesday. We want inspection documents by Friday.",
        timestamp: "00:32",
      },
    ],
    extracted: {
      budget: "₦850M Board-Approved CapEx",
      authority: "Managing Partner & Board Sign-off",
      need: "1,200 sqm Commercial Floor + 25 Bays",
      timeline: "Friday Underwriting Briefing",
      liquidity: "Corporate Treasury Allocation",
    },
  },
  {
    id: "offplan",
    name: "Chief Tunde Balogun",
    property: "Eko Atlantic Marina Residences (3-Bed)",
    budget: "₦320,000,000",
    timeline: "60 Days",
    bantScore: 78,
    status: "WARM",
    conversation: [
      {
        speaker: "ai",
        text: "Good day Chief Balogun. Regarding your inquiry on the Marina Residences off-plan tower, what completion milestone window matches your portfolio plans?",
        timestamp: "00:04",
      },
      {
        speaker: "buyer",
        text: "Q4 2027 delivery is acceptable. I want to understand the phased milestone payment schedule before committing an initial 20% deposit.",
        timestamp: "00:14",
      },
      {
        speaker: "ai",
        text: "Certainly. Milestone schedules are tied to foundation and roof slab certifications. I have dispatched the audited escrow contract to your WhatsApp.",
        timestamp: "00:24",
      },
    ],
    extracted: {
      budget: "₦320M Phased Milestones",
      authority: "Family Trust Trustee",
      need: "High-yield Marina Rental Speculation",
      timeline: "Pending Milestone Escrow Review",
      liquidity: "20% Initial Deposit Ready",
    },
  },
];

export function CockpitSimulator() {
  const [activeScenarioId, setActiveScenarioId] = useState<string>("penthouse");
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const scenario =
    SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  return (
    <div className="w-full bg-white rounded-xl border border-[#e8e8e6] shadow-sm overflow-hidden">
      {/* Cockpit Window Header */}
      <div className="bg-stone-50/90 border-b border-[#e8e8e6] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
          </div>
          <span className="text-[11px] font-mono text-stone-500 ml-2">
            TELEPHONY COCKPIT // INBOUND VOICE DIALER & QUALIFICATION
          </span>
        </div>

        {/* Scenario Switcher Tabs */}
        <div className="flex items-center gap-1 bg-stone-200/70 p-0.5 rounded-lg text-[11px]">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveScenarioId(s.id);
                setIsPlayingAudio(false);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                activeScenarioId === s.id
                  ? "bg-white text-stone-900 shadow-2xs font-semibold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {s.name.split(" ")[0]} ({s.status})
            </button>
          ))}
        </div>
      </div>

      {/* Main Cockpit Split: Left Voice & Transcript | Right Underwriting & BANT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#e8e8e6]">
        {/* Left Column: Telephony Player & Transcript (7 cols) */}
        <div className="lg:col-span-7 p-5 sm:p-6 space-y-5">
          {/* Active Call Status Bar */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200/70">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <PhoneCall className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-stone-900">{scenario.name}</h4>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 font-semibold">
                    IN CONVERSATION
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 truncate max-w-[240px] sm:max-w-xs">
                  {scenario.property}
                </p>
              </div>
            </div>

            {/* Simulated Audio Waveform & Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-2xs"
              >
                {isPlayingAudio ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>Mute Stream</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Simulate Audio</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Transcript Log Stream */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
              <span>REAL-TIME STREAM TRANSCRIPT</span>
              <span className="flex items-center gap-1 text-emerald-700">
                <Mic className="w-3 h-3 animate-pulse" /> Vapi Neural Engine Latency: 380ms
              </span>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {scenario.conversation.map((turn, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-xs leading-relaxed transition-all ${
                    turn.speaker === "ai"
                      ? "bg-stone-50 border border-stone-200/80 text-stone-800 ml-4"
                      : "bg-[#0d4a36]/5 border border-[#0d4a36]/20 text-[#093829] mr-4 font-medium"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono mb-1">
                    <span className="font-semibold text-stone-600">
                      {turn.speaker === "ai" ? "SpaciaOS Neural Associate" : scenario.name}
                    </span>
                    <span>{turn.timestamp}</span>
                  </div>
                  <p>{turn.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Reactive BANT & Underwriting Matrix (5 cols) */}
        <div className="lg:col-span-5 p-5 sm:p-6 bg-stone-50/50 space-y-5">
          {/* Lead Underwriting Score */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-200">
            <div>
              <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                Autonomous BANT Score
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-display font-bold text-stone-900">
                  {scenario.bantScore}
                </span>
                <span className="text-xs text-stone-400 font-mono">/ 100</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {scenario.status} TIER
                </span>
              </div>
            </div>

            <div className="w-12 h-12 rounded-full border-4 border-emerald-600/30 border-t-emerald-700 flex items-center justify-center font-mono text-xs font-bold text-emerald-900 bg-white shadow-2xs">
              {scenario.bantScore}%
            </div>
          </div>

          {/* Underwriting Criteria Checklist */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">
              Extracted Commercial Criteria
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 p-2 rounded-md bg-white border border-stone-200 shadow-2xs">
                <Wallet className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-stone-500 font-medium">Verified Budget & Proof</div>
                  <div className="font-semibold text-stone-900 truncate">
                    {scenario.extracted.budget}
                  </div>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-1" />
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-md bg-white border border-stone-200 shadow-2xs">
                <UserCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-stone-500 font-medium">Authority & Decision Maker</div>
                  <div className="font-semibold text-stone-900 truncate">
                    {scenario.extracted.authority}
                  </div>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-1" />
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-md bg-white border border-stone-200 shadow-2xs">
                <Building2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-stone-500 font-medium">Property Specification Fit</div>
                  <div className="font-semibold text-stone-900 truncate">
                    {scenario.extracted.need}
                  </div>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-1" />
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-md bg-white border border-stone-200 shadow-2xs">
                <Clock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-stone-500 font-medium">Inspection Timeline</div>
                  <div className="font-semibold text-stone-900 truncate">
                    {scenario.extracted.timeline}
                  </div>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-1" />
              </div>
            </div>
          </div>

          {/* Autonomous Action Taken */}
          <div className="p-3 rounded-lg bg-[#0d4a36]/10 border border-[#0d4a36]/20 text-xs text-[#093829] space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#0d4a36]" />
              <span>Automated Conversion Directive:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Google Calendar slot booked on Senior Partner's schedule. WhatsApp confirmation & gated security pass dispatched.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
