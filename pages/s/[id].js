export async function getServerSideProps(ctx) {
  const { id } = ctx.params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const res = await fetch(`${url}/rest/v1/schedules?public_id=eq.${id}&select=*`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });

  const schedules = await res.json();
  if (!schedules?.length) return { notFound: true };

  const schedule = schedules[0];

  const resRows = await fetch(`${url}/rest/v1/schedule_rows?schedule_id=eq.${schedule.id}&select=*&order=idx.asc`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  const rows = await resRows.json();

  return { props: { schedule, rows } };
}

function fmtLocal(iso) {
  const d = new Date(iso);
  return d.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
}

export default function View({ schedule, rows }) {
  return (
    <div style={{ fontFamily: "Arial", padding: 16 }}>
      <h1>{schedule.title || "Schedule"}</h1>
      <p>Shown in your local time.</p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Start</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>End</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Driver</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Spotter</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Rest</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Phase</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{fmtLocal(r.start_utc)}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{fmtLocal(r.end_utc)}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.driver || ""}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.spotter || ""}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{(r.rest || []).join(", ")}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.phase}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
