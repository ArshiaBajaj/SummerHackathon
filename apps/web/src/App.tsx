import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Landing } from "@/pages/Landing";
import { Calibrate } from "@/pages/Calibrate";
import { Live } from "@/pages/Live";
import { Analytics } from "@/pages/Analytics";
import { ScoutProfile } from "@/pages/ScoutProfile";
import { FilmRoom } from "@/pages/FilmRoom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="film" element={<FilmRoom />} />
          <Route path="calibrate" element={<Calibrate />} />
          <Route path="live" element={<Live />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<ScoutProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
