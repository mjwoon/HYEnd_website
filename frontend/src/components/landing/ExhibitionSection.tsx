import { useState, type CSSProperties } from "react";

const NEON = "#39ff6a";

type ExhibitionItem = {
  id: number;
  tag: string;
  title: string;
  date: string;
  desc: string;
  image: string;
};

const exhibitionItems: ExhibitionItem[] = [
  {
    id: 1,
    tag: "졸업생 초청 강연",
    title: "배달의민족 ML 프로덕트 PM",
    date: "2024.10.4(금) 16:30",
    desc: "ICT융합학부 10학번 졸업생 김태형",
    image: "/images/exhibition/graduation-pm.png",
  },
  {
    id: 2,
    tag: "세미나",
    title: "세미나",
    date: "2024",
    desc: "HY-END 전공 학회 세미나 현장",
    image: "/images/exhibition/seminar.png",
  },
  {
    id: 3,
    tag: "개강 총회",
    title: "개강 총회",
    date: "2024",
    desc: "HY-END 전공 학회 개강 총회",
    image: "/images/exhibition/opening.png",
  },
  {
    id: 4,
    tag: "졸업생 초청 강연",
    title: "배달의민족 ML 프로덕트 PM",
    date: "2024.10.4(금) 16:30",
    desc: "ICT융합학부 10학번 졸업생 김태형",
    image: "/images/exhibition/graduation-pm.png",
  },
  {
    id: 5,
    tag: "졸업생 초청 강연",
    title: "배달의민족 ML 프로덕트 PM",
    date: "2024.10.4(금) 16:30",
    desc: "ICT융합학부 10학번 졸업생 김태형",
    image: "/images/exhibition/graduation-pm.png",
  },
];

function ExhibitionCard({ item }: { item: ExhibitionItem }) {
  return (
    <article style={styles.card}>
      <span style={styles.cardTag}>{item.tag}</span>

      <div style={styles.imageBox}>
        <img
          src={item.image}
          alt={item.title}
          style={styles.image}
          onError={(event) => {
            event.currentTarget.style.opacity = "0";
          }}
        />
        <div style={styles.imageFallback} />
      </div>

      <div style={styles.cardInfo}>
        <p style={styles.date}>{item.date}</p>
        <p style={styles.title}>{item.title}</p>
        <p style={styles.desc}>{item.desc}</p>
      </div>
    </article>
  );
}

export default function ExhibitionSection() {
  const [active, setActive] = useState(2);
  const count = exhibitionItems.length;
  const visible = Array.from({ length: 5 }, (_, i) => (active - 2 + i + count) % count);

  return (
    <section style={styles.section}>

      <h2 style={styles.heading}>
        <span>HY-END</span>
        <span>Exhibition Space</span>
      </h2>

      <div style={styles.carouselWrap}>
        {visible.map((itemIdx, pos) => {
          const item = exhibitionItems[itemIdx];
          if (!item) return null;

          const offset = pos - 2;
          const isCenter = offset === 0;
          const translateX = offset * 286;

          return (
            <div
              key={`${item.id}-${pos}`}
              onClick={() => !isCenter && setActive(itemIdx)}
              style={{
                ...styles.cardSlot,
                transform: `translateX(${translateX}px)`,
                zIndex: 10 - Math.abs(offset),
                opacity: Math.abs(offset) === 2 ? 0.96 : 1,
                cursor: isCenter ? "default" : "pointer",
              }}
            >
              <ExhibitionCard item={item} />
            </div>
          );
        })}
      </div>

      <div style={styles.dots}>
        {exhibitionItems.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`exhibition ${i + 1}`}
            onClick={() => setActive(i)}
            style={{ ...styles.dot, ...(i === active ? styles.dotOn : {}) }}
          />
        ))}
      </div>
    </section>
  );
}

const styles = {
  section: {
    position: "relative",
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: "88px 0 58px",
    fontFamily: "'Apple SD Gothic Neo', 'Pretendard', sans-serif",
  },
  heading: {
    width: "100%",
    maxWidth: 980,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "center",
    margin: "-20px 0 28px",
    color: NEON,
    fontSize: 64,
    fontWeight: "400",
    lineHeight: 1.14,
    letterSpacing: "-0.04em",
    textShadow: "0 0 12px rgba(57,255,106,0.85), 0 0 28px rgba(57,255,106,0.45)",
    zIndex: 2,
  },
  carouselWrap: {
    position: "relative",
    width: "100%",
    maxWidth: 1120,
    height: 360,
    zIndex: 2,
  },
  cardSlot: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -130,
    transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
  },
  card: {
    width: 260,
    height: 350,
    borderRadius: 6,
    background: "rgba(255,255,255,0.115)",
    border: "1px solid rgba(255,255,255,0.22)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    padding: 14,
    boxShadow: "0 12px 30px rgba(0,0,0,0.42)",
    backdropFilter: "blur(2px)",
  },
  cardTag: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    background: "rgba(255,255,255,0.15)",
    borderRadius: 5,
    padding: "7px 12px",
    marginBottom: 8,
  },
  imageBox: {
    position: "relative",
    width: "100%",
    flex: 1,
    borderRadius: 4,
    overflow: "hidden",
    background: "rgba(0,0,0,0.28)",
  },
  image: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    backgroundColor: "rgba(0,0,0,0.18)",
    zIndex: 2,
  },
  imageFallback: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at 45% 40%, rgba(57,255,106,0.28), transparent 44%), linear-gradient(135deg, #1d2a1d 0%, #111 100%)",
    zIndex: 1,
  },
  cardInfo: {
    paddingTop: 9,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  date: {
    fontSize: 10,
    color: "rgba(255,255,255,0.52)",
    margin: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    margin: 0,
    lineHeight: 1.34,
  },
  desc: {
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    margin: 0,
    lineHeight: 1.35,
  },
  dots: {
    display: "flex",
    gap: 9,
    marginTop: 18,
    zIndex: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.34)",
    cursor: "pointer",
    padding: 0,
    transition: "background 0.25s, border 0.25s",
  },
  dotOn: {
    background: NEON,
    border: "1px solid rgba(57,255,106,0.8)",
  },
} satisfies Record<string, CSSProperties>;
