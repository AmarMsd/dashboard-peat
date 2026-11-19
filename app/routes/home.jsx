import { DashboardFrame } from "../components/DashboardFrame.jsx";
import { MainMenu } from "../components/MainMenu.jsx";

export function meta() {
  return [
    { title: "PeatGuard - Pemantauan Lahan Gambut" },
    { name: "description", content: "Dashboard untuk memantau kondisi lahan gambut." },
  ];
}

export default function Home() {
  return (
    <DashboardFrame active="Dashboard">
      <MainMenu />
    </DashboardFrame>
  );
}
