"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router= useRouter()


  useEffect(() => {
    setTimeout(() => {
      router.push("/admin");
    }, 1000);


  }, []);

  return (
    <div className="h-screen w-full  flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-foreground"></div>
    </div>
  );
}
