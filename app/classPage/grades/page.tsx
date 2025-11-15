"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScoreManagementPage from "@/app/teacherClassManagement/ScoreManagementPage";

export default function GradesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  if (!classId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <p className="text-slate-600 font-medium">
              Không tìm thấy ID lớp học
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return <ScoreManagementPage classId={classId} />;
}

