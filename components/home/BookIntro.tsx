"use client";

import { useEffect, useRef } from "react";
import IlluminatedPlate from "./IlluminatedPlate";
import { drawCoverTooling, drawEbru, drawLeather } from "./ornaments";

/*
 * The homepage opens as a closed, gold-tooled book. The cover swings open, two flyleaves turn,
 * and the camera glides onto the illuminated page until it sits exactly where the hero's plate is.
 *
 * - Plays once per browsing session (sessionStorage), never under reduced motion. ?intro replays it.
 * - Any click, key, scroll, touch or window resize skips straight to the page.
 * - The overlay is in the server HTML so there's no flash; an inline script hides it before paint
 *   for returning visitors, and a CSS failsafe hides it if JavaScript never runs.
 */

const SEEN_KEY = "qalam:intro-seen";

const DECIDE_SCRIPT = `(function(){try{var q=location.search.indexOf('intro')>-1;var s=sessionStorage.getItem('${SEEN_KEY}')==='1';var r=matchMedia('(prefers-reduced-motion: reduce)').matches;document.documentElement.dataset.intro=(r||(s&&!q))?'skip':'on';}catch(e){document.documentElement.dataset.intro='skip';}})();`;

const OPEN = 800, OPEN_D = 1300, EASE_OPEN = "cubic-bezier(.55,.05,.22,1)";
const LEAF_AT = 550, LEAF_GAP = 220, LEAF_D = 850;
const LEAF_END = OPEN + LEAF_AT + LEAF_GAP + LEAF_D;
const CAM = LEAF_END - 150, CAM_D = 1100, TOTAL = CAM + CAM_D;
const INTERRUPTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

