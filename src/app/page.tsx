import { Canvas } from "@/components/canvas/Canvas";
import { ZoomControls } from "@/components/canvas/ZoomControls";
import { ItemPopover } from "@/components/item/ItemPopover";

export default function Home() {
  return (
    <main className="fixed inset-0 overflow-hidden">
      <Canvas />
      <ZoomControls />
      <ItemPopover />
    </main>
  );
}
