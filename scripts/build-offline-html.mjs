import fs from "node:fs";
import path from "node:path";

const lots = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/seed-lots.json"), "utf8"));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>BidLedger — Combined Bid Sheet</title>
  <meta name="theme-color" content="#1c1917" />
  <style>
    :root {
      --bg: #f4efe4;
      --ink: #1c1917;
      --paper: #fbf8f1;
      --line: #e7e0d4;
      --copper: #9a5a24;
      --copper-2: #b87333;
      --muted: #78716c;
      --good: #0f766e;
      --bad: #be123c;
      --warn: #b45309;
      --card: #ffffff;
      --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      --display: "Iowan Old Style", Palatino, Georgia, "Times New Roman", serif;
      --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; background: var(--bg); color: var(--ink); font-family: var(--sans); }
    a { color: var(--copper); text-decoration: none; }
    a:hover { text-decoration: underline; }
    button, input, select { font: inherit; }
    .tabular { font-variant-numeric: tabular-nums; font-family: var(--mono); }
    .app { display: none; min-height: 100vh; }
    .app.on { display: grid; grid-template-columns: 220px 1fr; }
    .side {
      background: #14110e; color: #fbf8f1; padding: 22px 16px; position: sticky; top: 0; height: 100vh;
    }
    .brand { font-family: var(--display); font-size: 26px; margin: 0; }
    .brand span { display: block; font-family: var(--sans); font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: #d4a066; margin-top: 6px; }
    .nav { margin-top: 28px; display: grid; gap: 4px; }
    .nav a {
      color: #d6d3d1; text-decoration: none; padding: 8px 10px; border-radius: 2px; font-size: 13px; font-weight: 600;
    }
    .nav a.active, .nav a:hover { background: #292524; color: #fff; text-decoration: none; }
    .main { padding: 22px 24px 48px; min-width: 0; }
    .top {
      display: flex; justify-content: space-between; gap: 12px; align-items: flex-end; margin-bottom: 18px; flex-wrap: wrap;
    }
    h1 { font-family: var(--display); font-size: 28px; margin: 0; font-weight: 600; }
    .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--copper); margin: 0 0 4px; }
    .kpis { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; }
    .card {
      background: var(--card); border: 1px solid #e7e5e4; box-shadow: 0 1px 2px rgba(28,25,23,.06), 0 8px 24px rgba(28,25,23,.04);
      border-radius: 2px; padding: 14px 16px; position: relative; overflow: hidden;
    }
    .card:before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #a8a29e; }
    .card.good:before { background: var(--good); }
    .card.bad:before { background: var(--bad); }
    .card.info:before { background: #0284c7; }
    .card.warn:before { background: var(--warn); }
    .card .l { font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #78716c; }
    .card .v { margin-top: 8px; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .panel { background: var(--card); border: 1px solid #e7e5e4; border-radius: 2px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #78716c; padding: 10px 12px; background: #faf8f3; border-bottom: 1px solid var(--line); white-space: nowrap; }
    td { padding: 9px 12px; border-bottom: 1px solid #f3efe6; vertical-align: top; }
    tr:hover td { background: #fbf7ef; }
    .right { text-align: right; }
    .pill { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 2px; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
    .pill.ok { background: #ccfbf1; color: #0f766e; }
    .pill.pend { background: #ffedd5; color: #9a3412; }
    .pill.short { background: #ffe4e6; color: #9f1239; }
    .pill.ex { background: #e0f2fe; color: #075985; }
    .search { height: 36px; border: 1px solid #d6d3d1; border-radius: 2px; padding: 0 10px; min-width: 220px; background: #fff; }
    .muted { color: var(--muted); font-size: 13px; }
    .login {
      min-height: 100vh; display: grid; grid-template-columns: 1.05fr 1fr;
    }
    .hero { background: #14110e; color: #fbf8f1; padding: 48px; display: flex; flex-direction: column; justify-content: space-between; }
    .hero h1 { font-family: var(--display); font-size: 56px; color: #fff; }
    .formwrap { display: flex; align-items: center; justify-content: center; padding: 32px 20px; }
    form.box { width: min(380px, 100%); }
    label { display: block; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #78716c; margin: 14px 0 6px; }
    input[type=email], input[type=password], .search {
      width: 100%; height: 40px; border: 1px solid #d6d3d1; border-radius: 2px; padding: 0 12px; background: #fff;
    }
    .btn { height: 40px; border: 0; background: #1c1917; color: #fbf8f1; font-weight: 700; width: 100%; border-radius: 2px; cursor: pointer; }
    .btn:hover { background: #292524; }
    .demo { margin-top: 22px; border: 1px solid var(--line); background: #fff; padding: 12px; font-size: 12px; color: #57534e; }
    .err { color: #be123c; font-size: 13px; margin-top: 10px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .detail { display: grid; grid-template-columns: 1.4fr .8fr; gap: 14px; }
    .dl { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; }
    .dl dt { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #78716c; }
    .dl dd { margin: 3px 0 0; font-size: 14px; }
    .wide { grid-column: 1 / -1; }
    .back { font-size: 13px; font-weight: 700; }
    @media (max-width: 900px) {
      .app.on { grid-template-columns: 1fr; }
      .side { height: auto; position: relative; }
      .nav { grid-template-columns: repeat(3, 1fr); }
      .kpis, .detail, .login, .grid2, .dl { grid-template-columns: 1fr; }
      .hero { display: none; }
      h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div id="login" class="login">
    <section class="hero">
      <div>
        <p class="eyebrow" style="color:#d4a066">MSTC bid operations</p>
        <h1>BidLedger</h1>
        <p class="muted" style="color:#a8a29e;max-width:360px;line-height:1.5;margin-top:14px">
          Combined bid sheets, lot financials, security deposits, final payments, invoices and SAP documents.
        </p>
      </div>
      <dl class="grid2" style="max-width:420px">
        <div><dt class="eyebrow">Cash factor</dt><dd class="tabular" style="font-size:20px;color:#e4c49a">117.65%</dd></div>
        <div><dt class="eyebrow">Security deposit</dt><dd class="tabular" style="font-size:20px;color:#e4c49a">25% of MV</dd></div>
        <div><dt class="eyebrow">GST</dt><dd class="tabular" style="font-size:20px">18%</dd></div>
        <div><dt class="eyebrow">Service charge</dt><dd class="tabular" style="font-size:20px">2.25% × 118%</dd></div>
      </dl>
    </section>
    <div class="formwrap">
      <form class="box" onsubmit="return signin(event)">
        <p class="eyebrow">Offline pack</p>
        <h2 style="font-family:var(--display);font-size:32px;margin:6px 0 4px">Sign in</h2>
        <p class="muted">Works in this file. No GitHub, no server.</p>
        <label>Email</label>
        <input id="email" type="email" value="admin@bidledger.local" required />
        <label>Password</label>
        <input id="password" type="password" value="Admin@123" required />
        <p id="err" class="err" hidden></p>
        <button class="btn" style="margin-top:18px" type="submit">Continue</button>
        <div class="demo">
          <strong>Demo accounts</strong>
          <div class="tabular" style="margin-top:6px;line-height:1.6">
            admin@bidledger.local · Admin@123<br/>
            manager@bidledger.local · Manager@123<br/>
            entry@bidledger.local · Entry@123<br/>
            viewer@bidledger.local · Viewer@123
          </div>
        </div>
      </form>
    </div>
  </div>

  <div id="app" class="app">
    <aside class="side">
      <p class="brand">BidLedger<span>Scrap auction ops</span></p>
      <nav class="nav">
        <a href="#/" data-r="/">Dashboard</a>
        <a href="#/lots" data-r="/lots">Lots</a>
        <a href="#/deposits" data-r="/deposits">Deposits</a>
        <a href="#/buyers" data-r="/buyers">Buyers</a>
        <a href="#/auctions" data-r="/auctions">Auctions</a>
      </nav>
      <p class="muted" style="position:absolute;bottom:18px;left:16px;right:16px;color:#a8a29e;font-size:11px">
        Combined Bid Sheet 23.08.2026 · auctions 21977–21980
      </p>
    </aside>
    <main class="main" id="view"></main>
  </div>

  <script>
    const LOTS = ${JSON.stringify(lots)};
    const USERS = {
      "admin@bidledger.local": "Admin@123",
      "manager@bidledger.local": "Manager@123",
      "entry@bidledger.local": "Entry@123",
      "viewer@bidledger.local": "Viewer@123"
    };

    const inr = (n) => n == null || Number.isNaN(n) ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: Math.abs(n % 1) >= 0.005 ? 2 : 0, minimumFractionDigits: Math.abs(n % 1) >= 0.005 ? 2 : 0 }).format(n);
    const compact = (n) => {
      const a = Math.abs(n);
      if (a >= 1e7) return "₹" + (n/1e7).toFixed(2) + " Cr";
      if (a >= 1e5) return "₹" + (n/1e5).toFixed(2) + " L";
      return inr(n);
    };
    const dt = (s) => !s ? "—" : new Date(s + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    function enrich(l) {
      const sd = Number(l.sdReceived) || 0;
      const fp = Number(l.fpReceived) || 0;
      const rec = Number(l.totalReceivable) || 0;
      const received = sd + fp;
      const outstanding = rec - received;
      const settle = Math.abs(outstanding) <= 1 ? "RECEIVED" : received <= 0 ? "PENDING" : outstanding > 1 ? "SHORT" : "EXCESS";
      const sdSt = sd <= 0 ? "PENDING" : Math.abs((l.sdExpected||0) - sd) <= 1 ? "RECEIVED" : sd < l.sdExpected ? "PARTIAL" : "EXCESS";
      const fpSt = fp <= 0 ? "PENDING" : Math.abs((l.fpExpected||0) - fp) <= 1 ? "RECEIVED" : fp < l.fpExpected ? "PARTIAL" : "EXCESS";
      return { ...l, sd, fp, received, outstanding, settle, sdSt, fpSt };
    }
    const DATA = LOTS.map(enrich);

    function signin(e) {
      e.preventDefault();
      const email = document.getElementById("email").value.trim().toLowerCase();
      const password = document.getElementById("password").value;
      const err = document.getElementById("err");
      if (USERS[email] !== password) {
        err.hidden = false;
        err.textContent = "Invalid email or password.";
        return false;
      }
      sessionStorage.setItem("bidledger", email);
      boot();
      return false;
    }

    function boot() {
      const u = sessionStorage.getItem("bidledger");
      if (!u) {
        document.getElementById("login").style.display = "grid";
        document.getElementById("app").classList.remove("on");
        return;
      }
      document.getElementById("login").style.display = "none";
      document.getElementById("app").classList.add("on");
      render();
    }

    function pill(st) {
      const map = { RECEIVED: ["ok","Received"], PENDING: ["pend","Pending"], PARTIAL: ["pend","Partial"], SHORT: ["short","Short"], EXCESS: ["ex","Excess"] };
      const [c,l] = map[st] || ["pend", st];
      return '<span class="pill '+c+'">'+l+'</span>';
    }

    function route() {
      const h = (location.hash || "#/").replace(/^#/, "") || "/";
      return h;
    }

    function render() {
      const r = route();
      document.querySelectorAll(".nav a").forEach(a => {
        a.classList.toggle("active", r === a.dataset.r || (a.dataset.r !== "/" && r.startsWith(a.dataset.r)));
      });
      const v = document.getElementById("view");
      if (r.startsWith("/lot/")) return v.innerHTML = lotView(r.slice(5));
      if (r.startsWith("/lots")) return v.innerHTML = lotsView();
      if (r.startsWith("/deposits")) return v.innerHTML = depView();
      if (r.startsWith("/buyers")) return v.innerHTML = buyersView();
      if (r.startsWith("/auctions")) return v.innerHTML = auctionsView();
      v.innerHTML = dashView();
    }

    function dashView() {
      const mv = DATA.reduce((s,l)=>s+l.materialValue,0);
      const rec = DATA.reduce((s,l)=>s+l.totalReceivable,0);
      const received = DATA.reduce((s,l)=>s+l.received,0);
      const out = rec - received;
      const byA = {};
      DATA.forEach(l => {
        byA[l.auctionNumber] = byA[l.auctionNumber] || { n:0, mv:0, rec:0, received:0 };
        const a = byA[l.auctionNumber];
        a.n++; a.mv += l.materialValue; a.rec += l.totalReceivable; a.received += l.received;
      });
      return \`
        <div class="top">
          <div><p class="eyebrow">Operations</p><h1>Dashboard</h1></div>
          <p class="muted">\${DATA.length} lots · 13 buyers · 4 auctions</p>
        </div>
        <section class="kpis">
          <div class="card"><div class="l">Material value</div><div class="v tabular">\${compact(mv)}</div></div>
          <div class="card info"><div class="l">Receivable</div><div class="v tabular">\${compact(rec)}</div></div>
          <div class="card good"><div class="l">Received</div><div class="v tabular">\${compact(received)}</div></div>
          <div class="card \${out>1?"bad":"good"}"><div class="l">Outstanding</div><div class="v tabular">\${compact(out)}</div></div>
        </section>
        <h2 style="font-family:var(--display);font-size:20px;margin:22px 0 8px">Auction position</h2>
        <div class="panel">
          <table>
            <thead><tr><th>Auction</th><th class="right">Lots</th><th class="right">Material</th><th class="right">Receivable</th><th class="right">Received</th><th class="right">Outstanding</th></tr></thead>
            <tbody>
              \${Object.keys(byA).sort().map(k => {
                const a = byA[k];
                return '<tr><td><a href="#/auctions">'+k+'</a></td><td class="right">'+a.n+'</td><td class="right tabular">'+inr(a.mv)+'</td><td class="right tabular">'+inr(a.rec)+'</td><td class="right tabular">'+inr(a.received)+'</td><td class="right tabular">'+(inr(a.rec-a.received))+'</td></tr>';
              }).join("")}
            </tbody>
          </table>
        </div>
      \`;
    }

    function lotsView() {
      const q = (new URLSearchParams(location.hash.split("?")[1]||"")).get("q") || "";
      const rows = DATA.filter(l => (l.lotNumber+" "+l.buyerName+" "+l.lotName+" "+l.auctionNumber).toLowerCase().includes(q.toLowerCase()));
      return \`
        <div class="top">
          <div><p class="eyebrow">Register</p><h1>Lots</h1></div>
          <input class="search" placeholder="Search lot, buyer, material" value="\${q.replaceAll('"','&quot;')}" oninput="location.hash='#/lots?q='+encodeURIComponent(this.value)" />
        </div>
        <div class="panel">
          <table>
            <thead><tr><th>Lot</th><th>Auction</th><th>Buyer</th><th>Material</th><th class="right">MV</th><th class="right">Receivable</th><th class="right">Outstanding</th><th>Status</th></tr></thead>
            <tbody>
              \${rows.map(l => '<tr><td><a href="#/lot/'+l.lotNumber+'"><strong>'+l.lotNumber+'</strong></a></td><td>'+l.auctionNumber+'</td><td>'+l.buyerName+'</td><td>'+l.lotName+'</td><td class="right tabular">'+inr(l.materialValue)+'</td><td class="right tabular">'+inr(l.totalReceivable)+'</td><td class="right tabular">'+inr(l.outstanding)+'</td><td>'+pill(l.settle)+'</td></tr>').join("")}
            </tbody>
          </table>
        </div>
      \`;
    }

    function lotView(id) {
      const l = DATA.find(x => x.lotNumber === id);
      if (!l) return "<p>Lot not found.</p>";
      return \`
        <a class="back" href="#/lots">← Lots</a>
        <div class="top" style="margin-top:8px"><div><p class="eyebrow">Auction \${l.auctionNumber}</p><h1>Lot \${l.lotNumber}</h1><p class="muted">\${l.lotName}</p></div>\${pill(l.settle)}</div>
        <div class="detail">
          <div class="card">
            <dl class="dl">
              <div><dt>Buyer</dt><dd>\${l.buyerName}</dd></div>
              <div><dt>Qty / rate</dt><dd>\${l.quantity} \${l.unit} · \${inr(l.rate)}</dd></div>
              <div><dt>Material value</dt><dd class="tabular">\${inr(l.materialValue)}</dd></div>
              <div><dt>GST 18%</dt><dd class="tabular">\${inr(l.gst)}</dd></div>
              <div><dt>TCS 2%</dt><dd class="tabular">\${inr(l.tcs)}</dd></div>
              <div><dt>GST TDS</dt><dd class="tabular">\${inr(l.gstTds)} (\${(l.gstTdsRate*100).toFixed(0)}%)</dd></div>
              <div><dt>SC to MSTC</dt><dd class="tabular">\${inr(l.serviceChargeToMstc)}</dd></div>
              <div><dt>Cash receivable</dt><dd class="tabular"><strong>\${inr(l.totalReceivable)}</strong></dd></div>
              <div class="wide"><dt>Formula</dt><dd class="muted">ROUND(MV × 117.65% − GST TDS, 0)</dd></div>
              \${l.remark ? '<div class="wide"><dt>Remark</dt><dd>'+l.remark+'</dd></div>' : ''}
            </dl>
          </div>
          <div>
            <div class="card good" style="margin-bottom:10px"><div class="l">Received</div><div class="v tabular">\${inr(l.received)}</div></div>
            <div class="card \${l.outstanding>1?"bad":"good"}" style="margin-bottom:10px"><div class="l">Outstanding</div><div class="v tabular">\${inr(l.outstanding)}</div></div>
            <div class="card"><div class="l">Documents</div><div style="margin-top:8px;font-size:13px">Invoice \${l.invoiceNumber || "—"}<br/>SAP \${l.sapDocument || "—"}<br/>\${dt(l.docDate)}</div></div>
          </div>
        </div>
        <div class="grid2" style="margin-top:14px">
          <div class="card">
            <div class="l">Security deposit</div>
            <p>Expected <strong class="tabular">\${inr(l.sdExpected)}</strong></p>
            <p>Received <strong class="tabular">\${inr(l.sd)}</strong> · \${dt(l.sdDate)}</p>
            \${pill(l.sdSt)}
          </div>
          <div class="card">
            <div class="l">Final payment</div>
            <p>Expected <strong class="tabular">\${inr(l.fpExpected)}</strong></p>
            <p>Received <strong class="tabular">\${inr(l.fp)}</strong> · \${dt(l.fpDate)}</p>
            \${pill(l.fpSt)}
          </div>
        </div>
      \`;
    }

    function depView() {
      const pending = DATA.filter(l => l.sdSt !== "RECEIVED");
      return \`
        <div class="top"><div><p class="eyebrow">Collections</p><h1>Security deposits</h1></div></div>
        <div class="panel"><table>
          <thead><tr><th>Lot</th><th>Buyer</th><th class="right">Expected</th><th class="right">Received</th><th class="right">Diff</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            \${DATA.map(l => '<tr><td><a href="#/lot/'+l.lotNumber+'">'+l.lotNumber+'</a></td><td>'+l.buyerName+'</td><td class="right tabular">'+inr(l.sdExpected)+'</td><td class="right tabular">'+inr(l.sd)+'</td><td class="right tabular">'+inr((l.sdExpected||0)-l.sd)+'</td><td>'+dt(l.sdDate)+'</td><td>'+pill(l.sdSt)+'</td></tr>').join("")}
          </tbody>
        </table></div>
        <p class="muted" style="margin-top:10px">\${pending.length} lots not fully received on SD.</p>
      \`;
    }

    function buyersView() {
      const m = {};
      DATA.forEach(l => {
        m[l.buyerName] = m[l.buyerName] || { n:0, rec:0, received:0 };
        const b = m[l.buyerName];
        b.n++; b.rec += l.totalReceivable; b.received += l.received;
      });
      const rows = Object.entries(m).sort((a,b)=> (b[1].rec-b[1].received) - (a[1].rec-a[1].received));
      return \`
        <div class="top"><div><p class="eyebrow">Masters</p><h1>Buyers</h1></div></div>
        <div class="panel"><table>
          <thead><tr><th>Buyer</th><th class="right">Lots</th><th class="right">Receivable</th><th class="right">Received</th><th class="right">Outstanding</th></tr></thead>
          <tbody>
            \${rows.map(([name,b]) => '<tr><td>'+name+'</td><td class="right">'+b.n+'</td><td class="right tabular">'+inr(b.rec)+'</td><td class="right tabular">'+inr(b.received)+'</td><td class="right tabular">'+inr(b.rec-b.received)+'</td></tr>').join("")}
          </tbody>
        </table></div>
      \`;
    }

    function auctionsView() {
      const m = {};
      DATA.forEach(l => {
        m[l.auctionNumber] = m[l.auctionNumber] || [];
        m[l.auctionNumber].push(l);
      });
      return \`
        <div class="top"><div><p class="eyebrow">Masters</p><h1>Auctions 21977–21980</h1></div></div>
        \${Object.keys(m).sort().map(k => {
          const lots = m[k];
          const rec = lots.reduce((s,l)=>s+l.totalReceivable,0);
          const received = lots.reduce((s,l)=>s+l.received,0);
          return '<div class="card" style="margin-bottom:12px"><div class="l">MSTC e-auction '+k+'</div><p style="margin:8px 0 12px" class="muted">'+lots.length+' lots · receivable '+inr(rec)+' · outstanding '+inr(rec-received)+'</p><div class="panel"><table><thead><tr><th>Lot</th><th>Buyer</th><th class="right">Receivable</th><th>Status</th></tr></thead><tbody>'+lots.map(l=>'<tr><td><a href="#/lot/'+l.lotNumber+'">'+l.lotNumber+'</a></td><td>'+l.buyerName+'</td><td class="right tabular">'+inr(l.totalReceivable)+'</td><td>'+pill(l.settle)+'</td></tr>').join("")+'</tbody></table></div></div>';
        }).join("")}
      \`;
    }

    window.addEventListener("hashchange", render);
    boot();
  </script>
</body>
</html>
`;

const out = path.join(process.cwd(), "bidledger.html");
fs.writeFileSync(out, html);
console.log("Wrote", out, "bytes", html.length);
