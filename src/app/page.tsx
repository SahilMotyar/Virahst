import { Canvas } from "@/components/canvas/Canvas";
import { ZoomControls } from "@/components/canvas/ZoomControls";
import { TopNav } from "@/components/nav/TopNav";

export default function Home() {
  return (
    <main className="fixed inset-0 overflow-hidden">
      <Canvas />
      <TopNav />
      <ZoomControls />
    </main>
  );
}
