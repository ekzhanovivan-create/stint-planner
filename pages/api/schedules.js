import { supabase } from "../../lib/supabase";

function toUTCISO(dateStr, timeStr, offsetHours) {
  // input: local time at provided offset, convert to UTC ISO string
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);

  // build "local" time at that offset, then subtract offset to get UTC
  const utcMs = Date.UTC(y, m - 1, d, hh - offsetHours, mm, 0, 0);
  return new Date(utcMs).toISOString();
}

function addMinutes(iso, minutes) {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
}

function slug() {
  return Math.random().toString(36).slice(2, 8);
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

    const {
      title, startDate, startTime, utcOffset,
      practiceMin, qualMin, raceHours, stintMin,
      drivers, stintsPerDriver, restHours
    } = req.body;

    const driverList = String(drivers || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    if (!startDate || !startTime) return res.status(400).json({ error: "Start date/time required" });
    if (driverList.length < 2) return res.status(400).json({ error: "Need at least 2 drivers" });

    const eventStartUTC = toUTCISO(startDate, startTime, Number(utcOffset || 0));
    const practiceEnd = addMinutes(eventStartUTC, Number(practiceMin || 0));
    const qualEnd = addMinutes(practiceEnd, Number(qualMin || 0));
    const raceStart = qualEnd;

    const raceMinutes = Number(raceHours || 0) * 60;
    const raceEnd = addMinutes(raceStart, raceMinutes);

    const public_id = slug();

    const { data: sched, error: e1 } = await supabase
      .from("schedules")
      .insert([{
        public_id,
        title: title || "Schedule",
        event_start_utc: eventStartUTC,
        practice_minutes: Number(practiceMin || 0),
        qualifying_minutes: Number(qualMin || 0),
        race_minutes: raceMinutes,
        stint_minutes: Number(stintMin || 0),
        drivers: driverList,
        stints_per_driver: Number(stintsPerDriver || 0),
        required_rest_hours: Number(restHours || 0)
      }])
      .select()
      .single();

    if (e1) return res.status(500).json({ error: e1.message });

    // build rows: practice + qualifying as 1 row each, race split into stints
    const rows = [];

    if (Number(practiceMin || 0) > 0) {
      rows.push({
        schedule_id: sched.id,
        idx: rows.length,
        phase: "practice",
        start_utc: eventStartUTC,
        end_utc: practiceEnd,
        driver: null,
        spotter: null,
        rest: driverList
      });
    }

    if (Number(qualMin || 0) > 0) {
      rows.push({
        schedule_id: sched.id,
        idx: rows.length,
        phase: "qualifying",
        start_utc: practiceEnd,
        end_utc: qualEnd,
        driver: null,
        spotter: null,
        rest: driverList
      });
    }

    // race stints round-robin
    const stintMinutes = Number(stintMin || 0);
    const stintCount = Math.ceil(raceMinutes / stintMinutes);

    let cursor = raceStart;

    for (let i = 0; i < stintCount; i++) {
      const start = cursor;
      const end = addMinutes(start, stintMinutes);

      const driver = driverList[i % driverList.length];
      const spotter = driverList[(i + 1) % driverList.length];
      const rest = driverList.filter(n => n !== driver && n !== spotter);

      rows.push({
        schedule_id: sched.id,
        idx: rows.length,
        phase: "race",
        start_utc: start,
        end_utc: end,
        driver,
        spotter,
        rest
      });

      cursor = end;
    }

    const { error: e2 } = await supabase.from("schedule_rows").insert(rows);
    if (e2) return res.status(500).json({ error: e2.message });

    return res.status(200).json({ public_id, url: `/s/${public_id}` });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Unknown error" });
  }
}

