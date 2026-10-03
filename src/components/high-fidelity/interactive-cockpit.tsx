"use client";

import { useState } from "react";
import { PhoneCall, Volume2, VolumeX, Check, PhoneForwarded } from "lucide-react";
import { toast } from "sonner";

interface Scenario {
  id: string;
  name: string;
  property: string;
  askingPrice: string;
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
  };
}

const SCENARIOS: Scenario[] = [
  {
    id: "penthouse",
    name: "Dr. Folake Alabi",
    property: "The Glass House, Ikoyi Waterfront (4-Bed)",
    askingPrice: "₦450,000,000",
    bantScore: 96,
    status: "HOT",
    conversation: [
      {
        speaker: "ai",
        text: "Good afternoon Dr. Alabi. Regarding your inquiry on the Ikoyi penthouse: are you looking for primary residence or portfolio investment?",
        timestamp: "00:04",
      },
      {
        speaker: "buyer",
        text: "Primary residence. Family relocating from London. Need private boat mooring and minimum 4 en-suite bedrooms.",
        timestamp: "00:12",
      },
      {
        speaker: "ai",
        text: "Noted. Regarding the ₦450M asking price, is financing required or do you have certified funds ready?",
        timestamp: "00:20",
      },
      {
        speaker: "buyer",
        text: "Liquid bank draft ready at Zenith Bank. In Lagos this Saturday and want a private inspection with my architect.",
        timestamp: "00:29",
      },
      {
        speaker: "ai",
        text: "Confirmed. Saturday 11:30 AM reserved with Senior Partner Babatunde Adeleke. Calendar invite and gate pass sent via SMS.",
        timestamp: "00:38",
      },
    ],
    extracted: {
      budget: "₦450M Liquid (Zenith Bank Draft)",
      authority: "Sole Buyer + Family Architect",
      need: "4-Bed + 12m Mooring",
      timeline: "Saturday 11:30 AM Inspection",
    },
  },
  {
    id: "commercial",
    name: "Engr. Nnamdi Okonjo",
    property: "Civic Tower Grade-A Floor, Victoria Island",
    askingPrice: "₦850,000,000",
    bantScore: 91,
    status: "HOT",
    conversation: [
      {
        speaker: "ai",
        text: "Hello Engr. Okonjo. Regarding the Civic Tower floor prospectus: what square footage does your syndicate require?",
        timestamp: "00:03",
      },
      {
        speaker: "buyer",
        text: "1,200 sqm contiguous. Need 24/7 dual generator backup and minimum 25 dedicated bays.",
        timestamp: "00:11",
      },
      {
        speaker: "ai",
        text: "The 8th floor offers 1,280 sqm and 28 bays. Are you looking at outright acquisition or institutional lease?",
        timestamp: "00:20",
      },
      {
        speaker: "buyer",
        text: "Outright purchase. Board approved ₦850M CapEx last week. Need inspection briefing by Friday.",
        timestamp: "00:28",
      },
    ],
    extracted: {
      budget: "₦850M Board-Approved CapEx",
      authority: "Managing Partner & Board Sign-off",
      need: "1,280 sqm Commercial Floor",
      timeline: "Friday Underwriting Briefing",
    },
  },
  {
    id: "offplan",
    name: "Chief Tunde Balogun",
    property: "Marina Residences, Eko Atlantic (3-Bed)",
    askingPrice: "₦320,000,000",
    bantScore: 78,
    status: "WARM",
    conversation: [
      {
        speaker: "ai",
        text: "Good day Chief Balogun. Regarding the Marina Residences tower: what delivery window fits your portfolio strategy?",
        timestamp: "00:04",
      },
      {
        speaker: "buyer",
        text: "Q4 2027 is acceptable. I want to inspect the milestone escrow framework before committing the 20% deposit.",
        timestamp: "00:13",
      },
      {
        speaker: "ai",
        text: "Understood. Escrow disbursements follow certified foundation milestones. Audited schedule sent to your WhatsApp.",
        timestamp: "00:22",
      },
    ],
    extracted: {
      budget: "₦320M Phased Milestones",
      authority: "Family Trust Trustee",
      need: "High-Yield Marina Rental Unit",
      timeline: "Pending Escrow Milestone Review",
    },
  },
];

