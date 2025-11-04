import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="flex justify-center mb-4">
        <Image src="/logo-djamiaya.png" alt="Logo" width={240} height={120} />
      </div>
      <h1 className="text-2xl font-semibold">Bienvenue au Système de Pointage DJAMIAYA</h1>
      <a
        href="/dashboard"
        className="mt-4 px-6 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
      >
        Aller au tableau de bord
      </a>
    </main>
  );
}
