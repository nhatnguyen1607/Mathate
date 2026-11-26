import React, { useEffect, useRef, useState } from "react";
import { Pause, Play, Sparkles, Star } from "lucide-react";
import "../hero-mimo.css";

import { useCompanion } from "../context/AppearanceContext";
import { poseNames } from "../../shared/personalization.js";
const ROTATION_MS = 8000;
export default function HeroMimo() {
  const { character } = useCompanion();
  return <CompanionGallery key={character.id} />;
}
function CompanionGallery() {
  const { asset, copy } = useCompanion();
  const mimoPoses = poseNames.map((id) => ({ id, src: asset(id) }));
  const scene = useRef(null);
  const [current, setCurrent] = useState(0),
    [available, setAvailable] = useState([0]),
    [paused, setPaused] = useState(false),
    [visible, setVisible] = useState(true),
    [pageVisible, setPageVisible] = useState(!document.hidden),
    [reduced, setReduced] = useState(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(scene.current);
    return () => {
      media.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", visibility);
      observer.disconnect();
    };
  }, []);
  const stopped = paused || reduced || !visible || !pageVisible;
  useEffect(() => {
    if (stopped || available.length < 2) return;
    const timer = setInterval(
      () =>
        setCurrent(
          (value) =>
            available[(available.indexOf(value) + 1) % available.length],
        ),
      ROTATION_MS,
    );
    return () => clearInterval(timer);
  }, [stopped, available]);
  function failed(index) {
    setAvailable((old) => old.filter((value) => value !== index));
    setCurrent((old) => (old === index ? 0 : old));
  }
  return (
    <div
      ref={scene}
      className={"mascot-scene mimo-gallery " + (stopped ? "is-paused" : "")}
    >
      <div aria-hidden="true">
        <span className="orbit-symbol plus">+</span>
        <span className="orbit-symbol multiply">×</span>
        <span className="orbit-symbol divide">÷</span>
        <span className="scene-spark one">
          <Sparkles />
        </span>
        <span className="scene-spark two">
          <Star />
        </span>
        <div className="mascot-ground" />
        <div className="mimo-hover-shadow" />
      </div>
      <div className="mimo-float" aria-hidden="true">
        {mimoPoses.map((pose, index) => (
          <img
            key={pose.id}
            src={pose.src}
            alt=""
            width={1024}
            height={1024}
            decoding="async"
            fetchpriority={index === 0 ? "high" : "low"}
            className={"mimo-pose " + (index === current ? "is-current" : "")}
            data-pose={pose.id}
            onLoad={() =>
              setAvailable((old) =>
                old.includes(index)
                  ? old
                  : [...old, index].sort((a, b) => a - b),
              )
            }
            onError={() => failed(index)}
          />
        ))}
      </div>
      {!reduced && (
        <button
          type="button"
          className="mimo-motion-toggle"
          aria-label={
            paused
              ? copy("Tiếp tục chuyển động Mimo")
              : copy("Tạm dừng chuyển động Mimo")
          }
          aria-pressed={paused}
          title={
            paused
              ? copy("Tiếp tục chuyển động Mimo")
              : copy("Tạm dừng chuyển động Mimo")
          }
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? <Play size={15} /> : <Pause size={15} />}
        </button>
      )}
    </div>
  );
}