export default function BookIntro({ targetId }: { targetId: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const intro = rootRef.current;
    const html = document.documentElement;
    if (!intro) return;
    if (html.dataset.intro !== "on") { intro.remove(); return; }

    const $ = <T extends Element>(sel: string) => intro.querySelector(sel) as T;
    const book = $<HTMLElement>(".bi-book"), stage = $<HTMLElement>(".bi-stage"), cam = $<HTMLElement>(".bi-cam");

    $<SVGSVGElement>(".bi-front svg").replaceChildren();
    $<SVGSVGElement>(".bi-back svg").replaceChildren();
    drawLeather($<SVGSVGElement>(".bi-front svg"), "f");
    drawCoverTooling($<SVGSVGElement>(".bi-front svg"), "f");
    drawLeather($<SVGSVGElement>(".bi-back svg"), "b");
    drawEbru($<HTMLCanvasElement>(".bi-endpaper canvas"));

    const P = Math.round(Math.min(380, innerWidth * 0.42, (innerHeight * 0.62) / 1.3));
    const H = Math.round((P + 7) * 1.3 - 10);
    intro.style.setProperty("--P", P + "px");
    intro.style.setProperty("--H", H + "px");
    intro.style.setProperty("--T", Math.round(P * 0.07) + "px");

    // Lock the rest of the page while the book is open
    const locked = [
      ...Array.from(document.body.children).filter((c) => !c.contains(intro)),
      ...Array.from(intro.parentElement?.children ?? []).filter((c) => c !== intro),
    ] as HTMLElement[];
    locked.forEach((n) => (n.inert = true));

    const anims: Animation[] = [];
    const A = (node: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
      const a = node.animate(frames, { fill: "both", ...opts });
      anims.push(a);
      return a;
    };
    const pose = (tx: number, ty: number, rx: number, ry: number, rz: number, s: number) =>
      `translateX(${tx}px) translateY(${ty}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`;

    A(stage, [{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: "ease-out" });
    // The book lifts from the table to face you, then slides so the open spread is centred
    A(book, [
      { transform: pose(0, 40, 22, -20, 3, 0.9), offset: 0, easing: "cubic-bezier(.3,.6,.25,1)" },
      { transform: pose(0, 0, 0, 0, 0, 1), offset: OPEN / (OPEN + OPEN_D), easing: EASE_OPEN },
      { transform: pose(P / 2, 0, 0, 0, 0, 1), offset: 1 },
    ], { duration: OPEN + OPEN_D, easing: "linear" });
    A($(".bi-ground"), [
      { transform: "translateY(40px) scaleX(.42) scaleY(1.6)", opacity: 0.3 },
      { transform: "translateY(0) scaleX(.5) scaleY(1)", opacity: 1, offset: OPEN / (OPEN + OPEN_D), easing: EASE_OPEN },
      { transform: "translateY(0) scaleX(1) scaleY(1)", opacity: 1 },
    ], { duration: OPEN + OPEN_D });
    A($(".bi-front .bi-sheen"), [{ backgroundPosition: "120% 0" }, { backgroundPosition: "-20% 0" }], { duration: 900, delay: 150, easing: "ease-in-out" });

    // The cover swings open, sinking below the leaves once it has passed upright
    const cover = $(".bi-cover");
    A(cover, [
      { transform: "translateZ(0px) rotateY(0deg)" },
      { transform: "translateZ(-4px) rotateY(-90deg)", offset: 0.5 },
      { transform: "translateZ(-9px) rotateY(-180deg)" },
    ], { duration: OPEN_D, delay: OPEN, easing: EASE_OPEN });
    A($(".bi-front .bi-shade"), [{ opacity: 0 }, { opacity: 0.55, offset: 0.5 }, { opacity: 0.55 }], { duration: OPEN_D, delay: OPEN, easing: EASE_OPEN });
    A($(".bi-back .bi-shade"), [{ opacity: 0.6 }, { opacity: 0.6, offset: 0.5 }, { opacity: 0 }], { duration: OPEN_D, delay: OPEN, easing: EASE_OPEN });
    A($(".bi-cast"), [{ opacity: 0 }, { opacity: 0.85, offset: 0.32 }, { opacity: 0, offset: 0.55 }, { opacity: 0 }], { duration: OPEN_D, delay: OPEN, easing: EASE_OPEN });

    // Two blank flyleaves turn, revealing the illuminated page
    intro.querySelectorAll<HTMLElement>(".bi-leaf").forEach((leaf, i) => {
      const start = OPEN + LEAF_AT + i * LEAF_GAP, z0 = -(2 + i), z1 = -(4 - i);
      const easing = "cubic-bezier(.45,.08,.25,1)";
      A(leaf, [
        { transform: `translateZ(${z0}px) rotateY(0deg)` },
        { transform: `translateZ(${(z0 + z1) / 2}px) rotateY(-90deg)`, offset: 0.5 },
        { transform: `translateZ(${z1}px) rotateY(-180deg)` },
      ], { duration: LEAF_D, delay: start, easing });
      leaf.querySelectorAll(".bi-shade").forEach((s) =>
        A(s, [{ opacity: 0 }, { opacity: 0.32, offset: 0.5 }, { opacity: 0 }], { duration: LEAF_D, delay: start, easing }));
    });
    anims.forEach((a) => a.pause());

    // The camera ends with the book's page scaled and moved onto the hero's plate, wherever it sits now
    anims.forEach((a) => (a.currentTime = LEAF_END));
    const bookRect = $(".bi-page svg").getBoundingClientRect();   // the open book never depends on the site's layout
    const camFrames = (): Keyframe[] => {
      const target = document.getElementById(targetId);
      const hr = target ? target.getBoundingClientRect() : bookRect;
      const s = hr.width / bookRect.width;
      return [
        { transform: "translate(0px,0px) scale(1)" },
        { transform: `translate(${hr.left - s * bookRect.left}px, ${hr.top - s * bookRect.top}px) scale(${s})` },
      ];
    };
    const camAnim = A(cam, camFrames(), { duration: CAM_D, delay: CAM, easing: "cubic-bezier(.65,0,.2,1)" });
    [$(".bi-back"), $(".bi-cedge"), ...Array.from(intro.querySelectorAll(".bi-leaf .bi-face")), $(".bi-paper"), $(".bi-ground"), $(".bi-edge-r"), $(".bi-edge-b")]
      .forEach((n) => A(n, [{ opacity: 1 }, { opacity: 0 }], { duration: 700, delay: CAM + 150, easing: "ease-in" }));
    A(intro, [{ backgroundColor: "rgba(247,241,232,1)" }, { backgroundColor: "rgba(247,241,232,0)" }], { duration: 900, delay: CAM + 300, easing: "ease-in-out" });
    anims.forEach((a) => { a.pause(); a.currentTime = 0; });

    let done = false;
    const timers: number[] = [];
    function finish(fade: boolean) {
      if (done) return;
      done = true;
      INTERRUPTS.forEach((ev) => removeEventListener(ev, interrupt));
      removeEventListener("resize", interrupt);
      timers.forEach(clearTimeout);
      try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
      locked.forEach((n) => (n.inert = false));
      html.dataset.intro = "done";
      const tidy = () => { anims.forEach((a) => a.cancel()); intro?.remove(); };
      if (!fade) return tidy();
      anims.forEach((a) => a.pause());
      intro?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-out", fill: "forwards" });
      timers.push(window.setTimeout(tidy, 240));   // a timer, so a background tab still removes it
    }
    function interrupt() { finish(true); }

    INTERRUPTS.forEach((ev) => addEventListener(ev, interrupt, { passive: true }));
    addEventListener("resize", interrupt);   // the book is centred on the old window size
    intro.classList.add("bi-running");        // cancels the no-JavaScript failsafe

    document.fonts.ready.then(() => {
      if (done) return;
      anims.forEach((a) => { a.currentTime = 0; a.play(); });
      // Re-aim just before the camera moves, in case the hero shifted while the book was opening
      timers.push(window.setTimeout(() => { if (!done) (camAnim.effect as KeyframeEffect).setKeyframes(camFrames()); }, CAM - 20));
      timers.push(window.setTimeout(() => finish(false), TOTAL + 30));
    });

    // Undo without marking the intro as seen (React may mount effects twice in development)
    return () => {
      if (done) return;
      done = true;
      INTERRUPTS.forEach((ev) => removeEventListener(ev, interrupt));
      removeEventListener("resize", interrupt);
      timers.forEach(clearTimeout);
      anims.forEach((a) => a.cancel());
      locked.forEach((n) => (n.inert = false));
    };
  }, [targetId]);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: DECIDE_SCRIPT }} />
      <div ref={rootRef} className="book-intro">
        <div className="bi-cam" aria-hidden="true">
          <div className="bi-stage">
            <div className="bi-ground" />
            <div className="bi-book">
              <div className="bi-edge-r" />
              <div className="bi-edge-b" />
              <div className="bi-page">
                <div className="bi-paper" />
                <IlluminatedPlate uid="book" decorative />
              </div>
              {[0, 1].map((i) => (
                <div key={i} className="bi-leaf" style={{ transform: `translateZ(${-(2 + i)}px)` }}>
                  <div className="bi-face bi-face-front"><div className="bi-shade" /></div>
                  <div className="bi-face bi-face-back"><div className="bi-shade" /></div>
                </div>
              ))}
              <div className="bi-cast" />
              <div className="bi-cover">
                <div className="bi-face bi-front">
                  <svg viewBox="0 0 400 520" preserveAspectRatio="none" />
                  <div className="bi-foil" />
                  <div className="bi-sheen" />
                  <div className="bi-shade" />
                </div>
                <div className="bi-face bi-back">
                  <svg viewBox="0 0 400 520" preserveAspectRatio="none" />
                  <div className="bi-endpaper"><canvas width={360} height={470} /></div>
                  <div className="bi-shade" />
                </div>
                <div className="bi-cedge" />
              </div>
            </div>
          </div>
        </div>
        {/* pressing anything, this included, skips the intro */}
        <button type="button" className="bi-skip">
          Skip intro
        </button>
      </div>
    </>
  );
}
