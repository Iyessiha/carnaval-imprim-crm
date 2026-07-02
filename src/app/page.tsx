import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Carnaval Imprim — Imprimerie professionnelle à Abidjan',
  description: 'Impression numérique, offset, textile et grand format à Cocody-Blockhauss, Abidjan. Qualité pro, délais rapides, prix compétitifs. Devis gratuit 24h.',
  keywords: 'imprimerie abidjan, impression numérique côte d\'ivoire, cartes de visite, brochures, kakémono, t-shirt personnalisé, flyer, affiche',
}

export default function LandingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --mag:#C2117A; --cyan:#00AEEF; --orange:#F7941D;
          --ink:#1B1A1C; --white:#FFFFFF; --cream:#F6F4F1;
          --muted:#7A736C; --border:#E4DDD6;
        }
        html { scroll-behavior:smooth; }
        body {
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
          background:#fff; color:#1B1A1C; overflow-x:hidden;
        }
        /* NAV */
        nav {
          position:fixed; top:0; left:0; right:0; z-index:100;
          background:rgba(255,255,255,.95); backdrop-filter:blur(12px);
          border-bottom:1px solid #E4DDD6;
          padding:0 5vw; display:flex; align-items:center;
          justify-content:space-between; height:68px;
        }
        .nav-links { display:flex; align-items:center; gap:28px; list-style:none; }
        .nav-links a { text-decoration:none; color:#1B1A1C; font-size:14px; font-weight:600; transition:color .2s; }
        .nav-links a:hover { color:#C2117A; }
        .nav-cta { background:#C2117A; color:#fff!important; padding:10px 22px; border-radius:10px; font-size:14px; font-weight:700; text-decoration:none; box-shadow:0 4px 14px rgba(194,17,122,.3); }
        /* HERO */
        .hero { min-height:100vh; background:#1B1A1C; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; padding:100px 5vw 60px; }
        .blob { position:absolute; border-radius:50%; filter:blur(80px); opacity:.18; animation:drift 14s ease-in-out infinite alternate; }
        .blob-1 { width:520px; height:520px; background:#C2117A; top:-120px; left:-80px; }
        .blob-2 { width:420px; height:420px; background:#00AEEF; bottom:-80px; right:-60px; animation-delay:-4s; }
        .blob-3 { width:340px; height:340px; background:#F7941D; top:40%; left:50%; animation-delay:-8s; }
        @keyframes drift { to { transform:translate(40px,30px) scale(1.05); } }
        .hero-content { position:relative; z-index:1; max-width:1100px; width:100%; display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; }
        .hero-badge { display:inline-flex; align-items:center; gap:7px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2); padding:6px 14px; border-radius:999px; font-size:12px; font-weight:700; color:rgba(255,255,255,.85); letter-spacing:.5px; text-transform:uppercase; margin-bottom:24px; }
        .badge-dot { width:7px; height:7px; background:#4eff9a; border-radius:50%; animation:pulse 2s ease infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        .hero-h1 { font-size:clamp(38px,5.5vw,72px); font-weight:900; line-height:1.05; letter-spacing:-2px; margin-bottom:20px; color:#fff; }
        .hero-h1 em { font-style:normal; color:#C2117A; }
        .hero-h1 span { color:#00AEEF; }
        .hero-sub { font-size:17px; line-height:1.7; color:rgba(255,255,255,.7); margin-bottom:36px; max-width:440px; }
        .hero-actions { display:flex; gap:14px; flex-wrap:wrap; }
        .btn-primary { display:inline-flex; align-items:center; gap:8px; background:#C2117A; color:#fff; padding:14px 28px; border-radius:12px; font-size:15px; font-weight:700; text-decoration:none; box-shadow:0 6px 24px rgba(194,17,122,.4); transition:transform .15s,box-shadow .15s; }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(194,17,122,.5); }
        .btn-ghost { display:inline-flex; align-items:center; gap:8px; background:transparent; color:#fff; padding:14px 28px; border-radius:12px; font-size:15px; font-weight:700; text-decoration:none; border:1.5px solid rgba(255,255,255,.3); transition:background .15s; }
        .btn-ghost:hover { background:rgba(255,255,255,.08); }
        /* Logo animé */
        .logo-anim-wrap { position:relative; width:380px; height:380px; }
        .logo-ring { position:absolute; inset:0; border-radius:50%; border:1px dashed rgba(255,255,255,.1); animation:spin-slow 30s linear infinite; }
        .logo-ring-2 { animation-duration:20s; animation-direction:reverse; inset:30px; }
        .logo-center { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
        @keyframes spin-slow { to { transform:rotate(360deg); } }
        .orbit-dot { position:absolute; border-radius:50%; top:50%; left:50%; animation:orbit linear infinite; }
        @keyframes orbit {
          from { transform:rotate(var(--start)) translateX(var(--r)) rotate(calc(-1 * var(--start))); }
          to   { transform:rotate(calc(var(--start) + 360deg)) translateX(var(--r)) rotate(calc(-360deg - var(--start))); }
        }
        /* STATS */
        .stats-strip { background:#C2117A; padding:28px 5vw; display:flex; justify-content:center; flex-wrap:wrap; }
        .stat-item { flex:1; min-width:160px; text-align:center; padding:16px 24px; border-right:1px solid rgba(255,255,255,.2); }
        .stat-item:last-child { border-right:none; }
        .stat-val { font-size:36px; font-weight:900; color:#fff; line-height:1; }
        .stat-label { font-size:12px; color:rgba(255,255,255,.75); font-weight:600; margin-top:4px; text-transform:uppercase; letter-spacing:.5px; }
        /* SECTIONS */
        section { padding:90px 5vw; }
        .section-label { display:inline-block; font-size:11px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:#C2117A; margin-bottom:14px; }
        .section-title { font-size:clamp(28px,3.5vw,44px); font-weight:900; line-height:1.12; letter-spacing:-1px; margin-bottom:16px; }
        .section-sub { font-size:16px; color:#7A736C; line-height:1.7; max-width:520px; margin-bottom:48px; }
        /* SERVICES */
        .services { background:#F6F4F1; }
        .services-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px; max-width:1100px; margin:0 auto; }
        .service-card { background:#fff; border-radius:18px; padding:32px 28px; border:1px solid #E4DDD6; position:relative; overflow:hidden; transition:transform .2s,box-shadow .2s; }
        .service-card::before { content:''; position:absolute; top:0; left:0; right:0; height:4px; background:var(--accent,#C2117A); }
        .service-card:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,.1); }
        .service-icon { width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:24px; margin-bottom:20px; }
        .service-title { font-size:18px; font-weight:800; margin-bottom:10px; }
        .service-desc { font-size:14px; color:#7A736C; line-height:1.7; margin-bottom:16px; }
        .service-items { list-style:none; display:flex; flex-wrap:wrap; gap:6px; }
        .service-items li { font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; }
        /* PRODUITS */
        .produits-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; }
        .produit-item { background:#F6F4F1; border-radius:16px; padding:24px 20px; text-align:center; border:1px solid #E4DDD6; transition:border-color .2s,background .2s; }
        .produit-item:hover { border-color:#C2117A; background:#fff; }
        .produit-emoji { font-size:32px; margin-bottom:12px; display:block; }
        .produit-name { font-size:13px; font-weight:700; }
        /* PROCESS */
        .process { background:#1B1A1C; color:#fff; }
        .steps { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:0; position:relative; }
        .steps::before { content:''; position:absolute; top:36px; left:10%; right:10%; height:1px; background:rgba(255,255,255,.1); }
        .step { padding:0 24px; text-align:center; }
        .step-num { width:72px; height:72px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:900; margin:0 auto 20px; position:relative; z-index:1; }
        .step-title { font-size:16px; font-weight:800; color:#fff; margin-bottom:8px; }
        .step-desc { font-size:13px; color:rgba(255,255,255,.55); line-height:1.7; }
        /* WHY */
        .why-inner { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; }
        .why-cards { display:flex; flex-direction:column; gap:16px; }
        .why-card { background:#F6F4F1; border-radius:14px; padding:20px 22px; display:flex; align-items:flex-start; gap:16px; border:1px solid #E4DDD6; transition:border-color .2s; }
        .why-card:hover { border-color:#C2117A; }
        .why-card-icon { width:44px; height:44px; border-radius:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:20px; }
        .why-card-title { font-size:15px; font-weight:800; margin-bottom:4px; }
        .why-card-desc { font-size:13px; color:#7A736C; line-height:1.6; }
        /* TESTI */
        .testimonials { background:#F6F4F1; }
        .testi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:20px; }
        .testi-card { background:#fff; border-radius:18px; padding:28px; border:1px solid #E4DDD6; }
        .testi-quote { font-size:40px; color:#C2117A; font-weight:900; line-height:1; margin-bottom:16px; font-family:Georgia,serif; }
        .testi-text { font-size:15px; line-height:1.7; color:#1B1A1C; margin-bottom:20px; font-style:italic; }
        .testi-author { display:flex; align-items:center; gap:12px; }
        .testi-avatar { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; color:#fff; flex-shrink:0; }
        .testi-name { font-size:14px; font-weight:800; }
        .testi-role { font-size:12px; color:#7A736C; }
        .stars { color:#F7941D; font-size:13px; margin-bottom:14px; }
        /* CTA */
        .cta-section { background:linear-gradient(135deg,#1B1A1C 0%,#2d0820 60%,#1a0a30 100%); padding:100px 5vw; text-align:center; position:relative; overflow:hidden; }
        .cta-inner { position:relative; z-index:1; max-width:640px; margin:0 auto; }
        .cta-title { font-size:clamp(32px,4vw,52px); font-weight:900; color:#fff; line-height:1.1; letter-spacing:-1.5px; margin-bottom:20px; }
        .cta-sub { font-size:16px; color:rgba(255,255,255,.65); line-height:1.7; margin-bottom:40px; }
        .cta-actions { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
        .cta-tel { display:inline-flex; align-items:center; gap:10px; background:rgba(255,255,255,.1); color:#fff; padding:14px 28px; border-radius:12px; text-decoration:none; font-size:15px; font-weight:700; border:1.5px solid rgba(255,255,255,.2); transition:background .15s; }
        .cta-tel:hover { background:rgba(255,255,255,.18); }
        /* FOOTER */
        footer { background:#0f0e10; color:rgba(255,255,255,.5); padding:48px 5vw 32px; }
        .footer-inner { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:2fr 1fr 1fr; gap:48px; margin-bottom:40px; }
        .footer-logo-text { font-size:20px; font-weight:900; color:#fff; margin-bottom:4px; }
        .footer-logo-text span { color:#C2117A; }
        .footer-col-title { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; color:rgba(255,255,255,.6); margin-bottom:16px; }
        .footer-links { list-style:none; display:flex; flex-direction:column; gap:10px; }
        .footer-links a { color:rgba(255,255,255,.4); text-decoration:none; font-size:13px; transition:color .15s; }
        .footer-links a:hover { color:#fff; }
        .footer-bottom { max-width:1100px; margin:0 auto; border-top:1px solid rgba(255,255,255,.07); padding-top:24px; display:flex; justify-content:space-between; align-items:center; font-size:12px; flex-wrap:wrap; gap:12px; }
        .footer-bottom a { color:rgba(255,255,255,.3); text-decoration:none; }
        @media (max-width:768px) {
          .nav-links { display:none; }
          .hero-content { grid-template-columns:1fr; text-align:center; }
          .hero-visual { display:none; }
          .hero-sub,.hero-actions { margin-left:auto; margin-right:auto; }
          .hero-actions { justify-content:center; }
          .why-inner { grid-template-columns:1fr; }
          .footer-inner { grid-template-columns:1fr; gap:32px; }
          .steps::before { display:none; }
          .stat-item { border-right:none; border-bottom:1px solid rgba(255,255,255,.2); }
          .stat-item:last-child { border-bottom:none; }
        }
        @media (prefers-reduced-motion:reduce) { .blob,.orbit-dot,.logo-ring,.badge-dot { animation:none; } }
      `}} />

      {/* NAV */}
      <nav>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <svg height="42" viewBox="0 0 320 136" xmlns="http://www.w3.org/2000/svg" aria-label="Carnaval Imprim">
            <ellipse cx="62" cy="24" rx="24" ry="12" fill="#F7941D" transform="rotate(-35 62 24)"/>
            <ellipse cx="44" cy="44" rx="15" ry="8" fill="#F7941D" transform="rotate(-55 44 44)"/>
            <ellipse cx="148" cy="20" rx="22" ry="11" fill="#00AEEF" transform="rotate(28 148 20)"/>
            <ellipse cx="166" cy="40" rx="13" ry="7" fill="#00AEEF" transform="rotate(48 166 40)"/>
            <ellipse cx="52" cy="96" rx="20" ry="10" fill="#C2117A" transform="rotate(32 52 96)"/>
            <ellipse cx="34" cy="76" rx="12" ry="6" fill="#C2117A" transform="rotate(12 34 76)"/>
            <ellipse cx="158" cy="102" rx="18" ry="9" fill="#F7941D" transform="rotate(-28 158 102)"/>
            <path d="M68 36 Q105 16 142 36 Q162 56 138 74 Q118 88 96 80 Q66 70 62 52 Z" fill="#1B1A1C"/>
            <text x="8" y="114" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="52" fill="#1B1A1C" letterSpacing="-1">CARNAVAL</text>
            <text x="116" y="134" fontFamily="Arial,sans-serif" fontWeight="800" fontSize="30" fill="#C2117A" letterSpacing="1">IMPRIM</text>
          </svg>
        </div>
        <ul className="nav-links">
          <li><a href="#services">Services</a></li>
          <li><a href="#produits">Produits</a></li>
          <li><a href="#processus">Comment ça marche</a></li>
          <li><a href="#contact">Contact</a></li>
          <li><a href="/login" className="nav-cta">Espace client</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>
        <div className="hero-content">
          <div>
            <div className="hero-badge">
              <span className="badge-dot" />
              Imprimerie professionnelle · Abidjan
            </div>
            <h1 className="hero-h1">
              Donnez vie<br/>à vos <em>idées</em><br/>sur tous <span>supports</span>
            </h1>
            <p className="hero-sub">
              De la carte de visite au kakémono, du flyer à la brochure dos carré — Carnaval Imprim livre qualité professionnelle, délais rapides et prix compétitifs à Cocody-Blockhauss.
            </p>
            <div className="hero-actions">
              <a href="#contact" className="btn-primary">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.77 19.79 19.79 0 01.1 1.18 2 2 0 012.1 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>
                Demander un devis
              </a>
              <a href="#services" className="btn-ghost">
                Voir nos services
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="logo-anim-wrap">
              <div className="logo-ring" />
              <div className="logo-ring logo-ring-2" />
              {[
                { cl:'orbit-dot', bg:'#C2117A', start:'0deg',   r:'170px', dur:'8s',  w:14, h:14, m:-7  },
                { cl:'orbit-dot', bg:'#00AEEF', start:'120deg', r:'170px', dur:'8s',  w:14, h:14, m:-7  },
                { cl:'orbit-dot', bg:'#F7941D', start:'240deg', r:'170px', dur:'8s',  w:14, h:14, m:-7  },
                { cl:'orbit-dot', bg:'#fff',    start:'60deg',  r:'120px', dur:'5s',  w:8,  h:8,  m:-4  },
                { cl:'orbit-dot', bg:'#C2117A', start:'200deg', r:'120px', dur:'5s',  w:8,  h:8,  m:-4  },
              ].map((d, i) => (
                <div key={i} style={{
                  position:'absolute', borderRadius:'50%', top:'50%', left:'50%',
                  background: d.bg, width:d.w, height:d.h,
                  marginTop:d.m, marginLeft:d.m,
                  animation:`orbit ${d.dur} linear infinite`,
                  ['--start' as string]: d.start,
                  ['--r' as string]: d.r,
                }} />
              ))}
              <div className="logo-center">
                <svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg" style={{ width:260 }}>
                  <ellipse cx="60" cy="28" rx="28" ry="14" fill="#F7941D" transform="rotate(-35 60 28)" opacity=".95"/>
                  <ellipse cx="42" cy="50" rx="16" ry="9" fill="#F7941D" transform="rotate(-55 42 50)" opacity=".9"/>
                  <ellipse cx="140" cy="22" rx="25" ry="12" fill="#00AEEF" transform="rotate(28 140 22)" opacity=".95"/>
                  <ellipse cx="158" cy="44" rx="15" ry="8" fill="#00AEEF" transform="rotate(48 158 44)" opacity=".9"/>
                  <ellipse cx="50" cy="120" rx="24" ry="11" fill="#C2117A" transform="rotate(32 50 120)" opacity=".95"/>
                  <ellipse cx="34" cy="98" rx="14" ry="8" fill="#C2117A" transform="rotate(12 34 98)" opacity=".9"/>
                  <ellipse cx="152" cy="126" rx="22" ry="10" fill="#F7941D" transform="rotate(-28 152 126)" opacity=".95"/>
                  <path d="M65 40 Q100 18 135 40 Q155 62 132 82 Q112 96 90 88 Q62 78 58 58 Z" fill="#1B1A1C"/>
                  <text x="10" y="152" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="34" fill="white" letterSpacing="-0.5">CARNAVAL</text>
                  <text x="60" y="174" fontFamily="Arial,sans-serif" fontWeight="800" fontSize="22" fill="#C2117A" letterSpacing="2">IMPRIM</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-strip">
        {[['2+','ans d\'expérience'],['500+','clients satisfaits'],['5','pôles d\'expertise'],['48h','délai express'],['100%','qualité garantie']].map(([v,l]) => (
          <div className="stat-item" key={l}><div className="stat-val">{v}</div><div className="stat-label">{l}</div></div>
        ))}
      </div>

      {/* SERVICES */}
      <section className="services" id="services">
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div className="section-label">Nos expertises</div>
          <h2 className="section-title">5 pôles pour tous<br/>vos besoins d&apos;impression</h2>
          <p className="section-sub">De la conception graphique à la livraison — nous gérons tout pour que votre communication soit parfaite.</p>
          <div className="services-grid">
            {[
              { accent:'#C2117A', iconBg:'#FDE8E8', icon:'🖨️', title:'Impression Numérique', desc:'Petites séries, couleurs vives, rendu premium. Idéale pour les projets urgents et personnalisés.', tags:['Cartes de visite','Flyers','Brochures','Affiches'], tagBg:'#FDE8E8', tagC:'#C2117A' },
              { accent:'#00AEEF', iconBg:'#E5F7FF', icon:'⚙️', title:'Impression Offset', desc:'Grandes séries, rendu photographique, coût unitaire réduit. Le choix des professionnels.', tags:['Magazines','Catalogues','Livres','Journaux'], tagBg:'#E5F7FF', tagC:'#0090D0' },
              { accent:'#F7941D', iconBg:'#FEF3E2', icon:'🏔️', title:'Affichage & Grand Format', desc:'Bâches, banderoles, kakémonos, roll-up et panneaux publicitaires haute résolution.', tags:['Bâches','Kakémonos','Roll-up','Panneaux'], tagBg:'#FEF3E2', tagC:'#D4780A' },
              { accent:'#7B2FA5', iconBg:'#F0E8F8', icon:'👕', title:'Impression Textile', desc:'T-shirts, casquettes, polos et sacs personnalisés à vos couleurs pour vos équipes et événements.', tags:['T-shirts','Casquettes','Polos','Sacs'], tagBg:'#F0E8F8', tagC:'#7B2FA5' },
              { accent:'#1B1A1C', iconBg:'#F0EEEC', icon:'✏️', title:'Conception Graphique', desc:'Nos designers créent votre identité visuelle, vos supports et vos mises en page prêtes à l\'impression.', tags:['Logo','Charte graphique','Mise en page','PAO'], tagBg:'#F0EEEC', tagC:'#1B1A1C' },
            ].map(s => (
              <div className="service-card" key={s.title} style={{ ['--accent' as string]:s.accent }}>
                <div className="service-icon" style={{ background:s.iconBg }}>{s.icon}</div>
                <div className="service-title">{s.title}</div>
                <div className="service-desc">{s.desc}</div>
                <ul className="service-items">
                  {s.tags.map(t => <li key={t} style={{ background:s.tagBg, color:s.tagC }}>{t}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUITS */}
      <section id="produits" style={{ background:'#fff' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div className="section-label">Catalogue</div>
            <h2 className="section-title">Tous les supports<br/>pour votre communication</h2>
            <p className="section-sub" style={{ margin:'0 auto' }}>15+ types de supports — du plus simple au plus élaboré.</p>
          </div>
          <div className="produits-grid">
            {[['📇','Carte de visite'],['📄','Flyer & Prospectus'],['📰','Affiche (A3→A0)'],['📗','Brochure & Catalogue'],['🗓️','Calendrier'],['🏔️','Bâche & Banderole'],['🚩','Oriflamme'],['📋','Kakémono & Roll-up'],['👕','T-shirt & Polo'],['🧢','Casquette'],['☂️','Parapluie'],['🖊️','Stylo publicitaire'],['👜','Sac Cabas'],['🎒','Sac à dos'],['📒','Bloc-note & Agenda']].map(([e,n]) => (
              <div className="produit-item" key={n}>
                <span className="produit-emoji">{e}</span>
                <div className="produit-name">{n}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESSUS */}
      <section className="process" id="processus">
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div className="section-label" style={{ color:'#00AEEF' }}>Comment ça marche</div>
            <h2 className="section-title" style={{ color:'#fff' }}>De votre idée<br/>à votre commande</h2>
            <p className="section-sub" style={{ margin:'0 auto', color:'rgba(255,255,255,.6)' }}>4 étapes simples pour obtenir votre impression parfaite.</p>
          </div>
          <div className="steps">
            {[
              { n:'1', cl:'s1', bg:'#C2117A', color:'#fff', t:'Contactez-nous', d:'Appelez, WhatsApp ou venez directement à Cocody-Blockhauss. Décrivez votre projet.' },
              { n:'2', cl:'s2', bg:'#00AEEF', color:'#1B1A1C', t:'Devis gratuit', d:'Nous vous faisons un devis détaillé sous 24h. Prix transparent, sans surprise.' },
              { n:'3', cl:'s3', bg:'#F7941D', color:'#1B1A1C', t:'Validation & BAT', d:'Vous validez le bon à tirer. Notre équipe prépare vos fichiers à l\'impression.' },
              { n:'4', cl:'s4', bg:'#fff', color:'#1B1A1C', t:'Livraison', d:'Récupération sur place ou livraison. Qualité garantie ou on recommence.' },
            ].map(s => (
              <div className="step" key={s.n}>
                <div className="step-num" style={{ background:s.bg, color:s.color }}>{s.n}</div>
                <div className="step-title">{s.t}</div>
                <div className="step-desc">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POURQUOI */}
      <section style={{ background:'#fff' }}>
        <div className="why-inner">
          <div>
            <div className="section-label">Nos engagements</div>
            <h2 className="section-title">Pourquoi choisir<br/>Carnaval Imprim ?</h2>
            <p className="section-sub">Nous ne sommes pas juste une imprimerie. Nous sommes votre partenaire communication à Abidjan.</p>
            <a href="#contact" className="btn-primary" style={{ display:'inline-flex', marginTop:8 }}>
              Nous contacter
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
          <div className="why-cards">
            {[
              { bg:'#FDE8E8', icon:'🎯', t:'Qualité professionnelle', d:'Matériaux certifiés, encres haute densité, rendu fidèle à vos maquettes. Chaque commande est contrôlée avant livraison.' },
              { bg:'#E5F7FF', icon:'⚡', t:'Délais express', d:'Urgence ? Nous livrons en 48h. Besoin standard ? 3 à 5 jours ouvrables. Toujours dans les temps.' },
              { bg:'#FEF3E2', icon:'💰', t:'Prix compétitifs', d:'Tarifs transparents, devis gratuit, remises sur grandes quantités. Le meilleur rapport qualité-prix à Abidjan.' },
              { bg:'#F0E8F8', icon:'🤝', t:'Accompagnement complet', d:'De la conception graphique à la livraison, nous vous accompagnons à chaque étape.' },
            ].map(w => (
              <div className="why-card" key={w.t}>
                <div className="why-card-icon" style={{ background:w.bg }}>{w.icon}</div>
                <div>
                  <div className="why-card-title">{w.t}</div>
                  <div className="why-card-desc">{w.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="testimonials">
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div className="section-label">Ce que disent nos clients</div>
            <h2 className="section-title">Ils nous font confiance</h2>
          </div>
          <div className="testi-grid">
            {[
              { bg:'#C2117A', init:'K', name:'Koné Aminata', role:'Directrice Communication, ONG Espoir', text:'Nos brochures pour le ministère ont été livrées en 3 jours, qualité irréprochable. Carnaval Imprim est devenu notre partenaire officiel.' },
              { bg:'#00AEEF', init:'D', name:'Diabaté Moussa', role:'Gérant, Global Business Solutions', text:'Du logo à nos kakémonos d\'événement — tout a été parfait. L\'équipe est réactive et le prix imbattable à Abidjan.' },
              { bg:'#F7941D', init:'T', name:'Traoré Fatoumata', role:'Responsable RH, Entreprise NOVÉLIS', text:'500 t-shirts brodés pour notre événement corporate en 5 jours. Qualité top, délais respectés. Je recommande sans hésiter !' },
            ].map(t => (
              <div className="testi-card" key={t.name}>
                <div className="stars">★★★★★</div>
                <div className="testi-quote">&ldquo;</div>
                <div className="testi-text">{t.text}</div>
                <div className="testi-author">
                  <div className="testi-avatar" style={{ background:t.bg }}>{t.init}</div>
                  <div><div className="testi-name">{t.name}</div><div className="testi-role">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" id="contact">
        <div style={{ position:'absolute', width:400, height:400, background:'#C2117A', borderRadius:'50%', filter:'blur(100px)', opacity:.15, top:-100, left:-80 }} />
        <div style={{ position:'absolute', width:300, height:300, background:'#00AEEF', borderRadius:'50%', filter:'blur(80px)', opacity:.12, bottom:-80, right:-60 }} />
        <div className="cta-inner">
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:2, textTransform:'uppercase' as const, color:'#C2117A', marginBottom:16 }}>Passons à l&apos;action</div>
          <h2 className="cta-title">Votre projet mérite<br/>la meilleure impression</h2>
          <p className="cta-sub">Devis gratuit sous 24h. Venez nous voir à Cocody-Blockhauss ou contactez-nous par téléphone et WhatsApp.</p>
          <div className="cta-actions">
            <a href="tel:+2250719141313" className="btn-primary">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.77 19.79 19.79 0 01.1 1.18 2 2 0 012.1 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>
              07 19 14 13 13
            </a>
            <a href="tel:+2250758265312" className="cta-tel">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.77 19.79 19.79 0 01.1 1.18 2 2 0 012.1 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>
              07 58 26 53 12
            </a>
            <a href="/login" className="cta-tel">🔐 Espace client</a>
          </div>
          <div style={{ marginTop:40, padding:'20px 28px', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:16, display:'inline-block', textAlign:'left' as const }}>
            <div style={{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,.5)', textTransform:'uppercase' as const, letterSpacing:1.5, marginBottom:10 }}>Notre adresse</div>
            <div style={{ fontSize:15, color:'#fff', fontWeight:600, lineHeight:1.8 }}>
              📍 Cocody – Blockhauss, Abidjan, Côte d&apos;Ivoire<br/>
              🏛️ SARL au capital de 1 000 000 FCFA<br/>
              📋 RC : CI-ABJ-03-2024-B13-05735 · NCC : 240220333S
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div>
            <div className="footer-logo-text">CARNAVAL<span>IMPRIM</span></div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,.4)', marginBottom:20 }}>Votre imprimerie de confiance à Abidjan</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', lineHeight:1.8 }}>
              SARL au capital de 1 000 000 FCFA<br/>
              RC N° : CI-ABJ-03-2024-B13-05735<br/>
              NCC : 240220333S<br/>
              Régime : Réel simplifié · Centre des impôts : Cocody
            </div>
          </div>
          <div>
            <div className="footer-col-title">Services</div>
            <ul className="footer-links">
              {['Impression numérique','Impression offset','Grand format','Impression textile','Conception graphique'].map(s => <li key={s}><a href="#services">{s}</a></li>)}
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Contact</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,.4)', lineHeight:2 }}>
              📞 07 19 14 13 13<br/>
              📞 07 58 26 53 12<br/>
              📍 Cocody-Blockhauss, Abidjan
            </div>
            <div style={{ marginTop:20 }}>
              <a href="/login" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#C2117A', color:'#fff', padding:'10px 18px', borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:700 }}>
                🔐 Espace client
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Carnaval Imprim SARL · Tous droits réservés</span>
          <span>Développé par <a href="#">MonWe Infinity LLC</a></span>
        </div>
      </footer>
    </>
  )
}
