import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Collective from './pages/Collective.jsx';
import Character from './pages/Character.jsx';
import Tiers from './pages/Tiers.jsx';
import Manifesto from './pages/Manifesto.jsx';
import Chronicle from './pages/Chronicle.jsx';
import Encounters from './pages/Encounters.jsx';
import Encounter from './pages/Encounter.jsx';
import About from './pages/About.jsx';
import Timeline from './pages/Timeline.jsx';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/"                    element={<Home />} />
        <Route path="/collective"          element={<Collective />} />
        <Route path="/character/:slug"     element={<Character />} />
        <Route path="/tiers"               element={<Tiers />} />
        <Route path="/manifesto"           element={<Manifesto />} />
        <Route path="/chronicle"           element={<Chronicle />} />
        <Route path="/timeline"            element={<Timeline />} />
        <Route path="/encounters"          element={<Encounters />} />
        <Route path="/encounter/:id"       element={<Encounter />} />
        <Route path="/about"               element={<About />} />
      </Routes>
    </HashRouter>
  );
}
