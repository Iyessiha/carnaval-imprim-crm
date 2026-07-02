import Link from 'next/link'
import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Carnaval Imprim — Imprimerie professionnelle à Abidjan',
  description: 'Impression numérique, offset, textile et grand format à Cocody-Blockhauss, Abidjan. Qualité pro, délais rapides, prix compétitifs. Devis gratuit 24h.',
}

export default function LandingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --mag:#C2117A; --cyan:#00AEEF; --orange:#F7941D; --ink:#1B1A1C; }
        html { scroll-behavior:smooth; }
        body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; background:#fff; color:#1B1A1C; overflow-x:hidden; }
        nav { position:fixed; top:0; left:0; right:0; z-index:100; background:rgba(255,255,255,.97); backdrop-filter:blur(12px); border-bottom:1px solid #E4DDD6; padding:0 5vw; display:flex; align-items:center; justify-content:space-between; height:72px; }
        .nav-links { display:flex; align-items:center; gap:28px; list-style:none; }
        .nav-links a { text-decoration:none; color:#1B1A1C; font-size:14px; font-weight:600; transition:color .2s; }
        .nav-links a:hover { color:#C2117A; }
        .nav-cta { background:#C2117A!important; color:#fff!important; padding:10px 22px!important; border-radius:10px!important; font-size:14px!important; font-weight:700!important; box-shadow:0 4px 14px rgba(194,17,122,.3)!important; }
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
        .btn-primary:hover { transform:translateY(-2px); }
        .btn-ghost { display:inline-flex; align-items:center; gap:8px; background:transparent; color:#fff; padding:14px 28px; border-radius:12px; font-size:15px; font-weight:700; text-decoration:none; border:1.5px solid rgba(255,255,255,.3); }
        .hero-logo-wrap { display:flex; align-items:center; justify-content:center; position:relative; }
        .hero-logo-glow { position:absolute; inset:-30px; border-radius:50%; background:radial-gradient(circle, rgba(194,17,122,.25) 0%, transparent 70%); animation:glow-pulse 3s ease infinite alternate; }
        @keyframes glow-pulse { from{opacity:.6;transform:scale(.95)} to{opacity:1;transform:scale(1.05)} }
        .orbit-ring { position:absolute; inset:0; border-radius:50%; border:1px dashed rgba(255,255,255,.1); animation:spin-slow 30s linear infinite; }
        .orbit-ring-2 { animation-duration:18s; animation-direction:reverse; inset:-20px; }
        @keyframes spin-slow { to { transform:rotate(360deg); } }
        .orbit-dot { position:absolute; border-radius:50%; top:50%; left:50%; animation:orbit linear infinite; }
        @keyframes orbit {
          from { transform:rotate(var(--start)) translateX(var(--r)) rotate(calc(-1 * var(--start))); }
          to   { transform:rotate(calc(var(--start) + 360deg)) translateX(var(--r)) rotate(calc(-360deg - var(--start))); }
        }
        .stats-strip { background:#C2117A; padding:24px 5vw; display:flex; justify-content:center; flex-wrap:wrap; }
        .stat-item { flex:1; min-width:140px; text-align:center; padding:14px 20px; border-right:1px solid rgba(255,255,255,.2); }
        .stat-item:last-child { border-right:none; }
        .stat-val { font-size:34px; font-weight:900; color:#fff; line-height:1; }
        .stat-label { font-size:11px; color:rgba(255,255,255,.75); font-weight:600; margin-top:4px; text-transform:uppercase; letter-spacing:.5px; }
        section { padding:90px 5vw; }
        .section-label { display:inline-block; font-size:11px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:#C2117A; margin-bottom:14px; }
        .section-title { font-size:clamp(28px,3.5vw,44px); font-weight:900; line-height:1.12; letter-spacing:-1px; margin-bottom:16px; }
        .section-sub { font-size:16px; color:#7A736C; line-height:1.7; max-width:520px; margin-bottom:48px; }
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
        .produits-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:14px; }
        .produit-item { background:#F6F4F1; border-radius:16px; padding:20px 16px; text-align:center; border:1px solid #E4DDD6; transition:border-color .2s,background .2s; }
        .produit-item:hover { border-color:#C2117A; background:#fff; }
        .produit-emoji { font-size:28px; margin-bottom:10px; display:block; }
        .produit-name { font-size:12px; font-weight:700; }
        .process { background:#1B1A1C; color:#fff; }
        .steps { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:0; position:relative; }
        .steps::before { content:''; position:absolute; top:36px; left:10%; right:10%; height:1px; background:rgba(255,255,255,.1); }
        .step { padding:0 24px; text-align:center; }
        .step-num { width:72px; height:72px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:900; margin:0 auto 20px; position:relative; z-index:1; }
        .step-title { font-size:16px; font-weight:800; color:#fff; margin-bottom:8px; }
        .step-desc { font-size:13px; color:rgba(255,255,255,.55); line-height:1.7; }
        .why-inner { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; }
        .why-cards { display:flex; flex-direction:column; gap:16px; }
        .why-card { background:#F6F4F1; border-radius:14px; padding:20px 22px; display:flex; align-items:flex-start; gap:16px; border:1px solid #E4DDD6; transition:border-color .2s; }
        .why-card:hover { border-color:#C2117A; }
        .why-card-icon { width:44px; height:44px; border-radius:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:20px; }
        .why-card-title { font-size:15px; font-weight:800; margin-bottom:4px; }
        .why-card-desc { font-size:13px; color:#7A736C; line-height:1.6; }
        .testi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:20px; }
        .testi-card { background:#fff; border-radius:18px; padding:28px; border:1px solid #E4DDD6; }
        .testi-quote { font-size:40px; color:#C2117A; font-weight:900; line-height:1; margin-bottom:16px; font-family:Georgia,serif; }
        .testi-text { font-size:15px; line-height:1.7; margin-bottom:20px; font-style:italic; }
        .testi-author { display:flex; align-items:center; gap:12px; }
        .testi-avatar { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; color:#fff; flex-shrink:0; }
        .testi-name { font-size:14px; font-weight:800; }
        .testi-role { font-size:12px; color:#7A736C; }
        .stars { color:#F7941D; font-size:13px; margin-bottom:14px; }
        .cta-section { background:linear-gradient(135deg,#1B1A1C 0%,#2d0820 60%,#1a0a30 100%); padding:100px 5vw; text-align:center; position:relative; overflow:hidden; }
        .cta-inner { position:relative; z-index:1; max-width:640px; margin:0 auto; }
        .cta-title { font-size:clamp(32px,4vw,52px); font-weight:900; color:#fff; line-height:1.1; letter-spacing:-1.5px; margin-bottom:20px; }
        .cta-sub { font-size:16px; color:rgba(255,255,255,.65); line-height:1.7; margin-bottom:40px; }
        .cta-actions { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
        .cta-tel { display:inline-flex; align-items:center; gap:10px; background:rgba(255,255,255,.1); color:#fff; padding:14px 28px; border-radius:12px; text-decoration:none; font-size:15px; font-weight:700; border:1.5px solid rgba(255,255,255,.2); }
        footer { background:#0f0e10; color:rgba(255,255,255,.5); padding:48px 5vw 32px; }
        .footer-inner { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:2fr 1fr 1fr; gap:48px; margin-bottom:40px; }
        .footer-logo-text { font-size:20px; font-weight:900; color:#fff; margin-bottom:4px; }
        .footer-logo-text span { color:#C2117A; }
        .footer-col-title { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; color:rgba(255,255,255,.6); margin-bottom:16px; }
        .footer-links { list-style:none; display:flex; flex-direction:column; gap:10px; }
        .footer-links a { color:rgba(255,255,255,.4); text-decoration:none; font-size:13px; transition:color .15s; }
        .footer-links a:hover { color:#fff; }
        .footer-bottom { max-width:1100px; margin:0 auto; border-top:1px solid rgba(255,255,255,.07); padding-top:24px; display:flex; justify-content:space-between; font-size:12px; flex-wrap:wrap; gap:12px; }
        .footer-bottom a { color:rgba(255,255,255,.3); text-decoration:none; }
        @media (max-width:768px) {
          .nav-links { display:none; }
          .hero-content { grid-template-columns:1fr; }
          .hero-logo-wrap { display:none; }
          .why-inner { grid-template-columns:1fr; }
          .footer-inner { grid-template-columns:1fr; }
          .steps::before { display:none; }
        }
        @media (prefers-reduced-motion:reduce) { .blob,.orbit-dot,.orbit-ring,.badge-dot,.hero-logo-glow { animation:none; } }
      `}} />

      {/* NAV */}
      <nav>
        <Link href="/" style={{ display:'flex', alignItems:'center' }}>
          <Image src="/logo.png" alt="Carnaval Imprim" width={160} height={90}
            style={{ height:52, width:'auto', objectFit:'contain' }} priority />
        </Link>
        <ul className="nav-links">
          <li><a href="#services">Services</a></li>
          <li><a href="#produits">Produits</a></li>
          <li><a href="#processus">Comment ça marche</a></li>
          <li><a href="#contact">Contact</a></li>
          
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
          <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />
        </div>
        <div className="hero-content">
          <div>
            <div className="hero-badge"><span className="badge-dot" /> Imprimerie professionnelle · Abidjan</div>
            <h1 className="hero-h1">Donnez vie<br/>à vos <em>idées</em><br/>sur tous <span>supports</span></h1>
            <p className="hero-sub">De la carte de visite au kakémono — Carnaval Imprim livre qualité professionnelle, délais rapides et prix compétitifs à Cocody-Blockhauss.</p>
            <div className="hero-actions">
              <a href="#contact" className="btn-primary">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.77 19.79 19.79 0 01.1 1.18 2 2 0 012.1 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>
                Demander un devis
              </a>
              <a href="#services" className="btn-ghost">Voir nos services →</a>
            </div>
          </div>

          {/* HERO — Vrai logo avec effet glow + orbite */}
          <div className="hero-logo-wrap" style={{ position:'relative', width:380, height:380, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div className="hero-logo-glow" />
            <div className="orbit-ring" />
            <div className="orbit-ring orbit-ring-2" />
            {/* Points en orbite */}
            {[
              { bg:'#C2117A', start:'0deg',   r:'170px', dur:'8s',  w:14 },
              { bg:'#00AEEF', start:'120deg', r:'170px', dur:'8s',  w:14 },
              { bg:'#F7941D', start:'240deg', r:'170px', dur:'8s',  w:14 },
              { bg:'#fff',    start:'60deg',  r:'115px', dur:'5s',  w:8  },
              { bg:'#C2117A', start:'195deg', r:'115px', dur:'5s',  w:8  },
            ].map((d, i) => (
              <div key={i} style={{
                position:'absolute', borderRadius:'50%', top:'50%', left:'50%',
                background:d.bg, width:d.w, height:d.w,
                marginTop:-(d.w/2), marginLeft:-(d.w/2),
                animation:`orbit ${d.dur} linear infinite`,
                ['--start' as string]:d.start, ['--r' as string]:d.r,
              }} />
            ))}
            {/* Vrai logo au centre avec filtre drop-shadow */}
            <div style={{ position:'relative', zIndex:1 }}>
              <Image
                src="/logo.png"
                alt="Carnaval Imprim"
                width={300}
                height={168}
                style={{
                  width:300, height:'auto',
                  filter:'drop-shadow(0 0 30px rgba(194,17,122,.5)) drop-shadow(0 0 60px rgba(0,174,239,.3))',
                }}
                priority
              />
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
              { accent:'#C2117A', iBg:'#FDE8E8', icon:'🖨️', title:'Impression Numérique', desc:'Petites séries, couleurs vives, rendu premium. Idéale pour les projets urgents et personnalisés.', tags:['Cartes de visite','Flyers','Brochures','Affiches'], tBg:'#FDE8E8', tC:'#C2117A' },
              { accent:'#00AEEF', iBg:'#E5F7FF', icon:'⚙️', title:'Impression Offset', desc:'Grandes séries, rendu photographique, coût unitaire réduit. Le choix des professionnels.', tags:['Magazines','Catalogues','Livres','Journaux'], tBg:'#E5F7FF', tC:'#0090D0' },
              { accent:'#F7941D', iBg:'#FEF3E2', icon:'🏔️', title:'Affichage & Grand Format', desc:'Bâches, banderoles, kakémonos, roll-up et panneaux publicitaires haute résolution.', tags:['Bâches','Kakémonos','Roll-up','Panneaux'], tBg:'#FEF3E2', tC:'#D4780A' },
              { accent:'#7B2FA5', iBg:'#F0E8F8', icon:'👕', title:'Impression Textile', desc:'T-shirts, casquettes, polos et sacs personnalisés pour vos équipes et événements.', tags:['T-shirts','Casquettes','Polos','Sacs'], tBg:'#F0E8F8', tC:'#7B2FA5' },
              { accent:'#1B1A1C', iBg:'#F0EEEC', icon:'✏️', title:'Conception Graphique', desc:'Nos designers créent votre identité visuelle et vos supports prêts à l\'impression.', tags:['Logo','Charte graphique','Mise en page','PAO'], tBg:'#F0EEEC', tC:'#1B1A1C' },
            ].map(s => (
              <div className="service-card" key={s.title} style={{ ['--accent' as string]:s.accent }}>
                <div className="service-icon" style={{ background:s.iBg }}>{s.icon}</div>
                <div className="service-title">{s.title}</div>
                <div className="service-desc">{s.desc}</div>
                <ul className="service-items">{s.tags.map(t => <li key={t} style={{ background:s.tBg, color:s.tC }}>{t}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUITS */}
      <section id="produits" style={{ background:'#fff' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', textAlign:'center' }}>
          <div className="section-label">Catalogue</div>
          <h2 className="section-title">Tous les supports<br/>pour votre communication</h2>
          <p className="section-sub" style={{ margin:'0 auto 48px' }}>15+ types de supports — du plus simple au plus élaboré.</p>
          <div className="produits-grid">
            {[['📇','Carte de visite'],['📄','Flyer & Prospectus'],['📰','Affiche A3→A0'],['📗','Brochure & Catalogue'],['🗓️','Calendrier'],['🏔️','Bâche & Banderole'],['🚩','Oriflamme'],['📋','Kakémono & Roll-up'],['👕','T-shirt & Polo'],['🧢','Casquette'],['☂️','Parapluie'],['🖊️','Stylo publicitaire'],['👜','Sac Cabas'],['🎒','Sac à dos'],['📒','Bloc-note & Agenda']].map(([e,n]) => (
              <div className="produit-item" key={n}><span className="produit-emoji">{e}</span><div className="produit-name">{n}</div></div>
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
          </div>
          <div className="steps">
            {[
              { n:'1', bg:'#C2117A', c:'#fff', t:'Contactez-nous', d:'Appelez, WhatsApp ou venez à Cocody-Blockhauss.' },
              { n:'2', bg:'#00AEEF', c:'#1B1A1C', t:'Devis gratuit', d:'Devis détaillé sous 24h. Prix transparent.' },
              { n:'3', bg:'#F7941D', c:'#1B1A1C', t:'Validation BAT', d:'Vous validez le bon à tirer avant impression.' },
              { n:'4', bg:'#fff', c:'#1B1A1C', t:'Livraison', d:'Sur place ou livraison. Qualité garantie.' },
            ].map(s => (
              <div className="step" key={s.n}>
                <div className="step-num" style={{ background:s.bg, color:s.c }}>{s.n}</div>
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
            <p className="section-sub">Nous sommes votre partenaire communication à Abidjan.</p>
            <a href="#contact" className="btn-primary" style={{ display:'inline-flex', marginTop:8 }}>Nous contacter →</a>
          </div>
          <div className="why-cards">
            {[
              { bg:'#FDE8E8', icon:'🎯', t:'Qualité professionnelle', d:'Matériaux certifiés, encres haute densité, contrôle avant livraison.' },
              { bg:'#E5F7FF', icon:'⚡', t:'Délais express', d:'Urgence ? Livraison en 48h. Standard : 3 à 5 jours ouvrables.' },
              { bg:'#FEF3E2', icon:'💰', t:'Prix compétitifs', d:'Devis gratuit, tarifs transparents, remises sur grandes quantités.' },
              { bg:'#F0E8F8', icon:'🤝', t:'Accompagnement complet', d:'De la conception à la livraison, nous gérons tout.' },
            ].map(w => (
              <div className="why-card" key={w.t}>
                <div className="why-card-icon" style={{ background:w.bg }}>{w.icon}</div>
                <div><div className="why-card-title">{w.t}</div><div className="why-card-desc">{w.d}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section style={{ background:'#F6F4F1' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div className="section-label">Ce que disent nos clients</div>
            <h2 className="section-title">Ils nous font confiance</h2>
          </div>
          <div className="testi-grid">
            {[
              { bg:'#C2117A', i:'K', name:'Koné Aminata', role:'Directrice Communication, ONG Espoir', text:'Nos brochures pour le ministère livrées en 3 jours, qualité irréprochable. Carnaval Imprim est devenu notre partenaire officiel.' },
              { bg:'#00AEEF', i:'D', name:'Diabaté Moussa', role:'Gérant, Global Business Solutions', text:'Du logo à nos kakémonos d\'événement — tout parfait. L\'équipe est réactive et le prix imbattable à Abidjan.' },
              { bg:'#F7941D', i:'T', name:'Traoré Fatoumata', role:'Responsable RH, NOVÉLIS', text:'500 t-shirts brodés en 5 jours pour notre événement corporate. Qualité top, délais respectés !' },
            ].map(t => (
              <div className="testi-card" key={t.name}>
                <div className="stars">★★★★★</div>
                <div className="testi-quote">&ldquo;</div>
                <div className="testi-text">{t.text}</div>
                <div className="testi-author">
                  <div className="testi-avatar" style={{ background:t.bg }}>{t.i}</div>
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
          {/* Logo dans le CTA */}
          <div style={{ marginBottom:24 }}>
            <Image src="/logo.png" alt="Carnaval Imprim" width={200} height={112}
              style={{ height:80, width:'auto', filter:'brightness(0) invert(1) drop-shadow(0 0 20px rgba(255,255,255,.3))' }} />
          </div>
          <h2 className="cta-title">Votre projet mérite<br/>la meilleure impression</h2>
          <p className="cta-sub">Devis gratuit sous 24h. Venez nous voir à Cocody-Blockhauss ou contactez-nous par téléphone et WhatsApp.</p>
          <div className="cta-actions">
            <a href="tel:+2250719141313" className="btn-primary">📞 07 19 14 13 13</a>
            <a href="tel:+2250758265312" className="cta-tel">📞 07 58 26 53 12</a>
            <a href="/login" className="cta-tel">🔐 Espace Équipe</a>
          </div>
          <div style={{ marginTop:36, padding:'18px 24px', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, display:'inline-block', textAlign:'left' as const }}>
            <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.5)', textTransform:'uppercase' as const, letterSpacing:1.5, marginBottom:8 }}>Notre adresse</div>
            <div style={{ fontSize:14, color:'#fff', fontWeight:600, lineHeight:1.8 }}>
              📍 Cocody – Blockhauss, Abidjan, Côte d&apos;Ivoire<br/>
              🏛️ SARL · Capital : 1 000 000 FCFA<br/>
              📋 RC : CI-ABJ-03-2024-B13-05735 · NCC : 240220333S
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div>
            <Image src="/logo.png" alt="Carnaval Imprim" width={160} height={90}
              style={{ height:60, width:'auto', marginBottom:12, filter:'brightness(0) invert(1)', opacity:.8 }} />
            <div style={{ fontSize:13, color:'rgba(255,255,255,.4)', marginBottom:16 }}>Votre imprimerie de confiance à Abidjan</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', lineHeight:1.8 }}>
              SARL au capital de 1 000 000 FCFA<br/>RC : CI-ABJ-03-2024-B13-05735<br/>NCC : 240220333S<br/>Régime : Réel simplifié · Centre : Cocody
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
            <div style={{ fontSize:13, color:'rgba(255,255,255,.4)', lineHeight:2.2 }}>
              📞 07 19 14 13 13<br/>📞 07 58 26 53 12<br/>📍 Cocody-Blockhauss, Abidjan
            </div>
            <div style={{ marginTop:20 }}>
              <a href="/login" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#C2117A', color:'#fff', padding:'10px 18px', borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:700 }}>🔐 Espace Équipe</a>
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
