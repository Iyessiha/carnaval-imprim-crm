export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { formatFCFA, calculerTotaux, formatDateFR } from '@/lib/utils'
import Link from 'next/link'

export const metadata = { title: 'Tableau de bord — Carnaval Imprim' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: factures },
    { data: devis },
    { data: productions },
    { data: clients },
    { data: charges },
    { data: entData },
    { data: caisse },
  ] = await Promise.all([
    supabase.from('factures').select('id, tva_applicable, remise, date, echeance, factures_lignes(qte,pu), paiements(montant)'),
    supabase.from('devis').select('id, statut, date'),
    supabase.from('productions').select('id, statut, caracteristique, format, quantite, date_livraison_prevue, clients(nom)'),
    supabase.from('clients').select('id, created_at'),
    supabase.from('charges_fixes').select('*').eq('actif', true).order('prochaine_echeance'),
    supabase.from('entreprise').select('nom, taux_tva').single(),
    supabase.from('caisse_operations').select('type, montant, date').gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)),
  ])

  const ent = entData as { nom: string; taux_tva: number } | null
  const tva = ent?.taux_tva ?? 18

  // KPIs financiers
  let caTotal = 0, caEncaisse = 0, impayes = 0
  const now = new Date().toISOString().slice(0,10)
  for (const f of (factures || [])) {
    const lignes = (f as { factures_lignes?: {qte:number;pu:number}[] }).factures_lignes || []
    const remise = (f as {remise:number}).remise || 0
    const tvaApp = (f as {tva_applicable:boolean}).tva_applicable
    const { ttc } = calculerTotaux(lignes, remise, tva, tvaApp)
    const paye = ((f as {paiements?:{montant:number}[]}).paiements || []).reduce((s,p) => s + p.montant, 0)
    caTotal += ttc
    caEncaisse += paye
    if (paye < ttc) impayes += (ttc - paye)
  }

  const devisData = devis || []
  const prodData = productions || []
  const chgsData = charges || []
  const caisseData = caisse || []

  // Caisse du mois
  const entreesMois = caisseData.filter((c:any)=>c.type==='entree').reduce((s:number,c:any)=>s+c.montant,0)
  const sortiesMois = caisseData.filter((c:any)=>c.type==='sortie').reduce((s:number,c:any)=>s+c.montant,0)

  // Productions en retard
  const retards = prodData.filter((p:any) => p.date_livraison_prevue && p.date_livraison_prevue < now && p.statut !== 'Livré')
  const enCours = prodData.filter((p:any) => p.statut === 'En production')

  // Charges dues ce mois
  const chargesAVenir = chgsData.filter((c:any) => {
    if (!c.prochaine_echeance) return true
    const d = new Date(c.prochaine_echeance)
    const now_ = new Date()
    return d.getFullYear() === now_.getFullYear() && d.getMonth() === now_.getMonth()
  })
  const totalChargesMois = chargesAVenir.reduce((s:number,c:any)=>s+c.montant,0)

  const Card = ({ title, value, sub, color, href }: { title:string; value:string; sub?:string; color:string; href?:string }) => (
    <div style={{ background:'#fff', border:'1px solid #E4DDD6', borderRadius:14, padding:20, borderLeft:`4px solid ${color}`, position:'relative' }}>
      {href && <Link href={href} style={{ position:'absolute', inset:0, borderRadius:14 }} />}
      <div style={{ fontSize:11, fontWeight:800, color:'#7A736C', textTransform:'uppercase' as const, letterSpacing:'.5px', marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:26, fontWeight:900, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'#7A736C', marginTop:4 }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>Tableau de bord</h1>
        <p style={{ color:'#7A736C', fontSize:13, margin:'4px 0 0' }}>
          {ent?.nom} · {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
        </p>
      </div>

      {/* ── KPIs financiers ── */}
      <div style={{ fontSize:11, fontWeight:800, color:'#C2117A', textTransform:'uppercase' as const, letterSpacing:1.5, marginBottom:10 }}>💼 Finance</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12, marginBottom:24 }}>
        <Card title="CA Total (facturé)" value={formatFCFA(caTotal)} sub={`${(factures||[]).length} factures`} color="#C2117A" href="/factures" />
        <Card title="CA Encaissé" value={formatFCFA(caEncaisse)} sub={`${Math.round(caTotal>0?caEncaisse/caTotal*100:0)}% du CA`} color="#2D7A4E" href="/factures" />
        <Card title="Impayés" value={formatFCFA(impayes)} sub="À relancer" color="#D14343" href="/relances" />
        <Card title="Devis en attente" value={String(devisData.filter((d:any)=>d.statut==='Envoyé').length)} sub={`${devisData.filter((d:any)=>d.statut==='Accepté').length} acceptés`} color="#2A5FA5" href="/devis" />
      </div>

      {/* ── KPIs caisse mois ── */}
      <div style={{ fontSize:11, fontWeight:800, color:'#2A5FA5', textTransform:'uppercase' as const, letterSpacing:1.5, marginBottom:10 }}>💵 Caisse du mois</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12, marginBottom:24 }}>
        <Card title="Entrées" value={formatFCFA(entreesMois)} sub="Ce mois" color="#2D7A4E" href="/caisse" />
        <Card title="Sorties" value={formatFCFA(sortiesMois)} sub="Ce mois" color="#D14343" href="/caisse" />
        <Card title="Solde caisse" value={formatFCFA(entreesMois-sortiesMois)} sub="Solde net" color={entreesMois-sortiesMois>=0?"#2D7A4E":"#D14343"} href="/caisse" />
        <Card title="Charges fixes / mois" value={formatFCFA(totalChargesMois)} sub={`${chgsData.length} charges actives`} color="#F39200" />
      </div>

      {/* ── Production ── */}
      <div style={{ fontSize:11, fontWeight:800, color:'#7B2FA5', textTransform:'uppercase' as const, letterSpacing:1.5, marginBottom:10 }}>🖨️ Production</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12, marginBottom:24 }}>
        <Card title="En cours" value={String(enCours.length)} sub="À finir" color="#2A5FA5" href="/production" />
        <Card title="En retard ⚠️" value={String(retards.length)} sub="Dépassé la date" color="#D14343" href="/production" />
        <Card title="Livrés ce mois" value={String(prodData.filter((p:any)=>p.statut==='Livré').length)} sub="" color="#2D7A4E" href="/livraisons" />
        <Card title="Clients actifs" value={String((clients||[]).length)} sub="" color="#7B2FA5" href="/clients" />
      </div>

      {/* ── Charges fixes ── */}
      {chgsData.length > 0 && (
        <div style={{ background:'#fff', border:'1px solid #E4DDD6', borderRadius:14, padding:20, marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:800 }}>📋 Charges fixes mensuelles</div>
            <Link href="/parametres" style={{ fontSize:12, color:'#C2117A', textDecoration:'none', fontWeight:600 }}>Gérer →</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {chgsData.map((c:any) => (
              <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'#F6F4F1', borderRadius:10 }}>
                <div>
                  <span style={{ fontSize:13, fontWeight:600 }}>{c.libelle}</span>
                  <span style={{ fontSize:11, color:'#7A736C', marginLeft:8 }}>{c.frequence}</span>
                </div>
                <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                  {c.prochaine_echeance && (
                    <span style={{ fontSize:11, color: c.prochaine_echeance < now ? '#D14343' : '#7A736C' }}>
                      Échéance : {formatDateFR(c.prochaine_echeance)}
                    </span>
                  )}
                  <span style={{ fontSize:13, fontWeight:700, color:'#C2117A' }}>{formatFCFA(c.montant)}</span>
                </div>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'flex-end', padding:'8px 12px 0', borderTop:'1px solid #E4DDD6', marginTop:4 }}>
              <span style={{ fontSize:13, fontWeight:800 }}>Total mensuel : {formatFCFA(chgsData.reduce((s:number,c:any)=>s+c.montant,0))}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Retards production ── */}
      {retards.length > 0 && (
        <div style={{ background:'#FFF5F5', border:'1px solid #F5AAAA', borderRadius:14, padding:20 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#D14343', marginBottom:12 }}>⚠️ Commandes en retard</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {retards.slice(0,5).map((p:any) => (
              <Link key={p.id} href="/production" style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'#fff', borderRadius:10, textDecoration:'none', color:'#1B1A1C', border:'1px solid #F5AAAA' }}>
                <div>
                  <span style={{ fontSize:13, fontWeight:600 }}>{p.clients?.nom||'—'}</span>
                  <span style={{ fontSize:12, color:'#7A736C', marginLeft:8 }}>{p.caracteristique.slice(0,40)}</span>
                </div>
                <span style={{ fontSize:12, color:'#D14343', fontWeight:700 }}>Prévu : {formatDateFR(p.date_livraison_prevue)}</span>
              </Link>
            ))}
            {retards.length > 5 && <div style={{ fontSize:12, color:'#D14343', textAlign:'center' as const }}>+ {retards.length-5} autres</div>}
          </div>
        </div>
      )}
    </div>
  )
}
