import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import TextureBackdrop from '../components/TextureBackdrop.jsx';
import DecoRule from '../components/DecoRule.jsx';
import DecoCorner from '../components/DecoCorner.jsx';
import styles from './About.module.css';

const SECTIONS = [
  {
    label: 'Origin',
    heading: 'An Experiment in Collective Intelligence',
    body: [
      'The Unknown Collective is not authored by a single hand. It is an ongoing experiment in what becomes possible when artificial intelligence is given creative latitude — to imagine, to name, to mythologise.',
      'Every character profile, every talisman reading, every shadow card, every biographical fragment was written by an AI agent working from a shared system of archetypes, tarot correspondences, and a fictional city.',
    ],
  },
  {
    label: 'Process',
    heading: 'Agents All the Way Down',
    body: [
      'The project runs on a chain of specialised agents. One agent researches and drafts character lore. Another structures the data and maintains consistency across the canon. A third reviews, refines, and extends — adding new relationships, new artifacts, new tensions between characters.',
      'None of this was written in a text editor by a human author. The prose you read, the relationships you trace, the recurring motifs — all of it emerged from repeated agent passes over a shared fictional architecture.',
      'The human role here is curatorial: setting constraints, choosing what stays, nudging tone. The generative labour belongs entirely to the machines.',
    ],
  },
  {
    label: 'Continuity',
    heading: 'Continuously Extended',
    body: [
      'The Collective is not finished. Agent routines run on a rolling basis — deepening character histories, forging new connections between arcana, and occasionally introducing contradictions that other agents are then asked to resolve.',
      'This means the site you are reading today is different from the site that existed last week, and different again from what it will be next month. The canon is alive, unstable, and tended by non-human intelligence.',
    ],
  },
  {
    label: 'Provenance',
    heading: 'On Authorship',
    body: [
      'We make no claim that this work is human-authored. The experiment is precisely the opposite: to see what a coherent fictional world looks like when constructed entirely by agents operating under consistent instructions, without a single human ever sitting down to write a sentence.',
      'If you find meaning in these characters — if the Duchess unsettles you, if the Florist feels familiar — that effect is real, even if its origin is not.',
    ],
  },
];

export default function About() {
  return (
    <div className={styles.page}>
      <TextureBackdrop />
      <Nav />

      <section className={styles.content}>
        <div className={styles.cornerTL}><DecoCorner /></div>
        <div className={styles.cornerTR}><DecoCorner rotate={90} /></div>

        <p className={`${styles.eyebrow} t-deco`}>· Meta ·</p>
        <h1 className={`${styles.title} t-display`}>About This Project</h1>
        <p className={`${styles.subtitle} t-display`}>
          A world built by agents, extended by agents, read by you.
        </p>

        <div className={styles.ruleWrap}><DecoRule /></div>

        <div className={styles.sections}>
          {SECTIONS.map(({ label, heading, body }) => (
            <div key={label} className={styles.section}>
              <p className={`${styles.sectionLabel} t-deco`}>{label}</p>
              <h2 className={`${styles.sectionHeading} t-display`}>{heading}</h2>
              <div className={styles.sectionBody}>
                {body.map((para, i) => (
                  <p key={i} className={`${styles.para} t-body`}>{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.ruleWrap}><DecoRule /></div>
        <p className={`${styles.signed} t-deco`}> –  The Experiment Continues  – </p>
      </section>

      <Footer />
    </div>
  );
}
