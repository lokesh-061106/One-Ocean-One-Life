"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  Shield,
  Heart,
  Navigation,
  ExternalLink,
  Info,
  CheckCircle,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchCms, ApiEmergencyContact } from "@/lib/api-helpers";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
  available: string;
}

const fallbackContacts: EmergencyContact[] = [
  {
    id: "1",
    name: "Coast Guard",
    phone: "1554",
    description: "Maritime emergencies and rescue operations",
    icon: "🛟",
    color: "border-red-500",
    bgColor: "bg-red-50",
    textColor: "text-red-600",
    available: "24/7",
  },
  {
    id: "2",
    name: "Police",
    phone: "100",
    description: "Law enforcement and general emergencies",
    icon: "👮",
    color: "border-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    available: "24/7",
  },
  {
    id: "3",
    name: "Hospital / Ambulance",
    phone: "108",
    description: "Medical emergencies and ambulance services",
    icon: "🏥",
    color: "border-green-500",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
    available: "24/7",
  },
  {
    id: "4",
    name: "Fire Department",
    phone: "101",
    description: "Fire emergencies and rescue operations",
    icon: "🔥",
    color: "border-orange-500",
    bgColor: "bg-orange-50",
    textColor: "text-orange-600",
    available: "24/7",
  },
  {
    id: "5",
    name: "Disaster Management",
    phone: "1070",
    description: "Natural disasters and calamities",
    icon: "🌊",
    color: "border-purple-500",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
    available: "24/7",
  },
  {
    id: "6",
    name: "Fisheries Helpline",
    phone: "1800-425-4747",
    description: "Fisheries department assistance",
    icon: "🐟",
    color: "border-cyan-500",
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-600",
    available: "9 AM - 6 PM",
  },
];

const contactTypeStyles: Record<string, { icon: string; color: string; bgColor: string; textColor: string }> = {
  coast_guard: { icon: "🛟", color: "border-red-500", bgColor: "bg-red-50", textColor: "text-red-600" },
  police: { icon: "👮", color: "border-blue-500", bgColor: "bg-blue-50", textColor: "text-blue-600" },
  hospital: { icon: "🏥", color: "border-green-500", bgColor: "bg-green-50", textColor: "text-green-600" },
  fire: { icon: "🔥", color: "border-orange-500", bgColor: "bg-orange-50", textColor: "text-orange-600" },
  disaster: { icon: "🌊", color: "border-purple-500", bgColor: "bg-purple-50", textColor: "text-purple-600" },
  ngo: { icon: "🤝", color: "border-teal-500", bgColor: "bg-teal-50", textColor: "text-teal-600" },
  village: { icon: "📍", color: "border-gray-500", bgColor: "bg-gray-50", textColor: "text-gray-600" },
};

const safetyInstructions = [
  {
    title: "Stay Calm",
    description: "Assess the situation before taking action. Panic can lead to poor decisions.",
    icon: "🧘",
  },
  {
    title: "Call for Help",
    description: "Contact Coast Guard immediately if you're at sea or near the coast.",
    icon: "📞",
  },
  {
    title: "Signal for Help",
    description: "Use whistle, mirror, or phone flashlight to signal for help.",
    icon: "🔦",
  },
  {
    title: "Stay with Your Boat",
    description: "If possible, stay with your boat as it's easier to spot than a person in water.",
    icon: "⛵",
  },
  {
    title: "Wear Life Jacket",
    description: "Always wear a life jacket when going to sea or near deep water.",
    icon: "🦺",
  },
  {
    title: "Share Location",
    description: "Share your GPS location with emergency contacts before departure.",
    icon: "📍",
  },
];

const emergencyTips = [
  "Keep emergency numbers saved in your phone",
  "Always inform someone before going to sea",
  "Check weather forecasts before departure",
  "Carry a first aid kit and basic supplies",
  "Know the nearest hospital and police station",
  "Keep your phone charged and carry a power bank",
];

function mapApiContact(api: ApiEmergencyContact): EmergencyContact {
  const style = contactTypeStyles[api.contact_type] || { icon: "📞", color: "border-gray-500", bgColor: "bg-gray-50", textColor: "text-gray-600" };
  return {
    id: api.id,
    name: api.name,
    phone: api.phone,
    description: api.phone_secondary ? `Secondary: ${api.phone_secondary}` : "",
    icon: style.icon,
    color: style.color,
    bgColor: style.bgColor,
    textColor: style.textColor,
    available: api.is_active ? "24/7" : "Unavailable",
  };
}

export default function EmergencyPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>(fallbackContacts);

  useEffect(() => {
    async function load() {
      const data = await fetchCms<{ results: ApiEmergencyContact[] }>("/maps/emergency/contacts/");
      if (data?.results && data.results.length > 0) {
        setContacts(data.results.filter((c) => c.is_active).map(mapApiContact));
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-ocean-foam">
      <header className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6" />
              <span className="text-xl font-bold">Emergency Services</span>
            </div>
            <Link href="/" className="hover:text-red-200 transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-r from-red-600 to-red-500 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-4">Emergency Contacts</h1>
              <p className="text-lg text-red-100 max-w-2xl mx-auto">
                Quick access to emergency services for coastal communities.
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {contacts.map((contact) => (
              <Card
                key={contact.id}
                className={`border-l-4 ${contact.color} hover:shadow-lg transition-shadow`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`text-4xl ${contact.bgColor} p-3 rounded-xl`}>
                      {contact.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-ocean-navy text-lg">{contact.name}</h3>
                      <p className="text-sm text-ocean-text-secondary mb-2">{contact.description}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-ocean-muted" />
                        <span className="text-sm text-ocean-text-secondary">{contact.available}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={`tel:${contact.phone}`}
                          className={`flex-1 ${contact.bgColor} ${contact.textColor} py-2 px-4 rounded-lg font-semibold text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
                        >
                          <Phone className="h-4 w-4" />
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-ocean-navy mb-6 flex items-center gap-2">
              <Shield className="h-6 w-6 text-ocean-blue" />
              Safety Instructions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safetyInstructions.map((instruction, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-3xl mb-3">{instruction.icon}</div>
                    <h3 className="font-semibold text-ocean-navy mb-2">{instruction.title}</h3>
                    <p className="text-sm text-ocean-text-secondary">{instruction.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-ocean-navy mb-6 flex items-center gap-2">
              <Info className="h-6 w-6 text-ocean-blue" />
              Emergency Tips
            </h2>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emergencyTips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-ocean-green mt-0.5 flex-shrink-0" />
                      <span className="text-ocean-text-secondary">{tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-1">Important Notice</h3>
                <p className="text-sm text-amber-700">
                  In case of emergency, always call the appropriate emergency number first.
                  This platform provides information but is not a substitute for professional
                  emergency services. Stay safe and follow official guidance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