export function InteractiveCockpit() {
  const [activeScenarioId, setActiveScenarioId] = useState<string>("penthouse");
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(true);

  const scenario =
    SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  const triggerBrokerTakeover = () => {
    toast.success("Broker Takeover: Live call transferred to partner phone.");
  };

  return (
    <div
      id="cockpit"
      className="w-full bg-white rounded-xl border border-zinc-200 overflow-hidden text-left"
    >
      {/* Titlebar */}
      <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-600 font-semibold">
          <span>COCKPIT PREVIEW // SPEECH & QUALIFICATION</span>
        </div>

        {/* Scenario Switcher */}
        <div className="flex items-center gap-1 bg-zinc-200/80 p-0.5 rounded text-xs">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveScenarioId(s.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                activeScenarioId === s.id
                  ? "bg-white text-zinc-950 font-bold shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              {s.name.split(" ")[0]} ({s.status})
            </button>
          ))}
        </div>
      </div>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
        {/* Left: Audio & Transcript (7 cols) */}
        <div className="lg:col-span-7 p-5 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-zinc-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-zinc-950 text-white flex items-center justify-center">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900">{scenario.name}</div>
                <div className="text-[11px] text-zinc-500 truncate max-w-[220px]">
                  {scenario.property}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-end gap-0.5 h-4 px-1">
                {[30, 80, 50, 90, 60, 40, 70].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: isPlayingAudio ? `${h}%` : "30%" }}
                    className="w-1 bg-zinc-900 rounded-full transition-all duration-300"
                  />
                ))}
              </div>
              <button
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className="p-1 rounded border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              >
                {isPlayingAudio ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Transcript Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>LIVE TRANSCRIPT</span>
              <span>LATENCY: 380MS</span>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {scenario.conversation.map((turn, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded text-xs leading-relaxed border ${
                    turn.speaker === "ai"
                      ? "bg-zinc-50 border-zinc-200 text-zinc-800 ml-3"
                      : "bg-white border-zinc-300 text-zinc-950 font-medium mr-3"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-0.5">
                    <span>{turn.speaker === "ai" ? "Spacia AI" : scenario.name}</span>
                    <span>{turn.timestamp}</span>
                  </div>
                  <p>{turn.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Takeover Control */}
          <div className="pt-2 flex items-center justify-between border-t border-zinc-100">
            <span className="text-[10px] font-mono text-zinc-400">HUMAN OVERSIGHT</span>
            <button
              onClick={triggerBrokerTakeover}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors"
            >
              <PhoneForwarded className="w-3 h-3" />
              <span>Take Over Live Call</span>
            </button>
          </div>
        </div>

        {/* Right: BANT Score & Extraction (5 cols) */}
        <div className="lg:col-span-5 p-5 bg-zinc-50/50 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase">
                BANT Underwriting Score
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-mono font-bold text-zinc-950">
                  {scenario.bantScore}
                </span>
                <span className="text-xs font-mono text-zinc-400">/ 100</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-200 text-zinc-800 font-bold ml-1">
                  {scenario.status}
                </span>
              </div>
            </div>

            <div className="w-10 h-10 rounded-full border-2 border-zinc-950 flex items-center justify-center font-mono text-xs font-bold text-zinc-950 bg-white">
              {scenario.bantScore}%
            </div>
          </div>

          {/* Criteria Checklist */}
          <div className="space-y-2 text-xs">
            <div className="p-2 rounded bg-white border border-zinc-200 flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-zinc-950 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-zinc-400 font-mono">BUDGET PROOF</div>
                <div className="font-semibold text-zinc-900 truncate">
                  {scenario.extracted.budget}
                </div>
              </div>
            </div>

            <div className="p-2 rounded bg-white border border-zinc-200 flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-zinc-950 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-zinc-400 font-mono">AUTHORITY</div>
                <div className="font-semibold text-zinc-900 truncate">
                  {scenario.extracted.authority}
                </div>
              </div>
            </div>

            <div className="p-2 rounded bg-white border border-zinc-200 flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-zinc-950 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-zinc-400 font-mono">PROPERTY FIT</div>
                <div className="font-semibold text-zinc-900 truncate">
                  {scenario.extracted.need}
                </div>
              </div>
            </div>

            <div className="p-2 rounded bg-white border border-zinc-200 flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-zinc-950 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-zinc-400 font-mono">TIMELINE</div>
                <div className="font-semibold text-zinc-900 truncate">
                  {scenario.extracted.timeline}
                </div>
              </div>
            </div>
          </div>

          {/* Action Directive */}
          <div className="p-3 rounded border border-zinc-300 bg-white text-xs space-y-1">
            <div className="font-bold text-zinc-950 text-[11px] font-mono">
              DIRECTIVE TAKEN:
            </div>
            <p className="text-[11px] text-zinc-600 leading-snug">
              Viewing slot confirmed on broker Google Calendar. WhatsApp briefing and gated entry passes auto-dispatched.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
