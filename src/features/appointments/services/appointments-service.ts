import {
  Appointment,
  CalendarConnection,
  ViewingSlot,
  CreateAppointmentPayload,
  AppointmentStatus,
} from "../types";

/**
 * CLIENT APPOINTMENTS SERVICE
 * 
 * Provides communication with backend appointments and calendar connection endpoints
 * with resilient fallback to local state when backend is provisioning.
 */
class AppointmentsService {
  private appointmentsCache: Appointment[] = [
    {
      id: "apt_01_danjuma",
      workspaceId: "ws_default",
      leadId: "lead_01_danjuma",
      leadName: "Alhaji Danjuma",
      leadPhone: "+234 803 999 8877",
      leadScore: 94,
      leadScoreCategory: "HOT",
      propertyId: "prop_banana_villa",
      propertyTitle: "The Grand Waterfront Villa",
      propertyLocation: "Zone A, Banana Island, Ikoyi, Lagos",
      propertyPrice: "₦950,000,000",
      propertyImage: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
      assignedBrokerId: "broker_ade",
      assignedBrokerName: "Ade Admin (Senior Luxury Closer)",
      assignedBrokerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      startTime: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now at 3 PM
      endTime: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString(),
      status: "confirmed",
      meetingType: "vip_private_showing",
      location: "Private Gate 4, Ocean Drive, Banana Island",
      gatePassCode: "BI-9942-VIP",
      gatePassExpiresAt: new Date(Date.now() + 86400000 * 2 + 7200000).toISOString(),
      notes: "VIP Inspection. High liquid prospect. Gate pass auto-issued. Prepare high-gloss legal title brochure.",
      calendarProvider: "native",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "apt_02_adeleke",
      workspaceId: "ws_default",
      leadId: "lead_02_adeleke",
      leadName: "Chief Adeleke",
      leadPhone: "+234 802 345 6789",
      leadScore: 92,
      leadScoreCategory: "HOT",
      propertyId: "prop_eko_atlantic",
      propertyTitle: "Azure Horizon Oceanfront Tower",
      propertyLocation: "Eko Atlantic City, Victoria Island, Lagos",
      propertyPrice: "₦620,000,000",
      propertyImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
      assignedBrokerId: "broker_victoria",
      assignedBrokerName: "Victoria Okon (Senior Partner)",
      assignedBrokerAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
      startTime: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
      endTime: new Date(Date.now() + 86400000 * 3 + 3600000).toISOString(),
      status: "scheduled",
      meetingType: "in_person_viewing",
      location: "Tower 2 Executive Lobby, Eko Atlantic",
      gatePassCode: "EA-4108-PASS",
      notes: "Prospective investor acquiring 2 luxury penthouse units.",
      calendarProvider: "google_calendar",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "apt_03_jenkins",
      workspaceId: "ws_default",
      leadId: "lead_03_jenkins",
      leadName: "Sarah Jenkins",
      leadPhone: "+234 812 345 6789",
      leadScore: 84,
      leadScoreCategory: "WARM",
      propertyId: "prop_bourdillon",
      propertyTitle: "Bourdillon Sky Penthouse",
      propertyLocation: "Bourdillon Road, Ikoyi, Lagos",
      propertyPrice: "₦1,200,000,000",
      propertyImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
      assignedBrokerId: "broker_ade",
      assignedBrokerName: "Ade Admin (Senior Luxury Closer)",
      startTime: new Date(Date.now() + 86400000 * 4).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 4 + 3600000).toISOString(),
      status: "scheduled",
      meetingType: "in_person_viewing",
      location: "Main Reception, 4 Bourdillon, Ikoyi",
      notes: "Relocating from London. Interested in payment installment structure.",
      calendarProvider: "cal_com",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private connectionsCache: CalendarConnection[] = [
    {
      id: "conn_native",
      workspaceId: "ws_default",
      provider: "native",
      providerName: "Pacia Native Scheduler",
      accountEmail: "agency-ops@spacia.io",
      status: "connected",
      calendarName: "Master Agency Calendar",
      isPrimary: true,
      autoSyncEnabled: true,
      lastSyncedAt: new Date().toISOString(),
    },
    {
      id: "conn_google",
      workspaceId: "ws_default",
      provider: "google_calendar",
      providerName: "Google Calendar",
      accountEmail: "ade.admin@spacia.io",
      status: "connected",
      calendarName: "VIP Viewings & Inspections",
      isPrimary: false,
      autoSyncEnabled: true,
      lastSyncedAt: new Date().toISOString(),
    },
    {
      id: "conn_calcom",
      workspaceId: "ws_default",
      provider: "cal_com",
      providerName: "Cal.com Scheduling",
      accountEmail: "cal.com/ade-spacia",
      status: "connected",
      calendarName: "30-Min Property Tour",
      isPrimary: false,
      autoSyncEnabled: true,
      lastSyncedAt: new Date().toISOString(),
    },
    {
      id: "conn_outlook",
      workspaceId: "ws_default",
      provider: "outlook",
      providerName: "Microsoft Outlook",
      status: "disconnected",
      isPrimary: false,
      autoSyncEnabled: false,
    },
  ];

  /**
   * List appointments with optional status and search filtering
   */
  async getAppointments(filters?: {
    status?: string;
    search?: string;
    leadId?: string;
  }): Promise<Appointment[]> {
    try {
      const res = await fetch(`/api/v1/appointments`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch {
      // Fall back to local state
    }

    let filtered = [...this.appointmentsCache];
    if (filters?.leadId) {
      filtered = filtered.filter((a) => a.leadId === filters.leadId);
    }
    if (filters?.status && filters.status !== "ALL") {
      filtered = filtered.filter((a) => a.status === filters.status);
    }
    if (filters?.search?.trim()) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.leadName.toLowerCase().includes(term) ||
          a.propertyTitle.toLowerCase().includes(term) ||
          a.location.toLowerCase().includes(term) ||
          a.assignedBrokerName.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  /**
   * Retrieve available viewing slots for a property and date
   */
  async getAvailableSlots(propertyId: string, date: Date): Promise<ViewingSlot[]> {
    try {
      const dateStr = date.toISOString().split("T")[0];
      const res = await fetch(`/api/v1/appointments/slots?propertyId=${propertyId}&date=${dateStr}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch {
      // Fall back to generated slots
    }

    const times = ["10:00 AM", "11:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"];
    return times.map((t, idx) => {
      const baseHour = 10 + Math.floor(idx * 1.5);
      const slotStart = new Date(date);
      slotStart.setHours(baseHour, (idx % 2) * 30, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + 3600000);

      return {
        id: `slot_${idx}_${date.getTime()}`,
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        formattedTime: `${t} – ${new Date(slotEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        formattedDate: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        isAvailable: idx !== 2, // 1:00 PM marked as booked
        brokerName: "Ade Admin (Luxury Closer)",
        reasonUnavailable: idx === 2 ? "Already booked with VIP buyer" : undefined,
      };
    });
  }

  /**
   * Book a new property inspection
   */
  async createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
    const gatePass = `SP-${Math.floor(1000 + Math.random() * 9000)}-VIP`;
    const newApt: Appointment = {
      id: `apt_${Date.now()}`,
      workspaceId: "ws_default",
      leadId: payload.leadId,
      leadName: "VIP Inbound Buyer",
      leadPhone: "+234 800 000 0000",
      propertyId: payload.propertyId,
      propertyTitle: "Luxury Residence",
      propertyLocation: payload.location || "Banana Island, Lagos",
      assignedBrokerId: payload.assignedBrokerId || "broker_ade",
      assignedBrokerName: "Ade Admin",
      startTime: payload.startTime,
      endTime: payload.endTime || new Date(new Date(payload.startTime).getTime() + 3600000).toISOString(),
      status: "confirmed",
      meetingType: payload.meetingType || "in_person_viewing",
      location: payload.location || "Estate Main Gate",
      gatePassCode: payload.generateGatePass ? gatePass : undefined,
      notes: payload.notes,
      calendarProvider: "native",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(`/api/v1/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          this.appointmentsCache.unshift(data.data);
          return data.data;
        }
      }
    } catch {
      // Fall back
    }

    this.appointmentsCache.unshift(newApt);
    return newApt;
  }

  /**
   * Update appointment status
   */
  async updateStatus(appointmentId: string, status: AppointmentStatus): Promise<Appointment> {
    const apt = this.appointmentsCache.find((a) => a.id === appointmentId);
    if (apt) {
      apt.status = status;
      apt.updatedAt = new Date().toISOString();
    }
    return apt!;
  }

  /**
   * Get active calendar connections
   */
  async getCalendarConnections(): Promise<CalendarConnection[]> {
    return this.connectionsCache;
  }

  /**
   * Toggle or connect a calendar provider
   */
  async toggleConnection(provider: string, enable: boolean): Promise<CalendarConnection[]> {
    const conn = this.connectionsCache.find((c) => c.provider === provider);
    if (conn) {
      conn.status = enable ? "connected" : "disconnected";
      conn.autoSyncEnabled = enable;
      conn.lastSyncedAt = enable ? new Date().toISOString() : undefined;
    }
    return [...this.connectionsCache];
  }
}

export const appointmentsService = new AppointmentsService();
