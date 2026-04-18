import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Collective from './pages/Collective.jsx';
import Character from './pages/Character.jsx';
import Tiers from './pages/Tiers.jsx';
import Manifesto from './pages/Manifesto.jsx';
import Chronicle from './pages/Chronicle.jsx';
import Nexus from './pages/Nexus.jsx';
import About from './pages/About.jsx';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/"                  element={<Home />} />
        <Route path="/collective"        element={<Collective />} />
        <Route path="/nexus"             element={<Nexus />} />
        <Route path="/character/:slug"   element={<Character />} />
        <Route path="/tiers"             element={<Tiers />} />
        <Route path="/manifesto"         element={<Manifesto />} />
        <Route path="/chronicle"         element={<Chronicle />} />
        <Route path="/about"             element={<About />} />
      </Routes>
    </HashRouter>
  );
}
