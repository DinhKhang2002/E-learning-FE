"use client";

import { useEffect, useState } from "react";
import StudentHomePage from "./studentHomePage";
import TeacherHomePage from "./teacherHomePage";
import UnloginHomePage from "./unloginHomePage";

type RoleState = "loading" | "STUDENT" | "TEACHER" | "GUEST";

export default function HomePageRoute() {
  const [role, setRole] = useState<RoleState>("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem("user");
    if (!stored) {
      setRole("GUEST");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      const userRole = typeof parsed?.role === "string" ? parsed.role.toUpperCase() : null;
      if (userRole === "TEACHER") {
        setRole("TEACHER");
      } else if (userRole === "STUDENT") {
        setRole("STUDENT");
      } else {
        setRole("GUEST");
      }
    } catch (error) {
      console.warn("Failed to parse stored user", error);
      setRole("GUEST");
    }
  }, []);
  console.log(role);
  if (role === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
      </div>
    );
  }

  if (role === "TEACHER") {
    return <TeacherHomePage />;
  }

  if (role === "STUDENT") {
    return <StudentHomePage />;
  }

  return <UnloginHomePage />;
}

