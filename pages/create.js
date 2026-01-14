import { useState } from "react";

export default function Create() {
  const [form, setForm] = useState({
    title: "Daytona Plan",
    startDate: "",   // YYYY-MM-DD
    startTime: "",   // HH:MM
    utcOffset: 3,    // +3
    practiceMin: 60,
    qualMin: 15,
    raceHours: 24,
    stintMin: 120,
    drivers: "Ваня,Дима,Егор,Саша",
    stintsPerDriver: 3,
    restHours: 8
  });

  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  function onChange(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setResult(null);

    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    if (!res.ok) {
      setErr(data?.error || "Error");
      return;
    }
    setResult(data);
  }

  return (
    <div style={{ fontFamily: "Arial", padding: 16, maxWidth: 760 }}>
      <h1>Create schedule</h1>
      <p>Вводишь старт эвента в своём UTC, сайт сохранит в UTC и будет показывать каждому по его локали.</p>

      {err && <div style={{ color: "#b00020", marginBottom: 12 }}>{err}</div>}
      {result && (
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12, marginBottom: 12 }}>
          <div><b>Saved!</b></div>
          <div>Share link: <a href={result.url}>{result.url}</a></div>
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label>
          Title:
          <input value={form.title} onChange={e => onChange("title", e.target.value)} style={{ width: "100%" }} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <label>
            Start date:
            <input type="date" value={form.startDate} onChange={e => onChange("startDate", e.target.value)} style={{ width: "100%" }} required />
          </label>
          <label>
            Start time:
            <input type="time" value={form.startTime} onChange={e => onChange("startTime", e.target.value)} style={{ width: "100%" }} required />
          </label>
          <label>
            UTC offset (e.g. 3 for UTC+3):
            <input type="number" value={form.utcOffset} onChange={e => onChange("utcOffset", Number(e.target.value))} style={{ width: "100%" }} />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          <label>Practice (min):
            <input type="number" value={form.practiceMin} onChange={e => onChange("practiceMin", Number(e.target.value))} style={{ width: "100%" }} />
          </label>
          <label>Qual (min):
            <input type="number" value={form.qualMin} onChange={e => onChange("qualMin", Number(e.target.value))} style={{ width: "100%" }} />
          </label>
          <label>Race (hours):
            <input type="number" value={form.raceHours} onChange={e => onChange("raceHours", Number(e.target.value))} style={{ width: "100%" }} />
          </label>
          <label>Stint (min):
            <input type="number" value={form.stintMin} onChange={e => onChange("stintMin", Number(e.target.value))} style={{ width: "100%" }} />
          </label>
        </div>

        <label>
          Drivers (comma separated):
          <input value={form.drivers} onChange={e => onChange("drivers", e.target.value)} style={{ width: "100%" }} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label>Stints per driver:
            <input type="number" value={form.stintsPerDriver} onChange={e => onChange("stintsPerDriver", Number(e.target.value))} style={{ width: "100%" }} />
          </label>
          <label>Required continuous rest (hours):
            <input type="number" value={form.restHours} onChange={e => onChange("restHours", Number(e.target.value))} style={{ width: "100%" }} />
          </label>
        </div>

        <button type="submit" style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd", cursor: "pointer" }}>
          Generate & Save
        </button>
      </form>
    </div>
  );
}
