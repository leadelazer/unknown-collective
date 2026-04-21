import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import TextureBackdrop from '../components/TextureBackdrop.jsx';
import DecoRule from '../components/DecoRule.jsx';
import DecoCorner from '../components/DecoCorner.jsx';
import styles from './About.module.css';

const SECTIONS = [
  {
    label: 'Premise',
    heading: 'A World Rehearsed with Machines',
    body: [
      'The Unknown Collective is an ongoing experiment in world-building with AI. Its characters, texts, images, and moving-image fragments arrive through generative processes and accumulate, over time, into a shared fictional universe — a city, a cast, and a symbolic logic that keep revising themselves.',
      'It is not presented as art in any demanding sense of the word. It behaves more like a rehearsal room left running: a structure in which figures keep re-entering, slightly changed, and a way of finding out what still holds once you stop holding it in place.',
    ],
  },
  {
    label: 'Frame',
    heading: 'Borrowed from the Theatre',
    body: [
      'The useful reference here is the rehearsal, not the studio. Curation, selection, and staging have been recognised as authorship at least since Duchamp, and the regietheater tradition has, for a century, treated arrangement — of bodies, texts, and time — as the primary creative act. Measured against those histories, what happens here is modest: closer to play than to production.',
      'That modesty is part of the interest. The question is not whether a rehearsal of this kind can rival a staged work, but what kind of world-texture emerges when the ensemble is synthetic and the rehearsal never quite ends.',
    ],
  },
  {
    label: 'Tension',
    heading: 'On the Seam Between Human and Machine',
    body: [
      'The more interesting surface is the seam itself. The systems produce more than is asked; intention slips. A prompt aimed at one character returns a different one entirely, and that stranger is sometimes closer to the truth of the world than the figure originally in mind.',
      'The friction is treated as material rather than error. Nothing here needs to resolve the question of where authorship sits — with the systems, with the person arranging them, with neither, with both. The ambiguity is allowed to stay in the frame, in the way a rehearsal keeps contradictions visible for as long as possible.',
    ],
  },
  {
    label: 'Darlings',
    heading: 'Keeping the Darlings',
    body: [
      'Writing and theatre both teach you to kill your darlings. In this piece, the instinct runs the other way. Darlings are rarely killed; they are kept, shelved, re-staged, allowed to mutate. A discarded line returns as a botanical note. A rejected portrait becomes an echo inside someone else\'s biography.',
      'What passes as editing here is closer to blocking: moving figures around until the composition reads. Choices are made by what clicks — a brief alignment of tone, image, and timing that feels, in the moment, less like a decision than like recognition.',
    ],
  },
  {
    label: 'Status',
    heading: 'Ongoing, Not Finished',
    body: [
      'The Collective is open-ended by design. The longer intention is to hand more of the staging to autonomous agents and let the piece continue running — rehearsing itself, remembering its own darlings, drifting further from any single guiding hand.',
      'No grand claim is attached to this. It is a small world kept in motion, assembled in public, and offered in the same spirit as a rehearsal you happen to walk in on: unfinished on purpose, and worth watching for that reason.',
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
        <p className={`${styles.subtitle} t-body`}>
          A rehearsal with machines, kept in motion on purpose.
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
        <p className={`${styles.signed} t-deco`}> –  Catalogue Entry, Ongoing  – </p>
      </section>

      <Footer />
    </div>
  );
}
