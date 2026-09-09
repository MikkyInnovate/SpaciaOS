import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardAICallEvent } from "../types";
import { Bot, PhoneCall, Clock, AlertCircle, ArrowRight } from "lucide-react";

export interface AIAgentLiveFeedProps {
  events: DashboardAICallEvent[];
}

export function AIAgentLiveFeed({ events }: AIAgentLiveFeedProps) {
  return (
    <Card className="bg-white border-border shadow-2xs">
      <CardHeader className="p-4 pb-3 border-b border-border bg-stone-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-stone-100 text-stone-700 border border-stone-200/60">
              <Bot className="h-4 w-4" aria-hidden="true" />
            </div>
            <CardTitle className="font-display text-base font-bold text-stone-900">
              AI Sales Activity
            </CardTitle>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            3 Active
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 divide-y divide-border/60">
        {events.map((event) => (
          <div key={event.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-900 text-xs truncate">
                {event.leadName}
              </span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] text-stone-500 font-mono">
                  <Clock className="h-3 w-3 text-stone-400" />
                  {event.duration}
                </span>
                <span className="text-[11px] text-stone-400">•</span>
                <span className="text-[11px] text-stone-500">{event.timestamp}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-600 font-medium truncate">
                {event.propertyTitle}
              </span>
              {event.outcome === "Qualified" && (
                <Badge variant="qualified" className="ml-auto text-[10px] px-2 py-0.5">
                  {event.outcome}
                </Badge>
              )}
              {event.outcome === "Viewing Requested" && (
                <Badge variant="viewing" className="ml-auto text-[10px] px-2 py-0.5">
                  {event.outcome}
                </Badge>
              )}
              {event.outcome === "In Conversation" && (
                <Badge variant="inConversation" className="ml-auto text-[10px] px-2 py-0.5">
                  {event.outcome}
                </Badge>
              )}
              {event.outcome === "Voicemail" && (
                <Badge variant="cold" className="ml-auto text-[10px] px-2 py-0.5">
                  {event.outcome}
                </Badge>
              )}
            </div>

            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed bg-stone-50/70 p-2 rounded-md border border-stone-200/70">
              &ldquo;{event.summary}&rdquo;
            </p>

            {event.isEscalated && (
              <div className="flex items-center justify-between pt-1">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                  <AlertCircle className="h-3 w-3" />
                  Human takeover recommended
                </span>
                <Button size="sm" variant="link" className="text-xs h-auto p-0 gap-1 text-stone-900 font-semibold">
                  Take Lead <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}

        <div className="pt-3">
          <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 text-stone-700">
            <PhoneCall className="h-3.5 w-3.5 text-stone-400" />
            <span>Open Call Recording Vault</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
