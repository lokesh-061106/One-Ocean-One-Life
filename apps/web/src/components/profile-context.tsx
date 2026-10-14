"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  occupation: string;
  organization: string;
  contributorType: string;
  bio: string;
  village: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  languages: string;
  skills: string;
}

interface ProfileContextType {
  profile: UserProfile;
  updateProfile: (data: Partial<UserProfile>) => void;
  isComplete: boolean;
}

const PROFILE_KEY = "o3l_profile";

const defaultProfile: UserProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  occupation: "",
  organization: "",
  contributorType: "",
  bio: "",
  village: "",
  address: "",
  city: "",
  state: "Tamil Nadu",
  pincode: "",
  languages: "",
  skills: "",
};

function loadProfile(): UserProfile {
  if (typeof window === "undefined") return defaultProfile;
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) return { ...defaultProfile, ...JSON.parse(stored) };
  } catch {}
  return defaultProfile;
}

function saveProfile(profile: UserProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(loadProfile);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...data }));
  }, []);

  const isComplete = Boolean(
    profile.firstName && profile.lastName && profile.phone && profile.address && profile.city && profile.pincode
  );

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, isComplete }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
