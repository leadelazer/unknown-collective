import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHARACTERS } from '../data/characters.js';
import { TIERS } from '../data/tiers.js';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import TextureBackdrop from '../components/TextureBackdrop.jsx';
import styles from './Nexus.module.css';

export default function Nexus() {
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [filterTier, setFilterTier] = useState('all');
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const { nodes, links } = useMemo(() => {
    const nodes = CHARACTERS.map((c, i) => {
      const angle = (i / CHARACTERS.length) * 2 * Math.PI;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.35;
      return {
        ...c,
        x: dimensions.width / 2 + Math.cos(angle) * radius,
        y: dimensions.height / 2 + Math.sin(angle) * radius,
      };
    });

    const links = [];
    CHARACTERS.forEach(c => {
      if (c.relations) {
        c.relations.forEach(relSlug => {
          const target = nodes.find(n => n.slug === relSlug);
          if (target) {
            links.push({ source: c.slug, target: relSlug });
          }
        });
      }
    });

    return { nodes, links };
  }, [dimensions]);

  const activeLinks = useMemo(() => {
    if (!hoveredNode) return [];
    return links.filter(l => l.source === hoveredNode || l.target === hoveredNode);
  }, [links, hoveredNode]);

  const activeNodeSlugs = useMemo(() => {
    if (!hoveredNode) return [];
    const connected = activeLinks.map(l => l.source === hoveredNode ? l.target : l.source);
    return [hoveredNode, ...connected];
  }, [activeLinks, hoveredNode]);

  return (
    <div className={styles.page}>
      <TextureBackdrop />
      <Nav />

      <section className={styles.header}>
        <p className={`${styles.eyebrow} t-deco`}>The Web of Woven Fates</p>
        <h1 className={`${styles.title} t-display`}>
          The <span className={styles.titleAccent}>Nexus</span>
        </h1>
        <p className={`${styles.intro} t-body`}>
          The Collective is not a list, but a constellation. Observe how their stories entwine across the centuries.
        </p>

        <div className={styles.filterBar}>
          <span className={`${styles.filterLabel} t-deco`}>Tier</span>
          {[['all', 'All'], ...Object.entries(TIERS).map(([k, t]) => [k, t.name])].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilterTier(k)}
              className={`${styles.filterBtn} t-deco ${filterTier === k ? styles.filterActive : ''}`}
            >
              {l}
            </button>
          ))}
        </div>
      </section>

      <div className={styles.nexusContainer} ref={containerRef}>
        <svg className={styles.svg} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Links */}
          <g className={styles.links}>
            {links.map((link, i) => {
              const sourceNode = nodes.find(n => n.slug === link.source);
              const targetNode = nodes.find(n => n.slug === link.target);

              const isActive = hoveredNode && (link.source === hoveredNode || link.target === hoveredNode);

              let isDimmed = false;
              if (hoveredNode) {
                isDimmed = !isActive;
              } else if (filterTier !== 'all') {
                isDimmed = sourceNode.tier !== filterTier || targetNode.tier !== filterTier;
              }

              return (
                <line
                  key={`${link.source}-${link.target}-${i}`}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  className={`${styles.link} ${isActive ? styles.linkActive : ''} ${isDimmed ? styles.linkDimmed : ''}`}
                  style={{ '--hue': sourceNode.hue }}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g className={styles.nodes}>
            {nodes.map(node => {
              const isActive = hoveredNode === node.slug;
              const isConnected = activeNodeSlugs.includes(node.slug);

              let isDimmed = false;
              if (hoveredNode) {
                isDimmed = !isConnected;
              } else if (filterTier !== 'all') {
                isDimmed = node.tier !== filterTier;
              }

              return (
                <g
                  key={node.slug}
                  className={`${styles.nodeGroup} ${isActive ? styles.nodeActive : ''} ${isDimmed ? styles.nodeDimmed : ''}`}
                  onMouseEnter={() => setHoveredNode(node.slug)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => navigate(`/character/${node.slug}`)}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isActive ? 12 : 6}
                    fill={node.hue}
                    className={styles.node}
                  />
                  <text
                    x={node.x}
                    y={node.y - (isActive ? 25 : 15)}
                    textAnchor="middle"
                    className={`${styles.nodeLabel} t-deco`}
                    style={{ fill: node.hue }}
                  >
                    {node.role.toUpperCase()}
                  </text>
                  {isActive && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={20}
                      fill="none"
                      stroke={node.hue}
                      strokeWidth="1"
                      className={styles.nodePulse}
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {hoveredNode && (
          <div className={styles.detailsPane}>
            {(() => {
              const c = CHARACTERS.find(x => x.slug === hoveredNode);
              return (
                <>
                  <p className={`${styles.detailArcana} t-deco`}>{c.arcana}</p>
                  <h2 className={`${styles.detailRole} t-display`}>{c.role}</h2>
                  <p className={`${styles.detailEssence} t-body`}>{c.essence}</p>
                  {c.relations?.length > 0 && (
                    <div className={styles.detailRelations}>
                      <p className="t-deco" style={{ fontSize: '10px', color: 'var(--color-gold)', marginBottom: '8px' }}>CONNECTED TO</p>
                      <div className={styles.relList}>
                        {c.relations.map(rel => {
                          const rc = CHARACTERS.find(x => x.slug === rel);
                          return (
                            <span key={rel} className={styles.relTag} style={{ borderColor: rc?.hue }}>
                              {rc?.role}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
