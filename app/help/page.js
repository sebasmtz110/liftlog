import ConfigBanner from "../components/ConfigBanner";

export default function Help() {
  return (
    <section className="page">
      <ConfigBanner />
      <h1>Help</h1>
      <p className="lede">How a session works.</p>
      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Log a set</h2>
        <p>Open today and start the session. Minus and plus change the weight by 5 lb or the reps by 1. Log set writes the set, then the rest timer runs. Skip rest ends it.</p>
      </section>
      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Photos</h2>
        <p>The profile picture and progress photos stay in this browser. They are not sent to the server.</p>
      </section>
      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Movement</h2>
        <p>The movement screen and the session carry data-muse-slot=&quot;exercise-motion&quot;. If window.ALDER_MOTION_MOUNT is set, it is called with that element. The page emits alder:motion with the exercise, phase, time, and duration.</p>
      </section>
    </section>
  );
}
